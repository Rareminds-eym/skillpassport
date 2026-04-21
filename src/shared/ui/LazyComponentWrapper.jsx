import React, { Suspense, useState, useEffect } from 'react';
import { useLazyComponent } from '@/shared/lib/hooks/useLazyComponent';
import SuspenseWrapper from './SuspenseWrapper';

/**
 * Inner component — only mounted (and thus only calls useLazyComponent)
 * once the parent decides it's time to load.
 */
const LazyComponentInner = ({ importFn, preload, fallback, customFallback, className, children, ...suspenseProps }) => {
  const LazyComponent = useLazyComponent(importFn, { preload });

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

/**
 * Enhanced lazy component wrapper with intersection observer for viewport-based loading.
 * useLazyComponent (and the underlying lazy import) is only invoked after shouldLoad is true,
 * so viewport-based deferral actually works.
 */
const LazyComponentWrapper = ({
  importFn,
  fallback = 'card',
  customFallback = null,
  loadOnViewport = false,
  rootMargin = '50px',
  threshold = 0.1,
  preload = false,
  placeholderHeight = '200px',
  className = '',
  children,
  ...suspenseProps
}) => {
  const [shouldLoad, setShouldLoad] = useState(!loadOnViewport);
  const [elementRef, setElementRef] = useState(null);

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

  if (!shouldLoad) {
    return (
      <div
        ref={setElementRef}
        className={className}
        style={{ minHeight: placeholderHeight }}
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
    <LazyComponentInner
      importFn={importFn}
      preload={preload}
      fallback={fallback}
      customFallback={customFallback}
      className={className}
      {...suspenseProps}
    >
      {children}
    </LazyComponentInner>
  );
};

export default LazyComponentWrapper;
