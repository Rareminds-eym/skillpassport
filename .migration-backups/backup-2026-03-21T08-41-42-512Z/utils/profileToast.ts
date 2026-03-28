/**
 * Profile Toast Utility
 * Provides theme-aware toast notifications for profile updates
 */

import toast from 'react-hot-toast';

/**
 * Show a success toast notification for profile updates
 * @param message - The message to display
 * @param theme - Current theme ('light' or 'dark')
 */
export const showProfileUpdateToast = (message: string, theme: 'light' | 'dark' = 'light') => {
  toast.success(message, {
    style: {
      background: theme === 'dark' ? '#374151' : '#ffffff',
      color: theme === 'dark' ? '#f3f4f6' : '#111827',
      border: theme === 'dark' ? '1px solid #4b5563' : '1px solid #e5e7eb',
    },
    iconTheme: {
      primary: theme === 'dark' ? '#60a5fa' : '#3b82f6',
      secondary: theme === 'dark' ? '#374151' : '#ffffff',
    },
    duration: 3000,
  });
};

/**
 * Show an error toast notification for profile update failures
 * @param message - The error message to display
 * @param theme - Current theme ('light' or 'dark')
 */
export const showProfileErrorToast = (message: string, theme: 'light' | 'dark' = 'light') => {
  toast.error(message, {
    style: {
      background: theme === 'dark' ? '#374151' : '#ffffff',
      color: theme === 'dark' ? '#f3f4f6' : '#111827',
      border: theme === 'dark' ? '1px solid #4b5563' : '1px solid #e5e7eb',
    },
    iconTheme: {
      primary: theme === 'dark' ? '#ef4444' : '#dc2626',
      secondary: theme === 'dark' ? '#374151' : '#ffffff',
    },
    duration: 4000,
  });
};

/**
 * Profile section update messages
 */
export const PROFILE_UPDATE_MESSAGES = {
  education: 'Education updated successfully!',
  skills: 'Skills updated successfully!',
  projects: 'Project updated successfully!',
  experience: 'Experience updated successfully!',
  certifications: 'Certification updated successfully!',
  training: 'Training updated successfully!',
  languages: 'Languages updated successfully!',
  hobbies: 'Hobbies updated successfully!',
  interests: 'Interests updated successfully!',
  achievements: 'Achievement updated successfully!',
  personalInfo: 'Personal information updated successfully!',
  profile: 'Profile updated successfully!',
};
