import { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { supabase } from '../lib/supabaseClient';

const PromotionalEventContext = createContext(null);

/**
 * Provider for promotional event state
 * Modal shows first, then banner shows after modal is dismissed
 * Banner persists until user closes it (stored in sessionStorage)
 */
export const PromotionalEventProvider = ({ children }) => {
  const [event, setEvent] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  
  // Modal dismissed state - persisted in sessionStorage
  const [isModalDismissed, setIsModalDismissed] = useState(false);
  
  // Banner dismissed state - persisted in sessionStorage
  const [isBannerDismissed, setIsBannerDismissed] = useState(false);

  // Fetch active promotional event
  useEffect(() => {
    const fetchEvent = async () => {
      try {
        const now = new Date().toISOString();
        
        const { data, error: fetchError } = await supabase
          .from('promotional_events')
          .select('*')
          .eq('is_active', true)
          .lte('start_date', now)
          .gte('end_date', now)
          .order('created_at', { ascending: false })
          .limit(1)
          .single();

        if (fetchError && fetchError.code !== 'PGRST116') {
          throw fetchError;
        }

        if (data) {
          setEvent(data);
          // Check sessionStorage for dismissal states
          const modalKey = `promo_modal_dismissed_${data.event_code}`;
          const bannerKey = `promo_banner_dismissed_${data.event_code}`;
          setIsModalDismissed(sessionStorage.getItem(modalKey) === 'true');
          setIsBannerDismissed(sessionStorage.getItem(bannerKey) === 'true');
        }
      } catch (err) {
        console.error('Error fetching promotional event:', err);
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchEvent();
  }, []);

  // Dismiss modal handler - banner will show after this
  const dismissModal = useCallback(() => {
    if (event) {
      sessionStorage.setItem(`promo_modal_dismissed_${event.event_code}`, 'true');
      setIsModalDismissed(true);
    }
  }, [event]);

  // Dismiss banner handler - persisted in sessionStorage
  const dismissBanner = useCallback(() => {
    if (event) {
      sessionStorage.setItem(`promo_banner_dismissed_${event.event_code}`, 'true');
      setIsBannerDismissed(true);
    }
  }, [event]);

  // Calculate time remaining
  const getTimeRemaining = useCallback(() => {
    if (!event?.end_date) return null;
    
    const end = new Date(event.end_date);
    const now = new Date();
    const diff = end - now;
    
    if (diff <= 0) return null;
    
    const days = Math.floor(diff / (1000 * 60 * 60 * 24));
    const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
    const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
    const seconds = Math.floor((diff % (1000 * 60)) / 1000);
    
    return { days, hours, minutes, seconds, total: diff };
  }, [event]);

  // Show modal if event exists and modal not dismissed
  const showModal = event && !isModalDismissed;
  
  // Show banner if event exists, modal is dismissed, and banner not dismissed
  const showBanner = event && isModalDismissed && !isBannerDismissed;

  const value = {
    event,
    loading,
    error,
    showModal,
    showBanner,
    dismissModal,
    dismissBanner,
    getTimeRemaining,
    isModalDismissed,
    isBannerDismissed,
  };

  return (
    <PromotionalEventContext.Provider value={value}>
      {children}
    </PromotionalEventContext.Provider>
  );
};

export const usePromotionalEventContext = () => {
  const context = useContext(PromotionalEventContext);
  if (!context) {
    throw new Error('usePromotionalEventContext must be used within PromotionalEventProvider');
  }
  return context;
};

export default PromotionalEventContext;
