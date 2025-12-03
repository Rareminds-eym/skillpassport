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
    throw new Error('Gemini API key not configured. Please add VITE_GEMINI_API_KEY to your .env file.');
  }

  // Prepare the assessment data for Gemini
  const assessmentData = prepareAssessmentData(answers, stream, questionBanks);

  const prompt = buildAnalysisPrompt(assessmentData);

  // Try different model variants for compatibility (updated Dec 2024)
  const models = [
    'gemini-2.0-flash',
    'gemini-1.5-flash',
    'gemini-1.5-pro',
    'gemini-1.0-pro'
  ];
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

      // Get error details from response
      const errorData = await response.json().catch(() => ({}));
      lastError = errorData.error?.message || `Model ${model} returned ${response.status}`;
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
    throw new Error('No response received from Gemini AI');
  }

  // Parse the JSON response from Gemini
  const jsonMatch = textContent.match(/```json\n?([\s\S]*?)\n?```/) ||
    textContent.match(/\{[\s\S]*\}/);

  if (jsonMatch) {
    const jsonStr = jsonMatch[1] || jsonMatch[0];
    try {
      return JSON.parse(jsonStr);
    } catch (parseError) {
      throw new Error('Failed to parse AI response. Please try again.');
    }
  }

  throw new Error('Invalid response format from Gemini AI');
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

## RIASEC Career Interest Responses (1-5 scale: 1=Strongly Dislike, 2=Dislike, 3=Neutral, 4=Like, 5=Strongly Like):
${JSON.stringify(assessmentData.riasecAnswers, null, 2)}

RIASEC SCORING RULES:
- Response 1 (Strongly Dislike): 0 points - DO NOT count
- Response 2 (Dislike): 0 points - DO NOT count  
- Response 3 (Neutral): 0 points
- Response 4 (Like): 1 point
- Response 5 (Strongly Like): 2 points
- Maximum score per type = 20 (10 questions × 2 points max)

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
        "title": "<Cluster Name>",
        "fit": "<High/Medium/Explore>",
        "matchScore": <percentage 0-100>,
        "evidence": {
            "interest": "<Interest evidence>",
            "aptitude": "<Aptitude evidence>",
            "personality": "<Personality/values evidence>"
        },
        "roles": { "entry": [], "mid": [] },
        "domains": []
      },
      {
        "title": "<Cluster Name>",
        "fit": "<High/Medium/Explore>",
        "matchScore": <percentage 0-100>,
        "evidence": {
            "interest": "<Interest evidence>",
            "aptitude": "<Aptitude evidence>",
            "personality": "<Personality/values evidence>"
        },
        "roles": { "entry": [], "mid": [] },
        "domains": []
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
  "overallSummary": "<4-5 sentence comprehensive summary of the student's profile, strengths, and career potential>"
}
\`\`\`

Important:
- RIASEC SCORING: For each response, convert using: 1,2,3→0 points, 4→1 point, 5→2 points. Sum these converted scores for each type. Max score per type is 20.
- RIASEC TOP THREE: Sort all 6 types (R,I,A,S,E,C) by their calculated scores in DESCENDING order. The "topThree" array MUST contain the 3 letters with the HIGHEST scores. The "code" is these 3 letters joined together. Example: if scores are R=15, I=8, A=12, S=6, E=10, C=4, then topThree=["R","A","E"] and code="RAE".
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
