// Career API Types

export interface ChatRequest {
  conversationId?: string;
  message: string;
  selectedChips?: string[];
}

export interface StoredMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: string;
}

export interface Opportunity {
  id: string;
  title: string;
  company_name?: string;
  location?: string;
  employment_type?: string;
  skills_required?: string[];
  is_active?: boolean;
  created_at?: string;
  [key: string]: any;
}

export type CareerIntent = 
  | 'find-jobs'
  | 'skill-gap'
  | 'interview-prep'
  | 'resume-review'
  | 'learning-path'
  | 'career-guidance'
  | 'assessment-insights'
  | 'application-status'
  | 'networking'
  | 'course-progress'
  | 'course-recommendation'
  | 'general';

export interface IntentScore {
  intent: CareerIntent;
  score: number;
  confidence: 'high' | 'medium' | 'low';
  secondaryIntent?: CareerIntent;
}

export type ConversationPhase = 'opening' | 'exploring' | 'deep_dive' | 'follow_up';

export interface StudentProfile {
  id: string;
  name: string;
  email: string;
  department: string;
  university: string;
  cgpa: string;
  yearOfPassing: string;
  grade: string;
  bio: string;
  technicalSkills: TechnicalSkill[];
  softSkills: SoftSkill[];
  education: any[];
  experience: any[];
  projects: any[];
  trainings: any[];
  certificates: any[];
  hobbies: string[];
  interests: string[];
  languages: string[];
}

export interface TechnicalSkill {
  name: string;
  level: number;
  type: string;
  verified: boolean;
}

export interface SoftSkill {
  name: string;
  level: number;
}

export interface AssessmentResults {
  hasAssessment: boolean;
  riasecCode: string;
  riasecScores: Record<string, number>;
  riasecInterpretation: string;
  aptitudeScores: Record<string, number>;
  aptitudeOverall: number;
  bigFiveScores: Record<string, number>;
  personalityInterpretation: string;
  employabilityScores: Record<string, number>;
  employabilityReadiness: string;
  careerFit: any[];
  skillGaps: any[];
  roadmap: any;
  overallSummary: string;
  coursesByType: {
    technical: any[];
    soft: any[];
  };
}

export interface CareerProgress {
  appliedJobs: AppliedJob[];
  savedJobs: SavedJob[];
  courseEnrollments: CourseEnrollmentProgress[];
  recommendedCourses: RecommendedCourse[];
}

export interface AppliedJob {
  id: string;
  title: string;
  company: string;
  status: string;
  appliedAt: string;
}

export interface SavedJob {
  id: string;
  title: string;
  company: string;
}

export interface CourseEnrollmentProgress {
  courseId: string;
  title: string;
  progress: number;
  status: string;
}

export interface RecommendedCourse {
  courseId: string;
  title: string;
  relevanceScore: number;
  matchReasons: string[];
}

export interface CourseContext {
  enrolledCourses: CourseEnrollment[];
  availableCourses: AvailableCourse[];
  totalEnrolled: number;
  inProgress: number;
  completed: number;
}

export interface CourseEnrollment {
  id: string;
  courseId: string;
  courseTitle: string;
  progress: number;
  status: string;
  enrolledAt: string;
  lastAccessed?: string;
  completedAt?: string;
  totalLessons?: number;
  completedLessons: number;
  skillsAcquired: string[];
  grade?: string;
  certificateUrl?: string;
}

export interface AvailableCourse {
  courseId: string;
  title: string;
  code: string;
  description: string;
  duration?: string;
  category: string;
  skillType: string;
  enrollmentCount: number;
  educatorName?: string;
}

export interface PhaseParameters {
  max_tokens: number;
  temperature: number;
  top_p: number;
  frequency_penalty: number;
  presence_penalty: number;
}

// Env type for Pages Functions
export interface Env {
  SUPABASE_URL: string;
  SUPABASE_ANON_KEY: string;
  SUPABASE_SERVICE_ROLE_KEY: string;
  OPENROUTER_API_KEY?: string;
  VITE_OPENROUTER_API_KEY?: string;
  VITE_SUPABASE_URL?: string;
  VITE_SUPABASE_ANON_KEY?: string;
  EMBEDDING_API_URL?: string;
  VITE_EMBEDDING_API_URL?: string;
}
