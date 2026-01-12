/**
 * Grade Level Utility Functions
 * Centralized logic for grade level detection and mapping
 */

import type { GradeLevel } from '../types/assessment.types';
import { GRADE_LEVELS, GRADE_RANGES, PROGRAM_GRADE_MAPPINGS } from '../constants/config';

/**
 * Determine grade level from student's grade string
 * Handles numeric grades (6, 7, 8...) and string grades ("12th", "UG", etc.)
 */
export const getGradeLevelFromGrade = (grade: string | number | null | undefined): GradeLevel | null => {
  if (!grade) return null;

  const gradeStr = String(grade).toUpperCase().trim();

  // Check program-based grades first (UG, PG, Diploma, etc.)
  if (PROGRAM_GRADE_MAPPINGS[gradeStr]) {
    return PROGRAM_GRADE_MAPPINGS[gradeStr];
  }

  // Try to extract numeric grade
  const gradeNum = parseInt(gradeStr, 10);
  
  if (isNaN(gradeNum)) {
    // Handle non-numeric grades like "12th", "10th"
    const match = gradeStr.match(/(\d+)/);
    if (match) {
      const num = parseInt(match[1], 10);
      return getGradeLevelFromNumber(num);
    }
    return null;
  }

  return getGradeLevelFromNumber(gradeNum);
};

/**
 * Get grade level from numeric grade
 */
export const getGradeLevelFromNumber = (gradeNum: number): GradeLevel | null => {
  if (gradeNum >= GRADE_RANGES.MIDDLE.min && gradeNum <= GRADE_RANGES.MIDDLE.max) {
    return GRADE_LEVELS.MIDDLE;
  }
  if (gradeNum >= GRADE_RANGES.HIGHSCHOOL.min && gradeNum <= GRADE_RANGES.HIGHSCHOOL.max) {
    return GRADE_LEVELS.HIGHSCHOOL;
  }
  if (gradeNum >= GRADE_RANGES.HIGHER_SECONDARY.min && gradeNum <= GRADE_RANGES.HIGHER_SECONDARY.max) {
    return GRADE_LEVELS.HIGHER_SECONDARY;
  }
  return null;
};

/**
 * Map UI grade level to adaptive aptitude grade level
 */
export const getAdaptiveGradeLevel = (gradeLevel: GradeLevel | null): 'middle_school' | 'high_school' | 'higher_secondary' => {
  switch (gradeLevel) {
    case 'highschool':
    case 'higher_secondary':
      return 'high_school';
    case 'middle':
      return 'middle_school';
    default:
      return 'high_school';
  }
};

/**
 * Check if grade level requires stream selection
 */
export const requiresStreamSelection = (gradeLevel: GradeLevel | null): boolean => {
  return gradeLevel === 'after10' || gradeLevel === 'after12' || gradeLevel === 'higher_secondary';
};

/**
 * Check if grade level requires category selection (Science/Commerce/Arts)
 */
export const requiresCategorySelection = (gradeLevel: GradeLevel | null): boolean => {
  return gradeLevel === 'after10' || gradeLevel === 'after12' || gradeLevel === 'higher_secondary';
};

/**
 * Check if grade level has adaptive aptitude section
 */
export const hasAdaptiveAptitude = (gradeLevel: GradeLevel | null): boolean => {
  return gradeLevel === 'highschool' || gradeLevel === 'higher_secondary';
};

/**
 * Get default stream ID for grade level
 */
export const getDefaultStreamId = (gradeLevel: GradeLevel | null): string => {
  switch (gradeLevel) {
    case 'middle':
      return 'middle_school';
    case 'highschool':
      return 'high_school';
    case 'higher_secondary':
      return 'higher_secondary';
    default:
      return 'general';
  }
};

/**
 * Calculate months between two dates
 */
export const calculateMonthsInGrade = (startDate: string | Date | null): number | null => {
  if (!startDate) return null;
  
  const start = new Date(startDate);
  const now = new Date();
  const months = (now.getFullYear() - start.getFullYear()) * 12 + (now.getMonth() - start.getMonth());
  
  return Math.max(0, months);
};

/**
 * Estimate grade start date from academic year
 * e.g., "2024-2025" -> June 2024
 */
export const estimateGradeStartFromAcademicYear = (academicYear: string): string | null => {
  const yearMatch = academicYear.match(/^(\d{4})/);
  if (yearMatch) {
    const startYear = parseInt(yearMatch[1], 10);
    return `${startYear}-06-01`; // Assume academic year starts in June
  }
  return null;
};

/**
 * Get display label for grade level
 */
export const getGradeLevelLabel = (gradeLevel: GradeLevel | null): string => {
  switch (gradeLevel) {
    case 'middle':
      return 'Middle School (6-8)';
    case 'highschool':
      return 'High School (9-10)';
    case 'higher_secondary':
      return 'Higher Secondary (11-12)';
    case 'after10':
      return 'After 10th';
    case 'after12':
      return 'After 12th';
    case 'college':
      return 'College/University';
    default:
      return 'Unknown';
  }
};

/**
 * Get estimated assessment duration for grade level
 */
export const getAssessmentDuration = (gradeLevel: GradeLevel | null): string => {
  switch (gradeLevel) {
    case 'middle':
      return '20-30 minutes';
    case 'highschool':
    case 'higher_secondary':
      return '35-45 minutes';
    case 'after10':
    case 'after12':
    case 'college':
      return '45-60 minutes';
    default:
      return '30-45 minutes';
  }
};
