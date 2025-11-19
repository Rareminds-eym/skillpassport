// Test the exact data that the Profile component will receive
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config();

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY;

const supabase = createClient(supabaseUrl, supabaseKey);

async function testProfileData() {
  console.log('🧪 Testing Profile Component Data...\n');

  try {
    const email = 'karthikeyan@rareminds.in';
    
    // Simulate the exact query the Profile component makes
    console.log('📧 Fetching educator data for:', email);
    
    const { data: educatorData, error: educatorError } = await supabase
      .from('school_educators')
      .select(`
        *,
        schools:school_id (
          name
        )
      `)
      .eq('email', email)
      .maybeSingle();

    if (educatorError) {
      console.log('❌ Error:', educatorError.message);
      return;
    }

    if (!educatorData) {
      console.log('❌ No educator data found');
      return;
    }

    console.log('✅ Raw educator data:');
    console.log(JSON.stringify(educatorData, null, 2));

    // Simulate the profile processing logic
    const profileData = {
      // Primary fields
      id: educatorData?.id || '',
      user_id: educatorData?.user_id || '',
      school_id: educatorData?.school_id || '',
      employee_id: educatorData?.employee_id || '',
      account_status: educatorData?.account_status || 'active',
      created_at: educatorData?.created_at,
      updated_at: educatorData?.updated_at,
      metadata: educatorData?.metadata || {},
      
      // Professional Information
      specialization: educatorData?.specialization || '',
      qualification: educatorData?.qualification || '',
      experience_years: educatorData?.experience_years || 0,
      date_of_joining: educatorData?.date_of_joining || educatorData?.created_at || new Date().toISOString(),
      designation: educatorData?.designation || '',
      department: educatorData?.department || '',
      subjects_handled: educatorData?.subjects_handled || [],
      
      // Personal Information (handle null values)
      first_name: educatorData?.first_name && educatorData.first_name !== 'null' ? educatorData.first_name : '',
      last_name: educatorData?.last_name && educatorData.last_name !== 'null' ? educatorData.last_name : '',
      email: educatorData?.email || email || '',
      phone_number: educatorData?.phone_number || '',
      dob: educatorData?.dob || '',
      gender: educatorData?.gender || '',
      address: educatorData?.address || '',
      city: educatorData?.city || '',
      state: educatorData?.state || '',
      country: educatorData?.country || '',
      pincode: educatorData?.pincode || '',
      photo_url: educatorData?.photo_url || '',
      
      // Documents
      resume_url: educatorData?.resume_url || '',
      id_proof_url: educatorData?.id_proof_url || '',
      
      // Verification
      verification_status: educatorData?.verification_status || 'Pending',
      verified_by: educatorData?.verified_by || '',
      verified_at: educatorData?.verified_at || '',
      
      // Computed fields
      full_name: educatorData?.first_name && educatorData?.last_name && 
                 educatorData.first_name !== 'null' && educatorData.last_name !== 'null'
        ? `${educatorData.first_name} ${educatorData.last_name}`
        : educatorData?.first_name && educatorData.first_name !== 'null' 
          ? educatorData.first_name 
          : 'Educator',
      phone: educatorData?.phone_number || '',
      school_name: educatorData?.schools?.name || '',
      
      // Stats
      total_students: 0,
      verified_activities: 0,
      pending_activities: 0,
    };

    console.log('\n✅ Processed profile data:');
    console.log('📋 Basic Info:');
    console.log(`   ID: ${profileData.id}`);
    console.log(`   Email: ${profileData.email}`);
    console.log(`   Full Name: ${profileData.full_name}`);
    console.log(`   First Name: "${profileData.first_name}"`);
    console.log(`   Last Name: "${profileData.last_name}"`);
    
    console.log('\n📚 Professional Info:');
    console.log(`   Specialization: ${profileData.specialization}`);
    console.log(`   Qualification: ${profileData.qualification}`);
    console.log(`   Experience: ${profileData.experience_years} years`);
    console.log(`   Designation: ${profileData.designation}`);
    console.log(`   Department: ${profileData.department}`);
    
    console.log('\n🏫 School Info:');
    console.log(`   School ID: ${profileData.school_id}`);
    console.log(`   School Name: ${profileData.school_name}`);
    
    console.log('\n📞 Contact Info:');
    console.log(`   Phone: ${profileData.phone_number}`);
    console.log(`   Address: ${profileData.address}`);
    console.log(`   City: ${profileData.city}`);
    
    console.log('\n✅ Profile component should display:');
    console.log(`   - Name: "${profileData.full_name}"`);
    console.log(`   - Email: "${profileData.email}"`);
    console.log(`   - Specialization: "${profileData.specialization}"`);
    console.log(`   - Qualification: "${profileData.qualification}"`);
    console.log(`   - Experience: "${profileData.experience_years} years"`);
    console.log(`   - Phone: "${profileData.phone_number || 'Not provided'}"`);

  } catch (error) {
    console.error('❌ Unexpected error:', error);
  }
}

testProfileData();