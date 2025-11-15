import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabaseClient';

export const useStudentExperience = (studentId, enabled = true) => {
  const [experience, setExperience] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const fetchExperience = async () => {
    if (!studentId || !enabled) return;

    try {
      setLoading(true);
      setError(null);

      const { data, error: fetchError } = await supabase
        .from('experience')
        .select('*')
        .eq('student_id', studentId)
        .order('start_date', { ascending: false });

      if (fetchError) {
        throw fetchError;
      }

      // Transform data to match UI expectations
      const transformedData = data.map(item => ({
        id: item.id,
        role: item.job_title || item.position || item.role,
        organization: item.company || item.organization,
        department: item.department,
        location: item.location,
        employmentType: item.employment_type,
        startDate: item.start_date,
        endDate: item.end_date,
        duration: item.duration || calculateDuration(item.start_date, item.end_date),
        description: item.description,
        responsibilities: item.responsibilities || [],
        achievements: item.achievements || [],
        skills: item.skills_used || [],
        technologies: item.technologies_used || [],
        salary: item.salary,
        verified: item.verified || item.approval_status === 'approved',
        processing: item.approval_status === 'pending',
        enabled: item.enabled !== false,
        referenceContact: item.reference_contact,
        certificateUrl: item.certificate_url,
        createdAt: item.created_at,
        updatedAt: item.updated_at
      }));

      setExperience(transformedData);
    } catch (err) {
      console.error('Error fetching experience:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  // Helper function to calculate duration
  const calculateDuration = (startDate, endDate) => {
    if (!startDate) return '';
    
    const start = new Date(startDate);
    const end = endDate ? new Date(endDate) : new Date();
    
    const diffTime = Math.abs(end - start);
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    const diffMonths = Math.floor(diffDays / 30);
    const diffYears = Math.floor(diffMonths / 12);
    
    if (diffYears > 0) {
      const remainingMonths = diffMonths % 12;
      return remainingMonths > 0 
        ? `${diffYears} year${diffYears > 1 ? 's' : ''} ${remainingMonths} month${remainingMonths > 1 ? 's' : ''}`
        : `${diffYears} year${diffYears > 1 ? 's' : ''}`;
    } else if (diffMonths > 0) {
      return `${diffMonths} month${diffMonths > 1 ? 's' : ''}`;
    } else {
      return `${diffDays} day${diffDays > 1 ? 's' : ''}`;
    }
  };

  useEffect(() => {
    fetchExperience();
  }, [studentId, enabled]);

  const refresh = () => {
    fetchExperience();
  };

  return {
    experience,
    loading,
    error,
    refresh
  };
};