/**
 * Gemini Assessment Service
 * Uses Google Gemini AI to analyze assessment answers and provide personalized results
 */

// Gemini API configuration - try multiple models for compatibility
const getGeminiApiUrl = (model = 'gemini-1.5-flash-latest') =>
  `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent`;

/**
 * Validate that all required fields are present in the response
 * @param {Object} results - Parsed results from Gemini
 * @returns {Object} - { isValid: boolean, missingFields: string[] }
 */
const validateResults = (results) => {
  const missingFields = [];

  // Check RIASEC
  if (!results.riasec?.topThree?.length) missingFields.push('riasec.topThree');
  
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

  return {
    isValid: missingFields.length === 0,
    missingFields
  };
};

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
            // Very low temperature for maximum consistency
            temperature: 0.1,
            topK: 10,
            topP: 0.7,
            maxOutputTokens: 8192,
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
      const parsedResults = JSON.parse(jsonStr);
      
      // Validate the response (no fallback data)
      const { isValid, missingFields } = validateResults(parsedResults);
      
      if (!isValid) {
        console.warn('Gemini response has missing fields:', missingFields);
      }
      
      return parsedResults;
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
  "overallSummary": "<4-5 sentence comprehensive summary of the student's profile, strengths, and career potential>"
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
