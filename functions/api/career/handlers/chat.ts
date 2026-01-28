/**
 * Career Chat Handler - Streaming AI chat with career guidance
 */

import { jsonResponse } from '../../../../src/functions-lib/response';
import { authenticateUser, sanitizeInput } from '../utils/auth';
import { checkRateLimit } from '../utils/rate-limit';
import type { ChatRequest } from '../types';

export async function handleCareerChat(request: Request, env: Record<string, string>): Promise<Response> {
  if (request.method !== 'POST') {
    return jsonResponse({ error: 'Method not allowed' }, 405);
  }

  // Authentication
  const auth = await authenticateUser(request, env);
  if (!auth) {
    return jsonResponse({ error: 'Authentication required. Please log in again.' }, 401);
  }

  const { user, supabase } = auth;
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

  const { conversationId, message } = body;

  if (!message || typeof message !== 'string') {
    return jsonResponse({ error: 'Message is required' }, 400);
  }

  const sanitizedMessage = sanitizeInput(message);
  if (!sanitizedMessage) {
    return jsonResponse({ error: 'Invalid message' }, 400);
  }

  // Get OpenRouter API key
  const openRouterKey = env.OPENROUTER_API_KEY || env.VITE_OPENROUTER_API_KEY;
  if (!openRouterKey) {
    return jsonResponse({ error: 'AI service not configured' }, 500);
  }

  try {
    // Fetch student profile for context
    const { data: profile } = await supabase
      .from('students')
      .select('name, email, branch_field, university, college_school_name, course_name')
      .eq('id', studentId)
      .single();

    // Fetch conversation history if conversationId provided
    let conversationHistory: Array<{ role: string; content: string }> = [];
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
        // Extract last 10 messages for context
        const messages = Array.isArray(conv.messages) ? conv.messages : [];
        conversationHistory = messages.slice(-10).map((m: any) => ({
          role: m.role,
          content: m.content
        }));
      }
    }

    // Build system prompt
    const systemPrompt = buildSystemPrompt(profile);

    // Build messages array for AI
    const aiMessages = [
      { role: 'system', content: systemPrompt },
      ...conversationHistory,
      { role: 'user', content: sanitizedMessage }
    ];

    // Call OpenRouter API with streaming
    const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${openRouterKey}`,
        'HTTP-Referer': 'https://skillpassport.pages.dev',
        'X-Title': 'SkillPassport Career AI'
      },
      body: JSON.stringify({
        model: 'meta-llama/llama-3.2-3b-instruct:free',
        messages: aiMessages,
        stream: true,
        temperature: 0.7,
        max_tokens: 2000
      })
    });

    if (!response.ok) {
      const error = await response.text();
      console.error('OpenRouter API error:', {
        status: response.status,
        statusText: response.statusText,
        error
      });
      return jsonResponse({
        error: 'AI service error',
        details: `OpenRouter returned ${response.status}: ${error.substring(0, 200)}`
      }, 500);
    }

    // Stream response and collect assistant message
    const encoder = new TextEncoder();
    const decoder = new TextDecoder();
    let assistantMessage = '';
    let finalConversationId = conversationId;

    const stream = new ReadableStream({
      async start(controller) {
        try {
          const reader = response.body?.getReader();
          if (!reader) throw new Error('No response body');

          while (true) {
            const { done, value } = await reader.read();
            if (done) break;

            const chunk = decoder.decode(value);
            const lines = chunk.split('\n').filter(line => line.trim().startsWith('data: '));

            for (const line of lines) {
              const data = line.replace('data: ', '').trim();
              if (data === '[DONE]') continue;

              try {
                const parsed = JSON.parse(data);
                const content = parsed.choices?.[0]?.delta?.content;
                if (content) {
                  assistantMessage += content;
                  controller.enqueue(encoder.encode(`data: ${JSON.stringify({ content })}\n\n`));
                }
              } catch (e) {
                // Skip invalid JSON
              }
            }
          }

          // Prepare new messages to add
          const userMessageObj = {
            id: crypto.randomUUID(),
            role: 'user',
            content: sanitizedMessage,
            timestamp: new Date().toISOString()
          };

          const assistantMessageObj = {
            id: crypto.randomUUID(),
            role: 'assistant',
            content: assistantMessage,
            timestamp: new Date().toISOString()
          };

          // Update or create conversation
          if (existingConversation) {
            // Append to existing conversation
            const updatedMessages = [
              ...(Array.isArray(existingConversation.messages) ? existingConversation.messages : []),
              userMessageObj,
              assistantMessageObj
            ];

            await supabase
              .from('career_ai_conversations')
              .update({
                messages: updatedMessages,
                updated_at: new Date().toISOString()
              })
              .eq('id', conversationId);

          } else {
            // Create new conversation
            finalConversationId = crypto.randomUUID();
            const title = sanitizedMessage.slice(0, 50) + (sanitizedMessage.length > 50 ? '...' : '');

            await supabase
              .from('career_ai_conversations')
              .insert({
                id: finalConversationId,
                student_id: studentId,
                title,
                messages: [userMessageObj, assistantMessageObj]
              });
          }

          // Send final metadata
          controller.enqueue(encoder.encode(`data: ${JSON.stringify({
            done: true,
            conversationId: finalConversationId
          })}\n\n`));
          controller.close();
        } catch (error) {
          console.error('Stream error:', error);
          controller.error(error);
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

function buildSystemPrompt(profile: any): string {
  const name = profile?.name || 'Student';
  const field = profile?.branch_field || profile?.course_name || 'your field';
  const university = profile?.university || profile?.college_school_name || 'your institution';

  return `You are a career guidance AI assistant for SkillPassport, helping ${name} explore career opportunities.

Student Context:
- Name: ${name}
- Field of Study: ${field}
- Institution: ${university}

Your role:
- Provide personalized career guidance and recommendations
- Help explore career paths aligned with their field of study
- Suggest relevant skills, courses, and opportunities
- Answer questions about career development
- Be encouraging, supportive, and professional

Guidelines:
- Keep responses concise and actionable
- Focus on practical advice and next steps
- Reference their field of study when relevant
- Suggest specific resources or opportunities when appropriate
- Be honest about challenges while remaining optimistic`;
}
