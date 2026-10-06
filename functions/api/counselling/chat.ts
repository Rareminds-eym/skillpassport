/**
 * Counselling chat endpoint: POST /api/counselling/chat
 *
 * Authenticated + admin-role gated (serves the admin AI-counselling page).
 * Body: { op, topic?, message?, learner_context?, history?, messages? }.
 * See handlers/counselling-chat.ts for the op contract.
 */
import { withAuth, requireAdmin } from '../../lib/auth';
import { handleCounsellingChat } from './handlers/counselling-chat';

export const onRequestPost = withAuth((context: any) =>
  Promise.resolve(
    requireAdmin(async (ctx: any) => {
      return handleCounsellingChat(ctx.env, ctx.request);
    })(context) as Response | Promise<Response>,
  ),
);
