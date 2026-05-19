'use client';

import { useRef, useState } from 'react';
import { useTranslations } from 'next-intl';
import { streamPostNDJSON } from '@/lib/streamApi';
import type {
  BenchmarkCaseResult,
  BenchmarkCaseStartedEvent,
  BenchmarkStreamEvent,
  BenchmarkSummary,
  CouncilMode,
  CouncilStreamEvent,
  RoundResponse,
} from '@/types/colabs-ai';

export function useCouncilQuery() {
  const t = useTranslations('ColabsAI');
  const [query, setQuery] = useState('');
  const [rounds, setRounds] = useState(3);
  const [mode, setMode] = useState<CouncilMode>('parallel');
  const [responses, setResponses] = useState<RoundResponse[]>([]);
  const [benchmarkCaseStarts, setBenchmarkCaseStarts] = useState<BenchmarkCaseStartedEvent[]>([]);
  const [benchmarkCaseResults, setBenchmarkCaseResults] = useState<BenchmarkCaseResult[]>([]);
  const [benchmarkSummary, setBenchmarkSummary] = useState<BenchmarkSummary | null>(null);
  const [activeBenchmarkCaseIndex, setActiveBenchmarkCaseIndex] = useState<number | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const handleQuery = async () => {
    const isBenchmarkMode = mode === 'benchmark';

    if (!isBenchmarkMode && !query.trim()) {
      setError(t('error_validation'));
      return;
    }

    setLoading(true);
    setError(null);
    setResponses([]);
    setBenchmarkCaseStarts([]);
    setBenchmarkCaseResults([]);
    setBenchmarkSummary(null);
    setActiveBenchmarkCaseIndex(null);

    try {
      if (isBenchmarkMode) {
        await streamPostNDJSON<BenchmarkStreamEvent, Record<string, never>>(
          'benchmark/run',
          {},
          (event) => {
            if (event.type === 'benchmark_case_started') {
              setBenchmarkCaseStarts((prev) => {
                if (prev.some((existing) => existing.case_index === event.case_index)) {
                  return prev;
                }
                const next = [...prev, event];
                next.sort((a, b) => a.case_index - b.case_index);
                return next;
              });
              setActiveBenchmarkCaseIndex(event.case_index);
              setTimeout(scrollToBottom, 100);
              return;
            }

            if (event.type === 'benchmark_case_result') {
              setBenchmarkCaseResults((prev) => {
                const withoutCurrent = prev.filter(
                  (existing) => existing.case_index !== event.data.case_index,
                );
                const next = [...withoutCurrent, event.data];
                next.sort((a, b) => a.case_index - b.case_index);
                return next;
              });
              setTimeout(scrollToBottom, 100);
              return;
            }

            setBenchmarkSummary(event.data);
            setActiveBenchmarkCaseIndex(null);
            setTimeout(scrollToBottom, 100);
          },
        );
      } else {
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
      }
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
    setBenchmarkCaseStarts([]);
    setBenchmarkCaseResults([]);
    setBenchmarkSummary(null);
    setActiveBenchmarkCaseIndex(null);
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
    benchmarkCaseStarts,
    benchmarkCaseResults,
    benchmarkSummary,
    activeBenchmarkCaseIndex,
    loading,
    error,
    messagesEndRef,
    handleQuery,
    handleRetry,
    handleNewQuery,
  };
}
