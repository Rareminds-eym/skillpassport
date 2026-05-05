/**
 * Re-export the canonical TokenPasswordReset from features/auth/ui/.
 * This file exists only because routes reference this path.
 * All password reset logic lives in the feature module (SSO-based).
 */
export { default } from '@/features/auth/ui/TokenPasswordReset';
