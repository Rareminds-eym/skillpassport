import type { PagesFunction, PagesEnv } from '../lib/types';
import { handleSyncRequest } from '../lib/sync-handler';

export const onRequestPost: PagesFunction<PagesEnv> = context => handleSyncRequest(context, {
  updated: (service, data) => service.syncPlanUpdated(data),
});
