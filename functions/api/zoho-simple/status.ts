/**
 * Simple Zoho Integration Status
 * 
 * Basic health check for Zoho integration
 * GET /api/zoho-simple/status
 */

export async function onRequestGet(context: any): Promise<Response> {
  const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type',
  };

  try {
    const zohoFlowWebhookUrl = context.env.ZOHO_FLOW_WEBHOOK_URL;
    
    const status = {
      service: 'Zoho Simple Integration',
      status: zohoFlowWebhookUrl ? 'configured' : 'not_configured',
      timestamp: new Date().toISOString(),
      webhook_configured: !!zohoFlowWebhookUrl,
      endpoints: {
        trigger: '/api/zoho-simple/trigger',
        status: '/api/zoho-simple/status'
      }
    };

    return new Response(JSON.stringify(status), {
      status: 200,
      headers: { 'Content-Type': 'application/json', ...corsHeaders }
    });

  } catch (error) {
    return new Response(JSON.stringify({
      service: 'Zoho Simple Integration',
      status: 'error',
      error: error instanceof Error ? error.message : 'Unknown error',
      timestamp: new Date().toISOString()
    }), {
      status: 500,
      headers: { 'Content-Type': 'application/json', ...corsHeaders }
    });
  }
}

export async function onRequest(context: any): Promise<Response> {
  if (context.request.method === 'GET') {
    return onRequestGet(context);
  }
  
  if (context.request.method === 'OPTIONS') {
    return new Response(null, { 
      status: 204, 
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'GET, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type',
      }
    });
  }

  return new Response(JSON.stringify({
    error: 'Method not allowed. Use GET to check status.'
  }), {
    status: 405,
    headers: { 'Content-Type': 'application/json' }
  });
}