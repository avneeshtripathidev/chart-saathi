module.exports = {
  preset: 'ts-jest',
  testEnvironment: 'node',
  transform: {
    '^.+\\.tsx?$': ['ts-jest', { tsconfig: { jsx: 'react', esModuleInterop: true } }],
  },
  moduleNameMapper: {
    '^react-native$': '<rootDir>/tests/mocks/react-native.js',
  },
  testMatch: ['**/tests/**/*.test.ts'],
};
