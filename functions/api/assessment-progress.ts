import {withAuth} from '../lib/auth';
import {handleAssessmentProgress} from '../lib/assessment-progress';
export const onRequestPost = withAuth(context => handleAssessmentProgress(context));
