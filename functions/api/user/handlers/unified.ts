/**
 * Unified Signup Handler for User API
 * 
 * Handles signup for all user types with proper rollback on failure.
 * This ensures no orphaned auth users are created.
 */

import { createSupabaseAdminClient } from '../../../../src/functions-lib/supabase';
import { jsonResponse } from '../../../../src/functions-lib/response';
import type { PagesEnv } from '../../../../src/functions-lib/types';
import type { UnifiedSignupRequest } from '../types';
import { sendWelcomeEmail } from '../utils/email';
import {
  capitalizeFirstLetter,
  validateEmail,
  checkEmailExists,
  deleteAuthUser,
} from '../utils/helpers';

/**
 * Handle unified signup for all user types
 * Creates auth user, public.users record, and role-specific record
 * Rolls back all changes if any step fails
 */
export async function handleUnifiedSignup(request: Request, env: PagesEnv): Promise<Response> {
  const supabaseAdmin = createSupabaseAdminClient(env);

  try {
    const body = (await request.json()) as UnifiedSignupRequest;

    // Validate required fields
    if (!body.email || !body.password || !body.firstName || !body.lastName || !body.role) {
      return jsonResponse(
        {
          error: 'Missing required fields: email, password, firstName, lastName, role',
        },
        400
      );
    }

    if (!validateEmail(body.email)) {
      return jsonResponse({ error: 'Invalid email format' }, 400);
    }

    if (body.password.length < 6) {
      return jsonResponse({ error: 'Password must be at least 6 characters' }, 400);
    }

    const email = body.email.toLowerCase();
    const firstName = capitalizeFirstLetter(body.firstName);
    const lastName = capitalizeFirstLetter(body.lastName);
    const fullName = `${firstName} ${lastName}`.trim();

    // Pre-check: Verify email doesn't exist in auth or users table
    if (await checkEmailExists(supabaseAdmin, email)) {
      return jsonResponse(
        {
          error: 'This email is already registered. Please login instead.',
        },
        400
      );
    }

    // Pre-check: Verify email doesn't exist in users table
    const { data: existingUser } = await supabaseAdmin
      .from('users')
      .select('id')
      .eq('email', email)
      .maybeSingle();

    if (existingUser) {
      return jsonResponse(
        {
          error: 'This email is already registered. Please login instead.',
        },
        400
      );
    }

    // Pre-check: Verify phone doesn't exist in users table (if provided)
    if (body.phone) {
      const { data: existingPhone } = await supabaseAdmin
        .from('users')
        .select('id')
        .eq('phone', body.phone)
        .maybeSingle();

      if (existingPhone) {
        return jsonResponse(
          {
            error: 'This phone number is already registered with another account.',
          },
          400
        );
      }
    }

    // 1. Create auth user
    const { data: authUser, error: authError } = await supabaseAdmin.auth.admin.createUser({
      email,
      password: body.password,
      email_confirm: true,
      user_metadata: {
        name: fullName,
        first_name: firstName,
        last_name: lastName,
        role: body.role,
        phone: body.phone,
      },
    });

    if (authError || !authUser.user) {
      console.error('Auth user creation failed:', authError);
      return jsonResponse(
        {
          error: authError?.message || 'Failed to create account',
        },
        500
      );
    }

    const userId = authUser.user.id;

    try {
      // 2. Create public.users record
      const { error: userError } = await supabaseAdmin.from('users').insert({
        id: userId,
        email,
        firstName,
        lastName,
        role: body.role,
        isActive: true,
        phone: body.phone || null,
        organizationId: null,
        metadata: {
          fullName,
          dateOfBirth: body.dateOfBirth,
          country: body.country,
          state: body.state,
          city: body.city,
          preferredLanguage: body.preferredLanguage,
          referralCode: body.referralCode,
          registrationDate: new Date().toISOString(),
          source: 'unified_signup',
        },
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      });

      if (userError) {
        throw new Error(`Failed to create user record: ${userError.message}`);
      }

      // 3. Create role-specific record
      await createRoleSpecificRecord(supabaseAdmin, userId, email, fullName, firstName, lastName, body);

      // 4. Send welcome email
      await sendWelcomeEmail(env, email, fullName, body.password, body.role, '');

      return jsonResponse({
        success: true,
        message: 'Account created successfully!',
        data: {
          userId,
          email,
          name: fullName,
          role: body.role,
        },
      });
    } catch (error) {
      // ROLLBACK: Delete auth user if any subsequent step fails
      console.error('Rollback: deleting auth user due to error:', error);
      await deleteAuthUser(supabaseAdmin, userId);
      throw error;
    }
  } catch (error) {
    console.error('Unified signup error:', error);
    return jsonResponse(
      { error: error instanceof Error ? error.message : 'Failed to create account' },
      500
    );
  }
}

/**
 * Create role-specific record based on user role
 * Note: Educator records are NOT created during self-signup because they require a school_id
 * Educators will have their records created when they join an organization or are onboarded by an admin
 */
async function createRoleSpecificRecord(
  supabaseAdmin: any,
  userId: string,
  email: string,
  fullName: string,
  firstName: string,
  lastName: string,
  body: UnifiedSignupRequest
): Promise<void> {
  const { role, phone, dateOfBirth } = body;

  switch (role) {
    case 'school_student':
    case 'college_student': {
      const studentType = role === 'school_student' ? 'school' : 'college';
      const { error } = await supabaseAdmin.from('students').insert({
        user_id: userId,
        name: fullName,
        email,
        contact_number: phone,
        date_of_birth: dateOfBirth || null,
        student_type: studentType,
        approval_status: 'pending',
      });
      if (error) {
        throw new Error(`Failed to create student record: ${error.message}`);
      }
      break;
    }

    // Educator records require school_id/college_id which is not available during self-signup
    // These records will be created when:
    // 1. Admin onboards the educator via TeacherOnboarding/FacultyOnboarding
    // 2. Educator joins an organization via OrganizationSetup
    case 'school_educator':
    case 'college_educator':
      // No record created - will be created when educator joins an organization
      console.log(`Educator signup: ${role} - record will be created when joining organization`);
      break;

    case 'recruiter': {
      const { error } = await supabaseAdmin.from('recruiters').insert({
        user_id: userId,
        name: fullName,
        email,
        phone,
        verificationstatus: 'pending',
        isactive: true,
      });
      if (error) {
        throw new Error(`Failed to create recruiter record: ${error.message}`);
      }
      break;
    }

    // Admin roles don't need additional records - they create organizations later
    case 'school_admin':
    case 'college_admin':
    case 'university_admin':
      // No additional record needed - organization will be created via OrganizationSetup
      break;

    default:
      console.warn(`Unknown role: ${role}, no role-specific record created`);
  }
}
