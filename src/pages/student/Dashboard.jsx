import {
    ChartBarIcon,
    RectangleStackIcon,
} from "@heroicons/react/24/outline";
import {
    Award,
    BookOpen,
    Briefcase,
    Building2,
    Calendar,
    CheckCircle,
    ChevronRight,
    ClipboardList,
    Clock,
    Cpu,
    ExternalLink,
    Eye,
    FileText,
    Github,
    GraduationCap,
    Lightbulb,
    MapPin,
    Medal,
    MoreVertical,
    PresentationIcon,
    Rocket,
    Sparkles,
    Star,
    Target,
    Trash2,
    TrendingUp,
    Users2
} from "lucide-react";
import { motion } from "motion/react";
import React, { useEffect, useMemo, useState } from "react";
import { Toaster } from "react-hot-toast";
import { useLocation, useNavigate } from "react-router-dom";
import AchievementsTimeline from "../../components/Students/components/AchievementsTimeline";
import AnalyticsView from "../../components/Students/components/AnalyticsView";
import {
    CertificatesEditModal,
    EducationEditModal,
    ExperienceEditModal,
    ProjectsEditModal,
    SkillsEditModal,
    TrainingEditModal,
} from "../../components/Students/components/ProfileEditModals";
import TrainingRecommendations from "../../components/Students/components/TrainingRecommendations";
import { Badge } from "../../components/Students/components/ui/badge";
import { Button } from "../../components/Students/components/ui/button";
import {
    Card,
    CardContent,
    CardHeader,
    CardTitle,
} from "../../components/Students/components/ui/card";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from "../../components/Students/components/ui/dropdown-menu";
import { LampContainer } from "../../components/Students/components/ui/lamp";
import {
    educationData,
    experienceData,
    softSkills,
    suggestions,
    technicalSkills,
    trainingData,
} from "../../components/Students/data/mockData";
import { useAIRecommendations } from "../../hooks/useAIRecommendations";
import { useAssessmentRecommendations } from "../../hooks/useAssessmentRecommendations";
import { useOpportunities } from "../../hooks/useOpportunities";
import { useStudentAchievements } from "../../hooks/useStudentAchievements";
import { useStudentCertificates } from "../../hooks/useStudentCertificates";
import { useStudentDataByEmail } from "../../hooks/useStudentDataByEmail";
import { useStudentLearning } from "../../hooks/useStudentLearning";
import { useStudentMessageNotifications } from "../../hooks/useStudentMessageNotifications";
import { useStudentUnreadCount } from "../../hooks/useStudentMessages";
import { useStudentProjects } from "../../hooks/useStudentProjects";
import { useStudentRealtimeActivities } from "../../hooks/useStudentRealtimeActivities";
import { supabase } from "../../lib/supabaseClient";
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
            <div className="flex items-center gap-2">
              <Badge className="bg-gradient-to-r from-blue-100 to-indigo-100 text-white p-1 rounded-full shadow-sm">
                <Star className="w-6 h-6 fill-[#FBBF24]" />
              </Badge>
              {/* DEV ONLY: Menu with Clear Assessment option */}
              {import.meta.env.DEV && hasAssessment && (
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <button className="p-1.5 rounded-md hover:bg-blue-100 transition-colors">
                      <MoreVertical className="w-5 h-5 text-gray-500" />
                    </button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end" className="w-48 bg-white border border-gray-200 shadow-lg">
                    <DropdownMenuItem
                      onClick={async () => {
                        if (!studentId) return;
                        if (!window.confirm('DEV: Are you sure you want to clear your assessment data? This will delete all your assessment results.')) return;
                        
                        try {
                          const { error: resultsError } = await supabase
                            .from('personal_assessment_results')
                            .delete()
                            .eq('student_id', studentId);
                          
                          if (resultsError) throw resultsError;

                          const { error: attemptsError } = await supabase
                            .from('personal_assessment_attempts')
                            .delete()
                            .eq('student_id', studentId);
                          
                          if (attemptsError) throw attemptsError;

                          localStorage.removeItem('assessment_gemini_results');
                          localStorage.removeItem('assessment_section_timings');
                          
                          alert('Assessment data cleared! Refreshing page...');
                          window.location.reload();
                        } catch (err) {
                          console.error('Error clearing assessment:', err);
                          alert('Failed to clear assessment: ' + err.message);
                        }
                      }}
                      className="text-red-600 hover:bg-red-50 cursor-pointer"
                    >
                      <Trash2 className="w-4 h-4 mr-2" />
                      🧪 Clear Assessment
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              )}
            </div>
          </div>
        </CardHeader>
        <CardContent className="p-8 space-y-4">
          <p className="text-gray-900 text-base leading-normal font-medium">
            {hasAssessment 
              ? "You've completed your assessment! View your personalized career insights and recommendations."
              : "Take our comprehensive assessment to discover your strengths and get a personalized career roadmap."
            }
          </p>

          {/*<div className="flex items-center gap-4 text-xs text-gray-900 font-medium">
            <div className="flex items-center gap-1.5 bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-200 px-3 py-1.5 rounded-lg shadow-sm">
              <Target className="w-4 h-4 text-blue-600" />
              <span className="font-semibold">Skill Analysis</span>
            </div>
          </div>*/}

          <div className="flex justify-center py-4">
            {hasAssessment ? (
              <Button
                onClick={() => navigate("/student/assessment/result")}
                className="w-auto bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 text-white font-semibold text-sm shadow-md hover:shadow-lg transform hover:scale-105 transition-all duration-200 py-4"
              >
                <Eye className="w-5 h-5 mr-2" />
                View Results
              </Button>
            ) : (
              <Button
                onClick={() => navigate("/student/assessment/test")}
                className="w-auto bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white font-semibold text-sm shadow-md hover:shadow-lg transform hover:scale-105 transition-all duration-200 py-4"
              >
                Start Assessment
                <ChevronRight className="w-5 h-5 ml-2" />
              </Button>
            )}
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
            <button
              className="p-2 rounded-md hover:bg-blue-100 transition-colors"
              title="View All Opportunities"
              onClick={() => navigate('/student/opportunities')}
            >
              <Eye className="w-5 h-5 text-blue-600" />
            </button>
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
        className="h-full bg-white rounded-xl border border-gray-200 hover:border-blue-300 hover:shadow-lg transition-all duration-200 shadow-sm"
      >
        <CardHeader className="px-6 py-5 bg-gradient-to-r from-blue-50 to-indigo-50 border-b border-blue-100 rounded-t-xl">
          <div className="flex items-center w-full justify-between">
            <CardTitle className="flex items-center gap-3 m-0 p-0">
              <div className="p-2 rounded-lg bg-blue-600">
                <Cpu className="w-6 h-6 text-white" />
              </div>
              <span className="text-lg font-bold text-gray-800">
                Technical Skills
              </span>
            </CardTitle>
            <div className="flex items-center gap-2">
              <button
                className="p-2 rounded-md hover:bg-blue-100 transition-colors"
                title="View All Technical Skills"
                onClick={() => setActiveModal("technicalSkills")}
              >
                <Eye className="w-5 h-5 text-blue-600" />
              </button>
            </div>
          </div>
        </CardHeader>
        <CardContent className="p-8">
          {userData.technicalSkills.filter(
            (skill) => skill.enabled !== false && (skill.approval_status === 'approved' || skill.approval_status === 'verified')
          ).length === 0 ? (
            <div className="text-center py-8">
              <p className="text-gray-900 text-base leading-normal font-medium">
                No technical skills added yet
              </p>
            </div>
          ) : (
            <div className="space-y-4 max-h-[500px] overflow-y-auto pr-2 blue-scrollbar">
              {userData.technicalSkills
                .filter((skill) => skill.enabled !== false && (skill.approval_status === 'approved' || skill.approval_status === 'verified'))
                .map((skill, idx) => (
                  <div
                    key={skill.id || `tech-skill-${idx}`}
                    className="p-5 rounded-xl bg-white border-l-4 border-l-blue-500 border border-gray-200 hover:shadow-md transition-all duration-200"
                  >
                    {/* Skill Name + Level Badge */}
                    <div className="flex items-center justify-between gap-3 mb-3">
                      <h4 className="text-base font-bold text-gray-900">
                        {skill.name}
                      </h4>
                      <Badge
                        className={`px-3 py-1.5 text-xs font-semibold rounded-full shadow-sm border ${getSkillLevelColor(
                          skill.level
                        )}`}
                      >
                        {getSkillLevelText(skill.level)}
                      </Badge>
                    </div>

                    {/* Category */}
                    {skill.category && (
                      <div className="flex items-center gap-2 mb-3">
                        <span className="text-sm text-blue-600 font-medium">
                          {skill.category}
                        </span>
                      </div>
                    )}

                    {/* Star Rating */}
                    <div className="flex gap-0.5">
                      {renderStars(skill.level)}
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
        className="h-full bg-white rounded-xl border border-gray-200 hover:border-blue-300 hover:shadow-lg transition-all duration-200 shadow-sm"
      >
        <CardHeader className="px-6 py-5 bg-gradient-to-r from-blue-50 to-indigo-50 border-b border-blue-100 rounded-t-xl">
          <div className="flex items-center w-full justify-between">
            <CardTitle className="flex items-center gap-3 m-0 p-0">
              <div className="p-2 rounded-lg bg-blue-600">
                <Rocket className="w-6 h-6 text-white" />
              </div>
              <span className="text-lg font-bold text-gray-800">
                Projects/Internships
              </span>
            </CardTitle>
            <button
              className="p-2 rounded-md hover:bg-blue-100 transition-colors"
              title="View All Projects & Internships"
              onClick={() => setActiveModal("projects")}
            >
              <Eye className="w-5 h-5 text-blue-600" />
            </button>
          </div>
        </CardHeader>
        <CardContent className="p-8">
          {enabledProjects.length === 0 ? (
            <div className="text-center py-8">
              <p className="text-gray-900 text-base leading-normal font-medium">
                No projects added yet
              </p>
            </div>
          ) : (
            <div className="space-y-4 max-h-[500px] overflow-y-auto pr-2 blue-scrollbar">
              {enabledProjects.map((project, idx) => {
                return (
                  <div
                    key={project.id || `project-${idx}`}
                    className={`p-5 rounded-xl bg-white border-l-4 border-l-blue-500 border border-gray-200 hover:shadow-md transition-all duration-200 ${project.enabled ? "" : "opacity-75"
                      }`}
                  >
                    {/* Title */}
                    <h4 className="text-base font-bold text-gray-900 mb-2">
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
        className="h-full bg-white rounded-xl border border-gray-200 hover:border-blue-300 hover:shadow-lg transition-all duration-200 shadow-sm"
      >
        <CardHeader className="px-6 py-5 bg-gradient-to-r from-blue-50 to-indigo-50 border-b border-blue-100 rounded-t-xl">
          <div className="flex items-center w-full justify-between">
            <CardTitle className="flex items-center gap-3 m-0 p-0">
              <div className="p-2 rounded-lg bg-blue-600">
                <GraduationCap className="w-6 h-6 text-white" />
              </div>
              <span className="text-lg font-bold text-gray-800">
                Education
              </span>
            </CardTitle>
            <div className="flex items-center gap-2">
              <button
                className="p-2 rounded-md hover:bg-blue-100 transition-colors"
                title="View All Education"
                onClick={() => setActiveModal("education")}
              >
                <Eye className="w-5 h-5 text-blue-600" />
              </button>
            </div>
          </div>
        </CardHeader>
        <CardContent className="p-8">
          {userData.education.filter(
            (education) =>
              education.enabled !== false &&
              (education.approval_status === "verified" || education.approval_status === "approved")
          ).length === 0 ? (
            <div className="text-center py-8">
              <p className="text-gray-900 text-base leading-normal font-medium">
                No education added yet
              </p>
            </div>
          ) : (
            <div className="space-y-4 max-h-[500px] overflow-y-auto pr-2 blue-scrollbar">
              {userData.education
                .filter((education) =>
                  education.enabled !== false &&
                  (education.approval_status === "verified" || education.approval_status === "approved")
                )
                .map((education, idx) => (
                  <div
                    key={education.id || `edu-${idx}`}
                    className="p-5 rounded-xl bg-white border-l-4 border-l-blue-500 border border-gray-200 hover:shadow-md transition-all duration-200"
                  >
                    {/* Degree + Status Badge */}
                    <div className="flex items-center justify-between gap-3 mb-3">
                      <h4 className="text-base font-bold text-gray-900">
                        {education.degree || "N/A"}
                      </h4>
                      {education.status && (
                        <Badge
                          className={`px-3 py-1.5 text-xs font-semibold rounded-full shadow-sm ${
                            education.status === "ongoing"
                              ? "bg-gradient-to-r from-blue-100 to-indigo-100 text-blue-700"
                              : "bg-gradient-to-r from-green-100 to-emerald-100 text-green-700"
                          }`}
                        >
                          {education.status}
                        </Badge>
                      )}
                    </div>

                    {/* University/Institution */}
                    <div className="flex items-center gap-2 mb-3">
                      <Building2 className="w-4 h-4 text-blue-600" />
                      <p className="text-sm text-blue-600 font-medium">
                        {education.university || education.institution || "N/A"}
                      </p>
                    </div>

                    {/* Level, Year, Grade */}
                    <div className="flex items-center gap-6 text-sm text-gray-600">
                      {education.level && (
                        <div className="flex items-center gap-1.5">
                          <span className="font-medium">{education.level}</span>
                        </div>
                      )}
                      {education.yearOfPassing && (
                        <div className="flex items-center gap-1.5">
                          <Calendar className="w-4 h-4 text-gray-600" />
                          <span className="font-medium">{education.yearOfPassing}</span>
                        </div>
                      )}
                      {education.cgpa && (
                        <div className="flex items-center gap-1.5">
                          <Award className="w-4 h-4 text-gray-600" />
                          <span className="font-medium">{education.cgpa}</span>
                        </div>
                      )}
                    </div>
                  </div>
                ))}
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
            <button
              className="p-2 rounded-md hover:bg-blue-100 transition-colors"
              title="View All Courses"
              onClick={() => setActiveModal("training")}
            >
              <Eye className="w-5 h-5 text-blue-600" />
            </button>
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
        className="h-full bg-white rounded-xl border border-gray-200 hover:border-blue-300 hover:shadow-lg transition-all duration-200 shadow-sm"
      >
         <CardHeader className="px-6 py-5 bg-gradient-to-r from-blue-50 to-indigo-50 border-b border-blue-100 rounded-t-xl">
      <div className="flex items-center w-full justify-between">
        <CardTitle className="flex items-center gap-3 m-0 p-0">
          <div className="p-2 rounded-lg bg-blue-600">
            <Medal className="w-6 h-6 text-white" />
          </div>
          <span className="text-lg font-bold text-gray-800">
            Certificates
          </span>
        </CardTitle>
        <div className="flex items-center gap-2">
          <button
            className="p-2 rounded-md hover:bg-blue-100 transition-colors"
            title="View All Certificates"
            onClick={() => setActiveModal("certificates")}
          >
            <Eye className="w-5 h-5 text-blue-600" />
          </button>
        </div>
      </div>
    </CardHeader>
        <CardContent className="p-8">
  {enabledCertificates.length === 0 ? (
    <div className="text-center py-8">
      <p className="text-gray-900 text-base leading-normal font-medium">
        No certificates uploaded yet
      </p>
    </div>
  ) : (
    <div className="space-y-4 max-h-[500px] overflow-y-auto pr-2 blue-scrollbar">
      {enabledCertificates.map((cert, idx) => {
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
            className={`p-5 rounded-xl bg-white border-l-4 border-l-blue-500 border border-gray-200 hover:shadow-md transition-all duration-200 ${cert.enabled ? "" : "opacity-75"
              }`}
          >
            {/* Certificate Name */}
            <h4 className="text-base font-bold text-gray-900 mb-3">
              {cert.title ||
                cert.name ||
                cert.certificate ||
                "Certificate"}
            </h4>

            {/* Credential ID + Date */}
            <div className="flex items-center justify-between gap-3 mb-3">
              <div className="text-xs text-gray-600 font-medium">
                {cert.credentialId ? (
                  <span>{cert.credentialId}</span>
                ) : (
                  <span className="text-gray-400">No credential ID</span>
                )}
              </div>
              {issuedOn && (
                <Badge className="px-3 py-1 text-xs font-semibold bg-gradient-to-r from-gray-100 to-gray-200 text-gray-700 rounded-full shadow-sm">
                  {issuedOn}
                </Badge>
              )}
            </div>

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
    </div>
  )}
</CardContent>
      </Card>
    ),
       experience: (
  <Card
    key="experience"
    className="h-full bg-white rounded-xl border border-gray-200 hover:border-blue-300 hover:shadow-lg transition-all duration-200 shadow-sm"
  >
    <CardHeader className="px-6 py-5 bg-gradient-to-r from-blue-50 to-indigo-50 border-b border-blue-100 rounded-t-xl">
      <div className="flex items-center w-full justify-between">
        <CardTitle className="flex items-center gap-3 m-0 p-0">
          <div className="p-2 rounded-lg bg-blue-600">
            <Building2 className="w-6 h-6 text-white" />
          </div>
          <span className="text-lg font-bold text-gray-800">
            My Experience
          </span>
        </CardTitle>
        <div className="flex items-center gap-2">
          <button
            className="p-2 rounded-md hover:bg-blue-100 transition-colors"
            title="View All Experience"
            onClick={() => setActiveModal("experience")}
          >
            <Eye className="w-5 h-5 text-blue-600" />
          </button>
        </div>
      </div>
    </CardHeader>
        <CardContent className="p-8">
  {userData.experience?.filter(exp =>
    exp.enabled !== false &&
    (exp.approval_status === "verified" || exp.approval_status === "approved")
  ).length === 0 ? (
    <div className="text-center py-8">
      <p className="text-gray-900 text-base leading-normal font-medium">
        No experience added yet
      </p>
    </div>
  ) : (
    <div className="space-y-4 max-h-[500px] overflow-y-auto pr-2 blue-scrollbar">
      {userData.experience
        .filter(exp =>
          exp.enabled !== false &&
          (exp.approval_status === "verified" || exp.approval_status === "approved")
        )
        .map((exp, idx) => (
          <div
          key={exp.id || `exp-${idx}`}
          className="p-5 rounded-xl bg-white border-l-4 border-l-blue-500 border border-gray-200 hover:shadow-md transition-all duration-200"
        >
          {/* Title + Status Badge */}
          <div className="flex items-center justify-between gap-3 mb-3">
            <h4 className="text-base font-bold text-gray-900">
              {exp.role || "Experience Role"}
            </h4>
            {(exp.approval_status === "verified" || exp.approval_status === "approved") && (
              <Badge className="bg-gradient-to-r from-green-100 to-emerald-100 text-green-700 px-3 py-1.5 text-xs font-semibold rounded-full shadow-sm flex items-center gap-1.5">
                <CheckCircle className="w-3.5 h-3.5" />
                Verified
              </Badge>
            )}
          </div>

          {/* Type */}
          {exp.type && (
            <div className="flex items-center gap-2 mb-3">
              <Briefcase className="w-4 h-4 text-blue-600" />
              <span className="text-sm text-gray-700 font-medium">{exp.type}</span>
            </div>
          )}

          {/* Icon + Location */}
          {(exp.organization || exp.company || exp.location) && (
            <div className="flex items-center gap-2 mb-3">
              <Building2 className="w-4 h-4 text-blue-600" />
              <span className="text-sm text-blue-600 font-medium">
                {exp.organization || exp.company || "Organization"}
                {exp.location && `, ${exp.location}`}
              </span>
            </div>
          )}

          {/* Date */}
          {(exp.duration || exp.period) && (
            <div className="flex items-center gap-2">
              <Calendar className="w-4 h-4 text-gray-600" />
              <span className="text-sm text-gray-600 font-medium">
                {exp.duration || exp.period}
              </span>
            </div>
          )}
        </div>
      ))}
    </div>
  )}
</CardContent>
      </Card>
    ),
    softSkills: (
      <Card
        key="softSkills"
        className="h-full bg-white rounded-xl border border-gray-200 hover:border-blue-300 hover:shadow-lg transition-all duration-200 shadow-sm"
      >
        <CardHeader className="px-6 py-5 bg-gradient-to-r from-blue-50 to-indigo-50 border-b border-blue-100 rounded-t-xl">
          <div className="flex items-center w-full justify-between">
            <CardTitle className="flex items-center gap-3 m-0 p-0">
              <div className="p-2 rounded-lg bg-blue-600">
                <Users2 className="w-6 h-6 text-white" />
              </div>
              <span className="text-lg font-bold text-gray-800">
                Soft Skills
              </span>
            </CardTitle>
            <div className="flex items-center gap-2">
              <button
                className="p-2 rounded-md hover:bg-blue-100 transition-colors"
                title="View All Soft Skills"
                onClick={() => setActiveModal("softSkills")}
              >
                <Eye className="w-5 h-5 text-blue-600" />
              </button>
            </div>
          </div>
        </CardHeader>
        <CardContent className="p-8">
          {userData.softSkills.filter(
            (skill) => skill.enabled !== false && (skill.approval_status === 'approved' || skill.approval_status === 'verified')
          ).length === 0 ? (
            <div className="text-center py-8">
              <p className="text-gray-900 text-base leading-normal font-medium">
                No soft skills added yet
              </p>
            </div>
          ) : (
            <div className="space-y-4 max-h-[500px] overflow-y-auto pr-2 blue-scrollbar">
              {userData.softSkills
                .filter((skill) => skill.enabled !== false && (skill.approval_status === 'approved' || skill.approval_status === 'verified'))
                .map((skill, idx) => (
                  <div
                    key={skill.id || `soft-skill-${idx}`}
                    className="p-5 rounded-xl bg-white border-l-4 border-l-blue-500 border border-gray-200 hover:shadow-md transition-all duration-200"
                  >
                    {/* Skill Name + Level Badge */}
                    <div className="flex items-center justify-between gap-3 mb-3">
                      <h4 className="text-base font-bold text-gray-900">
                        {skill.name}
                      </h4>
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
      <div className="grid grid-cols-1 md:grid-cols-3 gap-5 mb-12">
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
    <div className="min-h-screen bg-[#F8FAFC] py-6 px-4">
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
          <div className="mb-16 flex justify-center">
            {/* Tab Navigation with Subheadings */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-2 w-full max-w-4xl">
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
              className="-mt-48 relative z-50"
            >
              {render3x3Grid()}
            </motion.div>
            
            {/* Separate Section: Achievement Timeline */}
            <div className="grid grid-cols-1 gap-6">
              {/* Suggested Steps - Commented Out */}
              {false && (
              <div className="lg:col-span-1 lg:sticky lg:top-16 lg:self-start">
                <Card
                  ref={suggestedNextStepsRef}
                  className="h-full bg-white rounded-xl border border-gray-200 hover:border-blue-300 hover:shadow-lg transition-all duration-200 shadow-sm"
                  data-testid="suggested-next-steps-card"
                >
                  <CardHeader className="px-6 py-5 bg-gradient-to-r from-blue-50 to-indigo-50 border-b border-blue-100 rounded-t-xl">
                    <div className="flex items-center w-full justify-between">
                      <CardTitle className="flex items-center gap-3 m-0 p-0">
                        <div className="p-2 rounded-lg bg-blue-600">
                          <Lightbulb className="w-6 h-6 text-white" />
                        </div>
                        <span className="text-lg font-bold text-gray-800">Suggested Steps</span>
                      </CardTitle>
                      <button
                        className="p-2 rounded-md hover:bg-blue-100 transition-colors"
                        title="View All Suggested Steps"
                        onClick={() => navigate("/student/suggested-steps")}
                      >
                        <Eye className="w-5 h-5 text-blue-600" />
                      </button>
                    </div>
                  </CardHeader>
                  <CardContent className="p-8">
                    <div className="space-y-4 max-h-[500px] overflow-y-auto pr-2 blue-scrollbar">
                    {matchingLoading ? (
                      <div className="flex items-center justify-center py-8">
                        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-amber-600"></div>
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
                            className="p-5 rounded-xl bg-white border-l-4 border-l-blue-500 border border-gray-200 hover:border-blue-300 hover:shadow-md transition-all cursor-pointer group"
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
                              <ExternalLink className="w-4 h-4 text-amber-600 opacity-0 group-hover:opacity-100 transition-opacity" />
                            </div>

                            {/* Job Title & Company */}
                            <div className="mb-3">
                              <h4 className="text-base font-bold text-gray-900 mb-1 group-hover:text-amber-700 transition-colors">
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
                              <div className="mb-3 p-3 bg-white/60 rounded-lg border border-amber-100">
                                <p className="text-xs text-gray-700 leading-relaxed">
                                  <span className="font-semibold text-amber-700">
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
                                          className="text-xs bg-white/80 text-gray-700 border border-amber-200"
                                        >
                                          {skill}
                                        </Badge>
                                      ))}
                                  </div>
                                )}

                              {/* Recommendation */}
                              {match.recommendation && (
                                <div className="pt-3 border-t border-amber-200/50">
                                  <p className="text-xs text-gray-600 italic">
                                    💡 {match.recommendation}
                                  </p>
                                </div>
                              )}
                            </div>
                          </div>
                        ))}

                        <Button
                          variant="outline"
                          size="sm"
                          onClick={refreshMatches}
                          className="w-full mt-2 text-blue-600 border-blue-300 hover:bg-blue-50"
                          data-testid="refresh-matches-button"
                        >
                          <Sparkles className="w-4 h-4 mr-2" />
                          Refresh Job Matches
                        </Button>
                      </>
                    ) : (
                      <>
                        {suggestions.map((suggestion, idx) => (
                          <div
                            key={suggestion.id || `suggestion-${idx}`}
                            className="p-5 rounded-xl bg-white border-l-4 border-l-blue-500 border border-gray-200 hover:border-blue-300 transition-all"
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
                    </div>
                  </CardContent>
                </Card>
              </div>
              )}

              {/* Achievement Timeline - 1 column */}
              <div>
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