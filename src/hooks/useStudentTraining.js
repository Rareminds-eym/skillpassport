import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabaseClient';

export const useStudentTraining = (studentId, enabled = true) => {
  const [training, setTraining] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const fetchTraining = async () => {
    if (!studentId || !enabled) return;

    try {
      setLoading(true);
      setError(null);

      const { data, error: fetchError } = await supabase
        .from('trainings')
        .select('*')
        .eq('student_id', studentId)
        .order('created_at', { ascending: false });

      if (fetchError) {
        throw fetchError;
      }

      // Transform data to match UI expectations
      const transformedData = data.map(item => ({
        id: item.id,
        course: item.course_name || item.title || item.name,
        provider: item.provider || item.organization,
        duration: item.duration,
        status: item.status || 'completed',
        progress: item.progress || 100,
        skills: item.skills_covered || [],
        startDate: item.start_date,
        endDate: item.end_date,
        certificateUrl: item.certificate_url,
        description: item.description,
        enabled: item.enabled !== false,
        verified: item.approval_status === 'approved',
        processing: item.approval_status === 'pending',
        createdAt: item.created_at,
        updatedAt: item.updated_at
      }));

      setTraining(transformedData);
    } catch (err) {
      console.error('Error fetching training:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTraining();
  }, [studentId, enabled]);

  const refresh = () => {
    fetchTraining();
  };

  return {
    training,
    loading,
    error,
    refresh
  };
};