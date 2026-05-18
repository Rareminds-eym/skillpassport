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
import { createSupabaseClient, createSupabaseAdminClient } from '../../../../src/functions-lib/supabase';
import { jsonResponse } from '../../../../src/functions-lib/response';
import type { PagesFunction, PagesEnv } from '../../../../src/functions-lib/types';
import { getServiceClient } from '../../../lib/auth';
import { getAPIKeys, API_CONFIG, AI_MODELS } from '../../shared/ai-config';
import {
  buildCourseContext,
  buildSystemPrompt
} from '../utils/course-context';
import {
  getConversationPhase,
  getPhaseParameters
} from '../utils/conversation-phases';
import { buildLessonPlanPrompt } from '../utils/lesson-plan-templates';

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
export const handleAiTutorChat = async (context: AuthenticatedContext) => {
  const { request, env, data } = context;
  const user = data.user;

  if (request.method !== 'POST') {
    return jsonResponse({ error: 'Method not allowed' }, 405);
  }

  const learnerId = user.sub;
  const supabase = getServiceClient(env as any);

  // Use admin client for database writes
  const supabaseAdmin = createSupabaseAdminClient(env as any);

  // Parse request body
  let body: any;
  try {
    body = await request.json();
  } catch {
    return jsonResponse({ error: 'Invalid JSON body' }, 400);
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

    // Extract user role from authenticated user (from JWT)
    // Supports: 'learner', 'educator', 'school_educator', 'college_educator', etc.
    const userRole = (user.roles && user.roles[0]) || 'learner';

    // Override token limits for worksheet generation (educators need more tokens)
    const isWorksheetGeneration = worksheetConfig && userRole.toLowerCase().includes('educator');
    const isLessonPlanGeneration = lessonPlanConfig && userRole.toLowerCase().includes('educator');
    const maxTokens = (isWorksheetGeneration || isLessonPlanGeneration) ? 2000 : phaseParams.maxTokens;

    console.log(`💬 AI Tutor Chat: phase=${conversationPhase}, messageCount=${messageCount}, userRole=${userRole}, hasWorksheetConfig=${!!worksheetConfig}, hasLessonPlanConfig=${!!lessonPlanConfig}, maxTokens=${maxTokens}`);
    if (worksheetConfig) {
      console.log(`📋 Worksheet Config:`, JSON.stringify(worksheetConfig, null, 2));
    }
    if (lessonPlanConfig) {
      console.log(`📚 Lesson Plan Config:`, JSON.stringify(lessonPlanConfig, null, 2));
    }

    // Build course context and system prompt (role-based + optional worksheet/lesson plan config)
    const courseContext = await buildCourseContext(supabase, courseId, lessonId || null, learnerId);
    const systemPrompt = buildSystemPrompt(courseContext, conversationPhase, userRole, worksheetConfig, lessonPlanConfig);
    
    console.log(`🤖 System Prompt Preview (first 500 chars):`, systemPrompt.substring(0, 500));

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
            console.log('🎯 Two-Pass Mode: Starting outline generation...');
            
            // FIRST PASS: Generate outline (non-streaming, silent)
            const outlinePrompt = buildLessonPlanPrompt(lessonPlanConfig, courseContext, true);
            
            const outlineResponse = await fetch(endpoint, {
              method: 'POST',
              headers: {
                'Authorization': `Bearer ${openRouterKey}`,
                'Content-Type': 'application/json',
                'HTTP-Referer': (env.SUPABASE_URL || env.VITE_SUPABASE_URL || '') as string,
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
              console.error('❌ Outline generation error:', outlineResponse.status, errorText);
              controller.enqueue(encoder.encode(`event: error\ndata: ${JSON.stringify({ error: 'Failed to generate outline' })}\n\n`));
              controller.close();
              return;
            }

            const outlineData = await outlineResponse.json() as { choices?: Array<{ message?: { content?: string } }> };
            const outline = outlineData.choices?.[0]?.message?.content || '';
            
            console.log('✅ Outline generated:', outline.substring(0, 200) + '...');

            // SECOND PASS: Generate full lesson plan using outline
            console.log('📝 Two-Pass Mode: Generating full lesson plan...');
            
            const finalPrompt = buildLessonPlanPrompt(lessonPlanConfig, courseContext, true, outline);
            
            const finalResponse = await fetch(endpoint, {
              method: 'POST',
              headers: {
                'Authorization': `Bearer ${openRouterKey}`,
                'Content-Type': 'application/json',
                'HTTP-Referer': (env.SUPABASE_URL || env.VITE_SUPABASE_URL || '') as string,
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
              console.error('❌ Lesson plan generation error:', finalResponse.status, errorText);
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

            console.log('✅ Two-pass lesson plan complete:', fullResponse.length, 'chars');
          } else {
            // SINGLE-PASS MODE: Original implementation
            // Call OpenRouter with streaming
            const response = await fetch(endpoint, {
              method: 'POST',
              headers: {
                'Authorization': `Bearer ${openRouterKey}`,
                'Content-Type': 'application/json',
                'HTTP-Referer': (env.SUPABASE_URL || env.VITE_SUPABASE_URL || '') as string,
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
              console.error('❌ OpenRouter error:', response.status, errorText);
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
              .eq('learner_id', learnerId);

            console.log(`✅ Updated conversation: ${currentConversationId}`);
          } else {
            // Create new conversation with generated title
            let title = message.slice(0, 50);

            try {
              const titleResponse = await fetch(endpoint, {
                method: 'POST',
                headers: {
                  'Authorization': `Bearer ${openRouterKey}`,
                  'Content-Type': 'application/json',
                  'HTTP-Referer': (env.SUPABASE_URL || env.VITE_SUPABASE_URL || '') as string,
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
              console.warn('⚠️ Title generation failed, using default:', error);
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
              console.log(`✅ Created new conversation: ${currentConversationId}`);
            }
          }

          // Send completion event
          controller.enqueue(encoder.encode(`event: done\ndata: ${JSON.stringify({
            conversationId: currentConversationId,
            messageId: assistantMessage.id
          })}\n\n`));

          console.log(`✅ Streaming complete: ${fullResponse.length} chars`);
          controller.close();

        } catch (error: any) {
          console.error('❌ Streaming error:', error);
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
    console.error('❌ AI Tutor Chat error:', error);
    return jsonResponse({ error: error.message || 'Internal server error' }, 500);
  }
};
