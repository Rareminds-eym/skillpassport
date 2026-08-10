
/**
 * External Assessment Service
 * Handles external course assessment attempts
 */
import { apiPost, apiPut } from '@/shared/api/apiClient';

/**
 * Check if learner has already completed or has in-progress assessment
 * @param {string} learnerId - Learner UUID
 * @param {string} courseName - Course name
 * @returns {Promise<{status: string, attempt: object|null}>}
 */
export async function checkAssessmentStatus(learnerId, courseName) {
  try {
    const envelope = await apiPost('/external-assessment/actions', {
      action: 'check-status', learnerId, courseName,
    });
    const result = envelope?.data;

    if (!result || !result.attempt) {
      console.log('ℹ️ checkAssessmentStatus: No attempt found');
      return { status: 'not_started', attempt: null };
    }

    console.log('📊 checkAssessmentStatus: Found attempt in database:', {
      id: result.attempt.id,
      status: result.attempt.status,
      current_question_index: result.attempt.current_question_index,
      time_remaining: result.attempt.time_remaining,
      last_activity_at: result.attempt.last_activity_at,
      answeredCount: result.attempt.learner_answers?.filter(a => a.selected_answer !== null).length
    });

    return { status: result.status, attempt: result.attempt };
  } catch (error) {
    console.error('Error checking assessment status:', error);
    return { status: 'not_started', attempt: null };
  }
}

/**
 * Create new assessment attempt (save questions on first load)
 * @param {object} attemptData - Initial assessment data
 * @returns {Promise<{success: boolean, data: object|null, error: string|null}>}
 */
export async function createAssessmentAttempt(attemptData) {
  try {
    const { learnerId, courseName, courseId, assessmentLevel, questions } = attemptData;

    const envelope = await apiPost('/external-assessment/actions', {
      action: 'create-attempt', learnerId, courseName, courseId, assessmentLevel, questions,
    });

    return { success: true, data: envelope?.data || null, error: null };
  } catch (error) {
    if (error.status === 409) {
      return { success: false, data: null, error: 'Assessment already exists for this course' };
    }
    console.error('Error creating assessment attempt:', error);
    return { success: false, data: null, error: error.message || 'Failed to create assessment attempt' };
  }
}

/**
 * Update assessment progress (save answer and move forward)
 * @param {string} attemptId - Attempt UUID
 * @param {number} questionIndex - Index of question being answered (0-based)
 * @param {string} answer - Selected answer
 * @param {number} timeRemaining - Seconds remaining
 * @param {number} resumeFromIndex - Index to resume from (optional, defaults to questionIndex + 1)
 * @returns {Promise<{success: boolean}>}
 */
export async function updateAssessmentProgress(attemptId, questionIndex, answer, timeRemaining, resumeFromIndex = null) {
  const resumeIndex = resumeFromIndex !== null ? resumeFromIndex : questionIndex + 1;

  console.log('📡 updateAssessmentProgress called:', {
    attemptId, questionIndex, answer, timeRemaining, resumeFromIndex: resumeIndex
  });

  try {
    await apiPost('/external-assessment/actions', {
      action: 'update-progress',
      attemptId,
      questionIndex,
      answer,
      timeRemaining,
      resumeFromIndex: resumeIndex,
    });

    console.log('✅ Database updated successfully!', {
      answeredQuestionIndex: questionIndex,
      savedResumeIndex: resumeIndex
    });
    return { success: true };
  } catch (error) {
    console.error('❌ Error updating assessment progress:', error);
    return { success: false, error: error.message };
  }
}

/**
 * Complete assessment and calculate score
 * @param {string} attemptId - Attempt UUID
 * @param {number} timeTaken - Total time in seconds
 * @returns {Promise<{success: boolean, score: number|null}>}
 */
export async function completeAssessment(attemptId, timeTaken) {
  try {
    const envelope = await apiPost('/external-assessment/actions', {
      action: 'complete', attemptId, timeTaken,
    });

    return { success: true, score: envelope?.data?.score ?? null };
  } catch (error) {
    console.error('Error completing assessment:', error);
    return { success: false, score: null };
  }
}

/**
 * Apply the outcome of a completed assessment to the linked training record.
 * Auto-approves the training when the learner passed. Routed through the
 * backend Pages Function (not a direct Supabase write) per the project's
 * backend-first architecture for write operations on `trainings`.
 * @param {string} learnerId - Learner UUID
 * @param {string} trainingId - Training UUID (the course/training this assessment was taken for)
 * @param {number} score - Percentage score (0-100)
 * @param {boolean} passed - Whether the learner met the passing threshold
 * @returns {Promise<{success: boolean, updated?: boolean, error?: string}>}
 */
export async function updateTrainingAfterAssessment(learnerId, trainingId, score, passed) {
  try {
    const result = await apiPut('/learners/trainings', {
      learnerId,
      trainingId,
      score,
      passed,
    });

    return { success: true, ...result?.data };
  } catch (error) {
    console.error('Error updating training after assessment:', error);
    return { success: false, error: error.message || 'Failed to update training status' };
  }
}

/**
 * Save assessment attempt to database
 * @param {object} attemptData - Assessment attempt data
 * @returns {Promise<{success: boolean, data: object|null, error: string|null}>}
 */
export async function saveAssessmentAttempt(attemptData) {
  try {
    const {
      learnerId,
      courseName,
      courseId,
      assessmentLevel,
      questions,
      learnerAnswers,
      score,
      correctAnswers,
      timeTaken,
      difficultyBreakdown,
      startedAt,
      completedAt
    } = attemptData;

    const envelope = await apiPost('/external-assessment/actions', {
      action: 'create-attempt',
      learnerId,
      courseName,
      courseId,
      assessmentLevel,
      questions,
      learnerAnswers,
      score,
      correctAnswers,
      timeTaken,
      difficultyBreakdown,
      startedAt,
      completedAt,
    });

    return { success: true, data: envelope?.data || null, error: null };
  } catch (error) {
    if (error.status === 409) {
      return { success: false, data: null, error: 'You have already completed this assessment' };
    }
    console.error('Error saving assessment attempt:', error);
    return { success: false, data: null, error: error.message || 'Failed to save assessment attempt' };
  }
}

/**
 * Get learner's assessment history
 * @param {string} learnerId - Learner UUID
 * @returns {Promise<Array>}
 */
export async function getAssessmentHistory(learnerId) {
  try {
    const envelope = await apiPost('/external-assessment/actions', {
      action: 'history', learnerId,
    });
    return envelope?.data || [];
  } catch (error) {
    console.error('Error fetching assessment history:', error);
    return [];
  }
}

/**
 * Get assessment attempt by course
 * @param {string} learnerId - Learner UUID
 * @param {string} courseName - Course name
 * @returns {Promise<object|null>}
 */
export async function getAssessmentByCourse(learnerId, courseName) {
  try {
    const envelope = await apiPost('/external-assessment/actions', {
      action: 'get-by-course', learnerId, courseName,
    });
    return envelope?.data || null;
  } catch (error) {
    console.error('Error fetching assessment:', error);
    return null;
  }
}
