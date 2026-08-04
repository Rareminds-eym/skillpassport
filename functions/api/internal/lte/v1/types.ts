import type { PagesEnv } from '../../../../lib/types';
import type { ReadOnlyDb } from './readonly-db';

/**
 * Context handed to every gateway action after authentication/authorization.
 * `userId` is the verified subject of the per-user signed claim — handlers must
 * compare any requested user against it (never trust a payload userId blindly).
 */
export interface GatewayContext {
  db: ReadOnlyDb;
  env: PagesEnv;
  request: Request;
  requestId: string;
  userId: string;
}

export type GatewayResult =
  | { ok: true; data: unknown }
  | { ok: false; error: { code: string; message: string } };

export type GatewayAction = (
  ctx: GatewayContext,
  payload: Record<string, unknown>,
) => Promise<GatewayResult>;
