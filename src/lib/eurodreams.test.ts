import { describe, expect, it } from 'vitest';

import { generateEuroDreamsPick, validateEuroDreamsPick } from './eurodreams';

describe('EuroDreams generator', () => {
  it('generates 6 numbers in range and 1 dream in range', () => {
    const pick = generateEuroDreamsPick();
    expect(pick.numbers).toHaveLength(6);
    expect(new Set(pick.numbers).size).toBe(6);
    pick.numbers.forEach((n) => expect(n >= 1 && n <= 40).toBe(true));

    expect(pick.dream >= 1 && pick.dream <= 5).toBe(true);
  });

  it('follows roughly 3:3 or 4:2 odd/even split', () => {
    const pick = generateEuroDreamsPick();
    const odd = pick.numbers.filter((n) => n % 2 === 1).length;
    const even = 6 - odd;
    expect([odd === 3 && even === 3, odd === 4 && even === 2].some(Boolean)).toBe(true);
  });

  it('has 3 low (1-20) and 3 high (21-40)', () => {
    const pick = generateEuroDreamsPick();
    const low = pick.numbers.filter((n) => n <= 20).length;
    const high = 6 - low;
    expect(low).toBe(3);
    expect(high).toBe(3);
  });

  it('validate function returns true for generated picks', () => {
    const pick = generateEuroDreamsPick();
    expect(validateEuroDreamsPick(pick)).toBe(true);
  });

  it('validate function catches invalid picks', () => {
    expect(validateEuroDreamsPick({ numbers: [0, 2, 3, 4, 5, 6], dream: 1 })).toBe(false);
    expect(validateEuroDreamsPick({ numbers: [1, 2, 3, 4, 5, 6], dream: 0 })).toBe(false);
    expect(validateEuroDreamsPick({ numbers: [1, 2, 3, 4, 4, 6], dream: 1 })).toBe(false);
  });
});

