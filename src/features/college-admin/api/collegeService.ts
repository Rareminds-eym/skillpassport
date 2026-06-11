import { apiPost } from '@/shared/api/apiClient';
import { useAuthStore } from '@/shared/model/authStore';

export const createCollege = async (collegeData, userId = null) => {
  try {
    let uid = userId;
    if (!uid) {
      const user = useAuthStore.getState().user;
      if (user) uid = user.id;
    }
    if (!uid) throw new Error('User not authenticated');

    const result = await apiPost('/college-admin/faculty', {
      action: 'create-organization',
      organization_type: 'college',
      collegeData,
      userId: uid,
    });

    if (!result.success) {
      return { success: false, data: null, error: result.error || 'Failed to create college' };
    }

    return { success: true, data: result.data, error: null };
  } catch (error: any) {
    return { success: false, data: null, error: error.message };
  }
};

export const checkCollegeCode = async (name) => {
  try {
    const result = await apiPost('/college-admin/faculty', {
      action: 'check-org-code',
      name,
    });

    if (!result.success) {
      return { isUnique: false, error: result.error || 'Failed to check college name' };
    }

    return { isUnique: result.data?.isUnique ?? result.data?.available ?? !result.data?.exists, error: null };
  } catch (error: any) {
    return { isUnique: false, error: error.message };
  }
};

export const getCollegeByOwner = async (userId) => {
  try {
    const result = await apiPost('/college-admin/faculty', {
      action: 'get-organization-by-admin',
      userId,
    });

    if (!result.success) {
      return { success: false, data: null, error: result.error || 'Failed to fetch college' };
    }

    return { success: true, data: result.data || null, error: null };
  } catch (error: any) {
    return { success: false, data: null, error: error.message };
  }
};

export const getCollegeById = async (collegeId) => {
  try {
    const result = await apiPost('/college-admin/faculty', {
      action: 'get-organization',
      id: collegeId,
    });

    if (!result.success) {
      return { success: false, data: null, error: result.error || 'Failed to fetch college' };
    }

    return { success: true, data: result.data || null, error: null };
  } catch (error: any) {
    return { success: false, data: null, error: error.message };
  }
};

export const getAllColleges = async () => {
  try {
    const result = await apiPost('/college-admin/faculty', {
      action: 'get-organizations',
      organization_type: 'college',
    });

    if (!result.success) {
      return { success: false, data: null, error: result.error || 'Failed to fetch colleges' };
    }

    return { success: true, data: result.data || [], error: null };
  } catch (error: any) {
    return { success: false, data: null, error: error.message };
  }
};
