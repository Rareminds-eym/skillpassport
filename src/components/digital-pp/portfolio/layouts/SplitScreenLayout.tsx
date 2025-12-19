import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Github, Linkedin, Twitter, Mail, Phone, MapPin, ExternalLink, Code, Briefcase, GraduationCap, ChevronRight, Moon, Sun, User, FolderOpen } from 'lucide-react';
import { Student, AnimationType, DisplayPreferences } from '../../../../types/student';
import { useTheme } from '../../../../context/ThemeContext';

interface SplitScreenLayoutProps {
  student: Student;
  primaryColor: string;
  secondaryColor: string;
  accentColor: string;
  animation?: AnimationType;
  displayPreferences?: DisplayPreferences;
}

const SplitScreenLayout: React.FC<SplitScreenLayoutProps> = ({ 
  student, 
  primaryColor, 
  secondaryColor, 
  accentColor,
  animation,
  displayPreferences = {
    showSocialLinks: true,
    showSkillBars: true,
    showProjectImages: true,
    enableAnimations: true,
    showContactForm: true,
    showDownloadResume: true,
  }
}) => {
  const [dividerPosition, setDividerPosition] = useState(35);
  const [isDragging, setIsDragging] = useState(false);
  const [activeSection, setActiveSection] = useState<'skills' | 'projects' | 'education' | 'experience'>('skills');
  const { theme, toggleTheme } = useTheme();

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

  const handleMouseDown = () => {
    setIsDragging(true);
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (isDragging) {
      const newPosition = (e.clientX / window.innerWidth) * 100;
      if (newPosition >= 25 && newPosition <= 50) {
        setDividerPosition(newPosition);
      }
    }
  };

  const handleMouseUp = () => {
    setIsDragging(false);
  };

  const quickAccessItems = [
    { id: 'skills', icon: Code, label: 'Skills' },
    { id: 'projects', icon: FolderOpen, label: 'Projects' },
    { id: 'education', icon: GraduationCap, label: 'Education' },
    { id: 'experience', icon: Briefcase, label: 'Experience' },
  ];

  return (
    <div 
      className="h-screen overflow-hidden flex data-layout-container"
      onMouseMove={handleMouseMove}
      onMouseUp={handleMouseUp}
      onMouseLeave={handleMouseUp}
    >
      {/* Left Pane - Profile */}
      <motion.div 
        className="h-full overflow-y-auto bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-900 dark:to-gray-800 relative"
        style={{ width: `${dividerPosition}%` }}
        initial={{ x: -100, opacity: 0 }}
        animate={{ x: 0, opacity: 1 }}
        transition={{ duration: 0.6 }}
      >
        <div className="p-8 flex flex-col items-center justify-center min-h-full">
          {/* Profile Image */}
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ delay: 0.3, type: 'spring', stiffness: 200 }}
            className="mb-6"
          >
            <div className="relative">
              <img
                src={student.profile.profileImage || '/api/placeholder/200/200'}
                alt={student.name || 'Profile'}
                className="w-48 h-48 rounded-full object-cover border-4 shadow-2xl dark:border-gray-700"
                style={{ borderColor: primaryColor }}
              />
              <div 
                className="absolute -bottom-2 -right-2 w-16 h-16 rounded-full flex items-center justify-center shadow-lg"
                style={{ backgroundColor: primaryColor }}
              >
                <User className="w-8 h-8 text-white" />
              </div>
            </div>
          </motion.div>

          {/* Name & Title */}
          <motion.div
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.4 }}
            className="text-center mb-6"
          >
            <h1 className="text-4xl font-bold mb-2 dark:text-white" style={{ color: secondaryColor }}>
              {student.name || student.profile.name}
            </h1>
            <p className="text-xl text-gray-600 dark:text-gray-300 mb-2">
              {student.branch_field}
            </p>
            <p className="text-sm text-gray-500 dark:text-gray-400">
              {student.school?.name || 
               student.profile?.school?.name || 
               student.college_school_name || 
               student.universityCollege?.name || 
               student.profile?.universityCollege?.name ||
               student.university || 'Student'}
            </p>
          </motion.div>

          {/* Tagline/Bio */}
          {student.profile.bio && (
            <motion.p
              initial={{ y: 20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: 0.5 }}
              className="text-center text-gray-700 dark:text-gray-300 mb-8 max-w-md leading-relaxed px-4"
            >
              {student.profile.bio}
            </motion.p>
          )}

          {/* Contact Info Cards */}
          <motion.div
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.6 }}
            className="space-y-3 w-full max-w-md"
          >
            <div className="flex items-center space-x-3 bg-white dark:bg-gray-800 p-3 rounded-lg shadow">
              <Mail className="w-5 h-5" style={{ color: primaryColor }} />
              <span className="text-sm dark:text-gray-300">{student.email}</span>
            </div>
            {student.contact_number && (
              <div className="flex items-center space-x-3 bg-white dark:bg-gray-800 p-3 rounded-lg shadow">
                <Phone className="w-5 h-5" style={{ color: primaryColor }} />
                <span className="text-sm dark:text-gray-300">{student.contact_number}</span>
              </div>
            )}
            {(student.district_name || student.city || student.state || student.country) && (
              <div className="flex items-center space-x-3 bg-white dark:bg-gray-800 p-3 rounded-lg shadow">
                <MapPin className="w-5 h-5" style={{ color: primaryColor }} />
                <span className="text-sm dark:text-gray-300">
                  {[
                    student.city,
                    student.district_name,
                    student.state,
                    student.country
                  ].filter(Boolean).join(', ') || 'Location not specified'}
                </span>
              </div>
            )}
          </motion.div>

          {/* Social Links */}
          <motion.div
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.7 }}
            className="flex space-x-4 mt-8"
          >
            {displayPreferences.showSocialLinks && (
              <>
                {student.github_link && (
                  <a
                    href={student.github_link}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="p-3 bg-white dark:bg-gray-800 rounded-full shadow-md hover:shadow-lg transition-all transform hover:scale-110"
                    style={{ color: primaryColor }}
                  >
                    <Github className="w-6 h-6" />
                  </a>
                )}
                {student.linkedin_link && (
                  <a
                    href={student.linkedin_link}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="p-3 bg-white dark:bg-gray-800 rounded-full shadow-md hover:shadow-lg transition-all transform hover:scale-110"
                    style={{ color: primaryColor }}
                  >
                    <Linkedin className="w-6 h-6" />
                  </a>
                )}
                {student.twitter_link && (
                  <a
                    href={student.twitter_link}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="p-3 bg-white dark:bg-gray-800 rounded-full shadow-md hover:shadow-lg transition-all transform hover:scale-110"
                    style={{ color: primaryColor }}
                  >
                    <Twitter className="w-6 h-6" />
                  </a>
                )}
              </>
            )}
          </motion.div>
        </div>
      </motion.div>

      {/* Draggable Divider */}
      <div
        className="w-1 bg-gray-300 dark:bg-gray-700 cursor-col-resize hover:bg-gray-400 dark:hover:bg-gray-600 transition-colors relative group"
        onMouseDown={handleMouseDown}
      >
        <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-8 h-16 bg-gray-400 dark:bg-gray-600 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
          <ChevronRight className="w-4 h-4 text-white" />
        </div>
      </div>

      {/* Right Pane - Scrollable Content */}
      <div className="flex-1 h-full overflow-y-auto bg-white dark:bg-gray-900 relative">
        <div className="p-8">
          {/* Skills Section */}
          {activeSection === 'skills' && uniqueSkills && uniqueSkills.length > 0 && (
            <motion.section
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4 }}
            >
              <h2 className="text-3xl font-bold mb-6 dark:text-white" style={{ color: secondaryColor }}>
                Skills & Expertise
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {uniqueSkills.map((skill, index) => {
                  const displayLevel = typeof skill.level === 'number' 
                    ? `Level ${skill.level}` 
                    : skill.level || 'Intermediate';
                  return (
                  <motion.div
                    key={index}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: index * 0.1 }}
                    className="p-4 bg-gray-50 dark:bg-gray-800 rounded-lg border-l-4 hover:shadow-md transition-shadow"
                    style={{ borderColor: accentColor }}
                  >
                    <div className="flex justify-between items-start mb-2">
                      <h3 className="font-semibold text-lg dark:text-white">{skill.name}</h3>
                      <span 
                        className="text-xs px-2 py-1 rounded"
                        style={{ backgroundColor: `${accentColor}20`, color: accentColor }}
                      >
                        {displayLevel}
                      </span>
                    </div>
                    {skill.category && (
                      <p className="text-sm text-gray-600 dark:text-gray-400">{skill.category}</p>
                    )}
                  </motion.div>
                  );
                })}
              </div>
            </motion.section>
          )}

          {/* Projects Section */}
          {activeSection === 'projects' && student.profile.projects && student.profile.projects.length > 0 && (
            <motion.section
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4 }}
            >
              <h2 className="text-3xl font-bold mb-6 dark:text-white" style={{ color: secondaryColor }}>
                Projects
              </h2>
              <div className="space-y-6">
                {student.profile.projects.map((project, index) => (
                  <motion.div
                    key={project.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.1 }}
                    className="p-6 bg-gray-50 dark:bg-gray-800 rounded-lg shadow hover:shadow-lg transition-shadow"
                  >
                    <h3 className="text-xl font-bold mb-2 dark:text-white" style={{ color: secondaryColor }}>
                      {project.title}
                    </h3>
                    <p className="text-gray-700 dark:text-gray-300 mb-4">{project.description}</p>
                    <div className="flex flex-wrap gap-2 mb-4">
                      {project.technologies.map((tech, techIndex) => (
                        <span
                          key={techIndex}
                          className="px-3 py-1 text-xs rounded-full"
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
                          <span>Code</span>
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
            </motion.section>
          )}

          {/* Education Section */}
          {activeSection === 'education' && student.profile.education && student.profile.education.length > 0 && (
            <motion.section
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4 }}
            >
              <h2 className="text-3xl font-bold mb-6 dark:text-white" style={{ color: secondaryColor }}>
                Education
              </h2>
              <div className="space-y-6">
                {student.profile.education.map((edu, index) => (
                  <motion.div
                    key={edu.id}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: index * 0.1 }}
                    className="relative pl-8 pb-8 border-l-2 last:border-l-0 dark:border-gray-700"
                    style={{ borderColor: accentColor }}
                  >
                    <div 
                      className="absolute -left-3 top-0 w-6 h-6 rounded-full border-4 bg-white dark:bg-gray-900"
                      style={{ borderColor: primaryColor }}
                    />
                    <div className="bg-gray-50 dark:bg-gray-800 p-4 rounded-lg">
                      <h3 className="text-xl font-bold dark:text-white">{edu.degree}</h3>
                      <p className="text-gray-600 dark:text-gray-400">{edu.field}</p>
                      <p className="text-gray-700 dark:text-gray-300 font-medium mt-1">{edu.institution}</p>
                      <p className="text-sm text-gray-500 dark:text-gray-500 mt-2">
                        {edu.startDate} - {edu.endDate || 'Present'}
                      </p>
                      {edu.grade && (
                        <p className="text-sm mt-2" style={{ color: primaryColor }}>Grade: {edu.grade}</p>
                      )}
                    </div>
                  </motion.div>
                ))}
              </div>
            </motion.section>
          )}

          {/* Experience Section */}
          {activeSection === 'experience' && student.profile.experience && student.profile.experience.length > 0 && (
            <motion.section
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4 }}
            >
              <h2 className="text-3xl font-bold mb-6 dark:text-white" style={{ color: secondaryColor }}>
                Experience
              </h2>
              <div className="space-y-6">
                {student.profile.experience.map((exp, index) => (
                  <motion.div
                    key={exp.id}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: index * 0.1 }}
                    className="p-6 bg-gray-50 dark:bg-gray-800 rounded-lg shadow"
                  >
                    <h3 className="text-xl font-bold dark:text-white" style={{ color: secondaryColor }}>
                      {exp.position}
                    </h3>
                    <p className="text-gray-600 dark:text-gray-400 font-medium">{exp.company}</p>
                    <p className="text-sm text-gray-500 dark:text-gray-500 mb-3">
                      {exp.startDate} - {exp.endDate || 'Present'}
                    </p>
                    <p className="text-gray-700 dark:text-gray-300 mb-3">{exp.description}</p>
                    {exp.technologies && (
                      <div className="flex flex-wrap gap-2">
                        {exp.technologies.map((tech, techIndex) => (
                          <span
                            key={techIndex}
                            className="px-2 py-1 text-xs rounded"
                            style={{ backgroundColor: `${accentColor}20`, color: accentColor }}
                          >
                            {tech}
                          </span>
                        ))}
                      </div>
                    )}
                  </motion.div>
                ))}
              </div>
            </motion.section>
          )}
        </div>
      </div>

      {/* Floating Quick Access Toolbar */}
      <motion.div
        initial={{ y: 100, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ delay: 0.8 }}
        className="fixed bottom-8 left-1/2 transform -translate-x-1/2 bg-white dark:bg-gray-800 rounded-full shadow-2xl px-6 py-3 flex space-x-2 z-50"
      >
        {quickAccessItems.map((item) => {
          const Icon = item.icon;
          const isActive = activeSection === item.id;
          return (
            <button
              key={item.id}
              onClick={() => setActiveSection(item.id as any)}
              className={`p-3 rounded-full transition-all ${
                isActive ? 'shadow-md' : 'hover:bg-gray-100 dark:hover:bg-gray-700'
              }`}
              style={isActive ? { backgroundColor: primaryColor } : {}}
              title={item.label}
            >
              <Icon className={`w-5 h-5 ${isActive ? 'text-white' : 'dark:text-gray-300'}`} />
            </button>
          );
        })}
        <div className="w-px bg-gray-300 dark:bg-gray-600 mx-2" />
        <button
          onClick={toggleTheme}
          className="p-3 rounded-full hover:bg-gray-100 dark:hover:bg-gray-700 transition-all"
          title="Toggle Theme"
        >
          {theme === 'dark' ? (
            <Sun className="w-5 h-5 dark:text-gray-300" />
          ) : (
            <Moon className="w-5 h-5" />
          )}
        </button>
      </motion.div>
    </div>
  );
};

export default SplitScreenLayout;
