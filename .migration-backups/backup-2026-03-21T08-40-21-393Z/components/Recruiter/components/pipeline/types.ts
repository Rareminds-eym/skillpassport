// Pipeline component types

export interface PipelineCandidate {
  id: string; // UUID
  name: string;
  email: string;
  phone: string;
  dept: string;
  college: string;
  location: string;
  skills: string[];
  ai_score_overall: number;
  last_updated: string;
  created_at?: string;
  student_id: string; // UUID
  stage: string;
  source: string;
  next_action?: string;
  next_action_date?: string;
  added_at?: string;
}

export interface PipelineData {
  sourced: PipelineCandidate[];
  screened: PipelineCandidate[];
  interview_1: PipelineCandidate[];
  interview_2: PipelineCandidate[];
  offer: PipelineCandidate[];
  hired: PipelineCandidate[];
}

export interface AIRecommendation {
  applicantId: string; // UUID
  studentName: string;
  positionTitle: string;
  matchScore: number;
  confidence: 'high' | 'medium' | 'low';
  matchedSkills: string[];
  suggestedStage?: string;
}

export interface AIRecommendations {
  topRecommendations: AIRecommendation[];
  summary: {
    totalAnalyzed: number;
    highPotential: number;
    mediumPotential: number;
    lowPotential: number;
  };
}

export interface StageConfig {
  key: string;
  label: string;
  color: string;
}

export const STAGES: StageConfig[] = [
  { key: 'sourced', label: 'Sourced', color: 'bg-gray-400' },
  { key: 'screened', label: 'Screened', color: 'bg-blue-400' },
  { key: 'interview_1', label: 'Interview 1', color: 'bg-yellow-400' },
  { key: 'interview_2', label: 'Interview 2', color: 'bg-orange-400' },
  { key: 'offer', label: 'Offer', color: 'bg-green-400' },
  { key: 'hired', label: 'Hired', color: 'bg-emerald-400' }
];

export const STAGE_LABELS: Record<string, string> = {
  sourced: 'Sourced',
  screened: 'Screened',
  interview_1: 'Interview 1',
  interview_2: 'Interview 2',
  offer: 'Offer',
  hired: 'Hired'
};

export const NEXT_ACTIONS = [
  { value: 'send_email', label: 'Send Follow-up Email' },
  { value: 'schedule_interview', label: 'Schedule Interview' },
  { value: 'make_offer', label: 'Prepare Offer' },
  { value: 'follow_up', label: 'General Follow-up' },
  { value: 'review_application', label: 'Review Application' }
];
