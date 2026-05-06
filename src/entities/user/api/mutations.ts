import { getCurrentSession, getCurrentUser } from '@/shared/api/authUtils';
/**
 * User Entity - API Mutations
 * Data modification functions for user data
 */

import { supabase } from '@/shared/api';
import userApiService from '@/entities/user/api/userApiService';
import type { 
  User, 
  CreateUserData, 
  UpdateUserData, 
  UserProfileExtended,
  UserDocument,
  BulkImportResult 
} from '..';
import { mapRoleToWorkerAPI } from '../model/utils';

const { unifiedSignup } = userApiService;

// ============================================================================
// User Mutations
// ============================================================================

export const createUser = async (userData: CreateUserData): Promise<User> => {
  const firstName = userData.firstName || '';
  const lastName = userData.lastName || '';
  const mappedRole = mapRoleToWorkerAPI(userData.role);

  // Use Worker API for signup with proper rollback
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

  // Update user profile with additional metadata
  const { data: user, error: updateError } = await supabase
    .from('users')
    .update({
      firstName: userData.firstName,
      lastName: userData.lastName,
      role: userData.role,
      metadata: userData.metadata,
    })
    .eq('id', result.data.userId)
    .select()
    .single();

  if (updateError) throw updateError;

  // Log activity
  await logActivity(result.data.userId, 'user_created', 'User account created');

  return user;
};

export const updateUser = async (userId: string, userData: UpdateUserData): Promise<User> => {
  const { data, error } = await supabase
    .from('users')
    .update(userData)
    .eq('id', userId)
    .select()
    .single();

  if (error) throw error;

  // Log activity
  await logActivity(userId, 'profile_updated', 'User profile updated');

  return data;
};

export const deleteUser = async (userId: string): Promise<void> => {
  const { error } = await supabase
    .from('users')
    .update({ isActive: false })
    .eq('id', userId);

  if (error) throw error;

  // Log activity
  await logActivity(userId, 'user_deactivated', 'User account deactivated');
};

// ============================================================================
// User Role Mutations
// ============================================================================

export const changeUserRole = async (
  userId: string,
  newRole: string,
  reason?: string
): Promise<void> => {
  const { data: currentUser } = getCurrentUser();
  if (!currentUser.user) throw new Error('Not authenticated');

  const { error } = await supabase.rpc('change_user_role', {
    p_user_id: userId,
    p_new_role: newRole,
    p_reason: reason,
    p_changed_by: currentUser.user.id,
  });

  if (error) throw error;
};

// ============================================================================
// User Profile Mutations
// ============================================================================

export const updateUserProfile = async (
  userId: string,
  profileData: Partial<UserProfileExtended>
): Promise<UserProfileExtended> => {
  const { data, error } = await supabase
    .from('user_profile_extended')
    .upsert({
      user_id: userId,
      ...profileData,
    })
    .select()
    .single();

  if (error) throw error;
  return data;
};

// ============================================================================
// User Document Mutations
// ============================================================================

export const uploadDocument = async (
  userId: string,
  file: File,
  documentType: string
): Promise<UserDocument> => {
  // Upload file to storage
  const fileExt = file.name.split('.').pop();
  const fileName = `${userId}/${documentType}/${Date.now()}.${fileExt}`;

  const { error: uploadError } = await supabase.storage
    .from('user-documents')
    .upload(fileName, file);

  if (uploadError) throw uploadError;

  const { data: urlData } = supabase.storage
    .from('user-documents')
    .getPublicUrl(fileName);

  // Create document record
  const { data, error } = await supabase
    .from('user_documents')
    .insert({
      user_id: userId,
      document_type: documentType,
      document_name: file.name,
      document_url: urlData.publicUrl,
      file_size: file.size,
      file_type: file.type,
    })
    .select()
    .single();

  if (error) throw error;
  return data;
};

export const verifyDocument = async (
  documentId: string,
  status: 'verified' | 'rejected',
  reason?: string
): Promise<void> => {
  const { data: currentUser } = getCurrentUser();
  if (!currentUser.user) throw new Error('Not authenticated');

  const updateData: any = {
    verification_status: status,
    verified_by: currentUser.user.id,
    verified_at: new Date().toISOString(),
  };

  if (status === 'rejected' && reason) {
    updateData.rejection_reason = reason;
  }

  const { error } = await supabase
    .from('user_documents')
    .update(updateData)
    .eq('id', documentId);

  if (error) throw error;
};

// ============================================================================
// User Activity Mutations
// ============================================================================

export const logActivity = async (
  userId: string,
  activityType: string,
  description?: string,
  metadata?: Record<string, any>
): Promise<void> => {
  const { error } = await supabase.rpc('log_user_activity', {
    p_user_id: userId,
    p_activity_type: activityType,
    p_description: description,
    p_metadata: metadata || {},
  });

  if (error) throw error;
};

// ============================================================================
// Password Mutations
// ============================================================================

export const resetUserPassword = async (userId: string, newPassword: string): Promise<void> => {
  const { ssoClient } = await import('@/shared/api/ssoClient');
  const ssoUrl = import.meta.env.VITE_SSO_URL;
  const res = await ssoClient.fetch(`${ssoUrl}/auth/admin-reset-password`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ user_id: userId, new_password: newPassword }),
  });
  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw new Error((body as any).error || 'Failed to reset password');
  }
};

export const updatePassword = async (newPassword: string, currentPassword?: string): Promise<void> => {
  if (!currentPassword) {
    throw new Error('Current password is required to change password');
  }
  const { ssoClient } = await import('@/shared/api/ssoClient');
  const ssoUrl = import.meta.env.VITE_SSO_URL;
  const res = await ssoClient.fetch(`${ssoUrl}/auth/change-password`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ current_password: currentPassword, new_password: newPassword }),
  });
  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw new Error((body as any).error || 'Failed to change password');
  }
};

// ============================================================================
// Bulk Import Mutations
// ============================================================================

export const bulkImportUsers = async (file: File): Promise<BulkImportResult> => {
  const { data: currentUser } = getCurrentUser();
  if (!currentUser.user) throw new Error('Not authenticated');

  // Upload CSV file
  const fileName = `bulk-imports/${Date.now()}_${file.name}`;
  const { error: uploadError } = await supabase.storage
    .from('user-documents')
    .upload(fileName, file);

  if (uploadError) throw uploadError;

  const { data: urlData } = supabase.storage
    .from('user-documents')
    .getPublicUrl(fileName);

  // Create import job
  const { data, error } = await supabase
    .from('user_bulk_imports')
    .insert({
      imported_by: currentUser.user.id,
      file_name: file.name,
      file_url: urlData.publicUrl,
      status: 'pending',
    })
    .select()
    .single();

  if (error) throw error;

  return data;
};
