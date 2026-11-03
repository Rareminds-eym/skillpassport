import { ReactNode, useState } from 'react';
import { useFeatureEntitlement } from '@/features/subscription/model/useFeatureEntitlement';
import { useSubscriptionPlansData } from '@/features/subscription/model';
import { UpgradePrompt } from './UpgradePrompt';

interface PlanFeatureGateProps {
  feature: string;
  fallback?: ReactNode;
  children: ReactNode;
}

/**
 * PlanFeatureGate Component — Dynamic Entitlement-Driven Gate (UX Affordance).
 *
 * Uses the database-driven Entitlement Engine (via `useFeatureEntitlement`)
 * to determine whether to render children or the UpgradePrompt.
 * 
 * Zero hardcoded plan codes or fallback prices.
 *
 * @param feature - The feature key to check access for (e.g. 'advanced_skill_filters', 'contact_unlocks')
 * @param fallback - Optional custom component to render when access is denied
 * @param children - Content to render when user has access
 */
export function PlanFeatureGate({ feature, fallback, children }: PlanFeatureGateProps) {
  const { enabled, displayName, loading: entitlementLoading, error: entitlementError } = useFeatureEntitlement(feature);
  const { plans: apiPlans, loading: plansLoading } = useSubscriptionPlansData();
  const [showUpgradePrompt, setShowUpgradePrompt] = useState(false);

  // Handle loading state
  if (entitlementLoading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-slate-900"></div>
      </div>
    );
  }

  // Handle error state by gracefully falling back
  if (entitlementError) {
    console.warn(`[PlanFeatureGate] Error checking entitlement for '${feature}':`, entitlementError);
  }

  // User has access - render children directly
  if (enabled) {
    return <>{children}</>;
  }

  // User doesn't have access - render custom fallback if provided
  if (fallback) {
    return <>{fallback}</>;
  }

  // Map API-fetched plans for upgrade prompt
  const availablePlans = (apiPlans || []).map((p: Record<string, unknown>) => ({
    name: (p.name as string) || 'Subscription Plan',
    price: (p.price as number) || 0,
    duration: (p.duration as string) || 'yearly',
    recommended: (p.recommended as boolean) || false,
  }));

  return (
    <>
      {showUpgradePrompt && (
        <UpgradePrompt
          featureName={displayName || feature.replace(/_/g, ' ')}
          availablePlans={availablePlans}
          onClose={() => setShowUpgradePrompt(false)}
        />
      )}
      <div className="flex items-center justify-center p-8">
        <div className="text-center">
          <p className="text-slate-600 mb-4 font-medium">
            Access to {displayName || feature.replace(/_/g, ' ')} requires an active plan with this entitlement.
          </p>
          <button
            onClick={() => setShowUpgradePrompt(true)}
            className="px-6 py-3 bg-gradient-to-r from-slate-800 to-slate-900 text-white rounded-xl font-semibold hover:from-slate-900 hover:to-black transition-all shadow-lg hover:shadow-xl hover:scale-105"
          >
            {plansLoading ? 'Loading Plans...' : 'View Upgrade Options'}
          </button>
        </div>
      </div>
    </>
  );
}
export default PlanFeatureGate;
