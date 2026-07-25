/**
 * Assessment Prompts — Organized by Feature (Synthesis vs Clustering)
 * The generator calls getClusterPrompt(gradeLevel, ...) and stays prompt-agnostic.
 */
import type { GradeLevel, StudentProfile } from '../services/core/scoring-service';
import type { PromptOccupation, ClusterNarrativeContext, ClusterPrompt } from '../types';
import { buildMiddleSchoolClusterPrompt } from './clusters/middle-school';
import { buildCollegeClusterPrompt } from './clusters/college';

/**
 * Return the system + user cluster prompt for the given grade level.
 * College uses the richer (Big Five / values / knowledge) prompt; everything else uses the
 * middle-school prompt for now (high/higher/after10/after12 to get their own files later).
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
    case 'middle':
    default:
      return buildMiddleSchoolClusterPrompt(student, occupations, context);
  }
}
