/** Decorates the private binding; browser request bodies cannot select an app ID. */
export function skillpassportIdentity<T extends object>(binding: T): T {
  const loginMethods = new Set(['login', 'signup', 'signupMember', 'oauthAuthenticate', 'acceptInvite']);
  return new Proxy(binding, {
    get(target, property) {
      const original = Reflect.get(target, property === 'oauthAuthenticate' ? 'oauthAuthenticateSkillpassport' : property);
      if (typeof original !== 'function') return original;
      if (!loginMethods.has(String(property)) && property !== 'refreshCurrentSession') return original.bind(target);
      return async (...args: unknown[]) => {
        const outcome = await original.apply(target, args);
        if (outcome?.session?.refreshToken && ['issued', 'rotated', 'overlap'].includes(outcome.kind)) {
          try {
            await (target as any).recordSkillpassportAccess({
              refreshToken: outcome.session.refreshToken,
              eventType: loginMethods.has(String(property)) ? 'login' : 'session_access',
              signup: property === 'signup' || property === 'signupMember',
            });
          } catch {
            // Never report login success when its authoritative application record failed.
            if (outcome.kind === 'issued') {
              await (target as any).logoutCurrentSession({
                correlationId: (args[0] as any)?.correlationId,
                refreshToken: outcome.session.refreshToken,
              }).catch(() => {});
            }
            return { kind: 'unavailable', correlationId: (args[0] as any)?.correlationId };
          }
        }
        return outcome;
      };
    },
  });
}
