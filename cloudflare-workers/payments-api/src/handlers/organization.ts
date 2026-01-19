/**
 * Organization Subscription Handlers
 * 
 * Handles organization-level subscription management endpoints:
 * - Purchase organization subscriptions with volume discounts
 * - Manage license pools and assignments
 * - Handle bulk operations
 * - Manage organization entitlements
 */

import { SupabaseClient } from '@supabase/supabase-js';
import type { Env } from '../index';

// ============================================================================
// Rate Limiting
// ============================================================================

interface RateLimitConfig {
  maxRequests: number;      // Maximum requests allowed
  windowMs: number;         // Time window in milliseconds
  maxBatchSize?: number;    // Maximum items per batch (for bulk operations)
}

const RATE_LIMITS: Record<string, RateLimitConfig> = {
  bulkAssignLicenses: { maxRequests: 10, windowMs: 60000, maxBatchSize: 100 },
  bulkInviteMembers: { maxRequests: 5, windowMs: 60000, maxBatchSize: 50 },
  purchaseSubscription: { maxRequests: 5, windowMs: 60000 },
};

// In-memory rate limit store (resets on worker restart)
// For production, consider using Cloudflare KV or Durable Objects
const rateLimitStore = new Map<string, { count: number; resetTime: number }>();

/**
 * Check rate limit for a user/operation combination
 * Returns true if request is allowed, false if rate limited
 */
function checkRateLimit(userId: string, operation: string): { allowed: boolean; retryAfter?: number } {
  const config = RATE_LIMITS[operation];
  if (!config) return { allowed: true };

  const key = `${userId}:${operation}`;
  const now = Date.now();
  const entry = rateLimitStore.get(key);

  if (!entry || now > entry.resetTime) {
    // First request or window expired - reset counter
    rateLimitStore.set(key, { count: 1, resetTime: now + config.windowMs });
    return { allowed: true };
  }

  if (entry.count >= config.maxRequests) {
    // Rate limit exceeded
    const retryAfter = Math.ceil((entry.resetTime - now) / 1000);
    return { allowed: false, retryAfter };
  }

  // Increment counter
  entry.count++;
  return { allowed: true };
}

/**
 * Validate batch size for bulk operations
 */
function validateBatchSize(operation: string, batchSize: number): { valid: boolean; maxSize?: number } {
  const config = RATE_LIMITS[operation];
  if (!config?.maxBatchSize) return { valid: true };

  if (batchSize > config.maxBatchSize) {
    return { valid: false, maxSize: config.maxBatchSize };
  }
  return { valid: true };
}

/**
 * Create rate limit error response
 */
function rateLimitResponse(retryAfter: number): Response {
  return new Response(
    JSON.stringify({ 
      error: 'Rate limit exceeded. Please try again later.',
      retryAfter 
    }),
    { 
      status: 429,
      headers: {
        'Content-Type': 'application/json',
        'Retry-After': String(retryAfter)
      }
    }
  );
}

/**
 * Create batch size error response
 */
function batchSizeResponse(maxSize: number): Response {
  return new Response(
    JSON.stringify({ 
      error: `Batch size exceeds maximum allowed (${maxSize}). Please split your request.`,
      maxBatchSize: maxSize
    }),
    { status: 400 }
  );
}

// ============================================================================
// Validation Helpers
// ============================================================================

const VALID_ORGANIZATION_TYPES = ['school', 'college', 'university'] as const;
const VALID_MEMBER_TYPES = ['educator', 'student', 'both'] as const;
const VALID_BILLING_CYCLES = ['monthly', 'annual'] as const;

/**
 * Validate email format
 */
function isValidEmail(email: string): boolean {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
}

/**
 * Validate organization type
 */
function isValidOrganizationType(type: string): type is 'school' | 'college' | 'university' {
  return VALID_ORGANIZATION_TYPES.includes(type as any);
}

/**
 * Validate member type
 */
function isValidMemberType(type: string): type is 'educator' | 'student' | 'both' {
  return VALID_MEMBER_TYPES.includes(type as any);
}

/**
 * Validate billing cycle
 */
function isValidBillingCycle(cycle: string): cycle is 'monthly' | 'annual' {
  return VALID_BILLING_CYCLES.includes(cycle as any);
}

/**
 * Validate UUID format
 */
function isValidUUID(id: string): boolean {
  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
  return uuidRegex.test(id);
}

/**
 * Create validation error response
 */
function validationErrorResponse(errors: string[]): Response {
  return new Response(
    JSON.stringify({ 
      error: 'Validation failed',
      details: errors
    }),
    { status: 400 }
  );
}

// ============================================================================
// Types
// ============================================================================

interface OrganizationSubscriptionRequest {
  organizationId: string;
  organizationType: 'school' | 'college' | 'university';
  planId: string;
  seatCount: number;
  targetMemberType: 'educator' | 'student' | 'both';
  billingCycle: 'monthly' | 'annual';
  autoRenew: boolean;
}

interface LicensePoolRequest {
  organizationSubscriptionId: string;
  organizationId: string;
  organizationType: 'school' | 'college' | 'university';
  poolName: string;
  memberType: 'educator' | 'student';
  allocatedSeats: number;
  autoAssignNewMembers?: boolean;
  assignmentCriteria?: Record<string, any>;
}

interface LicenseAssignmentRequest {
  poolId: string;
  userId: string;
}

interface BulkAssignmentRequest {
  poolId: string;
  userIds: string[];
}

// ============================================================================
// Volume Discount Calculation
// ============================================================================

function calculateVolumeDiscount(seatCount: number): number {
  if (seatCount >= 500) return 30;
  if (seatCount >= 100) return 20;
  if (seatCount >= 50) return 10;
  return 0;
}

function calculateBulkPricing(basePricePerSeat: number, seatCount: number) {
  const subtotal = basePricePerSeat * seatCount;
  const discountPercentage = calculateVolumeDiscount(seatCount);
  const discountAmount = (subtotal * discountPercentage) / 100;
  const afterDiscount = subtotal - discountAmount;
  const taxAmount = afterDiscount * 0.18; // 18% GST
  const finalAmount = afterDiscount + taxAmount;
  
  return {
    basePrice: basePricePerSeat,
    seatCount,
    subtotal,
    discountPercentage,
    discountAmount,
    taxAmount,
    finalAmount,
    pricePerSeat: finalAmount / seatCount
  };
}

// ============================================================================
// Organization Subscription Endpoints
// ============================================================================

/**
 * POST /org-subscriptions/calculate-pricing
 * Calculate pricing with volume discounts before purchase
 */
export async function handleCalculateOrgPricing(
  request: Request,
  env: Env,
  supabase: SupabaseClient,
  userId: string
): Promise<Response> {
  try {
    const body = await request.json() as { planId: string; seatCount: number; billingCycle?: 'monthly' | 'annual' };
    const { planId, seatCount, billingCycle = 'monthly' } = body;

    if (!planId || !seatCount || seatCount < 1) {
      return new Response(JSON.stringify({ error: 'Invalid planId or seatCount' }), { status: 400 });
    }

    // Get plan details
    const { data: plan, error: planError } = await supabase
      .from('subscription_plans')
      .select('price_monthly, price_yearly')
      .eq('id', planId)
      .single();

    if (planError || !plan) {
      return new Response(JSON.stringify({ error: 'Plan not found' }), { status: 404 });
    }

    // Use price_monthly or price_yearly based on billing cycle
    const basePrice = billingCycle === 'annual' ? plan.price_yearly : plan.price_monthly;
    const pricing = calculateBulkPricing(basePrice, seatCount);

    return new Response(JSON.stringify({ success: true, pricing }), { status: 200 });
  } catch (error) {
    console.error('Error calculating pricing:', error);
    return new Response(JSON.stringify({ error: 'Failed to calculate pricing' }), { status: 500 });
  }
}

/**
 * POST /org-subscriptions/purchase
 * Purchase organization subscription with Razorpay integration
 * Rate limited: 5 requests per minute
 */
export async function handlePurchaseOrgSubscription(
  request: Request,
  env: Env,
  supabase: SupabaseClient,
  userId: string
): Promise<Response> {
  try {
    // Check rate limit
    const rateCheck = checkRateLimit(userId, 'purchaseSubscription');
    if (!rateCheck.allowed) {
      return rateLimitResponse(rateCheck.retryAfter!);
    }

    const body = await request.json() as OrganizationSubscriptionRequest;
    const { organizationId, organizationType, planId, seatCount, targetMemberType, billingCycle, autoRenew } = body;

    // Validate required fields
    if (!organizationId || !organizationType || !planId || !seatCount || !targetMemberType || !billingCycle) {
      return new Response(JSON.stringify({ error: 'Missing required fields' }), { status: 400 });
    }

    // Validate field formats and values
    const validationErrors: string[] = [];
    
    if (!isValidUUID(organizationId)) {
      validationErrors.push('Invalid organizationId format');
    }
    if (!isValidOrganizationType(organizationType)) {
      validationErrors.push(`Invalid organizationType. Must be one of: ${VALID_ORGANIZATION_TYPES.join(', ')}`);
    }
    if (!isValidUUID(planId)) {
      validationErrors.push('Invalid planId format');
    }
    if (typeof seatCount !== 'number' || seatCount < 1 || seatCount > 10000) {
      validationErrors.push('seatCount must be a number between 1 and 10000');
    }
    if (!isValidMemberType(targetMemberType)) {
      validationErrors.push(`Invalid targetMemberType. Must be one of: ${VALID_MEMBER_TYPES.join(', ')}`);
    }
    if (!isValidBillingCycle(billingCycle)) {
      validationErrors.push(`Invalid billingCycle. Must be one of: ${VALID_BILLING_CYCLES.join(', ')}`);
    }

    if (validationErrors.length > 0) {
      return validationErrorResponse(validationErrors);
    }

    // Get plan details
    const { data: plan, error: planError } = await supabase
      .from('subscription_plans')
      .select('*')
      .eq('id', planId)
      .single();

    if (planError || !plan) {
      return new Response(JSON.stringify({ error: 'Plan not found' }), { status: 404 });
    }

    // Calculate pricing - use price_monthly or price_yearly based on billing cycle
    const basePrice = billingCycle === 'annual' ? plan.price_yearly : plan.price_monthly;
    const pricing = calculateBulkPricing(basePrice, seatCount);

    // Calculate subscription dates
    const startDate = new Date();
    const endDate = new Date(startDate);
    if (billingCycle === 'annual') {
      endDate.setFullYear(endDate.getFullYear() + 1);
    } else {
      endDate.setMonth(endDate.getMonth() + 1);
    }

    // Create organization subscription record
    const { data: subscription, error: subError } = await supabase
      .from('organization_subscriptions')
      .insert({
        organization_id: organizationId,
        organization_type: organizationType,
        subscription_plan_id: planId,
        purchased_by: userId,
        total_seats: seatCount,
        assigned_seats: 0,
        target_member_type: targetMemberType,
        status: 'active',
        start_date: startDate.toISOString(),
        end_date: endDate.toISOString(),
        auto_renew: autoRenew,
        price_per_seat: pricing.pricePerSeat,
        total_amount: pricing.subtotal,
        discount_percentage: pricing.discountPercentage,
        final_amount: pricing.finalAmount
      })
      .select()
      .single();

    if (subError) {
      console.error('Error creating subscription:', subError);
      return new Response(JSON.stringify({ error: 'Failed to create subscription' }), { status: 500 });
    }

    return new Response(JSON.stringify({ success: true, subscription, pricing }), { status: 201 });
  } catch (error) {
    console.error('Error purchasing subscription:', error);
    return new Response(JSON.stringify({ error: 'Failed to purchase subscription' }), { status: 500 });
  }
}

/**
 * GET /org-subscriptions
 * Get all subscriptions for an organization
 */
export async function handleGetOrgSubscriptions(
  request: Request,
  env: Env,
  supabase: SupabaseClient,
  userId: string
): Promise<Response> {
  try {
    const url = new URL(request.url);
    const organizationId = url.searchParams.get('organizationId');
    const organizationType = url.searchParams.get('organizationType');

    if (!organizationId || !organizationType) {
      return new Response(JSON.stringify({ error: 'Missing organizationId or organizationType' }), { status: 400 });
    }

    const { data: subscriptions, error } = await supabase
      .from('organization_subscriptions')
      .select('*')
      .eq('organization_id', organizationId)
      .eq('organization_type', organizationType)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching subscriptions:', error);
      return new Response(JSON.stringify({ error: 'Failed to fetch subscriptions' }), { status: 500 });
    }

    return new Response(JSON.stringify({ success: true, subscriptions }), { status: 200 });
  } catch (error) {
    console.error('Error in handleGetOrgSubscriptions:', error);
    return new Response(JSON.stringify({ error: 'Failed to fetch subscriptions' }), { status: 500 });
  }
}

/**
 * PUT /org-subscriptions/:id/seats
 * Update seat count for a subscription
 */
export async function handleUpdateSeatCount(
  request: Request,
  env: Env,
  supabase: SupabaseClient,
  userId: string,
  subscriptionId: string
): Promise<Response> {
  try {
    const body = await request.json() as { newSeatCount: number };
    const { newSeatCount } = body;

    if (!newSeatCount || newSeatCount < 1) {
      return new Response(JSON.stringify({ error: 'Invalid seat count' }), { status: 400 });
    }

    // Get current subscription
    const { data: current, error: fetchError } = await supabase
      .from('organization_subscriptions')
      .select('*')
      .eq('id', subscriptionId)
      .single();

    if (fetchError || !current) {
      return new Response(JSON.stringify({ error: 'Subscription not found' }), { status: 404 });
    }

    // Validate new seat count
    if (newSeatCount < current.assigned_seats) {
      return new Response(
        JSON.stringify({ error: `Cannot reduce seats below assigned count (${current.assigned_seats})` }),
        { status: 400 }
      );
    }

    // Recalculate pricing
    const pricing = calculateBulkPricing(current.price_per_seat, newSeatCount);

    // Update subscription
    const { data: updated, error: updateError } = await supabase
      .from('organization_subscriptions')
      .update({
        total_seats: newSeatCount,
        total_amount: pricing.subtotal,
        discount_percentage: pricing.discountPercentage,
        final_amount: pricing.finalAmount,
        updated_at: new Date().toISOString()
      })
      .eq('id', subscriptionId)
      .select()
      .single();

    if (updateError) {
      console.error('Error updating subscription:', updateError);
      return new Response(JSON.stringify({ error: 'Failed to update subscription' }), { status: 500 });
    }

    return new Response(JSON.stringify({ success: true, subscription: updated }), { status: 200 });
  } catch (error) {
    console.error('Error updating seat count:', error);
    return new Response(JSON.stringify({ error: 'Failed to update seat count' }), { status: 500 });
  }
}

// ============================================================================
// License Pool Endpoints
// ============================================================================

/**
 * POST /license-pools
 * Create a new license pool
 */
export async function handleCreateLicensePool(
  request: Request,
  env: Env,
  supabase: SupabaseClient,
  userId: string
): Promise<Response> {
  try {
    const body = await request.json() as LicensePoolRequest;
    const { organizationSubscriptionId, organizationId, organizationType, poolName, memberType, allocatedSeats, autoAssignNewMembers, assignmentCriteria } = body;

    // Validate required fields
    if (!organizationSubscriptionId || !organizationId || !organizationType || !poolName || !memberType || !allocatedSeats) {
      return new Response(JSON.stringify({ error: 'Missing required fields' }), { status: 400 });
    }

    // Validate field formats and values
    const validationErrors: string[] = [];
    
    if (!isValidUUID(organizationSubscriptionId)) {
      validationErrors.push('Invalid organizationSubscriptionId format');
    }
    if (!isValidUUID(organizationId)) {
      validationErrors.push('Invalid organizationId format');
    }
    if (!isValidOrganizationType(organizationType)) {
      validationErrors.push(`Invalid organizationType. Must be one of: ${VALID_ORGANIZATION_TYPES.join(', ')}`);
    }
    if (!poolName.trim() || poolName.length > 100) {
      validationErrors.push('Pool name must be between 1 and 100 characters');
    }
    if (memberType !== 'educator' && memberType !== 'student') {
      validationErrors.push('Invalid memberType. Must be educator or student');
    }
    if (typeof allocatedSeats !== 'number' || allocatedSeats < 1 || allocatedSeats > 10000) {
      validationErrors.push('allocatedSeats must be a number between 1 and 10000');
    }

    if (validationErrors.length > 0) {
      return validationErrorResponse(validationErrors);
    }

    // Validate subscription has enough available seats
    const { data: subscription, error: subError } = await supabase
      .from('organization_subscriptions')
      .select('available_seats')
      .eq('id', organizationSubscriptionId)
      .single();

    if (subError || !subscription) {
      return new Response(JSON.stringify({ error: 'Subscription not found' }), { status: 404 });
    }

    if (subscription.available_seats < allocatedSeats) {
      return new Response(JSON.stringify({ error: 'Insufficient available seats in subscription' }), { status: 400 });
    }

    // Create pool
    const { data: pool, error: poolError } = await supabase
      .from('license_pools')
      .insert({
        organization_subscription_id: organizationSubscriptionId,
        organization_id: organizationId,
        organization_type: organizationType,
        pool_name: poolName,
        member_type: memberType,
        allocated_seats: allocatedSeats,
        assigned_seats: 0,
        auto_assign_new_members: autoAssignNewMembers || false,
        assignment_criteria: assignmentCriteria || {},
        is_active: true,
        created_by: userId
      })
      .select()
      .single();

    if (poolError) {
      console.error('Error creating pool:', poolError);
      return new Response(JSON.stringify({ error: 'Failed to create pool' }), { status: 500 });
    }

    return new Response(JSON.stringify({ success: true, pool }), { status: 201 });
  } catch (error) {
    console.error('Error in handleCreateLicensePool:', error);
    return new Response(JSON.stringify({ error: 'Failed to create pool' }), { status: 500 });
  }
}

/**
 * GET /license-pools
 * Get all license pools for an organization
 */
export async function handleGetLicensePools(
  request: Request,
  env: Env,
  supabase: SupabaseClient,
  userId: string
): Promise<Response> {
  try {
    const url = new URL(request.url);
    const organizationId = url.searchParams.get('organizationId');

    if (!organizationId) {
      return new Response(JSON.stringify({ error: 'Missing organizationId' }), { status: 400 });
    }

    const { data: pools, error } = await supabase
      .from('license_pools')
      .select('*')
      .eq('organization_id', organizationId)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching pools:', error);
      return new Response(JSON.stringify({ error: 'Failed to fetch pools' }), { status: 500 });
    }

    return new Response(JSON.stringify({ success: true, pools }), { status: 200 });
  } catch (error) {
    console.error('Error in handleGetLicensePools:', error);
    return new Response(JSON.stringify({ error: 'Failed to fetch pools' }), { status: 500 });
  }
}

// ============================================================================
// License Assignment Endpoints
// ============================================================================

/**
 * POST /license-assignments
 * Assign a license to a user
 */
export async function handleAssignLicense(
  request: Request,
  env: Env,
  supabase: SupabaseClient,
  userId: string
): Promise<Response> {
  try {
    const body = await request.json() as LicenseAssignmentRequest;
    const { poolId, userId: targetUserId } = body;

    if (!poolId || !targetUserId) {
      return new Response(JSON.stringify({ error: 'Missing poolId or userId' }), { status: 400 });
    }

    // Validate UUID formats
    const validationErrors: string[] = [];
    if (!isValidUUID(poolId)) {
      validationErrors.push('Invalid poolId format');
    }
    if (!isValidUUID(targetUserId)) {
      validationErrors.push('Invalid userId format');
    }
    if (validationErrors.length > 0) {
      return validationErrorResponse(validationErrors);
    }

    // Get pool details
    const { data: pool, error: poolError } = await supabase
      .from('license_pools')
      .select('*')
      .eq('id', poolId)
      .single();

    if (poolError || !pool) {
      return new Response(JSON.stringify({ error: 'Pool not found' }), { status: 404 });
    }

    // Check available seats
    if (pool.available_seats <= 0) {
      return new Response(JSON.stringify({ error: 'No available seats in pool' }), { status: 400 });
    }

    // Check if user already has an active assignment
    const { data: existing } = await supabase
      .from('license_assignments')
      .select('id')
      .eq('user_id', targetUserId)
      .eq('organization_subscription_id', pool.organization_subscription_id)
      .eq('status', 'active')
      .single();

    if (existing) {
      return new Response(JSON.stringify({ error: 'User already has an active license assignment' }), { status: 400 });
    }

    // Create assignment
    const { data: assignment, error: assignError } = await supabase
      .from('license_assignments')
      .insert({
        license_pool_id: poolId,
        organization_subscription_id: pool.organization_subscription_id,
        user_id: targetUserId,
        member_type: pool.member_type,
        status: 'active',
        assigned_by: userId
      })
      .select()
      .single();

    if (assignError) {
      console.error('Error creating assignment:', assignError);
      return new Response(JSON.stringify({ error: 'Failed to assign license' }), { status: 500 });
    }

    return new Response(JSON.stringify({ success: true, assignment }), { status: 201 });
  } catch (error) {
    console.error('Error in handleAssignLicense:', error);
    return new Response(JSON.stringify({ error: 'Failed to assign license' }), { status: 500 });
  }
}

/**
 * POST /license-assignments/bulk
 * Bulk assign licenses to multiple users
 * Rate limited: 10 requests per minute, max 100 users per batch
 */
export async function handleBulkAssignLicenses(
  request: Request,
  env: Env,
  supabase: SupabaseClient,
  userId: string
): Promise<Response> {
  try {
    // Check rate limit
    const rateCheck = checkRateLimit(userId, 'bulkAssignLicenses');
    if (!rateCheck.allowed) {
      return rateLimitResponse(rateCheck.retryAfter!);
    }

    const body = await request.json() as BulkAssignmentRequest;
    const { poolId, userIds } = body;

    if (!poolId || !userIds || !Array.isArray(userIds) || userIds.length === 0) {
      return new Response(JSON.stringify({ error: 'Invalid poolId or userIds' }), { status: 400 });
    }

    // Validate UUID formats
    const validationErrors: string[] = [];
    if (!isValidUUID(poolId)) {
      validationErrors.push('Invalid poolId format');
    }
    const invalidUserIds = userIds.filter(id => !isValidUUID(id));
    if (invalidUserIds.length > 0) {
      validationErrors.push(`Invalid userId format for: ${invalidUserIds.slice(0, 5).join(', ')}${invalidUserIds.length > 5 ? '...' : ''}`);
    }
    if (validationErrors.length > 0) {
      return validationErrorResponse(validationErrors);
    }

    // Validate batch size
    const batchCheck = validateBatchSize('bulkAssignLicenses', userIds.length);
    if (!batchCheck.valid) {
      return batchSizeResponse(batchCheck.maxSize!);
    }

    const successful: any[] = [];
    const failed: Array<{ userId: string; error: string }> = [];

    // Get pool details once
    const { data: pool, error: poolError } = await supabase
      .from('license_pools')
      .select('*')
      .eq('id', poolId)
      .single();

    if (poolError || !pool) {
      return new Response(JSON.stringify({ error: 'Pool not found' }), { status: 404 });
    }

    // Process each user
    for (const targetUserId of userIds) {
      try {
        // Check if user already has assignment
        const { data: existing } = await supabase
          .from('license_assignments')
          .select('id')
          .eq('user_id', targetUserId)
          .eq('organization_subscription_id', pool.organization_subscription_id)
          .eq('status', 'active')
          .single();

        if (existing) {
          failed.push({ userId: targetUserId, error: 'Already has active assignment' });
          continue;
        }

        // Create assignment
        const { data: assignment, error: assignError } = await supabase
          .from('license_assignments')
          .insert({
            license_pool_id: poolId,
            organization_subscription_id: pool.organization_subscription_id,
            user_id: targetUserId,
            member_type: pool.member_type,
            status: 'active',
            assigned_by: userId
          })
          .select()
          .single();

        if (assignError) {
          failed.push({ userId: targetUserId, error: assignError.message });
        } else {
          successful.push(assignment);
        }
      } catch (error) {
        failed.push({ 
          userId: targetUserId, 
          error: error instanceof Error ? error.message : 'Unknown error' 
        });
      }
    }

    return new Response(JSON.stringify({ 
      success: true, 
      successful, 
      failed,
      summary: {
        total: userIds.length,
        successful: successful.length,
        failed: failed.length
      }
    }), { status: 200 });
  } catch (error) {
    console.error('Error in handleBulkAssignLicenses:', error);
    return new Response(JSON.stringify({ error: 'Failed to bulk assign licenses' }), { status: 500 });
  }
}

/**
 * DELETE /license-assignments/:id
 * Unassign/revoke a license
 */
export async function handleUnassignLicense(
  request: Request,
  env: Env,
  supabase: SupabaseClient,
  userId: string,
  assignmentId: string
): Promise<Response> {
  try {
    const body = await request.json() as { reason: string };
    const { reason } = body;

    if (!reason) {
      return new Response(JSON.stringify({ error: 'Revocation reason is required' }), { status: 400 });
    }

    const { error } = await supabase
      .from('license_assignments')
      .update({
        status: 'revoked',
        revoked_at: new Date().toISOString(),
        revoked_by: userId,
        revocation_reason: reason,
        updated_at: new Date().toISOString()
      })
      .eq('id', assignmentId);

    if (error) {
      console.error('Error revoking assignment:', error);
      return new Response(JSON.stringify({ error: 'Failed to revoke license' }), { status: 500 });
    }

    return new Response(JSON.stringify({ success: true, message: 'License revoked successfully' }), { status: 200 });
  } catch (error) {
    console.error('Error in handleUnassignLicense:', error);
    return new Response(JSON.stringify({ error: 'Failed to revoke license' }), { status: 500 });
  }
}

/**
 * GET /license-assignments/user/:userId
 * Get all assignments for a user
 */
export async function handleGetUserAssignments(
  request: Request,
  env: Env,
  supabase: SupabaseClient,
  userId: string,
  targetUserId: string
): Promise<Response> {
  try {
    const { data: assignments, error } = await supabase
      .from('license_assignments')
      .select('*')
      .eq('user_id', targetUserId)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching assignments:', error);
      return new Response(JSON.stringify({ error: 'Failed to fetch assignments' }), { status: 500 });
    }

    return new Response(JSON.stringify({ success: true, assignments }), { status: 200 });
  } catch (error) {
    console.error('Error in handleGetUserAssignments:', error);
    return new Response(JSON.stringify({ error: 'Failed to fetch assignments' }), { status: 500 });
  }
}


// ============================================================================
// Organization Billing Endpoints
// ============================================================================

/**
 * GET /org-billing/dashboard
 * Get comprehensive billing dashboard for an organization
 */
export async function handleGetBillingDashboard(
  request: Request,
  env: Env,
  supabase: SupabaseClient,
  userId: string
): Promise<Response> {
  try {
    const url = new URL(request.url);
    const organizationId = url.searchParams.get('organizationId');
    const organizationType = url.searchParams.get('organizationType') as 'school' | 'college' | 'university';

    if (!organizationId || !organizationType) {
      return new Response(JSON.stringify({ error: 'Missing organizationId or organizationType' }), { status: 400 });
    }

    // 1. Get all active subscriptions
    const { data: subscriptions, error: subError } = await supabase
      .from('organization_subscriptions')
      .select(`
        *,
        subscription_plans (
          id,
          name,
          price_monthly,
          price_yearly
        )
      `)
      .eq('organization_id', organizationId)
      .eq('organization_type', organizationType)
      .in('status', ['active', 'grace_period']);

    if (subError) throw subError;

    // 2. Get payment history
    const { data: payments, error: payError } = await supabase
      .from('payment_transactions')
      .select('*')
      .eq('organization_id', organizationId)
      .order('created_at', { ascending: false })
      .limit(20);

    if (payError) throw payError;

    // 3. Calculate current period
    const now = new Date();
    const periodStart = new Date(now.getFullYear(), now.getMonth(), 1);
    const periodEnd = new Date(now.getFullYear(), now.getMonth() + 1, 0);

    // 4. Calculate costs and summaries
    let subscriptionCosts = 0;
    let totalActiveSeats = 0;
    let totalAssignedSeats = 0;

    const subscriptionSummaries = (subscriptions || []).map((sub: any) => {
      const finalAmount = parseFloat(sub.final_amount);
      // Determine if annual based on subscription duration (no billing_cycle column in subscription_plans)
      const startDate = new Date(sub.start_date);
      const endDate = new Date(sub.end_date);
      const durationDays = Math.ceil((endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24));
      const isAnnual = durationDays > 60; // More than 2 months = annual
      const monthlyCost = isAnnual ? finalAmount / 12 : finalAmount;
      
      subscriptionCosts += monthlyCost;
      totalActiveSeats += sub.total_seats;
      totalAssignedSeats += sub.assigned_seats;

      return {
        subscriptionId: sub.id,
        planId: sub.subscription_plan_id,
        planName: sub.subscription_plans?.name || 'Unknown Plan',
        seatCount: sub.total_seats,
        assignedSeats: sub.assigned_seats,
        utilization: sub.total_seats > 0 
          ? Math.round((sub.assigned_seats / sub.total_seats) * 100) 
          : 0,
        monthlyCost,
        status: sub.status,
        endDate: sub.end_date
      };
    });

    // 5. Get upcoming renewals (within 30 days)
    const thirtyDaysFromNow = new Date();
    thirtyDaysFromNow.setDate(thirtyDaysFromNow.getDate() + 30);

    const upcomingRenewals = (subscriptions || [])
      .filter((sub: any) => {
        const endDate = new Date(sub.end_date);
        return endDate <= thirtyDaysFromNow && sub.status === 'active';
      })
      .map((sub: any) => ({
        subscriptionId: sub.id,
        planName: sub.subscription_plans?.name || 'Unknown Plan',
        renewalDate: sub.end_date,
        estimatedCost: parseFloat(sub.final_amount),
        seatCount: sub.total_seats,
        autoRenew: sub.auto_renew
      }));

    // 6. Map payment history
    const paymentHistory = (payments || []).map((p: any) => ({
      id: p.id,
      transactionId: p.razorpay_payment_id || p.id,
      amount: parseFloat(p.amount),
      currency: p.currency || 'INR',
      status: p.status,
      paymentMethod: p.payment_method || 'unknown',
      description: p.description || 'Subscription payment',
      createdAt: p.created_at,
      invoiceId: p.invoice_id
    }));

    // 7. Calculate overall utilization
    const overallUtilization = totalActiveSeats > 0
      ? Math.round((totalAssignedSeats / totalActiveSeats) * 100)
      : 0;

    const dashboard = {
      organizationId,
      organizationType,
      currentPeriod: {
        startDate: periodStart.toISOString(),
        endDate: periodEnd.toISOString(),
        totalCost: subscriptionCosts,
        subscriptionCosts,
        addonCosts: 0 // TODO: Calculate addon costs
      },
      subscriptions: subscriptionSummaries,
      addons: [],
      upcomingRenewals,
      paymentHistory,
      totalActiveSeats,
      totalAssignedSeats,
      overallUtilization
    };

    return new Response(JSON.stringify({ success: true, dashboard }), { status: 200 });
  } catch (error) {
    console.error('Error fetching billing dashboard:', error);
    return new Response(JSON.stringify({ error: 'Failed to fetch billing dashboard' }), { status: 500 });
  }
}

/**
 * GET /org-billing/invoices
 * Get invoice history for an organization
 */
export async function handleGetInvoiceHistory(
  request: Request,
  env: Env,
  supabase: SupabaseClient,
  userId: string
): Promise<Response> {
  try {
    const url = new URL(request.url);
    const organizationId = url.searchParams.get('organizationId');
    const limit = parseInt(url.searchParams.get('limit') || '50');

    if (!organizationId) {
      return new Response(JSON.stringify({ error: 'Missing organizationId' }), { status: 400 });
    }

    // Get all successful payment transactions for the organization
    const { data: transactions, error } = await supabase
      .from('payment_transactions')
      .select('*')
      .eq('organization_id', organizationId)
      .eq('status', 'success')
      .order('created_at', { ascending: false })
      .limit(limit);

    if (error) throw error;

    // Generate invoice objects for each transaction
    const invoices = (transactions || []).map((tx: any, index: number) => {
      const amount = parseFloat(tx.amount);
      const taxAmount = amount * 0.18 / 1.18;
      const baseAmount = amount - taxAmount;

      return {
        id: tx.invoice_id || `inv_${tx.id}`,
        invoiceNumber: `INV-${new Date(tx.created_at).getFullYear()}-${String(index + 1).padStart(5, '0')}`,
        organizationId: tx.organization_id,
        transactionId: tx.id,
        amount: baseAmount,
        taxAmount,
        totalAmount: amount,
        currency: tx.currency || 'INR',
        status: 'paid',
        issueDate: tx.created_at,
        paidDate: tx.created_at,
        lineItems: [{
          description: tx.description || 'Subscription Payment',
          quantity: tx.seat_count || 1,
          unitPrice: baseAmount / (tx.seat_count || 1),
          amount: baseAmount,
          taxRate: 18,
          taxAmount
        }],
        createdAt: tx.created_at
      };
    });

    return new Response(JSON.stringify({ success: true, invoices }), { status: 200 });
  } catch (error) {
    console.error('Error fetching invoice history:', error);
    return new Response(JSON.stringify({ error: 'Failed to fetch invoice history' }), { status: 500 });
  }
}

/**
 * GET /org-billing/cost-projection
 * Project monthly cost for an organization
 */
export async function handleGetCostProjection(
  request: Request,
  env: Env,
  supabase: SupabaseClient,
  userId: string
): Promise<Response> {
  try {
    const url = new URL(request.url);
    const organizationId = url.searchParams.get('organizationId');
    const organizationType = url.searchParams.get('organizationType') as 'school' | 'college' | 'university';

    if (!organizationId || !organizationType) {
      return new Response(JSON.stringify({ error: 'Missing organizationId or organizationType' }), { status: 400 });
    }

    // Get active subscriptions
    const { data: subscriptions, error: subError } = await supabase
      .from('organization_subscriptions')
      .select(`
        *,
        subscription_plans (price_monthly, price_yearly)
      `)
      .eq('organization_id', organizationId)
      .eq('organization_type', organizationType)
      .eq('status', 'active');

    if (subError) throw subError;

    // Calculate subscription costs
    let subscriptionCost = 0;
    (subscriptions || []).forEach((sub: any) => {
      const finalAmount = parseFloat(sub.final_amount);
      // Determine if annual based on subscription duration
      const startDate = new Date(sub.start_date);
      const endDate = new Date(sub.end_date);
      const durationDays = Math.ceil((endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24));
      const isAnnual = durationDays > 60; // More than 2 months = annual
      subscriptionCost += isAnnual ? finalAmount / 12 : finalAmount;
    });

    const totalBeforeTax = subscriptionCost;
    const taxes = totalBeforeTax * 0.18;
    const totalWithTax = totalBeforeTax + taxes;

    const projection = {
      currentMonthlyCost: totalWithTax,
      projectedMonthlyCost: totalWithTax,
      projectedAnnualCost: totalWithTax * 12,
      breakdown: {
        subscriptions: subscriptionCost,
        addons: 0,
        taxes
      }
    };

    return new Response(JSON.stringify({ success: true, projection }), { status: 200 });
  } catch (error) {
    console.error('Error projecting cost:', error);
    return new Response(JSON.stringify({ error: 'Failed to project cost' }), { status: 500 });
  }
}

/**
 * POST /org-billing/calculate-seat-addition
 * Calculate cost for adding seats to a subscription
 */
export async function handleCalculateSeatAdditionCost(
  request: Request,
  env: Env,
  supabase: SupabaseClient,
  userId: string
): Promise<Response> {
  try {
    const body = await request.json() as { subscriptionId: string; additionalSeats: number };
    const { subscriptionId, additionalSeats } = body;

    if (!subscriptionId || !additionalSeats || additionalSeats < 1) {
      return new Response(JSON.stringify({ error: 'Invalid subscriptionId or additionalSeats' }), { status: 400 });
    }

    // Get current subscription
    const { data: subscription, error } = await supabase
      .from('organization_subscriptions')
      .select(`
        *,
        subscription_plans (price_monthly, price_yearly)
      `)
      .eq('id', subscriptionId)
      .single();

    if (error || !subscription) {
      return new Response(JSON.stringify({ error: 'Subscription not found' }), { status: 404 });
    }

    const newTotalSeats = subscription.total_seats + additionalSeats;
    const pricePerSeat = subscription.subscription_plans?.price_monthly || subscription.price_per_seat;

    // Calculate new volume discount
    const newDiscountPercentage = calculateVolumeDiscount(newTotalSeats);
    
    // Calculate costs for additional seats
    const subtotal = pricePerSeat * additionalSeats;
    const discountAmount = (subtotal * newDiscountPercentage) / 100;
    const afterDiscount = subtotal - discountAmount;
    const taxAmount = afterDiscount * 0.18;
    const totalCost = afterDiscount + taxAmount;

    // Calculate proration
    const endDate = new Date(subscription.end_date);
    const now = new Date();
    const totalDays = Math.ceil((endDate.getTime() - new Date(subscription.start_date).getTime()) / (1000 * 60 * 60 * 24));
    const remainingDays = Math.ceil((endDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
    const proratedCost = (totalCost / totalDays) * remainingDays;

    const calculation = {
      additionalSeats,
      pricePerSeat,
      subtotal,
      newDiscountPercentage,
      discountAmount,
      taxAmount,
      totalCost,
      proratedDays: remainingDays,
      proratedCost: Math.round(proratedCost * 100) / 100
    };

    return new Response(JSON.stringify({ success: true, calculation }), { status: 200 });
  } catch (error) {
    console.error('Error calculating seat addition cost:', error);
    return new Response(JSON.stringify({ error: 'Failed to calculate cost' }), { status: 500 });
  }
}

// ============================================================================
// Organization Invitation Endpoints
// ============================================================================

/**
 * Generate a secure random token
 */
function generateSecureToken(): string {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  let token = '';
  for (let i = 0; i < 64; i++) {
    token += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return token;
}

/**
 * POST /org-invitations
 * Invite a member to the organization
 */
export async function handleInviteMember(
  request: Request,
  env: Env,
  supabase: SupabaseClient,
  userId: string
): Promise<Response> {
  try {
    const body = await request.json() as {
      organizationId: string;
      organizationType: 'school' | 'college' | 'university';
      email: string;
      memberType: 'educator' | 'student';
      autoAssignSubscription: boolean;
      licensePoolId?: string;
      invitationMessage?: string;
    };

    const { organizationId, organizationType, email, memberType, autoAssignSubscription, licensePoolId, invitationMessage } = body;

    // Validate required fields
    if (!organizationId || !organizationType || !email || !memberType) {
      return new Response(JSON.stringify({ error: 'Missing required fields' }), { status: 400 });
    }

    // Validate field formats and values
    const validationErrors: string[] = [];
    
    if (!isValidUUID(organizationId)) {
      validationErrors.push('Invalid organizationId format');
    }
    if (!isValidOrganizationType(organizationType)) {
      validationErrors.push(`Invalid organizationType. Must be one of: ${VALID_ORGANIZATION_TYPES.join(', ')}`);
    }
    if (!isValidEmail(email)) {
      validationErrors.push('Invalid email format');
    }
    if (!isValidMemberType(memberType)) {
      validationErrors.push(`Invalid memberType. Must be one of: educator, student`);
    }
    if (licensePoolId && !isValidUUID(licensePoolId)) {
      validationErrors.push('Invalid licensePoolId format');
    }
    if (invitationMessage && invitationMessage.length > 1000) {
      validationErrors.push('Invitation message must be 1000 characters or less');
    }

    if (validationErrors.length > 0) {
      return validationErrorResponse(validationErrors);
    }

    // Check if invitation already exists
    const { data: existing } = await supabase
      .from('organization_invitations')
      .select('id')
      .eq('organization_id', organizationId)
      .eq('email', email.toLowerCase())
      .eq('status', 'pending')
      .single();

    if (existing) {
      return new Response(JSON.stringify({ error: 'An invitation is already pending for this email' }), { status: 400 });
    }

    // Generate token and expiration
    const invitationToken = generateSecureToken();
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 7);

    // Create invitation
    const { data: invitation, error } = await supabase
      .from('organization_invitations')
      .insert({
        organization_id: organizationId,
        organization_type: organizationType,
        email: email.toLowerCase(),
        member_type: memberType,
        invited_by: userId,
        auto_assign_subscription: autoAssignSubscription,
        target_license_pool_id: licensePoolId,
        status: 'pending',
        invitation_token: invitationToken,
        expires_at: expiresAt.toISOString(),
        invitation_message: invitationMessage
      })
      .select()
      .single();

    if (error) {
      console.error('Error creating invitation:', error);
      return new Response(JSON.stringify({ error: 'Failed to create invitation' }), { status: 500 });
    }

    // TODO: Send invitation email via email service

    return new Response(JSON.stringify({ success: true, invitation }), { status: 201 });
  } catch (error) {
    console.error('Error inviting member:', error);
    return new Response(JSON.stringify({ error: 'Failed to invite member' }), { status: 500 });
  }
}

/**
 * POST /org-invitations/bulk
 * Bulk invite members to the organization
 * Rate limited: 5 requests per minute, max 50 invitations per batch
 */
export async function handleBulkInviteMembers(
  request: Request,
  env: Env,
  supabase: SupabaseClient,
  userId: string
): Promise<Response> {
  try {
    // Check rate limit
    const rateCheck = checkRateLimit(userId, 'bulkInviteMembers');
    if (!rateCheck.allowed) {
      return rateLimitResponse(rateCheck.retryAfter!);
    }

    const body = await request.json() as {
      invitations: Array<{
        organizationId: string;
        organizationType: 'school' | 'college' | 'university';
        email: string;
        memberType: 'educator' | 'student';
        autoAssignSubscription: boolean;
        licensePoolId?: string;
      }>;
    };

    const { invitations } = body;

    if (!invitations || !Array.isArray(invitations) || invitations.length === 0) {
      return new Response(JSON.stringify({ error: 'Invalid invitations array' }), { status: 400 });
    }

    // Validate batch size
    const batchCheck = validateBatchSize('bulkInviteMembers', invitations.length);
    if (!batchCheck.valid) {
      return batchSizeResponse(batchCheck.maxSize!);
    }

    const successful: any[] = [];
    const failed: Array<{ email: string; error: string }> = [];

    for (const inv of invitations) {
      try {
        // Check if invitation already exists
        const { data: existing } = await supabase
          .from('organization_invitations')
          .select('id')
          .eq('organization_id', inv.organizationId)
          .eq('email', inv.email.toLowerCase())
          .eq('status', 'pending')
          .single();

        if (existing) {
          failed.push({ email: inv.email, error: 'Invitation already pending' });
          continue;
        }

        // Generate token and expiration
        const invitationToken = generateSecureToken();
        const expiresAt = new Date();
        expiresAt.setDate(expiresAt.getDate() + 7);

        // Create invitation
        const { data: invitation, error } = await supabase
          .from('organization_invitations')
          .insert({
            organization_id: inv.organizationId,
            organization_type: inv.organizationType,
            email: inv.email.toLowerCase(),
            member_type: inv.memberType,
            invited_by: userId,
            auto_assign_subscription: inv.autoAssignSubscription,
            target_license_pool_id: inv.licensePoolId,
            status: 'pending',
            invitation_token: invitationToken,
            expires_at: expiresAt.toISOString()
          })
          .select()
          .single();

        if (error) {
          failed.push({ email: inv.email, error: error.message });
        } else {
          successful.push(invitation);
        }
      } catch (error) {
        failed.push({ 
          email: inv.email, 
          error: error instanceof Error ? error.message : 'Unknown error' 
        });
      }
    }

    return new Response(JSON.stringify({ 
      success: true, 
      successful, 
      failed,
      summary: {
        total: invitations.length,
        successful: successful.length,
        failed: failed.length
      }
    }), { status: 200 });
  } catch (error) {
    console.error('Error bulk inviting members:', error);
    return new Response(JSON.stringify({ error: 'Failed to bulk invite members' }), { status: 500 });
  }
}

/**
 * GET /org-invitations
 * Get invitations for an organization
 */
export async function handleGetInvitations(
  request: Request,
  env: Env,
  supabase: SupabaseClient,
  userId: string
): Promise<Response> {
  try {
    const url = new URL(request.url);
    const organizationId = url.searchParams.get('organizationId');
    const status = url.searchParams.get('status');
    const memberType = url.searchParams.get('memberType');
    const limit = parseInt(url.searchParams.get('limit') || '50');

    if (!organizationId) {
      return new Response(JSON.stringify({ error: 'Missing organizationId' }), { status: 400 });
    }

    let query = supabase
      .from('organization_invitations')
      .select('*')
      .eq('organization_id', organizationId)
      .order('created_at', { ascending: false })
      .limit(limit);

    if (status) {
      query = query.eq('status', status);
    }

    if (memberType) {
      query = query.eq('member_type', memberType);
    }

    const { data: invitations, error } = await query;

    if (error) {
      console.error('Error fetching invitations:', error);
      return new Response(JSON.stringify({ error: 'Failed to fetch invitations' }), { status: 500 });
    }

    return new Response(JSON.stringify({ success: true, invitations }), { status: 200 });
  } catch (error) {
    console.error('Error in handleGetInvitations:', error);
    return new Response(JSON.stringify({ error: 'Failed to fetch invitations' }), { status: 500 });
  }
}

/**
 * PUT /org-invitations/:id/resend
 * Resend an invitation
 */
export async function handleResendInvitation(
  request: Request,
  env: Env,
  supabase: SupabaseClient,
  userId: string,
  invitationId: string
): Promise<Response> {
  try {
    // Get invitation
    const { data: invitation, error: fetchError } = await supabase
      .from('organization_invitations')
      .select('*')
      .eq('id', invitationId)
      .single();

    if (fetchError || !invitation) {
      return new Response(JSON.stringify({ error: 'Invitation not found' }), { status: 404 });
    }

    if (invitation.status !== 'pending') {
      return new Response(JSON.stringify({ error: 'Can only resend pending invitations' }), { status: 400 });
    }

    // Generate new token and extend expiration
    const newToken = generateSecureToken();
    const newExpiresAt = new Date();
    newExpiresAt.setDate(newExpiresAt.getDate() + 7);

    // Update invitation
    const { error: updateError } = await supabase
      .from('organization_invitations')
      .update({
        invitation_token: newToken,
        expires_at: newExpiresAt.toISOString(),
        updated_at: new Date().toISOString()
      })
      .eq('id', invitationId);

    if (updateError) {
      console.error('Error updating invitation:', updateError);
      return new Response(JSON.stringify({ error: 'Failed to resend invitation' }), { status: 500 });
    }

    // TODO: Resend email via email service

    return new Response(JSON.stringify({ success: true, message: 'Invitation resent successfully' }), { status: 200 });
  } catch (error) {
    console.error('Error resending invitation:', error);
    return new Response(JSON.stringify({ error: 'Failed to resend invitation' }), { status: 500 });
  }
}

/**
 * DELETE /org-invitations/:id
 * Cancel an invitation
 */
export async function handleCancelInvitation(
  request: Request,
  env: Env,
  supabase: SupabaseClient,
  userId: string,
  invitationId: string
): Promise<Response> {
  try {
    const { error } = await supabase
      .from('organization_invitations')
      .update({
        status: 'cancelled',
        updated_at: new Date().toISOString()
      })
      .eq('id', invitationId)
      .eq('status', 'pending');

    if (error) {
      console.error('Error cancelling invitation:', error);
      return new Response(JSON.stringify({ error: 'Failed to cancel invitation' }), { status: 500 });
    }

    return new Response(JSON.stringify({ success: true, message: 'Invitation cancelled successfully' }), { status: 200 });
  } catch (error) {
    console.error('Error cancelling invitation:', error);
    return new Response(JSON.stringify({ error: 'Failed to cancel invitation' }), { status: 500 });
  }
}

/**
 * POST /org-invitations/accept
 * Accept an invitation (public endpoint)
 */
export async function handleAcceptInvitation(
  request: Request,
  env: Env,
  supabase: SupabaseClient,
  userId: string
): Promise<Response> {
  try {
    const body = await request.json() as { token: string };
    const { token } = body;

    if (!token) {
      return new Response(JSON.stringify({ error: 'Missing invitation token' }), { status: 400 });
    }

    // Find invitation by token
    const { data: invitation, error: fetchError } = await supabase
      .from('organization_invitations')
      .select('*')
      .eq('invitation_token', token)
      .eq('status', 'pending')
      .single();

    if (fetchError || !invitation) {
      return new Response(JSON.stringify({ error: 'Invalid or expired invitation' }), { status: 404 });
    }

    // Check if invitation has expired
    if (new Date(invitation.expires_at) < new Date()) {
      await supabase
        .from('organization_invitations')
        .update({ status: 'expired' })
        .eq('id', invitation.id);
      return new Response(JSON.stringify({ error: 'Invitation has expired' }), { status: 400 });
    }

    // Update invitation status
    const { error: updateError } = await supabase
      .from('organization_invitations')
      .update({
        status: 'accepted',
        accepted_at: new Date().toISOString(),
        accepted_by: userId,
        updated_at: new Date().toISOString()
      })
      .eq('id', invitation.id);

    if (updateError) {
      console.error('Error updating invitation:', updateError);
      return new Response(JSON.stringify({ error: 'Failed to accept invitation' }), { status: 500 });
    }

    // Auto-assign license if configured
    let assignedLicense = null;
    if (invitation.auto_assign_subscription && invitation.target_license_pool_id) {
      try {
        // Get pool details
        const { data: pool } = await supabase
          .from('license_pools')
          .select('*')
          .eq('id', invitation.target_license_pool_id)
          .single();

        if (pool && pool.available_seats > 0) {
          const { data: assignment } = await supabase
            .from('license_assignments')
            .insert({
              license_pool_id: invitation.target_license_pool_id,
              organization_subscription_id: pool.organization_subscription_id,
              user_id: userId,
              member_type: invitation.member_type,
              status: 'active',
              assigned_by: invitation.invited_by
            })
            .select()
            .single();

          assignedLicense = assignment;
        }
      } catch (licenseError) {
        console.warn('Could not auto-assign license:', licenseError);
      }
    }

    return new Response(JSON.stringify({ 
      success: true, 
      invitation: { ...invitation, status: 'accepted' },
      assignedLicense
    }), { status: 200 });
  } catch (error) {
    console.error('Error accepting invitation:', error);
    return new Response(JSON.stringify({ error: 'Failed to accept invitation' }), { status: 500 });
  }
}

/**
 * GET /org-invitations/stats
 * Get invitation statistics for an organization
 */
export async function handleGetInvitationStats(
  request: Request,
  env: Env,
  supabase: SupabaseClient,
  userId: string
): Promise<Response> {
  try {
    const url = new URL(request.url);
    const organizationId = url.searchParams.get('organizationId');

    if (!organizationId) {
      return new Response(JSON.stringify({ error: 'Missing organizationId' }), { status: 400 });
    }

    const { data, error } = await supabase
      .from('organization_invitations')
      .select('status')
      .eq('organization_id', organizationId);

    if (error) throw error;

    const stats = {
      total: data?.length || 0,
      pending: 0,
      accepted: 0,
      expired: 0,
      cancelled: 0,
      acceptanceRate: 0
    };

    (data || []).forEach((inv: any) => {
      switch (inv.status) {
        case 'pending': stats.pending++; break;
        case 'accepted': stats.accepted++; break;
        case 'expired': stats.expired++; break;
        case 'cancelled': stats.cancelled++; break;
      }
    });

    // Calculate acceptance rate
    const completed = stats.accepted + stats.expired + stats.cancelled;
    stats.acceptanceRate = completed > 0 
      ? Math.round((stats.accepted / completed) * 100) 
      : 0;

    return new Response(JSON.stringify({ success: true, stats }), { status: 200 });
  } catch (error) {
    console.error('Error fetching invitation stats:', error);
    return new Response(JSON.stringify({ error: 'Failed to fetch invitation stats' }), { status: 500 });
  }
}


// ============================================================================
// Additional License Management Endpoints
// ============================================================================

/**
 * PUT /license-pools/:id/allocation
 * Update seat allocation for a license pool
 */
export async function handleUpdatePoolAllocation(
  request: Request,
  env: Env,
  supabase: SupabaseClient,
  userId: string,
  poolId: string
): Promise<Response> {
  try {
    const body = await request.json() as { newAllocation: number };
    const { newAllocation } = body;

    if (!newAllocation || newAllocation < 1) {
      return new Response(JSON.stringify({ error: 'Invalid allocation amount' }), { status: 400 });
    }

    // Get current pool
    const { data: pool, error: poolError } = await supabase
      .from('license_pools')
      .select('*, organization_subscriptions(total_seats, assigned_seats)')
      .eq('id', poolId)
      .single();

    if (poolError || !pool) {
      return new Response(JSON.stringify({ error: 'Pool not found' }), { status: 404 });
    }

    // Validate new allocation doesn't exceed assigned seats
    if (newAllocation < pool.assigned_seats) {
      return new Response(
        JSON.stringify({ error: `Cannot reduce allocation below assigned seats (${pool.assigned_seats})` }),
        { status: 400 }
      );
    }

    // Validate total allocation across all pools doesn't exceed subscription seats
    const { data: allPools } = await supabase
      .from('license_pools')
      .select('allocated_seats')
      .eq('organization_subscription_id', pool.organization_subscription_id)
      .neq('id', poolId);

    const otherPoolsAllocation = (allPools || []).reduce((sum: number, p: any) => sum + p.allocated_seats, 0);
    const totalAllocation = otherPoolsAllocation + newAllocation;
    const subscriptionSeats = pool.organization_subscriptions?.total_seats || 0;

    if (totalAllocation > subscriptionSeats) {
      return new Response(
        JSON.stringify({ 
          error: `Total allocation (${totalAllocation}) exceeds subscription seats (${subscriptionSeats})` 
        }),
        { status: 400 }
      );
    }

    // Update pool allocation
    const { data: updated, error: updateError } = await supabase
      .from('license_pools')
      .update({
        allocated_seats: newAllocation,
        updated_at: new Date().toISOString()
      })
      .eq('id', poolId)
      .select()
      .single();

    if (updateError) {
      console.error('Error updating pool allocation:', updateError);
      return new Response(JSON.stringify({ error: 'Failed to update pool allocation' }), { status: 500 });
    }

    return new Response(JSON.stringify({ success: true, pool: updated }), { status: 200 });
  } catch (error) {
    console.error('Error updating pool allocation:', error);
    return new Response(JSON.stringify({ error: 'Failed to update pool allocation' }), { status: 500 });
  }
}

/**
 * POST /license-assignments/transfer
 * Transfer a license from one user to another
 */
export async function handleTransferLicense(
  request: Request,
  env: Env,
  supabase: SupabaseClient,
  userId: string
): Promise<Response> {
  try {
    const body = await request.json() as { 
      fromUserId: string; 
      toUserId: string; 
      organizationSubscriptionId: string;
      reason?: string;
    };
    const { fromUserId, toUserId, organizationSubscriptionId, reason } = body;

    // Validate required fields
    if (!fromUserId || !toUserId || !organizationSubscriptionId) {
      return new Response(JSON.stringify({ error: 'Missing required fields' }), { status: 400 });
    }

    // Validate UUID formats
    const validationErrors: string[] = [];
    if (!isValidUUID(fromUserId)) validationErrors.push('Invalid fromUserId format');
    if (!isValidUUID(toUserId)) validationErrors.push('Invalid toUserId format');
    if (!isValidUUID(organizationSubscriptionId)) validationErrors.push('Invalid organizationSubscriptionId format');
    if (validationErrors.length > 0) {
      return validationErrorResponse(validationErrors);
    }

    if (fromUserId === toUserId) {
      return new Response(JSON.stringify({ error: 'Cannot transfer license to the same user' }), { status: 400 });
    }

    // Get current assignment
    const { data: currentAssignment, error: fetchError } = await supabase
      .from('license_assignments')
      .select('*')
      .eq('user_id', fromUserId)
      .eq('organization_subscription_id', organizationSubscriptionId)
      .eq('status', 'active')
      .single();

    if (fetchError || !currentAssignment) {
      return new Response(JSON.stringify({ error: 'Active license assignment not found for source user' }), { status: 404 });
    }

    // Check if target user already has an active assignment
    const { data: existingAssignment } = await supabase
      .from('license_assignments')
      .select('id')
      .eq('user_id', toUserId)
      .eq('organization_subscription_id', organizationSubscriptionId)
      .eq('status', 'active')
      .single();

    if (existingAssignment) {
      return new Response(JSON.stringify({ error: 'Target user already has an active license assignment' }), { status: 400 });
    }

    // Revoke current assignment
    const { error: revokeError } = await supabase
      .from('license_assignments')
      .update({
        status: 'revoked',
        revoked_at: new Date().toISOString(),
        revoked_by: userId,
        revocation_reason: reason || 'License transferred to another user',
        updated_at: new Date().toISOString()
      })
      .eq('id', currentAssignment.id);

    if (revokeError) {
      console.error('Error revoking assignment:', revokeError);
      return new Response(JSON.stringify({ error: 'Failed to revoke current assignment' }), { status: 500 });
    }

    // Create new assignment for target user
    const { data: newAssignment, error: createError } = await supabase
      .from('license_assignments')
      .insert({
        license_pool_id: currentAssignment.license_pool_id,
        organization_subscription_id: organizationSubscriptionId,
        user_id: toUserId,
        member_type: currentAssignment.member_type,
        status: 'active',
        assigned_by: userId,
        transferred_from: currentAssignment.id
      })
      .select()
      .single();

    if (createError) {
      console.error('Error creating new assignment:', createError);
      // Try to restore the original assignment
      await supabase
        .from('license_assignments')
        .update({ status: 'active', revoked_at: null, revoked_by: null, revocation_reason: null })
        .eq('id', currentAssignment.id);
      return new Response(JSON.stringify({ error: 'Failed to create new assignment' }), { status: 500 });
    }

    // Update the old assignment to point to the new one
    await supabase
      .from('license_assignments')
      .update({ transferred_to: newAssignment.id })
      .eq('id', currentAssignment.id);

    return new Response(JSON.stringify({ 
      success: true, 
      transfer: {
        fromAssignment: currentAssignment.id,
        toAssignment: newAssignment.id,
        fromUserId,
        toUserId
      },
      newAssignment
    }), { status: 200 });
  } catch (error) {
    console.error('Error transferring license:', error);
    return new Response(JSON.stringify({ error: 'Failed to transfer license' }), { status: 500 });
  }
}

/**
 * GET /org-billing/invoice/:id/download
 * Download invoice as PDF
 */
export async function handleDownloadInvoice(
  request: Request,
  env: Env,
  supabase: SupabaseClient,
  userId: string,
  invoiceId: string
): Promise<Response> {
  try {
    // Get transaction/invoice details
    const { data: transaction, error } = await supabase
      .from('payment_transactions')
      .select(`
        *,
        organization_subscriptions (
          organization_id,
          organization_type,
          total_seats,
          subscription_plans (
            name,
            description
          )
        )
      `)
      .eq('id', invoiceId)
      .single();

    if (error || !transaction) {
      return new Response(JSON.stringify({ error: 'Invoice not found' }), { status: 404 });
    }

    // Generate invoice data
    const invoiceData = {
      invoiceNumber: `INV-${transaction.id.slice(0, 8).toUpperCase()}`,
      invoiceDate: new Date(transaction.created_at).toLocaleDateString('en-IN'),
      dueDate: new Date(transaction.created_at).toLocaleDateString('en-IN'),
      organizationId: transaction.organization_id,
      organizationType: transaction.organization_type,
      items: [{
        description: transaction.organization_subscriptions?.subscription_plans?.name || 'Subscription',
        quantity: transaction.seat_count || 1,
        unitPrice: parseFloat(transaction.amount) / (transaction.seat_count || 1),
        total: parseFloat(transaction.amount)
      }],
      subtotal: parseFloat(transaction.amount) / 1.18, // Remove GST
      taxRate: 18,
      taxAmount: parseFloat(transaction.amount) - (parseFloat(transaction.amount) / 1.18),
      total: parseFloat(transaction.amount),
      paymentStatus: transaction.status,
      paymentMethod: transaction.payment_method || 'Online',
      transactionId: transaction.razorpay_payment_id || transaction.id
    };

    // Return invoice data (PDF generation would be done client-side or via a separate service)
    return new Response(JSON.stringify({ 
      success: true, 
      invoice: invoiceData,
      downloadUrl: null // Would be a pre-signed URL to a generated PDF
    }), { 
      status: 200,
      headers: {
        'Content-Type': 'application/json'
      }
    });
  } catch (error) {
    console.error('Error downloading invoice:', error);
    return new Response(JSON.stringify({ error: 'Failed to download invoice' }), { status: 500 });
  }
}

/**
 * POST /license-pools/:id/auto-assignment
 * Configure auto-assignment rules for a license pool
 */
export async function handleConfigureAutoAssignment(
  request: Request,
  env: Env,
  supabase: SupabaseClient,
  userId: string,
  poolId: string
): Promise<Response> {
  try {
    const body = await request.json() as { 
      autoAssignNewMembers: boolean;
      assignmentCriteria?: Record<string, any>;
    };
    const { autoAssignNewMembers, assignmentCriteria } = body;

    if (typeof autoAssignNewMembers !== 'boolean') {
      return new Response(JSON.stringify({ error: 'autoAssignNewMembers must be a boolean' }), { status: 400 });
    }

    // Update pool auto-assignment settings
    const { data: updated, error } = await supabase
      .from('license_pools')
      .update({
        auto_assign_new_members: autoAssignNewMembers,
        assignment_criteria: assignmentCriteria || {},
        updated_at: new Date().toISOString()
      })
      .eq('id', poolId)
      .select()
      .single();

    if (error) {
      console.error('Error configuring auto-assignment:', error);
      return new Response(JSON.stringify({ error: 'Failed to configure auto-assignment' }), { status: 500 });
    }

    return new Response(JSON.stringify({ success: true, pool: updated }), { status: 200 });
  } catch (error) {
    console.error('Error configuring auto-assignment:', error);
    return new Response(JSON.stringify({ error: 'Failed to configure auto-assignment' }), { status: 500 });
  }
}
