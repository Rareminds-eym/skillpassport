// Test the corrected SQL logic
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

async function testCorrectedLogic() {
  console.log('🧪 Testing Corrected SQL Logic...\n');

  try {
    // Test the corrected student data extraction
    console.log('1️⃣ Testing student data extraction...');
    const { data: students, error: studentsError } = await supabase
      .from('students')
      .select('id, name, email, contact_number')
      .limit(3);

    if (studentsError) {
      console.error('❌ Error:', studentsError.message);
      return;
    }

    console.log('✅ Student data extraction works:');
    students.forEach(s => {
      console.log(`  - ${s.name} (${s.email}) - Phone: ${s.contact_number || 'N/A'}`);
    });

    // Test joining applied_jobs with students using direct columns
    console.log('\n2️⃣ Testing applied_jobs + students join...');
    const { data: joinData, error: joinError } = await supabase
      .from('applied_jobs')
      .select(`
        id,
        student_id,
        students:student_id (
          name,
          email,
          contact_number
        )
      `)
      .limit(3);

    if (joinError) {
      console.error('❌ Join error:', joinError.message);
      return;
    }

    console.log('✅ Join works:');
    joinData.forEach(app => {
      const student = app.students;
      console.log(`  - Application ${app.id}: ${student?.name || 'Unknown'} (${student?.email || 'No email'})`);
    });

    console.log('\n🎉 The corrected logic should work! Ready to run the fixed SQL script.');

  } catch (error) {
    console.error('❌ Test error:', error.message);
  }
}

testCorrectedLogic();