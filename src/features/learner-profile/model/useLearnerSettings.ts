/**
 * Consolidated Learner Settings Hook
 * 
 * Consolidates:
 * - useLearnerSettings
 * 
 * Returns: settings, preferences
 */

import { useState, useEffect, useCallback } from 'react';
import { ssoClient } from '@/shared/api/ssoClient';
import { getLogger } from '@/shared/config/logging';

const logger = getLogger('learner-settings');

export interface UselearnerSettingsOptions {
  email: string | null;
  enabled?: boolean;
}

export interface LearnerSettings {
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

export const useLearnerSettings = ({ email, enabled = true }: UselearnerSettingsOptions) => {
  const [settings, setSettings] = useState<LearnerSettings | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Fetch learner settings (placeholder for future use)
  const fetchSettings = useCallback(async () => {
    if (!email || !enabled) {
      setLoading(false);
      return;
    }
    setLoading(false);
  }, [email, enabled]);

  // Update profile data via backend API
  const updateProfile = async (updates: Record<string, any>) => {
    try {
      const response = await ssoClient.fetch('/api/learners/profile', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updates)
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        logger.error('Failed to update profile', errorData);
        return { success: false, error: errorData.error || 'Failed to update profile' };
      }

      const { learner } = await response.json();
      return { success: true, data: learner };
    } catch (err) {
      logger.error('Error updating profile', err instanceof Error ? err : new Error(String(err)));
      return { success: false, error: err instanceof Error ? err.message : 'Failed to update profile' };
    }
  };

  // Update password (placeholder for future use)
  const updatePassword = async (currentPassword: string, newPassword: string) => {
    throw new Error('Password update not yet implemented');
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
