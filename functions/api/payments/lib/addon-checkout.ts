import { apiError } from '../../../lib/response';
import { getServiceClient } from '../../../lib/supabase';
import {
  getPaymentWorker,
  type PaymentWorkerEnv,
  type RazorpayOrder,
} from './paymentBinding';

export interface AddonOffer {
  id: string;
  addon_id: string;
  billing_period: string;
  display_name: string;
  amount_minor: number;
  currency: string;
  minor_unit: number;
  interval_months: number;
  fulfilment_kind: string;
  target_feature_key: string;
  quantity: number;
  duration_days: number | null;
  requires_organization: boolean;
  is_active: boolean;
  allow_repeat_purchase: boolean;
}
export interface AddonCatalog {
  id: string;
  feature_key: string;
  feature_name: string;
  target_roles: string[];
  billing_options: AddonOffer[];
  is_active: boolean;
}
interface Membership {
  org_id: string;
  roles: string[];
  status: string;
}
interface RecordedPurchase extends Record<string, unknown> {
  id: string;
  user_id: string;
  feature_key: string;
  addon_id: string;
  target_roles: string[];
  offer: AddonOffer;
}
export interface AddonEnvironment extends PaymentWorkerEnv {
  SSO_SERVICE: {
    getAddonByFeatureKey(key: string): Promise<AddonCatalog>;
    getAddonCheckout(id: string): Promise<RecordedPurchase | null>;
    getUserMemberships(userId: string): Promise<{ memberships: Membership[] }>;
    getRecordedAddonPurchase(
      paymentId: string,
    ): Promise<RecordedPurchase | null>;
    getActiveAddonPurchase(
      userId: string,
      key: string,
    ): Promise<Record<string, unknown> | null>;
    getPendingAddonPurchase(
      userId: string,
      key: string,
    ): Promise<{
      id: string;
      billing_period: string;
      amount_minor: number;
      currency: string;
      interval_months: number;
      razorpay_order_id: string | null;
      razorpay_payment_id: string | null;
    } | null>;
    prepareAddonCheckout(
      data: Record<string, unknown>,
    ): Promise<{ id: string; checkout_created: boolean }>;
    bindAddonOrder(id: string, orderId: string): Promise<void>;
    discardUnopenedAddonCheckout(id: string): Promise<void>;
    recordAddonPurchase(
      data: Record<string, unknown>,
    ): Promise<RecordedPurchase>;
    activateAddonPurchase(id: string): Promise<void>;
  };
}
export class AddonCheckoutError extends Error {
  constructor(
    public status: number,
    public code: string,
    message: string,
    public details?: Record<string, unknown>,
  ) {
    super(message);
  }
}
export function requireOffer(
  offer: AddonOffer | undefined,
): asserts offer is AddonOffer {
  if (
    !offer ||
    !Number.isSafeInteger(Number(offer.amount_minor)) ||
    Number(offer.amount_minor) <= 0 ||
    !offer.currency ||
    !offer.target_feature_key ||
    !Number.isInteger(offer.interval_months) ||
    offer.interval_months <= 0
  )
    throw new AddonCheckoutError(
      400,
      'OFFER_UNAVAILABLE',
      'The selected purchase terms are not available.',
    );
}
export async function resolveAddonPurchaser(
  env: AddonEnvironment,
  userId: string,
  addon: Pick<AddonCatalog, 'target_roles'>,
  offer: AddonOffer,
  organizationId?: string,
) {
  const { memberships } = await env.SSO_SERVICE.getUserMemberships(userId);
  const permitted = memberships.filter(
    (m) =>
      m.status === 'active' &&
      (!addon.target_roles?.length ||
        m.roles.some((role) => addon.target_roles.includes(role))),
  );
  if (!permitted.length)
    throw new AddonCheckoutError(
      403,
      'ADDON_ROLE_DENIED',
      'This add-on is not available for your account role.',
    );
  if (!offer.requires_organization) return null;
  const candidates = organizationId
    ? permitted.filter((m) => m.org_id === organizationId)
    : permitted;
  const orgs = [...new Set(candidates.map((m) => m.org_id))];
  if (orgs.length !== 1)
    throw new AddonCheckoutError(
      403,
      'ORGANIZATION_REQUIRED',
      'Select an authorized organization for this add-on.',
    );
  return orgs[0];
}

/** Both authenticated checkout and trusted webhooks use provider order facts. */
export async function fulfillCapturedAddon(
  env: AddonEnvironment,
  input: {
    orderId: string;
    paymentId?: string;
    expectedUserId?: string;
    featureKey?: string;
    billingPeriod?: string;
    signature?: string;
    providerOrder?: RazorpayOrder;
  },
) {
  const worker = getPaymentWorker(env);
  if (input.signature && input.paymentId) {
    const verified = await worker.verifyPaymentSignature(
      input.orderId,
      input.paymentId,
      input.signature,
    );
    if (!verified.verified)
      throw new AddonCheckoutError(
        400,
        'PAYMENT_SIGNATURE_INVALID',
        'Payment signature is invalid.',
      );
  }
  const order = input.providerOrder || (await worker.getOrder(input.orderId));
  const notes = order.notes || {};
  if (
    order.id !== input.orderId ||
    notes.type !== 'addon' ||
    !notes.user_id ||
    !notes.feature_key ||
    !notes.billing_period
  )
    throw new AddonCheckoutError(
      400,
      'ORDER_MISMATCH',
      'The order is not a supported add-on purchase.',
    );
  if (input.expectedUserId && notes.user_id !== input.expectedUserId)
    throw new AddonCheckoutError(
      403,
      'ORDER_OWNER_MISMATCH',
      'This order belongs to another account.',
    );
  if (
    (input.featureKey && notes.feature_key !== input.featureKey) ||
    (input.billingPeriod && notes.billing_period !== input.billingPeriod)
  )
    throw new AddonCheckoutError(
      400,
      'ORDER_TERMS_MISMATCH',
      'The requested add-on or billing period differs from the order.',
    );
  const payments = input.paymentId
    ? [await worker.getPayment(input.paymentId)]
    : (await worker.getOrderPayments(order.id)).items;
  const captured = payments.filter(
    (p) =>
      p.status === 'captured' &&
      p.captured !== false &&
      p.order_id === order.id,
  );
  if (captured.length !== 1)
    throw new AddonCheckoutError(
      409,
      'PAYMENT_NOT_CAPTURED',
      'A captured payment could not be confirmed for this order.',
    );
  const payment = captured[0];
  if ((payment.amount_refunded || 0) > 0 || payment.refund_status)
    throw new AddonCheckoutError(
      409,
      'PAYMENT_REFUND_RECONCILIATION_REQUIRED',
      'This payment has a refund and requires reconciliation before activation.',
    );
  if (payment.amount !== order.amount || payment.currency !== order.currency)
    throw new AddonCheckoutError(
      400,
      'PAYMENT_AMOUNT_MISMATCH',
      'Captured payment differs from the original order.',
    );
  let offer: AddonOffer;
  let addon: Pick<AddonCatalog, 'id' | 'feature_key' | 'target_roles'>;
  const recorded = await env.SSO_SERVICE.getRecordedAddonPurchase(payment.id);
  const contract =
    recorded ||
    (notes.purchase_id
      ? await env.SSO_SERVICE.getAddonCheckout(notes.purchase_id)
      : null);
  if (contract && contract.user_id !== notes.user_id)
    throw new AddonCheckoutError(
      409,
      'PAYMENT_OWNER_MISMATCH',
      'The recorded purchase requires ownership reconciliation.',
    );
  if (notes.purchase_id && !contract)
    throw new AddonCheckoutError(
      409,
      'PURCHASE_NOT_FOUND',
      'The original checkout reservation could not be found.',
    );
  if (contract) {
    offer = contract.offer;
    addon = {
      id: contract.addon_id,
      feature_key: contract.feature_key,
      target_roles: contract.target_roles,
    };
  } else {
    // Existing captured orders can be reconciled only against matching DB terms.
    const current = await env.SSO_SERVICE.getAddonByFeatureKey(
      notes.feature_key,
    );
    addon = current;
    const matches = current.billing_options.filter(
      (o) =>
        o.billing_period === notes.billing_period &&
        Number(o.amount_minor) === order.amount &&
        o.currency === order.currency,
    );
    if (matches.length !== 1)
      throw new AddonCheckoutError(
        409,
        'ORDER_RECONCILIATION_REQUIRED',
        'The original purchase terms require reconciliation.',
      );
    offer = matches[0];
  }
  requireOffer(offer);
  if (
    addon.feature_key !== notes.feature_key ||
    offer.billing_period !== notes.billing_period ||
    Number(offer.amount_minor) !== payment.amount ||
    offer.currency !== payment.currency ||
    (notes.addon_id && notes.addon_id !== addon.id)
  )
    throw new AddonCheckoutError(
      400,
      'OFFER_MISMATCH',
      'Payment does not match the database purchase terms.',
    );
  const organizationId = await resolveAddonPurchaser(
    env,
    notes.user_id,
    addon,
    offer,
    notes.organization_id || undefined,
  );
  const opportunityId = notes.opportunity_id
    ? Number(notes.opportunity_id)
    : null;
  if (
    offer.fulfilment_kind === 'opportunity_visibility' &&
    (!Number.isSafeInteger(opportunityId) || Number(opportunityId) <= 0)
  )
    throw new AddonCheckoutError(
      400,
      'OPPORTUNITY_REQUIRED',
      'This offer requires an eligible opportunity.',
    );
  const purchase = await env.SSO_SERVICE.recordAddonPurchase({
    user_id: notes.user_id,
    addon_id: addon.id,
    billing_period: offer.billing_period,
    amount_minor: payment.amount,
    currency: payment.currency,
    razorpay_order_id: order.id,
    razorpay_payment_id: payment.id,
    razorpay_signature: input.signature,
    payment_method: payment.method,
    prepared_purchase_id: notes.purchase_id,
    organization_id: organizationId,
    opportunity_id: opportunityId,
  });
  const { data, error } = await getServiceClient(env).rpc(
    'fulfil_addon_purchase',
    { p_purchase: purchase },
  );
  if (error?.message?.includes('LEGACY_NUMERIC_RECONCILIATION_REQUIRED'))
    throw new AddonCheckoutError(
      409,
      'LEGACY_GRANT_RECONCILIATION_REQUIRED',
      'This earlier capacity purchase needs reconciliation of its existing grant before activation. Do not pay again.',
    );
  if (error)
    throw new AddonCheckoutError(
      503,
      'FULFILMENT_PENDING',
      'Payment is captured. Access activation is pending; retry verification without paying again.',
    );
  await env.SSO_SERVICE.activateAddonPurchase(purchase.id);
  return {
    verified: true,
    purchase_created: !data.already_fulfilled,
    replay: !!data.already_fulfilled,
    purchase: data.entitlement,
  };
}

export async function addonFailure(
  error: unknown,
  request: Request,
): Promise<Response> {
  if (error instanceof AddonCheckoutError) {
    const response = apiError(error.status, error.code, error.message, request);
    if (!error.details) return response;
    return new Response(
      JSON.stringify({
        ...((await response.json()) as object),
        data: error.details,
      }),
      { status: response.status, headers: response.headers },
    );
  }
  const message = error instanceof Error ? error.message : '';
  if (message.startsWith('UNAUTHORIZED:'))
    return apiError(
      400,
      'PAYMENT_SIGNATURE_INVALID',
      'Payment signature is invalid.',
      request,
    );
  if (message.startsWith('INVALID_INPUT:'))
    return apiError(
      400,
      'PAYMENT_DETAILS_INVALID',
      'Payment details are invalid.',
      request,
    );
  if (/^Addon not found$/i.test(message))
    return apiError(
      404,
      'ADDON_UNAVAILABLE',
      'This catalog add-on is unavailable.',
      request,
    );
  console.error('[AddonCheckout] Operation failed', error);
  return apiError(
    503,
    'ADDON_CHECKOUT_UNAVAILABLE',
    'The purchase could not be completed. If payment was captured, retry verification without paying again.',
    request,
  );
}
