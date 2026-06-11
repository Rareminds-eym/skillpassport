import { apiPost } from '@/shared/api/apiClient';

/**
 * Assessment Generation Service
 * Generates dynamic assessments based on course name using AI.
 *
 * Backend-first: all persistence and AI calls go through authenticated
 * Pages Functions endpoints — no direct Supabase access from the frontend.
 */

type AssessmentLevel = 'Beginner' | 'Intermediate' | 'Advanced';
type QuestionType = 'mcq' | 'short_answer';

interface Question {
  id: number;
  type: QuestionType;
  difficulty: AssessmentLevel;
  question: string;
  options?: string[];
  correct_answer: string;
  skill_tag: string;
}

interface Assessment {
  course: string;
  level: AssessmentLevel;
  total_questions: number;
  questions: Question[];
  cachedAt?: string;
}

interface ValidationResult {
  valid: boolean;
  errors: string[];
}

interface SaveResult {
  success: boolean;
  data?: any;
  alreadyExists?: boolean;
  error?: string;
}

interface LoadResult {
  success: boolean;
  data?: Assessment | null;
  notFound?: boolean;
  error?: string;
}

/**
 * Save generated assessment to database for reuse.
 *
 * @deprecated The backend /question-generation/generate endpoint already
 * caches generated assessments server-side; this function is kept only for
 * barrel-export compatibility and has no active callers.
 */
export async function saveGeneratedAssessment(
  courseName: string,
  courseId: string | null,
  assessment: Assessment
): Promise<SaveResult> {
  try {
    const result = await apiPost<{ data?: { alreadyExists?: boolean; data?: any } }>('/assessment/actions', {
      action: 'save-generated-assessment', courseName, courseId, assessment,
    });

    if (result?.data?.alreadyExists) {
      return { success: true, data: null, alreadyExists: true };
    }

    return { success: true, data: result?.data?.data || null, alreadyExists: false };
  } catch (error) {
    const err = error as Error;
    console.error('❌ Error saving assessment to database:', err);
    return { success: false, error: err.message };
  }
}

/**
 * Load generated assessment from database.
 *
 * @deprecated The backend /question-generation/generate endpoint already
 * checks the server-side cache before generating; this function is kept only
 * for barrel-export compatibility and has no active callers.
 */
export async function loadGeneratedAssessment(courseName: string): Promise<LoadResult> {
  try {
    const result = await apiPost<{ data?: Assessment | null }>('/assessment/actions', {
      action: 'load-generated-assessment', courseName,
    });

    if (!result?.data) {
      return { success: true, data: null, notFound: true };
    }

    return { success: true, data: result.data, notFound: false };
  } catch (error) {
    const err = error as Error;
    console.error('❌ Error loading assessment from database:', err);
    return { success: false, error: err.message };
  }
}

/**
 * Generate assessment using the backend question-generation API.
 *
 * The backend handles the full lifecycle: checks the server-side cache in
 * generated_external_assessment, generates via AI on a miss, validates,
 * and caches the result. Requires authentication (withAuth on the router),
 * so the call must go through apiPost/ssoClient for token attachment.
 */
export async function generateAssessment(
  courseName: string,
  level: AssessmentLevel = 'Intermediate',
  questionCount: number = 15,
  courseId: string | null = null
): Promise<Assessment> {
  try {
    console.log('🎯 Generating assessment for:', courseName, 'Level:', level);

    // Backend returns apiSuccess shape: { success, data: <assessment> }
    const result = await apiPost<{ success: boolean; data: Assessment }>(
      '/question-generation/generate',
      { courseName, level, questionCount }
    );

    const assessment = result.data;

    console.log('✅ Generated assessment with AI:', {
      course: assessment.course,
      level: assessment.level,
      questionCount: assessment.questions?.length,
      firstQuestion: assessment.questions?.[0]?.question?.substring(0, 50) + '...'
    });

    // Validate the assessment
    const validation = validateAssessment(assessment);
    if (!validation.valid) {
      console.error('❌ Validation errors:', validation.errors);
      throw new Error('Generated assessment is invalid: ' + validation.errors.join(', '));
    }

    console.log('✅ Assessment validated successfully');

    return assessment;
  } catch (error) {
    console.error('❌ Error generating assessment:', error);
    throw error;
  }
}

/**
 * Validate assessment structure
 */
export function validateAssessment(assessment: Assessment): ValidationResult {
  const errors: string[] = [];

  if (!assessment.course) errors.push('Missing course name');
  if (!['Beginner', 'Intermediate', 'Advanced'].includes(assessment.level)) {
    errors.push('Invalid level');
  }
  if (!assessment.questions || assessment.questions.length === 0) {
    errors.push('No questions found');
  }
  if (assessment.questions && assessment.questions.length !== assessment.total_questions) {
    errors.push('Question count mismatch');
  }

  if (assessment.questions) {
    assessment.questions.forEach((q, idx) => {
      if (!q.id) errors.push(`Question ${idx + 1}: Missing id`);
      if (!q.type) errors.push(`Question ${idx + 1}: Missing type`);
      if (!q.question) errors.push(`Question ${idx + 1}: Missing question text`);
      if (!q.correct_answer) errors.push(`Question ${idx + 1}: Missing correct answer`);
      if (!q.skill_tag) errors.push(`Question ${idx + 1}: Missing skill tag`);

      if (q.type === 'mcq' && (!q.options || q.options.length < 2)) {
        errors.push(`Question ${idx + 1}: MCQ must have at least 2 options`);
      }
    });
  }

  return { valid: errors.length === 0, errors };
}

/**
 * Save assessment to localStorage for offline access
 */
export function cacheAssessment(courseName: string, assessment: Assessment): void {
  try {
    const cacheKey = `assessment_${courseName.toLowerCase().replace(/\s+/g, '_')}`;
    localStorage.setItem(cacheKey, JSON.stringify({
      ...assessment,
      cachedAt: new Date().toISOString()
    }));
  } catch (error) {
    console.error('Error caching assessment:', error);
  }
}

/**
 * Load cached assessment from localStorage
 */
export function getCachedAssessment(courseName: string): Assessment | null {
  try {
    const cacheKey = `assessment_${courseName.toLowerCase().replace(/\s+/g, '_')}`;
    const cached = localStorage.getItem(cacheKey);

    if (cached) {
      const assessment: Assessment = JSON.parse(cached);
      // Check if cache is less than 7 days old
      const cacheAge = Date.now() - new Date(assessment.cachedAt!).getTime();
      const maxAge = 7 * 24 * 60 * 60 * 1000; // 7 days

      if (cacheAge < maxAge) {
        return assessment;
      }
    }

    return null;
  } catch (error) {
    console.error('Error loading cached assessment:', error);
    return null;
  }
}
