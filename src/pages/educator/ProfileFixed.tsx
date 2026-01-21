import {
  AcademicCapIcon,
  BuildingOfficeIcon,
  CalendarIcon,
  EnvelopeIcon,
  MapPinIcon,
  PencilIcon,
  PhoneIcon,
  UserCircleIcon,
} from '@heroicons/react/24/outline';
import { useCallback, useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../../lib/supabaseClient';
import { getDocumentUrl } from '../../services/fileUploadService';

interface EducatorProfile {
  id: string;
  user_id?: string;
  school_id?: string;
  employee_id?: string;
  email: string;
  // Personal Information
  first_name?: string;
  last_name?: string;
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
  specialization?: string;
  qualification?: string;
  experience_years?: number;
  designation?: string;
  department?: string;
  date_of_joining?: string;
  subjects_handled?: string[];
  // Documents
  resume_url?: string;
  id_proof_url?: string;
  // Verification & Status
  account_status?: string;
  verification_status?: string;
  verified_by?: string;
  verified_at?: string;
  // Computed fields
  school_name?: string;
  full_name?: string;
  // Metadata
  metadata?: any;
}

const ProfileFixed = () => {
  const navigate = useNavigate();
  const [profile, setProfile] = useState<EducatorProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(false);
  const [formData, setFormData] = useState<Partial<EducatorProfile>>({});
  const [saving, setSaving] = useState(false);
  const [initialized, setInitialized] = useState(false);

  // Helper function to safely get document URL
  const getSafeDocumentUrl = (url: string | undefined | null): string | null => {
    if (!url || url.trim() === '' || url === 'null') {
      return null;
    }

    // If it's already a full URL, use the proxy
    if (url.startsWith('http')) {
      return getDocumentUrl(url, 'inline');
    }

    // If it's a relative path, construct the full URL first
    return getDocumentUrl(url, 'inline');
  };

  // Helper function to check if URL is valid
  const isValidUrl = (url: string | undefined | null): boolean => {
    if (!url || url.trim() === '' || url === 'null') {
      return false;
    }
    try {
      new URL(url);
      return true;
    } catch {
      return false;
    }
  };

  // Stable function to get user email
  const getUserEmail = useCallback(() => {
    // Try multiple sources for email
    const storedUser = localStorage.getItem('user');
    const storedEmail = localStorage.getItem('userEmail');

    if (storedUser) {
      try {
        const userData = JSON.parse(storedUser);
        return userData.email || storedEmail;
      } catch (e) {
        console.error('Error parsing stored user:', e);
      }
    }

    if (storedEmail) {
      return storedEmail;
    }

    // Default email for testing
    return 'karthikeyan@rareminds.in';
  }, []);

  // Load profile function
  const loadProfile = useCallback(async (email: string) => {
    if (!email) return;

    try {
      setLoading(true);
      console.log('🔍 Loading profile for:', email);

      const { data: educatorData, error } = await supabase
        .from('school_educators')
        .select(
          `
          *,
          school:organizations!school_educators_school_id_fkey (
            name,
            organization_type
          )
        `
        )
        .eq('email', email)
        .maybeSingle();

      if (error) {
        console.error('❌ Error loading profile:', error.message);
        throw error;
      }

      if (educatorData) {
        const profileData: EducatorProfile = {
          // Primary fields
          id: educatorData.id,
          user_id: educatorData.user_id,
          school_id: educatorData.school_id,
          employee_id: educatorData.employee_id || '',
          email: educatorData.email,

          // Personal Information
          first_name: educatorData.first_name || '',
          last_name: educatorData.last_name || '',
          phone_number: educatorData.phone_number || '',
          dob: educatorData.dob || '',
          gender: educatorData.gender || '',
          address: educatorData.address || '',
          city: educatorData.city || '',
          state: educatorData.state || '',
          country: educatorData.country || '',
          pincode: educatorData.pincode || '',
          photo_url: educatorData.photo_url || '',

          // Professional Information
          specialization: educatorData.specialization || '',
          qualification: educatorData.qualification || '',
          experience_years: educatorData.experience_years || 0,
          designation: educatorData.designation || '',
          department: educatorData.department || '',
          date_of_joining: educatorData.date_of_joining || educatorData.created_at,
          subjects_handled: educatorData.subjects_handled || [],

          // Documents
          resume_url: educatorData.resume_url || '',
          id_proof_url: educatorData.id_proof_url || '',

          // Status & Verification
          account_status: educatorData.account_status || 'active',
          verification_status: educatorData.verification_status || 'Pending',
          verified_by: educatorData.verified_by || '',
          verified_at: educatorData.verified_at || '',

          // Computed fields
          school_name: educatorData.schools?.name || '',
          full_name:
            educatorData.first_name && educatorData.last_name
              ? `${educatorData.first_name} ${educatorData.last_name}`
              : educatorData.first_name || 'Educator',

          // Metadata
          metadata: educatorData.metadata || {},
        };

        console.log('✅ Profile loaded successfully:', profileData);
        setProfile(profileData);
      } else {
        console.log('❌ No educator data found');
        // Create basic profile
        setProfile({
          id: '',
          email: email,
          full_name: 'Educator',
        });
      }
    } catch (error) {
      console.error('💥 Failed to load profile:', error);
      // Create fallback profile
      setProfile({
        id: '',
        email: email,
        full_name: 'Educator',
      });
    } finally {
      setLoading(false);
    }
  }, []);

  // Initialize profile on mount
  useEffect(() => {
    if (!initialized) {
      const email = getUserEmail();
      console.log('🚀 Initializing profile with email:', email);

      if (email) {
        loadProfile(email);
      } else {
        console.log('❌ No email found, redirecting to login');
        navigate('/login/educator');
      }

      setInitialized(true);
    }
  }, [initialized, getUserEmail, loadProfile, navigate]);

  const handleEdit = () => {
    setEditing(true);
    // Clean the profile data for form editing
    const cleanedProfile = { ...profile };

    // Convert null dates to empty strings for form inputs
    if (cleanedProfile.dob === null || cleanedProfile.dob === 'null') {
      cleanedProfile.dob = '';
    }
    if (cleanedProfile.date_of_joining === null || cleanedProfile.date_of_joining === 'null') {
      cleanedProfile.date_of_joining = '';
    }

    // Convert null strings to empty strings
    Object.keys(cleanedProfile).forEach((key) => {
      if (cleanedProfile[key] === null || cleanedProfile[key] === 'null') {
        cleanedProfile[key] = '';
      }
    });

    setFormData(cleanedProfile);
  };

  const handleCancel = () => {
    setEditing(false);
    setFormData({});
  };

  const handleSave = async () => {
    if (!profile || !profile.email) return;

    try {
      setSaving(true);

      // Helper function to handle date fields
      const formatDateForDB = (dateValue: string | undefined | null) => {
        if (!dateValue || dateValue.trim() === '') {
          return null;
        }
        return dateValue;
      };

      // Helper function to handle string fields
      const formatStringForDB = (stringValue: string | undefined | null) => {
        if (!stringValue || stringValue.trim() === '') {
          return null;
        }
        return stringValue.trim();
      };

      // Helper function to handle number fields
      const formatNumberForDB = (numberValue: string | number | undefined | null) => {
        if (!numberValue || numberValue === '') {
          return null;
        }
        const parsed = typeof numberValue === 'string' ? parseInt(numberValue) : numberValue;
        return isNaN(parsed) ? null : parsed;
      };

      const updateData = {
        // Personal Information
        first_name: formatStringForDB(
          formData.hasOwnProperty('first_name') ? formData.first_name : profile.first_name
        ),
        last_name: formatStringForDB(
          formData.hasOwnProperty('last_name') ? formData.last_name : profile.last_name
        ),
        phone_number: formatStringForDB(
          formData.hasOwnProperty('phone_number') ? formData.phone_number : profile.phone_number
        ),
        dob: formatDateForDB(formData.hasOwnProperty('dob') ? formData.dob : profile.dob),
        gender: formatStringForDB(
          formData.hasOwnProperty('gender') ? formData.gender : profile.gender
        ),
        address: formatStringForDB(
          formData.hasOwnProperty('address') ? formData.address : profile.address
        ),
        city: formatStringForDB(formData.hasOwnProperty('city') ? formData.city : profile.city),
        state: formatStringForDB(formData.hasOwnProperty('state') ? formData.state : profile.state),
        country: formatStringForDB(
          formData.hasOwnProperty('country') ? formData.country : profile.country
        ),
        pincode: formatStringForDB(
          formData.hasOwnProperty('pincode') ? formData.pincode : profile.pincode
        ),

        // Professional Information
        employee_id: formatStringForDB(
          formData.hasOwnProperty('employee_id') ? formData.employee_id : profile.employee_id
        ),
        specialization: formatStringForDB(
          formData.hasOwnProperty('specialization')
            ? formData.specialization
            : profile.specialization
        ),
        qualification: formatStringForDB(
          formData.hasOwnProperty('qualification') ? formData.qualification : profile.qualification
        ),
        experience_years: formatNumberForDB(
          formData.hasOwnProperty('experience_years')
            ? formData.experience_years
            : profile.experience_years
        ),
        designation: formatStringForDB(
          formData.hasOwnProperty('designation') ? formData.designation : profile.designation
        ),
        department: formatStringForDB(
          formData.hasOwnProperty('department') ? formData.department : profile.department
        ),
        date_of_joining: formatDateForDB(
          formData.hasOwnProperty('date_of_joining')
            ? formData.date_of_joining
            : profile.date_of_joining
        ),
        subjects_handled: formData.hasOwnProperty('subjects_handled')
          ? formData.subjects_handled
          : profile.subjects_handled || null,

        // Documents
        resume_url: formatStringForDB(
          formData.hasOwnProperty('resume_url') ? formData.resume_url : profile.resume_url
        ),
        id_proof_url: formatStringForDB(
          formData.hasOwnProperty('id_proof_url') ? formData.id_proof_url : profile.id_proof_url
        ),
        photo_url: formatStringForDB(
          formData.hasOwnProperty('photo_url') ? formData.photo_url : profile.photo_url
        ),

        // System fields
        updated_at: new Date().toISOString(),
      };

      // Remove any undefined values
      Object.keys(updateData).forEach((key) => {
        if (updateData[key] === undefined) {
          delete updateData[key];
        }
      });

      console.log('💾 Saving profile:', updateData);
      console.log('🖼️ Photo URL debug:', {
        'formData.photo_url': formData.photo_url,
        'profile.photo_url': profile.photo_url,
        hasOwnProperty: formData.hasOwnProperty('photo_url'),
        final_photo_url: updateData.photo_url,
      });

      const { error } = await supabase
        .from('school_educators')
        .update(updateData)
        .eq('email', profile.email);

      if (error) {
        throw error;
      }

      // Update local state
      const updatedProfile = { ...profile, ...formData };
      setProfile(updatedProfile);
      setEditing(false);
      setFormData({});

      // Notify Header component to refresh
      console.log('📢 Emitting profile update event for header refresh');
      window.dispatchEvent(new CustomEvent('educatorProfileUpdated'));

      alert('Profile saved successfully!');
      console.log('✅ Profile saved successfully');
    } catch (error) {
      console.error('💥 Save error:', error);
      alert(`Failed to save: ${error.message}`);
    } finally {
      setSaving(false);
    }
  };

  const handleInputChange = (field: keyof EducatorProfile, value: any) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const formatDate = (dateString?: string) => {
    if (!dateString) return 'November 12, 2025';
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading profile...</p>
        </div>
      </div>
    );
  }

  if (!profile) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <p className="text-red-600">Failed to load profile</p>
          <button
            onClick={() => {
              setInitialized(false);
              setLoading(true);
            }}
            className="mt-4 px-4 py-2 bg-indigo-600 text-white rounded hover:bg-indigo-700"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto p-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">My Profile</h1>
          <p className="mt-2 text-gray-600">Manage your account information and preferences.</p>
        </div>
        {!editing && (
          <button
            onClick={handleEdit}
            className="inline-flex items-center px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50"
          >
            <PencilIcon className="h-4 w-4 mr-2" />
            Edit Profile
          </button>
        )}
      </div>

      {/* Profile Card */}
      <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
        <div className="px-6 py-8">
          {/* Profile Header */}
          <div className="flex items-center space-x-6 mb-8">
            <div className="relative">
              {profile.photo_url && getSafeDocumentUrl(profile.photo_url) ? (
                <div className="relative">
                  <img
                    src={getSafeDocumentUrl(profile.photo_url) || ''}
                    alt={profile.full_name || 'Profile Photo'}
                    className="h-24 w-24 rounded-full object-cover border-2 border-gray-200 shadow-sm"
                    onError={(e) => {
                      // Fallback to icon if image fails to load
                      console.log('Photo failed to load, showing fallback');
                      e.currentTarget.style.display = 'none';
                      const fallback = e.currentTarget.parentNode
                        // @ts-expect-error - Auto-suppressed for migration
                        ?.nextElementSibling as HTMLElement;
                      if (fallback) fallback.style.display = 'block';
                    }}
                  />
                  {editing && (
                    <div className="absolute bottom-0 right-0 bg-indigo-600 rounded-full p-1 shadow-sm">
                      <PencilIcon className="h-3 w-3 text-white" />
                    </div>
                  )}
                </div>
              ) : null}
              <div className={`${profile.photo_url ? 'hidden' : 'block'}`}>
                <UserCircleIcon className="h-24 w-24 text-gray-400" />
                {editing && (
                  <div className="absolute bottom-0 right-0 bg-indigo-600 rounded-full p-1 shadow-sm">
                    <PencilIcon className="h-3 w-3 text-white" />
                  </div>
                )}
              </div>
            </div>
            <div className="flex-1">
              {editing ? (
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      First Name
                    </label>
                    <input
                      type="text"
                      value={formData.first_name || ''}
                      onChange={(e) => handleInputChange('first_name', e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Last Name
                    </label>
                    <input
                      type="text"
                      value={formData.last_name || ''}
                      onChange={(e) => handleInputChange('last_name', e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    />
                  </div>
                  <div className="md:col-span-2">
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Profile Photo URL
                    </label>
                    <div className="flex space-x-4">
                      <div className="flex-1">
                        <input
                          type="url"
                          value={formData.photo_url || ''}
                          onChange={(e) => handleInputChange('photo_url', e.target.value)}
                          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
                          placeholder="https://example.com/your-photo.jpg"
                        />
                        <p className="mt-1 text-xs text-gray-500">
                          Enter a direct URL to your profile photo (JPG, PNG, etc.)
                        </p>
                      </div>
                      {formData.photo_url && isValidUrl(formData.photo_url) && (
                        <div className="flex-shrink-0">
                          <p className="text-xs text-gray-500 mb-1">Preview:</p>
                          <img
                            src={getSafeDocumentUrl(formData.photo_url) || ''}
                            alt="Photo preview"
                            className="h-16 w-16 rounded-full object-cover border-2 border-gray-200"
                            onError={(e) => {
                              e.currentTarget.style.display = 'none';
                              const fallback = e.currentTarget.nextElementSibling as HTMLElement;
                              if (fallback) fallback.style.display = 'block';
                            }}
                          />
                          <div className="h-16 w-16 rounded-full bg-gray-100 border-2 border-gray-200 flex items-center justify-center hidden">
                            <span className="text-xs text-gray-500">Invalid URL</span>
                          </div>
                        </div>
                      )}
                    </div>
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

          {/* Personal Information Section */}
          <div className="mb-8">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Personal Information</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {/* Email */}
              <div className="flex items-center space-x-3">
                <EnvelopeIcon className="h-5 w-5 text-gray-400" />
                <div className="flex-1">
                  <p className="text-xs text-gray-500">Email</p>
                  <span className="text-gray-900 font-medium">{profile.email}</span>
                </div>
              </div>

              {/* Phone */}
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
                    <span className="text-gray-900 font-medium">
                      {profile.phone_number || 'Not provided'}
                    </span>
                  )}
                </div>
              </div>

              {/* Date of Birth */}
              <div className="flex items-center space-x-3">
                <CalendarIcon className="h-5 w-5 text-gray-400" />
                <div className="flex-1">
                  <p className="text-xs text-gray-500">Date of Birth</p>
                  {editing ? (
                    <input
                      type="date"
                      value={
                        formData.dob && formData.dob !== 'null' ? formData.dob.split('T')[0] : ''
                      }
                      onChange={(e) => handleInputChange('dob', e.target.value)}
                      className="w-full px-2 py-1 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    />
                  ) : (
                    <span className="text-gray-900 font-medium">
                      {profile.dob ? new Date(profile.dob).toLocaleDateString() : 'Not provided'}
                    </span>
                  )}
                </div>
              </div>

              {/* Gender */}
              <div className="flex items-center space-x-3">
                <UserCircleIcon className="h-5 w-5 text-gray-400" />
                <div className="flex-1">
                  <p className="text-xs text-gray-500">Gender</p>
                  {editing ? (
                    <select
                      value={formData.gender || ''}
                      onChange={(e) => handleInputChange('gender', e.target.value)}
                      className="w-full px-2 py-1 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    >
                      <option value="">Select Gender</option>
                      <option value="Male">Male</option>
                      <option value="Female">Female</option>
                      <option value="Other">Other</option>
                      <option value="Prefer not to say">Prefer not to say</option>
                    </select>
                  ) : (
                    <span className="text-gray-900 font-medium">
                      {profile.gender || 'Not specified'}
                    </span>
                  )}
                </div>
              </div>

              {/* Employee ID */}
              <div className="flex items-center space-x-3">
                <BuildingOfficeIcon className="h-5 w-5 text-gray-400" />
                <div className="flex-1">
                  <p className="text-xs text-gray-500">Employee ID</p>
                  {editing ? (
                    <input
                      type="text"
                      value={formData.employee_id || ''}
                      onChange={(e) => handleInputChange('employee_id', e.target.value)}
                      className="w-full px-2 py-1 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
                      placeholder="Employee ID"
                    />
                  ) : (
                    <span className="text-gray-900 font-medium">
                      {profile.employee_id || 'Not assigned'}
                    </span>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Address Information Section */}
          <div className="mb-8">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Address Information</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {/* Address */}
              <div className="md:col-span-2">
                <div className="flex items-center space-x-3">
                  <MapPinIcon className="h-5 w-5 text-gray-400" />
                  <div className="flex-1">
                    <p className="text-xs text-gray-500">Address</p>
                    {editing ? (
                      <textarea
                        value={formData.address || ''}
                        onChange={(e) => handleInputChange('address', e.target.value)}
                        className="w-full px-2 py-1 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
                        placeholder="Enter full address"
                        rows={2}
                      />
                    ) : (
                      <span className="text-gray-900 font-medium">
                        {profile.address || 'Not provided'}
                      </span>
                    )}
                  </div>
                </div>
              </div>

              {/* City */}
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
                      placeholder="City"
                    />
                  ) : (
                    <span className="text-gray-900 font-medium">
                      {profile.city || 'Not provided'}
                    </span>
                  )}
                </div>
              </div>

              {/* State */}
              <div className="flex items-center space-x-3">
                <MapPinIcon className="h-5 w-5 text-gray-400" />
                <div className="flex-1">
                  <p className="text-xs text-gray-500">State</p>
                  {editing ? (
                    <input
                      type="text"
                      value={formData.state || ''}
                      onChange={(e) => handleInputChange('state', e.target.value)}
                      className="w-full px-2 py-1 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
                      placeholder="State"
                    />
                  ) : (
                    <span className="text-gray-900 font-medium">
                      {profile.state || 'Not provided'}
                    </span>
                  )}
                </div>
              </div>

              {/* Country */}
              <div className="flex items-center space-x-3">
                <MapPinIcon className="h-5 w-5 text-gray-400" />
                <div className="flex-1">
                  <p className="text-xs text-gray-500">Country</p>
                  {editing ? (
                    <input
                      type="text"
                      value={formData.country || ''}
                      onChange={(e) => handleInputChange('country', e.target.value)}
                      className="w-full px-2 py-1 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
                      placeholder="Country"
                    />
                  ) : (
                    <span className="text-gray-900 font-medium">
                      {profile.country || 'Not provided'}
                    </span>
                  )}
                </div>
              </div>

              {/* Pincode */}
              <div className="flex items-center space-x-3">
                <MapPinIcon className="h-5 w-5 text-gray-400" />
                <div className="flex-1">
                  <p className="text-xs text-gray-500">Pincode</p>
                  {editing ? (
                    <input
                      type="text"
                      value={formData.pincode || ''}
                      onChange={(e) => handleInputChange('pincode', e.target.value)}
                      className="w-full px-2 py-1 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
                      placeholder="Pincode"
                    />
                  ) : (
                    <span className="text-gray-900 font-medium">
                      {profile.pincode || 'Not provided'}
                    </span>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Professional Information Section */}
          <div className="mb-8">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Professional Information</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {/* Specialization */}
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
                    <span className="text-gray-900 font-medium">
                      {profile.specialization || 'Not specified'}
                    </span>
                  )}
                </div>
              </div>

              {/* Qualification */}
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
                      placeholder="e.g., M.Tech, B.Ed"
                    />
                  ) : (
                    <span className="text-gray-900 font-medium">
                      {profile.qualification || 'Not specified'}
                    </span>
                  )}
                </div>
              </div>

              {/* Experience */}
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
                      {profile.experience_years
                        ? `${profile.experience_years} years`
                        : 'Not specified'}
                    </span>
                  )}
                </div>
              </div>

              {/* Designation */}
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
                    <span className="text-gray-900 font-medium">
                      {profile.designation || 'Not specified'}
                    </span>
                  )}
                </div>
              </div>

              {/* Department */}
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
                      placeholder="e.g., Computer Science Department"
                    />
                  ) : (
                    <span className="text-gray-900 font-medium">
                      {profile.department || 'Not specified'}
                    </span>
                  )}
                </div>
              </div>

              {/* Date of Joining */}
              <div className="flex items-center space-x-3">
                <CalendarIcon className="h-5 w-5 text-gray-400" />
                <div className="flex-1">
                  <p className="text-xs text-gray-500">Date of Joining</p>
                  {editing ? (
                    <input
                      type="date"
                      value={
                        formData.date_of_joining && formData.date_of_joining !== 'null'
                          ? formData.date_of_joining.split('T')[0]
                          : ''
                      }
                      onChange={(e) => handleInputChange('date_of_joining', e.target.value)}
                      className="w-full px-2 py-1 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    />
                  ) : (
                    <span className="text-gray-900 font-medium">
                      {profile.date_of_joining
                        ? formatDate(profile.date_of_joining)
                        : 'Not specified'}
                    </span>
                  )}
                </div>
              </div>
            </div>

            {/* Subjects Handled */}
            {editing && (
              <div className="mt-4">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Subjects Handled
                </label>
                <textarea
                  value={formData.subjects_handled ? formData.subjects_handled.join(', ') : ''}
                  onChange={(e) =>
                    handleInputChange(
                      'subjects_handled',
                      e.target.value.split(', ').filter((s) => s.trim())
                    )
                  }
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  placeholder="Enter subjects separated by commas (e.g., Mathematics, Physics, Chemistry)"
                  rows={2}
                />
              </div>
            )}
            {!editing && profile.subjects_handled && profile.subjects_handled.length > 0 && (
              <div className="mt-4">
                <p className="text-sm font-medium text-gray-700 mb-2">Subjects Handled:</p>
                <div className="flex flex-wrap gap-2">
                  {profile.subjects_handled.map((subject, index) => (
                    <span
                      key={index}
                      className="px-2 py-1 bg-blue-100 text-blue-800 text-sm rounded-md"
                    >
                      {subject}
                    </span>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Documents Section */}
          <div className="mb-8">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Documents & Links</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {/* Resume URL */}
              <div className="flex items-center space-x-3">
                <AcademicCapIcon className="h-5 w-5 text-gray-400" />
                <div className="flex-1">
                  <p className="text-xs text-gray-500">Resume URL</p>
                  {editing ? (
                    <input
                      type="url"
                      value={formData.resume_url || ''}
                      onChange={(e) => handleInputChange('resume_url', e.target.value)}
                      className="w-full px-2 py-1 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
                      placeholder="https://example.com/resume.pdf"
                    />
                  ) : (
                    <span className="text-gray-900 font-medium">
                      {profile.resume_url && isValidUrl(profile.resume_url) ? (
                        <a
                          href={getSafeDocumentUrl(profile.resume_url) || '#'}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-blue-600 hover:underline"
                          onClick={(e) => {
                            const url = getSafeDocumentUrl(profile.resume_url);
                            if (!url) {
                              e.preventDefault();
                              alert('Document URL is not available');
                            }
                          }}
                        >
                          View Resume
                        </a>
                      ) : (
                        'Not provided'
                      )}
                    </span>
                  )}
                </div>
              </div>

              {/* ID Proof URL */}
              <div className="flex items-center space-x-3">
                <AcademicCapIcon className="h-5 w-5 text-gray-400" />
                <div className="flex-1">
                  <p className="text-xs text-gray-500">ID Proof URL</p>
                  {editing ? (
                    <input
                      type="url"
                      value={formData.id_proof_url || ''}
                      onChange={(e) => handleInputChange('id_proof_url', e.target.value)}
                      className="w-full px-2 py-1 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
                      placeholder="https://example.com/id-proof.pdf"
                    />
                  ) : (
                    <span className="text-gray-900 font-medium">
                      {profile.id_proof_url && isValidUrl(profile.id_proof_url) ? (
                        <a
                          href={getSafeDocumentUrl(profile.id_proof_url) || '#'}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-blue-600 hover:underline"
                          onClick={(e) => {
                            const url = getSafeDocumentUrl(profile.id_proof_url);
                            if (!url) {
                              e.preventDefault();
                              alert('Document URL is not available');
                            }
                          }}
                        >
                          View ID Proof
                        </a>
                      ) : (
                        'Not provided'
                      )}
                    </span>
                  )}
                </div>
              </div>

              {/* Photo URL */}
              <div className="flex items-center space-x-3">
                <UserCircleIcon className="h-5 w-5 text-gray-400" />
                <div className="flex-1">
                  <p className="text-xs text-gray-500">Photo URL</p>
                  {editing ? (
                    <input
                      type="url"
                      value={formData.photo_url || ''}
                      onChange={(e) => handleInputChange('photo_url', e.target.value)}
                      className="w-full px-2 py-1 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
                      placeholder="https://example.com/photo.jpg"
                    />
                  ) : (
                    <span className="text-gray-900 font-medium">
                      {profile.photo_url && isValidUrl(profile.photo_url) ? (
                        <a
                          href={getSafeDocumentUrl(profile.photo_url) || '#'}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-blue-600 hover:underline"
                          onClick={(e) => {
                            const url = getSafeDocumentUrl(profile.photo_url);
                            if (!url) {
                              e.preventDefault();
                              alert('Photo URL is not available');
                            }
                          }}
                        >
                          View Photo
                        </a>
                      ) : (
                        'Not provided'
                      )}
                    </span>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Debug Information (Development Only) */}
          {process.env.NODE_ENV === 'development' && (
            <div className="mb-8 p-4 bg-gray-50 rounded-lg border">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Debug Information</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 text-sm">
                <div>
                  <p className="text-xs text-gray-500">Profile ID</p>
                  <span className="font-mono text-gray-700">{profile.id}</span>
                </div>
                <div>
                  <p className="text-xs text-gray-500">User ID</p>
                  <span className="font-mono text-gray-700">{profile.user_id}</span>
                </div>
                <div>
                  <p className="text-xs text-gray-500">School ID</p>
                  <span className="font-mono text-gray-700">{profile.school_id}</span>
                </div>
              </div>
            </div>
          )}

          {/* Status Information */}
          <div className="mb-8">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Status Information</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {/* Account Status */}
              <div className="flex items-center space-x-3">
                <div className="flex-1">
                  <p className="text-xs text-gray-500">Account Status</p>
                  <span
                    className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                      profile.account_status === 'active'
                        ? 'bg-green-100 text-green-800'
                        : 'bg-red-100 text-red-800'
                    }`}
                  >
                    {profile.account_status || 'Unknown'}
                  </span>
                </div>
              </div>

              {/* Verification Status */}
              <div className="flex items-center space-x-3">
                <div className="flex-1">
                  <p className="text-xs text-gray-500">Verification Status</p>
                  <span
                    className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                      profile.verification_status === 'Verified'
                        ? 'bg-green-100 text-green-800'
                        : profile.verification_status === 'Pending'
                          ? 'bg-yellow-100 text-yellow-800'
                          : 'bg-red-100 text-red-800'
                    }`}
                  >
                    {profile.verification_status || 'Unknown'}
                  </span>
                </div>
              </div>

              {/* School Name */}
              <div className="flex items-center space-x-3">
                <BuildingOfficeIcon className="h-5 w-5 text-gray-400" />
                <div className="flex-1">
                  <p className="text-xs text-gray-500">School</p>
                  <span className="text-gray-900 font-medium">
                    {profile.school_name || 'Not assigned'}
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          {editing && (
            <div className="mt-8 flex space-x-4">
              <button
                onClick={handleSave}
                disabled={saving}
                className="px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 disabled:opacity-50"
              >
                {saving ? 'Saving...' : 'Save Changes'}
              </button>
              <button
                onClick={handleCancel}
                className="px-4 py-2 border border-gray-300 text-gray-700 rounded-md hover:bg-gray-50"
              >
                Cancel
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default ProfileFixed;
