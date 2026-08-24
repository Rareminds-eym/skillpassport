import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;


// Authentication remains SSO-only; database typing now uses Supabase's native defaults.
// NOTE: persistSession is disabled because authentication is handled via SSO
export const supabase = createClient(
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
