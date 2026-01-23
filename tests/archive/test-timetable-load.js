const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabase = createClient(process.env.VITE_SUPABASE_URL, process.env.VITE_SUPABASE_ANON_KEY);

async function testJoins() {
  console.log('Testing timetable slots with joins...\n');
  
  const { data, error } = await supabase
    .from('timetable_slots')
    .select(`
      *,
      school_educators!timetable_slots_educator_id_fkey(first_name, last_name),
      school_classes!timetable_slots_class_id_fkey(name)
    `)
    .limit(3);
  
  console.log('Joined data:', JSON.stringify(data, null, 2));
  console.log('Error:', error);
}

testJoins();
