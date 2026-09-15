/**
 * Service-to-service authentication for the AI-worker ↔ SkillPassport
 * internal gateway (`POST /api/internal/ai/v1`).
 *
 * Same two-token shape as the LTE gateway: service token
 * (`Authorization: Bearer`, claims { app: "ai-worker", actions, iat, exp })
 * plus per-user claim (`X-Ai-Claim` / `X-Ai-Sig`, 60s expiry).
 * Signed with the dedicated `AI_INTERNAL_SECRET` (never the LTE secret).
 * Reuses the audited verifiers; only the secret source and app name differ.
 */

import type { PagesEnv } from '../../../lib/types';
import {
  GatewayAuthError,
  verifyServiceToken as verifyServiceTokenWith,
  verifyUserClaim as verifyUserClaimWith,
} from '../lte/v1/auth';
import type { ServiceTokenClaims, UserClaim } from '../lte/v1/auth';

export { GatewayAuthError };
export type { ServiceTokenClaims, UserClaim };

export function getAiGatewaySecret(env: PagesEnv): string {
  const secret = env.AI_INTERNAL_SECRET;
  if (!secret || secret.length < 32) {
    throw new GatewayAuthError('AI gateway secret is missing or too short', 'FORBIDDEN');
  }
  return secret;
}

export function verifyAiServiceToken(secret: string, token: string): Promise<ServiceTokenClaims> {
  return verifyServiceTokenWith(secret, token);
}

export function verifyAiUserClaim(secret: string, claim: string, signature: string): Promise<UserClaim> {
  return verifyUserClaimWith(secret, claim, signature);
}
