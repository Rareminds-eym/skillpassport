/**
 * Test file for employability score calculator
 * Run this in browser console to test the calculation logic
 */

import {
  calculateEmployabilityScore,
  getDefaultEmployabilityScore,
} from './employabilityCalculator.js';

// Test data structure similar to what might come from Supabase
const testStudentData = {
  name: 'Test Student',
  email: 'test@example.com',

  // Skills with ratings (1-5 scale)
  foundationalSkills: [
    { name: 'Communication', rating: 4, evidenceVerified: true },
    { name: 'Critical Thinking', rating: 3, evidenceVerified: false },
    { name: 'Problem Solving', rating: 5, evidenceVerified: true },
  ],

  century21Skills: [
    { name: 'Collaboration', rating: 4, evidenceVerified: true },
    { name: 'Creativity', rating: 3, evidenceVerified: true },
  ],

  technicalSkills: [
    { name: 'JavaScript', rating: 4, evidenceVerified: true },
    { name: 'React', rating: 3, evidenceVerified: false },
    { name: 'Python', rating: 5, evidenceVerified: true },
  ],

  softSkills: [
    { name: 'Leadership', rating: 3, evidenceVerified: false },
    { name: 'Teamwork', rating: 4, evidenceVerified: true },
  ],

  careerSkills: [
    { name: 'Interview Skills', rating: 2, evidenceVerified: false },
    { name: 'Resume Writing', rating: 3, evidenceVerified: true },
  ],

  experience: [{ company: 'Tech Corp', position: 'Intern', duration: '3 months' }],

  participatedHackathonOrInternship: true,
  hasSkillPassportCertificate: false,
};

// Test the calculation

const result = calculateEmployabilityScore(testStudentData);

const defaultResult = getDefaultEmployabilityScore();

// Export for testing
export { testStudentData };
