import { beforeEach, describe, expect, it, vi } from 'vitest';
import { SyncService } from '../lib/sync-service';
import { syncPlanCache } from '../lib/sync-shadow';

vi.mock('../lib/sync-shadow', () => ({ syncPlanCache: vi.fn(), syncUserShadow: vi.fn() }));

const id = '00000000-0000-4000-8000-000000000001';
const canonical = { id, is_active: false, plan_code: 'synthetic', name: 'Synthetic', business_type: 'individual',
  applicable_entities: [], pricing_matrix: {}, base_features: [], entity_config: {}, display_order: 1,
  product_id: '00000000-0000-4000-8000-000000000002', updated_at: '2026-11-22T00:00:00Z' };
const ssoSyncPlans = vi.fn();
const service = () => Object.assign(Object.create(SyncService.prototype), { env: { SSO_SERVICE: { syncPlans: ssoSyncPlans } } }) as SyncService;

beforeEach(() => vi.resetAllMocks());

describe('current canonical plan receiver', () => {
  it('reads current retirement from the owner before writing the cache', async () => {
    ssoSyncPlans.mockResolvedValue({ plans: [canonical] });
    const result = await service().syncPlanUpdated({ id });
    expect(result.success).toBe(true);
    expect(syncPlanCache).toHaveBeenCalledWith(undefined, canonical);
  });

  it('rejects an event carrying mutable plan data', async () => {
    expect((await service().syncPlanUpdated({ id, is_active: true })).success).toBe(false);
    expect(ssoSyncPlans).not.toHaveBeenCalled();
    expect(syncPlanCache).not.toHaveBeenCalled();
  });

  it.each([[], [canonical, canonical]].map(plans => ({ plans })))('rejects an absent or ambiguous canonical reference', async ({ plans }) => {
    vi.mocked(ssoSyncPlans).mockResolvedValue({ plans });
    expect((await service().syncPlanUpdated({ id })).success).toBe(false);
    expect(syncPlanCache).not.toHaveBeenCalled();
  });

  it('surfaces owner and persistence failure instead of confirming delivery', async () => {
    vi.mocked(ssoSyncPlans).mockRejectedValueOnce(new Error('owner unavailable'));
    await expect(service().syncPlanUpdated({ id })).rejects.toThrow('owner unavailable');
    expect(syncPlanCache).not.toHaveBeenCalled();
    vi.mocked(ssoSyncPlans).mockResolvedValue({ plans: [canonical] });
    vi.mocked(syncPlanCache).mockRejectedValueOnce(new Error('cache unavailable'));
    await expect(service().syncPlanUpdated({ id })).rejects.toThrow('cache unavailable');
  });
});
