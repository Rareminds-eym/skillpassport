// Test the date handling fix
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config();

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY;

const supabase = createClient(supabaseUrl, supabaseKey);

async function testDateFix() {
  console.log('🧪 Testing date handling fix...\n');

  try {
    const email = 'karthikeyan@rareminds.in';
    
    // Helper functions (same as in ProfileFixed.tsx)
    const formatDateForDB = (dateValue) => {
      if (!dateValue || dateValue.trim() === '') {
        return null;
      }
      return dateValue;
    };

    const formatStringForDB = (stringValue) => {
      if (!stringValue || stringValue.trim() === '') {
        return null;
      }
      return stringValue.trim();
    };

    // Test data with empty dates
    const testUpdateData = {
      first_name: 'Karthikeyan',
      last_name: 'Test',
      phone_number: '+91-9876543210',
      dob: formatDateForDB(''), // Empty date - should become null
      gender: formatStringForDB('Male'),
      address: formatStringForDB('Test Address'),
      city: formatStringForDB('Bangalore'),
      state: formatStringForDB('Karnataka'),
      country: formatStringForDB('India'),
      pincode: formatStringForDB('560001'),
      specialization: formatStringForDB('Computer Science'),
      qualification: formatStringForDB('M.Tech, B.Ed'),
      experience_years: 5,
      designation: formatStringForDB('Senior Educator'),
      department: formatStringForDB('Computer Science Department'),
      date_of_joining: formatDateForDB('2020-06-15'), // Valid date
      updated_at: new Date().toISOString(),
    };

    console.log('📝 Test update data:');
    console.log(JSON.stringify(testUpdateData, null, 2));

    // Test the update
    console.log('\n💾 Testing update with proper date handling...');
    const { error } = await supabase
      .from('school_educators')
      .update(testUpdateData)
      .eq('email', email);

    if (error) {
      console.log('❌ Update failed:', error.message);
    } else {
      console.log('✅ Update successful!');
      
      // Verify the update
      const { data: updatedData, error: fetchError } = await supabase
        .from('school_educators')
        .select('*')
        .eq('email', email)
        .single();

      if (fetchError) {
        console.log('❌ Fetch error:', fetchError.message);
      } else {
        console.log('\n📊 Updated profile data:');
        console.log({
          first_name: updatedData.first_name,
          last_name: updatedData.last_name,
          phone_number: updatedData.phone_number,
          dob: updatedData.dob,
          gender: updatedData.gender,
          city: updatedData.city,
          specialization: updatedData.specialization,
          qualification: updatedData.qualification,
          experience_years: updatedData.experience_years,
          date_of_joining: updatedData.date_of_joining,
        });
      }
    }

  } catch (error) {
    console.error('❌ Unexpected error:', error);
  }
}

testDateFix();