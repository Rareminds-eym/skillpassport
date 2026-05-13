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
 //save