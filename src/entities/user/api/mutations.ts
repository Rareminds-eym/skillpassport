import { useAuthStore } from '@/shared/model/authStore';
import { apiPost, apiGet } from '@/shared/api/apiClient';
import userApiService from '@/entities/user/api/userApiService';
import type {
  User,
  CreateUserData,
  UpdateUserData,
  UserProfileExtended,
  BulkImportResult,
} from '..';
import { mapRoleToWorkerAPI } from '../model/utils';

const { unifiedSignup } = userApiService;

async function fileToBase64(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => { const result = reader.result as string; resolve(result.split(',')[1] || result); };
    reader.onerror = () => reject(new Error('Failed to read file'));
    reader.readAsDataURL(file);
  });
}

export const createUser = async (userData: CreateUserData): Promise<User> => {
  const firstName = userData.firstName || '';
  const lastName = userData.lastName || '';
  const mappedRole = mapRoleToWorkerAPI(userData.role);

  const result = await unifiedSignup({
    email: userData.email,
    password: userData.password,
    firstName,
    lastName,
    role: mappedRole as any,
    phone: (userData.metadata as any)?.phone || null,
  });

  if (!result.success || !result.data?.userId) {
    throw new Error(result.error || 'Failed to create user');
  }

  const response: any = await apiPost('/user/update', {
    id: result.data.userId,
    firstName: userData.firstName,
    lastName: userData.lastName,
    role: userData.role,
    metadata: userData.metadata,
  });
  const user = response?.data?.user;
  if (!user) throw new Error('Failed to update user after creation');

  await logActivity(result.data.userId, 'user_created', 'User account created');
  return user;
};

export const updateUser = async (userId: string, userData: UpdateUserData): Promise<User> => {
  const response: any = await apiPost('/user/update', { id: userId, ...userData });
  const user = response?.data?.user;
  if (!user) throw new Error('Failed to update user');

  await logActivity(userId, 'profile_updated', 'User profile updated');
  return user;
};

export const deleteUser = async (userId: string): Promise<void> => {
  await apiPost('/user/delete', { id: userId });
  await logActivity(userId, 'user_deactivated', 'User account deactivated');
};

export const changeUserRole = async (
  userId: string,
  newRole: string,
  reason?: string
): Promise<void> => {
  await apiPost('/user/change-role', {
    user_id: userId,
    new_role: newRole,
    reason,
  });
};

export const updateUserProfile = async (
  userId: string,
  profileData: Partial<UserProfileExtended>
): Promise<UserProfileExtended> => {
  const response: any = await apiPost('/user/profile-extended', {
    user_id: userId,
    ...profileData,
  });
  const profile = response?.data?.profile;
  if (!profile) throw new Error('Failed to update profile');
  return profile;
};

export const uploadDocument = async (
  userId: string,
  file: File,
  documentType: string
): Promise<any> => {
  const fileExt = file.name.split('.').pop();
  const fileName = `${userId}/${documentType}/${Date.now()}.${fileExt}`;

  const base64 = await fileToBase64(file);
  const uploadResult: any = await apiPost('/college-admin/storage', {
    action: 'upload', bucket: 'user-documents', path: fileName, file_base64: base64, content_type: file.type || 'application/octet-stream',
  });
  const publicUrl = uploadResult?.data?.publicUrl;

  const docResult: any = await apiPost('/user/actions', {
    action: 'add-document',
    p_user_id: userId,
    p_document_type: documentType,
    p_document_name: file.name,
    p_document_url: publicUrl,
    p_file_size: file.size,
    p_file_type: file.type,
  });
  const docData = docResult?.data?.document;

  const response: any = await apiPost('/user/update', {
    id: userId,
    documents: docData,
  });
  return response?.data;
};

export const verifyDocument = async (
  documentId: string,
  status: 'verified' | 'rejected',
  reason?: string
): Promise<void> => {
  await apiPost('/user/actions', {
    action: 'verify-document',
    documentId,
    verification_status: status,
    verified_at: new Date().toISOString(),
    ...(status === 'rejected' && reason ? { rejection_reason: reason } : {}),
  });
};

export const logActivity = async (
  userId: string,
  activityType: string,
  description?: string,
  metadata?: Record<string, any>
): Promise<void> => {
  await apiPost('/user/log-activity', {
    user_id: userId,
    activity_type: activityType,
    description: description || '',
    metadata: metadata || {},
  });
};

export const resetUserPassword = async (userId: string, newPassword: string): Promise<void> => {
  const res = (await apiPost('/auth/admin-reset-password', {
    user_id: userId,
    new_password: newPassword
  })) as any;
  if (!res.success) {
    throw new Error(res.error || 'Failed to reset password');
  }
};

export const updatePassword = async (newPassword: string, currentPassword?: string): Promise<void> => {
  if (!currentPassword) {
    throw new Error('Current password is required to change password');
  }
  const res = (await apiPost('/auth/change-password', {
    current_password: currentPassword,
    new_password: newPassword
  })) as any;
  if (!res.success) {
    throw new Error(res.error || 'Failed to change password');
  }
};

export const bulkImportUsers = async (file: File): Promise<BulkImportResult> => {
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
};
