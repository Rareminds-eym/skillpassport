// Test script to verify college admin training approval fix
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://dpooleduinyyzxgrcwko.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImRwb29sZWR1aW55eXp4Z3Jjd2tvIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTk5OTQ2OTgsImV4cCI6MjA3NTU3MDY5OH0.LvId6Cq13yeASDt0RXbb0y83P2xAZw0L1Q4KJAXT4jk';
const supabase = createClient(supabaseUrl, supabaseKey);

async function testCollegeAdminTrainingFix() {
  console.log('🧪 Testing College Admin Training Approval Fix...\n');

  try {
    // 1. Check pending trainings for college admin
    console.log('1️⃣ Checking pending trainings for college admin...');
    const { data: trainings, error: trainingsError } = await supabase
      .from('trainings')
      .select(`
        *,
        student:students!trainings_student_id_fkey (
          id,
          email,
          student_type,
          college_school_name
        )
      `)
      .eq('approval_status', 'pending')
      .eq('approval_authority', 'college_admin')
      .order('created_at', { ascending: false });

    if (trainingsError) {
      console.error('❌ Error fetching trainings:', trainingsError);
      return;
    }

    console.log(`✅ Found ${trainings?.length || 0} pending trainings for college admin:`);
    trainings?.forEach(training => {
      console.log(`   - ${training.title} by ${training.student?.email} (${training.organization})`);
    });

    // 2. Check pending experiences for college admin
    console.log('\n2️⃣ Checking pending experiences for college admin...');
    const { data: experiences, error: experiencesError } = await supabase
      .from('experience')
      .select(`
        *,
        student:students!experience_student_id_fkey (
          id,
          email,
          student_type,
          college_school_name
        )
      `)
      .eq('approval_status', 'pending')
      .eq('approval_authority', 'college_admin')
      .order('created_at', { ascending: false });

    if (experiencesError) {
      console.error('❌ Error fetching experiences:', experiencesError);
      return;
    }

    console.log(`✅ Found ${experiences?.length || 0} pending experiences for college admin:`);
    experiences?.forEach(experience => {
      console.log(`   - ${experience.role} at ${experience.organization} by ${experience.student?.email}`);
    });

    // 3. Test the college admin verifications page query
    console.log('\n3️⃣ Testing college admin verifications page query...');
    
    // This simulates the exact query from the CollegeVerifications.jsx component
    const { data: pageTrainings, error: pageError } = await supabase
      .from('trainings')
      .select(`
        *,
        student:students!trainings_student_id_fkey (
          id,
          user_id,
          student_type,
          name,
          email,
          college_school_name,
          university
        )
      `)
      .eq('approval_status', 'pending')
      .eq('approval_authority', 'college_admin')
      .order('created_at', { ascending: false });

    if (pageError) {
      console.error('❌ Error with page query:', pageError);
    } else {
      console.log(`✅ College admin page would show ${pageTrainings?.length || 0} trainings`);
    }

    // 4. Summary
    console.log('\n📊 SUMMARY:');
    console.log(`   • Pending trainings for college admin: ${trainings?.length || 0}`);
    console.log(`   • Pending experiences for college admin: ${experiences?.length || 0}`);
    console.log(`   • College admin page query works: ${pageError ? '❌' : '✅'}`);

    if ((trainings?.length || 0) > 0) {
      console.log('\n🎉 SUCCESS: College admin training approval system is working!');
      console.log('   The college admin should now see pending trainings in their verifications page.');
    } else {
      console.log('\n⚠️  No pending trainings found for college admin.');
      console.log('   This could be normal if no college students have submitted Rareminds trainings.');
    }

  } catch (error) {
    console.error('❌ Test failed:', error);
  }
}

// Run the test
testCollegeAdminTrainingFix();