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
4) Each cluster must have description, evidence, roles, domains, and whyItFits fields filled.
5) **CRITICAL**: You MUST include the "overallSummary" field at the end of the JSON - this is MANDATORY and must be 3-4 sentences.
6) **SALARY RANGES MUST VARY**: Each career must have DIFFERENT salary ranges based on the actual industry standards. DO NOT use the same salary range for all careers!

SALARY GUIDELINES (India, 2025-2030, in LPA):
- Engineering/Tech: Entry 4-8, Mid 10-15, Senior 15-25
- Medical/Healthcare: Entry 5-10, Mid 12-20, Senior 20-40
- Finance/Banking: Entry 4-8, Mid 10-18, Senior 18-35
- Creative/Design: Entry 3-6, Mid 8-12, Senior 12-20
- Teaching/Education: Entry 3-6, Mid 7-10, Senior 10-15
- Law/Legal: Entry 4-8, Mid 12-25, Senior 25-50
- Business/Management: Entry 4-8, Mid 10-20, Senior 20-40
- Research/Academia: Entry 4-8, Mid 10-15, Senior 15-25
**IMPORTANT**: Adjust based on specific role seniority and specialization!

CRITICAL JSON FORMAT RULES:
1. Start your response with { (opening brace) - NOT with [ (bracket)
2. End your response with } (closing brace) - NOT with ] (bracket)
3. Return a SINGLE JSON OBJECT, NOT an array
4. Do NOT wrap in markdown code blocks (no \`\`\`json)
5. Do NOT add any text before or after the JSON object
6. Ensure all strings are properly quoted with double quotes
7. Ensure all commas are in the right places
8. Ensure all nested objects and arrays are properly closed
9. NEVER truncate mid-object - always close all braces and brackets
10. ALL SECTIONS ARE MANDATORY - do not skip employability, knowledge, skillGap, roadmap, or finalNote
11. If you must be concise, shorten descriptions but INCLUDE ALL SECTIONS

EXAMPLE OF CORRECT FORMAT:
{
  "profileSnapshot": {...},
  "riasec": {...},
  "aptitude": {...},
  "careerFit": {...},
  "finalNote": {...},
  "overallSummary": "This is a 3-4 sentence summary that MUST be included."
}

WRONG FORMAT (DO NOT USE):
[
  {"name": "..."},
  {"name": "..."}
]

Return ONLY the JSON object (starting with {), nothing else. ENSURE "overallSummary" is included at the end!`;

  if (gradeLevel === 'middle') {
    return `${baseMessage} You are speaking to middle school students (grades 6-8). Use encouraging, age-appropriate language. Focus on exploration and discovery rather than specific career paths.${requirements}`;
  }

  if (gradeLevel === 'highschool' || gradeLevel === 'higher_secondary') {
    return `${baseMessage} You are speaking to high school students (grades 9-12). Provide guidance on college majors and career paths. Be aspirational but realistic.${requirements}`;
  }

  return `${baseMessage}${requirements}`;
}
