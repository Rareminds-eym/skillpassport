/**
 * MigrationService
 *
 * Service for managing user migrations from legacy subscription plans to the new
 * add-on based system including:
 * - Mapping plan features to equivalent add-ons
 * - Migrating users with optional price protection
 * - Calculating price protection eligibility
 * - Scheduling migration notifications
 *
 * @requirement REQ-3.4 - Migration Service
 */

import { supabase } from '../lib/supabaseClient';

class MigrationService {
  /**
   * Get migration mapping for a plan code
   * Maps plan features to equivalent add-ons for migration
   *
   * @param {string} planCode - The plan code to get mapping for
   * @returns {Promise<{success: boolean, data?: {planCode: string, features: Array}, error?: string}>}
   */
  async getMigrationMapping(planCode) {
    try {
      if (!planCode) {
        return { success: false, error: 'Plan code is required' };
      }

      // Get the plan by code
      const { data: plan, error: planError } = await supabase
        .from('subscription_plans')
        .select('id, code, name')
        .eq('code', planCode)
        .single();

      if (planError) {
        if (planError.code === 'PGRST116') {
          return { success: false, error: 'PLAN_NOT_FOUND' };
        }
        console.error('Error fetching plan:', planError);
        return { success: false, error: planError.message };
      }

      // Get all features included in this plan that have add-on equivalents
      const { data: planFeatures, error: featuresError } = await supabase
        .from('subscription_plan_features')
        .select(
          'feature_key, feature_name, is_included, is_addon, addon_price_monthly, addon_price_annual'
        )
        .eq('plan_id', plan.id)
        .eq('is_included', true);

      if (featuresError) {
        console.error('Error fetching plan features:', featuresError);
        return { success: false, error: featuresError.message };
      }

      // Get all available add-ons to map features
      const { data: addOns, error: addOnsError } = await supabase
        .from('subscription_plan_features')
        .select('feature_key, feature_name, addon_price_monthly, addon_price_annual')
        .eq('is_addon', true);

      if (addOnsError) {
        console.error('Error fetching add-ons:', addOnsError);
        return { success: false, error: addOnsError.message };
      }

      // Create a map of add-on feature keys for quick lookup
      const addOnMap = new Map(addOns.map((a) => [a.feature_key, a]));

      // Map plan features to add-ons
      const mappedFeatures = (planFeatures || [])
        .filter((pf) => addOnMap.has(pf.feature_key))
        .map((pf) => {
          const addOn = addOnMap.get(pf.feature_key);
          return {
            feature_key: pf.feature_key,
            feature_name: pf.feature_name,
            addon_price_monthly: addOn.addon_price_monthly,
            addon_price_annual: addOn.addon_price_annual,
          };
        });

      return {
        success: true,
        data: {
          planCode,
          planName: plan.name,
          planId: plan.id,
          features: mappedFeatures,
        },
      };
    } catch (error) {
      console.error('Error in getMigrationMapping:', error);
      return { success: false, error: error.message };
    }
  }

  /**
   * Migrate a user from legacy plan to add-on based system
   * Creates migration record and transfers entitlements
   *
   * @param {string} userId - The user's UUID
   * @param {boolean} preservePricing - Whether to preserve original pricing (grandfathering)
   * @returns {Promise<{success: boolean, data?: Object, error?: string}>}
   */
  async migrateUser(userId, preservePricing = false) {
    try {
      if (!userId) {
        return { success: false, error: 'User ID is required' };
      }

      // Get user's current active subscription
      const { data: subscription, error: subError } = await supabase
        .from('subscriptions')
        .select('id, plan_id, status, current_period_end')
        .eq('user_id', userId)
        .eq('status', 'active')
        .single();

      if (subError) {
        if (subError.code === 'PGRST116') {
          return { success: false, error: 'NO_ACTIVE_SUBSCRIPTION' };
        }
        console.error('Error fetching subscription:', subError);
        return { success: false, error: subError.message };
      }

      // Get the plan details
      const { data: plan, error: planError } = await supabase
        .from('subscription_plans')
        .select('id, code, name, price_monthly, price_annual')
        .eq('id', subscription.plan_id)
        .single();

      if (planError || !plan) {
        return { success: false, error: 'PLAN_NOT_FOUND' };
      }

      // Get migration mapping for this plan
      const mappingResult = await this.getMigrationMapping(plan.code);
      if (!mappingResult.success) {
        return mappingResult;
      }

      const { features } = mappingResult.data;

      // Calculate original and new prices
      const originalPrice = plan.price_monthly || 0;
      const newPrice = features.reduce((sum, f) => sum + (f.addon_price_monthly || 0), 0);

      // Calculate price protection if preserving pricing
      let priceProtectedUntil = null;
      if (preservePricing && originalPrice < newPrice) {
        const priceProtection = await this.calculatePriceProtection(userId);
        if (priceProtection.success && priceProtection.data.eligible) {
          priceProtectedUntil = priceProtection.data.protectedUntil;
        }
      }

      // Create migration record
      const { data: migration, error: migrationError } = await supabase
        .from('subscription_migrations')
        .insert({
          user_id: userId,
          old_plan_code: plan.code,
          old_subscription_id: subscription.id,
          migrated_feature_keys: features.map((f) => f.feature_key),
          original_price: originalPrice,
          new_price: newPrice,
          price_protected_until: priceProtectedUntil,
          migration_date: new Date().toISOString(),
          migration_status: 'pending',
        })
        .select()
        .single();

      if (migrationError) {
        console.error('Error creating migration record:', migrationError);
        return { success: false, error: migrationError.message };
      }

      // Create entitlements for each migrated feature
      const entitlements = features.map((feature) => ({
        user_id: userId,
        feature_key: feature.feature_key,
        status: 'active',
        billing_period: 'monthly',
        start_date: new Date().toISOString(),
        end_date:
          subscription.current_period_end ||
          new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
        auto_renew: true,
        price_at_purchase:
          preservePricing && priceProtectedUntil
            ? originalPrice / features.length
            : feature.addon_price_monthly,
      }));

      const { data: createdEntitlements, error: entError } = await supabase
        .from('user_entitlements')
        .insert(entitlements)
        .select();

      if (entError) {
        // Rollback migration record on failure
        await supabase
          .from('subscription_migrations')
          .update({ migration_status: 'failed' })
          .eq('id', migration.id);

        console.error('Error creating entitlements:', entError);
        return { success: false, error: entError.message };
      }

      // Update migration status to completed
      await supabase
        .from('subscription_migrations')
        .update({ migration_status: 'completed' })
        .eq('id', migration.id);

      return {
        success: true,
        data: {
          migration,
          entitlements: createdEntitlements,
          priceProtected: !!priceProtectedUntil,
        },
      };
    } catch (error) {
      console.error('Error in migrateUser:', error);
      return { success: false, error: error.message };
    }
  }

  /**
   * Calculate price protection eligibility for a user
   * Users whose equivalent add-ons cost more than their current plan
   * are eligible for price protection for 12 months
   *
   * @param {string} userId - The user's UUID
   * @returns {Promise<{success: boolean, data?: {eligible: boolean, originalPrice: number, newPrice: number, protectedUntil: Date}, error?: string}>}
   * @requirement REQ-9.5 - Price protection for existing subscribers
   */
  async calculatePriceProtection(userId) {
    try {
      if (!userId) {
        return { success: false, error: 'User ID is required' };
      }

      // Get user's current active subscription
      const { data: subscription, error: subError } = await supabase
        .from('subscriptions')
        .select('id, plan_id, status, created_at')
        .eq('user_id', userId)
        .eq('status', 'active')
        .single();

      if (subError) {
        if (subError.code === 'PGRST116') {
          return { success: false, error: 'NO_ACTIVE_SUBSCRIPTION' };
        }
        console.error('Error fetching subscription:', subError);
        return { success: false, error: subError.message };
      }

      // Get the plan details
      const { data: plan, error: planError } = await supabase
        .from('subscription_plans')
        .select('id, code, name, price_monthly, price_annual')
        .eq('id', subscription.plan_id)
        .single();

      if (planError || !plan) {
        return { success: false, error: 'PLAN_NOT_FOUND' };
      }

      // Get migration mapping to calculate new price
      const mappingResult = await this.getMigrationMapping(plan.code);
      if (!mappingResult.success) {
        return mappingResult;
      }

      const { features } = mappingResult.data;

      // Calculate original and new prices
      const originalPrice = plan.price_monthly || 0;
      const newPrice = features.reduce((sum, f) => sum + (f.addon_price_monthly || 0), 0);

      // User is eligible for price protection if new price is higher
      const eligible = newPrice > originalPrice;

      // Price protection lasts for 12 months from migration date
      const protectedUntil = new Date();
      protectedUntil.setFullYear(protectedUntil.getFullYear() + 1);

      return {
        success: true,
        data: {
          eligible,
          originalPrice,
          newPrice,
          priceDifference: newPrice - originalPrice,
          protectedUntil: eligible ? protectedUntil.toISOString() : null,
          subscriptionStartDate: subscription.created_at,
        },
      };
    } catch (error) {
      console.error('Error in calculatePriceProtection:', error);
      return { success: false, error: error.message };
    }
  }

  /**
   * Schedule a migration notification for a user
   * Notifications are sent 30 days before migration date
   *
   * @param {string} userId - The user's UUID
   * @param {Date|string} migrationDate - The scheduled migration date
   * @returns {Promise<{success: boolean, data?: Object, error?: string}>}
   * @requirement REQ-9.4 - Migration notification 30 days before
   */
  async scheduleMigrationNotification(userId, migrationDate) {
    try {
      if (!userId) {
        return { success: false, error: 'User ID is required' };
      }

      if (!migrationDate) {
        return { success: false, error: 'Migration date is required' };
      }

      // Parse migration date
      const migration = new Date(migrationDate);
      if (isNaN(migration.getTime())) {
        return { success: false, error: 'Invalid migration date' };
      }

      // Calculate notification date (30 days before migration)
      const notificationDate = new Date(migration);
      notificationDate.setDate(notificationDate.getDate() - 30);

      // Check if notification date is in the past
      const now = new Date();
      if (notificationDate < now) {
        // If notification date has passed, send immediately
        notificationDate.setTime(now.getTime());
      }

      // Get user details for the notification
      const { data: user, error: userError } = await supabase
        .from('auth.users')
        .select('email, raw_user_meta_data')
        .eq('id', userId)
        .single();

      // Check for existing migration record
      const { data: existingMigration, error: migrationError } = await supabase
        .from('subscription_migrations')
        .select('id, migration_status, notification_sent_at')
        .eq('user_id', userId)
        .in('migration_status', ['pending', 'notified'])
        .single();

      if (existingMigration) {
        // Update existing migration record with notification schedule
        const { data: updated, error: updateError } = await supabase
          .from('subscription_migrations')
          .update({
            migration_date: migration.toISOString(),
            migration_status: 'notified',
            notification_sent_at: notificationDate.toISOString(),
          })
          .eq('id', existingMigration.id)
          .select()
          .single();

        if (updateError) {
          console.error('Error updating migration notification:', updateError);
          return { success: false, error: updateError.message };
        }

        // Track the notification event
        await this.trackMigrationEvent(userId, 'notification_scheduled', {
          migration_id: existingMigration.id,
          notification_date: notificationDate.toISOString(),
          migration_date: migration.toISOString(),
        });

        return {
          success: true,
          data: {
            migrationId: existingMigration.id,
            notificationDate: notificationDate.toISOString(),
            migrationDate: migration.toISOString(),
            status: 'notified',
            isUpdate: true,
          },
        };
      }

      // Get price protection info for the notification
      const priceProtection = await this.calculatePriceProtection(userId);

      // Create new migration record with notification
      const { data: newMigration, error: insertError } = await supabase
        .from('subscription_migrations')
        .insert({
          user_id: userId,
          old_plan_code: 'pending_migration',
          migrated_feature_keys: [],
          original_price: priceProtection.success ? priceProtection.data.originalPrice : 0,
          new_price: priceProtection.success ? priceProtection.data.newPrice : 0,
          price_protected_until:
            priceProtection.success && priceProtection.data.eligible
              ? priceProtection.data.protectedUntil
              : null,
          migration_date: migration.toISOString(),
          notification_sent_at: notificationDate.toISOString(),
          migration_status: 'notified',
        })
        .select()
        .single();

      if (insertError) {
        console.error('Error creating migration notification:', insertError);
        return { success: false, error: insertError.message };
      }

      // Track the notification event
      await this.trackMigrationEvent(userId, 'notification_scheduled', {
        migration_id: newMigration.id,
        notification_date: notificationDate.toISOString(),
        migration_date: migration.toISOString(),
      });

      return {
        success: true,
        data: {
          migrationId: newMigration.id,
          notificationDate: notificationDate.toISOString(),
          migrationDate: migration.toISOString(),
          status: 'notified',
          priceProtectionEligible: priceProtection.success && priceProtection.data.eligible,
          isUpdate: false,
        },
      };
    } catch (error) {
      console.error('Error in scheduleMigrationNotification:', error);
      return { success: false, error: error.message };
    }
  }

  /**
   * Track migration-related events for analytics
   *
   * @param {string} userId - The user's UUID
   * @param {string} eventType - Type of event
   * @param {Object} metadata - Additional event data
   * @private
   */
  async trackMigrationEvent(userId, eventType, metadata = {}) {
    try {
      await supabase.from('addon_events').insert({
        user_id: userId,
        event_type: eventType,
        metadata: {
          ...metadata,
          source: 'migration_service',
        },
      });
    } catch (error) {
      console.error('Error tracking migration event:', error);
      // Non-critical error, don't throw
    }
  }

  /**
   * Get migration status for a user
   *
   * @param {string} userId - The user's UUID
   * @returns {Promise<{success: boolean, data?: Object, error?: string}>}
   */
  async getMigrationStatus(userId) {
    try {
      if (!userId) {
        return { success: false, error: 'User ID is required' };
      }

      const { data: migration, error } = await supabase
        .from('subscription_migrations')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false })
        .limit(1)
        .single();

      if (error) {
        if (error.code === 'PGRST116') {
          return {
            success: true,
            data: {
              hasMigration: false,
              status: null,
            },
          };
        }
        console.error('Error fetching migration status:', error);
        return { success: false, error: error.message };
      }

      return {
        success: true,
        data: {
          hasMigration: true,
          migrationId: migration.id,
          status: migration.migration_status,
          migrationDate: migration.migration_date,
          notificationSentAt: migration.notification_sent_at,
          originalPrice: migration.original_price,
          newPrice: migration.new_price,
          priceProtectedUntil: migration.price_protected_until,
          migratedFeatures: migration.migrated_feature_keys,
        },
      };
    } catch (error) {
      console.error('Error in getMigrationStatus:', error);
      return { success: false, error: error.message };
    }
  }

  /**
   * Get all pending migrations for batch processing
   *
   * @param {number} limit - Maximum number of migrations to return
   * @returns {Promise<{success: boolean, data?: Array, error?: string}>}
   */
  async getPendingMigrations(limit = 100) {
    try {
      const { data, error } = await supabase
        .from('subscription_migrations')
        .select('*')
        .eq('migration_status', 'pending')
        .lte('migration_date', new Date().toISOString())
        .order('migration_date', { ascending: true })
        .limit(limit);

      if (error) {
        console.error('Error fetching pending migrations:', error);
        return { success: false, error: error.message };
      }

      return { success: true, data: data || [] };
    } catch (error) {
      console.error('Error in getPendingMigrations:', error);
      return { success: false, error: error.message };
    }
  }

  /**
   * Allow user to opt out of migration
   *
   * @param {string} userId - The user's UUID
   * @returns {Promise<{success: boolean, data?: Object, error?: string}>}
   */
  async optOutOfMigration(userId) {
    try {
      if (!userId) {
        return { success: false, error: 'User ID is required' };
      }

      const { data: migration, error } = await supabase
        .from('subscription_migrations')
        .update({
          migration_status: 'opted_out',
          updated_at: new Date().toISOString(),
        })
        .eq('user_id', userId)
        .in('migration_status', ['pending', 'notified'])
        .select()
        .single();

      if (error) {
        if (error.code === 'PGRST116') {
          return { success: false, error: 'NO_PENDING_MIGRATION' };
        }
        console.error('Error opting out of migration:', error);
        return { success: false, error: error.message };
      }

      // Track opt-out event
      await this.trackMigrationEvent(userId, 'migration_opted_out', {
        migration_id: migration.id,
      });

      return {
        success: true,
        data: {
          migrationId: migration.id,
          status: 'opted_out',
        },
      };
    } catch (error) {
      console.error('Error in optOutOfMigration:', error);
      return { success: false, error: error.message };
    }
  }
}

// Export singleton instance
const migrationService = new MigrationService();
export default migrationService;

// Also export the class for testing purposes
export { MigrationService };
