/**
 * Recruiter copilot LLM endpoint: POST /api/recruiter-ai/chat
 *
 * Authenticated + recruiter-role gated. Body: { op, query?, prompt?, kind?, history? }.
 * See handlers/recruiter-chat.ts for the op contract.
 */
import { withAuth, requireRole } from '../../lib/auth';
import { handleRecruiterCopilotChat } from './handlers/recruiter-chat';

const RECRUITER_ROLES = ['recruiter', 'company_admin', 'owner'] as const;

export const onRequestPost = withAuth(
  requireRole([...RECRUITER_ROLES], async (context: any) => {
    return handleRecruiterCopilotChat(context.env, context.request);
  }),
);
