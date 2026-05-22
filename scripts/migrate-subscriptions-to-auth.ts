/**
 * Payment/Subscription Data Migration Script
 *
 * One-time migration: reads subscription/payment data from skillpassport (app DB)
 * and writes it to sso-auth (auth DB) in consolidated form.
 *
 * Also populates shadow tables (subscription_cache, plans_cache) in app DB.
 *
 * Usage:
 *   npx tsx scripts/migrate-subscriptions-to-auth.ts --dry-run
 *   npx tsx scripts/migrate-subscriptions-to-auth.ts --execute
 *
 * Environment variables required:
 *   APP_SUPABASE_URL, APP_SUPABASE_SERVICE_ROLE_KEY  — skillpassport DB
 *   AUTH_SUPABASE_URL, AUTH_SUPABASE_SERVICE_ROLE_KEY — sso-auth DB
 */

import { createClient, SupabaseClient } from '@supabase/supabase-js';

const DRY_RUN = !process.argv.includes('--execute');

function envOrFail(key: string): string {
  const val = process.env[key];
  if (!val) throw new Error(`Missing env var: ${key}`);
  return val;
}

const appDb = createClient(
  envOrFail('APP_SUPABASE_URL'),
  envOrFail('APP_SUPABASE_SERVICE_ROLE_KEY'),
);

const authDb = createClient(
  envOrFail('AUTH_SUPABASE_URL'),
  envOrFail('AUTH_SUPABASE_SERVICE_ROLE_KEY'),
);

interface MigrationStats {
  plans: { read: number; written: number; errors: number };
  subscriptions: { read: number; written: number; errors: number };
  transactions: { read: number; written: number; errors: number };
  cache: { subscription_cache: number; plans_cache: number };
}

const stats: MigrationStats = {
  plans: { read: 0, written: 0, errors: 0 },
  subscriptions: { read: 0, written: 0, errors: 0 },
  transactions: { read: 0, written: 0, errors: 0 },
  cache: { subscription_cache: 0, plans_cache: 0 },
};

// ─── Step 1: Migrate Plans ──────────────────────────────────────────

async function migratePlans(): Promise<{ planIdMap: Map<string, string>, planCodeMap: Map<string, string> }> {
  console.log('\n📋 Step 1: Migrating plans...');
  const planIdMap = new Map<string, string>(); // old_id → new_id
  const planCodeMap = new Map<string, string>(); // code → new_id

  // Read subscription_plans
  const { data: plans, error } = await appDb
    .from('subscription_plans')
    .select('*')
    .order('display_order');

  if (error) throw new Error(`Failed to read plans: ${error.message}`);
  if (!plans || plans.length === 0) {
    console.log('  No plans found.');
    return { planIdMap, planCodeMap };
  }

  stats.plans.read = plans.length;
  console.log(`  Found ${plans.length} plans`);

  // Read plan features
  const { data: features } = await appDb
    .from('subscription_plan_features')
    .select('*');

  const featuresByPlan = new Map<string, unknown[]>();
  for (const f of features || []) {
    const arr = featuresByPlan.get(f.plan_id) || [];
    arr.push(f);
    featuresByPlan.set(f.plan_id, arr);
  }

  for (const plan of plans) {
    const planFeatures = featuresByPlan.get(plan.id) || [];
    const baseFeatureKeys = planFeatures
      .filter((f: any) => f.is_included)
      .map((f: any) => f.feature_key || f.name);

    const newPlan = {
      id: plan.id, // preserve IDs for FK integrity
      plan_code: plan.plan_code,
      name: plan.name,
      business_type: plan.business_type || 'b2c',
      applicable_entities: plan.applicable_entities || [],
      pricing_matrix: plan.pricing_matrix || {},
      base_features: plan.base_features || baseFeatureKeys,
      display_order: plan.display_order || 0,
      is_active: plan.is_active !== false,
    };

    if (DRY_RUN) {
      console.log(`  [DRY RUN] Would insert plan: ${plan.plan_code} (${plan.id})`);
    } else {
      const { error: insertError } = await authDb
        .from('plans')
        .upsert(newPlan, { onConflict: 'id' });

      if (insertError) {
        console.error(`  ❌ Failed to insert plan ${plan.plan_code}: ${insertError.message}`);
        stats.plans.errors++;
      } else {
        stats.plans.written++;
      }
    }

    planIdMap.set(plan.id, plan.id);
    if (plan.plan_code) {
      planCodeMap.set(plan.plan_code.toLowerCase(), plan.id);
    }
  }

  return { planIdMap, planCodeMap };
}

// ─── Step 2: Migrate Subscriptions ──────────────────────────────────

async function migrateSubscriptions(maps: { planIdMap: Map<string, string>, planCodeMap: Map<string, string> }): Promise<Map<string, string>> {
  const { planIdMap, planCodeMap } = maps;
  console.log('\n📋 Step 2: Migrating subscriptions...');
  const subIdMap = new Map<string, string>();

  // Read individual subscriptions
  const { data: subs, error } = await appDb
    .from('subscriptions')
    .select('*')
    .order('created_at');

  if (error) throw new Error(`Failed to read subscriptions: ${error.message}`);
  if (!subs || subs.length === 0) {
    console.log('  No subscriptions found.');
    return subIdMap;
  }

  stats.subscriptions.read = subs.length;
  console.log(`  Found ${subs.length} individual subscriptions`);

  // Read org subscriptions
  const { data: orgSubs } = await appDb
    .from('organization_subscriptions')
    .select('*');

  console.log(`  Found ${orgSubs?.length || 0} organization subscriptions`);

  // Read cancellations
  const { data: cancellations } = await appDb
    .from('subscription_cancellations')
    .select('*');

  const cancellationMap = new Map<string, any>();
  for (const c of cancellations || []) {
    cancellationMap.set(c.subscription_id, c);
  }

  // Migrate individual subscriptions
  for (const sub of subs) {
    const cancellation = cancellationMap.get(sub.id);
    let newPlanId = planIdMap.get(sub.plan_id) || sub.plan_id;
    
    // Fallback to matching by plan_type if plan_id is missing
    if (!newPlanId && sub.plan_type) {
      newPlanId = planCodeMap.get(sub.plan_type.toLowerCase()) || null;
    }

    const newSub = {
      id: sub.id,
      user_id: sub.user_id,
      plan_id: newPlanId,
      organization_id: sub.org_id || sub.organization_id || null,
      full_name: sub.full_name || '',
      email: sub.email || '',
      phone: sub.phone || null,
      plan_code: sub.plan_code || sub.plan_type || '',
      plan_type: sub.plan_type || '',
      plan_amount: sub.plan_amount || 0,
      billing_cycle: sub.billing_cycle || 'lifetime',
      features: sub.features || [],
      status: sub.status || 'active',
      seat_count: sub.seat_count || 1,
      is_bulk_purchase: sub.is_organization_subscription || false,
      subscription_start_date: sub.subscription_start_date,
      subscription_end_date: sub.subscription_end_date,
      auto_renew: sub.auto_renew || false,
      razorpay_subscription_id: sub.razorpay_subscription_id || null,
      razorpay_customer_id: sub.razorpay_customer_id || null,
      receipt_url: sub.receipt_url || null,
      // Cancellation fields (from subscription_cancellations)
      cancelled_at: cancellation?.cancelled_at || sub.cancelled_at || null,
      cancellation_reason: cancellation?.reason || sub.cancellation_reason || null,
      cancellation_feedback: cancellation?.feedback || null,
      cancelled_by: cancellation?.cancelled_by || null,
      metadata: sub.metadata || {},
      created_at: sub.created_at,
      updated_at: sub.updated_at,
    };

    if (DRY_RUN) {
      console.log(`  [DRY RUN] Would insert subscription: ${sub.id} (${sub.status}, plan: ${sub.plan_type})`);
    } else {
      if (sub.user_id) {
        const { error: userError } = await authDb
          .from('users')
          .upsert({
            id: sub.user_id,
            email: sub.email || `${sub.user_id}@placeholder.com`,
            password_hash: 'stub_password'
          }, { onConflict: 'id', ignoreDuplicates: true });
        
        if (userError) {
           console.warn(`    ⚠️ Failed to upsert user ${sub.user_id}:`, userError);
        }
      }

      const { error: insertError } = await authDb
        .from('subscriptions')
        .upsert(newSub, { onConflict: 'id' });

      if (insertError) {
        console.error(`  ❌ Failed to insert subscription ${sub.id}:`, insertError);
        stats.subscriptions.errors++;
      } else {
        stats.subscriptions.written++;
      }
    }

    subIdMap.set(sub.id, sub.id);
  }

  // Migrate org subscriptions (if they aren't already covered by individual subs)
  for (const orgSub of orgSubs || []) {
    if (subIdMap.has(orgSub.subscription_id || orgSub.id)) continue;

    const newPlanId = planIdMap.get(orgSub.subscription_plan_id) || planCodeMap.get('enterprise') || orgSub.subscription_plan_id;

    const newSub = {
      id: orgSub.id,
      user_id: orgSub.purchased_by,
      plan_id: newPlanId,
      organization_id: orgSub.organization_id,
      organization_type: orgSub.organization_type,
      plan_code: '',
      plan_type: orgSub.plan_type || 'organization',
      plan_amount: orgSub.amount || 0,
      billing_cycle: orgSub.billing_cycle || 'monthly',
      features: [],
      status: orgSub.status || 'active',
      seat_count: orgSub.seat_count || 1,
      is_bulk_purchase: true,
      purchased_by: orgSub.purchased_by,
      subscription_start_date: orgSub.start_date,
      subscription_end_date: orgSub.end_date,
      is_organization_subscription: true,
      auto_renew: orgSub.auto_renew || false,
      metadata: orgSub.metadata || {},
      created_at: orgSub.created_at,
      updated_at: orgSub.updated_at,
    };

    if (DRY_RUN) {
      console.log(`  [DRY RUN] Would insert org subscription: ${orgSub.id}`);
    } else {
      if (orgSub.purchased_by) {
        const { error: userError } = await authDb
          .from('users')
          .upsert({
            id: orgSub.purchased_by,
            email: `${orgSub.purchased_by}@placeholder.com`,
            password_hash: 'stub_password'
          }, { onConflict: 'id', ignoreDuplicates: true });
      }

      const { error: insertError } = await authDb
        .from('subscriptions')
        .upsert(newSub, { onConflict: 'id' });

      if (insertError) {
        console.error(`  ❌ Failed to insert org subscription ${orgSub.id}:`, insertError);
        stats.subscriptions.errors++;
      } else {
        stats.subscriptions.written++;
        stats.subscriptions.read++;
      }
    }

    subIdMap.set(orgSub.id, orgSub.id);
  }

  return subIdMap;
}

// ─── Step 3: Migrate Transactions ───────────────────────────────────

async function migrateTransactions(subIdMap: Map<string, string>): Promise<void> {
  console.log('\n📋 Step 3: Migrating transactions...');

  // Read payment_transactions
  const { data: txns, error } = await appDb
    .from('payment_transactions')
    .select('*')
    .order('created_at');

  if (error) throw new Error(`Failed to read transactions: ${error.message}`);

  stats.transactions.read = txns?.length || 0;
  console.log(`  Found ${txns?.length || 0} payment transactions`);

  // Read razorpay_orders for additional data
  const { data: orders } = await appDb
    .from('razorpay_orders')
    .select('*');

  const ordersByPaymentId = new Map<string, any>();
  for (const order of orders || []) {
    if (order.razorpay_payment_id) {
      ordersByPaymentId.set(order.razorpay_payment_id, order);
    }
  }

  const seenPaymentIds = new Set<string>();

  for (const txn of txns || []) {
    // Skip duplicates (same razorpay_payment_id)
    if (txn.razorpay_payment_id && seenPaymentIds.has(txn.razorpay_payment_id)) {
      continue;
    }
    if (txn.razorpay_payment_id) seenPaymentIds.add(txn.razorpay_payment_id);

    const order = ordersByPaymentId.get(txn.razorpay_payment_id);
    const subId = subIdMap.get(txn.subscription_id) || txn.subscription_id;

    const newTxn = {
      id: txn.id,
      subscription_id: subId,
      user_id: txn.user_id,
      organization_id: txn.org_id || null,
      razorpay_order_id: txn.razorpay_order_id || order?.razorpay_order_id || null,
      razorpay_payment_id: txn.razorpay_payment_id,
      razorpay_signature: order?.razorpay_signature || null,
      amount: txn.amount,
      currency: txn.currency || 'INR',
      status: txn.status === 'success' ? 'completed' : txn.status,
      payment_method: txn.payment_method || order?.method || null,
      receipt: order?.receipt || null,
      notes: order?.notes || txn.notes || {},
      receipt_url: txn.receipt_url || null,
      transaction_type: (txn.transaction_type === 'organization_subscription' ? 'org' : txn.transaction_type) || 'subscription',
      metadata: txn.metadata || {},
      created_at: txn.created_at,
      updated_at: txn.updated_at,
    };

    if (DRY_RUN) {
      console.log(`  [DRY RUN] Would insert transaction: ${txn.id} (${txn.status}, ₹${txn.amount})`);
    } else {
      if (txn.user_id) {
        const { error: userError } = await authDb
          .from('users')
          .upsert({
            id: txn.user_id,
            email: `${txn.user_id}@placeholder.com`,
            password_hash: 'stub_password'
          }, { onConflict: 'id', ignoreDuplicates: true });
      }

      const { error: insertError } = await authDb
        .from('transactions')
        .upsert(newTxn, { onConflict: 'id' });

      if (insertError) {
        console.error(`  ❌ Failed to insert transaction ${txn.id}:`, insertError);
        stats.transactions.errors++;
      } else {
        stats.transactions.written++;
      }
    }
  }
}

// ─── Step 4: Populate Shadow Tables ─────────────────────────────────

async function populateShadowTables(): Promise<void> {
  console.log('\n📋 Step 4: Populating shadow tables...');

  // Step 4a: Populate users_shadow from auth DB users
  // This MUST happen before subscription_cache since subscription_cache has FK → users_shadow
  const { data: authUsers, error: usersError } = await authDb
    .from('users')
    .select('id, email, created_at, updated_at');

  if (usersError) throw new Error(`Failed to read auth users: ${usersError.message}`);

  let usersSynced = 0;
  for (const user of authUsers || []) {
    if (!DRY_RUN) {
      const { error } = await appDb
        .from('users_shadow')
        .upsert({
          id: user.id,
          email: user.email,
          created_at: user.created_at,
          updated_at: user.updated_at,
        }, { onConflict: 'id' });

      if (error) {
        console.error(`  ❌ Failed to sync user_shadow ${user.id}: ${error.message}`);
      } else {
        usersSynced++;
      }
    } else {
      usersSynced++;
    }
  }
  console.log(`  ✅ users_shadow: ${usersSynced} synced`);

  // Step 4b: Populate plans_cache from auth DB
  const { data: authPlans, error: plansError } = await authDb
    .from('plans')
    .select('*');

  if (plansError) throw new Error(`Failed to read auth plans: ${plansError.message}`);

  for (const plan of authPlans || []) {
    const cacheRow = {
      id: plan.id,
      plan_code: plan.plan_code,
      name: plan.name,
      business_type: plan.business_type,
      applicable_entities: plan.applicable_entities,
      pricing_matrix: plan.pricing_matrix,
      base_features: plan.base_features,
      display_order: plan.display_order,
      is_active: plan.is_active,
      synced_at: new Date().toISOString(),
      auth_updated_at: plan.updated_at,
    };

    if (!DRY_RUN) {
      const { error } = await appDb
        .from('plans_cache')
        .upsert(cacheRow, { onConflict: 'id' });

      if (error) {
        console.error(`  ❌ Failed to cache plan ${plan.plan_code}: ${error.message}`);
      } else {
        stats.cache.plans_cache++;
      }
    } else {
      console.log(`  [DRY RUN] Would cache plan: ${plan.plan_code}`);
      stats.cache.plans_cache++;
    }
  }

  // Step 4c: Populate subscription_cache from auth DB
  const { data: authSubs, error: subsError } = await authDb
    .from('subscriptions')
    .select('*, plans(plan_code, name, base_features)');

  if (subsError) throw new Error(`Failed to read auth subscriptions: ${subsError.message}`);

  for (const sub of authSubs || []) {
    const plan = sub.plans;
    const cacheRow = {
      id: sub.id,
      user_id: sub.user_id,
      organization_id: sub.organization_id,
      plan_id: sub.plan_id,
      plan_code: sub.plan_code || plan?.plan_code || '',
      plan_name: plan?.name || sub.plan_type || '',
      plan_type: sub.plan_type || '',
      plan_amount: sub.plan_amount || 0,
      billing_cycle: sub.billing_cycle || '',
      status: sub.status,
      features: plan?.base_features || sub.features || [],
      subscription_start_date: sub.subscription_start_date,
      subscription_end_date: sub.subscription_end_date,
      is_organization_subscription: sub.is_organization_subscription || sub.is_bulk_purchase || false,
      organization_type: sub.organization_type || null,
      seat_count: sub.seat_count || 1,
      assigned_seats: sub.assigned_seats || 0,
      synced_at: new Date().toISOString(),
      auth_updated_at: sub.updated_at,
    };

    if (!DRY_RUN) {
      const { error } = await appDb
        .from('subscription_cache')
        .upsert(cacheRow, { onConflict: 'id' });

      if (error) {
        console.error(`  ❌ Failed to cache subscription ${sub.id}: ${error.message}`);
      } else {
        stats.cache.subscription_cache++;
      }
    } else {
      console.log(`  [DRY RUN] Would cache subscription: ${sub.id} (${sub.status})`);
      stats.cache.subscription_cache++;
    }
  }
}

// ─── Step 5: Verification ───────────────────────────────────────────

async function verify(): Promise<void> {
  console.log('\n✅ Step 5: Verification...');

  const checks = [
    { label: 'Auth plans', table: 'plans', db: authDb },
    { label: 'Auth subscriptions', table: 'subscriptions', db: authDb },
    { label: 'Auth transactions', table: 'transactions', db: authDb },
    { label: 'App plans_cache', table: 'plans_cache', db: appDb },
    { label: 'App subscription_cache', table: 'subscription_cache', db: appDb },
    { label: 'App subscription_plans (source)', table: 'subscription_plans', db: appDb },
    { label: 'App subscriptions (source)', table: 'subscriptions', db: appDb },
    { label: 'App payment_transactions (source)', table: 'payment_transactions', db: appDb },
  ];

  for (const check of checks) {
    const { count, error } = await check.db
      .from(check.table)
      .select('*', { count: 'exact', head: true });

    if (error) {
      console.log(`  ${check.label}: ERROR - ${error.message}`);
    } else {
      console.log(`  ${check.label}: ${count} rows`);
    }
  }
}

// ─── Main ───────────────────────────────────────────────────────────

async function main() {
  console.log('═══════════════════════════════════════════════════');
  console.log('  Payment/Subscription Migration: App DB → Auth DB');
  console.log(`  Mode: ${DRY_RUN ? '🔍 DRY RUN (no writes)' : '⚡ EXECUTE (writing data)'}`);
  console.log('═══════════════════════════════════════════════════');

  try {
    const maps = await migratePlans();
    const subIdMap = await migrateSubscriptions(maps);
    await migrateTransactions(subIdMap);

    if (!DRY_RUN) {
      await populateShadowTables();
    } else {
      console.log('\n📋 Step 4: [DRY RUN] Would populate shadow tables');
    }

    await verify();

    console.log('\n═══════════════════════════════════════════════════');
    console.log('  Migration Summary');
    console.log('═══════════════════════════════════════════════════');
    console.log(`  Plans:         ${stats.plans.read} read → ${stats.plans.written} written (${stats.plans.errors} errors)`);
    console.log(`  Subscriptions: ${stats.subscriptions.read} read → ${stats.subscriptions.written} written (${stats.subscriptions.errors} errors)`);
    console.log(`  Transactions:  ${stats.transactions.read} read → ${stats.transactions.written} written (${stats.transactions.errors} errors)`);
    console.log(`  Shadow:        ${stats.cache.plans_cache} plans_cache, ${stats.cache.subscription_cache} subscription_cache`);
    console.log('═══════════════════════════════════════════════════');

    const totalErrors = stats.plans.errors + stats.subscriptions.errors + stats.transactions.errors;
    if (totalErrors > 0) {
      console.error(`\n⚠️  ${totalErrors} errors occurred. Review logs above.`);
      process.exit(1);
    }

    console.log('\n✅ Migration complete!');
  } catch (err) {
    console.error('\n💥 Migration failed:', err);
    process.exit(1);
  }
}

main();
