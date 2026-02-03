/**
 * Populate Enriched PDF Fields Script
 * 
 * This script populates the new enriched fields for existing assessment results
 * Run this after executing add-pdf-enriched-fields.sql
 */

import { createClient } from '@supabase/supabase-js';
import { enrichAssessmentResult } from './src/services/assessmentEnrichmentService.js';

// Initialize Supabase client
const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Missing Supabase credentials');
  console.error('   Set VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY environment variables');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

/**
 * Main execution function
 */
async function populateEnrichedFields() {
  console.log('🚀 Starting enriched fields population...\n');

  try {
    // 1. Fetch all results that don't have enriched fields yet
    console.log('📊 Fetching assessment results...');
    const { data: results, error: fetchError } = await supabase
      .from('personal_assessment_results')
      .select('*')
      .is('degree_programs', null);

    if (fetchError) {
      throw new Error(`Failed to fetch results: ${fetchError.message}`);
    }

    if (!results || results.length === 0) {
      console.log('✅ No results need enrichment. All done!');
      return;
    }

    console.log(`📝 Found ${results.length} results to enrich\n`);

    // 2. Process each result
    let successCount = 0;
    let errorCount = 0;

    for (const result of results) {
      try {
        console.log(`\n🔄 Processing result ${result.id}...`);
        console.log(`   Student: ${result.student_id}`);
        console.log(`   Grade: ${result.grade_level}`);
        console.log(`   Created: ${result.created_at}`);

        // Generate enriched data
        const enrichedData = enrichAssessmentResult(result);

        console.log(`   ✅ Generated enriched data:`);
        console.log(`      - Degree Programs: ${enrichedData.degree_programs?.length || 0}`);
        console.log(`      - Skill Gaps: ${enrichedData.skill_gap_enriched?.gaps?.length || 0}`);
        console.log(`      - Roadmap Steps: ${enrichedData.roadmap_enriched?.steps?.length || 0}`);
        console.log(`      - Courses: ${enrichedData.course_recommendations_enriched?.length || 0}`);

        // Update the result
        const { error: updateError } = await supabase
          .from('personal_assessment_results')
          .update({
            degree_programs: enrichedData.degree_programs,
            skill_gap_enriched: enrichedData.skill_gap_enriched,
            roadmap_enriched: enrichedData.roadmap_enriched,
            course_recommendations_enriched: enrichedData.course_recommendations_enriched,
            updated_at: new Date().toISOString()
          })
          .eq('id', result.id);

        if (updateError) {
          throw new Error(`Update failed: ${updateError.message}`);
        }

        console.log(`   ✅ Updated successfully`);
        successCount++;

      } catch (error) {
        console.error(`   ❌ Error processing result ${result.id}:`, error.message);
        errorCount++;
      }
    }

    // 3. Summary
    console.log('\n' + '='.repeat(60));
    console.log('📊 ENRICHMENT SUMMARY');
    console.log('='.repeat(60));
    console.log(`✅ Successfully enriched: ${successCount} results`);
    console.log(`❌ Failed: ${errorCount} results`);
    console.log(`📝 Total processed: ${results.length} results`);
    console.log('='.repeat(60) + '\n');

    if (successCount > 0) {
      console.log('🎉 Enrichment completed successfully!');
      console.log('   You can now generate PDFs with enriched data.');
    }

  } catch (error) {
    console.error('\n❌ Fatal error:', error.message);
    process.exit(1);
  }
}

/**
 * Test enrichment for a single result
 */
async function testEnrichment(resultId) {
  console.log(`🧪 Testing enrichment for result: ${resultId}\n`);

  try {
    // Fetch the result
    const { data: result, error: fetchError } = await supabase
      .from('personal_assessment_results')
      .select('*')
      .eq('id', resultId)
      .single();

    if (fetchError) {
      throw new Error(`Failed to fetch result: ${fetchError.message}`);
    }

    console.log('📊 Original result:');
    console.log(`   Career Recommendations: ${result.career_recommendations?.length || 0}`);
    console.log(`   Skill Gaps: ${result.skill_gaps?.length || 0}`);
    console.log(`   Grade Level: ${result.grade_level}`);

    // Generate enriched data
    const enrichedData = enrichAssessmentResult(result);

    console.log('\n✨ Enriched data:');
    console.log('\n1. Degree Programs:');
    console.log(JSON.stringify(enrichedData.degree_programs, null, 2));

    console.log('\n2. Skill Gap Enriched:');
    console.log(JSON.stringify(enrichedData.skill_gap_enriched, null, 2));

    console.log('\n3. Roadmap Enriched:');
    console.log(JSON.stringify(enrichedData.roadmap_enriched, null, 2));

    console.log('\n4. Course Recommendations Enriched:');
    console.log(JSON.stringify(enrichedData.course_recommendations_enriched, null, 2));

    console.log('\n✅ Test completed successfully!');

  } catch (error) {
    console.error('\n❌ Test failed:', error.message);
    process.exit(1);
  }
}

// Parse command line arguments
const args = process.argv.slice(2);
const command = args[0];
const resultId = args[1];

if (command === 'test' && resultId) {
  // Test mode: enrich a single result and display output
  testEnrichment(resultId);
} else if (command === 'populate' || !command) {
  // Populate mode: enrich all results
  populateEnrichedFields();
} else {
  console.log('Usage:');
  console.log('  node populate-enriched-pdf-fields.js populate    # Enrich all results');
  console.log('  node populate-enriched-pdf-fields.js test <id>   # Test enrichment for one result');
  process.exit(1);
}
