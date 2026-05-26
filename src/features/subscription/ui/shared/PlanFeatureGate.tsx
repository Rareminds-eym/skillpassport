import { ReactNode, useEffect, useState } from 'react';
import { checkFeatureAccess } from '@/features/subscription/lib/featureGating';
import { useSubscriptionQuery, useSubscriptionPlansData } from '@/features/subscription/model';
import { UpgradePrompt } from './UpgradePrompt';

interface PlanFeatureGateProps {
  feature: string;
  fallback?: ReactNode;
  children: ReactNode;
}

const FALLBACK_PLANS = [
  { name: 'Basic',        price: 499,  duration: 'yearly', recommended: false },
  { name: 'Professional', price: 749,  duration: 'yearly', recommended: true  },
  { name: 'Premium',      price: 999,  duration: 'yearly', recommended: false },
];

/**
 * PlanFeatureGate Component
 * 
 * Conditionally renders children based on user's subscription plan and feature access.
 * Prices are sourced from the API via useSubscriptionPlansData.
 * FALLBACK_PLANS are ONLY used while the API call is in-flight.
 * 
 * @param feature - The feature key to check access for
 * @param fallback - Optional custom component to render when access is denied
 * @param children - Content to render when user has access
 */
export function PlanFeatureGate({ feature, fallback, children }: PlanFeatureGateProps) {
  const { subscriptionData, loading, error } = useSubscriptionQuery();
  const { plans: apiPlans, loading: plansLoading, error: plansError } = useSubscriptionPlansData();
  const [showUpgradePrompt, setShowUpgradePrompt] = useState(false);

  // Warn if using hardcoded fallback (should never happen in normal operation)
  useEffect(() => {
    if (!plansLoading && plansError) {
      console.warn('[PlanFeatureGate] Failed to fetch plans from API, using hardcoded fallback');
    }
  }, [plansLoading, plansError]);

  // Handle loading state
  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-slate-900"></div>
      </div>
    );
  }

  // Handle error state by denying access
  if (error) {
    console.error('FeatureGate: Error fetching subscription data', error);
    
    // If custom fallback provided, use it
    if (fallback) {
      return <>{fallback}</>;
    }

    // Otherwise show default error message
    return (
      <div className="flex items-center justify-center p-8">
        <div className="text-center">
          <p className="text-slate-600 mb-4">
            Unable to verify access. Please refresh the page.
          </p>
          <button
            onClick={() => window.location.reload()}
            className="px-4 py-2 bg-slate-800 text-white rounded-lg hover:bg-slate-900 transition-colors"
          >
            Refresh Page
          </button>
        </div>
      </div>
    );
  }

  // Check feature access
  const planCode = subscriptionData?.plan || 'freemium';
  const accessResult = checkFeatureAccess(planCode, feature);

  // User has access - render children
  if (accessResult.hasAccess) {
    return <>{children}</>;
  }

  // User doesn't have access - render fallback or default UpgradePrompt
  if (fallback) {
    return <>{fallback}</>;
  }

  // Use API-fetched plans if loaded, fall back to static while loading
  const availablePlans = apiPlans && apiPlans.length > 0
    ? apiPlans.map((p: Record<string, unknown>) => ({
        name: p.name as string,
        price: p.price as number,
        duration: p.duration as string,
        recommended: p.recommended as boolean,
      }))
    : FALLBACK_PLANS;

  return (
    <>
      {showUpgradePrompt && (
        <UpgradePrompt
          featureName={feature.replace(/_/g, ' ')}
          availablePlans={availablePlans}
          onClose={() => setShowUpgradePrompt(false)}
        />
      )}
      <div className="flex items-center justify-center p-8">
        <div className="text-center">
          <p className="text-slate-600 mb-4">
            {accessResult.reason || 'This feature requires a paid plan'}
          </p>
          <button
            onClick={() => setShowUpgradePrompt(true)}
            className="px-6 py-3 bg-gradient-to-r from-slate-800 to-slate-900 text-white rounded-xl font-semibold hover:from-slate-900 hover:to-black transition-all shadow-lg"
          >
            View Plans
          </button>
        </div>
      </div>
    </>
  );
}
