/**
 * MemberSubscriptionView Component
 *
 * Main view for members to see their subscription status.
 * Combines organization-provided features and personal add-ons.
 * Includes expiration warnings and countdown timers.
 *
 * Requirements: 5.1, 5.2, 5.3, 5.4, 5.5, 9.4
 */

import { AlertTriangle, Bell, Calendar, Clock, RefreshCw, X } from 'lucide-react';
import { memo, useCallback, useEffect, useMemo, useState } from 'react';
import OrganizationProvidedFeatures from './OrganizationProvidedFeatures';
import PersonalAddOns from './PersonalAddOns';

interface OrganizationFeature {
  id: string;
  name: string;
  description?: string;
  isActive: boolean;
}

interface OrganizationInfo {
  id: string;
  name: string;
  type: 'school' | 'college' | 'university';
  adminName?: string;
  adminEmail?: string;
}

interface SubscriptionInfo {
  planName: string;
  startDate: Date;
  endDate: Date;
  status: 'active' | 'expiring_soon' | 'expired' | 'grace_period';
  autoRenew: boolean;
}

interface PurchasedAddOn {
  id: string;
  name: string;
  description?: string;
  price: number;
  purchaseDate: Date;
  expiryDate?: Date;
  isActive: boolean;
  features: string[];
}

interface AvailableAddOn {
  id: string;
  name: string;
  description: string;
  price: number;
  billingCycle: 'monthly' | 'annual' | 'one-time';
  features: string[];
  isPopular?: boolean;
  isNew?: boolean;
}

interface MemberSubscriptionViewProps {
  // Organization subscription (if any)
  hasOrganizationSubscription: boolean;
  organization?: OrganizationInfo;
  subscription?: SubscriptionInfo;
  organizationFeatures?: OrganizationFeature[];

  // Personal add-ons
  purchasedAddOns: PurchasedAddOn[];
  availableAddOns: AvailableAddOn[];

  // Callbacks
  onPurchaseAddOn: (addOnId: string) => void;
  onManageAddOn: (addOnId: string) => void;
  onContactAdmin?: () => void;
  onDismissWarning?: () => void;

  // Loading state
  isLoading?: boolean;
}

function MemberSubscriptionView({
  hasOrganizationSubscription,
  organization,
  subscription,
  organizationFeatures = [],
  purchasedAddOns,
  availableAddOns,
  onPurchaseAddOn,
  onManageAddOn,
  onContactAdmin,
  onDismissWarning,
  isLoading = false,
}: MemberSubscriptionViewProps) {
  const [showExpirationBanner, setShowExpirationBanner] = useState(true);

  // Calculate expiration details
  const expirationDetails = useMemo(() => {
    if (!subscription) return null;

    const now = new Date();
    const endDate = new Date(subscription.endDate);
    const diffMs = endDate.getTime() - now.getTime();
    const daysRemaining = Math.ceil(diffMs / (1000 * 60 * 60 * 24));
    const hoursRemaining = Math.ceil(diffMs / (1000 * 60 * 60));

    return {
      daysRemaining,
      hoursRemaining,
      isExpiringSoon: daysRemaining <= 30 && daysRemaining > 0,
      isExpired: daysRemaining <= 0,
      isGracePeriod: subscription.status === 'grace_period',
    };
  }, [subscription]);

  // Check for any expiring add-ons
  const expiringAddOns = useMemo(() => {
    const now = new Date();
    return purchasedAddOns.filter((addOn) => {
      if (!addOn.expiryDate || !addOn.isActive) return false;
      const expiry = new Date(addOn.expiryDate);
      const daysRemaining = Math.ceil((expiry.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
      return daysRemaining <= 7 && daysRemaining > 0;
    });
  }, [purchasedAddOns]);

  const handleDismissWarning = useCallback(() => {
    setShowExpirationBanner(false);
    onDismissWarning?.();
  }, [onDismissWarning]);

  if (isLoading) {
    return <LoadingSkeleton />;
  }

  const showOrgExpirationWarning =
    showExpirationBanner &&
    hasOrganizationSubscription &&
    expirationDetails &&
    (expirationDetails.isExpiringSoon || expirationDetails.isGracePeriod);

  return (
    <div className="space-y-6">
      {/* Expiration Warning Banner */}
      {showOrgExpirationWarning && (
        <ExpirationWarningBanner
          daysRemaining={expirationDetails.daysRemaining}
          isGracePeriod={expirationDetails.isGracePeriod}
          organizationName={organization?.name || 'Your organization'}
          onDismiss={handleDismissWarning}
          onContactAdmin={onContactAdmin}
        />
      )}

      {/* Add-on Expiration Warnings */}
      {expiringAddOns.length > 0 && <AddOnExpirationWarning addOns={expiringAddOns} />}

      {/* Organization Provided Features */}
      {hasOrganizationSubscription && organization && subscription && (
        <OrganizationProvidedFeatures
          organization={organization}
          subscription={subscription}
          features={organizationFeatures}
        />
      )}

      {/* No Organization Subscription Notice */}
      {!hasOrganizationSubscription && <NoOrganizationSubscription />}

      {/* Personal Add-Ons Section */}
      <PersonalAddOns
        purchasedAddOns={purchasedAddOns}
        availableAddOns={availableAddOns}
        onPurchase={onPurchaseAddOn}
        onManage={onManageAddOn}
      />
    </div>
  );
}

// Expiration Warning Banner Component
interface ExpirationWarningBannerProps {
  daysRemaining: number;
  isGracePeriod: boolean;
  organizationName: string;
  onDismiss: () => void;
  onContactAdmin?: () => void;
}

function ExpirationWarningBanner({
  daysRemaining,
  isGracePeriod,
  organizationName,
  onDismiss,
  onContactAdmin,
}: ExpirationWarningBannerProps) {
  const [countdown, setCountdown] = useState({ days: 0, hours: 0, minutes: 0 });

  useEffect(() => {
    const updateCountdown = () => {
      const now = new Date();
      const targetDate = new Date();
      targetDate.setDate(targetDate.getDate() + daysRemaining);

      const diff = targetDate.getTime() - now.getTime();

      setCountdown({
        days: Math.floor(diff / (1000 * 60 * 60 * 24)),
        hours: Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60)),
        minutes: Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60)),
      });
    };

    updateCountdown();
    const interval = setInterval(updateCountdown, 60000); // Update every minute

    return () => clearInterval(interval);
  }, [daysRemaining]);

  const bgColor = isGracePeriod ? 'bg-red-50' : 'bg-amber-50';
  const borderColor = isGracePeriod ? 'border-red-200' : 'border-amber-200';
  const textColor = isGracePeriod ? 'text-red-800' : 'text-amber-800';
  const iconColor = isGracePeriod ? 'text-red-500' : 'text-amber-500';

  return (
    <div className={`${bgColor} ${borderColor} border rounded-xl p-4`}>
      <div className="flex items-start gap-3">
        <AlertTriangle className={`w-5 h-5 ${iconColor} flex-shrink-0 mt-0.5`} />
        <div className="flex-1">
          <div className="flex items-start justify-between">
            <div>
              <h4 className={`font-medium ${textColor}`}>
                {isGracePeriod
                  ? 'Subscription Expired - Grace Period Active'
                  : 'Subscription Expiring Soon'}
              </h4>
              <p className={`text-sm mt-1 ${isGracePeriod ? 'text-red-600' : 'text-amber-600'}`}>
                {isGracePeriod
                  ? `Your subscription from ${organizationName} has expired. You're in a grace period.`
                  : `Your subscription from ${organizationName} will expire soon.`}
              </p>
            </div>
            <button
              onClick={onDismiss}
              className={`p-1 hover:bg-white/50 rounded ${textColor}`}
              aria-label="Dismiss"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* Countdown Timer */}
          <div className="mt-3 flex items-center gap-4">
            <div className="flex items-center gap-2">
              <Clock className={`w-4 h-4 ${iconColor}`} />
              <span className={`text-sm font-medium ${textColor}`}>Time remaining:</span>
            </div>
            <div className="flex gap-2">
              <CountdownUnit value={countdown.days} label="days" />
              <CountdownUnit value={countdown.hours} label="hrs" />
              <CountdownUnit value={countdown.minutes} label="min" />
            </div>
          </div>

          {/* Action Buttons */}
          <div className="mt-3 flex gap-2">
            {onContactAdmin && (
              <button
                onClick={onContactAdmin}
                className={`px-3 py-1.5 text-sm font-medium rounded-lg ${
                  isGracePeriod
                    ? 'bg-red-600 text-white hover:bg-red-700'
                    : 'bg-amber-600 text-white hover:bg-amber-700'
                } transition-colors`}
              >
                Contact Admin
              </button>
            )}
            <button
              onClick={onDismiss}
              className={`px-3 py-1.5 text-sm font-medium rounded-lg ${
                isGracePeriod
                  ? 'text-red-700 hover:bg-red-100'
                  : 'text-amber-700 hover:bg-amber-100'
              } transition-colors`}
            >
              Remind Me Later
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

// Countdown Unit Component
function CountdownUnit({ value, label }: { value: number; label: string }) {
  return (
    <div className="bg-white/80 px-2 py-1 rounded text-center min-w-[50px]">
      <span className="text-lg font-bold text-gray-900">{value}</span>
      <span className="text-xs text-gray-500 ml-1">{label}</span>
    </div>
  );
}

// Add-on Expiration Warning Component
interface AddOnExpirationWarningProps {
  addOns: PurchasedAddOn[];
}

function AddOnExpirationWarning({ addOns }: AddOnExpirationWarningProps) {
  return (
    <div className="bg-purple-50 border border-purple-200 rounded-xl p-4">
      <div className="flex items-start gap-3">
        <Bell className="w-5 h-5 text-purple-500 flex-shrink-0 mt-0.5" />
        <div>
          <h4 className="font-medium text-purple-800">
            Add-On{addOns.length > 1 ? 's' : ''} Expiring Soon
          </h4>
          <ul className="mt-2 space-y-1">
            {addOns.map((addOn) => {
              const daysLeft = addOn.expiryDate
                ? Math.ceil(
                    (new Date(addOn.expiryDate).getTime() - new Date().getTime()) /
                      (1000 * 60 * 60 * 24)
                  )
                : 0;
              return (
                <li key={addOn.id} className="text-sm text-purple-600 flex items-center gap-2">
                  <Calendar className="w-3 h-3" />
                  <span className="font-medium">{addOn.name}</span>
                  <span>
                    expires in {daysLeft} day{daysLeft !== 1 ? 's' : ''}
                  </span>
                </li>
              );
            })}
          </ul>
        </div>
      </div>
    </div>
  );
}

// No Organization Subscription Component
function NoOrganizationSubscription() {
  return (
    <div className="bg-gray-50 border border-gray-200 rounded-2xl p-6 text-center">
      <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
        <RefreshCw className="w-8 h-8 text-gray-400" />
      </div>
      <h4 className="text-lg font-medium text-gray-900 mb-2">No Organization Subscription</h4>
      <p className="text-sm text-gray-500 max-w-md mx-auto">
        You don't have an active subscription from your organization. Contact your organization
        admin if you believe this is an error, or explore personal add-ons below.
      </p>
    </div>
  );
}

// Loading Skeleton Component
function LoadingSkeleton() {
  return (
    <div className="space-y-6 animate-pulse">
      <div className="bg-gray-200 rounded-2xl h-64" />
      <div className="bg-gray-200 rounded-2xl h-48" />
    </div>
  );
}

export default memo(MemberSubscriptionView);
