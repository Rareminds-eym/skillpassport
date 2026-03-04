/**
 * Type definitions for Email API
 */

import type { SupabaseClient } from '@supabase/supabase-js';

// ==================== REQUEST TYPES ====================

export interface GenericEmailRequest {
  to: string | string[];
  subject: string;
  html: string;
  text?: string;
  from?: string;
  fromName?: string;
}

export interface InvitationEmailRequest {
  to: string;
  organizationName: string;
  memberType: string;
  invitationToken: string;
  expiresAt: string;
  customMessage?: string;
}

export interface CountdownEmailRequest {
  to: string;
  fullName: string;
  countdownDay: number;
  launchDate: string;
}

export interface BulkCountdownEmailRequest {
  countdownDay: number;
  launchDate: string;
}

export interface EventConfirmationRequest {
  name: string;
  email: string;
  phone: string;
  amount: number;
  orderId?: string;
  campaign?: string;
}

export interface EventOTPRequest {
  email: string;
  otp: string;
  name?: string;
}

// ==================== EMAIL DATA TYPES ====================

export interface EmailData {
  to: string | string[];
  subject: string;
  html: string;
  text?: string;
  from?: string;
  fromName?: string;
}

export interface EmailResult {
  success: boolean;
  recipients?: string[];
  error?: string;
  errorType?: 'permanent' | 'temporary' | 'unknown';
  shouldRetry?: boolean;
}

// ==================== TEMPLATE DATA TYPES ====================

export interface InvitationTemplateData {
  organizationName: string;
  memberType: string;
  invitationToken: string;
  expiresAt: string;
  customMessage?: string;
}

export interface CountdownTemplateData {
  fullName: string;
  countdownDay: number;
  launchDate: string;
}

export interface EventConfirmationTemplateData {
  name: string;
  email: string;
  phone: string;
  amount: number;
  orderId?: string;
  campaign?: string;
  baseUrl?: string;
}

export interface OTPTemplateData {
  otp: string;
  name?: string;
}

// ==================== DATABASE TYPES ====================

export interface PreRegistration {
  id: string;
  full_name: string;
  email: string;
  phone?: string;
  payment_status: string;
  created_at: string;
  razorpay_order_id?: string;
  razorpay_payment_id?: string;
  amount?: number;
}

export interface EmailTracking {
  id?: string;
  pre_registration_id: string;
  email_status: EmailStatus;
  scheduled_at?: string;
  sent_at?: string;
  failed_at?: string;
  error_message?: string;
  retry_count?: number;
  metadata?: Record<string, any>;
}

export type EmailStatus = 'queued' | 'sending' | 'sent' | 'failed' | 'rejected';

// ==================== BULK PROCESSING TYPES ====================

export interface BulkEmailResult {
  total: number;
  sent: number;
  skipped: number;
  failed: number;
  details: BulkEmailDetail[];
}

export interface BulkEmailDetail {
  email: string;
  status: 'sent' | 'skipped' | 'failed';
  reason?: string;
  tracking_id?: string;
}

// ==================== SMTP CONFIG ====================

export interface SmtpConfig {
  host: string;
  port: number;
  secure: boolean;
  startTls: boolean;
  authType: string;
  credentials: {
    username: string;
    password: string;
  };
}

export interface FromAddress {
  email: string;
  name: string;
}

// ==================== CONSTANTS ====================

export const EMAIL_STATUS = {
  QUEUED: 'queued' as const,
  SENDING: 'sending' as const,
  SENT: 'sent' as const,
  FAILED: 'failed' as const,
  REJECTED: 'rejected' as const,
};

export const ERROR_TYPES = {
  PERMANENT: 'permanent' as const,
  TEMPORARY: 'temporary' as const,
  UNKNOWN: 'unknown' as const,
};

export const COUNTDOWN_DAYS = [8, 7, 6, 5, 4, 3, 2, 1];
export const MAX_RETRY_ATTEMPTS = 3;
export const RETRY_BATCH_SIZE = 10;

export const APP_URL = 'https://skillpassport.rareminds.in';
