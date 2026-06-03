/**
 * Assessment Data Preparation Service
 * Handles data transformation and validation for AI analysis
 * 
 * @version 2.1.0
 */

import { calculateStreamRecommendations } from '@/features/assessment';
import { getLogger } from '@/shared/config/logging';

const logger = getLogger('assessment-data-prep');

// ============================================================================
// VALIDATION
// ============================================================================

/**
 * Validate that all required fields are present in the AI response
 * @param {Object} results - Parsed results from AI
 * @returns {Object} - { isValid: boolean, missingFields: string[] }
 */
export const validateResults = (results) => {
  const missingFields = [];

  // Core sections
  if (!results.riasec?.topThree?.length) missingFields.push('riasec.topThree');
  if (!results.aptitude?.scores) missingFields.push('aptitude.scores');
  if (!results.aptitude?.topStrengths?.length) missingFields.push('aptitude.topStrengths');
  if (!results.bigFive || typeof results.bigFive.O === 'undefined') missingFields.push('bigFive');
  if (!results.workValues?.topThree?.length) missingFields.push('workValues.topThree');
  if (!results.employability?.strengthAreas?.length) missingFields.push('employability');
  if (!results.knowledge || typeof results.knowledge.score === 'undefined') missingFields.push('knowledge');
  
  // Career fit (critical)
  if (!results.careerFit?.clusters?.length) missingFields.push('careerFit.clusters');
  
  // Skill gap and roadmap
  if (!results.skillGap?.priorityA?.length) missingFields.push('skillGap');
  if (!results.roadmap?.projects?.length) missingFields.push('roadmap');
  
  // Summary sections
  if (!results.finalNote?.advantage) missingFields.push('finalNote');
  if (!results.profileSnapshot?.aptitudeStrengths?.length) missingFields.push('profileSnapshot.aptitudeStrengths');
  if (!results.overallSummary) missingFields.push('overallSummary');

  // Optional but log if missing
  if (!results.timingAnalysis?.overallPace) {
    logger.info('Note: timingAnalysis not included in response');
  }

  return {
    isValid: missingFields.length === 0,
    missingFields
  };
};

/**
 * Format seconds to readable time string
 */
export const formatTimeForPrompt = (seconds) => {
  if (!seconds || seconds <= 0) return 'Not recorded';
  const mins = Math.floor(seconds / 60);
  const secs = seconds % 60;
  if (mins === 0) return `${secs} seconds`;
  if (secs === 0) return `${mins} minute${mins > 1 ? 's' : ''}`;
  return `${mins} minute${mins > 1 ? 's' : ''} ${secs} second${secs > 1 ? 's' : ''}`;
};
/**
 * GRADE LEVEL TO SECTION PREFIX MAPPING
 * 
 * This constant documents the complete mapping between grade levels and database section prefixes.
 * Each grade level uses different assessment sections stored in personal_assessment_sections table.
 * 
 * Grade Level Categories:
 * - Middle School (grades 6-8): Simplified assessment with age-appropriate sections
 * - High School (grades 9-10): Simplified assessment with career exploration focus
 * - Higher Secondary (grades 11-12): Comprehensive assessment with standard sections
 * - After 10th/After 12th/College: Comprehensive assessment with standard sections
 */
const GRADE_LEVEL_MAPPINGS = {
  'middle': {
    riasec: 'middle_interest_explorer',      // Simplified interest assessment for middle school
    bigfive: 'middle_strengths_character',   // Character strengths assessment
    knowledge: 'middle_learning_preferences', // Learning style preferences
    aptitude: 'middle_aptitude_sampling'     // Basic aptitude sampling (if exists)
  },
  'highschool': {
    riasec: 'hs_interest_explorer',          // High school interest exploration
    bigfive: 'hs_strengths_character',       // High school character assessment
    aptitude: 'hs_aptitude_sampling',        // High school aptitude sampling
    knowledge: 'hs_learning_preferences'     // High school learning preferences
  },
  'higher_secondary': {
    // Higher secondary (grades 11-12) uses comprehensive sections with standard names
    riasec: 'riasec',                        // Standard RIASEC interest inventory
    bigfive: 'bigfive',                      // Standard Big Five personality
    knowledge: 'knowledge',                  // Standard knowledge assessment
    aptitude: 'aptitude',                    // Standard aptitude test
    values: 'values',                        // Work values assessment
    employability: 'employability'           // Employability skills
  },
  'after10': {
    // After 10th uses comprehensive sections (same as higher_secondary)
    riasec: 'riasec',
    bigfive: 'bigfive',
    knowledge: 'knowledge',
    aptitude: 'aptitude',
    values: 'values',
    employability: 'employability'
  },
  'after12': {
    // After 12th uses comprehensive sections (same as higher_secondary)
    riasec: 'riasec',
    bigfive: 'bigfive',
    knowledge: 'knowledge',
    aptitude: 'aptitude',
    values: 'values',
    employability: 'employability'
  },
  'college': {
    // College uses comprehensive sections (same as higher_secondary)
    riasec: 'riasec',
    bigfive: 'bigfive',
    knowledge: 'knowledge',
    aptitude: 'aptitude',
    values: 'values',
    employability: 'employability'
  }
};
/**
 * Get section prefix based on grade level
 * 
 * Maps base section names to their database section prefixes according to grade level.
 * This is critical for correct answer extraction from the database.
 * 
 * @param {string} baseSection - The base section name ('riasec', 'bigfive', 'aptitude', 'knowledge', 'values', 'employability')
 * @param {string} gradeLevel - The learner's grade level ('middle', 'highschool', 'higher_secondary', 'after10', 'after12', 'college')
 * @returns {string} The database section prefix to use for answer extraction
 * 
 * Examples:
 * - getSectionPrefix('riasec', 'middle') → 'middle_interest_explorer'
 * - getSectionPrefix('riasec', 'highschool') → 'hs_interest_explorer'
 * - getSectionPrefix('riasec', 'higher_secondary') → 'riasec' (no prefix)
 * - getSectionPrefix('riasec', 'college') → 'riasec' (no prefix)
 * 
 * Exported for testing
 */
export const getSectionPrefix = (baseSection, gradeLevel) => {
  // Middle school (grades 6-8) uses simplified sections with 'middle_' prefix
  if (gradeLevel === 'middle') {
    const middleSchoolMap = {
      'riasec': 'middle_interest_explorer',
      'bigfive': 'middle_strengths_character',
      'knowledge': 'middle_learning_preferences'
    };
    return middleSchoolMap[baseSection] || baseSection;
  } 
  
  // High school (grades 9-10) uses simplified sections with 'hs_' prefix
  else if (gradeLevel === 'highschool') {
    const highSchoolMap = {
      'riasec': 'hs_interest_explorer',
      'bigfive': 'hs_strengths_character',
      'aptitude': 'hs_aptitude_sampling',
      'knowledge': 'hs_learning_preferences'
    };
    return highSchoolMap[baseSection] || baseSection;
  }
  
  // Higher secondary (grades 11-12) uses comprehensive sections with standard names (no prefix)
  // This is the FIX for the bug: explicitly handle 'higher_secondary' to return base section
  else if (gradeLevel === 'higher_secondary') {
    // No prefix mapping - use standard section names
    // 'riasec' → 'riasec', 'bigfive' → 'bigfive', 'aptitude' → 'aptitude', etc.
    return baseSection;
  }
  
  // After10, after12, college use comprehensive sections with standard names (no prefix)
  // Default case: return base section without modification
  return baseSection;
};
export const prepareAssessmentData = (answers, stream, questionBanks, sectionTimings = {}, gradeLevel = 'after12', preCalculatedScores = null, learnerContext = {}, adaptiveResults = null) => {
  const { 
    riasecQuestions, 
    aptitudeQuestions, 
    bigFiveQuestions, 
    workValuesQuestions, 
    employabilityQuestions, 
    streamKnowledgeQuestions 
  } = questionBanks;

  // Extract adaptive results if not provided
  if (!adaptiveResults && answers.adaptive_aptitude_results) {
    adaptiveResults = answers.adaptive_aptitude_results;
  }

  logger.info('=== prepareAssessmentData EXTRACTION START ===', { gradeLevel, stream });

  // Extract answers by section
  const riasecAnswers = {};
  const bigFiveAnswers = {};
  const workValuesAnswers = {};
  const employabilityAnswers = { selfRating: {}, sjt: [] };
  const knowledgeAnswers = {};
  const aptitudeAnswers = { verbal: [], numerical: [], abstract: [], spatial: [], clerical: [] };

  const riasecPrefix = getSectionPrefix('riasec', gradeLevel);
  const bigFivePrefix = getSectionPrefix('bigfive', gradeLevel);
  const aptitudePrefix = getSectionPrefix('aptitude', gradeLevel);
  const knowledgePrefix = getSectionPrefix('knowledge', gradeLevel);

  // Extract RIASEC answers
  Object.entries(answers).forEach(([key, value]) => {
    if (key.startsWith(`${riasecPrefix}_`)) {
      const questionId = key.replace(`${riasecPrefix}_`, '');
      const question = riasecQuestions?.find(q => q.id === questionId);
      
      if (question) {
        riasecAnswers[questionId] = {
          questionId,
          question: question.text,
          answer: value,
          riasecType: question.type,
          categoryMapping: question.categoryMapping,
          questionType: question.categoryMapping ? 'multiselect' : 'rating'
        };
      }
    }
  });

  logger.info('RIASEC answers extracted:', { count: Object.keys(riasecAnswers).length });

  // Extract BigFive answers
  Object.entries(answers).forEach(([key, value]) => {
    if (key.startsWith(`${bigFivePrefix}_`)) {
      const questionId = key.replace(`${bigFivePrefix}_`, '');
      const question = bigFiveQuestions?.find(q => q.id === questionId);
      
      if (question) {
        bigFiveAnswers[questionId] = { question: question.text, answer: value };
      }
    }
  });

  logger.info('BigFive answers extracted:', { count: Object.keys(bigFiveAnswers).length });

  // Extract Work Values answers
  Object.entries(answers).forEach(([key, value]) => {
    if (key.startsWith('values_')) {
      const questionId = key.replace('values_', '');
      const question = workValuesQuestions?.find(q => q.id === questionId);
      
      if (question) {
        workValuesAnswers[questionId] = { question: question.text, answer: value };
      }
    }
  });

  logger.info('WorkValues answers extracted:', { count: Object.keys(workValuesAnswers).length });

  // Extract Knowledge answers
  const streamQuestions = streamKnowledgeQuestions?.[stream] || [];
  Object.entries(answers).forEach(([key, value]) => {
    if (key.startsWith(`${knowledgePrefix}_`)) {
      const questionId = key.replace(`${knowledgePrefix}_`, '');
      const question = streamQuestions.find(q => q.id === questionId);
      
      if (question) {
        const isCorrect = value === (question.correct_answer || question.correctAnswer || question.correct);
        knowledgeAnswers[questionId] = {
          question: question.text,
          learnerAnswer: value,
          correctAnswer: question.correct_answer || question.correctAnswer || question.correct,
          isCorrect
        };
      }
    }
  });

  logger.info('Knowledge answers extracted:', { count: Object.keys(knowledgeAnswers).length });

  // Calculate timing metrics
  const timingData = {
    riasec: {
      seconds: sectionTimings.riasec || 0,
      formatted: formatTimeForPrompt(sectionTimings.riasec),
      questionsCount: riasecQuestions?.length || 0
    },
    aptitude: {
      seconds: sectionTimings.aptitude || 0,
      formatted: formatTimeForPrompt(sectionTimings.aptitude),
      questionsCount: aptitudeQuestions?.length || 0
    },
    bigfive: {
      seconds: sectionTimings.bigfive || 0,
      formatted: formatTimeForPrompt(sectionTimings.bigfive),
      questionsCount: bigFiveQuestions?.length || 0
    },
    values: {
      seconds: sectionTimings.values || 0,
      formatted: formatTimeForPrompt(sectionTimings.values),
      questionsCount: workValuesQuestions?.length || 0
    },
    employability: {
      seconds: sectionTimings.employability || 0,
      formatted: formatTimeForPrompt(sectionTimings.employability),
      questionsCount: employabilityQuestions?.length || 0
    },
    knowledge: {
      seconds: sectionTimings.knowledge || 0,
      formatted: formatTimeForPrompt(sectionTimings.knowledge),
      questionsCount: streamQuestions.length
    },
    totalTime: Object.values(sectionTimings).reduce((sum, t) => sum + (t || 0), 0)
  };
  timingData.totalFormatted = formatTimeForPrompt(timingData.totalTime);

  logger.info('=== ASSESSMENT DATA PREPARED ===');

  return {
    stream,
    gradeLevel,
    riasecAnswers,
    aptitudeAnswers,
    aptitudeScores: preCalculatedScores?.aptitude || {},
    bigFiveAnswers,
    workValuesAnswers,
    employabilityAnswers,
    knowledgeAnswers,
    totalKnowledgeQuestions: streamQuestions.length,
    totalAptitudeQuestions: aptitudeQuestions?.length || 50,
    sectionTimings: timingData,
    adaptiveAptitudeResults: adaptiveResults,
    learnerContext: {
      rawGrade: learnerContext.rawGrade || null,
      programName: learnerContext.programName || null,
      programCode: learnerContext.programCode || null,
      degreeLevel: learnerContext.degreeLevel || null
    }
  };
};