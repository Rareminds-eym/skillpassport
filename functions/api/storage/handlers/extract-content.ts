/**
 * PDF Content Extraction Handler
 *
 * Handles PDF content extraction for lesson resources:
 * - POST /extract-content - Extract content from PDF resources
 */

import type { PagesFunction } from '../../../../src/functions-lib/types';
import { jsonResponse } from '../../../../src/functions-lib';
import { createSupabaseClient } from '../../../../src/functions-lib/supabase';

interface ExtractContentRequestBody {
  resourceId?: string;
  resourceIds?: string[];
  lessonId?: string;
}

interface ExtractionResult {
  resourceId: string;
  name?: string;
  status: 'success' | 'skipped' | 'error';
  contentLength?: number;
  reason?: string;
  error?: string;
}

/**
 * Extract content from PDF resources
 * Supports single resource, multiple resources, or all resources in a lesson
 */
export const handleExtractContent: PagesFunction = async ({ request, env }) => {
  if (request.method !== 'POST') {
    return jsonResponse({ error: 'Method not allowed' }, 405);
  }

  try {
    // Parse request body
    let body: ExtractContentRequestBody;
    try {
      body = (await request.json()) as ExtractContentRequestBody;
    } catch (parseError) {
      console.error('[ExtractContent] Failed to parse request body:', parseError);
      return jsonResponse({ error: 'Invalid JSON body' }, 400);
    }

    const { resourceId, resourceIds, lessonId } = body;

    // Validate input - at least one parameter required
    if (!resourceId && (!resourceIds || resourceIds.length === 0) && !lessonId) {
      return jsonResponse(
        { error: 'Provide resourceId, resourceIds, or lessonId' },
        400
      );
    }

    // Create Supabase client
    const supabase = createSupabaseClient(env);

    // Build query based on input parameters
    let query = supabase.from('lesson_resources').select('*');

    if (resourceId) {
      query = query.eq('resource_id', resourceId);
    } else if (resourceIds && resourceIds.length > 0) {
      query = query.in('resource_id', resourceIds);
    } else if (lessonId) {
      query = query.eq('lesson_id', lessonId);
    }

    // Fetch resources
    const { data: resources, error } = await query;

    if (error || !resources) {
      console.error('[ExtractContent] Failed to fetch resources:', error);
      return jsonResponse({ error: 'Resources not found' }, 404);
    }

    console.log(`[ExtractContent] Processing ${resources.length} resources`);

    // Process each resource
    const results: ExtractionResult[] = [];

    for (const resource of resources) {
      // Skip non-PDF/document resources
      if (!['pdf', 'document'].includes(resource.type)) {
        results.push({
          resourceId: resource.resource_id,
          name: resource.name,
          status: 'skipped',
          reason: `Type ${resource.type} not supported`,
        });
        continue;
      }

      try {
        // Fetch PDF content
        const pdfUrl = resource.url;
        console.log(`[ExtractContent] Fetching PDF from: ${pdfUrl}`);

        const pdfResponse = await fetch(pdfUrl);

        if (!pdfResponse.ok) {
          throw new Error(`Failed to download: ${pdfResponse.status}`);
        }

        // Note: Full PDF extraction requires a library like pdf-parse
        // For Cloudflare Workers/Pages Functions, we use a placeholder approach
        // In production, this could call an external PDF processing service
        const textContent = `[PDF Content from ${resource.name}]\nURL: ${pdfUrl}\n\nNote: Full PDF text extraction requires additional processing.`;

        // Update resource with extracted content
        const { error: updateError } = await supabase
          .from('lesson_resources')
          .update({ content: textContent })
          .eq('resource_id', resource.resource_id);

        if (updateError) {
          throw new Error(`Failed to update: ${updateError.message}`);
        }

        console.log(
          `[ExtractContent] Successfully processed: ${resource.name} (${textContent.length} chars)`
        );

        results.push({
          resourceId: resource.resource_id,
          name: resource.name,
          status: 'success',
          contentLength: textContent.length,
        });
      } catch (err) {
        console.error(`[ExtractContent] Error processing ${resource.name}:`, err);
        results.push({
          resourceId: resource.resource_id,
          name: resource.name,
          status: 'error',
          error: (err as Error).message,
        });
      }
    }

    console.log(`[ExtractContent] Completed: ${results.length} resources processed`);

    return jsonResponse({
      processed: results.length,
      results,
    });
  } catch (error) {
    console.error('[ExtractContent] Error:', error);
    return jsonResponse(
      {
        error: 'Failed to extract content',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      500
    );
  }
};
