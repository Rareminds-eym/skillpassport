import { lazy } from 'react';
import { getLogger } from '@/shared/config/logging';

const logger = getLogger('lazy-loading');

/**
 * Enhanced lazy loading utilities with proper error handling and retries
 */

// Retry configuration
const DEFAULT_RETRY_CONFIG = {
  retries: 3,
  retryDelay: 1000,
  exponentialBackoff: true
};

/**
 * Create a lazy component with retry logic and error handling
 */
export const createLazyComponent = (importFn, config = {}) => {
  const { retries, retryDelay, exponentialBackoff } = { ...DEFAULT_RETRY_CONFIG, ...config };
  
  return lazy(() => {
    let attempt = 0;
    
    const loadWithRetry = async () => {
      try {
        return await importFn();
      } catch (error) {
        attempt++;
        
        if (attempt <= retries) {
          const delay = exponentialBackoff 
            ? retryDelay * Math.pow(2, attempt - 1)
            : retryDelay;
            
          await new Promise(resolve => setTimeout(resolve, delay));
          return loadWithRetry();
        }
        
        logger.error(`Failed to load component after ${retries} retries:`, error);
        throw error;
      }
    };
    
    return loadWithRetry();
  });
};

/**
 * Preload a component for better UX
 */
export const preloadComponent = (importFn) => {
  const componentImport = importFn();
  
  // Don't throw errors for preloading
  componentImport.catch(error => {
    logger.warn('Component preload failed:', error);
  });
  
  return componentImport;
};

/**
 * Create lazy components for common patterns
 */
export const createLazyPage = (importFn) => createLazyComponent(importFn, { retries: 2 });
export const createLazyWidget = (importFn) => createLazyComponent(importFn, { retries: 1 });
export const createLazyModal = (importFn) => createLazyComponent(importFn, { retries: 1 });

/**
 * Batch preload multiple components
 */
export const preloadComponents = (importFunctions) => {
  return Promise.allSettled(
    importFunctions.map(importFn => preloadComponent(importFn))
  );
};