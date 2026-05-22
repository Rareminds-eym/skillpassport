import { createClient } from '@supabase/supabase-js';

const AUTH_URL = 'http://127.0.0.1:54331';
const APP_URL = 'http://127.0.0.1:54321';

// We use the same service role key for local dev for both usually, 
// but wait, sso-auth uses a different secret key.
const APP_SERVICE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS1kZW1vIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImV4cCI6MTk4MzgxMjk5Nn0.EGIM96RAZx35lJzdJsyH-qQwv8Hdp7fsn3W0YpN81IU';
const AUTH_SERVICE_KEY = 'sb_secret_N7UND0UgjKTVK-Uodkm0Hg_xSvEMPvz';

const authDb = createClient(AUTH_URL, AUTH_SERVICE_KEY);
const appDb = createClient(APP_URL, APP_SERVICE_KEY);

async function sync() {
  console.log('Fetching plans from Auth DB...');
  const { data: plans, error: fetchErr } = await authDb.from('plans').select('*');
  
  if (fetchErr) {
    console.error('Error fetching plans:', fetchErr);
    process.exit(1);
  }

  console.log(`Found ${plans.length} plans. Inserting into App DB plans_cache...`);

  for (const plan of plans) {
    const { error: insertErr } = await appDb.from('plans_cache').upsert({
      id: plan.id,
      plan_code: plan.plan_code,
      name: plan.name,
      business_type: plan.business_type,
      applicable_entities: plan.applicable_entities,
      pricing_matrix: plan.pricing_matrix,
      base_features: plan.base_features,
      entity_config: plan.entity_config,
      display_order: plan.display_order,
      is_active: plan.is_active,
      product_id: plan.product_id,
      synced_at: new Date().toISOString(),
      auth_updated_at: plan.updated_at
    });

    if (insertErr) {
      console.error(`Error inserting plan ${plan.plan_code}:`, insertErr);
    } else {
      console.log(`Successfully synced plan: ${plan.plan_code}`);
    }
  }

  console.log('Fetching subscriptions from Auth DB...');
  const { data: subs, error: subFetchErr } = await authDb.from('subscriptions').select('*');
  
  if (subFetchErr) {
    console.error('Error fetching subscriptions:', subFetchErr);
    process.exit(1);
  }

  console.log(`Found ${subs.length} subscriptions. Inserting into App DB subscription_cache...`);

  for (const sub of subs) {
    // Insert into users_shadow first to satisfy FK
    await appDb.from('users_shadow').upsert({
      id: sub.user_id,
      email: sub.email || `${sub.user_id}@unknown`
    });

    const { error: insertSubErr } = await appDb.from('subscription_cache').upsert({
      id: sub.id,
      user_id: sub.user_id,
      organization_id: sub.organization_id,
      plan_id: sub.plan_id,
      plan_code: sub.plan_code,
      plan_name: sub.plan_type, // Assuming plan_type matches plan_name logic
      plan_type: sub.plan_type,
      plan_amount: sub.plan_amount,
      billing_cycle: sub.billing_cycle,
      status: sub.status,
      features: sub.features,
      subscription_start_date: sub.subscription_start_date,
      subscription_end_date: sub.subscription_end_date,
      is_organization_subscription: sub.is_organization_subscription,
      organization_type: sub.organization_type,
      seat_count: sub.seat_count,
      product_id: sub.product_id,
      synced_at: new Date().toISOString(),
      auth_updated_at: sub.updated_at
    });

    if (insertSubErr) {
      console.error(`Error inserting subscription ${sub.id}:`, insertSubErr);
    } else {
      console.log(`Successfully synced subscription: ${sub.id}`);
    }
  }

  console.log('Done syncing plans and subscriptions!');
}

sync();
