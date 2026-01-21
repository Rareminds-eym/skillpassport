/**
 * OrganizationProvidedFeatures Component
 *
 * Displays features provided to a member by their organization.
 * Shows organization name, admin contact, expiration date, and "Managed by" badge.
 *
 * Requirements: 5.1, 5.2, 5.3, 5.4
 */

import {
  AlertTriangle,
  Building2,
  Calendar,
  CheckCircle2,
  Clock,
  Mail,
  Shield,
} from 'lucide-react';
import { memo, useMemo } from 'react';

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

interface OrganizationProvidedFeaturesProps {
  organization: OrganizationInfo;
  subscription: SubscriptionInfo;
  features: OrganizationFeature[];
  className?: string;
}

function OrganizationProvidedFeatures({
  organization,
  subscription,
  features,
  className = '',
}: OrganizationProvidedFeaturesProps) {
  // Calculate days until expiration
  const daysUntilExpiration = useMemo(() => {
    const now = new Date();
    const end = new Date(subscription.endDate);
    const diffTime = end.getTime() - now.getTime();
    return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  }, [subscription.endDate]);

  // Determine status styling
  const statusConfig = useMemo(() => {
    switch (subscription.status) {
      case 'active':
        return {
          bgColor: 'bg-green-50',
          borderColor: 'border-green-200',
          textColor: 'text-green-700',
          icon: CheckCircle2,
          label: 'Active',
        };
      case 'expiring_soon':
        return {
          bgColor: 'bg-amber-50',
          borderColor: 'border-amber-200',
          textColor: 'text-amber-700',
          icon: Clock,
          label: `Expires in ${daysUntilExpiration} days`,
        };
      case 'grace_period':
        return {
          bgColor: 'bg-orange-50',
          borderColor: 'border-orange-200',
          textColor: 'text-orange-700',
          icon: AlertTriangle,
          label: 'Grace Period',
        };
      case 'expired':
        return {
          bgColor: 'bg-red-50',
          borderColor: 'border-red-200',
          textColor: 'text-red-700',
          icon: AlertTriangle,
          label: 'Expired',
        };
      default:
        return {
          bgColor: 'bg-gray-50',
          borderColor: 'border-gray-200',
          textColor: 'text-gray-700',
          icon: Shield,
          label: 'Unknown',
        };
    }
  }, [subscription.status, daysUntilExpiration]);

  const StatusIcon = statusConfig.icon;

  const organizationLabel = {
    school: 'School',
    college: 'College',
    university: 'University',
  }[organization.type];

  const activeFeatures = features.filter((f) => f.isActive);

  return (
    <div className={`bg-white rounded-2xl border border-gray-200 overflow-hidden ${className}`}>
      {/* Header with "Managed by" badge */}
      <div className="bg-gradient-to-r from-blue-600 to-indigo-600 px-6 py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-white/20 rounded-lg flex items-center justify-center">
              <Building2 className="w-5 h-5 text-white" />
            </div>
            <div>
              <p className="text-blue-100 text-sm">Managed by</p>
              <h3 className="text-white font-semibold">{organization.name}</h3>
            </div>
          </div>
          <span className="px-3 py-1 bg-white/20 rounded-full text-white text-sm font-medium">
            {organizationLabel}
          </span>
        </div>
      </div>

      {/* Subscription Status */}
      <div className={`px-6 py-3 ${statusConfig.bgColor} border-b ${statusConfig.borderColor}`}>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <StatusIcon className={`w-4 h-4 ${statusConfig.textColor}`} />
            <span className={`text-sm font-medium ${statusConfig.textColor}`}>
              {statusConfig.label}
            </span>
          </div>
          <span className="text-sm text-gray-600">{subscription.planName}</span>
        </div>
      </div>

      {/* Content */}
      <div className="p-6 space-y-6">
        {/* Expiration Warning */}
        {(subscription.status === 'expiring_soon' || subscription.status === 'grace_period') && (
          <div
            className={`p-4 rounded-xl ${
              subscription.status === 'grace_period' ? 'bg-orange-50' : 'bg-amber-50'
            }`}
          >
            <div className="flex items-start gap-3">
              <AlertTriangle
                className={`w-5 h-5 flex-shrink-0 ${
                  subscription.status === 'grace_period' ? 'text-orange-500' : 'text-amber-500'
                }`}
              />
              <div>
                <p
                  className={`font-medium ${
                    subscription.status === 'grace_period' ? 'text-orange-800' : 'text-amber-800'
                  }`}
                >
                  {subscription.status === 'grace_period'
                    ? 'Your subscription is in grace period'
                    : 'Your subscription is expiring soon'}
                </p>
                <p
                  className={`text-sm mt-1 ${
                    subscription.status === 'grace_period' ? 'text-orange-600' : 'text-amber-600'
                  }`}
                >
                  {subscription.status === 'grace_period'
                    ? 'Contact your organization admin to renew the subscription.'
                    : `Your access will expire on ${new Date(subscription.endDate).toLocaleDateString()}.`}
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Subscription Details */}
        <div className="grid grid-cols-2 gap-4">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 bg-gray-100 rounded-lg flex items-center justify-center">
              <Calendar className="w-4 h-4 text-gray-500" />
            </div>
            <div>
              <p className="text-xs text-gray-500">Valid Until</p>
              <p className="text-sm font-medium text-gray-900">
                {new Date(subscription.endDate).toLocaleDateString('en-IN', {
                  day: 'numeric',
                  month: 'short',
                  year: 'numeric',
                })}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 bg-gray-100 rounded-lg flex items-center justify-center">
              <Shield className="w-4 h-4 text-gray-500" />
            </div>
            <div>
              <p className="text-xs text-gray-500">Auto-Renew</p>
              <p className="text-sm font-medium text-gray-900">
                {subscription.autoRenew ? 'Enabled' : 'Disabled'}
              </p>
            </div>
          </div>
        </div>

        {/* Features List */}
        <div>
          <h4 className="text-sm font-medium text-gray-700 mb-3">
            Included Features ({activeFeatures.length})
          </h4>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            {activeFeatures.map((feature) => (
              <div key={feature.id} className="flex items-center gap-2 p-2 bg-gray-50 rounded-lg">
                <CheckCircle2 className="w-4 h-4 text-green-500 flex-shrink-0" />
                <div className="min-w-0">
                  <p className="text-sm font-medium text-gray-900 truncate">{feature.name}</p>
                  {feature.description && (
                    <p className="text-xs text-gray-500 truncate">{feature.description}</p>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Admin Contact */}
        {(organization.adminName || organization.adminEmail) && (
          <div className="pt-4 border-t border-gray-200">
            <h4 className="text-sm font-medium text-gray-700 mb-3">Organization Admin</h4>
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                <span className="text-blue-600 font-medium">
                  {organization.adminName?.charAt(0) || 'A'}
                </span>
              </div>
              <div className="flex-1 min-w-0">
                {organization.adminName && (
                  <p className="text-sm font-medium text-gray-900">{organization.adminName}</p>
                )}
                {organization.adminEmail && (
                  <a
                    href={`mailto:${organization.adminEmail}`}
                    className="flex items-center gap-1 text-sm text-blue-600 hover:underline"
                  >
                    <Mail className="w-3 h-3" />
                    {organization.adminEmail}
                  </a>
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default memo(OrganizationProvidedFeatures);
