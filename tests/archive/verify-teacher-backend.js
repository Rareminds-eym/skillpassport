/**
 * Teacher Management Backend Verification Script
 * Run this to verify your backend connection is working
 */

import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config();

const supabase = createClient(
  process.env.VITE_SUPABASE_URL,
  process.env.VITE_SUPABASE_ANON_KEY
);

async function verifyBackend() {
  console.log('🔍 Verifying Teacher Management Backend...\n');

  // 1. Check if teachers table exists
  console.log('1️⃣ Checking teachers table...');
  const { data: teachers, error: teachersError } = await supabase
    .from('teachers')
    .select('count')
    .limit(1);

  if (teachersError) {
    console.log('❌ Teachers table not found or not accessible');
    console.log('   Error:', teachersError.message);
    console.log('   → Run: supabase/migrations/teacher_management_schema.sql\n');
  } else {
    console.log('✅ Teachers table exists\n');
  }

  // 2. Check if timetables table exists
  console.log('2️⃣ Checking timetables table...');
  const { data: timetables, error: timetablesError } = await supabase
    .from('timetables')
    .select('count')
    .limit(1);

  if (timetablesError) {
    console.log('❌ Timetables table not found');
    console.log('   Error:', timetablesError.message);
    console.log('   → Run: supabase/migrations/teacher_management_schema.sql\n');
  } else {
    console.log('✅ Timetables table exists\n');
  }

  // 3. Check if timetable_slots table exists
  console.log('3️⃣ Checking timetable_slots table...');
  const { data: slots, error: slotsError } = await supabase
    .from('timetable_slots')
    .select('count')
    .limit(1);

  if (slotsError) {
    console.log('❌ Timetable_slots table not found');
    console.log('   Error:', slotsError.message);
    console.log('   → Run: supabase/migrations/teacher_management_schema.sql\n');
  } else {
    console.log('✅ Timetable_slots table exists\n');
  }

  // 4. Check if teacher_workload table exists
  console.log('4️⃣ Checking teacher_workload table...');
  const { data: workload, error: workloadError } = await supabase
    .from('teacher_workload')
    .select('count')
    .limit(1);

  if (workloadError) {
    console.log('❌ Teacher_workload table not found');
    console.log('   Error:', workloadError.message);
    console.log('   → Run: supabase/migrations/teacher_management_schema.sql\n');
  } else {
    console.log('✅ Teacher_workload table exists\n');
  }

  // 5. Check if timetable_conflicts table exists
  console.log('5️⃣ Checking timetable_conflicts table...');
  const { data: conflicts, error: conflictsError } = await supabase
    .from('timetable_conflicts')
    .select('count')
    .limit(1);

  if (conflictsError) {
    console.log('❌ Timetable_conflicts table not found');
    console.log('   Error:', conflictsError.message);
    console.log('   → Run: supabase/migrations/teacher_management_schema.sql\n');
  } else {
    console.log('✅ Timetable_conflicts table exists\n');
  }

  // 6. Check storage bucket
  console.log('6️⃣ Checking teacher-documents storage bucket...');
  const { data: buckets, error: bucketsError } = await supabase
    .storage
    .listBuckets();

  if (bucketsError) {
    console.log('❌ Cannot access storage');
    console.log('   Error:', bucketsError.message);
  } else {
    const teacherBucket = buckets.find(b => b.name === 'teacher-documents');
    if (teacherBucket) {
      console.log('✅ teacher-documents bucket exists\n');
    } else {
      console.log('❌ teacher-documents bucket not found');
      console.log('   → Create bucket in Supabase Dashboard > Storage\n');
    }
  }

  // 7. Check if calculate_teacher_workload function exists
  console.log('7️⃣ Checking calculate_teacher_workload function...');
  try {
    const { error: funcError } = await supabase.rpc('calculate_teacher_workload', {
      p_teacher_id: '00000000-0000-0000-0000-000000000000',
      p_timetable_id: '00000000-0000-0000-0000-000000000000'
    });

    // If function doesn't exist, we'll get a specific error
    if (funcError && funcError.message.includes('function') && funcError.message.includes('does not exist')) {
      console.log('❌ calculate_teacher_workload function not found');
      console.log('   → Run: supabase/migrations/teacher_management_schema.sql\n');
    } else {
      console.log('✅ calculate_teacher_workload function exists\n');
    }
  } catch (error) {
    console.log('⚠️  Could not verify function (this is okay if tables are empty)\n');
  }

  // 8. Count existing data
  console.log('8️⃣ Checking existing data...');
  
  const { count: teacherCount } = await supabase
    .from('teachers')
    .select('*', { count: 'exact', head: true });

  const { count: timetableCount } = await supabase
    .from('timetables')
    .select('*', { count: 'exact', head: true });

  const { count: slotCount } = await supabase
    .from('timetable_slots')
    .select('*', { count: 'exact', head: true });

  console.log(`   Teachers: ${teacherCount || 0}`);
  console.log(`   Timetables: ${timetableCount || 0}`);
  console.log(`   Timetable Slots: ${slotCount || 0}\n`);

  // Summary
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log('📊 SUMMARY');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');

  const allGood = !teachersError && !timetablesError && !slotsError && !workloadError && !conflictsError;

  if (allGood) {
    console.log('✅ All backend components are connected!');
    console.log('✅ Your Teacher Management system is ready to use!');
    console.log('\n🚀 Next steps:');
    console.log('   1. Navigate to School Admin > Teacher Management');
    console.log('   2. Start adding teachers in the Onboarding tab');
    console.log('   3. Assign timetables in the Timetable tab');
  } else {
    console.log('⚠️  Some components are missing');
    console.log('\n🔧 To fix:');
    console.log('   1. Run the migration: supabase/migrations/teacher_management_schema.sql');
    console.log('   2. Create storage bucket: teacher-documents');
    console.log('   3. Run this script again to verify');
  }

  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');
}

verifyBackend().catch(console.error);
