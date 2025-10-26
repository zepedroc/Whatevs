import { load as loadHtml } from 'cheerio';

type WebResult = { title: string; url: string; snippet: string };

export async function fetchDuckDuckGoResults(query: string, maxResults = 3): Promise<WebResult[]> {
  const commonHeaders = {
    'User-Agent':
      'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/126.0.0.0 Safari/537.36',
    'Accept-Language': 'en-US,en;q=0.9',
    Accept: 'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,*/*;q=0.8',
  } as const;

  const endpoints = [
    `https://duckduckgo.com/html/?q=${encodeURIComponent(query)}`,
    `https://html.duckduckgo.com/html/?q=${encodeURIComponent(query)}`,
    `https://lite.duckduckgo.com/lite/?q=${encodeURIComponent(query)}`,
  ];

  const tryParsers = [
    (html: string) => {
      const $ = loadHtml(html);
      const parsed: WebResult[] = [];
      $('.result').each((_, el) => {
        if (parsed.length >= maxResults) return false;
        const anchor = $(el).find('.result__a');
        const title = anchor.text().trim();
        const href = anchor.attr('href') || '';
        const snippet = $(el).find('.result__snippet').text().trim();
        if (!title || !href) return;
        try {
          const resolved = new URL(href, 'https://duckduckgo.com');
          const uddg = resolved.searchParams.get('uddg');
          const finalUrl = uddg ? decodeURIComponent(uddg) : href;
          parsed.push({ title, url: finalUrl, snippet });
        } catch {
          parsed.push({ title, url: href, snippet });
        }
      });
      return parsed;
    },
    (html: string) => {
      const $ = loadHtml(html);
      const parsed: WebResult[] = [];
      $('a.result-link').each((_, el) => {
        if (parsed.length >= maxResults) return false;
        const anchor = $(el);
        const title = anchor.text().trim();
        const href = anchor.attr('href') || '';
        const snippet = anchor.closest('tr').next('tr').find('.result-snippet').text().trim() || '';
        if (!title || !href) return;
        parsed.push({ title, url: href, snippet });
      });
      return parsed;
    },
  ];

  try {
    for (const endpoint of endpoints) {
      const res = await fetch(endpoint, { headers: commonHeaders, cache: 'no-store' });
      const html = await res.text();
      for (const parse of tryParsers) {
        const parsed = parse(html);
        if (parsed.length > 0) {
          return parsed.slice(0, maxResults);
        }
      }
    }

    const ia = await fetch(
      `https://api.duckduckgo.com/?q=${encodeURIComponent(query)}&format=json&no_html=1&no_redirect=1`,
      { cache: 'no-store' },
    ).then((r) => r.json());
    const results: WebResult[] = [];
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
    return results;
  } catch (err) {
    console.error('DuckDuckGo fetch error', err);
    return [] as WebResult[];
  }
}

function normalizeTitle(title: string): string {
  return title.toLowerCase().replace(/\s+/g, ' ').trim();
}

function getDomain(urlString: string): string {
  try {
    const u = new URL(urlString);
    return u.hostname.replace(/^www\./, '');
  } catch {
    return urlString;
  }
}

export function dedupeAndRankResults(items: WebResult[], max: number): WebResult[] {
  const seen = new Set<string>();
  const out: WebResult[] = [];
  for (const it of items) {
    const key = `${normalizeTitle(it.title)}::${getDomain(it.url)}`;
    if (seen.has(key)) continue;
    seen.add(key);
    out.push(it);
    if (out.length >= max) break;
  }
  return out;
}
