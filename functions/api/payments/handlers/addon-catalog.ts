import type { AuthenticatedContext } from '@rareminds-eym/auth-core';

// Cloudflare Service Bindings require a full URL for the Fetch API, 
// but the hostname is ignored by the internal router.
// Using a .internal TLD makes it clear this is a direct worker-to-worker call.
const INTERNAL_SSO_HOST = 'http://sso-worker.internal';

export async function handleAddonCatalog(context: AuthenticatedContext): Promise<Response> {
  const env = context.env as { SSO_SERVICE: Fetcher };
  const url = new URL(context.request.url);
  const action = url.searchParams.get('action');

  try {
    if (action === 'getBundles') {
      const role = url.searchParams.get('role');
      const ssoUrl = new URL(`${INTERNAL_SSO_HOST}/api/bundles`);
      if (role) ssoUrl.searchParams.set('role', role);

      const ssoResponse = await env.SSO_SERVICE.fetch(new Request(ssoUrl.toString(), { method: 'GET' }));
      if (!ssoResponse.ok) throw new Error(`SSO Worker error: ${ssoResponse.status}`);
      
      const { bundles } = await ssoResponse.json() as { bundles: Record<string, unknown>[] };
      return new Response(JSON.stringify({ success: true, data: bundles }), { status: 200 });
    }

    if (action === 'calculateBundleSavings') {
      const bundleId = url.searchParams.get('bundleId');
      if (!bundleId) return new Response(JSON.stringify({ success: false, error: 'Bundle ID required' }), { status: 400 });
      
      const bundlesResp = await env.SSO_SERVICE.fetch(new Request(`${INTERNAL_SSO_HOST}/api/bundles`, { method: 'GET' }));
      if (!bundlesResp.ok) throw new Error(`SSO Worker bundles error: ${bundlesResp.status}`);
      const { bundles } = await bundlesResp.json() as { bundles: Record<string, unknown>[] };
      
      const bundle = bundles.find(b => b.id === bundleId);
      if (!bundle) return new Response(JSON.stringify({ success: false, error: 'BUNDLE_NOT_FOUND' }), { status: 404 });
      
      const featureKeys = (bundle.feature_keys as string[]) || [];
      if (featureKeys.length === 0) return new Response(JSON.stringify({ success: true, data: { totalIndividual: 0, bundlePrice: bundle.monthly_price, savings: 0 } }), { status: 200 });
      
      const addonsResp = await env.SSO_SERVICE.fetch(new Request(`${INTERNAL_SSO_HOST}/api/addon-catalog`, { method: 'GET' }));
      if (!addonsResp.ok) throw new Error(`SSO Worker addons error: ${addonsResp.status}`);
      const { addons } = await addonsResp.json() as { addons: Record<string, unknown>[] };
      
      // Calculate total price of included features if purchased individually as addons
      const includedAddons = addons.filter(a => featureKeys.includes(a.feature_key as string));
      const totalIndividual = includedAddons.reduce((sum, addOn) => sum + (parseFloat(addOn.price_monthly as string) || 0), 0);
      const bundlePrice = parseFloat(bundle.monthly_price as string) || 0;
      const savings = totalIndividual > bundlePrice ? totalIndividual - bundlePrice : 0;
      
      return new Response(JSON.stringify({ success: true, data: { totalIndividual, bundlePrice, savings } }), { status: 200 });
    }

    return new Response(JSON.stringify({ success: false, error: 'Invalid action or missing params' }), { status: 400 });
  } catch (error) {
    console.error('[AddonCatalog] Error:', error);
    return new Response(
      JSON.stringify({ success: false, error: error instanceof Error ? error.message : 'Unknown error' }),
      { status: 500 }
    );
  }
}

