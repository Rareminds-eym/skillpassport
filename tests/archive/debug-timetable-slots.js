const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabase = createClient(
  process.env.VITE_SUPABASE_URL,
  process.env.VITE_SUPABASE_ANON_KEY
);

async function debugTimetableSlots() {
  console.log('=== Debugging Timetable Slots ===\n');

  // Get current user
  const { data: { user } } = await supabase.auth.getUser();
  console.log('Current user:', user?.email || 'Not logged in');

  // Check all timetables
  const { data: timetables, error: ttError } = await supabase
    .from('timetables')
    .select('*');
  
  console.log('\n=== All Timetables ===');
  console.log(JSON.stringify(timetables, null, 2));
  console.log('Error:', ttError);

  // Check all slots (without filter)
  const { data: allSlots, error: slotsError } = await supabase
    .from('timetable_slots')
    .select('*');
  
  console.log('\n=== All Timetable Slots ===');
  console.log('Count:', allSlots?.length || 0);
  console.log(JSON.stringify(allSlots, null, 2));
  console.log('Error:', slotsError);

  // Try with joins
  if (allSlots && allSlots.length > 0) {
    const { data: slotsWithJoins, error: joinError } = await supabase
      .from('timetable_slots')
      .select(`
        *,
        school_educators!timetable_slots_educator_id_fkey(first_name, last_name),
        school_classes!timetable_slots_class_id_fkey(name)
      `)
      .limit(5);
    
    console.log('\n=== Slots with Joins ===');
    console.log(JSON.stringify(slotsWithJoins, null, 2));
    console.log('Join Error:', joinError);
  }

  // Check RLS policies
  const { data: policies } = await supabase
    .rpc('exec_sql', { 
      sql: `
        SELECT schemaname, tablename, policyname, permissive, roles, cmd, qual 
        FROM pg_policies 
        WHERE tablename IN ('timetables', 'timetable_slots')
        ORDER BY tablename, policyname;
      `
    })
    .catch(() => ({ data: null }));
  
  if (policies) {
    console.log('\n=== RLS Policies ===');
    console.log(JSON.stringify(policies, null, 2));
  }
}

debugTimetableSlots().catch(console.error);
