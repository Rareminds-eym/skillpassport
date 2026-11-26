/** Signup creates an organization for billing; that alone does not finish registration. */
export function isOrganizationRegistrationComplete(value: unknown, type: 'school' | 'college' | 'university'): boolean {
  if (!value || typeof value !== 'object') return false;
  const org = value as Record<string, unknown>;
  if (typeof org.id !== 'string' || !org.id || org.organization_type !== type) return false;
  // Keep the existing university onboarding policy. School and college require
  // the same name and location fields as their registration form.
  if (type === 'university') return true;
  return typeof org.name === 'string' && org.name.trim().length >= 3
    && org.name.trim().length <= 200
    && typeof org.city === 'string' && org.city.trim().length > 0
    && typeof org.state === 'string' && org.state.trim().length > 0;
}
