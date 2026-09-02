import { handleSyncRequest } from '../lib/sync-handler';

export const onRequestPost = (ctx: any) => handleSyncRequest(ctx, {
  created: (s, d) => s.syncMembership(d),
  removed: (s, d) => s.syncMembershipRemoved(d),
});
