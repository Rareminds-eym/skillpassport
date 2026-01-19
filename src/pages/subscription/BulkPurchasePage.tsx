/**
 * BulkPurchasePage
 * 
 * Wrapper page component for the BulkPurchaseWizard.
 * Provides organization context and handles purchase completion.
 */

import { useCallback, useEffect, useMemo, useState } from 'react';
import toast from 'react-hot-toast';
import { useNavigate, useSearchParams } from 'react-router-dom';
import BulkPurchaseWizard, { PurchaseData } from '../../components/Subscription/Organization/BulkPurchaseWizard';
import useAuth from '../../hooks/useAuth';
import { supabase } from '../../lib/supabaseClient';
import { organizationMemberService } from '../../services/organization/organizationMemberService';

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
  const { user, isAuthenticated } = useAuth();
  
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
      console.log('[BulkPurchasePage] Fetching organization ID, user:', user);
      
      // First check user object
      if (user?.school_id) { console.log('[BulkPurchasePage] Found school_id:', user.school_id); setOrganizationId(String(user.school_id)); return; }
      if (user?.college_id) { console.log('[BulkPurchasePage] Found college_id:', user.college_id); setOrganizationId(String(user.college_id)); return; }
      if (user?.university_id) { console.log('[BulkPurchasePage] Found university_id:', user.university_id); setOrganizationId(String(user.university_id)); return; }
      if (user?.schoolId) { console.log('[BulkPurchasePage] Found schoolId:', user.schoolId); setOrganizationId(String(user.schoolId)); return; }
      if (user?.collegeId) { console.log('[BulkPurchasePage] Found collegeId:', user.collegeId); setOrganizationId(String(user.collegeId)); return; }
      if (user?.universityId) { console.log('[BulkPurchasePage] Found universityId:', user.universityId); setOrganizationId(String(user.universityId)); return; }
      
      // Fallback to localStorage
      const storedUser = localStorage.getItem('user');
      console.log('[BulkPurchasePage] Checking localStorage user:', storedUser);
      if (storedUser) {
        try {
          const userData = JSON.parse(storedUser);
          if (userData.schoolId) { console.log('[BulkPurchasePage] Found schoolId in localStorage:', userData.schoolId); setOrganizationId(userData.schoolId); return; }
          if (userData.collegeId) { console.log('[BulkPurchasePage] Found collegeId in localStorage:', userData.collegeId); setOrganizationId(userData.collegeId); return; }
          if (userData.universityId) { console.log('[BulkPurchasePage] Found universityId in localStorage:', userData.universityId); setOrganizationId(userData.universityId); return; }
        } catch (e) { /* ignore */ }
      }
      
      // Fetch from database
      const userId = user?.id;
      let userEmail = user?.email;
      
      // Fallback to localStorage for email
      if (!userEmail) {
        userEmail = localStorage.getItem('userEmail') || undefined;
      }
      
      console.log('[BulkPurchasePage] Fetching from database, userId:', userId, 'userEmail:', userEmail);
      
      if (!userId && !userEmail) {
        console.log('[BulkPurchasePage] No userId or userEmail, cannot fetch organization');
        return;
      }
      
      try {
        // Try school_educators table first for school admins
        if (organizationType === 'school' && userId) {
          console.log('[BulkPurchasePage] Querying school_educators by user_id:', userId);
          const { data: educatorData, error: educatorError } = await supabase
            .from('school_educators')
            .select('school_id')
            .eq('user_id', userId)
            .maybeSingle();
          
          console.log('[BulkPurchasePage] school_educators result:', educatorData, educatorError);
          
          if (educatorData?.school_id) {
            console.log('[BulkPurchasePage] Found school_id from school_educators:', educatorData.school_id);
            setOrganizationId(educatorData.school_id);
            return;
          }
        }
        
        // Try college_lecturers table for college admins
        if (organizationType === 'college' && userId) {
          console.log('[BulkPurchasePage] Querying college_lecturers by user_id:', userId);
          const { data: lecturerData, error: lecturerError } = await supabase
            .from('college_lecturers')
            .select('collegeId')
            .eq('user_id', userId)
            .maybeSingle();
          
          console.log('[BulkPurchasePage] college_lecturers result:', lecturerData, lecturerError);
          
          if (lecturerData?.collegeId) {
            console.log('[BulkPurchasePage] Found collegeId from college_lecturers:', lecturerData.collegeId);
            setOrganizationId(lecturerData.collegeId);
            return;
          }
        }
        
        // Try organizations table by email
        if (userEmail) {
          console.log('[BulkPurchasePage] Querying organizations by email:', userEmail, 'type:', organizationType);
          const { data: orgByEmail, error: emailError } = await supabase
            .from('organizations')
            .select('id')
            .eq('organization_type', organizationType)
            .ilike('email', userEmail)
            .maybeSingle();
          
          console.log('[BulkPurchasePage] Organizations by email result:', orgByEmail, emailError);
          
          if (orgByEmail?.id) {
            console.log('[BulkPurchasePage] Found organization by email:', orgByEmail.id);
            setOrganizationId(orgByEmail.id);
            return;
          }
        }
        
        // Try by admin_id
        if (userId) {
          console.log('[BulkPurchasePage] Querying organizations by admin_id:', userId);
          const { data: orgByAdminId, error: adminError } = await supabase
            .from('organizations')
            .select('id')
            .eq('organization_type', organizationType)
            .eq('admin_id', userId)
            .maybeSingle();
          
          console.log('[BulkPurchasePage] Organizations by admin_id result:', orgByAdminId, adminError);
          
          if (orgByAdminId?.id) {
            console.log('[BulkPurchasePage] Found organization by admin_id:', orgByAdminId.id);
            setOrganizationId(orgByAdminId.id);
            return;
          }
        }
        
        console.log('[BulkPurchasePage] Could not find organization ID');
      } catch (err) {
        console.error('[BulkPurchasePage] Error fetching organization ID:', err);
      }
    };
    
    fetchOrganizationId();
  }, [user, organizationType]);
  
  // Fetch members when organizationId is available
  const fetchMembers = useCallback(async () => {
    console.log('[BulkPurchasePage] fetchMembers called, organizationId:', organizationId);
    if (!organizationId) {
      console.log('[BulkPurchasePage] No organizationId, skipping member fetch');
      return;
    }
    
    setIsLoadingMembers(true);
    try {
      console.log('[BulkPurchasePage] Fetching members for org:', organizationId, 'type:', organizationType);
      const result = await organizationMemberService.fetchOrganizationMembers({
        organizationId,
        organizationType,
        memberType: 'all',
        includeAssignmentStatus: false,
        limit: 500,
      });
      
      console.log('[BulkPurchasePage] Members fetched:', result.members.length, 'total:', result.total);
      
      // Transform to the format expected by BulkPurchaseWizard
      const transformedMembers = result.members.map(m => ({
        id: m.id,
        name: m.name,
        email: m.email,
        type: m.memberType,
        department: m.department,
        grade: m.grade,
      }));
      
      setAvailableMembers(transformedMembers);
    } catch (err) {
      console.error('[BulkPurchasePage] Error fetching members:', err);
    } finally {
      setIsLoadingMembers(false);
    }
  }, [organizationId, organizationType]);
  
  useEffect(() => {
    fetchMembers();
  }, [fetchMembers]);
  
  const organizationName = user?.school_name || user?.college_name || user?.university_name || 'Your Organization';
  
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
          plan: AVAILABLE_PLANS.find(p => p.id === purchaseData.planId),
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
      console.error('Purchase error:', error);
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
  
  return (
    <BulkPurchaseWizard
      organizationId={organizationId}
      organizationType={organizationType}
      organizationName={organizationName}
      availablePlans={AVAILABLE_PLANS}
      availableMembers={availableMembers}
      onComplete={handleComplete}
      onCancel={handleCancel}
      onMemberAdded={fetchMembers}
      isLoading={isLoadingMembers}
    />
  );
}

export default BulkPurchasePage;
