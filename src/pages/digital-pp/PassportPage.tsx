import { AnimatePresence, motion } from 'framer-motion';
import {
  Award,
  Book,
  Briefcase,
  Camera,
  CheckCircle,
  ChevronLeft,
  ChevronRight,
  Code,
  Coffee,
  Dumbbell,
  Gamepad2,
  Globe,
  Mountain,
  Music,
  Palette,
  Plane,
  Shield,
  Star,
  Target,
  Users,
  XCircle,
} from 'lucide-react';
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { usePortfolio } from '../../context/PortfolioContext';

const PassportPage: React.FC = () => {
  const navigate = useNavigate();
  const { student, isLoading } = usePortfolio();
  const [currentPage, setCurrentPage] = useState(0);
  const [direction, setDirection] = useState(0);
  const [touchStart, setTouchStart] = useState<number | null>(null);
  const [touchEnd, setTouchEnd] = useState<number | null>(null);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [zoomLevel, setZoomLevel] = useState(1);

  // Function to get appropriate icon for hobby
  const getHobbyIcon = (hobby: string) => {
    const hobbyLower = hobby.toLowerCase();

    if (
      hobbyLower.includes('music') ||
      hobbyLower.includes('singing') ||
      hobbyLower.includes('guitar') ||
      hobbyLower.includes('piano')
    ) {
      return Music;
    } else if (hobbyLower.includes('photo') || hobbyLower.includes('camera')) {
      return Camera;
    } else if (
      hobbyLower.includes('paint') ||
      hobbyLower.includes('draw') ||
      hobbyLower.includes('art')
    ) {
      return Palette;
    } else if (hobbyLower.includes('game') || hobbyLower.includes('gaming')) {
      return Gamepad2;
    } else if (
      hobbyLower.includes('gym') ||
      hobbyLower.includes('fitness') ||
      hobbyLower.includes('workout') ||
      hobbyLower.includes('exercise')
    ) {
      return Dumbbell;
    } else if (hobbyLower.includes('travel') || hobbyLower.includes('trip')) {
      return Plane;
    } else if (
      hobbyLower.includes('coffee') ||
      hobbyLower.includes('cooking') ||
      hobbyLower.includes('baking')
    ) {
      return Coffee;
    } else if (
      hobbyLower.includes('hiking') ||
      hobbyLower.includes('climbing') ||
      hobbyLower.includes('outdoor')
    ) {
      return Mountain;
    } else if (
      hobbyLower.includes('social') ||
      hobbyLower.includes('friend') ||
      hobbyLower.includes('community')
    ) {
      return Users;
    } else if (hobbyLower.includes('read') || hobbyLower.includes('book')) {
      return Book;
    } else {
      return Star; // Default icon for other hobbies
    }
  };

  const minZoom = 0.7;
  const maxZoom = 1.3;
  const zoomStep = 0.1;

  // Minimum swipe distance (in px)
  const minSwipeDistance = 50;

  const toggleFullscreen = () => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen();
      setIsFullscreen(true);
    } else {
      document.exitFullscreen();
      setIsFullscreen(false);
    }
  };

  const zoomIn = () => {
    setZoomLevel((prev) => Math.min(prev + zoomStep, maxZoom));
  };

  const zoomOut = () => {
    setZoomLevel((prev) => Math.max(prev - zoomStep, minZoom));
  };

  const resetZoom = () => {
    setZoomLevel(1);
  };

  const onTouchStart = (e: React.TouchEvent) => {
    setTouchEnd(null);
    setTouchStart(e.targetTouches[0].clientX);
  };

  const onTouchMove = (e: React.TouchEvent) => {
    setTouchEnd(e.targetTouches[0].clientX);
  };

  const onTouchEnd = () => {
    if (!touchStart || !touchEnd) return;

    const distance = touchStart - touchEnd;
    const isLeftSwipe = distance > minSwipeDistance;
    const isRightSwipe = distance < -minSwipeDistance;

    if (isLeftSwipe) {
      nextPage();
    }
    if (isRightSwipe) {
      prevPage();
    }
  };

  const pages = [
    // Front Cover
    {
      id: 'cover',
      title: 'Front Cover',
      content: (
        <div className="h-full flex flex-col items-center justify-center bg-gradient-to-br from-blue-900 via-blue-800 to-indigo-900 text-white p-8 relative overflow-hidden">
          {/* Passport Pattern Background */}
          <div className="absolute inset-0 opacity-10">
            <div
              className="absolute inset-0"
              style={{
                backgroundImage: `repeating-linear-gradient(45deg, transparent, transparent 10px, rgba(255,255,255,0.1) 10px, rgba(255,255,255,0.1) 20px)`,
              }}
            />
          </div>

          <div className="relative z-10 text-center">
            {/* Company Logo */}
            <div className="mb-8">
              <div className="w-24 h-24 bg-white/20 backdrop-blur-xl rounded-full flex items-center justify-center mx-auto border-4 border-white/40 shadow-2xl p-2">
                <img
                  src="/RMLogo.webp"
                  alt="Rareminds Logo"
                  className="w-full h-full object-contain"
                />
              </div>
            </div>

            <h1 className="text-5xl font-bold mb-4 tracking-wider">DIGITAL</h1>
            <h1 className="text-5xl font-bold mb-8 tracking-wider">PASSPORT</h1>

            <div className="bg-white/10 backdrop-blur-md rounded-xl p-6 border border-white/30 shadow-xl">
              <p className="text-sm uppercase tracking-widest mb-2 opacity-80">Issued by</p>
              <p className="text-2xl font-bold">RAREMINDS</p>
              <p className="text-sm mt-2 opacity-80">Student Portfolio System</p>
            </div>

            <div className="mt-12 text-xs opacity-60">Official Digital Credential</div>
          </div>
        </div>
      ),
    },

    // Page 1: Personal Info & Verification
    {
      id: 'personal',
      title: 'Personal Information',
      content: (
        <div className="h-full p-8 bg-gradient-to-br from-amber-50 to-yellow-50 relative">
          <div className="absolute top-4 right-4 opacity-10">
            <Shield className="w-32 h-32 text-gray-400" />
          </div>

          <div className="relative">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-2xl font-bold text-gray-900 uppercase tracking-wide">
                Personal Details
              </h2>
              <span className="text-xs font-mono text-gray-500">Page 01</span>
            </div>

            <div className="flex space-x-6 mb-8">
              <div className="relative">
                <img
                  src={student?.profile.profileImage || '/api/placeholder/150/180'}
                  alt={student?.name || 'Profile'}
                  className="w-32 h-40 object-cover border-4 border-gray-800 shadow-lg"
                />
                <div className="absolute -bottom-2 -right-2 bg-white rounded-full p-1 shadow-lg">
                  {student?.approval_status === 'approved' ? (
                    <CheckCircle className="w-6 h-6 text-green-600" />
                  ) : (
                    <XCircle className="w-6 h-6 text-red-600" />
                  )}
                </div>
              </div>

              <div className="flex-1 space-y-2">
                <div className="border-b border-gray-300 pb-2">
                  <p className="text-xs text-gray-500 uppercase">Full Name</p>
                  <p className="font-bold text-lg text-gray-900">{student?.name || 'N/A'}</p>
                </div>
                <div className="border-b border-gray-300 pb-2">
                  <p className="text-xs text-gray-500 uppercase">
                    {student?.student_type === 'school-student' ? 'School' : 'University'}
                  </p>
                  <p className="font-semibold text-gray-800">
                    {student?.student_type === 'school-student'
                      ? student?.school?.name || student?.college_school_name || 'N/A'
                      : student?.university || student?.universityInfo?.name || 'N/A'}
                  </p>
                </div>
                <div className="border-b border-gray-300 pb-2">
                  <p className="text-xs text-gray-500 uppercase">
                    {student?.student_type === 'school-student'
                      ? 'Grade/Section'
                      : 'Field of Study'}
                  </p>
                  <p className="font-semibold text-gray-800">
                    {student?.student_type === 'school-student'
                      ? student?.grade && student?.section
                        ? `Grade ${student.grade} - ${student.section}`
                        : 'N/A'
                      : student?.branch_field || 'N/A'}
                  </p>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-lg p-4 shadow-md border-l-4 border-blue-600 mb-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-xs text-gray-500 font-medium">Email</p>
                  <p className="text-sm font-medium text-gray-800">{student?.email}</p>
                </div>
                <div>
                  <p className="text-xs text-gray-500 font-medium">Contact</p>
                  <p className="text-sm font-medium text-gray-800">
                    {student?.contact_number || 'N/A'}
                  </p>
                </div>
                <div>
                  <p className="text-xs text-gray-500 font-medium">Location</p>
                  <p className="text-sm font-medium text-gray-800">
                    {student?.city && student?.state
                      ? `${student.city}, ${student.state}${student.country ? `, ${student.country}` : ''}`
                      : student?.district_name || 'N/A'}
                  </p>
                </div>
                <div>
                  <p className="text-xs text-gray-500 font-medium">ID Number</p>
                  <p className="text-sm font-bold text-blue-600">
                    {student?.student_id || student?.profile?.passportId || 'N/A'}
                  </p>
                </div>
              </div>
            </div>

            {/* Verification Stamp */}
            <div className="absolute bottom-8 right-8">
              {student?.approval_status === 'approved' ? (
                <div className="relative">
                  <div className="w-32 h-32 rounded-full border-4 border-green-600 flex items-center justify-center transform -rotate-12">
                    <div className="text-center">
                      <CheckCircle className="w-10 h-10 text-green-600 mx-auto mb-1" />
                      <p className="text-green-600 font-bold text-xs uppercase">Verified by</p>
                      <p className="text-green-600 font-bold text-sm">Rareminds</p>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="relative">
                  <div className="w-32 h-32 rounded-full border-4 border-red-600 flex items-center justify-center transform -rotate-12">
                    <div className="text-center">
                      <XCircle className="w-10 h-10 text-red-600 mx-auto mb-1" />
                      <p className="text-red-600 font-bold text-xs uppercase">Not Verified</p>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      ),
    },

    // Page 2: Education
    {
      id: 'education',
      title: 'Education',
      content: (
        <div className="h-full p-8 bg-gradient-to-br from-blue-50 to-indigo-50">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center space-x-3">
              <Book className="w-6 h-6 text-blue-600" />
              <h2 className="text-2xl font-bold text-gray-900 uppercase">Education</h2>
            </div>
            <span className="text-xs font-mono text-gray-500">Page 02</span>
          </div>

          <div className="space-y-4">
            {student?.profile.education?.slice(0, 2).map((edu) => (
              <div
                key={edu.id}
                className="bg-white rounded-lg p-5 shadow-md border-l-4 border-blue-600"
              >
                <div className="flex justify-between items-start mb-2">
                  <h3 className="font-bold text-lg text-gray-900">{edu.degree}</h3>
                  {edu.grade && (
                    <span className="bg-blue-100 text-blue-800 px-3 py-1 rounded-full text-sm font-semibold">
                      {edu.grade}
                    </span>
                  )}
                </div>
                <p className="text-gray-700 font-medium mb-1">{edu.institution}</p>
                <p className="text-gray-600 text-sm mb-2">{edu.field}</p>
                <p className="text-xs text-gray-500">
                  {edu.startDate} - {edu.endDate || 'Present'}
                </p>
              </div>
            ))}

            {(!student?.profile.education || student.profile.education.length === 0) && (
              <div className="text-center text-gray-500 py-8">
                <Book className="w-12 h-12 mx-auto mb-2 opacity-30" />
                <p>No education records available</p>
              </div>
            )}
          </div>
        </div>
      ),
    },

    // Page 3: Skills
    {
      id: 'skills',
      title: 'Skills',
      content: (
        <div className="h-full p-8 bg-gradient-to-br from-purple-50 to-pink-50">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center space-x-3">
              <Code className="w-6 h-6 text-purple-600" />
              <h2 className="text-2xl font-bold text-gray-900 uppercase">Skills</h2>
            </div>
            <span className="text-xs font-mono text-gray-500">Page 03</span>
          </div>

          <div className="grid grid-cols-2 gap-3">
            {student?.profile.skills?.slice(0, 8).map((skill, index) => (
              <div
                key={index}
                className="bg-white rounded-lg p-4 shadow-sm border-l-3 border-purple-400"
              >
                <div className="flex items-center justify-between mb-1">
                  <p className="font-semibold text-gray-900">{skill.name}</p>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-xs text-gray-600">{skill.category || 'General'}</span>
                  <span className="text-xs font-semibold text-purple-600">{skill.level}</span>
                </div>
              </div>
            ))}

            {(!student?.profile.skills || student.profile.skills.length === 0) && (
              <div className="col-span-2 text-center text-gray-500 py-8">
                <Code className="w-12 h-12 mx-auto mb-2 opacity-30" />
                <p>No skills listed</p>
              </div>
            )}
          </div>
        </div>
      ),
    },

    // Page 4: Languages
    {
      id: 'languages',
      title: 'Languages',
      content: (
        <div className="h-full p-8 bg-gradient-to-br from-green-50 to-emerald-50">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center space-x-3">
              <Globe className="w-6 h-6 text-green-600" />
              <h2 className="text-2xl font-bold text-gray-900 uppercase">Languages</h2>
            </div>
            <span className="text-xs font-mono text-gray-500">Page 04</span>
          </div>

          <div className="space-y-3">
            {student?.profile.languages?.map((language, index) => (
              <div
                key={index}
                className="bg-white rounded-lg p-4 shadow-sm flex items-center justify-between border-l-4 border-green-500"
              >
                <div className="flex items-center space-x-3">
                  <Globe className="w-5 h-5 text-green-600" />
                  <span className="font-semibold text-gray-900">{language.name}</span>
                </div>
                <span className="text-sm font-medium text-green-700 bg-green-100 px-3 py-1 rounded-full">
                  {language.proficiency}
                </span>
              </div>
            ))}

            {(!student?.profile.languages || student.profile.languages.length === 0) && (
              <div className="text-center text-gray-500 py-12">
                <Globe className="w-12 h-12 mx-auto mb-2 opacity-30" />
                <p>No languages listed</p>
              </div>
            )}
          </div>
        </div>
      ),
    },

    // Page 5: Projects
    {
      id: 'projects',
      title: 'Projects',
      content: (
        <div className="h-full p-8 bg-gradient-to-br from-orange-50 to-amber-50">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center space-x-3">
              <Briefcase className="w-6 h-6 text-orange-600" />
              <h2 className="text-2xl font-bold text-gray-900 uppercase">Projects</h2>
            </div>
            <span className="text-xs font-mono text-gray-500">Page 05</span>
          </div>

          <div className="space-y-4 overflow-y-auto max-h-[500px]">
            {student?.profile.projects?.slice(0, 3).map((project) => (
              <div
                key={project.id}
                className="bg-white rounded-lg p-4 shadow-md border-l-4 border-orange-500"
              >
                <h3 className="font-bold text-gray-900 mb-2">{project.title}</h3>
                <p className="text-sm text-gray-600 mb-3 line-clamp-2">{project.description}</p>
                <div className="flex flex-wrap gap-1">
                  {project.technologies?.slice(0, 4).map((tech, i) => (
                    <span
                      key={i}
                      className="text-xs bg-orange-100 text-orange-700 px-2 py-1 rounded"
                    >
                      {tech}
                    </span>
                  ))}
                </div>
              </div>
            ))}

            {(!student?.profile.projects || student.profile.projects.length === 0) && (
              <div className="text-center text-gray-500 py-12">
                <Briefcase className="w-12 h-12 mx-auto mb-2 opacity-30" />
                <p>No projects listed</p>
              </div>
            )}
          </div>
        </div>
      ),
    },

    // Page 6: Achievements & Certifications
    {
      id: 'achievements',
      title: 'Achievements',
      content: (
        <div className="h-full p-8 bg-gradient-to-br from-yellow-50 to-amber-50">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center space-x-3">
              <Award className="w-6 h-6 text-yellow-600" />
              <h2 className="text-2xl font-bold text-gray-900 uppercase">Achievements</h2>
            </div>
            <span className="text-xs font-mono text-gray-500">Page 06</span>
          </div>

          <div className="space-y-3">
            {student?.profile.achievements?.slice(0, 4).map((achievement) => (
              <div
                key={achievement.id}
                className="bg-white rounded-lg p-4 shadow-sm border-l-4 border-yellow-500"
              >
                <div className="flex items-start space-x-3">
                  <Award className="w-5 h-5 text-yellow-600 mt-1 flex-shrink-0" />
                  <div className="flex-1">
                    <h3 className="font-semibold text-gray-900 mb-1">{achievement.title}</h3>
                    <p className="text-sm text-gray-600 mb-2">{achievement.description}</p>
                    <p className="text-xs text-gray-500">{achievement.date}</p>
                  </div>
                </div>
              </div>
            ))}

            {student?.profile.certifications?.slice(0, 2).map((cert) => (
              <div
                key={cert.id}
                className="bg-white rounded-lg p-4 shadow-sm border-l-4 border-blue-500"
              >
                <div className="flex items-start space-x-3">
                  <Shield className="w-5 h-5 text-blue-600 mt-1 flex-shrink-0" />
                  <div className="flex-1">
                    <h3 className="font-semibold text-gray-900 mb-1">{cert.name}</h3>
                    <p className="text-sm text-gray-600">{cert.issuer}</p>
                    <p className="text-xs text-gray-500">{cert.date}</p>
                  </div>
                </div>
              </div>
            ))}

            {(!student?.profile.achievements || student.profile.achievements.length === 0) &&
              (!student?.profile.certifications || student.profile.certifications.length === 0) && (
                <div className="text-center text-gray-500 py-12">
                  <Award className="w-12 h-12 mx-auto mb-2 opacity-30" />
                  <p>No achievements or certifications</p>
                </div>
              )}
          </div>
        </div>
      ),
    },

    // Page 7: Hobbies
    {
      id: 'hobbies',
      title: 'Hobbies',
      content: (
        <div className="h-full p-8 bg-gradient-to-br from-slate-50 to-gray-100">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center space-x-3">
              <Star className="w-6 h-6 text-slate-600" />
              <h2 className="text-2xl font-bold text-gray-900 uppercase">Hobbies</h2>
            </div>
            <span className="text-xs font-mono text-gray-500">Page 07</span>
          </div>

          <div className="grid grid-cols-2 gap-4">
            {student?.profile.hobbies?.map((hobby, index) => {
              const IconComponent = getHobbyIcon(hobby);
              return (
                <div
                  key={index}
                  className="bg-white rounded-lg p-4 shadow-md border-l-4 border-slate-500 hover:shadow-lg transition-shadow"
                >
                  <div className="flex items-center space-x-3">
                    <div className="flex-shrink-0 w-10 h-10 bg-slate-100 rounded-full flex items-center justify-center">
                      <IconComponent className="w-5 h-5 text-slate-600" />
                    </div>
                    <div className="flex-1">
                      <p className="font-semibold text-gray-900 text-sm leading-tight">{hobby}</p>
                      <p className="text-xs text-gray-500 mt-1">Personal Interest</p>
                    </div>
                  </div>
                </div>
              );
            })}

            {(!student?.profile.hobbies || student.profile.hobbies.length === 0) && (
              <div className="col-span-2 text-center text-gray-500 py-12">
                <Star className="w-12 h-12 mx-auto mb-2 opacity-30" />
                <p>No hobbies or interests listed</p>
              </div>
            )}
          </div>
        </div>
      ),
    },

    // Page 8: Interests
    {
      id: 'interests',
      title: 'Areas of Interest',
      content: (
        <div className="h-full p-8 bg-gradient-to-br from-teal-50 to-cyan-50">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center space-x-3">
              <Target className="w-6 h-6 text-teal-600" />
              <h2 className="text-2xl font-bold text-gray-900 uppercase">Interests</h2>
            </div>
            <span className="text-xs font-mono text-gray-500">Page 08</span>
          </div>

          <div className="grid grid-cols-2 gap-3">
            {student?.profile.interests?.map((interest, index) => (
              <div
                key={index}
                className="bg-white rounded-lg p-4 shadow-sm border-l-4 border-teal-500"
              >
                <div className="flex items-center space-x-2">
                  <Target className="w-5 h-5 text-teal-600" />
                  <p className="font-medium text-gray-900">{interest}</p>
                </div>
              </div>
            ))}

            {(!student?.profile.interests || student.profile.interests.length === 0) && (
              <div className="col-span-2 text-center text-gray-500 py-12">
                <Target className="w-12 h-12 mx-auto mb-2 opacity-30" />
                <p>No interests listed</p>
              </div>
            )}
          </div>
        </div>
      ),
    },
  ];

  const nextPage = () => {
    if (currentPage < pages.length - 1) {
      setDirection(1);
      setCurrentPage(currentPage + 1);
    }
  };

  const prevPage = () => {
    if (currentPage > 0) {
      setDirection(-1);
      setCurrentPage(currentPage - 1);
    }
  };

  const pageVariants = {
    enter: (direction: number) => ({
      rotateY: direction > 0 ? 90 : -90,
      opacity: 0,
    }),
    center: {
      rotateY: 0,
      opacity: 1,
    },
    exit: (direction: number) => ({
      rotateY: direction > 0 ? -90 : 90,
      opacity: 0,
    }),
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-100 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading passport...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-100 to-gray-200 dark:from-gray-900 dark:via-slate-900 dark:to-indigo-950 transition-colors duration-300">
      {/* Passport Book */}
      <div className="flex items-center justify-center min-h-screen py-8 px-4 md:px-8">
        <div
          className="relative transition-transform duration-300 ease-in-out"
          style={{ transform: `scale(${zoomLevel})` }}
        >
          {/* Passport Book Container */}
          <div
            className="w-full md:w-[500px] lg:w-[600px] h-[600px] md:h-[700px] bg-white dark:bg-gray-800 rounded-lg shadow-2xl border-4 border-gray-900 dark:border-gray-700 relative overflow-hidden transition-colors duration-300"
            style={{ perspective: '1000px' }}
            onTouchStart={onTouchStart}
            onTouchMove={onTouchMove}
            onTouchEnd={onTouchEnd}
          >
            {/* Page Flip Animation */}
            <AnimatePresence initial={false} custom={direction} mode="wait">
              <motion.div
                key={currentPage}
                custom={direction}
                variants={pageVariants}
                initial="enter"
                animate="center"
                exit="exit"
                transition={{
                  rotateY: { type: 'spring', stiffness: 300, damping: 30 },
                  opacity: { duration: 0.2 },
                }}
                className="h-full"
                style={{ transformStyle: 'preserve-3d' }}
              >
                {pages[currentPage].content}
              </motion.div>
            </AnimatePresence>

            {/* Binding Effect */}
            <div className="absolute left-0 top-0 bottom-0 w-1 bg-gradient-to-r from-gray-800 dark:from-gray-600 to-transparent"></div>
          </div>

          {/* Desktop Navigation Controls */}
          <div className="hidden md:block">
            <div className="absolute -left-16 lg:-left-20 top-1/2 transform -translate-y-1/2">
              <button
                onClick={prevPage}
                disabled={currentPage === 0}
                className={`p-4 rounded-full shadow-lg transition-all ${
                  currentPage === 0
                    ? 'bg-gray-300 dark:bg-gray-700 text-gray-500 dark:text-gray-600 cursor-not-allowed'
                    : 'bg-blue-600 dark:bg-blue-700 text-white hover:bg-blue-700 dark:hover:bg-blue-600 hover:scale-110'
                }`}
                aria-label="Previous page"
              >
                <ChevronLeft className="w-6 h-6" />
              </button>
            </div>

            <div className="absolute -right-16 lg:-right-20 top-1/2 transform -translate-y-1/2">
              <button
                onClick={nextPage}
                disabled={currentPage === pages.length - 1}
                className={`p-4 rounded-full shadow-lg transition-all ${
                  currentPage === pages.length - 1
                    ? 'bg-gray-300 dark:bg-gray-700 text-gray-500 dark:text-gray-600 cursor-not-allowed'
                    : 'bg-blue-600 dark:bg-blue-700 text-white hover:bg-blue-700 dark:hover:bg-blue-600 hover:scale-110'
                }`}
                aria-label="Next page"
              >
                <ChevronRight className="w-6 h-6" />
              </button>
            </div>
          </div>

          {/* Mobile Navigation Hint */}
          <div className="md:hidden absolute bottom-4 left-1/2 transform -translate-x-1/2 bg-black/70 dark:bg-black/80 text-white px-4 py-2 rounded-full text-xs backdrop-blur-sm">
            Swipe to flip pages
          </div>
        </div>
      </div>

      {/* Page Indicators */}
      <div className="fixed bottom-4 md:bottom-8 left-1/2 transform -translate-x-1/2 z-40">
        <div className="flex space-x-2 bg-white/90 dark:bg-gray-800/90 backdrop-blur-sm rounded-full px-4 py-2 shadow-lg transition-colors duration-300">
          {pages.map((page, index) => (
            <button
              key={index}
              onClick={() => {
                setDirection(index > currentPage ? 1 : -1);
                setCurrentPage(index);
              }}
              className={`transition-all ${
                index === currentPage
                  ? 'w-8 h-3 bg-blue-600 dark:bg-blue-500 rounded-full'
                  : 'w-3 h-3 bg-gray-300 dark:bg-gray-600 hover:bg-gray-400 dark:hover:bg-gray-500 rounded-full'
              }`}
              aria-label={`Go to ${page.title}`}
            />
          ))}
        </div>
      </div>
    </div>
  );
};

export default PassportPage;
