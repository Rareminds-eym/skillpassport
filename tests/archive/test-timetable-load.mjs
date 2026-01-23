import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config();

const supabase = createClient(process.env.VITE_SUPABASE_URL, process.env.VITE_SUPABASE_ANON_KEY);

async function testTimetableLoad() {
  console.log('=== Testing Timetable Load Issue ===\n');

  // 1. Check current user
  const { data: { user } } = await supabase.auth.getUser();
  console.log('Current user:', user?.email || 'Not logged in');

  if (!user) {
    console.log('❌ No user logged in. Please login first.');
    return;
  }

  // 2. Get user role and school_id
  const { data: userData } = await supabase
    .from("users")
    .select("role")
    .eq("id", user.id)
    .single();

  console.log('User role:', userData?.role);

  let schoolId = null;

  if (userData?.role === "school_admin") {
    const { data: schoolData } = await supabase
      .from("schools")
      .select("id")
      .eq("created_by", user.id)
      .maybeSingle();
    schoolId = schoolData?.id;
  } else if (userData?.role === "school_educator") {
    const { data: educatorData } = await supabase
      .from("school_educators")
      .select("school_id")
      .eq("user_id", user.id)
      .maybeSingle();
    schoolId = educatorData?.school_id;
  }

  console.log('School ID:', schoolId);

  if (!schoolId) {
    console.log('❌ No school_id found');
    return;
  }

  // 3. Check timetables for this school
  const currentYear = new Date().getFullYear();
  const { data: timetables, error: ttError } = await supabase
    .from('timetables')
    .select('*')
    .eq('school_id', schoolId);
  
  console.log('\n=== Timetables for school ===');
  console.log(JSON.stringify(timetables, null, 2));
  console.log('Error:', ttError);

  // 4. Get current year timetable
  const { data: currentTimetable } = await supabase
    .from("timetables")
    .select("id, status, school_id")
    .eq("school_id", schoolId)
    .eq("academic_year", `${currentYear}-${currentYear + 1}`)
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  console.log('\n=== Current Year Timetable ===');
  console.log(JSON.stringify(currentTimetable, null, 2));

  if (!currentTimetable) {
    console.log('❌ No timetable found for current year');
    return;
  }

  // 5. Check all slots (without filter)
  const { data: allSlots, error: slotsError } = await supabase
    .from('timetable_slots')
    .select('*');
  
  console.log('\n=== All Timetable Slots (no filter) ===');
  console.log('Count:', allSlots?.length || 0);
  console.log(JSON.stringify(allSlots, null, 2));
  console.log('Error:', slotsError);

  // 6. Try loading slots for this timetable (exact query from component)
  const { data: slots, error } = await supabase
    .from("timetable_slots")
    .select(`
      *,
      school_educators!timetable_slots_educator_id_fkey(first_name, last_name),
      school_classes!timetable_slots_class_id_fkey(name)
    `)
    .eq("timetable_id", currentTimetable.id)
    .order("day_of_week")
    .order("period_number");
  
  console.log('\n=== Slots for Current Timetable (with joins) ===');
  console.log('Timetable ID:', currentTimetable.id);
  console.log('Slots count:', slots?.length || 0);
  console.log('Query error:', error);
  console.log('Slots data:', JSON.stringify(slots, null, 2));

  // 7. Check if foreign keys exist
  if (slots && slots.length > 0) {
    console.log('\n=== Checking Foreign Key References ===');
    for (const slot of slots) {
      console.log(`\nSlot ID: ${slot.id}`);
      console.log(`  educator_id: ${slot.educator_id}`);
      console.log(`  class_id: ${slot.class_id}`);
      console.log(`  day_of_week: ${slot.day_of_week}`);
      console.log(`  period_number: ${slot.period_number}`);
      
      // Check if educator exists
      const { data: educator } = await supabase
        .from('school_educators')
        .select('id, first_name, last_name')
        .eq('id', slot.educator_id)
        .maybeSingle();
      console.log(`  Educator found:`, educator ? `${educator.first_name} ${educator.last_name}` : '❌ NOT FOUND');
      
      // Check if class exists
      const { data: classData } = await supabase
        .from('school_classes')
        .select('id, name')
        .eq('id', slot.class_id)
        .maybeSingle();
      console.log(`  Class found:`, classData ? classData.name : '❌ NOT FOUND');
    }
  }

  // 8. Check RLS policies
  console.log('\n=== Checking RLS Policies ===');
  const { data: policies, error: policyError } = await supabase
    .rpc('exec_sql', { 
      sql: `
        SELECT schemaname, tablename, policyname, permissive, roles, cmd, qual 
        FROM pg_policies 
        WHERE tablename IN ('timetables', 'timetable_slots')
        ORDER BY tablename, policyname;
      `
    })
    .catch(() => ({ data: null, error: 'RPC not available' }));
  
  if (policies) {
    console.log(JSON.stringify(policies, null, 2));
  } else {
    console.log('Could not fetch RLS policies:', policyError);
  }
}

testTimetableLoad().catch(console.error);
