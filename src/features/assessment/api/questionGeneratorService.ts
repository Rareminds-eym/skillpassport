/**
 * Question Generator Module
 * Handles AI-based question generation for aptitude and knowledge assessments
 */

import { ssoClient } from '@/shared/api/ssoClient';
import { STREAM_KNOWLEDGE_PROMPTS, APTITUDE_CATEGORIES } from '../lib/streamPrompts.js';
import { normalizeStreamId } from '../lib/streamUtils.js';
import { validateQuestionBatch } from '../lib/questionValidator.js';
import { handleAPIError, handleNetworkError } from '../lib/assessmentErrors.js';
import { getSavedQuestionsForLearner, saveAptitudeQuestions, saveKnowledgeQuestions } from './assessmentRepository';

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

interface StreamInfo {
  name: string;
  topics: string[];
}

interface ApiResponse {
  questions?: Question[];
  cached?: boolean;
  [key: string]: unknown;
}

interface ValidationResult {
  valid: Question[];
  invalid: Question[];
  needsMore: boolean;
}

interface ErrorInfo {
  shouldRetry: boolean;
  delay: number;
  message: string;
}

/**
 * Generate questions with validation and retry logic
 * NOTE: This function is currently not used but kept for potential future use
 */
export async function generateWithValidation(
  generatorFn: () => Promise<Question[]>,
  questionType: QuestionType,
  expectedCount: number,
  maxRetries: number = 3
): Promise<Question[]> {
  let allValidQuestions: Question[] = [];
  let attempt = 0;
  
  while (attempt < maxRetries && allValidQuestions.length < expectedCount) {
    attempt++;
    
    try {
      const questions = await generatorFn();
      
      if (!questions || questions.length === 0) {
        if (attempt < maxRetries) {
          await new Promise(resolve => setTimeout(resolve, 2000 * attempt));
          continue;
        }
        break;
      }
      
      const validation = validateQuestionBatch(questions, questionType, expectedCount - allValidQuestions.length);
      allValidQuestions = [...allValidQuestions, ...validation.valid];
      
      
      if (!validation.needsMore) {
        break;
      }
      
      if (attempt < maxRetries) {
        await new Promise(resolve => setTimeout(resolve, 2000 * attempt));
      }
    } catch (error) {
      console.error(`❌ Error on attempt ${attempt}:`, error);
      if (attempt < maxRetries) {
        await new Promise(resolve => setTimeout(resolve, 2000 * attempt));
      }
    }
  }
  
  if (allValidQuestions.length < expectedCount) {
    console.warn(`⚠️ Only generated ${allValidQuestions.length}/${expectedCount} valid questions after ${attempt} attempts`);
  }
  
  return allValidQuestions.slice(0, expectedCount);
}

/**
 * Generate Stream Knowledge questions using AI
 * If learnerId provided, saves questions for resume functionality
 */
export async function generateStreamKnowledgeQuestions(
  streamId: string,
  questionCount: number = 20,
  learnerId: string | null = null,
  attemptId: string | null = null,
  gradeLevel: GradeLevel | null = null
): Promise<Question[] | null> {
  const isCollegeLearner = gradeLevel === 'college' || gradeLevel === 'higher_secondary';
  
  let effectiveStreamId: string;
  let effectiveStreamName: string;
  let effectiveTopics: string[] | null;
  
  if (isCollegeLearner) {
    effectiveStreamId = streamId;
    // COLLEGE ONLY: streamId is the normalized slug (e.g. 'bca'), and sending it as the
    // stream name gave the AI no subject signal ("studying bca" → generic questions).
    // Recover the readable program name from the catalog; higher_secondary keeps the
    // previous behavior unchanged.
    if (gradeLevel === 'college') {
      const catalogInfo = STREAM_KNOWLEDGE_PROMPTS[streamId] as StreamInfo | undefined;
      effectiveStreamName = catalogInfo?.name || streamId;
    } else {
      effectiveStreamName = streamId;
    }
    effectiveTopics = null;
  } else {
    const normalizedStreamId = normalizeStreamId(streamId);
    const streamInfo = STREAM_KNOWLEDGE_PROMPTS[normalizedStreamId] as StreamInfo | undefined;
    
    if (!streamInfo) {
      console.error('Unknown stream:', streamId, '(normalized:', normalizedStreamId, ')');
      return null;
    }
    
    effectiveStreamId = normalizedStreamId;
    effectiveStreamName = streamInfo.name;
    effectiveTopics = streamInfo.topics;
  }

  if (learnerId) {
    // A cache MISS comes back as an empty array (the backend returns `questions: []`
    // with `cached: false`), and `[]` is truthy. Without the length check this returned
    // 0 knowledge questions and skipped AI generation entirely — the college bug.
    const saved = await getSavedQuestionsForLearner(learnerId, effectiveStreamId, 'knowledge');
    if (saved && saved.length > 0) {
      return saved;
    }
  }

  const { getApiUrl } = await import('@/shared/api/apiUtils');
  const apiUrl = getApiUrl('question-generation');
  const maxRetries = 3;
  const requestCount = Math.ceil(questionCount * 1.4);
  
  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      // ssoClient.fetch attaches the JWT — the endpoint is behind withAuth (401 with plain fetch).
      const response = await ssoClient.fetch(`${apiUrl}/career-assessment/generate-knowledge`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          streamId: effectiveStreamId,
          streamName: effectiveStreamName,
          topics: effectiveTopics,
          questionCount: requestCount,
          learnerId,
          attemptId,
          gradeLevel,
          isCollegeLearner
        })
      });

      if (!response.ok) {
        const errorInfo = await handleAPIError(response, attempt, maxRetries);
        const errorText = await response.text();
        console.error(`❌ API Error Response (attempt ${attempt}):`, errorText);
        
        if (errorInfo.shouldRetry) {
          await new Promise(resolve => setTimeout(resolve, errorInfo.delay));
          continue;
        } else {
          return null;
        }
      }

      // Backend wraps responses via apiSuccess: { success, data: { questions } }.
      // Fall back to the raw body for any unwrapped legacy responses.
      const json: any = await response.json();
      const data: ApiResponse = json?.data ?? json;

      if (!data || !data.questions) {
        console.error(`❌ Invalid API response (attempt ${attempt}): missing questions array`);
        
        if (attempt < maxRetries) {
          await new Promise(resolve => setTimeout(resolve, 2000 * attempt));
          continue;
        }
        return null;
      }
      
      const validation = validateQuestionBatch(data.questions, 'knowledge', questionCount);
      let validQuestions = validation.valid;
      
      if (validation.invalid.length > 0) {
        console.warn(`⚠️ Filtered out ${validation.invalid.length} invalid knowledge questions`);
      }
      
      const beforeDuplicateRemoval = validQuestions.length;
      validQuestions = validQuestions.filter((q, index, self) =>
        index === self.findIndex((t) => (t.text || t.question) === (q.text || q.question))
      );
      
      if (beforeDuplicateRemoval > validQuestions.length) {
        console.warn(`⚠️ Removed ${beforeDuplicateRemoval - validQuestions.length} duplicate knowledge questions`);
      }
      
      if (validQuestions.length < questionCount) {
        console.warn(`⚠️ Insufficient questions: ${validQuestions.length}/${questionCount} knowledge questions`);
        
        if (attempt < maxRetries) {
          await new Promise(resolve => setTimeout(resolve, 2000 * attempt));
          continue;
        } else {
          console.error(`❌ Failed to get exactly ${questionCount} knowledge questions after ${maxRetries} attempts. Got ${validQuestions.length}.`);
          return null;
        }
      }
      
      if (validQuestions.length > questionCount) {
        validQuestions = validQuestions.slice(0, questionCount);
      }
      
      
      if (validQuestions.length > 0 && learnerId && !data.cached) {
        await saveKnowledgeQuestions(learnerId, effectiveStreamId, attemptId, validQuestions, gradeLevel);
      }
      
      return validQuestions;
    } catch (error) {
      const errorInfo = handleNetworkError(error, attempt, maxRetries);
      
      if (errorInfo.shouldRetry) {
        await new Promise(resolve => setTimeout(resolve, errorInfo.delay));
      } else {
        return null;
      }
    }
  }
  
  return null;
}

/**
 * Generate Aptitude questions using AI
 * If learnerId provided, saves questions for resume functionality
 */
export async function generateAptitudeQuestions(
  streamId: string,
  questionCount: number = 50,
  learnerId: string | null = null,
  attemptId: string | null = null,
  gradeLevel: GradeLevel | null = null
): Promise<Question[] | null> {
  if (learnerId) {
    const saved = await getSavedQuestionsForLearner(learnerId, streamId, 'aptitude');
    if (saved && saved.length > 0) {
      return saved;
    }
  }


  const { getApiUrl } = await import('@/shared/api/apiUtils');
  const apiUrl = getApiUrl('question-generation');
  const maxRetries = 3;
  const questionsPerCategory = Math.ceil(questionCount / APTITUDE_CATEGORIES.length);
  
  let allValidQuestions: Question[] = [];
  
  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      const questionsNeeded = questionCount - allValidQuestions.length;
      
      if (questionsNeeded <= 0) {
        break;
      }
      
      
      // ssoClient.fetch attaches the JWT — the endpoint is behind withAuth (401 with plain fetch).
      const response = await ssoClient.fetch(`${apiUrl}/career-assessment/generate-aptitude`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          streamId,
          questionsPerCategory,
          learnerId,
          attemptId,
          gradeLevel
        })
      });

      if (!response.ok) {
        const errorInfo = await handleAPIError(response, attempt, maxRetries);
        const errorText = await response.text();
        console.error(`❌ API Error (attempt ${attempt}):`, errorText.substring(0, 200));
        
        if (errorInfo.shouldRetry) {
          await new Promise(resolve => setTimeout(resolve, errorInfo.delay));
          continue;
        } else {
          return null;
        }
      }

      // Backend wraps responses via apiSuccess: { success, data: { questions } }.
      // Fall back to the raw body for any unwrapped legacy responses.
      const json: any = await response.json();
      const data: ApiResponse = json?.data ?? json;

      if (!data || !data.questions) {
        console.error(`❌ Invalid API response (attempt ${attempt}): missing questions array`);
        
        if (attempt < maxRetries) {
          await new Promise(resolve => setTimeout(resolve, 2000 * attempt));
          continue;
        }
        return null;
      }
      
      
      const validation = validateQuestionBatch(data.questions, 'aptitude', questionCount);
      const newValidQuestions = validation.valid;
      allValidQuestions = [...allValidQuestions, ...newValidQuestions];
      
      allValidQuestions = allValidQuestions.filter((q, index, self) =>
        index === self.findIndex((t) => (t.text || t.question) === (q.text || q.question))
      );
      
      
      if (allValidQuestions.length >= questionCount) {
        const finalQuestions = allValidQuestions.slice(0, questionCount);
        
        if (finalQuestions.length > 0 && learnerId && !data.cached) {
          await saveAptitudeQuestions(learnerId, streamId, attemptId, finalQuestions, gradeLevel);
        }
        
        return finalQuestions;
      }
      
      if (attempt < maxRetries) {
        await new Promise(resolve => setTimeout(resolve, 2000 * attempt));
        continue;
      }

      const threshold = Math.floor(questionCount * 0.9);
      if (allValidQuestions.length >= threshold) {
        console.warn(`⚠️ Only have ${allValidQuestions.length}/${questionCount} questions, but accepting (above 90% threshold)`);
        
        if (allValidQuestions.length > 0 && learnerId && !data.cached) {
          await saveAptitudeQuestions(learnerId, streamId, attemptId, allValidQuestions, gradeLevel);
        }
        
        return allValidQuestions;
      }
      
      console.error(`❌ Failed to get enough questions after ${maxRetries} attempts. Got ${allValidQuestions.length}/${questionCount}.`);
      return null;
    } catch (error) {
      const errorInfo = handleNetworkError(error, attempt, maxRetries);

      if (errorInfo.shouldRetry) {
        await new Promise(resolve => setTimeout(resolve, errorInfo.delay));
      } else {
        return null;
      }
    }
  }
  
  return null;
}
