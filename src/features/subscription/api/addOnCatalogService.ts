/**
 * AddOnCatalogService
 * 
 * Service for managing add-on catalog operations
 */

import { apiGet } from '@/shared/api/apiClient';

class AddOnCatalogService {
  async getAddOns(filters = {} as any) {
    try {
      const result = await apiGet<{ success: boolean; data: any; error: string | null }>(
        '/payments/get-available-addons'
      );
      
      let filteredData = result.data || [];
      if (filters.category && filteredData.length > 0) {
        filteredData = filteredData.filter((a: any) => a.category === filters.category);
      }
      if (filters.role && filteredData.length > 0) {
        filteredData = filteredData.filter((a: any) => (!a.target_roles || a.target_roles.length === 0) || a.target_roles.includes(filters.role));
      }
      return { success: result.success ?? true, data: filteredData, error: result.error };
    } catch (error: any) {
      return { success: false, error: error.message };
    }
  }

  async getAddOnByFeatureKey(featureKey: string) {
    try {
      if (!featureKey) return { success: false, error: 'Feature key is required' };
      const result = await apiGet<{ success: boolean; data: any; error: string | null }>(
        `/payments/get-addon-by-feature-key?featureKey=${featureKey}`
      );
      return { success: result.success ?? true, data: result.data, error: result.error };
    } catch (error: any) {
      return { success: false, error: error.message };
    }
  }

  async getBundles(role?: string) {
    try {
      let url = '/payments/addon-catalog?action=getBundles';
      if (role) url += `&role=${role}`;
      const result = await apiGet<{ success: boolean; data: any; error: string | null }>(url);
      return { success: result.success ?? true, data: result.data, error: result.error };
    } catch (error: any) {
      return { success: false, error: error.message };
    }
  }

  async calculateBundleSavings(bundleId: string) {
    try {
      if (!bundleId) return { success: false, error: 'Bundle ID is required' };
      const result = await apiGet<{ success: boolean; data: any; error: string | null }>(
        `/payments/addon-catalog?action=calculateBundleSavings&bundleId=${bundleId}`
      );
      return { success: result.success ?? true, data: result.data, error: result.error };
    } catch (error: any) {
      return { success: false, error: error.message };
    }
  }
}

const addOnCatalogService = new AddOnCatalogService();
export default addOnCatalogService;
export { AddOnCatalogService };
