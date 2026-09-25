/**
 * Sales enquiry email handler
 * POST /api/email/sales-enquiry
 */

import type { PagesEnv } from '../../../lib/types';
import type { SalesEnquiryEmailRequest } from '../types';
import { apiSuccess, apiError } from '../../../lib/response';
import { apiLogger } from '../../../lib/logger';
import { sendEmail, sendEmailSafe } from '../../../lib/email-service';
import {
  generateSalesEnquiryEmailHtml,
  generateSalesEnquiryConfirmationEmailHtml,
} from '../services/templates';

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export async function handleSalesEnquiryEmail(
  body: SalesEnquiryEmailRequest,
  env: PagesEnv,
  request?: Request
): Promise<Response> {
  const { institution, email, phone, learners, educators, requirements, planName, salesEmail } = body;

  if (!institution || typeof institution !== 'string' || !institution.trim()) {
    return apiError(400, 'VALIDATION_ERROR', 'Institution name is required', request);
  }

  if (!email || typeof email !== 'string' || !EMAIL_REGEX.test(email.trim())) {
    return apiError(400, 'VALIDATION_ERROR', 'A valid contact email is required', request);
  }

  const cleanPhone = phone ? String(phone).trim() : '';
  const digitsOnly = cleanPhone.replace(/\D/g, '');
  if (!cleanPhone || digitsOnly.length < 7 || digitsOnly.length > 15) {
    return apiError(400, 'VALIDATION_ERROR', 'A valid phone number (at least 7-15 digits) is required', request);
  }

  if (learners !== undefined && learners !== '') {
    const l = Number(learners);
    if (!Number.isInteger(l) || l < 0) {
      return apiError(400, 'VALIDATION_ERROR', 'Learners count must be a non-negative whole number', request);
    }
  }

  if (educators !== undefined && educators !== '') {
    const e = Number(educators);
    if (!Number.isInteger(e) || e < 0) {
      return apiError(400, 'VALIDATION_ERROR', 'Educators count must be a non-negative whole number', request);
    }
  }

  const cleanInstitution = institution.trim().slice(0, 150);
  const cleanEmail = email.trim().slice(0, 254);
  const cleanRequirements = requirements ? String(requirements).trim().slice(0, 2000) : '';
  const cleanPlanName = planName ? String(planName).trim().slice(0, 80) : 'Hybrid';
  const targetSalesEmail = (salesEmail && typeof salesEmail === 'string' && EMAIL_REGEX.test(salesEmail.trim()) && salesEmail.trim() !== 'sales@skillpassport.in')
    ? salesEmail.trim()
    : 'marketing@rareminds.in';

  const submittedAt = new Date().toLocaleString('en-US', {
    dateStyle: 'medium',
    timeStyle: 'short',
    timeZone: 'Asia/Kolkata',
  }) + ' IST';

  const templateData = {
    institution: cleanInstitution,
    email: cleanEmail,
    phone: cleanPhone,
    learners: learners !== undefined && learners !== '' ? String(learners) : '',
    educators: educators !== undefined && educators !== '' ? String(educators) : '',
    requirements: cleanRequirements,
    planName: cleanPlanName,
    submittedAt,
  };

  try {
    const salesHtml = generateSalesEnquiryEmailHtml(templateData);
    const salesSubject = `New Hybrid Plan Enquiry: ${cleanInstitution}`;

    const result = await sendEmail(env, {
      to: targetSalesEmail,
      subject: salesSubject,
      html: salesHtml,
      text: [
        `New Hybrid Plan Enquiry: ${cleanInstitution}`,
        `Contact Email: ${cleanEmail}`,
        `Phone Number: ${cleanPhone}`,
        `Plan: ${cleanPlanName}`,
        `Students: ${templateData.learners || 'To be discussed'}`,
        `Educators: ${templateData.educators || 'To be discussed'}`,
        `Submitted At: ${submittedAt}`,
        '',
        'Requirements:',
        cleanRequirements || 'None specified',
      ].join('\n'),
    });

    if (!result.success) {
      throw new Error(result.error || 'Failed to send sales enquiry email');
    }

    apiLogger.info('Sales enquiry email sent to sales team', {
      to: targetSalesEmail,
      institution: cleanInstitution,
      messageId: result.messageId,
    });

    // Send confirmation to the client (non-blocking safe send)
    const confirmationHtml = generateSalesEnquiryConfirmationEmailHtml(templateData);
    await sendEmailSafe(env, {
      to: cleanEmail,
      subject: `Thank you for your ${cleanPlanName} plan enquiry - SkillPassport`,
      html: confirmationHtml,
      text: `Dear Administrator at ${cleanInstitution},\n\nThank you for reaching out to SkillPassport. We have received your request for a customized ${cleanPlanName} subscription. Our enterprise team will contact you within 1 business day.\n\nIf you have immediate questions, reach us directly at marketing@rareminds.in or +91 9902326951.\n\nBest regards,\nSkillPassport Team`,
    });

    return apiSuccess({
      messageId: result.messageId,
      institution: cleanInstitution,
      email: cleanEmail,
    }, request);
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Failed to send enquiry email';
    apiLogger.error('Error processing sales enquiry email', error as Error);
    return apiError(500, 'EMAIL_SEND_FAILED', errorMessage, request);
  }
}
