/**
 * Diagnostic Script: Check Assessment Data Structure
 * 
 * This script helps diagnose why the PDF is showing zeros.
 * Run this in the browser console on the assessment results page.
 */

(async function diagnosePDFData() {
  console.log('🔍 ========== PDF DATA DIAGNOSTIC ==========');
  console.log('');

  try {
    // Get the results from React state (if available)
    const resultsElement = document.querySelector('[data-results]');
    if (resultsElement) {
      console.log('✅ Found results element in DOM');
      const resultsData = JSON.parse(resultsElement.dataset.results);
      console.log('📊 Results data:', resultsData);
    } else {
      console.log('⚠️ No results element found in DOM');
    }

    // Check localStorage
    console.log('');
    console.log('📦 Checking localStorage...');
    const geminiResults = localStorage.getItem('assessment_gemini_results');
    if (geminiResults) {
      console.log('✅ Found gemini results in localStorage');
      const parsed = JSON.parse(geminiResults);
      console.log('   Keys:', Object.keys(parsed));
      console.log('   RIASEC:', parsed.riasec);
      console.log('   Aptitude:', parsed.aptitude);
    } else {
      console.log('⚠️ No gemini results in localStorage');
    }

    // Check if we can access Supabase
    console.log('');
    console.log('🗄️ Checking database...');
    
    if (typeof window.supabase !== 'undefined') {
      const { data: { user } } = await window.supabase.auth.getUser();
      
      if (user) {
        console.log('✅ User authenticated:', user.id);
        
        // Fetch latest result
        const { data: result, error } = await window.supabase
          .from('personal_assessment_results')
          .select('*')
          .eq('student_id', user.id)
          .order('created_at', { ascending: false })
          .limit(1)
          .single();

        if (error) {
          console.error('❌ Database error:', error);
        } else if (result) {
          console.log('✅ Found assessment result in database');
          console.log('');
          console.log('📊 Database Result Structure:');
          console.log('   ID:', result.id);
          console.log('   Grade Level:', result.grade_level);
          console.log('   Created:', result.created_at);
          console.log('');
          console.log('🔍 Score Fields:');
          console.log('   riasec_scores:', result.riasec_scores);
          console.log('   aptitude_scores:', result.aptitude_scores);
          console.log('   personality_scores:', result.personality_scores);
          console.log('   knowledge_score:', result.knowledge_score);
          console.log('   employability_score:', result.employability_score);
          console.log('');
          console.log('🤖 AI Analysis Fields:');
          console.log('   gemini_analysis:', result.gemini_analysis ? 'EXISTS (' + Object.keys(result.gemini_analysis).length + ' keys)' : 'NULL');
          console.log('   gemini_results:', result.gemini_results ? 'EXISTS (' + Object.keys(result.gemini_results).length + ' keys)' : 'NULL');
          
          if (result.gemini_results) {
            console.log('');
            console.log('📋 gemini_results structure:');
            console.log('   Keys:', Object.keys(result.gemini_results));
            console.log('   RIASEC:', result.gemini_results.riasec);
            console.log('   Aptitude:', result.gemini_results.aptitude);
            console.log('   Career Fit:', result.gemini_results.careerFit ? 'EXISTS' : 'NULL');
          }
          
          if (result.gemini_analysis) {
            console.log('');
            console.log('📋 gemini_analysis structure:');
            console.log('   Keys:', Object.keys(result.gemini_analysis));
          }
          
          console.log('');
          console.log('🎯 DIAGNOSIS:');
          
          // Diagnose the issue
          if (!result.riasec_scores && !result.gemini_results && !result.gemini_analysis) {
            console.log('❌ NO DATA FOUND - Assessment needs to be regenerated');
            console.log('   Action: Click the "Retry" button');
          } else if (result.gemini_results && result.gemini_results.riasec) {
            console.log('✅ Data found in gemini_results field');
            console.log('   This should work with the updated code');
            console.log('   If PDF still shows zeros, check browser console for transformation logs');
          } else if (result.gemini_analysis) {
            console.log('✅ Data found in gemini_analysis field');
            console.log('   This should work with the transformation service');
          } else if (result.riasec_scores) {
            console.log('✅ Data found in individual score fields');
            console.log('   This should work directly');
          } else {
            console.log('⚠️ Data structure is unusual');
            console.log('   Manual investigation needed');
          }
        } else {
          console.log('❌ No assessment result found in database');
        }
      } else {
        console.log('❌ No user authenticated');
      }
    } else {
      console.log('⚠️ Supabase not available in window object');
      console.log('   Try running this on the assessment results page');
    }

  } catch (err) {
    console.error('❌ Diagnostic error:', err);
  }

  console.log('');
  console.log('========== DIAGNOSTIC COMPLETE ==========');
})();
