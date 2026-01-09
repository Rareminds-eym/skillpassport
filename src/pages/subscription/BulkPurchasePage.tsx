/**
 * BulkPurchasePage
 * 
 * Wrapper page component for the BulkPurchaseWizard.
 * Provides organization context and handles purchase completion.
 */

import { useCallback, useMemo } from 'react';
import toast from 'react-hot-toast';
import { useNavigate, useSearchParams } from 'react-router-dom';
import BulkPurchaseWizard, { PurchaseData } from '../../components/Subscription/Organization/BulkPurchaseWizard';
import useAuth from '../../hooks/useAuth';

// Sample plans - in production, fetch from subscription service
const AVAILABLE_PLANS = [
  {
    id: 'basic',
    name: 'Basic',
    price: 299,
    duration: 'month',
    features: ['Core features', 'Email support', 'Basic analytics'],
    description: 'Perfect for small teams',
  },
  {
    id: 'professional',
    name: 'Professional',
    price: 599,
    duration: 'month',
    features: ['All Basic features', 'Priority support', 'Advanced analytics', 'API access'],
    description: 'Best for growing organizations',
  },
  {
    id: 'enterprise',
    name: 'Enterprise',
    price: 999,
    duration: 'month',
    features: ['All Professional features', 'Dedicated support', 'Custom integrations', 'SSO', 'SLA'],
    description: 'For large institutions',
  },
];

function BulkPurchasePage() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { user } = useAuth();
  
  // Determine organization context
  const organizationType = useMemo(() => {
    const role = user?.role || '';
    if (role.includes('school')) return 'school' as const;
    if (role.includes('college')) return 'college' as const;
    if (role.includes('university')) return 'university' as const;
    return 'school' as const;
  }, [user?.role]);
  
  const organizationId = user?.school_id || user?.college_id || user?.university_id || '';
  const organizationName = user?.school_name || user?.college_name || user?.university_name || 'Your Organization';
  
  // Get base path for navigation
  const basePath = useMemo(() => {
    if (organizationType === 'school') return '/school-admin';
    if (organizationType === 'college') return '/college-admin';
    if (organizationType === 'university') return '/university-admin';
    return '/school-admin';
  }, [organizationType]);
  
  // Mock members - in production, fetch from member service
  const availableMembers = useMemo(() => [], []);
  
  const handleComplete = useCallback(async (purchaseData: PurchaseData) => {
    try {
      // Navigate to payment page with purchase data
      navigate('/subscription/payment', {
        state: {
          plan: AVAILABLE_PLANS.find(p => p.id === purchaseData.planId),
          isOrganizationPurchase: true,
          organizationConfig: {
            organizationType: purchaseData.organizationType,
            seatCount: purchaseData.seatCount,
            memberType: purchaseData.memberType,
            billingCycle: purchaseData.billingCycle,
            pricing: purchaseData.pricing,
            assignmentMode: purchaseData.assignmentMode,
            selectedMemberIds: purchaseData.selectedMemberIds,
            poolName: purchaseData.poolName,
            autoAssignNewMembers: purchaseData.autoAssignNewMembers,
            billingEmail: purchaseData.billingEmail,
            billingName: purchaseData.billingName,
            gstNumber: purchaseData.gstNumber,
          },
        },
      });
    } catch (error) {
      console.error('Purchase error:', error);
      toast.error('Failed to process purchase. Please try again.');
    }
  }, [navigate]);
  
  const handleCancel = useCallback(() => {
    navigate(`${basePath}/subscription/organization`);
  }, [navigate, basePath]);
  
  return (
    <BulkPurchaseWizard
      organizationId={organizationId}
      organizationType={organizationType}
      organizationName={organizationName}
      availablePlans={AVAILABLE_PLANS}
      availableMembers={availableMembers}
      onComplete={handleComplete}
      onCancel={handleCancel}
    />
  );
}

export default BulkPurchasePage;
