'use client';

import { useState } from 'react';

import { useTranslations } from 'next-intl';

import { generateEuroDreamsPick } from '@/lib/eurodreams';
import { generateEuroMillionsPick } from '@/lib/euromillions';

export default function BetsPage() {
  const t = useTranslations('Bets');
  const [euromillionsBetsCount, setEuromillionsBetsCount] = useState<number>(1);
  const [eurodreamsBetsCount, setEurodreamsBetsCount] = useState<number>(1);
  const [emPicks, setEmPicks] = useState<Array<ReturnType<typeof generateEuroMillionsPick>>>([]);
  const [edPicks, setEdPicks] = useState<Array<ReturnType<typeof generateEuroDreamsPick>>>([]);

  const handleGenerateEM = () => {
    const clamped = Math.max(1, Math.min(10, euromillionsBetsCount));
    const newPicks = Array.from({ length: clamped }, () => generateEuroMillionsPick());
    setEmPicks(newPicks);
  };

  const handleGenerateED = () => {
    const clamped = Math.max(1, Math.min(10, eurodreamsBetsCount));
    const newPicks = Array.from({ length: clamped }, () => generateEuroDreamsPick());
    setEdPicks(newPicks);
  };

  return (
    <div className="container mx-auto py-8">
      <h1 className="text-3xl font-bold mb-8">{t('title')}</h1>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <section className="rounded-lg border border-gray-200 p-6 dark:border-gray-800">
          <h2 className="text-2xl font-semibold mb-4">{t('euromillions.title')}</h2>
          <div className="mb-6 flex items-end gap-4">
            <div>
              <label className="block text-sm font-medium mb-2" htmlFor="emCount">
                {t('countLabel')}
              </label>
              <input
                id="emCount"
                type="number"
                min={1}
                max={10}
                value={euromillionsBetsCount}
                onChange={(e) => setEuromillionsBetsCount(Number(e.target.value))}
                className="w-32 rounded-md border border-gray-300 bg-white px-3 py-2 text-sm dark:border-gray-700 dark:bg-gray-900"
              />
            </div>

            <button
              onClick={handleGenerateEM}
              className="h-10 px-4 rounded-md bg-gray-900 text-white hover:bg-gray-800 hover:cursor-pointer dark:bg-gray-100 dark:text-black dark:hover:bg-white"
            >
              {t('generateButton')}
            </button>
          </div>

          {emPicks.length > 0 && (
            <div className="space-y-6">
              {emPicks.map((pick, idx) => (
                <div key={idx} className="rounded-lg border border-gray-200 p-4 dark:border-gray-800">
                  <div className="mb-2 text-sm font-semibold">{t('bet', { index: idx + 1 })}</div>
                  <div className="mb-2">
                    <h3 className="text-xl font-semibold">{t('euromillions.numbersTitle')}</h3>
                    <div className="mt-2 flex flex-wrap gap-2">
                      {pick.numbers.map((n) => (
                        <span
                          key={n}
                          className="inline-flex h-10 w-10 items-center justify-center rounded-full bg-blue-600 text-white"
                        >
                          {n}
                        </span>
                      ))}
                    </div>
                  </div>
                  <div>
                    <h3 className="text-xl font-semibold">{t('euromillions.starsTitle')}</h3>
                    <div className="mt-2 flex flex-wrap gap-2">
                      {pick.stars.map((s) => (
                        <span
                          key={s}
                          className="inline-flex h-10 w-10 items-center justify-center rounded-full bg-yellow-500 text-black"
                        >
                          {s}
                        </span>
                      ))}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>

        <section className="rounded-lg border border-gray-200 p-6 dark:border-gray-800">
          <h2 className="text-2xl font-semibold mb-4">{t('eurodreams.title')}</h2>
          <div className="mb-6 flex items-end gap-4">
            <div>
              <label className="block text-sm font-medium mb-2" htmlFor="edCount">
                {t('countLabel')}
              </label>
              <input
                id="edCount"
                type="number"
                min={1}
                max={10}
                value={eurodreamsBetsCount}
                onChange={(e) => setEurodreamsBetsCount(Number(e.target.value))}
                className="w-32 rounded-md border border-gray-300 bg-white px-3 py-2 text-sm dark:border-gray-700 dark:bg-gray-900"
              />
            </div>

            <button
              onClick={handleGenerateED}
              className="h-10 px-4 rounded-md bg-gray-900 text-white hover:bg-gray-800 hover:cursor-pointer dark:bg-gray-100 dark:text-black dark:hover:bg-white"
            >
              {t('generateButton')}
            </button>
          </div>

          {edPicks.length > 0 && (
            <div className="space-y-6">
              {edPicks.map((pick, idx) => (
                <div key={idx} className="rounded-lg border border-gray-200 p-4 dark:border-gray-800">
                  <div className="mb-2 text-sm font-semibold">{t('bet', { index: idx + 1 })}</div>
                  <div className="mb-2">
                    <h3 className="text-xl font-semibold">{t('eurodreams.numbersTitle')}</h3>
                    <div className="mt-2 flex flex-wrap gap-2">
                      {pick.numbers.map((n) => (
                        <span
                          key={n}
                          className="inline-flex h-10 w-10 items-center justify-center rounded-full bg-purple-600 text-white"
                        >
                          {n}
                        </span>
                      ))}
                    </div>
                  </div>
                  <div>
                    <h3 className="text-xl font-semibold">{t('eurodreams.dreamTitle')}</h3>
                    <div className="mt-2 flex flex-wrap gap-2">
                      <span className="inline-flex h-10 w-10 items-center justify-center rounded-full bg-pink-400 text-black">
                        {pick.dream}
                      </span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>
      </div>
    </div>
  );
}
