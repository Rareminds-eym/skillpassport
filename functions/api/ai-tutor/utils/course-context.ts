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

/**
 * Removed 2026-09-15 (post-cutover cleanup): formatCourseContextForPrompt,
 * getLearnerCourseChatPrompt, getEducatorWorksheetPrompt, getCoursePromptByRole
 * and buildSystemPrompt were Pages-side prompt assembly with zero callers
 * tree-wide after the tutor-chat + generate-material RPC cutovers (ai-worker
 * owns prompt packs + phase logic). buildCourseContext above is the live
 * reader and stays. Recorded in ai-worker/docs/migration.md.
 */
