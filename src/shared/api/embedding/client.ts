/**
 * Frontend Embedding Client
 * Thin wrapper around the backend embedding API
 * 
 * This is the ONLY place frontend code should call the embedding API.
 * All other code should use this client.
 */

import { supabase } from '@/shared/api/supabaseClient';
import { getApiUrl } from '@/shared/api/apiUtils';

const EMBEDDING_API_URL = getApiUrl('career');

// In-memory cache for pending requests to prevent duplicate concurrent calls
const pendingRequests = new Map<string, Promise<number[]>>();

// Auth token cache to reduce redundant getSession calls
interface TokenCache {
  token: string;
  expiresAt: number;
}

let cachedToken: TokenCache | null = null;
const TOKEN_CACHE_BUFFER = 5 * 60 * 1000; // Refresh 5 minutes before expiry

/**
 * Custom error class for embedding operations
 */
class EmbeddingError extends Error {
  constructor(
    message: string,
    public code: 'AUTH_REQUIRED' | 'RATE_LIMIT' | 'API_ERROR' | 'INVALID_TEXT',
    public details?: Record<string, unknown>
  ) {
    super(message);
    this.name = 'EmbeddingError';
  }
}

/**
 * Get cached auth token or fetch new one
 * Reduces redundant getSession() calls by caching token until near expiry
 */
async function getAuthToken(): Promise<string> {
  const now = Date.now();
  
  // Return cached token if still valid
  if (cachedToken && cachedToken.expiresAt > now) {
    return cachedToken.token;
  }
  
  // Fetch new token
  const { data: { session } } = await supabase.auth.getSession();
  
  if (!session?.access_token) {
    throw new Error('Authentication required');
  }
  
  // Cache token with expiry (JWT typically expires in 1 hour, cache for 55 minutes)
  const expiresAt = session.expires_at 
    ? session.expires_at * 1000 - TOKEN_CACHE_BUFFER 
    : now + 55 * 60 * 1000; // Default 55 minutes if no expiry
  
  cachedToken = {
    token: session.access_token,
    expiresAt
  };
  
  return cachedToken.token;
}

/**
 * Clear cached auth token (call on logout or auth errors)
 */
export function clearAuthTokenCache(): void {
  cachedToken = null;
}

// Retry configuration
const RETRY_CONFIG = {
  maxRetries: 3,
  baseDelayMs: 1000,
  maxDelayMs: 10000,
};

export interface EmbeddingOptions {
  table?: string;
  id?: string;
  returnEmbedding?: boolean;
  skipDatabaseUpdate?: boolean;
}

export interface EmbeddingBatchOptions {
  maxConcurrent?: number;
  table?: string;
  idPrefix?: string;
}

/**
 * Fetch with exponential backoff retry logic
 * Retries on network errors and 5xx server errors
 */
async function fetchWithRetry(
  url: string,
  options: RequestInit,
  maxRetries: number = RETRY_CONFIG.maxRetries
): Promise<Response> {
  let lastError: Error | null = null;

  for (let attempt = 0; attempt < maxRetries; attempt++) {
    try {
      const response = await fetch(url, options);
      
      // Don't retry on client errors (4xx) or success
      if (response.ok || (response.status >= 400 && response.status < 500)) {
        return response;
      }
      
      // Server error (5xx) - retry
      lastError = new Error(`Server error: ${response.status}`);
      
    } catch (error) {
      lastError = error instanceof Error ? error : new Error(String(error));
    }

    // Don't delay after last attempt
    if (attempt < maxRetries - 1) {
      const delay = Math.min(
        RETRY_CONFIG.baseDelayMs * Math.pow(2, attempt),
        RETRY_CONFIG.maxDelayMs
      );
      console.warn(`[EmbeddingClient] Retry ${attempt + 1}/${maxRetries} after ${delay}ms`);
      await new Promise(resolve => setTimeout(resolve, delay));
    }
  }

  throw lastError || new Error('Max retries exceeded');
}

/**
 * Sanitize error for logging (remove sensitive data)
 */
function sanitizeError(error: unknown): Record<string, unknown> {
  if (error instanceof Error) {
    return {
      name: error.name,
      message: error.message,
      // Don't include stack trace in production to avoid leaking paths
    };
  }
  return { error: 'Unknown error' };
}

/**
 * Simple hash function for cache key generation
 */
function hashText(text: string): string {
  let hash = 0;
  for (let i = 0; i < text.length; i++) {
    const char = text.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash; // Convert to 32bit integer
  }
  return hash.toString(36);
}

/**
 * Generate embedding for text via the career-api handler
 * Includes request deduplication and retry logic
 * 
 * @param text - Text to generate embedding for
 * @param options - Optional parameters
 * @returns Embedding vector (dimensions determined by worker)
 * @throws Error if authentication fails or API returns error
 */
export async function generateEmbedding(
  text: string, 
  options: EmbeddingOptions = {}
): Promise<number[]> {
  if (!text || text.trim().length < 10) {
    throw new Error('Text too short for embedding generation (minimum 10 characters)');
  }

  // Create cache key for deduplication - include text hash to prevent collisions
  const cacheKey = `${options.table || 'students'}-${options.id || 'temp'}-${hashText(text)}`;
  
  // Check if request is already pending
  if (pendingRequests.has(cacheKey)) {
    console.log(`[EmbeddingClient] Reusing pending request for ${cacheKey}`);
    return pendingRequests.get(cacheKey)!;
  }

  // Create the promise and cache it
  const promise = _generateEmbeddingInternal(text, options);
  pendingRequests.set(cacheKey, promise);

  try {
    const result = await promise;
    return result;
  } finally {
    // Clean up cache after completion (success or failure)
    pendingRequests.delete(cacheKey);
  }
}

/**
 * Internal implementation of embedding generation
 * Separated to allow caching wrapper
 */
async function _generateEmbeddingInternal(
  text: string,
  options: EmbeddingOptions
): Promise<number[]> {
  // Get cached auth token (reduces redundant getSession calls)
  const token = await getAuthToken();

  try {
    const response = await fetchWithRetry(
      `${EMBEDDING_API_URL}/generate-embedding`,
      {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ 
          text,
          table: options.table || 'students',
          id: options.id || generateTempUUID(),
          returnEmbedding: options.returnEmbedding ?? true,
          skipDatabaseUpdate: options.skipDatabaseUpdate ?? true,
        })
      }
    );

    if (!response.ok) {
      // Clear token cache on auth errors
      if (response.status === 401 || response.status === 403) {
        clearAuthTokenCache();
      }
      
      const errorData = await response.json().catch(() => ({}));
      
      // Provide actionable error messages based on status code
      let errorMessage = errorData.error || 'Unknown error';
      
      if (response.status === 401) {
        errorMessage = 'Authentication failed. Please log in again.';
      } else if (response.status === 403) {
        errorMessage = 'Access denied. You do not have permission to perform this operation.';
      } else if (response.status === 429) {
        errorMessage = 'Rate limit exceeded. Please wait a moment and try again.';
      } else if (response.status >= 500) {
        errorMessage = `Server error (${response.status}). The embedding service may be experiencing high load. Please try again in a few minutes.`;
      }
      
      throw new Error(errorMessage);
    }

    const result = await response.json();
    
    // Validate response
    if (!result.embedding || !Array.isArray(result.embedding) || result.embedding.length === 0) {
      throw new Error('Invalid embedding response from handler');
    }
    
    return result.embedding;
    
  } catch (error) {
    const sanitized = sanitizeError(error);
    console.error('[EmbeddingClient] Error generating embedding:', sanitized);
    const errorMessage = error instanceof Error ? error.message : String(error);
    throw new Error(`Embedding generation failed: ${errorMessage}`);
  }
}

/**
 * Generate multiple embeddings in parallel
 * Includes deduplication for identical texts
 * 
 * @param texts - Array of texts to generate embeddings for
 * @param options - Batch options
 * @returns Array of embedding vectors (null for failed embeddings)
 */
export async function generateEmbeddingsBatch(
  texts: string[], 
  options: EmbeddingBatchOptions = {}
): Promise<(number[] | null)[]> {
  const { maxConcurrent = 5, table = 'students', idPrefix } = options;

  if (!texts || texts.length === 0) {
    return [];
  }

  // Validate all texts
  const validTexts = texts.filter(text => text && text.trim().length >= 10);
  if (validTexts.length === 0) {
    throw new Error('No valid texts for embedding generation');
  }

  // Get cached auth token once for all requests
  const token = await getAuthToken();

  // Deduplicate texts to avoid redundant API calls
  const uniqueTexts = [...new Set(texts)];
  const textToEmbedding = new Map<string, number[] | null>();

  // Process unique texts in batches
  for (let i = 0; i < uniqueTexts.length; i += maxConcurrent) {
    const batch = uniqueTexts.slice(i, i + maxConcurrent);
    
    const batchPromises = batch.map(async (text: string, batchIndex: number) => {
      try {
        const globalIndex = i + batchIndex;
        const id = idPrefix ? `${idPrefix}-${globalIndex}` : generateTempUUID();
        
        const response = await fetchWithRetry(
          `${EMBEDDING_API_URL}/generate-embedding`,
          {
            method: 'POST',
            headers: { 
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify({ 
              text,
              table,
              id,
              returnEmbedding: true,
              skipDatabaseUpdate: true
            })
          }
        );

        if (!response.ok) {
          const errorData = await response.json().catch(() => ({}));
          throw new Error(errorData.error || `API error: ${response.status}`);
        }

        const result = await response.json();
        
        if (!result.embedding || !Array.isArray(result.embedding)) {
          throw new Error('Invalid embedding response');
        }

        return { text, embedding: result.embedding };
      } catch (error) {
        const sanitized = sanitizeError(error);
        const textPreview = text?.substring(0, 50) || 'N/A';
        console.error(`[EmbeddingClient] Failed for text: ${textPreview}...`, sanitized);
        return { text, embedding: null };
      }
    });

    const batchResults = await Promise.all(batchPromises);
    
    // Store results in map
    for (const result of batchResults) {
      textToEmbedding.set(result.text, result.embedding);
    }
  }

  // Map back to original order (including duplicates)
  return texts.map(text => {
    const embedding = textToEmbedding.get(text);
    if (embedding === undefined) {
      throw new Error(`Missing embedding for text: ${text.substring(0, 50)}...`);
    }
    return embedding;
  });
}

/**
 * Regenerate embedding from database
 * Triggers backend to fetch data and regenerate embedding
 * 
 * @param table - Table name (students, courses, opportunities)
 * @param id - Record ID
 * @throws Error if authentication fails
 */
export async function regenerateEmbeddingFromDatabase(
  table: string,
  id: string
): Promise<void> {
  // Get cached auth token
  const token = await getAuthToken();

  try {
    const response = await fetchWithRetry(
      `${EMBEDDING_API_URL}/generate-embedding`,
      {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ 
          table,
          id,
          fromDatabase: true,
          returnEmbedding: false,
          skipDatabaseUpdate: false
        })
      }
    );

    if (!response.ok) {
      // Clear token cache on auth errors
      if (response.status === 401 || response.status === 403) {
        clearAuthTokenCache();
      }
      
      const errorData = await response.json().catch(() => ({}));
      
      // Provide actionable error messages
      let errorMessage = errorData.error || 'Unknown error';
      let retryAfter: number | undefined;
      
      if (response.status === 401) {
        errorMessage = 'Authentication failed. Please log in again to regenerate embeddings.';
      } else if (response.status === 403) {
        errorMessage = 'Access denied. You do not have permission to regenerate this embedding.';
      } else if (response.status === 429) {
        errorMessage = 'Rate limit exceeded. Embedding regeneration will be retried automatically.';
        retryAfter = 60; // Suggest retry after 60 seconds
      } else if (response.status >= 500) {
        errorMessage = `Server error (${response.status}). The embedding service may be experiencing high load. Regeneration will be retried automatically.`;
        retryAfter = 120; // Suggest retry after 2 minutes
      }
      
      const error = new EmbeddingError(
        errorMessage,
        response.status === 401 || response.status === 403 ? 'AUTH_REQUIRED' :
        response.status === 429 ? 'RATE_LIMIT' :
        'API_ERROR',
        { 
          statusCode: response.status, 
          retryAfter,
          originalError: errorData.error 
        }
      );
      
      console.error('[EmbeddingClient] Regeneration failed:', sanitizeError(error));
      throw error;
    }

    const result = await response.json();
    console.log(`[EmbeddingClient] ✅ Regenerated for ${table}/${id} (${result.dimensions}D)`);
    
  } catch (error) {
    const sanitized = sanitizeError(error);
    console.error('[EmbeddingClient] Error regenerating embedding:', sanitized);
    throw error;
  }
}

/**
 * Generate embedding for skill search query
 * Wraps skill name with context for better semantic matching
 */
export async function generateSkillEmbedding(skillName: string): Promise<number[]> {
  const skillText = `Skill: ${skillName}. Looking for courses that teach ${skillName} skills and competencies.`;
  return generateEmbedding(skillText, { 
    table: 'courses', 
    id: `skill-${skillName.toLowerCase().replace(/\s+/g, '-')}` 
  });
}

/**
 * Generate embeddings for multiple skills in parallel
 */
export async function generateSkillEmbeddingsBatch(
  skillNames: string[]
): Promise<Array<{ skill: string; embedding: number[] }>> {
  if (!skillNames || skillNames.length === 0) {
    return [];
  }

  // Wrap each skill with context
  const skillTexts = skillNames.map((skill: string) => 
    `Skill: ${skill}. Looking for courses that teach ${skill} skills and competencies.`
  );

  // Generate embeddings in parallel
  const embeddings = await generateEmbeddingsBatch(skillTexts);

  // Combine skills with their embeddings
  return skillNames
    .map((skill: string, index: number) => ({
      skill,
      embedding: embeddings[index]
    }))
    .filter((item): item is { skill: string; embedding: number[] } => 
      item.embedding !== null && Array.isArray(item.embedding)
    );
}

/**
 * Generate embeddings for profile and multiple skills in one call
 */
export async function generateProfileAndSkillEmbeddings(
  profileText: string, 
  skillNames: string[] = []
): Promise<{
  profile: number[] | null;
  skills: Array<{ skill: string; embedding: number[] }>;
}> {
  const texts = [profileText];
  const skillTexts = skillNames.map((skill: string) => 
    `Skill: ${skill}. Looking for courses that teach ${skill} skills and competencies.`
  );
  texts.push(...skillTexts);

  const embeddings = await generateEmbeddingsBatch(texts);

  return {
    profile: embeddings[0],
    skills: skillNames
      .map((skill: string, index: number) => ({
        skill,
        embedding: embeddings[index + 1]
      }))
      .filter((item): item is { skill: string; embedding: number[] } => 
        item.embedding !== null && Array.isArray(item.embedding)
      )
  };
}

// Helper function to generate temp UUID
function generateTempUUID(): string {
  const s4 = () => Math.floor((1 + Math.random()) * 0x10000).toString(16).substring(1);
  return `${s4()}${s4()}-${s4()}-4${s4().substring(0, 3)}-${s4()}-${s4()}${s4()}${s4()}`;
}
