/**
 * Organization Settings API Service
 * FSD: features/recruitment-admin/api layer
 *
 * Handles all API calls for organization settings management
 */

import { apiGet, apiPost, apiPut, ApiError } from '@/shared/api/apiClient';
import type {
  CompanyNames,
  CompanyContactInfo,
  OrganizationRecruitmentVerification,
  OrganizationDetailsFormData,
} from '@/types/organization-settings';

const ENDPOINT = '/recruitment-admin/organization-settings';

interface GetSettingsResponse {
  company_names: CompanyNames;
  contact_info: CompanyContactInfo;
  verification: OrganizationRecruitmentVerification;
}

interface UpdateSettingsResponse {
  message: string;
  data: {
    names: CompanyNames;
    contact: CompanyContactInfo;
    verification: OrganizationRecruitmentVerification;
  };
}

/**
 * Fetch all organization settings
 * GET /api/recruitment-admin/organization-settings/:organizationId
 */
export async function fetchOrganizationSettings(organizationId: string): Promise<GetSettingsResponse> {
  try {
    return await apiGet<GetSettingsResponse>(`${ENDPOINT}/${organizationId}/settings`);
  } catch (error) {
    if (error instanceof ApiError && error.status === 404) {
      throw new Error('Organization not found');
    }
    if (error instanceof ApiError && error.status === 403) {
      throw new Error('You do not have permission to access this organization');
    }
    throw error;
  }
}

/**
 * Update all organization settings at once
 * PUT /api/recruitment-admin/organization-settings/:organizationId
 */
export async function updateAllOrganizationSettings(
  organizationId: string,
  data: OrganizationDetailsFormData
): Promise<UpdateSettingsResponse> {
  try {
    return await apiPut<UpdateSettingsResponse>(`${ENDPOINT}/${organizationId}/settings`, data);
  } catch (error) {
    if (error instanceof ApiError && error.status === 403) {
      throw new Error('You do not have permission to update this organization');
    }
    if (error instanceof ApiError && error.status === 400) {
      throw new Error(error.message);
    }
    throw error;
  }
}

/**
 * Update company profile
 * POST /api/recruitment-admin/organization-settings/:organizationId/company-profile
 */
export async function updateCompanyProfile(
  organizationId: string,
  data: Partial<CompanyNames>
): Promise<{ message: string; data: CompanyNames }> {
  try {
    return await apiPost<{ message: string; data: CompanyNames }>(
      `${ENDPOINT}/${organizationId}/company-profile`,
      data
    );
  } catch (error) {
    if (error instanceof ApiError && error.status === 400) {
      throw new Error(error.message);
    }
    if (error instanceof ApiError && error.status === 403) {
      throw new Error('You do not have permission to update this organization');
    }
    throw error;
  }
}

/**
 * Update contact information
 * POST /api/recruitment-admin/organization-settings/:organizationId/contacts
 */
export async function updateContactInformation(
  organizationId: string,
  data: Partial<CompanyContactInfo>
): Promise<{ message: string; data: CompanyContactInfo }> {
  try {
    return await apiPost<{ message: string; data: CompanyContactInfo }>(
      `${ENDPOINT}/${organizationId}/contacts`,
      data
    );
  } catch (error) {
    if (error instanceof ApiError && error.status === 400) {
      throw new Error(error.message);
    }
    if (error instanceof ApiError && error.status === 403) {
      throw new Error('You do not have permission to update this organization');
    }
    throw error;
  }
}

/**
 * Update verification details or status
 * POST /api/recruitment-admin/organization-settings/:organizationId/verification
 */
export async function updateVerificationDetails(
  organizationId: string,
  data: Partial<OrganizationRecruitmentVerification> | { verification_status: string; notes?: string }
): Promise<{ message: string; data: OrganizationRecruitmentVerification }> {
  try {
    return await apiPost<{ message: string; data: OrganizationRecruitmentVerification }>(
      `${ENDPOINT}/${organizationId}/verification`,
      data
    );
  } catch (error) {
    if (error instanceof ApiError && error.status === 400) {
      throw new Error(error.message);
    }
    if (error instanceof ApiError && error.status === 403) {
      throw new Error('You do not have permission to update this organization');
    }
    throw error;
  }
}
