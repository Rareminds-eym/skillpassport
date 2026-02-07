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
    Edit,
    ExternalLink,
    Eye,
    EyeOff,
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
import { DotLottieReact } from '@lottiefiles/dotlottie-react';
import { motion } from "motion/react";
import React, { useEffect, useMemo, useState } from "react";
import toast, { Toaster } from "react-hot-toast";
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
import { useStudentEducation } from "../../hooks/useStudentEducation";
import { useStudentExperience } from "../../hooks/useStudentExperience";
import { useStudentTechnicalSkills, useStudentSoftSkills } from "../../hooks/useStudentSkills";
import { useStudentLearning } from "../../hooks/useStudentLearning";
import { useStudentMessageNotifications } from "../../hooks/useStudentMessageNotifications";
import { useStudentUnreadCount } from "../../hooks/useStudentMessages";
import { useStudentProjects } from "../../hooks/useStudentProjects";
import { useStudentRealtimeActivities } from "../../hooks/useStudentRealtimeActivities";
import { supabase } from "../../lib/supabaseClient";
import { isSchoolStudent, isCollegeStudent } from '../../utils/studentType';
// Debug utilities removed for production cleanliness

// Import Tour Components - Now handled globally
// Tours are managed by GlobalTourManager in App.tsx

const StudentDashboard = () => {
  const location = useLocation();
  const navigate = useNavigate();

  // Helper function to calculate duration in simple format
  const calculateDuration = (startDate, endDate) => {
    if (!startDate) return "";

    const start = new Date(startDate);
    const end = endDate ? new Date(endDate) : new Date();

    if (isNaN(start.getTime())) return "";
    if (endDate && isNaN(end.getTime())) return "";

    const formatDate = (date) => {
      return date.toLocaleDateString('en-US', { month: 'short', year: 'numeric' });
    };

    const startLabel = formatDate(start);
    const endLabel = endDate ? formatDate(end) : 'Present';

    return `${startLabel} - ${endLabel}`;
  };

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
    updateSkills,
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

  // Debug: Log projects data
  useEffect(() => {
    console.log('🔍 Dashboard - tableProjects updated:', {
      count: tableProjects?.length || 0,
      projects: tableProjects,
      loading: projectsLoading,
      error: projectsError,
      studentId
    });
  }, [tableProjects, projectsLoading, projectsError, studentId]);

  // Fetch experience from dedicated table
  const {
    experience: tableExperience,
    loading: experienceLoading,
    error: experienceError,
    refresh: refreshExperience
  } = useStudentExperience(studentId, !!studentId && !isViewingOthersProfile);

  // Fetch education from dedicated table
  const {
    education: tableEducation,
    loading: educationLoading,
    error: educationError,
    refresh: refreshEducation
  } = useStudentEducation(studentId, !!studentId && !isViewingOthersProfile);

  // Debug: Log education data
  useEffect(() => {
    console.log('🔍 Dashboard - tableEducation updated:', {
      count: tableEducation?.length || 0,
      education: tableEducation,
      loading: educationLoading,
      error: educationError,
      studentId
    });
  }, [tableEducation, educationLoading, educationError, studentId]);

  // Fetch technical skills from dedicated table
  const {
    skills: tableTechnicalSkills,
    loading: technicalSkillsLoading,
    error: technicalSkillsError,
    refresh: refreshTechnicalSkills
  } = useStudentTechnicalSkills(studentId, !!studentId && !isViewingOthersProfile);

  // Fetch soft skills from dedicated table
  const {
    skills: tableSoftSkills,
    loading: softSkillsLoading,
    error: softSkillsError,
    refresh: refreshSoftSkills
  } = useStudentSoftSkills(studentId, !!studentId && !isViewingOthersProfile);

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
    hasInProgressAssessment,
    latestAttemptId,
  } = useAssessmentRecommendations(studentId, !!studentId && !isViewingOthersProfile);

  // Debug: Log student ID being passed to assessment hook
  useEffect(() => {
    console.log('📋 Dashboard: studentId for assessment hook:', studentId);
    console.log('📋 Dashboard: enabled?', !!studentId && !isViewingOthersProfile);
  }, [studentId, isViewingOthersProfile]);

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
    const studentId = studentData?.id || "student";
    return `${window.location.origin}/student/profile/${studentId}`;
  }, [studentData?.id]);

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
    
    console.log('🔍 Dashboard - Raw projects data:', projectsData);
    
    return projectsData
      .map((project) => {
        // VERSIONING: If there's a pending edit, use verified_data for dashboard display
        if (project.has_pending_edit && project.verified_data) {
          console.log('🔄 Dashboard - Project with pending edit:', {
            id: project.id,
            currentTitle: project.title,
            verifiedTitle: project.verified_data.title,
            approval_status: project.approval_status,
            has_pending_edit: project.has_pending_edit
          });
          
          return {
            ...project,
            // Use verified_data for display (old approved version)
            title: project.verified_data.title,
            description: project.verified_data.description,
            role: project.verified_data.role,
            startDate: project.verified_data.startDate || project.verified_data.start_date,
            endDate: project.verified_data.endDate || project.verified_data.end_date,
            duration: project.verified_data.duration,
            organization: project.verified_data.organization,
            technologies: project.verified_data.technologies || project.verified_data.tech_stack,
            techStack: project.verified_data.tech_stack || project.verified_data.technologies,
            demoUrl: project.verified_data.demoUrl || project.verified_data.demo_link,
            githubUrl: project.verified_data.githubUrl || project.verified_data.github_link,
            certificateUrl: project.verified_data.certificateUrl,
            videoUrl: project.verified_data.videoUrl,
            pptUrl: project.verified_data.pptUrl,
            // IMPORTANT: Use main enabled field, NOT verified_data.enabled
            // enabled is a visibility toggle, not part of versioning
            enabled: project.enabled !== false,
            // Keep the original approval_status for filtering
            approval_status: project.approval_status,
            has_pending_edit: project.has_pending_edit,
            verified_data: project.verified_data
          };
        }
        return project;
      })
      .filter((project) => project && project.enabled !== false)
      .filter((project) => {
        // Show project if:
        // 1. It's approved or verified, OR
        // 2. It has pending edits (has_pending_edit=true) with verified_data (was previously verified)
        const shouldShow = (
          project.approval_status === 'approved' || 
          project.approval_status === 'verified' ||
          (project.has_pending_edit && project.verified_data)
        );
        return shouldShow;
      });
  }, [tableProjects, userData.projects]);

  // Memoize education with versioning logic
  const enabledEducation = useMemo(() => {
    // Prioritize table data over profile data
    const educationData = Array.isArray(tableEducation) && tableEducation.length > 0
      ? tableEducation
      : userData.education;
    if (!Array.isArray(educationData)) return [];
    
    console.log('🔍 Dashboard - Raw education data:', educationData);
    
    return educationData
      .map((education) => {
        // VERSIONING: If there's a pending edit, use verified_data for dashboard display
        if (education.has_pending_edit && education.verified_data) {
          console.log('🔄 Dashboard - Education with pending edit:', {
            id: education.id,
            currentDegree: education.degree,
            verifiedDegree: education.verified_data.degree,
            approval_status: education.approval_status,
            has_pending_edit: education.has_pending_edit
          });
          
          return {
            ...education,
            // Use verified_data for display (old approved version)
            degree: education.verified_data.degree,
            department: education.verified_data.department,
            university: education.verified_data.university,
            institution: education.verified_data.university, // Alias
            yearOfPassing: education.verified_data.yearOfPassing || education.verified_data.year_of_passing,
            year_of_passing: education.verified_data.year_of_passing || education.verified_data.yearOfPassing,
            cgpa: education.verified_data.cgpa,
            level: education.verified_data.level,
            status: education.verified_data.status,
            // IMPORTANT: Use main enabled field, NOT verified_data.enabled
            // enabled is a visibility toggle, not part of versioning
            enabled: education.enabled !== false,
            // Keep the original approval_status for filtering
            approval_status: education.approval_status,
            has_pending_edit: education.has_pending_edit,
            verified_data: education.verified_data
          };
        }
        return education;
      })
      .filter((education) => education && education.enabled !== false)
      .filter((education) => {
        // Show education if:
        // 1. It's approved or verified, OR
        // 2. It has pending edits (has_pending_edit=true) with verified_data (was previously verified)
        const shouldShow = (
          education.approval_status === 'approved' || 
          education.approval_status === 'verified' ||
          (education.has_pending_edit && education.verified_data)
        );
        return shouldShow;
      })
      .sort((a, b) => {
        const yearA = parseInt(a.yearOfPassing || a.year || a.endYear || 0);
        const yearB = parseInt(b.yearOfPassing || b.year || b.endYear || 0);
        return yearB - yearA; // Descending order
      });
  }, [tableEducation, userData.education]);

  // Memoize technical skills with versioning logic
  const enabledTechnicalSkills = useMemo(() => {
    const skillsData = Array.isArray(tableTechnicalSkills) && tableTechnicalSkills.length > 0
      ? tableTechnicalSkills
      : userData.technicalSkills;
    
    console.log('🔍 Dashboard - Technical Skills Data:', {
      tableTechnicalSkills,
      userData_technicalSkills: userData.technicalSkills,
      usingTableData: Array.isArray(tableTechnicalSkills) && tableTechnicalSkills.length > 0
    });
    
    if (!Array.isArray(skillsData)) return [];
    
    const processed = skillsData
      .map((skill) => {
        console.log('🔍 Dashboard - Processing skill:', {
          name: skill.name,
          approval_status: skill.approval_status,
          has_pending_edit: skill.has_pending_edit,
          _hasPendingEdit: skill._hasPendingEdit,
          enabled: skill.enabled
        });
        
        // VERSIONING: If there's a pending edit, use verified_data for dashboard display
        if (skill.has_pending_edit && skill.verified_data) {
          return {
            ...skill,
            name: skill.verified_data.name,
            level: skill.verified_data.level,
            description: skill.verified_data.description,
            enabled: skill.enabled !== false,
            approval_status: skill.approval_status,
            has_pending_edit: skill.has_pending_edit,
            verified_data: skill.verified_data
          };
        }
        return skill;
      })
      .filter((skill) => skill && skill.enabled !== false)
      .filter((skill) => {
        const shouldShow = (
          skill.approval_status === 'approved' || 
          skill.approval_status === 'verified' ||
          (skill.has_pending_edit && skill.verified_data)
        );
        console.log('🔍 Dashboard - Should show skill?', {
          name: skill.name,
          approval_status: skill.approval_status,
          shouldShow
        });
        return shouldShow;
      });
    
    console.log('🔍 Dashboard - Final enabled technical skills:', processed);
    return processed;
  }, [tableTechnicalSkills, userData.technicalSkills]);

  // Memoize soft skills with versioning logic
  const enabledSoftSkills = useMemo(() => {
    const skillsData = Array.isArray(tableSoftSkills) && tableSoftSkills.length > 0
      ? tableSoftSkills
      : userData.softSkills;
    if (!Array.isArray(skillsData)) return [];
    
    return skillsData
      .map((skill) => {
        // VERSIONING: If there's a pending edit, use verified_data for dashboard display
        if (skill.has_pending_edit && skill.verified_data) {
          return {
            ...skill,
            name: skill.verified_data.name,
            level: skill.verified_data.level,
            description: skill.verified_data.description,
            enabled: skill.enabled !== false,
            approval_status: skill.approval_status,
            has_pending_edit: skill.has_pending_edit,
            verified_data: skill.verified_data
          };
        }
        return skill;
      })
      .filter((skill) => skill && skill.enabled !== false)
      .filter((skill) => {
        const shouldShow = (
          skill.approval_status === 'approved' || 
          skill.approval_status === 'verified' ||
          (skill.has_pending_edit && skill.verified_data)
        );
        return shouldShow;
      });
  }, [tableSoftSkills, userData.softSkills]);

  const enabledExperience = useMemo(() => {
    // Prioritize table data over profile data
    const experienceData = Array.isArray(tableExperience) && tableExperience.length > 0
      ? tableExperience
      : userData.experience;
    if (!Array.isArray(experienceData)) return [];
    
    // Apply versioning logic: show verified data on dashboard when there's a pending edit
    return experienceData
      .map((exp) => {
        // VERSIONING: If there's a pending edit, use verified_data for dashboard display
        if (exp.has_pending_edit && exp.verified_data) {
          console.log('🔄 Dashboard - Experience with pending edit:', {
            id: exp.id,
            currentRole: exp.role,
            verifiedRole: exp.verified_data.role,
            approval_status: exp.approval_status,
            has_pending_edit: exp.has_pending_edit
          });
          
          return {
            ...exp,
            // Override with verified data for display
            role: exp.verified_data.role || exp.role,
            organization: exp.verified_data.organization || exp.organization,
            start_date: exp.verified_data.start_date || exp.start_date,
            end_date: exp.verified_data.end_date || exp.end_date,
            duration: exp.verified_data.duration || exp.duration,
            description: exp.verified_data.description || exp.description,
            // Keep these for the card to show pending status
            approval_status: exp.approval_status,
            has_pending_edit: exp.has_pending_edit,
            verified_data: exp.verified_data,
            pending_edit_data: exp.pending_edit_data,
            // IMPORTANT: Use main enabled field, NOT verified_data.enabled
            enabled: exp.enabled !== false
          };
        }
        return exp;
      })
      .filter((exp) => exp && exp.enabled !== false)
      .filter((exp) => {
        // Show experience if:
        // 1. It's approved or verified, OR
        // 2. It has pending edits (to show the verified data with pending badge)
        const shouldShow = (
          exp.approval_status === 'approved' || 
          exp.approval_status === 'verified' ||
          (exp.has_pending_edit && exp.verified_data)
        );
        
        console.log('🔍 Dashboard - Should show experience?', {
          role: exp.role,
          approval_status: exp.approval_status,
          has_pending_edit: exp.has_pending_edit,
          shouldShow
        });
        
        return shouldShow;
      })
      .sort((a, b) => {
        // Sort by end date in descending order (most recent first)
        const getDate = (exp) => {
          if (exp.endDate) return new Date(exp.endDate);
          if (exp.end_date) return new Date(exp.end_date);
          if (exp.startDate) return new Date(exp.startDate);
          if (exp.start_date) return new Date(exp.start_date);
          return new Date(0);
        };

        const dateA = getDate(a);
        const dateB = getDate(b);
        return dateB - dateA;
      });
  }, [tableExperience, userData.experience]);

  const enabledCertificates = useMemo(() => {
    // Prioritize table data over profile data
    const certificatesData = Array.isArray(tableCertificates) && tableCertificates.length > 0
      ? tableCertificates
      : userData.certificates;
    if (!Array.isArray(certificatesData)) return [];

    return certificatesData
      .map((cert) => {
        // VERSIONING: If there's a pending edit, use verified_data for dashboard display
        if (cert.has_pending_edit && cert.verified_data) {
          return {
            ...cert,
            // Override with verified data for display
            title: cert.verified_data.title || cert.title,
            issuer: cert.verified_data.issuer || cert.issuer,
            issuedOn: cert.verified_data.issued_on || cert.issuedOn,
            level: cert.verified_data.level || cert.level,
            description: cert.verified_data.description || cert.description,
            credentialId: cert.verified_data.credential_id || cert.credentialId,
            link: cert.verified_data.link || cert.link,
            documentUrl: cert.verified_data.document_url || cert.documentUrl,
            platform: cert.verified_data.platform || cert.platform,
            instructor: cert.verified_data.instructor || cert.instructor,
            category: cert.verified_data.category || cert.category,
            status: cert.verified_data.status || cert.status,
            approval_status: cert.verified_data.approval_status || cert.approval_status,
            verified: cert.verified_data.approval_status === 'approved' || cert.verified_data.approval_status === 'verified',
            // IMPORTANT: Use main enabled field, NOT verified_data.enabled
            // Hide/show is NOT part of versioning - it updates the main enabled field directly
            enabled: cert.enabled !== false,
          };
        }
        return cert;
      })
      .filter((cert) => cert && cert.enabled !== false && (cert.approval_status === 'approved' || cert.approval_status === 'verified'))
      .sort((a, b) => {
        // Sort by issue date or year in descending order (most recent first)
        const getDate = (cert) => {
          if (cert.issueDate) return new Date(cert.issueDate);
          if (cert.issue_date) return new Date(cert.issue_date);
          if (cert.issuedOn) return new Date(cert.issuedOn);
          if (cert.date) return new Date(cert.date);
          if (cert.year) return new Date(cert.year, 11, 31);
          return new Date(0); // Default to epoch if no date found
        };

        const dateA = getDate(a);
        const dateB = getDate(b);
        return dateB - dateA; // Descending order (most recent first)
      });
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
  // useEffect(() => {
  //   // Authentication and student data loaded
  // }, [studentData, authStudentLoading, authStudentError]);

  // Debug log for opportunities
  // useEffect(() => {
  //   // Opportunities data loaded
  // }, [opportunities, opportunitiesLoading, opportunitiesError]);

  // Debug log for recent updates
  // useEffect(() => {
  //   // Recent updates data loaded
  // }, [recentUpdates, recentUpdatesLoading, recentUpdatesError, userEmail]);

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

  // Listen for settings updates and refresh dashboard
  useEffect(() => {
    const handleSettingsUpdate = (event) => {
      if (event.detail?.type === 'profile_updated') {
        console.log('🔄 Settings updated, refreshing dashboard data...');
        refresh();
      }
    };

    window.addEventListener('student_settings_updated', handleSettingsUpdate);

    return () => {
      window.removeEventListener('student_settings_updated', handleSettingsUpdate);
    };
  }, [refresh]);

  // Direct Supabase test
  useEffect(() => {
    const testSupabaseDirectly = async () => {
      try {
        const { data, error, count } = await supabase
          .from("opportunities")
          .select("*", { count: "exact" });

        // Run debug for recent updates (commented out to prevent automatic execution)
        // await debugRecentUpdates();
        // To debug recent updates, run: await window.debugRecentUpdates() in console
      } catch (err) {
        // Handle error silently
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
        experience: Array.isArray(tableExperience) && tableExperience.length > 0
          ? tableExperience
          : Array.isArray(studentData.experience)
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
  }, [studentData, tableTraining, tableCertificates, tableProjects, tableExperience]);

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
          case "skills":
            // Ensure all skills have type: "technical" when coming from Technical Skills card
            const skillsWithType = data.map(skill => ({
              ...skill,
              type: "technical" // Force technical type for skills from Technical Skills card
            }));
            console.log('🔧 Dashboard: Skills data being saved:', skillsWithType);
            result = await updateSkills(skillsWithType);
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
          } else if (section === 'experience') {
            refreshExperience();
          } else if (section === 'education') {
            refreshEducation();
          } else if (section === 'skills' || section === 'technicalSkills') {
            refreshTechnicalSkills();
          } else if (section === 'softSkills') {
            refreshSoftSkills();
          }

          // Refresh Recent Updates to show the new activity
          refreshRecentUpdates();
        }
      } catch (err) {
        console.error("Error saving:", err);
      }
    }
  };

  // Create refresh-enabled save handlers for each section
  const createSaveHandler = (section, refreshFn) => {
    const handler = async (data) => {
      await handleSave(section, data);
    };
    // Attach refresh function so modal can call it
    handler.refresh = refreshFn;
    return handler;
  };

  // Technical Skills toggle enabled handler
  const handleToggleTechnicalSkillEnabled = async (skillId) => {
    console.log('🔧 Dashboard - Toggle technical skill called:', skillId);
    console.log('🔧 Dashboard - All technical skills:', tableTechnicalSkills);
    
    const skill = tableTechnicalSkills.find(s => s.id === skillId);
    console.log('🔧 Dashboard - Found skill:', skill);
    
    if (!skill) {
      console.error('🔧 Dashboard - Skill not found!');
      return;
    }
    
    const newState = !skill.enabled;
    console.log('🔧 Dashboard - Toggling from', skill.enabled, 'to', newState);
    
    // Don't allow hiding/showing items that are pending verification or approval
    if (skill.approval_status === 'pending' || skill._hasPendingEdit) {
      console.log('🔧 Dashboard - Skill is pending, cannot toggle');
      toast({ 
        title: "Cannot Hide/Show", 
        description: "You cannot hide or show skills that are pending verification or approval.",
        variant: "destructive",
        duration: 4000,
      });
      return;
    }
    
    try {
      console.log('🔧 Dashboard - Updating database...');
      // Import supabase client
      const { createClient } = await import('@supabase/supabase-js');
      const supabase = createClient(
        import.meta.env.VITE_SUPABASE_URL,
        import.meta.env.VITE_SUPABASE_ANON_KEY
      );
      
      // Update only the enabled field directly in database
      const { error } = await supabase
        .from('skills')
        .update({ enabled: newState })
        .eq('id', skillId);
      
      if (error) {
        console.error('🔧 Dashboard - Database error:', error);
        throw error;
      }
      
      console.log('🔧 Dashboard - Database updated successfully');
      
      // Refresh technical skills to get updated data
      if (refreshTechnicalSkills) {
        console.log('🔧 Dashboard - Refreshing skills...');
        await refreshTechnicalSkills();
      }
      
      toast({ 
        title: newState ? "Visibility Enabled" : "Visibility Disabled", 
        description: `Technical skill ${newState ? 'is now visible' : 'is now hidden'} on your profile.`,
        duration: 3000,
      });
    } catch (error) {
      console.error('🔧 Dashboard - Error toggling technical skill visibility:', error);
      toast({ 
        title: "Error", 
        description: "Failed to update visibility. Please try again.", 
        variant: "destructive" 
      });
    }
  };

  // Soft Skills toggle enabled handler
  const handleToggleSoftSkillEnabled = async (skillId) => {
    const skill = tableSoftSkills.find(s => s.id === skillId);
    if (!skill) return;
    
    const newState = !skill.enabled;
    
    // Don't allow hiding/showing items that are pending verification or approval
    if (skill.approval_status === 'pending' || skill._hasPendingEdit) {
      toast({ 
        title: "Cannot Hide/Show", 
        description: "You cannot hide or show skills that are pending verification or approval.",
        variant: "destructive",
        duration: 4000,
      });
      return;
    }
    
    try {
      // Import supabase client
      const { createClient } = await import('@supabase/supabase-js');
      const supabase = createClient(
        import.meta.env.VITE_SUPABASE_URL,
        import.meta.env.VITE_SUPABASE_ANON_KEY
      );
      
      // Update only the enabled field directly in database
      const { error } = await supabase
        .from('skills')
        .update({ enabled: newState })
        .eq('id', skillId);
      
      if (error) throw error;
      
      // Refresh soft skills to get updated data
      if (refreshSoftSkills) {
        await refreshSoftSkills();
      }
      
      toast({ 
        title: newState ? "Visibility Enabled" : "Visibility Disabled", 
        description: `Soft skill ${newState ? 'is now visible' : 'is now hidden'} on your profile.`,
        duration: 3000,
      });
    } catch (error) {
      console.error('Error toggling soft skill visibility:', error);
      toast({ 
        title: "Error", 
        description: "Failed to update visibility. Please try again.", 
        variant: "destructive" 
      });
    }
  };

  const renderStars = (level) => {
    const numericLevel = parseInt(level) || 0;

    return [...Array(5)].map((_, i) => (
      <Star
        key={i}
        className={`w-4 h-4 ${i < numericLevel ? "fill-yellow-400 text-yellow-400" : "text-gray-300"
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

  // Helper function to get skill level badge color (with consistent hover states)
  const getSkillLevelColor = (level) => {
    if (level >= 5) return "bg-purple-100 text-purple-700 border-purple-300 hover:bg-purple-100";
    if (level >= 4) return "bg-blue-100 text-blue-700 border-blue-300 hover:bg-blue-100";
    if (level >= 3) return "bg-green-100 text-green-700 border-green-300 hover:bg-green-100";
    if (level >= 1) return "bg-yellow-100 text-yellow-700 border-yellow-300 hover:bg-yellow-100";
    return "bg-gray-100 text-gray-700 border-gray-300 hover:bg-gray-100";
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
    // Priority: college_id takes precedence if both exist (College → School)
    if (studentData?.college_id && studentData?.college) {
      // College (standalone, not part of university)
      return {
        type: 'College',
        name: studentData.college.name,
        code: studentData.college.code,
        city: studentData.college.city,
        state: studentData.college.state,
      };
    } else if (studentData?.school_id && studentData?.school) {
      return {
        type: 'School',
        name: studentData.school.name,
        code: studentData.school.code,
        city: studentData.school.city,
        state: studentData.school.state,
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
    if (studentData?.college_id && !studentData?.college) {
      console.error('⚠️ College ID exists but college data is null. College may have been deleted.');
      return {
        type: 'College',
        name: 'College Not Found',
        code: 'N/A',
        city: null,
        state: null,
        error: true,
      };
    }

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
    assessment: (
      <Card
        key="assessment"
        data-tour="assessment-card"
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
              <div className="w-10 h-10">
                <DotLottieReact
                  src="https://lottie.host/d2e9c81b-68e5-4817-8cdb-232a1a4d96d1/IrCaxvOj5s.lottie"
                  loop
                  autoplay
                  style={{ width: '100%', height: '100%' }}
                />
              </div>
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
              : hasInProgressAssessment
                ? "You have an assessment in progress. Continue where you left off to get your personalized career roadmap."
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
                onClick={() => navigate(latestAttemptId ? `/student/assessment/result?attemptId=${latestAttemptId}` : "/student/assessment/result")}
                className="w-auto bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 text-white font-semibold text-sm shadow-md hover:shadow-lg transform hover:scale-105 transition-all duration-200 py-4"
              >
                <Eye className="w-5 h-5 mr-2" />
                View Results
              </Button>
            ) : hasInProgressAssessment ? (
              <Button
                onClick={() => navigate("/student/assessment/test")}
                className="w-auto bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 text-white font-semibold text-sm shadow-md hover:shadow-lg transform hover:scale-105 transition-all duration-200 py-4"
              >
                <Clock className="w-5 h-5 mr-2" />
                Continue Assessment
                <ChevronRight className="w-5 h-5 ml-2" />
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
        data-tour="opportunities-card"
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
            const isSchool = isSchoolStudent(studentData);
            const isUniversity = isCollegeStudent(studentData);
            const studentGrade = studentData?.grade;

            // Fallback: Check education level if database fields are not available
            const hasHighSchoolOnly = userData.education.length > 0 &&
              userData.education.every(edu =>
                edu.level && edu.level.toLowerCase().includes('high school')
              );

            let filteredOpportunities = opportunities;

            if (isSchool || hasHighSchoolOnly) {
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
            } else if (isUniversity) {
              // University/College students: Show ALL opportunities (internships + jobs)
              filteredOpportunities = opportunities; // Show everything
            }

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
                          <Badge className="!bg-gradient-to-r !from-gray-100 !to-gray-200 !text-gray-800 text-xs px-2.5 py-0.5 rounded-full font-medium">
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
        data-tour="technical-skills-card"
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
                onClick={() => setActiveModal("skills")}
              >
                <Eye className="w-5 h-5 text-blue-600" />
              </button>
            </div>
          </div>
        </CardHeader>
        <CardContent className="p-8">
          {enabledTechnicalSkills.length === 0 ? (
            <div className="text-center py-8">
              <p className="text-gray-900 text-base leading-normal font-medium">
                No technical skills added yet
              </p>
            </div>
          ) : (
            <div className="space-y-4 max-h-[500px] overflow-y-auto pr-2 blue-scrollbar">
              {enabledTechnicalSkills.map((skill, idx) => (
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
                    <div className="flex gap-0.5 mb-3">
                      {renderStars(skill.level)}
                    </div>

                    {/* Edit Button + Eye Icon */}
                    <div className="flex justify-end gap-1">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => setActiveModal("skills")}
                        className="p-2 h-8 w-8 text-gray-400 hover:text-blue-600 hover:bg-blue-50"
                      >
                        <Edit className="w-4 h-4" />
                      </Button>
                      
                      {/* Eye icon - only show for verified/approved skills */}
                      {(skill.approval_status === 'verified' || skill.approval_status === 'approved') && !skill._hasPendingEdit && (
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleToggleTechnicalSkillEnabled(skill.id)}
                          className="p-2 h-8 w-8 text-gray-400 hover:text-blue-600 hover:bg-blue-50"
                          title={skill.enabled !== false ? "Hide from profile" : "Show on profile"}
                        >
                          {skill.enabled !== false ? (
                            <Eye className="w-4 h-4" />
                          ) : (
                            <EyeOff className="w-4 h-4" />
                          )}
                        </Button>
                      )}
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
        data-tour="projects-card"
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

                    {/* Role */}
                    {project.role && (
                      <div className="flex items-center gap-2 mb-2">
                        <Briefcase className="w-4 h-4 text-blue-600" />
                        <p className="text-sm text-blue-600 font-medium">
                          {project.role}
                        </p>
                      </div>
                    )}

                    {/* Date + Status Badge */}
                    <div className="flex items-center justify-between gap-3 mb-3">
                      <p className="text-sm text-gray-900 leading-relaxed font-medium">
                        {calculateDuration(project.start_date || project.startDate, project.end_date || project.endDate) || project.duration || project.timeline || project.period || ""}
                      </p>
                      {project.status && (
                        <Badge className={`px-1 py-1 text-xs font-semibold rounded-full shadow-sm whitespace-nowrap ${project.status.toLowerCase() === "completed"
                            ? "!bg-green-100 !text-green-600"
                            : "!bg-blue-100 !text-blue-600"
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
                          className="w-auto !bg-blue-500 hover:!bg-blue-600 !text-white font-semibold px-4 py-2 text-sm rounded-lg shadow-md hover:shadow-lg transform hover:scale-105 transition-all"
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
        data-tour="education-card"
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
          {enabledEducation.length === 0 ? (
            <div className="text-center py-8">
              <p className="text-gray-900 text-base leading-normal font-medium">
                No education added yet
              </p>
            </div>
          ) : (
            <div className="space-y-4 max-h-[500px] overflow-y-auto pr-2 blue-scrollbar">
              {enabledEducation.map((education, idx) => (
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
                          className={`px-3 py-1.5 text-xs font-semibold rounded-full shadow-sm ${education.status === "ongoing"
                              ? "!bg-gradient-to-r !from-blue-100 !to-indigo-100 !text-blue-700"
                              : "!bg-gradient-to-r !from-green-100 !to-emerald-100 !text-green-700"
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
        data-tour="training-card"
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
                <div
                  className="w-16 h-16 rounded-lg bg-blue-50 flex items-center justify-center shrink-0 overflow-hidden border border-white/50"
                  style={{
                    boxShadow: '0 0 15px rgba(255, 255, 255, 0.5), 0 0 30px rgba(255, 255, 255, 0.3), inset 0 0 10px rgba(255, 255, 255, 0.1)'
                  }}
                >
                  <img src="/assets/HomePage/Ai Logo.png" alt="AI" className="w-16 h-16 object-contain" />
                </div>
                <div className="flex-1">
                  <h4 className="text-base font-bold text-gray-900 mb-2">
                    Get Personalized Recommendations
                  </h4>
                  <p className="text-sm text-gray-900 mb-3 font-medium">
                    Take our assessment to receive AI-powered course recommendations tailored to your career goals and skills.
                  </p>
                  {/* <Button
                    onClick={() => navigate("/student/assessment/test")}
                    size="sm"
                    className="bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white text-sm font-semibold shadow-md hover:shadow-lg transform hover:scale-105 transition-all"
                  >
                    Take Assessment
                    <ChevronRight className="w-4 h-4 ml-1" />
                  </Button> */}
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
                  .sort((a, b) => {
                    // Sort by completion date or start date in descending order (most recent first)
                    const getDate = (training) => {
                      if (training.completedDate) return new Date(training.completedDate);
                      if (training.completed_date) return new Date(training.completed_date);
                      if (training.endDate) return new Date(training.endDate);
                      if (training.end_date) return new Date(training.end_date);
                      if (training.startDate) return new Date(training.startDate);
                      if (training.start_date) return new Date(training.start_date);
                      if (training.year) return new Date(training.year, 11, 31);
                      return new Date(0); // Default to epoch if no date found
                    };

                    const dateA = getDate(a);
                    const dateB = getDate(b);
                    return dateB - dateA; // Descending order (most recent first)
                  })
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
                              ? "!bg-green-100 !text-green-600"
                              : "!bg-blue-100 !text-blue-600"
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
                          {(training.duration || training.start_date || training.startDate) && (
                            <div className="flex items-center gap-2">
                              <Calendar className="w-4 h-4 text-blue-600" />
                              <span className="font-medium">
                                {calculateDuration(training.start_date || training.startDate, training.end_date || training.endDate) || training.duration}
                              </span>
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
        data-tour="certificates-card"
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
                    {/* Certificate Name + Verified Badge */}
                    <div className="flex items-center justify-between gap-3 mb-3">
                      <h4 className="text-base font-bold text-gray-900">
                        {cert.title ||
                          cert.name ||
                          cert.certificate ||
                          "Certificate"}
                      </h4>
                      {(cert.approval_status === "verified" || cert.approval_status === "approved") && (
                        <Badge className="!bg-gradient-to-r !from-green-100 !to-emerald-100 !text-green-700 px-3 py-1.5 text-xs font-semibold rounded-full shadow-sm flex items-center gap-1.5">
                          <CheckCircle className="w-3.5 h-3.5" />
                          Verified
                        </Badge>
                      )}
                    </div>

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
                        <Badge className="px-3 py-1 text-xs font-semibold !bg-gradient-to-r !from-gray-100 !to-gray-200 !text-gray-700 rounded-full shadow-sm">
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
    data-tour="experience-card"
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
  {enabledExperience.length === 0 ? (
    <div className="text-center py-8">
      <p className="text-gray-900 text-base leading-normal font-medium">
        No experience added yet
      </p>
    </div>
  ) : (
    <div className="space-y-4 max-h-[500px] overflow-y-auto pr-2 blue-scrollbar">
      {enabledExperience.map((exp, idx) => {
        // VERSIONING FIX: Show verified_data if there's a pending edit, otherwise show current data
        // Dashboard should always show the VERIFIED version, not the pending changes
        const displayData = exp.has_pending_edit && exp.verified_data 
          ? { ...exp, ...exp.verified_data }
          : exp;
        
        return (
          <div
          key={exp.id || `exp-${idx}`}
          className="p-5 rounded-xl bg-white border-l-4 border-l-blue-500 border border-gray-200 hover:shadow-md transition-all duration-200"
        >
          {/* Title + Status Badge */}
          <div className="flex items-center justify-between gap-3 mb-3">
            <div className="flex items-center gap-2">
              <h4 className="text-base font-bold text-gray-900">
                {displayData.role || "Experience Role"}
              </h4>
              {/* Verified Badge - show if:
                  1. Status is approved/verified, OR
                  2. Has pending edit with verified_data (showing old verified data) */}
              {((exp.approval_status === "verified" || exp.approval_status === "approved") || 
                (exp.has_pending_edit && exp.verified_data)) && (
                <Badge className="!bg-gradient-to-r !from-green-100 !to-emerald-100 !text-green-700 px-2 py-1 text-xs font-semibold rounded-full shadow-sm flex items-center gap-1">
                  <CheckCircle className="w-3 h-3" />
                  Verified
                </Badge>
              )}
              {/* Pending Approval Badge - only for brand new submissions (no verified_data) */}
              {exp.approval_status === 'pending' && !exp.verified_data && (
                <Badge className="!bg-gradient-to-r !from-yellow-100 !to-amber-100 !text-yellow-700 px-2 py-1 text-xs font-semibold rounded-full shadow-sm flex items-center gap-1">
                  <Clock className="w-3 h-3" />
                  Pending Approval
                </Badge>
              )}
              {/* Present Badge for ongoing experiences */}
              {(!displayData.end_date && !displayData.endDate) && (
                <Badge className="!bg-gradient-to-r !from-blue-100 !to-blue-200 !text-blue-700 px-2 py-1 text-xs font-semibold rounded-full shadow-sm">
                  Present
                </Badge>
              )}
            </div>
          </div>

          {/* Type */}
          {displayData.type && (
            <div className="flex items-center gap-2 mb-3">
              <Briefcase className="w-4 h-4 text-blue-600" />
              <span className="text-sm text-gray-700 font-medium">{displayData.type}</span>
            </div>
          )}

          {/* Icon + Location */}
          {(displayData.organization || displayData.company || displayData.location) && (
            <div className="flex items-center gap-2 mb-3">
              <Building2 className="w-4 h-4 text-blue-600" />
              <span className="text-sm text-blue-600 font-medium">
                {displayData.organization || displayData.company || "Organization"}
                {displayData.location && `, ${displayData.location}`}
              </span>
            </div>
          )}

          {/* Date */}
          {(displayData.duration || displayData.period || displayData.start_date || displayData.startDate) && (
            <div className="flex items-center gap-2 mb-3">
              <Calendar className="w-4 h-4 text-gray-600" />
              <span className="text-sm text-gray-600 font-medium">
                {calculateDuration(displayData.start_date || displayData.startDate, displayData.end_date || displayData.endDate) || displayData.duration || displayData.period}
              </span>
            </div>
          )}

          {/* Description */}
          {displayData.description && (
            <div className="mt-3">
              <p className="text-sm text-gray-600 leading-relaxed line-clamp-2">
                {displayData.description}
              </p>
            </div>
          )}
        </div>
        );
      })}
    </div>
  )}
</CardContent>
      </Card>
    ),
    softSkills: (
      <Card
        key="softSkills"
        data-tour="soft-skills-card"
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
          {enabledSoftSkills.length === 0 ? (
            <div className="text-center py-8">
              <p className="text-gray-900 text-base leading-normal font-medium">
                No soft skills added yet
              </p>
            </div>
          ) : (
            <div className="space-y-4 max-h-[500px] overflow-y-auto pr-2 blue-scrollbar">
              {enabledSoftSkills.map((skill, idx) => (
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
                    <div className="flex gap-0.5 mb-3">
                      {renderStars(skill.level)}
                    </div>

                    {/* Edit Button + Eye Icon */}
                    <div className="flex justify-end gap-1">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => setActiveModal("softSkills")}
                        className="p-2 h-8 w-8 text-gray-400 hover:text-blue-600 hover:bg-blue-50"
                      >
                        <Edit className="w-4 h-4" />
                      </Button>
                      
                      {/* Eye icon - only show for verified/approved skills */}
                      {(skill.approval_status === 'verified' || skill.approval_status === 'approved') && !skill._hasPendingEdit && (
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleToggleSoftSkillEnabled(skill.id)}
                          className="p-2 h-8 w-8 text-gray-400 hover:text-blue-600 hover:bg-blue-50"
                          title={skill.enabled !== false ? "Hide from profile" : "Show on profile"}
                        >
                          {skill.enabled !== false ? (
                            <Eye className="w-4 h-4" />
                          ) : (
                            <EyeOff className="w-4 h-4" />
                          )}
                        </Button>
                      )}
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
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5 mb-12">
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
            zIndex: 60,
          },
          duration: 5000,
        }}
        containerStyle={{
          zIndex: 60,
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
                  data-tour="dashboard-tab"
                  onClick={() => setActiveView('dashboard')}
                  className={`relative text-left p-3 sm:p-4 rounded-lg transition-all ${activeView === 'dashboard'
                      ? 'bg-gradient-to-r from-blue-50 to-indigo-50 shadow-md'
                      : 'bg-white hover:bg-gray-50'
                    }`}
                >
                  <div className="flex items-start gap-2 sm:gap-3">
                    <div className={`p-1.5 sm:p-2 rounded-lg ${activeView === 'dashboard' ? 'bg-blue-600' : 'bg-gray-100'
                      }`}>
                      <RectangleStackIcon className={`w-5 sm:w-6 h-5 sm:h-6 ${activeView === 'dashboard' ? 'text-white' : 'text-gray-600'
                        }`} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <h1 className={`font-bold text-base sm:text-lg ${activeView === 'dashboard' ? 'text-blue-600' : 'text-gray-900'
                        }`}>
                        Dashboard
                      </h1>
                      <p className="text-xs sm:text-sm text-gray-600 mt-1 leading-tight">
                        View your overview, opportunities, and achievements
                      </p>
                    </div>
                  </div>
                </button>

                {/* Analytics Tab */}
                <button
                  data-tour="analytics-tab"
                  onClick={() => setActiveView('analytics')}
                  className={`relative text-left p-3 sm:p-4 rounded-lg transition-all ${activeView === 'analytics'
                      ? 'bg-gradient-to-r from-blue-50 to-indigo-50 shadow-md'
                      : 'bg-white hover:bg-gray-50'
                    }`}
                >
                  <div className="flex items-start gap-2 sm:gap-3">
                    <div className={`p-1.5 sm:p-2 rounded-lg ${activeView === 'analytics' ? 'bg-blue-600' : 'bg-gray-100'
                      }`}>
                      <ChartBarIcon className={`w-5 sm:w-6 h-5 sm:h-6 ${activeView === 'analytics' ? 'text-white' : 'text-gray-600'
                        }`} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <h1 className={`font-bold text-base sm:text-lg ${activeView === 'analytics' ? 'text-blue-600' : 'text-gray-900'
                        }`}>
                        Analytics
                      </h1>
                      <p className="text-xs sm:text-sm text-gray-600 mt-1 leading-tight">
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
                Welcome to your profile dashboard, {(() => {
                  const firstName = studentData?.profile?.firstName || studentData?.rawData?.firstName || (userEmail ? userEmail.split('@')[0] : "Student");
                  return firstName.charAt(0).toUpperCase() + firstName.slice(1).toLowerCase();
                })()}!
              </motion.h1>
            </LampContainer>

            {/* Institution Card - Show organization info if student belongs to one */}
            {/* {institutionInfo && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2, duration: 0.5 }}
                className="-mt-52 mb-6 relative z-50 max-w-md mx-auto"
              >
                <Card className="bg-gradient-to-br from-indigo-50 to-blue-50 rounded-xl border-2 border-indigo-200 hover:border-indigo-400 transition-all duration-200 shadow-md hover:shadow-lg">
                  <CardContent className="p-4">
                    <div className="flex items-center gap-4">
                      <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-indigo-500 to-blue-500 flex items-center justify-center shadow-md flex-shrink-0">
                        <Building2 className="w-6 h-6 text-white" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-xs text-indigo-600 font-medium uppercase tracking-wide mb-0.5">
                          {institutionInfo.type}
                        </p>
                        <h3 className="text-lg font-bold text-gray-900 truncate">
                          {institutionInfo.name}
                        </h3>
                        {institutionInfo.universityName && (
                          <p className="text-sm text-gray-600 truncate">
                            {institutionInfo.universityName}
                          </p>
                        )}
                        {(institutionInfo.city || institutionInfo.state) && (
                          <div className="flex items-center gap-1 text-gray-500 mt-1">
                            <MapPin className="w-3 h-3" />
                            <span className="text-xs">
                              {[institutionInfo.city, institutionInfo.state]
                                .filter(Boolean)
                                .join(', ')}
                            </span>
                          </div>
                        )}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            )} */}

            {/* 3x3 Grid Section */}
            <motion.div
              initial={{ opacity: 0.5, y: 100 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{
                delay: 0.3,
                duration: 0.8,
                ease: "easeInOut",
              }}
              className="-mt-48 relative z-10"
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
                                  <Badge className="!bg-gradient-to-r !from-green-500 !to-emerald-500 !text-white border-0 text-xs font-semibold">
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
                                              className="text-xs !bg-white/80 !text-gray-700 border border-amber-200"
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
          data={Array.isArray(tableEducation) && tableEducation.length > 0 ? tableEducation : userData.education}
          onSave={createSaveHandler("education", refreshEducation)}
        />
      )}

      {activeModal === "training" && (
        <TrainingEditModal
          isOpen
          onClose={() => setActiveModal(null)}
          data={userData.training}
          onSave={createSaveHandler("training", refreshTraining)}
        />
      )}

      {activeModal === "experience" && (
        <ExperienceEditModal
          isOpen
          onClose={() => setActiveModal(null)}
          data={Array.isArray(tableExperience) && tableExperience.length > 0 ? tableExperience : userData.experience}
          onSave={createSaveHandler("experience", refreshExperience)}
        />
      )}

      {activeModal === "softSkills" && (
        <SkillsEditModal
          isOpen
          onClose={() => setActiveModal(null)}
          data={Array.isArray(tableSoftSkills) && tableSoftSkills.length > 0 ? tableSoftSkills : userData.softSkills}
          onSave={createSaveHandler("softSkills", refreshSoftSkills)}
          title="Soft Skills"
        />
      )}

      {activeModal === "skills" && (
        <SkillsEditModal
          isOpen
          onClose={() => setActiveModal(null)}
          data={Array.isArray(tableTechnicalSkills) && tableTechnicalSkills.length > 0 ? tableTechnicalSkills : userData.technicalSkills || []}
          onSave={createSaveHandler("skills", refreshTechnicalSkills)}
          title="Skills"
        />
      )}

      {activeModal === "technicalSkills" && (
        <SkillsEditModal
          isOpen
          onClose={() => setActiveModal(null)}
          data={Array.isArray(tableTechnicalSkills) && tableTechnicalSkills.length > 0 ? tableTechnicalSkills : userData.technicalSkills}
          onSave={createSaveHandler("technicalSkills", refreshTechnicalSkills)}
          title="Technical Skills"
        />
      )}

      {activeModal === "projects" && (
        <ProjectsEditModal
          isOpen
          onClose={() => setActiveModal(null)}
          data={Array.isArray(tableProjects) && tableProjects.length > 0 ? tableProjects : userData.projects}
          onSave={createSaveHandler("projects", refreshProjects)}
        />
      )}

      {activeModal === "certificates" && (
        <CertificatesEditModal
          isOpen
          onClose={() => setActiveModal(null)}
          data={Array.isArray(tableCertificates) && tableCertificates.length > 0 ? tableCertificates : userData.certificates}
          onSave={createSaveHandler("certificates", refreshCertificates)}
        />
      )}
    </div>
  );
};

export default StudentDashboard;