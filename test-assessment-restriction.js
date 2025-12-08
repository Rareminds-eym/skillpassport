/**
 * Test script for Assessment 6-Month Restriction
 * Run this in browser console or as a Node script with Supabase client
 */

import { supabase } from './src/lib/supabaseClient.js';
import * as assessmentService from './src/services/assessmentService.js';

/**
 * Test the canTakeAssessment function
 */
async function testAssessmentRestriction() {
    console.log('=== Testing Assessment 6-Month Restriction ===\n');

    try {
        // Get current user
        const { data: { user }, error: authError } = await supabase.auth.getUser();
        
        if (authError || !user) {
            console.error('❌ Not authenticated. Please log in first.');
            return;
        }

        console.log('✅ Authenticated as:', user.email);
        console.log('User ID:', user.id);
        console.log('');

        // Test the restriction check
        console.log('Checking assessment eligibility...');
        const eligibility = await assessmentService.canTakeAssessment(user.id);
        
        console.log('\n📊 Eligibility Result:');
        console.log('-------------------');
        console.log('Can Take Assessment:', eligibility.canTake ? '✅ YES' : '❌ NO');
        
        if (eligibility.lastAttemptDate) {
            const lastDate = new Date(eligibility.lastAttemptDate);
            console.log('Last Assessment:', lastDate.toLocaleDateString('en-US', {
                year: 'numeric',
                month: 'long',
                day: 'numeric',
                hour: '2-digit',
                minute: '2-digit'
            }));
        } else {
            console.log('Last Assessment:', 'Never taken');
        }
        
        if (eligibility.nextAvailableDate) {
            const nextDate = new Date(eligibility.nextAvailableDate);
            console.log('Next Available:', nextDate.toLocaleDateString('en-US', {
                year: 'numeric',
                month: 'long',
                day: 'numeric'
            }));
            
            // Calculate days remaining
            const now = new Date();
            const daysRemaining = Math.ceil((nextDate - now) / (1000 * 60 * 60 * 24));
            console.log('Days Remaining:', daysRemaining);
        } else {
            console.log('Next Available:', 'Now');
        }

        // Get all assessment history
        console.log('\n📚 Assessment History:');
        console.log('-------------------');
        const attempts = await assessmentService.getStudentAttempts(user.id);
        
        if (attempts && attempts.length > 0) {
            console.log(`Found ${attempts.length} attempt(s):\n`);
            attempts.forEach((attempt, index) => {
                const date = new Date(attempt.created_at);
                console.log(`${index + 1}. ${attempt.status.toUpperCase()}`);
                console.log(`   Stream: ${attempt.stream_id}`);
                console.log(`   Date: ${date.toLocaleDateString('en-US', {
                    year: 'numeric',
                    month: 'long',
                    day: 'numeric'
                })}`);
                console.log(`   Has Results: ${attempt.results && attempt.results.length > 0 ? 'Yes' : 'No'}`);
                console.log('');
            });
        } else {
            console.log('No previous attempts found.');
        }

        // Summary
        console.log('\n📝 Summary:');
        console.log('-------------------');
        if (eligibility.canTake) {
            console.log('✅ Student CAN take the assessment now.');
            if (eligibility.lastAttemptDate) {
                console.log('   This will be a retake (6+ months have passed).');
            } else {
                console.log('   This will be their first assessment.');
            }
        } else {
            console.log('❌ Student CANNOT take the assessment yet.');
            const nextDate = new Date(eligibility.nextAvailableDate);
            const daysRemaining = Math.ceil((nextDate - new Date()) / (1000 * 60 * 60 * 24));
            console.log(`   Must wait ${daysRemaining} more days.`);
        }

    } catch (error) {
        console.error('❌ Error during test:', error);
        console.error('Error details:', error.message);
    }
}

/**
 * Simulate completing an assessment (for testing)
 * WARNING: This creates actual database records
 */
async function simulateAssessmentCompletion(streamId = 'cs') {
    console.log('=== Simulating Assessment Completion ===\n');
    console.warn('⚠️  WARNING: This will create actual database records!\n');

    try {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) {
            console.error('❌ Not authenticated');
            return;
        }

        // Create a test attempt
        const attempt = await assessmentService.createAttempt(user.id, streamId);
        console.log('✅ Created test attempt:', attempt.id);

        // Simulate completion with minimal data
        const mockResults = {
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
        };

        const result = await assessmentService.completeAttempt(
            attempt.id,
            user.id,
            streamId,
            mockResults,
            {}
        );

        console.log('✅ Completed test assessment');
        console.log('Result ID:', result.id);
        console.log('\nNow run testAssessmentRestriction() to verify the restriction is active.');

    } catch (error) {
        console.error('❌ Error:', error.message);
    }
}

/**
 * Reset restriction for testing (updates created_at to 7 months ago)
 * WARNING: This modifies database records
 */
async function resetRestrictionForTesting() {
    console.log('=== Resetting Restriction for Testing ===\n');
    console.warn('⚠️  WARNING: This will modify database records!\n');

    try {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) {
            console.error('❌ Not authenticated');
            return;
        }

        // Update the most recent completed assessment to 7 months ago
        const sevenMonthsAgo = new Date();
        sevenMonthsAgo.setMonth(sevenMonthsAgo.getMonth() - 7);

        const { data, error } = await supabase
            .from('personal_assessment_results')
            .update({ created_at: sevenMonthsAgo.toISOString() })
            .eq('student_id', user.id)
            .eq('status', 'completed')
            .order('created_at', { ascending: false })
            .limit(1)
            .select();

        if (error) throw error;

        if (data && data.length > 0) {
            console.log('✅ Reset successful!');
            console.log('Updated assessment date to:', sevenMonthsAgo.toLocaleDateString());
            console.log('\nNow run testAssessmentRestriction() to verify you can take it again.');
        } else {
            console.log('ℹ️  No completed assessments found to reset.');
        }

    } catch (error) {
        console.error('❌ Error:', error.message);
    }
}

// Export functions for use in browser console or Node
if (typeof window !== 'undefined') {
    window.testAssessmentRestriction = testAssessmentRestriction;
    window.simulateAssessmentCompletion = simulateAssessmentCompletion;
    window.resetRestrictionForTesting = resetRestrictionForTesting;
    
    console.log('✅ Test functions loaded!');
    console.log('Available commands:');
    console.log('  - testAssessmentRestriction()');
    console.log('  - simulateAssessmentCompletion()');
    console.log('  - resetRestrictionForTesting()');
}

export {
    testAssessmentRestriction,
    simulateAssessmentCompletion,
    resetRestrictionForTesting
};
