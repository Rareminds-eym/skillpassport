import type {AuthenticatedPagesContext} from '../../../lib/types';
import {handleAssessmentProgress} from '../../../lib/assessment-progress';

export async function updateProgressHandler(context: AuthenticatedPagesContext) {
  return handleAssessmentProgress(context, 'progress');
}
