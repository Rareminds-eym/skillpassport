import { apiPost } from '@/shared/api/apiClient';
import { getLogger } from '@/shared/config/logging';

const logger = getLogger('learnerExamService');

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
  original_marks?: number;
  is_moderated: boolean;
  moderation_reason?: string;
  moderated_by?: string;
  moderation_date?: string;
}

export const getlearnerExams = async (learnerId: string): Promise<LearnerExam[]> => {
  try {
    const result = await apiPost<any>('/learner-profile/actions', { action: 'fetch-learner-exam-data', learnerId });
    const learner = result?.data?.learner;
    const timetableEntries = result?.data?.timetable || [];

    if (!learner?.school_class_id) {
      return [];
    }

    const relevantExams = (timetableEntries || []).filter((entry: any) => {
      const assessment = entry.assessments as any;
      if (!['scheduled', 'ongoing', 'marks_pending', 'published'].includes(assessment?.status)) {
        return false;
      }

      const targetClasses = assessment?.target_classes as any;
      if (!targetClasses) return false;

      if (targetClasses.type === 'whole_grade') {
        return targetClasses.grade === learner.grade;
      } else if (targetClasses.type === 'single_section') {
        return targetClasses.grade === learner.grade && 
               targetClasses.sections?.includes(learner.section);
      } else if (targetClasses.class_ids) {
        return targetClasses.class_ids.includes(learner.school_class_id);
      }

      return false;
    });

    const exams: LearnerExam[] = relevantExams.map((entry: any) => {
      const assessment = entry.assessments as any;
      return {
        id: entry.id,
        assessment_id: entry.assessment_id,
        assessment_code: assessment?.assessment_code || '',
        type: assessment?.type || '',
        course_name: entry.course_name || assessment?.course_name || '',
        subject_name: entry.course_name || '',
        exam_date: entry.exam_date,
        start_time: entry.start_time,
        end_time: entry.end_time,
        duration_minutes: entry.duration_minutes || 0,
        total_marks: 100,
        pass_marks: 35,
        room: entry.room || '',
        status: assessment?.status || '',
        instructions: assessment?.instructions
      };
    });

    return exams;
  } catch (error) {
    logger.error('Error fetching learner exams', error as Error);
    throw error;
  }
};

export const getGroupedlearnerExams = async (learnerId: string): Promise<GroupedExam[]> => {
  try {
    const exams = await getlearnerExams(learnerId);
    
    const groupedMap = new Map<string, GroupedExam>();
    
    exams.forEach(exam => {
      if (!groupedMap.has(exam.assessment_id)) {
        groupedMap.set(exam.assessment_id, {
          assessment_id: exam.assessment_id,
          assessment_code: exam.assessment_code,
          type: exam.type,
          overall_total_marks: 0,
          overall_pass_marks: 0,
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
    logger.error('Error grouping learner exams', error as Error);
    throw error;
  }
};

export const getlearnerResults = async (learnerId: string): Promise<LearnerResult[]> => {
  try {
    const result = await apiPost<any>('/learner-profile/actions', { action: 'fetch-learner-result-data', learnerId });
    const learner = result?.data?.learner;
    const markEntries = result?.data?.markEntries || [];
    const timetableData = result?.data?.timetable || [];

    if (!learner?.school_class_id) {
      return [];
    }

    const relevantResults = (markEntries || []).filter((entry: any) => {
      const assessment = entry.assessments as any;
      if (assessment?.status !== 'published') return false;
      if (assessment?.school_id !== learner.school_id) return false;
      
      const targetClasses = assessment?.target_classes as any;
      if (!targetClasses) return false;

      if (targetClasses.type === 'whole_grade') {
        return targetClasses.grade === learner.grade;
      } else if (targetClasses.type === 'single_section') {
        return targetClasses.grade === learner.grade && 
               targetClasses.sections?.includes(learner.section);
      } else if (targetClasses.class_ids) {
        return targetClasses.class_ids.includes(learner.school_class_id);
      }

      return false;
    });

    const timetableMap: Record<string, { exam_date: string; subjects: string[] }> = {};
    (timetableData || []).forEach((t: any) => {
      if (!timetableMap[t.assessment_id]) {
        timetableMap[t.assessment_id] = { exam_date: t.exam_date, subjects: [] };
      }
      if (t.course_name && !timetableMap[t.assessment_id].subjects.includes(t.course_name)) {
        timetableMap[t.assessment_id].subjects.push(t.course_name);
      }
    });

    const results: LearnerResult[] = relevantResults.map((entry: any, index: number) => {
      const assessment = entry.assessments as any;
      const timetableInfo = timetableMap[entry.assessment_id];
      
      let subjectName = assessment?.course_name || '';
      if (timetableInfo?.subjects && timetableInfo.subjects.length > 1) {
        const subjectIndex = index % timetableInfo.subjects.length;
        subjectName = timetableInfo.subjects[subjectIndex];
      } else if (timetableInfo?.subjects && timetableInfo.subjects.length === 1) {
        subjectName = timetableInfo.subjects[0];
      }

      const subjectTotalMarks = parseFloat(entry.total_marks) || 0;
      const subjectPassMarks = Math.round(subjectTotalMarks * 0.35);

      return {
        id: entry.id,
        assessment_id: entry.assessment_id,
        assessment_code: assessment?.assessment_code || '',
        type: assessment?.type || '',
        course_name: assessment?.course_name || '',
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
        status: assessment?.status,
        pass_marks: subjectPassMarks,
        original_marks: entry.original_marks ? parseFloat(entry.original_marks) : undefined,
        is_moderated: entry.original_marks !== null && entry.moderated_by !== null,
        moderation_reason: entry.moderation_reason,
        moderated_by: entry.moderated_by,
        moderation_date: entry.moderation_date
      };
    });

    return results.sort((a, b) => 
      new Date(b.exam_date).getTime() - new Date(a.exam_date).getTime()
    );
  } catch (error) {
    logger.error('Error fetching learner results', error as Error);
    throw error;
  }
};

export const getlearnerResultStats = async (learnerId: string): Promise<{
  totalExams: number;
  passed: number;
  failed: number;
  absent: number;
  averagePercentage: number;
}> => {
  try {
    const results = await getlearnerResults(learnerId);
    
    const passed = results.filter(r => !r.is_absent && !r.is_exempt && r.is_pass === true).length;
    const failed = results.filter(r => !r.is_absent && !r.is_exempt && r.is_pass === false).length;
    const absent = results.filter(r => r.is_absent).length;
    
    const validResults = results.filter(r => !r.is_absent && !r.is_exempt && r.percentage !== undefined);
    const averagePercentage = validResults.length > 0
      ? validResults.reduce((sum, r) => sum + (r.percentage || 0), 0) / validResults.length
      : 0;

    return {
      totalExams: results.length,
      passed,
      failed,
      absent,
      averagePercentage: Math.round(averagePercentage * 10) / 10
    };
  } catch (error) {
    return { totalExams: 0, passed: 0, failed: 0, absent: 0, averagePercentage: 0 };
  }
};
