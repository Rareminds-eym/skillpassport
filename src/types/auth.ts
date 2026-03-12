// Authentication & User API Types - Simplified to match frontend signup form

export interface SignupData {
  email: string;
  password: string;
  firstName: string;
  lastName: string;
  dateOfBirth: string;
  phone?: string;
  role: string;
  country: string;
  state: string;
  city: string;
  preferredLanguage: string;
  referralCode?: string;
} //test


// API Response Types
export interface ApiResponse<T = unknown> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}

export interface AuthApiResponse extends ApiResponse {
  user?: UserData;
  token?: string;
  refreshToken?: string;
}

export interface UserData {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  role: string;
  createdAt: string;
  updatedAt: string;
}

// Basic data types for API responses
export interface SchoolData {
  id: string;
  name: string;
  code: string;
}

export interface CollegeData {
  id: string;
  name: string;
  code: string;
}
//test
export interface UniversityData {
  id: string;
  name: string;
  code: string;
} //save

export interface CompanyData {
  id: string;
  name: string;
  code?: string;
}
// Additional interfaces for authenticated endpoints

export interface CreateStudentData {
  userEmail: string;
  schoolId?: string;
  collegeId?: string;
  student: {
    name: string;
    email: string;
    contactNumber: string;
    alternateNumber?: string | null;
    dateOfBirth?: string | null;
    gender?: string | null;
    enrollmentNumber?: string | null;
    rollNumber?: string | null;
    guardianName?: string | null;
  };
}

export interface CreateCollegeStaffData {
  email?: string;
  firstName?: string;
  lastName?: string;
  collegeId?: string;
  employeeId?: string;
  department?: string;
  role?: string;
  staff?: {
    name: string;
    email: string;
    employee_id: string;
    roles: string[];
    department_id: string;
    phone?: string;
    qualification?: string;
    specialization?: string;
    experience_years?: number;
  };
}
export interface CreateTeacherData {
  teacher: {
    first_name: string;
    last_name: string;
    email: string;
    phone_number: string;
    qualification: string;
    role: string;
    designation: string;
    department: string;
    specialization: string;
    experience_years: number;
    date_of_joining: string;
    subject_expertise: unknown[];
    subjects_handled: string[];
    employee_id: string;
    gender: string;
    address: string;
    city: string;
    state: string;
    dob: string;
    country: string;
    pincode: string;
  };
}
export interface ResetPasswordParams {
  userId?: string;
  newPassword?: string;
  action?: string;
  email?: string;
  otp?: string;
}

export interface InterviewDetails {
  date?: string;
  time?: string;
  location?: string;
  interviewer?: string;
  position?: string;
  company?: string;
}

export interface InterviewReminderParams {
  interviewId: string;
  recipientEmail: string;
  recipientName: string;
  interviewDetails?: InterviewDetails;
}

export interface CreateEventUserParams {
  email: string;
  firstName: string;
  lastName: string;
  role: string;
  phone?: string;
  registrationId?: string;
  metadata?: Record<string, unknown>;
}

export interface DocumentData {
  name: string;
  url: string;
  size: number;
  type: string;
}