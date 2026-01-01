/**
 * Router - Maps routes to handlers
 */

import { Env } from './types';
import { jsonResponse } from './utils/helpers';
import { corsHeaders, API_VERSION } from './constants';
import {
  // School
  handleSchoolAdminSignup,
  handleEducatorSignup,
  handleStudentSignup,
  // College
  handleCollegeAdminSignup,
  handleCollegeEducatorSignup,
  handleCollegeStudentSignup,
  // University
  handleUniversityAdminSignup,
  handleUniversityEducatorSignup,
  handleUniversityStudentSignup,
  // Recruiter
  handleRecruiterAdminSignup,
  handleRecruiterSignup,
  // Utility
  handleGetSchools,
  handleGetColleges,
  handleGetUniversities,
  handleGetCompanies,
  handleCheckSchoolCode,
  handleCheckCollegeCode,
  handleCheckUniversityCode,
  handleCheckCompanyCode,
  handleCheckEmail,
  // Authenticated
  handleCreateStudent,
  handleCreateTeacher,
  handleUpdateStudentDocuments,
  // Events
  handleCreateEventUser,
  handleSendInterviewReminder,
  // Password
  handleResetPassword,
} from './handlers';

type RouteHandler = (request: Request, env: Env) => Promise<Response>;

interface Route {
  method: 'GET' | 'POST';
  handler: RouteHandler;
}

// Route definitions
const routes: Record<string, Route> = {
  // ===== SCHOOL SIGNUP (No Auth) =====
  '/signup/school-admin': { method: 'POST', handler: handleSchoolAdminSignup },
  '/signup/educator': { method: 'POST', handler: handleEducatorSignup },
  '/signup/student': { method: 'POST', handler: handleStudentSignup },

  // ===== COLLEGE SIGNUP (No Auth) =====
  '/signup/college-admin': { method: 'POST', handler: handleCollegeAdminSignup },
  '/signup/college-educator': { method: 'POST', handler: handleCollegeEducatorSignup },
  '/signup/college-student': { method: 'POST', handler: handleCollegeStudentSignup },

  // ===== UNIVERSITY SIGNUP (No Auth) =====
  '/signup/university-admin': { method: 'POST', handler: handleUniversityAdminSignup },
  '/signup/university-educator': { method: 'POST', handler: handleUniversityEducatorSignup },
  '/signup/university-student': { method: 'POST', handler: handleUniversityStudentSignup },

  // ===== RECRUITER SIGNUP (No Auth) =====
  '/signup/recruiter-admin': { method: 'POST', handler: handleRecruiterAdminSignup },
  '/signup/recruiter': { method: 'POST', handler: handleRecruiterSignup },

  // ===== UTILITY (No Auth) =====
  '/schools': { method: 'GET', handler: handleGetSchools },
  '/colleges': { method: 'GET', handler: handleGetColleges },
  '/universities': { method: 'GET', handler: handleGetUniversities },
  '/companies': { method: 'GET', handler: handleGetCompanies },
  '/check-school-code': { method: 'POST', handler: handleCheckSchoolCode },
  '/check-college-code': { method: 'POST', handler: handleCheckCollegeCode },
  '/check-university-code': { method: 'POST', handler: handleCheckUniversityCode },
  '/check-company-code': { method: 'POST', handler: handleCheckCompanyCode },
  '/check-email': { method: 'POST', handler: handleCheckEmail },

  // ===== AUTHENTICATED =====
  '/create-student': { method: 'POST', handler: handleCreateStudent },
  '/create-teacher': { method: 'POST', handler: handleCreateTeacher },
  '/update-student-documents': { method: 'POST', handler: handleUpdateStudentDocuments },
  '/create-event-user': { method: 'POST', handler: handleCreateEventUser },
  '/send-interview-reminder': { method: 'POST', handler: handleSendInterviewReminder },
  '/reset-password': { method: 'POST', handler: handleResetPassword },
};

/**
 * Handle health check endpoint
 */
function handleHealthCheck(): Response {
  return jsonResponse({
    status: 'ok',
    service: 'user-api',
    version: API_VERSION,
    endpoints: {
      signup: {
        school: ['/signup/school-admin', '/signup/educator', '/signup/student'],
        college: ['/signup/college-admin', '/signup/college-educator', '/signup/college-student'],
        university: ['/signup/university-admin', '/signup/university-educator', '/signup/university-student'],
        recruiter: ['/signup/recruiter-admin', '/signup/recruiter'],
      },
      utility: [
        '/schools',
        '/colleges',
        '/universities',
        '/companies',
        '/check-school-code',
        '/check-college-code',
        '/check-university-code',
        '/check-company-code',
        '/check-email',
      ],
      authenticated: [
        '/create-student',
        '/create-teacher',
        '/create-event-user',
        '/send-interview-reminder',
        '/reset-password',
      ],
    },
    timestamp: new Date().toISOString(),
  });
}

/**
 * Main router function
 */
export async function handleRequest(request: Request, env: Env): Promise<Response> {
  // Handle CORS preflight
  if (request.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  const url = new URL(request.url);
  const path = url.pathname;

  // Health check
  if (path === '/' || path === '/health') {
    return handleHealthCheck();
  }

  // Find matching route
  const route = routes[path];

  if (!route) {
    return jsonResponse(
      {
        error: 'Not found',
        path,
        availableEndpoints: Object.keys(routes),
      },
      404
    );
  }

  // Check method
  if (request.method !== route.method) {
    return jsonResponse({ error: 'Method not allowed' }, 405);
  }

  // Execute handler
  try {
    return await route.handler(request, env);
  } catch (error) {
    console.error('Router error:', error);
    return jsonResponse(
      { error: (error as Error).message || 'Internal server error' },
      500
    );
  }
}
