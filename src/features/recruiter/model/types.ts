// Recruiter Feature - Model Types
// Re-export shared types for convenience
export type {
  Candidate,
  Job,
  PipelineStage,
  Pipeline,
  Shortlist,
  InterviewSlot,
  Scorecard,
  Offer,
  AnalyticsMetrics,
  AnalyticsFilters,
  RequisitionFilters,
  PipelineFilters,
  PipelineSortField,
  SortDirection,
  PipelineSortOptions,
  ExportConfig,
  ScheduledReport,
  TabKey,
  SortOption,
  FilterOption
} from '@/shared/types/recruiter';

// Feature-specific types
export interface ShortlistFilters {
  dateRange: {
    preset?: '7d' | '30d' | '90d' | 'ytd' | 'custom';
    startDate?: string;
    endDate?: string;
  };
  tags: string[];
  createdBy: string[];
  candidateCount?: string; // 'all' | '0-5' | '5-20' | '20-50' | '50+'
}

export interface OfferFilters {
  status?: string[];
  candidateName?: string;
  jobTitle?: string;
  dateRange?: {
    preset?: '7d' | '30d' | '90d' | 'ytd' | 'custom';
    startDate?: string;
    endDate?: string;
  };
  salaryRange?: {
    min?: number;
    max?: number;
  };
  expiryStatus?: 'all' | 'active' | 'expiring_soon' | 'expired';
  template?: string[];
}

export interface OfferSortOptions {
  field: 'inserted_at' | 'updated_at' | 'offer_date' | 'expiry_date' | 'candidate_name' | 'job_title' | 'offered_ctc' | 'status' | 'template' | 'response_date';
  direction: 'asc' | 'desc';
}

export interface RequisitionImportRow {
  job_title: string;
  company_name: string;
  department: string;
  location: string;
  work_mode: string;
  employment_type: string;
  experience_required: string;
  salary_range: string;
  description: string;
  requirements: string;
  posted_date: string;
  status: string;
}

export interface ToastType {
  id: string;
  type: 'success' | 'error' | 'info' | 'warning';
  title: string;
  message?: string;
}

export interface ProjectTab {
  id: 'all' | 'active-contracts' | 'proposals' | 'milestones' | 'analytics';
  label: string;
  icon: React.ComponentType<{ className?: string }>;
}

export interface QuickAction {
  id: string;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  onClick: () => void;
}

export interface BreadcrumbItem {
  label: string;
  href?: string;
  current?: boolean;
}

export interface ConversionMetric {
  label: string;
  from: string;
  to: string;
  rate: number;
  change: number;
}

export interface DiversityMetric {
  category: string;
  data: Array<{ label: string; count: number; percentage: number }>;
}

export interface GeographicLocation {
  city: string;
  count: number;
  percentage: number;
}

export interface TopCollege {
  name: string;
  count: number;
  percentage: number;
}
