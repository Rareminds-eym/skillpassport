/**
 * Cloudflare Worker: send-email
 * Sends emails using worker-mailer with AWS SES SMTP
 * Migrated from Supabase Edge Function
 */

import { WorkerMailer } from 'worker-mailer';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
};

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
};
