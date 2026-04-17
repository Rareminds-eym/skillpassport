import React, { Suspense, lazy, useMemo } from 'react';
import { PageSkeleton, DashboardSkeleton, CardSkeleton } from './skeletons';

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
 * Optimized lazy route component with proper error boundaries and fallbacks
 */
const LazyRoute = ({ 
  importFn, 
  fallback = 'page',
  customFallback = null,
  preload = false,
  ...props 
}) => {
  // Memoize so a new lazy component is NOT created on every render
  const LazyComponent = useMemo(() => lazy(() => {
    const componentPromise = importFn();

    if (preload) {
      componentPromise.catch((err) => {
        if (import.meta.env.DEV) console.warn('Preload failed:', err);
      });
    }

    return componentPromise;
  }), [importFn]);

  const getFallbackComponent = () => {
    if (customFallback) return customFallback;
    switch (fallback) {
      case 'dashboard': return <DashboardSkeleton />;
      case 'card': return <CardSkeleton />;
      case 'page':
      default: return <PageSkeleton />;
    }
  };

  const fallbackNode = getFallbackComponent();

  return (
    <LazyErrorBoundary fallback={fallbackNode}>
      <Suspense fallback={fallbackNode}>
        <LazyComponent {...props} />
      </Suspense>
    </LazyErrorBoundary>
  );
};

export default LazyRoute;