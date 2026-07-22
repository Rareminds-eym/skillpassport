import { createClient } from '@supabase/supabase-js';
import type { AppDatabase } from '@rareminds-eym/supabase-typegen/types/app.generated';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;


// Type-safe Supabase client with full AppDatabase types
// This provides autocomplete and type checking for all database operations
// NOTE: persistSession is disabled because authentication is handled via SSO
export const supabase = createClient<AppDatabase>(
  supabaseUrl,
  supabaseAnonKey,
  {
    auth: {
      persistSession: false,  // SSO-only auth - do not persist sessions locally
      autoRefreshToken: false, // Token refresh handled by SSO service
      detectSessionInUrl: false // Session detection not used
    }
  }
);
