import type { PagesFunction, PagesEnv } from '../lib/types';
import { handleSyncRequest } from '../lib/sync-handler';

export const onRequestPost: PagesFunction<PagesEnv> = (ctx) => handleSyncRequest(ctx, {
  created: (s, d) => s.syncOrgCreated(d),
  updated: (s, d) => s.syncOrgUpdated(d),
});
