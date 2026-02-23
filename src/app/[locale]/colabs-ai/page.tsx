'use client';

import { useRef, useState } from 'react';

import { useTranslations } from 'next-intl';

import Markdown from 'react-markdown';
import remarkGfm from 'remark-gfm';

import { markdownComponents } from '@/lib/markdown-components';
import { streamPostNDJSON } from '@/lib/streamApi';

interface RoundResponse {
  type: 'round_response';
  round: number;
  model: string;
  content: string | null;
  error: string | null;
}

interface ModelResponse {
  model: string;
  content: string | null;
  error: string | null;
}

interface CouncilResponse {
  query: string;
  responses: ModelResponse[];
}

interface FinalEvent {
  type: 'final';
  data: CouncilResponse;
}

type CouncilStreamEvent = RoundResponse | FinalEvent;

function formatModelName(model: string): string {
  const parts = model.split('/');
  return parts[parts.length - 1] || model;
}

const ROUND_COLORS = [
  'border-l-4 border-l-amber-500 bg-amber-50/50',
  'border-l-4 border-l-emerald-500 bg-emerald-50/50',
  'border-l-4 border-l-blue-500 bg-blue-50/50',
  'border-l-4 border-l-violet-500 bg-violet-50/50',
  'border-l-4 border-l-rose-500 bg-rose-50/50',
];

const MODEL_COLORS = [
  'text-blue-700 font-semibold',
  'text-emerald-700 font-semibold',
  'text-violet-700 font-semibold',
  'text-amber-700 font-semibold',
  'text-rose-700 font-semibold',
  'text-cyan-700 font-semibold',
  'text-orange-700 font-semibold',
];

function getModelColor(_model: string, modelIndex: number): string {
  return MODEL_COLORS[modelIndex % MODEL_COLORS.length] ?? 'text-gray-700 font-semibold';
}

function CouncilResponsesGrid({
  responses,
  loading,
  t,
  formatModelName,
  getModelColor,
  messagesEndRef,
}: {
  responses: RoundResponse[];
  loading: boolean;
  t: (key: string, values?: Record<string, number>) => string;
  formatModelName: (model: string) => string;
  getModelColor: (model: string, modelIndex: number) => string;
  messagesEndRef: React.RefObject<HTMLDivElement | null>;
}) {
  const byRoundModel = new Map<string, RoundResponse>();
  responses.forEach((r) => byRoundModel.set(`${r.round}-${r.model}`, r));

  const uniqueModels = Array.from(new Set(responses.map((r) => r.model))).sort();
  const uniqueRounds = Array.from(new Set(responses.map((r) => r.round))).sort((a, b) => a - b);

  return (
    <div className="space-y-6">
      {uniqueRounds.map((round) => {
        const roundColor = ROUND_COLORS[(round - 1) % ROUND_COLORS.length] ?? 'border-l-4 border-l-gray-400 bg-gray-50/50';
        const hasAnyResponseForRound = responses.some((r) => r.round === round);

        return (
          <div
            key={round}
            className={`rounded-lg border border-gray-200 p-4 ${roundColor}`}
          >
            <h3 className="mb-4 text-sm font-semibold uppercase tracking-wide text-gray-600">
              {t('round_label', { round })}
            </h3>
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {uniqueModels.map((model, modelIndex) => {
                const resp = byRoundModel.get(`${round}-${model}`);
                const isThinking = loading && hasAnyResponseForRound && !resp;

                return (
                  <div
                    key={`${round}-${model}`}
                    className="flex min-h-[80px] flex-col rounded-lg border border-gray-200 bg-white p-3 shadow-sm"
                  >
                    <span className={`mb-2 text-sm ${getModelColor(model, modelIndex)}`}>
                      {formatModelName(model)}
                    </span>
                    <div className="prose prose-sm max-w-none flex-1 text-gray-900">
                      {isThinking ? (
                        <p className="animate-pulse italic text-gray-500">{t('thinking')}</p>
                      ) : resp?.error ? (
                        <p className="text-red-600">{resp.error}</p>
                      ) : resp?.content ? (
                        <Markdown remarkPlugins={[remarkGfm]} components={markdownComponents}>
                          {resp.content}
                        </Markdown>
                      ) : null}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        );
      })}
      <div ref={messagesEndRef} />
    </div>
  );
}

export default function ColabsAIPage() {
  const t = useTranslations('ColabsAI');
  const [query, setQuery] = useState('');
  const [rounds, setRounds] = useState(3);
  const [responses, setResponses] = useState<RoundResponse[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const handleQuery = async () => {
    if (!query.trim()) {
      setError(t('error_validation'));
      return;
    }

    setLoading(true);
    setError(null);
    setResponses([]);

    try {
      await streamPostNDJSON<CouncilStreamEvent, { query: string; rounds: number }>(
        'council/query',
        { query: query.trim(), rounds },
        (event) => {
          if (event.type === 'round_response') {
            setResponses((prev) => [...prev, event]);
            setTimeout(scrollToBottom, 100);
          }
        },
      );
    } catch (err) {
      const errorMessage =
        err instanceof Error
          ? err.message
          : typeof err === 'object' && err !== null && 'message' in err
            ? String((err as Record<string, unknown>).message)
            : t('error_general');
      setError(errorMessage);
      console.error('Council error:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleRetry = () => {
    setError(null);
    handleQuery();
  };

  const handleNewQuery = () => {
    setQuery('');
    setResponses([]);
    setError(null);
    setLoading(false);
  };

  return (
    <div className="flex min-h-screen flex-col bg-white">
      {/* Header */}
      <header className="shrink-0 px-4 py-6 sm:px-6 lg:px-8">
        <h1 className="mb-1 text-2xl font-bold text-black sm:text-3xl">{t('title')}</h1>
        <p className="text-sm text-gray-600 sm:text-base">{t('description')}</p>
      </header>

      {/* Scrollable content - round cards */}
      <main className="flex-1 overflow-y-auto px-4 pb-12 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-6xl">
          {error && (
            <div className="mb-6 rounded-lg border border-gray-400 bg-gray-100 p-4 text-black">
              <p className="mb-2 font-semibold">❌ {t('error_title')}</p>
              <p className="mb-3 text-sm">{error}</p>
              <button
                onClick={handleRetry}
                className="rounded bg-gray-300 px-3 py-1 text-sm font-medium hover:bg-gray-400 cursor-pointer"
              >
                {t('retry')}
              </button>
            </div>
          )}
          {responses.length === 0 && !loading ? (
            <div className="flex flex-col items-center justify-center py-16 text-gray-500">
              <p>{t('empty_state')}</p>
            </div>
          ) : responses.length === 0 && loading ? (
            <div className="flex flex-col items-center justify-center py-16 text-gray-600">
              <div className="flex flex-col items-center gap-2">
                <span className="animate-pulse text-2xl">🤔</span>
                <p className="font-medium">{t('council_thinking')}</p>
              </div>
            </div>
          ) : (
            <CouncilResponsesGrid
              responses={responses}
              loading={loading}
              t={t}
              formatModelName={formatModelName}
              getModelColor={getModelColor}
              messagesEndRef={messagesEndRef}
            />
          )}
        </div>
      </main>

      {/* Sticky input at bottom */}
      <div className="sticky bottom-0 shrink-0 border-t border-gray-200 bg-white/95 px-4 py-4 backdrop-blur-sm sm:px-6 lg:px-8">
        <div className="mx-auto max-w-4xl">
          <div className="flex flex-col gap-3">
            <textarea
              id="query"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
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
                    onChange={(e) => setRounds(Number(e.target.value))}
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
                {responses.length > 0 && !loading && (
                  <button
                    onClick={handleNewQuery}
                    className="rounded-lg border border-gray-300 bg-white px-4 py-2 text-sm font-semibold text-black transition-colors hover:bg-gray-100 cursor-pointer"
                  >
                    {t('new_query')}
                  </button>
                )}
              </div>
              <button
                onClick={handleQuery}
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
    </div>
  );
}
