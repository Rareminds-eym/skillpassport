import { useState, useEffect, useCallback } from 'react';
import { supabase } from '../lib/supabaseClient';

/**
 * Custom hook to fetch and manage promotional events
 * Modal shows first, then banner shows after modal is dismissed
 * Banner state is NOT persisted - only modal dismissal triggers banner
 */
export const usePromotionalEvent = () => {
  const [event, setEvent] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Modal dismissed state - persisted in sessionStorage
  const [isModalDismissed, setIsModalDismissed] = useState(() => {
    for (let i = 0; i < sessionStorage.length; i++) {
      const key = sessionStorage.key(i);
      if (key?.startsWith('promo_modal_dismissed_') && sessionStorage.getItem(key) === 'true') {
        return true;
      }
    }
    return false;
  });

  // Banner dismissed state - NOT persisted, only in memory
  // This ensures banner shows after modal close but NOT after refresh
  const [isBannerDismissed, setIsBannerDismissed] = useState(true); // Start as true (hidden)

  // Track if modal was just dismissed in this session to show banner
  const [showBannerAfterModal, setShowBannerAfterModal] = useState(false);

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
          const modalKey = `promo_modal_dismissed_${data.event_code}`;
          setIsModalDismissed(sessionStorage.getItem(modalKey) === 'true');
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

  // Dismiss modal handler - shows banner immediately after
  const dismissModal = useCallback(() => {
    if (event) {
      sessionStorage.setItem(`promo_modal_dismissed_${event.event_code}`, 'true');
      setIsModalDismissed(true);
      // Show banner immediately after modal is dismissed
      setIsBannerDismissed(false);
      setShowBannerAfterModal(true);
    }
  }, [event]);

  // Dismiss banner handler - only in memory, not persisted
  const dismissBanner = useCallback(() => {
    setIsBannerDismissed(true);
    setShowBannerAfterModal(false);
  }, []);

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

  // Show modal if event exists and not dismissed
  const showModal = event && !isModalDismissed;

  // Show banner only if modal was dismissed AND banner not dismissed (in current session only)
  const showBanner = event && isModalDismissed && showBannerAfterModal && !isBannerDismissed;

  return {
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
};

export default usePromotionalEvent;
