/**
 * Prompt Builder - Routes to appropriate prompt based on grade level
 */

import type { AssessmentData, GradeLevel } from '../types';
import { generateAnswersHash } from '../utils/hash';
import { buildMiddleSchoolPrompt } from './middle-school';
import { buildHighSchoolPrompt } from './high-school';
import { buildHigherSecondaryPrompt } from './higher-secondary';
import { buildAfter12Prompt } from './after12';
import { buildCollegePrompt } from './college';

/**
 * Build the appropriate analysis prompt based on grade level
 */
export function buildAnalysisPrompt(assessmentData: AssessmentData): string {
  const answersHash = generateAnswersHash(assessmentData);
  const gradeLevel = assessmentData.gradeLevel || 'after12';

  console.log(`[PROMPT] Building prompt for grade level: ${gradeLevel}`);

  // Middle school (grades 6-8)
  if (gradeLevel === 'middle') {
    return buildMiddleSchoolPrompt(assessmentData, answersHash);
  }

  // High school (grades 9-10)
  if (gradeLevel === 'highschool') {
    return buildHighSchoolPrompt(assessmentData, answersHash);
  }

  // Higher secondary (grades 11-12) - Separate prompt with all 6 sections required
  if (gradeLevel === 'higher_secondary') {
    return buildHigherSecondaryPrompt(assessmentData, answersHash);
  }

  // After 12th (college-bound) - NEW: Separate prompt with all 6 sections required
  if (gradeLevel === 'after12') {
    return buildAfter12Prompt(assessmentData, answersHash);
  }

  // College (university students) or After 10th (after10) - fallback to college prompt
  return buildCollegePrompt(assessmentData, answersHash);
}

/**
 * Get the system message for the AI
 */
export function getSystemMessage(gradeLevel: GradeLevel): string {
  const baseMessage = 'You are an expert career counselor and psychometric analyst. Provide detailed, deterministic career analysis.';
  
  const requirements = `
CRITICAL REQUIREMENTS:
1) Always return complete, valid JSON - never truncate.
2) You MUST provide EXACTLY 3 career clusters (High fit, Medium fit, Explore fit) - this is MANDATORY.
3) Ensure all arrays and objects are properly closed.
4) Each cluster must have description, evidence, roles, domains, and whyItFits fields filled.`;

  if (gradeLevel === 'middle') {
    return `${baseMessage} You are speaking to middle school students (grades 6-8). Use encouraging, age-appropriate language. Focus on exploration and discovery rather than specific career paths.${requirements}`;
  }

  if (gradeLevel === 'highschool' || gradeLevel === 'higher_secondary') {
    return `${baseMessage} You are speaking to high school students (grades 9-12). Provide guidance on college majors and career paths. Be aspirational but realistic.${requirements}`;
  }

  return `${baseMessage}${requirements}`;
}
