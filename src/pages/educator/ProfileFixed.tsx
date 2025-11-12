import { useEffect, useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  UserCircleIcon,
  PencilIcon,
  EnvelopeIcon,
  PhoneIcon,
  MapPinIcon,
  AcademicCapIcon,
  CalendarIcon,
  BuildingOfficeIcon,
} from '@heroicons/react/24/outline';
import { supabase } from '../../lib/supabaseClient';

interface EducatorProfile {
  id: string;
  email: string;
  first_name?: string;
  last_name?: string;
  phone_number?: string;
  address?: string;
  city?: string;
  specialization?: string;
  qualification?: string;
  experience_years?: number;
  designation?: string;
  department?: string;
  school_name?: string;
  full_name?: string;
  date_of_joining?: string;
}

const ProfileFixed = () => {
  const navigate = useNavigate();
  const [profile, setProfile] = useState<EducatorProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(false);
  const [formData, setFormData] = useState<Partial<EducatorProfile>>({});
  const [saving, setSaving] = useState(false);
  const [initialized, setInitialized] = useState(false);

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
        .select(`
          *,
          schools:school_id (
            name
          )
        `)
        .eq('email', email)
        .maybeSingle();

      if (error) {
        console.error('❌ Error loading profile:', error.message);
        throw error;
      }

      if (educatorData) {
        const profileData: EducatorProfile = {
          id: educatorData.id,
          email: educatorData.email,
          first_name: educatorData.first_name || '',
          last_name: educatorData.last_name || '',
          phone_number: educatorData.phone_number || '',
          address: educatorData.address || '',
          city: educatorData.city || '',
          specialization: educatorData.specialization || '',
          qualification: educatorData.qualification || '',
          experience_years: educatorData.experience_years || 0,
          designation: educatorData.designation || '',
          department: educatorData.department || '',
          school_name: educatorData.schools?.name || '',
          date_of_joining: educatorData.date_of_joining || educatorData.created_at,
          full_name: educatorData.first_name && educatorData.last_name 
            ? `${educatorData.first_name} ${educatorData.last_name}`
            : educatorData.first_name || 'Educator',
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
    setFormData(profile || {});
  };

  const handleCancel = () => {
    setEditing(false);
    setFormData({});
  };

  const handleSave = async () => {
    if (!profile || !profile.email) return;

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

      console.log('💾 Saving profile:', updateData);

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
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const formatDate = (dateString?: string) => {
    if (!dateString) return 'November 12, 2025';
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
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
            <UserCircleIcon className="h-24 w-24 text-gray-400" />
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

          {/* Contact & Professional Info */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Contact Information */}
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
              </div>
            </div>

            {/* Professional Information */}
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