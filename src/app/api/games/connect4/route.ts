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

function serializeBoard(board: Board): string {
  // Row-major, top row first, join digits without separators
  return board.flat().join('');
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

    const rows = b.length;
    const cols = b[0].length;
    const s = serializeBoard(b);
    const legalStr = JSON.stringify(legal);

    const system = [
      'You are a perfect Connect 4 engine. Respond ONLY with a single JSON object.',
      'Format: {"col": 0-based integer}. No prose, no code fences.',
      'Moves must be legal and obey gravity (pieces fall to the lowest empty cell).',
    ].join('\n');

    const user = [
      `Board rows=${rows} cols=${cols} (row-major, top row first). Cells: 0 empty, 1 player1, 2 player2.`,
      `BoardData: ${s}`,
      `AI plays as: ${aiPlaysAs}`,
      `LegalColumns: ${legalStr}`,
      'Return the single best legal move as JSON. Example: {"col":3}',
    ].join('\n');

    const { text } = await generateText({ model: groq.chat(model), system, prompt: user });
    let col = extractColFromText(text);
    if (col == null || !legal.includes(col)) col = legal[0];
    return NextResponse.json({ col });
  } catch {
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}
