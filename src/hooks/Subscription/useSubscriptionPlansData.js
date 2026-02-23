/**
 * useSubscriptionPlansData
 * 
 * Fetches subscription plans EXCLUSIVELY from the Cloudflare Worker backend.
 * NO hardcoded pricing fallbacks. If the API fails, we show an error — not stale data.
 * 
 * State machine:
 *   plans = null   → still loading (never been fetched / in-flight)
 *   plans = []     → API returned 0 plans (unlikely, but handled)
 *   plans = [...]  → successfully loaded
 *   error = ...    → fetch failed
 */
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';

const PAYMENTS_API_URL =
  import.meta.env.VITE_PAYMENTS_API_URL ||
  'https://payments-api.dark-mode-d021.workers.dev';

const MAX_RETRIES = 2;
const RETRY_DELAY_MS = 1500;

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

/**
 * Fetch subscription plans from the Cloudflare Worker.
 *
 * @param {Object} options
 * @param {string} options.businessType  - 'b2b' | 'b2c'
 * @param {string} options.entityType    - 'school' | 'college' | 'university' | 'recruitment' | 'all'
 * @param {string} options.roleType      - 'student' | 'educator' | 'admin' | 'recruiter' | 'all'
 *
 * @returns {{ plans, loading, error, refetch }}
 */
export function useSubscriptionPlansData(options = {}) {
  const {
    businessType = 'b2b',
    entityType = 'all',
    roleType = 'all',
  } = options;

  // null  = not yet loaded (show full-page spinner)
  // []    = loaded, but API returned no plans
  // [...] = loaded plans
  const [plans, setPlans] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Stable fetch params so the effect only re-runs when they actually change
  const fetchParams = useMemo(
    () => ({ businessType, entityType, roleType }),
    [businessType, entityType, roleType]
  );

  // Guard against setting state on unmounted component
  const isMounted = useRef(true);
  useEffect(() => {
    isMounted.current = true;
    return () => {
      isMounted.current = false;
    };
  }, []);

  const fetchPlans = useCallback(
    async (retryCount = 0) => {
      if (!isMounted.current) return;

      setLoading(true);
      setError(null);

      const params = new URLSearchParams({
        businessType: fetchParams.businessType,
        entityType: fetchParams.entityType,
        roleType: fetchParams.roleType,
        // Fetch ALL features — no artificial limit
      });

      try {
        const response = await fetch(
          `${PAYMENTS_API_URL}/subscription-plans?${params}`
        );

        if (!response.ok) {
          const errData = await response.json().catch(() => ({}));
          throw new Error(
            errData.error || `HTTP ${response.status}: Failed to fetch plans`
          );
        }

        const data = await response.json();

        if (!data.success) {
          throw new Error(data.error || 'API returned unsuccessful response');
        }

        if (!isMounted.current) return;

        const fetchedPlans = data.plans || [];
        setPlans(fetchedPlans);
        setLoading(false);
        return fetchedPlans;
      } catch (err) {
        if (!isMounted.current) return;

        // Retry with exponential backoff
        if (retryCount < MAX_RETRIES) {
          console.warn(
            `[SubscriptionPlans] Fetch failed (attempt ${retryCount + 1}/${MAX_RETRIES + 1}), retrying…`,
            err.message
          );
          await sleep(RETRY_DELAY_MS * (retryCount + 1));
          return fetchPlans(retryCount + 1);
        }

        console.error('[SubscriptionPlans] All fetch attempts failed:', err);
        setError(err);
        setPlans([]); // explicitly empty — not null — so caller knows we finished
        setLoading(false);
        return [];
      }
    },
    [fetchParams]
  );

  // Track whether the initial fetch has run so we don't double-fire in StrictMode
  const hasFetchedInitial = useRef(false);

  useEffect(() => {
    if (hasFetchedInitial.current) return;
    hasFetchedInitial.current = true;
    fetchPlans();
  }, [fetchPlans]);

  return {
    plans,   // null while loading, [] or [...] after
    loading,
    error,
    refetch: () => {
      hasFetchedInitial.current = false;
      fetchPlans();
    },
  };
}

/**
 * Fetch a single plan by plan_code from the Cloudflare Worker.
 */
export function useSubscriptionPlan(planCode) {
  const [plan, setPlan] = useState(null);
  const [features, setFeatures] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!planCode) {
      setLoading(false);
      return;
    }

    let cancelled = false;

    async function fetchPlan() {
      setLoading(true);
      setError(null);

      try {
        const response = await fetch(
          `${PAYMENTS_API_URL}/subscription-plan?planCode=${encodeURIComponent(planCode)}`
        );

        if (!response.ok) {
          const errData = await response.json().catch(() => ({}));
          throw new Error(errData.error || `HTTP ${response.status}`);
        }

        const data = await response.json();

        if (!data.success) {
          throw new Error(data.error || 'Failed to fetch plan');
        }

        if (!cancelled) {
          setPlan(data.plan);
          setFeatures(data.plan?.detailedFeatures || []);
        }
      } catch (err) {
        if (!cancelled) {
          console.error('[useSubscriptionPlan] Error:', err);
          setError(err);
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    fetchPlan();
    return () => {
      cancelled = true;
    };
  }, [planCode]);

  return { plan, features, loading, error };
}

/**
 * Get features comparison across all plans from the Cloudflare Worker.
 */
export function useSubscriptionFeaturesComparison() {
  const [comparison, setComparison] = useState([]);
  const [plans, setPlans] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    let cancelled = false;

    async function fetchComparison() {
      setLoading(true);
      setError(null);

      try {
        const response = await fetch(
          `${PAYMENTS_API_URL}/subscription-features`
        );

        if (!response.ok) {
          const errData = await response.json().catch(() => ({}));
          throw new Error(errData.error || `HTTP ${response.status}`);
        }

        const data = await response.json();

        if (!data.success) {
          throw new Error(data.error || 'Failed to fetch features comparison');
        }

        if (!cancelled) {
          setPlans(data.plans || []);
          setComparison(data.comparison || []);
        }
      } catch (err) {
        if (!cancelled) {
          console.error('[useSubscriptionFeaturesComparison] Error:', err);
          setError(err);
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    fetchComparison();
    return () => {
      cancelled = true;
    };
  }, []);

  return { comparison, plans, loading, error };
}

export default useSubscriptionPlansData;
