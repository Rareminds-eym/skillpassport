// Learner Management Types

export interface AdmissionApplication {
  id: string;
  applicationNumber: string;
  learnerName: string;
  dateOfBirth: string;
  gender: 'male' | 'female' | 'other';
  aadharNumber?: string;
  passportNumber?: string;
  email: string;
  phone: string;
  
  // Parent Details
  fatherName: string;
  fatherOccupation: string;
  fatherPhone: string;
  fatherEmail?: string;
  motherName: string;
  motherOccupation: string;
  motherPhone: string;
  motherEmail?: string;
  guardianName?: string;
  guardianRelation?: string;
  guardianPhone?: string;
  
  // Address
  address: string;
  city: string;
  state: string;
  pincode: string;
  
  // Previous School
  previousSchool?: string;
  previousClass?: string;
  previousBoard?: string;
  transferCertificate?: string;
  
  // Documents
  documents: {
    birthCertificate?: string;
    transferCertificate?: string;
    aadharCard?: string;
    photos?: string[];
    medicalRecords?: string[];
  };
  
  // Application Status
  status: 'pending' | 'document_verification' | 'fee_payment' | 'approved' | 'rejected';
  appliedFor: string; // Class applying for
  appliedDate: string;
  verifiedBy?: string;
  verifiedDate?: string;
  enrollmentNumber?: string;
  
  // Fee Details
  feeStatus?: 'pending' | 'partial' | 'paid';
  feeAmount?: number;
  feePaid?: number;
  
  remarks?: string;
}

export interface LearnerProfile {
  id: string;
  enrollmentNumber: string;
  name: string;
  dateOfBirth: string;
  gender: 'male' | 'female' | 'other';
  bloodGroup?: string;
  aadharNumber?: string;
  
  // Contact
  email: string;
  phone: string;
  address: string;
  city: string;
  state: string;
  pincode: string;
  
  // Academic
  class: string;
  section: string;
  rollNumber: string;
  admissionDate: string;
  academicYear: string;
  
  // Parent Details
  fatherName: string;
  fatherOccupation: string;
  fatherPhone: string;
  fatherEmail?: string;
  motherName: string;
  motherOccupation: string;
  motherPhone: string;
  motherEmail?: string;
  guardianName?: string;
  guardianRelation?: string;
  guardianPhone?: string;
  
  // Previous School
  previousSchool?: string;
  previousClass?: string;
  previousBoard?: string;
  
  // Medical Information
  medicalInfo: {
    allergies?: string[];
    chronicConditions?: string[];
    medications?: string[];
    bloodGroup?: string;
    emergencyContact: string;
    emergencyPhone: string;
  };
  
  // Skill Assessment History
  skillAssessments: {
    id: string;
    date: string;
    assessmentType: string;
    score: number;
    remarks?: string;
  }[];
  
  // Career Interest Profile
  careerInterests: {
    primaryInterest?: string;
    secondaryInterest?: string;
    skills?: string[];
    aspirations?: string;
  };
  
  // Fee Status
  feeStatus: {
    totalFee: number;
    paidAmount: number;
    pendingAmount: number;
    lastPaymentDate?: string;
    nextDueDate?: string;
  };
  
  // Attendance Trend
  attendanceTrend: {
    totalDays: number;
    presentDays: number;
    absentDays: number;
    percentage: number;
    isAtRisk: boolean; // < 75%
  };
  
  // Status
  status: 'active' | 'inactive' | 'transferred' | 'graduated';
  photo?: string;
}

export interface AttendanceRecord {
  id: string;
  learnerId: string;
  schoolId: string;
  date: string;
  status: 'present' | 'absent' | 'late' | 'excused';
  mode: 'manual' | 'rfid' | 'mobile';
  timeIn?: string;
  timeOut?: string;
  markedBy: string;
  remarks?: string;
  otpVerified?: boolean;
}

export interface AttendanceAlert {
  id: string;
  learnerId: string;
  learnerName: string;
  alertType: 'consecutive_absent' | 'below_75' | 'irregular';
  message: string;
  daysAbsent?: number;
  attendancePercentage?: number;
  parentNotified: boolean;
  notifiedDate?: string;
  createdAt: string;
}

// Report Data Types
export type ReportData = Record<string, unknown>;

export interface LearnerReport {
  id: string;
  learnerId: string;
  schoolId: string;
  reportType: 'attendance' | 'academic' | 'behavioral' | 'skill_assessment' | 'career_readiness';
  title: string;
  generatedDate: string;
  generatedBy: string;
  academicYear: string;
  term?: string;
  
  // Report Data - now properly typed
  data: ReportData;
  
  // Export Options
  pdfUrl?: string;
  hasSchoolLogo: boolean;
  isParentFriendly: boolean;
}

export interface ValidationError {
  field: string;
  message: string;
}

// Additional interfaces for services and utils

export interface QualificationData {
  degree: string;
  institution: string;
  year: string;
  grade?: string;
  specialization?: string;
}

export interface SubjectExpertise {
  subject: string;
  level: 'beginner' | 'intermediate' | 'advanced' | 'expert';
  yearsOfExperience?: number;
  certifications?: string[];
}

export interface BulkImportResult {
  total_records: number;
  successful_records: number;
  failed_records: number;
  status: string;
  error_log: ImportError[];
}

export interface ImportError {
  row: number;
  field: string;
  message: string;
  data?: Record<string, string | number | boolean>;
}

export interface NotificationData {
  id: string;
  title: string;
  message: string;
  type: 'info' | 'warning' | 'error' | 'success';
  read: boolean;
  created_at: string;
  learner_id?: string;
  metadata?: NotificationMetadata;
}

export interface NotificationMetadata {
  action?: string;
  url?: string;
  priority?: 'low' | 'medium' | 'high';
  category?: string;
}

export interface MessageData {
  id: string;
  role: 'user' | 'assistant' | 'system';
  content: string;
  created_at: string;
  metadata?: MessageMetadata;
}

export interface MessageMetadata {
  type?: string;
  source?: string;
  confidence?: number;
}

export interface ConversationData {
  id: string;
  title: string;
  messages: MessageData[];
  created_at: string;
  updated_at: string;
  status: 'active' | 'archived';
}

export interface OrganizationData {
  id: string;
  name: string;
  code: string;
  type: string;
  city?: string;
  state?: string;
  country?: string;
  address?: string;
  phone?: string;
  email?: string;
  website?: string;
  logo_url?: string;
  status: 'active' | 'inactive';
  created_at: string;
  updated_at: string;
}

export interface UserRoleHistoryRecord {
  id: string;
  user_id: string;
  old_role: string;
  new_role: string;
  changed_by: string;
  reason?: string;
  assigned_at: string;
}

// ── Verification & Approval Types ──

/**
 * Base pending item with required fields for all verification submissions
 */
export interface BasePendingItem {
  id: string;
  approval_status: string;
  created_at: string;
  learner_name: string;
  learner_email: string;
  learner_school_id: string | null;
  learner_college_id: string | null;
  learner_type?: string;
  _needsApprovalAuthorityFix?: true;
}

/**
 * Training submission pending approval
 */
export interface PendingTraining extends BasePendingItem {
  title: string;
  organization: string;
  description?: string;
  start_date: string;
  end_date: string;
  duration?: string;
  approval_authority?: string;
  updated_at?: string;
}

/**
 * Certificate submission pending approval
 */
export interface PendingCertificate extends BasePendingItem {
  title: string;
  issuer?: string;
  organization?: string;
  issued_on?: string;
  issue_date?: string;
  expiry_date?: string;
  credential_id?: string;
  certificate_url?: string;
  document_url?: string;
  description?: string;
  approval_authority?: string;
  updated_at?: string;
}

/**
 * Experience submission pending approval
 */
export interface PendingExperience extends BasePendingItem {
  title?: string;
  role?: string;
  organization: string;
  description?: string;
  start_date: string;
  end_date?: string;
  type?: string;
  approval_authority?: string;
  updated_at?: string;
}

/**
 * Project submission pending approval
 */
export interface PendingProject extends BasePendingItem {
  title: string;
  name?: string;
  description?: string;
  start_date?: string;
  end_date?: string;
  skills?: Array<string | { name: string }>;
  tech_stack?: Array<string | { name: string }>;
  status?: string;
  approval_authority?: string;
  updated_at?: string;
}

/**
 * Skill submission pending approval
 */
export interface PendingSkill extends BasePendingItem {
  skill_name?: string;
  name?: string;
  level?: number;
  category?: string;
  type?: string;
  source?: string;
  description?: string;
  years_of_experience?: number;
  approval_authority?: string;
  updated_at?: string;
}

/**
 * Education submission pending approval
 */
export interface PendingEducation extends BasePendingItem {
  school_name: string;
  degree?: string;
  field_of_study?: string;
  start_date?: string;
  end_date?: string;
  grade?: string;
  description?: string;
  approval_authority?: string;
  updated_at?: string;
}

/**
 * Achievement submission pending approval
 */
export interface PendingAchievement extends BasePendingItem {
  title: string;
  description?: string;
  category?: string;
  date?: string;
  issued_by?: string;
  approval_authority?: string;
  updated_at?: string;
}

/**
 * Union type for all pending items
 */
export type PendingItem = 
  | PendingTraining 
  | PendingCertificate 
  | PendingExperience 
  | PendingProject 
  | PendingSkill 
  | PendingEducation 
  | PendingAchievement;

// ── Modal Component Props ──

/**
 * Base props for all detail modal components
 */
export interface BaseDetailModalProps<T> {
  isOpen: boolean;
  onClose: () => void;
  currentUserId: string;
  onAction?: (action: 'approved' | 'rejected', item: T) => void | Promise<void>;
}

/**
 * Props for TrainingDetailsModal component
 */
export interface TrainingDetailsModalProps extends BaseDetailModalProps<PendingTraining> {
  training: PendingTraining | null;
}

/**
 * Props for CertificateDetailsModal component
 */
export interface CertificateDetailsModalProps extends BaseDetailModalProps<PendingCertificate> {
  certificate: PendingCertificate | null;
}

/**
 * Props for ExperienceDetailsModal component
 */
export interface ExperienceDetailsModalProps extends BaseDetailModalProps<PendingExperience> {
  experience: PendingExperience | null;
}

/**
 * Props for ProjectDetailsModal component
 */
export interface ProjectDetailsModalProps extends BaseDetailModalProps<PendingProject> {
  project: PendingProject | null;
}

/**
 * Props for SkillDetailsModal component
 */
export interface SkillDetailsModalProps extends BaseDetailModalProps<PendingSkill> {
  skill: PendingSkill | null;
}