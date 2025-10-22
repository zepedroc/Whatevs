import { NextResponse } from 'next/server';

import { generateText } from 'ai';

import { groq } from '@/lib/aiClient';

export const dynamic = 'force-dynamic';

type Cell = 'X' | 'O' | null;
type Board = Cell[][]; // 3x3

const ALLOWED_MODELS = new Set(['llama-3.3-70b-versatile', 'openai/gpt-oss-120b', 'openai/gpt-oss-20b']);

function isValidBoard(board: unknown): board is Board {
  if (!Array.isArray(board) || board.length !== 3) return false;
  return board.every(
    (row) => Array.isArray(row) && row.length === 3 && row.every((c) => c === 'X' || c === 'O' || c === null),
  );
}

function serializeBoard(board: Board): string {
  // Row-major to 9-char string using '.' for empty
  return board
    .flat()
    .map((c) => (c === null ? '.' : c))
    .join('');
}

function getLegalMoves(board: Board): Array<[number, number]> {
  const moves: Array<[number, number]> = [];
  for (let r = 0; r < 3; r += 1) {
    for (let c = 0; c < 3; c += 1) {
      if (board[r][c] === null) moves.push([r, c]);
    }
  }
  return moves;
}

function countSymbol(board: Board, symbol: 'X' | 'O'): number {
  return board.flat().filter((c) => c === symbol).length;
}

function checkWinner(board: Board): 'X' | 'O' | 'draw' | null {
  const lines = [
    // rows
    [board[0][0], board[0][1], board[0][2]],
    [board[1][0], board[1][1], board[1][2]],
    [board[2][0], board[2][1], board[2][2]],
    // cols
    [board[0][0], board[1][0], board[2][0]],
    [board[0][1], board[1][1], board[2][1]],
    [board[0][2], board[1][2], board[2][2]],
    // diagonals
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
  const x = countSymbol(board, 'X');
  const o = countSymbol(board, 'O');
  return x === o ? 'X' : 'O';
}

function extractMoveFromText(text: string): { row: number; col: number } | null {
  // Try to find first JSON object
  const jsonMatch = text.match(/\{[\s\S]*?\}/);
  if (jsonMatch) {
    try {
      const obj = JSON.parse(jsonMatch[0]);
      if (
        obj &&
        typeof obj === 'object' &&
        Number.isInteger(obj.row) &&
        Number.isInteger(obj.col) &&
        obj.row >= 0 &&
        obj.row <= 2 &&
        obj.col >= 0 &&
        obj.col <= 2
      ) {
        return { row: obj.row, col: obj.col };
      }
    } catch {
      // ignore
    }
  }
  // Fallback regex
  const rx = /"row"\s*:\s*(\d)\s*,\s*"col"\s*:\s*(\d)/;
  const m = text.match(rx);
  if (m) {
    const row = Number(m[1]);
    const col = Number(m[2]);
    if (row >= 0 && row <= 2 && col >= 0 && col <= 2) return { row, col };
  }
  return null;
}

export async function POST(req: Request) {
  try {
    const { board, aiPlaysAs, model }: { board: unknown; aiPlaysAs: 'X' | 'O'; model: string } = await req.json();

    if (!isValidBoard(board)) {
      return NextResponse.json({ error: 'Invalid board' }, { status: 400 });
    }
    if (aiPlaysAs !== 'X' && aiPlaysAs !== 'O') {
      return NextResponse.json({ error: 'Invalid aiPlaysAs' }, { status: 400 });
    }
    if (!ALLOWED_MODELS.has(model)) {
      return NextResponse.json({ error: 'Invalid model' }, { status: 400 });
    }

    const b = board as Board;
    const winner = checkWinner(b);
    if (winner) {
      return NextResponse.json({ error: 'Game already finished', winner }, { status: 400 });
    }
    const legal = getLegalMoves(b);
    if (legal.length === 0) {
      return NextResponse.json({ error: 'No legal moves' }, { status: 400 });
    }

    // Sanity: ensure it's AI's turn (not strictly required; client should coordinate)
    const turn = currentTurn(b);
    if (turn !== aiPlaysAs) {
      // Not AI turn; just return first legal move to avoid confusion
      const [row, col] = legal[0];
      return NextResponse.json({ row, col });
    }

    const s = serializeBoard(b);
    const legalMovesStr = JSON.stringify(legal);

    const system = [
      'You are a perfect Tic-Tac-Toe engine. Respond with ONLY a single compact JSON object.',
      'The JSON format is: {"row": 0-2, "col": 0-2}. No prose, no code fences.',
      'Play optimally to win or force a draw. Never choose an illegal move.',
    ].join('\n');

    const user = [
      `Board (row-major, '.' = empty): ${s}`,
      `AI plays as: ${aiPlaysAs}`,
      `LegalMoves: ${legalMovesStr}`,
      'Return the single best move as JSON. Example: {"row":0,"col":2}',
    ].join('\n');

    const { text } = await generateText({
      model: groq.chat(model),
      system,
      prompt: user,
    });

    const move = extractMoveFromText(text);
    const fallback = legal[0];
    if (!move) {
      return NextResponse.json({ row: fallback[0], col: fallback[1], note: 'fallback' });
    }
    const isLegal = legal.some(([r, c]) => r === move.row && c === move.col);
    if (!isLegal) {
      return NextResponse.json({ row: fallback[0], col: fallback[1], note: 'fallback-illegal' });
    }
    return NextResponse.json({ row: move.row, col: move.col });
  } catch {
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}
