/**
 * Course Entity - Utility Functions
 * Helper functions for course data manipulation
 */

import { isSameEntity } from '@/shared/lib/comparison';
import type { Course, CourseModule, CourseProgress } from '@/shared/types';

// ============================================================================
// Course Display Utilities
// ============================================================================

export const getCourseDisplayTitle = (course: Course | null | undefined): string => {
  if (!course) return 'Unknown Course';
  return course.title || 'Untitled Course';
};

export const getCourseDuration = (course: Course): string => {
  if (course.duration) return course.duration;
  
  // Calculate from modules if available
  if (course.modules && course.modules.length > 0) {
    const totalLessons = course.modules.reduce(
      (sum, module) => sum + (module.lessons?.length || 0),
      0
    );
    return `${totalLessons} lessons`;
  }
  
  return 'Duration not specified';
};

// ============================================================================
// Course Progress Utilities
// ============================================================================

export const calculateCourseProgress = (
  completedLessons: number,
  totalLessons: number
): number => {
  if (totalLessons === 0) return 0;
  return Math.round((completedLessons / totalLessons) * 100);
};

export const getCourseProgressStatus = (progress: number): {
  status: 'not-started' | 'in-progress' | 'completed';
  label: string;
} => {
  if (progress === 0) {
    return { status: 'not-started', label: 'Not Started' };
  }
  if (progress === 100) {
    return { status: 'completed', label: 'Completed' };
  }
  return { status: 'in-progress', label: 'In Progress' };
};

// ============================================================================
// Course Module Utilities
// ============================================================================

export const getTotalLessons = (course: Course): number => {
  if (!course.modules) return 0;
  return course.modules.reduce(
    (sum, module) => sum + (module.lessons?.length || 0),
    0
  );
};

export const sortModulesByOrder = (modules: CourseModule[]): CourseModule[] => {
  return [...modules].sort((a, b) => a.order - b.order);
};

export const getModuleLessonCount = (module: CourseModule): number => {
  return module.lessons?.length || 0;
};

// ============================================================================
// Course Filtering Utilities
// ============================================================================

export const filterCoursesByStatus = (
  courses: Course[],
  status: string
): Course[] => {
  return courses.filter(course => course.status === status);
};

export const filterActiveCourses = (courses: Course[]): Course[] => {
  return courses.filter(course => course.status === 'Active');
};

export const searchCourses = (courses: Course[], searchTerm: string): Course[] => {
  const term = searchTerm.toLowerCase();
  return courses.filter(course => {
    const title = course.title?.toLowerCase() || '';
    const description = course.description?.toLowerCase() || '';
    const code = course.code?.toLowerCase() || '';
    return title.includes(term) || description.includes(term) || code.includes(term);
  });
};

export const filterCoursesByCategory = (
  courses: Course[],
  category: string
): Course[] => {
  return courses.filter(course => course.category === category);
};

// ============================================================================
// Course Sorting Utilities
// ============================================================================

export const sortCoursesByTitle = (courses: Course[]): Course[] => {
  return [...courses].sort((a, b) => {
    const titleA = a.title?.toLowerCase() || '';
    const titleB = b.title?.toLowerCase() || '';
    return titleA.localeCompare(titleB);
  });
};

export const sortCoursesByEnrollment = (courses: Course[]): Course[] => {
  return [...courses].sort((a, b) => {
    const enrollA = a.enrollmentCount || 0;
    const enrollB = b.enrollmentCount || 0;
    return enrollB - enrollA;
  });
};

export const sortCoursesByCompletionRate = (courses: Course[]): Course[] => {
  return [...courses].sort((a, b) => {
    const rateA = a.completionRate || 0;
    const rateB = b.completionRate || 0;
    return rateB - rateA;
  });
};

// ============================================================================
// Course Statistics Utilities
// ============================================================================

export const getCourseStats = (course: Course): {
  totalModules: number;
  totalLessons: number;
  totalSkills: number;
  enrollmentCount: number;
  completionRate: number;
} => {
  return {
    totalModules: course.modules?.length || 0,
    totalLessons: getTotalLessons(course),
    totalSkills: course.totalSkills || course.skillsCovered?.length || 0,
    enrollmentCount: course.enrollmentCount || 0,
    completionRate: course.completionRate || 0,
  };
};

// ============================================================================
// Course Comparison Utilities
// ============================================================================

export const isSameCourse = isSameEntity<Course>;

// ============================================================================
// Course URL Utilities
// ============================================================================

export const getCourseUrl = (courseId: string): string => {
  return `/courses/${courseId}`;
};

export const getCourseThumbnailUrl = (course: Course): string | null => {
  return course.thumbnail || null;
};
