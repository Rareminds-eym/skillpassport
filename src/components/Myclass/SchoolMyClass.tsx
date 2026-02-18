import React, { useState, useEffect, useMemo } from 'react';
import {
  Users,
  Calendar,
  ClipboardList,
  GraduationCap,
  FileText,
  Award,
  Target,
  Loader2,
  AlertCircle,
  X,
  CheckCircle2,
  Paperclip,
  Upload,
  Zap,
  CheckSquare,
  Star
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useStudentDataByEmail } from '../../hooks/useStudentDataByEmail';
import { supabase } from '../../lib/supabaseClient';
import SchoolClassHeader, { SchoolClassInfo } from './common/SchoolClassHeader';
// Import shared components
import OverviewTab, { AssignmentStats } from './Tabs/OverviewTab';
import ClassmatesTab from './Tabs/ClassmatesTab';
import AssignmentsTab from './Tabs/AssignmentsTab';
import SchoolTimetableView, { SchoolTimetableSlot } from './Tabs/TimetableViewTab';
import SchoolCoCurricularsTab, { SchoolClub, SchoolAchievement, SchoolCertificate, SchoolActivity } from './Tabs/CoCurricularsTab';
import SchoolExamsTab, { SchoolGroupedExam } from './Tabs/ExamsTab';
import SchoolResultsTab, { SchoolStudentResult, SchoolResultStats } from './Tabs/ResultsTab';
import { Assignment } from './common/AssignmentCard';
import StudentAssignmentFileUpload from '../student/StudentAssignmentFileUpload';
import NotificationModal from '../ui/NotificationModal';

// Import school-specific services
import {
  getStudentClassInfo,
  getClassmates,
  getClassTimetable,
  getTodaySchedule
} from '../../services/studentClassService';
import {
  getAssignmentsByStudentId,
  getAssignmentStats,
  updateAssignmentStatus,
  submitAssignmentWithStagedFiles,
  getAssignmentWithFiles
} from '../../services/assignmentsService';
import {
  getGroupedStudentExams,
  getStudentResults,
  getStudentResultStats
} from '../../services/studentExamService';

type TabType = 'overview' | 'assignments' | 'timetable' | 'classmates' | 'curriculars' | 'exams' | 'results';
type TimetableViewType = 'week' | 'day';

interface SchoolClassmate {
  id: string;
  name: string;
  email: string;
  profilePicture?: string;
}

/**
 * SchoolMyClass - School Student Class Interface
 * 
 * This component handles the complete school student class experience including:
 * - Class overview and information
 * - Assignments management
 * - Timetable viewing
 * - Classmates interaction
 * - Co-curricular activities
 * - Exams and results
 */
const SchoolMyClass: React.FC = () => {
  const { user } = useAuth();
  const userEmail = localStorage.getItem('userEmail') || user?.email;
  const { studentData, loading: authLoading } = useStudentDataByEmail(userEmail);
  const studentId = studentData?.id;

  // State management
  const [activeTab, setActiveTab] = useState<TabType>('overview');
  const [timetableView, setTimetableView] = useState<TimetableViewType>('week');
  const [selectedDay, setSelectedDay] = useState<number>(new Date().getDay() || 1);
  const [loading, setLoading] = useState(true);

  // Data state
  const [classInfo, setClassInfo] = useState<SchoolClassInfo | null>(null);
  const [classmates, setClassmates] = useState<SchoolClassmate[]>([]);
  const [timetable, setTimetable] = useState<SchoolTimetableSlot[]>([]);
  const [todaySchedule, setTodaySchedule] = useState<SchoolTimetableSlot[]>([]);
  const [assignments, setAssignments] = useState<Assignment[]>([]);
  const [stats, setStats] = useState<AssignmentStats>({
    total: 0,
    todo: 0,
    inProgress: 0,
    submitted: 0,
    graded: 0,
    averageGrade: 0
  });

  // Co-curriculars data
  const [clubs, setClubs] = useState<SchoolClub[]>([]);
  const [achievements, setAchievements] = useState<SchoolAchievement[]>([]);
  const [certificates, setCertificates] = useState<SchoolCertificate[]>([]);
  const [upcomingActivities, setUpcomingActivities] = useState<SchoolActivity[]>([]);

  // Exams and results data
  const [groupedExams, setGroupedExams] = useState<SchoolGroupedExam[]>([]);
  const [results, setResults] = useState<SchoolStudentResult[]>([]);
  const [resultStats, setResultStats] = useState<SchoolResultStats>({
    totalExams: 0,
    passed: 0,
    failed: 0,
    absent: 0,
    averagePercentage: 0
  });

  // Pagination states
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(5);

  // Assignment upload states
  const [showUploadModal, setShowUploadModal] = useState(false);
  const [selectedAssignment, setSelectedAssignment] = useState<Assignment | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const fileUploadRef = React.useRef<{ getStagedFiles: () => File[]; clearStagedFiles: () => void }>(null);

  // Assignment details states
  const [showDetailsModal, setShowDetailsModal] = useState(false);
  const [assignmentDetails, setAssignmentDetails] = useState<any>(null);
  const [loadingDetails, setLoadingDetails] = useState(false);

  // Modal states
  const [showNotification, setShowNotification] = useState(false);
  const [notification, setNotification] = useState({ type: 'info' as 'info' | 'success' | 'error' | 'warning', title: '', message: '' });

  // Reset pagination when switching to assignments tab
  useEffect(() => {
    if (activeTab === 'assignments') {
      setCurrentPage(1);
    }
  }, [activeTab]);

  // Helper functions
  const showNotificationModal = (type: 'success' | 'error' | 'info' | 'warning', title: string, message: string) => {
    setNotification({ type, title, message });
    setShowNotification(true);
  };

  // Helper function to parse date as local time (avoiding timezone conversion)
  const parseAsLocalDate = (dateString: string) => {
    if (!dateString) return new Date();
    // Remove timezone info and parse as local time
    const dueDateStr = dateString.replace('Z', '').replace('+00:00', '').replace('T', ' ');
    return new Date(dueDateStr);
  };

  const isOverdue = (dueDate: string) => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const dueDateStr = dueDate.replace('Z', '').replace('+00:00', '').replace('T', ' ');
    const dueDay = new Date(dueDateStr);
    dueDay.setHours(0, 0, 0, 0);
    return dueDay.getTime() < today.getTime();
  };

  const canSubmitAssignment = (assignment: Assignment) => {
    if (assignment.status === 'submitted' || assignment.status === 'graded') {
      return false;
    }
    if (!isOverdue(assignment.due_date)) {
      return true;
    }
    return assignment.allow_late_submission === true;
  };

  // Helper function to open file with error handling
  const openFile = async (fileUrl: string, fileName: string = 'file') => {
    try {
      console.log(`Opening ${fileName}:`, fileUrl);

      const accessibleUrl = getAccessibleFileUrl(fileUrl);
      console.log('Generated accessible URL:', accessibleUrl);

      // Test if the URL is accessible
      const testResponse = await fetch(accessibleUrl, { method: 'HEAD' });
      console.log('File accessibility test status:', testResponse.status);

      if (testResponse.ok) {
        window.open(accessibleUrl, '_blank');
      } else {
        console.warn('File not accessible via proxy, trying direct URL');
        window.open(fileUrl, '_blank');
      }
    } catch (error) {
      // Fallback to direct URL
      window.open(fileUrl, '_blank');
    }
  };

  const getStatusBadge = (status: string) => {
    const configs: Record<string, { bg: string; text: string; label: string; icon: React.ComponentType<{ className?: string }> }> = {
      'todo': { bg: 'bg-gray-100 border-gray-200', text: 'text-gray-700', label: 'To Do', icon: ClipboardList },
      'in-progress': { bg: 'bg-blue-100 border-blue-200', text: 'text-blue-700', label: 'In Progress', icon: Zap },
      'submitted': { bg: 'bg-purple-100 border-purple-200', text: 'text-purple-700', label: 'Submitted', icon: CheckSquare },
      'graded': { bg: 'bg-green-100 border-green-200', text: 'text-green-700', label: 'Graded', icon: Star }
    };
    const config = configs[status] || configs.todo;
    const IconComponent = config.icon;
    return (
      <span className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold border ${config.bg} ${config.text} shadow-sm`}>
        <IconComponent className="w-3 h-3" />
        {config.label}
      </span>
    );
  };

  // Fetch co-curriculars data
  const fetchCoCurricularsData = async () => {
    try {
      // Fetch clubs data with proper joins
      const { data: membershipData, error: membershipError } = await supabase
        .from('club_memberships')
        .select(`
          membership_id,
          club_id,
          student_email,
          status,
          enrolled_at,
          total_sessions_attended,
          total_sessions_held,
          attendance_percentage,
          performance_score,
          clubs (
            club_id,
            name,
            category,
            description,
            meeting_day,
            meeting_time,
            location,
            capacity,
            is_active
          )
        `)
        .eq('student_email', userEmail)
        .eq('status', 'active');

      if (membershipError) {
        console.error('Error fetching club memberships:', membershipError);
        return;
      }

      if (membershipData && membershipData.length > 0) {
        const clubsData = membershipData.map((membership: any) => ({
          club_id: membership.clubs?.club_id,
          name: membership.clubs?.name,
          category: membership.clubs?.category,
          description: membership.clubs?.description || '',
          meeting_day: membership.clubs?.meeting_day,
          meeting_time: membership.clubs?.meeting_time,
          location: membership.clubs?.location,
          is_active: membership.clubs?.is_active,
          capacity: membership.clubs?.capacity || 30,
          membership_id: membership.membership_id,
          enrolled_at: membership.enrolled_at,
          total_sessions_attended: membership.total_sessions_attended,
          total_sessions_held: membership.total_sessions_held,
          attendance_percentage: membership.attendance_percentage,
          performance_score: membership.performance_score,
          memberCount: 0,
          avgAttendance: Math.round(membership.attendance_percentage || 0),
          upcomingActivities: [],
          meetingDay: membership.clubs?.meeting_day || 'TBD',
          meetingTime: membership.clubs?.meeting_time || 'TBD',
        }));

        const clubsWithMembers = await Promise.all(
          clubsData.map(async (club: any) => {
            const { count: memberCount } = await supabase
              .from('club_memberships')
              .select('*', { count: 'exact', head: true })
              .eq('club_id', club.club_id)
              .eq('status', 'active');

            return {
              ...club,
              memberCount: memberCount || 0,
            };
          })
        );

        setClubs(clubsWithMembers);

        // Generate upcoming activities from clubs
        const activities: SchoolActivity[] = [];
        clubsWithMembers.forEach(club => {
          if (club.meeting_day && club.meeting_time) {
            activities.push({
              title: `${club.name?.charAt(0).toUpperCase() + club.name?.slice(1).toLowerCase() || 'Club'} Meeting`,
              clubName: club.name?.charAt(0).toUpperCase() + club.name?.slice(1).toLowerCase() || 'Club',
              date: new Date(),
              type: 'meeting'
            });
          }
        });
        setUpcomingActivities(activities.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime()));
      }

      // Fetch achievements
      const { data: resultsData } = await supabase
        .from('competition_results')
        .select(`
          result_id,
          rank,
          score,
          award,
          performance_notes,
          competitions (
            comp_id,
            name,
            level,
            category,
            competition_date,
            status
          )
        `)
        .eq('student_email', userEmail)
        .order('rank', { ascending: true });

      if (resultsData) {
        const achievementsData = resultsData
          .filter((result: any) => result.competitions)
          .map((result: any) => {
            const competition = Array.isArray(result.competitions) ? result.competitions[0] : result.competitions;
            return {
              result_id: result.result_id,
              name: competition?.name || '',
              rank: result.rank,
              score: result.score,
              award: result.award || 'Participant',
              level: competition?.level || 'School',
              category: competition?.category || 'General',
              date: competition?.competition_date || '',
              status: competition?.status || '',
              notes: result.performance_notes
            };
          })
          .sort((a: any, b: any) => a.rank - b.rank);
        setAchievements(achievementsData);
      }

      // Fetch certificates
      const { data: certificatesData } = await supabase
        .from('club_certificates')
        .select(`
          certificate_id,
          title,
          description,
          certificate_type,
          issued_date,
          credential_id,
          metadata,
          competitions (
            name,
            level,
            category
          )
        `)
        .eq('student_email', userEmail)
        .order('issued_date', { ascending: false });

      if (certificatesData) {
        const processedCertificates = certificatesData.map((cert: any) => ({
          ...cert,
          competitions: Array.isArray(cert.competitions) && cert.competitions.length > 0
            ? cert.competitions[0]
            : { name: '', level: '', category: '' }
        }));
        setCertificates(processedCertificates);
      }
    } catch (error) {
      console.error('Error fetching co-curriculars data:', error);
    }
  };

  // Fetch all data
  useEffect(() => {
    const fetchData = async () => {
      if (authLoading) return;
      if (!studentId) {
        setLoading(false);
        return;
      }

      try {
        setLoading(true);

        // Fetch class info first
        const classData = await getStudentClassInfo(studentId);
        setClassInfo(classData);

        if (classData?.id) {
          // Fetch all related data in parallel
          const [classmatesData, timetableData, todayData, assignmentsData, statsData] = await Promise.all([
            getClassmates(classData.id, studentId),
            getClassTimetable(classData.id),
            getTodaySchedule(classData.id),
            getAssignmentsByStudentId(studentId),
            getAssignmentStats(studentId)
          ]);

          setClassmates(classmatesData);
          setTimetable(timetableData);
          setTodaySchedule(todayData);
          setAssignments(assignmentsData);
          setStats(statsData);
        }

        // Fetch co-curriculars data
        await fetchCoCurricularsData();

        // Fetch exams and results data
        if (studentId) {
          const [groupedExamsData, resultsData, resultStatsData] = await Promise.all([
            getGroupedStudentExams(studentId),
            getStudentResults(studentId),
            getStudentResultStats(studentId)
          ]);
          setGroupedExams(groupedExamsData);
          setResults(resultsData as SchoolStudentResult[]);
          setResultStats(resultStatsData);
        }
      } catch (error) {
        console.error('Error fetching school class data:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [studentId, authLoading, userEmail]);

  // Get upcoming assignments (next 5 due)
  const upcomingAssignments = useMemo(() => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    return assignments
      .filter(a => {
        if (a.status === 'graded') return false;

        const dueDateStr = a.due_date.replace('Z', '').replace('+00:00', '').replace('T', ' ');
        const dueDay = new Date(dueDateStr);
        dueDay.setHours(0, 0, 0, 0);

        return dueDay.getTime() >= today.getTime();
      })
      .sort((a, b) => {
        const dueDateStrA = a.due_date.replace('Z', '').replace('+00:00', '').replace('T', ' ');
        const dueDayA = new Date(dueDateStrA);
        dueDayA.setHours(0, 0, 0, 0);

        const dueDateStrB = b.due_date.replace('Z', '').replace('+00:00', '').replace('T', ' ');
        const dueDayB = new Date(dueDateStrB);
        dueDayB.setHours(0, 0, 0, 0);

        return dueDayA.getTime() - dueDayB.getTime();
      })
      .slice(0, 5);
  }, [assignments]);

  // Pagination calculations for assignments
  const paginatedAssignments = useMemo(() => {
    const startIndex = (currentPage - 1) * itemsPerPage;
    const endIndex = startIndex + itemsPerPage;
    return assignments.slice(startIndex, endIndex);
  }, [assignments, currentPage, itemsPerPage]);

  const totalPages = Math.ceil(assignments.length / itemsPerPage);

  // Event handlers
  const handleStatusChange = async (assignmentId: string, studentAssignmentId: string, newStatus: string) => {
    try {
      // Find the assignment to check late submission policy
      const assignment = assignments.find(a => a.assignment_id === assignmentId);

      // Validate late submission if trying to submit
      if (newStatus === 'submitted' && assignment) {
        if (!canSubmitAssignment(assignment)) {
          showNotificationModal('error', 'Submission Not Allowed',
            'Late submission is not allowed for this assignment and the due date has passed.');
          return;
        }
      }

      await updateAssignmentStatus(studentAssignmentId, newStatus);

      // Update local state with submission date if submitting
      setAssignments(prev => prev.map(a =>
        a.assignment_id === assignmentId
          ? {
            ...a,
            status: newStatus as any,
            submission_date: newStatus === 'submitted' && !a.submission_date
              ? new Date().toISOString()
              : a.submission_date
          }
          : a
      ));

      if (studentId) {
        const updatedStats = await getAssignmentStats(studentId);
        setStats(updatedStats);
      }

      // Show success notification
      const statusLabels: Record<string, string> = {
        'todo': 'To Do',
        'in-progress': 'In Progress',
        'submitted': 'Submitted',
        'graded': 'Graded'
      };
      showNotificationModal('success', 'Status Updated',
        `Assignment status changed to ${statusLabels[newStatus] || newStatus}`);

    } catch (error) {
      console.error('Error updating status:', error);
      showNotificationModal('error', 'Update Failed',
        'Failed to update assignment status. Please try again.');
    }
  };

  const handleUploadClick = (assignment: Assignment) => {
    setSelectedAssignment(assignment);
    setShowUploadModal(true);
  };

  const handleUploadSubmit = async () => {
    if (!selectedAssignment || !studentId || !fileUploadRef.current) return;

    const stagedFiles = fileUploadRef.current.getStagedFiles();

    setIsUploading(true);
    setUploadProgress(0);

    try {
      // Get user token from Supabase session
      const { data: { session }, error: sessionError } = await supabase.auth.getSession();

      if (sessionError) {
        console.error('Session error:', sessionError);
        showNotificationModal('error', 'Authentication Error', `Authentication error: ${sessionError.message}`);
        return;
      }

      if (!session?.access_token) {
        console.error('No access token found in session');
        showNotificationModal('error', 'Authentication Required', 'Authentication required. Please log in again.');
        return;
      }

      const userToken = session.access_token;

      // Check storage API configuration
      const storageApiUrl = import.meta.env.VITE_STORAGE_API_URL;
      if (!storageApiUrl) {
        console.error('Storage API URL not configured');
        showNotificationModal('error', 'Configuration Error', 'Storage service not configured. Please contact support.');
        return;
      }

      // Simulate initial progress
      setUploadProgress(10);

      // Submit assignment with staged files
      await submitAssignmentWithStagedFiles(
        selectedAssignment.student_assignment_id,
        stagedFiles,
        studentId,
        selectedAssignment.assignment_id,
        userToken
      );

      setUploadProgress(100);

      // Update local state
      setAssignments(prev => prev.map(a =>
        a.assignment_id === selectedAssignment.assignment_id
          ? { ...a, status: 'submitted', submission_date: new Date().toISOString() }
          : a
      ));

      // Refresh stats
      if (studentId) {
        const updatedStats = await getAssignmentStats(studentId);
        setStats(updatedStats);
      }

      // Clear staged files and close modal
      fileUploadRef.current.clearStagedFiles();

      setTimeout(() => {
        setShowUploadModal(false);
        setSelectedAssignment(null);
        setUploadProgress(0);
        setIsUploading(false);
      }, 1000);

    } catch (error: any) {
      console.error('Upload failed:', error);

      // Provide more specific error messages
      let errorMessage = error?.message || 'Unknown error';

      if (errorMessage.includes('Authentication') || errorMessage.includes('401')) {
        errorMessage = 'Authentication failed. Please refresh the page and try logging in again.';
      } else if (errorMessage.includes('Storage service')) {
        errorMessage = 'File storage service is not available. Please try again later or contact support.';
      } else if (errorMessage.includes('Network')) {
        errorMessage = 'Network error. Please check your internet connection and try again.';
      }

      showNotificationModal('error', 'Upload Failed', errorMessage);
      setIsUploading(false);
      setUploadProgress(0);
    }
  };

  const handleViewDetails = async (assignment: Assignment) => {
    setLoadingDetails(true);
    setShowDetailsModal(true);

    try {
      const detailsWithFiles = await getAssignmentWithFiles(studentId!, assignment.assignment_id);
      setAssignmentDetails(detailsWithFiles);
    } catch (error) {
      console.error('Error loading assignment details:', error);
      showNotificationModal('error', 'Load Error', 'Failed to load assignment details');
      setShowDetailsModal(false);
    } finally {
      setLoadingDetails(false);
    }
  };

  const closeDetailsModal = () => {
    setShowDetailsModal(false);
    setAssignmentDetails(null);
  };

  const closeUploadModal = () => {
    if (!isUploading) {
      setShowUploadModal(false);
      setSelectedAssignment(null);
      setUploadProgress(0);
      if (fileUploadRef.current) {
        fileUploadRef.current.clearStagedFiles();
      }
    }
  };

  // Helper function to extract file key from R2 URL
  const extractFileKey = (fileUrl: string): string | null => {
    if (fileUrl.includes('.r2.dev/')) {
      const urlParts = fileUrl.split('.r2.dev/');
      if (urlParts.length > 1) {
        return urlParts[1];
      }
    }
    return null;
  };

  // Helper function to generate accessible file URL
  const getAccessibleFileUrl = (fileUrl: string) => {
    const storageApiUrl = import.meta.env.VITE_STORAGE_API_URL;
    if (!storageApiUrl) {
      console.error('VITE_STORAGE_API_URL not configured');
      return fileUrl; // Fallback to direct URL
    }

    const fileKey = extractFileKey(fileUrl);
    if (!fileKey) {
      console.error('Could not extract file key from URL:', fileUrl);
      return fileUrl; // Fallback to direct URL
    }

    return `${storageApiUrl}/file/${encodeURIComponent(fileKey)}`;
  };

  const handlePageChange = (page: number) => {
    setCurrentPage(page);
  };

  if (authLoading || loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="w-12 h-12 text-blue-600 animate-spin mx-auto mb-4" />
          <p className="text-gray-600">Loading your class...</p>
        </div>
      </div>
    );
  }

  if (!classInfo) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <div className="text-center max-w-md">
          <div className="bg-orange-100 rounded-full p-4 w-16 h-16 mx-auto mb-4 flex items-center justify-center">
            <AlertCircle className="w-8 h-8 text-orange-600" />
          </div>
          <h2 className="text-xl font-semibold text-gray-900 mb-2">No Class Assigned</h2>
          <p className="text-gray-600">You haven't been assigned to a class yet. Please contact your school administrator.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-4 sm:py-6 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <SchoolClassHeader classInfo={classInfo} />

        {/* Tabs */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 mb-6">
          <div className="border-b border-gray-200">
            {/* Mobile Tab Selector */}
            <div className="sm:hidden">
              <select
                value={activeTab}
                onChange={(e) => setActiveTab(e.target.value as TabType)}
                className="block w-full px-4 py-3 text-base border-0 bg-transparent focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              >
                {[
                  { id: 'overview', label: 'Overview' },
                  { id: 'assignments', label: 'Assignments' },
                  { id: 'timetable', label: 'Timetable' },
                  { id: 'classmates', label: 'Classmates' },
                  { id: 'curriculars', label: 'Co-Curriculars' },
                  { id: 'exams', label: 'Exams' },
                  { id: 'results', label: 'Results' }
                ].map(tab => (
                  <option key={tab.id} value={tab.id}>
                    {tab.label}
                  </option>
                ))}
              </select>
            </div>

            {/* Desktop Tab Navigation */}
            <nav className="hidden sm:flex -mb-px overflow-x-auto">
              {[
                { id: 'overview', label: 'Overview', icon: Target },
                { id: 'assignments', label: 'Assignments', icon: ClipboardList },
                { id: 'timetable', label: 'Timetable', icon: Calendar },
                { id: 'classmates', label: 'Classmates', icon: Users },
                { id: 'curriculars', label: 'Co-Curriculars', icon: GraduationCap },
                { id: 'exams', label: 'Exams', icon: FileText },
                { id: 'results', label: 'Results', icon: Award }
              ].map(tab => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id as TabType)}
                  className={`flex items-center gap-2 px-4 lg:px-6 py-4 text-sm font-medium border-b-2 transition-colors whitespace-nowrap ${
                    activeTab === tab.id
                      ? 'border-blue-600 text-blue-600'
                      : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                  }`}
                >
                  <tab.icon className="w-4 h-4" />
                  <span className="hidden md:inline">{tab.label}</span>
                  <span className="md:hidden">{tab.label.split(' ')[0]}</span>
                </button>
              ))}
            </nav>
          </div>

          <div className="p-4 sm:p-6">
            {/* Overview Tab */}
            {activeTab === 'overview' && (
              <OverviewTab
                stats={stats}
                upcomingAssignments={upcomingAssignments.map(a => ({
                  id: a.assignment_id,
                  title: a.title,
                  course_name: a.course_name,
                  due_date: a.due_date,
                  status: a.status,
                  total_points: a.total_points
                }))}
                todaySchedule={todaySchedule.map(slot => ({
                  id: slot.id,
                  period_number: slot.period_number,
                  start_time: slot.start_time,
                  subject_name: slot.subject_name,
                  educator_name: slot.educator_name,
                  room_number: slot.room_number
                }))}
                onViewAllAssignments={() => setActiveTab('assignments')}
                onViewFullTimetable={() => setActiveTab('timetable')}
                additionalInfo={{
                  title: "Class Information",
                  items: [
                    { label: "Class", value: classInfo?.name || 'N/A' },
                    { label: "Grade", value: classInfo?.grade || 'N/A' },
                    { label: "School", value: classInfo?.school_name || 'N/A' },
                    { label: "Classmates", value: `${classmates.length} students` }
                  ]
                }}
                loading={loading}
              />
            )}

            {/* Assignments Tab */}
            {activeTab === 'assignments' && (
              <AssignmentsTab
                assignments={assignments}
                paginatedAssignments={paginatedAssignments}
                currentPage={currentPage}
                totalPages={totalPages}
                itemsPerPage={itemsPerPage}
                loading={loading}
                onStatusChange={handleStatusChange}
                onUploadClick={handleUploadClick}
                onViewDetails={handleViewDetails}
                onPageChange={handlePageChange}
                isReadOnly={false}
              />
            )}

            {/* Timetable Tab */}
            {activeTab === 'timetable' && (
              <div>
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-6 gap-4">
                  <div>
                    <h2 className="text-xl sm:text-2xl font-bold text-gray-900 mb-2">Class Timetable</h2>
                    <p className="text-gray-600">Your weekly class schedule</p>
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => setTimetableView('week')}
                      className={`px-3 sm:px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                        timetableView === 'week'
                          ? 'bg-blue-600 text-white'
                          : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                      }`}
                    >
                      <span className="hidden sm:inline">Week View</span>
                      <span className="sm:hidden">Week</span>
                    </button>
                    <button
                      onClick={() => setTimetableView('day')}
                      className={`px-3 sm:px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                        timetableView === 'day'
                          ? 'bg-blue-600 text-white'
                          : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                      }`}
                    >
                      <span className="hidden sm:inline">Day View</span>
                      <span className="sm:hidden">Day</span>
                    </button>
                  </div>
                </div>

                {timetableView === 'day' && (
                  <div className="mb-6">
                    <select
                      value={selectedDay}
                      onChange={(e) => setSelectedDay(parseInt(e.target.value))}
                      className="w-full sm:w-auto px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    >
                      <option value={1}>Monday</option>
                      <option value={2}>Tuesday</option>
                      <option value={3}>Wednesday</option>
                      <option value={4}>Thursday</option>
                      <option value={5}>Friday</option>
                      <option value={6}>Saturday</option>
                      <option value={7}>Sunday</option>
                    </select>
                  </div>
                )}

                <SchoolTimetableView
                  timetable={timetable}
                  viewType={timetableView}
                  selectedDay={selectedDay}
                  loading={loading}
                />
              </div>
            )}

            {/* Classmates Tab */}
            {activeTab === 'classmates' && (
              <ClassmatesTab
                classmates={classmates.map(c => ({
                  id: c.id,
                  name: c.name,
                  email: c.email,
                  profilePicture: c.profilePicture
                }))}
                loading={loading}
              />
            )}

            {/* Co-Curriculars Tab */}
            {activeTab === 'curriculars' && (
              <SchoolCoCurricularsTab
                clubs={clubs}
                achievements={achievements}
                certificates={certificates}
                upcomingActivities={upcomingActivities}
                loading={loading}
              />
            )}

            {/* Exams Tab */}
            {activeTab === 'exams' && (
              <SchoolExamsTab
                groupedExams={groupedExams}
                loading={loading}
              />
            )}

            {/* Results Tab */}
            {activeTab === 'results' && (
              <SchoolResultsTab
                results={results}
                resultStats={resultStats}
                loading={loading}
              />
            )}
          </div>
        </div>
      </div>

      {/* Assignment Upload Modal */}
      {showUploadModal && selectedAssignment && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-xl max-w-lg w-full">
            {/* Modal Header */}
            <div className="flex items-center justify-between p-6 border-b border-gray-200">
              <div>
                <h3 className="text-lg font-semibold text-gray-900">Submit Assignment</h3>
                <p className="text-sm text-gray-500 mt-1">{selectedAssignment?.title}</p>
              </div>
              <button
                onClick={closeUploadModal}
                disabled={isUploading}
                className="p-2 hover:bg-gray-100 rounded-lg transition-colors disabled:opacity-50"
              >
                <X className="w-5 h-5 text-gray-500" />
              </button>
            </div>

            {/* Modal Body */}
            <div className="p-6">
              {/* File Upload Component */}
              <StudentAssignmentFileUpload
                ref={fileUploadRef}
                maxFiles={3}
                acceptedTypes={['.pdf', '.doc', '.docx', '.txt', '.jpg', '.png']}
                className="mb-6"
              />

              {/* Upload Progress */}
              {isUploading && (
                <div className="space-y-2 mb-6">
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-gray-600">Submitting assignment...</span>
                    <span className="text-blue-600 font-medium">{uploadProgress}%</span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div
                      className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                      style={{ width: `${uploadProgress}%` }}
                    ></div>
                  </div>
                </div>
              )}

              {/* Assignment Details */}
              <div className="bg-gray-50 rounded-lg p-4 space-y-2">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-gray-600">Course:</span>
                  <span className="font-medium text-gray-900">{selectedAssignment?.course_name}</span>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-gray-600">Due Date:</span>
                  <span className="font-medium text-gray-900">
                    {selectedAssignment?.due_date && parseAsLocalDate(selectedAssignment.due_date).toLocaleDateString()}
                  </span>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-gray-600">Points:</span>
                  <span className="font-medium text-gray-900">{selectedAssignment?.total_points}</span>
                </div>
              </div>
            </div>

            {/* Modal Footer */}
            <div className="flex items-center justify-end gap-3 p-6 border-t border-gray-200">
              <button
                onClick={closeUploadModal}
                disabled={isUploading}
                className="px-4 py-2 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors disabled:opacity-50"
              >
                Cancel
              </button>
              <button
                onClick={handleUploadSubmit}
                disabled={isUploading}
                className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
              >
                {isUploading ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Submitting...
                  </>
                ) : (
                  <>
                    <Upload className="w-4 h-4" />
                    Submit Assignment
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Assignment Details Modal */}
      {showDetailsModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
            {/* Modal Header */}
            <div className="flex items-center justify-between p-6 border-b border-gray-200 sticky top-0 bg-white">
              <div>
                <h3 className="text-xl font-semibold text-gray-900">
                  {assignmentDetails?.title || 'Assignment Details'}
                </h3>
                <p className="text-sm text-gray-500 mt-1">
                  {assignmentDetails?.course_name} • Due: {assignmentDetails?.due_date && parseAsLocalDate(assignmentDetails.due_date).toLocaleDateString()}
                </p>
              </div>
              <button
                onClick={closeDetailsModal}
                className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <X className="w-5 h-5 text-gray-500" />
              </button>
            </div>

            {/* Modal Body */}
            <div className="p-6">
              {loadingDetails ? (
                <div className="flex items-center justify-center py-12">
                  <Loader2 className="w-8 h-8 text-blue-600 animate-spin" />
                  <span className="ml-3 text-gray-600">Loading assignment details...</span>
                </div>
              ) : assignmentDetails ? (
                <div className="space-y-6">
                  {/* Assignment Info */}
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="bg-gray-50 rounded-lg p-4">
                      <p className="text-sm text-gray-500 mb-1">Status</p>
                      {getStatusBadge(assignmentDetails.status)}
                    </div>
                    <div className="bg-gray-50 rounded-lg p-4">
                      <p className="text-sm text-gray-500 mb-1">Points</p>
                      <p className="text-lg font-semibold text-gray-900">{assignmentDetails.total_points}</p>
                    </div>
                    <div className="bg-gray-50 rounded-lg p-4">
                      <p className="text-sm text-gray-500 mb-1">Type</p>
                      <p className="text-lg font-semibold text-gray-900 capitalize">
                        {assignmentDetails.assignment_type?.replace('_', ' ') || 'Assignment'}
                      </p>
                    </div>
                  </div>

                  {/* Description */}
                  {assignmentDetails.description && (
                    <div>
                      <h4 className="text-lg font-semibold text-gray-900 mb-3">Description</h4>
                      <div className="bg-gray-50 rounded-lg p-4">
                        <p className="text-gray-700 whitespace-pre-wrap">{assignmentDetails.description}</p>
                      </div>
                    </div>
                  )}

                  {/* Instructions */}
                  {assignmentDetails.instructions && (
                    <div>
                      <h4 className="text-lg font-semibold text-gray-900 mb-3">Instructions</h4>
                      <div className="bg-blue-50 rounded-lg p-4 border border-blue-200">
                        <p className="text-blue-900 whitespace-pre-wrap">{assignmentDetails.instructions}</p>
                      </div>
                    </div>
                  )}

                  {/* Instruction Files */}
                  {assignmentDetails.instruction_files && assignmentDetails.instruction_files.length > 0 && (
                    <div>
                      <h4 className="text-lg font-semibold text-gray-900 mb-3">Instruction Files</h4>
                      <div className="space-y-2">
                        {assignmentDetails.instruction_files.map((file: any) => (
                          <div key={file.attachment_id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg border border-gray-200">
                            <div className="flex items-center gap-3">
                              <Paperclip className="w-5 h-5 text-gray-500" />
                              <div>
                                <p className="font-medium text-gray-900">{file.file_name}</p>
                                <p className="text-sm text-gray-500">
                                  {file.file_type} • {(file.file_size / (1024 * 1024)).toFixed(2)} MB
                                </p>
                              </div>
                            </div>
                            <button
                              onClick={() => openFile(file.file_url, file.file_name)}
                              className="flex items-center gap-2 px-3 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm font-medium"
                            >
                              <FileText className="w-4 h-4" />
                              View
                            </button>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Student Submission Files */}
                  {assignmentDetails.submission_files && assignmentDetails.submission_files.length > 0 && (
                    <div>
                      <h4 className="text-lg font-semibold text-gray-900 mb-3">Your Submissions</h4>
                      <div className="space-y-2">
                        {assignmentDetails.submission_files.map((file: any) => (
                          <div key={file.attachment_id} className="flex items-center justify-between p-3 bg-green-50 rounded-lg border border-green-200">
                            <div className="flex items-center gap-3">
                              <CheckCircle2 className="w-5 h-5 text-green-600" />
                              <div>
                                <p className="font-medium text-green-900">{file.original_filename}</p>
                                <p className="text-sm text-green-700">
                                  Submitted on {new Date(file.uploaded_date).toLocaleDateString()} • {(file.file_size / (1024 * 1024)).toFixed(2)} MB
                                </p>
                              </div>
                            </div>
                            <button
                              onClick={() => openFile(file.file_url, file.original_filename)}
                              className="flex items-center gap-2 px-3 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors text-sm font-medium"
                            >
                              <FileText className="w-4 h-4" />
                              View
                            </button>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Grade and Feedback */}
                  {assignmentDetails.status === 'graded' && (
                    <div>
                      <h4 className="text-lg font-semibold text-gray-900 mb-3">Grade & Feedback</h4>
                      <div className="bg-green-50 rounded-lg p-4 border border-green-200">
                        <div className="flex items-center justify-between mb-3">
                          <span className="text-green-700 font-medium">Grade Received:</span>
                          <span className="text-2xl font-bold text-green-800">
                            {assignmentDetails.grade_percentage}% ({assignmentDetails.grade_received}/{assignmentDetails.total_points})
                          </span>
                        </div>
                        {assignmentDetails.instructor_feedback && (
                          <div>
                            <p className="text-green-700 font-medium mb-2">Instructor Feedback:</p>
                            <p className="text-green-800 whitespace-pre-wrap">{assignmentDetails.instructor_feedback}</p>
                          </div>
                        )}
                        {assignmentDetails.graded_date && (
                          <p className="text-sm text-green-600 mt-3">
                            Graded on {new Date(assignmentDetails.graded_date).toLocaleDateString()}
                          </p>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              ) : (
                <div className="text-center py-12">
                  <AlertCircle className="w-12 h-12 text-gray-300 mx-auto mb-4" />
                  <p className="text-gray-500">Failed to load assignment details</p>
                </div>
              )}
            </div>

            {/* Modal Footer */}
            <div className="flex items-center justify-end gap-3 p-6 border-t border-gray-200 bg-gray-50">
              <button
                onClick={closeDetailsModal}
                className="px-4 py-2 text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
              >
                Close
              </button>
              {assignmentDetails && canSubmitAssignment(assignmentDetails) && (
                <button
                  onClick={() => {
                    closeDetailsModal();
                    handleUploadClick(assignmentDetails);
                  }}
                  className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center gap-2"
                >
                  <Upload className="w-4 h-4" />
                  Upload Submission
                </button>
              )}

              {/* Show message when submission is disabled due to late submission policy */}
              {assignmentDetails && !canSubmitAssignment(assignmentDetails) && assignmentDetails.status !== 'submitted' && assignmentDetails.status !== 'graded' && isOverdue(assignmentDetails.due_date) && !assignmentDetails.allow_late_submission && (
                <div className="flex items-center gap-2 px-4 py-2 bg-red-50 text-red-700 rounded-lg text-sm font-medium border border-red-200">
                  <AlertCircle className="w-4 h-4" />
                  Late submission not allowed
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Notification Modal */}
      <NotificationModal
        isOpen={showNotification}
        onClose={() => setShowNotification(false)}
        type={notification.type}
        title={notification.title}
        message={notification.message}
      />
    </div>
  );
};

export default SchoolMyClass;