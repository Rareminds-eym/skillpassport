import { lazy, useMemo } from 'react';

/**
 * Hook for creating lazy components with enhanced error handling
 */
export const useLazyComponent = (importFn, options = {}) => {
  const { preload = false, retries = 2 } = options;
  
  const LazyComponent = useMemo(() => {
    return lazy(() => {
      let attempt = 0;
      
      const loadWithRetry = async () => {
        try {
          return await importFn();
        } catch (error) {
          attempt++;
          
          if (attempt <= retries) {
            const delay = 1000 * Math.pow(2, attempt - 1);
            await new Promise(resolve => setTimeout(resolve, delay));
            return loadWithRetry();
          }
          
          console.error(`Failed to load component after ${retries} retries:`, error);
          throw error;
        }
      };
      
      return loadWithRetry();
    });
  }, [importFn, retries]);
  
  // Preload if requested
  useMemo(() => {
    if (preload) {
      importFn().catch(() => {
        // Silently handle preload failures
      });
    }
  }, [importFn, preload]);
  
  return LazyComponent;
};