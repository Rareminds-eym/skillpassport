/**
 * BulkPurchasePage
 * 
 * Wrapper page component for the BulkPurchaseWizard.
 * Provides organization context and handles purchase completion.
 */

import { useCallback, useEffect, useMemo, useState } from 'react';
import toast from 'react-hot-toast';
import { useNavigate, useSearchParams } from 'react-router-dom';
import BulkPurchaseWizard from '@/features/subscription/ui/organization/BulkPurchaseWizard';
import type { PurchaseData } from '@/features/subscription/ui/organization/BulkPurchaseWizard';

import { supabase } from '@/shared/api/supabaseClient';
import { organizationMemberService } from '@/entities/organization';
import { useSubscriptionPlansData } from '@/features/subscription/model';
import { getLogger } from '@/shared/config/logging';

import { useUser, useIsAuthenticated } from '@/shared/model/authStore';

const logger = getLogger('bulk-purchase-page');
function BulkPurchasePage() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const user = useUser();
  const isAuthenticated = useIsAuthenticated();

  // Get mode from search params (e.g., ?mode=add-seats&subscriptionId=xxx)
  const mode = searchParams.get('mode');
  const existingSubscriptionId = searchParams.get('subscriptionId');

  // Determine organization context
  const organizationType = useMemo(() => {
    const role = user?.role || '';
    if (role.includes('school')) return 'school' as const;
    if (role.includes('college')) return 'college' as const;
    if (role.includes('university')) return 'university' as const;
    return 'school' as const;
  }, [user?.role]);

  // State for organization ID (needs to be fetched for school_admin)
  const [organizationId, setOrganizationId] = useState<string>('');
  const [availableMembers, setAvailableMembers] = useState<Array<{
    id: string;
    name: string;
    email: string;
    type: 'educator' | 'student';
    department?: string;
    grade?: string;
  }>>([]);
  const [isLoadingMembers, setIsLoadingMembers] = useState(false);

  // Fetch organization ID
  useEffect(() => {
    const fetchOrganizationId = async () => {
      const userWithOrg = user as any;

      if (userWithOrg?.school_id) { setOrganizationId(String(userWithOrg.school_id)); return; }
      if (userWithOrg?.college_id) { setOrganizationId(String(userWithOrg.college_id)); return; }
      if (userWithOrg?.university_id) { setOrganizationId(String(userWithOrg.university_id)); return; }
      if (userWithOrg?.schoolId) { setOrganizationId(String(userWithOrg.schoolId)); return; }
      if (userWithOrg?.collegeId) { setOrganizationId(String(userWithOrg.collegeId)); return; }
      if (userWithOrg?.universityId) { setOrganizationId(String(userWithOrg.universityId)); return; }

      const storedUser = localStorage.getItem('user');
      if (storedUser) {
        try {
          const userData = JSON.parse(storedUser);
          if (userData.schoolId) { setOrganizationId(userData.schoolId); return; }
          if (userData.collegeId) { setOrganizationId(userData.collegeId); return; }
          if (userData.universityId) { setOrganizationId(userData.universityId); return; }
        } catch (e) { /* ignore */ }
      }

      const userId = user?.id;
      let userEmail = user?.email;

      if (!userEmail) {
        userEmail = localStorage.getItem('userEmail') || undefined;
      }

      if (!userId && !userEmail) {
        return;
      }

      try {
        if (organizationType === 'school' && userId) {
          const { data: educatorData } = await supabase
            .from('school_educators')
            .select('school_id')
            .eq('user_id', userId)
            .maybeSingle();

          if (educatorData?.school_id) {
            setOrganizationId(educatorData.school_id);
            return;
          }
        }

        if (organizationType === 'college' && userId) {
          const { data: lecturerData } = await supabase
            .from('college_lecturers')
            .select('collegeId')
            .eq('user_id', userId)
            .maybeSingle();

          if (lecturerData?.collegeId) {
            setOrganizationId(lecturerData.collegeId);
            return;
          }
        }

        if (userEmail) {
          const { data: orgByEmail } = await supabase
            .from('organizations')
            .select('id')
            .eq('organization_type', organizationType)
            .ilike('email', userEmail)
            .maybeSingle();

          if (orgByEmail?.id) {
            setOrganizationId(orgByEmail.id);
            return;
          }
        }

        if (userId) {
          const { data: orgByAdminId } = await supabase
            .from('organizations')
            .select('id')
            .eq('organization_type', organizationType)
            .eq('admin_id', userId)
            .maybeSingle();

          if (orgByAdminId?.id) {
            setOrganizationId(orgByAdminId.id);
            return;
          }
        }
      } catch (err) {
        logger.error('Failed to fetch organization ID', err instanceof Error ? err : new Error(String(err)));
      }
    };

    fetchOrganizationId();
  }, [user, organizationType]);

  // Fetch B2B plans directly from the API
  const { plans: dbPlans, loading: plansLoading } = useSubscriptionPlansData({
    businessType: 'b2b',
    entityType: 'all',
    roleType: 'all'
  });

  const availablePlans = useMemo(() => {
    if (!dbPlans || !Array.isArray(dbPlans)) return [];
    return (dbPlans as any[]).map((plan: any) => ({
      id: plan.id,
      name: plan.name,
      price: plan.price ? parseInt(plan.price) : 0,
      duration: 'month', // Assuming monthly billing for bulk org purchase display
      features: plan.features || [],
      description: plan.tagline || plan.positioning || '',
    }));
  }, [dbPlans]);

  // Fetch members when organizationId is available
  const fetchMembers = useCallback(async () => {
    if (!organizationId) {
      return;
    }

    setIsLoadingMembers(true);
    try {
      const result = await organizationMemberService.fetchOrganizationMembers({
        organizationId,
        organizationType,
        memberType: 'all',
        includeAssignmentStatus: false,
        limit: 500,
      });

      const transformedMembers = result.members.map((m: any) => ({
        id: m.id,
        name: m.name,
        email: m.email,
        type: m.memberType,
        department: m.department,
        grade: m.grade,
      }));

      setAvailableMembers(transformedMembers);
    } catch (err) {
      logger.error('Failed to fetch members', err instanceof Error ? err : new Error(String(err)));
    } finally {
      setIsLoadingMembers(false);
    }
  }, [organizationId, organizationType]);

  useEffect(() => {
    fetchMembers();
  }, [fetchMembers]);

  const organizationName = (user as any)?.school_name || (user as any)?.college_name || (user as any)?.university_name || 'Your Organization';

  // Get base path for navigation
  const basePath = useMemo(() => {
    if (organizationType === 'school') return '/school-admin';
    if (organizationType === 'college') return '/college-admin';
    if (organizationType === 'university') return '/university-admin';
    return '/school-admin';
  }, [organizationType]);

  const handleComplete = useCallback(async (purchaseData: PurchaseData) => {
    try {
      // Navigate to organization payment page with purchase data
      navigate(`${basePath}/subscription/organization-payment`, {
        state: {
          plan: availablePlans.find((p: any) => p.id === purchaseData.planId),
          isOrganizationPurchase: true,
          mode: mode || 'new',
          existingSubscriptionId,
          organizationId: purchaseData.organizationId, // Pass organizationId explicitly
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
      logger.error('Purchase error', error instanceof Error ? error : new Error(String(error)));
      toast.error('Failed to process purchase. Please try again.');
    }
  }, [navigate, basePath, mode, existingSubscriptionId]);

  const handleCancel = useCallback(() => {
    navigate(`${basePath}/subscription/organization`);
  }, [navigate, basePath]);

  // Check if user is authenticated
  if (!isAuthenticated || !user) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 p-4">
        <div className="bg-white rounded-xl border border-gray-200 p-8 text-center max-w-md">
          <h3 className="text-lg font-semibold text-gray-900 mb-2">Authentication Required</h3>
          <p className="text-gray-600 mb-4">Please log in to purchase organization subscriptions.</p>
          <button
            onClick={() => navigate('/login')}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
          >
            Log In
          </button>
        </div>
      </div>
    );
  }

  if (plansLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 p-4">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <BulkPurchaseWizard
      organizationId={organizationId}
      organizationType={organizationType}
      organizationName={organizationName}
      availablePlans={availablePlans}
      availableMembers={availableMembers}
      onComplete={handleComplete}
      onCancel={handleCancel}
      onMemberAdded={fetchMembers}
      isLoading={isLoadingMembers}
    />
  );
}

export default BulkPurchasePage;
