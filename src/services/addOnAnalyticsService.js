/**
 * AddOnAnalyticsService
 *
 * Service for tracking and analyzing add-on subscription analytics including:
 * - Tracking add-on events (views, purchases, cancellations, etc.)
 * - Generating revenue reports
 * - Calculating churn rates
 * - Cohort analysis for adoption patterns
 *
 * @requirement REQ-3.5 - Add-On Analytics Service
 * @requirement REQ-10 - Add-On Analytics and Reporting
 */

import { supabase } from '../lib/supabaseClient';

class AddOnAnalyticsService {
  /**
   * Track an add-on related event
   *
   * @param {string} userId - The user's UUID
   * @param {string} eventType - Type of event (view, purchase, activation, cancellation, renewal, expiry, upgrade_prompt)
   * @param {string} featureKey - The feature_key of the add-on
   * @param {Object} metadata - Additional event metadata
   * @returns {Promise<{success: boolean, data?: Object, error?: string}>}
   * @requirement REQ-10.1 - Track add-on events
   */
  async trackEvent(userId, eventType, featureKey, metadata = {}) {
    try {
      const validEventTypes = [
        'view',
        'purchase',
        'activation',
        'cancellation',
        'renewal',
        'expiry',
        'upgrade_prompt',
        'bundle_view',
        'bundle_purchase',
        'discount_applied',
        'payment_failed',
        'grace_period_started',
        'grace_period_ended',
      ];

      if (!validEventTypes.includes(eventType)) {
        return {
          success: false,
          error: `Invalid event type. Must be one of: ${validEventTypes.join(', ')}`,
        };
      }

      const eventData = {
        user_id: userId || null,
        event_type: eventType,
        feature_key: featureKey || null,
        metadata: {
          ...metadata,
          timestamp: new Date().toISOString(),
          user_agent: typeof window !== 'undefined' ? window.navigator?.userAgent : null,
        },
      };

      // Add bundle_id if provided in metadata
      if (metadata.bundleId) {
        eventData.bundle_id = metadata.bundleId;
      }

      const { data, error } = await supabase
        .from('addon_events')
        .insert(eventData)
        .select()
        .single();

      if (error) {
        console.error('Error tracking event:', error);
        return { success: false, error: error.message };
      }

      return { success: true, data };
    } catch (error) {
      console.error('Error in trackEvent:', error);
      return { success: false, error: error.message };
    }
  }

  /**
   * Get add-on revenue report
   *
   * @param {Object} options - Report options
   * @param {Date|string} options.startDate - Start date for the report
   * @param {Date|string} options.endDate - End date for the report
   * @param {string} options.groupBy - Group by 'day', 'week', 'month', or 'feature'
   * @returns {Promise<{success: boolean, data?: Object, error?: string}>}
   * @requirement REQ-10.2 - Revenue reports by category and time period
   */
  async getAddOnRevenue(options = {}) {
    try {
      const {
        startDate = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000), // Default: last 30 days
        endDate = new Date(),
        groupBy = 'day',
      } = options;

      const start = new Date(startDate).toISOString();
      const end = new Date(endDate).toISOString();

      // Get all purchase events in the date range
      const { data: purchaseEvents, error: eventsError } = await supabase
        .from('addon_events')
        .select('*')
        .eq('event_type', 'purchase')
        .gte('created_at', start)
        .lte('created_at', end)
        .order('created_at', { ascending: true });

      if (eventsError) {
        console.error('Error fetching purchase events:', eventsError);
        return { success: false, error: eventsError.message };
      }

      // Get entitlements created in the date range for price data
      const { data: entitlements, error: entError } = await supabase
        .from('user_entitlements')
        .select('feature_key, price_at_purchase, billing_period, created_at, bundle_id')
        .gte('created_at', start)
        .lte('created_at', end);

      if (entError) {
        console.error('Error fetching entitlements:', entError);
        return { success: false, error: entError.message };
      }

      // Calculate revenue based on grouping
      const revenueData = this.calculateRevenueByGroup(entitlements || [], groupBy);

      // Calculate totals
      const totalRevenue = (entitlements || []).reduce((sum, ent) => {
        return sum + (parseFloat(ent.price_at_purchase) || 0);
      }, 0);

      const monthlyRevenue = (entitlements || [])
        .filter((ent) => ent.billing_period === 'monthly')
        .reduce((sum, ent) => sum + (parseFloat(ent.price_at_purchase) || 0), 0);

      const annualRevenue = (entitlements || [])
        .filter((ent) => ent.billing_period === 'annual')
        .reduce((sum, ent) => sum + (parseFloat(ent.price_at_purchase) || 0), 0);

      // Revenue by feature
      const revenueByFeature = {};
      (entitlements || []).forEach((ent) => {
        const key = ent.feature_key || 'unknown';
        if (!revenueByFeature[key]) {
          revenueByFeature[key] = { count: 0, revenue: 0 };
        }
        revenueByFeature[key].count++;
        revenueByFeature[key].revenue += parseFloat(ent.price_at_purchase) || 0;
      });

      return {
        success: true,
        data: {
          period: { startDate: start, endDate: end },
          totalRevenue: Math.round(totalRevenue * 100) / 100,
          monthlyRevenue: Math.round(monthlyRevenue * 100) / 100,
          annualRevenue: Math.round(annualRevenue * 100) / 100,
          totalTransactions: entitlements?.length || 0,
          revenueByPeriod: revenueData,
          revenueByFeature,
          bundleRevenue: (entitlements || [])
            .filter((ent) => ent.bundle_id)
            .reduce((sum, ent) => sum + (parseFloat(ent.price_at_purchase) || 0), 0),
        },
      };
    } catch (error) {
      console.error('Error in getAddOnRevenue:', error);
      return { success: false, error: error.message };
    }
  }

  /**
   * Helper to calculate revenue grouped by time period
   * @private
   */
  calculateRevenueByGroup(entitlements, groupBy) {
    const grouped = {};

    entitlements.forEach((ent) => {
      const date = new Date(ent.created_at);
      let key;

      switch (groupBy) {
        case 'day':
          key = date.toISOString().split('T')[0];
          break;
        case 'week': {
          const weekStart = new Date(date);
          weekStart.setDate(date.getDate() - date.getDay());
          key = weekStart.toISOString().split('T')[0];
          break;
        }
        case 'month':
          key = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
          break;
        case 'feature':
          key = ent.feature_key || 'unknown';
          break;
        default:
          key = date.toISOString().split('T')[0];
      }

      if (!grouped[key]) {
        grouped[key] = { count: 0, revenue: 0 };
      }
      grouped[key].count++;
      grouped[key].revenue += parseFloat(ent.price_at_purchase) || 0;
    });

    // Round revenue values
    Object.keys(grouped).forEach((key) => {
      grouped[key].revenue = Math.round(grouped[key].revenue * 100) / 100;
    });

    return grouped;
  }

  /**
   * Calculate churn rate for a specific add-on
   * Churn rate = (Cancellations in period / Active at start of period) * 100
   *
   * @param {string} featureKey - The feature_key to analyze
   * @param {Object} options - Analysis options
   * @param {Date|string} options.startDate - Start date
   * @param {Date|string} options.endDate - End date
   * @returns {Promise<{success: boolean, data?: Object, error?: string}>}
   * @requirement REQ-10.4 - Identify add-ons with high churn rates
   */
  async getChurnRate(featureKey, options = {}) {
    try {
      const { startDate = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000), endDate = new Date() } =
        options;

      const start = new Date(startDate).toISOString();
      const end = new Date(endDate).toISOString();

      // Build query for entitlements
      let query = supabase
        .from('user_entitlements')
        .select('id, status, created_at, cancelled_at, feature_key');

      if (featureKey) {
        query = query.eq('feature_key', featureKey);
      }

      const { data: entitlements, error } = await query;

      if (error) {
        console.error('Error fetching entitlements for churn:', error);
        return { success: false, error: error.message };
      }

      // Count active at start of period
      const activeAtStart = (entitlements || []).filter((ent) => {
        const createdAt = new Date(ent.created_at);
        return (
          createdAt < new Date(start) &&
          (ent.status === 'active' ||
            ent.status === 'grace_period' ||
            (ent.cancelled_at && new Date(ent.cancelled_at) > new Date(start)))
        );
      }).length;

      // Count cancellations during period
      const cancellations = (entitlements || []).filter((ent) => {
        if (!ent.cancelled_at) return false;
        const cancelledAt = new Date(ent.cancelled_at);
        return cancelledAt >= new Date(start) && cancelledAt <= new Date(end);
      }).length;

      // Count new activations during period
      const newActivations = (entitlements || []).filter((ent) => {
        const createdAt = new Date(ent.created_at);
        return createdAt >= new Date(start) && createdAt <= new Date(end);
      }).length;

      // Count currently active
      const currentlyActive = (entitlements || []).filter(
        (ent) => ent.status === 'active' || ent.status === 'grace_period'
      ).length;

      // Calculate churn rate
      const churnRate =
        activeAtStart > 0 ? Math.round((cancellations / activeAtStart) * 10000) / 100 : 0;

      // Calculate net growth
      const netGrowth = newActivations - cancellations;

      return {
        success: true,
        data: {
          featureKey: featureKey || 'all',
          period: { startDate: start, endDate: end },
          activeAtStart,
          cancellations,
          newActivations,
          currentlyActive,
          churnRate,
          netGrowth,
          retentionRate: 100 - churnRate,
        },
      };
    } catch (error) {
      console.error('Error in getChurnRate:', error);
      return { success: false, error: error.message };
    }
  }

  /**
   * Get cohort analysis for add-on adoption
   * Groups users by their first add-on purchase date and tracks retention
   *
   * @param {Date|string} cohortDate - The cohort start date (month)
   * @param {Object} options - Analysis options
   * @param {number} options.monthsToTrack - Number of months to track (default: 6)
   * @returns {Promise<{success: boolean, data?: Object, error?: string}>}
   * @requirement REQ-10.5 - Cohort analysis for adoption patterns
   */
  async getCohortAnalysis(cohortDate, options = {}) {
    try {
      const { monthsToTrack = 6 } = options;

      const cohortStart = new Date(cohortDate);
      cohortStart.setDate(1); // Start of month
      cohortStart.setHours(0, 0, 0, 0);

      const cohortEnd = new Date(cohortStart);
      cohortEnd.setMonth(cohortEnd.getMonth() + 1);

      // Get users who made their first add-on purchase in the cohort month
      const { data: cohortEntitlements, error: cohortError } = await supabase
        .from('user_entitlements')
        .select('user_id, created_at')
        .gte('created_at', cohortStart.toISOString())
        .lt('created_at', cohortEnd.toISOString())
        .order('created_at', { ascending: true });

      if (cohortError) {
        console.error('Error fetching cohort data:', cohortError);
        return { success: false, error: cohortError.message };
      }

      // Get unique users in cohort (first purchase only)
      const userFirstPurchase = new Map();
      (cohortEntitlements || []).forEach((ent) => {
        if (!userFirstPurchase.has(ent.user_id)) {
          userFirstPurchase.set(ent.user_id, ent.created_at);
        }
      });

      const cohortUsers = Array.from(userFirstPurchase.keys());
      const cohortSize = cohortUsers.length;

      if (cohortSize === 0) {
        return {
          success: true,
          data: {
            cohortMonth: cohortStart.toISOString().slice(0, 7),
            cohortSize: 0,
            retention: [],
            message: 'No users in this cohort',
          },
        };
      }

      // Track retention for each subsequent month
      const retention = [];

      for (let month = 0; month <= monthsToTrack; month++) {
        const monthStart = new Date(cohortStart);
        monthStart.setMonth(monthStart.getMonth() + month);

        const monthEnd = new Date(monthStart);
        monthEnd.setMonth(monthEnd.getMonth() + 1);

        // Count users with active entitlements in this month
        const { data: activeInMonth, error: activeError } = await supabase
          .from('user_entitlements')
          .select('user_id')
          .in('user_id', cohortUsers)
          .or(`status.eq.active,status.eq.grace_period`)
          .gte('end_date', monthStart.toISOString());

        if (activeError) {
          console.error('Error fetching active users:', activeError);
          continue;
        }

        const uniqueActiveUsers = new Set((activeInMonth || []).map((e) => e.user_id));
        const retainedCount = uniqueActiveUsers.size;
        const retentionRate = Math.round((retainedCount / cohortSize) * 10000) / 100;

        retention.push({
          month,
          monthLabel: monthStart.toISOString().slice(0, 7),
          retainedUsers: retainedCount,
          retentionRate,
          churnedUsers: cohortSize - retainedCount,
        });
      }

      return {
        success: true,
        data: {
          cohortMonth: cohortStart.toISOString().slice(0, 7),
          cohortSize,
          retention,
          averageRetention:
            retention.length > 0
              ? Math.round(
                  (retention.reduce((sum, r) => sum + r.retentionRate, 0) / retention.length) * 100
                ) / 100
              : 0,
        },
      };
    } catch (error) {
      console.error('Error in getCohortAnalysis:', error);
      return { success: false, error: error.message };
    }
  }

  /**
   * Get feature usage statistics for users with active add-ons
   *
   * @param {string} featureKey - The feature_key to analyze
   * @param {Object} options - Analysis options
   * @returns {Promise<{success: boolean, data?: Object, error?: string}>}
   * @requirement REQ-10.3 - Track feature usage for users with active add-ons
   */
  async getFeatureUsage(featureKey, options = {}) {
    try {
      const { startDate = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000), endDate = new Date() } =
        options;

      const start = new Date(startDate).toISOString();
      const end = new Date(endDate).toISOString();

      // Get view events for this feature
      let query = supabase
        .from('addon_events')
        .select('*')
        .gte('created_at', start)
        .lte('created_at', end);

      if (featureKey) {
        query = query.eq('feature_key', featureKey);
      }

      const { data: events, error } = await query;

      if (error) {
        console.error('Error fetching feature usage:', error);
        return { success: false, error: error.message };
      }

      // Group events by type
      const eventsByType = {};
      (events || []).forEach((event) => {
        if (!eventsByType[event.event_type]) {
          eventsByType[event.event_type] = 0;
        }
        eventsByType[event.event_type]++;
      });

      // Get unique users
      const uniqueUsers = new Set((events || []).map((e) => e.user_id).filter(Boolean));

      // Calculate conversion rate (views to purchases)
      const views = eventsByType['view'] || 0;
      const purchases = eventsByType['purchase'] || 0;
      const conversionRate = views > 0 ? Math.round((purchases / views) * 10000) / 100 : 0;

      return {
        success: true,
        data: {
          featureKey: featureKey || 'all',
          period: { startDate: start, endDate: end },
          totalEvents: events?.length || 0,
          uniqueUsers: uniqueUsers.size,
          eventsByType,
          conversionRate,
          upgradePromptShown: eventsByType['upgrade_prompt'] || 0,
          upgradePromptConversion:
            eventsByType['upgrade_prompt'] > 0
              ? Math.round((purchases / eventsByType['upgrade_prompt']) * 10000) / 100
              : 0,
        },
      };
    } catch (error) {
      console.error('Error in getFeatureUsage:', error);
      return { success: false, error: error.message };
    }
  }

  /**
   * Get add-on adoption metrics
   *
   * @returns {Promise<{success: boolean, data?: Object, error?: string}>}
   */
  async getAdoptionMetrics() {
    try {
      // Get all active entitlements
      const { data: entitlements, error: entError } = await supabase
        .from('user_entitlements')
        .select('feature_key, billing_period, bundle_id, status')
        .in('status', ['active', 'grace_period']);

      if (entError) {
        console.error('Error fetching entitlements:', entError);
        return { success: false, error: entError.message };
      }

      // Get all add-ons for comparison
      const { data: addOns, error: addOnsError } = await supabase
        .from('subscription_plan_features')
        .select('feature_key, feature_name')
        .eq('is_addon', true);

      if (addOnsError) {
        console.error('Error fetching add-ons:', addOnsError);
        return { success: false, error: addOnsError.message };
      }

      // Calculate adoption by feature
      const adoptionByFeature = {};
      (addOns || []).forEach((addOn) => {
        adoptionByFeature[addOn.feature_key] = {
          name: addOn.feature_name,
          activeSubscribers: 0,
          monthlySubscribers: 0,
          annualSubscribers: 0,
          bundleSubscribers: 0,
        };
      });

      (entitlements || []).forEach((ent) => {
        if (adoptionByFeature[ent.feature_key]) {
          adoptionByFeature[ent.feature_key].activeSubscribers++;
          if (ent.billing_period === 'monthly') {
            adoptionByFeature[ent.feature_key].monthlySubscribers++;
          } else {
            adoptionByFeature[ent.feature_key].annualSubscribers++;
          }
          if (ent.bundle_id) {
            adoptionByFeature[ent.feature_key].bundleSubscribers++;
          }
        }
      });

      // Calculate totals
      const totalActiveEntitlements = entitlements?.length || 0;
      const bundleEntitlements = (entitlements || []).filter((e) => e.bundle_id).length;
      const individualEntitlements = totalActiveEntitlements - bundleEntitlements;

      return {
        success: true,
        data: {
          totalActiveEntitlements,
          bundleEntitlements,
          individualEntitlements,
          bundleVsIndividualRatio:
            totalActiveEntitlements > 0
              ? Math.round((bundleEntitlements / totalActiveEntitlements) * 10000) / 100
              : 0,
          adoptionByFeature,
          topAddOns: Object.entries(adoptionByFeature)
            .sort((a, b) => b[1].activeSubscribers - a[1].activeSubscribers)
            .slice(0, 5)
            .map(([key, value]) => ({ featureKey: key, ...value })),
        },
      };
    } catch (error) {
      console.error('Error in getAdoptionMetrics:', error);
      return { success: false, error: error.message };
    }
  }
}

// Export singleton instance
const addOnAnalyticsService = new AddOnAnalyticsService();
export default addOnAnalyticsService;

// Also export the class for testing purposes
export { AddOnAnalyticsService };
