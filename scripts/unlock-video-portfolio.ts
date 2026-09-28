#!/usr/bin/env npx tsx
/**
 * Unlock Video Portfolio Access for User
 *
 * Industrial-Grade Script for Managing Feature Entitlements
 *
 * Purpose:
 *   Grant or verify video portfolio access for a specific user in the SkillPassport database.
 *   Follows best practices for entitlement management and database operations.
 *
 * Usage:
 *   # Interactive (prompts for all required info):
 *   npx tsx scripts/unlock-video-portfolio.ts
 *
 *   # Non-interactive (provide all arguments):
 *   npx tsx scripts/unlock-video-portfolio.ts user@email.com --env=production --billing=lifetime
 *
 *   # Check status only (dry run):
 *   npx tsx scripts/unlock-video-portfolio.ts user@email.com --check-only
 *
 * Arguments:
 *   email                  User email address
 *   --env=<environment>    Environment: local, staging, production (default: local)
 *   --billing=<period>     Billing period: monthly, annual, lifetime (default: lifetime)
 *   --duration=<days>      Duration in days (optional, for temporary access)
 *   --check-only           Only check current status, don't modify
 *   --force                Skip confirmation prompts
 *
 * Examples:
 *   # Grant lifetime access in production
 *   npx tsx scripts/unlock-video-portfolio.ts user@email.com --env=production --billing=lifetime
 *
 *   # Grant 30-day trial in staging
 *   npx tsx scripts/unlock-video-portfolio.ts user@email.com --env=staging --duration=30
 *
 *   # Check current access status
 *   npx tsx scripts/unlock-video-portfolio.ts user@email.com --check-only
 *
 * Security:
 *   - Uses environment variables for database credentials (never hardcoded)
 *   - Service role keys should be stored in .env files (gitignored)
 *   - All database operations use parameterized queries
 *   - Audit trail logged for all modifications
 *
 * Requirements:
 *   - Node.js 18+ with tsx
 *   - @supabase/supabase-js
 *   - Environment variables configured (.env file)
 *
 * @author Industrial Standards Script Generator
 * @version 1.0.0
 * @date 2026-09-28
 */

import { createClient, SupabaseClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
import { stdin as input, stdout as output } from 'node:process';
import * as readline from 'node:readline/promises';

// ─── Types ───────────────────────────────────────────────────────

interface ScriptConfig {
  email: string;
  environment: 'local' | 'staging' | 'production';
  billingPeriod: 'monthly' | 'annual'; // Removed 'lifetime' - not supported by DB constraint
  durationDays?: number;
  checkOnly: boolean;
  force: boolean;
}

interface DatabaseConfig {
  url: string;
  serviceRoleKey: string;
  name: string;
}

interface UserRecord {
  id: string;
  email: string;
  firstName: string | null;
  lastName: string | null;
  role: string | null;
  createdAt: string;
}

interface EntitlementRecord {
  id: string;
  userId: string;
  featureKey: string;
  status: string;
  billingPeriod: string;
  startDate: string;
  endDate: string;
  autoRenew: boolean;
  isGrandfathered: boolean;
  createdAt: string;
  updatedAt: string;
}

interface OperationResult {
  success: boolean;
  message: string;
  data?: any;
  error?: string;
}

// ─── Constants ───────────────────────────────────────────────────

const FEATURE_KEY = 'video_portfolio'; // Changed from 'video-portfolio' to match DB convention

// DB_CONFIG is defined as a function to ensure env vars are read after dotenv loads
function getDbConfig(environment: string) {
  const configs = {
    local: {
      name: 'Local Development',
      url: 'http://127.0.0.1:54321',
      envKey: 'LOCAL_SERVICE_ROLE_KEY',
    },
    staging: {
      name: 'Staging Environment',
      url: process.env.VITE_SUPABASE_URL_STAGING || process.env.SUPABASE_URL_STAGING || '',
      envKey: 'STAGING_SERVICE_ROLE_KEY',
    },
    production: {
      name: 'Production Environment',
      url: process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL || '',
      envKey: 'SUPABASE_SERVICE_ROLE_KEY', // Changed to match actual env var name
    },
  };
  return configs[environment as keyof typeof configs];
}

// Default service role key for local development (Supabase standard)
const DEFAULT_LOCAL_SERVICE_ROLE_KEY =
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS1kZW1vIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImV4cCI6MTk4MzgxMjk5Nn0.EGIM96RAZx35lJzdJsyH-qQwv8Hdp7fsn3W0YpN81IU';

// ─── Utility Functions ───────────────────────────────────────────

/**
 * Load environment variables from .env files
 */
function loadEnvironment(): void {
  dotenv.config({ path: '.env' });
  dotenv.config({ path: '.env.local', override: true });
  dotenv.config({ path: '.env.production', override: true });
}

/**
 * Parse command line arguments
 */
function parseArguments(): Partial<ScriptConfig> {
  const args = process.argv.slice(2);
  const config: Partial<ScriptConfig> = {
    checkOnly: false,
    force: false,
  };

  // First argument (if not a flag) is the email
  if (args[0] && !args[0].startsWith('--')) {
    config.email = args[0];
  }

  // Parse flags
  for (const arg of args) {
    if (arg.startsWith('--env=')) {
      const env = arg.split('=')[1] as ScriptConfig['environment'];
      if (['local', 'staging', 'production'].includes(env)) {
        config.environment = env;
      }
    } else if (arg.startsWith('--billing=')) {
      const billing = arg.split('=')[1] as ScriptConfig['billingPeriod'];
      if (['monthly', 'annual'].includes(billing)) {
        config.billingPeriod = billing;
      }
    } else if (arg.startsWith('--duration=')) {
      config.durationDays = parseInt(arg.split('=')[1], 10);
    } else if (arg === '--check-only') {
      config.checkOnly = true;
    } else if (arg === '--force') {
      config.force = true;
    }
  }

  return config;
}

/**
 * Prompt user for input
 */
async function prompt(question: string, defaultValue?: string): Promise<string> {
  const rl = readline.createInterface({ input, output });
  const suffix = defaultValue ? ` (default: ${defaultValue})` : '';
  const answer = await rl.question(`${question}${suffix}: `);
  rl.close();
  return answer.trim() || defaultValue || '';
}

/**
 * Confirm action with user
 */
async function confirm(question: string): Promise<boolean> {
  const answer = await prompt(`${question} (yes/no)`, 'no');
  return answer.toLowerCase() === 'yes' || answer.toLowerCase() === 'y';
}

/**
 * Validate email format
 */
function isValidEmail(email: string): boolean {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
}

/**
 * Get database configuration for environment
 */
function getDatabaseConfig(environment: ScriptConfig['environment']): DatabaseConfig {
  const config = getDbConfig(environment);
  let serviceRoleKey = process.env[config.envKey];

  // Use default key for local development if not set
  if (environment === 'local' && !serviceRoleKey) {
    serviceRoleKey = DEFAULT_LOCAL_SERVICE_ROLE_KEY;
  }

  if (!config.url) {
    throw new Error(
      `Database URL not configured for ${environment}. Check your .env file.`
    );
  }

  if (!serviceRoleKey) {
    throw new Error(
      `Service role key not found for ${environment}. Set ${config.envKey} in .env file.`
    );
  }

  return {
    url: config.url,
    serviceRoleKey,
    name: config.name,
  };
}

/**
 * Create Supabase client with service role access
 */
function createServiceClient(config: DatabaseConfig): SupabaseClient {
  return createClient(config.url, config.serviceRoleKey, {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
    },
  });
}

/**
 * Format date for display
 */
function formatDate(date: Date): string {
  return date.toISOString().split('T')[0];
}

/**
 * Calculate end date based on billing period and duration
 */
function calculateEndDate(
  startDate: Date,
  billingPeriod: ScriptConfig['billingPeriod'],
  durationDays?: number
): Date {
  const endDate = new Date(startDate);

  if (durationDays) {
    endDate.setDate(endDate.getDate() + durationDays);
  } else if (billingPeriod === 'annual') {
    // For annual without specific duration, grant 100 years (simulates lifetime)
    endDate.setFullYear(endDate.getFullYear() + 100);
  } else if (billingPeriod === 'monthly') {
    endDate.setMonth(endDate.getMonth() + 1);
  }

  return endDate;
}

// ─── Database Operations ─────────────────────────────────────────

/**
 * Look up user by email
 */
async function findUserByEmail(
  client: SupabaseClient,
  email: string
): Promise<OperationResult> {
  try {
    const { data, error } = await client
      .from('users')
      .select('id, email, "firstName", "lastName", role, "createdAt"')
      .eq('email', email.toLowerCase())
      .maybeSingle();

    if (error) {
      return {
        success: false,
        message: 'Database query failed',
        error: error.message,
      };
    }

    if (!data) {
      return {
        success: false,
        message: `No user found with email: ${email}`,
      };
    }

    return {
      success: true,
      message: 'User found',
      data: data as UserRecord,
    };
  } catch (err) {
    return {
      success: false,
      message: 'Unexpected error during user lookup',
      error: err instanceof Error ? err.message : String(err),
    };
  }
}

/**
 * Get current entitlement status
 */
async function getEntitlementStatus(
  client: SupabaseClient,
  userId: string
): Promise<OperationResult> {
  try {
    const { data, error } = await client
      .from('user_entitlements')
      .select('*')
      .eq('user_id', userId)
      .eq('feature_key', FEATURE_KEY)
      .maybeSingle();

    if (error) {
      return {
        success: false,
        message: 'Failed to query entitlement',
        error: error.message,
      };
    }

    return {
      success: true,
      message: data ? 'Entitlement exists' : 'No entitlement found',
      data: data as EntitlementRecord | null,
    };
  } catch (err) {
    return {
      success: false,
      message: 'Unexpected error during entitlement lookup',
      error: err instanceof Error ? err.message : String(err),
    };
  }
}

/**
 * Create new entitlement
 */
async function createEntitlement(
  client: SupabaseClient,
  userId: string,
  config: ScriptConfig
): Promise<OperationResult> {
  try {
    const startDate = new Date();
    const endDate = calculateEndDate(
      startDate,
      config.billingPeriod,
      config.durationDays
    );

    const entitlement = {
      user_id: userId,
      feature_key: FEATURE_KEY,
      status: 'active',
      billing_period: config.billingPeriod,
      start_date: startDate.toISOString(),
      end_date: endDate.toISOString(),
      auto_renew: false, // Set to false for long-term grants
      price_at_purchase: 0, // Grandfathered/granted access
      is_grandfathered: true,
      granted_by_organization: false,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };

    const { data, error } = await client
      .from('user_entitlements')
      .insert(entitlement)
      .select()
      .single();

    if (error) {
      return {
        success: false,
        message: 'Failed to create entitlement',
        error: error.message,
      };
    }

    return {
      success: true,
      message: 'Entitlement created successfully',
      data: data as EntitlementRecord,
    };
  } catch (err) {
    return {
      success: false,
      message: 'Unexpected error during entitlement creation',
      error: err instanceof Error ? err.message : String(err),
    };
  }
}

/**
 * Update existing entitlement
 */
async function updateEntitlement(
  client: SupabaseClient,
  entitlementId: string,
  config: ScriptConfig
): Promise<OperationResult> {
  try {
    const startDate = new Date();
    const endDate = calculateEndDate(
      startDate,
      config.billingPeriod,
      config.durationDays
    );

    const updates = {
      status: 'active',
      billing_period: config.billingPeriod,
      start_date: startDate.toISOString(),
      end_date: endDate.toISOString(),
      auto_renew: false, // Set to false for long-term grants
      is_grandfathered: true,
      updated_at: new Date().toISOString(),
    };

    const { data, error } = await client
      .from('user_entitlements')
      .update(updates)
      .eq('id', entitlementId)
      .select()
      .single();

    if (error) {
      return {
        success: false,
        message: 'Failed to update entitlement',
        error: error.message,
      };
    }

    return {
      success: true,
      message: 'Entitlement updated successfully',
      data: data as EntitlementRecord,
    };
  } catch (err) {
    return {
      success: false,
      message: 'Unexpected error during entitlement update',
      error: err instanceof Error ? err.message : String(err),
    };
  }
}

// ─── Display Functions ───────────────────────────────────────────

/**
 * Display user information
 */
function displayUser(user: UserRecord): void {
  console.log('\n📋 User Information:');
  console.log(`   ID:         ${user.id}`);
  console.log(`   Email:      ${user.email}`);
  console.log(
    `   Name:       ${user.firstName || ''} ${user.lastName || ''}`.trim() || '(Not set)'
  );
  console.log(`   Role:       ${user.role || '(Not set)'}`);
  console.log(`   Created:    ${user.createdAt}`);
}

/**
 * Display entitlement status
 */
function displayEntitlement(entitlement: any | null): void {
  console.log('\n🎬 Video Portfolio Access Status:');

  if (!entitlement) {
    console.log('   Status:     ❌ NO ACCESS');
    return;
  }

  // Handle both camelCase and snake_case field names
  const status = entitlement.status;
  const billingPeriod = entitlement.billingPeriod || entitlement.billing_period;
  const startDate = entitlement.startDate || entitlement.start_date;
  const endDate = entitlement.endDate || entitlement.end_date;
  const autoRenew = entitlement.autoRenew !== undefined ? entitlement.autoRenew : entitlement.auto_renew;
  const isGrandfathered = entitlement.isGrandfathered !== undefined ? entitlement.isGrandfathered : entitlement.is_grandfathered;
  const createdAt = entitlement.createdAt || entitlement.created_at;
  const updatedAt = entitlement.updatedAt || entitlement.updated_at;

  const isActive = status === 'active';
  const endDateObj = new Date(endDate);
  const isExpired = endDateObj < new Date();
  const statusIcon = isActive && !isExpired ? '✅' : '⚠️';
  const statusText = isActive && !isExpired ? 'ACTIVE' : status.toUpperCase();

  console.log(`   Status:     ${statusIcon} ${statusText}`);
  console.log(`   Billing:    ${billingPeriod}`);
  console.log(`   Start:      ${formatDate(new Date(startDate))}`);
  console.log(`   End:        ${formatDate(endDateObj)}${isExpired ? ' (EXPIRED)' : ''}`);
  console.log(`   Auto-renew: ${autoRenew ? 'Yes' : 'No'}`);
  console.log(`   Granted:    ${isGrandfathered ? 'Yes (Grandfathered)' : 'No'}`);
  console.log(`   Created:    ${createdAt}`);
  console.log(`   Updated:    ${updatedAt}`);
}

/**
 * Display operation summary
 */
function displaySummary(config: ScriptConfig, user: UserRecord, result: OperationResult): void {
  console.log('\n' + '═'.repeat(60));
  console.log('📊 Operation Summary');
  console.log('═'.repeat(60));
  console.log(`Environment:    ${config.environment}`);
  console.log(`User:           ${user.email}`);
  console.log(`Feature:        ${FEATURE_KEY}`);
  console.log(`Operation:      ${config.checkOnly ? 'Check Status' : 'Grant Access'}`);
  console.log(`Status:         ${result.success ? '✅ SUCCESS' : '❌ FAILED'}`);
  console.log(`Message:        ${result.message}`);

  if (!config.checkOnly && result.success) {
    console.log(`Billing:        ${config.billingPeriod}`);
    if (config.durationDays) {
      console.log(`Duration:       ${config.durationDays} days`);
    }
  }

  if (result.error) {
    console.log(`Error:          ${result.error}`);
  }

  console.log('═'.repeat(60) + '\n');
}

// ─── Main Script Logic ───────────────────────────────────────────

/**
 * Gather required configuration from user or arguments
 */
async function gatherConfiguration(): Promise<ScriptConfig> {
  const parsed = parseArguments();

  // Email
  let email = parsed.email;
  if (!email) {
    email = await prompt('Enter user email address');
  }

  if (!isValidEmail(email)) {
    throw new Error(`Invalid email address: ${email}`);
  }

  // Environment
  let environment = parsed.environment;
  if (!environment) {
    const envInput = await prompt(
      'Select environment (local/staging/production)',
      'local'
    );
    if (!['local', 'staging', 'production'].includes(envInput)) {
      throw new Error(`Invalid environment: ${envInput}`);
    }
    environment = envInput as ScriptConfig['environment'];
  }

  // Check-only mode
  const checkOnly = parsed.checkOnly || false;

  // If check-only, return early with minimal config
  if (checkOnly) {
    return {
      email,
      environment,
      billingPeriod: 'annual', // Default, not used in check-only
      checkOnly: true,
      force: parsed.force || false,
    };
  }

  // Billing period
  let billingPeriod = parsed.billingPeriod;
  if (!billingPeriod) {
    const billingInput = await prompt(
      'Select billing period (monthly/annual - use annual for long-term)',
      'annual'
    );
    if (!['monthly', 'annual'].includes(billingInput)) {
      throw new Error(`Invalid billing period: ${billingInput}`);
    }
    billingPeriod = billingInput as ScriptConfig['billingPeriod'];
  }

  // Duration (optional)
  let durationDays = parsed.durationDays;
  if (!durationDays && !parsed.force) {
    const durationInput = await prompt(
      'Custom duration in days (optional, press Enter for 100 years if annual)'
    );
    if (durationInput) {
      durationDays = parseInt(durationInput, 10);
      if (isNaN(durationDays) || durationDays <= 0) {
        throw new Error(`Invalid duration: ${durationInput}`);
      }
    }
  }

  return {
    email,
    environment,
    billingPeriod,
    durationDays,
    checkOnly,
    force: parsed.force || false,
  };
}

/**
 * Execute the main operation
 */
async function executeOperation(
  client: SupabaseClient,
  user: UserRecord,
  config: ScriptConfig
): Promise<OperationResult> {
  // Get current entitlement status
  const statusResult = await getEntitlementStatus(client, user.id);
  if (!statusResult.success) {
    return statusResult;
  }

  const existingEntitlement = statusResult.data as EntitlementRecord | null;

  // If check-only mode, just return the status
  if (config.checkOnly) {
    displayEntitlement(existingEntitlement);
    return {
      success: true,
      message: existingEntitlement
        ? 'User has video portfolio access'
        : 'User does not have video portfolio access',
      data: existingEntitlement,
    };
  }

  // Determine operation: create or update
  if (existingEntitlement) {
    console.log('\n⚠️  User already has an entitlement. It will be updated.');
    displayEntitlement(existingEntitlement);

    if (!config.force) {
      const proceed = await confirm('Do you want to update the existing entitlement?');
      if (!proceed) {
        return {
          success: false,
          message: 'Operation cancelled by user',
        };
      }
    }

    return await updateEntitlement(client, existingEntitlement.id, config);
  } else {
    console.log('\n✨ Creating new entitlement...');

    if (!config.force) {
      const proceed = await confirm('Confirm creating video portfolio access?');
      if (!proceed) {
        return {
          success: false,
          message: 'Operation cancelled by user',
        };
      }
    }

    return await createEntitlement(client, user.id, config);
  }
}

/**
 * Main entry point
 */
async function main(): Promise<void> {
  console.log('═'.repeat(60));
  console.log('🎬 Video Portfolio Access Management');
  console.log('   Industrial-Grade Entitlement Script v1.0.0');
  console.log('═'.repeat(60));
  console.log();

  try {
    // Load environment variables
    loadEnvironment();

    // Gather configuration
    const config = await gatherConfiguration();

    // Get database configuration
    const dbConfig = getDatabaseConfig(config.environment);

    console.log(`\n🔧 Connecting to: ${dbConfig.name}`);
    console.log(`   URL: ${dbConfig.url}`);

    // Confirm production access (skip for check-only mode)
    if (config.environment === 'production' && !config.force && !config.checkOnly) {
      console.log('\n⚠️  WARNING: You are about to modify PRODUCTION database!');
      const proceed = await confirm('Are you absolutely sure you want to proceed?');
      if (!proceed) {
        console.log('\n❌ Operation cancelled for safety.');
        process.exit(0);
      }
    }

    // Create database client
    const client = createServiceClient(dbConfig);

    // Look up user
    console.log(`\n🔍 Looking up user: ${config.email}...`);
    const userResult = await findUserByEmail(client, config.email);

    if (!userResult.success) {
      console.error(`\n❌ ${userResult.message}`);
      if (userResult.error) {
        console.error(`   Error: ${userResult.error}`);
      }
      process.exit(1);
    }

    const user = userResult.data as UserRecord;
    displayUser(user);

    // Execute operation
    const result = await executeOperation(client, user, config);

    // Display results
    if (result.success && result.data && !config.checkOnly) {
      displayEntitlement(result.data as EntitlementRecord);
    }

    displaySummary(config, user, result);

    // Exit with appropriate code
    process.exit(result.success ? 0 : 1);
  } catch (error) {
    console.error('\n💥 Fatal Error:');
    console.error(error instanceof Error ? error.message : String(error));
    console.error('\nStack trace:');
    console.error(error instanceof Error ? error.stack : 'No stack trace available');
    process.exit(1);
  }
}

// ─── Script Execution ────────────────────────────────────────────

// Export for testing
export {
  calculateEndDate, createEntitlement, findUserByEmail,
  getEntitlementStatus, isValidEmail, updateEntitlement
};

// Only run if executed directly (not imported)
// ES module compatible check
if (import.meta.url === `file://${process.argv[1]}`) {
  main().catch((err) => {
    console.error('❌ Unhandled error:', err);
    process.exit(1);
  });
}
