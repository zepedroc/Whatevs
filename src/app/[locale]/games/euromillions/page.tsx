'use client';

import { useState } from 'react';

import { generateEuroMillionsPick } from '@/lib/euromillions';

export default function EuroMillionsPage() {
  const [betsCount, setBetsCount] = useState<number>(1);
  const [picks, setPicks] = useState<Array<ReturnType<typeof generateEuroMillionsPick>>>([]);

  const handleGenerate = () => {
    const clamped = Math.max(1, Math.min(5, betsCount));
    const newPicks = Array.from({ length: clamped }, () => generateEuroMillionsPick());
    setPicks(newPicks);
  };

  return (
    <div className="container mx-auto py-8">
      <h1 className="text-3xl font-bold mb-6">EuroMillions Number Generator</h1>

      <div className="mb-6 flex items-end gap-4">
        <div>
          <label className="block text-sm font-medium mb-2" htmlFor="betsCount">
            Number of bets (max 5)
          </label>
          <input
            id="betsCount"
            type="number"
            min={1}
            max={5}
            value={betsCount}
            onChange={(e) => setBetsCount(Number(e.target.value))}
            className="w-32 rounded-md border border-gray-300 bg-white px-3 py-2 text-sm dark:border-gray-700 dark:bg-gray-900"
          />
        </div>

        <button
          onClick={handleGenerate}
          className="h-10 px-4 rounded-md bg-gray-900 text-white hover:bg-gray-800 dark:bg-gray-100 dark:text-black dark:hover:bg-white"
        >
          Generate
        </button>
      </div>

      {picks.length > 0 && (
        <div className="space-y-6">
          {picks.map((pick, idx) => (
            <div key={idx} className="rounded-lg border border-gray-200 p-4 dark:border-gray-800">
              <div className="mb-2 text-sm font-semibold">Bet {idx + 1}</div>
              <div className="mb-2">
                <h2 className="text-xl font-semibold">Numbers (5):</h2>
                <div className="mt-2 flex flex-wrap gap-2">
                  {pick.numbers.map((n) => (
                    <span key={n} className="inline-flex h-10 w-10 items-center justify-center rounded-full bg-blue-600 text-white">
                      {n}
                    </span>
                  ))}
                </div>
              </div>

              <div>
                <h2 className="text-xl font-semibold">Stars (2):</h2>
                <div className="mt-2 flex flex-wrap gap-2">
                  {pick.stars.map((s) => (
                    <span key={s} className="inline-flex h-10 w-10 items-center justify-center rounded-full bg-yellow-500 text-black">
                      {s}
                    </span>
                  ))}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

