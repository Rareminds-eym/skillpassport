/**
 * AI Tutor Chat Handler
 * 
 * Implements streaming AI tutor chat with:
 * - Conversation phases (opening, exploring, deep_dive)
 * - Course context integration
 * - Message history management
 * - Database persistence
 * - Title generation for new conversations
 */

import type { AuthenticatedContext } from '@rareminds-eym/auth-core';
import { createSupabaseAdminClient } from '../../../../src/functions-lib/supabase';
import { jsonResponse } from '../../../../src/functions-lib/response';
import type { PagesEnv } from '../../../../src/functions-lib/types';
import { getServiceClient } from '../../../lib/auth';
import { getAPIKeys, API_CONFIG, AI_MODELS } from '../../shared/ai-config';
import type { WorksheetConfig } from '../types/worksheet';
import type { LessonPlanConfig } from '../../../../src/features/ai-tutor/types/lesson-plan';
import {
  buildCourseContext,
  buildSystemPrompt
} from '../utils/course-context';
import {
  getConversationPhase,
  getPhaseParameters
} from '../utils/conversation-phases';
import { buildLessonPlanPrompt } from '../utils/lesson-plan-templates';
import { hasReachedLimit, incrementGenerationCount } from '../utils/generation-limit';
import { getLogger } from '../../../../src/shared/config/logging';

const logger = getLogger('ai-tutor-chat');

// ==================== TYPES ====================

interface RequiredEnv {
  SUPABASE_URL: string;
  SUPABASE_SERVICE_ROLE_KEY: string;
}

type TypedContext = AuthenticatedContext<PagesEnv> & { env: RequiredEnv };

interface StoredMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: string;
}

interface OpenRouterResponse {
  choices?: Array<{
    message?: {
      content?: string;
    };
  }>;
}

function isValidOpenRouterResponse(data: unknown): data is OpenRouterResponse {
  if (!data || typeof data !== 'object') return false;
  const obj = data as Record<string, unknown>;
  if (!Array.isArray(obj.choices)) return false;
  return obj.choices.every(choice => 
    typeof choice === 'object' && 
    choice !== null &&
    (!('message' in choice) || typeof choice.message === 'object')
  );
}

interface AiTutorChatRequest {
  conversationId?: string;
  courseId?: string;
  lessonId?: string;
  message?: string;
  worksheetConfig?: WorksheetConfig;
  lessonPlanConfig?: LessonPlanConfig;
}

// ==================== HANDLER ====================

/**
 * Handle AI tutor chat with streaming responses
 */
export const handleAiTutorChat = async (context: TypedContext) => {
  const { request, env, data } = context;
  const user = data.user;

  if (request.method !== 'POST') {
    return jsonResponse({ error: 'Method not allowed' }, 405);
  }

  const learnerId = user.sub;
  const supabase = getServiceClient(env);

  // Use admin client for database writes
  // strict: type-safe cast - RequiredEnv is compatible with PagesEnv
  const supabaseAdmin = createSupabaseAdminClient(env as PagesEnv);

  // Parse request body
  let body: AiTutorChatRequest;
  try {
    body = await request.json();
  } catch {
    return jsonResponse({ error: 'Invalid JSON body' }, 400);
  }

  if (!body || typeof body !== 'object') {
    return jsonResponse({ error: 'Invalid request body' }, 400);
  }

  const { conversationId, courseId, lessonId, message, worksheetConfig, lessonPlanConfig } = body;

  if (!courseId || !message) {
    return jsonResponse({ error: 'Missing required fields: courseId and message' }, 400);
  }

  // Check if AI is configured
  const { openRouter: openRouterKey } = getAPIKeys(env);
  if (!openRouterKey) {
    return jsonResponse({ error: 'AI service not configured' }, 500);
  }

  try {
    // Fetch existing messages if conversation exists
    let currentConversationId = conversationId;
    let existingMessages: StoredMessage[] = [];

    if (conversationId) {
      const { data: conversation } = await supabase
        .from('tutor_conversations')
        .select('messages')
        .eq('id', conversationId)
        .eq('learner_id', learnerId)
        .maybeSingle();

      if (conversation) {
        existingMessages = conversation.messages || [];
      }
    }

    // Determine conversation phase
    const messageCount = existingMessages.length;
    const conversationPhase = getConversationPhase(messageCount);
    const phaseParams = getPhaseParameters(conversationPhase);

    const isGenerationRequest = Boolean(worksheetConfig || lessonPlanConfig);

    // Extract user role from authenticated user (from JWT)
    // Supports: 'learner', 'educator', 'school_educator', 'college_educator', etc.
    let userRole = (user.roles && user.roles[0]) || 'learner';

    // learner_type is the source of truth for teacher-learner behavior.
    const { data: learnerData } = await supabase
      .from('learners')
      .select('learner_type')
      .eq('user_id', learnerId)
      .maybeSingle();

    const isTeacherLearner = learnerData?.learner_type === 'teacher';

    // Teacher-learner accounts get educator generation tools, but keep their own two-use limit.
    if (userRole === 'learner') {
      if (isTeacherLearner) {
        userRole = 'educator';
        logger.info('User role override: learner_type="teacher" → treating as educator');
      }
    }

    let generationUsage:
      | { limit: number; used: number; remaining: number }
      | undefined;

    // Check generation limit for teacher-learners
    if (isTeacherLearner && isGenerationRequest) {
      // Type assertion needed due to dual node_modules (root + functions)
      const limitReached = await hasReachedLimit(supabaseAdmin as any, learnerId);
      
      if (limitReached) {
        logger.warn('Blocked: teacher learner reached generation limit');
        return jsonResponse({
          error: 'You have reached your 2-generation limit for worksheet and lesson plan generation.',
          code: 'TEACHER_GENERATION_LIMIT_REACHED',
        }, 403);
      }
    }

    // VALIDATION: Block chat functionality for educators
    // Educators can ONLY generate worksheets/lesson plans, NOT use chat
    if (userRole.toLowerCase().includes('educator')) {
      // Educators MUST provide either worksheetConfig or lessonPlanConfig
      if (!worksheetConfig && !lessonPlanConfig) {
        logger.warn('Blocked: Educator attempted to use chat without worksheet/lesson plan config');
        return jsonResponse({ 
          error: 'Chat functionality is not available for educators. Please use the worksheet or lesson plan generation feature.',
          code: 'EDUCATOR_CHAT_BLOCKED',
          userRole: userRole
        }, 403);
      }
      logger.info('Educator request validated: has ' + (worksheetConfig ? 'worksheet' : 'lesson plan') + ' config');
    }

    // Override token limits for worksheet generation (educators need more tokens)
    const isWorksheetGeneration = worksheetConfig && userRole.toLowerCase().includes('educator');
    const isLessonPlanGeneration = lessonPlanConfig && userRole.toLowerCase().includes('educator');
    const maxTokens = (isWorksheetGeneration || isLessonPlanGeneration) ? 2000 : phaseParams.maxTokens;

    logger.info('AI Tutor Chat: phase=' + conversationPhase + ', messageCount=' + messageCount + ', userRole=' + userRole + ', maxTokens=' + maxTokens);

    // Build course context and system prompt (role-based + optional worksheet/lesson plan config)
    const courseContext = await buildCourseContext(supabase, courseId, lessonId || null, learnerId);
    const systemPrompt = buildSystemPrompt(courseContext, conversationPhase, userRole, worksheetConfig, lessonPlanConfig);
    
    logger.info('System Prompt Preview (first 500 chars): ' + systemPrompt.substring(0, 500));

    // Get model and endpoint from shared config
    const chatModel = AI_MODELS.GPT_4O_MINI;
    const endpoint = API_CONFIG.OPENROUTER.endpoint;

    // Create user message
    const userMessageId = crypto.randomUUID();
    const userMessage: StoredMessage = {
      id: userMessageId,
      role: 'user',
      content: message,
      timestamp: new Date().toISOString()
    };

    // Limit conversation history to last 3 messages (6 total with user/assistant pairs)
    // This keeps us under the 1,530 token free tier limit
    const recentMessages = existingMessages.slice(-6);

    // Build messages for AI
    const aiMessages = [
      { role: 'system', content: systemPrompt },
      ...recentMessages.map(m => ({ role: m.role, content: m.content })),
      { role: 'user', content: message }
    ];

    // Create SSE stream
    const encoder = new TextEncoder();
    let fullResponse = '';

    const stream = new ReadableStream({
      async start(controller) {
        try {
          // Check if two-pass prompting is enabled for lesson plans
          const useTwoPass = isLessonPlanGeneration && lessonPlanConfig?.useTwoPass;

          if (useTwoPass) {
            logger.info('Two-Pass Mode: Starting outline generation...');
            
            // FIRST PASS: Generate outline (non-streaming, silent)
            const outlinePrompt = buildLessonPlanPrompt(lessonPlanConfig, courseContext, true);
            
            const outlineResponse = await fetch(endpoint, {
              method: 'POST',
              headers: {
                'Authorization': `Bearer ${openRouterKey}`,
                'Content-Type': 'application/json',
                'HTTP-Referer': env.SUPABASE_URL ?? env.VITE_SUPABASE_URL ?? '',
                'X-Title': 'AI Course Tutor - Lesson Plan Outline'
              },
              body: JSON.stringify({
                model: chatModel,
                messages: [{ role: 'user', content: outlinePrompt }],
                stream: false,  // Non-streaming for outline
                max_tokens: 800,
                temperature: 0.7
              })
            });

            if (!outlineResponse.ok) {
              const errorText = await outlineResponse.text();
              logger.error('Outline generation error: ' + outlineResponse.status + ' ' + errorText);
              controller.enqueue(encoder.encode(`event: error\ndata: ${JSON.stringify({ error: 'Failed to generate outline' })}\n\n`));
              controller.close();
              return;
            }

            const outlineData: unknown = await outlineResponse.json();
            if (!isValidOpenRouterResponse(outlineData)) {
              logger.error('Invalid outline response structure');
              controller.enqueue(encoder.encode(`event: error\ndata: ${JSON.stringify({ error: 'Invalid outline response from AI service' })}\n\n`));
              controller.close();
              return;
            }
            const outline = outlineData.choices?.[0]?.message?.content || '';
            
            logger.info('Outline generated: ' + outline.substring(0, 200) + '...');

            // SECOND PASS: Generate full lesson plan using outline
            logger.info('Two-Pass Mode: Generating full lesson plan...');
            
            const finalPrompt = buildLessonPlanPrompt(lessonPlanConfig, courseContext, true, outline);
            
            const finalResponse = await fetch(endpoint, {
              method: 'POST',
              headers: {
                'Authorization': `Bearer ${openRouterKey}`,
                'Content-Type': 'application/json',
                'HTTP-Referer': env.SUPABASE_URL ?? env.VITE_SUPABASE_URL ?? '',
                'X-Title': 'AI Course Tutor - Lesson Plan'
              },
              body: JSON.stringify({
                model: chatModel,
                messages: [{ role: 'user', content: finalPrompt }],
                stream: true,
                max_tokens: 2000,
                temperature: 0.7
              })
            });

            if (!finalResponse.ok) {
              const errorText = await finalResponse.text();
              logger.error('Lesson plan generation error: ' + finalResponse.status + ' ' + errorText);
              controller.enqueue(encoder.encode(`event: error\ndata: ${JSON.stringify({ error: 'Failed to generate lesson plan' })}\n\n`));
              controller.close();
              return;
            }

            const reader = finalResponse.body?.getReader();
            if (!reader) {
              controller.enqueue(encoder.encode(`event: error\ndata: ${JSON.stringify({ error: 'No response stream' })}\n\n`));
              controller.close();
              return;
            }

            const decoder = new TextDecoder();
            let buffer = '';

            // Stream final lesson plan to client
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
                  } catch {
                    // Skip invalid JSON
                  }
                }
              }
            }

            logger.info('Two-pass lesson plan complete: ' + fullResponse.length + ' chars');
          } else {
            // SINGLE-PASS MODE: Original implementation
            // Call OpenRouter with streaming
            const response = await fetch(endpoint, {
              method: 'POST',
              headers: {
                'Authorization': `Bearer ${openRouterKey}`,
                'Content-Type': 'application/json',
                'HTTP-Referer': env.SUPABASE_URL ?? env.VITE_SUPABASE_URL ?? '',
                'X-Title': 'AI Course Tutor'
              },
              body: JSON.stringify({
                model: chatModel,
                messages: aiMessages,
                stream: true,
                max_tokens: maxTokens,
                temperature: phaseParams.temperature
              })
            });

            if (!response.ok) {
              const errorText = await response.text();
              logger.error('OpenRouter error: ' + response.status + ' ' + errorText);
              controller.enqueue(encoder.encode(`event: error\ndata: ${JSON.stringify({ error: 'AI service error' })}\n\n`));
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

            // Stream tokens to client
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
                  } catch {
                    // Skip invalid JSON
                  }
                }
              }
            }
          }

          // Create assistant message
          const assistantMessageId = crypto.randomUUID();
          const assistantMessage: StoredMessage = {
            id: assistantMessageId,
            role: 'assistant',
            content: fullResponse,
            timestamp: new Date().toISOString()
          };

          const updatedMessages = [...existingMessages, userMessage, assistantMessage];

          // Save conversation to database
          if (currentConversationId) {
            // Update existing conversation atomically using raw SQL
            const { error: updateError } = await supabaseAdmin.rpc('append_tutor_messages', {
              p_conversation_id: currentConversationId,
              p_learner_id: learnerId,
              p_new_messages: [userMessage, assistantMessage]
            });

            if (updateError) {
              logger.error('Failed to append messages', updateError);
              // Continue anyway - the generation succeeded
            } else {
              logger.info('Updated conversation: ' + currentConversationId);
            }
          } else {
            // Create new conversation with generated title
            let title = message.slice(0, 50);

            try {
              const titleAbortController = new AbortController();
              const titleTimeoutId = setTimeout(() => titleAbortController.abort(), 5000);

              const titleResponse = await fetch(endpoint, {
                method: 'POST',
                headers: {
                  'Authorization': `Bearer ${openRouterKey}`,
                  'Content-Type': 'application/json',
                  'HTTP-Referer': env.SUPABASE_URL ?? env.VITE_SUPABASE_URL ?? '',
                  'X-Title': 'AI Course Tutor - Title Generation'
                },
                body: JSON.stringify({
                  model: chatModel,
                  messages: [{
                    role: 'user',
                    content: `Generate a short title (max 50 chars) for a tutoring conversation about "${courseContext.courseTitle}" starting with: "${message}"`
                  }],
                  max_tokens: 60,
                  temperature: 0.5
                }),
                signal: titleAbortController.signal
              });

              clearTimeout(titleTimeoutId);

              if (titleResponse.ok) {
                const titleData: unknown = await titleResponse.json();
                if (!isValidOpenRouterResponse(titleData)) {
                  logger.warn('Invalid title response structure, using default');
                } else {
                  const generatedTitle = titleData.choices?.[0]?.message?.content?.trim();
                  if (generatedTitle) {
                    title = generatedTitle;
                  }
                }
              }
            } catch (error) {
              logger.warn('Title generation failed, using default', { error: error instanceof Error ? error.message : String(error) });
            }

            const { data: newConv } = await supabaseAdmin
              .from('tutor_conversations')
              .insert({
                learner_id: learnerId,
                course_id: courseId,
                lesson_id: lessonId || null,
                title: title.slice(0, 255),
                messages: updatedMessages
              })
              .select('id')
              .single();

            if (newConv) {
              currentConversationId = newConv.id;
              logger.info('Created new conversation: ' + currentConversationId);
            }
          }

          // Increment generation count for teacher-learners
          if (isTeacherLearner && isGenerationRequest) {
            try {
              generationUsage = await incrementGenerationCount(supabaseAdmin, learnerId);
              logger.info('Generation count incremented', { used: generationUsage.used, remaining: generationUsage.remaining });
            } catch (err) {
              // Log error but don't fail the stream - the generation already succeeded
              logger.error('Failed to increment generation count', err instanceof Error ? err : new Error(String(err)));
            }
          }

          // Send completion event
          controller.enqueue(encoder.encode(`event: done\ndata: ${JSON.stringify({
            conversationId: currentConversationId,
            messageId: assistantMessage.id,
            generationUsage
          })}\n\n`));

          logger.info('Streaming complete: ' + fullResponse.length + ' chars');
          controller.close();

        } catch (error: unknown) {
          logger.error('Streaming error', error instanceof Error ? error : new Error(String(error)));
          const errorMessage = error instanceof Error ? error.message : 'Stream processing error';
          controller.enqueue(encoder.encode(`event: error\ndata: ${JSON.stringify({
            error: errorMessage
          })}\n\n`));
          controller.close();
        }
      }
    });

    return new Response(stream, {
      headers: {
        'Content-Type': 'text/event-stream',
        'Cache-Control': 'no-cache',
        'Connection': 'keep-alive',
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
      }
    });

  } catch (error: unknown) {
    logger.error('AI Tutor Chat error', error instanceof Error ? error : new Error(String(error)));
    const errorMessage = error instanceof Error ? error.message : 'Internal server error';
    return jsonResponse({ error: errorMessage }, 500);
  }
};
