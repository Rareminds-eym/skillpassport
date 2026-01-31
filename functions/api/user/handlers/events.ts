/**
 * Event-related handlers
 * - Create event user
 * - Send interview reminder
 */

import { createSupabaseAdminClient } from '../../../../src/functions-lib/supabase';
import { jsonResponse } from '../../../../src/functions-lib/response';
import { generatePassword, validateEmail } from '../utils/helpers';
import { sendWelcomeEmail, sendInterviewReminderEmail } from '../utils/email';
import { roleMapping } from '../utils/constants';

/**
 * Handle creating a user after event registration
 */
export async function handleCreateEventUser(request: Request, env: any): Promise<Response> {
  const supabaseAdmin = createSupabaseAdminClient(env);

  const body = await request.json() as {
    email: string;
    firstName: string;
    lastName?: string;
    role: string;
    phone?: string;
    registrationId: string;
    metadata?: Record<string, any>;
  };

  const { email, firstName, lastName, role, phone, registrationId, metadata } = body;

  if (!email || !firstName || !role || !registrationId) {
    return jsonResponse(
      { error: 'Missing required fields: email, firstName, role, registrationId' },
      400
    );
  }

  if (!validateEmail(email)) {
    return jsonResponse({ error: 'Invalid email format' }, 400);
  }

  console.log(`Creating user for event registration: ${registrationId}, email: ${email}`);

  // Check if user already exists
  const { data: existingUsers } = await supabaseAdmin.auth.admin.listUsers();
  const existingUser = existingUsers?.users?.find((u: any) => u.email === email);

  if (existingUser) {
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
  await sendWelcomeEmail(env, email, firstName, temporaryPassword, dbRole, `<strong>Plan:</strong> ${planName}`);

  return jsonResponse({
    success: true,
    message: 'User created successfully',
    userId: newUser.user.id,
    temporaryPassword,
    isExisting: false,
    publicUserCreated: !usersError,
    registrationUpdated: !updateError,
  });
}

/**
 * Handle sending interview reminder email
 */
export async function handleSendInterviewReminder(request: Request, env: any): Promise<Response> {
  const supabaseAdmin = createSupabaseAdminClient(env);

  const body = await request.json() as {
    interviewId: string;
    recipientEmail: string;
    recipientName: string;
    interviewDetails?: Record<string, any>;
  };

  const { interviewId, recipientEmail, recipientName, interviewDetails } = body;

  if (!interviewId || !recipientEmail || !recipientName) {
    return jsonResponse(
      { error: 'Missing required fields: interviewId, recipientEmail, recipientName' },
      400
    );
  }

  const result = await sendInterviewReminderEmail(
    env,
    recipientEmail,
    recipientName,
    interviewDetails || {}
  );

  if (!result.success) {
    return jsonResponse({ error: result.error }, 500);
  }

  // Log reminder in database
  await supabaseAdmin.from('interview_reminders').insert({
    interview_id: interviewId,
    sent_to: recipientEmail,
    reminder_type: 'interview_reminder',
    status: 'sent',
    email_id: result.emailId || null,
  });

  return jsonResponse({
    success: true,
    message: 'Interview reminder sent successfully',
    emailId: result.emailId,
  });
}
