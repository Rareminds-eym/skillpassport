/**
 * DIDAC 2026 promo-code redemption — fire-and-forget hook called from
 * withAuth() after requireVerifiedEmail() passes.
 *
 * See TSD-didac-2026-dynamic-promo-code-management.yml (v2.1) for the full
 * design and why this lives here rather than the email-verification sync
 * path (sso-worker -> SYNC_QUEUE -> auth-sync-consumer -> sync-service.ts
 * verifyEmail()), which was found not to reliably deliver this event.
 *
 * @module lib/promo-redemption
 */
import type { SupabaseClient } from '@supabase/supabase-js';
import { createLogger } from './logger';
import { sendEmailSafe } from './email-service';
import type { PagesEnv } from './types';

const SUPPORTED_PROMO_ROLES = ['learner', 'school_admin', 'college_admin'] as const;
export type PromoRole = (typeof SUPPORTED_PROMO_ROLES)[number];

// Only these codes represent a DEFINITIVE rejection worth notifying the user
// about. PROMO_REDEMPTION_DB_ERROR (an RPC exception, handled separately in
// redeemPromoCodeForUser) is transient and must NOT trigger a notification —
// the user may still succeed on a later retry.
const REJECTION_REASONS: Record<string, string> = {
  PROMO_CODE_NOT_FOUND: "the code you entered doesn't match any active promotion",
  PROMO_CODE_INACTIVE: 'this code is not currently active',
  PROMO_CODE_NOT_YET_VALID: "this code isn't valid yet",
  PROMO_CODE_EXPIRED: 'this code has expired',
  PROMO_ROLE_NOT_ELIGIBLE: "this code doesn't apply to your account type",
  PROMO_QUOTA_EXHAUSTED_OVERALL: 'this code has reached its overall usage limit',
  PROMO_QUOTA_EXHAUSTED_ROLE: 'this code has reached its usage limit for your account type',
};

/**
 * Picks the first supported promo role present in the JWT's roles array.
 * Returns null if none of the three supported roles are present (e.g.
 * university_admin, recruiter_admin) — callers should skip the redemption
 * attempt entirely in that case rather than calling with an arbitrary role.
 */
export function resolvePromoRole(roles: readonly string[] | undefined): PromoRole | null {
  if (!roles) return null;
  return SUPPORTED_PROMO_ROLES.find((r) => roles.includes(r)) ?? null;
}

/**
 * Sends the promo-rejection notification at most once per user, including
 * under retries of this fire-and-forget hook. Uses mark_promo_rejection_
 * notified() (migration 20270318000011) — a single atomic UPDATE...WHERE
 * that only succeeds the first time for a given user — rather than a
 * read-then-write check, which would have a race window under concurrent
 * requests. Never throws; a failure here only means the email doesn't go
 * out, it never affects the user's actual request.
 */
async function notifyPromoRejectionOnce(
  supabase: SupabaseClient,
  env: PagesEnv,
  userId: string,
  userEmail: string | undefined,
  rejectionCode: string
): Promise<void> {
  const log = createLogger('promo-redemption');
  if (!userEmail) return;

  try {
    const { data: isFirstNotification, error } = await supabase.rpc('mark_promo_rejection_notified', {
      p_user_id: userId,
    });
    if (error) {
      log.error('promo_notification_dedup_error', error, { userId });
      return;
    }
    if (!isFirstNotification) return; // Already notified — safe no-op, including on retries.

    const reason = REJECTION_REASONS[rejectionCode] || 'it could not be applied to your account';
    const subject = 'About the promo code you entered';
    const text = `Hi,\n\nWe weren't able to apply the promo code you entered: ${reason}.\n\nYour account and registration are unaffected — this only concerns the promotional offer.\n\nIf you believe this is a mistake, please contact support.\n\n— SkillPassport`;
    const html = `<p>Hi,</p><p>We weren't able to apply the promo code you entered: ${reason}.</p><p>Your account and registration are unaffected — this only concerns the promotional offer.</p><p>If you believe this is a mistake, please contact support.</p><p>— SkillPassport</p>`;

    const sent = await sendEmailSafe(env, { to: userEmail, subject, html, text });
    log.info('promo_rejection_notification', { userId, rejectionCode, sent });
  } catch (err) {
    log.error('promo_notification_exception', err, { userId });
  }
}

/**
 * Calls the redeem_promo_code() DB function for a verified user. Never
 * throws — all failures are logged and swallowed, since this is a
 * fire-and-forget call that must never block or fail the caller's actual
 * request. Safe to call repeatedly: the function's own existing-redemption
 * check makes a repeat call a cheap no-op.
 */
export async function redeemPromoCodeForUser(
  supabase: SupabaseClient,
  env: PagesEnv,
  code: string,
  userId: string,
  userEmail: string | undefined,
  role: PromoRole
): Promise<void> {
  const log = createLogger('promo-redemption');
  try {
    const { data, error } = await supabase.rpc('redeem_promo_code', {
      p_code: code,
      p_user_id: userId,
      p_role: role,
    });
    if (error) {
      // Classified as PROMO_REDEMPTION_DB_ERROR per the TSD's api_contract —
      // this is this caller's own classification, not a value the DB
      // function returns. Transient: no notification, retried on the user's
      // next request.
      log.error('promo_redemption_rpc_error', error, { userId });
      return;
    }
    const result = data as Record<string, unknown>;
    log.info('promo_redemption_result', { userId, ...result });

    if (result.success === false && typeof result.code === 'string') {
      await notifyPromoRejectionOnce(supabase, env, userId, userEmail, result.code);
    }
  } catch (err) {
    log.error('promo_redemption_exception', err, { userId });
  }
}

/**
 * Convenience wrapper: reads referralCode from the JWT's user_metadata and
 * resolves the role, skipping entirely (no RPC call) if either is absent.
 * This is the single entry point withAuth() calls.
 */
export async function maybeRedeemPromoCode(
  supabase: SupabaseClient,
  env: PagesEnv,
  userId: string,
  userEmail: string | undefined,
  roles: readonly string[] | undefined,
  userMetadata: Record<string, unknown> | undefined
): Promise<void> {
  const referralCode = userMetadata?.referralCode;
  if (typeof referralCode !== 'string' || referralCode.trim() === '') return;
  const role = resolvePromoRole(roles);
  if (!role) return;
  await redeemPromoCodeForUser(supabase, env, referralCode, userId, userEmail, role);
}
