import React, { useEffect, useRef, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { 
  X, CheckCircle, AlertCircle, Plus, Trash2, Save, 
  ChevronLeft, ChevronRight, Award, Briefcase, 
  Heart, Lightbulb, Languages as LanguagesIcon, User, GraduationCap
} from 'lucide-react';
import toast from 'react-hot-toast';
import { useTheme } from '@/shared/model/themeStore';
import { usePortfolio } from '@/features/digital-portfolio';
import { apiPost } from '@/shared/api/apiClient';
import { getLogger } from '@/shared/config/logging';

const logger = getLogger('ProfileCompletionModal2');

// Helper function to map skill level to number
const mapLevelToNumber = (level: string): number => {
  const levelMap: Record<string, number> = {
    'Beginner': 1,
    'Intermediate': 2,
    'Advanced': 3,
    'Expert': 4
  };
  return levelMap[level] || 2;
};

export interface ProfileCompletionModal2Props {
  isOpen: boolean;
  incompleteSections: string[];
  onComplete: () => void;
  onSkip: () => void;
  onNeverShow: () => void;
  onClose: () => void;
}

interface SectionConfig {
  id: string;
  name: string;
  icon: React.ComponentType<{ className?: string }>;
  description: string;
  example: string;
}

// Section configurations
const SECTION_CONFIGS: Record<string, SectionConfig> = {
  'Personal Details': {
    id: 'Personal Details',
    name: 'Personal Details',
    icon: User,
    description: 'Update your contact information and basic details',
    example: 'Keep your profile information current'
  },
  Education: {
    id: 'Education',
    name: 'Education',
    icon: GraduationCap,
    description: 'Add your educational background and qualifications',
    example: 'E.g., "B.Tech in Computer Science, XYZ University"'
  },
  Skills: {
    id: 'Skills',
    name: 'Skills',
    icon: Award,
    description: 'List your technical and soft skills',
    example: 'E.g., "JavaScript - Expert", "Communication - Advanced"'
  },
  Projects: {
    id: 'Projects',
    name: 'Projects',
    icon: Briefcase,
    description: 'Showcase your work to employers and demonstrate your skills',
    example: 'E.g., "Built a mobile app with 1000+ downloads"'
  },
  Achievements: {
    id: 'Achievements',
    name: 'Achievements',
    icon: Award,
    description: 'Highlight your accomplishments and recognition',
    example: 'E.g., "Won first place in coding competition"'
  },
  Hobbies: {
    id: 'Hobbies',
    name: 'Hobbies',
    icon: Heart,
    description: 'Share your interests and what you enjoy doing',
    example: 'E.g., Photography, Gaming, Reading'
  },
  Interests: {
    id: 'Interests',
    name: 'Interests',
    icon: Lightbulb,
    description: 'Show what topics and fields excite you',
    example: 'E.g., Artificial Intelligence, Web Development'
  },
  Languages: {
    id: 'Languages',
    name: 'Languages',
    icon: LanguagesIcon,
    description: 'List languages you speak and your proficiency level',
    example: 'E.g., English (Fluent), Spanish (Intermediate)'
  }
};

const ProfileCompletionModal2: React.FC<ProfileCompletionModal2Props> = ({
  isOpen,
  incompleteSections,
  onComplete,
  onSkip,
  onNeverShow,
  onClose,
}) => {
  const { theme } = useTheme();
  const { learner, setLearner } = usePortfolio();
  
  // State management
  const [currentStep, setCurrentStep] = useState(0);
  const [saving, setSaving] = useState(false);
  const [formData, setFormData] = useState({
    personalDetails: {
      name: '',
      email: '',
      university: '',
      fieldOfStudy: '',
      contact: '',
      location: '',
    },
    education: [] as Array<{ id: string; degree: string; institution: string; field: string; startDate: string; endDate: string; grade: string }>,
    skills: [] as Array<{ id: string; name: string; level: string; category: string }>,
    projects: [] as Array<{ id: string; title: string; description: string; technologies: string[] }>,
    achievements: [] as Array<{ id: string; title: string; description: string; date: string }>,
    hobbies: [] as string[],
    interests: [] as string[],
    languages: [] as string[],
  });

  // Refs for accessibility
  const modalRef = useRef<HTMLDivElement>(null);
  const previousActiveElementRef = useRef<HTMLElement | null>(null);

  // Filter sections to only show editable incomplete ones + always include Personal Details, Education, Skills
  const allEditableSections = ['Personal Details', 'Education', 'Skills', 'Projects', 'Achievements', 'Hobbies', 'Interests', 'Languages'];
  const editableSections = allEditableSections.filter(s => 
    incompleteSections.includes(s) || ['Personal Details', 'Education', 'Skills'].includes(s)
  );

  const currentSection = editableSections[currentStep] || '';
  const totalSteps = editableSections.length;
  const progress = totalSteps > 0 ? ((currentStep + 1) / totalSteps) * 100 : 0;

  // Initialize form data from learner profile
  useEffect(() => {
    if (learner?.profile) {
      setFormData({
        personalDetails: {
          name: learner.name || '',
          email: learner.email || '',
          university: learner.university || learner.college_school_name || '',
          fieldOfStudy: learner.branch_field || '',
          contact: learner.contact_number || '',
          location: learner.city && learner.state ? `${learner.city}, ${learner.state}` : learner.district_name || '',
        },
        education: learner.profile.education || [],
        skills: learner.profile.skills || [],
        projects: learner.profile.projects || [],
        achievements: learner.profile.achievements || [],
        hobbies: learner.profile.hobbies || [],
        interests: learner.profile.interests || [],
        languages: learner.profile.languages || [],
      });
    }
  }, [learner]);

  // Focus management
  useEffect(() => {
    if (isOpen) {
      previousActiveElementRef.current = document.activeElement as HTMLElement;
      document.body.style.overflow = 'hidden';
    }
    return () => {
      document.body.style.overflow = 'unset';
      if (previousActiveElementRef.current) {
        previousActiveElementRef.current.focus();
      }
    };
  }, [isOpen]);

  // Handle Escape key
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };
    if (isOpen) {
      document.addEventListener('keydown', handleEscape);
    }
    return () => document.removeEventListener('keydown', handleEscape);
  }, [isOpen, onClose]);

  // Navigation handlers
  const goToNextStep = () => {
    if (currentStep < totalSteps - 1) {
      setCurrentStep(currentStep + 1);
    }
  };

  const goToPreviousStep = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1);
    }
  };

  const jumpToSection = (index: number) => {
    setCurrentStep(index);
  };

  // Save handler
  const handleSaveAndContinue = async () => {
    setSaving(true);
    try {
      if (!learner?.id) {
        throw new Error('No learner ID available');
      }

      let hasUpdates = false;
      const currentSectionName = editableSections[currentStep];

      // Save current section data
      if (currentSectionName === 'Projects' && formData.projects.length > 0) {
        const validProjects = formData.projects.filter(p => 
          p.title && p.title.trim() !== '' && 
          p.description && p.description.trim() !== ''
        );
        
        // Check if user added projects but didn't fill them properly
        const incompleteProjects = formData.projects.filter(p => 
          !p.title || p.title.trim() === '' || !p.description || p.description.trim() === ''
        );
        
        if (incompleteProjects.length > 0) {
          toast.error('Please fill in both title and description for all projects, or remove the empty ones before continuing.');
          setSaving(false);
          return;
        }
        
        if (validProjects.length > 0) {
          const projectRecords = validProjects.map(p => ({
            learner_id: learner.id,
            title: p.title.trim(),
            description: p.description.trim(),
            tech_stack: p.technologies || [],
            approval_status: 'pending',
            approval_authority: learner.school_id ? 'school_admin' : 'college_admin'
          }));

          await apiPost('/college-admin/digital-portfolio', {
            action: 'insert-projects',
            records: projectRecords,
          });
          hasUpdates = true;
        }
      }

      // Save other sections to learners table
      const learnerUpdates: any = {};

      // Personal Details
      if (currentSectionName === 'Personal Details') {
        if (formData.personalDetails.university) {
          learnerUpdates.university = formData.personalDetails.university;
        }
        if (formData.personalDetails.fieldOfStudy) {
          learnerUpdates.branch_field = formData.personalDetails.fieldOfStudy;
        }
        if (formData.personalDetails.contact) {
          learnerUpdates.contact_number = formData.personalDetails.contact;
        }
        // Parse location if it has city, state format
        if (formData.personalDetails.location) {
          const locationParts = formData.personalDetails.location.split(',').map(s => s.trim());
          if (locationParts.length >= 2) {
            learnerUpdates.city = locationParts[0];
            learnerUpdates.state = locationParts[1];
          } else {
            learnerUpdates.district_name = formData.personalDetails.location;
          }
        }
      }

      // Education - Not editable yet (needs separate API endpoint)
      // Skills - Not editable yet (needs separate API endpoint)

      // Education - save to education table
      if (currentSectionName === 'Education' && formData.education.length > 0) {
        const validEducation = formData.education.filter(e => 
          e.degree && e.degree.trim() !== '' && 
          e.institution && e.institution.trim() !== ''
        );
        
        const incompleteEducation = formData.education.filter(e => 
          !e.degree || e.degree.trim() === '' || !e.institution || e.institution.trim() === ''
        );
        
        if (incompleteEducation.length > 0) {
          toast.error('Please fill in degree and institution for all education entries, or remove the empty ones.');
          setSaving(false);
          return;
        }
        
        if (validEducation.length > 0) {
          const educationRecords = validEducation.map(e => ({
            learner_id: learner.id,
            level: "Bachelor's", // Default level
            degree: e.degree,
            department: e.field || '',
            university: e.institution,
            year_of_passing: e.endDate || '',
            cgpa: e.grade || '',
            status: 'completed',
            approval_status: 'pending',
            enabled: true
          }));

          await apiPost('/college-admin/digital-portfolio', {
            action: 'insert-education',
            records: educationRecords,
          });
          hasUpdates = true;
        }
      }

      // Skills - save to skills table
      if (currentSectionName === 'Skills' && formData.skills.length > 0) {
        const validSkills = formData.skills.filter(s => 
          s.name && s.name.trim() !== ''
        );
        
        const incompleteSkills = formData.skills.filter(s => 
          !s.name || s.name.trim() === ''
        );
        
        if (incompleteSkills.length > 0) {
          toast.error('Please fill in skill name for all skill entries, or remove the empty ones.');
          setSaving(false);
          return;
        }
        
        if (validSkills.length > 0) {
          const skillRecords = validSkills.map(s => ({
            learner_id: learner.id,
            name: s.name,
            type: s.category === 'Technical' ? 'technical' : 'soft',
            level: mapLevelToNumber(s.level),
            description: s.category || 'General',
            verified: false,
            approval_status: 'pending',
            enabled: true
          }));

          await apiPost('/college-admin/digital-portfolio', {
            action: 'insert-skills',
            records: skillRecords,
          });
          hasUpdates = true;
        }
      }

      if (currentSectionName === 'Achievements' && formData.achievements.length > 0) {
        const validAchievements = formData.achievements.filter(a => 
          a.title && a.title.trim() !== '' && 
          a.description && a.description.trim() !== ''
        );
        
        // Check if user added achievements but didn't fill them properly
        const incompleteAchievements = formData.achievements.filter(a => 
          !a.title || a.title.trim() === '' || !a.description || a.description.trim() === ''
        );
        
        if (incompleteAchievements.length > 0) {
          toast.error('Please fill in both title and description for all achievements, or remove the empty ones before continuing.');
          setSaving(false);
          return;
        }
        
        if (validAchievements.length > 0) {
          const achievementRecords = validAchievements.map(a => ({
            learner_id: learner.id,
            title: a.title.trim(),
            description: a.description.trim(),
            date: a.date || new Date().toISOString().split('T')[0],
            category: 'General',
            approval_status: 'pending',
            enabled: true
          }));

          await apiPost('/college-admin/digital-portfolio', {
            action: 'insert-achievements',
            records: achievementRecords,
          });
          hasUpdates = true;
        }
      }

      if (currentSectionName === 'Hobbies' && formData.hobbies.length > 0) {
        const validHobbies = formData.hobbies.filter(h => h.trim() !== '');
        if (validHobbies.length > 0) {
          learnerUpdates.hobbies = validHobbies;
        }
      }

      if (currentSectionName === 'Interests' && formData.interests.length > 0) {
        const validInterests = formData.interests.filter(i => i.trim() !== '');
        if (validInterests.length > 0) {
          learnerUpdates.interests = validInterests;
        }
      }

      if (currentSectionName === 'Languages' && formData.languages.length > 0) {
        const validLanguages = formData.languages.filter(l => l.trim() !== '');
        if (validLanguages.length > 0) {
          learnerUpdates.languages = validLanguages;
        }
      }

      if (Object.keys(learnerUpdates).length > 0) {
        await apiPost('/college-admin/digital-portfolio', {
          action: 'update-learner',
          id: learner.id,
          ...learnerUpdates,
        });
        hasUpdates = true;
      }

      // Mark section as completed in localStorage (even if pending approval)
      if (hasUpdates) {
        try {
          const completedSections = JSON.parse(localStorage.getItem(`profile-sections-completed-${learner.id}`) || '[]');
          if (!completedSections.includes(currentSectionName)) {
            completedSections.push(currentSectionName);
            localStorage.setItem(`profile-sections-completed-${learner.id}`, JSON.stringify(completedSections));
          }
        } catch (error) {
          logger.error('Failed to mark section as completed', error);
        }
      }

      // Refresh portfolio data after save to update Digital Passport immediately
      if (hasUpdates) {
        try {
          const refreshResponse: any = await apiPost('/college-admin/digital-portfolio', {
            action: 'get-portfolio-by-email',
            email: learner.email,
          });

          if (refreshResponse?.success && refreshResponse?.data?.learner) {
            // Transform the response to match the expected format
            const portfolioData = {
              ...refreshResponse.data.learner,
              profile: {
                ...refreshResponse.data.learner.profile,
                education: [...(refreshResponse.data.education || []), ...(refreshResponse.data.pendingEducation || [])],
                skills: [...(refreshResponse.data.skills || []), ...(refreshResponse.data.pendingSkills || [])],
                projects: [...(refreshResponse.data.projects || []), ...(refreshResponse.data.pendingProjects || [])],
                achievements: [...(refreshResponse.data.achievements || []), ...(refreshResponse.data.pendingAchievements || [])],
                certifications: refreshResponse.data.certificates || [],
                experience: refreshResponse.data.experience || [],
                trainings: refreshResponse.data.trainings || [],
              }
            };
            setLearner(portfolioData as any);
          }
        } catch (refreshError) {
          logger.error('Failed to refresh portfolio data', refreshError);
          // Don't block the user flow if refresh fails
        }
      }

      // Move to next step or complete
      if (currentStep < totalSteps - 1) {
        // Show info about verification
        toast.success(
          `${currentSectionName} saved! Your information will be reviewed by an admin before appearing in your digital passport.`,
          { duration: 5000 }
        );
        goToNextStep();
      } else {
        // Show completion message with verification info
        toast.success(
          'Profile completed! Your information has been submitted and is pending admin verification.',
          { duration: 6000 }
        );
        onComplete();
      }
    } catch (error: any) {
      logger.error('Failed to save profile data', error);
      toast.error(`Failed to save: ${error.message || 'Unknown error'}`);
    } finally {
      setSaving(false);
    }
  };

  // Projects CRUD
  const addProject = () => {
    setFormData(prev => ({
      ...prev,
      projects: [...prev.projects, { id: Date.now().toString(), title: '', description: '', technologies: [] }]
    }));
  };

  const removeProject = (index: number) => {
    setFormData(prev => ({ ...prev, projects: prev.projects.filter((_, i) => i !== index) }));
  };

  const updateProject = (index: number, field: string, value: any) => {
    setFormData(prev => ({
      ...prev,
      projects: prev.projects.map((proj, i) =>
        i === index ? { ...proj, [field]: value } : proj
      )
    }));
  };

  const addTechnology = (projectIndex: number, tech: string) => {
    if (!tech.trim()) return;
    setFormData(prev => ({
      ...prev,
      projects: prev.projects.map((proj, i) =>
        i === projectIndex ? { ...proj, technologies: [...(proj.technologies || []), tech.trim()] } : proj
      )
    }));
  };

  const removeTechnology = (projectIndex: number, techIndex: number) => {
    setFormData(prev => ({
      ...prev,
      projects: prev.projects.map((proj, i) =>
        i === projectIndex ? { ...proj, technologies: proj.technologies.filter((_, ti) => ti !== techIndex) } : proj
      )
    }));
  };

  // Achievements CRUD
  const addAchievement = () => {
    setFormData(prev => ({
      ...prev,
      achievements: [...prev.achievements, { id: Date.now().toString(), title: '', description: '', date: '' }]
    }));
  };

  const removeAchievement = (index: number) => {
    setFormData(prev => ({ ...prev, achievements: prev.achievements.filter((_, i) => i !== index) }));
  };

  const updateAchievement = (index: number, field: string, value: string) => {
    setFormData(prev => ({
      ...prev,
      achievements: prev.achievements.map((ach, i) =>
        i === index ? { ...ach, [field]: value } : ach
      )
    }));
  };

  // Simple arrays CRUD
  const addHobby = () => setFormData(prev => ({ ...prev, hobbies: [...prev.hobbies, ''] }));
  const removeHobby = (index: number) => setFormData(prev => ({ ...prev, hobbies: prev.hobbies.filter((_, i) => i !== index) }));
  const updateHobby = (index: number, value: string) => {
    setFormData(prev => ({ ...prev, hobbies: prev.hobbies.map((h, i) => i === index ? value : h) }));
  };

  const addInterest = () => setFormData(prev => ({ ...prev, interests: [...prev.interests, ''] }));
  const removeInterest = (index: number) => setFormData(prev => ({ ...prev, interests: prev.interests.filter((_, i) => i !== index) }));
  const updateInterest = (index: number, value: string) => {
    setFormData(prev => ({ ...prev, interests: prev.interests.map((int, i) => i === index ? value : int) }));
  };

  const addLanguage = () => setFormData(prev => ({ ...prev, languages: [...prev.languages, ''] }));
  const removeLanguage = (index: number) => setFormData(prev => ({ ...prev, languages: prev.languages.filter((_, i) => i !== index) }));
  const updateLanguage = (index: number, value: string) => {
    setFormData(prev => ({ ...prev, languages: prev.languages.map((lang, i) => i === index ? value : lang) }));
  };

  // Education CRUD
  const addEducation = () => {
    setFormData(prev => ({
      ...prev,
      education: [...prev.education, { id: Date.now().toString(), degree: '', institution: '', field: '', startDate: '', endDate: '', grade: '' }]
    }));
  };

  const removeEducation = (index: number) => {
    setFormData(prev => ({ ...prev, education: prev.education.filter((_, i) => i !== index) }));
  };

  const updateEducation = (index: number, field: string, value: string) => {
    setFormData(prev => ({
      ...prev,
      education: prev.education.map((edu, i) =>
        i === index ? { ...edu, [field]: value } : edu
      )
    }));
  };

  // Skills CRUD
  const addSkill = () => {
    setFormData(prev => ({
      ...prev,
      skills: [...prev.skills, { id: Date.now().toString(), name: '', level: 'Beginner', category: 'Technical' }]
    }));
  };

  const removeSkill = (index: number) => {
    setFormData(prev => ({ ...prev, skills: prev.skills.filter((_, i) => i !== index) }));
  };

  const updateSkill = (index: number, field: string, value: string) => {
    setFormData(prev => ({
      ...prev,
      skills: prev.skills.map((skill, i) =>
        i === index ? { ...skill, [field]: value } : skill
      )
    }));
  };

  // Personal Details update
  const updatePersonalDetail = (field: string, value: string) => {
    setFormData(prev => ({
      ...prev,
      personalDetails: { ...prev.personalDetails, [field]: value }
    }));
  };

  // Render section content
  const renderSectionContent = () => {
    const sectionConfig = SECTION_CONFIGS[currentSection];
    if (!sectionConfig) return null;

    const Icon = sectionConfig.icon;

    switch (currentSection) {
      case 'Personal Details':
        return (
          <div className="space-y-4">
            <div className="flex items-start gap-3 mb-4">
              <div className="p-2 bg-indigo-50 dark:bg-indigo-900/20 rounded-lg">
                <Icon className="w-6 h-6 text-indigo-600 dark:text-indigo-400" />
              </div>
              <div>
                <p className="text-sm text-gray-600 dark:text-gray-400">{sectionConfig.description}</p>
                <p className="text-xs text-gray-500 mt-1">{sectionConfig.example}</p>
              </div>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Name *</label>
                <input
                  type="text"
                  value={formData.personalDetails.name}
                  disabled
                  className="w-full px-3 py-2 bg-gray-100 dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded text-sm text-gray-500 dark:text-gray-400 cursor-not-allowed"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Email *</label>
                <input
                  type="email"
                  value={formData.personalDetails.email}
                  disabled
                  className="w-full px-3 py-2 bg-gray-100 dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded text-sm text-gray-500 dark:text-gray-400 cursor-not-allowed"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">University/College</label>
                <input
                  type="text"
                  placeholder="Enter your university or college name"
                  value={formData.personalDetails.university}
                  onChange={(e) => updatePersonalDetail('university', e.target.value)}
                  className="w-full px-3 py-2 bg-white dark:bg-gray-600 border border-gray-300 dark:border-gray-500 rounded text-sm text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Field of Study</label>
                <input
                  type="text"
                  placeholder="E.g., Computer Science, Business Administration"
                  value={formData.personalDetails.fieldOfStudy}
                  onChange={(e) => updatePersonalDetail('fieldOfStudy', e.target.value)}
                  className="w-full px-3 py-2 bg-white dark:bg-gray-600 border border-gray-300 dark:border-gray-500 rounded text-sm text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Contact Number</label>
                <input
                  type="tel"
                  placeholder="Enter your contact number"
                  value={formData.personalDetails.contact}
                  onChange={(e) => updatePersonalDetail('contact', e.target.value)}
                  className="w-full px-3 py-2 bg-white dark:bg-gray-600 border border-gray-300 dark:border-gray-500 rounded text-sm text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Location</label>
                <input
                  type="text"
                  placeholder="City, State"
                  value={formData.personalDetails.location}
                  onChange={(e) => updatePersonalDetail('location', e.target.value)}
                  className="w-full px-3 py-2 bg-white dark:bg-gray-600 border border-gray-300 dark:border-gray-500 rounded text-sm text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>
          </div>
        );

      case 'Education':
        return (
          <div className="space-y-4">
            <div className="flex items-start gap-3 mb-4">
              <div className="p-2 bg-green-50 dark:bg-green-900/20 rounded-lg">
                <Icon className="w-6 h-6 text-green-600 dark:text-green-400" />
              </div>
              <div>
                <p className="text-sm text-gray-600 dark:text-gray-400">{sectionConfig.description}</p>
                <p className="text-xs text-gray-500 mt-1">{sectionConfig.example}</p>
              </div>
            </div>

            {formData.education.map((edu, index) => (
              <div key={edu.id} className="p-4 bg-gray-50 dark:bg-gray-700 rounded-lg space-y-3">
                <div className="flex items-start justify-between gap-2">
                  <input
                    type="text"
                    placeholder="Degree *"
                    value={edu.degree}
                    onChange={(e) => updateEducation(index, 'degree', e.target.value)}
                    className="flex-1 px-3 py-2 bg-white dark:bg-gray-600 border border-gray-300 dark:border-gray-500 rounded text-sm text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-blue-500"
                  />
                  <button
                    onClick={() => removeEducation(index)}
                    className="p-2 text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 rounded"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
                <input
                  type="text"
                  placeholder="Institution/University *"
                  value={edu.institution}
                  onChange={(e) => updateEducation(index, 'institution', e.target.value)}
                  className="w-full px-3 py-2 bg-white dark:bg-gray-600 border border-gray-300 dark:border-gray-500 rounded text-sm text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-blue-500"
                />
                <input
                  type="text"
                  placeholder="Field of Study"
                  value={edu.field}
                  onChange={(e) => updateEducation(index, 'field', e.target.value)}
                  className="w-full px-3 py-2 bg-white dark:bg-gray-600 border border-gray-300 dark:border-gray-500 rounded text-sm text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-blue-500"
                />
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="text-xs text-gray-600 dark:text-gray-400 mb-1 block">Start Year</label>
                    <input
                      type="text"
                      placeholder="YYYY"
                      value={edu.startDate}
                      onChange={(e) => updateEducation(index, 'startDate', e.target.value)}
                      className="w-full px-3 py-2 bg-white dark:bg-gray-600 border border-gray-300 dark:border-gray-500 rounded text-sm text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                  <div>
                    <label className="text-xs text-gray-600 dark:text-gray-400 mb-1 block">End Year</label>
                    <input
                      type="text"
                      placeholder="YYYY or Present"
                      value={edu.endDate}
                      onChange={(e) => updateEducation(index, 'endDate', e.target.value)}
                      className="w-full px-3 py-2 bg-white dark:bg-gray-600 border border-gray-300 dark:border-gray-500 rounded text-sm text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                </div>
                <input
                  type="text"
                  placeholder="Grade/CGPA (optional)"
                  value={edu.grade}
                  onChange={(e) => updateEducation(index, 'grade', e.target.value)}
                  className="w-full px-3 py-2 bg-white dark:bg-gray-600 border border-gray-300 dark:border-gray-500 rounded text-sm text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-blue-500"
                />
              </div>
            ))}

            <button
              onClick={addEducation}
              className="w-full flex items-center justify-center gap-2 px-4 py-3 border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-lg text-gray-600 dark:text-gray-400 hover:border-green-500 hover:text-green-600 transition-colors"
            >
              <Plus className="w-4 h-4" />
              Add Education
            </button>
          </div>
        );

      case 'Skills':
        return (
          <div className="space-y-4">
            <div className="flex items-start gap-3 mb-4">
              <div className="p-2 bg-purple-50 dark:bg-purple-900/20 rounded-lg">
                <Icon className="w-6 h-6 text-purple-600 dark:text-purple-400" />
              </div>
              <div>
                <p className="text-sm text-gray-600 dark:text-gray-400">{sectionConfig.description}</p>
                <p className="text-xs text-gray-500 mt-1">{sectionConfig.example}</p>
              </div>
            </div>

            {formData.skills.map((skill, index) => (
              <div key={skill.id} className="p-4 bg-gray-50 dark:bg-gray-700 rounded-lg space-y-3">
                <div className="flex items-start justify-between gap-2">
                  <input
                    type="text"
                    placeholder="Skill Name *"
                    value={skill.name}
                    onChange={(e) => updateSkill(index, 'name', e.target.value)}
                    className="flex-1 px-3 py-2 bg-white dark:bg-gray-600 border border-gray-300 dark:border-gray-500 rounded text-sm text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-blue-500"
                  />
                  <button
                    onClick={() => removeSkill(index)}
                    className="p-2 text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 rounded"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="text-xs text-gray-600 dark:text-gray-400 mb-1 block">Level</label>
                    <select
                      value={skill.level}
                      onChange={(e) => updateSkill(index, 'level', e.target.value)}
                      className="w-full px-3 py-2 bg-white dark:bg-gray-600 border border-gray-300 dark:border-gray-500 rounded text-sm text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-blue-500"
                    >
                      <option value="Beginner">Beginner</option>
                      <option value="Intermediate">Intermediate</option>
                      <option value="Advanced">Advanced</option>
                      <option value="Expert">Expert</option>
                    </select>
                  </div>
                  <div>
                    <label className="text-xs text-gray-600 dark:text-gray-400 mb-1 block">Category</label>
                    <select
                      value={skill.category}
                      onChange={(e) => updateSkill(index, 'category', e.target.value)}
                      className="w-full px-3 py-2 bg-white dark:bg-gray-600 border border-gray-300 dark:border-gray-500 rounded text-sm text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-blue-500"
                    >
                      <option value="Technical">Technical</option>
                      <option value="Soft Skills">Soft Skills</option>
                      <option value="Language">Language</option>
                      <option value="Other">Other</option>
                    </select>
                  </div>
                </div>
              </div>
            ))}

            <button
              onClick={addSkill}
              className="w-full flex items-center justify-center gap-2 px-4 py-3 border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-lg text-gray-600 dark:text-gray-400 hover:border-purple-500 hover:text-purple-600 transition-colors"
            >
              <Plus className="w-4 h-4" />
              Add Skill
            </button>
          </div>
        );

      case 'Projects':
        return (
          <div className="space-y-4">
            <div className="flex items-start gap-3 mb-4">
              <div className="p-2 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
                <Icon className="w-6 h-6 text-blue-600 dark:text-blue-400" />
              </div>
              <div>
                <p className="text-sm text-gray-600 dark:text-gray-400">{sectionConfig.description}</p>
                <p className="text-xs text-gray-500 mt-1">{sectionConfig.example}</p>
              </div>
            </div>

            {formData.projects.map((project, index) => (
              <div key={project.id} className="p-4 bg-gray-50 dark:bg-gray-700 rounded-lg space-y-3">
                <div className="flex items-start justify-between gap-2">
                  <input
                    type="text"
                    placeholder="Project Title *"
                    value={project.title}
                    onChange={(e) => updateProject(index, 'title', e.target.value)}
                    className="flex-1 px-3 py-2 bg-white dark:bg-gray-600 border border-gray-300 dark:border-gray-500 rounded text-sm text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-blue-500"
                  />
                  <button
                    onClick={() => removeProject(index)}
                    className="p-2 text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 rounded"
                    aria-label="Remove project"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
                <textarea
                  placeholder="Describe your project..."
                  value={project.description}
                  onChange={(e) => updateProject(index, 'description', e.target.value)}
                  className="w-full px-3 py-2 bg-white dark:bg-gray-600 border border-gray-300 dark:border-gray-500 rounded text-sm text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-blue-500"
                  rows={3}
                />
                
                <div>
                  <label className="text-xs text-gray-600 dark:text-gray-400 mb-1 block">Technologies</label>
                  <div className="flex flex-wrap gap-2 mb-2">
                    {project.technologies.map((tech, techIndex) => (
                      <span
                        key={techIndex}
                        className="inline-flex items-center gap-1 px-2 py-1 bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 rounded text-xs"
                      >
                        {tech}
                        <button onClick={() => removeTechnology(index, techIndex)}>
                          <X className="w-3 h-3" />
                        </button>
                      </span>
                    ))}
                  </div>
                  <input
                    type="text"
                    placeholder="Add technology (press Enter)"
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        e.preventDefault();
                        addTechnology(index, e.currentTarget.value);
                        e.currentTarget.value = '';
                      }
                    }}
                    className="w-full px-3 py-1.5 bg-white dark:bg-gray-600 border border-gray-300 dark:border-gray-500 rounded text-xs text-gray-900 dark:text-gray-100"
                  />
                </div>
              </div>
            ))}

            <button
              onClick={addProject}
              className="w-full flex items-center justify-center gap-2 px-4 py-3 border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-lg text-gray-600 dark:text-gray-400 hover:border-blue-500 hover:text-blue-600 transition-colors"
            >
              <Plus className="w-4 h-4" />
              Add Project
            </button>
          </div>
        );

      case 'Achievements':
        return (
          <div className="space-y-4">
            <div className="flex items-start gap-3 mb-4">
              <div className="p-2 bg-yellow-50 dark:bg-yellow-900/20 rounded-lg">
                <Icon className="w-6 h-6 text-yellow-600 dark:text-yellow-400" />
              </div>
              <div>
                <p className="text-sm text-gray-600 dark:text-gray-400">{sectionConfig.description}</p>
                <p className="text-xs text-gray-500 mt-1">{sectionConfig.example}</p>
              </div>
            </div>

            {formData.achievements.map((achievement, index) => (
              <div key={achievement.id} className="p-4 bg-gray-50 dark:bg-gray-700 rounded-lg space-y-3">
                <div className="flex items-start justify-between gap-2">
                  <input
                    type="text"
                    placeholder="Achievement Title *"
                    value={achievement.title}
                    onChange={(e) => updateAchievement(index, 'title', e.target.value)}
                    className="flex-1 px-3 py-2 bg-white dark:bg-gray-600 border border-gray-300 dark:border-gray-500 rounded text-sm text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-blue-500"
                  />
                  <button
                    onClick={() => removeAchievement(index)}
                    className="p-2 text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 rounded"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
                <textarea
                  placeholder="Describe your achievement..."
                  value={achievement.description}
                  onChange={(e) => updateAchievement(index, 'description', e.target.value)}
                  className="w-full px-3 py-2 bg-white dark:bg-gray-600 border border-gray-300 dark:border-gray-500 rounded text-sm text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-blue-500"
                  rows={2}
                />
                <input
                  type="date"
                  value={achievement.date}
                  onChange={(e) => updateAchievement(index, 'date', e.target.value)}
                  className="w-full px-3 py-2 bg-white dark:bg-gray-600 border border-gray-300 dark:border-gray-500 rounded text-sm text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-blue-500"
                />
              </div>
            ))}

            <button
              onClick={addAchievement}
              className="w-full flex items-center justify-center gap-2 px-4 py-3 border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-lg text-gray-600 dark:text-gray-400 hover:border-yellow-500 hover:text-yellow-600 transition-colors"
            >
              <Plus className="w-4 h-4" />
              Add Achievement
            </button>
          </div>
        );

      case 'Hobbies':
      case 'Interests':
      case 'Languages': {
        const dataKey = currentSection.toLowerCase() as 'hobbies' | 'interests' | 'languages';
        const addFn = currentSection === 'Hobbies' ? addHobby : currentSection === 'Interests' ? addInterest : addLanguage;
        const removeFn = currentSection === 'Hobbies' ? removeHobby : currentSection === 'Interests' ? removeInterest : removeLanguage;
        const updateFn = currentSection === 'Hobbies' ? updateHobby : currentSection === 'Interests' ? updateInterest : updateLanguage;

        return (
          <div className="space-y-4">
            <div className="flex items-start gap-3 mb-4">
              <div className="p-2 bg-purple-50 dark:bg-purple-900/20 rounded-lg">
                <Icon className="w-6 h-6 text-purple-600 dark:text-purple-400" />
              </div>
              <div>
                <p className="text-sm text-gray-600 dark:text-gray-400">{sectionConfig.description}</p>
                <p className="text-xs text-gray-500 mt-1">{sectionConfig.example}</p>
              </div>
            </div>

            <div className="space-y-2">
              {formData[dataKey].map((item, index) => (
                <div key={index} className="flex items-center gap-2">
                  <input
                    type="text"
                    placeholder={`Enter ${currentSection.slice(0, -1).toLowerCase()}...`}
                    value={item}
                    onChange={(e) => updateFn(index, e.target.value)}
                    className="flex-1 px-3 py-2 bg-white dark:bg-gray-600 border border-gray-300 dark:border-gray-500 rounded text-sm text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-blue-500"
                  />
                  <button
                    onClick={() => removeFn(index)}
                    className="p-2 text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 rounded"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              ))}
            </div>

            <button
              onClick={addFn}
              className="w-full flex items-center justify-center gap-2 px-4 py-3 border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-lg text-gray-600 dark:text-gray-400 hover:border-blue-500 hover:text-blue-600 transition-colors"
            >
              <Plus className="w-4 h-4" />
              Add {currentSection.slice(0, -1)}
            </button>
          </div>
        );
      }

      default:
        return null;
    }
  };

  if (editableSections.length === 0 || !isOpen) return null;

  return (
    <AnimatePresence>
      <motion.div
        className={`fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4 ${theme === 'dark' ? 'dark' : ''}`}
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        onClick={onClose}
        role="dialog"
        aria-modal="true"
        aria-labelledby="modal-title"
      >
        <motion.div
          ref={modalRef}
          className="bg-white dark:bg-gray-800 rounded-xl w-full max-w-3xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]"
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.95 }}
          transition={{ duration: 0.2 }}
          onClick={(e) => e.stopPropagation()}
        >
          {/* Header */}
          <div className="flex items-start justify-between p-6 border-b border-gray-200 dark:border-gray-700">
            <div className="flex items-start gap-3">
              <div className="flex-shrink-0 mt-1">
                <AlertCircle className="h-6 w-6 text-blue-600 dark:text-blue-400" />
              </div>
              <div>
                <h2 id="modal-title" className="text-xl font-bold text-gray-900 dark:text-gray-100">
                  Complete Your Profile
                </h2>
                <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                  Step {currentStep + 1} of {totalSteps} • {Math.round(progress)}% Complete
                </p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
              aria-label="Close modal"
            >
              <X className="h-5 w-5 text-gray-500 dark:text-gray-400" />
            </button>
          </div>

          {/* Progress Bar */}
          <div className="px-6 pt-4">
            <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2 overflow-hidden">
              <motion.div
                className="h-full bg-gradient-to-r from-blue-500 to-purple-600 rounded-full"
                initial={{ width: 0 }}
                animate={{ width: `${progress}%` }}
                transition={{ duration: 0.3 }}
              />
            </div>
          </div>

          {/* Verification Info Banner */}
          {['Education', 'Skills', 'Projects', 'Achievements'].includes(currentSection) && (
            <div className="px-6 pt-3">
              <div className="bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-lg p-3 flex items-start gap-3">
                <AlertCircle className="w-5 h-5 text-amber-600 dark:text-amber-400 flex-shrink-0 mt-0.5" />
                <div className="flex-1">
                  <p className="text-sm font-medium text-amber-900 dark:text-amber-100">
                    Verification Required
                  </p>
                  <p className="text-xs text-amber-700 dark:text-amber-300 mt-1">
                    Your {currentSection.toLowerCase()} will be reviewed by an admin before appearing in your digital passport.
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* Section Navigation Tabs */}
          <div className="px-6 pt-4">
            <div className="flex gap-2 overflow-x-auto pb-2">
              {editableSections.map((section, index) => {
                const config = SECTION_CONFIGS[section];
                const Icon = config?.icon;
                const isActive = index === currentStep;
                const isPast = index < currentStep;

                return (
                  <button
                    key={section}
                    onClick={() => jumpToSection(index)}
                    className={`flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium whitespace-nowrap transition-colors ${
                      isActive
                        ? 'bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300'
                        : isPast
                        ? 'bg-green-50 dark:bg-green-900/20 text-green-700 dark:text-green-400'
                        : 'bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-600'
                    }`}
                  >
                    {Icon && <Icon className="w-4 h-4" />}
                    <span>{section}</span>
                    {isPast && <CheckCircle className="w-4 h-4" />}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Content */}
          <div className="flex-1 overflow-y-auto px-6 py-6">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4">
              {currentSection}
            </h3>
            {renderSectionContent()}
          </div>

          {/* Footer */}
          <div className="border-t border-gray-200 dark:border-gray-700 p-6 bg-gray-50 dark:bg-gray-900">
            <div className="flex items-center justify-between gap-4">
              <button
                onClick={goToPreviousStep}
                disabled={currentStep === 0}
                className="flex items-center gap-2 px-4 py-2 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <ChevronLeft className="w-4 h-4" />
                Previous
              </button>

              <button
                onClick={goToNextStep}
                className="px-4 py-2 text-gray-600 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200 text-sm transition-colors"
              >
                Skip Section
              </button>

              <button
                onClick={handleSaveAndContinue}
                disabled={saving}
                className="flex items-center gap-2 px-6 py-2 bg-blue-600 hover:bg-blue-700 dark:bg-blue-500 dark:hover:bg-blue-600 text-white font-medium rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {saving ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent"></div>
                    Saving...
                  </>
                ) : currentStep === totalSteps - 1 ? (
                  <>
                    <Save className="w-4 h-4" />
                    Save & Complete
                  </>
                ) : (
                  <>
                    Save & Continue
                    <ChevronRight className="w-4 h-4" />
                  </>
                )}
              </button>
            </div>

            <div className="flex items-center justify-center gap-4 mt-4 pt-4 border-t border-gray-200 dark:border-gray-700">
              <button
                onClick={onSkip}
                className="text-sm text-gray-600 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200 transition-colors"
              >
                Remind me later
              </button>
              <span className="text-gray-300 dark:text-gray-600">•</span>
              <button
                onClick={onNeverShow}
                className="text-sm text-gray-600 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200 transition-colors"
              >
                Don't show again
              </button>
            </div>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
};

ProfileCompletionModal2.displayName = 'ProfileCompletionModal2';

export default ProfileCompletionModal2;
