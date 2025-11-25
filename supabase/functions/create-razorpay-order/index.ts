import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface OrderRequest {
  amount: number;
  currency: string;
  planId: string;
  planName: string;
  userEmail: string;
  userName: string;
}

// Valid plan amounts in paise (₹1, ₹499, ₹999, ₹1999)
const VALID_AMOUNTS = [100, 49900, 99900, 199900];
const MAX_AMOUNT = 1000000; // ₹10,000 in paise
const RATE_LIMIT_WINDOW = 60000; // 1 minute
const RATE_LIMIT_MAX = 5; // 5 orders per minute

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    // ===== AUTHENTICATION CHECK =====
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      return new Response(
        JSON.stringify({ error: "Unauthorized - Missing authentication" }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Get Razorpay credentials from environment
    // Use TEST credentials if available (for localhost/Netlify), otherwise use production credentials
    const TEST_RAZORPAY_KEY_ID = Deno.env.get("TEST_RAZORPAY_KEY_ID");
    const TEST_RAZORPAY_KEY_SECRET = Deno.env.get("TEST_RAZORPAY_KEY_SECRET");
    const PROD_RAZORPAY_KEY_ID = Deno.env.get("RAZORPAY_KEY_ID");
    const PROD_RAZORPAY_KEY_SECRET = Deno.env.get("RAZORPAY_KEY_SECRET");

    // Prefer TEST credentials if both are set, otherwise use production
    const RAZORPAY_KEY_ID = TEST_RAZORPAY_KEY_ID || PROD_RAZORPAY_KEY_ID;
    const RAZORPAY_KEY_SECRET = TEST_RAZORPAY_KEY_SECRET || PROD_RAZORPAY_KEY_SECRET;

    const SUPABASE_URL = Deno.env.get("SUPABASE_URL");
    const SUPABASE_ANON_KEY = Deno.env.get("SUPABASE_ANON_KEY");

    if (!RAZORPAY_KEY_ID || !RAZORPAY_KEY_SECRET || !SUPABASE_URL || !SUPABASE_ANON_KEY) {
      console.error("Missing environment variables");
      return new Response(
        JSON.stringify({ error: "Server configuration error" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Log which credentials are being used (without exposing the actual keys)
    const usingTestCredentials = !!TEST_RAZORPAY_KEY_ID;
    console.log(`Using ${usingTestCredentials ? 'TEST' : 'PRODUCTION'} Razorpay credentials`);

    // Create Supabase client with user auth
    const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
      global: { headers: { Authorization: authHeader } },
    });

    // Verify user is authenticated
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      console.error("Authentication failed:", authError);
      return new Response(
        JSON.stringify({ error: "Unauthorized - Invalid token" }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    console.log(`Order creation request from user: ${user.id}`);

    // ===== RATE LIMITING =====
    const oneMinuteAgo = new Date(Date.now() - RATE_LIMIT_WINDOW).toISOString();
    const { count, error: countError } = await supabase
      .from('razorpay_orders')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', user.id)
      .gte('created_at', oneMinuteAgo);

    if (!countError && count && count >= RATE_LIMIT_MAX) {
      console.warn(`Rate limit exceeded for user ${user.id}`);
      return new Response(
        JSON.stringify({ error: "Too many order attempts. Please wait a minute." }),
        { status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // ===== PARSE AND VALIDATE INPUT =====
    const { amount, currency, planId, planName, userEmail, userName }: OrderRequest = await req.json();

    // Validate required fields
    if (!amount || !currency || !userEmail || !planId || !planName) {
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

    // Validate amount doesn't exceed maximum
    if (amount > MAX_AMOUNT) {
      return new Response(
        JSON.stringify({ error: "Amount exceeds maximum limit" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Validate amount matches known plans
    if (!VALID_AMOUNTS.includes(amount)) {
      console.warn(`Invalid amount attempted: ${amount} by user ${user.id}`);
      return new Response(
        JSON.stringify({ error: "Invalid plan amount" }),
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

    // ===== CREATE RAZORPAY ORDER =====
    const razorpayAuthHeader = `Basic ${btoa(`${RAZORPAY_KEY_ID}:${RAZORPAY_KEY_SECRET}`)}`;
    const receipt = `rcpt_${Date.now()}_${user.id.substring(0, 8)}`;

    // Create order with timeout
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 10000); // 10 second timeout

    let razorpayResponse;
    try {
      razorpayResponse = await fetch("https://api.razorpay.com/v1/orders", {
        method: "POST",
        headers: {
          "Authorization": razorpayAuthHeader,
          "Content-Type": "application/json",
        },
        signal: controller.signal,
        body: JSON.stringify({
          amount: amount,
          currency: currency,
          receipt: receipt,
          notes: {
            user_id: user.id,
            plan_id: planId,
            plan_name: planName,
            user_email: userEmail,
            user_name: userName,
          },
        }),
      });
    } catch (error) {
      clearTimeout(timeoutId);
      if (error.name === 'AbortError') {
        console.error("Razorpay API timeout for user:", user.id);
        return new Response(
          JSON.stringify({ error: "Payment service timeout. Please try again." }),
          { status: 504, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      throw error;
    } finally {
      clearTimeout(timeoutId);
    }

    if (!razorpayResponse.ok) {
      const errorData = await razorpayResponse.text();
      console.error("Razorpay API Error:", {
        status: razorpayResponse.status,
        error: errorData,
        user_id: user.id,
        amount: amount
      });
      return new Response(
        JSON.stringify({ error: "Unable to create payment order. Please try again." }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const order = await razorpayResponse.json();

    console.log(`Order created successfully: ${order.id} for user: ${user.id}`);

    // ===== LOG ORDER TO DATABASE =====
    console.log(`Attempting to save order to database: ${order.id} for user ${user.id}`);

    const { error: dbError } = await supabase
      .from('razorpay_orders')
      .insert({
        user_id: user.id,
        order_id: order.id,
        amount: order.amount,
        currency: order.currency,
        receipt: order.receipt,
        status: 'created',
        plan_id: planId,
        plan_name: planName,
        user_email: userEmail,
        user_name: userName,
        created_at: new Date().toISOString()
      });

    if (dbError) {
      console.error("CRITICAL: Failed to log order to database:", JSON.stringify(dbError));
      // We should probably fail here if we can't save the order, otherwise verification will fail
      return new Response(
        JSON.stringify({
          error: "Order created but failed to save to database. Please try again.",
          details: dbError.message
        }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    } else {
      console.log("Successfully saved order to database");
    }

    // ===== RETURN SUCCESS =====
    return new Response(
      JSON.stringify({
        success: true,
        id: order.id,
        amount: order.amount,
        currency: order.currency,
        receipt: order.receipt,
      }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );

  } catch (error) {
    console.error("Error creating Razorpay order:", {
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
