// Remove all addons for Gokul - using correct table names
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  'https://dpooleduinyyzxgrcwko.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImRwb29sZWR1aW55eXp4Z3Jjd2tvIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1OTk5NDY5OCwiZXhwIjoyMDc1NTcwNjk4fQ.WIrwkA_-2oCjwmD6WpCf9N38hYXEwrIIXXHB4x5km10'
);

const learnerId = '95364f0d-23fb-4616-b0f4-48caafee5439';

async function removeAddons() {
  console.log('🔍 Finding all addon-related records for Gokul\n');

  // Check user_entitlements table (stores addon access)
  const { data: entitlements, error: entErr } = await supabase
    .from('user_entitlements')
    .select('*')
    .eq('user_id', learnerId);

  if (!entErr) {
    console.log('Found user_entitlements:', entitlements?.length || 0);
    if (entitlements?.length) console.log(JSON.stringify(entitlements, null, 2));
  } else {
    console.log('user_entitlements error:', entErr.message);
  }

  console.log('\n=== DELETING ADDON RECORDS ===\n');

  // Delete user_entitlements
  if (entitlements?.length) {
    const { error } = await supabase.from('user_entitlements').delete().eq('user_id', learnerId);
    console.log('Deleted user_entitlements:', error ? error.message : '✅ Success');
  } else {
    console.log('No user_entitlements to delete');
  }

  // Verify
  console.log('\n=== VERIFICATION ===');
  const { data: remainingEnt } = await supabase.from('user_entitlements').select('id').eq('user_id', learnerId);
  console.log('Remaining user_entitlements:', remainingEnt?.length || 0);

  console.log('\n✅ Done!');
}

removeAddons();
