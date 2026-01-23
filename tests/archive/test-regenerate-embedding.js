/**
 * Test script to regenerate embedding for gokul@rareminds.in
 * This will include their completed courses and certificates in the embedding
 */

const EMBEDDING_API_URL = 'https://embedding-api.dark-mode-d021.workers.dev';
const CAREER_API_URL = 'https://career-api.dark-mode-d021.workers.dev';
const STUDENT_ID = '95364f0d-23fb-4616-b0f4-48caafee5439';

// Simulate the buildStudentText function to see what text would be generated
function buildStudentText(student) {
  const parts = [];

  if (student.name) {
    parts.push(`Name: ${student.name}`);
  }
  if (student.branch_field) {
    parts.push(`Field of Study: ${student.branch_field}`);
  }
  if (student.course_name) {
    parts.push(`Course: ${student.course_name}`);
  }
  if (student.university) {
    parts.push(`University: ${student.university}`);
  }
  if (student.skills && Array.isArray(student.skills)) {
    const skillNames = student.skills.map(s => typeof s === 'string' ? s : s.name || s.skill_name).filter(Boolean);
    if (skillNames.length > 0) {
      parts.push(`Technical Skills: ${skillNames.join(', ')}`);
    }
  }
  if (student.certificates && Array.isArray(student.certificates)) {
    const certNames = student.certificates.map(c => c.name || c.title).filter(Boolean).join(', ');
    if (certNames) {
      parts.push(`Certifications: ${certNames}`);
    }
  }
  if (student.courseEnrollments && Array.isArray(student.courseEnrollments)) {
    const completedCourses = student.courseEnrollments
      .filter(c => c.status === 'completed')
      .map(c => c.course_title)
      .filter(Boolean);
    const inProgressCourses = student.courseEnrollments
      .filter(c => c.status === 'in_progress' || c.status === 'active')
      .map(c => c.course_title)
      .filter(Boolean);
    
    if (completedCourses.length > 0) {
      parts.push(`Completed Courses: ${completedCourses.join(', ')}`);
    }
    if (inProgressCourses.length > 0) {
      parts.push(`Courses In Progress: ${inProgressCourses.join(', ')}`);
    }
  }
  if (student.trainings && Array.isArray(student.trainings)) {
    const trainingNames = student.trainings.map(t => t.course || t.name || t.title).filter(Boolean).join(', ');
    if (trainingNames) {
      parts.push(`Training: ${trainingNames}`);
    }
  }

  return parts.join('\n');
}

async function regenerateEmbedding() {
  console.log('=== Regenerating Embedding for gokul@rareminds.in ===\n');
  console.log(`Student ID: ${STUDENT_ID}`);
  console.log(`Embedding API: ${EMBEDDING_API_URL}`);
  
  // First, let's simulate what text would be generated
  const mockStudent = {
    name: 'Gokul',
    branch_field: 'BCA',
    university: 'PES University',
    courseEnrollments: [
      { course_title: 'BlockChain Basics', status: 'completed', progress: 100 },
      { course_title: 'Digital Citizenship', status: 'active', progress: 1 },
      { course_title: 'Test 21', status: 'in_progress', progress: 1 }
    ],
    trainings: [
      { title: 'BlockChain Basics', organization: 'Rareminds', status: 'completed' },
      { title: 'The Complete Python Bootcamp From Zero to Hero in Python', organization: 'Udemy', status: 'completed' }
    ]
  };
  
  const expectedText = buildStudentText(mockStudent);
  console.log('\n=== Expected Text for Embedding ===');
  console.log(expectedText);
  console.log(`\nExpected text length: ${expectedText.length} characters`);
  
  try {
    // Step 1: Regenerate the embedding
    console.log('\n1. Calling /regenerate endpoint...');
    const regenerateUrl = `${EMBEDDING_API_URL}/regenerate?table=students&id=${STUDENT_ID}`;
    console.log(`   URL: ${regenerateUrl}`);
    
    const response = await fetch(regenerateUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' }
    });
    
    const result = await response.json();
    console.log('\n   Response:', JSON.stringify(result, null, 2));
    
    if (!result.success) {
      console.error('\n❌ Failed to regenerate embedding:', result.error);
      return;
    }
    
    console.log(`\n✅ Embedding regenerated successfully!`);
    console.log(`   - Model: ${result.model}`);
    console.log(`   - Dimensions: ${result.dimensions}`);
    console.log(`   - Text Length: ${result.textLength} characters`);
    
    // Step 2: Test job matching with the new embedding
    console.log('\n2. Testing job matching with new embedding...');
    const matchResponse = await fetch(`${CAREER_API_URL}/recommend-opportunities`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        studentId: STUDENT_ID,
        forceRefresh: true, // Bypass cache to use new embedding
        limit: 10
      })
    });
    
    const matchResult = await matchResponse.json();
    
    if (matchResult.recommendations && matchResult.recommendations.length > 0) {
      console.log(`\n✅ Found ${matchResult.count} job matches!`);
      console.log(`   Total matches: ${matchResult.totalMatches}`);
      console.log(`   Execution time: ${matchResult.executionTime}ms`);
      console.log(`   Cached: ${matchResult.cached}`);
      
      console.log('\n   Top 5 Recommendations:');
      matchResult.recommendations.slice(0, 5).forEach((job, i) => {
        const similarity = job.similarity ? (job.similarity * 100).toFixed(1) : 'N/A';
        console.log(`   ${i + 1}. ${job.job_title || job.title} at ${job.company_name}`);
        console.log(`      Match Score: ${similarity}%`);
        const skills = job.skills_required || [];
        const skillNames = Array.isArray(skills) 
          ? skills.slice(0, 3).map(s => typeof s === 'string' ? s : s.name || s.skill || JSON.stringify(s)).join(', ')
          : 'N/A';
        console.log(`      Skills: ${skillNames}`);
      });
    } else {
      console.log('\n⚠️ No job matches found');
      console.log('   Reason:', matchResult.reason || 'Unknown');
      console.log('   Fallback:', matchResult.fallback);
    }
    
  } catch (error) {
    console.error('\n❌ Error:', error.message);
  }
}

regenerateEmbedding();
