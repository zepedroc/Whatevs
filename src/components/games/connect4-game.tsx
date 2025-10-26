'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';

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
// Drop animation tuning
const DROP_BASE_DURATION_MS = 450; // minimum duration regardless of distance
const DROP_PER_ROW_MS = 120; // additional ms per row traveled
const DROP_EASING = 'cubic-bezier(0.16, 1, 0.3, 1)';

// Visual layout constants to keep sizes aligned across animations/overlays
const CELL_DIAMETER_PX = 48; // circle size
const CELL_MARGIN_PX = 4; // m-1
const ROW_GAP_X_PX = 2; // gap-[2px] between cells horizontally
const CELL_STEP_X_PX = CELL_DIAMETER_PX + 2 * CELL_MARGIN_PX + ROW_GAP_X_PX; // 48 + 8 + 2 = 58
const CELL_STEP_Y_PX = CELL_DIAMETER_PX + 2 * CELL_MARGIN_PX; // 48 + 8 = 56
const BOARD_INNER_OFFSET_PX = 2; // matches container padding p-0.5 (2px)
const HOVER_LEFT_TWEAK_PX = -4; // small alignment nudge for overlay
const HOVER_TOP_TWEAK_PX = -5; // small alignment nudge for overlay

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
  const [hoveredColumn, setHoveredColumn] = useState<number | null>(null);

  // AI controls
  const MODELS = useMemo(
    () => [
      { id: 'llama-3.3-70b-versatile', label: 'Llama 3.3 70B' },
      { id: 'openai/gpt-oss-120b', label: 'openai/gpt-oss-120b' },
      { id: 'openai/gpt-oss-20b', label: 'openai/gpt-oss-20b' },
    ],
    [],
  );
  const [model, setModel] = useState<string>(MODELS[0].id);
  const [humanPlaysAs, setHumanPlaysAs] = useState<1 | 2>(1);
  const aiPlaysAs = useMemo<1 | 2>(() => (humanPlaysAs === 1 ? 2 : 1), [humanPlaysAs]);
  const [isRequesting, setIsRequesting] = useState(false);
  const [mode, setMode] = useState<'human-ai' | 'ai-ai'>('human-ai');
  const [modelP1, setModelP1] = useState<string>(MODELS[0].id);
  const [modelP2, setModelP2] = useState<string>(MODELS[1]?.id ?? MODELS[0].id);
  const [isAiAiRunning, setIsAiAiRunning] = useState(false);

  const requestAiMove = useCallback(
    async (ai: 1 | 2, m: string): Promise<number | null> => {
      try {
        setIsRequesting(true);
        const res = await fetch('/api/games/connect4', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ board, aiPlaysAs: ai, model: m }),
        });
        if (!res.ok) return null;
        const data = (await res.json()) as { col?: number };
        if (typeof data.col === 'number') return data.col;
        return null;
      } catch {
        return null;
      } finally {
        setIsRequesting(false);
      }
    },
    [board],
  );

  // Reset the game
  const resetGame = useCallback(() => {
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
  }, [rows, columns]);

  const hardReset = useCallback(
    (firstPlayer: 'human' | 'ai' = 'human') => {
      resetGame();
      if (mode === 'human-ai') {
        if (firstPlayer === 'ai') {
          void requestAiMove(aiPlaysAs, model).then((col) => {
            if (col == null) return;
            makeMove(col);
          });
        }
      }
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [aiPlaysAs, model, rows, columns, mode],
  );

  const resetAiVsAi = useCallback(() => {
    resetGame();
    setCurrentPlayer(1); // always start with P1
  }, [resetGame]);

  useEffect(() => {
    if (mode === 'ai-ai') {
      resetAiVsAi();
      setIsAiAiRunning(false);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [mode]);

  // Check if the board is full (draw)
  const checkDraw = (board: GameBoard) => {
    return board[0].every((cell) => cell !== 0);
  };

  const findWinningCells = useCallback(
    (board: GameBoard, row: number, col: number, player: 1 | 2): WinningCells => {
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
    },
    [rows, columns],
  );

  // Check for a win
  const checkWin = useCallback(
    (board: GameBoard, row: number, col: number, player: 1 | 2): boolean => {
      const cells = findWinningCells(board, row, col, player);
      if (cells) {
        setWinningCells(cells);
        return true;
      }
      return false;
    },
    [findWinningCells],
  );

  // Show win message with delay
  useEffect(() => {
    if (winner > 0) {
      const timer = setTimeout(() => {
        setShowWinMessage(true);
      }, 500); // Delay to allow the winning cells animation to be noticed first

      return () => clearTimeout(timer);
    }
  }, [winner]);

  // Smooth drop animation: trigger a single CSS transition from above-board to target row
  useEffect(() => {
    if (!animatingPiece || !isAnimating) return;

    // If we haven't yet moved to the target row, schedule it on the next frame
    if (animatingPiece.currentPosition !== animatingPiece.targetRow) {
      const raf1 = requestAnimationFrame(() => {
        const raf2 = requestAnimationFrame(() => {
          setAnimatingPiece((prev) => (prev ? { ...prev, currentPosition: prev.targetRow } : prev));
        });
        return () => cancelAnimationFrame(raf2);
      });
      return () => cancelAnimationFrame(raf1);
    }
  }, [animatingPiece, isAnimating]);

  // Finalize the move when the transition completes
  const handleDropTransitionEnd = useCallback(() => {
    if (!animatingPiece || !isAnimating) return;

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
  }, [animatingPiece, isAnimating, board, checkWin]);

  // Make a move
  const makeMove = useCallback(
    (column: number) => {
      if (isGameOver || isAnimating || isRequesting) return;

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
        currentPosition: -1, // Start slightly above the board for smoother drop-in
      });
      setIsAnimating(true);
    },
    [isGameOver, isAnimating, isRequesting, rows, board, currentPlayer],
  );

  // Compute legal columns
  const legalColumns = useMemo(() => {
    const cols: number[] = [];
    for (let c = 0; c < columns; c += 1) {
      if (board[0][c] === 0) cols.push(c);
    }
    return cols;
  }, [board, columns]);

  // Request AI move when appropriate
  useEffect(() => {
    if (isGameOver || isAnimating || isRequesting) return;
    if (legalColumns.length === 0) return;
    if (mode === 'human-ai') {
      if (currentPlayer !== aiPlaysAs) return;
      void (async () => {
        const col = await requestAiMove(aiPlaysAs, model);
        if (col == null) return;
        makeMove(col);
      })();
    } else {
      if (!isAiAiRunning) return;
      // ai-ai mode: prevent same model matchup
      if (modelP1 === modelP2) return;
      const ai = currentPlayer; // 1 or 2
      const m = ai === 1 ? modelP1 : modelP2;
      void (async () => {
        const col = await requestAiMove(ai, m);
        if (col == null) return;
        makeMove(col);
      })();
    }
  }, [
    currentPlayer,
    aiPlaysAs,
    isAnimating,
    isGameOver,
    isRequesting,
    legalColumns,
    makeMove,
    requestAiMove,
    mode,
    model,
    modelP1,
    modelP2,
    isAiAiRunning,
  ]);

  // moved above to avoid use-before-define

  // Check if a cell is part of the winning combination
  const isWinningCell = (row: number, col: number): boolean => {
    if (!winningCells) return false;
    return winningCells.some(([r, c]: [number, number]) => r === row && c === col);
  };

  // Render the game board
  return (
    <div className="flex flex-col items-center">
      {/* Controls */}
      {/* Mode selector */}
      <div className="mb-4 flex items-center gap-3">
        <label className="text-sm">Mode</label>
        <select
          className="rounded-md border px-2 py-1 bg-background"
          value={mode}
          onChange={(e) => setMode(e.target.value === 'ai-ai' ? 'ai-ai' : 'human-ai')}
        >
          <option value="human-ai">Human vs AI</option>
          <option value="ai-ai">AI vs AI</option>
        </select>
      </div>

      {/* Model/First move selectors */}
      <div className="mb-4 flex items-center gap-3">
        {mode === 'human-ai' ? (
          <>
            <label className="text-sm">Model</label>
            <select
              className="rounded-md border px-2 py-1 bg-background"
              value={model}
              onChange={(e) => setModel(e.target.value)}
            >
              {MODELS.map((m) => (
                <option key={m.id} value={m.id}>
                  {m.label}
                </option>
              ))}
            </select>

            <label className="text-sm">First move</label>
            <select
              className="rounded-md border px-2 py-1 bg-background"
              value={humanPlaysAs}
              onChange={(e) => {
                const v = e.target.value === '1' ? 1 : 2;
                setHumanPlaysAs(v);
                hardReset(v === 1 ? 'human' : 'ai');
              }}
            >
              <option value="1">Human (P1)</option>
              <option value="2">AI (P1)</option>
            </select>
          </>
        ) : (
          <>
            <label className="text-sm">Model (P1)</label>
            <select
              className="rounded-md border px-2 py-1 bg-background"
              value={modelP1}
              onChange={(e) => {
                const next = e.target.value;
                setModelP1(next);
                if (next === modelP2) {
                  const alt = MODELS.find((m) => m.id !== next)?.id ?? modelP2;
                  setModelP2(alt);
                }
              }}
            >
              {MODELS.filter((m) => m.id !== modelP2).map((m) => (
                <option key={m.id} value={m.id}>
                  {m.label}
                </option>
              ))}
            </select>

            <label className="text-sm">Model (P2)</label>
            <select
              className="rounded-md border px-2 py-1 bg-background"
              value={modelP2}
              onChange={(e) => {
                const next = e.target.value;
                setModelP2(next);
                if (next === modelP1) {
                  const alt = MODELS.find((m) => m.id !== next)?.id ?? modelP1;
                  setModelP1(alt);
                }
              }}
            >
              {MODELS.filter((m) => m.id !== modelP1).map((m) => (
                <option key={m.id} value={m.id}>
                  {m.label}
                </option>
              ))}
            </select>
          </>
        )}
      </div>

      {/* Action buttons */}
      <div className="mb-4 flex items-center gap-3">
        <button
          className="rounded-md border px-3 py-1 hover:bg-muted disabled:opacity-50"
          onClick={() => {
            resetAiVsAi();
            setIsAiAiRunning(true);
          }}
          disabled={isRequesting || isAnimating || isAiAiRunning}
        >
          Start
        </button>
        <button
          className="rounded-md border px-3 py-1 hover:bg-muted disabled:opacity-50"
          onClick={() => setIsAiAiRunning(false)}
          disabled={!isAiAiRunning}
        >
          Stop
        </button>
        <button
          className="rounded-md border px-3 py-1 hover:bg-muted disabled:opacity-50"
          onClick={() =>
            mode === 'human-ai' ? hardReset(humanPlaysAs === 1 ? 'human' : 'ai') : (setIsAiAiRunning(false), resetAiVsAi())
          }
          disabled={isRequesting || isAnimating}
        >
          Reset
        </button>
      </div>
      <div className="mb-4 text-xl font-bold">
        {isGameOver ? (
          <div className="text-center">{winner > 0 ? `Player ${winner} wins!` : 'Draw!'}</div>
        ) : (
          <div>Player {currentPlayer}&apos;s turn</div>
        )}
      </div>

      <div className="rounded-xl p-4 shadow-2xl ring-1 ring-white/10 bg-gradient-to-b from-slate-900 to-slate-800">
        {/* Column selectors */}
        <div className="flex mb-2">
          {Array(columns)
            .fill(0)
            .map((_, col) => (
              <button
                key={`selector-${col}`}
                onClick={() => makeMove(col)}
                onMouseEnter={() => setHoveredColumn(col)}
                onMouseLeave={() => setHoveredColumn(null)}
                onFocus={() => setHoveredColumn(col)}
                onBlur={() => setHoveredColumn(null)}
                disabled={isGameOver || isAnimating || board[0][col] !== 0}
                className="flex-1 h-8 mx-1 rounded-t-lg cursor-pointer transition-colors bg-blue-700/70 hover:bg-blue-500/80 disabled:bg-gray-600 disabled:cursor-not-allowed ring-1 ring-white/10"
                aria-label={`Drop in column ${col + 1}`}
              />
            ))}
        </div>

        {/* Game board */}
        <div
          className="relative rounded-xl p-0.5 shadow-inner ring-1 ring-white/10 bg-gradient-to-b from-blue-900 to-indigo-900"
          onMouseLeave={() => setHoveredColumn(null)}
        >
          {/* Column hover highlight */}
          {hoveredColumn !== null && (
            <div
              className="absolute inset-y-0 pointer-events-none"
              style={{
                left: BOARD_INNER_OFFSET_PX + CELL_MARGIN_PX + hoveredColumn * CELL_STEP_X_PX + HOVER_LEFT_TWEAK_PX,
                width: CELL_DIAMETER_PX + 2 * CELL_MARGIN_PX,
                top: BOARD_INNER_OFFSET_PX + CELL_MARGIN_PX + HOVER_TOP_TWEAK_PX,
                height: rows * CELL_STEP_Y_PX,
                background: 'linear-gradient(180deg, rgba(255,255,255,0.10), rgba(255,255,255,0.02))',
                boxShadow: 'inset 0 0 0 2px rgba(255,255,255,0.06)',
                borderRadius: '12px',
                zIndex: 1,
              }}
            />
          )}
          {/* Static board and pieces */}
          {board.map((row, rowIndex) => (
            <div key={`row-${rowIndex}`} className="flex gap-[2px]">
              {row.map((cell, colIndex) => (
                <div
                  key={`cell-${rowIndex}-${colIndex}`}
                  className="w-12 h-12 m-1 rounded-full flex items-center justify-center overflow-hidden"
                  style={{
                    backgroundColor: EMPTY_COLOR,
                    boxShadow: 'inset 0 8px 14px rgba(0,0,0,0.55), inset 0 -6px 10px rgba(255,255,255,0.06)',
                  }}
                >
                  {/* Static pieces */}
                  {cell !== 0 && (
                    <div
                      className="w-full h-full rounded-full"
                      style={{
                        backgroundColor: cell === 1 ? PLAYER_1_COLOR : PLAYER_2_COLOR,
                        backgroundImage:
                          'radial-gradient(circle at 30% 30%, rgba(255,255,255,0.35), rgba(255,255,255,0) 45%), radial-gradient(circle at 70% 70%, rgba(0,0,0,0.35), rgba(0,0,0,0) 60%)',
                        transform: isWinningCell(rowIndex, colIndex)
                          ? 'scale(1.1) rotate(0deg)'
                          : lastMove && lastMove[0] === rowIndex && lastMove[1] === colIndex
                            ? 'scale(1.05)'
                            : 'scale(1)',
                        // Outer glow for winning discs
                        boxShadow: isWinningCell(rowIndex, colIndex)
                          ? '0 0 12px 4px rgba(255,255,255,0.75), 0 6px 14px rgba(0,0,0,0.35)'
                          : '0 6px 14px rgba(0,0,0,0.4), inset 0 -8px 12px rgba(0,0,0,0.35)',
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
                width: `${CELL_DIAMETER_PX}px`, // Match the cell size
                height: `${CELL_DIAMETER_PX}px`,
                backgroundColor: animatingPiece.player === 1 ? PLAYER_1_COLOR : PLAYER_2_COLOR,
                backgroundImage:
                  'radial-gradient(circle at 30% 30%, rgba(255,255,255,0.35), rgba(255,255,255,0) 45%), radial-gradient(circle at 70% 70%, rgba(0,0,0,0.35), rgba(0,0,0,0) 60%)',
                left: BOARD_INNER_OFFSET_PX + CELL_MARGIN_PX + animatingPiece.col * CELL_STEP_X_PX, // step per cell (diameter + margins + gap)
                top: BOARD_INNER_OFFSET_PX + CELL_MARGIN_PX + animatingPiece.currentPosition * CELL_STEP_Y_PX, // Position based on current animation state
                transition: `top ${DROP_BASE_DURATION_MS + DROP_PER_ROW_MS * (animatingPiece.targetRow + 1)}ms ${DROP_EASING}`,
                boxShadow: '0 6px 14px rgba(0,0,0,0.45), inset 0 -8px 12px rgba(0,0,0,0.35)',
                zIndex: 10,
              }}
              onTransitionEnd={handleDropTransitionEnd}
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
              <div className="text-center p-4 rounded-lg bg-linear-to-r from-blue-600 to-purple-600 transform scale-110 rotate-3 shadow-xl">
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
      <div className="mt-3 text-sm text-muted-foreground">
        {isRequesting || (currentPlayer === aiPlaysAs && !isAnimating && !isGameOver) ? 'AI is thinking...' : ''}
      </div>
    </div>
  );
}
