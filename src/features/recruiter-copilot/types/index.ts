/**
 * Recruiter Copilot Types
 * Types specific to recruiter AI functionality
 */

export interface RecruiterProfile {
  id: string;
  name: string;
  email: string;
  company: string;
  department?: string;
  specializations?: string[];
  experience_years?: number;
}

export interface CandidateSummary {
  id: string;
  name: string;
  email?: string;
  institution?: string;
  graduation_year?: string;
  cgpa?: string;
  skills: string[];
  projects_count: number;
  training_count: number;
  experience_count: number;
  career_interests: string[];
  location?: string;
  availability?: string;
  last_active?: string;
  profile_completeness?: number;
}

export interface JobPostingSummary {
  id: string;
  title: string;
  company: string;
  department?: string;
  location: string;
  job_type: 'full-time' | 'part-time' | 'internship' | 'contract';
  required_skills: string[];
  preferred_skills?: string[];
  experience_required: string;
  applicants_count: number;
  matches_count?: number;
  status: 'active' | 'closed' | 'draft';
  posted_date?: string;
}

export interface CandidateInsight {
  candidate_id: string;
  candidate_name: string;
  insight_type: 'top-match' | 'emerging-talent' | 'skill-gap' | 'high-potential' | 'ready-to-hire';
  title: string;
  description: string;
  recommendation: string;
  priority: 'high' | 'medium' | 'low';
  match_score?: number;
  matched_skills?: string[];
  missing_skills?: string[];
  action_items?: string[];
}

export interface JobAnalytics {
  job_id: string;
  job_title: string;
  metrics: {
    total_applicants: number;
    qualified_candidates: number;
    avg_match_score: number;
    skill_coverage: number;
  };
  trends: {
    top_candidate_skills: { skill: string; count: number }[];
    skill_gaps: { skill: string; frequency: number }[];
    candidate_locations: { location: string; count: number }[];
  };
  recommendations: string[];
}

export interface TalentPoolAnalytics {
  total_candidates: number;
  by_skill: { skill: string; count: number }[];
  by_location: { location: string; count: number }[];
  by_experience: { level: string; count: number }[];
  emerging_skills: string[];
  top_institutions: { institution: string; count: number }[];
  availability_summary: {
    immediate: number;
    within_month: number;
    within_three_months: number;
  };
}

export interface HiringRecommendation {
  candidate_id: string;
  candidate_name: string;
  job_id: string;
  job_title: string;
  match_score: number;
  strength_areas: string[];
  growth_areas: string[];
  hiring_readiness: 'ready' | 'almost-ready' | 'needs-development';
  suggested_actions: string[];
  interview_tips?: string[];
}

export interface RecruiterContext {
  name: string;
  company: string;
  department?: string;
  active_jobs: number;
  total_candidates: number;
  specializations: string[];
  recent_activities: string[];
  hiring_goals?: {
    roles: string[];
    timeline: string;
    key_skills: string[];
  };
}

export type RecruiterIntent =
  | 'candidate-search'
  | 'candidate-query'
  | 'opportunity-applications'
  | 'hiring-decision'
  | 'talent-pool-analytics'
  | 'job-matching'
  | 'hiring-recommendations'
  | 'skill-insights'
  | 'market-trends'
  | 'interview-guidance'
  | 'candidate-assessment'
  | 'pipeline-review'
  | 'general';

export interface RecruiterAIResponse {
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

export interface CandidateMatchResult {
  candidate: CandidateSummary;
  job: JobPostingSummary;
  match_score: number;
  matched_skills: string[];
  missing_skills: string[];
  additional_strengths: string[];
  recommendation: string;
}
