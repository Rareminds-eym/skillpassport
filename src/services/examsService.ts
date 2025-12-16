import { supabase } from '../lib/supabaseClient';

// Helper function to get current user ID
const getCurrentUserId = async (): Promise<string> => {
  const { data: { user } } = await supabase.auth.getUser();
  return user?.id || 'system';
};

export interface Assessment {
  id: string;
  assessment_code: string;
  type: string;
  academic_year: string;
  department_id?: string;
  program_id?: string;
  semester: number;
  course_id: string;
  course_name: string;
  course_code: string;
  duration_minutes: number;
  total_marks: number;
  pass_marks: number;
  weightage?: number;
  instructions?: string;
  syllabus_coverage?: any;
  question_paper_pattern?: any;
  status?: string;
  is_published?: boolean;
  is_locked?: boolean;
  created_by?: string;
  approved_by?: string;
  faculty_id?: string;
  college_id?: string;
  // New school-specific fields
  school_id?: string;
  teacher_id?: string;
  // New targeting system
  target_classes?: {
    type: 'single_section' | 'whole_grade' | 'multiple_sections';
    grade: string;
    sections: string[] | null;
    class_ids: string[];
  };
  // Date range fields
  start_date?: string;
  end_date?: string;
  created_at?: string;
  updated_at?: string;
  approved_at?: string;
}

export interface ExamTimetable {
  id: string;
  assessment_id: string;
  course_name: string;
  course_code: string;
  exam_date: string;
  start_time: string;
  end_time: string;
  duration_minutes: number;
  room: string;
  building?: string;
  capacity?: number;
  batch_section?: string;
  invigilators: string[];
  chief_invigilator?: string;
  status: string;
  special_instructions?: string;
  // Professional schema fields
  subject_id?: string;
  school_id?: string;
  class_id?: string;
}

export interface ExamRoom {
  id: string;
  room_code: string;
  room_name: string;
  building?: string;
  floor?: string;
  total_capacity: number;
  exam_capacity: number;
  has_projector: boolean;
  has_ac: boolean;
  has_cctv: boolean;
  status: string;
}

export interface MarkEntry {
  id: string;
  assessment_id: string;
  student_id: string;
  subject_id?: string; // Add subject_id field
  marks_obtained?: number;
  total_marks: number;
  percentage?: number;
  grade?: string;
  is_absent: boolean;
  is_exempt: boolean;
  remarks?: string;
  original_marks?: number;
  moderated_by?: string;
  moderation_reason?: string;
  moderation_date?: string;
  entered_by: string;
  entered_at: string;
  is_locked: boolean;
}

export interface Student {
  id: string;
  name: string;
  email: string;
  roll_number?: string;
  admission_number?: string;
  grade?: string;
  section?: string;
  school_id?: string;
  college_id?: string;
  is_deleted?: boolean;
}

export interface SchoolEducator {
  id: string;
  first_name: string;
  last_name: string;
  email: string;
  employee_id?: string;
  specialization?: string;
  subjects_handled: string[];
  designation?: string;
  department?: string;
  account_status: string;
}

export interface CurriculumSubject {
  id: string;
  name: string;
  description?: string;
  is_active: boolean;
  display_order: number;
  school_id?: string;
}

export interface AssessmentType {
  id: string;
  name: string;
  description?: string;
  is_active: boolean;
  school_id?: string;
}

export interface SchoolClass {
  id: string;
  name: string;
  grade: string;
  section?: string;
  academic_year: string;
  max_students?: number;
  current_students?: number;
  school_id: string;
  room_no?: string;
}

class ExamsService {
  // Build target classes object for new targeting system
  async buildTargetClasses(schoolId: string, grade: string, section?: string): Promise<{
    type: 'single_section' | 'whole_grade';
    grade: string;
    sections: string[] | null;
    class_ids: string[];
  }> {
    if (section) {
      // Single section targeting
      const { data: classData, error } = await supabase
        .from('school_classes')
        .select('id')
        .eq('school_id', schoolId)
        .eq('grade', grade)
        .eq('section', section)
        .single();

      if (error) {
        console.error('Error getting class for single section:', error);
        return {
          type: 'single_section' as const,
          grade: grade,
          sections: [section],
          class_ids: []
        };
      }

      return {
        type: 'single_section' as const,
        grade: grade,
        sections: [section],
        class_ids: classData ? [classData.id] : []
      };
    } else {
      // Whole grade targeting - get all sections for this grade
      const { data: classesData, error } = await supabase
        .from('school_classes')
        .select('id, section')
        .eq('school_id', schoolId)
        .eq('grade', grade);

      if (error) {
        console.error('Error getting classes for whole grade:', error);
        return {
          type: 'whole_grade' as const,
          grade: grade,
          sections: null,
          class_ids: []
        };
      }

      return {
        type: 'whole_grade' as const,
        grade: grade,
        sections: null,
        class_ids: classesData?.map(c => c.id) || []
      };
    }
  }

  // Get students by target classes (replaces old methods)
  async getStudentsByTargetClasses(targetClasses: any): Promise<Student[]> {
    if (!targetClasses?.class_ids || targetClasses.class_ids.length === 0) {
      return [];
    }

    const { data, error } = await supabase
      .from('students')
      .select('id, name, email, roll_number, admission_number, grade, section, school_id, college_id')
      .in('school_class_id', targetClasses.class_ids)
      .or('is_deleted.is.null,is_deleted.eq.false');

    if (error) {
      console.error('Error loading students by target classes:', error);
      throw error;
    }

    return data || [];
  }

  // Helper function to get class room from grade/section
  async getClassRoom(schoolId: string, grade: string, section?: string): Promise<string | null> {
    let query = supabase
      .from('school_classes')
      .select('room_no')
      .eq('school_id', schoolId)
      .eq('grade', grade);
    
    if (section) {
      // For specific section, get that section's room
      query = query.eq('section', section);
      const { data, error } = await query.maybeSingle();
      
      if (error) {
        console.error('Error getting class room for section:', error);
        return null;
      }
      
      return data?.room_no || null;
    } else {
      // For whole grade, get all rooms and return the first available one
      const { data, error } = await query.limit(1);
      
      if (error) {
        console.error('Error getting class room for grade:', error);
        return null;
      }
      
      // Return first room or a generic name for whole grade
      return data?.[0]?.room_no || `Grade ${grade} Hall`;
    }
  }
  // Assessment Types
  async getAssessmentTypes(schoolId?: string) {
    let query = supabase
      .from('assessment_types')
      .select('*')
      .eq('is_active', true);
    
    if (schoolId) {
      query = query.eq('school_id', schoolId);
    }
    
    const { data, error } = await query.order('name');
    
    if (error) throw error;
    return data as AssessmentType[];
  }

  // Subjects
  async getSubjects(schoolId?: string) {
    let query = supabase
      .from('curriculum_subjects')
      .select('*')
      .eq('is_active', true);
    
    if (schoolId) {
      query = query.eq('school_id', schoolId);
    }
    
    const { data, error } = await query.order('display_order', { ascending: true });
    
    if (error) throw error;
    return data as CurriculumSubject[];
  }

  // School Classes (Grades/Sections)
  async getSchoolClasses(schoolId: string, academicYear?: string) {
    let query = supabase
      .from('school_classes')
      .select('id, name, grade, section, academic_year, max_students, current_students, school_id, room_no')
      .eq('school_id', schoolId);
    
    if (academicYear) {
      query = query.eq('academic_year', academicYear);
    }
    
    const { data, error } = await query.order('grade', { ascending: true });
    
    if (error) throw error;
    return data as SchoolClass[];
  }

  // Teachers/Educators
  async getEducators(schoolId?: string) {
    let query = supabase
      .from('school_educators')
      .select('*')
      .eq('account_status', 'active');
    
    if (schoolId) {
      query = query.eq('school_id', schoolId);
    }
    
    const { data, error } = await query.order('first_name');
    
    if (error) throw error;
    return data as SchoolEducator[];
  }

  // Exam Rooms
  async getExamRooms(schoolId?: string, collegeId?: string) {
    let query = supabase
      .from('exam_rooms')
      .select('*')
      .eq('status', 'active');
    
    if (schoolId) {
      query = query.eq('school_id', schoolId);
    } else if (collegeId) {
      query = query.eq('college_id', collegeId);
    }
    
    const { data, error } = await query.order('room_name');
    
    if (error) throw error;
    return data as ExamRoom[];
  }

  // Students
  async getStudents(schoolId?: string, collegeId?: string, grade?: string, section?: string) {
    let query = supabase
      .from('students')
      .select('id, name, email, roll_number, admission_number, grade, section, school_id, college_id')
      .or('is_deleted.is.null,is_deleted.eq.false'); // Handle null values properly
    
    if (schoolId) {
      query = query.eq('school_id', schoolId);
    } else if (collegeId) {
      query = query.eq('college_id', collegeId);
    }
    
    if (grade) {
      query = query.eq('grade', grade);
    }
    
    // Handle section filtering with fallback logic
    if (section && section.trim() !== '') {
      // Use OR condition to match either the exact section OR null section
      // This handles cases where exam has section "A" but students have section null
      query = query.or(`section.eq.${section},section.is.null`);
    }
    
    const { data, error } = await query.order('roll_number');
    
    if (error) throw error;
    
    return data as Student[];
  }

  // Get students by class_id (better approach)
  async getStudentsByClassId(classId: string) {
    const { data, error } = await supabase
      .from('students')
      .select('id, name, email, roll_number, admission_number, grade, section, school_id, college_id')
      .eq('school_class_id', classId) // Assuming students table has school_class_id field
      .or('is_deleted.is.null,is_deleted.eq.false')
      .order('roll_number');
    
    if (error) throw error;
    return data as Student[];
  }

  // Get all available rooms for a school (from multiple sources)
  async getAllSchoolRooms(schoolId: string) {
    try {
      // Get rooms from school_classes
      const { data: classRooms, error: classError } = await supabase
        .from('school_classes')
        .select('room_no, grade, section')
        .eq('school_id', schoolId)
        .not('room_no', 'is', null);

      // Get rooms from exam_rooms
      const { data: examRooms, error: examError } = await supabase
        .from('exam_rooms')
        .select('room_name, room_code')
        .eq('school_id', schoolId)
        .eq('status', 'active');

      if (classError && examError) {
        throw new Error('Failed to fetch rooms from both sources');
      }

      // Combine and deduplicate rooms
      const allRooms = new Map();

      // Add class rooms
      if (classRooms) {
        classRooms.forEach(room => {
          if (room.room_no) {
            allRooms.set(room.room_no, {
              id: `class_${room.room_no}`,
              name: room.room_no,
              type: 'class_room',
              description: `Class ${room.grade}${room.section ? `-${room.section}` : ''} Room`
            });
          }
        });
      }

      // Add exam rooms
      if (examRooms) {
        examRooms.forEach(room => {
          if (room.room_name) {
            allRooms.set(room.room_name, {
              id: `exam_${room.room_name}`,
              name: room.room_name,
              type: 'exam_room',
              description: room.room_code ? `${room.room_name} (${room.room_code})` : room.room_name
            });
          }
        });
      }

      // Convert to array and sort
      return Array.from(allRooms.values()).sort((a, b) => a.name.localeCompare(b.name));
    } catch (error) {
      console.error('Error fetching school rooms:', error);
      return [];
    }
  }

  // Assessments CRUD
  async getAssessments(schoolId?: string, collegeId?: string) {
    let query = supabase
      .from('assessments')
      .select('*');
    
    // Use proper fields for school vs college
    if (schoolId) {
      query = query.eq('school_id', schoolId);
    } else if (collegeId) {
      query = query.eq('college_id', collegeId);
    }
    
    const { data, error } = await query.order('created_at', { ascending: false });
    
    if (error) throw error;
    return data as Assessment[];
  }

  async createAssessment(assessment: Partial<Assessment>) {
    // Ensure required fields are present
    const assessmentData = {
      ...assessment,
      semester: assessment.semester || 1,
      course_id: assessment.course_id, // Don't generate - let it be null for school assessments
      status: assessment.status || 'draft',
      is_published: assessment.is_published || false,
      is_locked: assessment.is_locked || false,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    };

    const { data, error } = await supabase
      .from('assessments')
      .insert(assessmentData)
      .select()
      .single();
    
    if (error) throw error;
    return data as Assessment;
  }

  async updateAssessment(id: string, updates: Partial<Assessment>) {
    const { data, error } = await supabase
      .from('assessments')
      .update(updates)
      .eq('id', id)
      .select()
      .single();
    
    if (error) throw error;
    return data as Assessment;
  }

  async deleteAssessment(id: string) {
    const { error } = await supabase
      .from('assessments')
      .delete()
      .eq('id', id);
    
    if (error) throw error;
  }

  // Exam Timetable
  async getExamTimetable(assessmentId: string) {
    const { data, error } = await supabase
      .from('exam_timetable')
      .select('*')
      .eq('assessment_id', assessmentId)
      .order('exam_date', { ascending: true });
    
    if (error) throw error;
    return data as ExamTimetable[];
  }

  async createTimetableEntry(entry: Partial<ExamTimetable>) {
    const { data, error } = await supabase
      .from('exam_timetable')
      .insert(entry)
      .select()
      .single();
    
    if (error) throw error;
    return data as ExamTimetable;
  }

  async updateTimetableEntry(id: string, updates: Partial<ExamTimetable>) {
    const { data, error } = await supabase
      .from('exam_timetable')
      .update(updates)
      .eq('id', id)
      .select()
      .single();
    
    if (error) throw error;
    return data as ExamTimetable;
  }

  async deleteTimetableEntry(id: string) {
    const { error } = await supabase
      .from('exam_timetable')
      .delete()
      .eq('id', id);
    
    if (error) throw error;
  }

  // Invigilation Assignments
  async getInvigilatorAssignments(examTimetableId?: string) {
    let query = supabase
      .from('invigilator_assignments')
      .select(`
        *,
        exam_timetable!inner(
          id,
          course_name,
          exam_date,
          start_time,
          end_time,
          room
        )
      `);
    
    if (examTimetableId) {
      query = query.eq('exam_timetable_id', examTimetableId);
    }
    
    const { data, error } = await query.order('duty_date', { ascending: true });
    
    if (error) throw error;
    return data;
  }

  async createInvigilatorAssignment(assignment: {
    exam_timetable_id: string;
    invigilator_id: string;
    invigilator_name: string;
    duty_date: string;
    duty_start_time: string;
    duty_end_time: string;
    exam_room_id?: string | null;
    assigned_by?: string;
  }) {
    const { data, error } = await supabase
      .from('invigilator_assignments')
      .insert(assignment)
      .select()
      .single();
    
    if (error) throw error;
    return data;
  }

  async deleteInvigilatorAssignment(id: string) {
    const { error } = await supabase
      .from('invigilator_assignments')
      .delete()
      .eq('id', id);
    
    if (error) throw error;
  }

  // Mark Entries
  async getMarkEntries(assessmentId: string, subjectId?: string) {
    let query = supabase
      .from('mark_entries')
      .select(`
        *,
        students!inner(id, name, roll_number, admission_number),
        mark_moderation_log(
          id,
          moderation_type, 
          moderated_at, 
          approval_status, 
          approved_by, 
          approved_at,
          subject_id,
          requires_approval
        )
      `)
      .eq('assessment_id', assessmentId);
    
    // Filter by subject_id if provided
    if (subjectId) {
      query = query.eq('subject_id', subjectId);
    }
    
    const { data, error } = await query.order('created_at', { ascending: true });
    
    if (error) {
      throw error;
    }
    
    // Sort by roll_number in JavaScript since we can't order by joined table fields directly
    if (data) {
      data.sort((a, b) => {
        const rollA = a.students?.roll_number || a.students?.admission_number || '';
        const rollB = b.students?.roll_number || b.students?.admission_number || '';
        return rollA.localeCompare(rollB, undefined, { numeric: true });
      });
    }
    
    return data;
  }

  async saveMarkEntries(markEntries: Partial<MarkEntry>[]) {
    const { data, error } = await supabase
      .from('mark_entries')
      .upsert(markEntries, {
        onConflict: 'assessment_id,student_id,subject_id',
        ignoreDuplicates: false
      })
      .select();
    
    if (error) throw error;
    return data as MarkEntry[];
  }

  async moderateMarks(markEntryId: string, moderationData: {
    assessment_id: string;
    student_id: string;
    subject_id: string; // Add subject_id parameter
    original_marks: number;
    marks_obtained: number;
    moderation_reason: string;
    moderation_type: string;
    moderated_by: string;
  }) {
    // First, delete any existing moderation logs for this mark entry to prevent duplicates
    const { error: deleteError } = await supabase
      .from('mark_moderation_log')
      .delete()
      .eq('mark_entry_id', markEntryId)
      .eq('assessment_id', moderationData.assessment_id)
      .eq('student_id', moderationData.student_id)
      .eq('subject_id', moderationData.subject_id);

    if (deleteError) {
      // Don't throw here, just continue with the operation
    }

    // Then, insert the new moderation log
    const { error: logError } = await supabase
      .from('mark_moderation_log')
      .insert({
        mark_entry_id: markEntryId,
        assessment_id: moderationData.assessment_id,
        student_id: moderationData.student_id,
        subject_id: moderationData.subject_id, // Include subject_id in the log
        original_marks: moderationData.original_marks,
        moderated_marks: moderationData.marks_obtained,
        difference: moderationData.marks_obtained - moderationData.original_marks,
        moderation_type: moderationData.moderation_type,
        reason: moderationData.moderation_reason,
        moderated_by: moderationData.moderated_by,
        moderator_name: 'Current User', // You might want to get this from auth
        requires_approval: Math.abs(moderationData.marks_obtained - moderationData.original_marks) > (moderationData.original_marks * 0.1),
        moderated_at: new Date().toISOString()
      });

    if (logError) throw logError;

    // Then update the mark entry
    const { data, error } = await supabase
      .from('mark_entries')
      .update({
        original_marks: moderationData.original_marks,
        marks_obtained: moderationData.marks_obtained,
        moderation_reason: moderationData.moderation_reason, // Keep this for backward compatibility
        moderated_by: moderationData.moderated_by,
        moderation_date: new Date().toISOString()
      })
      .eq('id', markEntryId)
      .select()
      .single();
    
    if (error) throw error;
    return data as MarkEntry;
  }

  // Publish Results
  async publishAssessment(assessmentId: string) {
    const currentUserId = await getCurrentUserId();
    
    // Lock all mark entries
    const { error: lockError } = await supabase
      .from('mark_entries')
      .update({ 
        is_locked: true,
        locked_by: currentUserId,
        locked_at: new Date().toISOString()
      })
      .eq('assessment_id', assessmentId);

    if (lockError) throw lockError;

    // Update assessment status
    const { data, error } = await supabase
      .from('assessments')
      .update({ 
        status: 'published',
        is_published: true,
        updated_at: new Date().toISOString()
      })
      .eq('id', assessmentId)
      .select()
      .single();
    
    if (error) throw error;
    return data as Assessment;
  }

  // Statistics
  async getAssessmentStats(schoolId?: string, collegeId?: string) {
    let query = supabase
      .from('assessments')
      .select('status');
    
    // Use proper fields for school vs college
    if (schoolId) {
      query = query.eq('school_id', schoolId);
    } else if (collegeId) {
      query = query.eq('college_id', collegeId);
    }
    
    const { data, error } = await query;
    
    if (error) throw error;
    
    const stats = {
      total: data.length,
      draft: data.filter(a => a.status === 'draft').length,
      scheduled: data.filter(a => a.status === 'scheduled').length,
      ongoing: data.filter(a => a.status === 'ongoing').length,
      marks_pending: data.filter(a => a.status === 'marks_pending').length,
      published: data.filter(a => a.status === 'published').length,
    };
    
    return stats;
  }

  async approveSubjectModeration(assessmentId: string, subjectId: string, approvedBy: string) {
    // First, check what records exist
    const { data: existingRecords, error: checkError } = await supabase
      .from('mark_moderation_log')
      .select('id, approval_status, moderation_type')
      .eq('assessment_id', assessmentId)
      .eq('subject_id', subjectId);
    
    if (checkError) {
      throw checkError;
    }
    
    // Update all moderation log entries for this assessment and subject to approved
    const { data, error } = await supabase
      .from('mark_moderation_log')
      .update({
        approval_status: 'approved',
        approved_by: approvedBy,
        approved_at: new Date().toISOString()
      })
      .eq('assessment_id', assessmentId)
      .eq('subject_id', subjectId)
      .or('approval_status.is.null,approval_status.neq.approved') // Update entries that are null or not already approved
      .select();

    if (error) {
      throw error;
    }

    return data;
  }

  // Clear all moderation data for an assessment and subject (for testing/debugging)
  async clearModerationData(assessmentId: string, subjectId: string) {
    // Clear moderation logs
    const { error: logError } = await supabase
      .from('mark_moderation_log')
      .delete()
      .eq('assessment_id', assessmentId)
      .eq('subject_id', subjectId);

    // Clear moderation fields from mark entries
    const { error: entryError } = await supabase
      .from('mark_entries')
      .update({
        moderation_reason: null,
        moderated_by: null,
        moderation_date: null,
        original_marks: null
      })
      .eq('assessment_id', assessmentId)
      .eq('subject_id', subjectId);

    return { logError, entryError };
  }
}

export const examsService = new ExamsService();