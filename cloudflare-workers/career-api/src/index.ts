/**
 * Career API Cloudflare Worker
 * Converted from Supabase Edge Functions
 * 
 * Endpoints:
 * - /chat - Career AI chat with streaming
 * - /recommend-opportunities - Get job recommendations
 */

import { createClient, SupabaseClient } from '@supabase/supabase-js';
import type { Env, StoredMessage, ChatRequest, Opportunity, CareerIntent } from './types/career-ai';
import { corsHeaders, jsonResponse, streamResponse } from './utils/cors';
import { authenticateUser, sanitizeInput, generateConversationTitle, isValidUUID } from './utils/auth';
import { checkRateLimit } from './utils/rate-limit';

// AI modules
import { detectIntent } from './ai/intent-detection';
import { getConversationPhase, getPhaseParameters } from './ai/conversation-phase';
import { runGuardrails, validateResponse, getBlockedResponse } from './ai/guardrails';
import { compressContext, buildMemoryContext } from './ai/memory';
import { buildEnhancedSystemPrompt } from './ai/prompts/enhanced-system-prompt';

// Context builders
import { buildStudentContext } from './context/student';
import { buildAssessmentContext } from './context/assessment';
import { buildCareerProgressContext } from './context/progress';
import { buildCourseContext } from './context/courses';
import { fetchOpportunities } from './context/opportunities';

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
            'Authorization': `Bearer ${env.VITE_OPENROUTER_API_KEY}`,
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
        if (!env.VITE_OPENROUTER_API_KEY) {
          return jsonResponse({ error: 'AI service not configured' }, 500);
        }
        return await handleCareerChat(request, env);
      }

      if (path === '/recommend-opportunities' || path === '/recommend') {
        return await handleRecommendOpportunities(request, env);
      }

      // Health check
      if (path === '/health' || path === '/') {
        return jsonResponse({
          status: 'ok',
          service: 'career-api',
          version: '2.0-cloudflare',
          endpoints: ['/chat', '/recommend-opportunities'],
          timestamp: new Date().toISOString()
        });
      }

      return jsonResponse({ 
        error: 'Not found', 
        availableEndpoints: ['/chat', '/recommend-opportunities'] 
      }, 404);

    } catch (error) {
      console.error('[ERROR] career-api:', error);
      return jsonResponse({ error: (error as Error)?.message || 'Internal server error' }, 500);
    }
  }
};
