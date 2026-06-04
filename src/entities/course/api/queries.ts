import { apiPost } from '@/shared/api/apiClient';
import type { Course, CourseEnrollment, CourseProgress, CourseFilters } from '../model/types';

export const getCourses = async (filters?: CourseFilters): Promise<Course[]> => {
  const response: any = await apiPost('/course/actions', {
    action: 'get-courses',
    ...filters,
  });
  return response?.data ?? response ?? [];
};

export const getActiveCourses = async (): Promise<Course[]> => {
  const response: any = await apiPost('/course/actions', {
    action: 'get-active-courses',
  });
  return response?.data ?? response ?? [];
};

export const getUserEnrollments = async (userId: string): Promise<CourseEnrollment[]> => {
  const response: any = await apiPost('/course/actions', {
    action: 'get-user-enrollments',
    userId,
  });
  return response?.data ?? response ?? [];
};

export const isUserEnrolled = async (
  userId: string,
  courseId: string
): Promise<boolean> => {
  const response: any = await apiPost('/course/actions', {
    action: 'is-user-enrolled',
    userId,
    courseId,
  });
  return response?.data?.enrolled ?? false;
};

export const getCourseProgress = async (
  userId: string,
  courseId: string
): Promise<CourseProgress | null> => {
  const response: any = await apiPost('/course/actions', {
    action: 'get-course-progress',
    userId,
    courseId,
  });
  return response?.data ?? null;
};

export const getUserCourseProgress = async (
  userId: string
): Promise<CourseProgress[]> => {
  const response: any = await apiPost('/course/actions', {
    action: 'get-user-course-progress',
    userId,
  });
  return response?.data ?? response ?? [];
};

export const getCourseAnalytics = async (courseId: string): Promise<any> => {
  const response: any = await apiPost('/course/actions', {
    action: 'get-course-analytics',
    courseId,
  });
  return response?.data ?? null;
};

export const getCourseModules = async (courseId: string): Promise<any[]> => {
  const response: any = await apiPost('/course/actions', {
    action: 'get-course-modules',
    courseId,
  });
  return response?.data ?? response ?? [];
};

export const getCourseModule = async (moduleId: string): Promise<any | null> => {
  const response: any = await apiPost('/course/actions', {
    action: 'get-course-module',
    moduleId,
  });
  return response?.data ?? null;
};
