import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config();

const supabase = createClient(
  process.env.VITE_SUPABASE_URL,
  process.env.VITE_SUPABASE_ANON_KEY
);

async function testEducatorCreation() {
  console.log('=== TESTING EDUCATOR CREATION ===\n');

  const testEmail = 'litikesh@rareminds.in';
  const schoolId = '550e8400-e29b-41d4-a716-446655440000'; // DPS school

  // Check if email already exists
  console.log('1. Checking if email already exists...');
  const { data: existingEducator } = await supabase
    .from('school_educators')
    .select('*')
    .eq('email', testEmail)
    .maybeSingle();

  if (existingEducator) {
    console.log('❌ Email already exists in school_educators:');
    console.log(`   ID: ${existingEducator.id}`);
    console.log(`   Name: ${existingEducator.first_name} ${existingEducator.last_name}`);
    console.log(`   Teacher ID: ${existingEducator.teacher_id}`);
    console.log('\nYou need to use a different email or delete this record first.');
    return;
  }

  console.log('✅ Email is available\n');

  // Step 1: Create user
  console.log('2. Creating user record...');
  const tempUserId = crypto.randomUUID();
  
  const { data: userRecord, error: userError } = await supabase
    .from('users')
    .insert({
      id: tempUserId,
      email: testEmail,
      full_name: 'Litikesh V',
      role: 'educator',
    })
    .select()
    .single();

  if (userError) {
    console.error('❌ Failed to create user:', userError);
    return;
  }

  console.log('✅ User created:', userRecord.id);

  // Step 2: Create educator
  console.log('\n3. Creating educator record...');
  const { data: educator, error: educatorError } = await supabase
    .from('school_educators')
    .insert({
      user_id: tempUserId,
      school_id: schoolId,
      first_name: 'Litikesh',
      last_name: 'V',
      email: testEmail,
      phone_number: '07899044489',
      role: 'subject_teacher',
      onboarding_status: 'active',
      subject_expertise: [
        {
          name: 'Mathematics',
          proficiency: 'expert',
          years_experience: 5
        }
      ]
    })
    .select()
    .single();

  if (educatorError) {
    console.error('❌ Failed to create educator:', educatorError);
    // Rollback
    console.log('Rolling back user creation...');
    await supabase.from('users').delete().eq('id', tempUserId);
    return;
  }

  console.log('✅ Educator created successfully!');
  console.log(`   ID: ${educator.id}`);
  console.log(`   Teacher ID: ${educator.teacher_id}`);
  console.log(`   Name: ${educator.first_name} ${educator.last_name}`);
  console.log(`   Email: ${educator.email}`);
  console.log(`   School ID: ${educator.school_id}`);

  console.log('\n=== SUCCESS ===');
  console.log('The educator has been created and should now appear in the teacher list!');
}

testEducatorCreation().catch(console.error);
