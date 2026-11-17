/** Read activation evidence from the paid verification or direct free response. */
export function confirmedPaymentSubscription(result: unknown): Record<string, unknown> | null {
  if (typeof result !== 'object' || result === null) return null;
  const envelope = result as Record<string, unknown>;
  if (envelope.success === false || envelope.subscription_error) return null;
  const payload = envelope.data && typeof envelope.data === 'object'
    ? envelope.data as Record<string, unknown> : envelope;
  if (payload.subscription_error) return null;
  const subscription = envelope.isFreemium === true ? envelope.data : payload.subscription;
  if (typeof subscription !== 'object' || subscription === null) return null;
  const candidate = subscription as Record<string, unknown>;
  return typeof candidate.id === 'string' && candidate.id.length > 0 && candidate.status === 'active'
    ? candidate : null;
}
