import { z } from 'zod';
import type { PagesEnv } from '../../../lib/types';
import { verifyWebhookSecret } from '../../../lib/sync-auth';
import { catalogInventoryDatabase } from '../../../lib/subscriptions/catalog-inventory';
import { readApplicationPlanProjection } from '../../../lib/subscriptions/publication';

export const onRequestGet: PagesFunction<PagesEnv> = async ({ request, env }) => {
  const auth = await verifyWebhookSecret(request, env.INTERNAL_WEBHOOK_SECRET);
  const reply = (status: number, value: unknown) => Response.json(value, { status, headers: { 'Cache-Control': 'no-store' } });
  if (auth.ok === false) return reply(auth.status, { error: 'Projection authentication failed' });
  const url = new URL(request.url);
  if (url.search.length > 1024 || [...url.searchParams.keys()].some(key => !['planId', 'revisionId'].includes(key))
    || url.searchParams.getAll('planId').length !== 1 || url.searchParams.getAll('revisionId').length !== 1) return reply(400, { error: 'Invalid projection query' });
  const query = z.object({ planId: z.string().uuid(), revisionId: z.string().uuid() }).safeParse(Object.fromEntries(url.searchParams));
  if (!query.success) return reply(400, { error: 'Invalid projection query' });
  const product = z.string().uuid().safeParse(env.SKILLPASSPORT_PRODUCT_ID);
  if (!product.success) return reply(503, { error: 'Projection service is not configured' });
  try {
    const result = await readApplicationPlanProjection(catalogInventoryDatabase(env), query.data.planId, query.data.revisionId, product.data);
    return reply(200, result);
  } catch { return reply(503, { error: 'Projection storage unavailable' }); }
};
