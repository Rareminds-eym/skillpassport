/**
 * Shared TypeScript types for Career Assistant feature
 */

export interface StudentProfile {
  id: string;
  name: string;
  email: string;
  department: string;
  university: string;
  cgpa?: string;
  year_of_passing?: string;
  profile?: {
    technicalSkills?: TechnicalSkill[];
    softSkills?: SoftSkill[];
    education?: Education[];
    training?: Training[];
    experience?: Experience[];
    projects?: Project[];
    certificates?: Certificate[];
  };
}

export interface TechnicalSkill {
  name: string;
  level: number;
  category?: string;
  source?: string;
}

export interface SoftSkill {
  name: string;
  level?: number;
}

export interface Education {
  level?: string;
  degree?: string;
  department?: string;
  university?: string;
  cgpa?: string;
  yearOfPassing?: string;
}

export interface Training {
  course: string;
  skills?: string[];
  status?: string;
  duration?: string;
}

export interface Experience {
  role: string;
  company: string;
  duration?: string;
  type?: string;
}

export interface Project {
  title: string;
  description?: string;
  skills?: string[];
  technologies?: string[];
  techStack?: string[];
  status?: string;
  duration?: string;
}

export interface Certificate {
  name: string;
  issuer?: string;
  date?: string;
}

export interface JobMatch {
  job_id: number;
  job_title: string;
  company_name: string;
  match_score: number;
  match_reason: string;
  key_matching_skills: string[];
  skills_gap: string[];
  recommendation: string;
  opportunity?: Opportunity;
}

export interface Opportunity {
  id: number;
  title: string;
  company_name: string;
  employment_type: string;
  location: string;
  mode?: string;
  experience_required?: string;
  skills_required: string[] | string;
  description?: string;
  stipend_or_salary?: string;
  deadline?: string;
  application_link?: string;
  is_active?: boolean;
  status?: string;
  created_at?: string;
}

export interface ConversationMessage {
  role: 'system' | 'user' | 'assistant';
  content: string;
}

export interface StudentContext {
  name: string;
  department: string;
  university: string;
  cgpa?: string;
  year_of_passing?: string;
  technical_skills: {
    name: string;
    level: number;
    category?: string;
  }[];
  soft_skills: string[];
  experience_years: number;
  experience_roles: string[];
  completed_training: string[];
  education_level: string;
  total_experience_count: number;
  total_training_count: number;
}

export interface OpportunityContext {
  index: number;
  id: number;
  title: string;
  company: string;
  type: string;
  location: string;
  mode?: string;
  experience?: string;
  skills: string[];
  description?: string;
  salary?: string;
  deadline?: string;
}

export interface AIResponse {
  success: boolean;
  message?: string;
  data?: any;
  error?: string;
}

export type Intent = 
  | 'find-jobs'
  | 'skill-gap'
  | 'interview-prep'
  | 'resume-review'
  | 'learning-path'
  | 'career-guidance'
  | 'networking'
  | 'general';
