import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';

dotenv.config();

const supabase = createClient(
  process.env.VITE_SUPABASE_URL,
  process.env.VITE_SUPABASE_ANON_KEY
);

async function debugSkillsJoin() {
  console.log('🔍 Debugging skills join for P.DURKADEVID...\n');

  // Step 1: Find the student
  console.log('Step 1: Finding P.DURKADEVID in students table...');
  const { data: students, error: studentError } = await supabase
    .from('students')
    .select('user_id, name, email')
    .ilike('name', '%DURKADEVID%');

  if (studentError) {
    console.error('❌ Error finding student:', studentError);
    return;
  }

  if (!students || students.length === 0) {
    console.log('❌ Student not found');
    return;
  }

  console.log('✅ Found student:', students[0]);
  const studentId = students[0].user_id;

  // Step 2: Check skills table directly
  console.log('\nStep 2: Checking skills table for this student_id...');
  const { data: skills, error: skillsError } = await supabase
    .from('skills')
    .select('*')
    .eq('student_id', studentId);

  if (skillsError) {
    console.error('❌ Error fetching skills:', skillsError);
    return;
  }

  console.log('✅ Skills found:', skills?.length || 0);
  if (skills && skills.length > 0) {
    console.log('📊 Skills data:');
    skills.forEach(skill => {
      console.log(`  - ${skill.name} (enabled: ${skill.enabled}, type: ${skill.type}, level: ${skill.level})`);
    });
  } else {
    console.log('❌ No skills found for this student');
  }

  // Step 3: Check if enabled filter is the issue
  console.log('\nStep 3: Checking ALL skills (including disabled)...');
  const { data: allSkills, error: allSkillsError } = await supabase
    .from('skills')
    .select('*')
    .eq('student_id', studentId);

  if (allSkillsError) {
    console.error('❌ Error:', allSkillsError);
  } else {
    console.log('📊 Total skills (including disabled):', allSkills?.length || 0);
    if (allSkills && allSkills.length > 0) {
      allSkills.forEach(skill => {
        console.log(`  - ${skill.name} (enabled: ${skill.enabled})`);
      });
    }
  }

  // Step 4: Check total skills count in database
  console.log('\nStep 4: Checking total skills in entire database...');
  const { count: totalSkills } = await supabase
    .from('skills')
    .select('*', { count: 'exact', head: true });

  console.log('📊 Total skills in database:', totalSkills);

  // Step 5: Check skills with enabled=true
  const { count: enabledSkills } = await supabase
    .from('skills')
    .select('*', { count: 'exact', head: true })
    .eq('enabled', true);

  console.log('📊 Total enabled skills:', enabledSkills);

  // Step 6: Sample some skills from database
  console.log('\nStep 6: Sample skills from database...');
  const { data: sampleSkills } = await supabase
    .from('skills')
    .select('student_id, name, enabled')
    .limit(5);

  console.log('📊 Sample skills:');
  sampleSkills?.forEach(skill => {
    console.log(`  - student_id: ${skill.student_id}, name: ${skill.name}, enabled: ${skill.enabled}`);
  });

  console.log('\n✅ Debug complete');
}

debugSkillsJoin();
