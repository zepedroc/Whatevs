'use client';

import { useTranslations } from 'next-intl';
import Markdown from 'react-markdown';
import remarkGfm from 'remark-gfm';

import { markdownComponents } from '@/lib/markdown-components';
import type { RoundResponse } from '@/types/colabs-ai';

import { MODEL_COLORS, ROUND_COLORS } from '@/lib/colabs-ai/constants';
import { formatModelName, getModelColor } from '@/lib/colabs-ai/utils';

interface CouncilResponsesGridProps {
  responses: RoundResponse[];
  loading: boolean;
  messagesEndRef: React.RefObject<HTMLDivElement | null>;
}

export function CouncilResponsesGrid({
  responses,
  loading,
  messagesEndRef,
}: CouncilResponsesGridProps) {
  const t = useTranslations('ColabsAI');
  const byRoundModel = new Map<string, RoundResponse>();
  responses.forEach((r) => byRoundModel.set(`${r.round}-${r.model}`, r));

  const uniqueModels = Array.from(new Set(responses.map((r) => r.model))).sort();
  const uniqueRounds = Array.from(new Set(responses.map((r) => r.round))).sort((a, b) => a - b);

  return (
    <div className="space-y-6">
      {uniqueRounds.map((round) => {
        const roundColor =
          ROUND_COLORS[(round - 1) % ROUND_COLORS.length] ??
          'border-l-4 border-l-gray-400 bg-gray-50/50';
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
                    <span
                      className={`mb-2 text-sm ${getModelColor(model, modelIndex, MODEL_COLORS)}`}
                    >
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
