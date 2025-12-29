/**
 * College signup handlers
 * - College Admin signup
 * - College Educator signup
 * - College Student signup
 */

import {
    CollegeAdminSignupRequest,
    CollegeEducatorSignupRequest,
    CollegeStudentSignupRequest,
    Env,
} from '../types';
import { sendWelcomeEmail } from '../utils/email';
import { calculateAge, jsonResponse, splitName, validateEmail } from '../utils/helpers';
import { checkEmailExists, deleteAuthUser, getSupabaseAdmin } from '../utils/supabase';

/**
 * Handle college admin signup with college creation
 */
export async function handleCollegeAdminSignup(request: Request, env: Env): Promise<Response> {
  const supabaseAdmin = getSupabaseAdmin(env);

  try {
    const body = (await request.json()) as CollegeAdminSignupRequest;

    const requiredFields = [
      'email', 'password', 'collegeName', 'collegeCode',
      'address', 'city', 'state', 'pincode', 'deanName',
    ];
    for (const field of requiredFields) {
      if (!body[field as keyof CollegeAdminSignupRequest]) {
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

    const { data: existingCollege } = await supabaseAdmin
      .from('colleges')
      .select('id')
      .eq('code', body.collegeCode)
      .maybeSingle();

    if (existingCollege) {
      return jsonResponse({ error: 'College code already exists' }, 400);
    }

    const { data: authUser, error: authError } = await supabaseAdmin.auth.admin.createUser({
      email: body.email.toLowerCase(),
      password: body.password,
      email_confirm: true,
      user_metadata: {
        name: body.deanName,
        role: 'college_admin',
        phone: body.phone || body.deanPhone,
      },
    });

    if (authError || !authUser.user) {
      return jsonResponse({ error: authError?.message || 'Failed to create account' }, 500);
    }

    const userId = authUser.user.id;

    try {
      const { firstName, lastName } = splitName(body.deanName);

      await supabaseAdmin.from('users').insert({
        id: userId,
        email: body.email.toLowerCase(),
        firstName,
        lastName,
        role: 'college_admin',
        organizationId: null,
        isActive: true,
        phone: body.phone || body.deanPhone,
        metadata: { source: 'college_signup', collegeCode: body.collegeCode },
      });

      const { data: college, error: collegeError } = await supabaseAdmin
        .from('colleges')
        .insert({
          name: body.collegeName,
          code: body.collegeCode,
          email: body.email.toLowerCase(),
          phone: body.phone,
          website: body.website,
          address: body.address,
          city: body.city,
          state: body.state,
          country: body.country || 'India',
          pincode: body.pincode,
          establishedYear: body.establishedYear,
          collegeType: body.collegeType,
          affiliation: body.affiliation,
          accreditation: body.accreditation,
          deanName: body.deanName,
          deanEmail: body.deanEmail || body.email,
          deanPhone: body.deanPhone || body.phone,
          accountStatus: 'pending',
          approvalStatus: 'pending',
          created_by: userId,
        })
        .select()
        .single();

      if (collegeError || !college) {
        throw new Error(`Failed to create college: ${collegeError?.message}`);
      }

      await supabaseAdmin.from('users').update({ organizationId: college.id }).eq('id', userId);

      await sendWelcomeEmail(
        env,
        body.email,
        body.deanName,
        body.password,
        'college_admin',
        `<strong>College:</strong> ${body.collegeName}`
      );

      return jsonResponse({
        success: true,
        message: 'College account created successfully! Please check your email for login details.',
        data: {
          userId,
          collegeId: college.id,
          collegeName: college.name,
          collegeCode: college.code,
          email: body.email,
          role: 'college_admin',
        },
      });
    } catch (error) {
      console.error('Rollback: deleting auth user due to error:', error);
      await deleteAuthUser(supabaseAdmin, userId);
      throw error;
    }
  } catch (error) {
    console.error('College admin signup error:', error);
    return jsonResponse(
      { error: error instanceof Error ? error.message : 'Failed to create college account' },
      500
    );
  }
}

/**
 * Handle college educator signup
 */
export async function handleCollegeEducatorSignup(request: Request, env: Env): Promise<Response> {
  const supabaseAdmin = getSupabaseAdmin(env);

  try {
    const body = (await request.json()) as CollegeEducatorSignupRequest;

    if (!body.email || !body.password || !body.firstName || !body.lastName || !body.collegeId) {
      return jsonResponse(
        { error: 'Missing required fields: email, password, firstName, lastName, collegeId' },
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

    const { data: college, error: collegeError } = await supabaseAdmin
      .from('colleges')
      .select('id, name')
      .eq('id', body.collegeId)
      .single();

    if (collegeError || !college) {
      return jsonResponse({ error: 'Invalid college selected' }, 400);
    }

    // Check college_lecturers table using metadata->>email (email stored in JSONB metadata)
    const { data: existingEducator } = await supabaseAdmin
      .from('college_lecturers')
      .select('id')
      .eq('metadata->>email', body.email.toLowerCase())
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
        role: 'college_educator',
        phone: body.phone,
        college_id: body.collegeId,
      },
    });

    if (authError || !authUser.user) {
      return jsonResponse({ error: authError?.message || 'Failed to create account' }, 500);
    }

    const userId = authUser.user.id;

    try {
      const firstName = capitalizeFirstLetter(body.firstName);
      const lastName = capitalizeFirstLetter(body.lastName);
      
      await supabaseAdmin.from('users').insert({
        id: userId,
        email: body.email.toLowerCase(),
        firstName: firstName,
        lastName: lastName,
        role: 'college_educator',
        organizationId: body.collegeId,
        isActive: true,
        phone: body.phone,
        metadata: { source: 'college_educator_signup', collegeId: body.collegeId },
      });

      // Insert into college_lecturers table with camelCase columns (matching actual schema)
      const { data: educator, error: educatorError } = await supabaseAdmin
        .from('college_lecturers')
        .insert({
          user_id: userId,
          userId: userId, // Both forms for compatibility
          collegeId: body.collegeId,
          employeeId: body.employeeId || null,
          department: body.department || null,
          specialization: body.specialization || null,
          qualification: body.qualification || null,
          experienceYears: body.experienceYears || null,
          dateOfJoining: body.dateOfJoining || null,
          accountStatus: 'active',
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
          metadata: {
            firstName: firstName,
            lastName: lastName,
            email: body.email.toLowerCase(),
            phone: body.phone,
            designation: body.designation,
            source: 'self_signup',
          },
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
        'college_educator',
        `<strong>College:</strong> ${college.name}`
      );

      return jsonResponse({
        success: true,
        message: 'College educator account created successfully!',
        data: {
          userId,
          educatorId: educator.id,
          email: body.email,
          name: `${body.firstName} ${body.lastName}`,
          collegeId: body.collegeId,
          collegeName: college.name,
          role: 'college_educator',
        },
      });
    } catch (error) {
      console.error('Rollback: deleting auth user due to error:', error);
      await deleteAuthUser(supabaseAdmin, userId);
      throw error;
    }
  } catch (error) {
    console.error('College educator signup error:', error);
    return jsonResponse(
      { error: error instanceof Error ? error.message : 'Failed to create college educator account' },
      500
    );
  }
}

/**
 * Handle college student signup
 */
export async function handleCollegeStudentSignup(request: Request, env: Env): Promise<Response> {
  const supabaseAdmin = getSupabaseAdmin(env);

  try {
    const body = (await request.json()) as CollegeStudentSignupRequest;

    if (!body.email || !body.password || !body.name || !body.collegeId) {
      return jsonResponse({ error: 'Missing required fields: email, password, name, collegeId' }, 400);
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

    const { data: college, error: collegeError } = await supabaseAdmin
      .from('colleges')
      .select('id, name')
      .eq('id', body.collegeId)
      .single();

    if (collegeError || !college) {
      return jsonResponse({ error: 'Invalid college selected' }, 400);
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
        role: 'college_student',
        phone: body.phone,
        college_id: body.collegeId,
      },
    });

    if (authError || !authUser.user) {
      return jsonResponse({ error: authError?.message || 'Failed to create account' }, 500);
    }

    const userId = authUser.user.id;

    try {
      const { firstName, lastName } = body.firstName && body.lastName 
        ? { firstName: capitalizeFirstLetter(body.firstName), lastName: capitalizeFirstLetter(body.lastName) }
        : splitName(body.name);

      await supabaseAdmin.from('users').insert({
        id: userId,
        email: body.email.toLowerCase(),
        firstName,
        lastName,
        role: 'college_student',
        organizationId: body.collegeId,
        isActive: true,
        phone: body.phone,
        metadata: { source: 'college_student_signup', collegeId: body.collegeId },
      });

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
          enrollmentNumber: body.enrollmentNumber,
          guardianName: body.guardianName,
          guardianPhone: body.guardianPhone,
          address: body.address,
          city: body.city,
          state: body.state,
          pincode: body.pincode,
          college_id: body.collegeId,
          student_type: 'college_student',
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
        'college_student',
        `<strong>College:</strong> ${college.name}${body.course ? `<br><strong>Course:</strong> ${body.course}` : ''}`
      );

      return jsonResponse({
        success: true,
        message: 'College student account created successfully!',
        data: {
          userId,
          studentId: student.id,
          email: body.email,
          name: body.name,
          collegeId: body.collegeId,
          collegeName: college.name,
          role: 'college_student',
        },
      });
    } catch (error) {
      console.error('Rollback: deleting auth user due to error:', error);
      await deleteAuthUser(supabaseAdmin, userId);
      throw error;
    }
  } catch (error) {
    console.error('College student signup error:', error);
    return jsonResponse(
      { error: error instanceof Error ? error.message : 'Failed to create college student account' },
      500
    );
  }
}
