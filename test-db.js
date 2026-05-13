import { createClient } from '@supabase/supabase-js';
const supabase = createClient(
  'https://gdgegctwcubwlhztyyag.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImdkZ2VnY3R3Y3Vid2xoenR5eWFnIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3MjUyOTczNiwiZXhwIjoyMDg4MTA1NzM2fQ.4_N83lrIpRvLcfACsY0Qv6o7QVqIyDzU1wZ1nAnBtkQ'
);
async function run() {
  const { data: d4, error: e4 } = await supabase.from('learners').select('*').eq('user_id', 'cb329434-ebdf-49a9-9f6a-0d79a9b890d2');
  console.log("By user_id:", JSON.stringify(d4), e4);

  const { data: d5, error: e5 } = await supabase.from('learners').select('*').ilike('email', '%gokul%');
  console.log("By email:", JSON.stringify(d5), e5);
}
run();
