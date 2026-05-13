import { withAuth } from '../../../lib/auth';
import type { AuthenticatedContext } from '@rareminds-eym/auth-core';
import { getServiceClient } from '../../../lib/supabase';

export const onRequestGet = withAuth(async (context: AuthenticatedContext) => {
  return handleAddonCatalog(context);
});

export async function handleAddonCatalog(context: AuthenticatedContext): Promise<Response> {
  const env = context.env as { SUPABASE_URL: string; SUPABASE_SERVICE_ROLE_KEY: string };
  const url = new URL(context.request.url);
  const action = url.searchParams.get('action');

  try {
    const supabase = getServiceClient(env);

    if (action === 'getBundles') {
      const role = url.searchParams.get('role');
      const { data, error } = await supabase.from('bundles').select('*, bundle_features(feature_key)').eq('is_active', true).order('display_order', { ascending: true });
      if (error) throw error;
      let filteredData = data;
      if (role && data) {
        filteredData = data.filter(bundle => (!bundle.target_roles || bundle.target_roles.length === 0) || bundle.target_roles.includes(role));
      }
      return new Response(JSON.stringify({ success: true, data: filteredData }), { status: 200 });
    }

    if (action === 'calculateBundleSavings') {
      const bundleId = url.searchParams.get('bundleId');
      if (!bundleId) return new Response(JSON.stringify({ success: false, error: 'Bundle ID required' }), { status: 200 });
      
      const { data: bundle, error: bundleError } = await supabase.from('bundles').select('*, bundle_features(feature_key)').eq('id', bundleId).single();
      if (bundleError && bundleError.code === 'PGRST116') return new Response(JSON.stringify({ success: false, error: 'BUNDLE_NOT_FOUND' }), { status: 200 });
      if (bundleError) throw bundleError;
      
      const featureKeys = bundle.bundle_features?.map((bf: any) => bf.feature_key) || [];
      if (featureKeys.length === 0) return new Response(JSON.stringify({ success: true, data: { totalIndividual: 0, bundlePrice: bundle.monthly_price, savings: 0 } }), { status: 200 });
      
      const { data: addOns, error: addOnsError } = await supabase.from('subscription_plan_features').select('feature_key, addon_price_monthly').eq('is_addon', true).in('feature_key', featureKeys);
      if (addOnsError) throw addOnsError;
      
      const totalIndividual = (addOns || []).reduce((sum, addOn) => sum + (addOn.addon_price_monthly || 0), 0);
      const bundlePrice = bundle.monthly_price;
      const savings = totalIndividual - bundlePrice;
      
      return new Response(JSON.stringify({ success: true, data: { totalIndividual, bundlePrice, savings } }), { status: 200 });
    }

    return new Response(JSON.stringify({ success: false, error: 'Invalid action or missing params' }), { status: 400 });
  } catch (error) {
    console.error('[AddonCatalog] Error:', error);
    return new Response(
      JSON.stringify({ success: false, error: error instanceof Error ? error.message : 'Unknown error' }),
      { status: 200 }
    );
  }
}
