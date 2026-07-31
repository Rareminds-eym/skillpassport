/**
 * Organization Settings Hook
 * FSD: features/recruitment-admin/model layer
 *
 * Manages organization settings state and API interactions
 */

import { useState, useCallback, useEffect } from 'react';
import {
  fetchOrganizationSettings,
  updateAllOrganizationSettings,
  updateCompanyProfile,
  updateContactInformation,
  updateVerificationDetails,
} from '../api/organizationService';
import type {
  CompanyNames,
  CompanyContactInfo,
  OrganizationRecruitmentVerification,
  OrganizationDetailsFormData,
} from '@/types/organization-settings';

interface OrganizationSettingsState {
  company_names: CompanyNames | null;
  contact_info: CompanyContactInfo | null;
  verification: OrganizationRecruitmentVerification | null;
}

export const useOrganizationSettings = (organizationId: string) => {
  const [data, setData] = useState<OrganizationSettingsState>({
    company_names: null,
    contact_info: null,
    verification: null,
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Fetch all settings
  const fetchSettings = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await fetchOrganizationSettings(organizationId);
      setData(response);
    } catch (err: unknown) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to fetch settings';
      setError(errorMessage);
      console.error('Error fetching settings:', err);
    } finally {
      setLoading(false);
    }
  }, [organizationId]);

  // Update company profile
  const updateProfile = useCallback(
    async (newData: Partial<CompanyNames>) => {
      setLoading(true);
      setError(null);
      try {
        const response = await updateCompanyProfile(organizationId, newData);
        setData((prev) => ({
          ...prev,
          company_names: response.data,
        }));
        return response.data;
      } catch (err: unknown) {
        const errorMsg = err instanceof Error ? err.message : 'Failed to update profile';
        setError(errorMsg);
        throw err;
      } finally {
        setLoading(false);
      }
    },
    [organizationId]
  );

  // Update contact info
  const updateContacts = useCallback(
    async (newData: Partial<CompanyContactInfo>) => {
      setLoading(true);
      setError(null);
      try {
        const response = await updateContactInformation(organizationId, newData);
        setData((prev) => ({
          ...prev,
          contact_info: response.data,
        }));
        return response.data;
      } catch (err: unknown) {
        const errorMsg = err instanceof Error ? err.message : 'Failed to update contacts';
        setError(errorMsg);
        throw err;
      } finally {
        setLoading(false);
      }
    },
    [organizationId]
  );

  // Update verification
  const updateVerification = useCallback(
    async (newData: Partial<OrganizationRecruitmentVerification> | { verification_status: string; notes?: string }) => {
      setLoading(true);
      setError(null);
      try {
        const response = await updateVerificationDetails(organizationId, newData);
        setData((prev) => ({
          ...prev,
          verification: response.data,
        }));
        return response.data;
      } catch (err: unknown) {
        const errorMsg = err instanceof Error ? err.message : 'Failed to update verification';
        setError(errorMsg);
        throw err;
      } finally {
        setLoading(false);
      }
    },
    [organizationId]
  );

  // Update all at once
  const updateAll = useCallback(
    async (allData: OrganizationDetailsFormData) => {
      setLoading(true);
      setError(null);
      try {
        const response = await updateAllOrganizationSettings(organizationId, allData);
        setData({
          company_names: response.data.names,
          contact_info: response.data.contact,
          verification: response.data.verification,
        });
        return response.data;
      } catch (err: unknown) {
        const errorMsg = err instanceof Error ? err.message : 'Failed to update settings';
        setError(errorMsg);
        throw err;
      } finally {
        setLoading(false);
      }
    },
    [organizationId]
  );

  // Fetch on mount
  useEffect(() => {
    if (organizationId) {
      fetchSettings();
    }
  }, [organizationId, fetchSettings]);

  return {
    data,
    loading,
    error,
    refetch: fetchSettings,
    updateProfile,
    updateContacts,
    updateVerification,
    updateAll,
  };
};
