/**
 * Organization Entitlement Service
 * 
 * Manages entitlement granting and revoking based on license assignments.
 * Handles both organization-provided and self-purchased entitlements.
 */

import { supabase } from '@/lib/supabaseClient';
import type { LicenseAssignment } from './licenseManagementService';

// ============================================================================
// Types & Interfaces
// ============================================================================

export interface UserEntitlement {
  id: string;
  userId: string;
  featureKey: string;
  isActive: boolean;
  grantedByOrganization: boolean;
  organizationSubscriptionId?: string;
  grantedBy?: string;
  expiresAt?: string;
  createdAt: string;
  updatedAt: string;
}

export interface EntitlementSummary {
  organizationProvided: UserEntitlement[];
  selfPurchased: UserEntitlement[];
}

export interface FeatureAccessResult {
  hasAccess: boolean;
  source: 'organization' | 'personal' | 'none';
  expiresAt?: string;
}

// ============================================================================
// Service Class
// ============================================================================

export class OrganizationEntitlementService {
  /**
   * Grant entitlements to a user based on their license assignment
   */
  async grantEntitlementsFromAssignment(
    assignment: LicenseAssignment
  ): Promise<UserEntitlement[]> {
    try {
      // Get subscription plan features
      const { data: subscription } = await supabase
        .from('organization_subscriptions')
        .select('subscription_plan_id')
        .eq('id', assignment.organizationSubscriptionId)
        .single();

      if (!subscription) {
        throw new Error('Subscription not found');
      }

      // Get plan features
      const { data: plan } = await supabase
        .from('subscription_plans')
        .select('features')
        .eq('id', subscription.subscription_plan_id)
        .single();

      if (!plan || !plan.features) {
        throw new Error('Plan features not found');
      }

      // Grant entitlements for each feature
      const entitlements: UserEntitlement[] = [];
      const features = Array.isArray(plan.features) ? plan.features : [];

      for (const featureKey of features) {
        const { data, error } = await supabase
          .from('user_entitlements')
          .insert({
            user_id: assignment.userId,
            feature_key: featureKey,
            is_active: true,
            granted_by_organization: true,
            organization_subscription_id: assignment.organizationSubscriptionId,
            granted_by: assignment.assignedBy,
            expires_at: assignment.expiresAt
          })
          .select()
          .single();

        if (error) {
          console.error(`Error granting entitlement for ${featureKey}:`, error);
          continue;
        }

        entitlements.push(this.mapToUserEntitlement(data));
      }

      return entitlements;
    } catch (error) {
      console.error('Error granting entitlements from assignment:', error);
      throw error;
    }
  }

  /**
   * Revoke entitlements when a license is unassigned
   */
  async revokeEntitlementsFromAssignment(assignmentId: string): Promise<void> {
    try {
      // Get assignment details
      const { data: assignment } = await supabase
        .from('license_assignments')
        .select('user_id, organization_subscription_id')
        .eq('id', assignmentId)
        .single();

      if (!assignment) {
        throw new Error('Assignment not found');
      }

      // Deactivate all organization-provided entitlements for this user
      const { error } = await supabase
        .from('user_entitlements')
        .update({
          is_active: false,
          updated_at: new Date().toISOString()
        })
        .eq('user_id', assignment.user_id)
        .eq('organization_subscription_id', assignment.organization_subscription_id)
        .eq('granted_by_organization', true);

      if (error) throw error;
    } catch (error) {
      console.error('Error revoking entitlements from assignment:', error);
      throw error;
    }
  }

  /**
   * Check if a user has access to a feature through organization
   */
  async hasOrganizationAccess(
    userId: string,
    featureKey: string
  ): Promise<FeatureAccessResult> {
    try {
      // Check organization-provided access
      const { data: orgEntitlement } = await supabase
        .from('user_entitlements')
        .select(`
          *,
          license_assignments!inner(
            status,
            expires_at
          )
        `)
        .eq('user_id', userId)
        .eq('feature_key', featureKey)
        .eq('granted_by_organization', true)
        .eq('is_active', true)
        .single();

      if (orgEntitlement) {
        return {
          hasAccess: true,
          source: 'organization',
          expiresAt: orgEntitlement.expires_at
        };
      }

      // Check personal subscription
      const { data: personalEntitlement } = await supabase
        .from('user_entitlements')
        .select('*')
        .eq('user_id', userId)
        .eq('feature_key', featureKey)
        .eq('granted_by_organization', false)
        .eq('is_active', true)
        .or(`expires_at.is.null,expires_at.gt.${new Date().toISOString()}`)
        .single();

      if (personalEntitlement) {
        return {
          hasAccess: true,
          source: 'personal',
          expiresAt: personalEntitlement.expires_at
        };
      }

      return { hasAccess: false, source: 'none' };
    } catch (error) {
      console.error('Error checking feature access:', error);
      return { hasAccess: false, source: 'none' };
    }
  }

  /**
   * Get all entitlements for a user, separated by source
   */
  async getUserEntitlements(userId: string): Promise<EntitlementSummary> {
    try {
      const { data, error } = await supabase
        .from('user_entitlements')
        .select('*')
        .eq('user_id', userId)
        .eq('is_active', true);

      if (error) throw error;

      const entitlements = (data || []).map(this.mapToUserEntitlement);

      return {
        organizationProvided: entitlements.filter(e => e.grantedByOrganization),
        selfPurchased: entitlements.filter(e => !e.grantedByOrganization)
      };
    } catch (error) {
      console.error('Error fetching user entitlements:', error);
      throw error;
    }
  }

  /**
   * Sync entitlements when a subscription changes
   */
  async syncOrganizationEntitlements(subscriptionId: string): Promise<void> {
    try {
      // Get all active assignments for this subscription
      const { data: assignments } = await supabase
        .from('license_assignments')
        .select('*')
        .eq('organization_subscription_id', subscriptionId)
        .eq('status', 'active');

      if (!assignments || assignments.length === 0) {
        return;
      }

      // Revoke existing entitlements
      for (const assignment of assignments) {
        await this.revokeEntitlementsFromAssignment(assignment.id);
      }

      // Re-grant entitlements with updated features
      for (const assignment of assignments) {
        await this.grantEntitlementsFromAssignment(assignment);
      }
    } catch (error) {
      console.error('Error syncing organization entitlements:', error);
      throw error;
    }
  }

  /**
   * Bulk grant entitlements to multiple users
   */
  async bulkGrantEntitlements(
    userIds: string[],
    featureKeys: string[],
    organizationSubscriptionId: string,
    grantedBy: string
  ): Promise<UserEntitlement[]> {
    const entitlements: UserEntitlement[] = [];

    for (const userId of userIds) {
      for (const featureKey of featureKeys) {
        try {
          const { data, error } = await supabase
            .from('user_entitlements')
            .insert({
              user_id: userId,
              feature_key: featureKey,
              is_active: true,
              granted_by_organization: true,
              organization_subscription_id: organizationSubscriptionId,
              granted_by: grantedBy
            })
            .select()
            .single();

          if (error) {
            console.error(`Error granting ${featureKey} to ${userId}:`, error);
            continue;
          }

          entitlements.push(this.mapToUserEntitlement(data));
        } catch (error) {
          console.error(`Error in bulk grant for ${userId}:`, error);
        }
      }
    }

    return entitlements;
  }

  /**
   * Bulk revoke entitlements from multiple users
   */
  async bulkRevokeEntitlements(
    userIds: string[],
    organizationSubscriptionId: string
  ): Promise<void> {
    try {
      const { error } = await supabase
        .from('user_entitlements')
        .update({
          is_active: false,
          updated_at: new Date().toISOString()
        })
        .in('user_id', userIds)
        .eq('organization_subscription_id', organizationSubscriptionId)
        .eq('granted_by_organization', true);

      if (error) throw error;
    } catch (error) {
      console.error('Error bulk revoking entitlements:', error);
      throw error;
    }
  }

  /**
   * Get organization entitlement statistics
   */
  async getOrganizationEntitlementStats(organizationSubscriptionId: string): Promise<{
    totalMembers: number;
    activeEntitlements: number;
    featureBreakdown: Record<string, number>;
  }> {
    try {
      const { data: entitlements } = await supabase
        .from('user_entitlements')
        .select('user_id, feature_key')
        .eq('organization_subscription_id', organizationSubscriptionId)
        .eq('granted_by_organization', true)
        .eq('is_active', true);

      if (!entitlements) {
        return {
          totalMembers: 0,
          activeEntitlements: 0,
          featureBreakdown: {}
        };
      }

      const uniqueMembers = new Set(entitlements.map(e => e.user_id));
      const featureBreakdown: Record<string, number> = {};

      entitlements.forEach(e => {
        featureBreakdown[e.feature_key] = (featureBreakdown[e.feature_key] || 0) + 1;
      });

      return {
        totalMembers: uniqueMembers.size,
        activeEntitlements: entitlements.length,
        featureBreakdown
      };
    } catch (error) {
      console.error('Error fetching entitlement stats:', error);
      throw error;
    }
  }

  /**
   * Map database record to UserEntitlement interface
   */
  private mapToUserEntitlement(data: any): UserEntitlement {
    return {
      id: data.id,
      userId: data.user_id,
      featureKey: data.feature_key,
      isActive: data.is_active,
      grantedByOrganization: data.granted_by_organization,
      organizationSubscriptionId: data.organization_subscription_id,
      grantedBy: data.granted_by,
      expiresAt: data.expires_at,
      createdAt: data.created_at,
      updatedAt: data.updated_at
    };
  }
}

// Export singleton instance
export const organizationEntitlementService = new OrganizationEntitlementService();
