#!/usr/bin/env npx tsx
/**
 * Batch Unlock Video Portfolio Access
 *
 * Industrial-Grade Batch Processing Script
 *
 * Purpose:
 *   Unlock video portfolio access for multiple users from a list.
 *   Provides detailed progress tracking, error handling, and summary reporting.
 *
 * Usage:
 *   # From file (one email per line):
 *   npx tsx scripts/batch-unlock-video-portfolio.ts emails.txt --env=production
 *
 *   # Inline list:
 *   npx tsx scripts/batch-unlock-video-portfolio.ts --emails="user1@email.com,user2@email.com" --env=production
 *
 *   # Dry run (check status only, no modifications):
 *   npx tsx scripts/batch-unlock-video-portfolio.ts emails.txt --env=production --dry-run
 *
 * Arguments:
 *   file_path              Path to file with emails (one per line)
 *   --emails=<list>        Comma-separated email list
 *   --env=<environment>    Environment: local, staging, production (default: production)
 *   --billing=<period>     Billing period: monthly, annual (default: annual)
 *   --dry-run              Check status only, don't unlock
 *   --continue-on-error    Continue processing even if some fail
 *
 * @author Industrial Standards Script Generator
 * @version 1.0.0
 * @date 2026-09-28
 */

import { createClient, SupabaseClient } from '@supabase/supabase-js';
import * as fs from 'node:fs';
import * as path from 'node:path';
import * as dotenv from 'dotenv';

// ─── Types ───────────────────────────────────────────────────────

interface BatchConfig {
  emails: string[];
  environment: 'local' | 'staging' | 'production';
  billingPeriod: 'monthly' | 'annual';
  dryRun: boolean;
  continueOnError: boolean;
}

interface DatabaseConfig {
  url: string;
  serviceRoleKey: string;
  name: string;
}

interface ProcessResult {
  email: string;
  success: boolean;
  action: 'already_active' | 'unlocked' | 'failed' | 'not_found';
  message: string;
  error?: string;
}

interface BatchSummary {
  total: number;
  succeeded: number;
  failed: number;
  alreadyActive: number;
  notFound: number;
  results: ProcessResult[];
  startTime: Date;
  endTime: Date;
  duration: string;
}

// ─── Constants ───────────────────────────────────────────────────

const FEATURE_KEY = 'video_portfolio';

// ─── Utility Functions ───────────────────────────────────────────

function loadEnvironment(): void {
  dotenv.config({ path: '.env' });
  dotenv.config({ path: '.env.local', override: true });
  dotenv.config({ path: '.env.production', override: true });
}

function parseArguments(): Partial<BatchConfig> & { filePath?: string } {
  const args = process.argv.slice(2);
  const config: Partial<BatchConfig> & { filePath?: string } = {
    environment: 'production',
    billingPeriod: 'annual',
    dryRun: false,
    continueOnError: true,
  };

  // First non-flag argument is the file path
  if (args[0] && !args[0].startsWith('--')) {
    config.filePath = args[0];
  }

  for (const arg of args) {
    if (arg.startsWith('--emails=')) {
      const emailStr = arg.split('=')[1];
      config.emails = emailStr.split(',').map(e => e.trim()).filter(e => e);
    } else if (arg.startsWith('--env=')) {
      const env = arg.split('=')[1] as BatchConfig['environment'];
      if (['local', 'staging', 'production'].includes(env)) {
        config.environment = env;
      }
    } else if (arg.startsWith('--billing=')) {
      const billing = arg.split('=')[1] as BatchConfig['billingPeriod'];
      if (['monthly', 'annual'].includes(billing)) {
        config.billingPeriod = billing;
      }
    } else if (arg === '--dry-run') {
      config.dryRun = true;
    } else if (arg === '--continue-on-error') {
      config.continueOnError = true;
    } else if (arg === '--stop-on-error') {
      config.continueOnError = false;
    }
  }

  return config;
}

function readEmailsFromFile(filePath: string): string[] {
  try {
    const fullPath = path.isAbsolute(filePath) ? filePath : path.resolve(process.cwd(), filePath);
    const content = fs.readFileSync(fullPath, 'utf-8');
    return content
      .split('\n')
      .map(line => line.trim())
      .filter(line => line && !line.startsWith('#') && line.includes('@'));
  } catch (error) {
    throw new Error(`Failed to read file: ${filePath}\n${error instanceof Error ? error.message : String(error)}`);
  }
}

function isValidEmail(email: string): boolean {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
}

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
      envKey: 'SUPABASE_SERVICE_ROLE_KEY',
    },
  };
  return configs[environment as keyof typeof configs];
}

function getDatabaseConfig(environment: BatchConfig['environment']): DatabaseConfig {
  const config = getDbConfig(environment);
  let serviceRoleKey = process.env[config.envKey];

  if (environment === 'local' && !serviceRoleKey) {
    serviceRoleKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS1kZW1vIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImV4cCI6MTk4MzgxMjk5Nn0.EGIM96RAZx35lJzdJsyH-qQwv8Hdp7fsn3W0YpN81IU';
  }

  if (!config.url) {
    throw new Error(`Database URL not configured for ${environment}`);
  }

  if (!serviceRoleKey) {
    throw new Error(`Service role key not found for ${environment}`);
  }

  return {
    url: config.url,
    serviceRoleKey,
    name: config.name,
  };
}

function createServiceClient(config: DatabaseConfig): SupabaseClient {
  return createClient(config.url, config.serviceRoleKey, {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
    },
  });
}

function calculateEndDate(startDate: Date, billingPeriod: BatchConfig['billingPeriod']): Date {
  const endDate = new Date(startDate);
  // Grant 100 years for long-term access
  endDate.setFullYear(endDate.getFullYear() + 100);
  return endDate;
}

function formatDuration(ms: number): string {
  const seconds = Math.floor(ms / 1000);
  const minutes = Math.floor(seconds / 60);
  const remainingSeconds = seconds % 60;

  if (minutes > 0) {
    return `${minutes}m ${remainingSeconds}s`;
  }
  return `${remainingSeconds}s`;
}

// ─── Database Operations ─────────────────────────────────────────

async function findUserByEmail(client: SupabaseClient, email: string): Promise<any | null> {
  const { data, error } = await client
    .from('users')
    .select('id, email, "firstName", "lastName"')
    .eq('email', email.toLowerCase())
    .maybeSingle();

  if (error) {
    throw new Error(`Database query failed: ${error.message}`);
  }

  return data;
}

async function getEntitlementStatus(client: SupabaseClient, userId: string): Promise<any | null> {
  const { data, error } = await client
    .from('user_entitlements')
    .select('*')
    .eq('user_id', userId)
    .eq('feature_key', FEATURE_KEY)
    .maybeSingle();

  if (error) {
    throw new Error(`Failed to query entitlement: ${error.message}`);
  }

  return data;
}

async function createEntitlement(
  client: SupabaseClient,
  userId: string,
  config: BatchConfig
): Promise<void> {
  const startDate = new Date();
  const endDate = calculateEndDate(startDate, config.billingPeriod);

  const entitlement = {
    user_id: userId,
    feature_key: FEATURE_KEY,
    status: 'active',
    billing_period: config.billingPeriod,
    start_date: startDate.toISOString(),
    end_date: endDate.toISOString(),
    auto_renew: false,
    price_at_purchase: 0,
    is_grandfathered: true,
    granted_by_organization: false,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  };

  const { error } = await client
    .from('user_entitlements')
    .insert(entitlement);

  if (error) {
    throw new Error(`Failed to create entitlement: ${error.message}`);
  }
}

// ─── Processing Functions ────────────────────────────────────────

async function processEmail(
  client: SupabaseClient,
  email: string,
  config: BatchConfig,
  index: number,
  total: number
): Promise<ProcessResult> {
  const progress = `[${index + 1}/${total}]`;

  try {
    // Validate email format
    if (!isValidEmail(email)) {
      return {
        email,
        success: false,
        action: 'failed',
        message: 'Invalid email format',
      };
    }

    // Find user
    const user = await findUserByEmail(client, email);
    if (!user) {
      return {
        email,
        success: false,
        action: 'not_found',
        message: 'User not found in database',
      };
    }

    // Check existing entitlement
    const existingEntitlement = await getEntitlementStatus(client, user.id);

    if (existingEntitlement && existingEntitlement.status === 'active') {
      const endDate = new Date(existingEntitlement.end_date || existingEntitlement.endDate);
      const isExpired = endDate < new Date();

      if (!isExpired) {
        return {
          email,
          success: true,
          action: 'already_active',
          message: `Already has active access until ${endDate.toISOString().split('T')[0]}`,
        };
      }
    }

    // Dry run - don't actually unlock
    if (config.dryRun) {
      return {
        email,
        success: true,
        action: 'unlocked',
        message: 'Would unlock access (dry run)',
      };
    }

    // Create entitlement
    await createEntitlement(client, user.id, config);

    return {
      email,
      success: true,
      action: 'unlocked',
      message: 'Video portfolio access granted',
    };
  } catch (error) {
    return {
      email,
      success: false,
      action: 'failed',
      message: 'Processing error',
      error: error instanceof Error ? error.message : String(error),
    };
  }
}

async function processBatch(
  client: SupabaseClient,
  config: BatchConfig
): Promise<BatchSummary> {
  const startTime = new Date();
  const results: ProcessResult[] = [];

  console.log(`\n🔄 Processing ${config.emails.length} emails...\n`);

  for (let i = 0; i < config.emails.length; i++) {
    const email = config.emails[i];
    const result = await processEmail(client, email, config, i, config.emails.length);
    results.push(result);

    // Display progress
    const icon = result.success
      ? result.action === 'already_active'
        ? '✓'
        : '✅'
      : '❌';
    console.log(
      `${icon} [${i + 1}/${config.emails.length}] ${email.padEnd(40)} - ${result.message}`
    );

    if (result.error) {
      console.log(`   Error: ${result.error}`);
    }

    // Stop on error if configured
    if (!result.success && !config.continueOnError) {
      console.log('\n⚠️  Stopping batch due to error (--stop-on-error flag)');
      break;
    }
  }

  const endTime = new Date();
  const duration = formatDuration(endTime.getTime() - startTime.getTime());

  return {
    total: config.emails.length,
    succeeded: results.filter(r => r.success && r.action === 'unlocked').length,
    failed: results.filter(r => !r.success).length,
    alreadyActive: results.filter(r => r.action === 'already_active').length,
    notFound: results.filter(r => r.action === 'not_found').length,
    results,
    startTime,
    endTime,
    duration,
  };
}

// ─── Display Functions ───────────────────────────────────────────

function displaySummary(summary: BatchSummary, config: BatchConfig): void {
  console.log('\n' + '═'.repeat(70));
  console.log('📊 Batch Processing Summary');
  console.log('═'.repeat(70));
  console.log(`Environment:        ${config.environment}`);
  console.log(`Mode:               ${config.dryRun ? 'DRY RUN (no changes)' : 'PRODUCTION'}`);
  console.log(`Feature:            ${FEATURE_KEY}`);
  console.log(`Billing Period:     ${config.billingPeriod}`);
  console.log(`Duration:           100 years`);
  console.log('');
  console.log(`Total Emails:       ${summary.total}`);
  console.log(`✅ Unlocked:         ${summary.succeeded}`);
  console.log(`✓  Already Active:   ${summary.alreadyActive}`);
  console.log(`❌ Failed:           ${summary.failed}`);
  console.log(`👤 Not Found:        ${summary.notFound}`);
  console.log('');
  console.log(`Start Time:         ${summary.startTime.toISOString()}`);
  console.log(`End Time:           ${summary.endTime.toISOString()}`);
  console.log(`Duration:           ${summary.duration}`);

  if (summary.failed > 0) {
    console.log('\n❌ Failed Emails:');
    summary.results
      .filter(r => !r.success)
      .forEach(r => {
        console.log(`   - ${r.email}: ${r.message}`);
        if (r.error) {
          console.log(`     ${r.error}`);
        }
      });
  }

  if (summary.notFound > 0) {
    console.log('\n👤 Not Found in Database:');
    summary.results
      .filter(r => r.action === 'not_found')
      .forEach(r => {
        console.log(`   - ${r.email}`);
      });
  }

  console.log('═'.repeat(70));

  if (config.dryRun) {
    console.log('\n💡 This was a DRY RUN. No changes were made.');
    console.log('   Remove --dry-run flag to actually unlock access.\n');
  }
}

function saveReport(summary: BatchSummary, config: BatchConfig): string {
  const timestamp = new Date().toISOString().replace(/[:.]/g, '-').split('T')[0];
  const filename = `batch-unlock-report-${timestamp}.json`;
  const reportPath = path.join(process.cwd(), 'scripts', filename);

  const report = {
    metadata: {
      timestamp: new Date().toISOString(),
      environment: config.environment,
      feature: FEATURE_KEY,
      billingPeriod: config.billingPeriod,
      dryRun: config.dryRun,
    },
    summary: {
      total: summary.total,
      succeeded: summary.succeeded,
      failed: summary.failed,
      alreadyActive: summary.alreadyActive,
      notFound: summary.notFound,
      duration: summary.duration,
    },
    results: summary.results,
  };

  fs.writeFileSync(reportPath, JSON.stringify(report, null, 2));
  return reportPath;
}

// ─── Main ─────────────────────────────────────────────────────────

async function main(): Promise<void> {
  console.log('═'.repeat(70));
  console.log('🎬 Batch Video Portfolio Access Management');
  console.log('   Industrial-Grade Batch Processing v1.0.0');
  console.log('═'.repeat(70));

  try {
    // Load environment
    loadEnvironment();

    // Parse arguments
    const parsed = parseArguments();

    // Get emails from file or argument
    let emails: string[] = [];

    if (parsed.filePath) {
      console.log(`\n📂 Reading emails from: ${parsed.filePath}`);
      emails = readEmailsFromFile(parsed.filePath);
    } else if (parsed.emails) {
      emails = parsed.emails;
    } else {
      console.error('\n❌ No emails provided!');
      console.log('\nUsage:');
      console.log('  npx tsx scripts/batch-unlock-video-portfolio.ts emails.txt --env=production');
      console.log('  npx tsx scripts/batch-unlock-video-portfolio.ts --emails="user1@email.com,user2@email.com"');
      process.exit(1);
    }

    if (emails.length === 0) {
      console.error('\n❌ No valid emails found!');
      process.exit(1);
    }

    const config: BatchConfig = {
      emails,
      environment: parsed.environment!,
      billingPeriod: parsed.billingPeriod!,
      dryRun: parsed.dryRun!,
      continueOnError: parsed.continueOnError!,
    };

    console.log(`\n📧 Found ${emails.length} email(s)`);

    // Get database config
    const dbConfig = getDatabaseConfig(config.environment);
    console.log(`\n🔧 Connecting to: ${dbConfig.name}`);
    console.log(`   URL: ${dbConfig.url}`);

    if (config.dryRun) {
      console.log('\n💡 DRY RUN MODE - No changes will be made');
    } else if (config.environment === 'production') {
      console.log('\n⚠️  WARNING: Running in PRODUCTION mode!');
      console.log(`   ${emails.length} users will have video portfolio access unlocked.`);
    }

    // Create client
    const client = createServiceClient(dbConfig);

    // Process batch
    const summary = await processBatch(client, config);

    // Display summary
    displaySummary(summary, config);

    // Save report
    if (!config.dryRun) {
      const reportPath = saveReport(summary, config);
      console.log(`\n📄 Report saved: ${reportPath}\n`);
    }

    // Exit with appropriate code
    const exitCode = summary.failed > 0 ? 1 : 0;
    process.exit(exitCode);
  } catch (error) {
    console.error('\n💥 Fatal Error:');
    console.error(error instanceof Error ? error.message : String(error));
    process.exit(1);
  }
}

// ─── Script Execution ────────────────────────────────────────────

if (import.meta.url === `file://${process.argv[1]}`) {
  main().catch((err) => {
    console.error('❌ Unhandled error:', err);
    process.exit(1);
  });
}

export { processBatch, processEmail };
