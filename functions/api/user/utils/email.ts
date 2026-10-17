/**
 * Email utilities for User API
 * Uses email-worker Cloudflare Worker for sending emails
 */

import type { PagesEnv } from '../../../lib/types';
import { sendEmail, sendEmailSafe, validateEmailEnv } from '../../../lib/email-service';
import {
  generateWelcomeEmailHtml,
  generateInterviewReminderHtml,
  getWelcomeSubject,
  getInterviewReminderSubject,
  type WelcomeEmailData,
  type InterviewReminderData,
} from '../../email/services/templates';

/**
 * Send welcome email to new user
 */
export async function sendWelcomeEmail(
  env: PagesEnv,
  baseUrl: string,
  email: string,
  name: string,
  role: string,
  additionalInfo?: string
): Promise<void> {
  // Validate environment variables
  validateEmailEnv(env);

  const emailData: WelcomeEmailData = {
    name,
    email,
    role,
    baseUrl,
    additionalInfo,
  };

  const html = generateWelcomeEmailHtml(emailData);
  const subject = getWelcomeSubject();
  
  const text = `Welcome to SkillPassport!\n\nHello ${name},\n\nYour account has been created successfully.\n\nEmail: ${email}\nRole: ${role}\n\nLogin at: ${baseUrl}/login`;

  await sendEmail(env, { 
    to: email, 
    subject, 
    html,
    text,
  });
}

/**
 * Send interview reminder email
 */
export async function sendInterviewReminderEmail(
  env: PagesEnv,
  recipientEmail: string,
  recipientName: string,
  interviewDetails: Record<string, any>
): Promise<{ success: boolean; error?: string; emailId?: string }> {
  const reminderData: InterviewReminderData = {
    recipientName,
    interviewDetails,
  };
  
  const html = generateInterviewReminderHtml(reminderData);
  const subject = getInterviewReminderSubject();
  
  const { date, time, location, interviewer, position, company } = interviewDetails;
  const text = `Interview Reminder - SkillPassport\n\nHello ${recipientName},\n\nThis is a reminder about your upcoming interview:\n\n${position ? `Position: ${position}\n` : ''}${company ? `Company: ${company}\n` : ''}${date ? `Date: ${date}\n` : ''}${time ? `Time: ${time}\n` : ''}${location ? `Location: ${location}\n` : ''}${interviewer ? `Interviewer: ${interviewer}\n` : ''}\n\nGood luck!`;

  const success = await sendEmailSafe(env, { 
    to: recipientEmail, 
    subject, 
    html, 
    text,
  });
  
  return {
    success,
    emailId: success ? `email-${Date.now()}` : undefined,
    error: success ? undefined : 'Failed to send email',
  };
}
