/**
 * Entitlement lifecycle handlers (cron tasks)
 * POST /api/payments/expire-entitlements
 * POST /api/payments/send-renewal-reminders
 * POST /api/payments/process-auto-renewals
 * POST /api/payments/process-entitlement-lifecycle
 */

import { SupabaseClient } from '@supabase/supabase-js';
import { jsonResponse } from '../../../../src/functions-lib';

// ── Email helper ──────────────────────────────────────────────────────────────

async function sendEmail(env: any, to: string, subject: string, html: string): Promise<boolean> {
  try {
    const payload = JSON.stringify({ to, subject, html, from: 'noreply@rareminds.in', fromName: 'Skill Passport' });
    const res = env.EMAIL_SERVICE
      ? await env.EMAIL_SERVICE.fetch('https://email-api/', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: payload })
      : await fetch(`${env.EMAIL_API_URL || '/api/email/send'}`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: payload });
    if (!res.ok) return false;
    const result = await res.json() as any;
    return result.success === true;
  } catch { return false; }
}

// ── Email templates ───────────────────────────────────────────────────────────

function renewalReminderEmail(userName: string, featureName: string, days: number, price: number, period: string): string {
  const color = days <= 1 ? '#DC2626' : days <= 3 ? '#F59E0B' : '#3B82F6';
  const urgency = days <= 1 ? 'expires tomorrow' : `expires in ${days} days`;
  return `<!DOCTYPE html><html><body style="font-family:sans-serif;background:#f4f7fa;margin:0;padding:40px 0">
<table align="center" style="width:600px;background:#fff;border-radius:12px;overflow:hidden">
<tr><td style="padding:40px;background:${color};color:#fff;text-align:center">
<h2 style="margin:0">⏰ Renewal Reminder</h2>
<p style="margin:8px 0 0">Your ${featureName} subscription ${urgency}</p></td></tr>
<tr><td style="padding:40px">
<p>Hi <strong>${userName}</strong>,</p>
<p>Your <strong>${featureName}</strong> add-on ${days <= 1 ? 'expires tomorrow — renew now to avoid losing access!' : 'is expiring soon.'}</p>
<table style="width:100%;background:#f3f4f6;border-radius:8px;padding:16px;border-collapse:collapse">
<tr><td style="color:#6b7280">Renewal Price</td><td style="text-align:right;font-weight:600">₹${price}/${period === 'annual' ? 'year' : 'month'}</td></tr>
<tr><td style="color:#6b7280">Days Remaining</td><td style="text-align:right;color:${color};font-weight:600">${days} day${days > 1 ? 's' : ''}</td></tr>
</table>
<div style="text-align:center;margin-top:32px">
<a href="/subscription/manage" style="background:#4F46E5;color:#fff;padding:14px 32px;border-radius:8px;text-decoration:none;font-weight:600">Renew Now →</a>
</div></td></tr></table></body></html>`;
}

function expirationEmail(userName: string, featureName: string): string {
  return `<!DOCTYPE html><html><body style="font-family:sans-serif;background:#f4f7fa;margin:0;padding:40px 0">
<table align="center" style="width:600px;background:#fff;border-radius:12px;overflow:hidden">
<tr><td style="padding:40px;background:#6B7280;color:#fff;text-align:center"><h2 style="margin:0">Subscription Expired</h2></td></tr>
<tr><td style="padding:40px">
<p>Hi <strong>${userName}</strong>,</p>
<p>Your <strong>${featureName}</strong> subscription has expired. You no longer have access to this feature.</p>
<div style="text-align:center;margin-top:32px">
<a href="/subscription/add-ons" style="background:#4F46E5;color:#fff;padding:14px 32px;border-radius:8px;text-decoration:none;font-weight:600">Resubscribe →</a>
</div></td></tr></table></body></html>`;
}

function autoRenewalEmail(userName: string, featureName: string, amount: number, newEndDate: string): string {
  return `<!DOCTYPE html><html><body style="font-family:sans-serif;background:#f4f7fa;margin:0;padding:40px 0">
<table align="center" style="width:600px;background:#fff;border-radius:12px;overflow:hidden">
<tr><td style="padding:40px;background:#10B981;color:#fff;text-align:center"><div style="font-size:48px">✓</div><h2 style="margin:0">Auto-Renewal Successful!</h2></td></tr>
<tr><td style="padding:40px">
<p>Hi <strong>${userName}</strong>,</p>
<p>Your <strong>${featureName}</strong> subscription has been automatically renewed.</p>
<table style="width:100%;background:#f3f4f6;border-radius:8px;padding:16px;border-collapse:collapse">
<tr><td style="color:#6b7280">Amount Charged</td><td style="text-align:right;font-weight:600">₹${amount}</td></tr>
<tr><td style="color:#6b7280">New Expiry</td><td style="text-align:right;font-weight:600">${new Date(newEndDate).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}</td></tr>
</table></td></tr></table></body></html>`;
}

// ── Helpers ───────────────────────────────────────────────────────────────────

async function fetchUsers(supabase: SupabaseClient, userIds: string[]) {
  const map = new Map<string, any>();
  for (const id of userIds) {
    const { data } = await supabase.auth.admin.getUserById(id);
    if (data?.user) map.set(id, data.user);
  }
  return map;
}

async function fetchFeatureNames(supabase: SupabaseClient, featureKeys: string[]) {
  const { data } = await supabase
    .from('subscription_plan_features')
    .select('feature_key, feature_name, addon_price_monthly, addon_price_annual')
    .in('feature_key', featureKeys);
  return new Map((data || []).map((f: any) => [f.feature_key, f]));
}

// ── Expire entitlements ───────────────────────────────────────────────────────

export async function handleExpireEntitlements(supabase: SupabaseClient, env: any): Promise<Response> {
  const now = new Date().toISOString();

  const { data: expired, error } = await supabase
    .from('user_entitlements')
    .select('id, user_id, feature_key, end_date')
    .in('status', ['active', 'grace_period'])
    .lt('end_date', now);

  if (error) return jsonResponse({ error: error.message }, 500);
  if (!expired?.length) return jsonResponse({ success: true, expired: 0, message: 'No expired entitlements' });

  const userIds = [...new Set(expired.map((e: any) => e.user_id))];
  const featureKeys = [...new Set(expired.map((e: any) => e.feature_key))];
  const [userMap, featureMap] = await Promise.all([
    fetchUsers(supabase, userIds),
    fetchFeatureNames(supabase, featureKeys),
  ]);

  await supabase.from('user_entitlements').update({ status: 'expired', updated_at: now }).in('id', expired.map((e: any) => e.id));

  let emailsSent = 0;
  for (const ent of expired) {
    const user = userMap.get(ent.user_id);
    if (!user?.email) continue;
    const feature = featureMap.get(ent.feature_key);
    const featureName = feature?.feature_name || ent.feature_key;
    const userName = user.user_metadata?.full_name || user.email.split('@')[0];
    const sent = await sendEmail(env, user.email, `Your ${featureName} subscription has expired`, expirationEmail(userName, featureName));
    if (sent) emailsSent++;
  }

  return jsonResponse({ success: true, expired: expired.length, emailsSent });
}

// ── Renewal reminders ─────────────────────────────────────────────────────────

export async function handleSendRenewalReminders(supabase: SupabaseClient, env: any): Promise<Response> {
  const now = new Date();
  let totalSent = 0;

  for (const days of [7, 3, 1]) {
    const target = new Date(now);
    target.setDate(target.getDate() + days);
    const start = new Date(target); start.setHours(0, 0, 0, 0);
    const end = new Date(target); end.setHours(23, 59, 59, 999);

    const { data: expiring } = await supabase
      .from('user_entitlements')
      .select('id, user_id, feature_key, end_date, billing_period, price_at_purchase, auto_renew')
      .eq('status', 'active')
      .gte('end_date', start.toISOString())
      .lte('end_date', end.toISOString());

    if (!expiring?.length) continue;

    const userIds = [...new Set(expiring.map((e: any) => e.user_id))];
    const featureKeys = [...new Set(expiring.map((e: any) => e.feature_key))];
    const [userMap, featureMap] = await Promise.all([
      fetchUsers(supabase, userIds),
      fetchFeatureNames(supabase, featureKeys),
    ]);

    for (const ent of expiring) {
      if (ent.auto_renew) continue; // will be auto-renewed, skip reminder
      const user = userMap.get(ent.user_id);
      if (!user?.email) continue;
      const feature = featureMap.get(ent.feature_key);
      const featureName = feature?.feature_name || ent.feature_key;
      const userName = user.user_metadata?.full_name || user.email.split('@')[0];
      const price = parseFloat(ent.price_at_purchase) || 0;
      const sent = await sendEmail(
        env, user.email,
        `⏰ Your ${featureName} subscription expires in ${days} day${days > 1 ? 's' : ''}`,
        renewalReminderEmail(userName, featureName, days, price, ent.billing_period)
      );
      if (sent) totalSent++;
    }
  }

  return jsonResponse({ success: true, remindersSent: totalSent });
}

// ── Auto renewals ─────────────────────────────────────────────────────────────

export async function handleProcessAutoRenewals(supabase: SupabaseClient, env: any): Promise<Response> {
  const now = new Date();
  const tomorrow = new Date(now); tomorrow.setDate(tomorrow.getDate() + 1);

  const { data: renewable, error } = await supabase
    .from('user_entitlements')
    .select('id, user_id, feature_key, end_date, billing_period, price_at_purchase')
    .eq('status', 'active')
    .eq('auto_renew', true)
    .gte('end_date', now.toISOString())
    .lte('end_date', tomorrow.toISOString());

  if (error) return jsonResponse({ error: error.message }, 500);
  if (!renewable?.length) return jsonResponse({ success: true, renewed: 0, failed: 0 });

  const userIds = [...new Set(renewable.map((e: any) => e.user_id))];
  const featureKeys = [...new Set(renewable.map((e: any) => e.feature_key))];
  const [userMap, featureMap] = await Promise.all([
    fetchUsers(supabase, userIds),
    fetchFeatureNames(supabase, featureKeys),
  ]);

  let renewed = 0, failed = 0;

  for (const ent of renewable) {
    try {
      const feature = featureMap.get(ent.feature_key);
      const user = userMap.get(ent.user_id);
      if (!feature || !user) { failed++; continue; }

      const price = ent.billing_period === 'annual'
        ? parseFloat(feature.addon_price_annual)
        : parseFloat(feature.addon_price_monthly);
      if (!price || price <= 0) { failed++; continue; }

      const newStart = new Date(ent.end_date);
      const newEnd = new Date(newStart);
      ent.billing_period === 'annual'
        ? newEnd.setFullYear(newEnd.getFullYear() + 1)
        : newEnd.setMonth(newEnd.getMonth() + 1);

      const { error: updErr } = await supabase
        .from('user_entitlements')
        .update({ start_date: newStart.toISOString(), end_date: newEnd.toISOString(), price_at_purchase: price, updated_at: now.toISOString() })
        .eq('id', ent.id);

      if (updErr) { failed++; continue; }

      if (user.email) {
        const userName = user.user_metadata?.full_name || user.email.split('@')[0];
        await sendEmail(env, user.email, `✓ Your ${feature.feature_name} subscription has been renewed`,
          autoRenewalEmail(userName, feature.feature_name, price, newEnd.toISOString()));
      }
      renewed++;
    } catch { failed++; }
  }

  return jsonResponse({ success: true, renewed, failed });
}

// ── Main lifecycle (cron) ─────────────────────────────────────────────────────

export async function handleProcessEntitlementLifecycle(supabase: SupabaseClient, env: any): Promise<Response> {
  const [renewalRes, expireRes, reminderRes] = await Promise.all([
    handleProcessAutoRenewals(supabase, env),
    handleExpireEntitlements(supabase, env),
    handleSendRenewalReminders(supabase, env),
  ]);

  const [renewalData, expireData, reminderData] = await Promise.all([
    renewalRes.json(),
    expireRes.json(),
    reminderRes.json(),
  ]);

  return jsonResponse({
    success: true,
    results: { autoRenewals: renewalData, expirations: expireData, reminders: reminderData },
  });
}
