/**
 * Password reset handler
 * Handles OTP-based password reset flow
 */

import { createSupabaseAdminClient } from '../../../lib/supabase';
import { apiSuccess, apiError } from '../../../lib/response';
import { sendPasswordResetEmail } from '../utils/email';

/**
 * Handle password reset (send OTP, verify OTP, and reset password)
 */
export async function handleResetPassword(request: Request, env: any): Promise<Response> {
  const supabaseAdmin = createSupabaseAdminClient(env);

  const body = await request.json() as {
    action: 'send' | 'verify-otp' | 'reset-password';
    email?: string;
    otp?: string;
    newPassword?: string;
  };

  const { action, email, otp, newPassword } = body;

  // ==================== SEND OTP ====================
  if (action === 'send') {
    if (!email) {
      return apiError(400, 'VALIDATION_ERROR', 'Email is required', request);
    }

    const normalizedEmail = email.trim().toLowerCase();

    // Verify user exists in database before sending OTP
    const { data: user } = await supabaseAdmin
      .from('users')
      .select('id, email')
      .eq('email', normalizedEmail)
      .maybeSingle();

    if (!user) {
      // Check learners table as fallback
      const { data: learner } = await supabaseAdmin
        .from('learners')
        .select('id, email, user_id')
        .eq('email', normalizedEmail)
        .maybeSingle();

      if (!learner) {
        return apiError(404, 'NOT_FOUND', 'No account found with this email address', request);
      }
    }

    // Generate 6-digit OTP
    const token = Math.floor(100000 + Math.random() * 900000).toString();
    const expiresAt = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes

    // Delete any existing tokens for this email
    await supabaseAdmin
      .from('reset_tokens')
      .delete()
      .eq('email', normalizedEmail);

    // Store new token in DB
    const { error: dbError } = await supabaseAdmin
      .from('reset_tokens')
      .insert({ 
        email: normalizedEmail, 
        token, 
        expires_at: expiresAt.toISOString() 
      });

    if (dbError) {
      console.error('Failed to store reset token:', dbError);
      return apiError(500, 'INTERNAL_ERROR', 'Failed to create reset token', request);
    }

    // Send email
    const emailSent = await sendPasswordResetEmail(env, normalizedEmail, token);
    if (!emailSent) {
      return apiError(500, 'INTERNAL_ERROR', 'Failed to send email', request);
    }

    return apiSuccess({ message: 'OTP sent successfully' }, request);
  }

  // ==================== VERIFY OTP ONLY ====================
  if (action === 'verify-otp') {
    if (!email || !otp) {
      return apiError(400, 'VALIDATION_ERROR', 'Email and OTP are required', request);
    }

    const normalizedEmail = email.trim().toLowerCase();

    // Verify OTP
    const { data: tokens } = await supabaseAdmin
      .from('reset_tokens')
      .select('*')
      .eq('email', normalizedEmail)
      .eq('token', otp)
      .gt('expires_at', new Date().toISOString())
      .order('created_at', { ascending: false })
      .limit(1);

    if (!tokens || tokens.length === 0) {
      return apiError(400, 'VALIDATION_ERROR', 'Invalid or expired OTP', request);
    }

    return apiSuccess({ message: 'OTP verified successfully' }, request);
  }

  // ==================== RESET PASSWORD ====================
  if (action === 'reset-password') {
    if (!email || !otp || !newPassword) {
      return apiError(400, 'VALIDATION_ERROR', 'Email, OTP, and new password are required', request);
    }

    const normalizedEmail = email.trim().toLowerCase();

    // Validate password strength
    if (newPassword.length < 6) {
      return apiError(400, 'VALIDATION_ERROR', 'Password must be at least 6 characters long', request);
    }

    // Verify OTP again
    const { data: tokens } = await supabaseAdmin
      .from('reset_tokens')
      .select('*')
      .eq('email', normalizedEmail)
      .eq('token', otp)
      .gt('expires_at', new Date().toISOString())
      .order('created_at', { ascending: false })
      .limit(1);

    if (!tokens || tokens.length === 0) {
      return apiError(400, 'VALIDATION_ERROR', 'Invalid or expired OTP', request);
    }

    // Find user in database - users.id IS the auth user ID
    const { data: dbUser } = await supabaseAdmin
      .from('users')
      .select('id, email')
      .eq('email', normalizedEmail)
      .maybeSingle();

    let authUserId = dbUser?.id;

    // If not in users table, check learners table
    if (!authUserId) {
      const { data: learner } = await supabaseAdmin
        .from('learners')
        .select('user_id')
        .eq('email', normalizedEmail)
        .maybeSingle();

      authUserId = learner?.user_id;
    }

    if (!authUserId) {
      console.error('User not found in database for email:', normalizedEmail);
      return apiError(404, 'NOT_FOUND', 'User account not found', request);
    }

    // Update password using the auth user ID from database
    const { error: updateError } = await supabaseAdmin.auth.admin.updateUserById(authUserId, {
      password: newPassword,
    });

    if (updateError) {
      console.error('Failed to update password:', updateError);
      return apiError(500, 'INTERNAL_ERROR', 'Failed to update password', request);
    }

    // Delete used token
    await supabaseAdmin
      .from('reset_tokens')
      .delete()
      .eq('email', normalizedEmail);

    return apiSuccess({ message: 'Password updated successfully' }, request);
  }

  return apiError(400, 'VALIDATION_ERROR', 'Invalid action', request);
}
