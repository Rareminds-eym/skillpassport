import react from '@vitejs/plugin-react';
import path from 'path';
import { defineConfig } from 'vitest/config';

export default defineConfig({
  plugins: [react()],
  test: {
    globals: true,
    environment: 'jsdom',
    setupFiles: './src/test/setup.js',
    testTimeout: 120000, // 120 seconds for E2E tests
    pool: 'forks', // Use forks instead of threads to avoid tinypool ESM resolution bug
    exclude: [
      '**/node_modules/**',
      '**/dist/**',
      '**/.migration-backups/**',
      '**/backup-*/**'
    ],
    coverage: {
      provider: 'v8',
      reporter: ['text', 'json', 'html', 'lcov'],
      statements: 80,
      branches: 75,
      functions: 85,
      lines: 80,
      exclude: [
        'node_modules/',
        '**/__tests__/**',
        '**/*.test.ts',
        '**/*.test.tsx',
        '**/*.spec.ts',
        '**/*.spec.tsx',
        '**/dist/**',
        '**/.migration-backups/**',
        '**/backup-*/**',
        '**/test/**',
        '**/vitest.config.js'
      ]
    }
  },
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
});
