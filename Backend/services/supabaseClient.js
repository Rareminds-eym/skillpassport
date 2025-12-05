import { createClient } from '@supabase/supabase-js';

// Initialize Supabase client with service role key
// Note: Environment variables are loaded by server.js
// Service role key bypasses RLS policies - use with caution

let supabaseInstance = null;

function getSupabase() {
  if (supabaseInstance) return supabaseInstance;

  const supabaseUrl = process.env.SUPABASE_URL;
  const supabaseServiceKey = process.env.SUPABASE_SERVICE_KEY;

  if (!supabaseUrl || !supabaseServiceKey) {
    console.error('❌ Missing Supabase configuration!');
    console.error('Please set SUPABASE_URL and SUPABASE_SERVICE_KEY in .env file');
    console.error('Debug - All env keys:', Object.keys(process.env).filter(k => k.includes('SUPABASE')));
    throw new Error('Missing Supabase configuration');
  }

  supabaseInstance = createClient(supabaseUrl, supabaseServiceKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false
    }
  });

  return supabaseInstance;
}

// Export a proxy that lazy-loads the client
export const supabase = new Proxy({}, {
  get: (target, prop) => {
    return getSupabase()[prop];
  }
});

// Test connection
export async function testConnection() {
  try {
    const client = getSupabase();
    const { data, error } = await client
      .from('students')
      .select('count')
      .limit(1);

    if (error) throw error;
    console.log('✅ Supabase connection successful');
    return true;
  } catch (error) {
    console.error('❌ Supabase connection failed:', error.message);
    return false;
  }
}

export default supabase;
