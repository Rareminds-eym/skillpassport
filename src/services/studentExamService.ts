import { supabase } from '../lib/supabaseClient';

/**
 * Student Exam Service
 * Handles exam and result data for students
 */

export interface StudentExam {
  id: string;
  assessment_id: string;
  assessment_code: string;
  type: string;
  course_name: string;
  subject_name: string;
  exam_date: string;
  start_time: string;
  end_time: string;
  duration_minutes: number;
  total_marks: number;
  pass_marks: number;
  room: string;
  status: string;
  instructions?: string;
}

export interface StudentResult {
  id: string;
  assessment_id: string;
  assessment_code: string;
  type: string;
  course_name: string;
  subject_name: string;
  exam_date: string;
  marks_obtained?: number;
  total_marks: number;
  percentage?: number;
  grade?: string;
  is_absent: boolean;
  is_exempt: boolean;
  remarks?: string;
  status: string;
  pass_marks: number;
}

/**
 * Get upcoming and past exams for a student
 */
export const getStudentExams = async (studentId: string): Promise<StudentExam[]> => {
  try {
    // Get student's class info
    const { data: student, error: studentError } = await supabase
      .from('students')
      .select('school_class_id, school_id, grade, section')
      .eq('id', studentId)
      .single();

    if (studentError || !student?.school_class_id) {
      console.log('Student not found or not assigned to a class');
      return [];
    }

    // Get assessments for the student's class
    const { data: assessments, error: assessmentError } = await supabase
      .from('assessments')
      .select(`
        id,
        assessment_code,
        type,
        course_name,
        status,
        total_marks,
        pass_marks,
        duration_minutes,
        instructions,
        target_classes
      `)
      .eq('school_id', student.school_id)
      .in('status', ['scheduled', 'ongoing', 'marks_pending', 'published']);

    if (assessmentError) throw assessmentError;

    // Filter assessments that target this student's class
    const relevantAssessments = (assessments || []).filter(assessment => {
      const targetClasses = assessment.target_classes as any;
      if (!targetClasses?.class_ids) return false;
      return targetClasses.class_ids.includes(student.school_class_id);
    });

    // Get exam timetable for these assessments
    const assessmentIds = relevantAssessments.map(a => a.id);
    if (assessmentIds.length === 0) return [];

    const { data: timetable, error: timetableError } = await supabase
      .from('exam_timetable')
      .select('*')
      .in('assessment_id', assessmentIds)
      .order('exam_date', { ascending: true });

    if (timetableError) throw timetableError;

    // Combine assessment and timetable data
    const exams: StudentExam[] = (timetable || []).map(slot => {
      const assessment = relevantAssessments.find(a => a.id === slot.assessment_id);
      return {
        id: slot.id,
        assessment_id: slot.assessment_id,
        assessment_code: assessment?.assessment_code || '',
        type: assessment?.type || '',
        course_name: slot.course_name || assessment?.course_name || '',
        subject_name: slot.course_name || '',
        exam_date: slot.exam_date,
        start_time: slot.start_time,
        end_time: slot.end_time,
        duration_minutes: slot.duration_minutes || assessment?.duration_minutes || 0,
        total_marks: assessment?.total_marks || 0,
        pass_marks: assessment?.pass_marks || 0,
        room: slot.room || '',
        status: assessment?.status || '',
        instructions: assessment?.instructions
      };
    });

    return exams;
  } catch (error) {
    console.error('Error fetching student exams:', error);
    throw error;
  }
};

/**
 * Get exam results for a student
 */
export const getStudentResults = async (studentId: string): Promise<StudentResult[]> => {
  try {
    // Get student's class info
    const { data: student, error: studentError } = await supabase
      .from('students')
      .select('school_class_id, school_id')
      .eq('id', studentId)
      .single();

    if (studentError || !student?.school_class_id) {
      console.log('Student not found or not assigned to a class');
      return [];
    }

    // Get mark entries for this student
    const { data: markEntries, error: markError } = await supabase
      .from('mark_entries')
      .select(`
        id,
        assessment_id,
        marks_obtained,
        total_marks,
        percentage,
        grade,
        is_absent,
        is_exempt,
        remarks,
        assessments!inner(
          assessment_code,
          type,
          course_name,
          status,
          pass_marks,
          school_id,
          target_classes
        )
      `)
      .eq('student_id', studentId);

    if (markError) throw markError;

    // Filter for published results only and relevant to student's class
    const results: StudentResult[] = (markEntries || [])
      .filter(entry => {
        const assessment = entry.assessments as any;
        if (assessment.status !== 'published') return false;
        if (assessment.school_id !== student.school_id) return false;
        
        const targetClasses = assessment.target_classes as any;
        if (!targetClasses?.class_ids) return false;
        return targetClasses.class_ids.includes(student.school_class_id);
      })
      .map(entry => {
        const assessment = entry.assessments as any;
        return {
          id: entry.id,
          assessment_id: entry.assessment_id,
          assessment_code: assessment.assessment_code || '',
          type: assessment.type || '',
          course_name: assessment.course_name || '',
          subject_name: assessment.course_name || '',
          exam_date: '', // Will be fetched from timetable if needed
          marks_obtained: entry.marks_obtained,
          total_marks: entry.total_marks,
          percentage: entry.percentage,
          grade: entry.grade,
          is_absent: entry.is_absent,
          is_exempt: entry.is_exempt,
          remarks: entry.remarks,
          status: assessment.status,
          pass_marks: assessment.pass_marks || 0
        };
      });

    // Get exam dates from timetable
    const assessmentIds = results.map(r => r.assessment_id);
    if (assessmentIds.length > 0) {
      const { data: timetable } = await supabase
        .from('exam_timetable')
        .select('assessment_id, exam_date')
        .in('assessment_id', assessmentIds);

      if (timetable) {
        results.forEach(result => {
          const slot = timetable.find(t => t.assessment_id === result.assessment_id);
          if (slot) {
            result.exam_date = slot.exam_date;
          }
        });
      }
    }

    return results.sort((a, b) => 
      new Date(b.exam_date).getTime() - new Date(a.exam_date).getTime()
    );
  } catch (error) {
    console.error('Error fetching student results:', error);
    throw error;
  }
};

/**
 * Get result statistics for a student
 */
export const getStudentResultStats = async (studentId: string): Promise<{
  totalExams: number;
  passed: number;
  failed: number;
  absent: number;
  averagePercentage: number;
}> => {
  try {
    const results = await getStudentResults(studentId);
    
    const totalExams = results.length;
    const passed = results.filter(r => 
      !r.is_absent && !r.is_exempt && 
      r.marks_obtained !== undefined && 
      r.marks_obtained >= r.pass_marks
    ).length;
    const failed = results.filter(r => 
      !r.is_absent && !r.is_exempt && 
      r.marks_obtained !== undefined && 
      r.marks_obtained < r.pass_marks
    ).length;
    const absent = results.filter(r => r.is_absent).length;
    
    const validResults = results.filter(r => 
      !r.is_absent && !r.is_exempt && r.percentage !== undefined
    );
    const averagePercentage = validResults.length > 0
      ? validResults.reduce((sum, r) => sum + (r.percentage || 0), 0) / validResults.length
      : 0;

    return {
      totalExams,
      passed,
      failed,
      absent,
      averagePercentage: Math.round(averagePercentage * 10) / 10
    };
  } catch (error) {
    console.error('Error calculating result stats:', error);
    return {
      totalExams: 0,
      passed: 0,
      failed: 0,
      absent: 0,
      averagePercentage: 0
    };
  }
};
