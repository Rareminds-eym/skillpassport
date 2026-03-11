/**
 * Password reset handler
 * Handles OTP-based password reset flow
 */

import { createSupabaseAdminClient } from '../../../../src/functions-lib/supabase';
import { jsonResponse } from '../../../../src/functions-lib/response';
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
      return jsonResponse({ error: 'Email is required' }, 400);
    }

    const normalizedEmail = email.trim().toLowerCase();

    // Verify user exists in database before sending OTP
    const { data: user } = await supabaseAdmin
      .from('users')
      .select('id, email')
      .eq('email', normalizedEmail)
      .maybeSingle();

    if (!user) {
      // Check students table as fallback
      const { data: student } = await supabaseAdmin
        .from('students')
        .select('id, email, user_id')
        .eq('email', normalizedEmail)
        .maybeSingle();

      if (!student) {
        return jsonResponse({ error: 'No account found with this email address' }, 404);
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
      return jsonResponse({ error: 'Failed to create reset token' }, 500);
    }

    // Send email
    const emailSent = await sendPasswordResetEmail(env, normalizedEmail, token);
    if (!emailSent) {
      return jsonResponse({ error: 'Failed to send email' }, 500);
    }

    return jsonResponse({ success: true, message: 'OTP sent successfully' });
  }

  // ==================== VERIFY OTP ONLY ====================
  if (action === 'verify-otp') {
    if (!email || !otp) {
      return jsonResponse({ error: 'Email and OTP are required' }, 400);
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
      return jsonResponse({ error: 'Invalid or expired OTP' }, 400);
    }

    return jsonResponse({ success: true, message: 'OTP verified successfully' });
  }

  // ==================== RESET PASSWORD ====================
  if (action === 'reset-password') {
    if (!email || !otp || !newPassword) {
      return jsonResponse({ error: 'Email, OTP, and new password are required' }, 400);
    }

    const normalizedEmail = email.trim().toLowerCase();

    // Validate password strength
    if (newPassword.length < 6) {
      return jsonResponse({ error: 'Password must be at least 6 characters long' }, 400);
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
      return jsonResponse({ error: 'Invalid or expired OTP' }, 400);
    }

    // Find user in database - users.id IS the auth user ID
    const { data: dbUser } = await supabaseAdmin
      .from('users')
      .select('id, email')
      .eq('email', normalizedEmail)
      .maybeSingle();

    let authUserId = dbUser?.id;

    // If not in users table, check students table
    if (!authUserId) {
      const { data: student } = await supabaseAdmin
        .from('students')
        .select('user_id')
        .eq('email', normalizedEmail)
        .maybeSingle();

      authUserId = student?.user_id;
    }

    if (!authUserId) {
      console.error('User not found in database for email:', normalizedEmail);
      return jsonResponse({ error: 'User account not found' }, 404);
    }

    // Update password using the auth user ID from database
    const { error: updateError } = await supabaseAdmin.auth.admin.updateUserById(authUserId, {
      password: newPassword,
    });

    if (updateError) {
      console.error('Failed to update password:', updateError);
      return jsonResponse({ error: 'Failed to update password' }, 500);
    }

    // Delete used token
    await supabaseAdmin
      .from('reset_tokens')
      .delete()
      .eq('email', normalizedEmail);

    return jsonResponse({ success: true, message: 'Password updated successfully' });
  }

  return jsonResponse({ error: 'Invalid action' }, 400);
}
