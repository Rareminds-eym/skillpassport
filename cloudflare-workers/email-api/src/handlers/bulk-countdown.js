/**
 * Bulk countdown email handler
 * POST /send-bulk-countdown
 */

import { 
  createSupabaseClient, 
  getAllPreRegistrations
} from '../services/supabase.js';
import { processBulkEmails } from '../services/bulk-processor.js';
import { successResponse, errorResponse } from '../utils/response.js';

export async function handleBulkCountdownEmail(body, env) {
  const { countdownDay, launchDate } = body;

  if (!countdownDay || !launchDate) {
    return errorResponse(
      'Missing required fields: countdownDay, launchDate',
      null,
      400
    );
  }

  const supabase = createSupabaseClient(env);
  if (!supabase) {
    return errorResponse('Supabase not configured');
  }

  try {
    const { data: preRegistrations, error: fetchError } = await getAllPreRegistrations(supabase);

    if (fetchError) {
      console.error('Error fetching pre-registrations:', fetchError);
      return errorResponse('Failed to fetch pre-registrations', fetchError.message);
    }

    if (!preRegistrations || preRegistrations.length === 0) {
      return successResponse('No pre-registrations found', {
        sent: 0,
        skipped: 0,
        failed: 0
      });
    }

    console.log(`Found ${preRegistrations.length} pre-registrations`);

    const results = await processBulkEmails(supabase, env, preRegistrations, countdownDay, launchDate);

    console.log(`Bulk email completed: ${results.sent} sent, ${results.skipped} skipped, ${results.failed} failed`);

    return successResponse('Bulk countdown emails processed', {
      summary: {
        total: results.total,
        sent: results.sent,
        skipped: results.skipped,
        failed: results.failed
      },
      details: results.details
    });

  } catch (error) {
    console.error('Error in handleBulkCountdownEmail:', error);
    return errorResponse('Failed to send bulk countdown emails', error.message);
  }
}
