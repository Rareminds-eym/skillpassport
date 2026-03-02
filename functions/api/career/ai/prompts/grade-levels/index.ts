// Grade-Level Prompt Configuration - Main Orchestrator

import { middleSchoolConfig } from './middle-school';
import { highSchoolConfig } from './high-school';
import { higherSecondaryConfig } from './higher-secondary';
import { collegeConfig } from './college';
import { GradePromptConfig, GradeLevel } from './types';

// Grade configuration registry
export const GRADE_CONFIGS: Record<GradeLevel, GradePromptConfig> = {
  middle: middleSchoolConfig,
  highschool: highSchoolConfig,
  after10: highSchoolConfig, // Same as highschool
  higher_secondary: higherSecondaryConfig,
  after12: higherSecondaryConfig, // Same as higher_secondary
  college: collegeConfig
};

/**
 * Get grade-specific prompt configuration
 * @param gradeLevel - Student's grade level
 * @returns Grade-specific prompt configuration
 */
export function getGradeConfig(gradeLevel: GradeLevel): GradePromptConfig {
  return GRADE_CONFIGS[gradeLevel] || GRADE_CONFIGS.college; // Default to college
}

/**
 * Detect grade level from student profile
 * @param profile - Student profile data
 * @returns Detected grade level
 */
export function detectGradeLevel(profile: any): GradeLevel {
  // Priority 1: Check grade field directly
  if (profile.grade) {
    const grade = profile.grade.toLowerCase();
    
    // Middle school patterns
    if (grade.includes('6') || grade.includes('7') || grade.includes('8') || 
        grade.includes('middle') || grade.includes('vi') || grade.includes('vii') || grade.includes('viii')) {
      return 'middle';
    }
    
    // High school patterns
    if (grade.includes('9') || grade.includes('10') || 
        grade.includes('ix') || grade.includes('x') || grade.includes('after10')) {
      return 'highschool';
    }
    
    // Higher secondary patterns
    if (grade.includes('11') || grade.includes('12') || 
        grade.includes('xi') || grade.includes('xii') || 
        grade.includes('higher') || grade.includes('after12')) {
      return 'higher_secondary';
    }
    
    // College patterns
    if (grade.includes('college') || grade.includes('university') || 
        grade.includes('undergraduate') || grade.includes('graduate') ||
        grade.includes('bachelor') || grade.includes('master') || 
        grade.includes('degree') || grade.includes('engineering')) {
      return 'college';
    }
  }
  
  // Priority 2: Check education array for degree level
  if (profile.education && profile.education.length > 0) {
    const latestEducation = profile.education[0];
    const level = (latestEducation.level || latestEducation.degree_level || '').toLowerCase();
    
    if (level.includes('bachelor') || level.includes('undergraduate') || 
        level.includes('b.tech') || level.includes('b.e') || 
        level.includes('bca') || level.includes('bba')) {
      return 'college';
    }
    
    if (level.includes('master') || level.includes('postgraduate') || 
        level.includes('m.tech') || level.includes('mba') || level.includes('mca')) {
      return 'college';
    }
    
    if (level.includes('12') || level.includes('xii') || level.includes('higher secondary')) {
      return 'higher_secondary';
    }
    
    if (level.includes('10') || level.includes('x') || level.includes('high school')) {
      return 'highschool';
    }
  }
  
  // Default: Assume college level if no clear indication
  return 'college';
}

/**
 * Build grade-specific guardrails section for prompt
 * @param gradeLevel - Student's grade level
 * @returns Formatted guardrails string
 */
export function buildGuardrailsSection(gradeLevel: GradeLevel): string {
  const config = getGradeConfig(gradeLevel);
  
  return `<guardrails>
${config.guardrails.map(g => 
  `⚠️ [${g.severity.toUpperCase()}] ${g.rule}${g.explanation ? `\n   → ${g.explanation}` : ''}`
).join('\n\n')}
</guardrails>`;
}

/**
 * Build grade-specific examples section for prompt
 * @param gradeLevel - Student's grade level
 * @param intent - Current conversation intent
 * @returns Formatted examples string with chain-of-thought reasoning
 */
export function buildExamplesSection(gradeLevel: GradeLevel, intent?: string): string {
  const config = getGradeConfig(gradeLevel);
  
  // Filter examples by intent if provided
  const relevantExamples = intent 
    ? config.examples.filter(ex => ex.intent === intent)
    : config.examples.slice(0, 2); // Show first 2 if no intent
  
  if (relevantExamples.length === 0) {
    return '';
  }
  
  return `<examples>
<instruction>Study these examples to understand the correct approach for ${gradeLevel} students:</instruction>

${relevantExamples.map(ex => `
<example intent="${ex.intent}">
<user_query>${ex.userQuery}</user_query>

${ex.chainOfThought ? `<chain_of_thought>
${ex.chainOfThought}
</chain_of_thought>` : ''}

<ideal_response>
${ex.idealResponse}
</ideal_response>

${ex.reasoning ? `<why_this_works>${ex.reasoning}</why_this_works>` : ''}
</example>
`).join('\n')}

<instruction>Follow this same reasoning process for the current query.</instruction>
</examples>`;
}

// Re-export types for convenience
export * from './types';
export { middleSchoolConfig, highSchoolConfig, higherSecondaryConfig, collegeConfig };
