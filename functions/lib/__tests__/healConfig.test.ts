import { describe, it, expect } from 'vitest';
import { isHealEnabledSync, isHealLogOnly } from '../healConfig';

describe('healConfig (sync env fallback — Flagship or HEAL_MODE)', () => {
  it('defaults to enabled when no env', async () => {
    expect(isHealEnabledSync({}, 'heal-user')).toBe(true);
    expect(isHealEnabledSync({}, 'subscription-cache-heal')).toBe(true);
  });

  it('HEAL_MODE=disabled disables all', () => {
    expect(isHealEnabledSync({ HEAL_MODE: 'disabled' }, 'heal-user')).toBe(false);
    expect(isHealEnabledSync({ HEAL_MODE: 'disabled' }, 'cron-reconcile-heal')).toBe(false);
  });

  it('HEAL_MODE=log-only keeps enabled', () => {
    expect(isHealEnabledSync({ HEAL_MODE: 'log-only' }, 'heal-user')).toBe(true);
    expect(isHealLogOnly({ HEAL_MODE: 'log-only' }, 'heal-user')).toBe(true);
  });

  it('HEAL_CATEGORIES per-flag overrides global', () => {
    expect(isHealEnabledSync({ HEAL_MODE: 'enabled', HEAL_CATEGORIES: JSON.stringify({ 'heal-user': 'disabled' }) }, 'heal-user')).toBe(false);
    expect(isHealEnabledSync({ HEAL_MODE: 'enabled', HEAL_CATEGORIES: JSON.stringify({ 'heal-user': 'disabled' }) }, 'subscription-cache-heal')).toBe(true);
  });

  it('HEAL_CATEGORIES log-only per flag', () => {
    expect(isHealEnabledSync({ HEAL_CATEGORIES: JSON.stringify({ 'heal-user': 'log-only' }) }, 'heal-user')).toBe(true);
    expect(isHealLogOnly({ HEAL_CATEGORIES: JSON.stringify({ 'heal-user': 'log-only' }) }, 'heal-user')).toBe(true);
  });

  it('invalid HEAL_CATEGORIES JSON falls back to global', () => {
    expect(isHealEnabledSync({ HEAL_MODE: 'disabled', HEAL_CATEGORIES: 'not json' }, 'heal-user')).toBe(false);
    expect(isHealEnabledSync({ HEAL_MODE: 'enabled', HEAL_CATEGORIES: 'not json' }, 'heal-user')).toBe(true);
  });

  it('HEAL_CATEGORIES enabled overrides global disabled', () => {
    expect(isHealEnabledSync({ HEAL_MODE: 'disabled', HEAL_CATEGORIES: JSON.stringify({ 'heal-user': 'enabled' }) }, 'heal-user')).toBe(true);
  });

  it('Flagship binding via HEAL_MODE disabled overrides Flagship enabled (async)', async () => {
    const { isHealEnabled } = await import('../healConfig');
    // Simulate Flagship FLAGS binding returning true, but env says disabled
    const env: Record<string, unknown> = {
      HEAL_MODE: 'disabled',
      FLAGS: { getBooleanValue: async () => true },
    } as any;
    expect(await isHealEnabled(env, 'heal-user', true)).toBe(false);
  });

  it('Flagship binding enabled returns true when env not disabled', async () => {
    const { isHealEnabled } = await import('../healConfig');
    const env: Record<string, unknown> = {
      FLAGS: { getBooleanValue: async () => true },
    } as any;
    expect(await isHealEnabled(env, 'heal-user', false)).toBe(true);
  });

  it('Flagship eval failure falls back to env default', async () => {
    const { isHealEnabled } = await import('../healConfig');
    const env: Record<string, unknown> = {
      HEAL_MODE: 'enabled',
      FLAGS: { getBooleanValue: async () => { throw new Error('Flagship down'); } },
    } as any;
    expect(await isHealEnabled(env, 'heal-user', true)).toBe(true);
  });
});
