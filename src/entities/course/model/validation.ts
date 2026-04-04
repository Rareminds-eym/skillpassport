/**
 * Course Entity - Validation Logic
 * Validation rules and functions for course data
 */

import type { Course, CourseModule, Lesson } from '@/shared/types';

// ============================================================================
// Course Status Validation
// ============================================================================

const VALID_STATUSES = ['Active', 'Draft', 'Upcoming', 'Archived', 'Inactive', 'Pending'] as const;

export const isValidCourseStatus = (status: string): boolean => {
  return VALID_STATUSES.includes(status as any);
};

// ============================================================================
// Course Validation
// ============================================================================

export const validateCourse = (course: Partial<Course>): {
  isValid: boolean;
  errors: string[];
} => {
  const errors: string[] = [];

  if (!course.id) {
    errors.push('Course ID is required');
  }

  if (!course.title || course.title.trim().length === 0) {
    errors.push('Course title is required');
  }

  if (course.title && course.title.length > 200) {
    errors.push('Course title must be less than 200 characters');
  }

  if (!course.description || course.description.trim().length === 0) {
    errors.push('Course description is required');
  }

  if (course.status && !isValidCourseStatus(course.status)) {
    errors.push('Invalid course status');
  }

  return {
    isValid: errors.length === 0,
    errors,
  };
};

// ============================================================================
// Course Module Validation
// ============================================================================

export const validateCourseModule = (module: Partial<CourseModule>): {
  isValid: boolean;
  errors: string[];
} => {
  const errors: string[] = [];

  if (!module.id) {
    errors.push('Module ID is required');
  }

  if (!module.title || module.title.trim().length === 0) {
    errors.push('Module title is required');
  }

  if (!module.description || module.description.trim().length === 0) {
    errors.push('Module description is required');
  }

  if (module.order !== undefined && module.order < 0) {
    errors.push('Module order must be non-negative');
  }

  return {
    isValid: errors.length === 0,
    errors,
  };
};

// ============================================================================
// Lesson Validation
// ============================================================================

export const validateLesson = (lesson: Partial<Lesson>): {
  isValid: boolean;
  errors: string[];
} => {
  const errors: string[] = [];

  if (!lesson.id) {
    errors.push('Lesson ID is required');
  }

  if (!lesson.title || lesson.title.trim().length === 0) {
    errors.push('Lesson title is required');
  }

  if (!lesson.content || lesson.content.trim().length === 0) {
    errors.push('Lesson content is required');
  }

  if (lesson.order !== undefined && lesson.order < 0) {
    errors.push('Lesson order must be non-negative');
  }

  return {
    isValid: errors.length === 0,
    errors,
  };
};

// ============================================================================
// Course Code Validation
// ============================================================================

export const isValidCourseCode = (code: string): boolean => {
  // Course code should be alphanumeric with optional hyphens/underscores
  const codeRegex = /^[A-Z0-9_-]+$/i;
  return codeRegex.test(code) && code.length >= 2 && code.length <= 20;
};

// ============================================================================
// Enrollment Validation
// ============================================================================

export const canEnrollInCourse = (course: Course): {
  canEnroll: boolean;
  reason?: string;
} => {
  if (course.status === 'Archived') {
    return {
      canEnroll: false,
      reason: 'Course is archived and no longer available for enrollment',
    };
  }

  if (course.status === 'Draft') {
    return {
      canEnroll: false,
      reason: 'Course is in draft status and not yet published',
    };
  }

  return { canEnroll: true };
};
