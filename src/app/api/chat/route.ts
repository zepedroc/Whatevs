import { UIMessage, convertToModelMessages, streamText } from 'ai';

import { ChatMode, modes } from '@/constants/chatbot-constants';
import { groq } from '@/lib/aiClient';
import { computeDaysUntilIfApplicable } from '@/lib/dateMath';
import { rewriteSearchQueries } from '@/lib/queryRewrite';
import { dedupeAndRankResults, fetchDuckDuckGoResults } from '@/lib/webSearch';

export const dynamic = 'force-dynamic';

export type Mode = keyof typeof modes;

type TextPart = { type: 'text'; text: string };

function extractLastUserText(messages: UIMessage[], maxLen = 400): string {
  for (let i = messages.length - 1; i >= 0; i -= 1) {
    const message = messages[i];
    if (message.role === 'user') {
      const parts = (message as { parts?: unknown[] }).parts ?? [];
      const textPart = parts.find((p): p is TextPart => {
        if (typeof p !== 'object' || p === null) return false;
        const obj = p as Record<string, unknown>;
        return obj.type === 'text' && typeof obj.text === 'string';
      });
      if (textPart) {
        return textPart.text.slice(0, maxLen);
      }
    }
  }
  return '';
}

export async function POST(req: Request) {
  const { messages, mode, webSearch }: { messages: UIMessage[]; mode: Mode; webSearch?: boolean } = await req.json();

  // Get the prompt based on the selected mode
  const prompt = modes[mode];

  // Optionally fetch web search results for the latest user query
  let webContext = '';
  if (webSearch) {
    const lastText = extractLastUserText(messages, 400);
    if (lastText) {
      // 1) Deterministic helper (e.g., days until X)
      const computed = computeDaysUntilIfApplicable(lastText);

      // 2) Query rewriting and multi-query search
      const queries = await rewriteSearchQueries(lastText);
      const allResults: { title: string; url: string; snippet: string }[] = [];
      for (const q of queries) {
        const results = await fetchDuckDuckGoResults(q, 5);
        allResults.push(...results);
      }
      const deduped = dedupeAndRankResults(allResults, 8);

      const computedLine = computed
        ? `Computed: There are ${computed.days} days until ${computed.label} (target date ${computed.targetISO}).`
        : '';

      if (deduped.length > 0 || computedLine) {
        const lines = deduped.map((r, i) => `[${i + 1}] ${r.title}\n${r.snippet}\n${r.url}`).join('\n\n');
        const todayISO = new Date().toISOString().slice(0, 10);
        webContext = [
          `Today: ${todayISO}`,
          computedLine,
          'Use the following recent web search results to inform your answer. When you use a result, cite it with [n] and include the URL. If not helpful, ignore.',
          `User query: ${lastText}`,
          deduped.length ? `Results:\n${lines}` : '',
        ]
          .filter(Boolean)
          .join('\n\n');
      }
    }
  }

  // Select the appropriate model based on mode
  const model =
    mode === ChatMode.DeepSeekReasoning
      ? groq.chat('deepseek-r1-distill-llama-70b')
      : groq.chat('meta-llama/llama-4-maverick-17b-128e-instruct');

  // Call the language model
  const result = streamText({
    model,
    messages: convertToModelMessages(messages),
    system: [
      // Mode-specific system prompt
      prompt ?? '',
      // Answer shaping for web + computation
      'Answer the user succinctly. Compute any simple values needed (e.g., date differences) and present the final answer first. When using web results, cite with [n] and include the URL. If sources conflict, choose the most authoritative and explain briefly.',
      webContext,
    ]
      .filter(Boolean)
      .join('\n\n'),
  });

  // Respond with the stream
  return result.toUIMessageStreamResponse();
}
