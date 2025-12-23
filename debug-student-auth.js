/**
 * Debug Student Authentication Issue
 * 
 * Run this in the browser console to debug the "No student ID available" error
 * 
 * Usage:
 *   1. Open browser console (F12)
 *   2. Copy and paste this entire script
 *   3. Run: debugStudentAuth()
 */

async function debugStudentAuth() {
  console.log('🔍 Debugging Student Authentication Issue...\n');

  // Check localStorage for user email
  const userEmail = localStorage.getItem('userEmail');
  console.log('📧 Email from localStorage:', userEmail);

  if (!userEmail) {
    console.error('❌ No userEmail found in localStorage!');
    console.log('💡 Solutions:');
    console.log('   1. Make sure you are logged in');
    console.log('   2. Check if login process sets userEmail in localStorage');
    console.log('   3. Try logging out and logging back in');
    return;
  }

  // Check if supabase is available
  if (typeof supabase === 'undefined') {
    console.error('❌ Supabase client not available in console');
    console.log('💡 Try running this from the Dashboard page where supabase is imported');
    return;
  }

  console.log('🔍 Searching for student with email:', userEmail);

  try {
    // Search for student by email
    const { data: student, error } = await supabase
      .from('students')
      .select('id, email, name, created_at')
      .eq('email', userEmail)
      .maybeSingle();

    if (error) {
      console.error('❌ Database error:', error);
      return;
    }

    if (!student) {
      console.error('❌ No student found with email:', userEmail);
      console.log('\n💡 Possible solutions:');
      console.log('   1. Check if the email is correct in localStorage');
      console.log('   2. Verify the student exists in the students table');
      console.log('   3. Check if there are any typos in the email');
      
      // Check if there are any students in the table
      const { data: allStudents, error: countError } = await supabase
        .from('students')
        .select('email')
        .limit(5);
      
      if (!countError && allStudents) {
        console.log('\n📋 Sample emails in students table:');
        allStudents.forEach((s, i) => {
          console.log(`   ${i + 1}. ${s.email}`);
        });
      }
      
      return;
    }

    console.log('✅ Student found!');
    console.log('📋 Student details:', {
      id: student.id,
      email: student.email,
      name: student.name,
      created_at: student.created_at
    });

    // Check if there are recent_updates for this student
    console.log('\n🔍 Checking recent_updates table...');
    const { data: recentUpdates, error: updatesError } = await supabase
      .from('recent_updates')
      .select('*')
      .eq('student_id', student.id);

    if (updatesError) {
      console.error('❌ Error checking recent_updates:', updatesError);
    } else {
      console.log(`📊 Found ${recentUpdates?.length || 0} recent_updates records`);
      if (recentUpdates && recentUpdates.length > 0) {
        console.log('📋 Sample recent_updates:', recentUpdates[0]);
      }
    }

    // Check authentication status
    console.log('\n🔍 Checking Supabase auth status...');
    const { data: { session }, error: authError } = await supabase.auth.getSession();
    
    if (authError) {
      console.error('❌ Auth error:', authError);
    } else if (!session) {
      console.warn('⚠️ No active Supabase session found');
      console.log('💡 This might cause RLS (Row Level Security) issues');
    } else {
      console.log('✅ Active Supabase session found');
      console.log('👤 Authenticated user:', session.user.email);
      
      // Check if the authenticated user matches the student
      if (session.user.email !== userEmail) {
        console.warn('⚠️ Mismatch between localStorage email and authenticated user!');
        console.log('   localStorage email:', userEmail);
        console.log('   Authenticated email:', session.user.email);
      }
    }

    console.log('\n✅ Debug complete! Student authentication looks good.');
    
  } catch (err) {
    console.error('❌ Unexpected error:', err);
  }
}

// Quick check function
function quickAuthCheck() {
  const userEmail = localStorage.getItem('userEmail');
  console.log('📧 Current userEmail:', userEmail);
  
  if (!userEmail) {
    console.log('❌ No email found. Please log in.');
  } else {
    console.log('✅ Email found. Run debugStudentAuth() for detailed check.');
  }
}

// Export functions for easy access
window.studentAuthDebug = {
  full: debugStudentAuth,
  quick: quickAuthCheck
};

console.log('✅ Student Auth Debug Helper Loaded!');
console.log('📋 Available functions:');
console.log('   • studentAuthDebug.full() - Full authentication debug');
console.log('   • studentAuthDebug.quick() - Quick email check');
console.log('\n💡 Quick start: studentAuthDebug.quick()');