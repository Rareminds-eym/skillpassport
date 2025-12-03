import { supabase } from '../lib/supabaseClient';

export interface Teacher {
  id: string;
  teacher_id: string;
  user_id: string;
  school_id: string;
  first_name: string;
  last_name: string;
  email: string;
  phone_number?: string;
  role: 'school_admin' | 'principal' | 'it_admin' | 'class_teacher' | 'subject_teacher';
  designation?: string;
  department?: string;
  qualification?: string;
  specialization?: string;
  experience_years?: number;
  date_of_joining?: string;
  onboarding_status: 'pending' | 'documents_uploaded' | 'verified' | 'active' | 'inactive';
  verification_status?: string;
  subject_expertise?: any[];
  subjects_handled?: string[];
  degree_certificate_url?: string;
  id_proof_url?: string;
  experience_letters_url?: string[];
  resume_url?: string;
  photo_url?: string;
  created_at: string;
  updated_at: string;
}

export interface TeacherPerformance {
  teacher_id: string;
  classes_taught: number;
  students_count: number;
  lesson_plans_created: number;
  assignments_created: number;
  average_student_performance: number;
  attendance_rate: number;
}

// Get all teachers for a school
export const getTeachers = async (schoolId: string) => {
  const { data, error } = await supabase
    .from('school_educators')
    .select('*')
    .eq('school_id', schoolId)
    .order('created_at', { ascending: false });

  if (error) throw error;
  return data as Teacher[];
};

// Get teacher by ID
export const getTeacherById = async (teacherId: string) => {
  const { data, error } = await supabase
    .from('school_educators')
    .select('*')
    .eq('id', teacherId)
    .single();

  if (error) throw error;
  return data as Teacher;
};

// Create new teacher
export const createTeacher = async (teacherData: Partial<Teacher>) => {
  const { data, error } = await supabase
    .from('school_educators')
    .insert(teacherData)
    .select()
    .single();

  if (error) throw error;
  return data as Teacher;
};

// Update teacher
export const updateTeacher = async (teacherId: string, updates: Partial<Teacher>) => {
  const { data, error } = await supabase
    .from('school_educators')
    .update(updates)
    .eq('id', teacherId)
    .select()
    .single();

  if (error) throw error;
  return data as Teacher;
};

// Delete teacher
export const deleteTeacher = async (teacherId: string) => {
  const { error } = await supabase
    .from('school_educators')
    .delete()
    .eq('id', teacherId);

  if (error) throw error;
};

// Update teacher status
export const updateTeacherStatus = async (
  teacherId: string,
  status: Teacher['onboarding_status']
) => {
  return updateTeacher(teacherId, { onboarding_status: status });
};

// Bulk import teachers
export const bulkImportTeachers = async (teachers: Partial<Teacher>[]) => {
  const { data, error } = await supabase
    .from('school_educators')
    .insert(teachers)
    .select();

  if (error) throw error;
  return data as Teacher[];
};

// Get teacher performance analytics
export const getTeacherPerformance = async (teacherId: string): Promise<TeacherPerformance> => {
  // Get classes taught
  const { data: classes } = await supabase
    .from('school_educator_class_assignments')
    .select('class_id')
    .eq('educator_id', teacherId);

  // Get lesson plans
  const { data: lessonPlans } = await supabase
    .from('lesson_plans')
    .select('id')
    .eq('teacher_id', teacherId);

  // Get assignments
  const { data: assignments } = await supabase
    .from('assignments')
    .select('id')
    .eq('teacher_id', teacherId);

  // Get students count from class assignments
  const { data: students } = await supabase
    .from('school_educator_class_assignments')
    .select('class_id')
    .eq('educator_id', teacherId);

  return {
    teacher_id: teacherId,
    classes_taught: classes?.length || 0,
    students_count: students?.length || 0,
    lesson_plans_created: lessonPlans?.length || 0,
    assignments_created: assignments?.length || 0,
    average_student_performance: 0, // Calculate from student grades
    attendance_rate: 0, // Calculate from attendance records
  };
};

// Upload teacher document
export const uploadTeacherDocument = async (
  file: File,
  path: string
): Promise<string> => {
  const fileExt = file.name.split('.').pop();
  const fileName = `${Math.random().toString(36).substring(2)}.${fileExt}`;
  const filePath = `${path}/${fileName}`;

  const { error: uploadError } = await supabase.storage
    .from('teacher-documents')
    .upload(filePath, file);

  if (uploadError) throw uploadError;

  const { data } = supabase.storage
    .from('teacher-documents')
    .getPublicUrl(filePath);

  return data.publicUrl;
};

// Get teacher workload
export const getTeacherWorkload = async (teacherId: string) => {
  const { data, error } = await supabase
    .from('teacher_workload')
    .select('*')
    .eq('teacher_id', teacherId)
    .single();

  if (error && error.code !== 'PGRST116') throw error;
  return data;
};

// Get teacher timetable
export const getTeacherTimetable = async (teacherId: string) => {
  const { data, error } = await supabase
    .from('timetable_slots')
    .select(`
      *,
      timetables (
        *,
        school_classes (*)
      )
    `)
    .eq('teacher_id', teacherId)
    .order('day_of_week')
    .order('start_time');

  if (error) throw error;
  return data;
};

// Search teachers
export const searchTeachers = async (schoolId: string, query: string) => {
  const { data, error } = await supabase
    .from('school_educators')
    .select('*')
    .eq('school_id', schoolId)
    .or(`first_name.ilike.%${query}%,last_name.ilike.%${query}%,email.ilike.%${query}%,teacher_id.ilike.%${query}%`)
    .order('created_at', { ascending: false });

  if (error) throw error;
  return data as Teacher[];
};

// Get teacher statistics
export const getTeacherStatistics = async (schoolId: string) => {
  const { data: teachers } = await supabase
    .from('school_educators')
    .select('onboarding_status, role')
    .eq('school_id', schoolId);

  if (!teachers) return null;

  const stats = {
    total: teachers.length,
    active: teachers.filter(t => t.onboarding_status === 'active').length,
    pending: teachers.filter(t => t.onboarding_status === 'pending').length,
    verified: teachers.filter(t => t.onboarding_status === 'verified').length,
    inactive: teachers.filter(t => t.onboarding_status === 'inactive').length,
    byRole: {
      school_admin: teachers.filter(t => t.role === 'school_admin').length,
      principal: teachers.filter(t => t.role === 'principal').length,
      it_admin: teachers.filter(t => t.role === 'it_admin').length,
      class_teacher: teachers.filter(t => t.role === 'class_teacher').length,
      subject_teacher: teachers.filter(t => t.role === 'subject_teacher').length,
    }
  };

  return stats;
};
