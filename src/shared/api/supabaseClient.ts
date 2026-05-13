import { createClient } from '@supabase/supabase-js';
import { getLogger } from '@/shared/config/logging';

const logger = getLogger('supabase-client');

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL as string | undefined;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY as string | undefined;

if (!supabaseUrl || !supabaseAnonKey) {
  logger.warn('Supabase URL or Anon Key not configured');
}

/**
 * Supabase client — DATA ONLY.
 *
 * Auth is disabled. All authentication is handled by the SSO Worker
 * via @rareminds-eym/auth-client (ssoClient).
 *
 * This client is used ONLY for:
 * - Public/anonymous reads (if any exist)
 * - Legacy code that hasn't been migrated to apiClient yet
 *
 * Authenticated data access should go through:
 * - apiClient (shared/api/apiClient.ts) for CRUD via Pages Functions
 * - realtimeClient (shared/api/realtimeClient.ts) for subscriptions
 * - storageClient (shared/api/storageClient.ts) for file uploads
 */
export const supabase = createClient(supabaseUrl || '', supabaseAnonKey || '', {
  auth: {
    persistSession: false,
    autoRefreshToken: false,
    detectSessionInUrl: false,
  },
  global: {
    headers: {
      'Accept': 'application/json',
      'Content-Type': 'application/json',
    },
  },
});
