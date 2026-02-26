'use client';

import { useRef, useState } from 'react';
import { useTranslations } from 'next-intl';
import { streamPostNDJSON } from '@/lib/streamApi';
import type { CouncilMode, CouncilStreamEvent, RoundResponse } from '@/types/colabs-ai';

export function useCouncilQuery() {
  const t = useTranslations('ColabsAI');
  const [query, setQuery] = useState('');
  const [rounds, setRounds] = useState(3);
  const [mode, setMode] = useState<CouncilMode>('parallel');
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
      await streamPostNDJSON<CouncilStreamEvent, { query: string; rounds: number; mode: CouncilMode }>(
        'council/query',
        { query: query.trim(), rounds, mode },
        (event) => {
          if (event.type === 'round_response') {
            setResponses((prev) => [...prev, event]);
            setTimeout(scrollToBottom, 100);
          }
        },
      );
      setQuery('');
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

  return {
    query,
    setQuery,
    rounds,
    setRounds,
    mode,
    setMode,
    responses,
    loading,
    error,
    messagesEndRef,
    handleQuery,
    handleRetry,
    handleNewQuery,
  };
}
