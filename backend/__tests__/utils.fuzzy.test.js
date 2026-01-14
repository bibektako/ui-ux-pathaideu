const {
  normalizeString,
  levenshteinDistance,
  similarity,
  fuzzyMatch,
  matchCity,
} = require("../utils/fuzzy");

describe("utils/fuzzy", () => {
  test("normalizeString lowercases + trims", () => {
    expect(normalizeString("  HeLLo  ")).toBe("hello");
  });

  test("normalizeString strips punctuation", () => {
    expect(normalizeString("Kathmandu, Nepal!")).toBe("kathmandu nepal");
  });

  test("levenshteinDistance is 0 for identical strings (case-insensitive)", () => {
    expect(levenshteinDistance("City", "city")).toBe(0);
  });

  test("levenshteinDistance counts edits", () => {
    expect(levenshteinDistance("kitten", "sitting")).toBe(3);
  });

  test("similarity returns 1 for empty strings", () => {
    expect(similarity("", "")).toBe(1);
  });

  test("similarity is between 0 and 1", () => {
    const s = similarity("abc", "xyz");
    expect(s).toBeGreaterThanOrEqual(0);
    expect(s).toBeLessThanOrEqual(1);
  });

  test("fuzzyMatch passes for close matches by default threshold", () => {
    expect(fuzzyMatch("kathmandu", "kathmndu")).toBe(true);
  });

  test("fuzzyMatch fails when below threshold", () => {
    expect(fuzzyMatch("kathmandu", "pokhara", 0.9)).toBe(false);
  });

  test("matchCity uses a looser threshold (0.6)", () => {
    expect(matchCity("New York", "NewYork")).toBe(true);
  });

  test("matchCity rejects very different cities", () => {
    expect(matchCity("Kathmandu", "London")).toBe(false);
  });
});

