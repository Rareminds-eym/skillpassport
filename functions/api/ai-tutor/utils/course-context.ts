/**
 * Course Context Builder for AI Tutor
 * 
 * Builds comprehensive course context including:
 * - Course information
 * - Module and lesson structure
 * - Current lesson content and resources
 * - Learner progress
 * - Video summaries (if available)
 */

import { SupabaseClient } from '@supabase/supabase-js';
import { ConversationPhase, getPhaseInstructions } from './conversation-phases';
import type { WorksheetConfig } from '../types/worksheet';
import { buildWorksheetPrompt } from './worksheet-templates';
import type { LessonPlanConfig } from '../types/lesson-plan';
import { buildLessonPlanPrompt } from './lesson-plan-templates';

// ==================== USER ROLE TYPES ====================

export type CourseUserRole = 'learner' | 'educator';

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
  learnerProgress: ProgressContext;
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
  learnerId: string | null
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

  // Fetch learner progress if learnerId provided
  let completedLessons: string[] = [];
  let currentLessonProgress: { status: string } | null = null;
  
  if (learnerId) {
    const { data: progress } = await supabase
      .from('learner_course_progress')
      .select('lesson_id, status')
      .eq('learner_id', learnerId)
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
    learnerProgress: { 
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
 * Format course context into a prompt string (optimized for free tier token limits)
 */
export function formatCourseContextForPrompt(context: CourseContext): string {
  let prompt = `## Course: ${context.courseTitle}
`;

  // Add ONLY current lesson details (skip full course structure to save tokens)
  if (context.currentLesson) {
    prompt += `## Current Lesson: ${context.currentLesson.title}
Module: ${context.currentLesson.moduleTitle}

`;
    
    // Truncate lesson content to 500 chars max
    if (context.currentLesson.content) {
      const truncatedContent = context.currentLesson.content.length > 500
        ? context.currentLesson.content.slice(0, 500) + '...'
        : context.currentLesson.content;
      prompt += `${truncatedContent}\n\n`;
    }

    // Add video summary (key points only, no transcript)
    if (context.videoSummary && context.videoSummary.keyPoints.length > 0) {
      prompt += `Key Points:\n${context.videoSummary.keyPoints.slice(0, 3).map(p => `- ${p}`).join('\n')}\n\n`;
    }

    // List resources (names only, no content)
    if (context.availableResources.length > 0) {
      prompt += `Resources: ${context.availableResources.map(r => r.name).join(', ')}\n`;
    }
  } else {
    // No specific lesson - just course overview
    prompt += `${context.courseDescription.slice(0, 200)}...\n`;
  }

  return prompt;
}

// ==================== ROLE-BASED PROMPT TEMPLATES ====================

/**
 * Learner Course Chat Prompt Template
 * 
 * This template can be edited to change how the AI behaves when tutoring learners.
 * The AI acts as a helpful course tutor that explains concepts clearly.
 */
function getLearnerCourseChatPrompt(context: CourseContext, phase: ConversationPhase): string {
  const courseContextStr = formatCourseContextForPrompt(context);
  
  return `You are a helpful course tutor for learners studying "${context.courseTitle}".

Your job:
- Help the learner understand the course content.
- Answer using the provided course material.
- Explain clearly and step by step.
- Ask guiding questions when useful.
- Do not generate educator-only resources such as worksheets, grading rubrics, lesson plans, or answer keys unless explicitly allowed.

Rules:
- Use the course content as your main source.
- If the course content does not contain enough information, say that clearly.
- Do not invent facts outside the provided material.
- Keep the tone friendly, simple, and educational.

${courseContextStr}

${getPhaseInstructions(phase)}`;
}

/**
 * Educator Worksheet Prompt Template
 * 
 * This template can be edited to change how the AI generates worksheets for educators.
 * The AI acts as a teaching assistant that creates classroom-ready materials.
 */
function getEducatorWorksheetPrompt(context: CourseContext): string {
  const courseContextStr = formatCourseContextForPrompt(context);
  
  return `You are an expert teaching assistant for educators working with "${context.courseTitle}".

Your job:
- Create high-quality worksheets from the provided course content.
- Make the worksheet classroom-ready.
- Include clear instructions and an answer key.

Worksheet format:
Title:
Learning Objective:
Difficulty Level:
Instructions:
Questions:
Answer Key:
Optional Extension Activity:

Rules:
- Use the provided course content as the source.
- Do not invent unsupported facts.
- Make the worksheet clear, structured, and useful for classroom learning.
- If grade level or difficulty is provided, adapt the worksheet to it.
- If not provided, choose a reasonable general difficulty and mention it.

${courseContextStr}`;
}

/**
 * Get course prompt by user role
 * 
 * Selects the appropriate prompt template based on the user's role.
 * This is the main entry point for role-based prompt selection.
 */
function getCoursePromptByRole(
  userRole: string,
  context: CourseContext,
  phase: ConversationPhase
): string {
  // Normalize role to handle variations (educator, school_educator, college_educator)
  const normalizedRole = userRole.toLowerCase();
  
  if (normalizedRole.includes('educator')) {
    return getEducatorWorksheetPrompt(context);
  }
  
  if (normalizedRole === 'learner') {
    return getLearnerCourseChatPrompt(context, phase);
  }
  
  // Default to learner prompt for unknown roles
  return getLearnerCourseChatPrompt(context, phase);
}

/**
 * Build complete system prompt for AI (with role-based behavior)
 * 
 * @param context - Course context with lesson content and resources
 * @param phase - Conversation phase (opening, exploring, deep_dive)
 * @param userRole - User role (learner, educator, etc.)
 * @param worksheetConfig - Optional worksheet configuration (educators only)
 * @param lessonPlanConfig - Optional lesson plan configuration (educators only)
 */
export function buildSystemPrompt(
  context: CourseContext,
  phase: ConversationPhase,
  userRole: string = 'learner',
  worksheetConfig?: WorksheetConfig,
  lessonPlanConfig?: LessonPlanConfig
): string {
  const normalizedRole = userRole.toLowerCase();
  
  // If educator with lesson plan config, use lesson plan template system
  if (normalizedRole.includes('educator') && lessonPlanConfig) {
    return buildLessonPlanPrompt(lessonPlanConfig, context);
  }
  
  // If educator with worksheet config, use worksheet template system
  if (normalizedRole.includes('educator') && worksheetConfig) {
    return buildWorksheetPrompt(worksheetConfig, context);
  }
  
  // Otherwise use role-based prompts
  return getCoursePromptByRole(userRole, context, phase);
}
