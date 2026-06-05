import { useState, useEffect } from 'react';
import { apiPost } from '@/shared/api/apiClient';

const clampProgress = (value) => Math.max(0, Math.min(100, value));

const calculateProgress = (completedModules, totalModules) => {
  if (!totalModules || totalModules === 0) return 0;
  const completed = Math.min(completedModules, totalModules);
  return clampProgress((completed / totalModules) * 100);
};

export const useLearnerLearning = (learnerId, enabled = true) => {
  const [learning, setLearning] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const fetchLearning = async () => {
    if (!learnerId || !enabled) return;

    try {
      setLoading(true);
      setError(null);

      const trainingsResult = await apiPost('/learner-profile/actions', {
        action: 'fetch-trainings', learnerId,
      });
      const allTrainings = Array.isArray(trainingsResult?.data) ? trainingsResult.data : [];
      const trainings = allTrainings.filter(t => ['verified', 'approved'].includes(t.approval_status));

      if (!trainings.length) {
        setLearning([]);
        return;
      }

      const trainingIds = trainings.map(t => t.id);

      const [skillsResult, certsResult] = await Promise.all([
        apiPost('/learner-profile/actions', { action: 'fetch-skills-by-training', trainingIds }),
        apiPost('/learner-profile/actions', { action: 'fetch-certificates-by-training', trainingIds }),
      ]);

      const skillsByTraining = {};
      for (const s of (skillsResult?.data || [])) {
        if (!skillsByTraining[s.training_id]) skillsByTraining[s.training_id] = [];
        skillsByTraining[s.training_id].push(s);
      }

      const certsByTraining = {};
      for (const c of (certsResult?.data || [])) {
        if (!certsByTraining[c.training_id]) certsByTraining[c.training_id] = [];
        certsByTraining[c.training_id].push(c);
      }

      const result = trainings.map(item => {
        const progressValue = (item.status || '').toLowerCase() === 'completed' ? 100
          : item.total_modules > 0 ? calculateProgress(item.completed_modules, item.total_modules) : 0;

        return {
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
          skills: (skillsByTraining[item.id] || []).map(s => s.name),
          certificateUrl: (certsByTraining[item.id] || [])[0]?.link || null,
          progress: progressValue,
          status: item.status,
          approval_status: item.approval_status,
          verified: item.approval_status === 'approved',
          processing: item.approval_status === 'pending',
          enabled: item.enabled !== false,
          source: item.source,
          createdAt: item.created_at,
          updatedAt: item.updated_at,
        };
      });

      setLearning(result);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLearning();
  }, [learnerId, enabled]);

  return { learning, loading, error, refresh: fetchLearning };
};
