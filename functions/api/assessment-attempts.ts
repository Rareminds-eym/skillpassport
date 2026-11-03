import {withAuth} from '../lib/auth';
import {handleAttemptCreate} from '../lib/assessment-start';
export const onRequestPost=withAuth(handleAttemptCreate);
