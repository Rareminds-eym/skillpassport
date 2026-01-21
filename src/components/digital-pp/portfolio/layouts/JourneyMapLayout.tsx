import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  GraduationCap,
  Briefcase,
  Award,
  Code,
  Trophy,
  MapPin,
  Calendar,
  Github,
  ExternalLink,
  ChevronRight,
  BookOpen,
} from 'lucide-react';
import { usePortfolio } from '../../../../context/PortfolioContext';
import type { Student, AnimationType, DisplayPreferences } from '../../../../types/student';

interface JourneyMapLayoutProps {
  student?: Student;
  primaryColor?: string;
  secondaryColor?: string;
  accentColor?: string;
  animation?: AnimationType;
  displayPreferences?: DisplayPreferences;
}

const JourneyMapLayout: React.FC<JourneyMapLayoutProps> = (props) => {
  const { student: contextStudent } = usePortfolio();
  const student = props.student || contextStudent;
  const displayPreferences = props.displayPreferences || {
    showSocialLinks: true,
    showSkillBars: true,
    showProjectImages: true,
    enableAnimations: true,
    showContactForm: true,
    showDownloadResume: true,
  };
  const [selectedMilestone, setSelectedMilestone] = useState<any | null>(null);
  const [activeTab, setActiveTab] = useState<
    'education' | 'experience' | 'projects' | 'certifications' | 'achievements'
  >('education');

  if (!student) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-indigo-50 via-purple-50 to-pink-50 data-layout-container">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
      </div>
    );
  }

  // Create comprehensive milestone data
  const educationMilestones = (student.profile.education || []).map((edu, index) => ({
    id: `edu-${index}`,
    type: 'education' as const,
    icon: GraduationCap,
    title: edu.degree,
    subtitle: edu.institution,
    date: `${edu.startDate} - ${edu.endDate || 'Present'}`,
    description: `${edu.field} - ${edu.grade || 'In Progress'}`,
    details: edu,
    color: 'from-blue-500 to-indigo-600',
    bgColor: 'bg-blue-50',
    borderColor: 'border-blue-500',
    year: new Date(edu.startDate).getFullYear(),
  }));

  const experienceMilestones = (student.profile.experience || []).map((exp, index) => ({
    id: `exp-${index}`,
    type: 'experience' as const,
    icon: Briefcase,
    title: exp.position,
    subtitle: exp.company,
    date: `${exp.startDate} - ${exp.endDate || 'Present'}`,
    description: exp.description,
    details: exp,
    color: 'from-green-500 to-emerald-600',
    bgColor: 'bg-green-50',
    borderColor: 'border-green-500',
    year: new Date(exp.startDate).getFullYear(),
  }));

  const projectMilestones = (student.profile.projects || []).map((proj, index) => ({
    id: `proj-${index}`,
    type: 'project' as const,
    icon: Code,
    title: proj.title,
    subtitle: proj.technologies.join(', '),
    date: `${proj.startDate || ''} - ${proj.endDate || 'Recent'}`,
    description: proj.description,
    details: proj,
    color: 'from-purple-500 to-violet-600',
    bgColor: 'bg-purple-50',
    borderColor: 'border-purple-500',
    year: proj.startDate ? new Date(proj.startDate).getFullYear() : new Date().getFullYear(),
  }));

  const certificationMilestones = (student.profile.certifications || []).map((cert, index) => ({
    id: `cert-${index}`,
    type: 'certification' as const,
    icon: Award,
    title: cert.name,
    subtitle: cert.issuer,
    date: cert.date,
    description: `Certification obtained from ${cert.issuer}`,
    details: cert,
    color: 'from-orange-500 to-red-600',
    bgColor: 'bg-orange-50',
    borderColor: 'border-orange-500',
    year: new Date(cert.date).getFullYear(),
  }));

  const achievementMilestones = (student.profile.achievements || []).map((achievement, index) => ({
    id: `ach-${index}`,
    type: 'achievement' as const,
    icon: Trophy,
    title: achievement.title,
    subtitle: achievement.category || 'Achievement',
    date: achievement.date,
    description: achievement.description,
    details: achievement,
    color: 'from-yellow-500 to-amber-600',
    bgColor: 'bg-yellow-50',
    borderColor: 'border-yellow-500',
    year: new Date(achievement.date).getFullYear(),
  }));

  const getMilestonesByTab = () => {
    switch (activeTab) {
      case 'education':
        return educationMilestones;
      case 'experience':
        return experienceMilestones;
      case 'projects':
        return projectMilestones;
      case 'certifications':
        return certificationMilestones;
      case 'achievements':
        return achievementMilestones;
      default:
        return educationMilestones;
    }
  };

  const currentMilestones = getMilestonesByTab();

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-purple-50 to-pink-50">
      {/* Profile Header Section */}
      <div className="bg-white shadow-lg border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-6 py-8">
          <div className="flex flex-col md:flex-row items-center md:items-start gap-8">
            {/* Profile Image */}
            <motion.div
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.5 }}
              className="relative"
            >
              <div className="w-32 h-32 rounded-full overflow-hidden ring-4 ring-indigo-500 ring-offset-4 shadow-xl">
                <img
                  src={
                    student.profile.profileImage ||
                    `https://ui-avatars.com/api/?name=${encodeURIComponent(student.name || 'Student')}&size=200&background=6366f1&color=fff&bold=true`
                  }
                  alt={student.name || 'Student'}
                  className="w-full h-full object-cover"
                />
              </div>
              {/* <div className="absolute -bottom-2 -right-2 bg-green-500 w-8 h-8 rounded-full border-4 border-white flex items-center justify-center">
                <MapPin className="w-4 h-4 text-white" />
              </div> */}
            </motion.div>

            {/* Profile Details */}
            <div className="flex-1 text-center md:text-left">
              <motion.h1
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.2 }}
                className="text-4xl font-bold text-gray-900 mb-2"
              >
                {student.name || student.profile.name || 'Student'}
              </motion.h1>

              <motion.p
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.3 }}
                className="text-xl text-indigo-600 font-medium mb-4"
              >
                {student.branch_field || 'Student'}
              </motion.p>

              <motion.p
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.4 }}
                className="text-gray-600 mb-6 max-w-2xl"
              >
                {student.profile.bio || 'Passionate about learning and growth'}
              </motion.p>

              {/* Contact Info */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.5 }}
                className="flex flex-wrap gap-4 justify-center md:justify-start"
              >
                {student.email && (
                  <span className="flex items-center gap-2 text-gray-600 bg-gray-100 px-4 py-2 rounded-full">
                    <span className="text-sm">{student.email}</span>
                  </span>
                )}
                {student.contact_number && (
                  <span className="flex items-center gap-2 text-gray-600 bg-gray-100 px-4 py-2 rounded-full">
                    <span className="text-sm">{student.contact_number}</span>
                  </span>
                )}
                {(student.school?.name ||
                  // @ts-expect-error - Auto-suppressed for migration
                  student.profile?.school?.name ||
                  student.college_school_name ||
                  student.university ||
                  // @ts-expect-error - Auto-suppressed for migration
                  student.universityCollege?.name ||
                  // @ts-expect-error - Auto-suppressed for migration
                  student.profile?.universityCollege?.name) && (
                  <span className="flex items-center gap-2 text-gray-600 bg-gray-100 px-4 py-2 rounded-full">
                    <GraduationCap className="w-4 h-4" />
                    <span className="text-sm">
                      {student.school?.name ||
                        // @ts-expect-error - Auto-suppressed for migration
                        student.profile?.school?.name ||
                        student.college_school_name ||
                        // @ts-expect-error - Auto-suppressed for migration
                        student.universityCollege?.name ||
                        // @ts-expect-error - Auto-suppressed for migration
                        student.profile?.universityCollege?.name ||
                        student.university}
                    </span>
                  </span>
                )}
              </motion.div>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-6 py-12">
        {/* Journey Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center mb-8"
        >
          <h2 className="text-4xl font-bold text-gray-900 mb-3">My Professional Journey</h2>
          <p className="text-lg text-gray-600">
            Navigate through my career milestones and achievements
          </p>
        </motion.div>

        {/* Journey Navigation Tabs */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-12"
        >
          <div className="flex flex-wrap gap-3 justify-center">
            <button
              onClick={() => setActiveTab('education')}
              className={`flex items-center gap-2 px-6 py-3 rounded-full font-medium transition-all duration-300 ${
                activeTab === 'education'
                  ? 'bg-gradient-to-r from-blue-500 to-indigo-600 text-white shadow-lg scale-105'
                  : 'bg-white text-gray-700 hover:bg-gray-50 shadow-md'
              }`}
            >
              <GraduationCap className="w-5 h-5" />
              <span>Education</span>
              <span
                className={`text-xs px-2 py-0.5 rounded-full ${
                  activeTab === 'education' ? 'bg-white/20' : 'bg-gray-200'
                }`}
              >
                {educationMilestones.length}
              </span>
            </button>

            <button
              onClick={() => setActiveTab('experience')}
              className={`flex items-center gap-2 px-6 py-3 rounded-full font-medium transition-all duration-300 ${
                activeTab === 'experience'
                  ? 'bg-gradient-to-r from-green-500 to-emerald-600 text-white shadow-lg scale-105'
                  : 'bg-white text-gray-700 hover:bg-gray-50 shadow-md'
              }`}
            >
              <Briefcase className="w-5 h-5" />
              <span>Experience</span>
              <span
                className={`text-xs px-2 py-0.5 rounded-full ${
                  activeTab === 'experience' ? 'bg-white/20' : 'bg-gray-200'
                }`}
              >
                {experienceMilestones.length}
              </span>
            </button>

            {displayPreferences.showProjectImages && (
              <button
                onClick={() => setActiveTab('projects')}
                className={`flex items-center gap-2 px-6 py-3 rounded-full font-medium transition-all duration-300 ${
                  activeTab === 'projects'
                    ? 'bg-gradient-to-r from-purple-500 to-violet-600 text-white shadow-lg scale-105'
                    : 'bg-white text-gray-700 hover:bg-gray-50 shadow-md'
                }`}
              >
                <Code className="w-5 h-5" />
                <span>Projects</span>
                <span
                  className={`text-xs px-2 py-0.5 rounded-full ${
                    activeTab === 'projects' ? 'bg-white/20' : 'bg-gray-200'
                  }`}
                >
                  {projectMilestones.length}
                </span>
              </button>
            )}

            <button
              onClick={() => setActiveTab('certifications')}
              className={`flex items-center gap-2 px-6 py-3 rounded-full font-medium transition-all duration-300 ${
                activeTab === 'certifications'
                  ? 'bg-gradient-to-r from-orange-500 to-red-600 text-white shadow-lg scale-105'
                  : 'bg-white text-gray-700 hover:bg-gray-50 shadow-md'
              }`}
            >
              <Award className="w-5 h-5" />
              <span>Certifications</span>
              <span
                className={`text-xs px-2 py-0.5 rounded-full ${
                  activeTab === 'certifications' ? 'bg-white/20' : 'bg-gray-200'
                }`}
              >
                {certificationMilestones.length}
              </span>
            </button>

            <button
              onClick={() => setActiveTab('achievements')}
              className={`flex items-center gap-2 px-6 py-3 rounded-full font-medium transition-all duration-300 ${
                activeTab === 'achievements'
                  ? 'bg-gradient-to-r from-yellow-500 to-amber-600 text-white shadow-lg scale-105'
                  : 'bg-white text-gray-700 hover:bg-gray-50 shadow-md'
              }`}
            >
              <Trophy className="w-5 h-5" />
              <span>Achievements</span>
              <span
                className={`text-xs px-2 py-0.5 rounded-full ${
                  activeTab === 'achievements' ? 'bg-white/20' : 'bg-gray-200'
                }`}
              >
                {achievementMilestones.length}
              </span>
            </button>
          </div>
        </motion.div>

        {/* Journey Timeline */}
        <AnimatePresence mode="wait">
          <motion.div
            key={activeTab}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            transition={{ duration: 0.3 }}
            className="relative"
          >
            {currentMilestones.length === 0 ? (
              <div className="bg-white rounded-2xl shadow-lg p-12 text-center">
                <BookOpen className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                <h3 className="text-xl font-semibold text-gray-900 mb-2">No {activeTab} yet</h3>
                <p className="text-gray-600">Start your journey by adding some {activeTab}!</p>
              </div>
            ) : (
              <div className="space-y-8">
                {/* Timeline */}
                <div className="relative">
                  {/* Vertical Line */}
                  <div className="absolute left-8 md:left-1/2 top-0 bottom-0 w-1 bg-gradient-to-b from-indigo-200 via-purple-200 to-pink-200"></div>

                  {currentMilestones.map((milestone, index) => {
                    const Icon = milestone.icon;
                    const isLeft = index % 2 === 0;

                    return (
                      <motion.div
                        key={milestone.id}
                        initial={{ opacity: 0, x: isLeft ? -50 : 50 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: index * 0.1 }}
                        className={`relative flex items-center mb-12 ${
                          isLeft ? 'md:flex-row' : 'md:flex-row-reverse'
                        } flex-row`}
                      >
                        {/* Year Badge (Desktop) */}
                        <div
                          className={`hidden md:block ${isLeft ? 'md:w-1/2 md:pr-12 md:text-right' : 'md:w-1/2 md:pl-12 md:text-left'}`}
                        >
                          <motion.div whileHover={{ scale: 1.05 }} className="inline-block">
                            <div
                              className={`inline-flex items-center gap-2 bg-gradient-to-r ${milestone.color} text-white px-4 py-2 rounded-full shadow-lg`}
                            >
                              <Calendar className="w-4 h-4" />
                              <span className="font-bold">{milestone.year}</span>
                            </div>
                          </motion.div>
                        </div>

                        {/* Icon */}
                        <div className="absolute left-8 md:left-1/2 transform md:-translate-x-1/2 z-10">
                          <motion.div
                            whileHover={{ scale: 1.2, rotate: 360 }}
                            transition={{ duration: 0.5 }}
                            className={`w-16 h-16 rounded-full bg-gradient-to-r ${milestone.color} flex items-center justify-center shadow-xl border-4 border-white`}
                          >
                            <Icon className="w-8 h-8 text-white" />
                          </motion.div>
                        </div>

                        {/* Content Card */}
                        <div className={`w-full md:w-1/2 ml-24 md:ml-0 ${isLeft ? '' : 'md:ml-0'}`}>
                          <motion.div
                            whileHover={{ scale: 1.02, y: -4 }}
                            className={`bg-white rounded-2xl shadow-lg hover:shadow-2xl transition-all duration-300 p-6 border-l-4 ${milestone.borderColor} ${milestone.bgColor} cursor-pointer`}
                            onClick={() =>
                              setSelectedMilestone(
                                selectedMilestone?.id === milestone.id ? null : milestone
                              )
                            }
                          >
                            {/* Mobile Year Badge */}
                            <div className="md:hidden mb-3">
                              <div
                                className={`inline-flex items-center gap-2 bg-gradient-to-r ${milestone.color} text-white px-3 py-1 rounded-full shadow-md text-sm`}
                              >
                                <Calendar className="w-3 h-3" />
                                <span className="font-bold">{milestone.year}</span>
                              </div>
                            </div>

                            <h3 className="text-xl font-bold text-gray-900 mb-2">
                              {milestone.title}
                            </h3>
                            <p className="text-indigo-600 font-medium mb-3">{milestone.subtitle}</p>

                            {milestone.date && (
                              <div className="flex items-center gap-2 text-sm text-gray-600 mb-3">
                                <Calendar className="w-4 h-4" />
                                <span>{milestone.date}</span>
                              </div>
                            )}

                            <p className="text-gray-700 mb-3">{milestone.description}</p>

                            {/* Show more details on click */}
                            {selectedMilestone?.id === milestone.id && (
                              <motion.div
                                initial={{ opacity: 0, height: 0 }}
                                animate={{ opacity: 1, height: 'auto' }}
                                exit={{ opacity: 0, height: 0 }}
                                className="mt-4 pt-4 border-t border-gray-200"
                              >
                                {milestone.type === 'project' &&
                                  'technologies' in milestone.details &&
                                  milestone.details.technologies && (
                                    <div className="mb-3">
                                      <p className="text-sm font-semibold text-gray-700 mb-2">
                                        Technologies:
                                      </p>
                                      <div className="flex flex-wrap gap-2">
                                        {milestone.details.technologies.map(
                                          (tech: string, idx: number) => (
                                            <span
                                              key={idx}
                                              className="px-3 py-1 bg-purple-100 text-purple-700 rounded-full text-xs"
                                            >
                                              {tech}
                                            </span>
                                          )
                                        )}
                                      </div>
                                    </div>
                                  )}

                                {milestone.type === 'project' &&
                                  'github_url' in milestone.details &&
                                  milestone.details.github_url && (
                                    <a
                                      href={milestone.details.github_url}
                                      target="_blank"
                                      rel="noopener noreferrer"
                                      className="inline-flex items-center gap-2 text-indigo-600 hover:text-indigo-800 text-sm font-medium mt-2"
                                    >
                                      <Github className="w-4 h-4" />
                                      <span>View on GitHub</span>
                                      <ExternalLink className="w-3 h-3" />
                                    </a>
                                  )}

                                {milestone.type === 'project' &&
                                  'live_url' in milestone.details &&
                                  milestone.details.live_url && (
                                    <a
                                      href={milestone.details.live_url}
                                      target="_blank"
                                      rel="noopener noreferrer"
                                      className="inline-flex items-center gap-2 text-indigo-600 hover:text-indigo-800 text-sm font-medium mt-2 ml-4"
                                    >
                                      <ExternalLink className="w-4 h-4" />
                                      <span>Live Demo</span>
                                    </a>
                                  )}
                              </motion.div>
                            )}

                            <div className="flex items-center gap-2 text-indigo-600 mt-4 font-medium text-sm">
                              <span>
                                {selectedMilestone?.id === milestone.id
                                  ? 'Hide Details'
                                  : 'View Details'}
                              </span>
                              <ChevronRight
                                className={`w-4 h-4 transition-transform ${selectedMilestone?.id === milestone.id ? 'rotate-90' : ''}`}
                              />
                            </div>
                          </motion.div>
                        </div>
                      </motion.div>
                    );
                  })}
                </div>
              </div>
            )}
          </motion.div>
        </AnimatePresence>
      </div>
    </div>
  );
};

export default JourneyMapLayout;
