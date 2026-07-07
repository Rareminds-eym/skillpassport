import { createClient } from '@supabase/supabase-js';
import type { AppDatabase } from '@rareminds-eym/supabase-typegen/types/app.generated';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;


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
