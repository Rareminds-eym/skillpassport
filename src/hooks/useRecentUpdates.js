import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabaseClient';
import { useSupabaseAuth } from '../context/SupabaseAuthContext';

export const useRecentUpdates = () => {
  const { user, loading: authLoading } = useSupabaseAuth();
  const [recentUpdates, setRecentUpdates] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchRecentUpdates = async () => {
    // Wait for auth to finish loading
    if (authLoading) {
      return;
    }

    // If no user is authenticated, clear data
    if (!user) {
      setRecentUpdates([]);
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setError(null);

      console.log('� Fetching recent updates for authenticated user:', user.id);

      // Fetch recent updates for this authenticated user
      const { data: updatesData, error: updatesError } = await supabase
        .from('recent_updates')
        .select('*')
        .eq('user_id', user.id)
        .single();

      if (updatesError && updatesError.code !== 'PGRST116') { // PGRST116 = no rows found
        console.error('❌ Error fetching recent updates:', updatesError);
        throw updatesError;
      }

      if (updatesData && updatesData.updates && updatesData.updates.updates) {
        console.log('✅ Recent updates fetched:', updatesData.updates.updates);
        setRecentUpdates(updatesData.updates.updates);
      } else {
        console.log('📝 No recent updates found for user');
        // Set default fallback updates if none exist
        setRecentUpdates([
          {
            id: "default-1",
            message: "Welcome to your dashboard!",
            timestamp: "Just now",
            type: "welcome"
          }
        ]);
      }

    } catch (err) {
      console.error('❌ Error in useRecentUpdates:', err);
      setError(err.message);
      // Set fallback updates on error
      setRecentUpdates([
        {
          id: "error-1",
          message: "Unable to load recent updates",
          timestamp: "Now",
          type: "error"
        }
      ]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRecentUpdates();
  }, [user, authLoading]);

  const refreshRecentUpdates = () => {
    fetchRecentUpdates();
  };

  return {
    recentUpdates,
    loading,
    error,
    refreshRecentUpdates
  };
};