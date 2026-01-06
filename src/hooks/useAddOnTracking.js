/**
 * useAddOnTracking Hook
 * 
 * Provides event tracking functionality for add-on subscription system.
 * Tracks views, upgrade prompts, purchase funnel, and cancellation reasons.
 * 
 * @requirement Task 9.2 - Event tracking integration
 */

import { useCallback, useRef } from 'react';
import { useAuth } from '../context/AuthContext';
import addOnAnalyticsService from '../services/addOnAnalyticsService';

/**
 * Hook for tracking add-on related events
 * @returns {Object} Tracking functions
 */
export const useAddOnTracking = () => {
  const { user } = useAuth();
  const trackedViews = useRef(new Set());
  const sessionId = useRef(`session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`);

  /**
   * Track add-on view event
   * @param {string} featureKey - The feature key being viewed
   * @param {Object} metadata - Additional metadata
   */
  const trackAddOnView = useCallback(async (featureKey, metadata = {}) => {
    // Prevent duplicate view tracking in same session
    const viewKey = `${featureKey}_${sessionId.current}`;
    if (trackedViews.current.has(viewKey)) return;
    
    trackedViews.current.add(viewKey);
    
    await addOnAnalyticsService.trackEvent(
      user?.id,
      'view',
      featureKey,
      {
        ...metadata,
        sessionId: sessionId.current,
        source: metadata.source || 'marketplace'
      }
    );
  }, [user?.id]);

  /**
   * Track bundle view event
   * @param {string} bundleId - The bundle ID being viewed
   * @param {Object} metadata - Additional metadata
   */
  const trackBundleView = useCallback(async (bundleId, metadata = {}) => {
    const viewKey = `bundle_${bundleId}_${sessionId.current}`;
    if (trackedViews.current.has(viewKey)) return;
    
    trackedViews.current.add(viewKey);
    
    await addOnAnalyticsService.trackEvent(
      user?.id,
      'bundle_view',
      null,
      {
        ...metadata,
        bundleId,
        sessionId: sessionId.current
      }
    );
  }, [user?.id]);

  /**
   * Track upgrade prompt display
   * @param {string} featureKey - The feature that triggered the prompt
   * @param {Object} metadata - Additional metadata
   */
  const trackUpgradePrompt = useCallback(async (featureKey, metadata = {}) => {
    await addOnAnalyticsService.trackEvent(
      user?.id,
      'upgrade_prompt',
      featureKey,
      {
        ...metadata,
        sessionId: sessionId.current,
        promptType: metadata.promptType || 'modal',
        triggerLocation: metadata.triggerLocation || 'feature_gate'
      }
    );
  }, [user?.id]);

  /**
   * Track purchase funnel events
   * @param {string} step - Funnel step (cart_add, checkout_start, payment_init, payment_complete)
   * @param {string} featureKey - The feature key
   * @param {Object} metadata - Additional metadata
   */
  const trackPurchaseFunnel = useCallback(async (step, featureKey, metadata = {}) => {
    const eventTypeMap = {
      cart_add: 'view',
      checkout_start: 'view',
      payment_init: 'view',
      payment_complete: 'purchase',
      payment_failed: 'payment_failed'
    };

    await addOnAnalyticsService.trackEvent(
      user?.id,
      eventTypeMap[step] || 'view',
      featureKey,
      {
        ...metadata,
        funnelStep: step,
        sessionId: sessionId.current,
        timestamp: new Date().toISOString()
      }
    );
  }, [user?.id]);

  /**
   * Track add-on purchase
   * @param {string} featureKey - The purchased feature
   * @param {Object} purchaseDetails - Purchase details
   */
  const trackPurchase = useCallback(async (featureKey, purchaseDetails = {}) => {
    await addOnAnalyticsService.trackEvent(
      user?.id,
      'purchase',
      featureKey,
      {
        ...purchaseDetails,
        sessionId: sessionId.current,
        billingPeriod: purchaseDetails.billingPeriod,
        amount: purchaseDetails.amount,
        discountApplied: purchaseDetails.discountCode ? true : false,
        discountCode: purchaseDetails.discountCode,
        bundleId: purchaseDetails.bundleId
      }
    );
  }, [user?.id]);

  /**
   * Track bundle purchase
   * @param {string} bundleId - The purchased bundle
   * @param {Object} purchaseDetails - Purchase details
   */
  const trackBundlePurchase = useCallback(async (bundleId, purchaseDetails = {}) => {
    await addOnAnalyticsService.trackEvent(
      user?.id,
      'bundle_purchase',
      null,
      {
        ...purchaseDetails,
        bundleId,
        sessionId: sessionId.current,
        billingPeriod: purchaseDetails.billingPeriod,
        amount: purchaseDetails.amount,
        featuresIncluded: purchaseDetails.features
      }
    );
  }, [user?.id]);

  /**
   * Track add-on activation
   * @param {string} featureKey - The activated feature
   * @param {Object} metadata - Additional metadata
   */
  const trackActivation = useCallback(async (featureKey, metadata = {}) => {
    await addOnAnalyticsService.trackEvent(
      user?.id,
      'activation',
      featureKey,
      {
        ...metadata,
        sessionId: sessionId.current,
        activationType: metadata.bundleId ? 'bundle' : 'individual'
      }
    );
  }, [user?.id]);

  /**
   * Track cancellation with reason
   * @param {string} featureKey - The cancelled feature
   * @param {string} reason - Cancellation reason
   * @param {Object} metadata - Additional metadata
   */
  const trackCancellation = useCallback(async (featureKey, reason, metadata = {}) => {
    await addOnAnalyticsService.trackEvent(
      user?.id,
      'cancellation',
      featureKey,
      {
        ...metadata,
        sessionId: sessionId.current,
        cancellationReason: reason,
        daysActive: metadata.daysActive,
        willExpireAt: metadata.endDate
      }
    );
  }, [user?.id]);

  /**
   * Track discount code application
   * @param {string} code - The discount code
   * @param {boolean} success - Whether application was successful
   * @param {Object} metadata - Additional metadata
   */
  const trackDiscountApplied = useCallback(async (code, success, metadata = {}) => {
    await addOnAnalyticsService.trackEvent(
      user?.id,
      'discount_applied',
      null,
      {
        ...metadata,
        sessionId: sessionId.current,
        discountCode: code,
        success,
        discountAmount: metadata.discountAmount,
        errorReason: metadata.errorReason
      }
    );
  }, [user?.id]);

  /**
   * Track renewal event
   * @param {string} featureKey - The renewed feature
   * @param {Object} metadata - Additional metadata
   */
  const trackRenewal = useCallback(async (featureKey, metadata = {}) => {
    await addOnAnalyticsService.trackEvent(
      user?.id,
      'renewal',
      featureKey,
      {
        ...metadata,
        sessionId: sessionId.current,
        renewalType: metadata.autoRenew ? 'automatic' : 'manual',
        newEndDate: metadata.newEndDate
      }
    );
  }, [user?.id]);

  /**
   * Track grace period events
   * @param {string} type - 'started' or 'ended'
   * @param {string} featureKey - The feature key
   * @param {Object} metadata - Additional metadata
   */
  const trackGracePeriod = useCallback(async (type, featureKey, metadata = {}) => {
    const eventType = type === 'started' ? 'grace_period_started' : 'grace_period_ended';
    
    await addOnAnalyticsService.trackEvent(
      user?.id,
      eventType,
      featureKey,
      {
        ...metadata,
        sessionId: sessionId.current,
        gracePeriodDays: 7,
        outcome: metadata.outcome // 'renewed', 'expired', 'cancelled'
      }
    );
  }, [user?.id]);

  return {
    trackAddOnView,
    trackBundleView,
    trackUpgradePrompt,
    trackPurchaseFunnel,
    trackPurchase,
    trackBundlePurchase,
    trackActivation,
    trackCancellation,
    trackDiscountApplied,
    trackRenewal,
    trackGracePeriod
  };
};

export default useAddOnTracking;
