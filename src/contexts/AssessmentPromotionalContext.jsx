import { createContext, useCallback, useContext, useEffect, useState } from 'react';
import { supabase } from '../lib/supabaseClient';

const AssessmentPromotionalContext = createContext(null);

/**
 * Provider for assessment promotional modal state
 * Shows a promotional modal for taking assessment with payment
 * Modal shows on first visit, then banner shows after modal is dismissed
 * Uses end_date from promotional_events table in Supabase
 */
export const AssessmentPromotionalProvider = ({ children }) => {
  // Event data from database
  const [event, setEvent] = useState(null);

  // Modal dismissed state - persisted in sessionStorage
  const [isModalDismissed, setIsModalDismissed] = useState(true); // Start as true, then check storage

  // Banner dismissed state - persisted in sessionStorage
  const [isBannerDismissed, setIsBannerDismissed] = useState(false);

  // Loading state to prevent flash
  const [isLoaded, setIsLoaded] = useState(false);

  // Fetch promotional event from database and check sessionStorage on mount
  useEffect(() => {
    const fetchEventAndCheckStorage = async () => {
      try {
        // Fetch active promotional event (without date filtering to avoid server time issues)
        const { data, error } = await supabase
          .from('promotional_events')
          .select('*')
          .eq('is_active', true)
          .order('created_at', { ascending: false })
          .limit(1)
          .maybeSingle();

        if (!error && data) {
          setEvent(data);
        }
      } catch (err) {
        console.error('Error fetching promotional event:', err);
      }

      // Check sessionStorage
      const modalKey = 'assessment_promo_modal_dismissed_v3';
      const bannerKey = 'assessment_promo_banner_dismissed_v3';
      const dismissed = sessionStorage.getItem(modalKey) === 'true';
      setIsModalDismissed(dismissed);
      setIsBannerDismissed(sessionStorage.getItem(bannerKey) === 'true');

      // Small delay to ensure smooth page load
      setTimeout(() => {
        setIsLoaded(true);
      }, 500);
    };

    fetchEventAndCheckStorage();
  }, []);

  // Dismiss modal handler - banner will show after this
  const dismissModal = useCallback(() => {
    sessionStorage.setItem('assessment_promo_modal_dismissed_v3', 'true');
    setIsModalDismissed(true);
  }, []);

  // Dismiss banner handler - persisted in sessionStorage
  const dismissBanner = useCallback(() => {
    sessionStorage.setItem('assessment_promo_banner_dismissed_v3', 'true');
    setIsBannerDismissed(true);
  }, []);

  // Calculate time remaining using end_date from database
  const getTimeRemaining = useCallback(() => {
    // Use end_date from database event, fallback to 7 days from now
    let endDate;
    if (event?.end_date) {
      endDate = new Date(event.end_date);
    } else {
      endDate = new Date();
      endDate.setDate(endDate.getDate() + 7);
    }

    const now = new Date();
    const diff = endDate - now;

    if (diff <= 0) return null;

    const days = Math.floor(diff / (1000 * 60 * 60 * 24));
    const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
    const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
    const seconds = Math.floor((diff % (1000 * 60)) / 1000);

    return { days, hours, minutes, seconds, total: diff };
  }, [event]);

  // Show modal if loaded and not dismissed
  const showModal = isLoaded && !isModalDismissed;

  // Show banner if modal is dismissed and banner not dismissed
  const showBanner = isModalDismissed && !isBannerDismissed;

  const value = {
    event,
    showModal,
    showBanner,
    dismissModal,
    dismissBanner,
    getTimeRemaining,
    isModalDismissed,
    isBannerDismissed,
  };

  return (
    <AssessmentPromotionalContext.Provider value={value}>
      {children}
    </AssessmentPromotionalContext.Provider>
  );
};

export const useAssessmentPromotionalContext = () => {
  const context = useContext(AssessmentPromotionalContext);
  if (!context) {
    // Return default values if used outside provider (graceful fallback)
    return {
      event: null,
      showModal: false,
      showBanner: false,
      dismissModal: () => {},
      dismissBanner: () => {},
      getTimeRemaining: () => null,
      isModalDismissed: true,
      isBannerDismissed: true,
    };
  }
  return context;
};

export default AssessmentPromotionalContext;
