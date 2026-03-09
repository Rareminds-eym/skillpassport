/**
 * TypeScript type definitions for email-api
 */

import { SupabaseClient } from '@supabase/supabase-js';

// Environment variables
export interface Env {
  SMTP_HOST: string;
  SMTP_PORT: string;
  SMTP_USER: string;
  SMTP_PASS: string;
  FROM_EMAIL?: string;
  FROM_NAME?: string;
  VITE_SUPABASE_URL?: string;
  SUPABASE_SERVICE_ROLE_KEY?: string;
  LAUNCH_DATE?: string;
  MAX_EMAIL_RETRIES?: string;
}

// Email data structures
export interface EmailData {
  to: string | string[];
  subject: string;
  html: string;
  text?: string;
  from?: string;
  fromName?: string;
}

export interface EmailDataWithAttachment extends EmailData {
  attachments?: Array<{
    filename: string;
    content: string;
    encoding: string;
  }>;
}

export interface EmailResult {
  success: boolean;
  recipients?: string[];
  error?: string;
  errorType?: string;
  shouldRetry?: boolean;
}

// SMTP Configuration
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

// Template data structures
export interface CountdownEmailData {
  fullName: string;
  countdownDay: number;
  launchDate: string;
}

export interface InvitationEmailData {
  organizationName: string;
  memberType: string;
  invitationToken: string;
  expiresAt: string;
  customMessage?: string;
}

export interface EventConfirmationData {
  name: string;
  email: string;
  phone: string;
  amount: number;
  orderId?: string;
  campaign?: string;
}

export interface OTPEmailData {
  otp: string;
  name?: string;
}

export interface RegistrationReceiptData {
  name: string;
  email: string;
  phone: string;
  amount: number;
  orderId: string;
  campaign?: string;
  date?: string;
}

// Database structures
export interface PreRegistration {
  id: string;
  full_name: string;
  email: string;
  phone: string;
  payment_status: string;
  amount?: number;
  razorpay_order_id?: string;
  razorpay_payment_id?: string;
  created_at: string;
}

export interface EmailTracking {
  id: string;
  pre_registration_id: string;
  email_status: string;
  scheduled_at?: string;
  sent_at?: string;
  failed_at?: string;
  error_message?: string;
  retry_count: number;
  metadata?: Record<string, any>;
}

export interface EmailTrackingInsert {
  pre_registration_id: string;
  email_status: string;
  scheduled_at?: string;
  metadata?: Record<string, any>;
}

export interface EmailTrackingUpdate {
  email_status?: string;
  sent_at?: string;
  failed_at?: string;
  error_message?: string;
  retry_count?: number;
}

export interface FailedEmailRecord {
  id: string;
  pre_registration_id: string;
  email_status: string;
  retry_count: number;
  error_message?: string;
  failed_at: string;
  metadata?: Record<string, any>;
  pre_registrations: PreRegistration;
}

// Bulk processing results
export interface BulkEmailResults {
  total: number;
  sent: number;
  skipped: number;
  failed: number;
  details: Array<{
    email: string;
    status: string;
    reason?: string;
    tracking_id?: string;
  }>;
}

export interface ProcessingResult {
  status: 'success' | 'skipped' | 'failed';
  email: string;
  reason?: string;
}

// Batch processing
export type BatchProcessor<T> = (item: T) => Promise<any>;

export interface BatchResult {
  status: 'fulfilled' | 'rejected';
  value?: any;
  reason?: any;
}

// Request handlers
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

// Cloudflare Worker types
export interface ExecutionContext {
  waitUntil(promise: Promise<any>): void;
  passThroughOnException(): void;
}

export interface ScheduledEvent {
  scheduledTime: number;
  cron: string;
}
