/**
 * User API Service
 * Connects to Cloudflare Pages Function for user management and signup API calls
 */

import { getPagesApiUrl, getAuthHeaders } from '../utils/pagesUrl';

const API_URL = getPagesApiUrl('user');

// ==================== SIGNUP ENDPOINTS (No Auth Required) ====================

interface UnifiedSignupData {
  email: string;
  password: string;
  firstName: string;
  lastName: string;
  role: string;
  phone?: string;
  dateOfBirth?: string;
  country?: string;
  state?: string;
  city?: string;
  preferredLanguage?: string;
  referralCode?: string;
}

export async function unifiedSignup(data: UnifiedSignupData): Promise<any> {
  const response = await fetch(`${API_URL}/signup`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  });

  const result = await response.json();
  
  if (!response.ok || !result.success) {
    throw new Error(result.error || 'Failed to create account');
  }

  return result;
}

export async function signupSchoolAdmin(data: any): Promise<any> {
  const response = await fetch(`${API_URL}/signup/school-admin`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  });

  const result = await response.json();
  
  if (!response.ok) {
    throw new Error(result.error || 'Failed to create school account');
  }

  return result;
}

export async function signupEducator(data: any): Promise<any> {
  const response = await fetch(`${API_URL}/signup/educator`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  });

  const result = await response.json();
  
  if (!response.ok) {
    throw new Error(result.error || 'Failed to create educator account');
  }

  return result;
}

export async function signupStudent(data: any): Promise<any> {
  const response = await fetch(`${API_URL}/signup/student`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  });

  const result = await response.json();
  
  if (!response.ok) {
    throw new Error(result.error || 'Failed to create student account');
  }

  return result;
}

export async function getSchools(): Promise<any> {
  const response = await fetch(`${API_URL}/schools`, {
    method: 'GET',
    headers: { 'Content-Type': 'application/json' },
  });

  const result = await response.json();
  
  if (!response.ok) {
    throw new Error(result.error || 'Failed to fetch schools');
  }

  return result;
}

export async function checkSchoolCode(code: string): Promise<any> {
  const response = await fetch(`${API_URL}/check-school-code`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ code }),
  });

  const result = await response.json();
  
  if (!response.ok) {
    throw new Error(result.error || 'Failed to check school code');
  }

  return result;
}

export async function checkEmail(email: string): Promise<any> {
  const response = await fetch(`${API_URL}/check-email`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email }),
  });

  const result = await response.json();
  
  if (!response.ok) {
    throw new Error(result.error || 'Failed to check email');
  }

  return result;
}

// ==================== COLLEGE SIGNUP ENDPOINTS ====================

export async function signupCollegeAdmin(data: any): Promise<any> {
  const response = await fetch(`${API_URL}/signup/college-admin`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  });

  const result = await response.json();
  
  if (!response.ok) {
    throw new Error(result.error || 'Failed to create college account');
  }

  return result;
}

export async function signupCollegeEducator(data: any): Promise<any> {
  const response = await fetch(`${API_URL}/signup/college-educator`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  });

  const result = await response.json();
  
  if (!response.ok) {
    throw new Error(result.error || 'Failed to create college educator account');
  }

  return result;
}

export async function signupCollegeStudent(data: any): Promise<any> {
  const response = await fetch(`${API_URL}/signup/college-student`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  });

  const result = await response.json();
  
  if (!response.ok) {
    throw new Error(result.error || 'Failed to create college student account');
  }

  return result;
}

export async function getColleges(): Promise<any> {
  const response = await fetch(`${API_URL}/colleges`, {
    method: 'GET',
    headers: { 'Content-Type': 'application/json' },
  });

  const result = await response.json();
  
  if (!response.ok) {
    throw new Error(result.error || 'Failed to fetch colleges');
  }

  return result;
}

export async function checkCollegeCode(code: string): Promise<any> {
  const response = await fetch(`${API_URL}/check-college-code`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ code }),
  });

  const result = await response.json();
  
  if (!response.ok) {
    throw new Error(result.error || 'Failed to check college code');
  }

  return result;
}

// ==================== UNIVERSITY SIGNUP ENDPOINTS ====================

export async function signupUniversityAdmin(data: any): Promise<any> {
  const response = await fetch(`${API_URL}/signup/university-admin`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  });

  const result = await response.json();
  
  if (!response.ok) {
    throw new Error(result.error || 'Failed to create university account');
  }

  return result;
}

export async function signupUniversityEducator(data: any): Promise<any> {
  const response = await fetch(`${API_URL}/signup/university-educator`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  });

  const result = await response.json();
  
  if (!response.ok) {
    throw new Error(result.error || 'Failed to create university educator account');
  }

  return result;
}

export async function signupUniversityStudent(data: any): Promise<any> {
  const response = await fetch(`${API_URL}/signup/university-student`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  });

  const result = await response.json();
  
  if (!response.ok) {
    throw new Error(result.error || 'Failed to create university student account');
  }

  return result;
}

export async function getUniversities(): Promise<any> {
  const response = await fetch(`${API_URL}/universities`, {
    method: 'GET',
    headers: { 'Content-Type': 'application/json' },
  });

  const result = await response.json();
  
  if (!response.ok) {
    throw new Error(result.error || 'Failed to fetch universities');
  }

  return result;
}

export async function checkUniversityCode(code: string): Promise<any> {
  const response = await fetch(`${API_URL}/check-university-code`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ code }),
  });

  const result = await response.json();
  
  if (!response.ok) {
    throw new Error(result.error || 'Failed to check university code');
  }

  return result;
}

// ==================== RECRUITER SIGNUP ENDPOINTS ====================

export async function signupRecruiterAdmin(data: any): Promise<any> {
  const response = await fetch(`${API_URL}/signup/recruiter-admin`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  });

  const result = await response.json();
  
  if (!response.ok) {
    throw new Error(result.error || 'Failed to create recruiter admin account');
  }

  return result;
}

export async function signupRecruiter(data: any): Promise<any> {
  const response = await fetch(`${API_URL}/signup/recruiter`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  });

  const result = await response.json();
  
  if (!response.ok) {
    throw new Error(result.error || 'Failed to create recruiter account');
  }

  return result;
}

export async function getCompanies(): Promise<any> {
  const response = await fetch(`${API_URL}/companies`, {
    method: 'GET',
    headers: { 'Content-Type': 'application/json' },
  });

  const result = await response.json();
  
  if (!response.ok) {
    throw new Error(result.error || 'Failed to fetch companies');
  }

  return result;
}

export async function checkCompanyCode(code: string): Promise<any> {
  const response = await fetch(`${API_URL}/check-company-code`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ code }),
  });

  const result = await response.json();
  
  if (!response.ok) {
    throw new Error(result.error || 'Failed to check company code');
  }

  return result;
}

// ==================== AUTHENTICATED ENDPOINTS ====================

export async function createStudent(studentData: any, token?: string): Promise<any> {
  console.log('🔑 userApiService.createStudent called with token length:', token?.length || 'no token');
  
  const response = await fetch(`${API_URL}/create-student`, {
    method: 'POST',
    headers: getAuthHeaders(token),
    body: JSON.stringify(studentData),
  });

  console.log('📡 Response status:', response.status, response.statusText);
  
  if (!response.ok) {
    let errorDetails;
    try {
      errorDetails = await response.json();
    } catch (e) {
      errorDetails = { error: `HTTP ${response.status}: ${response.statusText}` };
    }
    
    console.error('❌ API Error:', errorDetails);
    
    if (response.status === 401) {
      throw new Error('Authentication failed. Please login again.');
    }
    
    throw new Error(errorDetails.error || `Failed to create student (${response.status})`);
  }

  const result = await response.json();
  console.log('✅ API Success:', result);
  return result;
}

export async function createTeacher(teacherData: any, token?: string): Promise<any> {
  const response = await fetch(`${API_URL}/create-teacher`, {
    method: 'POST',
    headers: getAuthHeaders(token),
    body: JSON.stringify(teacherData),
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({}));
    throw new Error(error.error || 'Failed to create teacher');
  }

  return response.json();
}

interface ResetPasswordParams {
  userId?: string;
  newPassword?: string;
  action?: string;
  email?: string;
  otp?: string;
}

export async function resetPassword(params: ResetPasswordParams, token?: string): Promise<any> {
  const response = await fetch(`${API_URL}/reset-password`, {
    method: 'POST',
    headers: getAuthHeaders(token),
    body: JSON.stringify(params),
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({}));
    throw new Error(error.error || 'Failed to reset password');
  }

  return response.json();
}

interface CreateEventUserParams {
  email: string;
  firstName: string;
  lastName: string;
  role: string;
  phone?: string;
  registrationId?: string;
  metadata?: any;
}

export async function createEventUser(params: CreateEventUserParams, token?: string): Promise<any> {
  const response = await fetch(`${API_URL}/create-event-user`, {
    method: 'POST',
    headers: getAuthHeaders(token),
    body: JSON.stringify(params),
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({}));
    throw new Error(error.error || 'Failed to create event user');
  }

  return response.json();
}

interface InterviewReminderParams {
  interviewId: string;
  recipientEmail: string;
  recipientName: string;
  interviewDetails: any;
}

export async function sendInterviewReminder(params: InterviewReminderParams, token?: string): Promise<any> {
  const response = await fetch(`${API_URL}/send-interview-reminder`, {
    method: 'POST',
    headers: getAuthHeaders(token),
    body: JSON.stringify(params),
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({}));
    throw new Error(error.error || 'Failed to send interview reminder');
  }

  return response.json();
}

export async function updateStudentDocuments(
  studentId: string,
  documents: any,
  token?: string
): Promise<any> {
  console.log('🔑 userApiService.updateStudentDocuments called with token length:', token?.length || 'no token');
  
  const response = await fetch(`${API_URL}/update-student-documents`, {
    method: 'POST',
    headers: getAuthHeaders(token),
    body: JSON.stringify({ studentId, documents }),
  });

  console.log('📡 Response status:', response.status, response.statusText);
  
  if (!response.ok) {
    let errorDetails;
    try {
      errorDetails = await response.json();
    } catch (e) {
      errorDetails = { error: `HTTP ${response.status}: ${response.statusText}` };
    }
    
    console.error('❌ API Error:', errorDetails);
    
    if (response.status === 401) {
      throw new Error('Authentication failed. Please login again.');
    }
    
    throw new Error(errorDetails.error || `Failed to update student documents (${response.status})`);
  }

  const result = await response.json();
  console.log('✅ API Success:', result);
  return result;
}

export async function updateTeacherDocuments(
  teacherId: string,
  documents: any,
  token?: string
): Promise<any> {
  console.log('🔑 userApiService.updateTeacherDocuments called with token length:', token?.length || 'no token');
  
  const response = await fetch(`${API_URL}/update-teacher-documents`, {
    method: 'POST',
    headers: getAuthHeaders(token),
    body: JSON.stringify({ teacherId, documents }),
  });

  console.log('📡 Response status:', response.status, response.statusText);
  
  if (!response.ok) {
    let errorDetails;
    try {
      errorDetails = await response.json();
    } catch (e) {
      errorDetails = { error: `HTTP ${response.status}: ${response.statusText}` };
    }
    
    console.error('❌ API Error:', errorDetails);
    
    if (response.status === 401) {
      throw new Error('Authentication failed. Please login again.');
    }
    
    throw new Error(errorDetails.error || `Failed to update teacher documents (${response.status})`);
  }

  const result = await response.json();
  console.log('✅ API Success:', result);
  return result;
}

export async function createCollegeStaff(staffData: any, token?: string): Promise<any> {
  console.log('🔑 userApiService.createCollegeStaff called with token length:', token?.length || 'no token');
  
  const response = await fetch(`${API_URL}/create-college-staff`, {
    method: 'POST',
    headers: getAuthHeaders(token),
    body: JSON.stringify(staffData),
  });

  console.log('📡 Response status:', response.status, response.statusText);
  
  if (!response.ok) {
    let errorDetails;
    try {
      errorDetails = await response.json();
    } catch (e) {
      errorDetails = { error: `HTTP ${response.status}: ${response.statusText}` };
    }
    
    console.error('❌ API Error:', errorDetails);
    
    if (response.status === 401) {
      throw new Error('Authentication failed. Please login again.');
    }
    
    throw new Error(errorDetails.error || `Failed to create staff member (${response.status})`);
  }

  const result = await response.json();
  console.log('✅ API Success:', result);
  return result;
}

export default {
  unifiedSignup,
  signupSchoolAdmin,
  signupEducator,
  signupStudent,
  getSchools,
  checkSchoolCode,
  checkEmail,
  signupCollegeAdmin,
  signupCollegeEducator,
  signupCollegeStudent,
  getColleges,
  checkCollegeCode,
  signupUniversityAdmin,
  signupUniversityEducator,
  signupUniversityStudent,
  getUniversities,
  checkUniversityCode,
  signupRecruiterAdmin,
  signupRecruiter,
  getCompanies,
  checkCompanyCode,
  createStudent,
  createTeacher,
  createCollegeStaff,
  createEventUser,
  sendInterviewReminder,
  resetPassword,
  updateStudentDocuments,
  updateTeacherDocuments,
};
