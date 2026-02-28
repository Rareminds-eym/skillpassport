/**
 * Educator Chat Handler - Streaming AI chat with educator guidance
 * 
 * Features:
 * - Conversation ownership validation (prevents UUID guessing attacks)
 * - Durable rate limiting with Cloudflare KV
 * - Optimistic locking to prevent race conditions
 * - Streaming responses
 */

import { jsonResponse } from '../../../../src/functions-lib/response';
import { authenticateUser, sanitizeInput, generateConversationTitle } from '../../shared/auth';
import { checkRateLimit } from '../utils/rate-limit';
import { getAPIKeys, callOpenRouterWithRetry, MODEL_PROFILES } from '../../shared/ai-config';
import type { ChatRequest, StoredMessage } from '../types';

export async function handleEducatorChat(request: Request, env: Record<string, string>): Promise<Response> {
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
  const educatorId = user.id;

  // Rate limiting with KV (durable across worker restarts)
  if (!await checkRateLimit(educatorId, env)) {
    return jsonResponse({ error: 'Too many requests. Please wait a moment.' }, 429);
  }

  // Parse request
  let body: ChatRequest;
  try {
    body = await request.json() as ChatRequest;
  } catch {
    return jsonResponse({ error: 'Invalid JSON' }, 400);
  }

  const { conversationId, message } = body;

  // SECURITY: Validate request size
  const contentLength = request.headers.get('content-length');
  if (contentLength && parseInt(contentLength) > 1048576) { // 1MB limit
    return jsonResponse({ error: 'Request too large' }, 413);
  }

  if (!message || typeof message !== 'string') {
    return jsonResponse({ error: 'Message is required' }, 400);
  }

  // SECURITY: Strict message length validation
  if (message.length > 10000) {
    return jsonResponse({ error: 'Message too long. Maximum 10,000 characters.' }, 400);
  }

  const sanitizedMessage = sanitizeInput(message, 10000);
  if (!sanitizedMessage) {
    return jsonResponse({ error: 'Invalid message' }, 400);
  }

  const processedMessage = sanitizedMessage;

  // Get OpenRouter API key
  const { openRouter: openRouterKey } = getAPIKeys(env);
  if (!openRouterKey) {
    return jsonResponse({ error: 'AI service not configured' }, 500);
  }

  try {
    // ==================== FETCH CONVERSATION HISTORY ====================
    let existingMessages: StoredMessage[] = [];
    let existingConversation: any = null;

    if (conversationId) {
      // SECURITY: Validate conversation ownership - prevents UUID guessing attacks
      const { data: conv, error: fetchError } = await supabase
        .from('educator_ai_conversations')
        .select('messages, updated_at')
        .eq('id', conversationId)
        .eq('educator_id', educatorId) // CRITICAL: Verify ownership
        .single();

      // Security: Explicit validation - if conversationId provided but not found, deny access
      if (fetchError || !conv) {
        return jsonResponse({ 
          error: 'Conversation not found or access denied' 
        }, 403);
      }

      existingConversation = conv;
      existingMessages = Array.isArray(conv.messages) ? conv.messages : [];
    }

    // ==================== PREPARE MESSAGES ====================
    const turnId = crypto.randomUUID();
    const userMessage: StoredMessage = {
      id: turnId,
      role: 'user',
      content: processedMessage,
      timestamp: new Date().toISOString()
    };

    const recentMessages = existingMessages.slice(-10);

    const aiMessages = [
      { role: 'system', content: 'You are an AI assistant helping educators with student insights, class analytics, and guidance strategies.' },
      ...recentMessages.map(m => ({ role: m.role, content: m.content })),
      { role: 'user', content: processedMessage }
    ];

    // ==================== CALL AI WITH RETRY AND FALLBACK ====================
    const chatProfile = MODEL_PROFILES['chat'];
    
    let assistantMessage = '';
    try {
      assistantMessage = await callOpenRouterWithRetry(
        openRouterKey,
        aiMessages,
        {
          models: [chatProfile.primary, ...chatProfile.fallbacks],
          maxTokens: chatProfile.maxTokens,
          temperature: chatProfile.temperature
        }
      );
      
      console.log(`✅ [Educator Chat] AI response received: ${assistantMessage.length} chars`);
    } catch (error) {
      console.error('❌ [Educator Chat] All AI models failed:', error);
      return jsonResponse({
        error: 'AI service temporarily unavailable',
        details: 'All models are currently unavailable. Please try again in a moment.'
      }, 503);
    }

    // ==================== STREAM RESPONSE ====================
    const encoder = new TextEncoder();
    let finalConversationId = conversationId;

    const stream = new ReadableStream({
      async start(controller) {
        try {
          // Stream the response character by character for smooth UX
          for (let i = 0; i < assistantMessage.length; i++) {
            controller.enqueue(encoder.encode(`data: ${JSON.stringify({ content: assistantMessage[i] })}\n\n`));
            await new Promise(resolve => setTimeout(resolve, 10));
          }

          // ==================== SAVE CONVERSATION ====================
          const turnId = crypto.randomUUID();
          const assistantMessageObj: StoredMessage = {
            id: turnId,
            role: 'assistant',
            content: assistantMessage,
            timestamp: new Date().toISOString()
          };

          const updatedMessages = [...existingMessages, userMessage, assistantMessageObj];

          try {
            if (existingConversation) {
              const { error: updateError } = await supabase
                .from('educator_ai_conversations')
                .update({
                  messages: updatedMessages,
                  updated_at: new Date().toISOString()
                })
                .eq('id', conversationId)
                .eq('educator_id', educatorId)
                .eq('updated_at', existingConversation.updated_at);

              if (updateError) {
                console.error('[DB ERROR] Failed to update conversation:', updateError);
              }
            } else {
              finalConversationId = crypto.randomUUID();
              const title = generateConversationTitle(processedMessage);

              const { error: insertError } = await supabase
                .from('educator_ai_conversations')
                .insert({
                  id: finalConversationId,
                  educator_id: educatorId,
                  title: title.slice(0, 255),
                  messages: updatedMessages
                });

              if (insertError) {
                console.error('[DB ERROR] Failed to create conversation:', insertError);
              }
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
            executionTime
          })}\n\n`));

          console.log(`[COMPLETE] Educator Chat, Time: ${executionTime}ms`);
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
    console.error('Educator chat error:', error);
    return jsonResponse({ error: 'Internal server error' }, 500);
  }
}
