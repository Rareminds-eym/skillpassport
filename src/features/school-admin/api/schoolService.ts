import { useAuthStore } from '@/shared/model/authStore';
import { apiPost, apiGet } from '@/shared/api/apiClient';
import { getLogger } from '@/shared/config/logging';

const logger = getLogger('school-service');

const API_PATH = '/college-admin/school-admin';

export const createSchool = async (schoolData: any, userId: string | null = null) => {
  try {
    let uid = userId;
    if (!uid) {
      const { useAuthStore } = await import('@/shared/model/authStore');
      const user = useAuthStore.getState().user;
      if (user) uid = user.id;
    }
    if (!uid) throw new Error('User not authenticated');

    const orgData = {
      name: schoolData.name,
      organization_type: 'school',
      admin_id: uid,
      email: schoolData.email,
      phone: schoolData.phone,
      address: schoolData.address,
      city: schoolData.city,
      state: schoolData.state,
      country: schoolData.country || 'India',
      website: schoolData.website,
      description: schoolData.description,
      approval_status: 'approved',
      account_status: 'active',
      is_active: true,
    };

    const result = await apiPost(API_PATH, {
      action: 'create-school',
      ...orgData,
    });

    return { success: true, data: result as any, error: null };
  } catch (error: any) {
    logger.error('Error creating school', error, { schoolName: schoolData?.name });
    return { success: false, data: null, error: (error as Error).message };
  }
};

export const checkSchoolCode = async (name: string) => {
  try {
    const result = await apiPost(API_PATH, {
      action: 'check-school-code',
      name,
    });
    return { isUnique: (result as any).isUnique, error: null };
  } catch (error: any) {
    logger.error('Error checking school name', error, { name });
    return { isUnique: false, error: (error as Error).message };
  }
};

export const getSchoolByOwner = async (userId: string) => {
  try {
    const data = await apiPost(API_PATH, {
      action: 'get-school-by-owner',
      user_id: userId,
    });
    return { success: true, data: data as any, error: null };
  } catch (error: any) {
    logger.error('Error fetching school by owner', error, { userId });
    return { success: false, data: null, error: (error as Error).message };
  }
};

export const getSchoolById = async (schoolId: string) => {
  try {
    const data = await apiPost(API_PATH, {
      action: 'get-school-by-id',
      school_id: schoolId,
    });
    return { success: true, data: data as any, error: null };
  } catch (error: any) {
    logger.error('Error fetching school by ID', error, { schoolId });
    return { success: false, data: null, error: (error as Error).message };
  }
};

export const getAllSchools = async () => {
  try {
    const data = await apiPost(API_PATH, {
      action: 'get-all-schools',
    });
    return { success: true, data: (data as any[]) || [], error: null };
  } catch (error: any) {
    logger.error('Error fetching schools', error);
    return { success: false, data: null, error: (error as Error).message };
  }
};

export const getSchoolByEmail = async (email: string) => {
  try {
    const data = await apiPost(API_PATH, {
      action: 'get-school-by-email',
      email,
    });
    return { success: true, data: data as any, error: null };
  } catch (error: any) {
    logger.error('Error fetching school by email', error, { email });
    return { success: false, data: null, error: (error as Error).message };
  }
};
