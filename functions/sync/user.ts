import type { PagesFunction, PagesEnv } from '../lib/types';
import { handleSyncRequest } from '../lib/sync-handler';

export const onRequestPost: PagesFunction<PagesEnv> = (ctx) => handleSyncRequest(ctx, {
  created:        (s, d) => s.syncUser(d),
  updated:        (s, d) => s.syncUser(d),
  deleted:        (s, d) => s.deleteUser(d),
  email_verified: (s, d) => s.verifyEmail(d),
});
