import { NextResponse } from 'next/server';

import { generateText } from 'ai';

import { groq } from '@/lib/aiClient';

export const dynamic = 'force-dynamic';

// Board representation
// 0 = empty, 'b' = black man, 'w' = white man, 'B' = black king, 'W' = white king
type Cell = 0 | 'b' | 'w' | 'B' | 'W';
type Board = Cell[][]; // 10 x 10

type Coord = { r: number; c: number };

interface Move {
  from: Coord;
  path: Coord[]; // sequence of landing squares (for multi-jumps, includes each landing)
  captures: Coord[]; // coordinates of captured pieces in order
  promotes?: boolean; // true if piece promotes at end of sequence
}

const ALLOWED_MODELS = new Set(['llama-3.3-70b-versatile', 'openai/gpt-oss-120b', 'openai/gpt-oss-20b']);

function isValidBoard(board: unknown): board is Board {
  if (!Array.isArray(board) || board.length !== 10) return false;
  return (board as unknown[]).every(
    (row) =>
      Array.isArray(row) &&
      row.length === 10 &&
      (row as unknown[]).every((c) => c === 0 || c === 'b' || c === 'w' || c === 'B' || c === 'W'),
  );
}

function cloneBoard(board: Board): Board {
  return board.map((row) => row.slice()) as Board;
}

function isInside(r: number, c: number): boolean {
  return r >= 0 && r < 10 && c >= 0 && c < 10;
}

function cellColor(cell: Cell): 'b' | 'w' | null {
  if (cell === 'b' || cell === 'B') return 'b';
  if (cell === 'w' || cell === 'W') return 'w';
  return null;
}

function isKing(cell: Cell): boolean {
  return cell === 'B' || cell === 'W';
}

function forwardDir(side: 'b' | 'w'): 1 | -1 {
  // Rows increase downward. We place white on rows 0..3 (top) and black on rows 6..9 (bottom).
  // Therefore, white moves down (+1), black moves up (-1).
  return side === 'w' ? 1 : -1;
}

function promoteIfNeeded(cell: Cell, r: number): Cell {
  if (cell === 'b' && r === 0) return 'B';
  if (cell === 'w' && r === 9) return 'W';
  return cell;
}

function boardToAscii(board: Board): string {
  // 10 lines of 10 chars: 0 . empty; b w men; B W kings
  return board
    .map((row) =>
      row
        .map((c) => {
          if (c === 0) return '.';
          return String(c);
        })
        .join(''),
    )
    .join('\n');
}

// --- Move generation (International Draughts) ---
// Mandatory capture; men capture in all directions; kings are flying; longest capture rule.

function generateAllMoves(board: Board, side: 'b' | 'w'): Move[] {
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
    // Longest capture rule: keep only moves with maximum number of captures
    const maxCaps = Math.max(...captureMoves.map((m) => m.captures.length));
    return captureMoves.filter((m) => m.captures.length === maxCaps);
  }
  // Otherwise, generate quiet moves
  for (let r = 0; r < 10; r += 1) {
    for (let c = 0; c < 10; c += 1) {
      const cell = board[r][c];
      if (cellColor(cell) !== side) continue;
      const pieceMoves = isKing(cell) ? generateKingQuiet(board, { r, c }, side) : generateManQuiet(board, { r, c }, side);
      quietMoves.push(...pieceMoves);
    }
  }
  return quietMoves;
}

function generateManQuiet(board: Board, at: Coord, side: 'b' | 'w'): Move[] {
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

function generateKingQuiet(board: Board, at: Coord, _side?: 'b' | 'w'): Move[] {
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

function generateManCaptures(board: Board, at: Coord, side: 'b' | 'w'): Move[] {
  const opp = side === 'b' ? 'w' : 'b';
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
      if (capturedSet.has(midKey)) continue; // cannot capture same piece twice

      // Apply capture
      const after = cloneBoard(boardNow);
      const moving = after[pos.r][pos.c];
      after[pos.r][pos.c] = 0;
      after[mr][mc] = 0; // remove captured
      let placed: Cell = moving;
      const promoteNow = (moving === 'b' && lr === 0) || (moving === 'w' && lr === 9);
      if (promoteNow) placed = promoteIfNeeded(moving, lr);
      after[lr][lc] = placed;

      const nextCaptured = new Set(capturedSet);
      nextCaptured.add(midKey);
      const nextPath = path.concat([{ r: lr, c: lc }]);
      const nextCaps = captures.concat([{ r: mr, c: mc }]);

      // If promotion occurred, piece continues as king
      if ((moving === 'b' || moving === 'w') && promoteNow) {
        dfsKing(after, { r: lr, c: lc }, side, nextCaptured, nextPath, nextCaps);
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

  function dfsKing(
    boardNow: Board,
    pos: Coord,
    side: 'b' | 'w',
    capturedSet: Set<string>,
    path: Coord[],
    captures: Coord[],
  ) {
    // After promoting mid-capture, continue as king
    const kingMoves = generateKingCaptures(boardNow, pos, side, capturedSet);
    if (kingMoves.length === 0) {
      results.push({ from: at, path: [...path], captures: [...captures], promotes: true });
      return;
    }
    for (const m of kingMoves) {
      results.push({ from: at, path: [...path, ...m.path], captures: [...captures, ...m.captures], promotes: true });
    }
  }

  dfs(board, at, new Set(), [], [], false);
  return results;
}

function generateKingCaptures(board: Board, at: Coord, side: 'b' | 'w', preCaptured?: Set<string>): Move[] {
  const opp = side === 'b' ? 'w' : 'b';
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
      // scan until we find the first opponent piece (cannot pass own piece)
      while (isInside(mr, mc) && boardNow[mr][mc] === 0) {
        mr += d.r;
        mc += d.c;
      }
      if (!isInside(mr, mc)) continue;
      const mid = boardNow[mr][mc];
      if (cellColor(mid) !== opp) continue;
      const midKey = `${mr},${mc}`;
      if (used.has(midKey) || capturedSet.has(midKey)) continue;
      // squares beyond must be empty; we can land on any empty square after jumping over mid
      let lr = mr + d.r;
      let lc = mc + d.c;
      while (isInside(lr, lc) && boardNow[lr][lc] === 0) {
        // apply this capture and land at (lr, lc)
        const after = cloneBoard(boardNow);
        const moving = after[pos.r][pos.c];
        after[pos.r][pos.c] = 0;
        after[mr][mc] = 0; // remove captured
        after[lr][lc] = moving; // kings remain kings

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

function extractMoveIndex(text: string): number | null {
  const jsonMatch = text.match(/\{[\s\S]*?\}/);
  if (jsonMatch) {
    try {
      const obj = JSON.parse(jsonMatch[0]);
      if (obj && typeof obj === 'object' && Number.isInteger(obj.moveIndex)) return obj.moveIndex as number;
    } catch {
      // ignore
    }
  }
  const m = text.match(/"moveIndex"\s*:\s*(\d+)/);
  if (m) return Number(m[1]);
  return null;
}

export async function POST(req: Request) {
  try {
    const { board, aiPlaysAs, model }: { board: unknown; aiPlaysAs: 'b' | 'w'; model: string } = await req.json();
    if (!isValidBoard(board)) return NextResponse.json({ error: 'Invalid board' }, { status: 400 });
    if (aiPlaysAs !== 'b' && aiPlaysAs !== 'w') return NextResponse.json({ error: 'Invalid aiPlaysAs' }, { status: 400 });
    if (!ALLOWED_MODELS.has(model)) return NextResponse.json({ error: 'Invalid model' }, { status: 400 });

    const b = board as Board;
    const legal = generateAllMoves(b, aiPlaysAs);
    if (legal.length === 0) return NextResponse.json({ error: 'No legal moves', gameOver: true }, { status: 400 });

    // Prefer maximum captures already handled. Prepare concise choices for the model.
    const choices = legal.map((m, idx) => ({
      idx,
      from: m.from,
      to: m.path[m.path.length - 1],
      jumps: m.captures.length,
      promotes: !!m.promotes,
      path: m.path,
    }));

    const system = [
      'You are a strong International Draughts (10x10) engine. Respond ONLY with a JSON object.',
      'Format: {"moveIndex": integer}. No prose, no code fences.',
      'Rules: mandatory capture, men capture in all directions, kings are flying, choose longest capture sequences (max jumps).',
      'Secondary preferences: prefer promoting, improve king activity/centralization, avoid giving immediate recapture when possible.',
    ].join('\n');

    const user = [
      `Board (top first, 10 lines of 10 chars; . empty, b/w men, B/W kings):`,
      boardToAscii(b),
      `Side to move: ${aiPlaysAs}`,
      `Legal moves (array):`,
      JSON.stringify(choices),
      'Return ONLY {"moveIndex": n} where n is an index in the array above.',
    ].join('\n');

    let text = '';
    try {
      const result = await generateText({ model: groq.chat(model), system, prompt: user, temperature: 0 });
      text = result.text;
    } catch (err) {
      console.error('[api/games/checkers] generateText error', {
        model,
        error: err instanceof Error ? err.message : String(err),
      });
      text = '';
    }
    let idx = extractMoveIndex(text);
    if (idx == null || !Number.isInteger(idx) || idx < 0 || idx >= legal.length) {
      idx = 0; // fallback to first (already longest-capture compliant)
    }
    const move = legal[idx];
    return NextResponse.json(move);
  } catch (e) {
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}
