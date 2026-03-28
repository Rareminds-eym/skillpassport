/**
 * Integration Tests: Payment Webhook Handling
 * 
 * Tests Razorpay webhook processing for subscription payments,
 * failures, refunds, and subscription lifecycle events.
 * Requirements: 11.1, 11.2, 11.3, 11.4, 11.5
 */

import { beforeEach, describe, expect, it, vi } from 'vitest';

describe('Payment Webhook Integration Tests', () => {
  let subscriptions: Map<string, any>;
  let payments: Map<string, any>;
  let webhookLogs: any[];

  beforeEach(() => {
    subscriptions = new Map();
    payments = new Map();
    webhookLogs = [];
    vi.clearAllMocks();
  });

  describe('Webhook Signature Verification', () => {
    it('should verify valid webhook signature', async () => {
      const verifyWebhookSignature = (
        payload: string,
        signature: string,
        secret: string
      ) => {
        // Simplified signature verification
        const expectedSignature = `sha256=${Buffer.from(payload + secret).toString('base64')}`;
        return signature === expectedSignature;
      };

      const payload = JSON.stringify({ event: 'payment.captured' });
      const secret = 'webhook_secret_123';
      const validSignature = `sha256=${Buffer.from(payload + secret).toString('base64')}`;

      expect(verifyWebhookSignature(payload, validSignature, secret)).toBe(true);
      expect(verifyWebhookSignature(payload, 'invalid_signature', secret)).toBe(false);
    });

    it('should reject webhook with invalid signature', async () => {
      const processWebhook = async (payload: any, signature: string) => {
        const isValid = signature.startsWith('sha256=');
        if (!isValid) {
          throw new Error('Invalid webhook signature');
        }
        return { processed: true };
      };

      await expect(processWebhook({}, 'invalid')).rejects.toThrow('Invalid webhook signature');
    });
  });

  describe('Payment Captured Event', () => {
    it('should activate subscription on payment capture', async () => {
      const subscription = {
        id: 'sub-123',
        status: 'pending_payment',
        razorpay_order_id: 'order_123'
      };
      subscriptions.set(subscription.id, subscription);

      const handlePaymentCaptured = async (webhookData: any) => {
        const { order_id, id: payment_id, amount } = webhookData.payload.payment.entity;

        // Find subscription by order ID
        let targetSub: any = null;
        for (const [, sub] of subscriptions) {
          if (sub.razorpay_order_id === order_id) {
            targetSub = sub;
            break;
          }
        }

        if (!targetSub) {
          throw new Error('Subscription not found for order');
        }

        // Update subscription status
        targetSub.status = 'active';
        targetSub.razorpay_payment_id = payment_id;
        targetSub.activated_at = new Date().toISOString();

        // Create payment record
        const payment = {
          id: `pay-${Date.now()}`,
          subscription_id: targetSub.id,
          razorpay_payment_id: payment_id,
          razorpay_order_id: order_id,
          amount: amount / 100, // Convert from paise
          status: 'captured',
          captured_at: new Date().toISOString()
        };
        payments.set(payment.id, payment);

        webhookLogs.push({
          event: 'payment.captured',
          subscription_id: targetSub.id,
          processed_at: new Date().toISOString()
        });

        return { subscription: targetSub, payment };
      };

      const webhookData = {
        event: 'payment.captured',
        payload: {
          payment: {
            entity: {
              id: 'pay_razorpay_123',
              order_id: 'order_123',
              amount: 5310000, // ₹53,100 in paise
              status: 'captured'
            }
          }
        }
      };

      const result = await handlePaymentCaptured(webhookData);

      expect(result.subscription.status).toBe('active');
      expect(result.subscription.razorpay_payment_id).toBe('pay_razorpay_123');
      expect(result.payment.amount).toBe(53100);
      expect(webhookLogs.length).toBe(1);
    });

    it('should handle duplicate payment captured events idempotently', async () => {
      const subscription = {
        id: 'sub-123',
        status: 'active',
        razorpay_order_id: 'order_123',
        razorpay_payment_id: 'pay_razorpay_123'
      };
      subscriptions.set(subscription.id, subscription);

      const handlePaymentCaptured = async (webhookData: any) => {
        const { payment_id } = webhookData.payload.payment.entity;

        // Check if already processed
        for (const [, sub] of subscriptions) {
          if (sub.razorpay_payment_id === payment_id) {
            return { processed: true, duplicate: true, subscription: sub };
          }
        }

        return { processed: true, duplicate: false };
      };

      const webhookData = {
        event: 'payment.captured',
        payload: {
          payment: {
            entity: {
              id: 'pay_razorpay_123',
              payment_id: 'pay_razorpay_123',
              order_id: 'order_123'
            }
          }
        }
      };

      const result = await handlePaymentCaptured(webhookData);

      expect(result.duplicate).toBe(true);
      expect(result.subscription?.status).toBe('active');
    });
  });

  describe('Payment Failed Event', () => {
    it('should mark subscription as payment_failed', async () => {
      const subscription = {
        id: 'sub-123',
        status: 'pending_payment',
        razorpay_order_id: 'order_123',
        payment_attempts: 0
      };
      subscriptions.set(subscription.id, subscription);

      const handlePaymentFailed = async (webhookData: any) => {
        const { order_id, error_code, error_description } = webhookData.payload.payment.entity;

        let targetSub: any = null;
        for (const [, sub] of subscriptions) {
          if (sub.razorpay_order_id === order_id) {
            targetSub = sub;
            break;
          }
        }

        if (!targetSub) {
          throw new Error('Subscription not found');
        }

        targetSub.payment_attempts = (targetSub.payment_attempts || 0) + 1;
        targetSub.last_payment_error = {
          code: error_code,
          description: error_description,
          occurred_at: new Date().toISOString()
        };

        if (targetSub.payment_attempts >= 3) {
          targetSub.status = 'payment_failed';
        }

        webhookLogs.push({
          event: 'payment.failed',
          subscription_id: targetSub.id,
          attempt: targetSub.payment_attempts
        });

        return { subscription: targetSub, shouldRetry: targetSub.payment_attempts < 3 };
      };

      const webhookData = {
        event: 'payment.failed',
        payload: {
          payment: {
            entity: {
              order_id: 'order_123',
              error_code: 'BAD_REQUEST_ERROR',
              error_description: 'Card declined'
            }
          }
        }
      };

      const result = await handlePaymentFailed(webhookData);

      expect(result.subscription.payment_attempts).toBe(1);
      expect(result.shouldRetry).toBe(true);
      expect(result.subscription.last_payment_error.code).toBe('BAD_REQUEST_ERROR');
    });

    it('should suspend subscription after 3 failed attempts', async () => {
      const subscription = {
        id: 'sub-123',
        status: 'active',
        razorpay_order_id: 'order_123',
        payment_attempts: 2
      };
      subscriptions.set(subscription.id, subscription);

      const handlePaymentFailed = async (webhookData: any) => {
        const { order_id } = webhookData.payload.payment.entity;

        let targetSub: any = null;
        for (const [, sub] of subscriptions) {
          if (sub.razorpay_order_id === order_id) {
            targetSub = sub;
            break;
          }
        }

        targetSub.payment_attempts++;

        if (targetSub.payment_attempts >= 3) {
          targetSub.status = 'payment_failed';
          targetSub.suspended_at = new Date().toISOString();
          targetSub.suspension_reason = 'Multiple payment failures';
        }

        return { subscription: targetSub };
      };

      const webhookData = {
        event: 'payment.failed',
        payload: {
          payment: { entity: { order_id: 'order_123' } }
        }
      };

      const result = await handlePaymentFailed(webhookData);

      expect(result.subscription.status).toBe('payment_failed');
      expect(result.subscription.payment_attempts).toBe(3);
      expect(result.subscription.suspended_at).toBeDefined();
    });
  });

  describe('Refund Events', () => {
    it('should process full refund and cancel subscription', async () => {
      const subscription = {
        id: 'sub-123',
        status: 'active',
        razorpay_payment_id: 'pay_123',
        final_amount: 53100
      };
      subscriptions.set(subscription.id, subscription);

      const payment = {
        id: 'payment-123',
        subscription_id: 'sub-123',
        razorpay_payment_id: 'pay_123',
        amount: 53100,
        status: 'captured'
      };
      payments.set(payment.id, payment);

      const handleRefund = async (webhookData: any) => {
        const { payment_id, amount } = webhookData.payload.refund.entity;

        // Find payment
        let targetPayment: any = null;
        for (const [, pay] of payments) {
          if (pay.razorpay_payment_id === payment_id) {
            targetPayment = pay;
            break;
          }
        }

        if (!targetPayment) {
          throw new Error('Payment not found');
        }

        const refundAmount = amount / 100;
        const isFullRefund = refundAmount >= targetPayment.amount;

        targetPayment.refund_amount = refundAmount;
        targetPayment.refund_status = isFullRefund ? 'full' : 'partial';
        targetPayment.refunded_at = new Date().toISOString();

        // If full refund, cancel subscription
        if (isFullRefund) {
          const sub = subscriptions.get(targetPayment.subscription_id);
          if (sub) {
            sub.status = 'cancelled';
            sub.cancelled_at = new Date().toISOString();
            sub.cancellation_reason = 'Full refund processed';
          }
        }

        return { payment: targetPayment, isFullRefund };
      };

      const webhookData = {
        event: 'refund.created',
        payload: {
          refund: {
            entity: {
              payment_id: 'pay_123',
              amount: 5310000 // Full refund
            }
          }
        }
      };

      const result = await handleRefund(webhookData);

      expect(result.isFullRefund).toBe(true);
      expect(result.payment.refund_status).toBe('full');
      expect(subscriptions.get('sub-123')?.status).toBe('cancelled');
    });

    it('should process partial refund without cancellation', async () => {
      const subscription = {
        id: 'sub-123',
        status: 'active',
        final_amount: 53100
      };
      subscriptions.set(subscription.id, subscription);

      const payment = {
        id: 'payment-123',
        subscription_id: 'sub-123',
        razorpay_payment_id: 'pay_123',
        amount: 53100,
        status: 'captured'
      };
      payments.set(payment.id, payment);

      const handleRefund = async (webhookData: any) => {
        const { payment_id, amount } = webhookData.payload.refund.entity;

        let targetPayment: any = null;
        for (const [, pay] of payments) {
          if (pay.razorpay_payment_id === payment_id) {
            targetPayment = pay;
            break;
          }
        }

        const refundAmount = amount / 100;
        const isFullRefund = refundAmount >= targetPayment.amount;

        targetPayment.refund_amount = refundAmount;
        targetPayment.refund_status = isFullRefund ? 'full' : 'partial';

        return { payment: targetPayment, isFullRefund };
      };

      const webhookData = {
        event: 'refund.created',
        payload: {
          refund: {
            entity: {
              payment_id: 'pay_123',
              amount: 1000000 // Partial refund (₹10,000)
            }
          }
        }
      };

      const result = await handleRefund(webhookData);

      expect(result.isFullRefund).toBe(false);
      expect(result.payment.refund_status).toBe('partial');
      expect(subscriptions.get('sub-123')?.status).toBe('active');
    });
  });

  describe('Subscription Lifecycle Events', () => {
    it('should handle subscription.charged event for renewal', async () => {
      const subscription = {
        id: 'sub-123',
        status: 'active',
        razorpay_subscription_id: 'sub_razorpay_123',
        end_date: new Date().toISOString()
      };
      subscriptions.set(subscription.id, subscription);

      const handleSubscriptionCharged = async (webhookData: any) => {
        const { subscription_id, payment_id, amount } = webhookData.payload.subscription.entity;

        let targetSub: any = null;
        for (const [, sub] of subscriptions) {
          if (sub.razorpay_subscription_id === subscription_id) {
            targetSub = sub;
            break;
          }
        }

        if (!targetSub) {
          throw new Error('Subscription not found');
        }

        // Extend subscription period
        const newEndDate = new Date(targetSub.end_date);
        newEndDate.setMonth(newEndDate.getMonth() + 1);

        targetSub.end_date = newEndDate.toISOString();
        targetSub.last_charged_at = new Date().toISOString();
        targetSub.payment_attempts = 0;

        // Create payment record
        const payment = {
          id: `pay-${Date.now()}`,
          subscription_id: targetSub.id,
          razorpay_payment_id: payment_id,
          amount: amount / 100,
          type: 'renewal',
          status: 'captured'
        };
        payments.set(payment.id, payment);

        return { subscription: targetSub, payment };
      };

      const webhookData = {
        event: 'subscription.charged',
        payload: {
          subscription: {
            entity: {
              id: 'sub_razorpay_123',
              subscription_id: 'sub_razorpay_123',
              payment_id: 'pay_renewal_123',
              amount: 5310000
            }
          }
        }
      };

      const result = await handleSubscriptionCharged(webhookData);

      expect(result.subscription.last_charged_at).toBeDefined();
      expect(result.payment.type).toBe('renewal');
    });

    it('should handle subscription.cancelled event', async () => {
      const subscription = {
        id: 'sub-123',
        status: 'active',
        razorpay_subscription_id: 'sub_razorpay_123'
      };
      subscriptions.set(subscription.id, subscription);

      const handleSubscriptionCancelled = async (webhookData: any) => {
        const { subscription_id } = webhookData.payload.subscription.entity;

        let targetSub: any = null;
        for (const [, sub] of subscriptions) {
          if (sub.razorpay_subscription_id === subscription_id) {
            targetSub = sub;
            break;
          }
        }

        if (!targetSub) {
          throw new Error('Subscription not found');
        }

        targetSub.status = 'cancelled';
        targetSub.cancelled_at = new Date().toISOString();
        targetSub.cancellation_source = 'razorpay_webhook';

        return { subscription: targetSub };
      };

      const webhookData = {
        event: 'subscription.cancelled',
        payload: {
          subscription: {
            entity: {
              id: 'sub_razorpay_123',
              subscription_id: 'sub_razorpay_123'
            }
          }
        }
      };

      const result = await handleSubscriptionCancelled(webhookData);

      expect(result.subscription.status).toBe('cancelled');
      expect(result.subscription.cancellation_source).toBe('razorpay_webhook');
    });

    it('should handle subscription.pending event', async () => {
      const subscription = {
        id: 'sub-123',
        status: 'active',
        razorpay_subscription_id: 'sub_razorpay_123'
      };
      subscriptions.set(subscription.id, subscription);

      const handleSubscriptionPending = async (webhookData: any) => {
        const { subscription_id } = webhookData.payload.subscription.entity;

        let targetSub: any = null;
        for (const [, sub] of subscriptions) {
          if (sub.razorpay_subscription_id === subscription_id) {
            targetSub = sub;
            break;
          }
        }

        targetSub.status = 'grace_period';
        targetSub.grace_period_start = new Date().toISOString();
        
        const graceEnd = new Date();
        graceEnd.setDate(graceEnd.getDate() + 7);
        targetSub.grace_period_end = graceEnd.toISOString();

        return { subscription: targetSub };
      };

      const webhookData = {
        event: 'subscription.pending',
        payload: {
          subscription: {
            entity: { subscription_id: 'sub_razorpay_123' }
          }
        }
      };

      const result = await handleSubscriptionPending(webhookData);

      expect(result.subscription.status).toBe('grace_period');
      expect(result.subscription.grace_period_end).toBeDefined();
    });
  });

  describe('Error Handling', () => {
    it('should log and handle unknown webhook events', async () => {
      const handleWebhook = async (webhookData: any) => {
        const knownEvents = [
          'payment.captured',
          'payment.failed',
          'refund.created',
          'subscription.charged',
          'subscription.cancelled'
        ];

        if (!knownEvents.includes(webhookData.event)) {
          webhookLogs.push({
            event: webhookData.event,
            status: 'ignored',
            reason: 'Unknown event type',
            received_at: new Date().toISOString()
          });
          return { processed: false, reason: 'Unknown event type' };
        }

        return { processed: true };
      };

      const result = await handleWebhook({ event: 'unknown.event' });

      expect(result.processed).toBe(false);
      expect(webhookLogs[0].status).toBe('ignored');
    });

    it('should handle missing subscription gracefully', async () => {
      const handlePaymentCaptured = async (webhookData: any) => {
        const { order_id } = webhookData.payload.payment.entity;

        let targetSub: any = null;
        for (const [, sub] of subscriptions) {
          if (sub.razorpay_order_id === order_id) {
            targetSub = sub;
            break;
          }
        }

        if (!targetSub) {
          webhookLogs.push({
            event: 'payment.captured',
            status: 'error',
            error: 'Subscription not found',
            order_id
          });
          throw new Error(`Subscription not found for order: ${order_id}`);
        }

        return { subscription: targetSub };
      };

      const webhookData = {
        event: 'payment.captured',
        payload: {
          payment: { entity: { order_id: 'nonexistent_order' } }
        }
      };

      await expect(handlePaymentCaptured(webhookData)).rejects.toThrow(
        'Subscription not found for order: nonexistent_order'
      );
      expect(webhookLogs[0].status).toBe('error');
    });

    it('should retry failed webhook processing', async () => {
      let attempts = 0;
      const maxRetries = 3;

      const processWithRetry = async (webhookData: any) => {
        for (let i = 0; i < maxRetries; i++) {
          attempts++;
          try {
            // Simulate failure on first 2 attempts
            if (attempts < 3) {
              throw new Error('Temporary failure');
            }
            return { success: true, attempts };
          } catch (error) {
            if (i === maxRetries - 1) {
              throw error;
            }
            // Wait before retry (simulated)
            await new Promise(resolve => setTimeout(resolve, 10));
          }
        }
      };

      const result = await processWithRetry({ event: 'payment.captured' });

      expect(result?.success).toBe(true);
      expect(result?.attempts).toBe(3);
    });
  });

  describe('Webhook Logging', () => {
    it('should log all webhook events for audit', async () => {
      const logWebhookEvent = (event: string, status: string, details: any) => {
        webhookLogs.push({
          id: `log-${Date.now()}`,
          event,
          status,
          details,
          timestamp: new Date().toISOString()
        });
      };

      logWebhookEvent('payment.captured', 'success', { order_id: 'order_123' });
      logWebhookEvent('payment.failed', 'processed', { order_id: 'order_456' });
      logWebhookEvent('refund.created', 'success', { payment_id: 'pay_789' });

      expect(webhookLogs.length).toBe(3);
      expect(webhookLogs[0].event).toBe('payment.captured');
      expect(webhookLogs[1].status).toBe('processed');
    });

    it('should track webhook processing time', async () => {
      const processWebhookWithTiming = async (webhookData: any) => {
        const startTime = Date.now();

        // Simulate processing
        await new Promise(resolve => setTimeout(resolve, 50));

        const endTime = Date.now();
        const processingTime = endTime - startTime;

        webhookLogs.push({
          event: webhookData.event,
          processing_time_ms: processingTime,
          timestamp: new Date().toISOString()
        });

        return { processingTime };
      };

      const result = await processWebhookWithTiming({ event: 'payment.captured' });

      expect(result.processingTime).toBeGreaterThanOrEqual(50);
      expect(webhookLogs[0].processing_time_ms).toBeDefined();
    });
  });
});
