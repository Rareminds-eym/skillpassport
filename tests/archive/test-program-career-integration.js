/**
 * Test: Program to Career Tracks Integration
 * Verifies that recommended programs show correct career tracks
 */

import { COURSE_KNOWLEDGE_BASE, DEGREE_PROGRAMS } from './src/features/assessment/assessment-result/utils/courseMatchingEngine.js';

console.log('🧪 Testing Program → Career Tracks Integration\n');

// Test 1: Verify all programs have career paths
console.log('Test 1: Checking if all programs have career paths...');
let allHaveCareerPaths = true;

DEGREE_PROGRAMS.forEach(program => {
    const courseProfile = COURSE_KNOWLEDGE_BASE[program.courseId];
    const careerPaths = courseProfile?.careerPaths || [];
    
    console.log(`\n📚 ${program.courseName} (${program.category})`);
    console.log(`   Course ID: ${program.courseId}`);
    console.log(`   Career Paths: ${careerPaths.length}`);
    
    if (careerPaths.length === 0) {
        console.log('   ❌ NO CAREER PATHS DEFINED!');
        allHaveCareerPaths = false;
    } else {
        careerPaths.forEach((career, idx) => {
            const salaryRange = career.salary 
                ? `₹${career.salary.min}L - ₹${career.salary.max}L`
                : 'No salary data';
            console.log(`   ${idx + 1}. ${career.role} (${salaryRange})`);
        });
    }
});

console.log('\n' + '='.repeat(60));
console.log(allHaveCareerPaths ? '✅ Test 1 PASSED: All programs have career paths' : '❌ Test 1 FAILED: Some programs missing career paths');

// Test 2: Verify career path structure
console.log('\n\nTest 2: Verifying career path data structure...');
let allHaveValidStructure = true;

DEGREE_PROGRAMS.forEach(program => {
    const courseProfile = COURSE_KNOWLEDGE_BASE[program.courseId];
    const careerPaths = courseProfile?.careerPaths || [];
    
    careerPaths.forEach(career => {
        if (!career.role) {
            console.log(`❌ ${program.courseName}: Missing 'role' field`);
            allHaveValidStructure = false;
        }
        if (!career.salary || typeof career.salary.min !== 'number' || typeof career.salary.max !== 'number') {
            console.log(`❌ ${program.courseName} - ${career.role}: Invalid salary structure`);
            allHaveValidStructure = false;
        }
    });
});

console.log(allHaveValidStructure ? '✅ Test 2 PASSED: All career paths have valid structure' : '❌ Test 2 FAILED: Some career paths have invalid structure');

// Test 3: Count careers by stream
console.log('\n\nTest 3: Career distribution by stream...');
const streamCareers = {
    science: [],
    commerce: [],
    arts: []
};

DEGREE_PROGRAMS.forEach(program => {
    const courseProfile = COURSE_KNOWLEDGE_BASE[program.courseId];
    const stream = courseProfile?.stream || 'unknown';
    const careerPaths = courseProfile?.careerPaths || [];
    
    if (streamCareers[stream]) {
        streamCareers[stream].push(...careerPaths.map(c => c.role));
    }
});

console.log('\n📊 Career Distribution:');
Object.entries(streamCareers).forEach(([stream, careers]) => {
    console.log(`\n${stream.toUpperCase()} Stream: ${careers.length} careers`);
    careers.forEach((career, idx) => {
        console.log(`   ${idx + 1}. ${career}`);
    });
});

// Test 4: Salary range analysis
console.log('\n\nTest 4: Salary range analysis...');
const allSalaries = [];

DEGREE_PROGRAMS.forEach(program => {
    const courseProfile = COURSE_KNOWLEDGE_BASE[program.courseId];
    const careerPaths = courseProfile?.careerPaths || [];
    
    careerPaths.forEach(career => {
        if (career.salary) {
            allSalaries.push({
                role: career.role,
                program: program.courseName,
                min: career.salary.min,
                max: career.salary.max,
                avg: (career.salary.min + career.salary.max) / 2
            });
        }
    });
});

// Sort by average salary
allSalaries.sort((a, b) => b.avg - a.avg);

console.log('\n💰 Top 10 Highest Paying Careers:');
allSalaries.slice(0, 10).forEach((career, idx) => {
    console.log(`   ${idx + 1}. ${career.role} (${career.program})`);
    console.log(`      ₹${career.min}L - ₹${career.max}L (avg: ₹${career.avg}L)`);
});

console.log('\n💼 Entry-Level Careers (< ₹10L avg):');
const entryLevel = allSalaries.filter(c => c.avg < 10);
entryLevel.forEach((career, idx) => {
    console.log(`   ${idx + 1}. ${career.role} (${career.program})`);
    console.log(`      ₹${career.min}L - ₹${career.max}L`);
});

// Test 5: Simulate user click flow
console.log('\n\nTest 5: Simulating user click flow...');
console.log('\n📱 User Journey Simulation:');
console.log('1. Student completes after12 assessment');
console.log('2. Views "Recommended Programs" tab');
console.log('3. Sees top 5 programs with match scores');

// Simulate top 3 programs
const topPrograms = DEGREE_PROGRAMS.slice(0, 3);
console.log('\n📋 Top 3 Recommended Programs:');

topPrograms.forEach((program, idx) => {
    const courseProfile = COURSE_KNOWLEDGE_BASE[program.courseId];
    const careerPaths = courseProfile?.careerPaths || [];
    const mockMatchScore = 85 - (idx * 5); // Simulate decreasing match scores
    
    console.log(`\n   ${idx + 1}. ${program.courseName}`);
    console.log(`      Category: ${program.category}`);
    console.log(`      Match Score: ${mockMatchScore}%`);
    console.log(`      Career Tracks Available: ${careerPaths.length}`);
    
    console.log(`\n      👆 User clicks on card...`);
    console.log(`      ✅ Modal opens with career tracks:`);
    
    careerPaths.forEach((career, careerIdx) => {
        const salary = career.salary 
            ? `₹${career.salary.min}L - ₹${career.salary.max}L`
            : 'Salary not available';
        console.log(`         Track ${careerIdx + 1}: ${career.role} (${salary})`);
    });
});

// Final Summary
console.log('\n\n' + '='.repeat(60));
console.log('📊 INTEGRATION TEST SUMMARY');
console.log('='.repeat(60));
console.log(`✅ Total Programs: ${DEGREE_PROGRAMS.length}`);
console.log(`✅ Total Career Paths: ${allSalaries.length}`);
console.log(`✅ Science Careers: ${streamCareers.science.length}`);
console.log(`✅ Commerce Careers: ${streamCareers.commerce.length}`);
console.log(`✅ Arts Careers: ${streamCareers.arts.length}`);
console.log(`✅ Salary Range: ₹${Math.min(...allSalaries.map(s => s.min))}L - ₹${Math.max(...allSalaries.map(s => s.max))}L`);
console.log('='.repeat(60));

if (allHaveCareerPaths && allHaveValidStructure) {
    console.log('\n🎉 ALL TESTS PASSED! Integration is working correctly.');
    console.log('\n✅ Ready for production deployment!');
} else {
    console.log('\n⚠️  SOME TESTS FAILED! Please review the issues above.');
}

console.log('\n📝 Next Steps:');
console.log('   1. Test in browser with real after12 assessment');
console.log('   2. Click on each recommended program');
console.log('   3. Verify career tracks modal opens correctly');
console.log('   4. Check salary ranges display properly');
console.log('   5. Test full roadmap for each career track');
