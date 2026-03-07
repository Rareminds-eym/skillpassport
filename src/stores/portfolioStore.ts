import { create } from 'zustand';
import { immer } from 'zustand/middleware/immer';
import { getStudentPortfolioByEmail } from '../services/portfolioService';

// Service response type
interface ServiceResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
}

// Types (matching existing PortfolioContext)
export interface DisplayPreferences {
  showSocialLinks: boolean;
  showSkillBars: boolean;
  showProjectImages: boolean;
  enableAnimations: boolean;
  showContactForm: boolean;
  showDownloadResume: boolean;
}

export interface PortfolioSettings {
  layout: 'infographic' | 'journey' | 'aipersona' | string;
  primaryColor: string;
  secondaryColor: string;
  accentColor: string;
  animation: string;
  fontSize: number;
  displayPreferences: DisplayPreferences;
}

interface Student {
  id: string;
  email: string;
  name?: string;
  [key: string]: any;
}

interface PortfolioState {
  // Data
  student: Student | null;
  settings: PortfolioSettings;
  viewerRole: string | null;
  
  // Loading states
  isLoading: boolean;
  isManuallySet: boolean;
  loadedUserEmail: string | null;
  
  // Actions
  setStudent: (studentData: Student) => Promise<void>;
  setStudentSync: (studentData: Student) => void;
  updateSettings: (newSettings: Partial<PortfolioSettings>) => void;
  resetToAuthUser: () => void;
  resetToRoleDefaults: () => void;
  setViewerRole: (role: string | null) => void;
  setIsLoading: (isLoading: boolean) => void;
  setIsManuallySet: (isManuallySet: boolean) => void;
  loadStudentByEmail: (email: string) => Promise<void>;
  clearStudent: () => void;
  
  // Getters
  hasStudent: () => boolean;
  getSettingsKey: () => string;
  getRoleBasedDefaults: () => PortfolioSettings;
}

// Default display preferences
const defaultDisplayPreferences: DisplayPreferences = {
  showSocialLinks: true,
  showSkillBars: true,
  showProjectImages: true,
  enableAnimations: true,
  showContactForm: true,
  showDownloadResume: true,
};

// Get role-based default layout
const getRoleBasedDefaultLayout = (role: string | null): string => {
  switch (role) {
    case 'student':
      return 'infographic';
    case 'university_admin':
    case 'college_admin':
    case 'school_admin':
    case 'educator':
      return 'journey';
    case 'recruiter':
      return 'aipersona';
    default:
      return 'infographic';
  }
};

// Get default settings based on role
const getDefaultSettings = (viewerRole: string | null): PortfolioSettings => ({
  layout: getRoleBasedDefaultLayout(viewerRole) as any,
  primaryColor: '#3b82f6',
  secondaryColor: '#1e40af',
  accentColor: '#60a5fa',
  animation: 'fade',
  fontSize: 16,
  displayPreferences: defaultDisplayPreferences,
});

export const usePortfolioStore = create<PortfolioState>()(
  immer((set, get) => ({
    // Initial state
    student: null,
    settings: getDefaultSettings(null),
    viewerRole: null,
    isLoading: false,
    isManuallySet: false,
    loadedUserEmail: null,

    // Set student with async data fetching
    setStudent: async (studentData) => {
      const { isLoading, student } = get();
      
      // Prevent infinite loops - already loading same student
      if (isLoading && student?.email === studentData.email) {
        return;
      }
      
      // Already have this student's data
      if (student?.email === studentData.email && !isLoading) {
        set((state) => {
          state.isManuallySet = true;
        });
        return;
      }

      set((state) => {
        state.isLoading = true;
        state.isManuallySet = true;
      });

      try {
        if (studentData.email) {
          const result = await getStudentPortfolioByEmail(studentData.email) as ServiceResponse<Student>;
          const studentResult = result.data;
        
          if (result.success && studentResult) {
            set((state) => {
              state.student = studentResult;
              state.loadedUserEmail = studentData.email;
            });
          } else {
            console.error('Error fetching student data:', result.error);
            set((state) => {
              state.student = studentData;
              state.loadedUserEmail = studentData.email;
            });
          }
        } else {
          set((state) => {
            state.student = studentData;
            state.loadedUserEmail = studentData.email || null;
          });
        }
      } catch (error) {
        console.error('Error in setStudent:', error);
        set((state) => {
          state.student = studentData;
        });
      } finally {
        set((state) => {
          state.isLoading = false;
        });
      }
    },

    // Set student synchronously (no API call)
    setStudentSync: (studentData) => {
      set((state) => {
        state.student = studentData;
        state.loadedUserEmail = studentData.email || null;
        state.isManuallySet = true;
      });
    },

    // Update settings with persistence
    updateSettings: (newSettings) => {
      set((state) => {
        state.settings = { ...state.settings, ...newSettings };
        
        // Persist to localStorage
        const settingsKey = `portfolioSettings_${state.viewerRole || 'guest'}`;
        localStorage.setItem(settingsKey, JSON.stringify(state.settings));
      });
    },

    // Reset to authenticated user (clear manual override)
    resetToAuthUser: () => {
      set((state) => {
        state.isManuallySet = false;
        state.student = null;
        state.loadedUserEmail = null;
      });
    },

    // Reset settings to role defaults
    resetToRoleDefaults: () => {
      set((state) => {
        const roleBasedDefaults = getDefaultSettings(state.viewerRole);
        state.settings = roleBasedDefaults;
        
        // Clear saved settings for this role
        const settingsKey = `portfolioSettings_${state.viewerRole || 'guest'}`;
        localStorage.removeItem(settingsKey);
      });
    },

    // Set viewer role (affects defaults)
    setViewerRole: (role) => {
      set((state) => {
        state.viewerRole = role;
        
        // Load role-specific settings
        const settingsKey = `portfolioSettings_${role || 'guest'}`;
        const savedSettings = localStorage.getItem(settingsKey);
        const roleBasedDefaults = getDefaultSettings(role);
        
        if (savedSettings) {
          try {
            const parsed = JSON.parse(savedSettings);
            state.settings = { ...roleBasedDefaults, ...parsed };
          } catch {
            state.settings = roleBasedDefaults;
          }
        } else {
          state.settings = roleBasedDefaults;
        }
      });
    },

    // Set loading state
    setIsLoading: (isLoading) => {
      set((state) => {
        state.isLoading = isLoading;
      });
    },

    // Set manually set flag
    setIsManuallySet: (isManuallySet) => {
      set((state) => {
        state.isManuallySet = isManuallySet;
      });
    },

    // Load student by email
    loadStudentByEmail: async (email) => {
      const { loadedUserEmail, isManuallySet } = get();
      
      if (isManuallySet) return;
      if (loadedUserEmail === email) {
        set((state) => {
          state.isLoading = false;
        });
        return;
      }

      set((state) => {
        state.isLoading = true;
      });

      try {
        const result = await getStudentPortfolioByEmail(email) as ServiceResponse<Student>;
        const studentResult = result.data;
        
        if (result.success && studentResult) {
          set((state) => {
            state.student = studentResult;
            state.loadedUserEmail = email;
          });
        }
      } catch (error) {
        console.error('Error loading student:', error);
      } finally {
        set((state) => {
          state.isLoading = false;
        });
      }
    },

    // Clear student data
    clearStudent: () => {
      set((state) => {
        state.student = null;
        state.loadedUserEmail = null;
        state.isManuallySet = false;
      });
    },

    // Getters
    hasStudent: () => {
      return get().student !== null;
    },

    getSettingsKey: () => {
      return `portfolioSettings_${get().viewerRole || 'guest'}`;
    },

    getRoleBasedDefaults: () => {
      return getDefaultSettings(get().viewerRole);
    },
  }))
);

// Convenience hooks
export const usePortfolioStudent = () => 
  usePortfolioStore((state) => state.student);

export const usePortfolioSettings = () => 
  usePortfolioStore((state) => state.settings);

export const usePortfolioLoading = () => 
  usePortfolioStore((state) => state.isLoading);

export const usePortfolioViewerRole = () => 
  usePortfolioStore((state) => state.viewerRole);

export const usePortfolioActions = () =>
  usePortfolioStore((state) => ({
    setStudent: state.setStudent,
    setStudentSync: state.setStudentSync,
    updateSettings: state.updateSettings,
    resetToAuthUser: state.resetToAuthUser,
    resetToRoleDefaults: state.resetToRoleDefaults,
    clearStudent: state.clearStudent,
    loadStudentByEmail: state.loadStudentByEmail,
  }));

// Hook for checking if viewing another student's portfolio
export const useIsViewingOtherStudent = () =>
  usePortfolioStore((state) => state.isManuallySet && state.student !== null);
