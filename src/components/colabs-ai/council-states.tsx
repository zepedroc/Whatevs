'use client';

import { useTranslations } from 'next-intl';
import type { CouncilMode } from '@/types/colabs-ai';

interface StateProps {
  mode: CouncilMode;
}

export function EmptyState({ mode }: StateProps) {
  const t = useTranslations('ColabsAI');
  const isBenchmark = mode === 'benchmark';

  return (
    <div className="flex flex-col items-center justify-center py-16 text-gray-500">
      <p>{isBenchmark ? 'Choose benchmark mode settings and click "Run Benchmark" to begin' : t('empty_state')}</p>
    </div>
  );
}

export function LoadingState({ mode }: StateProps) {
  const t = useTranslations('ColabsAI');
  const isBenchmark = mode === 'benchmark';

  return (
    <div className="flex flex-col items-center justify-center py-16 text-gray-600">
      <div className="flex flex-col items-center gap-2">
        <span className="animate-pulse text-2xl">{isBenchmark ? '📊' : '🤔'}</span>
        <p className="font-medium">
          {isBenchmark ? 'Benchmark run in progress...' : t('council_thinking')}
        </p>
      </div>
    </div>
  );
}
