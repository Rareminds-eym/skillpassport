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
import { supabase } from '@/shared/api/supabaseClient';
import { calculateMonthsInGrade, getGradeLevelFromGrade } from '../lib/gradeUtils';
import { isCollegeLearner as checkIsCollegeLearner } from '@/entities/learner/lib/learnerType';
import type { GradeLevel } from '../model/types';

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

      // OPTIMIZED: Single query with OR condition to check both user_id and id
      // Also fetch by email as fallback in the same query pattern
      // Include user role from public.users table for learner type detection
      // Include custom institution names (university, college_school_name) for profile completion check
      const { data: learner, error: fetchError } = await supabase
        .from('learners')
        .select(`
          id, 
          user_id,
          grade, 
          grade_start_date, 
          school_class_id, 
          school_id, 
          university_college_id, 
          program_id, 
          course_name, 
          branch_field,
          university,
          college_school_name,
          school_classes:school_class_id(grade, academic_year), 
          program:program_id(name, code),
          users!inner(role)
        `)
        .or(`user_id.eq.${userId}${userEmail ? `,email.eq.${userEmail}` : ''}`)
        .maybeSingle();


      if (fetchError) {
        console.error('Error fetching learner grade:', fetchError);
        setError(fetchError.message);
        return;
      }

      if (learner) {
        // Log the fetched data for debugging
        console.log('🔍 useLearnerGrade - Fetched learner data:', {
          id: learner.id,
          user_id: learner.user_id,
          school_id: learner.school_id,
          university_college_id: learner.university_college_id,
          university: learner.university,
          college_school_name: learner.college_school_name,
          users: learner.users,
          usersRole: (learner.users as any)?.role
        });

        // Extract role from the joined users table
        // The join returns an array with one object
        const userRole = Array.isArray(learner.users) && learner.users.length > 0
          ? (learner.users[0] as any)?.role
          : (learner.users as any)?.role;

        // Store complete profile data for missing field analysis
        // Include the extracted role at the top level for easier access
        const profileDataWithRole = {
          ...learner,
          role: userRole
        };
        setProfileData(profileDataWithRole);

        // Save learner ID
        setLearnerId(learner.id);

        // Check if learner is a college learner (using centralized utility)
        // Pass the role to the utility for proper detection
        const isCollege = checkIsCollegeLearner({ ...learner, role: userRole });
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
      console.error('Error fetching learner grade:', err);
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
