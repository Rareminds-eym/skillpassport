/**
 * Consolidated Learner Academics Hook
 * 
 * Handles academic-related data:
 * - Curriculum data
 * - Exam results
 * - Grades and academic records
 * - Assessment results
 * 
 * Returns: curriculum, exams, grades, assessments
 */

import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/shared/api/supabaseClient';
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

export const useLearnerAcademics = ({ learnerId, enabled = true }: UselearnerAcademicsOptions) => {
  const [curriculum, setCurriculum] = useState<CurriculumData[]>([]);
  const [exams, setExams] = useState<ExamResult[]>([]);
  const [assessments, setAssessments] = useState<AssessmentResult[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Fetch all academic data
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

  // Fetch curriculum data
  const fetchCurriculum = async () => {
    if (!learnerId) return;

    try {
      const { data, error: fetchError } = await supabase
        .from('curriculum')
        .select('*')
        .eq('learner_id', learnerId)
        .order('created_at', { ascending: false });

      if (fetchError) throw fetchError;

      setCurriculum(data || []);
    } catch (err) {
      logger.error('Error fetching curriculum', err as Error);
    }
  };

  // Fetch exam results
  const fetchExams = async () => {
    if (!learnerId) return;

    try {
      const { data, error: fetchError } = await supabase
        .from('exam_results')
        .select('*')
        .eq('learner_id', learnerId)
        .order('exam_date', { ascending: false });

      if (fetchError) throw fetchError;

      setExams(data || []);
    } catch (err) {
      logger.error('Error fetching exams', err as Error);
    }
  };

  // Fetch assessment results
  const fetchAssessments = async () => {
    if (!learnerId) return;

    try {
      const { data, error: fetchError } = await supabase
        .from('assessment_results')
        .select('*')
        .eq('learner_id', learnerId)
        .order('completed_at', { ascending: false });

      if (fetchError) throw fetchError;

      setAssessments(data || []);
    } catch (err) {
      logger.error('Error fetching assessments', err as Error);
    }
  };

  // Refresh all academic data
  const refresh = useCallback(() => {
    fetchAcademicData();
  }, [fetchAcademicData]);

  // Load data on mount
  useEffect(() => {
    fetchAcademicData();
  }, [fetchAcademicData]);

  // Calculate academic statistics
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
    // Data
    curriculum,
    exams,
    assessments,
    grades: curriculum, // Alias for backward compatibility
    academicRecords: {
      curriculum,
      exams,
      assessments
    },
    stats,
    loading,
    error,
    
    // Refresh function
    refresh,
    
    // Individual refresh functions
    refreshCurriculum: fetchCurriculum,
    refreshExams: fetchExams,
    refreshAssessments: fetchAssessments
  };
};
