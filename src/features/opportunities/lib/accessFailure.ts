/** Preserve permanent access failures separately from retryable transport failures. */
export function opportunityFailure(cause: unknown, defaultMessage: string) {
  const error = cause instanceof Error ? cause : null;
  const status = error && 'status' in error && typeof error.status === 'number' ? error.status : undefined;
  const code = error && 'code' in error && typeof error.code === 'string' ? error.code : undefined;
  if (code === 'SUBSCRIPTION_SETUP_REQUIRED' || code === 'SUBSCRIPTION_REVIEW_REQUIRED') return {
    kind: 'setup' as const, retryable: false, title: 'Subscription setup required',
    message: 'Your existing subscription needs attention. Contact support to complete setup. Your search and filters have been kept.',
    action: {label: 'Manage subscription', to: '/subscription/manage'},
  };
  if (status === 401) return {kind: 'signin' as const, retryable: false, title: 'Sign in to continue',
    message: 'Your session could not be verified. Sign in again to continue.', action: {label: 'Sign in', to: '/login'}};
  if (status === 403) return {kind: 'access' as const, retryable: false, title: 'Subscription access required',
    message: code === 'FEATURE_ACCESS_DENIED' ? 'Your current plan does not include matched opportunities. You can still browse all job openings below.'
      : 'Your current subscription does not allow this request. Review your subscription or contact support.',
    action: {label: 'Review subscription', to: '/subscription/manage'}};
  return {kind: 'temporary' as const, retryable: true, title: 'Unable to load jobs',
    message: error?.message || defaultMessage, action: null};
}
