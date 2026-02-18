/**
 * Hook to fetch subscription plans from Cloudflare Workers backend
 * Uses payments-api worker endpoints instead of direct Supabase calls
 */
import { useCallback, useEffect, useState, useRef } from 'react';

// Payments API URL - uses environment variable or default
const PAYMENTS_API_URL = import.meta.env.VITE_PAYMENTS_API_URL || 'https://payments-api.dark-mode-d021.workers.dev';

/**
 * Fetch subscription plans from Cloudflare Worker backend
 * @param {Object} options - Filter options
 * @param {string} options.businessType - 'b2b' or 'b2c'
 * @param {string} options.entityType - 'school', 'college', 'university', 'recruitment', 'all'
 * @param {string} options.roleType - 'student', 'educator', 'admin', 'recruiter', 'all'
 * @param {number} options.featuresLimit - Limit features to this number (default: 4, null for all)
 * @returns {Object} { plans, features, loading, loadingMore, error, refetch, fetchAllFeatures }
 */
export function useSubscriptionPlansData(options = {}) {
  const { 
    businessType = 'b2b', 
    entityType = 'all', 
    roleType = 'all',
    featuresLimit = 4 // Default to 4 features initially
  } = options;

  const [plans, setPlans] = useState([]);
  const [allFeaturesPlans, setAllFeaturesPlans] = useState([]); // Store plans with all features
  const [features, setFeatures] = useState({});
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false); // Separate loading state for "Show more"
  const [error, setError] = useState(null);
  const [showingAllFeatures, setShowingAllFeatures] = useState(false);
  const hasFetchedAll = useRef(false); // Track if we've already fetched all features

  const fetchPlans = useCallback(async (limit = featuresLimit, isLoadingMore = false) => {
    // Use appropriate loading state
    if (isLoadingMore) {
      setLoadingMore(true);
    } else {
      setLoading(true);
    }
    setError(null);

    try {
      const params = new URLSearchParams({
        businessType,
        entityType,
        roleType
      });
      
      // Add featuresLimit if specified
      if (limit !== null) {
        params.append('featuresLimit', String(limit));
      }

      const response = await fetch(`${PAYMENTS_API_URL}/subscription-plans?${params}`);
      
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || `HTTP ${response.status}`);
      }

      const data = await response.json();

      if (!data.success) {
        throw new Error(data.error || 'Failed to fetch plans');
      }

      // Group detailed features by plan_id
      const featuresByPlan = {};
      data.plans?.forEach(plan => {
        if (plan.detailedFeatures) {
          featuresByPlan[plan.dbId] = plan.detailedFeatures;
        }
      });

      const fetchedPlans = data.plans || [];
      
      // If fetching all features, store separately
      if (limit === null) {
        setAllFeaturesPlans(fetchedPlans);
        hasFetchedAll.current = true;
        setShowingAllFeatures(true);
      }
      
      setPlans(fetchedPlans);
      setFeatures(featuresByPlan);
      return fetchedPlans;
    } catch (err) {
      console.error('Error fetching subscription plans:', err);
      setError(err);
      return [];
    } finally {
      if (isLoadingMore) {
        setLoadingMore(false);
      } else {
        setLoading(false);
      }
    }
  }, [businessType, entityType, roleType, featuresLimit]);

  // Fetch all features (no limit) - call this when user clicks "Show more"
  const fetchAllFeatures = useCallback(async () => {
    // If we've already fetched all features, just switch to showing them
    if (hasFetchedAll.current && allFeaturesPlans.length > 0) {
      setPlans(allFeaturesPlans);
      setShowingAllFeatures(true);
      return allFeaturesPlans;
    }
    // Otherwise fetch from API
    return fetchPlans(null, true); // true = isLoadingMore
  }, [fetchPlans, allFeaturesPlans]);

  // Show limited features (switch back without refetching)
  const showLimitedFeatures = useCallback(async () => {
    setShowingAllFeatures(false);
    // Refetch with limit to get limited features
    return fetchPlans(featuresLimit, true);
  }, [fetchPlans, featuresLimit]);

  useEffect(() => {
    fetchPlans();
  }, [fetchPlans]);

  return {
    plans,
    features,
    loading,
    loadingMore,
    showingAllFeatures,
    error,
    refetch: fetchPlans,
    fetchAllFeatures,
    showLimitedFeatures
  };
}

/**
 * Fetch a single plan by plan_code from Cloudflare Worker
 * @param {string} planCode - The plan code (basic, professional, enterprise, ecosystem)
 * @returns {Object} { plan, features, loading, error }
 */
export function useSubscriptionPlan(planCode) {
  const [plan, setPlan] = useState(null);
  const [features, setFeatures] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    async function fetchPlan() {
      if (!planCode) {
        setLoading(false);
        return;
      }

      setLoading(true);
      setError(null);

      try {
        const response = await fetch(`${PAYMENTS_API_URL}/subscription-plan?planCode=${planCode}`);
        
        if (!response.ok) {
          const errorData = await response.json().catch(() => ({}));
          throw new Error(errorData.error || `HTTP ${response.status}`);
        }

        const data = await response.json();

        if (!data.success) {
          throw new Error(data.error || 'Failed to fetch plan');
        }

        setPlan(data.plan);
        setFeatures(data.plan?.detailedFeatures || []);
      } catch (err) {
        console.error('Error fetching subscription plan:', err);
        setError(err);
      } finally {
        setLoading(false);
      }
    }

    fetchPlan();
  }, [planCode]);

  return { plan, features, loading, error };
}

/**
 * Get features comparison across all plans from Cloudflare Worker
 * @returns {Object} { comparison, plans, loading, error }
 */
export function useSubscriptionFeaturesComparison() {
  const [comparison, setComparison] = useState([]);
  const [plans, setPlans] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    async function fetchComparison() {
      setLoading(true);
      setError(null);

      try {
        const response = await fetch(`${PAYMENTS_API_URL}/subscription-features`);
        
        if (!response.ok) {
          const errorData = await response.json().catch(() => ({}));
          throw new Error(errorData.error || `HTTP ${response.status}`);
        }

        const data = await response.json();

        if (!data.success) {
          throw new Error(data.error || 'Failed to fetch features');
        }

        setPlans(data.plans || []);
        setComparison(data.comparison || []);
      } catch (err) {
        console.error('Error fetching features comparison:', err);
        setError(err);
      } finally {
        setLoading(false);
      }
    }

    fetchComparison();
  }, []);

  return { comparison, plans, loading, error };
}

export default useSubscriptionPlansData;
