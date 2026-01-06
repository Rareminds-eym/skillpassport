/**
 * Career API Cloudflare Worker
 * Converted from Supabase Edge Functions
 * 
 * Endpoints:
 * - /chat - Career AI chat with streaming
 * - /recommend-opportunities - Get job recommendations
 */

import { createClient, SupabaseClient } from '@supabase/supabase-js';
import type { CareerIntent, ChatRequest, Env, Opportunity, StoredMessage } from './types/career-ai';
import { authenticateUser, generateConversationTitle, isValidUUID, sanitizeInput } from './utils/auth';
import { corsHeaders, jsonResponse, streamResponse } from './utils/cors';
import { checkRateLimit } from './utils/rate-limit';

// AI modules
import { getConversationPhase, getPhaseParameters } from './ai/conversation-phase';
import { getBlockedResponse, runGuardrails, validateResponse } from './ai/guardrails';
import { detectIntent } from './ai/intent-detection';
import { buildMemoryContext, compressContext } from './ai/memory';
import { buildEnhancedSystemPrompt } from './ai/prompts/enhanced-system-prompt';

// Context builders
import { buildAssessmentContext } from './context/assessment';
import { buildCourseContext } from './context/courses';
import { fetchOpportunities } from './context/opportunities';
import { buildCareerProgressContext } from './context/progress';
import { buildStudentContext } from './context/student';

// Helper to get OpenRouter API key (supports both variable names)
const getOpenRouterKey = (env: Env): string | undefined => {
  return env.OPENROUTER_API_KEY || env.VITE_OPENROUTER_API_KEY;
};

// ==================== CAREER CHAT HANDLER ====================

async function handleCareerChat(request: Request, env: Env): Promise<Response> {
  if (request.method !== 'POST') {
    return jsonResponse({ error: 'Method not allowed' }, 405);
  }

  const startTime = Date.now();

  // Authentication
  const auth = await authenticateUser(request, env);
  if (!auth) {
    return jsonResponse({ error: 'Authentication required. Please log in again.' }, 401);
  }

  const { user, supabase, supabaseAdmin } = auth;
  const studentId = user.id;

  // Rate limiting
  if (!checkRateLimit(studentId)) {
    return jsonResponse({ error: 'Too many requests. Please wait a moment.' }, 429);
  }

  // Parse request
  let body: ChatRequest;
  try {
    body = await request.json() as ChatRequest;
  } catch {
    return jsonResponse({ error: 'Invalid JSON' }, 400);
  }

  const { conversationId, message, selectedChips = [] } = body;

  if (!message || typeof message !== 'string') {
    return jsonResponse({ error: 'Message is required' }, 400);
  }

  const sanitizedMessage = sanitizeInput(message);
  if (!sanitizedMessage) {
    return jsonResponse({ error: 'Invalid message' }, 400);
  }

  // Run safety guardrails
  const guardrailResult = runGuardrails(sanitizedMessage);
  if (!guardrailResult.passed) {
    console.log(`[GUARDRAIL] Blocked: ${guardrailResult.flags.join(', ')}`);
    return jsonResponse({ 
      blocked: true, 
      message: getBlockedResponse(guardrailResult.flags[0] || 'default')
    });
  }

  const processedMessage = guardrailResult.sanitizedInput || sanitizedMessage;

  console.log(`[REQUEST] studentId: ${studentId}, convId: ${conversationId || 'new'}, msg: "${processedMessage.slice(0, 50)}..."`);

  // Fetch existing conversation
  let currentConversationId = conversationId;
  let existingMessages: StoredMessage[] = [];

  if (conversationId) {
    const { data: conversation } = await supabase
      .from('career_ai_conversations')
      .select('messages')
      .eq('id', conversationId)
      .eq('student_id', studentId)
      .single();

    if (conversation) {
      existingMessages = conversation.messages || [];
    }
  }

  // Determine phase and intent
  const messageCount = existingMessages.length;
  const conversationPhase = getConversationPhase(messageCount);
  const intentResult = detectIntent(sanitizedMessage, selectedChips, existingMessages);
  const phaseParams = getPhaseParameters(conversationPhase, intentResult.intent);

  console.log(`[ANALYSIS] Phase: ${conversationPhase} | Intent: ${intentResult.intent} (${intentResult.confidence})`);

  // Build context in parallel
  const [studentProfile, assessmentContext, progressContext, courseContext] = await Promise.all([
    buildStudentContext(supabase, studentId),
    buildAssessmentContext(supabaseAdmin, studentId),
    buildCareerProgressContext(supabase, studentId),
    buildCourseContext(supabase, studentId)
  ]);

  if (!studentProfile) {
    return jsonResponse({ error: 'Unable to load student profile' }, 500);
  }

  console.log(`[CONTEXT] Profile: ${studentProfile.name}, Skills: ${studentProfile.technicalSkills.length}`);

  // Fetch opportunities for relevant intents
  let opportunities: Opportunity[] = [];
  const jobRelatedIntents: CareerIntent[] = ['find-jobs', 'skill-gap', 'career-guidance', 'application-status'];
  if (jobRelatedIntents.includes(intentResult.intent)) {
    opportunities = await fetchOpportunities(supabase, 50);
    console.log(`[CONTEXT] Fetched ${opportunities.length} opportunities`);
  }

  // Build system prompt
  const systemPrompt = buildEnhancedSystemPrompt({
    profile: studentProfile,
    assessment: assessmentContext,
    progress: progressContext,
    opportunities,
    phase: conversationPhase,
    intentResult,
    courseContext
  });

  // Prepare messages for AI
  const turnId = crypto.randomUUID();
  const userMessage: StoredMessage = {
    id: turnId,
    role: 'user',
    content: processedMessage,
    timestamp: new Date().toISOString()
  };

  // Build conversation history with memory compression
  let memoryContext = '';
  let recentMessages = existingMessages;

  if (existingMessages.length > 10) {
    const compressed = compressContext(existingMessages, 10);
    recentMessages = compressed.recentMessages;
    memoryContext = buildMemoryContext(compressed);
  } else {
    recentMessages = existingMessages.slice(-10);
  }

  const systemPromptWithMemory = memoryContext 
    ? `${systemPrompt}\n\n${memoryContext}` 
    : systemPrompt;

  const aiMessages = [
    { role: 'system', content: systemPromptWithMemory },
    ...recentMessages.map(m => ({ role: m.role, content: m.content })),
    { role: 'user', content: processedMessage }
  ];

  // Stream AI response
  return streamCareerResponse({
    env,
    aiMessages,
    phaseParams,
    supabaseAdmin,
    studentId,
    existingMessages,
    userMessage,
    currentConversationId,
    message: processedMessage,
    intentResult,
    conversationPhase,
    assessmentContext,
    startTime
  });
}


// ==================== STREAM RESPONSE ====================

interface StreamParams {
  env: Env;
  aiMessages: any[];
  phaseParams: any;
  supabaseAdmin: SupabaseClient;
  studentId: string;
  existingMessages: StoredMessage[];
  userMessage: StoredMessage;
  currentConversationId: string | undefined;
  message: string;
  intentResult: any;
  conversationPhase: string;
  assessmentContext: any;
  startTime: number;
}

async function streamCareerResponse(params: StreamParams): Promise<Response> {
  const {
    env, aiMessages, phaseParams, supabaseAdmin, studentId,
    existingMessages, userMessage, currentConversationId,
    message, intentResult, conversationPhase, assessmentContext, startTime
  } = params;

  const encoder = new TextEncoder();
  let fullResponse = '';
  let convId = currentConversationId;

  const stream = new ReadableStream({
    async start(controller) {
      try {
        const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${getOpenRouterKey(env)}`,
            'Content-Type': 'application/json',
            'HTTP-Referer': env.VITE_SUPABASE_URL || '',
            'X-Title': 'Career AI Assistant'
          },
          body: JSON.stringify({
            model: 'openai/gpt-4o-mini',
            messages: aiMessages,
            stream: true,
            max_tokens: phaseParams.max_tokens,
            temperature: phaseParams.temperature
          })
        });

        if (!response.ok) {
          const errorText = await response.text();
          console.error('[AI ERROR]', response.status, errorText);
          controller.enqueue(encoder.encode(`event: error\ndata: ${JSON.stringify({ error: `AI service error (${response.status})` })}\n\n`));
          controller.close();
          return;
        }

        const reader = response.body?.getReader();
        if (!reader) {
          controller.enqueue(encoder.encode(`event: error\ndata: ${JSON.stringify({ error: 'No response stream' })}\n\n`));
          controller.close();
          return;
        }

        const decoder = new TextDecoder();
        let buffer = '';

        while (true) {
          const { done, value } = await reader.read();
          if (done) break;

          buffer += decoder.decode(value, { stream: true });
          const lines = buffer.split('\n');
          buffer = lines.pop() || '';

          for (const line of lines) {
            if (line.startsWith('data: ')) {
              const data = line.slice(6);
              if (data === '[DONE]') continue;
              try {
                const parsed = JSON.parse(data);
                const content = parsed.choices?.[0]?.delta?.content;
                if (content) {
                  fullResponse += content;
                  controller.enqueue(encoder.encode(`event: token\ndata: ${JSON.stringify({ content })}\n\n`));
                }
              } catch { /* skip parse errors */ }
            }
          }
        }

        // Validate response
        const responseValidation = validateResponse(fullResponse);
        if (responseValidation.flags.length > 0) {
          console.log(`[RESPONSE FLAGS] ${responseValidation.flags.join(', ')}`);
        }

        // Save conversation
        const assistantMessage: StoredMessage = {
          id: userMessage.id,
          role: 'assistant',
          content: fullResponse,
          timestamp: new Date().toISOString()
        };

        const updatedMessages = [...existingMessages, userMessage, assistantMessage];

        try {
          if (convId) {
            await supabaseAdmin.from('career_ai_conversations')
              .update({ messages: updatedMessages, updated_at: new Date().toISOString() })
              .eq('id', convId)
              .eq('student_id', studentId);
          } else {
            const title = generateConversationTitle(message);
            const { data: newConv } = await supabaseAdmin.from('career_ai_conversations')
              .insert({ student_id: studentId, title: title.slice(0, 255), messages: updatedMessages })
              .select('id')
              .single();
            if (newConv) convId = newConv.id;
          }
        } catch (dbError) {
          console.error('[DB ERROR]', dbError);
        }

        // Send completion event
        const executionTime = Date.now() - startTime;
        controller.enqueue(encoder.encode(`event: done\ndata: ${JSON.stringify({
          conversationId: convId,
          messageId: assistantMessage.id,
          intent: intentResult.intent,
          intentConfidence: intentResult.confidence,
          phase: conversationPhase,
          hasAssessment: assessmentContext.hasAssessment,
          executionTime
        })}\n\n`));

        console.log(`[COMPLETE] Intent: ${intentResult.intent}, Time: ${executionTime}ms`);
        controller.close();

      } catch (error) {
        console.error('[STREAM ERROR]', error);
        controller.enqueue(encoder.encode(`event: error\ndata: ${JSON.stringify({ error: 'Stream processing error' })}\n\n`));
        controller.close();
      }
    }
  });

  return streamResponse(stream);
}


// ==================== RECOMMEND OPPORTUNITIES HANDLER ====================

const RECOMMEND_CONFIG = {
  MATCH_THRESHOLD: 0.20,
  MAX_RECOMMENDATIONS: 50,
  DEFAULT_LIMIT: 20
};

async function handleRecommendOpportunities(request: Request, env: Env): Promise<Response> {
  if (request.method !== 'POST') {
    return jsonResponse({ error: 'Method not allowed' }, 405);
  }

  const startTime = Date.now();

  let body: { studentId?: string; forceRefresh?: boolean; limit?: number };
  try {
    body = await request.json() as { studentId?: string; forceRefresh?: boolean; limit?: number };
  } catch {
    return jsonResponse({ error: 'Invalid JSON', recommendations: [] }, 400);
  }

  const { studentId, forceRefresh = false, limit = RECOMMEND_CONFIG.DEFAULT_LIMIT } = body;

  if (!studentId) {
    return jsonResponse({ error: 'studentId is required', recommendations: [] }, 400);
  }

  if (!isValidUUID(studentId)) {
    return jsonResponse({ error: 'Invalid studentId format', recommendations: [] }, 400);
  }

  if (!checkRateLimit(studentId)) {
    return jsonResponse({ error: 'Rate limit exceeded', recommendations: [] }, 429);
  }

  const safeLimit = Math.min(Math.max(1, limit), RECOMMEND_CONFIG.MAX_RECOMMENDATIONS);
  const supabase = createClient(env.VITE_SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY);

  // Get student profile
  const { data: student, error: studentError } = await supabase
    .from('students')
    .select('embedding, id, name, profile')
    .eq('id', studentId)
    .maybeSingle();

  if (studentError || !student) {
    return await getPopularFallback(supabase, studentId, safeLimit, startTime, 'no_profile');
  }

  if (!student.embedding) {
    return await getPopularFallback(supabase, studentId, safeLimit, startTime, 'no_embedding');
  }

  // Get dismissed opportunities
  const { data: dismissed } = await supabase
    .from('opportunity_interactions')
    .select('opportunity_id')
    .eq('student_id', studentId)
    .eq('action', 'dismiss');

  const dismissedIds = dismissed?.map(d => d.opportunity_id) || [];

  // Run enhanced matching
  const { data: recommendations, error: matchError } = await supabase.rpc('match_opportunities_enhanced', {
    query_embedding: student.embedding,
    student_id_param: studentId,
    dismissed_ids: dismissedIds,
    match_threshold: RECOMMEND_CONFIG.MATCH_THRESHOLD,
    match_count: RECOMMEND_CONFIG.MAX_RECOMMENDATIONS
  });

  if (matchError) {
    console.error('Match error:', matchError);
    return await getPopularFallback(supabase, studentId, safeLimit, startTime, 'match_error');
  }

  if (!recommendations || recommendations.length === 0) {
    return await getPopularFallback(supabase, studentId, safeLimit, startTime, 'no_matches');
  }

  const topRecommendations = recommendations.slice(0, safeLimit);
  const executionTime = Date.now() - startTime;

  return jsonResponse({
    recommendations: topRecommendations,
    cached: false,
    count: topRecommendations.length,
    totalMatches: recommendations.length,
    executionTime
  });
}

async function getPopularFallback(
  supabase: SupabaseClient,
  studentId: string,
  limit: number,
  startTime: number,
  reason: string
): Promise<Response> {
  try {
    const { data: popular, error } = await supabase.rpc('get_popular_opportunities', {
      student_id_param: studentId,
      limit_count: limit
    });

    if (error) throw error;

    const executionTime = Date.now() - startTime;
    return jsonResponse({
      recommendations: popular || [],
      fallback: true,
      reason,
      count: popular?.length || 0,
      executionTime
    });
  } catch (fallbackError) {
    console.error('Fallback failed:', fallbackError);
    const executionTime = Date.now() - startTime;
    return jsonResponse({
      recommendations: [],
      fallback: true,
      reason,
      count: 0,
      executionTime
    });
  }
}


// ==================== HANDLER: GENERATE EMBEDDING ====================

interface GenerateEmbeddingRequest {
  text: string;
  table: string;
  id: string;
  type?: 'opportunity' | 'student';
}

async function handleGenerateEmbedding(request: Request, env: Env): Promise<Response> {
  if (request.method !== 'POST') {
    return jsonResponse({ error: 'Method not allowed' }, 405);
  }

  let body: GenerateEmbeddingRequest;
  try {
    body = await request.json() as GenerateEmbeddingRequest;
  } catch {
    return jsonResponse({ success: false, error: 'Invalid JSON' }, 400);
  }

  const { text, table, id, type = 'opportunity' } = body;

  // Validate required parameters
  if (!text || !table || !id) {
    return jsonResponse({
      success: false,
      error: 'Missing required parameters: text, table, id'
    }, 400);
  }

  // Validate table name to prevent SQL injection (only allow specific tables)
  const allowedTables = ['opportunities', 'students', 'profiles', 'courses'];
  if (!allowedTables.includes(table)) {
    return jsonResponse({
      success: false,
      error: `Invalid table. Allowed tables: ${allowedTables.join(', ')}`
    }, 400);
  }

  // Validate ID format (UUID)
  if (!isValidUUID(id)) {
    return jsonResponse({
      success: false,
      error: 'Invalid id format. Must be a valid UUID.'
    }, 400);
  }

  console.log(`Generating embedding for ${type} #${id}`);

  try {
    // Use the embedding service (FREE Transformers.js on Render.com)
    const embeddingServiceUrl = env.EMBEDDING_SERVICE_URL || 'https://embedings.onrender.com';

    const embeddingResponse = await fetch(`${embeddingServiceUrl}/embed`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ text }),
    });

    if (!embeddingResponse.ok) {
      const errorText = await embeddingResponse.text();
      console.error('Embedding service error:', embeddingResponse.status, errorText);
      return jsonResponse({
        success: false,
        error: `Embedding service error: ${embeddingResponse.status} - ${errorText}`
      }, 500);
    }

    const { embedding } = await embeddingResponse.json() as { embedding: number[] };

    if (!embedding || !Array.isArray(embedding)) {
      return jsonResponse({
        success: false,
        error: 'Invalid embedding response from service'
      }, 500);
    }

    console.log(`Generated embedding with ${embedding.length} dimensions`);

    // Update the record in Supabase
    const supabase = createClient(env.VITE_SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY);

    const { error: updateError } = await supabase
      .from(table)
      .update({ embedding })
      .eq('id', id);

    if (updateError) {
      console.error('Supabase update error:', updateError);
      return jsonResponse({
        success: false,
        error: `Failed to update ${table}: ${updateError.message}`
      }, 500);
    }

    console.log(`✅ Successfully updated ${table} #${id} with embedding`);

    return jsonResponse({
      success: true,
      message: `Embedding generated for ${type} #${id}`,
      dimensions: embedding.length
    });

  } catch (error) {
    console.error('Error generating embedding:', error);
    return jsonResponse({
      success: false,
      error: (error as Error).message || 'Unknown error generating embedding'
    }, 500);
  }
}

// ==================== HANDLER: ANALYZE ASSESSMENT ====================

/**
 * Build the analysis prompt for Claude AI
 */
const buildAnalysisPrompt = (assessmentData: any) => {
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
      "highFit": [
        {"name": "<role 1>", "salary": {"min": <number in lakhs>, "max": <number in lakhs>}},
        {"name": "<role 2>", "salary": {"min": <number in lakhs>, "max": <number in lakhs>}},
        {"name": "<role 3>", "salary": {"min": <number in lakhs>, "max": <number in lakhs>}}
      ],
      "mediumFit": [
        {"name": "<role 1>", "salary": {"min": <number in lakhs>, "max": <number in lakhs>}},
        {"name": "<role 2>", "salary": {"min": <number in lakhs>, "max": <number in lakhs>}},
        {"name": "<role 3>", "salary": {"min": <number in lakhs>, "max": <number in lakhs>}}
      ],
      "exploreLater": [
        {"name": "<role 1>", "salary": {"min": <number in lakhs>, "max": <number in lakhs>}},
        {"name": "<role 2>", "salary": {"min": <number in lakhs>, "max": <number in lakhs>}}
      ]
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

6. SPECIFIC CAREER OPTIONS WITH SALARY - MANDATORY:
   - Each role in specificOptions (highFit, mediumFit, exploreLater) MUST be an object with:
     * name: The job role title (e.g., "Software Developer", "Data Analyst")
     * salary: Object with min and max values in Indian Lakhs per annum
   - Salary ranges should reflect realistic ENTRY-LEVEL salaries in the Indian job market (2024-2025)
   - Example salary ranges for fresh graduates:
     * Tech roles: 4-12 LPA (e.g., {"min": 4, "max": 12})
     * Business roles: 3-8 LPA (e.g., {"min": 3, "max": 8})
     * Creative roles: 3-7 LPA (e.g., {"min": 3, "max": 7})
     * Healthcare roles: 4-10 LPA (e.g., {"min": 4, "max": 10})
   - CRITICAL: Every role MUST have a salary object with numeric min and max values!

## SERIOUS CAREER GUIDANCE - JOB ROLE SELECTION (MANDATORY):

### PROFESSIONAL ENTRY-LEVEL ROLES BY DOMAIN (2024-2025 Indian Job Market):

**TECHNOLOGY & ENGINEERING:**
- Software Development: Junior Software Developer, Associate Software Engineer, Trainee Programmer, Graduate Software Engineer
- Data & Analytics: Junior Data Analyst, Associate Data Engineer, Business Intelligence Trainee, Analytics Associate
- AI/ML: Junior ML Engineer, AI Research Associate, Data Science Trainee, NLP Engineer Trainee
- Cloud & DevOps: Junior DevOps Engineer, Cloud Support Associate, Site Reliability Engineer Trainee, Infrastructure Analyst
- Cybersecurity: Junior Security Analyst, SOC Analyst, Information Security Associate, Vulnerability Assessment Trainee
- Quality Assurance: Junior QA Engineer, Test Analyst, Automation Test Engineer Trainee, Quality Assurance Associate
- Mobile/Web: Junior Mobile Developer, Frontend Developer Trainee, Full Stack Developer Associate, React/Angular Developer

**BUSINESS & MANAGEMENT:**
- Consulting: Junior Business Analyst, Management Trainee, Associate Consultant, Strategy Analyst
- Finance: Junior Financial Analyst, Investment Banking Analyst, Credit Analyst, Risk Analyst Trainee
- Operations: Operations Analyst, Supply Chain Trainee, Process Associate, Logistics Coordinator
- Marketing: Junior Marketing Executive, Digital Marketing Associate, Brand Executive, Market Research Analyst
- Sales: Business Development Associate, Inside Sales Executive, Key Account Trainee, Sales Analyst
- HR: HR Executive Trainee, Talent Acquisition Associate, HR Operations Analyst, Recruitment Coordinator

**CREATIVE & DESIGN:**
- UX/UI: Junior UX Designer, UI Designer Trainee, Product Designer Associate, Interaction Designer
- Graphic Design: Junior Graphic Designer, Visual Designer, Brand Designer Trainee, Motion Graphics Artist
- Content: Content Writer, Technical Writer, Copywriter Trainee, Content Strategist Associate
- Media: Junior Video Editor, Social Media Executive, Digital Content Creator, Multimedia Designer

**HEALTHCARE & LIFE SCIENCES:**
- Clinical: Junior Clinical Research Associate, Medical Coder, Healthcare Data Analyst, Pharmacovigilance Associate
- Biotech: Junior Research Scientist, Lab Analyst, Biotech Research Associate, Quality Control Analyst
- Healthcare IT: Healthcare IT Analyst, Medical Informatics Trainee, EHR Implementation Associate

**LEGAL & COMPLIANCE:**
- Legal: Junior Legal Associate, Legal Research Analyst, Contract Analyst, Compliance Associate
- Regulatory: Regulatory Affairs Associate, Quality Compliance Trainee, Audit Associate

### ROLE SELECTION RULES:
1. ALL roles MUST be ENTRY-LEVEL (0-2 years experience) - NO senior/lead/manager positions
2. PERSONALIZE based on RIASEC profile:
   - R (Realistic): Technical, hands-on roles (DevOps, QA, Network Engineer)
   - I (Investigative): Research, analytical roles (Data Scientist, Research Analyst, Financial Analyst)
   - A (Artistic): Creative, design roles (UX Designer, Content Strategist, Brand Designer)
   - S (Social): People-focused roles (HR, Customer Success, Training Coordinator)
   - E (Enterprising): Business, leadership roles (Business Development, Sales, Product Associate)
   - C (Conventional): Structured, detail roles (Compliance, Quality Analyst, Operations)
3. MATCH to student's STREAM:
   - CS/IT/Engineering → Technology roles
   - BBA/MBA/Commerce → Business/Finance roles
   - Design/Animation → Creative roles
   - Science/Biotech → Research/Healthcare roles
   - Arts/Humanities → Content/HR/Legal roles
4. Include MIX of: Traditional + Emerging + Remote-friendly roles
5. AVOID: Generic titles, outdated roles, unrealistic positions for freshers

7. SKILL GAP - MANDATORY:
   - priorityA: Must have at least 2 skills with all fields (skill, currentLevel, targetLevel, whyNeeded, howToBuild)
   - priorityB: Must have at least 2 skills
   - learningTracks: Must have at least 2 tracks with all fields

8. ROADMAP - MANDATORY:
   - projects: Must have at least 2 projects with title, purpose, and output
   - internship.types: Must have at least 2 internship types
   - internship.preparation: Must have resume, portfolio, and interview fields filled
   - exposure.activities: Must have at least 2 activities
   - exposure.certifications: Must have at least 2 certifications

9. Be specific to their stream (${assessmentData.stream}) when recommending careers, roles, and skills.

10. Provide actionable, encouraging, and SPECIFIC career guidance - avoid generic responses.

11. ALL arrays must contain actual data - NO empty arrays allowed!`;
};

async function handleAnalyzeAssessment(request: Request, env: Env): Promise<Response> {
  if (request.method !== 'POST') {
    return jsonResponse({ error: 'Method not allowed' }, 405);
  }

  // Authentication
  const auth = await authenticateUser(request, env);
  if (!auth) {
    return jsonResponse({ error: 'Authentication required' }, 401);
  }

  const { user } = auth;
  const studentId = user.id;

  // Rate limiting
  if (!checkRateLimit(studentId)) {
    return jsonResponse({ error: 'Rate limit exceeded' }, 429);
  }

  let body;
  try {
    body = await request.json() as { assessmentData: any };
  } catch {
    return jsonResponse({ error: 'Invalid JSON' }, 400);
  }

  const { assessmentData } = body;

  if (!assessmentData) {
    return jsonResponse({ error: 'Assessment data is required' }, 400);
  }

  const prompt = buildAnalysisPrompt(assessmentData);

  try {
    const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${getOpenRouterKey(env)}`,
        'Content-Type': 'application/json',
        'HTTP-Referer': env.VITE_SUPABASE_URL || '',
        'X-Title': 'Assessment Analyzer'
      },
      body: JSON.stringify({
        model: 'openai/gpt-4o-mini',
        messages: [
          {
            role: 'system',
            content: 'You are an expert career counselor and psychometric analyst. You provide detailed, deterministic, and consistent career analysis based on assessment data.'
          },
          {
            role: 'user',
            content: prompt
          }
        ],
        temperature: 0.1,
        max_tokens: 4096  // Reduced from 8192 to fit within credit limits
      })
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('[ASSESSMENT AI ERROR]', response.status, errorText);
      // Parse error for better message
      let errorMessage = `AI service error: ${response.status}`;
      try {
        const errorJson = JSON.parse(errorText);
        if (errorJson.error?.message) {
          errorMessage = errorJson.error.message;
        } else if (errorJson.error?.code) {
          errorMessage = `${errorJson.error.code}: ${response.status}`;
        }
      } catch {
        // Use raw error text if not JSON
        if (response.status === 402) {
          errorMessage = 'OpenRouter API credits exhausted. Please add funds at https://openrouter.ai/credits';
        }
      }
      return jsonResponse({ error: `AI service error: ${errorMessage}` }, 500);
    }

    const data = await response.json() as any;
    const content = data.choices?.[0]?.message?.content;

    if (!content) {
      return jsonResponse({ error: 'Empty response from AI' }, 500);
    }

    // Clean up response
    const jsonMatch = content.match(/```json\n?([\s\S]*?)\n?```/) || content.match(/\{[\s\S]*\}/);

    if (!jsonMatch) {
      return jsonResponse({ error: 'Invalid response format from AI' }, 500);
    }

    const jsonStr = jsonMatch[1] || jsonMatch[0];
    let parsedResults;

    try {
      parsedResults = JSON.parse(jsonStr);
    } catch (e) {
      console.error('JSON Parse Error:', e);
      return jsonResponse({ error: 'Failed to parse AI response' }, 500);
    }

    return jsonResponse({ success: true, data: parsedResults });

  } catch (error) {
    console.error('Assessment analysis error:', error);
    return jsonResponse({ error: (error as Error).message }, 500);
  }
}

// ==================== HANDLER: PARSE RESUME ====================

async function handleParseResume(request: Request, env: Env): Promise<Response> {
  if (request.method !== 'POST') {
    return jsonResponse({ error: 'Method not allowed' }, 405);
  }

  // Authentication
  const auth = await authenticateUser(request, env);
  if (!auth) {
    return jsonResponse({ error: 'Authentication required' }, 401);
  }

  const { user } = auth;
  const studentId = user.id;

  // Rate limiting
  if (!checkRateLimit(studentId)) {
    return jsonResponse({ error: 'Rate limit exceeded' }, 429);
  }

  let body;
  try {
    body = await request.json() as { resumeText: string };
  } catch {
    return jsonResponse({ error: 'Invalid JSON' }, 400);
  }

  const { resumeText } = body;

  if (!resumeText || typeof resumeText !== 'string' || resumeText.length < 50) {
    return jsonResponse({ error: 'Valid resume text is required' }, 400);
  }

  const prompt = `Extract information from this resume and return ONLY a valid JSON object.

CRITICAL RULES:
- name: Extract ONLY the person's full name (2-4 words)
- DO NOT dump entire resume text into any single field
- Parse each section into separate array items with unique IDs
- Return ONLY the JSON object, no markdown formatting or backticks

Return ONLY the JSON object with this structure:
{
  "name": "",
  "email": "",
  "contact_number": "",
  "college_school_name": "",
  "university": "",
  "branch_field": "",
  "education": [{"id": 1, "degree": "", "department": "", "university": "", "yearOfPassing": "", "cgpa": "", "level": "Bachelor's", "status": "completed"}],
  "experience": [{"id": 1, "organization": "", "role": "", "duration": "", "description": "", "verified": false}],
  "projects": [{"id": 1, "title": "", "description": "", "technologies": [], "link": "", "status": "Completed"}],
  "technicalSkills": [{"id": 1, "name": "", "category": "", "level": 3, "verified": false}],
  "softSkills": [{"id": 1, "name": "", "level": 3}],
  "certificates": [{"id": 1, "title": "", "issuer": "", "issuedOn": "", "credentialId": "", "link": ""}],
  "training": []
}

Resume Text:
"""
${resumeText.slice(0, 15000)}
"""
`;

  try {
    const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${getOpenRouterKey(env)}`,
        'Content-Type': 'application/json',
        'HTTP-Referer': env.VITE_SUPABASE_URL || '',
        'X-Title': 'Resume Parser'
      },
      body: JSON.stringify({
        model: 'openai/gpt-4o-mini',
        messages: [
          {
            role: 'system',
            content: 'You are an expert resume parser. You extract structured data from resume text with high accuracy. You always return valid JSON.'
          },
          {
            role: 'user',
            content: prompt
          }
        ],
        temperature: 0.1,
        max_tokens: 4096
      })
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('[AI ERROR]', response.status, errorText);
      return jsonResponse({ error: `AI service error: ${response.status}` }, 500);
    }

    const data = await response.json() as any;
    const content = data.choices?.[0]?.message?.content;

    if (!content) {
      return jsonResponse({ error: 'Empty response from AI' }, 500);
    }

    // Clean up response (remove markdown code blocks if present)
    const jsonStr = content.replace(/```json\n?|\n?```/g, '').trim();

    let parsedData;
    try {
      parsedData = JSON.parse(jsonStr);
    } catch (e) {
      console.error('JSON Parse Error:', e);
      return jsonResponse({ error: 'Failed to parse AI response' }, 500);
    }

    return jsonResponse({ success: true, data: parsedData });

  } catch (error) {
    console.error('Resume parsing error:', error);
    return jsonResponse({ error: (error as Error).message }, 500);
  }
}


// ==================== MAIN HANDLER ====================

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
      return jsonResponse({ error: 'Server configuration error' }, 500);
    }

    try {
      // Route requests
      if (path === '/chat' || path === '/career-ai-chat') {
        if (!getOpenRouterKey(env)) {
          return jsonResponse({ error: 'AI service not configured' }, 500);
        }
        return await handleCareerChat(request, env);
      }

      if (path === '/recommend-opportunities' || path === '/recommend') {
        return await handleRecommendOpportunities(request, env);
      }

      if (path === '/analyze-assessment') {
        if (!getOpenRouterKey(env)) {
          return jsonResponse({ error: 'AI service not configured' }, 500);
        }
        return await handleAnalyzeAssessment(request, env);
      }

      if (path === '/generate-embedding') {
        return await handleGenerateEmbedding(request, env);
      }

      if (path === '/parse-resume') {
        if (!getOpenRouterKey(env)) {
          return jsonResponse({ error: 'AI service not configured' }, 500);
        }
        return await handleParseResume(request, env);
      }

      // Health check
      if (path === '/health' || path === '/') {
        return jsonResponse({
          status: 'ok',
          service: 'career-api',
          version: '2.0-cloudflare',
          endpoints: ['/chat', '/recommend-opportunities', '/analyze-assessment', '/generate-embedding', '/parse-resume'],
          timestamp: new Date().toISOString()
        });
      }

      return jsonResponse({ 
        error: 'Not found', 
        availableEndpoints: ['/chat', '/recommend-opportunities', '/analyze-assessment', '/generate-embedding', '/parse-resume'] 
      }, 404);

    } catch (error) {
      console.error('[ERROR] career-api:', error);
      return jsonResponse({ error: (error as Error)?.message || 'Internal server error' }, 500);
    }
  }
};
