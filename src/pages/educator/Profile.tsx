import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  UserCircleIcon,
  PencilIcon,
  EnvelopeIcon,
  PhoneIcon,
  MapPinIcon,
  AcademicCapIcon,
  CalendarIcon,
  CheckCircleIcon,
  XCircleIcon,
  BuildingOfficeIcon,
} from '@heroicons/react/24/outline';
import { supabase } from '../../lib/supabaseClient';
import { useAuth } from '../../context/AuthContext';

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

  useEffect(() => {
    if (!isAuthenticated) {
      console.log('User not authenticated, redirecting to login');
      navigate('/login/educator');
      return;
    }
    loadProfile();
  }, [isAuthenticated, navigate]);

  const loadProfile = async () => {
    try {
      setLoading(true);
      
      // Get current user from Supabase Auth
      const { data: { user } } = await supabase.auth.getUser();
      
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
      console.log('Educator data is null?', educatorData === null);
      console.log('Educator data is undefined?', educatorData === undefined);
      if (educatorData) {
        console.log('Educator fields:', {
          id: educatorData.id,
          first_name: educatorData.first_name,
          last_name: educatorData.last_name,
          email: educatorData.email,
          specialization: educatorData.specialization,
          qualification: educatorData.qualification,
          experience_years: educatorData.experience_years,
          school_id: educatorData.school_id,
        });
      }
      console.log('=== END DEBUG ===');

      if (educatorError) {
        console.error('Error fetching educator data:', educatorError);
      }

      // Fetch school name if school_id exists
      let schoolData = null;
      if (educatorData?.school_id) {
        const { data: school, error: schoolError } = await supabase
          .from('schools')
          .select('name')
          .eq('id', educatorData.school_id)
          .maybeSingle();
        
        console.log('School data:', school, 'Error:', schoolError);
        schoolData = school;
      }

      // Create profile from school_educators data
      const profileData: EducatorProfile = {
        // Primary fields from school_educators
        id: educatorData?.id || '',
        user_id: educatorData?.user_id || user.id,
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
        first_name: educatorData?.first_name || '',
        last_name: educatorData?.last_name || '',
        email: educatorData?.email || user.email || '',
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
        full_name: educatorData?.first_name && educatorData?.last_name 
          ? `${educatorData.first_name} ${educatorData.last_name}`
          : educatorData?.first_name || user.user_metadata?.full_name || 'Educator',
        phone: educatorData?.phone_number || '',
        school_name: schoolData?.name || '',
        
        // Stats (placeholder for now)
        total_students: 0,
        verified_activities: 0,
        pending_activities: 0,
      };

      console.log('Final profile:', profileData);
      setProfile(profileData);

    } catch (error) {
      console.error('Failed to load profile:', error);
      // Even if there's an error, show basic user info
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        setProfile({
          id: '',
          user_id: user.id,
          school_id: '',
          email: user.email || '',
          full_name: user.user_metadata?.full_name || 'Educator',
          phone: '',
          date_of_joining: new Date().toISOString(),
          account_status: 'active',
          metadata: {},
          total_students: 0,
          verified_activities: 0,
          pending_activities: 0,
        });
      }
    } finally {
      setLoading(false);
    }
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
      
      // Update or create school_educators record
      if (profile.id) {
        // Update existing record
        const { error: educatorError } = await supabase
          .from('school_educators')
          .update({
            specialization: formData.specialization,
            qualification: formData.qualification,
            experience_years: parseInt(formData.experience_years as string) || 0,
            employee_id: formData.employee_id,
            metadata: {
              ...profile.metadata,
              bio: formData.metadata?.bio,
            }
          })
          .eq('id', profile.id);

        if (educatorError) {
          console.error('Error updating educator profile:', educatorError);
          return;
        }
      } else {
        // Create new record if it doesn't exist and we have required data
        if (formData.specialization || formData.qualification) {
          // You'll need a school_id for this to work - for now we'll skip creation
          console.log('Would create new school_educators record, but need school_id');
        }
      }

      // Update users table for basic info (this should always work)
      const { error: userError } = await supabase
        .from('users')
        .update({
          full_name: formData.full_name,
          phone: formData.phone,
        })
        .eq('id', profile.user_id);

      if (userError) {
        console.error('Error updating user profile:', userError);
        // Don't return here - we can still update the local state
      }

      setProfile({ ...profile, ...formData });
      setEditing(false);
      setFormData({});
    } catch (error) {
      console.error('Failed to save profile:', error);
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
                  <span className="text-gray-900">{profile.email}</span>
                </div>
                
                {editing ? (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Phone Number
                    </label>
                    <input
                      type="tel"
                      value={formData.phone || ''}
                      onChange={(e) => handleInputChange('phone', e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
                      placeholder="Enter phone number"
                    />
                  </div>
                ) : (
                  <div className="flex items-center space-x-3">
                    <PhoneIcon className="h-5 w-5 text-gray-400" />
                    <span className="text-gray-900">{profile.phone || 'Not provided'}</span>
                  </div>
                )}

                {editing ? (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Employee ID
                    </label>
                    <input
                      type="text"
                      value={formData.employee_id || ''}
                      onChange={(e) => handleInputChange('employee_id', e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
                      placeholder="Enter employee ID"
                    />
                  </div>
                ) : (
                  <div className="flex items-center space-x-3">
                    <MapPinIcon className="h-5 w-5 text-gray-400" />
                    <span className="text-gray-900">{profile.employee_id || 'Not provided'}</span>
                  </div>
                )}
              </div>
            </div>

            <div>
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Professional Information</h3>
              <div className="space-y-4">
                {editing ? (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Qualification
                    </label>
                    <input
                      type="text"
                      value={formData.qualification || ''}
                      onChange={(e) => handleInputChange('qualification', e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
                      placeholder="e.g., M.Sc. Computer Science, Ph.D. Mathematics"
                    />
                  </div>
                ) : (
                  <div className="flex items-center space-x-3">
                    <AcademicCapIcon className="h-5 w-5 text-gray-400" />
                    <span className="text-gray-900">{profile.qualification || 'Not specified'}</span>
                  </div>
                )}

                {editing ? (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Experience (Years)
                    </label>
                    <input
                      type="number"
                      value={formData.experience_years || ''}
                      onChange={(e) => handleInputChange('experience_years', e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
                      placeholder="Years of experience"
                      min="0"
                    />
                  </div>
                ) : (
                  <div className="flex items-center space-x-3">
                    <CalendarIcon className="h-5 w-5 text-gray-400" />
                    <span className="text-gray-900">
                      {profile.experience_years ? `${profile.experience_years} years experience` : 'Experience not specified'}
                    </span>
                  </div>
                )}

                <div className="flex items-center space-x-3">
                  <BuildingOfficeIcon className="h-5 w-5 text-gray-400" />
                  <span className="text-gray-900">{profile.school_name || 'School not specified'}</span>
                </div>

                <div className="flex items-center space-x-3">
                  <CalendarIcon className="h-5 w-5 text-gray-400" />
                  <span className="text-gray-900">Joined {formatDate(profile.date_of_joining)}</span>
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