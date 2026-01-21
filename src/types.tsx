// Candidate Types
export interface Candidate {
  id: string;
  name: string;
  email: string;
  phone: string;
  location: string;
  currentRole: string;
  experience: string;
  skills: string[];
  avatar: string;
  status: 'active' | 'interviewing' | 'offered' | 'hired' | 'rejected' | 'withdrawn';
  stage: string;
  applied: string;
  lastActivity: string;
  match: number;
  notes?: string;
  resume?: string;
  linkedIn?: string;
  portfolio?: string;
  salary?: {
    current?: string;
    expected?: string;
  };
  availability?: string;
}

// Job/Requisition Types
export interface Job {
  id: string;
  title: string;
  department: string;
  location: string;
  type: 'full-time' | 'part-time' | 'contract' | 'internship';
  experience: string;
  salary: string;
  description: string;
  requirements: string[];
  posted: string;
  status: 'open' | 'paused' | 'closed' | 'draft';
  applicants: number;
  hired: number;
}

// Pipeline/Stage Types
export interface PipelineStage {
  id: string;
  name: string;
  candidates: Candidate[];
  color: string;
}

export interface Pipeline {
  id: string;
  jobId: string;
  stages: PipelineStage[];
}

// Shortlist Types
export interface Shortlist {
  id: string;
  name: string;
  description?: string;
  candidates: Candidate[];
  createdBy: string;
  createdAt: string;
  updatedAt: string;
  tags?: string[];
  isShared: boolean;
  sharedWith?: string[];
}

// Interview Types
export interface InterviewSlot {
  id: string;
  candidateId: string;
  candidateName: string;
  interviewerName: string;
  interviewerEmail: string;
  datetime: string;
  duration: number;
  type: 'phone' | 'video' | 'in-person' | 'technical';
  status: 'scheduled' | 'completed' | 'cancelled' | 'no-show';
  meetingLink?: string;
  notes?: string;
  location?: string;
  jobTitle: string;
}

export interface Scorecard {
  id: string;
  candidateId: string;
  interviewId: string;
  interviewerName: string;
  datetime: string;
  overallRating: number;
  categories: {
    technical: number;
    communication: number;
    cultural_fit: number;
    problem_solving: number;
  };
  strengths: string[];
  concerns: string[];
  recommendation: 'strong_hire' | 'hire' | 'no_hire' | 'strong_no_hire';
  notes: string;
}

// Offers Types
export interface Offer {
  id: string;
  candidateId: string;
  candidateName: string;
  jobTitle: string;
  salary: string;
  startDate: string;
  status: 'draft' | 'sent' | 'accepted' | 'declined' | 'expired' | 'withdrawn';
  sentDate?: string;
  responseDate?: string;
  expiryDate: string;
  notes?: string;
  benefits?: string[];
  equity?: string;
  bonus?: string;
  location: string;
}

// Analytics Types
export interface AnalyticsMetrics {
  funnel: {
    applications: number;
    screenings: number;
    interviews: number;
    offers: number;
    hires: number;
  };
  quality: {
    offerAcceptanceRate: number;
    interviewToOfferRate: number;
    sourceQuality: { source: string; hireRate: number }[];
  };
  speed: {
    avgTimeToHire: number;
    avgTimeToInterview: number;
    avgTimeToOffer: number;
  };
  diversity: {
    gender: { label: string; percentage: number }[];
    ethnicity: { label: string; percentage: number }[];
  };
  attribution: {
    sources: { source: string; candidates: number; hires: number }[];
    topPerformers: { recruiter: string; hires: number }[];
  };
}

// Component Props Types
export interface HeaderProps {
  onMenuToggle: () => void;
  showMobileMenu: boolean;
}

export interface SidebarProps {
  activeTab: string;
  setActiveTab: (tab: string) => void;
  showMobileMenu: boolean;
}

export interface MobileTabBarProps {
  activeTab: string;
  setActiveTab: (tab: string) => void;
  onMoreMenuToggle: () => void;
}

export interface CandidateProfileDrawerProps {
  candidate: Candidate | null;
  isOpen: boolean;
  onClose: () => void;
}

export interface TalentPoolProps {
  onViewProfile: (candidate: Candidate) => void;
}

export interface PipelinesProps {
  onViewProfile: (candidate: Candidate) => void;
}

// Utility Types
export type TabKey =
  | 'overview'
  | 'requisitions'
  | 'talent_pool'
  | 'pipelines'
  | 'shortlists'
  | 'interviews'
  | 'offers_&_decisions'
  | 'analytics'
  | 'settings';

export type SortOption = 'name' | 'applied' | 'match' | 'status' | 'stage';
export type FilterOption = 'all' | 'active' | 'interviewing' | 'offered' | 'hired';
