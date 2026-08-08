/**
 * Plan payment price resolution.
 *
 * Pure logic shared by payment handlers: decides whether a client-supplied
 * price matches a plan's published price. Plans are yearly-billed, so the
 * only accepted prices are the yearly entries of the base pricing_matrix
 * (any entity key) and the campaign override. No I/O — unit-testable.
 */

export type PricingMatrix = Record<string, { yearly?: number }>;

/**
 * Returns the matched price (INR) or null when the client price matches
 * neither the plan's base yearly pricing nor the campaign override.
 */
export function resolvePlanPaymentPrice(
  pricingMatrix: PricingMatrix,
  campaignYearlyPrice: number | null,
  clientPrice: number,
): number | null {
  if (typeof clientPrice !== 'number' || clientPrice <= 0) return null;

  for (const key in pricingMatrix) {
    const yearly = pricingMatrix[key]?.yearly;
    if (typeof yearly === 'number' && yearly === clientPrice) {
      return clientPrice;
    }
  }

  if (typeof campaignYearlyPrice === 'number' && campaignYearlyPrice === clientPrice) {
    return clientPrice;
  }

  return null;
}