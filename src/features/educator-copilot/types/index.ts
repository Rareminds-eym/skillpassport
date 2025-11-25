/**
 * Educator Copilot Types
 * Types specific to educator AI functionality
 */

export interface EducatorProfile {
  id: string;
  name: string;
  email: string;
  institution: string;
  department?: string;
  subjects?: string[];
  experience_years?: number;
}

export interface StudentSummary {
  id: string;
  name: string;
  department: string;
  year_of_study?: string;
  cgpa?: string;
  skills_count: number;
  projects_count: number;
  career_interests?: string[];
  last_active?: string;
  engagement_score?: number;
}

export interface ClassSummary {
  id: string;
  name: string;
  department: string;
  total_students: number;
  active_students: number;
  avg_engagement: number;
  common_interests: string[];
  skill_gaps: string[];
}

export interface StudentInsight {
  student_id: string;
  student_name: string;
  insight_type: 'strength' | 'gap' | 'interest' | 'concern' | 'opportunity';
  title: string;
  description: string;
  recommendation: string;
  priority: 'high' | 'medium' | 'low';
  action_items?: string[];
}

export interface ClassAnalytics {
  class_id: string;
  class_name: string;
  metrics: {
    total_students: number;
    active_rate: number;
    avg_skill_level: number;
    career_readiness_score: number;
  };
  trends: {
    popular_careers: { career: string; count: number }[];
    skill_gaps: { skill: string; frequency: number }[];
    emerging_interests: string[];
  };
  recommendations: string[];
}

export interface InterventionRecommendation {
  student_id: string;
  student_name: string;
  concern_type: 'disengagement' | 'skill_gap' | 'career_confusion' | 'performance';
  severity: 'critical' | 'high' | 'medium';
  description: string;
  suggested_actions: string[];
  resources?: string[];
  follow_up_timeline: string;
}

export interface EducatorContext {
  name: string;
  institution: string;
  department?: string;
  total_students: number;
  active_classes: number;
  subjects_taught: string[];
  recent_activities: string[];
}

export type EducatorIntent = 
  | 'student-insights'
  | 'class-analytics'
  | 'intervention-needed'
  | 'guidance-request'
  | 'skill-trends'
  | 'career-readiness'
  | 'resource-recommendation'
  | 'general';

export interface EducatorAIResponse {
  success: boolean;
  message?: string;
  data?: any;
  error?: string;
  interactive?: {
    cards?: any[];
    quickActions?: any[];
    suggestions?: any[];
    visualData?: any;
    metadata?: {
      encouragement?: string;
      nextSteps?: string[];
      intentHandled?: string;
    };
  };
}
