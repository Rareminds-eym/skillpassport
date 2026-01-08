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
    const body = await request.json() as { planId: string; seatCount: number };
    const { planId, seatCount } = body;

    if (!planId || !seatCount || seatCount < 1) {
      return new Response(JSON.stringify({ error: 'Invalid planId or seatCount' }), { status: 400 });
    }

    // Get plan details
    const { data: plan, error: planError } = await supabase
      .from('subscription_plans')
      .select('price')
      .eq('id', planId)
      .single();

    if (planError || !plan) {
      return new Response(JSON.stringify({ error: 'Plan not found' }), { status: 404 });
    }

    const pricing = calculateBulkPricing(plan.price, seatCount);

    return new Response(JSON.stringify({ success: true, pricing }), { status: 200 });
  } catch (error) {
    console.error('Error calculating pricing:', error);
    return new Response(JSON.stringify({ error: 'Failed to calculate pricing' }), { status: 500 });
  }
}

/**
 * POST /org-subscriptions/purchase
 * Purchase organization subscription with Razorpay integration
 */
export async function handlePurchaseOrgSubscription(
  request: Request,
  env: Env,
  supabase: SupabaseClient,
  userId: string
): Promise<Response> {
  try {
    const body = await request.json() as OrganizationSubscriptionRequest;
    const { organizationId, organizationType, planId, seatCount, targetMemberType, billingCycle, autoRenew } = body;

    // Validate required fields
    if (!organizationId || !organizationType || !planId || !seatCount || !targetMemberType || !billingCycle) {
      return new Response(JSON.stringify({ error: 'Missing required fields' }), { status: 400 });
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

    // Calculate pricing
    const pricing = calculateBulkPricing(plan.price, seatCount);

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
 */
export async function handleBulkAssignLicenses(
  request: Request,
  env: Env,
  supabase: SupabaseClient,
  userId: string
): Promise<Response> {
  try {
    const body = await request.json() as BulkAssignmentRequest;
    const { poolId, userIds } = body;

    if (!poolId || !userIds || !Array.isArray(userIds) || userIds.length === 0) {
      return new Response(JSON.stringify({ error: 'Invalid poolId or userIds' }), { status: 400 });
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
