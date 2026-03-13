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

export interface StudentUpdateData {
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

export interface Student {
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

export interface StudentData {
  name?: string;
  email: string;
  phone?: string;
  studentType?: string;
  schoolId?: string;
  collegeId?: string;
  country?: string;
  state?: string;
  city?: string;
  preferredLanguage?: string;
  referralCode?: string;
}

export interface RegistrationData extends StudentData {
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
  student_id: string;
  degree: string;
  university: string;
  department?: string;
  year_of_passing?: string;
  cgpa?: string;
  level: string;
  status: string;
  approval_status?: string;
  created_at?: string;
  updated_at?: string;
}

export interface TrainingRecord {
  id: string;
  student_id: string;
  title: string;
  organization?: string;
  start_date?: string;
  end_date?: string;
  duration?: string;
  description?: string;
  status: string;
  completed_modules?: number;
  total_modules?: number;
  hours_spent?: number;
  course_id?: string;
  source?: string;
  approval_status?: string;
  created_at?: string;
  updated_at?: string;
}

export interface ExperienceRecord {
  id: string;
  student_id: string;
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
}

export interface ProjectRecord {
  id: string;
  student_id: string;
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
}

export interface CertificateRecord {
  id: string;
  student_id: string;
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
}

export interface SkillRecord {
  id: string;
  student_id: string;
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
}

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
  student_id: string;
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
  id?: string;
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
  id?: string;
  title?: string;
  course?: string;
  provider?: string;
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
  id?: string;
  role?: string;
  organization?: string;
  start_date?: string;
  end_date?: string;
  description?: string;
}

export interface ProjectUpdateData {
  id?: string;
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
  id?: string;
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
  id?: string;
  name?: string;
  type?: 'technical' | 'soft';
  level?: string | number;
  rating?: string | number;
  description?: string;
  yearsOfExperience?: number;
  certifications?: string;
  examples?: string;
}
