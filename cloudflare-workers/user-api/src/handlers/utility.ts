/**
 * Utility handlers
 * - Get schools/colleges/universities/companies lists
 * - Check code uniqueness
 * - Check email availability
 */

import { Env, CheckCodeRequest, CheckEmailRequest } from '../types';
import { jsonResponse, validateEmail } from '../utils/helpers';
import { getSupabaseAdmin, checkEmailExists } from '../utils/supabase';

// ==================== GET LISTS ====================

/**
 * Get all schools for dropdown
 */
export async function handleGetSchools(request: Request, env: Env): Promise<Response> {
  const supabaseAdmin = getSupabaseAdmin(env);

  try {
    const { data: schools, error } = await supabaseAdmin
      .from('schools')
      .select('id, name, city, state, country, code')
      .order('name', { ascending: true });

    if (error) {
      console.error('Error fetching schools:', error);
      return jsonResponse({ error: 'Failed to fetch schools' }, 500);
    }

    return jsonResponse({ success: true, data: schools || [] });
  } catch (error) {
    console.error('Get schools error:', error);
    return jsonResponse({ error: 'Failed to fetch schools' }, 500);
  }
}

/**
 * Get all colleges for dropdown
 */
export async function handleGetColleges(request: Request, env: Env): Promise<Response> {
  const supabaseAdmin = getSupabaseAdmin(env);

  try {
    const { data: colleges, error } = await supabaseAdmin
      .from('colleges')
      .select('id, name, city, state, country, code')
      .order('name', { ascending: true });

    if (error) {
      console.error('Error fetching colleges:', error);
      return jsonResponse({ error: 'Failed to fetch colleges' }, 500);
    }

    return jsonResponse({ success: true, data: colleges || [] });
  } catch (error) {
    console.error('Get colleges error:', error);
    return jsonResponse({ error: 'Failed to fetch colleges' }, 500);
  }
}

/**
 * Get all universities for dropdown
 */
export async function handleGetUniversities(request: Request, env: Env): Promise<Response> {
  const supabaseAdmin = getSupabaseAdmin(env);

  try {
    const { data: universities, error } = await supabaseAdmin
      .from('universities')
      .select('id, name, district, state, code')
      .order('name', { ascending: true });

    if (error) {
      console.error('Error fetching universities:', error);
      return jsonResponse({ error: 'Failed to fetch universities' }, 500);
    }

    return jsonResponse({ success: true, data: universities || [] });
  } catch (error) {
    console.error('Get universities error:', error);
    return jsonResponse({ error: 'Failed to fetch universities' }, 500);
  }
}

/**
 * Get all companies for dropdown
 */
export async function handleGetCompanies(request: Request, env: Env): Promise<Response> {
  const supabaseAdmin = getSupabaseAdmin(env);

  try {
    const { data: companies, error } = await supabaseAdmin
      .from('companies')
      .select('id, name, hqCity, hqState, hqCountry, code')
      .order('name', { ascending: true });

    if (error) {
      console.error('Error fetching companies:', error);
      return jsonResponse({ error: 'Failed to fetch companies' }, 500);
    }

    return jsonResponse({ success: true, data: companies || [] });
  } catch (error) {
    console.error('Get companies error:', error);
    return jsonResponse({ error: 'Failed to fetch companies' }, 500);
  }
}

// ==================== CHECK CODE UNIQUENESS ====================

/**
 * Check if school code is unique
 */
export async function handleCheckSchoolCode(request: Request, env: Env): Promise<Response> {
  const supabaseAdmin = getSupabaseAdmin(env);

  try {
    const body = (await request.json()) as CheckCodeRequest;

    if (!body.code) {
      return jsonResponse({ error: 'School code is required' }, 400);
    }

    const { data: existingSchool } = await supabaseAdmin
      .from('schools')
      .select('id')
      .eq('code', body.code)
      .maybeSingle();

    return jsonResponse({
      success: true,
      isUnique: !existingSchool,
      message: existingSchool ? 'School code already exists' : 'School code is available',
    });
  } catch (error) {
    console.error('Check school code error:', error);
    return jsonResponse({ error: 'Failed to check school code' }, 500);
  }
}

/**
 * Check if college code is unique
 */
export async function handleCheckCollegeCode(request: Request, env: Env): Promise<Response> {
  const supabaseAdmin = getSupabaseAdmin(env);

  try {
    const body = (await request.json()) as CheckCodeRequest;

    if (!body.code) {
      return jsonResponse({ error: 'College code is required' }, 400);
    }

    const { data: existingCollege } = await supabaseAdmin
      .from('colleges')
      .select('id')
      .eq('code', body.code)
      .maybeSingle();

    return jsonResponse({
      success: true,
      isUnique: !existingCollege,
      message: existingCollege ? 'College code already exists' : 'College code is available',
    });
  } catch (error) {
    console.error('Check college code error:', error);
    return jsonResponse({ error: 'Failed to check college code' }, 500);
  }
}

/**
 * Check if university code is unique
 */
export async function handleCheckUniversityCode(request: Request, env: Env): Promise<Response> {
  const supabaseAdmin = getSupabaseAdmin(env);

  try {
    const body = (await request.json()) as CheckCodeRequest;

    if (!body.code) {
      return jsonResponse({ error: 'University code is required' }, 400);
    }

    const { data: existingUniversity } = await supabaseAdmin
      .from('universities')
      .select('id')
      .eq('code', body.code)
      .maybeSingle();

    return jsonResponse({
      success: true,
      isUnique: !existingUniversity,
      message: existingUniversity ? 'University code already exists' : 'University code is available',
    });
  } catch (error) {
    console.error('Check university code error:', error);
    return jsonResponse({ error: 'Failed to check university code' }, 500);
  }
}

/**
 * Check if company code is unique
 */
export async function handleCheckCompanyCode(request: Request, env: Env): Promise<Response> {
  const supabaseAdmin = getSupabaseAdmin(env);

  try {
    const body = (await request.json()) as CheckCodeRequest;

    if (!body.code) {
      return jsonResponse({ error: 'Company code is required' }, 400);
    }

    const { data: existingCompany } = await supabaseAdmin
      .from('companies')
      .select('id')
      .eq('code', body.code)
      .maybeSingle();

    return jsonResponse({
      success: true,
      isUnique: !existingCompany,
      message: existingCompany ? 'Company code already exists' : 'Company code is available',
    });
  } catch (error) {
    console.error('Check company code error:', error);
    return jsonResponse({ error: 'Failed to check company code' }, 500);
  }
}

// ==================== CHECK EMAIL ====================

/**
 * Check if email already exists
 */
export async function handleCheckEmail(request: Request, env: Env): Promise<Response> {
  const supabaseAdmin = getSupabaseAdmin(env);

  try {
    const body = (await request.json()) as CheckEmailRequest;

    if (!body.email) {
      return jsonResponse({ error: 'Email is required' }, 400);
    }

    if (!validateEmail(body.email)) {
      return jsonResponse({ error: 'Invalid email format' }, 400);
    }

    const emailExists = await checkEmailExists(supabaseAdmin, body.email);

    return jsonResponse({
      success: true,
      exists: emailExists,
      message: emailExists
        ? 'An account with this email already exists'
        : 'Email is available',
    });
  } catch (error) {
    console.error('Check email error:', error);
    return jsonResponse({ error: 'Failed to check email' }, 500);
  }
}
