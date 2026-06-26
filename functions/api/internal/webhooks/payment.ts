/**
 * Internal Webhook Receiver for Payments (Multi-Flow Router)
 * 
 * POST /api/internal/webhooks/payment
 * 
 * This endpoint is called securely by the sso-worker's cron scheduler to fulfill
 * a payment that was verified via webhook. It routes the payload to the correct
 * fulfillment function based on `notes.type` injected during order creation.
 * 
 * Supported order types:
 * - subscription (default): Learner subscription
 * - addon:                  Addon purchase
 * - bundle:                 Bundle purchase
 * - org:                    Organization subscription
 * - event:                  Event/workshop/webinar/bootcamp registration
 * - registration:           Pre-registration payment
 * 
 * It relies on Database Constraint-Led Deduplication:
 * If the synchronous flow already created the subscription/transaction,
 * the fulfillment functions will catch 409 Conflicts and exit cleanly.
 */

import { apiError, apiSuccess } from '../../../lib/response';
import type { PagesEnv } from '../../../lib/types';
import { APP_URL } from '../../email/types';
import {
  fulfillLearnerSubscription,
  fulfillAddonPurchase,
  fulfillBundlePurchase,
  fulfillOrgSubscription,
  fulfillEventRegistration,
  fulfillPreRegistration,
  type FulfillmentEnv,
} from '../../payments/lib/fulfillment-core';
import { getServiceClient } from '../../../lib/supabase';
import { R2Client } from '../../storage/utils/r2-client';
import { generateReceiptPDF, fetchImageBytes, type ReceiptData } from '../../storage/utils/pdf-generator';
import { generateUserConfirmationHtml, getUserConfirmationSubject } from '../../email/services/templates';
import type { EventConfirmationTemplateData } from '../../email/types';
import { sendEmailSafe } from '../../../lib/email-service';

export const onRequestPost: PagesFunction<PagesEnv> = async (context) => {
  const { request, env } = context;

  try {
    // 1. Authenticate the internal webhook dispatch
    const authHeader = request.headers.get('Authorization');
    if (!env.INTERNAL_WEBHOOK_SECRET || authHeader !== `Bearer ${env.INTERNAL_WEBHOOK_SECRET}`) {
      return apiError(401, 'UNAUTHORIZED', 'Invalid or missing internal webhook secret', request);
    }

    const eventType = request.headers.get('X-Webhook-Event');
    if (eventType !== 'payment.captured' && eventType !== 'order.paid') {
      console.log(`[InternalWebhook] Ignoring event type: ${eventType}`);
      return apiSuccess({ ignored: true, reason: 'unhandled_event_type' }, request);
    }

    let payload: any;
    try {
      payload = await request.json();
    } catch {
      return apiError(400, 'VALIDATION_ERROR', 'Invalid JSON body', request);
    }

    // 2. Extract Razorpay entity details
    const paymentEntity = payload.payment?.entity;
    if (!paymentEntity) {
      console.warn('[InternalWebhook] Missing payment entity in payload');
      return apiSuccess({ ignored: true, reason: 'missing_payment_entity' }, request);
    }

    const razorpay_payment_id = paymentEntity.id;
    const razorpay_order_id = paymentEntity.order_id;
    const amount = paymentEntity.amount; // In paise
    const notes = paymentEntity.notes || {};
    const orderType = notes.type || 'subscription'; // Default to subscription for backward compat

    const userId = notes.user_id;
    const userEmail = notes.user_email;

    console.log(`[InternalWebhook] Processing order type: ${orderType}, payment: ${razorpay_payment_id}`);

    const fulfillmentEnv: FulfillmentEnv = env as unknown as FulfillmentEnv;

    // 3. Route to the correct fulfillment handler
    switch (orderType) {
      case 'subscription': {
        const planId = notes.plan_id;
        const planName = notes.plan_name;

        if (!userId || !planId) {
          console.warn('[InternalWebhook] Missing user_id or plan_id for subscription', notes);
          return apiSuccess({ ignored: true, reason: 'missing_notes_data' }, request);
        }

        // Validate plan exists
        const supabase = getServiceClient(env as { SUPABASE_URL: string; SUPABASE_SERVICE_ROLE_KEY: string });
        const { data: validPlan, error: planError } = await supabase
          .from('plans_cache')
          .select('id, plan_code, name, is_active, base_features')
          .eq('id', planId)
          .maybeSingle();

        if (planError || !validPlan) {
          console.error('[InternalWebhook] Invalid plan ID:', planId);
          return apiError(400, 'VALIDATION_ERROR', 'Plan not found', request);
        }

        const result = await fulfillLearnerSubscription(fulfillmentEnv, {
          user_id: userId,
          plan_id: planId,
          plan_name: planName || validPlan.name,
          plan_code: validPlan.plan_code,
          amount: amount / 100,
          currency: paymentEntity.currency || 'INR',
          razorpay_order_id,
          razorpay_payment_id,
          payment_method: paymentEntity.method,
          user_email: userEmail,
          user_name: notes.user_name,
          features: validPlan.base_features || [],
        });

        if (result.already_fulfilled) {
          return apiSuccess({ already_fulfilled: true }, request);
        }

        // Generate receipt & email only for learner subscriptions
        if (result.subscription) {
          context.waitUntil(generateAndSendReceipt(
            env, result.subscription, paymentEntity, userId,
            razorpay_order_id, razorpay_payment_id, amount
          ));
        }

        return apiSuccess({ fulfilled: true, type: 'subscription', isUpgrade: result.isUpgrade }, request);
      }

      case 'addon': {
        if (!userId || !notes.feature_key) {
          console.warn('[InternalWebhook] Missing user_id or feature_key for addon', notes);
          return apiSuccess({ ignored: true, reason: 'missing_notes_data' }, request);
        }

        const result = await fulfillAddonPurchase(fulfillmentEnv, {
          user_id: userId,
          feature_key: notes.feature_key,
          billing_period: notes.billing_period || 'monthly',
          price_at_purchase: amount / 100,
          razorpay_order_id,
          razorpay_payment_id,
          razorpay_signature: '',
          payment_method: paymentEntity.method,
          currency: paymentEntity.currency || 'INR',
        });

        if (result.already_fulfilled) {
          return apiSuccess({ already_fulfilled: true }, request);
        }
        return apiSuccess({ fulfilled: true, type: 'addon' }, request);
      }

      case 'bundle': {
        if (!userId || !notes.bundle_id) {
          console.warn('[InternalWebhook] Missing user_id or bundle_id for bundle', notes);
          return apiSuccess({ ignored: true, reason: 'missing_notes_data' }, request);
        }

        const result = await fulfillBundlePurchase(fulfillmentEnv, {
          user_id: userId,
          bundle_id: notes.bundle_id,
          billing_period: notes.billing_period || 'monthly',
          price_at_purchase: amount / 100,
          razorpay_order_id,
          razorpay_payment_id,
          razorpay_signature: '',
          payment_method: paymentEntity.method,
          currency: paymentEntity.currency || 'INR',
        });

        if (result.already_fulfilled) {
          return apiSuccess({ already_fulfilled: true }, request);
        }
        return apiSuccess({ fulfilled: true, type: 'bundle' }, request);
      }

      case 'org': {
        if (!userId || !notes.org_id) {
          console.warn('[InternalWebhook] Missing user_id or org_id for org subscription', notes);
          return apiSuccess({ ignored: true, reason: 'missing_notes_data' }, request);
        }

        const result = await fulfillOrgSubscription(fulfillmentEnv, {
          user_id: userId,
          org_id: notes.org_id,
          plan_id: notes.plan_id || '',
          plan_name: notes.plan_name || '',
          plan_code: notes.plan_code || notes.plan_name || '',
          seat_count: parseInt(notes.seat_count, 10) || 1,
          billing_cycle: notes.billing_cycle || 'annual',
          amount: amount / 100,
          currency: paymentEntity.currency || 'INR',
          razorpay_order_id,
          razorpay_payment_id,
          payment_method: paymentEntity.method,
          user_email: userEmail,
          user_name: notes.user_name,
        });

        if (result.already_fulfilled) {
          return apiSuccess({ already_fulfilled: true }, request);
        }
        return apiSuccess({ fulfilled: true, type: 'org' }, request);
      }

      case 'event': {
        if (!notes.registration_id) {
          console.warn('[InternalWebhook] Missing registration_id for event', notes);
          return apiSuccess({ ignored: true, reason: 'missing_notes_data' }, request);
        }

        await fulfillEventRegistration(fulfillmentEnv, {
          registration_id: notes.registration_id,
          razorpay_order_id,
          razorpay_payment_id,
          plan_name: notes.plan_name,
        });

        return apiSuccess({ fulfilled: true, type: 'event' }, request);
      }

      case 'registration': {
        if (!notes.registration_id) {
          console.warn('[InternalWebhook] Missing registration_id for registration', notes);
          return apiSuccess({ ignored: true, reason: 'missing_notes_data' }, request);
        }

        await fulfillPreRegistration(fulfillmentEnv, {
          registration_id: notes.registration_id,
          razorpay_order_id,
          razorpay_payment_id,
        });

        return apiSuccess({ fulfilled: true, type: 'registration' }, request);
      }

      default: {
        console.warn(`[InternalWebhook] Unknown order type: ${orderType}`);
        return apiSuccess({ ignored: true, reason: 'unknown_order_type', type: orderType }, request);
      }
    }
  } catch (error) {
    console.error('[InternalWebhook] Error processing webhook:', error);
    return apiError(500, 'INTERNAL_ERROR', 'Failed to process webhook fulfillment', request);
  }
};

async function generateAndSendReceipt(env: PagesEnv, subscription: any, paymentEntity: any, userId: string, razorpay_order_id: string, razorpay_payment_id: string, amount: number) {
  try {
    const supabase = getServiceClient(env as { SUPABASE_URL: string; SUPABASE_SERVICE_ROLE_KEY: string });
    let receiptUrl: string | null = null;
    let receiptKey: string | null = null;

    const { data: learner } = await supabase.from('learners').select('name').eq('user_id', userId).maybeSingle();

    let logoBytes: Uint8Array | undefined;
    logoBytes = await fetchImageBytes(`${APP_URL}/RareMinds ISO Logo-01.png`);

    const receiptData: ReceiptData = {
      transaction: {
        payment_id: razorpay_payment_id,
        order_id: razorpay_order_id,
        amount: amount / 100,
        currency: paymentEntity.currency || 'INR',
        payment_method: paymentEntity.method || 'Card',
        payment_timestamp: new Date().toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' }),
        status: 'Success',
      },
      subscription: {
        plan_name: subscription.plan_type as string,
        plan_type: subscription.plan_type as string,
        billing_cycle: subscription.billing_cycle as string,
        subscription_start_date: subscription.subscription_start_date as string,
        subscription_end_date: subscription.subscription_end_date as string,
      },
      user: {
        name: learner?.name || (subscription.full_name as string) || '',
        email: (subscription.email as string) || '',
        phone: (subscription.phone as string) || undefined,
      },
      company: {
        name: 'Rareminds',
        address: '231, 2nd stage, 13th Cross Road\nHoysala Nagar, Indiranagar\nBengaluru, Karnataka 560001',
        phone: '+91 9902326951',
        email: 'marketing@rareminds.in',
        taxId: 'GSTIN: 29ABCDE1234F1Z5',
      },
      generatedAt: new Date().toLocaleString('en-IN'),
      logoBytes,
      watermarkBytes: logoBytes,
    };

    const pdfBytes = await generateReceiptPDF(receiptData);
    const shortUserId = userId.substring(0, 8);
    const sanitizedPmtId = razorpay_payment_id.replace(/[^a-zA-Z0-9_-]/g, '');
    const timestamp = Date.now();
    receiptKey = `payment_pdf/user_${shortUserId}/${sanitizedPmtId}_${timestamp}.pdf`;
    const filename = `Receipt-${sanitizedPmtId.slice(-8)}-${new Date().toISOString().split('T')[0]}.pdf`;

    const r2 = new R2Client(env);
    await r2.upload(receiptKey, pdfBytes.buffer as ArrayBuffer, 'application/pdf', {
      'Content-Disposition': `attachment; filename="${filename}"`,
    });
    receiptUrl = await r2.generatePresignedGetUrl(receiptKey, 604800);

    const emailData: EventConfirmationTemplateData = {
      name: subscription.full_name as string,
      email: (subscription.email as string) || '',
      phone: (subscription.phone as string) || '',
      amount: amount / 100,
      orderId: razorpay_order_id,
      campaign: subscription.plan_type as string,
      receiptUrl: receiptUrl || undefined,
    };

    await sendEmailSafe(env, {
      to: emailData.email,
      subject: getUserConfirmationSubject(emailData.name),
      html: generateUserConfirmationHtml(emailData),
    });
  } catch (err) {
    console.error('[InternalWebhook] Failed to generate/send receipt:', err);
  }
}
