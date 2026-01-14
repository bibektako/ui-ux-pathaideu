// Simple fuzzy matching for address/city matching
// For more advanced matching, you could use rapidfuzz or similar

function normalizeString(str) {
  return str.toLowerCase().trim().replace(/[^\w\s]/g, '');
}

function levenshteinDistance(str1, str2) {
  const s1 = normalizeString(str1);
  const s2 = normalizeString(str2);
  
  const matrix = [];
  for (let i = 0; i <= s2.length; i++) {
    matrix[i] = [i];
  }
  for (let j = 0; j <= s1.length; j++) {
    matrix[0][j] = j;
  }
  
  for (let i = 1; i <= s2.length; i++) {
    for (let j = 1; j <= s1.length; j++) {
      if (s2.charAt(i - 1) === s1.charAt(j - 1)) {
        matrix[i][j] = matrix[i - 1][j - 1];
      } else {
        matrix[i][j] = Math.min(
          matrix[i - 1][j - 1] + 1,
          matrix[i][j - 1] + 1,
          matrix[i - 1][j] + 1
        );
      }
    }
  }
  
  return matrix[s2.length][s1.length];
}

function similarity(str1, str2) {
  const maxLen = Math.max(str1.length, str2.length);
  if (maxLen === 0) return 1;
  const distance = levenshteinDistance(str1, str2);
  return 1 - (distance / maxLen);
}

function fuzzyMatch(str1, str2, threshold = 0.7) {
  return similarity(str1, str2) >= threshold;
}

function matchCity(city1, city2) {
  return fuzzyMatch(city1, city2, 0.6);
}

module.exports = {
  normalizeString,
  levenshteinDistance,
  similarity,
  fuzzyMatch,
  matchCity
};




















