import { lazy, useMemo, useEffect } from 'react';
import { getLogger } from '@/shared/config/logging';

const logger = getLogger('useLazyComponent');

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
          
          logger.error(`Failed to load component after ${retries} retries:`, error);
          throw error;
        }
      };
      
      return loadWithRetry();
    });
  }, [importFn, retries]);
  
  // Preload if requested — useEffect is correct here (side effect, not derived value)
  useEffect(() => {
    if (preload) {
      importFn().catch(() => {
        // Silently handle preload failures
      });
    }
  }, [importFn, preload]);
  
  return LazyComponent;
};