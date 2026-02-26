'use client';

import {
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
    loading,
    error,
    messagesEndRef,
    handleQuery,
    handleRetry,
    handleNewQuery,
  } = useCouncilQuery();

  return (
    <div className="flex min-h-screen flex-col bg-white">
      <CouncilHeader />

      <main className="flex-1 overflow-y-auto px-4 pb-12 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-6xl">
          {error && <ErrorBanner error={error} onRetry={handleRetry} />}
          {responses.length === 0 && !loading && <EmptyState />}
          {responses.length === 0 && loading && <LoadingState />}
          {responses.length > 0 && (
            <CouncilResponsesGrid
              responses={responses}
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
        hasResponses={responses.length > 0}
        onAskCouncil={handleQuery}
        onNewQuery={handleNewQuery}
      />
    </div>
  );
}
