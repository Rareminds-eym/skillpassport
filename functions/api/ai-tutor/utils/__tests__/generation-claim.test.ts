import { describe, expect, it, vi } from 'vitest';
import { claimTutorGeneration, completeTutorGeneration, readTutorGenerationUsage } from '../generation-claim';
describe('atomic teacher generation allowance boundary', () => {
  it('binds reservation and completion to actor, stable turn and frozen request hash', async () => {
    const rpc = vi.fn(async () => ({ data: { limit: 2, used: 0, remaining: 1 }, error: null }));
    await claimTutorGeneration({ rpc } as never, 'actor', 'turn', 'hash');
    expect(rpc).toHaveBeenCalledWith('claim_tutor_generation', { p_actor_id: 'actor', p_operation_id: 'turn', p_request_hash: 'hash' });
    await completeTutorGeneration({ rpc } as never, 'actor', 'turn', 'hash');
    expect(rpc).toHaveBeenLastCalledWith('complete_tutor_generation', { p_actor_id: 'actor', p_operation_id: 'turn', p_request_hash: 'hash' });
  });
  it('preserves limit/conflict decisions and fails closed on outages or invalid receipts', async () => {
    for (const [code, expected] of [['P0001', 'FORBIDDEN:'], ['23505', 'IDEMPOTENCY_CONFLICT:'], ['network', 'DEPENDENCY_UNAVAILABLE:']]) {
      await expect(claimTutorGeneration({ rpc: async () => ({ error: { code }, data: null }) } as never, 'a', 'o', 'h')).rejects.toThrow(expected);
    }
    await expect(claimTutorGeneration({ rpc: async () => ({ error: null, data: { limit: 3 } }) } as never, 'a', 'o', 'h')).rejects.toThrow('DEPENDENCY_UNAVAILABLE');
  });
  it('never creates an allowance for a non-teacher completion without a claim', async () => {
    expect(await completeTutorGeneration({ rpc: async () => ({ data: null, error: null }) } as never, 'a', 'o', 'h')).toBeUndefined();
    await expect(claimTutorGeneration({ rpc: async () => ({ data: null, error: null }) } as never, 'a', 'o', 'h')).rejects.toThrow();
  });
  it('reports pending reservations in the server usage projection', async () => {
    const rpc = vi.fn(async () => ({ data: { limit: 2, used: 1, remaining: 0 }, error: null }));
    expect(await readTutorGenerationUsage({ rpc } as never, 'actor')).toEqual({ limit: 2, used: 1, remaining: 0 });
    expect(rpc).toHaveBeenCalledWith('get_tutor_generation_usage', { p_actor_id: 'actor' });
    await expect(readTutorGenerationUsage({ rpc: async () => ({ data: null, error: { code: 'outage' } }) } as never, 'actor')).rejects.toThrow('DEPENDENCY_UNAVAILABLE');
  });
});
