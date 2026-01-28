/**
 * Generate Embedding Handler - Create embeddings for opportunities/students
 * 
 * Features:
 * - OpenRouter text-embedding-3-small model
 * - Optional database update
 * - Return embedding without saving (returnEmbedding flag)
 * 
 * Source: cloudflare-workers/career-api/src/index.ts (handleGenerateEmbedding)
 */

import { jsonResponse } from '../../../../src/functions-lib/response';
import { createClient } from '@supabase/supabase-js';
import { authenticateUser, isValidUUID } from '../utils/auth';
import { checkRateLimit } from '../utils/rate-limit';
import { getOpenRouterKey } from '../[[path]]';

interface GenerateEmbeddingRequest {
  text: string;
  table: string;
  id: string;
  type?: 'opportunity' | 'student';
  returnEmbedding?: boolean;
}

export async function handleGenerateEmbedding(request: Request, env: Record<string, string>): Promise<Response> {
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
    body = await request.json() as GenerateEmbeddingRequest;
  } catch {
    return jsonResponse({ success: false, error: 'Invalid JSON' }, 400);
  }

  const { text, table, id, type = 'opportunity', returnEmbedding = false } = body;

  if (!text || !table || !id) {
    return jsonResponse({
      success: false,
      error: 'Missing required parameters: text, table, id'
    }, 400);
  }

  const allowedTables = ['opportunities', 'students', 'profiles', 'courses'];
  if (!allowedTables.includes(table)) {
    return jsonResponse({
      success: false,
      error: `Invalid table. Allowed tables: ${allowedTables.join(', ')}`
    }, 400);
  }

  if (!isValidUUID(id)) {
    return jsonResponse({
      success: false,
      error: 'Invalid id format. Must be a valid UUID.'
    }, 400);
  }

  console.log(`Generating embedding for ${type} #${id}`);

  try {
    const openRouterKey = getOpenRouterKey(env);
    if (!openRouterKey) {
      return jsonResponse({
        success: false,
        error: 'OpenRouter API key not configured'
      }, 500);
    }

    const embeddingResponse = await fetch('https://openrouter.ai/api/v1/embeddings', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${openRouterKey}`,
        'Content-Type': 'application/json',
        'HTTP-Referer': 'https://skillpassport.rareminds.in',
        'X-Title': 'SkillPassport Embedding Service',
      },
      body: JSON.stringify({
        model: 'openai/text-embedding-3-small',
        input: text.slice(0, 8000),
      }),
    });

    if (!embeddingResponse.ok) {
      const errorText = await embeddingResponse.text();
      console.error('OpenRouter embedding error:', embeddingResponse.status, errorText);
      return jsonResponse({
        success: false,
        error: `OpenRouter API error: ${embeddingResponse.status} - ${errorText}`
      }, 500);
    }

    const data = await embeddingResponse.json() as { data: Array<{ embedding: number[] }> };
    const embedding = data.data[0].embedding;

    if (!embedding || !Array.isArray(embedding)) {
      return jsonResponse({
        success: false,
        error: 'Invalid embedding response from OpenRouter'
      }, 500);
    }

    console.log(`Generated embedding with ${embedding.length} dimensions`);

    if (returnEmbedding) {
      console.log(`✅ Returning embedding without database update (${embedding.length} dimensions)`);
      return jsonResponse({
        success: true,
        embedding: embedding,
        dimensions: embedding.length
      });
    }

    const supabase = createClient(env.SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY);

    const { error: updateError } = await supabase
      .from(table)
      .update({ embedding })
      .eq('id', id);

    if (updateError) {
      console.error('Supabase update error:', updateError);
      return jsonResponse({
        success: false,
        error: `Failed to update ${table}: ${updateError.message}`
      }, 500);
    }

    console.log(`✅ Successfully updated ${table} #${id} with embedding`);

    return jsonResponse({
      success: true,
      message: `Embedding generated for ${type} #${id}`,
      dimensions: embedding.length
    });

  } catch (error) {
    console.error('Error generating embedding:', error);
    return jsonResponse({
      success: false,
      error: (error as Error).message || 'Unknown error generating embedding'
    }, 500);
  }
}
