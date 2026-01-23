/**
 * Test AI Question Generation
 * Run this in browser console or with Node.js to test the API directly
 * 
 * Usage in browser console:
 * 1. Copy and paste this entire file
 * 2. Call: testAptitudeQuestions('cs') or testKnowledgeQuestions('cs')
 */

const API_URL = 'https://assessment-api.dark-mode-d021.workers.dev';

// Test Aptitude Questions
async function testAptitudeQuestions(streamId = 'cs') {
  console.log('🎯 Testing Aptitude Question Generation for stream:', streamId);
  
  try {
    const response = await fetch(`${API_URL}/career-assessment/generate-aptitude`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        streamId,
        questionsPerCategory: 2 // Small number for quick test
      })
    });

    if (!response.ok) {
      throw new Error(`API Error: ${response.status}`);
    }

    const data = await response.json();
    console.log('✅ Aptitude Questions Generated:', data.questions?.length || 0);
    console.log('📋 Sample Questions:');
    
    data.questions?.slice(0, 3).forEach((q, i) => {
      console.log(`\n--- Question ${i + 1} (${q.category}) ---`);
      console.log('Q:', q.question);
      console.log('Options:', q.options);
      console.log('Answer:', q.correct_answer);
      console.log('Difficulty:', q.difficulty);
    });

    return data;
  } catch (error) {
    console.error('❌ Error:', error);
    return null;
  }
}

// Test Knowledge Questions
async function testKnowledgeQuestions(streamId = 'cs') {
  const streams = {
    cs: { name: 'Computer Science / IT', topics: ['Programming fundamentals', 'Data structures', 'Algorithms'] },
    bba: { name: 'Business Administration', topics: ['Management principles', 'Marketing basics', 'Business communication'] },
    law: { name: 'Law', topics: ['Legal reasoning', 'Constitutional basics', 'Contract law'] },
    medical: { name: 'Medical Sciences', topics: ['Human anatomy', 'Biology fundamentals', 'Health sciences'] }
  };

  const stream = streams[streamId] || streams.cs;
  console.log('🎯 Testing Knowledge Question Generation for:', stream.name);
  
  try {
    const response = await fetch(`${API_URL}/career-assessment/generate-knowledge`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        streamId,
        streamName: stream.name,
        topics: stream.topics,
        questionCount: 5 // Small number for quick test
      })
    });

    if (!response.ok) {
      throw new Error(`API Error: ${response.status}`);
    }

    const data = await response.json();
    console.log('✅ Knowledge Questions Generated:', data.questions?.length || 0);
    console.log('📋 Sample Questions:');
    
    data.questions?.forEach((q, i) => {
      console.log(`\n--- Question ${i + 1} ---`);
      console.log('Q:', q.question);
      console.log('Options:', q.options);
      console.log('Answer:', q.correct_answer);
      console.log('Topic:', q.skill_tag);
      console.log('Difficulty:', q.difficulty);
    });

    return data;
  } catch (error) {
    console.error('❌ Error:', error);
    return null;
  }
}

// Test both
async function testAll(streamId = 'cs') {
  console.log('='.repeat(60));
  console.log('TESTING AI QUESTION GENERATION');
  console.log('='.repeat(60));
  
  const aptitude = await testAptitudeQuestions(streamId);
  console.log('\n' + '='.repeat(60) + '\n');
  const knowledge = await testKnowledgeQuestions(streamId);
  
  return { aptitude, knowledge };
}

// Export for use
console.log('📌 Test functions loaded!');
console.log('Run: testAptitudeQuestions("cs") - Test aptitude questions');
console.log('Run: testKnowledgeQuestions("cs") - Test knowledge questions');
console.log('Run: testAll("cs") - Test both');
console.log('\nAvailable streams: cs, bba, law, medical, engineering, pharmacy, bcom, journalism, design, psychology');
