/**
 * Utility handlers for User API
 * - Get schools/colleges/universities/companies lists
 * - Check code uniqueness
 * - Check email availability
 * 
 * Uses unified 'organizations' table for schools, colleges, universities
 * 
 * Performance optimizations:
 * - In-memory caching for institution lists (1 hour TTL)
 * - Cache-Control headers for browser/CDN caching
 */

import { createSupabaseAdminClient } from '../../../lib/supabase';
import { apiSuccess, apiError } from '../../../lib/response';
import type { PagesEnv } from '../../../lib/types';
import { validateEmail, checkEmailExists } from '../utils/helpers';

// ==================== TYPES ====================

interface CheckCodeRequest {
  code: string;
}

interface CheckEmailRequest {
  email: string;
}

interface CacheEntry {
  data: any;
  timestamp: number;
}

// ==================== CACHING ====================

// In-memory cache for institution lists
const cache = new Map<string, CacheEntry>();
const CACHE_TTL = 3600000; // 1 hour in milliseconds

/**
 * Get data from cache if not expired
 */
function getCached(key: string): any | null {
  const cached = cache.get(key);
  if (cached && Date.now() - cached.timestamp < CACHE_TTL) {
    return cached.data;
  }
  // Remove expired entry
  if (cached) {
    cache.delete(key);
  }
  return null;
}

/**
 * Store data in cache with current timestamp
 */
function setCache(key: string, data: any): void {
  cache.set(key, { data, timestamp: Date.now() });
}

/**
 * Clear all cache entries (for testing/debugging)
 */
export function clearCache(): void {
  cache.clear();
}

// ==================== HELPERS ====================

// Helper functions imported from ../utils/helpers.ts
// - validateEmail
// - checkEmailExists

// ==================== GET LISTS ====================

/**
 * Get all schools for dropdown from organizations table
 * Cached for 1 hour to improve performance
 */
export async function handleGetSchools(env: PagesEnv): Promise<Response> {
  const cacheKey = 'schools';
  const cached = getCached(cacheKey);

  // Return cached data if available
  if (cached) {
    return apiSuccess(cached, undefined);
  }

  const supabaseAdmin = createSupabaseAdminClient(env);

  try {
    const { data: schools, error } = await supabaseAdmin
      .from('organizations')
      .select('id, name, city, state, country, code')
      .eq('organization_type', 'school')
      .order('name', { ascending: true });

    if (error) {
      console.error('Error fetching schools:', error);
return apiError(500, 'INTERNAL_ERROR', 'Failed to fetch schools', undefined);
    }

    const response = { success: true, data: schools || [] };
    
    // Cache the response
    setCache(cacheKey, response);

    return apiSuccess(response, undefined);
  } catch (error) {
    console.error('Get schools error:', error);
    return apiError(500, 'INTERNAL_ERROR', 'Failed to fetch schools', undefined);
  }
}

/**
 * Get all colleges for dropdown from organizations table
 * Cached for 1 hour to improve performance
 */
export async function handleGetColleges(env: PagesEnv): Promise<Response> {
  const cacheKey = 'colleges';
  const cached = getCached(cacheKey);

  // Return cached data if available
  if (cached) {
    return apiSuccess(cached, undefined);
  }

  const supabaseAdmin = createSupabaseAdminClient(env);

  try {
    const { data: colleges, error } = await supabaseAdmin
      .from('organizations')
      .select('id, name, city, state, country, code')
      .eq('organization_type', 'college')
      .order('name', { ascending: true });

    if (error) {
      console.error('Error fetching colleges:', error);
return apiError(500, 'INTERNAL_ERROR', 'Failed to fetch colleges', undefined);
    }

    const response = { success: true, data: colleges || [] };
    
    // Cache the response
    setCache(cacheKey, response);

    return apiSuccess(response, undefined);
  } catch (error) {
    console.error('Get colleges error:', error);
    return apiError(500, 'INTERNAL_ERROR', 'Failed to fetch colleges', undefined);
  }
}

/**
 * Get all universities for dropdown from organizations table
 * Cached for 1 hour to improve performance
 */
export async function handleGetUniversities(env: PagesEnv): Promise<Response> {
  const cacheKey = 'universities';
  const cached = getCached(cacheKey);

  // Return cached data if available
  if (cached) {
    return apiSuccess(cached, undefined);
  }

  const supabaseAdmin = createSupabaseAdminClient(env);

  try {
    const { data: universities, error } = await supabaseAdmin
      .from('organizations')
      .select('id, name, city, state, code')
      .eq('organization_type', 'university')
      .order('name', { ascending: true });

    if (error) {
      console.error('Error fetching universities:', error);
return apiError(500, 'INTERNAL_ERROR', 'Failed to fetch universities', undefined);
    }

    const response = { success: true, data: universities || [] };
    
    // Cache the response
    setCache(cacheKey, response);

    return apiSuccess(response, undefined);
  } catch (error) {
    console.error('Get universities error:', error);
    return apiError(500, 'INTERNAL_ERROR', 'Failed to fetch universities', undefined);
  }
}

/**
 * Get all companies for dropdown
 * Cached for 1 hour to improve performance
 */
export async function handleGetCompanies(env: PagesEnv): Promise<Response> {
  const cacheKey = 'companies';
  const cached = getCached(cacheKey);

  // Return cached data if available
  if (cached) {
    return apiSuccess(cached, undefined);
  }

  const supabaseAdmin = createSupabaseAdminClient(env);

  try {
    const { data: companies, error } = await supabaseAdmin
      .from('companies')
      .select('id, name, hqCity, hqState, hqCountry, code')
      .order('name', { ascending: true });

    if (error) {
      console.error('Error fetching companies:', error);
return apiError(500, 'INTERNAL_ERROR', 'Failed to fetch companies', undefined);
    }

    const response = { success: true, data: companies || [] };
    
    // Cache the response
    setCache(cacheKey, response);

    return apiSuccess(response, undefined);
  } catch (error) {
    console.error('Get companies error:', error);
    return apiError(500, 'INTERNAL_ERROR', 'Failed to fetch companies', undefined);
  }
}

// ==================== CHECK CODE UNIQUENESS ====================

/**
 * Check if school code is unique in organizations table
 */
export async function handleCheckSchoolCode(request: Request, env: PagesEnv): Promise<Response> {
  const supabaseAdmin = createSupabaseAdminClient(env);

  try {
    const body = (await request.json()) as CheckCodeRequest;

    if (!body.code) {
      return apiError(400, 'VALIDATION_ERROR', 'School code is required', request);
    }

    const { data: existingSchool } = await supabaseAdmin
      .from('organizations')
      .select('id')
      .eq('organization_type', 'school')
      .eq('code', body.code)
      .maybeSingle();

    return apiSuccess({
      isUnique: !existingSchool,
      message: existingSchool ? 'School code already exists' : 'School code is available',
    }, request);
  } catch (error) {
    console.error('Check school code error:', error);
    return apiError(500, 'INTERNAL_ERROR', 'Failed to check school code', request);
  }
}

/**
 * Check if college code is unique in organizations table
 */
export async function handleCheckCollegeCode(request: Request, env: PagesEnv): Promise<Response> {
  const supabaseAdmin = createSupabaseAdminClient(env);

  try {
    const body = (await request.json()) as CheckCodeRequest;

    if (!body.code) {
      return apiError(400, 'VALIDATION_ERROR', 'College code is required', request);
    }

    const { data: existingCollege } = await supabaseAdmin
      .from('organizations')
      .select('id')
      .eq('organization_type', 'college')
      .eq('code', body.code)
      .maybeSingle();

    return apiSuccess({
      isUnique: !existingCollege,
      message: existingCollege ? 'College code already exists' : 'College code is available',
    }, request);
  } catch (error) {
    console.error('Check college code error:', error);
    return apiError(500, 'INTERNAL_ERROR', 'Failed to check college code', request);
  }
}

/**
 * Check if university code is unique in organizations table
 */
export async function handleCheckUniversityCode(request: Request, env: PagesEnv): Promise<Response> {
  const supabaseAdmin = createSupabaseAdminClient(env);

  try {
    const body = (await request.json()) as CheckCodeRequest;

    if (!body.code) {
      return apiError(400, 'VALIDATION_ERROR', 'University code is required', request);
    }

    const { data: existingUniversity } = await supabaseAdmin
      .from('organizations')
      .select('id')
      .eq('organization_type', 'university')
      .eq('code', body.code)
      .maybeSingle();

    return apiSuccess({
      isUnique: !existingUniversity,
      message: existingUniversity ? 'University code already exists' : 'University code is available',
    }, request);
  } catch (error) {
    console.error('Check university code error:', error);
    return apiError(500, 'INTERNAL_ERROR', 'Failed to check university code', request);
  }
}

/**
 * Check if company code is unique
 */
export async function handleCheckCompanyCode(request: Request, env: PagesEnv): Promise<Response> {
  const supabaseAdmin = createSupabaseAdminClient(env);

  try {
    const body = (await request.json()) as CheckCodeRequest;

    if (!body.code) {
      return apiError(400, 'VALIDATION_ERROR', 'Company code is required', request);
    }

    const { data: existingCompany } = await supabaseAdmin
      .from('companies')
      .select('id')
      .eq('code', body.code)
      .maybeSingle();

    return apiSuccess({
      isUnique: !existingCompany,
      message: existingCompany ? 'Company code already exists' : 'Company code is available',
    }, request);
  } catch (error) {
    console.error('Check company code error:', error);
    return apiError(500, 'INTERNAL_ERROR', 'Failed to check company code', request);
  }
}

// ==================== CHECK EMAIL ====================

/**
 * Check if email already exists
 */
export async function handleCheckEmail(request: Request, env: PagesEnv): Promise<Response> {
  const supabaseAdmin = createSupabaseAdminClient(env);

  try {
    const body = (await request.json()) as CheckEmailRequest;

    if (!body.email) {
      return apiError(400, 'VALIDATION_ERROR', 'Email is required', request);
    }

    if (!validateEmail(body.email)) {
      return apiError(400, 'VALIDATION_ERROR', 'Invalid email format', request);
    }

    const emailExists = await checkEmailExists(supabaseAdmin, body.email);

    return apiSuccess({
      exists: emailExists,
      message: emailExists
        ? 'An account with this email already exists'
        : 'Email is available',
    }, request);
  } catch (error) {
    console.error('Check email error:', error);
    return apiError(500, 'INTERNAL_ERROR', 'Failed to check email', request);
  }
}
