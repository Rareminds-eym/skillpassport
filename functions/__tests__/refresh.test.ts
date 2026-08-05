import { describe, expect, it, vi } from 'vitest';
import { onRequestPost } from '../api/auth/refresh';

describe('Refresh API Endpoint Test Suite', () => {
  it('should return 401 MISSING_REFRESH_TOKEN if no token is present in cookie, header, or body', async () => {
    const mockRequest = new Request('https://example.test/api/auth/refresh', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({}),
    });

    const res = await onRequestPost({
      request: mockRequest,
      env: {} as any,
    });

    expect(res.status).toBe(401);
    const body = (await res.json()) as any;
    expect(body.error.code).toBe('MISSING_REFRESH_TOKEN');
  });

  it('should extract refresh token from local cookie (refresh_token=...)', async () => {
    const mockRequest = new Request('http://localhost:3000/api/auth/refresh', {
      method: 'POST',
      headers: {
        'Cookie': 'refresh_token=local_refresh_token_123',
      },
    });

    const mockRefreshSession = vi.fn().mockResolvedValue({
      access_token: 'new_access_token',
      refresh_token: 'new_refresh_token',
    });

    const mockEnv = {
      SSO_SERVICE: {
        refreshSession: mockRefreshSession,
      },
    };

    const res = await onRequestPost({
      request: mockRequest,
      env: mockEnv as any,
    });

    expect(res.status).toBe(200);
    expect(mockRefreshSession).toHaveBeenCalledWith('local_refresh_token_123', undefined, undefined);
  });

  it('should extract refresh token from secure production cookie (__Secure-refresh_token=...)', async () => {
    const mockRequest = new Request('https://skillpassport.rareminds.in/api/auth/refresh', {
      method: 'POST',
      headers: {
        'Cookie': '__Secure-refresh_token=secure_refresh_token_456',
        'CF-Connecting-IP': '203.0.113.195',
        'User-Agent': 'Mozilla/5.0',
      },
    });

    const mockRefreshSession = vi.fn().mockResolvedValue({
      access_token: 'new_access_token_secure',
      refresh_token: 'new_refresh_token_secure',
    });

    const mockEnv = {
      SSO_SERVICE: {
        refreshSession: mockRefreshSession,
      },
    };

    const res = await onRequestPost({
      request: mockRequest,
      env: mockEnv as any,
    });

    expect(res.status).toBe(200);
    expect(mockRefreshSession).toHaveBeenCalledWith('secure_refresh_token_456', '203.0.113.195', 'Mozilla/5.0');
    
    // Set-Cookie header should set __Secure-refresh_token
    const setCookie = res.headers.get('Set-Cookie');
    expect(setCookie).toContain('__Secure-refresh_token=new_refresh_token_secure');
  });

  it('should extract refresh token from __Host-refresh_token cookie', async () => {
    const mockRequest = new Request('https://example.test/api/auth/refresh', {
      method: 'POST',
      headers: {
        'Cookie': '__Host-refresh_token=host_refresh_token_789',
      },
    });

    const mockRefreshSession = vi.fn().mockResolvedValue({
      access_token: 'new_access_token_host',
      refresh_token: 'new_refresh_token_host',
    });

    const mockEnv = {
      SSO_SERVICE: {
        refreshSession: mockRefreshSession,
      },
    };

    const res = await onRequestPost({
      request: mockRequest,
      env: mockEnv as any,
    });

    expect(res.status).toBe(200);
    expect(mockRefreshSession).toHaveBeenCalledWith('host_refresh_token_789', undefined, undefined);
  });
});
