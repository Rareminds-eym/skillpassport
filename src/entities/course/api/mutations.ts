import { apiPost } from '@/shared/api/apiClient';
import type { Course, CourseEnrollment, CourseModule } from '../model/types';

export const createCourse = async (courseData: Partial<Course>): Promise<Course> => {
  const response: any = await apiPost('/course/actions', {
    action: 'create-course',
    courseData,
  });
  return response?.data;
};

export const updateCourse = async (
  courseId: string,
  courseData: Partial<Course>
): Promise<Course> => {
  const response: any = await apiPost('/course/actions', {
    action: 'update-course',
    courseId,
    courseData,
  });
  return response?.data;
};

export const updateCourseStatus = async (
  courseId: string,
  status: string
): Promise<Course> => {
  const response: any = await apiPost('/course/actions', {
    action: 'update-course-status',
    courseId,
    status,
  });
  return response?.data;
};

export const enrollInCourse = async (
  userId: string,
  courseId: string
): Promise<CourseEnrollment> => {
  const response: any = await apiPost('/course/actions', {
    action: 'enroll-in-course',
    userId,
    courseId,
  });
  return response?.data;
};

export const unenrollFromCourse = async (
  userId: string,
  courseId: string
): Promise<void> => {
  await apiPost('/course/actions', {
    action: 'unenroll-from-course',
    userId,
    courseId,
  });
};

export const completeCourse = async (
  userId: string,
  courseId: string
): Promise<void> => {
  await apiPost('/course/actions', {
    action: 'complete-course',
    userId,
    courseId,
  });
};

export const updateCourseProgress = async (
  userId: string,
  courseId: string,
  progressData: {
    completedLessons: number;
    totalLessons: number;
    progressPercentage: number;
  }
): Promise<void> => {
  await apiPost('/course/actions', {
    action: 'update-course-progress',
    userId,
    courseId,
    ...progressData,
  });
};

export const markLessonComplete = async (
  userId: string,
  courseId: string,
  lessonId: string
): Promise<void> => {
  await apiPost('/course/actions', {
    action: 'mark-lesson-complete',
    userId,
    courseId,
    lessonId,
  });
};

export const createCourseModule = async (
  moduleData: Partial<CourseModule>
): Promise<CourseModule> => {
  const response: any = await apiPost('/course/actions', {
    action: 'create-course-module',
    moduleData,
  });
  return response?.data;
};

export const updateCourseModule = async (
  moduleId: string,
  moduleData: Partial<CourseModule>
): Promise<CourseModule> => {
  const response: any = await apiPost('/course/actions', {
    action: 'update-course-module',
    moduleId,
    moduleData,
  });
  return response?.data;
};

export const deleteCourseModule = async (moduleId: string): Promise<void> => {
  await apiPost('/course/actions', {
    action: 'delete-course-module',
    moduleId,
  });
};
