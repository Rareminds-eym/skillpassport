import { supabase } from '@/shared/api/supabaseClient';

/**
 * External Assessment Service
 * Handles external course assessment attempts
 */

/**
 * Check if learner has already completed or has in-progress assessment
 * @param {string} learnerId - Learner UUID
 * @param {string} courseName - Course name
 * @returns {Promise<{status: string, attempt: object|null}>}
 */
export async function checkAssessmentStatus(learnerId, courseName) {
  try {
    // Use maybeSingle() instead of single() to avoid 406 error when no rows exist
    const { data, error } = await supabase
      .from('external_assessment_attempts')
      .select('*')
      .eq('learner_id', learnerId)
      .eq('course_name', courseName)
      .maybeSingle();

    if (error) {
      throw error;
    }

    if (!data) {
      console.log('ℹ️ checkAssessmentStatus: No attempt found');
      return { status: 'not_started', attempt: null };
    }

    console.log('📊 checkAssessmentStatus: Found attempt in database:', {
      id: data.id,
      status: data.status,
      current_question_index: data.current_question_index,
      time_remaining: data.time_remaining,
      last_activity_at: data.last_activity_at,
      answeredCount: data.learner_answers?.filter(a => a.selected_answer !== null).length
    });

    return {
      status: data.status, // 'in_progress' or 'completed'
      attempt: data
    };
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
    const {
      learnerId,
      courseName,
      courseId,
      assessmentLevel,
      questions
    } = attemptData;

    // Initialize empty answers array
    const emptyAnswers = questions.map((q, idx) => ({
      question_id: q.id,
      selected_answer: null,
      is_correct: null,
      time_taken: 0
    }));

    const { data, error } = await supabase
      .from('external_assessment_attempts')
      .insert({
        learner_id: learnerId,
        course_name: courseName,
        course_id: courseId,
        assessment_level: assessmentLevel,
        total_questions: questions.length,
        questions: questions,
        learner_answers: emptyAnswers,
        current_question_index: 0,
        status: 'in_progress',
        time_remaining: 900, // 15 minutes
        started_at: new Date().toISOString()
      })
      .select()
      .single();

    if (error) {
      if (error.code === '23505') {
        return {
          success: false,
          data: null,
          error: 'Assessment already exists for this course'
        };
      }
      throw error;
    }

    return {
      success: true,
      data: data,
      error: null
    };
  } catch (error) {
    console.error('Error creating assessment attempt:', error);
    return {
      success: false,
      data: null,
      error: error.message || 'Failed to create assessment attempt'
    };
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
    attemptId,
    questionIndex,
    answer,
    timeRemaining,
    resumeFromIndex: resumeIndex
  });

  try {
    // First, get current attempt to update answers array
    console.log('📡 Fetching current attempt from database...');
    const { data: currentAttempt, error: fetchError } = await supabase
      .from('external_assessment_attempts')
      .select('learner_answers, questions')
      .eq('id', attemptId)
      .single();

    if (fetchError) {
      console.error('❌ Fetch error:', fetchError);
      throw fetchError;
    }

    console.log('✅ Current attempt fetched:', {
      answersCount: currentAttempt.learner_answers?.length,
      questionsCount: currentAttempt.questions?.length
    });

    // Update the answer for the question at questionIndex
    const updatedAnswers = [...currentAttempt.learner_answers];
    const question = currentAttempt.questions[questionIndex];
    
    // Check correct answer - handle both formats
    const correctAnswer = question.correct_answer || question.correctAnswer;
    
    updatedAnswers[questionIndex] = {
      question_id: question.id,
      selected_answer: answer,
      is_correct: answer === correctAnswer,
      time_taken: updatedAnswers[questionIndex]?.time_taken || 0
    };

    console.log('💾 Saving to database...', {
      updatingAnswerAt: questionIndex,
      resumeFromIndex: resumeIndex
    });
    
    // Update database - save where user should resume from
    const { error: updateError } = await supabase
      .from('external_assessment_attempts')
      .update({
        learner_answers: updatedAnswers,
        current_question_index: resumeIndex, // Save where to resume from
        time_remaining: timeRemaining,
        last_activity_at: new Date().toISOString()
      })
      .eq('id', attemptId);

    if (updateError) {
      console.error('❌ Update error:', updateError);
      throw updateError;
    }

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
    // Get current attempt
    const { data: attempt, error: fetchError } = await supabase
      .from('external_assessment_attempts')
      .select('*')
      .eq('id', attemptId)
      .single();

    if (fetchError) throw fetchError;

    // Calculate score
    const correctCount = attempt.learner_answers.filter(a => a.is_correct).length;
    const score = Math.round((correctCount / attempt.total_questions) * 100);

    // Calculate difficulty breakdown
    const breakdown = {
      easy: { total: 0, correct: 0, percentage: 0 },
      medium: { total: 0, correct: 0, percentage: 0 },
      hard: { total: 0, correct: 0, percentage: 0 }
    };

    attempt.questions.forEach((q, idx) => {
      const difficulty = q.difficulty;
      if (breakdown[difficulty]) {
        breakdown[difficulty].total++;
        if (attempt.learner_answers[idx]?.is_correct) {
          breakdown[difficulty].correct++;
        }
      }
    });

    // Calculate percentages
    Object.keys(breakdown).forEach(key => {
      if (breakdown[key].total > 0) {
        breakdown[key].percentage = Math.round(
          (breakdown[key].correct / breakdown[key].total) * 100
        );
      }
    });

    // Update to completed
    const { error: updateError } = await supabase
      .from('external_assessment_attempts')
      .update({
        status: 'completed',
        score: score,
        correct_answers: correctCount,
        time_taken: timeTaken,
        difficulty_breakdown: breakdown,
        completed_at: new Date().toISOString()
      })
      .eq('id', attemptId);

    if (updateError) throw updateError;

    return { success: true, score: score };
  } catch (error) {
    console.error('Error completing assessment:', error);
    return { success: false, score: null };
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

    const { data, error } = await supabase
      .from('external_assessment_attempts')
      .insert({
        learner_id: learnerId,
        course_name: courseName,
        course_id: courseId,
        assessment_level: assessmentLevel,
        total_questions: questions.length,
        questions: questions,
        learner_answers: learnerAnswers,
        score: score,
        correct_answers: correctAnswers,
        time_taken: timeTaken,
        difficulty_breakdown: difficultyBreakdown,
        started_at: startedAt,
        completed_at: completedAt
      })
      .select()
      .single();

    if (error) {
      // Check if it's a duplicate attempt
      if (error.code === '23505') {
        return {
          success: false,
          data: null,
          error: 'You have already completed this assessment'
        };
      }
      throw error;
    }

    return {
      success: true,
      data: data,
      error: null
    };
  } catch (error) {
    console.error('Error saving assessment attempt:', error);
    return {
      success: false,
      data: null,
      error: error.message || 'Failed to save assessment attempt'
    };
  }
}

/**
 * Get learner's assessment history
 * @param {string} learnerId - Learner UUID
 * @returns {Promise<Array>}
 */
export async function getAssessmentHistory(learnerId) {
  try {
    const { data, error } = await supabase
      .from('external_assessment_attempts')
      .select('*')
      .eq('learner_id', learnerId)
      .order('completed_at', { ascending: false });

    if (error) throw error;

    return data || [];
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
    // Use maybeSingle() instead of single() to avoid 406 error when no rows exist
    const { data, error } = await supabase
      .from('external_assessment_attempts')
      .select('*')
      .eq('learner_id', learnerId)
      .eq('course_name', courseName)
      .maybeSingle();

    if (error) {
      throw error;
    }

    return data || null;
  } catch (error) {
    console.error('Error fetching assessment:', error);
    return null;
  }
}
