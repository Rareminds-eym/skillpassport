import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Mail, Phone, MapPin, Github, Linkedin, Twitter, Code, Briefcase, GraduationCap, Award, Download, FileText, ExternalLink, Calendar } from 'lucide-react';
import { Student, AnimationType, DisplayPreferences } from '../../../../types/student';

interface CompactResumeDashboardProps {
  student: Student;
  primaryColor: string;
  secondaryColor: string;
  accentColor: string;
  animation?: AnimationType;
  displayPreferences?: DisplayPreferences;
}

type TabType = 'skills' | 'projects' | 'achievements' | 'resume';

const CompactResumeDashboard: React.FC<CompactResumeDashboardProps> = ({ 
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
  const [activeTab, setActiveTab] = useState<TabType>('skills');
  const [isDownloading, setIsDownloading] = useState(false);

  const tabs = [
    { id: 'skills', label: 'Skills', icon: Code },
    { id: 'projects', label: 'Projects', icon: Briefcase },
    { id: 'achievements', label: 'Achievements', icon: Award },
    { id: 'resume', label: 'Resume', icon: FileText },
  ];

  const handleDownloadResume = () => {
    setIsDownloading(true);
    // Simulate download
    setTimeout(() => {
      setIsDownloading(false);
      alert('Resume download would start here');
    }, 1000);
  };

  return (
    <div className="h-screen flex bg-gray-50 dark:bg-gray-900 overflow-hidden data-layout-container">
      {/* Left Fixed Sidebar - Profile & Contact */}
      <motion.aside
        initial={{ x: -100, opacity: 0 }}
        animate={{ x: 0, opacity: 1 }}
        transition={{ duration: 0.5 }}
        className="w-80 bg-white dark:bg-gray-800 shadow-xl flex flex-col"
      >
        {/* Profile Section */}
        <div className="p-8 text-center border-b dark:border-gray-700">
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ type: 'spring', stiffness: 200, delay: 0.2 }}
            className="mb-6"
          >
            <img
              src={student.profile.profileImage || '/api/placeholder/120/120'}
              alt={student.name || 'Profile'}
              className="w-32 h-32 rounded-full object-cover mx-auto border-4 shadow-lg"
              style={{ borderColor: primaryColor }}
            />
          </motion.div>

          <motion.div
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.3 }}
          >
            <h1 className="text-2xl font-bold mb-2 dark:text-white" style={{ color: secondaryColor }}>
              {student.name || student.profile.name}
            </h1>
            <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">{student.branch_field}</p>
            <p className="text-xs text-gray-500 dark:text-gray-500">{student.university}</p>
          </motion.div>

          {student.profile.bio && (
            <motion.p
              initial={{ y: 20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: 0.4 }}
              className="text-sm text-gray-700 dark:text-gray-300 mt-4 leading-relaxed"
            >
              {student.profile.bio}
            </motion.p>
          )}
        </div>

        {/* Contact Information */}
        <div className="p-6 border-b dark:border-gray-700">
          <h2 className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide mb-4">
            Contact Information
          </h2>
          <motion.div
            initial={{ x: -20, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            transition={{ delay: 0.5 }}
            className="space-y-3"
          >
            <div className="flex items-start space-x-3">
              <Mail className="w-4 h-4 mt-0.5 flex-shrink-0" style={{ color: primaryColor }} />
              <span className="text-sm dark:text-gray-300 break-all">{student.email}</span>
            </div>
            {student.contact_number && (
              <div className="flex items-center space-x-3">
                <Phone className="w-4 h-4 flex-shrink-0" style={{ color: primaryColor }} />
                <span className="text-sm dark:text-gray-300">{student.contact_number}</span>
              </div>
            )}
            {student.district_name && (
              <div className="flex items-start space-x-3">
                <MapPin className="w-4 h-4 mt-0.5 flex-shrink-0" style={{ color: primaryColor }} />
                <span className="text-sm dark:text-gray-300">{student.district_name}</span>
              </div>
            )}
          </motion.div>
        </div>

        {/* Social Links */}
        <div className="p-6 border-b dark:border-gray-700">
          <h2 className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide mb-4">
            Social Links
          </h2>
          <motion.div
            initial={{ x: -20, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            transition={{ delay: 0.6 }}
            className="flex space-x-3"
          >
            {displayPreferences.showSocialLinks && (
              <>
                {student.github_link && (
                  <a
                    href={student.github_link}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                    style={{ color: primaryColor }}
                  >
                    <Github className="w-5 h-5" />
                  </a>
                )}
                {student.linkedin_link && (
                  <a
                    href={student.linkedin_link}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                    style={{ color: primaryColor }}
                  >
                    <Linkedin className="w-5 h-5" />
                  </a>
                )}
                {student.twitter_link && (
                  <a
                    href={student.twitter_link}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                    style={{ color: primaryColor }}
                  >
                    <Twitter className="w-5 h-5" />
                  </a>
                )}
              </>
            )}
          </motion.div>
        </div>

        {/* Education Summary */}
        {student.profile.education && student.profile.education.length > 0 && (
          <div className="p-6 flex-1 overflow-y-auto">
            <h2 className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide mb-4 flex items-center space-x-2">
              <GraduationCap className="w-4 h-4" />
              <span>Education</span>
            </h2>
            <div className="space-y-4">
              {student.profile.education.map((edu, index) => (
                <motion.div
                  key={edu.id}
                  initial={{ x: -20, opacity: 0 }}
                  animate={{ x: 0, opacity: 1 }}
                  transition={{ delay: 0.7 + index * 0.1 }}
                  className="pb-4 border-b border-gray-200 dark:border-gray-700 last:border-0"
                >
                  <h3 className="font-semibold text-sm dark:text-white">{edu.degree}</h3>
                  <p className="text-xs text-gray-600 dark:text-gray-400">{edu.institution}</p>
                  <p className="text-xs mt-1" style={{ color: accentColor }}>
                    {edu.startDate} - {edu.endDate || 'Present'}
                  </p>
                  {edu.grade && (
                    <p className="text-xs text-gray-500 dark:text-gray-500 mt-1">Grade: {edu.grade}</p>
                  )}
                </motion.div>
              ))}
            </div>
          </div>
        )}

        {/* Download Resume Button */}
        {displayPreferences.showDownloadResume && (
          <div className="p-6 border-t dark:border-gray-700">
            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={handleDownloadResume}
              disabled={isDownloading}
              className="w-full py-3 rounded-lg font-semibold text-white shadow-lg hover:shadow-xl transition-all flex items-center justify-center space-x-2 disabled:opacity-50"
              style={{ backgroundColor: primaryColor }}
            >
              {isDownloading ? (
                <>
                  <motion.div
                    animate={{ rotate: 360 }}
                    transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
                  >
                    <Download className="w-5 h-5" />
                  </motion.div>
                  <span>Preparing...</span>
                </>
              ) : (
                <>
                  <Download className="w-5 h-5" />
                  <span>Download Resume</span>
                </>
              )}
            </motion.button>
          </div>
        )}
      </motion.aside>

      {/* Right Content Area - Tabbed Interface */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Tab Navigation */}
        <motion.div
          initial={{ y: -50, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ duration: 0.5 }}
          className="bg-white dark:bg-gray-800 shadow-md"
        >
          <div className="flex border-b dark:border-gray-700">
            {tabs.map((tab, index) => {
              const Icon = tab.icon;
              const isActive = activeTab === tab.id;
              return (
                <motion.button
                  key={tab.id}
                  initial={{ opacity: 0, y: -20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.3 + index * 0.1 }}
                  onClick={() => setActiveTab(tab.id as TabType)}
                  className={`flex-1 flex items-center justify-center space-x-2 py-4 px-6 font-medium transition-all relative ${
                    isActive ? 'text-white' : 'text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-700'
                  }`}
                  style={isActive ? { backgroundColor: primaryColor } : {}}
                >
                  <Icon className="w-5 h-5" />
                  <span>{tab.label}</span>
                  {isActive && (
                    <motion.div
                      layoutId="activeTab"
                      className="absolute bottom-0 left-0 right-0 h-1"
                      style={{ backgroundColor: accentColor }}
                    />
                  )}
                </motion.button>
              );
            })}
          </div>
        </motion.div>

        {/* Tab Content */}
        <div className="flex-1 overflow-y-auto bg-gray-50 dark:bg-gray-900 p-8">
          {/* Skills Tab */}
          {activeTab === 'skills' && (
            <motion.div
              key="skills"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
            >
              <h2 className="text-2xl font-bold mb-6 dark:text-white" style={{ color: secondaryColor }}>
                Skills & Technologies
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {student.profile.skills?.map((skill, index) => (
                  <motion.div
                    key={index}
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ delay: index * 0.05 }}
                    className="bg-white dark:bg-gray-800 rounded-lg p-4 shadow hover:shadow-lg transition-shadow border-l-4"
                    style={{ borderColor: accentColor }}
                  >
                    <div className="flex items-center justify-between mb-2">
                      <h3 className="font-semibold dark:text-white">{skill.name}</h3>
                      <span 
                        className="text-xs px-2 py-1 rounded"
                        style={{ backgroundColor: `${primaryColor}20`, color: primaryColor }}
                      >
                        {skill.level}
                      </span>
                    </div>
                    {skill.category && (
                      <p className="text-sm text-gray-600 dark:text-gray-400">{skill.category}</p>
                    )}
                  </motion.div>
                ))}
              </div>
            </motion.div>
          )}

          {/* Projects Tab */}
          {activeTab === 'projects' && (
            <motion.div
              key="projects"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
            >
              <h2 className="text-2xl font-bold mb-6 dark:text-white" style={{ color: secondaryColor }}>
                Featured Projects
              </h2>
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {student.profile.projects?.map((project, index) => (
                  <motion.div
                    key={project.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.1 }}
                    className="bg-white dark:bg-gray-800 rounded-lg p-6 shadow hover:shadow-xl transition-all"
                  >
                    <h3 className="text-xl font-bold mb-3 dark:text-white" style={{ color: secondaryColor }}>
                      {project.title}
                    </h3>
                    <p className="text-gray-700 dark:text-gray-300 mb-4">{project.description}</p>
                    <div className="flex flex-wrap gap-2 mb-4">
                      {project.technologies.map((tech, techIndex) => (
                        <span
                          key={techIndex}
                          className="px-2 py-1 text-xs rounded"
                          style={{ backgroundColor: `${accentColor}20`, color: accentColor }}
                        >
                          {tech}
                        </span>
                      ))}
                    </div>
                    <div className="flex space-x-4">
                      {project.github_url && (
                        <a
                          href={project.github_url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="flex items-center space-x-1 text-sm hover:underline"
                          style={{ color: primaryColor }}
                        >
                          <Github className="w-4 h-4" />
                          <span>Source</span>
                        </a>
                      )}
                      {project.live_url && (
                        <a
                          href={project.live_url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="flex items-center space-x-1 text-sm hover:underline"
                          style={{ color: primaryColor }}
                        >
                          <ExternalLink className="w-4 h-4" />
                          <span>Live Demo</span>
                        </a>
                      )}
                    </div>
                  </motion.div>
                ))}
              </div>
            </motion.div>
          )}

          {/* Achievements Tab */}
          {activeTab === 'achievements' && (
            <motion.div
              key="achievements"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
            >
              <h2 className="text-2xl font-bold mb-6 dark:text-white" style={{ color: secondaryColor }}>
                Achievements & Recognition
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {student.profile.achievements?.map((achievement, index) => (
                  <motion.div
                    key={achievement.id}
                    initial={{ opacity: 0, rotate: -2 }}
                    animate={{ opacity: 1, rotate: 0 }}
                    transition={{ delay: index * 0.1 }}
                    className="bg-white dark:bg-gray-800 rounded-lg p-6 shadow-md hover:shadow-lg transition-shadow border-t-4"
                    style={{ borderColor: accentColor }}
                  >
                    <Award className="w-10 h-10 mb-3" style={{ color: accentColor }} />
                    <h3 className="text-lg font-bold mb-2 dark:text-white">{achievement.title}</h3>
                    <p className="text-gray-700 dark:text-gray-300 mb-3">{achievement.description}</p>
                    <div className="flex items-center space-x-2 text-sm text-gray-500 dark:text-gray-400">
                      <Calendar className="w-4 h-4" />
                      <span>{achievement.date}</span>
                    </div>
                  </motion.div>
                ))}
              </div>
            </motion.div>
          )}

          {/* Resume Tab - PDF Viewer Placeholder */}
          {activeTab === 'resume' && (
            <motion.div
              key="resume"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              className="h-full"
            >
              <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-8 h-full flex flex-col items-center justify-center">
                <FileText className="w-24 h-24 mb-6" style={{ color: primaryColor }} />
                <h2 className="text-2xl font-bold mb-4 dark:text-white">Resume Preview</h2>
                <p className="text-gray-600 dark:text-gray-400 mb-6 text-center max-w-md">
                  A PDF viewer would be displayed here in production. For now, you can download the resume using the button in the sidebar.
                </p>
                <button
                  onClick={handleDownloadResume}
                  className="px-6 py-3 rounded-lg font-semibold text-white shadow-lg hover:shadow-xl transition-all flex items-center space-x-2"
                  style={{ backgroundColor: primaryColor }}
                >
                  <Download className="w-5 h-5" />
                  <span>Download Resume</span>
                </button>
              </div>
            </motion.div>
          )}
        </div>
      </div>
    </div>
  );
};

export default CompactResumeDashboard;
