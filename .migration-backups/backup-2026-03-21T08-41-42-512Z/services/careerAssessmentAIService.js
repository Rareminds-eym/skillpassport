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
  getSavedQuestionsForStudent, 
  saveAptitudeQuestions, 
  saveKnowledgeQuestions, 
  clearSavedQuestionsForStudent 
} from './assessment/assessmentRepository.js';
export { 
  generateWithValidation, 
  generateStreamKnowledgeQuestions, 
  generateAptitudeQuestions 
} from './assessment/questionGenerator.js';

import { normalizeStreamId } from './assessment/streamUtils.js';
import { generateAptitudeQuestions, generateStreamKnowledgeQuestions } from './assessment/questionGenerator.js';
import { getSavedQuestionsForStudent, clearSavedQuestionsForStudent } from './assessment/assessmentRepository.js';
import { STREAM_KNOWLEDGE_PROMPTS, APTITUDE_CATEGORIES } from './assessment/streamPrompts.js';

/**
 * Load questions for career assessment
 * - If student has saved questions (from previous attempt), loads those
 * - Otherwise generates fresh AI questions and saves them
 * - Main entry point for assessment question loading
 */
export async function loadCareerAssessmentQuestions(streamId, gradeLevel, studentId = null, attemptId = null, studentCourse = null) {
  const questions = {
    aptitude: null,
    knowledge: null
  };

  // Generate AI questions for after10, after12, higher_secondary AND college grade levels
  if ((gradeLevel === 'after10' || gradeLevel === 'after12' || gradeLevel === 'higher_secondary' || gradeLevel === 'college') && streamId) {
    console.log(`🤖 Loading AI questions for ${gradeLevel} student, stream:`, streamId, 'studentId:', studentId);
    
    // Normalize stream ID for college students
    const normalizedStreamId = normalizeStreamId(streamId);
    console.log(`📋 Normalized stream ID: ${normalizedStreamId}`);
    
    // For college students, use their actual course for knowledge questions
    if (gradeLevel === 'college' && studentCourse) {
      console.log(`🎓 College student - using course "${studentCourse}" for knowledge questions instead of stream`);
    }
    
    // Generate/load aptitude questions first (will use saved if available)
    // Pass gradeLevel so API knows to use appropriate difficulty
    const aiAptitude = await generateAptitudeQuestions(normalizedStreamId, 50, studentId, attemptId, gradeLevel);
    
    if (aiAptitude && aiAptitude.length > 0) {
      questions.aptitude = aiAptitude;
      console.log(`✅ Using ${aiAptitude.length} AI aptitude questions`);
    }
    
    // Add delay between API calls to avoid rate limiting
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    // Generate/load knowledge questions (will use saved if available)
    // For college students, pass their course; for others, use normalized stream
    const knowledgeStreamId = (gradeLevel === 'college' && studentCourse) ? studentCourse : normalizedStreamId;
    const aiKnowledge = await generateStreamKnowledgeQuestions(knowledgeStreamId, 20, studentId, attemptId, gradeLevel);
    
    if (aiKnowledge && aiKnowledge.length > 0) {
      questions.knowledge = aiKnowledge;
      console.log(`✅ Using ${aiKnowledge.length} AI knowledge questions`);
    }
  }

  return questions;
}

// Default export for backward compatibility
export default {
  generateStreamKnowledgeQuestions,
  generateAptitudeQuestions,
  loadCareerAssessmentQuestions,
  getSavedQuestionsForStudent,
  clearSavedQuestionsForStudent,
  normalizeStreamId,
  STREAM_KNOWLEDGE_PROMPTS,
  APTITUDE_CATEGORIES
};
