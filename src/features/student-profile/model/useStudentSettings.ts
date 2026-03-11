/**
 * Consolidated Student Settings Hook
 * 
 * Consolidates:
 * - useStudentSettings
 * 
 * Returns: settings, preferences
 */

import { useState, useEffect, useCallback } from 'react';
// TODO: Uncomment when functions are added to studentProfileService
// import { 
//   getStudentSettingsByEmail, 
//   updateStudentSettings, 
//   updateStudentPassword 
// } from '../api/studentProfileService';

export interface UseStudentSettingsOptions {
  email: string | null;
  enabled?: boolean;
}

export interface StudentSettings {
  id: string;
  email: string;
  name: string;
  phone: string;
  profile_picture?: string;
  notificationSettings?: {
    email: boolean;
    push: boolean;
    sms: boolean;
  };
  privacySettings?: {
    profileVisibility: 'public' | 'private' | 'connections';
    showEmail: boolean;
    showPhone: boolean;
  };
  preferences?: {
    language: string;
    timezone: string;
    theme: 'light' | 'dark' | 'auto';
  };
}

export const useStudentSettings = ({ email, enabled = true }: UseStudentSettingsOptions) => {
  const [settings, setSettings] = useState<StudentSettings | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Fetch student settings
  const fetchSettings = useCallback(async () => {
    if (!email || !enabled) {
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setError(null);
      
      const result = await getStudentSettingsByEmail(email);
      
      if (result.success) {
        setSettings(result.data);
      } else {
        setError(result.error || 'Failed to fetch settings');
      }
    } catch (err: any) {
      console.error('Error fetching student settings:', err);
      setError(err.message || 'Failed to fetch settings');
    } finally {
      setLoading(false);
    }
  }, [email, enabled]);

  // Update profile data
  const updateProfile = async (updates: Partial<StudentSettings>) => {
    if (!email) {
      return { success: false, error: 'Email is required' };
    }

    const result = await updateStudentSettings(email, updates);
    
    if (result.success) {
      // Only update settings if we're NOT updating notification or privacy settings
      // This prevents the state from being overwritten while user is toggling settings
      if (!updates.notificationSettings && !updates.privacySettings) {
        setSettings(result.data);
      }
      return result;
    } else {
      return result;
    }
  };

  // Update password
  const updatePassword = async (currentPassword: string, newPassword: string) => {
    if (!email) {
      throw new Error('Email is required');
    }

    try {
      const result = await updateStudentPassword(email, currentPassword, newPassword);
      
      if (result.success) {
        return { success: true, message: result.message };
      } else {
        throw new Error(result.error);
      }
    } catch (err: any) {
      console.error('Error updating password:', err);
      throw err;
    }
  };

  // Refresh settings
  const refresh = useCallback(() => {
    fetchSettings();
  }, [fetchSettings]);

  // Initial fetch
  useEffect(() => {
    fetchSettings();
  }, [fetchSettings]);

  // Extract preferences for easier access
  const preferences = settings?.preferences || {
    language: 'en',
    timezone: 'UTC',
    theme: 'auto' as const
  };

  const notificationSettings = settings?.notificationSettings || {
    email: true,
    push: true,
    sms: false
  };

  const privacySettings = settings?.privacySettings || {
    profileVisibility: 'public' as const,
    showEmail: false,
    showPhone: false
  };

  return {
    // Data
    settings,
    preferences,
    notificationSettings,
    privacySettings,
    loading,
    error,
    
    // Operations
    updateProfile,
    updatePassword,
    refresh
  };
};
