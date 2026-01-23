/**
 * Test script to verify parseStudentType handles "college-student" correctly
 */

// Simulate the parseStudentType function
function parseStudentType(studentType) {
    if (!studentType) {
        return { entity: 'school', role: 'student' };
    }

    // Handle simple types
    if (studentType === 'student' || studentType === 'school') return { entity: 'school', role: 'student' };
    if (studentType === 'college') return { entity: 'college', role: 'student' };
    if (studentType === 'university') return { entity: 'university', role: 'student' };
    if (studentType === 'educator') return { entity: 'school', role: 'educator' };
    if (studentType === 'admin') return { entity: 'school', role: 'admin' };

    // Handle entity-specific types
    if (studentType.includes('-')) {
        const parts = studentType.split('-');
        if (parts.length === 2) {
            return { entity: parts[0], role: parts[1] };
        }
    }

    return { entity: 'school', role: 'student' };
}

console.log('🧪 Testing parseStudentType Function\n');
console.log('='.repeat(60));

const testCases = [
    { input: 'college', expected: { entity: 'college', role: 'student' } },
    { input: 'college-student', expected: { entity: 'college', role: 'student' } },
    { input: 'college-educator', expected: { entity: 'college', role: 'educator' } },
    { input: 'university', expected: { entity: 'university', role: 'student' } },
    { input: 'university-student', expected: { entity: 'university', role: 'student' } },
    { input: 'school', expected: { entity: 'school', role: 'student' } },
    { input: 'student', expected: { entity: 'school', role: 'student' } },
];

let passed = 0;
let failed = 0;

testCases.forEach((test, index) => {
    const result = parseStudentType(test.input);
    const isMatch = result.entity === test.expected.entity && result.role === test.expected.role;
    
    console.log(`\nTest ${index + 1}: "${test.input}"`);
    console.log(`  Expected: { entity: '${test.expected.entity}', role: '${test.expected.role}' }`);
    console.log(`  Got:      { entity: '${result.entity}', role: '${result.role}' }`);
    console.log(`  Status:   ${isMatch ? '✅ PASS' : '❌ FAIL'}`);
    
    if (isMatch) passed++;
    else failed++;
});

console.log('\n' + '='.repeat(60));
console.log(`\n📊 Results: ${passed} passed, ${failed} failed`);

// Test the specific condition used in SignupModal
console.log('\n' + '='.repeat(60));
console.log('\n🎯 Testing SignupModal Condition\n');

const modalTestCases = [
    'college',
    'college-student',
    'college-educator',
    'school',
    'university'
];

modalTestCases.forEach(studentType => {
    const { entity } = parseStudentType(studentType);
    const shouldShowDropdown = entity === 'college';
    
    console.log(`studentType: "${studentType}"`);
    console.log(`  → entity: "${entity}"`);
    console.log(`  → Show college dropdown? ${shouldShowDropdown ? '✅ YES' : '❌ NO'}`);
    console.log();
});

console.log('='.repeat(60));
console.log('\n✅ Test Complete!\n');
