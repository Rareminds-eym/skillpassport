import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabaseClient';

// Helper to clamp progress between 0 and 100
const clampProgress = (value) => Math.max(0, Math.min(100, value));

// Calculate progress based on completed/total modules
const calculateProgress = (completedModules, totalModules) => {
  if (!totalModules || totalModules === 0) return 0;
  const completed = Math.min(completedModules, totalModules);
  return clampProgress((completed / totalModules) * 100);
};

export const useStudentLearning = (studentId, enabled = true) => {
  const [learning, setLearning] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const fetchLearning = async () => {
    if (!studentId || !enabled) return;

    try {
      setLoading(true);
      setError(null);

      // 1. Fetch trainings (table name stays same for backend compatibility)
      const { data: trainings, error: fetchError } = await supabase
        .from('trainings')
        .select('*')
        .eq('student_id', studentId)
        .order('created_at', { ascending: false });

      if (fetchError) throw fetchError;

      let result = [];

      for (const item of trainings) {
        const trainingId = item.id;

        // 2. Fetch related skills
        const { data: skillRows } = await supabase
          .from('skills')
          .select('name')
          .eq('training_id', trainingId)
          .eq('enabled', true);

        // 3. Fetch related certificate
        const { data: certificateRows } = await supabase
          .from('certificates')
          .select('link')
          .eq('training_id', trainingId)
          .eq('enabled', true)
          .limit(1);
          
        let progressValue = 0;
        const statusLower = (item.status || '').toLowerCase();
        if (statusLower === 'completed') {
          progressValue = 100;
        } else if (item.total_modules > 0) {
          progressValue = calculateProgress(item.completed_modules, item.total_modules);
        }

        result.push({
          id: item.id,
          course: item.title,
          provider: item.organization,
          duration: item.duration,
          description: item.description,
          startDate: item.start_date,
          endDate: item.end_date,
          total_modules: item.total_modules,
          completed_modules: item.completed_modules,
          hours_spent: item.hours_spent,
          skills: skillRows?.map(s => s.name) || [],
          certificateUrl: certificateRows?.[0]?.link || null,
          progress: progressValue,
          status: item.status,
          approval_status: item.approval_status,
          verified: item.approval_status === 'approved',
          processing: item.approval_status === 'pending',
          enabled: item.enabled !== false,
          source: item.source, // Add source to identify internal vs external courses
          createdAt: item.created_at,
          updatedAt: item.updated_at
        });
      }

      setLearning(result);
    } catch (err) {
      console.error('Error fetching learning:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLearning();
  }, [studentId, enabled]);

  return { learning, loading, error, refresh: fetchLearning };
};
