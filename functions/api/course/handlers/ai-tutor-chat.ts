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
import { getAPIKeys } from '../../shared/ai-config';
import { 
  buildCourseContext, 
  buildSystemPrompt 
} from '../utils/course-context';
import { 
  getConversationPhase, 
  getPhaseParameters 
} from '../utils/conversation-phases';

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

  // Authenticate user (optional - can work without auth)
  const auth = await authenticateUser(request, env as unknown as Record<string, string>);
  const studentId = auth?.user?.id || null;
  const supabase = auth?.supabase || createSupabaseClient(env);
  
  // Use admin client for database writes
  const supabaseAdmin = createSupabaseAdminClient(env);

  // Parse request body
  let body: any;
  try {
    body = await request.json();
  } catch {
    return jsonResponse({ error: 'Invalid JSON body' }, 400);
  }

  const { conversationId, courseId, lessonId, message } = body;

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

    if (conversationId && studentId) {
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

    console.log(`💬 AI Tutor Chat: phase=${conversationPhase}, messageCount=${messageCount}`);

    // Build course context and system prompt
    const courseContext = await buildCourseContext(supabase, courseId, lessonId || null, studentId);
    const systemPrompt = buildSystemPrompt(courseContext, conversationPhase);

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
          const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
            method: 'POST',
            headers: {
              'Authorization': `Bearer ${openRouterKey}`,
              'Content-Type': 'application/json',
              'HTTP-Referer': env.SUPABASE_URL || env.VITE_SUPABASE_URL || '',
              'X-Title': 'AI Course Tutor'
            },
            body: JSON.stringify({
              model: 'openai/gpt-4o-mini',
              messages: aiMessages,
              stream: true,
              max_tokens: phaseParams.maxTokens,
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

          // Create assistant message
          const assistantMessage: StoredMessage = {
            id: turnId,
            role: 'assistant',
            content: fullResponse,
            timestamp: new Date().toISOString()
          };

          const updatedMessages = [...existingMessages, userMessage, assistantMessage];

          // Save conversation to database
          if (studentId) {
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
              
              console.log(`✅ Updated conversation: ${currentConversationId}`);
            } else {
              // Create new conversation with generated title
              let title = message.slice(0, 50);
              
              try {
                const titleResponse = await fetch('https://openrouter.ai/api/v1/chat/completions', {
                  method: 'POST',
                  headers: { 
                    'Authorization': `Bearer ${openRouterKey}`, 
                    'Content-Type': 'application/json',
                    'HTTP-Referer': env.SUPABASE_URL || env.VITE_SUPABASE_URL || '',
                    'X-Title': 'AI Course Tutor - Title Generation'
                  },
                  body: JSON.stringify({
                    model: 'openai/gpt-4o-mini',
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
                console.log(`✅ Created new conversation: ${currentConversationId}`);
              }
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
