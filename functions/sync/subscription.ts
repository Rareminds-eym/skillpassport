import type { PagesFunction, PagesEnv } from '../lib/types';
import { handleSyncRequest } from '../lib/sync-handler';

export const onRequestPost: PagesFunction<PagesEnv> = (ctx) => handleSyncRequest(ctx, {
  created:   (s, d) => s.syncSubscriptionCreated(d),
  updated:   (s, d) => s.syncSubscriptionUpdated(d),
  cancelled: (s, d) => s.syncSubscriptionCancelledOrExpired(d, 'subscription.cancelled'),
  expired:   (s, d) => s.syncSubscriptionCancelledOrExpired(d, 'subscription.expired'),
});
