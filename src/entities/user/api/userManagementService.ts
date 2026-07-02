import { useAuthStore } from '@/shared/model/authStore';
import { apiGet, apiPost } from '@/shared/api/apiClient';
import userApiService from './userApiService';
import type { QualificationData, ImportError, UserRoleHistoryRecord } from '@/types/LearnerManagement';

const { unifiedSignup } = userApiService;

async function fileToBase64(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => { const result = reader.result as string; resolve(result.split(',')[1] || result); };
    reader.onerror = () => reject(new Error('Failed to read file'));
    reader.readAsDataURL(file);
  });
}

export interface UserProfile {
  id: string;
  user_id: string;
  date_of_birth?: string;
  gender?: 'male' | 'female' | 'other' | 'prefer_not_to_say';
  blood_group?: string;
  nationality?: string;
  phone_primary?: string;
  phone_secondary?: string;
  epdatedAt: string;
  last_activity_at?: string;
}

export interface UserProfileExtended {
  id: string;
  user_id: string;
  middle_name?: string;
  date_of_birth?: string;
  gender?: string;
  blood_group?: string;
  nationality?: string;
  phone_primary?: string;
  phone_secondary?: string;
  email_secondary?: string;
  emergency_contact_name?: string;
  emergency_contact_phone?: string;
  emergency_contact_relation?: string;
  current_address?: string;
  current_city?: string;
  current_state?: string;
  current_country?: string;
  current_pincode?: string;
  designation?: string;
  department?: string;
  employee_id?: string;
  date_of_joining?: string;
  years_of_experience?: number;
  specialization?: string;
  qualifications?: QualificationData[];
  linkedin_url?: string;
  twitter_url?: string;
  github_url?: string;
  portfolio_url?: string;
  bio?: string;
  interests?: string[];
  languages_known?: string[];
  hobbies?: string[];
  profile_completion_percentage?: number;
  is_verified?: boolean;
  verified_at?: string;
}

export interface UserDocument {
  id: string;
  user_id: string;
  document_type: string;
  document_name: string;
  document_url: string;
  file_size?: number;
  file_type?: string;
  verification_status: 'pending' | 'verified' | 'rejected';
  verified_by?: string;
  verified_at?: string;
  rejection_reason?: string;
  uploaded_at: string;
  expires_at?: string;
}

export interface UserActivity {
  id: string;
  user_id: string;
  activity_type: string;
  activity_description?: string;
  ip_address?: string;
  user_agent?: string;
  device_info?: Record<string, string | number | boolean>;
  location_info?: Record<string, string | number | boolean>;
  metadata?: Record<string, any>;
  created_at: string;
}

export interface User {
  id: string;
  email: string;
  firstName?: string;
  lastName?: string;
  role: string;
  isActive: boolean;
  organizationId?: string | null;
  phone?: string | null;
  metadata?: Record<string, string | number | boolean>;
  createdAt?: string;
  updatedAt?: string;
}

export interface CreateUserData {
  email: string;
  password: string;
  firstName?: string;
  lastName?: string;
  role: string;
  metadata?: Record<string, string | number | boolean>;
}

export interface UpdateUserData {
  firstName?: string;
  lastName?: string;
  role?: string;
  isActive?: boolean;
  metadata?: Record<string, string | number | boolean>;
}

export interface BulkImportResult {
  id: string;
  total_records: number;
  successful_records: number;
  failed_records: number;
  status: string;
  error_log: ImportError[];
}

class UserManagementService {
  async getUsers(filters?: {
    role?: string;
    isActive?: boolean;
    search?: string;
    college_id?: string;
  }): Promise<User[]> {
    const params = new URLSearchParams();
    if (filters?.role) params.set('role', filters.role);
    if (filters?.search) params.set('search', filters.search);
    const qs = params.toString();
    const response: any = await apiGet(`/user/list${qs ? `?${qs}` : ''}`);
    return response?.data?.users ?? [];
  }

  async getUser(userId: string): Promise<User | null> {
    try {
      const response: any = await apiGet(`/user/by-id?id=${encodeURIComponent(userId)}`);
      return response?.data?.user ?? null;
    } catch {
      return null;
    }
  }

  async createUser(userData: CreateUserData): Promise<User> {
    const firstName = userData.firstName || '';
    const lastName = userData.lastName || '';

    const roleMapping: Record<string, string> = {
      'learner': 'learner',
      'educator': 'school_educator',
      'school_educator': 'school_educator',
      'college_educator': 'college_educator',
      'recruiter': 'recruiter',
      'admin': 'school_admin',
      'school_admin': 'school_admin',
      'college_admin': 'college_admin',
      'university_admin': 'university_admin',
    };

    const mappedRole = roleMapping[userData.role] || 'learner';

    const result = await unifiedSignup({
      email: userData.email,
      password: userData.password,
      firstName,
      lastName,
      role: mappedRole as any,
      phone: (userData.metadata as any)?.phone || null,
      dateOfBirth: new Date().toISOString().split('T')[0],
      country: 'US',
      state: 'CA',
      city: 'San Francisco',
      preferredLanguage: 'en',
    });

    if (!result.success || !result.user?.id) {
      throw new Error(result.error || 'Failed to create user');
    }

    const response: any = await apiPost('/user/update', {
      id: result.user.id,
      firstName: userData.firstName,
      lastName: userData.lastName,
      role: userData.role,
      metadata: userData.metadata,
    });
    const user = response?.data?.user;
    if (!user) throw new Error('Failed to update user');

    await this.logActivity(result.user.id, 'user_created', 'User account created');
    return user;
  }

  async updateUser(userId: string, userData: UpdateUserData): Promise<User> {
    const response: any = await apiPost('/user/update', { id: userId, ...userData });
    const user = response?.data?.user;
    if (!user) throw new Error('Failed to update user');

    await this.logActivity(userId, 'profile_updated', 'User profile updated');
    return user;
  }

  async deleteUser(userId: string): Promise<void> {
    await apiPost('/user/delete', { id: userId });
    await this.logActivity(userId, 'user_deactivated', 'User account deactivated');
  }

  async changeUserRole(
    userId: string,
    newRole: string,
    reason?: string
  ): Promise<void> {
    await apiPost('/user/change-role', {
      user_id: userId,
      new_role: newRole,
      reason,
    });
  }

  async getUserProfile(userId: string): Promise<UserProfileExtended | null> {
    try {
      const response: any = await apiGet(`/user/profile-extended?userId=${encodeURIComponent(userId)}`);
      return response?.data?.profile ?? null;
    } catch {
      return null;
    }
  }

  async updateUserProfile(
    userId: string,
    profileData: Partial<UserProfileExtended>
  ): Promise<UserProfileExtended> {
    const response: any = await apiPost('/user/profile-extended', {
      user_id: userId,
      ...profileData,
    });
    const profile = response?.data?.profile;
    if (!profile) throw new Error('Failed to update profile');
    return profile;
  }

  async getUserDocuments(userId: string): Promise<UserDocument[]> {
    const response: any = await apiGet(`/user/documents?userId=${encodeURIComponent(userId)}`);
    return response?.data?.documents ?? [];
  }

  async uploadDocument(
    userId: string,
    file: File,
    documentType: string
  ): Promise<UserDocument> {
    const fileExt = file.name.split('.').pop();
    const fileName = `${userId}/${documentType}/${Date.now()}.${fileExt}`;

    const base64 = await fileToBase64(file);
    const uploadResult: any = await apiPost('/college-admin/storage', {
      action: 'upload', bucket: 'user-documents', path: fileName, file_base64: base64, content_type: file.type || 'application/octet-stream',
    });
    const publicUrl = uploadResult?.data?.publicUrl;

    const response: any = await apiPost('/user/update', {
      id: userId,
      documents: {
        user_id: userId,
        document_type: documentType,
        document_name: file.name,
        document_url: publicUrl,
        file_size: file.size,
        file_type: file.type,
      },
    });
    return response?.data;
  }

  async verifyDocument(
    documentId: string,
    status: 'verified' | 'rejected',
    reason?: string
  ): Promise<void> {
    const currentUser = (await import('@/shared/model/authStore')).useAuthStore.getState().user;
    if (!currentUser.user) throw new Error('Not authenticated');

    await apiPost('/user/actions', {
      action: 'verify-document',
      documentId,
      verification_status: status,
      verified_by: currentUser.user.id,
      verified_at: new Date().toISOString(),
      ...(status === 'rejected' && reason ? { rejection_reason: reason } : {}),
    });
  }

  async getUserActivity(
    userId: string,
    limit: number = 50
  ): Promise<UserActivity[]> {
    const response: any = await apiGet(`/user/activity?userId=${encodeURIComponent(userId)}&limit=${limit}`);
    return response?.data?.activities ?? [];
  }

  async logActivity(
    userId: string,
    activityType: string,
    description?: string,
    metadata?: Record<string, string | number | boolean>
  ): Promise<void> {
    await apiPost('/user/log-activity', {
      user_id: userId,
      activity_type: activityType,
      description: description || '',
      metadata: metadata || {},
    });
  }

  async bulkImportUsers(file: File): Promise<BulkImportResult> {
    const currentUser = (await import('@/shared/model/authStore')).useAuthStore.getState().user;
    if (!currentUser.user) throw new Error('Not authenticated');

    const fileName = `bulk-imports/${Date.now()}_${file.name}`;
    const base64 = await fileToBase64(file);
    const uploadResult: any = await apiPost('/college-admin/storage', {
      action: 'upload', bucket: 'user-documents', path: fileName, file_base64: base64, content_type: file.type || 'application/octet-stream',
    });
    const publicUrl = uploadResult?.data?.publicUrl;

    const response: any = await apiPost('/user/actions', {
      action: 'create-bulk-import',
      imported_by: currentUser.user.id,
      file_name: file.name,
      file_url: publicUrl,
    });
    return response?.data;
  }

  async getBulkImportStatus(importId: string): Promise<BulkImportResult> {
    const response: any = await apiPost('/user/actions', { action: 'get-bulk-import-status', importId });
    return response?.data;
  }

  async getUserStats(): Promise<{
    total: number;
    active: number;
    inactive: number;
    by_role: Record<string, number>;
  }> {
    const response: any = await apiGet('/user/stats');
    return response?.data ?? { total: 0, active: 0, inactive: 0, by_role: {} };
  }

  async resetUserPassword(userId: string, newPassword: string): Promise<void> {
    const { apiPost } = await import('@/shared/api/apiClient');
    const res = (await apiPost('/auth/admin-reset-password', {
      user_id: userId,
      new_password: newPassword
    })) as any;
    if (!res.success) {
      throw new Error(res.error || 'Failed to reset password');
    }
  }

  async getUserRoleHistory(userId: string): Promise<UserRoleHistoryRecord[]> {
    const response: any = await apiGet(`/user/role-history?userId=${encodeURIComponent(userId)}`);
    return response?.data?.history ?? [];
  }
}

export const userManagementService = new UserManagementService();
