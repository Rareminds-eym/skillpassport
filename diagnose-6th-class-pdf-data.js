/**
 * Diagnostic Script: Check 6th Class Student PDF Data
 * 
 * This script:
 * 1. Fetches a 6th grade student's assessment result from database
 * 2. Applies the transformation
 * 3. Validates the data
 * 4. Shows what the PDF will receive
 * 
 * Usage:
 *   node diagnose-6th-class-pdf-data.js <result-id>
 * 
 * Or run without result-id to check the most recent 6th grade result
 */

import { createClient } from '@supabase/supabase-js';
import { transformAssessmentResults, validateTransformedResults } from './src/services/assessmentResultTransformer.js';

// Initialize Supabase client
const supabaseUrl = process.env.VITE_SUPABASE_URL || 'YOUR_SUPABASE_URL';
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY || 'YOUR_SUPABASE_KEY';
const supabase = createClient(supabaseUrl, supabaseKey);

/**
 * Fetch assessment result from database
 */
async function fetchAssessmentResult(resultId = null) {
  console.log('🔍 Fetching assessment result...\n');

  let query = supabase
    .from('personal_assessment_results')
    .select(`
      *,
      personal_assessment_attempts!inner(
        student_id,
        stream_id,
        grade_level,
        started_at,
        completed_at
      )
    `)
    .eq('grade_level', 'middle')
    .order('created_at', { ascending: false });

  if (resultId) {
    query = query.eq('id', resultId);
  } else {
    query = query.limit(1);
  }

  const { data, error } = await query.single();

  if (error) {
    console.error('❌ Error fetching result:', error);
    return null;
  }

  if (!data) {
    console.error('❌ No result found');
    return null;
  }

  console.log('✅ Result fetched successfully');
  console.log(`   Result ID: ${data.id}`);
  console.log(`   Student ID: ${data.student_id}`);
  console.log(`   Grade Level: ${data.grade_level}`);
  console.log(`   Created: ${data.created_at}\n`);

  return data;
}

/**
 * Analyze raw database result
 */
function analyzeRawResult(dbResult) {
  console.log('📊 ANALYZING RAW DATABASE RESULT\n');
  console.log('=' .repeat(80));

  // Check individual columns
  console.log('\n1️⃣ INDIVIDUAL COLUMNS:');
  console.log('   riasec_scores:', dbResult.riasec_scores ? '✅ Present' : '❌ Missing');
  console.log('   top_interests:', dbResult.top_interests ? `✅ Present (${dbResult.top_interests.length} items)` : '❌ Missing');
  console.log('   strengths_scores:', dbResult.strengths_scores ? '✅ Present' : '❌ Missing');
  console.log('   top_strengths:', dbResult.top_strengths ? `✅ Present (${dbResult.top_strengths.length} items)` : '❌ Missing');
  console.log('   aptitude_scores:', dbResult.aptitude_scores ? '✅ Present' : '❌ Missing');
  console.log('   career_recommendations:', dbResult.career_recommendations ? `✅ Present (${dbResult.career_recommendations.length} items)` : '❌ Missing');
  console.log('   skill_gaps:', dbResult.skill_gaps ? `✅ Present (${dbResult.skill_gaps?.length || 0} items)` : '❌ Missing');

  // Check gemini fields
  console.log('\n2️⃣ GEMINI/AI FIELDS:');
  console.log('   gemini_analysis:', dbResult.gemini_analysis ? '✅ Present' : '❌ Missing');
  console.log('   gemini_results:', dbResult.gemini_results ? '✅ Present' : '❌ Missing');

  // Determine data location
  console.log('\n3️⃣ DATA LOCATION:');
  if (dbResult.gemini_results && typeof dbResult.gemini_results === 'object' && dbResult.gemini_results.riasec) {
    console.log('   ✅ Complete assessment data found in gemini_results field');
    console.log('   Structure: gemini_results contains {riasec, strengths, aptitude, ...}');
    console.log('   Top-level keys:', Object.keys(dbResult.gemini_results).join(', '));
  } else if (dbResult.gemini_analysis && typeof dbResult.gemini_analysis === 'object' && dbResult.gemini_analysis.riasec) {
    console.log('   ✅ Complete assessment data found in gemini_analysis field');
    console.log('   Structure: gemini_analysis contains {riasec, strengths, aptitude, ...}');
    console.log('   Top-level keys:', Object.keys(dbResult.gemini_analysis).join(', '));
  } else if (dbResult.riasec_scores) {
    console.log('   ✅ Data found in individual columns');
    console.log('   Structure: Each field (riasec_scores, strengths_scores, etc.) is a separate column');
  } else {
    console.log('   ❌ Data location unclear or missing');
  }

  // Show sample data
  console.log('\n4️⃣ SAMPLE DATA:');
  if (dbResult.riasec_scores) {
    console.log('   RIASEC Scores:', JSON.stringify(dbResult.riasec_scores, null, 2).substring(0, 200));
  }
  if (dbResult.gemini_results) {
    console.log('   gemini_results (first 300 chars):', JSON.stringify(dbResult.gemini_results).substring(0, 300) + '...');
  }
  if (dbResult.gemini_analysis) {
    console.log('   gemini_analysis (first 300 chars):', JSON.stringify(dbResult.gemini_analysis).substring(0, 300) + '...');
  }

  console.log('\n' + '='.repeat(80) + '\n');
}

/**
 * Test transformation
 */
function testTransformation(dbResult) {
  console.log('🔄 TESTING TRANSFORMATION\n');
  console.log('='.repeat(80));

  try {
    const transformed = transformAssessmentResults(dbResult);

    if (!transformed) {
      console.error('❌ Transformation returned null');
      return null;
    }

    console.log('\n✅ Transformation successful');
    console.log('   Source:', transformed._source || 'unknown');
    console.log('   Transformed:', transformed._transformed ? 'Yes' : 'No');

    // Check transformed structure
    console.log('\n5️⃣ TRANSFORMED STRUCTURE:');
    console.log('   riasec:', transformed.riasec ? '✅ Present' : '❌ Missing');
    console.log('   strengths:', transformed.strengths ? '✅ Present' : '❌ Missing');
    console.log('   aptitude:', transformed.aptitude ? '✅ Present' : '❌ Missing');
    console.log('   overallSummary:', transformed.overallSummary ? '✅ Present' : '❌ Missing');
    console.log('   careerFit:', transformed.careerFit ? '✅ Present' : '❌ Missing');
    console.log('   skillGap:', transformed.skillGap ? '✅ Present' : '❌ Missing');
    console.log('   roadmap:', transformed.roadmap ? '✅ Present' : '❌ Missing');

    // Show RIASEC data
    if (transformed.riasec) {
      console.log('\n6️⃣ RIASEC DATA (for PDF):');
      console.log('   Scores:', JSON.stringify(transformed.riasec.scores, null, 2));
      console.log('   Top Three:', transformed.riasec.topThree);
      console.log('   Max Score:', transformed.riasec.maxScore);
    }

    // Show career recommendations
    if (transformed.careerFit && transformed.careerFit.clusters) {
      console.log('\n7️⃣ CAREER RECOMMENDATIONS (for PDF):');
      transformed.careerFit.clusters.slice(0, 3).forEach((career, index) => {
        console.log(`   ${index + 1}. ${career.title} (Match: ${career.matchScore}%)`);
        console.log(`      Roles: ${career.roles?.slice(0, 3).join(', ') || 'N/A'}`);
        console.log(`      Skills: ${career.skills?.slice(0, 3).join(', ') || 'N/A'}`);
      });
    }

    console.log('\n' + '='.repeat(80) + '\n');

    return transformed;

  } catch (error) {
    console.error('❌ Transformation failed:', error);
    console.error('   Error message:', error.message);
    console.error('   Stack:', error.stack);
    return null;
  }
}

/**
 * Validate transformed result
 */
function validateResult(transformed) {
  console.log('🔍 VALIDATING TRANSFORMED RESULT\n');
  console.log('='.repeat(80));

  const validation = validateTransformedResults(transformed);

  console.log('\n8️⃣ VALIDATION RESULTS:');
  console.log('   Valid:', validation.isValid ? '✅ Yes' : '❌ No');
  console.log('   Completeness:', `${validation.completeness}%`);
  console.log('   Errors:', validation.errors.length);
  console.log('   Warnings:', validation.warnings.length);

  if (validation.errors.length > 0) {
    console.log('\n   ❌ ERRORS:');
    validation.errors.forEach(error => console.log(`      - ${error}`));
  }

  if (validation.warnings.length > 0) {
    console.log('\n   ⚠️  WARNINGS:');
    validation.warnings.forEach(warning => console.log(`      - ${warning}`));
  }

  // Completeness assessment
  console.log('\n9️⃣ PDF READINESS:');
  if (validation.completeness >= 90) {
    console.log('   🟢 EXCELLENT - PDF will have all data');
  } else if (validation.completeness >= 70) {
    console.log('   🟡 GOOD - PDF will have most data, some sections may be missing');
  } else if (validation.completeness >= 50) {
    console.log('   🟠 FAIR - PDF will have basic data, many sections missing');
  } else {
    console.log('   🔴 POOR - PDF will be incomplete, critical data missing');
  }

  console.log('\n' + '='.repeat(80) + '\n');

  return validation;
}

/**
 * Show what PDF will receive
 */
function showPDFData(transformed) {
  console.log('📄 WHAT THE PDF WILL RECEIVE\n');
  console.log('='.repeat(80));

  console.log('\n🔟 PDF SECTIONS:');

  // Section 1: Interest Profile (RIASEC)
  console.log('\n   📊 SECTION 1: Interest Profile');
  if (transformed.riasec && transformed.riasec.scores) {
    console.log('      Status: ✅ Will display');
    console.log('      Data: RIASEC scores with top 3 interests');
    console.log('      Top 3:', transformed.riasec.topThree?.join(', ') || 'N/A');
  } else {
    console.log('      Status: ❌ Will NOT display (missing data)');
  }

  // Section 2: Strengths & Character
  console.log('\n   💪 SECTION 2: Strengths & Character');
  if (transformed.strengths && transformed.strengths.scores) {
    console.log('      Status: ✅ Will display');
    console.log('      Data: Strength scores with top strengths');
    console.log('      Top:', transformed.strengths.top?.join(', ') || 'N/A');
  } else {
    console.log('      Status: ❌ Will NOT display (missing data)');
  }

  // Section 3: Career Exploration
  console.log('\n   🎯 SECTION 3: Career Exploration');
  if (transformed.careerFit && transformed.careerFit.clusters && transformed.careerFit.clusters.length > 0) {
    console.log('      Status: ✅ Will display');
    console.log('      Data:', transformed.careerFit.clusters.length, 'career recommendations');
    console.log('      Careers:', transformed.careerFit.clusters.map(c => c.title).join(', '));
  } else {
    console.log('      Status: ❌ Will NOT display (missing data)');
  }

  // Section 4: Skills to Develop
  console.log('\n   📚 SECTION 4: Skills to Develop');
  if (transformed.skillGap && transformed.skillGap.gaps && transformed.skillGap.gaps.length > 0) {
    console.log('      Status: ✅ Will display');
    console.log('      Data:', transformed.skillGap.gaps.length, 'skill gaps');
    console.log('      Skills:', transformed.skillGap.gaps.map(g => g.skill).join(', '));
  } else {
    console.log('      Status: ⚠️  May display with generic content');
  }

  // Section 5: AI Summary
  console.log('\n   🤖 SECTION 5: AI Summary');
  if (transformed.overallSummary) {
    console.log('      Status: ✅ Will display');
    console.log('      Data: AI-generated summary');
    console.log('      Preview:', transformed.overallSummary.substring(0, 100) + '...');
  } else {
    console.log('      Status: ❌ Will NOT display (missing data)');
  }

  // Section 6: Next Steps
  console.log('\n   🗺️  SECTION 6: Next Steps / Roadmap');
  if (transformed.roadmap && transformed.roadmap.steps && transformed.roadmap.steps.length > 0) {
    console.log('      Status: ✅ Will display');
    console.log('      Data:', transformed.roadmap.steps.length, 'action steps');
  } else {
    console.log('      Status: ⚠️  May display with generic content');
  }

  console.log('\n' + '='.repeat(80) + '\n');
}

/**
 * Main diagnostic function
 */
async function diagnose(resultId = null) {
  console.log('\n');
  console.log('╔' + '═'.repeat(78) + '╗');
  console.log('║' + ' '.repeat(15) + '6TH CLASS STUDENT PDF DATA DIAGNOSTIC' + ' '.repeat(24) + '║');
  console.log('╚' + '═'.repeat(78) + '╝');
  console.log('\n');

  // Step 1: Fetch result
  const dbResult = await fetchAssessmentResult(resultId);
  if (!dbResult) {
    console.error('❌ Cannot proceed without a result');
    process.exit(1);
  }

  // Step 2: Analyze raw result
  analyzeRawResult(dbResult);

  // Step 3: Test transformation
  const transformed = testTransformation(dbResult);
  if (!transformed) {
    console.error('❌ Cannot proceed without transformed result');
    process.exit(1);
  }

  // Step 4: Validate
  const validation = validateResult(transformed);

  // Step 5: Show PDF data
  showPDFData(transformed);

  // Final summary
  console.log('📋 FINAL SUMMARY\n');
  console.log('='.repeat(80));
  console.log('\n   Result ID:', dbResult.id);
  console.log('   Student ID:', dbResult.student_id);
  console.log('   Grade Level:', dbResult.grade_level);
  console.log('   Data Source:', transformed._source);
  console.log('   Validation:', validation.isValid ? '✅ Valid' : '❌ Invalid');
  console.log('   Completeness:', `${validation.completeness}%`);
  console.log('   PDF Ready:', validation.completeness >= 70 ? '✅ Yes' : '❌ No');

  if (validation.completeness < 70) {
    console.log('\n   ⚠️  ACTION REQUIRED:');
    console.log('      The PDF may not display correctly due to missing data.');
    console.log('      Please check the errors and warnings above.');
  } else {
    console.log('\n   ✅ PDF GENERATION READY:');
    console.log('      The assessment result has sufficient data for PDF generation.');
  }

  console.log('\n' + '='.repeat(80) + '\n');
}

// Run diagnostic
const resultId = process.argv[2] || null;
diagnose(resultId).catch(error => {
  console.error('❌ Diagnostic failed:', error);
  process.exit(1);
});
