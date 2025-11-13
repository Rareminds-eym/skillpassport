// Check what the actual email is in the database
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config();

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY;

const supabase = createClient(supabaseUrl, supabaseKey);

async function checkActualEmail() {
  console.log('🔍 Checking actual email in database...\n');

  try {
    // Get all educator records to see what emails exist
    const { data: allEducators, error } = await supabase
      .from('school_educators')
      .select('*')
      .limit(10);

    if (error) {
      console.log('❌ Error:', error.message);
      return;
    }

    console.log(`📊 Found ${allEducators.length} educator records:`);
    
    allEducators.forEach((educator, index) => {
      console.log(`\n${index + 1}. Educator Record:`);
      console.log(`   ID: ${educator.id}`);
      console.log(`   Email: "${educator.email}"`);
      console.log(`   First Name: "${educator.first_name}"`);
      console.log(`   Last Name: "${educator.last_name}"`);
      console.log(`   Specialization: "${educator.specialization}"`);
      console.log(`   Qualification: "${educator.qualification}"`);
      console.log(`   Experience: ${educator.experience_years}`);
      console.log(`   Designation: "${educator.designation}"`);
      console.log(`   Department: "${educator.department}"`);
      console.log(`   School ID: ${educator.school_id}`);
      console.log(`   User ID: ${educator.user_id}`);
      console.log(`   Account Status: ${educator.account_status}`);
      console.log(`   Verification Status: ${educator.verification_status}`);
    });

    // Try different email searches
    const emailsToTry = [
      'karthikeyan',
      'karthikeyan@rareminds.in',
      'Karthikeyan',
      'KARTHIKEYAN'
    ];

    console.log('\n🔍 Testing different email searches:');
    
    for (const email of emailsToTry) {
      const { data: result, error: searchError } = await supabase
        .from('school_educators')
        .select('id, email, first_name, last_name')
        .eq('email', email)
        .maybeSingle();

      if (searchError) {
        console.log(`❌ "${email}": Error - ${searchError.message}`);
      } else if (result) {
        console.log(`✅ "${email}": FOUND - ${result.first_name} ${result.last_name}`);
      } else {
        console.log(`❌ "${email}": Not found`);
      }
    }

    // Try case-insensitive search
    console.log('\n🔍 Testing case-insensitive search:');
    const { data: ciResult, error: ciError } = await supabase
      .from('school_educators')
      .select('*')
      .ilike('email', '%karthikeyan%')
      .limit(5);

    if (ciError) {
      console.log('❌ Case-insensitive search error:', ciError.message);
    } else {
      console.log(`✅ Case-insensitive search found ${ciResult.length} results:`);
      ciResult.forEach(educator => {
        console.log(`   - Email: "${educator.email}" | Name: ${educator.first_name} ${educator.last_name}`);
      });
    }

  } catch (error) {
    console.error('❌ Unexpected error:', error);
  }
}

checkActualEmail();