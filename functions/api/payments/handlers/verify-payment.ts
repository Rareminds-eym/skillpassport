import { requireSelfServePlan, assertPlanPurchaseScope, catalogPlanErrorResponse } from '../lib/salesPlan';
import { completePlanSelection } from '../../../shared/lib/org-subscription';
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
import { sendEmailSafe } from '../../../lib/email-service';
import { createLogger } from '../../../lib/logger';
import { apiError, apiSuccess } from '../../../lib/response';
import {
  ssoFulfillSubscriptionPayment,
  ssoGetSubscriptionPaymentFulfillment,
  type SsoEnv,
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

const logger = createLogger('verify-payment');
const COLLEGE_LEARNER_PROMO_CODE = 'RAREMINDS2026';
const COLLEGE_LEARNER_PROMO_STARTER_AMOUNT_ADDON = 501;
const COLLEGE_LEARNER_PROMO_STARTER_PLAN_CODES = ['skill_starter'];
const COLLEGE_LEARNER_PROMO_STARTER_PLAN_NAMES = ['skill starter'];

// Receipt configuration constants
const RECEIPT_CONFIG = {
  USER_ID_PREFIX_LENGTH: 8,
  PAYMENT_ID_SANITIZE_REGEX: /[^a-zA-Z0-9_-]/g,
};

// plans_cache.pricing_matrix is a JSONB column with no DB-level shape
// constraint; this validates the real structure at runtime instead of
// trusting a bare type assertion.
type PricingMatrix = Record<string, { yearly?: number; monthly?: number; currency?: string }>;

function isPricingMatrix(value: unknown): value is PricingMatrix {
  if (typeof value !== 'object' || value === null || Array.isArray(value)) {
    return false;
  }
  for (const key in value as Record<string, unknown>) {
    const entry = (value as Record<string, unknown>)[key];
    if (typeof entry !== 'object' || entry === null || Array.isArray(entry)) {
      return false;
    }
    const { yearly, monthly, currency } = entry as Record<string, unknown>;
    if (yearly !== undefined && typeof yearly !== 'number') {
      return false;
    }
    if (monthly !== undefined && typeof monthly !== 'number') {
      return false;
    }
    if (currency !== undefined && typeof currency !== 'string') {
      return false;
    }
  }
  return true;
}

const normalizePromoCode = (code: unknown): string =>
  String(code || '').trim().toUpperCase();

async function isCollegeLearnerPromoStarterPlan(
  supabase: ReturnType<typeof getServiceClient>,
  userId: string,
  userEmail: string,
  plan: { plan_code?: string | null; name?: string | null },
  requestReferralCode?: unknown,
): Promise<boolean> {
  let userQuery = supabase
    .from('users')
    .select('role, metadata');

  if (userEmail) {
    userQuery = userQuery.eq('email', userEmail);
  } else {
    userQuery = userQuery.eq('id', userId);
  }

  const { data: userRow } = await userQuery.maybeSingle();
  const metadata = (userRow?.metadata || {}) as Record<string, unknown>;
  const referralCode = normalizePromoCode(requestReferralCode || metadata.referralCode || metadata.referral_code);
  const planCode = String(plan.plan_code || '').toLowerCase();
  const planName = String(plan.name || '').trim().toLowerCase();

  return (
    userRow?.role === 'learner' &&
    referralCode === COLLEGE_LEARNER_PROMO_CODE &&
    (
      COLLEGE_LEARNER_PROMO_STARTER_PLAN_CODES.includes(planCode) ||
      COLLEGE_LEARNER_PROMO_STARTER_PLAN_NAMES.includes(planName)
    )
  );
}

export async function handleVerifyPayment(context: AuthenticatedContext): Promise<Response> {
  const user = getContextUser(context);
  const env = context.env as unknown as PaymentWorkerEnv & SsoEnv & { SSO_SERVICE: Fetcher };

  // Ensure user.email exists before proceeding
  if (!user.email) {
    return apiError(400, 'VALIDATION_ERROR', 'User email is required', context.request);
  }

  const userEmail: string = user.email;

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
    if (!plan || typeof plan !== 'object') {
      logger.warn('Signature verified but no plan data provided', { 
        razorpayPaymentId, 
        razorpayOrderId 
      });
      return apiError(400, 'VALIDATION_ERROR', 'A complete catalogue plan is required to activate the subscription.', context.request);
    }
    if (!plan.id || !plan.name || !plan.price || !plan.duration) {
      logger.warn('Signature verified but incomplete plan data', { 
        razorpayPaymentId, 
        razorpayOrderId,
        hasPlanId: !!plan.id,
        hasPlanName: !!plan.name,
        hasPlanPrice: !!plan.price,
        hasPlanDuration: !!plan.duration
      });
      return apiError(400, 'VALIDATION_ERROR', 'A complete catalogue plan is required to activate the subscription.', context.request);
    }

    const supabase = getServiceClient(env as { SUPABASE_URL: string; SUPABASE_SERVICE_ROLE_KEY: string });

    const order = await worker.getOrder(razorpayOrderId);
    const notes = order.notes;
    if (order.id !== razorpayOrderId || order.amount !== payment.amount || order.currency !== payment.currency
      || payment.currency !== 'INR' || !notes || notes.type !== 'subscription' || notes.user_id !== user.id
      || notes.plan_id !== plan.id || typeof notes.org_id !== 'string'
      || (notes.org_id !== '' && notes.org_id !== user.org_id)) {
      return apiError(400, 'PAYMENT_BINDING_MISMATCH', 'The payment does not match this buyer, plan, or organization.', context.request);
    }
    // A fulfilled payment is historical fact, independent of today's price,
    // cached coverage, or a later upgrade of the same subscription row.
    const fulfilled = await ssoGetSubscriptionPaymentFulfillment(env, {
      user_id: user.id, plan_id: notes.plan_id, organization_id: notes.org_id || undefined,
      razorpay_order_id: razorpayOrderId, razorpay_payment_id: razorpayPaymentId,
      amount: payment.amount / 100, currency: payment.currency,
    });
    if (fulfilled) {
      await syncUserShadow(supabase, user.id, userEmail);
      await syncSubscriptionCache(supabase, fulfilled.subscription);
      if (fulfilled.subscription.razorpay_payment_id === razorpayPaymentId) {
        const { allocateInitialPlanCredits } = await import('../../../shared/lib/entitlement-service');
        const allocation = await allocateInitialPlanCredits(supabase, notes.org_id || user.id,
          String(fulfilled.subscription.plan_id), !!notes.org_id,
          'Initial plan allocation on verified payment', razorpayPaymentId);
        if (!allocation.success) throw new Error('Unable to complete subscription credit allocation');
        await completePlanSelection(supabase, user.id, String(fulfilled.subscription.plan_id));
      }
      return apiSuccess({ ...verifyResult, subscription_created: true, already_fulfilled: true,
        subscription: fulfilled.subscription, is_upgrade: fulfilled.is_upgrade,
        receipt_url: fulfilled.receipt_url, email_sent: false }, context.request);
    }
    const validPlan = await requireSelfServePlan(supabase, { plan_id: plan.id });
    const purchaseScope = await assertPlanPurchaseScope(supabase, validPlan, user);
    if (notes.org_id !== (purchaseScope.organizationId || '')
      || notes.organization_type !== (purchaseScope.organizationType || '')) {
      return apiError(400, 'PAYMENT_BINDING_MISMATCH', 'The payment does not match this purchase scope.', context.request);
    }

    // Step 2.5: Validate currency (SECURITY: prevent multi-currency fraud)
    if (payment.currency !== 'INR') {
      logger.error('Currency mismatch - Invalid payment currency', new Error(`Expected INR but got ${payment.currency}`));
      return apiError(400, 'VALIDATION_ERROR', 'Invalid payment currency. Only INR is supported.', context.request);
    }

    // Authoritative price from DB — never trust client-supplied price
    const rawPricingMatrix = validPlan.pricing_matrix;
    if (!isPricingMatrix(rawPricingMatrix)) {
      logger.error('No pricing matrix found for plan', new Error('Invalid pricing matrix structure'), { 
        planId: plan.id,
        planCode: validPlan.plan_code
      });
      return apiError(400, 'VALIDATION_ERROR', 'Plan pricing data is invalid', context.request);
    }
    const pricingMatrix = rawPricingMatrix;
    const clientPrice = plan.price as number;
    let planPrice: number | undefined;
    let detectedBillingCycle: 'yearly' | 'monthly' | undefined;
    const allowPromoStarterAmount = await isCollegeLearnerPromoStarterPlan(supabase, user.id, userEmail, validPlan, notes.referral_code);

    // CRITICAL: Search for ANY matching price in the pricing matrix
    // Plans may have duration label that doesn't match actual billing cycle
    // (e.g., "monthly" label for a yearly-billed plan)
    if (pricingMatrix) {
      for (const entityKey in pricingMatrix) {
        const entityPricing = pricingMatrix[entityKey];

        // Try yearly first
        const promoYearlyPrice = entityPricing?.yearly
          ? entityPricing.yearly + COLLEGE_LEARNER_PROMO_STARTER_AMOUNT_ADDON
          : undefined;
        if (
          entityPricing?.yearly &&
          entityPricing.yearly > 0 &&
          (entityPricing.yearly === clientPrice || (allowPromoStarterAmount && promoYearlyPrice === clientPrice))
        ) {
          planPrice = allowPromoStarterAmount && promoYearlyPrice === clientPrice ? promoYearlyPrice : entityPricing.yearly;
          detectedBillingCycle = 'yearly';
          logger.info('Price matched to yearly billing cycle', { 
            clientPrice, 
            planPrice, 
            entityKey,
            planId: plan.id
          });
          break;
        }

        // Then try monthly
        const promoMonthlyPrice = entityPricing?.monthly
          ? entityPricing.monthly + COLLEGE_LEARNER_PROMO_STARTER_AMOUNT_ADDON
          : undefined;
        if (
          entityPricing?.monthly &&
          entityPricing.monthly > 0 &&
          (entityPricing.monthly === clientPrice || (allowPromoStarterAmount && promoMonthlyPrice === clientPrice))
        ) {
          planPrice = allowPromoStarterAmount && promoMonthlyPrice === clientPrice ? promoMonthlyPrice : entityPricing.monthly;
          detectedBillingCycle = 'monthly';
          logger.info('Price matched to monthly billing cycle', { 
            clientPrice, 
            planPrice, 
            entityKey,
            planId: plan.id
          });
          break;
        }
      }
    }

    if (typeof planPrice !== 'number') {
      logger.error('Plan price mismatch or no pricing found', new Error('Unable to match client price with plan pricing matrix'), {
        planId: plan?.id,
        planCode: validPlan.plan_code,
        clientPrice,
        duration: plan?.duration,
        pricingMatrix,
      });
      return apiError(400, 'VALIDATION_ERROR', `Selected plan has no pricing matching the payment (₹${clientPrice}). Please try again.`, context.request);
    }

    // Step 2.6: Cross-verify authoritative Razorpay captured amount
    const expectedPaise = Math.round(planPrice * 100);
    if (payment.amount !== expectedPaise) {
      logger.error('Amount mismatch - Payment amount verification failed', new Error(`Captured ${payment.amount} paise but expected ${expectedPaise} paise`));
      return apiError(400, 'VALIDATION_ERROR', `Amount mismatch: captured ${payment.amount} paise, expected ${expectedPaise}`, context.request);
    }

    const { data: learner } = await supabase.from('learners').select('name').eq('user_id', user.id).maybeSingle();
    const learnerName: string | null = learner?.name ?? null;
    const config = validPlan.entity_config;
    let seatCount = 1;
    if (config && typeof config === 'object') {
      for (const value of Object.values(config)) {
        if (value && typeof value === 'object' && 'max_users' in value
          && Number.isSafeInteger(Number(value.max_users)) && Number(value.max_users) > 0) {
          seatCount = Number(value.max_users); break;
        }
      }
    }
    if (!detectedBillingCycle) throw new Error('Payment billing cycle was not determined');
    const fulfillment = await ssoFulfillSubscriptionPayment(env, {
      user_id: user.id, plan_id: validPlan.id,
      organization_id: purchaseScope.organizationId, organization_type: purchaseScope.organizationType,
      razorpay_order_id: razorpayOrderId, razorpay_payment_id: razorpayPaymentId,
      razorpay_signature: razorpaySignature, amount: planPrice, currency: payment.currency,
      billing_cycle: detectedBillingCycle, payment_method: payment.method,
      full_name: learnerName || userEmail, email: userEmail, seat_count: seatCount,
    });
    const subscription = fulfillment.subscription;
    const isUpgrade = fulfillment.is_upgrade;
    const transactionId = fulfillment.transaction_id;

    // Step 3.5: Sync shadow table in app DB
    try {
      // Ensure user exists in users_shadow (FK constraint for subscription_cache)
      // user.email (AuthUser) is always a non-empty string, so this fallback
      // can never resolve to undefined.
      const bodyEmail = typeof body.email === 'string' ? body.email : undefined;
      await syncUserShadow(supabase, user.id, bodyEmail || user.email);

      await syncSubscriptionCache(supabase, subscription, validPlan);

      if (validPlan?.id) {
        const { allocateInitialPlanCredits } = await import('../../../shared/lib/entitlement-service');
        const orgId = purchaseScope.organizationId;
        await allocateInitialPlanCredits(
          supabase,
          orgId || user.id,
          validPlan.id,
          !!orgId,
          `Initial plan allocation on subscription purchase (${validPlan.plan_code})`,
          // Blocks credit-stacking when the upgrade path is double-verified
          razorpayPaymentId
        );
      }
    } catch (syncError) {
      logger.error('Shadow sync failed (non-critical)', syncError instanceof Error ? syncError : new Error(String(syncError)), {
        userId: user.id,
        razorpayPaymentId,
        razorpayOrderId
      });
    }

    // users.phone is the source of truth for phone numbers (subscriptions.phone
    // no longer exists); fetched once here and reused for the email step below.
    const { data: userRecordForContact, error: userRecordForContactError } = await supabase
      .from('users')
      .select('phone')
      .eq('id', user.id)
      .maybeSingle();
    if (userRecordForContactError) {
      logger.error('Failed to fetch user phone for contact (non-critical)', userRecordForContactError instanceof Error ? userRecordForContactError : new Error(String(userRecordForContactError)), {
        userId: user.id
      });
    }
    const contactPhone = userRecordForContact?.phone ?? undefined;

    if (fulfillment.already_fulfilled) {
      if (subscription.razorpay_payment_id === razorpayPaymentId) await completePlanSelection(supabase, user.id, validPlan.id);
      return apiSuccess({ ...verifyResult, subscription_created: true, already_fulfilled: true,
        is_upgrade: isUpgrade, subscription, receipt_url: fulfillment.receipt_url,
        email_sent: false }, context.request);
    }

    // Step 4: Generate and upload receipt PDF asynchronously, then update databases
    // This function handles: PDF generation, R2 upload, auth DB update, and app DB sync
    const shortUserId = user.id.substring(0, RECEIPT_CONFIG.USER_ID_PREFIX_LENGTH);
    const sanitizedPmtId = razorpayPaymentId.replace(RECEIPT_CONFIG.PAYMENT_ID_SANITIZE_REGEX, '');
    const timestamp = Date.now();
    const receiptKeyForGeneration = `payment_pdf/user_${shortUserId}/${sanitizedPmtId}_${timestamp}.pdf`;

    // Fire-and-forget: Generate receipt in background without blocking payment response
    // The generateAndUploadReceipt function will:
    // 1. Generate PDF with proper branding
    // 2. Upload to R2 storage
    // 3. Update sso_auth.subscriptions.receipt_url
    // 4. Update sso_auth.transactions.receipt_url
    // 5. Sync to skillpassport.subscription_cache.receipt_url
    const receiptPromise = generateAndUploadReceipt({
      env,
      supabase,
      subscriptionId: subscription.id as string,
      transactionId,
      userId: user.id,
      receiptKey: receiptKeyForGeneration,
      paymentId: razorpayPaymentId,
      orderId: razorpayOrderId,
      amount: planPrice,
      paymentMethod: payment.method,
      subscription: {
        plan_type: subscription.plan_type as string,
        billing_cycle: subscription.billing_cycle as string,
        subscription_start_date: subscription.subscription_start_date as string,
        subscription_end_date: subscription.subscription_end_date as string,
      },
      user: {
        name: learnerName || undefined,
        email: userEmail,
        phone: contactPhone,
      },
    }).catch(err => {
      logger.error('Background receipt generation failed (non-critical)', err instanceof Error ? err : new Error(String(err)));
    });

    // Ensure receipt generation completes even after response is sent
    if (context.waitUntil) {
      context.waitUntil(receiptPromise);
    }

    const receiptUrl = `/api/storage/payment-receipt?key=${encodeURIComponent(receiptKeyForGeneration)}&mode=download`;

    // Step 5: Send payment confirmation email (unchanged)
    try {
      await sendPaymentSuccessEmail(env as unknown as PagesEnv, {
        name: subscription.full_name as string,
        email: (subscription.email as string) || user.email || '',
        phone: contactPhone || '',
        amount: planPrice,
        orderId: body.razorpay_order_id as string,
        campaign: subscription.plan_type as string,
        receiptUrl: receiptUrl || undefined,
      });
    } catch (emailErr) {
      logger.error('Email failed (non-critical)', emailErr instanceof Error ? emailErr : new Error(String(emailErr)), {
        userId: user.id,
        userEmail,
        razorpayPaymentId,
        razorpayOrderId
      });
    }

    await completePlanSelection(supabase, user.id, validPlan.id);
    return apiSuccess({
      ...verifyResult,
      subscription_created: true,
      receipt_status: 'generating', // Indicate receipt is being generated in background
      is_upgrade: isUpgrade,
      subscription,
    }, context.request);
  } catch (error) {
    logger.error('Payment verification failed', error instanceof Error ? error : new Error(String(error)));
    return catalogPlanErrorResponse(error, context.request) || rpcErrorResponse(error, context.request);
  }
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
 * Check if error indicates unsupported RPC method
 * Checks for explicit "not implemented" message thrown by sso-client
 * when RPC method is not available on the service binding.
 */
function isUnsupportedRpcMethod(error: unknown): boolean {
  if (typeof error !== 'object' || error === null) {
    return false;
  }
  
  if (!('message' in error) || typeof error.message !== 'string') {
    return false;
  }
  
  const message = error.message;
  
  // Match the exact error thrown by ssoUpdateTransaction in sso-client.ts
  // when the RPC method is not implemented on the service binding
  return (
    message.includes('not implemented') ||
    message.includes('Method not found')
  );
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
    const dateString = new Date().toISOString().split('T')[0]; // YYYY-MM-DD format
    const filename = `Receipt-${sanitizedPaymentId.slice(-8)}-${dateString}.pdf`;

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
          if (isUnsupportedRpcMethod(error)) {
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
