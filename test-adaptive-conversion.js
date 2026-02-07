/**
 * Test script to verify adaptive aptitude results conversion
 * Run with: node test-adaptive-conversion.js
 */

// Sample adaptive results from gokul@rareminds.in
const adaptiveResults = {
  session_id: "badf1747-1447-4881-b550-bca111be29fc",
  student_id: "95364f0d-23fb-4616-b0f4-48caafee5439",
  total_questions: 50,
  total_correct: 5,
  overall_accuracy: "10.00",
  accuracy_by_subtag: {
    verbal_reasoning: {
      total: 11,
      correct: 2,
      accuracy: 18.181818181818183
    },
    logical_reasoning: {
      total: 7,
      correct: 0,
      accuracy: 0
    },
    spatial_reasoning: {
      total: 9,
      correct: 1,
      accuracy: 11.11111111111111
    },
    data_interpretation: {
      total: 8,
      correct: 0,
      accuracy: 0
    },
    numerical_reasoning: {
      total: 8,
      correct: 1,
      accuracy: 12.5
    },
    pattern_recognition: {
      total: 7,
      correct: 1,
      accuracy: 14.285714285714285
    }
  }
};

// Conversion logic (same as in geminiAssessmentService.js)
function convertAdaptiveToAptitudeScores(adaptiveResults) {
  if (!adaptiveResults || !adaptiveResults.accuracy_by_subtag) {
    return null;
  }

  console.log('Converting adaptive results to standard format...');
  const subtags = adaptiveResults.accuracy_by_subtag;

  // Verbal: verbal_reasoning
  const verbal = subtags.verbal_reasoning || { total: 0, correct: 0, accuracy: 0 };

  // Numerical: numerical_reasoning + data_interpretation
  const numericalReasoning = subtags.numerical_reasoning || { total: 0, correct: 0, accuracy: 0 };
  const dataInterpretation = subtags.data_interpretation || { total: 0, correct: 0, accuracy: 0 };
  const numerical = {
    total: numericalReasoning.total + dataInterpretation.total,
    correct: numericalReasoning.correct + dataInterpretation.correct,
    percentage: 0
  };
  if (numerical.total > 0) {
    numerical.percentage = Math.round((numerical.correct / numerical.total) * 100);
  }

  // Abstract: logical_reasoning + pattern_recognition
  const logicalReasoning = subtags.logical_reasoning || { total: 0, correct: 0, accuracy: 0 };
  const patternRecognition = subtags.pattern_recognition || { total: 0, correct: 0, accuracy: 0 };
  const abstract = {
    total: logicalReasoning.total + patternRecognition.total,
    correct: logicalReasoning.correct + patternRecognition.correct,
    percentage: 0
  };
  if (abstract.total > 0) {
    abstract.percentage = Math.round((abstract.correct / abstract.total) * 100);
  }

  // Spatial: spatial_reasoning
  const spatial = subtags.spatial_reasoning || { total: 0, correct: 0, accuracy: 0 };

  // Clerical: not included in adaptive test
  const clerical = { total: 0, correct: 0, percentage: 0 };

  const aptitudeScores = {
    verbal: {
      correct: verbal.correct,
      total: verbal.total,
      percentage: Math.round(verbal.accuracy || 0)
    },
    numerical: numerical,
    abstract: abstract,
    spatial: {
      correct: spatial.correct,
      total: spatial.total,
      percentage: Math.round(spatial.accuracy || 0)
    },
    clerical: clerical
  };

  return aptitudeScores;
}

// Run the test
console.log('=== ADAPTIVE APTITUDE CONVERSION TEST ===\n');

console.log('INPUT (Adaptive Results):');
console.log(JSON.stringify(adaptiveResults.accuracy_by_subtag, null, 2));
console.log('\n');

const aptitudeScores = convertAdaptiveToAptitudeScores(adaptiveResults);

console.log('OUTPUT (Aptitude Scores):');
console.log(JSON.stringify(aptitudeScores, null, 2));
console.log('\n');

// Verify totals
const totalCorrect = Object.values(aptitudeScores).reduce((sum, s) => sum + (s.correct || 0), 0);
const totalQuestions = Object.values(aptitudeScores).reduce((sum, s) => sum + (s.total || 0), 0);
const overallPercentage = totalQuestions > 0 ? Math.round((totalCorrect / totalQuestions) * 100) : 0;

console.log('VERIFICATION:');
console.log(`Total Correct: ${totalCorrect}`);
console.log(`Total Questions: ${totalQuestions}`);
console.log(`Overall Percentage: ${overallPercentage}%`);
console.log('\n');

// Expected values
console.log('EXPECTED VALUES:');
console.log('✓ Verbal: 2/11 (18%)');
console.log('✓ Numerical: 1/16 (6%)');
console.log('✓ Abstract: 1/14 (7%)');
console.log('✓ Spatial: 1/9 (11%)');
console.log('✓ Clerical: 0/0 (0%)');
console.log('✓ Overall: 5/50 (10%)');
console.log('\n');

// Validate
const isValid = 
  aptitudeScores.verbal.correct === 2 &&
  aptitudeScores.verbal.total === 11 &&
  aptitudeScores.verbal.percentage === 18 &&
  aptitudeScores.numerical.correct === 1 &&
  aptitudeScores.numerical.total === 16 &&
  aptitudeScores.numerical.percentage === 6 &&
  aptitudeScores.abstract.correct === 1 &&
  aptitudeScores.abstract.total === 14 &&
  aptitudeScores.abstract.percentage === 7 &&
  aptitudeScores.spatial.correct === 1 &&
  aptitudeScores.spatial.total === 9 &&
  aptitudeScores.spatial.percentage === 11 &&
  totalCorrect === 5 &&
  totalQuestions === 50 &&
  overallPercentage === 10;

if (isValid) {
  console.log('✅ TEST PASSED - Conversion is correct!');
} else {
  console.log('❌ TEST FAILED - Conversion has errors!');
  console.log('\nACTUAL VALUES:');
  console.log(`Verbal: ${aptitudeScores.verbal.correct}/${aptitudeScores.verbal.total} (${aptitudeScores.verbal.percentage}%)`);
  console.log(`Numerical: ${aptitudeScores.numerical.correct}/${aptitudeScores.numerical.total} (${aptitudeScores.numerical.percentage}%)`);
  console.log(`Abstract: ${aptitudeScores.abstract.correct}/${aptitudeScores.abstract.total} (${aptitudeScores.abstract.percentage}%)`);
  console.log(`Spatial: ${aptitudeScores.spatial.correct}/${aptitudeScores.spatial.total} (${aptitudeScores.spatial.percentage}%)`);
  console.log(`Overall: ${totalCorrect}/${totalQuestions} (${overallPercentage}%)`);
}

console.log('\n=== END TEST ===');
