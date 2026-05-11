/**
 * Type definitions for Contact Form API
 */

// ==================== REQUEST TYPES ====================

export interface ContactFormRequest {
  name: string;
  email: string;
  organization?: string;
  user_type: 'learner' | 'institution' | 'employer' | 'other';
  message: string;
}

// ==================== RESPONSE TYPES ====================

export interface ContactFormResponse {
  success: boolean;
  message?: string;
  submissionId?: string;
  error?: string;
  errorCode?: string;
}

// ==================== DATABASE TYPES ====================

export interface ContactFormRecord {
  id: string;
  created_at: string;
  updated_at: string;
  name: string;
  email: string;
  organization: string | null;
  user_type: 'learner' | 'institution' | 'employer' | 'other';
  message: string;
  admin_notes: string | null;
}

// ==================== EMAIL TYPES ====================

export interface SharedEmailRequest {
  to: string | string[];
  subject: string;
  html: string;
  text?: string;
  from?: string;
  fromName?: string;
  replyTo?: string;
}

export interface SharedEmailResponse {
  success: boolean;
  messageId?: string;
  recipient?: string | string[];
  timestamp?: string;
  error?: string;
  errorCode?: string;
}
