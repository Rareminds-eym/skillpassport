import {finalizeAssessment} from '../../../lib/assessment-finalization';
import type {AuthenticatedPagesContext} from '../../../lib/types';

export const saveResultsHandler = (context: AuthenticatedPagesContext) => finalizeAssessment(context, 'results');
