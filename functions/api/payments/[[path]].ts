/**
 * Payments API - Cloudflare Pages Function
 * Complete subscription and payment management backend
 * 
 * PAYMENT ENDPOINTS:
 * - POST /create-order - Create Razorpay order for subscription
 * - POST /verify-payment - Verify payment + create subscription
 * - POST /webhook - Handle Razorpay webhooks
 * 
 * SUBSCRIPTION ENDPOINTS:
 * - GET  /get-subscription - Get user's active subscription
 * - GET  /check-subscription-access - Check subscription access with grace period
 * - POST /cancel-subscription - Cancel Razorpay subscription
 * - POST /deactivate-subscription - Deactivate subscription in DB
 * 
 * SUBSCRIPTION PLANS ENDPOINTS:
 * - GET  /subscription-plans - Get all active plans
 * - GET  /subscription-plan - Get single plan by code
 * - GET  /subscription-features - Get features comparison
 * 
 * ADD-ON ENDPOINTS:
 * - GET  /addon-catalog - Get available add-ons and bundles
 * - GET  /user-entitlements - Get user's active entitlements
 * - POST /create-addon-order - Create Razorpay order for add-on
 * - POST /verify-addon-payment - Verify payment and create entitlement
 * - POST /create-bundle-order - Create Razorpay order for bundle
 * - POST /verify-bundle-payment - Verify bundle payment
 * - POST /cancel-addon - Cancel an add-on subscription
 * - GET  /check-addon-access - Check feature access
 * 
 * ORGANIZATION ENDPOINTS:
 * - POST /create-org-order - Create organization subscription order
 * - POST /verify-org-payment - Verify organization payment
 * - POST /org-subscriptions/calculate-pricing - Calculate pricing
 * - POST /org-subscriptions/purchase - Purchase organization subscription
 * - GET  /org-subscriptions - Get organization subscriptions
 * - GET  /license-pools - Get license pools
 * - POST /license-pools - Create license pool
 * - POST /license-assignments - Assign license
 * - POST /license-assignments/bulk - Bulk assign licenses
 * - POST /license-assignments/transfer - Transfer license
 * - GET  /org-billing/dashboard - Get billing dashboard
 * - GET  /org-billing/invoices - Get invoice history
 * - GET  /org-billing/cost-projection - Get cost projection
 * - POST /org-billing/calculate-seat-addition - Calculate seat addition cost
 * - POST /org-invitations/invite - Invite member
 * - POST /org-invitations/bulk-invite - Bulk invite members
 * - GET  /org-invitations - Get invitations
 * - POST /org-invitations/resend - Resend invitation
 * - POST /org-invitations/cancel - Cancel invitation
 * - POST /org-invitations/accept - Accept invitation
 * - GET  /org-invitations/stats - Get invitation stats
 * 
 * ENTITLEMENT LIFECYCLE ENDPOINTS (CRON):
 * - POST /process-entitlement-lifecycle - Main cron handler
 * - POST /expire-entitlements - Mark expired entitlements
 * - POST /send-renewal-reminders - Send reminder emails
 * - POST /process-auto-renewals - Process auto-renewals
 */

import type { PagesFunction } from '../../../src/functions-lib/types';
import { corsHeaders, jsonResponse } from '../../../src/functions-lib';
import { authenticateUser } from './utils/auth';

// Payment handlers
import { handleCreateOrder, handleVerifyPayment, handleWebhook } from './handlers/payments';

// Subscription handlers
import {
  handleGetSubscription,
  handleCheckSubscriptionAccess,
  handleCancelSubscription,
  handleDeactivateSubscription,
  handlePauseSubscription,
  handleResumeSubscription,
} from './handlers/subscriptions';

// Event handlers
import {
  handleCreateEventOrder,
  handleUpdateEventPaymentStatus,
  handleExpireSubscriptions,
} from './handlers/events';

// Plan handlers
import {
  handleGetSubscriptionPlans,
  handleGetSubscriptionPlan,
  handleGetSubscriptionFeatures,
} from './handlers/plans';

// Add-on handlers
import {
  handleGetAddonCatalog,
  handleGetUserEntitlements,
  handleCreateAddonOrder,
  handleVerifyAddonPayment,
  handleCreateBundleOrder,
  handleVerifyBundlePayment,
  handleCancelAddon,
  handleCheckAddonAccess,
} from './handlers/addons';

// Organization handlers
import {
  handleCalculateOrgPricing,
  handlePurchaseOrgSubscription,
  handleGetOrgSubscriptions,
  handleCreateLicensePool,
  handleGetLicensePools,
  handleAssignLicense,
  handleBulkAssignLicenses,
  handleTransferLicense,
  handleUnassignLicense,
  handleGetUserAssignments,
  handleUpdatePoolAllocation,
  handleConfigureAutoAssignment,
  handleUpdateSeatCount,
  handleGetBillingDashboard,
  handleGetInvoiceHistory,
  handleGetCostProjection,
  handleCalculateSeatAdditionCost,
  handleDownloadInvoice,
  handleInviteMember,
  handleBulkInviteMembers,
  handleGetInvitations,
  handleResendInvitation,
  handleCancelInvitation,
  handleAcceptInvitation,
  handleGetInvitationStats,
} from './handlers/organization';

// Organization order handlers
import {
  handleCreateOrgOrder,
  handleVerifyOrgPayment,
} from './handlers/orgOrders';

// Entitlement lifecycle handlers
import {
  handleProcessEntitlementLifecycle,
  handleExpireEntitlements,
  handleSendRenewalReminders,
  handleProcessAutoRenewals,
} from './handlers/entitlementLifecycle';

const API_VERSION = '1.0.0';

export const onRequest: PagesFunction = async (context) => {
  const { request, env } = context;

  // Handle CORS preflight
  if (request.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  const url = new URL(request.url);
  const path = url.pathname.replace('/api/payments', '');

  try {
    // Health check
    if (!path || path === '/' || path === '/health') {
      return jsonResponse({
        status: 'ok',
        service: 'payments-api',
        version: API_VERSION,
        endpoints: {
          payment: ['/create-order', '/verify-payment', '/webhook'],
          subscription: ['/get-subscription', '/check-subscription-access', '/cancel-subscription', '/deactivate-subscription'],
          plans: ['/subscription-plans', '/subscription-plan', '/subscription-features'],
          addons: ['/addon-catalog', '/user-entitlements', '/create-addon-order', '/verify-addon-payment', '/cancel-addon', '/check-addon-access'],
          organization: ['/create-org-order', '/verify-org-payment', '/org-subscriptions', '/license-pools', '/license-assignments'],
          lifecycle: ['/process-entitlement-lifecycle', '/expire-entitlements', '/send-renewal-reminders', '/process-auto-renewals'],
        },
        timestamp: new Date().toISOString(),
      });
    }

    // Payment endpoints
    if (path === '/create-order' && request.method === 'POST') {
      return await handleCreateOrder(request, env);
    }
    if (path === '/verify-payment' && request.method === 'POST') {
      const auth = await authenticateUser(request, env);
      if (!auth) return jsonResponse({ error: 'Unauthorized' }, 401);
      return await handleVerifyPayment(request, env, auth.user);
    }
    if (path === '/webhook' && request.method === 'POST') {
      return await handleWebhook(request, env);
    }

    // Subscription management endpoints
    if (path === '/get-subscription' && request.method === 'GET') {
      return await handleGetSubscription(request, env);
    }
    if (path === '/check-subscription-access' && request.method === 'GET') {
      return await handleCheckSubscriptionAccess(request, env);
    }
    if (path === '/cancel-subscription' && request.method === 'POST') {
      return await handleCancelSubscription(request, env);
    }
    if (path === '/deactivate-subscription' && request.method === 'POST') {
      return await handleDeactivateSubscription(request, env);
    }
    if (path === '/pause-subscription' && request.method === 'POST') {
      const auth = await authenticateUser(request, env);
      if (!auth) return jsonResponse({ error: 'Unauthorized' }, 401);
      return await handlePauseSubscription(request, env, auth.user, auth.supabase);
    }
    if (path === '/resume-subscription' && request.method === 'POST') {
      const auth = await authenticateUser(request, env);
      if (!auth) return jsonResponse({ error: 'Unauthorized' }, 401);
      return await handleResumeSubscription(request, env, auth.user, auth.supabase);
    }

    // Admin/Cron endpoints
    if (path === '/expire-subscriptions' && request.method === 'POST') {
      return await handleExpireSubscriptions(env);
    }

    // Event order endpoints
    if (path === '/create-event-order' && request.method === 'POST') {
      return await handleCreateEventOrder(request, env);
    }
    if (path === '/update-event-payment-status' && request.method === 'POST') {
      return await handleUpdateEventPaymentStatus(request, env);
    }

    // Organization order endpoints
    if (path === '/create-org-order' && request.method === 'POST') {
      const auth = await authenticateUser(request, env);
      if (!auth) return jsonResponse({ error: 'Unauthorized' }, 401);
      return await handleCreateOrgOrder(request, env, auth.user);
    }
    if (path === '/verify-org-payment' && request.method === 'POST') {
      const auth = await authenticateUser(request, env);
      if (!auth) return jsonResponse({ error: 'Unauthorized' }, 401);
      return await handleVerifyOrgPayment(request, env, auth.supabase, auth.user);
    }

    // Subscription Plans endpoints
    if (path === '/subscription-plans' && request.method === 'GET') {
      return await handleGetSubscriptionPlans(request, env);
    }
    if (path === '/subscription-plan' && request.method === 'GET') {
      return await handleGetSubscriptionPlan(request, env);
    }
    if (path === '/subscription-features' && request.method === 'GET') {
      return await handleGetSubscriptionFeatures(request, env);
    }

    // Add-on endpoints
    if (path === '/addon-catalog' && request.method === 'GET') {
      return await handleGetAddonCatalog(request, env);
    }
    if (path === '/user-entitlements' && request.method === 'GET') {
      return await handleGetUserEntitlements(request, env);
    }
    if (path === '/create-addon-order' && request.method === 'POST') {
      const auth = await authenticateUser(request, env);
      if (!auth) return jsonResponse({ error: 'Unauthorized' }, 401);
      return await handleCreateAddonOrder(request, env);
    }
    if (path === '/verify-addon-payment' && request.method === 'POST') {
      const auth = await authenticateUser(request, env);
      if (!auth) return jsonResponse({ error: 'Unauthorized' }, 401);
      return await handleVerifyAddonPayment(request, env);
    }
    if (path === '/create-bundle-order' && request.method === 'POST') {
      const auth = await authenticateUser(request, env);
      if (!auth) return jsonResponse({ error: 'Unauthorized' }, 401);
      return await handleCreateBundleOrder(request, env);
    }
    if (path === '/verify-bundle-payment' && request.method === 'POST') {
      const auth = await authenticateUser(request, env);
      if (!auth) return jsonResponse({ error: 'Unauthorized' }, 401);
      return await handleVerifyBundlePayment(request, env);
    }
    if (path === '/cancel-addon' && request.method === 'POST') {
      const auth = await authenticateUser(request, env);
      if (!auth) return jsonResponse({ error: 'Unauthorized' }, 401);
      return await handleCancelAddon(request, env);
    }
    if (path === '/check-addon-access' && request.method === 'GET') {
      return await handleCheckAddonAccess(request, env);
    }

    // Organization endpoints
    if (path === '/org-subscriptions/calculate-pricing' && request.method === 'POST') {
      const auth = await authenticateUser(request, env);
      if (!auth) return jsonResponse({ error: 'Unauthorized' }, 401);
      return await handleCalculateOrgPricing(request, env, auth.supabase, auth.user.id);
    }
    if (path === '/org-subscriptions/purchase' && request.method === 'POST') {
      const auth = await authenticateUser(request, env);
      if (!auth) return jsonResponse({ error: 'Unauthorized' }, 401);
      return await handlePurchaseOrgSubscription(request, env, auth.supabase, auth.user.id);
    }
    if (path === '/org-subscriptions' && request.method === 'GET') {
      const auth = await authenticateUser(request, env);
      if (!auth) return jsonResponse({ error: 'Unauthorized' }, 401);
      return await handleGetOrgSubscriptions(request, env, auth.supabase, auth.user.id);
    }

    // License Pool endpoints
    if (path === '/license-pools' && request.method === 'POST') {
      const auth = await authenticateUser(request, env);
      if (!auth) return jsonResponse({ error: 'Unauthorized' }, 401);
      return await handleCreateLicensePool(request, env, auth.supabase, auth.user.id);
    }
    if (path === '/license-pools' && request.method === 'GET') {
      const auth = await authenticateUser(request, env);
      if (!auth) return jsonResponse({ error: 'Unauthorized' }, 401);
      return await handleGetLicensePools(request, env, auth.supabase, auth.user.id);
    }

    // License Assignment endpoints
    if (path === '/license-assignments' && request.method === 'POST') {
      const auth = await authenticateUser(request, env);
      if (!auth) return jsonResponse({ error: 'Unauthorized' }, 401);
      return await handleAssignLicense(request, env, auth.supabase, auth.user.id);
    }
    if (path === '/license-assignments/bulk' && request.method === 'POST') {
      const auth = await authenticateUser(request, env);
      if (!auth) return jsonResponse({ error: 'Unauthorized' }, 401);
      return await handleBulkAssignLicenses(request, env, auth.supabase, auth.user.id);
    }
    if (path === '/license-assignments/transfer' && request.method === 'POST') {
      const auth = await authenticateUser(request, env);
      if (!auth) return jsonResponse({ error: 'Unauthorized' }, 401);
      return await handleTransferLicense(request, env, auth.supabase, auth.user.id);
    }

    // Organization Billing endpoints
    if (path === '/org-billing/dashboard' && request.method === 'GET') {
      const auth = await authenticateUser(request, env);
      if (!auth) return jsonResponse({ error: 'Unauthorized' }, 401);
      return await handleGetBillingDashboard(request, env, auth.supabase, auth.user.id);
    }
    if (path === '/org-billing/invoices' && request.method === 'GET') {
      const auth = await authenticateUser(request, env);
      if (!auth) return jsonResponse({ error: 'Unauthorized' }, 401);
      return await handleGetInvoiceHistory(request, env, auth.supabase, auth.user.id);
    }
    if (path === '/org-billing/cost-projection' && request.method === 'GET') {
      const auth = await authenticateUser(request, env);
      if (!auth) return jsonResponse({ error: 'Unauthorized' }, 401);
      return await handleGetCostProjection(request, env, auth.supabase, auth.user.id);
    }
    if (path === '/org-billing/calculate-seat-addition' && request.method === 'POST') {
      const auth = await authenticateUser(request, env);
      if (!auth) return jsonResponse({ error: 'Unauthorized' }, 401);
      return await handleCalculateSeatAdditionCost(request, env, auth.supabase, auth.user.id);
    }

    // Organization Invitation endpoints
    if (path === '/org-invitations' && request.method === 'POST') {
      const auth = await authenticateUser(request, env);
      if (!auth) return jsonResponse({ error: 'Unauthorized' }, 401);
      return await handleInviteMember(request, env, auth.supabase, auth.user.id);
    }
    if (path === '/org-invitations' && request.method === 'GET') {
      const auth = await authenticateUser(request, env);
      if (!auth) return jsonResponse({ error: 'Unauthorized' }, 401);
      return await handleGetInvitations(request, env, auth.supabase, auth.user.id);
    }
    if (path === '/org-invitations/bulk' && request.method === 'POST') {
      const auth = await authenticateUser(request, env);
      if (!auth) return jsonResponse({ error: 'Unauthorized' }, 401);
      return await handleBulkInviteMembers(request, env, auth.supabase, auth.user.id);
    }
    if (path === '/org-invitations/accept' && request.method === 'POST') {
      const auth = await authenticateUser(request, env);
      if (!auth) return jsonResponse({ error: 'Unauthorized' }, 401);
      return await handleAcceptInvitation(request, env, auth.supabase, auth.user.id);
    }
    if (path === '/org-invitations/stats' && request.method === 'GET') {
      const auth = await authenticateUser(request, env);
      if (!auth) return jsonResponse({ error: 'Unauthorized' }, 401);
      return await handleGetInvitationStats(request, env, auth.supabase, auth.user.id);
    }

    // Dynamic routes for invitations
    if (path.startsWith('/org-invitations/') && !path.includes('/bulk') && !path.includes('/accept') && !path.includes('/stats')) {
      const auth = await authenticateUser(request, env);
      if (!auth) return jsonResponse({ error: 'Unauthorized' }, 401);

      const parts = path.split('/');
      const invitationId = parts[3];
      const action = parts[4];

      if (invitationId && action === 'resend' && request.method === 'PUT') {
        return await handleResendInvitation(request, env, auth.supabase, auth.user.id, invitationId);
      } else if (invitationId && !action && request.method === 'DELETE') {
        return await handleCancelInvitation(request, env, auth.supabase, auth.user.id, invitationId);
      }
    }

    // Dynamic routes for license assignments
    if (path.startsWith('/license-assignments/') && !path.includes('/bulk') && !path.includes('/transfer')) {
      const auth = await authenticateUser(request, env);
      if (!auth) return jsonResponse({ error: 'Unauthorized' }, 401);

      const parts = path.split('/');
      if (parts[3] === 'user' && parts[4] && request.method === 'GET') {
        return await handleGetUserAssignments(request, env, auth.supabase, auth.user.id, parts[4]);
      } else if (parts[3] && request.method === 'DELETE') {
        return await handleUnassignLicense(request, env, auth.supabase, auth.user.id, parts[3]);
      }
    }

    // Dynamic routes for license pools
    if (path.startsWith('/license-pools/')) {
      const auth = await authenticateUser(request, env);
      if (!auth) return jsonResponse({ error: 'Unauthorized' }, 401);

      const parts = path.split('/');
      const poolId = parts[3];

      if (path.includes('/allocation') && request.method === 'PUT' && poolId) {
        return await handleUpdatePoolAllocation(request, env, auth.supabase, auth.user.id, poolId);
      } else if (path.includes('/auto-assignment') && request.method === 'POST' && poolId) {
        return await handleConfigureAutoAssignment(request, env, auth.supabase, auth.user.id, poolId);
      }
    }

    // Dynamic routes for organization subscriptions
    if (path.startsWith('/org-subscriptions/') && path.includes('/seats') && request.method === 'PUT') {
      const auth = await authenticateUser(request, env);
      if (!auth) return jsonResponse({ error: 'Unauthorized' }, 401);
      const subscriptionId = path.split('/')[3];
      return await handleUpdateSeatCount(request, env, auth.supabase, auth.user.id, subscriptionId);
    }

    // Dynamic routes for invoice download
    if (path.startsWith('/org-billing/invoice/') && path.includes('/download') && request.method === 'GET') {
      const auth = await authenticateUser(request, env);
      if (!auth) return jsonResponse({ error: 'Unauthorized' }, 401);
      const invoiceId = path.split('/')[4];
      return await handleDownloadInvoice(request, env, auth.supabase, auth.user.id, invoiceId);
    }

    // Entitlement Lifecycle endpoints (CRON)
    if (path === '/process-entitlement-lifecycle' && request.method === 'POST') {
      return await handleProcessEntitlementLifecycle(request, env);
    }
    if (path === '/expire-entitlements' && request.method === 'POST') {
      return await handleExpireEntitlements(request, env);
    }
    if (path === '/send-renewal-reminders' && request.method === 'POST') {
      return await handleSendRenewalReminders(request, env);
    }
    if (path === '/process-auto-renewals' && request.method === 'POST') {
      return await handleProcessAutoRenewals(request, env);
    }

    return jsonResponse({ 
      error: 'Not found',
      path,
      availableEndpoints: 'See /health for full endpoint list'
    }, 404);
  } catch (error) {
    console.error('Payments API Error:', error);
    return jsonResponse({ 
      error: (error as Error).message || 'Internal server error' 
    }, 500);
  }
};
