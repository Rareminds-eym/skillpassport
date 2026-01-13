/**
 * Environment variables for the worker
 */
export interface Env {
  OPENROUTER_API_KEY: string;
  GEMINI_API_KEY: string;
  SUPABASE_URL?: string;
  SUPABASE_SERVICE_ROLE_KEY?: string;
  ENVIRONMENT: string;
}

/**
 * Industry demand data structure
 */
export interface IndustryDemandData {
  description: string;
  demandLevel: 'Low' | 'Medium' | 'High' | 'Very High';
  demandPercentage: number;
}

/**
 * Career progression stage
 */
export interface CareerStage {
  title: string;
  yearsExperience: string;
}

/**
 * Learning roadmap phase
 */
export interface RoadmapPhase {
  month: string;
  title: string;
  description: string;
  tasks: string[];
  color: string;
}

/**
 * Recommended course structure
 */
export interface RecommendedCourse {
  title: string;
  description: string;
  duration: string;
  level: 'Beginner' | 'Intermediate' | 'Advanced' | 'Professional';
  skills: string[];
}

/**
 * Free resource structure
 */
export interface FreeResource {
  title: string;
  description: string;
  type: 'YouTube' | 'Documentation' | 'Certification' | 'Community' | 'Tool';
  url: string;
}

/**
 * Action item structure
 */
export interface ActionItem {
  title: string;
  description: string;
}

/**
 * Suggested project structure
 */
export interface SuggestedProject {
  title: string;
  description: string;
  difficulty: 'Beginner' | 'Intermediate' | 'Advanced';
  skills: string[];
  estimatedTime: string;
}

/**
 * Combined role overview data structure
 */
export interface RoleOverviewData {
  responsibilities: string[];
  industryDemand: IndustryDemandData;
  careerProgression: CareerStage[];
  learningRoadmap: RoadmapPhase[];
  recommendedCourses: RecommendedCourse[];
  freeResources: FreeResource[];
  actionItems: ActionItem[];
  suggestedProjects: SuggestedProject[];
}

/**
 * Request body for role overview endpoint
 */
export interface RoleOverviewRequest {
  roleName: string;
  clusterTitle: string;
}

/**
 * API Response wrapper
 */
export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
  source?: 'openrouter' | 'gemini' | 'fallback';
}

/**
 * Course input for matching
 */
export interface CourseInput {
  id: string;
  title: string;
  description: string;
  skills?: string[];
  category?: string;
  duration?: string;
  level?: string;
}

/**
 * Request body for course matching endpoint
 */
export interface CourseMatchingRequest {
  roleName: string;
  clusterTitle: string;
  courses: CourseInput[];
}

/**
 * Course matching result
 */
export interface CourseMatchingResult {
  matchedCourseIds: string[];
  reasoning: string;
}
