/**
 * User API Service
 * Connects to Cloudflare Worker for user management and signup API calls
 */

const WORKER_URL = import.meta.env.VITE_USER_API_URL;

if (!WORKER_URL) {
  console.warn('⚠️ VITE_USER_API_URL not configured. User API calls will fail.');
}

const getBaseUrl = () => {
  if (!WORKER_URL) {
    throw new Error('VITE_USER_API_URL environment variable is required');
  }
  return WORKER_URL;
};

const getAuthHeaders = (token) => {
  const headers = { 'Content-Type': 'application/json' };
  if (token) headers['Authorization'] = `Bearer ${token}`;
  return headers;
};

// ==================== SIGNUP ENDPOINTS (No Auth Required) ====================

/**
 * Sign up a new school admin with school
 * @param {Object} data - School admin signup data
 * @returns {Promise<Object>} Signup result
 */
export async function signupSchoolAdmin(data) {
  const response = await fetch(`${getBaseUrl()}/signup/school-admin`, {
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

/**
 * Sign up a new educator
 * @param {Object} data - Educator signup data
 * @returns {Promise<Object>} Signup result
 */
export async function signupEducator(data) {
  const response = await fetch(`${getBaseUrl()}/signup/educator`, {
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

/**
 * Sign up a new student
 * @param {Object} data - Student signup data
 * @returns {Promise<Object>} Signup result
 */
export async function signupStudent(data) {
  const response = await fetch(`${getBaseUrl()}/signup/student`, {
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

/**
 * Get list of schools for dropdown
 * @returns {Promise<Object>} Schools list
 */
export async function getSchools() {
  const response = await fetch(`${getBaseUrl()}/schools`, {
    method: 'GET',
    headers: { 'Content-Type': 'application/json' },
  });

  const result = await response.json();
  
  if (!response.ok) {
    throw new Error(result.error || 'Failed to fetch schools');
  }

  return result;
}

/**
 * Check if school code is unique
 * @param {string} code - School code to check
 * @returns {Promise<Object>} Check result
 */
export async function checkSchoolCode(code) {
  const response = await fetch(`${getBaseUrl()}/check-school-code`, {
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

/**
 * Check if email already exists
 * @param {string} email - Email to check
 * @returns {Promise<Object>} Check result
 */
export async function checkEmail(email) {
  const response = await fetch(`${getBaseUrl()}/check-email`, {
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

// ==================== COLLEGE SIGNUP ENDPOINTS (No Auth Required) ====================

/**
 * Sign up a new college admin with college
 * @param {Object} data - College admin signup data
 * @returns {Promise<Object>} Signup result
 */
export async function signupCollegeAdmin(data) {
  const response = await fetch(`${getBaseUrl()}/signup/college-admin`, {
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

/**
 * Sign up a new college educator
 * @param {Object} data - College educator signup data
 * @returns {Promise<Object>} Signup result
 */
export async function signupCollegeEducator(data) {
  const response = await fetch(`${getBaseUrl()}/signup/college-educator`, {
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

/**
 * Sign up a new college student
 * @param {Object} data - College student signup data
 * @returns {Promise<Object>} Signup result
 */
export async function signupCollegeStudent(data) {
  const response = await fetch(`${getBaseUrl()}/signup/college-student`, {
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

/**
 * Get list of colleges for dropdown
 * @returns {Promise<Object>} Colleges list
 */
export async function getColleges() {
  const response = await fetch(`${getBaseUrl()}/colleges`, {
    method: 'GET',
    headers: { 'Content-Type': 'application/json' },
  });

  const result = await response.json();
  
  if (!response.ok) {
    throw new Error(result.error || 'Failed to fetch colleges');
  }

  return result;
}

/**
 * Check if college code is unique
 * @param {string} code - College code to check
 * @returns {Promise<Object>} Check result
 */
export async function checkCollegeCode(code) {
  const response = await fetch(`${getBaseUrl()}/check-college-code`, {
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

// ==================== UNIVERSITY SIGNUP ENDPOINTS (No Auth Required) ====================

/**
 * Sign up a new university admin with university
 * @param {Object} data - University admin signup data
 * @returns {Promise<Object>} Signup result
 */
export async function signupUniversityAdmin(data) {
  const response = await fetch(`${getBaseUrl()}/signup/university-admin`, {
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

/**
 * Sign up a new university educator
 * @param {Object} data - University educator signup data
 * @returns {Promise<Object>} Signup result
 */
export async function signupUniversityEducator(data) {
  const response = await fetch(`${getBaseUrl()}/signup/university-educator`, {
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

/**
 * Sign up a new university student
 * @param {Object} data - University student signup data
 * @returns {Promise<Object>} Signup result
 */
export async function signupUniversityStudent(data) {
  const response = await fetch(`${getBaseUrl()}/signup/university-student`, {
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

/**
 * Get list of universities for dropdown
 * @returns {Promise<Object>} Universities list
 */
export async function getUniversities() {
  const response = await fetch(`${getBaseUrl()}/universities`, {
    method: 'GET',
    headers: { 'Content-Type': 'application/json' },
  });

  const result = await response.json();
  
  if (!response.ok) {
    throw new Error(result.error || 'Failed to fetch universities');
  }

  return result;
}

/**
 * Check if university code is unique
 * @param {string} code - University code to check
 * @returns {Promise<Object>} Check result
 */
export async function checkUniversityCode(code) {
  const response = await fetch(`${getBaseUrl()}/check-university-code`, {
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

// ==================== RECRUITER SIGNUP ENDPOINTS (No Auth Required) ====================

/**
 * Sign up a new recruiter admin with company
 * @param {Object} data - Recruiter admin signup data
 * @returns {Promise<Object>} Signup result
 */
export async function signupRecruiterAdmin(data) {
  const response = await fetch(`${getBaseUrl()}/signup/recruiter-admin`, {
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

/**
 * Sign up a new recruiter (joins existing company)
 * @param {Object} data - Recruiter signup data
 * @returns {Promise<Object>} Signup result
 */
export async function signupRecruiter(data) {
  const response = await fetch(`${getBaseUrl()}/signup/recruiter`, {
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

/**
 * Get list of companies for dropdown
 * @returns {Promise<Object>} Companies list
 */
export async function getCompanies() {
  const response = await fetch(`${getBaseUrl()}/companies`, {
    method: 'GET',
    headers: { 'Content-Type': 'application/json' },
  });

  const result = await response.json();
  
  if (!response.ok) {
    throw new Error(result.error || 'Failed to fetch companies');
  }

  return result;
}

/**
 * Check if company code is unique
 * @param {string} code - Company code to check
 * @returns {Promise<Object>} Check result
 */
export async function checkCompanyCode(code) {
  const response = await fetch(`${getBaseUrl()}/check-company-code`, {
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

/**
 * Create a new student (admin adds student)
 */
export async function createStudent(studentData, token) {
  const response = await fetch(`${getBaseUrl()}/create-student`, {
    method: 'POST',
    headers: getAuthHeaders(token),
    body: JSON.stringify(studentData),
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({}));
    throw new Error(error.error || 'Failed to create student');
  }

  return response.json();
}

/**
 * Create a new teacher/educator (admin adds teacher)
 */
export async function createTeacher(teacherData, token) {
  const response = await fetch(`${getBaseUrl()}/create-teacher`, {
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

/**
 * Reset user password (admin function)
 */
export async function resetPassword({ userId, newPassword, action, email, otp }, token) {
  const response = await fetch(`${getBaseUrl()}/reset-password`, {
    method: 'POST',
    headers: getAuthHeaders(token),
    body: JSON.stringify({ userId, newPassword, action, email, otp }),
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({}));
    throw new Error(error.error || 'Failed to reset password');
  }

  return response.json();
}

/**
 * Create event user (after event registration payment)
 */
export async function createEventUser({ email, firstName, lastName, role, phone, registrationId, metadata }, token) {
  const response = await fetch(`${getBaseUrl()}/create-event-user`, {
    method: 'POST',
    headers: getAuthHeaders(token),
    body: JSON.stringify({ email, firstName, lastName, role, phone, registrationId, metadata }),
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({}));
    throw new Error(error.error || 'Failed to create event user');
  }

  return response.json();
}

/**
 * Send interview reminder email
 */
export async function sendInterviewReminder({ interviewId, recipientEmail, recipientName, interviewDetails }, token) {
  const response = await fetch(`${getBaseUrl()}/send-interview-reminder`, {
    method: 'POST',
    headers: getAuthHeaders(token),
    body: JSON.stringify({ interviewId, recipientEmail, recipientName, interviewDetails }),
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({}));
    throw new Error(error.error || 'Failed to send interview reminder');
  }

  return response.json();
}

export default {
  // School Signup (no auth)
  signupSchoolAdmin,
  signupEducator,
  signupStudent,
  getSchools,
  checkSchoolCode,
  checkEmail,
  // College Signup (no auth)
  signupCollegeAdmin,
  signupCollegeEducator,
  signupCollegeStudent,
  getColleges,
  checkCollegeCode,
  // University Signup (no auth)
  signupUniversityAdmin,
  signupUniversityEducator,
  signupUniversityStudent,
  getUniversities,
  checkUniversityCode,
  // Recruiter Signup (no auth)
  signupRecruiterAdmin,
  signupRecruiter,
  getCompanies,
  checkCompanyCode,
  // Authenticated
  createStudent,
  createTeacher,
  createEventUser,
  sendInterviewReminder,
  resetPassword,
};
