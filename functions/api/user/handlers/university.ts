/**
 * University signup handlers for User API
 * - University Admin signup
 * - University Educator signup
 * - University Student signup
 * 
 * Uses unified 'organizations' table with organization_type='university'
 */

import { createSupabaseAdminClient } from '../../../../src/functions-lib/supabase';
import { jsonResponse } from '../../../../src/functions-lib/response';
import type { PagesEnv } from '../../../../src/functions-lib/types';
import type { UniversityAdminSignupRequest, UniversityEducatorSignupRequest, UniversityStudentSignupRequest } from '../types';
import { sendWelcomeEmail } from '../utils/email';
import {
  calculateAge,
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
        return jsonResponse({ error: `Missing required field: ${field}` }, 400);
      }
    }

    if (!validateEmail(body.email)) {
      return jsonResponse({ error: 'Invalid email format' }, 400);
    }

    if (body.password.length < 6) {
      return jsonResponse({ error: 'Password must be at least 6 characters' }, 400);
    }

    if (await checkEmailExists(supabaseAdmin, body.email)) {
      return jsonResponse({ error: 'An account with this email already exists' }, 400);
    }

    // Check if university code is unique in organizations table
    const { data: existingUniversity } = await supabaseAdmin
      .from('organizations')
      .select('id')
      .eq('organization_type', 'university')
      .eq('code', body.universityCode)
      .maybeSingle();

    if (existingUniversity) {
      return jsonResponse({ error: 'University code already exists' }, 400);
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
      return jsonResponse({ error: authError?.message || 'Failed to create account' }, 500);
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

      return jsonResponse({
        success: true,
        message: 'University account created successfully! Please check your email for login details.',
        data: {
          userId,
          universityId: university.id,
          universityName: university.name,
          universityCode: university.code,
          email: body.email,
          role: 'university_admin',
        },
      });
    } catch (error) {
      console.error('Rollback: deleting auth user due to error:', error);
      await deleteAuthUser(supabaseAdmin, userId);
      throw error;
    }
  } catch (error) {
    console.error('University admin signup error:', error);
    return jsonResponse(
      { error: error instanceof Error ? error.message : 'Failed to create university account' },
      500
    );
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
      return jsonResponse(
        { error: 'Missing required fields: email, password, firstName, lastName, universityId' },
        400
      );
    }

    if (!validateEmail(body.email)) {
      return jsonResponse({ error: 'Invalid email format' }, 400);
    }

    if (body.password.length < 6) {
      return jsonResponse({ error: 'Password must be at least 6 characters' }, 400);
    }

    if (await checkEmailExists(supabaseAdmin, body.email)) {
      return jsonResponse({ error: 'An account with this email already exists' }, 400);
    }

    // Verify university exists in organizations table
    const { data: university, error: universityError } = await supabaseAdmin
      .from('organizations')
      .select('id, name')
      .eq('id', body.universityId)
      .eq('organization_type', 'university')
      .single();

    if (universityError || !university) {
      return jsonResponse({ error: 'Invalid university selected' }, 400);
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
      return jsonResponse({ error: authError?.message || 'Failed to create account' }, 500);
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

      return jsonResponse({
        success: true,
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
      });
    } catch (error) {
      console.error('Rollback: deleting auth user due to error:', error);
      await deleteAuthUser(supabaseAdmin, userId);
      throw error;
    }
  } catch (error) {
    console.error('University educator signup error:', error);
    return jsonResponse(
      { error: error instanceof Error ? error.message : 'Failed to create university educator account' },
      500
    );
  }
}

/**
 * Handle university student signup
 * Verifies university exists in organizations table
 */
export async function handleUniversityStudentSignup(request: Request, env: PagesEnv): Promise<Response> {
  const supabaseAdmin = createSupabaseAdminClient(env);

  try {
    const body = (await request.json()) as UniversityStudentSignupRequest;

    if (!body.email || !body.password || !body.name || !body.universityId) {
      return jsonResponse({ error: 'Missing required fields: email, password, name, universityId' }, 400);
    }

    if (!validateEmail(body.email)) {
      return jsonResponse({ error: 'Invalid email format' }, 400);
    }

    if (body.password.length < 6) {
      return jsonResponse({ error: 'Password must be at least 6 characters' }, 400);
    }

    if (await checkEmailExists(supabaseAdmin, body.email)) {
      return jsonResponse({ error: 'An account with this email already exists' }, 400);
    }

    // Verify university exists in organizations table
    const { data: university, error: universityError } = await supabaseAdmin
      .from('organizations')
      .select('id, name')
      .eq('id', body.universityId)
      .eq('organization_type', 'university')
      .single();

    if (universityError || !university) {
      return jsonResponse({ error: 'Invalid university selected' }, 400);
    }

    const { data: existingStudent } = await supabaseAdmin
      .from('students')
      .select('id')
      .eq('email', body.email.toLowerCase())
      .maybeSingle();

    if (existingStudent) {
      return jsonResponse({ error: 'A student with this email already exists' }, 400);
    }

    const { data: authUser, error: authError } = await supabaseAdmin.auth.admin.createUser({
      email: body.email.toLowerCase(),
      password: body.password,
      email_confirm: true,
      user_metadata: {
        name: body.name,
        role: 'university_student',
        phone: body.phone,
        university_id: body.universityId,
      },
    });

    if (authError || !authUser.user) {
      console.error('Auth user creation failed:', authError);
      return jsonResponse({ error: authError?.message || 'Failed to create account' }, 500);
    }

    const userId = authUser.user.id;

    try {
      const { firstName, lastName } =
        body.firstName && body.lastName
          ? { firstName: capitalizeFirstLetter(body.firstName), lastName: capitalizeFirstLetter(body.lastName) }
          : splitName(body.name);

      const { error: userError } = await supabaseAdmin.from('users').insert({
        id: userId,
        email: body.email.toLowerCase(),
        firstName,
        lastName,
        role: 'university_student',
        organizationId: body.universityId,
        isActive: true,
        phone: body.phone,
        metadata: {
          source: 'university_student_signup',
          universityId: body.universityId,
          dateOfBirth: body.dateOfBirth,
        },
      });

      if (userError) {
        throw new Error(`Failed to create user record: ${userError.message}`);
      }

      const age = calculateAge(body.dateOfBirth || '');
      const fullName = `${firstName} ${lastName}`.trim();

      // Create students record (first_name/last_name stored in users table only)
      const { data: student, error: studentError } = await supabaseAdmin
        .from('students')
        .insert({
          id: userId,
          user_id: userId,
          email: body.email.toLowerCase(),
          name: fullName,
          contactNumber: body.phone,
          contact_number: body.phone,
          dateOfBirth: body.dateOfBirth,
          date_of_birth: body.dateOfBirth,
          age,
          gender: body.gender,
          course: body.course,
          branch: body.branch,
          semester: body.semester,
          rollNumber: body.rollNumber,
          registrationNumber: body.registrationNumber,
          guardianName: body.guardianName,
          guardianPhone: body.guardianPhone,
          address: body.address,
          city: body.city,
          state: body.state,
          pincode: body.pincode,
          university_id: body.universityId,
          student_type: 'university_student',
          approval_status: 'approved',
          metadata: { source: 'self_signup' },
        })
        .select()
        .single();

      if (studentError || !student) {
        throw new Error(`Failed to create student profile: ${studentError?.message}`);
      }

      await sendWelcomeEmail(
        env,
        body.email,
        body.name,
        body.password,
        'university_student',
        `<strong>University:</strong> ${university.name}${body.course ? `<br><strong>Course:</strong> ${body.course}` : ''}`
      );

      return jsonResponse({
        success: true,
        message: 'University student account created successfully!',
        data: {
          userId,
          studentId: student.id,
          email: body.email,
          name: body.name,
          universityId: body.universityId,
          universityName: university.name,
          role: 'university_student',
        },
      });
    } catch (error) {
      console.error('Rollback: deleting auth user due to error:', error);
      await deleteAuthUser(supabaseAdmin, userId);
      throw error;
    }
  } catch (error) {
    console.error('University student signup error:', error);
    return jsonResponse(
      { error: error instanceof Error ? error.message : 'Failed to create university student account' },
      500
    );
  }
}
