import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { createHmac } from "https://deno.land/std@0.177.0/node/crypto.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "x-razorpay-signature, content-type",
};

/**
 * Verify Razorpay webhook signature
 */
function verifyWebhookSignature(
  payload: string,
  signature: string,
  secret: string
): boolean {
  try {
    const hmac = createHmac("sha256", secret);
    hmac.update(payload);
    const generatedSignature = hmac.digest("hex");
    
    return generatedSignature === signature;
  } catch (error) {
    console.error("Error verifying webhook signature:", error);
    return false;
  }
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    // Get Razorpay webhook secret from environment
    const RAZORPAY_WEBHOOK_SECRET = Deno.env.get("RAZORPAY_WEBHOOK_SECRET");

    if (!RAZORPAY_WEBHOOK_SECRET) {
      throw new Error("Razorpay webhook secret not configured");
    }

    // Get webhook signature from headers
    const signature = req.headers.get("x-razorpay-signature");
    if (!signature) {
      console.error("Missing webhook signature");
      return new Response(
        JSON.stringify({ error: "Missing signature" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Get raw body for signature verification
    const rawBody = await req.text();
    
    // Verify webhook signature
    const isValidSignature = verifyWebhookSignature(
      rawBody,
      signature,
      RAZORPAY_WEBHOOK_SECRET
    );

    if (!isValidSignature) {
      console.error("Invalid webhook signature");
      return new Response(
        JSON.stringify({ error: "Invalid signature" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Parse webhook payload
    const webhookData = JSON.parse(rawBody);
    const event = webhookData.event;
    const payload = webhookData.payload;

    console.log(`Received webhook event: ${event}`);

    // Create Supabase admin client (for server-side operations)
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Handle different webhook events
    switch (event) {
      case "payment.captured":
        await handlePaymentCaptured(supabase, payload);
        break;
      
      case "payment.failed":
        await handlePaymentFailed(supabase, payload);
        break;
      
      case "subscription.cancelled":
        await handleSubscriptionCancelled(supabase, payload);
        break;
      
      case "subscription.paused":
        await handleSubscriptionPaused(supabase, payload);
        break;
      
      case "subscription.resumed":
        await handleSubscriptionResumed(supabase, payload);
        break;
      
      case "subscription.charged":
        await handleSubscriptionCharged(supabase, payload);
        break;
      
      default:
        console.log(`Unhandled webhook event: ${event}`);
    }

    return new Response(
      JSON.stringify({ success: true, event }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );

  } catch (error) {
    console.error("Error processing webhook:", error);
    return new Response(
      JSON.stringify({ error: error.message || "Failed to process webhook" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});

/**
 * Handle payment.captured event
 */
async function handlePaymentCaptured(supabase: any, payload: any) {
  const payment = payload.payment.entity;
  console.log("Payment captured:", payment.id);

  // Update payment_transactions table
  const { error } = await supabase
    .from("payment_transactions")
    .update({
      status: "success",
      updated_at: new Date().toISOString(),
    })
    .eq("razorpay_payment_id", payment.id);

  if (error) {
    console.error("Error updating payment transaction:", error);
  }
}

/**
 * Handle payment.failed event
 */
async function handlePaymentFailed(supabase: any, payload: any) {
  const payment = payload.payment.entity;
  console.log("Payment failed:", payment.id);

  // Update payment_transactions table
  const { error } = await supabase
    .from("payment_transactions")
    .update({
      status: "failed",
      updated_at: new Date().toISOString(),
    })
    .eq("razorpay_payment_id", payment.id);

  if (error) {
    console.error("Error updating payment transaction:", error);
  }
}

/**
 * Handle subscription.cancelled event
 */
async function handleSubscriptionCancelled(supabase: any, payload: any) {
  const subscription = payload.subscription.entity;
  console.log("Subscription cancelled:", subscription.id);

  // Update subscriptions table
  const { error } = await supabase
    .from("subscriptions")
    .update({
      status: "cancelled",
      cancelled_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    })
    .eq("razorpay_subscription_id", subscription.id);

  if (error) {
    console.error("Error updating subscription:", error);
  }
}

/**
 * Handle subscription.paused event
 */
async function handleSubscriptionPaused(supabase: any, payload: any) {
  const subscription = payload.subscription.entity;
  console.log("Subscription paused:", subscription.id);

  // Update subscriptions table
  const { error } = await supabase
    .from("subscriptions")
    .update({
      status: "paused",
      paused_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    })
    .eq("razorpay_subscription_id", subscription.id);

  if (error) {
    console.error("Error updating subscription:", error);
  }
}

/**
 * Handle subscription.resumed event
 */
async function handleSubscriptionResumed(supabase: any, payload: any) {
  const subscription = payload.subscription.entity;
  console.log("Subscription resumed:", subscription.id);

  // Update subscriptions table
  const { error } = await supabase
    .from("subscriptions")
    .update({
      status: "active",
      paused_at: null,
      paused_until: null,
      updated_at: new Date().toISOString(),
    })
    .eq("razorpay_subscription_id", subscription.id);

  if (error) {
    console.error("Error updating subscription:", error);
  }
}

/**
 * Handle subscription.charged event (recurring payment)
 */
async function handleSubscriptionCharged(supabase: any, payload: any) {
  const payment = payload.payment.entity;
  const subscription = payload.subscription.entity;
  
  console.log("Subscription charged:", subscription.id, "Payment:", payment.id);

  // Record the payment transaction
  const { error } = await supabase
    .from("payment_transactions")
    .insert({
      razorpay_payment_id: payment.id,
      razorpay_order_id: payment.order_id,
      amount: payment.amount / 100, // Convert paise to rupees
      currency: payment.currency,
      status: "success",
      payment_method: payment.method,
      created_at: new Date().toISOString(),
    });

  if (error) {
    console.error("Error recording subscription payment:", error);
  }

  // Extend subscription end date for recurring subscription
  const { data: subData, error: subError } = await supabase
    .from("subscriptions")
    .select("subscription_end_date, billing_cycle")
    .eq("razorpay_subscription_id", subscription.id)
    .single();

  if (!subError && subData) {
    const currentEndDate = new Date(subData.subscription_end_date);
    const billingCycle = subData.billing_cycle;
    
    // Extend based on billing cycle
    if (billingCycle.toLowerCase().includes("month")) {
      currentEndDate.setMonth(currentEndDate.getMonth() + 1);
    } else if (billingCycle.toLowerCase().includes("year")) {
      currentEndDate.setFullYear(currentEndDate.getFullYear() + 1);
    }

    // Update subscription end date
    await supabase
      .from("subscriptions")
      .update({
        subscription_end_date: currentEndDate.toISOString(),
        updated_at: new Date().toISOString(),
      })
      .eq("razorpay_subscription_id", subscription.id);
  }
}
