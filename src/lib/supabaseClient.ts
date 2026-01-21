import { createClient } from '@supabase/supabase-js';
import { secureStorage } from './secureStorage';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL as string | undefined;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY as string | undefined;

// Debug logging for Supabase initialization
console.log(
  '[SUPABASE INIT] URL configured:',
  !!supabaseUrl,
  supabaseUrl?.substring(0, 30) + '...'
);
console.log(
  '[SUPABASE INIT] Anon key configured:',
  !!supabaseAnonKey,
  supabaseAnonKey?.substring(0, 20) + '...'
);

if (!supabaseUrl || !supabaseAnonKey) {
  console.warn('Supabase URL or Anon Key not configured');
}

export const supabase = createClient(supabaseUrl || '', supabaseAnonKey || '', {
  auth: {
    persistSession: true,
    storageKey: 'sb-auth',
    storage: secureStorage, // Uses encrypted storage instead of plain localStorage
    autoRefreshToken: true,
    detectSessionInUrl: true,
  },
  global: {
    headers: {
      Accept: 'application/json',
      'Content-Type': 'application/json',
    },
  },
});

console.log('[SUPABASE INIT] Client created successfully');
