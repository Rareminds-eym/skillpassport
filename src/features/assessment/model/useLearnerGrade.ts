/**
 * useLearnerGrade Hook
 * 
 * Fetches and manages learner grade information from the database.
 * Handles both school learners and college learners.
 * 
 * OPTIMIZED: Single efficient query with all needed joins
 * 
 * @module features/assessment/career-test/hooks/useLearnerGrade
 */

import { useState, useEffect, useCallback, useRef } from 'react';
import { ssoClient } from '@/shared/api/ssoClient';
import { calculateMonthsInGrade, getGradeLevelFromGrade } from '../lib/gradeUtils';
import { isCollegeLearner as checkIsCollegeLearner } from '@/entities/learner/lib/learnerType';
import { getLogger } from '@/shared/config/logging';
import type { GradeLevel } from '../model/types';

const logger = getLogger('useLearnerGrade');

interface LearnerGradeData {
  learnerId: string | null;
  learnerGrade: string | null;
  learnerSchoolClassId: string | null;
  isCollegeLearner: boolean;
  learnerProgram: string | null;
  gradeStartDate: string | null;
  monthsInGrade: number | null;
  detectedGradeLevel: GradeLevel | null;
  profileData: any | null;
  loading: boolean;
  error: string | null;
}

interface UselearnerGradeOptions {
  userId?: string;
  userEmail?: string;
}

/**
 * Hook to fetch and manage learner grade information
 */
export const useLearnerGrade = ({ userId, userEmail }: UselearnerGradeOptions): LearnerGradeData => {
  const [learnerId, setLearnerId] = useState<string | null>(null);
  const [learnerGrade, setlearnerGrade] = useState<string | null>(null);
  const [learnerSchoolClassId, setlearnerSchoolClassId] = useState<string | null>(null);
  const [isCollegeLearner, setIsCollegeLearner] = useState(false);
  const [learnerProgram, setlearnerProgram] = useState<string | null>(null);
  const [gradeStartDate, setGradeStartDate] = useState<string | null>(null);
  const [monthsInGrade, setMonthsInGrade] = useState<number | null>(null);
  const [profileData, setProfileData] = useState<any | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Track if fetch is complete to avoid duplicate calls
  const fetchComplete = useRef(false);

  const fetchlearnerGrade = useCallback(async () => {
    // Skip if no userId or already fetched
    if (!userId || fetchComplete.current) {
      if (!userId) setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setError(null);

      const response = await ssoClient.fetch(`/api/learners/profile?user_id=${userId}`, {
        method: 'GET',
        headers: { 'Content-Type': 'application/json' }
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        logger.error('Failed to fetch learner grade profile', errorData);
        setError(errorData.error || 'Failed to fetch learner profile');
        fetchComplete.current = true;
        return;
      }

      const { learner } = await response.json();

      if (learner) {
        // Backend already extracts role and includes it at top level
        setProfileData(learner);

        // Save learner ID
        setLearnerId(learner.id);

        // Check if learner is a college learner (using centralized utility)
        // Backend already includes role at top level
        const isCollege = checkIsCollegeLearner(learner);
        setIsCollegeLearner(isCollege);

        // Set program name if available
        // Priority: 
        // 1. program.name (structured program from programs table)
        // 2. program.code (structured program code)
        // 3. course_name (custom program entered by user OR synced from program)
        // 4. branch_field (legacy field, synced with course_name)
        const programName = (learner.program as any)?.name ||
          (learner.program as any)?.code ||
          learner.course_name ||
          learner.branch_field;
        if (programName) {
          setlearnerProgram(programName);
        }

        // Set grade_start_date and calculate months in grade
        if (learner.grade_start_date) {
          setGradeStartDate(learner.grade_start_date);
          const months = calculateMonthsInGrade(learner.grade_start_date);
          setMonthsInGrade(months);
        } else if ((learner.school_classes as any)?.academic_year) {
          // Fallback: estimate from academic year
          const academicYear = (learner.school_classes as any).academic_year;
          const yearMatch = academicYear.match(/^(\d{4})/);
          if (yearMatch) {
            const startYear = parseInt(yearMatch[1]);
            const estimatedStartDate = `${startYear}-06-01`;
            const months = calculateMonthsInGrade(estimatedStartDate);
            setMonthsInGrade(months);
          }
        }

        // Use learner.grade first, if not available use grade from school_classes
        const effectiveGrade = learner.grade || (learner.school_classes as any)?.grade;
        setlearnerGrade(effectiveGrade);
        setlearnerSchoolClassId(learner.school_class_id);
      }

      fetchComplete.current = true;
    } catch (err) {
      logger.error('Error fetching learner grade', err instanceof Error ? err : new Error(String(err)));
      setError(err instanceof Error ? err.message : 'Unknown error');
    } finally {
      setLoading(false);
    }
  }, [userId, userEmail]);

  useEffect(() => {
    fetchlearnerGrade();
  }, [fetchlearnerGrade]);

  // Calculate detected grade level
  const detectedGradeLevel = learnerGrade
    ? getGradeLevelFromGrade(learnerGrade) as GradeLevel | null
    : null;

  return {
    learnerId,
    learnerGrade,
    learnerSchoolClassId,
    isCollegeLearner,
    learnerProgram,
    gradeStartDate,
    monthsInGrade,
    detectedGradeLevel,
    profileData,
    loading,
    error
  };
};

export default useLearnerGrade;
