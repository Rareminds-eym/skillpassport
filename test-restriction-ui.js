/**
 * Quick Test Script for Assessment Restriction UI
 * 
 * HOW TO USE:
 * 1. Open browser console on /student/assessment/test page
 * 2. Copy and paste this entire script
 * 3. Run: testRestrictionUI()
 * 
 * This will simulate a completed assessment from 3 months ago
 * so you can see the restriction screen.
 */

import { supabase } from './src/lib/supabaseClient.js';

async function testRestrictionUI() {
    console.log('🧪 Testing Restriction UI...\n');

    try {
        // Get current user
        const { data: { user }, error: authError } = await supabase.auth.getUser();
        
        if (authError || !user) {
            console.error('❌ Not authenticated. Please log in first.');
            return;
        }

        console.log('✅ Logged in as:', user.email);

        // Create a fake completed assessment from 3 months ago
        const threeMonthsAgo = new Date();
        threeMonthsAgo.setMonth(threeMonthsAgo.getMonth() - 3);

        // First, create an attempt
        const { data: attempt, error: attemptError } = await supabase
            .from('personal_assessment_attempts')
            .insert({
                student_id: user.id,
                stream_id: 'cs',
                status: 'completed',
                started_at: threeMonthsAgo.toISOString(),
                completed_at: threeMonthsAgo.toISOString()
            })
            .select()
            .single();

        if (attemptError) {
            console.error('❌ Error creating attempt:', attemptError.message);
            return;
        }

        console.log('✅ Created test attempt:', attempt.id);

        // Create a result record
        const { data: result, error: resultError } = await supabase
            .from('personal_assessment_results')
            .insert({
                attempt_id: attempt.id,
                student_id: user.id,
                stream_id: 'cs',
                status: 'completed',
                created_at: threeMonthsAgo.toISOString(),
                riasec_scores: { R: 5, I: 4, A: 3, S: 2, E: 1, C: 1 },
                riasec_code: 'RIA',
                overall_summary: 'Test assessment for UI testing',
                gemini_results: {
                    riasec: { code: 'RIA', scores: { R: 5, I: 4, A: 3, S: 2, E: 1, C: 1 } },
                    bigFive: { O: 4, C: 3, E: 3, A: 4, N: 2 },
                    workValues: { scores: {} },
                    employability: { overallReadiness: 'developing' },
                    aptitude: { overallScore: 70 },
                    knowledge: { score: 75 },
                    careerFit: { clusters: [] },
                    skillGap: { priorityA: [] },
                    roadmap: { projects: [] },
                    overallSummary: 'Test assessment'
                }
            })
            .select()
            .single();

        if (resultError) {
            console.error('❌ Error creating result:', resultError.message);
            return;
        }

        console.log('✅ Created test result:', result.id);
        console.log('\n📅 Assessment Date:', threeMonthsAgo.toLocaleDateString());
        
        const nextAvailable = new Date(threeMonthsAgo);
        nextAvailable.setMonth(nextAvailable.getMonth() + 6);
        console.log('📅 Next Available:', nextAvailable.toLocaleDateString());

        const daysRemaining = Math.ceil((nextAvailable - new Date()) / (1000 * 60 * 60 * 24));
        console.log('⏳ Days Remaining:', daysRemaining);

        console.log('\n✅ Test data created successfully!');
        console.log('🔄 Now refresh the page to see the restriction screen.');
        console.log('\n💡 To clean up test data later, run: cleanupTestData()');

        // Store the IDs for cleanup
        window.testAttemptId = attempt.id;
        window.testResultId = result.id;

    } catch (error) {
        console.error('❌ Error:', error.message);
    }
}

async function cleanupTestData() {
    console.log('🧹 Cleaning up test data...\n');

    try {
        if (window.testResultId) {
            const { error: resultError } = await supabase
                .from('personal_assessment_results')
                .delete()
                .eq('id', window.testResultId);

            if (resultError) {
                console.error('❌ Error deleting result:', resultError.message);
            } else {
                console.log('✅ Deleted test result');
            }
        }

        if (window.testAttemptId) {
            const { error: attemptError } = await supabase
                .from('personal_assessment_attempts')
                .delete()
                .eq('id', window.testAttemptId);

            if (attemptError) {
                console.error('❌ Error deleting attempt:', attemptError.message);
            } else {
                console.log('✅ Deleted test attempt');
            }
        }

        console.log('\n✅ Cleanup complete!');
        console.log('🔄 Refresh the page to take the assessment normally.');

        delete window.testAttemptId;
        delete window.testResultId;

    } catch (error) {
        console.error('❌ Error:', error.message);
    }
}

// Make functions available globally
if (typeof window !== 'undefined') {
    window.testRestrictionUI = testRestrictionUI;
    window.cleanupTestData = cleanupTestData;
    
    console.log('✅ Test functions loaded!');
    console.log('\nAvailable commands:');
    console.log('  testRestrictionUI()  - Create test data and see restriction screen');
    console.log('  cleanupTestData()    - Remove test data');
}

export { testRestrictionUI, cleanupTestData };
