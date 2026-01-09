import {
    AcademicCapIcon,
    BuildingOfficeIcon,
    CalendarIcon,
    CheckCircleIcon,
    EnvelopeIcon,
    MapPinIcon,
    PencilIcon,
    PhoneIcon,
    UserCircleIcon,
    XCircleIcon,
} from '@heroicons/react/24/outline';
import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { supabase } from '../../lib/supabaseClient';

interface EducatorProfile {
  id: string;
  user_id: string;
  school_id: string;
  employee_id?: string;
  specialization?: string;
  qualification?: string;
  experience_years?: number;
  date_of_joining?: string;
  account_status?: string;
  metadata?: any;
  // Personal Information
  first_name?: string;
  last_name?: string;
  email?: string;
  phone_number?: string;
  dob?: string;
  gender?: string;
  address?: string;
  city?: string;
  state?: string;
  country?: string;
  pincode?: string;
  photo_url?: string;
  // Professional Information
  designation?: string;
  department?: string;
  subjects_handled?: string[];
  // Documents
  resume_url?: string;
  id_proof_url?: string;
  // Verification
  verification_status?: string;
  verified_by?: string;
  verified_at?: string;
  // User data from users table
  full_name?: string;
  phone?: string;
  // School data
  school_name?: string;
  // Calculated stats
  total_students?: number;
  verified_activities?: number;
  pending_activities?: number;
}

const Profile = () => {
  const navigate = useNavigate();
  const { user: authUser, isAuthenticated } = useAuth();
  const [profile, setProfile] = useState<EducatorProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(false);
  const [formData, setFormData] = useState<Partial<EducatorProfile>>({});
  const [saving, setSaving] = useState(false);
  const [loadingProfile, setLoadingProfile] = useState(false);

  useEffect(() => {
    let isMounted = true;
    
    // Check authentication from multiple sources
    const checkAuth = async () => {
      if (!isMounted) return;
      
      // Method 1: Try AuthContext user
      if (authUser && authUser.email) {
        console.log('✅ Using AuthContext user:', authUser.email);
        if (isMounted) await loadProfileByEmail(authUser.email);
        return;
      }
      
      // Method 2: Try localStorage directly
      const storedUser = localStorage.getItem('user');
      const storedEmail = localStorage.getItem('userEmail');
      
      if (storedUser) {
        try {
          const userData = JSON.parse(storedUser);
          console.log('✅ Using localStorage user:', userData);
          if (isMounted) await loadProfileByEmail(userData.email || storedEmail);
          return;
        } catch (e) {
          console.error('Error parsing stored user:', e);
        }
      }
      
      if (storedEmail) {
        console.log('✅ Using stored email:', storedEmail);
        if (isMounted) await loadProfileByEmail(storedEmail);
        return;
      }
      
      // Method 3: Fallback to Supabase auth
      const { data: { user } } = await supabase.auth.getUser();
      
      if (user && user.email) {
        console.log('✅ Using Supabase user:', user.email);
        if (isMounted) await loadProfileByEmail(user.email);
        return;
      }
      
      // No authentication found
      console.log('❌ No authenticated user found, redirecting to login');
      if (isMounted) navigate('/login/educator');
    };
    
    checkAuth();
    
    return () => {
      isMounted = false;
    };
  }, []);

  const loadProfileByEmail = async (email: string) => {
    if (loadingProfile) {
      console.log('⏳ Profile already loading, skipping...');
      return;
    }
    
    try {
      setLoadingProfile(true);
      setLoading(true);
      
      console.log('🔍 Loading profile by email:', email);

      // Try multiple approaches to fetch educator data
      let educatorData = null;
      let educatorError = null;

      // Approach 1: Direct query by email
      console.log('📧 Trying direct email query...');
      const { data: directData, error: directError } = await supabase
        .from('school_educators')
        .select(`
          *,
          school:organizations!school_educators_school_id_fkey (
            name,
            organization_type
          )
        `)
        .eq('email', email)
        .maybeSingle();

      if (directError) {
        console.log('❌ Direct query error:', directError.message);
        
        // Approach 2: Try with RLS bypass (if we have service role)
        console.log('🔓 Trying with different approach...');
        const { data: altData, error: altError } = await supabase
          .from('school_educators')
          .select('*')
          .ilike('email', email)
          .limit(1)
          .maybeSingle();
          
        if (altError) {
          console.log('❌ Alternative query error:', altError.message);
          educatorError = altError;
        } else {
          educatorData = altData;
          console.log('✅ Found data with alternative approach');
        }
      } else {
        educatorData = directData;
        console.log('✅ Found data with direct approach');
      }

      console.log('=== EDUCATOR PROFILE DEBUG (BY EMAIL) ===');
      console.log('Email:', email);
      console.log('Educator data:', educatorData);
      console.log('Educator error:', educatorError);
      console.log('Data fields:', educatorData ? Object.keys(educatorData) : 'No data');
      
      if (educatorData) {
        console.log('📋 Educator details:', {
          id: educatorData.id,
          first_name: educatorData.first_name,
          last_name: educatorData.last_name,
          email: educatorData.email,
          specialization: educatorData.specialization,
          qualification: educatorData.qualification,
          school_id: educatorData.school_id,
          user_id: educatorData.user_id,
        });
      }
      console.log('=== END DEBUG ===');

      if (educatorData) {
        await processEducatorData(educatorData, email);
      } else {
        console.log('⚠️ No educator data found, creating fallback profile');
        await createFallbackProfile(email);
      }
    } catch (error) {
      console.error('💥 Failed to load profile by email:', error);
      await createFallbackProfile(email);
    } finally {
      setLoading(false);
      setLoadingProfile(false);
    }
  };

  const loadProfile = async (user?: any) => {
    try {
      setLoading(true);
      
      // Get current user from Supabase Auth if not provided
      if (!user) {
        const { data: { user: currentUser } } = await supabase.auth.getUser();
        user = currentUser;
      }
      
      if (!user) {
        console.error('No authenticated user found');
        return;
      }

      console.log('Current user:', user.id);

      // Fetch educator profile from school_educators table
      const { data: educatorData, error: educatorError } = await supabase
        .from('school_educators')
        .select('*')
        .eq('user_id', user.id)
        .maybeSingle();

      console.log('=== EDUCATOR PROFILE DEBUG ===');
      console.log('User ID:', user.id);
      console.log('Educator data:', educatorData);
      console.log('Educator error:', educatorError);
      
      if (educatorError) {
        console.error('Error fetching educator data:', educatorError);
      }

      await processEducatorData(educatorData, user.email, user);
    } catch (error) {
      console.error('Failed to load profile:', error);
      await createFallbackProfile(user?.email, user);
    } finally {
      setLoading(false);
    }
  };

  const processEducatorData = async (educatorData: any, email: string, user?: any) => {
    // Extract school name from joined data or fetch separately
    let schoolName = '';
    
    if (educatorData?.schools?.name) {
      // School data was joined in the query
      schoolName = educatorData.schools.name;
      console.log('✅ School name from join:', schoolName);
    } else if (educatorData?.school_id) {
      // Fetch school name separately from organizations table
      console.log('🏫 Fetching school name for ID:', educatorData.school_id);
      const { data: org, error: orgError } = await supabase
        .from('organizations')
        .select('name')
        .eq('id', educatorData.school_id)
        .maybeSingle();
      
      if (orgError) {
        console.log('❌ Organization fetch error:', orgError.message);
      } else {
        schoolName = org?.name || '';
        console.log('✅ School name fetched from organizations:', schoolName);
      }
    }

    // Create profile from school_educators data
    const profileData: EducatorProfile = {
      // Primary fields from school_educators
      id: educatorData?.id || '',
      user_id: educatorData?.user_id || user?.id || '',
      school_id: educatorData?.school_id || '',
      employee_id: educatorData?.employee_id || '',
      account_status: educatorData?.account_status || 'active',
      created_at: educatorData?.created_at,
      updated_at: educatorData?.updated_at,
      metadata: educatorData?.metadata || {},
      
      // Professional Information
      specialization: educatorData?.specialization || '',
      qualification: educatorData?.qualification || '',
      experience_years: educatorData?.experience_years || 0,
      date_of_joining: educatorData?.date_of_joining || educatorData?.created_at || new Date().toISOString(),
      designation: educatorData?.designation || '',
      department: educatorData?.department || '',
      subjects_handled: educatorData?.subjects_handled || [],
      
      // Personal Information
      first_name: educatorData?.first_name && educatorData.first_name !== 'null' ? educatorData.first_name : '',
      last_name: educatorData?.last_name && educatorData.last_name !== 'null' ? educatorData.last_name : '',
      email: educatorData?.email || email || '',
      phone_number: educatorData?.phone_number || '',
      dob: educatorData?.dob || '',
      gender: educatorData?.gender || '',
      address: educatorData?.address || '',
      city: educatorData?.city || '',
      state: educatorData?.state || '',
      country: educatorData?.country || '',
      pincode: educatorData?.pincode || '',
      photo_url: educatorData?.photo_url || '',
      
      // Documents
      resume_url: educatorData?.resume_url || '',
      id_proof_url: educatorData?.id_proof_url || '',
      
      // Verification
      verification_status: educatorData?.verification_status || 'Pending',
      verified_by: educatorData?.verified_by || '',
      verified_at: educatorData?.verified_at || '',
      
      // Computed fields
      full_name: educatorData?.first_name && educatorData?.last_name && 
                 educatorData.first_name !== 'null' && educatorData.last_name !== 'null'
        ? `${educatorData.first_name} ${educatorData.last_name}`
        : educatorData?.first_name && educatorData.first_name !== 'null' 
          ? educatorData.first_name 
          : user?.user_metadata?.full_name || 'Educator',
      phone: educatorData?.phone_number || '',
      school_name: schoolName,
      
      // Stats (placeholder for now)
      total_students: 0,
      verified_activities: 0,
      pending_activities: 0,
    };

    console.log('✅ Final profile created:', {
      id: profileData.id,
      full_name: profileData.full_name,
      email: profileData.email,
      specialization: profileData.specialization,
      qualification: profileData.qualification,
      school_name: profileData.school_name,
    });
    
    setProfile(profileData);
  };

  const createFallbackProfile = async (email?: string, user?: any) => {
    // Create basic profile from available data
    setProfile({
      id: '',
      user_id: user?.id || '',
      school_id: '',
      email: email || '',
      full_name: user?.user_metadata?.full_name || 'Educator',
      phone: '',
      date_of_joining: new Date().toISOString(),
      account_status: 'active',
      metadata: {},
      total_students: 0,
      verified_activities: 0,
      pending_activities: 0,
    });
  };

  const handleEdit = () => {
    setEditing(true);
    setFormData(profile || {});
  };

  const handleCancel = () => {
    setEditing(false);
    setFormData({});
  };

  const handleSave = async () => {
    if (!profile) return;

    try {
      setSaving(true);
      
      const updateData = {
        first_name: formData.first_name || profile.first_name,
        last_name: formData.last_name || profile.last_name,
        phone_number: formData.phone_number || profile.phone_number,
        address: formData.address || profile.address,
        city: formData.city || profile.city,
        specialization: formData.specialization || profile.specialization,
        qualification: formData.qualification || profile.qualification,
        experience_years: parseInt(formData.experience_years as string) || profile.experience_years || 0,
        designation: formData.designation || profile.designation,
        department: formData.department || profile.department,
        updated_at: new Date().toISOString(),
      };

      console.log('💾 Saving profile data:', updateData);

      let success = false;

      // Try multiple update approaches
      if (profile.id) {
        // Approach 1: Update by ID
        console.log('📝 Updating by ID:', profile.id);
        const { error: idError } = await supabase
          .from('school_educators')
          .update(updateData)
          .eq('id', profile.id);

        if (idError) {
          console.log('❌ Update by ID failed:', idError.message);
          
          // Approach 2: Update by email
          console.log('📝 Trying update by email:', profile.email);
          const { error: emailError } = await supabase
            .from('school_educators')
            .update(updateData)
            .eq('email', profile.email);

          if (emailError) {
            console.error('❌ Update by email also failed:', emailError.message);
            throw new Error(`Failed to update profile: ${emailError.message}`);
          } else {
            console.log('✅ Profile updated by email successfully');
            success = true;
          }
        } else {
          console.log('✅ Profile updated by ID successfully');
          success = true;
        }
      } else if (profile.email) {
        // No ID, try update by email
        console.log('📝 Updating by email (no ID):', profile.email);
        const { error: emailError } = await supabase
          .from('school_educators')
          .update(updateData)
          .eq('email', profile.email);

        if (emailError) {
          console.error('❌ Update by email failed:', emailError.message);
          throw new Error(`Failed to update profile: ${emailError.message}`);
        } else {
          console.log('✅ Profile updated by email successfully');
          success = true;
        }
      }

      if (success) {
        // Update local profile state
        const updatedProfile = { ...profile, ...formData };
        setProfile(updatedProfile);
        setEditing(false);
        setFormData({});
        
        // Notify Header component to refresh
        console.log('📢 Emitting profile update event for header refresh')
        window.dispatchEvent(new CustomEvent('educatorProfileUpdated'))
        
        // Show success message
        alert('Profile saved successfully!');
      }
    } catch (error) {
      console.error('💥 Failed to save profile:', error);
      alert(`Failed to save profile: ${error.message}`);
    } finally {
      setSaving(false);
    }
  };

  const handleInputChange = (field: keyof EducatorProfile, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const formatDate = (dateString?: string) => {
    if (!dateString) return 'Not specified';
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  if (loading) {
    return (
      <div className="space-y-8 p-4 sm:p-6 lg:p-8">
        <div className="animate-pulse">
          <div className="h-8 bg-gray-200 rounded w-1/4 mb-4"></div>
          <div className="bg-white rounded-lg border border-gray-200 p-6">
            <div className="flex items-center space-x-6 mb-6">
              <div className="h-24 w-24 bg-gray-200 rounded-full"></div>
              <div className="space-y-2">
                <div className="h-6 bg-gray-200 rounded w-48"></div>
                <div className="h-4 bg-gray-200 rounded w-32"></div>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (!profile) {
    return (
      <div className="space-y-8 p-4 sm:p-6 lg:p-8">
        {/* Page Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">My Profile</h1>
            <p className="mt-2 text-gray-600">Manage your account information and preferences.</p>
          </div>
          <button
            onClick={() => window.location.reload()}
            className="inline-flex items-center px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
          >
            <PencilIcon className="h-4 w-4 mr-2" />
            Retry
          </button>
        </div>

        {/* Profile Information Skeleton */}
        <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
          <div className="px-6 py-8">
            <div className="flex items-center space-x-6 mb-8">
              <div className="relative">
                <div className="h-24 w-24 bg-gray-200 rounded-full animate-pulse"></div>
              </div>
              <div className="flex-1 space-y-3">
                <div className="h-8 bg-gray-200 rounded w-48 animate-pulse"></div>
                <div className="h-6 bg-gray-200 rounded w-32 animate-pulse"></div>
                <div className="h-4 bg-gray-200 rounded w-64 animate-pulse"></div>
              </div>
            </div>

            {/* Contact Information Skeleton */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Contact Information</h3>
                <div className="space-y-4">
                  <div className="flex items-center space-x-3">
                    <EnvelopeIcon className="h-5 w-5 text-gray-400" />
                    <div className="h-4 bg-gray-200 rounded w-48 animate-pulse"></div>
                  </div>
                  <div className="flex items-center space-x-3">
                    <PhoneIcon className="h-5 w-5 text-gray-400" />
                    <div className="h-4 bg-gray-200 rounded w-40 animate-pulse"></div>
                  </div>
                  <div className="flex items-center space-x-3">
                    <MapPinIcon className="h-5 w-5 text-gray-400" />
                    <div className="h-4 bg-gray-200 rounded w-44 animate-pulse"></div>
                  </div>
                </div>
              </div>

              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Professional Information</h3>
                <div className="space-y-4">
                  <div className="flex items-center space-x-3">
                    <AcademicCapIcon className="h-5 w-5 text-gray-400" />
                    <div className="h-4 bg-gray-200 rounded w-56 animate-pulse"></div>
                  </div>
                  <div className="flex items-center space-x-3">
                    <CalendarIcon className="h-5 w-5 text-gray-400" />
                    <div className="h-4 bg-gray-200 rounded w-48 animate-pulse"></div>
                  </div>
                  <div className="flex items-center space-x-3">
                    <BuildingOfficeIcon className="h-5 w-5 text-gray-400" />
                    <div className="h-4 bg-gray-200 rounded w-40 animate-pulse"></div>
                  </div>
                  <div className="flex items-center space-x-3">
                    <CalendarIcon className="h-5 w-5 text-gray-400" />
                    <div className="h-4 bg-gray-200 rounded w-44 animate-pulse"></div>
                  </div>
                </div>
              </div>
            </div>

            {/* Bio Section Skeleton */}
            <div className="mb-8">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">About</h3>
              <div className="space-y-2">
                <div className="h-4 bg-gray-200 rounded w-full animate-pulse"></div>
                <div className="h-4 bg-gray-200 rounded w-full animate-pulse"></div>
                <div className="h-4 bg-gray-200 rounded w-3/4 animate-pulse"></div>
              </div>
            </div>
          </div>
        </div>

        {/* Statistics Cards Skeleton */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
          <div className="bg-white rounded-lg border border-gray-200 p-6 animate-pulse">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <div className="p-3 bg-blue-100 rounded-lg">
                  <UserCircleIcon className="h-6 w-6 text-blue-600" />
                </div>
              </div>
              <div className="ml-4 flex-1">
                <p className="text-sm font-medium text-gray-500">Total Students</p>
                <div className="h-6 bg-gray-200 rounded w-12 mt-2"></div>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg border border-gray-200 p-6 animate-pulse">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <div className="p-3 bg-green-100 rounded-lg">
                  <CheckCircleIcon className="h-6 w-6 text-green-600" />
                </div>
              </div>
              <div className="ml-4 flex-1">
                <p className="text-sm font-medium text-gray-500">Verified Activities</p>
                <div className="h-6 bg-gray-200 rounded w-12 mt-2"></div>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg border border-gray-200 p-6 animate-pulse">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <div className="p-3 bg-yellow-100 rounded-lg">
                  <CalendarIcon className="h-6 w-6 text-yellow-600" />
                </div>
              </div>
              <div className="ml-4 flex-1">
                <p className="text-sm font-medium text-gray-500">Pending Reviews</p>
                <div className="h-6 bg-gray-200 rounded w-12 mt-2"></div>
              </div>
            </div>
          </div>
        </div>

        {/* Error Message */}
        <div className="bg-amber-50 border border-amber-200 rounded-lg p-4">
          <div className="flex">
            <div className="flex-shrink-0">
              <svg className="h-5 w-5 text-amber-400" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
              </svg>
            </div>
            <div className="ml-3">
              <h3 className="text-sm font-medium text-amber-800">Unable to load profile</h3>
              <div className="mt-2 text-sm text-amber-700">
                <p>We're having trouble loading your profile data. This could be due to:</p>
                <ul className="list-disc list-inside mt-2 space-y-1">
                  <li>Network connectivity issues</li>
                  <li>Your profile hasn't been set up yet</li>
                  <li>Database connection problems</li>
                </ul>
                <p className="mt-3">Please try refreshing the page or contact support if the problem persists.</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8 p-4 sm:p-6 lg:p-8" data-testid="educator-profile">
      {/* Page Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">My Profile</h1>
          <p className="mt-2 text-gray-600">Manage your account information and preferences.</p>
        </div>
        {!editing && (
          <button
            onClick={handleEdit}
            className="inline-flex items-center px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
          >
            <PencilIcon className="h-4 w-4 mr-2" />
            Edit Profile
          </button>
        )}
      </div>

      {/* Profile Information */}
      <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
        <div className="px-6 py-8">
          <div className="flex items-center space-x-6 mb-8">
            <div className="relative">
              <UserCircleIcon className="h-24 w-24 text-gray-400" />
            </div>
            <div className="flex-1">
              {editing ? (
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Full Name
                    </label>
                    <input
                      type="text"
                      value={formData.full_name || ''}
                      onChange={(e) => handleInputChange('full_name', e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Specialization
                    </label>
                    <input
                      type="text"
                      value={formData.specialization || ''}
                      onChange={(e) => handleInputChange('specialization', e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
                      placeholder="e.g., Mathematics, Computer Science, Physics"
                    />
                  </div>
                </div>
              ) : (
                <div>
                  <h2 className="text-2xl font-bold text-gray-900">{profile.full_name}</h2>
                  <p className="text-lg text-gray-600">{profile.specialization || 'Educator'}</p>
                  <p className="text-sm text-gray-500 mt-1">
                    {profile.school_name && `${profile.school_name} • `}
                    Member since {formatDate(profile.date_of_joining)}
                  </p>
                </div>
              )}
            </div>
          </div>

          {/* Contact Information */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
            <div>
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Contact Information</h3>
              <div className="space-y-4">
                <div className="flex items-center space-x-3">
                  <EnvelopeIcon className="h-5 w-5 text-gray-400" />
                  <div className="flex-1">
                    <p className="text-xs text-gray-500">Email</p>
                    <span className="text-gray-900 font-medium">{profile.email}</span>
                  </div>
                </div>
                
                <div className="flex items-center space-x-3">
                  <PhoneIcon className="h-5 w-5 text-gray-400" />
                  <div className="flex-1">
                    <p className="text-xs text-gray-500">Phone</p>
                    {editing ? (
                      <input
                        type="tel"
                        value={formData.phone_number || ''}
                        onChange={(e) => handleInputChange('phone_number', e.target.value)}
                        className="w-full px-2 py-1 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
                        placeholder="Enter phone number"
                      />
                    ) : (
                      <span className="text-gray-900 font-medium">{profile.phone_number || 'Not provided'}</span>
                    )}
                  </div>
                </div>

                <div className="flex items-center space-x-3">
                  <MapPinIcon className="h-5 w-5 text-gray-400" />
                  <div className="flex-1">
                    <p className="text-xs text-gray-500">Address</p>
                    {editing ? (
                      <input
                        type="text"
                        value={formData.address || ''}
                        onChange={(e) => handleInputChange('address', e.target.value)}
                        className="w-full px-2 py-1 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
                        placeholder="Enter address"
                      />
                    ) : (
                      <span className="text-gray-900 font-medium">{profile.address || 'Not provided'}</span>
                    )}
                  </div>
                </div>

                <div className="flex items-center space-x-3">
                  <MapPinIcon className="h-5 w-5 text-gray-400" />
                  <div className="flex-1">
                    <p className="text-xs text-gray-500">City</p>
                    {editing ? (
                      <input
                        type="text"
                        value={formData.city || ''}
                        onChange={(e) => handleInputChange('city', e.target.value)}
                        className="w-full px-2 py-1 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
                        placeholder="Enter city"
                      />
                    ) : (
                      <span className="text-gray-900 font-medium">{profile.city || 'Not provided'}</span>
                    )}
                  </div>
                </div>
              </div>
            </div>

            <div>
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Professional Information</h3>
              <div className="space-y-4">
                <div className="flex items-center space-x-3">
                  <AcademicCapIcon className="h-5 w-5 text-gray-400" />
                  <div className="flex-1">
                    <p className="text-xs text-gray-500">Specialization</p>
                    {editing ? (
                      <input
                        type="text"
                        value={formData.specialization || ''}
                        onChange={(e) => handleInputChange('specialization', e.target.value)}
                        className="w-full px-2 py-1 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
                        placeholder="e.g., Computer Science"
                      />
                    ) : (
                      <span className="text-gray-900 font-medium">{profile.specialization || 'Not specified'}</span>
                    )}
                  </div>
                </div>

                <div className="flex items-center space-x-3">
                  <AcademicCapIcon className="h-5 w-5 text-gray-400" />
                  <div className="flex-1">
                    <p className="text-xs text-gray-500">Qualification</p>
                    {editing ? (
                      <input
                        type="text"
                        value={formData.qualification || ''}
                        onChange={(e) => handleInputChange('qualification', e.target.value)}
                        className="w-full px-2 py-1 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
                        placeholder="e.g., M.Tech"
                      />
                    ) : (
                      <span className="text-gray-900 font-medium">{profile.qualification || 'Not specified'}</span>
                    )}
                  </div>
                </div>

                <div className="flex items-center space-x-3">
                  <CalendarIcon className="h-5 w-5 text-gray-400" />
                  <div className="flex-1">
                    <p className="text-xs text-gray-500">Experience</p>
                    {editing ? (
                      <input
                        type="number"
                        value={formData.experience_years || ''}
                        onChange={(e) => handleInputChange('experience_years', e.target.value)}
                        className="w-full px-2 py-1 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
                        placeholder="Years"
                        min="0"
                      />
                    ) : (
                      <span className="text-gray-900 font-medium">
                        {profile.experience_years ? `${profile.experience_years} years` : 'Not specified'}
                      </span>
                    )}
                  </div>
                </div>

                <div className="flex items-center space-x-3">
                  <BuildingOfficeIcon className="h-5 w-5 text-gray-400" />
                  <div className="flex-1">
                    <p className="text-xs text-gray-500">Designation</p>
                    {editing ? (
                      <input
                        type="text"
                        value={formData.designation || ''}
                        onChange={(e) => handleInputChange('designation', e.target.value)}
                        className="w-full px-2 py-1 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
                        placeholder="e.g., Senior Educator"
                      />
                    ) : (
                      <span className="text-gray-900 font-medium">{profile.designation || 'Not specified'}</span>
                    )}
                  </div>
                </div>

                <div className="flex items-center space-x-3">
                  <BuildingOfficeIcon className="h-5 w-5 text-gray-400" />
                  <div className="flex-1">
                    <p className="text-xs text-gray-500">Department</p>
                    {editing ? (
                      <input
                        type="text"
                        value={formData.department || ''}
                        onChange={(e) => handleInputChange('department', e.target.value)}
                        className="w-full px-2 py-1 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
                        placeholder="e.g., Computer Science"
                      />
                    ) : (
                      <span className="text-gray-900 font-medium">{profile.department || 'Not specified'}</span>
                    )}
                  </div>
                </div>

                <div className="flex items-center space-x-3">
                  <CalendarIcon className="h-5 w-5 text-gray-400" />
                  <div className="flex-1">
                    <p className="text-xs text-gray-500">Date of Joining</p>
                    <span className="text-gray-900 font-medium">{formatDate(profile.date_of_joining)}</span>
                  </div>
                </div>

                <div className="flex items-center space-x-3">
                  <BuildingOfficeIcon className="h-5 w-5 text-gray-400" />
                  <div className="flex-1">
                    <p className="text-xs text-gray-500">School</p>
                    <span className="text-gray-900 font-medium">{profile.school_name || 'Not specified'}</span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Bio Section */}
          <div className="mb-8">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">About</h3>
            {editing ? (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Bio
                </label>
                <textarea
                  value={formData.metadata?.bio || ''}
                  onChange={(e) => handleInputChange('metadata', { ...formData.metadata, bio: e.target.value })}
                  rows={4}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  placeholder="Tell us about yourself, your teaching philosophy, and experience..."
                />
              </div>
            ) : (
              <p className="text-gray-700">
                {profile.metadata?.bio || 'No bio provided yet. Click "Edit Profile" to add information about yourself.'}
              </p>
            )}
          </div>

          {/* Action Buttons */}
          {editing && (
            <div className="flex items-center space-x-4 pt-6 border-t border-gray-200">
              <button
                onClick={handleSave}
                disabled={saving}
                className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50"
              >
                <CheckCircleIcon className="h-4 w-4 mr-2" />
                {saving ? 'Saving...' : 'Save Changes'}
              </button>
              <button
                onClick={handleCancel}
                className="inline-flex items-center px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
              >
                <XCircleIcon className="h-4 w-4 mr-2" />
                Cancel
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Statistics Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
        <div className="bg-white rounded-lg border border-gray-200 p-6">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <div className="p-3 bg-blue-100 rounded-lg">
                <UserCircleIcon className="h-6 w-6 text-blue-600" />
              </div>
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-500">Total Students</p>
              <p className="text-2xl font-semibold text-gray-900">{profile.total_students || 0}</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg border border-gray-200 p-6">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <div className="p-3 bg-green-100 rounded-lg">
                <CheckCircleIcon className="h-6 w-6 text-green-600" />
              </div>
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-500">Verified Activities</p>
              <p className="text-2xl font-semibold text-gray-900">{profile.verified_activities || 0}</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg border border-gray-200 p-6">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <div className="p-3 bg-yellow-100 rounded-lg">
                <CalendarIcon className="h-6 w-6 text-yellow-600" />
              </div>
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-500">Pending Reviews</p>
              <p className="text-2xl font-semibold text-gray-900">{profile.pending_activities || 0}</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Profile;