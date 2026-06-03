/**
 * Question Generator Module
 * Handles AI-based question generation for aptitude and knowledge assessments
 */

import { STREAM_KNOWLEDGE_PROMPTS, APTITUDE_CATEGORIES } from '../lib/streamPrompts.js';
import { normalizeStreamId } from '../lib/streamUtils.js';
import { validateQuestionBatch } from '../lib/questionValidator.js';
import { classifyError, getUserErrorMessage, handleAPIError, handleNetworkError } from '../lib/assessmentErrors.js';
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
    console.log(`📦 Generation attempt ${attempt}/${maxRetries} for ${questionType}`);
    
    try {
      const questions = await generatorFn();
      
      if (!questions || questions.length === 0) {
        console.warn(`⚠️ No questions returned on attempt ${attempt}`);
        if (attempt < maxRetries) {
          await new Promise(resolve => setTimeout(resolve, 2000 * attempt));
          continue;
        }
        break;
      }
      
      const validation = validateQuestionBatch(questions, questionType, expectedCount - allValidQuestions.length);
      allValidQuestions = [...allValidQuestions, ...validation.valid];
      
      console.log(`✅ Attempt ${attempt}: ${validation.valid.length} valid questions (total: ${allValidQuestions.length}/${expectedCount})`);
      
      if (!validation.needsMore) {
        break;
      }
      
      if (attempt < maxRetries) {
        const needed = expectedCount - allValidQuestions.length;
        console.log(`⏳ Need ${needed} more questions, retrying...`);
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
    effectiveStreamName = streamId;
    effectiveTopics = null;
    console.log(`🎓 ${gradeLevel === 'higher_secondary' ? 'Higher Secondary (11th/12th)' : 'College'} learner - generating knowledge questions for: ${streamId}`);
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
    console.log('🎯 Generating knowledge questions for:', effectiveStreamName, '(stream:', effectiveStreamId, ')');
    console.log('📚 Stream topics:', effectiveTopics);
  }

  if (learnerId) {
    const saved = await getSavedQuestionsForLearner(learnerId, effectiveStreamId, 'knowledge');
    if (saved) {
      console.log('✅ Using saved knowledge questions for learner');
      return saved;
    }
  }

  const { getApiUrl } = await import('@/shared/api/apiUtils');
  const apiUrl = getApiUrl('question-generation');
  const maxRetries = 3;
  const requestCount = Math.ceil(questionCount * 1.4);
  
  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      console.log(`📡 Calling Knowledge API (attempt ${attempt}/${maxRetries}) - requesting ${requestCount} to get ${questionCount} valid`);
      
      const response = await fetch(`${apiUrl}/career-assessment/generate-knowledge`, {
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
        console.log(`ℹ️ ${errorInfo.message}`);
        
        if (errorInfo.shouldRetry) {
          await new Promise(resolve => setTimeout(resolve, errorInfo.delay));
          continue;
        } else {
          return null;
        }
      }

      const data: ApiResponse = await response.json();
      
      if (!data || !data.questions) {
        const errorType = classifyError(new Error('Invalid API response'));
        console.error(`❌ Invalid API response (attempt ${attempt}): missing questions array`);
        console.log(`ℹ️ ${getUserErrorMessage(errorType)}`);
        
        if (attempt < maxRetries) {
          await new Promise(resolve => setTimeout(resolve, 2000 * attempt));
          continue;
        }
        return null;
      }
      
      console.log('✅ Knowledge questions generated:', data.questions?.length || 0);
      
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
          console.log(`🔄 Retrying to get exactly ${questionCount} knowledge questions (attempt ${attempt + 1}/${maxRetries})...`);
          await new Promise(resolve => setTimeout(resolve, 2000 * attempt));
          continue;
        } else {
          console.error(`❌ Failed to get exactly ${questionCount} knowledge questions after ${maxRetries} attempts. Got ${validQuestions.length}.`);
          return null;
        }
      }
      
      if (validQuestions.length > questionCount) {
        console.log(`✂️ Trimming ${validQuestions.length} questions down to exactly ${questionCount}`);
        validQuestions = validQuestions.slice(0, questionCount);
      }
      
      console.log(`✅ Validation passed: Exactly ${questionCount} valid unique knowledge questions`);
      
      if (validQuestions.length > 0 && learnerId && !data.cached) {
        console.log('💾 Saving knowledge questions to database...');
        await saveKnowledgeQuestions(learnerId, effectiveStreamId, attemptId, validQuestions, gradeLevel);
      }
      
      return validQuestions;
    } catch (error) {
      const errorInfo = handleNetworkError(error, attempt, maxRetries);
      console.log(`ℹ️ ${errorInfo.message}`);
      
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
      console.log(`✅ RESUME: Using saved aptitude questions for learner: ${saved.length} questions`);
      return saved;
    }
  }

  console.log('🎯 Generating aptitude questions for stream:', streamId, 'gradeLevel:', gradeLevel);

  const { getApiUrl } = await import('@/shared/api/apiUtils');
  const apiUrl = getApiUrl('question-generation');
  const maxRetries = 3;
  const questionsPerCategory = Math.ceil(questionCount / APTITUDE_CATEGORIES.length);
  
  let allValidQuestions: Question[] = [];
  
  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      const questionsNeeded = questionCount - allValidQuestions.length;
      
      if (questionsNeeded <= 0) {
        console.log(`✅ Already have ${allValidQuestions.length} valid questions, no need to retry`);
        break;
      }
      
      console.log(`📡 Calling API (attempt ${attempt}/${maxRetries}) - Need ${questionsNeeded} more questions`);
      
      const response = await fetch(`${apiUrl}/career-assessment/generate-aptitude`, {
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
        console.log(`ℹ️ ${errorInfo.message}`);
        
        if (errorInfo.shouldRetry) {
          await new Promise(resolve => setTimeout(resolve, errorInfo.delay));
          continue;
        } else {
          return null;
        }
      }

      const data: ApiResponse = await response.json();
      
      if (!data || !data.questions) {
        const errorType = classifyError(new Error('Invalid API response'));
        console.error(`❌ Invalid API response (attempt ${attempt}): missing questions array`);
        console.log(`ℹ️ ${getUserErrorMessage(errorType)}`);
        
        if (attempt < maxRetries) {
          await new Promise(resolve => setTimeout(resolve, 2000 * attempt));
          continue;
        }
        return null;
      }
      
      console.log('✅ Aptitude questions generated:', data.questions?.length || 0);
      
      const validation = validateQuestionBatch(data.questions, 'aptitude', questionCount);
      const newValidQuestions = validation.valid;
      allValidQuestions = [...allValidQuestions, ...newValidQuestions];
      
      allValidQuestions = allValidQuestions.filter((q, index, self) =>
        index === self.findIndex((t) => (t.text || t.question) === (q.text || q.question))
      );
      
      console.log(`📊 Validation: ${newValidQuestions.length} new valid, ${validation.invalid.length} invalid`);
      console.log(`📊 Total accumulated: ${allValidQuestions.length}/${questionCount} questions`);
      
      if (allValidQuestions.length >= questionCount) {
        const finalQuestions = allValidQuestions.slice(0, questionCount);
        console.log(`✅ Success! Have ${finalQuestions.length} valid questions`);
        
        if (finalQuestions.length > 0 && learnerId && !data.cached) {
          console.log('💾 Saving questions to database...');
          await saveAptitudeQuestions(learnerId, streamId, attemptId, finalQuestions, gradeLevel);
        }
        
        return finalQuestions;
      }
      
      if (attempt < maxRetries) {
        const needed = questionCount - allValidQuestions.length;
        console.log(`🔄 Need ${needed} more questions, retrying (attempt ${attempt + 1}/${maxRetries})...`);
        await new Promise(resolve => setTimeout(resolve, 2000 * attempt));
        continue;
      }
      
      const threshold = Math.floor(questionCount * 0.9);
      if (allValidQuestions.length >= threshold) {
        console.warn(`⚠️ Only have ${allValidQuestions.length}/${questionCount} questions, but accepting (above 90% threshold)`);
        
        if (allValidQuestions.length > 0 && learnerId && !data.cached) {
          console.log('💾 Saving questions to database...');
          await saveAptitudeQuestions(learnerId, streamId, attemptId, allValidQuestions, gradeLevel);
        }
        
        return allValidQuestions;
      }
      
      console.error(`❌ Failed to get enough questions after ${maxRetries} attempts. Got ${allValidQuestions.length}/${questionCount}.`);
      return null;
    } catch (error) {
      const errorInfo = handleNetworkError(error, attempt, maxRetries);
      console.log(`ℹ️ ${errorInfo.message}`);
      
      if (errorInfo.shouldRetry) {
        await new Promise(resolve => setTimeout(resolve, errorInfo.delay));
      } else {
        return null;
      }
    }
  }
  
  return null;
}
