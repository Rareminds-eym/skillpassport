import { apiPost } from '@/shared/api/apiClient';

export interface MentorPeriod {
  id: string;
  college_id: string;
  name: string;
  academic_year: string;
  start_date: string;
  end_date: string;
  default_mentor_capacity: number;
  default_office_location: string;
  default_available_hours: string;
  is_active: boolean;
  created_at: string;
  created_by: string;
}

export interface MentorAllocation {
  id: string;
  mentor_id: string;
  learner_id: string;
  period_id: string;
  assigned_date: string;
  assigned_by: string;
  status: string;
  transfer_reason?: string;
  completion_date?: string;
  created_at: string;
}

export interface MentorNote {
  id: string;
  allocation_id: string;
  mentor_id: string;
  learner_id: string;
  title?: string;
  note_text: string;
  outcome?: string;
  intervention_type: 'academic' | 'personal' | 'career' | 'attendance' | 'behavioral' | 'financial' | 'other';
  status: 'pending' | 'acknowledged' | 'in_progress' | 'action_taken' | 'completed' | 'escalated';
  is_private: boolean;
  note_date: string;
  created_at: string;
  created_by_role?: 'admin' | 'educator';
  created_by_id?: string;
  last_updated_by?: string;
  last_updated_at?: string;
  priority?: 'low' | 'medium' | 'high' | 'urgent';
  follow_up_required?: boolean;
  follow_up_date?: string;
  admin_feedback?: string;
  educator_response?: string;
  action_taken?: string;
  next_steps?: string;
  resolved_at?: string;
  resolved_by?: string;
}

export interface Mentor {
  id: string;
  college_id: string;
  employee_id?: string;
  first_name: string;
  last_name: string;
  email: string;
  phone?: string;
  department: string;
  designation?: string;
  specialization?: string;
  qualification?: string;
  experience_years?: number;
  date_of_joining?: string;
  gender?: string;
  address?: string;
  subject_expertise: Array<{
    name: string;
    proficiency: string;
    years_experience: number;
  }>;
  account_status: string;
  user_id?: string;
}

export interface Learner {
  id: string;
  name: string;
  email: string;
  roll_number?: string;
  semester?: number;
  current_cgpa?: number;
  college_id: string;
  program_id?: string;
  program_section_id?: string;
  contact_number?: string;
  address?: string;
  date_of_birth?: string;
  gender?: string;
  enrollment_date?: string;
  expected_graduation_date?: string;
  learner_type?: string;
  user_id?: string;
  program_name?: string;
  department_name?: string;
  batch?: string;
  at_risk?: boolean;
  risk_factors?: string[];
  last_interaction?: string;
  intervention_count?: number;
}

export const getMentorPeriods = async (collegeId: string): Promise<MentorPeriod[]> => {
  const result = await apiPost<any>('/college-admin/mentors', { action: 'get-periods', college_id: collegeId });
  return result.data || [];
};

export const getMentors = async (collegeId: string): Promise<Mentor[]> => {
  const result = await apiPost<any>('/college-admin/mentors', { action: 'get-mentors', college_id: collegeId });
  return (result.data || []).map(mentor => ({
    id: mentor.id,
    college_id: mentor.collegeId,
    employee_id: mentor.employeeId,
    first_name: mentor.first_name || '',
    last_name: mentor.last_name || '',
    email: mentor.email || '',
    phone: mentor.phone,
    department: mentor.department || '',
    designation: mentor.designation,
    specialization: mentor.specialization,
    qualification: mentor.qualification,
    experience_years: mentor.experienceYears,
    date_of_joining: mentor.dateOfJoining,
    gender: mentor.gender,
    address: mentor.address,
    subject_expertise: mentor.subject_expertise || [],
    account_status: mentor.accountStatus,
    user_id: mentor.user_id,
  }));
};

export const getLearners = async (collegeId: string): Promise<Learner[]> => {
  const result = await apiPost<any>('/college-admin/mentors', { action: 'get-learners', college_id: collegeId });
  return (result.data || []).map(learner => {
    let batch = '';
    if (learner.enrollmentDate && learner.expectedGraduationDate) {
      const enrollYear = new Date(learner.enrollmentDate).getFullYear();
      const gradYear = new Date(learner.expectedGraduationDate).getFullYear();
      batch = `${enrollYear}-${gradYear}`;
    } else if (learner.enrollment_date && learner.expected_graduation_date) {
      const enrollYear = new Date(learner.enrollment_date).getFullYear();
      const gradYear = new Date(learner.expected_graduation_date).getFullYear();
      batch = `${enrollYear}-${gradYear}`;
    } else {
      const currentYear = new Date().getFullYear();
      batch = `${currentYear - 2}-${currentYear + 2}`;
    }

    const cgpa = parseFloat(learner.currentCgpa || learner.current_cgpa || '0');
    const atRisk = cgpa < 7.0 || (learner.semester && learner.semester > 4 && cgpa < 7.5);

    const riskFactors = [];
    if (cgpa < 6.5) riskFactors.push('Low CGPA');
    if (cgpa < 7.0 && learner.semester && learner.semester > 2) riskFactors.push('Academic Struggles');

    return {
      id: learner.id,
      name: learner.name || '',
      email: learner.email,
      roll_number: learner.roll_number || learner.registration_number || learner.enrollmentNumber || '',
      semester: learner.semester || 1,
      current_cgpa: cgpa,
      college_id: learner.college_id,
      program_id: learner.program_id,
      program_section_id: learner.program_section_id,
      contact_number: learner.contactNumber || learner.contact_number,
      address: learner.address,
      date_of_birth: learner.dateOfBirth || learner.date_of_birth,
      gender: learner.gender,
      enrollment_date: learner.enrollmentDate || learner.enrollment_date,
      expected_graduation_date: learner.expectedGraduationDate || learner.expected_graduation_date,
      learner_type: learner.learner_type,
      user_id: learner.user_id,
      program_name: learner.course_name || learner.branch_field || '',
      department_name: learner.branch_field || '',
      batch,
      at_risk: atRisk,
      risk_factors: riskFactors,
      last_interaction: undefined,
      intervention_count: 0,
    };
  });
};

export const getMentorAllocations = async (collegeId: string): Promise<MentorAllocation[]> => {
  const result = await apiPost<any>('/college-admin/mentors', { action: 'get-allocations', college_id: collegeId });
  return result.data || [];
};

export const findAllocationId = async (
  mentorId: string,
  learnerId: string,
  status: string = 'active'
): Promise<string | null> => {
  const result = await apiPost<any>('/college-admin/mentors', {
    action: 'find-allocation-id',
    mentor_id: mentorId,
    learner_id: learnerId,
    status,
  });
  return result.data ?? null;
};

export const getMentorNotes = async (collegeId: string): Promise<MentorNote[]> => {
  const result = await apiPost<any>('/college-admin/mentors', { action: 'get-mentor-notes', college_id: collegeId });
  return result.data || [];
};

export const createMentorPeriod = async (period: Omit<MentorPeriod, 'id' | 'created_at'>): Promise<MentorPeriod> => {
  const result = await apiPost<any>('/college-admin/mentors', {
    action: 'create-period',
    period,
    college_id: period.college_id,
  });
  return result.data;
};

export const createMentorAllocations = async (
  allocations: Omit<MentorAllocation, 'id' | 'created_at'>[]
): Promise<MentorAllocation[]> => {
  const result = await apiPost<any>('/college-admin/mentors', {
    action: 'create-allocations',
    allocations,
  });
  return result.data || [];
};

export const createMentorNote = async (note: Omit<MentorNote, 'id' | 'created_at'>): Promise<MentorNote> => {
  const result = await apiPost<any>('/college-admin/mentors', {
    action: 'create-mentor-note',
    note,
  });
  return result.data;
};

export const updateMentorAllocation = async (
  id: string,
  updates: Partial<MentorAllocation>
): Promise<MentorAllocation> => {
  const result = await apiPost<any>('/college-admin/mentors', {
    action: 'update-allocation',
    id,
    ...updates,
  });
  return result.data;
};

export const updateMentorPeriod = async (
  periodId: string,
  updates: Partial<MentorPeriod>
): Promise<MentorPeriod> => {
  const result = await apiPost<any>('/college-admin/mentors', {
    action: 'update-period',
    id: periodId,
    ...updates,
  });
  return result.data;
};

export const getDepartments = async (collegeId: string): Promise<Array<{id: string; name: string}>> => {
  const result = await apiPost<any>('/college-admin/mentors', { action: 'get-departments', college_id: collegeId });
  return result.data || [];
};

export const getPrograms = async (collegeId: string): Promise<Array<{id: string; name: string; code: string; department_name: string}>> => {
  const result = await apiPost<any>('/college-admin/mentors', { action: 'get-programs', college_id: collegeId });
  return (result.data || []).map(program => ({
    id: program.id,
    name: program.name,
    code: program.code,
    department_name: program.department_name || '',
  }));
};

export const updateMentorNoteResponse = async (
  noteId: string,
  updates: {
    educator_response: string;
    action_taken?: string;
    next_steps?: string;
    last_updated_by: string;
  }
): Promise<MentorNote> => {
  const result = await apiPost<any>('/college-admin/mentors', {
    action: 'update-note-response',
    note_id: noteId,
    ...updates,
  });
  return result.data;
};

export const updateMentorNoteFeedback = async (
  noteId: string,
  updates: {
    admin_feedback?: string;
    status?: string;
    priority?: string;
    follow_up_required?: boolean;
    follow_up_date?: string;
    last_updated_by: string;
  }
): Promise<MentorNote> => {
  const result = await apiPost<any>('/college-admin/mentors', {
    action: 'update-note-feedback',
    note_id: noteId,
    ...updates,
  });
  return result.data;
};

export const resolveNote = async (
  noteId: string,
  resolvedBy: string
): Promise<MentorNote> => {
  const result = await apiPost<any>('/college-admin/mentors', {
    action: 'resolve-note',
    note_id: noteId,
    resolved_by: resolvedBy,
  });
  return result.data;
};

export const escalateNote = async (
  noteId: string,
  escalationReason: string,
  escalatedBy: string
): Promise<MentorNote> => {
  const result = await apiPost<any>('/college-admin/mentors', {
    action: 'escalate-note',
    note_id: noteId,
    escalation_reason: escalationReason,
    escalated_by: escalatedBy,
  });
  return result.data;
};

export const getPendingFollowUps = async (mentorId: string) => {
  const result = await apiPost<any>('/college-admin/mentors', {
    action: 'get-pending-follow-ups',
    mentor_id: mentorId,
  });
  return result.data || [];
};

export const getNoteConversation = async (noteId: string) => {
  const result = await apiPost<any>('/college-admin/mentors', {
    action: 'get-note-conversation',
    id: noteId,
  });
  return result.data;
};
