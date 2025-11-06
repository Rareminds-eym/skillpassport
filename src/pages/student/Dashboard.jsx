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
  Bell,
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
// Debug utilities removed for production cleanliness

const StudentDashboard = () => {
  const location = useLocation();

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
    }
  });

  // Get unread message count with realtime updates
  const { unreadCount } = useStudentUnreadCount(studentId, !!studentId && !isViewingOthersProfile);

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
    if (!Array.isArray(userData.projects)) return [];
    return userData.projects.filter((project) => project);
  }, [userData.projects]);

  const enabledCertificates = useMemo(() => {
    if (!Array.isArray(userData.certificates)) return [];
    return userData.certificates.filter((cert) => cert);
  }, [userData.certificates]);

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
      studentData: studentData?.id,
      loading: authStudentLoading,
      error: authStudentError,
    });
  }, [studentData, authStudentLoading, authStudentError]);

  // Debug log for opportunities
  useEffect(() => {
      opportunities,
      loading: opportunitiesLoading,
      error: opportunitiesError,
      count: opportunities?.length,
    });
  }, [opportunities, opportunitiesLoading, opportunitiesError]);

  // Debug log for recent updates
  useEffect(() => {
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
          url: import.meta.env.VITE_SUPABASE_URL ? "Set" : "Missing",
          key: import.meta.env.VITE_SUPABASE_ANON_KEY ? "Set" : "Missing",
        });

        const { data, error, count } = await supabase
          .from("opportunities")
          .select("*", { count: "exact" });


        // Run debug for recent updates (commented out to prevent automatic execution)
        // await debugRecentUpdates();
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
        training: Array.isArray(studentData.training)
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
        projects: Array.isArray(studentData.projects)
          ? studentData.projects
          : Array.isArray(studentData.profile?.projects)
          ? studentData.profile.projects
          : Array.isArray(studentData.profile?.profile?.projects)
          ? studentData.profile.profile.projects
          : [],
        certificates: Array.isArray(studentData.certificates)
          ? studentData.certificates
          : Array.isArray(studentData.profile?.certificates)
          ? studentData.profile.certificates
          : Array.isArray(studentData.profile?.profile?.certificates)
          ? studentData.profile.profile.certificates
          : [],
      });
    }
  }, [studentData]);

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
        className={`w-4 h-4 ${
          i < level ? "fill-[#FFD700] text-[#FFD700]" : "text-gray-300"
        }`}
      />
    ));
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

  // Card components for dynamic ordering
  const allCards = {
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
        <CardContent className="p-6 space-y-3">
          {(() => {
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
          ) : (
            (showAllOpportunities
              ? opportunities
              : opportunities.slice(0, 2)
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
          )}
          {opportunities.length > 2 && (
            <Button
              variant="outline"
              onClick={() => setShowAllOpportunities((v) => !v)}
              className="w-full border border-gray-300 text-gray-700 hover:bg-gray-50 hover:border-gray-400 font-medium text-sm rounded-md transition-all"
            >
              {showAllOpportunities
                ? "Show Less"
                : `View All Opportunities (${opportunities.length})`}
            </Button>
          )}
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
        <CardContent className="p-6 space-y-3">
          {(showAllTechnicalSkills
            ? userData.technicalSkills.filter(
                (skill) => skill.enabled !== false
              )
            : userData.technicalSkills
                .filter((skill) => skill.enabled !== false)
                .slice(0, 2)
          ).map((skill, idx) => (
            <div
              key={skill.id || `tech-skill-${idx}`}
              className="p-4 rounded-lg bg-gray-50 border border-gray-200 hover:bg-white hover:border-blue-300 transition-all"
            >
              <div className="flex items-center justify-between">
                <div key={`tech-skill-info-${skill.id}`}>
                  <h4 className="font-semibold text-gray-900 text-base mb-1">
                    {skill.name}
                  </h4>
                  <p className="text-xs text-gray-600 font-medium">
                    {skill.category}
                  </p>
                </div>
                <div
                  key={`tech-skill-stars-${skill.id}`}
                  className="flex gap-1"
                >
                  {renderStars(skill.level)}
                </div>
              </div>
            </div>
          ))}
          {userData.technicalSkills.filter((skill) => skill.enabled !== false)
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
        <CardContent className="p-6 space-y-3">
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
                : Array.isArray(project.techStack)
                ? project.techStack
                : Array.isArray(project.skills)
                ? project.skills
                : [];
              const projectLink = [
                project.link,
                project.github,
              ]
                .map((value) =>
                  typeof value === "string" ? value.trim() : value
                )
                .find((value) => typeof value === "string" && value.length > 0);
              return (
                <div
                  key={project.id || `project-${idx}`}
                  className={`p-4 rounded-lg bg-gray-50 border border-gray-200 hover:bg-white hover:border-blue-300 transition-all space-y-3 ${project.enabled ? "" : "opacity-75"}`}
                >
                  <div className="space-y-2">
                    {/* First row: Title + Badge */}
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
                          {project.duration ||
                            project.timeline ||
                            project.period}
                        </p>
                      )}
                    </div>
                  </div>

                  {project.description && (
                    <TruncatedText text={project.description} maxLength={120} />
                  )}

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
                  {projectLink && (
                    <div className="pt-1">
                      <a
                        href={projectLink}
                        target="_blank"
                        rel="noopener noreferrer"
                      >
                        <Button
                          size="sm"
                          className="bg-blue-600 hover:bg-blue-700 text-white font-medium px-5 py-2 text-sm rounded-md transition-colors"
                        >
                          View Project
                        </Button>
                      </a>
                    </div>
                  )}
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
                My Education
              </span>
              <Badge className="bg-blue-50 text-blue-700 px-2.5 py-0.5 rounded-md text-xs font-medium ml-2">
                {
                  userData.education.filter(
                    (education) => education.enabled !== false
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
        <CardContent className="p-6 space-y-3">
          {(showAllEducation
            ? userData.education.filter(
                (education) => education.enabled !== false
              )
            : userData.education
                .filter((education) => education.enabled !== false)
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
                  className={`px-2.5 py-1 text-xs font-medium rounded-md ${
                    education.status === "ongoing"
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
          {userData.education.filter((education) => education.enabled !== false)
            .length > 2 && (
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
                  className={`p-4 rounded-lg bg-gray-50 border border-gray-200 hover:bg-white hover:border-blue-300 transition-all space-y-3 ${cert.enabled ? "" : "opacity-75"}`}
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
          <span className="text-lg font-semibold text-gray-900">
            My Training
          </span>
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
      {(showAllTraining
        ? userData.training.filter((t) => t.enabled !== false)
        : userData.training
            .filter((t) => t.enabled !== false)
            .slice(0, 2)
      ).map((training, idx) => (
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
          <div className="mt-2">
            <div className="flex justify-between items-center text-xs font-medium text-gray-700 mb-1">
              <span>Progress</span>
              <span className="text-blue-600">{training.progress}%</span>
            </div>
            <div className="w-full h-2.5 bg-gray-200 rounded-full overflow-hidden">
              <div
                className="h-2.5 bg-gradient-to-r from-blue-500 to-indigo-500 rounded-full transition-all duration-500 ease-out"
                style={{ width: `${training.progress}%` }}
              />
            </div>
          </div>

          {/* Skills */}
          {Array.isArray(training.skills) && training.skills.length > 0 && (
            <div className="mt-3">
              <p className="text-xs font-semibold text-gray-700 mb-1">
                Skills Covered:
              </p>
              <div className="flex flex-wrap gap-2">
                {(training.showAllSkills
                  ? training.skills
                  : training.skills.slice(0, 4)
                ).map((skill, i) => (
                  <span
                    key={`skill-${training.id}-${i}`}
                    className="px-2.5 py-1 text-[11px] rounded-md bg-blue-50 text-blue-700 font-medium"
                  >
                    {skill}
                  </span>
                ))}
              </div>
              {training.skills.length > 4 && (
                <button
                  onClick={() =>
                    setUserData((prev) => ({
                      ...prev,
                      training: prev.training.map((t) =>
                        t.id === training.id
                          ? { ...t, showAllSkills: !t.showAllSkills }
                          : t
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
      ))}

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

    experience: (
      <Card
        key="experience"
        className="h-full bg-white rounded-xl border border-gray-200 hover:border-blue-400 transition-all duration-200 shadow-sm hover:shadow-md"
      >
        <CardHeader className="px-6 py-4 border-b border-gray-100">
          <div className="flex items-center w-full justify-between">
            <CardTitle className="flex items-center gap-3 m-0 p-0">
              <div className="w-10 h-10 rounded-lg bg-blue-50 flex items-center justify-center">
                <Users className="w-5 h-5 text-blue-600" />
              </div>
              <span className="text-lg font-semibold text-gray-900">
                My Experience
              </span>
            </CardTitle>
            <button
              className="p-2 rounded-md hover:bg-gray-100 transition-colors"
              title="Edit Experience"
              onClick={() => setActiveModal("experience")}
            >
              <Edit className="w-4 h-4 text-gray-600" />
            </button>
          </div>
        </CardHeader>
        <CardContent className="p-6 space-y-3">
          {(showAllExperience
            ? userData.experience.filter((exp) => exp.enabled !== false)
            : userData.experience
                .filter((exp) => exp.enabled !== false)
                .slice(0, 2)
          ).map((exp, idx) => (
            <div
              key={exp.id || `${exp.role}-${exp.organization}-${idx}`}
              className="p-4 rounded-lg bg-gray-50 border border-gray-200 hover:bg-white hover:border-blue-300 transition-all"
            >
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-semibold text-gray-900 text-base mb-1">
                    {exp.role}
                  </p>
                  <p className="text-blue-600 text-sm font-medium mb-1">
                    {exp.organization}
                  </p>
                  <p className="text-xs text-gray-600">{exp.duration}</p>
                </div>
                {exp.verified && (
                  <Badge className="bg-green-100 text-green-700 px-2.5 py-1 rounded-md text-xs font-medium flex items-center gap-1">
                    <CheckCircle className="w-3 h-3" />
                    Verified
                  </Badge>
                )}
              </div>
            </div>
          ))}
          {userData.experience.filter((exp) => exp.enabled !== false).length >
            2 && (
            <Button
              variant="outline"
              onClick={() => setShowAllExperience((v) => !v)}
              className="w-full border border-gray-300 text-gray-700 hover:bg-gray-50 hover:border-gray-400 font-medium text-sm rounded-md transition-all"
            >
              {showAllExperience ? "Show Less" : "View All Experience"}
            </Button>
          )}
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
                My Soft Skills
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
        <CardContent className="p-6 space-y-3">
          {(showAllSoftSkills
            ? userData.softSkills.filter((skill) => skill.enabled !== false)
            : userData.softSkills
                .filter((skill) => skill.enabled !== false)
                .slice(0, 2)
          ).map((skill, idx) => (
            <div
              key={skill.id || `soft-skill-${idx}`}
              className="p-4 rounded-lg bg-gray-50 border border-gray-200 hover:bg-white hover:border-blue-300 transition-all"
            >
              <div className="flex items-center justify-between">
                <div key={`skill-info-${skill.id}`}>
                  <h4 className="font-semibold text-gray-900 text-base mb-1">
                    {skill.name}
                  </h4>
                  <p className="text-xs text-gray-600">{skill.description}</p>
                </div>
                <div key={`skill-stars-${skill.id}`} className="flex gap-1">
                  {renderStars(skill.level)}
                </div>
              </div>
            </div>
          ))}
          {userData.softSkills.filter((skill) => skill.enabled !== false)
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
  };

  // Define card order based on active navigation item
  const cardOrders = {
    opportunities: isViewingOthersProfile
      ? [
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
          "opportunities",
          "education",
          "training",
          "experience",
          "certificates",
          "projects",
          "softSkills",
          "technicalSkills",
        ],
    skills: [
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

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* LEFT COLUMN - User Activity & Updates - Only show for own profile */}
          {!isViewingOthersProfile && (
            <div className="lg:col-span-1 space-y-6">
              {/* Sticky container for both cards */}
              <div className="sticky top-20 z-30 flex flex-col gap-6">
                {/* Recent Updates */}
                <div
                  ref={recentUpdatesRef}
                  className="bg-white rounded-xl border border-gray-200 shadow-sm"
                >
                  <CardHeader className="px-6 py-4 border-b border-gray-100">
                    <CardTitle className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-lg bg-blue-50 flex items-center justify-center">
                          <Bell className="w-5 h-5 text-blue-600" />
                        </div>
                        <span className="text-lg font-semibold text-gray-900">
                          Recent Updates
                        </span>
                      </div>
                      {unreadCount > 0 && (
                        <Badge className="bg-red-500 hover:bg-red-500 text-white px-2.5 py-1 rounded-full text-xs font-semibold flex items-center gap-1.5">
                          <MessageCircle className="w-3.5 h-3.5" />
                          {unreadCount} {unreadCount === 1 ? 'message' : 'messages'}
                        </Badge>
                      )}
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="p-6">
                    {recentUpdatesLoading ? (
                      <div className="flex justify-center items-center py-8">
                        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                      </div>
                    ) : recentUpdatesError ? (
                      <div className="text-center py-8">
                        <p className="text-red-600 mb-3 font-medium">
                          Failed to load recent updates
                        </p>
                        <Button
                          onClick={refreshRecentUpdates}
                          size="sm"
                          className="bg-blue-600 hover:bg-blue-700 text-white font-medium px-5 py-2 text-sm rounded-md transition-colors"
                        >
                          Retry
                        </Button>
                      </div>
                    ) : recentUpdates.length === 0 ? (
                      <div className="text-center py-8">
                        <p className="text-gray-500 font-medium">
                          No recent updates available
                        </p>
                      </div>
                    ) : (
                      <>
                        <div
                          className={`space-y-2 ${
                            showAllRecentUpdates
                              ? "max-h-96 overflow-y-auto pr-2 scroll-smooth recent-updates-scroll"
                              : ""
                          }`}
                        >
                          {(showAllRecentUpdates
                            ? recentUpdates
                            : recentUpdates.slice(0, 5)
                          ).map((update, idx) => {
                            // Format the message from activity structure
                            const message =
                              update.message ||
                              `${update.user} ${update.action} ${update.candidate}`;

                            // Determine color based on activity type
                            const getActivityColor = (type) => {
                              switch (type) {
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
                            };

                            return (
                              <div
                                key={
                                  update.id ||
                                  `update-${update.timestamp}-${idx}`
                                }
                                className={`p-3 rounded-lg border hover:shadow-sm transition-all flex items-start gap-3 ${getActivityColor(
                                  update.type
                                )}`}
                              >
                                <div className="w-2 h-2 bg-blue-600 rounded-full mt-1.5 flex-shrink-0" />
                                <div className="flex-1">
                                  <p className="text-sm font-medium text-gray-900 mb-0.5">
                                    {update.user && (
                                      <span className="text-blue-700">
                                        {update.user}
                                      </span>
                                    )}
                                    {update.action && (
                                      <span className="text-gray-700">
                                        {" "}
                                        {update.action}{" "}
                                      </span>
                                    )}
                                    {update.candidate && (
                                      <span className="font-semibold">
                                        {update.candidate}
                                      </span>
                                    )}
                                    {update.message && (
                                      <span className="text-gray-700">
                                        {update.message}
                                      </span>
                                    )}
                                  </p>
                                  {update.details && (
                                    <p className="text-xs text-gray-600 mb-1">
                                      {update.details}
                                    </p>
                                  )}
                                  <p className="text-xs text-gray-500">
                                    {typeof update.timestamp === "string" &&
                                    update.timestamp.includes("ago")
                                      ? update.timestamp
                                      : new Date(
                                          update.timestamp
                                        ).toLocaleString()}
                                  </p>
                                </div>
                              </div>
                            );
                          })}
                        </div>
                        {recentUpdates.length > 5 && (
                          <div className="mt-3">
                            <Button
                              variant="outline"
                              className="w-full border border-gray-300 text-gray-700 hover:bg-gray-50 hover:border-gray-400 font-medium text-sm rounded-md transition-all"
                              onClick={() =>
                                setShowAllRecentUpdates(!showAllRecentUpdates)
                              }
                            >
                              {showAllRecentUpdates ? "See Less" : "See More"}
                            </Button>
                          </div>
                        )}
                      </>
                    )}
                  </CardContent>
                </div>

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
                        <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">
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
                        <p className="ml-3 text-sm text-gray-500">Finding best job matches for you...</p>
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
                                window.open(match.opportunity.application_link, '_blank');
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
                                {match.job_title || match.opportunity?.job_title}
                              </h4>
                              <div className="flex items-center gap-2 text-sm text-gray-600">
                                <Building2 className="w-4 h-4" />
                                <span className="font-medium">{match.company_name || match.opportunity?.company_name}</span>
                              </div>
                            </div>

                            {/* Job Details */}
                            {match.opportunity && (
                              <div className="flex flex-wrap items-center gap-3 mb-3 text-xs text-gray-600">
                                {match.opportunity.employment_type && (
                                  <div className="flex items-center gap-1">
                                    <Briefcase className="w-3.5 h-3.5" />
                                    <span>{match.opportunity.employment_type}</span>
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
                                    <span>Deadline: {new Date(match.opportunity.deadline).toLocaleDateString()}</span>
                                  </div>
                                )}
                              </div>
                            )}

                            {/* Match Reason */}
                            <div className="mb-3 p-3 bg-white/60 rounded-lg border border-amber-100">
                              <p className="text-xs text-gray-700 leading-relaxed">
                                <span className="font-semibold text-amber-700">Why this matches: </span>
                                {match.match_reason}
                              </p>
                            </div>

                            {/* Key Matching Skills */}
                            {match.key_matching_skills && match.key_matching_skills.length > 0 && (
                              <div className="flex flex-wrap gap-1.5 mb-3">
                                {match.key_matching_skills.slice(0, 4).map((skill, skillIdx) => (
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
                              No job matches found at the moment. Complete your profile to get better matches!
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
          </div>
        </div>
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
          title="Edit Soft Skills"
        />
      )}

      {activeModal === "technicalSkills" && (
        <SkillsEditModal
          isOpen
          onClose={() => setActiveModal(null)}
          data={userData.technicalSkills}
          onSave={(data) => handleSave("technicalSkills", data)}
          title="Edit Technical Skills"
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
