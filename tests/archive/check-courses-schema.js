import { createClient } from '@supabase/supabase-js';
import 'dotenv/config';

const supabase = createClient(
  process.env.VITE_SUPABASE_URL,
  process.env.VITE_SUPABASE_ANON_KEY
);

const { data, error } = await supabase
  .from('courses')
  .select('*')
  .limit(1);

if (error) {
  console.error('Error:', error);
} else {
  console.log('Course columns:', Object.keys(data[0]));
}
