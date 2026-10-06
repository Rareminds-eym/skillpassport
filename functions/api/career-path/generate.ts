/**
 * Career-path generation endpoint: POST /api/career-path/generate
 *
 * Authenticated + admin-role gated (serves the admin enrollments flow).
 * Body: { learner }. Returns raw model text; parsing stays browser-side.
 */
import { withAuth, requireAdmin } from '../../lib/auth';
import { handleGenerateCareerPath } from './handlers/generate';

export const onRequestPost = withAuth((context: any) =>
  Promise.resolve(
    requireAdmin(async (ctx: any) => {
      return handleGenerateCareerPath(ctx.env, ctx.request);
    })(context) as Response | Promise<Response>,
  ),
);
