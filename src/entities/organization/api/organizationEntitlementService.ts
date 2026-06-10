import { apiGet, apiPost } from '@/shared/api/apiClient';
import type { LicenseAssignment } from './licenseManagementService';
import { getLogger } from '@/shared/config/logging';

const logger = getLogger('organizationEntitlement');

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

export class OrganizationEntitlementService {
  async grantEntitlementsFromAssignment(assignment: LicenseAssignment): Promise<UserEntitlement[]> {
    try {
      const plans = await apiGet<any>(`/organization?action=getPlansCache&planId=${encodeURIComponent(assignment.organizationSubscriptionId)}`);
      const d = plans.data;
      let plan: any = null;
      if (Array.isArray(d)) plan = d[0];
      else plan = d;

      const featureSource = plan?.features || plan?.base_features;
      if (!featureSource) throw new Error('Plan features not found');

      const entitlements: UserEntitlement[] = [];
      const features = Array.isArray(featureSource) ? featureSource : [];

      for (const featureKey of features) {
        try {
          const data = await apiPost<any>('/organization', {
            action: 'grantEntitlement',
            userId: assignment.userId,
            featureKey,
            organizationSubscriptionId: assignment.organizationSubscriptionId,
            grantedBy: assignment.assignedBy,
            expiresAt: assignment.expiresAt,
          });
          entitlements.push(this.mapToUserEntitlement(data.data));
        } catch (err) {
          logger.error(`Error granting entitlement for ${featureKey}`, err as Error);
        }
      }
      return entitlements;
    } catch (error) {
      logger.error('Error granting entitlements from assignment', error as Error);
      throw error;
    }
  }

  async revokeEntitlementsFromAssignment(assignmentId: string): Promise<void> {
    try {
      const result = await apiGet<any[]>(`/organization?action=getPoolAssignments&poolId=${encodeURIComponent(assignmentId)}`);
      const d = result.data;
      const assignment = Array.isArray(d) ? d.find((a: any) => a.id === assignmentId) : d;
      if (!assignment) throw new Error('Assignment not found');

      await apiPost('/organization', {
        action: 'revokeEntitlements',
        userId: assignment.user_id,
        organizationSubscriptionId: assignment.organization_subscription_id,
      });
    } catch (error) {
      logger.error('Error revoking entitlements from assignment', error as Error);
      throw error;
    }
  }

  async hasOrganizationAccess(userId: string, featureKey: string): Promise<FeatureAccessResult> {
    try {
      const result = await apiGet<any[]>(`/organization?action=getUserEntitlements&userId=${encodeURIComponent(userId)}`);
      const entitlements = result.data;
      const orgEntitlement = entitlements?.find(
        (e: any) => e.feature_key === featureKey && e.granted_by_organization && e.is_active
      );
      if (orgEntitlement) return { hasAccess: true, source: 'organization', expiresAt: orgEntitlement.expires_at };

      const personalEntitlement = entitlements?.find(
        (e: any) => e.feature_key === featureKey && !e.granted_by_organization && e.is_active &&
          (!e.expires_at || new Date(e.expires_at) > new Date())
      );
      if (personalEntitlement) return { hasAccess: true, source: 'personal', expiresAt: personalEntitlement.expires_at };

      return { hasAccess: false, source: 'none' };
    } catch (error) {
      logger.error('Error checking feature access', error as Error);
      return { hasAccess: false, source: 'none' };
    }
  }

  async getUserEntitlements(userId: string): Promise<EntitlementSummary> {
    try {
      const result = await apiGet<any[]>(`/organization?action=getUserEntitlements&userId=${encodeURIComponent(userId)}`);
      const entitlements = (result.data || []).map(this.mapToUserEntitlement);
      return {
        organizationProvided: entitlements.filter(e => e.grantedByOrganization),
        selfPurchased: entitlements.filter(e => !e.grantedByOrganization),
      };
    } catch (error) {
      logger.error('Error fetching user entitlements', error as Error);
      throw error;
    }
  }

  async syncOrganizationEntitlements(subscriptionId: string): Promise<void> {
    try {
      const result = await apiGet<any[]>(`/organization?action=getSubscriptions&subId=${encodeURIComponent(subscriptionId)}`);
      const assignments = result.data;
      if (!assignments || assignments.length === 0) return;

      for (const assignment of assignments) {
        await this.revokeEntitlementsFromAssignment(assignment.id);
      }
      for (const assignment of assignments) {
        await this.grantEntitlementsFromAssignment(assignment);
      }
    } catch (error) {
      logger.error('Error syncing organization entitlements', error as Error);
      throw error;
    }
  }

  async bulkGrantEntitlements(
    userIds: string[], featureKeys: string[], organizationSubscriptionId: string, grantedBy: string
  ): Promise<UserEntitlement[]> {
    try {
      const result = await apiPost<UserEntitlement[]>('/organization', {
        action: 'bulkGrantEntitlements', userIds, featureKeys, organizationSubscriptionId, grantedBy,
      });
      return result.data;
    } catch (error) {
      logger.error('Error in bulk grant', error as Error);
      throw error;
    }
  }

  async bulkRevokeEntitlements(userIds: string[], organizationSubscriptionId: string): Promise<void> {
    try {
      await apiPost('/organization', { action: 'bulkRevokeEntitlements', userIds, organizationSubscriptionId });
    } catch (error) {
      logger.error('Error bulk revoking entitlements', error as Error);
      throw error;
    }
  }

  async getOrganizationEntitlementStats(organizationSubscriptionId: string): Promise<{
    totalMembers: number; activeEntitlements: number; featureBreakdown: Record<string, number>;
  }> {
    try {
      const result = await apiGet(`/organization?action=getOrganizationEntitlementStats&subscriptionId=${encodeURIComponent(organizationSubscriptionId)}`);
      return result.data;
    } catch (error) {
      logger.error('Error fetching entitlement stats', error as Error);
      throw error;
    }
  }

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
      updatedAt: data.updated_at,
    };
  }
}

export const organizationEntitlementService = new OrganizationEntitlementService();
