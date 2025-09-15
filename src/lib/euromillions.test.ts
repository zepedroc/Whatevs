// src/lib/euromillions.test.ts

import * as assert from 'assert';
import { generateEuromillionsNumbers } from './euromillions';

// --- Test Suite for Euromillions Number Generation ---

const runTests = () => {
  console.log('Running Euromillions tests...');

  // Test 1: Main numbers and stars are generated
  try {
    const result = generateEuromillionsNumbers();
    assert.ok(result.main, 'Test 1.1 Failed: Main numbers should be generated.');
    assert.ok(result.stars, 'Test 1.2 Failed: Star numbers should be generated.');
    console.log('✔ Test 1 Passed: Numbers are generated.');
  } catch (e) {
    console.error('✖ Test 1 Failed:', e);
  }

  // Test 2: Correct number of main and star numbers
  try {
    const { main, stars } = generateEuromillionsNumbers();
    assert.strictEqual(main.length, 5, 'Test 2.1 Failed: Should have 5 main numbers.');
    assert.strictEqual(stars.length, 2, 'Test 2.2 Failed: Should have 2 star numbers.');
    console.log('✔ Test 2 Passed: Correct number of balls.');
  } catch (e) {
    console.error('✖ Test 2 Failed:', e);
  }

  // Test 3: Main numbers are unique
  try {
    const { main } = generateEuromillionsNumbers();
    const uniqueMain = new Set(main);
    assert.strictEqual(uniqueMain.size, 5, 'Test 3 Failed: Main numbers should be unique.');
    console.log('✔ Test 3 Passed: Main numbers are unique.');
  } catch (e) {
    console.error('✖ Test 3 Failed:', e);
  }

  // Test 4: Star numbers are unique
  try {
    const { stars } = generateEuromillionsNumbers();
    const uniqueStars = new Set(stars);
    assert.strictEqual(uniqueStars.size, 2, 'Test 4 Failed: Star numbers should be unique.');
    console.log('✔ Test 4 Passed: Star numbers are unique.');
  } catch (e) {
    console.error('✖ Test 4 Failed:', e);
  }

  // Test 5: Main numbers are within the correct range (1-50)
  try {
    const { main } = generateEuromillionsNumbers();
    const areMainInRange = main.every(n => n >= 1 && n <= 50);
    assert.ok(areMainInRange, 'Test 5 Failed: Main numbers should be between 1 and 50.');
    console.log('✔ Test 5 Passed: Main numbers are in range.');
  } catch (e) {
    console.error('✖ Test 5 Failed:', e);
  }

  // Test 6: Star numbers are within the correct range (1-12)
  try {
    const { stars } = generateEuromillionsNumbers();
    const areStarsInRange = stars.every(n => n >= 1 && n <= 12);
    assert.ok(areStarsInRange, 'Test 6 Failed: Star numbers should be between 1 and 12.');
    console.log('✔ Test 6 Passed: Star numbers are in range.');
  } catch (e) {
    console.error('✖ Test 6 Failed:', e);
  }

  // Test 7: Main numbers have a valid odd/even split (2/3 or 3/2)
  try {
    const { main } = generateEuromillionsNumbers();
    const oddCount = main.filter(n => n % 2 !== 0).length;
    const isSplitValid = oddCount === 2 || oddCount === 3;
    assert.ok(isSplitValid, `Test 7 Failed: Invalid odd/even split (found ${oddCount} odd numbers).`);
    console.log('✔ Test 7 Passed: Valid odd/even split.');
  } catch (e) {
    console.error('✖ Test 7 Failed:', e);
  }

  // Test 8: Main numbers have a valid high/low split (2/3 or 3/2)
  try {
    const { main } = generateEuromillionsNumbers();
    const highCount = main.filter(n => n > 25).length;
    const isSplitValid = highCount === 2 || highCount === 3;
    assert.ok(isSplitValid, `Test 8 Failed: Invalid high/low split (found ${highCount} high numbers).`);
    console.log('✔ Test 8 Passed: Valid high/low split.');
  } catch (e) {
    console.error('✖ Test 8 Failed:', e);
  }

  // Test 9: Main numbers are sorted
  try {
    const { main } = generateEuromillionsNumbers();
    const sortedMain = [...main].sort((a, b) => a - b);
    assert.deepStrictEqual(main, sortedMain, 'Test 9 Failed: Main numbers should be sorted.');
    console.log('✔ Test 9 Passed: Main numbers are sorted.');
  } catch (e) {
    console.error('✖ Test 9 Failed:', e);
  }

  // Test 10: Star numbers are sorted
  try {
    const { stars } = generateEuromillionsNumbers();
    const sortedStars = [...stars].sort((a, b) => a - b);
    assert.deepStrictEqual(stars, sortedStars, 'Test 10 Failed: Star numbers should be sorted.');
    console.log('✔ Test 10 Passed: Star numbers are sorted.');
  } catch (e) {
    console.error('✖ Test 10 Failed:', e);
  }

  console.log('All Euromillions tests completed.');
};

// Execute the tests
runTests();
