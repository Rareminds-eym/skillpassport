/**
 * Lazy-loaded FeatureLockOverlay Component
 * 
 * This wrapper provides lazy loading for the FeatureLockOverlay component
 * to improve initial bundle size and performance.
 */

import { lazy, Suspense } from 'react';

// Lazy load the actual component
const FeatureLockOverlayComponent = lazy(() => 
  import('./FeatureLockOverlay').then(module => ({ 
    default: module.FeatureLockOverlay 
  }))
);

interface FeatureLockOverlayProps {
  feature: string;
  featureName: string;
  children: React.ReactNode;
}

// Loading fallback component
function LoadingFallback({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}

export function LazyFeatureLockOverlay(props: FeatureLockOverlayProps) {
  return (
    <Suspense fallback={<LoadingFallback>{props.children}</LoadingFallback>}>
      <FeatureLockOverlayComponent {...props} />
    </Suspense>
  );
}
