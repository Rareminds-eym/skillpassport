import { describe, expect, it } from 'vitest';
import { configurePreview, readVariable } from '../lib/preview-env.mjs';

describe('public preview environment', () => {
  const app = 'ENVIRONMENT=local\nAPP_URL=http://localhost:8788\nUNRELATED=preserve-me\n';
  const sso = 'ENVIRONMENT=local\nALLOWED_ORIGINS=http://localhost:3000\nALLOWED_APP_URLS=http://localhost:8788\n';
  it('configures the exact generated origin and preserves existing settings', () => {
    const origin = 'https://first.trycloudflare.com';
    const result = configurePreview(app, sso, origin);
    expect(readVariable(result.app, 'DEV_PUBLIC_ORIGIN')).toBe(origin);
    expect(readVariable(result.app, 'UNRELATED')).toBe('preserve-me');
    expect(readVariable(result.sso, 'ALLOWED_ORIGINS')).toBe(`http://localhost:3000,${origin}`);
    expect(readVariable(result.sso, 'SKILLPASSPORT_URL')).toBe(origin);
  });
  it('replaces the previous managed tunnel origin without accumulating it', () => {
    const first = configurePreview(app, sso, 'https://first.trycloudflare.com');
    const next = configurePreview(first.app, first.sso, 'https://second.trycloudflare.com');
    expect(next.app + next.sso).not.toContain('first.trycloudflare.com');
    expect(readVariable(next.sso, 'ALLOWED_APP_URLS')).toBe('http://localhost:8788,https://second.trycloudflare.com');
    expect(configurePreview(next.app, next.sso, 'https://second.trycloudflare.com')).toEqual(next);
  });
  it.each(['https://other.example.com', 'http://first.trycloudflare.com', 'https://first.trycloudflare.com/login', 'https://user:pass@first.trycloudflare.com'])('rejects unsupported origins: %s', origin => {
    expect(() => configurePreview(app, sso, origin)).toThrow();
  });
  it('refuses to modify non-local environments', () => {
    expect(() => configurePreview(app.replace('local', 'production'), sso, 'https://first.trycloudflare.com')).toThrow();
    expect(() => configurePreview(app, sso.replace('local', 'production'), 'https://first.trycloudflare.com')).toThrow();
  });
});
