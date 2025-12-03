/**
 * Create authentication accounts for students
 * This creates entries in auth.users with passwords
 */

import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config();

// MUST use service role key to create auth users
const supabase = createClient(
  process.env.VITE_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY // Required for admin operations
);

const students = [
  {
    id: 'u1111111-1111-1111-1111-111111111111',
    email: 'rahul.kumar@example.com',
    password: 'Student@123',
    name: 'Rahul Kumar',
    role: 'student'
  },
  {
    id: 'u2222222-2222-2222-2222-222222222222',
    email: 'priya.sharma@example.com',
    password: 'Student@123',
    name: 'Priya Sharma',
    role: 'student'
  },
  {
    id: 'u3333333-3333-3333-3333-333333333333',
    email: 'arjun.patel@example.com',
    password: 'Student@123',
    name: 'Arjun Patel',
    role: 'student'
  }
];

async function createAuthAccounts() {
  console.log('🔐 Creating authentication accounts for students...\n');

  if (!process.env.SUPABASE_SERVICE_ROLE_KEY) {
    console.error('❌ ERROR: SUPABASE_SERVICE_ROLE_KEY not found in .env');
    console.log('   Add this to your .env file:');
    console.log('   SUPABASE_SERVICE_ROLE_KEY=your-service-role-key');
    console.log('\n   Find it in: Supabase Dashboard → Settings → API → service_role key');
    process.exit(1);
  }

  let successCount = 0;
  let errorCount = 0;

  for (const student of students) {
    try {
      console.log(`Creating account for: ${student.name} (${student.email})`);

      // Create auth user using admin API
      const { data: authData, error: authError } = await supabase.auth.admin.createUser({
        email: student.email,
        password: student.password,
        email_confirm: true, // Auto-confirm email
        user_metadata: {
          name: student.name,
          role: student.role
        }
      });

      if (authError) {
        console.error(`   ❌ Error: ${authError.message}`);
        errorCount++;
        continue;
      }

      console.log(`   ✅ Auth user created: ${authData.user.id}`);

      // Update users table with auth user ID
      const { error: updateError } = await supabase
        .from('users')
        .update({ id: authData.user.id })
        .eq('email', student.email);

      if (updateError) {
        console.error(`   ⚠️  Warning: Could not update users table: ${updateError.message}`);
      } else {
        console.log(`   ✅ Users table updated`);
      }

      // Update students table with auth user ID
      const { error: studentUpdateError } = await supabase
        .from('students')
        .update({ user_id: authData.user.id })
        .eq('email', student.email);

      if (studentUpdateError) {
        console.error(`   ⚠️  Warning: Could not update students table: ${studentUpdateError.message}`);
      } else {
        console.log(`   ✅ Students table updated`);
      }

      successCount++;
      console.log('');

    } catch (error) {
      console.error(`   ❌ Unexpected error: ${error.message}`);
      errorCount++;
    }
  }

  console.log('\n' + '='.repeat(50));
  console.log('📊 Summary');
  console.log('='.repeat(50));
  console.log(`✅ Successfully created: ${successCount}`);
  console.log(`❌ Errors: ${errorCount}`);
  console.log(`📝 Total processed: ${students.length}`);

  if (successCount > 0) {
    console.log('\n🎉 Students can now log in with:');
    console.log('   Email: [their email]');
    console.log('   Password: Student@123');
  }
}

// Run the script
createAuthAccounts()
  .then(() => {
    console.log('\n✨ Complete!');
    process.exit(0);
  })
  .catch((error) => {
    console.error('\n💥 Fatal error:', error);
    process.exit(1);
  });
