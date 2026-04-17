import React, { Suspense, lazy } from 'react';
import { PageSkeleton, DashboardSkeleton } from './skeletons';
import { createLazyPage } from '@/shared/lib/lazy-loading';

/**
 * Enhanced lazy page wrapper with route-specific optimizations
 */
const LazyPageWrapper = ({ 
  importFn, 
  fallback = 'page',
  preload = false,
  ...props 
}) => {
  const LazyPage = createLazyPage(importFn);

  const getFallback = () => {
    switch (fallback) {
      case 'dashboard':
        return <DashboardSkeleton />;
      case 'page':
      default:
        return <PageSkeleton />;
    }
  };

  return (
    <Suspense fallback={getFallback()}>
      <LazyPage {...props} />
    </Suspense>
  );
};

export default LazyPageWrapper;