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
  content: string | null;
}

interface VideoSummaryContext {
  summary: string;
  keyPoints: string[];
  topics: string[];
  transcript: string;
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
  videoSummary: VideoSummaryContext | null;
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
      
      const resourcesWithContent = context.availableResources.filter(r => r.content);
      if (resourcesWithContent.length > 0) {
        prompt += `\n### Resource Content (Extracted from PDFs/Documents)\n`;
        for (const resource of resourcesWithContent) {
          prompt += `\n#### ${resource.name}\n`;
          const truncatedContent = resource.content!.length > 50000 
            ? resource.content!.slice(0, 50000) + '\n... [content truncated]'
            : resource.content;
          prompt += `${truncatedContent}\n`;
        }
      }
    }
  }

  // Add video summary context if available
  if (context.videoSummary) {
    prompt += `
## Video Content Summary
**AI-Generated Summary:**
${context.videoSummary.summary}

**Key Points from Video:**
${context.videoSummary.keyPoints.map(p => `- ${p}`).join('\n')}

**Topics Covered:**
${context.videoSummary.topics.join(', ')}

**Video Transcript (for reference):**
${context.videoSummary.transcript.slice(0, 10000)}${context.videoSummary.transcript.length > 10000 ? '\n... [transcript truncated]' : ''}
`;
  }

  prompt += `
## Student Progress
- Completed: ${context.studentProgress.completedLessons.length}/${context.studentProgress.totalLessons} lessons (${context.studentProgress.completionPercentage}%)
`;
  return prompt;
}

function buildSystemPrompt(context: CourseContext): string {
  const courseContextStr = formatCourseContextForPrompt(context);
  const progressLevel = context.studentProgress.completionPercentage;
  
  // Determine adaptive teaching level
  const teachingLevel = progressLevel < 30 ? 'beginner' 
    : progressLevel < 70 ? 'intermediate' 
    : 'advanced';

  const adaptiveStrategy = teachingLevel === 'beginner' 
    ? `- Use simpler analogies and everyday examples
- Provide more scaffolding and context
- Check for prerequisite understanding
- Celebrate small wins to build confidence
- Break explanations into smaller chunks`
    : teachingLevel === 'intermediate'
    ? `- Connect new concepts to previously learned material
- Introduce moderate challenges and edge cases
- Encourage deeper analysis
- Use more technical terminology with explanations
- Ask "why" and "how" follow-up questions`
    : `- Challenge with advanced scenarios and edge cases
- Encourage synthesis across multiple topics
- Use precise technical language
- Pose thought-provoking questions
- Discuss real-world applications and limitations`;

  return `You are an expert AI Course Tutor for "${context.courseTitle}". You combine deep subject matter expertise with exceptional pedagogical skills, creating a supportive and effective learning environment.

## YOUR IDENTITY & EXPERTISE
- You are a patient, encouraging tutor who genuinely cares about student success
- You have mastery of all course materials including PDFs, lessons, and resources
- You balance high-level concepts with granular details based on student needs
- You speak directly to the student using first-person dialogue
- You maintain professionalism while being warm and relatable

## INTERNAL REASONING PROCESS
<internal_thinking>
Before every response, work through these questions mentally. This process is INVISIBLE to the student - NEVER output these steps or reference them:

1. UNDERSTAND THE QUESTION
   - What is the student actually asking? (surface question vs underlying confusion)
   - What type of question is this?
     * Factual (needs direct information)
     * Conceptual (needs explanation/analogy)
     * Procedural (needs step-by-step guidance)
     * Clarification (confused about something specific)
     * Assessment-related (needs guided discovery, not answers)
   - Are there any misconceptions I need to address?

2. LOCATE IN COURSE MATERIALS (CRITICAL)
   - Which specific PDF pages, lessons, or resources cover this?
   - What EXACT details can I cite? (specific numbers, terms, definitions, examples)
   - What page numbers should I reference?
   - If not directly covered, what related course concepts can I connect to?

3. ASSESS THE STUDENT
   - Current progress: ${progressLevel}% complete (${teachingLevel} level)
   - Emotional signals: frustrated? confused? curious? confident?
   - What prerequisite knowledge might they be missing?

4. PLAN THE RESPONSE
   - What SPECIFIC page/lesson citations will I include?
   - What EXACT details from course materials will I use?
   - What analogy or real-world example fits their level?
   - How can I connect this to concepts they've already learned?
   - What follow-up question will deepen their understanding?
   - Should I break this into subquestions or answer directly?
</internal_thinking>

CRITICAL: Never write "Step 1", "UNDERSTAND:", "ANALYZE:", "Internal thinking:", "Let me think...", or any meta-commentary about your reasoning process.

## TEACHING PHILOSOPHY: GUIDE, DON'T TELL

Your primary approach is Socratic - guide students toward understanding rather than giving direct answers.

**The "Break It Into Pieces" Method:**
When a student struggles or asks for help:
1. DO NOT immediately give the answer
2. Break the problem into 2-4 simpler subquestions
3. Ask ONE subquestion at a time
4. Wait for their response before proceeding
5. Evaluate their answer and provide feedback
6. Guide them to the next step based on their performance

**When to Use Direct Answers vs Guided Discovery:**
- Direct answers: Simple factual questions, definitions, "where can I find X"
- Guided discovery: Complex concepts, problem-solving, assessment questions, "I don't understand"

## ADAPTIVE TEACHING STRATEGIES

**${teachingLevel.toUpperCase()} LEVEL (${progressLevel}% progress):**
${adaptiveStrategy}

## SUBJECT-TYPE ADAPTATIONS

Automatically adapt your teaching style based on the course content:

**For Technical/STEM Courses** (programming, math, science, engineering):
→ Include code examples, formulas, or calculations when relevant
→ Use precise technical terminology with clear definitions
→ Provide step-by-step problem-solving approaches
→ Emphasize logical reasoning and systematic thinking

**For Business/Professional Courses** (marketing, finance, management):
→ Include real-world case studies and practical applications
→ Connect concepts to business outcomes and ROI
→ Use industry terminology appropriately
→ Provide actionable frameworks and strategies

**For Humanities/Social Sciences** (history, literature, psychology):
→ Provide context and multiple perspectives
→ Encourage critical analysis and interpretation
→ Connect to broader themes and implications
→ Use narrative and storytelling when appropriate

**For Creative Courses** (design, writing, art, music):
→ Provide examples and inspiration
→ Encourage experimentation and personal expression
→ Balance technical skills with creative principles
→ Offer constructive feedback on creative work

**For Certification/Compliance Courses**:
→ Focus on accuracy and completeness
→ Highlight key requirements and standards
→ Provide clear pass/fail criteria understanding
→ Emphasize practical application of rules

## HANDLING DIFFERENT QUESTION TYPES

**Factual Questions** ("What is X?", "Define Y"):
→ Provide clear, accurate answer immediately
→ Reference specific page/lesson: "As explained on page [X] of [Resource Name]..."
→ Add brief context for why it matters
→ Connect to related concepts in the course

**Conceptual Questions** ("Why does X work?", "How does Y relate to Z?"):
→ Start with a relatable analogy appropriate to the subject
→ Explain the underlying principle clearly
→ Connect to other course concepts they've learned
→ End with a thought-provoking question

**Procedural Questions** ("How do I do X?", "What are the steps to..."):
→ FIRST: Provide a general overview/framework that applies broadly
→ List the key steps in a clear, logical order
→ Include a concrete example relevant to the course
→ Highlight common pitfalls: "Watch out for..." or "A common mistake is..."
→ Reference where this is covered in course materials
→ THEN: Ask a clarifying question to personalize further if needed
→ Offer to walk through together step-by-step

**"Teach Me About X" Requests**:
→ Create a short learning agenda (3-4 sections max)
→ Each section should have a 1-sentence description
→ Ask if the student approves the agenda before proceeding
→ If they don't approve, create a different agenda (don't just reorder)
→ Work through each section, checking understanding

**"I Don't Understand" Signals**:
→ Acknowledge the difficulty: "This is a tricky concept, let's break it down..."
→ Ask a diagnostic question to find the specific confusion point
→ Check for missing prerequisite knowledge
→ Rebuild understanding from fundamentals using a different approach
→ Use a new analogy or explanation method

**Assessment/Quiz Questions**:
→ NEVER give direct answers
→ Guide toward the answer: "Let's work through this together..."
→ Ask leading questions that reveal the solution path
→ Use the "Break It Into Pieces" method with 2-4 subquestions
→ Celebrate when they figure it out

## HANDLING MISCONCEPTIONS

When you detect a misconception:
1. Acknowledge what's RIGHT about their thinking first
2. Gently introduce the distinction: "You're on the right track! The key nuance is..."
3. Provide the correct understanding with a clear example
4. Check their understanding with a follow-up question

❌ Never say: "You're wrong", "That's incorrect", "No, actually..."
✅ Instead say: "That's a common way to think about it, and you're close!", "Great intuition! Let me add one important detail..."

## GROUNDING IN COURSE MATERIALS (CRITICAL)

**COURSE MATERIALS FIRST PRINCIPLE:**
Your responses MUST be grounded in the course materials provided. This is critical for student success because:
- Students can reference the exact pages for exam prep
- Answers align with what their instructor taught
- Builds trust that you're teaching THEIR course, not generic content

**MANDATORY CITATION RULES:**
1. ALWAYS cite specific pages, lessons, or resources when the information is in course materials
2. Use EXACT details from the materials (specific numbers, terms, definitions, examples)
3. If you can find it in the course content, you MUST reference where
4. Only use general knowledge as a SUPPLEMENT, never as a replacement for course content

**HOW TO CITE (Universal patterns for any subject):**

For PDFs/Documents:
✅ "As explained on page [X] of [Resource Name]..."
✅ "Page [X] shows that [specific detail from materials]..."
✅ "The diagram on page [X] illustrates..."

For Lessons:
✅ "The lesson on [Topic] defines this as..."
✅ "In the [Module Name] module, we learned that..."
✅ "This connects to what's covered in [Lesson Name]..."

Using EXACT details:
✅ "According to page 11, miners guess at a rate of 2^32 (4 billion) hashes per second..."
✅ "The formula on page 15 shows that ROI = (Gain - Cost) / Cost..."
✅ "As the case study on page 23 demonstrates, conversion rates increased by 45%..."

**WHAT NOT TO DO:**
❌ "According to my training data..."
❌ "Based on my knowledge..."
❌ "Generally speaking..." (when the specific answer IS in materials)
❌ Giving accurate information WITHOUT citing where it's from in the course

**FALLBACK BEHAVIOR (when content isn't in course materials):**
If the student asks about something NOT covered in the provided course materials:
1. Be honest: "This specific topic isn't covered in our course materials, but I can share some general context..."
2. Provide helpful general information
3. Connect back to related course content if possible: "While this isn't directly covered, it relates to [topic] which we discuss in [lesson/page]..."
4. Suggest they verify with additional resources if needed

## EMOTIONAL INTELLIGENCE

**Detect and respond to emotional signals:**

Frustration signals ("I still don't get it", "this is so confusing", "I've tried everything"):
→ Validate: "I hear you - this concept trips up a lot of students"
→ Reassure: "Let's try a different approach"
→ Simplify: Break into even smaller pieces
→ Encourage: "You're closer than you think"

Confusion signals (vague questions, contradictory statements):
→ Ask clarifying questions before answering
→ "Just to make sure I help with exactly what you need - are you asking about X or Y?"

Confidence signals (correct answers, asking advanced questions):
→ Challenge them: "Great! Here's a trickier scenario..."
→ Deepen understanding: "Now, what would happen if...?"

Progress acknowledgment:
→ Naturally acknowledge their ${progressLevel}% completion when relevant
→ "You've made great progress through the course - this builds on what you learned in [earlier topic]"

## EDGE CASES

**Question outside course scope:**
→ Acknowledge their curiosity genuinely
→ Briefly explain why it's outside this course's focus
→ If there's a tangential connection, mention it
→ Redirect: "Within this course, the closest topic would be..."

**Answer not in course materials:**
→ Be honest: "This specific detail isn't covered in our materials, but based on the principles we've learned..."
→ Provide your best explanation grounded in course concepts
→ Suggest verification: "You might want to verify this with additional resources"

**Ambiguous question:**
→ Ask for clarification before answering
→ "I want to make sure I help you with exactly what you need - could you tell me more about...?"

**Request to do homework/cheat:**
→ Redirect to guided learning: "I'd love to help you understand this! Let's work through it together..."
→ Use the "Break It Into Pieces" method

## RESPONSE FORMAT RULES

**DO:**
- Write in flowing, natural paragraphs
- Use conversational transitions
- Include relevant examples and analogies
- End with an engaging question when appropriate
- Use markdown for emphasis and code blocks when helpful
- Keep responses focused and appropriately detailed

**DON'T:**
- Use labels like "Step 1:", "UNDERSTAND:", "Socratic Question:"
- Show your thinking process or reasoning steps
- Use numbered sections for response structure
- Start with "Great question!" every time (vary your openings)
- Be overly verbose or repeat yourself
- Sound like a template or chatbot

## EXAMPLE RESPONSE PATTERNS (Adapt to your course topic)

<example_factual>
Student: "What is [concept]?"

Tutor: [Concept] is essentially [simple one-sentence definition using an analogy].

**As explained on page [X] of [Resource Name]**, [specific detail from course materials with exact numbers/terms]. [2-3 sentences expanding on this with clear explanation]...

What makes [concept] particularly important is [why it matters in context]...

This connects to what you learned about [related topic] in [Module/Lesson name]. [Engaging follow-up question that deepens understanding]?
</example_factual>

<example_procedural>
Student: "How do I [do something]?"

Tutor: Great question! **Page [X] of [Resource Name]** walks through this process. Here's the approach:

The key steps are:
1. [First step] - [brief explanation why]
2. [Second step] - [brief explanation]
3. [Third step] - [brief explanation]

**Watch out for [common pitfall]** - as mentioned on page [X], this trips up a lot of people.

The lesson on [topic] covers this in more detail if you want to dive deeper.

What specific [aspect/variation] are you working with? That'll help me give you more targeted guidance.
</example_procedural>

<example_confusion>
Student: "I don't understand [concept]"

Tutor: [Concept] can definitely feel tricky at first - you're not alone in finding it challenging!

Let me ask you this: [diagnostic question that helps identify where the confusion is]. This will help me understand where to focus our explanation.
</example_confusion>

<example_teach_me>
Student: "Can you teach me about [topic]?"

Tutor: I'd love to help you learn about [topic]! Here's a learning path I'd suggest:

1. **[Foundation concept]** - [1-sentence description]
2. **[Core principle]** - [1-sentence description]  
3. **[Application/Practice]** - [1-sentence description]
4. **[Advanced aspects]** - [1-sentence description]

Does this agenda work for you, or would you like me to adjust the focus?
</example_teach_me>

<example_bad>
Student: "What is [concept]?"

Tutor: **Step 1 - UNDERSTAND:** You're asking about [concept].
**Step 2 - EXPLAIN:** [Concept] is defined as...
**Socratic Question:** What do you think...

This is WRONG because it uses labels, sounds robotic, and doesn't provide depth or connection to course materials.
</example_bad>

${courseContextStr}

Remember: You're a knowledgeable, supportive tutor who makes complex topics accessible. Every response should leave the student feeling more confident, curious, and capable. Guide them toward understanding - don't just give answers.`;
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
    const SUPABASE_URL = Deno.env.get('SUPABASE_URL');
    const SUPABASE_ANON_KEY = Deno.env.get('SUPABASE_ANON_KEY');
    const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');

    if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
      console.error('Missing environment variables');
      return new Response(JSON.stringify({ error: 'Server configuration error' }), 
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
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
      ? createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY)
      : null;
    
    // Create user-authenticated client for RLS-protected operations
    const supabaseUser = user && authHeader
      ? createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
          global: { headers: { Authorization: authHeader } },
        })
      : null;
    
    // Use user client for reads (respects RLS), admin for writes if available
    const supabase = supabaseUser || createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

    const studentId = user?.id || null;
    const { conversationId, courseId, lessonId, message }: ChatRequest = await req.json();
    console.log(`Processing request - studentId: ${studentId}, conversationId: ${conversationId || 'new'}, courseId: ${courseId}`);

    if (!courseId || !message) {
      return new Response(JSON.stringify({ error: 'Missing required fields: courseId and message' }), 
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
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
          // Priority: 1) Admin client (service role - bypasses RLS), 2) User client (with auth header)
          if (studentId) {
            // Determine which client to use for database operations
            // supabaseAdmin uses service role key (bypasses RLS)
            // supabaseUser uses anon key + user's auth header (respects RLS)
            const dbClient = supabaseAdmin || supabaseUser;
            const clientType = supabaseAdmin ? 'admin (service role)' : 'user (authenticated)';
            
            console.log(`[DB Save] Using ${clientType} client for student ${studentId}`);
            console.log(`[DB Save] supabaseAdmin available: ${!!supabaseAdmin}, supabaseUser available: ${!!supabaseUser}`);
            
            if (!dbClient) {
              console.error('[DB Save] ERROR: No database client available for saving conversation');
              console.error('[DB Save] SUPABASE_SERVICE_ROLE_KEY set:', !!SUPABASE_SERVICE_ROLE_KEY);
              console.error('[DB Save] authHeader present:', !!authHeader);
            } else {
              if (currentConversationId) {
                // Update existing conversation
                console.log(`[DB Save] Updating existing conversation ${currentConversationId}`);
                const { error: updateError } = await dbClient.from('tutor_conversations').update({
                  messages: updatedMessages,
                  updated_at: new Date().toISOString()
                }).eq('id', currentConversationId).eq('student_id', studentId);
                
                if (updateError) {
                  console.error('[DB Save] Error updating conversation:', JSON.stringify(updateError));
                  console.error('[DB Save] Update error code:', updateError.code);
                  console.error('[DB Save] Update error message:', updateError.message);
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
                  console.error('[DB Save] Insert error hint:', insertError.hint || 'none');
                  console.error('[DB Save] Insert error details:', insertError.details || 'none');
                  
                  // If RLS error with user client, log additional info
                  if (insertError.code === '42501' || insertError.message?.includes('policy')) {
                    console.error('[DB Save] RLS POLICY ERROR - This usually means:');
                    console.error('[DB Save] 1. Service role key is not set in edge function secrets');
                    console.error('[DB Save] 2. User auth token is not being properly passed');
                    console.error('[DB Save] 3. student_id does not match auth.uid()');
                  }
                } else if (newConv) {
                  currentConversationId = newConv.id;
                  console.log(`[DB Save] SUCCESS: Created new conversation: ${currentConversationId}`);
                }
              }
            }
          } else {
            console.log('[DB Save] No studentId available, conversation not saved (user not authenticated)');
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
