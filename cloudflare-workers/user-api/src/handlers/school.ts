/**
 * School signup handlers
 * - School Admin signup
 * - School Educator signup
 * - School Student signup
 * 
 * Uses unified 'organizations' table with organization_type='school'
 */

import { EducatorSignupRequest, Env, SchoolAdminSignupRequest, StudentSignupRequest } from '../types';
import { sendWelcomeEmail } from '../utils/email';
import { calculateAge, capitalizeFirstLetter, jsonResponse, splitName, validateEmail } from '../utils/helpers';
import { checkEmailExists, deleteAuthUser, getSupabaseAdmin } from '../utils/supabase';

/**
 * Handle school admin signup with school creation
 * Creates organization record in unified 'organizations' table
 */
export async function handleSchoolAdminSignup(request: Request, env: Env): Promise<Response> {
  const supabaseAdmin = getSupabaseAdmin(env);

  try {
    const body = (await request.json()) as SchoolAdminSignupRequest;

    // Validate required fields
    const requiredFields = [
      'email', 'password', 'schoolName', 'schoolCode',
      'address', 'city', 'state', 'pincode', 'principalName',
    ];
    for (const field of requiredFields) {
      if (!body[field as keyof SchoolAdminSignupRequest]) {
        return jsonResponse({ error: `Missing required field: ${field}` }, 400);
      }
    }

    if (!validateEmail(body.email)) {
      return jsonResponse({ error: 'Invalid email format' }, 400);
    }

    if (body.password.length < 6) {
      return jsonResponse({ error: 'Password must be at least 6 characters' }, 400);
    }

    // Check if email already exists
    if (await checkEmailExists(supabaseAdmin, body.email)) {
      return jsonResponse({ error: 'An account with this email already exists' }, 400);
    }

    // Check if school code is unique in organizations table
    const { data: existingSchool } = await supabaseAdmin
      .from('organizations')
      .select('id')
      .eq('organization_type', 'school')
      .eq('code', body.schoolCode)
      .maybeSingle();

    if (existingSchool) {
      return jsonResponse({ error: 'School code already exists. Please choose a different code.' }, 400);
    }

    // 1. Create auth user
    const { data: authUser, error: authError } = await supabaseAdmin.auth.admin.createUser({
      email: body.email.toLowerCase(),
      password: body.password,
      email_confirm: true,
      user_metadata: {
        name: body.principalName,
        role: 'school_admin',
        phone: body.phone || body.principalPhone,
      },
    });

    if (authError || !authUser.user) {
      console.error('Auth user creation failed:', authError);
      return jsonResponse({ error: authError?.message || 'Failed to create account' }, 500);
    }

    const userId = authUser.user.id;

    try {
      // 2. Create public.users record
      const { firstName, lastName } = splitName(body.principalName);

      const { error: userError } = await supabaseAdmin.from('users').insert({
        id: userId,
        email: body.email.toLowerCase(),
        firstName,
        lastName,
        role: 'school_admin',
        organizationId: null,
        isActive: true,
        phone: body.phone || body.principalPhone,
        metadata: {
          source: 'school_signup',
          schoolCode: body.schoolCode,
          dateOfBirth: body.dateOfBirth,
        },
      });

      if (userError) {
        throw new Error(`Failed to create user record: ${userError.message}`);
      }

      // 3. Create organization record in unified organizations table
      const { data: school, error: schoolError } = await supabaseAdmin
        .from('organizations')
        .insert({
          name: body.schoolName,
          organization_type: 'school',
          code: body.schoolCode,
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
            board: body.board,
            principal_name: body.principalName,
            principal_email: body.principalEmail || body.email,
            principal_phone: body.principalPhone || body.phone,
          },
        })
        .select()
        .single();

      if (schoolError || !school) {
        throw new Error(`Failed to create school: ${schoolError?.message}`);
      }

      // 4. Update user's organizationId with school ID
      await supabaseAdmin.from('users').update({ organizationId: school.id }).eq('id', userId);

      // 5. Send welcome email
      await sendWelcomeEmail(
        env,
        body.email,
        body.principalName,
        body.password,
        'school_admin',
        `<strong>School:</strong> ${body.schoolName}`
      );

      return jsonResponse({
        success: true,
        message: 'School account created successfully! Please check your email for login details.',
        data: {
          userId,
          schoolId: school.id,
          schoolName: school.name,
          schoolCode: school.code,
          email: body.email,
          role: 'school_admin',
        },
      });
    } catch (error) {
      console.error('Rollback: deleting auth user due to error:', error);
      await deleteAuthUser(supabaseAdmin, userId);
      throw error;
    }
  } catch (error) {
    console.error('School admin signup error:', error);
    return jsonResponse(
      { error: error instanceof Error ? error.message : 'Failed to create school account' },
      500
    );
  }
}

/**
 * Handle school educator signup
 * Verifies school exists in organizations table
 */
export async function handleEducatorSignup(request: Request, env: Env): Promise<Response> {
  const supabaseAdmin = getSupabaseAdmin(env);

  try {
    const body = (await request.json()) as EducatorSignupRequest;

    if (!body.email || !body.password || !body.firstName || !body.lastName || !body.schoolId) {
      return jsonResponse(
        { error: 'Missing required fields: email, password, firstName, lastName, schoolId' },
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

    // Verify school exists in organizations table
    const { data: school, error: schoolError } = await supabaseAdmin
      .from('organizations')
      .select('id, name')
      .eq('id', body.schoolId)
      .eq('organization_type', 'school')
      .single();

    if (schoolError || !school) {
      return jsonResponse({ error: 'Invalid school selected' }, 400);
    }

    const { data: existingEducator } = await supabaseAdmin
      .from('school_educators')
      .select('id')
      .eq('email', body.email.toLowerCase())
      .maybeSingle();

    if (existingEducator) {
      return jsonResponse({ error: 'An educator with this email already exists' }, 400);
    }

    const { data: authUser, error: authError } = await supabaseAdmin.auth.admin.createUser({
      email: body.email.toLowerCase(),
      password: body.password,
      email_confirm: true,
      user_metadata: {
        first_name: capitalizeFirstLetter(body.firstName),
        last_name: capitalizeFirstLetter(body.lastName),
        name: `${capitalizeFirstLetter(body.firstName)} ${capitalizeFirstLetter(body.lastName)}`,
        role: 'school_educator',
        phone: body.phone,
        school_id: body.schoolId,
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
        firstName,
        lastName,
        role: 'school_educator',
        organizationId: body.schoolId,
        isActive: true,
        phone: body.phone,
        metadata: {
          source: 'educator_signup',
          schoolId: body.schoolId,
          dateOfBirth: body.dateOfBirth,
        },
      });

      if (userError) {
        throw new Error(`Failed to create user record: ${userError.message}`);
      }

      const { data: educator, error: educatorError } = await supabaseAdmin
        .from('school_educators')
        .insert({
          user_id: userId,
          school_id: body.schoolId,
          email: body.email.toLowerCase(),
          first_name: firstName,
          last_name: lastName,
          phone_number: body.phone,
          designation: body.designation,
          department: body.department,
          employee_id: body.employeeId,
          qualification: body.qualification,
          experience_years: body.experienceYears,
          specialization: body.specialization,
          account_status: 'active',
          verification_status: 'pending',
          role: 'subject_teacher',
          onboarding_status: 'active',
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
        'school_educator',
        `<strong>School:</strong> ${school.name}`
      );

      return jsonResponse({
        success: true,
        message: 'Educator account created successfully!',
        data: {
          userId,
          educatorId: educator.id,
          email: body.email,
          name: `${body.firstName} ${body.lastName}`,
          schoolId: body.schoolId,
          schoolName: school.name,
          role: 'school_educator',
        },
      });
    } catch (error) {
      console.error('Rollback: deleting auth user due to error:', error);
      await deleteAuthUser(supabaseAdmin, userId);
      throw error;
    }
  } catch (error) {
    console.error('Educator signup error:', error);
    return jsonResponse(
      { error: error instanceof Error ? error.message : 'Failed to create educator account' },
      500
    );
  }
}


/**
 * Handle school student signup
 * Verifies school exists in organizations table
 */
export async function handleStudentSignup(request: Request, env: Env): Promise<Response> {
  const supabaseAdmin = getSupabaseAdmin(env);

  try {
    const body = (await request.json()) as StudentSignupRequest;

    if (!body.email || !body.password || !body.name || !body.schoolId) {
      return jsonResponse({ error: 'Missing required fields: email, password, name, schoolId' }, 400);
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

    // Verify school exists in organizations table
    const { data: school, error: schoolError } = await supabaseAdmin
      .from('organizations')
      .select('id, name')
      .eq('id', body.schoolId)
      .eq('organization_type', 'school')
      .single();

    if (schoolError || !school) {
      return jsonResponse({ error: 'Invalid school selected' }, 400);
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
        role: 'school_student',
        phone: body.phone,
        school_id: body.schoolId,
      },
    });

    if (authError || !authUser.user) {
      console.error('Auth user creation failed:', authError);
      return jsonResponse({ error: authError?.message || 'Failed to create account' }, 500);
    }

    const userId = authUser.user.id;

    try {
      const { firstName, lastName } = body.firstName && body.lastName 
        ? { firstName: capitalizeFirstLetter(body.firstName), lastName: capitalizeFirstLetter(body.lastName) }
        : splitName(body.name);

      const { error: userError } = await supabaseAdmin.from('users').insert({
        id: userId,
        email: body.email.toLowerCase(),
        firstName,
        lastName,
        role: 'school_student',
        organizationId: body.schoolId,
        isActive: true,
        phone: body.phone,
        metadata: {
          source: 'student_signup',
          schoolId: body.schoolId,
          dateOfBirth: body.dateOfBirth,
        },
      });

      if (userError) {
        throw new Error(`Failed to create user record: ${userError.message}`);
      }

      const age = calculateAge(body.dateOfBirth || '');
      const fullName = `${firstName} ${lastName}`.trim();

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
          grade: body.grade,
          section: body.section,
          roll_number: body.rollNumber,
          admission_number: body.admissionNumber,
          guardianName: body.guardianName,
          guardianPhone: body.guardianPhone,
          address: body.address,
          city: body.city,
          state: body.state,
          pincode: body.pincode,
          school_id: body.schoolId,
          student_type: 'school_student',
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
        'school_student',
        `<strong>School:</strong> ${school.name}${body.grade ? `<br><strong>Grade:</strong> ${body.grade}` : ''}`
      );

      return jsonResponse({
        success: true,
        message: 'Student account created successfully!',
        data: {
          userId,
          studentId: student.id,
          email: body.email,
          name: body.name,
          schoolId: body.schoolId,
          schoolName: school.name,
          role: 'school_student',
        },
      });
    } catch (error) {
      console.error('Rollback: deleting auth user due to error:', error);
      await deleteAuthUser(supabaseAdmin, userId);
      throw error;
    }
  } catch (error) {
    console.error('Student signup error:', error);
    return jsonResponse(
      { error: error instanceof Error ? error.message : 'Failed to create student account' },
      500
    );
  }
}
