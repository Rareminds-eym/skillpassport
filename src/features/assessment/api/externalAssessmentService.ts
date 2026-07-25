
/**
 * External Assessment Service
 * Handles external course assessment attempts
 */

type AssessmentStatus = 'not_started' | 'in_progress' | 'completed';
type AssessmentLevel = 'Beginner' | 'Intermediate' | 'Advanced';
type Difficulty = 'easy' | 'medium' | 'hard';

interface Question {
  id: number | string;
  question?: string;
  text?: string;
  options?: string[];
  correct_answer?: string;
  correctAnswer?: string;
  difficulty?: string;
  type?: string;
  skill_tag?: string;
  [key: string]: unknown;
}

interface Answer {
  question_id: number | string;
  selected_answer: string | null;
  is_correct: boolean | null;
  time_taken: number;
}

interface AssessmentAttempt {
  id: string;
  learner_id: string;
  course_name: string;
  course_id?: string | null;
  assessment_level: string;
  total_questions: number;
  questions: Question[];
  learner_answers: Answer[];
  current_question_index: number;
  status: AssessmentStatus;
  time_remaining: number;
  started_at: string;
  last_activity_at?: string;
  completed_at?: string;
  score?: number;
  correct_answers?: number;
  time_taken?: number;
  difficulty_breakdown?: DifficultyBreakdown;
  [key: string]: unknown;
}

interface DifficultyBreakdown {
  easy: { total: number; correct: number; percentage: number };
  medium: { total: number; correct: number; percentage: number };
  hard: { total: number; correct: number; percentage: number };
}

interface StatusResult {
  status: AssessmentStatus;
  attempt: AssessmentAttempt | null;
}

interface OperationResult {
  success: boolean;
  data?: AssessmentAttempt | null;
  error?: string | null;
  score?: number | null;
}

interface CreateAttemptData {
  learnerId: string;
  courseName: string;
  courseId?: string | null;
  assessmentLevel: AssessmentLevel;
  questions: Question[];
}

interface SaveAttemptData {
  learnerId: string;
  courseName: string;
  courseId?: string | null;
  assessmentLevel: AssessmentLevel;
  questions: Question[];
  learnerAnswers: Answer[];
  score: number;
  correctAnswers: number;
  timeTaken: number;
  difficultyBreakdown: DifficultyBreakdown;
  startedAt: string;
  completedAt: string;
}

/**
 * Check if learner has already completed or has in-progress assessment
 */
export async function checkAssessmentStatus(
  learnerId: string,
  courseName: string
): Promise<StatusResult> {
  try {
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
      answeredCount: data.learner_answers?.filter((a: Answer) => a.selected_answer !== null).length
    });

    return {
      status: data.status as AssessmentStatus,
      attempt: data as AssessmentAttempt
    };
  } catch (error) {
    console.error('Error checking assessment status:', error);
    return { status: 'not_started', attempt: null };
  }
}

/**
 * Create new assessment attempt (save questions on first load)
 */
export async function createAssessmentAttempt(
  attemptData: CreateAttemptData
): Promise<OperationResult> {
  try {
    const {
      learnerId,
      courseName,
      courseId,
      assessmentLevel,
      questions
    } = attemptData;

    const emptyAnswers: Answer[] = questions.map((q) => ({
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
        time_remaining: 900,
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
      data: data as AssessmentAttempt,
      error: null
    };
  } catch (error) {
    const err = error as Error;
    console.error('Error creating assessment attempt:', err);
    return {
      success: false,
      data: null,
      error: err.message || 'Failed to create assessment attempt'
    };
  }
}

/**
 * Update assessment progress (save answer and move forward)
 */
export async function updateAssessmentProgress(
  attemptId: string,
  questionIndex: number,
  answer: string,
  timeRemaining: number,
  resumeFromIndex: number | null = null
): Promise<OperationResult> {
  const resumeIndex = resumeFromIndex !== null ? resumeFromIndex : questionIndex + 1;
  
  console.log('📡 updateAssessmentProgress called:', {
    attemptId,
    questionIndex,
    answer,
    timeRemaining,
    resumeFromIndex: resumeIndex
  });

  try {
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

    const updatedAnswers = [...currentAttempt.learner_answers];
    const question = currentAttempt.questions[questionIndex];
    
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
    
    const { error: updateError } = await supabase
      .from('external_assessment_attempts')
      .update({
        learner_answers: updatedAnswers,
        current_question_index: resumeIndex,
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
    const err = error as Error;
    console.error('❌ Error updating assessment progress:', err);
    return { success: false, error: err.message };
  }
}

/**
 * Complete assessment and calculate score
 */
export async function completeAssessment(
  attemptId: string,
  timeTaken: number
): Promise<OperationResult> {
  try {
    const { data: attempt, error: fetchError } = await supabase
      .from('external_assessment_attempts')
      .select('*')
      .eq('id', attemptId)
      .single();

    if (fetchError) throw fetchError;

    const typedAttempt = attempt as AssessmentAttempt;
    const correctCount = typedAttempt.learner_answers.filter((a) => a.is_correct).length;
    const score = Math.round((correctCount / typedAttempt.total_questions) * 100);

    const breakdown: DifficultyBreakdown = {
      easy: { total: 0, correct: 0, percentage: 0 },
      medium: { total: 0, correct: 0, percentage: 0 },
      hard: { total: 0, correct: 0, percentage: 0 }
    };

    typedAttempt.questions.forEach((q, idx) => {
      const difficulty = q.difficulty as Difficulty;
      if (breakdown[difficulty]) {
        breakdown[difficulty].total++;
        if (typedAttempt.learner_answers[idx]?.is_correct) {
          breakdown[difficulty].correct++;
        }
      }
    });

    Object.keys(breakdown).forEach((key) => {
      const diff = key as Difficulty;
      if (breakdown[diff].total > 0) {
        breakdown[diff].percentage = Math.round(
          (breakdown[diff].correct / breakdown[diff].total) * 100
        );
      }
    });

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
 */
export async function saveAssessmentAttempt(
  attemptData: SaveAttemptData
): Promise<OperationResult> {
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
      data: data as AssessmentAttempt,
      error: null
    };
  } catch (error) {
    const err = error as Error;
    console.error('Error saving assessment attempt:', err);
    return {
      success: false,
      data: null,
      error: err.message || 'Failed to save assessment attempt'
    };
  }
}

/**
 * Get learner's assessment history
 */
export async function getAssessmentHistory(learnerId: string): Promise<AssessmentAttempt[]> {
  try {
    const { data, error } = await supabase
      .from('external_assessment_attempts')
      .select('*')
      .eq('learner_id', learnerId)
      .order('completed_at', { ascending: false });

    if (error) throw error;

    return (data || []) as AssessmentAttempt[];
  } catch (error) {
    console.error('Error fetching assessment history:', error);
    return [];
  }
}

/**
 * Get assessment attempt by course
 */
export async function getAssessmentByCourse(
  learnerId: string,
  courseName: string
): Promise<AssessmentAttempt | null> {
  try {
    const { data, error } = await supabase
      .from('external_assessment_attempts')
      .select('*')
      .eq('learner_id', learnerId)
      .eq('course_name', courseName)
      .maybeSingle();

    if (error) {
      throw error;
    }

    return (data as AssessmentAttempt) || null;
  } catch (error) {
    console.error('Error fetching assessment:', error);
    return null;
  }
}
