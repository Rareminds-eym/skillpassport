import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config();

const supabase = createClient(
  process.env.VITE_SUPABASE_URL,
  process.env.VITE_SUPABASE_ANON_KEY
);

async function testSchoolEducators() {
  console.log('Testing school_educators table...\n');

  // 1. Check if there are any records
  const { data: allEducators, error: allError } = await supabase
    .from('school_educators')
    .select('*');

  if (allError) {
    console.error('Error fetching all educators:', allError);
    return;
  }

  console.log(`Total educators in database: ${allEducators?.length || 0}`);

  if (allEducators && allEducators.length > 0) {
    console.log('\nSample educator record:');
    console.log(JSON.stringify(allEducators[0], null, 2));

    // Group by school_id
    const bySchool = allEducators.reduce((acc, educator) => {
      const schoolId = educator.school_id;
      if (!acc[schoolId]) {
        acc[schoolId] = [];
      }
      acc[schoolId].push(educator);
      return acc;
    }, {});

    console.log('\nEducators by school:');
    Object.entries(bySchool).forEach(([schoolId, educators]) => {
      console.log(`  School ${schoolId}: ${educators.length} educators`);
    });

    // Check schools table
    console.log('\nChecking schools table...');
    const { data: schools, error: schoolsError } = await supabase
      .from('schools')
      .select('id, name, code');

    if (schoolsError) {
      console.error('Error fetching schools:', schoolsError);
    } else {
      console.log(`Total schools: ${schools?.length || 0}`);
      if (schools && schools.length > 0) {
        schools.forEach(school => {
          const educatorCount = bySchool[school.id]?.length || 0;
          console.log(`  ${school.name} (${school.code}): ${educatorCount} educators`);
        });
      }
    }
  } else {
    console.log('\nNo educators found in database!');
    console.log('You need to add educators to the school_educators table.');
  }

  // Test with a specific email (if you know one)
  console.log('\n\nTesting email lookup...');
  const testEmail = 'admin@school.com'; // Change this to your test email
  const { data: educatorByEmail, error: emailError } = await supabase
    .from('school_educators')
    .select('*')
    .eq('email', testEmail)
    .maybeSingle();

  if (emailError) {
    console.error(`Error fetching educator with email ${testEmail}:`, emailError);
  } else if (educatorByEmail) {
    console.log(`Found educator with email ${testEmail}:`);
    console.log(`  Name: ${educatorByEmail.first_name} ${educatorByEmail.last_name}`);
    console.log(`  School ID: ${educatorByEmail.school_id}`);
    console.log(`  Role: ${educatorByEmail.role}`);
  } else {
    console.log(`No educator found with email ${testEmail}`);
  }
}

testSchoolEducators().catch(console.error);
