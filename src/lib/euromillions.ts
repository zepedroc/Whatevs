export type EuroMillionsPick = {
  numbers: number[]; // 5 unique numbers 1-50
  stars: number[]; // 2 unique numbers 1-12
};

function getRandomIntInclusive(min: number, max: number): number {
  const minCeil = Math.ceil(min);
  const maxFloor = Math.floor(max);
  return Math.floor(Math.random() * (maxFloor - minCeil + 1)) + minCeil;
}

function shuffle<T>(arr: T[]): T[] {
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
}

function pickUnique(from: number[], count: number): number[] {
  if (count > from.length) throw new Error('Not enough numbers to pick from');
  const pool = [...from];
  shuffle(pool);
  return pool.slice(0, count).sort((a, b) => a - b);
}

function generateOddEvenSplit(): { oddCount: number; evenCount: number } {
  const isThreeOdds = Math.random() < 0.5;
  return isThreeOdds ? { oddCount: 3, evenCount: 2 } : { oddCount: 2, evenCount: 3 };
}

function generateHighLowTargets(): { lowCount: number; highCount: number } {
  const options: Array<{ low: number; high: number }> = [
    { low: 2, high: 3 },
    { low: 3, high: 2 },
  ];
  const choice = options[getRandomIntInclusive(0, options.length - 1)];
  return { lowCount: choice.low, highCount: choice.high };
}

export function generateEuroMillionsPick(): EuroMillionsPick {
  const lowNumbers = Array.from({ length: 25 }, (_, i) => i + 1);
  const highNumbers = Array.from({ length: 25 }, (_, i) => i + 26);
  const oddLow = lowNumbers.filter((n) => n % 2 === 1);
  const evenLow = lowNumbers.filter((n) => n % 2 === 0);
  const oddHigh = highNumbers.filter((n) => n % 2 === 1);
  const evenHigh = highNumbers.filter((n) => n % 2 === 0);

  const { oddCount, evenCount } = generateOddEvenSplit();
  const { lowCount, highCount } = generateHighLowTargets();

  for (let attempt = 0; attempt < 100; attempt++) {
    const lowOddTarget = Math.max(0, Math.min(oddCount, getRandomIntInclusive(0, lowCount)));
    const lowEvenTarget = lowCount - lowOddTarget;
    const highOddTarget = oddCount - lowOddTarget;
    const highEvenTarget = evenCount - lowEvenTarget;

    const isFeasible =
      lowOddTarget >= 0 &&
      lowEvenTarget >= 0 &&
      highOddTarget >= 0 &&
      highEvenTarget >= 0 &&
      lowOddTarget <= oddLow.length &&
      lowEvenTarget <= evenLow.length &&
      highOddTarget <= oddHigh.length &&
      highEvenTarget <= evenHigh.length;

    if (!isFeasible) continue;

    try {
      const chosenLowOdd = pickUnique(oddLow, lowOddTarget);
      const chosenLowEven = pickUnique(evenLow, lowEvenTarget);
      const chosenHighOdd = pickUnique(oddHigh, highOddTarget);
      const chosenHighEven = pickUnique(evenHigh, highEvenTarget);

      const numbers = [...chosenLowOdd, ...chosenLowEven, ...chosenHighOdd, ...chosenHighEven]
        .sort((a, b) => a - b);

      if (numbers.length !== 5) continue;

      const starsPool = Array.from({ length: 12 }, (_, i) => i + 1);
      const stars = pickUnique(starsPool, 2);

      return { numbers, stars };
    } catch {
      continue;
    }
  }

  throw new Error('Failed to generate a valid EuroMillions pick');
}

export function validateEuroMillionsPick(pick: EuroMillionsPick): boolean {
  if (pick.numbers.length !== 5) return false;
  if (new Set(pick.numbers).size !== 5) return false;
  if (pick.numbers.some((n) => n < 1 || n > 50)) return false;

  if (pick.stars.length !== 2) return false;
  if (new Set(pick.stars).size !== 2) return false;
  if (pick.stars.some((n) => n < 1 || n > 12)) return false;

  const oddCount = pick.numbers.filter((n) => n % 2 === 1).length;
  const evenCount = 5 - oddCount;
  if (!((oddCount === 3 && evenCount === 2) || (oddCount === 2 && evenCount === 3))) return false;

  const lowCount = pick.numbers.filter((n) => n <= 25).length;
  const highCount = 5 - lowCount;
  if (!((lowCount === 2 && highCount === 3) || (lowCount === 3 && highCount === 2))) return false;

  return true;
}

