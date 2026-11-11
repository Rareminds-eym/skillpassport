import { describe, expect, it } from 'vitest';
import { APPROVED_ORIGINS, getApprovedOrigins } from '../app-origins';

describe('local preview origin', () => {
  const origin = 'https://preview.rareminds.in';
  it('adds only the configured local hostname without changing the base list', () => {
    const origins = getApprovedOrigins({ ENVIRONMENT: 'local', DEV_PUBLIC_ORIGIN: origin });
    expect(origins).toContain(origin);
    expect(origins).not.toContain('https://other.rareminds.in');
    expect(APPROVED_ORIGINS).not.toContain(origin);
  });
  it.each(['production', 'development', undefined])('does not enable the override in %s', ENVIRONMENT => {
    expect(getApprovedOrigins({ ENVIRONMENT, DEV_PUBLIC_ORIGIN: origin })).toBe(APPROVED_ORIGINS);
  });
  it.each(['http://preview.rareminds.in', `${origin}/`, `${origin}/login`, 'https://user:password@preview.rareminds.in', '*', true])('rejects invalid local origins: %s', DEV_PUBLIC_ORIGIN => {
    expect(() => getApprovedOrigins({ ENVIRONMENT: 'local', DEV_PUBLIC_ORIGIN })).toThrow();
  });
});
