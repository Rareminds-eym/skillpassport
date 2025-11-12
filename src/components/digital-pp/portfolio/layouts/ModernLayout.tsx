import React from 'react';
import { motion } from 'framer-motion';
import { Github, Linkedin, Twitter, Mail, Phone, MapPin, Calendar, Award, Code, Briefcase } from 'lucide-react';
import { Student, AnimationType, DisplayPreferences } from '../../../../types/student';

interface ModernLayoutProps {
  student: Student;
  primaryColor: string;
  secondaryColor: string;
  accentColor: string;
  animation: AnimationType;
  displayPreferences?: DisplayPreferences;
}

const ModernLayout: React.FC<ModernLayoutProps> = ({ 
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
  const getAnimationClass = (animation: AnimationType) => {
    switch (animation) {
      case 'fade': return 'animate-fade-in';
      case 'slide': return 'animate-slide-in';
      case 'bounce': return 'animate-bounce-in';
      case 'float': return 'animate-float';
      default: return '';
    }
  };

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1
      }
    }
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: { opacity: 1, y: 0 }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 data-layout-container">
      {/* Header Section */}
      <motion.section 
        className="relative overflow-hidden"
        style={{ backgroundColor: primaryColor }}
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.8 }}
      >
        <div className="absolute inset-0 bg-black opacity-10"></div>
        <div className="relative container mx-auto px-6 py-20">
          <div className="flex flex-col lg:flex-row items-center space-y-8 lg:space-y-0 lg:space-x-12">
            <motion.div
              className={`${getAnimationClass(animation)}`}
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ duration: 0.6, delay: 0.2 }}
            >
              <img
                src={student.profile.profileImage || '/api/placeholder/200/200'}
                alt={student.name || 'Profile'}
                className="w-48 h-48 rounded-full object-cover border-8 border-white shadow-2xl"
              />
            </motion.div>
            
            <motion.div 
              className="text-center lg:text-left text-white"
              variants={itemVariants}
              initial="hidden"
              animate="visible"
              transition={{ delay: 0.4 }}
            >
              <h1 className="text-5xl font-bold mb-4">
                {student.name || student.profile.name}
              </h1>
              <p className="text-xl mb-6 opacity-90">
                {student.branch_field} • {student.university}
              </p>
              {student.profile.bio && (
                <p className="text-lg max-w-2xl leading-relaxed opacity-80">
                  {student.profile.bio}
                </p>
              )}
              
              <div className="flex flex-wrap justify-center lg:justify-start gap-4 mt-8">
                {displayPreferences.showSocialLinks && (
                  <>
                    {student.github_link && (
                      <a href={student.github_link} className="p-3 bg-white bg-opacity-20 rounded-full hover:bg-opacity-30 transition-all">
                        <Github className="w-6 h-6" />
                      </a>
                    )}
                    {student.linkedin_link && (
                      <a href={student.linkedin_link} className="p-3 bg-white bg-opacity-20 rounded-full hover:bg-opacity-30 transition-all">
                        <Linkedin className="w-6 h-6" />
                      </a>
                    )}
                    {student.twitter_link && (
                      <a href={student.twitter_link} className="p-3 bg-white bg-opacity-20 rounded-full hover:bg-opacity-30 transition-all">
                        <Twitter className="w-6 h-6" />
                      </a>
                    )}
                  </>
                )}
                <a href={`mailto:${student.email}`} className="p-3 bg-white bg-opacity-20 rounded-full hover:bg-opacity-30 transition-all">
                  <Mail className="w-6 h-6" />
                </a>
              </div>
            </motion.div>
          </div>
        </div>
      </motion.section>

      {/* Contact Info */}
      <motion.section 
        className="py-12 bg-white shadow-sm"
        variants={containerVariants}
        initial="hidden"
        animate="visible"
      >
        <div className="container mx-auto px-6">
          <div className="grid md:grid-cols-3 gap-6">
            <motion.div variants={itemVariants} className="flex items-center space-x-3">
              <Phone className="w-5 h-5" style={{ color: primaryColor }} />
              <span>{student.contact_number}</span>
            </motion.div>
            <motion.div variants={itemVariants} className="flex items-center space-x-3">
              <Mail className="w-5 h-5" style={{ color: primaryColor }} />
              <span>{student.email}</span>
            </motion.div>
            <motion.div variants={itemVariants} className="flex items-center space-x-3">
              <MapPin className="w-5 h-5" style={{ color: primaryColor }} />
              <span>{student.district_name}</span>
            </motion.div>
          </div>
        </div>
      </motion.section>

      {/* Skills Section */}
      {displayPreferences.showSkillBars && student.profile.technicalSkills && student.profile.technicalSkills.length > 0 && (
        <motion.section 
          className="py-16"
          variants={containerVariants}
          initial="hidden"
          animate="visible"
        >
          <div className="container mx-auto px-6">
            <motion.h2 
              variants={itemVariants}
              className="text-3xl font-bold text-center mb-12"
              style={{ color: secondaryColor }}
            >
              Technical Skills
            </motion.h2>
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
              {student.profile.technicalSkills.map((skill, index) => (
                <motion.div
                  key={index}
                  variants={itemVariants}
                  className="bg-white rounded-lg p-6 shadow-lg hover:shadow-xl transition-shadow"
                >
                  <div className="flex items-center justify-between mb-3">
                    <h3 className="font-semibold text-gray-800">{skill.name}</h3>
                    <span className="text-sm text-gray-600">{skill.level}/10</span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <motion.div
                      className="h-2 rounded-full"
                      style={{ backgroundColor: accentColor }}
                      initial={{ width: 0 }}
                      animate={{ width: `${(skill.level / 10) * 100}%` }}
                      transition={{ duration: 1, delay: index * 0.1 }}
                    />
                  </div>
                  <p className="text-xs text-gray-500 mt-2">{skill.category}</p>
                </motion.div>
              ))}
            </div>
          </div>
        </motion.section>
      )}

      {/* Projects Section */}
      {student.profile.projects && student.profile.projects.length > 0 && (
        <motion.section 
          className="py-16 bg-gray-50"
          variants={containerVariants}
          initial="hidden"
          animate="visible"
        >
          <div className="container mx-auto px-6">
            <motion.h2 
              variants={itemVariants}
              className="text-3xl font-bold text-center mb-12"
              style={{ color: secondaryColor }}
            >
              Featured Projects
            </motion.h2>
            <div className="grid md:grid-cols-2 gap-8">
              {student.profile.projects.map((project) => (
                <motion.div
                  key={project.id}
                  variants={itemVariants}
                  className="bg-white rounded-xl overflow-hidden shadow-lg hover:shadow-xl transition-all duration-300"
                >
                  {displayPreferences.showProjectImages && project.image && (
                    <img
                      src={project.image}
                      alt={project.title}
                      className="w-full h-48 object-cover"
                    />
                  )}
                  <div className="p-6">
                    <h3 className="text-xl font-bold mb-3" style={{ color: secondaryColor }}>
                      {project.title}
                    </h3>
                    <p className="text-gray-600 mb-4">{project.description}</p>
                    <div className="flex flex-wrap gap-2 mb-4">
                      {project.technologies.map((tech, techIndex) => (
                        <span
                          key={techIndex}
                          className="px-3 py-1 text-sm rounded-full text-white"
                          style={{ backgroundColor: accentColor }}
                        >
                          {tech}
                        </span>
                      ))}
                    </div>
                    <div className="flex space-x-4">
                      {project.github_url && (
                        <a
                          href={project.github_url}
                          className="flex items-center space-x-2 text-gray-600 hover:text-gray-800"
                        >
                          <Github className="w-4 h-4" />
                          <span>Code</span>
                        </a>
                      )}
                      {project.live_url && (
                        <a
                          href={project.live_url}
                          className="flex items-center space-x-2 text-gray-600 hover:text-gray-800"
                        >
                          <Code className="w-4 h-4" />
                          <span>Live Demo</span>
                        </a>
                      )}
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>
          </div>
        </motion.section>
      )}

      {/* Experience Section */}
      {student.profile.experience && student.profile.experience.length > 0 && (
        <motion.section 
          className="py-16"
          variants={containerVariants}
          initial="hidden"
          animate="visible"
        >
          <div className="container mx-auto px-6">
            <motion.h2 
              variants={itemVariants}
              className="text-3xl font-bold text-center mb-12"
              style={{ color: secondaryColor }}
            >
              Experience
            </motion.h2>
            <div className="max-w-4xl mx-auto">
              {student.profile.experience.map((exp) => (
                <motion.div
                  key={exp.id}
                  variants={itemVariants}
                  className="bg-white rounded-lg p-6 shadow-lg mb-6 hover:shadow-xl transition-shadow"
                >
                  <div className="flex items-start space-x-4">
                    <div className="p-3 rounded-full" style={{ backgroundColor: `${accentColor}20` }}>
                      <Briefcase className="w-6 h-6" style={{ color: accentColor }} />
                    </div>
                    <div className="flex-1">
                      <h3 className="text-xl font-bold" style={{ color: secondaryColor }}>
                        {exp.position}
                      </h3>
                      <p className="text-gray-600 mb-2">{exp.company}</p>
                      <div className="flex items-center space-x-2 text-sm text-gray-500 mb-3">
                        <Calendar className="w-4 h-4" />
                        <span>{exp.startDate} - {exp.endDate || 'Present'}</span>
                      </div>
                      <p className="text-gray-700 mb-3">{exp.description}</p>
                      {exp.technologies && (
                        <div className="flex flex-wrap gap-2">
                          {exp.technologies.map((tech, techIndex) => (
                            <span
                              key={techIndex}
                              className="px-2 py-1 text-xs rounded text-gray-600 bg-gray-100"
                            >
                              {tech}
                            </span>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>
          </div>
        </motion.section>
      )}

      {/* Education Section */}
      {student.profile.education && student.profile.education.length > 0 && (
        <motion.section 
          className="py-16 bg-gray-50"
          variants={containerVariants}
          initial="hidden"
          animate="visible"
        >
          <div className="container mx-auto px-6">
            <motion.h2 
              variants={itemVariants}
              className="text-3xl font-bold text-center mb-12"
              style={{ color: secondaryColor }}
            >
              Education
            </motion.h2>
            <div className="max-w-4xl mx-auto">
              {student.profile.education.map((edu) => (
                <motion.div
                  key={edu.id}
                  variants={itemVariants}
                  className="bg-white rounded-lg p-6 shadow-lg mb-6"
                >
                  <h3 className="text-xl font-bold mb-2" style={{ color: secondaryColor }}>
                    {edu.degree} in {edu.field}
                  </h3>
                  <p className="text-gray-600 mb-2">{edu.institution}</p>
                  <div className="flex items-center space-x-4 text-sm text-gray-500 mb-3">
                    <div className="flex items-center space-x-1">
                      <Calendar className="w-4 h-4" />
                      <span>{edu.startDate} - {edu.endDate || 'Present'}</span>
                    </div>
                    {edu.grade && (
                      <div className="flex items-center space-x-1">
                        <Award className="w-4 h-4" />
                        <span>{edu.grade}</span>
                      </div>
                    )}
                  </div>
                  {edu.description && (
                    <p className="text-gray-700">{edu.description}</p>
                  )}
                </motion.div>
              ))}
            </div>
          </div>
        </motion.section>
      )}
    </div>
  );
};

export default ModernLayout;