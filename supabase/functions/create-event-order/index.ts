import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface EventOrderRequest {
  amount: number;
  currency: string;
  registrationId: string;
  planName: string;
  userEmail: string;
  userName: string;
  origin?: string; // Frontend origin URL
}

const MAX_AMOUNT_RUPEES = 10000000; // ₹1 crore max (in rupees)

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    // Get Razorpay credentials from environment
    const TEST_RAZORPAY_KEY_ID = Deno.env.get("TEST_RAZORPAY_KEY_ID");
    const TEST_RAZORPAY_KEY_SECRET = Deno.env.get("TEST_RAZORPAY_KEY_SECRET");
    const PROD_RAZORPAY_KEY_ID = Deno.env.get("RAZORPAY_KEY_ID");
    const PROD_RAZORPAY_KEY_SECRET = Deno.env.get("RAZORPAY_KEY_SECRET");

    // Parse request body
    const requestBody = await req.json();
    const { amount: originalAmount, currency, registrationId, planName, userEmail, userName, origin: bodyOrigin } = requestBody as EventOrderRequest;
    
    // Detect if request is from production site
    // ONLY skillpassport.rareminds.in is production, everything else is test
    const headerOrigin = req.headers.get("origin") || req.headers.get("referer") || "";
    const requestOrigin = bodyOrigin || headerOrigin;
    const isProductionSite = requestOrigin.includes("skillpassport.rareminds.in") && !requestOrigin.includes("dev-");
    
    // Razorpay TEST mode has a max limit of ₹50,000 (5,000,000 paise)
    const TEST_MODE_MAX_AMOUNT = 5000000; // ₹50,000 in paise
    
    // Determine credentials and amount based on site
    let RAZORPAY_KEY_ID: string | undefined;
    let RAZORPAY_KEY_SECRET: string | undefined;
    let usingTestCredentials = false;
    let amount = originalAmount;
    
    if (isProductionSite) {
      // PRODUCTION SITE (skillpassport.rareminds.in): Use production credentials with actual amount
      RAZORPAY_KEY_ID = PROD_RAZORPAY_KEY_ID || TEST_RAZORPAY_KEY_ID;
      RAZORPAY_KEY_SECRET = PROD_RAZORPAY_KEY_SECRET || TEST_RAZORPAY_KEY_SECRET;
      usingTestCredentials = !PROD_RAZORPAY_KEY_ID && !!TEST_RAZORPAY_KEY_ID;
    } else {
      // TEST SITE (dev-skillpassport, localhost, or any other): Use test credentials and cap amount
      RAZORPAY_KEY_ID = TEST_RAZORPAY_KEY_ID || PROD_RAZORPAY_KEY_ID;
      RAZORPAY_KEY_SECRET = TEST_RAZORPAY_KEY_SECRET || PROD_RAZORPAY_KEY_SECRET;
      usingTestCredentials = !!TEST_RAZORPAY_KEY_ID;
      
      // Cap amount at test limit for non-production sites
      if (amount > TEST_MODE_MAX_AMOUNT) {
        console.log(`TEST MODE: Capping amount from ₹${amount / 100} to ₹${TEST_MODE_MAX_AMOUNT / 100} for testing`);
        amount = TEST_MODE_MAX_AMOUNT;
      }
    }

    const SUPABASE_URL = Deno.env.get("SUPABASE_URL");
    const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");

    if (!RAZORPAY_KEY_ID || !RAZORPAY_KEY_SECRET || !SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
      console.error("Missing environment variables");
      return new Response(
        JSON.stringify({ error: "Server configuration error" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Log which credentials and mode are being used
    console.log(`Site: ${isProductionSite ? 'PRODUCTION' : 'TEST'}, Origin: ${requestOrigin}, Amount: ₹${amount / 100}, Original: ₹${originalAmount / 100}, Using ${usingTestCredentials ? 'TEST' : 'PRODUCTION'} Razorpay credentials`);

    // Create Supabase client with service role
    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

    // Validate required fields
    if (!amount || !currency || !registrationId || !userEmail) {
      return new Response(
        JSON.stringify({ error: "Missing required fields" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Validate amount is positive
    if (amount <= 0) {
      return new Response(
        JSON.stringify({ error: "Amount must be positive" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Validate amount doesn't exceed maximum (amount is in paise, convert to rupees)
    const amountInRupees = amount / 100;
    if (amountInRupees > MAX_AMOUNT_RUPEES) {
      return new Response(
        JSON.stringify({ error: `Amount exceeds maximum limit of ₹${MAX_AMOUNT_RUPEES.toLocaleString()}` }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Validate currency
    if (currency !== "INR") {
      return new Response(
        JSON.stringify({ error: "Only INR currency is supported" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(userEmail)) {
      return new Response(
        JSON.stringify({ error: "Invalid email format" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Verify registration exists
    const { data: registration, error: regError } = await supabase
      .from('event_registrations')
      .select('id, payment_status')
      .eq('id', registrationId)
      .single();

    if (regError || !registration) {
      console.error("Registration not found:", registrationId);
      return new Response(
        JSON.stringify({ error: "Registration not found" }),
        { status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // ===== CREATE RAZORPAY ORDER =====
    const razorpayAuthHeader = `Basic ${btoa(`${RAZORPAY_KEY_ID}:${RAZORPAY_KEY_SECRET}`)}`;
    const receipt = `event_${Date.now()}_${registrationId.substring(0, 8)}`;

    const razorpayResponse = await fetch("https://api.razorpay.com/v1/orders", {
      method: "POST",
      headers: {
        "Authorization": razorpayAuthHeader,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        amount: amount,
        currency: currency,
        receipt: receipt,
        notes: {
          registration_id: registrationId,
          plan_name: planName,
          user_email: userEmail,
          user_name: userName,
        },
      }),
    });

    if (!razorpayResponse.ok) {
      const errorData = await razorpayResponse.text();
      console.error("Razorpay API Error:", {
        status: razorpayResponse.status,
        error: errorData,
        registration_id: registrationId,
        amount: amount,
        amountInRupees: amountInRupees
      });
      
      // Parse error for better message
      let errorMessage = "Unable to create payment order. Please try again.";
      try {
        const parsedError = JSON.parse(errorData);
        if (parsedError.error?.description) {
          errorMessage = parsedError.error.description;
        }
      } catch {}
      
      return new Response(
        JSON.stringify({ error: errorMessage }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const order = await razorpayResponse.json();
    console.log(`Event order created successfully: ${order.id} for registration: ${registrationId}`);

    // Update registration with order ID
    await supabase
      .from('event_registrations')
      .update({ razorpay_order_id: order.id })
      .eq('id', registrationId);

    // ===== RETURN SUCCESS =====
    return new Response(
      JSON.stringify({
        success: true,
        id: order.id,
        amount: order.amount,
        currency: order.currency,
        receipt: order.receipt,
        key: RAZORPAY_KEY_ID,
      }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );

  } catch (error) {
    console.error("Error creating event order:", {
      error: error.message,
      stack: error.stack,
      timestamp: new Date().toISOString()
    });
    return new Response(
      JSON.stringify({
        success: false,
        error: "Unable to process order. Please try again later."
      }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
