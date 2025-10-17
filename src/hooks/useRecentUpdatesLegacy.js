import { useState, useEffect } from 'react';

/**
 * Legacy hook for recent updates - provides fallback data when auth-based data is unavailable
 * This hook uses mock data for backward compatibility
 */
export const useRecentUpdatesLegacy = () => {
  const [recentUpdates, setRecentUpdates] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Mock recent updates data for legacy support
  const mockRecentUpdates = [
    {
      id: "legacy-1",
      message: "You completed FSQM Module 4.",
      timestamp: "2 hours ago",
      type: "achievement"
    },
    {
      id: "legacy-2",
      message: "3 recruiters viewed your profile.",
      timestamp: "1 day ago",
      type: "notification"
    },
    {
      id: "legacy-3",
      message: "New opportunity match: Frontend Developer at Zomato",
      timestamp: "2 days ago", 
      type: "opportunity"
    },
    {
      id: "legacy-4",
      message: "Your profile score increased to 85%",
      timestamp: "3 days ago",
      type: "achievement"
    },
    {
      id: "legacy-5",
      message: "Certificate verification completed",
      timestamp: "1 week ago",
      type: "verification"
    }
  ];

  const fetchRecentUpdatesLegacy = async () => {
    try {
      setLoading(true);
      setError(null);
      
      // Simulate API delay for realistic behavior
      await new Promise(resolve => setTimeout(resolve, 500));
      
      console.log('📚 Loading legacy recent updates (fallback mode)');
      setRecentUpdates(mockRecentUpdates);
      
    } catch (err) {
      console.error('❌ Error in useRecentUpdatesLegacy:', err);
      setError(err.message);
      // Even on error, provide some fallback data
      setRecentUpdates([
        {
          id: "fallback-1",
          message: "Welcome to your dashboard!",
          timestamp: "Now",
          type: "welcome"
        }
      ]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRecentUpdatesLegacy();
  }, []);

  const refreshRecentUpdates = () => {
    fetchRecentUpdatesLegacy();
  };

  return {
    recentUpdates,
    loading,
    error,
    refreshRecentUpdates
  };
};