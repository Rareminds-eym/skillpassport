import { useEffect, useState } from 'react';
import { apiGet } from '@/shared/api/apiClient';

export const useLearnerAchievements = (learnerId, email) => {
  const [achievements, setAchievements] = useState([]);
  const [badges, setBadges] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!learnerId && !email) {
      setLoading(false);
      return;
    }
    fetchAchievements();
  }, [learnerId, email]);

  const fetchAchievements = async () => {
    try {
      setLoading(true);
      setError(null);

      let actualLearnerId = learnerId;
      if (!actualLearnerId && email) {
        try {
          const response: any = await apiGet(`/learners/dashboard?learner_id=${encodeURIComponent(email)}`);
          actualLearnerId = response?.data?.profile?.id;
        } catch {
          throw new Error('Learner ID not found');
        }
        if (!actualLearnerId) throw new Error('Learner ID not found');
      }

      const params = actualLearnerId ? `?learner_id=${actualLearnerId}` : '';
      const response: any = await apiGet(`/learners/dashboard${params}`);
      const data = response?.data ?? response ?? {};

      const education = data.education || [];
      const trainings = data.training || [];
      const experience = data.experience || [];
      const techSkills = data.skills?.technical || [];
      const softSkills = data.skills?.soft || [];

      const allAchievements = [];

      education.forEach(edu => {
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

      trainings.forEach(training => {
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

      experience.forEach(exp => {
        allAchievements.push({
          id: `exp-${exp.id}`,
          type: 'experience',
          title: exp.role,
          subtitle: exp.organization,
          description: exp.description || 'Work experience',
          date: exp.end_date || exp.start_date || exp.created_at,
          duration: exp.duration,
          verified: exp.verified,
          isCurrent: exp.is_current,
          source: 'experience_table',
        });
      });

      techSkills.forEach(skill => {
        if (skill.level >= 4) {
          allAchievements.push({
            id: `skill-${skill.id}`,
            type: 'skill',
            title: `${skill.name} Proficiency`,
            subtitle: skill.category,
            description: `Achieved ${getSkillLevelText(skill.level)} level`,
            date: skill.updated_at || skill.created_at,
            level: skill.level,
            verified: skill.verified,
            source: 'skills_table',
          });
        }
      });

      allAchievements.sort((a, b) => new Date(b.date) - new Date(a.date));
      setAchievements(allAchievements);

      const generatedBadges = generateAIBadges({
        techSkills,
        softSkills,
        education,
        training: trainings,
        experience,
      });
      setBadges(generatedBadges);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const refresh = () => {
    fetchAchievements();
  };

  return { achievements, badges, loading, error, refresh };
};

const getSkillLevelText = (level) => {
  if (level >= 5) return 'Expert';
  if (level >= 4) return 'Advanced';
  if (level >= 3) return 'Intermediate';
  if (level >= 2) return 'Beginner';
  return 'Novice';
};

const generateAIBadges = ({ techSkills, softSkills, education, training, experience }) => {
  const badges = [];

  const expertSkills = techSkills.filter(s => s.level >= 5);
  const advancedSkills = techSkills.filter(s => s.level >= 4);

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

  if (expertSkills.length >= 1) {
    expertSkills.forEach((skill, idx) => {
      if (idx < 3) {
        badges.push({
          id: `badge-expert-${skill.id}`,
          name: `${skill.name} Expert`,
          description: `Achieved expert level in ${skill.name}`,
          icon: '⭐',
          color: 'purple',
          rarity: 'rare',
          earnedDate: skill.updated_at,
        });
      }
    });
  }

  const hasFrontend = techSkills.some(s =>
    ['React', 'Vue', 'Angular', 'JavaScript', 'HTML', 'CSS'].some(tech =>
      s.name.toLowerCase().includes(tech.toLowerCase())) && s.level >= 3
  );
  const hasBackend = techSkills.some(s =>
    ['Node', 'Python', 'Java', 'PHP', 'Ruby', 'Django', 'Flask', 'Express'].some(tech =>
      s.name.toLowerCase().includes(tech.toLowerCase())) && s.level >= 3
  );
  const hasDatabase = techSkills.some(s =>
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

  const bachelor = education.find(e => e.level?.toLowerCase().includes('bachelor'));
  const master = education.find(e => e.level?.toLowerCase().includes('master'));

  if (master) {
    badges.push({
      id: 'badge-masters',
      name: 'Master Scholar',
      description: "Completed Master's degree",
      icon: '🎓',
      color: 'indigo',
      rarity: 'rare',
      earnedDate: master.updated_at,
    });
  } else if (bachelor) {
    badges.push({
      id: 'badge-bachelor',
      name: 'Graduate',
      description: "Completed Bachelor's degree",
      icon: '📚',
      color: 'green',
      rarity: 'common',
      earnedDate: bachelor.updated_at,
    });
  }

  const completedTraining = training.filter(t => t.status === 'completed' || t.progress === 100);
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

  const communicationSkills = softSkills.filter(s =>
    ['communication', 'presentation', 'writing', 'speaking'].some(skill =>
      s.name.toLowerCase().includes(skill)) && s.level >= 4
  );
  if (communicationSkills.length >= 2) {
    badges.push({
      id: 'badge-communicator',
      name: 'Master Communicator',
      description: 'Excellent communication and presentation skills',
      icon: '🗣️',
      color: 'pink',
      rarity: 'rare',
      earnedDate: new Date().toISOString(),
    });
  }

  const leadershipSkills = softSkills.filter(s =>
    ['leadership', 'management', 'team'].some(skill =>
      s.name.toLowerCase().includes(skill)) && s.level >= 4
  );
  if (leadershipSkills.length >= 1) {
    badges.push({
      id: 'badge-leader',
      name: 'Natural Leader',
      description: 'Strong leadership and team management abilities',
      icon: '👑',
      color: 'yellow',
      rarity: 'epic',
      earnedDate: new Date().toISOString(),
    });
  }

  if (techSkills.length >= 10) {
    badges.push({
      id: 'badge-polymath',
      name: 'Tech Polymath',
      description: `Proficient in ${techSkills.length} technical skills`,
      icon: '🧠',
      color: 'cyan',
      rarity: 'legendary',
      earnedDate: new Date().toISOString(),
    });
  }

  return badges;
};
