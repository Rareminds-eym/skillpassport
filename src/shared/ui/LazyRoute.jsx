import React, { Suspense, lazy } from 'react';
import { PageSkeleton, DashboardSkeleton, CardSkeleton } from './skeletons';

/**
 * Optimized lazy route component with proper error boundaries and fallbacks
 */
const LazyRoute = ({ 
  importFn, 
  fallback = 'page',
  customFallback = null,
  preload = false,
  ...props 
}) => {
  const LazyComponent = lazy(() => {
    const componentPromise = importFn();
    
    // Preload if requested
    if (preload) {
      componentPromise.catch(() => {
        // Silently handle preload failures
      });
    }
    
    return componentPromise;
  });

  const getFallbackComponent = () => {
    if (customFallback) return customFallback;
    
    switch (fallback) {
      case 'dashboard':
        return <DashboardSkeleton />;
      case 'card':
        return <CardSkeleton />;
      case 'page':
      default:
        return <PageSkeleton />;
    }
  };

  return (
    <Suspense fallback={getFallbackComponent()}>
      <LazyComponent {...props} />
    </Suspense>
  );
};

export default LazyRoute;