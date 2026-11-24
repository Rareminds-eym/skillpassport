import type { SupabaseClient } from '@supabase/supabase-js';

/** Reflect this exact canonical management result, rather than healing a different
 * subscription when the account has both historical and newer purchases. */
export async function syncManagedSubscriptionStatus(
  supabase: SupabaseClient, userId: string, subscriptionId: string, status: string, canonical: unknown,
): Promise<void> {
  if (!canonical || typeof canonical !== 'object' || !('id' in canonical) || !('status' in canonical)
    || canonical.id !== subscriptionId || canonical.status !== status) {
    throw new Error('Subscription change was not confirmed by the subscription owner');
  }
  const { error } = await supabase.from('subscription_cache').update({ status, synced_at: new Date().toISOString() })
    .eq('id', subscriptionId).eq('user_id', userId).select('id').single();
  if (error) throw new Error('Subscription changed, but its display is still synchronizing. Please refresh.');
}
