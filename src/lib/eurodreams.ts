export type EuroDreamsPick = {
  numbers: number[]; // 6 unique numbers 1-40
  dream: number; // 1 number 1-5
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
  const chooseFourOdds = Math.random() < 0.5; // 50/50 between 3/3 and 4/2
  return chooseFourOdds ? { oddCount: 4, evenCount: 2 } : { oddCount: 3, evenCount: 3 };
}

export function generateEuroDreamsPick(): EuroDreamsPick {
  const lowNumbers = Array.from({ length: 20 }, (_, i) => i + 1); // 1-20
  const highNumbers = Array.from({ length: 20 }, (_, i) => i + 21); // 21-40
  const oddLow = lowNumbers.filter((n) => n % 2 === 1);
  const evenLow = lowNumbers.filter((n) => n % 2 === 0);
  const oddHigh = highNumbers.filter((n) => n % 2 === 1);
  const evenHigh = highNumbers.filter((n) => n % 2 === 0);

  const { oddCount, evenCount } = generateOddEvenSplit();
  const lowCount = 3; // enforce 3 low and 3 high

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

      const numbers = [...chosenLowOdd, ...chosenLowEven, ...chosenHighOdd, ...chosenHighEven].sort((a, b) => a - b);

      if (numbers.length !== 6) continue;

      const dream = getRandomIntInclusive(1, 5);

      return { numbers, dream };
    } catch {
      continue;
    }
  }

  throw new Error('Failed to generate a valid EuroDreams pick');
}

export function validateEuroDreamsPick(pick: EuroDreamsPick): boolean {
  if (pick.numbers.length !== 6) return false;
  if (new Set(pick.numbers).size !== 6) return false;
  if (pick.numbers.some((n) => n < 1 || n > 40)) return false;

  if (!(pick.dream >= 1 && pick.dream <= 5)) return false;

  const oddCount = pick.numbers.filter((n) => n % 2 === 1).length;
  const evenCount = 6 - oddCount;
  if (!((oddCount === 3 && evenCount === 3) || (oddCount === 4 && evenCount === 2))) return false;

  const lowCount = pick.numbers.filter((n) => n <= 20).length;
  const highCount = 6 - lowCount;
  if (!(lowCount === 3 && highCount === 3)) return false;

  return true;
}

