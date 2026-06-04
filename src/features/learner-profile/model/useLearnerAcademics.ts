import { useState, useEffect, useCallback } from 'react';
import { apiPost } from '@/shared/api/apiClient';
import { getLogger } from '@/shared/config/logging';

const logger = getLogger('learner-academics');

export interface UselearnerAcademicsOptions {
  learnerId: string | null;
  enabled?: boolean;
}

export interface CurriculumData {
  id: string;
  subject: string;
  grade: string;
  semester: string;
  credits: number;
  status: string;
}

export interface ExamResult {
  id: string;
  exam_name: string;
  subject: string;
  marks_obtained: number;
  total_marks: number;
  percentage: number;
  grade: string;
  exam_date: string;
  status: string;
}

export interface AssessmentResult {
  id: string;
  assessment_name: string;
  score: number;
  max_score: number;
  percentage: number;
  completed_at: string;
  status: string;
}

const fetchData = async <T>(action: string, params: Record<string, any>): Promise<T[]> => {
  const res = await apiPost<T[]>('/learner-profile/actions', { action, ...params });
  return res?.data || [];
};

export const useLearnerAcademics = ({ learnerId, enabled = true }: UselearnerAcademicsOptions) => {
  const [curriculum, setCurriculum] = useState<CurriculumData[]>([]);
  const [exams, setExams] = useState<ExamResult[]>([]);
  const [assessments, setAssessments] = useState<AssessmentResult[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchAcademicData = useCallback(async () => {
    if (!learnerId || !enabled) {
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setError(null);

      await Promise.all([
        fetchCurriculum(),
        fetchExams(),
        fetchAssessments()
      ]);
    } catch (err: any) {
      logger.error('Error fetching academic data', err);
      setError(err.message || 'Failed to fetch academic data');
    } finally {
      setLoading(false);
    }
  }, [learnerId, enabled]);

  const fetchCurriculum = async () => {
    if (!learnerId) return;
    try {
      const data = await fetchData<any>('fetch-curriculum', { learnerId });
      setCurriculum(data || []);
    } catch (err) {
      logger.error('Error fetching curriculum', err as Error);
    }
  };

  const fetchExams = async () => {
    if (!learnerId) return;
    try {
      const data = await fetchData<any>('fetch-exam-results', { learnerId });
      setExams(data || []);
    } catch (err) {
      logger.error('Error fetching exams', err as Error);
    }
  };

  const fetchAssessments = async () => {
    if (!learnerId) return;
    try {
      const data = await fetchData<any>('fetch-assessment-results', { learnerId });
      setAssessments(data || []);
    } catch (err) {
      logger.error('Error fetching assessments', err as Error);
    }
  };

  const refresh = useCallback(() => {
    fetchAcademicData();
  }, [fetchAcademicData]);

  useEffect(() => {
    fetchAcademicData();
  }, [fetchAcademicData]);

  const stats = {
    totalCourses: curriculum.length,
    totalExams: exams.length,
    totalAssessments: assessments.length,
    averageGrade: curriculum.length > 0
      ? curriculum.reduce((sum, c) => sum + (parseFloat(c.grade) || 0), 0) / curriculum.length
      : 0,
    averageExamScore: exams.length > 0
      ? exams.reduce((sum, e) => sum + e.percentage, 0) / exams.length
      : 0,
    averageAssessmentScore: assessments.length > 0
      ? assessments.reduce((sum, a) => sum + a.percentage, 0) / assessments.length
      : 0
  };

  return {
    curriculum,
    exams,
    assessments,
    grades: curriculum,
    academicRecords: { curriculum, exams, assessments },
    stats,
    loading,
    error,
    refresh,
    refreshCurriculum: fetchCurriculum,
    refreshExams: fetchExams,
    refreshAssessments: fetchAssessments
  };
};
