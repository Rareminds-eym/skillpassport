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
import { ssoClient } from '@/shared/api/ssoClient';

// Use Pages Functions for payments (not direct worker access)
const getBaseUrl = () => {
  const origin = window.location.origin;
  return `${origin}/api/payments`;
};

const MAX_RETRIES = 2;
const RETRY_DELAY_MS = 1500;

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function extractErrorMessage(err) {
  if (!err) return null;
  if (typeof err === 'string') return err;
  if (typeof err?.message === 'string') return err.message;
  return null;
}

/**
 * Fetch subscription plans from the Cloudflare Worker.
 *
 * @param {Object} options
 * @param {string} options.businessType  - 'b2b' | 'b2c'
 * @param {string} options.entityType    - 'school' | 'college' | 'university' | 'recruitment' | 'all'
 * @param {string} options.roleType      - 'learner' | 'educator' | 'admin' | 'recruiter' | 'all'
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

      const url = `${getBaseUrl()}/subscription-plans?${params}`;

      try {
        const response = await ssoClient.fetch(url);

        if (!response.ok) {
          const errData = await response.json().catch(() => ({}));
          throw new Error(
            extractErrorMessage(errData.error) || `HTTP ${response.status}: Failed to fetch plans`
          );
        }

        const data = await response.json();

        if (!data.success) {
          throw new Error(extractErrorMessage(data.error) || 'API returned unsuccessful response');
        }

        if (!isMounted.current) return;

        const fetchedPlans = data.data?.plans ?? [];
        setPlans(fetchedPlans);
        setLoading(false);
        return fetchedPlans;
      } catch (err) {
        if (!isMounted.current) return;

        // Retry with exponential backoff
        if (retryCount < MAX_RETRIES) {
          await sleep(RETRY_DELAY_MS * (retryCount + 1));
          return fetchPlans(retryCount + 1);
        }

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
        const response = await ssoClient.fetch(
          `${getBaseUrl()}/subscription-plan?planCode=${encodeURIComponent(planCode)}`
        );

        if (!response.ok) {
          const errData = await response.json().catch(() => ({}));
          throw new Error(extractErrorMessage(errData.error) || `HTTP ${response.status}`);
        }

        const data = await response.json();

        if (!data.success) {
          throw new Error(extractErrorMessage(data.error) || 'Failed to fetch plan');
        }

        if (!cancelled) {
          const planData = data.data?.plan;
          setPlan(planData);
          setFeatures(planData?.detailedFeatures || []);
        }
      } catch (err) {
        if (!cancelled) {
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
        const response = await ssoClient.fetch(
          `${getBaseUrl()}/subscription-features`
        );

        if (!response.ok) {
          const errData = await response.json().catch(() => ({}));
          throw new Error(extractErrorMessage(errData.error) || `HTTP ${response.status}`);
        }

        const data = await response.json();

        if (!data.success) {
          throw new Error(extractErrorMessage(data.error) || 'Failed to fetch features comparison');
        }

        if (!cancelled) {
          setPlans(data.data?.plans ?? []);
          setComparison(data.data?.comparison ?? []);
        }
      } catch (err) {
        if (!cancelled) {
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
