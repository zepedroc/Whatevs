'use client';

import { useTranslations } from 'next-intl';

interface CouncilInputProps {
  query: string;
  onQueryChange: (value: string) => void;
  rounds: number;
  onRoundsChange: (value: number) => void;
  loading: boolean;
  hasResponses: boolean;
  onAskCouncil: () => void;
  onNewQuery: () => void;
}

export function CouncilInput({
  query,
  onQueryChange,
  rounds,
  onRoundsChange,
  loading,
  hasResponses,
  onAskCouncil,
  onNewQuery,
}: CouncilInputProps) {
  const t = useTranslations('ColabsAI');

  return (
    <div className="sticky bottom-0 shrink-0 border-t border-gray-200 bg-white/95 px-4 py-4 backdrop-blur-sm sm:px-6 lg:px-8">
      <div className="mx-auto max-w-4xl">
        <div className="flex flex-col gap-3">
          <textarea
            id="query"
            value={query}
            onChange={(e) => onQueryChange(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                if (!loading && query.trim()) onAskCouncil();
              }
            }}
            disabled={loading}
            placeholder={t('query_placeholder')}
            rows={3}
            className="w-full rounded-lg border border-gray-300 bg-white px-4 py-3 text-black placeholder-gray-400 focus:border-black focus:outline-none focus:ring-2 focus:ring-black/20 disabled:opacity-50"
          />
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <div className="flex items-center gap-2">
                <label htmlFor="rounds" className="text-sm text-gray-600">
                  {t('rounds_label')}
                </label>
                <select
                  id="rounds"
                  value={rounds}
                  onChange={(e) => onRoundsChange(Number(e.target.value))}
                  disabled={loading}
                  className="rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm text-black disabled:opacity-50"
                >
                  {[1, 2, 3, 4, 5].map((n) => (
                    <option key={n} value={n}>
                      {n}
                    </option>
                  ))}
                </select>
              </div>
              {loading && (
                <span className="animate-pulse text-sm text-gray-600">{t('live_streaming')}</span>
              )}
              {hasResponses && !loading && (
                <button
                  onClick={onNewQuery}
                  className="rounded-lg border border-gray-300 bg-white px-4 py-2 text-sm font-semibold text-black transition-colors hover:bg-gray-100 cursor-pointer"
                >
                  {t('new_query')}
                </button>
              )}
            </div>
            <button
              onClick={onAskCouncil}
              disabled={loading || !query.trim()}
              className="rounded-lg bg-black px-6 py-3 font-semibold text-white transition-colors hover:bg-gray-800 disabled:cursor-not-allowed disabled:bg-gray-400 cursor-pointer"
            >
              {loading ? (
                <span className="flex items-center gap-2">
                  <span className="animate-spin">⏳</span>
                  {t('querying')}
                </span>
              ) : (
                t('ask_council')
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
