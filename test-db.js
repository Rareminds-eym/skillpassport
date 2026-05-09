import { createClient } from '@supabase/supabase-js';
const supabase = createClient(
  'https://dpooleduinyyzxgrcwko.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImRwb29sZWR1aW55eXp4Z3Jjd2tvIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1OTk5NDY5OCwiZXhwIjoyMDc1NTcwNjk4fQ.WIrwkA_-2oCjwmD6WpCf9N38hYXEwrIIXXHB4x5km10'
);
async function run() {
  const { data, error } = await supabase.from('learners').select('id, email, user_id').ilike('email', '%gokul%');
  console.log("Results:", JSON.stringify(data, null, 2));
  console.log("Error:", error);
  
  const { data: byUser, error: err2 } = await supabase.from('learners').select('*').eq('user_id', 'cb329434-ebdf-49a9-9f6a-0d79a9b890d2');
  console.log("By User ID results:", JSON.stringify(byUser, null, 2));
}
run();
