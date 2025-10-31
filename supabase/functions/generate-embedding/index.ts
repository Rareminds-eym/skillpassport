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

    // Generate embedding using OpenRouter
    const openrouterKey = Deno.env.get('OPENROUTER_API_KEY');
    
    if (!openrouterKey) {
      throw new Error('OPENROUTER_API_KEY not configured');
    }

    // Use OpenRouter's embedding model (you can use text-embedding-ada-002 through OpenRouter)
    const embeddingRes = await fetch('https://openrouter.ai/api/v1/embeddings', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${openrouterKey}`,
        'Content-Type': 'application/json',
        'HTTP-Referer': 'https://skillpassport.app', // Your app URL
        'X-Title': 'SkillPassport',
      },
      body: JSON.stringify({
        input: text,
        model: 'openai/text-embedding-ada-002', // Available through OpenRouter
      }),
    });

    if (!embeddingRes.ok) {
      const errorText = await embeddingRes.text();
      console.error('OpenRouter error:', errorText);
      throw new Error(`OpenRouter API error: ${embeddingRes.status} - ${errorText}`);
    }

    const { data } = await embeddingRes.json();
    const embedding = data[0].embedding;

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

