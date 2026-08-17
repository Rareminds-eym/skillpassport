
/**
 * External Assessment Service
 * Handles external course assessment attempts
 *
 * All persistence goes through backend Pages Functions:
 *   POST /api/external-assessment/actions  (attempt lifecycle)
 *   PUT  /api/learners/trainings           (training approval sync)
 * The backend uses the service-role client and enforces learner ownership,
 * which a frontend client cannot do safely under this project's SSO auth.
 */
import { apiPost, apiPut } from '@/shared/api/apiClient';

type AssessmentStatus = 'not_started' | 'in_progress' | 'completed';
type AssessmentLevel = 'Beginner' | 'Intermediate' | 'Advanced';

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

interface TrainingUpdateResult {
  success: boolean;
  updated?: boolean;
  reason?: string;
  error?: string;
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
    const envelope = await apiPost<{ data?: { status?: string; attempt?: AssessmentAttempt | null } }>(
      '/external-assessment/actions',
      { action: 'check-status', learnerId, courseName }
    );
    const result = envelope?.data;

    if (!result || !result.attempt) {
      console.log('ℹ️ checkAssessmentStatus: No attempt found');
      return { status: 'not_started', attempt: null };
    }

    const data = result.attempt;

    console.log('📊 checkAssessmentStatus: Found attempt in database:', {
      id: data.id,
      status: data.status,
      current_question_index: data.current_question_index,
      time_remaining: data.time_remaining,
      last_activity_at: data.last_activity_at,
      answeredCount: data.learner_answers?.filter((a: Answer) => a.selected_answer !== null).length
    });

    return {
      status: result.status as AssessmentStatus,
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

    // The backend builds the empty learner_answers array and the remaining
    // attempt defaults, so only the identifying fields are sent here.
    const envelope = await apiPost<{ data?: AssessmentAttempt }>(
      '/external-assessment/actions',
      { action: 'create-attempt', learnerId, courseName, courseId, assessmentLevel, questions }
    );

    return {
      success: true,
      data: (envelope?.data ?? null) as AssessmentAttempt | null,
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
    console.log('💾 Saving to database...', {
      updatingAnswerAt: questionIndex,
      resumeFromIndex: resumeIndex
    });

    // The backend fetches the attempt, scores the answer against the stored
    // question, and writes the update in one ownership-checked round trip.
    await apiPost('/external-assessment/actions', {
      action: 'update-progress',
      attemptId,
      questionIndex,
      answer,
      timeRemaining,
      resumeFromIndex: resumeIndex
    });

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
    // The backend recomputes the score and difficulty breakdown from the
    // stored attempt and marks it completed, so the score is authoritative
    // server-side rather than trusted from the client.
    const envelope = await apiPost<{ data?: { score?: number } }>(
      '/external-assessment/actions',
      { action: 'complete', attemptId, timeTaken }
    );

    const score = envelope?.data?.score ?? null;

    return { success: true, score };
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

    // Routed through create-attempt; the backend owns the insert and its
    // ownership check. The completed-attempt fields below are accepted by the
    // same action, which fills in any it does not receive.
    const envelope = await apiPost<{ data?: AssessmentAttempt }>(
      '/external-assessment/actions',
      {
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
        completedAt
      }
    );

    return {
      success: true,
      data: (envelope?.data ?? null) as AssessmentAttempt | null,
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
 * Applies the outcome of a completed assessment to the linked training record.
 *
 * On a passing score the backend auto-approves the training, mirroring the
 * manual admin approve-training flow. Failures are returned rather than thrown
 * so the caller can decide whether they are fatal.
 */
export async function updateTrainingAfterAssessment(
  learnerId: string,
  trainingId: string,
  score: number,
  passed: boolean
): Promise<TrainingUpdateResult> {
  try {
    const result = await apiPut<{ data?: { updated?: boolean; reason?: string } }>(
      '/learners/trainings',
      { learnerId, trainingId, score, passed }
    );

    return { success: true, ...result?.data };
  } catch (error) {
    const err = error as Error;
    console.error('Error updating training after assessment:', err);
    return { success: false, error: err.message || 'Failed to update training status' };
  }
}

/**
 * Get learner's assessment history
 */
export async function getAssessmentHistory(learnerId: string): Promise<AssessmentAttempt[]> {
  try {
    const envelope = await apiPost<{ data?: AssessmentAttempt[] }>(
      '/external-assessment/actions',
      { action: 'history', learnerId }
    );

    return (envelope?.data || []) as AssessmentAttempt[];
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
    const envelope = await apiPost<{ data?: AssessmentAttempt | null }>(
      '/external-assessment/actions',
      { action: 'get-by-course', learnerId, courseName }
    );

    return (envelope?.data as AssessmentAttempt) || null;
  } catch (error) {
    console.error('Error fetching assessment:', error);
    return null;
  }
}
