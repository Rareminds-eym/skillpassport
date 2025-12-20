/**
 * Storage API Cloudflare Worker
 * Handles R2 storage operations:
 * - /upload - Upload file to R2
 * - /delete - Delete file from R2
 * - /extract-content - Extract text from PDF resources
 */

import { createClient } from '@supabase/supabase-js';
import { AwsClient } from 'aws4fetch';

export interface Env {
  SUPABASE_URL: string;
  SUPABASE_SERVICE_ROLE_KEY: string;
  CLOUDFLARE_ACCOUNT_ID: string;
  CLOUDFLARE_R2_ACCESS_KEY_ID: string;
  CLOUDFLARE_R2_SECRET_ACCESS_KEY: string;
  CLOUDFLARE_R2_BUCKET_NAME: string;
  CLOUDFLARE_R2_PUBLIC_URL?: string;
}

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'GET, POST, DELETE, OPTIONS',
};

function jsonResponse(data: any, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  });
}

// ==================== UPLOAD ====================

async function handleUpload(request: Request, env: Env): Promise<Response> {
  if (!env.CLOUDFLARE_ACCOUNT_ID || !env.CLOUDFLARE_R2_ACCESS_KEY_ID || !env.CLOUDFLARE_R2_SECRET_ACCESS_KEY) {
    return jsonResponse({ error: 'R2 credentials not configured' }, 500);
  }

  const formData = await request.formData();
  const file = formData.get('file') as File;
  const filename = formData.get('filename') as string;

  if (!file || !filename) {
    return jsonResponse({ error: 'File and filename are required' }, 400);
  }

  const bucketName = env.CLOUDFLARE_R2_BUCKET_NAME || 'skill-echosystem';
  const r2 = new AwsClient({
    accessKeyId: env.CLOUDFLARE_R2_ACCESS_KEY_ID,
    secretAccessKey: env.CLOUDFLARE_R2_SECRET_ACCESS_KEY,
  });

  const endpoint = `https://${env.CLOUDFLARE_ACCOUNT_ID}.r2.cloudflarestorage.com`;
  const arrayBuffer = await file.arrayBuffer();

  const uploadRequest = new Request(`${endpoint}/${bucketName}/${filename}`, {
    method: 'PUT',
    body: arrayBuffer,
    headers: {
      'Content-Type': file.type,
    },
  });

  const signedRequest = await r2.sign(uploadRequest);
  const response = await fetch(signedRequest);

  if (!response.ok) {
    return jsonResponse({ error: 'Upload failed' }, 500);
  }

  const fileUrl = env.CLOUDFLARE_R2_PUBLIC_URL
    ? `${env.CLOUDFLARE_R2_PUBLIC_URL}/${filename}`
    : `https://pub-${env.CLOUDFLARE_ACCOUNT_ID}.r2.dev/${filename}`;

  return jsonResponse({
    success: true,
    url: fileUrl,
    filename,
  });
}

// ==================== DELETE ====================

async function handleDelete(request: Request, env: Env): Promise<Response> {
  if (!env.CLOUDFLARE_ACCOUNT_ID || !env.CLOUDFLARE_R2_ACCESS_KEY_ID || !env.CLOUDFLARE_R2_SECRET_ACCESS_KEY) {
    return jsonResponse({ error: 'R2 credentials not configured' }, 500);
  }

  const body = await request.json() as { url?: string };
  const { url } = body;

  if (!url) {
    return jsonResponse({ error: 'URL is required' }, 400);
  }

  // Extract filename from URL
  const urlParts = url.split('/');
  const filename = urlParts.slice(-2).join('/');

  const bucketName = env.CLOUDFLARE_R2_BUCKET_NAME || 'skill-echosystem';
  const r2 = new AwsClient({
    accessKeyId: env.CLOUDFLARE_R2_ACCESS_KEY_ID,
    secretAccessKey: env.CLOUDFLARE_R2_SECRET_ACCESS_KEY,
  });

  const endpoint = `https://${env.CLOUDFLARE_ACCOUNT_ID}.r2.cloudflarestorage.com`;

  const deleteRequest = new Request(`${endpoint}/${bucketName}/${filename}`, {
    method: 'DELETE',
  });

  const signedRequest = await r2.sign(deleteRequest);
  const response = await fetch(signedRequest);

  if (!response.ok && response.status !== 204) {
    return jsonResponse({ error: 'Delete failed' }, 500);
  }

  return jsonResponse({
    success: true,
    message: 'File deleted successfully',
  });
}

// ==================== EXTRACT CONTENT ====================

async function handleExtractContent(request: Request, env: Env): Promise<Response> {
  const supabase = createClient(env.SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY);

  const body = await request.json() as {
    resourceId?: string;
    resourceIds?: string[];
    lessonId?: string;
  };
  const { resourceId, resourceIds, lessonId } = body;

  // Get resources to process
  let query = supabase.from('lesson_resources').select('*');

  if (resourceId) {
    query = query.eq('resource_id', resourceId);
  } else if (resourceIds && resourceIds.length > 0) {
    query = query.in('resource_id', resourceIds);
  } else if (lessonId) {
    query = query.eq('lesson_id', lessonId);
  } else {
    return jsonResponse({ error: 'Provide resourceId, resourceIds, or lessonId' }, 400);
  }

  const { data: resources, error } = await query;

  if (error || !resources) {
    return jsonResponse({ error: 'Resources not found' }, 404);
  }

  const results = [];

  for (const resource of resources) {
    if (!['pdf', 'document'].includes(resource.type)) {
      results.push({
        resourceId: resource.resource_id,
        status: 'skipped',
        reason: `Type ${resource.type} not supported`,
      });
      continue;
    }

    try {
      // Fetch PDF content
      const pdfUrl = resource.url;
      const pdfResponse = await fetch(pdfUrl);
      
      if (!pdfResponse.ok) {
        throw new Error(`Failed to download: ${pdfResponse.status}`);
      }

      // Note: Full PDF extraction requires a library like pdf-parse
      // For Cloudflare Workers, we'd need to use a simpler approach or external service
      // This is a placeholder that stores the URL for later processing
      const textContent = `[PDF Content from ${resource.name}]\nURL: ${pdfUrl}\n\nNote: Full PDF text extraction requires additional processing.`;

      // Update resource with placeholder content
      const { error: updateError } = await supabase
        .from('lesson_resources')
        .update({ content: textContent })
        .eq('resource_id', resource.resource_id);

      if (updateError) {
        throw new Error(`Failed to update: ${updateError.message}`);
      }

      results.push({
        resourceId: resource.resource_id,
        name: resource.name,
        status: 'success',
        contentLength: textContent.length,
      });
    } catch (err) {
      results.push({
        resourceId: resource.resource_id,
        name: resource.name,
        status: 'error',
        error: (err as Error).message,
      });
    }
  }

  return jsonResponse({
    processed: results.length,
    results,
  });
}

// ==================== MAIN HANDLER ====================

export default {
  async fetch(request: Request, env: Env): Promise<Response> {
    if (request.method === 'OPTIONS') {
      return new Response('ok', { headers: corsHeaders });
    }

    const url = new URL(request.url);
    const path = url.pathname;

    try {
      switch (path) {
        case '/upload':
          return await handleUpload(request, env);
        case '/delete':
          return await handleDelete(request, env);
        case '/extract-content':
          return await handleExtractContent(request, env);
        case '/health':
          return jsonResponse({ status: 'ok', timestamp: new Date().toISOString() });
        default:
          return jsonResponse({ error: 'Not found' }, 404);
      }
    } catch (error) {
      console.error('Worker error:', error);
      return jsonResponse({ error: (error as Error).message || 'Internal server error' }, 500);
    }
  },
};
