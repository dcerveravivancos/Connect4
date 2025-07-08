import React, { useState, useCallback, useMemo, useEffect } from 'react';
import { initializeApp } from 'firebase/app';
import { getFirestore, doc, onSnapshot, runTransaction, Firestore } from 'firebase/firestore';

// IMPORTANT: Replace this with your own Firebase project configuration!
// 1. Go to the Firebase console (https://console.firebase.google.com/).
// 2. Create a new project.
// 3. Go to Project Settings -> General tab.
// 4. Under "Your apps", click the web icon (</>) to create a new web app.
// 5. Copy the firebaseConfig object and paste it here.
const firebaseConfig = {
  apiKey: "AIzaSyB_mvjpTqySaATckpEo9hesJqKxNbZQ",
  authDomain: "connect-4-8c79c.firebaseapp.com",
  projectId: "connect-4-8c79c",
  storageBucket: "connect-4-8c79c.firebasestorage.app",
  messagingSenderId: "56332553259",
  appId: "1:56332553259:web:cc001d3cf62a300f7e7ae",
  measurementId: "G-TNcG7kL599"
};


// Initialize Firebase and Firestore
let db: Firestore | undefined;
const isFirebaseConfigured = firebaseConfig.apiKey && firebaseConfig.apiKey !== "YOUR_API_KEY";

if (isFirebaseConfigured) {
    try {
        const app = initializeApp(firebaseConfig);
        db = getFirestore(app);
    } catch (error) {
        console.error("Firebase initialization failed:", error);
    }
}


const ROWS = 6;
const COLS = 7;

type Player = 1 | 2;
type CellState = 0 | Player;
// Firestore doesn't support nested arrays. Use a map of arrays instead.
type BoardState = { [row: number]: CellState[] };

interface GameState {
  board: BoardState;
  currentPlayer: Player;
  winner: Player | 'draw' | null;
}

const createInitialGameState = (): GameState => {
  const board: BoardState = {};
  for (let r = 0; r < ROWS; r++) {
    board[r] = Array(COLS).fill(0);
  }
  return {
    board,
    currentPlayer: 1,
    winner: null,
  };
};

// Helper function to check for a winner
const checkWinner = (board: BoardState): Player | 'draw' | null => {
  // Check horizontal
  for (let r = 0; r < ROWS; r++) {
    for (let c = 0; c <= COLS - 4; c++) {
      const player = board[r][c];
      if (player && player === board[r][c + 1] && player === board[r][c + 2] && player === board[r][c + 3]) {
        return player;
      }
    }
  }

  // Check vertical
  for (let c = 0; c < COLS; c++) {
    for (let r = 0; r <= ROWS - 4; r++) {
      const player = board[r][c];
      if (player && player === board[r + 1][c] && player === board[r + 2][c] && player === board[r + 3][c]) {
        return player;
      }
    }
  }

  // Check diagonal (down-right)
  for (let r = 0; r <= ROWS - 4; r++) {
    for (let c = 0; c <= COLS - 4; c++) {
      const player = board[r][c];
      if (player && player === board[r + 1][c + 1] && player === board[r + 2][c + 2] && player === board[r + 3][c + 3]) {
        return player;
      }
    }
  }

  // Check diagonal (up-right)
  for (let r = 3; r < ROWS; r++) {
    for (let c = 0; c <= COLS - 4; c++) {
      const player = board[r][c];
      if (player && player === board[r - 1][c + 1] && player === board[r - 2][c + 2] && player === board[r - 3][c + 3]) {
        return player;
      }
    }
  }
  
  if (Object.values(board).flat().every(cell => cell !== 0)) {
    return 'draw';
  }

  return null;
};

interface CircleProps {
  value: CellState;
}

const Circle: React.FC<CircleProps> = React.memo(({ value }) => {
  const baseClasses = "w-12 h-12 md:w-16 md:h-16 rounded-full shadow-inner transition-all duration-300";
  let colorClass = "bg-gray-700";
  
  if (value === 1) {
    colorClass = "bg-red-500 shadow-lg shadow-red-900/40";
  } else if (value === 2) {
    colorClass = "bg-yellow-400 shadow-lg shadow-yellow-900/40";
  }

  return <div className={`${baseClasses} ${colorClass}`}></div>;
});
Circle.displayName = 'Circle';


const App: React.FC = () => {
  const [gameState, setGameState] = useState<GameState>(createInitialGameState());
  const [connectionStatus, setConnectionStatus] = useState<'connecting' | 'live' | 'error'>('connecting');
  const [isUpdating, setIsUpdating] = useState(false);

  useEffect(() => {
    if (!db) {
        setConnectionStatus('error');
        return;
    }
    const gameDocRef = doc(db, 'games', 'connect4-live');

    const unsubscribe = onSnapshot(gameDocRef, (docSnap) => {
        if (docSnap.exists()) {
            setGameState(docSnap.data() as GameState);
        } else {
            // Document doesn't exist, create it with the initial state
            runTransaction(db, async (transaction) => {
                transaction.set(gameDocRef, createInitialGameState());
            });
        }
        setConnectionStatus('live');
    }, (error) => {
        console.error("Firestore connection error:", error);
        setConnectionStatus('error');
    });

    return () => unsubscribe();
  }, []);

  const handleColumnClick = useCallback(async (colIndex: number) => {
    if (!db || isUpdating || gameState.winner) return;

    setIsUpdating(true);
    const gameDocRef = doc(db, 'games', 'connect4-live');
    try {
        await runTransaction(db, async (transaction) => {
            const docSnap = await transaction.get(gameDocRef);
            if (!docSnap.exists()) {
                throw "Document does not exist!";
            }
            
            const currentState = docSnap.data() as GameState;
            
            if (currentState.winner) {
                return; // Game already won
            }

            const board = currentState.board;
            // Find the lowest empty spot in the column
            let targetRow = -1;
            for (let r = ROWS - 1; r >= 0; r--) {
                if (board[r][colIndex] === 0) {
                    targetRow = r;
                    break;
                }
            }
            
            if (targetRow > -1) {
                // Create a deep copy to modify, as Firestore state is immutable
                const newBoard = JSON.parse(JSON.stringify(board));
                newBoard[targetRow][colIndex] = currentState.currentPlayer;
                
                const newWinner = checkWinner(newBoard);
                const nextPlayer = currentState.currentPlayer === 1 ? 2 : 1;

                transaction.update(gameDocRef, { 
                    board: newBoard, 
                    winner: newWinner,
                    currentPlayer: nextPlayer
                });
            } else {
                console.log("Column is full");
            }
        });
    } catch (error) {
        console.error("Transaction failed: ", error);
    } finally {
        setIsUpdating(false);
    }
  }, [isUpdating, gameState.winner]);

  const resetGame = async () => {
    if (!db || isUpdating) return;
    setIsUpdating(true);
    const gameDocRef = doc(db, 'games', 'connect4-live');
    try {
        await runTransaction(db, async (transaction) => {
           transaction.set(gameDocRef, createInitialGameState());
        });
    } catch (error) {
        console.error("Reset failed: ", error);
    } finally {
        setIsUpdating(false);
    }
  };
  
  const { board, currentPlayer, winner } = gameState;

  const StatusMessage = useMemo(() => {
    if (winner) {
      if (winner === 'draw') {
        return <h2 className="text-3xl font-bold text-gray-300">It's a Draw!</h2>;
      }
      const winnerColor = winner === 1 ? 'text-red-500' : 'text-yellow-400';
      return <h2 className={`text-3xl font-bold ${winnerColor}`}>Player {winner} Wins!</h2>;
    }
    const playerColor = currentPlayer === 1 ? 'text-red-500' : 'text-yellow-400';
    return <h2 className={`text-3xl font-bold ${playerColor}`}>Player {currentPlayer}'s Turn</h2>;
  }, [winner, currentPlayer]);

  const ConnectionStatusIndicator = () => {
      let color, text;
      switch (connectionStatus) {
          case 'live':
              color = 'text-green-400';
              text = '● Live';
              break;
          case 'error':
              color = 'text-red-500';
              text = 'Connection Error';
              break;
          case 'connecting':
          default:
              color = 'text-yellow-400';
              text = 'Connecting...';
      }
      return <div className={`h-6 text-sm font-semibold ${color}`}>{text}</div>
  }

  if (!isFirebaseConfigured) {
    return (
      <main className="bg-gray-800 min-h-screen w-full flex flex-col items-center justify-center p-4 text-white text-center font-sans">
        <div className="bg-gray-900/50 p-8 rounded-2xl shadow-2xl border border-red-500/50 backdrop-blur-sm max-w-2xl">
            <h1 className="text-3xl font-bold text-red-500 mb-4">Configuration Required</h1>
            <p className="text-lg mb-4 text-gray-300">
                Your Firebase project has not been configured.
            </p>
            <p className="text-gray-400 mb-6">
                Please open the <code className="bg-gray-700 text-yellow-300 p-1 rounded mx-1">src/App.tsx</code> file and replace the placeholder values in the 
                <code className="bg-gray-700 text-yellow-300 p-1 rounded mx-1">firebaseConfig</code> object with your actual project keys from the Firebase Console.
            </p>
            <p className="text-gray-500 text-sm">You need to create a project, add a Web App, and then copy the generated config object.</p>
        </div>
      </main>
    )
  }
  
  return (
    <main className="bg-gray-800 min-h-screen w-full flex flex-col items-center justify-center p-4 sm:p-6 lg:p-8 font-sans">
      <div className="text-center mb-4">
        <ConnectionStatusIndicator />
        <h1 className="text-4xl sm:text-5xl font-bold text-white tracking-tight">
          Connect Four
        </h1>
        <div className="mt-4 h-10 flex items-center justify-center">
            {StatusMessage}
        </div>
      </div>

      <div className="bg-gray-900/50 p-4 sm:p-6 rounded-2xl shadow-2xl border border-gray-700 backdrop-blur-sm">
        <div className="grid grid-cols-7 gap-3 sm:gap-4">
          {Object.values(board).flat().map((value, index) => {
            const colIndex = index % COLS;
            return (
              <div 
                key={index} 
                className={`flex items-center justify-center rounded-full group ${isUpdating || winner ? 'cursor-not-allowed' : 'cursor-pointer'}`}
                onClick={() => handleColumnClick(colIndex)}
                aria-label={`Drop token in column ${colIndex + 1}`}
              >
                <div className="group-hover:bg-gray-600/50 rounded-full p-1 transition-colors duration-200">
                    <Circle value={value} /> 
                </div>
              </div>
            );
          })}
        </div>
      </div>

      <div className="mt-8 h-14 flex items-center justify-center">
        {winner && (
            <button
              onClick={resetGame}
              disabled={isUpdating}
              className="px-8 py-3 bg-indigo-600 text-white font-semibold rounded-lg shadow-md hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-400 focus:ring-opacity-75 transition-all duration-200 transform hover:scale-105 disabled:bg-indigo-400 disabled:cursor-not-allowed"
            >
              Play Again
            </button>
        )}
      </div>

      <footer className="mt-8 text-center">
          <p className="text-gray-500 text-sm">
              Built with React, Tailwind CSS, and Firebase.
          </p>
      </footer>
    </main>
  );
};

export default App;