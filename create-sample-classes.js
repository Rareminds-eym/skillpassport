import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config();

const supabase = createClient(
  process.env.VITE_SUPABASE_URL,
  process.env.VITE_SUPABASE_ANON_KEY
);

async function createSampleClasses() {
  console.log('=== CREATING SAMPLE CLASSES ===\n');

  const schoolId = '550e8400-e29b-41d4-a716-446655440000'; // DPS school
  const academicYear = '2024-2025';

  const classes = [
    { grade: '10', section: 'A', name: 'Class 10-A' },
    { grade: '10', section: 'B', name: 'Class 10-B' },
    { grade: '9', section: 'A', name: 'Class 9-A' },
    { grade: '9', section: 'B', name: 'Class 9-B' },
    { grade: '8', section: 'A', name: 'Class 8-A' },
  ];

  console.log(`Creating ${classes.length} classes for school ${schoolId}...\n`);

  for (const cls of classes) {
    const { data, error } = await supabase
      .from('school_classes')
      .insert({
        school_id: schoolId,
        name: cls.name,
        grade: cls.grade,
        section: cls.section,
        academic_year: academicYear,
        max_students: 40,
        current_students: 0,
        account_status: 'active',
      })
      .select()
      .single();

    if (error) {
      if (error.code === '23505') {
        console.log(`⚠️  ${cls.name} already exists`);
      } else {
        console.error(`❌ Error creating ${cls.name}:`, error.message);
      }
    } else {
      console.log(`✅ Created ${cls.name} (ID: ${data.id})`);
    }
  }

  console.log('\n=== VERIFICATION ===\n');
  
  const { data: allClasses } = await supabase
    .from('school_classes')
    .select('*')
    .eq('school_id', schoolId)
    .order('grade')
    .order('section');

  if (allClasses) {
    console.log(`Total classes in school: ${allClasses.length}`);
    allClasses.forEach((cls, idx) => {
      console.log(`${idx + 1}. ${cls.name} - Grade ${cls.grade}${cls.section ? `-${cls.section}` : ''} (${cls.current_students}/${cls.max_students} students)`);
    });
  }

  console.log('\n✅ Done! You can now use these classes in the timetable builder.');
}

createSampleClasses().catch(console.error);
