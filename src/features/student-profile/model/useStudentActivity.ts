/**
 * Consolidated Student Activity Hook
 * 
 * Consolidates:
 * - useStudentLearning
 * - useStudentAchievements
 * - useStudentRecentUpdates
 * - useStudentRecentUpdatesById
 * 
 * Returns: learning, achievements, updates
 */

import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/shared/api/supabaseClient';
// TODO: Uncomment when functions are added to studentProfileService
// import { getStudentRecentUpdatesByEmail, formatRecentUpdate } from '../api/studentProfileService';

export interface UseStudentActivityOptions {
  studentId?: string | null;
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

export const useStudentActivity = ({ 
  studentId, 
  email, 
  enabled = true,
  limit = 10,
  since = null
}: UseStudentActivityOptions) => {
  const [learning, setLearning] = useState<LearningItem[]>([]);
  const [achievements, setAchievements] = useState<Achievement[]>([]);
  const [badges, setBadges] = useState<Badge[]>([]);
  const [updates, setUpdates] = useState<RecentUpdate[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Fetch all activity data
  const fetchActivityData = useCallback(async () => {
    if ((!studentId && !email) || !enabled) {
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setError(null);

      let actualStudentId = studentId;
      let actualEmail = email;

      // Get student ID if only email is provided
      if (!actualStudentId && actualEmail) {
        const { data: studentData } = await supabase
          .from('students')
          .select('id')
          .eq('email', actualEmail)
          .maybeSingle();
        actualStudentId = studentData?.id;
      }

      // Get email if only student ID is provided
      if (!actualEmail && actualStudentId) {
        const { data: studentData } = await supabase
          .from('students')
          .select('email')
          .eq('id', actualStudentId)
          .maybeSingle();
        actualEmail = studentData?.email;
      }

      await Promise.all([
        fetchLearning(actualStudentId),
        fetchAchievements(actualStudentId, actualEmail),
        fetchRecentUpdates(actualEmail)
      ]);
    } catch (err: any) {
      console.error('Error fetching activity data:', err);
      setError(err.message || 'Failed to fetch activity data');
    } finally {
      setLoading(false);
    }
  }, [studentId, email, enabled, limit, since]);

  // Fetch learning progress
  const fetchLearning = async (sid: string | null | undefined) => {
    if (!sid) return;

    try {
      const { data: trainings, error: fetchError } = await supabase
        .from('trainings')
        .select('*')
        .eq('student_id', sid)
        .eq('enabled', true)
        .in('approval_status', ['verified', 'approved'])
        .order('created_at', { ascending: false });

      if (fetchError) throw fetchError;

      const result: LearningItem[] = [];

      for (const item of (trainings || [])) {
        const trainingId = item.id;

        // Fetch related skills
        const { data: skillRows } = await supabase
          .from('skills')
          .select('name')
          .eq('training_id', trainingId)
          .eq('enabled', true);

        // Fetch related certificate
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
          progressValue = Math.round((item.completed_modules / item.total_modules) * 100);
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
          source: item.source,
          createdAt: item.created_at,
          updatedAt: item.updated_at
        });
      }

      setLearning(result);
    } catch (err) {
      console.error('Error fetching learning:', err);
    }
  };

  // Fetch achievements
  const fetchAchievements = async (sid: string | null | undefined, emailAddr: string | null | undefined) => {
    if (!sid && !emailAddr) return;

    try {
      let actualStudentId = sid;
      if (!actualStudentId && emailAddr) {
        const { data: studentData } = await supabase
          .from('students')
          .select('id')
          .eq('email', emailAddr)
          .maybeSingle();
        actualStudentId = studentData?.id;
      }

      if (!actualStudentId) return;

      // Fetch from separate tables in parallel
      const [educationRes, trainingRes, experienceRes, techSkillsRes, softSkillsRes] = await Promise.all([
        supabase.from('education').select('*').eq('student_id', actualStudentId),
        supabase.from('trainings').select('*').eq('student_id', actualStudentId),
        supabase.from('experience').select('*').eq('student_id', actualStudentId),
        supabase.from('skills').select('*').eq('student_id', actualStudentId).eq('type', 'technical'),
        supabase.from('skills').select('*').eq('student_id', actualStudentId).eq('type', 'soft'),
      ]);

      const allAchievements: Achievement[] = [];

      // Add education achievements
      if (educationRes.data) {
        educationRes.data.forEach(edu => {
          allAchievements.push({
            id: `edu-${edu.id}`,
            type: 'education',
            title: edu.degree || 'Degree',
            subtitle: edu.university || edu.institution,
            description: `${edu.level || 'Education'} - ${edu.cgpa ? `Grade: ${edu.cgpa}` : ''}`,
            date: edu.year_of_passing || edu.created_at,
            status: edu.status,
            verified: false,
            source: 'education_table'
          });
        });
      }

      // Add training achievements
      if (trainingRes.data) {
        trainingRes.data.forEach(training => {
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
            source: 'training_table'
          });
        });
      }

      // Add experience achievements
      if (experienceRes.data) {
        experienceRes.data.forEach(exp => {
          allAchievements.push({
            id: `exp-${exp.id}`,
            type: 'experience',
            title: exp.role,
            subtitle: exp.organization,
            description: exp.description || 'Work experience',
            date: exp.end_date || exp.start_date || exp.created_at,
            verified: exp.verified,
            source: 'experience_table'
          });
        });
      }

      // Add skill achievements (milestone-based)
      if (techSkillsRes.data) {
        techSkillsRes.data.forEach(skill => {
          if (skill.level >= 4) {
            allAchievements.push({
              id: `skill-${skill.id}`,
              type: 'skill',
              title: `${skill.name} Proficiency`,
              subtitle: skill.category,
              description: `Achieved ${getSkillLevelText(skill.level)} level`,
              date: skill.updated_at || skill.created_at,
              verified: skill.verified,
              source: 'skills_table'
            });
          }
        });
      }

      // Sort by date (most recent first)
      allAchievements.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

      setAchievements(allAchievements);

      // Generate badges
      const generatedBadges = generateBadges({
        techSkills: techSkillsRes.data || [],
        softSkills: softSkillsRes.data || [],
        education: educationRes.data || [],
        training: trainingRes.data || [],
        experience: experienceRes.data || []
      });
      setBadges(generatedBadges);
    } catch (err) {
      console.error('Error fetching achievements:', err);
    }
  };

  // Fetch recent updates
  const fetchRecentUpdates = async (emailAddr: string | null | undefined) => {
    if (!emailAddr) return;

    try {
      const result = await getStudentRecentUpdatesByEmail(emailAddr, since, limit);

      if (result.success) {
        const formattedUpdates = result.data.map(update => formatRecentUpdate(update));
        setUpdates(formattedUpdates);
      }
    } catch (err) {
      console.error('Error fetching recent updates:', err);
    }
  };

  // Refresh all activity data
  const refresh = useCallback(() => {
    fetchActivityData();
  }, [fetchActivityData]);

  // Load data on mount
  useEffect(() => {
    fetchActivityData();
  }, [fetchActivityData]);

  return {
    // Data
    learning,
    achievements,
    badges,
    updates,
    loading,
    error,
    
    // Refresh functions
    refresh,
    refreshLearning: () => fetchLearning(studentId),
    refreshAchievements: () => fetchAchievements(studentId, email),
    refreshUpdates: () => fetchRecentUpdates(email)
  };
};

// Helper function to get skill level text
const getSkillLevelText = (level: number): string => {
  if (level >= 5) return 'Expert';
  if (level >= 4) return 'Advanced';
  if (level >= 3) return 'Intermediate';
  if (level >= 2) return 'Beginner';
  return 'Novice';
};

// Badge generation logic
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
      earnedDate: new Date().toISOString()
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
      earnedDate: new Date().toISOString()
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
      earnedDate: new Date().toISOString()
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
      earnedDate: new Date().toISOString()
    });
  }

  return badges;
};
