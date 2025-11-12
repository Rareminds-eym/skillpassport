import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { createHmac } from "https://deno.land/std@0.177.0/node/crypto.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface PaymentVerificationRequest {
  razorpay_order_id: string;
  razorpay_payment_id: string;
  razorpay_signature: string;
  plan_id: string;
}

/**
 * Verify Razorpay payment signature
 * @param orderId - Razorpay order ID
 * @param paymentId - Razorpay payment ID
 * @param signature - Razorpay signature
 * @param secret - Razorpay key secret
 * @returns boolean indicating if signature is valid
 */
function verifyPaymentSignature(
  orderId: string,
  paymentId: string,
  signature: string,
  secret: string
): boolean {
  try {
    const text = `${orderId}|${paymentId}`;
    const hmac = createHmac("sha256", secret);
    hmac.update(text);
    const generatedSignature = hmac.digest("hex");
    
    return generatedSignature === signature;
  } catch (error) {
    console.error("Error verifying signature:", error);
    return false;
  }
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    // Get Razorpay secret from environment
    const RAZORPAY_KEY_SECRET = Deno.env.get("RAZORPAY_KEY_SECRET");

    if (!RAZORPAY_KEY_SECRET) {
      throw new Error("Razorpay secret not configured");
    }

    // Get authorization header to verify user
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      return new Response(
        JSON.stringify({ error: "Missing authorization header" }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Create Supabase client
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseKey = Deno.env.get("SUPABASE_ANON_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseKey, {
      global: {
        headers: { Authorization: authHeader },
      },
    });

    // Verify user is authenticated
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return new Response(
        JSON.stringify({ error: "Unauthorized" }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Parse request body
    const {
      razorpay_order_id,
      razorpay_payment_id,
      razorpay_signature,
      plan_id,
    }: PaymentVerificationRequest = await req.json();

    // Validate input
    if (!razorpay_order_id || !razorpay_payment_id || !razorpay_signature) {
      return new Response(
        JSON.stringify({ error: "Missing required fields" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // ===== CHECK IDEMPOTENCY (CRITICAL) =====
    // Prevent duplicate payment processing
    const { data: existingPayment, error: existError } = await supabase
      .from('payment_transactions')
      .select('id, payment_method, created_at')
      .eq('razorpay_payment_id', razorpay_payment_id)
      .maybeSingle();

    if (existingPayment) {
      console.warn(`Payment ${razorpay_payment_id} already processed at ${existingPayment.created_at}`);
      return new Response(
        JSON.stringify({
          success: true,
          message: "Payment already verified",
          payment_id: razorpay_payment_id,
          order_id: razorpay_order_id,
          user_id: user.id,
          payment_method: existingPayment.payment_method || "card",
          already_processed: true,
        }),
        { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // ===== VERIFY ORDER EXISTS AND BELONGS TO USER =====
    const { data: order, error: orderError } = await supabase
      .from('razorpay_orders')
      .select('*')
      .eq('order_id', razorpay_order_id)
      .maybeSingle();

    if (orderError || !order) {
      console.error("Order not found:", razorpay_order_id, orderError);
      return new Response(
        JSON.stringify({ 
          success: false,
          error: "Order not found" 
        }),
        { status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    if (order.user_id !== user.id) {
      console.error(`Authorization failed: Order ${razorpay_order_id} belongs to ${order.user_id}, not ${user.id}`);
      return new Response(
        JSON.stringify({ 
          success: false,
          error: "Unauthorized - This order does not belong to you" 
        }),
        { status: 403, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // ===== VERIFY PAYMENT SIGNATURE (CRITICAL SECURITY) =====
    const isValidSignature = verifyPaymentSignature(
      razorpay_order_id,
      razorpay_payment_id,
      razorpay_signature,
      RAZORPAY_KEY_SECRET
    );

    if (!isValidSignature) {
      console.error("Invalid payment signature:", {
        order_id: razorpay_order_id,
        payment_id: razorpay_payment_id,
        user_id: user.id
      });
      return new Response(
        JSON.stringify({
          success: false,
          error: "Payment verification failed - invalid signature",
        }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    console.log(`Payment signature verified for user ${user.id}: ${razorpay_payment_id}`);

    // ===== FETCH PAYMENT DETAILS FROM RAZORPAY =====
    // Get payment method and verify amount
    const RAZORPAY_KEY_ID = Deno.env.get("RAZORPAY_KEY_ID");
    let paymentMethod = "unknown";
    let paymentAmount = 0;
    let paymentStatus = "unknown";

    // Fetch payment details with timeout
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 10000);

    try {
      const razorpayAuthHeader = `Basic ${btoa(`${RAZORPAY_KEY_ID}:${RAZORPAY_KEY_SECRET}`)}`;
      const paymentResponse = await fetch(
        `https://api.razorpay.com/v1/payments/${razorpay_payment_id}`,
        {
          headers: { "Authorization": razorpayAuthHeader },
          signal: controller.signal,
        }
      );

      if (paymentResponse.ok) {
        const paymentDetails = await paymentResponse.json();
        paymentMethod = paymentDetails.method || "unknown";
        paymentAmount = paymentDetails.amount || 0;
        paymentStatus = paymentDetails.status || "unknown";
        
        console.log(`Payment details fetched: method=${paymentMethod}, amount=${paymentAmount}, status=${paymentStatus}`);

        // ===== VERIFY AMOUNT MATCHES ORDER =====
        if (paymentAmount !== order.amount) {
          console.error("Amount mismatch:", {
            expected: order.amount,
            received: paymentAmount,
            payment_id: razorpay_payment_id,
            order_id: razorpay_order_id
          });
          return new Response(
            JSON.stringify({
              success: false,
              error: "Payment amount does not match order amount"
            }),
            { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
          );
        }

        // ===== VERIFY PAYMENT STATUS =====
        if (paymentStatus !== "captured" && paymentStatus !== "authorized") {
          console.error("Invalid payment status:", {
            status: paymentStatus,
            payment_id: razorpay_payment_id
          });
          return new Response(
            JSON.stringify({
              success: false,
              error: "Payment not completed successfully"
            }),
            { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
          );
        }
      } else {
        console.error("Failed to fetch payment details from Razorpay:", paymentResponse.status);
      }
    } catch (err) {
      console.error("Error fetching payment details:", {
        error: err.message,
        payment_id: razorpay_payment_id,
        user_id: user.id
      });
      // Continue with unknown payment method - signature is valid
      paymentMethod = "unknown";
    } finally {
      clearTimeout(timeoutId);
    }

    // ===== UPDATE ORDER STATUS IN DATABASE =====
    const { error: updateError } = await supabase
      .from('razorpay_orders')
      .update({
        status: 'paid',
        updated_at: new Date().toISOString()
      })
      .eq('order_id', razorpay_order_id);

    if (updateError) {
      console.error("Failed to update order status:", updateError);
      // Don't fail the request, payment is verified
    }

    // ===== RETURN SUCCESS =====
    console.log(`Payment verification complete: ${razorpay_payment_id} for user ${user.id}`);

    return new Response(
      JSON.stringify({
        success: true,
        message: "Payment verified successfully",
        payment_id: razorpay_payment_id,
        order_id: razorpay_order_id,
        user_id: user.id,
        payment_method: paymentMethod,
        amount: paymentAmount,
      }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );

  } catch (error) {
    console.error("Error verifying payment:", {
      error: error.message,
      stack: error.stack,
      timestamp: new Date().toISOString()
    });
    return new Response(
      JSON.stringify({
        success: false,
        error: "Unable to verify payment. Please contact support.",
      }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
