/**
 * Custom hook for save handlers
 * Centralizes all save logic with consistent patterns
 */

import { useState, useCallback } from 'react';
import toast from 'react-hot-toast';
import { safeSave } from '@/shared/lib/settingsErrorHandler';
import { 
  dispatchSettingsUpdate, 
  safeRefresh, 
  triggerEmbeddingRegeneration 
} from '../helpers/settingsHelpers';

interface RefreshFunctions {
  recentUpdates?: () => Promise<void>;
  education?: () => Promise<void>;
  softSkills?: () => Promise<void>;
  technicalSkills?: () => Promise<void>;
  experience?: () => Promise<void>;
  certificates?: () => Promise<void>;
  projects?: () => Promise<void>;
}

interface PasswordData {
  currentPassword: string;
  newPassword: string;
  confirmPassword: string;
}

interface SaveResult {
  success: boolean;
  error?: string;
}

interface UseSaveHandlersProps {
  updateProfile: (fields: any) => Promise<SaveResult>;
  updatePassword: (currentPassword: string, newPassword: string) => Promise<SaveResult>;
  updateEducation: (data: any) => Promise<SaveResult>;
  updateSoftSkills: (data: any) => Promise<SaveResult>;
  updateSkills: (data: any) => Promise<SaveResult>;
  updateExperience: (data: any) => Promise<SaveResult>;
  updateCertificates: (data: any) => Promise<SaveResult>;
  updateProjects: (data: any) => Promise<SaveResult>;
  refreshFunctions: RefreshFunctions;
  studentId?: string;
  userId?: string;
}

interface ProfileSaveOptions {
  validationFields?: string[];
  triggerEmbedding?: boolean;
}

interface UseSaveHandlersReturn {
  isSaving: boolean;
  setIsSaving: (saving: boolean) => void;
  handleSavePersonalInfo: (fields: any) => Promise<SaveResult>;
  handleSaveAdditionalInfo: (fields: any) => Promise<SaveResult>;
  handleSaveAcademicDetails: (fields: any) => Promise<SaveResult>;
  handleSaveGuardianInfo: (fields: any) => Promise<SaveResult>;
  handleSaveSocialLinks: (fields: any) => Promise<SaveResult>;
  handleEducationSave: (data: any) => Promise<SaveResult>;
  handleSoftSkillsSave: (data: any) => Promise<SaveResult>;
  handleTechnicalSkillsSave: (data: any) => Promise<SaveResult>;
  handleExperienceSave: (data: any) => Promise<SaveResult>;
  handleCertificatesSave: (data: any) => Promise<SaveResult>;
  handleProjectsSave: (data: any) => Promise<SaveResult>;
  handleSavePassword: (passwordData: PasswordData) => Promise<SaveResult | undefined>;
  handleSaveNotifications: (settings: any) => Promise<SaveResult>;
  handleSavePrivacy: (settings: any) => Promise<SaveResult>;
}

export const useSaveHandlers = ({
  updateProfile,
  updatePassword,
  updateEducation,
  updateSoftSkills,
  updateSkills,
  updateExperience,
  updateCertificates,
  updateProjects,
  refreshFunctions,
  studentId,
  userId,
}: UseSaveHandlersProps): UseSaveHandlersReturn => {
  const [isSaving, setIsSaving] = useState(false);

  // Generic profile section save handler
  const createProfileSaveHandler = useCallback((section: string, fields: any, options: ProfileSaveOptions = {}) => {
    return async (): Promise<SaveResult> => {
      setIsSaving(true);
      
      const result = await safeSave(
        () => updateProfile(fields),
        {
          section,
          action: `update_${section}`,
          validationFields: options.validationFields || [],
          data: fields,
          toast,
          onSuccess: async () => {
            dispatchSettingsUpdate('profile_updated', fields);
            await safeRefresh(refreshFunctions.recentUpdates, 'recent updates');
            
            if (options.triggerEmbedding) {
              await triggerEmbeddingRegeneration(studentId || userId || '', fields);
            }
          },
        }
      );

      setIsSaving(false);
      return result;
    };
  }, [updateProfile, refreshFunctions, studentId, userId]);

  // Entity save handler (education, skills, etc.)
  const createEntitySaveHandler = useCallback((entityType: string, updateFunction: (data: any) => Promise<SaveResult>, refreshFunction?: () => Promise<void>) => {
    return async (data: any): Promise<SaveResult> => {
      try {
        setIsSaving(true);
        
        console.log(`💾 Saving ${entityType}:`, data);
        
        const result = await updateFunction(data);
        
        console.log(`✅ ${entityType} save result:`, result);
        
        if (result.success) {
          if (refreshFunction) {
            console.log(`🔄 Refreshing ${entityType} data...`);
            await refreshFunction();
            console.log(`✅ ${entityType} data refreshed`);
          }
          
          toast.success(`${entityType} updated successfully`);
          await safeRefresh(refreshFunctions.recentUpdates, 'recent updates');
          
          return result;
        } else {
          throw new Error(result.error || `Failed to update ${entityType}`);
        }
      } catch (error) {
        console.error(`❌ Error saving ${entityType}:`, error);
        const errorMessage = error instanceof Error ? error.message : `Failed to save ${entityType}`;
        toast.error(errorMessage);
        return { success: false, error: errorMessage };
      } finally {
        setIsSaving(false);
      }
    };
  }, [refreshFunctions]);

  // Password save handler
  const handleSavePassword = useCallback(async (passwordData: PasswordData): Promise<SaveResult | undefined> => {
    // Validation
    if (!passwordData.currentPassword) {
      toast.error("Please enter your current password");
      return;
    }

    if (!passwordData.newPassword) {
      toast.error("Please enter a new password");
      return;
    }

    if (passwordData.newPassword !== passwordData.confirmPassword) {
      toast.error("New passwords do not match");
      return;
    }

    if (passwordData.newPassword.length < 8) {
      toast.error("Password must be at least 8 characters long");
      return;
    }

    if (passwordData.newPassword === passwordData.currentPassword) {
      toast.error("New password must be different from current password");
      return;
    }

    setIsSaving(true);

    const result = await safeSave(
      () => updatePassword(passwordData.currentPassword, passwordData.newPassword),
      {
        section: 'password',
        action: 'update_password',
        toast,
        enableRetry: false,
        onSuccess: async () => {
          await safeRefresh(refreshFunctions.recentUpdates, 'recent updates');
        },
      }
    );

    setIsSaving(false);
    return result;
  }, [updatePassword, refreshFunctions]);

  // Settings save handler (notifications, privacy)
  const createSettingsSaveHandler = useCallback((settingType: string, settings: any) => {
    return async (): Promise<SaveResult> => {
      setIsSaving(true);

      const result = await safeSave(
        () => updateProfile({ [`${settingType}Settings`]: settings }),
        {
          section: settingType,
          action: `update_${settingType}_settings`,
          data: settings,
          toast,
          onSuccess: async () => {
            await safeRefresh(refreshFunctions.recentUpdates, 'recent updates');
          },
        }
      );

      setIsSaving(false);
      return result;
    };
  }, [updateProfile, refreshFunctions]);

  return {
    isSaving,
    setIsSaving,
    
    // Profile section handlers
    handleSavePersonalInfo: (fields: any) => createProfileSaveHandler('personal', fields, {
      validationFields: ['phone', 'alternatePhone', 'pincode', 'age'],
      triggerEmbedding: true
    })(),
    
    handleSaveAdditionalInfo: (fields: any) => createProfileSaveHandler('additional', fields, {
      validationFields: ['aadhar'],
      triggerEmbedding: true
    })(),
    
    handleSaveAcademicDetails: (fields: any) => createProfileSaveHandler('academic', fields)(),
    
    handleSaveGuardianInfo: (fields: any) => createProfileSaveHandler('guardian', fields, {
      validationFields: ['email']
    })(),
    
    handleSaveSocialLinks: (fields: any) => createProfileSaveHandler('social', fields, {
      validationFields: ['url']
    })(),
    
    // Entity handlers
    handleEducationSave: createEntitySaveHandler('Education', updateEducation, refreshFunctions.education),
    handleSoftSkillsSave: createEntitySaveHandler('Soft skills', updateSoftSkills, refreshFunctions.softSkills),
    handleTechnicalSkillsSave: createEntitySaveHandler('Technical skills', updateSkills, refreshFunctions.technicalSkills),
    handleExperienceSave: createEntitySaveHandler('Experience', updateExperience, refreshFunctions.experience),
    handleCertificatesSave: createEntitySaveHandler('Certificates', updateCertificates, refreshFunctions.certificates),
    handleProjectsSave: createEntitySaveHandler('Projects', updateProjects, refreshFunctions.projects),
    
    // Other handlers
    handleSavePassword,
    handleSaveNotifications: (settings: any) => createSettingsSaveHandler('notification', settings)(),
    handleSavePrivacy: (settings: any) => createSettingsSaveHandler('privacy', settings)(),
  };
};
