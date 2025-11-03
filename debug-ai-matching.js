/**
 * AI Job Matching Debug Helper
 * 
 * Run this in the browser console to debug AI job matching issues
 * 
 * Usage:
 *   1. Open browser console (F12)
 *   2. Copy and paste this entire script
 *   3. Run: testStudentMatching()
 */

// Test function to check if different students get different matches
async function testStudentMatching() {
  console.log('🧪 Testing AI Job Matching for Different Students...\n');

  // Sample student profiles
  const students = [
    {
      id: 1,
      email: 'foodscience@example.com',
      name: 'Alice Johnson',
      department: 'Food Science',
      profile: {
        branch_field: 'Food Science',
        technicalSkills: [
          { name: 'Quality Management', level: 4 },
          { name: 'HACCP', level: 3 },
          { name: 'Food Safety', level: 4 },
          { name: 'Sampling', level: 3 },
          { name: 'Inspection', level: 4 }
        ],
        softSkills: [
          { name: 'Attention to Detail', level: 5 },
          { name: 'Analytical Thinking', level: 4 }
        ]
      }
    },
    {
      id: 2,
      email: 'compsci@example.com',
      name: 'Bob Smith',
      department: 'Computer Science',
      profile: {
        branch_field: 'Computer Science',
        technicalSkills: [
          { name: 'JavaScript', level: 4 },
          { name: 'React', level: 4 },
          { name: 'Node.js', level: 3 },
          { name: 'Python', level: 3 },
          { name: 'Git', level: 4 }
        ],
        softSkills: [
          { name: 'Problem Solving', level: 5 },
          { name: 'Communication', level: 4 }
        ]
      }
    },
    {
      id: 3,
      email: 'general@example.com',
      name: 'Carol White',
      department: 'General Studies',
      profile: {
        branch_field: 'General Studies',
        technicalSkills: [
          { name: 'Microsoft Office', level: 3 },
          { name: 'Data Entry', level: 4 }
        ],
        softSkills: [
          { name: 'Communication', level: 4 },
          { name: 'Teamwork', level: 5 },
          { name: 'Time Management', level: 4 }
        ]
      }
    }
  ];

  console.log('📋 Testing with 3 different student profiles:\n');
  students.forEach((s, i) => {
    console.log(`${i + 1}. ${s.name} (${s.department})`);
    console.log(`   Skills: ${s.profile.technicalSkills.map(sk => sk.name).join(', ')}\n`);
  });

  console.log('🔍 Expected Behavior:');
  console.log('   ✓ Alice (Food Science) → Quality/Food Safety jobs');
  console.log('   ✓ Bob (Comp Sci) → Developer/Software jobs');
  console.log('   ✓ Carol (General) → Entry-level/Administrative jobs\n');

  console.log('⚠️ Note: Actual matching requires:');
  console.log('   1. Valid OpenAI API key in .env');
  console.log('   2. Active job opportunities in database');
  console.log('   3. User to be logged in\n');

  console.log('💡 To test in UI:');
  console.log('   1. Login as different students');
  console.log('   2. Navigate to Dashboard');
  console.log('   3. Check "Suggested Next Steps" section');
  console.log('   4. Verify jobs are different for each student\n');

  console.log('🔧 Debug Console Logs to Look For:');
  console.log('   👤 Matching for Student: { email: "..." }');
  console.log('   🎯 Student Department: "..."');
  console.log('   🛠️ Student Skills: "..."');
  console.log('   ✅ Using cached matches (if second load)');
  console.log('   💾 Caching matches for student (if fresh match)\n');

  return {
    students,
    note: 'Open browser DevTools (F12) and check console logs while navigating the Dashboard'
  };
}

// Check current cache status
function checkMatchCache() {
  console.log('📦 Checking AI Job Matching Cache...\n');
  
  // Note: The cache is in the module scope, not directly accessible
  console.log('⚠️ Cache is internal to aiJobMatchingService module');
  console.log('   Cache Duration: 5 minutes (300,000 ms)');
  console.log('   Cache Key Format: {studentId}_{opportunitiesHash}_{topN}\n');
  
  console.log('💡 To clear cache:');
  console.log('   1. Hard reload: Ctrl+Shift+R (Windows) or Cmd+Shift+R (Mac)');
  console.log('   2. Or click "Refresh Job Matches" button on Dashboard');
  console.log('   3. Or wait 5 minutes for automatic expiration\n');
}

// Simulate student data extraction
function simulateDataExtraction(studentProfile) {
  console.log('🔄 Simulating Student Data Extraction...\n');
  
  const profile = studentProfile?.profile || {};
  
  const result = {
    name: studentProfile.name || profile.name || 'Student',
    email: studentProfile.email || 'unknown@email.com',
    department: studentProfile.department || profile.branch_field || profile.department,
    technical_skills: (profile.technicalSkills || profile.technical_skills || []).map(s => ({
      name: s.name || s,
      level: s.level || 3
    })),
    soft_skills: (profile.softSkills || profile.soft_skills || []).map(s => ({
      name: s.name || s,
      level: s.level || 3
    }))
  };
  
  console.log('📋 Extracted Data:', result);
  console.log('');
  
  return result;
}

// Check student profile structure
function checkStudentProfile() {
  const email = localStorage.getItem('userEmail');
  
  console.log('👤 Current Student Profile Check\n');
  console.log('Logged in as:', email || 'Not logged in');
  console.log('');
  
  if (!email) {
    console.warn('⚠️ No student logged in. Please login first.');
    return null;
  }
  
  console.log('💡 To see your profile structure:');
  console.log('   1. Navigate to Dashboard');
  console.log('   2. Open DevTools Console');
  console.log('   3. Look for: "📋 Extracted Student Data"');
  console.log('');
  
  return email;
}

// Main test runner
console.log('✅ AI Job Matching Debug Helper Loaded!\n');
console.log('Available functions:');
console.log('   • testStudentMatching() - Test different student scenarios');
console.log('   • checkMatchCache() - Check cache configuration');
console.log('   • checkStudentProfile() - Check current student profile');
console.log('   • simulateDataExtraction(profile) - Test data extraction\n');
console.log('Run any function to start debugging!\n');

// Export functions for easy access
window.aiMatchDebug = {
  test: testStudentMatching,
  cache: checkMatchCache,
  profile: checkStudentProfile,
  extract: simulateDataExtraction
};

console.log('💡 Quick start: aiMatchDebug.test()');
