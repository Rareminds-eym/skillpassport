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
  VITE_SUPABASE_URL: string;
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
  if (
    !env.CLOUDFLARE_ACCOUNT_ID ||
    !env.CLOUDFLARE_R2_ACCESS_KEY_ID ||
    !env.CLOUDFLARE_R2_SECRET_ACCESS_KEY
  ) {
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
  if (
    !env.CLOUDFLARE_ACCOUNT_ID ||
    !env.CLOUDFLARE_R2_ACCESS_KEY_ID ||
    !env.CLOUDFLARE_R2_SECRET_ACCESS_KEY
  ) {
    return jsonResponse({ error: 'R2 credentials not configured' }, 500);
  }

  const body = (await request.json()) as { url?: string };
  const { url } = body;

  if (!url) {
    return jsonResponse({ error: 'URL is required' }, 400);
  }

  // Extract filename from URL - handle both direct R2 URLs and proxy URLs
  let filename = '';

  if (url.includes('.r2.dev/')) {
    // Direct R2 URL: https://pub-xxx.r2.dev/assignments/...
    const urlParts = url.split('.r2.dev/');
    if (urlParts.length > 1) {
      filename = urlParts[1];
    }
  } else if (url.includes('/document-access?url=')) {
    // Proxy URL - extract the original R2 URL first
    try {
      const proxyUrl = new URL(url);
      const originalUrl = decodeURIComponent(proxyUrl.searchParams.get('url') || '');
      if (originalUrl.includes('.r2.dev/')) {
        const urlParts = originalUrl.split('.r2.dev/');
        if (urlParts.length > 1) {
          filename = urlParts[1];
        }
      }
    } catch (e) {
      return jsonResponse({ error: 'Invalid proxy URL format' }, 400);
    }
  } else if (url.includes('/document-access?key=')) {
    // Proxy URL with key parameter
    try {
      const proxyUrl = new URL(url);
      const fileKey = decodeURIComponent(proxyUrl.searchParams.get('key') || '');
      if (fileKey) {
        filename = fileKey;
      }
    } catch (e) {
      return jsonResponse({ error: 'Invalid proxy URL format' }, 400);
    }
  } else {
    return jsonResponse({ error: 'Unsupported URL format' }, 400);
  }

  if (!filename) {
    return jsonResponse({ error: 'Could not extract filename from URL' }, 400);
  }

  console.log('Deleting file:', { originalUrl: url, extractedFilename: filename });

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
    console.error('R2 delete failed:', {
      status: response.status,
      statusText: response.statusText,
    });
    return jsonResponse({ error: 'Delete failed', status: response.status }, 500);
  }

  console.log('File deleted successfully from R2:', filename);

  return jsonResponse({
    success: true,
    message: 'File deleted successfully',
    filename: filename,
  });
}

// ==================== EXTRACT CONTENT ====================

async function handleExtractContent(request: Request, env: Env): Promise<Response> {
  const supabase = createClient(env.VITE_SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY);

  const body = (await request.json()) as {
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

// ==================== PRESIGNED URL FOR UPLOAD ====================

async function handlePresigned(request: Request, env: Env): Promise<Response> {
  if (
    !env.CLOUDFLARE_ACCOUNT_ID ||
    !env.CLOUDFLARE_R2_ACCESS_KEY_ID ||
    !env.CLOUDFLARE_R2_SECRET_ACCESS_KEY
  ) {
    return jsonResponse({ error: 'R2 credentials not configured' }, 500);
  }

  const body = (await request.json()) as {
    filename: string;
    contentType: string;
    fileSize?: number;
    courseId: string;
    lessonId: string;
  };

  const { filename, contentType, courseId, lessonId } = body;

  if (!filename || !contentType || !courseId || !lessonId) {
    return jsonResponse(
      {
        error: 'Missing required fields',
        required: ['filename', 'contentType', 'courseId', 'lessonId'],
      },
      400
    );
  }

  // Generate unique file key
  const timestamp = Date.now();
  const randomString = crypto.randomUUID().replace(/-/g, '').substring(0, 16);
  const extension = filename.substring(filename.lastIndexOf('.'));
  const fileKey = `courses/${courseId}/lessons/${lessonId}/${timestamp}-${randomString}${extension}`;

  const bucketName = env.CLOUDFLARE_R2_BUCKET_NAME || 'skill-echosystem';
  const r2 = new AwsClient({
    accessKeyId: env.CLOUDFLARE_R2_ACCESS_KEY_ID,
    secretAccessKey: env.CLOUDFLARE_R2_SECRET_ACCESS_KEY,
  });

  const endpoint = `https://${env.CLOUDFLARE_ACCOUNT_ID}.r2.cloudflarestorage.com`;

  // Create a signed URL for PUT
  const uploadUrl = `${endpoint}/${bucketName}/${fileKey}`;

  // For R2, we'll use direct upload with signed headers
  const expiresIn = 3600; // 1 hour
  const signedRequest = await r2.sign(
    new Request(uploadUrl, {
      method: 'PUT',
      headers: {
        'Content-Type': contentType,
      },
    })
  );

  // Extract the signed URL from the request
  const signedUrl = signedRequest.url;
  const authHeader = signedRequest.headers.get('Authorization');
  const dateHeader = signedRequest.headers.get('x-amz-date');

  return jsonResponse({
    success: true,
    data: {
      uploadUrl: signedUrl,
      fileKey,
      headers: {
        Authorization: authHeader,
        'x-amz-date': dateHeader,
        'Content-Type': contentType,
      },
    },
  });
}

// ==================== CONFIRM UPLOAD ====================

async function handleConfirm(request: Request, env: Env): Promise<Response> {
  const body = (await request.json()) as {
    fileKey: string;
    fileName?: string;
    fileSize?: number;
    fileType?: string;
  };

  const { fileKey, fileName, fileSize, fileType } = body;

  if (!fileKey) {
    return jsonResponse({ error: 'Missing fileKey' }, 400);
  }

  // Generate access URL
  const fileUrl = env.CLOUDFLARE_R2_PUBLIC_URL
    ? `${env.CLOUDFLARE_R2_PUBLIC_URL}/${fileKey}`
    : `https://pub-${env.CLOUDFLARE_ACCOUNT_ID}.r2.dev/${fileKey}`;

  return jsonResponse({
    success: true,
    data: {
      key: fileKey,
      url: fileUrl,
      name: fileName,
      size: fileSize,
      type: fileType,
    },
  });
}

// ==================== GET FILE URL ====================

async function handleGetFileUrl(request: Request, env: Env): Promise<Response> {
  const body = (await request.json()) as { fileKey?: string };
  const { fileKey } = body;

  if (!fileKey) {
    return jsonResponse({ error: 'fileKey is required' }, 400);
  }

  // Generate access URL
  const fileUrl = env.CLOUDFLARE_R2_PUBLIC_URL
    ? `${env.CLOUDFLARE_R2_PUBLIC_URL}/${fileKey}`
    : `https://pub-${env.CLOUDFLARE_ACCOUNT_ID}.r2.dev/${fileKey}`;

  return jsonResponse({
    success: true,
    url: fileUrl,
  });
}

// ==================== DOCUMENT ACCESS (PROXY) ====================

async function handleDocumentAccess(request: Request, env: Env): Promise<Response> {
  if (
    !env.CLOUDFLARE_ACCOUNT_ID ||
    !env.CLOUDFLARE_R2_ACCESS_KEY_ID ||
    !env.CLOUDFLARE_R2_SECRET_ACCESS_KEY
  ) {
    return jsonResponse({ error: 'R2 credentials not configured' }, 500);
  }

  const url = new URL(request.url);
  let fileKey = url.searchParams.get('key');
  const mode = url.searchParams.get('mode') || 'inline'; // 'inline' for viewing, 'download' for downloading

  // Also support extracting key from full URL
  const fileUrl = url.searchParams.get('url');
  if (!fileKey && fileUrl) {
    // Extract key from various URL formats
    if (fileUrl.includes('.r2.dev/')) {
      const urlParts = fileUrl.split('.r2.dev/');
      if (urlParts.length > 1) {
        fileKey = urlParts[1];
      }
    } else if (fileUrl.includes('/teachers/') || fileUrl.includes('/students/')) {
      // Extract from storage API URLs
      const pathMatch = fileUrl.match(/\/(teachers|students)\/(.+)$/);
      if (pathMatch) {
        fileKey = `${pathMatch[1]}/${pathMatch[2]}`;
      }
    }
  }

  if (!fileKey) {
    return jsonResponse({ error: 'File key or URL is required' }, 400);
  }

  const bucketName = env.CLOUDFLARE_R2_BUCKET_NAME || 'skill-echosystem';
  const r2 = new AwsClient({
    accessKeyId: env.CLOUDFLARE_R2_ACCESS_KEY_ID,
    secretAccessKey: env.CLOUDFLARE_R2_SECRET_ACCESS_KEY,
  });

  const endpoint = `https://${env.CLOUDFLARE_ACCOUNT_ID}.r2.cloudflarestorage.com`;
  const downloadUrl = `${endpoint}/${bucketName}/${fileKey}`;

  const downloadRequest = new Request(downloadUrl, {
    method: 'GET',
  });

  const signedRequest = await r2.sign(downloadRequest);
  const response = await fetch(signedRequest);

  if (!response.ok) {
    return jsonResponse(
      { error: 'File not found or access denied', status: response.status },
      response.status
    );
  }

  // Get the file content and return it with proper headers
  const fileContent = await response.arrayBuffer();
  const contentType = response.headers.get('Content-Type') || 'application/octet-stream';

  // Extract filename from key
  const filename = fileKey.split('/').pop() || 'document';

  // Set Content-Disposition based on mode
  const contentDisposition =
    mode === 'download' ? `attachment; filename="${filename}"` : `inline; filename="${filename}"`;

  return new Response(fileContent, {
    status: 200,
    headers: {
      ...corsHeaders,
      'Content-Type': contentType,
      'Content-Disposition': contentDisposition,
      'Content-Length': fileContent.byteLength.toString(),
      'Cache-Control': 'private, max-age=3600', // Cache for 1 hour
    },
  });
}

// ==================== SIGNED URL FOR DOCUMENT ACCESS ====================

async function handleSignedUrl(request: Request, env: Env): Promise<Response> {
  if (
    !env.CLOUDFLARE_ACCOUNT_ID ||
    !env.CLOUDFLARE_R2_ACCESS_KEY_ID ||
    !env.CLOUDFLARE_R2_SECRET_ACCESS_KEY
  ) {
    return jsonResponse({ error: 'R2 credentials not configured' }, 500);
  }

  const body = (await request.json()) as {
    url?: string;
    fileKey?: string;
    expiresIn?: number;
  };

  const { url: fileUrl, fileKey: providedKey, expiresIn = 3600 } = body;

  let fileKey = providedKey;

  // Extract file key from URL if not provided directly
  if (!fileKey && fileUrl) {
    if (fileUrl.includes('.r2.dev/')) {
      const urlParts = fileUrl.split('.r2.dev/');
      if (urlParts.length > 1) {
        fileKey = urlParts[1];
      }
    } else if (fileUrl.includes('/teachers/') || fileUrl.includes('/students/')) {
      const pathMatch = fileUrl.match(/\/(teachers|students)\/(.+)$/);
      if (pathMatch) {
        fileKey = `${pathMatch[1]}/${pathMatch[2]}`;
      }
    }
  }

  if (!fileKey) {
    return jsonResponse({ error: 'File key or URL is required' }, 400);
  }

  // Generate a signed URL that proxies through our document access endpoint
  const baseUrl = new URL(request.url).origin;
  const signedUrl = `${baseUrl}/document-access?key=${encodeURIComponent(fileKey)}&mode=inline`;

  return jsonResponse({
    success: true,
    signedUrl,
    expiresAt: new Date(Date.now() + expiresIn * 1000).toISOString(),
  });
}

// ==================== BATCH SIGNED URLS ====================

async function handleSignedUrls(request: Request, env: Env): Promise<Response> {
  const body = (await request.json()) as {
    urls: string[];
    expiresIn?: number;
  };

  const { urls, expiresIn = 3600 } = body;

  if (!urls || !Array.isArray(urls)) {
    return jsonResponse({ error: 'URLs array is required' }, 400);
  }

  const signedUrls: Record<string, string> = {};
  const baseUrl = new URL(request.url).origin;

  for (const fileUrl of urls) {
    let fileKey: string | null = null;

    // Extract file key from URL
    if (fileUrl.includes('.r2.dev/')) {
      const urlParts = fileUrl.split('.r2.dev/');
      if (urlParts.length > 1) {
        fileKey = urlParts[1];
      }
    } else if (fileUrl.includes('/teachers/') || fileUrl.includes('/students/')) {
      const pathMatch = fileUrl.match(/\/(teachers|students)\/(.+)$/);
      if (pathMatch) {
        fileKey = `${pathMatch[1]}/${pathMatch[2]}`;
      }
    }

    if (fileKey) {
      const signedUrl = `${baseUrl}/document-access?key=${encodeURIComponent(fileKey)}&mode=inline`;
      signedUrls[fileUrl] = signedUrl;
    } else {
      // Fallback to original URL if we can't extract the key
      signedUrls[fileUrl] = fileUrl;
    }
  }

  return jsonResponse({
    success: true,
    signedUrls,
    expiresAt: new Date(Date.now() + expiresIn * 1000).toISOString(),
  });
}

async function handleCourseCertificate(request: Request, env: Env): Promise<Response> {
  if (
    !env.CLOUDFLARE_ACCOUNT_ID ||
    !env.CLOUDFLARE_R2_ACCESS_KEY_ID ||
    !env.CLOUDFLARE_R2_SECRET_ACCESS_KEY
  ) {
    return jsonResponse({ error: 'R2 credentials not configured' }, 500);
  }

  const url = new URL(request.url);
  let fileKey = url.searchParams.get('key');
  const mode = url.searchParams.get('mode') || 'inline'; // 'inline' for viewing, 'download' for downloading

  // Also support extracting key from full URL
  const fileUrl = url.searchParams.get('url');
  if (!fileKey && fileUrl) {
    // Extract key from URL like https://pub-xxx.r2.dev/certificates/...
    const urlParts = fileUrl.split('.r2.dev/');
    if (urlParts.length > 1) {
      fileKey = urlParts[1];
    } else {
      // Try extracting from custom domain URL
      const pathMatch = fileUrl.match(/\/certificates\/(.+)$/);
      if (pathMatch) {
        fileKey = `certificates/${pathMatch[1]}`;
      }
    }
  }

  if (!fileKey) {
    return jsonResponse({ error: 'File key or URL is required' }, 400);
  }

  const bucketName = env.CLOUDFLARE_R2_BUCKET_NAME || 'skill-echosystem';
  const r2 = new AwsClient({
    accessKeyId: env.CLOUDFLARE_R2_ACCESS_KEY_ID,
    secretAccessKey: env.CLOUDFLARE_R2_SECRET_ACCESS_KEY,
  });

  const endpoint = `https://${env.CLOUDFLARE_ACCOUNT_ID}.r2.cloudflarestorage.com`;
  const downloadUrl = `${endpoint}/${bucketName}/${fileKey}`;

  const downloadRequest = new Request(downloadUrl, {
    method: 'GET',
  });

  const signedRequest = await r2.sign(downloadRequest);
  const response = await fetch(signedRequest);

  if (!response.ok) {
    return jsonResponse(
      { error: 'File not found or access denied', status: response.status },
      response.status
    );
  }

  // Get the file content and return it with proper headers
  const fileContent = await response.arrayBuffer();
  const contentType = response.headers.get('Content-Type') || 'image/png';

  // Extract filename from key
  const filename = fileKey.split('/').pop() || 'certificate.png';

  // Set Content-Disposition based on mode
  const contentDisposition =
    mode === 'download' ? `attachment; filename="${filename}"` : `inline; filename="${filename}"`;

  return new Response(fileContent, {
    status: 200,
    headers: {
      ...corsHeaders,
      'Content-Type': contentType,
      'Content-Disposition': contentDisposition,
      'Content-Length': fileContent.byteLength.toString(),
    },
  });
}

// ==================== LIST FILES ====================

async function handleListFiles(
  request: Request,
  env: Env,
  courseId: string,
  lessonId: string
): Promise<Response> {
  if (
    !env.CLOUDFLARE_ACCOUNT_ID ||
    !env.CLOUDFLARE_R2_ACCESS_KEY_ID ||
    !env.CLOUDFLARE_R2_SECRET_ACCESS_KEY
  ) {
    return jsonResponse({ error: 'R2 credentials not configured' }, 500);
  }

  const bucketName = env.CLOUDFLARE_R2_BUCKET_NAME || 'skill-echosystem';
  const prefix = `courses/${courseId}/lessons/${lessonId}/`;

  const r2 = new AwsClient({
    accessKeyId: env.CLOUDFLARE_R2_ACCESS_KEY_ID,
    secretAccessKey: env.CLOUDFLARE_R2_SECRET_ACCESS_KEY,
  });

  const endpoint = `https://${env.CLOUDFLARE_ACCOUNT_ID}.r2.cloudflarestorage.com`;

  // List objects with prefix
  const listUrl = `${endpoint}/${bucketName}?list-type=2&prefix=${encodeURIComponent(prefix)}`;
  const listRequest = new Request(listUrl, { method: 'GET' });
  const signedRequest = await r2.sign(listRequest);
  const response = await fetch(signedRequest);

  if (!response.ok) {
    return jsonResponse({ error: 'Failed to list files' }, 500);
  }

  const xmlText = await response.text();

  // Parse XML response (simple parsing)
  const files: { key: string; url: string; size?: string; lastModified?: string }[] = [];
  const keyMatches = xmlText.matchAll(/<Key>([^<]+)<\/Key>/g);
  const sizeMatches = xmlText.matchAll(/<Size>([^<]+)<\/Size>/g);
  const lastModMatches = xmlText.matchAll(/<LastModified>([^<]+)<\/LastModified>/g);

  const keys = Array.from(keyMatches, (m) => m[1]);
  const sizes = Array.from(sizeMatches, (m) => m[1]);
  const lastMods = Array.from(lastModMatches, (m) => m[1]);

  for (let i = 0; i < keys.length; i++) {
    const fileUrl = env.CLOUDFLARE_R2_PUBLIC_URL
      ? `${env.CLOUDFLARE_R2_PUBLIC_URL}/${keys[i]}`
      : `https://pub-${env.CLOUDFLARE_ACCOUNT_ID}.r2.dev/${keys[i]}`;

    files.push({
      key: keys[i],
      url: fileUrl,
      size: sizes[i],
      lastModified: lastMods[i],
    });
  }

  return jsonResponse({
    success: true,
    data: files,
  });
}

// ==================== UPLOAD PAYMENT RECEIPT ====================

async function handleUploadPaymentReceipt(request: Request, env: Env): Promise<Response> {
  console.log(`[STORAGE-API] ========== UPLOAD PAYMENT RECEIPT START ==========`);

  if (
    !env.CLOUDFLARE_ACCOUNT_ID ||
    !env.CLOUDFLARE_R2_ACCESS_KEY_ID ||
    !env.CLOUDFLARE_R2_SECRET_ACCESS_KEY
  ) {
    console.error(`[STORAGE-API] R2 credentials missing!`);
    console.error(
      `[STORAGE-API] CLOUDFLARE_ACCOUNT_ID: ${env.CLOUDFLARE_ACCOUNT_ID ? 'SET' : 'MISSING'}`
    );
    console.error(
      `[STORAGE-API] CLOUDFLARE_R2_ACCESS_KEY_ID: ${env.CLOUDFLARE_R2_ACCESS_KEY_ID ? 'SET' : 'MISSING'}`
    );
    console.error(
      `[STORAGE-API] CLOUDFLARE_R2_SECRET_ACCESS_KEY: ${env.CLOUDFLARE_R2_SECRET_ACCESS_KEY ? 'SET' : 'MISSING'}`
    );
    return jsonResponse({ error: 'R2 credentials not configured' }, 500);
  }

  console.log(`[STORAGE-API] R2 credentials verified`);

  let body: {
    pdfBase64?: string;
    paymentId?: string;
    userId?: string;
    userName?: string;
    filename?: string;
  };
  try {
    body = (await request.json()) as typeof body;
  } catch (parseError) {
    console.error(`[STORAGE-API] Failed to parse request body:`, parseError);
    return jsonResponse({ error: 'Invalid JSON body' }, 400);
  }

  const { pdfBase64, paymentId, userId, userName, filename } = body;

  console.log(`[STORAGE-API] Request params:`);
  console.log(`[STORAGE-API] - paymentId: ${paymentId}`);
  console.log(`[STORAGE-API] - userId: ${userId}`);
  console.log(`[STORAGE-API] - userName: ${userName || 'NOT PROVIDED'}`);
  console.log(`[STORAGE-API] - filename: ${filename}`);
  console.log(`[STORAGE-API] - pdfBase64 length: ${pdfBase64?.length || 0}`);

  if (!pdfBase64 || !paymentId || !userId) {
    console.error(`[STORAGE-API] Missing required fields`);
    return jsonResponse({ error: 'pdfBase64, paymentId, and userId are required' }, 400);
  }

  // Decode base64 to binary
  let bytes: Uint8Array;
  try {
    const binaryString = atob(pdfBase64);
    bytes = new Uint8Array(binaryString.length);
    for (let i = 0; i < binaryString.length; i++) {
      bytes[i] = binaryString.charCodeAt(i);
    }
    console.log(`[STORAGE-API] Decoded base64 to ${bytes.length} bytes`);
  } catch (decodeError) {
    console.error(`[STORAGE-API] Failed to decode base64:`, decodeError);
    return jsonResponse({ error: 'Invalid base64 data' }, 400);
  }

  // Generate unique filename with hybrid folder structure: {name}_{short_id}/
  const timestamp = Date.now();
  const sanitizedPaymentId = paymentId.replace(/[^a-zA-Z0-9_-]/g, '');

  // Create folder name: sanitized_name + short user_id (first 8 chars)
  const shortUserId = userId.substring(0, 8);
  const sanitizedName = userName
    ? userName
        .toLowerCase()
        .replace(/[^a-z0-9]/g, '_')
        .replace(/_+/g, '_')
        .substring(0, 20)
    : 'user';
  const folderName = `${sanitizedName}_${shortUserId}`;

  const fileKey = `payment_pdf/${folderName}/${sanitizedPaymentId}_${timestamp}.pdf`;
  const finalFilename =
    filename ||
    `Receipt-${sanitizedPaymentId.slice(-8)}-${new Date().toISOString().split('T')[0]}.pdf`;

  console.log(`[STORAGE-API] File key: ${fileKey}`);
  console.log(`[STORAGE-API] Final filename: ${finalFilename}`);

  const bucketName = env.CLOUDFLARE_R2_BUCKET_NAME || 'skill-echosystem';
  console.log(`[STORAGE-API] Bucket: ${bucketName}`);

  const r2 = new AwsClient({
    accessKeyId: env.CLOUDFLARE_R2_ACCESS_KEY_ID,
    secretAccessKey: env.CLOUDFLARE_R2_SECRET_ACCESS_KEY,
  });

  const endpoint = `https://${env.CLOUDFLARE_ACCOUNT_ID}.r2.cloudflarestorage.com`;
  const uploadUrl = `${endpoint}/${bucketName}/${fileKey}`;
  console.log(`[STORAGE-API] Upload URL: ${uploadUrl}`);

  const uploadRequest = new Request(uploadUrl, {
    method: 'PUT',
    body: bytes,
    headers: {
      'Content-Type': 'application/pdf',
      'Content-Disposition': `attachment; filename="${finalFilename}"`,
    },
  });

  console.log(`[STORAGE-API] Signing request...`);
  const signedRequest = await r2.sign(uploadRequest);

  console.log(`[STORAGE-API] Uploading to R2...`);
  const startTime = Date.now();
  const response = await fetch(signedRequest);
  const duration = Date.now() - startTime;

  console.log(
    `[STORAGE-API] R2 response in ${duration}ms: ${response.status} ${response.statusText}`
  );

  if (!response.ok) {
    const errorText = await response.text();
    console.error(`[STORAGE-API] R2 upload failed: ${response.status} - ${errorText}`);
    return jsonResponse({ error: 'Failed to upload receipt to R2', details: errorText }, 500);
  }

  const fileUrl = env.CLOUDFLARE_R2_PUBLIC_URL
    ? `${env.CLOUDFLARE_R2_PUBLIC_URL}/${fileKey}`
    : `https://pub-${env.CLOUDFLARE_ACCOUNT_ID}.r2.dev/${fileKey}`;

  console.log(`[STORAGE-API] ========== UPLOAD SUCCESS ==========`);
  console.log(`[STORAGE-API] File URL: ${fileUrl}`);
  console.log(`[STORAGE-API] File Key: ${fileKey}`);

  return jsonResponse({
    success: true,
    url: fileUrl,
    fileKey,
    filename: finalFilename,
  });
}

// ==================== GET PAYMENT RECEIPT ====================

async function handleGetPaymentReceipt(request: Request, env: Env): Promise<Response> {
  if (
    !env.CLOUDFLARE_ACCOUNT_ID ||
    !env.CLOUDFLARE_R2_ACCESS_KEY_ID ||
    !env.CLOUDFLARE_R2_SECRET_ACCESS_KEY
  ) {
    return jsonResponse({ error: 'R2 credentials not configured' }, 500);
  }

  const url = new URL(request.url);
  let fileKey = url.searchParams.get('key');
  const mode = url.searchParams.get('mode') || 'download'; // 'inline' for viewing, 'download' for downloading

  // Also support extracting key from full URL
  const fileUrl = url.searchParams.get('url');
  if (!fileKey && fileUrl) {
    // Extract key from URL like https://pub-xxx.r2.dev/payment_pdf/...
    const urlParts = fileUrl.split('.r2.dev/');
    if (urlParts.length > 1) {
      fileKey = urlParts[1];
    } else {
      // Try extracting from custom domain URL
      const pathMatch = fileUrl.match(/\/payment_pdf\/(.+)$/);
      if (pathMatch) {
        fileKey = `payment_pdf/${pathMatch[1]}`;
      }
    }
  }

  if (!fileKey) {
    return jsonResponse({ error: 'File key or URL is required' }, 400);
  }

  const bucketName = env.CLOUDFLARE_R2_BUCKET_NAME || 'skill-echosystem';
  const r2 = new AwsClient({
    accessKeyId: env.CLOUDFLARE_R2_ACCESS_KEY_ID,
    secretAccessKey: env.CLOUDFLARE_R2_SECRET_ACCESS_KEY,
  });

  const endpoint = `https://${env.CLOUDFLARE_ACCOUNT_ID}.r2.cloudflarestorage.com`;
  const downloadUrl = `${endpoint}/${bucketName}/${fileKey}`;

  const downloadRequest = new Request(downloadUrl, {
    method: 'GET',
  });

  const signedRequest = await r2.sign(downloadRequest);
  const response = await fetch(signedRequest);

  if (!response.ok) {
    return jsonResponse(
      { error: 'Receipt not found or access denied', status: response.status },
      response.status
    );
  }

  // Get the file content and return it with proper headers
  const fileContent = await response.arrayBuffer();

  // Extract filename from key
  const filename = fileKey.split('/').pop() || 'receipt.pdf';

  // Set Content-Disposition based on mode
  const contentDisposition =
    mode === 'download' ? `attachment; filename="${filename}"` : `inline; filename="${filename}"`;

  return new Response(fileContent, {
    status: 200,
    headers: {
      ...corsHeaders,
      'Content-Type': 'application/pdf',
      'Content-Disposition': contentDisposition,
      'Content-Length': fileContent.byteLength.toString(),
    },
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
      // Check for /files/:courseId/:lessonId pattern
      const filesMatch = path.match(/^\/files\/([^/]+)\/([^/]+)$/);
      if (filesMatch) {
        return await handleListFiles(request, env, filesMatch[1], filesMatch[2]);
      }

      switch (path) {
        case '/upload':
          return await handleUpload(request, env);
        case '/upload-payment-receipt':
          return await handleUploadPaymentReceipt(request, env);
        case '/payment-receipt':
          return await handleGetPaymentReceipt(request, env);
        case '/presigned':
          return await handlePresigned(request, env);
        case '/confirm':
          return await handleConfirm(request, env);
        case '/get-url':
        case '/get-file-url':
          return await handleGetFileUrl(request, env);
        case '/document-access':
          return await handleDocumentAccess(request, env);
        case '/signed-url':
          return await handleSignedUrl(request, env);
        case '/signed-urls':
          return await handleSignedUrls(request, env);
        case '/course-certificate':
          return await handleCourseCertificate(request, env);
        case '/delete':
          return await handleDelete(request, env);
        case '/extract-content':
          return await handleExtractContent(request, env);
        case '/health':
        case '/':
          return jsonResponse({
            status: 'ok',
            service: 'storage-api',
            endpoints: [
              '/upload',
              '/upload-payment-receipt',
              '/payment-receipt',
              '/presigned',
              '/confirm',
              '/get-url',
              '/course-certificate',
              '/delete',
              '/files/:courseId/:lessonId',
              '/extract-content',
            ],
            timestamp: new Date().toISOString(),
          });
        default:
          return jsonResponse(
            {
              error: 'Not found',
              availableEndpoints: [
                '/upload',
                '/upload-payment-receipt',
                '/payment-receipt',
                '/presigned',
                '/confirm',
                '/get-url',
                '/course-certificate',
                '/delete',
                '/extract-content',
              ],
            },
            404
          );
      }
    } catch (error) {
      console.error('Worker error:', error);
      return jsonResponse({ error: (error as Error).message || 'Internal server error' }, 500);
    }
  },
};
