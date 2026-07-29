import type { PagesFunction, PagesEnv } from '../lib/types';
import { handleSyncRequest } from '../lib/sync-handler';

export const onRequestPost: PagesFunction<PagesEnv> = (ctx) => handleSyncRequest(ctx, {
  created:        (s, d) => s.syncMembership(d),
  role_changed:   (s, d) => s.syncMembership(d),
  status_changed: (s, d) => s.syncMembership(d),
  removed:        (s, d) => s.removeMembership(d),
});
