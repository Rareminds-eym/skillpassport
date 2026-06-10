#!/usr/bin/env npx tsx
/**
 * Remove all addon entitlements/purchases for a user in local Supabase.
 *
 * Usage:
 *   npx tsx scripts/remove-user-addons.ts user@email.com
 *   npx tsx scripts/remove-user-addons.ts   (prompts for email)
 *
 * Connects ONLY to local Supabase instances.
 *   App DB (skillpassport):  http://127.0.0.1:54321
 *   Auth DB (sso-worker):    http://127.0.0.1:54331
 */

import { createClient } from '@supabase/supabase-js';
import * as readline from 'node:readline/promises';
import { stdin as input, stdout as output } from 'node:process';

// ─── Local-only config (never points to production) ──────────────

const LOCAL_SERVICE_ROLE_KEY =
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS1kZW1vIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImV4cCI6MTk4MzgxMjk5Nn0.EGIM96RAZx35lJzdJsyH-qQwv8Hdp7fsn3W0YpN81IU';

const APP_DB = {
  name: 'App DB (skillpassport)',
  url: 'http://127.0.0.1:54321',
  tables: ['user_entitlements'] as const,
};

const AUTH_DB = {
  name: 'Auth DB (sso-worker)',
  url: 'http://127.0.0.1:54331',
  tables: ['addon_purchases', 'bundle_purchases'] as const,
};

// ─── Get email ───────────────────────────────────────────────────

async function getEmail(): Promise<string> {
  if (process.argv[2]) return process.argv[2];

  const rl = readline.createInterface({ input, output });
  const email = await rl.question('Enter user email: ');
  rl.close();
  return email.trim();
}

// ─── Lookup user UUID by email (auth schema) ─────────────────────

async function lookupUserId(
  supabase: ReturnType<typeof createClient>,
  email: string,
): Promise<string | null> {
  const { data, error } = await supabase
    .from('users')
    .select('id')
    .eq('email', email.toLowerCase())
    .maybeSingle();

  if (error) {
    console.error(`  ❌ Lookup failed: ${error.message}`);
    return null;
  }

  if (!data) {
    console.error(`  ❌ No user found with email: ${email}`);
    return null;
  }

  return data.id;
}

// ─── Delete from a table ─────────────────────────────────────────

async function deleteFromTable(
  supabase: ReturnType<typeof createClient>,
  table: string,
  userId: string,
): Promise<number> {
  const { data, error, count } = await supabase
    .from(table)
    .delete({ count: 'exact' })
    .eq('user_id', userId);

  if (error) {
    if (error.code === '42P01') {
      console.warn(`  ⚠️  Table "${table}" does not exist`);
      return 0;
    }
    console.error(`  ❌ ${table}: ${error.message}`);
    return 0;
  }

  return count ?? data?.length ?? 0;
}

// ─── Clean a database ────────────────────────────────────────────

async function cleanDatabase(
  db: typeof APP_DB,
  userId: string,
): Promise<number> {
  console.log(`\n${db.name} (${db.url})`);

  const supabase = createClient(db.url, LOCAL_SERVICE_ROLE_KEY, {
    auth: { persistSession: false, autoRefreshToken: false },
  });

  let total = 0;

  for (const table of db.tables) {
    const count = await deleteFromTable(supabase, table, userId);
    if (count > 0) {
      console.log(`  ✅ ${table}: ${count} deleted`);
    } else {
      console.log(`  ℹ️  ${table}: none found`);
    }
    total += count;
  }

  return total;
}

// ─── Main ─────────────────────────────────────────────────────────

async function main() {
  console.log('=== Remove User Addon Records (Local Supabase) ===');
  console.log('');

  const email = await getEmail();
  if (!email || !email.includes('@')) {
    console.error('❌ Invalid email address');
    process.exit(1);
  }

  // Look up user on Auth DB (SSO Worker manages users here)
  const authClient = createClient(AUTH_DB.url, LOCAL_SERVICE_ROLE_KEY, {
    auth: { persistSession: false, autoRefreshToken: false },
  });

  const userId = await lookupUserId(authClient, email);
  if (!userId) process.exit(1);

  console.log(`User: ${email} (${userId})`);
  console.log('');

  const appTotal = await cleanDatabase(APP_DB, userId);
  const authTotal = await cleanDatabase(AUTH_DB, userId);

  const total = appTotal + authTotal;
  console.log('');
  console.log(
    total > 0
      ? `✅ Removed ${total} record(s) total`
      : 'ℹ️  No addon records found for this user',
  );
}

main().catch((err) => {
  console.error('❌ Script failed:', err);
  process.exit(1);
});
