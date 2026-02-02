/**
 * Presigned URL Handlers
 * 
 * Handles presigned URL generation for client-side uploads:
 * - POST /presigned - Generate presigned URL for upload
 * - POST /confirm - Confirm upload completion and get public URL
 * - POST /get-url - Get public URL from file key
 * - POST /get-file-url - Alias for get-url
 */

import { R2Client } from '../utils/r2-client';

type PagesFunction = (context: { request: Request; env: any }) => Promise<Response> | Response;

interface PresignedRequestBody {
  filename: string;
  contentType: string;
  fileSize?: number;
  courseId: string;
  lessonId: string;
}

interface ConfirmRequestBody {
  fileKey: string;
  fileName?: string;
  fileSize?: number;
  fileType?: string;
}

interface GetUrlRequestBody {
  fileKey: string;
}

/**
 * Generate presigned URL for client-side upload
 */
export const handlePresigned: PagesFunction = async ({ request, env }) => {
  if (request.method !== 'POST') {
    return new Response(JSON.stringify({ error: 'Method not allowed' }), {
      status: 405,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  try {
    const body = await request.json() as PresignedRequestBody;
    const { filename, contentType, courseId, lessonId } = body;

    // Validate required fields
    if (!filename || !contentType || !courseId || !lessonId) {
      return new Response(
        JSON.stringify({
          error: 'Missing required fields',
          required: ['filename', 'contentType', 'courseId', 'lessonId'],
        }),
        {
          status: 400,
          headers: { 'Content-Type': 'application/json' },
        }
      );
    }

    // Initialize R2 client
    const r2Client = new R2Client(env);

    // Generate unique file key
    const timestamp = Date.now();
    const randomString = crypto.randomUUID().replace(/-/g, '').substring(0, 16);
    const extension = filename.substring(filename.lastIndexOf('.'));
    const fileKey = `courses/${courseId}/lessons/${lessonId}/${timestamp}-${randomString}${extension}`;

    // Generate presigned URL with proper parameters
    const presignedData = await r2Client.generatePresignedUrl(fileKey, contentType, 3600);

    return new Response(
      JSON.stringify({
        success: true,
        data: {
          uploadUrl: presignedData.url,
          fileKey,
          headers: presignedData.headers,
        },
      }),
      {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
      }
    );
  } catch (error) {
    console.error('[Presigned] Error generating presigned URL:', error);
    return new Response(
      JSON.stringify({
        error: 'Failed to generate presigned URL',
        details: error instanceof Error ? error.message : 'Unknown error',
      }),
      {
        status: 500,
        headers: { 'Content-Type': 'application/json' },
      }
    );
  }
};

/**
 * Confirm upload completion and return public URL
 */
export const handleConfirm: PagesFunction = async ({ request, env }) => {
  if (request.method !== 'POST') {
    return new Response(JSON.stringify({ error: 'Method not allowed' }), {
      status: 405,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  try {
    const body = await request.json() as ConfirmRequestBody;
    const { fileKey, fileName, fileSize, fileType } = body;

    // Validate required fields
    if (!fileKey) {
      return new Response(
        JSON.stringify({ error: 'Missing fileKey' }),
        {
          status: 400,
          headers: { 'Content-Type': 'application/json' },
        }
      );
    }

    // Initialize R2 client
    const r2Client = new R2Client(env);

    // Generate public URL
    const fileUrl = r2Client.getPublicUrl(fileKey);

    return new Response(
      JSON.stringify({
        success: true,
        data: {
          key: fileKey,
          url: fileUrl,
          name: fileName,
          size: fileSize,
          type: fileType,
        },
      }),
      {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
      }
    );
  } catch (error) {
    console.error('[Confirm] Error confirming upload:', error);
    return new Response(
      JSON.stringify({
        error: 'Failed to confirm upload',
        details: error instanceof Error ? error.message : 'Unknown error',
      }),
      {
        status: 500,
        headers: { 'Content-Type': 'application/json' },
      }
    );
  }
};

/**
 * Get public URL from file key
 */
export const handleGetUrl: PagesFunction = async ({ request, env }) => {
  if (request.method !== 'POST') {
    return new Response(JSON.stringify({ error: 'Method not allowed' }), {
      status: 405,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  try {
    const body = await request.json() as GetUrlRequestBody;
    const { fileKey } = body;

    // Validate required fields
    if (!fileKey) {
      return new Response(
        JSON.stringify({ error: 'fileKey is required' }),
        {
          status: 400,
          headers: { 'Content-Type': 'application/json' },
        }
      );
    }

    // Initialize R2 client
    const r2Client = new R2Client(env);

    // Generate public URL
    const fileUrl = r2Client.getPublicUrl(fileKey);

    return new Response(
      JSON.stringify({
        success: true,
        url: fileUrl,
      }),
      {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
      }
    );
  } catch (error) {
    console.error('[GetUrl] Error getting URL:', error);
    return new Response(
      JSON.stringify({
        error: 'Failed to get URL',
        details: error instanceof Error ? error.message : 'Unknown error',
      }),
      {
        status: 500,
        headers: { 'Content-Type': 'application/json' },
      }
    );
  }
};

/**
 * Alias for handleGetUrl
 */
export const handleGetFileUrl = handleGetUrl;
