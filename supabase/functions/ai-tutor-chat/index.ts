import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient, SupabaseClient } from 'https://esm.sh/@supabase/supabase-js@2.38.4';

// Import from shared modules
import { corsHeaders, streamResponse, errorResponse } from '../_shared/cors.ts';
import { buildSystemPrompt, generateConversationTitlePrompt } from '../_shared/prompts/index.ts';
import type { 
  CourseContext, 
  ChatRequest, 
  StoredMessage,
  ModuleContext,
  LessonContext,
  ResourceContext,
  VideoSummaryContext
} from '../_shared/types.ts';

// ==================== COURSE CONTEXT BUILDER ====================

async function buildCourseContext(
  supabase: SupabaseClient,
  courseId: string,
  lessonId: string | null,
  studentId: string | null
): Promise<CourseContext> {
  const { data: course, error: courseError } = await supabase
    .from('courses')
    .select('course_id, title, description, code')
    .eq('course_id', courseId)
    .single();

  if (courseError || !course) {
    throw new Error(`Course not found: ${courseId}`);
  }

  const { data: modules } = await supabase
    .from('course_modules')
    .select('module_id, title, description, order_index')
    .eq('course_id', courseId)
    .order('order_index', { ascending: true });

  const allModules: ModuleContext[] = (modules || []).map(m => ({
    moduleId: m.module_id,
    title: m.title,
    description: m.description,
    orderIndex: m.order_index
  }));

  const { data: lessons } = await supabase
    .from('lessons')
    .select('lesson_id, title, description, content, duration, order_index, module_id')
    .in('module_id', allModules.length > 0 ? allModules.map(m => m.moduleId) : [''])
    .order('order_index', { ascending: true });


  const moduleMap = new Map<string, { title: string; lessons: { title: string; lessonId: string }[] }>();
  for (const module of allModules) {
    moduleMap.set(module.moduleId, { title: module.title, lessons: [] });
  }
  for (const lesson of lessons || []) {
    const entry = moduleMap.get(lesson.module_id);
    if (entry) {
      entry.lessons.push({ title: lesson.title, lessonId: lesson.lesson_id });
    }
  }
  const allLessons = Array.from(moduleMap.values());

  let currentLesson: LessonContext | null = null;
  let currentModule: ModuleContext | null = null;
  let availableResources: ResourceContext[] = [];

  if (lessonId) {
    const lessonData = (lessons || []).find(l => l.lesson_id === lessonId);
    if (lessonData) {
      const module = allModules.find(m => m.moduleId === lessonData.module_id);
      currentLesson = {
        lessonId: lessonData.lesson_id,
        title: lessonData.title,
        description: lessonData.description,
        content: lessonData.content,
        duration: lessonData.duration,
        orderIndex: lessonData.order_index,
        moduleTitle: module?.title || ''
      };
      currentModule = module || null;

      const { data: resources } = await supabase
        .from('lesson_resources')
        .select('resource_id, name, type, url, content')
        .eq('lesson_id', lessonId);

      availableResources = (resources || []).map(r => ({
        resourceId: r.resource_id,
        name: r.name,
        type: r.type,
        url: r.url,
        content: r.content || null
      }));
    }
  }

  let completedLessons: string[] = [];
  let currentLessonProgress: { status: string } | null = null;
  
  if (studentId) {
    const { data: progress } = await supabase
      .from('student_course_progress')
      .select('lesson_id, status')
      .eq('student_id', studentId)
      .eq('course_id', courseId);

    completedLessons = (progress || []).filter(p => p.status === 'completed').map(p => p.lesson_id);
    currentLessonProgress = lessonId ? (progress || []).find(p => p.lesson_id === lessonId) || null : null;
  }

  const totalLessons = (lessons || []).length;
  const completionPercentage = totalLessons > 0 ? Math.round((completedLessons.length / totalLessons) * 100) : 0;

  // Fetch video summary if available for current lesson
  let videoSummary: VideoSummaryContext | null = null;
  if (lessonId) {
    const { data: videoData } = await supabase
      .from('video_summaries')
      .select('summary, key_points, topics, transcript')
      .eq('lesson_id', lessonId)
      .eq('processing_status', 'completed')
      .single();

    if (videoData) {
      videoSummary = {
        summary: videoData.summary || '',
        keyPoints: videoData.key_points || [],
        topics: videoData.topics || [],
        transcript: videoData.transcript || ''
      };
    }
  }

  return {
    courseTitle: course.title,
    courseDescription: course.description || '',
    courseCode: course.code,
    currentModule,
    currentLesson,
    availableResources,
    studentProgress: { completedLessons, currentLessonStatus: currentLessonProgress?.status || null, totalLessons, completionPercentage },
    allModules,
    allLessons,
    videoSummary
  };
}

// ==================== MAIN HANDLER ====================

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const SUPABASE_URL = Deno.env.get('SUPABASE_URL');
    const SUPABASE_ANON_KEY = Deno.env.get('SUPABASE_ANON_KEY');
    const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');

    if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
      console.error('Missing environment variables');
      return errorResponse('Server configuration error', 500);
    }

    let user: { id: string } | null = null;
    const authHeader = req.headers.get('Authorization');
    
    if (authHeader && SUPABASE_SERVICE_ROLE_KEY) {
      try {
        const token = authHeader.replace('Bearer ', '');
        const supabaseAdmin = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);
        const { data: { user: authUser }, error: authError } = await supabaseAdmin.auth.getUser(token);
        
        if (!authError && authUser) {
          user = authUser;
          console.log(`AI Tutor chat request from user: ${user.id}`);
        } else {
          console.warn('Auth failed, continuing anonymous:', authError?.message);
        }
      } catch (authErr) {
        console.warn('Auth error, continuing anonymous:', authErr);
      }
    }

    // Create service role client for admin operations (bypasses RLS)
    const supabaseAdmin = SUPABASE_SERVICE_ROLE_KEY 
      ? createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, {
          auth: { persistSession: false, autoRefreshToken: false }
        })
      : null;
    
    // Create user-authenticated client for RLS-protected operations
    const supabaseUser = user && authHeader
      ? createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
          global: { headers: { Authorization: authHeader } },
          auth: { persistSession: false, autoRefreshToken: false }
        })
      : null;
    
    // Use user client for reads (respects RLS), admin for writes if available
    const supabase = supabaseUser || createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
      auth: { persistSession: false, autoRefreshToken: false }
    });
    
    console.log(`[Init] Service role key available: ${!!SUPABASE_SERVICE_ROLE_KEY}, User authenticated: ${!!user}, Auth header: ${!!authHeader}`);

    const studentId = user?.id || null;
    const { conversationId, courseId, lessonId, message }: ChatRequest = await req.json();
    console.log(`Processing request - studentId: ${studentId}, conversationId: ${conversationId || 'new'}, courseId: ${courseId}`);

    if (!courseId || !message) {
      return errorResponse('Missing required fields: courseId and message', 400);
    }

    const courseContext = await buildCourseContext(supabase, courseId, lessonId || null, studentId);
    const systemPrompt = buildSystemPrompt(courseContext);

    let currentConversationId = conversationId;
    let existingMessages: StoredMessage[] = [];

    if (conversationId && studentId) {
      const { data: conversation, error: convError } = await supabase
        .from('tutor_conversations')
        .select('messages')
        .eq('id', conversationId)
        .eq('student_id', studentId)
        .single();

      if (!convError && conversation) {
        existingMessages = conversation.messages || [];
      }
    }

    const userMessage: StoredMessage = {
      id: crypto.randomUUID(),
      role: 'user',
      content: message,
      timestamp: new Date().toISOString()
    };

    const aiMessages = [
      { role: 'system', content: systemPrompt },
      ...existingMessages.map(m => ({ role: m.role, content: m.content })),
      { role: 'user', content: message }
    ];

    const openRouterKey = Deno.env.get('OPENROUTER_API_KEY') || Deno.env.get('OPENAI_API_KEY');
    if (!openRouterKey) {
      return errorResponse('AI service not configured', 500);
    }

    const encoder = new TextEncoder();
    let fullResponse = '';


    const stream = new ReadableStream({
      async start(controller) {
        try {
          const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
            method: 'POST',
            headers: {
              'Authorization': `Bearer ${openRouterKey}`,
              'Content-Type': 'application/json',
              'HTTP-Referer': Deno.env.get('SUPABASE_URL') || '',
              'X-Title': 'AI Course Tutor'
            },
            body: JSON.stringify({
              model: 'openai/gpt-4o-mini',
              messages: aiMessages,
              stream: true,
              max_tokens: 10000,
              temperature: 0.7
            })
          });

          if (!response.ok) {
            const errorText = await response.text();
            console.error('OpenRouter error:', response.status, errorText);
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
                  const delta = parsed.choices?.[0]?.delta;
                  const content = delta?.content;
                  if (content) {
                    fullResponse += content;
                    controller.enqueue(encoder.encode(`event: token\ndata: ${JSON.stringify({ content })}\n\n`));
                  }
                } catch { /* skip */ }
              }
            }
          }

          const assistantMessage: StoredMessage = {
            id: crypto.randomUUID(),
            role: 'assistant',
            content: fullResponse,
            timestamp: new Date().toISOString()
          };

          const updatedMessages = [...existingMessages, userMessage, assistantMessage];

          // Save conversation to database
          if (studentId) {
            // Prefer supabaseUser (authenticated client) for RLS compliance
            // Fall back to supabaseAdmin only if user client unavailable
            const dbClient = supabaseUser || supabaseAdmin;
            const clientType = supabaseUser ? 'user (authenticated)' : supabaseAdmin ? 'admin (service role)' : 'none';
            
            console.log(`[DB Save] Using ${clientType} client for student ${studentId}`);
            console.log(`[DB Save] supabaseUser available: ${!!supabaseUser}, supabaseAdmin available: ${!!supabaseAdmin}`);
            
            if (!dbClient) {
              console.error('[DB Save] ERROR: No database client available for saving conversation');
              console.error('[DB Save] SUPABASE_SERVICE_ROLE_KEY set:', !!SUPABASE_SERVICE_ROLE_KEY);
              console.error('[DB Save] authHeader present:', !!authHeader);
              console.error('[DB Save] user object:', user ? 'exists' : 'null');
            } else {
              try {
                if (currentConversationId) {
                  // Update existing conversation
                  console.log(`[DB Save] Updating existing conversation ${currentConversationId}`);
                  const { data: updateData, error: updateError } = await dbClient.from('tutor_conversations').update({
                    messages: updatedMessages,
                    updated_at: new Date().toISOString()
                  }).eq('id', currentConversationId).eq('student_id', studentId).select('id').single();
                  
                  if (updateError) {
                    console.error('[DB Save] Error updating conversation:', JSON.stringify(updateError));
                    // Try with admin client as fallback
                    if (supabaseAdmin && dbClient !== supabaseAdmin) {
                      console.log('[DB Save] Retrying with admin client...');
                      const { error: retryError } = await supabaseAdmin.from('tutor_conversations').update({
                        messages: updatedMessages,
                        updated_at: new Date().toISOString()
                      }).eq('id', currentConversationId).eq('student_id', studentId);
                      if (retryError) {
                        console.error('[DB Save] Admin retry also failed:', JSON.stringify(retryError));
                      } else {
                        console.log(`[DB Save] SUCCESS (admin fallback): Updated conversation ${currentConversationId}`);
                      }
                    }
                  } else {
                    console.log(`[DB Save] SUCCESS: Updated conversation ${currentConversationId} with ${updatedMessages.length} messages`);
                  }
                } else {
                  // Create new conversation
                  let title = message.slice(0, 50);
                  try {
                    const titleResponse = await fetch('https://openrouter.ai/api/v1/chat/completions', {
                      method: 'POST',
                      headers: { 'Authorization': `Bearer ${openRouterKey}`, 'Content-Type': 'application/json' },
                      body: JSON.stringify({
                        model: 'openai/gpt-4o-mini',
                        messages: [{ role: 'user', content: generateConversationTitlePrompt(message, courseContext.courseTitle) }],
                        max_tokens: 60,
                        temperature: 0.5
                      })
                    });
                    if (titleResponse.ok) {
                      const titleData = await titleResponse.json();
                      title = titleData.choices?.[0]?.message?.content?.trim() || title;
                    }
                  } catch { /* use default */ }

                  console.log(`[DB Save] Creating new conversation for student ${studentId}, course ${courseId}, lesson ${lessonId || 'none'}`);
                  console.log(`[DB Save] Title: ${title.slice(0, 50)}`);
                  
                  const insertData = {
                    student_id: studentId,
                    course_id: courseId,
                    lesson_id: lessonId || null,
                    title: title.slice(0, 255),
                    messages: updatedMessages
                  };
                  console.log(`[DB Save] Insert data:`, JSON.stringify({ ...insertData, messages: `[${updatedMessages.length} messages]` }));
                  
                  const { data: newConv, error: insertError } = await dbClient.from('tutor_conversations').insert(insertData).select('id').single();

                  if (insertError) {
                    console.error('[DB Save] ERROR creating conversation:', JSON.stringify(insertError));
                    console.error('[DB Save] Insert error code:', insertError.code);
                    console.error('[DB Save] Insert error message:', insertError.message);
                    
                    // Try with admin client as fallback
                    if (supabaseAdmin && dbClient !== supabaseAdmin) {
                      console.log('[DB Save] Retrying insert with admin client...');
                      const { data: retryConv, error: retryError } = await supabaseAdmin.from('tutor_conversations').insert(insertData

          controller.enqueue(encoder.encode(`event: done\ndata: ${JSON.stringify({
            conversationId: currentConversationId,
            messageId: assistantMessage.id
          })}\n\n`));
          controller.close();
        } catch (error) {
          console.error('Streaming error:', error);
          controller.enqueue(encoder.encode(`event: error\ndata: ${JSON.stringify({ error: 'Stream processing error' })}\n\n`));
          controller.close();
        }
      }
    });

    return streamResponse(stream);

  } catch (error) {
    console.error('Error in ai-tutor-chat:', error);
    return errorResponse((error as Error)?.message || 'Internal server error', 500);
  }
});
