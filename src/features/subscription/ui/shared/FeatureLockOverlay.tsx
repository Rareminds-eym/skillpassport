/**
 * FeatureLockOverlay Component
 * 
 * Displays a lock overlay on features that require a paid subscription.
 * Shows blurred content with upgrade prompt for Freemium users.
 * 
 * Performance optimizations:
 * - useMemo for feature access checks
 * - Early return for access granted
 */

import { Lock, TrendingUp } from 'lucide-react';
import { useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { checkFeatureAccess } from '@/features/subscription/lib/featureGating';
import { useSubscriptionQuery } from '@/features/subscription/model';

interface FeatureLockOverlayProps {
  feature: string;
  featureName: string;
  children: React.ReactNode;
}

export function FeatureLockOverlay({ 
  feature, 
  featureName, 
  children 
}: FeatureLockOverlayProps) {
  const navigate = useNavigate();
  const { subscriptionData } = useSubscriptionQuery();
  
  // Memoize feature access check to prevent unnecessary recalculations
  const accessResult = useMemo(
    () => checkFeatureAccess(subscriptionData?.plan || '', feature),
    [subscriptionData?.plan, feature]
  );

  // If user has access, render children normally
  if (accessResult.hasAccess) {
    return <>{children}</>;
  }

  // Render locked feature with overlay
  return (
    <div className="relative">
      {/* Blurred Content */}
      <div className="filter blur-sm pointer-events-none select-none">
        {children}
      </div>

      {/* Lock Overlay */}
      <div className="absolute inset-0 flex items-center justify-center bg-white/80 backdrop-blur-sm">
        <div className="max-w-md w-full mx-4 bg-white rounded-2xl shadow-2xl border-2 border-slate-200 p-8">
          <div className="flex flex-col items-center text-center">
            {/* Lock Icon */}
            <div className="w-16 h-16 rounded-full bg-gradient-to-br from-amber-400 to-amber-500 flex items-center justify-center mb-4">
              <Lock className="h-8 w-8 text-white" />
            </div>
            
            {/* Feature Name */}
            <h3 className="text-2xl font-bold text-slate-900 mb-2">
              {featureName}
            </h3>
            
            {/* Upgrade Message */}
            <p className="text-slate-600 mb-6">
              {accessResult.reason || 'Upgrade to unlock this feature'}
            </p>

            {/* Available Plans Information */}
            {accessResult.availableInPlans && accessResult.availableInPlans.length > 0 && (
              <div className="mb-6 text-sm text-slate-500">
                Available in:{' '}
                <span className="font-semibold text-slate-700">
                  {accessResult.availableInPlans.map(plan => 
                    plan.charAt(0).toUpperCase() + plan.slice(1)
                  ).join(', ')}
                </span>
              </div>
            )}

            {/* Action Buttons */}
            <div className="flex flex-col gap-3 w-full">
              <button
                onClick={() => navigate('/subscription/plans/learner/purchase')}
                className="w-full px-6 py-3 bg-gradient-to-r from-slate-800 to-slate-900 text-white rounded-xl font-semibold hover:from-slate-900 hover:to-black transition-all shadow-lg hover:shadow-xl flex items-center justify-center gap-2"
              >
                <TrendingUp className="h-5 w-5" />
                View All Plans
              </button>
              
              <button
                onClick={() => window.history.back()}
                className="w-full px-6 py-3 border-2 border-slate-300 text-slate-700 rounded-xl font-semibold hover:bg-slate-50 transition-all"
              >
                Go Back
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
