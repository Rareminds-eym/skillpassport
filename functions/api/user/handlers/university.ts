/**
 * University signup handlers for User API
 * - University Admin signup
 * - University Educator signup
 *
 * 
 * Uses unified 'organizations' table with organization_type='university'
 */

import { createSupabaseAdminClient } from '../../../lib/supabase';
import { apiSuccess, apiError } from '../../../lib/response';
import type { PagesEnv } from '../../../lib/types';
import type { UniversityAdminSignupRequest, UniversityEducatorSignupRequest } from '../types';
import { sendWelcomeEmail } from '../utils/email';
import {
  capitalizeFirstLetter,
  splitName,
  validateEmail,
  checkEmailExists,
  deleteAuthUser,
} from '../utils/helpers';

/**
 * Handle university admin signup with university creation
 * Creates organization record in unified 'organizations' table
 */
export async function handleUniversityAdminSignup(request: Request, env: PagesEnv): Promise<Response> {
  const supabaseAdmin = createSupabaseAdminClient(env);

  try {
    const body = (await request.json()) as UniversityAdminSignupRequest;

    const requiredFields = ['email', 'password', 'universityName', 'universityCode', 'state', 'chancellorName'];
    for (const field of requiredFields) {
      if (!body[field as keyof UniversityAdminSignupRequest]) {
        return apiError(400, 'VALIDATION_ERROR', `Missing required field: ${field}`, request);
      }
    }

    if (!validateEmail(body.email)) {
      return apiError(400, 'VALIDATION_ERROR', 'Invalid email format', request);
    }

    if (body.password.length < 6) {
      return apiError(400, 'VALIDATION_ERROR', 'Password must be at least 6 characters', request);
    }

    if (await checkEmailExists(supabaseAdmin, body.email)) {
      return apiError(400, 'VALIDATION_ERROR', 'An account with this email already exists', request);
    }

    // Check if university code is unique in organizations table
    const { data: existingUniversity } = await supabaseAdmin
      .from('organizations')
      .select('id')
      .eq('organization_type', 'university')
      .eq('code', body.universityCode)
      .maybeSingle();

    if (existingUniversity) {
      return apiError(400, 'VALIDATION_ERROR', 'University code already exists', request);
    }

    const { data: authUser, error: authError } = await supabaseAdmin.auth.admin.createUser({
      email: body.email.toLowerCase(),
      password: body.password,
      email_confirm: true,
      user_metadata: {
        name: body.chancellorName,
        role: 'university_admin',
        phone: body.phone || body.chancellorPhone,
      },
    });

    if (authError || !authUser.user) {
      console.error('Auth user creation failed:', authError);
      return apiError(500, 'INTERNAL_ERROR', authError?.message || 'Failed to create account', request);
    }

    const userId = authUser.user.id;

    try {
      const { firstName, lastName } = splitName(body.chancellorName);

      const { error: userError } = await supabaseAdmin.from('users').insert({
        id: userId,
        email: body.email.toLowerCase(),
        firstName,
        lastName,
        role: 'university_admin',
        organizationId: null,
        isActive: true,
        phone: body.phone || body.chancellorPhone,
        metadata: {
          source: 'university_signup',
          universityCode: body.universityCode,
          dateOfBirth: body.dateOfBirth,
        },
      });

      if (userError) {
        throw new Error(`Failed to create user record: ${userError.message}`);
      }

      const { data: university, error: universityError } = await supabaseAdmin
        .from('organizations')
        .insert({
          name: body.universityName,
          organization_type: 'university',
          code: body.universityCode,
          email: body.email.toLowerCase(),
          phone: body.phone,
          website: body.website,
          address: body.address,
          city: body.city,
          state: body.state,
          country: body.country || 'India',
          pincode: body.pincode,
          admin_id: userId,
          account_status: 'pending',
          approval_status: 'pending',
          is_active: true,
          metadata: {
            established_year: body.establishedYear,
            accreditation: body.accreditation,
            chancellor_name: body.chancellorName,
            chancellor_email: body.chancellorEmail || body.email,
            chancellor_phone: body.chancellorPhone || body.phone,
          },
        })
        .select()
        .single();

      if (universityError || !university) {
        throw new Error(`Failed to create university: ${universityError?.message}`);
      }

      await supabaseAdmin.from('users').update({ organizationId: university.id }).eq('id', userId);

      await sendWelcomeEmail(
        env,
        body.email,
        body.chancellorName,
        body.password,
        'university_admin',
        `<strong>University:</strong> ${body.universityName}`
      );

      return apiSuccess({
        message: 'University account created successfully! Please check your email for login details.',
        data: {
          userId,
          universityId: university.id,
          universityName: university.name,
          universityCode: university.code,
          email: body.email,
          role: 'university_admin',
        },
      }, request);
    } catch (error) {
      console.error('Rollback: deleting auth user due to error:', error);
      await deleteAuthUser(supabaseAdmin, userId);
      throw error;
    }
  } catch (error) {
    console.error('University admin signup error:', error);
    return apiError(500, 'INTERNAL_ERROR', error instanceof Error ? error.message : 'Failed to create university account', request);
  }
}

/**
 * Handle university educator signup
 * Verifies university exists in organizations table
 */
export async function handleUniversityEducatorSignup(request: Request, env: PagesEnv): Promise<Response> {
  const supabaseAdmin = createSupabaseAdminClient(env);

  try {
    const body = (await request.json()) as UniversityEducatorSignupRequest;

    if (!body.email || !body.password || !body.firstName || !body.lastName || !body.universityId) {
      return apiError(400, 'VALIDATION_ERROR', 'Missing required fields: email, password, firstName, lastName, universityId', request);
    }

    if (!validateEmail(body.email)) {
      return apiError(400, 'VALIDATION_ERROR', 'Invalid email format', request);
    }

    if (body.password.length < 6) {
      return apiError(400, 'VALIDATION_ERROR', 'Password must be at least 6 characters', request);
    }

    if (await checkEmailExists(supabaseAdmin, body.email)) {
      return apiError(400, 'VALIDATION_ERROR', 'An account with this email already exists', request);
    }

    // Verify university exists in organizations table
    const { data: university, error: universityError } = await supabaseAdmin
      .from('organizations')
      .select('id, name')
      .eq('id', body.universityId)
      .eq('organization_type', 'university')
      .single();

    if (universityError || !university) {
      return apiError(400, 'VALIDATION_ERROR', 'Invalid university selected', request);
    }

    const { data: authUser, error: authError } = await supabaseAdmin.auth.admin.createUser({
      email: body.email.toLowerCase(),
      password: body.password,
      email_confirm: true,
      user_metadata: {
        first_name: capitalizeFirstLetter(body.firstName),
        last_name: capitalizeFirstLetter(body.lastName),
        name: `${capitalizeFirstLetter(body.firstName)} ${capitalizeFirstLetter(body.lastName)}`,
        role: 'university_educator',
        phone: body.phone,
        university_id: body.universityId,
      },
    });

    if (authError || !authUser.user) {
      console.error('Auth user creation failed:', authError);
      return apiError(500, 'INTERNAL_ERROR', authError?.message || 'Failed to create account', request);
    }

    const userId = authUser.user.id;

    try {
      const firstName = capitalizeFirstLetter(body.firstName);
      const lastName = capitalizeFirstLetter(body.lastName);

      const { error: userError } = await supabaseAdmin.from('users').insert({
        id: userId,
        email: body.email.toLowerCase(),
        firstName: firstName,
        lastName: lastName,
        role: 'university_educator',
        organizationId: body.universityId,
        isActive: true,
        phone: body.phone,
        metadata: {
          source: 'university_educator_signup',
          universityId: body.universityId,
          dateOfBirth: body.dateOfBirth,
        },
      });

      if (userError) {
        throw new Error(`Failed to create user record: ${userError.message}`);
      }

      const { data: educator, error: educatorError } = await supabaseAdmin
        .from('university_educators')
        .insert({
          user_id: userId,
          university_id: body.universityId,
          email: body.email.toLowerCase(),
          first_name: firstName,
          last_name: lastName,
          phone: body.phone,
          designation: body.designation,
          department: body.department,
          employee_id: body.employeeId,
          qualification: body.qualification,
          experience_years: body.experienceYears,
          specialization: body.specialization,
          status: 'active',
          metadata: { source: 'self_signup' },
        })
        .select()
        .single();

      if (educatorError || !educator) {
        throw new Error(`Failed to create educator profile: ${educatorError?.message}`);
      }

      await sendWelcomeEmail(
        env,
        body.email,
        `${body.firstName} ${body.lastName}`,
        body.password,
        'university_educator',
        `<strong>University:</strong> ${university.name}`
      );

      return apiSuccess({
        message: 'University educator account created successfully!',
        data: {
          userId,
          educatorId: educator.id,
          email: body.email,
          name: `${body.firstName} ${body.lastName}`,
          universityId: body.universityId,
          universityName: university.name,
          role: 'university_educator',
        },
      }, request);
    } catch (error) {
      console.error('Rollback: deleting auth user due to error:', error);
      await deleteAuthUser(supabaseAdmin, userId);
      throw error;
    }
  } catch (error) {
    console.error('University educator signup error:', error);
    return apiError(500, 'INTERNAL_ERROR', error instanceof Error ? error.message : 'Failed to create university educator account', request);
  }
}
