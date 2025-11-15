import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabaseClient';

export const useStudentSoftSkills = (studentId, enabled = true) => {
  const [softSkills, setSoftSkills] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const fetchSoftSkills = async () => {
    if (!studentId || !enabled) return;

    try {
      setLoading(true);
      setError(null);

      const { data, error: fetchError } = await supabase
        .from('skills')
        .select('*')
        .eq('student_id', studentId)
        .eq('type', 'soft')
        .order('level', { ascending: false });

      if (fetchError) {
        throw fetchError;
      }

      // Transform data to match UI expectations
      const transformedData = data.map(item => ({
        id: item.id,
        name: item.name,
        level: item.level || 3,
        type: item.type,
        description: item.description,
        verified: item.verified || item.approval_status === 'approved',
        processing: item.approval_status === 'pending',
        enabled: item.enabled !== false,
        createdAt: item.created_at,
        updatedAt: item.updated_at
      }));

      setSoftSkills(transformedData);
    } catch (err) {
      console.error('Error fetching soft skills:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSoftSkills();
  }, [studentId, enabled]);

  const refresh = () => {
    fetchSoftSkills();
  };

  return {
    softSkills,
    loading,
    error,
    refresh
  };
};