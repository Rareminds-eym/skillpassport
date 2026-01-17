/**
 * OrganizationSubscriptionDashboard Component
 * 
 * Main dashboard for organization subscription management.
 * Combines subscription overview, license pools, member assignments, and billing.
 */

import { CreditCard, LayoutDashboard, Mail, Settings, Users } from 'lucide-react';
import { memo, useCallback, useState } from 'react';
import BillingDashboard from './BillingDashboard';
import InvitationManager from './InvitationManager';
import LicensePoolManager from './LicensePoolManager';
import MemberAssignments from './MemberAssignments';
import SubscriptionOverview from './SubscriptionOverview';

type TabId = 'overview' | 'pools' | 'members' | 'billing' | 'invitations';

interface Tab {
  id: TabId;
  label: string;
  icon: React.ReactNode;
}

const TABS: Tab[] = [
  { id: 'overview', label: 'Overview', icon: <LayoutDashboard className="w-4 h-4" /> },
  { id: 'pools', label: 'License Pools', icon: <Settings className="w-4 h-4" /> },
  { id: 'members', label: 'Members', icon: <Users className="w-4 h-4" /> },
  { id: 'billing', label: 'Billing', icon: <CreditCard className="w-4 h-4" /> },
  { id: 'invitations', label: 'Invitations', icon: <Mail className="w-4 h-4" /> },
];

interface Subscription {
  id: string;
  planName: string;
  totalSeats: number;
  assignedSeats: number;
  status: 'active' | 'paused' | 'cancelled' | 'expired' | 'grace_period';
  startDate: string;
  endDate: string;
  autoRenew: boolean;
  targetMemberType: 'educator' | 'student' | 'both';
}

interface LicensePool {
  id: string;
  poolName: string;
  memberType: 'educator' | 'student';
  allocatedSeats: number;
  assignedSeats: number;
  availableSeats: number;
  autoAssignNewMembers: boolean;
  isActive: boolean;
  createdAt: string;
}

interface Member {
  id: string;
  name: string;
  email: string;
  memberType: 'educator' | 'student';
  department?: string;
  hasLicense: boolean;
  assignedAt?: string;
  poolName?: string;
}

interface OrganizationDetails {
  id?: string;
  name?: string;
  email?: string;
  phone?: string;
  address?: string;
  city?: string;
  state?: string;
  country?: string;
  pincode?: string;
  website?: string;
  logoUrl?: string;
  organizationType?: string;
  establishedYear?: number;
  code?: string;
  verificationStatus?: string;
  accountStatus?: string;
}

interface OrganizationSubscriptionDashboardProps {
  organizationId: string;
  organizationName: string;
  organizationType: 'school' | 'college' | 'university';
  organizationDetails?: OrganizationDetails;
  subscriptions: Subscription[];
  licensePools: LicensePool[];
  members: Member[];
  isLoading?: boolean;
  onAddSeats: (subscriptionId: string) => void;
  onManageSubscription: (subscriptionId: string) => void;
  onRenewSubscription: (subscriptionId: string) => void;
  onViewSubscriptionDetails: (subscriptionId: string) => void;
  onBrowsePlans: () => void;
  onCreatePool: () => void;
  onEditPool: (poolId: string) => void;
  onDeletePool: (poolId: string) => void;
  onConfigureAutoAssign: (poolId: string) => void;
  onViewPoolAssignments: (poolId: string) => void;
  onAssignLicenses: (memberIds: string[]) => void;
  onUnassignLicenses: (memberIds: string[]) => void;
  onTransferLicense: (fromMemberId: string, toMemberId: string) => void;
  onViewMemberHistory: (memberId: string) => void;
  onRemoveMember?: (memberId: string, memberType: 'educator' | 'student') => void;
  onMemberAdded?: () => void;
}

function OrganizationSubscriptionDashboard(props: OrganizationSubscriptionDashboardProps) {
  const {
    organizationId,
    organizationName,
    organizationType,
    organizationDetails,
    subscriptions,
    licensePools,
    members,
    isLoading = false,
    onAddSeats,
    onManageSubscription,
    onRenewSubscription,
    onViewSubscriptionDetails,
    onBrowsePlans,
    onCreatePool,
    onEditPool,
    onDeletePool,
    onConfigureAutoAssign,
    onViewPoolAssignments,
    onAssignLicenses,
    onUnassignLicenses,
    onTransferLicense,
    onViewMemberHistory,
    onRemoveMember,
    onMemberAdded,
  } = props;

  const [activeTab, setActiveTab] = useState<TabId>('overview');

  const totalSeats = subscriptions
    .filter((s) => s.status === 'active' || s.status === 'grace_period')
    .reduce((sum, s) => sum + s.totalSeats, 0);

  const assignedSeats = subscriptions
    .filter((s) => s.status === 'active' || s.status === 'grace_period')
    .reduce((sum, s) => sum + s.assignedSeats, 0);

  const availableSeats = totalSeats - assignedSeats;
  const totalUnallocatedSeats = availableSeats - licensePools.reduce((sum, p) => sum + p.availableSeats, 0);

  const handleTabChange = useCallback((tabId: TabId) => {
    setActiveTab(tabId);
  }, []);

  const renderTabContent = () => {
    switch (activeTab) {
      case 'overview':
        return (
          <SubscriptionOverview
            subscriptions={subscriptions}
            organizationDetails={organizationDetails}
            onAddSeats={onAddSeats}
            onManage={onManageSubscription}
            onRenew={onRenewSubscription}
            onViewDetails={onViewSubscriptionDetails}
            onBrowsePlans={onBrowsePlans}
            isLoading={isLoading}
          />
        );
      case 'pools':
        return (
          <LicensePoolManager
            pools={licensePools}
            totalAvailableSeats={totalUnallocatedSeats > 0 ? totalUnallocatedSeats : 0}
            onCreatePool={onCreatePool}
            onEditPool={onEditPool}
            onDeletePool={onDeletePool}
            onConfigureAutoAssign={onConfigureAutoAssign}
            onViewAssignments={onViewPoolAssignments}
            isLoading={isLoading}
          />
        );
      case 'members':
        return (
          <MemberAssignments
            members={members}
            availableSeats={availableSeats}
            onAssign={onAssignLicenses}
            onUnassign={onUnassignLicenses}
            onTransfer={onTransferLicense}
            onViewHistory={onViewMemberHistory}
            onRemoveMember={onRemoveMember}
            onMemberAdded={onMemberAdded}
            isLoading={isLoading}
          />
        );
      case 'billing':
        return (
          <BillingDashboard
            organizationId={organizationId}
            organizationType={organizationType}
            isLoading={isLoading}
          />
        );
      case 'invitations':
        return (
          <InvitationManager
            organizationId={organizationId}
            organizationType={organizationType}
            licensePools={licensePools.map(p => ({
              id: p.id,
              poolName: p.poolName,
              memberType: p.memberType,
              availableSeats: p.availableSeats,
            }))}
            isLoading={isLoading}
          />
        );
      default:
        return null;
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Subscription Management</h1>
          <p className="text-gray-500 mt-1">{organizationName}</p>
        </div>
      </div>

      {/* Tab Navigation */}
      <div className="border-b border-gray-200">
        <nav className="flex gap-1 -mb-px">
          {TABS.map((tab) => (
            <button
              key={tab.id}
              onClick={() => handleTabChange(tab.id)}
              className={`flex items-center gap-2 px-4 py-3 text-sm font-medium border-b-2 transition-colors ${
                activeTab === tab.id
                  ? 'border-blue-600 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              {tab.icon}
              {tab.label}
            </button>
          ))}
        </nav>
      </div>

      {/* Tab Content */}
      <div>{renderTabContent()}</div>
    </div>
  );
}

export default memo(OrganizationSubscriptionDashboard);
