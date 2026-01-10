// Remove all addon purchases/subscriptions for Gokul - with proper FK handling
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  'https://dpooleduinyyzxgrcwko.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImRwb29sZWR1aW55eXp4Z3Jjd2tvIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1OTk5NDY5OCwiZXhwIjoyMDc1NTcwNjk4fQ.WIrwkA_-2oCjwmD6WpCf9N38hYXEwrIIXXHB4x5km10'
);

const studentId = '95364f0d-23fb-4616-b0f4-48caafee5439';
const subscriptionId = '17650748-914d-4662-9d82-b5057412fdb1';

async function removeSubscriptions() {
  console.log('🔍 Removing subscriptions for Gokul (gokul@rareminds.in)\n');

  // First check razorpay_orders that reference this subscription
  const { data: orders, error: ordersErr } = await supabase
    .from('razorpay_orders')
    .select('*')
    .eq('subscription_id', subscriptionId);

  console.log('Found razorpay_orders:', orders?.length || 0);
  if (orders?.length) {
    console.log(JSON.stringify(orders, null, 2));
  }

  // Check subscription_addons
  const { data: subAddons, error: subAddonsErr } = await supabase
    .from('subscription_addons')
    .select('*')
    .eq('subscription_id', subscriptionId);

  if (!subAddonsErr) {
    console.log('\nFound subscription_addons:', subAddons?.length || 0);
    if (subAddons?.length) console.log(JSON.stringify(subAddons, null, 2));
  }

  // Check entitlements
  const { data: entitlements, error: entErr } = await supabase
    .from('entitlements')
    .select('*')
    .eq('subscription_id', subscriptionId);

  if (!entErr) {
    console.log('\nFound entitlements:', entitlements?.length || 0);
    if (entitlements?.length) console.log(JSON.stringify(entitlements, null, 2));
  }

  console.log('\n=== DELETING RECORDS (in correct order) ===\n');

  // 1. Delete razorpay_orders first (child table)
  if (orders?.length) {
    const { error } = await supabase.from('razorpay_orders').delete().eq('subscription_id', subscriptionId);
    console.log('1. Deleted razorpay_orders:', error ? error.message : '✅ Success');
  } else {
    console.log('1. No razorpay_orders to delete');
  }

  // 2. Delete subscription_addons
  if (subAddons?.length) {
    const { error } = await supabase.from('subscription_addons').delete().eq('subscription_id', subscriptionId);
    console.log('2. Deleted subscription_addons:', error ? error.message : '✅ Success');
  } else {
    console.log('2. No subscription_addons to delete');
  }

  // 3. Delete entitlements
  if (entitlements?.length) {
    const { error } = await supabase.from('entitlements').delete().eq('subscription_id', subscriptionId);
    console.log('3. Deleted entitlements:', error ? error.message : '✅ Success');
  } else {
    console.log('3. No entitlements to delete');
  }

  // 4. Finally delete the subscription
  const { error: subErr } = await supabase.from('subscriptions').delete().eq('id', subscriptionId);
  console.log('4. Deleted subscription:', subErr ? subErr.message : '✅ Success');

  // Verify deletion
  const { data: verify } = await supabase
    .from('subscriptions')
    .select('id')
    .eq('user_id', studentId);

  console.log('\n=== VERIFICATION ===');
  console.log('Remaining subscriptions for user:', verify?.length || 0);
  
  console.log('\n✅ Done!');
}

removeSubscriptions();
