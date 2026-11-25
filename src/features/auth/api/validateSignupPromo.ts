export const INVALID_SIGNUP_PROMO = 'Invalid or expired promo code. Check the code or remove it to continue.';
export async function validateSignupPromo(code: string, role: string, signal?: AbortSignal): Promise<boolean> {
  if (!code.trim()) return true;
  const response = await fetch('/api/promos/validate', { method: 'POST', headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ code: code.trim().toUpperCase(), role }), signal: signal ? AbortSignal.any([signal, AbortSignal.timeout(10000)]) : AbortSignal.timeout(10000) });
  if (!response.ok) throw new Error('Unable to verify the promo code. Please try again.');
  const body = await response.json();
  if (typeof body.valid !== 'boolean') throw new Error('Unable to verify the promo code. Please try again.');
  return body.valid;
}
