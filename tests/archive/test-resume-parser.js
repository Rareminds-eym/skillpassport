/**
 * Test Resume Parser - Verify Field Extraction
 * 
 * This script tests the resume parser with sample data
 * to ensure fields are properly extracted and not concatenated
 */

// Sample resume text with common issues
const sampleResumeText = `
P.DURKADEVI
CONTACT
Email: durkadevidurkadevi43@gmail.com
Phone: -987654321

EDUCATION
B.Sc Botany Bharathidasan University
2025
CGPA: 7.5

EXPERIENCE
Software Engineer
Tech Company
Jan 2024 - Jan 2025

SKILLS
Python, JavaScript, React, Node.js
Communication, Teamwork, Leadership
Problem Solving

CERTIFICATES
Google Data Analytics Professional Certificate
Coursera
June 2024
• Completed an 8-course specialization focused on data cleaning, analysis, visualization, and SQL
• Gained hands-on experience with tools like Excel, Tableau, and R

PROJECTS
AI-Based Career Counseling System
Jan 2024 – Mar 2024
• Developed a web application for career guidance
• Technologies: Python, Flask, React
`;

// Import the parser service (adjust path if needed)
import { parseResumeWithAI } from './src/services/resumeParserService.js';

async function testParser() {
  console.log('🧪 Testing Resume Parser...\n');
  console.log('📄 Sample Resume Text:');
  console.log('─'.repeat(60));
  console.log(sampleResumeText);
  console.log('─'.repeat(60));
  console.log('\n');

  try {
    const result = await parseResumeWithAI(sampleResumeText);
    
    console.log('✅ Parsing Complete!\n');
    console.log('═'.repeat(60));
    console.log('EXTRACTED DATA:');
    console.log('═'.repeat(60));
    
    // Check name
    console.log('\n👤 NAME:');
    console.log(`   Value: "${result.name}"`);
    console.log(`   Length: ${result.name?.length || 0} characters`);
    console.log(`   Status: ${result.name && result.name.length < 50 ? '✅ PASS' : '❌ FAIL (too long or empty)'}`);
    
    // Check education
    console.log('\n🎓 EDUCATION:');
    console.log(`   Count: ${result.education?.length || 0} items`);
    result.education?.forEach((edu, i) => {
      console.log(`   [${i + 1}]:`);
      console.log(`      Degree: "${edu.degree}"`);
      console.log(`      University: "${edu.university}"`);
      console.log(`      Year: "${edu.yearOfPassing}"`);
      console.log(`      CGPA: "${edu.cgpa}"`);
      console.log(`      Status: ${edu.degree && edu.university ? '✅ PASS' : '⚠️ INCOMPLETE'}`);
    });
    
    // Check skills
    console.log('\n🔧 TECHNICAL SKILLS:');
    console.log(`   Count: ${result.technicalSkills?.length || 0} items`);
    result.technicalSkills?.forEach((skill, i) => {
      console.log(`   [${i + 1}] "${skill.name}" (${skill.name?.length || 0} chars) ${skill.name?.length > 100 ? '❌ TOO LONG' : '✅'}`);
    });
    
    console.log('\n💬 SOFT SKILLS:');
    console.log(`   Count: ${result.softSkills?.length || 0} items`);
    result.softSkills?.forEach((skill, i) => {
      console.log(`   [${i + 1}] "${skill.name}" (${skill.name?.length || 0} chars) ${skill.name?.length > 100 ? '❌ TOO LONG' : '✅'}`);
    });
    
    // Check certificates
    console.log('\n📜 CERTIFICATES:');
    console.log(`   Count: ${result.certificates?.length || 0} items`);
    result.certificates?.forEach((cert, i) => {
      console.log(`   [${i + 1}]:`);
      console.log(`      Title: "${cert.title}" (${cert.title?.length || 0} chars)`);
      console.log(`      Issuer: "${cert.issuer}"`);
      console.log(`      Date: "${cert.issuedOn}"`);
      console.log(`      Description: "${cert.description?.substring(0, 50) || ''}..."`);
      console.log(`      Status: ${cert.title && cert.title.length < 200 ? '✅ PASS' : '❌ FAIL (title too long)'}`);
    });
    
    // Check projects
    console.log('\n🚀 PROJECTS:');
    console.log(`   Count: ${result.projects?.length || 0} items`);
    result.projects?.forEach((proj, i) => {
      console.log(`   [${i + 1}]:`);
      console.log(`      Title: "${proj.title}"`);
      console.log(`      Duration: "${proj.duration}"`);
      console.log(`      Tech: ${proj.technologies?.join(', ') || 'none'}`);
    });
    
    console.log('\n' + '═'.repeat(60));
    console.log('TEST SUMMARY:');
    console.log('═'.repeat(60));
    
    const tests = [
      { name: 'Name extracted', pass: result.name && result.name.length < 50 && result.name.length > 0 },
      { name: 'Education separated', pass: result.education?.[0]?.degree && result.education?.[0]?.university },
      { name: 'Skills split', pass: result.technicalSkills?.length > 1 || result.softSkills?.length > 1 },
      { name: 'No overly long fields', pass: !hasLongFields(result) },
      { name: 'Certificate title < 200 chars', pass: result.certificates?.every(c => c.title?.length < 200) }
    ];
    
    tests.forEach(test => {
      console.log(`${test.pass ? '✅' : '❌'} ${test.name}`);
    });
    
    const allPassed = tests.every(t => t.pass);
    console.log('\n' + (allPassed ? '🎉 ALL TESTS PASSED!' : '⚠️ SOME TESTS FAILED'));
    
  } catch (error) {
    console.error('❌ Error testing parser:', error);
  }
}

// Helper function to check for overly long fields
function hasLongFields(data) {
  const checks = [
    data.name?.length > 100,
    data.technicalSkills?.some(s => s.name?.length > 100),
    data.softSkills?.some(s => s.name?.length > 100),
    data.certificates?.some(c => c.title?.length > 200),
    data.education?.some(e => e.degree?.length > 200)
  ];
  
  return checks.some(check => check === true);
}

// Run the test
testParser();
