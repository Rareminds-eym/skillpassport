// Career AI Types and Interfaces

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
  technicalSkills: { name: string; level: number; type: string; verified: boolean }[];
  softSkills: { name: string; level: number }[];
  education: any[];
  experience: any[];
  projects: any[];
  trainings: any[];
  certificates: any[];
  hobbies: string[];
  interests: string[];
  languages: { name: string; proficiency: string }[];
}

export interface RecommendedCourse {
  code: string;
  title: string;
  skills: string[];
  category: string;
  duration: string;
  course_id: string;
  skill_type: 'technical' | 'soft';
  description: string;
  match_reasons: string[];
  relevance_score: number;
}

export interface CoursesByType {
  technical: RecommendedCourse[];
  soft: RecommendedCourse[];
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
  coursesByType: CoursesByType;
}

export interface CareerProgress {
  appliedJobs: { id: number; title: string; company: string; status: string; appliedAt: string }[];
  savedJobs: { id: number; title: string; company: string }[];
  courseEnrollments: { courseId: string; title: string; progress: number; status: string }[];
  recommendedCourses: { courseId: string; title: string; relevanceScore: number; matchReasons: string[] }[];
}

export interface Opportunity {
  id: number;
  title: string;
  company_name: string;
  employment_type: string;
  location: string;
  mode: string;
  experience_required: string;
  skills_required: string[];
  description: string;
  stipend_or_salary: string;
  deadline: string;
  is_active: boolean;
  sector: string;
  department: string;
}

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

export type ConversationPhase = 'opening' | 'exploring' | 'deep_dive' | 'follow_up';

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

// Course-related types
export interface CourseEnrollment {
  id: string;
  courseId: string;
  courseTitle: string;
  courseCode?: string;
  progress: number;
  status: string;
  enrolledAt: string;
  lastAccessed?: string;
  completedAt?: string;
  totalLessons?: number;
  completedLessons?: number;
  skillsAcquired?: string[];
  grade?: string;
  certificateUrl?: string;
}

export interface AvailableCourse {
  courseId: string;
  title: string;
  code: string;
  description: string;
  duration: string;
  category: string;
  skillType: 'technical' | 'soft';
  enrollmentCount: number;
  educatorName?: string;
}

export interface CourseContext {
  enrolledCourses: CourseEnrollment[];
  availableCourses: AvailableCourse[];
  totalEnrolled: number;
  inProgress: number;
  completed: number;
}

export interface JobMatchResult {
  opportunity: Opportunity;
  matchScore: number;
  matchingSkills: string[];
  missingSkills: string[];
  partialMatches: { studentSkill: string; jobSkill: string; similarity: number }[];
  matchReasons: string[];
  fieldAlignment: number;
}

export interface EnhancedOpportunity extends Opportunity {
  matchData?: JobMatchResult;
}

export interface IntentScore {
  intent: CareerIntent;
  score: number;
  confidence: 'high' | 'medium' | 'low';
  secondaryIntent?: CareerIntent;
}

// Agent-related types
export interface AgentStep {
  thought: string;
  action?: string;
  actionInput?: Record<string, any>;
  observation?: string;
  isFinal?: boolean;
}

export interface AgentExecutionResult {
  steps: AgentStep[];
  finalAnswer: string;
  toolsUsed: string[];
  executionTime: number;
}

// Guardrail types
export interface GuardrailResult {
  passed: boolean;
  reason?: string;
  sanitizedInput?: string;
  flags: string[];
}

// Memory types
export interface ConversationMemory {
  summary: string;
  topics: string[];
  entities: EntityMemory;
  lastIntent: CareerIntent;
  keyInsights: string[];
  actionItems: string[];
}

export interface EntityMemory {
  mentionedJobs: string[];
  mentionedSkills: string[];
  mentionedCompanies: string[];
  mentionedCourses: string[];
  userPreferences: Record<string, string>;
}

// API Response types
export interface CareerAIResponse {
  success: boolean;
  conversationId?: string;
  messageId?: string;
  intent?: CareerIntent;
  intentConfidence?: 'high' | 'medium' | 'low';
  phase?: ConversationPhase;
  hasAssessment?: boolean;
  executionTime?: number;
  error?: string;
}

// Streaming event types
export type StreamEventType = 'token' | 'done' | 'error';

export interface StreamEvent {
  type: StreamEventType;
  data: {
    content?: string;
    conversationId?: string;
    messageId?: string;
    intent?: string;
    error?: string;
  };
}
