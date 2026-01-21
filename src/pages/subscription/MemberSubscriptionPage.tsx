/**
 * MemberSubscriptionPage
 *
 * Wrapper page component for MemberSubscriptionView.
 * Shows members their organization-provided subscription and personal add-ons.
 */

import { useCallback, useMemo } from 'react';
import toast from 'react-hot-toast';
import { useNavigate } from 'react-router-dom';
import MemberSubscriptionView from '../../components/Subscription/Organization/MemberSubscriptionView';
import useAuth from '../../hooks/useAuth';

// Sample add-ons - in production, fetch from subscription service
const AVAILABLE_ADDONS = [
  {
    id: 'career-ai',
    name: 'Career AI Assistant',
    description: 'AI-powered career guidance and job matching',
    price: 199,
    billingCycle: 'monthly' as const,
    features: ['Personalized career advice', 'Job matching', 'Resume optimization'],
    isPopular: true,
  },
  {
    id: 'advanced-analytics',
    name: 'Advanced Analytics',
    description: 'Deep insights into your learning progress',
    price: 149,
    billingCycle: 'monthly' as const,
    features: ['Detailed progress reports', 'Skill gap analysis', 'Peer comparison'],
  },
  {
    id: 'certificate-bundle',
    name: 'Certificate Bundle',
    description: 'Access to premium certification courses',
    price: 999,
    billingCycle: 'one-time' as const,
    features: ['10 premium certificates', 'Industry recognition', 'Lifetime access'],
    isNew: true,
  },
];

function MemberSubscriptionPage() {
  const navigate = useNavigate();
  const { user, isAuthenticated } = useAuth();

  // Check if user has organization subscription
  const hasOrganizationSubscription = useMemo(() => {
    // In production, check user's subscription status
    return !!(user?.school_id || user?.college_id || user?.university_id);
  }, [user]);

  // Organization info
  const organization = useMemo(() => {
    if (!hasOrganizationSubscription) return undefined;

    const type = user?.school_id ? 'school' : user?.college_id ? 'college' : 'university';
    return {
      id: user?.school_id || user?.college_id || user?.university_id || '',
      name: user?.school_name || user?.college_name || user?.university_name || 'Your Organization',
      type: type as 'school' | 'college' | 'university',
      adminName: 'Admin',
      adminEmail: 'admin@organization.com',
    };
  }, [hasOrganizationSubscription, user]);

  // Subscription info - in production, fetch from service
  const subscription = useMemo(() => {
    if (!hasOrganizationSubscription) return undefined;

    const now = new Date();
    const endDate = new Date(now);
    endDate.setMonth(endDate.getMonth() + 6);

    return {
      planName: 'Professional Plan',
      startDate: now,
      endDate: endDate,
      status: 'active' as const,
      autoRenew: true,
    };
  }, [hasOrganizationSubscription]);

  // Organization features - in production, fetch from service
  const organizationFeatures = useMemo(
    () => [
      {
        id: '1',
        name: 'Skill Assessments',
        description: 'Access to all skill assessments',
        isActive: true,
      },
      {
        id: '2',
        name: 'Learning Courses',
        description: 'Full course library access',
        isActive: true,
      },
      {
        id: '3',
        name: 'Digital Portfolio',
        description: 'Create and share your portfolio',
        isActive: true,
      },
      {
        id: '4',
        name: 'Career Guidance',
        description: 'Basic career guidance tools',
        isActive: true,
      },
    ],
    []
  );

  // Purchased add-ons - in production, fetch from service
  const purchasedAddOns = useMemo(() => [], []);

  // Handlers
  const handlePurchaseAddOn = useCallback(
    (addOnId: string) => {
      const addOn = AVAILABLE_ADDONS.find((a) => a.id === addOnId);
      if (addOn) {
        navigate('/subscription/payment', {
          state: {
            plan: addOn,
            isAddOn: true,
          },
        });
      }
    },
    [navigate]
  );

  const handleManageAddOn = useCallback((_addOnId: string) => {
    toast.success('Opening add-on management...');
  }, []);

  const handleContactAdmin = useCallback(() => {
    toast.success('Opening contact form...');
    // In production, open a contact modal or navigate to messaging
  }, []);

  const handleDismissWarning = useCallback(() => {
    // In production, save dismissal preference
  }, []);

  // Check if user is authenticated
  if (!isAuthenticated || !user) {
    return (
      <div className="p-6 max-w-4xl mx-auto">
        <div className="bg-amber-50 border border-amber-200 rounded-xl p-6 text-center">
          <h3 className="text-lg font-semibold text-amber-800 mb-2">Authentication Required</h3>
          <p className="text-amber-600 mb-4">Please log in to view your subscription.</p>
          <button
            onClick={() => navigate('/login')}
            className="px-4 py-2 bg-amber-600 text-white rounded-lg hover:bg-amber-700"
          >
            Log In
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 max-w-4xl mx-auto">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">My Subscription</h1>
        <p className="text-gray-500 mt-1">View your subscription benefits and available add-ons</p>
      </div>

      <MemberSubscriptionView
        hasOrganizationSubscription={hasOrganizationSubscription}
        organization={organization}
        subscription={subscription}
        organizationFeatures={organizationFeatures}
        purchasedAddOns={purchasedAddOns}
        availableAddOns={AVAILABLE_ADDONS}
        onPurchaseAddOn={handlePurchaseAddOn}
        onManageAddOn={handleManageAddOn}
        onContactAdmin={handleContactAdmin}
        onDismissWarning={handleDismissWarning}
      />
    </div>
  );
}

export default MemberSubscriptionPage;
