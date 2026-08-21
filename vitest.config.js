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
    watch: false,
    passWithNoTests: false,
    isolate: true,
    fileParallelism: false,
    maxWorkers: 1,
    minWorkers: 1,
    retry: 0,
    allowOnly: false,
    sequence: { shuffle: false },
    fakeTimers: { shouldAdvanceTime: false },
    pool: 'forks', // Use forks instead of threads to avoid tinypool ESM resolution bug
    exclude: [
      '**/node_modules/**',
      '**/dist/**',
      '**/.migration-backups/**',
      '**/backup-*/**'
    ]
  },
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
      'jose': path.resolve(__dirname, './node_modules/jose'),
      '@rareminds-eym/auth-core/internal': path.resolve(__dirname, '../skill-echosystem-packages/auth-core/dist/internal.js'),
      '@rareminds-eym/auth-core': path.resolve(__dirname, '../skill-echosystem-packages/auth-core/dist/index.js'),
      '@rareminds-eym/sso-gateway': path.resolve(__dirname, '../skill-echosystem-packages/sso-gateway/dist/index.js'),
      '@rareminds-eym/entitlements': path.resolve(__dirname, '../skill-echosystem-packages/entitlements/dist/index.js'),
    },
  },
});
