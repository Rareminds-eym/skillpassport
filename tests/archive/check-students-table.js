// Check students table structure
import { createClient } from '@supabase/supabase-js';
import { readFileSync } from 'fs';

// Read environment variables
const envContent = readFileSync('.env', 'utf8');
const envVars = {};
envContent.split('\n').forEach(line => {
  const [key, value] = line.split('=');
  if (key && value) {
    envVars[key.trim()] = value.trim().replace(/"/g, '');
  }
});

const supabase = createClient(
  envVars.VITE_SUPABASE_URL,
  envVars.VITE_SUPABASE_ANON_KEY
);

async function checkStudentsTable() {
  console.log('🔍 Checking Students Table Structure...\n');

  try {
    // Check students table structure
    console.log('📊 Checking students table...');
    const { data: students, error: studentsError } = await supabase
      .from('students')
      .select('*')
      .limit(1);

    if (studentsError) {
      console.error('❌ Error querying students:', studentsError.message);
      return;
    }

    if (students && students.length > 0) {
      const columns = Object.keys(students[0]).sort();
      console.log('✅ Available columns in students table:');
      console.log(columns);
      
      // Check what's in the profile field
      const student = students[0];
      console.log('\n📋 Sample student data:');
      console.log('- id:', student.id);
      console.log('- name:', student.name || 'NULL');
      console.log('- email:', student.email || 'NULL');
      console.log('- phone:', student.phone || 'NULL');
      console.log('- profile type:', typeof student.profile);
      
      if (student.profile) {
        console.log('- profile content:', JSON.stringify(student.profile, null, 2));
      }
    } else {
      console.log('⚠️ No data in students table');
    }

    // Also check applied_jobs to see what student_id values we have
    console.log('\n📊 Checking applied_jobs table...');
    const { data: applications, error: appError } = await supabase
      .from('applied_jobs')
      .select('id, student_id')
      .limit(3);

    if (appError) {
      console.error('❌ Error querying applied_jobs:', appError.message);
    } else {
      console.log(`✅ Found ${applications.length} applications`);
      console.log('Sample student_ids:', applications.map(a => a.student_id));
    }

  } catch (error) {
    console.error('❌ Script error:', error.message);
  }
}

checkStudentsTable();