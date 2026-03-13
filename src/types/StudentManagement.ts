// Student Management Types

export interface AdmissionApplication {
  id: string;
  applicationNumber: string;
  studentName: string;
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
  motherName: string;
  motherOccupation: string;
  motherPhone: string;
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

export interface StudentProfile {
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
  studentId: string;
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
  studentId: string;
  studentName: string;
  alertType: 'consecutive_absent' | 'below_75' | 'irregular';
  message: string;
  daysAbsent?: number;
  attendancePercentage?: number;
  parentNotified: boolean;
  notifiedDate?: string;
  createdAt: string;
}

// Report Data Types
export interface AttendanceReportData {
  totalDays: number;
  presentDays: number;
  absentDays: number;
  lateCount: number;
  excusedCount: number;
  attendancePercentage: number;
  monthlyBreakdown: {
    month: string;
    present: number;
    absent: number;
    late: number;
  }[];
  alertsGenerated: number;
}

export interface AcademicReportData {
  subjects: {
    name: string;
    marks: number;
    totalMarks: number;
    grade: string;
    percentage: number;
  }[];
  overallPercentage: number;
  overallGrade: string;
  rank?: number;
  totalStudents?: number;
  remarks?: string;
}

export interface BehavioralReportData {
  disciplinaryActions: {
    date: string;
    type: string;
    description: string;
    actionTaken: string;
  }[];
  positiveRecognitions: {
    date: string;
    type: string;
    description: string;
  }[];
  overallBehaviorRating: 'excellent' | 'good' | 'satisfactory' | 'needs_improvement';
  teacherComments: string[];
}

export interface SkillAssessmentReportData {
  assessments: {
    skillName: string;
    level: 'beginner' | 'intermediate' | 'advanced' | 'expert';
    score: number;
    maxScore: number;
    assessmentDate: string;
  }[];
  overallSkillLevel: string;
  recommendedSkills: string[];
  improvementAreas: string[];
}

export interface CareerReadinessReportData {
  riasecScores: {
    realistic: number;
    investigative: number;
    artistic: number;
    social: number;
    enterprising: number;
    conventional: number;
  };
  recommendedCareers: string[];
  skillGaps: string[];
  readinessScore: number;
  nextSteps: string[];
}

export type ReportData = 
  | AttendanceReportData 
  | AcademicReportData 
  | BehavioralReportData 
  | SkillAssessmentReportData 
  | CareerReadinessReportData;

export interface StudentReport {
  id: string;
  studentId: string;
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

export interface TeacherProfile {
  id: string;
  name: string;
  email: string;
  phone: string;
  employee_id?: string;
  department?: string;
  designation?: string;
  years_of_experience?: number;
  specialization?: string;
  qualifications: QualificationData[];
  subject_expertise: SubjectExpertise[];
  subjects_handled?: string[];
  linkedin_url?: string;
  twitter_url?: string;
  onboarding_status: 'pending' | 'documents_uploaded' | 'verified' | 'active' | 'inactive';
  verification_status?: string;
  degree_certificate_url?: string;
  id_proof_url?: string;
  created_at?: string;
  updated_at?: string;
}

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

export interface EnrolledStudentView {
  id: string;
  name: string;
  email: string;
  enrollment_number: string;
  class: string;
  section: string;
  roll_number: string;
  admission_date: string;
  status: 'active' | 'inactive' | 'transferred' | 'graduated';
  parent_name?: string;
  parent_phone?: string;
  created_at: string;
  updated_at: string;
}

export interface NotificationData {
  id: string;
  title: string;
  message: string;
  type: 'info' | 'warning' | 'error' | 'success';
  read: boolean;
  created_at: string;
  student_id?: string;
  metadata?: NotificationMetadata;
}

export interface NotificationMetadata {
  action?: string;
  url?: string;
  priority?: 'low' | 'medium' | 'high';
  category?: string;
}

export interface ExportData {
  students: StudentExportData[];
  skills: SkillExportData[];
  projects: ProjectExportData[];
  certificates: CertificateExportData[];
  experience: ExperienceExportData[];
  trainings: TrainingExportData[];
}

export interface StudentExportData {
  id: string;
  name: string;
  email: string;
  phone?: string;
  university?: string;
  department?: string;
  cgpa?: string;
  year_of_passing?: string;
  created_at: string;
}

export interface SkillExportData {
  student_id: string;
  student_name: string;
  skill_name: string;
  skill_type: 'technical' | 'soft';
  proficiency_level: string;
  rating: number;
}

export interface ProjectExportData {
  student_id: string;
  student_name: string;
  project_title: string;
  description?: string;
  technologies: string;
  role?: string;
  start_date?: string;
  end_date?: string;
  demo_url?: string;
  github_url?: string;
}

export interface CertificateExportData {
  student_id: string;
  student_name: string;
  certificate_title: string;
  issuer: string;
  issued_date?: string;
  expiry_date?: string;
  credential_id?: string;
  verification_url?: string;
}

export interface ExperienceExportData {
  student_id: string;
  student_name: string;
  company: string;
  role: string;
  start_date?: string;
  end_date?: string;
  duration?: string;
  description?: string;
}

export interface TrainingExportData {
  student_id: string;
  student_name: string;
  training_title: string;
  provider: string;
  start_date?: string;
  end_date?: string;
  duration?: string;
  completion_status: string;
  certificate_url?: string;
}

export interface VideoSummaryData {
  id: string;
  title: string;
  description?: string;
  video_url: string;
  summary?: string;
  key_points?: string[];
  duration?: number;
  status: 'pending' | 'processing' | 'completed' | 'failed';
  created_at: string;
  updated_at: string;
}

export interface MessageData {
  id: string;
  role: 'user' | 'assistant' | 'system';
  content: string;
  timestamp: string;
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

// Store interfaces
export interface AssessmentState {
  current_question_index: number;
  section_timings: SectionTimings;
  answers: Record<string, string | number | boolean>;
  metadata: AssessmentMetadata;
}

export interface SectionTimings {
  [sectionName: string]: {
    startTime: number;
    endTime?: number;
    timeSpent: number;
  };
}

export interface AssessmentMetadata {
  test_id: string;
  student_id: string;
  start_time: string;
  total_questions: number;
}

export interface PromotionalData {
  id: string;
  title: string;
  description: string;
  image_url?: string;
  start_date?: string;
  end_date?: string;
  is_active: boolean;
  target_audience?: string[];
  metadata?: Record<string, string | number | boolean>;
}

export interface TestQuestion {
  id: string;
  text: string;
  options?: string[];
  correct_answer?: string;
  question_type: 'multiple_choice' | 'text' | 'boolean';
  metadata?: Record<string, string | number | boolean>;
}

export interface SubscriptionFeature {
  id: string;
  name: string;
  description: string;
  enabled: boolean;
  limit?: number;
}

export interface SubscriptionData {
  id: string;
  user_id: string;
  plan_id: string;
  status: 'active' | 'cancelled' | 'expired' | 'grace_period';
  start_date: string;
  end_date?: string;
  trial_end?: string;
  cancelledAt?: string;
  cancellationReason?: string;
  features: SubscriptionFeature[];
  billing_cycle: 'monthly' | 'yearly';
  amount: number;
  currency: string;
  userRole?: string;
  metadata?: Record<string, string | number | boolean>;
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

// Additional interfaces for Student Management UI components
export interface FilterSectionProps {
  title: string;
  children: React.ReactNode;
  defaultOpen?: boolean;
}

export interface FilterCounts {
  [key: string]: number;
}

export interface StudentCardProps {
  student: StudentProfile;
  onViewProfile: (student: StudentProfile) => void;
  onAddNote: (student: StudentProfile) => void;
  onViewCareerPath: (student: StudentProfile) => void;
  loadingAssessmentForStudent: string | null;
}