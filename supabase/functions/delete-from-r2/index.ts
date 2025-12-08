import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { S3Client, DeleteObjectCommand } from 'npm:@aws-sdk/client-s3@3.x';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    // Get Cloudflare R2 credentials from environment variables
    const accountId = Deno.env.get('CLOUDFLARE_ACCOUNT_ID');
    const accessKeyId = Deno.env.get('CLOUDFLARE_R2_ACCESS_KEY_ID');
    const secretAccessKey = Deno.env.get('CLOUDFLARE_R2_SECRET_ACCESS_KEY');
    const bucketName = Deno.env.get('CLOUDFLARE_R2_BUCKET_NAME') || 'skill-echosystem';

    if (!accountId || !accessKeyId || !secretAccessKey) {
      return new Response(
        JSON.stringify({ error: 'Cloudflare R2 credentials not configured' }),
        {
          status: 500,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      );
    }

    // Parse request body
    const { url } = await req.json();

    if (!url) {
      return new Response(
        JSON.stringify({ error: 'URL is required' }),
        {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      );
    }

    // Extract filename from URL
    const urlParts = url.split('/');
    const filename = urlParts.slice(-2).join('/'); // Get folder/filename

    // Initialize S3 client for R2
    const s3Client = new S3Client({
      region: 'auto',
      endpoint: `https://${accountId}.r2.cloudflarestorage.com`,
      credentials: {
        accessKeyId,
        secretAccessKey,
      },
    });

    // Delete from R2
    const command = new DeleteObjectCommand({
      Bucket: bucketName,
      Key: filename,
    });

    await s3Client.send(command);

    return new Response(
      JSON.stringify({
        success: true,
        message: 'File deleted successfully',
      }),
      {
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );

  } catch (error) {
    console.error('Error deleting from R2:', error);
    return new Response(
      JSON.stringify({
        error: error instanceof Error ? error.message : 'Delete failed',
      }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  }
});
