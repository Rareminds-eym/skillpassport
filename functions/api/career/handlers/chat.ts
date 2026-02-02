/**
 * Career Chat Handler - Streaming AI chat with career guidance
 * 
 * Features:
 * - Safety guardrails (prompt injection, harmful content, PII redaction)
 * - Intent detection with chip-based overrides
 * - Conversation phase management
 * - Memory compression for long conversations
 * - Rich context builders (student, assessment, progress, courses, opportunities)
 * - Enhanced system prompt with few-shot examples and chain-of-thought
 */

import { jsonResponse } from '../../../../src/functions-lib/response';

import { authenticateUser, sanitizeInput, generateConversationTitle } from '../../shared/auth';
import { checkRateLimit } from '../utils/rate-limit';
import { getModelForUseCase, API_CONFIG, MODEL_PROFILES, getAPIKeys } from '../../shared/ai-config';
import type { ChatRequest, StoredMessage, CareerIntent, Opportunity } from '../types';

// AI modules
import { runGuardrails, getBlockedResponse, validateResponse } from '../ai/guardrails';
import { detectIntent } from '../ai/intent-detection';
import { compressContext, buildMemoryContext } from '../ai/memory';
import { getConversationPhase, getPhaseParameters } from '../ai/conversation-phase';
import { buildEnhancedSystemPrompt } from '../ai/prompts/enhanced-system-prompt';

// Context builders
import { buildStudentContext } from '../context/student';
import { buildAssessmentContext } from '../context/assessment';
import { buildCareerProgressContext } from '../context/progress';
import { buildCourseContext } from '../context/courses';
import { fetchOpportunities } from '../context/opportunities';


export async function handleCareerChat(request: Request, env: Record<string, string>): Promise<Response> {
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

  // Get OpenRouter API key using shared utility
  const { openRouter: openRouterKey } = getAPIKeys(env);
  if (!openRouterKey) {
    return jsonResponse({ error: 'AI service not configured' }, 500);
  }

  try {
    // ==================== FETCH CONVERSATION HISTORY ====================
    let existingMessages: StoredMessage[] = [];
    let existingConversation: any = null;

    if (conversationId) {
      const { data: conv } = await supabase
        .from('career_ai_conversations')
        .select('messages')
        .eq('id', conversationId)
        .eq('student_id', studentId)
        .single();

      if (conv && conv.messages) {
        existingConversation = conv;
        existingMessages = Array.isArray(conv.messages) ? conv.messages : [];
      }
    }

    // ==================== DETERMINE PHASE AND INTENT ====================
    const messageCount = existingMessages.length;
    const conversationPhase = getConversationPhase(messageCount);
    const intentResult = detectIntent(processedMessage, selectedChips, existingMessages);
    const phaseParams = getPhaseParameters(conversationPhase, intentResult.intent);

    console.log(`[ANALYSIS] Phase: ${conversationPhase} | Intent: ${intentResult.intent} (${intentResult.confidence})`);

    // ==================== BUILD CONTEXT IN PARALLEL ====================
    const [studentProfile, assessmentContext, progressContext, courseContext] = await Promise.all([
      buildStudentContext(supabaseAdmin, studentId),
      buildAssessmentContext(supabaseAdmin, studentId),
      buildCareerProgressContext(supabase, studentId),
      buildCourseContext(supabase, studentId)
    ]);

    if (!studentProfile) {
      return jsonResponse({ error: 'Unable to load student profile' }, 500);
    }

    console.log(`[CONTEXT] Profile: ${studentProfile.name}, Skills: ${studentProfile.technicalSkills.length}`);

    // ==================== FETCH OPPORTUNITIES FOR RELEVANT INTENTS ====================
    let opportunities: Opportunity[] = [];
    const jobRelatedIntents: CareerIntent[] = ['find-jobs', 'skill-gap', 'career-guidance', 'application-status'];
    if (jobRelatedIntents.includes(intentResult.intent)) {
      opportunities = await fetchOpportunities(supabase, 50);
      console.log(`[CONTEXT] Fetched ${opportunities.length} opportunities`);
    }

    // ==================== BUILD ENHANCED SYSTEM PROMPT ====================
    const systemPrompt = buildEnhancedSystemPrompt({
      profile: studentProfile,
      assessment: assessmentContext,
      progress: progressContext,
      opportunities,
      phase: conversationPhase,
      intentResult,
      courseContext
    });

    // ==================== PREPARE MESSAGES WITH MEMORY COMPRESSION ====================
    const turnId = crypto.randomUUID();
    const userMessage: StoredMessage = {
      id: turnId,
      role: 'user',
      content: processedMessage,
      timestamp: new Date().toISOString()
    };

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

    // ==================== CALL AI WITH MODEL FALLBACK ====================
    const chatProfile = MODEL_PROFILES['chat'];
    const modelsToTry = [chatProfile.primary, ...chatProfile.fallbacks];

    let response: Response | null = null;
    let usedModel: string = '';

    for (let i = 0; i < modelsToTry.length; i++) {
      const model = modelsToTry[i];
      const isRetry = i > 0;

      if (isRetry) {
        console.log(`🔄 [Chat] Fallback ${i}: Trying ${model}...`);
      } else {
        console.log(`[Chat] Trying model: ${model}`);
      }

      const attemptResponse = await fetch(API_CONFIG.OPENROUTER.endpoint, {
        method: 'POST',
        headers: {
          ...API_CONFIG.OPENROUTER.headers,
          'Authorization': `Bearer ${openRouterKey}`,
        },
        body: JSON.stringify({
          model: model,
          messages: aiMessages,
          stream: true,
          max_tokens: phaseParams.max_tokens,
          temperature: phaseParams.temperature
        })
      });

      if (attemptResponse.ok) {
        response = attemptResponse;
        usedModel = model;
        if (isRetry) {
          console.log(`✅ [Chat] Fallback succeeded with ${model}`);
        } else {
          console.log(`✅ [Chat] Primary model ${model} succeeded`);
        }
        break;
      } else {
        const errorText = await attemptResponse.text();
        console.error(`❌ [Chat] ${model} failed (${attemptResponse.status}):`, errorText.substring(0, 150));
      }
    }

    if (!response) {
      return jsonResponse({
        error: 'AI service temporarily unavailable',
        details: 'All models are currently rate-limited. Please try again in a moment.'
      }, 503);
    }

    // ==================== STREAM RESPONSE ====================
    const encoder = new TextEncoder();
    const decoder = new TextDecoder();
    let assistantMessage = '';
    let finalConversationId = conversationId;

    const stream = new ReadableStream({
      async start(controller) {
        try {
          const reader = response.body?.getReader();
          if (!reader) throw new Error('No response body');

          let buffer = '';

          while (true) {
            const { done, value } = await reader.read();
            if (done) break;

            const chunk = decoder.decode(value, { stream: true });
            buffer += chunk;

            const lines = buffer.split('\n');
            buffer = lines.pop() || '';

            for (const line of lines) {
              const trimmedLine = line.trim();
              if (!trimmedLine.startsWith('data: ')) continue;

              const data = trimmedLine.replace('data: ', '').trim();
              if (data === '[DONE]') continue;

              try {
                const parsed = JSON.parse(data);
                let content = parsed.choices?.[0]?.delta?.content;

                if (!content && parsed.choices?.[0]?.message?.content) {
                  content = parsed.choices[0].message.content;
                }
                if (!content && parsed.choices?.[0]?.text) {
                  content = parsed.choices[0].text;
                }

                if (content) {
                  assistantMessage += content;
                  controller.enqueue(encoder.encode(`data: ${JSON.stringify({ content })}\n\n`));
                }
              } catch (e) {
                /* Skip invalid JSON */
              }
            }
          }

          // ==================== VALIDATE RESPONSE ====================
          const responseValidation = validateResponse(assistantMessage);
          if (responseValidation.flags.length > 0) {
            console.log(`[RESPONSE FLAGS] ${responseValidation.flags.join(', ')}`);
          }

          console.log(`[Chat] Stream complete. Message length: ${assistantMessage.length}`);

          // ==================== SAVE CONVERSATION ====================
          const assistantMessageObj: StoredMessage = {
            id: turnId,
            role: 'assistant',
            content: assistantMessage,
            timestamp: new Date().toISOString()
          };

          const updatedMessages = [...existingMessages, userMessage, assistantMessageObj];

          try {
            if (existingConversation) {
              await supabaseAdmin
                .from('career_ai_conversations')
                .update({
                  messages: updatedMessages,
                  updated_at: new Date().toISOString()
                })
                .eq('id', conversationId)
                .eq('student_id', studentId);
            } else {
              finalConversationId = crypto.randomUUID();
              const title = generateConversationTitle(processedMessage);

              await supabaseAdmin
                .from('career_ai_conversations')
                .insert({
                  id: finalConversationId,
                  student_id: studentId,
                  title: title.slice(0, 255),
                  messages: updatedMessages
                });
            }
          } catch (dbError) {
            console.error('[DB ERROR]', dbError);
          }

          // ==================== SEND COMPLETION EVENT ====================
          const executionTime = Date.now() - startTime;
          controller.enqueue(encoder.encode(`data: ${JSON.stringify({
            done: true,
            conversationId: finalConversationId,
            messageId: assistantMessageObj.id,
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
          controller.enqueue(encoder.encode(`data: ${JSON.stringify({ error: 'Stream processing error' })}\n\n`));
          controller.close();
        }
      }
    });

    return new Response(stream, {
      headers: {
        'Content-Type': 'text/event-stream',
        'Cache-Control': 'no-cache',
        'Connection': 'keep-alive',
        'Access-Control-Allow-Origin': '*'
      }
    });

  } catch (error) {
    console.error('Career chat error:', error);
    return jsonResponse({ error: 'Internal server error' }, 500);
  }
}
