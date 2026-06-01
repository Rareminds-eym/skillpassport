/**
 * Career Assessment AI Service (Refactored)
 * Main orchestration layer for AI-based career assessment questions
 * 
 * This service coordinates question generation for Aptitude and Stream Knowledge sections
 * - Delegates to specialized modules for validation, error handling, and database operations
 * - Maintains backward compatibility with existing API
 */

// Export all public APIs from modules
export { STREAM_KNOWLEDGE_PROMPTS, APTITUDE_CATEGORIES } from './assessment/streamPrompts.js';
export { normalizeStreamId, getFallbackKnowledgeQuestions } from './assessment/streamUtils.js';
export { validateQuestion, validateQuestionBatch } from './assessment/questionValidator.js';
export { 
  QuestionGenerationError, 
  ERROR_MESSAGES, 
  classifyError, 
  getUserErrorMessage, 
  handleAPIError, 
  handleNetworkError, 
  handleDatabaseError, 
  handleInsufficientQuestions 
} from './assessment/assessmentErrors.js';
export { 
  getSavedQuestionsForLearner, 
  saveAptitudeQuestions, 
  saveKnowledgeQuestions, 
  clearSavedQuestionsForLearner 
} from './assessment/assessmentRepository.js';
export { 
  generateWithValidation, 
  generateStreamKnowledgeQuestions, 
  generateAptitudeQuestions 
} from './assessment/questionGenerator.js';

import { normalizeStreamId } from './assessment/streamUtils.js';
import { generateAptitudeQuestions, generateStreamKnowledgeQuestions } from './assessment/questionGenerator.js';
import { getSavedQuestionsForLearner, clearSavedQuestionsForLearner } from './assessment/assessmentRepository.js';
import { STREAM_KNOWLEDGE_PROMPTS, APTITUDE_CATEGORIES } from './assessment/streamPrompts.js';

/**
 * Load questions for career assessment
 * - If learner has saved questions (from previous attempt), loads those
 * - Otherwise generates fresh AI questions and saves them
 * - Main entry point for assessment question loading
 */
export async function loadCareerAssessmentQuestions(streamId, gradeLevel, learnerId = null, attemptId = null, learnerCourse = null) {
  const questions = {
    aptitude: null,
    knowledge: null
  };

  // Generate AI questions for after10, after12, higher_secondary AND college grade levels
  if ((gradeLevel === 'after10' || gradeLevel === 'after12' || gradeLevel === 'higher_secondary' || gradeLevel === 'college') && streamId) {
    console.log(`🤖 Loading AI questions for ${gradeLevel} learner, stream:`, streamId, 'learnerId:', learnerId, 'attemptId:', attemptId);
    
    // Normalize stream ID for college learners
    const normalizedStreamId = normalizeStreamId(streamId);
    console.log(`📋 Normalized stream ID: ${normalizedStreamId}`);
    
    // For college learners, use their actual course for knowledge questions
    if (gradeLevel === 'college' && learnerCourse) {
      console.log(`🎓 College learner - using course "${learnerCourse}" for knowledge questions instead of stream`);
    }
    
    // RESUME LOGIC: Check for saved questions first whenever learnerId is known.
    // Cache is keyed by (learner_id, stream_id, question_type) — attemptId is not
    // part of the lookup. Gating on attemptId caused cache misses on cold mounts
    // where store.attemptId is not yet set, leading to unnecessary re-generation.
    if (learnerId) {
      console.log('🔄 Checking for saved questions first');
      
      try {
        // Check for saved aptitude questions
        const savedAptitude = await getSavedQuestionsForLearner(learnerId, normalizedStreamId, 'aptitude');
        if (savedAptitude && savedAptitude.length > 0) {
          questions.aptitude = savedAptitude;
          console.log(`✅ RESUME: Using ${savedAptitude.length} saved aptitude questions`);
        }
        
        // Check for saved knowledge questions
        const knowledgeStreamId = (gradeLevel === 'college' && learnerCourse) ? learnerCourse : normalizedStreamId;
        const savedKnowledge = await getSavedQuestionsForLearner(learnerId, knowledgeStreamId, 'knowledge');
        if (savedKnowledge && savedKnowledge.length > 0) {
          questions.knowledge = savedKnowledge;
          console.log(`✅ RESUME: Using ${savedKnowledge.length} saved knowledge questions`);
        }
        
        // If we have both saved question sets, return them immediately
        if (questions.aptitude && questions.knowledge) {
          console.log('✅ RESUME: All questions loaded from cache, skipping AI generation');
          return questions;
        }
        
        // If we have some saved questions, log what we still need to generate
        if (questions.aptitude || questions.knowledge) {
          console.log('⚠️ RESUME: Partial cache hit - will generate missing questions:', {
            hasAptitude: !!questions.aptitude,
            hasKnowledge: !!questions.knowledge,
            needsAptitude: !questions.aptitude,
            needsKnowledge: !questions.knowledge
          });
        } else {
          console.log('ℹ️ RESUME: No saved questions found - will generate fresh questions');
        }
      } catch (error) {
        console.warn('⚠️ RESUME: Error checking saved questions, will generate fresh:', error.message);
      }
    }
    
    // Generate missing aptitude questions (if not loaded from cache)
    if (!questions.aptitude) {
      console.log('🤖 Generating aptitude questions...');
      const aiAptitude = await generateAptitudeQuestions(normalizedStreamId, 50, learnerId, attemptId, gradeLevel);
      
      if (aiAptitude && aiAptitude.length > 0) {
        questions.aptitude = aiAptitude;
        console.log(`✅ Using ${aiAptitude.length} AI aptitude questions`);
      }
    }
    
    // Add delay between API calls to avoid rate limiting (only if we need to generate knowledge questions)
    if (!questions.knowledge) {
      await new Promise(resolve => setTimeout(resolve, 2000));
    }
    
    // Generate missing knowledge questions (if not loaded from cache)
    if (!questions.knowledge) {
      console.log('🤖 Generating knowledge questions...');
      const knowledgeStreamId = (gradeLevel === 'college' && learnerCourse) ? learnerCourse : normalizedStreamId;
      const aiKnowledge = await generateStreamKnowledgeQuestions(knowledgeStreamId, 20, learnerId, attemptId, gradeLevel);
      
      if (aiKnowledge && aiKnowledge.length > 0) {
        questions.knowledge = aiKnowledge;
        console.log(`✅ Using ${aiKnowledge.length} AI knowledge questions`);
      }
    }
  }

  return questions;
}

// Default export for backward compatibility
export default {
  generateStreamKnowledgeQuestions,
  generateAptitudeQuestions,
  loadCareerAssessmentQuestions,
  getSavedQuestionsForLearner,
  clearSavedQuestionsForLearner,
  normalizeStreamId,
  STREAM_KNOWLEDGE_PROMPTS,
  APTITUDE_CATEGORIES
};
