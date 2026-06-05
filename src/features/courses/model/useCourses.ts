import { useQuery } from '@tanstack/react-query';
import { apiGet } from '@/shared/api/apiClient';
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
      const params = new URLSearchParams();
      if (filters.status) params.set('status', filters.status.join(','));
      if (filters.category) params.set('category', filters.category);
      if (filters.skillType) params.set('skillType', filters.skillType);
      if (filters.duration) params.set('duration', filters.duration);
      if (filters.search) params.set('search', filters.search);
      params.set('limit', String(limit));
      params.set('offset', String(offset));

      const response = await apiGet(`/courses/list?${params.toString()}`);
      return {
        courses: response?.data?.courses || [],
        total: response?.data?.total || 0,
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
      const response = await apiGet(`/courses/list/${encodeURIComponent(courseId)}`);
      return response?.data ?? null;
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
      const response = await apiGet(`/courses/list/${encodeURIComponent(courseId)}/modules`);
      return response?.data || [];
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
      const response = await apiGet('/courses/list/filter-options');
      const d = response?.data || { categories: [], skillTypes: [], durations: [] };
      return {
        categories: (d.categories || []) as string[],
        skillTypes: (d.skillTypes || []) as string[],
        durations: (d.durations || []) as string[],
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
