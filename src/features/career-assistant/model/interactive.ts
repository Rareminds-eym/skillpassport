/**
 * Interactive Response Types
 * Modern ChatGPT-style interactive elements for AI responses
 */

// ============================================================================
// CORE INTERACTIVE TYPES
// ============================================================================

export type ActionType = 'query' | 'navigate' | 'external' | 'function';
export type ButtonVariant = 'primary' | 'secondary' | 'outline' | 'ghost' | 'success' | 'warning';
export type CardType = 'job' | 'course' | 'skill' | 'project' | 'certification' | 'insight';

// ============================================================================
// ACTION BUTTON
// ============================================================================

export interface ActionButton {
  id: string;
  label: string;
  icon?: string;  // Lucide icon name
  variant: ButtonVariant;
  action: {
    type: ActionType;
    value: string;
    data?: any;  // Additional data for the action
  };
  disabled?: boolean;
  tooltip?: string;
}

// ============================================================================
// INTERACTIVE CARDS
// ============================================================================

export interface BaseCard {
  id: string;
  type: CardType;
  priority?: 'high' | 'medium' | 'low';
}

export interface JobCard extends BaseCard {
  type: 'job';
  data: {
    title: string;
    company: string;
    location: string;
    salary?: string;
    employmentType: string;
    matchScore: number;
    matchReason: string;
    tags: string[];  // Skills required
    deadline?: string;
  };
  actions: ActionButton[];
}

export interface CourseCard extends BaseCard {
  type: 'course';
  data: {
    title: string;
    platform: string;
    cost: string;  // "FREE", "$19.99", etc.
    duration: string;
    level: 'Beginner' | 'Intermediate' | 'Advanced';
    rating?: number;
    skills: string[];
    url?: string;
  };
  actions: ActionButton[];
}

export interface SkillCard extends BaseCard {
  type: 'skill';
  data: {
    name: string;
    demand: number;  // Percentage (0-100)
    impact: string;  // "+25% job opportunities"
    status: 'missing' | 'learning' | 'completed';
    priority: 'critical' | 'high' | 'medium' | 'low';
    timeToLearn: string;  // "4-6 weeks"
  };
  actions: ActionButton[];
}

export interface InsightCard extends BaseCard {
  type: 'insight';
  data: {
    title: string;
    description: string;
    metric?: {
      value: number;
      label: string;
      change?: string;  // "+15%", "-5%"
    };
    category: 'profile' | 'market' | 'comparison' | 'recommendation';
    severity?: 'info' | 'warning' | 'success' | 'error';
  };
  actions: ActionButton[];
}

export type InteractiveCard = JobCard | CourseCard | SkillCard | InsightCard;

// ============================================================================
// SUGGESTED ACTIONS (Quick Reply Chips)
// ============================================================================

export interface SuggestedAction {
  id: string;
  label: string;
  query: string;  // The query to send when clicked
  icon?: string;
}

// ============================================================================
// VISUALIZATION DATA
// ============================================================================

export interface ProgressBar {
  label: string;
  value: number;  // 0-100
  maxValue?: number;
  color?: 'blue' | 'green' | 'yellow' | 'red' | 'purple';
  showPercentage?: boolean;
}

export interface ScoreDisplay {
  score: number;
  maxScore: number;
  label: string;
  breakdown?: Array<{
    label: string;
    value: number;
    color?: string;
  }>;
}

export interface VisualizationData {
  progressBars?: ProgressBar[];
  scores?: ScoreDisplay[];
  stats?: Array<{
    label: string;
    value: string | number;
    icon?: string;
    trend?: 'up' | 'down' | 'neutral';
  }>;
}

// ============================================================================
// ENHANCED AI RESPONSE
// ============================================================================

export interface InteractiveElements {
  // Quick action buttons at the bottom
  quickActions?: ActionButton[];
  
  // Rich cards (jobs, courses, skills)
  cards?: InteractiveCard[];
  
  // Suggested follow-up queries
  suggestions?: SuggestedAction[];
  
  // Visual elements (progress bars, scores)
  visualData?: VisualizationData;
  
  // Response metadata
  metadata?: {
    intentHandled: string;
    processingTime?: number;
    dataSource?: string;
    encouragement?: string;  // Motivational message based on context
    nextSteps?: string[];     // Actionable next steps for the user
  };
}

export interface EnhancedAIResponse {
  success: boolean;
  message?: string;
  data?: any;
  error?: string;
  
  // NEW: Interactive elements
  interactive?: InteractiveElements;
}

// ============================================================================
// RESPONSE BUILDERS (Helper types for constructing responses)
// ============================================================================

export interface JobMatchResponseData {
  matches: Array<{
    job_id: number;
    job_title: string;
    company_name: string;
    match_score: number;
    match_reason: string;
    key_matching_skills: string[];
    skills_gap: string[];
    recommendation: string;
    opportunity: any;
  }>;
  totalOpportunities: number;
}

export interface SkillGapResponseData {
  missingSkills: string[];
  currentSkillsCount: number;
  recommendedSkillsCount: number;
  detailedGaps?: Array<{
    skill: string;
    demand: number;
    priority: string;
    impact: string;
  }>;
}

export interface ProfileAnalysisData {
  careerReadiness: {
    overall_score: number;
    breakdown: any;
    recommendations: string[];
  };
  profileHealth: {
    completeness_score: number;
    missing_sections: string[];
    improvement_suggestions: Array<{
      action: string;
      priority: string;
      impact: string;
    }>;
  };
}

