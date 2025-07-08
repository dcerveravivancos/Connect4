
import React from 'react';

// A simple, memoized component for a single circle to prevent unnecessary re-renders.
// Defined outside the main App component to maintain a stable reference.
const Circle: React.FC = React.memo(() => {
  return <div className="w-12 h-12 md:w-16 md:h-16 bg-gray-500 rounded-full shadow-lg hover:bg-gray-400 transition-colors duration-200"></div>;
});
Circle.displayName = 'Circle';

/**
 * The main App component.
 * Renders a 7x6 grid of circles centered on the page.
 */
const App: React.FC = () => {
  const ROWS = 6;
  const COLS = 7;
  const totalCircles = ROWS * COLS;

  return (
    <main className="bg-gray-800 min-h-screen w-full flex flex-col items-center justify-center p-4 sm:p-6 lg:p-8 font-sans">
      <div className="text-center mb-8">
        <h1 className="text-4xl sm:text-5xl font-bold text-white tracking-tight">
          Circle Grid
        </h1>
        <p className="text-gray-400 mt-2 text-lg">
          A responsive 7 by 6 grid of circles.
        </p>
      </div>

      <div className="bg-gray-900/50 p-4 sm:p-6 rounded-2xl shadow-2xl border border-gray-700 backdrop-blur-sm">
        <div className="grid grid-cols-7 gap-3 sm:gap-4">
          {Array.from({ length: totalCircles }).map((_, index) => (
            <Circle key={index} />
          ))}
        </div>
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
