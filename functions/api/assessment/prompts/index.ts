/**
 * Assessment Prompts — College Only
 * Routes cluster prompt generation for college assessments.
 * Other grade levels use their existing flows (untouched).
 */
import type { GradeLevel, StudentProfile } from '../services/core/scoring-service';
import type { PromptOccupation, ClusterNarrativeContext, ClusterPrompt } from '../types';
import { buildCollegeClusterPrompt } from './clusters/college';

/**
 * Return the cluster prompt for the given grade level.
 * College uses the new refactored prompt with Big Five / values / knowledge.
 * Other grades fall back to their existing implementations (unchanged).
 */
export function getClusterPrompt(
  gradeLevel: GradeLevel,
  student: StudentProfile,
  occupations: PromptOccupation[],
  context: ClusterNarrativeContext
): ClusterPrompt {
  switch (gradeLevel) {
    case 'college':
      return buildCollegeClusterPrompt(student, occupations, context);
    default:
      // Other grades should handle their own prompts via their existing analyzers
      // This ensures college migration doesn't affect other assessment flows
      throw new Error(`getClusterPrompt not implemented for grade level: ${gradeLevel}`);
  }
}
