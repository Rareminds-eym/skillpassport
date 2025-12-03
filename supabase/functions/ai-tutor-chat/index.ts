import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient, SupabaseClient } from 'https://esm.sh/@supabase/supabase-js@2.38.4';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
};

// ==================== TYPES ====================

interface ModuleContext {
  moduleId: string;
  title: string;
  description: string | null;
  orderIndex: number;
}

interface LessonContext {
  lessonId: string;
  title: string;
  description: string | null;
  content: string | null;
  duration: string | null;
  orderIndex: number;
  moduleTitle: string;
}

interface ResourceContext {
  resourceId: string;
  name: string;
  type: string;
  url: string;
}

interface ProgressContext {
  completedLessons: string[];
  currentLessonStatus: string | null;
  totalLessons: number;
  completionPercentage: number;
}

interface CourseContext {
  courseTitle: string;
  courseDescription: string;
  courseCode: string;
  currentModule: ModuleContext | null;
  currentLesson: LessonContext | null;
  availableResources: ResourceContext[];
  studentProgress: ProgressContext;
  allModules: ModuleContext[];
  allLessons: { title: string; lessons: { title: string; lessonId: string }[] }[];
}

interface ChatRequest {
  conversationId?: string;
  courseId: string;
  lessonId?: string;
  message: string;
}

interface StoredMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: string;
}


// ==================== COURSE CONTEXT BUILDER ====================

async function buildCourseContext(
  supabase: SupabaseClient,
  courseId: string,
  lessonId: string | null,
  studentId: string
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
        .select('resource_id, name, type, url')
        .eq('lesson_id', lessonId);

      availableResources = (resources || []).map(r => ({
        resourceId: r.resource_id,
        name: r.name,
        type: r.type,
        url: r.url
      }));
    }
  }

  const { data: progress } = await supabase
    .from('student_course_progress')
    .select('lesson_id, status')
    .eq('student_id', studentId)
    .eq('course_id', courseId);

  const completedLessons = (progress || []).filter(p => p.status === 'completed').map(p => p.lesson_id);
  const currentLessonProgress = lessonId ? (progress || []).find(p => p.lesson_id === lessonId) : null;
  const totalLessons = (lessons || []).length;
  const completionPercentage = totalLessons > 0 ? Math.round((completedLessons.length / totalLessons) * 100) : 0;

  return {
    courseTitle: course.title,
    courseDescription: course.description || '',
    courseCode: course.code,
    currentModule,
    currentLesson,
    availableResources,
    studentProgress: { completedLessons, currentLessonStatus: currentLessonProgress?.status || null, totalLessons, completionPercentage },
    allModules,
    allLessons
  };
}


// ==================== SYSTEM PROMPT BUILDER ====================

function formatCourseContextForPrompt(context: CourseContext): string {
  let prompt = `## Course Information
- **Course**: ${context.courseTitle} (${context.courseCode})
- **Description**: ${context.courseDescription}

## Course Structure
`;
  for (const moduleGroup of context.allLessons) {
    prompt += `### ${moduleGroup.title}\n`;
    for (const lesson of moduleGroup.lessons) {
      const isCompleted = context.studentProgress.completedLessons.includes(lesson.lessonId);
      const isCurrent = context.currentLesson?.lessonId === lesson.lessonId;
      const status = isCurrent ? '📍 Current' : isCompleted ? '✅' : '○';
      prompt += `  ${status} ${lesson.title}\n`;
    }
  }

  if (context.currentLesson) {
    prompt += `
## Current Lesson: ${context.currentLesson.title}
**Module**: ${context.currentLesson.moduleTitle}
**Description**: ${context.currentLesson.description || 'No description'}

### Lesson Content
${context.currentLesson.content || 'No content available'}
`;
    if (context.availableResources.length > 0) {
      prompt += `\n### Available Resources\n`;
      for (const resource of context.availableResources) {
        prompt += `- ${resource.name} (${resource.type})\n`;
      }
    }
  }

  prompt += `
## Student Progress
- Completed: ${context.studentProgress.completedLessons.length}/${context.studentProgress.totalLessons} lessons (${context.studentProgress.completionPercentage}%)
`;
  return prompt;
}

function buildSystemPrompt(context: CourseContext): string {
  const courseContextStr = formatCourseContextForPrompt(context);
  return `You are an AI Course Tutor for "${context.courseTitle}". Your role is to help students understand the course material, answer questions, and guide them through their learning journey.

## Your Responsibilities
1. Answer questions about the course content accurately and helpfully
2. Explain concepts from the current lesson and related materials
3. Reference specific lessons, modules, and resources when relevant
4. Provide examples and analogies to clarify difficult concepts
5. Encourage students and acknowledge their progress
6. Guide students to relevant course materials when appropriate

## Important Guidelines
- **Stay on topic**: Focus your responses on the course content. If a student asks about topics outside this course, politely redirect them back to course-relevant topics.
- **Be encouraging**: Acknowledge the student's progress (${context.studentProgress.completionPercentage}% complete) and motivate them to continue learning.
- **Reference materials**: When explaining concepts, mention which lesson or module covers the topic in detail.
- **Be concise but thorough**: Provide clear, well-structured answers without unnecessary verbosity.
- **Use the lesson content**: When the student is viewing a specific lesson, prioritize information from that lesson's content.

## Handling Out-of-Scope Questions
If a student asks about topics not covered in this course:
- Acknowledge their curiosity
- Explain that the topic is outside the scope of this course
- Suggest they explore other resources for that topic
- Gently redirect to related course content if applicable

${courseContextStr}

Remember: You are a helpful, knowledgeable tutor focused on helping students succeed in this specific course. Always be supportive and educational in your responses.`;
}

function generateConversationTitlePrompt(firstMessage: string, courseTitle: string): string {
  return `Generate a short, descriptive title (max 50 characters) for a tutoring conversation about "${courseTitle}" that starts with this student question:

"${firstMessage}"

Return ONLY the title text, no quotes or extra formatting.`;
}


// ==================== MAIN HANDLER ====================

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    // ===== AUTHENTICATION CHECK =====
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      console.error('Missing authorization header');
      return new Response(JSON.stringify({ error: 'Missing authorization header' }), 
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }

    // ===== ENVIRONMENT VARIABLES CHECK =====
    const SUPABASE_URL = Deno.env.get('SUPABASE_URL');
    const SUPABASE_ANON_KEY = Deno.env.get('SUPABASE_ANON_KEY');

    if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
      console.error('Missing environment variables:', { 
        hasUrl: !!SUPABASE_URL, 
        hasAnonKey: !!SUPABASE_ANON_KEY 
      });
      return new Response(JSON.stringify({ error: 'Server configuration error' }), 
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }

    // Extract token from Authorization header
    const token = authHeader.replace('Bearer ', '');
    
    // Get service role key for JWT verification (required per Supabase docs)
    const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');
    if (!SUPABASE_SERVICE_ROLE_KEY) {
      console.error('Missing SUPABASE_SERVICE_ROLE_KEY');
      return new Response(JSON.stringify({ error: 'Server configuration error' }), 
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }

    // Create admin client to verify JWT (official Supabase pattern)
    const supabaseAdmin = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);
    
    // Verify the JWT token using admin client
    const { data: { user }, error: authError } = await supabaseAdmin.auth.getUser(token);
    if (authError || !user) {
      console.error('Authentication failed:', authError?.message || 'No user found');
      return new Response(JSON.stringify({ error: 'Unauthorized - Invalid token' }), 
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }
    
    // Create regular client for database operations (respects RLS)
    const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
      global: { headers: { Authorization: authHeader } },
    });

    console.log(`AI Tutor chat request from user: ${user.id}`);

    const studentId = user.id;
    const { conversationId, courseId, lessonId, message }: ChatRequest = await req.json();

    if (!courseId || !message) {
      return new Response(JSON.stringify({ error: 'Missing required fields: courseId and message' }), 
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }

    const courseContext = await buildCourseContext(supabase, courseId, lessonId || null, studentId);
    const systemPrompt = buildSystemPrompt(courseContext);

    let currentConversationId = conversationId;
    let existingMessages: StoredMessage[] = [];

    if (conversationId) {
      const { data: conversation, error: convError } = await supabase
        .from('tutor_conversations')
        .select('messages')
        .eq('id', conversationId)
        .eq('student_id', studentId)
        .single();

      if (convError || !conversation) {
        return new Response(JSON.stringify({ error: 'Conversation not found or access denied' }), 
          { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
      }
      existingMessages = conversation.messages || [];
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
      return new Response(JSON.stringify({ error: 'AI service not configured' }), 
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
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
              model: 'x-ai/grok-4.1-fast:free',
              messages: aiMessages,
              stream: true,
              max_tokens: 10000,
              temperature: 0.7,
              reasoning: {
                effort: 'high'
              }
            })
          });

          if (!response.ok) {
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
          let fullReasoning = '';

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
                  
                  // Handle reasoning_details (thinking tokens from grok/reasoning models)
                  if (delta?.reasoning_details) {
                    const reasoningContent = typeof delta.reasoning_details === 'string' 
                      ? delta.reasoning_details 
                      : delta.reasoning_details?.content || '';
                    if (reasoningContent) {
                      fullReasoning += reasoningContent;
                      controller.enqueue(encoder.encode(`event: reasoning\ndata: ${JSON.stringify({ reasoning: reasoningContent })}\n\n`));
                    }
                  }
                  
                  // Handle reasoning field (alternative format)
                  if (delta?.reasoning) {
                    fullReasoning += delta.reasoning;
                    controller.enqueue(encoder.encode(`event: reasoning\ndata: ${JSON.stringify({ reasoning: delta.reasoning })}\n\n`));
                  }
                  
                  // Handle regular content
                  const content = delta?.content;
                  if (content) {
                    fullResponse += content;
                    controller.enqueue(encoder.encode(`event: token\ndata: ${JSON.stringify({ content })}\n\n`));
                  }
                } catch { /* skip */ }
              }
            }
          }
          
          // Log reasoning if present (for debugging)
          if (fullReasoning) {
            console.log('AI Reasoning:', fullReasoning.slice(0, 500) + '...');
          }

          const assistantMessage: StoredMessage = {
            id: crypto.randomUUID(),
            role: 'assistant',
            content: fullResponse,
            timestamp: new Date().toISOString()
          };

          const updatedMessages = [...existingMessages, userMessage, assistantMessage];

          if (currentConversationId) {
            await supabase.from('tutor_conversations').update({
              messages: updatedMessages,
              updated_at: new Date().toISOString()
            }).eq('id', currentConversationId);
          } else {
            let title = message.slice(0, 50);
            try {
              const titleResponse = await fetch('https://openrouter.ai/api/v1/chat/completions', {
                method: 'POST',
                headers: { 'Authorization': `Bearer ${openRouterKey}`, 'Content-Type': 'application/json' },
                body: JSON.stringify({
                  model: 'x-ai/grok-4.1-fast:free',
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

            const { data: newConv } = await supabase.from('tutor_conversations').insert({
              student_id: studentId,
              course_id: courseId,
              lesson_id: lessonId || null,
              title: title.slice(0, 255),
              messages: updatedMessages
            }).select('id').single();

            if (newConv) currentConversationId = newConv.id;
          }

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

    return new Response(stream, {
      headers: { ...corsHeaders, 'Content-Type': 'text/event-stream', 'Cache-Control': 'no-cache', 'Connection': 'keep-alive' }
    });

  } catch (error) {
    console.error('Error in ai-tutor-chat:', error);
    return new Response(JSON.stringify({ error: (error as Error)?.message || 'Internal server error' }), 
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
  }
});
