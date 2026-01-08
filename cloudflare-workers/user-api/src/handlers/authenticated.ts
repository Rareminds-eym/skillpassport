/**
 * Authenticated handlers (Admin creates users)
 * - Create student (admin adds student)
 * - Create teacher (admin adds teacher)
 * - Create college staff (college admin adds staff)
 */

import { Env, CreateStudentRequest, CreateTeacherRequest, CreateCollegeStaffRequest } from '../types';
import { jsonResponse, validateEmail, splitName, generatePassword, calculateAge } from '../utils/helpers';
import { getSupabaseAdmin, authenticateUser, deleteAuthUser } from '../utils/supabase';

/**
 * Handle admin creating a student
 */
export async function handleCreateStudent(request: Request, env: Env): Promise<Response> {
  const auth = await authenticateUser(request, env);
  if (!auth) return jsonResponse({ error: 'Unauthorized' }, 401);

  const { supabaseAdmin } = auth;

  const body = (await request.json()) as CreateStudentRequest;
  const { student, userEmail, schoolId: requestSchoolId, collegeId: requestCollegeId } = body;

  if (!student || !student.name || !student.email || !student.contactNumber) {
    return jsonResponse({ error: 'Missing required fields: name, email, and contactNumber' }, 400);
  }

  if (!userEmail) {
    return jsonResponse({ error: 'No user email provided' }, 400);
  }

  if (!validateEmail(student.email)) {
    return jsonResponse({ error: 'Invalid email format' }, 400);
  }

  // Get current user data
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
      const { data: college } = await supabaseAdmin
        .from('colleges')
        .select('id')
        .ilike('deanEmail', userEmail)
        .maybeSingle();
      if (college?.id) {
        collegeId = college.id;
        institutionType = 'college';
      }
    } else {
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
    return jsonResponse({ error: 'School/College ID not found' }, 400);
  }

  // Check if email already exists
  const { data: existingAuthUsers } = await supabaseAdmin.auth.admin.listUsers();
  const emailExists = existingAuthUsers?.users?.some(
    (u) => u.email === student.email.toLowerCase()
  );
  if (emailExists) {
    return jsonResponse({ error: `Student with email ${student.email} already exists` }, 400);
  }

  const { data: existingStudent } = await supabaseAdmin
    .from('students')
    .select('id')
    .eq('email', student.email.toLowerCase())
    .maybeSingle();
  if (existingStudent) {
    return jsonResponse({ error: `Student with email ${student.email} already exists` }, 400);
  }

  const studentPassword = generatePassword();
  const studentRole = institutionType === 'college' ? 'college_student' : 'school_student';

  // Create auth user
  const { data: authUser, error: authError } = await supabaseAdmin.auth.admin.createUser({
    email: student.email.toLowerCase(),
    password: studentPassword,
    email_confirm: true,
    user_metadata: {
      name: student.name,
      role: studentRole,
      phone: student.contactNumber,
      password: studentPassword,
      added_by: userId,
    },
  });

  if (authError || !authUser.user) {
    return jsonResponse({ error: `Failed to create auth account: ${authError?.message}` }, 500);
  }

  try {
    // Create public.users record
    const { firstName, lastName } = splitName(student.name);

    await supabaseAdmin.from('users').insert({
      id: authUser.user.id,
      email: student.email.toLowerCase(),
      firstName,
      lastName,
      role: studentRole,
      organizationId: schoolId || collegeId,
      isActive: true,
      metadata: {
        source: `${institutionType}_admin_added`,
        schoolId,
        collegeId,
        addedBy: userId,
        password: studentPassword,
      },
    });

    // Create students record
    const age = calculateAge(student.dateOfBirth || '');

    const { data: studentRecord, error: studentError } = await supabaseAdmin
      .from('students')
      .insert({
        id: authUser.user.id,
        user_id: authUser.user.id,
        email: student.email.toLowerCase(),
        name: student.name,
        contactNumber: student.contactNumber,
        contact_number: student.contactNumber,
        dateOfBirth: student.dateOfBirth || null,
        date_of_birth: student.dateOfBirth || null,
        age,
        gender: student.gender || null,
        enrollmentNumber: student.enrollmentNumber || null,
        grade: student.grade || null,
        section: student.section || null,
        guardianName: student.guardianName || null,
        guardianPhone: student.guardianPhone || null,
        school_id: schoolId,
        college_id: collegeId,
        student_type: institutionType === 'college' ? 'direct' : 'school_student',
        approval_status: 'approved',
        metadata: {
          source: `${institutionType}_admin_added`,
          addedBy: userId,
          password: studentPassword,
        },
      })
      .select()
      .single();

    if (studentError) {
      throw new Error(`Failed to create student profile: ${studentError.message}`);
    }

    return jsonResponse({
      success: true,
      message: `Student ${student.name} created successfully`,
      data: {
        authUserId: authUser.user.id,
        studentId: studentRecord.id,
        email: student.email,
        name: student.name,
        password: studentPassword,
        institutionType,
        schoolId,
        collegeId,
      },
    });
  } catch (error) {
    // Rollback auth user
    await deleteAuthUser(supabaseAdmin, authUser.user.id);
    return jsonResponse({ error: (error as Error).message }, 400);
  }
}

/**
 * Handle admin creating a teacher
 */
export async function handleCreateTeacher(request: Request, env: Env): Promise<Response> {
  const auth = await authenticateUser(request, env);
  if (!auth) return jsonResponse({ error: 'Unauthorized' }, 401);

  const { user, supabaseAdmin } = auth;

  const body = (await request.json()) as CreateTeacherRequest;
  const { teacher } = body;

  if (!teacher || !teacher.first_name || !teacher.last_name || !teacher.email) {
    return jsonResponse({ error: 'Missing required fields: first_name, last_name, and email' }, 400);
  }

  if (!validateEmail(teacher.email)) {
    return jsonResponse({ error: 'Invalid email format' }, 400);
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
    const { data: schoolData } = await supabaseAdmin
      .from('schools')
      .select('id')
      .or(`email.eq.${user.email},principal_email.eq.${user.email}`)
      .maybeSingle();
    schoolId = schoolData?.id || null;
  }

  if (!schoolId) {
    return jsonResponse({ error: 'School ID not found' }, 400);
  }

  // Check if email exists
  const { data: existingAuthUsers } = await supabaseAdmin.auth.admin.listUsers();
  const emailExists = existingAuthUsers?.users?.some(
    (u) => u.email === teacher.email.toLowerCase()
  );
  if (emailExists) {
    return jsonResponse({ error: `User with email ${teacher.email} already exists` }, 400);
  }

  const { data: existingTeacher } = await supabaseAdmin
    .from('school_educators')
    .select('id')
    .eq('email', teacher.email.toLowerCase())
    .maybeSingle();
  if (existingTeacher) {
    return jsonResponse({ error: `Teacher with email ${teacher.email} already exists` }, 400);
  }

  const teacherPassword = generatePassword();

  // Create auth user
  const { data: authUser, error: authError } = await supabaseAdmin.auth.admin.createUser({
    email: teacher.email.toLowerCase(),
    password: teacherPassword,
    email_confirm: true,
    user_metadata: {
      first_name: teacher.first_name,
      last_name: teacher.last_name,
      role: 'educator',
      school_id: schoolId,
      added_by: user.id,
    },
  });

  if (authError || !authUser.user) {
    return jsonResponse({ error: `Failed to create auth account: ${authError?.message}` }, 500);
  }

  try {
    // Create public.users record
    await supabaseAdmin.from('users').insert({
      id: authUser.user.id,
      email: teacher.email.toLowerCase(),
      firstName: teacher.first_name,
      lastName: teacher.last_name,
      role: 'educator',
      organizationId: schoolId,
      isActive: true,
      entity_type: 'educator',
      metadata: {
        source: 'school_admin_added',
        schoolId,
        addedBy: user.id,
        teacherRole: teacher.role,
      },
    });

    // Create school_educators record
    const { data: teacherRecord, error: teacherError } = await supabaseAdmin
      .from('school_educators')
      .insert({
        user_id: authUser.user.id,
        school_id: schoolId,
        email: teacher.email.toLowerCase(),
        first_name: teacher.first_name,
        last_name: teacher.last_name,
        phone_number: teacher.phone_number || null,
        dob: teacher.date_of_birth || null,
        address: teacher.address || null,
        qualification: teacher.qualification || null,
        role: teacher.role || 'subject_teacher',
        subject_expertise: teacher.subject_expertise || [],
        onboarding_status: 'active',
        metadata: {
          temporary_password: teacherPassword,
          created_by: user.id,
          source: 'school_admin_added',
        },
      })
      .select()
      .single();

    if (teacherError) {
      throw new Error(`Failed to create teacher profile: ${teacherError.message}`);
    }

    return jsonResponse({
      success: true,
      message: `Teacher ${teacher.first_name} ${teacher.last_name} created successfully`,
      data: {
        authUserId: authUser.user.id,
        teacherId: teacherRecord.id,
        email: teacher.email,
        name: `${teacher.first_name} ${teacher.last_name}`,
        password: teacherPassword,
        role: teacher.role,
      },
    });
  } catch (error) {
    await deleteAuthUser(supabaseAdmin, authUser.user.id);
    return jsonResponse({ error: (error as Error).message }, 400);
  }
}

/**
 * Handle updating student documents
 */
export async function handleUpdateStudentDocuments(request: Request, env: Env): Promise<Response> {
  const auth = await authenticateUser(request, env);
  if (!auth) return jsonResponse({ error: 'Unauthorized' }, 401);

  const { supabaseAdmin } = auth;

  const body = await request.json() as {
    studentId: string;
    documents: Array<{
      name: string;
      url: string;
      size: number;
      type: string;
    }>;
  };

  const { studentId, documents } = body;

  if (!studentId) {
    return jsonResponse({ error: 'Missing required field: studentId' }, 400);
  }

  if (!documents || !Array.isArray(documents)) {
    return jsonResponse({ error: 'Missing or invalid documents array' }, 400);
  }

  try {
    // Validate that the student exists
    const { data: existingStudent, error: fetchError } = await supabaseAdmin
      .from('students')
      .select('id, documents')
      .eq('id', studentId)
      .single();

    if (fetchError || !existingStudent) {
      return jsonResponse({ error: 'Student not found' }, 404);
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
    const existingDocuments = existingStudent.documents || [];
    const updatedDocuments = [...existingDocuments, ...formattedDocuments];

    // Update student record with documents
    const { error: updateError } = await supabaseAdmin
      .from('students')
      .update({ documents: updatedDocuments })
      .eq('id', studentId);

    if (updateError) {
      return jsonResponse({ error: `Failed to update student documents: ${updateError.message}` }, 500);
    }

    return jsonResponse({
      success: true,
      message: `Successfully updated documents for student ${studentId}`,
      data: {
        studentId,
        documentsCount: formattedDocuments.length,
        totalDocuments: updatedDocuments.length
      }
    });
  } catch (error) {
    return jsonResponse({ error: (error as Error).message }, 500);
  }
}

/**
 * Handle college admin creating a staff member
 * Supports roles: College Admin, HoD, Faculty, Lecturer, Exam Cell, Finance Admin, Placement Officer
 */
export async function handleCreateCollegeStaff(request: Request, env: Env): Promise<Response> {
  const auth = await authenticateUser(request, env);
  if (!auth) return jsonResponse({ error: 'Unauthorized' }, 401);

  const { user, supabaseAdmin } = auth;

  const body = (await request.json()) as CreateCollegeStaffRequest;
  const { staff, collegeId: requestCollegeId } = body;

  if (!staff || !staff.name || !staff.email) {
    return jsonResponse({ error: 'Missing required fields: name and email' }, 400);
  }

  if (!staff.roles || staff.roles.length === 0) {
    return jsonResponse({ error: 'At least one role must be selected' }, 400);
  }

  if (!validateEmail(staff.email)) {
    return jsonResponse({ error: 'Invalid email format' }, 400);
  }

  // Get college ID from request or current user context
  let collegeId = requestCollegeId || null;

  // First, try to get organizationId from users table
  if (!collegeId) {
    const { data: userData } = await supabaseAdmin
      .from('users')
      .select('organizationId')
      .eq('id', user.id)
      .maybeSingle();

    if (userData?.organizationId) {
      collegeId = userData.organizationId;
      console.log('Found collegeId from users.organizationId:', collegeId);
    }
  }

  // Try to find college by deanEmail
  if (!collegeId) {
    const { data: collegeByDean } = await supabaseAdmin
      .from('colleges')
      .select('id')
      .ilike('deanEmail', user.email || '')
      .maybeSingle();

    if (collegeByDean?.id) {
      collegeId = collegeByDean.id;
      console.log('Found collegeId from colleges.deanEmail:', collegeId);
    }
  }

  // Try to find college by email
  if (!collegeId) {
    const { data: collegeByEmail } = await supabaseAdmin
      .from('colleges')
      .select('id')
      .ilike('email', user.email || '')
      .maybeSingle();

    if (collegeByEmail?.id) {
      collegeId = collegeByEmail.id;
      console.log('Found collegeId from colleges.email:', collegeId);
    }
  }

  // Try to get from college_lecturers table by userId
  if (!collegeId) {
    const { data: lecturerByUserId } = await supabaseAdmin
      .from('college_lecturers')
      .select('collegeId')
      .eq('userId', user.id)
      .maybeSingle();

    if (lecturerByUserId?.collegeId) {
      collegeId = lecturerByUserId.collegeId;
      console.log('Found collegeId from college_lecturers.userId:', collegeId);
    }
  }

  // Try to get from college_lecturers table by user_id
  if (!collegeId) {
    const { data: lecturerByUser_id } = await supabaseAdmin
      .from('college_lecturers')
      .select('collegeId')
      .eq('user_id', user.id)
      .maybeSingle();

    if (lecturerByUser_id?.collegeId) {
      collegeId = lecturerByUser_id.collegeId;
      console.log('Found collegeId from college_lecturers.user_id:', collegeId);
    }
  }

  // Try to get from college_lecturers by email in metadata
  if (!collegeId && user.email) {
    const { data: lecturerByEmail } = await supabaseAdmin
      .from('college_lecturers')
      .select('collegeId')
      .eq('metadata->>email', user.email.toLowerCase())
      .maybeSingle();

    if (lecturerByEmail?.collegeId) {
      collegeId = lecturerByEmail.collegeId;
      console.log('Found collegeId from college_lecturers.metadata.email:', collegeId);
    }
  }

  if (!collegeId) {
    console.error('Could not find college ID for user:', { userId: user.id, email: user.email });
    return jsonResponse({ error: 'College ID not found. Please ensure you are logged in as a college admin.' }, 400);
  }

  console.log('Using collegeId:', collegeId);

  // Check if email already exists in auth
  const { data: existingAuthUsers } = await supabaseAdmin.auth.admin.listUsers();
  const emailExists = existingAuthUsers?.users?.some(
    (u) => u.email?.toLowerCase() === staff.email.toLowerCase()
  );
  if (emailExists) {
    return jsonResponse({ error: `User with email ${staff.email} already exists` }, 400);
  }

  // Check if email exists in college_lecturers
  const { data: existingLecturer } = await supabaseAdmin
    .from('college_lecturers')
    .select('id')
    .eq('metadata->>email', staff.email.toLowerCase())
    .maybeSingle();

  if (existingLecturer) {
    return jsonResponse({ error: `Staff member with email ${staff.email} already exists` }, 400);
  }

  const staffPassword = generatePassword();
  const { firstName, lastName } = splitName(staff.name);

  // Map role to internal role format
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

  // Create auth user
  const { data: authUser, error: authError } = await supabaseAdmin.auth.admin.createUser({
    email: staff.email.toLowerCase(),
    password: staffPassword,
    email_confirm: true,
    user_metadata: {
      name: staff.name,
      first_name: firstName,
      last_name: lastName,
      role: primaryRole,
      roles: staff.roles,
      college_id: collegeId,
      added_by: user.id,
    },
  });

  if (authError || !authUser.user) {
    return jsonResponse({ error: `Failed to create auth account: ${authError?.message}` }, 500);
  }

  try {
    // Create public.users record
    await supabaseAdmin.from('users').insert({
      id: authUser.user.id,
      email: staff.email.toLowerCase(),
      firstName,
      lastName,
      full_name: staff.name,
      name: staff.name,
      role: primaryRole,
      organizationId: collegeId,
      isActive: true,
      entity_type: 'college_staff',
      metadata: {
        source: 'college_admin_added',
        collegeId,
        addedBy: user.id,
        roles: staff.roles,
        password: staffPassword,
      },
    });

    // Create college_lecturers record
    const { data: staffRecord, error: staffError } = await supabaseAdmin
      .from('college_lecturers')
      .insert({
        userId: authUser.user.id,
        user_id: authUser.user.id,
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

    return jsonResponse({
      success: true,
      message: `Staff member ${staff.name} created successfully`,
      data: {
        authUserId: authUser.user.id,
        staffId: staffRecord.id,
        email: staff.email,
        name: staff.name,
        roles: staff.roles,
        password: staffPassword,
        collegeId,
      },
    });
  } catch (error) {
    // Rollback auth user
    await deleteAuthUser(supabaseAdmin, authUser.user.id);
    return jsonResponse({ error: (error as Error).message }, 400);
  }
}
