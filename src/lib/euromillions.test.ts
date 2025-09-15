import { describe, expect, it } from 'vitest';

import { generateEuroMillionsPick, validateEuroMillionsPick } from './euromillions';

describe('EuroMillions generator', () => {
  it('generates 5 main numbers in range and 2 stars in range', () => {
    const pick = generateEuroMillionsPick();
    expect(pick.numbers).toHaveLength(5);
    expect(new Set(pick.numbers).size).toBe(5);
    pick.numbers.forEach((n) => expect(n >= 1 && n <= 50).toBe(true));

    expect(pick.stars).toHaveLength(2);
    expect(new Set(pick.stars).size).toBe(2);
    pick.stars.forEach((s) => expect(s >= 1 && s <= 12).toBe(true));
  });

  it('follows 3/2 or 2/3 odd/even split', () => {
    const pick = generateEuroMillionsPick();
    const odd = pick.numbers.filter((n) => n % 2 === 1).length;
    const even = 5 - odd;
    expect([odd === 3 && even === 2, odd === 2 && even === 3].some(Boolean)).toBe(true);
  });

  it('aims for 2–3 low (1–25) and 2–3 high (26–50)', () => {
    const pick = generateEuroMillionsPick();
    const low = pick.numbers.filter((n) => n <= 25).length;
    const high = 5 - low;
    expect([low === 2 && high === 3, low === 3 && high === 2].some(Boolean)).toBe(true);
  });

  it('validate function returns true for generated picks', () => {
    const pick = generateEuroMillionsPick();
    expect(validateEuroMillionsPick(pick)).toBe(true);
  });

  it('validate function catches invalid picks', () => {
    expect(validateEuroMillionsPick({ numbers: [0, 2, 3, 4, 5], stars: [1, 2] })).toBe(false);
    expect(validateEuroMillionsPick({ numbers: [1, 2, 3, 4, 5], stars: [0, 2] })).toBe(false);
    expect(validateEuroMillionsPick({ numbers: [1, 2, 3, 4, 4], stars: [1, 2] })).toBe(false);
  });
});
