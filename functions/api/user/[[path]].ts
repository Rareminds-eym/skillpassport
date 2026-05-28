/**
 * User API - Pages Function
 * Handles user signup and management endpoints
 * 
 * Endpoints (20+):
 * - POST /signup - Unified signup
 * - POST /signup/school-admin - School admin signup
 * - POST /signup/educator - Educator signup
 * - POST /signup/learner - Learner signup
 * - POST /signup/college-admin - College admin signup
 * - POST /signup/college-educator - College educator signup
 * - POST /signup/university-admin - University admin signup
 * - POST /signup/university-educator - University educator signup
 * - POST /signup/recruiter-admin - Recruiter admin signup
 * - POST /signup/recruiter - Recruiter signup
 * - GET /schools - Get schools list
 * - GET /colleges - Get colleges list
 * - GET /universities - Get universities list
 * - GET /companies - Get companies list
 * - POST /check-school-code - Validate school code
 * - POST /check-college-code - Validate college code
 * - POST /check-university-code - Validate university code
 * - POST /check-company-code - Validate company code
 * - POST /check-email - Check email availability
 * - POST /create-learner - Create learner (authenticated)
 * - POST /create-teacher - Create teacher (authenticated)
 * - POST /create-college-staff - Create college staff (authenticated)
 * - POST /update-learner-documents - Update learner documents (authenticated)
 * - POST /create-event-user - Create event user (authenticated)
 * - POST /send-interview-reminder - Send interview reminder (authenticated)
 * - POST /reset-password - Reset password
 */

import type { PagesFunction } from '../../lib/types';
import { getCorsHeaders } from '../../lib/cors';
import { apiSuccess, apiError } from '../../lib/response';
import { withAuth, getContextUser } from '../../lib/auth';
import type { AuthenticatedContext } from '@rareminds-eym/auth-core';
import {
  handleGetSchools,
  handleGetColleges,
  handleGetUniversities,
  handleGetCompanies,
  handleCheckSchoolCode,
  handleCheckCollegeCode,
  handleCheckUniversityCode,
  handleCheckCompanyCode,
  handleCheckEmail,
} from './handlers/utility';
import {
  handleSchoolAdminSignup,
  handleEducatorSignup,
  handleLearnerSignup,
} from './handlers/school';
import {
  handleCollegeAdminSignup,
  handleCollegeEducatorSignup,
} from './handlers/college';
import {
  handleUniversityAdminSignup,
  handleUniversityEducatorSignup,
} from './handlers/university';
import {
  handleRecruiterAdminSignup,
  handleRecruiterSignup,
} from './handlers/recruiter';
import { handleUnifiedSignup } from './handlers/unified';
import {
  handleCreateLearner,
  handleCreateTeacher,
  handleCreateCollegeStaff,
  handleUpdateLearnerDocuments,
} from './handlers/authenticated';
import {
  handleCreateEventUser,
  handleSendInterviewReminder,
} from './handlers/events';
import { handleResetPassword } from './handlers/password';

const API_VERSION = '1.0.0';

export const onRequest: PagesFunction = async (context) => {
  const { request, env } = context;

  // Handle CORS preflight
  if (request.method === 'OPTIONS') {
    const origin = request.headers.get('Origin') || '';
    return new Response(null, {
      status: 204,
      headers: {
        ...getCorsHeaders(origin),
        'Access-Control-Max-Age': '86400',
      },
    });
  }

  const url = new URL(request.url);
  const path = url.pathname.replace('/api/user', '');

  try {
    // Health check
    if (!path || path === '/' || path === '/health') {
      return apiSuccess({
        status: 'ok',
        service: 'user-api',
        version: API_VERSION,
        endpoints: {
          signup: {
            unified: ['/signup'],
            school: ['/signup/school-admin', '/signup/educator', '/signup/learner'],
            college: ['/signup/college-admin', '/signup/college-educator'],
            university: ['/signup/university-admin', '/signup/university-educator'],
            recruiter: ['/signup/recruiter-admin', '/signup/recruiter'],
          },
          utility: [
            '/schools', '/colleges', '/universities', '/companies',
            '/check-school-code', '/check-college-code', '/check-university-code',
            '/check-company-code', '/check-email',
          ],
          authenticated: [
            '/create-learner', '/create-teacher', '/create-college-staff',
            '/create-event-user', '/send-interview-reminder', '/reset-password',
          ],
        },
        timestamp: new Date().toISOString(),
      }, request);
    }

    // Route to handlers

    // Unified signup endpoint
    if (path === '/signup' && request.method === 'POST') {
      return await handleUnifiedSignup(request, env);
    }

    // School signup endpoints
    if (path === '/signup/school-admin' && request.method === 'POST') {
      return await handleSchoolAdminSignup(request, env);
    }
    if (path === '/signup/educator' && request.method === 'POST') {
      return await handleEducatorSignup(request, env);
    }
    if (path === '/signup/learner' && request.method === 'POST') {
      return await handleLearnerSignup(request, env);
    }

    // College signup endpoints
    if (path === '/signup/college-admin' && request.method === 'POST') {
      return await handleCollegeAdminSignup(request, env);
    }
    if (path === '/signup/college-educator' && request.method === 'POST') {
      return await handleCollegeEducatorSignup(request, env);
    }


    // University signup endpoints
    if (path === '/signup/university-admin' && request.method === 'POST') {
      return await handleUniversityAdminSignup(request, env);
    }
    if (path === '/signup/university-educator' && request.method === 'POST') {
      return await handleUniversityEducatorSignup(request, env);
    }


    // Recruiter signup endpoints
    if (path === '/signup/recruiter-admin' && request.method === 'POST') {
      return await handleRecruiterAdminSignup(request, env);
    }
    if (path === '/signup/recruiter' && request.method === 'POST') {
      return await handleRecruiterSignup(request, env);
    }

    // Utility GET endpoints - Institution lists
    if (path === '/schools' && request.method === 'GET') {
      return await handleGetSchools(env);
    }
    if (path === '/colleges' && request.method === 'GET') {
      return await handleGetColleges(env);
    }
    if (path === '/universities' && request.method === 'GET') {
      return await handleGetUniversities(env);
    }
    if (path === '/companies' && request.method === 'GET') {
      return await handleGetCompanies(env);
    }

    // Utility POST endpoints - Code validation
    if (path === '/check-school-code' && request.method === 'POST') {
      return await handleCheckSchoolCode(request, env);
    }
    if (path === '/check-college-code' && request.method === 'POST') {
      return await handleCheckCollegeCode(request, env);
    }
    if (path === '/check-university-code' && request.method === 'POST') {
      return await handleCheckUniversityCode(request, env);
    }
    if (path === '/check-company-code' && request.method === 'POST') {
      return await handleCheckCompanyCode(request, env);
    }
    if (path === '/check-email' && request.method === 'POST') {
      return await handleCheckEmail(request, env);
    }

    // Authenticated endpoints
    if (path === '/create-learner' && request.method === 'POST') {
      return withAuth(async (authContext: AuthenticatedContext) => {
        return await handleCreateLearner(authContext.request, authContext.env);
      })(context);
    }
    if (path === '/create-teacher' && request.method === 'POST') {
      return withAuth(async (authContext: AuthenticatedContext) => {
        const user = getContextUser(authContext);
        return await handleCreateTeacher(authContext.request, authContext.env, { id: user.id, email: user.email || '' });
      })(context);
    }
    if (path === '/create-college-staff' && request.method === 'POST') {
      return withAuth(async (authContext: AuthenticatedContext) => {
        const user = getContextUser(authContext);
        return await handleCreateCollegeStaff(authContext.request, authContext.env, { id: user.id, email: user.email || '' });
      })(context);
    }
    if (path === '/update-learner-documents' && request.method === 'POST') {
      return withAuth(async (authContext: AuthenticatedContext) => {
        return await handleUpdateLearnerDocuments(authContext.request, authContext.env);
      })(context);
    }
    if (path === '/create-event-user' && request.method === 'POST') {
      return withAuth(async (authContext: AuthenticatedContext) => {
        return await handleCreateEventUser(authContext.request, authContext.env);
      })(context);
    }
    if (path === '/send-interview-reminder' && request.method === 'POST') {
      return withAuth(async (authContext: AuthenticatedContext) => {
        return await handleSendInterviewReminder(authContext.request, authContext.env);
      })(context);
    }
    if (path === '/reset-password' && request.method === 'POST') {
      return await handleResetPassword(request, env);
    }

    return apiError(404, 'NOT_FOUND', 'Not found', request);
  } catch (error) {
    console.error('User API Error:', error);
    return apiError(500, 'INTERNAL_ERROR', (error as Error).message || 'Internal server error', request);
  }
};
