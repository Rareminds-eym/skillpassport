// @vitest-environment node
import { describe, it, expect, vi } from 'vitest';
import { completeCampaignHandoff, startCampaignHandoff } from '../lib/campaign-handoff';
import { skillpassportIdentity } from '../lib/application-identity';
const origin = 'https://skillpassport.rareminds.in';
const state = 'a'.repeat(64);
const code = 'b'.repeat(43);
const makeEnv = () => ({ EDUCATORS_APP_URL: 'https://educators.rareminds.in', SSO_SERVICE: {
 exchangeEducatorCampaignHandoff: vi.fn(async () => ({ refreshToken: 'c'.repeat(43), remainingLifetimeSeconds: 604800 }))
} });

describe('campaign handoff browser boundary', () => {
 it('starts at a configured origin and sets an HttpOnly state cookie', async () => {
   const response = await startCampaignHandoff(new Request(`${origin}/api/campaign/start?returnUrl=https://attacker.test`), makeEnv());
   expect(response.status).toBe(303);
   expect(response.headers.get('Location')).toMatch(/^https:\/\/educators.rareminds.in\/api\/handoff\?state=[a-f0-9]{64}$/);
   expect(response.headers.get('Set-Cookie')).toContain('Secure; HttpOnly; Path=/; SameSite=Lax');
 });
 it('rejects a callback without matching receiver state before contacting SSO', async () => {
   const env = makeEnv();
   const response = await completeCampaignHandoff(new Request(`${origin}/api/campaign/callback?code=${code}&state=${state}`), env);
   expect(response.headers.get('Location')).toContain('invalid_campaign_handoff');
   expect(env.SSO_SERVICE.exchangeEducatorCampaignHandoff).not.toHaveBeenCalled();
 });
 it('exchanges a matching code and returns credentials only in a secure cookie', async () => {
   const response = await completeCampaignHandoff(new Request(`${origin}/api/campaign/callback?code=${code}&state=${state}`, { headers: { Cookie: `__Host-rm-campaign-state=${state}` } }), makeEnv());
   expect(response.headers.get('Location')).toBe('/auth/callback');
   expect(response.headers.get('Set-Cookie')).toContain('__Host-rm-refresh=');
   expect(response.headers.get('Set-Cookie')).toContain('SameSite=Strict');
   expect(response.headers.get('Cache-Control')).toBe('no-store');
   expect(await response.text()).toBe('');
 });
 it('does not report login success unless application tracking succeeds', async () => {
   const binding = {
     login: vi.fn(async () => ({ kind: 'issued', session: { refreshToken: 'secret' } })),
     recordSkillpassportAccess: vi.fn().mockRejectedValue(new Error('offline')),
     logoutCurrentSession: vi.fn().mockResolvedValue({ kind: 'succeeded' }),
   };
   const result = await (skillpassportIdentity(binding).login as any)({ correlationId: 'test', app_id: 'attacker' });
   expect(result.kind).toBe('unavailable');
   expect(binding.recordSkillpassportAccess).toHaveBeenCalledWith({ refreshToken: 'secret', eventType: 'login', signup: false });
   expect(binding.logoutCurrentSession).toHaveBeenCalled();
 });
 it('tracks refresh as access, not a fresh login', async () => {
   const binding = { refreshCurrentSession: vi.fn(async () => ({ kind: 'rotated', session: { refreshToken: 'new' } })), recordSkillpassportAccess: vi.fn().mockResolvedValue(undefined) };
   await skillpassportIdentity(binding).refreshCurrentSession();
   expect(binding.recordSkillpassportAccess).toHaveBeenCalledWith({ refreshToken: 'new', eventType: 'session_access', signup: false });
 });
});
