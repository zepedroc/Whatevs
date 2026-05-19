'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import type {
  BenchmarkAnswerStatus,
  BenchmarkCaseResult,
  BenchmarkCaseStartedEvent,
  BenchmarkSummary,
  ModelBenchmarkResult,
} from '@/types/colabs-ai';
import { formatModelName } from '@/lib/colabs-ai/utils';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';

interface BenchmarkResultsPanelProps {
  benchmarkCaseStarts: BenchmarkCaseStartedEvent[];
  benchmarkCaseResults: BenchmarkCaseResult[];
  benchmarkSummary: BenchmarkSummary | null;
  activeBenchmarkCaseIndex: number | null;
  loading: boolean;
  messagesEndRef: React.RefObject<HTMLDivElement | null>;
}

function formatPercent(value: number) {
  return `${(value * 100).toFixed(1)}%`;
}

function correctnessPill(status: BenchmarkAnswerStatus, label: string) {
  if (status === 'parsing_error') {
    return (
      <span className="inline-flex min-w-[88px] items-center justify-center rounded-full bg-amber-100 px-2.5 py-1 text-xs font-semibold text-amber-800">
        {label}: parsing error
      </span>
    );
  }

  return (
    <span
      className={`inline-flex min-w-[88px] items-center justify-center rounded-full px-2.5 py-1 text-xs font-semibold ${
        status === 'correct' ? 'bg-emerald-100 text-emerald-800' : 'bg-rose-100 text-rose-700'
      }`}
    >
      {status === 'correct' ? `${label}: correct` : `${label}: wrong`}
    </span>
  );
}

function optionCell(option: string | null) {
  return (
    <span className="inline-flex min-w-10 items-center justify-center rounded-md border border-gray-200 bg-white px-2 py-1 font-mono text-sm">
      {option ?? '—'}
    </span>
  );
}

function parseErrorsCell(result: ModelBenchmarkResult) {
  if (!result.round1_parse_error && !result.final_parse_error) {
    return <span className="text-xs text-emerald-700">No parse errors</span>;
  }

  return (
    <div className="space-y-1 text-xs">
      <p className="text-amber-800">
        <span className="font-semibold">Round 1:</span> {result.round1_parse_error ?? 'None'}
      </p>
      <p className="text-amber-800">
        <span className="font-semibold">Final:</span> {result.final_parse_error ?? 'None'}
      </p>
    </div>
  );
}

function roundStatus(
  result: ModelBenchmarkResult,
  round: 'round1' | 'final',
): BenchmarkAnswerStatus {
  const explicitStatus = round === 'round1' ? result.round1_status : result.final_status;
  if (explicitStatus) {
    return explicitStatus;
  }

  const parseError = round === 'round1' ? result.round1_parse_error : result.final_parse_error;
  if (parseError?.startsWith('Invalid JSON') || parseError === 'Empty response') {
    return 'parsing_error';
  }

  const isCorrect = round === 'round1' ? result.round1_correct : result.final_correct;
  return isCorrect ? 'correct' : 'incorrect';
}

function RawResponseHoverButton({
  label,
  rawResponse,
}: {
  label: string;
  rawResponse: string | null | undefined;
}) {
  const [open, setOpen] = useState(false);
  const closeTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const content = rawResponse?.trim() ? rawResponse : 'No raw response returned.';
  const CLOSE_DELAY_MS = 140;

  const clearCloseTimeout = useCallback(() => {
    if (!closeTimeoutRef.current) {
      return;
    }

    clearTimeout(closeTimeoutRef.current);
    closeTimeoutRef.current = null;
  }, []);

  useEffect(() => {
    return () => {
      clearCloseTimeout();
    };
  }, [clearCloseTimeout]);

  const openPopover = useCallback(() => {
    clearCloseTimeout();
    setOpen(true);
  }, [clearCloseTimeout]);

  const scheduleClose = useCallback(() => {
    clearCloseTimeout();
    closeTimeoutRef.current = setTimeout(() => {
      setOpen(false);
      closeTimeoutRef.current = null;
    }, CLOSE_DELAY_MS);
  }, [clearCloseTimeout]);

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <button
          type="button"
          className="inline-flex items-center rounded-md border border-gray-200 bg-white px-2 py-1 text-xs font-medium text-gray-700 transition hover:bg-gray-50"
          onPointerEnter={openPopover}
          onPointerLeave={scheduleClose}
          onFocus={openPopover}
          onBlur={scheduleClose}
        >
          {label}
        </button>
      </PopoverTrigger>
      <PopoverContent
        align="end"
        className="w-[28rem] max-w-[70vw] p-3"
        sideOffset={8}
        onPointerEnter={openPopover}
        onPointerLeave={scheduleClose}
      >
        <p className="mb-1 text-[11px] font-semibold uppercase tracking-wide text-gray-500">
          {label} raw response
        </p>
        <pre className="max-h-64 overflow-auto whitespace-pre-wrap break-words rounded-md bg-gray-50 p-2 font-mono text-xs text-gray-700">
          {content}
        </pre>
      </PopoverContent>
    </Popover>
  );
}

export function BenchmarkResultsPanel({
  benchmarkCaseStarts,
  benchmarkCaseResults,
  benchmarkSummary,
  activeBenchmarkCaseIndex,
  loading,
  messagesEndRef,
}: BenchmarkResultsPanelProps) {
  const sortedStarts = [...benchmarkCaseStarts].sort((a, b) => a.case_index - b.case_index);
  const sortedResults = [...benchmarkCaseResults].sort((a, b) => a.case_index - b.case_index);
  const completedCases = sortedResults.length;
  const totalCases = benchmarkSummary?.total_cases ?? 0;
  const progress = totalCases > 0 ? Math.min(100, (completedCases / totalCases) * 100) : 0;

  return (
    <div className="space-y-6 pb-6">
      <section className="overflow-hidden rounded-2xl border border-indigo-100 bg-gradient-to-r from-indigo-50 via-white to-sky-50 p-5 shadow-sm">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <p className="text-xs font-semibold uppercase tracking-wider text-indigo-700">
              Benchmark progress
            </p>
            <h2 className="mt-1 text-xl font-bold text-gray-900">Council Benchmark Dashboard</h2>
            <p className="mt-1 text-sm text-gray-600">
              Case start events, per-model choices, parse diagnostics, and final accuracy deltas.
            </p>
          </div>
          <div className="rounded-lg border border-indigo-200 bg-white px-3 py-2 text-right shadow-xs">
            <p className="text-xs text-gray-500">Completed cases</p>
            <p className="text-lg font-semibold text-indigo-700">
              {completedCases}
              {totalCases > 0 ? ` / ${totalCases}` : ''}
            </p>
          </div>
        </div>

        {totalCases > 0 && (
          <div className="mt-4">
            <div className="mb-1 flex items-center justify-between text-xs text-gray-600">
              <span>Run completion</span>
              <span>{progress.toFixed(1)}%</span>
            </div>
            <div className="h-2 w-full overflow-hidden rounded-full bg-indigo-100">
              <div className="h-full rounded-full bg-indigo-500 transition-all duration-500" style={{ width: `${progress}%` }} />
            </div>
          </div>
        )}

        {(loading || activeBenchmarkCaseIndex !== null) && (
          <div className="mt-4 rounded-lg border border-blue-200 bg-blue-50 px-3 py-2 text-sm text-blue-800">
            Running case{' '}
            <span className="font-semibold">
              {activeBenchmarkCaseIndex !== null ? activeBenchmarkCaseIndex + 1 : '...'}
            </span>
          </div>
        )}
      </section>

      {sortedStarts.length > 0 && (
        <section className="rounded-2xl border border-gray-200 bg-white p-4 shadow-sm">
          <h3 className="mb-3 text-sm font-semibold uppercase tracking-wide text-gray-600">
            Case start stream
          </h3>
          <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
            {sortedStarts.map((startedCase) => {
              const isDone = sortedResults.some(
                (result) => result.case_index === startedCase.case_index,
              );
              const isActive = activeBenchmarkCaseIndex === startedCase.case_index;

              return (
                <div
                  key={startedCase.case_index}
                  className={`rounded-lg border px-3 py-2 text-sm ${
                    isActive
                      ? 'border-blue-300 bg-blue-50'
                      : isDone
                        ? 'border-emerald-200 bg-emerald-50'
                        : 'border-gray-200 bg-gray-50'
                  }`}
                >
                  <p className="font-semibold text-gray-800">Case {startedCase.case_index + 1}</p>
                  <p className="mt-1 text-xs text-gray-600">{startedCase.question}</p>
                </div>
              );
            })}
          </div>
        </section>
      )}

      {benchmarkSummary && (
        <section className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
          <div className="rounded-xl border border-gray-200 bg-white p-4 shadow-sm">
            <p className="text-xs uppercase tracking-wide text-gray-500">Total cases</p>
            <p className="mt-1 text-2xl font-semibold text-gray-900">{benchmarkSummary.total_cases}</p>
          </div>
          <div className="rounded-xl border border-gray-200 bg-white p-4 shadow-sm">
            <p className="text-xs uppercase tracking-wide text-gray-500">Round 1 accuracy</p>
            <p className="mt-1 text-2xl font-semibold text-gray-900">
              {formatPercent(benchmarkSummary.round1_accuracy)}
            </p>
            <p className="text-xs text-gray-500">{benchmarkSummary.round1_correct} correct picks</p>
          </div>
          <div className="rounded-xl border border-gray-200 bg-white p-4 shadow-sm">
            <p className="text-xs uppercase tracking-wide text-gray-500">Final accuracy</p>
            <p className="mt-1 text-2xl font-semibold text-gray-900">
              {formatPercent(benchmarkSummary.final_accuracy)}
            </p>
            <p className="text-xs text-gray-500">{benchmarkSummary.final_correct} correct picks</p>
          </div>
          <div className="rounded-xl border border-gray-200 bg-white p-4 shadow-sm sm:col-span-2 xl:col-span-3">
            <p className="text-xs uppercase tracking-wide text-gray-500">Accuracy delta (final - round 1)</p>
            <p
              className={`mt-1 text-2xl font-semibold ${
                benchmarkSummary.delta >= 0 ? 'text-emerald-700' : 'text-rose-700'
              }`}
            >
              {benchmarkSummary.delta >= 0 ? '+' : ''}
              {formatPercent(benchmarkSummary.delta)}
            </p>
          </div>
        </section>
      )}

      <section className="space-y-4">
        {sortedResults.map((result) => (
          <article
            key={result.case_index}
            className="overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-sm"
          >
            <div className="border-b border-gray-100 bg-gray-50 px-4 py-3">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <h3 className="text-base font-semibold text-gray-900">Case {result.case_index + 1}</h3>
                <span className="inline-flex items-center rounded-full border border-indigo-200 bg-indigo-50 px-3 py-1 text-xs font-semibold text-indigo-800">
                  Expected option: {result.expected_option}
                </span>
              </div>
              <p className="mt-2 text-sm text-gray-700">{result.question}</p>
            </div>

            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-white">
                  <tr className="text-left text-xs uppercase tracking-wide text-gray-500">
                    <th className="px-4 py-3 font-semibold">Model</th>
                    <th className="px-4 py-3 font-semibold">Round 1 option</th>
                    <th className="px-4 py-3 font-semibold">Final option</th>
                    <th className="px-4 py-3 font-semibold">Round 1 status</th>
                    <th className="px-4 py-3 font-semibold">Final status</th>
                    <th className="px-4 py-3 font-semibold">Parse diagnostics</th>
                    <th className="px-4 py-3 font-semibold">Raw responses</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100 bg-white">
                  {result.model_results.map((modelResult) => (
                    <tr key={`${result.case_index}-${modelResult.model}`} className="align-top">
                      <td className="px-4 py-3 text-sm font-medium text-gray-900">
                        {formatModelName(modelResult.model)}
                      </td>
                      <td className="px-4 py-3">{optionCell(modelResult.round1_option)}</td>
                      <td className="px-4 py-3">{optionCell(modelResult.final_option)}</td>
                      <td className="px-4 py-3">
                        {correctnessPill(roundStatus(modelResult, 'round1'), 'Round 1')}
                      </td>
                      <td className="px-4 py-3">
                        {correctnessPill(roundStatus(modelResult, 'final'), 'Final')}
                      </td>
                      <td className="px-4 py-3">{parseErrorsCell(modelResult)}</td>
                      <td className="px-4 py-3">
                        <div className="flex flex-wrap items-center gap-2">
                          <RawResponseHoverButton
                            label="Round 1"
                            rawResponse={modelResult.round1_raw_response}
                          />
                          <RawResponseHoverButton
                            label="Final"
                            rawResponse={modelResult.final_raw_response}
                          />
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </article>
        ))}
      </section>
      <div ref={messagesEndRef} />
    </div>
  );
}
