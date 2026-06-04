import type { AuthenticatedContext } from '@rareminds-eym/auth-core';
import { ssoFetch } from '../../../lib/sso-client';
import { apiSuccess, apiError } from '../../../lib/response';

// Cloudflare Service Bindings require a full URL for the Fetch API, 
// but the hostname is ignored by the internal router.
// Using a .internal TLD makes it clear this is a direct worker-to-worker call.
const INTERNAL_SSO_HOST = 'http://sso-worker.internal';

export async function handleAddonCatalog(context: AuthenticatedContext): Promise<Response> {
  const env = context.env as any;
  const url = new URL(context.request.url);
  const action = url.searchParams.get('action');

  try {
    if (action === 'getBundles') {
      const role = url.searchParams.get('role');
      const ssoUrl = new URL(`${INTERNAL_SSO_HOST}/api/bundles`);
      if (role) ssoUrl.searchParams.set('role', role);

      const ssoResponse = await ssoFetch(env, new Request(ssoUrl.toString(), { method: 'GET' }));
      if (!ssoResponse.ok) throw new Error(`SSO Worker error: ${ssoResponse.status}`);
      
      const { bundles } = await ssoResponse.json() as { bundles: Record<string, unknown>[] };
      return apiSuccess(bundles, context.request);
    }

    if (action === 'calculateBundleSavings') {
      const bundleId = url.searchParams.get('bundleId');
      if (!bundleId) return apiError(400, 'VALIDATION_ERROR', 'Bundle ID required', context.request);
      
      const bundlesResp = await ssoFetch(env, new Request(`${INTERNAL_SSO_HOST}/api/bundles`, { method: 'GET' }));
      if (!bundlesResp.ok) throw new Error(`SSO Worker bundles error: ${bundlesResp.status}`);
      const { bundles } = await bundlesResp.json() as { bundles: Record<string, unknown>[] };
      
      const bundle = bundles.find(b => b.id === bundleId);
      if (!bundle) return apiError(404, 'NOT_FOUND', 'BUNDLE_NOT_FOUND', context.request);
      
      const featureKeys = (bundle.feature_keys as string[]) || [];
      if (featureKeys.length === 0) return apiSuccess({ totalIndividual: 0, bundlePrice: bundle.monthly_price, savings: 0 }, context.request);
      
      const addonsResp = await ssoFetch(env, new Request(`${INTERNAL_SSO_HOST}/api/addon-catalog`, { method: 'GET' }));
      if (!addonsResp.ok) throw new Error(`SSO Worker addons error: ${addonsResp.status}`);
      const { addons } = await addonsResp.json() as { addons: Record<string, unknown>[] };
      
      // Calculate total price of included features if purchased individually as addons
      const includedAddons = addons.filter(a => featureKeys.includes(a.feature_key as string));
      const totalIndividual = includedAddons.reduce((sum, addOn) => sum + (parseFloat(addOn.price_monthly as string) ?? 0), 0);
      const bundlePrice = parseFloat(bundle.monthly_price as string) ?? 0;
      const savings = totalIndividual > bundlePrice ? totalIndividual - bundlePrice : 0;
      
      return apiSuccess({ totalIndividual, bundlePrice, savings }, context.request);
    }

    return apiError(400, 'VALIDATION_ERROR', 'Invalid action or missing params', context.request);
  } catch (error) {
    console.error('[AddonCatalog] Error:', error);
    return apiError(500, 'INTERNAL_ERROR', error instanceof Error ? error.message : 'Unknown error', context.request);
  }
}

