/** Accept only explicit web destinations, never executable or relative URLs. */
export function getExternalApplicationUrl(value: unknown): string {
  if (typeof value !== 'string' || !value.trim()) {
    throw new Error('Invalid application destination');
  }
  let target: URL;
  try {
    target = new URL(value.trim());
  } catch {
    throw new Error('Invalid application destination');
  }
  if (target.protocol !== 'https:' && target.protocol !== 'http:') {
    throw new Error('Invalid application destination');
  }
  return target.href;
}

/** A null handle is normal with noopener; it does not prove opening failed. */
export function openExternalApplication(value: unknown): Window | null {
  return window.open(getExternalApplicationUrl(value), '_blank', 'noopener,noreferrer');
}
