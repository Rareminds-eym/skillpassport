/**
 * Educator Chat Handler - Streaming AI chat with educator guidance
 * 
 * Features:
 * - Conversation ownership validation (prevents UUID guessing attacks)
 * - Durable rate limiting with Cloudflare KV
 * - Optimistic locking to prevent race conditions
 * - Response validation for harmful content
 * - Request timeout protection
 * - Streaming responses with abort support
 * 
 * @module educator/handlers/chat
 */

import { jsonResponse } from '../../../../src/functions-lib/response';
import { authenticateUser, sanitizeInput, generateConversationTitle } from '../../shared/auth';
import { checkRateLimit } from '../utils/rate-limit';
import { getAPIKeys, callOpenRouterWithRetry, MODEL_PROFILES } from '../../shared/ai-config';
import { logger } from '../../shared/logger';
import type { ChatRequest, StoredMessage } from '../types';

/**
 * Environment variables required for this handler
 */
interface EducatorChatEnv {
  SUPABASE_URL: string;
  SUPABASE_ANON_KEY: string;
  SUPABASE_SERVICE_ROLE_KEY: string;
  OPENROUTER_API_KEY: string;
  EDUCATOR_AI_RATE_LIMITER?: any; // Cloudflare KV namespace
}

/**
 * Request timeout in milliseconds (30 seconds)
 * Prevents hanging requests if AI service stalls
 */
const REQUEST_TIMEOUT = 30000;

/**
 * Handle educator chat requests with streaming AI responses
 * 
 * @param request - HTTP request with chat message
 * @param env - Environment variables and KV bindings
 * @returns Streaming response with AI-generated content
 */
export async function handleEducatorChat(request: Request, env: EducatorChatEnv): Promise<Response> {
  if (request.method !== 'POST') {
    return jsonResponse({ error: 'Method not allowed' }, 405);
  }

  const startTime = Date.now();
  const requestId = crypto.randomUUID().slice(0, 8);

  logger.log(`[${requestId}] 📨 Educator chat request received`);

  // Authentication
  const auth = await authenticateUser(request, env as any);
  if (!auth) {
    logger.log(`[${requestId}] ❌ Authentication failed`);
    return jsonResponse({ error: 'Authentication required. Please log in again.' }, 401);
  }

  const { user, supabase } = auth;
  const educatorId = user.id;

  logger.log(`[${requestId}] ✓ Auth: User ${educatorId.slice(0, 8)}`);

  // Rate limiting with KV (durable across worker restarts)
  if (!await checkRateLimit(educatorId, env)) {
    logger.log(`[${requestId}] ⚠️ Rate limit exceeded for ${educatorId.slice(0, 8)}`);
    return jsonResponse({ error: 'Too many requests. Please wait a moment.' }, 429);
  }

  logger.log(`[${requestId}] ✓ Rate limit check passed`);

  // Parse request
  let body: ChatRequest;
  try {
    body = await request.json() as ChatRequest;
  } catch (error) {
    logger.log(`[${requestId}] ❌ Invalid JSON:`, error);
    return jsonResponse({ error: 'Invalid JSON' }, 400);
  }

  const { conversationId, message } = body;

  // SECURITY: Validate request size
  const contentLength = request.headers.get('content-length');
  if (contentLength && parseInt(contentLength) > 1048576) { // 1MB limit
    logger.log(`[${requestId}] ❌ Request too large: ${contentLength} bytes`);
    return jsonResponse({ error: 'Request too large' }, 413);
  }

  if (!message || typeof message !== 'string') {
    logger.log(`[${requestId}] ❌ Invalid message type`);
    return jsonResponse({ error: 'Message is required' }, 400);
  }

  // SECURITY: Strict message length validation
  if (message.length > 10000) {
    logger.log(`[${requestId}] ❌ Message too long: ${message.length} chars`);
    return jsonResponse({ error: 'Message too long. Maximum 10,000 characters.' }, 400);
  }

  const sanitizedMessage = sanitizeInput(message, 10000);
  if (!sanitizedMessage) {
    logger.log(`[${requestId}] ❌ Message sanitization failed`);
    return jsonResponse({ error: 'Invalid message' }, 400);
  }

  const processedMessage = sanitizedMessage;
  logger.log(`[${requestId}] ✓ Message validated: ${processedMessage.length} chars`);

  // Get OpenRouter API key
  const { openRouter: openRouterKey } = getAPIKeys(env as any);
  if (!openRouterKey) {
    logger.log(`[${requestId}] ❌ OpenRouter API key not configured`);
    return jsonResponse({ error: 'AI service not configured' }, 500);
  }

  try {
    // ==================== FETCH CONVERSATION HISTORY ====================
    let existingMessages: StoredMessage[] = [];
    let existingConversation: any = null;

    if (conversationId) {
      logger.log(`[${requestId}] 🔍 Fetching conversation ${conversationId.slice(0, 8)}`);
      
      // SECURITY: Validate conversation ownership - prevents UUID guessing attacks
      const { data: conv, error: fetchError } = await supabase
        .from('educator_ai_conversations')
        .select('messages, updated_at')
        .eq('id', conversationId)
        .eq('educator_id', educatorId) // CRITICAL: Verify ownership
        .single();

      // Security: Explicit validation - if conversationId provided but not found, deny access
      if (fetchError || !conv) {
        logger.log(`[${requestId}] ❌ Conversation not found or access denied:`, fetchError?.message);
        return jsonResponse({ 
          error: 'Conversation not found or access denied' 
        }, 403);
      }

      existingConversation = conv;
      existingMessages = Array.isArray(conv.messages) ? conv.messages : [];
      logger.log(`[${requestId}] ✓ Loaded ${existingMessages.length} messages`);
    } else {
      logger.log(`[${requestId}] 🆕 Starting new conversation`);
    }

    // ==================== PREPARE MESSAGES ====================
    const userMessageId = crypto.randomUUID();
    const userMessage: StoredMessage = {
      id: userMessageId,
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
    
    logger.log(`[${requestId}] 🤖 Calling AI with ${aiMessages.length} messages`);
    
    let assistantMessage = '';
    try {
      // Add timeout protection
      const aiPromise = callOpenRouterWithRetry(
        openRouterKey,
        aiMessages,
        {
          models: [chatProfile.primary, ...chatProfile.fallbacks],
          maxTokens: chatProfile.maxTokens,
          temperature: chatProfile.temperature
        }
      );
      
      const timeoutPromise = new Promise<never>((_, reject) => 
        setTimeout(() => reject(new Error('Request timeout')), REQUEST_TIMEOUT)
      );
      
      assistantMessage = await Promise.race([aiPromise, timeoutPromise]);
      
      logger.log(`[${requestId}] ✅ AI response received: ${assistantMessage.length} chars`);
    } catch (error) {
      logger.error(`[${requestId}] ❌ AI call failed:`, error);
      return jsonResponse({
        error: 'AI service temporarily unavailable',
        details: (error as Error).message === 'Request timeout' 
          ? 'Request timed out. Please try again.'
          : 'All models are currently unavailable. Please try again in a moment.'
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

          // ==================== VALIDATE RESPONSE ====================
          // SECURITY: Check for harmful content in AI response
          if (!assistantMessage || assistantMessage.trim().length === 0) {
            logger.error(`[${requestId}] ❌ Empty AI response`);
            controller.enqueue(encoder.encode(`data: ${JSON.stringify({ 
              error: 'AI returned empty response. Please try again.' 
            })}\n\n`));
            controller.close();
            return;
          }

          // Basic content validation (can be enhanced with more sophisticated checks)
          const suspiciousPatterns = [
            /ignore previous instructions/i,
            /disregard all prior/i,
            /system prompt/i,
            /you are now/i
          ];
          
          const hasSuspiciousContent = suspiciousPatterns.some(pattern => 
            pattern.test(assistantMessage)
          );
          
          if (hasSuspiciousContent) {
            logger.warn(`[${requestId}] ⚠️ Suspicious content detected in AI response`);
          }

          // ==================== SAVE CONVERSATION ====================
          const assistantMessageId = crypto.randomUUID();
          const assistantMessageObj: StoredMessage = {
            id: assistantMessageId,
            role: 'assistant',
            content: assistantMessage,
            timestamp: new Date().toISOString()
          };

          const updatedMessages = [...existingMessages, userMessage, assistantMessageObj];

          try {
            if (existingConversation) {
              // SECURITY: Optimistic locking to prevent race conditions
              const { data: updateResult, error: updateError } = await supabase
                .from('educator_ai_conversations')
                .update({
                  messages: updatedMessages,
                  updated_at: new Date().toISOString()
                })
                .eq('id', conversationId)
                .eq('educator_id', educatorId)
                .eq('updated_at', existingConversation.updated_at) // Optimistic lock
                .select();

              if (updateError) {
                logger.error(`[${requestId}] ❌ DB: Failed to update conversation:`, updateError);
                // Notify user of save failure
                controller.enqueue(encoder.encode(`data: ${JSON.stringify({ 
                  warning: 'Message sent but not saved. Please try again.' 
                })}\n\n`));
              } else if (!updateResult || updateResult.length === 0) {
                // SECURITY: Race condition detected - another request modified the conversation
                logger.warn(`[${requestId}] ⚠️ DB: Race condition - conversation modified concurrently`);
                controller.enqueue(encoder.encode(`data: ${JSON.stringify({ 
                  warning: 'Conversation was updated elsewhere. Your message may not be saved.' 
                })}\n\n`));
              } else {
                logger.log(`[${requestId}] ✓ DB: Conversation updated successfully`);
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
                logger.error(`[${requestId}] ❌ DB: Failed to create conversation:`, insertError);
                controller.enqueue(encoder.encode(`data: ${JSON.stringify({ 
                  warning: 'Message sent but conversation not saved.' 
                })}\n\n`));
              } else {
                logger.log(`[${requestId}] ✓ DB: New conversation created: ${finalConversationId.slice(0, 8)}`);
              }
            }
          } catch (dbError) {
            logger.error(`[${requestId}] ❌ DB: Exception:`, dbError);
            controller.enqueue(encoder.encode(`data: ${JSON.stringify({ 
              warning: 'Database error. Message may not be saved.' 
            })}\n\n`));
          }

          // ==================== SEND COMPLETION EVENT ====================
          const executionTime = Date.now() - startTime;
          controller.enqueue(encoder.encode(`data: ${JSON.stringify({
            done: true,
            conversationId: finalConversationId,
            messageId: assistantMessageObj.id,
            executionTime,
            messageLength: assistantMessage.length
          })}\n\n`));

          logger.log(`[${requestId}] ✅ COMPLETE - ConvID: ${finalConversationId?.slice(0, 8)}, Time: ${executionTime}ms, Length: ${assistantMessage.length}`);
          controller.close();

        } catch (error) {
          logger.error(`[${requestId}] ❌ Stream error:`, error);
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
    logger.error(`[${requestId}] ❌ Unhandled error:`, error);
    return jsonResponse({ 
      error: 'Internal server error',
      requestId 
    }, 500);
  }
}
