import { NextResponse } from 'next/server';

import { generateText } from 'ai';

import { groq } from '@/lib/aiClient';

export const dynamic = 'force-dynamic';

type Cell = 0 | 1 | 2; // 0 empty, 1 player1, 2 player2
type Board = Cell[][]; // rows x cols

const ALLOWED_MODELS = new Set(['llama-3.3-70b-versatile', 'openai/gpt-oss-120b', 'openai/gpt-oss-20b']);

function isValidBoard(board: unknown): board is Board {
  if (!Array.isArray(board) || board.length < 4) return false;
  const cols = Array.isArray(board[0]) ? (board[0] as unknown[]).length : 0;
  if (cols < 4) return false;
  return (board as unknown[]).every(
    (row) => Array.isArray(row) && row.length === cols && (row as unknown[]).every((c) => c === 0 || c === 1 || c === 2),
  );
}

function boardToGridString(board: Board): string {
  // Returns 6 lines (or rows lines) of 7 digits (or cols), top to bottom
  return board.map((row) => row.join('')).join('\n');
}

function legalColumns(board: Board): number[] {
  const cols = board[0].length;
  const legal: number[] = [];
  for (let c = 0; c < cols; c += 1) {
    if (board[0][c] === 0) legal.push(c);
  }
  return legal;
}

function count(board: Board, v: 1 | 2): number {
  return board.flat().filter((x) => x === v).length;
}

function currentTurn(board: Board): 1 | 2 {
  const c1 = count(board, 1);
  const c2 = count(board, 2);
  return c1 === c2 ? 1 : 2;
}

// Simple game-over detection (four-in-a-row). Returns winner (1|2) or 0 for draw/ongoing.
function detectWinner(board: Board): 0 | 1 | 2 {
  const rows = board.length;
  const cols = board[0].length;
  const dir = [
    [0, 1],
    [1, 0],
    [1, 1],
    [1, -1],
  ];
  for (let r = 0; r < rows; r += 1) {
    for (let c = 0; c < cols; c += 1) {
      const v = board[r][c];
      if (v === 0) continue;
      for (const [dr, dc] of dir) {
        let k = 1;
        while (k < 4 && r + dr * k >= 0 && r + dr * k < rows && c + dc * k >= 0 && c + dc * k < cols) {
          if (board[r + dr * k][c + dc * k] !== v) break;
          k += 1;
        }
        if (k === 4) return v as 1 | 2;
      }
    }
  }
  return 0;
}

function getDropRow(board: Board, col: number): number {
  for (let r = board.length - 1; r >= 0; r -= 1) {
    if (board[r][col] === 0) return r;
  }
  return -1; // full
}

function applyMove(board: Board, col: number, player: 1 | 2): Board | null {
  const r = getDropRow(board, col);
  if (r === -1) return null;
  const copy = board.map((row) => row.slice());
  copy[r][col] = player;
  return copy;
}

function immediateWinningColumns(board: Board, player: 1 | 2): number[] {
  const legal = legalColumns(board);
  const wins: number[] = [];
  for (const c of legal) {
    const nb = applyMove(board, c, player);
    if (!nb) continue;
    if (detectWinner(nb) === player) wins.push(c);
  }
  return wins;
}

function columnsAllowOpponentImmediateWin(board: Board, player: 1 | 2): number[] {
  const opp = player === 1 ? 2 : 1;
  const legal = legalColumns(board);
  const unsafe: number[] = [];
  for (const c of legal) {
    const nb = applyMove(board, c, player);
    if (!nb) continue;
    const oppWins = immediateWinningColumns(nb, opp);
    if (oppWins.length > 0) unsafe.push(c);
  }
  return unsafe;
}

function sortByCenterPreference(cols: number[], totalCols: number): number[] {
  const center = Math.floor(totalCols / 2);
  return [...cols].sort((a, b) => Math.abs(a - center) - Math.abs(b - center));
}

function extractColFromText(text: string): number | null {
  const jsonMatch = text.match(/\{[\s\S]*?\}/);
  if (jsonMatch) {
    try {
      const obj = JSON.parse(jsonMatch[0]);
      if (obj && typeof obj === 'object' && Number.isInteger(obj.col)) return obj.col as number;
    } catch {
      // ignore
    }
  }
  const m = text.match(/"col"\s*:\s*(\d+)/);
  if (m) return Number(m[1]);
  return null;
}

export async function POST(req: Request) {
  try {
    const { board, aiPlaysAs, model }: { board: unknown; aiPlaysAs: 1 | 2; model: string } = await req.json();
    if (!isValidBoard(board)) return NextResponse.json({ error: 'Invalid board' }, { status: 400 });
    if (aiPlaysAs !== 1 && aiPlaysAs !== 2) return NextResponse.json({ error: 'Invalid aiPlaysAs' }, { status: 400 });
    if (!ALLOWED_MODELS.has(model)) return NextResponse.json({ error: 'Invalid model' }, { status: 400 });

    const b = board as Board;
    const legal = legalColumns(b);
    if (legal.length === 0) return NextResponse.json({ error: 'No legal moves' }, { status: 400 });
    const winner = detectWinner(b);
    if (winner !== 0) return NextResponse.json({ error: 'Game already finished', winner }, { status: 400 });

    // If it's not AI's turn, just return first legal column
    if (currentTurn(b) !== aiPlaysAs) return NextResponse.json({ col: legal[0] });

    // Tactical shortcuts: win now, or block opponent's immediate win
    const aiWinsNow = sortByCenterPreference(immediateWinningColumns(b, aiPlaysAs), b[0].length);
    if (aiWinsNow.length > 0) return NextResponse.json({ col: aiWinsNow[0] });

    const opp: 1 | 2 = aiPlaysAs === 1 ? 2 : 1;
    const oppWinsNow = sortByCenterPreference(immediateWinningColumns(b, opp), b[0].length);
    if (oppWinsNow.length > 0) return NextResponse.json({ col: oppWinsNow[0] });

    // Avoid handing opponent an immediate win
    const unsafe = columnsAllowOpponentImmediateWin(b, aiPlaysAs);
    const allowed = legal.filter((c) => !unsafe.includes(c));
    const allowedSorted = sortByCenterPreference(allowed.length > 0 ? allowed : legal, b[0].length);

    const rows = b.length;
    const cols = b[0].length;
    const grid = boardToGridString(b);
    const allCols: number[] = [];
    for (let i = 0; i < cols; i += 1) allCols.push(i);

    const system = [
      'You are a strong Connect 4 engine. Respond ONLY with a single JSON object.',
      'Format: {"col": 0-based integer}. No prose, no code fences, no markdown.',
      'Primary priorities in order: (1) take immediate win; (2) block opponent immediate win; (3) choose moves that extend or create threats (threes with open ends) over isolated placements.',
      'Connection of four can be horizontal, vertical, or diagonal.',
      'Obey gravity: pieces fall to the lowest empty cell.',
    ].join('\n');

    const user = [
      `Board rows=${rows} cols=${cols}. Cells: 0 empty, 1 player1, 2 player2.`,
      'BoardGrid (top row first, each line has cols digits):',
      grid,
      `AI plays as: ${aiPlaysAs}`,
      'Return the single best move as JSON. Example: {"col":3}',
    ].join('\n');
    console.log('🚀 -> user:', user);

    const { text } = await generateText({ model: groq.chat(model), system, prompt: user, temperature: 0 });
    let col = extractColFromText(text);
    // Enforce safety and legality
    const allowedSet = new Set(allowedSorted);
    if (col == null || !Number.isInteger(col) || !legal.includes(col)) {
      col = allowedSorted[0] ?? legal[0];
    } else if (!allowedSet.has(col)) {
      col = allowedSorted[0] ?? col;
    }
    return NextResponse.json({ col });
  } catch {
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}
