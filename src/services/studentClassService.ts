import { supabase } from '../lib/supabaseClient';

/**
 * Student Class Service
 * Handles all database operations for student's class view
 */

export interface ClassInfo {
  id: string;
  name: string;
  grade: string;
  section: string;
  academic_year: string;
  max_students: number;
  current_students: number;
  school_id: string;
  school_name?: string;
  educator_name?: string;
  educator_email?: string;
}

export interface Classmate {
  id: string;
  name: string;
  email: string;
  profilePicture?: string;
}

export interface TimetableSlot {
  id: string;
  day_of_week: number;
  period_number: number;
  start_time: string;
  end_time: string;
  subject_name: string;
  room_number?: string;
  educator_name?: string;
}

/**
 * Get student's class information
 */
export const getStudentClassInfo = async (studentId: string): Promise<ClassInfo | null> => {
  try {
    // First get student's school_class_id
    const { data: student, error: studentError } = await supabase
      .from('students')
      .select('school_class_id, school_id')
      .eq('id', studentId)
      .single();

    if (studentError || !student?.school_class_id) {
      console.log('Student not assigned to a class');
      return null;
    }

    // Get class details with school info
    const { data: classData, error: classError } = await supabase
      .from('school_classes')
      .select(`
        id,
        name,
        grade,
        section,
        academic_year,
        max_students,
        current_students,
        school_id,
        metadata,
        organizations!school_id (name)
      `)
      .eq('id', student.school_class_id)
      .single();

    if (classError) throw classError;

    // Get educator info from class assignments
    const { data: educatorAssignment } = await supabase
      .from('school_educator_class_assignments')
      .select(`
        school_educators (
          first_name,
          last_name,
          email
        )
      `)
      .eq('class_id', student.school_class_id)
      .eq('is_primary', true)
      .maybeSingle();

    const educator = educatorAssignment?.school_educators as unknown as { first_name: string; last_name: string; email: string } | null;
    const school = classData.organizations as unknown as { name: string } | null;

    return {
      id: classData.id,
      name: classData.name,
      grade: classData.grade,
      section: classData.section,
      academic_year: classData.academic_year,
      max_students: classData.max_students,
      current_students: classData.current_students,
      school_id: classData.school_id,
      school_name: school?.name,
      educator_name: educator ? `${educator.first_name} ${educator.last_name}` : undefined,
      educator_email: educator?.email
    };
  } catch (error) {
    console.error('Error fetching class info:', error);
    throw error;
  }
};

/**
 * Get classmates (students in the same class)
 */
export const getClassmates = async (classId: string, currentStudentId: string): Promise<Classmate[]> => {
  try {
    const { data, error } = await supabase
      .from('students')
      .select('id, name, email, profilePicture')
      .eq('school_class_id', classId)
      .eq('is_deleted', false)
      .neq('id', currentStudentId)
      .order('name');

    if (error) throw error;
    return data || [];
  } catch (error) {
    console.error('Error fetching classmates:', error);
    throw error;
  }
};

/**
 * Get class timetable
 */
export const getClassTimetable = async (classId: string): Promise<TimetableSlot[]> => {
  try {
    const { data, error } = await supabase
      .from('timetable_slots')
      .select(`
        id,
        day_of_week,
        period_number,
        start_time,
        end_time,
        subject_name,
        room_number,
        school_educators (
          first_name,
          last_name
        )
      `)
      .eq('class_id', classId)
      .order('day_of_week')
      .order('period_number');

    if (error) throw error;

    return (data || []).map(slot => {
      const educator = slot.school_educators as unknown as { first_name: string; last_name: string } | null;
      return {
        id: slot.id,
        day_of_week: slot.day_of_week,
        period_number: slot.period_number,
        start_time: slot.start_time,
        end_time: slot.end_time,
        subject_name: slot.subject_name,
        room_number: slot.room_number,
        educator_name: educator ? `${educator.first_name} ${educator.last_name}` : undefined
      };
    });
  } catch (error) {
    console.error('Error fetching timetable:', error);
    throw error;
  }
};

/**
 * Get today's schedule for the class
 */
export const getTodaySchedule = async (classId: string): Promise<TimetableSlot[]> => {
  const today = new Date().getDay(); // 0 = Sunday, 1 = Monday, etc.
  const dayOfWeek = today === 0 ? 7 : today; // Convert to 1-7 format

  try {
    const { data, error } = await supabase
      .from('timetable_slots')
      .select(`
        id,
        day_of_week,
        period_number,
        start_time,
        end_time,
        subject_name,
        room_number,
        school_educators (
          first_name,
          last_name
        )
      `)
      .eq('class_id', classId)
      .eq('day_of_week', dayOfWeek)
      .order('period_number');

    if (error) throw error;

    return (data || []).map(slot => {
      const educator = slot.school_educators as unknown as { first_name: string; last_name: string } | null;
      return {
        id: slot.id,
        day_of_week: slot.day_of_week,
        period_number: slot.period_number,
        start_time: slot.start_time,
        end_time: slot.end_time,
        subject_name: slot.subject_name,
        room_number: slot.room_number,
        educator_name: educator ? `${educator.first_name} ${educator.last_name}` : undefined
      };
    });
  } catch (error) {
    console.error('Error fetching today schedule:', error);
    throw error;
  }
};
