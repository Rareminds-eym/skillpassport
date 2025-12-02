/**
 * Gemini Assessment Service
 * Uses Google Gemini AI to analyze assessment answers and provide personalized results
 */

// Gemini API configuration - try multiple models for compatibility
const getGeminiApiUrl = (model = 'gemini-1.5-flash-latest') => 
  `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent`;

/**
 * Analyze assessment results using Gemini AI
 * @param {Object} answers - All answers from the assessment
 * @param {string} stream - Student's selected stream (cs, bca, bba, dm, animation)
 * @param {Object} questionBanks - All question banks for reference
 * @returns {Promise<Object>} - AI-analyzed results
 */
export const analyzeAssessmentWithGemini = async (answers, stream, questionBanks) => {
  const apiKey = import.meta.env.VITE_GEMINI_API_KEY;
  
  if (!apiKey) {
    console.warn('Gemini API key not found, falling back to local calculation');
    return null;
  }

  try {
    // Prepare the assessment data for Gemini
    const assessmentData = prepareAssessmentData(answers, stream, questionBanks);
    
    const prompt = buildAnalysisPrompt(assessmentData);

    // Try different model variants for compatibility
    const models = ['gemini-1.5-flash-latest', 'gemini-1.5-flash', 'gemini-pro'];
    let response = null;
    let lastError = null;

    for (const model of models) {
      try {
        response = await fetch(getGeminiApiUrl(model) + `?key=${apiKey}`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            contents: [{
              parts: [{ text: prompt }]
            }],
            generationConfig: {
              temperature: 0.7,
              topK: 40,
              topP: 0.95,
              maxOutputTokens: 4096,
            }
          })
        });

        if (response.ok) {
          console.log(`Gemini API success with model: ${model}`);
          break;
        }
        lastError = `Model ${model} returned ${response.status}`;
      } catch (e) {
        lastError = e.message;
      }
    }

    if (!response || !response.ok) {
      throw new Error(`Gemini API error: ${lastError}`);
    }

    const data = await response.json();
    const textContent = data.candidates?.[0]?.content?.parts?.[0]?.text;

    if (!textContent) {
      throw new Error('No response from Gemini');
    }

    // Parse the JSON response from Gemini
    const jsonMatch = textContent.match(/```json\n?([\s\S]*?)\n?```/) || 
                      textContent.match(/\{[\s\S]*\}/);
    
    if (jsonMatch) {
      const jsonStr = jsonMatch[1] || jsonMatch[0];
      return JSON.parse(jsonStr);
    }

    throw new Error('Could not parse Gemini response');
  } catch (error) {
    console.error('Gemini assessment analysis error:', error);
    return null;
  }
};

/**
 * Prepare assessment data for analysis
 */
const prepareAssessmentData = (answers, stream, questionBanks) => {
  const { riasecQuestions, bigFiveQuestions, workValuesQuestions, employabilityQuestions, streamKnowledgeQuestions } = questionBanks;
  
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

  // Extract Employability answers
  const employabilityAnswers = {};
  Object.entries(answers).forEach(([key, value]) => {
    if (key.startsWith('employability_')) {
      const questionId = key.replace('employability_', '');
      const question = employabilityQuestions.find(q => q.id === questionId);
      if (question) {
        employabilityAnswers[questionId] = { 
          question: question.text, 
          answer: value,
          options: question.options || null
        };
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

  return {
    stream,
    riasecAnswers,
    bigFiveAnswers,
    workValuesAnswers,
    employabilityAnswers,
    knowledgeAnswers,
    totalKnowledgeQuestions: streamQuestions.length
  };
};

/**
 * Build the analysis prompt for Gemini
 */
const buildAnalysisPrompt = (assessmentData) => {
  return `You are a career counselor and psychometric assessment expert. Analyze the following student assessment data and provide comprehensive results.

## Student Stream: ${assessmentData.stream.toUpperCase()}

## RIASEC Career Interest Responses (1-5 scale: 1=Strongly Dislike, 5=Strongly Like):
${JSON.stringify(assessmentData.riasecAnswers, null, 2)}

## Big Five Personality Responses (1-5 scale: 1=Very Inaccurate, 5=Very Accurate):
${JSON.stringify(assessmentData.bigFiveAnswers, null, 2)}

## Work Values Responses (1-5 scale: 1=Not Important, 5=Extremely Important):
${JSON.stringify(assessmentData.workValuesAnswers, null, 2)}

## Employability Skills Responses (1-5 scale or MCQ):
${JSON.stringify(assessmentData.employabilityAnswers, null, 2)}

## Stream Knowledge Test Results:
${JSON.stringify(assessmentData.knowledgeAnswers, null, 2)}
Total Questions: ${assessmentData.totalKnowledgeQuestions}

---

Analyze all responses and return ONLY a valid JSON object with this exact structure:

\`\`\`json
{
  "riasec": {
    "scores": {
      "R": <number 0-5>,
      "I": <number 0-5>,
      "A": <number 0-5>,
      "S": <number 0-5>,
      "E": <number 0-5>,
      "C": <number 0-5>
    },
    "code": "<3-letter RIASEC code>",
    "topThree": ["<letter>", "<letter>", "<letter>"],
    "interpretation": "<2-3 sentence interpretation of their career interests>"
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
  "careerRecommendations": {
    "primaryCluster": {
      "title": "<career cluster name>",
      "description": "<brief description>",
      "matchScore": <percentage 0-100>
    },
    "secondaryCluster": {
      "title": "<career cluster name>",
      "description": "<brief description>",
      "matchScore": <percentage 0-100>
    },
    "suggestedRoles": ["<role 1>", "<role 2>", "<role 3>", "<role 4>", "<role 5>"],
    "skillsToFocus": ["<skill 1>", "<skill 2>", "<skill 3>"],
    "personalizedAdvice": "<3-4 sentence personalized career advice based on all assessment data>"
  },
  "overallSummary": "<4-5 sentence comprehensive summary of the student's profile, strengths, and career potential>"
}
\`\`\`

Important:
- Calculate RIASEC scores by averaging responses for each type (R, I, A, S, E, C based on question ID prefixes)
- Calculate Big Five by averaging responses for each trait (O, C, E, A, N based on question ID prefixes)
- For knowledge score, count correct answers and calculate percentage
- Provide actionable, encouraging career guidance
- Be specific to their stream (${assessmentData.stream}) when recommending careers`;
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
