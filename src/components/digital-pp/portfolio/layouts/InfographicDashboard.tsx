import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Code, GraduationCap, Briefcase, Award, TrendingUp, Star, Github, ExternalLink, Calendar, MapPin, Mail, Phone, Target, BookOpen, Zap, Trophy, Sparkles } from 'lucide-react';
import { Student, AnimationType, DisplayPreferences } from '../../../../types/student';

interface InfographicDashboardProps {
  student: Student;
  primaryColor: string;
  secondaryColor: string;
  accentColor: string;
  animation?: AnimationType;
  displayPreferences?: DisplayPreferences;
}

const InfographicDashboard: React.FC<InfographicDashboardProps> = ({ 
  student, 
  primaryColor, 
  secondaryColor, 
  accentColor,
  displayPreferences = {
    showSocialLinks: true,
    showSkillBars: true,
    showProjectImages: true,
    enableAnimations: true,
    showContactForm: true,
    showDownloadResume: true,
  }
}) => {
  const [countedProjects, setCountedProjects] = useState(0);
  const [countedSkills, setCountedSkills] = useState(0);
  const [countedAchievements, setCountedAchievements] = useState(0);

  const projectCount = student.profile.projects?.length || 0;
  const skillCount = student.profile.skills?.length || 0;
  const achievementCount = student.profile.achievements?.length || 0;

  // Animated counters
  useEffect(() => {
    const duration = 2000;
    const steps = 60;
    const interval = duration / steps;

    let currentStep = 0;
    const timer = setInterval(() => {
      currentStep++;
      const progress = currentStep / steps;
      setCountedProjects(Math.floor(projectCount * progress));
      setCountedSkills(Math.floor(skillCount * progress));
      setCountedAchievements(Math.floor(achievementCount * progress));

      if (currentStep >= steps) {
        clearInterval(timer);
        setCountedProjects(projectCount);
        setCountedSkills(skillCount);
        setCountedAchievements(achievementCount);
      }
    }, interval);

    return () => clearInterval(timer);
  }, [projectCount, skillCount, achievementCount]);

  // Skills radar chart simulation (simplified visual representation)
  const topSkills = student.profile.skills?.slice(0, 8) || [];
  const skillLevelMap: { [key: string]: number } = {
    'Beginner': 25,
    'Intermediate': 50,
    'Advanced': 75,
    'Expert': 100
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-purple-50 to-pink-50 dark:from-gray-900 dark:via-indigo-950 dark:to-purple-950 data-layout-container">
      {/* Hero Header with Gradient Background */}
      <div className="relative overflow-hidden">
        {/* Animated Background Pattern */}
        <div className="absolute inset-0 opacity-10">
          <div className="absolute inset-0" style={{
            backgroundImage: `radial-gradient(circle at 20% 50%, ${primaryColor} 0%, transparent 50%), radial-gradient(circle at 80% 80%, ${accentColor} 0%, transparent 50%)`
          }} />
        </div>

        <div className="relative bg-white/80 dark:bg-gray-900/80 backdrop-blur-sm shadow-xl">
          <div className="container mx-auto px-6 py-12">
            <div className="grid md:grid-cols-12 gap-8 items-center">
              {/* Profile Image & Info */}
              <div className="md:col-span-4">
                <motion.div
                  initial={{ scale: 0, rotate: -180 }}
                  animate={{ scale: 1, rotate: 0 }}
                  transition={{ type: 'spring', stiffness: 200, damping: 15 }}
                  className="relative inline-block"
                >
                  <div className="absolute inset-0 rounded-full blur-2xl opacity-50"
                    style={{ background: `linear-gradient(135deg, ${primaryColor}, ${accentColor})` }}
                  />
                  <img
                    src={student.profile.profileImage || '/api/placeholder/200/200'}
                    alt={student.name || 'Profile'}
                    className="relative w-48 h-48 rounded-full object-cover border-8 border-white dark:border-gray-800 shadow-2xl mx-auto"
                  />
                  <motion.div
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    transition={{ delay: 0.5 }}
                    className="absolute -bottom-2 -right-2 w-16 h-16 rounded-full flex items-center justify-center border-4 border-white dark:border-gray-800 shadow-lg"
                    style={{ background: `linear-gradient(135deg, ${primaryColor}, ${accentColor})` }}
                  >
                    <Sparkles className="w-8 h-8 text-white" />
                  </motion.div>
                </motion.div>
              </div>

              {/* Name & Title */}
              <div className="md:col-span-8">
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.3 }}
                >
                  <h1 className="text-5xl md:text-6xl font-black mb-4 bg-gradient-to-r from-gray-900 via-gray-800 to-gray-700 dark:from-white dark:via-gray-200 dark:to-gray-400 bg-clip-text text-transparent">
                    {student.name || student.profile.name}
                  </h1>
                  <div className="flex flex-wrap items-center gap-4 mb-6">
                    <div className="px-4 py-2 rounded-full font-semibold text-white shadow-lg"
                      style={{ background: `linear-gradient(135deg, ${primaryColor}, ${secondaryColor})` }}
                    >
                      {student.branch_field}
                    </div>
                    <div className="px-4 py-2 rounded-full bg-white dark:bg-gray-800 shadow-lg border-2"
                      style={{ borderColor: accentColor }}
                    >
                      <span className="font-semibold" style={{ color: accentColor }}>
                        {student.university}
                      </span>
                    </div>
                  </div>

                  {/* Quick Stats Pills */}
                  <div className="flex flex-wrap gap-4">
                    <motion.div
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: 0.5 }}
                      className="group flex items-center space-x-3 px-6 py-3 bg-gradient-to-br from-blue-50 to-indigo-50 dark:from-blue-900/30 dark:to-indigo-900/30 rounded-xl border border-blue-200 dark:border-blue-800 hover:shadow-lg transition-all"
                    >
                      <div className="w-12 h-12 rounded-full flex items-center justify-center"
                        style={{ backgroundColor: `${primaryColor}20` }}
                      >
                        <Briefcase className="w-6 h-6" style={{ color: primaryColor }} />
                      </div>
                      <div>
                        <div className="text-3xl font-bold" style={{ color: primaryColor }}>
                          {countedProjects}
                        </div>
                        <div className="text-sm text-gray-600 dark:text-gray-400">Projects</div>
                      </div>
                    </motion.div>

                    <motion.div
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: 0.6 }}
                      className="group flex items-center space-x-3 px-6 py-3 bg-gradient-to-br from-purple-50 to-pink-50 dark:from-purple-900/30 dark:to-pink-900/30 rounded-xl border border-purple-200 dark:border-purple-800 hover:shadow-lg transition-all"
                    >
                      <div className="w-12 h-12 rounded-full flex items-center justify-center"
                        style={{ backgroundColor: `${accentColor}20` }}
                      >
                        <Code className="w-6 h-6" style={{ color: accentColor }} />
                      </div>
                      <div>
                        <div className="text-3xl font-bold" style={{ color: accentColor }}>
                          {countedSkills}
                        </div>
                        <div className="text-sm text-gray-600 dark:text-gray-400">Skills</div>
                      </div>
                    </motion.div>

                    <motion.div
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: 0.7 }}
                      className="group flex items-center space-x-3 px-6 py-3 bg-gradient-to-br from-amber-50 to-orange-50 dark:from-amber-900/30 dark:to-orange-900/30 rounded-xl border border-amber-200 dark:border-amber-800 hover:shadow-lg transition-all"
                    >
                      <div className="w-12 h-12 rounded-full flex items-center justify-center"
                        style={{ backgroundColor: `${secondaryColor}20` }}
                      >
                        <Trophy className="w-6 h-6" style={{ color: secondaryColor }} />
                      </div>
                      <div>
                        <div className="text-3xl font-bold" style={{ color: secondaryColor }}>
                          {countedAchievements}
                        </div>
                        <div className="text-sm text-gray-600 dark:text-gray-400">Achievements</div>
                      </div>
                    </motion.div>
                  </div>
                </motion.div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-6 py-12">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          {/* Left Sidebar - Skills & Contact */}
          <div className="lg:col-span-4 space-y-6">
            {/* Skills Proficiency Card */}
            <motion.div
              initial={{ opacity: 0, x: -50 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.8 }}
              className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl p-6 border-t-4"
              style={{ borderColor: primaryColor }}
            >
              <div className="flex items-center justify-between mb-6">
                <div className="flex items-center space-x-3">
                  <div className="w-10 h-10 rounded-lg flex items-center justify-center"
                    style={{ background: `linear-gradient(135deg, ${primaryColor}, ${accentColor})` }}
                  >
                    <Zap className="w-6 h-6 text-white" />
                  </div>
                  <h2 className="text-2xl font-bold dark:text-white">Top Skills</h2>
                </div>
              </div>

              <div className="space-y-5">
                {topSkills.map((skill, index) => {
                  const percentage = skillLevelMap[skill.level] || 50;
                  return (
                    <motion.div
                      key={index}
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: 1 + index * 0.1 }}
                      className="group"
                    >
                      <div className="flex justify-between items-center mb-2">
                        <span className="text-sm font-semibold dark:text-gray-200">{skill.name}</span>
                        <span className="text-xs px-2 py-1 rounded-full font-medium"
                          style={{ backgroundColor: `${accentColor}20`, color: accentColor }}
                        >
                          {skill.level}
                        </span>
                      </div>
                      <div className="relative h-3 bg-gray-100 dark:bg-gray-700 rounded-full overflow-hidden">
                        <motion.div
                          initial={{ width: 0 }}
                          animate={{ width: `${percentage}%` }}
                          transition={{ duration: 1.5, delay: 1.2 + index * 0.1, ease: "easeOut" }}
                          className="absolute inset-y-0 left-0 rounded-full shadow-lg"
                          style={{ 
                            background: `linear-gradient(90deg, ${primaryColor}, ${accentColor})`
                          }}
                        />
                        <div className="absolute inset-0 flex items-center justify-end pr-2">
                          <span className="text-[10px] font-bold text-white drop-shadow">
                            {percentage}%
                          </span>
                        </div>
                      </div>
                    </motion.div>
                  );
                })}
              </div>
            </motion.div>

            {/* Contact Card */}
            <motion.div
              initial={{ opacity: 0, x: -50 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 1 }}
              className="bg-gradient-to-br from-white to-gray-50 dark:from-gray-800 dark:to-gray-900 rounded-2xl shadow-xl p-6 border-l-4"
              style={{ borderColor: accentColor }}
            >
              <div className="flex items-center space-x-3 mb-6">
                <div className="w-10 h-10 rounded-lg flex items-center justify-center"
                  style={{ backgroundColor: `${accentColor}20` }}
                >
                  <Target className="w-6 h-6" style={{ color: accentColor }} />
                </div>
                <h2 className="text-2xl font-bold dark:text-white">Contact</h2>
              </div>
              
              <div className="space-y-4">
                <motion.div 
                  whileHover={{ x: 5 }}
                  className="flex items-center space-x-3 p-3 rounded-lg bg-white dark:bg-gray-800 shadow-sm"
                >
                  <div className="w-8 h-8 rounded-full flex items-center justify-center"
                    style={{ backgroundColor: `${primaryColor}20` }}
                  >
                    <Mail className="w-4 h-4" style={{ color: primaryColor }} />
                  </div>
                  <span className="text-sm dark:text-gray-300 truncate">{student.email}</span>
                </motion.div>
                
                {student.contact_number && (
                  <motion.div 
                    whileHover={{ x: 5 }}
                    className="flex items-center space-x-3 p-3 rounded-lg bg-white dark:bg-gray-800 shadow-sm"
                  >
                    <div className="w-8 h-8 rounded-full flex items-center justify-center"
                      style={{ backgroundColor: `${primaryColor}20` }}
                    >
                      <Phone className="w-4 h-4" style={{ color: primaryColor }} />
                    </div>
                    <span className="text-sm dark:text-gray-300">{student.contact_number}</span>
                  </motion.div>
                )}
                
                {student.district_name && (
                  <motion.div 
                    whileHover={{ x: 5 }}
                    className="flex items-center space-x-3 p-3 rounded-lg bg-white dark:bg-gray-800 shadow-sm"
                  >
                    <div className="w-8 h-8 rounded-full flex items-center justify-center"
                      style={{ backgroundColor: `${primaryColor}20` }}
                    >
                      <MapPin className="w-4 h-4" style={{ color: primaryColor }} />
                    </div>
                    <span className="text-sm dark:text-gray-300">{student.district_name}</span>
                  </motion.div>
                )}
              </div>
            </motion.div>
          </div>

          {/* Main Content Area */}
          <div className="lg:col-span-8 space-y-8">
            {/* Education Timeline */}
            {student.profile.education && student.profile.education.length > 0 && (
              <motion.div
                initial={{ opacity: 0, y: 30 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 1.2 }}
                className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl p-8 border-t-4"
                style={{ borderColor: secondaryColor }}
              >
                <div className="flex items-center space-x-3 mb-8">
                  <div className="w-12 h-12 rounded-xl flex items-center justify-center"
                    style={{ background: `linear-gradient(135deg, ${secondaryColor}, ${accentColor})` }}
                  >
                    <GraduationCap className="w-7 h-7 text-white" />
                  </div>
                  <h2 className="text-3xl font-bold dark:text-white">Education Journey</h2>
                </div>

                <div className="relative">
                  <div className="absolute left-8 top-0 bottom-0 w-1 rounded-full" style={{
                    background: `linear-gradient(to bottom, ${primaryColor}, ${accentColor})`
                  }} />

                  <div className="space-y-8">
                    {student.profile.education.map((edu, index) => (
                      <motion.div
                        key={edu.id}
                        initial={{ opacity: 0, x: -30 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: 1.4 + index * 0.2 }}
                        className="relative pl-20"
                      >
                        <motion.div 
                          initial={{ scale: 0 }}
                          animate={{ scale: 1 }}
                          transition={{ delay: 1.5 + index * 0.2, type: 'spring' }}
                          className="absolute left-0 top-0 w-16 h-16 rounded-2xl border-4 flex items-center justify-center shadow-lg bg-white dark:bg-gray-800 group-hover:scale-110 transition-transform"
                          style={{ borderColor: primaryColor }}
                        >
                          <BookOpen className="w-7 h-7" style={{ color: primaryColor }} />
                        </motion.div>
                        
                        <div className="group bg-gradient-to-br from-gray-50 to-white dark:from-gray-700 dark:to-gray-800 p-6 rounded-xl shadow-lg hover:shadow-2xl transition-all border-l-4"
                          style={{ borderColor: accentColor }}
                        >
                          <div className="flex justify-between items-start mb-3">
                            <h3 className="font-bold text-xl dark:text-white">{edu.degree}</h3>
                            {edu.grade && (
                              <motion.span
                                whileHover={{ scale: 1.1 }}
                                className="px-4 py-2 rounded-full text-sm font-bold shadow-md"
                                style={{
                                  background: `linear-gradient(135deg, ${accentColor}, ${primaryColor})`,
                                  color: 'white'
                                }}
                              >
                                {edu.grade}
                              </motion.span>
                            )}
                          </div>
                          <p className="text-gray-700 dark:text-gray-300 font-semibold mb-2">{edu.field}</p>
                          <p className="text-sm text-gray-600 dark:text-gray-400 mb-3">{edu.institution}</p>
                          <div className="inline-flex items-center space-x-2 text-xs font-medium px-3 py-1.5 rounded-lg"
                            style={{ backgroundColor: `${primaryColor}15`, color: primaryColor }}
                          >
                            <Calendar className="w-4 h-4" />
                            <span>{edu.startDate} - {edu.endDate || 'Present'}</span>
                          </div>
                        </div>
                      </motion.div>
                    ))}
                  </div>
                </div>
              </motion.div>
            )}

            {/* Projects Grid */}
            {displayPreferences.showProjectImages && student.profile.projects && student.profile.projects.length > 0 && (
              <motion.div
                initial={{ opacity: 0, y: 50 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.4 }}
                className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6"
              >
                <div className="flex items-center space-x-2 mb-6">
                  <Briefcase className="w-6 h-6" style={{ color: secondaryColor }} />
                  <h2 className="text-xl font-bold dark:text-white">Featured Projects</h2>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {student.profile.projects.map((project, index) => (
                    <motion.div
                      key={project.id}
                      initial={{ opacity: 0, scale: 0.9 }}
                      animate={{ opacity: 1, scale: 1 }}
                      transition={{ delay: 0.6 + index * 0.1 }}
                      className="group relative overflow-hidden rounded-lg border-2 border-gray-200 dark:border-gray-700 hover:border-current transition-all"
                      style={{ borderColor: `${primaryColor}00` }}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.borderColor = primaryColor;
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.borderColor = '';
                      }}
                    >
                      {/* Hover Metrics Overlay */}
                      <div className="absolute inset-0 bg-gradient-to-t from-black/80 to-transparent opacity-0 group-hover:opacity-100 transition-opacity flex items-end p-4 z-10">
                        <div className="flex space-x-4 text-white text-xs">
                          <div className="flex items-center space-x-1">
                            <TrendingUp className="w-4 h-4" />
                            <span>{project.technologies.length} tech</span>
                          </div>
                          <div className="flex items-center space-x-1">
                            <Star className="w-4 h-4" />
                            <span>Featured</span>
                          </div>
                        </div>
                      </div>

                      <div className="p-4">
                        <h3 className="font-bold mb-2 dark:text-white">{project.title}</h3>
                        <p className="text-sm text-gray-600 dark:text-gray-400 mb-3 line-clamp-2">
                          {project.description}
                        </p>
                        <div className="flex flex-wrap gap-1 mb-3">
                          {project.technologies.slice(0, 3).map((tech, techIndex) => (
                            <span
                              key={techIndex}
                              className="text-xs px-2 py-1 rounded"
                              style={{
                                backgroundColor: `${accentColor}20`,
                                color: accentColor
                              }}
                            >
                              {tech}
                            </span>
                          ))}
                        </div>
                        <div className="flex space-x-3">
                          {project.github_url && (
                            <a
                              href={project.github_url}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-xs flex items-center space-x-1 hover:underline"
                              style={{ color: primaryColor }}
                            >
                              <Github className="w-3 h-3" />
                              <span>Code</span>
                            </a>
                          )}
                          {project.live_url && (
                            <a
                              href={project.live_url}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-xs flex items-center space-x-1 hover:underline"
                              style={{ color: primaryColor }}
                            >
                              <ExternalLink className="w-3 h-3" />
                              <span>Demo</span>
                            </a>
                          )}
                        </div>
                      </div>
                    </motion.div>
                  ))}
                </div>
              </motion.div>
            )}

            {/* Achievements Badge Carousel */}
            {student.profile.achievements && student.profile.achievements.length > 0 && (
              <motion.div
                initial={{ opacity: 0, y: 50 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.6 }}
                className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6"
              >
                <div className="flex items-center space-x-2 mb-6">
                  <Award className="w-6 h-6" style={{ color: accentColor }} />
                  <h2 className="text-xl font-bold dark:text-white">Achievements</h2>
                </div>

                <div className="flex overflow-x-auto space-x-4 pb-4 scrollbar-thin">
                  {student.profile.achievements.map((achievement, index) => (
                    <motion.div
                      key={achievement.id}
                      initial={{ opacity: 0, rotate: -10 }}
                      animate={{ opacity: 1, rotate: 0 }}
                      transition={{ delay: 0.8 + index * 0.1 }}
                      className="flex-shrink-0 w-64 p-4 rounded-lg border-2 relative"
                      style={{
                        background: `linear-gradient(135deg, ${primaryColor}10, ${accentColor}10)`,
                        borderColor: accentColor
                      }}
                    >
                      <Award className="w-8 h-8 mb-2" style={{ color: accentColor }} />
                      <h3 className="font-bold mb-1 dark:text-white">{achievement.title}</h3>
                      <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">
                        {achievement.description}
                      </p>
                      <p className="text-xs" style={{ color: primaryColor }}>{achievement.date}</p>
                    </motion.div>
                  ))}
                </div>
              </motion.div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default InfographicDashboard;
