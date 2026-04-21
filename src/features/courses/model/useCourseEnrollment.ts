import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { enrollmentService } from '../api/enrollmentService';
import { queryKeys } from '@/shared/lib/queryKeys';

/**
 * Hook for managing course enrollment operations
 */
export const useCourseEnrollment = (studentEmail: string | null, courseId: string | null) => {
  const queryClient = useQueryClient();

  // Query for checking enrollment status
  const enrollmentQuery = useQuery({
    queryKey: queryKeys.courses.enrollment.byStudentAndCourse(studentEmail, courseId),
    queryFn: async () => {
      if (!studentEmail || !courseId) return null;
      const result = await enrollmentService.getEnrollment(studentEmail, courseId);
      return result.success ? result.data : null;
    },
    enabled: !!studentEmail && !!courseId,
    staleTime: 30 * 1000, // 30 seconds
  });

  // Mutation for enrolling in a course
  const enrollMutation = useMutation({
    mutationFn: async ({ email, course }: { email: string; course: string }) => {
      const result = await enrollmentService.enrollStudent(email, course);
      if (!result.success) {
        throw new Error(result.error || 'Failed to enroll');
      }
      return result.data;
    },
    onSuccess: () => {
      // Invalidate enrollment queries
      queryClient.invalidateQueries({ queryKey: queryKeys.courses.enrollment.all });
    },
  });

  // Mutation for updating progress
  const updateProgressMutation = useMutation({
    mutationFn: async ({
      email,
      course,
      completedLessons
    }: {
      email: string;
      course: string;
      completedLessons: string[]
    }) => {
      const result = await enrollmentService.updateProgress(email, course, completedLessons);
      if (!result.success) {
        throw new Error(result.error || 'Failed to update progress');
      }
      return result.data;
    },
    onSuccess: () => {
      // Invalidate enrollment queries
      queryClient.invalidateQueries({ queryKey: queryKeys.courses.enrollment.all });
      queryClient.invalidateQueries({ queryKey: queryKeys.courses.progress.all });
    },
  });

  return {
    // Enrollment data
    enrollment: enrollmentQuery.data,
    isEnrolled: !!enrollmentQuery.data,
    isLoading: enrollmentQuery.isLoading,
    isError: enrollmentQuery.isError,
    error: enrollmentQuery.error,

    // Enrollment actions
    enroll: enrollMutation.mutate,
    enrollAsync: enrollMutation.mutateAsync,
    isEnrolling: enrollMutation.isPending,
    enrollError: enrollMutation.error,

    // Progress update actions
    updateProgress: updateProgressMutation.mutate,
    updateProgressAsync: updateProgressMutation.mutateAsync,
    isUpdatingProgress: updateProgressMutation.isPending,
    updateProgressError: updateProgressMutation.error,

    // Refetch
    refetch: enrollmentQuery.refetch,
  };
};

/**
 * Hook for fetching all enrollments for a student
 */
export const useStudentEnrollments = (studentEmail: string | null) => {
  const query = useQuery({
    queryKey: queryKeys.courses.enrollment.byStudent(studentEmail),
    queryFn: async () => {
      if (!studentEmail) return [];
      const result = await enrollmentService.getStudentEnrollments(studentEmail);
      return result.success ? result.data : [];
    },
    enabled: !!studentEmail,
    staleTime: 30 * 1000, // 30 seconds
  });

  return {
    enrollments: query.data || [],
    isLoading: query.isLoading,
    isError: query.isError,
    error: query.error,
    refetch: query.refetch,
  };
};

/**
 * Hook for fetching all enrollments for a course (educator view)
 */
export const useCourseEnrollments = (courseId: string | null) => {
  const query = useQuery({
    queryKey: queryKeys.courses.enrollment.byCourse(courseId),
    queryFn: async () => {
      if (!courseId) return [];
      const result = await enrollmentService.getCourseEnrollments(courseId);
      return result.success ? result.data : [];
    },
    enabled: !!courseId,
    staleTime: 30 * 1000, // 30 seconds
  });

  return {
    enrollments: query.data || [],
    isLoading: query.isLoading,
    isError: query.isError,
    error: query.error,
    refetch: query.refetch,
  };
};

/**
 * Hook for fetching enrollment statistics for an educator
 */
export const useEducatorEnrollmentStats = (educatorId: string | null) => {
  const query = useQuery({
    queryKey: queryKeys.courses.enrollment.educatorStats(educatorId),
    queryFn: async () => {
      if (!educatorId) return null;
      const result = await enrollmentService.getEducatorEnrollmentStats(educatorId);
      return result.success ? result.data : null;
    },
    enabled: !!educatorId,
    staleTime: 60 * 1000, // 1 minute
  });

  return {
    stats: query.data,
    isLoading: query.isLoading,
    isError: query.isError,
    error: query.error,
    refetch: query.refetch,
  };
};
