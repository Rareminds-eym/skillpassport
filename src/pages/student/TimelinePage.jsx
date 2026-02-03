import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Briefcase,
  Code,
  Medal,
  BookOpen,
  Calendar as CalendarIcon,
  ArrowLeft,
  Trophy,
  GraduationCap,
  ChevronRight,
  ExternalLink,
  Mail,
  Phone,
  MapPin,
} from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import { useStudentDataByEmail } from "../../hooks/useStudentDataByEmail";

/**
 * TimelinePage - Digital Portfolio Journey Map
 * 
 * This component displays a comprehensive achievement timeline following the
 * digital portfolio journey map design pattern. It provides an interactive
 * visual representation of a student's educational journey, work experience,
 * projects, certifications, and achievements.
 * 
 * Design Features:
 * - Interactive milestone timeline with alternating left/right layout
 * - Category-based filtering (Education, Experience, Projects, Certifications, Achievements)
 * - Expandable milestone cards with detailed information
 * - Year badges and color-coded categories
 * - Smooth animations and transitions
 * - Responsive design for mobile and desktop
 */

const TimelinePage = () => {
  const navigate = useNavigate();
  const { user, loading: authLoading } = useAuth();
  console.log("----------------------", user);
  
  // Get email for fetching detailed timeline data
  const userEmail = localStorage.getItem('userEmail') || user?.email;
  
  // Fetch detailed timeline data from database
  const { studentData: timelineData, loading: timelineLoading } = useStudentDataByEmail(userEmail);
  
  const [selectedMilestone, setSelectedMilestone] = useState(null);
  const [activeTab, setActiveTab] = useState("all"); // all, education, experience, project, certificate, achievement
  
  // Combine auth user data with timeline data for complete profile
  const studentData = {
    ...user, // Basic profile info from auth
    ...timelineData, // Timeline arrays from database
  };
  
  // Loading state - wait for both auth and timeline data
  const loading = authLoading || timelineLoading;

  // Scroll to top when page loads
  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, []);

  // Create comprehensive milestone data from user data
  const createMilestones = () => {
    if (!studentData) return [];
    
    // Debug: Log the data structure
    console.log('📊 Student Data Structure:', studentData);
    console.log('📚 Education:', studentData.education);
    console.log('💼 Experience:', studentData.experience);
    console.log('🚀 Projects:', studentData.projects);
    console.log('🏆 Certificates:', studentData.certificates);
    console.log('⭐ Achievements:', studentData.achievements);
    
    // Since the user data comes from auth context, we need to check if it has profile data
    // The data might be in different structure than expected
    console.log('🔍 Available keys in studentData:', Object.keys(studentData));
    
    const milestones = [];

    // Get data from profile or direct properties
    const education = studentData.education || [];
    const experience = studentData.experience || [];
    const projects = studentData.projects || [];
    const certificates = studentData.certificates || [];
    const achievements = studentData.achievements || [];
    
    // If no timeline data exists, create some sample milestones from basic user info
    if (education.length === 0 && experience.length === 0 && projects.length === 0 && certificates.length === 0 && achievements.length === 0) {
      console.log('🔄 No timeline data found, creating basic milestones from user info');
      
      // Add basic education milestone if we have university info
      if (studentData.university || studentData.college_school_name) {
        education.push({
          degree: studentData.branch_field || 'Current Studies',
          university: studentData.university || studentData.college_school_name,
          year: new Date().getFullYear(),
          enabled: true
        });
      }
      
      // Add basic achievement if user has approval status
      if (studentData.approval_status === 'approved') {
        achievements.push({
          title: 'Profile Approved',
          category: 'Platform Achievement',
          date: studentData.updated_at ? new Date(studentData.updated_at).getFullYear() : new Date().getFullYear(),
          description: 'Successfully completed profile verification and approval process',
          enabled: true
        });
      }
    }

    // Education Milestones
    if (Array.isArray(education)) {
      education
        .filter((edu) => edu && edu.enabled !== false)
        .forEach((edu, index) => {
          milestones.push({
            id: `edu-${index}`,
            type: "education",
            icon: GraduationCap,
            title: edu.degree || "Degree",
            subtitle: edu.university || edu.institution,
            date: `${edu.startDate || edu.year || ''} - ${edu.endDate || edu.yearOfPassing || 'Present'}`,
            description: `${edu.field || edu.level || ""} ${edu.cgpa ? `- Grade: ${edu.cgpa}` : ""}`,
            details: edu,
            color: "from-blue-500 to-indigo-600",
            bgColor: "bg-blue-50",
            borderColor: "border-blue-500",
            year: edu.yearOfPassing || edu.year || new Date().getFullYear(),
          });
        });
    }

    // Experience Milestones
    if (Array.isArray(experience)) {
      experience
        .filter((exp) => exp && exp.enabled !== false)
        .forEach((exp, index) => {
          milestones.push({
            id: `exp-${index}`,
            type: "experience",
            icon: Briefcase,
            title: exp.role || exp.position || "Role",
            subtitle: exp.company || exp.organization,
            date: exp.duration || exp.period || `${exp.startDate || ''} - ${exp.endDate || 'Present'}`,
            description: exp.description || "Work experience",
            details: exp,
            color: "from-green-500 to-emerald-600",
            bgColor: "bg-green-50",
            borderColor: "border-green-500",
            year: exp.startDate ? new Date(exp.startDate).getFullYear() : new Date().getFullYear(),
          });
        });
    }

    // Project Milestones
    if (Array.isArray(projects)) {
      projects
        .filter((project) => project && project.enabled !== false)
        .forEach((project, index) => {
          const tech = Array.isArray(project.tech) ? project.tech : 
                      Array.isArray(project.technologies) ? project.technologies : 
                      Array.isArray(project.techStack) ? project.techStack : [];
          
          milestones.push({
            id: `project-${index}`,
            type: "project",
            icon: Code,
            title: project.title || project.name || "Project",
            subtitle: tech.join(", ") || project.organization || project.company,
            date: project.duration || project.timeline || `${project.startDate || ''} - ${project.endDate || 'Recent'}`,
            description: project.description || "Completed project",
            details: { ...project, technologies: tech, github_url: project.github || project.githubUrl, live_url: project.link || project.liveUrl },
            color: "from-purple-500 to-violet-600",
            bgColor: "bg-purple-50",
            borderColor: "border-purple-500",
            year: project.startDate ? new Date(project.startDate).getFullYear() : new Date().getFullYear(),
          });
        });
    }

    // Certificate Milestones
    if (Array.isArray(certificates)) {
      certificates
        .filter((cert) => cert && cert.enabled !== false && (cert.approval_status === 'verified' || cert.approval_status === 'approved'))
        .forEach((cert, index) => {
          milestones.push({
            id: `cert-${index}`,
            type: "certificate",
            icon: Medal,
            title: cert.title || cert.name || "Certificate",
            subtitle: cert.issuer || cert.organization || cert.institution,
            date: cert.year || cert.date || cert.issueDate || cert.issuedOn || new Date().getFullYear().toString(),
            description: cert.description || `Earned certificate from ${cert.issuer || "this institution"}`,
            details: cert,
            color: "from-orange-500 to-red-600",
            bgColor: "bg-orange-50",
            borderColor: "border-orange-500",
            year: cert.year || new Date().getFullYear(),
          });
        });
    }

    // Achievement Milestones
    if (Array.isArray(achievements)) {
      achievements
        .filter((achievement) => achievement && achievement.enabled !== false)
        .forEach((achievement, index) => {
          milestones.push({
            id: `ach-${index}`,
            type: "achievement",
            icon: Trophy,
            title: achievement.title || "Achievement",
            subtitle: achievement.category || achievement.organization || "Achievement",
            date: achievement.date || achievement.year || new Date().getFullYear().toString(),
            description: achievement.description || "Earned achievement",
            details: achievement,
            color: "from-yellow-500 to-amber-600",
            bgColor: "bg-yellow-50",
            borderColor: "border-yellow-500",
            year: achievement.date ? new Date(achievement.date).getFullYear() : new Date().getFullYear(),
          });
        });
    }

    // Sort by year (most recent first)
    return milestones.sort((a, b) => {
      const yearA = typeof a.year === 'number' ? a.year : parseInt(a.year) || 0;
      const yearB = typeof b.year === 'number' ? b.year : parseInt(b.year) || 0;
      return yearB - yearA;
    });
  };

  const allMilestones = createMilestones();
  
  // Filter milestones based on active tab
  const filteredMilestones = activeTab === "all" 
    ? allMilestones 
    : allMilestones.filter((m) => m.type === activeTab);

  // Count milestones by type
  const counts = {
    education: allMilestones.filter((m) => m.type === "education").length,
    experience: allMilestones.filter((m) => m.type === "experience").length,
    project: allMilestones.filter((m) => m.type === "project").length,
    certificate: allMilestones.filter((m) => m.type === "certificate").length,
    achievement: allMilestones.filter((m) => m.type === "achievement").length,
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-purple-50 to-pink-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading your journey...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-purple-50 to-pink-50">
      {/* Profile Header Section */}
      <div className="bg-white shadow-lg border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-6 py-8">
          <button
            onClick={() => navigate("/student/dashboard")}
            className="mb-6 flex items-center gap-2 text-gray-600 hover:text-gray-900 transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Back to Dashboard</span>
          </button>

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
                  src={studentData?.profilePicture || studentData?.profile_photo || `https://ui-avatars.com/api/?name=${encodeURIComponent(studentData?.name || 'Student')}&size=200&background=6366f1&color=fff&bold=true`}
                  alt={studentData?.name || 'Student'}
                  className="w-full h-full object-cover"
                />
              </div>
            </motion.div>

            {/* Profile Details */}
            <div className="flex-1 text-center md:text-left">
              <motion.h1
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.2 }}
                className="text-4xl font-bold text-gray-900 mb-2"
              >
                {studentData?.name || 'Student'}
              </motion.h1>
              
              <motion.p
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.3 }}
                className="text-xl text-indigo-600 font-medium mb-4"
              >
                {studentData?.college_school_name || 'Student'}
              </motion.p>

              <motion.p
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.4 }}
                className="text-gray-600 mb-6 max-w-2xl"
              >
                {studentData?.bio || 'Passionate about learning and growth'}
              </motion.p>

              {/* Contact Info */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.5 }}
                className="flex flex-wrap gap-4 justify-center md:justify-start"
              >
                {studentData?.email && (
                  <span className="flex items-center gap-2 text-gray-600 bg-gray-100 px-4 py-2 rounded-full">
                    <Mail className="w-4 h-4" />
                    <span className="text-sm">{studentData.email}</span>
                  </span>
                )}
                {(studentData?.contact_number || studentData?.contactNumber) && (
                  <span className="flex items-center gap-2 text-gray-600 bg-gray-100 px-4 py-2 rounded-full">
                    <Phone className="w-4 h-4" />
                    <span className="text-sm">{studentData.contact_number || studentData.contactNumber}</span>
                  </span>
                )}
                {(studentData?.city || studentData?.state || studentData?.district_name) && (
                  <span className="flex items-center gap-2 text-gray-600 bg-gray-100 px-4 py-2 rounded-full">
                    <MapPin className="w-4 h-4" />
                    <span className="text-sm">
                      {studentData.city && studentData.state 
                        ? `${studentData.city}, ${studentData.state}` 
                        : studentData.district_name || studentData.city || studentData.state
                      }
                    </span>
                  </span>
                )}
                {/* Show university/college badge only if it's a proper institution name */}
                {(studentData?.university && 
                  studentData.university !== 'bangalore' && 
                  studentData.university.length > 3 &&
                  !studentData.university.toLowerCase().includes('city')) && (
                  <span className="flex items-center gap-2 text-gray-600 bg-gray-100 px-4 py-2 rounded-full">
                    <GraduationCap className="w-4 h-4" />
                    <span className="text-sm">{studentData.university}</span>
                  </span>
                )}
                {/* For school students, show grade/section if available */}
                {studentData?.student_type === 'school-student' && studentData?.grade && studentData?.section && (
                  <span className="flex items-center gap-2 text-gray-600 bg-gray-100 px-4 py-2 rounded-full">
                    <GraduationCap className="w-4 h-4" />
                    <span className="text-sm">Grade {studentData.grade} - {studentData.section}</span>
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
          <h2 className="text-4xl font-bold text-gray-900 mb-3">
            My Professional Journey
          </h2>
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
              onClick={() => setActiveTab('all')}
              className={`flex items-center gap-2 px-6 py-3 rounded-full font-medium transition-all duration-300 ${
                activeTab === 'all'
                  ? 'bg-gradient-to-r from-indigo-500 to-purple-600 text-white shadow-lg scale-105'
                  : 'bg-white text-gray-700 hover:bg-gray-50 shadow-md'
              }`}
            >
              <span>All</span>
              <span className={`text-xs px-2 py-0.5 rounded-full ${
                activeTab === 'all' ? 'bg-white/20' : 'bg-gray-200'
              }`}>
                {allMilestones.length}
              </span>
            </button>

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
              <span className={`text-xs px-2 py-0.5 rounded-full ${
                activeTab === 'education' ? 'bg-white/20' : 'bg-gray-200'
              }`}>
                {counts.education}
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
              <span className={`text-xs px-2 py-0.5 rounded-full ${
                activeTab === 'experience' ? 'bg-white/20' : 'bg-gray-200'
              }`}>
                {counts.experience}
              </span>
            </button>

            <button
              onClick={() => setActiveTab('project')}
              className={`flex items-center gap-2 px-6 py-3 rounded-full font-medium transition-all duration-300 ${
                activeTab === 'project'
                  ? 'bg-gradient-to-r from-purple-500 to-violet-600 text-white shadow-lg scale-105'
                  : 'bg-white text-gray-700 hover:bg-gray-50 shadow-md'
              }`}
            >
              <Code className="w-5 h-5" />
              <span>Projects</span>
              <span className={`text-xs px-2 py-0.5 rounded-full ${
                activeTab === 'project' ? 'bg-white/20' : 'bg-gray-200'
              }`}>
                {counts.project}
              </span>
            </button>

            <button
              onClick={() => setActiveTab('certificate')}
              className={`flex items-center gap-2 px-6 py-3 rounded-full font-medium transition-all duration-300 ${
                activeTab === 'certificate'
                  ? 'bg-gradient-to-r from-orange-500 to-red-600 text-white shadow-lg scale-105'
                  : 'bg-white text-gray-700 hover:bg-gray-50 shadow-md'
              }`}
            >
              <Medal className="w-5 h-5" />
              <span>Certifications</span>
              <span className={`text-xs px-2 py-0.5 rounded-full ${
                activeTab === 'certificate' ? 'bg-white/20' : 'bg-gray-200'
              }`}>
                {counts.certificate}
              </span>
            </button>

            <button
              onClick={() => setActiveTab('achievement')}
              className={`flex items-center gap-2 px-6 py-3 rounded-full font-medium transition-all duration-300 ${
                activeTab === 'achievement'
                  ? 'bg-gradient-to-r from-yellow-500 to-amber-600 text-white shadow-lg scale-105'
                  : 'bg-white text-gray-700 hover:bg-gray-50 shadow-md'
              }`}
            >
              <Trophy className="w-5 h-5" />
              <span>Achievements</span>
              <span className={`text-xs px-2 py-0.5 rounded-full ${
                activeTab === 'achievement' ? 'bg-white/20' : 'bg-gray-200'
              }`}>
                {counts.achievement}
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
            {filteredMilestones.length === 0 ? (
              <div className="bg-white rounded-2xl shadow-lg p-12 text-center">
                <BookOpen className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                <h3 className="text-xl font-semibold text-gray-900 mb-2">No {activeTab === 'all' ? 'milestones' : activeTab} yet</h3>
                <p className="text-gray-600">Start your journey by adding some {activeTab === 'all' ? 'achievements' : activeTab}!</p>
              </div>
            ) : (
              <div className="space-y-8">
                {/* Timeline */}
                <div className="relative">
                  {/* Vertical Line */}
                  <div className="absolute left-8 md:left-1/2 top-0 bottom-0 w-1 bg-gradient-to-b from-indigo-200 via-purple-200 to-pink-200"></div>

                  {filteredMilestones.map((milestone, index) => {
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
                        <div className={`hidden md:block ${isLeft ? 'md:w-1/2 md:pr-12 md:text-right' : 'md:w-1/2 md:pl-12 md:text-left'}`}>
                          <motion.div
                            whileHover={{ scale: 1.05 }}
                            className="inline-block"
                          >
                            <div className={`inline-flex items-center gap-2 bg-gradient-to-r ${milestone.color} text-white px-4 py-2 rounded-full shadow-lg`}>
                              <CalendarIcon className="w-4 h-4" />
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
                            onClick={() => setSelectedMilestone(selectedMilestone?.id === milestone.id ? null : milestone)}
                          >
                            {/* Mobile Year Badge */}
                            <div className="md:hidden mb-3">
                              <div className={`inline-flex items-center gap-2 bg-gradient-to-r ${milestone.color} text-white px-3 py-1 rounded-full shadow-md text-sm`}>
                                <CalendarIcon className="w-3 h-3" />
                                <span className="font-bold">{milestone.year}</span>
                              </div>
                            </div>

                            <h3 className="text-xl font-bold text-gray-900 mb-2">{milestone.title}</h3>
                            <p className="text-indigo-600 font-medium mb-3">{milestone.subtitle}</p>
                            
                            {milestone.date && (
                              <div className="flex items-center gap-2 text-sm text-gray-600 mb-3">
                                <CalendarIcon className="w-4 h-4" />
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
                                {milestone.type === 'project' && milestone.details.technologies && milestone.details.technologies.length > 0 && (
                                  <div className="mb-3">
                                    <p className="text-sm font-semibold text-gray-700 mb-2">Technologies:</p>
                                    <div className="flex flex-wrap gap-2">
                                      {milestone.details.technologies.map((tech, idx) => (
                                        <span key={idx} className="px-3 py-1 bg-purple-100 text-purple-700 rounded-full text-xs">
                                          {tech}
                                        </span>
                                      ))}
                                    </div>
                                  </div>
                                )}
                                
                                {milestone.type === 'project' && milestone.details.github_url && (
                                  <a
                                    href={milestone.details.github_url}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="inline-flex items-center gap-2 text-indigo-600 hover:text-indigo-800 text-sm font-medium mt-2"
                                    onClick={(e) => e.stopPropagation()}
                                  >
                                    <Code className="w-4 h-4" />
                                    <span>View on GitHub</span>
                                    <ExternalLink className="w-3 h-3" />
                                  </a>
                                )}
                                
                                {milestone.type === 'project' && milestone.details.live_url && (
                                  <a
                                    href={milestone.details.live_url}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="inline-flex items-center gap-2 text-indigo-600 hover:text-indigo-800 text-sm font-medium mt-2 ml-4"
                                    onClick={(e) => e.stopPropagation()}
                                  >
                                    <ExternalLink className="w-4 h-4" />
                                    <span>Live Demo</span>
                                  </a>
                                )}
                              </motion.div>
                            )}

                            <div className="flex items-center gap-2 text-indigo-600 mt-4 font-medium text-sm">
                              <span>{selectedMilestone?.id === milestone.id ? 'Hide Details' : 'View Details'}</span>
                              <ChevronRight className={`w-4 h-4 transition-transform ${selectedMilestone?.id === milestone.id ? 'rotate-90' : ''}`} />
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

export default TimelinePage;
