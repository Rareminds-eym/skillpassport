import React, { Suspense, useState, useEffect } from 'react';
import { useLazyComponent } from '@/shared/lib/hooks/useLazyComponent';
import SuspenseWrapper from './SuspenseWrapper';

/**
 * Enhanced lazy component wrapper with intersection observer for viewport-based loading
 */
const LazyComponentWrapper = ({
  importFn,
  fallback = 'card',
  customFallback = null,
  loadOnViewport = false,
  rootMargin = '50px',
  threshold = 0.1,
  preload = false,
  className = '',
  children,
  ...suspenseProps
}) => {
  const [shouldLoad, setShouldLoad] = useState(!loadOnViewport);
  const [elementRef, setElementRef] = useState(null);

  // Use intersection observer for viewport-based loading
  useEffect(() => {
    if (!loadOnViewport || !elementRef || shouldLoad) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setShouldLoad(true);
          observer.disconnect();
        }
      },
      { rootMargin, threshold }
    );

    observer.observe(elementRef);
    return () => observer.disconnect();
  }, [elementRef, loadOnViewport, shouldLoad, rootMargin, threshold]);

  const LazyComponent = useLazyComponent(importFn, { preload });

  if (loadOnViewport && !shouldLoad) {
    return (
      <div 
        ref={setElementRef} 
        className={className}
        style={{ minHeight: '200px' }} // Prevent layout shift
      >
        {customFallback || (
          <SuspenseWrapper fallback={fallback} {...suspenseProps}>
            <div />
          </SuspenseWrapper>
        )}
      </div>
    );
  }

  return (
    <SuspenseWrapper 
      fallback={fallback} 
      customFallback={customFallback}
      className={className}
      {...suspenseProps}
    >
      <LazyComponent>{children}</LazyComponent>
    </SuspenseWrapper>
  );
};

export default LazyComponentWrapper;