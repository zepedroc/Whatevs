import { UIMessage, convertToModelMessages, streamText } from 'ai';

import { createOpenAI } from '@ai-sdk/openai';
import { load as loadHtml } from 'cheerio';

import { ChatMode, modes } from '@/constants/chatbot-constants';

export const dynamic = 'force-dynamic';

const groq = createOpenAI({
  apiKey: process.env.GROQ_API_KEY ?? '',
  baseURL: 'https://api.groq.com/openai/v1',
});

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

async function fetchDuckDuckGoResults(query: string, maxResults = 3) {
  try {
    const res = await fetch(`https://html.duckduckgo.com/html/?q=${encodeURIComponent(query)}`, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (compatible; ChatAppBot/1.0; +https://example.com)'
      },
      cache: 'no-store',
    });
    const html = await res.text();
    const $ = loadHtml(html);
    const results: { title: string; url: string; snippet: string }[] = [];
    $('.result').each((_, el) => {
      if (results.length >= maxResults) return false;
      const anchor = $(el).find('.result__a');
      const title = anchor.text().trim();
      const href = anchor.attr('href') || '';
      const snippet = $(el).find('.result__snippet').text().trim();
      if (!title || !href) return;
      try {
        const resolved = new URL(href, 'https://duckduckgo.com');
        const uddg = resolved.searchParams.get('uddg');
        const finalUrl = uddg ? decodeURIComponent(uddg) : href;
        results.push({ title, url: finalUrl, snippet });
      } catch {
        results.push({ title, url: href, snippet });
      }
    });

    if (results.length === 0) {
      // Fallback to DuckDuckGo Instant Answer API (limited but free)
      const ia = await fetch(
        `https://api.duckduckgo.com/?q=${encodeURIComponent(query)}&format=json&no_html=1&no_redirect=1`,
        { cache: 'no-store' },
      ).then((r) => r.json());
      const related = Array.isArray(ia.RelatedTopics) ? ia.RelatedTopics : [];
      for (const item of related) {
        if (results.length >= maxResults) break;
        if (item && item.Text && item.FirstURL) {
          results.push({ title: item.Text, url: item.FirstURL, snippet: item.Text });
        } else if (item && Array.isArray(item.Topics)) {
          for (const t of item.Topics) {
            if (results.length >= maxResults) break;
            if (t && t.Text && t.FirstURL) {
              results.push({ title: t.Text, url: t.FirstURL, snippet: t.Text });
            }
          }
        }
      }
    }

    return results;
  } catch (err) {
    console.error('DuckDuckGo fetch error', err);
    return [] as { title: string; url: string; snippet: string }[];
  }
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
      const results = await fetchDuckDuckGoResults(lastText, 3);
      if (results.length > 0) {
        const lines = results
          .map((r, i) => `[${i + 1}] ${r.title}\n${r.snippet}\n${r.url}`)
          .join('\n\n');
        webContext = `Use the following recent web search results to inform your answer. When you use a result, cite it with [n] and include the URL. If not helpful, ignore.\n\nQuery: ${lastText}\n\nResults:\n${lines}`;
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
    system: [prompt ?? '', webContext].filter(Boolean).join('\n\n'),
  });

  // Respond with the stream
  return result.toUIMessageStreamResponse();
}
