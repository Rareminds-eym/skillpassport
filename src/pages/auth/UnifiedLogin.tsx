/**
 * Re-export the canonical UnifiedLogin from features/auth/ui/.
 * This file exists only because some routes reference this path.
 * All login logic lives in the feature module (SSO-based).
 */
export { default } from '@/features/auth/ui/UnifiedLogin';
