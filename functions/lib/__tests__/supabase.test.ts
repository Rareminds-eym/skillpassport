// @vitest-environment node
import { afterEach, describe, expect, it, vi } from 'vitest';
import { createSupabaseAdminClient, createSupabaseClient, getServiceClient } from '../supabase';
import type { PagesEnv } from '../types';

const env = {
  SUPABASE_URL: 'https://database.example.test',
  SUPABASE_ANON_KEY: 'test-anon-key',
  SUPABASE_SERVICE_ROLE_KEY: 'test-service-key',
} as PagesEnv;

afterEach(() => {
  vi.restoreAllMocks();
  vi.unstubAllEnvs();
});

describe('Database clients bypass built-in authentication', () => {
  for (const [name, factory, key] of [
    ['anonymous', () => createSupabaseClient(env), env.SUPABASE_ANON_KEY],
    ['admin', () => createSupabaseAdminClient(env), env.SUPABASE_SERVICE_ROLE_KEY],
    ['legacy service helper', () => getServiceClient(env), env.SUPABASE_SERVICE_ROLE_KEY],
  ] as const) {
    it(`${name} preserves database API headers without creating a GoTrue client`, async () => {
      const fetchSpy = vi.spyOn(globalThis, 'fetch').mockResolvedValue(new Response('[]', {
        headers: { 'Content-Type': 'application/json' },
      }));
      const client = factory();
      expect(() => client.auth.getSession()).toThrow('configured with the accessToken option');
      const { error } = await client.from('users').select('id');
      expect(error).toBeNull();
      expect(fetchSpy).toHaveBeenCalledOnce();
      const [url, options] = fetchSpy.mock.calls[0];
      expect(String(url)).toBe('https://database.example.test/rest/v1/users?select=id');
      const headers = new Headers(options?.headers);
      expect(headers.get('Authorization')).toBe(`Bearer ${key}`);
      expect(headers.get('apikey')).toBe(key);
    });
  }

  it('keeps frontend database queries anonymous while bypassing GoTrue', async () => {
    vi.stubEnv('VITE_SUPABASE_URL', env.SUPABASE_URL);
    vi.stubEnv('VITE_SUPABASE_ANON_KEY', env.SUPABASE_ANON_KEY!);
    const fetchSpy = vi.spyOn(globalThis, 'fetch').mockResolvedValue(new Response('[]', {
      headers: { 'Content-Type': 'application/json' },
    }));
    const { supabase } = await import('../../../src/shared/api/supabaseClient');
    expect(() => supabase.auth.getSession()).toThrow('configured with the accessToken option');
    const { error } = await supabase.from('public_profiles').select('id');
    expect(error).toBeNull();
    expect(fetchSpy).toHaveBeenCalledOnce();
    const headers = new Headers(fetchSpy.mock.calls[0][1]?.headers);
    expect(headers.get('Authorization')).toBe(`Bearer ${env.SUPABASE_ANON_KEY}`);
    expect(headers.get('apikey')).toBe(env.SUPABASE_ANON_KEY);
  });
});
