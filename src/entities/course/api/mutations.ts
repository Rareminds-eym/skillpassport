/**
 * Course Entity - API Mutations
 * Data modification functions for course data
 */

import { supabase } from '@/shared/api';
import type { Course, CourseEnrollment, CourseModule } from '../model/types';

// ============================================================================
// Course Mutations
// ============================================================================

export const createCourse = async (courseData: Partial<Course>): Promise<Course> => {
  const { data, error } = await supabase
    .from('courses')
    .insert(courseData)
    .select()
    .single();

  if (error) throw error;
  return data;
};

export const updateCourse = async (
  courseId: string,
  courseData: Partial<Course>
): Promise<Course> => {
  const { data, error } = await supabase
    .from('courses')
    .update(courseData)
    .eq('id', courseId)
    .select()
    .single();

  if (error) throw error;
  return data;
};


export const updateCourseStatus = async (
  courseId: string,
  status: string
): Promise<Course> => {
  const { data, error } = await supabase
    .from('courses')
    .update({ status })
    .eq('id', courseId)
    .select()
    .single();

  if (error) throw error;
  return data;
};

// ============================================================================
// Course Enrollment Mutations
// ============================================================================

export const enrollInCourse = async (
  userId: string,
  courseId: string
): Promise<CourseEnrollment> => {
  const { data, error } = await supabase
    .from('course_enrollments')
    .insert({
      userId,
      courseId,
      enrolledAt: new Date().toISOString(),
      status: 'active',
    })
    .select()
    .single();

  if (error) throw error;
  return data;
};

export const unenrollFromCourse = async (
  userId: string,
  courseId: string
): Promise<void> => {
  const { error } = await supabase
    .from('course_enrollments')
    .update({ status: 'dropped' })
    .eq('userId', userId)
    .eq('courseId', courseId);

  if (error) throw error;
};

export const completeCourse = async (
  userId: string,
  courseId: string
): Promise<void> => {
  const { error } = await supabase
    .from('course_enrollments')
    .update({
      status: 'completed',
      completedAt: new Date().toISOString(),
    })
    .eq('userId', userId)
    .eq('courseId', courseId);

  if (error) throw error;
};

// ============================================================================
// Course Progress Mutations
// ============================================================================

export const updateCourseProgress = async (
  userId: string,
  courseId: string,
  progressData: {
    completedLessons: number;
    totalLessons: number;
    progressPercentage: number;
  }
): Promise<void> => {
  const { error } = await supabase
    .from('course_progress')
    .upsert({
      userId,
      courseId,
      ...progressData,
      lastAccessedAt: new Date().toISOString(),
    });

  if (error) throw error;
};

export const markLessonComplete = async (
  userId: string,
  courseId: string,
  lessonId: string
): Promise<void> => {
  const { error } = await supabase
    .from('lesson_completions')
    .insert({
      userId,
      courseId,
      lessonId,
      completedAt: new Date().toISOString(),
    });

  if (error) throw error;
};

// ============================================================================
// Course Module Mutations
// ============================================================================

export const createCourseModule = async (
  moduleData: Partial<CourseModule>
): Promise<CourseModule> => {
  const { data, error } = await supabase
    .from('course_modules')
    .insert(moduleData)
    .select()
    .single();

  if (error) throw error;
  return data;
};

export const updateCourseModule = async (
  moduleId: string,
  moduleData: Partial<CourseModule>
): Promise<CourseModule> => {
  const { data, error } = await supabase
    .from('course_modules')
    .update(moduleData)
    .eq('id', moduleId)
    .select()
    .single();

  if (error) throw error;
  return data;
};

export const deleteCourseModule = async (moduleId: string): Promise<void> => {
  const { error } = await supabase
    .from('course_modules')
    .delete()
    .eq('id', moduleId);

  if (error) throw error;
