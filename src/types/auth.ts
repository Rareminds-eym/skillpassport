// Authentication & User API Types

export interface SignupData {
  email: string;
  password: string;
  firstName: string;
  lastName: string;
  organizationId?: string;
  organizationName?: string;
  phone?: string;
  role?: string;
  department?: string;
  designation?: string;
  experience?: number;
  specialization?: string;
  qualifications?: string[];
  linkedin_url?: string;
  twitter_url?: string;
  bio?: string;
  address?: string;
  city?: string;
  state?: string;
  country?: string;
  pincode?: string;
  dateOfBirth?: string;
  gender?: string;
  registrationId?: string;
  metadata?: Record<string, unknown>;
}

export interface SchoolAdminSignupData extends SignupData {
  schoolName?: string;
  schoolCode?: string;
  schoolType?: string;
}

export interface EducatorSignupData extends SignupData {
  schoolId?: string;
  subjects?: string[];
  grades?: string[];
  teachingExperience?: number;
}

export interface StudentSignupData extends SignupData {
  schoolId?: string;
  grade?: string;
  section?: string;
  rollNumber?: string;
  guardianName?: string;
  guardianPhone?: string;
  guardianEmail?: string;
}

export interface CollegeAdminSignupData extends SignupData {
  collegeId?: string;
  collegeName?: string;
  collegeCode?: string;
  universityId?: string;
}

export interface CollegeEducatorSignupData extends SignupData {
  collegeId?: string;
  departmentId?: string;
  subjects?: string[];
  qualification?: string;
}

export interface CollegeStudentSignupData extends SignupData {
  collegeId?: string;
  studentId?: string;
  programId?: string;
  semester?: number;
  batch?: string;
  guardianName?: string;
  guardianPhone?: string;
  guardianEmail?: string;
}

export interface UniversityAdminSignupData extends SignupData {
  universityName?: string;
  universityCode?: string;
  accreditation?: string;
}

export interface UniversityEducatorSignupData extends SignupData {
  facultyId?: string;
  researchAreas?: string[];
  publications?: string[];
}

export interface UniversityStudentSignupData extends SignupData {
  enrollmentNumber?: string;
  programId?: string;
  year?: number;
  semester?: number;
  guardianName?: string;
  guardianPhone?: string;
  guardianEmail?: string;
}

export interface RecruiterSignupData extends SignupData {
  companyName?: string;
  companySize?: string;
  industry?: string;
  website?: string;
  jobTitle?: string;
}

export interface RecruiterAdminSignupData extends RecruiterSignupData {
  isAdmin: true;
  permissions?: string[];
}

export interface ApiResponse<T = unknown> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
  token?: string;
  user?: UserData;
}

export interface UserData {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  role: string;
  organizationId?: string;
  createdAt: string;
  updatedAt: string;
}

export interface CreateUserData {
  email: string;
  firstName: string;
  lastName: string;
  role: string;
  organizationId?: string;
  phone?: string;
  dateOfBirth?: string;
  metadata?: Record<string, unknown>;
}

export interface CreateTeacherData {
  email: string;
  firstName: string;
  lastName: string;
  phone?: string;
  subjects?: string[];
  grades?: string[];
  schoolId?: string;
  experience?: number;
  qualifications?: string[];
  bio?: string;
}

export interface DocumentUpdateData {
  resume?: string;
  profilePicture?: string;
  certificates?: string[];
  idProof?: string;
  addressProof?: string;
  educationDocuments?: string[];
  experienceLetters?: string[];
}

export interface InterviewDetails {
  position: string;
  date: string;
  time: string;
  location?: string;
  interviewerName?: string;
  interviewerEmail?: string;
  meetingLink?: string;
  instructions?: string;
}

export interface InterviewInviteData {
  recipientEmail: string;
  recipientName: string;
  interviewDetails: InterviewDetails;
}

export interface CollegeStaffData {
  email: string;
  firstName: string;
  lastName: string;
  role: string;
  department?: string;
  designation?: string;
  phone?: string;
  collegeId?: string;
  permissions?: string[];
}
// Additional API Response Types
export interface SchoolData {
  id: string;
  name: string;
  code: string;
  type?: string;
  address?: string;
  city?: string;
  state?: string;
  country?: string;
}

export interface CollegeData {
  id: string;
  name: string;
  code: string;
  universityId?: string;
  address?: string;
  city?: string;
  state?: string;
  country?: string;
}

export interface UniversityData {
  id: string;
  name: string;
  code: string;
  accreditation?: string;
  address?: string;
  city?: string;
  state?: string;
  country?: string;
}

export interface CompanyData {
  id: string;
  name: string;
  code?: string;
  industry?: string;
  size?: string;
  website?: string;
  address?: string;
  city?: string;
  state?: string;
  country?: string;
}

export interface CodeCheckResponse {
  available: boolean;
  message?: string;
}

export interface EmailCheckResponse {
  available: boolean;
  message?: string;
}

export interface ResetPasswordParams {
  email: string;
  newPassword?: string;
  resetToken?: string;
}

export interface CreateEventUserParams {
  email: string;
  firstName: string;
  lastName: string;
  eventId: string;
  role?: string;
}

export interface InterviewReminderParams {
  recipientEmail: string;
  recipientName: string;
  interviewDetails: InterviewDetails;
}