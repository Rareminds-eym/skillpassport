/**
 * Analyze Assessment API - Cloudflare Worker
 * Dedicated worker for AI-powered career assessment analysis
 * 
 * Endpoint: POST /analyze-assessment
 */

import { createClient } from '@supabase/supabase-js';

interface Env {
  VITE_SUPABASE_URL: string;
  VITE_SUPABASE_ANON_KEY: string;
  SUPABASE_SERVICE_ROLE_KEY: string;
  OPENROUTER_API_KEY: string;
  VITE_OPENROUTER_API_KEY?: string;
}

// CORS headers
const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization',
  'Access-Control-Max-Age': '86400',
};

// Helper: JSON response
const jsonResponse = (data: any, status = 200) => {
  return new Response(JSON.stringify(data), {
    status,
    headers: {
      'Content-Type': 'application/json',
      ...corsHeaders,
    },
  });
};

// Helper: Get OpenRouter API key
const getOpenRouterKey = (env: Env): string | undefined => {
  return env.OPENROUTER_API_KEY || env.VITE_OPENROUTER_API_KEY;
};

// Helper: Validate UUID
const isValidUUID = (uuid: string): boolean => {
  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
  return uuidRegex.test(uuid);
};

// Helper: Authenticate user
async function authenticateUser(request: Request, env: Env) {
  const authHeader = request.headers.get('Authorization');
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return null;
  }

  const token = authHeader.substring(7);
  const supabase = createClient(env.VITE_SUPABASE_URL, env.VITE_SUPABASE_ANON_KEY, {
    global: { headers: { Authorization: `Bearer ${token}` } },
  });

  const { data: { user }, error } = await supabase.auth.getUser();
  if (error || !user) {
    return null;
  }

  const supabaseAdmin = createClient(env.VITE_SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY);

  return { user, supabase, supabaseAdmin };
}

// Rate limiting (simple in-memory)
const rateLimitMap = new Map<string, { count: number; resetTime: number }>();
const RATE_LIMIT_WINDOW = 60000; // 1 minute
const RATE_LIMIT_MAX = 10; // 10 requests per minute

function checkRateLimit(userId: string): boolean {
  const now = Date.now();
  const userLimit = rateLimitMap.get(userId);

  if (!userLimit || now > userLimit.resetTime) {
    rateLimitMap.set(userId, { count: 1, resetTime: now + RATE_LIMIT_WINDOW });
    return true;
  }

  if (userLimit.count >= RATE_LIMIT_MAX) {
    return false;
  }

  userLimit.count++;
  return true;
}

/**
 * Build the AI analysis prompt
 */
const buildAnalysisPrompt = (assessmentData: any) => {
  // Create a hash for consistency tracking
  const answersHash = JSON.stringify(assessmentData).split('').reduce((a, b) => {
    a = ((a << 5) - a) + b.charCodeAt(0);
    return a & a;
  }, 0);

  const gradeLevel = assessmentData.gradeLevel || 'after12';
  const isAfter10 = gradeLevel === 'after10';

  // After 10th stream recommendation section
  const after10StreamSection = isAfter10 ? `
## AFTER 10TH STREAM RECOMMENDATION (MANDATORY FOR THIS STUDENT):
This student is completing 10th grade and needs guidance on which 11th/12th stream to choose.
Based on their ACTUAL assessment scores below, you MUST recommend the best stream.

**Available Streams (Choose ONE as primary recommendation):**

**Science Streams:**
- PCMB (Physics, Chemistry, Maths, Biology) - Best for: High I (Investigative) + Strong Numerical + Interest in Biology/Medicine
- PCMS (Physics, Chemistry, Maths, Computer Science) - Best for: High I + Strong Numerical + Strong Abstract/Logical + Interest in Technology
- PCM (Physics, Chemistry, Maths) - Best for: High I + Strong Numerical + Strong Spatial/Mechanical
- PCB (Physics, Chemistry, Biology) - Best for: High I + High S (Social) + Interest in Healthcare/Life Sciences

**Commerce Stream:**
- Commerce with Maths - Best for: High E (Enterprising) + High C (Conventional) + Strong Numerical
- Commerce without Maths - Best for: High E + High C + Strong Verbal + Moderate Numerical

**Arts/Humanities Stream:**
- Arts with Psychology - Best for: High S (Social) + High A (Artistic) + Interest in Human Behavior
- Arts with Economics - Best for: High I + High E + Strong Verbal + Interest in Society/Policy
- Arts General - Best for: High A (Artistic) + Strong Verbal + Creative Interests

## SCORING-BASED RECOMMENDATION ALGORITHM (FOLLOW EXACTLY):

**Step 1: Analyze RIASEC Scores**
- Calculate which RIASEC types have scores >= 60%
- Identify top 2-3 dominant types

**Step 2: Analyze Aptitude Scores**
- Numerical >= 70%: Strong fit for Science/Commerce with Maths
- Verbal >= 70%: Strong fit for Arts/Commerce
- Abstract/Logical >= 70%: Strong fit for Science (especially PCMS)
- Spatial >= 70%: Strong fit for Engineering (PCM/PCMS)
- Clerical >= 70%: Strong fit for Commerce

**Step 3: Match Pattern to Stream**
| Pattern | Recommended Stream |
|---------|-------------------|
| High I + High Numerical + High Abstract | PCMS or PCM |
| High I + High Numerical + Biology Interest | PCMB or PCB |
| High I + High S + Biology Interest | PCB |
| High E + High C + High Numerical | Commerce with Maths |
| High E + High C + High Verbal | Commerce without Maths |
| High A + High S + High Verbal | Arts |
| High I + High E + High Verbal | Arts with Economics |

**Step 4: Determine Confidence**
- High Fit: Pattern matches clearly (2+ indicators align)
- Medium Fit: Pattern partially matches (1-2 indicators align)

IMPORTANT: Base your recommendation on the ACTUAL scores provided, not assumptions!
` : '';

  return `You are a career counselor and psychometric assessment expert. Analyze the following student assessment data and provide comprehensive results.

## CONSISTENCY REQUIREMENT - CRITICAL:
This analysis must be DETERMINISTIC and CONSISTENT. Given the same input data, you must ALWAYS produce the SAME output.
- Use ONLY the provided data to make calculations - do not introduce randomness
- Calculate scores using EXACT mathematical formulas provided below
- Career recommendations must be derived DIRECTLY from the calculated scores
- If this same data is analyzed again, the results MUST be identical
- Session ID for consistency verification: ${answersHash}

## Student Grade Level: ${gradeLevel.toUpperCase()}
## Student Stream: ${assessmentData.stream.toUpperCase()}
${after10StreamSection}

## RIASEC Career Interest Responses (1-5 scale):
${JSON.stringify(assessmentData.riasecAnswers, null, 2)}

RIASEC SCORING RULES:
- Response 1-3: 0 points
- Response 4: 1 point
- Response 5: 2 points
- Maximum score per type = 20

## MULTI-APTITUDE BATTERY RESULTS:
Pre-calculated Scores:
- Verbal: ${assessmentData.aptitudeScores?.verbal?.correct || 0}/${assessmentData.aptitudeScores?.verbal?.total || 8}
- Numerical: ${assessmentData.aptitudeScores?.numerical?.correct || 0}/${assessmentData.aptitudeScores?.numerical?.total || 8}
- Abstract: ${assessmentData.aptitudeScores?.abstract?.correct || 0}/${assessmentData.aptitudeScores?.abstract?.total || 8}
- Spatial: ${assessmentData.aptitudeScores?.spatial?.correct || 0}/${assessmentData.aptitudeScores?.spatial?.total || 6}
- Clerical: ${assessmentData.aptitudeScores?.clerical?.correct || 0}/${assessmentData.aptitudeScores?.clerical?.total || 20}

## Big Five Personality Responses:
${JSON.stringify(assessmentData.bigFiveAnswers, null, 2)}

## Work Values Responses:
${JSON.stringify(assessmentData.workValuesAnswers, null, 2)}

## Employability Skills:
Self-Rating: ${JSON.stringify(assessmentData.employabilityAnswers?.selfRating || {}, null, 2)}
SJT: ${JSON.stringify(assessmentData.employabilityAnswers?.sjt || [], null, 2)}

## Knowledge Test Results:
${JSON.stringify(assessmentData.knowledgeAnswers, null, 2)}

## Section Timings:
${JSON.stringify(assessmentData.sectionTimings, null, 2)}

---

Return ONLY a valid JSON object with this EXACT structure (no markdown, no extra text):

{
  "profileSnapshot": {
    "keyPatterns": {
      "enjoyment": "<Pattern>",
      "strength": "<Pattern>",
      "workStyle": "<Pattern>",
      "motivation": "<Pattern>"
    },
    "aptitudeStrengths": [
      {"name": "<Strength>", "percentile": "<Percentile>"}
    ]
  },
  "riasec": {
    "scores": {"R": 0, "I": 0, "A": 0, "S": 0, "E": 0, "C": 0},
    "maxScore": 20,
    "code": "<3-letter code>",
    "topThree": ["<letter>", "<letter>", "<letter>"],
    "interpretation": "<2-3 sentences>"
  },
  "aptitude": {
    "scores": {
      "verbal": {"correct": 0, "total": 8, "percentage": 0},
      "numerical": {"correct": 0, "total": 8, "percentage": 0},
      "abstract": {"correct": 0, "total": 8, "percentage": 0},
      "spatial": {"correct": 0, "total": 6, "percentage": 0},
      "clerical": {"correct": 0, "total": 20, "percentage": 0}
    },
    "overallScore": 0,
    "topStrengths": ["<strength>"],
    "areasToImprove": ["<area>"],
    "cognitiveProfile": "<2-3 sentences>",
    "careerImplications": "<1-2 sentences>"
  },
  "bigFive": {
    "O": 0, "C": 0, "E": 0, "A": 0, "N": 0,
    "dominantTraits": ["<trait>"],
    "workStyleSummary": "<2-3 sentences>"
  },
  "workValues": {
    "scores": {"Security": 0, "Autonomy": 0, "Creativity": 0, "Status": 0, "Impact": 0, "Financial": 0, "Leadership": 0, "Lifestyle": 0},
    "topThree": [
      {"value": "<value>", "score": 0}
    ],
    "motivationSummary": "<2-3 sentences>"
  },
  "employability": {
    "skillScores": {"Communication": 0, "Teamwork": 0, "ProblemSolving": 0, "Adaptability": 0, "Leadership": 0, "DigitalFluency": 0, "Professionalism": 0, "CareerReadiness": 0},
    "sjtScore": 0,
    "overallReadiness": "<High/Medium/Low>",
    "strengthAreas": ["<skill>"],
    "improvementAreas": ["<skill>"]
  },
  "knowledge": {
    "score": 0,
    "correctCount": 0,
    "totalQuestions": 0,
    "strongTopics": ["<topic>"],
    "weakTopics": ["<topic>"],
    "recommendation": "<1-2 sentences>"
  },
  "careerFit": {
    "clusters": [
      {
        "title": "<Career Cluster 1 - REQUIRED>",
        "fit": "High",
        "matchScore": 85,
        "description": "<2-3 sentences explaining WHY this fits based on assessment - REQUIRED>",
        "evidence": {"interest": "<RIASEC evidence - REQUIRED>", "aptitude": "<aptitude evidence - REQUIRED>", "personality": "<personality evidence - REQUIRED>"},
        "roles": {"entry": ["<entry role 1>", "<entry role 2>"], "mid": ["<mid role 1>", "<mid role 2>"]},
        "domains": ["<domain 1>", "<domain 2>"],
        "whyItFits": "<Specific connection to student's profile - REQUIRED>"
      },
      {
        "title": "<Career Cluster 2 - REQUIRED>",
        "fit": "Medium",
        "matchScore": 75,
        "description": "<2-3 sentences explaining fit - REQUIRED>",
        "evidence": {"interest": "<RIASEC evidence - REQUIRED>", "aptitude": "<aptitude evidence - REQUIRED>", "personality": "<personality evidence - REQUIRED>"},
        "roles": {"entry": ["<entry role 1>", "<entry role 2>"], "mid": ["<mid role 1>", "<mid role 2>"]},
        "domains": ["<domain 1>", "<domain 2>"],
        "whyItFits": "<Connection to student's profile - REQUIRED>"
      },
      {
        "title": "<Career Cluster 3 - REQUIRED>",
        "fit": "Explore",
        "matchScore": 65,
        "description": "<2-3 sentences explaining potential - REQUIRED>",
        "evidence": {"interest": "<RIASEC evidence - REQUIRED>", "aptitude": "<aptitude evidence - REQUIRED>", "personality": "<personality evidence - REQUIRED>"},
        "roles": {"entry": ["<entry role 1>", "<entry role 2>"], "mid": ["<mid role 1>", "<mid role 2>"]},
        "domains": ["<domain 1>", "<domain 2>"],
        "whyItFits": "<Why worth exploring - REQUIRED>"
      }
    ],
    "specificOptions": {
      "highFit": [{"name": "<role 1>", "salary": {"min": 4, "max": 12}}, {"name": "<role 2>", "salary": {"min": 4, "max": 10}}, {"name": "<role 3>", "salary": {"min": 3, "max": 8}}],
      "mediumFit": [{"name": "<role 1>", "salary": {"min": 3, "max": 8}}, {"name": "<role 2>", "salary": {"min": 3, "max": 7}}],
      "exploreLater": [{"name": "<role 1>", "salary": {"min": 3, "max": 7}}, {"name": "<role 2>", "salary": {"min": 2, "max": 6}}]
    }
  },
  "skillGap": {
    "currentStrengths": ["<skill>"],
    "priorityA": [{"skill": "<skill>", "currentLevel": 1, "targetLevel": 3, "whyNeeded": "<reason>", "howToBuild": "<action>"}],
    "priorityB": [{"skill": "<skill>"}],
    "learningTracks": [{"track": "<track>", "suggestedIf": "<condition>", "topics": "<topics>"}],
    "recommendedTrack": "<track>"
  },
  "streamRecommendation": {
    "isAfter10": ${isAfter10},
    "recommendedStream": "${isAfter10 ? '<REQUIRED: PCMB/PCMS/PCM/PCB/Commerce with Maths/Commerce without Maths/Arts>' : 'N/A'}",
    "streamFit": "${isAfter10 ? '<High/Medium>' : 'N/A'}",
    "confidenceScore": "${isAfter10 ? '<75-100>' : 'N/A'}",
    "reasoning": {"interests": "<RIASEC scores>", "aptitude": "<aptitude scores>", "personality": "<traits>"},
    "scoreBasedAnalysis": {"riasecTop3": ["<type>"], "strongAptitudes": ["<aptitude>"], "matchingPattern": "<pattern>"},
    "alternativeStream": "<stream>",
    "alternativeReason": "<reason>",
    "subjectsToFocus": ["<subject>"],
    "careerPathsAfter12": ["<career>"],
    "entranceExams": ["<exam>"],
    "collegeTypes": ["<type>"]
  },
  "roadmap": {
    "projects": [{"title": "<title>", "purpose": "<purpose>", "output": "<output>"}],
    "internship": {"types": ["<type>"], "timeline": "<timeline>", "preparation": {"resume": "<focus>", "portfolio": "<focus>", "interview": "<focus>"}},
    "exposure": {"activities": ["<activity>"], "certifications": ["<cert>"]}
  },
  "finalNote": {
    "advantage": "<advantage>",
    "growthFocus": "<focus>",
    "nextReview": "<timeline>"
  },
  "timingAnalysis": {
    "overallPace": "<Fast/Moderate/Deliberate>",
    "decisionStyle": "<Intuitive/Balanced/Analytical>",
    "confidenceIndicator": "<High/Medium/Low>",
    "sectionInsights": {"riasec": "<insight>", "personality": "<insight>", "values": "<insight>", "employability": "<insight>", "knowledge": "<insight>"},
    "recommendation": "<1-2 sentences>"
  },
  "overallSummary": "<4-5 sentences>"
}

CRITICAL REQUIREMENTS - YOU MUST FOLLOW ALL:
1. EXACTLY 3 CAREER CLUSTERS ARE MANDATORY - You MUST provide 3 different career clusters:
   - Cluster 1: High fit (matchScore 80-95%)
   - Cluster 2: Medium fit (matchScore 70-85%)
   - Cluster 3: Explore fit (matchScore 60-75%)
2. Each cluster MUST have: title, fit, matchScore, description, evidence (all 3 fields), roles (entry + mid), domains, whyItFits
3. ALL arrays must have at least 2 items - NO empty arrays
4. ALL career clusters must have roles.entry, roles.mid, and domains filled with real job titles
5. For after10 students, streamRecommendation is MANDATORY with a specific stream choice
6. Use EXACT scoring formulas provided - Be DETERMINISTIC (same input = same output)
7. Provide SPECIFIC, ACTIONABLE career guidance based on the student's actual scores
8. DO NOT truncate the response - complete ALL fields`;
};

/**
 * Main handler for /analyze-assessment
 */
async function handleAnalyzeAssessment(request: Request, env: Env): Promise<Response> {
  if (request.method !== 'POST') {
    return jsonResponse({ error: 'Method not allowed' }, 405);
  }

  // Authentication (bypass for local development)
  const isDevelopment = env.VITE_SUPABASE_URL?.includes('localhost') || request.headers.get('X-Dev-Mode') === 'true';
  
  let studentId: string;
  
  if (isDevelopment) {
    // For local testing, use a test student ID
    studentId = 'test-student-' + Date.now();
    console.log('[DEV MODE] Bypassing authentication, using test student ID:', studentId);
  } else {
    const auth = await authenticateUser(request, env);
    if (!auth) {
      return jsonResponse({ error: 'Authentication required' }, 401);
    }
    const { user } = auth;
    studentId = user.id;
  }

  // Rate limiting
  if (!checkRateLimit(studentId)) {
    return jsonResponse({ error: 'Rate limit exceeded. Please try again in a minute.' }, 429);
  }

  // Parse request body
  let body;
  try {
    body = await request.json() as { assessmentData: any };
  } catch {
    return jsonResponse({ error: 'Invalid JSON in request body' }, 400);
  }

  const { assessmentData } = body;

  if (!assessmentData) {
    return jsonResponse({ error: 'assessmentData is required' }, 400);
  }

  console.log(`[ASSESSMENT] Analyzing for student ${studentId}, stream: ${assessmentData.stream}, grade: ${assessmentData.gradeLevel}`);

  const prompt = buildAnalysisPrompt(assessmentData);

  // Helper to call OpenRouter AI
  const callAI = async (model: string) => {
    const openRouterKey = getOpenRouterKey(env);
    if (!openRouterKey) {
      throw new Error('OpenRouter API key not configured');
    }

    const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${openRouterKey}`,
        'Content-Type': 'application/json',
        'HTTP-Referer': env.VITE_SUPABASE_URL || 'https://skillpassport.rareminds.in',
        'X-Title': 'SkillPassport Assessment Analyzer'
      },
      body: JSON.stringify({
        model: model,
        messages: [
          {
            role: 'system',
            content: 'You are an expert career counselor and psychometric analyst. Provide detailed, deterministic career analysis. CRITICAL REQUIREMENTS: 1) Always return complete, valid JSON - never truncate. 2) You MUST provide EXACTLY 3 career clusters (High fit, Medium fit, Explore fit) - this is MANDATORY. 3) Ensure all arrays and objects are properly closed. 4) Each cluster must have description, evidence, roles, domains, and whyItFits fields filled.'
          },
          {
            role: 'user',
            content: prompt
          }
        ],
        temperature: 0.3,
        max_tokens: 8000
      })
    });

    return response;
  };

  // Try models in order (using valid free models that work)
  const models = [
    'xiaomi/mimo-v2-flash:free'  // Xiaomi's free model - fast and reliable
  ];
  
  try {
    let response: Response | null = null;
    let lastError = '';
    
    for (const model of models) {
      console.log(`[ASSESSMENT] Trying model: ${model}`);
      try {
        response = await callAI(model);
        if (response.ok) {
          console.log(`[ASSESSMENT] Success with model: ${model}`);
          break;
        }
        const errorText = await response.text();
        lastError = errorText;
        console.error(`[ASSESSMENT] Model ${model} failed:`, response.status, errorText);
        response = null;
      } catch (e) {
        console.error(`[ASSESSMENT] Model ${model} error:`, e);
        lastError = (e as Error).message;
      }
    }

    if (!response || !response.ok) {
      console.error('[ASSESSMENT] All AI models failed');
      return jsonResponse({ 
        error: 'AI service unavailable. Please try again.',
        details: lastError 
      }, 500);
    }

    const data = await response.json() as any;
    const content = data.choices?.[0]?.message?.content;

    if (!content) {
      return jsonResponse({ error: 'Empty response from AI service' }, 500);
    }

    // Extract JSON from response
    let jsonStr = content;
    
    // Method 1: Extract from markdown code block
    const codeBlockMatch = content.match(/```(?:json)?\n?([\s\S]*?)\n?```/);
    if (codeBlockMatch) {
      jsonStr = codeBlockMatch[1].trim();
    } else {
      // Method 2: Find outermost JSON object
      const firstBrace = content.indexOf('{');
      const lastBrace = content.lastIndexOf('}');
      if (firstBrace !== -1 && lastBrace !== -1 && lastBrace > firstBrace) {
        jsonStr = content.substring(firstBrace, lastBrace + 1);
      }
    }

    if (!jsonStr || !jsonStr.startsWith('{')) {
      console.error('[ASSESSMENT] Could not extract JSON from response');
      return jsonResponse({ error: 'Invalid response format from AI' }, 500);
    }

    // Parse JSON
    let parsedResults;
    try {
      parsedResults = JSON.parse(jsonStr);
    } catch (e) {
      console.error('[ASSESSMENT] JSON parse error:', e);
      
      // Try to fix common issues
      let fixedJson = jsonStr;
      fixedJson = fixedJson.replace(/,(\s*[}\]])/g, '$1'); // Remove trailing commas
      
      // Try to close unclosed brackets
      const openBraces = (fixedJson.match(/{/g) || []).length;
      const closeBraces = (fixedJson.match(/}/g) || []).length;
      const openBrackets = (fixedJson.match(/\[/g) || []).length;
      const closeBrackets = (fixedJson.match(/]/g) || []).length;
      
      if (openBraces > closeBraces || openBrackets > closeBrackets) {
        console.log('[ASSESSMENT] Attempting to fix truncated JSON...');
        for (let i = 0; i < openBrackets - closeBrackets; i++) fixedJson += ']';
        for (let i = 0; i < openBraces - closeBraces; i++) fixedJson += '}';
      }
      
      try {
        parsedResults = JSON.parse(fixedJson);
        console.log('[ASSESSMENT] Successfully parsed after fixing JSON');
      } catch (e2) {
        console.error('[ASSESSMENT] Still failed after fix attempt');
        return jsonResponse({ 
          error: 'Failed to parse AI response. The response was incomplete.',
          details: 'Please try again. Complex assessments may require multiple attempts.'
        }, 500);
      }
    }

    console.log(`[ASSESSMENT] Successfully analyzed for student ${studentId}`);
    return jsonResponse({ success: true, data: parsedResults });

  } catch (error) {
    console.error('[ASSESSMENT] Unexpected error:', error);
    return jsonResponse({ 
      error: 'Assessment analysis failed',
      details: (error as Error).message 
    }, 500);
  }
}

// ==================== MAIN EXPORT ====================

export default {
  async fetch(request: Request, env: Env): Promise<Response> {
    // Handle CORS preflight
    if (request.method === 'OPTIONS') {
      return new Response('ok', { headers: corsHeaders });
    }

    const url = new URL(request.url);
    const path = url.pathname;

    // Validate environment
    if (!env.VITE_SUPABASE_URL || !env.VITE_SUPABASE_ANON_KEY || !env.SUPABASE_SERVICE_ROLE_KEY) {
      return jsonResponse({ error: 'Server configuration error: Missing Supabase credentials' }, 500);
    }

    if (!getOpenRouterKey(env)) {
      return jsonResponse({ error: 'Server configuration error: Missing OpenRouter API key' }, 500);
    }

    try {
      // Main endpoint
      if (path === '/analyze-assessment' || path === '/') {
        return await handleAnalyzeAssessment(request, env);
      }

      // Health check
      if (path === '/health') {
        return jsonResponse({
          status: 'ok',
          service: 'analyze-assessment-api',
          version: '1.0.0',
          timestamp: new Date().toISOString()
        });
      }

      return jsonResponse({ 
        error: 'Not found',
        message: 'Use POST /analyze-assessment to analyze assessment data'
      }, 404);

    } catch (error) {
      console.error('[ERROR] analyze-assessment-api:', error);
      return jsonResponse({ 
        error: 'Internal server error',
        details: (error as Error)?.message 
      }, 500);
    }
  }
};
