// ==================== SHARED TYPES ====================
// Types used across AI Tutor edge functions

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

export interface ChatRequest {
  conversationId?: string;
  courseId: string;
  lessonId?: string;
  message: string;
}

export interface StoredMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: string;
}
