// Fix College Admin Lookup
// This function tries multiple ways to find the college admin's college ID

export async function getCollegeAdminCollegeId(user, supabase) {
  console.log('🔍 Finding college ID for user:', user?.id);
  
  if (!user?.id) {
    throw new Error('No user provided');
  }
  
  // Method 1: Check user.college_id directly
  if (user.college_id) {
    console.log('✅ Found college_id in user object:', user.college_id);
    return user.college_id;
  }
  
  // Method 2: Check college_lecturers table
  try {
    const { data: lecturerData, error: lecturerError } = await supabase
      .from('college_lecturers')
      .select('collegeId, college_id')
      .eq('user_id', user.id)
      .maybeSingle();
    
    if (!lecturerError && lecturerData) {
      const collegeId = lecturerData.collegeId || lecturerData.college_id;
      if (collegeId) {
        console.log('✅ Found college_id in college_lecturers:', collegeId);
        return collegeId;
      }
    }
  } catch (error) {
    console.log('⚠️ college_lecturers lookup failed:', error.message);
  }
  
  // Method 3: Check college_educators table
  try {
    const { data: educatorData, error: educatorError } = await supabase
      .from('college_educators')
      .select('college_id, collegeId')
      .eq('user_id', user.id)
      .maybeSingle();
    
    if (!educatorError && educatorData) {
      const collegeId = educatorData.college_id || educatorData.collegeId;
      if (collegeId) {
        console.log('✅ Found college_id in college_educators:', collegeId);
        return collegeId;
      }
    }
  } catch (error) {
    console.log('⚠️ college_educators lookup failed:', error.message);
  }
  
  // Method 4: Check users table for metadata
  try {
    const { data: userData, error: userError } = await supabase
      .from('users')
      .select('college_id, metadata')
      .eq('id', user.id)
      .maybeSingle();
    
    if (!userError && userData) {
      if (userData.college_id) {
        console.log('✅ Found college_id in users table:', userData.college_id);
        return userData.college_id;
      }
      
      // Check metadata for college info
      if (userData.metadata && typeof userData.metadata === 'object') {
        const metaCollegeId = userData.metadata.college_id || userData.metadata.collegeId;
        if (metaCollegeId) {
          console.log('✅ Found college_id in user metadata:', metaCollegeId);
          return metaCollegeId;
        }
      }
    }
  } catch (error) {
    console.log('⚠️ users table lookup failed:', error.message);
  }
  
  // Method 5: Check if user email contains college info
  if (user.email) {
    console.log('📧 User email:', user.email);
    // You could add logic here to derive college from email domain if needed
  }
  
  console.error('❌ Could not find college ID for user');
  console.log('💡 Available user data:', user);
  
  throw new Error('College ID not found. Please ensure your account is properly linked to a college.');
}

// Usage example:
// const collegeId = await getCollegeAdminCollegeId(user, supabase);