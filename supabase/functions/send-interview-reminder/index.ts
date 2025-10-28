import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.38.0';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
}

interface InterviewReminderRequest {
  interviewId: string;
  recipientEmail: string;
  recipientName: string;
  interviewDetails?: {
    date: string;
    time: string;
    duration: number;
    meetingLink?: string;
    meetingType?: string;
    jobTitle?: string;
    interviewer?: string;
  };
}

interface EmailTemplate {
  subject: string;
  html: string;
  text: string;
}

function createEmailTemplate(
  candidateName: string, 
  interviewDetails: InterviewReminderRequest['interviewDetails']
): EmailTemplate {
  const { date, time, duration, meetingLink, meetingType, jobTitle, interviewer } = interviewDetails || {};
  
  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  const subject = `Interview Reminder - ${jobTitle || 'Position'} Interview`;
  
  const html = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>Interview Reminder</title>
      <style>
        body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px; }
        .header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 30px; border-radius: 10px 10px 0 0; text-align: center; }
        .content { background: #f8f9fa; padding: 30px; border-radius: 0 0 10px 10px; }
        .interview-details { background: white; padding: 20px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #667eea; }
        .detail-item { margin: 10px 0; display: flex; align-items: center; }
        .detail-label { font-weight: bold; width: 120px; color: #555; }
        .detail-value { color: #333; }
        .meeting-link { background: #667eea; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; display: inline-block; margin: 15px 0; }
        .footer { text-align: center; margin-top: 30px; color: #666; font-size: 14px; }
        .logo { font-size: 24px; font-weight: bold; margin-bottom: 10px; }
      </style>
    </head>
    <body>
      <div class="header">
        <div class="logo">🎯 RareMinds</div>
        <h1 style="margin: 0;">Interview Reminder</h1>
      </div>
      
      <div class="content">
        <p>Dear ${candidateName},</p>
        
        <p>This is a friendly reminder about your upcoming interview. We're looking forward to meeting with you!</p>
        
        <div class="interview-details">
          <h3 style="margin-top: 0; color: #667eea;">📅 Interview Details</h3>
          
          ${jobTitle ? `
          <div class="detail-item">
            <span class="detail-label">Position:</span>
            <span class="detail-value">${jobTitle}</span>
          </div>
          ` : ''}
          
          ${date ? `
          <div class="detail-item">
            <span class="detail-label">Date:</span>
            <span class="detail-value">${formatDate(date)}</span>
          </div>
          ` : ''}
          
          ${time ? `
          <div class="detail-item">
            <span class="detail-label">Time:</span>
            <span class="detail-value">${time}</span>
          </div>
          ` : ''}
          
          ${duration ? `
          <div class="detail-item">
            <span class="detail-label">Duration:</span>
            <span class="detail-value">${duration} minutes</span>
          </div>
          ` : ''}
          
          ${interviewer ? `
          <div class="detail-item">
            <span class="detail-label">Interviewer:</span>
            <span class="detail-value">${interviewer}</span>
          </div>
          ` : ''}
          
          ${meetingType ? `
          <div class="detail-item">
            <span class="detail-label">Format:</span>
            <span class="detail-value">${meetingType} Meeting</span>
          </div>
          ` : ''}
        </div>
        
        ${meetingLink ? `
        <div style="text-align: center;">
          <a href="${meetingLink}" class="meeting-link">
            🔗 Join Meeting
          </a>
        </div>
        ` : ''}
        
        <div style="background: #e3f2fd; padding: 15px; border-radius: 6px; margin: 20px 0;">
          <h4 style="margin-top: 0; color: #1565c0;">💡 Interview Tips:</h4>
          <ul style="margin-bottom: 0;">
            <li>Test your internet connection and camera beforehand</li>
            <li>Prepare examples that showcase your skills and experience</li>
            <li>Have questions ready about the role and company</li>
            <li>Join the meeting 5 minutes early</li>
          </ul>
        </div>
        
        <p>If you need to reschedule or have any questions, please don't hesitate to reach out to us.</p>
        
        <p>Best regards,<br>
        <strong>RareMinds Recruitment Team</strong></p>
      </div>
      
      <div class="footer">
        <p>This is an automated reminder. Please contact us if you have any concerns.</p>
      </div>
    </body>
    </html>
  `;

  const text = `
Interview Reminder - ${jobTitle || 'Position'} Interview

Dear ${candidateName},

This is a friendly reminder about your upcoming interview. We're looking forward to meeting with you!

Interview Details:
${jobTitle ? `Position: ${jobTitle}\n` : ''}${date ? `Date: ${formatDate(date)}\n` : ''}${time ? `Time: ${time}\n` : ''}${duration ? `Duration: ${duration} minutes\n` : ''}${interviewer ? `Interviewer: ${interviewer}\n` : ''}${meetingType ? `Format: ${meetingType} Meeting\n` : ''}
${meetingLink ? `\nMeeting Link: ${meetingLink}\n` : ''}
Interview Tips:
• Test your internet connection and camera beforehand
• Prepare examples that showcase your skills and experience
• Have questions ready about the role and company
• Join the meeting 5 minutes early

If you need to reschedule or have any questions, please don't hesitate to reach out to us.

Best regards,
RareMinds Recruitment Team

This is an automated reminder. Please contact us if you have any concerns.
  `;

  return { subject, html, text };
}

async function sendEmail(
  to: string,
  subject: string,
  html: string,
  text: string,
  emailService: string
) {
  // For now, we'll use a simple email service
  // You can integrate with services like SendGrid, Resend, or others
  
  if (emailService === 'resend') {
    const resendApiKey = Deno.env.get('Emails') || Deno.env.get('RESEND_API_KEY');
    
    if (!resendApiKey) {
      console.error('Emails/RESEND_API_KEY is not configured');
      throw new Error('Email service not configured. Please set Emails or RESEND_API_KEY in Supabase settings.');
    }
    
    console.log('Sending email via Resend to:', to);
    
    const response = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${resendApiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        from: 'RareMinds <noreply@rareminds.in>',
        to: [to],
        subject,
        html,
        text,
      }),
    });
    
    if (!response.ok) {
      const errorData = await response.text();
      console.error('Resend API error:', response.status, errorData);
      throw new Error(`Resend API error: ${response.statusText} - ${errorData}`);
    }
    
    const result = await response.json();
    console.log('Resend API response:', result);
    return result;
  }
  
  // Fallback to console log for testing
  console.log(`Email would be sent to: ${to}`);
  console.log(`Subject: ${subject}`);
  console.log(`Content: ${text}`);
  
  return { id: 'test-email-id', status: 'sent' };
}

Deno.serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    // Initialize Supabase client
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Parse request body
    const body: InterviewReminderRequest = await req.json();
    const { interviewId, recipientEmail, recipientName, interviewDetails } = body;

    if (!interviewId || !recipientEmail || !recipientName) {
      return new Response(
        JSON.stringify({ error: 'Missing required fields: interviewId, recipientEmail, recipientName' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Get interview details from database if not provided
    let emailDetails = interviewDetails;
    if (!emailDetails) {
      const { data: interview, error } = await supabase
        .from('interviews')
        .select('*')
        .eq('id', interviewId)
        .single();

      if (error || !interview) {
        return new Response(
          JSON.stringify({ error: 'Interview not found' }),
          { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      // Format interview data for email template
      const interviewDate = new Date(interview.date);
      emailDetails = {
        date: interview.date,
        time: interviewDate.toLocaleTimeString('en-US', { 
          hour: '2-digit', 
          minute: '2-digit' 
        }),
        duration: interview.duration,
        meetingLink: interview.meeting_link,
        meetingType: interview.meeting_type,
        jobTitle: interview.job_title,
        interviewer: interview.interviewer,
      };
    }

    // Create email template
    const emailTemplate = createEmailTemplate(recipientName, emailDetails);

    // Send email
    const emailService = Deno.env.get('EMAIL_SERVICE') || 'resend'; // Default to resend
    console.log('Email service configured:', emailService);
    console.log('Sending email to:', recipientEmail);
    
    const emailResult = await sendEmail(
      recipientEmail,
      emailTemplate.subject,
      emailTemplate.html,
      emailTemplate.text,
      emailService
    );
    
    console.log('Email sent successfully:', emailResult);

    // Log reminder in database
    const { error: logError } = await supabase
      .from('interview_reminders')
      .insert([{
        interview_id: interviewId,
        sent_to: recipientEmail,
        reminder_type: 'interview_reminder',
        status: 'sent',
        email_id: emailResult.id || null,
      }]);

    if (logError) {
      console.error('Error logging reminder:', logError);
      // Don't fail the request if logging fails
    }

    // Update interview reminder count - first get current count
    const { data: currentInterview } = await supabase
      .from('interviews')
      .select('reminders_sent')
      .eq('id', interviewId)
      .single();

    const { error: updateError } = await supabase
      .from('interviews')
      .update({
        reminders_sent: (currentInterview?.reminders_sent || 0) + 1,
        updated_at: new Date().toISOString()
      })
      .eq('id', interviewId);

    if (updateError) {
      console.error('Error updating reminder count:', updateError);
      // Don't fail the request if update fails
    }

    return new Response(
      JSON.stringify({ 
        success: true, 
        message: 'Interview reminder sent successfully',
        emailId: emailResult.id 
      }),
      { 
        status: 200, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );

  } catch (error) {
    console.error('Error sending interview reminder:', error);
    return new Response(
      JSON.stringify({ error: 'Internal server error', details: error.message }),
      { 
        status: 500, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );
  }
});