import { apiPost } from '@/shared/api/apiClient';
import { getLogger } from '@/shared/config/logging';

const logger = getLogger('LearnerExamService');

/**
 * Learner Exam Service
 * Handles exam and result data for learners
 */

export interface LearnerExam {
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
  subjects: LearnerExam[];
}

export interface LearnerResult {
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
 * Get upcoming and past exams for a learner, grouped by assessment
 */
export const getlearnerExams = async (learnerId: string): Promise<LearnerExam[]> => {
  try {
    const res = await apiPost('/exams/actions', { action: 'get-learner-exams', learnerId });
    return res?.data || [];
  } catch (error) {
    logger.error('Error fetching learner exams', error, { learnerId });
    throw error;
  }
};

/**
 * Get grouped exams for better UI display
 */
export const getGroupedlearnerExams = async (learnerId: string): Promise<GroupedExam[]> => {
  try {
    const exams = await getlearnerExams(learnerId);
    
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
    logger.error('Error fetching grouped learner exams', error, { learnerId });
    throw error;
  }
};

/**
 * Get exam results for a learner
 */
export const getlearnerResults = async (learnerId: string): Promise<LearnerResult[]> => {
  try {
    const res = await apiPost('/exams/actions', { action: 'get-learner-results', learnerId });
    return res?.data || [];
  } catch (error) {
    logger.error('Error fetching learner results', error, { learnerId });
    throw error;
  }
};

/**
 * Get result statistics for a learner
 */
export const getlearnerResultStats = async (learnerId: string): Promise<{
  totalExams: number;
  passed: number;
  failed: number;
  absent: number;
  averagePercentage: number;
}> => {
  try {
    const results = await getlearnerResults(learnerId);
    
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
    logger.error('Error calculating result stats', error, { learnerId });
    return {
      totalExams: 0,
      passed: 0,
      failed: 0,
      absent: 0,
      averagePercentage: 0
    };
  }
};
