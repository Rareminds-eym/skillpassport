/**
 * Password reset handler
 */

import { Env, ResetPasswordRequest } from '../types';
import { jsonResponse } from '../utils/helpers';
import { getSupabaseAdmin } from '../utils/supabase';
import { sendPasswordResetEmail } from '../utils/email';

/**
 * Handle password reset (send OTP and verify)
 */
export async function handleResetPassword(request: Request, env: Env): Promise<Response> {
  try {
    const supabaseAdmin = getSupabaseAdmin(env);

    const body = (await request.json()) as ResetPasswordRequest;
    const { action, email, otp, newPassword } = body;

    console.log('Password reset request:', { action, email: email ? 'provided' : 'missing' });

    if (action === 'send') {
      if (!email) {
        console.log('Missing email in send request');
        return jsonResponse({ error: 'Email is required' }, 400);
      }

      // Check if user exists before generating token
      console.log('Checking if user exists:', email);
      try {
        const { data: usersData, error: usersError } = await supabaseAdmin.auth.admin.listUsers();

        if (usersError) {
          console.error('Error checking user existence:', usersError);
          return jsonResponse({ 
            error: 'Failed to verify email', 
            details: usersError.message 
          }, 500);
        }

        const userExists = usersData?.users?.some(
          (u) => u.email?.toLowerCase() === email.toLowerCase()
        );

        if (!userExists) {
          console.log('Email not registered:', email);
          return jsonResponse({ 
            error: 'This email is not registered. Please check your email or sign up for a new account.' 
          }, 404);
        }

        console.log('User found, proceeding with reset token generation');
      } catch (error) {
        console.error('Error in user existence check:', error);
        return jsonResponse({ 
          error: 'Failed to verify email', 
          details: (error as Error).message 
        }, 500);
      }

      // Generate secure reset token (32 characters)
      const token = Array.from(crypto.getRandomValues(new Uint8Array(16)), byte => 
        byte.toString(16).padStart(2, '0')
      ).join('');
      const expiresAt = new Date(Date.now() + 30 * 60 * 1000); // 30 minutes for link-based reset

      console.log('Generated reset token for', email, 'expires at', expiresAt.toISOString());

      // Store in DB
      const { error: dbError } = await supabaseAdmin
        .from('reset_tokens')
        .insert({ email, token, expires_at: expiresAt.toISOString() });

      if (dbError) {
        console.error('Database error storing reset token:', dbError);
        return jsonResponse({ error: 'Failed to create reset token', details: dbError.message }, 500);
      }

      console.log('Reset token stored successfully');

      // Send email with reset link (don't fail the request if email sending fails)
      try {
        const emailSent = await sendPasswordResetEmail(env, email, token);
        if (!emailSent) {
          console.warn('Failed to send password reset email, but token is stored in database');
          // Return success anyway since token is stored - user can still reset password
          return jsonResponse({ 
            success: true, 
            message: 'Reset link generated successfully. Please check your email (including spam folder).',
            warning: 'Email delivery may be delayed'
          });
        }

        console.log('Password reset email sent successfully');
        return jsonResponse({ success: true, message: 'Reset link sent successfully to your email' });
      } catch (emailError) {
        console.warn('Email sending error, but token is stored:', emailError);
        // Return success anyway since token is stored - user can still reset password
        return jsonResponse({ 
          success: true, 
          message: 'Reset link generated successfully. Please check your email (including spam folder).',
          warning: 'Email delivery may be delayed'
        });
      }
    }

    if (action === 'verify') {
      if (!email || !otp || !newPassword) {
        console.log('Missing required fields in verify request');
        return jsonResponse({ error: 'Email, token, and new password are required' }, 400);
      }

      console.log('Verifying reset token for', email);

      // Verify token (now expecting a 32-character hex string instead of 6-digit OTP)
      const { data: tokens, error: tokenError } = await supabaseAdmin
        .from('reset_tokens')
        .select('*')
        .eq('email', email)
        .eq('token', otp) // 'otp' parameter now contains the reset token
        .gt('expires_at', new Date().toISOString())
        .order('created_at', { ascending: false })
        .limit(1);

      if (tokenError) {
        console.error('Database error verifying token:', tokenError);
        return jsonResponse({ error: 'Database error', details: tokenError.message }, 500);
      }

      if (!tokens || tokens.length === 0) {
        console.log('Invalid or expired reset token for', email);
        return jsonResponse({ error: 'Invalid or expired reset link' }, 400);
      }

      console.log('Reset token verified successfully');

      // Get user by email using listUsers
      let foundUser = null;
      try {
        console.log('Looking up user by email:', email);
        
        // List all users and find by email
        const { data: usersData, error: usersError } = await supabaseAdmin.auth.admin.listUsers();

        if (usersError) {
          console.error('Error fetching users:', usersError);
          return jsonResponse({ 
            error: 'Failed to lookup user', 
            details: `Database error: ${usersError.message}` 
          }, 500);
        }

        if (!usersData?.users) {
          console.error('No users data returned');
          return jsonResponse({ error: 'Failed to fetch user data' }, 500);
        }

        foundUser = usersData.users.find((u) => u.email?.toLowerCase() === email.toLowerCase());
      } catch (error) {
        console.error('Error in user lookup:', error);
        return jsonResponse({ 
          error: 'Failed to lookup user', 
          details: `Lookup error: ${(error as Error).message}` 
        }, 500);
      }

      if (!foundUser) {
        console.log('User not found for email:', email);
        return jsonResponse({ error: 'User not found' }, 404);
      }

      console.log('User found, updating password');

      // Update password
      const { error: updateError } = await supabaseAdmin.auth.admin.updateUserById(foundUser.id, {
        password: newPassword,
      });

      if (updateError) {
        console.error('Password update error:', updateError);
        return jsonResponse({ error: 'Failed to update password', details: updateError.message }, 500);
      }

      console.log('Password updated successfully');

      // Delete used token
      const { error: deleteError } = await supabaseAdmin.from('reset_tokens').delete().eq('email', email);
      if (deleteError) {
        console.warn('Failed to delete used token:', deleteError);
        // Don't fail the request for this
      }

      return jsonResponse({ success: true });
    }

    console.log('Invalid action:', action);
    if (action === 'reset-with-token') {
      if (!otp || !newPassword) {
        console.log('Missing required fields in reset-with-token request');
        return jsonResponse({ error: 'Token and new password are required' }, 400);
      }

      console.log('Resetting password with token');

      // Find token in database (don't need email for this method)
      const { data: tokens, error: tokenError } = await supabaseAdmin
        .from('reset_tokens')
        .select('*')
        .eq('token', otp)
        .gt('expires_at', new Date().toISOString())
        .order('created_at', { ascending: false })
        .limit(1);

      if (tokenError) {
        console.error('Database error verifying token:', tokenError);
        return jsonResponse({ error: 'Database error', details: tokenError.message }, 500);
      }

      if (!tokens || tokens.length === 0) {
        console.log('Invalid or expired reset token');
        return jsonResponse({ error: 'Invalid or expired reset link' }, 400);
      }

      const tokenData = tokens[0];
      const email = tokenData.email;
      console.log('Reset token verified for email:', email);

      // Get user by email using listUsers
      let foundUser = null;
      try {
        console.log('Looking up user by email for token reset:', email);
        
        // List all users and find by email
        const { data: usersData, error: usersError } = await supabaseAdmin.auth.admin.listUsers();

        if (usersError) {
          console.error('Error fetching users:', usersError);
          return jsonResponse({ 
            error: 'Failed to lookup user', 
            details: `Database error: ${usersError.message}` 
          }, 500);
        }

        if (!usersData?.users) {
          console.error('No users data returned');
          return jsonResponse({ error: 'Failed to fetch user data' }, 500);
        }

        foundUser = usersData.users.find((u) => u.email?.toLowerCase() === email.toLowerCase());
      } catch (error) {
        console.error('Error in user lookup:', error);
        return jsonResponse({ 
          error: 'Failed to lookup user', 
          details: `Lookup error: ${(error as Error).message}` 
        }, 500);
      }

      if (!foundUser) {
        console.log('User not found for email:', email);
        return jsonResponse({ error: 'User not found' }, 404);
      }

      console.log('User found, updating password');

      // Update password
      const { error: updateError } = await supabaseAdmin.auth.admin.updateUserById(foundUser.id, {
        password: newPassword,
      });

      if (updateError) {
        console.error('Password update error:', updateError);
        return jsonResponse({ error: 'Failed to update password', details: updateError.message }, 500);
      }

      console.log('Password updated successfully');

      // Delete used token
      const { error: deleteError } = await supabaseAdmin.from('reset_tokens').delete().eq('token', otp);
      if (deleteError) {
        console.warn('Failed to delete used token:', deleteError);
        // Don't fail the request for this
      }

      return jsonResponse({ success: true, email: email });
    }
  } catch (error) {
    console.error('Password reset handler error:', error);
    return jsonResponse({ 
      error: 'Internal server error', 
      details: (error as Error).message 
    }, 500);
  }
}
