/**
 * Test RIASEC Score Calculation
 * Run this in browser console to verify RIASEC scoring logic
 */

// Simulate RIASEC answers
const testProfiles = {
  medical: {
    name: "Medical Student Profile",
    answers: {
      // All I questions (Investigative)
      i1: 'yes', i2: 'yes', i3: 'yes', i4: 'yes', 
      i5: 'yes', i6: 'yes', i7: 'yes', i8: 'yes',
      // All S questions (Social)
      s1: 'yes', s2: 'yes', s3: 'yes', s4: 'yes',
      s5: 'yes', s6: 'yes', s7: 'yes', s8: 'yes',
      // Rest are 'no'
      r1: 'no', r2: 'no', r3: 'no', r4: 'no', r5: 'no', r6: 'no', r7: 'no', r8: 'no',
      a1: 'no', a2: 'no', a3: 'no', a4: 'no', a5: 'no', a6: 'no', a7: 'no', a8: 'no',
      e1: 'no', e2: 'no', e3: 'no', e4: 'no', e5: 'no', e6: 'no', e7: 'no', e8: 'no',
      c1: 'no', c2: 'no', c3: 'no', c4: 'no', c5: 'no', c6: 'no', c7: 'no', c8: 'no'
    },
    expectedStream: "PCMB or PCB (Medical/Biology)",
    expectedScores: { R: 0, I: 8, A: 0, S: 8, E: 0, C: 0 }
  },
  
  tech: {
    name: "Tech/Engineering Student Profile",
    answers: {
      // All I questions
      i1: 'yes', i2: 'yes', i3: 'yes', i4: 'yes', 
      i5: 'yes', i6: 'yes', i7: 'yes', i8: 'yes',
      // All R questions (Realistic)
      r1: 'yes', r2: 'yes', r3: 'yes', r4: 'yes',
      r5: 'yes', r6: 'yes', r7: 'yes', r8: 'yes',
      // Rest are 'no'
      a1: 'no', a2: 'no', a3: 'no', a4: 'no', a5: 'no', a6: 'no', a7: 'no', a8: 'no',
      s1: 'no', s2: 'no', s3: 'no', s4: 'no', s5: 'no', s6: 'no', s7: 'no', s8: 'no',
      e1: 'no', e2: 'no', e3: 'no', e4: 'no', e5: 'no', e6: 'no', e7: 'no', e8: 'no',
      c1: 'no', c2: 'no', c3: 'no', c4: 'no', c5: 'no', c6: 'no', c7: 'no', c8: 'no'
    },
    expectedStream: "PCMS or PCM (Tech/Engineering)",
    expectedScores: { R: 8, I: 8, A: 0, S: 0, E: 0, C: 0 }
  },
  
  business: {
    name: "Business Student Profile",
    answers: {
      // All E questions (Enterprising)
      e1: 'yes', e2: 'yes', e3: 'yes', e4: 'yes',
      e5: 'yes', e6: 'yes', e7: 'yes', e8: 'yes',
      // All C questions (Conventional)
      c1: 'yes', c2: 'yes', c3: 'yes', c4: 'yes',
      c5: 'yes', c6: 'yes', c7: 'yes', c8: 'yes',
      // Rest are 'no'
      r1: 'no', r2: 'no', r3: 'no', r4: 'no', r5: 'no', r6: 'no', r7: 'no', r8: 'no',
      i1: 'no', i2: 'no', i3: 'no', i4: 'no', i5: 'no', i6: 'no', i7: 'no', i8: 'no',
      a1: 'no', a2: 'no', a3: 'no', a4: 'no', a5: 'no', a6: 'no', a7: 'no', a8: 'no',
      s1: 'no', s2: 'no', s3: 'no', s4: 'no', s5: 'no', s6: 'no', s7: 'no', s8: 'no'
    },
    expectedStream: "Commerce",
    expectedScores: { R: 0, I: 0, A: 0, S: 0, E: 8, C: 8 }
  },
  
  arts: {
    name: "Arts/Creative Student Profile",
    answers: {
      // All A questions (Artistic)
      a1: 'yes', a2: 'yes', a3: 'yes', a4: 'yes',
      a5: 'yes', a6: 'yes', a7: 'yes', a8: 'yes',
      // All S questions (Social)
      s1: 'yes', s2: 'yes', s3: 'yes', s4: 'yes',
      s5: 'yes', s6: 'yes', s7: 'yes', s8: 'yes',
      // Rest are 'no'
      r1: 'no', r2: 'no', r3: 'no', r4: 'no', r5: 'no', r6: 'no', r7: 'no', r8: 'no',
      i1: 'no', i2: 'no', i3: 'no', i4: 'no', i5: 'no', i6: 'no', i7: 'no', i8: 'no',
      e1: 'no', e2: 'no', e3: 'no', e4: 'no', e5: 'no', e6: 'no', e7: 'no', e8: 'no',
      c1: 'no', c2: 'no', c3: 'no', c4: 'no', c5: 'no', c6: 'no', c7: 'no', c8: 'no'
    },
    expectedStream: "Arts/Humanities",
    expectedScores: { R: 0, I: 0, A: 8, S: 8, E: 0, C: 0 }
  }
};

// Calculate RIASEC scores from answers
function calculateRiasecScores(answers) {
  const scores = { R: 0, I: 0, A: 0, S: 0, E: 0, C: 0 };
  
  Object.entries(answers).forEach(([questionId, answer]) => {
    if (answer === 'yes') {
      const type = questionId.charAt(0).toUpperCase();
      if (scores.hasOwnProperty(type)) {
        scores[type]++;
      }
    }
  });
  
  return scores;
}

// Determine stream from RIASEC scores
function determineStream(scores) {
  const sorted = Object.entries(scores)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 2);
  
  const top1 = sorted[0][0];
  const top2 = sorted[1][0];
  const top1Score = sorted[0][1];
  const top2Score = sorted[1][1];
  
  // Stream mapping logic
  if ((top1 === 'I' && top2 === 'S') || (top1 === 'S' && top2 === 'I')) {
    return 'PCMB or PCB (Medical/Biology)';
  } else if ((top1 === 'I' && top2 === 'R') || (top1 === 'R' && top2 === 'I')) {
    return 'PCMS or PCM (Tech/Engineering)';
  } else if ((top1 === 'E' && top2 === 'C') || (top1 === 'C' && top2 === 'E')) {
    return 'Commerce';
  } else if ((top1 === 'A' && top2 === 'S') || (top1 === 'S' && top2 === 'A')) {
    return 'Arts/Humanities';
  } else if (top1 === 'I') {
    return 'Science (PCM/PCMS/PCMB)';
  } else if (top1 === 'R') {
    return 'PCM (Engineering)';
  } else if (top1 === 'E' || top1 === 'C') {
    return 'Commerce';
  } else if (top1 === 'A' || top1 === 'S') {
    return 'Arts/Humanities';
  }
  
  return 'Unable to determine';
}

// Test all profiles
function testAllProfiles() {
  console.log('═══════════════════════════════════════════════════════════');
  console.log('🧪 RIASEC CALCULATION TEST');
  console.log('═══════════════════════════════════════════════════════════\n');
  
  let allPassed = true;
  
  Object.entries(testProfiles).forEach(([key, profile]) => {
    console.log(`\n📋 Testing: ${profile.name}`);
    console.log('─────────────────────────────────────────────────────────');
    
    // Calculate scores
    const calculatedScores = calculateRiasecScores(profile.answers);
    const calculatedStream = determineStream(calculatedScores);
    
    // Check if scores match
    const scoresMatch = JSON.stringify(calculatedScores) === JSON.stringify(profile.expectedScores);
    const streamMatch = calculatedStream === profile.expectedStream;
    
    console.log('Expected Scores:', profile.expectedScores);
    console.log('Calculated Scores:', calculatedScores);
    console.log('Scores Match:', scoresMatch ? '✅ PASS' : '❌ FAIL');
    
    console.log('\nExpected Stream:', profile.expectedStream);
    console.log('Calculated Stream:', calculatedStream);
    console.log('Stream Match:', streamMatch ? '✅ PASS' : '❌ FAIL');
    
    if (!scoresMatch || !streamMatch) {
      allPassed = false;
    }
  });
  
  console.log('\n═══════════════════════════════════════════════════════════');
  console.log(allPassed ? '✅ ALL TESTS PASSED' : '❌ SOME TESTS FAILED');
  console.log('═══════════════════════════════════════════════════════════\n');
  
  return allPassed;
}

// Run tests
testAllProfiles();

// Export for manual testing
console.log('\n💡 To test manually:');
console.log('1. Copy one of the answer sets from testProfiles');
console.log('2. Run: calculateRiasecScores(answers)');
console.log('3. Run: determineStream(scores)');
console.log('\nExample:');
console.log('const scores = calculateRiasecScores(testProfiles.medical.answers);');
console.log('const stream = determineStream(scores);');
console.log('console.log(scores, stream);');
