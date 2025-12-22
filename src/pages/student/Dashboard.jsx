import React, { useState, useEffect, useMemo } from "react";
import { useLocation } from "react-router-dom";
import { motion } from "motion/react";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "../../components/Students/components/ui/card";
import { Button } from "../../components/Students/components/ui/button";
import { Badge } from "../../components/Students/components/ui/badge";
import { LampContainer } from "../../components/Students/components/ui/lamp";
import {
  TrendingUp,
  CheckCircle,
  Star,
  ExternalLink,
  Edit,
  Calendar,
  Award,
  Eye,
  QrCode,
  Medal,
  Briefcase,
  MapPin,
  Clock,
  Building2,
  Sparkles,
  Target,
  BookOpen,
  Trophy,
  ChevronRight,
  Link,
  Github,
  Presentation,
  Video,
  File,
  FileText,
  ClipboardList,
  GraduationCap,
  PresentationIcon,
  Rocket,
  Cpu,
  Users2,
  Lightbulb,
  BarChart3,
} from "lucide-react";
import {
  ChartBarIcon,
  RectangleStackIcon,
} from "@heroicons/react/24/outline";
import {
  suggestions,
  educationData,
  trainingData,
  experienceData,
  technicalSkills,
  softSkills,
} from "../../components/Students/data/mockData";
import {
  EducationEditModal,
  TrainingEditModal,
  ExperienceEditModal,
  SkillsEditModal,
  ProjectsEditModal,
  CertificatesEditModal,
} from "../../components/Students/components/ProfileEditModals";
import { useStudentDataByEmail } from "../../hooks/useStudentDataByEmail";
import { useOpportunities } from "../../hooks/useOpportunities";
import { useStudentRealtimeActivities } from "../../hooks/useStudentRealtimeActivities";
import { useAIRecommendations } from "../../hooks/useAIRecommendations";
import { supabase } from "../../lib/supabaseClient";
import { useStudentMessageNotifications } from "../../hooks/useStudentMessageNotifications";
import { useStudentUnreadCount } from "../../hooks/useStudentMessages";
import { Toaster } from "react-hot-toast";
import AchievementsTimeline from "../../components/Students/components/AchievementsTimeline";
import RecentUpdatesCard from "../../components/Students/components/RecentUpdatesCard";
import { useStudentAchievements } from "../../hooks/useStudentAchievements";
import { useNavigate } from "react-router-dom";
import { useStudentLearning } from "../../hooks/useStudentLearning";
import { useStudentCertificates } from "../../hooks/useStudentCertificates";
import { useStudentProjects } from "../../hooks/useStudentProjects";
import AnalyticsView from "../../components/Students/components/AnalyticsView";
import { useAssessmentRecommendations } from "../../hooks/useAssessmentRecommendations";
import TrainingRecommendations from "../../components/Students/components/TrainingRecommendations";
import { calculateEmployabilityScore } from "../../utils/employabilityCalculator";
// Debug utilities removed for production cleanliness

const StudentDashboard = () => {
  const location = useLocation();
  const navigate = useNavigate();

  // State for view toggle (dashboard or analytics)
  const [activeView, setActiveView] = useState('dashboard'); // 'dashboard' or 'analytics'

  // Check if viewing someone else's profile (from QR scan)
  const isViewingOthersProfile =
    location.pathname.includes("/student/profile/");

  // For sticky Recent Updates: show only one when Suggested Next Steps touches it
  const [showAllRecentUpdates, setShowAllRecentUpdates] = useState(false);
  // Remove sticky when showing all
  const [recentUpdatesSticky, setRecentUpdatesSticky] = useState(true);
  const [recentUpdatesCollapsed, setRecentUpdatesCollapsed] = useState(false);

  // Intersection observer for Suggested Next Steps and Recent Updates
  const recentUpdatesRef = React.useRef(null);
  const suggestedNextStepsRef = React.useRef(null);

  useEffect(() => {
    if (!recentUpdatesRef.current || !suggestedNextStepsRef.current) return;
    const handleScroll = () => {
      const recentRect = recentUpdatesRef.current.getBoundingClientRect();
      const suggestedRect =
        suggestedNextStepsRef.current.getBoundingClientRect();
      // If bottom of Recent Updates is below top of Suggested Next Steps (they touch/overlap)
      if (recentRect.bottom >= suggestedRect.top) {
        setRecentUpdatesCollapsed(true);
      } else {
        setRecentUpdatesCollapsed(false);
      }
    };
    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);
  // Navigation state for card ordering
  const [activeNavItem, setActiveNavItem] = useState(() => {
    // Check if coming from Header nav
    const storedNav = localStorage.getItem("dashboardActiveNav");
    return storedNav || "opportunities";
  }); // Default to opportunities

  // Clear dashboardActiveNav after using it (so future visits default to opportunities)
  useEffect(() => {
    if (localStorage.getItem("dashboardActiveNav")) {
      localStorage.removeItem("dashboardActiveNav");
    }
  }, []);

  // Use authenticated student data instead of localStorage
  // Get user email from localStorage or context (customize as needed)
  const userEmail = localStorage.getItem("userEmail");

  // Use the same hook as ProfileEditSection for fetching and updating
  const {
    studentData,
    loading: authStudentLoading,
    error: authStudentError,
    refresh,
    updateProfile,
    updateEducation,
    updateTraining,
    updateExperience,
    updateTechnicalSkills,
    updateSoftSkills,
    updateProjects,
    updateCertificates,
  } = useStudentDataByEmail(userEmail);

  // Get student ID for messaging
  const studentId = studentData?.id;

  // Fetch data from separate tables
  const {
    learning: tableTraining, // Renamed from training to learning in hook
    loading: trainingLoading,
    error: trainingError,
    refresh: refreshTraining
  } = useStudentLearning(studentId, !!studentId && !isViewingOthersProfile);

  const {
    certificates: tableCertificates,
    loading: certificatesLoading,
    error: certificatesError,
    refresh: refreshCertificates
  } = useStudentCertificates(studentId, !!studentId && !isViewingOthersProfile);

  const {
    projects: tableProjects,
    loading: projectsLoading,
    error: projectsError,
    refresh: refreshProjects
  } = useStudentProjects(studentId, !!studentId && !isViewingOthersProfile);

  // Setup message notifications with hot-toast
  useStudentMessageNotifications({
    studentId,
    enabled: !!studentId && !isViewingOthersProfile,
    playSound: true,
    onMessageReceived: () => {
      // Refresh Recent Updates to show new message activity
      setTimeout(() => {
        refreshRecentUpdates();
      }, 1000);
    },
  });

  // Get unread message count with realtime updates
  const { unreadCount } = useStudentUnreadCount(
    studentId,
    !!studentId && !isViewingOthersProfile
  );

  // Fetch achievements and badges from separate tables
  const {
    achievements,
    badges,
    loading: achievementsLoading,
  } = useStudentAchievements(studentId, userEmail);

    const {
    recommendations: assessmentRecommendations,
    loading: recommendationsLoading,
    hasAssessment,
  } = useAssessmentRecommendations(studentId, !!studentId && !isViewingOthersProfile);

  const [activeModal, setActiveModal] = useState(null);
  const [userData, setUserData] = useState({
    education: educationData,
    training: trainingData,
    experience: experienceData,
    technicalSkills: technicalSkills,
    softSkills: softSkills,
    projects: [],
    certificates: [],
  });
  const [showAllOpportunities, setShowAllOpportunities] = useState(false);
  const [showAllTraining, setShowAllTraining] = useState(false);
  const [showAllProjects, setShowAllProjects] = useState(false);
  const [showAllEducation, setShowAllEducation] = useState(false);
  const [showAllCertificates, setShowAllCertificates] = useState(false);
  const [showAllTechnicalSkills, setShowAllTechnicalSkills] = useState(false);
  const [showAllSoftSkills, setShowAllSoftSkills] = useState(false);

  // Generate QR code value once and keep it constant
  const qrCodeValue = React.useMemo(() => {
    const email = userEmail || "student";
    return `${window.location.origin}/student/profile/${email}`;
  }, [userEmail]);

  // Memoize studentSkills to prevent infinite re-renders
  const studentSkills = useMemo(() => {
    return (
      studentData?.profile?.technicalSkills?.map((skill) => skill.name) || []
    );
  }, [studentData?.profile?.technicalSkills]);

  const enabledProjects = useMemo(() => {
    // Prioritize table data over profile data
    const projectsData = Array.isArray(tableProjects) && tableProjects.length > 0
      ? tableProjects
      : userData.projects;
    if (!Array.isArray(projectsData)) return [];
    return projectsData.filter((project) => project && project.enabled !== false);
  }, [tableProjects, userData.projects]);

  const enabledCertificates = useMemo(() => {
    // Prioritize table data over profile data
    const certificatesData = Array.isArray(tableCertificates) && tableCertificates.length > 0
      ? tableCertificates
      : userData.certificates;
    if (!Array.isArray(certificatesData)) return [];
    return certificatesData.filter((cert) => cert && cert.enabled !== false);
  }, [tableCertificates, userData.certificates]);

  const verifiedExperience = useMemo(() => {
    if (!Array.isArray(userData.experience)) return [];
    return userData.experience.filter((exp) => 
      exp.enabled !== false && 
      (exp.approval_status === "verified" || exp.approval_status === "approved")
    );
  }, [userData.experience]);

  // Fetch opportunities data from Supabase
  const {
    opportunities,
    loading: opportunitiesLoading,
    error: opportunitiesError,
    refreshOpportunities,
  } = useOpportunities({
    fetchOnMount: true,
    activeOnly: false, // Changed to false to see all opportunities
    studentSkills: studentSkills,
  });

  // AI Job Recommendations - Vector-based matching with top 3 results
  const {
    recommendations: matchedJobs,
    loading: matchingLoading,
    error: matchingError,
    refreshRecommendations: refreshMatches,
    cached,
    fallback,
    trackView,
    trackApply,
    getMatchReasons,
  } = useAIRecommendations({
    studentId: studentData?.id,
    enabled: !isViewingOthersProfile,
    autoFetch: true,
    limit: 4
  });

  // Fetch recent updates data from recruitment tables (student-specific)
  const {
    activities: recentUpdates,
    isLoading: recentUpdatesLoading,
    isError: recentUpdatesError,
    refetch: refreshRecentUpdates,
    isConnected: realtimeConnected,
  } = useStudentRealtimeActivities(userEmail, 10);

  // Debug log for authentication and student data
  useEffect(() => {
    console.log({
      studentData: studentData?.id,
      loading: authStudentLoading,
      error: authStudentError,
    });
  }, [studentData, authStudentLoading, authStudentError]);

  // Debug log for opportunities
  useEffect(() => {
    console.log({
      opportunities,
      loading: opportunitiesLoading,
      error: opportunitiesError,
      count: opportunities?.length,
    });
  }, [opportunities, opportunitiesLoading, opportunitiesError]);

  // Debug log for recent updates
  useEffect(() => {
    console.log({
      recentUpdates,
      loading: recentUpdatesLoading,
      error: recentUpdatesError,
      count: recentUpdates?.length,
      userEmail,
    });
  }, [recentUpdates, recentUpdatesLoading, recentUpdatesError, userEmail]);

  // Poll for new opportunities and refresh Recent Updates
  useEffect(() => {
    if (!userEmail || isViewingOthersProfile) return;

    // Subscribe to real-time changes in opportunities table
    const channel = supabase
      .channel("opportunities-changes")
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "opportunities",
        },
        (payload) => {
          // Refresh opportunities list
          refreshOpportunities();

          // Refresh Recent Updates to show the new opportunity
          setTimeout(() => {
            console.log(
              "🔄 Refreshing Recent Updates after new opportunity..."
            );
            refreshRecentUpdates();
          }, 1000); // Small delay to ensure DB trigger has fired
        }
      )
      .on(
        "postgres_changes",
        {
          event: "UPDATE",
          schema: "public",
          table: "opportunities",
        },
        (payload) => {
          refreshOpportunities();
        }
      )
      .subscribe();

    // Cleanup subscription on unmount
    return () => {
      supabase.removeChannel(channel);
    };
  }, [userEmail, isViewingOthersProfile]);

  // Direct Supabase test
  useEffect(() => {
    const testSupabaseDirectly = async () => {
      try {
        console.log({
          url: import.meta.env.VITE_SUPABASE_URL ? "Set" : "Missing",
          key: import.meta.env.VITE_SUPABASE_ANON_KEY ? "Set" : "Missing",
        });

        const { data, error, count } = await supabase
          .from("opportunities")
          .select("*", { count: "exact" });

        // Run debug for recent updates (commented out to prevent automatic execution)
        // await debugRecentUpdates();
        console.log(
          "ℹ️ To debug recent updates, run: await window.debugRecentUpdates() in console"
        );
      } catch (err) {
        console.error("🧪 Direct test error:", err);
      }
    };

    testSupabaseDirectly();
  }, []);

  // Update userData when real student data is loaded
  useEffect(() => {
    if (studentData) {
      setUserData({
        education: Array.isArray(studentData.education)
          ? studentData.education
          : [],
        training: Array.isArray(tableTraining) && tableTraining.length > 0
          ? tableTraining
          : Array.isArray(studentData.training)
            ? studentData.training
            : [],
        experience: Array.isArray(studentData.experience)
          ? studentData.experience
          : [],
        technicalSkills: Array.isArray(studentData.technicalSkills)
          ? studentData.technicalSkills
          : [],
        softSkills: Array.isArray(studentData.softSkills)
          ? studentData.softSkills
          : [],
        projects: Array.isArray(tableProjects) && tableProjects.length > 0
          ? tableProjects
          : Array.isArray(studentData.projects)
            ? studentData.projects
            : Array.isArray(studentData.profile?.projects)
              ? studentData.profile.projects
              : [],
        certificates: Array.isArray(tableCertificates) && tableCertificates.length > 0
          ? tableCertificates
          : Array.isArray(studentData.certificates)
            ? studentData.certificates
            : Array.isArray(studentData.profile?.certificates)
              ? studentData.profile.certificates
              : [],
      });
    }
  }, [studentData, tableTraining, tableCertificates, tableProjects]);

  // Save handler with DB update logic (like ProfileEditSection)
  const handleSave = async (section, data) => {
    // Immediately update UI
    setUserData((prev) => ({
      ...prev,
      [section]: data,
    }));

    // Save to Supabase if studentData exists
    if (userEmail && studentData?.profile) {
      try {
        let result;
        switch (section) {
          case "education":
            result = await updateEducation(data);
            break;
          case "training":
            result = await updateTraining(data);
            break;
          case "experience":
            result = await updateExperience(data);
            break;
          case "technicalSkills":
            result = await updateTechnicalSkills(data);
            break;
          case "softSkills":
            result = await updateSoftSkills(data);
            break;
          case "projects":
            result = await updateProjects(data); // Use dedicated function
            break;
          case "certificates":
            result = await updateCertificates(data);
            break;
          case "personalInfo":
            result = await updateProfile(data);
            break;
          default:
            return;
        }
        if (result?.success) {
          // Refresh from database to ensure sync
          await refresh();

          // Refresh table data based on section
          if (section === 'training') {
            refreshTraining();
          } else if (section === 'certificates') {
            refreshCertificates();
          } else if (section === 'projects') {
            refreshProjects();
          }

          // Refresh Recent Updates to show the new activity
          refreshRecentUpdates();
        }
      } catch (err) {
        console.error("Error saving:", err);
      }
    }
  };

  const renderStars = (level) => {
    return [...Array(5)].map((_, i) => (
      <Star
        key={i}
        className={`w-4 h-4 ${i < level ? "fill-[#FFD700] text-[#FFD700]" : "text-gray-300"
          }`}
      />
    ));
  };

  // Helper function to get skill level text
  const getSkillLevelText = (level) => {
    if (level >= 5) return "Expert";
    if (level >= 4) return "Advanced";
    if (level >= 3) return "Intermediate";
    if (level >= 1) return "Beginner";
    return "Beginner";
  };

  // Helper function to get skill level badge color
  const getSkillLevelColor = (level) => {
    if (level >= 5) return "bg-purple-100 text-purple-700 border-purple-300";
    if (level >= 4) return "bg-blue-100 text-blue-700 border-blue-300";
    if (level >= 3) return "bg-green-100 text-green-700 border-green-300";
    if (level >= 1) return "bg-yellow-100 text-yellow-700 border-yellow-300";
    return "bg-gray-100 text-gray-700 border-gray-300";
  };

  const TruncatedText = ({ text, maxLength = 120 }) => {
    const [expanded, setExpanded] = useState(false);

    if (!text) return null;

    if (text.length <= maxLength) {
      return <p className="text-sm text-gray-700 leading-relaxed">{text}</p>;
    }

    const truncated = text.slice(0, maxLength) + "...";

    return (
      <div className="text-sm text-gray-700 leading-relaxed">
        {expanded ? text : truncated}
        <button
          onClick={() => setExpanded((v) => !v)}
          className="text-blue-600 ml-1 hover:underline font-medium text-xs"
        >
          {expanded ? "Show Less" : "Read More"}
        </button>
      </div>
    );
  };

  // Determine institution info from student data (using individual columns)
  const institutionInfo = React.useMemo(() => {
    // Debug: Log student data structure
    console.log('🏫 Institution Debug:', {
      school_id: studentData?.school_id,
      university_college_id: studentData?.university_college_id,
      university: studentData?.university, // Individual column
      college_school_name: studentData?.college_school_name, // Individual column
      school: studentData?.school,
      universityCollege: studentData?.universityCollege,
    });

    // Priority: school_id takes precedence if both exist
    if (studentData?.school_id && studentData?.school) {
      return {
        type: 'School',
        name: studentData.school.name,
        code: studentData.school.code,
        city: studentData.school.city,
        state: studentData.school.state,
      };
    } else if (studentData?.university_college_id && studentData?.universityCollege) {
      // University college with parent university info
      const college = studentData.universityCollege;
      const university = college.universities; // nested university data
      return {
        type: 'University College',
        name: college.name,
        code: college.code,
        universityName: university?.name,
        city: university?.district, // Location comes from parent university
        state: university?.state,
      };
    } else if (studentData?.university || studentData?.college_school_name) {
      // Fallback to individual columns if no foreign key relationships
      return {
        type: 'Institution',
        name: studentData.college_school_name || studentData.university,
        code: 'N/A',
        city: studentData.city,
        state: studentData.state,
      };
    }

    // Fallback: Show error if ID exists but data is null (broken foreign key)
    if (studentData?.school_id && !studentData?.school) {
      console.error('⚠️ School ID exists but school data is null. School may have been deleted.');
      return {
        type: 'School',
        name: 'School Not Found',
        code: 'N/A',
        city: null,
        state: null,
        error: true,
      };
    }

    return null;
  }, [studentData]);

  // Calculate employability score
  const employabilityData = useMemo(() => {
    if (!studentData) return null;
    
    // Prepare data with all required fields from separate tables
    const dataForCalculation = {
      ...studentData,
      education: studentData.education || [],
      training: tableTraining || studentData.training || [],
      experience: studentData.experience || [],
      technicalSkills: studentData.technicalSkills || [],
      softSkills: studentData.softSkills || [],
      projects: tableProjects || studentData.projects || [],
      certificates: tableCertificates || studentData.certificates || [],
    };
    
    return calculateEmployabilityScore(dataForCalculation);
  }, [studentData, tableTraining, tableProjects, tableCertificates]);

  // Card components for dynamic ordering
  const allCards = {
    // institution: institutionInfo && (
    //   <Card
    //     key="institution"
    //     className="h-full bg-gradient-to-br from-indigo-50 to-blue-50 rounded-xl border-2 border-indigo-200 hover:border-indigo-400 transition-all duration-200 shadow-md hover:shadow-lg"
    //   >
    //     <CardHeader className="px-6 py-4 border-b border-indigo-100">
    //       <CardTitle className="flex items-center gap-3">
    //         <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-indigo-500 to-blue-500 flex items-center justify-center shadow-md">
    //           <Building2 className="w-5 h-5 text-white" />
    //         </div>
    //         <span className="text-lg font-semibold text-gray-900">
    //           {institutionInfo.type}
    //         </span>
    //       </CardTitle>
    //     </CardHeader>
    //     <CardContent className="p-6">
    //       <div className="space-y-4">
    //         <div>
    //           <h3 className="text-2xl font-bold text-gray-900 mb-1">
    //             {institutionInfo.name}
    //           </h3>
    //           {institutionInfo.universityName && (
    //             <p className="text-sm text-gray-600 mb-1">
    //               {institutionInfo.universityName}
    //             </p>
    //           )}
    //           {institutionInfo.code && (
    //             <p className="text-sm text-indigo-600 font-medium">
    //               Code: {institutionInfo.code}
    //             </p>
    //           )}
    //         </div>
    //         {(institutionInfo.city || institutionInfo.state) && (
    //           <div className="flex items-center gap-2 text-gray-600">
    //             <MapPin className="w-4 h-4" />
    //             <span className="text-sm">
    //               {[institutionInfo.city, institutionInfo.state]
    //                 .filter(Boolean)
    //                 .join(', ')}
    //             </span>
    //           </div>
    //         )}
    //       </div>
    //     </CardContent>
    //   </Card>
    // ),
    employability: employabilityData && (
      <Card
        key="employability"
        className="h-full bg-gradient-to-br from-purple-50 to-pink-50 rounded-xl border-2 border-purple-200 hover:border-purple-400 transition-all duration-200 shadow-md hover:shadow-lg"
      >
        <CardHeader className="px-6 py-4 border-b border-purple-100">
          <CardTitle className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center shadow-md">
              <TrendingUp className="w-5 h-5 text-white" />
            </div>
            <span className="text-lg font-semibold text-gray-900">
              Employability Score
            </span>
          </CardTitle>
        </CardHeader>
        <CardContent className="p-6">
          <div className="space-y-6">
            {/* Main Score Display */}
            <div className="text-center">
              <div className="relative inline-flex items-center justify-center">
                <svg className="w-32 h-32 transform -rotate-90">
                  <circle
                    cx="64"
                    cy="64"
                    r="56"
                    stroke="#E5E7EB"
                    strokeWidth="8"
                    fill="none"
                  />
                  <circle
                    cx="64"
                    cy="64"
                    r="56"
                    stroke="url(#gradient)"
                    strokeWidth="8"
                    fill="none"
                    strokeDasharray={`${(employabilityData.employabilityScore / 100) * 351.86} 351.86`}
                    strokeLinecap="round"
                    className="transition-all duration-1000"
                  />
                  <defs>
                    <linearGradient id="gradient" x1="0%" y1="0%" x2="100%" y2="100%">
                      <stop offset="0%" stopColor="#A855F7" />
                      <stop offset="100%" stopColor="#EC4899" />
                    </linearGradient>
                  </defs>
                </svg>
                <div className="absolute inset-0 flex flex-col items-center justify-center">
                  <span className="text-4xl font-bold text-gray-900">
                    {employabilityData.employabilityScore}
                  </span>
                  <span className="text-sm text-gray-600">/ 100</span>
                </div>
              </div>
              <div className="mt-4">
                <Badge className={`text-sm px-4 py-1 ${
                  employabilityData.employabilityScore >= 85 ? 'bg-green-100 text-green-700' :
                  employabilityData.employabilityScore >= 70 ? 'bg-blue-100 text-blue-700' :
                  employabilityData.employabilityScore >= 50 ? 'bg-yellow-100 text-yellow-700' :
                  'bg-orange-100 text-orange-700'
                }`}>
                  {employabilityData.label}
                </Badge>
                <p className="text-sm text-gray-600 mt-2 font-medium">
                  {employabilityData.level}
                </p>
              </div>
            </div>

            {/* Category Breakdown */}
            <div className="space-y-3">
              <h4 className="text-sm font-semibold text-gray-700 flex items-center gap-2">
                <BarChart3 className="w-4 h-4" />
                Skill Categories
              </h4>
              {[
                { name: 'Foundational', value: employabilityData.breakdown.foundational, icon: GraduationCap, color: 'bg-blue-500' },
                { name: '21st Century', value: employabilityData.breakdown.century21, icon: Lightbulb, color: 'bg-purple-500' },
                { name: 'Digital', value: employabilityData.breakdown.digital, icon: Cpu, color: 'bg-green-500' },
                { name: 'Behavioral', value: employabilityData.breakdown.behavior, icon: Users2, color: 'bg-yellow-500' },
                { name: 'Career', value: employabilityData.breakdown.career, icon: Briefcase, color: 'bg-pink-500' },
              ].map((category) => (
                <div key={category.name} className="space-y-1">
                  <div className="flex items-center justify-between text-xs">
                    <span className="flex items-center gap-1.5 text-gray-700 font-medium">
                      <category.icon className="w-3.5 h-3.5" />
                      {category.name}
                    </span>
                    <span className="font-semibold text-gray-900">{category.value}%</span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div
                      className={`${category.color} h-2 rounded-full transition-all duration-500`}
                      style={{ width: `${category.value}%` }}
                    />
                  </div>
                </div>
              ))}
              {employabilityData.breakdown.bonus > 0 && (
                <div className="pt-2 border-t border-purple-200">
                  <div className="flex items-center justify-between text-xs">
                    <span className="flex items-center gap-1.5 text-purple-700 font-semibold">
                      <Sparkles className="w-3.5 h-3.5" />
                      Bonus Points
                    </span>
                    <span className="font-bold text-purple-700">+{employabilityData.breakdown.bonus}</span>
                  </div>
                </div>
              )}
            </div>

            {/* Action Button */}
            <Button
              onClick={() => navigate('/student/profile')}
              variant="outline"
              className="w-full border-purple-300 text-purple-700 hover:bg-purple-50"
            >
              Improve Your Score
              <ChevronRight className="w-4 h-4 ml-2" />
            </Button>
          </div>
        </CardContent>
      </Card>
    ),
    assessment: (
      <Card
        key="assessment"
        className="h-full bg-white rounded-xl border border-gray-200 hover:border-blue-300 hover:shadow-lg transition-all duration-200 shadow-sm"
      >
        <CardHeader className="px-6 py-5 bg-gradient-to-r from-blue-50 to-indigo-50 border-b border-blue-100 rounded-t-xl">
          <div className="flex items-center w-full justify-between">
            <CardTitle className="flex items-center gap-3 m-0 p-0">
              <div className="p-2 rounded-lg bg-blue-600">
                <ClipboardList className="w-6 h-6 text-white" />
              </div>
              <span className="text-lg font-bold text-gray-800">
                Assessment
              </span>
            </CardTitle>
            <Badge className="bg-gradient-to-r from-blue-100 to-indigo-100 text-white p-1 rounded-full shadow-sm">
              <Star className="w-6 h-6 fill-[#FBBF24]" />
            </Badge>
          </div>
        </CardHeader>
        <CardContent className="p-8 space-y-4">
          <p className="text-gray-900 text-base leading-normal font-medium">
            Take our comprehensive assessment to discover your strengths and get a personalized career roadmap.
          </p>

          {/*<div className="flex items-center gap-4 text-xs text-gray-900 font-medium">
            <div className="flex items-center gap-1.5 bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-200 px-3 py-1.5 rounded-lg shadow-sm">
              <Target className="w-4 h-4 text-blue-600" />
              <span className="font-semibold">Skill Analysis</span>
            </div>
          </div>*/}

          <div className="flex justify-center py-4">
            <Button
              onClick={() => navigate(hasAssessment ? "/student/assessment/result" : "/student/assessment/test")}
              className="w-auto bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white font-semibold text-smshadow-md hover:shadow-lg transform hover:scale-105 transition-all duration-200 py-4"
            >
              {hasAssessment ? "View Report" : "Start Assessment"}
              <ChevronRight className="w-5 h-5 ml-2" />
            </Button>
          </div>

          {/* Conditional content below Start Assessment button */}
          {!hasAssessment ? (
            // Show detailed assessment info when NOT completed
            <div className="mt-6 pt-6 border-t-2 border-gray-200">
              <p className="text-gray-900 text-sm leading-relaxed mb-4 font-medium">
                Take this comprehensive assessment to uncover your strengths, identify areas for growth, and explore potential opportunities tailored to you. Gain insights that can help guide your learning, career, or personal development journey.
              </p>

              <div className="bg-gradient-to-r from-blue-50 to-indigo-50 border-l-4 border-l-blue-500 rounded-lg p-5 mb-4 shadow-sm">
                <h4 className="text-base font-bold text-gray-900 mb-3 flex items-center gap-2">
                  <Sparkles className="w-4 h-4 text-blue-600" />
                  Why Take This Assessment?
                </h4>
                <ul className="space-y-3 text-sm text-gray-900">
                  <li className="flex items-start gap-3">
                    <CheckCircle className="w-5 h-5 text-blue-600 mt-0.5 flex-shrink-0" />
                    <span className="font-medium">Understand your unique strengths and skills</span>
                  </li>
                  <li className="flex items-start gap-3">
                    <CheckCircle className="w-5 h-5 text-blue-600 mt-0.5 flex-shrink-0" />
                    <span className="font-medium">Identify opportunities for growth and improvement</span>
                  </li>
                  <li className="flex items-start gap-3">
                    <CheckCircle className="w-5 h-5 text-blue-600 mt-0.5 flex-shrink-0" />
                    <span className="font-medium">Get insights that can help guide your career or personal goals</span>
                  </li>
                </ul>
              </div>

              <p className="text-sm text-gray-900 italic font-medium bg-gray-50 p-3 rounded-lg border border-gray-200">
                💡 It's simple, quick, and tailored just for you—discover more about yourself today!
              </p>
            </div>
          ) : (
            // Show Career AI Tools when assessment completed
            <div className="mt-6 pt-6 border-t-2 border-gray-200">
            <h3 className="text-base font-bold text-gray-900 mb-6 flex items-center gap-2">
              <Rocket className="w-5 h-5 text-blue-600" />
              Career AI Tools
            </h3>
            <div className="grid grid-cols-2 gap-4">
              <button
                onClick={() => navigate("/student/career-ai", { state: { query: 'What jobs match my skills and experience?' } })}
                className="bg-blue-50 hover:bg-blue-100 text-blue-700 rounded-lg p-4 text-left transition-all duration-200 shadow-sm hover:shadow-md group flex items-center gap-2"
              >
                <div className="bg-blue-100 w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0 group-hover:scale-110 transition-transform">
                  <Briefcase className="w-5 h-5" />
                </div>
                <span className="font-semibold text-sm flex-1">Find Jobs</span>
                <ChevronRight className="w-4 h-4 opacity-50 group-hover:opacity-100 transition-opacity flex-shrink-0" />
              </button>

              <button
                onClick={() => navigate("/student/career-ai", { state: { query: 'Analyze my skill gaps for my target career' } })}
                className="bg-blue-50 hover:bg-blue-100 text-blue-700 rounded-lg p-4 text-left transition-all duration-200 shadow-sm hover:shadow-md group flex items-center gap-2"
              >
                <div className="bg-blue-100 w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0 group-hover:scale-110 transition-transform">
                  <Target className="w-5 h-5" />
                </div>
                <span className="font-semibold text-sm flex-1">Skill Gap Analysis</span>
                <ChevronRight className="w-4 h-4 opacity-50 group-hover:opacity-100 transition-opacity flex-shrink-0" />
              </button>

              <button
                onClick={() => navigate("/student/career-ai", { state: { query: 'Help me prepare for upcoming interviews' } })}
                className="bg-blue-50 hover:bg-blue-100 text-blue-700 rounded-lg p-4 text-left transition-all duration-200 shadow-sm hover:shadow-md group flex items-center gap-2"
              >
                <div className="bg-blue-100 w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0 group-hover:scale-110 transition-transform">
                  <BookOpen className="w-5 h-5" />
                </div>
                <span className="font-semibold text-sm flex-1">Interview Prep</span>
                <ChevronRight className="w-4 h-4 opacity-50 group-hover:opacity-100 transition-opacity flex-shrink-0" />
              </button>

              <button
                onClick={() => navigate("/student/career-ai", { state: { query: 'Review my resume and suggest improvements?' } })}
                className="bg-blue-50 hover:bg-blue-100 text-blue-700 rounded-lg p-4 text-left transition-all duration-200 shadow-sm hover:shadow-md group flex items-center gap-2"
              >
                <div className="bg-blue-100 w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0 group-hover:scale-110 transition-transform">
                  <FileText className="w-5 h-5" />
                </div>
                <span className="font-semibold text-sm flex-1">Resume Review</span>
                <ChevronRight className="w-4 h-4 opacity-50 group-hover:opacity-100 transition-opacity flex-shrink-0" />
              </button>

              <button
                onClick={() => navigate("/student/career-ai", { state: { query: 'Create a learning roadmap for my career goals' } })}
                className="bg-blue-50 hover:bg-blue-100 text-blue-700 rounded-lg p-4 text-left transition-all duration-200 shadow-sm hover:shadow-md group flex items-center gap-2"
              >
                <div className="bg-blue-100 w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0 group-hover:scale-110 transition-transform">
                  <GraduationCap className="w-5 h-5" />
                </div>
                <span className="font-semibold text-sm flex-1">Learning Path</span>
                <ChevronRight className="w-4 h-4 opacity-50 group-hover:opacity-100 transition-opacity flex-shrink-0" />
              </button>

              <button
                onClick={() => navigate("/student/career-ai", { state: { query: 'What career paths are best suited for me?' } })}
                className="bg-blue-50 hover:bg-blue-100 text-blue-700 rounded-lg p-4 text-left transition-all duration-200 shadow-sm hover:shadow-md group flex items-center gap-2"
              >
                <div className="bg-blue-100 w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0 group-hover:scale-110 transition-transform">
                  <TrendingUp className="w-5 h-5" />
                </div>
                <span className="font-semibold text-sm flex-1">Career Guidance</span>
                <ChevronRight className="w-4 h-4 opacity-50 group-hover:opacity-100 transition-opacity flex-shrink-0" />
              </button>

              <button
                onClick={() => navigate("/student/career-ai", { state: { query: 'Give me networking strategies for my field' } })}
                className="bg-blue-50 hover:bg-blue-100 text-blue-700 rounded-lg p-4 text-left transition-all duration-200 shadow-sm hover:shadow-md group flex items-center gap-2"
              >
                <div className="bg-blue-100 w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0 group-hover:scale-110 transition-transform">
                  <Users2 className="w-5 h-5" />
                </div>
                <span className="font-semibold text-sm flex-1">Networking Tips</span>
                <ChevronRight className="w-4 h-4 opacity-50 group-hover:opacity-100 transition-opacity flex-shrink-0" />
              </button>

              <button
                onClick={() => navigate("/student/career-ai", { state: { query: 'I need career advice and guidance' } })}
                className="bg-blue-50 hover:bg-blue-100 text-blue-700 rounded-lg p-4 text-left transition-all duration-200 shadow-sm hover:shadow-md group flex items-center gap-2"
              >
                <div className="bg-blue-100 w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0 group-hover:scale-110 transition-transform">
                  <Lightbulb className="w-5 h-5" />
                </div>
                <span className="font-semibold text-sm flex-1">Career Advice</span>
                <ChevronRight className="w-4 h-4 opacity-50 group-hover:opacity-100 transition-opacity flex-shrink-0" />
              </button>
            </div>
            </div>
          )}
        </CardContent>
      </Card>
    ),
    opportunities: (
      <Card
        key="opportunities"
        className="h-full bg-white rounded-xl border border-gray-200 hover:border-blue-300 hover:shadow-lg transition-all duration-200 shadow-sm"
      >
        <CardHeader className="px-6 py-5 bg-gradient-to-r from-blue-50 to-indigo-50 border-b border-blue-100 rounded-t-xl">
          <div className="flex items-center w-full justify-between">
            <CardTitle className="flex items-center gap-3 m-0 p-0">
              <div className="p-2 rounded-lg bg-blue-600">
                <Briefcase className="w-6 h-6 text-white" />
              </div>
              <span className="text-lg font-bold text-gray-800">
                Opportunities
              </span>
            </CardTitle>
            {/* <button
              className="p-2 rounded-md hover:bg-blue-100 transition-colors"
              title="View All Opportunities"
              onClick={() => navigate('/student/opportunities')}
            >
              <Eye className="w-5 h-5 text-blue-600" />
            </button> */}
          </div>
        </CardHeader>
        <CardContent className="pt-4 p-8 space-y-4">
          {/* Info message for school students */}
          {/* {(studentData?.school_id || studentData?.school_class_id) && studentData?.grade && (
            <div className="bg-blue-50 rounded-lg p-3 mb-4">
              <p className="text-sm text-blue-700">
                <span className="font-semibold">Grade {studentData.grade} Opportunities:</span> 
                {parseInt(studentData.grade) >= 6 && parseInt(studentData.grade) <= 8
                  ? " Showing internships and learning programs suitable for your grade level."
                  : parseInt(studentData.grade) >= 9
                  ? " Showing all opportunities including internships, jobs, and career opportunities."
                  : " Showing opportunities suitable for your grade level."
                }
              </p>
            </div>
          )} */}
          
          {/* Info message for college students */}
          {/* {(studentData?.university_college_id || studentData?.universityId) && (
            <div className="bg-green-50 rounded-lg p-3 mb-4">
              <p className="text-sm text-green-700">
                <span className="font-semibold">College Student Opportunities:</span> 
                Showing all available opportunities including internships, full-time jobs, part-time work, and contract positions.
              </p>
            </div>
          )} */}
          
          {(() => {
            console.log({
              loading: opportunitiesLoading,
              error: opportunitiesError,
              opportunities,
              count: opportunities?.length,
            });
            return null;
          })()}
          {opportunitiesLoading ? (
            <div className="flex justify-center items-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
            </div>
          ) : opportunitiesError ? (
            <div className="text-center py-8">
              <p className="text-red-600 mb-3 font-medium">
                Failed to load opportunities
              </p>
              <Button
                onClick={refreshOpportunities}
                size="sm"
                className="bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-all"
              >
                Retry
              </Button>
            </div>
          ) : opportunities.length === 0 ? (
            <div className="text-center py-8">
              <p className="text-slate-500 font-medium">
                No opportunities available at the moment
              </p>
            </div>
          ) : (() => {
            // Filter opportunities based on student type and grade
            const isSchoolStudent = studentData?.school_id || studentData?.school_class_id;
            const isUniversityStudent = studentData?.university_college_id || studentData?.universityId;
            const studentGrade = studentData?.grade;

            // Fallback: Check education level if database fields are not available
            const hasHighSchoolOnly = userData.education.length > 0 &&
              userData.education.every(edu =>
                edu.level && edu.level.toLowerCase().includes('high school')
              );

            let filteredOpportunities = opportunities;

            if (isSchoolStudent || hasHighSchoolOnly) {
              // School students: Filter based on grade level
              filteredOpportunities = opportunities.filter(opp => {
                const isInternship = opp.employment_type && opp.employment_type.toLowerCase() === 'internship';
                
                // For grades 6-8: Show ONLY internships
                if (studentGrade && parseInt(studentGrade) >= 6 && parseInt(studentGrade) <= 8) {
                  return isInternship;
                }
                
                // For grade 9+: Show ALL opportunities (internships + full-time + part-time, etc.)
                if (studentGrade && parseInt(studentGrade) >= 9) {
                  return true; // Show all opportunities
                }
                
                // Fallback for students without grade info: show only internships
                return isInternship;
              });
            } else if (isUniversityStudent) {
              // University/College students: Show ALL opportunities (internships + jobs)
              filteredOpportunities = opportunities; // Show everything
            }

            // Debug logging for opportunity filtering
            console.log('🎯 Opportunity Filtering Debug:', {
              isSchoolStudent,
              isUniversityStudent,
              studentGrade,
              gradeRange: studentGrade ? 
                (parseInt(studentGrade) >= 6 && parseInt(studentGrade) <= 8 ? 'Grades 6-8 (Internships Only)' :
                 parseInt(studentGrade) >= 9 ? 'Grade 9+ (All Opportunities)' : 'Other Grade') : 'No Grade',
              totalOpportunities: opportunities.length,
              filteredCount: filteredOpportunities.length,
              studentData: {
                school_id: studentData?.school_id,
                school_class_id: studentData?.school_class_id,
                university_college_id: studentData?.university_college_id,
                grade: studentData?.grade
              }
            });

            return (
              <>
                <div className="space-y-4 max-h-[600px] overflow-y-auto pr-2 blue-scrollbar">
                  {filteredOpportunities.map((opp, idx) => {
                    // Determine mode display text
                    const modeDisplay = opp.mode === 'Onsite' ? 'Offline' : opp.mode === 'Remote' ? 'Online' : opp.mode;

                    return (
                      <div
                        key={opp.id || `${opp.title}-${opp.company_name}-${idx}`}
                        className="p-5 rounded-xl bg-white border-l-4 border-l-blue-500 border border-gray-200 hover:shadow-md transition-all duration-200"
                      >
                        <h4 className="text-base font-bold text-gray-900 mb-2">
                          {opp.title}
                        </h4>

                        <div className="flex items-center justify-between gap-3 mb-3">
                          <p className="text-blue-600 text-sm leading-relaxed font-medium">
                            {opp.company_name || opp.department || opp.sector || 'Learning Opportunity'}
                          </p>
                          <Badge className="bg-gradient-to-r from-gray-100 to-gray-200 text-gray-700 text-xs px-2.5 py-0.5 rounded-full font-medium">
                            {opp.employment_type}
                          </Badge>
                        </div>

                        {/* Mode, Location and Apply Button */}
                        <div className="flex items-center justify-between gap-3">
                          {(opp.mode || opp.location) && (
                            <div className="flex items-center gap-3 text-sm text-gray-900 leading-relaxed font-medium">
                              {opp.mode && (
                                <div className="flex items-center gap-1.5">
                                  <MapPin className="w-4 h-4 text-blue-600" />
                                  <span className="font-medium">{modeDisplay}</span>
                                </div>
                              )}
                              {opp.location && opp.mode !== 'Remote' && (
                                <span>• {opp.location}</span>
                              )}
                            </div>
                          )}

                          <Button
                            size="sm"
                            onClick={() => navigate('/student/opportunities', { state: { selectedOpportunityId: opp.id } })}
                            className="w-auto bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white font-semibold px-5 py-2 text-sm rounded-lg shadow-md hover:shadow-lg transform hover:scale-105 transition-all"
                          >
                            Apply
                          </Button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </>
            );
          })()}
        </CardContent>
      </Card>
    ),
    technicalSkills: (
      <Card
        key="technicalSkills"
        className="h-full bg-white rounded-xl border border-gray-200 hover:border-blue-400 hover:shadow-xl hover:-translate-y-1 transition-all duration-200 shadow-sm"
      >
        <CardHeader className="px-6 py-5 bg-gradient-to-r from-blue-50 to-indigo-50 border-b border-blue-100 rounded-t-xl">
          <div className="flex items-center w-full justify-between">
            <CardTitle className="flex items-center gap-3 m-0 p-0">
              <div className="w-12 h-12 rounded-lg bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center shadow-md">
                <Cpu className="w-6 h-6 text-white" />
              </div>
              <span className="text-xl font-bold text-gray-900">
                Technical Skills
              </span>
            </CardTitle>
            {/* <button
              className="p-2 rounded-md hover:bg-blue-100 transition-colors"
              title="Edit Technical Skills"
              onClick={() => setActiveModal("technicalSkills")}
            >
              <Eye className="w-5 h-5 text-blue-600" />
            </button> */}
          </div>
        </CardHeader>
        <CardContent className="pt-4 p-8 space-y-4">
          {userData.technicalSkills.filter(
            (skill) => skill.enabled !== false && (skill.approval_status === 'approved' || skill.approval_status === 'verified')
          ).length === 0 ? (
            <div className="text-center py-8">
              <p className="text-gray-900 text-base leading-normal font-medium">
                No technical skills added yet
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              {(showAllTechnicalSkills
                ? userData.technicalSkills.filter(
                  (skill) => skill.enabled !== false && skill.approval_status === 'approved' || skill.approval_status === 'verified'
                )
                : userData.technicalSkills
                  .filter((skill) => skill.enabled !== false && skill.approval_status === 'approved' || skill.approval_status === 'verified')
                  .slice(0, 3)
              ).map((skill, idx) => (
              <div
                key={skill.id || `tech-skill-${idx}`}
                className="p-5 rounded-xl bg-gradient-to-r from-blue-50 to-white border-l-4 border-l-blue-500 border border-gray-200 hover:shadow-md transition-all duration-200"
              >
                <div className="flex items-start justify-between">
                  <div key={`tech-skill-info-${skill.id}`} className="flex-1">
                    <h4 className="font-semibold text-gray-900 text-base mb-1">
                      {skill.name}
                    </h4>
                    <p className="text-xs text-gray-600 font-medium mb-2">
                      {skill.category}
                    </p>
                    <div className="flex items-center gap-2">
                      <Badge
                        className={`px-3 py-1.5 text-xs font-semibold rounded-full shadow-sm border ${getSkillLevelColor(
                          skill.level
                        )}`}
                      >
                        {getSkillLevelText(skill.level)}
                      </Badge>
                    </div>

                    {/* Star Rating */}
                    <div className="flex gap-0.5">
                      {renderStars(skill.level)}
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  ),
    projects: (
      <Card
        key="projects"
        className="h-full bg-white rounded-xl border border-gray-200 hover:border-blue-400 hover:shadow-xl hover:-translate-y-1 transition-all duration-200 shadow-sm"
      >
        <CardHeader className="px-6 py-5 bg-gradient-to-r from-blue-50 to-indigo-50 border-b border-blue-100 rounded-t-xl">
          <div className="flex items-center w-full justify-between">
            <CardTitle className="flex items-center gap-3 m-0 p-0">
              <div className="w-12 h-12 rounded-lg bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center shadow-md">
                <Rocket className="w-6 h-6 text-white" />
              </div>
              <span className="text-xl font-bold text-gray-900">
                Projects/Internships
              </span>
            </CardTitle>
            {/* <button
              className="p-2 rounded-md hover:bg-blue-100 transition-colors"
              title="Manage Projects & Internships"
              onClick={() => setActiveModal("projects")}
            >
              <Eye className="w-5 h-5 text-blue-600" />
            </button> */}
          </div>
        </CardHeader>
        <CardContent className="pt-4 p-8 space-y-4">
          {enabledProjects.length === 0 ? (
            <div className="text-center py-8">
              <p className="text-gray-900 text-base leading-normal font-medium">
                No projects added yet
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              {(showAllProjects
                ? enabledProjects
                : enabledProjects.slice(0, 2)
              ).map((project, idx) => {
              const techList = Array.isArray(project.tech)
                ? project.tech
                : Array.isArray(project.technologies)
                  ? project.technologies
                  : Array.isArray(project.tech_stack)
                    ? project.tech_stack
                    : Array.isArray(project.skills)
                      ? project.skills
                      : [];

              return (
                <div
                  key={project.id || `project-${idx}`}
                  className={`p-5 rounded-xl bg-gradient-to-r from-blue-50 to-white border-l-4 border-l-blue-500 border border-gray-200 hover:shadow-md transition-all duration-200 space-y-3 ${project.enabled ? "" : "opacity-75"
                    }`}
                >
                  {/* First row: Title + Status */}
                  <div className="flex items-center justify-between gap-3">
                    <h4 className="font-semibold text-gray-900 text-base">
                      {project.title || project.name || "Untitled Project"}
                    </h4>

                    {/* Date + Status Badge */}
                    <div className="flex items-center justify-between gap-3 mb-3">
                      <p className="text-sm text-gray-900 leading-relaxed font-medium">
                        {project.duration || project.timeline || project.period || ""}
                      </p>
                      {project.status && (
                        <Badge className={`px-1 py-1 text-xs font-semibold rounded-full shadow-sm whitespace-nowrap ${
                          project.status.toLowerCase() === "completed"
                            ? "bg-green-100 text-green-600"
                            : "bg-blue-100 text-blue-600"
                        }`}>
                          {project.status}
                        </Badge>
                      )}
                    </div>

                    {/* Demo Button + GitHub Button */}
                    <div className="flex items-center justify-end gap-3">
                      {project.demo_link && (
                        <Button
                          size="sm"
                          onClick={() => window.open(project.demo_link, '_blank')}
                          className="w-auto bg-gradient-to-r from-blue-50 to-indigo-100 hover:from-blue-200 hover:to-indigo-300 text-blue-700 font-semibold px-1 py-2 text-sm rounded-lg shadow-md hover:shadow-lg transform hover:scale-105 transition-all"
                        >
                          Demo
                        </Button>
                      )}
                      {(project.github_link || project.github_url || project.github) && (
                        <Button
                          size="sm"
                          onClick={() => window.open(project.github_url || project.github_link || project.github, '_blank')}
                          className="w-auto bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white font-semibold px-2 py-2 text-sm rounded-lg shadow-md hover:shadow-lg transform hover:scale-105 transition-all"
                        >
                          <Github className="w-4 h-4" />
                          Git
                        </Button>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
            </div>
          )}
        </CardContent>
      </Card>
    ),
    education: (
      <Card
        key="education"
        className="h-full bg-white rounded-xl border border-gray-200 hover:border-blue-400 hover:shadow-xl hover:-translate-y-1 transition-all duration-200 shadow-sm"
      >
        <CardHeader className="px-6 py-5 bg-gradient-to-r from-blue-50 to-indigo-50 border-b border-blue-100 rounded-t-xl">
          <div className="flex items-center w-full justify-between">
            <CardTitle className="flex items-center gap-3 m-0 p-0">
              <div className="w-12 h-12 rounded-lg bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center shadow-md">
                <GraduationCap className="w-6 h-6 text-white" />
              </div>
              <span className="text-xl font-bold text-gray-900">
                Education
              </span>
            </CardTitle>
            {/* <button
              className="p-2 rounded-md hover:bg-blue-100 transition-colors"
              title="Edit Education"
              onClick={() => setActiveModal("education")}
            >
              <Eye className="w-5 h-5 text-blue-600" />
            </button> */}
          </div>
        </CardHeader>
        <CardContent className="pt-4 p-8 space-y-4">
          {userData.education.filter(
            (education) =>
              education.enabled !== false &&
              (education.approval_status === "verified" || education.approval_status === "approved")
          ).length === 0 ? (
            <div className="text-center py-8">
              <p className="text-gray-900 text-base leading-normal font-medium">
                No education records added yet
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              {/* Education content would go here */}
            </div>
          )}
        </CardContent>
      </Card>
    ),
    training: (
      <Card
        key="training"
        className="h-full bg-white rounded-xl border border-gray-200 hover:border-blue-300 hover:shadow-lg transition-all duration-200 shadow-sm"
      >
        <CardHeader className="px-6 py-5 bg-gradient-to-r from-blue-50 to-indigo-50 border-b border-blue-100 rounded-t-xl">
          <div className="flex items-center w-full justify-between">
            <CardTitle className="flex items-center gap-3 m-0 p-0">
              <div className="p-2 rounded-lg bg-blue-600">
                <PresentationIcon className="w-6 h-6 text-white" />
              </div>
              <span className="text-lg font-bold text-gray-800">Training</span>
            </CardTitle>
            {/* <button
              className="p-2 rounded-md hover:bg-blue-100 transition-colors"
              title="View All Courses"
              onClick={() => setActiveModal("training")}
            >
              <Eye className="w-5 h-5 text-blue-600" />
            </button> */}
          </div>
        </CardHeader>
<CardContent className="pt-4 p-8 space-y-4">
          {/* No Assessment CTA - TOP (only show when not expanded) */}
          {!hasAssessment && !recommendationsLoading && !showAllTraining && (
            <div className="bg-gradient-to-br from-blue-50 to-indigo-50 rounded-lg p-5 border-2 border-dashed border-blue-300 mb-4 shadow-sm">
              <div className="flex items-start gap-3">
                <div className="w-12 h-12 rounded-lg bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center flex-shrink-0 shadow-md">
                  <Sparkles className="w-6 h-6 text-white" />
                </div>
                <div className="flex-1">
                  <h4 className="text-base font-bold text-gray-900 mb-2">
                    Get Personalized Recommendations
                  </h4>
                  <p className="text-sm text-gray-900 mb-3 font-medium">
                    Take our assessment to receive AI-powered course recommendations tailored to your career goals and skills.
                  </p>
                  <Button
                    onClick={() => navigate("/student/assessment/test")}
                    size="sm"
                    className="bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white text-sm font-semibold shadow-md hover:shadow-lg transform hover:scale-105 transition-all"
                  >
                    Take Assessment
                    <ChevronRight className="w-4 h-4 ml-1" />
                  </Button>
                </div>
              </div>
            </div>
          )}

          {/* AI-Powered Recommendations Section */}
          {hasAssessment && assessmentRecommendations && (
            <div className="mb-6">
              <div className="max-h-[400px] overflow-y-auto pr-2">
                <TrainingRecommendations
                  recommendations={assessmentRecommendations}
                  showAll={showAllTraining}
                />
              </div>
            </div>
          )}

          {/* My Courses Section */}
          {userData.training.filter((t) => t.enabled !== false && (t.approval_status === "verified" || t.approval_status === "approved")).length > 0 && (
            <div>
              <h3 className="text-base font-bold text-gray-900 mb-4 flex items-center gap-2">
                <BookOpen className="w-5 h-5 text-blue-600" />
                My Courses
              </h3>
              <div className="space-y-3 max-h-[200px] overflow-y-auto pr-2 blue-scrollbar">
                {userData.training
                  .filter((t) => t.enabled !== false && (t.approval_status === "verified" || t.approval_status === "approved"))
                  .map((training, idx) => {
            // Calculate progress
            const statusLower = (training.status || "").toLowerCase();
            let progressValue = 0;
            if (statusLower === "completed") {
              progressValue = 100;
            } else if (training.total_modules > 0) {
              const completed = Math.min(training.completed_modules, training.total_modules);
              progressValue = Math.round((completed / training.total_modules) * 100);
            }

            return (
              <div
                key={training.id || `training-${training.course}-${idx}`}
                className="p-5 rounded-xl bg-white border-l-4 border-l-blue-500 border border-gray-200 hover:shadow-md transition-all duration-200"
              >
                {/* Header */}
                <div className="flex items-center justify-between gap-3 mb-3">
                  <h4 className="text-base font-bold text-gray-900 truncate flex-1">
                    {training.course}
                  </h4>
                  <Badge
                    className={`px-1 py-1 text-xs font-semibold rounded-full shadow-sm whitespace-nowrap ${training.status === "completed"
                      ? "bg-green-100 text-green-600"
                      : "bg-blue-100 text-blue-600"
                      }`}
                  >
                    {training.status === "completed" ? "Completed" : "Ongoing"}
                  </Badge>
                </div>

                {/* Meta info */}
                <div className="flex items-center gap-4 mb-3 text-sm text-gray-900 font-medium flex-wrap">
                  {training.provider && (
                    <div className="flex items-center gap-2">
                      <BookOpen className="w-4 h-4 text-blue-600" />
                      <span className="font-medium">{training.provider}</span>
                    </div>
                  )}
                  {training.duration && (
                    <div className="flex items-center gap-2">
                      <Calendar className="w-4 h-4 text-blue-600" />
                      <span className="font-medium">{training.duration}</span>
                    </div>
                  )}
                </div>

                {/* Progress bar */}
                {(training.total_modules > 0 || training.completed_modules > 0 || training.hours_spent > 0) && (
                  <div className="mt-3">
                    {/* Progress Header */}
                    <div className="flex justify-between items-center text-sm text-gray-900 font-medium mb-2">
                      <span>Progress</span>
                      <span className="text-blue-600 font-semibold">{progressValue}%</span>
                    </div>

                    {/* Progress Bar */}
                    <div className="w-full h-2 bg-gray-200 rounded-full overflow-hidden shadow-inner">
                      <div
                        className="h-2 bg-gradient-to-r from-blue-500 to-indigo-600 rounded-full transition-all duration-500 ease-out"
                        style={{ width: `${progressValue}%` }}
                      />
                    </div>

                    {/* Modules & Hours Info */}
                    <div className="text-xs text-gray-900 font-medium mt-2 space-x-3">
                      {training.completed_modules != null && training.total_modules != null && (
                        <span>
                          Modules: {training.completed_modules}/{training.total_modules}
                        </span>
                      )}
                      {training.hours_spent != null && <span>Hours: {training.hours_spent}</span>}
                    </div>
                  </div>
                )}

                {/* Skills */}
                {Array.isArray(training.skills) && training.skills.length > 0 && (
                  <div className="mt-4">
                    <p className="text-sm text-gray-900 font-medium mb-2">Skills Covered:</p>
                    <div className="flex flex-wrap gap-2">
                      {(training.showAllSkills ? training.skills : training.skills.slice(0, 4)).map(
                        (skill, i) => (
                          <span
                            key={`skill-${training.id}-${i}`}
                            className="px-3 py-1.5 text-xs rounded-full bg-gradient-to-r from-blue-50 to-indigo-50 text-blue-700 font-medium border border-blue-200 shadow-sm"
                          >
                            {skill}
                          </span>
                        )
                      )}
                    </div>
                    {training.skills.length > 4 && (
                      <button
                        onClick={() =>
                          setUserData((prev) => ({
                            ...prev,
                            training: prev.training.map((t) =>
                              t.id === training.id ? { ...t, showAllSkills: !t.showAllSkills } : t
                            ),
                          }))
                        }
                        className="text-xs text-blue-600 hover:text-blue-800 mt-1"
                      >
                        {training.showAllSkills
                          ? "Show Less"
                          : `Show All (${training.skills.length})`}
                      </button>
                    )}
                  </div>
                )}
              </div>
            );
          })}
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    ),
    certificates: (
      <Card
        key="certificates"
        className="h-full bg-white rounded-xl border border-gray-200 hover:border-blue-400 hover:shadow-xl hover:-translate-y-1 transition-all duration-200 shadow-sm"
      >
        <CardHeader className="px-6 py-5 bg-gradient-to-r from-blue-50 to-indigo-50 border-b border-blue-100 rounded-t-xl">
          <div className="flex items-center w-full justify-between">
            <CardTitle className="flex items-center gap-3 m-0 p-0">
              <div className="w-12 h-12 rounded-lg bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center shadow-md">
                <Medal className="w-6 h-6 text-white" />
              </div>
              <span className="text-xl font-bold text-gray-900">
                Certificates
              </span>
            </CardTitle>
            {/* <button
              className="p-2 rounded-md hover:bg-blue-100 transition-colors"
              title="Manage Certificates"
              onClick={() => setActiveModal("certificates")}
            >
              <Eye className="w-5 h-5 text-blue-600" />
            </button> */}
          </div>
        </CardHeader>
        <CardContent className="pt-4 p-8 space-y-4">
          {enabledCertificates.length === 0 ? (
            <div className="text-center py-8">
              <p className="text-slate-500 font-medium">
                No certificates uploaded yet
              </p>
            </div>
          ) : (
            <>
              {(showAllCertificates
                ? enabledCertificates
                : enabledCertificates.slice(0, 2)
              ).map((cert, idx) => {
                const certificateLink =
                  cert.link ||
                  cert.url ||
                  cert.certificateUrl ||
                  cert.credentialUrl ||
                  cert.viewUrl;
                const issuedOn =
                  cert.year || cert.date || cert.issueDate || cert.issuedOn;
                return (
                <div
                  key={cert.id || `certificate-${idx}`}
                  className={`p-5 rounded-xl bg-gradient-to-r from-blue-50 to-white border-l-4 border-l-blue-500 border border-gray-200 hover:shadow-md transition-all duration-200 space-y-3 ${cert.enabled ? "" : "opacity-75"
                    }`}
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="space-y-1">
                      <h4 className="font-semibold text-gray-900 text-base">
                        {cert.title ||
                          cert.name ||
                          cert.certificate ||
                          "Certificate"}
                      </h4>
                      <div className="flex items-center justify-between gap-3 mt-2">
                        {(cert.issuer ||
                          cert.organization ||
                          cert.institution) && (
                            <p className="text-sm text-blue-600 font-medium">
                              {cert.issuer ||
                                cert.organization ||
                                cert.institution}
                            </p>
                          )}
                        {issuedOn && (
                          <p className="text-xs text-gray-600">{issuedOn}</p>
                        )}
                      </div>
                      {cert.credentialId && (
                        <div className="text-xs text-gray-500 font-medium">
                          Credential ID: {cert.credentialId}
                        </div>
                      )}
                    </div>
                  </div>
                  {cert.description && (
                    <TruncatedText text={cert.description} maxLength={120} />
                  )}

                  {/* Icon + Organization + View Button */}
                  <div className="flex items-center justify-between gap-3">
                    <div className="flex items-center gap-2">
                      <Building2 className="w-4 h-4 text-blue-600" />
                      <p className="text-blue-600 text-sm leading-relaxed font-medium">
                        {cert.issuer ||
                          cert.organization ||
                          cert.institution ||
                          "Organization"}
                      </p>
                    </div>

                    {/* View Button */}
                    {certificateLink && (
                      <Button
                        size="sm"
                        onClick={() => window.open(certificateLink, '_blank')}
                        className="w-auto bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white font-semibold px-4 py-2 text-sm rounded-lg shadow-md hover:shadow-lg transform hover:scale-105 transition-all"
                      >
                        <ExternalLink className="w-4 h-4 mr-2" />
                        View
                      </Button>
                    )}
                  </div>
                </div>
              );
            })}
            </>
          )}
        </CardContent>
    </Card>
    ),
    experience: (
      <Card
        key="experience"
        className="h-full bg-white rounded-xl border border-gray-200 hover:border-blue-400 hover:shadow-xl hover:-translate-y-1 transition-all duration-200 shadow-sm"
      >
        <CardHeader className="px-6 py-5 bg-gradient-to-r from-blue-50 to-indigo-50 border-b border-blue-100 rounded-t-xl">
          <div className="flex items-center w-full justify-between">
            <CardTitle className="flex items-center gap-3 m-0 p-0">
              <div className="w-12 h-12 rounded-lg bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center shadow-md">
                <Building2 className="w-6 h-6 text-white" />
              </div>
              <span className="text-xl font-bold text-gray-900">
                My Experience
              </span>
            </CardTitle>
          </div>
        </CardHeader>
        <CardContent className="pt-4 p-8 space-y-4">
          {verifiedExperience.length === 0 ? (
            <div className="text-center py-8">
              <p className="text-gray-900 text-base leading-normal font-medium">
                No experience added yet
              </p>
            </div>
          ) : (
            <>
              {verifiedExperience.slice(0, 3).map((exp, index) => (
                <div
                  key={index}
                  className="p-5 rounded-xl bg-gradient-to-r from-blue-50 to-white border-l-4 border-l-blue-500 border border-gray-200 hover:shadow-md transition-all duration-200"
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <p className="font-semibold text-gray-900 text-base mb-1">
                        {exp.role}
                      </p>
                      <p className="text-blue-600 text-sm font-medium mb-2">
                        {exp.organization}
                      </p>
                      <p className="text-xs text-gray-600">{exp.duration}</p>
                    </div>
                    {(exp.approval_status === "verified" || exp.approval_status === "approved") && (
                      <Badge className="bg-green-100 text-green-700 px-2.5 py-1 rounded-md text-xs font-medium flex items-center gap-1">
                        <CheckCircle className="w-3 h-3" />
                        Verified
                      </Badge>
                    )}
                  </div>
                </div>
              ))}
              
              {verifiedExperience.length > 3 && (
                <Button
                  variant="outline"
                  onClick={() => navigate('/student/my-experience')}
                  className="w-full border border-gray-300 text-gray-700 hover:bg-gray-50 hover:border-gray-400 font-medium text-sm rounded-md transition-all"
                >
                  View All Experience
                </Button>
              )}
            </>
          )}
        </CardContent>
      </Card>
    ),
    softSkills: (
      <Card
        key="softSkills"
        className="h-full bg-white rounded-xl border border-gray-200 hover:border-blue-400 hover:shadow-xl hover:-translate-y-1 transition-all duration-200 shadow-sm"
      >
        <CardHeader className="px-6 py-5 bg-gradient-to-r from-blue-50 to-indigo-50 border-b border-blue-100 rounded-t-xl">
          <div className="flex items-center w-full justify-between">
            <CardTitle className="flex items-center gap-3 m-0 p-0">
              <div className="w-12 h-12 rounded-lg bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center shadow-md">
                <Users2 className="w-6 h-6 text-white" />
              </div>
              <span className="text-xl font-bold text-gray-900">
                Soft Skills
              </span>
            </CardTitle>
            {/* <button
              className="p-2 rounded-md hover:bg-blue-100 transition-colors"
              title="Edit Soft Skills"
              onClick={() => setActiveModal("softSkills")}
            >
              <Eye className="w-5 h-5 text-blue-600" />
            </button> */}
          </div>
        </CardHeader>
        <CardContent className="pt-4 p-8 space-y-4">
          {userData.softSkills.filter((skill) => skill.enabled !== false && (skill.approval_status === 'approved' || skill.approval_status === 'verified'))
            .length === 0 ? (
            <div className="text-center py-8">
              <p className="text-gray-900 text-base leading-normal font-medium">
                No soft skills added yet
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              {(showAllSoftSkills
                ? userData.softSkills.filter((skill) => skill.enabled !== false && (skill.approval_status === 'approved' || skill.approval_status === 'verified'))
                : userData.softSkills
                  .filter((skill) => skill.enabled !== false && (skill.approval_status === 'approved' || skill.approval_status === 'verified'))
                  .slice(0, 3)
              ).map((skill, idx) => (
                <div
                  key={skill.id || `soft-skill-${idx}`}
                  className="p-5 rounded-xl bg-gradient-to-r from-blue-50 to-white border-l-4 border-l-blue-500 border border-gray-200 hover:shadow-md transition-all duration-200"
                >
                  <div className="flex items-start justify-between">
                    <div key={`skill-info-${skill.id}`} className="flex-1">
                      <h4 className="font-semibold text-gray-900 text-base mb-1">
                        {skill.name}
                      </h4>
                      <p className="text-xs text-gray-600 mb-2">
                        {skill.description}
                      </p>
                      <div className="flex items-center gap-2">
                        <Badge
                          className={`px-3 py-1.5 text-xs font-semibold rounded-full shadow-sm border ${getSkillLevelColor(
                            skill.level
                          )}`}
                        >
                          {getSkillLevelText(skill.level)}
                        </Badge>
                      </div>

                      {/* Description */}
                      {skill.description && (
                        <div className="mb-3">
                          <p className="text-sm text-gray-600 font-medium">
                            {skill.description}
                          </p>
                        </div>
                      )}

                      {/* Star Rating */}
                      <div className="flex gap-0.5">
                        {renderStars(skill.level)}
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    ),
    achievements: (
      <></>
    ),
  };

  // Define 3x3 grid layout
  const threeByThreeCards = [
    "assessment",
    "trainings", 
    "opportunities",
    "Projects", 
    "Certificates", 
    "My experience",
    "Education", 
    "technicalSkills", 
    "softSkills"
  ];

  // Map the display names to actual card keys
  const cardNameMapping = {
    "assessment": "assessment",
    "trainings": "training",
    "opportunities": "opportunities",
    "Projects": "projects",
    "Certificates": "certificates",
    "My experience": "experience",
    "Education": "education",
    "technicalSkills": "technicalSkills",
    "softSkills": "softSkills"
  };

  const render3x3Grid = () => {
    return (
      <div className="grid grid-cols-1 md:grid-cols-3 gap-0 mb-0">
        {threeByThreeCards.map((cardName, index) => {
          const cardKey = cardNameMapping[cardName];
          const card = allCards[cardKey];
          if (!card) return null;
          
          return (
            <div key={cardName} className="h-full">
              {card}
            </div>
          );
        })}
      </div>
    );
  };

  // Utility to truncate long text and toggle full view

  return (
    <div className="min-h-screen bg-[#F8FAFC]">
      {/* Hot-toast notification container */}
      <Toaster
        position="top-right"
        toastOptions={{
          style: {
            zIndex: 9999,
          },
          duration: 5000,
        }}
        containerStyle={{
          zIndex: 9999,
        }}
      />

      <div className="w-full mx-auto">
        {/* View Switcher Tabs */}
        {!isViewingOthersProfile && (
          <div className="mb-0 flex justify-center">
            {/* Tab Navigation with Subheadings */}
            <div className="bg-white shadow-sm border-0 p-2 w-full">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                {/* Dashboard Tab */}
                <button
                  onClick={() => setActiveView('dashboard')}
                  className={`relative text-left p-4 rounded-lg transition-all ${
                    activeView === 'dashboard'
                      ? 'bg-gradient-to-r from-blue-50 to-indigo-50 shadow-md'
                      : 'bg-white hover:bg-gray-50'
                  }`}
                >
                  <div className="flex items-start gap-3">
                    <div className={`p-2 rounded-lg ${
                      activeView === 'dashboard' ? 'bg-blue-600' : 'bg-gray-100'
                    }`}>
                      <RectangleStackIcon className={`w-6 h-6 ${
                        activeView === 'dashboard' ? 'text-white' : 'text-gray-600'
                      }`} />
                    </div>
                    <div className="flex-1">
                      <h1 className={`font-bold text-lg ${
                        activeView === 'dashboard' ? 'text-blue-600' : 'text-gray-900'
                      }`}>
                        Dashboard
                      </h1>
                      <p className="text-sm text-gray-600 mt-1 whitespace-nowrap">
                        View your overview, opportunities, and achievements
                      </p>
                    </div>
                  </div>
                </button>

                {/* Analytics Tab */}
                <button
                  onClick={() => setActiveView('analytics')}
                  className={`relative text-left p-4 rounded-lg transition-all ${
                    activeView === 'analytics'
                      ? 'bg-gradient-to-r from-blue-50 to-indigo-50 shadow-md'
                      : 'bg-white hover:bg-gray-50'
                  }`}
                >
                  <div className="flex items-start gap-3">
                    <div className={`p-2 rounded-lg ${
                      activeView === 'analytics' ? 'bg-blue-600' : 'bg-gray-100'
                    }`}>
                      <ChartBarIcon className={`w-6 h-6 ${
                        activeView === 'analytics' ? 'text-white' : 'text-gray-600'
                      }`} />
                    </div>
                    <div className="flex-1">
                      <h1 className={`font-bold text-lg ${
                        activeView === 'analytics' ? 'text-blue-600' : 'text-gray-900'
                      }`}>
                        Analytics
                      </h1>
                      <p className="text-sm text-gray-600 mt-1 whitespace-nowrap">
                        Track your learning progress and performance insights
                      </p>
                    </div>
                  </div>
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Conditional Rendering based on active view */}
        {activeView === 'analytics' && !isViewingOthersProfile ? (
          <AnalyticsView studentId={studentData?.id} userEmail={userEmail} />
        ) : (
          <>
            <LampContainer>
              <motion.h1
                initial={{ opacity: 0.5, y: 100 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{
                  delay: 0.3,
                  duration: 0.8,
                  ease: "easeInOut",
                }}
                className="bg-gradient-to-br from-slate-900 to-slate-900  bg-clip-text text-center text-xl font-bold tracking-tight text-transparent md:text-xl"
              >
                Welcome to your profile dashboard, {studentData?.profile?.firstName || studentData?.rawData?.firstName || (userEmail ? userEmail.split('@')[0] : "Student")}!
              </motion.h1>
            </LampContainer>
            {/* 3x3 Grid Section */}
            <motion.div
              initial={{ opacity: 0.5, y: 100 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{
                delay: 0.3,
                duration: 0.8,
                ease: "easeInOut",
              }}
              className="-mt-48 relative z-10 px-0"
            >
              {render3x3Grid()}
            </motion.div>
            
            {/* Separate Section: 2 in a row and 1 column (Suggested Steps and Achievement Timeline) */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-0">
              {/* Suggested Steps - 2 columns wide */}
              <div className="lg:col-span-1 lg:sticky lg:top-16 lg:self-start">
                <Card
                  ref={suggestedNextStepsRef}
                  className="bg-white rounded-xl border border-gray-200 hover:border-blue-400 hover:shadow-xl hover:-translate-y-1 transition-all duration-200 shadow-sm"
                  data-testid="suggested-next-steps-card"
                >
                  <CardHeader className="px-6 py-5 bg-gradient-to-r from-blue-50 to-indigo-50 border-b border-blue-100 rounded-t-xl">
                    <div className="flex items-center w-full justify-between">
                      <CardTitle className="flex items-center gap-3 m-0 p-0">
                        <div className="w-12 h-12 rounded-lg bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center shadow-md">
                          <Lightbulb className="w-6 h-6 text-white" />
                        </div>
                        <span className="text-xl font-bold text-gray-900">
                          Suggested Steps
                        </span>
                      </CardTitle>
                      {/* <button
                        className="p-2 rounded-md hover:bg-blue-100 transition-colors"
                        title="View All Suggested Steps"
                        onClick={() => navigate("/student/suggested-steps")}
                      >
                        <Eye className="w-5 h-5 text-blue-600" />
                      </button> */}
                    </div>
                  </CardHeader>
                  <CardContent className="pt-4 p-8 space-y-4">
                    {matchingLoading ? (
                      <div className="flex items-center justify-center py-8">
                        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                        <p className="ml-3 text-sm text-gray-500">
                          Finding best job matches for you...
                        </p>
                      </div>
                    ) : matchingError ? (
                      <div className="p-4 rounded-lg bg-red-50 border border-red-200">
                        <p className="text-sm text-red-700">
                          ⚠️ {matchingError}
                        </p>
                      </div>
                    ) : matchedJobs.length > 0 ? (
                      <>
                        {matchedJobs.slice(0, 4).map((match, idx) => (
                          <div
                            key={match.job_id || `job-match-${idx}`}
                            className="p-5 rounded-xl bg-gradient-to-r from-blue-50 to-white border-l-4 border-l-blue-500 border border-gray-200 hover:shadow-md transition-all duration-200 cursor-pointer group"
                            data-testid={`matched-job-${idx}`}
                            onClick={() => {
                              // Navigate to opportunities page or show details
                              if (match.opportunity?.application_link) {
                                window.open(
                                  match.opportunity.application_link,
                                  "_blank"
                                );
                              }
                            }}
                          >
                            {/* Match Score Badge */}
                            <div className="flex items-start justify-between mb-2">
                              <Badge className="bg-gradient-to-r from-green-500 to-emerald-500 text-white border-0 text-xs font-semibold">
                                {match.match_score}% Match
                              </Badge>
                              <ExternalLink className="w-4 h-4 text-blue-600 opacity-0 group-hover:opacity-100 transition-opacity" />
                            </div>

                            {/* Job Title & Company */}
                            <div className="mb-3">
                              <h4 className="text-base font-bold text-gray-900 mb-1 group-hover:text-blue-700 transition-colors">
                                {match.job_title ||
                                  match.opportunity?.job_title}
                              </h4>
                              <div className="flex items-center gap-2 text-sm text-gray-600">
                                <Building2 className="w-4 h-4" />
                                <span className="font-medium">
                                  {match.company_name ||
                                    match.opportunity?.company_name}
                                </span>
                              </div>

                              {/* Job Details */}
                              {match.opportunity && (
                                <div className="flex flex-wrap items-center gap-3 mb-3 text-xs text-gray-600">
                                  {match.opportunity.employment_type && (
                                    <div className="flex items-center gap-1">
                                      <Briefcase className="w-3.5 h-3.5" />
                                      <span>
                                        {match.opportunity.employment_type}
                                      </span>
                                    </div>
                                  )}
                                  {match.opportunity.location && (
                                    <div className="flex items-center gap-1">
                                      <MapPin className="w-3.5 h-3.5" />
                                      <span>{match.opportunity.location}</span>
                                    </div>
                                  )}
                                  {match.opportunity.deadline && (
                                    <div className="flex items-center gap-1 text-orange-600">
                                      <Clock className="w-3.5 h-3.5" />
                                      <span>
                                        Deadline:{" "}
                                        {new Date(
                                          match.opportunity.deadline
                                        ).toLocaleDateString()}
                                      </span>
                                    </div>
                                  )}
                                </div>
                              )}

                              {/* Match Reason */}
                              <div className="mb-3 p-3 bg-white/60 rounded-lg border border-blue-100">
                                <p className="text-xs text-gray-700 leading-relaxed">
                                  <span className="font-semibold text-blue-700">
                                    Why this matches:{" "}
                                  </span>
                                  {match.match_reason}
                                </p>
                              </div>

                              {/* Key Matching Skills */}
                              {match.key_matching_skills &&
                                match.key_matching_skills.length > 0 && (
                                  <div className="flex flex-wrap gap-1.5 mb-3">
                                    {match.key_matching_skills
                                      .slice(0, 4)
                                      .map((skill, skillIdx) => (
                                        <Badge
                                          key={skillIdx}
                                          variant="secondary"
                                          className="text-xs bg-white/80 text-gray-700 border border-blue-200"
                                        >
                                          {skill}
                                        </Badge>
                                      ))}
                                  </div>
                                )}

                              {/* Recommendation */}
                              {match.recommendation && (
                                <div className="pt-3 border-t border-blue-200/50">
                                  <p className="text-xs text-gray-600 italic">
                                    💡 {match.recommendation}
                                  </p>
                                </div>
                              )}
                            </div>
                          </div>
                        ))}

                        {/* Refresh Button */}
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={refreshMatches}
                          className="w-full mt-2 text-blue-700 border-blue-300 hover:bg-blue-50 font-semibold"
                          data-testid="refresh-matches-button"
                        >
                          <Sparkles className="w-4 h-4 mr-2" />
                          Refresh Job Matches
                        </Button>
                      </>
                    ) : (
                      <>
                        {/* Fallback to default suggestions if no AI matches */}
                        {suggestions.map((suggestion, idx) => (
                          <div
                            key={suggestion.id || `suggestion-${idx}`}
                            className="p-4 rounded-xl bg-gradient-to-r from-blue-50 to-white border-l-4 border-l-blue-500 border border-gray-200 hover:shadow-md transition-all duration-200"
                          >
                            <p className="text-sm font-medium text-gray-900">
                              {typeof suggestion === "string"
                                ? suggestion
                                : suggestion.message || suggestion}
                            </p>
                          </div>
                        ))}
                        {!matchingLoading && (
                          <div className="text-center py-4">
                            <p className="text-sm text-gray-500">
                              No job matches found at the moment. Complete your
                              profile to get better matches!
                            </p>
                          </div>
                        )}
                      </>
                    )}
                  </CardContent>
                </Card>
              </div>
              
              {/* Achievement Timeline - 1 column */}
              <div className="lg:col-span-2">
                <AchievementsTimeline userData={userData} />
              </div>
            </div>
          </>
        )}
      </div>

      {/* Modals for editing sections */}
      {activeModal === "education" && (
        <EducationEditModal
          isOpen
          onClose={() => setActiveModal(null)}
          data={userData.education}
          onSave={(data) => handleSave("education", data)}
        />
      )}

      {activeModal === "training" && (
        <TrainingEditModal
          isOpen
          onClose={() => setActiveModal(null)}
          data={userData.training}
          onSave={(data) => handleSave("training", data)}
        />
      )}

      {activeModal === "experience" && (
        <ExperienceEditModal
          isOpen
          onClose={() => setActiveModal(null)}
          data={userData.experience}
          onSave={(data) => handleSave("experience", data)}
        />
      )}

      {activeModal === "softSkills" && (
        <SkillsEditModal
          isOpen
          onClose={() => setActiveModal(null)}
          data={userData.softSkills}
          onSave={(data) => handleSave("softSkills", data)}
          title="Soft Skills"
        />
      )}

      {activeModal === "technicalSkills" && (
        <SkillsEditModal
          isOpen
          onClose={() => setActiveModal(null)}
          data={userData.technicalSkills}
          onSave={(data) => handleSave("technicalSkills", data)}
          title="Technical Skills"
        />
      )}

      {activeModal === "projects" && (
        <ProjectsEditModal
          isOpen
          onClose={() => setActiveModal(null)}
          data={userData.projects}
          onSave={(data) => handleSave("projects", data)}
        />
      )}

      {activeModal === "certificates" && (
        <CertificatesEditModal
          isOpen
          onClose={() => setActiveModal(null)}
          data={userData.certificates}
          onSave={(data) => handleSave("certificates", data)}
        />
      )}
    </div>
  );
};

export default StudentDashboard;