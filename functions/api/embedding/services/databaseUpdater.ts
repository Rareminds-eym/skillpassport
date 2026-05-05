/**
 * Database Updater Service
 * 
 * Handles all database operations for embeddings.
 * This is the ONLY place that should update embedding columns in the database.
 */

import { SupabaseClient } from '@supabase/supabase-js';
import { EmbeddingError } from '../types';
import { EMBEDDING_CONFIG, ALLOWED_TABLES, AllowedTable } from '../config/constants';

/**
 * Validate embedding vector
 * 
 * @param embedding - Embedding vector to validate
 * @throws EmbeddingError if validation fails
 */
function validateEmbeddingVector(embedding: number[]): void {
  // Check if input is a non-empty array
  if (!Array.isArray(embedding) || embedding.length === 0) {
    throw new EmbeddingError(
      'Invalid embedding: must be a non-empty array',
      'INVALID_RESPONSE',
      { 
        actualType: Array.isArray(embedding) ? 'empty array' : typeof embedding,
        expectedDimensions: EMBEDDING_CONFIG.EXPECTED_DIMENSIONS
      }
    );
  }

  // Check if length matches expected dimensions
  if (embedding.length !== EMBEDDING_CONFIG.EXPECTED_DIMENSIONS) {
    throw new EmbeddingError(
      `Invalid embedding dimensions: expected ${EMBEDDING_CONFIG.EXPECTED_DIMENSIONS}, got ${embedding.length}`,
      'INVALID_RESPONSE',
      { 
        actualDimensions: embedding.length,
        expectedDimensions: EMBEDDING_CONFIG.EXPECTED_DIMENSIONS
      }
    );
  }

  // Check if every element is a finite number
  for (let i = 0; i < embedding.length; i++) {
    const value = embedding[i];
    if (typeof value !== 'number' || !Number.isFinite(value)) {
      throw new EmbeddingError(
        `Invalid embedding value at index ${i}: must be a finite number`,
        'INVALID_RESPONSE',
        { 
          index: i,
          value: value,
          type: typeof value,
          expectedDimensions: EMBEDDING_CONFIG.EXPECTED_DIMENSIONS
        }
      );
    }
  }
}

/**
 * Update embedding in database
 * 
 * @param supabase - Supabase client (with service role key)
 * @param table - Table name (students, skills, opportunities, courses)
 * @param id - Record ID
 * @param embedding - Embedding vector
 * @returns Success status and affected rows
 */
export async function updateEmbedding(
  supabase: SupabaseClient,
  table: string,
  id: string,
  embedding: number[]
): Promise<{ success: boolean; rowsAffected: number; error?: string }> {
  try {
    // Validate table name
    if (!ALLOWED_TABLES.includes(table as AllowedTable)) {
      throw new EmbeddingError(
        `Invalid table name: ${table}. Allowed tables: ${ALLOWED_TABLES.join(', ')}`,
        'API_ERROR',
        { 
          table,
          allowedTables: ALLOWED_TABLES
        }
      );
    }

    // Validate embedding vector
    validateEmbeddingVector(embedding);

    console.log(`[DatabaseUpdater] Updating ${table} #${id} with ${embedding.length}D vector`);

    const { data, error: updateError } = await supabase
      .from(table)
      .update({ embedding })
      .eq('id', id)
      .select();

    if (updateError) {
      console.error('[DatabaseUpdater] Update failed:', updateError);
      throw new EmbeddingError(
        `Database update failed: ${updateError.message}`,
        'API_ERROR',
        { 
          table, 
          id, 
          code: updateError.code,
          details: updateError.details 
        }
      );
    }

    if (!data) {
      console.error('[DatabaseUpdater] Update succeeded but no data returned');
      throw new EmbeddingError(
        'Database update succeeded but no data returned',
        'API_ERROR',
        { table, id }
      );
    }

    const rowsAffected = data.length;
    console.log(`[DatabaseUpdater] Updated ${table} #${id}. Rows affected: ${rowsAffected}`);

    return {
      success: true,
      rowsAffected
    };

  } catch (error) {
    if (error instanceof EmbeddingError) {
      throw error;
    }

    const errorMessage = error instanceof Error ? error.message : String(error);
    throw new EmbeddingError(
      `Failed to update embedding: ${errorMessage}`,
      'API_ERROR',
      { table, id, originalError: error }
    );
  }
}

/**
 * Batch update embeddings for multiple records
 * 
 * @param supabase - Supabase client
 * @param table - Table name
 * @param updates - Array of {id, embedding} pairs
 * @returns Results for each update
 */
export async function batchUpdateEmbeddings(
  supabase: SupabaseClient,
  table: string,
  updates: Array<{ id: string; embedding: number[] }>
): Promise<Array<{ id: string; success: boolean; error?: string }>> {
  console.log(`[DatabaseUpdater] Batch updating ${updates.length} records in ${table}`);

  const results = await Promise.all(
    updates.map(async ({ id, embedding }) => {
      try {
        await updateEmbedding(supabase, table, id, embedding);
        return { id, success: true };
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : String(error);
        console.error(`[DatabaseUpdater] Failed to update ${table} #${id}:`, errorMessage);
        return { id, success: false, error: errorMessage };
      }
    })
  );

  const successCount = results.filter(r => r.success).length;
  console.log(`[DatabaseUpdater] Batch update complete: ${successCount}/${updates.length} successful`);

  return results;
}

/**
 * Check if record has embedding
 * 
 * @param supabase - Supabase client
 * @param table - Table name
 * @param id - Record ID
 * @returns True if embedding exists
 */
export async function hasEmbedding(
  supabase: SupabaseClient,
  table: string,
  id: string
): Promise<boolean> {
  try {
    const { data, error } = await supabase
      .from(table)
      .select('embedding')
      .eq('id', id)
      .single();

    if (error || !data) {
      return false;
    }

    return data.embedding !== null;

  } catch (error) {
    console.error(`[DatabaseUpdater] Error checking embedding for ${table} #${id}:`, error);
    return false;
  }
}

/**
 * Get embedding from database
 * 
 * @param supabase - Supabase client
 * @param table - Table name
 * @param id - Record ID
 * @returns Embedding vector or null
 */
export async function getEmbedding(
  supabase: SupabaseClient,
  table: string,
  id: string
): Promise<number[] | null> {
  try {
    const { data, error } = await supabase
      .from(table)
      .select('embedding')
      .eq('id', id)
      .single();

    if (error || !data || !data.embedding) {
      return null;
    }

    return data.embedding;

  } catch (error) {
    console.error(`[DatabaseUpdater] Error fetching embedding for ${table} #${id}:`, error);
    return null;
  }
}

/**
 * Delete embedding from database (set to null)
 * 
 * @param supabase - Supabase client
 * @param table - Table name
 * @param id - Record ID
 * @returns Success status
 */
export async function deleteEmbedding(
  supabase: SupabaseClient,
  table: string,
  id: string
): Promise<{ success: boolean; error?: string }> {
  try {
    console.log(`[DatabaseUpdater] Deleting embedding for ${table} #${id}`);

    const { error: updateError } = await supabase
      .from(table)
      .update({ embedding: null })
      .eq('id', id);

    if (updateError) {
      throw new Error(updateError.message);
    }

    console.log(`[DatabaseUpdater] Deleted embedding for ${table} #${id}`);
    return { success: true };

  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    console.error(`[DatabaseUpdater] Failed to delete embedding:`, errorMessage);
    return { success: false, error: errorMessage };
  }
}

/**
 * Get embedding statistics for a table
 * 
 * @param supabase - Supabase client
 * @param table - Table name
 * @returns Statistics about embeddings
 */
export async function getEmbeddingStats(
  supabase: SupabaseClient,
  table: string
): Promise<{
  total: number;
  withEmbedding: number;
  withoutEmbedding: number;
  percentage: number;
}> {
  try {
    // Get total count
    const { count: total } = await supabase
      .from(table)
      .select('*', { count: 'exact', head: true });

    // Get count with embeddings
    const { count: withEmbedding } = await supabase
      .from(table)
      .select('*', { count: 'exact', head: true })
      .not('embedding', 'is', null);

    const totalCount = total || 0;
    const withEmbeddingCount = withEmbedding || 0;
    const withoutEmbeddingCount = totalCount - withEmbeddingCount;
    const percentage = totalCount > 0 ? (withEmbeddingCount / totalCount) * 100 : 0;

    return {
      total: totalCount,
      withEmbedding: withEmbeddingCount,
      withoutEmbedding: withoutEmbeddingCount,
      percentage: Math.round(percentage * 100) / 100
    };

  } catch (error) {
    console.error(`[DatabaseUpdater] Error getting stats for ${table}:`, error);
    return {
      total: 0,
      withEmbedding: 0,
      withoutEmbedding: 0,
      percentage: 0
    };
  }
}
