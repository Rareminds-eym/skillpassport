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
import { isCollegeStudent as checkIsCollegeStudent } from '../../../../utils/studentType';
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

      // OPTIMIZED: Single query with OR condition to check both user_id and id
      // Also fetch by email as fallback in the same query pattern
      // Include user role from public.users table for student type detection
      // Include custom institution names (university, college_school_name) for profile completion check
      const { data: student, error: fetchError } = await supabase
        .from('students')
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
        console.error('Error fetching student grade:', fetchError);
        setError(fetchError.message);
        return;
      }

      if (student) {
        // Log the fetched data for debugging
        console.log('🔍 useStudentGrade - Fetched student data:', {
          id: student.id,
          user_id: student.user_id,
          school_id: student.school_id,
          university_college_id: student.university_college_id,
          university: student.university,
          college_school_name: student.college_school_name,
          users: student.users,
          usersRole: (student.users as any)?.role
        });

        // Extract role from the joined users table
        // The join returns an array with one object
        const userRole = Array.isArray(student.users) && student.users.length > 0
          ? (student.users[0] as any)?.role
          : (student.users as any)?.role;

        // Store complete profile data for missing field analysis
        // Include the extracted role at the top level for easier access
        const profileDataWithRole = {
          ...student,
          role: userRole
        };
        setProfileData(profileDataWithRole);

        // Save student ID
        setStudentId(student.id);

        // Check if student is a college student (using centralized utility)
        // Pass the role to the utility for proper detection
        const isCollege = checkIsCollegeStudent({ ...student, role: userRole });
        setIsCollegeStudent(isCollege);

        // Set program name if available
        // Priority: 
        // 1. program.name (structured program from programs table)
        // 2. program.code (structured program code)
        // 3. course_name (custom program entered by user OR synced from program)
        // 4. branch_field (legacy field, synced with course_name)
        const programName = (student.program as any)?.name ||
          (student.program as any)?.code ||
          student.course_name ||
          student.branch_field;
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
