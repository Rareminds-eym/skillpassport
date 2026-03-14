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

import { createSupabaseClient, createSupabaseAdminClient } from '../../../../src/functions-lib/supabase';
import { jsonResponse } from '../../../../src/functions-lib/response';
import type { PagesFunction, PagesEnv } from '../../../../src/functions-lib/types';
import { authenticateUser } from '../../shared/auth';
import { getAPIKeys, API_CONFIG, AI_MODELS } from '../../shared/ai-config';
import { 
  buildCourseContext, 
  buildSystemPrompt 
} from '../utils/course-context';
import { 
  getConversationPhase, 
  getPhaseParameters 
} from '../utils/conversation-phases';
import { validateRequest } from '../../../../src/validation/middleware/functions.js';
import { tutorChat } from '../../../../src/validation/schemas/course/ai-tutor.js';
import { getLogger } from '../../../../src/config/logging.js';

const logger = getLogger('ai-tutor-chat');

// ==================== TYPES ====================

interface StoredMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: string;
}

// ==================== HANDLER ====================

/**
 * Handle AI tutor chat with streaming responses
 */
export const handleAiTutorChat: PagesFunction<PagesEnv> = async (context) => {
  const { request, env } = context;

  if (request.method !== 'POST') {
    return jsonResponse({ error: 'Method not allowed' }, 405);
  }

  // Authenticate user (required)
  const auth = await authenticateUser(request, env as unknown as Record<string, string>);
  if (!auth) {
    return jsonResponse({ error: 'Unauthorized' }, 401);
  }
  
  const { user, supabase } = auth;
  const studentId = user.id;
  
  // Use admin client for database writes
  const supabaseAdmin = createSupabaseAdminClient(env);

  // Validate request body using Zod
  const validation = await validateRequest(request, {
    body: tutorChat
  });

  if (!validation.success) {
    return validation.response;
  }

  const { conversationId, courseId, lessonId, message, context: chatContext } = validation.data.body;

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
        .eq('student_id', studentId)
        .maybeSingle();

      if (conversation) {
        existingMessages = conversation.messages || [];
      }
    }

    // Determine conversation phase
    const messageCount = existingMessages.length;
    const conversationPhase = getConversationPhase(messageCount);
    const phaseParams = getPhaseParameters(conversationPhase);

    logger.info(`AI Tutor Chat: phase=${conversationPhase}, messageCount=${messageCount}`);

    // Build course context and system prompt
    const courseContext = await buildCourseContext(supabase, courseId, lessonId || null, studentId);
    const systemPrompt = buildSystemPrompt(courseContext, conversationPhase);

    // Get model and endpoint from shared config
    const chatModel = AI_MODELS.GPT_4O_MINI;
    const endpoint = API_CONFIG.OPENROUTER.endpoint;

    // Create user message
    const turnId = crypto.randomUUID();
    const userMessage: StoredMessage = {
      id: turnId,
      role: 'user',
      content: message,
      timestamp: new Date().toISOString()
    };

    // Build messages for AI
    const aiMessages = [
      { role: 'system', content: systemPrompt },
      ...existingMessages.map(m => ({ role: m.role, content: m.content })),
      { role: 'user', content: message }
    ];

    // Create SSE stream
    const encoder = new TextEncoder();
    let fullResponse = '';

    const stream = new ReadableStream({
      async start(controller) {
        try {
          // Call OpenRouter with streaming
          const response = await fetch(endpoint, {
            method: 'POST',
            headers: {
              'Authorization': `Bearer ${openRouterKey}`,
              'Content-Type': 'application/json',
              'HTTP-Referer': env.SUPABASE_URL || env.VITE_SUPABASE_URL || '',
              'X-Title': 'AI Course Tutor'
            },
            body: JSON.stringify({
              model: chatModel,
              messages: aiMessages,
              stream: true,
              max_tokens: phaseParams.maxTokens,
              temperature: phaseParams.temperature
            })
          });

          if (!response.ok) {
            const errorText = await response.text();
            logger.error('OpenRouter error', new Error(`${response.status}: ${errorText}`));
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

          // Create assistant message
          const assistantMessage: StoredMessage = {
            id: turnId,
            role: 'assistant',
            content: fullResponse,
            timestamp: new Date().toISOString()
          };

          const updatedMessages = [...existingMessages, userMessage, assistantMessage];

          // Save conversation to database
          if (currentConversationId) {
            // Update existing conversation
            // Re-fetch latest to avoid race condition
            const { data: latestConv } = await supabaseAdmin
              .from('tutor_conversations')
              .select('messages')
              .eq('id', currentConversationId)
              .maybeSingle();
            
            const latestMessages: StoredMessage[] = latestConv?.messages || existingMessages;
            const finalMessages = [...latestMessages, userMessage, assistantMessage];
            
            await supabaseAdmin
              .from('tutor_conversations')
              .update({
                messages: finalMessages,
                updated_at: new Date().toISOString()
              })
              .eq('id', currentConversationId)
              .eq('student_id', studentId);
            
            logger.info(`Updated conversation: ${currentConversationId}`);
          } else {
            // Create new conversation with generated title
            let title = message.slice(0, 50);
            
            try {
              const titleResponse = await fetch(endpoint, {
                method: 'POST',
                headers: { 
                  'Authorization': `Bearer ${openRouterKey}`, 
                  'Content-Type': 'application/json',
                  'HTTP-Referer': env.SUPABASE_URL || env.VITE_SUPABASE_URL || '',
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
                })
              });
              
              if (titleResponse.ok) {
                const titleData = await titleResponse.json() as { choices?: Array<{ message?: { content?: string } }> };
                const generatedTitle = titleData.choices?.[0]?.message?.content?.trim();
                if (generatedTitle) {
                  title = generatedTitle;
                }
              }
            } catch (error) {
              logger.warn('Title generation failed, using default', error as Error);
            }

            const { data: newConv } = await supabaseAdmin
              .from('tutor_conversations')
              .insert({
                student_id: studentId,
                course_id: courseId,
                lesson_id: lessonId || null,
                title: title.slice(0, 255),
                messages: updatedMessages
              })
              .select('id')
              .single();

            if (newConv) {
              currentConversationId = newConv.id;
              logger.info(`Created new conversation: ${currentConversationId}`);
            }
          }

          // Send completion event
          controller.enqueue(encoder.encode(`event: done\ndata: ${JSON.stringify({
            conversationId: currentConversationId,
            messageId: assistantMessage.id
          })}\n\n`));
          
          logger.info(`Streaming complete: ${fullResponse.length} chars`);
          controller.close();

        } catch (error: any) {
          logger.error('Streaming error', error);
          controller.enqueue(encoder.encode(`event: error\ndata: ${JSON.stringify({ 
            error: error.message || 'Stream processing error' 
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

  } catch (error: any) {
    logger.error('AI Tutor Chat error', error);
    return jsonResponse({ error: error.message || 'Internal server error' }, 500);
  }
};
