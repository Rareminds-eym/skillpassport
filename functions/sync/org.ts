import { handleSyncRequest } from '../lib/sync-handler';
import type { PagesEnv, PagesFunction } from '../lib/types';

export const onRequestPost: PagesFunction<PagesEnv> = (ctx) => handleSyncRequest(ctx, {
  created: (s, d) => s.syncOrgCreated(d),
  updated: (s, d) => s.syncOrgUpdated(d),
  deleted: (s, d) => s.syncOrgDeleted(d),
});
