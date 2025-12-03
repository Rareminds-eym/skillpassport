/**
 * Script to populate student_management_records from existing students table
 * Run this after creating the new tables
 */

import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config();

// Use service role key for admin operations (bypasses RLS)
const supabase = createClient(
  process.env.VITE_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.VITE_SUPABASE_ANON_KEY
);

async function populateStudentProfiles() {
  console.log('🔍 Fetching existing students...');

  // Fetch all students from the existing students table
  const { data: students, error: fetchError } = await supabase
    .from('students')
    .select('*');

  if (fetchError) {
    console.error('❌ Error fetching students:', fetchError);
    return;
  }

  console.log(`✅ Found ${students.length} students`);

  if (students.length === 0) {
    console.log('ℹ️  No students to migrate');
    return;
  }

  // Display sample student structure
  console.log('\n📋 Sample student record:');
  console.log(JSON.stringify(students[0], null, 2));

  let successCount = 0;
  let errorCount = 0;

  console.log('\n🔄 Creating extended profiles...');

  for (const student of students) {
    try {
      // Check if management record already exists
      const { data: existing } = await supabase
        .from('student_management_records')
        .select('id')
        .eq('student_id', student.id)
        .single();

      if (existing) {
        console.log(`⏭️  Skipping ${student.name || student.id} - already exists`);
        continue;
      }

      // Generate enrollment number if not present
      const academicYear = new Date().getFullYear().toString();
      let enrollmentNumber = student.enrollment_number;

      if (!enrollmentNumber && student.school_id) {
        const { data: enrollmentData } = await supabase
          .rpc('generate_enrollment_number', {
            p_school_id: student.school_id,
            p_academic_year: academicYear
          });
        enrollmentNumber = enrollmentData;
      }

      // Create management record
      const { error: insertError } = await supabase
        .from('student_management_records')
        .insert({
          student_id: student.id,
          school_id: student.school_id,
          enrollment_number: enrollmentNumber,
          class: student.class || student.current_class,
          section: student.section,
          roll_number: student.roll_number,
          admission_date: student.admission_date || student.created_at,
          academic_year: academicYear,
          blood_group: student.blood_group,
          emergency_contact: student.emergency_contact || student.parent_name || student.father_name,
          emergency_phone: student.emergency_phone || student.parent_phone || student.phone,
          status: student.status || 'active',
          photo_url: student.photo_url || student.profile_photo
        });

      if (insertError) {
        console.error(`❌ Error creating profile for ${student.name || student.id}:`, insertError.message);
        errorCount++;
      } else {
        console.log(`✅ Created profile for ${student.name || student.id}`);
        successCount++;
      }
    } catch (error) {
      console.error(`❌ Unexpected error for ${student.name || student.id}:`, error.message);
      errorCount++;
    }
  }

  console.log('\n📊 Summary:');
  console.log(`✅ Successfully created: ${successCount}`);
  console.log(`❌ Errors: ${errorCount}`);
  console.log(`📝 Total processed: ${students.length}`);
}

// Run the script
populateStudentProfiles()
  .then(() => {
    console.log('\n✨ Migration complete!');
    process.exit(0);
  })
  .catch((error) => {
    console.error('\n💥 Fatal error:', error);
    process.exit(1);
  });
