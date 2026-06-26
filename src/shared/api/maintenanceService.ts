import { getLogger } from '@/shared/config/logging';

const logger = getLogger('maintenance');

interface MaintenanceResponse {
  success: boolean;
  data: {
    enabled: boolean;
    bypassToken: string | null;
  } | null;
}

export async function fetchMaintenanceMode(): Promise<{ isEnabled: boolean; bypassToken: string | null }> {
  try {
    const res = await fetch('/api/system/maintenance', {
      headers: { 'Cache-Control': 'no-cache' },
    });
    const body = await res.json() as MaintenanceResponse;

    if (body?.success && body?.data) {
      return {
        isEnabled: body.data.enabled === true,
        bypassToken: body.data.bypassToken ?? null,
      };
    }
    logger.warn('Maintenance API returned unexpected shape', body as unknown as Record<string, unknown>);
    return { isEnabled: false, bypassToken: null };
  } catch (err) {
    logger.error('Failed to fetch maintenance mode', err as Error);
    return { isEnabled: false, bypassToken: null };
  }
}
