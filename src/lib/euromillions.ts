// src/lib/euromillions.ts

/**
 * Generates a set of Euromillions numbers based on specified rules.
 *
 * Rules for main numbers:
 * - 5 unique numbers from 1 to 50.
 * - Odd/even split must be 2/3 or 3/2.
 * - High/low split must be 2/3 or 3/2 (low: 1-25, high: 26-50).
 *
 * Rules for star numbers:
 * - 2 unique numbers from 1 to 12.
 */

// --- Helper Functions ---

/**
 * Generates a random integer between min and max (inclusive).
 */
const getRandomInt = (min: number, max: number): number => {
  return Math.floor(Math.random() * (max - min + 1)) + min;
};

/**
 * Shuffles an array in place.
 */
const shuffleArray = <T>(array: T[]): T[] => {
  for (let i = array.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [array[i], array[j]] = [array[j], array[i]];
  }
  return array;
};

// --- Main Number Generation ---

const ALL_MAIN_NUMBERS = Array.from({ length: 50 }, (_, i) => i + 1);
const LOW_NUMBERS = ALL_MAIN_NUMBERS.filter(n => n <= 25);
const HIGH_NUMBERS = ALL_MAIN_NUMBERS.filter(n => n > 25);
const EVEN_NUMBERS = ALL_MAIN_NUMBERS.filter(n => n % 2 === 0);
const ODD_NUMBERS = ALL_MAIN_NUMBERS.filter(n => n % 2 !== 0);

/**
 * Generates the 5 main Euromillions numbers.
 */
const generateMainNumbers = (): number[] => {
  let mainNumbers: number[] = [];
  let attempts = 0;

  while (attempts < 1000) { // Safety break to avoid infinite loops
    mainNumbers = [];
    const shuffledNumbers = shuffleArray([...ALL_MAIN_NUMBERS]);
    const selectedNumbers = shuffledNumbers.slice(0, 5);

    const oddCount = selectedNumbers.filter(n => n % 2 !== 0).length;
    const highCount = selectedNumbers.filter(n => n > 25).length;

    const isOddEvenValid = oddCount === 2 || oddCount === 3;
    const isHighLowValid = highCount === 2 || highCount === 3;

    if (isOddEvenValid && isHighLowValid) {
      mainNumbers = selectedNumbers.sort((a, b) => a - b);
      break;
    }
    attempts++;
  }

  if (mainNumbers.length !== 5) {
    // Fallback to a less strict generation if the loop fails
    console.warn('Could not generate main numbers with perfect distribution. Falling back to random selection.');
    return shuffleArray([...ALL_MAIN_NUMBERS]).slice(0, 5).sort((a, b) => a - b);
  }

  return mainNumbers;
};

// --- Star Number Generation ---

const ALL_STAR_NUMBERS = Array.from({ length: 12 }, (_, i) => i + 1);

/**
 * Generates the 2 star (lucky star) Euromillions numbers.
 */
const generateStarNumbers = (): number[] => {
  const shuffledStars = shuffleArray([...ALL_STAR_NUMBERS]);
  return shuffledStars.slice(0, 2).sort((a, b) => a - b);
};

// --- Main Exported Function ---

export interface EuromillionsNumbers {
  main: number[];
  stars: number[];
}

/**
 * Generates a complete set of Euromillions numbers, including main numbers and stars.
 */
export const generateEuromillionsNumbers = (): EuromillionsNumbers => {
  return {
    main: generateMainNumbers(),
    stars: generateStarNumbers(),
  };
};
