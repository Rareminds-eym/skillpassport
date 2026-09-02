import { handleSyncRequest } from '../lib/sync-handler';

export const onRequestPost = (ctx: any) => handleSyncRequest(ctx, {
  created: (s, d) => s.syncOrgCreated(d),
  updated: (s, d) => s.syncOrgUpdated(d),
});
