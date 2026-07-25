/**
 * Assessment Repository Module (Frontend Client)
 * API client for career assessment question caching operations
 * 
 * @module assessment/api/assessmentRepository
 */

import { ssoClient } from '@/shared/api/ssoClient';
import { getApiUrl } from '@/shared/api/apiUtils';

type QuestionType = 'aptitude' | 'knowledge';
type GradeLevel = 'after10' | 'after12' | 'higher_secondary' | 'college' | 'middle' | 'highschool';

interface Question {
  id: number | string;
  text?: string;
  question?: string;
  options?: string[];
  correct_answer?: string;
  correctAnswer?: string;
  difficulty?: string;
  skill_tag?: string;
  subtag?: string;
  [key: string]: unknown;
}

/**
 * Get saved questions for a learner (for resume functionality)
 */
export async function getSavedQuestionsForLearner(
  learnerId: string,
  streamId: string,
  questionType: QuestionType
): Promise<Question[] | null> {
  if (!learnerId) {
    return null;
  }


  try {
    const API_URL = getApiUrl('assessment');
    const token = ssoClient.getAccessToken();

    if (!token) {
      console.warn('⚠️ No auth token available');
      return null;
    }

    const response = await ssoClient.fetch(
      `${API_URL}/questions/saved?learnerId=${learnerId}&streamId=${streamId}&questionType=${questionType}`,
      {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      }
    );

    if (!response.ok) {
      console.warn(`⚠️ API error: ${response.status}`);
      return null;
    }

    const data = await response.json();

    if (!data.success || !data.questions) {
      return null;
    }

    return data.questions;
  } catch (err) {
    const error = err as Error;
    console.error(`❌ Exception while fetching saved ${questionType} questions:`, {
      error: error.message,
      learner_id: learnerId,
      stream_id: streamId,
    });
    return null;
  }
}

/**
 * Save aptitude questions to database
 */
export async function saveAptitudeQuestions(
  learnerId: string,
  streamId: string,
  attemptId: string | null,
  questions: Question[],
  gradeLevel: GradeLevel | null = null
): Promise<boolean> {
  if (!learnerId) {
    return false;
  }

  try {
    const API_URL = getApiUrl('assessment');
    const token = ssoClient.getAccessToken();

    if (!token) {
      console.warn('⚠️ No auth token available');
      return false;
    }

    const response = await ssoClient.fetch(`${API_URL}/questions/save`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        learnerId,
        streamId,
        questionType: 'aptitude' as QuestionType,
        attemptId,
        questions,
        gradeLevel,
      }),
    });

    if (!response.ok) {
      console.error('❌ [Frontend] API error:', response.status);
      return false;
    }

    const data = await response.json();

    if (!data.success) {
      console.error('❌ [Frontend] Save failed:', data.error);
      return false;
    }

    return true;
  } catch (err) {
    const error = err as Error;
    console.error('❌ [Frontend] Exception during save:', {
      error: error.message,
    });
    return false;
  }
}

/**
 * Save knowledge questions to database
 */
export async function saveKnowledgeQuestions(
  learnerId: string,
  streamId: string,
  attemptId: string | null,
  questions: Question[],
  gradeLevel: GradeLevel | null = null
): Promise<boolean> {
  if (!learnerId) {
    return false;
  }

  try {
    const API_URL = getApiUrl('assessment');
    const token = ssoClient.getAccessToken();

    if (!token) {
      console.warn('⚠️ No auth token available');
      return false;
    }

    const response = await ssoClient.fetch(`${API_URL}/questions/save`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        learnerId,
        streamId,
        questionType: 'knowledge' as QuestionType,
        attemptId,
        questions,
        gradeLevel,
      }),
    });

    if (!response.ok) {
      console.error('❌ [Frontend] API error:', response.status);
      return false;
    }

    const data = await response.json();

    if (!data.success) {
      console.error('❌ [Frontend] Save failed:', data.error);
      return false;
    }

    return true;
  } catch (err) {
    const error = err as Error;
    console.error('❌ [Frontend] Exception:', error.message);
    return false;
  }
}

/**
 * Clear saved questions for a learner (when starting fresh assessment)
 */
export async function clearSavedQuestionsForLearner(
  learnerId: string,
  streamId: string
): Promise<void> {
  try {
    const API_URL = getApiUrl('assessment');
    const token = ssoClient.getAccessToken();

    if (!token) {
      console.warn('⚠️ No auth token available');
      return;
    }

    const response = await ssoClient.fetch(`${API_URL}/questions/clear`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        learnerId,
        streamId,
      }),
    });

    if (!response.ok) {
      console.warn('⚠️ Failed to clear saved questions:', response.status);
      return;
    }

  } catch (err) {
    const error = err as Error;
    console.warn('Error clearing saved questions:', error.message);
  }
}
