/**
 * Unified Signup Handler for User API (SSO-compatible)
 * 
 * Creates the application profile (public.users + role-specific record)
 * for a user who has already been created in the SSO system.
 * 
 * The SSO user ID is passed in the request body as `userId`.
 * Authentication is handled by the SSO JWT (via withAuth middleware or ssoClient.fetch).
 */

import { createSupabaseAdminClient } from '../../../../src/functions-lib/supabase';
import { jsonResponse } from '../../../../src/functions-lib/response';
import type { PagesEnv } from '../../../../src/functions-lib/types';
import type { UnifiedSignupRequest } from '../types';
import { sendWelcomeEmail } from '../utils/email';
import { apiLogger } from '../../../lib/logger';
import {
  capitalizeFirstLetter,
  validateEmail,
} from '../utils/helpers';

/**
 * Handle unified signup for all user types (SSO-compatible).
 * 
 * Expects the SSO user to already exist. Creates:
 * 1. public.users record (app profile)
 * 2. Role-specific record (learners, school_educators, recruiters, etc.)
 * 
 * The `userId` field in the request body is the SSO user ID (from ssoClient.signup/signupMember).
 */
export async function handleUnifiedSignup(request: Request, env: PagesEnv): Promise<Response> {
  const supabaseAdmin = createSupabaseAdminClient(env);

  try {
    const body = (await request.json()) as UnifiedSignupRequest & { userId?: string };

    // Validate required fields
    if (!body.email || !body.firstName || !body.lastName || !body.role) {
      return jsonResponse(
        {
          error: 'Missing required fields: email, firstName, lastName, role',
        },
        400
      );
    }

    if (!body.userId) {
      return jsonResponse(
        {
          error: 'Missing userId. The SSO user must be created first.',
        },
        400
      );
    }

    if (!validateEmail(body.email)) {
      return jsonResponse({ error: 'Invalid email format' }, 400);
    }

    const email = body.email.toLowerCase();
    const firstName = capitalizeFirstLetter(body.firstName);
    const lastName = capitalizeFirstLetter(body.lastName);
    const fullName = `${firstName} ${lastName}`.trim();
    const userId = body.userId;

    // Check if profile already exists by SSO user ID (idempotency)
    const { data: existingUser } = await supabaseAdmin
      .from('users')
      .select('id')
      .eq('id', userId)
      .maybeSingle();

    if (existingUser) {
      return jsonResponse(
        {
          success: true,
          data: { userId },
          message: 'Profile already exists',
        },
        200
      );
    }

    // Check if profile exists with same email but different ID (legacy Supabase Auth user)
    // Link the existing profile to the new SSO user ID
    const { data: existingByEmail } = await supabaseAdmin
      .from('users')
      .select('id, role')
      .eq('email', email)
      .maybeSingle();

    if (existingByEmail && existingByEmail.id !== userId) {
      const oldId = existingByEmail.id;

      // Update role-specific records FIRST (child tables) before updating the parent
      await supabaseAdmin.from('learners').update({ user_id: userId }).eq('user_id', oldId);
      await supabaseAdmin.from('recruiters').update({ user_id: userId }).eq('user_id', oldId);
      await supabaseAdmin.from('school_educators').update({ user_id: userId }).eq('user_id', oldId);
      await supabaseAdmin.from('college_educators').update({ user_id: userId }).eq('user_id', oldId);

      // Now delete the old users row and create a new one with the SSO user ID
      // (UPDATE on PK with FK references is problematic, so delete + insert is safer)
      const { data: oldUser } = await supabaseAdmin
        .from('users')
        .select('*')
        .eq('id', oldId)
        .single();

      if (oldUser) {
        await supabaseAdmin.from('users').delete().eq('id', oldId);
        const { error: insertError } = await supabaseAdmin.from('users').insert({
          ...oldUser,
          id: userId,
          updatedAt: new Date().toISOString(),
        });
        if (insertError) {
          throw new Error(`Failed to link existing profile to SSO user: ${insertError.message}`);
        }
      }

      return jsonResponse(
        {
          success: true,
          data: { userId, linked: true, previousId: oldId },
          message: 'Existing profile linked to SSO account',
        },
        200
      );
    }

    try {
      // 1. Create public.users record (app profile)
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
          source: 'sso_signup',
        },
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      });

      if (userError) {
        throw new Error(`Failed to create user record: ${userError.message}`);
      }

      // 2. Create role-specific record
      try {
        await createRoleSpecificRecord(supabaseAdmin, userId, email, fullName, firstName, lastName, body);
      } catch (roleError) {
        // Rollback: delete the users row if role-specific record fails
        await supabaseAdmin.from('users').delete().eq('id', userId);
        throw roleError;
      }

      // 4. Send welcome email
      const baseUrl = new URL(request.url).origin;
      let emailSent = true;
      try {
        await sendWelcomeEmail(env, baseUrl, email, fullName, body.role, '');
      } catch (emailError) {
        emailSent = false;
        apiLogger.error('Welcome email failed', emailError as Error);
      }

      return jsonResponse({
        success: true,
        message: 'Account created successfully!',
        data: {
          userId,
          email,
          name: fullName,
          role: body.role,
          emailSent: emailSent
        },
        ...(emailSent ? {} : { 
          warning: 'Account created but welcome email could not be sent. Please check your email or contact support.' 
        })
      });
    } catch (error) {
      // Profile creation failed — SSO user still exists but has no app profile.
      // The frontend should handle this gracefully (retry or show error).
      console.error('Profile creation error:', error);
      throw error;
    }
  } catch (error) {
    console.error('Unified signup error:', error);
    return jsonResponse(
      { error: error instanceof Error ? error.message : 'Failed to create profile' },
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
    case 'learner':
    case 'learner':
    case 'learner': {
      const learnerType = role === 'learner' ? 'school' : role === 'learner' ? 'college' : 'learner';
      const { error } = await supabaseAdmin.from('learners').insert({
        user_id: userId,
        name: fullName,
        email,
        contact_number: phone,
        date_of_birth: dateOfBirth || null,
        learner_type: learnerType,
        approval_status: role === 'learner' ? 'approved' : 'pending', // Auto-approve learners
      });
      if (error) {
        throw new Error(`Failed to create learner record: ${error.message}`);
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
