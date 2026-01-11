/**
 * OrganizationSubscriptionPage
 * 
 * Wrapper page component that provides data and handlers to OrganizationSubscriptionDashboard.
 * Fetches organization subscription data and connects to services.
 */

import { useCallback, useEffect, useMemo, useState } from 'react';
import toast from 'react-hot-toast';
import { useNavigate } from 'react-router-dom';
import OrganizationSubscriptionDashboard from '../../components/Subscription/Organization/OrganizationSubscriptionDashboard';
import { useOrganizationSubscription } from '../../hooks/Subscription/useOrganizationSubscription';
import useAuth from '../../hooks/useAuth';
import { supabase } from '../../lib/supabaseClient';

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

function OrganizationSubscriptionPage() {
  const navigate = useNavigate();
  const { user, isAuthenticated } = useAuth();
  
  // Determine organization type and ID from user context
  const organizationType = useMemo(() => {
    const role = user?.role || '';
    if (role.includes('school')) return 'school' as const;
    if (role.includes('college')) return 'college' as const;
    if (role.includes('university')) return 'university' as const;
    return 'school' as const;
  }, [user?.role]);
  
  // Get base path for navigation
  const basePath = useMemo(() => {
    if (organizationType === 'school') return '/school-admin';
    if (organizationType === 'college') return '/college-admin';
    if (organizationType === 'university') return '/university-admin';
    return '/college-admin';
  }, [organizationType]);
  
  // Get organization ID - check user object first, then localStorage, then fetch from database
  const [organizationId, setOrganizationId] = useState<string>('');
  
  useEffect(() => {
    const fetchOrganizationId = async () => {
      console.log('[OrganizationSubscriptionPage] Fetching organization ID, user:', user);
      
      // First check user object for organization IDs
      if (user?.school_id) { console.log('[OrganizationSubscriptionPage] Found school_id in user:', user.school_id); setOrganizationId(user.school_id); return; }
      if (user?.college_id) { console.log('[OrganizationSubscriptionPage] Found college_id in user:', user.college_id); setOrganizationId(user.college_id); return; }
      if (user?.university_id) { console.log('[OrganizationSubscriptionPage] Found university_id in user:', user.university_id); setOrganizationId(user.university_id); return; }
      if (user?.schoolId) { console.log('[OrganizationSubscriptionPage] Found schoolId in user:', user.schoolId); setOrganizationId(user.schoolId); return; }
      if (user?.collegeId) { console.log('[OrganizationSubscriptionPage] Found collegeId in user:', user.collegeId); setOrganizationId(user.collegeId); return; }
      if (user?.universityId) { console.log('[OrganizationSubscriptionPage] Found universityId in user:', user.universityId); setOrganizationId(user.universityId); return; }
      
      // Fallback to localStorage for school admins
      const storedUser = localStorage.getItem('user');
      console.log('[OrganizationSubscriptionPage] Checking localStorage user:', storedUser);
      if (storedUser) {
        try {
          const userData = JSON.parse(storedUser);
          if (userData.schoolId) { console.log('[OrganizationSubscriptionPage] Found schoolId in localStorage:', userData.schoolId); setOrganizationId(userData.schoolId); return; }
          if (userData.collegeId) { console.log('[OrganizationSubscriptionPage] Found collegeId in localStorage:', userData.collegeId); setOrganizationId(userData.collegeId); return; }
          if (userData.universityId) { console.log('[OrganizationSubscriptionPage] Found universityId in localStorage:', userData.universityId); setOrganizationId(userData.universityId); return; }
        } catch (e) {
          // Ignore parse errors
        }
      }
      
      // If still not found, try to fetch from database based on user email/id
      const userId = user?.id;
      const userEmail = user?.email;
      
      if (!userId && !userEmail) {
        console.log('[OrganizationSubscriptionPage] No user ID or email, cannot fetch organization');
        return;
      }
      
      console.log('[OrganizationSubscriptionPage] Fetching organization from database for user:', userId, userEmail);
      
      try {
        // Try school_educators table first for school admins
        if (organizationType === 'school' && userId) {
          const { data: educatorData, error: educatorError } = await supabase
            .from('school_educators')
            .select('school_id')
            .eq('user_id', userId)
            .maybeSingle();
          
          console.log('[OrganizationSubscriptionPage] school_educators query result:', educatorData, educatorError);
          
          if (educatorData?.school_id) {
            console.log('[OrganizationSubscriptionPage] Found school_id from school_educators:', educatorData.school_id);
            setOrganizationId(educatorData.school_id);
            return;
          }
        }
        
        // Try college_lecturers table for college admins
        if (organizationType === 'college' && userId) {
          const { data: lecturerData, error: lecturerError } = await supabase
            .from('college_lecturers')
            .select('collegeId')
            .eq('user_id', userId)
            .maybeSingle();
          
          console.log('[OrganizationSubscriptionPage] college_lecturers query result:', lecturerData, lecturerError);
          
          if (lecturerData?.collegeId) {
            console.log('[OrganizationSubscriptionPage] Found collegeId from college_lecturers:', lecturerData.collegeId);
            setOrganizationId(lecturerData.collegeId);
            return;
          }
        }
        
        // Try organizations table (for admins who own the organization)
        // Query by admin_id first
        if (userId) {
          const { data: orgByAdminId, error: adminIdError } = await supabase
            .from('organizations')
            .select('id')
            .eq('organization_type', organizationType)
            .eq('admin_id', userId)
            .maybeSingle();
          
          console.log('[OrganizationSubscriptionPage] organizations by admin_id query result:', orgByAdminId, adminIdError);
          
          if (orgByAdminId?.id) {
            console.log('[OrganizationSubscriptionPage] Found organization by admin_id:', orgByAdminId.id);
            setOrganizationId(orgByAdminId.id);
            return;
          }
        }
        
        // Query by email
        if (userEmail) {
          const { data: orgByEmail, error: emailError } = await supabase
            .from('organizations')
            .select('id')
            .eq('organization_type', organizationType)
            .eq('email', userEmail)
            .maybeSingle();
          
          console.log('[OrganizationSubscriptionPage] organizations by email query result:', orgByEmail, emailError);
          
          if (orgByEmail?.id) {
            console.log('[OrganizationSubscriptionPage] Found organization by email:', orgByEmail.id);
            setOrganizationId(orgByEmail.id);
            return;
          }
        }
        
        console.log('[OrganizationSubscriptionPage] Could not find organization ID');
      } catch (err) {
        console.error('[OrganizationSubscriptionPage] Error fetching organization ID:', err);
      }
    };
    
    fetchOrganizationId();
  }, [user, organizationType]);
  
  const organizationName = user?.school_name || user?.college_name || user?.university_name || 'Your Organization';
  
  // State for organization details
  const [organizationDetails, setOrganizationDetails] = useState<OrganizationDetails | null>(null);
  
  // Fetch organization details from database
  useEffect(() => {
    const fetchOrganizationDetails = async () => {
      if (!organizationId) {
        console.log('[OrganizationSubscriptionPage] No organizationId yet, skipping fetch');
        return;
      }
      
      console.log('[OrganizationSubscriptionPage] Fetching organization details for ID:', organizationId);
      
      try {
        const { data, error } = await supabase
          .from('organizations')
          .select('*')
          .eq('id', organizationId)
          .maybeSingle();
        
        console.log('[OrganizationSubscriptionPage] Organization data:', data, 'Error:', error);
        if (error) {
          console.error('Error fetching organization details:', error);
          return;
        }
        
        if (data) {
          setOrganizationDetails({
            id: data.id,
            name: data.name,
            email: data.email,
            phone: data.phone,
            address: data.address,
            city: data.city,
            state: data.state,
            country: data.country,
            pincode: data.pincode,
            website: data.website,
            logoUrl: data.logo_url,
            organizationType: data.organization_type,
            establishedYear: data.established_year,
            code: data.code,
            verificationStatus: data.verification_status,
            accountStatus: data.account_status,
          });
        }
      } catch (err) {
        console.error('Error fetching organization details:', err);
      }
    };
    
    fetchOrganizationDetails();
  }, [organizationId]);
  
  // Fetch subscription data
  const {
    subscriptions,
    licensePools,
    isLoading,
    error,
    refresh,
  } = useOrganizationSubscription({
    organizationId,
    organizationType,
    autoFetch: true,
  });
  
  // Transform data for dashboard component
  const dashboardSubscriptions = useMemo(() => {
    return subscriptions.map(sub => ({
      id: sub.id,
      planName: sub.subscriptionPlanId || 'Standard Plan',
      totalSeats: sub.totalSeats || 0,
      assignedSeats: sub.assignedSeats || 0,
      status: sub.status as 'active' | 'paused' | 'cancelled' | 'expired' | 'grace_period',
      startDate: sub.startDate || new Date().toISOString(),
      endDate: sub.endDate || new Date().toISOString(),
      autoRenew: sub.autoRenew ?? true,
      targetMemberType: (sub.targetMemberType || 'both') as 'educator' | 'student' | 'both',
    }));
  }, [subscriptions]);
  
  const dashboardPools = useMemo(() => {
    return licensePools.map(pool => ({
      id: pool.id,
      poolName: pool.poolName || 'Default Pool',
      memberType: pool.memberType as 'educator' | 'student',
      allocatedSeats: pool.allocatedSeats || 0,
      assignedSeats: pool.assignedSeats || 0,
      availableSeats: pool.availableSeats || 0,
      autoAssignNewMembers: pool.autoAssignNewMembers ?? false,
      isActive: pool.isActive ?? true,
      createdAt: pool.createdAt || new Date().toISOString(),
    }));
  }, [licensePools]);
  
  // Mock members data - in production, fetch from member service
  const members = useMemo(() => [], []);
  
  // Handlers
  const handleAddSeats = useCallback((subscriptionId: string) => {
    navigate(`${basePath}/subscription/bulk-purchase?subscriptionId=${subscriptionId}&mode=add-seats`);
  }, [navigate, basePath]);
  
  const handleBrowsePlans = useCallback(() => {
    navigate(`${basePath}/subscription/bulk-purchase`);
  }, [navigate, basePath]);
  
  const handleManageSubscription = useCallback((_subscriptionId: string) => {
    toast.success('Opening subscription management...');
    // Navigate to subscription details or open modal
  }, []);
  
  const handleRenewSubscription = useCallback((_subscriptionId: string) => {
    toast.success('Initiating renewal process...');
    // Navigate to renewal flow
  }, []);
  
  const handleViewSubscriptionDetails = useCallback((_subscriptionId: string) => {
    toast.success('Loading subscription details...');
  }, []);
  
  const handleCreatePool = useCallback(() => {
    toast.success('Opening pool creation wizard...');
  }, []);
  
  const handleEditPool = useCallback((_poolId: string) => {
    toast.success('Opening pool editor...');
  }, []);
  
  const handleDeletePool = useCallback((_poolId: string) => {
    toast.success('Pool deletion requested...');
  }, []);
  
  const handleConfigureAutoAssign = useCallback((_poolId: string) => {
    toast.success('Opening auto-assign configuration...');
  }, []);
  
  const handleViewPoolAssignments = useCallback((_poolId: string) => {
    toast.success('Loading pool assignments...');
  }, []);
  
  const handleAssignLicenses = useCallback((memberIds: string[]) => {
    toast.success(`Assigning licenses to ${memberIds.length} members...`);
  }, []);
  
  const handleUnassignLicenses = useCallback((memberIds: string[]) => {
    toast.success(`Unassigning licenses from ${memberIds.length} members...`);
  }, []);
  
  const handleTransferLicense = useCallback((_fromMemberId: string, _toMemberId: string) => {
    toast.success('Transferring license...');
  }, []);
  
  const handleViewMemberHistory = useCallback((_memberId: string) => {
    toast.success('Loading member history...');
  }, []);
  
  // Check if user is authenticated and is an admin
  if (!isAuthenticated || !user) {
    return (
      <div className="p-6">
        <div className="bg-amber-50 border border-amber-200 rounded-xl p-6 text-center">
          <h3 className="text-lg font-semibold text-amber-800 mb-2">Authentication Required</h3>
          <p className="text-amber-600 mb-4">Please log in to access organization subscription management.</p>
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
  
  // Show warning if organization ID not found
  if (!organizationId && !isLoading) {
    return (
      <div className="p-6">
        <div className="bg-amber-50 border border-amber-200 rounded-xl p-6 text-center">
          <h3 className="text-lg font-semibold text-amber-800 mb-2">Organization Not Found</h3>
          <p className="text-amber-600 mb-4">
            Could not find your organization. Please ensure you are logged in as an organization admin.
          </p>
          <p className="text-sm text-amber-500 mb-4">
            Debug info: User role: {user?.role}, User ID: {user?.id}
          </p>
          <button
            onClick={() => navigate(`${basePath}/settings`)}
            className="px-4 py-2 bg-amber-600 text-white rounded-lg hover:bg-amber-700"
          >
            Go to Settings
          </button>
        </div>
      </div>
    );
  }
  
  if (error) {
    return (
      <div className="p-6">
        <div className="bg-red-50 border border-red-200 rounded-xl p-6 text-center">
          <h3 className="text-lg font-semibold text-red-800 mb-2">Error Loading Subscriptions</h3>
          <p className="text-red-600 mb-4">{error}</p>
          <button
            onClick={refresh}
            className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }
  
  return (
    <div className="p-6">
      <OrganizationSubscriptionDashboard
        organizationName={organizationName}
        organizationType={organizationType}
        organizationDetails={organizationDetails || undefined}
        subscriptions={dashboardSubscriptions}
        licensePools={dashboardPools}
        members={members}
        isLoading={isLoading}
        onAddSeats={handleAddSeats}
        onBrowsePlans={handleBrowsePlans}
        onManageSubscription={handleManageSubscription}
        onRenewSubscription={handleRenewSubscription}
        onViewSubscriptionDetails={handleViewSubscriptionDetails}
        onCreatePool={handleCreatePool}
        onEditPool={handleEditPool}
        onDeletePool={handleDeletePool}
        onConfigureAutoAssign={handleConfigureAutoAssign}
        onViewPoolAssignments={handleViewPoolAssignments}
        onAssignLicenses={handleAssignLicenses}
        onUnassignLicenses={handleUnassignLicenses}
        onTransferLicense={handleTransferLicense}
        onViewMemberHistory={handleViewMemberHistory}
      />
    </div>
  );
}

export default OrganizationSubscriptionPage;
