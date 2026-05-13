import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { courseProgressService } from '@/features/courses';
import { queryKeys } from '@/shared/lib/queryKeys';

/**
 * Hook for managing video progress tracking
 */
export const useVideoProgress = (
  learnerId: string | null,
  courseId: string | null,
  lessonId: string | null
) => {
  const queryClient = useQueryClient();

  // Query for getting saved video position
  const positionQuery = useQuery({
    queryKey: queryKeys.courses.progress.videoPosition(learnerId, courseId, lessonId),
    queryFn: async () => {
      if (!learnerId || !courseId || !lessonId) return null;
      return await courseProgressService.getVideoPosition(learnerId, courseId, lessonId);
    },
    enabled: !!learnerId && !!courseId && !!lessonId,
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
      if (!learnerId || !courseId || !lessonId) {
        throw new Error('Missing required parameters');
      }
      return await courseProgressService.saveVideoPosition(
        learnerId,
        courseId,
        lessonId,
        position,
        duration
      );
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.courses.progress.videoPosition(learnerId, courseId, lessonId) });
      queryClient.invalidateQueries({ queryKey: queryKeys.courses.progress.byLesson(learnerId, courseId, lessonId) });
    },
  });

  // Mutation for marking video as completed
  const markCompletedMutation = useMutation({
    mutationFn: async () => {
      if (!learnerId || !courseId || !lessonId) {
        throw new Error('Missing required parameters');
      }
      return await courseProgressService.markVideoCompleted(learnerId, courseId, lessonId);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.courses.progress.videoPosition(learnerId, courseId, lessonId) });
      queryClient.invalidateQueries({ queryKey: queryKeys.courses.progress.byLesson(learnerId, courseId, lessonId) });
      queryClient.invalidateQueries({ queryKey: queryKeys.courses.progress.summary(learnerId, courseId) });
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
export const useRestorePoint = (learnerId: string | null, courseId: string | null) => {
  const queryClient = useQueryClient();

  // Query for getting restore point
  const restoreQuery = useQuery({
    queryKey: queryKeys.courses.progress.restorePoint(learnerId, courseId),
    queryFn: async () => {
      if (!learnerId || !courseId) return null;
      return await courseProgressService.getRestorePoint(learnerId, courseId);
    },
    enabled: !!learnerId && !!courseId,
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
      if (!learnerId || !courseId) {
        throw new Error('Missing required parameters');
      }
      return await courseProgressService.saveRestorePoint(
        learnerId,
        courseId,
        moduleIndex,
        lessonIndex,
        lessonId,
        videoPosition
      );
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.courses.progress.restorePoint(learnerId, courseId) });
    },
  });

  // Mutation for clearing restore point
  const clearRestoreMutation = useMutation({
    mutationFn: async () => {
      if (!learnerId || !courseId) {
        throw new Error('Missing required parameters');
      }
      return await courseProgressService.clearRestorePoint(learnerId, courseId);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.courses.progress.restorePoint(learnerId, courseId) });
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
  learnerId: string | null,
  courseId: string | null,
  lessonId: string | null
) => {
  const queryClient = useQueryClient();

  // Query for getting lesson progress
  const progressQuery = useQuery({
    queryKey: queryKeys.courses.progress.byLesson(learnerId, courseId, lessonId),
    queryFn: async () => {
      if (!learnerId || !courseId || !lessonId) return null;
      return await courseProgressService.getLessonProgress(learnerId, courseId, lessonId);
    },
    enabled: !!learnerId && !!courseId && !!lessonId,
    staleTime: 30 * 1000, // 30 seconds
  });

  // Mutation for updating lesson status
  const updateStatusMutation = useMutation({
    mutationFn: async (status: string) => {
      if (!learnerId || !courseId || !lessonId) {
        throw new Error('Missing required parameters');
      }
      return await courseProgressService.updateLessonStatus(learnerId, courseId, lessonId, status);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.courses.progress.byLesson(learnerId, courseId, lessonId) });
      queryClient.invalidateQueries({ queryKey: queryKeys.courses.progress.summary(learnerId, courseId) });
    },
  });

  // Mutation for saving time spent
  const saveTimeMutation = useMutation({
    mutationFn: async (additionalSeconds: number) => {
      if (!learnerId || !courseId || !lessonId) {
        throw new Error('Missing required parameters');
      }
      return await courseProgressService.saveTimeSpent(learnerId, courseId, lessonId, additionalSeconds);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.courses.progress.byLesson(learnerId, courseId, lessonId) });
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
export const useQuizProgress = (learnerId: string | null, quizId: string | null) => {
  const queryClient = useQueryClient();

  // Query for getting in-progress quiz
  const quizQuery = useQuery({
    queryKey: queryKeys.courses.progress.quiz(learnerId, quizId),
    queryFn: async () => {
      if (!learnerId || !quizId) return null;
      return await courseProgressService.getQuizProgress(learnerId, quizId);
    },
    enabled: !!learnerId && !!quizId,
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
      if (!learnerId || !quizId) {
        throw new Error('Missing required parameters');
      }
      return await courseProgressService.startQuizAttempt(
        learnerId,
        courseId,
        lessonId,
        quizId,
        totalQuestions
      );
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.courses.progress.quiz(learnerId, quizId) });
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
      if (!learnerId || !quizId) {
        throw new Error('Missing required parameters');
      }
      return await courseProgressService.saveQuizAnswer(
        learnerId,
        quizId,
        attemptNumber,
        questionId,
        answer
      );
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.courses.progress.quiz(learnerId, quizId) });
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
      if (!learnerId || !quizId) {
        throw new Error('Missing required parameters');
      }
      return await courseProgressService.submitQuiz(
        learnerId,
        quizId,
        attemptNumber,
        correctAnswers,
        totalQuestions
      );
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.courses.progress.quiz(learnerId, quizId) });
      queryClient.invalidateQueries({ queryKey: queryKeys.courses.progress.summary(learnerId, courseId) });
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
export const useCourseProgressSummary = (learnerId: string | null, courseId: string | null) => {
  const query = useQuery({
    queryKey: queryKeys.courses.progress.summary(learnerId, courseId),
    queryFn: async () => {
      if (!learnerId || !courseId) return null;
      return await courseProgressService.getCourseProgressSummary(learnerId, courseId);
    },
    enabled: !!learnerId && !!courseId,
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
export const useAllCoursesProgress = (learnerId: string | null) => {
  const query = useQuery({
    queryKey: queryKeys.courses.progress.allByLearner(learnerId),
    queryFn: async () => {
      if (!learnerId) return [];
      return await courseProgressService.getAllCoursesProgress(learnerId);
    },
    enabled: !!learnerId,
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
