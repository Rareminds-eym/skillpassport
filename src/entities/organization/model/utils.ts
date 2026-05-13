/**
 * Organization Entity - Utility Functions
 * Helper functions for organization data manipulation
 */

import { isSameEntity } from '@/shared/lib/comparison';
import type { Organization, OrganizationType, PricingBreakdown } from '@/shared/types';

// ============================================================================
// Organization Display Utilities
// ============================================================================

export const getOrganizationDisplayName = (org: Organization | null | undefined): string => {
  if (!org) return 'Unknown Organization';
  return org.name || 'Unnamed Organization';
};

export const getOrganizationTypeLabel = (type: OrganizationType): string => {
  const labels: Record<OrganizationType, string> = {
    school: 'School',
    college: 'College',
    university: 'University',
  };
  return labels[type] || type;
};

// ============================================================================
// Volume Discount Calculation
// ============================================================================

export const calculateVolumeDiscount = (seatCount: number): number => {
  if (seatCount >= 500) return 30;
  if (seatCount >= 100) return 20;
  if (seatCount >= 50) return 10;
  return 0;
};

export const calculateBulkPricing = (
  basePricePerSeat: number,
  seatCount: number
): PricingBreakdown => {
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
};

// ============================================================================
// Organization Filtering Utilities
// ============================================================================

export const filterOrganizationsByType = (
  organizations: Organization[],
  type: OrganizationType
): Organization[] => {
  return organizations.filter(org => org.organization_type === type);
};

export const filterActiveOrganizations = (organizations: Organization[]): Organization[] => {
  return organizations.filter(org => org.is_active !== false);
};

export const searchOrganizations = (
  organizations: Organization[],
  searchTerm: string
): Organization[] => {
  const term = searchTerm.toLowerCase();
  return organizations.filter(org => {
    const name = org.name?.toLowerCase() || '';
    const city = org.city?.toLowerCase() || '';
    const state = org.state?.toLowerCase() || '';
    return name.includes(term) || city.includes(term) || state.includes(term);
  });
};

// ============================================================================
// Organization Sorting Utilities
// ============================================================================

export const sortOrganizationsByName = (organizations: Organization[]): Organization[] => {
  return [...organizations].sort((a, b) => {
    const nameA = a.name?.toLowerCase() || '';
    const nameB = b.name?.toLowerCase() || '';
    return nameA.localeCompare(nameB);
  });
};

// ============================================================================
// Organization Comparison Utilities
// ============================================================================

export const isSameOrganization = isSameEntity<Organization>;

// ============================================================================
// Subscription Utilities
// ============================================================================

export const getAvailableSeats = (totalSeats: number, assignedSeats: number): number => {
  return Math.max(0, totalSeats - assignedSeats);
};

export const calculateSeatUtilization = (
  totalSeats: number,
  assignedSeats: number
): number => {
  if (totalSeats === 0) return 0;
  return Math.round((assignedSeats / totalSeats) * 100);
};

export const isSubscriptionActive = (
  status: string,
  endDate: string
): boolean => {
  if (status !== 'active') return false;
  return new Date(endDate) > new Date();
};

// ============================================================================
// Member Utilities
// ============================================================================

export const getMemberTypeLabel = (memberType: 'educator' | 'learner'): string => {
  return memberType === 'educator' ? 'Educator' : 'Learner';
};

export const formatMemberCount = (count: number, memberType: 'educator' | 'learner'): string => {
  const label = memberType === 'educator' ? 'Educator' : 'Learner';
  return `${count} ${label}${count !== 1 ? 's' : ''}`;
};
