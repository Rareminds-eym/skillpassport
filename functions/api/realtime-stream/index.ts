// @public-endpoint: Proxies the WebSocket upgrade to the realtime DO via direct binding.
// Auth verification happens here (SSO RPC), then we call the DO stub directly via REALTIME_HUB binding.
// This avoids the Fetcher capability serialization issue across service bindings.
// (RBAC guard-matrix, task 11.1/11.4; CC-2)

import { getPartitionId } from '../../lib/partition';
import { PagesEnv } from '../../lib/types';

interface RealtimeStreamEnv extends PagesEnv {
  SSO_SERVICE: NonNullable<PagesEnv['SSO_SERVICE']>;
  REALTIME_HUB: DurableObjectNamespace;
}

function jsonError(status: number, error: string, requestId: string): Response {
  return new Response(
    JSON.stringify({ error, requestId, timestamp: new Date().toISOString() }),
    {
      status,
      headers: {
        'Content-Type': 'application/json',
        'X-Request-ID': requestId,
      },
    }
  );
}

export const onRequestGet: PagesFunction<RealtimeStreamEnv> = async (context) => {
  const requestId = crypto.randomUUID();

  if (context.request.headers.get('Upgrade') !== 'websocket') {
    return jsonError(426, 'Expected Upgrade: websocket', requestId);
  }

  try {
    // Extract JWT from Sec-WebSocket-Protocol header.
    // The client sends: `access_token, <jwt>` as the protocol value.
    // Per RFC 6455, the server MUST only echo a subprotocol the client offered.
    const protocols = context.request.headers.get('Sec-WebSocket-Protocol') || '';
    const parts = protocols.split(',').map(p => p.trim());
    const tokenIndex = parts.indexOf('access_token');
    const token = tokenIndex !== -1 && tokenIndex < parts.length - 1 ? parts[tokenIndex + 1] : '';

    if (!token || !parts.includes('access_token')) {
      return jsonError(401, 'Missing auth token in Sec-WebSocket-Protocol', requestId);
    }

    // Verify JWT via SSO service
    let userId: string;
    try {
      const result = await context.env.SSO_SERVICE.getMe(token);
      userId = result.sub as string;
    } catch (err) {
      console.error(JSON.stringify({
        message: 'SSO verification failed',
        requestId,
        error: err instanceof Error ? err.message : String(err),
      }));
      return jsonError(401, 'Authentication failed', requestId);
    }

    // Get DO stub directly via REALTIME_HUB binding
    const partitionId = getPartitionId(userId);
    const id = context.env.REALTIME_HUB.idFromName(`partition-${partitionId}`);
    const stub = context.env.REALTIME_HUB.get(id);

    // Forward the request to the DO — headers carry Upgrade + Sec-WebSocket-Protocol
    const doUrl = new URL('http://do/connect');
    const response = await stub.fetch(new Request(doUrl, {
      headers: context.request.headers,
    }));

    console.log(JSON.stringify({
      message: 'WebSocket upgrade proxied to DO',
      requestId,
      userId,
      status: response.status,
    }));

    return response;
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    console.error(JSON.stringify({
      message: 'WebSocket upgrade failed',
      requestId,
      error: message,
    }));
    return jsonError(500, 'Upgrade failed', requestId);
  }
};
