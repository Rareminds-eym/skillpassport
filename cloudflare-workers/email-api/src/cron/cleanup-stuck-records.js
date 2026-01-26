/**
 * Cleanup utility for stuck email records
 * Marks records stuck in "sending" status as "failed" after a timeout period
 */

import { createSupabaseClient } from '../services/supabase.js';
import { EMAIL_STATUS } from '../config/constants.js';

/**
 * Clean up records stuck in "sending" status
 * @param {Object} env - Environment variables
 * @param {number} timeoutMinutes - Minutes after which a "sending" record is considered stuck
 * @returns {Promise<number>} Number of records cleaned up
 */
export async function cleanupStuckRecords(env, timeoutMinutes = 5) {
  const supabase = createSupabaseClient(env);
  if (!supabase) {
    console.error('Supabase configuration missing for cleanup');
    return 0;
  }

  console.log(`Checking for records stuck in "sending" status for >${timeoutMinutes} minutes...`);

  // Calculate cutoff time
  const cutoffTime = new Date();
  cutoffTime.setMinutes(cutoffTime.getMinutes() - timeoutMinutes);
  const cutoffISO = cutoffTime.toISOString();

  try {
    // Find stuck records
    const { data: stuckRecords, error: fetchError } = await supabase
      .from('pre_registration_email_tracking')
      .select('id, pre_registration_id, created_at, metadata')
      .eq('email_status', EMAIL_STATUS.SENDING)
      .lt('created_at', cutoffISO);

    if (fetchError) {
      console.error('Error fetching stuck records:', fetchError);
      return 0;
    }

    if (!stuckRecords || stuckRecords.length === 0) {
      console.log('No stuck records found');
      return 0;
    }

    console.log(`Found ${stuckRecords.length} stuck records, marking as failed...`);

    // Update stuck records to failed status
    const { error: updateError } = await supabase
      .from('pre_registration_email_tracking')
      .update({
        email_status: EMAIL_STATUS.FAILED,
        failed_at: new Date().toISOString(),
        error_message: `Timeout: Stuck in sending status for >${timeoutMinutes} minutes`,
        retry_count: 1
      })
      .eq('email_status', EMAIL_STATUS.SENDING)
      .lt('created_at', cutoffISO);

    if (updateError) {
      console.error('Error updating stuck records:', updateError);
      return 0;
    }

    console.log(`✓ Cleaned up ${stuckRecords.length} stuck records`);
    return stuckRecords.length;

  } catch (error) {
    console.error('Error in cleanup process:', error);
    return 0;
  }
}
