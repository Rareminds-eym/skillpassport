/**
 * User API Cloudflare Worker
 * Handles user management:
 * - /create-student - Create student account
 * - /create-teacher - Create teacher/educator account
 * - /reset-password - Send OTP and reset password
 */

import { createClient, SupabaseClient } from '@supabase/supabase-js';

export interface Env {
  SUPABASE_URL: string;
  SUPABASE_ANON_KEY: string;
  SUPABASE_SERVICE_ROLE_KEY: string;
  RESEND_API_KEY: string;
}

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
};

function jsonResponse(data: any, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  });
}

function generatePassword(): string {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghjkmnpqrstuvwxyz23456789!@#$%';
  let password = '';
  for (let i = 0; i < 12; i++) {
    password += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return password;
}

async function authenticateUser(request: Request, env: Env): Promise<{ user: any; supabaseAdmin: SupabaseClient } | null> {
  const authHeader = request.headers.get('Authorization');
  if (!authHeader) return null;

  const token = authHeader.replace('Bearer ', '');
  const supabaseAdmin = createClient(env.SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY);
  
  const { data: { user }, error } = await supabaseAdmin.auth.getUser(token);
  if (error || !user) return null;

  return { user, supabaseAdmin };
}


// ==================== CREATE STUDENT ====================

async function handleCreateStudent(request: Request, env: Env): Promise<Response> {
  const auth = await authenticateUser(request, env);
  if (!auth) return jsonResponse({ error: 'Unauthorized' }, 401);

  const { user, supabaseAdmin } = auth;

  const body = await request.json() as {
    student?: any;
    userEmail?: string;
    schoolId?: string;
    collegeId?: string;
  };

  const { student, userEmail, schoolId: requestSchoolId, collegeId: requestCollegeId } = body;

  if (!student || !student.name || !student.email || !student.contactNumber) {
    return jsonResponse({ error: 'Missing required fields: name, email, and contactNumber' }, 400);
  }

  if (!userEmail) {
    return jsonResponse({ error: 'No user email provided' }, 400);
  }

  // Validate email format
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(student.email)) {
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
      if (!schoolId) {
        const { data: educatorData } = await supabaseAdmin
          .from('school_educators')
          .select('school_id')
          .eq('email', userEmail)
          .maybeSingle();
        schoolId = educatorData?.school_id || null;
      }
      if (schoolId) institutionType = 'school';
    }
  }

  if (!schoolId && !collegeId) {
    return jsonResponse({ error: 'School/College ID not found' }, 400);
  }

  // Check if email already exists
  const { data: existingAuthUsers } = await supabaseAdmin.auth.admin.listUsers();
  const emailExists = existingAuthUsers?.users?.some(u => u.email === student.email.toLowerCase());
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
    const nameParts = student.name.trim().split(' ');
    const firstName = nameParts[0] || student.name;
    const lastName = nameParts.slice(1).join(' ') || '';

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
    let age: number | null = null;
    if (student.dateOfBirth) {
      const birthDate = new Date(student.dateOfBirth);
      const today = new Date();
      age = today.getFullYear() - birthDate.getFullYear();
    }

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
    await supabaseAdmin.auth.admin.deleteUser(authUser.user.id);
    return jsonResponse({ error: (error as Error).message }, 400);
  }
}


// ==================== CREATE TEACHER ====================

async function handleCreateTeacher(request: Request, env: Env): Promise<Response> {
  const auth = await authenticateUser(request, env);
  if (!auth) return jsonResponse({ error: 'Unauthorized' }, 401);

  const { user, supabaseAdmin } = auth;

  const body = await request.json() as { teacher?: any };
  const { teacher } = body;

  if (!teacher || !teacher.first_name || !teacher.last_name || !teacher.email) {
    return jsonResponse({ error: 'Missing required fields: first_name, last_name, and email' }, 400);
  }

  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(teacher.email)) {
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
  const emailExists = existingAuthUsers?.users?.some(u => u.email === teacher.email.toLowerCase());
  if (emailExists) {
    return jsonResponse({ error: `User with email ${teacher.email} already exists` }, 400);
  }

  const { data: existingTeacher } = await supabaseAdmin
    .from('school_educators')
    .select('teacher_id')
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
        teacherId: teacherRecord.teacher_id,
        email: teacher.email,
        name: `${teacher.first_name} ${teacher.last_name}`,
        password: teacherPassword,
        role: teacher.role,
      },
    });
  } catch (error) {
    await supabaseAdmin.auth.admin.deleteUser(authUser.user.id);
    return jsonResponse({ error: (error as Error).message }, 400);
  }
}

// ==================== CREATE EVENT USER ====================

function getRoleDisplayName(role: string): string {
  const roleDisplayNames: Record<string, string> = {
    'school-student': 'School Student',
    'college-student': 'College Student',
    'university-student': 'University Student',
    'educator': 'Educator',
    'school-educator': 'School Educator',
    'college-educator': 'College Educator',
    'school-admin': 'School Admin',
    'college-admin': 'College Admin',
    'university-admin': 'University Admin',
    'recruiter': 'Recruiter',
    'company-admin': 'Company Admin',
  };
  return roleDisplayNames[role] || role.replace(/[-_]/g, ' ').replace(/\b\w/g, c => c.toUpperCase());
}

async function sendWelcomeEmail(
  env: Env,
  email: string,
  firstName: string,
  temporaryPassword: string,
  planName: string,
  role: string
): Promise<{ success: boolean; error?: string }> {
  if (!env.RESEND_API_KEY) {
    return { success: false, error: 'Email service not configured' };
  }

  const roleDisplayName = getRoleDisplayName(role);
  const loginUrl = 'https://skillpassport.rareminds.in/login';

  const htmlContent = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <title>Welcome to Skill Passport</title>
</head>
<body style="margin: 0; padding: 0; font-family: 'Segoe UI', sans-serif; background-color: #f4f7fa;">
  <table style="width: 100%; border-collapse: collapse;">
    <tr>
      <td align="center" style="padding: 40px 0;">
        <table style="width: 600px; max-width: 100%; background-color: #ffffff; border-radius: 12px; box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);">
          <tr>
            <td style="padding: 40px; text-align: center; background: linear-gradient(135deg, #3B82F6 0%, #1D4ED8 100%); border-radius: 12px 12px 0 0;">
              <h1 style="margin: 0; color: #ffffff; font-size: 28px;">🎉 Welcome to Skill Passport!</h1>
            </td>
          </tr>
          <tr>
            <td style="padding: 40px;">
              <p style="color: #374151; font-size: 16px;">Hi <strong>${firstName}</strong>,</p>
              <p style="color: #374151; font-size: 16px;">Your <strong>${planName}</strong> subscription is now active!</p>
              <div style="background-color: #F3F4F6; border-radius: 8px; padding: 24px; margin: 24px 0;">
                <h3 style="margin: 0 0 16px; color: #1F2937;">Your Login Credentials</h3>
                <p style="margin: 8px 0;"><strong>Email:</strong> ${email}</p>
                <p style="margin: 8px 0;"><strong>Password:</strong> <code style="background: #E5E7EB; padding: 4px 8px; border-radius: 4px;">${temporaryPassword}</code></p>
                <p style="margin: 8px 0;"><strong>Role:</strong> ${roleDisplayName}</p>
              </div>
              <div style="background-color: #FEF3C7; border-left: 4px solid #F59E0B; padding: 16px; margin: 24px 0;">
                <p style="margin: 0; color: #92400E;">⚠️ Please change your password after your first login.</p>
              </div>
              <div style="text-align: center; margin: 32px 0;">
                <a href="${loginUrl}" style="display: inline-block; background: linear-gradient(135deg, #3B82F6 0%, #1D4ED8 100%); color: #ffffff; text-decoration: none; padding: 14px 32px; border-radius: 8px; font-size: 16px; font-weight: 600;">Login to Your Account →</a>
              </div>
            </td>
          </tr>
          <tr>
            <td style="padding: 24px 40px; background-color: #F9FAFB; border-radius: 0 0 12px 12px; text-align: center;">
              <p style="margin: 0; color: #9CA3AF; font-size: 12px;">© ${new Date().getFullYear()} Skill Passport by Rareminds</p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;

  try {
    const recipients = [email, 'marketing@rareminds.in', 'karthikeyan@rareminds.in'];
    const response = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${env.RESEND_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        from: 'Skill Passport <dev@rareminds.in>',
        to: recipients,
        subject: `Welcome to Skill Passport - Your ${planName} is Active! 🎉`,
        html: htmlContent,
      }),
    });

    if (!response.ok) {
      const errorData = await response.text();
      return { success: false, error: errorData };
    }

    return { success: true };
  } catch (error) {
    return { success: false, error: (error as Error).message };
  }
}

async function handleCreateEventUser(request: Request, env: Env): Promise<Response> {
  const supabaseAdmin = createClient(env.SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY);

  const body = await request.json() as {
    email?: string;
    firstName?: string;
    lastName?: string;
    role?: string;
    phone?: string;
    registrationId?: string;
    metadata?: Record<string, unknown>;
  };

  const { email, firstName, lastName, role, phone, registrationId, metadata } = body;

  if (!email || !firstName || !role || !registrationId) {
    return jsonResponse({ error: 'Missing required fields: email, firstName, role, registrationId' }, 400);
  }

  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(email)) {
    return jsonResponse({ error: 'Invalid email format' }, 400);
  }

  console.log(`Creating user for event registration: ${registrationId}, email: ${email}`);

  // Check if user already exists
  const { data: existingUsers } = await supabaseAdmin.auth.admin.listUsers();
  const existingUser = existingUsers?.users?.find(u => u.email === email);

  if (existingUser) {
    // Check if user exists in public.users table
    const { data: publicUser } = await supabaseAdmin
      .from('users')
      .select('id')
      .eq('id', existingUser.id)
      .maybeSingle();

    if (!publicUser) {
      const roleMapping: Record<string, string> = {
        'school-student': 'school_student',
        'college-student': 'college_student',
        'university-student': 'college_student',
        'educator': 'college_educator',
        'school-admin': 'school_admin',
        'college-admin': 'college_admin',
        'university-admin': 'university_admin',
        'recruiter': 'recruiter',
      };
      const dbRole = roleMapping[role] || 'college_student';

      await supabaseAdmin.from('users').insert({
        id: existingUser.id,
        email,
        firstName,
        lastName: lastName || '',
        role: dbRole,
        phone: phone || null,
        isActive: true,
        metadata: { registration_id: registrationId, ...metadata },
      });
    }

    // Update registration with existing user ID
    await supabaseAdmin
      .from('event_registrations')
      .update({ user_id: existingUser.id })
      .eq('id', registrationId);

    return jsonResponse({
      success: true,
      message: 'User already exists',
      userId: existingUser.id,
      isExisting: true,
    });
  }

  // Generate temporary password
  const temporaryPassword = generatePassword();

  // Create new user
  const { data: newUser, error: createError } = await supabaseAdmin.auth.admin.createUser({
    email,
    password: temporaryPassword,
    email_confirm: true,
    user_metadata: {
      first_name: firstName,
      last_name: lastName || '',
      full_name: `${firstName} ${lastName || ''}`.trim(),
      role,
      phone: phone || '',
      registration_id: registrationId,
      ...metadata,
    },
  });

  if (createError || !newUser.user) {
    return jsonResponse({ error: createError?.message || 'Failed to create user' }, 400);
  }

  // Map role to database format
  const roleMapping: Record<string, string> = {
    'school-student': 'school_student',
    'college-student': 'college_student',
    'university-student': 'college_student',
    'educator': 'college_educator',
    'school-admin': 'school_admin',
    'college-admin': 'college_admin',
    'university-admin': 'university_admin',
    'recruiter': 'recruiter',
  };
  const dbRole = roleMapping[role] || 'college_student';

  // Create public.users record
  const { error: usersError } = await supabaseAdmin.from('users').insert({
    id: newUser.user.id,
    email,
    firstName,
    lastName: lastName || '',
    role: dbRole,
    phone: phone || null,
    temporary_password: temporaryPassword,
    password_changed: false,
    isActive: true,
    metadata: { registration_id: registrationId, ...metadata },
  });

  // Update registration with new user ID
  const { error: updateError } = await supabaseAdmin
    .from('event_registrations')
    .update({ user_id: newUser.user.id })
    .eq('id', registrationId);

  // Send welcome email
  const planName = (metadata?.plan as string) || 'Skill Passport';
  const emailResult = await sendWelcomeEmail(env, email, firstName, temporaryPassword, planName, role);

  return jsonResponse({
    success: true,
    message: 'User created successfully',
    userId: newUser.user.id,
    temporaryPassword,
    isExisting: false,
    publicUserCreated: !usersError,
    registrationUpdated: !updateError,
    emailSent: emailResult.success,
  });
}

// ==================== SEND INTERVIEW REMINDER ====================

async function handleSendInterviewReminder(request: Request, env: Env): Promise<Response> {
  const supabaseAdmin = createClient(env.SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY);

  const body = await request.json() as {
    interviewId?: string;
    recipientEmail?: string;
    recipientName?: string;
    interviewDetails?: {
      date: string;
      time: string;
      duration: number;
      meetingLink?: string;
      meetingType?: string;
      jobTitle?: string;
      interviewer?: string;
    };
  };

  const { interviewId, recipientEmail, recipientName, interviewDetails } = body;

  if (!interviewId || !recipientEmail || !recipientName) {
    return jsonResponse({ error: 'Missing required fields: interviewId, recipientEmail, recipientName' }, 400);
  }

  // Get interview details from database if not provided
  let emailDetails = interviewDetails;
  if (!emailDetails) {
    const { data: interview, error } = await supabaseAdmin
      .from('interviews')
      .select('*')
      .eq('id', interviewId)
      .maybeSingle();

    if (error || !interview) {
      return jsonResponse({ error: 'Interview not found' }, 404);
    }

    const interviewDate = new Date(interview.date);
    emailDetails = {
      date: interview.date,
      time: interviewDate.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' }),
      duration: interview.duration,
      meetingLink: interview.meeting_link,
      meetingType: interview.meeting_type,
      jobTitle: interview.job_title,
      interviewer: interview.interviewer,
    };
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      weekday: 'long', year: 'numeric', month: 'long', day: 'numeric'
    });
  };

  const { date, time, duration, meetingLink, meetingType, jobTitle, interviewer } = emailDetails;

  const htmlContent = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <title>Interview Reminder</title>
</head>
<body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
  <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 30px; border-radius: 10px 10px 0 0; text-align: center;">
    <div style="font-size: 24px; font-weight: bold; margin-bottom: 10px;">🎯 RareMinds</div>
    <h1 style="margin: 0;">Interview Reminder</h1>
  </div>
  
  <div style="background: #f8f9fa; padding: 30px; border-radius: 0 0 10px 10px;">
    <p>Dear ${recipientName},</p>
    <p>This is a friendly reminder about your upcoming interview!</p>
    
    <div style="background: white; padding: 20px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #667eea;">
      <h3 style="margin-top: 0; color: #667eea;">📅 Interview Details</h3>
      ${jobTitle ? `<p><strong>Position:</strong> ${jobTitle}</p>` : ''}
      ${date ? `<p><strong>Date:</strong> ${formatDate(date)}</p>` : ''}
      ${time ? `<p><strong>Time:</strong> ${time}</p>` : ''}
      ${duration ? `<p><strong>Duration:</strong> ${duration} minutes</p>` : ''}
      ${interviewer ? `<p><strong>Interviewer:</strong> ${interviewer}</p>` : ''}
      ${meetingType ? `<p><strong>Format:</strong> ${meetingType} Meeting</p>` : ''}
    </div>
    
    ${meetingLink ? `
    <div style="text-align: center;">
      <a href="${meetingLink}" style="background: #667eea; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; display: inline-block;">🔗 Join Meeting</a>
    </div>
    ` : ''}
    
    <div style="background: #e3f2fd; padding: 15px; border-radius: 6px; margin: 20px 0;">
      <h4 style="margin-top: 0; color: #1565c0;">💡 Interview Tips:</h4>
      <ul style="margin-bottom: 0;">
        <li>Test your internet connection and camera beforehand</li>
        <li>Prepare examples that showcase your skills</li>
        <li>Have questions ready about the role</li>
        <li>Join 5 minutes early</li>
      </ul>
    </div>
    
    <p>Best regards,<br><strong>RareMinds Recruitment Team</strong></p>
  </div>
</body>
</html>`;

  if (!env.RESEND_API_KEY) {
    return jsonResponse({ error: 'Email service not configured' }, 500);
  }

  try {
    const response = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${env.RESEND_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        from: 'RareMinds <noreply@rareminds.in>',
        to: [recipientEmail],
        subject: `Interview Reminder - ${jobTitle || 'Position'} Interview`,
        html: htmlContent,
      }),
    });

    if (!response.ok) {
      const errorData = await response.text();
      return jsonResponse({ error: `Failed to send email: ${errorData}` }, 500);
    }

    const emailResult = await response.json() as { id?: string };

    // Log reminder in database
    await supabaseAdmin.from('interview_reminders').insert({
      interview_id: interviewId,
      sent_to: recipientEmail,
      reminder_type: 'interview_reminder',
      status: 'sent',
      email_id: emailResult.id || null,
    });

    // Update interview reminder count
    const { data: currentInterview } = await supabaseAdmin
      .from('interviews')
      .select('reminders_sent')
      .eq('id', interviewId)
      .maybeSingle();

    await supabaseAdmin
      .from('interviews')
      .update({
        reminders_sent: (currentInterview?.reminders_sent || 0) + 1,
        updated_at: new Date().toISOString(),
      })
      .eq('id', interviewId);

    return jsonResponse({
      success: true,
      message: 'Interview reminder sent successfully',
      emailId: emailResult.id,
    });
  } catch (error) {
    return jsonResponse({ error: (error as Error).message }, 500);
  }
}

// ==================== RESET PASSWORD ====================

async function handleResetPassword(request: Request, env: Env): Promise<Response> {
  const supabaseAdmin = createClient(env.SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY);

  const body = await request.json() as {
    action?: string;
    email?: string;
    otp?: string;
    newPassword?: string;
  };
  const { action, email, otp, newPassword } = body;

  if (action === 'send') {
    if (!email) return jsonResponse({ error: 'Email is required' }, 400);

    // Generate 6-digit OTP
    const token = Math.floor(100000 + Math.random() * 900000).toString();
    const expiresAt = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes

    // Store in DB
    const { error: dbError } = await supabaseAdmin
      .from('reset_tokens')
      .insert({ email, token, expires_at: expiresAt.toISOString() });

    if (dbError) {
      return jsonResponse({ error: 'Failed to create reset token' }, 500);
    }

    // Send email via Resend
    if (!env.RESEND_API_KEY) {
      return jsonResponse({ error: 'Email service not configured' }, 500);
    }

    const emailResponse = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${env.RESEND_API_KEY}`,
      },
      body: JSON.stringify({
        from: 'SkillPassport <onboarding@resend.dev>',
        to: [email],
        subject: 'Your Password Reset Code',
        html: `
          <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto;">
            <h2>Password Reset Request</h2>
            <p>Your verification code is:</p>
            <h1 style="color: #2563eb; letter-spacing: 5px;">${token}</h1>
            <p>This code will expire in 10 minutes.</p>
          </div>
        `,
      }),
    });

    if (!emailResponse.ok) {
      return jsonResponse({ error: 'Failed to send email' }, 500);
    }

    return jsonResponse({ success: true, message: 'OTP sent successfully' });
  }

  if (action === 'verify') {
    if (!email || !otp || !newPassword) {
      return jsonResponse({ error: 'Email, OTP, and new password are required' }, 400);
    }

    // Verify OTP
    const { data: tokens } = await supabaseAdmin
      .from('reset_tokens')
      .select('*')
      .eq('email', email)
      .eq('token', otp)
      .gt('expires_at', new Date().toISOString())
      .order('created_at', { ascending: false })
      .limit(1);

    if (!tokens || tokens.length === 0) {
      return jsonResponse({ error: 'Invalid or expired OTP' }, 400);
    }

    // Get user
    const { data: { users } } = await supabaseAdmin.auth.admin.listUsers({ page: 1, perPage: 1000 });
    const foundUser = users?.find(u => u.email?.toLowerCase() === email.toLowerCase());

    if (!foundUser) {
      return jsonResponse({ error: 'User not found' }, 404);
    }

    // Update password
    const { error: updateError } = await supabaseAdmin.auth.admin.updateUserById(
      foundUser.id,
      { password: newPassword }
    );

    if (updateError) {
      return jsonResponse({ error: 'Failed to update password' }, 500);
    }

    // Delete used token
    await supabaseAdmin.from('reset_tokens').delete().eq('email', email);

    return jsonResponse({ success: true });
  }

  return jsonResponse({ error: 'Invalid action' }, 400);
}

// ==================== MAIN HANDLER ====================

export default {
  async fetch(request: Request, env: Env): Promise<Response> {
    if (request.method === 'OPTIONS') {
      return new Response('ok', { headers: corsHeaders });
    }

    const url = new URL(request.url);
    const path = url.pathname;

    try {
      switch (path) {
        case '/create-student':
          return await handleCreateStudent(request, env);
        case '/create-teacher':
          return await handleCreateTeacher(request, env);
        case '/create-event-user':
          return await handleCreateEventUser(request, env);
        case '/send-interview-reminder':
          return await handleSendInterviewReminder(request, env);
        case '/reset-password':
          return await handleResetPassword(request, env);
        case '/health':
          return jsonResponse({
            status: 'ok',
            service: 'user-api',
            endpoints: ['/create-student', '/create-teacher', '/create-event-user', '/send-interview-reminder', '/reset-password'],
            timestamp: new Date().toISOString()
          });
        default:
          return jsonResponse({ error: 'Not found' }, 404);
      }
    } catch (error) {
      console.error('Worker error:', error);
      return jsonResponse({ error: (error as Error).message || 'Internal server error' }, 500);
    }
  },
};
