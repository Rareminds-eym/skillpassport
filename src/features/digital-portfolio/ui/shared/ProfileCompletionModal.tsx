import React, { useEffect, useRef, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { X, CheckCircle, AlertCircle, Plus, Trash2, Save } from 'lucide-react';
import { useTheme } from '@/shared/model/themeStore';
import { usePortfolio } from '@/features/digital-portfolio';
import { supabase } from '@/shared/api/supabaseClient';

export interface ProfileCompletionModalProps {
  isOpen: boolean;
  incompleteSections: string[];
  onComplete: () => void;
  onSkip: () => void;
  onNeverShow: () => void;
  onClose: () => void;
}

const ProfileCompletionModal: React.FC<ProfileCompletionModalProps> = React.memo(({
  isOpen,
  incompleteSections,
  onComplete,
  onSkip,
  onNeverShow,
  onClose,
}) => {
  const { theme } = useTheme();
  const { student, setStudent } = usePortfolio();
  const isDevelopment = import.meta.env.DEV || import.meta.env.MODE === 'development';
  
  // Refs for focus management
  const modalRef = useRef<HTMLDivElement>(null);
  const firstButtonRef = useRef<HTMLButtonElement>(null);
  const lastButtonRef = useRef<HTMLButtonElement>(null);
  const previousActiveElementRef = useRef<HTMLElement | null>(null);

  // State for inline editing
  const [editMode, setEditMode] = useState(false);
  const [saving, setSaving] = useState(false);
  const [formData, setFormData] = useState({
    projects: [] as Array<{ id: string; title: string; description: string; technologies?: string[] }>,
    achievements: [] as Array<{ id: string; title: string; description: string; date: string }>,
    hobbies: [] as string[],
    interests: [] as string[],
    languages: [] as Array<string | { name: string; proficiency: string }>,
  });

  // Initialize form data from student profile
  useEffect(() => {
    if (student?.profile) {
      setFormData({
        projects: student.profile.projects || [],
        achievements: student.profile.achievements || [],
        hobbies: student.profile.hobbies || [],
        interests: student.profile.interests || [],
        languages: student.profile.languages || [],
      });
    }
  }, [student]);

  // Memoize animation variants to prevent recreation on every render
  const modalVariants = React.useMemo(() => ({
    hidden: { opacity: 0, scale: 0.95 },
    visible: { opacity: 1, scale: 1 },
    exit: { opacity: 0, scale: 0.95 },
  }), []);

  const backdropVariants = React.useMemo(() => ({
    hidden: { opacity: 0 },
    visible: { opacity: 1 },
    exit: { opacity: 0 },
  }), []);

  // Memoize validation result to avoid repeated checks
  const isValidProps = React.useMemo(() => {
    const isValid = Array.isArray(incompleteSections);
    if (!isValid && isDevelopment) {
      console.error('[ProfileCompletionModal] Invalid incompleteSections prop:', incompleteSections);
    }
    return isValid;
  }, [incompleteSections, isDevelopment]);

  // Early return for invalid props to prevent unnecessary rendering
  if (!isValidProps) {
    return null;
  }

  // Log theme changes in development mode
  useEffect(() => {
    if (isDevelopment && isOpen) {
      console.log('[ProfileCompletionModal] Current theme:', theme);
    }
  }, [theme, isOpen, isDevelopment]);

  // Focus management and accessibility
  useEffect(() => {
    if (isOpen) {
      // Store the currently focused element
      previousActiveElementRef.current = document.activeElement as HTMLElement;
      
      // Set focus to the first button when modal opens
      setTimeout(() => {
        if (firstButtonRef.current) {
          firstButtonRef.current.focus();
        }
      }, 100); // Small delay to ensure modal is rendered
      
      if (isDevelopment) {
        console.log('[ProfileCompletionModal] Modal opened, focus set to first button');
      }
    } else {
      // Return focus to the previously focused element when modal closes
      if (previousActiveElementRef.current) {
        previousActiveElementRef.current.focus();
        if (isDevelopment) {
          console.log('[ProfileCompletionModal] Modal closed, focus returned to previous element');
        }
      }
    }
  }, [isOpen, isDevelopment]);

  // Focus trap implementation
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (!isOpen) return;

    if (e.key === 'Tab') {
      const focusableElements = modalRef.current?.querySelectorAll(
        'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
      );
      
      if (!focusableElements || focusableElements.length === 0) return;
      
      const firstElement = focusableElements[0] as HTMLElement;
      const lastElement = focusableElements[focusableElements.length - 1] as HTMLElement;
      
      if (e.shiftKey) {
        // Shift + Tab: moving backwards
        if (document.activeElement === firstElement) {
          e.preventDefault();
          lastElement.focus();
        }
      } else {
        // Tab: moving forwards
        if (document.activeElement === lastElement) {
          e.preventDefault();
          firstElement.focus();
        }
      }
    }
  };

  // Handle Escape key press
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        try {
          onClose();
        } catch (error) {
          if (isDevelopment) {
            console.error('[ProfileCompletionModal] Error in onClose handler:', error);
          }
        }
      }
    };

    if (isOpen) {
      document.addEventListener('keydown', handleEscape);
      // Prevent body scroll when modal is open
      document.body.style.overflow = 'hidden';
    }

    return () => {
      document.removeEventListener('keydown', handleEscape);
      document.body.style.overflow = 'unset';
    };
  }, [isOpen, onClose, isDevelopment]);

  // Handle backdrop click with error handling
  const handleBackdropClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (e.target === e.currentTarget) {
      try {
        onClose();
      } catch (error) {
        if (isDevelopment) {
          console.error('[ProfileCompletionModal] Error in backdrop click handler:', error);
        }
      }
    }
  };

  // Handle save profile data
  const handleSaveProfile = async () => {
    setSaving(true);
    try {
      if (!student?.id) {
        throw new Error('No student ID available');
      }

      let hasUpdates = false;
      
      // Projects - save to projects table
      if (incompleteSections.includes('Projects') && formData.projects.length > 0) {
        const validProjects = formData.projects.filter(p => p.title.trim() !== '');
        if (validProjects.length > 0) {
          const projectRecords = validProjects.map(p => ({
            student_id: student.id,
            title: p.title,
            description: p.description,
            tech_stack: p.technologies || [],
            approval_status: 'pending',
            approval_authority: student.school_id ? 'school_admin' : 'college_admin'
          }));
          
          const { error } = await supabase.from('projects').insert(projectRecords);
          if (error) throw error;
          hasUpdates = true;
        }
      }
      
      // Hobbies, Interests, Languages, Achievements - save to students table
      const studentUpdates: any = {};
      
      if (incompleteSections.includes('Achievements') && formData.achievements.length > 0) {
        const validAchievements = formData.achievements.filter(a => a.title.trim() !== '');
        if (validAchievements.length > 0) {
          studentUpdates.achievements = validAchievements;
        }
      }
      
      if (incompleteSections.includes('Hobbies') && formData.hobbies.length > 0) {
        const validHobbies = formData.hobbies.filter(h => h.trim() !== '');
        if (validHobbies.length > 0) {
          studentUpdates.hobbies = validHobbies;
        }
      }
      
      if (incompleteSections.includes('Interests') && formData.interests.length > 0) {
        const validInterests = formData.interests.filter(i => i.trim() !== '');
        if (validInterests.length > 0) {
          studentUpdates.interests = validInterests;
        }
      }
      
      if (incompleteSections.includes('Languages') && formData.languages.length > 0) {
        const validLanguages = formData.languages.filter(l => 
          typeof l === 'string' ? l.trim() !== '' : l.name.trim() !== ''
        );
        if (validLanguages.length > 0) {
          studentUpdates.languages = validLanguages;
        }
      }

      if (Object.keys(studentUpdates).length > 0) {
        const { error } = await supabase
          .from('students')
          .update(studentUpdates)
          .eq('id', student.id);
        
        if (error) throw error;
        hasUpdates = true;
      }

      if (!hasUpdates) {
        alert('Please add at least one item to save.');
        setSaving(false);
        return;
      }

      if (isDevelopment) {
        console.log('[ProfileCompletionModal] Save successful');
      }

      // Refresh student data
      const { data: updatedStudent } = await supabase
        .from('students')
        .select('*')
        .eq('id', student.id)
        .single();
      
      if (updatedStudent) {
        setStudent(updatedStudent as any);
      }
      
      setEditMode(false);
      onComplete();
    } catch (error: any) {
      if (isDevelopment) {
        console.error('[ProfileCompletionModal] Error saving profile:', error);
      }
      alert(`Failed to save: ${error.message || 'Unknown error'}`);
    } finally {
      setSaving(false);
    }
  };

  // Handle button clicks with error handling
  const handleComplete = () => {
    try {
      if (editMode) {
        handleSaveProfile();
      } else {
        // Check if there are editable sections
        const editableSections = incompleteSections.filter(s => 
          ['Projects', 'Achievements', 'Hobbies', 'Interests', 'Languages'].includes(s)
        );
        
        if (editableSections.length > 0) {
          setEditMode(true);
        } else {
          onComplete();
        }
      }
    } catch (error) {
      if (isDevelopment) {
        console.error('[ProfileCompletionModal] Error in onComplete handler:', error);
      }
    }
  };

  const handleSkip = () => {
    try {
      setEditMode(false);
      onSkip();
    } catch (error) {
      if (isDevelopment) {
        console.error('[ProfileCompletionModal] Error in onSkip handler:', error);
      }
    }
  };

  const handleNeverShow = () => {
    try {
      setEditMode(false);
      onNeverShow();
    } catch (error) {
      if (isDevelopment) {
        console.error('[ProfileCompletionModal] Error in onNeverShow handler:', error);
      }
    }
  };

  // Add/remove array items
  const addHobby = () => {
    setFormData(prev => ({ ...prev, hobbies: [...prev.hobbies, ''] }));
  };

  const removeHobby = (index: number) => {
    setFormData(prev => ({ ...prev, hobbies: prev.hobbies.filter((_, i) => i !== index) }));
  };

  const updateHobby = (index: number, value: string) => {
    setFormData(prev => ({
      ...prev,
      hobbies: prev.hobbies.map((h, i) => i === index ? value : h)
    }));
  };

  const addInterest = () => {
    setFormData(prev => ({ ...prev, interests: [...prev.interests, ''] }));
  };

  const removeInterest = (index: number) => {
    setFormData(prev => ({ ...prev, interests: prev.interests.filter((_, i) => i !== index) }));
  };

  const updateInterest = (index: number, value: string) => {
    setFormData(prev => ({
      ...prev,
      interests: prev.interests.map((int, i) => i === index ? value : int)
    }));
  };

  const addLanguage = () => {
    setFormData(prev => ({ ...prev, languages: [...prev.languages, ''] }));
  };

  const removeLanguage = (index: number) => {
    setFormData(prev => ({ ...prev, languages: prev.languages.filter((_, i) => i !== index) }));
  };

  const updateLanguage = (index: number, value: string) => {
    setFormData(prev => ({
      ...prev,
      languages: prev.languages.map((lang, i) => i === index ? value : lang)
    }));
  };

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

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          className={`fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4 ${theme === 'dark' ? 'dark' : ''}`}
          variants={backdropVariants}
          initial="hidden"
          animate="visible"
          exit="exit"
          onClick={handleBackdropClick}
          role="dialog"
          aria-modal="true"
          aria-labelledby="modal-title"
          aria-describedby="incomplete-sections-list"
        >
          <motion.div
            ref={modalRef}
            className="bg-white dark:bg-dark-800 rounded-xl w-full max-w-4xl shadow-2xl overflow-hidden"
            variants={modalVariants}
            initial="hidden"
            animate="visible"
            exit="exit"
            transition={{ duration: 0.2 }}
            onClick={(e) => e.stopPropagation()}
            onKeyDown={handleKeyDown}
          >
            {/* Modal Header */}
            <div className="flex items-start justify-between p-6 border-b border-gray-200 dark:border-dark-700">
              <div className="flex items-start gap-3">
                <div className="flex-shrink-0 mt-1">
                  <AlertCircle className="h-6 w-6 text-blue-600 dark:text-blue-400" />
                </div>
                <div>
                  <h2
                    id="modal-title"
                    className="text-xl font-bold text-gray-900 dark:text-gray-100"
                  >
                    Complete Your Profile
                  </h2>
                  <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                    Your Digital Passport is incomplete
                  </p>
                </div>
              </div>
              <button
                onClick={onClose}
                className="p-2 hover:bg-gray-100 dark:hover:bg-dark-700 rounded-lg transition-colors"
                aria-label="Close modal"
              >
                <X className="h-5 w-5 text-gray-500 dark:text-gray-400" />
              </button>
            </div>

            {/* Modal Content */}
            <div className="p-6 max-h-[60vh] overflow-y-auto">
              {!editMode ? (
                <>
                  <p
                    id="modal-description"
                    className="text-sm text-gray-700 dark:text-gray-300 mb-4"
                  >
                    The following sections need your attention:
                  </p>

                  {/* Incomplete Sections List */}
                  <div 
                    id="incomplete-sections-list"
                    className="space-y-2 mb-6"
                    role="list"
                    aria-label="Incomplete profile sections"
                  >
                    {incompleteSections.length > 0 ? (
                      incompleteSections.map((section, index) => (
                        <div
                          key={index}
                          className="flex items-center gap-3 p-3 bg-gray-50 dark:bg-dark-700 rounded-lg"
                          role="listitem"
                        >
                          <div className="flex-shrink-0">
                            <div className="w-2 h-2 bg-blue-600 dark:bg-blue-400 rounded-full" aria-hidden="true"></div>
                          </div>
                          <span className="text-sm font-medium text-gray-800 dark:text-gray-200">
                            {typeof section === 'string' ? section : 'Unknown Section'}
                          </span>
                        </div>
                      ))
                    ) : (
                      <div className="flex items-center gap-3 p-3 bg-gray-50 dark:bg-dark-700 rounded-lg" role="listitem">
                        <div className="flex-shrink-0">
                          <div className="w-2 h-2 bg-gray-400 rounded-full" aria-hidden="true"></div>
                        </div>
                        <span className="text-sm font-medium text-gray-600 dark:text-gray-400">
                          No incomplete sections found
                        </span>
                      </div>
                    )}
                  </div>
                </>
              ) : (
                <div className="space-y-6">
                  {/* Projects */}
                  {incompleteSections.includes('Projects') && (
                    <div>
                      <div className="flex items-center justify-between mb-3">
                        <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">Projects</h3>
                        <button
                          onClick={addProject}
                          className="flex items-center gap-1 text-sm text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300"
                        >
                          <Plus className="w-4 h-4" />
                          Add Project
                        </button>
                      </div>
                      <div className="space-y-3">
                        {formData.projects.map((project, index) => (
                          <div key={project.id} className="p-3 bg-gray-50 dark:bg-dark-700 rounded-lg space-y-2">
                            <div className="flex items-start justify-between gap-2">
                              <input
                                type="text"
                                placeholder="Project Title"
                                value={project.title}
                                onChange={(e) => updateProject(index, 'title', e.target.value)}
                                className="flex-1 px-3 py-2 bg-white dark:bg-dark-600 border border-gray-300 dark:border-dark-500 rounded text-sm text-gray-900 dark:text-gray-100"
                              />
                              <button
                                onClick={() => removeProject(index)}
                                className="p-2 text-red-600 hover:text-red-700 dark:text-red-400"
                              >
                                <Trash2 className="w-4 h-4" />
                              </button>
                            </div>
                            <textarea
                              placeholder="Description"
                              value={project.description}
                              onChange={(e) => updateProject(index, 'description', e.target.value)}
                              className="w-full px-3 py-2 bg-white dark:bg-dark-600 border border-gray-300 dark:border-dark-500 rounded text-sm text-gray-900 dark:text-gray-100"
                              rows={2}
                            />
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Achievements */}
                  {incompleteSections.includes('Achievements') && (
                    <div>
                      <div className="flex items-center justify-between mb-3">
                        <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">Achievements</h3>
                        <button
                          onClick={addAchievement}
                          className="flex items-center gap-1 text-sm text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300"
                        >
                          <Plus className="w-4 h-4" />
                          Add Achievement
                        </button>
                      </div>
                      <div className="space-y-3">
                        {formData.achievements.map((achievement, index) => (
                          <div key={achievement.id} className="p-3 bg-gray-50 dark:bg-dark-700 rounded-lg space-y-2">
                            <div className="flex items-start justify-between gap-2">
                              <input
                                type="text"
                                placeholder="Achievement Title"
                                value={achievement.title}
                                onChange={(e) => updateAchievement(index, 'title', e.target.value)}
                                className="flex-1 px-3 py-2 bg-white dark:bg-dark-600 border border-gray-300 dark:border-dark-500 rounded text-sm text-gray-900 dark:text-gray-100"
                              />
                              <button
                                onClick={() => removeAchievement(index)}
                                className="p-2 text-red-600 hover:text-red-700 dark:text-red-400"
                              >
                                <Trash2 className="w-4 h-4" />
                              </button>
                            </div>
                            <textarea
                              placeholder="Description"
                              value={achievement.description}
                              onChange={(e) => updateAchievement(index, 'description', e.target.value)}
                              className="w-full px-3 py-2 bg-white dark:bg-dark-600 border border-gray-300 dark:border-dark-500 rounded text-sm text-gray-900 dark:text-gray-100"
                              rows={2}
                            />
                            <input
                              type="date"
                              value={achievement.date}
                              onChange={(e) => updateAchievement(index, 'date', e.target.value)}
                              className="w-full px-3 py-2 bg-white dark:bg-dark-600 border border-gray-300 dark:border-dark-500 rounded text-sm text-gray-900 dark:text-gray-100"
                            />
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Hobbies */}
                  {incompleteSections.includes('Hobbies') && (
                    <div>
                      <div className="flex items-center justify-between mb-3">
                        <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">Hobbies</h3>
                        <button
                          onClick={addHobby}
                          className="flex items-center gap-1 text-sm text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300"
                        >
                          <Plus className="w-4 h-4" />
                          Add Hobby
                        </button>
                      </div>
                      <div className="space-y-2">
                        {formData.hobbies.map((hobby, index) => (
                          <div key={index} className="flex items-center gap-2">
                            <input
                              type="text"
                              placeholder="Enter hobby"
                              value={hobby}
                              onChange={(e) => updateHobby(index, e.target.value)}
                              className="flex-1 px-3 py-2 bg-white dark:bg-dark-600 border border-gray-300 dark:border-dark-500 rounded text-sm text-gray-900 dark:text-gray-100"
                            />
                            <button
                              onClick={() => removeHobby(index)}
                              className="p-2 text-red-600 hover:text-red-700 dark:text-red-400"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Interests */}
                  {incompleteSections.includes('Interests') && (
                    <div>
                      <div className="flex items-center justify-between mb-3">
                        <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">Interests</h3>
                        <button
                          onClick={addInterest}
                          className="flex items-center gap-1 text-sm text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300"
                        >
                          <Plus className="w-4 h-4" />
                          Add Interest
                        </button>
                      </div>
                      <div className="space-y-2">
                        {formData.interests.map((interest, index) => (
                          <div key={index} className="flex items-center gap-2">
                            <input
                              type="text"
                              placeholder="Enter interest"
                              value={interest}
                              onChange={(e) => updateInterest(index, e.target.value)}
                              className="flex-1 px-3 py-2 bg-white dark:bg-dark-600 border border-gray-300 dark:border-dark-500 rounded text-sm text-gray-900 dark:text-gray-100"
                            />
                            <button
                              onClick={() => removeInterest(index)}
                              className="p-2 text-red-600 hover:text-red-700 dark:text-red-400"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Languages */}
                  {incompleteSections.includes('Languages') && (
                    <div>
                      <div className="flex items-center justify-between mb-3">
                        <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">Languages</h3>
                        <button
                          onClick={addLanguage}
                          className="flex items-center gap-1 text-sm text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300"
                        >
                          <Plus className="w-4 h-4" />
                          Add Language
                        </button>
                      </div>
                      <div className="space-y-2">
                        {formData.languages.map((language, index) => (
                          <div key={index} className="flex items-center gap-2">
                            <input
                              type="text"
                              placeholder="Enter language"
                              value={typeof language === 'string' ? language : language.name}
                              onChange={(e) => updateLanguage(index, e.target.value)}
                              className="flex-1 px-3 py-2 bg-white dark:bg-dark-600 border border-gray-300 dark:border-dark-500 rounded text-sm text-gray-900 dark:text-gray-100"
                            />
                            <button
                              onClick={() => removeLanguage(index)}
                              className="p-2 text-red-600 hover:text-red-700 dark:text-red-400"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* Action Buttons */}
              <div className="space-y-3 mt-6">
                <button
                  ref={firstButtonRef}
                  onClick={handleComplete}
                  disabled={saving}
                  className="w-full px-4 py-3 bg-blue-600 hover:bg-blue-700 dark:bg-blue-500 dark:hover:bg-blue-600 text-white font-medium rounded-lg transition-colors flex items-center justify-center gap-2 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 dark:focus:ring-offset-dark-800 disabled:opacity-50 disabled:cursor-not-allowed"
                  aria-describedby="modal-description"
                >
                  {saving ? (
                    <>
                      <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                      Saving...
                    </>
                  ) : editMode ? (
                    <>
                      <Save className="h-5 w-5" aria-hidden="true" />
                      Save & Complete
                    </>
                  ) : (
                    <>
                      <CheckCircle className="h-5 w-5" aria-hidden="true" />
                      Complete Now
                    </>
                  )}
                </button>

                {!editMode && (
                  <>
                    <button
                      onClick={handleSkip}
                      className="w-full px-4 py-3 bg-gray-100 hover:bg-gray-200 dark:bg-dark-700 dark:hover:bg-dark-600 text-gray-700 dark:text-gray-300 font-medium rounded-lg transition-colors focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-offset-2 dark:focus:ring-offset-dark-800"
                      aria-describedby="modal-description"
                    >
                      Skip for now
                    </button>

                    <button
                      ref={lastButtonRef}
                      onClick={handleNeverShow}
                      className="w-full px-4 py-3 text-gray-600 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200 text-sm font-medium transition-colors focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-offset-2 dark:focus:ring-offset-dark-800"
                      aria-describedby="modal-description"
                    >
                      Never show this again
                    </button>
                  </>
                )}

                {editMode && (
                  <button
                    ref={lastButtonRef}
                    onClick={() => setEditMode(false)}
                    className="w-full px-4 py-3 bg-gray-100 hover:bg-gray-200 dark:bg-dark-700 dark:hover:bg-dark-600 text-gray-700 dark:text-gray-300 font-medium rounded-lg transition-colors focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-offset-2 dark:focus:ring-offset-dark-800"
                  >
                    Back
                  </button>
                )}
              </div>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
});

// Add display name for debugging
ProfileCompletionModal.displayName = 'ProfileCompletionModal';

export default ProfileCompletionModal;
