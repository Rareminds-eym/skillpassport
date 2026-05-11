/**
 * Contact form submission handler
 * POST /api/contact/submit
 * 
 * Flow:
 * 1. Validate request body
 * 2. Save to Supabase contact_form table
 * 3. Send email notification via shared-email-api
 * 4. Return success response
 */

import type { SupabaseClient } from '@supabase/supabase-js';
import type { PagesEnv } from '../../../../src/functions-lib/types';
import type { 
  ContactFormRequest, 
  ContactFormResponse, 
  SharedEmailRequest,
  SharedEmailResponse 
} from '../types';
import { jsonResponse } from '../../../../src/functions-lib';
import { validateContactForm } from '../utils/validation';
import { generateEmailHTML } from '../utils/email-template';
import { apiLogger } from '../../../lib/logger';

export async function handleContactSubmit(
  body: ContactFormRequest,
  env: PagesEnv,
  supabase: SupabaseClient
): Promise<Response> {
  try {
    // Step 1: Validate request body
    const validation = validateContactForm(body);
    if (!validation.valid) {
      return jsonResponse({
        success: false,
        error: validation.error,
        errorCode: 'VALIDATION_ERROR'
      }, 400);
    }

    const { name, email, organization, user_type, message } = body;

    // Step 2: Save to database
    const { data: submission, error: dbError } = await supabase
      .from('contact_form')
      .insert([{
        name,
        email,
        organization: organization || null,
        user_type,
        message
      }])
      .select('id')
      .single();

    if (dbError) {
      apiLogger.error('Database error saving contact form', dbError as Error);
      return jsonResponse({
        success: false,
        error: 'Failed to save contact form submission',
        errorCode: 'DATABASE_ERROR'
      }, 500);
    }

    const submissionId = submission?.id;

    // Step 3: Send email notification via shared-email-api
    let emailSent = false;
    let emailError: string | undefined;

    try {
      emailSent = await sendEmailNotification(
        { name, email, organization, user_type, message },
        env
      );
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      emailError = errorMessage;
      apiLogger.error('Email notification failed', error as Error);
    }

    // Step 4: Return response
    // Success even if email fails (data is saved)
    if (!emailSent) {
      apiLogger.warn('Contact form saved but email notification failed', {
        submissionId,
        emailError
      });
      
      return jsonResponse({
        success: true,
        message: 'Contact form submitted successfully (email notification pending)',
        submissionId
      });
    }

    apiLogger.info('Contact form submitted successfully', {
      submissionId,
      email,
      user_type
    });

    return jsonResponse({
      success: true,
      message: 'Contact form submitted successfully',
      submissionId
    });

  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Internal server error';
    apiLogger.error('Contact form submission error', error as Error);
    
    return jsonResponse({
      success: false,
      error: errorMessage,
      errorCode: 'INTERNAL_ERROR'
    }, 500);
  }
}

/**
 * Send email notification via shared-email-api
 */
async function sendEmailNotification(
  formData: ContactFormRequest,
  env: PagesEnv
): Promise<boolean> {
  // Check required environment variables
  if (!env.SHARED_EMAIL_API_URL) {
    throw new Error('SHARED_EMAIL_API_URL is not configured');
  }
  if (!env.SHARED_EMAIL_API_KEY) {
    throw new Error('SHARED_EMAIL_API_KEY is not configured');
  }

  const { name, email, organization, user_type, message } = formData;

  // Prepare email payload
  const emailPayload: SharedEmailRequest = {
    to: 'marketing@rareminds.in',
    subject: `New Contact Form Submission - ${user_type}`,
    html: generateEmailHTML(formData),
    replyTo: email,
    from: 'no-reply@rareminds.in',
    fromName: 'Rareminds Skill Passport'
  };

  // Call shared-email-api
  const response = await fetch(`${env.SHARED_EMAIL_API_URL}/send`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'X-API-Key': env.SHARED_EMAIL_API_KEY
    },
    body: JSON.stringify(emailPayload)
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Shared email API failed: ${response.status} - ${errorText}`);
  }

  const result: SharedEmailResponse = await response.json();

  if (!result.success) {
    throw new Error(result.error || 'Email sending failed');
  }

  return true;
}
