import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/shared/api/supabaseClient';
import { queryKeys } from '@/shared/lib/queryKeys';

interface CourseFilters {
  category?: string;
  skillType?: string;
  duration?: string;
  search?: string;
  status?: string[];
}

interface UseCourseOptions {
  filters?: CourseFilters;
  limit?: number;
  offset?: number;
  enabled?: boolean;
}

/**
 * Hook for fetching and filtering courses
 * Supports pagination, search, and filtering by category, skill type, duration, and status
 */
export const useCourses = ({
  filters = {},
  limit = 20,
  offset = 0,
  enabled = true
}: UseCourseOptions = {}) => {
  const query = useQuery({
    queryKey: queryKeys.courses.list.filtered(filters, limit, offset),
    queryFn: async () => {
      let query = supabase
        .from('courses')
        .select('*', { count: 'exact' })
        .is('deleted_at', null);

      // Apply status filter (default to Active and Upcoming)
      const statusFilter = filters.status || ['Active', 'Upcoming'];
      query = query.in('status', statusFilter);

      // Apply category filter
      if (filters.category) {
        query = query.eq('category', filters.category);
      }

      // Apply skill type filter
      if (filters.skillType) {
        query = query.eq('skill_type', filters.skillType);
      }

      // Apply duration filter
      if (filters.duration) {
        query = query.eq('duration', filters.duration);
      }

      // Apply search filter
      if (filters.search) {
        query = query.or(`title.ilike.%${filters.search}%,description.ilike.%${filters.search}%,code.ilike.%${filters.search}%`);
      }

      // Apply pagination
      query = query.range(offset, offset + limit - 1);

      // Order by created date
      query = query.order('created_at', { ascending: false });

      const { data, error, count } = await query;

      if (error) throw error;

      return {
        courses: data || [],
        total: count || 0,
      };
    },
    enabled,
    staleTime: 30 * 1000, // 30 seconds
  });

  return {
    courses: query.data?.courses || [],
    total: query.data?.total || 0,
    isLoading: query.isLoading,
    isError: query.isError,
    error: query.error,
    refetch: query.refetch,
  };
};

/**
 * Hook for fetching a single course by ID
 */
export const useCourse = (courseId: string | null, enabled = true) => {
  const query = useQuery({
    queryKey: queryKeys.courses.list.byId(courseId),
    queryFn: async () => {
      if (!courseId) return null;

      const { data, error } = await supabase
        .from('courses')
        .select('*')
        .eq('course_id', courseId)
        .is('deleted_at', null)
        .single();

      if (error) throw error;
      return data;
    },
    enabled: enabled && !!courseId,
    staleTime: 60 * 1000, // 1 minute
  });

  return {
    course: query.data,
    isLoading: query.isLoading,
    isError: query.isError,
    error: query.error,
    refetch: query.refetch,
  };
};

/**
 * Hook for fetching course modules and lessons
 */
export const useCourseModules = (courseId: string | null, enabled = true) => {
  const query = useQuery({
    queryKey: queryKeys.courses.list.modules(courseId),
    queryFn: async () => {
      if (!courseId) return [];

      const { data, error } = await supabase
        .from('course_modules')
        .select(`
          *,
          lessons:lessons!fk_module (*)
        `)
        .eq('course_id', courseId)
        .order('order_index', { ascending: true });

      if (error) throw error;

      // Sort lessons within each module
      const modulesWithSortedLessons = (data || []).map((module: any) => ({
        ...module,
        lessons: (module.lessons || []).sort((a: any, b: any) =>
          (a.order_index || 0) - (b.order_index || 0)
        ),
      }));

      return modulesWithSortedLessons;
    },
    enabled: enabled && !!courseId,
    staleTime: 60 * 1000, // 1 minute
  });

  return {
    modules: query.data || [],
    isLoading: query.isLoading,
    isError: query.isError,
    error: query.error,
    refetch: query.refetch,
  };
};

/**
 * Hook for fetching available filter options
 */
export const useCourseFilterOptions = () => {
  const query = useQuery({
    queryKey: queryKeys.courses.list.filterOptions(),
    queryFn: async () => {
      // Fetch distinct categories
      const { data: categories } = await supabase
        .from('courses')
        .select('category')
        .not('category', 'is', null)
        .is('deleted_at', null);

      // Fetch distinct skill types
      const { data: skillTypes } = await supabase
        .from('courses')
        .select('skill_type')
        .not('skill_type', 'is', null)
        .is('deleted_at', null);

      // Fetch distinct durations
      const { data: durations } = await supabase
        .from('courses')
        .select('duration')
        .not('duration', 'is', null)
        .is('deleted_at', null);

      return {
        categories: [...new Set(categories?.map((c: any) => c.category).filter(Boolean))] as string[],
        skillTypes: [...new Set(skillTypes?.map((s: any) => s.skill_type).filter(Boolean))] as string[],
        durations: [...new Set(durations?.map((d: any) => d.duration).filter(Boolean))] as string[],
      };
    },
    staleTime: 5 * 60 * 1000, // 5 minutes
  });

  return {
    filterOptions: query.data || { categories: [], skillTypes: [], durations: [] },
    isLoading: query.isLoading,
    isError: query.isError,
    error: query.error,
  };
};
