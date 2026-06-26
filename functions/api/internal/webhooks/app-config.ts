import type { PagesEnv } from '../../../lib/types';
import { apiSuccess, apiError } from '../../../lib/response';
import { notifyRealtime } from '../../../lib/realtime';
import { createLogger } from '../../../lib/logger';

const log = createLogger('maintenance');

interface WebhookPayload {
  type: 'INSERT' | 'UPDATE' | 'DELETE';
  table: string;
  schema: string;
  record: { key: string; value: string } | null;
  old_record: { key: string; value: string } | null;
}

export const onRequestPost: PagesFunction<PagesEnv> = async (context) => {
  const { request, env } = context;

  const authHeader = request.headers.get('Authorization');
  if (!env.INTERNAL_WEBHOOK_SECRET || authHeader !== `Bearer ${env.INTERNAL_WEBHOOK_SECRET}`) {
    return apiError(401, 'UNAUTHORIZED', 'Invalid webhook secret', request);
  }

  let payload: WebhookPayload;
  try {
    payload = await request.json();
  } catch {
    return apiError(400, 'VALIDATION_ERROR', 'Invalid JSON body', request);
  }

  const key = payload.record?.key || payload.old_record?.key;
  if (key !== 'maintenance_mode' && key !== 'maintenance_bypass_token') {
    return apiSuccess({ ignored: true, reason: 'unrelated_key' }, request);
  }

  log.info('Webhook relay: app_config change', { key, event: payload.type });

  if (payload.type === 'DELETE') {
    context.waitUntil(notifyRealtime(env, 'app_config', 'DELETE', { key }));
  } else {
    context.waitUntil(notifyRealtime(env, 'app_config', payload.type as 'INSERT' | 'UPDATE', {
      key: payload.record!.key,
      value: payload.record!.value,
    }));
  }

  return apiSuccess({ relayed: true }, request);
};
