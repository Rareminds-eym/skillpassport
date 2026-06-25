import type { AuthenticatedContext } from '@rareminds-eym/auth-core';
import { apiError, apiSuccess } from '../../../lib/response';
import { ssoListAddonCatalog, ssoListBundles } from '../../../lib/sso-client';

export async function handleAddonCatalog(context: AuthenticatedContext): Promise<Response> {
  const env = context.env as any;
  const url = new URL(context.request.url);
  const action = url.searchParams.get('action');

  try {
    if (action === 'getBundles') {
      const role = url.searchParams.get('role');
      const data = await ssoListBundles(env);
      let bundles = (data.bundles || []) as Record<string, unknown>[];

      if (role) {
        bundles = bundles.filter((b: any) => b.role === role);
      }

      return apiSuccess(bundles, context.request);
    }

    if (action === 'calculateBundleSavings') {
      const bundleId = url.searchParams.get('bundleId');
      if (!bundleId) return apiError(400, 'VALIDATION_ERROR', 'Bundle ID required', context.request);

      const bundlesData = await ssoListBundles(env);
      const bundles = (bundlesData.bundles || []) as Record<string, unknown>[];

      const bundle = bundles.find(b => b.id === bundleId);
      if (!bundle) return apiError(404, 'NOT_FOUND', 'BUNDLE_NOT_FOUND', context.request);

      const featureKeys = (bundle.feature_keys as string[]) || [];
      if (featureKeys.length === 0) return apiSuccess({ totalIndividual: 0, bundlePrice: bundle.monthly_price, savings: 0 }, context.request);

      const addonsData = await ssoListAddonCatalog(env);
      const addons = (addonsData.addons || []) as Record<string, unknown>[];

      // Calculate total price of included features if purchased individually as addons
      const includedAddons = addons.filter(a => featureKeys.includes(a.feature_key as string));
      const totalIndividual = includedAddons.reduce((sum, addOn) => sum + safeParseFloat(addOn.price_monthly as string, 0), 0);
      const bundlePrice = safeParseFloat(bundle.monthly_price as string, 0);
      const savings = totalIndividual > bundlePrice ? totalIndividual - bundlePrice : 0;

      return apiSuccess({ totalIndividual, bundlePrice, savings }, context.request);
    }

    return apiError(400, 'VALIDATION_ERROR', 'Invalid action or missing params', context.request);
  } catch (error) {
    console.error('[AddonCatalog] Error:', error);
    return apiError(500, 'INTERNAL_ERROR', error instanceof Error ? error.message : 'Unknown error', context.request);
  }
}
