/**
 * Test script for entitlement lifecycle functionality
 * 
 * Usage: node test-entitlement-lifecycle.js <action>
 * 
 * Actions:
 *   create-expiring    - Create an entitlement expiring in 3 days (for reminder test)
 *   create-expired     - Create an already-expired entitlement (for expiration test)
 *   create-autorenew   - Create an entitlement expiring tomorrow with auto_renew=true
 *   list               - List all entitlements for test user
 *   test-expire        - Call the expire-entitlements endpoint
 *   test-reminders     - Call the send-renewal-reminders endpoint
 *   test-autorenew     - Call the process-auto-renewals endpoint
 *   test-lifecycle     - Call the full lifecycle endpoint
 *   cleanup            - Remove all test entitlements
 */

import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config();

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.VITE_SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('Missing VITE_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY in .env');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);
const PAYMENTS_API = 'https://payments-api.dark-mode-d021.workers.dev';

// Test user - gokul@rareminds.in
const TEST_USER_ID = '95364f0d-23fb-4616-b0f4-48caafee5439';
const TEST_FEATURE_KEY = 'career_ai';

async function createEntitlement(daysFromNow, autoRenew = false) {
  const now = new Date();
  const startDate = new Date(now);
  startDate.setDate(startDate.getDate() - 30); // Started 30 days ago
  
  const endDate = new Date(now);
  endDate.setDate(endDate.getDate() + daysFromNow);
  
  const { data, error } = await supabase
    .from('user_entitlements')
    .insert({
      user_id: TEST_USER_ID,
      feature_key: TEST_FEATURE_KEY,
      status: 'active',
      start_date: startDate.toISOString(),
      end_date: endDate.toISOString(),
      billing_period: 'monthly',
      price_at_purchase: 299,
      auto_renew: autoRenew,
    })
    .select()
    .single();

  if (error) {
    console.error('Error creating entitlement:', error);
    return null;
  }
  
  console.log(`✅ Created entitlement (expires in ${daysFromNow} days, auto_renew=${autoRenew}):`, data.id);
  return data;
}

async function listEntitlements() {
  const { data, error } = await supabase
    .from('user_entitlements')
    .select('*')
    .eq('user_id', TEST_USER_ID)
    .order('created_at', { ascending: false });

  if (error) {
    console.error('Error listing entitlements:', error);
    return;
  }

  console.log('\n📋 Entitlements for test user:');
  console.log('─'.repeat(80));
  
  if (!data || data.length === 0) {
    console.log('No entitlements found');
    return;
  }

  data.forEach(e => {
    const endDate = new Date(e.end_date);
    const now = new Date();
    const daysLeft = Math.ceil((endDate - now) / (1000 * 60 * 60 * 24));
    
    console.log(`ID: ${e.id}`);
    console.log(`  Feature: ${e.feature_key}`);
    console.log(`  Status: ${e.status}`);
    console.log(`  End Date: ${e.end_date} (${daysLeft} days ${daysLeft >= 0 ? 'left' : 'ago'})`);
    console.log(`  Auto Renew: ${e.auto_renew}`);
    console.log('─'.repeat(80));
  });
}

async function callEndpoint(endpoint) {
  console.log(`\n🔄 Calling ${endpoint}...`);
  
  try {
    const response = await fetch(`${PAYMENTS_API}${endpoint}`, {
      method: 'POST',
    });
    
    const data = await response.json();
    console.log(`✅ Response (${response.status}):`, JSON.stringify(data, null, 2));
    return data;
  } catch (error) {
    console.error(`❌ Error calling ${endpoint}:`, error.message);
    return null;
  }
}

async function cleanup() {
  const { error } = await supabase
    .from('user_entitlements')
    .delete()
    .eq('user_id', TEST_USER_ID);

  if (error) {
    console.error('Error cleaning up:', error);
    return;
  }
  
  console.log('✅ Cleaned up all entitlements for test user');
}

// Main
const action = process.argv[2];

switch (action) {
  case 'create-expiring':
    // Create entitlement expiring in 1 day (should trigger 1-day reminder)
    await createEntitlement(1, false);
    break;
    
  case 'create-expired':
    // Create already-expired entitlement (should be marked as expired)
    await createEntitlement(-1, false);
    break;
    
  case 'create-autorenew':
    // Create entitlement expiring tomorrow with auto_renew (should be auto-renewed)
    await createEntitlement(1, true);
    break;
    
  case 'list':
    await listEntitlements();
    break;
    
  case 'test-expire':
    await callEndpoint('/expire-entitlements');
    break;
    
  case 'test-reminders':
    await callEndpoint('/send-renewal-reminders');
    break;
    
  case 'test-autorenew':
    await callEndpoint('/process-auto-renewals');
    break;
    
  case 'test-lifecycle':
    await callEndpoint('/process-entitlement-lifecycle');
    break;
    
  case 'cleanup':
    await cleanup();
    break;
    
  default:
    console.log(`
Usage: node test-entitlement-lifecycle.js <action>

Actions:
  create-expiring    - Create entitlement expiring in 3 days (for reminder test)
  create-expired     - Create already-expired entitlement (for expiration test)
  create-autorenew   - Create entitlement expiring tomorrow with auto_renew=true
  list               - List all entitlements for test user
  test-expire        - Call the expire-entitlements endpoint
  test-reminders     - Call the send-renewal-reminders endpoint
  test-autorenew     - Call the process-auto-renewals endpoint
  test-lifecycle     - Call the full lifecycle endpoint
  cleanup            - Remove all test entitlements

Example test flow:
  1. node test-entitlement-lifecycle.js cleanup
  2. node test-entitlement-lifecycle.js create-expired
  3. node test-entitlement-lifecycle.js test-expire
  4. node test-entitlement-lifecycle.js list
`);
}
