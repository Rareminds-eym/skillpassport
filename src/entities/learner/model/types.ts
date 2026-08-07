export interface EducationData {
  degree: string; // required: true
  university: string; // required: true
  department?: string;
  yearOfPassing?: string;
  cgpa?: string;
  level?: 'High School' | 'Associate' | "Bachelor's" | "Master's" | 'PhD' | 'Certificate' | 'Diploma';
  status?: 'ongoing' | 'completed';
}

export interface TrainingData {
  course: string; // required: true
  provider: string; // required: true
  startDate?: string;
  endDate?: string;
  status?: 'ongoing' | 'completed';
  completedModules?: number;
  totalModules?: number;
  hoursSpent?: number;
  skills?: SkillData[];
  description?: string;
  duration?: string;
}

export interface ExperienceData {
  role: string; // required: true
  organization: string; // required: true
  start_date?: string;
  end_date?: string;
  description?: string;
}

export interface ProjectData {
  title: string; // required: true
  description?: string;
  technologies?: string[];
  role?: string;
  startDate?: string;
  endDate?: string;
  githubUrl?: string;
  demoUrl?: string;
}

export interface CertificateData {
  title: string; // required: true
  issuer: string; // required: true
  credentialId?: string;
  issuedOn?: string;
  expiryDate?: string;
  link?: string;
  description?: string;
  category?: string;
  level?: string;
  platform?: string;
  instructor?: string;
}

export interface SkillData {
  name: string; // required: true
  type?: 'technical' | 'soft';
  level?: 'Beginner' | 'Intermediate' | 'Advanced' | 'Expert';
  rating?: '1' | '2' | '3' | '4' | '5';
  description?: string;
  yearsOfExperience?: number;
  certifications?: string;
  examples?: string;
}

export interface PersonalInfoData {
  name: string; // required: true
  email?: string;
  phone?: string;
  location?: string;
  bio?: string;
  linkedinUrl?: string;
  githubUrl?: string;
  portfolioUrl?: string;
}

export interface LearnerUpdateData {
  name?: string;
  email?: string;
  phone?: string;
  location?: string;
  bio?: string;
  linkedinUrl?: string;
  githubUrl?: string;
  portfolioUrl?: string;
  [key: string]: unknown;
}

export interface TrainingUpdateData extends Partial<TrainingData> {
  id?: string;
  title?: string;
  course?: string;
  provider?: string;
  organization?: string;
  startDate?: string;
  start_date?: string;
  endDate?: string;
  end_date?: string;
  completedModules?: number;
  completed_modules?: number;
  totalModules?: number;
  total_modules?: number;
  hoursSpent?: number;
  hours_spent?: number;
  skills?: SkillData[];
}

export interface UserCreateData {
  email: string;
  firstName?: string;
  lastName?: string;
  user_role?: string;
  role?: string;
  dateOfBirth?: string;
}

export interface ServiceResponse<T = unknown> {
  success: boolean;
  data: T | null;
  error: string | null;
}

export interface Learner {
  id: string;
  universityId?: string;
  email: string;
  name: string;
  age?: number;
  date_of_birth?: string;
  contact_number?: string;
  alternate_number?: string;
  district_name?: string;
  university?: string;
  branch_field?: string;
  college_school_name?: string;
  registration_number?: string;
  github_link?: string;
  linkedin_link?: string;
  twitter_link?: string;
  facebook_link?: string;
  instagram_link?: string;
  portfolio_link?: string;
  other_social_links?: Record<string, string>[];
  approval_status?: string;
  created_at?: string;
  updated_at?: string;
}

export interface LearnerData {
  name?: string;
  email: string;
  phone?: string;
  learnerType?: string;
  schoolId?: string;
  collegeId?: string;
  country?: string;
  state?: string;
  city?: string;
  preferredLanguage?: string;
  referralCode?: string;
}

export interface RegistrationData extends LearnerData {
  fullName?: string;
  firstName?: string;
  lastName?: string;
  dateOfBirth?: string;
}

export interface UserRecord {
  id: string;
  email: string;
  firstName?: string;
  lastName?: string;
  role: string;
  isActive: boolean;
  dob?: string;
  createdAt: string;
  updatedAt: string;
}

export interface EducationRecord {
  id: string;
  learner_id: string;
  level?: string;
  degree?: string;
  department?: string;
  university?: string;
  year_of_passing?: string;
  cgpa?: string;
  status?: string;
  approval_status: string;
  created_at: string;
  updated_at: string;
  enabled: boolean;
  pending_edit_data?: any;
  has_pending_edit: boolean;
  verified_data?: any;
}

export interface TrainingRecord {
  id: string;
  learner_id: string;
  title: string;
  organization?: string;
  start_date?: string;
  end_date?: string;
  duration?: string;
  description?: string;
  status: string;
  completed_modules: number;
  total_modules: number;
  hours_spent: number;
  course_id?: string;
  source: string;
  approval_status: string;
  approval_authority: string;
  approved_by?: string;
  approved_at?: string;
  approval_notes?: string;
  rejected_by?: string;
  rejected_at?: string;
  created_at: string;
  updated_at: string;
  embedding?: any;
  has_pending_edit: boolean;
  verified_data?: any;
  pending_edit_data?: any;
  enabled: boolean;
}

export interface ExperienceRecord {
  id: string;
  learner_id: string;
  organization: string;
  role: string;
  start_date?: string;
  end_date?: string;
  duration?: string;
  description?: string;
  verified?: boolean;
  approval_status?: string;
  enabled?: boolean;
  created_at?: string;
  updated_at?: string;
  has_pending_edit: boolean;
  verified_data?: any;
  pending_edit_data?: any;
}

export interface ProjectRecord {
  id: string;
  learner_id: string;
  title: string;
  description?: string;
  role?: string;
  start_date?: string;
  end_date?: string;
  duration?: string;
  organization?: string;
  tech_stack?: string[];
  demo_link?: string;
  github_link?: string;
  enabled?: boolean;
  approval_status?: string;
  created_at?: string;
  updated_at?: string;
  certificate_url?: string;
  video_url?: string;
  ppt_url?: string;
  status?: string;
}

export interface CertificateRecord {
  id: string;
  learner_id: string;
  title: string;
  issuer: string;
  credential_id?: string;
  issued_on?: string;
  expiry_date?: string;
  link?: string;
  description?: string;
  category?: string;
  level?: string;
  platform?: string;
  instructor?: string;
  status?: string;
  approval_status?: string;
  enabled?: boolean;
  created_at?: string;
  updated_at?: string;
  has_pending_edit: boolean;
  verified_data?: any;
  pending_edit_data?: any;
}

export interface SkillRecord {
  id: string;
  learner_id: string;
  training_id?: string;
  name: string;
  type: 'technical' | 'soft';
  level?: number;
  proficiency_level?: string;
  rating?: number;
  description?: string;
  examples?: string;
  verified?: boolean;
  enabled?: boolean;
  approval_status?: string;
  yearsOfExperience?: number;
  certifications?: string;
  created_at?: string;
  updated_at?: string;
}

export interface ProfileData {
  name: string;
  email: string;
  passportId: string;
  department?: string;
  university?: string;
  photo?: string;
  verified?: boolean;
  employabilityScore?: number;
  cgpa?: string;
  yearOfPassing?: string;
  phone?: string;
  alternatePhone?: string;
  age?: number;
  dateOfBirth?: string;
  district?: string;
  college?: string;
  registrationNumber?: string;
  classYear?: string;
  github_link?: string;
  portfolio_link?: string;
  linkedin_link?: string;
  twitter_link?: string;
  instagram_link?: string;
  facebook_link?: string;
  other_social_links?: Record<string, string>[];
}

// Assessment result types - discriminated union for strict typing
export interface BaseAssessmentResult {
  id?: string;
  assessment_id?: string;
  name?: string;
  score?: number;
  total_marks?: number;
  percentage?: number;
  status?: 'completed' | 'pending' | 'in_progress';
  completed_at?: string;
}

export interface IAAssessmentResult extends BaseAssessmentResult {
  type: 'IA';
  subject?: string;
  weightage?: number;
}

export interface EndSemesterAssessmentResult extends BaseAssessmentResult {
  type: 'end_semester';
  semester?: string;
  duration?: string;
}

export interface PracticalAssessmentResult extends BaseAssessmentResult {
  type: 'practical';
  duration?: string;
  equipment_used?: string;
  observer_name?: string;
}

export interface VivaAssessmentResult extends BaseAssessmentResult {
  type: 'viva';
  examiner_name?: string;
  questions_asked?: number;
  performance_rating?: string;
}

export interface ArrearsAssessmentResult extends BaseAssessmentResult {
  type: 'arrears';
  original_exam_date?: string;
  attempt_number?: number;
}

export interface CareerReadinessAssessmentResult extends BaseAssessmentResult {
  type: 'career_readiness';
  skills_identified?: string[];
  recommendations?: string;
  riasec_scores?: Record<string, number>;
}

export interface AptitudeAssessmentResult extends BaseAssessmentResult {
  type: 'aptitude';
  test_phase?: string;
  category?: string;
} //save

export type AssessmentResult =
  | IAAssessmentResult
  | EndSemesterAssessmentResult
  | PracticalAssessmentResult
  | VivaAssessmentResult
  | ArrearsAssessmentResult
  | CareerReadinessAssessmentResult
  | AptitudeAssessmentResult;

export interface SkillPassport {
  id: string;
  learner_id: string;
  projects?: ProjectRecord[];
  certificates?: CertificateRecord[];
  assessments?: AssessmentResult[];
  status?: string;
  aiVerification?: boolean;
  nsqfLevel?: string;
  skills?: SkillRecord[];
  createdAt?: string;
  updatedAt?: string;
}

// Profile data type
export interface ProfileObject {
  [key: string]: string | number | boolean | null;
}

// Update interfaces that support both frontend (camelCase) and database (snake_case) field names
export interface EducationUpdateData {

  degree?: string;
  university?: string;
  department?: string;
  yearOfPassing?: string;
  year_of_passing?: string;
  cgpa?: string;
  level?: string;
  status?: string;
}

export interface TrainingUpdateDataFull {

  title?: string;
  course?: string;
  provider?: string;
  organization?: string;
  duration?: string;
  startDate?: string;
  start_date?: string;
  endDate?: string;
  end_date?: string;
  completedModules?: number;
  completed_modules?: number;
  totalModules?: number;
  total_modules?: number;
  hoursSpent?: number;
  hours_spent?: number;
  description?: string;
  status?: string;
  skills?: SkillData[];
  skillsList?: SkillData[];
}

export interface ExperienceUpdateData {

  role?: string;
  organization?: string;
  start_date?: string;
  end_date?: string;
  description?: string;
}

export interface ProjectUpdateData {

  title?: string;
  description?: string;
  role?: string;
  status?: string;
  startDate?: string;
  start_date?: string;
  endDate?: string;
  end_date?: string;
  duration?: string;
  organization?: string;
  technologies?: string[];
  tech_stack?: string[];
  tech?: string[];
  demoUrl?: string;
  demo_link?: string;
  link?: string;
  githubUrl?: string;
  github_link?: string;
  github?: string;
  certificate_url?: string;
  video_url?: string;
  ppt_url?: string;
  approval_status?: string;
  enabled?: boolean;
}

export interface CertificateUpdateData {

  title?: string;
  issuer?: string;
  credentialId?: string;
  credential_id?: string;
  issuedOn?: string;
  issued_on?: string;
  expiryDate?: string;
  expiry_date?: string;
  link?: string;
  description?: string;
  category?: string;
  level?: string;
  platform?: string;
  instructor?: string;
}

export interface SkillUpdateData {

  name?: string;
  type?: 'technical' | 'soft';
  level?: string | number;
  rating?: string | number;
  description?: string;
  yearsOfExperience?: number;
  certifications?: string;
  examples?: string;
}

// API Response types
export interface LearnerApiResponse {
  learner?: Learner;
  success?: boolean;
  error?: string | null;
  [key: string]: unknown;
}

// ============================================================================
// Dashboard Redesign Types - College Student Dashboard
// ============================================================================

/**
 * Extended learner profile for the college student dashboard
 * Includes comprehensive student information, scores, activity tracking, and verification status
 */
export interface LearnerProfile {
  id: string;
  userId: string;
  email: string;
  name: string;
  avatar?: string;

  // College Information
  collegeId: string;
  collegeName: string;
  linkRangeId?: string;
  program: string; // e.g., "B.Tech Engineering"
  semester: number;
  grade: string; // e.g., "UG", "PG", "Diploma", "11", "12"

  // Scores and Metrics
  enrollabilityScore: number; // 0-100
  skillScore: number; // 0-100

  // Activity Tracking
  streak: number;
  streakBest: number;
  lastActivity: Date;

  // Counts
  badges: number;
  verifiedSkills: number;
  certificates: number;

  // Verification Status
  passportVerified: 'active' | 'pending' | 'expired' | 'none';
  lastVerified?: Date;

  createdAt: Date;
  updatedAt: Date;
}

/**
 * Enrollability score breakdown with status classification
 * Score calculated from multiple weighted factors
 */
export interface EnrollabilityScore {
  score: number; // 0-100
  status: 'excellent' | 'good' | 'average' | 'needs-improvement';
  factors: {
    skillCompleteness: number; // 0-100, weighted 35%
    learningProgress: number; // 0-100, weighted 30%
    certificationRate: number; // 0-100, weighted 20%
    activityLevel: number; // 0-100, weighted 15%
  };
}

/**
 * Course progress tracking with status, modules, and time tracking
 */
export interface CourseProgress {
  learnerId: string;
  courseId: string;

  // Progress Tracking
  status: 'not-started' | 'in-progress' | 'completed';
  progressPercentage: number; // 0-100
  completedModules: number;
  totalModules: number;

  // Time Tracking
  timeSpent: number; // minutes
  startedAt?: Date;
  completedAt?: Date;
  lastAccessedAt: Date;

  // Certificate
  certificateEarned: boolean;
  certificateId?: string;

  createdAt: Date;
  updatedAt: Date;
}

/**
 * Aggregated learning metrics for dashboard display
 * Calculated from CourseProgress array
 */
export interface AggregatedLearningMetrics {
  coursesEnrolled: number;
  coursesCompleted: number;
  coursesInProgress: number;
  coursesNotStarted: number;
  certificatesEarned: number;
  totalLearningHours: number; // Calculated from timeSpent
  completionRate: number; // coursesCompleted / coursesEnrolled * 100
}

/**
 * Extended skill data with health status, trends, and proficiency metrics
 * Used for dashboard skill displays and analysis
 * 
 * Task 1.1: Define SkillData interface with proficiency, health status, trends
 * Requirements: 10.1-10.7, 5.6-5.7
 */
export interface SkillDataExtended {
  learnerId: string;
  skillId: string;
  skillName: string;
  category: 'technical' | 'soft' | 'domain';

  // Proficiency Metrics
  proficiency: number; // 0-100
  verified: boolean;
  lastAssessed: Date;
  assessmentSource: 'self' | 'test' | 'project' | 'ai-evaluated';

  // Health Status (based on proficiency)
  healthStatus: 'healthy' | 'upskill' | 'critical';
  // healthy: >75%, upskill: 50-75%, critical: <50%

  // Trend Analysis
  trend: 'up' | 'down' | 'stable';
  previousProficiency?: number;

  // Recommendations
  recommendations: string[];

  createdAt: Date;
  updatedAt: Date;
}

// Type alias for dashboard redesign spec compatibility
// Task 1.1 requirement: Define SkillData interface
export type SkillDataDashboard = SkillDataExtended;

/**
 * Skill metric for dashboard skills snapshot widget
 * Simplified version of SkillDataExtended for display purposes
 */
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

/**
 * Learning path with progress, modules, and skills covered
 */
export interface LearningPath {
  id: string;
  name: string;
  description: string;

  // Progress
  learnerId: string;
  progress: number; // 0-100
  currentModuleId?: string;
  completedModules: number;
  totalModules: number;

  // Metadata
  skills: string[]; // List of skill names covered in this path
  estimatedHours: number;
  difficulty: 'beginner' | 'intermediate' | 'advanced';

  // Dates
  startedAt: Date;
  estimatedCompletion: Date;
  completedAt?: Date;

  createdAt: Date;
  updatedAt: Date;
}

/**
 * Skill health breakdown for passport card display
 */
export interface SkillHealthBreakdown {
  healthy: {
    percentage: number;
    count: number;
    skills: string[];
  };
  upskill: {
    percentage: number;
    count: number;
    skills: string[];
  };
  critical: {
    percentage: number;
    count: number;
    skills: string[];
  };
}
