'use client';

import {
  BenchmarkResultsPanel,
  CouncilHeader,
  CouncilInput,
  CouncilResponsesGrid,
  EmptyState,
  ErrorBanner,
  LoadingState,
} from '@/components/colabs-ai';
import { useCouncilQuery } from './use-council-query';

export default function ColabsAIPage() {
  const {
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
  } = useCouncilQuery();
  const isBenchmarkMode = mode === 'benchmark';
  const hasBenchmarkData =
    benchmarkCaseStarts.length > 0 || benchmarkCaseResults.length > 0 || benchmarkSummary !== null;
  const hasCouncilData = responses.length > 0;
  const hasAnyData = isBenchmarkMode ? hasBenchmarkData : hasCouncilData;

  return (
    <div className="flex min-h-screen flex-col bg-white">
      <CouncilHeader />

      <main className="flex-1 overflow-y-auto px-4 pb-12 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-6xl">
          {error && <ErrorBanner error={error} onRetry={handleRetry} />}
          {!hasAnyData && !loading && <EmptyState mode={mode} />}
          {!hasAnyData && loading && <LoadingState mode={mode} />}
          {!isBenchmarkMode && hasCouncilData && (
            <CouncilResponsesGrid
              responses={responses}
              loading={loading}
              messagesEndRef={messagesEndRef}
            />
          )}
          {isBenchmarkMode && hasBenchmarkData && (
            <BenchmarkResultsPanel
              benchmarkCaseStarts={benchmarkCaseStarts}
              benchmarkCaseResults={benchmarkCaseResults}
              benchmarkSummary={benchmarkSummary}
              activeBenchmarkCaseIndex={activeBenchmarkCaseIndex}
              loading={loading}
              messagesEndRef={messagesEndRef}
            />
          )}
        </div>
      </main>

      <CouncilInput
        query={query}
        onQueryChange={setQuery}
        rounds={rounds}
        onRoundsChange={setRounds}
        mode={mode}
        onModeChange={setMode}
        loading={loading}
        hasResponses={hasAnyData}
        onAskCouncil={handleQuery}
        onNewQuery={handleNewQuery}
      />
    </div>
  );
}
