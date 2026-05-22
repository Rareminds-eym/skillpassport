/**
 * User Entity - API Queries
 * Data fetching functions for user data
 */

import { supabase } from '@/shared/api';
import type { User, UserProfile, UserProfileExtended, UserDocument, UserActivity } from '../model/types';

// ============================================================================
// User Queries
// ============================================================================

export const getUser = async (userId: string): Promise<User | null> => {
  const { data, error } = await supabase
    .from('users')
    .select('*')
    .eq('id', userId)
    .single();

  if (error && error.code !== 'PGRST116') return null;
  return data;
};

export const getUsers = async (filters?: {
  role?: string;
  isActive?: boolean;
  search?: string;
  college_id?: string;
}): Promise<User[]> => {
  let query = supabase
    .from('users')
    .select('*')
    .order('createdAt', { ascending: false });

  if (filters?.role) {
    query = query.eq('role', filters.role);
  }

  if (filters?.isActive !== undefined) {
    query = query.eq('isActive', filters.isActive);
  }

  if (filters?.search) {
    query = query.or(
      `email.ilike.%${filters.search}%,firstName.ilike.%${filters.search}%,lastName.ilike.%${filters.search}%`
    );
  }

  const { data, error } = await query;
  if (error) throw error;
  return data || [];
};


export const getCurrentUser = async (): Promise<User | null> => {
  const user = useAuthStore.getState().user;
    const error = null;
  
  if (error || !user) return null;
  
  return {
    id: user.id,
    email: user.email || '',
    role: user.user_metadata?.role,
    name: user.user_metadata?.full_name || user.user_metadata?.name,
    user_metadata: user.user_metadata,
  };
};

// ============================================================================
// User Profile Queries
// ============================================================================

export const getUserProfile = async (userId: string): Promise<UserProfileExtended | null> => {
  const { data, error } = await supabase
    .from('user_profile_extended')
    .select('*')
    .eq('user_id', userId)
    .single();

  if (error && error.code !== 'PGRST116') throw error;
  return data;
};

// ============================================================================
// User Document Queries
// ============================================================================

export const getUserDocuments = async (userId: string): Promise<UserDocument[]> => {
  const { data, error } = await supabase
    .from('user_documents')
    .select('*')
    .eq('user_id', userId)
    .order('uploaded_at', { ascending: false });

  if (error) throw error;
  return data || [];
};

// ============================================================================
// User Activity Log Queries
// ============================================================================

export const getUserActivity = async (userId: string, limit: number = 50): Promise<UserActivity[]> => {
  const { data, error } = await supabase
    .from('user_activity_log')
    .select('*')
    .eq('user_id', userId)
    .order('created_at', { ascending: false })
    .limit(limit);

  if (error) throw error;
  return data || [];
};

export const getUserActivityLog = async (userId: string, limit: number = 50): Promise<any[]> => {
  const { data, error } = await supabase
    .from('user_activity_log')
    .select('*')
    .eq('user_id', userId)
    .order('created_at', { ascending: false })
    .limit(limit);

  if (error) throw error;
  return data || [];
};

// ============================================================================
// User Statistics Queries
// ============================================================================

export const getUserStats = async (): Promise<{
  total: number;
  active: number;
  inactive: number;
  by_role: Record<string, number>;
}> => {
  const { data: users, error } = await supabase.from('users').select('role, isActive');

  if (error) throw error;

  const stats = {
    total: users?.length || 0,
    active: users?.filter((u) => u.isActive).length || 0,
    inactive: users?.filter((u) => !u.isActive).length || 0,
    by_role: {} as Record<string, number>,
  };

  users?.forEach((user) => {
    stats.by_role[user.role] = (stats.by_role[user.role] || 0) + 1;
  });

  return stats;
};

// ============================================================================
// User Role History Queries
// ============================================================================

export const getUserRoleHistory = async (userId: string): Promise<any[]> => {
  const { data, error } = await supabase
    .from('user_role_history')
    .select('*')
    .eq('user_id', userId)
    .order('assigned_at', { ascending: false });

  if (error) throw error;
  return data || [];
};

// ============================================================================
// Bulk Import Queries
// ============================================================================

export const getBulkImportStatus = async (importId: string): Promise<any> => {
  const { data, error } = await supabase
    .from('user_bulk_imports')
    .select('*')
    .eq('id', importId)
    .single();

  if (error) throw error;
  return data;
};
