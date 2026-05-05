/**
 * Embedding Regeneration Utility
 * 
 * Automatically regenerates student embeddings when profile is updated.
 * This ensures semantic search and recommendations stay up-to-date.
 * 
 * Architecture:
 * - Debounced to prevent excessive API calls
 * - Runs in background (non-blocking)
 * - Graceful error handling (doesn't break user flow)
 * - Logs for monitoring
 */

import { supabase } from '@/shared/api/supabaseClient';
import { getLogger } from '@/shared/config/logging';

const logger = getLogger('embedding-regeneration');

// Debounce map to prevent multiple simultaneous regenerations
const regenerationQueue = new Map<string, NodeJS.Timeout>();

// Configuration
const REGENERATION_CONFIG = {
  DEBOUNCE_MS: 2000, // Wait 2 seconds after last update before regenerating
  RETRY_ATTEMPTS: 2,
  RETRY_DELAY_MS: 1000,
};

/**
 * Check if embedding regeneration is needed
 * Only regenerate if significant fields changed
 */
function shouldRegenerateEmbedding(updates: Record<string, any>): boolean {
  // Fields that affect embedding quality
  const significantFields = [
    'name', 'bio', 'interests', 'hobbies', 'languages',
    'branch_field', 'course_name', 'university',
    'workExperience', 'gapReason',
    // Social links can indicate expertise
    'github_link', 'linkedin_link', 'portfolio_link',
  ];

  return significantFields.some(field => field in updates);
}

/**
 * Call the embedding API to regenerate embedding
 */
async function callEmbeddingAPI(studentId: string): Promise<boolean> {
  try {
    // Import clearAuthTokenCache for error handling
    const { clearAuthTokenCache } = await import('@/shared/api/embedding/client');
    
    const { data: { session } } = await supabase.auth.getSession();
    
    if (!session?.access_token) {
      logger.warn('No auth session for embedding regeneration', { studentId });
      return false;
    }

    // IMPORTANT: Use Pages Function URL (port 8788), NOT embedding worker URL (port 9004)
    // The Pages Function handles auth, validation, and calls the embedding worker internally
    const apiUrl = window.location.origin; // Use same origin to avoid CORS
    
    const response = await fetch(`${apiUrl}/api/career/generate-embedding`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${session.access_token}`,
      },
      body: JSON.stringify({
        table: 'students',
        id: studentId,
        fromDatabase: true, // Fetch latest data from DB
        returnEmbedding: false,
        skipDatabaseUpdate: false, // Save to DB
      }),
    });

    if (!response.ok) {
      // Clear token cache on auth errors
      if (response.status === 401 || response.status === 403) {
        clearAuthTokenCache();
      }
      
      const error = await response.json().catch(() => ({ error: 'Unknown error' }));
      logger.error('Embedding API error', new Error(error.error || 'API error'), {
        studentId,
        status: response.status,
      });
      return false;
    }

    const result = await response.json();
    logger.info('Embedding regenerated successfully', {
      studentId,
      dimensions: result.dimensions,
      mode: result.mode,
    });

    return true;
  } catch (error) {
    logger.error('Failed to call embedding API', error as Error, { studentId });
    return false;
  }
}

/**
 * Regenerate embedding with retry logic
 */
async function regenerateWithRetry(studentId: string): Promise<void> {
  for (let attempt = 1; attempt <= REGENERATION_CONFIG.RETRY_ATTEMPTS; attempt++) {
    const success = await callEmbeddingAPI(studentId);
    
    if (success) {
      return;
    }

    if (attempt < REGENERATION_CONFIG.RETRY_ATTEMPTS) {
      logger.warn(`Embedding regeneration attempt ${attempt} failed, retrying...`, {
        studentId,
        nextAttempt: attempt + 1,
      });
      await new Promise(resolve => 
        setTimeout(resolve, REGENERATION_CONFIG.RETRY_DELAY_MS * attempt)
      );
    }
  }

  logger.error('Embedding regeneration failed after all retries', new Error('Max retries exceeded'), {
    studentId,
    attempts: REGENERATION_CONFIG.RETRY_ATTEMPTS,
  });
}

/**
 * Queue embedding regeneration (debounced)
 * 
 * This is the main function to call after profile updates.
 * It debounces multiple rapid updates and runs regeneration in background.
 * 
 * @param studentId - Student UUID
 * @param updates - Fields that were updated
 * @param options - Configuration options
 */
export async function queueEmbeddingRegeneration(
  studentId: string,
  updates: Record<string, any>,
  options: {
    force?: boolean; // Force regeneration even if fields don't seem significant
    immediate?: boolean; // Skip debouncing
  } = {}
): Promise<void> {
  const { force = false, immediate = false } = options;

  // Check if regeneration is needed
  if (!force && !shouldRegenerateEmbedding(updates)) {
    logger.debug('Skipping embedding regeneration - no significant changes', {
      studentId,
      updatedFields: Object.keys(updates),
    });
    return;
  }

  // Clear existing debounce timer
  const existingTimer = regenerationQueue.get(studentId);
  if (existingTimer) {
    clearTimeout(existingTimer);
  }

  // Execute immediately or debounce
  if (immediate) {
    logger.info('Immediate embedding regeneration triggered', { studentId });
    // Run in background (don't await)
    regenerateWithRetry(studentId).catch(error => {
      logger.error('Background embedding regeneration failed', error as Error, { studentId });
    });
  } else {
    // Debounce: wait for user to finish making changes
    const timer = setTimeout(() => {
      logger.info('Debounced embedding regeneration triggered', { studentId });
      regenerationQueue.delete(studentId);
      
      // Run in background (don't await)
      regenerateWithRetry(studentId).catch(error => {
        logger.error('Background embedding regeneration failed', error as Error, { studentId });
      });
    }, REGENERATION_CONFIG.DEBOUNCE_MS);

    regenerationQueue.set(studentId, timer);
    
    logger.debug('Embedding regeneration queued', {
      studentId,
      debounceMs: REGENERATION_CONFIG.DEBOUNCE_MS,
    });
  }
}

/**
 * Force immediate embedding regeneration
 * Use this for critical updates that need immediate processing
 */
export async function forceEmbeddingRegeneration(studentId: string): Promise<boolean> {
  logger.info('Force embedding regeneration', { studentId });
  
  try {
    await regenerateWithRetry(studentId);
    return true;
  } catch (error) {
    logger.error('Force embedding regeneration failed', error as Error, { studentId });
    return false;
  }
}

/**
 * Cancel pending regeneration
 * Useful when user navigates away or logs out
 */
export function cancelPendingRegeneration(studentId: string): void {
  const timer = regenerationQueue.get(studentId);
  if (timer) {
    clearTimeout(timer);
    regenerationQueue.delete(studentId);
    logger.debug('Cancelled pending embedding regeneration', { studentId });
  }
}

/**
 * Clear all pending regenerations
 * Call this on app unmount or logout
 */
export function clearAllPendingRegenerations(): void {
  regenerationQueue.forEach((timer, studentId) => {
    clearTimeout(timer);
    logger.debug('Cleared pending regeneration', { studentId });
  });
  regenerationQueue.clear();
}
