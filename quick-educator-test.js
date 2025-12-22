// Quick test - paste this in browser console while logged in as educator
(async () => {
  console.log('🔍 Quick Educator Test');
  
  const { data: { user } } = await window.supabase.auth.getUser();
  console.log('User:', user?.email, user?.id);
  
  // Check school_educators by email
  const { data: byEmail } = await window.supabase
    .from('school_educators')
    .select('*')
    .eq('email', user.email);
  console.log('By email:', byEmail);
  
  // Check school_educators by user_id
  const { data: byUserId } = await window.supabase
    .from('school_educators')
    .select('*')
    .eq('user_id', user.id);
  console.log('By user_id:', byUserId);
  
  // Check users table
  const { data: userData } = await window.supabase
    .from('users')
    .select('*')
    .eq('id', user.id)
    .single();
  console.log('User data:', userData);
})();