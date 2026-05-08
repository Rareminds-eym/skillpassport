import { create } from 'zustand';
import { useShallow } from 'zustand/react/shallow';
import { immer } from 'zustand/middleware/immer';
import { getlearnerPortfolioByEmail } from '@/features/digital-portfolio/api/portfolioService';
import { getLogger } from '@/shared/config/logging';

const logger = getLogger('PortfolioStore');

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

interface Learner {
  id: string;
  email: string;
  name?: string;
  [key: string]: any;
}

interface PortfolioState {
  // Data
  learner: Learner | null;
  settings: PortfolioSettings;
  viewerRole: string | null;

  // Loading states
  isLoading: boolean;
  isManuallySet: boolean;
  loadedUserEmail: string | null;

  // Actions
  setLearner: (learnerData: Learner) => Promise<void>;
  setlearnerSync: (learnerData: Learner) => void;
  updateSettings: (newSettings: Partial<PortfolioSettings>) => void;
  resetToAuthUser: () => void;
  resetToRoleDefaults: () => void;
  setViewerRole: (role: string | null) => void;
  setIsLoading: (isLoading: boolean) => void;
  setIsManuallySet: (isManuallySet: boolean) => void;
  loadlearnerByEmail: (email: string) => Promise<void>;
  clearLearner: () => void;

  // Getters
  hasLearner: () => boolean;
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
    case 'learner':
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
    learner: null,
    settings: getDefaultSettings(null),
    viewerRole: null,
    isLoading: false,
    isManuallySet: false,
    loadedUserEmail: null,

    // Set learner with async data fetching
    setLearner: async (learnerData) => {
      const { isLoading, learner } = get();

      // Prevent infinite loops - already loading same learner
      if (isLoading && learner?.email === learnerData.email) {
        return;
      }

      // Already have this learner's data
      if (learner?.email === learnerData.email && !isLoading) {
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
        if (learnerData.email) {
          const result = await getlearnerPortfolioByEmail(learnerData.email) as ServiceResponse<Learner>;
          const learnerResult = result.data;

          if (result.success && learnerResult) {
            set((state) => {
              state.learner = learnerResult;
              state.loadedUserEmail = learnerData.email;
            });
          } else {
            set((state) => {
              state.learner = learnerData;
              state.loadedUserEmail = learnerData.email;
            });
          }
        } else {
          set((state) => {
            state.learner = learnerData;
            state.loadedUserEmail = learnerData.email || null;
          });
        }
      } catch (error) {
        set((state) => {
          state.learner = learnerData;
        });
      } finally {
        set((state) => {
          state.isLoading = false;
        });
      }
    },

    // Set learner synchronously (no API call)
    setlearnerSync: (learnerData) => {
      set((state) => {
        state.learner = learnerData;
        state.loadedUserEmail = learnerData.email || null;
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
        state.learner = null;
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

    // Load learner by email
    loadlearnerByEmail: async (email) => {
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
        const result = await getlearnerPortfolioByEmail(email) as ServiceResponse<Learner>;
        const learnerResult = result.data;

        if (result.success && learnerResult) {
          set((state) => {
            state.learner = learnerResult;
            state.loadedUserEmail = email;
          });
        }
      } catch (error) {
        logger.error('Error loading learner by email', error instanceof Error ? error : new Error('Unknown error'));
      } finally {
        set((state) => {
          state.isLoading = false;
        });
      }
    },

    // Clear learner data
    clearLearner: () => {
      set((state) => {
        state.learner = null;
        state.loadedUserEmail = null;
        state.isManuallySet = false;
      });
    },

    // Getters
    hasLearner: () => {
      return get().learner !== null;
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
export const usePortfolioLearner = () =>
  usePortfolioStore((state) => state.learner);

export const usePortfolioSettings = () =>
  usePortfolioStore((state) => state.settings);

export const usePortfolioLoading = () =>
  usePortfolioStore((state) => state.isLoading);

export const usePortfolioViewerRole = () =>
  usePortfolioStore((state) => state.viewerRole);

export const usePortfolioActions = () =>
  usePortfolioStore(useShallow((state) => ({
    setLearner: state.setLearner,
    setlearnerSync: state.setlearnerSync,
    updateSettings: state.updateSettings,
    resetToAuthUser: state.resetToAuthUser,
    resetToRoleDefaults: state.resetToRoleDefaults,
    clearLearner: state.clearLearner,
    loadlearnerByEmail: state.loadlearnerByEmail,
  })));

// Hook for checking if viewing another learner's portfolio
export const useIsViewingOtherLearner = () =>
  usePortfolioStore((state) => state.isManuallySet && state.learner !== null);

// Combined convenience hook
export const usePortfolio = () => {
  const learner = usePortfolioLearner();
  const settings = usePortfolioSettings();
  const isLoading = usePortfolioLoading();
  const viewerRole = usePortfolioViewerRole();
  const actions = usePortfolioActions();
  const isManuallySet = useIsViewingOtherLearner();

  return {
    learner,
    settings,
    isLoading,
    viewerRole,
    isManuallySet,
    ...actions,
  };
};
