/**
 * Debug Assessment AI Response
 * 
 * This script checks what the AI is actually returning for a completed assessment
 * Run with: node debug-assessment-response.js
 */

import { supabase } from './src/lib/supabaseClient.js';

// Replace with the attempt_id from your screenshot
const ATTEMPT_ID = 'af826c50-39c5-497d-8d06-32f85ca5e0f1';

async function debugResponse() {
  console.log('🔍 Checking AI response for attempt:', ATTEMPT_ID);
  console.log('='.repeat(60));
  
  // 1. Check the attempt
  const { data: attempt, error: attemptError } = await supabase
    .from('personal_assessment_attempts')
    .select('*')
    .eq('id', ATTEMPT_ID)
    .single();
  
  if (attemptError) {
    console.error('❌ Error fetching attempt:', attemptError);
    return;
  }
  
  console.log('\n✅ Attempt Found:');
  console.log('  Status:', attempt.status);
  console.log('  Stream:', attempt.stream_id);
  console.log('  Grade Level:', attempt.grade_level);
  console.log('  Started:', attempt.started_at);
  console.log('  Completed:', attempt.completed_at);
  
  // 2. Check the results
  const { data: result, error: resultError } = await supabase
    .from('personal_assessment_results')
    .select('*')
    .eq('attempt_id', ATTEMPT_ID)
    .single();
  
  if (resultError) {
    console.error('❌ Error fetching result:', resultError);
    return;
  }
  
  console.log('\n📊 Result Record:');
  console.log('  ID:', result.id);
  console.log('  Status:', result.status);
  console.log('  Stream:', result.stream_id);
  console.log('  Grade Level:', result.grade_level);
  console.log('  Created:', result.created_at);
  
  console.log('\n🔍 Individual Field Status:');
  console.log('='.repeat(60));
  
  const fields = [
    { name: 'riasec_scores', value: result.riasec_scores },
    { name: 'riasec_code', value: result.riasec_code },
    { name: 'aptitude_scores', value: result.aptitude_scores },
    { name: 'aptitude_overall', value: result.aptitude_overall },
    { name: 'bigfive_scores', value: result.bigfive_scores },
    { name: 'work_values_scores', value: result.work_values_scores },
    { name: 'employability_scores', value: result.employability_scores },
    { name: 'employability_readiness', value: result.employability_readiness },
    { name: 'knowledge_score', value: result.knowledge_score },
    { name: 'knowledge_details', value: result.knowledge_details },
    { name: 'career_fit', value: result.career_fit },
    { name: 'skill_gap', value: result.skill_gap },
    { name: 'skill_gap_courses', value: result.skill_gap_courses },
    { name: 'roadmap', value: result.roadmap },
    { name: 'profile_snapshot', value: result.profile_snapshot },
    { name: 'timing_analysis', value: result.timing_analysis },
    { name: 'final_note', value: result.final_note },
    { name: 'overall_summary', value: result.overall_summary }
  ];
  
  fields.forEach(field => {
    const status = field.value ? '✅ HAS DATA' : '❌ NULL';
    const preview = field.value 
      ? (typeof field.value === 'object' 
          ? `(${Object.keys(field.value).length} keys)` 
          : `"${String(field.value).substring(0, 50)}..."`)
      : '';
    console.log(`  ${field.name.padEnd(25)} ${status} ${preview}`);
  });
  
  console.log('\n📦 Full gemini_results Object:');
  console.log('='.repeat(60));
  
  if (result.gemini_results) {
    console.log('✅ gemini_results exists');
    console.log('Keys:', Object.keys(result.gemini_results));
    console.log('\nFull Data:');
    console.log(JSON.stringify(result.gemini_results, null, 2));
  } else {
    console.log('❌ gemini_results is NULL or empty');
  }
  
  // 3. Analysis
  console.log('\n🔬 Analysis:');
  console.log('='.repeat(60));
  
  const nullFields = fields.filter(f => !f.value).map(f => f.name);
  const populatedFields = fields.filter(f => f.value).map(f => f.name);
  
  console.log(`\n✅ Populated Fields (${populatedFields.length}):`);
  populatedFields.forEach(f => console.log(`  - ${f}`));
  
  console.log(`\n❌ NULL Fields (${nullFields.length}):`);
  nullFields.forEach(f => console.log(`  - ${f}`));
  
  if (result.gemini_results) {
    console.log('\n🔍 Checking gemini_results structure:');
    const geminiKeys = Object.keys(result.gemini_results);
    
    // Check for expected keys
    const expectedKeys = [
      'riasec', 'aptitude', 'bigFive', 'workValues', 'employability',
      'knowledge', 'careerFit', 'skillGap', 'roadmap', 'profileSnapshot',
      'timingAnalysis', 'finalNote', 'overallSummary'
    ];
    
    expectedKeys.forEach(key => {
      const exists = geminiKeys.includes(key);
      console.log(`  ${key.padEnd(20)} ${exists ? '✅' : '❌ MISSING'}`);
    });
  }
  
  console.log('\n' + '='.repeat(60));
  console.log('✅ Debug complete!');
}

debugResponse().catch(error => {
  console.error('❌ Script error:', error);
  process.exit(1);
});
