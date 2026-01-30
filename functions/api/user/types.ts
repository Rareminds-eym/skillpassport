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

export interface StudentSignupRequest {
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

export interface CollegeStudentSignupRequest {
  email: string;
  password: string;
  name: string;
  firstName?: string;
  lastName?: string;
  collegeId: string;
  phone?: string;
  dateOfBirth?: string;
  gender?: string;
  course?: string;
  branch?: string;
  semester?: string;
  enrollmentNumber?: string;
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

export interface UniversityStudentSignupRequest {
  email: string;
  password: string;
  name: string;
  firstName?: string;
  lastName?: string;
  universityId: string;
  phone?: string;
  dateOfBirth?: string;
  gender?: string;
  course?: string;
  branch?: string;
  semester?: string;
  rollNumber?: string;
  registrationNumber?: string;
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
  role: 'school_admin' | 'school_educator' | 'school_student' | 
        'college_admin' | 'college_educator' | 'college_student' |
        'university_admin' | 'university_educator' | 'university_student' |
        'recruiter_admin' | 'recruiter';
  phone?: string;
  dateOfBirth?: string;
  country?: string;
  state?: string;
  city?: string;
  preferredLanguage?: string;
  referralCode?: string;
}
