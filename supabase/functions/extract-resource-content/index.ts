import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.38.4';
import { extractText, getDocumentProxy } from 'npm:unpdf@0.11.0';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
};

/**
 * Edge Function to extract text content from PDF/document resources
 * This enables the AI Tutor to understand and reference PDF content
 * 
 * Usage: POST with { resourceId: string } or { resourceIds: string[] }
 */
serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const SUPABASE_URL = Deno.env.get('SUPABASE_URL')!;
    const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    
    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);
    
    const { resourceId, resourceIds, lessonId } = await req.json();
    
    // Get resources to process
    let query = supabase.from('lesson_resources').select('*');
    
    if (resourceId) {
      query = query.eq('resource_id', resourceId);
    } else if (resourceIds && resourceIds.length > 0) {
      query = query.in('resource_id', resourceIds);
    } else if (lessonId) {
      query = query.eq('lesson_id', lessonId);
    } else {
      return new Response(
        JSON.stringify({ error: 'Provide resourceId, resourceIds, or lessonId' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }
    
    const { data: resources, error } = await query;
    
    if (error || !resources) {
      return new Response(
        JSON.stringify({ error: 'Resources not found' }),
        { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }
    
    const results = [];
    
    for (const resource of resources) {
      // Only process PDFs and documents
      if (!['pdf', 'document'].includes(resource.type)) {
        results.push({ 
          resourceId: resource.resource_id, 
          status: 'skipped', 
          reason: `Type ${resource.type} not supported for extraction` 
        });
        continue;
      }
      
      try {
        // Fetch the PDF from storage
        const pdfUrl = resource.url;
        
        // If it's a Supabase storage URL, download it
        let pdfContent: ArrayBuffer;
        
        if (pdfUrl.includes('supabase') && pdfUrl.includes('/storage/')) {
          // Extract bucket and path from URL
          const urlParts = pdfUrl.split('/storage/v1/object/public/');
          if (urlParts.length === 2) {
            const [bucket, ...pathParts] = urlParts[1].split('/');
            const path = pathParts.join('/');
            
            const { data: fileData, error: downloadError } = await supabase.storage
              .from(bucket)
              .download(path);
            
            if (downloadError || !fileData) {
              throw new Error(`Failed to download: ${downloadError?.message}`);
            }
            
            pdfContent = await fileData.arrayBuffer();
          } else {
            // Direct URL fetch
            const response = await fetch(pdfUrl);
            pdfContent = await response.arrayBuffer();
          }
        } else {
          // External URL
          const response = await fetch(pdfUrl);
          pdfContent = await response.arrayBuffer();
        }
        
        // Extract text from PDF using unpdf (optimized for serverless)
        // Use mergePages: false to get text per page with page numbers
        const pdf = await getDocumentProxy(new Uint8Array(pdfContent));
        const { totalPages, text: pageTexts } = await extractText(pdf, { mergePages: false });
        const textContent = formatTextWithPageNumbers(pageTexts, totalPages);
        
        // Update the resource with extracted content
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
          preview: textContent.slice(0, 200) + '...'
        });
        
      } catch (err) {
        results.push({
          resourceId: resource.resource_id,
          name: resource.name,
          status: 'error',
          error: (err as Error).message
        });
      }
    }
    
    return new Response(
      JSON.stringify({ 
        processed: results.length,
        results 
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
    
  } catch (error) {
    console.error('Error:', error);
    return new Response(
      JSON.stringify({ error: (error as Error).message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});

/**
 * Format extracted text with page numbers for better AI context
 */
function formatTextWithPageNumbers(pageTexts: string[], totalPages: number): string {
  if (!pageTexts || pageTexts.length === 0) {
    return 'Unable to extract text content from this PDF. The PDF may be image-based or encrypted.';
  }
  
  const formattedPages = pageTexts.map((pageText, index) => {
    const pageNum = index + 1;
    const cleanedText = pageText
      .replace(/\s+/g, ' ')
      .trim();
    
    if (!cleanedText) {
      return `[Page ${pageNum}/${totalPages}]\n(No text content on this page)`;
    }
    
    return `[Page ${pageNum}/${totalPages}]\n${cleanedText}`;
  });
  
  return formattedPages.join('\n\n---\n\n');
}
