/**
 * Jest Configuration for Puppeteer E2E Tests
 */

module.exports = {
  preset: 'ts-jest',
  testEnvironment: 'node',
  testMatch: ['**/*.spec.ts'],
  testTimeout: 120000, // 2 minutes per test
  verbose: true,
  bail: false, // Continue running tests even if one fails
  maxWorkers: 1, // Run tests serially to avoid conflicts
  setupFilesAfterEnv: ['<rootDir>/setup.ts'],
  watchman: false, // Disable watchman to avoid errors
  globals: {
    'ts-jest': {
      tsconfig: {
        esModuleInterop: true,
        allowSyntheticDefaultImports: true
      }
    }
  }
};
