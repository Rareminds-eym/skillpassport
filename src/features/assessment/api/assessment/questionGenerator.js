/**
 * Question Generator Module
 * Handles AI-based question generation for aptitude and knowledge assessments
 */

import { STREAM_KNOWLEDGE_PROMPTS, APTITUDE_CATEGORIES } from './streamPrompts.js';
import { normalizeStreamId } from './streamUtils.js';
import { validateQuestionBatch } from './questionValidator.js';
import { classifyError, getUserErrorMessage, handleAPIError, handleNetworkError } from './assessmentErrors.js';
import { getSavedQuestionsForStudent, saveAptitudeQuestions, saveKnowledgeQuestions, clearSavedQuestionsForStudent } from './assessmentRepository.js';

/**
 * Generate questions with validation and retry logic
 * NOTE: This function is currently not used but kept for potential future use
 * @param {Function} generatorFn - Function that generates questions
 * @param {string} questionType - 'aptitude' or 'knowledge'
 * @param {number} expectedCount - Expected number of questions
 * @param {number} maxRetries - Maximum retry attempts (default 3)
 * @returns {Promise<Array>} - Valid questions
 */
export async function generateWithValidation(generatorFn, questionType, expectedCount, maxRetries = 3) {
  let allValidQuestions = [];
  let attempt = 0;
  
  while (attempt < maxRetries && allValidQuestions.length < expectedCount) {
    attempt++;
    console.log(`📦 Generation attempt ${attempt}/${maxRetries} for ${questionType}`);
    
    try {
      const questions = await generatorFn();
      
      if (!questions || questions.length === 0) {
        console.warn(`⚠️ No questions returned on attempt ${attempt}`);
        if (attempt < maxRetries) {
          // Exponential backoff: 2s, 4s, 6s
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
      
      // If we need more questions and have retries left, wait and try again
      if (attempt < maxRetries) {
        const needed = expectedCount - allValidQuestions.length;
        console.log(`⏳ Need ${needed} more questions, retrying...`);
        // Exponential backoff: 2s, 4s, 6s
        await new Promise(resolve => setTimeout(resolve, 2000 * attempt));
      }
    } catch (error) {
      console.error(`❌ Error on attempt ${attempt}:`, error);
      if (attempt < maxRetries) {
        // Exponential backoff: 2s, 4s, 6s
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
 * If studentId provided, saves questions for resume functionality
 */
export async function generateStreamKnowledgeQuestions(streamId, questionCount = 20, studentId = null, attemptId = null, gradeLevel = null) {
  // For college students AND higher secondary (11th/12th), streamId is their actual course/stream
  // For other students, normalize the stream ID to match STREAM_KNOWLEDGE_PROMPTS keys
  const isCollegeStudent = gradeLevel === 'college' || gradeLevel === 'higher_secondary';
  
  let effectiveStreamId, effectiveStreamName, effectiveTopics;
  
  if (isCollegeStudent) {
    // For college students and 11th/12th students, use their course/stream directly without normalization
    effectiveStreamId = streamId;
    effectiveStreamName = streamId; // Use course/stream name as-is (e.g., "B.COM", "Science (PCM)")
    effectiveTopics = null; // Let AI determine topics dynamically based on course/stream name
    console.log(`🎓 ${gradeLevel === 'higher_secondary' ? 'Higher Secondary (11th/12th)' : 'College'} student - generating knowledge questions for: ${streamId}`);
  } else {
    // For non-college students, use the hardcoded topic mappings
    const normalizedStreamId = normalizeStreamId(streamId);
    const streamInfo = STREAM_KNOWLEDGE_PROMPTS[normalizedStreamId];
    
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

  // Check for saved questions first if studentId provided
  if (studentId) {
    const saved = await getSavedQuestionsForStudent(studentId, effectiveStreamId, 'knowledge');
    if (saved) {
      console.log('✅ Using saved knowledge questions for student');
      return saved;
    }
  }

  // Use unified question generation API
  const { getApiUrl } = await import('@/shared/api/apiUtils');
  const apiUrl = getApiUrl('question-generation');
  const maxRetries = 3;
  
  // Request extra questions to account for validation failures and duplicates
  // We'll filter down to exactly questionCount after validation
  const requestCount = Math.ceil(questionCount * 1.4); // Request 40% more
  
  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      console.log(`📡 Calling Knowledge API (attempt ${attempt}/${maxRetries}) - requesting ${requestCount} to get ${questionCount} valid`);
      
      const response = await fetch(`${apiUrl}/career-assessment/generate-knowledge`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          streamId: effectiveStreamId,
          streamName: effectiveStreamName,
          topics: effectiveTopics, // null for college students - AI will determine
          questionCount: requestCount, // Request more than needed
          studentId,
          attemptId,
          gradeLevel,
          isCollegeStudent // Flag to tell backend to generate dynamically
        })
      });

      if (!response.ok) {
        // Handle API errors with appropriate retry logic
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

      const data = await response.json();
      
      // Validate response structure
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
      
      // Validate question quality using validateQuestionBatch
      const validation = validateQuestionBatch(data.questions, 'knowledge', questionCount);
      
      // Filter out invalid questions - only use valid ones
      let validQuestions = validation.valid;
      
      if (validation.invalid.length > 0) {
        console.warn(`⚠️ Filtered out ${validation.invalid.length} invalid knowledge questions`);
      }
      
      // Remove duplicates based on question text (same logic as aptitude questions)
      const beforeDuplicateRemoval = validQuestions.length;
      validQuestions = validQuestions.filter((q, index, self) =>
        index === self.findIndex((t) => (t.text || t.question) === (q.text || q.question))
      );
      
      if (beforeDuplicateRemoval > validQuestions.length) {
        console.warn(`⚠️ Removed ${beforeDuplicateRemoval - validQuestions.length} duplicate knowledge questions`);
      }
      
      // STRICT: Must have EXACTLY the expected count
      if (validQuestions.length < questionCount) {
        console.warn(`⚠️ Insufficient questions: ${validQuestions.length}/${questionCount} knowledge questions`);
        
        if (attempt < maxRetries) {
          console.log(`🔄 Retrying to get exactly ${questionCount} knowledge questions (attempt ${attempt + 1}/${maxRetries})...`);
          await new Promise(resolve => setTimeout(resolve, 2000 * attempt));
          continue;
        } else {
          console.error(`❌ Failed to get exactly ${questionCount} knowledge questions after ${maxRetries} attempts. Got ${validQuestions.length}.`);
          return null; // Reject - must be exactly 20
        }
      }
      
      // If we have more than needed, trim to exact count
      if (validQuestions.length > questionCount) {
        console.log(`✂️ Trimming ${validQuestions.length} questions down to exactly ${questionCount}`);
        validQuestions = validQuestions.slice(0, questionCount);
      }
      
      console.log(`✅ Validation passed: Exactly ${questionCount} valid unique knowledge questions`);
      
      // If API returned questions but didn't save them, save from frontend as fallback
      if (validQuestions.length > 0 && studentId && !data.cached) {
        console.log('💾 Saving knowledge questions to database...');
        await saveKnowledgeQuestions(studentId, effectiveStreamId, attemptId, validQuestions, gradeLevel);
      }
      
      return validQuestions;
    } catch (error) {
      // Handle network/fetch errors
      const errorInfo = handleNetworkError(error, attempt, maxRetries);
      console.log(`ℹ️ ${errorInfo.message}`);
      
      if (errorInfo.shouldRetry) {
        await new Promise(resolve => setTimeout(resolve, errorInfo.delay));
      } else {
        return null;
      }
    }
  }
  
  return null; // Return null instead of fallback
}

/**
 * Generate Aptitude questions using AI
 * If studentId provided, saves questions for resume functionality
 * @param {string} streamId - The stream ID (science, commerce, arts, etc.)
 * @param {number} questionCount - Number of questions to generate (default 50)
 * @param {string} studentId - Student ID for saving questions
 * @param {string} attemptId - Assessment attempt ID
 * @param {string} gradeLevel - Grade level: 'after10', 'after12', 'college'
 */
export async function generateAptitudeQuestions(streamId, questionCount = 50, studentId = null, attemptId = null, gradeLevel = null) {
  // Check for saved questions first if studentId provided
  if (studentId) {
    const saved = await getSavedQuestionsForStudent(studentId, streamId, 'aptitude');
    if (saved && saved.length > 0) {
      // Validate that saved questions have the expected count
      if (saved.length === questionCount) {
        console.log(`✅ Using saved aptitude questions for student: ${saved.length}/${questionCount}`);
        return saved;
      } else {
        console.warn(`⚠️ Saved questions count mismatch: ${saved.length}/${questionCount} - regenerating`);
        // Clear invalid cached questions
        await clearSavedQuestionsForStudent(studentId, streamId, 'aptitude');
      }
    }
  }

  console.log('🎯 Generating aptitude questions for stream:', streamId, 'gradeLevel:', gradeLevel);

  // Use unified question generation API
  const { getApiUrl } = await import('@/shared/api/apiUtils');
  const apiUrl = getApiUrl('question-generation');
  const maxRetries = 3;
  const questionsPerCategory = Math.ceil(questionCount / APTITUDE_CATEGORIES.length); // 10 per category for 50 total
  
  // Accumulate valid questions across retries
  let allValidQuestions = [];
  
  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      // Calculate how many questions we still need
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
          studentId,
          attemptId,
          gradeLevel // Pass gradeLevel to API
        })
      });

      if (!response.ok) {
        // Handle API errors with appropriate retry logic
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

      const data = await response.json();
      
      // Validate response structure
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
      
      // Validate question quality using validateQuestionBatch
      const validation = validateQuestionBatch(data.questions, 'aptitude', questionCount);
      
      // Add valid questions to our accumulator
      const newValidQuestions = validation.valid;
      allValidQuestions = [...allValidQuestions, ...newValidQuestions];
      
      // Remove duplicates based on question text
      allValidQuestions = allValidQuestions.filter((q, index, self) =>
        index === self.findIndex((t) => (t.text || t.question) === (q.text || q.question))
      );
      
      console.log(`📊 Validation: ${newValidQuestions.length} new valid, ${validation.invalid.length} invalid`);
      console.log(`📊 Total accumulated: ${allValidQuestions.length}/${questionCount} questions`);
      
      // Check if we have enough questions now
      if (allValidQuestions.length >= questionCount) {
        // Take only the first questionCount questions
        const finalQuestions = allValidQuestions.slice(0, questionCount);
        console.log(`✅ Success! Have ${finalQuestions.length} valid questions`);
        
        // Save valid questions if we have studentId
        if (finalQuestions.length > 0 && studentId && !data.cached) {
          console.log('💾 Saving questions to database...');
          await saveAptitudeQuestions(studentId, streamId, attemptId, finalQuestions, gradeLevel);
        }
        
        return finalQuestions;
      }
      
      // If we still need more questions and have retries left, continue
      if (attempt < maxRetries) {
        const needed = questionCount - allValidQuestions.length;
        console.log(`🔄 Need ${needed} more questions, retrying (attempt ${attempt + 1}/${maxRetries})...`);
        await new Promise(resolve => setTimeout(resolve, 2000 * attempt));
        continue;
      }
      
      // Last attempt - use what we have if it's close enough (within 10%)
      const threshold = Math.floor(questionCount * 0.9); // 90% threshold
      if (allValidQuestions.length >= threshold) {
        console.warn(`⚠️ Only have ${allValidQuestions.length}/${questionCount} questions, but accepting (above 90% threshold)`);
        
        // Save what we have
        if (allValidQuestions.length > 0 && studentId && !data.cached) {
          console.log('💾 Saving questions to database...');
          await saveAptitudeQuestions(studentId, streamId, attemptId, allValidQuestions, gradeLevel);
        }
        
        return allValidQuestions;
      }
      
      // Failed to get enough questions
      console.error(`❌ Failed to get enough questions after ${maxRetries} attempts. Got ${allValidQuestions.length}/${questionCount}.`);
      return null;
    } catch (error) {
      // Handle network/fetch errors
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
