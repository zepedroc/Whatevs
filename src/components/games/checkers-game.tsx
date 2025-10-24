'use client';

import { useCallback, useEffect, useState } from 'react';

type Cell = 0 | 'b' | 'w' | 'B' | 'W';
type Board = Cell[][]; // 10 x 10
type Side = 'b' | 'w';

type Coord = { r: number; c: number };

type Move = {
  from: Coord;
  path: Coord[];
  captures: Coord[];
  promotes?: boolean;
};

const MODELS = [
  { id: 'llama-3.3-70b-versatile', label: 'Llama 3.3 70B' },
  { id: 'openai/gpt-oss-120b', label: 'openai/gpt-oss-120b' },
  { id: 'openai/gpt-oss-20b', label: 'openai/gpt-oss-20b' },
];

function initialBoard(): Board {
  const b: Board = Array.from({ length: 10 }, () => Array<Cell>(10).fill(0));
  // Place white on rows 0..3 (top) on dark squares, black on rows 6..9 (bottom)
  for (let r = 0; r < 10; r += 1) {
    for (let c = 0; c < 10; c += 1) {
      const dark = (r + c) % 2 === 1;
      if (!dark) continue;
      if (r <= 3) b[r][c] = 'w';
      else if (r >= 6) b[r][c] = 'b';
    }
  }
  return b;
}

function cellColor(cell: Cell): Side | null {
  if (cell === 'b' || cell === 'B') return 'b';
  if (cell === 'w' || cell === 'W') return 'w';
  return null;
}

function isKing(cell: Cell): boolean {
  return cell === 'B' || cell === 'W';
}

function forwardDir(side: Side): 1 | -1 {
  return side === 'w' ? 1 : -1;
}

function promoteIfNeeded(cell: Cell, r: number): Cell {
  if (cell === 'b' && r === 0) return 'B';
  if (cell === 'w' && r === 9) return 'W';
  return cell;
}

function cloneBoard(board: Board): Board {
  return board.map((row) => row.slice()) as Board;
}

export default function CheckersGame() {
  const [board, setBoard] = useState<Board>(() => initialBoard());
  const [turn, setTurn] = useState<Side>('b');
  const [mode, setMode] = useState<'human-ai' | 'ai-ai'>('human-ai');
  const [model, setModel] = useState<string>(MODELS[0].id);
  const [modelP1, setModelP1] = useState<string>(MODELS[0].id); // black
  const [modelP2, setModelP2] = useState<string>(MODELS[1]?.id ?? MODELS[0].id); // white
  const [isAiAiRunning, setIsAiAiRunning] = useState(false);
  const [isRequesting, setIsRequesting] = useState(false);
  const [gameOver, setGameOver] = useState(false);
  const [resultText, setResultText] = useState<string>('');
  const [winner, setWinner] = useState<Side | null>(null);
  const [turnStartAt, setTurnStartAt] = useState<number | null>(null);
  const [timeStats, setTimeStats] = useState<{
    b: { totalMs: number; count: number };
    w: { totalMs: number; count: number };
  }>({ b: { totalMs: 0, count: 0 }, w: { totalMs: 0, count: 0 } });

  // Selection
  const [selected, setSelected] = useState<Coord | null>(null);
  const [legalMoves, setLegalMoves] = useState<Move[]>([]);

  // Generate legal moves on demand (client mirrors server for UX; to keep scope, rely on server for correctness)
  // For now, we request from server when selection changes or on turn if AI.

  const reset = useCallback(() => {
    setBoard(initialBoard());
    setTurn('b');
    setSelected(null);
    setLegalMoves([]);
    setGameOver(false);
    setResultText('');
    setWinner(null);
    setTimeStats({ b: { totalMs: 0, count: 0 }, w: { totalMs: 0, count: 0 } });
    setTurnStartAt(Date.now());
  }, []);

  const requestAiMove = useCallback(async (b: Board, side: Side, m: string): Promise<Move | null> => {
    try {
      setIsRequesting(true);
      const res = await fetch('/api/games/checkers', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ board: b, aiPlaysAs: side, model: m }),
      });
      if (!res.ok) return null;
      const data = (await res.json()) as Move;
      if (data && data.from && Array.isArray(data.path)) return data;
      return null;
    } catch {
      return null;
    } finally {
      setIsRequesting(false);
    }
  }, []);

  // --- Client-side move generation (mirrors server for UX) ---
  function isInside(r: number, c: number): boolean {
    return r >= 0 && r < 10 && c >= 0 && c < 10;
  }

  function generateManQuiet(board: Board, at: Coord, side: Side): Move[] {
    const dr = forwardDir(side);
    const deltas = [
      { r: dr, c: -1 },
      { r: dr, c: 1 },
    ];
    const moves: Move[] = [];
    for (const d of deltas) {
      const nr = at.r + d.r;
      const nc = at.c + d.c;
      if (!isInside(nr, nc)) continue;
      if (board[nr][nc] !== 0) continue;
      const promotes = (side === 'b' && nr === 0) || (side === 'w' && nr === 9);
      moves.push({ from: at, path: [{ r: nr, c: nc }], captures: [], promotes });
    }
    return moves;
  }

  function generateKingQuiet(board: Board, at: Coord): Move[] {
    const moves: Move[] = [];
    const dirs = [
      { r: 1, c: 1 },
      { r: 1, c: -1 },
      { r: -1, c: 1 },
      { r: -1, c: -1 },
    ];
    for (const d of dirs) {
      let nr = at.r + d.r;
      let nc = at.c + d.c;
      while (isInside(nr, nc) && board[nr][nc] === 0) {
        moves.push({ from: at, path: [{ r: nr, c: nc }], captures: [], promotes: false });
        nr += d.r;
        nc += d.c;
      }
    }
    return moves;
  }

  function generateManCaptures(board: Board, at: Coord, side: Side): Move[] {
    const opp: Side = side === 'b' ? 'w' : 'b';
    const dirs = [
      { r: 1, c: 1 },
      { r: 1, c: -1 },
      { r: -1, c: 1 },
      { r: -1, c: -1 },
    ];
    const results: Move[] = [];
    function dfs(
      boardNow: Board,
      pos: Coord,
      capturedSet: Set<string>,
      path: Coord[],
      captures: Coord[],
      wasPromoted: boolean,
    ) {
      let extended = false;
      for (const d of dirs) {
        const mr = pos.r + d.r;
        const mc = pos.c + d.c;
        const lr = pos.r + 2 * d.r;
        const lc = pos.c + 2 * d.c;
        if (!isInside(lr, lc)) continue;
        const mid = boardNow[mr][mc];
        const land = boardNow[lr][lc];
        if (land !== 0) continue;
        if (cellColor(mid) !== opp) continue;
        const midKey = `${mr},${mc}`;
        if (capturedSet.has(midKey)) continue;

        const after = cloneBoard(boardNow);
        const moving = after[pos.r][pos.c];
        after[pos.r][pos.c] = 0;
        after[mr][mc] = 0;
        let placed: Cell = moving;
        const promoteNow = (moving === 'b' && lr === 0) || (moving === 'w' && lr === 9);
        if (promoteNow) placed = promoteIfNeeded(moving, lr);
        after[lr][lc] = placed;

        const nextCaptured = new Set(capturedSet);
        nextCaptured.add(midKey);
        const nextPath = path.concat([{ r: lr, c: lc }]);
        const nextCaps = captures.concat([{ r: mr, c: mc }]);

        if ((moving === 'b' || moving === 'w') && promoteNow) {
          // Continue as king
          const cont = generateKingCaptures(after, { r: lr, c: lc }, side, nextCaptured);
          if (cont.length === 0) {
            results.push({ from: at, path: nextPath, captures: nextCaps, promotes: true });
          } else {
            for (const m of cont)
              results.push({
                from: at,
                path: nextPath.concat(m.path),
                captures: nextCaps.concat(m.captures),
                promotes: true,
              });
          }
        } else {
          dfs(after, { r: lr, c: lc }, nextCaptured, nextPath, nextCaps, wasPromoted || promoteNow);
        }
        extended = true;
      }
      if (!extended && captures.length > 0) {
        const startCell = board[at.r][at.c];
        const endR = path[path.length - 1].r;
        const promotes = (startCell === 'b' && endR === 0) || (startCell === 'w' && endR === 9) || wasPromoted;
        results.push({ from: at, path: [...path], captures: [...captures], promotes });
      }
    }
    dfs(board, at, new Set(), [], [], false);
    return results;
  }

  function generateKingCaptures(board: Board, at: Coord, side: Side, preCaptured?: Set<string>): Move[] {
    const opp: Side = side === 'b' ? 'w' : 'b';
    const dirs = [
      { r: 1, c: 1 },
      { r: 1, c: -1 },
      { r: -1, c: 1 },
      { r: -1, c: -1 },
    ];
    const results: Move[] = [];
    const capturedSet = preCaptured ?? new Set<string>();
    function dfs(boardNow: Board, pos: Coord, path: Coord[], captures: Coord[], used: Set<string>) {
      let extended = false;
      for (const d of dirs) {
        let mr = pos.r + d.r;
        let mc = pos.c + d.c;
        while (isInside(mr, mc) && boardNow[mr][mc] === 0) {
          mr += d.r;
          mc += d.c;
        }
        if (!isInside(mr, mc)) continue;
        const mid = boardNow[mr][mc];
        if (cellColor(mid) !== opp) continue;
        const midKey = `${mr},${mc}`;
        if (used.has(midKey) || capturedSet.has(midKey)) continue;
        let lr = mr + d.r;
        let lc = mc + d.c;
        while (isInside(lr, lc) && boardNow[lr][lc] === 0) {
          const after = cloneBoard(boardNow);
          const moving = after[pos.r][pos.c];
          after[pos.r][pos.c] = 0;
          after[mr][mc] = 0;
          after[lr][lc] = moving;
          const nextPath = path.concat([{ r: lr, c: lc }]);
          const nextCaps = captures.concat([{ r: mr, c: mc }]);
          const nextUsed = new Set(used);
          nextUsed.add(midKey);
          dfs(after, { r: lr, c: lc }, nextPath, nextCaps, nextUsed);
          extended = true;
          lr += d.r;
          lc += d.c;
        }
      }
      if (!extended && captures.length > 0) {
        results.push({ from: at, path: [...path], captures: [...captures], promotes: false });
      }
    }
    dfs(board, at, [], [], new Set());
    return results;
  }

  function generateAllMoves(board: Board, side: Side): Move[] {
    const captureMoves: Move[] = [];
    const quietMoves: Move[] = [];
    for (let r = 0; r < 10; r += 1) {
      for (let c = 0; c < 10; c += 1) {
        const cell = board[r][c];
        if (cellColor(cell) !== side) continue;
        const pieceCaptures = isKing(cell)
          ? generateKingCaptures(board, { r, c }, side)
          : generateManCaptures(board, { r, c }, side);
        captureMoves.push(...pieceCaptures);
      }
    }
    if (captureMoves.length > 0) {
      const maxCaps = Math.max(...captureMoves.map((m) => m.captures.length));
      return captureMoves.filter((m) => m.captures.length === maxCaps);
    }
    for (let r = 0; r < 10; r += 1) {
      for (let c = 0; c < 10; c += 1) {
        const cell = board[r][c];
        if (cellColor(cell) !== side) continue;
        const pieceMoves = isKing(cell) ? generateKingQuiet(board, { r, c }) : generateManQuiet(board, { r, c }, side);
        quietMoves.push(...pieceMoves);
      }
    }
    return quietMoves;
  }

  const INITIAL_PIECES = 20;

  function getModelLabel(id: string): string {
    const found = MODELS.find((m) => m.id === id);
    return found ? found.label : id;
  }

  const pieceCounts = (() => {
    let bMen = 0;
    let bKings = 0;
    let wMen = 0;
    let wKings = 0;
    for (let r = 0; r < 10; r += 1) {
      for (let c = 0; c < 10; c += 1) {
        const cell = board[r][c];
        if (cell === 'b') bMen += 1;
        else if (cell === 'B') bKings += 1;
        else if (cell === 'w') wMen += 1;
        else if (cell === 'W') wKings += 1;
      }
    }
    return { bMen, bKings, wMen, wKings };
  })();

  const recordDurationFor = useCallback((side: Side, startedAtMs: number | null) => {
    if (startedAtMs == null) return;
    const dt = Date.now() - startedAtMs;
    setTimeStats((prev) => ({
      ...prev,
      [side]: { totalMs: prev[side].totalMs + dt, count: prev[side].count + 1 },
    }));
  }, []);

  useEffect(() => {
    if (!gameOver) setTurnStartAt(Date.now());
  }, [turn, gameOver]);

  const applyMove = useCallback((b: Board, move: Move): Board => {
    const next = cloneBoard(b);
    const moving = next[move.from.r][move.from.c];
    next[move.from.r][move.from.c] = 0;
    for (const cap of move.captures) {
      next[cap.r][cap.c] = 0;
    }
    const last = move.path[move.path.length - 1];
    let place: Cell = moving;
    if (place === 'b' || place === 'w') {
      place = promoteIfNeeded(place, last.r);
    }
    next[last.r][last.c] = place;
    return next;
  }, []);

  const onSquareClick = useCallback(
    async (r: number, c: number) => {
      if (mode !== 'human-ai') return; // only interactive in human vs ai
      if (isRequesting) return;
      if (gameOver) return;
      const cell = board[r][c];
      const color = cellColor(cell);

      if (!selected) {
        if (cell === 0 || color !== turn) return;
        const all = generateAllMoves(board, turn);
        const forPiece = all.filter((m) => m.from.r === r && m.from.c === c);
        if (forPiece.length === 0) return; // no legal moves for this piece
        setSelected({ r, c });
        setLegalMoves(forPiece);
      } else {
        // Clicking same piece deselects
        if (selected.r === r && selected.c === c) {
          setSelected(null);
          setLegalMoves([]);
          return;
        }
        // If clicking a legal destination, apply that move
        const chosen = legalMoves.find((m) => m.path[m.path.length - 1].r === r && m.path[m.path.length - 1].c === c);
        if (!chosen) {
          // If clicked another own piece, switch selection
          if (cell !== 0 && color === turn) {
            const all = generateAllMoves(board, turn);
            const forPiece = all.filter((m) => m.from.r === r && m.from.c === c);
            if (forPiece.length === 0) return;
            setSelected({ r, c });
            setLegalMoves(forPiece);
          }
          return;
        }
        const nb = applyMove(board, chosen);
        setBoard(nb);
        setSelected(null);
        setLegalMoves([]);
        // record human thinking time
        recordDurationFor(turn, turnStartAt);
        const nextSide: Side = turn === 'b' ? 'w' : 'b';
        setTurn(nextSide);
        setTurnStartAt(Date.now());
        // Check for game over before AI reply
        const nextHasMoves = generateAllMoves(nb, nextSide).length > 0;
        if (!nextHasMoves) {
          setGameOver(true);
          setResultText(`${turn === 'b' ? 'Black' : 'White'} wins`);
          setWinner(turn);
          setIsAiAiRunning(false);
          return;
        }
        // Trigger AI reply
        const aiStart = Date.now();
        const ai = await requestAiMove(nb, nextSide, model);
        if (ai) {
          const nb2 = applyMove(nb, ai);
          // record AI duration
          recordDurationFor(nextSide, aiStart);
          setBoard(nb2);
          // After AI move, check if human has moves; if not, AI wins
          const humanHasMoves = generateAllMoves(nb2, turn).length > 0;
          if (!humanHasMoves) {
            setGameOver(true);
            setResultText(`${nextSide === 'b' ? 'Black' : 'White'} wins`);
            setWinner(nextSide);
            setIsAiAiRunning(false);
            return;
          }
          setTurn(turn); // back to human side
          setTurnStartAt(Date.now());
        }
      }
    },
    [board, turn, isRequesting, selected, legalMoves, model, mode, gameOver, turnStartAt, recordDurationFor],
  );

  // AI vs AI loop
  useEffect(() => {
    if (mode !== 'ai-ai') return;
    if (!isAiAiRunning) return;
    if (isRequesting) return;
    void (async () => {
      // If current side has no moves, game over
      const legalNow = generateAllMoves(board, turn);
      if (legalNow.length === 0) {
        const winner: Side = turn === 'b' ? 'w' : 'b';
        setGameOver(true);
        setResultText(`${winner === 'b' ? 'Black' : 'White'} wins`);
        setWinner(winner);
        setIsAiAiRunning(false);
        return;
      }
      const m = turn === 'b' ? modelP1 : modelP2;
      if (modelP1 === modelP2) return; // avoid same-model matchup
      const start = Date.now();
      const mv = await requestAiMove(board, turn, m);
      if (!mv) return;
      // record AI duration for side to move
      recordDurationFor(turn, start);
      const nb = applyMove(board, mv);
      setBoard(nb);
      setTurn((t) => (t === 'b' ? 'w' : 'b'));
    })();
  }, [mode, isAiAiRunning, isRequesting, turn, modelP1, modelP2, board, requestAiMove, applyMove, recordDurationFor]);

  // Retro styling helpers
  const squareClasses = (r: number, c: number) => {
    const dark = (r + c) % 2 === 1;
    return dark
      ? 'bg-gradient-to-br from-amber-900 to-amber-800 shadow-inner ring-1 ring-black/40'
      : 'bg-gradient-to-br from-amber-700 to-amber-600 shadow-inner ring-1 ring-black/30';
  };

  const pieceStyle = (cell: Cell): React.CSSProperties => {
    const isDark = cell === 'b' || cell === 'B';
    const base = isDark ? '#111827' : '#e5e7eb';
    const gloss = isDark ? 'rgba(255,255,255,0.20)' : 'rgba(255,255,255,0.60)';
    const shade = isDark ? 'rgba(0,0,0,0.6)' : 'rgba(0,0,0,0.25)';
    return {
      background: `radial-gradient(circle at 30% 30%, ${gloss}, rgba(255,255,255,0) 45%), ${base}`,
      boxShadow: `inset 0 -10px 14px ${shade}, 0 6px 14px rgba(0,0,0,0.45)`,
    };
  };

  const isSelectable = (r: number, c: number) => {
    const cell = board[r][c];
    return cell !== 0 && cellColor(cell) === turn && mode === 'human-ai' && !gameOver;
  };

  return (
    <div className="flex flex-col items-center gap-4">
      {/* Mode selector */}
      <div className="mb-2 flex items-center gap-3">
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

      {/* Model/controls */}
      <div className="mb-2 flex items-center gap-3 flex-wrap justify-center">
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
          </>
        ) : (
          <>
            <label className="text-sm">Model (Black)</label>
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

            <label className="text-sm">Model (White)</label>
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

      {/* Actions */}
      <div className="mb-2 flex items-center gap-3">
        {mode === 'ai-ai' && (
          <>
            <button
              className="rounded-md border px-3 py-1 hover:bg-muted disabled:opacity-50"
              onClick={() => {
                reset();
                setIsAiAiRunning(true);
              }}
              disabled={isRequesting || isAiAiRunning}
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
          </>
        )}
        <button
          className="rounded-md border px-3 py-1 hover:bg-muted disabled:opacity-50"
          onClick={() => {
            setIsAiAiRunning(false);
            reset();
          }}
          disabled={isRequesting}
        >
          Reset
        </button>
      </div>

      <div className="text-xl font-bold">{turn === 'b' ? 'Black to move' : 'White to move'}</div>

      {/* HUD: piece counts and losses */}
      <div className="flex items-center gap-4 text-sm">
        {(() => {
          const bTotal = pieceCounts.bMen + pieceCounts.bKings;
          const wTotal = pieceCounts.wMen + pieceCounts.wKings;
          const bLost = INITIAL_PIECES - bTotal;
          const wLost = INITIAL_PIECES - wTotal;
          const bAvg = timeStats.b.count > 0 ? timeStats.b.totalMs / timeStats.b.count : 0;
          const wAvg = timeStats.w.count > 0 ? timeStats.w.totalMs / timeStats.w.count : 0;
          const fmt = (ms: number) => (ms <= 0 ? '--' : `${(ms / 1000).toFixed(1)}s avg`);
          return (
            <>
              <div
                className={`rounded-lg px-3 py-2 ring-1 ${turn === 'b' ? 'ring-yellow-400/50' : 'ring-white/10'} bg-zinc-900/50`}
              >
                <div className="font-semibold">Black</div>
                <div className="mt-1 flex gap-3 text-xs text-zinc-200">
                  <span>{bTotal} left</span>
                  <span>{pieceCounts.bKings} kings</span>
                  <span>{bLost} lost</span>
                  <span>{fmt(bAvg)}</span>
                </div>
              </div>
              <div
                className={`rounded-lg px-3 py-2 ring-1 ${turn === 'w' ? 'ring-yellow-400/50' : 'ring-white/10'} bg-zinc-900/50`}
              >
                <div className="font-semibold">White</div>
                <div className="mt-1 flex gap-3 text-xs text-zinc-200">
                  <span>{wTotal} left</span>
                  <span>{pieceCounts.wKings} kings</span>
                  <span>{wLost} lost</span>
                  <span>{fmt(wAvg)}</span>
                </div>
              </div>
            </>
          );
        })()}
      </div>

      {/* Board */}
      <div
        className="relative rounded-xl p-2 ring-1 ring-white/10 bg-gradient-to-b from-zinc-900 to-zinc-800"
        style={{
          boxShadow: 'inset 0 0 0 2px rgba(255,255,255,0.06), 0 12px 24px rgba(0,0,0,0.45)',
          backgroundImage:
            'linear-gradient(0deg, rgba(255,255,255,0.03), rgba(255,255,255,0)), repeating-linear-gradient(0deg, rgba(255,255,255,0.04), rgba(255,255,255,0.04) 1px, transparent 1px, transparent 3px)',
        }}
      >
        {gameOver && (
          <div className="absolute inset-0 z-10 flex items-center justify-center">
            <div
              className={`rounded-2xl px-6 py-5 shadow-2xl backdrop-blur-md text-center ring-1 ${
                winner === 'b' ? 'ring-amber-300/40' : 'ring-sky-300/40'
              } bg-gradient-to-b from-black/80 to-zinc-900/80`}
            >
              <div className="text-2xl font-extrabold tracking-tight text-white drop-shadow">{resultText}</div>
              <div className="mt-4 flex justify-center">
                <button
                  className="rounded-md border border-white/20 bg-white/5 px-4 py-1.5 text-white hover:bg-white/10 focus:outline-none focus:ring-2 focus:ring-yellow-400/60"
                  onClick={() => {
                    setIsAiAiRunning(false);
                    reset();
                  }}
                >
                  New game
                </button>
              </div>
            </div>
          </div>
        )}
        <div className="grid grid-cols-10 gap-1 select-none">
          {board.map((row, rIdx) =>
            row.map((cell, cIdx) => {
              const selectable = isSelectable(rIdx, cIdx);
              const isSel = selected && selected.r === rIdx && selected.c === cIdx;
              const isDest = legalMoves.some(
                (m) => m.path[m.path.length - 1].r === rIdx && m.path[m.path.length - 1].c === cIdx,
              );
              return (
                <button
                  key={`${rIdx}-${cIdx}`}
                  className={`w-12 h-12 rounded-sm ${squareClasses(rIdx, cIdx)} relative focus:outline-none focus:ring-2 focus:ring-yellow-400/70 ${isDest ? 'ring-2 ring-green-400/70' : ''}`}
                  onClick={() => onSquareClick(rIdx, cIdx)}
                  aria-label={`Square ${rIdx},${cIdx}`}
                >
                  {cell !== 0 && (
                    <div
                      className={`absolute inset-1 rounded-full transition-transform ${
                        selectable ? 'ring-2 ring-yellow-400/70' : ''
                      } ${isSel ? 'scale-105' : ''}`}
                      style={pieceStyle(cell)}
                    >
                      {isKing(cell) && (
                        <div className="absolute inset-0 flex items-center justify-center text-xs font-bold text-yellow-300 drop-shadow-[0_1px_1px_rgba(0,0,0,0.8)]">
                          ★
                        </div>
                      )}
                    </div>
                  )}
                </button>
              );
            }),
          )}
        </div>
      </div>

      <div className="text-sm text-muted-foreground">
        {(() => {
          if (mode === 'human-ai' && isRequesting) return `AI (${getModelLabel(model)}) is thinking...`;
          if (mode === 'ai-ai' && isAiAiRunning)
            return `AI (${turn === 'b' ? getModelLabel(modelP1) : getModelLabel(modelP2)}) is thinking as ${
              turn === 'b' ? 'Black' : 'White'
            }...`;
          return '';
        })()}
      </div>
    </div>
  );
}
