import React, { useState, useEffect } from "react";
import {
  GraduationCap,
  Briefcase,
  CreditCard,
  Award,
  Edit3,
  Plus,
  Copy,
  Share2,
  Check,
  Github,
  Globe,
  Linkedin,
  Twitter,
  Instagram,
  Facebook,
  X,
  CheckCircle,
  Clock,
} from "lucide-react";
import { Card, CardContent } from "./ui/card";
import { Badge } from "./ui/badge";
import { Progress } from "./ui/progress";
import { Button } from "./ui/button";
import { QRCodeSVG } from "qrcode.react";
import { studentData } from "../data/mockData";
import { useStudentDataByEmail } from "../../../hooks/useStudentDataByEmail";
import { useEmployabilityScore } from "../../../hooks/useEmployabilityScore";
import { useStudentTraining } from "../../../hooks/useStudentTraining";
import { useStudentCertificates } from "../../../hooks/useStudentCertificates";
import { useStudentProjects } from "../../../hooks/useStudentProjects";
import { useStudentEducation } from "../../../hooks/useStudentEducation";
import { useStudentTechnicalSkills } from "../../../hooks/useStudentTechnicalSkills";
import { useStudentSoftSkills } from "../../../hooks/useStudentSoftSkills";
import { useStudentExperience } from "../../../hooks/useStudentExperience";
import {
  calculateEmployabilityScore,
  getDefaultEmployabilityScore,
} from "../../../utils/employabilityCalculator";
import EmployabilityDebugger from "./EmployabilityDebugger";
import { generateBadges } from "../../../services/badgeService";
import DigitalBadges from "./DigitalBadges";

// ================= REUSABLE DETAIL ITEM =================
const DetailItem = ({ label, value, highlight }) => (
  <div className="flex flex-col bg-gray-50 hover:bg-gray-100 rounded-xl p-3 transition-all shadow-sm">
    <span className="text-xs font-medium text-gray-500">{label}</span>
    <span
      className={`text-sm mt-1 ${highlight ? "text-purple-600 font-semibold" : "text-gray-900"
        }`}
    >
      {value}
    </span>
  </div>
);

const ProfileHeroEdit = ({ onEditClick }) => {
  // Get logged-in user's email from localStorage
  const userEmail = localStorage.getItem("userEmail");

  // State for copy/share functionality
  const [copied, setCopied] = useState(false);
  const [showShareModal, setShowShareModal] = useState(false);

  // State for employability score
  const [employabilityData, setEmployabilityData] = useState(
    getDefaultEmployabilityScore()
  );

  // State for badges
  const [earnedBadges, setEarnedBadges] = useState([]);

  // State for hover card visibility
  const [hoveredBadgeData, setHoveredBadgeData] = useState(null);

  // State for details modal
  const [showDetailsModal, setShowDetailsModal] = useState(false);

  // State for badge modal
  const [showBadgeModal, setShowBadgeModal] = useState(false);
  const [selectedBadge, setSelectedBadge] = useState(null);



  // Fetch real student data
  const {
    studentData: realStudentData,
    loading,
    error,
  } = useStudentDataByEmail(userEmail);

  // Get student ID for table data
  const studentId = realStudentData?.id;

  // Fetch data from separate tables
  const {
    training: tableTraining,
    loading: trainingLoading,
  } = useStudentTraining(studentId, !!studentId);

  const {
    certificates: tableCertificates,
    loading: certificatesLoading,
  } = useStudentCertificates(studentId, !!studentId);

  const {
    projects: tableProjects,
    loading: projectsLoading,
  } = useStudentProjects(studentId, !!studentId);

  const {
    education: tableEducation,
    loading: educationLoading,
  } = useStudentEducation(studentId, !!studentId);

  const {
    technicalSkills: tableTechnicalSkills,
    loading: technicalSkillsLoading,
  } = useStudentTechnicalSkills(studentId, !!studentId);

  const {
    softSkills: tableSoftSkills,
    loading: softSkillsLoading,
  } = useStudentSoftSkills(studentId, !!studentId);

  const {
    experience: tableExperience,
    loading: experienceLoading,
  } = useStudentExperience(studentId, !!studentId);

  // Use real data from student table instead of JSONB profile
  const displayData = realStudentData?.profile; // Keep for achievements only

  // Debug: Log all available fields in realStudentData
  if (process.env.NODE_ENV === 'development' && realStudentData) {
    console.log('🔍 All Student Data Fields:', Object.keys(realStudentData));
    console.log('🔍 Student Data Values:', realStudentData);
    console.log('🔍 Name Fields:', {
      name: realStudentData?.name,
      profile_name: realStudentData?.profile?.name,
      email: realStudentData?.email,
      userEmail: userEmail
    });
    console.log('🔍 School Detection Fields:', {
      school_id: realStudentData?.school_id,
      school_class_id: realStudentData?.school_class_id,
      schoolClassId: realStudentData?.schoolClassId,
      university_college_id: realStudentData?.university_college_id,
      universityCollegeId: realStudentData?.universityCollegeId,
      universityId: realStudentData?.universityId
    });
  }

  // Check if student is from school or university using actual database fields
  const isSchoolStudent = realStudentData?.school_id || realStudentData?.school_class_id || realStudentData?.schoolClassId;
  const isUniversityStudent = realStudentData?.university_college_id || realStudentData?.universityCollegeId || realStudentData?.universityId;

  // Debug: Log the detection results
  if (process.env.NODE_ENV === 'development') {
    console.log('🏫 Institution Detection:', {
      isSchoolStudent,
      isUniversityStudent,
      finalType: isSchoolStudent ? "School" : "University"
    });
  }

  // Use data from students table name column only
  const studentName = realStudentData?.name || "Student Name";

  // Debug: Log name specifically
  if (process.env.NODE_ENV === 'development') {
    console.log('🔍 NAME DEBUG:', {
      'realStudentData exists': !!realStudentData,
      'realStudentData.name': realStudentData?.name,
      'typeof name': typeof realStudentData?.name,
      'name length': realStudentData?.name?.length,
      'final studentName': studentName
    });
  }
  const studentEmail = realStudentData?.email || userEmail;
  const studentId_display = realStudentData?.student_id || "Not Assigned";
  const approvalStatus = realStudentData?.approval_status || 'pending';

  // Determine institution type and name from database fields
  const institutionType = isSchoolStudent ? "School" : "University";
  const institutionName = realStudentData?.college_school_name ||
    realStudentData?.university ||
    realStudentData?.university_main ||
    institutionType;

  // Get appropriate field/subject based on student type
  const department = isSchoolStudent
    ? (realStudentData?.branch_field || "Science Stream") // For school students
    : (realStudentData?.branch_field || realStudentData?.course_name || "Computer Science"); // For university students

  // Get appropriate class/year based on student type
  const currentYear = new Date().getFullYear();
  const classYear = isSchoolStudent
    ? (realStudentData?.course_name || "Grade 12") // For school students
    : `Class of ${realStudentData?.expectedGraduationDate ?
      new Date(realStudentData.expectedGraduationDate).getFullYear() :
      currentYear + 1}`; // For university students

  // Get social media links from students table (actual column names)
  const socialLinks = {
    github: realStudentData?.github_link,
    portfolio: realStudentData?.portfolio_link,
    linkedin: realStudentData?.linkedin_link,
    twitter: realStudentData?.twitter_link,
    instagram: realStudentData?.instagram_link,
    facebook: realStudentData?.facebook_link
  };

  // Prepare data for employability calculation - PRIORITIZE TABLE DATA OVER JSONB
  const employabilityInputData = {
    education: tableEducation.length > 0 ? tableEducation : (realStudentData?.education || []),
    technicalSkills: tableTechnicalSkills.length > 0 ? tableTechnicalSkills : (realStudentData?.technicalSkills || []),
    softSkills: tableSoftSkills.length > 0 ? tableSoftSkills : (realStudentData?.softSkills || []),
    training: tableTraining.length > 0 ? tableTraining : (realStudentData?.training || []),
    experience: tableExperience.length > 0 ? tableExperience : (realStudentData?.experience || []),
    projects: tableProjects.length > 0 ? tableProjects : (realStudentData?.projects || []),
    certificates: tableCertificates.length > 0 ? tableCertificates : (realStudentData?.certificates || [])
  };

  // Calculate dynamic employability score
  const {
    employabilityScore,
    scoreBreakdown,
    employabilityLabel,
    getScoreColor,
    getScoreBgColor
  } = useEmployabilityScore(employabilityInputData);

  // Debug logging for employability calculation and student data
  useEffect(() => {
    if (process.env.NODE_ENV === 'development') {
      console.log('🎯 Employability Score Calculation:', {
        score: employabilityScore,
        label: employabilityLabel,
        breakdown: scoreBreakdown,
        inputData: {
          education: employabilityInputData.education?.length || 0,
          technicalSkills: employabilityInputData.technicalSkills?.length || 0,
          softSkills: employabilityInputData.softSkills?.length || 0,
          training: employabilityInputData.training?.length || 0,
          experience: employabilityInputData.experience?.length || 0,
          projects: employabilityInputData.projects?.length || 0,
          certificates: employabilityInputData.certificates?.length || 0,
        }
      });

      console.log('👤 Student Data Structure:', {
        studentName,
        institutionType,
        institutionName,
        isSchoolStudent,
        isUniversityStudent,
        school_id: realStudentData?.school_id,
        school_class_id: realStudentData?.school_class_id,
        university_college_id: realStudentData?.university_college_id,
        universityId: realStudentData?.universityId,
        name_from_table: realStudentData?.name,
        name_from_profile: displayData?.name
      });
    }
  }, [
    employabilityScore,
    employabilityLabel,
    scoreBreakdown,
    employabilityInputData,
    studentName,
    institutionType,
    institutionName,
    isSchoolStudent,
    isUniversityStudent,
    realStudentData
  ]);

  // Update employability data when score changes
  useEffect(() => {
    if (realStudentData) {
      const dynamicEmployabilityData = {
        employabilityScore: employabilityScore,
        level: employabilityLabel,
        label: employabilityLabel,
        breakdown: scoreBreakdown
      };

      setEmployabilityData(dynamicEmployabilityData);

      // Generate badges based on student data
      const badges = generateBadges(realStudentData);
      setEarnedBadges(badges);
    } else {
      // Use default score when no data available
      setEmployabilityData(getDefaultEmployabilityScore());
      setEarnedBadges([]);
    }
  }, [
    realStudentData,
    employabilityScore,
    employabilityLabel,
    scoreBreakdown,
    tableEducation,
    tableTechnicalSkills,
    tableSoftSkills,
    tableTraining,
    tableExperience,
    tableProjects,
    tableCertificates
  ]);

  // Determine institution from relationships (school_id or university_college_id)
  const institutionName = React.useMemo(() => {
    if (realStudentData?.school_id && realStudentData?.school) {
      return realStudentData.school.name;
    } else if (realStudentData?.university_college_id && realStudentData?.universityCollege) {
      const college = realStudentData.universityCollege;
      const university = college.universities;
      // Show both college and university name
      return university?.name ? `${college.name} - ${university.name}` : college.name;
    }
    // Fallback to profile.university if no institutional linkage
    return displayData?.university || "Institution";
  }, [realStudentData, displayData]);

  // Debug: Log student_id from database column
  React.useEffect(() => {
    if (realStudentData) {
      console.log('🔍 Student ID from database:', realStudentData.student_id);
    }
  }, [realStudentData]);


  // Generate QR code value once and keep it constant
  const qrCodeValue = React.useMemo(() => {
    const email = studentEmail || userEmail || "student";
    return `${window.location.origin}/student/profile/${email}`;
  }, [studentEmail, userEmail]);

  // Copy link to clipboard
  const handleCopyLink = () => {
    navigator.clipboard.writeText(qrCodeValue);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  // Handle native share
  const handleShare = () => {
    if (navigator.share) {
      navigator
        .share({
          title: "My Skill Passport",
          text: "Check out my Skill Passport!",
          url: qrCodeValue,
        })
        .catch(() => {
          // If native share fails, open modal
          setShowShareModal(true);
        });
    } else {
      // Fallback to modal for desktop
      setShowShareModal(true);
    }
  };

  if (!realStudentData) {
    return (
      <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 text-yellow-700 text-center">
        No student data found. Please check your email or contact support.
      </div>
    );
  }
  // Dynamic sections based on student type
  const quickEditSections = isSchoolStudent ? [
    {
      id: "education",
      label: "Academic Records",
      icon: Award,
      color: "bg-blue-100 text-blue-700 hover:bg-blue-200",
    },
    {
      id: "training",
      label: "Courses & Training",
      icon: GraduationCap,
      color: "bg-green-100 text-green-700 hover:bg-green-200",
    },
    {
      id: "projects",
      label: "School Projects",
      icon: Briefcase,
      color: "bg-purple-100 text-purple-700 hover:bg-purple-200",
    },
    {
      id: "softSkills",
      label: "Life Skills",
      icon: Plus,
      color: "bg-orange-100 text-orange-700 hover:bg-orange-200",
    },
    {
      id: "technicalSkills",
      label: "Technical Skills",
      icon: Plus,
      color: "bg-indigo-100 text-indigo-700 hover:bg-indigo-200",
    },
  ] : [
    {
      id: "education",
      label: "Education",
      icon: Award,
      color: "bg-blue-100 text-blue-700 hover:bg-blue-200",
    },
    {
      id: "experience",
      label: "Experience",
      icon: Briefcase,
      color: "bg-purple-100 text-purple-700 hover:bg-purple-200",
    },
    {
      id: "training",
      label: "Training",
      icon: GraduationCap,
      color: "bg-green-100 text-green-700 hover:bg-green-200",
    },
    {
      id: "projects",
      label: "Projects",
      icon: Briefcase,
      color: "bg-purple-100 text-purple-700 hover:bg-purple-200",
    },
    {
      id: "softSkills",
      label: "Soft Skills",
      icon: Plus,
      color: "bg-orange-100 text-orange-700 hover:bg-orange-200",
    },
    {
      id: "technicalSkills",
      label: "Technical Skills",
      icon: Plus,
      color: "bg-indigo-100 text-indigo-700 hover:bg-indigo-200",
    },
  ];

  return (
    <div className="bg-[#f6f7fd] py-8 px-6">
      {/* Debug Component - Temporarily hidden */}
      {/* {process.env.NODE_ENV === 'development' && <EmployabilityDebugger />} */}

      <div className="max-w-7xl mx-auto">
        <div
          className="rounded-3xl shadow-2xl border-2 border-yellow-400 overflow-hidden relative"
          style={{
            background:
              "linear-gradient(135deg, #2563eb 0%, #3b82f6 50%, #5f5cff 100%)",
          }}
        >
          <div className="absolute top-0 left-0 w-full h-2 bg-gradient-to-r from-yellow-400 via-yellow-300 to-yellow-400 z-10" />
          <CardContent className="p-8 relative z-10">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-start mt-5 md-mt-10 ">
              {/* Left Column - Profile Info */}
              <div className="space-y-6">
                {/* Profile Icon with Badge */}
                <div className="flex items-start gap-4">
                  <div className="relative">
                    <div className="w-16 h-16 rounded-full bg-gradient-to-br from-blue-600 to-purple-700 flex items-center justify-center shadow-lg border-2 border-white">
                      <GraduationCap className="w-8 h-8 text-white" />
                    </div>
                    <div className="absolute -bottom-1 -right-1 w-6 h-6 bg-yellow-400 rounded-full border-2 border-white flex items-center justify-center shadow-md">
                      <Award className="w-3 h-3 text-purple-700" />
                    </div>
                  </div>
                  <div className="flex-1 pt-1">
                    <div className="flex items-center gap-3 flex-wrap">
                      <h1 className="text-3xl font-bold text-white drop-shadow-lg">
                        {studentName}
                      </h1>
                      {/* Approval Status Badge */}
                      {(approvalStatus === 'approved') ? (
                        <Badge className="bg-green-500 text-white border-0 px-3 py-1.5 text-xs font-semibold rounded-full shadow-lg flex items-center gap-1.5 animate-in fade-in duration-300">
                          <CheckCircle className="w-3.5 h-3.5" />
                          Approved
                        </Badge>
                      ) : (
                        <Badge className="bg-amber-400 text-amber-900 border-0 px-3 py-1.5 text-xs font-semibold rounded-full shadow-lg flex items-center gap-1.5 animate-in fade-in duration-300">
                          <Clock className="w-3.5 h-3.5" />
                          Pending
                        </Badge>
                      )}
                    </div>
                  </div>
                </div>

                {/* School/University and Student ID */}
                <div className="space-y-2 ml-1">
                  <div className="flex items-center gap-2 text-white">
                    <Briefcase className="w-4 h-4" />
                    <span className="font-medium">
                      {institutionName}
                    </span>
                  </div>
                  {/* <div className="flex items-center gap-2 text-white">
                    <CreditCard className="w-4 h-4" />
                    <span>
                      Student ID: {studentId_display}
                    </span>
                  </div> */}
                </div>

                {/* Tags */}
                <div className="flex flex-wrap gap-3 ml-1">
                  <Badge className="bg-white text-purple-700 border-0 px-4 py-1.5 text-sm font-medium rounded-full shadow-md hover:scale-105 transition-transform">
                    {department}
                  </Badge>
                  <Badge className="bg-white text-pink-600 border-0 px-4 py-1.5 text-sm font-medium rounded-full shadow-md hover:scale-105 transition-transform">
                    {classYear}
                  </Badge>
                </div>

                {/* Digital Badges */}
                <DigitalBadges
                  earnedBadges={earnedBadges}
                  onBadgeHover={(index, rect) => setHoveredBadgeData({ index, rect })}
                  onBadgeLeave={() => setHoveredBadgeData(null)}
                  onBadgeClick={(badge) => {
                    setSelectedBadge(badge);
                    setShowBadgeModal(true);
                  }}
                />

                {/* Social Media Links - Modern Design */}
                {(socialLinks.github ||
                  socialLinks.portfolio ||
                  socialLinks.linkedin ||
                  socialLinks.twitter ||
                  socialLinks.instagram ||
                  socialLinks.facebook) && (
                    <div className="ml-1 space-y-3">
                      <div className="flex items-center gap-2">
                        <div className="h-px flex-1 bg-gradient-to-r from-transparent via-white/30 to-transparent"></div>
                        <span className="text-xs font-medium text-white/80 px-2">
                          Connect With Me
                        </span>
                        <div className="h-px flex-1 bg-gradient-to-r from-transparent via-white/30 to-transparent"></div>
                      </div>
                      <div className="flex flex-wrap gap-2">
                        {socialLinks.github && (
                          <div className="relative group">
                            <a
                              href={
                                socialLinks.github.startsWith("http")
                                  ? socialLinks.github
                                  : `https://${socialLinks.github}`
                              }
                              target="_blank"
                              rel="noopener noreferrer"
                              className="relative overflow-hidden flex items-center justify-center w-10 h-10 rounded-full bg-gradient-to-r from-gray-800 to-gray-900 hover:from-gray-700 hover:to-gray-800 text-white transition-all duration-300 shadow-lg hover:shadow-2xl hover:scale-105 border border-gray-700 hover:border-gray-600"
                            >
                              <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent rounded-full -translate-x-full group-hover:translate-x-full transition-transform duration-700"></div>
                              <Github className="w-5 h-5 group-hover:scale-110 group-hover:rotate-12 transition-all duration-300 relative z-10" />
                            </a>
                            <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 px-2 py-1 bg-black text-white text-xs rounded opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none whitespace-nowrap z-20">
                              GitHub Profile
                            </div>
                          </div>
                        )}

                        {socialLinks.portfolio && (
                          <div className="relative group">
                            <a
                              href={
                                socialLinks.portfolio.startsWith("http")
                                  ? socialLinks.portfolio
                                  : `https://${socialLinks.portfolio}`
                              }
                              target="_blank"
                              rel="noopener noreferrer"
                              className="relative overflow-hidden flex items-center justify-center w-10 h-10 rounded-full bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white transition-all duration-300 shadow-lg hover:shadow-2xl hover:shadow-blue-500/50 hover:scale-105 border border-blue-400"
                            >
                              <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent rounded-full -translate-x-full group-hover:translate-x-full transition-transform duration-700"></div>
                              <Globe className="w-5 h-5 group-hover:scale-110 group-hover:rotate-12 transition-all duration-300 relative z-10" />
                            </a>
                            <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 px-2 py-1 bg-black text-white text-xs rounded opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none whitespace-nowrap z-20">
                              Portfolio Website
                            </div>
                          </div>
                        )}

                        {socialLinks.linkedin && (
                          <div className="relative group">
                            <a
                              href={
                                socialLinks.linkedin.startsWith("http")
                                  ? socialLinks.linkedin
                                  : `https://${socialLinks.linkedin}`
                              }
                              target="_blank"
                              rel="noopener noreferrer"
                              className="relative overflow-hidden flex items-center justify-center w-10 h-10 rounded-full bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white transition-all duration-300 shadow-lg hover:shadow-2xl hover:shadow-blue-600/50 hover:scale-105 border border-blue-500"
                            >
                              <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent rounded-full -translate-x-full group-hover:translate-x-full transition-transform duration-700"></div>
                              <Linkedin className="w-5 h-5 group-hover:scale-110 group-hover:rotate-12 transition-all duration-300 relative z-10" />
                            </a>
                            <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 px-2 py-1 bg-black text-white text-xs rounded opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none whitespace-nowrap z-20">
                              LinkedIn Profile
                            </div>
                          </div>
                        )}

                        {socialLinks.twitter && (
                          <div className="relative group">
                            <a
                              href={
                                socialLinks.twitter.startsWith("http")
                                  ? socialLinks.twitter
                                  : `https://${socialLinks.twitter}`
                              }
                              target="_blank"
                              rel="noopener noreferrer"
                              className="relative overflow-hidden flex items-center justify-center w-10 h-10 rounded-full bg-gradient-to-r from-black to-gray-900 hover:from-gray-900 hover:to-black text-white transition-all duration-300 shadow-lg hover:shadow-2xl hover:scale-105 border border-gray-700"
                            >
                              <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent rounded-full -translate-x-full group-hover:translate-x-full transition-transform duration-700"></div>
                              <Twitter className="w-5 h-5 group-hover:scale-110 group-hover:rotate-12 transition-all duration-300 relative z-10" />
                            </a>
                            <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 px-2 py-1 bg-black text-white text-xs rounded opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none whitespace-nowrap z-20">
                              Twitter/X Profile
                            </div>
                          </div>
                        )}

                        {socialLinks.instagram && (
                          <div className="relative group">
                            <a
                              href={
                                socialLinks.instagram.startsWith("http")
                                  ? socialLinks.instagram
                                  : `https://${socialLinks.instagram}`
                              }
                              target="_blank"
                              rel="noopener noreferrer"
                              className="relative overflow-hidden flex items-center justify-center w-10 h-10 rounded-full bg-gradient-to-r from-pink-500 via-purple-500 to-orange-500 hover:from-pink-600 hover:via-purple-600 hover:to-orange-600 text-white transition-all duration-300 shadow-lg hover:shadow-2xl hover:shadow-pink-500/50 hover:scale-105 border border-pink-400"
                            >
                              <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent rounded-full -translate-x-full group-hover:translate-x-full transition-transform duration-700"></div>
                              <Instagram className="w-5 h-5 group-hover:scale-110 group-hover:rotate-12 transition-all duration-300 relative z-10" />
                            </a>
                            <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 px-2 py-1 bg-black text-white text-xs rounded opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none whitespace-nowrap z-20">
                              Instagram Profile
                            </div>
                          </div>
                        )}

                        {socialLinks.facebook && (
                          <div className="relative group">
                            <a
                              href={
                                socialLinks.facebook.startsWith("http")
                                  ? socialLinks.facebook
                                  : `https://${socialLinks.facebook}`
                              }
                              target="_blank"
                              rel="noopener noreferrer"
                              className="relative overflow-hidden flex items-center justify-center w-10 h-10 rounded-full bg-gradient-to-r from-blue-700 to-blue-800 hover:from-blue-800 hover:to-blue-900 text-white transition-all duration-300 shadow-lg hover:shadow-2xl hover:shadow-blue-700/50 hover:scale-105 border border-blue-600"
                            >
                              <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent rounded-full -translate-x-full group-hover:translate-x-full transition-transform duration-700"></div>
                              <Facebook className="w-5 h-5 group-hover:scale-110 group-hover:rotate-12 transition-all duration-300 relative z-10" />
                            </a>
                            <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 px-2 py-1 bg-black text-white text-xs rounded opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none whitespace-nowrap z-20">
                              Facebook Profile
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  )}

                {/* Removed Quick Edit Buttons Section */}
              </div>

              {/* Right Column - QR Code and Score */}
              <div className="space-y-6">
                {/* QR Code Card */}
                <Card className="bg-white/5 backdrop-blur-lg border border-white/20 rounded-2xl shadow-2xl">
                  <CardContent className="p-6 text-center pt-5 md:pt-10">
                    <div className="w-28 h-28 mx-auto mb-2 bg-white rounded-xl flex items-center justify-center shadow-md p-2">
                      {/* Student QR Code */}
                      <QRCodeSVG
                        value={qrCodeValue}
                        size={100}
                        level="H"
                        includeMargin={false}
                        bgColor="#ffffff"
                        fgColor="#000000"
                      />
                    </div>
                    <button
                      onClick={() => setShowDetailsModal(true)}
                      className="text-xs text-white font-bold mt-2 mb-4 hover:text-yellow-200 transition-colors cursor-pointer"
                    >
                      PASSPORT-ID: SP-
                      {studentEmail
                        ? studentEmail.split("@")[0].toUpperCase().slice(0, 5)
                        : "SP-2024-8421"}
                    </button>

                    {/* Copy and Share Buttons */}
                    <div className="flex gap-2 justify-center">
                      <button
                        onClick={handleCopyLink}
                        className="flex items-center gap-2 px-4 py-2 bg-white/90 hover:bg-white text-purple-700 rounded-lg text-sm font-semibold transition-all shadow-md hover:shadow-lg"
                        title="Copy Link"
                      >
                        {copied ? (
                          <>
                            <Check className="w-4 h-4" />
                            <span>Copied!</span>
                          </>
                        ) : (
                          <>
                            <Copy className="w-4 h-4" />
                            <span>Copy</span>
                          </>
                        )}
                      </button>
                      <button
                        onClick={handleShare}
                        className="flex items-center gap-2 px-4 py-2 bg-yellow-400 hover:bg-yellow-300 text-purple-700 rounded-lg text-sm font-semibold transition-all shadow-md hover:shadow-lg"
                        title="Share"
                      >
                        <Share2 className="w-4 h-4" />
                        <span>Share</span>
                      </button>
                    </div>
                  </CardContent>
                </Card>

                {/* Employability Score */}
                <div className="space-y-2">
                  <div className="flex items-center gap-2 mt-2">
                    <span className="font-bold text-white text-lg">
                      Employability Score
                    </span>
                    <span className="ml-auto text-2xl font-bold text-yellow-300 drop-shadow-lg">
                      {employabilityData.employabilityScore}%
                    </span>
                  </div>
                  <div className="relative h-3 bg-white/30 rounded-full overflow-hidden backdrop-blur-sm">
                    <div
                      className="absolute top-0 left-0 h-full bg-gradient-to-r from-yellow-300 via-yellow-400 to-yellow-500 rounded-full transition-all duration-300 shadow-lg"
                      style={{
                        width: `${employabilityData.employabilityScore}%`,
                      }}
                    />
                  </div>
                  <div className="flex justify-between text-xs text-white font-medium mt-1">
                    <span>Beginner</span>
                    <span className="text-yellow-300 font-semibold">
                      {employabilityData.label}
                    </span>
                    <span>Expert</span>
                  </div>
                  {/* Score Breakdown Tooltip (Optional) */}
                  {process.env.NODE_ENV === "development" && (
                    <div className="text-xs text-white/70 mt-2 text-center">
                      Debug: Edu:{employabilityData.breakdown?.education || 0} |
                      Tech:{employabilityData.breakdown?.technicalSkills || 0} |
                      Soft:{employabilityData.breakdown?.softSkills || 0} |
                      Train:{employabilityData.breakdown?.training || 0} |
                      Exp:{employabilityData.breakdown?.experience || 0} |
                      Proj:{employabilityData.breakdown?.projects || 0} |
                      Cert:{employabilityData.breakdown?.certificates || 0}
                    </div>
                  )}
                </div>
              </div>
            </div>
          </CardContent>

          {/* Badge Hover Cards - Positioned below the hovered badge */}
          {hoveredBadgeData && earnedBadges[hoveredBadgeData.index] && (
            <div
              className="fixed z-[9999] transition-all duration-200"
              style={{
                top: hoveredBadgeData.rect.bottom + 5, // Position below the badge
                left: hoveredBadgeData.rect.left + hoveredBadgeData.rect.width / 2, // Center horizontally on the badge
                transform: 'translateX(-50%)', // Center the card
              }}
            >
              <div className="bg-white rounded-lg shadow-2xl border border-gray-200 p-4 min-w-64 max-w-xs relative">
                {/* Badge Header */}
                <div className="flex items-center gap-3 mb-3">
                  <div
                    className="w-12 h-12 rounded-full flex items-center justify-center text-2xl shadow-sm"
                    style={{
                      backgroundColor: `${earnedBadges[hoveredBadgeData.index].color}20`,
                      color: earnedBadges[hoveredBadgeData.index].color
                    }}
                  >
                    {earnedBadges[hoveredBadgeData.index].icon}
                  </div>
                  <div>
                    <h3 className="font-semibold text-gray-900 text-sm">{earnedBadges[hoveredBadgeData.index].name}</h3>
                    <p className="text-xs text-gray-500 capitalize">{earnedBadges[hoveredBadgeData.index].category}</p>
                  </div>
                </div>

                {/* Badge Description */}
                <p className="text-xs text-gray-600 leading-relaxed mb-3">{earnedBadges[hoveredBadgeData.index].description}</p>

                {/* Earned Date */}
                <div className="text-xs text-gray-400 border-t border-gray-100 pt-2">
                  Earned {new Date(earnedBadges[hoveredBadgeData.index].earnedAt).toLocaleDateString()}
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Share Modal */}
      {showShareModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
          <div className="bg-white rounded-2xl shadow-2xl p-6 w-full max-w-md mx-4 relative animate-fade-in-up">
            <button
              className="absolute top-4 right-4 text-gray-400 hover:text-gray-700 text-2xl font-bold transition-colors"
              onClick={() => setShowShareModal(false)}
              aria-label="Close"
            >
              ×
            </button>
            <h2 className="text-xl font-bold mb-6 text-center text-gray-800">
              Share Your Skill Passport
            </h2>

            <div className="space-y-4">
              {/* Social Media Share Buttons */}
              <div className="grid grid-cols-2 gap-3">
                {/* WhatsApp */}
                <a
                  href={`https://wa.me/?text=${encodeURIComponent(
                    "Check out my Skill Passport: " + qrCodeValue
                  )}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center justify-center gap-2 px-4 py-3 bg-green-500 hover:bg-green-600 text-white rounded-lg font-semibold transition-colors shadow-md"
                >
                  <svg
                    className="w-5 h-5"
                    fill="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413Z" />
                  </svg>
                  <span>WhatsApp</span>
                </a>

                {/* LinkedIn */}
                <a
                  href={`https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(
                    qrCodeValue
                  )}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center justify-center gap-2 px-4 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-semibold transition-colors shadow-md"
                >
                  <svg
                    className="w-5 h-5"
                    fill="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433c-1.144 0-2.063-.926-2.063-2.065 0-1.138.92-2.063 2.063-2.063 1.14 0 2.064.925 2.064 2.063 0 1.139-.925 2.065-2.064 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z" />
                  </svg>
                  <span>LinkedIn</span>
                </a>

                {/* Twitter/X */}
                <a
                  href={`https://twitter.com/intent/tweet?text=${encodeURIComponent(
                    "Check out my Skill Passport!"
                  )}&url=${encodeURIComponent(qrCodeValue)}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center justify-center gap-2 px-4 py-3 bg-black hover:bg-gray-800 text-white rounded-lg font-semibold transition-colors shadow-md"
                >
                  <svg
                    className="w-5 h-5"
                    fill="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
                  </svg>
                  <span>Twitter</span>
                </a>

                {/* Email */}
                <a
                  href={`mailto:?subject=${encodeURIComponent(
                    "Check out my Skill Passport"
                  )}&body=${encodeURIComponent(
                    "Here is my Skill Passport: " + qrCodeValue
                  )}`}
                  className="flex items-center justify-center gap-2 px-4 py-3 bg-red-500 hover:bg-red-600 text-white rounded-lg font-semibold transition-colors shadow-md"
                >
                  <svg
                    className="w-5 h-5"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    viewBox="0 0 24 24"
                  >
                    <path d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                  </svg>
                  <span>Email</span>
                </a>
              </div>

              {/* Copy Link */}
              <div className="pt-4 border-t border-gray-200">
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Or copy link:
                </label>
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={qrCodeValue}
                    readOnly
                    className="flex-1 px-4 py-2 border border-gray-300 rounded-lg bg-gray-50 text-gray-700 text-sm"
                    onFocus={(e) => e.target.select()}
                  />
                  <button
                    onClick={handleCopyLink}
                    className="px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-lg font-semibold transition-colors shadow-md"
                  >
                    {copied ? (
                      <Check className="w-5 h-5" />
                    ) : (
                      <Copy className="w-5 h-5" />
                    )}
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ================= STUDENT DETAILS MODAL ================= */}
      {showDetailsModal && (
        <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/60 backdrop-blur-sm animate-fade-in p-4">
          <div className="bg-white rounded-3xl shadow-2xl p-4 sm:p-6 w-full max-w-sm sm:max-w-lg mx-4 relative max-h-[90vh] overflow-y-auto border border-gray-100">
            {/* Close Button */}
            <button
              className="absolute top-3 right-4 text-gray-400 hover:text-gray-700 text-2xl font-light transition-all"
              onClick={() => setShowDetailsModal(false)}
              aria-label="Close"
            >
              ×
            </button>

            {/* Header */}
            <div className="text-center mb-6">
              <h2 className="text-2xl font-bold text-gray-900">🎓 Student Details</h2>
              <p className="text-sm text-gray-500">Overview of student profile and progress</p>
            </div>

            {/* Profile Info */}
            <div className="flex items-center gap-4 p-4 bg-gradient-to-r from-blue-50 to-indigo-50 rounded-2xl shadow-sm">
              <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-blue-600 to-purple-700 flex items-center justify-center shadow-lg border-2 border-white">
                <GraduationCap className="w-8 h-8 text-white" />
              </div>
              <div>
                <h3 className="text-lg font-semibold text-gray-900">
                  {studentName}
                </h3>
                <p className="text-sm text-gray-600">{institutionName}</p>
              </div>
            </div>

            {/* Details Grid */}
            <div className="mt-6 grid grid-cols-1 sm:grid-cols-2 gap-4">
              <DetailItem label="Student ID" value={displayData.passportId || displayData.studentId || "N/A"} />
              <DetailItem label="Department" value={displayData.department || displayData.degree || "Computer Science"} />
              <DetailItem label="Class Year" value={displayData.classYear || "Class of 2025"} />
              <DetailItem label="Employability Score" value={`${employabilityData.employabilityScore}%`} highlight />
              <DetailItem label="Level" value={employabilityData.label} />
            </div>

            {/* Badges Info */}
            {earnedBadges.length > 0 && (
              <div className="mt-6 border-t border-gray-200 pt-4">
                <div className="flex items-center gap-2 mb-2">
                  <Award className="w-4 h-4 text-yellow-500" />
                  <span className="text-sm font-semibold text-gray-700">Achievements Earned</span>
                </div>
                <p className="text-sm text-gray-600">
                  {earnedBadges.length} badge{earnedBadges.length !== 1 ? "s" : ""} earned
                </p>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ================= BADGE DETAILS MODAL ================= */}
      {showBadgeModal && selectedBadge && (
        <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/60 backdrop-blur-sm animate-fade-in p-4">
          <div className="bg-white rounded-3xl shadow-2xl w-full max-w-sm sm:max-w-xl relative overflow-hidden border border-gray-100">
            {/* Header */}
            <div
              className="relative px-4 sm:px-8 py-4 sm:py-6 text-white"
              style={{
                background: `linear-gradient(135deg, ${selectedBadge.color} 0%, ${selectedBadge.color}cc 100%)`,
              }}
            >
              <button
                className="absolute top-4 right-4 text-white/80 hover:text-white text-2xl font-light transition-all"
                onClick={() => setShowBadgeModal(false)}
                aria-label="Close"
              >
                ×
              </button>

              <div className="flex items-center gap-5">
                <div className="w-20 h-20 rounded-2xl bg-white/20 backdrop-blur-sm flex items-center justify-center text-4xl shadow-lg border border-white/30">
                  {selectedBadge.icon}
                </div>
                <div>
                  <h2 className="text-2xl font-bold">{selectedBadge.name}</h2>
                  <p className="text-white/90 text-sm uppercase tracking-wide font-medium">
                    {selectedBadge.category} Achievement
                  </p>
                </div>
              </div>
            </div>

            {/* Content */}
            <div className="px-4 sm:px-8 py-4 sm:py-6 space-y-6">
              {/* Overview */}
              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-2">Achievement Overview</h3>
                <p className="text-sm text-gray-700 leading-relaxed">{selectedBadge.description}</p>
              </div>

              {/* Earned Date */}
              <div className="bg-gray-50 rounded-2xl p-4 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-purple-100 flex items-center justify-center">
                    <Award className="w-5 h-5 text-purple-600" />
                  </div>
                  <div>
                    <p className="text-sm font-medium text-gray-900">Earned On</p>
                    <p className="text-xs text-gray-600">Achievement Date</p>
                  </div>
                </div>
                <p className="text-sm font-semibold text-gray-900">
                  {new Date(selectedBadge.earnedAt).toLocaleDateString("en-US", {
                    month: "short",
                    day: "numeric",
                    year: "numeric",
                  })}
                </p>
              </div>

              {/* Criteria (if any) */}
              {selectedBadge.criteriaText && (
                <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-2xl p-4 border border-blue-100">
                  <h3 className="text-lg font-semibold text-blue-900 mb-2">Achievement Criteria</h3>
                  <p className="text-sm text-blue-800 leading-relaxed">{selectedBadge.criteriaText}</p>
                </div>
              )}

              {/* Footer */}
              <div className="pt-4 border-t border-gray-100">
                <button
                  onClick={() => setShowBadgeModal(false)}
                  className="w-full bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 text-white font-semibold py-3 rounded-2xl shadow-lg hover:shadow-xl transform hover:scale-[1.02] transition-all duration-300"
                >
                  Close Details
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ProfileHeroEdit;
