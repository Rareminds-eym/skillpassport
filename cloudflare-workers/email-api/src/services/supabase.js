/**
 * Supabase client and database operations
 */

import { createClient } from '@supabase/supabase-js';

export function createSupabaseClient(env) {
  const supabaseUrl = env.VITE_SUPABASE_URL;
  const supabaseKey = env.SUPABASE_SERVICE_ROLE_KEY;

  if (!supabaseUrl || !supabaseKey) {
    return null;
  }

  return createClient(supabaseUrl, supabaseKey);
}

export async function findPreRegistrationByEmail(supabase, email) {
  const { data, error } = await supabase
    .from('pre_registrations')
    .select('id')
    .eq('email', email)
    .single();

  return { data, error };
}

export async function getAllPreRegistrations(supabase) {
  const { data, error } = await supabase
    .from('pre_registrations')
    .select('id, full_name, email, payment_status, created_at')
    .neq('payment_status', 'pending'); // Exclude users with pending payment status

  return { data, error };
}

export async function createEmailTracking(supabase, trackingData) {
  const { data, error } = await supabase
    .from('pre_registration_email_tracking')
    .insert(trackingData)
    .select()
    .single();

  return { data, error };
}

export async function updateEmailTracking(supabase, trackingId, updates) {
  const { data, error } = await supabase
    .from('pre_registration_email_tracking')
    .update(updates)
    .eq('id', trackingId);

  return { data, error };
}

export async function checkEmailAlreadySent(supabase, preRegId, countdownDay, sinceDate = null) {
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

export async function checkEmailSentToday(supabase, preRegId) {
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

export async function getFailedEmails(supabase, maxRetries, limit = 10) {
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

  return { data, error };
}
