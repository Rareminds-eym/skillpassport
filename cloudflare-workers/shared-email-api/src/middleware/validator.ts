/**
 * Request validation middleware
 */

import type { SendEmailRequest } from '../types';
import { ValidationError } from '../types';
import { EMAIL_REGEX, VALIDATION } from '../constants';

export function validateEmail(email: string): boolean {
  return EMAIL_REGEX.test(email);
}

export function validateEmailList(emails: string | string[]): string[] {
  const emailList = Array.isArray(emails) ? emails : [emails];
  
  if (emailList.length === 0) {
    throw new ValidationError('At least one recipient is required');
  }
  
  if (emailList.length > VALIDATION.MAX_RECIPIENTS) {
    throw new ValidationError(
      `Too many recipients. Maximum ${VALIDATION.MAX_RECIPIENTS} allowed`,
      { maxRecipients: VALIDATION.MAX_RECIPIENTS, provided: emailList.length }
    );
  }
  
  for (const email of emailList) {
    if (!validateEmail(email)) {
      throw new ValidationError(`Invalid email address: ${email}`);
    }
  }
  
  return emailList;
}

export function validateSendEmailRequest(body: any): SendEmailRequest {
  if (!body || typeof body !== 'object') {
    throw new ValidationError('Request body must be a JSON object');
  }
  
  const { to, subject, html, text, from, fromName, replyTo, cc, bcc, metadata } = body;
  
  // Validate required fields
  if (!to) {
    throw new ValidationError('Missing required field: to');
  }
  
  if (!subject) {
    throw new ValidationError('Missing required field: subject');
  }
  
  if (!html) {
    throw new ValidationError('Missing required field: html');
  }
  
  // Validate email addresses
  const toList = validateEmailList(to);
  
  if (from && !validateEmail(from)) {
    throw new ValidationError(`Invalid from email address: ${from}`);
  }
  
  if (replyTo && !validateEmail(replyTo)) {
    throw new ValidationError(`Invalid replyTo email address: ${replyTo}`);
  }
  
  if (cc) {
    validateEmailList(cc);
  }
  
  if (bcc) {
    validateEmailList(bcc);
  }
  
  // Validate subject length
  if (subject.length > VALIDATION.MAX_SUBJECT_LENGTH) {
    throw new ValidationError(
      `Subject too long. Maximum ${VALIDATION.MAX_SUBJECT_LENGTH} characters allowed`,
      { maxLength: VALIDATION.MAX_SUBJECT_LENGTH, provided: subject.length }
    );
  }
  
  // Validate HTML size
  if (html.length > VALIDATION.MAX_HTML_SIZE) {
    throw new ValidationError(
      `HTML content too large. Maximum ${VALIDATION.MAX_HTML_SIZE} bytes allowed`,
      { maxSize: VALIDATION.MAX_HTML_SIZE, provided: html.length }
    );
  }
  
  return {
    to: toList,
    subject,
    html,
    text,
    from,
    fromName,
    replyTo,
    cc,
    bcc,
    metadata,
  };
}
