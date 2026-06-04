import { useState, useEffect, useCallback } from 'react';
import { apiGet } from '@/shared/api/apiClient';
import { getLogger } from '@/shared/config/logging';

const logger = getLogger('learner-activity');

export interface UselearnerActivityOptions {
  learnerId?: string | null;
  email?: string | null;
  enabled?: boolean;
  limit?: number;
  since?: Date | null;
}

export interface LearningItem {
  id: string;
  course: string;
  provider: string;
  duration: string;
  description: string;
  startDate: string;
  endDate: string;
  total_modules: number;
  completed_modules: number;
  hours_spent: number;
  skills: string[];
  certificateUrl: string | null;
  progress: number;
  status: string;
  approval_status: string;
  verified: boolean;
  processing: boolean;
  enabled: boolean;
  source: string;
  createdAt: string;
  updatedAt: string;
}

export interface Achievement {
  id: string;
  type: 'education' | 'training' | 'experience' | 'skill';
  title: string;
  subtitle: string;
  description: string;
  date: string;
  status?: string;
  progress?: number;
  certificateUrl?: string;
  verified: boolean;
  source: string;
}

export interface Badge {
  id: string;
  name: string;
  description: string;
  icon: string;
  color: string;
  rarity: 'common' | 'rare' | 'epic' | 'legendary';
  earnedDate: string;
}

export interface RecentUpdate {
  id: string;
  type: string;
  title: string;
  description: string;
  timestamp: string;
  metadata?: any;
}

export const useLearnerActivity = ({
  learnerId,
  email,
  enabled = true,
  limit = 10,
  since = null,
}: UselearnerActivityOptions) => {
  const [learning, setLearning] = useState<LearningItem[]>([]);
  const [achievements, setAchievements] = useState<Achievement[]>([]);
  const [badges, setBadges] = useState<Badge[]>([]);
  const [updates, setUpdates] = useState<RecentUpdate[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchActivityData = useCallback(async () => {
    if ((!learnerId && !email) || !enabled) {
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setError(null);
      await Promise.all([
        fetchLearning(learnerId),
        fetchAchievements(learnerId),
        fetchRecentUpdates(email),
      ]);
    } catch (err: any) {
      logger.error('Error fetching activity data', err as Error);
      setError(err.message || 'Failed to fetch activity data');
    } finally {
      setLoading(false);
    }
  }, [learnerId, email, enabled, limit, since]);

  const fetchLearning = async (sid: string | null | undefined) => {
    if (!sid) return;
    try {
      const response: any = await apiGet(`/learners/trainings?learner_id=${sid}`);
      const trainings = response?.data?.trainings ?? response?.trainings ?? [];

      const result: LearningItem[] = trainings.map((item: any) => {
        let progressValue = 0;
        const statusLower = (item.status || '').toLowerCase();
        if (statusLower === 'completed') {
          progressValue = 100;
        } else if (item.total_modules > 0) {
          progressValue = Math.round((item.completed_modules / item.total_modules) * 100);
        }

        return {
          id: item.id,
          course: item.title || item.course,
          provider: item.organization,
          duration: item.duration,
          description: item.description,
          startDate: item.start_date,
          endDate: item.end_date,
          total_modules: item.total_modules,
          completed_modules: item.completed_modules,
          hours_spent: item.hours_spent,
          skills: (item.skills || []).map((s: any) => s.name),
          certificateUrl: (item.certificates || [])[0]?.link || null,
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
      logger.error('Error fetching learning', err as Error);
    }
  };

  const fetchAchievements = async (sid: string | null | undefined) => {
    if (!sid) return;
    try {
      const params = sid ? `?learner_id=${sid}` : '';
      const response: any = await apiGet(`/learners/dashboard${params}`);
      const data = response?.data ?? response ?? {};

      const education = data.education || [];
      const trainings = data.training || [];
      const experience = data.experience || [];
      const techSkills = data.skills?.technical || [];
      const softSkills = data.skills?.soft || [];

      const allAchievements: Achievement[] = [];

      education.forEach((edu: any) => {
        allAchievements.push({
          id: `edu-${edu.id}`,
          type: 'education',
          title: edu.degree || 'Degree',
          subtitle: edu.university || edu.institution,
          description: `${edu.level || 'Education'} - ${edu.cgpa ? `Grade: ${edu.cgpa}` : ''}`,
          date: edu.year_of_passing || edu.created_at,
          status: edu.status,
          verified: false,
          source: 'education_table',
        });
      });

      trainings.forEach((training: any) => {
        allAchievements.push({
          id: `training-${training.id}`,
          type: 'training',
          title: training.course,
          subtitle: 'Training Completed',
          description: `Progress: ${training.progress}%`,
          date: training.end_date || training.updated_at,
          status: training.status,
          progress: training.progress,
          certificateUrl: training.certificate_url,
          verified: training.progress === 100,
          source: 'training_table',
        });
      });

      experience.forEach((exp: any) => {
        allAchievements.push({
          id: `exp-${exp.id}`,
          type: 'experience',
          title: exp.role,
          subtitle: exp.organization,
          description: exp.description || 'Work experience',
          date: exp.end_date || exp.start_date || exp.created_at,
          verified: exp.verified,
          source: 'experience_table',
        });
      });

      techSkills.forEach((skill: any) => {
        if (skill.level >= 4) {
          allAchievements.push({
            id: `skill-${skill.id}`,
            type: 'skill',
            title: `${skill.name} Proficiency`,
            subtitle: skill.category,
            description: `Achieved ${getSkillLevelText(skill.level)} level`,
            date: skill.updated_at || skill.created_at,
            verified: skill.verified,
            source: 'skills_table',
          });
        }
      });

      allAchievements.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
      setAchievements(allAchievements);

      const generatedBadges = generateBadges({
        techSkills,
        softSkills,
        education,
        training: trainings,
        experience,
      });
      setBadges(generatedBadges);
    } catch (err) {
      logger.error('Error fetching achievements', err as Error);
    }
  };

  const fetchRecentUpdates = async (_emailAddr: string | null | undefined) => {
    // TODO: Implement when getlearnerRecentUpdatesByEmail is available
    // Previously tried dynamic import from learnerProfileService which doesn't exist yet
  };

  const refresh = useCallback(() => {
    fetchActivityData();
  }, [fetchActivityData]);

  useEffect(() => {
    fetchActivityData();
  }, [fetchActivityData]);

  return {
    learning,
    achievements,
    badges,
    updates,
    loading,
    error,
    refresh,
    refreshLearning: () => fetchLearning(learnerId),
    refreshAchievements: () => fetchAchievements(learnerId),
    refreshUpdates: () => fetchRecentUpdates(email),
  };
};

const getSkillLevelText = (level: number): string => {
  if (level >= 5) return 'Expert';
  if (level >= 4) return 'Advanced';
  if (level >= 3) return 'Intermediate';
  if (level >= 2) return 'Beginner';
  return 'Novice';
};

const generateBadges = ({ techSkills, softSkills, education, training, experience }: any): Badge[] => {
  const badges: Badge[] = [];
  const expertSkills = techSkills.filter((s: any) => s.level >= 5);

  if (expertSkills.length >= 3) {
    badges.push({
      id: 'badge-expert-trilogy',
      name: 'Triple Expert',
      description: `Mastered ${expertSkills.length} technologies at expert level`,
      icon: '🏆',
      color: 'gold',
      rarity: 'legendary',
      earnedDate: new Date().toISOString(),
    });
  }

  const hasFrontend = techSkills.some((s: any) =>
    ['React', 'Vue', 'Angular', 'JavaScript', 'HTML', 'CSS'].some(tech =>
      s.name.toLowerCase().includes(tech.toLowerCase())) && s.level >= 3
  );
  const hasBackend = techSkills.some((s: any) =>
    ['Node', 'Python', 'Java', 'PHP', 'Ruby', 'Django', 'Flask', 'Express'].some(tech =>
      s.name.toLowerCase().includes(tech.toLowerCase())) && s.level >= 3
  );
  const hasDatabase = techSkills.some((s: any) =>
    ['SQL', 'MongoDB', 'PostgreSQL', 'MySQL', 'Database'].some(tech =>
      s.name.toLowerCase().includes(tech.toLowerCase())) && s.level >= 3
  );

  if (hasFrontend && hasBackend && hasDatabase) {
    badges.push({
      id: 'badge-fullstack',
      name: 'Full Stack Developer',
      description: 'Proficient in frontend, backend, and database technologies',
      icon: '💻',
      color: 'blue',
      rarity: 'epic',
      earnedDate: new Date().toISOString(),
    });
  }

  const completedTraining = training.filter((t: any) => t.status === 'completed' || t.progress === 100);
  if (completedTraining.length >= 5) {
    badges.push({
      id: 'badge-lifelong-learner',
      name: 'Lifelong Learner',
      description: `Completed ${completedTraining.length} training courses`,
      icon: '📖',
      color: 'teal',
      rarity: 'rare',
      earnedDate: new Date().toISOString(),
    });
  }

  if (experience.length >= 3) {
    badges.push({
      id: 'badge-experienced',
      name: 'Seasoned Professional',
      description: `${experience.length}+ work experiences`,
      icon: '💼',
      color: 'amber',
      rarity: 'epic',
      earnedDate: new Date().toISOString(),
    });
  }

  return badges;
};
