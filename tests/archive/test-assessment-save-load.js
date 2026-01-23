/**
 * Test Assessment Save/Load Cycle
 * Run this in browser console to test the save and load functionality
 */

import { supabase } from './src/lib/supabaseClient';

async function testAssessmentSaveLoad() {
  console.log('🧪 Testing Assessment Save/Load Cycle...\n');

  // Test data
  const testStudentId = 'YOUR_STUDENT_ID'; // Replace with actual student ID
  const testCourseName = 'Test Course';
  
  const testQuestions = [
    { id: 1, question: 'Q1', options: ['A', 'B', 'C', 'D'], correct_answer: 'A' },
    { id: 2, question: 'Q2', options: ['A', 'B', 'C', 'D'], correct_answer: 'B' },
    { id: 3, question: 'Q3', options: ['A', 'B', 'C', 'D'], correct_answer: 'C' },
    { id: 4, question: 'Q4', options: ['A', 'B', 'C', 'D'], correct_answer: 'D' },
    { id: 5, question: 'Q5', options: ['A', 'B', 'C', 'D'], correct_answer: 'A' }
  ];

  try {
    // Step 1: Create new attempt
    console.log('📝 Step 1: Creating new attempt...');
    const emptyAnswers = testQuestions.map((q) => ({
      question_id: q.id,
      selected_answer: null,
      is_correct: null,
      time_taken: 0
    }));

    const { data: newAttempt, error: createError } = await supabase
      .from('external_assessment_attempts')
      .insert({
        student_id: testStudentId,
        course_name: testCourseName,
        course_id: 'test-course',
        assessment_level: 'Intermediate',
        total_questions: testQuestions.length,
        questions: testQuestions,
        student_answers: emptyAnswers,
        current_question_index: 0,
        status: 'in_progress',
        time_remaining: 900,
        started_at: new Date().toISOString()
      })
      .select()
      .single();

    if (createError) throw createError;
    console.log('✅ Created attempt:', newAttempt.id);

    // Step 2: Simulate answering questions 0, 1, 2
    console.log('\n📝 Step 2: Answering questions 1, 2, 3...');
    
    const answers = ['A', 'B', 'C']; // Answers for questions 0, 1, 2
    
    for (let i = 0; i < 3; i++) {
      const updatedAnswers = [...newAttempt.student_answers];
      updatedAnswers[i] = {
        question_id: testQuestions[i].id,
        selected_answer: answers[i],
        is_correct: answers[i] === testQuestions[i].correct_answer,
        time_taken: 10
      };

      const { error: updateError } = await supabase
        .from('external_assessment_attempts')
        .update({
          student_answers: updatedAnswers,
          current_question_index: i, // Save current question index
          time_remaining: 900 - (i * 30),
          last_activity_at: new Date().toISOString()
        })
        .eq('id', newAttempt.id);

      if (updateError) throw updateError;
      console.log(`✅ Saved answer for question ${i + 1}: ${answers[i]}`);
    }

    // Step 3: Simulate closing browser (stop at question 3, index 2)
    console.log('\n🚪 Step 3: Simulating browser close at question 3...');
    console.log('   Current question index should be: 2');

    // Step 4: Load the attempt (simulate resume)
    console.log('\n📂 Step 4: Loading attempt (simulating resume)...');
    
    const { data: loadedAttempt, error: loadError } = await supabase
      .from('external_assessment_attempts')
      .select('*')
      .eq('id', newAttempt.id)
      .single();

    if (loadError) throw loadError;

    console.log('✅ Loaded attempt:');
    console.log('   ID:', loadedAttempt.id);
    console.log('   Status:', loadedAttempt.status);
    console.log('   Current Question Index:', loadedAttempt.current_question_index);
    console.log('   Time Remaining:', loadedAttempt.time_remaining);
    
    // Check answers
    const restoredAnswers = loadedAttempt.student_answers.map(a => a.selected_answer);
    console.log('   Restored Answers:', restoredAnswers);
    console.log('   Non-null answers:', restoredAnswers.filter(a => a !== null).length);

    // Step 5: Verify
    console.log('\n✅ VERIFICATION:');
    if (loadedAttempt.current_question_index === 2) {
      console.log('   ✅ Current question index is correct (2)');
    } else {
      console.log('   ❌ Current question index is WRONG:', loadedAttempt.current_question_index, '(expected 2)');
    }

    if (restoredAnswers[0] === 'A' && restoredAnswers[1] === 'B' && restoredAnswers[2] === 'C') {
      console.log('   ✅ Answers restored correctly');
    } else {
      console.log('   ❌ Answers NOT restored correctly:', restoredAnswers.slice(0, 3));
    }

    // Cleanup
    console.log('\n🧹 Cleaning up test data...');
    await supabase
      .from('external_assessment_attempts')
      .delete()
      .eq('id', newAttempt.id);
    console.log('✅ Test complete!');

  } catch (error) {
    console.error('❌ Test failed:', error);
  }
}

// Run the test
testAssessmentSaveLoad();
