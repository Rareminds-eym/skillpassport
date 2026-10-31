// @vitest-environment node
import { describe, expect, it, vi } from 'vitest';
import { getNumericLimit } from '../shared/lib/entitlement-service';
function query(data: unknown) {
  const chain: Record<string, unknown> = {};
  for (const key of ['select', 'eq', 'or', 'order', 'limit'])
    chain[key] = () => chain;
  chain.maybeSingle = async () => ({ data, error: null });
  return chain;
}
function client(
  limit: number | null,
  override: number | null | undefined = undefined,
) {
  return {
    from: (table: string) =>
      query(
        table === 'features'
          ? { id: 'feature-1' }
          : table === 'tenant_entitlement_overrides'
            ? override === undefined
              ? null
              : { value_numeric: override, is_enabled: true }
            : table === 'subscription_cache'
              ? { plan_id: 'plan-1' }
              : { value_numeric: limit, is_enabled: true },
      ),
    rpc: vi.fn(async () => ({
      data: [{ feature_key: 'seat_feature', quantity: 2 }],
      error: null,
    })),
  };
}
describe('purchased numeric limits', () => {
  it('adds only the current purchased quantities to the plan base', async () => {
    expect(
      await getNumericLimit(client(3) as never, 'tenant-1', 'seat_feature'),
    ).toEqual({ enabled: true, limit: 5 });
  });
  it('retains custom base overrides while adding active purchased capacity', async () => {
    expect(
      await getNumericLimit(client(3, 8) as never, 'tenant-1', 'seat_feature'),
    ).toEqual({ enabled: true, limit: 10 });
  });
  it('preserves an explicitly unlimited base', async () => {
    expect(
      await getNumericLimit(client(null) as never, 'tenant-1', 'seat_feature'),
    ).toEqual({ enabled: true, limit: null });
  });
});
