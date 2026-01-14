module.exports = {
  preset: "jest-expo",
  testMatch: ["**/__tests__/**/*.test.{js,jsx,ts,tsx}"],
  setupFilesAfterEnv: ["<rootDir>/jest.setup.js"],
  transformIgnorePatterns: [
    "node_modules/(?!(jest-)?react-native|@react-native|@react-navigation|expo(nent)?|expo-router|@expo|react-native-reanimated|react-native-gesture-handler|react-native-safe-area-context)",
  ],
};

