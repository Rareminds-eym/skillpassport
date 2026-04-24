/**
 * Organization subscription, license pool, billing, and invitation handlers.
 * Matches old payments-api org endpoint shapes exactly.
 */

import { createClient } from '@supabase/supabase-js';
import { jsonResponse } from '../../../../src/functions-lib/response';
import { authenticateUser } from '../../shared/auth';
import type { PaymentsEnv } from '../types';

function adminClient(env: PaymentsEnv) {
  const url = env.SUPABASE_URL || env.VITE_SUPABASE_URL!;
  return createClient(url, env.SUPABASE_SERVICE_ROLE_KEY);
}

async function mintServiceJwt(secret: string): Promise<string> {
  const header = btoa(JSON.stringify({ alg: 'HS256', typ: 'JWT' })).replace(/=/g, '');
  const payload = btoa(JSON.stringify({
    service_id: 'functions-payment-service',
    iat: Math.floor(Date.now() / 1000),
    exp: Math.floor(Date.now() / 1000) + 60,
  })).replace(/=/g, '');
  const data = `${header}.${payload}`;
  const key = await crypto.subtle.importKey(
    'raw', new TextEncoder().encode(secret),
    { name: 'HMAC', hash: 'SHA-256' }, false, ['sign']
  );
  const sig = await crypto.subtle.sign('HMAC', key, new TextEncoder().encode(data));
  const sigB64 = btoa(String.fromCharCode(...new Uint8Array(sig)))
    .replace(/\+/g, '-').replace(/\//g, '_').replace(/=/g, '');
  return `${data}.${sigB64}`;
}

async function callWorker(env: PaymentsEnv, path: string, method: 'GET' | 'POST', body?: unknown): Promise<Response> {
  const token = await mintServiceJwt(env.RAZORPAY_SERVICE_SECRET);
  return fetch(`${env.RAZORPAY_WORKER_URL}${path}`, {
    method,
    headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
    ...(body ? { body: JSON.stringify(body) } : {}),
  });
}

function calcVolumeDiscount(seats: number): number {
  if (seats >= 500) return 30;
  if (seats >= 100) return 20;
  if (seats >= 50) return 10;
  return 0;
}

function calcBulkPricing(basePricePerSeat: number, seatCount: number) {
  const subtotal = basePricePerSeat * seatCount;
  const discountPercentage = calcVolumeDiscount(seatCount);
  const discountAmount = (subtotal * discountPercentage) / 100;
  const afterDiscount = subtotal - discountAmount;
  const taxAmount = afterDiscount * 0.18;
  const finalAmount = afterDiscount + taxAmount;
  return { basePrice: basePricePerSeat, seatCount, subtotal, discountPercentage, discountAmount, taxAmount, finalAmount, pricePerSeat: finalAmount / seatCount };
}

// ── POST /org-subscriptions/calculate-pricing ─────────────────────────────────

export async function handleCalculateOrgPricing(req: Request, env: PaymentsEnv): Promise<Response> {
  const auth = await authenticateUser(req, env as any);
  if (!auth) return jsonResponse({ error: 'Unauthorized' }, 401);
  const supabase = adminClient(env);
  const body = await req.json() as { planId: string; seatCount: number; billingCycle?: string; organizationType?: string };
  const { planId, seatCount, billingCycle = 'monthly', organizationType = 'school' } = body;
  if (!planId || !seatCount || seatCount < 1) return jsonResponse({ error: 'Invalid planId or seatCount' }, 400);

  const { data: plan } = await supabase.from('subscription_plans').select('pricing_matrix, price_monthly, price_yearly').eq('id', planId).single();
  if (!plan) return jsonResponse({ error: 'Plan not found' }, 404);

  const basePrice = plan.pricing_matrix?.[organizationType]?.[billingCycle === 'annual' ? 'yearly' : 'monthly']
    ?? (billingCycle === 'annual' ? plan.price_yearly : plan.price_monthly);
  if (!basePrice) return jsonResponse({ error: 'Pricing not available for this organization type' }, 400);

  return jsonResponse({ success: true, pricing: calcBulkPricing(basePrice, seatCount) });
}

// ── POST /org-subscriptions/purchase ─────────────────────────────────────────

export async function handlePurchaseOrgSubscription(req: Request, env: PaymentsEnv): Promise<Response> {
  const auth = await authenticateUser(req, env as any);
  if (!auth) return jsonResponse({ error: 'Unauthorized' }, 401);
  const supabase = adminClient(env);

  const body = await req.json() as {
    organizationId: string; organizationType: string; planId: string;
    seatCount: number; targetMemberType: string; billingCycle: string; autoRenew: boolean;
  };
  const { organizationId, organizationType, planId, seatCount, targetMemberType, billingCycle, autoRenew } = body;
  if (!organizationId || !organizationType || !planId || !seatCount || !targetMemberType || !billingCycle) {
    return jsonResponse({ error: 'Missing required fields' }, 400);
  }

  const { data: plan } = await supabase.from('subscription_plans').select('pricing_matrix, price_monthly, price_yearly').eq('id', planId).single();
  if (!plan) return jsonResponse({ error: 'Plan not found' }, 404);

  const basePrice = plan.pricing_matrix?.[organizationType]?.[billingCycle === 'annual' ? 'yearly' : 'monthly']
    ?? (billingCycle === 'annual' ? plan.price_yearly : plan.price_monthly);
  if (!basePrice) return jsonResponse({ error: 'Pricing not available' }, 400);

  const pricing = calcBulkPricing(basePrice, seatCount);
  const now = new Date();
  const endDate = new Date(now);
  if (billingCycle === 'annual') endDate.setFullYear(endDate.getFullYear() + 1);
  else endDate.setMonth(endDate.getMonth() + 1);

  const { data: subscription, error } = await supabase.from('organization_subscriptions').insert({
    organization_id: organizationId, organization_type: organizationType,
    subscription_plan_id: planId, purchased_by: auth.user.id,
    total_seats: seatCount, assigned_seats: 0, target_member_type: targetMemberType,
    status: 'active', start_date: now.toISOString(), end_date: endDate.toISOString(),
    auto_renew: autoRenew, price_per_seat: pricing.pricePerSeat,
    total_amount: pricing.subtotal, discount_percentage: pricing.discountPercentage, final_amount: pricing.finalAmount,
  }).select().single();

  if (error) return jsonResponse({ error: error.message }, 500);
  return jsonResponse({ success: true, subscription, pricing }, 201);
}

// ── GET /org-subscriptions ────────────────────────────────────────────────────

export async function handleGetOrgSubscriptions(req: Request, env: PaymentsEnv): Promise<Response> {
  const auth = await authenticateUser(req, env as any);
  if (!auth) return jsonResponse({ error: 'Unauthorized' }, 401);
  const supabase = adminClient(env);
  const url = new URL(req.url);
  const organizationId = url.searchParams.get('organizationId');
  const organizationType = url.searchParams.get('organizationType');
  if (!organizationId || !organizationType) return jsonResponse({ error: 'Missing organizationId or organizationType' }, 400);

  const { data, error } = await supabase.from('organization_subscriptions').select('*')
    .eq('organization_id', organizationId).eq('organization_type', organizationType)
    .order('created_at', { ascending: false });
  if (error) return jsonResponse({ error: error.message }, 500);
  return jsonResponse({ success: true, subscriptions: data });
}

// ── PUT /org-subscriptions/:id/seats ─────────────────────────────────────────

export async function handleUpdateSeatCount(req: Request, env: PaymentsEnv, subscriptionId: string): Promise<Response> {
  const auth = await authenticateUser(req, env as any);
  if (!auth) return jsonResponse({ error: 'Unauthorized' }, 401);
  const supabase = adminClient(env);
  const body = await req.json() as { newSeatCount: number };
  if (!body.newSeatCount || body.newSeatCount < 1) return jsonResponse({ error: 'Invalid seat count' }, 400);

  const { data: current } = await supabase.from('organization_subscriptions').select('*').eq('id', subscriptionId).single();
  if (!current) return jsonResponse({ error: 'Subscription not found' }, 404);
  if (body.newSeatCount < current.assigned_seats) {
    return jsonResponse({ error: `Cannot reduce seats below assigned count (${current.assigned_seats})` }, 400);
  }

  const pricing = calcBulkPricing(current.price_per_seat, body.newSeatCount);
  const { data: updated, error } = await supabase.from('organization_subscriptions')
    .update({ total_seats: body.newSeatCount, total_amount: pricing.subtotal, discount_percentage: pricing.discountPercentage, final_amount: pricing.finalAmount, updated_at: new Date().toISOString() })
    .eq('id', subscriptionId).select().single();
  if (error) return jsonResponse({ error: error.message }, 500);
  return jsonResponse({ success: true, subscription: updated });
}

// ── POST /license-pools ───────────────────────────────────────────────────────

export async function handleCreateLicensePool(req: Request, env: PaymentsEnv): Promise<Response> {
  const auth = await authenticateUser(req, env as any);
  if (!auth) return jsonResponse({ error: 'Unauthorized' }, 401);
  const supabase = adminClient(env);
  const body = await req.json() as {
    organizationSubscriptionId: string; organizationId: string; organizationType: string;
    poolName: string; memberType: string; allocatedSeats: number;
    autoAssignNewMembers?: boolean; assignmentCriteria?: Record<string, any>;
  };
  const { organizationSubscriptionId, organizationId, organizationType, poolName, memberType, allocatedSeats, autoAssignNewMembers, assignmentCriteria } = body;
  if (!organizationSubscriptionId || !organizationId || !organizationType || !poolName || !memberType || !allocatedSeats) {
    return jsonResponse({ error: 'Missing required fields' }, 400);
  }
  if (!poolName.trim() || poolName.length > 100) return jsonResponse({ error: 'Pool name must be between 1 and 100 characters' }, 400);
  if (memberType !== 'educator' && memberType !== 'student') return jsonResponse({ error: 'Invalid memberType. Must be educator or student' }, 400);
  if (typeof allocatedSeats !== 'number' || allocatedSeats < 1 || allocatedSeats > 10000) return jsonResponse({ error: 'allocatedSeats must be a number between 1 and 10000' }, 400);

  // Validate subscription has enough available seats — matches old worker
  const { data: subscription } = await supabase.from('organization_subscriptions')
    .select('available_seats').eq('id', organizationSubscriptionId).single();
  if (!subscription) return jsonResponse({ error: 'Subscription not found' }, 404);
  if (subscription.available_seats < allocatedSeats) {
    return jsonResponse({ error: 'Insufficient available seats in subscription' }, 400);
  }

  const { data: pool, error } = await supabase.from('license_pools').insert({
    organization_subscription_id: organizationSubscriptionId, organization_id: organizationId,
    organization_type: organizationType, pool_name: poolName, member_type: memberType,
    allocated_seats: allocatedSeats, assigned_seats: 0,
    auto_assign_new_members: autoAssignNewMembers ?? false,
    assignment_criteria: assignmentCriteria ?? {}, is_active: true, created_by: auth.user.id,
  }).select().single();
  if (error) return jsonResponse({ error: error.message }, 500);
  return jsonResponse({ success: true, pool }, 201);
}

// ── GET /license-pools ────────────────────────────────────────────────────────

export async function handleGetLicensePools(req: Request, env: PaymentsEnv): Promise<Response> {
  const auth = await authenticateUser(req, env as any);
  if (!auth) return jsonResponse({ error: 'Unauthorized' }, 401);
  const supabase = adminClient(env);
  const url = new URL(req.url);
  const organizationId = url.searchParams.get('organizationId');
  if (!organizationId) return jsonResponse({ error: 'Missing organizationId' }, 400);
  const { data, error } = await supabase.from('license_pools').select('*')
    .eq('organization_id', organizationId).order('created_at', { ascending: false });
  if (error) return jsonResponse({ error: error.message }, 500);
  return jsonResponse({ success: true, pools: data });
}

// ── PUT /license-pools/:id/allocation ────────────────────────────────────────

export async function handleUpdatePoolAllocation(req: Request, env: PaymentsEnv, poolId: string): Promise<Response> {
  const auth = await authenticateUser(req, env as any);
  if (!auth) return jsonResponse({ error: 'Unauthorized' }, 401);
  const supabase = adminClient(env);
  const body = await req.json() as { allocatedSeats: number };
  if (!body.allocatedSeats || body.allocatedSeats < 1) return jsonResponse({ error: 'Invalid allocatedSeats' }, 400);
  const { data, error } = await supabase.from('license_pools')
    .update({ allocated_seats: body.allocatedSeats }).eq('id', poolId).select().single();
  if (error) return jsonResponse({ error: error.message }, 500);
  return jsonResponse({ success: true, pool: data });
}

// ── POST /license-pools/:id/auto-assignment ───────────────────────────────────

export async function handleConfigureAutoAssignment(req: Request, env: PaymentsEnv, poolId: string): Promise<Response> {
  const auth = await authenticateUser(req, env as any);
  if (!auth) return jsonResponse({ error: 'Unauthorized' }, 401);
  const supabase = adminClient(env);
  const body = await req.json() as { autoAssignNewMembers: boolean; assignmentCriteria?: Record<string, any> };
  const { data, error } = await supabase.from('license_pools')
    .update({ auto_assign_new_members: body.autoAssignNewMembers, assignment_criteria: body.assignmentCriteria ?? {} })
    .eq('id', poolId).select().single();
  if (error) return jsonResponse({ error: error.message }, 500);
  return jsonResponse({ success: true, pool: data });
}

// ── POST /license-assignments ─────────────────────────────────────────────────

export async function handleAssignLicense(req: Request, env: PaymentsEnv): Promise<Response> {
  const auth = await authenticateUser(req, env as any);
  if (!auth) return jsonResponse({ error: 'Unauthorized' }, 401);
  const supabase = adminClient(env);
  const body = await req.json() as { poolId: string; userId: string };
  const { poolId, userId: targetUserId } = body;
  if (!poolId || !targetUserId) return jsonResponse({ error: 'Missing poolId or userId' }, 400);

  const { data: pool } = await supabase.from('license_pools').select('*').eq('id', poolId).single();
  if (!pool) return jsonResponse({ error: 'Pool not found' }, 404);

  // Check available seats — matches old worker
  if (pool.available_seats <= 0) return jsonResponse({ error: 'No available seats in pool' }, 400);

  const { data: existing } = await supabase.from('license_assignments').select('id')
    .eq('user_id', targetUserId).eq('organization_subscription_id', pool.organization_subscription_id).eq('status', 'active').single();
  if (existing) return jsonResponse({ error: 'User already has an active license assignment' }, 400);

  const { data: assignment, error } = await supabase.from('license_assignments').insert({
    license_pool_id: poolId, organization_subscription_id: pool.organization_subscription_id,
    user_id: targetUserId, member_type: pool.member_type, status: 'active', assigned_by: auth.user.id,
  }).select().single();
  if (error) return jsonResponse({ error: error.message }, 500);
  return jsonResponse({ success: true, assignment }, 201);
}

// ── POST /license-assignments/bulk ────────────────────────────────────────────

export async function handleBulkAssignLicenses(req: Request, env: PaymentsEnv): Promise<Response> {
  const auth = await authenticateUser(req, env as any);
  if (!auth) return jsonResponse({ error: 'Unauthorized' }, 401);
  const supabase = adminClient(env);
  const body = await req.json() as { poolId: string; userIds: string[] };
  const { poolId, userIds } = body;
  if (!poolId || !Array.isArray(userIds) || !userIds.length) return jsonResponse({ error: 'Invalid poolId or userIds' }, 400);
  if (userIds.length > 100) return jsonResponse({ error: 'Batch size exceeds maximum allowed (100)' }, 400);

  const { data: pool } = await supabase.from('license_pools').select('*').eq('id', poolId).single();
  if (!pool) return jsonResponse({ error: 'Pool not found' }, 404);

  const successful: any[] = [];
  const failed: { userId: string; error: string }[] = [];

  for (const uid of userIds) {
    const { data: ex } = await supabase.from('license_assignments').select('id')
      .eq('user_id', uid).eq('organization_subscription_id', pool.organization_subscription_id).eq('status', 'active').single();
    if (ex) { failed.push({ userId: uid, error: 'Already has active assignment' }); continue; }
    const { data: a, error: ae } = await supabase.from('license_assignments').insert({
      license_pool_id: poolId, organization_subscription_id: pool.organization_subscription_id,
      user_id: uid, member_type: pool.member_type, status: 'active', assigned_by: auth.user.id,
    }).select().single();
    if (ae) failed.push({ userId: uid, error: ae.message });
    else successful.push(a);
  }

  return jsonResponse({ success: true, successful, failed, summary: { total: userIds.length, successful: successful.length, failed: failed.length } });
}

// ── DELETE /license-assignments/:id ──────────────────────────────────────────

export async function handleUnassignLicense(req: Request, env: PaymentsEnv, assignmentId: string): Promise<Response> {
  const auth = await authenticateUser(req, env as any);
  if (!auth) return jsonResponse({ error: 'Unauthorized' }, 401);
  const supabase = adminClient(env);
  const body = await req.json() as { reason: string };
  if (!body.reason) return jsonResponse({ error: 'Revocation reason is required' }, 400);
  const { error } = await supabase.from('license_assignments')
    .update({ status: 'revoked', revoked_at: new Date().toISOString(), revoked_by: auth.user.id, revocation_reason: body.reason })
    .eq('id', assignmentId);
  if (error) return jsonResponse({ error: error.message }, 500);
  return jsonResponse({ success: true });
}

// ── POST /license-assignments/transfer ───────────────────────────────────────

export async function handleTransferLicense(req: Request, env: PaymentsEnv): Promise<Response> {
  const auth = await authenticateUser(req, env as any);
  if (!auth) return jsonResponse({ error: 'Unauthorized' }, 401);
  const supabase = adminClient(env);
  const body = await req.json() as { fromUserId: string; toUserId: string; poolId: string };
  const { fromUserId, toUserId, poolId } = body;
  if (!fromUserId || !toUserId || !poolId) return jsonResponse({ error: 'Missing required fields' }, 400);

  const now = new Date().toISOString();
  await supabase.from('license_assignments')
    .update({ status: 'revoked', revoked_at: now, revoked_by: auth.user.id, revocation_reason: 'transfer' })
    .eq('user_id', fromUserId).eq('license_pool_id', poolId).eq('status', 'active');

  const { data: pool } = await supabase.from('license_pools').select('*').eq('id', poolId).single();
  if (!pool) return jsonResponse({ error: 'Pool not found' }, 404);

  const { data: assignment, error } = await supabase.from('license_assignments').insert({
    license_pool_id: poolId, organization_subscription_id: pool.organization_subscription_id,
    user_id: toUserId, member_type: pool.member_type, status: 'active', assigned_by: auth.user.id,
  }).select().single();
  if (error) return jsonResponse({ error: error.message }, 500);
  return jsonResponse({ success: true, assignment });
}

// ── GET /license-assignments/user/:userId ─────────────────────────────────────

export async function handleGetUserAssignments(req: Request, env: PaymentsEnv, targetUserId: string): Promise<Response> {
  const auth = await authenticateUser(req, env as any);
  if (!auth) return jsonResponse({ error: 'Unauthorized' }, 401);
  const supabase = adminClient(env);
  const { data, error } = await supabase.from('license_assignments').select('*')
    .eq('user_id', targetUserId).eq('status', 'active');
  if (error) return jsonResponse({ error: error.message }, 500);
  return jsonResponse({ success: true, assignments: data });
}

// ── GET /org-billing/dashboard ────────────────────────────────────────────────

export async function handleGetBillingDashboard(req: Request, env: PaymentsEnv): Promise<Response> {
  const auth = await authenticateUser(req, env as any);
  if (!auth) return jsonResponse({ error: 'Unauthorized' }, 401);
  const supabase = adminClient(env);
  const url = new URL(req.url);
  const organizationId = url.searchParams.get('organizationId');
  const organizationType = url.searchParams.get('organizationType');
  if (!organizationId || !organizationType) return jsonResponse({ error: 'Missing organizationId or organizationType' }, 400);

  const [subsResult, paymentsResult] = await Promise.all([
    supabase.from('organization_subscriptions')
      .select('*, subscription_plans(id, name, price_monthly, price_yearly)')
      .eq('organization_id', organizationId).eq('organization_type', organizationType)
      .in('status', ['active', 'grace_period']),
    supabase.from('payment_transactions').select('*')
      .eq('organization_id', organizationId).order('created_at', { ascending: false }).limit(20),
  ]);

  const subscriptions = subsResult.data ?? [];
  const payments = paymentsResult.data ?? [];
  const now = new Date();

  let subscriptionCosts = 0, totalActiveSeats = 0, totalAssignedSeats = 0;
  const subscriptionSummaries = subscriptions.map((sub: any) => {
    const finalAmount = parseFloat(sub.final_amount);
    const durationDays = Math.ceil((new Date(sub.end_date).getTime() - new Date(sub.start_date).getTime()) / 86_400_000);
    const monthlyCost = durationDays > 60 ? finalAmount / 12 : finalAmount;
    subscriptionCosts += monthlyCost;
    totalActiveSeats += sub.total_seats;
    totalAssignedSeats += sub.assigned_seats;
    return {
      subscriptionId: sub.id, planId: sub.subscription_plan_id,
      planName: sub.subscription_plans?.name || 'Unknown Plan',
      seatCount: sub.total_seats, assignedSeats: sub.assigned_seats,
      utilization: sub.total_seats > 0 ? Math.round((sub.assigned_seats / sub.total_seats) * 100) : 0,
      monthlyCost, status: sub.status, endDate: sub.end_date,
    };
  });

  const thirtyDaysFromNow = new Date(now); thirtyDaysFromNow.setDate(thirtyDaysFromNow.getDate() + 30);
  const upcomingRenewals = subscriptions
    .filter((sub: any) => new Date(sub.end_date) <= thirtyDaysFromNow && sub.status === 'active')
    .map((sub: any) => ({
      subscriptionId: sub.id, planName: sub.subscription_plans?.name || 'Unknown Plan',
      renewalDate: sub.end_date, estimatedCost: parseFloat(sub.final_amount),
      seatCount: sub.total_seats, autoRenew: sub.auto_renew,
    }));

  const paymentHistory = payments.map((p: any) => ({
    id: p.id, transactionId: p.razorpay_payment_id || p.id,
    amount: parseFloat(p.amount), currency: p.currency || 'INR',
    status: p.status, paymentMethod: p.payment_method || 'unknown',
    description: p.description || 'Subscription payment', createdAt: p.created_at, invoiceId: p.invoice_id,
  }));

  const periodStart = new Date(now.getFullYear(), now.getMonth(), 1);
  const periodEnd = new Date(now.getFullYear(), now.getMonth() + 1, 0);

  const dashboard = {
    organizationId, organizationType,
    currentPeriod: { startDate: periodStart.toISOString(), endDate: periodEnd.toISOString(), totalCost: subscriptionCosts, subscriptionCosts, addonCosts: 0 },
    subscriptions: subscriptionSummaries, addons: [], upcomingRenewals, paymentHistory,
    totalActiveSeats, totalAssignedSeats,
    overallUtilization: totalActiveSeats > 0 ? Math.round((totalAssignedSeats / totalActiveSeats) * 100) : 0,
  };

  return jsonResponse({ success: true, dashboard });
}

// ── GET /org-billing/invoices ─────────────────────────────────────────────────

export async function handleGetInvoiceHistory(req: Request, env: PaymentsEnv): Promise<Response> {
  const auth = await authenticateUser(req, env as any);
  if (!auth) return jsonResponse({ error: 'Unauthorized' }, 401);
  const supabase = adminClient(env);
  const url = new URL(req.url);
  const organizationId = url.searchParams.get('organizationId');
  const limit = parseInt(url.searchParams.get('limit') || '50');
  if (!organizationId) return jsonResponse({ error: 'Missing organizationId' }, 400);

  const { data: transactions, error } = await supabase.from('payment_transactions').select('*')
    .eq('organization_id', organizationId).eq('status', 'success')
    .order('created_at', { ascending: false }).limit(limit);
  if (error) return jsonResponse({ error: error.message }, 500);

  // Build invoice objects matching old worker shape
  const invoices = (transactions ?? []).map((tx: any, index: number) => {
    const amount = parseFloat(tx.amount);
    const taxAmount = amount * 0.18 / 1.18;
    const baseAmount = amount - taxAmount;
    return {
      id: tx.invoice_id || 'inv_' + tx.id,
      invoiceNumber: 'INV-' + new Date(tx.created_at).getFullYear() + '-' + String(index + 1).padStart(5, '0'),
      organizationId: tx.organization_id,
      transactionId: tx.id,
      amount: baseAmount, taxAmount, totalAmount: amount,
      currency: tx.currency || 'INR', status: 'paid',
      issueDate: tx.created_at, paidDate: tx.created_at,
      lineItems: [{ description: tx.description || 'Subscription Payment', quantity: tx.seat_count || 1, unitPrice: baseAmount / (tx.seat_count || 1), amount: baseAmount, taxRate: 18, taxAmount }],
      createdAt: tx.created_at,
    };
  });

  return jsonResponse({ success: true, invoices });
}

// ── GET /org-billing/invoice/:id/download ────────────────────────────────────

export async function handleDownloadInvoice(req: Request, env: PaymentsEnv, invoiceId: string): Promise<Response> {
  const auth = await authenticateUser(req, env as any);
  if (!auth) return jsonResponse({ error: 'Unauthorized' }, 401);
  const supabase = adminClient(env);

  const { data: tx } = await supabase.from('payment_transactions').select('*').eq('id', invoiceId).single();
  if (!tx) return jsonResponse({ error: 'Invoice not found' }, 404);

  // Return invoice data as JSON (PDF generation would require pdf-lib which is not available here)
  return jsonResponse({ success: true, invoice: tx });
}

// ── GET /org-billing/cost-projection ─────────────────────────────────────────

export async function handleGetCostProjection(req: Request, env: PaymentsEnv): Promise<Response> {
  const auth = await authenticateUser(req, env as any);
  if (!auth) return jsonResponse({ error: 'Unauthorized' }, 401);
  const supabase = adminClient(env);
  const url = new URL(req.url);
  const organizationId = url.searchParams.get('organizationId');
  const organizationType = url.searchParams.get('organizationType');
  if (!organizationId || !organizationType) return jsonResponse({ error: 'Missing organizationId or organizationType' }, 400);

  const { data: subs } = await supabase.from('organization_subscriptions')
    .select('final_amount, start_date, end_date')
    .eq('organization_id', organizationId).eq('organization_type', organizationType).eq('status', 'active');

  let subscriptionCost = 0;
  (subs ?? []).forEach((s: any) => {
    const days = Math.ceil((new Date(s.end_date).getTime() - new Date(s.start_date).getTime()) / 86_400_000);
    subscriptionCost += days > 60 ? parseFloat(s.final_amount) / 12 : parseFloat(s.final_amount);
  });

  const taxes = subscriptionCost * 0.18;
  const total = subscriptionCost + taxes;
  return jsonResponse({ success: true, projection: { currentMonthlyCost: total, projectedMonthlyCost: total, projectedAnnualCost: total * 12, breakdown: { subscriptions: subscriptionCost, addons: 0, taxes } } });
}

// ── POST /org-billing/calculate-seat-addition ─────────────────────────────────

export async function handleCalculateSeatAdditionCost(req: Request, env: PaymentsEnv): Promise<Response> {
  const auth = await authenticateUser(req, env as any);
  if (!auth) return jsonResponse({ error: 'Unauthorized' }, 401);
  const supabase = adminClient(env);
  const body = await req.json() as { subscriptionId: string; additionalSeats: number };
  const { subscriptionId, additionalSeats } = body;
  if (!subscriptionId || !additionalSeats || additionalSeats < 1) return jsonResponse({ error: 'Invalid subscriptionId or additionalSeats' }, 400);

  const { data: sub } = await supabase.from('organization_subscriptions').select('*').eq('id', subscriptionId).single();
  if (!sub) return jsonResponse({ error: 'Subscription not found' }, 404);

  const pricing = calcBulkPricing(sub.price_per_seat, additionalSeats);
  const endDate = new Date(sub.end_date);
  const now = new Date();
  const totalDays = Math.ceil((endDate.getTime() - new Date(sub.start_date).getTime()) / 86_400_000);
  const remainingDays = Math.ceil((endDate.getTime() - now.getTime()) / 86_400_000);
  const proratedCost = Math.round((pricing.finalAmount / totalDays) * remainingDays * 100) / 100;

  // Matches old worker response shape: { success, calculation }
  return jsonResponse({ success: true, calculation: {
    additionalSeats, pricePerSeat: sub.price_per_seat,
    subtotal: pricing.subtotal, newDiscountPercentage: pricing.discountPercentage,
    discountAmount: pricing.discountAmount, taxAmount: pricing.taxAmount,
    totalCost: pricing.finalAmount, proratedDays: remainingDays, proratedCost,
  }});
}

// ── POST /org-invitations ─────────────────────────────────────────────────────

function generateSecureToken(): string {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  let token = '';
  for (let i = 0; i < 64; i++) {
    token += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return token;
}

export async function handleInviteMember(req: Request, env: PaymentsEnv): Promise<Response> {
  const auth = await authenticateUser(req, env as any);
  if (!auth) return jsonResponse({ error: 'Unauthorized' }, 401);
  const supabase = adminClient(env);
  const body = await req.json() as {
    organizationId: string; organizationType: string; email: string;
    memberType: string; autoAssignSubscription?: boolean; licensePoolId?: string; invitationMessage?: string;
  };
  const { organizationId, organizationType, email, memberType, autoAssignSubscription, licensePoolId, invitationMessage } = body;
  if (!organizationId || !email || !memberType) return jsonResponse({ error: 'Missing required fields' }, 400);

  // Check for existing pending invitation
  const { data: existing } = await supabase.from('organization_invitations').select('id')
    .eq('organization_id', organizationId).eq('email', email.toLowerCase()).eq('status', 'pending').single();
  if (existing) return jsonResponse({ error: 'An invitation is already pending for this email' }, 400);

  const invitationToken = generateSecureToken();
  const expiresAt = new Date(); expiresAt.setDate(expiresAt.getDate() + 7);

  const { data, error } = await supabase.from('organization_invitations').insert({
    organization_id: organizationId, organization_type: organizationType,
    email: email.toLowerCase(), member_type: memberType, invited_by: auth.user.id,
    auto_assign_subscription: autoAssignSubscription ?? false,
    target_license_pool_id: licensePoolId ?? null,
    status: 'pending', invitation_token: invitationToken,
    expires_at: expiresAt.toISOString(),
    invitation_message: invitationMessage ?? null,
  }).select().single();
  if (error) return jsonResponse({ error: error.message }, 500);
  return jsonResponse({ success: true, invitation: data }, 201);
}

// ── GET /org-invitations ──────────────────────────────────────────────────────

export async function handleGetInvitations(req: Request, env: PaymentsEnv): Promise<Response> {
  const auth = await authenticateUser(req, env as any);
  if (!auth) return jsonResponse({ error: 'Unauthorized' }, 401);
  const supabase = adminClient(env);
  const url = new URL(req.url);
  const organizationId = url.searchParams.get('organizationId');
  const status = url.searchParams.get('status');
  const memberType = url.searchParams.get('memberType');
  const limit = parseInt(url.searchParams.get('limit') || '50');
  if (!organizationId) return jsonResponse({ error: 'Missing organizationId' }, 400);

  let query = supabase.from('organization_invitations').select('*')
    .eq('organization_id', organizationId).order('created_at', { ascending: false }).limit(limit);
  if (status) query = query.eq('status', status);
  if (memberType) query = query.eq('member_type', memberType);

  const { data, error } = await query;
  if (error) return jsonResponse({ error: error.message }, 500);
  return jsonResponse({ success: true, invitations: data });
}

// ── POST /org-invitations/bulk ────────────────────────────────────────────────

export async function handleBulkInviteMembers(req: Request, env: PaymentsEnv): Promise<Response> {
  const auth = await authenticateUser(req, env as any);
  if (!auth) return jsonResponse({ error: 'Unauthorized' }, 401);
  const supabase = adminClient(env);

  const body = await req.json() as {
    invitations?: Array<{
      organizationId: string; organizationType: string; email: string;
      memberType: string; autoAssignSubscription: boolean; licensePoolId?: string;
    }>;
    // Also support simplified shape for backward compat
    organizationId?: string; organizationType?: string; emails?: string[]; role?: string; poolId?: string;
  };

  // Support both old worker shape { invitations: [...] } and simplified shape
  let invitationList: Array<{ organizationId: string; organizationType: string; email: string; memberType: string; autoAssignSubscription: boolean; licensePoolId?: string }>;

  if (body.invitations && Array.isArray(body.invitations)) {
    invitationList = body.invitations;
  } else if (body.emails && body.organizationId) {
    invitationList = body.emails.map(email => ({
      organizationId: body.organizationId!, organizationType: body.organizationType || 'school',
      email, memberType: body.role || 'student', autoAssignSubscription: false, licensePoolId: body.poolId,
    }));
  } else {
    return jsonResponse({ error: 'Invalid invitations array' }, 400);
  }

  if (!invitationList.length) return jsonResponse({ error: 'Invalid invitations array' }, 400);
  if (invitationList.length > 50) return jsonResponse({ error: 'Batch size exceeds maximum (50)' }, 400);

  const successful: any[] = [];
  const failed: { email: string; error: string }[] = [];

  for (const inv of invitationList) {
    try {
      const { data: existing } = await supabase.from('organization_invitations').select('id')
        .eq('organization_id', inv.organizationId).eq('email', inv.email.toLowerCase()).eq('status', 'pending').single();
      if (existing) { failed.push({ email: inv.email, error: 'Invitation already pending' }); continue; }

      const invitationToken = generateSecureToken();
      const expiresAt = new Date(); expiresAt.setDate(expiresAt.getDate() + 7);

      const { data: invitation, error } = await supabase.from('organization_invitations').insert({
        organization_id: inv.organizationId, organization_type: inv.organizationType,
        email: inv.email.toLowerCase(), member_type: inv.memberType, invited_by: auth.user.id,
        auto_assign_subscription: inv.autoAssignSubscription ?? false,
        target_license_pool_id: inv.licensePoolId ?? null,
        status: 'pending', invitation_token: invitationToken, expires_at: expiresAt.toISOString(),
      }).select().single();

      if (error) failed.push({ email: inv.email, error: error.message });
      else successful.push(invitation);
    } catch (e: any) {
      failed.push({ email: inv.email, error: e.message || 'Unknown error' });
    }
  }

  return jsonResponse({ success: true, successful, failed, summary: { total: invitationList.length, successful: successful.length, failed: failed.length } });
}

// ── POST /org-invitations/accept ──────────────────────────────────────────────

export async function handleAcceptInvitation(req: Request, env: PaymentsEnv): Promise<Response> {
  const auth = await authenticateUser(req, env as any);
  if (!auth) return jsonResponse({ error: 'Unauthorized' }, 401);
  const supabase = adminClient(env);
  const body = await req.json() as { token: string };
  if (!body.token) return jsonResponse({ error: 'Missing invitation token' }, 400);

  // Look up by invitation_token (matches old worker DB column)
  const { data: invitation } = await supabase.from('organization_invitations').select('*')
    .eq('invitation_token', body.token).eq('status', 'pending').single();

  if (!invitation) return jsonResponse({ error: 'Invalid or expired invitation' }, 404);

  // Check expiry
  if (new Date(invitation.expires_at) < new Date()) {
    await supabase.from('organization_invitations').update({ status: 'expired' }).eq('id', invitation.id);
    return jsonResponse({ error: 'Invitation has expired' }, 400);
  }

  const { error: updateError } = await supabase.from('organization_invitations')
    .update({ status: 'accepted', accepted_at: new Date().toISOString(), accepted_by: auth.user.id, updated_at: new Date().toISOString() })
    .eq('id', invitation.id);
  if (updateError) return jsonResponse({ error: 'Failed to accept invitation' }, 500);

  // Auto-assign license if configured — matches old worker
  let assignedLicense = null;
  if (invitation.auto_assign_subscription && invitation.target_license_pool_id) {
    try {
      const { data: pool } = await supabase.from('license_pools').select('*')
        .eq('id', invitation.target_license_pool_id).single();
      if (pool && pool.available_seats > 0) {
        const { data: assignment } = await supabase.from('license_assignments').insert({
          license_pool_id: invitation.target_license_pool_id,
          organization_subscription_id: pool.organization_subscription_id,
          user_id: auth.user.id, member_type: invitation.member_type,
          status: 'active', assigned_by: invitation.invited_by,
        }).select().single();
        assignedLicense = assignment;
      }
    } catch (e) { console.warn('Could not auto-assign license:', e); }
  }

  return jsonResponse({ success: true, invitation: { ...invitation, status: 'accepted' }, assignedLicense });
}

// ── GET /org-invitations/stats ────────────────────────────────────────────────

export async function handleGetInvitationStats(req: Request, env: PaymentsEnv): Promise<Response> {
  const auth = await authenticateUser(req, env as any);
  if (!auth) return jsonResponse({ error: 'Unauthorized' }, 401);
  const supabase = adminClient(env);
  const url = new URL(req.url);
  const organizationId = url.searchParams.get('organizationId');
  if (!organizationId) return jsonResponse({ error: 'Missing organizationId' }, 400);

  const { data } = await supabase.from('organization_invitations').select('status')
    .eq('organization_id', organizationId);

  const stats = (data ?? []).reduce((acc: Record<string, number>, row: any) => {
    acc[row.status] = (acc[row.status] ?? 0) + 1;
    return acc;
  }, {});

  return jsonResponse({ success: true, stats });
}

// ── PUT /org-invitations/:id/resend ──────────────────────────────────────────

export async function handleResendInvitation(req: Request, env: PaymentsEnv, invitationId: string): Promise<Response> {
  const auth = await authenticateUser(req, env as any);
  if (!auth) return jsonResponse({ error: 'Unauthorized' }, 401);
  const supabase = adminClient(env);

  const { data: invitation } = await supabase.from('organization_invitations').select('*').eq('id', invitationId).single();
  if (!invitation) return jsonResponse({ error: 'Invitation not found' }, 404);
  if (invitation.status !== 'pending') return jsonResponse({ error: 'Can only resend pending invitations' }, 400);

  const newToken = generateSecureToken();
  const newExpiresAt = new Date(); newExpiresAt.setDate(newExpiresAt.getDate() + 7);

  const { data, error } = await supabase.from('organization_invitations')
    .update({ invitation_token: newToken, expires_at: newExpiresAt.toISOString(), updated_at: new Date().toISOString() })
    .eq('id', invitationId).select().single();
  if (error) return jsonResponse({ error: error.message }, 500);
  return jsonResponse({ success: true, message: 'Invitation resent successfully', invitation: data });
}

// ── DELETE /org-invitations/:id ───────────────────────────────────────────────

export async function handleCancelInvitation(req: Request, env: PaymentsEnv, invitationId: string): Promise<Response> {
  const auth = await authenticateUser(req, env as any);
  if (!auth) return jsonResponse({ error: 'Unauthorized' }, 401);
  const supabase = adminClient(env);
  const { error } = await supabase.from('organization_invitations')
    .update({ status: 'cancelled', updated_at: new Date().toISOString() })
    .eq('id', invitationId).eq('status', 'pending');
  if (error) return jsonResponse({ error: error.message }, 500);
  return jsonResponse({ success: true, message: 'Invitation cancelled successfully' });
}

// ── POST /verify-org-payment ──────────────────────────────────────────────────

export async function handleVerifyOrgPayment(req: Request, env: PaymentsEnv): Promise<Response> {
  const auth = await authenticateUser(req, env as any);
  if (!auth) return jsonResponse({ error: 'Unauthorized' }, 401);
  const supabase = adminClient(env);

  const body = await req.json() as {
    razorpay_order_id: string; razorpay_payment_id: string; razorpay_signature: string;
    purchaseData: {
      organizationId: string; organizationType: string; planId: string; planName: string;
      seatCount: number; targetMemberType: string; billingCycle: string; autoRenew: boolean;
      pricing: { basePrice: number; subtotal: number; discountPercentage: number; discountAmount: number; taxAmount: number; finalAmount: number };
      assignmentMode?: string; poolName?: string; autoAssignNewMembers?: boolean;
      billingEmail: string; billingName: string;
    };
  };
  const { razorpay_order_id, razorpay_payment_id, razorpay_signature, purchaseData } = body;
  if (!razorpay_order_id || !razorpay_payment_id || !razorpay_signature || !purchaseData) {
    return jsonResponse({ error: 'Missing required fields' }, 400);
  }

  const verifyRes = await callWorker(env, '/verify-payment', 'POST', { razorpay_order_id, razorpay_payment_id, razorpay_signature });
  const verifyData = await verifyRes.json() as any;
  if (!verifyRes.ok || !verifyData.verified) return jsonResponse({ error: 'Invalid payment signature' }, 400);

  // Resolve plan UUID if plan_code was passed
  let subscriptionPlanId = purchaseData.planId;
  const uuidRe = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
  if (!uuidRe.test(purchaseData.planId)) {
    const { data: pr } = await supabase.from('subscription_plans').select('id').eq('plan_code', purchaseData.planId).eq('is_active', true).single();
    if (!pr) return jsonResponse({ error: `Plan '${purchaseData.planId}' not found` }, 400);
    subscriptionPlanId = pr.id;
  }

  const now = new Date();
  const endDate = new Date(now);
  if (purchaseData.billingCycle === 'annual') endDate.setFullYear(endDate.getFullYear() + 1);
  else endDate.setMonth(endDate.getMonth() + 1);

  const { data: subscription, error: subError } = await supabase.from('organization_subscriptions').insert({
    organization_id: purchaseData.organizationId, organization_type: purchaseData.organizationType,
    subscription_plan_id: subscriptionPlanId, purchased_by: auth.user.id,
    total_seats: purchaseData.seatCount, assigned_seats: 0,
    target_member_type: purchaseData.targetMemberType, status: 'active',
    start_date: now.toISOString(), end_date: endDate.toISOString(), auto_renew: purchaseData.autoRenew,
    price_per_seat: purchaseData.pricing.basePrice, total_amount: purchaseData.pricing.subtotal,
    discount_percentage: purchaseData.pricing.discountPercentage, final_amount: purchaseData.pricing.finalAmount,
    razorpay_order_id, razorpay_payment_id,
  }).select().single();

  if (subError) return jsonResponse({ error: subError.message }, 500);

  if (purchaseData.assignmentMode === 'create-pool' && purchaseData.poolName) {
    await supabase.from('license_pools').insert({
      organization_id: purchaseData.organizationId, organization_type: purchaseData.organizationType,
      organization_subscription_id: subscription.id, pool_name: purchaseData.poolName,
      member_type: purchaseData.targetMemberType === 'both' ? 'student' : purchaseData.targetMemberType,
      allocated_seats: purchaseData.seatCount, assigned_seats: 0,
      auto_assign_new_members: purchaseData.autoAssignNewMembers ?? false,
      is_active: true, created_by: auth.user.id,
    });
  }

  await supabase.from('payment_transactions').insert({
    user_id: auth.user.id, razorpay_order_id, razorpay_payment_id,
    amount: purchaseData.pricing.finalAmount, currency: 'INR', status: 'success',
    transaction_type: 'organization_subscription',
    metadata: { organization_id: purchaseData.organizationId, seat_count: purchaseData.seatCount, subscription_id: subscription.id },
  });

  await supabase.from('razorpay_orders').update({ status: 'paid', razorpay_payment_id }).eq('order_id', razorpay_order_id);

  return jsonResponse({ success: true, subscription, message: 'Organization subscription created successfully' });
}

// ── POST /create-org-order ────────────────────────────────────────────────────

export async function handleCreateOrgOrder(req: Request, env: PaymentsEnv): Promise<Response> {
  const auth = await authenticateUser(req, env as any);
  if (!auth) return jsonResponse({ error: 'Unauthorized' }, 401);
  const supabase = adminClient(env);

  const body = await req.json() as {
    amount: number; currency?: string; organizationId: string; organizationType: string;
    planId: string; planName: string; seatCount: number; targetMemberType?: string;
    billingCycle?: string; billingEmail: string; billingName?: string;
  };
  const { amount, currency = 'INR', organizationId, organizationType, planId, planName, seatCount, targetMemberType, billingCycle, billingEmail, billingName } = body;
  if (!amount || !organizationId || !planId || !planName || !seatCount || !billingEmail) {
    return jsonResponse({ error: 'Missing required fields' }, 400);
  }

  const workerRes = await callWorker(env, '/create-order', 'POST', {
    amount, currency, receipt: `org_${Date.now()}_${organizationId.slice(0, 8)}`,
    notes: { user_id: auth.user.id, organization_id: organizationId, organization_type: organizationType, plan_id: planId, plan_name: planName, seat_count: String(seatCount), target_member_type: targetMemberType, billing_cycle: billingCycle, billing_email: billingEmail, billing_name: billingName, order_type: 'organization_subscription' },
  });
  const workerData = await workerRes.json() as any;
  if (!workerRes.ok || !workerData.success) return jsonResponse({ error: workerData.error?.message || 'Failed to create order' }, 502);

  const { order, key_id } = workerData;
  await supabase.from('razorpay_orders').insert({
    user_id: auth.user.id, order_id: order.id, amount: order.amount, currency: order.currency,
    receipt: order.receipt, status: 'created', plan_id: planId, plan_name: planName,
    user_email: billingEmail, user_name: billingName ?? null,
  });

  return jsonResponse({ success: true, id: order.id, amount: order.amount, currency: order.currency, receipt: order.receipt, key: key_id });
}
