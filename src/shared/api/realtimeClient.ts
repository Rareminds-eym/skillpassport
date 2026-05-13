/**
 * Realtime Client
 *
 * Provides a Supabase Realtime client authenticated via a short-lived token
 * from the /api/realtime-token endpoint. The token is refreshed automatically
 * before expiry.
 *
 * Usage:
 *   const client = await getRealtimeClient();
 *   client.channel('my-channel').on('postgres_changes', ...).subscribe();
 */
import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { apiGet } from './apiClient';

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL || '';
const SUPABASE_ANON_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY || '';

/** Buffer before expiry to trigger refresh (30 seconds) */
const REFRESH_BUFFER_MS = 30_000;

interface RealtimeToken {
  token: string;
  expires_in: number;
}

let realtimeClient: SupabaseClient | null = null;
let refreshTimer: ReturnType<typeof setTimeout> | null = null;

/**
 * Fetch a fresh realtime token from the Pages Function endpoint.
 */
async function fetchRealtimeToken(): Promise<RealtimeToken> {
  return apiGet<RealtimeToken>('/realtime-token');
}

/**
 * Schedule automatic token refresh before expiry.
 */
function scheduleRefresh(expiresIn: number) {
  if (refreshTimer) clearTimeout(refreshTimer);

  const refreshMs = Math.max((expiresIn * 1000) - REFRESH_BUFFER_MS, 10_000);

  refreshTimer = setTimeout(async () => {
    try {
      const { token, expires_in } = await fetchRealtimeToken();
      if (realtimeClient) {
        await realtimeClient.realtime.setAuth(token);
      }
      scheduleRefresh(expires_in);
    } catch {
      // Token refresh failed — subscriptions will disconnect on expiry.
      // The next getRealtimeClient() call will re-establish.
    }
  }, refreshMs);
}

/**
 * Get or create the authenticated Supabase Realtime client.
 * Fetches a short-lived token and configures the client.
 * Subsequent calls return the same client instance (singleton).
 */
export async function getRealtimeClient(): Promise<SupabaseClient> {
  const { token, expires_in } = await fetchRealtimeToken();

  if (!realtimeClient) {
    realtimeClient = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
      auth: { persistSession: false, autoRefreshToken: false },
      realtime: { params: { apikey: token } },
    });
  }

  // Update the token (handles both initial and refresh cases)
  await realtimeClient.realtime.setAuth(token);
  scheduleRefresh(expires_in);

  return realtimeClient;
}

/**
 * Disconnect and clean up the realtime client.
 * Call this on logout to prevent stale subscriptions.
 */
export function destroyRealtimeClient() {
  if (refreshTimer) {
    clearTimeout(refreshTimer);
    refreshTimer = null;
  }
  if (realtimeClient) {
    realtimeClient.removeAllChannels();
    realtimeClient = null;
  }
}
