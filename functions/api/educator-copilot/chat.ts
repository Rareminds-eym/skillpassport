/**
 * Educator copilot chat endpoint: POST /api/educator-copilot/chat
 *
 * Authenticated + educator-role gated. Body: { op, query, intent?, context?, history? }.
 * See handlers/educator-chat.ts for the op contract.
 */
import { withAuth } from '../../lib/auth';
import { requireRole } from '../../lib/auth';
import { handleEducatorCopilotChat } from './handlers/educator-chat';

const EDUCATOR_ROLES = ['educator', 'school_educator', 'college_educator'] as const;

export const onRequestPost = withAuth(
  requireRole([...EDUCATOR_ROLES], async (context: any) => {
    return handleEducatorCopilotChat(context.env, context.request);
  }),
);
