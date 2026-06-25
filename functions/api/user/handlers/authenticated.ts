/**
 * Authenticated handlers (Admin creates users)
 * - Create learner (admin adds learner)
 * - Create teacher (admin adds teacher)
 * - Create college staff (college admin adds staff)
 * - Update learner documents
 */

import { apiError, apiSuccess } from '../../../lib/response';
import { ssoCreateMember } from '../../../lib/sso-client';
import { createSupabaseAdminClient } from '../../../lib/supabase';
import {
  calculateAge,
  generatePassword,
  splitName,
  validateEmail
} from '../utils/helpers';

/**
 * Handle admin creating a learner
 */
export async function handleCreateLearner(request: Request, env: any): Promise<Response> {
  const supabaseAdmin = createSupabaseAdminClient(env);

  const body = await request.json() as {
    learner: {
      name: string;
      email: string;
      contactNumber: string;
      dateOfBirth?: string;
      gender?: string;
      enrollmentNumber?: string;
      grade?: string;
      section?: string;
      guardianName?: string;
      guardianPhone?: string;
    };
    userEmail: string;
    schoolId?: string;
    collegeId?: string;
  };

  const { learner, userEmail, schoolId: requestSchoolId, collegeId: requestCollegeId } = body;

  if (!learner || !learner.name || !learner.email || !learner.contactNumber) {
    return apiError(400, 'VALIDATION_ERROR', 'Missing required fields: name, email, and contactNumber', request);
  }

  if (!userEmail) {
    return apiError(400, 'VALIDATION_ERROR', 'No user email provided', request);
  }

  if (!validateEmail(learner.email)) {
    return apiError(400, 'VALIDATION_ERROR', 'Invalid email format', request);
  }

  // Get current user data
  // TODO(12.1 review / §7.3): the acting admin's role is read from the shadow
  // `users.role` (looked up by the client-supplied `userEmail`, not the verified
  // JWT) and branched on the SSO roles `college_admin`/`school_admin` below to
  // decide institution scope. Proper fix is to use `getContextUser(context).roles`,
  // but this handler is invoked without the auth context (request/env only) and
  // keys off client-supplied email — threading the verified user requires a
  // signature change. Deferred for safety; flagged for review.
  const { data: currentUserData } = await supabaseAdmin
    .from('users')
    .select('id, organizationId, role')
    .eq('email', userEmail)
    .maybeSingle();

  const userId = currentUserData?.id || null;
  const userRole = currentUserData?.role || null;

  // Determine institution type
  let schoolId = requestSchoolId || null;
  let collegeId = requestCollegeId || null;
  let institutionType: string | null = null;

  if (collegeId) {
    institutionType = 'college';
  } else if (schoolId) {
    institutionType = 'school';
  } else {
    if (userRole === 'college_admin') {
      // Look up college from organizations table
      const { data: college } = await supabaseAdmin
        .from('organizations')
        .select('id')
        .eq('organization_type', 'college')
        .or(`admin_id.eq.${userId},email.ilike.${userEmail}`)
        .maybeSingle();
      if (college?.id) {
        collegeId = college.id;
        institutionType = 'college';
      }
    } else if (userRole === 'school_admin') {
      // Look up school from organizations table for school_admin
      const { data: school } = await supabaseAdmin
        .from('organizations')
        .select('id')
        .eq('organization_type', 'school')
        .or(`admin_id.eq.${userId},email.ilike.${userEmail}`)
        .maybeSingle();
      if (school?.id) {
        schoolId = school.id;
        institutionType = 'school';
      }
    } else {
      // For educators, try organizationId first, then school_educators table
      schoolId = currentUserData?.organizationId || null;
      const { data: educatorData } = await supabaseAdmin
        .from('school_educators')
        .select('school_id')
        .eq('email', userEmail)
        .maybeSingle();
      schoolId = educatorData?.school_id || schoolId;
    }
    if (schoolId) institutionType = 'school';
  }

  if (!schoolId && !collegeId) {
    return apiError(400, 'VALIDATION_ERROR', 'School/College ID not found', request);
  }

  // Get SSO org_id for the admin creating this learner
  // This is needed to create the learner in the SSO database
  console.log('🔍 Looking up organization with:');
  console.log('  userId:', userId);
  console.log('  userEmail:', userEmail);
  console.log('  institutionType:', institutionType);
  console.log('  organization_type:', institutionType === 'college' ? 'college' : 'school');
  console.log('  OR filter: admin_id.eq.${userId},email.ilike.${userEmail}');

  const { data: adminOrgData } = await supabaseAdmin
    .from('organizations')
    .select('id')
    .eq('organization_type', institutionType === 'college' ? 'college' : 'school')
    .or(`admin_id.eq.${userId},email.ilike.${userEmail}`)
    .maybeSingle();

  console.log('📊 Organization lookup result:', adminOrgData);
  console.log('Full response:', { data: adminOrgData });

  const ssoOrgId = adminOrgData?.id;
  if (!ssoOrgId) {
    console.error('❌ Admin organization not found');
    console.error('  Expected to find org where:');
    console.error('    organization_type = ', institutionType === 'college' ? 'college' : 'school');
    console.error('    AND (admin_id = ${userId} OR email ILIKE ${userEmail})');
    return apiError(400, 'VALIDATION_ERROR', 'Admin organization not found', request);
  }
  console.log('✅ Found ssoOrgId:', ssoOrgId);

  const learnerPassword = generatePassword();
  const learnerRole = 'learner';

  // ── Create the AUTH user in the SSO worker (never Supabase Auth) ──
  // This makes the learner a real, active SSO member of the school's org with
  // the learner role, so they can log in via SSO.
  let ssoUserId: string;
  try {
    console.log('📍 STEP 1: Calling ssoCreateMember()...');
    console.log('  email:', learner.email.toLowerCase());
    console.log('  role:', 'learner');
    console.log('  org_id:', ssoOrgId);

    const ssoMember = await ssoCreateMember(env, {
      email: learner.email.toLowerCase(),
      password: learnerPassword,
      role: 'learner',
      org_id: ssoOrgId,
      learner_metadata: {
        email: learner.email,
        name: learner.name,
        schoolId: learner.school_id,
        collegeId: learner.college_id,
        institutionType,
      },
    });

    console.log('✅ STEP 1 SUCCESS: ssoCreateMember() returned');
    console.log('  ssoMember:', ssoMember);

    // Extract user_id from the response (could be at top level or nested in user object)
    ssoUserId = ssoMember?.user_id || ssoMember?.user?.id;
    if (!ssoUserId) {
      throw new Error('SSO member creation returned invalid user_id. Response: ' + JSON.stringify(ssoMember));
    }
    console.log('✅ Extracted ssoUserId:', ssoUserId);
  } catch (ssoErr) {
    console.error('❌ STEP 1 FAILED: ssoCreateMember() error');
    console.error('  error:', ssoErr);
    console.error('  error.message:', (ssoErr as Error).message);
    return apiError(400, 'VALIDATION_ERROR', (ssoErr as Error).message || 'Failed to create learner account', request);
  }

  try {
    console.log('📍 STEP 2: Creating users record...');
    console.log('  id:', ssoUserId);
    console.log('  email:', learner.email.toLowerCase());

    // Create public.users record
    const { firstName, lastName } = splitName(learner.name);

    const usersInsertResult = await supabaseAdmin.from('users').insert({
      id: ssoUserId,
      email: learner.email.toLowerCase(),
      firstName,
      lastName,
      role: learnerRole,
      organizationId: schoolId || collegeId,
      isActive: true,
      metadata: {
        source: `${institutionType}_admin_added`,
        schoolId,
        collegeId,
        addedBy: userId,
        password: learnerPassword,
      },
    });

    console.log('✅ STEP 2 SUCCESS: users record created');
    console.log('  result:', usersInsertResult);

    // PHASE 2A: Learner creation via queue sync (removed manual insert)
    // The learner will be created by auth-sync-consumer when it processes
    // the membership.created event from the queue.
    console.log('📍 STEP 3: Returning success response (learner will be created via queue)...');
    return apiSuccess({
      message: `Learner ${learner.name} created successfully. Profile will be synced via queue.`,
      data: {
        authUserId: ssoUserId,
        email: learner.email,
        name: learner.name,
        password: learnerPassword,
        institutionType,
        schoolId,
        collegeId,
      },
    }, request);
  } catch (error) {
    console.error('❌ CATCH BLOCK TRIGGERED');
    console.error('  error:', error);
    console.error('  error.message:', (error as Error).message);
    console.error('  error.stack:', (error as Error).stack);

    // Best-effort rollback of the app-DB profile row. The SSO user already
    // exists; it is reused on a corrected retry (duplicate email is rejected).
    if (ssoUserId) {
      console.log('🔄 Attempting rollback: deleting users record with id:', ssoUserId);
      try {
        await supabaseAdmin.from('users').delete().eq('id', ssoUserId);
        console.log('✅ Rollback successful');
      } catch (rollbackErr) {
        console.error('❌ Rollback failed:', rollbackErr);
      }
     }
    return apiError(400, 'VALIDATION_ERROR', (error as Error).message, request);
  }
}

/**
 * Handle admin creating a teacher
 */
export async function handleCreateTeacher(request: Request, env: any, user: { id: string; email: string; org_id?: string }): Promise<Response> {
  const supabaseAdmin = createSupabaseAdminClient(env);

  const body = await request.json() as {
    teacher: {
      first_name: string;
      last_name: string;
      email: string;
      phone_number?: string;
      date_of_birth?: string;
      address?: string;
      qualification?: string;
      role?: string;
      designation?: string;
      department?: string;
      specialization?: string;
      experience_years?: number;
      date_of_joining?: string;
      subject_expertise?: any[]; // Can be array of strings or objects
      subjects_handled?: string[];
      // Additional personal information
      employee_id?: string;
      gender?: string;
      city?: string;
      state?: string;
      dob?: string;
      country?: string;
      pincode?: string;
    };
  };

  const { teacher } = body;

  console.log('📥 Received teacher data in API:', JSON.stringify(teacher, null, 2));

  if (!teacher || !teacher.first_name || !teacher.last_name || !teacher.email) {
    return apiError(400, 'VALIDATION_ERROR', 'Missing required fields: first_name, last_name, and email', request);
  }

  if (!validateEmail(teacher.email)) {
    return apiError(400, 'VALIDATION_ERROR', 'Invalid email format', request);
  }

  // Get school ID
  const { data: currentUserData } = await supabaseAdmin
    .from('users')
    .select('organizationId')
    .eq('id', user.id)
    .single();

  let schoolId = currentUserData?.organizationId || null;

  if (!schoolId) {
    const { data: educatorData } = await supabaseAdmin
      .from('school_educators')
      .select('school_id')
      .eq('email', user.email)
      .maybeSingle();
    schoolId = educatorData?.school_id || null;
  }

  if (!schoolId) {
    // Look up school from organizations table
    const { data: schoolData } = await supabaseAdmin
      .from('organizations')
      .select('id')
      .eq('organization_type', 'school')
      .or(`admin_id.eq.${user.id},email.ilike.${user.email}`)
      .maybeSingle();
    schoolId = schoolData?.id || null;
  }

  if (!schoolId) {
    return apiError(400, 'VALIDATION_ERROR', 'School ID not found', request);
  }

  // Pre-check for an existing teacher profile in the app DB (fast, friendly error).
  // The SSO worker is the source of truth for the auth user and will reject
  // duplicate emails too.
  const { data: existingTeacher } = await supabaseAdmin
    .from('school_educators')
    .select('id')
    .eq('email', teacher.email.toLowerCase())
    .maybeSingle();
  if (existingTeacher) {
    return apiError(400, 'VALIDATION_ERROR', `Teacher with email ${teacher.email} already exists`, request);
  }

  // The new teacher must join the admin's organization in the SSO DB.
  const ssoOrgId = user.org_id;
  if (!ssoOrgId) {
    return apiError(400, 'VALIDATION_ERROR', 'Admin organization not found in session', request);
  }

  const teacherPassword = generatePassword();

  // ── Create the AUTH user in the SSO worker (never Supabase Auth) ──
  // This makes the teacher a real, active SSO member of the school's org with
  // the school_educator role, so they can log in via SSO. Access is granted
  // through the organization's subscription/seats — no personal subscription.
  let ssoUserId: string;
  try {
    const ssoMember = await ssoCreateMember(env, {
      email: teacher.email.toLowerCase(),
      password: teacherPassword,
      role: 'school_educator',
      org_id: ssoOrgId,
    });
    if (!ssoMember?.user_id) throw new Error('SSO member creation returned invalid user_id');
    ssoUserId = ssoMember.user_id;
  } catch (ssoErr) {
    return apiError(400, 'VALIDATION_ERROR', (ssoErr as Error).message || 'Failed to create teacher account', request);
  }

  try {
    // Create app-DB users profile row (FK target for school_educators).
    // Mirrors the SSO user id; this is a profile shadow, not an auth record.
    await supabaseAdmin.from('users').insert({
      id: ssoUserId,
      email: teacher.email.toLowerCase(),
      firstName: teacher.first_name,
      lastName: teacher.last_name,
      role: 'school_educator',
      organizationId: schoolId,
      isActive: true,
      metadata: {
        source: 'school_admin_added',
        schoolId,
        addedBy: user.id,
        teacherRole: teacher.role,
        entityType: 'educator',
      },
    });

    // Create school_educators record
    const educatorData = {
      user_id: ssoUserId,
      school_id: schoolId,
      email: teacher.email.toLowerCase(),
      first_name: teacher.first_name,
      last_name: teacher.last_name,
      phone_number: teacher.phone_number || null,
      dob: teacher.dob || teacher.date_of_birth || null, // Handle both field names
      address: teacher.address || null,
      qualification: teacher.qualification || null,
      designation: teacher.designation || null,
      department: teacher.department || null,
      specialization: teacher.specialization || null,
      experience_years: teacher.experience_years || null,
      date_of_joining: teacher.date_of_joining || null,
      role: teacher.role || 'subject_teacher',
      subject_expertise: teacher.subject_expertise || [],
      subjects_handled: teacher.subjects_handled || (Array.isArray(teacher.subject_expertise) ? teacher.subject_expertise.map((s: any) => typeof s === 'string' ? s : s.name) : []),
      onboarding_status: 'active',
      // Additional personal information
      employee_id: teacher.employee_id || null,
      gender: teacher.gender || null,
      city: teacher.city || null,
      state: teacher.state || null,
      country: teacher.country || null,
      pincode: teacher.pincode || null,
      metadata: {
        temporary_password: teacherPassword,
        created_by: user.id,
        source: 'school_admin_added',
      },
    };

    console.log('📝 Inserting educator data:', JSON.stringify(educatorData, null, 2));

    const { data: teacherRecord, error: teacherError } = await supabaseAdmin
      .from('school_educators')
      .insert(educatorData)
      .select()
      .single();

    if (teacherError) {
      console.error('❌ Failed to create teacher profile:', teacherError);
      throw new Error(`Failed to create teacher profile: ${teacherError.message}`);
    }

    console.log('✅ Teacher record created successfully:', teacherRecord);

    return apiSuccess({
      message: `Teacher ${teacher.first_name} ${teacher.last_name} created successfully`,
      authUserId: ssoUserId,
      teacherId: teacherRecord.id,
      email: teacher.email,
      name: `${teacher.first_name} ${teacher.last_name}`,
      password: teacherPassword,
      role: teacher.role,
    }, request);
  } catch (error) {
    // Best-effort rollback of the app-DB profile row. The SSO user already
    // exists; it is reused on a corrected retry (duplicate email is rejected).
    if (ssoUserId) {
      await supabaseAdmin.from('users').delete().eq('id', ssoUserId);
    }
    return apiError(400, 'VALIDATION_ERROR', (error as Error).message, request);
  }
}

/**
 * Handle updating learner documents
 */
export async function handleUpdateLearnerDocuments(request: Request, env: any): Promise<Response> {
  const supabaseAdmin = createSupabaseAdminClient(env);

  const body = await request.json() as {
    learnerId: string;
    documents: Array<{
      name: string;
      url: string;
      size: number;
      type: string;
    }>;
  };

  const { learnerId, documents } = body;

  if (!learnerId) {
    return apiError(400, 'VALIDATION_ERROR', 'Missing required field: learnerId', request);
  }

  if (!documents || !Array.isArray(documents)) {
    return apiError(400, 'VALIDATION_ERROR', 'Missing or invalid documents array', request);
  }

  try {
    // Validate that the learner exists
    const { data: existingLearner, error: fetchError } = await supabaseAdmin
      .from('learners')
      .select('id, documents')
      .eq('id', learnerId)
      .single();

    if (fetchError || !existingLearner) {
      return apiError(404, 'NOT_FOUND', 'Learner not found', request);
    }

    // Format documents for storage
    const formattedDocuments = documents.map(doc => ({
      url: doc.url,
      name: doc.name,
      type: doc.type || 'general',
      uploadedAt: new Date().toISOString(),
      size: doc.size || 0
    }));

    // Get existing documents and merge with new ones
    const existingDocuments = existingLearner.documents || [];
    const updatedDocuments = [...existingDocuments, ...formattedDocuments];

    // Update learner record with documents
    const { error: updateError } = await supabaseAdmin
      .from('learners')
      .update({ documents: updatedDocuments })
      .eq('id', learnerId);

    if (updateError) {
      return apiError(500, 'INTERNAL_ERROR', `Failed to update learner documents: ${updateError.message}`, request);
    }

    return apiSuccess({
      message: `Successfully updated documents for learner ${learnerId}`,
      data: {
        learnerId,
        documentsCount: formattedDocuments.length,
        totalDocuments: updatedDocuments.length
      }
    }, request);
  } catch (error) {
    return apiError(500, 'INTERNAL_ERROR', (error as Error).message, request);
  }
}

/**
 * Handle college admin creating a staff member
 * Supports roles: College Admin, HoD, Faculty, Lecturer, Exam Cell, Finance Admin, Placement Officer
 */
export async function handleCreateCollegeStaff(request: Request, env: any, user: { id: string; email: string; org_id?: string }): Promise<Response> {
  const supabaseAdmin = createSupabaseAdminClient(env);

  const body = await request.json() as {
    staff: {
      name: string;
      email: string;
      phone?: string;
      roles: string[];
      employee_id?: string;
      department_id?: string;
      specialization?: string;
      qualification?: string;
      experience_years?: number;
    };
    collegeId?: string;
  };

  const { staff, collegeId: requestCollegeId } = body;

  if (!staff || !staff.name || !staff.email) {
    return apiError(400, 'VALIDATION_ERROR', 'Missing required fields: name and email', request);
  }

  if (!staff.roles || staff.roles.length === 0) {
    return apiError(400, 'VALIDATION_ERROR', 'At least one role must be selected', request);
  }

  if (!validateEmail(staff.email)) {
    return apiError(400, 'VALIDATION_ERROR', 'Invalid email format', request);
  }

  // ── Resolve the APP-DB college id (organizations row) ──
  // This is the FK target for college_lecturers.collegeId. It is distinct from
  // the SSO org id used for membership below.
  let collegeId = requestCollegeId || null;

  if (!collegeId) {
    const { data: userData } = await supabaseAdmin
      .from('users')
      .select('organizationId')
      .eq('id', user.id)
      .maybeSingle();
    if (userData?.organizationId) collegeId = userData.organizationId;
  }

  if (!collegeId) {
    // organizations has admin_id and email columns (no admin_email column).
    let q = supabaseAdmin
      .from('organizations')
      .select('id')
      .eq('organization_type', 'college');
    q = user.email
      ? q.or(`admin_id.eq.${user.id},email.ilike.${user.email}`)
      : q.eq('admin_id', user.id);
    const { data: collegeData } = await q.maybeSingle();
    if (collegeData?.id) collegeId = collegeData.id;
  }

  if (!collegeId) {
    // college_lecturers uses snake_case user_id (there is no userId column).
    const { data: lecturer } = await supabaseAdmin
      .from('college_lecturers')
      .select('collegeId')
      .eq('user_id', user.id)
      .maybeSingle();
    if (lecturer?.collegeId) collegeId = lecturer.collegeId;
  }

  if (!collegeId) {
    return apiError(400, 'VALIDATION_ERROR', 'College ID not found. Please ensure you are logged in as a college admin.', request);
  }

  // The new staff member must join the admin's organization in the SSO DB.
  const ssoOrgId = user.org_id;
  if (!ssoOrgId) {
    return apiError(400, 'VALIDATION_ERROR', 'Admin organization not found in session', request);
  }

  // Pre-check for an existing staff profile in the app DB (fast, friendly error).
  // The SSO worker is the source of truth for the auth user and rejects
  // duplicate emails too.
  const { data: existingLecturer } = await supabaseAdmin
    .from('college_lecturers')
    .select('id')
    .eq('metadata->>email', staff.email.toLowerCase())
    .maybeSingle();
  if (existingLecturer) {
    return apiError(400, 'VALIDATION_ERROR', `Staff member with email ${staff.email} already exists`, request);
  }

  const staffPassword = generatePassword();
  const { firstName, lastName } = splitName(staff.name);

  // Map the selected UI role to the app-DB internal role string.
  const roleMap: Record<string, string> = {
    'College Admin': 'college_admin',
    'HoD': 'hod',
    'Faculty': 'faculty',
    'Lecturer': 'lecturer',
    'Exam Cell': 'exam_cell',
    'Finance Admin': 'finance_admin',
    'Placement Officer': 'placement_officer',
  };
  const primaryRole = roleMap[staff.roles[0]] || 'faculty';

  // SSO role must be a valid name in the SSO roles table. A College Admin staff
  // member maps to college_admin; all other college staff map to college_educator.
  const ssoRole = primaryRole === 'college_admin' ? 'college_admin' : 'college_educator';

  // ── Create the AUTH user in the SSO worker (never Supabase Auth) ──
  // Makes the staff a real, active SSO member of the college's org. Access is
  // granted through the organization's subscription/seats — no personal sub.
  let ssoUserId: string;
  try {
    const ssoMember = await ssoCreateMember(env, {
      email: staff.email.toLowerCase(),
      password: staffPassword,
      role: ssoRole,
      org_id: ssoOrgId,
    });
    if (!ssoMember?.user_id) throw new Error('SSO member creation returned invalid user_id');
    ssoUserId = ssoMember.user_id;
  } catch (ssoErr) {
    return apiError(400, 'VALIDATION_ERROR', (ssoErr as Error).message || 'Failed to create staff account', request);
  }

  try {
    // Create app-DB users profile row (FK target). Mirrors the SSO user id;
    // this is a profile shadow, not an auth record. users.role is the
    // user_role enum (college_admin | college_educator); the fine-grained staff
    // role (faculty/hod/lecturer/...) is preserved in metadata.
    const { error: userInsertError } = await supabaseAdmin.from('users').insert({
      id: ssoUserId,
      email: staff.email.toLowerCase(),
      firstName,
      lastName,
      role: ssoRole,
      organizationId: collegeId,
      isActive: true,
      metadata: {
        source: 'college_admin_added',
        collegeId,
        addedBy: user.id,
        staffRole: primaryRole,
        roles: staff.roles,
        fullName: staff.name,
        entityType: 'college_staff',
      },
    });

    if (userInsertError) {
      throw new Error(`Failed to create user profile: ${userInsertError.message}`);
    }

    // Create college_lecturers record (snake_case user_id; other columns are
    // camelCase per the table schema).
    const { data: staffRecord, error: staffError } = await supabaseAdmin
      .from('college_lecturers')
      .insert({
        user_id: ssoUserId,
        collegeId: collegeId,
        employeeId: staff.employee_id || null,
        department: staff.department_id || null,
        specialization: staff.specialization || null,
        qualification: staff.qualification || null,
        experienceYears: staff.experience_years || null,
        accountStatus: 'active',
        metadata: {
          first_name: firstName,
          last_name: lastName,
          email: staff.email.toLowerCase(),
          phone: staff.phone || null,
          role: primaryRole,
          roles: staff.roles,
          temporary_password: staffPassword,
          password_created_at: new Date().toISOString(),
          created_by: user.email,
        },
      })
      .select()
      .single();

    if (staffError) {
      throw new Error(`Failed to create staff profile: ${staffError.message}`);
    }

    // Flat shape (matches handleCreateTeacher) so the frontend can read
    // result.data.authUserId / staffId / password directly.
    return apiSuccess({
      message: `Staff member ${staff.name} created successfully`,
      authUserId: ssoUserId,
      staffId: staffRecord.id,
      email: staff.email,
      name: staff.name,
      roles: staff.roles,
      password: staffPassword,
      collegeId,
    }, request);
  } catch (error) {
    // Best-effort rollback of the app-DB profile row. The SSO user already
    // exists; it is reused on a corrected retry (duplicate email is rejected).
    if (ssoUserId) {
      await supabaseAdmin.from('users').delete().eq('id', ssoUserId);
    }
    return apiError(400, 'VALIDATION_ERROR', (error as Error).message, request);
  }
}
