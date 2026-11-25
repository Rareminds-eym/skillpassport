import { afterEach, expect, it, vi } from 'vitest';
import { validateSignupPromo } from './validateSignupPromo';
afterEach(() => vi.unstubAllGlobals());
it('allows ordinary signup without a code or a request', async () => {
  const fetch = vi.fn(); vi.stubGlobal('fetch', fetch); expect(await validateSignupPromo(' ', 'learner')).toBe(true); expect(fetch).not.toHaveBeenCalled();
});
it.each(['learner', 'school_admin', 'college_admin'])('normalizes the code and sends %s to the validation API', async role => {
  const fetch = vi.fn().mockResolvedValue({ ok: true, json: async () => ({ valid: true }) }); vi.stubGlobal('fetch', fetch);
  expect(await validateSignupPromo(' test100 ', role)).toBe(true);
  expect(JSON.parse(fetch.mock.calls[0][1].body)).toEqual({ code: 'TEST100', role });
});
it('returns invalid for rejected/expired codes', async () => {
  vi.stubGlobal('fetch', vi.fn().mockResolvedValue({ ok: true, json: async () => ({ valid: false }) })); expect(await validateSignupPromo('EXPIRED', 'learner')).toBe(false);
});
it.each([{ ok: false }, { ok: true, json: async () => ({}) }])('blocks signup when validity cannot be confirmed', async response => {
  vi.stubGlobal('fetch', vi.fn().mockResolvedValue(response)); await expect(validateSignupPromo('TEST', 'learner')).rejects.toThrow('Unable to verify');
});
