import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { courseProgressService } from '@/features/courses';

/**
 * Hook for managing video progress tracking
 */
export const useVideoProgress = (
  studentId: string | null,
  courseId: string | null,
  lessonId: string | null
) => {
  const queryClient = useQueryClient();

  // Query for getting saved video position
  const positionQuery = useQuery({
    queryKey: ['video-position', studentId, courseId, lessonId],
    queryFn: async () => {
      if (!studentId || !courseId || !lessonId) return null;
      return await courseProgressService.getVideoPosition(studentId, courseId, lessonId);
    },
    enabled: !!studentId && !!courseId && !!lessonId,
    staleTime: 10 * 1000, // 10 seconds
  });

  // Mutation for saving video position
  const savePositionMutation = useMutation({
    mutationFn: async ({ 
      position, 
      duration 
    }: { 
      position: number; 
      duration: number 
    }) => {
      if (!studentId || !courseId || !lessonId) {
        throw new Error('Missing required parameters');
      }
      return await courseProgressService.saveVideoPosition(
        studentId,
        courseId,
        lessonId,
        position,
        duration
      );
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['video-position', studentId, courseId, lessonId] });
      queryClient.invalidateQueries({ queryKey: ['lesson-progress', studentId, courseId, lessonId] });
    },
  });

  // Mutation for marking video as completed
  const markCompletedMutation = useMutation({
    mutationFn: async () => {
      if (!studentId || !courseId || !lessonId) {
        throw new Error('Missing required parameters');
      }
      return await courseProgressService.markVideoCompleted(studentId, courseId, lessonId);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['video-position', studentId, courseId, lessonId] });
      queryClient.invalidateQueries({ queryKey: ['lesson-progress', studentId, courseId, lessonId] });
      queryClient.invalidateQueries({ queryKey: ['course-progress-summary'] });
    },
  });

  return {
    videoPosition: positionQuery.data,
    isLoading: positionQuery.isLoading,
    savePosition: savePositionMutation.mutate,
    savePositionAsync: savePositionMutation.mutateAsync,
    isSaving: savePositionMutation.isPending,
    markCompleted: markCompletedMutation.mutate,
    markCompletedAsync: markCompletedMutation.mutateAsync,
    isMarkingCompleted: markCompletedMutation.isPending,
  };
};

/**
 * Hook for managing session restore points
 */
export const useRestorePoint = (studentId: string | null, courseId: string | null) => {
  const queryClient = useQueryClient();

  // Query for getting restore point
  const restoreQuery = useQuery({
    queryKey: ['restore-point', studentId, courseId],
    queryFn: async () => {
      if (!studentId || !courseId) return null;
      return await courseProgressService.getRestorePoint(studentId, courseId);
    },
    enabled: !!studentId && !!courseId,
    staleTime: 30 * 1000, // 30 seconds
  });

  // Mutation for saving restore point
  const saveRestoreMutation = useMutation({
    mutationFn: async ({ 
      moduleIndex, 
      lessonIndex, 
      lessonId, 
      videoPosition = 0 
    }: { 
      moduleIndex: number; 
      lessonIndex: number; 
      lessonId: string; 
      videoPosition?: number 
    }) => {
      if (!studentId || !courseId) {
        throw new Error('Missing required parameters');
      }
      return await courseProgressService.saveRestorePoint(
        studentId,
        courseId,
        moduleIndex,
        lessonIndex,
        lessonId,
        videoPosition
      );
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['restore-point', studentId, courseId] });
    },
  });

  // Mutation for clearing restore point
  const clearRestoreMutation = useMutation({
    mutationFn: async () => {
      if (!studentId || !courseId) {
        throw new Error('Missing required parameters');
      }
      return await courseProgressService.clearRestorePoint(studentId, courseId);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['restore-point', studentId, courseId] });
    },
  });

  return {
    restorePoint: restoreQuery.data,
    hasRestorePoint: !!restoreQuery.data,
    isLoading: restoreQuery.isLoading,
    saveRestorePoint: saveRestoreMutation.mutate,
    saveRestorePointAsync: saveRestoreMutation.mutateAsync,
    isSaving: saveRestoreMutation.isPending,
    clearRestorePoint: clearRestoreMutation.mutate,
    clearRestorePointAsync: clearRestoreMutation.mutateAsync,
    isClearing: clearRestoreMutation.isPending,
  };
};

/**
 * Hook for managing lesson progress
 */
export const useLessonProgress = (
  studentId: string | null,
  courseId: string | null,
  lessonId: string | null
) => {
  const queryClient = useQueryClient();

  // Query for getting lesson progress
  const progressQuery = useQuery({
    queryKey: ['lesson-progress', studentId, courseId, lessonId],
    queryFn: async () => {
      if (!studentId || !courseId || !lessonId) return null;
      return await courseProgressService.getLessonProgress(studentId, courseId, lessonId);
    },
    enabled: !!studentId && !!courseId && !!lessonId,
    staleTime: 30 * 1000, // 30 seconds
  });

  // Mutation for updating lesson status
  const updateStatusMutation = useMutation({
    mutationFn: async (status: string) => {
      if (!studentId || !courseId || !lessonId) {
        throw new Error('Missing required parameters');
      }
      return await courseProgressService.updateLessonStatus(studentId, courseId, lessonId, status);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['lesson-progress', studentId, courseId, lessonId] });
      queryClient.invalidateQueries({ queryKey: ['course-progress-summary'] });
    },
  });

  // Mutation for saving time spent
  const saveTimeMutation = useMutation({
    mutationFn: async (additionalSeconds: number) => {
      if (!studentId || !courseId || !lessonId) {
        throw new Error('Missing required parameters');
      }
      return await courseProgressService.saveTimeSpent(studentId, courseId, lessonId, additionalSeconds);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['lesson-progress', studentId, courseId, lessonId] });
    },
  });

  return {
    progress: progressQuery.data,
    isLoading: progressQuery.isLoading,
    updateStatus: updateStatusMutation.mutate,
    updateStatusAsync: updateStatusMutation.mutateAsync,
    isUpdatingStatus: updateStatusMutation.isPending,
    saveTimeSpent: saveTimeMutation.mutate,
    saveTimeSpentAsync: saveTimeMutation.mutateAsync,
    isSavingTime: saveTimeMutation.isPending,
  };
};

/**
 * Hook for managing quiz progress
 */
export const useQuizProgress = (studentId: string | null, quizId: string | null) => {
  const queryClient = useQueryClient();

  // Query for getting in-progress quiz
  const quizQuery = useQuery({
    queryKey: ['quiz-progress', studentId, quizId],
    queryFn: async () => {
      if (!studentId || !quizId) return null;
      return await courseProgressService.getQuizProgress(studentId, quizId);
    },
    enabled: !!studentId && !!quizId,
    staleTime: 10 * 1000, // 10 seconds
  });

  // Mutation for starting quiz attempt
  const startQuizMutation = useMutation({
    mutationFn: async ({ 
      courseId, 
      lessonId, 
      totalQuestions 
    }: { 
      courseId: string; 
      lessonId: string; 
      totalQuestions: number 
    }) => {
      if (!studentId || !quizId) {
        throw new Error('Missing required parameters');
      }
      return await courseProgressService.startQuizAttempt(
        studentId,
        courseId,
        lessonId,
        quizId,
        totalQuestions
      );
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['quiz-progress', studentId, quizId] });
    },
  });

  // Mutation for saving quiz answer
  const saveAnswerMutation = useMutation({
    mutationFn: async ({ 
      attemptNumber, 
      questionId, 
      answer 
    }: { 
      attemptNumber: number; 
      questionId: string; 
      answer: any 
    }) => {
      if (!studentId || !quizId) {
        throw new Error('Missing required parameters');
      }
      return await courseProgressService.saveQuizAnswer(
        studentId,
        quizId,
        attemptNumber,
        questionId,
        answer
      );
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['quiz-progress', studentId, quizId] });
    },
  });

  // Mutation for submitting quiz
  const submitQuizMutation = useMutation({
    mutationFn: async ({ 
      attemptNumber, 
      correctAnswers, 
      totalQuestions 
    }: { 
      attemptNumber: number; 
      correctAnswers: number; 
      totalQuestions: number 
    }) => {
      if (!studentId || !quizId) {
        throw new Error('Missing required parameters');
      }
      return await courseProgressService.submitQuiz(
        studentId,
        quizId,
        attemptNumber,
        correctAnswers,
        totalQuestions
      );
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['quiz-progress', studentId, quizId] });
      queryClient.invalidateQueries({ queryKey: ['course-progress-summary'] });
    },
  });

  return {
    quizProgress: quizQuery.data,
    isLoading: quizQuery.isLoading,
    startQuiz: startQuizMutation.mutate,
    startQuizAsync: startQuizMutation.mutateAsync,
    isStarting: startQuizMutation.isPending,
    saveAnswer: saveAnswerMutation.mutate,
    saveAnswerAsync: saveAnswerMutation.mutateAsync,
    isSavingAnswer: saveAnswerMutation.isPending,
    submitQuiz: submitQuizMutation.mutate,
    submitQuizAsync: submitQuizMutation.mutateAsync,
    isSubmitting: submitQuizMutation.isPending,
  };
};

/**
 * Hook for getting comprehensive course progress summary
 */
export const useCourseProgressSummary = (studentId: string | null, courseId: string | null) => {
  const query = useQuery({
    queryKey: ['course-progress-summary', studentId, courseId],
    queryFn: async () => {
      if (!studentId || !courseId) return null;
      return await courseProgressService.getCourseProgressSummary(studentId, courseId);
    },
    enabled: !!studentId && !!courseId,
    staleTime: 30 * 1000, // 30 seconds
  });

  return {
    summary: query.data,
    isLoading: query.isLoading,
    isError: query.isError,
    error: query.error,
    refetch: query.refetch,
  };
};

/**
 * Hook for getting progress across all enrolled courses
 */
export const useAllCoursesProgress = (studentId: string | null) => {
  const query = useQuery({
    queryKey: ['all-courses-progress', studentId],
    queryFn: async () => {
      if (!studentId) return [];
      return await courseProgressService.getAllCoursesProgress(studentId);
    },
    enabled: !!studentId,
    staleTime: 30 * 1000, // 30 seconds
  });

  return {
    coursesProgress: query.data || [],
    isLoading: query.isLoading,
    isError: query.isError,
    error: query.error,
    refetch: query.refetch,
  };
};
