import { supabase } from "@/shared/api/supabase";
import { getLogger } from "@/shared/config/logging";

const logger = getLogger("mentor-allocation-service");

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
    logger.error('Error fetching mentor periods', error as Error, { collegeId });
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
    logger.error('Error fetching mentors', error as Error, { collegeId });
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

// Get all learners for a college - simplified direct fetch
export const getLearners = async (collegeId: string): Promise<Learner[]> => {
  const { data, error } = await supabase
    .from('learners')
    .select('*')
    .eq('college_id', collegeId);

  if (error) {
    logger.error('Error fetching learners', error as Error, { collegeId });
    throw error;
  }

  return (data || []).map(learner => {
    // Calculate batch from enrollment date or expected graduation
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
      // Default batch based on current year and typical 4-year program
      const currentYear = new Date().getFullYear();
      batch = `${currentYear - 2}-${currentYear + 2}`;
    }

    // Determine if learner is at risk based on CGPA
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
      // Computed fields
      program_name: learner.course_name || learner.branch_field || '',
      department_name: learner.branch_field || '',
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
    .from('college_mentor_learner_allocations')
    .select(`
      *,
      college_mentor_periods!inner (
        college_id
      )
    `)
    .eq('college_mentor_periods.college_id', collegeId)
    .in('status', ['active', 'pending']); // Only fetch active and pending allocations

  if (error) {
    logger.error('Error fetching mentor allocations', error as Error, { collegeId });
    throw error;
  }

  return data || [];
};

// Find allocation ID for a specific mentor-learner pair
export const findAllocationId = async (
  mentorId: string, 
  learnerId: string, 
  status: string = 'active'
): Promise<string | null> => {
  const { data, error } = await supabase
    .from('college_mentor_learner_allocations')
    .select('id')
    .eq('mentor_id', mentorId)
    .eq('learner_id', learnerId)
    .eq('status', status)
    .order('created_at', { ascending: false })
    .limit(1)
    .maybeSingle();

  if (error) {
    logger.error('Error finding allocation ID', error as Error, { mentorId, learnerId, status });
    return null;
  }

  return data?.id || null;
};

// Get mentor notes for a college
export const getMentorNotes = async (collegeId: string): Promise<MentorNote[]> => {
  // First, get all allocation IDs for this college
  const { data: allocations, error: allocError } = await supabase
    .from('college_mentor_learner_allocations')
    .select(`
      id,
      college_mentor_periods!inner (
        college_id
      )
    `)
    .eq('college_mentor_periods.college_id', collegeId);

  if (allocError) {
    logger.error('Error fetching allocations for mentor notes', allocError as Error, { collegeId });
    throw allocError;
  }

  if (!allocations || allocations.length === 0) {
    return [];
  }

  const allocationIds = allocations.map(a => a.id);

  // Now get notes for these allocations
  const { data, error } = await supabase
    .from('college_mentor_notes')
    .select('*')
    .in('allocation_id', allocationIds);

  if (error) {
    logger.error('Error fetching mentor notes', error as Error, { collegeId, allocationCount: allocationIds.length });
    throw error;
  }

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
    logger.error('Error creating mentor period', error as Error, { periodName: period.name, collegeId: period.college_id });
    throw error;
  }

  return data;
};

// Create mentor allocations
export const createMentorAllocations = async (
  allocations: Omit<MentorAllocation, 'id' | 'created_at'>[]
): Promise<MentorAllocation[]> => {
  // Check for existing active or pending allocations before inserting
  const learnerIds = allocations.map(a => a.learner_id);
  const { data: existing } = await supabase
    .from('college_mentor_learner_allocations')
    .select('learner_id, status, mentor_id')
    .in('learner_id', learnerIds)
    .in('status', ['active', 'pending']);

  if (existing && existing.length > 0) {
    // Filter out learners that are being re-allocated to the same mentor
    const conflictinglearners = existing.filter(e => {
      const newAllocation = allocations.find(a => a.learner_id === e.learner_id);
      // Only consider it a conflict if it's a different mentor
      return newAllocation && newAllocation.mentor_id !== e.mentor_id;
    });

    if (conflictinglearners.length > 0) {
      const conflictingIds = conflictinglearners.map(e => e.learner_id);
      throw new Error(`Some learners already have active allocations with different mentors: ${conflictingIds.join(', ')}`);
    }
  }

  const { data, error } = await supabase
    .from('college_mentor_learner_allocations')
    .insert(allocations)
    .select();

  if (error) {
    logger.error('Error creating mentor allocations', error as Error, { allocationCount: allocations.length });
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
    logger.error('Error creating mentor note', error as Error, { allocationId: note.allocation_id, mentorId: note.mentor_id });
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
    .from('college_mentor_learner_allocations')
    .update(updates)
    .eq('id', id)
    .select()
    .single();

  if (error) {
    logger.error('Error updating mentor allocation', error as Error, { allocationId: id });
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
    logger.error('Error updating mentor period', error as Error, { periodId });
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
    logger.error('Error fetching departments', error as Error, { collegeId });
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
    logger.error('Error fetching programs', error as Error, { collegeId });
    throw error;
  }

  return (data || []).map(program => ({
    id: program.id,
    name: program.name,
    code: program.code,
    department_name: (program.departments as any)?.name || '',
  }));
};


// Update mentor note with educator response (ONE-TIME ONLY)
export const updateMentorNoteResponse = async (
  noteId: string,
  updates: {
    educator_response: string;
    action_taken?: string;
    next_steps?: string;
    last_updated_by: string;
  }
): Promise<MentorNote> => {
  // First, fetch the current note to validate
  const { data: currentNote, error: fetchError } = await supabase
    .from('college_mentor_notes')
    .select('*')
    .eq('id', noteId)
    .single();

  if (fetchError) {
    logger.error('Error fetching note for validation', fetchError as Error, { noteId });
    throw new Error('Failed to fetch note for validation');
  }

  // Validation 1: Check if status is 'pending'
  if (currentNote.status !== 'pending') {
    throw new Error(`Cannot respond: Note status must be 'pending' (current: '${currentNote.status}')`);
  }

  // Validation 2: Check if response already exists
  if (currentNote.educator_response) {
    throw new Error('Cannot respond: Response already submitted and is read-only');
  }

  // Update with auto-status change to 'acknowledged'
  const { data, error } = await supabase
    .from('college_mentor_notes')
    .update({
      educator_response: updates.educator_response,
      action_taken: updates.action_taken,
      next_steps: updates.next_steps,
      status: 'acknowledged', // Auto-update status
      last_updated_by: updates.last_updated_by,
      last_updated_at: new Date().toISOString(),
    })
    .eq('id', noteId)
    .select()
    .single();

  if (error) {
    logger.error('Error updating mentor note response', error as Error, { noteId });
    throw error;
  }

  return data;
};

// Update mentor note with admin feedback (ONLY when acknowledged)
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
  // First, fetch the current note to validate
  const { data: currentNote, error: fetchError } = await supabase
    .from('college_mentor_notes')
    .select('*')
    .eq('id', noteId)
    .single();

  if (fetchError) {
    logger.error('Error fetching note for validation', fetchError as Error, { noteId });
    throw new Error('Failed to fetch note for validation');
  }

  // Validation: Check if status is 'acknowledged'
  if (currentNote.status !== 'acknowledged') {
    throw new Error(`Cannot give feedback: Note must be in 'acknowledged' status (current: '${currentNote.status}')`);
  }

  // Update with auto-status change to 'in_progress'
  const { data, error } = await supabase
    .from('college_mentor_notes')
    .update({
      admin_feedback: updates.admin_feedback,
      priority: updates.priority,
      follow_up_required: updates.follow_up_required,
      follow_up_date: updates.follow_up_date,
      status: 'in_progress', // Auto-update status
      last_updated_by: updates.last_updated_by,
      last_updated_at: new Date().toISOString(),
    })
    .eq('id', noteId)
    .select()
    .single();

  if (error) {
    logger.error('Error updating mentor note feedback', error as Error, { noteId });
    throw error;
  }

  return data;
};

// Mark note as resolved (ONLY when in_progress)
export const resolveNote = async (
  noteId: string,
  resolvedBy: string
): Promise<MentorNote> => {
  // First, fetch the current note to validate
  const { data: currentNote, error: fetchError } = await supabase
    .from('college_mentor_notes')
    .select('*')
    .eq('id', noteId)
    .single();

  if (fetchError) {
    logger.error('Error fetching note for validation', fetchError as Error, { noteId });
    throw new Error('Failed to fetch note for validation');
  }

  // Validation: Check if status is 'in_progress'
  if (currentNote.status !== 'in_progress') {
    throw new Error(`Cannot resolve: Note must be in 'in_progress' status (current: '${currentNote.status}')`);
  }

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
    logger.error('Error resolving mentor note', error as Error, { noteId });
    throw error;
  }

  return data;
};

// Escalate note (CAN be done at any time)
export const escalateNote = async (
  noteId: string,
  escalationReason: string,
  escalatedBy: string
): Promise<MentorNote> => {
  const { data, error } = await supabase
    .from('college_mentor_notes')
    .update({
      status: 'escalated',
      admin_feedback: escalationReason,
      last_updated_by: escalatedBy,
      last_updated_at: new Date().toISOString(),
    })
    .eq('id', noteId)
    .select()
    .single();

  if (error) {
    logger.error('Error escalating mentor note', error as Error, { noteId });
    throw error;
  }

  return data;
};

// Get pending follow-ups for a mentor
export const getPendingFollowUps = async (mentorId: string) => {
  const { data, error } = await supabase
    .rpc('get_pending_follow_ups', { p_mentor_id: mentorId });

  if (error) {
    logger.error('Error fetching pending follow-ups', error as Error, { mentorId });
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
    logger.error('Error fetching note conversation', error as Error, { noteId });
    throw error;
  }

  return data;
};
