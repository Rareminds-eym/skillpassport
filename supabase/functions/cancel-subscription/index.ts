import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface CancelSubscriptionRequest {
  subscription_id: string;
  cancel_at_cycle_end?: boolean;
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    // Get Razorpay credentials from environment
    const RAZORPAY_KEY_ID = Deno.env.get("RAZORPAY_KEY_ID");
    const RAZORPAY_KEY_SECRET = Deno.env.get("RAZORPAY_KEY_SECRET");

    if (!RAZORPAY_KEY_ID || !RAZORPAY_KEY_SECRET) {
      throw new Error("Razorpay credentials not configured");
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
    const { subscription_id, cancel_at_cycle_end = false }: CancelSubscriptionRequest = await req.json();

    // Validate input
    if (!subscription_id) {
      return new Response(
        JSON.stringify({ error: "Missing subscription_id" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Create Basic Auth header for Razorpay
    const authHeaderRazorpay = `Basic ${btoa(`${RAZORPAY_KEY_ID}:${RAZORPAY_KEY_SECRET}`)}`;

    // Cancel subscription on Razorpay
    const razorpayResponse = await fetch(
      `https://api.razorpay.com/v1/subscriptions/${subscription_id}/cancel`,
      {
        method: "POST",
        headers: {
          "Authorization": authHeaderRazorpay,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          cancel_at_cycle_end: cancel_at_cycle_end,
        }),
      }
    );

    if (!razorpayResponse.ok) {
      const errorData = await razorpayResponse.text();
      console.error("Razorpay API Error:", errorData);
      
      // If subscription doesn't exist on Razorpay, it might already be cancelled
      if (razorpayResponse.status === 404) {
        return new Response(
          JSON.stringify({
            success: true,
            message: "Subscription already cancelled or not found on payment provider",
            subscription_id: subscription_id,
            status: "cancelled",
          }),
          { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      
      throw new Error(`Razorpay API error: ${razorpayResponse.status}`);
    }

    const cancelledSubscription = await razorpayResponse.json();

    console.log("Subscription cancelled successfully:", subscription_id);

    // Update subscription in database
    const { error: dbError } = await supabase
      .from("subscriptions")
      .update({
        status: "cancelled",
        cancelled_at: new Date().toISOString(),
        auto_renew: false,
        updated_at: new Date().toISOString(),
      })
      .eq("razorpay_subscription_id", subscription_id)
      .eq("user_id", user.id);

    if (dbError) {
      console.error("Error updating subscription in database:", dbError);
      // Don't fail the request if DB update fails - subscription is already cancelled on Razorpay
    }

    return new Response(
      JSON.stringify({
        success: true,
        message: "Subscription cancelled successfully",
        subscription_id: subscription_id,
        status: cancelledSubscription.status,
        ended_at: cancelledSubscription.ended_at,
      }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );

  } catch (error) {
    console.error("Error cancelling subscription:", error);
    return new Response(
      JSON.stringify({
        success: false,
        error: error.message || "Failed to cancel subscription",
      }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
