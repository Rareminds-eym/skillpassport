/**
 * Password reset handler
 */

import { createSupabaseAdminClient } from '../../../../src/functions-lib/supabase';
import { jsonResponse } from '../../../../src/functions-lib/response';
import { sendPasswordResetEmail } from '../utils/email';

/**
 * Handle password reset (send OTP and verify)
 */
export async function handleResetPassword(request: Request, env: any): Promise<Response> {
  const supabaseAdmin = createSupabaseAdminClient(env);

  const body = await request.json() as {
    action: 'send' | 'verify';
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

    // Send email
    const emailSent = await sendPasswordResetEmail(env, email, token);
    if (!emailSent) {
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
    const {
      data: { users },
    } = await supabaseAdmin.auth.admin.listUsers({ page: 1, perPage: 1000 });
    const foundUser = users?.find((u: any) => u.email?.toLowerCase() === email.toLowerCase());

    if (!foundUser) {
      return jsonResponse({ error: 'User not found' }, 404);
    }

    // Update password
    const { error: updateError } = await supabaseAdmin.auth.admin.updateUserById(foundUser.id, {
      password: newPassword,
    });

    if (updateError) {
      return jsonResponse({ error: 'Failed to update password' }, 500);
    }

    // Delete used token
    await supabaseAdmin.from('reset_tokens').delete().eq('email', email);

    return jsonResponse({ success: true });
  }

  return jsonResponse({ error: 'Invalid action' }, 400);
}
