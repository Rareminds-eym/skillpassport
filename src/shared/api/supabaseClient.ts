import { createClient } from '@supabase/supabase-js';
import type { AppDatabase } from '@rareminds-eym/supabase-typegen/types/app.generated';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

// Security check: Prevent accidental service role key exposure in browser
if (import.meta.env.VITE_SUPABASE_SERVICE_ROLE_KEY) {
  throw new Error(
    '🚨 SECURITY ERROR: Service role key detected in browser environment!\n' +
    'Service role keys bypass Row Level Security and should NEVER be exposed to browsers.\n' +
    'Only use VITE_SUPABASE_ANON_KEY in frontend code.\n' +
    'Check your .env files and remove VITE_SUPABASE_SERVICE_ROLE_KEY.'
  );
}

// Type-safe Supabase client with full AppDatabase types
// This provides autocomplete and type checking for all database operations
export const supabase = createClient<AppDatabase>(
  supabaseUrl, 
  supabaseAnonKey,
  {
    auth: {
      persistSession: true,
      autoRefreshToken: true,
      detectSessionInUrl: true
    }
  }
);
