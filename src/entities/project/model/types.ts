/**
 * Project Entity - Type Definitions
 * Core project interfaces and types for the application
 */

// ============================================================================
// Core Project Types
// ============================================================================

export type ProjectStatus = 
  | 'draft' 
  | 'open' 
  | 'in_progress' 
  | 'completed' 
  | 'cancelled';

export type ProjectCategory = 
  | 'web_development'
  | 'mobile_app'
  | 'data_science'
  | 'ui_ux_design'
  | 'content_writing'
  | 'marketing'
  | 'devops'
  | 'blockchain'
  | 'ai_ml'
  | 'other';

export type ProjectPriority = 'low' | 'medium' | 'high' | 'urgent';

export type ProjectVisibility = 'public' | 'private' | 'invited_only';

export interface Project {
  id: string;
  recruiter_id: string;
  title: string;
  description: string;
  category: ProjectCategory;
  budget_min?: number;
  budget_max?: number;
  currency: string;
  duration_value?: number;
  duration_unit?: 'days' | 'weeks' | 'months';
  skills_required: string[];
  experience_required: 'Entry' | 'Mid' | 'Senior' | 'Expert';
  deliverables: string[];
  milestones: ProjectMilestone[];
  status: ProjectStatus;
  priority: ProjectPriority;
  visibility: ProjectVisibility;
  max_proposals: number;
  proposal_count: number;
  hired_freelancer_id?: string;
  posted_at: string;
  deadline_for_proposals?: string;
  project_start_date?: string;
  project_end_date?: string;
  completed_at?: string;
  created_at: string;
  updated_at: string;
}

// ============================================================================
// Milestone Types
// ============================================================================

export interface ProjectMilestone {
  name: string;
  description?: string;
  amount: number;
  deadline?: string;
}

export interface ProposalMilestone extends ProjectMilestone {
  deliverables?: string[];
}

export interface ContractMilestone extends ProjectMilestone {
  id: string;
  order_index: number;
  status: MilestoneStatus;
  submission_url?: string;
  submission_notes?: string;
  submitted_at?: string;
  approved_at?: string;
  paid_at?: string;
}

export type MilestoneStatus =
  | 'pending'
  | 'in_progress'
  | 'submitted'
  | 'approved'
  | 'rejected'
  | 'paid';

// ============================================================================
// Proposal Types
// ============================================================================

export type ProposalStatus =
  | 'submitted'
  | 'under_review'
  | 'shortlisted'
  | 'accepted'
  | 'rejected'
  | 'withdrawn';

export interface Proposal {
  id: string;
  project_id: string;
  learner_id: string;
  learner?: LearnerProfile;
  cover_letter: string;
  proposed_budget: number;
  proposed_timeline: string;
  proposed_milestones: ProposalMilestone[];
  relevant_experience?: string;
  portfolio_links: string[];
  sample_work_links: string[];
  status: ProposalStatus;
  recruiter_rating?: number;
  recruiter_notes?: string;
  questions_answers: QA[];
  submitted_at: string;
  reviewed_at?: string;
  updated_at: string;
}

export interface LearnerProfile {
  id: string;
  name: string;
  email: string;
  photo?: string;
  university?: string;
  department?: string;
  cgpa?: number;
  skills?: string[];
  bio?: string;
}

// ============================================================================
// Contract Types
// ============================================================================

export type ContractStatus = 
  | 'active' 
  | 'completed' 
  | 'terminated' 
  | 'disputed';

export type PaymentSchedule = 'milestone_based' | 'hourly' | 'fixed';

export interface ProjectContract {
  id: string;
  project_id: string;
  proposal_id: string;
  learner_id: string;
  recruiter_id: string;
  learner?: LearnerProfile;
  project?: Project;
  agreed_budget: number;
  agreed_timeline: string;
  agreed_milestones: ContractMilestone[];
  total_paid: number;
  payment_schedule: PaymentSchedule;
  status: ContractStatus;
  contract_document_url?: string;
  terms_and_conditions?: string;
  completion_percentage: number;
  quality_rating?: number;
  signed_at: string;
  started_at?: string;
  completed_at?: string;
  updated_at: string;
}

// ============================================================================
// Review Types
// ============================================================================

export interface ProjectReview {
  id: string;
  project_id: string;
  contract_id: string;
  recruiter_rating?: number;
  recruiter_review?: string;
  recruiter_would_rehire?: boolean;
  learner_rating?: number;
  learner_review?: string;
  learner_would_work_again?: boolean;
  quality_rating?: number;
  communication_rating?: number;
  timeliness_rating?: number;
  professionalism_rating?: number;
  created_at: string;
  updated_at: string;
}

// ============================================================================
// Filter and Analytics Types
// ============================================================================

export interface ProjectFilters {
  status: ProjectStatus[];
  categories: ProjectCategory[];
  budgetRange: { min?: number; max?: number };
  skills: string[];
  priority: string[];
  dateRange: { start?: string; end?: string };
}

export interface ProjectAnalytics {
  total: number;
  byStatus: {
    draft: number;
    open: number;
    in_progress: number;
    completed: number;
    cancelled: number;
  };
  totalBudget: number;
  avgProposals: number;
  conversionRate: number;
  avgCompletionTime: number;
}

// ============================================================================
// Q&A Types
// ============================================================================

export interface QA {
  question: string;
  answer?: string;
  asked_by: 'recruiter' | 'learner';
  timestamp: string;
}

// ============================================================================
// Learner Portfolio Project Types
// ============================================================================

export interface LearnerProject {
  id: string;
  title: string;
  description: string;
  tech_stack: string[];
  status: string;
  organization: string;
  start_date?: string;
  end_date?: string;
  project_url?: string;
  github_url?: string;
  demo_url?: string;
  images?: string[];
  achievements?: string[];
  role?: string;
  team_size?: number;
}
