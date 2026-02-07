/**
 * Generate Embedding Handler - Direct OpenRouter integration
 * 
 * Features:
 * - Generates embeddings using OpenRouter (openai/text-embedding-3-small)
 * - Returns 1536-dimensional vectors
 * - Optionally updates database
 * 
 * Configuration:
 * - Requires OPENROUTER_API_KEY environment variable
 */

import { jsonResponse } from '../../../../src/functions-lib/response';
import { authenticateUser, isValidUUID } from '../../shared/auth';
import { checkRateLimit } from '../utils/rate-limit';
import { getAPIKeys, AI_MODELS, API_CONFIG } from '../../shared/ai-config';
import { createClient } from '@supabase/supabase-js';

interface GenerateEmbeddingRequest {
  text: string;
  table: string;
  id: string;
  type?: 'opportunity' | 'student';
  returnEmbedding?: boolean;
  skipDatabaseUpdate?: boolean;
}

/**
 * Generate embedding using OpenRouter
 */
async function generateEmbedding(text: string, openRouterKey: string): Promise<number[]> {
  const response = await fetch('https://openrouter.ai/api/v1/embeddings', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${openRouterKey}`,
      'Content-Type': 'application/json',
      'HTTP-Referer': API_CONFIG.OPENROUTER.headers['HTTP-Referer'],
      'X-Title': API_CONFIG.OPENROUTER.headers['X-Title'],
    },
    body: JSON.stringify({
      model: AI_MODELS.EMBEDDING_SMALL,
      input: text.slice(0, 8000), // Max 8K tokens
    }),
  });

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`OpenRouter API error: ${response.status} - ${error}`);
  }

  const data = (await response.json()) as { data: Array<{ embedding: number[] }> };

  if (!data?.data?.[0]?.embedding) {
    throw new Error('Invalid OpenRouter response: missing embedding');
  }

  return data.data[0].embedding;
}

export async function handleGenerateEmbedding(
  request: Request,
  env: Record<string, string>
): Promise<Response> {
  if (request.method !== 'POST') {
    return jsonResponse({ error: 'Method not allowed' }, 405);
  }

  const auth = await authenticateUser(request, env);
  if (!auth) {
    return jsonResponse({ error: 'Authentication required' }, 401);
  }

  const { user } = auth;
  const studentId = user.id;

  if (!checkRateLimit(studentId)) {
    return jsonResponse({ error: 'Rate limit exceeded' }, 429);
  }

  let body: GenerateEmbeddingRequest;
  try {
    body = (await request.json()) as GenerateEmbeddingRequest;
  } catch {
    return jsonResponse({ success: false, error: 'Invalid JSON' }, 400);
  }

  const {
    text,
    table,
    id,
    type = 'opportunity',
    returnEmbedding = false,
    skipDatabaseUpdate = false,
  } = body;

  if (!text || !table || !id) {
    return jsonResponse(
      {
        success: false,
        error: 'Missing required parameters: text, table, id',
      },
      400
    );
  }

  const allowedTables = ['opportunities', 'students', 'profiles', 'courses'];
  if (!allowedTables.includes(table)) {
    return jsonResponse(
      {
        success: false,
        error: `Invalid table. Allowed tables: ${allowedTables.join(', ')}`,
      },
      400
    );
  }

  if (!isValidUUID(id)) {
    return jsonResponse(
      {
        success: false,
        error: 'Invalid id format. Must be a valid UUID.',
      },
      400
    );
  }

  console.log(`[Embedding] Generating for ${type} #${id}`);

  try {
    // Get OpenRouter API key
    const apiKeys = getAPIKeys(env);
    if (!apiKeys.openRouter) {
      return jsonResponse(
        {
          success: false,
          error: 'OpenRouter API key not configured',
        },
        500
      );
    }

    // Generate embedding using OpenRouter
    const embedding = await generateEmbedding(text, apiKeys.openRouter);

    console.log(`[Embedding] Generated ${embedding.length}-dimensional vector`);

    // Update database if not skipped
    if (!skipDatabaseUpdate) {
      const supabase = createClient(
        env.SUPABASE_URL || env.VITE_SUPABASE_URL,
        env.SUPABASE_SERVICE_ROLE_KEY
      );

      const { error: updateError } = await supabase
        .from(table)
        .update({ embedding })
        .eq('id', id);

      if (updateError) {
        console.error('[Embedding] Database update failed:', updateError);
        // Don't fail the request, just log the error
      } else {
        console.log(`[Embedding] Updated ${table} #${id} in database`);
      }
    }

    // Return response
    if (returnEmbedding) {
      return jsonResponse({
        success: true,
        embedding,
        dimensions: embedding.length,
        model: AI_MODELS.EMBEDDING_SMALL,
      });
    }

    return jsonResponse({
      success: true,
      message: `Embedding generated for ${type} #${id}`,
      dimensions: embedding.length,
      model: AI_MODELS.EMBEDDING_SMALL,
    });
  } catch (error) {
    console.error('[Embedding] Error:', error);
    return jsonResponse(
      {
        success: false,
        error: (error as Error).message || 'Unknown error generating embedding',
      },
      500
    );
  }
}
