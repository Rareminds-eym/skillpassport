import React, { Suspense, useMemo } from 'react';
import { PageSkeleton, DashboardSkeleton } from './skeletons';
import { createLazyPage } from '@/shared/lib/lazy-loading';

class LazyErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false };
  }
  static getDerivedStateFromError() {
    return { hasError: true };
  }
  render() {
    if (this.state.hasError) return this.props.fallback || null;
    return this.props.children;
  }
}

/**
 * Enhanced lazy page wrapper with route-specific optimizations
 */
const LazyPageWrapper = ({ 
  importFn, 
  fallback = 'page',
  preload = false,
  ...props 
}) => {
  // preload passed through so callers can opt-in to eager loading
  const LazyPage = useMemo(() => createLazyPage(importFn, { preload }), [importFn, preload]);

  const fallbackNode = fallback === 'dashboard' ? <DashboardSkeleton /> : <PageSkeleton />;

  return (
    <LazyErrorBoundary fallback={fallbackNode}>
      <Suspense fallback={fallbackNode}>
        <LazyPage {...props} />
      </Suspense>
    </LazyErrorBoundary>
  );
};

export default LazyPageWrapper;