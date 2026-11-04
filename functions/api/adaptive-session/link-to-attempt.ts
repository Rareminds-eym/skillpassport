import {withAuth} from '../../lib/auth';
import {handleAssessmentProgress} from '../../lib/assessment-progress';

// The owner, attempt state and adaptive link are checked inside one locked transaction.
export const onRequestPost = withAuth(context => handleAssessmentProgress(context, 'progress', 'adaptive-link'));
