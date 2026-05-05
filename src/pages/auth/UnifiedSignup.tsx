/**
 * Re-export the canonical UnifiedSignup from features/auth/ui/.
 * This file exists only because some routes reference this path.
 * All signup logic lives in the feature module (SSO-based).
 */
export { default } from '@/features/auth/ui/UnifiedSignup';
