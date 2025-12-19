// Career AI Chat - Production Ready Handler v2.0
// Modern AI Agent with ReAct pattern and enhanced prompting

import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from 'npm:@supabase/supabase-js@2.38.4';

// Import shared modules
import { corsHeaders } from '../_shared/utils/cors.ts';
import { authenticateUser } from '../_shared/utils/auth.ts';
import type { ChatRequest, StoredMessage, Opportunity } from '../_shared/types/career-ai.ts';
import { detectIntentV2 } from '../_shared/ai/intent-detection-v2.ts';
import { getConversationPhase, getPhaseParameters } from '../_shared/ai/conversation-phase.ts';
import { buildStudentContext } from '../_shared/context/student.ts';
import { buildAssessmentContext } from '../_shared/context/assessment.ts';
import { buildCareerProgressContext } from '../_shared/context/progress.ts';
import { buildCourseContext } from '../_shared/context/courses.ts';
import { fetchOpportunities } from '../_shared/context/opportunities.ts';
import { buildEnhancedSystemPrompt } from '../_shared/ai/prompts/enhanced-system-prompt.ts';
// Safety guardrails
import { runGuardrails, validateResponse, getBlockedResponse } from '../_shared/ai/guardrails.ts';
// Conversation memory management
import { compressContext, buildMemoryContext } from '../_shared/ai/memory.ts';

// Rate limiting cache (in-memory for edge function)
const rateLimitCache = new Map<string, { count: number; resetAt: number }>();
const RATE_LIMIT = 30; // requests per minute
const RATE_WINDOW = 60000; // 1 minute

function checkRateLimit(userId: string): boolean {
  const now = Date.now();
  const userLimit = rateLimitCache.get(userId);
  
  if (!userLimit || now > userLimit.resetAt) {
    rateLimitCache.set(userId, { count: 1, resetAt: now + RATE_WINDOW });
    return true;
  }
  
  if (userLimit.count >= RATE_LIMIT) {
    return false;
  }
  
  userLimit.count++;
  return true;
}

function generateConversationTitle(message: string): string {
  const cleaned = message.replace(/[^\w\s]/g, '').trim();
  return cleaned.length > 50 ? cleaned.slice(0, 47) + '...' : cleaned;
}

// Sanitize user input
function sanitizeInput(input: string): string {
  return input
    .replace(/<[^>]*>/g, '') // Remove HTML tags
    .replace(/[<>]/g, '') // Remove angle brackets
    .trim()
    .slice(0, 2000); // Limit length
}

// Main handler
Deno.serve(async (req: Request) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  const startTime = Date.now();

  try {
    // Environment validation
    const SUPABASE_URL = Deno.env.get('SUPABASE_URL');
    const SUPABASE_ANON_KEY = Deno.env.get('SUPABASE_ANON_KEY');
    const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');
    const OPENROUTER_API_KEY = Deno.env.get('OPENROUTER_API_KEY') || Deno.env.get('OPENAI_API_KEY');

    if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
      console.error('[ERROR] Missing Supabase environment variables');
      return errorResponse('Server configuration error', 500);
    }

    if (!OPENROUTER_API_KEY) {
      console.error('[ERROR] Missing AI API key');
      return errorResponse('AI service not configured', 500);
    }

    // Authentication
    const authHeader = req.headers.get('Authorization');
    const user = await authenticateUser(authHeader, SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

    if (!user) {
      return errorResponse('Authentication required. Please log in again.', 401);
    }

    const studentId = user.id;

    // Rate limiting
    if (!checkRateLimit(studentId)) {
      return errorResponse('Too many requests. Please wait a moment.', 429);
    }

    // Create Supabase clients
    const supabaseAdmin = SUPABASE_SERVICE_ROLE_KEY 
      ? createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY)
      : null;
    
    const supabaseUser = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
      global: { headers: { Authorization: authHeader! } },
    });
    
    const dbClient = supabaseAdmin || supabaseUser;

    // Parse and validate request
    const body = await req.json();
    const { conversationId, message, selectedChips = [] }: ChatRequest = body;
    
    if (!message || typeof message !== 'string') {
      return errorResponse('Message is required', 400);
    }

    const sanitizedMessage = sanitizeInput(message);
    if (!sanitizedMessage) {
      return errorResponse('Invalid message', 400);
    }

    // Run safety guardrails (prompt injection, harmful content, PII redaction)
    const guardrailResult = runGuardrails(sanitizedMessage);
    if (!guardrailResult.passed) {
      console.log(`[GUARDRAIL] Blocked: ${guardrailResult.flags.join(', ')}`);
      return new Response(
        JSON.stringify({ 
          blocked: true, 
          message: getBlockedResponse(guardrailResult.flags[0] || 'default')
        }), 
        { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }
    
    // Use sanitized input (with PII redacted if any)
    const processedMessage = guardrailResult.sanitizedInput || sanitizedMessage;
    if (guardrailResult.flags.length > 0) {
      console.log(`[GUARDRAIL] Flags: ${guardrailResult.flags.join(', ')}`);
    }

    console.log(`[REQUEST] studentId: ${studentId}, convId: ${conversationId || 'new'}, msg: "${processedMessage.slice(0, 50)}..."`);

    // Fetch existing conversation
    let currentConversationId = conversationId;
    let existingMessages: StoredMessage[] = [];

    if (conversationId) {
      const { data: conversation, error: convError } = await supabaseUser
        .from('career_ai_conversations')
        .select('messages')
        .eq('id', conversationId)
        .eq('student_id', studentId)
        .single();

      if (!convError && conversation) {
        existingMessages = conversation.messages || [];
      }
    }

    // Determine conversation phase and intent
    const messageCount = existingMessages.length;
    const conversationPhase = getConversationPhase(messageCount);
    const intentResult = detectIntentV2(sanitizedMessage, selectedChips, existingMessages);
    const phaseParams = getPhaseParameters(conversationPhase, intentResult.intent);
    
    console.log(`[ANALYSIS] Phase: ${conversationPhase} | Intent: ${intentResult.intent} (${intentResult.confidence}) | Score: ${intentResult.score}`);

    // Build context in parallel for performance
    // Use dbClient (admin) for assessment to bypass RLS if needed
    console.log('[CONTEXT] Building student context...');
    const [studentProfile, assessmentContext, progressContext, courseContext] = await Promise.all([
      buildStudentContext(supabaseUser, studentId),
      buildAssessmentContext(dbClient, studentId),  // Use admin client for assessment
      buildCareerProgressContext(supabaseUser, studentId),
      buildCourseContext(supabaseUser, studentId)
    ]);

    if (!studentProfile) {
      return errorResponse('Unable to load student profile', 500);
    }

    console.log(`[CONTEXT] Profile: ${studentProfile.name}, Skills: ${studentProfile.technicalSkills.length}, Courses: ${courseContext.totalEnrolled}`);

    // Fetch opportunities for relevant intents
    let opportunities: Opportunity[] = [];
    const jobRelatedIntents = ['find-jobs', 'skill-gap', 'career-guidance', 'application-status'];
    if (jobRelatedIntents.includes(intentResult.intent)) {
      opportunities = await fetchOpportunities(supabaseUser, 50);
      console.log(`[CONTEXT] Fetched ${opportunities.length} opportunities`);
    }

    // Build enhanced system prompt
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

    // Build conversation history with memory compression for long conversations
    let memoryContext = '';
    let recentMessages = existingMessages;
    
    if (existingMessages.length > 10) {
      // Compress context for long conversations
      const compressed = compressContext(existingMessages, 10);
      recentMessages = compressed.recentMessages;
      memoryContext = buildMemoryContext(compressed);
      console.log(`[MEMORY] Compressed ${existingMessages.length} messages, memory: ${memoryContext.length} chars`);
    } else {
      recentMessages = existingMessages.slice(-10);
    }
    
    // Build AI messages with optional memory context
    const systemPromptWithMemory = memoryContext 
      ? `${systemPrompt}\n\n${memoryContext}` 
      : systemPrompt;
    
    const aiMessages = [
      { role: 'system', content: systemPromptWithMemory },
      ...recentMessages.map(m => ({ role: m.role, content: m.content })),
      { role: 'user', content: processedMessage }
    ];

    // Stream AI response
    return await streamAIResponse({
      openRouterKey: OPENROUTER_API_KEY,
      supabaseUrl: SUPABASE_URL,
      aiMessages,
      phaseParams,
      dbClient,
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

  } catch (error) {
    console.error('[ERROR] career-ai-chat:', error);
    return errorResponse((error as Error)?.message || 'Internal server error', 500);
  }
});

// Error response helper
function errorResponse(message: string, status: number): Response {
  return new Response(
    JSON.stringify({ error: message }), 
    { status, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
  );
}

// Stream AI response with SSE
interface StreamParams {
  openRouterKey: string;
  supabaseUrl: string;
  aiMessages: any[];
  phaseParams: any;
  dbClient: any;
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

async function streamAIResponse(params: StreamParams): Promise<Response> {
  const {
    openRouterKey, supabaseUrl, aiMessages, phaseParams,
    dbClient, studentId, existingMessages, userMessage,
    currentConversationId, message, intentResult, 
    conversationPhase, assessmentContext, startTime
  } = params;

  const encoder = new TextEncoder();
  let fullResponse = '';
  let convId = currentConversationId;

  const stream = new ReadableStream({
    async start(controller) {
      try {
        // Call OpenRouter API
        const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${openRouterKey}`,
            'Content-Type': 'application/json',
            'HTTP-Referer': supabaseUrl,
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

        // Process stream
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

        // Validate AI response before saving
        const responseValidation = validateResponse(fullResponse);
        if (!responseValidation.passed) {
          console.log(`[RESPONSE VALIDATION] Failed: ${responseValidation.flags.join(', ')}`);
          // Don't block, just log - the response is already streamed
        }
        if (responseValidation.flags.length > 0) {
          console.log(`[RESPONSE FLAGS] ${responseValidation.flags.join(', ')}`);
        }

        // Save conversation to database
        const assistantMessage: StoredMessage = {
          id: userMessage.id,
          role: 'assistant',
          content: fullResponse,
          timestamp: new Date().toISOString()
        };

        const updatedMessages = [...existingMessages, userMessage, assistantMessage];

        if (dbClient) {
          try {
            if (convId) {
              await dbClient.from('career_ai_conversations')
                .update({ 
                  messages: updatedMessages, 
                  updated_at: new Date().toISOString() 
                })
                .eq('id', convId)
                .eq('student_id', studentId);
              console.log(`[DB] Updated conversation: ${convId}`);
            } else {
              const title = generateConversationTitle(message);
              const { data: newConv } = await dbClient.from('career_ai_conversations')
                .insert({ 
                  student_id: studentId, 
                  title: title.slice(0, 255), 
                  messages: updatedMessages 
                })
                .select('id')
                .single();
              
              if (newConv) {
                convId = newConv.id;
                console.log(`[DB] Created conversation: ${convId}`);
              }
            }
          } catch (dbError) {
            console.error('[DB ERROR]', dbError);
          }
        }

        // Send completion event with metadata
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
        
        console.log(`[COMPLETE] Intent: ${intentResult.intent}, Time: ${executionTime}ms, Response: ${fullResponse.length} chars`);
        controller.close();

      } catch (error) {
        console.error('[STREAM ERROR]', error);
        controller.enqueue(encoder.encode(`event: error\ndata: ${JSON.stringify({ error: 'Stream processing error' })}\n\n`));
        controller.close();
      }
    }
  });

  return new Response(stream, {
    headers: { 
      ...corsHeaders, 
      'Content-Type': 'text/event-stream', 
      'Cache-Control': 'no-cache', 
      'Connection': 'keep-alive' 
    }
  });
}
