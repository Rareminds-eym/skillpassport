import {finalizeAssessment} from '../../../lib/assessment-finalization';
import type {AuthenticatedPagesContext} from '../../../lib/types';

export const submitHandler = (context: AuthenticatedPagesContext) => finalizeAssessment(context, 'submit');
