import { afterEach, expect, it, vi } from 'vitest';
import { waitForOrganizationReadiness } from '../organizationReadiness';
afterEach(() => vi.useRealTimers());
it('waits for projection before completing', async () => {
  vi.useFakeTimers();
  const check = vi.fn().mockResolvedValueOnce(false).mockResolvedValueOnce(true);
  const promise = waitForOrganizationReadiness(check);
  await vi.runAllTimersAsync();
  await expect(promise).resolves.toBeUndefined();
  expect(check).toHaveBeenCalledTimes(2);
});
it('reports unresolved projection after the bounded wait', async () => {
  vi.useFakeTimers();
  const check = vi.fn().mockResolvedValue(false);
  const assertion = expect(waitForOrganizationReadiness(check)).rejects.toThrow('do not create it again');
  await vi.runAllTimersAsync();
  await assertion;
  expect(check).toHaveBeenCalledTimes(20);
});
it('preserves lookup failures instead of declaring readiness', async () => {
  const check = vi.fn().mockRejectedValue(new Error('Lookup unavailable'));
  await expect(waitForOrganizationReadiness(check)).rejects.toThrow('Lookup unavailable');
  expect(check).toHaveBeenCalledTimes(1);
});
