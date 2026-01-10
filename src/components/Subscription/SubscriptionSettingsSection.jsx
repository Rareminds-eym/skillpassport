/**
 * SubscriptionSettingsSection Component
 * 
 * A reusable subscription management section for settings pages.
 * Shows current subscription status and links to manage subscription/add-ons.
 * For admin users, also shows organization subscription management options.
 * 
 * @requirement Task - Add subscription management to all user settings pages
 */

import {
  AlertCircle,
  Building2,
  Calendar,
  CheckCircle,
  ChevronRight,
  CreditCard,
  Shield,
  Sparkles,
  Users
} from 'lucide-react';
import { useLocation, useNavigate } from 'react-router-dom';
import { useSubscriptionContext } from '../../context/SubscriptionContext';
import { useSubscriptionQuery } from '../../hooks/Subscription/useSubscriptionQuery';
import useAuth from '../../hooks/useAuth';

/**
 * Get the base path for subscription routes based on current location
 */
function getSubscriptionBasePath(pathname) {
  if (pathname.startsWith('/student')) return '/student';
  if (pathname.startsWith('/recruitment')) return '/recruitment';
  if (pathname.startsWith('/educator')) return '/educator';
  if (pathname.startsWith('/college-admin')) return '/college-admin';
  if (pathname.startsWith('/school-admin')) return '/school-admin';
  if (pathname.startsWith('/university-admin')) return '/university-admin';
  return ''; // fallback to root
}

/**
 * SubscriptionSettingsSection - Displays subscription info and management links
 */
export function SubscriptionSettingsSection({ className = '' }) {
  const navigate = useNavigate();
  const location = useLocation();
  const { subscriptionData, loading } = useSubscriptionQuery();
  const { activeEntitlements = [], totalAddOnCost = { monthly: 0, annual: 0 } } = useSubscriptionContext() || {};
  useAuth(); // Hook called for potential future use

  // Get the base path for subscription routes
  const basePath = getSubscriptionBasePath(location.pathname);
  
  // Check if user is on an organization admin page based on the URL path
  // This is more reliable than checking role since the user is already on the admin dashboard
  const isOrgAdmin = ['/school-admin', '/college-admin', '/university-admin'].includes(basePath);

  if (loading) {
    return (
      <div className={`bg-white rounded-xl border border-gray-200 p-6 ${className}`}>
        <div className="animate-pulse space-y-4">
          <div className="h-6 w-48 bg-gray-200 rounded"></div>
          <div className="h-4 w-64 bg-gray-200 rounded"></div>
          <div className="h-20 bg-gray-100 rounded-lg"></div>
        </div>
        
        {/* Show organization section even while loading for admins */}
        {isOrgAdmin && (
          <div className="pt-4 mt-4 border-t border-gray-200">
            <div className="flex items-center gap-2 mb-3">
              <Building2 className="w-5 h-5 text-purple-600" />
              <h4 className="font-semibold text-gray-900">Organization Subscriptions</h4>
            </div>
            <p className="text-sm text-gray-600 mb-4">
              Manage bulk subscriptions for your organization's members
            </p>
            
            <div className="space-y-2">
              <button
                onClick={() => navigate(`${basePath}/subscription/organization`)}
                className="w-full flex items-center justify-between px-4 py-3 bg-purple-50 hover:bg-purple-100 rounded-lg border border-purple-200 transition-colors group"
              >
                <div className="flex items-center gap-3">
                  <Users className="w-5 h-5 text-purple-600" />
                  <div className="text-left">
                    <span className="font-medium text-purple-900 block">Organization Licenses</span>
                    <span className="text-xs text-purple-600">Manage seats, pools & assignments</span>
                  </div>
                </div>
                <ChevronRight className="w-5 h-5 text-purple-400 group-hover:translate-x-0.5 transition-transform" />
              </button>

              <button
                onClick={() => navigate(`${basePath}/subscription/bulk-purchase`)}
                className="w-full flex items-center justify-between px-4 py-3 bg-gray-50 hover:bg-gray-100 rounded-lg border border-gray-200 transition-colors group"
              >
                <div className="flex items-center gap-3">
                  <CreditCard className="w-5 h-5 text-gray-600" />
                  <div className="text-left">
                    <span className="font-medium text-gray-900 block">Bulk Purchase</span>
                    <span className="text-xs text-gray-500">Buy subscriptions for members</span>
                  </div>
                </div>
                <ChevronRight className="w-5 h-5 text-gray-400 group-hover:translate-x-0.5 transition-transform" />
              </button>
            </div>
          </div>
        )}
      </div>
    );
  }

  const hasSubscription = !!subscriptionData;
  const isActive = subscriptionData?.status === 'active';
  const planName = subscriptionData?.planName || subscriptionData?.plan || 'Free';
  const endDate = subscriptionData?.endDate ? new Date(subscriptionData.endDate) : null;
  const daysRemaining = endDate ? Math.ceil((endDate.getTime() - Date.now()) / (1000 * 60 * 60 * 24)) : 0;
  const isExpiringSoon = daysRemaining > 0 && daysRemaining <= 30;

  return (
    <div className={`bg-white rounded-xl border border-gray-200 overflow-hidden ${className}`}>
      {/* Header */}
      <div className="px-6 py-5 border-b border-gray-100 bg-gray-50">
        <div className="flex items-start gap-3">
          <div className="p-2 bg-white rounded-lg border border-gray-200 text-indigo-600">
            <CreditCard className="w-5 h-5" />
          </div>
          <div className="flex-1">
            <h3 className="text-base font-semibold text-gray-900">Subscription & Billing</h3>
            <p className="text-sm text-gray-600 mt-1">Manage your subscription plan and add-ons</p>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="p-6 space-y-4">
        {/* Current Plan Status */}
        <div className={`rounded-lg p-4 border ${
          isActive 
            ? 'bg-green-50 border-green-200' 
            : hasSubscription 
              ? 'bg-amber-50 border-amber-200'
              : 'bg-gray-50 border-gray-200'
        }`}>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              {isActive ? (
                <CheckCircle className="w-5 h-5 text-green-600" />
              ) : hasSubscription ? (
                <AlertCircle className="w-5 h-5 text-amber-600" />
              ) : (
                <Shield className="w-5 h-5 text-gray-400" />
              )}
              <div>
                <p className="font-medium text-gray-900">
                  {hasSubscription ? `${planName} Plan` : 'No Active Plan'}
                </p>
                <p className="text-sm text-gray-600">
                  {isActive 
                    ? isExpiringSoon 
                      ? `Expires in ${daysRemaining} days`
                      : 'Active subscription'
                    : hasSubscription 
                      ? subscriptionData?.status || 'Inactive'
                      : 'Get started with a subscription'
                  }
                </p>
              </div>
            </div>
            {isActive && (
              <span className="px-2.5 py-1 bg-green-100 text-green-700 text-xs font-medium rounded-full">
                Active
              </span>
            )}
          </div>

          {endDate && isActive && (
            <div className="mt-3 pt-3 border-t border-green-200/50 flex items-center gap-2 text-sm text-gray-600">
              <Calendar className="w-4 h-4" />
              <span>Renews on {endDate.toLocaleDateString()}</span>
            </div>
          )}
        </div>

        {/* Add-ons Summary */}
        {activeEntitlements.length > 0 && (
          <div className="bg-indigo-50 rounded-lg p-4 border border-indigo-200">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <Sparkles className="w-5 h-5 text-indigo-600" />
                <div>
                  <p className="font-medium text-gray-900">
                    {activeEntitlements.length} Active Add-on{activeEntitlements.length !== 1 ? 's' : ''}
                  </p>
                  <p className="text-sm text-gray-600">
                    ₹{totalAddOnCost.monthly}/month in add-ons
                  </p>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Action Buttons */}
        <div className="space-y-2 pt-2">
          <button
            onClick={() => navigate(`${basePath}/subscription/manage`)}
            className="w-full flex items-center justify-between px-4 py-3 bg-gray-50 hover:bg-gray-100 rounded-lg border border-gray-200 transition-colors group"
          >
            <div className="flex items-center gap-3">
              <Shield className="w-5 h-5 text-gray-600" />
              <span className="font-medium text-gray-900">Manage Subscription</span>
            </div>
            <ChevronRight className="w-5 h-5 text-gray-400 group-hover:translate-x-0.5 transition-transform" />
          </button>

          <button
            onClick={() => navigate(`${basePath}/subscription/add-ons`)}
            className="w-full flex items-center justify-between px-4 py-3 bg-indigo-50 hover:bg-indigo-100 rounded-lg border border-indigo-200 transition-colors group"
          >
            <div className="flex items-center gap-3">
              <Sparkles className="w-5 h-5 text-indigo-600" />
              <span className="font-medium text-indigo-900">Browse Add-ons</span>
            </div>
            <ChevronRight className="w-5 h-5 text-indigo-400 group-hover:translate-x-0.5 transition-transform" />
          </button>

          {!hasSubscription && (
            <button
              onClick={() => {
                // Get user type from basePath for proper plan display
                const typeMap = {
                  '/student': 'student',
                  '/recruitment': 'recruiter',
                  '/educator': 'educator',
                  '/college-admin': 'college_admin',
                  '/school-admin': 'school_admin',
                  '/university-admin': 'university_admin'
                };
                const userType = typeMap[basePath] || 'student';
                navigate(`/subscription/plans?type=${userType}`);
              }}
              className="w-full flex items-center justify-between px-4 py-3 bg-indigo-600 hover:bg-indigo-700 rounded-lg transition-colors group"
            >
              <div className="flex items-center gap-3">
                <CreditCard className="w-5 h-5 text-white" />
                <span className="font-medium text-white">View Plans</span>
              </div>
              <ChevronRight className="w-5 h-5 text-indigo-200 group-hover:translate-x-0.5 transition-transform" />
            </button>
          )}
        </div>

        {/* Organization Subscription Management - Admin Only */}
        {isOrgAdmin && (
          <div className="pt-4 mt-4 border-t border-gray-200">
            <div className="flex items-center gap-2 mb-3">
              <Building2 className="w-5 h-5 text-purple-600" />
              <h4 className="font-semibold text-gray-900">Organization Subscriptions</h4>
            </div>
            <p className="text-sm text-gray-600 mb-4">
              Manage bulk subscriptions for your organization's members
            </p>
            
            <div className="space-y-2">
              <button
                onClick={() => navigate(`${basePath}/subscription/organization`)}
                className="w-full flex items-center justify-between px-4 py-3 bg-purple-50 hover:bg-purple-100 rounded-lg border border-purple-200 transition-colors group"
              >
                <div className="flex items-center gap-3">
                  <Users className="w-5 h-5 text-purple-600" />
                  <div className="text-left">
                    <span className="font-medium text-purple-900 block">Organization Licenses</span>
                    <span className="text-xs text-purple-600">Manage seats, pools & assignments</span>
                  </div>
                </div>
                <ChevronRight className="w-5 h-5 text-purple-400 group-hover:translate-x-0.5 transition-transform" />
              </button>

              <button
                onClick={() => navigate(`${basePath}/subscription/bulk-purchase`)}
                className="w-full flex items-center justify-between px-4 py-3 bg-gray-50 hover:bg-gray-100 rounded-lg border border-gray-200 transition-colors group"
              >
                <div className="flex items-center gap-3">
                  <CreditCard className="w-5 h-5 text-gray-600" />
                  <div className="text-left">
                    <span className="font-medium text-gray-900 block">Bulk Purchase</span>
                    <span className="text-xs text-gray-500">Buy subscriptions for members</span>
                  </div>
                </div>
                <ChevronRight className="w-5 h-5 text-gray-400 group-hover:translate-x-0.5 transition-transform" />
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default SubscriptionSettingsSection;
