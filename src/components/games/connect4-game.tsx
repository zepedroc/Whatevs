'use client';

import { useEffect, useState } from 'react';

interface Connect4GameProps {
  rows?: number;
  columns?: number;
}

// Game constants
const DEFAULT_ROWS = 6;
const DEFAULT_COLUMNS = 7;
const PLAYER_1_COLOR = '#3b82f6'; // Blue
const PLAYER_2_COLOR = '#ef4444'; // Red
const EMPTY_COLOR = '#1f2937'; // Dark gray
const WINNING_LENGTH = 4;
const ANIMATION_DURATION = 500; // ms

type CellValue = 0 | 1 | 2; // 0: empty, 1: player 1, 2: player 2
type GameBoard = CellValue[][];
type WinningCells = [number, number][] | null; // Array of [row, col] coordinates

interface AnimatingPiece {
  col: number;
  player: 1 | 2;
  targetRow: number;
  currentPosition: number; // Position from top (0 = above board, rows = final position)
}

export default function Connect4Game({ rows = DEFAULT_ROWS, columns = DEFAULT_COLUMNS }: Connect4GameProps) {
  // Game state
  const [board, setBoard] = useState<GameBoard>(() =>
    Array(rows)
      .fill(0)
      .map(() => Array(columns).fill(0)),
  );
  const [currentPlayer, setCurrentPlayer] = useState<1 | 2>(1);
  const [winner, setWinner] = useState<0 | 1 | 2>(0);
  const [lastMove, setLastMove] = useState<[number, number] | null>(null);
  const [isGameOver, setIsGameOver] = useState(false);
  const [animatingPiece, setAnimatingPiece] = useState<AnimatingPiece | null>(null);
  const [isAnimating, setIsAnimating] = useState(false);
  const [winningCells, setWinningCells] = useState<WinningCells>(null);
  const [showWinMessage, setShowWinMessage] = useState(false);

  // Reset the game
  const resetGame = () => {
    setBoard(
      Array(rows)
        .fill(0)
        .map(() => Array(columns).fill(0)),
    );
    setCurrentPlayer(1);
    setWinner(0);
    setLastMove(null);
    setIsGameOver(false);
    setAnimatingPiece(null);
    setIsAnimating(false);
    setWinningCells(null);
    setShowWinMessage(false);
  };

  // Check if the board is full (draw)
  const checkDraw = (board: GameBoard) => {
    return board[0].every((cell) => cell !== 0);
  };

  // Find winning cells
  const findWinningCells = (board: GameBoard, row: number, col: number, player: 1 | 2): WinningCells => {
    const winningCells: [number, number][] = [];

    // Check horizontal
    let count = 0;
    let tempCells: [number, number][] = [];
    for (let c = 0; c < columns; c++) {
      if (board[row][c] === player) {
        count++;
        tempCells.push([row, c]);
      } else {
        count = 0;
        tempCells = [];
      }

      if (count >= WINNING_LENGTH) {
        return tempCells.slice(-WINNING_LENGTH);
      }
    }

    // Check vertical
    count = 0;
    tempCells = [];
    for (let r = 0; r < rows; r++) {
      if (board[r][col] === player) {
        count++;
        tempCells.push([r, col]);
      } else {
        count = 0;
        tempCells = [];
      }

      if (count >= WINNING_LENGTH) {
        return tempCells.slice(-WINNING_LENGTH);
      }
    }

    // Check diagonal (top-left to bottom-right)
    for (let r = 0; r <= rows - WINNING_LENGTH; r++) {
      for (let c = 0; c <= columns - WINNING_LENGTH; c++) {
        let isWinning = true;
        tempCells = [];

        for (let i = 0; i < WINNING_LENGTH; i++) {
          if (board[r + i][c + i] !== player) {
            isWinning = false;
            break;
          }
          tempCells.push([r + i, c + i]);
        }

        if (isWinning) {
          return tempCells;
        }
      }
    }

    // Check diagonal (top-right to bottom-left)
    for (let r = 0; r <= rows - WINNING_LENGTH; r++) {
      for (let c = columns - 1; c >= WINNING_LENGTH - 1; c--) {
        let isWinning = true;
        tempCells = [];

        for (let i = 0; i < WINNING_LENGTH; i++) {
          if (board[r + i][c - i] !== player) {
            isWinning = false;
            break;
          }
          tempCells.push([r + i, c - i]);
        }

        if (isWinning) {
          return tempCells;
        }
      }
    }

    return null;
  };

  // Check for a win
  const checkWin = (board: GameBoard, row: number, col: number, player: 1 | 2): boolean => {
    const cells = findWinningCells(board, row, col, player);
    if (cells) {
      setWinningCells(cells);
      return true;
    }
    return false;
  };

  // Show win message with delay
  useEffect(() => {
    if (winner > 0) {
      const timer = setTimeout(() => {
        setShowWinMessage(true);
      }, 500); // Delay to allow the winning cells animation to be noticed first

      return () => clearTimeout(timer);
    }
  }, [winner]);

  // Handle animation
  useEffect(() => {
    if (!animatingPiece || !isAnimating) return;

    // If the piece has reached its target position
    if (animatingPiece.currentPosition > animatingPiece.targetRow) {
      // Update the board with the final position
      const newBoard = [...board.map((row) => [...row])];
      newBoard[animatingPiece.targetRow][animatingPiece.col] = animatingPiece.player;
      setBoard(newBoard);
      setLastMove([animatingPiece.targetRow, animatingPiece.col]);
      setAnimatingPiece(null);
      setIsAnimating(false);

      // Check for win
      if (checkWin(newBoard, animatingPiece.targetRow, animatingPiece.col, animatingPiece.player)) {
        setWinner(animatingPiece.player);
        setIsGameOver(true);
        return;
      }

      // Check for draw
      if (checkDraw(newBoard)) {
        setIsGameOver(true);
        return;
      }

      // Switch player
      setCurrentPlayer(animatingPiece.player === 1 ? 2 : 1);
      return;
    }

    // Continue the animation
    const dropSpeed = ANIMATION_DURATION / (animatingPiece.targetRow + 2); // +2 to account for starting above the board
    const timer = setTimeout(() => {
      setAnimatingPiece({
        ...animatingPiece,
        currentPosition: animatingPiece.currentPosition + 1,
      });
    }, dropSpeed);

    return () => clearTimeout(timer);
  }, [animatingPiece, isAnimating, board, checkWin]);

  // Make a move
  const makeMove = (column: number) => {
    if (isGameOver || isAnimating) return;

    // Find the lowest empty row in the selected column
    let targetRow = -1;

    for (let r = rows - 1; r >= 0; r--) {
      if (board[r][column] === 0) {
        targetRow = r;
        break;
      }
    }

    // If column is full, do nothing
    if (targetRow === -1) return;

    // Start animation
    setAnimatingPiece({
      col: column,
      player: currentPlayer,
      targetRow: targetRow,
      currentPosition: 0, // Start above the board
    });
    setIsAnimating(true);
  };

  // Check if a cell is part of the winning combination
  const isWinningCell = (row: number, col: number): boolean => {
    if (!winningCells) return false;
    return winningCells.some(([r, c]: [number, number]) => r === row && c === col);
  };

  // Render the game board
  return (
    <div className="flex flex-col items-center">
      <div className="mb-4 text-xl font-bold">
        {isGameOver ? (
          winner > 0 ? (
            <div className="text-center">
              Player {winner} wins!
              <div className="mt-2">
                <button
                  onClick={resetGame}
                  className="bg-green-600 hover:bg-green-700 text-white font-medium py-2 px-4 rounded transition-colors"
                >
                  Play Again
                </button>
              </div>
            </div>
          ) : (
            <div className="text-center">
              Draw!
              <div className="mt-2">
                <button
                  onClick={resetGame}
                  className="bg-green-600 hover:bg-green-700 text-white font-medium py-2 px-4 rounded transition-colors"
                >
                  Play Again
                </button>
              </div>
            </div>
          )
        ) : (
          <div>Player {currentPlayer}&apos;s turn</div>
        )}
      </div>

      <div className="bg-blue-900 p-4 rounded-lg">
        {/* Column selectors */}
        <div className="flex mb-2">
          {Array(columns)
            .fill(0)
            .map((_, col) => (
              <button
                key={`selector-${col}`}
                onClick={() => makeMove(col)}
                disabled={isGameOver || isAnimating || board[0][col] !== 0}
                className="flex-1 h-8 mx-1 rounded-t-lg bg-blue-700 hover:bg-blue-600 disabled:bg-gray-600 disabled:cursor-not-allowed transition-colors"
                aria-label={`Drop in column ${col + 1}`}
              />
            ))}
        </div>

        {/* Game board */}
        <div className="bg-blue-800 p-2 rounded-lg relative">
          {/* Static board and pieces */}
          {board.map((row, rowIndex) => (
            <div key={`row-${rowIndex}`} className="flex">
              {row.map((cell, colIndex) => (
                <div
                  key={`cell-${rowIndex}-${colIndex}`}
                  className="w-12 h-12 m-1 rounded-full flex items-center justify-center overflow-hidden"
                  style={{
                    backgroundColor: EMPTY_COLOR,
                  }}
                >
                  {/* Static pieces */}
                  {cell !== 0 && (
                    <div
                      className="w-full h-full rounded-full"
                      style={{
                        backgroundColor: cell === 1 ? PLAYER_1_COLOR : PLAYER_2_COLOR,
                        transform: isWinningCell(rowIndex, colIndex)
                          ? 'scale(1.1) rotate(0deg)'
                          : lastMove && lastMove[0] === rowIndex && lastMove[1] === colIndex
                            ? 'scale(1.05)'
                            : 'scale(1)',
                        boxShadow: isWinningCell(rowIndex, colIndex) ? '0 0 10px 3px rgba(255, 255, 255, 0.7)' : 'none',
                        animation: isWinningCell(rowIndex, colIndex) ? 'pulse 1.5s infinite' : 'none',
                        transition: 'transform 0.3s, box-shadow 0.3s, background-color 0.3s',
                      }}
                    />
                  )}
                </div>
              ))}
            </div>
          ))}

          {/* Animating piece */}
          {animatingPiece && (
            <div
              className="absolute rounded-full"
              style={{
                width: '48px', // Match the cell size
                height: '48px',
                backgroundColor: animatingPiece.player === 1 ? PLAYER_1_COLOR : PLAYER_2_COLOR,
                left: `calc(${animatingPiece.col} * 56px + 10px)`, // 56px per cell (48px + 8px margin)
                top: `calc(${animatingPiece.currentPosition} * 56px + 10px)`, // Position based on current animation state
                transition: 'top 0.1s ease-in',
                zIndex: 10,
              }}
            />
          )}

          {/* Win message overlay */}
          {showWinMessage && winner > 0 && (
            <div
              className="absolute inset-0 flex items-center justify-center"
              style={{
                backgroundColor: 'rgba(0, 0, 0, 0.7)',
                zIndex: 20,
                animation: 'fadeIn 0.5s forwards',
              }}
            >
              <div className="text-center p-4 rounded-lg bg-gradient-to-r from-blue-600 to-purple-600 transform scale-110 rotate-3 shadow-xl">
                <div className="text-4xl font-bold text-white mb-2 animate-bounce">PLAYER {winner} WINS!</div>
                <div className="text-xl text-yellow-300 font-semibold">{winner === 1 ? 'Blue' : 'Red'} connected four!</div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* CSS Animations */}
      <style>{`
        @keyframes pulse {
          0% {
            transform: scale(1.1);
          }
          50% {
            transform: scale(1.2);
          }
          100% {
            transform: scale(1.1);
          }
        }

        @keyframes fadeIn {
          from {
            opacity: 0;
          }
          to {
            opacity: 1;
          }
        }
      `}</style>
    </div>
  );
}
