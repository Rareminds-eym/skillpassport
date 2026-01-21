import { supabase } from '../lib/supabaseClient';

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
  const { data: faculty } = await supabase
    .from('college_lecturers')
    .select('accountStatus, verification_status')
    .eq('collegeId', collegeId);

  if (!faculty)
    return {
      total: 0,
      active: 0,
      pending: 0,
      inactive: 0,
      suspended: 0,
      verified: 0,
    };

  const stats = {
    total: faculty.length,
    active: faculty.filter((f) => f.accountStatus === 'active').length,
    pending: faculty.filter((f) => f.accountStatus === 'pending').length,
    deactivated: faculty.filter((f) => f.accountStatus === 'deactivated').length,
    suspended: faculty.filter((f) => f.accountStatus === 'suspended').length,
    verified: faculty.filter((f) => f.verification_status === 'verified').length,
  };

  return stats;
};

// Get all faculty for a college
export const getFaculty = async (collegeId: string) => {
  const { data, error } = await supabase
    .from('college_lecturers')
    .select('*')
    .eq('collegeId', collegeId)
    .order('createdAt', { ascending: false });

  if (error) throw error;
  return data as Faculty[];
};

// Get faculty by ID
export const getFacultyById = async (facultyId: string) => {
  const { data, error } = await supabase
    .from('college_lecturers')
    .select('*')
    .eq('id', facultyId)
    .single();

  if (error) throw error;
  return data as Faculty;
};

// Create new faculty
export const createFaculty = async (facultyData: Partial<Faculty>) => {
  const { data, error } = await supabase
    .from('college_lecturers')
    .insert(facultyData)
    .select()
    .single();

  if (error) throw error;
  return data as Faculty;
};

// Update faculty
export const updateFaculty = async (facultyId: string, updates: Partial<Faculty>) => {
  const { data, error } = await supabase
    .from('college_lecturers')
    .update(updates)
    .eq('id', facultyId)
    .select()
    .single();

  if (error) throw error;
  return data as Faculty;
};

// Delete faculty
export const deleteFaculty = async (facultyId: string) => {
  const { error } = await supabase.from('college_lecturers').delete().eq('id', facultyId);

  if (error) throw error;
};

// Update faculty status
export const updateFacultyStatus = async (facultyId: string, status: Faculty['accountStatus']) => {
  return updateFaculty(facultyId, { accountStatus: status });
};
