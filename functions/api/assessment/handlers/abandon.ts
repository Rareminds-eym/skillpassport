import type {AuthenticatedPagesContext} from '../../../lib/types';
import {handleAssessmentProgress} from '../../../lib/assessment-progress';

export async function abandonHandler(context: AuthenticatedPagesContext) {
  return handleAssessmentProgress(context, 'abandon');
}
