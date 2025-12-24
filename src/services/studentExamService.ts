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

export interface GroupedExam {
  assessment_id: string;
  assessment_code: string;
  type: string;
  overall_total_marks: number;
  overall_pass_marks: number;
  instructions?: string;
  status: string;
  subjects: StudentExam[];
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
  is_pass?: boolean;
  remarks?: string;
  status: string;
  pass_marks: number;
  // Moderation fields
  original_marks?: number;
  is_moderated: boolean;
  moderation_reason?: string;
  moderated_by?: string;
  moderation_date?: string;
}

/**
 * Get upcoming and past exams for a student, grouped by assessment
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

    // Get exam timetable entries for the student's school
    const { data: timetableEntries, error: timetableError } = await supabase
      .from('exam_timetable')
      .select(`
        id,
        assessment_id,
        course_name,
        course_code,
        exam_date,
        start_time,
        end_time,
        duration_minutes,
        room,
        status,
        assessments!inner(
          assessment_code,
          type,
          total_marks,
          pass_marks,
          instructions,
          status,
          school_id,
          target_classes
        )
      `)
      .eq('school_id', student.school_id)
      .order('exam_date', { ascending: true });

    if (timetableError) throw timetableError;

    // Filter exams that target this student's class and are relevant
    const relevantExams = (timetableEntries || []).filter(entry => {
      const assessment = entry.assessments as any;
      
      // Only show scheduled, ongoing, marks_pending, or published exams
      if (!['scheduled', 'ongoing', 'marks_pending', 'published'].includes(assessment.status)) {
        return false;
      }

      const targetClasses = assessment.target_classes as any;
      if (!targetClasses) return false;

      // Check if this exam targets the student's class
      if (targetClasses.type === 'whole_grade') {
        return targetClasses.grade === student.grade;
      } else if (targetClasses.type === 'single_section') {
        return targetClasses.grade === student.grade && 
               targetClasses.sections?.includes(student.section);
      } else if (targetClasses.class_ids) {
        return targetClasses.class_ids.includes(student.school_class_id);
      }

      return false;
    });

    // Transform to StudentExam format with correct subject-specific marks
    const exams: StudentExam[] = relevantExams.map(entry => {
      const assessment = entry.assessments as any;
      const overallTotalMarks = parseFloat(assessment.total_marks) || 0;
      
      // Calculate subject-specific marks based on exam type
      let subjectTotalMarks = overallTotalMarks;
      if (assessment.type === 'term_exam' || assessment.type === 'mid_term') {
        // For multi-subject exams, divide total marks by number of subjects
        // We can count subjects by checking how many timetable entries exist for this assessment
        subjectTotalMarks = 100; // Standard subject marks for term exams
      }

      return {
        id: entry.id,
        assessment_id: entry.assessment_id,
        assessment_code: assessment.assessment_code || '',
        type: assessment.type || '',
        course_name: entry.course_name || assessment.course_name || '',
        subject_name: entry.course_name || '',
        exam_date: entry.exam_date,
        start_time: entry.start_time,
        end_time: entry.end_time,
        duration_minutes: entry.duration_minutes || 0,
        total_marks: subjectTotalMarks,
        pass_marks: Math.round(subjectTotalMarks * 0.35), // 35% of subject marks
        room: entry.room || '',
        status: assessment.status || '',
        instructions: assessment.instructions
      };
    });

    return exams;
  } catch (error) {
    console.error('Error fetching student exams:', error);
    throw error;
  }
};

/**
 * Get grouped exams for better UI display
 */
export const getGroupedStudentExams = async (studentId: string): Promise<GroupedExam[]> => {
  try {
    const exams = await getStudentExams(studentId);
    
    // Group exams by assessment_id
    const groupedMap = new Map<string, GroupedExam>();
    
    exams.forEach(exam => {
      if (!groupedMap.has(exam.assessment_id)) {
        groupedMap.set(exam.assessment_id, {
          assessment_id: exam.assessment_id,
          assessment_code: exam.assessment_code,
          type: exam.type,
          overall_total_marks: 0, // Will be calculated
          overall_pass_marks: 0, // Will be calculated
          instructions: exam.instructions,
          status: exam.status,
          subjects: []
        });
      }
      
      const group = groupedMap.get(exam.assessment_id)!;
      group.subjects.push(exam);
      group.overall_total_marks += exam.total_marks;
      group.overall_pass_marks += exam.pass_marks;
    });
    
    return Array.from(groupedMap.values()).sort((a, b) => {
      const aDate = new Date(a.subjects[0]?.exam_date || '');
      const bDate = new Date(b.subjects[0]?.exam_date || '');
      return aDate.getTime() - bDate.getTime();
    });
  } catch (error) {
    console.error('Error fetching grouped student exams:', error);
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
      .select('school_class_id, school_id, grade, section')
      .eq('id', studentId)
      .single();

    if (studentError || !student?.school_class_id) {
      console.log('Student not found or not assigned to a class');
      return [];
    }

    // Get mark entries for this student with assessment details
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
        is_pass,
        remarks,
        subject_id,
        original_marks,
        moderated_by,
        moderation_reason,
        moderation_date,
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
    const relevantResults = (markEntries || []).filter(entry => {
      const assessment = entry.assessments as any;
      
      // Only show published results
      if (assessment.status !== 'published') return false;
      if (assessment.school_id !== student.school_id) return false;
      
      const targetClasses = assessment.target_classes as any;
      if (!targetClasses) return false;

      // Check if this result is for the student's class
      if (targetClasses.type === 'whole_grade') {
        return targetClasses.grade === student.grade;
      } else if (targetClasses.type === 'single_section') {
        return targetClasses.grade === student.grade && 
               targetClasses.sections?.includes(student.section);
      } else if (targetClasses.class_ids) {
        return targetClasses.class_ids.includes(student.school_class_id);
      }

      return false;
    });

    // Get exam dates and all subject names from timetable for these assessments
    const assessmentIds = [...new Set(relevantResults.map(r => r.assessment_id))];
    const timetableMap: Record<string, { exam_date: string; subjects: string[] }> = {};
    
    if (assessmentIds.length > 0) {
      const { data: timetable } = await supabase
        .from('exam_timetable')
        .select('assessment_id, exam_date, course_name')
        .in('assessment_id', assessmentIds);

      if (timetable) {
        timetable.forEach(t => {
          if (!timetableMap[t.assessment_id]) {
            timetableMap[t.assessment_id] = { exam_date: t.exam_date, subjects: [] };
          }
          if (t.course_name && !timetableMap[t.assessment_id].subjects.includes(t.course_name)) {
            timetableMap[t.assessment_id].subjects.push(t.course_name);
          }
        });
      }
    }

    // Transform to StudentResult format
    const results: StudentResult[] = relevantResults.map((entry, index) => {
      const assessment = entry.assessments as any;
      const timetableInfo = timetableMap[entry.assessment_id];
      
      // For multi-subject exams, try to assign different subjects to different entries
      let subjectName = assessment.course_name || '';
      if (timetableInfo?.subjects && timetableInfo.subjects.length > 1) {
        // Use modulo to cycle through available subjects for multi-subject exams
        const subjectIndex = index % timetableInfo.subjects.length;
        subjectName = timetableInfo.subjects[subjectIndex];
      } else if (timetableInfo?.subjects && timetableInfo.subjects.length === 1) {
        subjectName = timetableInfo.subjects[0];
      }

      // Calculate subject-level pass marks (35% of total marks for the subject)
      const subjectTotalMarks = parseFloat(entry.total_marks) || 0;
      const subjectPassMarks = Math.round(subjectTotalMarks * 0.35); // 35% pass criteria

      // Check if marks were moderated
      const isModerated = entry.original_marks !== null && entry.moderated_by !== null;

      return {
        id: entry.id,
        assessment_id: entry.assessment_id,
        assessment_code: assessment.assessment_code || '',
        type: assessment.type || '',
        course_name: assessment.course_name || '',
        subject_name: subjectName,
        exam_date: timetableInfo?.exam_date || '',
        marks_obtained: entry.marks_obtained ? parseFloat(entry.marks_obtained) : undefined,
        total_marks: subjectTotalMarks,
        percentage: entry.percentage ? parseFloat(entry.percentage) : undefined,
        grade: entry.grade,
        is_absent: entry.is_absent || false,
        is_exempt: entry.is_exempt || false,
        is_pass: entry.is_pass,
        remarks: entry.remarks,
        status: assessment.status,
        pass_marks: subjectPassMarks, // Use calculated subject-level pass marks
        // Moderation fields
        original_marks: entry.original_marks ? parseFloat(entry.original_marks) : undefined,
        is_moderated: isModerated,
        moderation_reason: entry.moderation_reason,
        moderated_by: entry.moderated_by,
        moderation_date: entry.moderation_date
      };
    });

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
    
    // Use the is_pass field from the database which is correctly calculated
    const passed = results.filter(r => 
      !r.is_absent && !r.is_exempt && r.is_pass === true
    ).length;
    
    const failed = results.filter(r => 
      !r.is_absent && !r.is_exempt && r.is_pass === false
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
