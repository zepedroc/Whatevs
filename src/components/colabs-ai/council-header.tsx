'use client';

import { useTranslations } from 'next-intl';

export function CouncilHeader() {
  const t = useTranslations('ColabsAI');

  return (
    <header className="shrink-0 px-4 py-6 sm:px-6 lg:px-8">
      <h1 className="mb-1 text-2xl font-bold text-black sm:text-3xl">{t('title')}</h1>
      <p className="text-sm text-gray-600 sm:text-base">{t('description')}</p>
    </header>
  );
}
