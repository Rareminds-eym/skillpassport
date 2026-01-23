/**
 * Cloudflare Worker: send-email
 * Sends emails using worker-mailer with AWS SES SMTP
 * Migrated from Supabase Edge Function
 * 
 * Supports:
 * - Generic email sending (POST /)
 * - Organization invitation emails (POST /invitation)
 * - Automated countdown emails for pre-registrations (Scheduled CRON)
 */

import { WorkerMailer } from 'worker-mailer';
import { createClient } from '@supabase/supabase-js';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
};

const APP_URL = 'https://skillpassport.rareminds.in';

// ============================================================================
// Email Templates
// ============================================================================

/**
 * Generate countdown email HTML for pre-registrations
 */
function generateCountdownEmailHtml(data) {
  const { fullName, countdownDay, launchDate } = data;
  
  const launchDateFormatted = new Date(launchDate).toLocaleDateString('en-US', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  });

  const emoji = countdownDay === 1 ? '🚀' : countdownDay <= 3 ? '⏰' : '📅';
  const urgencyColor = countdownDay === 1 ? '#DC2626' : countdownDay <= 3 ? '#F59E0B' : '#6366F1';

  return `
<!DOCTYPE html>
<html>
<head><meta charset="utf-8"><title>Countdown to Launch</title></head>
<body style="margin: 0; padding: 0; font-family: 'Segoe UI', sans-serif; background-color: #f4f7fa;">
  <table style="width: 100%; border-collapse: collapse;">
    <tr>
      <td align="center" style="padding: 40px 0;">
        <table style="width: 600px; max-width: 100%; background-color: #ffffff; border-radius: 12px; box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);">
          <tr>
            <td style="padding: 40px; text-align: center; background: linear-gradient(135deg, ${urgencyColor} 0%, ${urgencyColor}dd 100%); border-radius: 12px 12px 0 0;">
              <div style="width: 80px; height: 80px; background: white; border-radius: 50%; margin: 0 auto 16px; display: flex; align-items: center; justify-content: center;">
                <span style="font-size: 48px;">${emoji}</span>
              </div>
              <h1 style="margin: 0; color: #ffffff; font-size: 32px; font-weight: 700;">${countdownDay} ${countdownDay === 1 ? 'Day' : 'Days'} to Go!</h1>
            </td>
          </tr>
          <tr>
            <td style="padding: 40px;">
              <p style="color: #374151; font-size: 18px; margin-bottom: 24px;">Hello ${fullName},</p>
              <p style="color: #374151; font-size: 16px; line-height: 1.6; margin-bottom: 24px;">
                ${countdownDay === 1 
                  ? '🎉 <strong>Tomorrow is the big day!</strong> Your journey with Skill Passport begins in just 24 hours.' 
                  : `We're getting closer! Only <strong>${countdownDay} days</strong> until Skill Passport launches and transforms your career journey.`}
              </p>
              
              <div style="background: linear-gradient(135deg, #EFF6FF 0%, #DBEAFE 100%); border-radius: 12px; padding: 32px; margin: 32px 0; text-align: center;">
                <div style="font-size: 64px; font-weight: 700; color: ${urgencyColor}; margin-bottom: 8px;">${countdownDay}</div>
                <div style="font-size: 18px; color: #1F2937; font-weight: 600;">DAY${countdownDay === 1 ? '' : 'S'} REMAINING</div>
                <div style="margin-top: 16px; padding-top: 16px; border-top: 2px solid #BFDBFE;">
                  <div style="font-size: 14px; color: #6B7280; margin-bottom: 4px;">Launch Date</div>
                  <div style="font-size: 16px; color: #1F2937; font-weight: 600;">${launchDateFormatted}</div>
                </div>
              </div>
              
              <div style="background-color: #F9FAFB; border-radius: 8px; padding: 24px; margin: 24px 0;">
                <h3 style="margin: 0 0 16px; color: #1F2937; font-size: 18px;">✨ What's Coming</h3>
                <ul style="margin: 0; padding-left: 20px; color: #4B5563; line-height: 1.8;">
                  <li>AI-powered career guidance tailored to your goals</li>
                  <li>Comprehensive skill assessment and tracking</li>
                  <li>Personalized learning pathways</li>
                  <li>Direct connections with top employers</li>
                  <li>Real-time progress monitoring</li>
                </ul>
              </div>
              
              ${countdownDay === 1 ? `
              <div style="background-color: #FEF3C7; border-left: 4px solid #F59E0B; padding: 16px; margin: 24px 0;">
                <p style="margin: 0; color: #92400E; font-size: 14px;">
                  <strong>⚡ Final Reminder:</strong> Make sure you've completed your payment to secure your spot. Don't miss out on this opportunity!
                </p>
              </div>
              ` : ''}
              
              <div style="text-align: center; margin: 32px 0;">
                <a href="${APP_URL}/pre-registration" style="display: inline-block; background: linear-gradient(135deg, ${urgencyColor} 0%, ${urgencyColor}dd 100%); color: #ffffff; text-decoration: none; padding: 14px 32px; border-radius: 8px; font-size: 16px; font-weight: 600;">Complete Your Registration →</a>
              </div>
              
              <p style="color: #6B7280; font-size: 14px; margin-top: 32px; text-align: center;">
                Get ready to unlock your full potential! 🚀
              </p>
            </td>
          </tr>
          <tr>
            <td style="padding: 24px 40px; background-color: #F9FAFB; border-radius: 0 0 12px 12px; text-align: center;">
              <p style="margin: 0; color: #9CA3AF; font-size: 12px;">© ${new Date().getFullYear()} Skill Passport by Rareminds. All rights reserved.</p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;
}

/**
 * Generate organization invitation email HTML
 */
function generateInvitationEmailHtml(data) {
  const { organizationName, memberType, invitationToken, expiresAt, customMessage } = data;
  
  const invitationLink = `${APP_URL}/accept-invitation?token=${invitationToken}`;
  const memberTypeDisplay = memberType === 'educator' ? 'Educator' : 'Student';
  const expiresDate = new Date(expiresAt).toLocaleDateString('en-US', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  });

  return `
<!DOCTYPE html>
<html>
<head><meta charset="utf-8"><title>Organization Invitation</title></head>
<body style="margin: 0; padding: 0; font-family: 'Segoe UI', sans-serif; background-color: #f4f7fa;">
  <table style="width: 100%; border-collapse: collapse;">
    <tr>
      <td align="center" style="padding: 40px 0;">
        <table style="width: 600px; max-width: 100%; background-color: #ffffff; border-radius: 12px; box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);">
          <tr>
            <td style="padding: 40px; text-align: center; background: linear-gradient(135deg, #6366F1 0%, #4F46E5 100%); border-radius: 12px 12px 0 0;">
              <div style="width: 60px; height: 60px; background: white; border-radius: 50%; margin: 0 auto 16px; display: flex; align-items: center; justify-content: center;">
                <span style="font-size: 32px;">✉️</span>
              </div>
              <h1 style="margin: 0; color: #ffffff; font-size: 28px;">You're Invited!</h1>
            </td>
          </tr>
          <tr>
            <td style="padding: 40px;">
              <p style="color: #374151; font-size: 16px; margin-bottom: 24px;">Hello,</p>
              <p style="color: #374151; font-size: 16px; margin-bottom: 24px;">
                You have been invited to join <strong>${organizationName}</strong> as a <strong>${memberTypeDisplay}</strong> on Skill Passport.
              </p>
              
              ${customMessage ? `
              <div style="background-color: #F3F4F6; border-radius: 8px; padding: 20px; margin: 24px 0; border-left: 4px solid #6366F1;">
                <p style="margin: 0; color: #4B5563; font-style: italic;">"${customMessage}"</p>
              </div>
              ` : ''}
              
              <div style="background-color: #EFF6FF; border-radius: 8px; padding: 24px; margin: 24px 0;">
                <h3 style="margin: 0 0 16px; color: #1F2937; font-size: 18px;">📋 Invitation Details</h3>
                <table style="width: 100%; border-collapse: collapse;">
                  <tr>
                    <td style="padding: 8px 0; color: #6B7280;">Organization</td>
                    <td style="padding: 8px 0; color: #1F2937; font-weight: 600; text-align: right;">${organizationName}</td>
                  </tr>
                  <tr>
                    <td style="padding: 8px 0; color: #6B7280;">Role</td>
                    <td style="padding: 8px 0; color: #6366F1; font-weight: 600; text-align: right;">${memberTypeDisplay}</td>
                  </tr>
                  <tr>
                    <td style="padding: 8px 0; color: #6B7280;">Expires</td>
                    <td style="padding: 8px 0; color: #1F2937; text-align: right;">${expiresDate}</td>
                  </tr>
                </table>
              </div>
              
              <div style="text-align: center; margin: 32px 0;">
                <a href="${invitationLink}" style="display: inline-block; background: linear-gradient(135deg, #6366F1 0%, #4F46E5 100%); color: #ffffff; text-decoration: none; padding: 14px 32px; border-radius: 8px; font-size: 16px; font-weight: 600;">Accept Invitation →</a>
              </div>
              
              <div style="background-color: #FEF3C7; border-left: 4px solid #F59E0B; padding: 16px; margin: 24px 0;">
                <p style="margin: 0; color: #92400E; font-size: 14px;">⏰ This invitation will expire on ${expiresDate}. Please accept it before then.</p>
              </div>
              
              <p style="color: #6B7280; font-size: 14px; margin-top: 24px;">
                If you didn't expect this invitation, you can safely ignore this email.
              </p>
            </td>
          </tr>
          <tr>
            <td style="padding: 24px 40px; background-color: #F9FAFB; border-radius: 0 0 12px 12px; text-align: center;">
              <p style="margin: 0; color: #9CA3AF; font-size: 12px;">© ${new Date().getFullYear()} Skill Passport by Rareminds. All rights reserved.</p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;
}

// ============================================================================
// Main Worker
// ============================================================================

export default {
  async fetch(request, env) {
    // Handle CORS preflight
    if (request.method === 'OPTIONS') {
      return new Response('ok', { headers: corsHeaders });
    }

    const url = new URL(request.url);

    // Health check endpoint
    if (url.pathname === '/health') {
      return Response.json(
        { status: 'ok', service: 'email-api' },
        { headers: corsHeaders }
      );
    }

    // Only allow POST for sending emails
    if (request.method !== 'POST') {
      return Response.json(
        { error: 'Method not allowed. Use POST to send emails.' },
        { status: 405, headers: corsHeaders }
      );
    }

    try {
      // Parse request body
      const body = await request.json();
      
      // Route to appropriate handler based on path
      if (url.pathname === '/invitation') {
        return await handleInvitationEmail(body, env);
      }
      
      if (url.pathname === '/countdown') {
        return await handleCountdownEmail(body, env);
      }
      
      if (url.pathname === '/send-bulk-countdown') {
        return await handleBulkCountdownEmail(body, env);
      }
      
      // Default: generic email sending
      const { to, subject, html, text, from, fromName } = body;

      if (!to || !subject || !html) {
        return Response.json(
          { error: 'Missing required fields: to, subject, html' },
          { status: 400, headers: corsHeaders }
        );
      }

      // Get SMTP configuration from environment
      const smtpHost = env.SMTP_HOST;
      const smtpPort = parseInt(env.SMTP_PORT || '587');
      const smtpUser = env.SMTP_USER;
      const smtpPass = env.SMTP_PASS;
      const defaultFromEmail = env.FROM_EMAIL || 'noreply@rareminds.in';
      const defaultFromName = env.FROM_NAME || 'Skill Passport';

      if (!smtpHost || !smtpUser || !smtpPass) {
        console.error('SMTP configuration missing');
        return Response.json(
          { error: 'SMTP not configured. Please set SMTP_HOST, SMTP_USER, SMTP_PASS secrets.' },
          { status: 500, headers: corsHeaders }
        );
      }

      // Prepare recipients and sender
      const recipients = Array.isArray(to) ? to : [to];
      const senderEmail = from || defaultFromEmail;
      const senderName = fromName || defaultFromName;

      console.log(`Connecting to SMTP: ${smtpHost}:${smtpPort}`);
      console.log(`Sending email to: ${recipients.join(', ')}`);
      console.log(`From: ${senderName} <${senderEmail}>`);

      // Send email using worker-mailer
      await WorkerMailer.send(
        {
          host: smtpHost,
          port: smtpPort,
          secure: false,
          startTls: true,
          authType: 'plain',
          credentials: {
            username: smtpUser,
            password: smtpPass,
          },
        },
        {
          from: { name: senderName, email: senderEmail },
          to: recipients,
          subject: subject,
          text: text || 'Please view this email in an HTML-capable email client.',
          html: html,
        }
      );

      console.log('Email sent successfully');

      return Response.json(
        {
          success: true,
          message: 'Email sent successfully',
          recipients: recipients,
        },
        { status: 200, headers: corsHeaders }
      );

    } catch (error) {
      console.error('Error sending email:', error);
      return Response.json(
        {
          error: 'Failed to send email',
          details: error.message,
        },
        { status: 500, headers: corsHeaders }
      );
    }
  },

  // ============================================================================
  // Scheduled CRON Handler for Automated Countdown Emails
  // ============================================================================
  async scheduled(event, env, ctx) {
    console.log('Starting scheduled countdown email job...');
    
    try {
      // Process new countdown emails
      await processCountdownEmails(env);
      
      // Retry failed emails
      await retryFailedEmails(env);
      
      console.log('Countdown email job completed successfully');
    } catch (error) {
      console.error('Error in scheduled countdown email job:', error);
    }
  },
};

// ============================================================================
// Invitation Email Handler
// ============================================================================

/**
 * Handle organization invitation email
 * POST /invitation
 */
async function handleInvitationEmail(body, env) {
  const { 
    to, 
    organizationName, 
    memberType, 
    invitationToken, 
    expiresAt, 
    customMessage 
  } = body;

  // Validate required fields
  if (!to || !organizationName || !memberType || !invitationToken || !expiresAt) {
    return Response.json(
      { error: 'Missing required fields: to, organizationName, memberType, invitationToken, expiresAt' },
      { status: 400, headers: corsHeaders }
    );
  }

  // Generate email HTML from template
  const html = generateInvitationEmailHtml({
    organizationName,
    memberType,
    invitationToken,
    expiresAt,
    customMessage
  });

  const subject = `You're invited to join ${organizationName} on Skill Passport`;

  // Send email
  return await sendEmail(env, to, subject, html, 'noreply@rareminds.in', 'Skill Passport');
}

// ============================================================================
// Email Sending Helper
// ============================================================================

/**
 * Send email using worker-mailer
 */
async function sendEmail(env, to, subject, html, from, fromName) {
  try {
    // Get SMTP configuration from environment
    const smtpHost = env.SMTP_HOST;
    const smtpPort = parseInt(env.SMTP_PORT || '587');
    const smtpUser = env.SMTP_USER;
    const smtpPass = env.SMTP_PASS;
    const defaultFromEmail = env.FROM_EMAIL || 'noreply@rareminds.in';
    const defaultFromName = env.FROM_NAME || 'Skill Passport';

    if (!smtpHost || !smtpUser || !smtpPass) {
      console.error('SMTP configuration missing');
      return Response.json(
        { error: 'SMTP not configured. Please set SMTP_HOST, SMTP_USER, SMTP_PASS secrets.' },
        { status: 500, headers: corsHeaders }
      );
    }

    // Prepare recipients and sender
    const recipients = Array.isArray(to) ? to : [to];
    const senderEmail = from || defaultFromEmail;
    const senderName = fromName || defaultFromName;

    console.log(`Connecting to SMTP: ${smtpHost}:${smtpPort}`);
    console.log(`Sending email to: ${recipients.join(', ')}`);
    console.log(`From: ${senderName} <${senderEmail}>`);

    // Send email using worker-mailer
    await WorkerMailer.send(
      {
        host: smtpHost,
        port: smtpPort,
        secure: false,
        startTls: true,
        authType: 'plain',
        credentials: {
          username: smtpUser,
          password: smtpPass,
        },
      },
      {
        from: { name: senderName, email: senderEmail },
        to: recipients,
        subject: subject,
        text: 'Please view this email in an HTML-capable email client.',
        html: html,
      }
    );

    console.log('Email sent successfully');

    return Response.json(
      {
        success: true,
        message: 'Email sent successfully',
        recipients: recipients,
      },
      { status: 200, headers: corsHeaders }
    );
  } catch (error) {
    console.error('Error sending email:', error);
    return Response.json(
      {
        error: 'Failed to send email',
        details: error.message,
      },
      { status: 500, headers: corsHeaders }
    );
  }
}

// ============================================================================
// Countdown Email Handler
// ============================================================================

/**
 * Handle countdown email for pre-registrations
 * POST /countdown
 */
async function handleCountdownEmail(body, env) {
  const { to, fullName, countdownDay, launchDate } = body;

  // Validate required fields
  if (!to || !fullName || !countdownDay || !launchDate) {
    return Response.json(
      { error: 'Missing required fields: to, fullName, countdownDay, launchDate' },
      { status: 400, headers: corsHeaders }
    );
  }

  try {
    // Initialize Supabase client
    const supabaseUrl = env.VITE_SUPABASE_URL;
    const supabaseKey = env.SUPABASE_SERVICE_ROLE_KEY;

    if (!supabaseUrl || !supabaseKey) {
      console.warn('Supabase not configured - email will be sent without tracking');
    }

    let trackingId = null;
    let preRegId = null;

    // If Supabase is configured, create tracking record
    if (supabaseUrl && supabaseKey) {
      const supabase = createClient(supabaseUrl, supabaseKey);

      // Find pre-registration by email
      const { data: preReg, error: findError } = await supabase
        .from('pre_registrations')
        .select('id')
        .eq('email', to)
        .single();

      if (preReg) {
        preRegId = preReg.id;

        // Create tracking record
        const { data: tracking, error: insertError } = await supabase
          .from('pre_registration_email_tracking')
          .insert({
            pre_registration_id: preRegId,
            email_status: 'queued',
            scheduled_at: new Date().toISOString(),
            metadata: {
              countdown_day: countdownDay,
              launch_date: launchDate,
              source: 'manual_api'
            }
          })
          .select()
          .single();

        if (tracking) {
          trackingId = tracking.id;
          
          // Update to sending
          await supabase
            .from('pre_registration_email_tracking')
            .update({ email_status: 'sending' })
            .eq('id', trackingId);
        }
      }
    }

    // Generate email HTML from template
    const html = generateCountdownEmailHtml({
      fullName,
      countdownDay,
      launchDate
    });

    const subject = `${countdownDay} ${countdownDay === 1 ? 'Day' : 'Days'} Until Skill Passport Launch! 🚀`;

    // Send email
    const result = await sendEmail(env, to, subject, html, 'noreply@rareminds.in', 'Skill Passport');

    // Update tracking status to sent
    if (trackingId && supabaseUrl && supabaseKey) {
      const supabase = createClient(supabaseUrl, supabaseKey);
      await supabase
        .from('pre_registration_email_tracking')
        .update({
          email_status: 'sent',
          sent_at: new Date().toISOString()
        })
        .eq('id', trackingId);
    }

    return result;

  } catch (error) {
    console.error('Error in handleCountdownEmail:', error);

    // Update tracking status to failed if we have tracking ID
    if (trackingId && env.VITE_SUPABASE_URL && env.SUPABASE_SERVICE_ROLE_KEY) {
      const supabase = createClient(env.VITE_SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY);
      await supabase
        .from('pre_registration_email_tracking')
        .update({
          email_status: 'failed',
          failed_at: new Date().toISOString(),
          error_message: error.message,
          retry_count: 1
        })
        .eq('id', trackingId);
    }

    return Response.json(
      { error: 'Failed to send countdown email', details: error.message },
      { status: 500, headers: corsHeaders }
    );
  }
}

// ============================================================================
// Automated Countdown Email Processing
// ============================================================================

/**
 * Process and send countdown emails for pre-registrations
 * Called by scheduled CRON job
 */
async function processCountdownEmails(env) {
  // Initialize Supabase client
  const supabaseUrl = env.VITE_SUPABASE_URL;
  const supabaseKey = env.SUPABASE_SERVICE_ROLE_KEY;

  if (!supabaseUrl || !supabaseKey) {
    console.error('Supabase configuration missing');
    return;
  }

  const supabase = createClient(supabaseUrl, supabaseKey);

  // Get launch date from environment (format: YYYY-MM-DD)
  const launchDate = env.LAUNCH_DATE || '2026-02-01';
  const launchDateTime = new Date(launchDate);
  const now = new Date();

  // Calculate days until launch
  const daysUntilLaunch = Math.ceil((launchDateTime - now) / (1000 * 60 * 60 * 24));

  console.log(`Days until launch: ${daysUntilLaunch}`);

  // Only send emails on specific countdown days: 7, 5, 3, 1
  const countdownDays = [7, 5, 3, 1];
  if (!countdownDays.includes(daysUntilLaunch)) {
    console.log(`Not a countdown day. Skipping email send.`);
    return;
  }

  console.log(`Countdown day ${daysUntilLaunch} - Processing emails...`);

  // Get all pre-registrations
  const { data: preRegistrations, error: fetchError } = await supabase
    .from('pre_registrations')
    .select('id, full_name, email, payment_status, created_at');

  if (fetchError) {
    console.error('Error fetching pre-registrations:', fetchError);
    return;
  }

  console.log(`Found ${preRegistrations?.length || 0} pre-registrations`);

  // Process each pre-registration
  for (const preReg of preRegistrations || []) {
    try {
      // Check if email already sent for this countdown day
      const { data: existingEmail, error: checkError } = await supabase
        .from('pre_registration_email_tracking')
        .select('id')
        .eq('pre_registration_id', preReg.id)
        .eq('metadata->>countdown_day', daysUntilLaunch.toString())
        .single();

      if (existingEmail) {
        console.log(`Email already sent to ${preReg.email} for countdown day ${daysUntilLaunch}`);
        continue;
      }

      // Create email tracking record
      const scheduledAt = new Date();
      const { data: trackingRecord, error: insertError } = await supabase
        .from('pre_registration_email_tracking')
        .insert({
          pre_registration_id: preReg.id,
          email_status: 'queued',
          scheduled_at: scheduledAt.toISOString(),
          metadata: {
            countdown_day: daysUntilLaunch,
            launch_date: launchDate,
            payment_status: preReg.payment_status,
            campaign: 'countdown'
          }
        })
        .select()
        .single();

      if (insertError) {
        console.error(`Error creating tracking record for ${preReg.email}:`, insertError);
        continue;
      }

      console.log(`Sending countdown email to ${preReg.email}...`);

      // Generate and send email
      const html = generateCountdownEmailHtml({
        fullName: preReg.full_name,
        countdownDay: daysUntilLaunch,
        launchDate: launchDate
      });

      const subject = `${daysUntilLaunch} ${daysUntilLaunch === 1 ? 'Day' : 'Days'} Until Skill Passport Launch! 🚀`;

      // Update status to sending
      await supabase
        .from('pre_registration_email_tracking')
        .update({ email_status: 'sending' })
        .eq('id', trackingRecord.id);

      // Send email
      const smtpHost = env.SMTP_HOST;
      const smtpPort = parseInt(env.SMTP_PORT || '587');
      const smtpUser = env.SMTP_USER;
      const smtpPass = env.SMTP_PASS;

      await WorkerMailer.send(
        {
          host: smtpHost,
          port: smtpPort,
          secure: false,
          startTls: true,
          authType: 'plain',
          credentials: {
            username: smtpUser,
            password: smtpPass,
          },
        },
        {
          from: { name: 'Skill Passport', email: 'noreply@rareminds.in' },
          to: [preReg.email],
          subject: subject,
          text: `${daysUntilLaunch} days until Skill Passport launches!`,
          html: html,
        }
      );

      // Update status to sent
      await supabase
        .from('pre_registration_email_tracking')
        .update({
          email_status: 'sent',
          sent_at: new Date().toISOString()
        })
        .eq('id', trackingRecord.id);

      console.log(`✓ Email sent successfully to ${preReg.email}`);

    } catch (error) {
      console.error(`Error sending email to ${preReg.email}:`, error);

      // Update status to failed
      if (trackingRecord?.id) {
        await supabase
          .from('pre_registration_email_tracking')
          .update({
            email_status: 'failed',
            failed_at: new Date().toISOString(),
            error_message: error.message,
            retry_count: supabase.raw('retry_count + 1')
          })
          .eq('id', trackingRecord.id);
      }
    }
  }

  console.log('Countdown email processing completed');
}

// ============================================================================
// Retry Failed Emails
// ============================================================================

/**
 * Retry sending failed emails with exponential backoff
 * Called by scheduled CRON job after processing new emails
 */
async function retryFailedEmails(env) {
  console.log('Starting failed email retry process...');

  // Initialize Supabase client
  const supabaseUrl = env.VITE_SUPABASE_URL;
  const supabaseKey = env.SUPABASE_SERVICE_ROLE_KEY;

  if (!supabaseUrl || !supabaseKey) {
    console.error('Supabase configuration missing');
    return;
  }

  const supabase = createClient(supabaseUrl, supabaseKey);

  // Get max retry attempts from environment (default: 3)
  const maxRetries = parseInt(env.MAX_EMAIL_RETRIES || '3');

  // Get failed emails that haven't exceeded retry limit
  const { data: failedEmails, error: fetchError } = await supabase
    .from('pre_registration_email_tracking')
    .select(`
      id,
      pre_registration_id,
      email_status,
      retry_count,
      error_message,
      failed_at,
      metadata,
      pre_registrations (
        id,
        full_name,
        email
      )
    `)
    .eq('email_status', 'failed')
    .lt('retry_count', maxRetries)
    .order('failed_at', { ascending: true })
    .limit(10); // Process max 10 retries per run to avoid overload

  if (fetchError) {
    console.error('Error fetching failed emails:', fetchError);
    return;
  }

  if (!failedEmails || failedEmails.length === 0) {
    console.log('No failed emails to retry');
    return;
  }

  console.log(`Found ${failedEmails.length} failed emails to retry`);

  // Process each failed email
  for (const emailRecord of failedEmails) {
    try {
      const preReg = emailRecord.pre_registrations;
      const countdownDay = parseInt(emailRecord.metadata?.countdown_day || 0);
      const launchDate = emailRecord.metadata?.launch_date || env.LAUNCH_DATE;

      // Calculate exponential backoff delay
      // Wait time: 1 hour * (2 ^ retry_count)
      // Retry 0: 1 hour, Retry 1: 2 hours, Retry 2: 4 hours
      const backoffHours = Math.pow(2, emailRecord.retry_count);
      const failedAt = new Date(emailRecord.failed_at);
      const now = new Date();
      const hoursSinceFailure = (now - failedAt) / (1000 * 60 * 60);

      if (hoursSinceFailure < backoffHours) {
        console.log(`Skipping ${preReg.email} - backoff period not elapsed (${hoursSinceFailure.toFixed(1)}h / ${backoffHours}h)`);
        continue;
      }

      console.log(`Retrying email to ${preReg.email} (attempt ${emailRecord.retry_count + 1}/${maxRetries})...`);

      // Update status to sending
      await supabase
        .from('pre_registration_email_tracking')
        .update({ 
          email_status: 'sending',
          error_message: null // Clear previous error
        })
        .eq('id', emailRecord.id);

      // Generate and send email
      const html = generateCountdownEmailHtml({
        fullName: preReg.full_name,
        countdownDay: countdownDay,
        launchDate: launchDate
      });

      const subject = `${countdownDay} ${countdownDay === 1 ? 'Day' : 'Days'} Until Skill Passport Launch! 🚀`;

      // Send email
      const smtpHost = env.SMTP_HOST;
      const smtpPort = parseInt(env.SMTP_PORT || '587');
      const smtpUser = env.SMTP_USER;
      const smtpPass = env.SMTP_PASS;

      await WorkerMailer.send(
        {
          host: smtpHost,
          port: smtpPort,
          secure: false,
          startTls: true,
          authType: 'plain',
          credentials: {
            username: smtpUser,
            password: smtpPass,
          },
        },
        {
          from: { name: 'Skill Passport', email: 'noreply@rareminds.in' },
          to: [preReg.email],
          subject: subject,
          text: `${countdownDay} days until Skill Passport launches!`,
          html: html,
        }
      );

      // Update status to sent
      await supabase
        .from('pre_registration_email_tracking')
        .update({
          email_status: 'sent',
          sent_at: new Date().toISOString(),
          error_message: null
        })
        .eq('id', emailRecord.id);

      console.log(`✓ Retry successful for ${preReg.email}`);

    } catch (error) {
      console.error(`Retry failed for ${emailRecord.pre_registrations?.email}:`, error);

      // Increment retry count and update error
      const newRetryCount = emailRecord.retry_count + 1;
      const updateData = {
        email_status: 'failed',
        failed_at: new Date().toISOString(),
        error_message: `[Retry ${newRetryCount}] ${error.message}`,
        retry_count: newRetryCount
      };

      // If max retries reached, mark as permanently failed
      if (newRetryCount >= maxRetries) {
        updateData.email_status = 'rejected';
        updateData.error_message = `[Max retries reached] ${error.message}`;
        console.error(`✗ Max retries reached for ${emailRecord.pre_registrations?.email} - marking as rejected`);
      }

      await supabase
        .from('pre_registration_email_tracking')
        .update(updateData)
        .eq('id', emailRecord.id);
    }
  }

  console.log('Failed email retry process completed');
}

// ============================================================================
// Helper: Send Email with Error Classification
// ============================================================================

/**
 * Send email and classify errors for better handling
 */
async function sendEmailWithRetry(env, to, subject, html) {
  const smtpHost = env.SMTP_HOST;
  const smtpPort = parseInt(env.SMTP_PORT || '587');
  const smtpUser = env.SMTP_USER;
  const smtpPass = env.SMTP_PASS;

  try {
    await WorkerMailer.send(
      {
        host: smtpHost,
        port: smtpPort,
        secure: false,
        startTls: true,
        authType: 'plain',
        credentials: {
          username: smtpUser,
          password: smtpPass,
        },
      },
      {
        from: { name: 'Skill Passport', email: 'noreply@rareminds.in' },
        to: Array.isArray(to) ? to : [to],
        subject: subject,
        text: 'Please view this email in an HTML-capable email client.',
        html: html,
      }
    );

    return { success: true };
  } catch (error) {
    // Classify error type for better handling
    const errorType = classifyEmailError(error);
    
    return {
      success: false,
      error: error.message,
      errorType: errorType,
      shouldRetry: errorType !== 'permanent'
    };
  }
}

/**
 * Classify email errors into temporary vs permanent failures
 */
function classifyEmailError(error) {
  const errorMessage = error.message?.toLowerCase() || '';

  // Permanent failures (don't retry)
  if (
    errorMessage.includes('invalid email') ||
    errorMessage.includes('mailbox not found') ||
    errorMessage.includes('user unknown') ||
    errorMessage.includes('address rejected') ||
    errorMessage.includes('does not exist')
  ) {
    return 'permanent';
  }

  // Temporary failures (retry)
  if (
    errorMessage.includes('timeout') ||
    errorMessage.includes('connection') ||
    errorMessage.includes('network') ||
    errorMessage.includes('temporarily') ||
    errorMessage.includes('rate limit') ||
    errorMessage.includes('quota')
  ) {
    return 'temporary';
  }

  // Unknown errors (retry with caution)
  return 'unknown';
}


// ============================================================================
// Bulk Countdown Email Handler
// ============================================================================

/**
 * Send countdown emails to all pre-registrations
 * Skips users who already received email today for this countdown day
 * POST /send-bulk-countdown
 */
async function handleBulkCountdownEmail(body, env) {
  const { countdownDay, launchDate } = body;

  // Validate required fields
  if (!countdownDay || !launchDate) {
    return Response.json(
      { error: 'Missing required fields: countdownDay, launchDate' },
      { status: 400, headers: corsHeaders }
    );
  }

  try {
    // Initialize Supabase client
    const supabaseUrl = env.VITE_SUPABASE_URL;
    const supabaseKey = env.SUPABASE_SERVICE_ROLE_KEY;

    if (!supabaseUrl || !supabaseKey) {
      return Response.json(
        { error: 'Supabase not configured' },
        { status: 500, headers: corsHeaders }
      );
    }

    const supabase = createClient(supabaseUrl, supabaseKey);

    // Get all pre-registrations
    const { data: preRegistrations, error: fetchError } = await supabase
      .from('pre_registrations')
      .select('id, full_name, email, payment_status, created_at');

    if (fetchError) {
      console.error('Error fetching pre-registrations:', fetchError);
      return Response.json(
        { error: 'Failed to fetch pre-registrations', details: fetchError.message },
        { status: 500, headers: corsHeaders }
      );
    }

    if (!preRegistrations || preRegistrations.length === 0) {
      return Response.json(
        { success: true, message: 'No pre-registrations found', sent: 0, skipped: 0, failed: 0 },
        { headers: corsHeaders }
      );
    }

    console.log(`Found ${preRegistrations.length} pre-registrations`);

    const results = {
      total: preRegistrations.length,
      sent: 0,
      skipped: 0,
      failed: 0,
      details: []
    };

    // Get today's date (start of day)
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    // Process each pre-registration
    for (const preReg of preRegistrations) {
      try {
        // Check if email already sent today for this countdown day
        const { data: existingEmail, error: checkError } = await supabase
          .from('pre_registration_email_tracking')
          .select('id, sent_at')
          .eq('pre_registration_id', preReg.id)
          .eq('metadata->>countdown_day', countdownDay.toString())
          .gte('created_at', today.toISOString())
          .maybeSingle();

        if (existingEmail) {
          console.log(`Skipping ${preReg.email} - already sent today`);
          results.skipped++;
          results.details.push({
            email: preReg.email,
            status: 'skipped',
            reason: 'Already sent today'
          });
          continue;
        }

        // Create tracking record
        const { data: trackingRecord, error: insertError } = await supabase
          .from('pre_registration_email_tracking')
          .insert({
            pre_registration_id: preReg.id,
            email_status: 'queued',
            scheduled_at: new Date().toISOString(),
            metadata: {
              countdown_day: countdownDay,
              launch_date: launchDate,
              payment_status: preReg.payment_status,
              source: 'bulk_api'
            }
          })
          .select()
          .single();

        if (insertError) {
          console.error(`Error creating tracking record for ${preReg.email}:`, insertError);
          results.failed++;
          results.details.push({
            email: preReg.email,
            status: 'failed',
            reason: 'Failed to create tracking record'
          });
          continue;
        }

        // Update to sending
        await supabase
          .from('pre_registration_email_tracking')
          .update({ email_status: 'sending' })
          .eq('id', trackingRecord.id);

        // Generate and send email
        const html = generateCountdownEmailHtml({
          fullName: preReg.full_name,
          countdownDay: countdownDay,
          launchDate: launchDate
        });

        const subject = `${countdownDay} ${countdownDay === 1 ? 'Day' : 'Days'} Until Skill Passport Launch! 🚀`;

        // Send email
        const smtpHost = env.SMTP_HOST;
        const smtpPort = parseInt(env.SMTP_PORT || '587');
        const smtpUser = env.SMTP_USER;
        const smtpPass = env.SMTP_PASS;

        await WorkerMailer.send(
          {
            host: smtpHost,
            port: smtpPort,
            secure: false,
            startTls: true,
            authType: 'plain',
            credentials: {
              username: smtpUser,
              password: smtpPass,
            },
          },
          {
            from: { name: 'Skill Passport', email: 'noreply@rareminds.in' },
            to: [preReg.email],
            subject: subject,
            text: `${countdownDay} days until Skill Passport launches!`,
            html: html,
          }
        );

        // Update status to sent
        await supabase
          .from('pre_registration_email_tracking')
          .update({
            email_status: 'sent',
            sent_at: new Date().toISOString()
          })
          .eq('id', trackingRecord.id);

        console.log(`✓ Email sent to ${preReg.email}`);
        results.sent++;
        results.details.push({
          email: preReg.email,
          status: 'sent',
          tracking_id: trackingRecord.id
        });

      } catch (error) {
        console.error(`Error sending email to ${preReg.email}:`, error);
        results.failed++;
        results.details.push({
          email: preReg.email,
          status: 'failed',
          reason: error.message
        });

        // Update tracking status to failed if we have tracking record
        if (trackingRecord?.id) {
          await supabase
            .from('pre_registration_email_tracking')
            .update({
              email_status: 'failed',
              failed_at: new Date().toISOString(),
              error_message: error.message,
              retry_count: 1
            })
            .eq('id', trackingRecord.id);
        }
      }
    }

    console.log(`Bulk email completed: ${results.sent} sent, ${results.skipped} skipped, ${results.failed} failed`);

    return Response.json(
      {
        success: true,
        message: 'Bulk countdown emails processed',
        summary: {
          total: results.total,
          sent: results.sent,
          skipped: results.skipped,
          failed: results.failed
        },
        details: results.details
      },
      { status: 200, headers: corsHeaders }
    );

  } catch (error) {
    console.error('Error in handleBulkCountdownEmail:', error);
    return Response.json(
      { error: 'Failed to send bulk countdown emails', details: error.message },
      { status: 500, headers: corsHeaders }
    );
  }
}
