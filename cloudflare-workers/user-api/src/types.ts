/**
 * Type definitions for User API Worker
 */

import { SupabaseClient } from '@supabase/supabase-js';

// ==================== ENVIRONMENT ====================

export interface Env {
  SUPABASE_URL: string;
  SUPABASE_ANON_KEY: string;
  SUPABASE_SERVICE_ROLE_KEY: string;
  VITE_SUPABASE_URL?: string;
  VITE_SUPABASE_ANON_KEY?: string;
  RESEND_API_KEY?: string;
}

// ==================== AUTH ====================

export interface AuthResult {
  user: any;
  supabaseAdmin: SupabaseClient;
}

// ==================== SCHOOL SIGNUP ====================

export interface SchoolAdminSignupRequest {
  email: string;
  password: string;
  schoolName: string;
  schoolCode: string;
  phone?: string;
  website?: string;
  address: string;
  city: string;
  state: string;
  country?: string;
  pincode: string;
  establishedYear?: number;
  board?: string;
  principalName: string;
  principalEmail?: string;
  principalPhone?: string;
  dateOfBirth?: string;
}

export interface EducatorSignupRequest {
  email: string;
  password: string;
  firstName: string;
  lastName: string;
  phone?: string;
  schoolId: string;
  designation?: string;
  department?: string;
  employeeId?: string;
  qualification?: string;
  experienceYears?: number;
  specialization?: string;
  dateOfBirth?: string;
}

export interface StudentSignupRequest {
  email: string;
  password: string;
  name: string;
  firstName?: string;
  lastName?: string;
  phone?: string;
  schoolId: string;
  grade?: string;
  section?: string;
  rollNumber?: string;
  admissionNumber?: string;
  dateOfBirth?: string;
  gender?: string;
  guardianName?: string;
  guardianPhone?: string;
  address?: string;
  city?: string;
  state?: string;
  pincode?: string;
}

// ==================== COLLEGE SIGNUP ====================

export interface CollegeAdminSignupRequest {
  email: string;
  password: string;
  collegeName: string;
  collegeCode: string;
  phone?: string;
  website?: string;
  address: string;
  city: string;
  state: string;
  country?: string;
  pincode: string;
  establishedYear?: number;
  collegeType?: string;
  affiliation?: string;
  accreditation?: string;
  deanName: string;
  deanEmail?: string;
  deanPhone?: string;
  dateOfBirth?: string;
}

export interface CollegeEducatorSignupRequest {
  email: string;
  password: string;
  firstName: string;
  lastName: string;
  phone?: string;
  collegeId: string;
  designation?: string;
  department?: string;
  employeeId?: string;
  qualification?: string;
  experienceYears?: number;
  specialization?: string;
  dateOfJoining?: string;
  dateOfBirth?: string;
}

export interface CollegeStudentSignupRequest {
  email: string;
  password: string;
  name: string;
  firstName?: string;
  lastName?: string;
  phone?: string;
  collegeId: string;
  course?: string;
  branch?: string;
  semester?: string;
  enrollmentNumber?: string;
  dateOfBirth?: string;
  gender?: string;
  guardianName?: string;
  guardianPhone?: string;
  address?: string;
  city?: string;
  state?: string;
  pincode?: string;
}

// ==================== UNIVERSITY SIGNUP ====================

export interface UniversityAdminSignupRequest {
  email: string;
  password: string;
  universityName: string;
  universityCode: string;
  phone?: string;
  website?: string;
  address?: string;
  city?: string;
  state: string;
  district?: string;
  country?: string;
  pincode?: string;
  universityType?: string;
  vcName: string;
  vcEmail?: string;
  vcPhone?: string;
  dateOfBirth?: string;
}

export interface UniversityEducatorSignupRequest {
  email: string;
  password: string;
  firstName: string;
  lastName: string;
  phone?: string;
  universityId: string;
  designation?: string;
  department?: string;
  employeeId?: string;
  qualification?: string;
  experienceYears?: number;
  specialization?: string;
  dateOfBirth?: string;
}

export interface UniversityStudentSignupRequest {
  email: string;
  password: string;
  name: string;
  firstName?: string;
  lastName?: string;
  phone?: string;
  universityId: string;
  course?: string;
  branch?: string;
  semester?: string;
  enrollmentNumber?: string;
  dateOfBirth?: string;
  gender?: string;
  guardianName?: string;
  guardianPhone?: string;
  address?: string;
  city?: string;
  state?: string;
  pincode?: string;
}

// ==================== RECRUITER SIGNUP ====================

export interface RecruiterAdminSignupRequest {
  email: string;
  password: string;
  companyName: string;
  companyCode: string;
  industry?: string;
  companySize?: string;
  phone?: string;
  website?: string;
  hqAddress?: string;
  hqCity?: string;
  hqState?: string;
  hqCountry?: string;
  hqPincode?: string;
  establishedYear?: number;
  contactPersonName: string;
  contactPersonDesignation?: string;
  contactPersonEmail?: string;
  contactPersonPhone?: string;
  dateOfBirth?: string;
}

export interface RecruiterSignupRequest {
  email: string;
  password: string;
  name: string;
  firstName?: string;
  lastName?: string;
  phone?: string;
  companyId: string;
  designation?: string;
  department?: string;
  dateOfBirth?: string;
}

// ==================== AUTHENTICATED ENDPOINTS ====================

export interface CreateStudentRequest {
  student?: {
    name: string;
    email: string;
    contactNumber: string;
    dateOfBirth?: string;
    gender?: string;
    enrollmentNumber?: string;
    grade?: string;
    section?: string;
    guardianName?: string;
    guardianPhone?: string;
  };
  userEmail?: string;
  schoolId?: string;
  collegeId?: string;
}

export interface CreateTeacherRequest {
  teacher?: {
    first_name: string;
    last_name: string;
    email: string;
    phone_number?: string;
    date_of_birth?: string;
    address?: string;
    qualification?: string;
    role?: string;
    subject_expertise?: string[];
  };
}

export interface CreateEventUserRequest {
  email?: string;
  firstName?: string;
  lastName?: string;
  role?: string;
  phone?: string;
  registrationId?: string;
  metadata?: Record<string, unknown>;
}

export interface InterviewReminderRequest {
  interviewId?: string;
  recipientEmail?: string;
  recipientName?: string;
  interviewDetails?: {
    date: string;
    time: string;
    duration: number;
    meetingLink?: string;
    meetingType?: string;
    jobTitle?: string;
    interviewer?: string;
  };
}

export interface ResetPasswordRequest {
  action?: 'send' | 'verify';
  email?: string;
  otp?: string;
  newPassword?: string;
}

// ==================== UTILITY ====================

export interface CheckCodeRequest {
  code: string;
}

export interface CheckEmailRequest {
  email: string;
}
