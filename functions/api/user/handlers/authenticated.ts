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
  deleteAuthUser,
  generatePassword,
  splitName,
  validateEmail,
} from '../utils/helpers';
import type { 
  AdminUserContext, 
  SsoUserMetadata, 
  SsoMemberResponse, 
  CreateLearnerRequest,
  ApiEnv,
  SubjectExpertise,
  AuthUser
} from '../types';

/**
 * Handle admin creating a learner
 */
export async function handleCreateLearner(
  request: Request, 
  env: ApiEnv,
  user: AdminUserContext
): Promise<Response> {
  const supabaseAdmin = createSupabaseAdminClient(env);

  // Parse and validate request body
  let body: CreateLearnerRequest;
  try {
    const parsed = await request.json();
    if (!parsed || typeof parsed !== 'object') {
      return apiError(400, 'VALIDATION_ERROR', 'Request body must be an object', request);
    }
    body = parsed as CreateLearnerRequest;
  } catch (e) {
    return apiError(400, 'VALIDATION_ERROR', 'Invalid JSON in request body', request);
  }

  const { learner, userEmail, schoolId: requestSchoolId, collegeId: requestCollegeId } = body;

  // Validate required fields
  if (!learner || !learner.name || !learner.email || !learner.contactNumber) {
    return apiError(400, 'VALIDATION_ERROR', 'Missing required fields: name, email, and contactNumber', request);
  }

  if (!userEmail) {
    return apiError(400, 'VALIDATION_ERROR', 'No user email provided', request);
  }

  // Normalize and validate email
  const normalizedEmail = learner.email?.toLowerCase()?.trim();
  if (!normalizedEmail || !validateEmail(normalizedEmail)) {
    return apiError(400, 'VALIDATION_ERROR', 'Invalid email format', request);
  }

  // Validate user context
  if (!user.id || typeof user.id !== 'string' || !user.id.trim()) {
    return apiError(400, 'VALIDATION_ERROR', 'Invalid user ID in context', request);
  }

  if (!user.email || typeof user.email !== 'string' || !user.email.trim()) {
    return apiError(400, 'VALIDATION_ERROR', 'Invalid user email in context', request);
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

  const userId = currentUserData?.id || user.id;
  if (!userId || typeof userId !== 'string') {
    return apiError(400, 'VALIDATION_ERROR', 'Unable to determine admin user ID', request);
  }
  
  const userRole = currentUserData?.role || null;

  // Get and validate SSO org_id from the authenticated user's JWT
  const ssoOrgId = typeof user.org_id === 'string' && user.org_id.trim() 
    ? user.org_id 
    : null;

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

  // Validate institution type matches institution ID
  if (institutionType === 'school' && !schoolId) {
    return apiError(400, 'VALIDATION_ERROR', 'School ID is required for school learners', request);
  }
  if (institutionType === 'college' && !collegeId) {
    return apiError(400, 'VALIDATION_ERROR', 'College ID is required for college learners', request);
  }

  // If we don't have ssoOrgId, we can't properly map the learner to the organization in SSO
  if (!ssoOrgId) {
    console.warn(`Admin ${userEmail} does not have org_id in JWT. Learner will be created without SSO organization mapping.`);
    return apiError(400, 'VALIDATION_ERROR', 'Admin organization ID not found. Please ensure you are properly logged in as a school/college admin.', request);
  }

  // Check if email already exists in auth
  const { data: existingAuthUsers } = await supabaseAdmin.auth.admin.listUsers();
  const emailExists = Array.isArray(existingAuthUsers?.users) && 
    existingAuthUsers.users.some((u: AuthUser) => u?.email === normalizedEmail);
  if (emailExists) {
    return apiError(400, 'VALIDATION_ERROR', `Learner with email ${learner.email} already exists`, request);
  }

  // Check if email already exists in learners table
  const { data: existingLearner } = await supabaseAdmin
    .from('learners')
    .select('id')
    .eq('email', normalizedEmail)
    .maybeSingle();
  if (existingLearner) {
    return apiError(400, 'VALIDATION_ERROR', `Learner with email ${learner.email} already exists`, request);
  }

  // Validate password (using email as password)
  if (!normalizedEmail || normalizedEmail.length < 6) {
    return apiError(400, 'VALIDATION_ERROR', 'Email must be at least 6 characters to use as password', request);
  }
  
  const learnerPassword = normalizedEmail;
  const learnerRole = 'learner';

  // ── Create the AUTH user in the SSO worker ──
  // This makes the learner a real, active SSO member of the school/college's org
  // with the learner role, so they can log in via SSO.
  let ssoUserId: string | null = null;
  
  try {
    const ssoMember = await ssoCreateMember(env, {
      email: normalizedEmail,
      password: learnerPassword,
      role: learnerRole,
      org_id: ssoOrgId,
      user_metadata: {
        name: learner.name,
        phone: learner.contactNumber,
        added_by: userId,
        institution_type: institutionType,
        school_id: schoolId,
        college_id: collegeId,
      } as SsoUserMetadata,
    });
    
    // Validate SSO response
    if (!ssoMember || typeof ssoMember.user_id !== 'string' || !ssoMember.user_id.trim()) {
      throw new Error('Invalid SSO response: missing or invalid user_id');
    }
    
    ssoUserId = ssoMember.user_id;
  } catch (ssoErr) {
    // If SSO creation fails, we should not proceed with app DB creation
    return apiError(400, 'VALIDATION_ERROR', (ssoErr as Error).message || 'Failed to create learner account in SSO', request);
  }

  if (!ssoUserId) {
    return apiError(500, 'INTERNAL_ERROR', 'Failed to create authentication user', request);
  }

  try {
    // Create public.users record
    const { firstName, lastName } = splitName(learner.name);

    await supabaseAdmin.from('users').insert({
      id: ssoUserId,
      email: normalizedEmail,
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
        org_id: ssoOrgId,
      },
    });

    // Create learners record
    const age = calculateAge(learner.dateOfBirth || '');

    const { data: learnerRecord, error: learnerError } = await supabaseAdmin
      .from('learners')
      .insert({
        user_id: ssoUserId,
        email: normalizedEmail,
        name: learner.name,
        contactNumber: learner.contactNumber,
        contact_number: learner.contactNumber,
        dateOfBirth: learner.dateOfBirth || null,
        date_of_birth: learner.dateOfBirth || null,
        age,
        gender: learner.gender || null,
        enrollmentNumber: learner.enrollmentNumber || null,
        grade: learner.grade || null,
        section: learner.section || null,
        guardianName: learner.guardianName || null,
        guardianPhone: learner.guardianPhone || null,
        school_id: schoolId,
        college_id: collegeId,
        learner_type: institutionType === 'college' ? 'direct' : 'learner',
        approval_status: 'approved',
        metadata: {
          source: `${institutionType}_admin_added`,
          addedBy: userId,
          password: learnerPassword,
        },
      })
      .select()
      .single();

    if (learnerError) {
      throw new Error(`Failed to create learner profile: ${learnerError.message}`);
    }

    return apiSuccess({
      message: `Learner ${learner.name} created successfully`,
      data: {
        authUserId: ssoUserId,
        learnerId: learnerRecord.id,
        email: normalizedEmail,
        name: learner.name,
        password: learnerPassword,
        institutionType,
        schoolId,
        collegeId,
        ssoOrgId,
      },
    }, request);
  } catch (error) {
    // Rollback: Delete from app DB with error handling
    if (ssoUserId) {
      const { error: deleteError } = await supabaseAdmin
        .from('users')
        .delete()
        .eq('id', ssoUserId);
      if (deleteError) {
        console.error(`Failed to rollback user ${ssoUserId}:`, deleteError);
      }
      // Note: SSO user remains (will be reused on retry if duplicate email)
    }
    return apiError(400, 'VALIDATION_ERROR', (error as Error).message, request);
  }
}

/**
 * Handle admin creating a teacher
 */
export async function handleCreateTeacher(request: Request, env: ApiEnv, user: AdminUserContext): Promise<Response> {
  const supabaseAdmin = createSupabaseAdminClient(env);

  // Parse and validate request body
  let body;
  try {
    const parsed = await request.json();
    if (!parsed || typeof parsed !== 'object') {
      return apiError(400, 'VALIDATION_ERROR', 'Request body must be an object', request);
    }
    body = parsed;
  } catch (e) {
    return apiError(400, 'VALIDATION_ERROR', 'Invalid JSON in request body', request);
  }

  const { teacher } = body as {
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
      subject_expertise?: SubjectExpertise[];
      subjects_handled?: string[];
      employee_id?: string;
      gender?: string;
      city?: string;
      state?: string;
      dob?: string;
      country?: string;
      pincode?: string;
    };
  };

  console.log('📥 Received teacher data in API:', JSON.stringify(teacher, null, 2));

  if (!teacher || !teacher.first_name || !teacher.last_name || !teacher.email) {
    return apiError(400, 'VALIDATION_ERROR', 'Missing required fields: first_name, last_name, and email', request);
  }

  // Normalize and validate email
  const normalizedEmail = teacher.email?.toLowerCase()?.trim();
  if (!normalizedEmail || !validateEmail(normalizedEmail)) {
    return apiError(400, 'VALIDATION_ERROR', 'Invalid email format', request);
  }

  // Validate user context
  if (!user.id || typeof user.id !== 'string' || !user.id.trim()) {
    return apiError(400, 'VALIDATION_ERROR', 'Invalid user ID in context', request);
  }

  if (!user.email || typeof user.email !== 'string' || !user.email.trim()) {
    return apiError(400, 'VALIDATION_ERROR', 'Invalid user email in context', request);
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
    .eq('email', normalizedEmail)
    .maybeSingle();
  if (existingTeacher) {
    return apiError(400, 'VALIDATION_ERROR', `Teacher with email ${teacher.email} already exists`, request);
  }

  // The new teacher must join the admin's organization in the SSO DB.
  const ssoOrgId = typeof user.org_id === 'string' && user.org_id.trim()
    ? user.org_id
    : null;
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
      email: normalizedEmail,
      password: teacherPassword,
      role: 'school_educator',
      org_id: ssoOrgId,
    });
    
    // Validate SSO response
    if (!ssoMember || typeof ssoMember.user_id !== 'string' || !ssoMember.user_id.trim()) {
      throw new Error('Invalid SSO response: missing or invalid user_id');
    }
    
    ssoUserId = ssoMember.user_id;
  } catch (ssoErr) {
    return apiError(400, 'VALIDATION_ERROR', (ssoErr as Error).message || 'Failed to create teacher account', request);
  }

  try {
    // Create app-DB users profile row (FK target for school_educators).
    // Mirrors the SSO user id; this is a profile shadow, not an auth record.
    await supabaseAdmin.from('users').insert({
      id: ssoUserId,
      email: normalizedEmail,
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
      email: normalizedEmail,
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
      subjects_handled: teacher.subjects_handled || (Array.isArray(teacher.subject_expertise) ? teacher.subject_expertise.map((s: SubjectExpertise | string) => typeof s === 'string' ? s : s.name) : []),
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
      email: normalizedEmail,
      name: `${teacher.first_name} ${teacher.last_name}`,
      password: teacherPassword,
      role: teacher.role,
    }, request);
  } catch (error) {
    // Best-effort rollback of the app-DB profile row. The SSO user already
    // exists; it is reused on a corrected retry (duplicate email is rejected).
    if (ssoUserId) {
      const { error: deleteError } = await supabaseAdmin
        .from('users')
        .delete()
        .eq('id', ssoUserId);
      if (deleteError) {
        console.error(`Failed to rollback user ${ssoUserId}:`, deleteError);
      }
    }
    return apiError(400, 'VALIDATION_ERROR', (error as Error).message, request);
  }
}

/**
 * Handle updating learner documents
 */
export async function handleUpdateLearnerDocuments(request: Request, env: ApiEnv): Promise<Response> {
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
export async function handleCreateCollegeStaff(request: Request, env: ApiEnv, user: AdminUserContext): Promise<Response> {
  const supabaseAdmin = createSupabaseAdminClient(env);

  // Parse and validate request body
  let body;
  try {
    const parsed = await request.json();
    if (!parsed || typeof parsed !== 'object') {
      return apiError(400, 'VALIDATION_ERROR', 'Request body must be an object', request);
    }
    body = parsed;
  } catch (e) {
    return apiError(400, 'VALIDATION_ERROR', 'Invalid JSON in request body', request);
  }

  const { staff, collegeId: requestCollegeId } = body as {
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

  if (!staff || !staff.name || !staff.email) {
    return apiError(400, 'VALIDATION_ERROR', 'Missing required fields: name and email', request);
  }

  if (!staff.roles || staff.roles.length === 0) {
    return apiError(400, 'VALIDATION_ERROR', 'At least one role must be selected', request);
  }

  // Normalize and validate email
  const normalizedEmail = staff.email?.toLowerCase()?.trim();
  if (!normalizedEmail || !validateEmail(normalizedEmail)) {
    return apiError(400, 'VALIDATION_ERROR', 'Invalid email format', request);
  }

  // Validate user context
  if (!user.id || typeof user.id !== 'string' || !user.id.trim()) {
    return apiError(400, 'VALIDATION_ERROR', 'Invalid user ID in context', request);
  }

  if (!user.email || typeof user.email !== 'string' || !user.email.trim()) {
    return apiError(400, 'VALIDATION_ERROR', 'Invalid user email in context', request);
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

  // Pre-check for an existing staff profile in the app DB (fast, friendly error).
  // The SSO worker is the source of truth for the auth user and rejects
  // duplicate emails too.
  const { data: existingLecturer } = await supabaseAdmin
    .from('college_lecturers')
    .select('id')
    .eq('metadata->>email', normalizedEmail)
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

  // The new staff member must join the admin's organization in the SSO DB.
  const ssoOrgId = typeof user.org_id === 'string' && user.org_id.trim()
    ? user.org_id
    : null;
  if (!ssoOrgId) {
    return apiError(400, 'VALIDATION_ERROR', 'Admin organization not found in session', request);
  }

  // ── Create the AUTH user in the SSO worker (never Supabase Auth) ──
  // Makes the staff a real, active SSO member of the college's org. Access is
  // granted through the organization's subscription/seats — no personal sub.
  let ssoUserId: string;
  try {
    const ssoMember = await ssoCreateMember(env, {
      email: normalizedEmail,
      password: staffPassword,
      role: ssoRole,
      org_id: ssoOrgId,
    });
    
    // Validate SSO response
    if (!ssoMember || typeof ssoMember.user_id !== 'string' || !ssoMember.user_id.trim()) {
      throw new Error('Invalid SSO response: missing or invalid user_id');
    }
    
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
      email: normalizedEmail,
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
          email: normalizedEmail,
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
      email: normalizedEmail,
      name: staff.name,
      roles: staff.roles,
      password: staffPassword,
      collegeId,
    }, request);
  } catch (error) {
    // Best-effort rollback of the app-DB profile row. The SSO user already
    // exists; it is reused on a corrected retry (duplicate email is rejected).
    if (ssoUserId) {
      const { error: deleteError } = await supabaseAdmin
        .from('users')
        .delete()
        .eq('id', ssoUserId);
      if (deleteError) {
        console.error(`Failed to rollback user ${ssoUserId}:`, deleteError);
      }
    }
    return apiError(400, 'VALIDATION_ERROR', (error as Error).message, request);
  }
}
