// Test the difficulty adjustment logic
// Run with: node test-difficulty-adjustment.js

function adjustDifficulty(currentDifficulty, isCorrect) {
  let newDifficulty;
  let change;
  
  if (isCorrect) {
    if (currentDifficulty >= 5) {
      newDifficulty = 5;
      change = 'unchanged';
    } else {
      newDifficulty = currentDifficulty + 1;
      change = 'increased';
    }
  } else {
    if (currentDifficulty <= 1) {
      newDifficulty = 1;
      change = 'unchanged';
    } else {
      newDifficulty = currentDifficulty - 1;
      change = 'decreased';
    }
  }
  
  return {
    previousDifficulty: currentDifficulty,
    newDifficulty,
    change,
  };
}

console.log('Testing difficulty adjustment logic:\n');

// Test correct answers
console.log('✅ CORRECT ANSWERS:');
for (let diff = 1; diff <= 5; diff++) {
  const result = adjustDifficulty(diff, true);
  console.log(`  Level ${diff} → ${result.newDifficulty} (${result.change})`);
}

console.log('\n❌ INCORRECT ANSWERS:');
for (let diff = 1; diff <= 5; diff++) {
  const result = adjustDifficulty(diff, false);
  console.log(`  Level ${diff} → ${result.newDifficulty} (${result.change})`);
}

console.log('\n🎯 SPECIFIC TEST CASE (User\'s issue):');
console.log('Question 12 at Level 3, answered correctly:');
const userCase = adjustDifficulty(3, true);
console.log(`  Current: ${userCase.previousDifficulty}`);
console.log(`  New: ${userCase.newDifficulty}`);
console.log(`  Change: ${userCase.change}`);
console.log(`  Expected: 4`);
console.log(`  Result: ${userCase.newDifficulty === 4 ? '✅ PASS' : '❌ FAIL'}`);
