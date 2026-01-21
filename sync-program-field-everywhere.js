/**
 * Script to sync program field everywhere
 * Run this in browser console while logged in as the student
 */

(async function syncProgramField() {
  console.log('🔄 Starting program field sync...');
  
  // Get current user email
  const userEmail = localStorage.getItem('userEmail');
  if (!userEmail) {
    console.error('❌ No user email found in localStorage');
    return;
  }
  
  console.log('📧 User email:', userEmail);
  
  // Import supabase (assuming it's available globally or via import)
  const { createClient } = window.supabase || await import('https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2/+esm');
  
  // Initialize Supabase client (use your actual URL and key)
  const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || 'YOUR_SUPABASE_URL';
  const supabaseKey = import.meta.env.VITE_SUPABASE_ANON_KEY || 'YOUR_SUPABASE_KEY';
  const supabase = createClient(supabaseUrl, supabaseKey);
  
  // Step 1: Check current values
  console.log('📊 Step 1: Checking current values...');
  const { data: currentData, error: fetchError } = await supabase
    .from('students')
    .select('id, name, email, branch_field, course_name, dept, program_id')
    .eq('email', userEmail)
    .single();
  
  if (fetchError) {
    console.error('❌ Error fetching data:', fetchError);
    return;
  }
  
  console.log('📋 Current values:');
  console.log('  - branch_field:', currentData.branch_field);
  console.log('  - course_name:', currentData.course_name);
  console.log('  - dept:', currentData.dept);
  console.log('  - program_id:', currentData.program_id);
  
  // Step 2: Ask user what they want to set
  const desiredProgram = prompt(
    'What program do you want to set?\n\n' +
    `Current branch_field: ${currentData.branch_field}\n` +
    `Current course_name: ${currentData.course_name}\n\n` +
    'Enter the program name you want (e.g., "Master of Technology in Computer Science"):'
  );
  
  if (!desiredProgram) {
    console.log('❌ Cancelled by user');
    return;
  }
  
  console.log('✏️ Setting program to:', desiredProgram);
  
  // Step 3: Update all relevant fields
  console.log('💾 Step 3: Updating database...');
  const { data: updateData, error: updateError } = await supabase
    .from('students')
    .update({
      branch_field: desiredProgram,
      course_name: desiredProgram,
      updated_at: new Date().toISOString()
    })
    .eq('email', userEmail)
    .select()
    .single();
  
  if (updateError) {
    console.error('❌ Error updating:', updateError);
    return;
  }
  
  console.log('✅ Successfully updated!');
  console.log('📋 New values:');
  console.log('  - branch_field:', updateData.branch_field);
  console.log('  - course_name:', updateData.course_name);
  
  // Step 4: Verify the update
  console.log('🔍 Step 4: Verifying update...');
  const { data: verifyData, error: verifyError } = await supabase
    .from('students')
    .select('id, name, email, branch_field, course_name, dept, program_id')
    .eq('email', userEmail)
    .single();
  
  if (verifyError) {
    console.error('❌ Error verifying:', verifyError);
    return;
  }
  
  console.log('✅ Verification complete:');
  console.log('  - branch_field:', verifyData.branch_field);
  console.log('  - course_name:', verifyData.course_name);
  
  console.log('\n🎉 Program field sync complete!');
  console.log('🔄 Please refresh the page to see changes.');
  
  // Ask if user wants to refresh
  if (confirm('Sync complete! Refresh the page now to see changes?')) {
    window.location.reload();
  }
})();
