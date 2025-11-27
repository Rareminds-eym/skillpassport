import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabaseClient';
// @ts-ignore - AuthContext is a .jsx file
import { useAuth } from '../context/AuthContext';

interface School {
  id: string;
  name: string;
  code: string;
  city?: string;
  state?: string;
  country?: string;
}

interface EducatorSchoolData {
  school: School | null;
  loading: boolean;
  error: string | null;
}

/**
 * Hook to fetch the school information for the currently logged-in educator
 */
export function useEducatorSchool(): EducatorSchoolData {
  const { user } = useAuth();
  const [school, setSchool] = useState<School | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchEducatorSchool = async () => {
      if (!user?.email) {
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        setError(null);

        // Get the educator record using the user's email
        const { data: educatorData, error: educatorError } = await supabase
          .from('school_educators')
          .select(`
            id,
            school_id,
            schools!school_educators_school_id_fkey (
              id,
              name,
              code,
              city,
              state,
              country
            )
          `)
          .eq('email', user.email)
          .maybeSingle();

        if (educatorError) {
          throw educatorError;
        }

        if (educatorData && educatorData.schools) {
          // Extract school data from the join
          const schoolData = Array.isArray(educatorData.schools) 
            ? educatorData.schools[0] 
            : educatorData.schools;
          
          setSchool(schoolData as School);
        } else {
          setSchool(null);
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to fetch educator school');
        setSchool(null);
      } finally {
        setLoading(false);
      }
    };

    fetchEducatorSchool();
  }, [user?.email]);

  return { school, loading, error };
}
