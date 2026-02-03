/**
 * File Listing Handler
 *
 * Handles file listing for course lessons:
 * - GET /files/:courseId/:lessonId - List all files in a lesson
 */

import type { PagesFunction } from '../../../../src/functions-lib/types';
import { jsonResponse } from '../../../../src/functions-lib';
import { R2Client } from '../utils/r2-client';

interface FileInfo {
  key: string;
  url: string;
  size?: string;
  lastModified?: string;
}

/**
 * List all files in a course lesson
 * Files are stored with prefix: courses/{courseId}/lessons/{lessonId}/
 */
export const handleListFiles: PagesFunction = async ({ request, env, params }) => {
  if (request.method !== 'GET') {
    return jsonResponse({ error: 'Method not allowed' }, 405);
  }

  try {
    // Extract params from context (Pages Functions provides params from [[path]])
    const courseId = (params as any)?.courseId;
    const lessonId = (params as any)?.lessonId;

    // Validate parameters
    if (!courseId || !lessonId) {
      return jsonResponse({ error: 'courseId and lessonId are required' }, 400);
    }

    console.log(`[ListFiles] Listing files for course: ${courseId}, lesson: ${lessonId}`);

    // Initialize R2 client
    const r2Client = new R2Client(env);

    // Build prefix for this lesson's files
    const prefix = `courses/${courseId}/lessons/${lessonId}/`;

    // List objects with prefix (R2Client.list returns parsed array)
    const objects = await r2Client.list(prefix);

    console.log(`[ListFiles] Found ${objects.length} files`);

    // Map R2Objects to FileInfo format
    const files: FileInfo[] = objects.map((obj) => ({
      key: obj.key,
      url: r2Client.getPublicUrl(obj.key),
      size: obj.size.toString(),
      lastModified: obj.lastModified.toISOString(),
    }));

    return jsonResponse({
      success: true,
      data: files,
    });
  } catch (error) {
    console.error('[ListFiles] Error:', error);
    return jsonResponse(
      {
        error: 'Failed to list files',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      500
    );
  }
};
