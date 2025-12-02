import React, { useState, useEffect, useMemo } from "react";
import { useLocation } from "react-router-dom";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "../../components/Students/components/ui/card";
import { Button } from "../../components/Students/components/ui/button";
import { Badge } from "../../components/Students/components/ui/badge";
import {
  TrendingUp,
  CheckCircle,
  Star,
  ExternalLink,
  Edit,
  Calendar,
  Award,
  Users,
  Code,
  MessageCircle,
  QrCode,
  FolderGit2,
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
} from "lucide-react";
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
import { useAIJobMatching } from "../../hooks/useAIJobMatching";
import { supabase } from "../../lib/supabaseClient";
import { useStudentMessageNotifications } from "../../hooks/useStudentMessageNotifications";
import { useStudentUnreadCount } from "../../hooks/useStudentMessages";
import { Toaster } from "react-hot-toast";
import AchievementsTimeline from "../../components/Students/components/AchievementsTimeline";
import RecentUpdatesCard from "../../components/Students/components/RecentUpdatesCard";
import { useStudentAchievements } from "../../hooks/useStudentAchievements";
import { useNavigate } from "react-router-dom";
import { useStudentTraining } from "../../hooks/useStudentTraining";
import { useStudentCertificates } from "../../hooks/useStudentCertificates";
import { useStudentProjects } from "../../hooks/useStudentProjects";
import AnalyticsView from "../../components/Students/components/AnalyticsView";
import { BarChart3, LayoutDashboard } from "lucide-react";
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
    training: tableTraining,
    loading: trainingLoading,
    error: trainingError,
    refresh: refreshTraining
  } = useStudentTraining(studentId, !!studentId && !isViewingOthersProfile);

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
  const [showAllEducation, setShowAllEducation] = useState(false);
  const [showAllExperience, setShowAllExperience] = useState(false);
  const [showAllOpportunities, setShowAllOpportunities] = useState(false);
  const [showAllSoftSkills, setShowAllSoftSkills] = useState(false);
  const [showAllTechnicalSkills, setShowAllTechnicalSkills] = useState(false);
  const [showAllTraining, setShowAllTraining] = useState(false);
  const [showAllProjects, setShowAllProjects] = useState(false);
  const [showAllCertificates, setShowAllCertificates] = useState(false);

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

  // AI Job Matching - Get top 3 matched jobs for student
  const {
    matchedJobs,
    loading: matchingLoading,
    error: matchingError,
    refreshMatches,
  } = useAIJobMatching(studentData, !isViewingOthersProfile, 3);

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
    opportunities: (
      <Card
        key="opportunities"
        className="h-full bg-white rounded-xl border border-gray-200 hover:border-blue-400 transition-all duration-200 shadow-sm hover:shadow-md"
      >
        <CardHeader className="px-6 py-4 border-b border-gray-100">
          <CardTitle className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-blue-50 flex items-center justify-center">
                <ExternalLink className="w-5 h-5 text-blue-600" />
              </div>
              <span className="text-lg font-semibold text-gray-900">
                Opportunities
              </span>
            </div>
          </CardTitle>
        </CardHeader>
        <CardContent className="pt-4 p-6 space-y-3">
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
            // Filter opportunities based on student type
            const isSchoolStudent = studentData?.school_id || studentData?.school_class_id;
            const isUniversityStudent = studentData?.university_college_id || studentData?.universityId;

            // Fallback: Check education level if database fields are not available
            const hasHighSchoolOnly = userData.education.length > 0 &&
              userData.education.every(edu =>
                edu.level && edu.level.toLowerCase().includes('high school')
              );

            let filteredOpportunities = opportunities;

            if (isSchoolStudent || hasHighSchoolOnly) {
              // School students: Show only internships (employment_type = 'internship')
              filteredOpportunities = opportunities.filter(opp =>
                opp.employment_type && opp.employment_type.toLowerCase() === 'internship'
              );
            } else if (isUniversityStudent) {
              // University students: Show intern level and other experience levels (but not school internships)
              filteredOpportunities = opportunities.filter(opp =>
                opp.experience_level && (
                  opp.experience_level.toLowerCase().includes('intern') ||
                  opp.experience_level.toLowerCase().includes('entry') ||
                  opp.experience_level.toLowerCase().includes('mid') ||
                  opp.experience_level.toLowerCase().includes('senior') ||
                  opp.experience_level.toLowerCase().includes('lead')
                )
              );
            }

            return (showAllOpportunities
              ? filteredOpportunities
              : filteredOpportunities.slice(0, 2)
            ).map((opp, idx) => (
              <div
                key={opp.id || `${opp.title}-${opp.company_name}-${idx}`}
                className="p-4 rounded-lg bg-gray-50 border border-gray-200 hover:bg-white hover:border-blue-300 transition-all"
              >
                <h4 className="font-semibold text-gray-900 text-base mb-1">
                  {opp.title}
                </h4>
                <p className="text-blue-600 text-sm font-medium mb-3">
                  {opp.company_name}
                </p>
                <div className="flex items-center justify-between">
                  <Badge className="bg-gray-200 text-gray-700 hover:bg-gray-200 text-xs font-medium px-3 py-1">
                    {opp.employment_type}
                  </Badge>
                  {opp.application_link ? (
                    <a
                      href={opp.application_link}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-block"
                    >
                      <Button
                        size="sm"
                        className="bg-blue-600 hover:bg-blue-700 text-white font-medium px-5 py-2 text-sm rounded-md transition-colors"
                      >
                        Apply Now
                      </Button>
                    </a>
                  ) : (
                    <Button
                      size="sm"
                      className="bg-blue-600 hover:bg-blue-700 text-white font-medium px-5 py-2 text-sm rounded-md transition-colors"
                    >
                      Apply Now
                    </Button>
                  )}
                </div>
              </div>
            ))
          })()}
          {(() => {
            // Use the same filtering logic for the count
            const isSchoolStudent = studentData?.school_id || studentData?.school_class_id;
            const isUniversityStudent = studentData?.university_college_id || studentData?.universityId;
            const hasHighSchoolOnly = userData.education.length > 0 &&
              userData.education.every(edu =>
                edu.level && edu.level.toLowerCase().includes('high school')
              );

            let filteredOpportunities = opportunities;

            if (isSchoolStudent || hasHighSchoolOnly) {
              filteredOpportunities = opportunities.filter(opp =>
                opp.employment_type && opp.employment_type.toLowerCase() === 'internship'
              );
            } else if (isUniversityStudent) {
              filteredOpportunities = opportunities.filter(opp =>
                opp.experience_level && (
                  opp.experience_level.toLowerCase().includes('intern') ||
                  opp.experience_level.toLowerCase().includes('entry') ||
                  opp.experience_level.toLowerCase().includes('mid') ||
                  opp.experience_level.toLowerCase().includes('senior') ||
                  opp.experience_level.toLowerCase().includes('lead')
                )
              );
            }

            return filteredOpportunities.length > 2 && (
              <Button
                variant="outline"
                onClick={() => setShowAllOpportunities((v) => !v)}
                className="w-full border border-gray-300 text-gray-700 hover:bg-gray-50 hover:border-gray-400 font-medium text-sm rounded-md transition-all"
              >
                {showAllOpportunities
                  ? "Show Less"
                  : `View All Opportunities (${filteredOpportunities.length})`}
              </Button>
            );
          })()}
        </CardContent>
      </Card>
    ),
    technicalSkills: (
      <Card
        key="technicalSkills"
        className="h-full bg-white rounded-xl border border-gray-200 hover:border-blue-400 transition-all duration-200 shadow-sm hover:shadow-md"
      >
        <CardHeader className="px-6 py-4 border-b border-gray-100">
          <div className="flex items-center w-full justify-between">
            <CardTitle className="flex items-center gap-3 m-0 p-0">
              <div className="w-10 h-10 rounded-lg bg-blue-50 flex items-center justify-center">
                <Code className="w-5 h-5 text-blue-600" />
              </div>
              <span className="text-lg font-semibold text-gray-900">
                Technical Skills
              </span>
            </CardTitle>
            <button
              className="p-2 rounded-md hover:bg-gray-100 transition-colors"
              title="Edit Technical Skills"
              onClick={() => setActiveModal("technicalSkills")}
            >
              <Edit className="w-4 h-4 text-gray-600" />
            </button>
          </div>
        </CardHeader>
        <CardContent className="pt-4 p-6 space-y-3">
          {userData.technicalSkills.filter(
            (skill) => skill.enabled !== false && skill.approval_status === 'approved' || skill.approval_status === 'verified'
          ).length === 0 ? (
            <div className="text-center py-8">
              <p className="text-slate-500 font-medium">
                No technical skills have been added or verified.
              </p>
            </div>
          ) : (
            (showAllTechnicalSkills
              ? userData.technicalSkills.filter(
                (skill) => skill.enabled !== false && skill.approval_status === 'approved' || skill.approval_status === 'verified'
              )
              : userData.technicalSkills
                .filter((skill) => skill.enabled !== false && skill.approval_status === 'approved' || skill.approval_status === 'verified')
                .slice(0, 2)
            ).map((skill, idx) => (
              <div
                key={skill.id || `tech-skill-${idx}`}
                className="p-4 rounded-lg bg-gray-50 border border-gray-200 hover:bg-white hover:border-blue-300 transition-all"
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
                        className={`px-2.5 py-1 text-xs font-semibold rounded-md border ${getSkillLevelColor(
                          skill.level
                        )}`}
                      >
                        {getSkillLevelText(skill.level)}
                      </Badge>
                      <div className="flex gap-0.5">
                        {renderStars(skill.level)}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            ))
          )}
          {userData.technicalSkills.filter((skill) => skill.enabled !== false && skill.approval_status === 'approved' || skill.approval_status === 'verified')
            .length > 2 && (
              <Button
                variant="outline"
                onClick={() => setShowAllTechnicalSkills((v) => !v)}
                className="w-full border border-gray-300 text-gray-700 hover:bg-gray-50 hover:border-gray-400 font-medium text-sm rounded-md transition-all"
              >
                {showAllTechnicalSkills
                  ? "Show Less"
                  : "View All Technical Skills"}
              </Button>
            )}
        </CardContent>
      </Card>
    ),
    projects: (
      <Card
        key="projects"
        className="h-full bg-white rounded-xl border border-gray-200 hover:border-blue-400 transition-all duration-200 shadow-sm hover:shadow-md"
      >
        <CardHeader className="px-6 py-4 border-b border-gray-100">
          <div className="flex items-center w-full justify-between">
            <CardTitle className="flex items-center gap-3 m-0 p-0">
              <div className="w-10 h-10 rounded-lg bg-blue-50 flex items-center justify-center">
                <FolderGit2 className="w-5 h-5 text-blue-600" />
              </div>
              <span className="text-lg font-semibold text-gray-900">
                Projects
              </span>
              <Badge className="bg-blue-50 text-blue-700 px-2.5 py-0.5 rounded-md text-xs font-medium ml-2">
                {enabledProjects.length}
              </Badge>
            </CardTitle>
            <button
              className="p-2 rounded-md hover:bg-gray-100 transition-colors"
              title="Manage Projects"
              onClick={() => setActiveModal("projects")}
            >
              <Edit className="w-4 h-4 text-gray-600" />
            </button>
          </div>
        </CardHeader>
        <CardContent className="pt-4 p-6 space-y-3">
          {enabledProjects.length === 0 ? (
            <div className="text-center py-8">
              <p className="text-slate-500 font-medium">
                No projects added yet
              </p>
            </div>
          ) : (
            (showAllProjects
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
                  className={`p-4 rounded-lg bg-gray-50 border border-gray-200 hover:bg-white hover:border-blue-300 transition-all space-y-3 ${project.enabled ? "" : "opacity-75"
                    }`}
                >
                  {/* First row: Title + Status */}
                  <div className="flex items-center justify-between gap-3">
                    <h4 className="font-semibold text-gray-900 text-base">
                      {project.title || project.name || "Untitled Project"}
                    </h4>
                    {project.status && (
                      <Badge className="bg-green-100 text-green-700 px-2.5 py-1 rounded-md text-xs font-medium whitespace-nowrap">
                        {project.status}
                      </Badge>
                    )}
                  </div>

                  {/* Second row: Organization + Duration */}
                  <div className="flex items-center justify-between gap-3">
                    {(project.organization ||
                      project.company ||
                      project.client) && (
                        <p className="text-sm text-blue-600 font-medium truncate">
                          {project.organization ||
                            project.company ||
                            project.client}
                        </p>
                      )}
                    {(project.duration ||
                      project.timeline ||
                      project.period) && (
                        <p className="text-xs text-gray-600 whitespace-nowrap">
                          {project.duration || project.timeline || project.period}
                        </p>
                      )}
                  </div>

                  {/* Description */}
                  {project.description && (
                    <TruncatedText text={project.description} maxLength={120} />
                  )}

                  {/* Tech stack */}
                  {techList.length > 0 && (
                    <div className="flex flex-wrap gap-2">
                      {techList.map((tech, techIdx) => (
                        <span
                          key={`${project.id || idx}-tech-${techIdx}`}
                          className="px-3 py-1 rounded-full bg-blue-50 text-blue-700 text-xs font-medium"
                        >
                          {tech}
                        </span>
                      ))}
                    </div>
                  )}

                  {/* Resource Buttons */}
                  <div className="flex flex-wrap gap-2 pt-1">
                    {project.demo_link && (
                      <Button
                        asChild
                        variant="outline"
                        size="sm"
                        className="text-blue-600 border-blue-200 hover:bg-blue-50"
                      >
                        <a
                          href={project.demo_link}
                          target="_blank"
                          rel="noopener noreferrer"
                        >
                          <Link className="w-4 h-4 mr-1" /> Demo
                        </a>
                      </Button>
                    )}
                    {project.github_link && (
                      <Button
                        asChild
                        variant="outline"
                        size="sm"
                        className="text-gray-700 border-gray-300 hover:bg-gray-100"
                      >
                        <a
                          href={
                            project.github_url ||
                            project.github_link ||
                            project.github
                          }
                          target="_blank"
                          rel="noopener noreferrer"
                        >
                          <Github className="w-4 h-4 mr-1" /> GitHub
                        </a>
                      </Button>
                    )}
                    {project.video_url && (
                      <Button
                        asChild
                        variant="outline"
                        size="sm"
                        className="text-red-600 border-red-200 hover:bg-red-50"
                      >
                        <a
                          href={project.video_url}
                          target="_blank"
                          rel="noopener noreferrer"
                        >
                          <Video className="w-4 h-4 mr-1" /> Video
                        </a>
                      </Button>
                    )}
                    {project.ppt_url && (
                      <Button
                        asChild
                        variant="outline"
                        size="sm"
                        className="text-purple-600 border-purple-200 hover:bg-purple-50"
                      >
                        <a
                          href={project.ppt_url}
                          target="_blank"
                          rel="noopener noreferrer"
                        >
                          <Presentation className="w-4 h-4 mr-1" /> PPT
                        </a>
                      </Button>
                    )}
                    {project.certificate_url && (
                      <Button
                        asChild
                        variant="outline"
                        size="sm"
                        className="text-green-600 border-green-200 hover:bg-green-50"
                      >
                        <a
                          href={project.certificate_url}
                          target="_blank"
                          rel="noopener noreferrer"
                        >
                          <FileText className="w-4 h-4 mr-1" /> Certificate
                        </a>
                      </Button>
                    )}
                  </div>
                </div>
              );
            })
          )}

          {enabledProjects.length > 2 && (
            <Button
              variant="outline"
              onClick={() => setShowAllProjects((v) => !v)}
              className="w-full border border-gray-300 text-gray-700 hover:bg-gray-50 hover:border-gray-400 font-medium text-sm rounded-md transition-all"
            >
              {showAllProjects
                ? "Show Less"
                : `View All Projects (${enabledProjects.length})`}
            </Button>
          )}
        </CardContent>
      </Card>
    ),
    // education: (
    //   <Card
    //     key="education"
    //     className="h-full bg-white rounded-xl border border-gray-200 hover:border-blue-400 transition-all duration-200 shadow-sm hover:shadow-md"
    //   >
    //     <CardHeader className="px-6 py-4 border-b border-gray-100">
    //       <div className="flex items-center w-full justify-between">
    //         <CardTitle className="flex items-center gap-3 m-0 p-0">
    //           <div className="w-10 h-10 rounded-lg bg-blue-50 flex items-center justify-center">
    //             <Award className="w-5 h-5 text-blue-600" />
    //           </div>
    //           <span className="text-lg font-semibold text-gray-900">
    //             Education
    //           </span>
    //           <Badge className="bg-blue-50 text-blue-700 px-2.5 py-0.5 rounded-md text-xs font-medium ml-2">
    //             {
    //               userData.education.filter(
    //                 (education) => education.enabled !== false
    //               ).length
    //             }
    //           </Badge>
    //         </CardTitle>
    //         <button
    //           className="p-2 rounded-md hover:bg-gray-100 transition-colors"
    //           title="Edit Education"
    //           onClick={() => setActiveModal("education")}
    //         >
    //           <Edit className="w-4 h-4 text-gray-600" />
    //         </button>
    //       </div>
    //     </CardHeader>
    //     <CardContent className="pt-4 p-6 space-y-3">
    //       {(showAllEducation
    //         ? userData.education.filter(
    //           (education) => education.enabled !== false
    //         )
    //         : userData.education
    //           .filter((education) => education.enabled !== false)
    //           .slice(0, 2)
    //       ).map((education, idx) => (
    //         <div
    //           key={education.id || `edu-${idx}`}
    //           className="p-4 rounded-lg bg-gray-50 border border-gray-200 hover:bg-white hover:border-blue-300 transition-all"
    //         >
    //           <div className="flex items-center justify-between mb-3">
    //             <div>
    //               <h4 className="font-semibold text-gray-900 text-base mb-0.5">
    //                 {education.degree || "N/A"}
    //               </h4>
    //               <p className="text-gray-600 text-sm">
    //                 {education.university || "N/A"}
    //               </p>
    //             </div>
    //             <Badge
    //               className={`px-2.5 py-1 text-xs font-medium rounded-md ${education.status === "ongoing"
    //                 ? "bg-blue-100 text-blue-700"
    //                 : "bg-green-100 text-green-700"
    //                 }`}
    //             >
    //               {education.status || "N/A"}
    //             </Badge>
    //           </div>
    //           <div className="flex gap-6 text-xs">
    //             <div key={`edu-level-${education.id}`}>
    //               <p className="text-gray-500 mb-0.5">Level</p>
    //               <p className="font-medium text-gray-900">
    //                 {education.level || "N/A"}
    //               </p>
    //             </div>
    //             <div key={`edu-year-${education.id}`}>
    //               <p className="text-gray-500 mb-0.5">Year</p>
    //               <p className="font-medium text-gray-900">
    //                 {education.yearOfPassing || "N/A"}
    //               </p>
    //             </div>
    //             <div key={`edu-grade-${education.id}`}>
    //               <p className="text-gray-500 mb-0.5">Grade</p>
    //               <p className="font-medium text-gray-900">
    //                 {education.cgpa || "N/A"}
    //               </p>
    //             </div>
    //           </div>
    //         </div>
    //       ))}
    //       {userData.education.filter((education) => education.enabled !== false)
    //         .length > 2 && (
    //           <Button
    //             variant="outline"
    //             onClick={() => setShowAllEducation((v) => !v)}
    //             className="w-full border border-gray-300 text-gray-700 hover:bg-gray-50 hover:border-gray-400 font-medium text-sm rounded-md transition-all"
    //           >
    //             {showAllEducation ? "Show Less" : "View All Qualifications"}
    //           </Button>
    //         )}
    //     </CardContent>
    //   </Card>
    // ),
    // certificates: (
    //   <Card
    //     key="certificates"
    //     className="h-full bg-white rounded-xl border border-gray-200 hover:border-blue-400 transition-all duration-200 shadow-sm hover:shadow-md"
    //   >
    //     <CardHeader className="px-6 py-4 border-b border-gray-100">
    //       <div className="flex items-center w-full justify-between">
    //         <CardTitle className="flex items-center gap-3 m-0 p-0">
    //           <div className="w-10 h-10 rounded-lg bg-blue-50 flex items-center justify-center">
    //             <Medal className="w-5 h-5 text-blue-600" />
    //           </div>
    //           <span className="text-lg font-semibold text-gray-900">
    //             Certificates
    //           </span>
    //           <Badge className="bg-blue-50 text-blue-700 px-2.5 py-0.5 rounded-md text-xs font-medium ml-2">
    //             {enabledCertificates.length}
    //           </Badge>
    //         </CardTitle>
    //         <button
    //           className="p-2 rounded-md hover:bg-gray-100 transition-colors"
    //           title="Manage Certificates"
    //           onClick={() => setActiveModal("certificates")}
    //         >
    //           <Edit className="w-4 h-4 text-gray-600" />
    //         </button>
    //       </div>
    //     </CardHeader>
    //     <CardContent className="pt-4 p-6 space-y-3">
    //       {enabledCertificates.length === 0 ? (
    //         <div className="text-center py-8">
    //           <p className="text-slate-500 font-medium">
    //             No certificates uploaded yet
    //           </p>
    //         </div>
    //       ) : (
    //         (showAllCertificates
    //           ? enabledCertificates
    //           : enabledCertificates.slice(0, 2)
    //         ).map((cert, idx) => {
    //           const certificateLink =
    //             cert.link ||
    //             cert.url ||
    //             cert.certificateUrl ||
    //             cert.credentialUrl ||
    //             cert.viewUrl;
    //           const issuedOn =
    //             cert.year || cert.date || cert.issueDate || cert.issuedOn;
    //           return (
    //             <div
    //               key={cert.id || `certificate-${idx}`}
    //               className={`p-4 rounded-lg bg-gray-50 border border-gray-200 hover:bg-white hover:border-blue-300 transition-all space-y-3 ${cert.enabled ? "" : "opacity-75"
    //                 }`}
    //             >
    //               <div className="flex items-start justify-between gap-3">
    //                 <div className="space-y-1">
    //                   <h4 className="font-semibold text-gray-900 text-base">
    //                     {cert.title ||
    //                       cert.name ||
    //                       cert.certificate ||
    //                       "Certificate"}
    //                   </h4>
    //                   <div className="flex items-center justify-between gap-3 mt-2">
    //                     {(cert.issuer ||
    //                       cert.organization ||
    //                       cert.institution) && (
    //                         <p className="text-sm text-blue-600 font-medium">
    //                           {cert.issuer ||
    //                             cert.organization ||
    //                             cert.institution}
    //                         </p>
    //                       )}
    //                     {issuedOn && (
    //                       <p className="text-xs text-gray-600">{issuedOn}</p>
    //                     )}
    //                   </div>
    //                   {cert.credentialId && (
    //                     <div className="text-xs text-gray-500 font-medium">
    //                       Credential ID: {cert.credentialId}
    //                     </div>
    //                   )}
    //                 </div>
    //               </div>
    //               {cert.description && (
    //                 <TruncatedText text={cert.description} maxLength={120} />
    //               )}

    //               {(cert.level || cert.category || cert.type) && (
    //                 <div className="flex flex-wrap gap-2">
    //                   <span className="px-3 py-1 rounded-full bg-amber-50 text-amber-700 text-xs font-medium">
    //                     {cert.level || cert.category || cert.type}
    //                   </span>
    //                 </div>
    //               )}

    //               {certificateLink && (
    //                 <div className="pt-1">
    //                   <a
    //                     href={certificateLink}
    //                     target="_blank"
    //                     rel="noopener noreferrer"
    //                   >
    //                     <Button
    //                       size="sm"
    //                       className="bg-blue-600 hover:bg-blue-700 text-white font-medium px-5 py-2 text-sm rounded-md transition-colors"
    //                     >
    //                       View Credential
    //                     </Button>
    //                   </a>
    //                 </div>
    //               )}
    //             </div>
    //           );
    //         })
    //       )}
    //       {enabledCertificates.length > 2 && (
    //         <Button
    //           variant="outline"
    //           onClick={() => setShowAllCertificates((v) => !v)}
    //           className="w-full border border-gray-300 text-gray-700 hover:bg-gray-50 hover:border-gray-400 font-medium text-sm rounded-md transition-all"
    //         >
    //           {showAllCertificates
    //             ? "Show Less"
    //             : `View All Certificates (${enabledCertificates.length})`}
    //         </Button>
    //       )}
    //     </CardContent>
    //   </Card>
    // ),
    education: (
      <Card
        key="education"
        className="h-full bg-white rounded-xl border border-gray-200 hover:border-blue-400 transition-all duration-200 shadow-sm hover:shadow-md"
      >
        <CardHeader className="px-6 py-4 border-b border-gray-100">
          <div className="flex items-center w-full justify-between">
            <CardTitle className="flex items-center gap-3 m-0 p-0">
              <div className="w-10 h-10 rounded-lg bg-blue-50 flex items-center justify-center">
                <Award className="w-5 h-5 text-blue-600" />
              </div>
              <span className="text-lg font-semibold text-gray-900">
                Education
              </span>
              <Badge className="bg-blue-50 text-blue-700 px-2.5 py-0.5 rounded-md text-xs font-medium ml-2">
                {
                  userData.education.filter(
                    (education) => 
                      education.enabled !== false && 
                      (education.approval_status === "verified" || education.approval_status === "approved")
                  ).length
                }
              </Badge>
            </CardTitle>
            <button
              className="p-2 rounded-md hover:bg-gray-100 transition-colors"
              title="Edit Education"
              onClick={() => setActiveModal("education")}
            >
              <Edit className="w-4 h-4 text-gray-600" />
            </button>
          </div>
        </CardHeader>
        <CardContent className="pt-4 p-6 space-y-3">
          {(showAllEducation
            ? userData.education.filter(
              (education) => 
                education.enabled !== false && 
                (education.approval_status === "verified" || education.approval_status === "approved")
            )
            : userData.education
              .filter((education) => 
                education.enabled !== false && 
                (education.approval_status === "verified" || education.approval_status === "approved")
              )
              .slice(0, 2)
          ).map((education, idx) => (
            <div
              key={education.id || `edu-${idx}`}
              className="p-4 rounded-lg bg-gray-50 border border-gray-200 hover:bg-white hover:border-blue-300 transition-all"
            >
              <div className="flex items-center justify-between mb-3">
                <div>
                  <h4 className="font-semibold text-gray-900 text-base mb-0.5">
                    {education.degree || "N/A"}
                  </h4>
                  <p className="text-gray-600 text-sm">
                    {education.university || "N/A"}
                  </p>
                </div>
                <Badge
                  className={`px-2.5 py-1 text-xs font-medium rounded-md ${education.status === "ongoing"
                    ? "bg-blue-100 text-blue-700"
                    : "bg-green-100 text-green-700"
                    }`}
                >
                  {education.status || "N/A"}
                </Badge>
              </div>
              <div className="flex gap-6 text-xs">
                <div key={`edu-level-${education.id}`}>
                  <p className="text-gray-500 mb-0.5">Level</p>
                  <p className="font-medium text-gray-900">
                    {education.level || "N/A"}
                  </p>
                </div>
                <div key={`edu-year-${education.id}`}>
                  <p className="text-gray-500 mb-0.5">Year</p>
                  <p className="font-medium text-gray-900">
                    {education.yearOfPassing || "N/A"}
                  </p>
                </div>
                <div key={`edu-grade-${education.id}`}>
                  <p className="text-gray-500 mb-0.5">Grade</p>
                  <p className="font-medium text-gray-900">
                    {education.cgpa || "N/A"}
                  </p>
                </div>
              </div>
            </div>
          ))}
          {userData.education.filter((education) => 
            education.enabled !== false && 
            (education.approval_status === "verified" || education.approval_status === "approved")
          ).length > 2 && (
              <Button
                variant="outline"
                onClick={() => setShowAllEducation((v) => !v)}
                className="w-full border border-gray-300 text-gray-700 hover:bg-gray-50 hover:border-gray-400 font-medium text-sm rounded-md transition-all"
              >
                {showAllEducation ? "Show Less" : "View All Qualifications"}
              </Button>
            )}
        </CardContent>
      </Card>
    ),
    // training: (
    //   <Card
    //     key="training"
    //     className="h-full bg-white rounded-xl border border-gray-200 hover:border-blue-400 transition-all duration-200 shadow-sm hover:shadow-md"
    //   >
    //     <CardHeader className="px-6 py-4 border-b border-gray-100">
    //       <div className="flex items-center w-full justify-between">
    //         <CardTitle className="flex items-center gap-3 m-0 p-0">
    //           <div className="w-10 h-10 rounded-lg bg-blue-50 flex items-center justify-center">
    //             <Code className="w-5 h-5 text-blue-600" />
    //           </div>
    //           <span className="text-lg font-semibold text-gray-900">
    //             Training
    //           </span>
    //         </CardTitle>
    //         <button
    //           className="p-2 rounded-md hover:bg-gray-100 transition-colors"
    //           title="Edit Training"
    //           onClick={() => setActiveModal("training")}
    //         >
    //           <Edit className="w-4 h-4 text-gray-600" />
    //         </button>
    //       </div>
    //     </CardHeader>

    //     <CardContent className="pt-4 p-6 space-y-4">
    //       {(showAllTraining
    //         ? userData.training.filter((t) => t.enabled !== false)
    //         : userData.training.filter((t) => t.enabled !== false).slice(0, 2)
    //       ).map((training, idx) => (
    //         <div
    //           key={training.id || `training-${training.course}-${idx}`}
    //           className="p-4 rounded-xl bg-gray-50 border border-gray-200 hover:bg-white hover:border-blue-300 transition-all duration-200"
    //         >
    //           {/* Header */}
    //           <div className="flex items-center justify-between mb-2">
    //             <h4 className="font-semibold text-gray-900 text-base truncate max-w-[75%]">
    //               {training.course}
    //             </h4>
    //             <Badge
    //               className={`px-2.5 py-1 text-xs font-medium rounded-md ${training.status === "completed"
    //                 ? "bg-green-100 text-green-700"
    //                 : "bg-blue-100 text-blue-700"
    //                 }`}
    //             >
    //               {training.status === "completed" ? "Completed" : "Ongoing"}
    //             </Badge>
    //           </div>

    //           {/* Meta info */}
    //           <div className="text-xs text-gray-600 mb-2 space-y-1">
    //             {training.provider && (
    //               <div className="flex items-center gap-1.5">
    //                 <BookOpen className="w-3.5 h-3.5 text-gray-500" />
    //                 <span>{training.provider}</span>
    //               </div>
    //             )}
    //             {training.duration && (
    //               <div className="flex items-center gap-1.5">
    //                 <Calendar className="w-3.5 h-3.5 text-gray-500" />
    //                 <span>{training.duration}</span>
    //               </div>
    //             )}
    //           </div>

    //           {/* Progress bar */}
    //           <div className="mt-2">
    //             <div className="flex justify-between items-center text-xs font-medium text-gray-700 mb-1">
    //               <span>Progress</span>
    //               <span className="text-blue-600">{training.progress}%</span>
    //             </div>
    //             <div className="w-full h-2.5 bg-gray-200 rounded-full overflow-hidden">
    //               <div
    //                 className="h-2.5 bg-gradient-to-r from-blue-500 to-indigo-500 rounded-full transition-all duration-500 ease-out"
    //                 style={{ width: `${training.progress}%` }}
    //               />
    //             </div>
    //           </div>

    //           {/* Skills */}
    //           {Array.isArray(training.skills) && training.skills.length > 0 && (
    //             <div className="mt-3">
    //               <p className="text-xs font-semibold text-gray-700 mb-1">
    //                 Skills Covered:
    //               </p>
    //               <div className="flex flex-wrap gap-2">
    //                 {(training.showAllSkills
    //                   ? training.skills
    //                   : training.skills.slice(0, 4)
    //                 ).map((skill, i) => (
    //                   <span
    //                     key={`skill-${training.id}-${i}`}
    //                     className="px-2.5 py-1 text-[11px] rounded-md bg-blue-50 text-blue-700 font-medium"
    //                   >
    //                     {skill}
    //                   </span>
    //                 ))}
    //               </div>
    //               {training.skills.length > 4 && (
    //                 <button
    //                   onClick={() =>
    //                     setUserData((prev) => ({
    //                       ...prev,
    //                       training: prev.training.map((t) =>
    //                         t.id === training.id
    //                           ? { ...t, showAllSkills: !t.showAllSkills }
    //                           : t
    //                       ),
    //                     }))
    //                   }
    //                   className="text-xs text-blue-600 hover:text-blue-800 mt-1"
    //                 >
    //                   {training.showAllSkills
    //                     ? "Show Less"
    //                     : `Show All (${training.skills.length})`}
    //                 </button>
    //               )}
    //             </div>
    //           )}
    //         </div>
    //       ))}

    //       {/* Show More / Less Button */}
    //       {userData.training.filter((t) => t.enabled !== false).length > 2 && (
    //         <Button
    //           variant="outline"
    //           onClick={() => setShowAllTraining((v) => !v)}
    //           className="w-full border border-gray-300 text-gray-700 hover:bg-gray-50 hover:border-gray-400 font-medium text-sm rounded-md transition-all"
    //         >
    //           {showAllTraining ? "Show Less" : "View All Courses"}
    //         </Button>
    //       )}
    //     </CardContent>
    //   </Card>
    // ),
    training: (
  <Card
    key="training"
    className="h-full bg-white rounded-xl border border-gray-200 hover:border-blue-400 transition-all duration-200 shadow-sm hover:shadow-md"
  >
    <CardHeader className="px-6 py-4 border-b border-gray-100">
      <div className="flex items-center w-full justify-between">
        <CardTitle className="flex items-center gap-3 m-0 p-0">
          <div className="w-10 h-10 rounded-lg bg-blue-50 flex items-center justify-center">
            <Code className="w-5 h-5 text-blue-600" />
          </div>
          <span className="text-lg font-semibold text-gray-900">Training</span>
        </CardTitle>
        <button
          className="p-2 rounded-md hover:bg-gray-100 transition-colors"
          title="Edit Training"
          onClick={() => setActiveModal("training")}
        >
          <Edit className="w-4 h-4 text-gray-600" />
        </button>
      </div>
    </CardHeader>

    <CardContent className="pt-4 p-6 space-y-4">
      {/* {(showAllTraining
        ? userData.training.filter((t) => t.enabled !== false)
        : userData.training.filter((t) => t.enabled !== false).slice(0, 2)
      ).map((training, idx) => { */}
       {(showAllTraining
        ? userData.training.filter((t) => t.enabled !== false && (t.approval_status === "verified" || t.approval_status === "approved"))
        : userData.training.filter((t) => t.enabled !== false && (t.approval_status === "verified" || t.approval_status === "approved")).slice(0, 2)
      ).map((training, idx) => {
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
            className="p-4 rounded-xl bg-gray-50 border border-gray-200 hover:bg-white hover:border-blue-300 transition-all duration-200"
          >
            {/* Header */}
            <div className="flex items-center justify-between mb-2">
              <h4 className="font-semibold text-gray-900 text-base truncate max-w-[75%]">
                {training.course}
              </h4>
              <Badge
                className={`px-2.5 py-1 text-xs font-medium rounded-md ${
                  training.status === "completed"
                    ? "bg-green-100 text-green-700"
                    : "bg-blue-100 text-blue-700"
                }`}
              >
                {training.status === "completed" ? "Completed" : "Ongoing"}
              </Badge>
            </div>

            {/* Meta info */}
            <div className="text-xs text-gray-600 mb-2 space-y-1">
              {training.provider && (
                <div className="flex items-center gap-1.5">
                  <BookOpen className="w-3.5 h-3.5 text-gray-500" />
                  <span>{training.provider}</span>
                </div>
              )}
              {training.duration && (
                <div className="flex items-center gap-1.5">
                  <Calendar className="w-3.5 h-3.5 text-gray-500" />
                  <span>{training.duration}</span>
                </div>
              )}
            </div>

            {/* Progress bar */}
            {(training.total_modules > 0 || training.completed_modules > 0 || training.hours_spent > 0) && (
              <div className="mt-2">
                {/* Progress Header */}
                <div className="flex justify-between items-center text-xs font-medium text-gray-700 mb-1">
                  <span>Progress</span>
                  <span className="text-blue-600">{progressValue}%</span>
                </div>

                {/* Progress Bar */}
                <div className="w-full h-2.5 bg-gray-200 rounded-full overflow-hidden">
                  <div
                    className="h-2.5 bg-gradient-to-r from-blue-500 to-indigo-500 rounded-full transition-all duration-500 ease-out"
                    style={{ width: `${progressValue}%` }}
                  />
                </div>

                {/* Modules & Hours Info */}
                <div className="text-xs text-gray-500 mt-1 space-x-2">
                  {training.completed_modules != null && training.total_modules != null && (
                    <span>
                      Modules: {training.completed_modules}/{training.total_modules}
                    </span>
                  )}
                  {training.hours_spent != null && <span>Hours Spent: {training.hours_spent}</span>}
                </div>
              </div>
            )}

            {/* Skills */}
            {Array.isArray(training.skills) && training.skills.length > 0 && (
              <div className="mt-3">
                <p className="text-xs font-semibold text-gray-700 mb-1">Skills Covered:</p>
                <div className="flex flex-wrap gap-2">
                  {(training.showAllSkills ? training.skills : training.skills.slice(0, 4)).map(
                    (skill, i) => (
                      <span
                        key={`skill-${training.id}-${i}`}
                        className="px-2.5 py-1 text-[11px] rounded-md bg-blue-50 text-blue-700 font-medium"
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

      {/* Show More / Less Button */}
      {userData.training.filter((t) => t.enabled !== false).length > 2 && (
        <Button
          variant="outline"
          onClick={() => setShowAllTraining((v) => !v)}
          className="w-full border border-gray-300 text-gray-700 hover:bg-gray-50 hover:border-gray-400 font-medium text-sm rounded-md transition-all"
        >
          {showAllTraining ? "Show Less" : "View All Courses"}
        </Button>
      )}
    </CardContent>
  </Card>
),


    // experience: (() => {
    //   // Check if student is from university (not school)
    //   // Use database fields: school_id/school_class_id indicates school, university_college_id indicates university
    //   const isSchoolStudent = studentData?.school_id || studentData?.school_class_id;
    //   const isUniversityStudent = studentData?.university_college_id || studentData?.universityId;

    //   // Fallback: Check education level if database fields are not available
    //   const hasHighSchoolOnly = userData.education.length > 0 &&
    //     userData.education.every(edu =>
    //       edu.level && edu.level.toLowerCase().includes('high school')
    //     );

    //   // Debug logging
    //   console.log('Experience Card Debug:', {
    //     isSchoolStudent,
    //     isUniversityStudent,
    //     hasHighSchoolOnly,
    //     studentData: studentData ? 'loaded' : 'not loaded',
    //     school_id: studentData?.school_id,
    //     school_class_id: studentData?.school_class_id,
    //     university_college_id: studentData?.university_college_id,
    //     universityId: studentData?.universityId,
    //     education: userData.education
    //   });

    //   // Hide experience card for school students
    //   if (isSchoolStudent || hasHighSchoolOnly) {
    //     console.log('Hiding Experience card - student is from school');
    //     return null;
    //   }

    //   // Also hide if no university affiliation is found
    //   if (!isUniversityStudent) {
    //     console.log('Hiding Experience card - no university affiliation found');
    //     return null;
    //   }

    //   return (
    //     <Card
    //       key="experience"
    //       className="h-full bg-white rounded-xl border border-gray-200 hover:border-blue-400 transition-all duration-200 shadow-sm hover:shadow-md"
    //     >
    //       <CardHeader className="px-6 py-4 border-b border-gray-100">
    //         <div className="flex items-center w-full justify-between">
    //           <CardTitle className="flex items-center gap-3 m-0 p-0">
    //             <div className="w-10 h-10 rounded-lg bg-blue-50 flex items-center justify-center">
    //               <Users className="w-5 h-5 text-blue-600" />
    //             </div>
    //             <span className="text-lg font-semibold text-gray-900">
    //               Experience
    //             </span>
    //           </CardTitle>
    //           <button
    //             className="p-2 rounded-md hover:bg-gray-100 transition-colors"
    //             title="Edit Experience"
    //             onClick={() => setActiveModal("experience")}
    //           >
    //             <Edit className="w-4 h-4 text-gray-600" />
    //           </button>
    //         </div>
    //       </CardHeader>
    //       <CardContent className="pt-4 p-6 space-y-3">
    //         {(showAllExperience
    //           ? userData.experience.filter((exp) => exp.enabled !== false)
    //           : userData.experience
    //             .filter((exp) => exp.enabled !== false)
    //             .slice(0, 2)
    //         ).map((exp, idx) => (
    //           <div
    //             key={exp.id || `${exp.role}-${exp.organization}-${idx}`}
    //             className="p-4 rounded-lg bg-gray-50 border border-gray-200 hover:bg-white hover:border-blue-300 transition-all"
    //           >
    //             <div className="flex items-center justify-between">
    //               <div>
    //                 <p className="font-semibold text-gray-900 text-base mb-1">
    //                   {exp.role}
    //                 </p>
    //                 <p className="text-blue-600 text-sm font-medium mb-1">
    //                   {exp.organization}
    //                 </p>
    //                 <p className="text-xs text-gray-600">{exp.duration}</p>
    //               </div>
    //               {exp.verified && (
    //                 <Badge className="bg-green-100 text-green-700 px-2.5 py-1 rounded-md text-xs font-medium flex items-center gap-1">
    //                   <CheckCircle className="w-3 h-3" />
    //                   Verified
    //                 </Badge>
    //               )}
    //             </div>
    //           </div>
    //         ))}
    //         {userData.experience.filter((exp) => exp.enabled !== false).length >
    //           2 && (
    //             <Button
    //               variant="outline"
    //               onClick={() => setShowAllExperience((v) => !v)}
    //               className="w-full border border-gray-300 text-gray-700 hover:bg-gray-50 hover:border-gray-400 font-medium text-sm rounded-md transition-all"
    //             >
    //               {showAllExperience ? "Show Less" : "View All Experience"}
    //             </Button>
    //           )}
    //       </CardContent>
    //     </Card>
    //   );
    // })(),
    experience: (
  <Card key="experience" className="h-full border-t-4 border-t-indigo-500 shadow-lg hover:shadow-xl transition-shadow cursor-pointer" onClick={() => navigate('/student/my-experience')}>
    <CardHeader className="bg-gradient-to-r from-indigo-50 to-blue-50">
      <CardTitle className="flex items-center justify-between text-indigo-700">
        <div className="flex items-center gap-2">
          <Users className="w-5 h-5" />
          My Experience
        </div>
        <div className="flex gap-2">
          <Button
            variant="ghost"
            size="sm"
            onClick={(e) => {
              e.stopPropagation();
              setActiveModal('experience');
            }}
            className="text-indigo-600 hover:text-indigo-700 hover:bg-indigo-100 p-1"
            title="Edit Experience"
          >
            <Edit className="w-4 h-4" />
          </Button>
          <Button
            variant="ghost"
            size="sm"
            className="text-indigo-600 hover:text-indigo-700 hover:bg-indigo-100 p-1"
            onClick={(e) => {
              e.stopPropagation();
              navigate('/student/my-experience');
            }}
          >
            View All →
          </Button>
        </div>
      </CardTitle>
    </CardHeader>
    <CardContent className="space-y-4">
      {userData.experience
        ?.filter(exp => 
          exp.enabled !== false && 
          (exp.approval_status === "verified" || exp.approval_status === "approved")
        )
        .slice(0, 2)
        .map((exp, index) => (
          <div key={index} className="p-4 bg-gradient-to-r from-indigo-50 to-white rounded-lg border-l-4 border-l-indigo-400 hover:shadow-md transition-shadow">
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <p className="font-semibold text-sm text-gray-800">{exp.role}</p>
                <p className="text-sm text-indigo-600 font-medium">{exp.organization}</p>
                <p className="text-xs text-gray-600 mt-1">{exp.duration}</p>
              </div>
              {(exp.approval_status === "verified" || exp.approval_status === "approved") && (
                <Badge className="bg-emerald-500 hover:bg-emerald-500 text-white">
                  <CheckCircle className="w-3 h-3 mr-1" />
                  Verified
                </Badge>
              )}
            </div>
          </div>
        ))}
    </CardContent>
  </Card>
),
    softSkills: (
      <Card
        key="softSkills"
        className="h-full bg-white rounded-xl border border-gray-200 hover:border-blue-400 transition-all duration-200 shadow-sm hover:shadow-md"
      >
        <CardHeader className="px-6 py-4 border-b border-gray-100">
          <div className="flex items-center w-full justify-between">
            <CardTitle className="flex items-center gap-3 m-0 p-0">
              <div className="w-10 h-10 rounded-lg bg-blue-50 flex items-center justify-center">
                <MessageCircle className="w-5 h-5 text-blue-600" />
              </div>
              <span className="text-lg font-semibold text-gray-900">
                Soft Skills
              </span>
            </CardTitle>
            <button
              className="p-2 rounded-md hover:bg-gray-100 transition-colors"
              title="Edit Soft Skills"
              onClick={() => setActiveModal("softSkills")}
            >
              <Edit className="w-4 h-4 text-gray-600" />
            </button>
          </div>
        </CardHeader>
        <CardContent className="pt-4 p-6 space-y-3">
          {userData.softSkills.filter((skill) => skill.enabled !== false && skill.approval_status === 'approved' || skill.approval_status === 'verified')
            .length === 0 ? (
            <div className="text-center py-8">
              <p className="text-slate-500 font-medium">
                No soft skills have been added or verified.
              </p>
            </div>
          ) : (
            (showAllSoftSkills
              ? userData.softSkills.filter((skill) => skill.enabled !== false && skill.approval_status === 'approved' || skill.approval_status === 'verified')
              : userData.softSkills
                .filter((skill) => skill.enabled !== false && skill.approval_status === 'approved' || skill.approval_status === 'verified')
                .slice(0, 2)
            ).map((skill, idx) => (
              <div
                key={skill.id || `soft-skill-${idx}`}
                className="p-4 rounded-lg bg-gray-50 border border-gray-200 hover:bg-white hover:border-blue-300 transition-all"
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
                        className={`px-2.5 py-1 text-xs font-semibold rounded-md border ${getSkillLevelColor(
                          skill.level
                        )}`}
                      >
                        {getSkillLevelText(skill.level)}
                      </Badge>
                      <div className="flex gap-0.5">
                        {renderStars(skill.level)}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            ))
          )}
          {userData.softSkills.filter((skill) => skill.enabled !== false && skill.approval_status === 'approved' || skill.approval_status === 'verified')
            .length > 2 && (
              <Button
                variant="outline"
                onClick={() => setShowAllSoftSkills((v) => !v)}
                className="w-full border border-gray-300 text-gray-700 hover:bg-gray-50 hover:border-gray-400 font-medium text-sm rounded-md transition-all"
              >
                {showAllSoftSkills ? "Show Less" : "View All Soft Skills"}
              </Button>
            )}
        </CardContent>
      </Card>
    ),
    certificates: (
      <Card
        key="certificates"
        className="h-full bg-white rounded-xl border border-gray-200 hover:border-blue-400 transition-all duration-200 shadow-sm hover:shadow-md"
      >
        <CardHeader className="px-6 py-4 border-b border-gray-100">
          <div className="flex items-center w-full justify-between">
            <CardTitle className="flex items-center gap-3 m-0 p-0">
              <div className="w-10 h-10 rounded-lg bg-blue-50 flex items-center justify-center">
                <Medal className="w-5 h-5 text-blue-600" />
              </div>
              <span className="text-lg font-semibold text-gray-900">
                Certificates
              </span>
              <Badge className="bg-blue-50 text-blue-700 px-2.5 py-0.5 rounded-md text-xs font-medium ml-2">
                {enabledCertificates.length}
              </Badge>
            </CardTitle>
            <button
              className="p-2 rounded-md hover:bg-gray-100 transition-colors"
              title="Manage Certificates"
              onClick={() => setActiveModal("certificates")}
            >
              <Edit className="w-4 h-4 text-gray-600" />
            </button>
          </div>
        </CardHeader>
        <CardContent className="p-6 space-y-3">
          {enabledCertificates.length === 0 ? (
            <div className="text-center py-8">
              <p className="text-slate-500 font-medium">
                No certificates uploaded yet
              </p>
            </div>
          ) : (
            (showAllCertificates
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
                  className={`p-4 rounded-lg bg-gray-50 border border-gray-200 hover:bg-white hover:border-blue-300 transition-all space-y-3 ${cert.enabled ? "" : "opacity-75"
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

                  {(cert.level || cert.category || cert.type) && (
                    <div className="flex flex-wrap gap-2">
                      <span className="px-3 py-1 rounded-full bg-amber-50 text-amber-700 text-xs font-medium">
                        {cert.level || cert.category || cert.type}
                      </span>
                    </div>
                  )}

                  {certificateLink && (
                    <div className="pt-1">
                      <a
                        href={certificateLink}
                        target="_blank"
                        rel="noopener noreferrer"
                      >
                        <Button
                          size="sm"
                          className="bg-blue-600 hover:bg-blue-700 text-white font-medium px-5 py-2 text-sm rounded-md transition-colors"
                        >
                          View Credential
                        </Button>
                      </a>
                    </div>
                  )}
                </div>
              );
            })
          )}
          {enabledCertificates.length > 2 && (
            <Button
              variant="outline"
              onClick={() => setShowAllCertificates((v) => !v)}
              className="w-full border border-gray-300 text-gray-700 hover:bg-gray-50 hover:border-gray-400 font-medium text-sm rounded-md transition-all"
            >
              {showAllCertificates
                ? "Show Less"
                : `View All Certificates (${enabledCertificates.length})`}
            </Button>
          )}
        </CardContent>
      </Card>
    ),
    achievements: (
      <></>
      // <Card
      //   key="achievements"
      //   className="h-full bg-gradient-to-br from-purple-50 via-pink-50 to-amber-50 rounded-xl border-2 border-purple-200 hover:border-purple-400 transition-all duration-200 shadow-lg hover:shadow-xl"
      // >
      //   <CardHeader className="px-6 py-4 border-b border-purple-100">
      //     <div className="flex items-center w-full justify-between">
      //       <CardTitle className="flex items-center gap-3 m-0 p-0">
      //         <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center shadow-md">
      //           <Trophy className="w-5 h-5 text-white" />
      //         </div>
      //         <div>
      //           <span className="text-lg font-semibold text-gray-900">
      //             Achievements & Badges
      //           </span>
      //           <p className="text-xs text-gray-600 font-normal mt-0.5">
      //             From separate tables
      //           </p>
      //         </div>
      //       </CardTitle>
      //     </div>
      //   </CardHeader>
      //   <CardContent className="p-6 space-y-4">
      //     {achievementsLoading ? (
      //       <div className="flex justify-center items-center py-8">
      //         <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-600"></div>
      //       </div>
      //     ) : (
      //       <>
      //         {/* Badges Preview */}
      //         {badges.length > 0 && (
      //           <div className="space-y-3">
      //             <div className="flex items-center justify-between">
      //               <h4 className="text-sm font-semibold text-gray-700 flex items-center gap-2">
      //                 <Sparkles className="w-4 h-4 text-amber-500" />
      //                 AI-Generated Badges
      //               </h4>
      //               <Badge className="bg-amber-500 text-white text-xs px-2 py-1">
      //                 {badges.length}
      //               </Badge>
      //             </div>
      //             <div className="grid grid-cols-2 gap-2">
      //               {badges.slice(0, 4).map((badge) => (
      //                 <div
      //                   key={badge.id}
      //                   className="p-3 rounded-lg bg-white border-2 border-purple-200 hover:border-purple-400 transition-all text-center"
      //                 >
      //                   <div className="text-3xl mb-1">{badge.icon}</div>
      //                   <p className="text-xs font-semibold text-gray-800 truncate">
      //                     {badge.name}
      //                   </p>
      //                 </div>
      //               ))}
      //             </div>
      //             {badges.length > 4 && (
      //               <p className="text-xs text-center text-gray-600">
      //                 +{badges.length - 4} more badges
      //               </p>
      //             )}
      //           </div>
      //         )}

      //         {/* Achievements Count */}
      //         <div className="flex items-center justify-between p-3 bg-white rounded-lg border border-purple-200">
      //           <div className="flex items-center gap-2">
      //             <Target className="w-5 h-5 text-purple-600" />
      //             <span className="text-sm font-medium text-gray-700">
      //               Total Achievements
      //             </span>
      //           </div>
      //           <span className="text-2xl font-bold text-purple-600">
      //             {achievements.length}
      //           </span>
      //         </div>

      //         {/* View Full Page Button */}
      //         <Button
      //           onClick={() => navigate("/student/achievements")}
      //           className="w-full bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white font-medium rounded-lg transition-all flex items-center justify-center gap-2"
      //         >
      //           View All Achievements
      //           <ChevronRight className="w-4 h-4" />
      //         </Button>
      //       </>
      //     )}
      //   </CardContent>
      // </Card>
    ),
  };

  // Define card order based on active navigation item
  const cardOrders = {
    opportunities: isViewingOthersProfile
      ? [
          "institution",
          "opportunities",
          "education",
          "training",
          "experience",
          "certificates",
          "projects",
          "softSkills",
          "technicalSkills",
        ]
      : [
          "institution",
          "opportunities",
          "achievements",
          "education",
          "training",
          "experience",
          "certificates",
          "projects",
          "softSkills",
          "technicalSkills",
        ],
    skills: [
      "institution",
      "opportunities",
      "technicalSkills",
      "softSkills",
      "projects",
      "certificates",
      "education",
      "training",
      "experience",
    ],
    training: [
      "institution",
      "opportunities",
      "training",
      "projects",
      "certificates",
      "education",
      "technicalSkills",
      "softSkills",
      "experience",
    ],
    experience: [
      "institution",
      "opportunities",
      "experience",
      "projects",
      "certificates",
      "education",
      "training",
      "technicalSkills",
      "softSkills",
    ],
  };

  const renderCardsByPriority = () => {
    const order = cardOrders[activeNavItem] || cardOrders.opportunities;

    return order.map((cardKey, index) => {
      const card = allCards[cardKey];
      if (!card) return null;

      // Add priority indicator for the first card
      if (index === 0) {
        return React.cloneElement(card, {
          className: `${card.props.className} ring-2 ring-blue-400 ring-opacity-50`,
          key: cardKey,
          children: [
            React.cloneElement(card.props.children[0], {
              children: [
                card.props.children[0].props.children,
                // <Badge key="priority" className="bg-blue-500 hover:bg-blue-500 text-white text-xs ml-2">
                //   ✨ Priority
                // </Badge>
              ],
            }),
            ...card.props.children.slice(1),
          ],
        });
      }
      return card;
    });
  };

  // Utility to truncate long text and toggle full view

  return (
    <div className="min-h-screen bg-[#F8FAFC] py-8 px-6">
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

      <div className="max-w-7xl mx-auto">
        {/* View Switcher Tabs */}
        {!isViewingOthersProfile && (
          <div className="mb-6">
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-1.5">
              <div className="grid grid-cols-2 gap-2">
                <button
                  onClick={() => setActiveView('dashboard')}
                  className={`flex items-center justify-center gap-2 px-6 py-3 rounded-lg font-semibold transition-all duration-200 ${
                    activeView === 'dashboard'
                      ? 'bg-gradient-to-r from-indigo-600 to-blue-600 text-white shadow-md'
                      : 'bg-transparent text-gray-600 hover:bg-gray-50'
                  }`}
                >
                  <LayoutDashboard className="w-5 h-5" />
                  <span>Dashboard</span>
                </button>
                <button
                  onClick={() => setActiveView('analytics')}
                  className={`flex items-center justify-center gap-2 px-6 py-3 rounded-lg font-semibold transition-all duration-200 ${
                    activeView === 'analytics'
                      ? 'bg-gradient-to-r from-indigo-600 to-blue-600 text-white shadow-md'
                      : 'bg-transparent text-gray-600 hover:bg-gray-50'
                  }`}
                >
                  <BarChart3 className="w-5 h-5" />
                  <span>Analytics</span>
                </button>
              </div>
            </div>
          </div>
        )}
        {/* Navigation Bar */}
        {/* <div className="mb-6">
          <Card className="shadow-lg">
            <CardContent className="p-4">
              <div className="flex flex-wrap gap-2 justify-center">
                {[
                  { id: 'opportunities', label: 'Opportunities', icon: ExternalLink },
                  { id: 'skills', label: 'My Skills', icon: Code },
                  { id: 'training', label: 'My Training', icon: Award },
                  { id: 'experience', label: 'My Experience', icon: Users },
                ].map((item) => {
                  const Icon = item.icon;
                  const isActive = activeNavItem === item.id;
                  return (
                    <Button
                      key={item.id}
                      variant={isActive ? "default" : "outline"}
                      onClick={() => {
                        setActiveNavItem(item.id);
                      }}
                      className={`flex items-center gap-2 transition-all ${
                        isActive
                          ? 'bg-blue-600 hover:bg-blue-700 text-white shadow-md transform scale-105'
                          : 'hover:bg-blue-50 hover:border-blue-300 hover:text-blue-700'
                      }`}
                    >
                      <Icon className="w-4 h-4" />
                      {item.label}
                    </Button>
                  );
                })}
              </div>
            </CardContent>
          </Card>
        </div> */}

        {/* Conditional Rendering based on active view */}
        {activeView === 'analytics' && !isViewingOthersProfile ? (
          <AnalyticsView studentId={studentData?.id} userEmail={userEmail} />
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* LEFT COLUMN - User Activity & Updates - Only show for own profile */}
            {!isViewingOthersProfile && (
            <div className="lg:col-span-1 space-y-6">
              {/* Sticky container for both cards */}
              <div className="sticky top-20 z-30 flex flex-col gap-6">
                {/* Recent Updates */}
                <RecentUpdatesCard
                  ref={recentUpdatesRef}
                  updates={recentUpdates}
                  loading={recentUpdatesLoading}
                  error={
                    recentUpdatesError ? "Failed to load recent updates" : null
                  }
                  onRetry={refreshRecentUpdates}
                  emptyMessage="No recent updates available"
                  isExpanded={showAllRecentUpdates}
                  onToggle={(next) => setShowAllRecentUpdates(next)}
                  badgeContent={
                    unreadCount > 0 ? (
                      <Badge className="bg-red-500 hover:bg-red-500 text-white px-2.5 py-1 rounded-full text-xs font-semibold flex items-center gap-1.5">
                        <MessageCircle className="w-3.5 h-3.5" />
                        {unreadCount} {unreadCount === 1 ? "message" : "messages"}
                      </Badge>
                    ) : null
                  }
                  getUpdateClassName={(update) => {
                    switch (update.type) {
                      case "shortlist_added":
                        return "bg-yellow-50 border-yellow-300";
                      case "offer_extended":
                        return "bg-green-50 border-green-300";
                      case "offer_accepted":
                        return "bg-emerald-50 border-emerald-300";
                      case "placement_hired":
                        return "bg-purple-50 border-purple-300";
                      case "stage_change":
                        return "bg-indigo-50 border-indigo-300";
                      case "application_rejected":
                        return "bg-red-50 border-red-300";
                      default:
                        return "bg-gray-50 border-gray-200";
                    }
                  }}
                />

                {/* Suggested Next Steps - AI Job Matching */}
                <Card
                  ref={suggestedNextStepsRef}
                  className="bg-white rounded-xl border border-gray-200 shadow-sm"
                  data-testid="suggested-next-steps-card"
                >
                  <CardHeader className="px-6 py-4 border-b border-gray-100">
                    <CardTitle className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-amber-50 to-orange-50 flex items-center justify-center border border-amber-200">
                          <Sparkles className="w-5 h-5 text-amber-600" />
                        </div>
                        <div>
                          <span className="text-lg font-semibold text-gray-900">
                            Suggested Next Steps
                          </span>
                          <p className="text-xs text-gray-500 font-normal mt-0.5">
                            AI-matched job opportunities for you
                          </p>
                        </div>
                      </div>
                      {matchedJobs.length > 0 && (
                        <Badge
                          variant="outline"
                          className="bg-green-50 text-green-700 border-green-200"
                        >
                          <Target className="w-3 h-3 mr-1" />
                          {matchedJobs.length} Matches
                        </Badge>
                      )}
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="p-6 space-y-3">
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
                        {matchedJobs.map((match, idx) => (
                          <div
                            key={match.job_id || `job-match-${idx}`}
                            className="p-4 rounded-xl bg-gradient-to-br from-amber-50 to-orange-50 border border-amber-200 hover:border-amber-300 hover:shadow-md transition-all cursor-pointer group"
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
                        ))}

                        {/* Refresh Button */}
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={refreshMatches}
                          className="w-full mt-2 text-amber-700 border-amber-300 hover:bg-amber-50"
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
                            className="p-3 rounded-lg bg-amber-50 border border-amber-200 hover:bg-amber-100 hover:border-amber-300 transition-all"
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

                {/* Student QR Code */}
                {/* {userEmail && (
                  <Card className="border-2 border-purple-500 bg-gradient-to-br from-purple-500 to-purple-600 rounded-2xl shadow-lg hover:shadow-xl transition-shadow">
                    <CardHeader className="pb-2">
                      <CardTitle className="flex items-center gap-2 text-white text-lg font-bold justify-center">
                        <QrCode className="w-5 h-5" />
                        Your QR Profile
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="flex flex-col items-center justify-center py-6 px-6">
                      <div className="bg-white p-6 rounded-2xl shadow-xl">
                        <QRCodeSVG
                          value={qrCodeValue}
                          size={180}
                          level="H"
                          includeMargin={true}
                          bgColor="#ffffff"
                          fgColor="#000000"
                        />
                      </div>
                      <div className="mt-6 text-center">
                        <p className="text-white text-lg font-bold tracking-wide">
                          PASSPORT-ID: {
                            studentData?.passport_id || 
                            (studentData?.id ? studentData.id.toUpperCase().slice(0, 8) : null) || 
                            (userEmail ? userEmail.split('@')[0].toUpperCase().slice(0, 5) : 'STUDENT')
                          }
                        </p>
                        <p className="text-white/80 text-sm mt-2">
                          Scan to view your profile card
                        </p>
                      </div>
                    </CardContent>
                  </Card>
                )} */}
              </div>
            </div>
          )}

          {/* RIGHT COLUMN - 6 Key Boxes with Dynamic Ordering */}
          <div
            className={
              isViewingOthersProfile ? "lg:col-span-3" : "lg:col-span-2"
            }
          >
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              {renderCardsByPriority()}
            </div>

            {/* Achievement Timeline - Below cards in the right column */}
            {!isViewingOthersProfile && (
              <div className="mt-5">
                <AchievementsTimeline userData={userData} />
              </div>
            )}
          </div>
        </div>
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
