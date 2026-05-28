/**
 * Event-related handlers
 * - Create event user
 * - Send interview reminder
 */

import { createSupabaseAdminClient } from '../../../lib/supabase';
import { apiSuccess, apiError } from '../../../lib/response';
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
    return apiError(400, 'VALIDATION_ERROR', 'Missing required fields: email, firstName, role, registrationId', request);
  }

  if (!validateEmail(email)) {
    return apiError(400, 'VALIDATION_ERROR', 'Invalid email format', request);
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

    return apiSuccess({
      message: 'User already exists',
      userId: existingUser.id,
      isExisting: true,
    }, request);
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
    return apiError(400, 'VALIDATION_ERROR', createError?.message || 'Failed to create user', request);
  }

  // Map role to database format
  const dbRole = roleMapping[role] || 'learner';

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

  return apiSuccess({
    message: 'User created successfully',
    userId: newUser.user.id,
    temporaryPassword,
    isExisting: false,
    publicUserCreated: !usersError,
    registrationUpdated: !updateError,
  }, request);
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
    return apiError(400, 'VALIDATION_ERROR', 'Missing required fields: interviewId, recipientEmail, recipientName', request);
  }

  const result = await sendInterviewReminderEmail(
    env,
    recipientEmail,
    recipientName,
    interviewDetails || {}
  );

  if (!result.success) {
    return apiError(500, 'INTERNAL_ERROR', result.error, request);
  }

  // Log reminder in database
  await supabaseAdmin.from('interview_reminders').insert({
    interview_id: interviewId,
    sent_to: recipientEmail,
    reminder_type: 'interview_reminder',
    status: 'sent',
    email_id: result.emailId || null,
  });

  return apiSuccess({
    message: 'Interview reminder sent successfully',
    emailId: result.emailId,
  }, request);
}
