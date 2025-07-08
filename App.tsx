import React, { useState, useCallback, useMemo } from 'react';

const ROWS = 6;
const COLS = 7;

type Player = 1 | 2;
type CellState = 0 | Player;
type BoardState = CellState[][];

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
  
  // Check for draw
  if (board.flat().every(cell => cell !== 0)) {
    return 'draw';
  }

  return null;
};

interface CircleProps {
  value: CellState;
}

const Circle: React.FC<CircleProps> = React.memo(({ value }) => {
  const baseClasses = "w-12 h-12 md:w-16 md:h-16 rounded-full shadow-inner transition-all duration-300";
  
  let colorClass = "bg-gray-700"; // Empty slot, looks like a hole
  
  if (value === 1) {
    colorClass = "bg-red-500 shadow-lg shadow-red-900/40";
  } else if (value === 2) {
    colorClass = "bg-yellow-400 shadow-lg shadow-yellow-900/40";
  }

  return <div className={`${baseClasses} ${colorClass}`}></div>;
});
Circle.displayName = 'Circle';

const App: React.FC = () => {
  const createInitialBoard = (): BoardState => Array.from({ length: ROWS }, () => Array(COLS).fill(0));
  
  const [board, setBoard] = useState<BoardState>(createInitialBoard());
  const [currentPlayer, setCurrentPlayer] = useState<Player>(1);
  const [winner, setWinner] = useState<Player | 'draw' | null>(null);

  const handleColumnClick = useCallback((colIndex: number) => {
    if (winner) return;

    for (let r = ROWS - 1; r >= 0; r--) {
      if (board[r][colIndex] === 0) {
        const newBoard = board.map(row => [...row]) as BoardState;
        newBoard[r][colIndex] = currentPlayer;
        setBoard(newBoard);

        const newWinner = checkWinner(newBoard);
        if (newWinner) {
          setWinner(newWinner);
        } else {
          setCurrentPlayer(currentPlayer === 1 ? 2 : 1);
        }
        return;
      }
    }
  }, [board, currentPlayer, winner]);

  const resetGame = () => {
    setBoard(createInitialBoard());
    setCurrentPlayer(1);
    setWinner(null);
  };
  
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
  
  return (
    <main className="bg-gray-800 min-h-screen w-full flex flex-col items-center justify-center p-4 sm:p-6 lg:p-8 font-sans">
      <div className="text-center mb-8">
        <h1 className="text-4xl sm:text-5xl font-bold text-white tracking-tight">
          Connect Four
        </h1>
        <div className="mt-4 h-10 flex items-center justify-center">
            {StatusMessage}
        </div>
      </div>

      <div className="bg-gray-900/50 p-4 sm:p-6 rounded-2xl shadow-2xl border border-gray-700 backdrop-blur-sm">
        <div className="grid grid-cols-7 gap-3 sm:gap-4">
          {board.flat().map((value, index) => {
            const colIndex = index % COLS;
            return (
              <div 
                key={index} 
                className="flex items-center justify-center cursor-pointer rounded-full group"
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
              className="px-8 py-3 bg-indigo-600 text-white font-semibold rounded-lg shadow-md hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-400 focus:ring-opacity-75 transition-all duration-200 transform hover:scale-105"
            >
              Play Again
            </button>
        )}
      </div>

      <footer className="mt-8 text-center">
          <p className="text-gray-500 text-sm">
              Built with React & Tailwind CSS.
          </p>
      </footer>
    </main>
  );
};

export default App;
