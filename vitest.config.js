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
    exclude: [
      '**/node_modules/**',
      '**/dist/**',
      '**/.wrangler/**',
      '**/.venv/**',
      '**/docs/**',
      '**/public/**',
      '**/.kiro/**',
      '**/.bolt/**',
      '**/.claude/**',
      '**/.emergent/**',
      '**/.zenflow/**',
      'package-lock.json',
      '*.lock',
    ],
  },
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
});
