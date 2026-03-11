/**
 * Database operations for email tracking
 */

import type { SupabaseClient } from '@supabase/supabase-js';
import type { PreRegistration, EmailTracking } from '../types';

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

export async function getPreRegistrationByOrderId(supabase: SupabaseClient, orderId: string) {
  const { data, error } = await supabase
    .from('pre_registrations')
    .select('*')
    .eq('razorpay_order_id', orderId)
    .maybeSingle();

  return { data: data as PreRegistration | null, error };
}

export async function createEmailTracking(supabase: SupabaseClient, trackingData: EmailTracking) {
  const { data, error } = await supabase
    .from('pre_registration_email_tracking')
    .insert(trackingData)
    .select()
    .single();

  return { data, error };
}

export async function updateEmailTracking(supabase: SupabaseClient, trackingId: string, updates: Partial<EmailTracking>) {
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
