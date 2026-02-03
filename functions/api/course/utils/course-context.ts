/**
 * Course Context Builder for AI Tutor
 * 
 * Builds comprehensive course context including:
 * - Course information
 * - Module and lesson structure
 * - Current lesson content and resources
 * - Student progress
 * - Video summaries (if available)
 */

import { SupabaseClient } from '@supabase/supabase-js';
import { ConversationPhase, getPhaseInstructions } from './conversation-phases';

// ==================== TYPES ====================

export interface ModuleContext {
  moduleId: string;
  title: string;
  description: string | null;
  orderIndex: number;
}

export interface LessonContext {
  lessonId: string;
  title: string;
  description: string | null;
  content: string | null;
  duration: string | null;
  orderIndex: number;
  moduleTitle: string;
}

export interface ResourceContext {
  resourceId: string;
  name: string;
  type: string;
  url: string;
  content: string | null;
}

export interface VideoSummaryContext {
  summary: string;
  keyPoints: string[];
  topics: string[];
  transcript: string;
}

export interface ProgressContext {
  completedLessons: string[];
  currentLessonStatus: string | null;
  totalLessons: number;
  completionPercentage: number;
}

export interface CourseContext {
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

// ==================== CONTEXT BUILDER ====================

/**
 * Build comprehensive course context for AI tutor
 */
export async function buildCourseContext(
  supabase: SupabaseClient,
  courseId: string,
  lessonId: string | null,
  studentId: string | null
): Promise<CourseContext> {
  // Fetch course information
  const { data: course, error: courseError } = await supabase
    .from('courses')
    .select('course_id, title, description, code')
    .eq('course_id', courseId)
    .single();

  if (courseError || !course) {
    throw new Error(`Course not found: ${courseId}`);
  }

  // Fetch all modules for the course
  const { data: modules } = await supabase
    .from('course_modules')
    .select('module_id, title, description, order_index')
    .eq('course_id', courseId)
    .order('order_index', { ascending: true });

  const allModules: ModuleContext[] = (modules || []).map((m: any) => ({
    moduleId: m.module_id,
    title: m.title,
    description: m.description,
    orderIndex: m.order_index
  }));

  // Fetch all lessons for the course
  const { data: lessons } = await supabase
    .from('lessons')
    .select('lesson_id, title, description, content, duration, order_index, module_id')
    .in('module_id', allModules.length > 0 ? allModules.map(m => m.moduleId) : [''])
    .order('order_index', { ascending: true });

  // Build module-lesson map
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

  // Fetch current lesson details if lessonId provided
  let currentLesson: LessonContext | null = null;
  let currentModule: ModuleContext | null = null;
  let availableResources: ResourceContext[] = [];

  if (lessonId) {
    const lessonData = (lessons || []).find((l: any) => l.lesson_id === lessonId);
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

      // Fetch lesson resources
      const { data: resources } = await supabase
        .from('lesson_resources')
        .select('resource_id, name, type, url, content')
        .eq('lesson_id', lessonId);

      availableResources = (resources || []).map((r: any) => ({
        resourceId: r.resource_id,
        name: r.name,
        type: r.type,
        url: r.url,
        content: r.content || null
      }));
    }
  }

  // Fetch student progress if studentId provided
  let completedLessons: string[] = [];
  let currentLessonProgress: { status: string } | null = null;
  
  if (studentId) {
    const { data: progress } = await supabase
      .from('student_course_progress')
      .select('lesson_id, status')
      .eq('student_id', studentId)
      .eq('course_id', courseId);

    completedLessons = (progress || [])
      .filter((p: any) => p.status === 'completed')
      .map((p: any) => p.lesson_id);
    
    currentLessonProgress = lessonId 
      ? (progress || []).find((p: any) => p.lesson_id === lessonId) || null 
      : null;
  }

  const totalLessons = (lessons || []).length;
  const completionPercentage = totalLessons > 0 
    ? Math.round((completedLessons.length / totalLessons) * 100) 
    : 0;

  // Fetch video summary if available
  let videoSummary: VideoSummaryContext | null = null;
  if (lessonId) {
    const { data: videoData } = await supabase
      .from('video_summaries')
      .select('summary, key_points, topics, transcript')
      .eq('lesson_id', lessonId)
      .eq('processing_status', 'completed')
      .maybeSingle();

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
    studentProgress: { 
      completedLessons, 
      currentLessonStatus: currentLessonProgress?.status || null, 
      totalLessons, 
      completionPercentage 
    },
    allModules,
    allLessons,
    videoSummary
  };
}

// ==================== PROMPT FORMATTING ====================

/**
 * Format course context into a prompt string
 */
export function formatCourseContextForPrompt(context: CourseContext): string {
  let prompt = `## Course Information
- **Course**: ${context.courseTitle} (${context.courseCode})
- **Description**: ${context.courseDescription}

## Course Structure
`;

  // Add module and lesson structure
  for (const moduleGroup of context.allLessons) {
    prompt += `### ${moduleGroup.title}\n`;
    for (const lesson of moduleGroup.lessons) {
      const isCompleted = context.studentProgress.completedLessons.includes(lesson.lessonId);
      const isCurrent = context.currentLesson?.lessonId === lesson.lessonId;
      const status = isCurrent ? '📍 Current' : isCompleted ? '✅' : '○';
      prompt += `  ${status} ${lesson.title}\n`;
    }
  }

  // Add current lesson details
  if (context.currentLesson) {
    prompt += `
## Current Lesson: ${context.currentLesson.title}
**Module**: ${context.currentLesson.moduleTitle}
**Description**: ${context.currentLesson.description || 'No description'}

### Lesson Content
${context.currentLesson.content || 'No content available'}
`;

    // Add resources
    if (context.availableResources.length > 0) {
      prompt += `\n### Available Resources\n`;
      for (const resource of context.availableResources) {
        prompt += `- ${resource.name} (${resource.type})\n`;
      }
      
      // Add resource content (truncated if too long)
      const resourcesWithContent = context.availableResources.filter(r => r.content);
      if (resourcesWithContent.length > 0) {
        prompt += `\n### Resource Content\n`;
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

  // Add video summary if available
  if (context.videoSummary) {
    prompt += `
## Video Content Summary
**AI-Generated Summary:** ${context.videoSummary.summary}
**Key Points:** ${context.videoSummary.keyPoints.map(p => `- ${p}`).join('\n')}
**Topics:** ${context.videoSummary.topics.join(', ')}
**Transcript (excerpt):** ${context.videoSummary.transcript.slice(0, 10000)}${context.videoSummary.transcript.length > 10000 ? '\n... [truncated]' : ''}
`;
  }

  // Add student progress
  prompt += `
## Student Progress
- Completed: ${context.studentProgress.completedLessons.length}/${context.studentProgress.totalLessons} lessons (${context.studentProgress.completionPercentage}%)
`;

  return prompt;
}

/**
 * Build complete system prompt for AI tutor
 */
export function buildSystemPrompt(context: CourseContext, phase: ConversationPhase): string {
  const courseContextStr = formatCourseContextForPrompt(context);
  
  return `You are an expert AI Course Tutor for "${context.courseTitle}". You combine deep subject matter expertise with exceptional pedagogical skills.

## YOUR IDENTITY
- Patient, encouraging tutor who genuinely cares about student success
- Master of all course materials including PDFs, lessons, and resources
- Balance high-level concepts with granular details based on student needs

## TEACHING APPROACH
- Guide students toward understanding rather than giving direct answers
- Use the Socratic method when appropriate
- Break complex problems into smaller pieces
- Adapt to student's progress level (${context.studentProgress.completionPercentage}% complete)

## RESPONSE RULES
- Write in flowing, natural paragraphs
- Use conversational transitions
- Include relevant examples and analogies
- End with engaging questions when appropriate
- Reference course materials with specific citations

${courseContextStr}

${getPhaseInstructions(phase)}`;
}
