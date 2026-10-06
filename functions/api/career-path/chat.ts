/**
 * Career-path follow-up chat endpoint: POST /api/career-path/chat
 *
 * Authenticated + admin-role gated (serves the admin enrollments drawer).
 * Body: { system, history, input }. See handlers/generate.ts.
 */
import { withAuth, requireAdmin } from '../../lib/auth';
import { handleCareerPathChat } from './handlers/generate';

export const onRequestPost = withAuth((context: any) =>
  Promise.resolve(
    requireAdmin(async (ctx: any) => {
      return handleCareerPathChat(ctx.env, ctx.request);
    })(context) as Response | Promise<Response>,
  ),
);
