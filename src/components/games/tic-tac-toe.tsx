'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';

type Cell = 'X' | 'O' | null;
type Board = Cell[][];

const EMPTY_BOARD: Board = [
  [null, null, null],
  [null, null, null],
  [null, null, null],
];

const MODELS = [
  { id: 'llama-3.3-70b-versatile', label: 'Llama 3.3 70B' },
  { id: 'openai/gpt-oss-120b', label: 'openai/gpt-oss-120b' },
  { id: 'openai/gpt-oss-20b', label: 'openai/gpt-oss-20b' },
];

function deepClone(board: Board): Board {
  return board.map((row) => row.slice()) as Board;
}

function checkWinner(board: Board): 'X' | 'O' | 'draw' | null {
  const lines = [
    [board[0][0], board[0][1], board[0][2]],
    [board[1][0], board[1][1], board[1][2]],
    [board[2][0], board[2][1], board[2][2]],
    [board[0][0], board[1][0], board[2][0]],
    [board[0][1], board[1][1], board[2][1]],
    [board[0][2], board[1][2], board[2][2]],
    [board[0][0], board[1][1], board[2][2]],
    [board[0][2], board[1][1], board[2][0]],
  ];
  for (const line of lines) {
    if (line[0] && line[0] === line[1] && line[1] === line[2]) return line[0];
  }
  const hasEmpty = board.flat().some((c) => c === null);
  return hasEmpty ? null : 'draw';
}

function currentTurn(board: Board): 'X' | 'O' {
  const x = board.flat().filter((c) => c === 'X').length;
  const o = board.flat().filter((c) => c === 'O').length;
  return x === o ? 'X' : 'O';
}

export default function TicTacToe() {
  const [board, setBoard] = useState<Board>(deepClone(EMPTY_BOARD));
  const [model, setModel] = useState<string>(MODELS[0].id);
  const [humanPlaysAs, setHumanPlaysAs] = useState<'X' | 'O'>('X');
  const [status, setStatus] = useState<'playing' | 'win' | 'loss' | 'draw'>('playing');
  const [isRequesting, setIsRequesting] = useState(false);

  const aiPlaysAs = useMemo<'X' | 'O'>(() => (humanPlaysAs === 'X' ? 'O' : 'X'), [humanPlaysAs]);

  const winner = useMemo(() => checkWinner(board), [board]);

  useEffect(() => {
    if (winner === 'X' || winner === 'O') {
      setStatus(winner === humanPlaysAs ? 'win' : 'loss');
    } else if (winner === 'draw') {
      setStatus('draw');
    } else {
      setStatus('playing');
    }
  }, [winner, humanPlaysAs]);

  const reset = useCallback(
    (firstPlayer: 'human' | 'ai' = 'human') => {
      const fresh = deepClone(EMPTY_BOARD);
      setBoard(fresh);
      setStatus('playing');
      if (firstPlayer === 'ai') {
        // Trigger AI move immediately
        void requestAiMove(fresh, aiPlaysAs, model).then((move) => {
          if (!move) return;
          setBoard((prev) => {
            if (prev[move.row][move.col] !== null) return prev;
            const next = deepClone(prev);
            next[move.row][move.col] = aiPlaysAs;
            return next;
          });
        });
      }
    },
    [aiPlaysAs, model],
  );

  const onCellClick = useCallback(
    (r: number, c: number) => {
      if (isRequesting) return;
      if (status !== 'playing') return;
      if (board[r][c] !== null) return;
      const turn = currentTurn(board);
      if (turn !== humanPlaysAs) return;

      const next = deepClone(board);
      next[r][c] = humanPlaysAs;
      setBoard(next);

      // After human move, if game continues and it's AI's turn, request move
      const w = checkWinner(next);
      if (w === null && currentTurn(next) === aiPlaysAs) {
        void (async () => {
          const move = await requestAiMove(next, aiPlaysAs, model);
          if (!move) return;
          setBoard((prev) => {
            if (prev[move.row][move.col] !== null) return prev;
            const updated = deepClone(prev);
            updated[move.row][move.col] = aiPlaysAs;
            return updated;
          });
        })();
      }
    },
    [board, humanPlaysAs, aiPlaysAs, isRequesting, status, model],
  );

  async function requestAiMove(b: Board, ai: 'X' | 'O', m: string): Promise<{ row: number; col: number } | null> {
    try {
      setIsRequesting(true);
      const res = await fetch('/api/games/tic-tac-toe', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ board: b, aiPlaysAs: ai, model: m }),
      });
      if (!res.ok) return null;
      const data = (await res.json()) as { row?: number; col?: number };
      if (typeof data.row === 'number' && typeof data.col === 'number') {
        return { row: data.row, col: data.col };
      }
      return null;
    } catch {
      return null;
    } finally {
      setIsRequesting(false);
    }
  }

  const turn = currentTurn(board);
  const info = useMemo(() => {
    if (status === 'win') return 'You win!';
    if (status === 'loss') return 'AI wins!';
    if (status === 'draw') return 'Draw!';
    return turn === humanPlaysAs ? 'Your move' : 'AI is thinking...';
  }, [status, turn, humanPlaysAs]);

  return (
    <div className="flex flex-col gap-4 items-center">
      <div className="flex gap-3 items-center">
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

        <label className="text-sm ml-4">First move</label>
        <select
          className="rounded-md border px-2 py-1 bg-background"
          value={humanPlaysAs}
          onChange={(e) => {
            const val = e.target.value === 'X' ? 'X' : 'O';
            setHumanPlaysAs(val);
            reset(val === 'X' ? 'human' : 'ai');
          }}
        >
          <option value="X">Human (X)</option>
          <option value="O">AI (X)</option>
        </select>

        <button
          className="ml-4 rounded-md border px-3 py-1 hover:bg-muted disabled:opacity-50"
          onClick={() => reset(humanPlaysAs === 'X' ? 'human' : 'ai')}
          disabled={isRequesting}
        >
          Reset
        </button>
      </div>

      <div className="grid grid-cols-3 gap-2 select-none">
        {board.map((row, rIdx) =>
          row.map((cell, cIdx) => (
            <button
              key={`${rIdx}-${cIdx}`}
              className="w-24 h-24 flex items-center justify-center text-4xl font-bold bg-gray-100 dark:bg-gray-800 rounded-md hover:bg-gray-200 dark:hover:bg-gray-700 disabled:opacity-60 cursor-pointer"
              onClick={() => onCellClick(rIdx, cIdx)}
              disabled={isRequesting || status !== 'playing'}
            >
              {cell ?? ''}
            </button>
          )),
        )}
      </div>

      <div className="text-sm text-muted-foreground">{info}</div>
    </div>
  );
}
