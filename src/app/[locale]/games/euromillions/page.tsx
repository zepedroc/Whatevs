'use client';

import { useState } from 'react';

import { generateEuroMillionsPick, validateEuroMillionsPick } from '@/lib/euromillions';

export default function EuroMillionsPage() {
  const [pick, setPick] = useState(() => generateEuroMillionsPick());

  const handleGenerate = () => {
    const newPick = generateEuroMillionsPick();
    setPick(newPick);
  };

  const isValid = validateEuroMillionsPick(pick);

  return (
    <div className="container mx-auto py-8">
      <h1 className="text-3xl font-bold mb-6">EuroMillions Number Generator</h1>

      <div className="mb-6 space-y-4">
        <div>
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

        <div className="text-sm text-gray-600 dark:text-gray-300">Valid according to rules: {isValid ? 'Yes' : 'No'}</div>
      </div>

      <button
        onClick={handleGenerate}
        className="py-2 px-4 rounded-md bg-gray-900 text-white hover:bg-gray-800 dark:bg-gray-100 dark:text-black dark:hover:bg-white"
      >
        Generate Again
      </button>
    </div>
  );
}

