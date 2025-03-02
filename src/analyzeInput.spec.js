import {
  getFrequencyRange,
  getAmplitudeData,
  getMedianFrequency,
  checkNoteMatch,
} from "./analyzeInput";

describe("getFrequencyRange", () => {
  test("should calculate correct frequency range", () => {
    const result = getFrequencyRange(4096, 44100);

    expect(result.lowIndex).toBe(Math.floor((80 * 4096) / 44100));
    expect(result.highIndex).toBe(Math.floor((5000 * 4096) / 44100));
  });
});

describe("getAmplitudeData", () => {
  test("should find maximum amplitude and calculate average", () => {
    const dataArray = new Uint8Array([10, 20, 30, 40, 50, 40, 30, 20, 10]);
    const frequencyRange = { lowIndex: 2, highIndex: 6 };

    const result = getAmplitudeData(dataArray, frequencyRange);

    expect(result.maxValue).toBe(50);
    expect(result.maxIndex).toBe(4);
    expect(result.averageAmplitude).toBe(38); // (30+40+50+40+30)/5 = 38
  });
});

describe("checkNoteMatch", () => {
  test("should match when frequencies are very close", () => {
    const result = checkNoteMatch(440, 440);

    expect(result.isMatch).toBe(true);
    expect(Math.abs(result.centsOff)).toBeLessThan(0.1);
  });

  test("should match when frequencies are within threshold", () => {
    // About 20 cents higher (threshold is 25 cents)
    const result = checkNoteMatch(445, 440);

    expect(result.isMatch).toBe(true);
    expect(result.centsOff).toBeGreaterThan(0);
    expect(result.direction).toBe("too high");
  });

  test("should not match when frequencies are outside threshold", () => {
    // About 50 cents higher (threshold is 25 cents)
    const result = checkNoteMatch(452, 440);

    expect(result.isMatch).toBe(false);
    expect(Math.abs(result.centsOff)).toBeGreaterThan(25);
    expect(result.direction).toBe("too high");
  });
});

describe("getMedianFrequency", () => {
  test("should calculate median of recent frequencies", () => {
    // Create a copy of an empty array to avoid modifying the module state
    const emptyArray = [];

    // Test with a few values
    const result1 = getMedianFrequency(emptyArray, 440);
    expect(result1).toBe(440);

    const result2 = getMedianFrequency([440], 445);
    expect(result2).toBe(442.5); // Median of [440, 445]

    const result3 = getMedianFrequency([440, 445], 442);
    expect(result3).toBe(442); // Median of [440, 442, 445]
  });

  test("should maintain maximum array size", () => {
    // Create an array with MAX_RECENT_FREQUENCIES elements
    const fullArray = [440, 442, 444, 446, 448];

    // Add one more frequency
    const result = getMedianFrequency(fullArray, 450);

    // Should drop oldest (440) and add 450
    // Median of [442, 444, 446, 448, 450] is 446
    expect(result).toBe(446);
  });
});
