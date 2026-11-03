import type { AuthenticatedContext } from '@rareminds-eym/auth-core';
import { getContextUser } from '../../../lib/auth';
import { apiError, apiSuccess } from '../../../lib/response';
import { getServiceClient } from '../../../lib/supabase';
import { getPaymentWorker } from '../lib/paymentBinding';
import {
  AddonCheckoutError,
  addonFailure,
  requireOffer,
  resolveAddonPurchaser,
  type AddonEnvironment,
} from '../lib/addon-checkout';

export async function handleCreateAddonOrder(
  context: AuthenticatedContext,
): Promise<Response> {
  const user = getContextUser(context);
  const env = context.env as unknown as AddonEnvironment;
  let body: Record<string, unknown>;
  try {
    body = (await context.request.json()) as Record<string, unknown>;
  } catch {
    return apiError(
      400,
      'VALIDATION_ERROR',
      'Invalid JSON body',
      context.request,
    );
  }
  if (!body || typeof body !== 'object' || Array.isArray(body))
    return apiError(
      400,
      'VALIDATION_ERROR',
      'A JSON object is required',
      context.request,
    );
  try {
    if (
      typeof body.feature_key !== 'string' ||
      typeof body.billing_period !== 'string'
    )
      throw new AddonCheckoutError(
        400,
        'VALIDATION_ERROR',
        'Select an add-on and billing option.',
      );
    const addon = await env.SSO_SERVICE.getAddonByFeatureKey(body.feature_key);
    if (!addon.is_active || addon.feature_key !== body.feature_key)
      throw new AddonCheckoutError(
        400,
        'ADDON_UNAVAILABLE',
        'Select an active catalog add-on.',
      );
    const offer = addon.billing_options.find(
      (o) => o.is_active && o.billing_period === body.billing_period,
    );
    requireOffer(offer);
    const organizationId = await resolveAddonPurchaser(
      env,
      user.id,
      addon,
      offer,
      typeof body.org_id === 'string' ? body.org_id : user.org_id || undefined,
    );
    const pending = await env.SSO_SERVICE.getPendingAddonPurchase(
      user.id,
      addon.feature_key,
    );
    const worker = getPaymentWorker(env);
    if (pending) {
      if (pending.razorpay_payment_id)
        throw new AddonCheckoutError(
          409,
          'PAYMENT_RECONCILIATION_REQUIRED',
          'An existing payment is awaiting activation. Retry verification instead of paying again.',
          { recovery_order_id: pending.razorpay_order_id },
        );
      const orders = pending.razorpay_order_id
        ? [await worker.getOrder(pending.razorpay_order_id)]
        : (await worker.getOrdersByReceipt(pending.id)).items;
      if (orders.length !== 1)
        throw new AddonCheckoutError(
          409,
          'CHECKOUT_IN_PROGRESS',
          'Your previous checkout is still being prepared. Please try again shortly.',
        );
      const previous = orders[0];
      if (
        previous.notes.user_id !== user.id ||
        previous.notes.purchase_id !== pending.id
      )
        throw new AddonCheckoutError(
          409,
          'ORDER_MISMATCH',
          'The original checkout could not be confirmed.',
        );
      if (previous.status === 'paid')
        throw new AddonCheckoutError(
          409,
          'PAYMENT_RECONCILIATION_REQUIRED',
          'An existing payment is awaiting activation. Retry verification instead of paying again.',
          { recovery_order_id: previous.id },
        );
      if (
        pending.billing_period !== offer.billing_period ||
        Number(pending.amount_minor) !== Number(offer.amount_minor) ||
        pending.currency !== offer.currency ||
        pending.interval_months !== offer.interval_months
      )
        throw new AddonCheckoutError(
          409,
          'CHECKOUT_TERMS_PENDING',
          'A checkout with different terms is already open. Resume its original billing option first.',
        );
      if (!pending.razorpay_order_id)
        await env.SSO_SERVICE.bindAddonOrder(pending.id, previous.id);
      return apiSuccess(
        {
          ...previous,
          razorpay_key_id: previous.key_id,
          addon_name: addon.feature_name,
          billing_period: offer.billing_period,
          resumed: true,
        },
        context.request,
      );
    }
    if (
      !offer.allow_repeat_purchase &&
      (await env.SSO_SERVICE.getActiveAddonPurchase(user.id, addon.feature_key))
    )
      throw new AddonCheckoutError(
        409,
        'ADDON_ALREADY_ACTIVE',
        'This add-on is already active for your account.',
      );
    if (offer.fulfilment_kind === 'opportunity_visibility') {
      if (
        !Number.isSafeInteger(body.opportunity_id) ||
        Number(body.opportunity_id) <= 0
      )
        throw new AddonCheckoutError(
          400,
          'OPPORTUNITY_REQUIRED',
          'Select an opportunity for this offer.',
        );
      const { data, error } = await getServiceClient(env)
        .from('opportunities')
        .select('id')
        .eq('id', body.opportunity_id)
        .eq('organization_id', organizationId)
        .neq('status', 'closed')
        .maybeSingle();
      if (error || !data)
        throw new AddonCheckoutError(
          403,
          'OPPORTUNITY_UNAVAILABLE',
          'This opportunity is not eligible in your organization.',
        );
    }
    const checkout = await env.SSO_SERVICE.prepareAddonCheckout({
      user_id: user.id,
      addon_id: addon.id,
      billing_period: offer.billing_period,
      organization_id: organizationId,
      opportunity_id:
        offer.fulfilment_kind === 'opportunity_visibility'
          ? body.opportunity_id
          : null,
    });
    if (!checkout.checkout_created)
      throw new AddonCheckoutError(
        409,
        'CHECKOUT_IN_PROGRESS',
        'A checkout is already being prepared. Please try again shortly.',
      );
    const notes: Record<string, string> = {
      type: 'addon',
      purchase_id: checkout.id,
      user_id: user.id,
      feature_key: addon.feature_key,
      addon_id: addon.id,
      billing_period: offer.billing_period,
    };
    if (organizationId) notes.organization_id = organizationId;
    if (offer.fulfilment_kind === 'opportunity_visibility')
      notes.opportunity_id = String(body.opportunity_id);
    let order;
    try {
      order = await worker.createOrder({
        amount: Number(offer.amount_minor),
        currency: offer.currency,
        receipt: checkout.id,
        notes,
      });
    } catch (error) {
      await env.SSO_SERVICE.discardUnopenedAddonCheckout(checkout.id);
      throw error;
    }
    await env.SSO_SERVICE.bindAddonOrder(checkout.id, order.id);
    if (!order.key_id)
      throw new Error('Payment provider did not return checkout configuration');
    return apiSuccess(
      {
        ...order,
        razorpay_key_id: order.key_id,
        addon_name: addon.feature_name,
        billing_period: offer.billing_period,
      },
      context.request,
    );
  } catch (error) {
    return addonFailure(error, context.request);
  }
}
