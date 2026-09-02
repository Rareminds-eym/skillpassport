/**
 * Organization Entity - Type Definitions
 * Core organization interfaces and types for the application
 */

// ============================================================================
// Core Organization Types
// ============================================================================

export type OrganizationType = 'school' | 'college' | 'university';

export interface Organization {
  id: string;
  name: string;
  organization_type: OrganizationType;
  description?: string;
  address?: string;
  city?: string;
  state?: string;
  country?: string;
  phone?: string;
  email?: string;
  website?: string;
  logo_url?: string;
  admin_id?: string;
  is_active?: boolean;
  verification_status?: string;
  approval_status?: string;
  account_status?: string;
  created_at?: string;
  updated_at?: string;
}

export interface OrganizationFilters {
  organizationType?: OrganizationType;
  adminId?: string;
  isActive?: boolean;
  approvalStatus?: string;
  searchTerm?: string;
  city?: string;
  state?: string;
}

// ============================================================================
// Organization Subscription Types
// ============================================================================

export interface OrganizationSubscription {
  id: string;
  organizationId: string;
  organizationType: OrganizationType;
  subscriptionPlanId: string;
  planName?: string;
  purchasedBy: string;
  totalSeats: number;
  assignedSeats: number;
  availableSeats: number;
  targetMemberType: 'educator' | 'learner' | 'both';
  status: 'active' | 'paused' | 'cancelled' | 'expired' | 'grace_period';
  startDate: string;
  endDate: string;
  autoRenew: boolean;
  pricePerSeat: number;
  totalAmount: number;
  discountPercentage: number;
  finalAmount: number;
  razorpaySubscriptionId?: string;
  razorpayOrderId?: string;
  createdAt: string;
  updatedAt: string;
  cancelledAt?: string;
  cancellationReason?: string;
}

export interface OrgSubscriptionPurchaseRequest {
  organizationId: string;
  organizationType: OrganizationType;
  planId: string;
  seatCount: number;
  targetMemberType: 'educator' | 'learner' | 'both';
  billingCycle: 'monthly' | 'annual';
  autoRenew: boolean;
  paymentMethod: string;
}

export interface PricingBreakdown {
  basePrice: number;
  seatCount: number;
  subtotal: number;
  discountPercentage: number;
  discountAmount: number;
  taxAmount: number;
  finalAmount: number;
  pricePerSeat: number;
}

export interface RenewalOptions {
  seatCount?: number;
  autoRenew?: boolean;
  billingCycle?: 'monthly' | 'annual';
}

// ============================================================================
// Organization Member Types
// ============================================================================

export interface OrganizationMember {
  id: string;
  userId: string;
  name: string;
  email: string;
  memberType: 'educator' | 'learner';
  department?: string;
  designation?: string;
  grade?: string;
  section?: string;
  hasLicense: boolean;
  assignedAt?: string;
  poolName?: string;
  licenseAssignmentId?: string;
  profilePicture?: string;
  phone?: string;
  status?: string;
}

export interface FetchMembersOptions {
  organizationId: string;
  organizationType: OrganizationType;
  memberType?: 'educator' | 'learner' | 'all';
  includeAssignmentStatus?: boolean;
  searchQuery?: string;
  limit?: number;
  offset?: number;
}

export interface FetchMembersResult {
  members: OrganizationMember[];
  total: number;
  hasMore: boolean;
}

// ============================================================================
// Organization Invitation Types
// ============================================================================

export interface OrganizationInvitation {
  id: string;
  organizationId: string;
  organizationType: OrganizationType;
  email: string;
  memberType: 'educator' | 'learner';
  invitedBy: string;
  status: 'pending' | 'accepted' | 'rejected' | 'expired';
  invitedAt: string;
  expiresAt: string;
  acceptedAt?: string;
  rejectedAt?: string;
}

// ============================================================================
// Organization Entitlement Types
// ============================================================================

export interface OrganizationEntitlement {
  id: string;
  userId: string;
  organizationId: string;
  organizationType: OrganizationType;
  subscriptionId: string;
  planId: string;
  status: 'active' | 'expired' | 'cancelled';
  startDate: string;
  endDate: string;
  features: string[];
  metadata?: Record<string, any>;
}

// ============================================================================
// Organization Payment Types
// ============================================================================

export interface OrganizationPurchaseData {
  organizationId: string;
  organizationType: OrganizationType;
  planId: string;
  seatCount: number;
  billingCycle: 'monthly' | 'annual';
  amount: number;
  currency: string;
  purchasedBy: string;
  metadata?: Record<string, any>;
}

export interface PoolAssignmentRawUser {
  email?: string;
  first_name?: string;
  last_name?: string;
  full_name?: string;
  name?: string;
  firstName?: string;
  lastName?: string;
}

export interface PoolAssignmentRawItem {
  id?: string;
  user_id: string;
  assigned_at: string;
  full_name?: string;
  name?: string;
  email?: string;
  user?: PoolAssignmentRawUser;
  users?: PoolAssignmentRawUser;
}

export interface PoolAssignmentApiResponse {
  data?: PoolAssignmentRawItem[];
}

export interface NormalizedPoolMemberAssignment {
  id: string;
  name: string;
  email: string;
  assignedAt: string;
  licenseAssignmentId?: string;
}

