/**
 * Credit package catalogue — shared between create-credit-order and verify-credit-payment.
 *
 * Source of truth: `credit_packages` table in Supabase.
 * Fallback: hardcoded catalogue used when the table doesn't exist yet.
 */

import type { SupabaseClient } from '@supabase/supabase-js';

export interface CreditPackage {
  id: string;
  credits: number;
  price_inr: number;
  label: string;
  is_active: boolean;
}

export const FALLBACK_PACKAGES: CreditPackage[] = [
  { id: 'credits_100',  credits: 100,  price_inr: 49,  label: '100 Credits',  is_active: true },
  { id: 'credits_500',  credits: 500,  price_inr: 199, label: '500 Credits',  is_active: true },
  { id: 'credits_1000', credits: 1000, price_inr: 349, label: '1000 Credits', is_active: true },
  { id: 'credits_5000', credits: 5000, price_inr: 999, label: '5000 Credits', is_active: true },
];

export async function resolvePackage(
  supabase: SupabaseClient,
  packageId: string
): Promise<CreditPackage | null> {
  try {
    const { data, error } = await supabase
      .from('credit_packages')
      .select('id, credits, price_inr, label, is_active')
      .eq('id', packageId)
      .eq('is_active', true)
      .maybeSingle();
    if (!error && data) return data as CreditPackage;
  } catch {
    // Table may not exist yet — fall through to hardcoded catalogue
  }
  return FALLBACK_PACKAGES.find((p) => p.id === packageId && p.is_active) ?? null;
}
