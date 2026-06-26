import { defineConfig } from 'vitest/config';
import react from '@vitejs/plugin-react';
import path from 'path';

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
    ]
  },
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
});
