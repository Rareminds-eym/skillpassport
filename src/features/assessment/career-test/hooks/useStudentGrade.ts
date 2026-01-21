/**
 * useStudentGrade Hook
 * 
 * Fetches and manages student grade information from the database.
 * Handles both school students and college students.
 * 
 * OPTIMIZED: Single efficient query with all needed joins
 * 
 * @module features/assessment/career-test/hooks/useStudentGrade
 */

import { useState, useEffect, useCallback, useRef } from 'react';
import { supabase } from '../../../../lib/supabaseClient';
import { calculateMonthsInGrade, getGradeLevelFromGrade } from '../../utils/gradeUtils';
import type { GradeLevel } from '../config/sections';

interface StudentGradeData {
  studentId: string | null;
  studentGrade: string | null;
  studentSchoolClassId: string | null;
  isCollegeStudent: boolean;
  studentProgram: string | null;
  gradeStartDate: string | null;
  monthsInGrade: number | null;
  detectedGradeLevel: GradeLevel | null;
  profileData: any | null;
  loading: boolean;
  error: string | null;
}

interface UseStudentGradeOptions {
  userId?: string;
  userEmail?: string;
}

/**
 * Hook to fetch and manage student grade information
 */
export const useStudentGrade = ({ userId, userEmail }: UseStudentGradeOptions): StudentGradeData => {
  const [studentId, setStudentId] = useState<string | null>(null);
  const [studentGrade, setStudentGrade] = useState<string | null>(null);
  const [studentSchoolClassId, setStudentSchoolClassId] = useState<string | null>(null);
  const [isCollegeStudent, setIsCollegeStudent] = useState(false);
  const [studentProgram, setStudentProgram] = useState<string | null>(null);
  const [gradeStartDate, setGradeStartDate] = useState<string | null>(null);
  const [monthsInGrade, setMonthsInGrade] = useState<number | null>(null);
  const [profileData, setProfileData] = useState<any | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  // Track if fetch is complete to avoid duplicate calls
  const fetchComplete = useRef(false);

  const fetchStudentGrade = useCallback(async () => {
    // Skip if no userId or already fetched
    if (!userId || fetchComplete.current) {
      if (!userId) setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setError(null);
      
      console.log('🚀 useStudentGrade: Fetching student data...');
      const startTime = performance.now();

      // OPTIMIZED: Single query with OR condition to check both user_id and id
      // Also fetch by email as fallback in the same query pattern
      const { data: student, error: fetchError } = await supabase
        .from('students')
        .select(`
          id, 
          grade, 
          grade_start_date, 
          school_class_id, 
          school_id, 
          university_college_id, 
          program_id, 
          course_name, 
          branch_field, 
          school_classes:school_class_id(grade, academic_year), 
          program:program_id(name, code)
        `)
        .or(`user_id.eq.${userId}${userEmail ? `,email.eq.${userEmail}` : ''}`)
        .maybeSingle();
      
      const endTime = performance.now();
      console.log(`✅ useStudentGrade: Query completed in ${Math.round(endTime - startTime)}ms`);

      if (fetchError) {
        console.error('Error fetching student grade:', fetchError);
        setError(fetchError.message);
        return;
      }

      if (student) {
        // Store complete profile data for missing field analysis
        setProfileData(student);
        
        // Save student ID
        setStudentId(student.id);

        // Check if student is a college student
        const isCollege = Boolean(student.university_college_id && !student.school_id);
        setIsCollegeStudent(isCollege);

        // Set program name if available
        // Priority: branch_field (from settings) > program.name > program.code > course_name (legacy)
        const programName = student.branch_field ||
                           (student.program as any)?.name || 
                           (student.program as any)?.code || 
                           student.course_name;
        if (programName) {
          setStudentProgram(programName);
        }

        // Set grade_start_date and calculate months in grade
        if (student.grade_start_date) {
          setGradeStartDate(student.grade_start_date);
          const months = calculateMonthsInGrade(student.grade_start_date);
          setMonthsInGrade(months);
        } else if ((student.school_classes as any)?.academic_year) {
          // Fallback: estimate from academic year
          const academicYear = (student.school_classes as any).academic_year;
          const yearMatch = academicYear.match(/^(\d{4})/);
          if (yearMatch) {
            const startYear = parseInt(yearMatch[1]);
            const estimatedStartDate = `${startYear}-06-01`;
            const months = calculateMonthsInGrade(estimatedStartDate);
            setMonthsInGrade(months);
          }
        }

        // Use student.grade first, if not available use grade from school_classes
        const effectiveGrade = student.grade || (student.school_classes as any)?.grade;
        setStudentGrade(effectiveGrade);
        setStudentSchoolClassId(student.school_class_id);
      }
      
      fetchComplete.current = true;
    } catch (err) {
      console.error('Error fetching student grade:', err);
      setError(err instanceof Error ? err.message : 'Unknown error');
    } finally {
      setLoading(false);
    }
  }, [userId, userEmail]);

  useEffect(() => {
    fetchStudentGrade();
  }, [fetchStudentGrade]);

  // Calculate detected grade level
  const detectedGradeLevel = studentGrade 
    ? getGradeLevelFromGrade(studentGrade) as GradeLevel | null
    : null;

  return {
    studentId,
    studentGrade,
    studentSchoolClassId,
    isCollegeStudent,
    studentProgram,
    gradeStartDate,
    monthsInGrade,
    detectedGradeLevel,
    profileData,
    loading,
    error
  };
};

export default useStudentGrade;
