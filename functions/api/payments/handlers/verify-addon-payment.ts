import type { AuthenticatedContext } from '@rareminds-eym/auth-core';
import { getContextUser } from '../../../lib/auth';
import { apiError, apiSuccess } from '../../../lib/response';
import {
  addonFailure,
  fulfillCapturedAddon,
  type AddonEnvironment,
} from '../lib/addon-checkout';

async function verify(
  context: AuthenticatedContext,
  recovery: boolean,
): Promise<Response> {
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
  if (
    typeof body.razorpay_order_id !== 'string' ||
    !body.razorpay_order_id.trim() ||
    (!recovery &&
      (typeof body.razorpay_payment_id !== 'string' ||
        !body.razorpay_payment_id.trim() ||
        typeof body.razorpay_signature !== 'string' ||
        !body.razorpay_signature.trim()))
  )
    return apiError(
      400,
      'VALIDATION_ERROR',
      'Payment verification details are required',
      context.request,
    );
  try {
    const result = await fulfillCapturedAddon(
      context.env as unknown as AddonEnvironment,
      {
        orderId: body.razorpay_order_id,
        paymentId:
          typeof body.razorpay_payment_id === 'string'
            ? body.razorpay_payment_id
            : undefined,
        signature: !recovery ? (body.razorpay_signature as string) : undefined,
        expectedUserId: getContextUser(context).id,
        featureKey:
          typeof body.feature_key === 'string' ? body.feature_key : undefined,
        billingPeriod:
          typeof body.billing_period === 'string'
            ? body.billing_period
            : undefined,
      },
    );
    return apiSuccess(result, context.request);
  } catch (error) {
    return addonFailure(error, context.request);
  }
}
export const handleVerifyAddonPayment = (context: AuthenticatedContext) =>
  verify(context, false);
/** Authenticated recovery uses provider capture + order ownership, without storing callback secrets. */
export const handleReconcileAddonPayment = (context: AuthenticatedContext) =>
  verify(context, true);
