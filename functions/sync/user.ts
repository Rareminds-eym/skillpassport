import { handleSyncRequest } from '../lib/sync-handler';

export const onRequestPost = (ctx: any) => handleSyncRequest(ctx, {
  created:        (s, d) => s.syncUser(d),
  updated:        (s, d) => s.syncUser(d),
  deleted:        (s, d) => s.deleteUser(d),
  email_verified: (s, d) => s.verifyEmail(d),
});
