/**
 * Create Freemium Subscription Endpoint
 * 
 * POST /api/payments/create-freemium-subscription
 */

import { withAuth } from '../../lib/auth';
import type { AuthenticatedContext } from '@rareminds-eym/auth-core';
import { handleCreateFreemiumSubscription } from './handlers/create-freemium-subscription';

export const onRequestPost = withAuth(async (context: AuthenticatedContext) => {
    return handleCreateFreemiumSubscription(context);
});
