import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Sparkles, Code, GraduationCap, FolderOpen, Award, TrendingUp, X, Github, Linkedin, Mail, Zap, Bot, Cpu, Brain, Atom } from 'lucide-react';
import { Student, AnimationType, DisplayPreferences } from '../../../../types/student';

interface AIPersonaLayoutProps {
  student: Student;
  primaryColor: string;
  secondaryColor: string;
  accentColor: string;
  animation?: AnimationType;
  displayPreferences?: DisplayPreferences;
}

type ViewType = 'intro' | 'skills' | 'education' | 'projects' | 'achievements';

const AIPersonaLayout: React.FC<AIPersonaLayoutProps> = ({ 
  student, 
  primaryColor,
  displayPreferences = {
    showSocialLinks: true,
    showSkillBars: true,
    showProjectImages: true,
    enableAnimations: true,
    showContactForm: true,
    showDownloadResume: true,
  }
}) => {
  const [currentView, setCurrentView] = useState<ViewType>('intro');
  const [isAnimating, setIsAnimating] = useState(false);

  // Combine both technical and soft skills
  const allSkills = [
    ...(student.profile?.skills || []),
    ...(student.profile?.technicalSkills || []),
    ...(student.technicalSkills || []),
    ...(student.skills || [])
  ];
  const uniqueSkills = allSkills.filter((skill, index, self) => 
    index === self.findIndex((s) => s.id === skill.id)
  );

  const handlePromptClick = (view: ViewType) => {
    if (isAnimating) return;
    setIsAnimating(true);
    setCurrentView(view);
    setTimeout(() => setIsAnimating(false), 500);
  };

  const prompts = [
    { id: 'skills', icon: Code, label: 'Show my strongest skills', gradient: 'from-blue-500 to-purple-500' },
    { id: 'education', icon: GraduationCap, label: 'View my education timeline', gradient: 'from-green-500 to-teal-500' },
    { id: 'projects', icon: FolderOpen, label: 'See my projects with impact', gradient: 'from-orange-500 to-red-500' },
    { id: 'achievements', icon: Award, label: 'Explore my achievements', gradient: 'from-pink-500 to-rose-500' },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-950 via-gray-900 to-black text-white overflow-hidden relative data-layout-container">
      {/* Animated Background Grid */}
      <div className="absolute inset-0 opacity-10">
        <div className="absolute inset-0" style={{
          backgroundImage: `linear-gradient(${primaryColor} 1px, transparent 1px), linear-gradient(90deg, ${primaryColor} 1px, transparent 1px)`,
          backgroundSize: '50px 50px'
        }} />
      </div>

      {/* Neon Glow Effects */}
      <div className="absolute top-20 left-20 w-96 h-96 bg-purple-500 rounded-full filter blur-3xl opacity-20 animate-pulse" />
      <div className="absolute bottom-20 right-20 w-96 h-96 bg-cyan-500 rounded-full filter blur-3xl opacity-20 animate-pulse" style={{ animationDelay: '1s' }} />

      <div className="relative z-10 container mx-auto px-6 py-12">
        <AnimatePresence mode="wait">
          {currentView === 'intro' && (
            <motion.div
              key="intro"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ duration: 0.5 }}
              className="max-w-4xl mx-auto"
            >
              {/* AI Avatar Section */}
              <div className="text-center mb-12">
                <motion.div
                  initial={{ scale: 0, rotate: -180 }}
                  animate={{ scale: 1, rotate: 0 }}
                  transition={{ type: 'spring', stiffness: 200, delay: 0.2 }}
                  className="inline-block mb-6"
                >
                  <div className="relative">
                    <img
                      src={student.profile.profileImage || '/api/placeholder/150/150'}
                      alt={student.name || 'Profile'}
                      className="w-32 h-32 rounded-full object-cover border-4 border-cyan-500 shadow-2xl shadow-cyan-500/50"
                    />
                    <div className="absolute -top-2 -right-2 bg-gradient-to-r from-cyan-500 to-purple-500 rounded-full p-2 animate-bounce">
                      <Bot className="w-6 h-6 text-white" />
                    </div>
                  </div>
                </motion.div>

                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 0.4 }}
                >
                  <h1 className="text-5xl font-bold mb-4 bg-clip-text text-transparent bg-gradient-to-r from-cyan-400 to-purple-400">
                    Hi, I'm {student.name || student.profile.name}'s Digital Twin
                  </h1>
                  <p className="text-xl text-gray-300 mb-2">
                    {student.branch_field && `${student.branch_field} @ `}
                    {student.school?.name || 
                     student.profile?.school?.name || 
                     student.college_school_name || 
                     student.universityCollege?.name || 
                     student.profile?.universityCollege?.name ||
                     student.university || 'Student'}
                  </p>
                  {student.profile.bio && (
                    <p className="text-gray-400 max-w-2xl mx-auto leading-relaxed">
                      {student.profile.bio}
                    </p>
                  )}
                </motion.div>
              </div>

              {/* Social Links */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.6 }}
                className="flex justify-center space-x-6 mb-12"
              >
                {displayPreferences.showSocialLinks && (
                  <>
                    {student.github_link && (
                      <a
                        href={student.github_link}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="p-4 bg-gray-800/50 backdrop-blur-sm rounded-lg border border-gray-700 hover:border-cyan-500 transition-all hover:shadow-lg hover:shadow-cyan-500/50"
                      >
                        <Github className="w-6 h-6" />
                      </a>
                    )}
                    {student.linkedin_link && (
                      <a
                        href={student.linkedin_link}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="p-4 bg-gray-800/50 backdrop-blur-sm rounded-lg border border-gray-700 hover:border-cyan-500 transition-all hover:shadow-lg hover:shadow-cyan-500/50"
                      >
                        <Linkedin className="w-6 h-6" />
                      </a>
                    )}
                  </>
                )}
                <a
                  href={`mailto:${student.email}`}
                  className="p-4 bg-gray-800/50 backdrop-blur-sm rounded-lg border border-gray-700 hover:border-cyan-500 transition-all hover:shadow-lg hover:shadow-cyan-500/50"
                >
                  <Mail className="w-6 h-6" />
                </a>
              </motion.div>

              {/* Interactive Prompts */}
              <div className="space-y-4">
                <motion.p
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 0.8 }}
                  className="text-gray-400 text-center mb-6 flex items-center justify-center space-x-2"
                >
                  <Sparkles className="w-4 h-4" />
                  <span>Ask me anything:</span>
                </motion.p>
                {prompts.map((prompt, index) => {
                  const Icon = prompt.icon;
                  return (
                    <motion.button
                      key={prompt.id}
                      initial={{ opacity: 0, x: -50 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: 0.9 + index * 0.1 }}
                      onClick={() => handlePromptClick(prompt.id as ViewType)}
                      className="w-full group relative overflow-hidden"
                    >
                      <div className={`absolute inset-0 bg-gradient-to-r ${prompt.gradient} opacity-0 group-hover:opacity-20 transition-opacity`} />
                      <div className="relative flex items-center space-x-4 p-5 bg-gray-800/50 backdrop-blur-sm border border-gray-700 rounded-xl hover:border-gray-600 transition-all">
                        <div className={`p-3 rounded-lg bg-gradient-to-r ${prompt.gradient}`}>
                          <Icon className="w-6 h-6 text-white" />
                        </div>
                        <span className="text-lg font-medium text-left flex-1">{prompt.label}</span>
                        <TrendingUp className="w-5 h-5 text-gray-500 group-hover:text-cyan-400 transition-colors" />
                      </div>
                    </motion.button>
                  );
                })}
              </div>
            </motion.div>
          )}

          {/* Skills View */}
          {currentView === 'skills' && (
            <motion.div
              key="skills"
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9 }}
              className="max-w-5xl mx-auto"
            >
              <div className="flex justify-between items-center mb-8">
                <h2 className="text-4xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-blue-400 to-purple-400">
                  My Strongest Skills
                </h2>
                <button
                  onClick={() => setCurrentView('intro')}
                  className="p-2 hover:bg-gray-800 rounded-full transition-colors"
                >
                  <X className="w-6 h-6" />
                </button>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {uniqueSkills.map((skill, index) => {
                  const displayLevel = typeof skill.level === 'number' 
                    ? `Level ${skill.level}` 
                    : skill.level || 'Intermediate';
                  return (
                  <motion.div
                    key={index}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.05 }}
                    className="group p-6 bg-gray-800/50 backdrop-blur-sm border border-gray-700 rounded-xl hover:border-blue-500 transition-all hover:shadow-lg hover:shadow-blue-500/20"
                  >
                    <div className="flex items-start justify-between mb-3">
                      <Code className="w-8 h-8 text-blue-400" />
                      <span className="px-3 py-1 text-xs rounded-full bg-gradient-to-r from-blue-500 to-purple-500 text-white">
                        {displayLevel}
                      </span>
                    </div>
                    <h3 className="text-xl font-bold mb-1">{skill.name}</h3>
                    {skill.category && (
                      <p className="text-sm text-gray-400">{skill.category}</p>
                    )}
                  </motion.div>
                  );
                })}
              </div>
            </motion.div>
          )}

          {/* Education View */}
          {currentView === 'education' && (
            <motion.div
              key="education"
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9 }}
              className="max-w-5xl mx-auto"
            >
              <div className="flex justify-between items-center mb-8">
                <h2 className="text-4xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-green-400 to-teal-400">
                  Education Timeline
                </h2>
                <button
                  onClick={() => setCurrentView('intro')}
                  className="p-2 hover:bg-gray-800 rounded-full transition-colors"
                >
                  <X className="w-6 h-6" />
                </button>
              </div>

              <div className="space-y-6">
                {student.profile.education?.map((edu, index) => (
                  <motion.div
                    key={edu.id}
                    initial={{ opacity: 0, x: -50 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: index * 0.1 }}
                    className="relative p-6 bg-gray-800/50 backdrop-blur-sm border border-gray-700 rounded-xl hover:border-green-500 transition-all"
                  >
                    <div className="flex items-start space-x-4">
                      <div className="p-3 bg-gradient-to-r from-green-500 to-teal-500 rounded-lg">
                        <GraduationCap className="w-8 h-8 text-white" />
                      </div>
                      <div className="flex-1">
                        <h3 className="text-2xl font-bold mb-1">{edu.degree}</h3>
                        <p className="text-green-400 font-medium">{edu.field}</p>
                        <p className="text-gray-300">{edu.institution}</p>
                        <p className="text-sm text-gray-500 mt-2">
                          {edu.startDate} - {edu.endDate || 'Present'}
                        </p>
                        {edu.grade && (
                          <p className="text-sm text-teal-400 mt-2">Grade: {edu.grade}</p>
                        )}
                      </div>
                    </div>
                  </motion.div>
                ))}
              </div>
            </motion.div>
          )}

          {/* Projects View */}
          {currentView === 'projects' && (
            <motion.div
              key="projects"
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9 }}
              className="max-w-5xl mx-auto"
            >
              <div className="flex justify-between items-center mb-8">
                <h2 className="text-4xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-orange-400 to-red-400">
                  Projects with Impact
                </h2>
                <button
                  onClick={() => setCurrentView('intro')}
                  className="p-2 hover:bg-gray-800 rounded-full transition-colors"
                >
                  <X className="w-6 h-6" />
                </button>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {student.profile.projects?.map((project, index) => (
                  <motion.div
                    key={project.id}
                    initial={{ opacity: 0, y: 30 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.1 }}
                    className="group p-6 bg-gray-800/50 backdrop-blur-sm border border-gray-700 rounded-xl hover:border-orange-500 transition-all hover:shadow-lg hover:shadow-orange-500/20"
                  >
                    <div className="flex items-start justify-between mb-4">
                      <FolderOpen className="w-10 h-10 text-orange-400" />
                      {project.github_url && (
                        <a
                          href={project.github_url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="p-2 hover:bg-gray-700 rounded-lg transition-colors"
                        >
                          <Github className="w-5 h-5" />
                        </a>
                      )}
                    </div>
                    <h3 className="text-xl font-bold mb-2">{project.title}</h3>
                    <p className="text-gray-400 mb-4 line-clamp-3">{project.description}</p>
                    <div className="flex flex-wrap gap-2">
                      {project.technologies.slice(0, 4).map((tech, techIndex) => (
                        <span
                          key={techIndex}
                          className="px-2 py-1 text-xs rounded bg-orange-500/20 text-orange-400 border border-orange-500/30"
                        >
                          {tech}
                        </span>
                      ))}
                    </div>
                  </motion.div>
                ))}
              </div>
            </motion.div>
          )}

          {/* Achievements View */}
          {currentView === 'achievements' && (
            <motion.div
              key="achievements"
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9 }}
              className="max-w-5xl mx-auto"
            >
              <div className="flex justify-between items-center mb-8">
                <h2 className="text-4xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-pink-400 to-rose-400">
                  Achievements & Recognition
                </h2>
                <button
                  onClick={() => setCurrentView('intro')}
                  className="p-2 hover:bg-gray-800 rounded-full transition-colors"
                >
                  <X className="w-6 h-6" />
                </button>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {student.profile.achievements?.map((achievement, index) => (
                  <motion.div
                    key={achievement.id}
                    initial={{ opacity: 0, rotate: -5 }}
                    animate={{ opacity: 1, rotate: 0 }}
                    transition={{ delay: index * 0.1 }}
                    className="p-6 bg-gradient-to-br from-pink-900/30 to-rose-900/30 backdrop-blur-sm border border-pink-700/50 rounded-xl"
                  >
                    <Award className="w-12 h-12 text-pink-400 mb-4" />
                    <h3 className="text-xl font-bold mb-2">{achievement.title}</h3>
                    <p className="text-gray-300 mb-3">{achievement.description}</p>
                    <p className="text-sm text-pink-400">{achievement.date}</p>
                  </motion.div>
                ))}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
};

export default AIPersonaLayout;
