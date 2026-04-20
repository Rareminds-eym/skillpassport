/**
 * Simple Zoho Flow Trigger
 * 
 * Receives data and triggers Zoho Flow workflow via webhook
 * POST /api/zoho-simple/trigger
 */

export async function onRequestPost(context: any): Promise<Response> {
  // Handle CORS
  const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type',
  };

  if (context.request.method === 'OPTIONS') {
    return new Response(null, { status: 204, headers: corsHeaders });
  }

  try {
    // Get Zoho Flow webhook URL from environment
    const zohoFlowWebhookUrl = context.env.ZOHO_FLOW_WEBHOOK_URL;
    
    if (!zohoFlowWebhookUrl) {
      return new Response(JSON.stringify({
        success: false,
        error: 'Zoho Flow webhook URL not configured'
      }), {
        status: 500,
        headers: { 'Content-Type': 'application/json', ...corsHeaders }
      });
    }

    // Get request body
    const requestData = await context.request.json();

    // Validate required fields
    if (!requestData.name || !requestData.email) {
      return new Response(JSON.stringify({
        success: false,
        error: 'Name and email are required'
      }), {
        status: 400,
        headers: { 'Content-Type': 'application/json', ...corsHeaders }
      });
    }

    // Forward to Zoho Flow (flat structure)
    const zohoResponse = await fetch(zohoFlowWebhookUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        email: requestData.email,
        name: requestData.name,
        lastName: requestData.lastName || 'Unknown',
        mobile: '+91' + (requestData.mobile || requestData.phone || '').replace(/^\+91/, ''),
        company: requestData.company,
        amount: String(parseInt(requestData.amount || requestData.price || '0')),
        product: requestData.product || '',
        purchaseId: requestData.purchaseId || '',
        type: requestData.type || '',
        status: requestData.status || 'pending',
        whatsapp_opt_in: requestData.whatsappOptIn === true,
        opt_in_source: 'payment_page',
        opt_in_time: new Date().toISOString(),
        opt_in_text: 'User agreed to receive WhatsApp messages during checkout',
        timestamp: new Date().toISOString(),
        source: 'api-trigger'
      })
    });

    if (!zohoResponse.ok) {
      throw new Error(`Zoho Flow webhook failed: ${zohoResponse.status}`);
    }

    // Simple logging to console (you can enhance this later)
    console.log('Zoho Flow triggered successfully:', {
      email: requestData.email,
      name: requestData.name,
      timestamp: new Date().toISOString()
    });

    return new Response(JSON.stringify({
      success: true,
      message: 'Zoho Flow triggered successfully',
      timestamp: new Date().toISOString()
    }), {
      status: 200,
      headers: { 'Content-Type': 'application/json', ...corsHeaders }
    });

  } catch (error) {
    console.error('Zoho Flow trigger error:', error);

    return new Response(JSON.stringify({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
      timestamp: new Date().toISOString()
    }), {
      status: 500,
      headers: { 'Content-Type': 'application/json', ...corsHeaders }
    });
  }
}

// Handle other methods
export async function onRequest(context: any): Promise<Response> {
  if (context.request.method === 'POST') {
    return onRequestPost(context);
  }
  
  if (context.request.method === 'OPTIONS') {
    return new Response(null, { 
      status: 204, 
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'POST, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type',
      }
    });
  }

  return new Response(JSON.stringify({
    success: false,
    error: 'Method not allowed. Use POST to trigger workflow.'
  }), {
    status: 405,
    headers: { 'Content-Type': 'application/json' }
  });
}