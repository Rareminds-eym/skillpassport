/**
 * Type definitions for User API
 */

// ==================== SCHOOL SIGNUP ====================

export interface SchoolAdminSignupRequest {
  email: string;
  password: string;
  schoolName: string;
  schoolCode: string;
  address: string;
  city: string;
  state: string;
  country?: string;
  pincode: string;
  phone?: string;
  website?: string;
  principalName: string;
  principalEmail?: string;
  principalPhone?: string;
  establishedYear?: number;
  board?: string;
  dateOfBirth?: string;
}

export interface EducatorSignupRequest {
  email: string;
  password: string;
  firstName: string;
  lastName: string;
  schoolId: string;
  phone?: string;
  dateOfBirth?: string;
  designation?: string;
  department?: string;
  employeeId?: string;
  qualification?: string;
  experienceYears?: number;
  specialization?: string;
}

export interface LearnerSignupRequest {
  email: string;
  password: string;
  name: string;
  firstName?: string;
  lastName?: string;
  schoolId: string;
  phone?: string;
  dateOfBirth?: string;
  gender?: string;
  grade?: string;
  section?: string;
  rollNumber?: string;
  admissionNumber?: string;
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
  address: string;
  city: string;
  state: string;
  country?: string;
  pincode: string;
  phone?: string;
  website?: string;
  deanName: string;
  deanEmail?: string;
  deanPhone?: string;
  establishedYear?: number;
  collegeType?: string;
  affiliation?: string;
  accreditation?: string;
  dateOfBirth?: string;
}

export interface CollegeEducatorSignupRequest {
  email: string;
  password: string;
  firstName: string;
  lastName: string;
  collegeId: string;
  phone?: string;
  dateOfBirth?: string;
  designation?: string;
  department?: string;
  employeeId?: string;
  qualification?: string;
  experienceYears?: number;
  specialization?: string;
  dateOfJoining?: string;
}


// ==================== UNIVERSITY SIGNUP ====================

export interface UniversityAdminSignupRequest {
  email: string;
  password: string;
  universityName: string;
  universityCode: string;
  address: string;
  city: string;
  state: string;
  country?: string;
  pincode: string;
  phone?: string;
  website?: string;
  chancellorName: string;
  chancellorEmail?: string;
  chancellorPhone?: string;
  establishedYear?: number;
  accreditation?: string;
  dateOfBirth?: string;
}

export interface UniversityEducatorSignupRequest {
  email: string;
  password: string;
  firstName: string;
  lastName: string;
  universityId: string;
  phone?: string;
  dateOfBirth?: string;
  designation?: string;
  department?: string;
  employeeId?: string;
  qualification?: string;
  experienceYears?: number;
  specialization?: string;
}


// ==================== RECRUITER SIGNUP ====================

export interface RecruiterAdminSignupRequest {
  email: string;
  password: string;
  companyName: string;
  companyCode: string;
  address: string;
  city: string;
  state: string;
  country?: string;
  pincode: string;
  phone?: string;
  website?: string;
  hrName: string;
  hrEmail?: string;
  hrPhone?: string;
  industry?: string;
  companySize?: string;
  dateOfBirth?: string;
}

export interface RecruiterSignupRequest {
  email: string;
  password: string;
  firstName: string;
  lastName: string;
  companyId: string;
  phone?: string;
  dateOfBirth?: string;
  designation?: string;
  department?: string;
  employeeId?: string;
}

// ==================== UNIFIED SIGNUP ====================

export interface UnifiedSignupRequest {
  email: string;
  password: string;
  firstName: string;
  lastName: string;
  role: 'school_admin' | 'school_educator' | 'learner' | 
        'college_admin' | 'college_educator' |
        'university_admin' | 'university_educator' |
        'recruiter_admin' | 'recruiter';
  phone?: string;
  dateOfBirth?: string;
  country?: string;
  state?: string;
  city?: string;
  preferredLanguage?: string;
  referralCode?: string;
}

// ==================== ADMIN USER CONTEXT ====================

export interface AdminUserContext {
  id: string;
  email: string;
  org_id?: string;
}

export interface SsoUserMetadata {
  name: string;
  phone?: string;
  added_by: string;
  institution_type: string | null;
  school_id: string | null;
  college_id: string | null;
}

export interface SsoMemberResponse {
  user_id: string;
  org_id: string;
  membership_id: string;
}

export interface CreateLearnerRequest {
  learner: {
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
  userEmail: string;
  schoolId?: string;
  collegeId?: string;
}

// ==================== ENVIRONMENT ====================

export interface ApiEnv extends Record<string, unknown> {
  SUPABASE_URL: string;
  SUPABASE_ANON_KEY: string;
  SUPABASE_SERVICE_ROLE_KEY: string;
  SSO_SERVICE: unknown; // Service binding
}

// ==================== HELPER TYPES ====================

export interface SubjectExpertise {
  name: string;
  [key: string]: unknown;
}

export interface AuthUser {
  id: string;
  email?: string;
  [key: string]: unknown;
}
