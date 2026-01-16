import { supabase } from "@/utils/supabase";

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
  student_id: string;
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
  student_id: string;
  title?: string;
  note_text: string;
  outcome?: string;
  intervention_type: 'academic' | 'personal' | 'career' | 'attendance' | 'behavioral' | 'financial' | 'other';
  status: 'pending' | 'acknowledged' | 'in_progress' | 'action_taken' | 'completed' | 'escalated'; // Workflow: pending → acknowledged → in_progress → action_taken → completed
  is_private: boolean;
  note_date: string;
  created_at: string;
  // Enhanced fields for 2-way communication
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

export interface Student {
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
  student_type?: string;
  user_id?: string;
  // Computed fields
  program_name?: string;
  department_name?: string;
  batch?: string;
  at_risk?: boolean;
  risk_factors?: string[];
  last_interaction?: string;
  intervention_count?: number;
}

// Get all mentor periods for a college
export const getMentorPeriods = async (collegeId: string): Promise<MentorPeriod[]> => {
  const { data, error } = await supabase
    .from('college_mentor_periods')
    .select('*')
    .eq('college_id', collegeId)
    .order('created_at', { ascending: false });

  if (error) {
    console.error('Error fetching mentor periods:', error);
    throw error;
  }

  return data || [];
};

// Get all mentors (lecturers) for a college
export const getMentors = async (collegeId: string): Promise<Mentor[]> => {
  const { data, error } = await supabase
    .from('college_lecturers')
    .select('*')
    .eq('collegeId', collegeId)
    .eq('accountStatus', 'active');

  if (error) {
    console.error('Error fetching mentors:', error);
    throw error;
  }

  return (data || []).map(mentor => ({
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

// Get all students for a college - simplified direct fetch
export const getStudents = async (collegeId: string): Promise<Student[]> => {
  console.log('🔍 [getStudents] Fetching students for college:', collegeId);
  
  const { data, error } = await supabase
    .from('students')
    .select('*')
    .eq('college_id', collegeId);

  if (error) {
    console.error('❌ [getStudents] Error fetching students:', error);
    throw error;
  }

  console.log('✅ [getStudents] Raw student data:', data?.length || 0, 'students found');

  return (data || []).map(student => {
    // Calculate batch from enrollment date or expected graduation
    let batch = '';
    if (student.enrollmentDate && student.expectedGraduationDate) {
      const enrollYear = new Date(student.enrollmentDate).getFullYear();
      const gradYear = new Date(student.expectedGraduationDate).getFullYear();
      batch = `${enrollYear}-${gradYear}`;
    } else if (student.enrollment_date && student.expected_graduation_date) {
      const enrollYear = new Date(student.enrollment_date).getFullYear();
      const gradYear = new Date(student.expected_graduation_date).getFullYear();
      batch = `${enrollYear}-${gradYear}`;
    } else {
      // Default batch based on current year and typical 4-year program
      const currentYear = new Date().getFullYear();
      batch = `${currentYear - 2}-${currentYear + 2}`;
    }

    // Determine if student is at risk based on CGPA
    const cgpa = parseFloat(student.currentCgpa || student.current_cgpa || '0');
    const atRisk = cgpa < 7.0 || (student.semester && student.semester > 4 && cgpa < 7.5);
    
    const riskFactors = [];
    if (cgpa < 6.5) riskFactors.push('Low CGPA');
    if (cgpa < 7.0 && student.semester && student.semester > 2) riskFactors.push('Academic Struggles');

    console.log('📊 [getStudents] Processing student:', {
      id: student.id,
      name: student.name,
      cgpa: cgpa,
      semester: student.semester,
      atRisk: atRisk,
      batch: batch
    });

    return {
      id: student.id,
      name: student.name || '',
      email: student.email,
      roll_number: student.roll_number || student.registration_number || student.enrollmentNumber || '',
      semester: student.semester || 1,
      current_cgpa: cgpa,
      college_id: student.college_id,
      program_id: student.program_id,
      program_section_id: student.program_section_id,
      contact_number: student.contactNumber || student.contact_number,
      address: student.address,
      date_of_birth: student.dateOfBirth || student.date_of_birth,
      gender: student.gender,
      enrollment_date: student.enrollmentDate || student.enrollment_date,
      expected_graduation_date: student.expectedGraduationDate || student.expected_graduation_date,
      student_type: student.student_type,
      user_id: student.user_id,
      // Computed fields
      program_name: student.course_name || student.branch_field || '',
      department_name: student.branch_field || '',
      batch,
      at_risk: atRisk,
      risk_factors: riskFactors,
      last_interaction: undefined, // Will be computed from mentor notes
      intervention_count: 0, // Will be computed from mentor notes
    };
  });
};

// Get mentor allocations for a college
export const getMentorAllocations = async (collegeId: string): Promise<MentorAllocation[]> => {
  const { data, error } = await supabase
    .from('college_mentor_student_allocations')
    .select(`
      *,
      college_mentor_periods!inner (
        college_id
      )
    `)
    .eq('college_mentor_periods.college_id', collegeId);

  if (error) {
    console.error('Error fetching mentor allocations:', error);
    throw error;
  }

  return data || [];
};

// Find allocation ID for a specific mentor-student pair
export const findAllocationId = async (
  mentorId: string, 
  studentId: string, 
  status: string = 'active'
): Promise<string | null> => {
  const { data, error } = await supabase
    .from('college_mentor_student_allocations')
    .select('id')
    .eq('mentor_id', mentorId)
    .eq('student_id', studentId)
    .eq('status', status)
    .order('created_at', { ascending: false })
    .limit(1)
    .single();

  if (error) {
    console.error('Error finding allocation ID:', error);
    return null;
  }

  return data?.id || null;
};

// Get mentor notes for a college
export const getMentorNotes = async (collegeId: string): Promise<MentorNote[]> => {
  console.log('🔍 [getMentorNotes] Fetching notes for college:', collegeId);
  
  // First, get all allocation IDs for this college
  const { data: allocations, error: allocError } = await supabase
    .from('college_mentor_student_allocations')
    .select(`
      id,
      college_mentor_periods!inner (
        college_id
      )
    `)
    .eq('college_mentor_periods.college_id', collegeId);

  if (allocError) {
    console.error('❌ [getMentorNotes] Error fetching allocations:', allocError);
    throw allocError;
  }

  if (!allocations || allocations.length === 0) {
    console.log('⚠️ [getMentorNotes] No allocations found for college');
    return [];
  }

  const allocationIds = allocations.map(a => a.id);
  console.log('🔍 [getMentorNotes] Found allocation IDs:', allocationIds.length);

  // Now get notes for these allocations
  const { data, error } = await supabase
    .from('college_mentor_notes')
    .select('*')
    .in('allocation_id', allocationIds);

  if (error) {
    console.error('❌ [getMentorNotes] Error fetching mentor notes:', error);
    throw error;
  }

  console.log('✅ [getMentorNotes] Found notes:', data?.length || 0);
  return data || [];
};

// Create a new mentor period
export const createMentorPeriod = async (period: Omit<MentorPeriod, 'id' | 'created_at'>): Promise<MentorPeriod> => {
  const { data, error } = await supabase
    .from('college_mentor_periods')
    .insert([period])
    .select()
    .single();

  if (error) {
    console.error('Error creating mentor period:', error);
    throw error;
  }

  return data;
};

// Create mentor allocations
export const createMentorAllocations = async (
  allocations: Omit<MentorAllocation, 'id' | 'created_at'>[]
): Promise<MentorAllocation[]> => {
  const { data, error } = await supabase
    .from('college_mentor_student_allocations')
    .insert(allocations)
    .select();

  if (error) {
    console.error('Error creating mentor allocations:', error);
    throw error;
  }

  return data || [];
};

// Create a mentor note
export const createMentorNote = async (note: Omit<MentorNote, 'id' | 'created_at'>): Promise<MentorNote> => {
  const { data, error } = await supabase
    .from('college_mentor_notes')
    .insert([note])
    .select()
    .single();

  if (error) {
    console.error('Error creating mentor note:', error);
    throw error;
  }

  return data;
};

// Update mentor allocation status
export const updateMentorAllocation = async (
  id: string, 
  updates: Partial<MentorAllocation>
): Promise<MentorAllocation> => {
  const { data, error } = await supabase
    .from('college_mentor_student_allocations')
    .update(updates)
    .eq('id', id)
    .select()
    .single();

  if (error) {
    console.error('Error updating mentor allocation:', error);
    throw error;
  }

  return data;
};

// Update mentor period configuration
export const updateMentorPeriod = async (
  periodId: string, 
  updates: Partial<MentorPeriod>
): Promise<MentorPeriod> => {
  const { data, error } = await supabase
    .from('college_mentor_periods')
    .update(updates)
    .eq('id', periodId)
    .select()
    .single();

  if (error) {
    console.error('Error updating mentor period:', error);
    throw error;
  }

  return data;
};

// Get departments for a college
export const getDepartments = async (collegeId: string): Promise<Array<{id: string; name: string}>> => {
  const { data, error } = await supabase
    .from('departments')
    .select('id, name')
    .eq('college_id', collegeId);

  if (error) {
    console.error('Error fetching departments:', error);
    throw error;
  }

  return data || [];
};

// Get programs for a college
export const getPrograms = async (collegeId: string): Promise<Array<{id: string; name: string; code: string; department_name: string}>> => {
  const { data, error } = await supabase
    .from('programs')
    .select(`
      id,
      name,
      code,
      departments:department_id (
        name
      )
    `)
    .eq('departments.college_id', collegeId);

  if (error) {
    console.error('Error fetching programs:', error);
    throw error;
  }

  return (data || []).map(program => ({
    id: program.id,
    name: program.name,
    code: program.code,
    department_name: (program.departments as any)?.name || '',
  }));
};


// Update mentor note with educator response
export const updateMentorNoteResponse = async (
  noteId: string,
  updates: {
    educator_response?: string;
    action_taken?: string;
    next_steps?: string;
    status?: string;
    last_updated_by: string;
  }
): Promise<MentorNote> => {
  const { data, error } = await supabase
    .from('college_mentor_notes')
    .update({
      ...updates,
      last_updated_at: new Date().toISOString(),
    })
    .eq('id', noteId)
    .select()
    .single();

  if (error) {
    console.error('Error updating mentor note response:', error);
    throw error;
  }

  return data;
};

// Update mentor note with admin feedback
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
  const { data, error } = await supabase
    .from('college_mentor_notes')
    .update({
      ...updates,
      last_updated_at: new Date().toISOString(),
    })
    .eq('id', noteId)
    .select()
    .single();

  if (error) {
    console.error('Error updating mentor note feedback:', error);
    throw error;
  }

  return data;
};

// Mark note as resolved
export const resolveNote = async (
  noteId: string,
  resolvedBy: string
): Promise<MentorNote> => {
  const { data, error } = await supabase
    .from('college_mentor_notes')
    .update({
      status: 'completed',
      resolved_at: new Date().toISOString(),
      resolved_by: resolvedBy,
      last_updated_at: new Date().toISOString(),
    })
    .eq('id', noteId)
    .select()
    .single();

  if (error) {
    console.error('Error resolving mentor note:', error);
    throw error;
  }

  return data;
};

// Get pending follow-ups for a mentor
export const getPendingFollowUps = async (mentorId: string) => {
  const { data, error } = await supabase
    .rpc('get_pending_follow_ups', { p_mentor_id: mentorId });

  if (error) {
    console.error('Error fetching pending follow-ups:', error);
    throw error;
  }

  return data || [];
};

// Get conversation history for a note
export const getNoteConversation = async (noteId: string) => {
  const { data, error } = await supabase
    .from('mentor_note_conversations')
    .select('*')
    .eq('id', noteId)
    .single();

  if (error) {
    console.error('Error fetching note conversation:', error);
    throw error;
  }

  return data;
};
