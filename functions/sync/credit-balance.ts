import type { PagesFunction, PagesEnv } from '../lib/types';
import { handleSyncRequest } from '../lib/sync-handler';

export const onRequestPost: PagesFunction<PagesEnv> = (ctx) => handleSyncRequest(ctx, {
  balance: (s, d) => s.syncCreditBalance(d),
});
