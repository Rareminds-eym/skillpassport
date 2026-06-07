// @public-endpoint: Proxies the WebSocket upgrade to REALTIME_WORKER; the socket is authenticated in the realtime worker. (RBAC guard-matrix, task 11.1/11.4; CC-2)
import { PagesFunction } from '@cloudflare/workers-types';

export const onRequestGet: PagesFunction<{
  SSO_SERVICE: Fetcher;
  REALTIME_WORKER: Fetcher;
}> = async (context) => {
  // Verify this is a WebSocket upgrade request
  if (context.request.headers.get('Upgrade') !== 'websocket') {
    return new Response(
      JSON.stringify({ error: 'Expected Upgrade: websocket' }),
      { status: 426, headers: { 'Content-Type': 'application/json' } }
    );
  }

  try {
    // We must pass the original request object entirely unmodified to preserve the
    // underlying socket for the WebSocket Upgrade. We do NOT clone or modify headers here.
    const response = await context.env.REALTIME_WORKER.fetch(context.request);

    if (response.status !== 101) {
      const clone = response.clone();
      const body = await clone.text().catch(() => 'could not read body');
      console.error(`[Pages Proxy] REALTIME_WORKER returned ${response.status}: ${body}`);
    }

    return response;
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    console.error(JSON.stringify({
      message: 'WebSocket proxy failed',
      error: message,
    }));
    return new Response(JSON.stringify({ error: 'Proxy failed', details: message }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
};
