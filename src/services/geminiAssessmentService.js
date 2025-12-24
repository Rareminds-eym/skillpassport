/**
 * AI Assessment Service
 * Uses OpenRouter API via Cloudflare Worker to analyze assessment answers and provide personalized results
 * 
 * Feature: rag-course-recommendations
 * Requirements: 4.1, 5.2, 6.3
 */

import {
    getCoursesForMultipleSkillGaps,
    getRecommendedCourses,
    getRecommendedCoursesByType
} from './courseRecommendationService';

/**
 * Call OpenRouter API via Cloudflare Worker for assessment analysis
 * Uses the backend worker which handles OpenRouter API calls with proper authentication
 * 
 * @param {Object} assessmentData - The assessment data to analyze
 * @returns {Promise<Object>} - The analyzed results
 */
const callOpenRouterAssessment = async (assessmentData) => {
  const API_URL = import.meta.env.VITE_CAREER_API_URL || 'https://career-api.dark-mode-d021.workers.dev';

  // Get current session for auth token
  const { data: { session } } = await import('../lib/supabaseClient').then(m => m.supabase.auth.getSession());
  const token = session?.access_token;

  if (!token) {
    throw new Error('Authentication required for assessment analysis');
  }

  console.log('🤖 Sending assessment data to backend for OpenRouter analysis...');

  const response = await fetch(`${API_URL}/analyze-assessment`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`
    },
    body: JSON.stringify({ assessmentData })
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.error || `Server error: ${response.status}`);
  }

  const result = await response.json();

  if (!result.success || !result.data) {
    throw new Error('Invalid response from server');
  }

  console.log('✅ Assessment analysis successful via OpenRouter backend');
  return result.data;
};

/**
 * Validate that all required fields are present in the response
 * @param {Object} results - Parsed results from AI
 * @returns {Object} - { isValid: boolean, missingFields: string[] }
 */
const validateResults = (results) => {
  const missingFields = [];

  // Check RIASEC
  if (!results.riasec?.topThree?.length) missingFields.push('riasec.topThree');

  // Check Aptitude
  if (!results.aptitude?.scores) missingFields.push('aptitude.scores');
  if (!results.aptitude?.topStrengths?.length) missingFields.push('aptitude.topStrengths');

  // Check Big Five
  if (!results.bigFive || typeof results.bigFive.O === 'undefined') missingFields.push('bigFive');

  // Check Work Values
  if (!results.workValues?.topThree?.length) missingFields.push('workValues.topThree');

  // Check Employability
  if (!results.employability?.strengthAreas?.length) missingFields.push('employability');

  // Check Knowledge
  if (!results.knowledge || typeof results.knowledge.score === 'undefined') missingFields.push('knowledge');

  // Check Career Fit
  if (!results.careerFit?.clusters?.length) missingFields.push('careerFit.clusters');

  // Check Skill Gap
  if (!results.skillGap?.priorityA?.length) missingFields.push('skillGap');

  // Check Roadmap
  if (!results.roadmap?.projects?.length) missingFields.push('roadmap');

  // Check Final Note
  if (!results.finalNote?.advantage) missingFields.push('finalNote');

  // Check Profile Snapshot
  if (!results.profileSnapshot?.aptitudeStrengths?.length) missingFields.push('profileSnapshot.aptitudeStrengths');

  // Check Overall Summary
  if (!results.overallSummary) missingFields.push('overallSummary');

  // Check Timing Analysis (optional but log if missing)
  if (!results.timingAnalysis?.overallPace) {
    console.log('Note: timingAnalysis not included in response');
  }

  return {
    isValid: missingFields.length === 0,
    missingFields
  };
};

/**
 * Add course recommendations to assessment results.
 * Fetches platform courses that match the student's profile using RAG-based recommendations.
 * Separates courses by skill type (technical vs soft) to ensure both are represented.
 * Falls back to keyword matching if embedding-based search fails.
 * 
 * @param {Object} assessmentResults - Parsed results from OpenRouter AI
 * @returns {Promise<Object>} - Assessment results with platformCourses, coursesByType, and skillGapCourses added
 * 
 * Feature: rag-course-recommendations
 * Requirements: 4.1, 5.2, 6.3
 */
const addCourseRecommendations = async (assessmentResults) => {
  try {
    console.log('=== Adding Course Recommendations ===');

    // Get recommended platform courses separated by skill type (Requirement 4.1)
    // This ensures both technical and soft skills courses are fetched independently
    let coursesByType = { technical: [], soft: [] };
    let platformCourses = [];

    try {
      // Fetch courses by type - this ensures we get both technical and soft skills
      coursesByType = await getRecommendedCoursesByType(assessmentResults, 5);
      console.log(`Found ${coursesByType.technical.length} technical and ${coursesByType.soft.length} soft skill courses`);

      // Also get combined recommendations for backward compatibility
      platformCourses = [...coursesByType.technical, ...coursesByType.soft];

      // If by-type fetch returned nothing, fall back to combined fetch
      if (platformCourses.length === 0) {
        platformCourses = await getRecommendedCourses(assessmentResults);
        console.log(`Fallback: Found ${platformCourses.length} platform course recommendations`);
      }
    } catch (error) {
      console.warn('Failed to get platform course recommendations:', error.message);
      // Try fallback to combined fetch
      try {
        platformCourses = await getRecommendedCourses(assessmentResults);
      } catch (fallbackError) {
        console.warn('Fallback also failed:', fallbackError.message);
      }
    }

    // Get courses mapped to each priority skill gap (Requirement 5.2)
    let skillGapCourses = {};
    try {
      const skillGaps = assessmentResults.skillGap?.priorityA || [];
      if (skillGaps.length > 0) {
        skillGapCourses = await getCoursesForMultipleSkillGaps(skillGaps);
        console.log(`Mapped courses to ${Object.keys(skillGapCourses).length} skill gaps`);
      }
    } catch (error) {
      console.warn('Failed to get skill gap course mappings:', error.message);
      // Continue with empty object
    }

    // Return results with course recommendations added
    return {
      ...assessmentResults,
      platformCourses,
      coursesByType,  // New field with courses separated by type
      skillGapCourses
    };
  } catch (error) {
    // If anything fails, return original results without course recommendations (Requirement 6.3)
    console.error('Error adding course recommendations:', error);
    return {
      ...assessmentResults,
      platformCourses: [],
      coursesByType: { technical: [], soft: [] },
      skillGapCourses: {}
    };
  }
};

/**
 * Analyze assessment results using OpenRouter AI via Cloudflare Worker
 * @param {Object} answers - All answers from the assessment
 * @param {string} stream - Student's selected stream (cs, bca, bba, dm, animation)
 * @param {Object} questionBanks - All question banks for reference
 * @param {Object} sectionTimings - Time spent on each section in seconds
 * @param {string} gradeLevel - Grade level: 'middle', 'highschool', or 'after12'
 * @returns {Promise<Object>} - AI-analyzed results
 */
export const analyzeAssessmentWithOpenRouter = async (answers, stream, questionBanks, sectionTimings = {}, gradeLevel = 'after12') => {
  console.log('🤖 Using OpenRouter API via Cloudflare Worker for assessment analysis...');
  
  try {
    // Prepare the assessment data
    const assessmentData = prepareAssessmentData(answers, stream, questionBanks, sectionTimings, gradeLevel);

    // Call OpenRouter via backend
    const parsedResults = await callOpenRouterAssessment(assessmentData);

    // Validate the results
    const { isValid, missingFields } = validateResults(parsedResults);
    if (!isValid) {
      console.warn('OpenRouter response has missing fields:', missingFields);
    }

    // Add course recommendations
    const resultsWithCourses = await addCourseRecommendations(parsedResults);
    return resultsWithCourses;
  } catch (error) {
    console.error('❌ Assessment analysis failed:', error.message);
    throw new Error(`Assessment analysis failed: ${error.message}. Please try again.`);
  }
};

// Legacy alias for backward compatibility
export const analyzeAssessmentWithGemini = analyzeAssessmentWithOpenRouter;

/**
 * Format seconds to readable time string
 */
const formatTimeForPrompt = (seconds) => {
  if (!seconds || seconds <= 0) return 'Not recorded';
  const mins = Math.floor(seconds / 60);
  const secs = seconds % 60;
  if (mins === 0) return `${secs} seconds`;
  if (secs === 0) return `${mins} minute${mins > 1 ? 's' : ''}`;
  return `${mins} minute${mins > 1 ? 's' : ''} ${secs} second${secs > 1 ? 's' : ''}`;
};

/**
 * Prepare assessment data for analysis
 */
const prepareAssessmentData = (answers, stream, questionBanks, sectionTimings = {}, gradeLevel = 'after12') => {
  const { riasecQuestions, aptitudeQuestions, bigFiveQuestions, workValuesQuestions, employabilityQuestions, streamKnowledgeQuestions } = questionBanks;

  // Determine section ID prefixes based on grade level
  // These MUST match the section names in the database (personal_assessment_sections table)
  const getSectionPrefix = (baseSection) => {
    if (gradeLevel === 'middle') {
      // Middle school section mappings (matches database section names)
      const middleSchoolMap = {
        'riasec': 'middle_interest_explorer',
        'bigfive': 'middle_strengths_character',
        'knowledge': 'middle_learning_preferences'
      };
      return middleSchoolMap[baseSection] || baseSection;
    } else if (gradeLevel === 'highschool') {
      // High school section mappings (matches database section names)
      const highSchoolMap = {
        'riasec': 'hs_interest_explorer',
        'bigfive': 'hs_strengths_character',
        'aptitude': 'hs_aptitude_sampling',
        'knowledge': 'hs_learning_preferences'
      };
      return highSchoolMap[baseSection] || baseSection;
    }
    // College (after12) uses standard section IDs
    return baseSection;
  };

  // Extract RIASEC/Interest answers
  const riasecAnswers = {};
  const riasecPrefix = getSectionPrefix('riasec');
  Object.entries(answers).forEach(([key, value]) => {
    if (key.startsWith(`${riasecPrefix}_`)) {
      const questionId = key.replace(`${riasecPrefix}_`, '');
      const question = riasecQuestions?.find(q => q.id === questionId);
      if (question) {
        riasecAnswers[questionId] = {
          question: question.text,
          answer: value,
          categoryMapping: question.categoryMapping, // Maps selected options to RIASEC types (R,I,A,S,E,C)
          type: question.type // Question type (multiselect, singleselect, rating, text)
        };
      }
    }
  });

  // Extract Aptitude answers (Multi-Aptitude Battery)
  const aptitudeAnswers = {
    verbal: [],
    numerical: [],
    abstract: [],
    spatial: [],
    clerical: []
  };

  if (aptitudeQuestions) {
    let debugCount = 0;
    const aptitudePrefix = getSectionPrefix('aptitude');
    Object.entries(answers).forEach(([key, value]) => {
      if (key.startsWith(`${aptitudePrefix}_`)) {
        const questionId = key.replace(`${aptitudePrefix}_`, '');
        const question = aptitudeQuestions.find(q => q.id === questionId);
        if (question) {
          // For high school/middle school: rating-based questions (no correct answers)
          // For after12: MCQ questions with correct answers
          const isRatingQuestion = question.type === 'rating' || !question.correct;

          let answerData;
          if (isRatingQuestion) {
            // High school/middle school: extract rating value and task type
            answerData = {
              questionId,
              question: question.text,
              rating: value, // 1-4 scale for ease/enjoyment
              taskType: question.taskType || question.task_type, // verbal, numerical, abstract
              type: question.type
            };
            // Group by task_type for high school aptitude
            const taskCategory = (question.taskType || question.task_type || 'verbal').toLowerCase();
            if (aptitudeAnswers[taskCategory]) {
              aptitudeAnswers[taskCategory].push(answerData);
            }
          } else {
            // After12: MCQ with correct/incorrect answers
            const isCorrect = value === question.correct;

            // Debug first 3 comparisons to see the issue
            if (debugCount < 3) {
              console.log(`[APTITUDE DEBUG ${debugCount + 1}]`, {
                questionId,
                studentAnswer: value,
                correctAnswer: question.correct,
                isCorrect,
                subtype: question.subtype
              });
              debugCount++;
            }

            answerData = {
              questionId,
              question: question.text,
              studentAnswer: value,
              correctAnswer: question.correct,
              isCorrect,
              subtype: question.subtype
            };
            if (aptitudeAnswers[question.subtype]) {
              aptitudeAnswers[question.subtype].push(answerData);
            }
          }
        }
      }
    });
  }

  // Extract Big Five/Strengths & Character answers
  const bigFiveAnswers = {};
  const bigFivePrefix = getSectionPrefix('bigfive');
  Object.entries(answers).forEach(([key, value]) => {
    if (key.startsWith(`${bigFivePrefix}_`)) {
      const questionId = key.replace(`${bigFivePrefix}_`, '');
      const question = bigFiveQuestions?.find(q => q.id === questionId);
      if (question) {
        bigFiveAnswers[questionId] = { question: question.text, answer: value };
      }
    }
  });

  // Extract Work Values answers
  const workValuesAnswers = {};
  Object.entries(answers).forEach(([key, value]) => {
    if (key.startsWith('values_')) {
      const questionId = key.replace('values_', '');
      const question = workValuesQuestions.find(q => q.id === questionId);
      if (question) {
        workValuesAnswers[questionId] = { question: question.text, answer: value };
      }
    }
  });

  // Extract Employability answers (Part A: Self-rating + Part B: SJT)
  const employabilityAnswers = {
    selfRating: {
      Communication: [],
      Teamwork: [],
      ProblemSolving: [],
      Adaptability: [],
      Leadership: [],
      DigitalFluency: [],
      Professionalism: [],
      CareerReadiness: []
    },
    sjt: []
  };

  Object.entries(answers).forEach(([key, value]) => {
    if (key.startsWith('employability_')) {
      const questionId = key.replace('employability_', '');
      const question = employabilityQuestions.find(q => q.id === questionId);
      if (question) {
        if (question.partType === 'selfRating') {
          // Part A: Self-rating (1-5 scale)
          const domain = question.type;
          if (employabilityAnswers.selfRating[domain]) {
            employabilityAnswers.selfRating[domain].push({
              question: question.text,
              answer: value,
              domain: question.moduleTitle
            });
          }
        } else if (question.partType === 'sjt') {
          // Part B: SJT scenarios - value is { best: string, worst: string }
          const studentBest = value?.best || value;
          const studentWorst = value?.worst || null;

          // Calculate SJT score: Best=2, Worst=0, others=1
          let score = 1; // default for other answers
          if (studentBest === question.bestAnswer) score = 2;
          if (studentBest === question.worstAnswer) score = 0;

          employabilityAnswers.sjt.push({
            scenario: question.scenario || question.text,
            question: question.text,
            studentBestChoice: studentBest,
            studentWorstChoice: studentWorst,
            correctBest: question.bestAnswer,
            correctWorst: question.worstAnswer,
            bestCorrect: studentBest === question.bestAnswer,
            worstCorrect: studentWorst === question.worstAnswer,
            score: score
          });
        }
      }
    }
  });

  // Extract Knowledge/Career Discovery/Career Pathways answers
  const knowledgeAnswers = {};
  const streamQuestions = streamKnowledgeQuestions?.[stream] || [];
  const knowledgePrefix = getSectionPrefix('knowledge');
  Object.entries(answers).forEach(([key, value]) => {
    if (key.startsWith(`${knowledgePrefix}_`)) {
      const questionId = key.replace(`${knowledgePrefix}_`, '');
      const question = streamQuestions.find(q => q.id === questionId);
      if (question) {
        knowledgeAnswers[questionId] = {
          question: question.text,
          studentAnswer: value,
          correctAnswer: question.correct,
          isCorrect: value === question.correct,
          options: question.options
        };
      }
    }
  });

  // Calculate aptitude scores
  // For rating-based questions (high school): calculate average rating
  // For MCQ questions (after12): calculate correct/total
  const calculateAptitudeScore = (answers) => {
    if (answers.length === 0) return { correct: 0, total: 0 };

    // Check if these are rating questions
    if (answers[0]?.rating !== undefined) {
      // High school: average rating (1-4 scale)
      const avgRating = answers.reduce((sum, a) => sum + (a.rating || 0), 0) / answers.length;
      const percentage = (avgRating / 4) * 100; // Convert to percentage
      return {
        averageRating: avgRating,
        total: answers.length,
        percentage: Math.round(percentage)
      };
    } else {
      // After12: correct/total (unchanged logic)
      return {
        correct: answers.filter(a => a.isCorrect).length,
        total: answers.length
      };
    }
  };

  const aptitudeScores = {
    verbal: calculateAptitudeScore(aptitudeAnswers.verbal),
    numerical: calculateAptitudeScore(aptitudeAnswers.numerical),
    abstract: calculateAptitudeScore(aptitudeAnswers.abstract),
    spatial: calculateAptitudeScore(aptitudeAnswers.spatial),
    clerical: calculateAptitudeScore(aptitudeAnswers.clerical)
  };

  // DEBUG: Log assessment data
  console.log('=== ASSESSMENT DEBUG ===');
  console.log('Grade Level:', gradeLevel);
  console.log('Total answers keys:', Object.keys(answers).length);
  console.log('First 5 answer keys:');
  Object.keys(answers).slice(0, 5).forEach(key => console.log('  -', key));
  console.log('Expected RIASEC prefix:', riasecPrefix);
  console.log('Expected Aptitude prefix:', getSectionPrefix('aptitude'));
  console.log('RIASEC answers extracted:', Object.keys(riasecAnswers).length);
  console.log('RIASEC answer keys:', Object.keys(riasecAnswers));
  console.log('Aptitude answers extracted:', {
    verbal: aptitudeAnswers.verbal.length,
    numerical: aptitudeAnswers.numerical.length,
    abstract: aptitudeAnswers.abstract.length,
    spatial: aptitudeAnswers.spatial.length,
    clerical: aptitudeAnswers.clerical.length
  });
  console.log('Aptitude scores calculated:', aptitudeScores);
  console.log('========================');

  const totalAptitudeQuestions = aptitudeQuestions?.length || 50;

  // Calculate timing metrics
  const timingData = {
    riasec: {
      seconds: sectionTimings.riasec || 0,
      formatted: formatTimeForPrompt(sectionTimings.riasec),
      questionsCount: riasecQuestions.length,
      avgSecondsPerQuestion: sectionTimings.riasec ? Math.round(sectionTimings.riasec / riasecQuestions.length) : 0
    },
    aptitude: {
      seconds: sectionTimings.aptitude || 0,
      formatted: formatTimeForPrompt(sectionTimings.aptitude),
      questionsCount: totalAptitudeQuestions,
      avgSecondsPerQuestion: sectionTimings.aptitude ? Math.round(sectionTimings.aptitude / totalAptitudeQuestions) : 0,
      timeLimit: 45 * 60, // 45 minutes total (30 questions × 1 min each + 20 questions × 15 min shared)
      individualTimeLimit: 60, // 1 minute per question for first 30
      sharedTimeLimit: 15 * 60, // 15 minutes for last 20 questions
      individualQuestionCount: 30,
      sharedQuestionCount: 20
    },
    bigfive: {
      seconds: sectionTimings.bigfive || 0,
      formatted: formatTimeForPrompt(sectionTimings.bigfive),
      questionsCount: bigFiveQuestions.length,
      avgSecondsPerQuestion: sectionTimings.bigfive ? Math.round(sectionTimings.bigfive / bigFiveQuestions.length) : 0
    },
    values: {
      seconds: sectionTimings.values || 0,
      formatted: formatTimeForPrompt(sectionTimings.values),
      questionsCount: workValuesQuestions.length,
      avgSecondsPerQuestion: sectionTimings.values ? Math.round(sectionTimings.values / workValuesQuestions.length) : 0
    },
    employability: {
      seconds: sectionTimings.employability || 0,
      formatted: formatTimeForPrompt(sectionTimings.employability),
      questionsCount: employabilityQuestions.length,
      avgSecondsPerQuestion: sectionTimings.employability ? Math.round(sectionTimings.employability / employabilityQuestions.length) : 0
    },
    knowledge: {
      seconds: sectionTimings.knowledge || 0,
      formatted: formatTimeForPrompt(sectionTimings.knowledge),
      questionsCount: streamQuestions.length,
      avgSecondsPerQuestion: sectionTimings.knowledge && streamQuestions.length ? Math.round(sectionTimings.knowledge / streamQuestions.length) : 0,
      timeLimit: 30 * 60 // 30 minutes
    },
    totalTime: Object.values(sectionTimings).reduce((sum, t) => sum + (t || 0), 0)
  };
  timingData.totalFormatted = formatTimeForPrompt(timingData.totalTime);

  return {
    stream,
    riasecAnswers,
    aptitudeAnswers,
    aptitudeScores,
    bigFiveAnswers,
    workValuesAnswers,
    employabilityAnswers,
    knowledgeAnswers,
    totalKnowledgeQuestions: streamQuestions.length,
    totalAptitudeQuestions,
    sectionTimings: timingData
  };
};

/**
 * Build simplified prompt for middle school (grades 6-8)
 */
const buildMiddleSchoolPrompt = (assessmentData, answersHash) => {
  return `You are a career counselor for middle school students (grades 6-8). Analyze this student's interest exploration assessment using the EXACT scoring rules below.

## CRITICAL: This must be DETERMINISTIC - same input = same output always
Session ID: ${answersHash}

## Interest Explorer Responses:
${JSON.stringify(assessmentData.riasecAnswers, null, 2)}

**CRITICAL RIASEC SCORING INSTRUCTIONS:**
Each question includes a "categoryMapping" field that maps answer options to RIASEC types (R, I, A, S, E, C).
You MUST use this mapping to calculate scores precisely:

**RIASEC Type Meanings:**
- **R (Realistic)**: Building, fixing, tools, outdoor work, sports, hands-on activities
- **I (Investigative)**: Science, research, puzzles, experiments, figuring things out, learning
- **A (Artistic)**: Art, music, writing, performing, creating, designing, expressing ideas
- **S (Social)**: Helping people, teaching, working with groups, caring, making friends
- **E (Enterprising)**: Leading, organizing, persuading, selling, being in charge, starting projects
- **C (Conventional)**: Organizing, following rules, keeping things neat, detailed work, lists

**EXACT SCORING ALGORITHM:**
1. For each question with categoryMapping:
   - If answer is an array (multiselect): For each selected option, look up its RIASEC type in categoryMapping and add 2 points to that type
   - If answer is a single string (singleselect): Look up the RIASEC type in categoryMapping and add 2 points to that type
   - If answer is a number 1-4 (rating): Use strengthType or context to determine RIASEC type, then:
     * Response 1 or 2: 0 points
     * Response 3: 1 point
     * Response 4: 2 points
2. Sum all points for each RIASEC type (R, I, A, S, E, C)
3. Calculate maxScore = 20 (or highest score among all types if higher)
4. Calculate percentage for each type: (score / maxScore) × 100
5. Identify top 3 types by score

## Strengths & Character Responses (1-4 scale):
${JSON.stringify(assessmentData.bigFiveAnswers, null, 2)}

**SCORING**: Map responses to Big Five traits (O, C, E, A, N) and calculate averages on 1-5 scale

## Career Discovery Responses:
${JSON.stringify(assessmentData.knowledgeAnswers, null, 2)}

**IMPORTANT**: Return ONLY a JSON object (no markdown). Use this EXACT structure and POPULATE all fields:

{
  "riasec": {
    "topThree": ["R", "I", "A"],
    "scores": { "R": 12, "I": 10, "A": 8, "S": 5, "E": 4, "C": 3 },
    "percentages": { "R": 60, "I": 50, "A": 40, "S": 25, "E": 20, "C": 15 },
    "maxScore": 20,
    "interpretation": "Brief, encouraging explanation of what their interests mean for future careers"
  },
  "aptitude": {
    "scores": {},
    "topStrengths": ["2-3 character strengths like Curiosity, Creativity, Persistence, Problem-solving"],
    "overallScore": 0,
    "cognitiveProfile": "Age-appropriate description of how they think and learn best"
  },
  "bigFive": {
    "O": 3.5, "C": 3.2, "E": 3.8, "A": 4.0, "N": 2.5,
    "workStyleSummary": "How they work and learn best based on their personality traits"
  },
  "workValues": {
    "topThree": [
      {"value": "Helping Others / Creativity / Learning / Achievement / Independence", "score": 4.0},
      {"value": "Second most important value", "score": 3.5},
      {"value": "Third value", "score": 3.0}
    ]
  },
  "employability": {
    "strengthAreas": ["2-3 soft skills they're already showing (e.g., Teamwork, Communication, Curiosity)"],
    "improvementAreas": ["1-2 areas to grow (phrase positively and encouragingly)"]
  },
  "knowledge": { "score": 70, "correctCount": 7, "totalQuestions": 10 },
  "careerFit": {
    "clusters": [
      {
        "title": "Broad career area #1 (e.g., Creative Arts & Design, Science & Technology, Helping People)",
        "matchScore": 85,
        "fit": "High",
        "description": "2-3 sentences explaining WHY this career area matches their interests and strengths. Make it personal and specific to their assessment results.",
        "examples": ["4-5 specific jobs in this area they can understand (e.g., Video Game Designer, App Developer)"],
        "whatYoullDo": "Brief description of typical activities in this career area",
        "whyItFits": "Connects to their top interests and character strengths",
        "roles": {
          "entry": ["3-4 jobs they could do right after school or training (e.g., Camp Counselor, Junior Designer)"],
          "mid": ["3-4 jobs they could work towards (e.g., Art Teacher, Game Developer, Graphic Designer)"]
        },
        "domains": ["Related areas like Design, Technology, Education, Entertainment"]
      },
      {
        "title": "Broad career area #2",
        "matchScore": 75,
        "fit": "Medium",
        "description": "Specific explanation of how their assessment connects to this career path",
        "examples": ["3-4 specific jobs"],
        "whatYoullDo": "What work in this area looks like",
        "whyItFits": "How their strengths apply here",
        "roles": {
          "entry": ["2-3 entry-level jobs"],
          "mid": ["2-3 career-level jobs"]
        },
        "domains": ["Related fields and industries"]
      },
      {
        "title": "Broad career area #3",
        "matchScore": 65,
        "fit": "Explore",
        "description": "Why this could be interesting to explore based on their results",
        "examples": ["3-4 jobs to consider"],
        "whatYoullDo": "Overview of work in this area",
        "whyItFits": "Potential connections to their interests",
        "roles": {
          "entry": ["2-3 starter jobs"],
          "mid": ["2-3 growth opportunities"]
        },
        "domains": ["Related career areas"]
      }
    ],
    "specificOptions": {
      "highFit": ["4-5 specific, age-appropriate career names they can relate to"],
      "mediumFit": ["3-4 more career options worth exploring"],
      "exploreLater": ["2-3 careers to keep in mind for later"]
    }
  },
  "skillGap": {
    "priorityA": [
      {"skill": "Key foundational skill #1", "reason": "2-3 sentences explaining WHY this skill matters for their career interests and how it will help them succeed", "targetLevel": "Beginner", "currentLevel": "Starting"},
      {"skill": "Key foundational skill #2", "reason": "Specific explanation of how developing this skill supports their goals and opens opportunities", "targetLevel": "Beginner", "currentLevel": "Starting"}
    ],
    "priorityB": [
      {"skill": "Additional skill to explore", "reason": "Clear explanation of why this skill is valuable for their career path", "targetLevel": "Beginner"}
    ],
    "currentStrengths": ["2-3 skills they're already showing"],
    "recommendedTrack": "Clear learning path (e.g., Creative Exploration, STEM Discovery, People & Communication)"
  },
  "roadmap": {
    "twelveMonthJourney": {
      "phase1": {
        "months": "Months 1-3",
        "title": "Discover & Explore",
        "goals": ["Learn about careers", "Try new activities", "Discover what you enjoy"],
        "activities": ["2-3 specific things to do"],
        "outcome": "What they'll achieve"
      },
      "phase2": {
        "months": "Months 4-6",
        "title": "Learn & Practice",
        "goals": ["Build basic skills", "Join clubs or groups", "Start small projects"],
        "activities": ["2-3 specific activities"],
        "outcome": "Skills they'll gain"
      },
      "phase3": {
        "months": "Months 7-9",
        "title": "Create & Share",
        "goals": ["Make something", "Share with others", "Get feedback"],
        "activities": ["2-3 hands-on projects"],
        "outcome": "What they'll create"
      },
      "phase4": {
        "months": "Months 10-12",
        "title": "Grow & Reflect",
        "goals": ["Review progress", "Set new goals", "Plan next steps"],
        "activities": ["2-3 reflection activities"],
        "outcome": "Path forward"
      }
    },
    "projects": [
      {
        "title": "Beginner-friendly project #1",
        "description": "What they'll do (2-3 sentences, make it exciting and doable)",
        "skills": ["Skills they'll learn"],
        "timeline": "2-3 months",
        "difficulty": "Beginner",
        "purpose": "Why this project matters",
        "output": "What they'll have when done",
        "steps": ["Step 1: Start here", "Step 2: Then do this", "Step 3: Finish with this"]
      },
      {
        "title": "Project #2",
        "description": "Another age-appropriate activity",
        "skills": ["Skills to build"],
        "timeline": "2-3 months",
        "difficulty": "Beginner",
        "purpose": "Learning goal",
        "output": "Final product",
        "steps": ["3-4 simple steps"]
      },
      {
        "title": "Project #3",
        "description": "Third exploration project",
        "skills": ["More skills"],
        "timeline": "3-4 months",
        "difficulty": "Beginner",
        "purpose": "Why it's valuable",
        "output": "What they'll create",
        "steps": ["Clear action steps"]
      }
    ],
    "internship": {
      "types": ["Job shadowing opportunities", "School clubs to join", "Volunteer activities", "Summer camps"],
      "timing": "When to pursue these (school year, summer, etc.)",
      "preparation": {
        "resume": "Not needed yet - focus on exploring",
        "portfolio": "Keep notes about what you try and learn",
        "interview": "Practice talking about what interests you"
      }
    },
    "exposure": {
      "activities": ["Specific clubs, field trips, events to attend"],
      "certifications": ["Age-appropriate certificates to earn (e.g., Online badges, Typing certification, Basic computer skills)"],
      "resources": ["Books to read", "Websites to explore", "Videos to watch"]
    }
  },
  "finalNote": {
    "advantage": "Their standout strength or characteristic based on the assessment",
    "growthFocus": "One clear, encouraging next step"
  },
  "profileSnapshot": {
    "keyPatterns": {
      "enjoyment": "What they enjoy based on interest responses (RIASEC top types)",
      "strength": "Their character strengths from the assessment",
      "workStyle": "How they work and learn best (from personality traits)",
      "motivation": "What motivates them (from work values)"
    },
    "aptitudeStrengths": [
      {"name": "Character strength #1 (e.g., Curiosity, Creativity, Perseverance)", "description": "How this shows up in their responses"},
      {"name": "Character strength #2", "description": "Evidence from assessment"}
    ],
    "interestHighlights": ["Top 2-3 interest areas from RIASEC"],
    "personalityInsights": ["2-3 key personality traits that impact career fit"]
  },
  "overallSummary": "3-4 sentences: Affirm their interests, celebrate their strengths, paint an exciting picture of possible futures, encourage continued exploration"
}`;
};

/**
 * Build intermediate prompt for high school (grades 9-12)
 */
const buildHighSchoolPrompt = (assessmentData, answersHash) => {
  return `You are a career counselor for high school students (grades 9-12). Analyze this student's career exploration assessment and provide guidance appropriate for their age and academic level.

## CRITICAL: This must be DETERMINISTIC - same input = same output always
Session ID: ${answersHash}

## Interest Explorer Responses:
${JSON.stringify(assessmentData.riasecAnswers, null, 2)}

**CRITICAL RIASEC SCORING INSTRUCTIONS:**
Each question includes a "categoryMapping" field that maps answer options to RIASEC types (R, I, A, S, E, C).
You MUST use this mapping to calculate scores precisely:

**RIASEC Type Meanings:**
- **R (Realistic)**: Building, fixing, tools, outdoor work, sports, hands-on activities
- **I (Investigative)**: Science, research, puzzles, experiments, figuring things out, learning
- **A (Artistic)**: Art, music, writing, performing, creating, designing, expressing ideas
- **S (Social)**: Helping people, teaching, working with groups, caring, making friends
- **E (Enterprising)**: Leading, organizing, persuading, selling, being in charge, starting projects
- **C (Conventional)**: Organizing, following rules, keeping things neat, detailed work, lists

**EXACT SCORING ALGORITHM:**
1. For each question with categoryMapping:
   - If answer is an array (multiselect): For each selected option, look up its RIASEC type in categoryMapping and add 2 points to that type
   - If answer is a single string (singleselect): Look up the RIASEC type in categoryMapping and add 2 points to that type
   - If answer is a number 1-5 (rating): Use strengthType or context to determine RIASEC type, then:
     * Response 1-3: 0 points
     * Response 4: 1 point
     * Response 5: 2 points
2. Sum all points for each RIASEC type (R, I, A, S, E, C)
3. Calculate maxScore = 20 (or highest score among all types if higher)
4. Calculate percentage for each type: (score / maxScore) × 100
5. Identify top 3 types by score

## Strengths & Character Responses:
${JSON.stringify(assessmentData.bigFiveAnswers, null, 2)}

## Aptitude Sampling (Rating-Based Self-Assessment):
${JSON.stringify(assessmentData.aptitudeAnswers, null, 2)}
Pre-calculated scores: ${JSON.stringify(assessmentData.aptitudeScores, null, 2)}

**APTITUDE SCORING FOR HIGH SCHOOL:**
High school aptitude is based on self-assessment ratings (1-4 scale) for ease and enjoyment of tasks:
- Each task type (verbal, numerical, abstract) has multiple rating questions
- Scores show averageRating (1-4 scale) and percentage (0-100%)
- Higher ratings indicate stronger aptitude in that area
- Use these ratings to identify top cognitive strengths for the aptitudeStrengths field
- For the "scores" field in the response, convert ratings to a percentage format

## Career Pathways Responses:
${JSON.stringify(assessmentData.knowledgeAnswers, null, 2)}

**IMPORTANT**: Return ONLY a JSON object (no markdown). Use this structure and POPULATE all fields with specific, actionable content for high school students:

{
  "riasec": {
    "topThree": ["Top 3 RIASEC codes"],
    "scores": { "R": 0, "I": 0, "A": 0, "S": 0, "E": 0, "C": 0 },
    "percentages": { "R": 0, "I": 0, "A": 0, "S": 0, "E": 0, "C": 0 },
    "maxScore": 20,
    "interpretation": "2-3 sentences about what their interests mean for college majors and career paths"
  },
  "aptitude": {
    "scores": {
      "Verbal": {"averageRating": 0, "total": 0, "percentage": 0},
      "Numerical": {"averageRating": 0, "total": 0, "percentage": 0},
      "Abstract": {"averageRating": 0, "total": 0, "percentage": 0}
    },
    "topStrengths": ["2-3 cognitive strengths based on highest ratings (e.g., 'Strong analytical reasoning shown by high numerical task ratings')"],
    "overallScore": 0,
    "cognitiveProfile": "How they think, learn, and solve problems based on their self-assessed task preferences"
  },
  "bigFive": {
    "O": 3.5, "C": 3.2, "E": 3.8, "A": 4.0, "N": 2.5,
    "workStyleSummary": "Their work style, team dynamics, and how to leverage their personality in school and future careers"
  },
  "workValues": {
    "topThree": [
      {"value": "Top motivator (Achievement, Helping, Innovation, Security, etc.)", "score": 4.0},
      {"value": "Second value", "score": 3.5},
      {"value": "Third value", "score": 3.0}
    ]
  },
  "employability": {
    "strengthAreas": ["Soft skills they're demonstrating (e.g., Leadership, Communication, Critical Thinking)"],
    "improvementAreas": ["Skills to develop - phrase constructively"],
    "overallReadiness": "Their current career readiness level with specific context"
  },
  "knowledge": { "score": 70, "correctCount": 7, "totalQuestions": 10 },
  "careerFit": {
    "clusters": [
      {
        "title": "Career cluster #1 (e.g., Healthcare & Medicine, Technology & Engineering, Business & Entrepreneurship)",
        "matchScore": 85,
        "fit": "High",
        "description": "3-4 sentences explaining WHY this fits based on their assessment. Be specific about how their interests, aptitudes, and personality align with this career path.",
        "examples": ["5-6 specific careers with brief role descriptions"],
        "educationPath": "Specific college majors and degree programs (e.g., 'Consider majors like Computer Science, Information Systems, or Software Engineering')",
        "whatYoullDo": "Day-to-day activities and responsibilities in this field",
        "whyItFits": "Detailed connection between their assessment results and this career area",
        "evidence": {
          "interest": "How their RIASEC scores support this path",
          "aptitude": "Which cognitive strengths make them a good fit",
          "personality": "Personality traits that align with success in this field"
        },
        "roles": {
          "entry": ["4-5 entry-level jobs (e.g., Junior Developer, Lab Assistant, Marketing Intern)"],
          "mid": ["4-5 mid-career jobs (e.g., Senior Engineer, Research Scientist, Marketing Manager)"]
        },
        "domains": ["Related fields (e.g., Software, Hardware, AI, Cybersecurity)"]
      },
      {
        "title": "Career cluster #2",
        "matchScore": 75,
        "fit": "Medium",
        "description": "Specific explanation connecting their profile to this career area",
        "examples": ["4-5 career options"],
        "educationPath": "Relevant majors and programs",
        "whatYoullDo": "Overview of work in this field",
        "whyItFits": "How their strengths translate here",
        "evidence": {
          "interest": "Interest alignment",
          "aptitude": "Relevant cognitive skills",
          "personality": "Personality fit"
        },
        "roles": {
          "entry": ["3-4 entry-level positions"],
          "mid": ["3-4 mid-level careers"]
        },
        "domains": ["Related industries and specializations"]
      },
      {
        "title": "Career cluster #3",
        "matchScore": 65,
        "fit": "Explore",
        "description": "Why this is worth exploring despite lower match score",
        "examples": ["3-4 careers to consider"],
        "educationPath": "Potential degree paths",
        "whatYoullDo": "What professionals in this area do",
        "whyItFits": "Potential growth areas that could make this a fit",
        "evidence": {
          "interest": "Interest connections",
          "aptitude": "Transferable skills",
          "personality": "Personality considerations"
        },
        "roles": {
          "entry": ["2-3 starting positions"],
          "mid": ["2-3 advanced roles"]
        },
        "domains": ["Related career paths"]
      }
    ],
    "specificOptions": {
      "highFit": ["5-6 specific career titles ranked by fit"],
      "mediumFit": ["4-5 careers worth considering"],
      "exploreLater": ["2-3 careers to keep on the radar"]
    }
  },
  "skillGap": {
    "priorityA": [
      {"skill": "Critical skill #1", "reason": "2-3 sentences explaining WHY this skill is essential for their target careers, how it will differentiate them in college applications or internships, and what opportunities it unlocks", "targetLevel": "Intermediate", "currentLevel": "Beginner", "howToBuild": "Specific action steps"},
      {"skill": "Critical skill #2", "reason": "Detailed explanation of how this skill impacts their career readiness, why employers/colleges value it, and how it supports their career path", "targetLevel": "Intermediate", "currentLevel": "Beginner", "howToBuild": "Concrete ways to develop this"}
    ],
    "priorityB": [
      {"skill": "Important skill", "reason": "Clear explanation of why this skill matters for their career goals and how it complements their strengths", "targetLevel": "Intermediate", "currentLevel": "Beginner"}
    ],
    "currentStrengths": ["3-4 skills they already demonstrate"],
    "recommendedTrack": "Clear development path with rationale (e.g., 'STEM Excellence Track - Build technical and analytical skills for engineering/science careers')"
  },
  "roadmap": {
    "twelveMonthJourney": {
      "phase1": {
        "months": "Months 1-3",
        "title": "Foundation Building",
        "goals": ["Master core skills", "Identify specific career interests", "Build initial portfolio"],
        "activities": ["Specific classes or online courses to take", "Projects to start", "Competitions to enter"],
        "outcome": "Clear career direction and foundational skills"
      },
      "phase2": {
        "months": "Months 4-6",
        "title": "Skill Development",
        "goals": ["Earn certifications", "Build portfolio projects", "Network with professionals"],
        "activities": ["Specific certifications to pursue", "Portfolio work to complete", "Mentors to connect with"],
        "outcome": "Demonstrable skills and professional network"
      },
      "phase3": {
        "months": "Months 7-9",
        "title": "Experience & Application",
        "goals": ["Secure internship/shadowing", "Lead school projects", "Apply skills in real contexts"],
        "activities": ["Internship applications", "Leadership opportunities", "Competitions or showcases"],
        "outcome": "Real-world experience and leadership roles"
      },
      "phase4": {
        "months": "Months 10-12",
        "title": "College & Career Prep",
        "goals": ["Finalize college plans", "Perfect portfolio", "Interview preparation"],
        "activities": ["College application work", "Portfolio refinement", "Mock interviews"],
        "outcome": "College-ready with strong applications"
      }
    },
    "projects": [
      {
        "title": "Portfolio project #1",
        "description": "Detailed description of the project (3-4 sentences explaining what they'll build and why it matters)",
        "skills": ["Specific technical and soft skills they'll develop"],
        "timeline": "3-4 months",
        "difficulty": "Intermediate",
        "purpose": "How this project demonstrates career readiness",
        "output": "What they'll have to show (e.g., 'A functional mobile app published on app stores')",
        "steps": ["Step 1: Research and planning", "Step 2: Development/creation", "Step 3: Testing and refinement", "Step 4: Presentation and portfolio addition"],
        "resources": ["Specific tools, platforms, or courses needed"]
      },
      {
        "title": "Project #2",
        "description": "Another substantive portfolio project",
        "skills": ["Skills to master"],
        "timeline": "3-4 months",
        "difficulty": "Intermediate",
        "purpose": "Career relevance",
        "output": "Deliverable",
        "steps": ["4-5 actionable steps"],
        "resources": ["Tools and learning resources"]
      },
      {
        "title": "Project #3",
        "description": "Advanced or capstone project",
        "skills": ["Advanced skills"],
        "timeline": "4-6 months",
        "difficulty": "Intermediate-Advanced",
        "purpose": "Why it's impressive for college/internships",
        "output": "Portfolio piece",
        "steps": ["Detailed action plan"],
        "resources": ["Required resources"]
      }
    ],
    "internship": {
      "types": ["Specific internship types matching their career interests (e.g., 'Software development internships at tech companies', 'Research assistant positions at university labs')"],
      "timing": "When and how long (e.g., 'Summer internships: June-August, 8-10 weeks')",
      "preparation": {
        "resume": "What to include (projects, skills, achievements relevant to their target field)",
        "portfolio": "What to showcase (specific projects and work samples)",
        "interview": "How to prepare (common questions, technical prep needed)"
      },
      "whereToApply": ["Specific companies, programs, or platforms to use"]
    },
    "exposure": {
      "activities": ["Specific clubs to join (e.g., 'Robotics Club, FBLA, DECA')", "Competitions to enter", "Events to attend"],
      "certifications": ["Specific certifications to earn (e.g., 'Google IT Support Certificate', 'Adobe Certified Professional', 'Python Programming Certificate')", "Why each certificate matters"],
      "onlineLearning": ["Specific courses on Coursera, edX, Khan Academy", "Skills to focus on"],
      "networking": ["How to connect with professionals in their field", "LinkedIn strategies", "Informational interview tips"]
    }
  },
  "finalNote": {
    "advantage": "Their strongest competitive advantage for college and careers",
    "growthFocus": "One key area to focus development in the next 6-12 months"
  },
  "profileSnapshot": {
    "keyPatterns": {
      "enjoyment": "What they enjoy based on RIASEC interest results",
      "strength": "Their aptitude strengths from the assessment (if aptitude section available) OR character strengths",
      "workStyle": "How they work and collaborate (from personality traits)",
      "motivation": "What drives them (from work values)"
    },
    "aptitudeStrengths": [
      {"name": "Cognitive strength #1 (e.g., Analytical Reasoning, Creative Thinking, Verbal Skills)", "description": "How this shows in assessment OR character strength if no aptitude data"},
      {"name": "Cognitive strength #2 OR Character strength #2", "description": "Evidence from results"}
    ],
    "interestHighlights": ["Top 2-3 RIASEC interest areas with descriptions"],
    "personalityInsights": ["2-3 key personality traits that shape their career fit"]
  },
  "overallSummary": "3-4 sentences: Acknowledge their readiness level, affirm their direction, highlight unique strengths, and provide clear encouragement for next steps in college prep and career exploration"
}`;
};

/**
 * Build the analysis prompt for OpenRouter AI
 */
const buildAnalysisPrompt = (assessmentData, gradeLevel = 'after12') => {
  // Create a hash of the answers for consistency tracking
  const answersHash = JSON.stringify(assessmentData).split('').reduce((a, b) => {
    a = ((a << 5) - a) + b.charCodeAt(0);
    return a & a;
  }, 0);

  // For middle school (grades 6-8), use simplified prompt
  if (gradeLevel === 'middle') {
    return buildMiddleSchoolPrompt(assessmentData, answersHash);
  }

  // For high school (grades 9-12), use intermediate prompt
  if (gradeLevel === 'highschool') {
    return buildHighSchoolPrompt(assessmentData, answersHash);
  }

  // College (after12) - full detailed analysis
  return `You are a career counselor and psychometric assessment expert. Analyze the following student assessment data and provide comprehensive results.

## CONSISTENCY REQUIREMENT - CRITICAL:
This analysis must be DETERMINISTIC and CONSISTENT. Given the same input data, you must ALWAYS produce the SAME output.
- Use ONLY the provided data to make calculations - do not introduce randomness
- Calculate scores using EXACT mathematical formulas provided below
- Career recommendations must be derived DIRECTLY from the calculated scores
- If this same data is analyzed again, the results MUST be identical
- Session ID for consistency verification: ${answersHash}

## Student Stream: ${assessmentData.stream.toUpperCase()}

## RIASEC Career Interest Responses (1-5 scale: 1=Strongly Dislike, 2=Dislike, 3=Neutral, 4=Like, 5=Strongly Like):
${JSON.stringify(assessmentData.riasecAnswers, null, 2)}

RIASEC SCORING RULES:
- Response 1 (Strongly Dislike): 0 points - DO NOT count
- Response 2 (Dislike): 0 points - DO NOT count  
- Response 3 (Neutral): 0 points
- Response 4 (Like): 1 point
- Response 5 (Strongly Like): 2 points
- Maximum score per type = 20 (10 questions × 2 points max)

## MULTI-APTITUDE BATTERY RESULTS (DAT/GATB Style):
Pre-calculated Scores:
- Verbal Reasoning: ${assessmentData.aptitudeScores?.verbal?.correct || 0}/${assessmentData.aptitudeScores?.verbal?.total || 8} correct
- Numerical Ability: ${assessmentData.aptitudeScores?.numerical?.correct || 0}/${assessmentData.aptitudeScores?.numerical?.total || 8} correct
- Abstract/Logical Reasoning: ${assessmentData.aptitudeScores?.abstract?.correct || 0}/${assessmentData.aptitudeScores?.abstract?.total || 8} correct
- Spatial/Mechanical Reasoning: ${assessmentData.aptitudeScores?.spatial?.correct || 0}/${assessmentData.aptitudeScores?.spatial?.total || 6} correct
- Clerical Speed & Accuracy: ${assessmentData.aptitudeScores?.clerical?.correct || 0}/${assessmentData.aptitudeScores?.clerical?.total || 20} correct

Detailed Aptitude Answers:
${JSON.stringify(assessmentData.aptitudeAnswers, null, 2)}

APTITUDE SCORING RULES:
- Each correct answer = 1 point
- Convert raw scores to percentages for each domain
- Identify top 2-3 cognitive strengths based on highest percentage scores
- Use aptitude profile to inform career cluster recommendations

## Big Five Personality Responses (1-5 scale: 1=Very Inaccurate, 5=Very Accurate):
${JSON.stringify(assessmentData.bigFiveAnswers, null, 2)}

## Work Values Responses (1-5 scale: 1=Not Important, 5=Extremely Important):
${JSON.stringify(assessmentData.workValuesAnswers, null, 2)}

## EMPLOYABILITY / 21st-CENTURY SKILLS DIAGNOSTIC:

### Part A: Self-Rating Skills (25 items, 1-5 scale: 1=Not like me, 5=Very much like me)
${JSON.stringify(assessmentData.employabilityAnswers?.selfRating || {}, null, 2)}

EMPLOYABILITY SCORING RULES:
- Average each domain (Communication, Teamwork, Problem Solving, Adaptability, Leadership, Digital Fluency, Professionalism, Career Readiness)
- Create a readiness heat-map based on domain averages
- Identify strength areas (avg >= 4) and improvement areas (avg <= 2.5)

### Part B: Situational Judgement Test (6 scenarios)
${JSON.stringify(assessmentData.employabilityAnswers?.sjt || [], null, 2)}

SJT SCORING RULES:
- Best answer = 2 points, Worst answer = 0 points, Other answers = 1 point
- Calculate total SJT score out of 12 (6 scenarios × 2 max points)
- Convert to percentage for overall SJT score

## Stream Knowledge Test Results:
${JSON.stringify(assessmentData.knowledgeAnswers, null, 2)}
Total Questions: ${assessmentData.totalKnowledgeQuestions}

## SECTION TIMING DATA (Time spent by student on each section):
- RIASEC (Career Interests): ${assessmentData.sectionTimings?.riasec?.formatted || 'Not recorded'} (${assessmentData.sectionTimings?.riasec?.questionsCount || 0} questions, avg ${assessmentData.sectionTimings?.riasec?.avgSecondsPerQuestion || 0}s per question)
- Multi-Aptitude Battery: ${assessmentData.sectionTimings?.aptitude?.formatted || 'Not recorded'} of 45 minutes allowed (First 30 questions: 1 min each individual timer, Last 20 questions: 15 min shared timer) (${assessmentData.sectionTimings?.aptitude?.questionsCount || 0} questions total, avg ${assessmentData.sectionTimings?.aptitude?.avgSecondsPerQuestion || 0}s per question)
- Big Five (Personality): ${assessmentData.sectionTimings?.bigfive?.formatted || 'Not recorded'} (${assessmentData.sectionTimings?.bigfive?.questionsCount || 0} questions, avg ${assessmentData.sectionTimings?.bigfive?.avgSecondsPerQuestion || 0}s per question)
- Work Values: ${assessmentData.sectionTimings?.values?.formatted || 'Not recorded'} (${assessmentData.sectionTimings?.values?.questionsCount || 0} questions, avg ${assessmentData.sectionTimings?.values?.avgSecondsPerQuestion || 0}s per question)
- Employability Skills: ${assessmentData.sectionTimings?.employability?.formatted || 'Not recorded'} (${assessmentData.sectionTimings?.employability?.questionsCount || 0} questions, avg ${assessmentData.sectionTimings?.employability?.avgSecondsPerQuestion || 0}s per question)
- Knowledge Test: ${assessmentData.sectionTimings?.knowledge?.formatted || 'Not recorded'} of 30 minutes allowed (${assessmentData.sectionTimings?.knowledge?.questionsCount || 0} questions, avg ${assessmentData.sectionTimings?.knowledge?.avgSecondsPerQuestion || 0}s per question)
- TOTAL ASSESSMENT TIME: ${assessmentData.sectionTimings?.totalFormatted || 'Not recorded'}

## TIMING ANALYSIS GUIDELINES:
- Fast responses (< 3 seconds/question) may indicate impulsive answering or high confidence
- Moderate responses (3-8 seconds/question) indicate thoughtful consideration
- Slow responses (> 10 seconds/question) may indicate careful deliberation or uncertainty
- Use timing patterns to inform your assessment of the student's decision-making style and confidence level
- Include timing insights in the personality and employability analysis where relevant

---

Analyze all responses and return ONLY a valid JSON object with this exact structure:

\`\`\`json
{
  "profileSnapshot": {
    "keyPatterns": {
      "enjoyment": "<Enjoyment pattern based on Interests>",
      "strength": "<Strength pattern based on Aptitude/Knowledge>",
      "workStyle": "<Work-style pattern based on Personality>",
      "motivation": "<Motivation pattern based on Values>"
    },
    "aptitudeStrengths": [
      {"name": "<Strength 1>", "percentile": "<Estimated Percentile>"},
      {"name": "<Strength 2>", "percentile": "<Estimated Percentile>"}
    ]
  },
  "riasec": {
    "scores": {
      "R": <TOTAL using scoring rules: 0 for responses 1-3, 1 for response 4, 2 for response 5>,
      "I": <TOTAL using scoring rules>,
      "A": <TOTAL using scoring rules>,
      "S": <TOTAL using scoring rules>,
      "E": <TOTAL using scoring rules>,
      "C": <TOTAL using scoring rules>
    },
    "maxScore": 20,
    "code": "<3-letter code formed by the 3 letters with HIGHEST scores, sorted from highest to lowest>",
    "topThree": ["<letter with HIGHEST score>", "<letter with 2nd HIGHEST score>", "<letter with 3rd HIGHEST score>"],
    "interpretation": "<2-3 sentence interpretation of their career interests>"
  },
  "aptitude": {
    "scores": {
      "verbal": { "correct": <number>, "total": 8, "percentage": <number 0-100> },
      "numerical": { "correct": <number>, "total": 8, "percentage": <number 0-100> },
      "abstract": { "correct": <number>, "total": 8, "percentage": <number 0-100> },
      "spatial": { "correct": <number>, "total": 6, "percentage": <number 0-100> },
      "clerical": { "correct": <number>, "total": 20, "percentage": <number 0-100> }
    },
    "overallScore": <percentage 0-100>,
    "topStrengths": ["<strongest aptitude domain>", "<second strongest>"],
    "areasToImprove": ["<weakest domain>"],
    "cognitiveProfile": "<2-3 sentence summary of cognitive strengths and how they relate to career paths>",
    "careerImplications": "<1-2 sentence insight on what careers suit this aptitude profile>"
  },
  "bigFive": {
    "O": <number 0-5>,
    "C": <number 0-5>,
    "E": <number 0-5>,
    "A": <number 0-5>,
    "N": <number 0-5>,
    "dominantTraits": ["<trait name>", "<trait name>"],
    "workStyleSummary": "<2-3 sentence summary of their work style>"
  },
  "workValues": {
    "scores": {
      "Security": <number 0-5>,
      "Autonomy": <number 0-5>,
      "Creativity": <number 0-5>,
      "Status": <number 0-5>,
      "Impact": <number 0-5>,
      "Financial": <number 0-5>,
      "Leadership": <number 0-5>,
      "Lifestyle": <number 0-5>
    },
    "topThree": [
      {"value": "<value name>", "score": <number>},
      {"value": "<value name>", "score": <number>},
      {"value": "<value name>", "score": <number>}
    ],
    "motivationSummary": "<2-3 sentence summary of what motivates them>"
  },
  "employability": {
    "skillScores": {
      "Communication": <number 0-5>,
      "Teamwork": <number 0-5>,
      "ProblemSolving": <number 0-5>,
      "Adaptability": <number 0-5>,
      "Leadership": <number 0-5>,
      "DigitalFluency": <number 0-5>,
      "Professionalism": <number 0-5>,
      "CareerReadiness": <number 0-5>
    },
    "sjtScore": <number 0-100>,
    "overallReadiness": "<High/Medium/Low>",
    "strengthAreas": ["<skill>", "<skill>"],
    "improvementAreas": ["<skill>", "<skill>"]
  },
  "knowledge": {
    "score": <percentage 0-100>,
    "correctCount": <number>,
    "totalQuestions": <number>,
    "strongTopics": ["<topic>", "<topic>"],
    "weakTopics": ["<topic>", "<topic>"],
    "recommendation": "<1-2 sentence study recommendation>"
  },
  "careerFit": {
    "clusters": [
      {
        "title": "<Cluster Name>",
        "fit": "<High/Medium/Explore>",
        "matchScore": <percentage 0-100>,
        "evidence": {
            "interest": "<Interest evidence>",
            "aptitude": "<Aptitude evidence>",
            "personality": "<Personality/values evidence>"
        },
        "roles": {
          "entry": ["<role 1>", "<role 2>"],
          "mid": ["<role 1>", "<role 2>"]
        },
        "domains": ["<domain 1>", "<domain 2>"]
      },
      {
        "title": "<Cluster 2 Name - REQUIRED>",
        "fit": "Medium",
        "matchScore": <percentage 70-85>,
        "evidence": {
            "interest": "<Interest evidence - REQUIRED>",
            "aptitude": "<Aptitude evidence - REQUIRED>",
            "personality": "<Personality evidence - REQUIRED>"
        },
        "roles": {
          "entry": ["<entry role 1 - REQUIRED>", "<entry role 2 - REQUIRED>"],
          "mid": ["<mid role 1 - REQUIRED>", "<mid role 2 - REQUIRED>"]
        },
        "domains": ["<domain 1 - REQUIRED>", "<domain 2 - REQUIRED>"]
      },
      {
        "title": "<Cluster 3 Name - REQUIRED>",
        "fit": "Explore",
        "matchScore": <percentage 60-75>,
        "evidence": {
            "interest": "<Interest evidence - REQUIRED>",
            "aptitude": "<Aptitude evidence - REQUIRED>",
            "personality": "<Personality evidence - REQUIRED>"
        },
        "roles": {
          "entry": ["<entry role 1 - REQUIRED>", "<entry role 2 - REQUIRED>"],
          "mid": ["<mid role 1 - REQUIRED>", "<mid role 2 - REQUIRED>"]
        },
        "domains": ["<domain 1 - REQUIRED>", "<domain 2 - REQUIRED>"]
      }
    ],
    "specificOptions": {
      "highFit": ["<role 1>", "<role 2>", "<role 3>"],
      "mediumFit": ["<role 1>", "<role 2>", "<role 3>"],
      "exploreLater": ["<role 1>", "<role 2>"]
    }
  },
  "skillGap": {
    "currentStrengths": ["<skill 1>", "<skill 2>", "<skill 3>"],
    "priorityA": [
      {
        "skill": "<Skill Name>",
        "currentLevel": <number 1-5>,
        "targetLevel": <number 1-5>,
        "whyNeeded": "<Reason linked to careers>",
        "howToBuild": "<Actionable step>"
      },
      {
        "skill": "<Skill Name>",
        "currentLevel": <number 1-5>,
        "targetLevel": <number 1-5>,
        "whyNeeded": "<Reason>",
        "howToBuild": "<Actionable step>"
      }
    ],
    "priorityB": [
      { "skill": "<Skill Name>" },
      { "skill": "<Skill Name>" }
    ],
    "learningTracks": [
      {
        "track": "<Track Name>",
        "suggestedIf": "<Condition>",
        "topics": "<Core topics/tools>"
      },
      {
        "track": "<Track Name>",
        "suggestedIf": "<Condition>",
        "topics": "<Core topics/tools>"
      }
    ],
    "recommendedTrack": "<One specific track name>"
  },
  "roadmap": {
    "projects": [
      {
        "title": "<Project Title>",
        "purpose": "<Purpose>",
        "output": "<Output/Portfolio Proof>"
      },
      {
        "title": "<Project Title>",
        "purpose": "<Purpose>",
        "output": "<Output/Portfolio Proof>"
      }
    ],
    "internship": {
      "types": ["<type 1>", "<type 2>"],
      "timeline": "<Target timeline>",
      "preparation": {
        "resume": "<Focus area>",
        "portfolio": "<Focus area>",
        "interview": "<Focus area>"
      }
    },
    "exposure": {
      "activities": ["<activity 1>", "<activity 2>"],
      "certifications": ["<cert 1>", "<cert 2>"]
    }
  },
  "finalNote": {
    "advantage": "<Biggest advantage>",
    "growthFocus": "<Top growth focus>",
    "nextReview": "<Suggested review time, e.g. End of 5th Sem>"
  },
  "timingAnalysis": {
    "overallPace": "<Fast/Moderate/Deliberate - based on average time per question across all sections>",
    "decisionStyle": "<Intuitive/Balanced/Analytical - inferred from timing patterns>",
    "confidenceIndicator": "<High/Medium/Low - based on response speed consistency>",
    "sectionInsights": {
      "riasec": "<Brief insight about their pace in interests section>",
      "personality": "<Brief insight about their pace in personality section>",
      "values": "<Brief insight about their pace in values section>",
      "employability": "<Brief insight about their pace in employability section>",
      "knowledge": "<Brief insight about their pace and time management in knowledge test>"
    },
    "recommendation": "<1-2 sentence recommendation based on timing patterns, e.g., 'Consider taking more time for self-reflection' or 'Good balance of speed and thoughtfulness'>"
  },
  "overallSummary": "<4-5 sentence comprehensive summary of the student's profile, strengths, and career potential. Include a brief mention of their assessment-taking style based on timing.>"
}
\`\`\`

CRITICAL REQUIREMENTS - YOU MUST FOLLOW ALL OF THESE:

## CONSISTENCY & DETERMINISM (MOST IMPORTANT):
- This analysis MUST be 100% DETERMINISTIC - same input = same output EVERY TIME
- DO NOT use any random or variable elements in your analysis
- All scores must be calculated using EXACT formulas from the data provided
- Career recommendations must follow a FIXED mapping based on calculated scores
- If the same assessment data is submitted multiple times, your response MUST be IDENTICAL
- Use the following deterministic rules for career matching:
  * Highest RIASEC score determines primary career cluster
  * Second highest determines secondary cluster
  * Third highest determines exploratory cluster

## APTITUDE STRENGTHS - INTERPRETATION RULES (MANDATORY):
- aptitudeStrengths should reflect the student's TOP 2 demonstrated strengths based on ALL assessment data
- Analyze the knowledge test performance, employability skills, and RIASEC interests holistically
- Choose strengths that are MOST EVIDENT from the data (e.g., high scores in specific areas)
- For percentiles: Use the actual score percentages from the relevant sections
- Be SPECIFIC - use concrete skill names like "Analytical Reasoning", "Technical Problem Solving", "Communication", "Logical Thinking", etc.
- The strengths should align with the student's stream and career direction
- IMPORTANT: Base your interpretation on the HIGHEST scoring areas in the assessment data
  * Match scores should be calculated as: (sum of relevant trait scores / max possible) * 100

## SCORING RULES:

1. RIASEC SCORING: For each response, convert using: 1,2,3→0 points, 4→1 point, 5→2 points. Sum these converted scores for each type. Max score per type is 20.

2. RIASEC TOP THREE: Sort all 6 types (R,I,A,S,E,C) by their calculated scores in DESCENDING order. The "topThree" array MUST contain the 3 letters with the HIGHEST scores.

3. Calculate Big Five by averaging responses for each trait (O, C, E, A, N based on question ID prefixes). Each trait MUST have a numeric value 0-5. Round to 1 decimal place.

4. For knowledge score, count correct answers and calculate percentage. This must be EXACT.

## DATA COMPLETENESS (MANDATORY):

5. CAREER CLUSTERS - THIS IS ABSOLUTELY MANDATORY FOR ALL 3 CLUSTERS:
   - You MUST provide exactly 3 career clusters
   - EVERY SINGLE CLUSTER (cluster 1, 2, AND 3) MUST have ALL fields filled:
     * title: A specific career cluster name
     * fit: "High" for cluster 1, "Medium" for cluster 2, "Explore" for cluster 3
     * matchScore: cluster 1: 80-95%, cluster 2: 70-85%, cluster 3: 60-75%
     * evidence.interest: Specific interest-based reason (NOT empty)
     * evidence.aptitude: Specific aptitude-based reason (NOT empty)
     * evidence.personality: Specific personality-based reason (NOT empty)
     * roles.entry: MUST have 2+ entry-level job titles (e.g., ["Junior Developer", "Associate Analyst"])
     * roles.mid: MUST have 2+ mid-level job titles (e.g., ["Senior Developer", "Team Lead"])
     * domains: MUST have 2+ industry domains (e.g., ["Technology", "Finance", "Healthcare"])
   - CRITICAL: NO EMPTY ARRAYS! Every cluster needs roles.entry, roles.mid, and domains filled!
   - If you leave any roles or domains empty, the report will be incomplete!

6. SKILL GAP - MANDATORY:
   - priorityA: Must have at least 2 skills with all fields (skill, currentLevel, targetLevel, whyNeeded, howToBuild)
   - priorityB: Must have at least 2 skills
   - learningTracks: Must have at least 2 tracks with all fields

7. ROADMAP - MANDATORY:
   - projects: Must have at least 2 projects with title, purpose, and output
   - internship.types: Must have at least 2 internship types
   - internship.preparation: Must have resume, portfolio, and interview fields filled
   - exposure.activities: Must have at least 2 activities
   - exposure.certifications: Must have at least 2 certifications

8. Be specific to their stream (${assessmentData.stream}) when recommending careers, roles, and skills.

9. Provide actionable, encouraging, and SPECIFIC career guidance - avoid generic responses.

10. ALL arrays must contain actual data - NO empty arrays allowed!`;
};

/**
 * Calculate knowledge score from answers (legacy function name for compatibility)
 * @param {Object} answers - Assessment answers
 * @param {Array} questions - Stream-specific questions with correct answers
 * @returns {Object} - Knowledge score results
 */
export const calculateKnowledgeWithGemini = async (answers, questions) => {
  let correct = 0;
  let total = 0;
  const incorrectTopics = [];
  const correctTopics = [];

  Object.entries(answers).forEach(([key, value]) => {
    if (key.startsWith('knowledge_')) {
      const questionId = key.replace('knowledge_', '');
      const question = questions.find(q => q.id === questionId);

      if (question) {
        total++;
        if (value === question.correct) {
          correct++;
          correctTopics.push(question.text.substring(0, 50));
        } else {
          incorrectTopics.push(question.text.substring(0, 50));
        }
      }
    }
  });

  return {
    score: total > 0 ? Math.round((correct / total) * 100) : 0,
    correctCount: correct,
    totalQuestions: total,
    strongTopics: correctTopics.slice(0, 3),
    weakTopics: incorrectTopics.slice(0, 3)
  };
};

export default {
  analyzeAssessmentWithOpenRouter,
  analyzeAssessmentWithGemini: analyzeAssessmentWithOpenRouter, // Legacy alias for compatibility
  calculateKnowledgeWithGemini
};
