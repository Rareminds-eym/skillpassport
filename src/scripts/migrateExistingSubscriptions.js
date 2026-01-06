/**
 * Migration Script for Existing Subscriptions
 * 
 * This script migrates existing users with active subscriptions to the new
 * add-on based system while preserving their current access and pricing.
 * 
 * @requirement Task 8.1 - Create migration script for existing users
 */

import { supabase } from '../lib/supabaseClient';
import migrationService from '../services/migrationService';

/**
 * Migration configuration
 */
const MIGRATION_CONFIG = {
  // Batch size for processing users
  batchSize: 100,
  // Whether to run in dry-run mode (no actual changes)
  dryRun: true,
  // Price protection duration in months
  priceProtectionMonths: 12,
  // Notification lead time in days
  notificationLeadDays: 30
};

/**
 * Plan to add-on mapping
 * Maps existing plan features to equivalent add-ons
 */
const PLAN_ADDON_MAPPING = {
  basic: {
    addOns: [],
    description: 'Basic plan - no add-ons included'
  },
  professional: {
    addOns: ['career_ai', 'advanced_assessments'],
    description: 'Professional plan includes Career AI and Advanced Assessments'
  },
  enterprise: {
    addOns: ['career_ai', 'advanced_assessments', 'kpi_dashboard', 'educator_ai'],
    description: 'Enterprise plan includes all professional features plus KPI Dashboard and Educator AI'
  },
  ecosystem: {
    addOns: ['career_ai', 'advanced_assessments', 'kpi_dashboard', 'educator_ai', 'sso', 'api_webhooks'],
    description: 'Ecosystem plan includes all features'
  }
};

/**
 * Fetch all users with active subscriptions
 */
async function fetchActiveSubscriptions(offset = 0, limit = MIGRATION_CONFIG.batchSize) {
  const { data, error, count } = await supabase
    .from('subscriptions')
    .select('*, users!inner(id, email, user_metadata)', { count: 'exact' })
    .in('status', ['active', 'paused'])
    .range(offset, offset + limit - 1)
    .order('created_at', { ascending: true });

  if (error) {
    console.error('Error fetching subscriptions:', error);
    throw error;
  }

  return { subscriptions: data || [], totalCount: count || 0 };
}

/**
 * Check if user already has entitlements
 */
async function hasExistingEntitlements(userId) {
  const { data, error } = await supabase
    .from('user_entitlements')
    .select('id')
    .eq('user_id', userId)
    .limit(1);

  if (error) {
    console.error('Error checking entitlements:', error);
    return false;
  }

  return data && data.length > 0;
}

/**
 * Create entitlements for a user based on their plan
 */
async function createEntitlementsForUser(subscription, dryRun = true) {
  const planCode = subscription.plan_type?.toLowerCase() || 'basic';
  const mapping = PLAN_ADDON_MAPPING[planCode];

  if (!mapping || mapping.addOns.length === 0) {
    return { success: true, message: 'No add-ons to migrate', addOns: [] };
  }

  const userId = subscription.user_id;
  const endDate = subscription.subscription_end_date;

  // Get add-on details
  const { data: addOns, error: addOnError } = await supabase
    .from('subscription_plan_features')
    .select('*')
    .in('feature_key', mapping.addOns)
    .eq('is_addon', true);

  if (addOnError) {
    console.error('Error fetching add-ons:', addOnError);
    return { success: false, error: addOnError.message };
  }

  if (dryRun) {
    return {
      success: true,
      dryRun: true,
      message: `Would create ${addOns.length} entitlements`,
      addOns: addOns.map(a => a.feature_key)
    };
  }

  // Create entitlements
  const entitlements = addOns.map(addOn => ({
    user_id: userId,
    feature_key: addOn.feature_key,
    source: 'migration',
    status: 'active',
    billing_period: 'monthly',
    start_date: new Date().toISOString(),
    end_date: endDate,
    auto_renew: subscription.auto_renew || false,
    price_at_purchase: 0, // Migrated users get it free until their plan expires
    original_subscription_id: subscription.id
  }));

  const { data: created, error: createError } = await supabase
    .from('user_entitlements')
    .insert(entitlements)
    .select();

  if (createError) {
    console.error('Error creating entitlements:', createError);
    return { success: false, error: createError.message };
  }

  return {
    success: true,
    message: `Created ${created.length} entitlements`,
    addOns: created.map(e => e.feature_key)
  };
}

/**
 * Record migration in tracking table
 */
async function recordMigration(subscription, result, dryRun = true) {
  if (dryRun) return;

  const migrationRecord = {
    user_id: subscription.user_id,
    old_plan_code: subscription.plan_type,
    migrated_features: result.addOns || [],
    price_protection_until: new Date(
      Date.now() + MIGRATION_CONFIG.priceProtectionMonths * 30 * 24 * 60 * 60 * 1000
    ).toISOString(),
    migration_status: result.success ? 'completed' : 'failed',
    error_message: result.error || null,
    migrated_at: new Date().toISOString()
  };

  const { error } = await supabase
    .from('subscription_migrations')
    .insert(migrationRecord);

  if (error) {
    console.error('Error recording migration:', error);
  }
}

/**
 * Main migration function
 */
export async function migrateExistingSubscriptions(options = {}) {
  const config = { ...MIGRATION_CONFIG, ...options };
  
  console.log('Starting subscription migration...');
  console.log('Configuration:', config);

  const results = {
    total: 0,
    processed: 0,
    migrated: 0,
    skipped: 0,
    failed: 0,
    errors: []
  };

  let offset = 0;
  let hasMore = true;

  while (hasMore) {
    const { subscriptions, totalCount } = await fetchActiveSubscriptions(offset, config.batchSize);
    
    if (results.total === 0) {
      results.total = totalCount;
      console.log(`Found ${totalCount} active subscriptions to process`);
    }

    if (subscriptions.length === 0) {
      hasMore = false;
      break;
    }

    for (const subscription of subscriptions) {
      results.processed++;
      
      try {
        // Check if already migrated
        const hasEntitlements = await hasExistingEntitlements(subscription.user_id);
        
        if (hasEntitlements) {
          console.log(`Skipping user ${subscription.user_id} - already has entitlements`);
          results.skipped++;
          continue;
        }

        // Create entitlements
        const result = await createEntitlementsForUser(subscription, config.dryRun);
        
        if (result.success) {
          results.migrated++;
          console.log(`${config.dryRun ? '[DRY RUN] ' : ''}Migrated user ${subscription.user_id}: ${result.message}`);
        } else {
          results.failed++;
          results.errors.push({ userId: subscription.user_id, error: result.error });
          console.error(`Failed to migrate user ${subscription.user_id}: ${result.error}`);
        }

        // Record migration
        await recordMigration(subscription, result, config.dryRun);

      } catch (error) {
        results.failed++;
        results.errors.push({ userId: subscription.user_id, error: error.message });
        console.error(`Error processing user ${subscription.user_id}:`, error);
      }
    }

    offset += config.batchSize;
    hasMore = offset < totalCount;
  }

  console.log('\nMigration complete!');
  console.log('Results:', results);

  return results;
}

/**
 * Schedule migration notifications
 */
export async function scheduleMigrationNotifications() {
  const { data: pendingMigrations, error } = await supabase
    .from('subscriptions')
    .select('user_id, subscription_end_date, users!inner(email)')
    .in('status', ['active', 'paused'])
    .gte('subscription_end_date', new Date().toISOString());

  if (error) {
    console.error('Error fetching pending migrations:', error);
    return;
  }

  for (const subscription of pendingMigrations || []) {
    const notificationDate = new Date(subscription.subscription_end_date);
    notificationDate.setDate(notificationDate.getDate() - MIGRATION_CONFIG.notificationLeadDays);

    if (notificationDate > new Date()) {
      await migrationService.scheduleMigrationNotification(
        subscription.user_id,
        notificationDate.toISOString()
      );
    }
  }

  console.log(`Scheduled notifications for ${pendingMigrations?.length || 0} users`);
}

// CLI execution
if (typeof process !== 'undefined' && process.argv[1]?.includes('migrateExistingSubscriptions')) {
  const args = process.argv.slice(2);
  const dryRun = !args.includes('--execute');
  
  console.log(dryRun ? 'Running in DRY RUN mode' : 'Running in EXECUTE mode');
  
  migrateExistingSubscriptions({ dryRun })
    .then(results => {
      console.log('Migration completed:', results);
      process.exit(results.failed > 0 ? 1 : 0);
    })
    .catch(error => {
      console.error('Migration failed:', error);
      process.exit(1);
    });
}

export default {
  migrateExistingSubscriptions,
  scheduleMigrationNotifications,
  PLAN_ADDON_MAPPING,
  MIGRATION_CONFIG
};
