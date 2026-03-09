/**
 * Batch processing utilities for parallel operations
 */

import type { BatchProcessor, BatchResult } from '../types';

/**
 * Process items in batches with controlled concurrency
 */
export async function processBatch<T>(
  items: T[],
  processor: BatchProcessor<T>,
  batchSize: number = 5,
  delayMs: number = 100
): Promise<BatchResult[]> {
  const results: BatchResult[] = [];
  
  for (let i = 0; i < items.length; i += batchSize) {
    const batch = items.slice(i, i + batchSize);
    console.log(`Processing batch ${Math.floor(i / batchSize) + 1}/${Math.ceil(items.length / batchSize)} (${batch.length} items)`);
    
    // Process batch in parallel using Promise.allSettled
    const batchResults = await Promise.allSettled(
      batch.map(item => processor(item))
    );
    
    results.push(...batchResults);
    
    // Log batch results
    const succeeded = batchResults.filter(r => r.status === 'fulfilled').length;
    const failed = batchResults.filter(r => r.status === 'rejected').length;
    console.log(`Batch complete: ${succeeded} succeeded, ${failed} failed`);
    
    // Add delay between batches to avoid rate limiting
    if (i + batchSize < items.length && delayMs > 0) {
      await new Promise(resolve => setTimeout(resolve, delayMs));
    }
  }
  
  return results;
}

/**
 * Log summary of batch processing results
 */
export function logBatchSummary(results: BatchResult[], operationName: string = 'operation'): void {
  const succeeded = results.filter(r => r.status === 'fulfilled').length;
  const failed = results.filter(r => r.status === 'rejected').length;
  
  console.log(`\n${operationName} Summary:`);
  console.log(`  Total: ${results.length}`);
  console.log(`  ✓ Succeeded: ${succeeded}`);
  console.log(`  ✗ Failed: ${failed}`);
  
  // Log failed items with reasons
  if (failed > 0) {
    console.log('\nFailed items:');
    results.forEach((result, index) => {
      if (result.status === 'rejected') {
        console.log(`  ${index + 1}. ${result.reason?.message || result.reason}`);
      }
    });
  }
}
