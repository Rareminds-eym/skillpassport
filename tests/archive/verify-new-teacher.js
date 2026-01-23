import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config();

const supabase = createClient(
  process.env.VITE_SUPABASE_URL,
  process.env.VITE_SUPABASE_ANON_KEY
);

async function verifyNewTeacher() {
  console.log('=== VERIFYING NEW TEACHER ===\n');

  const teacherId = 'DEL-T-0003';
  const email = 'karthi@rareminds.in';

  // Check by teacher_id
  console.log(`1. Looking for teacher with ID: ${teacherId}`);
  const { data: byId, error: idError } = await supabase
    .from('school_educators')
    .select('*')
    .eq('teacher_id', teacherId)
    .maybeSingle();

  if (idError) {
    console.error('Error:', idError);
  }

  if (byId) {
    console.log('✅ Found teacher by ID:');
    console.log(`   Name: ${byId.first_name} ${byId.last_name}`);
    console.log(`   Email: ${byId.email}`);
    console.log(`   Teacher ID: ${byId.teacher_id}`);
    console.log(`   School ID: ${byId.school_id}`);
    console.log(`   Role: ${byId.role}`);
    console.log(`   Status: ${byId.onboarding_status}`);
    console.log(`   User ID: ${byId.user_id}`);
    
    if (byId.metadata) {
      console.log('\n   Metadata:');
      console.log(`   - Temporary Password: ${byId.metadata.temporary_password || 'Not saved'}`);
      console.log(`   - Created At: ${byId.metadata.password_created_at || 'N/A'}`);
      console.log(`   - Created By: ${byId.metadata.created_by || 'N/A'}`);
    } else {
      console.log('\n   ⚠️  No metadata found');
    }

    if (byId.subject_expertise && byId.subject_expertise.length > 0) {
      console.log('\n   Subjects:');
      byId.subject_expertise.forEach((subject, idx) => {
        console.log(`   ${idx + 1}. ${subject.name} - ${subject.proficiency} (${subject.years_experience} years)`);
      });
    }
  } else {
    console.log('❌ Teacher not found by ID');
  }

  // Check by email
  console.log(`\n2. Looking for teacher with email: ${email}`);
  const { data: byEmail, error: emailError } = await supabase
    .from('school_educators')
    .select('*')
    .eq('email', email)
    .maybeSingle();

  if (byEmail) {
    console.log('✅ Found teacher by email');
  } else {
    console.log('❌ Teacher not found by email');
  }

  // Check if user exists in users table
  if (byId?.user_id) {
    console.log(`\n3. Checking users table for user_id: ${byId.user_id}`);
    const { data: user, error: userError } = await supabase
      .from('users')
      .select('*')
      .eq('id', byId.user_id)
      .maybeSingle();

    if (user) {
      console.log('✅ User record exists:');
      console.log(`   Email: ${user.email}`);
      console.log(`   Role: ${user.role}`);
    } else {
      console.log('❌ User record not found');
    }
  }

  // Check all teachers in the school
  if (byId?.school_id) {
    console.log(`\n4. All teachers in school ${byId.school_id}:`);
    const { data: allTeachers } = await supabase
      .from('school_educators')
      .select('teacher_id, first_name, last_name, email, role, onboarding_status')
      .eq('school_id', byId.school_id)
      .order('created_at', { ascending: false });

    if (allTeachers) {
      allTeachers.forEach((teacher, idx) => {
        console.log(`   ${idx + 1}. ${teacher.teacher_id} - ${teacher.first_name} ${teacher.last_name} (${teacher.email}) - ${teacher.role} - ${teacher.onboarding_status}`);
      });
    }
  }

  console.log('\n=== VERIFICATION COMPLETE ===');
}

verifyNewTeacher().catch(console.error);
