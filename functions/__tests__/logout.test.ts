import { describe, expect, it, vi } from 'vitest';
import { onRequestPost } from '../api/auth/logout';

describe('Logout API Endpoint Test Suite', () => {
  it('should clear cookie and return success even if no refresh token is present', async () => {
    const mockRequest = new Request('https://example.test/api/auth/logout', {
      method: 'POST',
      headers: {
        'Origin': 'http://localhost:3000',
        'User-Agent': 'TestAgent',
      },
    });

    const mockLogoutSession = vi.fn();
    const mockEnv = {
      SSO_SERVICE: {
        logoutSession: mockLogoutSession,
      },
    };

    const res = await onRequestPost({
      request: mockRequest,
      env: mockEnv as any,
    });

    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.success).toBe(true);

    // Verify Set-Cookie header is set correctly to clear refresh_token
    const setCookie = res.headers.get('Set-Cookie');
    expect(setCookie).toBe('refresh_token=; Path=/; HttpOnly; SameSite=Lax; Max-Age=0');

    // Verify ssoService.logoutSession was not called since there was no token
    expect(mockLogoutSession).not.toHaveBeenCalled();
  });

  it('should extract refresh token from cookie and call ssoService.logoutSession with positional args', async () => {
    const mockRequest = new Request('https://example.test/api/auth/logout', {
      method: 'POST',
      headers: {
        'Cookie': 'refresh_token=test_refresh_token_123',
        'CF-Connecting-IP': '1.2.3.4',
        'User-Agent': 'TestAgent',
      },
    });

    const mockLogoutSession = vi.fn().mockResolvedValue(undefined);
    const mockEnv = {
      SSO_SERVICE: {
        logoutSession: mockLogoutSession,
      },
    };

    const res = await onRequestPost({
      request: mockRequest,
      env: mockEnv as any,
    });

    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.success).toBe(true);

    // Verify Set-Cookie is set to clear refresh_token
    const setCookie = res.headers.get('Set-Cookie');
    expect(setCookie).toBe('refresh_token=; Path=/; HttpOnly; SameSite=Lax; Max-Age=0');

    // Verify ssoService.logoutSession was called with correct positional parameters
    expect(mockLogoutSession).toHaveBeenCalledWith('test_refresh_token_123', '1.2.3.4', 'TestAgent');
  });

  it('should clear cookie and return success with serverRevocationPending: true if ssoService.logoutSession throws', async () => {
    const mockRequest = new Request('https://example.test/api/auth/logout', {
      method: 'POST',
      headers: {
        'Cookie': 'refresh_token=test_refresh_token_123',
        'CF-Connecting-IP': '1.2.3.4',
        'User-Agent': 'TestAgent',
      },
    });

    const mockLogoutSession = vi.fn().mockRejectedValue(new Error('SSO Service Connection Error'));
    const mockEnv = {
      SSO_SERVICE: {
        logoutSession: mockLogoutSession,
      },
    };

    const res = await onRequestPost({
      request: mockRequest,
      env: mockEnv as any,
    });

    expect(res.status).toBe(200);
    const body = (await res.json()) as any;
    expect(body.success).toBe(true);
    expect(body.meta.serverRevocationPending).toBe(true);

    // Cookie must still be cleared locally
    const setCookie = res.headers.get('Set-Cookie');
    expect(setCookie).toBe('refresh_token=; Path=/; HttpOnly; SameSite=Lax; Max-Age=0');

    expect(mockLogoutSession).toHaveBeenCalledWith('test_refresh_token_123', '1.2.3.4', 'TestAgent');
  });
});
