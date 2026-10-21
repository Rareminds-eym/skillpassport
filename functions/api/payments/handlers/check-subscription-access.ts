import type { AuthenticatedContext } from '@rareminds-eym/auth-core';
import { apiSuccess } from '../../../lib/response';
import { handleGetActiveSubscription } from './get-active-subscription';

/** Use the same decision as dashboard routing, including organization and bulk coverage. */
export async function handleCheckSubscriptionAccess(context: AuthenticatedContext): Promise<Response> {
  const response = await handleGetActiveSubscription(context);
  if (!response.ok) return response;
  const { data: subscription } = await response.json() as { data: { status: string; subscription_end_date?: string } | null };
  const daysUntilExpiry = subscription?.subscription_end_date
    ? Math.ceil((Date.parse(subscription.subscription_end_date) - Date.now()) / 86400000) : null;
  const warningType = subscription?.status === 'grace_period' ? 'grace_period'
    : subscription?.status === 'paused' ? 'paused'
      : daysUntilExpiry !== null && daysUntilExpiry > 0 && daysUntilExpiry <= 7 ? 'expiring_soon' : null;
  return apiSuccess({
    hasAccess: Boolean(subscription), accessReason: subscription ? subscription.status : 'no_subscription',
    subscription, daysUntilExpiry, showWarning: Boolean(warningType), warningType,
  }, context.request);
}
