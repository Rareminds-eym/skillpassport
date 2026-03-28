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
  
  // Report Data
  data: any;
  
  // Export Options
  pdfUrl?: string;
  hasSchoolLogo: boolean;
  isParentFriendly: boolean;
}

export interface ValidationError {
  field: string;
  message: string;
}
