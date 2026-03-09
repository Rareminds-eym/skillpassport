/**
 * Supabase client and database operations
 */

import { createClient, SupabaseClient } from '@supabase/supabase-js';
import type { 
  Env, 
  PreRegistration, 
  EmailTracking, 
  EmailTrackingInsert, 
  EmailTrackingUpdate,
  FailedEmailRecord 
} from '../types';

export function createSupabaseClient(env: Env): SupabaseClient | null {
  const supabaseUrl = env.VITE_SUPABASE_URL;
  const supabaseKey = env.SUPABASE_SERVICE_ROLE_KEY;

  if (!supabaseUrl || !supabaseKey) {
    return null;
  }

  return createClient(supabaseUrl, supabaseKey);
}

export async function findPreRegistrationByEmail(supabase: SupabaseClient, email: string) {
  const { data, error } = await supabase
    .from('pre_registrations')
    .select('id')
    .eq('email', email)
    .single();

  return { data, error };
}

export async function getAllPreRegistrations(supabase: SupabaseClient) {
  const { data, error } = await supabase
    .from('pre_registrations')
    .select('id, full_name, email, payment_status, created_at')
    .neq('payment_status', 'pending');

  return { data: data as PreRegistration[] | null, error };
}

export async function createEmailTracking(supabase: SupabaseClient, trackingData: EmailTrackingInsert) {
  const { data, error } = await supabase
    .from('pre_registration_email_tracking')
    .insert(trackingData)
    .select()
    .single();

  return { data: data as EmailTracking | null, error };
}

export async function updateEmailTracking(supabase: SupabaseClient, trackingId: string, updates: EmailTrackingUpdate) {
  const { data, error } = await supabase
    .from('pre_registration_email_tracking')
    .update(updates)
    .eq('id', trackingId);

  return { data, error };
}

export async function checkEmailAlreadySent(
  supabase: SupabaseClient, 
  preRegId: string, 
  countdownDay: number, 
  sinceDate: Date | null = null
) {
  let query = supabase
    .from('pre_registration_email_tracking')
    .select('id, sent_at')
    .eq('pre_registration_id', preRegId)
    .eq('metadata->>countdown_day', countdownDay.toString());

  if (sinceDate) {
    query = query.gte('created_at', sinceDate.toISOString());
  }

  const { data, error } = await query.maybeSingle();

  return { data, error };
}

export async function checkEmailSentToday(supabase: SupabaseClient, preRegId: string) {
  // Get start of today in UTC
  const todayStart = new Date();
  todayStart.setUTCHours(0, 0, 0, 0);

  const { data, error } = await supabase
    .from('pre_registration_email_tracking')
    .select('id, sent_at, metadata')
    .eq('pre_registration_id', preRegId)
    .eq('email_status', 'sent')
    .gte('sent_at', todayStart.toISOString())
    .maybeSingle();

  return { data, error };
}

export async function getFailedEmails(supabase: SupabaseClient, maxRetries: number, limit: number = 10) {
  const { data, error } = await supabase
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
    .limit(limit);

  return { data: data as FailedEmailRecord[] | null, error };
}
