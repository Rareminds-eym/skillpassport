import { supabase } from '@/lib/supabaseClient';
import userApiService from './userApiService';

const { unifiedSignup } = userApiService;

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
  qualifications?: any[];
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
  device_info?: Record<string, any>;
  location_info?: Record<string, any>;
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
  metadata?: Record<string, any>;
  createdAt?: string;
  updatedAt?: string;
}

export interface CreateUserData {
  email: string;
  password: string;
  firstName?: string;
  lastName?: string;
  role: string;
  metadata?: Record<string, any>;
}

export interface UpdateUserData {
  firstName?: string;
  lastName?: string;
  role?: string;
  isActive?: boolean;
  metadata?: Record<string, any>;
}

export interface BulkImportResult {
  id: string;
  total_records: number;
  successful_records: number;
  failed_records: number;
  status: string;
  error_log: any[];
}

class UserManagementService {
  /**
   * Get all users with filters
   */
  async getUsers(filters?: {
    role?: string;
    isActive?: boolean;
    search?: string;
    college_id?: string;
  }): Promise<User[]> {
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
  }

  /**
   * Get a single user by ID
   */
  async getUser(userId: string): Promise<User | null> {
    const { data, error } = await supabase
      .from('users')
      .select('*')
      .eq('id', userId)
      .maybeSingle();

    if (error) throw error;
    return data;
  }

  /**
   * Create a new user using Worker API with proper rollback
   */
  async createUser(userData: CreateUserData): Promise<User> {
    // Parse name into firstName and lastName if not provided
    const firstName = userData.firstName || '';
    const lastName = userData.lastName || '';

    // Map role to worker API expected format
    const roleMapping: Record<string, string> = {
      'student': 'school_student',
      'school_student': 'school_student',
      'college_student': 'college_student',
      'educator': 'school_educator',
      'school_educator': 'school_educator',
      'college_educator': 'college_educator',
      'recruiter': 'recruiter',
      'admin': 'school_admin',
      'school_admin': 'school_admin',
      'college_admin': 'college_admin',
      'university_admin': 'university_admin',
    };

    const mappedRole = roleMapping[userData.role] || 'school_student';

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
    await this.logActivity(result.data.userId, 'user_created', 'User account created');

    return user;
  }

  /**
   * Update user
   */
  async updateUser(userId: string, userData: UpdateUserData): Promise<User> {
    const { data, error } = await supabase
      .from('users')
      .update(userData)
      .eq('id', userId)
      .select()
      .single();

    if (error) throw error;

    // Log activity
    await this.logActivity(userId, 'profile_updated', 'User profile updated');

    return data;
  }

  /**
   * Delete user (soft delete by setting isActive to false)
   */
  async deleteUser(userId: string): Promise<void> {
    const { error } = await supabase
      .from('users')
      .update({ isActive: false })
      .eq('id', userId);

    if (error) throw error;

    // Log activity
    await this.logActivity(userId, 'user_deactivated', 'User account deactivated');
  }

  /**
   * Change user role
   */
  async changeUserRole(
    userId: string,
    newRole: string,
    reason?: string
  ): Promise<void> {
    const { data: currentUser } = await supabase.auth.getUser();
    if (!currentUser.user) throw new Error('Not authenticated');

    const { error } = await supabase.rpc('change_user_role', {
      p_user_id: userId,
      p_new_role: newRole,
      p_reason: reason,
      p_changed_by: currentUser.user.id,
    });

    if (error) throw error;
  }

  /**
   * Get user extended profile
   */
  async getUserProfile(userId: string): Promise<UserProfileExtended | null> {
    const { data, error } = await supabase
      .from('user_profile_extended')
      .select('*')
      .eq('user_id', userId)
      .single();

    if (error && error.code !== 'PGRST116') throw error;
    return data;
  }

  /**
   * Update user extended profile
   */
  async updateUserProfile(
    userId: string,
    profileData: Partial<UserProfileExtended>
  ): Promise<UserProfileExtended> {
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
  }

  /**
   * Get user documents
   */
  async getUserDocuments(userId: string): Promise<UserDocument[]> {
    const { data, error } = await supabase
      .from('user_documents')
      .select('*')
      .eq('user_id', userId)
      .order('uploaded_at', { ascending: false });

    if (error) throw error;
    return data || [];
  }

  /**
   * Upload user document
   */
  async uploadDocument(
    userId: string,
    file: File,
    documentType: string
  ): Promise<UserDocument> {
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
  }

  /**
   * Verify document
   */
  async verifyDocument(
    documentId: string,
    status: 'verified' | 'rejected',
    reason?: string
  ): Promise<void> {
    const { data: currentUser } = await supabase.auth.getUser();
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
  }

  /**
   * Get user activity log
   */
  async getUserActivity(
    userId: string,
    limit: number = 50
  ): Promise<UserActivity[]> {
    const { data, error } = await supabase
      .from('user_activity_log')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
      .limit(limit);

    if (error) throw error;
    return data || [];
  }

  /**
   * Log user activity
   */
  async logActivity(
    userId: string,
    activityType: string,
    description?: string,
    metadata?: Record<string, any>
  ): Promise<void> {
    const { error } = await supabase.rpc('log_user_activity', {
      p_user_id: userId,
      p_activity_type: activityType,
      p_description: description,
      p_metadata: metadata || {},
    });

    if (error) throw error;
  }

  /**
   * Bulk import users from CSV
   */
  async bulkImportUsers(file: File): Promise<BulkImportResult> {
    const { data: currentUser } = await supabase.auth.getUser();
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

    // TODO: Process CSV in background job
    // For now, return the job record
    return data;
  }

  /**
   * Get bulk import status
   */
  async getBulkImportStatus(importId: string): Promise<BulkImportResult> {
    const { data, error } = await supabase
      .from('user_bulk_imports')
      .select('*')
      .eq('id', importId)
      .single();

    if (error) throw error;
    return data;
  }

  /**
   * Get user statistics
   */
  async getUserStats(): Promise<{
    total: number;
    active: number;
    inactive: number;
    by_role: Record<string, number>;
  }> {
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
  }

  /**
   * Reset user password (admin function)
   */
  async resetUserPassword(userId: string, newPassword: string): Promise<void> {
    const { error } = await supabase.auth.admin.updateUserById(userId, {
      password: newPassword,
    });

    if (error) throw error;

    // Log activity
    await this.logActivity(userId, 'password_reset', 'Password reset by admin');
  }

  /**
   * Get user role history
   */
  async getUserRoleHistory(userId: string): Promise<any[]> {
    const { data, error } = await supabase
      .from('user_role_history')
      .select('*')
      .eq('user_id', userId)
      .order('assigned_at', { ascending: false });

    if (error) throw error;
    return data || [];
  }
}

export const userManagementService = new UserManagementService();
