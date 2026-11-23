import type { KeyboardEvent } from 'react';
import type { Catalog, FeatureGrant } from '../api/subscriptionExecutionService';

const acronyms = (text: string) => text.replace(/\b(ai|lte)\b/gi, word => word.toUpperCase());
export const featureName = (key: string) => acronyms(key.replace(/_/g, ' ').replace(/\b\w/g, character => character.toUpperCase()));
export const enumLabel = (value: string) => acronyms(value.replace(/_/g, ' ').replace(/^\w/, character => character.toUpperCase()));
export function featureValue(feature?: FeatureGrant) {
  if (!feature?.enabled) return 'Not included';
  if (feature.type === 'boolean') return 'Included';
  if (feature.type === 'enum') return feature.value === null ? 'No configured value' : enumLabel(feature.value);
  if (feature.limit.kind === 'finite') {
    const units: Record<string, string> = { assessment_attempts: 'attempt', course_lte_assignments: 'assignment', included_learner_capacity: 'learner', ai_credits: 'credit' };
    const unit = units[feature.key];
    return `${feature.limit.value.toLocaleString()}${unit ? ` ${unit}${feature.limit.value === 1 ? '' : 's'}` : ''}`;
  }
  if (feature.limit.kind === 'unlimited') return 'Unlimited';
  return feature.limit.kind === 'contract_required' ? 'Contract required' : 'Policy-based; amount not specified';
}

/** Compare exact amounts only within the same currency, billing period and quantity basis.
 * Offers with multiple price choices retain their own position within the paid group.
 */
export function ascendingPlans(plans: Catalog['plans']) {
  const paid = plans.filter(plan => plan.purchaseMode === 'self_service');
  const groups = new Map<string, Catalog['plans']>();
  const basis = (plan: Catalog['plans'][number]) => {
    if (plan.prices.length !== 1) return plan.revisionId;
    const price = plan.prices[0];
    return JSON.stringify([price.currency, price.intervalUnit, price.intervalCount, price.quantityBasis]);
  };
  for (const plan of paid) {
    const key = basis(plan);
    groups.set(key, [...(groups.get(key) ?? []), plan]);
  }
  for (const group of groups.values()) group.sort((a, b) => {
    if (a.prices.length !== 1 || b.prices.length !== 1) return 0;
    const left = a.prices[0], right = b.prices[0];
    const precision = Math.max(left.minorUnit, right.minorUnit);
    const difference = BigInt(left.amountMinor) * 10n ** BigInt(precision - left.minorUnit)
      - BigInt(right.amountMinor) * 10n ** BigInt(precision - right.minorUnit);
    return difference < 0n ? -1 : difference > 0n ? 1 : 0;
  });
  const positions = new Map<string, number>();
  return [...plans.filter(plan => plan.purchaseMode === 'free'), ...paid.map(plan => {
    const key = basis(plan), index = positions.get(key) ?? 0;
    positions.set(key, index + 1);
    return groups.get(key)![index];
  }), ...plans.filter(plan => plan.purchaseMode === 'contact_sales')];
}


/** Keep validated minor units exact, including currencies with nonstandard precision. */
export function formatPrice(amount: number, precision: number, currency: string) {
  const digits = String(amount).padStart(precision + 1, '0');
  const whole = precision === 0 ? digits : digits.slice(0, -precision);
  const grouped = BigInt(whole).toLocaleString(currency === 'INR' ? 'en-IN' : 'en-US');
  const fractional = precision === 0 ? '' : `.${digits.slice(-precision)}`;
  return `${currency === 'INR' ? '₹' : `${currency} `}${grouped}${fractional}`;
}

/** Native buttons retain click behavior; arrow keys implement the horizontal tabs pattern. */
export function handleTabKeyDown(event: KeyboardEvent<HTMLButtonElement>) {
  const keys = ['ArrowLeft', 'ArrowRight', 'Home', 'End'];
  if (!keys.includes(event.key)) return;
  const tabs = Array.from(event.currentTarget.closest('[role="tablist"]')!.querySelectorAll<HTMLButtonElement>('[role="tab"]'));
  const current = tabs.indexOf(event.currentTarget);
  const next = event.key === 'Home' ? 0 : event.key === 'End' ? tabs.length - 1
    : (current + (event.key === 'ArrowRight' ? 1 : -1) + tabs.length) % tabs.length;
  event.preventDefault();
  tabs[next].focus();
  tabs[next].click();
}
