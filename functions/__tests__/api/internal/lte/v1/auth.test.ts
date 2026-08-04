import { describe, expect, it } from 'vitest';
import {
  GatewayAuthError,
  getGatewaySecret,
  verifyServiceToken,
  verifyUserClaim,
  safeEqual,
  signServiceToken,
  signUserClaim,
} from '../../../../../api/internal/lte/v1/auth';
import type { PagesEnv } from '../../../../../lib/types';

describe('Gateway Authentication System', () => {
  const secret = 'super-secret-key-at-least-32-chars-long';
  const userId = '11111111-1111-4111-8111-111111111111';

  describe('safeEqual', () => {
    it('should return true for identical strings', async () => {
      const match = await safeEqual('hello-world-secret-12345', 'hello-world-secret-12345');
      expect(match).toBe(true);
    });

    it('should return false for different strings', async () => {
      const match = await safeEqual('hello-world-secret-12345', 'different-secret-54321');
      expect(match).toBe(false);
    });

    it('should return false if strings have different lengths', async () => {
      const match = await safeEqual('short', 'longer-secret-value');
      expect(match).toBe(false);
    });
  });

  describe('getGatewaySecret', () => {
    it('should extract secret if present and meets minimum length criteria', () => {
      const env = { LTE_INTERNAL_SECRET: secret } as PagesEnv;
      expect(getGatewaySecret(env)).toBe(secret);
    });

    it('should throw GatewayAuthError if secret is missing', () => {
      const env = {} as PagesEnv;
      expect(() => getGatewaySecret(env)).toThrow(GatewayAuthError);
      expect(() => getGatewaySecret(env)).toThrow('Gateway secret is missing or too short');
    });

    it('should throw GatewayAuthError if secret is too short', () => {
      const env = { LTE_INTERNAL_SECRET: 'too-short' } as PagesEnv;
      expect(() => getGatewaySecret(env)).toThrow(GatewayAuthError);
    });
  });

  describe('Service Token Flow', () => {
    it('should sign and verify a valid service token', async () => {
      const claims = {
        app: 'lte',
        actions: ['learning-track:get', 'ping'],
        iat: Math.floor(Date.now() / 1000) - 10,
        exp: Math.floor(Date.now() / 1000) + 60,
      };

      const token = await signServiceToken(secret, claims);
      const verified = await verifyServiceToken(secret, token);

      expect(verified.app).toBe('lte');
      expect(verified.actions).toContain('learning-track:get');
    });

    it('should throw on expired service token', async () => {
      const claims = {
        app: 'lte',
        actions: ['ping'],
        iat: Math.floor(Date.now() / 1000) - 100,
        exp: Math.floor(Date.now() / 1000) - 10, // expired
      };

      const token = await signServiceToken(secret, claims);
      await expect(verifyServiceToken(secret, token)).rejects.toThrow('Service token expired');
    });

    it('should throw on service token not yet valid (nbf)', async () => {
      const claims = {
        app: 'lte',
        actions: ['ping'],
        iat: Math.floor(Date.now() / 1000),
        exp: Math.floor(Date.now() / 1000) + 100,
        nbf: Math.floor(Date.now() / 1000) + 50, // not yet valid
      };

      const token = await signServiceToken(secret, claims);
      await expect(verifyServiceToken(secret, token)).rejects.toThrow('Service token not yet valid');
    });

    it('should throw on invalid token signature', async () => {
      const claims = {
        app: 'lte',
        actions: ['ping'],
        iat: Math.floor(Date.now() / 1000),
        exp: Math.floor(Date.now() / 1000) + 100,
      };

      const token = await signServiceToken(secret, claims);
      // Sign the SAME header.payload with a DIFFERENT (wrong) secret so the
      // signature is valid base64url but fails HMAC verification.
      const wrongSecret = 'a-different-secret-at-least-32-chars';
      const tampered = await signServiceToken(wrongSecret, claims);
      const [, payload, sig] = tampered.split('.') as [string, string, string];
      const modifiedToken = `${token.split('.')[0]}.${payload}.${sig}`;

      await expect(verifyServiceToken(secret, modifiedToken)).rejects.toThrow('Invalid service token signature');
    });

    it('should throw on malformed token structure', async () => {
      await expect(verifyServiceToken(secret, 'not-a-token')).rejects.toThrow('Malformed service token');
    });
  });

  describe('User Claim Flow', () => {
    it('should sign and verify a valid user claim', async () => {
      const { claim, sig } = await signUserClaim(secret, userId, 60);
      const verified = await verifyUserClaim(secret, claim, sig);

      expect(verified.sub).toBe(userId);
    });

    it('should throw if claim parameters are missing', async () => {
      await expect(verifyUserClaim(secret, '', 'sig')).rejects.toThrow('Missing user claim');
      await expect(verifyUserClaim(secret, 'claim', '')).rejects.toThrow('Missing user claim');
    });

    it('should throw on invalid user claim signature', async () => {
      const { claim } = await signUserClaim(secret, userId, 60);
      await expect(verifyUserClaim(secret, claim, 'wrongSignature')).rejects.toThrow('Invalid user claim signature');
    });

    it('should throw on expired user claim', async () => {
      // Simulate signed claim that has already expired by using negative ttl
      const { claim, sig } = await signUserClaim(secret, userId, -10);
      await expect(verifyUserClaim(secret, claim, sig)).rejects.toThrow('User claim expired');
    });

    it('should throw if subject is not a valid UUID', async () => {
      await expect(signUserClaim(secret, 'not-a-uuid')).rejects.toThrow('User claim subject must be a UUID');
    });
  });
});
