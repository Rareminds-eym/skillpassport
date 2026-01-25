/**
 * Automated countdown email processing for CRON jobs
 * Uses parallel processing with batching for improved performance
 */

import { 
  createSupabaseClient,
  getAllPreRegistrations
} from '../services/supabase.js';
import { calculateDaysUntilLaunch } from '../utils/date.js';
import { COUNTDOWN_DAYS } from '../config/constants.js';
import { processIndividualCountdownEmail } from './email-processor-helper.js';
import { processBatch, logBatchSummary } from '../utils/batch.js';
import { cleanupStuckRecords } from './cleanup-stuck-records.js';

// Configuration for batch processing
// Adjust these values based on email volume:
// - 12-50 emails: BATCH_SIZE=12, BATCH_DELAY_MS=0
// - 50-200 emails: BATCH_SIZE=15, BATCH_DELAY_MS=50
// - 200-500 emails: BATCH_SIZE=20, BATCH_DELAY_MS=0
// - 500+ emails: Use Cloudflare Queues (see SCALING_TO_500_EMAILS.md)

const BATCH_SIZE = 12;       // Process all 12 emails at once
const BATCH_DELAY_MS = 0;    // No delay needed for small batch

export async function processCountdownEmails(env) {
  const supabase = createSupabaseClient(env);
  if (!supabase) {
    console.error('Supabase configuration missing');
    return;
  }

  const launchDate = env.LAUNCH_DATE || '2026-02-01';
  const daysUntilLaunch = calculateDaysUntilLaunch(launchDate);

  console.log(`Days until launch: ${daysUntilLaunch}`);

  // Only send emails on specific countdown days
  if (!COUNTDOWN_DAYS.includes(daysUntilLaunch)) {
    console.log(`Not a countdown day. Skipping email send.`);
    return;
  }

  console.log(`Countdown day ${daysUntilLaunch} - Processing emails...`);

  // Clean up any stuck records from previous runs
  await cleanupStuckRecords(env, 5);

  const { data: preRegistrations, error: fetchError } = await getAllPreRegistrations(supabase);

  if (fetchError) {
    console.error('Error fetching pre-registrations:', fetchError);
    return;
  }

  console.log(`Found ${preRegistrations?.length || 0} pre-registrations`);

  if (!preRegistrations || preRegistrations.length === 0) {
    console.log('No pre-registrations to process');
    return;
  }

  // Process emails in parallel batches for better performance
  const startTime = Date.now();
  
  const results = await processBatch(
    preRegistrations,
    (preReg) => processIndividualCountdownEmail(supabase, env, preReg, daysUntilLaunch, launchDate),
    BATCH_SIZE,
    BATCH_DELAY_MS
  );

  const duration = ((Date.now() - startTime) / 1000).toFixed(2);
  
  // Log summary
  logBatchSummary(results, 'Countdown Email Processing');
  console.log(`Total processing time: ${duration}s`);
  console.log('Countdown email processing completed');
}
