/**
 * AI Assessment Service
 * Uses Claude AI to analyze assessment answers and provide personalized results
 * 
 * Feature: rag-course-recommendations
 * Requirements: 4.1, 5.2, 6.3
 */

import { 
  getRecommendedCourses,
  getRecommendedCoursesByType,
  getCoursesForMultipleSkillGaps 
} from './courseRecommendationService';
import { callClaude, isClaudeConfigured } from './claudeService';

/**
 * Call Claude API with the given prompt
 * Uses claude-3-5-sonnet for larger output capacity (8192 tokens)
 * Assessment responses are large JSON objects requiring more tokens than haiku supports
 * 
 * @param {string} prompt - The prompt to send
 * @returns {Promise<string>} - The response text
 */
const callClaudeAssessment = async (prompt) => {
  if (!isClaudeConfigured()) {
    throw new Error('Claude API not configured');
  }

  return await callClaude(prompt, {
    model: 'claude-sonnet-4-20250514', // Latest Sonnet with higher token limits
    maxTokens: 8192,
    temperature: 0.1,
    useCache: false // Assessment results should not be cached
  });
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
 * @param {Object} assessmentResults - Parsed results from Claude AI
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
 * Analyze assessment results using Claude AI
 * @param {Object} answers - All answers from the assessment
 * @param {string} stream - Student's selected stream (cs, bca, bba, dm, animation)
 * @param {Object} questionBanks - All question banks for reference
 * @param {Object} sectionTimings - Time spent on each section in seconds
 * @returns {Promise<Object>} - AI-analyzed results
 */
export const analyzeAssessmentWithGemini = async (answers, stream, questionBanks, sectionTimings = {}) => {
  // Check for Claude API
  if (!isClaudeConfigured()) {
    throw new Error('Claude API key not configured. Please add VITE_CLAUDE_API_KEY to your .env file.');
  }

  // Prepare the assessment data
  const assessmentData = prepareAssessmentData(answers, stream, questionBanks, sectionTimings);
  const prompt = buildAnalysisPrompt(assessmentData);

  // Try different model variants for compatibility (updated Dec 2024)
  // Using models in order of preference and availability
  const models = [
    'gemini-1.5-flash',         // Stable flash model
    'gemini-1.5-pro',           // Pro model
    'gemini-2.0-flash-exp',     // Experimental 2.0
    'gemini-1.5-flash-8b',      // Smaller, faster variant
  ];
  let response = null;
  let lastError = null;
  const errors = [];

  for (let i = 0; i < models.length; i++) {
    const model = models[i];
    try {
      // Add delay between retries to help with rate limiting
      if (i > 0) {
        console.log(`Waiting 2 seconds before trying next model...`);
        await new Promise(resolve => setTimeout(resolve, 2000));
      }
      console.log(`Trying Gemini model: ${model}`);
      
      // Build request body
      const requestBody = {
        contents: [{
          parts: [{ text: prompt }]
        }],
        generationConfig: {
          temperature: 0.1,
          topK: 10,
          topP: 0.7,
          maxOutputTokens: 16384, // Increased for large JSON response
        }
      };
      
      response = await fetch(getGeminiApiUrl(model) + `?key=${apiKey}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(requestBody)
      });

      if (response.ok) {
        console.log(`Gemini API success with model: ${model}`);
        break;
      }

      // Get error details from response
      const errorData = await response.json().catch(() => ({}));
      const errorMsg = errorData.error?.message || `Model ${model} returned ${response.status}`;
      console.warn(`Model ${model} failed: ${errorMsg}`);
      errors.push(`${model}: ${errorMsg}`);
      lastError = errorMsg;
      response = null; // Reset so we try next model
    } catch (e) {
      console.warn(`Model ${model} exception: ${e.message}`);
      errors.push(`${model}: ${e.message}`);
      lastError = e.message;
    }
  }

  // If all Gemini models failed, try OpenRouter as fallback
  if (!response || !response.ok) {
    console.log('All Gemini models failed, trying OpenRouter as fallback...');
    const openRouterKey = import.meta.env.VITE_OPENROUTER_API_KEY;
    
    if (openRouterKey) {
      try {
        const openRouterResponse = await callOpenRouter(prompt, openRouterKey);
        
        // Parse the JSON response from OpenRouter
        const jsonMatch = openRouterResponse.match(/```json\n?([\s\S]*?)\n?```/) ||
          openRouterResponse.match(/\{[\s\S]*\}/);

        if (jsonMatch) {
          const jsonStr = jsonMatch[1] || jsonMatch[0];
          try {
            const parsedResults = JSON.parse(jsonStr);
            console.log('OpenRouter fallback successful!');
            
            // Validate and add course recommendations
            const { isValid, missingFields } = validateResults(parsedResults);
            if (!isValid) {
              console.warn('OpenRouter response has missing fields:', missingFields);
            }
            
            const resultsWithCourses = await addCourseRecommendations(parsedResults);
            return resultsWithCourses;
          } catch (parseError) {
            console.error('OpenRouter JSON parse error:', parseError);
          }
        }
      } catch (openRouterError) {
        console.error('OpenRouter fallback also failed:', openRouterError.message);
      }
    }
    
    console.error('All AI providers failed:', errors);
    throw new Error(`Rareminds AI error: ${lastError}. Please check your API keys are valid.`);
  }

  const data = await response.json();
  
  try {
    const claudeResponse = await callClaudeAssessment(prompt);
    
    const jsonMatch = claudeResponse.match(/```json\n?([\s\S]*?)\n?```/) ||
      claudeResponse.match(/\{[\s\S]*\}/);

    if (!jsonMatch) {
      throw new Error('Invalid response format from Claude AI');
    }

    const jsonStr = jsonMatch[1] || jsonMatch[0];
    const parsedResults = JSON.parse(jsonStr);
    console.log('✅ Claude assessment analysis successful');
    
    const { isValid, missingFields } = validateResults(parsedResults);
    if (!isValid) {
      console.warn('Claude response has missing fields:', missingFields);
    }
    
    const resultsWithCourses = await addCourseRecommendations(parsedResults);
    return resultsWithCourses;
  } catch (error) {
    console.error('❌ Claude assessment analysis failed:', error.message);
    throw new Error(`Assessment analysis failed: ${error.message}. Please try again.`);
  }
};

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
const prepareAssessmentData = (answers, stream, questionBanks, sectionTimings = {}) => {
  const { riasecQuestions, aptitudeQuestions, bigFiveQuestions, workValuesQuestions, employabilityQuestions, streamKnowledgeQuestions } = questionBanks;

  // Extract RIASEC answers
  const riasecAnswers = {};
  Object.entries(answers).forEach(([key, value]) => {
    if (key.startsWith('riasec_')) {
      const questionId = key.replace('riasec_', '');
      const question = riasecQuestions.find(q => q.id === questionId);
      if (question) {
        riasecAnswers[questionId] = { question: question.text, answer: value };
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
    Object.entries(answers).forEach(([key, value]) => {
      if (key.startsWith('aptitude_')) {
        const questionId = key.replace('aptitude_', '');
        const question = aptitudeQuestions.find(q => q.id === questionId);
        if (question) {
          const answerData = {
            questionId,
            question: question.text,
            studentAnswer: value,
            correctAnswer: question.correct,
            isCorrect: value === question.correct,
            subtype: question.subtype
          };
          if (aptitudeAnswers[question.subtype]) {
            aptitudeAnswers[question.subtype].push(answerData);
          }
        }
      }
    });
  }

  // Extract Big Five answers
  const bigFiveAnswers = {};
  Object.entries(answers).forEach(([key, value]) => {
    if (key.startsWith('bigfive_')) {
      const questionId = key.replace('bigfive_', '');
      const question = bigFiveQuestions.find(q => q.id === questionId);
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

  // Extract Knowledge Test answers with correct answers
  const knowledgeAnswers = {};
  const streamQuestions = streamKnowledgeQuestions[stream] || [];
  Object.entries(answers).forEach(([key, value]) => {
    if (key.startsWith('knowledge_')) {
      const questionId = key.replace('knowledge_', '');
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
  const aptitudeScores = {
    verbal: { correct: aptitudeAnswers.verbal.filter(a => a.isCorrect).length, total: aptitudeAnswers.verbal.length },
    numerical: { correct: aptitudeAnswers.numerical.filter(a => a.isCorrect).length, total: aptitudeAnswers.numerical.length },
    abstract: { correct: aptitudeAnswers.abstract.filter(a => a.isCorrect).length, total: aptitudeAnswers.abstract.length },
    spatial: { correct: aptitudeAnswers.spatial.filter(a => a.isCorrect).length, total: aptitudeAnswers.spatial.length },
    clerical: { correct: aptitudeAnswers.clerical.filter(a => a.isCorrect).length, total: aptitudeAnswers.clerical.length }
  };
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
      timeLimit: 10 * 60 // 10 minutes
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
 * Build the analysis prompt for Claude AI
 */
const buildAnalysisPrompt = (assessmentData) => {
  // Create a hash of the answers for consistency tracking
  const answersHash = JSON.stringify(assessmentData).split('').reduce((a, b) => {
    a = ((a << 5) - a) + b.charCodeAt(0);
    return a & a;
  }, 0);

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
- Multi-Aptitude Battery: ${assessmentData.sectionTimings?.aptitude?.formatted || 'Not recorded'} of 10 minutes allowed (${assessmentData.sectionTimings?.aptitude?.questionsCount || 0} questions, avg ${assessmentData.sectionTimings?.aptitude?.avgSecondsPerQuestion || 0}s per question)
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
 * Calculate knowledge score from answers
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
  analyzeAssessmentWithGemini,
  calculateKnowledgeWithGemini
};
