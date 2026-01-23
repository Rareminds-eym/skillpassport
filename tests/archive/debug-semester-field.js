// Debug script to check semester field in database
// Run this in browser console or as a Node.js script

console.log('🔍 Debugging semester field in students table...');

// Check if you're in browser with supabase available
if (typeof supabase !== 'undefined') {
  // Browser environment
  supabase
    .from('students')
    .select('id, name, semester, current_semester, grade, college_id, school_id')
    .limit(5)
    .then(({ data, error }) => {
      if (error) {
        console.error('❌ Error fetching students:', error);
        return;
      }
      
      console.log('📊 Sample student data:');
      data.forEach((student, index) => {
        console.log(`${index + 1}. ${student.name}:`, {
          id: student.id,
          semester: student.semester,
          current_semester: student.current_semester,
          grade: student.grade,
          college_id: student.college_id,
          school_id: student.school_id
        });
      });
      
      // Check if any students have semester values
      const studentsWithSemester = data.filter(s => s.semester && s.semester > 0);
      console.log(`✅ Students with semester field: ${studentsWithSemester.length}/${data.length}`);
      
      if (studentsWithSemester.length === 0) {
        console.log('⚠️ ISSUE FOUND: No students have semester values!');
        console.log('💡 Solution: Update students table to set semester values');
        
        // Show SQL to fix this
        console.log('🔧 SQL to fix:');
        console.log('UPDATE students SET semester = 1 WHERE semester IS NULL AND college_id IS NOT NULL;');
        console.log('UPDATE students SET semester = CAST(grade AS INTEGER) WHERE semester IS NULL AND school_id IS NOT NULL AND grade IS NOT NULL;');
      }
    });
} else {
  console.log('❌ Supabase not available. Run this in browser console on your app.');
}

// Alternative: Check in Node.js environment
// const { createClient } = require('@supabase/supabase-js');
// const supabase = createClient('your-url', 'your-key');
// ... same code as above