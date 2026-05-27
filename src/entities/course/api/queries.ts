/**
 * Course Entity - API Queries
 * Data fetching functions for course data
 */

import { supabase } from '@/shared/api';
import type { Course, CourseEnrollment, CourseProgress, CourseFilters } from '../model/types';

// ============================================================================
// Course Queries
// ============================================================================

export const getCourses = async (filters?: CourseFilters): Promise<Course[]> => {
  let query = supabase
    .from('courses')
    .select('*')
    .order('createdAt', { ascending: false });

  if (filters?.category) {
    query = query.eq('category', filters.category);
  }

  if (filters?.skillType) {
    query = query.eq('skillType', filters.skillType);
  }

  if (filters?.status) {
    query = query.eq('status', filters.status);
  }

  if (filters?.search) {
    query = query.or(
      `title.ilike.%${filters.search}%,description.ilike.%${filters.search}%,code.ilike.%${filters.search}%`
    );
  }

  const { data, error } = await query;
  if (error) throw error;
  return data || [];
};


export const getActiveCourses = async (): Promise<Course[]> => {
  const { data, error } = await supabase
    .from('courses')
    .select('*')
    .eq('status', 'Active')
    .order('title', { ascending: true });

  if (error) throw error;
  return data || [];
};

// ============================================================================
// Course Enrollment Queries
// ============================================================================

export const getUserEnrollments = async (userId: string): Promise<CourseEnrollment[]> => {
  const { data, error } = await supabase
    .from('course_enrollments')
    .select('*')
    .eq('userId', userId)
    .order('enrolledAt', { ascending: false });


  if (error) throw error;
  return data || [];
};

export const isUserEnrolled = async (
  userId: string,
  courseId: string
): Promise<boolean> => {
  const { data, error } = await supabase
    .from('course_enrollments')
    .select('id')
    .eq('userId', userId)
    .eq('courseId', courseId)
    .maybeSingle();

  if (error) throw error;
  return data !== null;
};

// ============================================================================
// Course Progress Queries
// ============================================================================

export const getCourseProgress = async (
  userId: string,
  courseId: string
): Promise<CourseProgress | null> => {
  const { data, error } = await supabase
    .from('course_progress')
    .select('*')
    .eq('userId', userId)
    .eq('courseId', courseId)
    .maybeSingle();

  if (error) throw error;
  return data;
};

export const getUserCourseProgress = async (
  userId: string
): Promise<CourseProgress[]> => {
  const { data, error } = await supabase
    .from('course_progress')
    .select('*')
    .eq('userId', userId)
    .order('lastAccessedAt', { ascending: false });

  if (error) throw error;
  return data || [];
};

// ============================================================================
// Course Analytics Queries
// ============================================================================

export const getCourseAnalytics = async (courseId: string): Promise<any> => {
  const { data, error } = await supabase
    .from('course_analytics')
    .select('*')
    .eq('courseId', courseId)
    .maybeSingle();

  if (error) throw error;
  return data;
};

// ============================================================================
// Course Modules Queries
// ============================================================================

export const getCourseModules = async (courseId: string): Promise<any[]> => {
  const { data, error } = await supabase
    .from('course_modules')
    .select('*')
    .eq('courseId', courseId)
    .order('order', { ascending: true });

  if (error) throw error;
  return data || [];
};

export const getCourseModule = async (moduleId: string): Promise<any | null> => {
  const { data, error } = await supabase
    .from('course_modules')
    .select('*')
    .eq('id', moduleId)
    .maybeSingle();

  if (error) throw error;
  return data;
};
