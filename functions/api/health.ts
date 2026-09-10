import { apiSuccess } from '../lib/response';
import { getServiceClient } from '../lib/supabase';
import { createLogger } from '../lib/logger';

const logger = createLogger('health');

export async function onRequestGet(context: { request: Request; env: Record<string, unknown> }) {
  const start = Date.now();
  const supabase = getServiceClient(context.env as any);
  const checks: Record<string, boolean> = {};
  try {
    const { error } = await supabase.from('subscription_cache').select('id').limit(1).maybeSingle();
    checks.database = !error;
  } catch { checks.database = false; }
  try {
    checks.sso_binding = !!(context.env as any).SSO_SERVICE;
  } catch { checks.sso_binding = false; }
  const healthy = Object.values(checks).every(Boolean);
  const durationMs = Date.now() - start;
  logger.info('health check', { checks, healthy, durationMs });
  return apiSuccess({ status: healthy ? 'healthy' : 'degraded', checks, durationMs, timestamp: new Date().toISOString() }, context.request, { startTime: start });
}
