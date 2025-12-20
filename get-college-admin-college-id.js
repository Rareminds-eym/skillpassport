// Get College Admin College ID
// This script helps find the college ID for the current college admin

async function getCollegeAdminCollegeId() {
  console.log('🔍 Finding college ID for current college admin...\n');

  try {
    // Step 1: Get current user
    const { data: { user }, error: userError } = await supabase.auth.getUser();
    
    if (userError || !user) {
      console.error('❌ No authenticated user found');
      return null;
    }
    
    console.log('👤 Current user:', user.email, '(ID:', user.id + ')');

    // Step 2: Check college_lecturers table
    console.log('\n=== Checking college_lecturers table ===');
    
    const { data: lecturerData, error: lecturerError } = await supabase
      .from('college_lecturers')
      .select('*')
      .eq('user_id', user.id);
    
    console.log('👨‍🏫 College lecturer data:', lecturerData);
    console.log('❌ Lecturer error:', lecturerError);
    
    if (lecturerData && lecturerData.length > 0) {
      const lecturer = lecturerData[0];
      const collegeId = lecturer.collegeId || lecturer.college_id;
      
      if (collegeId) {
        console.log('✅ Found college ID in college_lecturers:', collegeId);
        
        // Verify this college exists
        const { data: collegeData, error: collegeError } = await supabase
          .from('colleges')
          .select('id, name, code')
          .eq('id', collegeId)
          .single();
        
        if (!collegeError && collegeData) {
          console.log('🏫 College details:', collegeData);
          return collegeId;
        } else {
          console.log('⚠️ College not found in colleges table:', collegeError);
        }
      }
    }

    // Step 3: Check college_educators table (alternative)
    console.log('\n=== Checking college_educators table ===');
    
    const { data: educatorData, error: educatorError } = await supabase
      .from('college_educators')
      .select('*')
      .eq('user_id', user.id);
    
    console.log('👨‍🎓 College educator data:', educatorData);
    console.log('❌ Educator error:', educatorError);
    
    if (educatorData && educatorData.length > 0) {
      const educator = educatorData[0];
      const collegeId = educator.college_id || educator.collegeId;
      
      if (collegeId) {
        console.log('✅ Found college ID in college_educators:', collegeId);
        
        // Verify this college exists
        const { data: collegeData, error: collegeError } = await supabase
          .from('colleges')
          .select('id, name, code')
          .eq('id', collegeId)
          .single();
        
        if (!collegeError && collegeData) {
          console.log('🏫 College details:', collegeData);
          return collegeId;
        }
      }
    }

    // Step 4: List all colleges for reference
    console.log('\n=== Available colleges ===');
    
    const { data: allColleges, error: collegesError } = await supabase
      .from('colleges')
      .select('id, name, code')
      .limit(10);
    
    if (!collegesError && allColleges) {
      console.log('🏫 Available colleges:');
      allColleges.forEach((college, index) => {
        console.log(`${index + 1}. ${college.name} (${college.code}) - ID: ${college.id}`);
      });
    }

    // Step 5: Check if user needs to be added to college_lecturers
    console.log('\n=== Setup Instructions ===');
    console.log('💡 To fix this issue, you need to:');
    console.log('1. Choose a college ID from the list above');
    console.log('2. Add a record to college_lecturers table:');
    console.log(`   INSERT INTO college_lecturers (user_id, collegeId) VALUES ('${user.id}', 'your-chosen-college-id');`);
    console.log('3. Or update existing record if it exists');

    return null;

  } catch (error) {
    console.error('❌ Error:', error);
    return null;
  }
}

// Run the function
getCollegeAdminCollegeId();