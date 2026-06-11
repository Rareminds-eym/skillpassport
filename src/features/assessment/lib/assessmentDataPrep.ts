/**
 * Assessment Data Preparation Service
 * Handles data transformation and validation for AI analysis
 *
 * @version 2.1.0
 */

import { getLogger } from '@/shared/config/logging';

const logger = getLogger('assessment-data-prep');

// ============================================================================
// VALIDATION
// ============================================================================

/**
 * Validate that all required fields are present in the AI response
 * @param results - Parsed results from AI
 * @returns { isValid, missingFields }
 */
export const validateResults = (results: any): { isValid: boolean; missingFields: string[] } => {
  const missingFields: string[] = [];

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
export const formatTimeForPrompt = (seconds: number | null | undefined): string => {
  if (!seconds || seconds <= 0) return 'Not recorded';
  const mins = Math.floor(seconds / 60);
  const secs = seconds % 60;
  if (mins === 0) return `${secs} seconds`;
  if (secs === 0) return `${mins} minute${mins > 1 ? 's' : ''}`;
  return `${mins} minute${mins > 1 ? 's' : ''} ${secs} second${secs > 1 ? 's' : ''}`;
};

/**
 * Get section prefix based on grade level
 *
 * Maps base section names to their database section prefixes according to grade level.
 * This is critical for correct answer extraction from the database.
 *
 * Grade Level Categories:
 * - Middle School (grades 6-8): Simplified assessment with 'middle_' prefixed sections
 * - High School (grades 9-10): Simplified assessment with 'hs_' prefixed sections
 * - Higher Secondary (grades 11-12): Comprehensive assessment with standard section names
 * - After 10th/After 12th/College: Comprehensive assessment with standard section names
 *
 * @param baseSection - The base section name ('riasec', 'bigfive', 'aptitude', 'knowledge', 'values', 'employability')
 * @param gradeLevel - The learner's grade level ('middle', 'highschool', 'higher_secondary', 'after10', 'after12', 'college')
 * @returns The database section prefix to use for answer extraction
 *
 * Examples:
 * - getSectionPrefix('riasec', 'middle') → 'middle_interest_explorer'
 * - getSectionPrefix('riasec', 'highschool') → 'hs_interest_explorer'
 * - getSectionPrefix('riasec', 'higher_secondary') → 'riasec' (no prefix)
 * - getSectionPrefix('riasec', 'college') → 'riasec' (no prefix)
 *
 * Exported for testing
 */
export const getSectionPrefix = (baseSection: string, gradeLevel: string): string => {
  // Middle school (grades 6-8) uses simplified sections with 'middle_' prefix
  if (gradeLevel === 'middle') {
    const middleSchoolMap: Record<string, string> = {
      'riasec': 'middle_interest_explorer',
      'bigfive': 'middle_strengths_character',
      'knowledge': 'middle_learning_preferences'
    };
    return middleSchoolMap[baseSection] || baseSection;
  }

  // High school (grades 9-10) uses simplified sections with 'hs_' prefix
  if (gradeLevel === 'highschool') {
    const highSchoolMap: Record<string, string> = {
      'riasec': 'hs_interest_explorer',
      'bigfive': 'hs_strengths_character',
      'aptitude': 'hs_aptitude_sampling',
      'knowledge': 'hs_learning_preferences'
    };
    return highSchoolMap[baseSection] || baseSection;
  }

  // Higher secondary (grades 11-12), after10, after12 and college all use
  // comprehensive sections with standard names — no prefix mapping needed.
  return baseSection;
};

/**
 * Prepare raw assessment answers for backend AI analysis.
 *
 * Extracts and structures answers per section (RIASEC, Big Five, Work Values,
 * Knowledge, Aptitude), computes timing metrics and aptitude scores, and
 * normalizes learner context.
 *
 * @param answers - Raw answers map keyed by question id
 * @param stream - Learner's stream/program
 * @param questionBanks - Question banks per section (may be partially empty)
 * @param sectionTimings - Seconds spent per section
 * @param gradeLevel - Learner's grade level
 * @param preCalculatedScores - Optional pre-calculated scores (results-retry path)
 * @param learnerContext - Additional learner context (may be null)
 * @param adaptiveResults - Adaptive aptitude results (may be null)
 * @param allSections - Complete section data with question metadata from the
 *   assessment form; used as the question-metadata source when banks are empty
 * @returns Structured assessment data payload for the analyze-assessment API
 */
export const prepareAssessmentData = (
  answers: any,
  stream: string,
  questionBanks: any,
  sectionTimings: any = {},
  gradeLevel: string = 'after12',
  preCalculatedScores: any = null,
  learnerContext: any = {},
  adaptiveResults: any = null,
  allSections: any[] | null = null
): any => {
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

  // Extracted answers per section
  const riasecAnswers: Record<string, any> = {};
  const bigFiveAnswers: Record<string, any> = {};
  const workValuesAnswers: Record<string, any> = {};
  const employabilityAnswers: { selfRating: Record<string, any>; sjt: any[] } = { selfRating: {}, sjt: [] };
  const knowledgeAnswers: Record<string, any> = {};
  const aptitudeAnswers: Record<string, any[]> = { verbal: [], numerical: [], abstract: [], spatial: [], clerical: [] };

  const bigFivePrefix = getSectionPrefix('bigfive', gradeLevel);
  const knowledgePrefix = getSectionPrefix('knowledge', gradeLevel);

  // When allSections is provided (from the assessment form), flatten it into a
  // single question-metadata list. Answers are keyed by question id, and the
  // section questions are the same objects those ids came from.
  const allQuestions: any[] = [];
  if (allSections && Array.isArray(allSections)) {
    allSections.forEach((section: any) => {
      if (section.questions && Array.isArray(section.questions)) {
        allQuestions.push(...section.questions);
      }
    });
  }

  // Extract RIASEC answers - match against questions with categoryMapping
  Object.entries(answers).forEach(([questionId, value]) => {
    // Skip non-question keys (like resultId, adaptive fields, etc)
    if (typeof value === 'object' && value !== null && !Array.isArray(value)) return;

    // Find question metadata from allQuestions first, fallback to riasecQuestions
    const question = allQuestions.find((q: any) => q.id === questionId) ||
                     riasecQuestions?.find((q: any) => q.id === questionId);

    // Only include if question has categoryMapping (indicates RIASEC question)
    if (question && question.categoryMapping) {
      const mappingType = question.categoryMapping?.type;
      const riasecType = question.riasecType ||
        (['R', 'I', 'A', 'S', 'E', 'C'].includes(mappingType) ? mappingType : undefined);

      riasecAnswers[questionId] = {
        questionId,
        question: question.text,
        answer: value,
        riasecType,
        categoryMapping: question.categoryMapping,
        questionType: question.type || 'multiselect'
      };
    }
  });

  logger.info('RIASEC answers extracted:', { count: Object.keys(riasecAnswers).length });

  // Extract BigFive answers
  Object.entries(answers).forEach(([key, value]) => {
    if (key.startsWith(`${bigFivePrefix}_`)) {
      const questionId = key.replace(`${bigFivePrefix}_`, '');
      const question = bigFiveQuestions?.find((q: any) => q.id === questionId);

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
      const question = workValuesQuestions?.find((q: any) => q.id === questionId);

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
      const question = streamQuestions.find((q: any) => q.id === questionId);

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

  // Extract Aptitude answers (AI-generated questions from career_assessment_ai_questions table)
  // These questions are generated dynamically and stored with keys like "aptitude_q1", "aptitude_q2", etc.
  Object.entries(answers).forEach(([key, value]) => {
    if (key.startsWith('aptitude_')) {
      const questionId = key.replace('aptitude_', '');

      // Try to find question in aptitudeQuestions bank (if provided)
      const question = aptitudeQuestions?.find((q: any) => q.id === questionId || q.id === key);

      if (question) {
        const isCorrect = value === (question.correct_answer || question.correctAnswer || question.correct);
        const subtype = question.subtype || question.category || 'general';

        // Store in structured format for backend processing
        if (!aptitudeAnswers[subtype]) {
          aptitudeAnswers[subtype] = [];
        }

        aptitudeAnswers[subtype].push({
          questionId: key,
          question: question.text || question.question,
          learnerAnswer: value,
          correctAnswer: question.correct_answer || question.correctAnswer || question.correct,
          isCorrect,
          subtype
        });
      } else {
        // If question not found in bank, still store the answer
        // Backend will match it with questions from database
        logger.warn(`Aptitude question ${key} not found in question bank`);
        if (!aptitudeAnswers.general) {
          aptitudeAnswers.general = [];
        }
        aptitudeAnswers.general.push({
          questionId: key,
          learnerAnswer: value
        });
      }
    }
  });

  logger.info('Aptitude answers extracted:', {
    count: Object.values(aptitudeAnswers).reduce((sum: number, arr: any) => sum + (Array.isArray(arr) ? arr.length : 0), 0),
    subtypes: Object.keys(aptitudeAnswers).filter(k => Array.isArray(aptitudeAnswers[k]) && aptitudeAnswers[k].length > 0)
  });

  // Calculate timing metrics
  const timingData: any = {
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
    totalTime: Object.values(sectionTimings).reduce((sum: number, t: any) => sum + (t || 0), 0)
  };
  timingData.totalFormatted = formatTimeForPrompt(timingData.totalTime);

  // Calculate aptitude scores from extracted answers
  const calculatedAptitudeScores: Record<string, { correct: number; total: number; percentage: number }> = {
    verbal: { correct: 0, total: 0, percentage: 0 },
    numerical: { correct: 0, total: 0, percentage: 0 },
    abstract: { correct: 0, total: 0, percentage: 0 },
    spatial: { correct: 0, total: 0, percentage: 0 },
    clerical: { correct: 0, total: 0, percentage: 0 }
  };

  if (aptitudeQuestions && aptitudeQuestions.length > 0) {
    logger.info('Calculating aptitude scores from answers...');

    // Convert aptitudeAnswers to flat array format for scoring
    const flatAptitudeAnswers: any[] = [];
    Object.values(aptitudeAnswers).forEach(categoryAnswers => {
      if (Array.isArray(categoryAnswers)) {
        categoryAnswers.forEach(ans => {
          flatAptitudeAnswers.push({
            question_id: ans.questionId.replace('aptitude_', ''),
            selected_answer: ans.learnerAnswer,
            correct_answer: ans.correctAnswer,
            is_correct: ans.isCorrect
          });
        });
      }
    });

    // Calculate scores by category
    flatAptitudeAnswers.forEach(answer => {
      const question = aptitudeQuestions.find((q: any) => q.id === answer.question_id || `aptitude_${q.id}` === answer.question_id);
      if (question) {
        const category = (question.subtype || question.category || 'verbal').toLowerCase();
        const mappedCategory = category.includes('numerical') || category.includes('math') ? 'numerical' :
                              category.includes('verbal') || category.includes('english') ? 'verbal' :
                              category.includes('abstract') || category.includes('logical') ? 'abstract' :
                              category.includes('spatial') ? 'spatial' :
                              category.includes('clerical') ? 'clerical' : 'verbal';

        if (calculatedAptitudeScores[mappedCategory]) {
          calculatedAptitudeScores[mappedCategory].total++;
          if (answer.is_correct) {
            calculatedAptitudeScores[mappedCategory].correct++;
          }
        }
      }
    });

    // Calculate percentages
    Object.keys(calculatedAptitudeScores).forEach(category => {
      const scores = calculatedAptitudeScores[category];
      scores.percentage = scores.total > 0 ? Math.round((scores.correct / scores.total) * 100) : 0;
    });

    logger.info('Aptitude scores calculated:', calculatedAptitudeScores);
  }

  logger.info('=== ASSESSMENT DATA PREPARED ===');
  logger.info('Backend will calculate all scores from raw answers');

  return {
    stream,
    gradeLevel,
    riasecAnswers,
    aptitudeAnswers,
    // Prefer caller-supplied scores (results-retry path passes them from the
    // stored attempt); otherwise use the scores calculated above
    aptitudeScores: preCalculatedScores?.aptitude || calculatedAptitudeScores,
    bigFiveAnswers,
    workValuesAnswers,
    employabilityAnswers,
    knowledgeAnswers,
    totalKnowledgeQuestions: streamQuestions.length,
    totalAptitudeQuestions: aptitudeQuestions?.length || 50,
    sectionTimings: timingData,
    adaptiveAptitudeResults: adaptiveResults,
    learnerContext: learnerContext ? {
      rawGrade: learnerContext.rawGrade || null,
      programName: learnerContext.programName || null,
      programCode: learnerContext.programCode || null,
      degreeLevel: learnerContext.degreeLevel || null
    } : {
      rawGrade: null,
      programName: null,
      programCode: null,
      degreeLevel: null
    }
  };
};
