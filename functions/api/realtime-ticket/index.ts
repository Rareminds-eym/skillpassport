import { withAuth, getContextUser } from '../../lib/auth';
import { apiSuccess, apiError } from '../../lib/response';
import { getPartitionId } from '../../lib/partition';

interface TicketWorker {
  issueConnectionTicket(
    userId: string,
  ): Promise<{ ticket: string; expiresAt: number }>;
}
export const onRequestPost = withAuth(async (context) => {
  const env = context.env as unknown as {
    REALTIME_WORKER?: TicketWorker;
    REALTIME_HUB?: DurableObjectNamespace;
    REALTIME_PARTITIONS?: string;
  };
  if (!env.REALTIME_WORKER && !env.REALTIME_HUB)
    return apiError(
      503,
      'REALTIME_UNAVAILABLE',
      'Live updates are temporarily unavailable.',
      context.request,
    );
  try {
    const userId = getContextUser(context).id;
    // Local Pages uses the worker RPC binding; configured deployments can
    // issue through the same hub namespace used by realtime-stream directly.
    let issuer = env.REALTIME_WORKER;
    if (!issuer && env.REALTIME_HUB) {
      const partition = getPartitionId(
        userId,
        Number(env.REALTIME_PARTITIONS) || undefined,
      );
      const id = env.REALTIME_HUB.idFromName(`partition-${partition}`);
      issuer = env.REALTIME_HUB.get(id) as unknown as TicketWorker;
    }
    const ticket = await issuer!.issueConnectionTicket(userId);
    const response = apiSuccess(ticket, context.request);
    response.headers.set('Cache-Control', 'private, no-store');
    return response;
  } catch (error) {
    const limited =
      error instanceof Error && error.message.includes('RATE_LIMITED');
    if (!limited) {
      console.error(
        JSON.stringify({
          message: 'Realtime ticket issuance failed',
          binding: env.REALTIME_WORKER ? 'REALTIME_WORKER' : 'REALTIME_HUB',
          error: error instanceof Error ? error.message : String(error),
        }),
      );
    }
    return apiError(
      limited ? 429 : 503,
      limited ? 'RATE_LIMITED' : 'REALTIME_UNAVAILABLE',
      'Live updates could not connect. Please retry shortly.',
      context.request,
    );
  }
});
