import { apiPost } from '@/shared/api/apiClient';

async function fileToBase64(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => { const result = reader.result as string; resolve(result.split(',')[1] || result); };
    reader.onerror = () => reject(new Error('Failed to read file'));
    reader.readAsDataURL(file);
  });
}

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
  subject_expertise?: SubjectExpertise[];
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
  learners_count: number;
  lesson_plans_created: number;
  assignments_created: number;
  average_learner_performance: number;
  attendance_rate: number;
}

export const getTeachers = async (schoolId: string) => {
  const result: any = await apiPost('/educator-copilot/actions', { action: 'getTeachers', schoolId });
  return result?.data as Teacher[];
};

export const getTeacherById = async (teacherId: string) => {
  const result: any = await apiPost('/educator-copilot/actions', { action: 'getTeacherById', teacherId });
  return result?.data as Teacher;
};

export const createTeacher = async (teacherData: Partial<Teacher>) => {
  const result: any = await apiPost('/educator-copilot/actions', { action: 'createTeacher', teacherData });
  return result?.data as Teacher;
};

export const updateTeacher = async (teacherId: string, updates: Partial<Teacher>) => {
  const result: any = await apiPost('/educator-copilot/actions', { action: 'updateTeacher', teacherId, updates });
  return result?.data as Teacher;
};

export const deleteTeacher = async (teacherId: string) => {
  await apiPost('/educator-copilot/actions', { action: 'deleteTeacher', teacherId });
};

export const updateTeacherStatus = async (teacherId: string, status: Teacher['onboarding_status']) => {
  return updateTeacher(teacherId, { onboarding_status: status });
};

export const bulkImportTeachers = async (teachers: Partial<Teacher>[]) => {
  const result: any = await apiPost('/educator-copilot/actions', { action: 'bulkImportTeachers', teachers });
  return result?.data as Teacher[];
};

export const getTeacherPerformance = async (teacherId: string): Promise<TeacherPerformance> => {
  const result: any = await apiPost('/educator-copilot/actions', { action: 'getTeacherPerformance', teacherId });
  return result?.data;
};

export const uploadTeacherDocument = async (file: File, path: string): Promise<string> => {
  const fileExt = file.name.split('.').pop();
  const fileName = `${Math.random().toString(36).substring(2)}.${fileExt}`;
  const filePath = `${path}/${fileName}`;

  const base64 = await fileToBase64(file);
  const result: any = await apiPost('/college-admin/storage', {
    action: 'upload', bucket: 'teacher-documents', path: filePath, file_base64: base64, content_type: file.type || 'application/octet-stream',
  });

  const publicUrl = result?.data?.publicUrl;
  if (!publicUrl) throw new Error('Failed to upload teacher document');

  return publicUrl;
};

export const getTeacherWorkload = async (teacherId: string) => {
  const result: any = await apiPost('/educator-copilot/actions', { action: 'getTeacherWorkload', teacherId });
  return result?.data;
};

export const getTeacherTimetable = async (teacherId: string) => {
  const result: any = await apiPost('/educator-copilot/actions', { action: 'getTeacherTimetable', teacherId });
  return result?.data;
};

export const searchTeachers = async (schoolId: string, query: string) => {
  const result: any = await apiPost('/educator-copilot/actions', { action: 'searchTeachers', schoolId, query });
  return result?.data as Teacher[];
};

export const getTeacherStatistics = async (schoolId: string) => {
  const result: any = await apiPost('/educator-copilot/actions', { action: 'getTeacherStatistics', schoolId });
  return result?.data;
};
