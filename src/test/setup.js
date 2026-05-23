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

// Mock window.matchMedia for GSAP and responsive UI components
if (typeof window !== 'undefined') {
  Object.defineProperty(window, 'matchMedia', {
    writable: true,
    value: vi.fn().mockImplementation(query => ({
      matches: false,
      media: query,
      onchange: null,
      addListener: vi.fn(), // deprecated
      removeListener: vi.fn(), // deprecated
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
      dispatchEvent: vi.fn(),
    })),
  });
}

