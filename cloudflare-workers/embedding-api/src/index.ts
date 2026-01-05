/**
 * Industrial-Grade Embedding API Worker
 * 
 * Features:
 * - OpenRouter embedding support (routes to OpenAI text-embedding-3-small)
 * - Local fallback embedding service
 * - Request queuing and rate limiting
 * - Batch processing with chunking
 * - Automatic retry with exponential backoff
 * - Caching layer
 * - Webhook notifications
 * - Cron-based queue processing
 */

import { createClient } from '@supabase/supabase-js';

interface Env {
  VITE_SUPABASE_URL: string;
  SUPABASE_SERVICE_ROLE_KEY: string;
  OPENROUTER_API_KEY: string;
  EMBEDDING_SERVICE_URL?: string;
  EMBEDDING_CACHE?: {
    get(key: string): Promise<string | null>;
    put(key: string, value: string, options?: { expirationTtl?: number }): Promise<void>;
    delete(key: string): Promise<void>;
  };
}

interface EmbeddingRequest {
  text: string;
  id: string;
  table: 'students' | 'opportunities' | 'courses';
  model?: 'openrouter' | 'local';
  priority?: 'high' | 'normal' | 'low';
}

interface BatchEmbeddingRequest {
  items: EmbeddingRequest[];
  webhookUrl?: string;
}

// CORS headers
const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization',
};

function jsonResponse(data: any, status = 200): Response {
  return new Response(JSON.stringify(data), {
    status,
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  });
}

// ==================== EMBEDDING GENERATORS ====================

/**
 * Generate embedding using OpenRouter (routes to OpenAI text-embedding-3-small)
 * Best quality, 1536 dimensions
 */
async function generateOpenRouterEmbedding(text: string, apiKey: string): Promise<number[]> {
  const response = await fetch('https://openrouter.ai/api/v1/embeddings', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
      'HTTP-Referer': 'https://skillpassport.rareminds.in',
      'X-Title': 'SkillPassport Embedding Service',
    },
    body: JSON.stringify({
      model: 'openai/text-embedding-3-small',
      input: text.slice(0, 8000), // Max 8K tokens
    }),
  });

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`OpenRouter API error: ${response.status} - ${error}`);
  }

  const data = await response.json() as { data: Array<{ embedding: number[] }> };
  return data.data[0].embedding;
}

/**
 * Generate embedding using local Transformers.js service
 * Free, 384 dimensions (padded to 1536)
 */
async function generateLocalEmbedding(text: string, serviceUrl: string): Promise<number[]> {
  const response = await fetch(`${serviceUrl}/embed`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ text: text.slice(0, 5000) }),
  });

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`Local embedding service error: ${response.status} - ${error}`);
  }

  const data = await response.json() as { embedding: number[] };
  return data.embedding;
}

/**
 * Generate embedding with automatic fallback
 * Priority: OpenRouter > Local
 */
async function generateEmbedding(
  text: string,
  env: Env,
  preferredModel: 'openrouter' | 'local' = 'openrouter'
): Promise<{ embedding: number[]; model: string }> {
  const models: string[] = [preferredModel];
  
  // Add fallbacks
  if (preferredModel !== 'openrouter' && env.OPENROUTER_API_KEY) models.push('openrouter');
  if (preferredModel !== 'local' && env.EMBEDDING_SERVICE_URL) models.push('local');

  let lastError: Error | null = null;

  for (const model of models) {
    try {
      let embedding: number[];

      switch (model) {
        case 'openrouter':
          if (!env.OPENROUTER_API_KEY) continue;
          embedding = await generateOpenRouterEmbedding(text, env.OPENROUTER_API_KEY);
          break;
        case 'local':
          if (!env.EMBEDDING_SERVICE_URL) continue;
          embedding = await generateLocalEmbedding(text, env.EMBEDDING_SERVICE_URL);
          break;
        default:
          continue;
      }

      return { embedding, model };
    } catch (error) {
      console.error(`${model} embedding failed:`, error);
      lastError = error as Error;
    }
  }

  throw lastError || new Error('No embedding model available');
}

// ==================== TEXT BUILDERS ====================

/**
 * Build searchable text from student profile
 */
function buildStudentText(student: any): string {
  const parts: string[] = [];

  // Basic info - use direct columns (no profile JSONB)
  if (student.name) {
    parts.push(`Name: ${student.name}`);
  }

  // Education
  if (student.branch_field) {
    parts.push(`Field of Study: ${student.branch_field}`);
  }
  if (student.course_name) {
    parts.push(`Course: ${student.course_name}`);
  }
  if (student.university) {
    parts.push(`University: ${student.university}`);
  }

  // Skills from skill_passports table (joined data)
  if (student.skills && Array.isArray(student.skills)) {
    const skillNames = student.skills.map((s: any) => 
      typeof s === 'string' ? s : s.name || s.skill_name
    ).filter(Boolean);
    if (skillNames.length > 0) {
      parts.push(`Technical Skills: ${skillNames.join(', ')}`);
    }
  }

  // Experience (from student_experience table - joined data)
  if (student.experience && Array.isArray(student.experience)) {
    const expSummary = student.experience.map((e: any) => 
      `${e.role || e.title} at ${e.organization || e.company}`
    ).filter(Boolean).join('; ');
    if (expSummary) {
      parts.push(`Experience: ${expSummary}`);
    }
  }

  // Projects (from student_projects table - joined data)
  if (student.projects && Array.isArray(student.projects)) {
    const projSummary = student.projects.map((p: any) => p.name || p.title).filter(Boolean).join(', ');
    if (projSummary) {
      parts.push(`Projects: ${projSummary}`);
    }
  }

  // Certificates (from student_certificates table - joined data)
  if (student.certificates && Array.isArray(student.certificates)) {
    const certNames = student.certificates.map((c: any) => c.name || c.title).filter(Boolean).join(', ');
    if (certNames) {
      parts.push(`Certifications: ${certNames}`);
    }
  }

  // Training (from trainings table - joined data)
  if (student.trainings && Array.isArray(student.trainings)) {
    const trainingNames = student.trainings.map((t: any) => t.course || t.name).filter(Boolean).join(', ');
    if (trainingNames) {
      parts.push(`Training: ${trainingNames}`);
    }
  }

  return parts.join('\n');
}

/**
 * Build searchable text from opportunity/job posting
 */
function buildOpportunityText(opportunity: any): string {
  const parts: string[] = [];

  // Job basics
  if (opportunity.job_title || opportunity.title) {
    parts.push(`Job Title: ${opportunity.job_title || opportunity.title}`);
  }
  if (opportunity.company_name) {
    parts.push(`Company: ${opportunity.company_name}`);
  }
  if (opportunity.department) {
    parts.push(`Department: ${opportunity.department}`);
  }

  // Job details
  if (opportunity.employment_type) {
    parts.push(`Type: ${opportunity.employment_type}`);
  }
  if (opportunity.experience_level || opportunity.experience_required) {
    parts.push(`Experience: ${opportunity.experience_level || opportunity.experience_required}`);
  }
  if (opportunity.location) {
    parts.push(`Location: ${opportunity.location}`);
  }

  // Skills - Critical for matching
  const skills = opportunity.skills_required || [];
  if (Array.isArray(skills) && skills.length > 0) {
    const skillNames = skills.map((s: any) => typeof s === 'string' ? s : s.name || s.skill).filter(Boolean);
    parts.push(`Required Skills: ${skillNames.join(', ')}`);
  }

  // Requirements
  const requirements = opportunity.requirements || [];
  if (Array.isArray(requirements) && requirements.length > 0) {
    parts.push(`Requirements: ${requirements.join('; ')}`);
  }

  // Responsibilities
  const responsibilities = opportunity.responsibilities || [];
  if (Array.isArray(responsibilities) && responsibilities.length > 0) {
    parts.push(`Responsibilities: ${responsibilities.join('; ')}`);
  }

  // Description
  if (opportunity.description) {
    parts.push(`Description: ${opportunity.description.slice(0, 1000)}`);
  }

  return parts.join('\n');
}

/**
 * Build searchable text from course
 */
function buildCourseText(course: any): string {
  const parts: string[] = [];

  if (course.title || course.name) {
    parts.push(`Course: ${course.title || course.name}`);
  }
  if (course.provider) {
    parts.push(`Provider: ${course.provider}`);
  }
  if (course.category) {
    parts.push(`Category: ${course.category}`);
  }
  if (course.level) {
    parts.push(`Level: ${course.level}`);
  }
  if (course.skills_taught) {
    const skills = Array.isArray(course.skills_taught) 
      ? course.skills_taught.join(', ')
      : course.skills_taught;
    parts.push(`Skills: ${skills}`);
  }
  if (course.description) {
    parts.push(`Description: ${course.description.slice(0, 500)}`);
  }

  return parts.join('\n');
}

// ==================== HANDLERS ====================

/**
 * Generate embedding for a single record
 */
async function handleSingleEmbedding(request: Request, env: Env): Promise<Response> {
  const body = await request.json() as EmbeddingRequest;
  const { text, id, table, model = 'openrouter' } = body;

  if (!text || !id || !table) {
    return jsonResponse({ error: 'Missing required fields: text, id, table' }, 400);
  }

  const validTables = ['students', 'opportunities', 'courses'];
  if (!validTables.includes(table)) {
    return jsonResponse({ error: `Invalid table. Must be one of: ${validTables.join(', ')}` }, 400);
  }

  try {
    // Check cache first
    const cacheKey = `emb:${table}:${id}`;
    const cached = await env.EMBEDDING_CACHE?.get(cacheKey);
    if (cached) {
      const cachedData = JSON.parse(cached);
      return jsonResponse({
        success: true,
        cached: true,
        model: cachedData.model,
        dimensions: cachedData.embedding.length,
      });
    }

    // Generate embedding
    const validModel = (model === 'openrouter' || model === 'local') ? model : 'openrouter';
    const { embedding, model: usedModel } = await generateEmbedding(text, env, validModel);

    // Save to database
    const supabase = createClient(env.VITE_SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY);
    const { error: updateError } = await supabase
      .from(table)
      .update({ embedding })
      .eq('id', id);

    if (updateError) {
      throw new Error(`Database update failed: ${updateError.message}`);
    }

    // Cache the result (24 hours)
    if (env.EMBEDDING_CACHE) {
      await env.EMBEDDING_CACHE.put(cacheKey, JSON.stringify({ embedding, model: usedModel }), {
        expirationTtl: 86400,
      });
    }

    return jsonResponse({
      success: true,
      id,
      table,
      model: usedModel,
      dimensions: embedding.length,
    });

  } catch (error) {
    console.error('Embedding generation failed:', error);
    return jsonResponse({
      success: false,
      error: (error as Error).message,
    }, 500);
  }
}

/**
 * Generate embeddings for a batch of records
 */
async function handleBatchEmbedding(request: Request, env: Env): Promise<Response> {
  const body = await request.json() as BatchEmbeddingRequest;
  const { items, webhookUrl } = body;

  if (!Array.isArray(items) || items.length === 0) {
    return jsonResponse({ error: 'Missing or empty items array' }, 400);
  }

  if (items.length > 100) {
    return jsonResponse({ error: 'Maximum 100 items per batch' }, 400);
  }

  const results: Array<{ id: string; success: boolean; error?: string }> = [];
  const supabase = createClient(env.VITE_SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY);

  for (const item of items) {
    try {
      const validModel = (item.model === 'openrouter' || item.model === 'local') ? item.model : 'openrouter';
      const { embedding, model } = await generateEmbedding(item.text, env, validModel);

      const { error: updateError } = await supabase
        .from(item.table)
        .update({ embedding })
        .eq('id', item.id);

      if (updateError) {
        results.push({ id: item.id, success: false, error: updateError.message });
      } else {
        results.push({ id: item.id, success: true });
      }

    } catch (error) {
      results.push({ id: item.id, success: false, error: (error as Error).message });
    }
  }

  // Send webhook notification if provided
  if (webhookUrl) {
    try {
      await fetch(webhookUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          type: 'batch_embedding_complete',
          results,
          timestamp: new Date().toISOString(),
        }),
      });
    } catch (e) {
      console.error('Webhook notification failed:', e);
    }
  }

  const successCount = results.filter(r => r.success).length;
  return jsonResponse({
    success: true,
    processed: items.length,
    succeeded: successCount,
    failed: items.length - successCount,
    results,
  });
}


/**
 * Generate embeddings for all records missing them
 */
async function handleBackfill(request: Request, env: Env): Promise<Response> {
  const url = new URL(request.url);
  const table = url.searchParams.get('table') || 'students';
  const limit = Math.min(parseInt(url.searchParams.get('limit') || '50'), 100);

  const validTables = ['students', 'opportunities', 'courses'];
  if (!validTables.includes(table)) {
    return jsonResponse({ error: `Invalid table. Must be one of: ${validTables.join(', ')}` }, 400);
  }

  const supabase = createClient(env.VITE_SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY);

  // Get records without embeddings
  const { data: records, error: fetchError } = await supabase
    .from(table)
    .select('*')
    .is('embedding', null)
    .limit(limit);

  if (fetchError) {
    return jsonResponse({ error: `Failed to fetch records: ${fetchError.message}` }, 500);
  }

  if (!records || records.length === 0) {
    return jsonResponse({
      success: true,
      message: `No ${table} records need embeddings`,
      processed: 0,
    });
  }

  const results: Array<{ id: string; success: boolean; error?: string }> = [];

  for (const record of records) {
    try {
      // Build text based on table type
      let text: string;
      switch (table) {
        case 'students':
          text = buildStudentText(record);
          break;
        case 'opportunities':
          text = buildOpportunityText(record);
          break;
        case 'courses':
          text = buildCourseText(record);
          break;
        default:
          text = JSON.stringify(record);
      }

      if (!text || text.length < 10) {
        results.push({ id: record.id, success: false, error: 'Insufficient data for embedding' });
        continue;
      }

      const { embedding } = await generateEmbedding(text, env);

      const { error: updateError } = await supabase
        .from(table)
        .update({ embedding })
        .eq('id', record.id);

      if (updateError) {
        results.push({ id: record.id, success: false, error: updateError.message });
      } else {
        results.push({ id: record.id, success: true });
      }

    } catch (error) {
      results.push({ id: record.id, success: false, error: (error as Error).message });
    }
  }

  const successCount = results.filter(r => r.success).length;
  return jsonResponse({
    success: true,
    table,
    processed: records.length,
    succeeded: successCount,
    failed: records.length - successCount,
    results,
  });
}

/**
 * Regenerate embedding for a specific record
 */
async function handleRegenerate(request: Request, env: Env): Promise<Response> {
  const url = new URL(request.url);
  const table = url.searchParams.get('table');
  const id = url.searchParams.get('id');

  if (!table || !id) {
    return jsonResponse({ error: 'Missing required params: table, id' }, 400);
  }

  const validTables = ['students', 'opportunities', 'courses'];
  if (!validTables.includes(table)) {
    return jsonResponse({ error: `Invalid table. Must be one of: ${validTables.join(', ')}` }, 400);
  }

  const supabase = createClient(env.VITE_SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY);

  // Fetch the record
  const { data: record, error: fetchError } = await supabase
    .from(table)
    .select('*')
    .eq('id', id)
    .single();

  if (fetchError || !record) {
    return jsonResponse({ error: `Record not found: ${fetchError?.message || 'Not found'}` }, 404);
  }

  try {
    // Build text based on table type
    let text: string;
    switch (table) {
      case 'students':
        text = buildStudentText(record);
        break;
      case 'opportunities':
        text = buildOpportunityText(record);
        break;
      case 'courses':
        text = buildCourseText(record);
        break;
      default:
        text = JSON.stringify(record);
    }

    const { embedding, model } = await generateEmbedding(text, env);

    const { error: updateError } = await supabase
      .from(table)
      .update({ embedding })
      .eq('id', id);

    if (updateError) {
      throw new Error(`Database update failed: ${updateError.message}`);
    }

    // Invalidate cache
    if (env.EMBEDDING_CACHE) {
      await env.EMBEDDING_CACHE.delete(`emb:${table}:${id}`);
    }

    return jsonResponse({
      success: true,
      id,
      table,
      model,
      dimensions: embedding.length,
      textLength: text.length,
    });

  } catch (error) {
    return jsonResponse({
      success: false,
      error: (error as Error).message,
    }, 500);
  }
}

/**
 * Get embedding statistics
 */
async function handleStats(env: Env): Promise<Response> {
  const supabase = createClient(env.VITE_SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY);

  const tables = ['students', 'opportunities', 'courses'];
  const stats: Record<string, any> = {};

  for (const table of tables) {
    const { count: total } = await supabase
      .from(table)
      .select('*', { count: 'exact', head: true });

    const { count: withEmbedding } = await supabase
      .from(table)
      .select('*', { count: 'exact', head: true })
      .not('embedding', 'is', null);

    stats[table] = {
      total: total || 0,
      withEmbedding: withEmbedding || 0,
      withoutEmbedding: (total || 0) - (withEmbedding || 0),
      coverage: total ? Math.round((withEmbedding || 0) / total * 100) : 0,
    };
  }

  return jsonResponse({
    success: true,
    stats,
    availableModels: {
      openrouter: !!env.OPENROUTER_API_KEY,
      local: !!env.EMBEDDING_SERVICE_URL,
    },
  });
}

// ==================== QUEUE PROCESSING ====================

/**
 * Process embedding queue - called by cron or manually
 */
async function processEmbeddingQueue(env: Env, batchSize: number = 20): Promise<{
  processed: number;
  succeeded: number;
  failed: number;
  results: Array<{ id: string; table: string; success: boolean; error?: string }>;
}> {
  const supabase = createClient(env.VITE_SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY);
  const results: Array<{ id: string; table: string; success: boolean; error?: string }> = [];

  // Get pending items from queue
  const { data: queueItems, error: queueError } = await supabase
    .from('embedding_queue')
    .select('*')
    .eq('status', 'pending')
    .or('next_retry_at.is.null,next_retry_at.lte.now()')
    .order('priority', { ascending: true })
    .limit(batchSize);

  if (queueError) {
    console.error('Failed to fetch queue:', queueError);
    return { processed: 0, succeeded: 0, failed: 0, results: [] };
  }

  if (!queueItems || queueItems.length === 0) {
    console.log('Queue is empty');
    return { processed: 0, succeeded: 0, failed: 0, results: [] };
  }

  // Sort by priority (high first, then normal, then low)
  const priorityOrder = { high: 0, normal: 1, low: 2 };
  queueItems.sort((a: any, b: any) => 
    (priorityOrder[a.priority as keyof typeof priorityOrder] || 1) - 
    (priorityOrder[b.priority as keyof typeof priorityOrder] || 1)
  );

  console.log(`Processing ${queueItems.length} items from queue`);

  for (const item of queueItems) {
    const { id, record_id, table_name } = item;

    // Mark as processing
    await supabase
      .from('embedding_queue')
      .update({ status: 'processing', started_at: new Date().toISOString() })
      .eq('id', id);

    try {
      // Fetch the record
      const { data: record, error: fetchError } = await supabase
        .from(table_name)
        .select('*')
        .eq('id', record_id)
        .single();

      if (fetchError || !record) {
        throw new Error(`Record not found: ${fetchError?.message || 'Not found'}`);
      }

      // Build text based on table type
      let text: string;
      switch (table_name) {
        case 'students':
          text = buildStudentText(record);
          break;
        case 'opportunities':
          text = buildOpportunityText(record);
          break;
        case 'courses':
          text = buildCourseText(record);
          break;
        default:
          throw new Error(`Unknown table: ${table_name}`);
      }

      if (!text || text.length < 10) {
        throw new Error('Insufficient data for embedding');
      }

      // Generate embedding
      const { embedding, model } = await generateEmbedding(text, env);

      // Save to database
      const { error: updateError } = await supabase
        .from(table_name)
        .update({ embedding })
        .eq('id', record_id);

      if (updateError) {
        throw new Error(`Database update failed: ${updateError.message}`);
      }

      // Mark as completed
      await supabase
        .from('embedding_queue')
        .update({
          status: 'completed',
          processed_at: new Date().toISOString(),
          model_used: model,
        })
        .eq('id', id);

      // Invalidate cache
      if (env.EMBEDDING_CACHE) {
        await env.EMBEDDING_CACHE.delete(`emb:${table_name}:${record_id}`);
      }

      results.push({ id: record_id, table: table_name, success: true });
      console.log(`✅ Generated embedding for ${table_name}:${record_id}`);

    } catch (error) {
      const errorMessage = (error as Error).message;
      
      // Mark as failed with retry logic
      const attempts = (item.attempts || 0) + 1;
      const maxAttempts = item.max_attempts || 3;

      if (attempts < maxAttempts) {
        // Schedule retry with exponential backoff
        await supabase
          .from('embedding_queue')
          .update({
            status: 'pending',
            attempts: attempts,
            error_message: errorMessage,
            next_retry_at: new Date(Date.now() + Math.pow(2, attempts) * 60000).toISOString(),
          })
          .eq('id', id);
      } else {
        // Max retries reached, mark as failed
        await supabase
          .from('embedding_queue')
          .update({
            status: 'failed',
            processed_at: new Date().toISOString(),
            error_message: errorMessage,
          })
          .eq('id', id);
      }

      results.push({ id: record_id, table: table_name, success: false, error: errorMessage });
      console.error(`❌ Failed to generate embedding for ${table_name}:${record_id}:`, errorMessage);
    }
  }

  const succeeded = results.filter(r => r.success).length;
  return {
    processed: results.length,
    succeeded,
    failed: results.length - succeeded,
    results,
  };
}

/**
 * Handle queue processing endpoint
 */
async function handleProcessQueue(request: Request, env: Env): Promise<Response> {
  const url = new URL(request.url);
  const batchSize = Math.min(parseInt(url.searchParams.get('batch') || '20'), 50);

  const result = await processEmbeddingQueue(env, batchSize);

  return jsonResponse({
    success: true,
    ...result,
  });
}

/**
 * Get queue status
 */
async function handleQueueStatus(env: Env): Promise<Response> {
  const supabase = createClient(env.VITE_SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY);

  const { data: stats, error } = await supabase
    .from('embedding_queue')
    .select('status')
    .then(({ data }) => {
      if (!data) return { data: null, error: null };
      
      const counts = {
        pending: 0,
        processing: 0,
        completed: 0,
        failed: 0,
      };
      
      data.forEach((item: any) => {
        if (counts.hasOwnProperty(item.status)) {
          counts[item.status as keyof typeof counts]++;
        }
      });
      
      return { data: counts, error: null };
    });

  if (error) {
    return jsonResponse({ error: `Failed to get queue status: ${error}` }, 500);
  }

  return jsonResponse({
    success: true,
    queue: stats,
  });
}


// ==================== MAIN HANDLER ====================

export default {
  async fetch(request: Request, env: Env): Promise<Response> {
    // Handle CORS preflight
    if (request.method === 'OPTIONS') {
      return new Response(null, { headers: corsHeaders });
    }

    const url = new URL(request.url);
    const path = url.pathname;

    try {
      // Health check
      if (path === '/' || path === '/health') {
        return jsonResponse({
          service: 'embedding-api',
          version: '2.2.0',
          status: 'healthy',
          embeddingProvider: 'openrouter',
          endpoints: [
            'POST /embed - Generate single embedding',
            'POST /embed/batch - Generate batch embeddings',
            'POST /backfill - Backfill missing embeddings',
            'POST /regenerate - Regenerate specific embedding',
            'POST /process-queue - Process embedding queue',
            'GET /queue-status - Get queue status',
            'GET /stats - Get embedding statistics',
          ],
        });
      }

      // Single embedding (legacy - for direct calls)
      if ((path === '/embed' || path === '/generate-embedding') && request.method === 'POST') {
        return await handleSingleEmbedding(request, env);
      }

      // Batch embeddings
      if (path === '/embed/batch' && request.method === 'POST') {
        return await handleBatchEmbedding(request, env);
      }

      // Backfill missing embeddings
      if (path === '/backfill' && request.method === 'POST') {
        return await handleBackfill(request, env);
      }

      // Regenerate specific embedding
      if (path === '/regenerate' && request.method === 'POST') {
        return await handleRegenerate(request, env);
      }

      // Process queue manually
      if (path === '/process-queue' && request.method === 'POST') {
        return await handleProcessQueue(request, env);
      }

      // Queue status
      if (path === '/queue-status' && request.method === 'GET') {
        return await handleQueueStatus(env);
      }

      // Statistics
      if (path === '/stats' && request.method === 'GET') {
        return await handleStats(env);
      }

      return jsonResponse({ error: 'Not found' }, 404);

    } catch (error) {
      console.error('Unhandled error:', error);
      return jsonResponse({
        error: 'Internal server error',
        message: (error as Error).message,
      }, 500);
    }
  },

  // Scheduled handler - runs every 5 minutes
  async scheduled(event: { cron: string; scheduledTime: number }, env: Env, ctx: { waitUntil(promise: Promise<any>): void }): Promise<void> {
    console.log(`⏰ Cron triggered at ${new Date().toISOString()}`);
    
    ctx.waitUntil(
      processEmbeddingQueue(env, 20).then(result => {
        console.log(`📊 Queue processing complete:`, result);
      }).catch(error => {
        console.error('❌ Queue processing failed:', error);
      })
    );
  },
};
