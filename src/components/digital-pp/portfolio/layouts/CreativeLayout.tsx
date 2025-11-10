import React from 'react';
import { motion } from 'framer-motion';
import { Github, Linkedin, Twitter, Mail, Phone, MapPin, Calendar, Code, Briefcase, Star, Zap } from 'lucide-react';
import { Student, AnimationType } from '../../../../types/student';

interface CreativeLayoutProps {
  student: Student;
  primaryColor: string;
  secondaryColor: string;
  accentColor: string;
  animation: AnimationType;
}

const CreativeLayout: React.FC<CreativeLayoutProps> = ({ 
  student, 
  primaryColor, 
  secondaryColor, 
  accentColor
}) => {

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

  const cardVariants = {
    hidden: { opacity: 0, scale: 0.8, rotate: -5 },
    visible: { opacity: 1, scale: 1, rotate: 0 }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 via-pink-50 to-yellow-50">
      {/* Floating Background Elements */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <motion.div
          className="absolute top-20 left-10 w-20 h-20 rounded-full opacity-20"
          style={{ backgroundColor: primaryColor }}
          animate={{ y: [0, -20, 0], rotate: [0, 180, 360] }}
          transition={{ duration: 6, repeat: Infinity, ease: "easeInOut" }}
        />
        <motion.div
          className="absolute top-40 right-20 w-16 h-16 rounded-full opacity-20"
          style={{ backgroundColor: accentColor }}
          animate={{ y: [0, 20, 0], rotate: [0, -180, -360] }}
          transition={{ duration: 8, repeat: Infinity, ease: "easeInOut" }}
        />
        <motion.div
          className="absolute bottom-20 left-1/4 w-12 h-12 rounded-full opacity-20"
          style={{ backgroundColor: secondaryColor }}
          animate={{ y: [0, -15, 0], x: [0, 10, 0] }}
          transition={{ duration: 5, repeat: Infinity, ease: "easeInOut" }}
        />
      </div>

      {/* Hero Section - Creative Style */}
      <motion.section 
        className="relative min-h-screen flex items-center justify-center overflow-hidden"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 1 }}
      >
        <div className="container mx-auto px-6 py-20">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            <motion.div
              className="text-center lg:text-left"
              variants={containerVariants}
              initial="hidden"
              animate="visible"
            >
              <motion.div
                variants={itemVariants}
                className="inline-block mb-6"
              >
                <span 
                  className="px-4 py-2 rounded-full text-sm font-medium text-white"
                  style={{ backgroundColor: accentColor }}
                >
                  ✨ Creative Developer
                </span>
              </motion.div>
              
              <motion.h1 
                variants={itemVariants}
                className="text-6xl lg:text-7xl font-bold mb-6 leading-tight"
              >
                <span className="text-gray-900">Hi, I'm </span>
                <span 
                  className="bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent"
                >
                  {student.name?.split(' ')[0] || student.profile.name?.split(' ')[0]}
                </span>
              </motion.h1>
              
              <motion.p 
                variants={itemVariants}
                className="text-xl text-gray-600 mb-8 leading-relaxed"
              >
                {student.profile.bio || `${student.branch_field} student passionate about creating amazing digital experiences.`}
              </motion.p>
              
              <motion.div 
                variants={itemVariants}
                className="flex flex-wrap gap-4 justify-center lg:justify-start mb-8"
              >
                {student.github_link && (
                  <motion.a 
                    href={student.github_link}
                    whileHover={{ scale: 1.05, rotate: 5 }}
                    whileTap={{ scale: 0.95 }}
                    className="p-4 bg-white rounded-2xl shadow-lg hover:shadow-xl transition-all"
                  >
                    <Github className="w-6 h-6 text-gray-700" />
                  </motion.a>
                )}
                {student.linkedin_link && (
                  <motion.a 
                    href={student.linkedin_link}
                    whileHover={{ scale: 1.05, rotate: -5 }}
                    whileTap={{ scale: 0.95 }}
                    className="p-4 bg-white rounded-2xl shadow-lg hover:shadow-xl transition-all"
                  >
                    <Linkedin className="w-6 h-6 text-blue-600" />
                  </motion.a>
                )}
                {student.twitter_link && (
                  <motion.a 
                    href={student.twitter_link}
                    whileHover={{ scale: 1.05, rotate: 5 }}
                    whileTap={{ scale: 0.95 }}
                    className="p-4 bg-white rounded-2xl shadow-lg hover:shadow-xl transition-all"
                  >
                    <Twitter className="w-6 h-6 text-blue-400" />
                  </motion.a>
                )}
                <motion.a 
                  href={`mailto:${student.email}`}
                  whileHover={{ scale: 1.05, rotate: -5 }}
                  whileTap={{ scale: 0.95 }}
                  className="p-4 bg-white rounded-2xl shadow-lg hover:shadow-xl transition-all"
                >
                  <Mail className="w-6 h-6 text-red-500" />
                </motion.a>
              </motion.div>

              <motion.div 
                variants={itemVariants}
                className="flex flex-wrap gap-6 text-sm text-gray-600"
              >
                <div className="flex items-center space-x-2">
                  <Phone className="w-4 h-4" />
                  <span>{student.contact_number}</span>
                </div>
                <div className="flex items-center space-x-2">
                  <MapPin className="w-4 h-4" />
                  <span>{student.district_name}</span>
                </div>
              </motion.div>
            </motion.div>

            <motion.div
              className="relative"
              initial={{ opacity: 0, scale: 0.8, rotate: -10 }}
              animate={{ opacity: 1, scale: 1, rotate: 0 }}
              transition={{ duration: 0.8, delay: 0.3 }}
            >
              <div className="relative">
                <motion.div
                  className="absolute -inset-4 rounded-3xl opacity-20"
                  style={{ backgroundColor: primaryColor }}
                  animate={{ rotate: [0, 5, -5, 0] }}
                  transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
                />
                <img
                  src={student.profile.profileImage || '/api/placeholder/400/400'}
                  alt={student.name || 'Profile'}
                  className="relative w-80 h-80 rounded-3xl object-cover shadow-2xl mx-auto"
                />
                <motion.div
                  className="absolute -bottom-4 -right-4 p-4 bg-white rounded-2xl shadow-lg"
                  animate={{ y: [0, -10, 0] }}
                  transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
                >
                  <Zap className="w-8 h-8" style={{ color: accentColor }} />
                </motion.div>
              </div>
            </motion.div>
          </div>
        </div>
      </motion.section>

      {/* Skills Section - Creative Cards */}
      {student.profile.technicalSkills && student.profile.technicalSkills.length > 0 && (
        <motion.section 
          className="py-20 relative"
          variants={containerVariants}
          initial="hidden"
          animate="visible"
        >
          <div className="container mx-auto px-6">
            <motion.div variants={itemVariants} className="text-center mb-16">
              <h2 className="text-4xl font-bold mb-4" style={{ color: secondaryColor }}>
                My Superpowers
              </h2>
              <p className="text-gray-600 text-lg">Technologies I love working with</p>
            </motion.div>
            
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
              {student.profile.technicalSkills.map((skill, index) => (
                <motion.div
                  key={index}
                  variants={cardVariants}
                  whileHover={{ 
                    scale: 1.05, 
                    rotate: Math.random() > 0.5 ? 2 : -2,
                    y: -10 
                  }}
                  className="relative group"
                >
                  <div className="bg-white rounded-3xl p-8 shadow-lg hover:shadow-2xl transition-all duration-300 border-2 border-transparent hover:border-opacity-20"
                       style={{ borderColor: accentColor }}>
                    <div className="flex items-center justify-between mb-4">
                      <h3 className="text-xl font-bold text-gray-800">{skill.name}</h3>
                      <div className="flex">
                        {[...Array(5)].map((_, i) => (
                          <Star
                            key={i}
                            className={`w-4 h-4 ${i < Math.floor(skill.level / 2) ? 'text-yellow-400 fill-current' : 'text-gray-300'}`}
                          />
                        ))}
                      </div>
                    </div>
                    <div className="relative">
                      <div className="w-full bg-gray-200 rounded-full h-3 mb-2">
                        <motion.div
                          className="h-3 rounded-full"
                          style={{ backgroundColor: accentColor }}
                          initial={{ width: 0 }}
                          animate={{ width: `${(skill.level / 10) * 100}%` }}
                          transition={{ duration: 1.5, delay: index * 0.1 }}
                        />
                      </div>
                      <p className="text-sm text-gray-500">{skill.category}</p>
                    </div>
                    <motion.div
                      className="absolute -top-2 -right-2 w-6 h-6 rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
                      style={{ backgroundColor: primaryColor }}
                      animate={{ rotate: 360 }}
                      transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
                    />
                  </div>
                </motion.div>
              ))}
            </div>
          </div>
        </motion.section>
      )}

      {/* Projects Section - Creative Grid */}
      {student.profile.projects && student.profile.projects.length > 0 && (
        <motion.section 
          className="py-20 bg-white bg-opacity-50"
          variants={containerVariants}
          initial="hidden"
          animate="visible"
        >
          <div className="container mx-auto px-6">
            <motion.div variants={itemVariants} className="text-center mb-16">
              <h2 className="text-4xl font-bold mb-4" style={{ color: secondaryColor }}>
                Creative Projects
              </h2>
              <p className="text-gray-600 text-lg">Things I've built with passion</p>
            </motion.div>
            
            <div className="grid md:grid-cols-2 gap-12">
              {student.profile.projects.map((project) => (
                <motion.div
                  key={project.id}
                  variants={cardVariants}
                  whileHover={{ scale: 1.02, y: -10 }}
                  className="group"
                >
                  <div className="bg-white rounded-3xl overflow-hidden shadow-xl hover:shadow-2xl transition-all duration-500">
                    {project.image && (
                      <div className="relative overflow-hidden">
                        <img
                          src={project.image}
                          alt={project.title}
                          className="w-full h-64 object-cover group-hover:scale-110 transition-transform duration-500"
                        />
                        <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                      </div>
                    )}
                    <div className="p-8">
                      <h3 className="text-2xl font-bold mb-4" style={{ color: secondaryColor }}>
                        {project.title}
                      </h3>
                      <p className="text-gray-600 mb-6 leading-relaxed">{project.description}</p>
                      
                      <div className="flex flex-wrap gap-2 mb-6">
                        {project.technologies.map((tech, techIndex) => (
                          <motion.span
                            key={techIndex}
                            whileHover={{ scale: 1.1 }}
                            className="px-3 py-1 text-sm rounded-full text-white font-medium"
                            style={{ backgroundColor: accentColor }}
                          >
                            {tech}
                          </motion.span>
                        ))}
                      </div>
                      
                      <div className="flex space-x-4">
                        {project.github_url && (
                          <motion.a
                            href={project.github_url}
                            whileHover={{ scale: 1.05 }}
                            whileTap={{ scale: 0.95 }}
                            className="flex items-center space-x-2 px-4 py-2 bg-gray-100 rounded-full hover:bg-gray-200 transition-colors"
                          >
                            <Github className="w-4 h-4" />
                            <span>Code</span>
                          </motion.a>
                        )}
                        {project.live_url && (
                          <motion.a
                            href={project.live_url}
                            whileHover={{ scale: 1.05 }}
                            whileTap={{ scale: 0.95 }}
                            className="flex items-center space-x-2 px-4 py-2 rounded-full text-white"
                            style={{ backgroundColor: primaryColor }}
                          >
                            <Code className="w-4 h-4" />
                            <span>Live Demo</span>
                          </motion.a>
                        )}
                      </div>
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>
          </div>
        </motion.section>
      )}

      {/* Experience Timeline - Creative */}
      {student.profile.experience && student.profile.experience.length > 0 && (
        <motion.section 
          className="py-20"
          variants={containerVariants}
          initial="hidden"
          animate="visible"
        >
          <div className="container mx-auto px-6">
            <motion.div variants={itemVariants} className="text-center mb-16">
              <h2 className="text-4xl font-bold mb-4" style={{ color: secondaryColor }}>
                My Journey
              </h2>
              <p className="text-gray-600 text-lg">Professional experiences that shaped me</p>
            </motion.div>
            
            <div className="max-w-4xl mx-auto">
              {student.profile.experience.map((exp, index) => (
                <motion.div
                  key={exp.id}
                  variants={itemVariants}
                  className="relative mb-12 last:mb-0"
                >
                  <div className="flex items-start space-x-8">
                    <motion.div
                      className="flex-shrink-0 w-16 h-16 rounded-2xl flex items-center justify-center shadow-lg"
                      style={{ backgroundColor: accentColor }}
                      whileHover={{ rotate: 360 }}
                      transition={{ duration: 0.5 }}
                    >
                      <Briefcase className="w-8 h-8 text-white" />
                    </motion.div>
                    
                    <motion.div
                      className="flex-1 bg-white rounded-3xl p-8 shadow-lg hover:shadow-xl transition-all duration-300"
                      whileHover={{ scale: 1.02, y: -5 }}
                    >
                      <h3 className="text-2xl font-bold mb-2" style={{ color: secondaryColor }}>
                        {exp.position}
                      </h3>
                      <p className="text-lg text-gray-600 mb-2">{exp.company}</p>
                      <div className="flex items-center space-x-2 text-sm text-gray-500 mb-4">
                        <Calendar className="w-4 h-4" />
                        <span>{exp.startDate} - {exp.endDate || 'Present'}</span>
                      </div>
                      <p className="text-gray-700 mb-4 leading-relaxed">{exp.description}</p>
                      {exp.technologies && (
                        <div className="flex flex-wrap gap-2">
                          {exp.technologies.map((tech, techIndex) => (
                            <span
                              key={techIndex}
                              className="px-3 py-1 text-xs rounded-full bg-gray-100 text-gray-600"
                            >
                              {tech}
                            </span>
                          ))}
                        </div>
                      )}
                    </motion.div>
                  </div>
                  
                  {index < student.profile.experience!.length - 1 && (
                    <div className="ml-8 mt-4 mb-8">
                      <div className="w-0.5 h-8 bg-gradient-to-b from-gray-300 to-transparent"></div>
                    </div>
                  )}
                </motion.div>
              ))}
            </div>
          </div>
        </motion.section>
      )}

      {/* Footer CTA */}
      <motion.section 
        className="py-20 text-center"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 1 }}
      >
        <div className="container mx-auto px-6">
          <motion.div
            className="bg-gradient-to-r from-purple-600 to-pink-600 rounded-3xl p-12 text-white"
            whileHover={{ scale: 1.02 }}
          >
            <h2 className="text-3xl font-bold mb-4">Let's Create Something Amazing Together!</h2>
            <p className="text-lg mb-8 opacity-90">Ready to bring your ideas to life?</p>
            <motion.a
              href={`mailto:${student.email}`}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              className="inline-flex items-center px-8 py-4 bg-white text-purple-600 rounded-full font-bold hover:bg-gray-100 transition-colors"
            >
              <Mail className="w-5 h-5 mr-2" />
              Get In Touch
            </motion.a>
          </motion.div>
        </div>
      </motion.section>
    </div>
  );
};

export default CreativeLayout;