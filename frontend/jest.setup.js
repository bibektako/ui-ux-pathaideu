// @testing-library/react-native adds helpful matchers automatically via jest-expo
// React Native internal paths change across versions; guard this mock.
try {
  // eslint-disable-next-line jest/no-jest-import
  jest.mock("react-native/Libraries/Animated/NativeAnimatedHelper");
} catch (e) {
  // ignore
}

// AsyncStorage mock for tests
jest.mock("@react-native-async-storage/async-storage", () =>
  require("@react-native-async-storage/async-storage/jest/async-storage-mock")
);

