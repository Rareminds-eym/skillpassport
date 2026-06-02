import { apiGet } from '@/shared/api/apiClient';
import { useAuthStore } from '@/shared/model/authStore';
import type { User, UserProfileExtended, UserDocument, UserActivity } from '../model/types';

export const getUser = async (userId: string): Promise<User | null> => {
  try {
    const response: any = await apiGet(`/user/by-id?id=${encodeURIComponent(userId)}`);
    return response?.data?.user ?? null;
  } catch {
    return null;
  }
};

export const getUsers = async (filters?: {
  role?: string;
  isActive?: boolean;
  search?: string;
  college_id?: string;
}): Promise<User[]> => {
  const params = new URLSearchParams();
  if (filters?.role) params.set('role', filters.role);
  if (filters?.search) params.set('search', filters.search);
  const qs = params.toString();
  const response: any = await apiGet(`/user/list${qs ? `?${qs}` : ''}`);
  return response?.data?.users ?? [];
};

export const getCurrentUser = async (): Promise<User | null> => {
  const user = useAuthStore.getState().user;
  if (!user) return null;
  return {
    id: user.id,
    email: user.email || '',
    role: user.user_metadata?.role,
    name: user.user_metadata?.full_name || user.user_metadata?.name,
    user_metadata: user.user_metadata,
  };
};

export const getUserProfile = async (userId: string): Promise<UserProfileExtended | null> => {
  try {
    const response: any = await apiGet(`/user/profile-extended?userId=${encodeURIComponent(userId)}`);
    return response?.data?.profile ?? null;
  } catch (error: any) {
    if (error.status === 404) return null;
    throw error;
  }
};

export const getUserDocuments = async (userId: string): Promise<UserDocument[]> => {
  const response: any = await apiGet(`/user/documents?userId=${encodeURIComponent(userId)}`);
  return response?.data?.documents ?? [];
};

export const getUserActivity = async (userId: string, limit: number = 50): Promise<UserActivity[]> => {
  const response: any = await apiGet(`/user/activity?userId=${encodeURIComponent(userId)}&limit=${limit}`);
  return response?.data?.activities ?? [];
};

export const getUserActivityLog = async (userId: string, limit: number = 50): Promise<any[]> => {
  const response: any = await apiGet(`/user/activity?userId=${encodeURIComponent(userId)}&limit=${limit}`);
  return response?.data?.activities ?? [];
};

export const getUserStats = async (): Promise<{
  total: number;
  active: number;
  inactive: number;
  by_role: Record<string, number>;
}> => {
  const response: any = await apiGet('/user/stats');
  return response?.data ?? { total: 0, active: 0, inactive: 0, by_role: {} };
};

export const getUserRoleHistory = async (userId: string): Promise<any[]> => {
  const response: any = await apiGet(`/user/role-history?userId=${encodeURIComponent(userId)}`);
  return response?.data?.history ?? [];
};

export const getBulkImportStatus = async (importId: string): Promise<any> => {
  const response: any = await apiPost('/user/actions', { action: 'get-bulk-import-status', importId });
  return response?.data;
};
