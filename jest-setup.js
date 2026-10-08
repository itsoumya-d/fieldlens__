// Jest has no UI runtime. Use the SDK-aligned package's own animation mock;
// component tests cover rendering/interaction, not native animation execution.
jest.mock('react-native-reanimated', () => require('react-native-reanimated/mock'));
jest.mock('react-native-worklets', () => require('react-native-worklets/src/mock'));
