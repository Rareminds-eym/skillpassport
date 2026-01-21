import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabaseClient';
// @ts-ignore - AuthContext is a .jsx file
import { useAuth } from '../context/AuthContext';

interface EducatorIdData {
  educatorId: string | null;
  loading: boolean;
  error: string | null;
}

/**
 * Hook to get the educator ID for the currently logged-in user
 * This ensures we get the correct educator ID for RLS and filtering
 */
export function useEducatorId(): EducatorIdData {
  const { user } = useAuth();
  const [educatorId, setEducatorId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchEducatorId = async () => {
      if (!user) {
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        setError(null);

        // First check if we have educator_id in the user object (from localStorage)
        if (user.educator_id) {
          setEducatorId(user.educator_id);
          setLoading(false);
          return;
        }

        // Get current Supabase session to ensure we have the right user ID
        const {
          data: { session },
          error: sessionError,
        } = await supabase.auth.getSession();

        if (sessionError || !session?.user) {
          throw new Error('No active session found');
        }

        // Look up educator by user_id (from Supabase auth) - check both school and college
        // First try school_educators
        const { data: schoolEducatorData, error: schoolEducatorError } = await supabase
          .from('school_educators')
          .select('id')
          .eq('user_id', session.user.id)
          .maybeSingle();

        if (schoolEducatorError && schoolEducatorError.code !== 'PGRST116') {
          throw schoolEducatorError;
        }

        if (schoolEducatorData) {
          setEducatorId(schoolEducatorData.id);
          setLoading(false);
          return;
        }

        // If not found in school_educators, try college_lecturers
        const { data: collegeEducatorData, error: collegeEducatorError } = await supabase
          .from('college_lecturers')
          .select('id')
          .eq('user_id', session.user.id)
          .maybeSingle();

        if (collegeEducatorError && collegeEducatorError.code !== 'PGRST116') {
          throw collegeEducatorError;
        }

        if (collegeEducatorData) {
          setEducatorId(collegeEducatorData.id);
          setLoading(false);
          return;
        }

        // Fallback: try to find by email in both tables
        const { data: schoolEducatorByEmail, error: schoolEmailError } = await supabase
          .from('school_educators')
          .select('id')
          .eq('email', user.email)
          .maybeSingle();

        if (schoolEmailError && schoolEmailError.code !== 'PGRST116') {
          throw schoolEmailError;
        }

        if (schoolEducatorByEmail) {
          setEducatorId(schoolEducatorByEmail.id);
          setLoading(false);
          return;
        }

        const { data: collegeEducatorByEmail, error: collegeEmailError } = await supabase
          .from('college_lecturers')
          .select('id')
          .eq('email', user.email)
          .maybeSingle();

        if (collegeEmailError && collegeEmailError.code !== 'PGRST116') {
          throw collegeEmailError;
        }

        if (collegeEducatorByEmail) {
          setEducatorId(collegeEducatorByEmail.id);
        } else {
          setError('Educator record not found');
        }
      } catch (err) {
        console.error('Error fetching educator ID:', err);
        setError(err instanceof Error ? err.message : 'Failed to fetch educator ID');
        setEducatorId(null);
      } finally {
        setLoading(false);
      }
    };

    fetchEducatorId();
  }, [user?.id, user?.email, user?.educator_id]);

  return { educatorId, loading, error };
}
