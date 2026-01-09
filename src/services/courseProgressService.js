import { supabase } from '../lib/supabaseClient';

/**
 * Course Progress Tracking Service
 * Handles granular progress tracking including video position, lesson progress,
 * quiz state, and session restoration functionality.
 */
export const courseProgressService = {
  // ═══════════════════════════════════════════════════════════════════════════
  // VIDEO PROGRESS METHODS
  // ═══════════════════════════════════════════════════════════════════════════

  /**
   * Save video playback position for resume functionality
   */
  async saveVideoPosition(studentId, courseId, lessonId, positionSeconds, durationSeconds) {
    try {
      if (!studentId || !courseId || !lessonId) {
        return { success: false, error: 'Missing required parameters' };
      }

      // Validate position
      if (typeof positionSeconds !== 'number' || positionSeconds < 0) {
        return { success: false, error: 'Invalid position value' };
      }

      const videoCompleted = durationSeconds > 0 && (positionSeconds / durationSeconds) >= 0.9;

      const { error } = await supabase
        .from('student_course_progress')
        .upsert({
          student_id: studentId,
          course_id: courseId,
          lesson_id: lessonId,
          video_position_seconds: Math.floor(positionSeconds),
          video_duration_seconds: Math.floor(durationSeconds || 0),
          video_completed: videoCompleted,
          last_accessed: new Date().toISOString(),
          status: videoCompleted ? 'completed' : 'in_progress'
        }, {
          onConflict: 'student_id,course_id,lesson_id'
        });

      if (error) throw error;
      return { success: true };
    } catch (error) {
      console.error('Error saving video position:', error);
      return { success: false, error: error.message };
    }
  },

  /**
   * Get saved video position for resume
   */
  async getVideoPosition(studentId, courseId, lessonId) {
    try {
      if (!studentId || !courseId || !lessonId) return null;

      const { data, error } = await supabase
        .from('student_course_progress')
        .select('video_position_seconds, video_duration_seconds, video_completed')
        .eq('student_id', studentId)
        .eq('course_id', courseId)
        .eq('lesson_id', lessonId)
        .maybeSingle();

      if (error) throw error;
      return data || null;
    } catch (error) {
      console.error('Error getting video position:', error);
      return null;
    }
  },

  /**
   * Mark video as completed
   */
  async markVideoCompleted(studentId, courseId, lessonId) {
    try {
      const { error } = await supabase
        .from('student_course_progress')
        .upsert({
          student_id: studentId,
          course_id: courseId,
          lesson_id: lessonId,
          video_completed: true,
          status: 'completed',
          completed_at: new Date().toISOString(),
          last_accessed: new Date().toISOString()
        }, {
          onConflict: 'student_id,course_id,lesson_id'
        });

      if (error) throw error;
      return { success: true };
    } catch (error) {
      console.error('Error marking video completed:', error);
      return { success: false, error: error.message };
    }
  },

  // ═══════════════════════════════════════════════════════════════════════════
  // SESSION RESTORE METHODS
  // ═══════════════════════════════════════════════════════════════════════════

  /**
   * Save current position for session restore
   */
  async saveRestorePoint(studentId, courseId, moduleIndex, lessonIndex, lessonId, videoPosition = 0) {
    try {
      if (!studentId || !courseId) {
        return { success: false, error: 'Missing required parameters' };
      }

      console.log('💾 Saving restore point:', { studentId, courseId, moduleIndex, lessonIndex, lessonId });

      const { error } = await supabase
        .from('course_enrollments')
        .update({
          last_module_index: moduleIndex,
          last_lesson_index: lessonIndex,
          last_lesson_id: lessonId,
          last_video_position: Math.floor(videoPosition),
          last_accessed: new Date().toISOString()
        })
        .eq('student_id', studentId)
        .eq('course_id', courseId);

      if (error) {
        console.error('❌ Error saving restore point:', error);
        throw error;
      }
      
      console.log('✅ Restore point saved successfully');
      return { success: true };
    } catch (error) {
      console.error('Error saving restore point:', error);
      return { success: false, error: error.message };
    }
  },

  /**
   * Get restore point for course re-entry
   */
  async getRestorePoint(studentId, courseId) {
    try {
      if (!studentId || !courseId) return null;

      const { data, error } = await supabase
        .from('course_enrollments')
        .select(`
          course_id,
          last_module_index,
          last_lesson_index,
          last_lesson_id,
          last_video_position,
          progress,
          last_accessed,
          status,
          course_title
        `)
        .eq('student_id', studentId)
        .eq('course_id', courseId)
        .maybeSingle();

      if (error) throw error;
      
      // Only return restore point if there's actual progress
      if (data && data.progress > 0 && data.progress < 100) {
        return {
          courseId: data.course_id,
          lastModuleIndex: data.last_module_index || 0,
          lastLessonIndex: data.last_lesson_index || 0,
          lastLessonId: data.last_lesson_id,
          lastVideoPosition: data.last_video_position || 0,
          progress: data.progress,
          lastAccessed: data.last_accessed,
          courseTitle: data.course_title
        };
      }
      return null;
    } catch (error) {
      console.error('Error getting restore point:', error);
      return null;
    }
  },

  /**
   * Clear restore point (when user chooses "Start Fresh")
   */
  async clearRestorePoint(studentId, courseId) {
    try {
      const { error } = await supabase
        .from('course_enrollments')
        .update({
          last_module_index: 0,
          last_lesson_index: 0,
          last_lesson_id: null,
          last_video_position: 0
        })
        .eq('student_id', studentId)
        .eq('course_id', courseId);

      if (error) throw error;
      return { success: true };
    } catch (error) {
      console.error('Error clearing restore point:', error);
      return { success: false, error: error.message };
    }
  },

  // ═══════════════════════════════════════════════════════════════════════════
  // LESSON PROGRESS METHODS
  // ═══════════════════════════════════════════════════════════════════════════

  /**
   * Get detailed progress for a specific lesson
   */
  async getLessonProgress(studentId, courseId, lessonId) {
    try {
      if (!studentId || !courseId || !lessonId) return null;

      const { data, error } = await supabase
        .from('student_course_progress')
        .select('*')
        .eq('student_id', studentId)
        .eq('course_id', courseId)
        .eq('lesson_id', lessonId)
        .maybeSingle();

      if (error) throw error;
      return data || null;
    } catch (error) {
      console.error('Error getting lesson progress:', error);
      return null;
    }
  },

  /**
   * Update lesson status
   */
  async updateLessonStatus(studentId, courseId, lessonId, status) {
    try {
      const updateData = {
        student_id: studentId,
        course_id: courseId,
        lesson_id: lessonId,
        status: status,
        last_accessed: new Date().toISOString()
      };

      if (status === 'completed') {
        updateData.completed_at = new Date().toISOString();
      }

      const { error } = await supabase
        .from('student_course_progress')
        .upsert(updateData, {
          onConflict: 'student_id,course_id,lesson_id'
        });

      if (error) throw error;
      return { success: true };
    } catch (error) {
      console.error('Error updating lesson status:', error);
      return { success: false, error: error.message };
    }
  },

  /**
   * Save time spent on lesson
   */
  async saveTimeSpent(studentId, courseId, lessonId, additionalSeconds) {
    try {
      // First get current time spent
      const { data: existing } = await supabase
        .from('student_course_progress')
        .select('time_spent_seconds')
        .eq('student_id', studentId)
        .eq('course_id', courseId)
        .eq('lesson_id', lessonId)
        .maybeSingle();

      const currentTime = existing?.time_spent_seconds || 0;
      const newTime = currentTime + additionalSeconds;

      const { error } = await supabase
        .from('student_course_progress')
        .upsert({
          student_id: studentId,
          course_id: courseId,
          lesson_id: lessonId,
          time_spent_seconds: newTime,
          last_accessed: new Date().toISOString()
        }, {
          onConflict: 'student_id,course_id,lesson_id'
        });

      if (error) throw error;
      return { success: true, totalTime: newTime };
    } catch (error) {
      console.error('Error saving time spent:', error);
      return { success: false, error: error.message };
    }
  },

  // ═══════════════════════════════════════════════════════════════════════════
  // QUIZ PROGRESS METHODS
  // ═══════════════════════════════════════════════════════════════════════════

  /**
   * Start or resume a quiz attempt
   */
  async startQuizAttempt(studentId, courseId, lessonId, quizId, totalQuestions) {
    try {
      // Check for existing in-progress attempt
      const { data: existing } = await supabase
        .from('student_quiz_progress')
        .select('*')
        .eq('student_id', studentId)
        .eq('quiz_id', quizId)
        .eq('status', 'in_progress')
        .order('attempt_number', { ascending: false })
        .limit(1)
        .maybeSingle();

      if (existing) {
        return { success: true, data: existing, resumed: true };
      }

      // Get highest attempt number
      const { data: lastAttempt } = await supabase
        .from('student_quiz_progress')
        .select('attempt_number')
        .eq('student_id', studentId)
        .eq('quiz_id', quizId)
        .order('attempt_number', { ascending: false })
        .limit(1)
        .maybeSingle();

      const attemptNumber = (lastAttempt?.attempt_number || 0) + 1;

      // Create new attempt
      const { data, error } = await supabase
        .from('student_quiz_progress')
        .insert({
          student_id: studentId,
          course_id: courseId,
          lesson_id: lessonId,
          quiz_id: quizId,
          attempt_number: attemptNumber,
          total_questions: totalQuestions,
          status: 'in_progress',
          started_at: new Date().toISOString()
        })
        .select()
        .single();

      if (error) throw error;
      return { success: true, data, resumed: false };
    } catch (error) {
      console.error('Error starting quiz attempt:', error);
      return { success: false, error: error.message };
    }
  },

  /**
   * Save quiz answer
   */
  async saveQuizAnswer(studentId, quizId, attemptNumber, questionId, answer) {
    try {
      // Get current answers
      const { data: current } = await supabase
        .from('student_quiz_progress')
        .select('answers, current_question_index')
        .eq('student_id', studentId)
        .eq('quiz_id', quizId)
        .eq('attempt_number', attemptNumber)
        .maybeSingle();

      const answers = current?.answers || {};
      answers[questionId] = answer;

      const { error } = await supabase
        .from('student_quiz_progress')
        .update({
          answers: answers,
          current_question_index: (current?.current_question_index || 0) + 1,
          updated_at: new Date().toISOString()
        })
        .eq('student_id', studentId)
        .eq('quiz_id', quizId)
        .eq('attempt_number', attemptNumber);

      if (error) throw error;
      return { success: true };
    } catch (error) {
      console.error('Error saving quiz answer:', error);
      return { success: false, error: error.message };
    }
  },

  /**
   * Get in-progress quiz for resume
   */
  async getQuizProgress(studentId, quizId) {
    try {
      const { data, error } = await supabase
        .from('student_quiz_progress')
        .select('*')
        .eq('student_id', studentId)
        .eq('quiz_id', quizId)
        .eq('status', 'in_progress')
        .order('attempt_number', { ascending: false })
        .limit(1)
        .maybeSingle();

      if (error) throw error;
      return data || null;
    } catch (error) {
      console.error('Error getting quiz progress:', error);
      return null;
    }
  },

  /**
   * Submit quiz and calculate score
   */
  async submitQuiz(studentId, quizId, attemptNumber, correctAnswers, totalQuestions) {
    try {
      const scorePercentage = totalQuestions > 0 
        ? (correctAnswers / totalQuestions) * 100 
        : 0;
      const passed = scorePercentage >= 70;

      const { data, error } = await supabase
        .from('student_quiz_progress')
        .update({
          status: 'completed',
          correct_answers: correctAnswers,
          score_percentage: scorePercentage,
          passed: passed,
          completed_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        })
        .eq('student_id', studentId)
        .eq('quiz_id', quizId)
        .eq('attempt_number', attemptNumber)
        .select()
        .single();

      if (error) throw error;

      // Embedding regeneration handled by database trigger on student_quiz_progress

      return { success: true, data, score: scorePercentage, passed };
    } catch (error) {
      console.error('Error submitting quiz:', error);
      return { success: false, error: error.message };
    }
  },

  // ═══════════════════════════════════════════════════════════════════════════
  // SUMMARY & ANALYTICS METHODS
  // ═══════════════════════════════════════════════════════════════════════════

  /**
   * Get comprehensive course progress summary
   */
  async getCourseProgressSummary(studentId, courseId) {
    try {
      // Get enrollment data
      const { data: enrollment, error: enrollError } = await supabase
        .from('course_enrollments')
        .select('*')
        .eq('student_id', studentId)
        .eq('course_id', courseId)
        .maybeSingle();

      if (enrollError) throw enrollError;

      // Get all lesson progress
      const { data: lessonProgress, error: progressError } = await supabase
        .from('student_course_progress')
        .select('*')
        .eq('student_id', studentId)
        .eq('course_id', courseId);

      if (progressError) throw progressError;

      // Calculate totals
      const completedLessons = lessonProgress?.filter(l => l.status === 'completed').length || 0;
      const totalTimeSpent = lessonProgress?.reduce((acc, l) => acc + (l.time_spent_seconds || 0), 0) || 0;

      return {
        courseId,
        overallProgress: enrollment?.progress || 0,
        completedLessons,
        totalLessons: enrollment?.total_lessons || 0,
        totalTimeSpent,
        lastAccessed: enrollment?.last_accessed,
        status: enrollment?.status || 'not_started',
        restorePoint: enrollment ? {
          lastModuleIndex: enrollment.last_module_index || 0,
          lastLessonIndex: enrollment.last_lesson_index || 0,
          lastLessonId: enrollment.last_lesson_id,
          lastVideoPosition: enrollment.last_video_position || 0
        } : null,
        lessonProgress: lessonProgress || []
      };
    } catch (error) {
      console.error('Error getting course progress summary:', error);
      return null;
    }
  },

  /**
   * Get progress for all enrolled courses
   */
  async getAllCoursesProgress(studentId) {
    try {
      const { data, error } = await supabase
        .from('course_enrollments')
        .select(`
          course_id,
          course_title,
          progress,
          status,
          last_accessed,
          last_module_index,
          last_lesson_index,
          total_lessons,
          completed_lessons
        `)
        .eq('student_id', studentId)
        .order('last_accessed', { ascending: false });

      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error('Error getting all courses progress:', error);
      return [];
    }
  },

  /**
   * Update total time spent on course
   */
  async updateCourseTotalTime(studentId, courseId, additionalSeconds) {
    try {
      const { data: current } = await supabase
        .from('course_enrollments')
        .select('total_time_spent_seconds')
        .eq('student_id', studentId)
        .eq('course_id', courseId)
        .maybeSingle();

      const newTotal = (current?.total_time_spent_seconds || 0) + additionalSeconds;

      const { error } = await supabase
        .from('course_enrollments')
        .update({
          total_time_spent_seconds: newTotal,
          last_accessed: new Date().toISOString()
        })
        .eq('student_id', studentId)
        .eq('course_id', courseId);

      if (error) throw error;
      return { success: true, totalTime: newTotal };
    } catch (error) {
      console.error('Error updating course total time:', error);
      return { success: false, error: error.message };
    }
  }
};

export default courseProgressService;
