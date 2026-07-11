import { useState, useEffect } from 'react';

export interface StrengthsGrowthPlan {
  strengths: Array<{ title: string; reason: string }>;
  growthAreas: Array<{ title: string; reason: string }>;
  immediateActions: Array<{ title: string }>;
  timeline: Array<{ month: string; capability: string }>;
  cached: boolean;
}

export function useStrengthsGrowthPlan(
  roleName: string | null,
  learnerProfile: any,
  assessmentResultId: string | null,
  enabled: boolean = true
) {
  const [data, setData] = useState<StrengthsGrowthPlan | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    console.log('[useStrengthsGrowthPlan] Debug:', { enabled, roleName, hasProfile: !!learnerProfile, assessmentResultId });

    if (!enabled || !roleName || !learnerProfile || !assessmentResultId) {
      console.log('[useStrengthsGrowthPlan] Skipping fetch:', { enabled, roleName, assessmentResultId });
      return;
    }

    const fetchPlan = async () => {
      setLoading(true);
      setError(null);

      try {
        const payload = {
          roleName,
          learnerProfile,
          assessmentResultId
        };

        console.log('[useStrengthsGrowthPlan] Fetching with payload:', payload);

        const response = await fetch('/api/assessment/generate-strengths-growth-plan', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload)
        });

        console.log('[useStrengthsGrowthPlan] Response status:', response.status);

        if (!response.ok) {
          const err = await response.json();
          console.error('[useStrengthsGrowthPlan] API error:', err);
          throw new Error(err.error || 'Failed to generate plan');
        }

        const result = await response.json();
        console.log('[useStrengthsGrowthPlan] Got result:', result);
        setData(result);
      } catch (err: any) {
        console.error('Error fetching strengths & growth plan:', err);
        setError(err.message || 'Failed to fetch plan');
      } finally {
        setLoading(false);
      }
    };

    fetchPlan();
  }, [roleName, assessmentResultId, enabled]); // Don't include learnerProfile in deps to prevent infinite loops

  return { data, loading, error };
}
