/**
 * Vitest Test Setup
 * 
 * This file is loaded before each test file runs.
 * It sets up the testing environment and global configurations.
 */

import '@testing-library/jest-dom';

// Mock import.meta.env for tests
if (typeof import.meta.env === 'undefined') {
  globalThis.import = {
    meta: {
      env: {
        VITE_SUPABASE_URL: 'https://test.supabase.co',
        VITE_SUPABASE_ANON_KEY: 'test-anon-key',
        VITE_GEMINI_API_KEY: 'test-gemini-key'
      }
    }
  };
}
