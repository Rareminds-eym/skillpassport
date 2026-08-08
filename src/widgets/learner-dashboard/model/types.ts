export interface LearnerDashboardWidgetProps {
  learnerId?: string;
  showAnalytics?: boolean;
}

export interface DashboardSection {
  id: string;
  title: string;
  visible: boolean;
  order: number;
}

// ===== Widget-Specific Prop Interfaces =====

// 1. StudentProfileCard Widget Props
export interface StudentProfileCardProps {
  learnerData: {
    id: string;
    name: string;
    email: string;
    avatar?: string;
    collegeId: string;
    collegeName: string;
    linkRangeId?: string;
    program: string;
    semester: number;
    enrollabilityScore: number;
    grade: string;
  };
  onViewProfile?: () => void;
}

export interface EnrollabilityScore {
  score: number; // 0-100
  status: 'excellent' | 'good' | 'average' | 'needs-improvement';
  factors: {
    skillCompleteness: number;
    learningProgress: number;
    certificationRate: number;
    activityLevel: number;
  };
}

// 2. AchievementStats Widget Props
export interface AchievementStatsProps {
  stats: {
    streak: number; // Days
    streakBest?: number;
    badges: number;
    badgesTotal?: number;
    certificates: number;
    lastActivity?: Date;
  };
  onViewAchievements?: () => void;
}

export interface Badge {
  id: string;
  name: string;
  icon: string;
  earnedAt: Date;
  category: 'skill' | 'completion' | 'streak' | 'special';
}

// 3. LearningMetrics Widget Props
export interface LearningMetricsProps {
  metrics: {
    coursesEnrolled: number;
    coursesCompleted: number;
    certificatesEarned: number;
    learningHours: number;
    courseCompletionRate: number; // 0-100
    inProgressCount: number;
    notStartedCount: number;
  };
  onViewCourses?: () => void;
}

export interface CourseStats {
  total: number;
  completed: number;
  inProgress: number;
  notStarted: number;
  completionRate: number; // Percentage
}

// 4. CareerAITools Widget Props
export interface CareerAIToolsProps {
  tools: CareerTool[];
  onToolSelect: (toolId: string) => void;
  userAccess: {
    hasAIAccess: boolean;
    remainingCredits?: number;
    planType: string;
  };
}

export interface CareerTool {
  id: string;
  name: string;
  description: string;
  icon: React.ReactNode;
  category: 'assessment' | 'preparation' | 'guidance';
  requiresSubscription: boolean;
  estimatedTime?: string; // e.g., "10 mins"
  path: string; // Navigation route
}

// 5. SkillPassportCard Widget Props
export interface SkillPassportCardProps {
  passport: {
    verifiedSkills: number;
    skillScore: number; // 0-100
    certificates: number;
    verificationStatus: 'active' | 'pending' | 'expired' | 'none';
    lastVerified?: Date;
    skills: SkillWithProficiency[];
  };
  onUpskill?: () => void;
  onViewDetails?: () => void;
}

export interface SkillWithProficiency {
  name?: string;
  skillName?: string;
  proficiency: number; // 0-100
}

export interface SkillCategory {
  category: 'healthy' | 'upskill' | 'critical';
  percentage: number;
  skillCount: number;
  skills: string[];
  color: string;
}

// 6. CurrentLearningPath Widget Props
export interface CurrentLearningPathProps {
  path: {
    id: string;
    name: string;
    progress: number; // 0-100
    currentModule?: string;
    totalModules: number;
    completedModules: number;
    estimatedCompletion?: Date;
    skills: string[];
  } | null;
  onContinue?: () => void;
  onChangePath?: () => void;
}

export interface LearningModule {
  id: string;
  title: string;
  status: 'completed' | 'in-progress' | 'locked';
  duration?: number; // minutes
  order: number;
}

// 7. OpportunitiesWidget Props
export interface OpportunitiesWidgetProps {
  opportunities: Opportunity[];
  matchedJobs?: AIMatchedJob[];
  onViewAll?: () => void;
  onApply?: (opportunityId: string) => void;
}

export interface Opportunity {
  id: string;
  title: string;
  company: string;
  location: string;
  employmentType: 'full-time' | 'internship' | 'contract';
  postedDate: Date;
  sector?: string;
  salary?: string;
  description?: string;
}

export interface AIMatchedJob extends Opportunity {
  matchScore: number; // 0-100
  matchReasons: string[];
  skillsMatched: string[];
  skillsGap: string[];
  isAIRecommended: true;
}

// 8. SkillsSnapshot Widget Props
export interface SkillsSnapshotProps {
  skills: SkillMetric[];
  onViewAll?: () => void;
  onImproveSkill?: (skillId: string) => void;
}

export interface SkillMetric {
  id: string;
  name: string;
  category: 'problem-solving' | 'communication' | 'technical' | 'teamwork' | 'critical-thinking';
  proficiency: number; // 0-100
  lastAssessed?: Date;
  assessmentSource: 'self' | 'test' | 'project' | 'ai-evaluated';
  trend: 'up' | 'down' | 'stable';
  recommendations?: string[];
}
