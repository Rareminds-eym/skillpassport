/**
 * Verify Payment Handler
 *
 * POST /api/payments/verify-payment
 *
 * Verifies a Razorpay payment signature via the payment-worker RPC binding,
 * then creates a subscription and payment transaction in the auth DB via
 * the SSO worker, syncs the shadow table in the app DB, generates a receipt
 * PDF, and sends a confirmation email.
 *
 * Requires SSO authentication.
 */


import type { AuthenticatedContext } from '@rareminds-eym/auth-core';
import { getContextUser } from '../../../lib/auth';
import { RECEIPT_CONFIG, DateUtils } from '../../../lib/constants';
import { sendEmailSafe } from '../../../lib/email-service';
import { createLogger } from '../../../lib/logger';
import { apiError, apiSuccess } from '../../../lib/response';
import {
  ssoCreateSubscription,
  ssoRecordTransaction,
  ssoSyncSubscription,
  ssoUpdateSubscriptionField,
  ssoUpdateTransaction,
} from '../../../lib/sso-client';
import { getServiceClient } from '../../../lib/supabase';
import { syncSubscriptionCache, syncUserShadow } from '../../../lib/sync-shadow';
import type { PagesEnv } from '../../../lib/types';
import { APP_URL } from '../../email/types';
import { generateUserConfirmationHtml, getUserConfirmationSubject } from '../../email/services/templates';
import type { EventConfirmationTemplateData } from '../../email/types';
import { fetchImageBytes, generateReceiptPDF, type ReceiptData } from '../../storage/utils/pdf-generator';
import { R2Client } from '../../storage/utils/r2-client';
import { getPaymentWorker, rpcErrorResponse, type PaymentWorkerEnv } from '../lib/paymentBinding';

const logger = createLogger('payments:verify-payment');

export async function handleVerifyPayment(context: AuthenticatedContext): Promise<Response> {
  const user = getContextUser(context);
  const env = context.env as unknown as PaymentWorkerEnv & { SSO_SERVICE: Fetcher };

  // Ensure user.email exists before proceeding
  if (!user.email) {
    return apiError(400, 'VALIDATION_ERROR', 'User email is required', context.request);
  }

  const userEmail: string = user.email;
  const userName = typeof user.name === 'string' ? user.name : undefined;
  const userPhone = typeof user.phone === 'string' ? user.phone : undefined;

  try {
    let body: Record<string, unknown>;
    try {
      body = (await context.request.json()) as Record<string, unknown>;
    } catch {
      return apiError(400, 'VALIDATION_ERROR', 'Invalid JSON body', context.request);
    }

    if (!body.razorpay_order_id || !body.razorpay_payment_id || !body.razorpay_signature) {
      return apiError(400, 'VALIDATION_ERROR', 'razorpay_order_id, razorpay_payment_id, and razorpay_signature are required', context.request);
    }

    // Type narrow and validate Razorpay IDs
    if (
      typeof body.razorpay_order_id !== 'string' ||
      typeof body.razorpay_payment_id !== 'string' ||
      typeof body.razorpay_signature !== 'string' ||
      !body.razorpay_order_id.trim() ||
      !body.razorpay_payment_id.trim() ||
      !body.razorpay_signature.trim()
    ) {
      return apiError(400, 'VALIDATION_ERROR', 'Invalid Razorpay payment parameters', context.request);
    }

    const razorpayOrderId = body.razorpay_order_id;
    const razorpayPaymentId = body.razorpay_payment_id;
    const razorpaySignature = body.razorpay_signature;

    // Step 1: Verify Razorpay HMAC signature via payment-worker RPC (unchanged)
    const worker = getPaymentWorker(env);
    const verifyResult = await worker.verifyPaymentSignature(
      razorpayOrderId,
      razorpayPaymentId,
      razorpaySignature
    );

    // Step 1.5: Verify payment was actually captured (Amount Spoofing Prevention)
    const payment = await worker.getPayment(razorpayPaymentId);
    if (payment.status !== 'captured' || payment.order_id !== razorpayOrderId) {
      return apiError(400, 'VALIDATION_ERROR', 'Payment not captured or order ID mismatch', context.request);
    }

    // Step 2: Signature valid — prepare subscription data
    const plan = body.plan as Record<string, unknown> | undefined;
    if (!plan || !plan.id || !plan.name || !plan.price || !plan.duration) {
      logger.warn('Signature verified but no plan data provided');
      return apiSuccess(verifyResult, context.request);
    }

    const supabase = getServiceClient(env as { SUPABASE_URL: string; SUPABASE_SERVICE_ROLE_KEY: string });

    // Step 2.5: Validate plan exists via plans_cache (local shadow of auth DB)
    const { data: validPlan, error: planError } = await supabase
      .from('plans_cache')
      .select('id, plan_code, name, is_active, pricing_matrix, base_features')
      .eq('id', plan.id)
      .eq('is_active', true)
      .maybeSingle();

    if (planError || !validPlan) {
      logger.error('Invalid or inactive plan', planError instanceof Error ? planError : new Error('Plan not found'));
      return apiError(400, 'VALIDATION_ERROR', 'Selected plan is not valid or inactive', context.request);
    }

    // Step 2.5: Validate currency (SECURITY: prevent multi-currency fraud)
    if (payment.currency !== 'INR') {
      logger.error('Currency mismatch - Invalid payment currency', new Error(`Expected INR but got ${payment.currency}`));
      return apiError(400, 'VALIDATION_ERROR', 'Invalid payment currency. Only INR is supported.', context.request);
    }

    // Authoritative price from DB — never trust client-supplied price
    const pricingMatrix = validPlan.pricing_matrix as Record<string, any>;
    const clientPrice = plan.price as number;
    let planPrice: number | undefined;

    // SECURITY FIX: Check both yearly and monthly pricing based on plan duration
    const planDuration = plan.duration as string;
    const isYearly = planDuration.toLowerCase().includes('year') || planDuration.toLowerCase().includes('annual');
    const cycleKey = isYearly ? 'yearly' : 'monthly';

    if (pricingMatrix) {
      for (const key in pricingMatrix) {
        const price = pricingMatrix[key]?.[cycleKey];
        if (typeof price === 'number' && price === clientPrice) {
          planPrice = price;
          break;
        }
      }
    }

    if (typeof planPrice !== 'number') {
      logger.error('Plan price mismatch or no pricing found for cycle', new Error(`No valid ${cycleKey} pricing found for plan ${plan.id}`));
      return apiError(400, 'VALIDATION_ERROR', `Selected plan has no valid ${cycleKey} pricing matching the request`, context.request);
    }

    // Step 2.6: Cross-verify authoritative Razorpay captured amount
    const expectedPaise = Math.round(planPrice * 100);
    if (payment.amount !== expectedPaise) {
      logger.error('Amount mismatch - Payment amount verification failed', new Error(`Captured ${payment.amount} paise but expected ${expectedPaise} paise`));
      return apiError(400, 'VALIDATION_ERROR', `Amount mismatch: captured ${payment.amount} paise, expected ${expectedPaise}`, context.request);
    }

    // Calculate subscription dates
    const now = new Date();
    const endDate = new Date(now);
    const durationMonths = parseDurationMonths(plan.duration as string);
    endDate.setMonth(endDate.getMonth() + durationMonths);

    // Step 2.7: Pre-calculate receipt key for async generation
    // DO NOT store in database yet - only after successful upload
    let receiptKey: string | null = null;
    
    const shortUserId = user.id.substring(0, RECEIPT_CONFIG.USER_ID_PREFIX_LENGTH);
    const sanitizedPmtId = razorpayPaymentId.replace(RECEIPT_CONFIG.PAYMENT_ID_SANITIZE_REGEX, '');
    const timestamp = Date.now();
    receiptKey = `payment_pdf/user_${shortUserId}/${sanitizedPmtId}_${timestamp}.pdf`;

    // Check for existing active subscription via shadow table
    const { data: existingCache } = await supabase
      .from('subscription_cache')
      .select('id, status, plan_id, plan_code, plan_amount')
      .eq('user_id', user.id)
      .in('status', ['active', 'pending', 'grace_period'])
      .maybeSingle();

    let subscription: Record<string, unknown>;
    let isUpgrade = false;

    if (existingCache) {
      // Upgrade flow — update existing subscription in auth DB
      isUpgrade = true;
      logger.info('Upgrading existing subscription', { subscriptionId: existingCache.id });

      // Validate upgrade direction via current plan amount
      const currentPrice = existingCache.plan_amount;

      const { data: currentPlan } = await supabase
        .from('plans_cache')
        .select('plan_code')
        .eq('id', existingCache.plan_id)
        .single();

      if (currentPlan) {
        if (typeof currentPrice !== 'number' || typeof planPrice !== 'number') {
          logger.warn('Cannot compare plan pricing', { currentPrice, planPrice });
          return apiError(400, 'VALIDATION_ERROR', 'Cannot determine plan pricing. Please contact support.', context.request);
        }

        if (planPrice <= currentPrice) {
          logger.warn('Downgrade blocked', {
            currentPlan: currentPlan.plan_code,
            currentPrice,
            newPrice: planPrice,
          });
          return apiError(400, 'VALIDATION_ERROR', 'Cannot downgrade or lateral move. Please contact support for plan changes.', context.request);
        }
      }

      try {
        subscription = await ssoUpdateSubscriptionField(env, existingCache.id, {
          plan_id: plan.id,
          plan_code: validPlan.plan_code,
          plan_type: plan.name,
          plan_amount: planPrice,
          billing_cycle: plan.duration,
          razorpay_order_id: razorpayOrderId,
          razorpay_payment_id: razorpayPaymentId,
          subscription_start_date: now.toISOString(),
          subscription_end_date: endDate.toISOString(),
          auto_renew: true,
          status: 'active',
          // DO NOT set receipt_url here - will be set after successful upload
        });
      } catch (upgradeError: any) {
        if (upgradeError.message?.includes('duplicate key') || upgradeError.message?.includes('23505') || upgradeError.status === 409) {
          logger.info('Subscription already updated by webhook (duplicate caught). Syncing shadow cache before return');

          try {
            await syncUserShadow(supabase, user.id, typeof body.email === 'string' ? body.email : userEmail);
            const syncData = await ssoSyncSubscription(env, user.id);
            if (syncData.subscription) {
              await syncSubscriptionCache(supabase, syncData.subscription, syncData.plan);
            }
          } catch (syncError) {
            logger.error('Shadow sync failed during upgrade duplicate handling', syncError instanceof Error ? syncError : new Error(String(syncError)));
          }

          return apiSuccess({
            payment_verified: true,
            subscription_upgraded: true,
            already_fulfilled: true,
            ...verifyResult,
          }, context.request);
        }

        logger.error('Upgrade failed', upgradeError instanceof Error ? upgradeError : new Error(upgradeError.message));

        // Record failed upgrade as an event in auth DB
        try {
          await ssoRecordTransaction(env, {
            user_id: user.id,
            razorpay_order_id: razorpayOrderId,
            razorpay_payment_id: razorpayPaymentId,
            razorpay_signature: razorpaySignature,
            amount: planPrice,
            status: 'failed',
            transaction_type: 'upgrade',
            payment_method: payment.method,
            failure_reason: upgradeError.message,
            metadata: {
              original_subscription_id: existingCache.id,
              original_plan_id: existingCache.plan_id,
              target_plan_id: plan.id,
              error: upgradeError.message,
            },
          });
        } catch (logError) {
          logger.error('Failed to log upgrade failure', logError instanceof Error ? logError : new Error(String(logError)));
        }

        return apiSuccess({
          payment_verified: true,
          subscription_upgraded: false,
          ...verifyResult,
          error: {
            code: 'UPGRADE_FAILED',
            message: 'Payment verified but upgrade failed. Support will contact you within 24 hours.',
          },
        }, context.request, 207);
      }
    } else {
      // New subscription — create in auth DB
      logger.info('Creating new subscription for user', { userId: user.id });

      try {
        subscription = await ssoCreateSubscription(env, {
          user_id: user.id,
          plan_id: plan.id as string,
          plan_code: validPlan.plan_code,
          plan_type: plan.name as string,
          plan_amount: planPrice,
          billing_cycle: plan.duration as string,
          features: validPlan.base_features || [],
          full_name: userName || userEmail,
          email: userEmail,
          phone: userPhone,
          razorpay_order_id: razorpayOrderId,
          razorpay_payment_id: razorpayPaymentId,
          // DO NOT set receipt_url here - will be set after successful upload
        });
      } catch (createError: any) {
        // Handle race condition: Webhook or other synchronous flow already created the subscription
        if (createError.message?.includes('duplicate key') || createError.message?.includes('23505') || createError.status === 409) {
          logger.info('Subscription already created (duplicate caught). Order fulfilled asynchronously. Syncing shadow cache before return');

          try {
            await syncUserShadow(supabase, user.id, typeof body.email === 'string' ? body.email : userEmail);
            const syncData = await ssoSyncSubscription(env, user.id);
            if (syncData.subscription) {
              await syncSubscriptionCache(supabase, syncData.subscription, syncData.plan);
            }
          } catch (syncError) {
            logger.error('Shadow sync failed during duplicate handling', syncError instanceof Error ? syncError : new Error(String(syncError)));
          }

          return apiSuccess({
            payment_verified: true,
            subscription_created: true,
            already_fulfilled: true,
            ...verifyResult,
          }, context.request);
        }

        logger.error('Subscription creation failed', createError instanceof Error ? createError : new Error(createError.message));

        return apiSuccess({
          payment_verified: true,
          subscription_created: false,
          ...verifyResult,
          error: {
            code: 'SUBSCRIPTION_CREATE_FAILED',
            message: 'Payment verified but subscription creation failed. Please contact support.',
            details: createError.message,
          },
        }, context.request, 207);
      }
    }

    // Step 3: Record payment transaction in auth DB
    let transactionId: string | undefined;
    try {
      const txResult = await ssoRecordTransaction(env, {
        subscription_id: subscription.id as string,
        user_id: user.id,
        razorpay_payment_id: razorpayPaymentId,
        razorpay_order_id: razorpayOrderId,
        razorpay_signature: razorpaySignature,
        amount: planPrice,
        currency: 'INR',
        status: 'completed',
        transaction_type: isUpgrade ? 'upgrade' : 'subscription',
        payment_method: payment.method,
        // DO NOT set receipt_url here - will be set after successful upload
      });
      transactionId = typeof txResult.id === 'string' ? txResult.id : undefined;
    } catch (txError: any) {
      if (txError.message?.includes('duplicate key') || txError.message?.includes('23505') || txError.status === 409) {
        logger.info('Transaction already recorded (duplicate caught). Skipping further duplicate handling');
      } else {
        logger.error('Transaction recording failed (non-critical)', txError instanceof Error ? txError : new Error(String(txError)));
      }
    }

    // Step 3.5: Sync shadow table in app DB
    try {
      // Ensure user exists in users_shadow (FK constraint for subscription_cache)
      await syncUserShadow(supabase, user.id, typeof body.email === 'string' ? body.email : userEmail);

      const syncData = await ssoSyncSubscription(env, user.id);
      if (syncData.subscription) {
        await syncSubscriptionCache(supabase, syncData.subscription, syncData.plan);
      }
    } catch (syncError) {
      logger.error('Shadow sync failed (non-critical)', syncError instanceof Error ? syncError : new Error(String(syncError)));
    }

    // Step 4: Send payment confirmation email
    try {
      await sendPaymentSuccessEmail(env as unknown as PagesEnv, {
        name: userName || userEmail,
        email: userEmail,
        phone: userPhone || '',
        amount: planPrice,
        orderId: razorpayOrderId,
        campaign: plan.name as string,
        receiptUrl: undefined, // Receipt will be generated asynchronously
      });
    } catch (emailErr) {
      logger.error('Email failed (non-critical)', emailErr instanceof Error ? emailErr : new Error(String(emailErr)));
    }

    // Step 5: Generate receipt PDF asynchronously (non-blocking, after response)
    if (receiptKey) {
      if (context.waitUntil) {
        logger.info('Scheduling async receipt generation', { receiptKey });
        context.waitUntil(
          (async () => {
            // Small delay gives transaction/subscription writes time to become visible before async receipt update.
            await new Promise((resolve) => setTimeout(resolve, 100));
            
            await generateAndUploadReceipt({
              env,
              supabase,
              subscriptionId: subscription.id as string,
              transactionId,
              userId: user.id,
              receiptKey,
              paymentId: razorpayPaymentId,
              orderId: razorpayOrderId,
              amount: planPrice,
              paymentMethod: payment.method || 'Card',
              subscription: {
                plan_type: subscription.plan_type as string,
                billing_cycle: subscription.billing_cycle as string,
                subscription_start_date: subscription.subscription_start_date as string,
                subscription_end_date: subscription.subscription_end_date as string,
              },
              user: {
                name: userName,
                email: userEmail,
                phone: userPhone,
              },
            });
          })().catch((err) => {
            try {
              logger.error(
                'Async receipt generation failed',
                err instanceof Error ? err : new Error(String(err))
              );
            } catch {
              console.error(
                '[Receipt Generation Error]',
                err instanceof Error ? err.message : String(err)
              );
            }
          })
        );
      } else {
        logger.warn('context.waitUntil not available, receipt generation skipped');
      }
    }

    return apiSuccess({
      ...verifyResult,
      subscription_created: true,
      receipt_status: 'generating', // Indicate receipt is being generated in background
      is_upgrade: isUpgrade,
      subscription: {
        id: subscription.id,
        status: subscription.status,
        plan_name: subscription.plan_type,
        start_date: subscription.subscription_start_date,
        end_date: subscription.subscription_end_date,
      },
    }, context.request);
  } catch (error) {
    logger.error('Payment verification failed', error instanceof Error ? error : new Error(String(error)));
    return rpcErrorResponse(error, context.request);
  }
}

function parseDurationMonths(duration: string): number {
  const lower = duration.toLowerCase();
  if (lower.includes('annual') || lower.includes('year')) return 12;
  if (lower.includes('quarter')) return 3;
  if (lower.includes('month')) return 1;
  return 1;
}

async function sendPaymentSuccessEmail(
  env: PagesEnv,
  data: EventConfirmationTemplateData
): Promise<void> {
  const html = generateUserConfirmationHtml(data);
  const subject = getUserConfirmationSubject(data.name);

  const success = await sendEmailSafe(env, {
    to: data.email,
    subject,
    html,
  });

  if (success) {
    logger.info('Payment confirmation email sent', { email: data.email });
  } else {
    logger.error('Email send failed (non-critical)', new Error('Failed to send payment confirmation email'));
  }
}

/**
 * Generate and upload payment receipt PDF, then update subscription with receipt URL
 */
async function generateAndUploadReceipt(params: {
  env: PaymentWorkerEnv & { SSO_SERVICE: Fetcher };
  supabase: ReturnType<typeof getServiceClient>;
  subscriptionId: string;
  transactionId?: string;
  userId: string;
  receiptKey: string;
  paymentId: string;
  orderId: string;
  amount: number;
  paymentMethod: string;
  subscription: {
    plan_type: string;
    billing_cycle: string;
    subscription_start_date: string;
    subscription_end_date: string;
  };
  user: {
    name?: string;
    email: string;
    phone?: string;
  };
}): Promise<void> {
  const {
    env,
    supabase,
    subscriptionId,
    transactionId,
    userId,
    receiptKey,
    paymentId,
    orderId,
    amount,
    paymentMethod,
    subscription,
    user: userInfo,
  } = params;

  try {
    logger.info('Starting receipt generation', { receiptKey, userId, subscriptionId });
    const pagesEnv = env as unknown as PagesEnv;

    // Fetch learner name from database
    logger.info('Fetching learner data', { userId });
    const { data: learner, error: learnerError } = await supabase
      .from('learners')
      .select('name')
      .eq('user_id', userId)
      .maybeSingle();

    if (learnerError) {
      logger.warn(`Failed to fetch learner data: ${learnerError.message} (code: ${learnerError.code})`);
    }

    // Safely normalize learner name before use
    const learnerName =
      typeof learner?.name === 'string' && learner.name.trim()
        ? learner.name.trim()
        : undefined;

    // Fetch company logo
    let logoBytes: Uint8Array | undefined;
    const logoUrl = `${APP_URL}/RareMinds ISO Logo-01.png`;
    try {
      logger.info('Fetching company logo', { logoUrl });
      logoBytes = await fetchImageBytes(logoUrl);
      logger.info('Logo fetched successfully');
    } catch (logoErr) {
      logger.warn(`Logo fetch failed, continuing without logo: ${logoErr instanceof Error ? logoErr.message : String(logoErr)}`);
    }

    // Prepare receipt data
    const receiptData: ReceiptData = {
      transaction: {
        payment_id: paymentId,
        order_id: orderId,
        amount,
        currency: 'INR',
        payment_method: paymentMethod,
        payment_timestamp: new Date().toLocaleDateString('en-IN', {
          day: '2-digit',
          month: 'short',
          year: 'numeric',
        }),
        status: 'Success',
      },
      subscription: {
        plan_name: subscription.plan_type,
        plan_type: subscription.plan_type,
        billing_cycle: subscription.billing_cycle,
        subscription_start_date: subscription.subscription_start_date,
        subscription_end_date: subscription.subscription_end_date,
      },
      user: {
        name: learnerName || userInfo.name || userInfo.email,
        email: userInfo.email,
        phone: userInfo.phone,
      },
      company: {
        name: 'Rareminds',
        address:
          '231, 2nd stage, 13th Cross Road\nHoysala Nagar, Indiranagar\nBengaluru, Karnataka 560001',
        phone: '+91 9902326951',
        email: 'marketing@rareminds.in',
        taxId: 'GSTIN: 29ABCDE1234F1Z5',
      },
      generatedAt: new Date().toLocaleString('en-IN'),
      logoBytes,
      watermarkBytes: logoBytes,
    };

    // Generate PDF
    logger.info('Generating PDF receipt', { paymentId, amount });
    let pdfBytes;
    try {
      pdfBytes = await generateReceiptPDF(receiptData);
      logger.info('PDF generated successfully', { size: pdfBytes.buffer.byteLength });
    } catch (pdfError) {
      logger.error('PDF generation failed', pdfError instanceof Error ? pdfError : new Error(String(pdfError)));
      throw pdfError;
    }
    
    const sanitizedPaymentId = paymentId.replace(RECEIPT_CONFIG.PAYMENT_ID_SANITIZE_REGEX, '');
    const filename = `Receipt-${sanitizedPaymentId.slice(-8)}-${DateUtils.getDateString()}.pdf`;

    // Upload to R2
    logger.info('Uploading receipt to R2', { receiptKey, filename });
    const r2 = new R2Client(pagesEnv);
    await r2.upload(receiptKey, pdfBytes.buffer as ArrayBuffer, 'application/pdf', {
      'Content-Disposition': `attachment; filename="${filename}"`,
    });

    logger.info('Receipt uploaded successfully to R2', { receiptKey, size: pdfBytes.buffer.byteLength });

    // Update subscription and transaction in auth DB with receipt URL
    try {
      logger.info('Updating subscription with receipt URL in auth DB', { subscriptionId, receiptKey });
      await ssoUpdateSubscriptionField(env, subscriptionId, {
        receipt_url: receiptKey,
      });
      logger.info('Receipt URL saved to auth DB subscription successfully', { receiptKey, subscriptionId });

      // Update transaction with receipt URL
      if (transactionId) {
        try {
          logger.info('Updating transaction with receipt URL in auth DB');
          await ssoUpdateTransaction(env, transactionId, {
            receipt_url: receiptKey,
          });
          logger.info('Receipt URL saved to auth DB transaction successfully');
        } catch (txUpdateErr) {
          const error = txUpdateErr instanceof Error ? txUpdateErr : new Error(String(txUpdateErr));
          
          // Graceful degradation: If SSO RPC method is not implemented yet, log warning and continue
          if (error.message?.includes('not implemented')) {
            logger.warn('Transaction update skipped: SSO RPC method not yet available');
          } else {
            logger.error('Failed to update transaction with receipt_url (non-critical)', error);
          }
          
          // Continue - receipt generation should not fail because transaction metadata update failed
        }
      } else {
        logger.warn('No transaction ID available, skipping transaction receipt URL update');
      }

      // Sync to app DB subscription_cache
      try {
        logger.info('Syncing receipt URL to app DB', { userId });
        const syncData = await ssoSyncSubscription(env, userId);
        if (syncData.subscription) {
          await syncSubscriptionCache(supabase, syncData.subscription, syncData.plan);
          logger.info('Receipt URL synced to app DB subscription_cache successfully', { receiptKey, userId });
        } else {
          logger.warn('No subscription data returned from sync', { userId });
        }
      } catch (syncErr) {
        logger.error(
          'Failed to sync receipt_url to subscription_cache (non-critical)',
          syncErr instanceof Error ? syncErr : new Error(String(syncErr))
        );
      }
    } catch (updateErr) {
      logger.error(
        'Failed to save receipt URL to subscription (non-critical)',
        updateErr instanceof Error ? updateErr : new Error(String(updateErr))
      );
    }
  } catch (error) {
    logger.error('Receipt generation failed', error instanceof Error ? error : new Error(String(error)));
  }
}
