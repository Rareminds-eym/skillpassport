import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabaseClient';

export const useStudentEducation = (studentId, enabled = true) => {
  const [education, setEducation] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const fetchEducation = async () => {
    if (!studentId || !enabled) return;

    try {
      setLoading(true);
      setError(null);

      const { data, error: fetchError } = await supabase
        .from('education')
        .select('*')
        .eq('student_id', studentId)
        .order('year_of_passing', { ascending: false });

      if (fetchError) {
        throw fetchError;
      }

      // Transform data to match UI expectations
      const transformedData = data.map(item => ({
        id: item.id,
        degree: item.degree || item.qualification,
        university: item.university || item.institution,
        college: item.college || item.school_name,
        department: item.department || item.field_of_study,
        yearOfPassing: item.year_of_passing,
        year_of_passing: item.year_of_passing,
        cgpa: item.cgpa || item.gpa,
        level: item.level || item.qualification_level,
        status: item.status || 'completed',
        startDate: item.start_date,
        endDate: item.end_date,
        enabled: item.enabled !== false,
        verified: item.approval_status === 'approved',
        processing: item.approval_status === 'pending',
        createdAt: item.created_at,
        updatedAt: item.updated_at
      }));

      setEducation(transformedData);
    } catch (err) {
      console.error('Error fetching education:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchEducation();
  }, [studentId, enabled]);

  const refresh = () => {
    fetchEducation();
  };

  return {
    education,
    loading,
    error,
    refresh
  };
};