import { apiPost } from '@/shared/api/apiClient';

export interface Faculty {
  id: string;
  userId?: string;
  collegeId: string;
  employeeId?: string;
  department?: string;
  specialization?: string;
  qualification?: string;
  experienceYears?: number;
  dateOfJoining?: string;
  accountStatus: 'active' | 'deactivated' | 'pending' | 'suspended';
  createdAt: string;
  updatedAt: string;
  // New separate columns from migration
  first_name?: string;
  last_name?: string;
  email?: string;
  phone?: string;
  address?: string;
  date_of_birth?: string;
  gender?: string;
  designation?: string;
  subject_expertise?: any[];
  temporary_password?: string;
  password_created_at?: string;
  created_by?: string;
  verification_status?: string;
  verified_by?: string;
  verified_at?: string;
  degree_certificate_url?: string;
  id_proof_url?: string;
  experience_letters_url?: any[];
  // Keep metadata for backward compatibility
  metadata?: {
    [key: string]: any;
  };
}

// Get faculty statistics
export const getFacultyStatistics = async (collegeId: string) => {
  const result = await apiPost('/college-admin/faculty', { action: 'get-faculty-statistics', college_id: collegeId });

  if (!result.success || !result.data) return {
    total: 0,
    active: 0,
    pending: 0,
    inactive: 0,
    suspended: 0,
    verified: 0,
  };

  return result.data;
};

// Get all faculty for a college
export const getFaculty = async (collegeId: string) => {
  const result = await apiPost('/college-admin/faculty', { action: 'get-faculty', college_id: collegeId });
  if (!result.success) throw new Error(result.error || 'Failed to fetch faculty');
  return result.data as Faculty[];
};

// Get faculty by ID
export const getFacultyById = async (facultyId: string) => {
  const result = await apiPost('/college-admin/faculty', { action: 'get-faculty-by-id', faculty_id: facultyId });
  if (!result.success) throw new Error(result.error || 'Failed to fetch faculty');
  return result.data as Faculty;
};

// Create new faculty
export const createFaculty = async (facultyData: Partial<Faculty>) => {
  const result = await apiPost('/college-admin/faculty', { action: 'create-faculty', ...facultyData });
  if (!result.success) throw new Error(result.error || 'Failed to create faculty');
  return result.data as Faculty;
};

// Update faculty
export const updateFaculty = async (facultyId: string, updates: Partial<Faculty>) => {
  const result = await apiPost('/college-admin/faculty', { action: 'update-faculty', faculty_id: facultyId, ...updates });
  if (!result.success) throw new Error(result.error || 'Failed to update faculty');
  return result.data as Faculty;
};

// Delete faculty
export const deleteFaculty = async (facultyId: string) => {
  const result = await apiPost('/college-admin/faculty', { action: 'delete-faculty', faculty_id: facultyId });
  if (!result.success) throw new Error(result.error || 'Failed to delete faculty');
};

// Update faculty status
export const updateFacultyStatus = async (
  facultyId: string,
  status: Faculty['accountStatus']
) => {
  return updateFaculty(facultyId, { accountStatus: status });
};
