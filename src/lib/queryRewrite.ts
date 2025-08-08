import { generateText } from 'ai';

import { groq } from './aiClient';

export async function rewriteSearchQueries(userText: string): Promise<string[]> {
  try {
    const { text } = await generateText({
      model: groq.chat('meta-llama/llama-4-maverick-17b-128e-instruct'),
      prompt:
        'Rewrite the following user question into 2-3 distinct, concise web search queries that would best retrieve up-to-date information. Return ONLY a JSON array of strings, no extra text.\n\nUser: ' +
        JSON.stringify(userText),
    });
    const start = text.indexOf('[');
    const end = text.lastIndexOf(']');
    const jsonSlice = start !== -1 && end !== -1 ? text.slice(start, end + 1) : text;
    const arr = JSON.parse(jsonSlice);
    const queries = Array.isArray(arr) ? arr.map((q) => String(q)) : [];
    const cleaned = queries.map((q) => q.trim()).filter(Boolean);
    if (cleaned.length > 0) return cleaned.slice(0, 3);
  } catch {
    // ignore and fallback to original
  }
  return [userText];
}
