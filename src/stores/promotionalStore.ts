import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { immer } from 'zustand/middleware/immer';
import { supabase } from '../lib/supabaseClient';

// Types
export interface PromotionalEvent {
  id: string;
  event_code: string;
  title: string;
  description?: string;
  end_date?: string;
  is_active: boolean;
  [key: string]: any;
}

export interface TimeRemaining {
  days: number;
  hours: number;
  minutes: number;
  seconds: number;
  total: number;
}

interface PromotionalState {
  // Assessment promotional
  assessmentEvent: PromotionalEvent | null;
  isAssessmentModalDismissed: boolean;
  isAssessmentBannerDismissed: boolean;
  
  // General promotional
  currentEvent: PromotionalEvent | null;
  isModalDismissed: boolean;
  isBannerDismissed: boolean;
  
  // Loading
  isLoading: boolean;
  isLoaded: boolean;
  
  // Computed
  showAssessmentModal: boolean;
  showAssessmentBanner: boolean;
  showModal: boolean;
  showBanner: boolean;
  
  // Actions
  setAssessmentEvent: (event: PromotionalEvent | null) => void;
  setCurrentEvent: (event: PromotionalEvent | null) => void;
  setIsLoading: (isLoading: boolean) => void;
  setIsLoaded: (isLoaded: boolean) => void;
  
  // Dismissal actions
  dismissAssessmentModal: () => void;
  dismissAssessmentBanner: () => void;
  dismissModal: () => void;
  dismissBanner: () => void;
  
  // Time calculations
  getAssessmentTimeRemaining: () => TimeRemaining | null;
  getTimeRemaining: () => TimeRemaining | null;
  
  // Fetching
  fetchAssessmentEvent: () => Promise<void>;
  fetchCurrentEvent: () => Promise<void>;
  
  // Reset
  reset: () => void;
}

// Storage keys
const ASSESSMENT_MODAL_KEY = 'assessment_promo_modal_dismissed_v3';
const ASSESSMENT_BANNER_KEY = 'assessment_promo_banner_dismissed_v3';

export const usePromotionalStore = create<PromotionalState>()(
  immer(
    persist(
      (set, get) => ({
        // Initial state
        assessmentEvent: null,
        isAssessmentModalDismissed: true, // Start true, check on init
        isAssessmentBannerDismissed: false,
        
        currentEvent: null,
        isModalDismissed: false,
        isBannerDismissed: false,
        
        isLoading: false,
        isLoaded: false,

        // Computed
        get showAssessmentModal() {
          const { isLoaded, isAssessmentModalDismissed } = get();
          return isLoaded && !isAssessmentModalDismissed;
        },

        get showAssessmentBanner() {
          const { isAssessmentModalDismissed, isAssessmentBannerDismissed } = get();
          return isAssessmentModalDismissed && !isAssessmentBannerDismissed;
        },

        get showModal() {
          const { currentEvent, isModalDismissed } = get();
          return currentEvent !== null && !isModalDismissed;
        },

        get showBanner() {
          const { currentEvent, isModalDismissed, isBannerDismissed } = get();
          return currentEvent !== null && isModalDismissed && !isBannerDismissed;
        },

        // Setters
        setAssessmentEvent: (event) => {
          set((state) => {
            state.assessmentEvent = event;
          });
        },

        setCurrentEvent: (event) => {
          set((state) => {
            state.currentEvent = event;
          });
        },

        setIsLoading: (isLoading) => {
          set((state) => {
            state.isLoading = isLoading;
          });
        },

        setIsLoaded: (isLoaded) => {
          set((state) => {
            state.isLoaded = isLoaded;
          });
        },

        // Dismiss actions
        dismissAssessmentModal: () => {
          sessionStorage.setItem(ASSESSMENT_MODAL_KEY, 'true');
          set((state) => {
            state.isAssessmentModalDismissed = true;
          });
        },

        dismissAssessmentBanner: () => {
          sessionStorage.setItem(ASSESSMENT_BANNER_KEY, 'true');
          set((state) => {
            state.isAssessmentBannerDismissed = true;
          });
        },

        dismissModal: () => {
          const { currentEvent } = get();
          if (currentEvent) {
            sessionStorage.setItem(`promo_modal_dismissed_${currentEvent.event_code}`, 'true');
          }
          set((state) => {
            state.isModalDismissed = true;
          });
        },

        dismissBanner: () => {
          const { currentEvent } = get();
          if (currentEvent) {
            sessionStorage.setItem(`promo_banner_dismissed_${currentEvent.event_code}`, 'true');
          }
          set((state) => {
            state.isBannerDismissed = true;
          });
        },

        // Time remaining calculations
        getAssessmentTimeRemaining: () => {
          const { assessmentEvent } = get();
          
          let endDate: Date;
          if (assessmentEvent?.end_date) {
            endDate = new Date(assessmentEvent.end_date);
          } else {
            endDate = new Date();
            endDate.setDate(endDate.getDate() + 7);
          }
          
          const now = new Date();
          const diff = endDate.getTime() - now.getTime();
          
          if (diff <= 0) return null;
          
          return {
            days: Math.floor(diff / (1000 * 60 * 60 * 24)),
            hours: Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60)),
            minutes: Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60)),
            seconds: Math.floor((diff % (1000 * 60)) / 1000),
            total: diff,
          };
        },

        getTimeRemaining: () => {
          const { currentEvent } = get();
          
          if (!currentEvent?.end_date) return null;
          
          const end = new Date(currentEvent.end_date);
          const now = new Date();
          const diff = end.getTime() - now.getTime();
          
          if (diff <= 0) return null;
          
          return {
            days: Math.floor(diff / (1000 * 60 * 60 * 24)),
            hours: Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60)),
            minutes: Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60)),
            seconds: Math.floor((diff % (1000 * 60)) / 1000),
            total: diff,
          };
        },

        // Fetching
        fetchAssessmentEvent: async () => {
          set((state) => {
            state.isLoading = true;
          });

          try {
            const { data, error } = await supabase
              .from('promotional_events')
              .select('*')
              .eq('is_active', true)
              .order('created_at', { ascending: false })
              .limit(1)
              .maybeSingle();

            if (!error && data) {
              set((state) => {
                state.assessmentEvent = data;
              });
            }

            // Check sessionStorage
            const modalDismissed = sessionStorage.getItem(ASSESSMENT_MODAL_KEY) === 'true';
            const bannerDismissed = sessionStorage.getItem(ASSESSMENT_BANNER_KEY) === 'true';

            set((state) => {
              state.isAssessmentModalDismissed = modalDismissed;
              state.isAssessmentBannerDismissed = bannerDismissed;
            });
          } catch (err) {
            console.error('Error fetching assessment event:', err);
          } finally {
            setTimeout(() => {
              set((state) => {
                state.isLoading = false;
                state.isLoaded = true;
              });
            }, 500);
          }
        },

        fetchCurrentEvent: async () => {
          // This would typically use a React Query hook
          // For now, placeholder
          console.log('Fetch current event - implement with usePromotionalEvent hook');
        },

        // Reset
        reset: () => {
          set((state) => {
            state.assessmentEvent = null;
            state.isAssessmentModalDismissed = true;
            state.isAssessmentBannerDismissed = false;
            state.currentEvent = null;
            state.isModalDismissed = false;
            state.isBannerDismissed = false;
            state.isLoaded = false;
          });
        },
      }),
      {
        name: 'promotional-storage',
        partialize: (state) => ({
          // Only persist non-session-based state
        }),
      }
    )
  )
);

// Convenience hooks
export const useAssessmentPromotional = () => {
  const event = usePromotionalStore((state) => state.assessmentEvent);
  const showModal = usePromotionalStore((state) => state.showAssessmentModal);
  const showBanner = usePromotionalStore((state) => state.showAssessmentBanner);
  const isModalDismissed = usePromotionalStore((state) => state.isAssessmentModalDismissed);
  const isBannerDismissed = usePromotionalStore((state) => state.isAssessmentBannerDismissed);
  const dismissModal = usePromotionalStore((state) => state.dismissAssessmentModal);
  const dismissBanner = usePromotionalStore((state) => state.dismissAssessmentBanner);
  const getTimeRemaining = usePromotionalStore((state) => state.getAssessmentTimeRemaining);
  
  return { event, showModal, showBanner, isModalDismissed, isBannerDismissed, dismissModal, dismissBanner, getTimeRemaining };
};

export const useCurrentPromotional = () => {
  const event = usePromotionalStore((state) => state.currentEvent);
  const showModal = usePromotionalStore((state) => state.showModal);
  const showBanner = usePromotionalStore((state) => state.showBanner);
  const isModalDismissed = usePromotionalStore((state) => state.isModalDismissed);
  const isBannerDismissed = usePromotionalStore((state) => state.isBannerDismissed);
  const dismissModal = usePromotionalStore((state) => state.dismissModal);
  const dismissBanner = usePromotionalStore((state) => state.dismissBanner);
  const getTimeRemaining = usePromotionalStore((state) => state.getTimeRemaining);
  
  return { event, showModal, showBanner, isModalDismissed, isBannerDismissed, dismissModal, dismissBanner, getTimeRemaining };
};

export const usePromotionalActions = () => {
  const fetchAssessmentEvent = usePromotionalStore((state) => state.fetchAssessmentEvent);
  const fetchCurrentEvent = usePromotionalStore((state) => state.fetchCurrentEvent);
  const dismissAssessmentModal = usePromotionalStore((state) => state.dismissAssessmentModal);
  const dismissAssessmentBanner = usePromotionalStore((state) => state.dismissAssessmentBanner);
  const dismissModal = usePromotionalStore((state) => state.dismissModal);
  const dismissBanner = usePromotionalStore((state) => state.dismissBanner);
  
  return { fetchAssessmentEvent, fetchCurrentEvent, dismissAssessmentModal, dismissAssessmentBanner, dismissModal, dismissBanner };
};
