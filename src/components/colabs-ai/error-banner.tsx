'use client';

import { useTranslations } from 'next-intl';

interface ErrorBannerProps {
  error: string;
  onRetry: () => void;
}

export function ErrorBanner({ error, onRetry }: ErrorBannerProps) {
  const t = useTranslations('ColabsAI');

  return (
    <div className="mb-6 rounded-lg border border-gray-400 bg-gray-100 p-4 text-black">
      <p className="mb-2 font-semibold">❌ {t('error_title')}</p>
      <p className="mb-3 text-sm">{error}</p>
      <button
        onClick={onRetry}
        className="rounded bg-gray-300 px-3 py-1 text-sm font-medium hover:bg-gray-400 cursor-pointer"
      >
        {t('retry')}
      </button>
    </div>
  );
}
