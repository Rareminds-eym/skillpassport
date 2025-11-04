import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const { text, table, id, type = 'opportunity' } = await req.json();

    if (!text || !table || !id) {
      throw new Error('Missing required parameters: text, table, id');
    }

    console.log(`Generating embedding for ${type} #${id}`);

    // Use Render.com embedding service (FREE Transformers.js)
    const embeddingServiceUrl = Deno.env.get('EMBEDDING_SERVICE_URL') || 'https://embedings.onrender.com';
    
    const embeddingRes = await fetch(
      `${embeddingServiceUrl}/embed`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ text }),
      }
    );

    if (!embeddingRes.ok) {
      const errorText = await embeddingRes.text();
      throw new Error(`Embedding service error: ${embeddingRes.status} - ${errorText}`);
    }

    const { embedding } = await embeddingRes.json();

    console.log(`Generated embedding with ${embedding.length} dimensions`);

    // Update Supabase
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    );

    const { error: updateError } = await supabase
      .from(table)
      .update({ embedding })
      .eq('id', id);

    if (updateError) {
      throw updateError;
    }

    console.log(`✅ Successfully updated ${table} #${id} with embedding`);

    return new Response(
      JSON.stringify({ 
        success: true, 
        message: `Embedding generated for ${type} #${id}`,
        dimensions: embedding.length 
      }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200 
      }
    );
  } catch (error) {
    console.error('Error:', error);
    return new Response(
      JSON.stringify({ 
        success: false, 
        error: error.message 
      }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500 
      }
    );
  }
});

