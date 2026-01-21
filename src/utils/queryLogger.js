/**
 * Conditional Logger for React Query
 * Only logs in development mode
 */

const isDevelopment = import.meta.env.MODE === 'development';

export const queryLogger = {
  log: (...args) => {
    if (isDevelopment) {
    }
  },
  error: (...args) => {
    // Always log errors
    console.error(...args);
  },
  warn: (...args) => {
    if (isDevelopment) {
    }
  },
  info: (...args) => {
    if (isDevelopment) {
      console.info(...args);
    }
  },
};
