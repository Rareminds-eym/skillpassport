import { useState, useCallback } from 'react';

// Mock API configuration
const MOCK_LATENCY_MS = 500; // Simulate network delay
const ERROR_RATE = 0; // 0% error rate for now (can be increased for testing)

export interface MockApiOptions {
  latency?: number;
  shouldError?: boolean;
}

export interface MockApiResponse<T> {
  data: T | null;
  error: string | null;
  loading: boolean;
}

/**
 * Custom hook for mocking API calls with realistic behavior
 * Simulates network latency and can simulate errors
 */
export const useMockApi = <T = any>() => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [data, setData] = useState<T | null>(null);

  const execute = useCallback(
    async (apiFunction: () => T | Promise<T>, options: MockApiOptions = {}): Promise<T> => {
      const { latency = MOCK_LATENCY_MS, shouldError = false } = options;

      setLoading(true);
      setError(null);

      try {
        // Simulate network latency
        await new Promise((resolve) => setTimeout(resolve, latency));

        // Simulate random errors if configured
        if (shouldError || Math.random() < ERROR_RATE) {
          throw new Error('Mock API Error: Request failed');
        }

        // Execute the mock API function
        const result = await Promise.resolve(apiFunction());
        setData(result);
        setLoading(false);
        return result;
      } catch (err) {
        const errorMessage = err instanceof Error ? err.message : 'Unknown error';
        setError(errorMessage);
        setLoading(false);
        throw err;
      }
    },
    []
  );

  const reset = useCallback(() => {
    setData(null);
    setError(null);
    setLoading(false);
  }, []);

  return { data, error, loading, execute, reset };
};

/**
 * Utility function to create a mock API call
 */
export const mockApiCall = async <T>(data: T, options: MockApiOptions = {}): Promise<T> => {
  const { latency = MOCK_LATENCY_MS, shouldError = false } = options;

  await new Promise((resolve) => setTimeout(resolve, latency));

  if (shouldError || Math.random() < ERROR_RATE) {
    throw new Error('Mock API Error: Request failed');
  }

  return data;
};
