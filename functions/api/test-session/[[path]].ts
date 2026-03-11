/**
 * Test API endpoint to verify Pages Functions are working
 */

interface Env {
  SUPABASE_URL: string;
  SUPABASE_SERVICE_ROLE_KEY: string;
}

interface PagesFunction<Env = any> {
  (context: { request: Request; env: Env }): Response | Promise<Response>;
}

export const onRequest: PagesFunction<Env> = async (context) => {
  const { request, env } = context;
  
  return new Response(
    JSON.stringify({
      success: true,
      message: 'Test API is working',
      timestamp: new Date().toISOString(),
      hasSupabaseUrl: !!env.SUPABASE_URL,
      hasSupabaseKey: !!env.SUPABASE_SERVICE_ROLE_KEY,
      supabaseUrl: env.SUPABASE_URL, // For debugging
    }),
    {
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*',
      }
    }
  );
};