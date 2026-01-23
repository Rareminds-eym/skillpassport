const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabase = createClient(process.env.VITE_SUPABASE_URL, process.env.VITE_SUPABASE_ANON_KEY);

async function debugTimetableLoad() {
  console.log('=== Debugging Timetable Load Issue ===\n');

  // 1. Check current user
  const { data: { user } } = await supabase.auth.getUser();
  console.log('Current user:', user?.id);

  // 2. Check all timetables
  const { data: timetables } = await supabase
    .from('timetables')
    .select('*');
  
  console.log('\nAll timetables:', JSON.stringify(timetables, null, 2));

  // 3. Check all slots (without filter)
  const { data: allSlots, error: slotsError } = await supabase
    .from('timetable_slots')
    .select('*');
  
  console.log('\nAll slots count:', allSlots?.length);
  console.log('Slots error:', slotsError);
  console.log('Sample slots:', JSON.stringify(allSlots?.slice(0, 2), null, 2));

  // 4. Try the exact query from the component
  const currentYear = new Date().getFullYear();
  const { data: existing } = await supabase
    .from("timetables")
    .select("id, status")
    .eq("academic_year", `${currentYear}-${currentYear + 1}`)
    .single();

  console.log('\nCurrent year timetable:', existing);

  if (existing) {
    // 5. Try loading slots for this timetable
    const { data: slots, error } = await supabase
      .from("timetable_slots")
      .select(`
        *,
        school_educators!timetable_slots_educator_id_fkey(first_name, last_name),
        school_classes!timetable_slots_class_id_fkey(name)
      `)
      .eq("timetable_id", existing.id);
    
    console.log('\nSlots for timetable:', slots?.length);
    console.log('Query error:', error);
    console.log('Sample slot with joins:', JSON.stringify(slots?.[0], null, 2));
  }

  // 6. Check RLS policies
  const { data: policies } = await supabase.rpc('exec_sql', {
    sql: `
      SELECT schemaname, tablename, policyname, permissive, roles, cmd, qual 
      FROM pg_policies 
      WHERE tablename IN ('timetables', 'timetable_slots')
      ORDER BY tablename, policyname;
    `
  }).catch(() => ({ data: null }));

  console.log('\nRLS Policies:', policies);
}

debugTimetableLoad().catch(console.error);
