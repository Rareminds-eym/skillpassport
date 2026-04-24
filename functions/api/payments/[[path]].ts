/**
 * Payments API — Pages Function router
 * Base path: /api/payments/*
 * Full replacement for cloudflare-workers/payments-api
 */

import type { PagesFunction } from '../../../src/functions-lib/types';
import { corsHeaders, jsonResponse } from '../../../src/functions-lib';
import { handleGetPlans, handleGetPlan, handleGetFeatures, handleGetAddonCatalog } from './handlers/plans';
import {
  handleCreateOrder, handleVerifyPayment, handleGetSubscription,
  handleCheckSubscriptionAccess, handleCancelSubscription, handleDeactivateSubscription,
  handlePauseSubscription, handleResumeSubscription,
} from './handlers/subscriptions';
import {
  handleGetUserEntitlements, handleCheckAddonAccess, handleCreateAddonOrder,
  handleVerifyAddonPayment, handleCancelAddon, handleCreateBundleOrder, handleVerifyBundlePayment,
} from './handlers/addons';
import {
  handleExpireEntitlements, handleSendRenewalReminders,
  handleProcessAutoRenewals, handleProcessEntitlementLifecycle,
  handleExpireSubscriptions,
} from './handlers/entitlements';
import { handleCreateEventOrder, handleUpdateEventPaymentStatus, handleWebhook } from './handlers/events';
import {
  handleCalculateOrgPricing, handlePurchaseOrgSubscription, handleGetOrgSubscriptions,
  handleUpdateSeatCount, handleCreateLicensePool, handleGetLicensePools,
  handleUpdatePoolAllocation, handleConfigureAutoAssignment,
  handleAssignLicense, handleBulkAssignLicenses, handleUnassignLicense,
  handleTransferLicense, handleGetUserAssignments,
  handleGetBillingDashboard, handleGetInvoiceHistory, handleDownloadInvoice,
  handleGetCostProjection, handleCalculateSeatAdditionCost,
  handleInviteMember, handleGetInvitations, handleBulkInviteMembers,
  handleAcceptInvitation, handleGetInvitationStats, handleResendInvitation, handleCancelInvitation,
  handleVerifyOrgPayment, handleCreateOrgOrder,
} from './handlers/organization';

export const onRequest: PagesFunction = async (context) => {
  const { request, env } = context;

  if (request.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  const url = new URL(request.url);
  const path = url.pathname.replace(/^\/api\/payments/, '') || '/';
  const method = request.method;
  const e = env as any;

  try {
    // ── Public / Plans ───────────────────────────────────────────────────────
    if ((path === '/plans' || path === '/subscription-plans') && method === 'GET') return handleGetPlans(request, e);
    if ((path === '/plan' || path === '/subscription-plan') && method === 'GET') return handleGetPlan(request, e);
    if ((path === '/features' || path === '/subscription-features') && method === 'GET') return handleGetFeatures(request, e);
    if (path === '/addon-catalog' && method === 'GET') return handleGetAddonCatalog(request, e);

    // ── Subscription (auth) ──────────────────────────────────────────────────
    if (path === '/create-order' && method === 'POST') return handleCreateOrder(request, e);
    if (path === '/verify-payment' && method === 'POST') return handleVerifyPayment(request, e);
    if (path === '/get-subscription' && method === 'GET') return handleGetSubscription(request, e);
    if (path === '/check-subscription-access' && method === 'GET') return handleCheckSubscriptionAccess(request, e);
    if (path === '/cancel-subscription' && method === 'POST') return handleCancelSubscription(request, e);
    if (path === '/deactivate-subscription' && method === 'POST') return handleDeactivateSubscription(request, e);
    if (path === '/pause-subscription' && method === 'POST') return handlePauseSubscription(request, e);
    if (path === '/resume-subscription' && method === 'POST') return handleResumeSubscription(request, e);

    // ── Add-ons (auth) ───────────────────────────────────────────────────────
    if (path === '/user-entitlements' && method === 'GET') return handleGetUserEntitlements(request, e);
    if (path === '/check-addon-access' && method === 'GET') return handleCheckAddonAccess(request, e);
    if (path === '/create-addon-order' && method === 'POST') return handleCreateAddonOrder(request, e);
    if (path === '/verify-addon-payment' && method === 'POST') return handleVerifyAddonPayment(request, e);
    if (path === '/cancel-addon' && method === 'POST') return handleCancelAddon(request, e);
    if (path === '/create-bundle-order' && method === 'POST') return handleCreateBundleOrder(request, e);
    if (path === '/verify-bundle-payment' && method === 'POST') return handleVerifyBundlePayment(request, e);

    // ── Events (no auth) ─────────────────────────────────────────────────────
    if (path === '/create-event-order' && method === 'POST') return handleCreateEventOrder(request, e);
    if (path === '/update-event-payment-status' && method === 'POST') return handleUpdateEventPaymentStatus(request, e);
    if (path === '/webhook' && method === 'POST') return handleWebhook(request, e);

    // ── Organization subscriptions ───────────────────────────────────────────
    if (path === '/create-org-order' && method === 'POST') return handleCreateOrgOrder(request, e);
    if (path === '/verify-org-payment' && method === 'POST') return handleVerifyOrgPayment(request, e);
    if (path === '/org-subscriptions/calculate-pricing' && method === 'POST') return handleCalculateOrgPricing(request, e);
    if (path === '/org-subscriptions/purchase' && method === 'POST') return handlePurchaseOrgSubscription(request, e);
    if (path === '/org-subscriptions' && method === 'GET') return handleGetOrgSubscriptions(request, e);

    // org-subscriptions/:id/seats — PUT
    const seatMatch = path.match(/^\/org-subscriptions\/([^/]+)\/seats$/);
    if (seatMatch && method === 'PUT') return handleUpdateSeatCount(request, e, seatMatch[1]);

    // ── License pools ────────────────────────────────────────────────────────
    if (path === '/license-pools' && method === 'POST') return handleCreateLicensePool(request, e);
    if (path === '/license-pools' && method === 'GET') return handleGetLicensePools(request, e);

    const poolAllocMatch = path.match(/^\/license-pools\/([^/]+)\/allocation$/);
    if (poolAllocMatch && method === 'PUT') return handleUpdatePoolAllocation(request, e, poolAllocMatch[1]);

    const poolAutoMatch = path.match(/^\/license-pools\/([^/]+)\/auto-assignment$/);
    if (poolAutoMatch && method === 'POST') return handleConfigureAutoAssignment(request, e, poolAutoMatch[1]);

    // ── License assignments ──────────────────────────────────────────────────
    if (path === '/license-assignments' && method === 'POST') return handleAssignLicense(request, e);
    if (path === '/license-assignments/bulk' && method === 'POST') return handleBulkAssignLicenses(request, e);
    if (path === '/license-assignments/transfer' && method === 'POST') return handleTransferLicense(request, e);

    const assignDeleteMatch = path.match(/^\/license-assignments\/([^/]+)$/);
    if (assignDeleteMatch && method === 'DELETE') return handleUnassignLicense(request, e, assignDeleteMatch[1]);

    const userAssignMatch = path.match(/^\/license-assignments\/user\/([^/]+)$/);
    if (userAssignMatch && method === 'GET') return handleGetUserAssignments(request, e, userAssignMatch[1]);

    // ── Org billing ──────────────────────────────────────────────────────────
    if (path === '/org-billing/dashboard' && method === 'GET') return handleGetBillingDashboard(request, e);
    if (path === '/org-billing/invoices' && method === 'GET') return handleGetInvoiceHistory(request, e);
    if (path === '/org-billing/cost-projection' && method === 'GET') return handleGetCostProjection(request, e);
    if (path === '/org-billing/calculate-seat-addition' && method === 'POST') return handleCalculateSeatAdditionCost(request, e);

    const invoiceDownloadMatch = path.match(/^\/org-billing\/invoice\/([^/]+)\/download$/);
    if (invoiceDownloadMatch && method === 'GET') return handleDownloadInvoice(request, e, invoiceDownloadMatch[1]);

    // ── Org invitations ──────────────────────────────────────────────────────
    if (path === '/org-invitations' && method === 'POST') return handleInviteMember(request, e);
    if (path === '/org-invitations' && method === 'GET') return handleGetInvitations(request, e);
    if (path === '/org-invitations/bulk' && method === 'POST') return handleBulkInviteMembers(request, e);
    if (path === '/org-invitations/accept' && method === 'POST') return handleAcceptInvitation(request, e);
    if (path === '/org-invitations/stats' && method === 'GET') return handleGetInvitationStats(request, e);

    const invResendMatch = path.match(/^\/org-invitations\/([^/]+)\/resend$/);
    if (invResendMatch && method === 'PUT') return handleResendInvitation(request, e, invResendMatch[1]);

    const invCancelMatch = path.match(/^\/org-invitations\/([^/]+)$/);
    if (invCancelMatch && method === 'DELETE') return handleCancelInvitation(request, e, invCancelMatch[1]);

    // ── Cron / Internal ──────────────────────────────────────────────────────
    if (path === '/expire-subscriptions' && method === 'POST') return handleExpireSubscriptions(request, e);
    if (path === '/expire-entitlements' && method === 'POST') return handleExpireEntitlements(request, e);
    if (path === '/send-renewal-reminders' && method === 'POST') return handleSendRenewalReminders(request, e);
    if (path === '/process-auto-renewals' && method === 'POST') return handleProcessAutoRenewals(request, e);
    if (path === '/process-entitlement-lifecycle' && method === 'POST') return handleProcessEntitlementLifecycle(request, e);

    // ── Health ───────────────────────────────────────────────────────────────
    if (path === '/health' || path === '/' || path === '') {
      return jsonResponse({ status: 'ok', service: 'payments-api', timestamp: new Date().toISOString() });
    }

    return jsonResponse({ error: 'Not found', path }, 404);
  } catch (error) {
    console.error('[payments-api] Unhandled error:', error);
    return jsonResponse({ error: (error as Error).message || 'Internal server error' }, 500);
  }
};
