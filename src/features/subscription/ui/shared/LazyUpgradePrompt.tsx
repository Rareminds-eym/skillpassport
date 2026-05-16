/**
 * Lazy-loaded UpgradePrompt Component
 * 
 * This wrapper provides lazy loading for the UpgradePrompt component
 * to improve initial bundle size and performance.
 */

import { lazy, Suspense } from 'react';

// Lazy load the actual component
const UpgradePromptComponent = lazy(() => 
  import('./UpgradePrompt').then(module => ({ 
    default: module.UpgradePrompt 
  }))
);

interface UpgradePromptProps {
  featureName: string;
  availablePlans: Array<{
    name: string;
    price: number;
    duration: string;
    recommended?: boolean;
  }>;
  onClose: () => void;
}

// Loading fallback component - minimal modal backdrop
function LoadingFallback() {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
      <div className="max-w-2xl w-full mx-4 bg-white rounded-3xl shadow-2xl border-2 border-slate-200 p-8">
        <div className="animate-pulse">
          <div className="h-8 bg-slate-200 rounded w-1/3 mb-4"></div>
          <div className="h-4 bg-slate-200 rounded w-2/3 mb-8"></div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-48 bg-slate-100 rounded-2xl"></div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

export function LazyUpgradePrompt(props: UpgradePromptProps) {
  return (
    <Suspense fallback={<LoadingFallback />}>
      <UpgradePromptComponent {...props} />
    </Suspense>
  );
}
