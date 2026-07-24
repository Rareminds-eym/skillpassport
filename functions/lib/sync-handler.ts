import { SyncService, type SyncResult } from './sync-service';
import { apiSuccess, apiError } from './response';
import type { PagesEnv } from './types';

export async function handleSyncRequest(
  context: { request: Request; env: PagesEnv },
  handlers: Record<string, (service: SyncService, data: any) => Promise<SyncResult>>
): Promise<Response> {
  let body: any;
  try {
    body = await context.request.json();
  } catch {
    return apiError(400, 'VALIDATION_ERROR', 'Invalid JSON body', context.request);
  }
  const { action, data } = body;
  if (!action) return apiError(400, 'VALIDATION_ERROR', 'action is required', context.request);
  const handler = handlers[action];
  if (!handler) return apiError(400, 'VALIDATION_ERROR', `Unknown action: ${action}`, context.request);

  let service: SyncService;
  try {
    service = new SyncService(context.env);
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    console.error('[sync-handler] Failed to create SyncService:', message);
    return apiError(500, 'INTERNAL_ERROR', 'Sync service initialization failed', context.request);
  }

  try {
    const result = await handler(service, data);
    if (!result.success) {
      const status = result.errorCode === 'NOT_FOUND' ? 404 : 400;
      return apiError(status, result.errorCode ?? 'UNKNOWN', result.error, context.request);
    }
    return apiSuccess(result, context.request);
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    console.error('[sync-handler] Handler error:', message);
    return apiError(500, 'INTERNAL_ERROR', 'Sync handler failed', context.request);
  }
}
