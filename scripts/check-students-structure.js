/**
 * Script to check the structure of existing students table
 * This helps understand what fields are available before migration
 */

import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config();

const supabase = createClient(
  process.env.VITE_SUPABASE_URL,
  process.env.VITE_SUPABASE_ANON_KEY
);

async function checkStudentsStructure() {
  console.log('🔍 Checking students table structure...\n');

  // Fetch one student to see the structure
  const { data: students, error } = await supabase
    .from('students')
    .select('*')
    .limit(5);

  if (error) {
    console.error('❌ Error fetching students:', error);
    return;
  }

  if (!students || students.length === 0) {
    console.log('⚠️  No students found in the database');
    return;
  }

  console.log(`✅ Found ${students.length} sample student(s)\n`);

  // Display the structure of the first student
  console.log('📋 Student Table Structure:');
  console.log('─'.repeat(50));
  
  const firstStudent = students[0];
  const fields = Object.keys(firstStudent);
  
  fields.forEach(field => {
    const value = firstStudent[field];
    const type = value === null ? 'null' : typeof value;
    const sample = value === null ? 'null' : 
                   typeof value === 'object' ? JSON.stringify(value).substring(0, 50) + '...' :
                   String(value).substring(0, 50);
    
    console.log(`${field.padEnd(25)} | ${type.padEnd(10)} | ${sample}`);
  });

  console.log('─'.repeat(50));
  console.log(`\n📊 Total fields: ${fields.length}`);

  // Show all students summary
  console.log('\n👥 Students Summary:');
  students.forEach((student, index) => {
    console.log(`${index + 1}. ${student.name || student.id} (School: ${student.school_id || 'N/A'})`);
  });

  // Count total students
  const { count } = await supabase
    .from('students')
    .select('*', { count: 'exact', head: true });

  console.log(`\n📈 Total students in database: ${count}`);
}

// Run the script
checkStudentsStructure()
  .then(() => {
    console.log('\n✨ Check complete!');
    process.exit(0);
  })
  .catch((error) => {
    console.error('\n💥 Fatal error:', error);
    process.exit(1);
  });
