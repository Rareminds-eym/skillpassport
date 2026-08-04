import type { GatewayAction } from '../types';

/** Health check action — verifies auth + envelope path with no DB access. */
export const handlePing: GatewayAction = async (ctx) => ({
  ok: true,
  data: { pong: true, requestId: ctx.requestId, time: Date.now() },
});
