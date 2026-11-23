import { z } from 'zod';
import type { GatewayAction } from '../types';
import { getServiceClient } from '../../../../../lib/supabase';
import { acknowledgeResourceDelivery, resourceOutcomeSchema, ResourceDeliveryError } from '../../../../../lib/subscriptions/resource-delivery';

/** Gateway verifies the LTE service signature, action scope and exact user claim. */
export const handleSubscriptionResourceDelivery: GatewayAction = async (context, payload) => {
  const parsed = z.object({ outcome: resourceOutcomeSchema }).strict().safeParse(payload);
  if (!parsed.success) return { ok: false, error: { code: 'BAD_REQUEST', message: 'Invalid subscription resource outcome' } };
  try {
    const result = await acknowledgeResourceDelivery(getServiceClient(context.env), context.userId, parsed.data.outcome);
    return { ok: true, data: result };
  } catch (error) {
    const code = error instanceof ResourceDeliveryError ? error.status === 403 ? 'FORBIDDEN' : error.status === 409 ? 'CONFLICT' : 'UNAVAILABLE' : 'UNAVAILABLE';
    return { ok: false, error: { code, message: 'Subscription resource acknowledgement unavailable' } };
  }
};
