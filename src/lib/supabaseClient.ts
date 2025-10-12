import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL as string | undefined;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY as string | undefined;

if (!supabaseUrl || !supabaseAnonKey) {
  // eslint-disable-next-line no-console
  console.warn('Supabase credentials are not set. Please configure VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY in your .env');
}

export const supabase = createClient(supabaseUrl || '', supabaseAnonKey || '');
