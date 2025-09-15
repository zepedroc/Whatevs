'use client';

import { useState, useEffect } from 'react';
import { generateEuromillionsNumbers, EuromillionsNumbers } from '@/lib/euromillions';
import { Button } from '@/components/ui/button';

const EuromillionsGame = () => {
  const [numbers, setNumbers] = useState<EuromillionsNumbers | null>(null);

  const generateNumbers = () => {
    const newNumbers = generateEuromillionsNumbers();
    setNumbers(newNumbers);
  };

  useEffect(() => {
    generateNumbers();
  }, []);

  return (
    <div className="w-full max-w-md mx-auto">
      <div className="bg-white dark:bg-gray-800 shadow-lg rounded-lg p-6">
        <div className="text-center mb-6">
          <h2 className="text-2xl font-bold text-gray-800 dark:text-white">Euromillions Numbers</h2>
          <p className="text-gray-500 dark:text-gray-400">Your lucky pick for the next draw!</p>
        </div>

        {numbers && (
          <div className="flex flex-col items-center">
            {/* Main Numbers */}
            <div className="mb-6">
              <h3 className="text-lg font-semibold text-gray-700 dark:text-gray-300 mb-3">Main Numbers</h3>
              <div className="flex justify-center gap-2">
                {numbers.main.map((num) => (
                  <div
                    key={num}
                    className="w-12 h-12 flex items-center justify-center bg-blue-500 text-white font-bold text-xl rounded-full"
                  >
                    {num}
                  </div>
                ))}
              </div>
            </div>

            {/* Star Numbers */}
            <div className="mb-8">
              <h3 className="text-lg font-semibold text-gray-700 dark:text-gray-300 mb-3">Lucky Stars</h3>
              <div className="flex justify-center gap-3">
                {numbers.stars.map((star) => (
                  <div
                    key={star}
                    className="w-12 h-12 flex items-center justify-center bg-yellow-400 text-gray-800 font-bold text-xl rounded-full star-shape"
                  >
                    {star}
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        <div className="text-center">
          <Button onClick={generateNumbers} className="bg-green-500 hover:bg-green-600 text-white font-bold py-3 px-6 rounded-lg">
            Generate New Numbers
          </Button>
        </div>
      </div>
    </div>
  );
};

export default EuromillionsGame;
