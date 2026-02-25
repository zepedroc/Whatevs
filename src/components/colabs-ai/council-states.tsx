'use client';

import { useTranslations } from 'next-intl';

export function EmptyState() {
  const t = useTranslations('ColabsAI');

  return (
    <div className="flex flex-col items-center justify-center py-16 text-gray-500">
      <p>{t('empty_state')}</p>
    </div>
  );
}

export function LoadingState() {
  const t = useTranslations('ColabsAI');

  return (
    <div className="flex flex-col items-center justify-center py-16 text-gray-600">
      <div className="flex flex-col items-center gap-2">
        <span className="animate-pulse text-2xl">🤔</span>
        <p className="font-medium">{t('council_thinking')}</p>
      </div>
    </div>
  );
}
