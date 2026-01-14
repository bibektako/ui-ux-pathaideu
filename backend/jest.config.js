module.exports = {
  testEnvironment: "node",
  clearMocks: true,
  restoreMocks: true,
  resetMocks: true,
  testMatch: ["**/__tests__/**/*.test.js"],
  collectCoverageFrom: [
    "routes/**/*.js",
    "services/**/*.js",
    "utils/**/*.js",
    "middleware/**/*.js",
    "!**/node_modules/**",
  ],
};
