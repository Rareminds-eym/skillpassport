import React, { createContext, useContext, useMemo } from 'react';
import { useAbility } from '../hooks/useAbility';

const PermissionsContext = createContext(null);

/**
 * Centralized Permissions Provider
 * Provides all permission checks in one place
 * Components can access permission flags without importing useAbility
 */
export const PermissionsProvider = ({ children }) => {
  const { can } = useAbility();

  // Compute all permission flags once
  const permissions = useMemo(() => ({
    // Profile permissions
    canReadProfile: can('read', 'Profile'),
    canUpdateProfile: can('update', 'Profile'),
    
    // Dashboard permissions
    canReadDashboard: can('read', 'Dashboard'),
    
    // Applications permissions
    canReadApplications: can('read', 'Applications'),
    canCreateApplications: can('create', 'Applications'),
    
    // Messages permissions
    canReadMessages: can('read', 'Messages'),
    canSendMessages: can('send', 'Messages'),
    
    // Skills permissions
    canReadSkills: can('read', 'Skills'),
    canUpdateSkills: can('update', 'Skills'),
    
    // Learning permissions
    canReadLearning: can('read', 'Learning'),
    canReadCourses: can('read', 'Courses'),
    canManageLearning: can('manage', 'Learning'),
    canStartCourses: can('start', 'Courses'),
    
    // Opportunities permissions
    canReadOpportunities: can('read', 'Opportunities'),
    canReadJobs: can('read', 'Jobs'),
    canApplyToOpportunities: can('apply', 'Opportunities'),
    canSaveOpportunities: can('save', 'Opportunities'),
    
    // Analytics permissions
    canReadAnalytics: can('read', 'Analytics'),
    
    // Settings permissions
    canReadSettings: can('read', 'Settings'),
    canUpdateSettings: can('update', 'Settings'),
    canUpdatePassword: can('update', 'Password'),
    canSaveNotificationPreferences: can('save', 'NotificationPreferences'),
    canSavePrivacySettings: can('save', 'PrivacySettings'),
    
    // Subscription permissions
    canManageSubscription: can('manage', 'Subscription'),
    canBrowseAddons: can('browse', 'Addons'),
    
    // Assessment permissions
    canReadAssessment: can('read', 'Assessment'),
    canViewAssessmentResults: can('view', 'AssessmentResults'),
    canStartAssessment: can('start', 'Assessment'),
    canContinueAssessment: can('continue', 'Assessment'),
    canTakeAdaptiveTest: can('take', 'AdaptiveTest'),
    canViewCourseAssessment: can('view', 'CourseAssessment'),
    
    // Career AI permissions
    canAccessCareerAI: can('access', 'CareerAI'),
    canAccessCareerAITools: can('access', 'CareerAITools'),
    
    // Raw can function for custom checks
    can
  }), [can]);

  return (
    <PermissionsContext.Provider value={permissions}>
      {children}
    </PermissionsContext.Provider>
  );
};

/**
 * Hook to access permissions
 * @returns {Object} All permission flags and raw can function
 */
export const usePermissions = () => {
  const context = useContext(PermissionsContext);
  if (!context) {
    throw new Error('usePermissions must be used within PermissionsProvider');
  }
  return context;
};

export default PermissionsContext;
