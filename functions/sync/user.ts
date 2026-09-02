import { handleSyncRequest } from '../lib/sync-handler';

export const onRequestPost = (ctx: any) => handleSyncRequest(ctx, {
  created: (s, d) => s.syncUserCreated(d),
  deleted: (s, d) => s.syncUserDeleted(d),
  email_verified: (s, d) => s.syncUserEmailVerified(d),
});
