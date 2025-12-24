import React, { useState, useEffect, useMemo } from 'react';
import {
  BookOpen,
  Users,
  Calendar,
  Clock,
  GraduationCap,
  Mail,
  ClipboardList,
  ChevronRight,
  Loader2,
  AlertCircle,
  CheckCircle2,
  FileText,
  Target,
  MapPin,
  Trophy,
  TrendingUp,
  Activity,
  Award,
  Upload,
  Paperclip,
  X
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useStudentDataByEmail } from '../../hooks/useStudentDataByEmail';
import { supabase } from '../../lib/supabaseClient';
import {
  getStudentClassInfo,
  getClassmates,
  getClassTimetable,
  getTodaySchedule,
  ClassInfo,
  Classmate,
  TimetableSlot
} from '../../services/studentClassService';
import {
  getAssignmentsByStudentId,
  getAssignmentStats,
  updateAssignmentStatus,
  submitAssignmentWithFile
} from '../../services/assignmentsService';
import storageApiService from '../../services/storageApiService';
import {
  getStudentExams,
  getStudentResults,
  getStudentResultStats,
  StudentExam,
  StudentResult
} from '../../services/studentExamService';

type TabType = 'overview' | 'assignments' | 'timetable' | 'classmates' | 'curriculars' | 'exams' | 'results';
type TimetableViewType = 'week' | 'day';

const DAYS = ['', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];
const SHORT_DAYS = ['', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
const TIME_SLOTS = ['09:00', '10:00', '11:00', '12:00', '13:00', '14:00', '15:00', '16:00', '17:00', '18:00'];

// Subject color mapping for the grid view
const getSubjectColor = (subject: string): { bg: string; text: string; border: string } => {
  const subjectLower = subject?.toLowerCase() || '';
  
  if (subjectLower.includes('math')) {
    return { bg: 'bg-purple-100', text: 'text-purple-900', border: 'border-purple-200' };
  }
  if (subjectLower.includes('biology') || subjectLower.includes('bio')) {
    return { bg: 'bg-green-100', text: 'text-green-900', border: 'border-green-200' };
  }
  if (subjectLower.includes('history')) {
    return { bg: 'bg-violet-100', text: 'text-violet-900', border: 'border-violet-200' };
  }
  if (subjectLower.includes('geo') || subjectLower.includes('geography')) {
    return { bg: 'bg-rose-100', text: 'text-rose-900', border: 'border-rose-200' };
  }
  if (subjectLower.includes('art')) {
    return { bg: 'bg-emerald-100', text: 'text-emerald-900', border: 'border-emerald-200' };
  }
  if (subjectLower.includes('science') || subjectLower.includes('physics') || subjectLower.includes('chemistry')) {
    return { bg: 'bg-blue-100', text: 'text-blue-900', border: 'border-blue-200' };
  }
  if (subjectLower.includes('english') || subjectLower.includes('language')) {
    return { bg: 'bg-amber-100', text: 'text-amber-900', border: 'border-amber-200' };
  }
  if (subjectLower.includes('music')) {
    return { bg: 'bg-pink-100', text: 'text-pink-900', border: 'border-pink-200' };
  }
  if (subjectLower.includes('sport') || subjectLower.includes('pe') || subjectLower.includes('physical')) {
    return { bg: 'bg-orange-100', text: 'text-orange-900', border: 'border-orange-200' };
  }
  return { bg: 'bg-gray-100', text: 'text-gray-900', border: 'border-gray-200' };
};

const MyClass: React.FC = () => {
  const { user } = useAuth();
  const userEmail = localStorage.getItem('userEmail') || user?.email;
  const { studentData, loading: authLoading } = useStudentDataByEmail(userEmail);
  const studentId = studentData?.id;

  const [activeTab, setActiveTab] = useState<TabType>('overview');
  const [timetableView, setTimetableView] = useState<TimetableViewType>('week');
  const [selectedDay, setSelectedDay] = useState<number>(new Date().getDay() || 1); // Default to current day or Monday
  const [loading, setLoading] = useState(true);
  const [classInfo, setClassInfo] = useState<ClassInfo | null>(null);
  const [classmates, setClassmates] = useState<Classmate[]>([]);
  const [timetable, setTimetable] = useState<TimetableSlot[]>([]);
  const [todaySchedule, setTodaySchedule] = useState<TimetableSlot[]>([]);
  const [assignments, setAssignments] = useState<any[]>([]);
  const [stats, setStats] = useState({ total: 0, todo: 0, inProgress: 0, submitted: 0, graded: 0, averageGrade: 0 });
  const [clubs, setClubs] = useState<any[]>([]);
  const [myMemberships, setMyMemberships] = useState<any[]>([]);
  const [myAchievementsData, setMyAchievementsData] = useState<any[]>([]);
  const [myCertificates, setMyCertificates] = useState<any[]>([]);
  const [attendanceData, setAttendanceData] = useState<Record<string, any>>({});
  const [exams, setExams] = useState<StudentExam[]>([]);
  const [results, setResults] = useState<StudentResult[]>([]);
  const [resultStats, setResultStats] = useState({ totalExams: 0, passed: 0, failed: 0, absent: 0, averagePercentage: 0 });
  
  // Assignment upload states
  const [showUploadModal, setShowUploadModal] = useState(false);
  const [selectedAssignment, setSelectedAssignment] = useState<any>(null);
  const [uploadFile, setUploadFile] = useState<File | null>(null);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [isUploading, setIsUploading] = useState(false);

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

        // Fetch clubs data
        const { data: membershipData } = await supabase
          .from('club_memberships_with_students')
          .select('*')
          .eq('student_email', userEmail)
          .eq('status', 'active');

        if (membershipData && membershipData.length > 0) {
          const clubsData = membershipData.map((membership: any) => ({
            club_id: membership.club_id,
            name: membership.club_name,
            category: membership.club_category,
            description: '',
            meeting_day: membership.meeting_day,
            meeting_time: membership.meeting_time,
            location: membership.location,
            mentor_type: membership.mentor_type,
            mentor_name: membership.mentor_name,
            mentor_email: membership.mentor_email,
            mentor_phone: membership.mentor_phone,
            is_active: true,
            capacity: 0,
            members: [],
            membership_id: membership.membership_id,
            enrolled_at: membership.enrolled_at,
            total_sessions_attended: membership.total_sessions_attended,
            total_sessions_held: membership.total_sessions_held,
            attendance_percentage: membership.attendance_percentage,
            performance_score: membership.performance_score
          }));

          const clubsWithMembers = await Promise.all(
            clubsData.map(async (club: any) => {
              const { data: clubDetails } = await supabase
                .from('clubs')
                .select('capacity, description')
                .eq('club_id', club.club_id)
                .single();

              const { count: memberCount } = await supabase
                .from('club_memberships_with_students')
                .select('*', { count: 'exact', head: true })
                .eq('club_id', club.club_id)
                .eq('status', 'active');

              return {
                ...club,
                capacity: clubDetails?.capacity || 30,
                description: clubDetails?.description || '',
                memberCount: memberCount || 0,
                members: []
              };
            })
          );

          setClubs(clubsWithMembers);
          setMyMemberships(membershipData);
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
          setMyAchievementsData(resultsData);
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
          setMyCertificates(certificatesData);
        }

        // Fetch exams and results
        if (studentId) {
          const [examsData, resultsData, statsData] = await Promise.all([
            getStudentExams(studentId),
            getStudentResults(studentId),
            getStudentResultStats(studentId)
          ]);
          setExams(examsData);
          setResults(resultsData);
          setResultStats(statsData);
        }
      } catch (error) {
        console.error('Error fetching class data:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [studentId, authLoading, userEmail]);

  // Get upcoming assignments (next 5 due)
  const upcomingAssignments = useMemo(() => {
    return assignments
      .filter(a => a.status !== 'graded' && new Date(a.due_date) >= new Date())
      .sort((a, b) => new Date(a.due_date).getTime() - new Date(b.due_date).getTime())
      .slice(0, 5);
  }, [assignments]);

  // Group timetable by day
  const timetableByDay = useMemo(() => {
    const grouped: Record<number, TimetableSlot[]> = {};
    timetable.forEach(slot => {
      if (!grouped[slot.day_of_week]) {
        grouped[slot.day_of_week] = [];
      }
      grouped[slot.day_of_week].push(slot);
    });
    return grouped;
  }, [timetable]);

  // Get slot for a specific day and time
  const getSlotForDayAndTime = (day: number, timeSlot: string): TimetableSlot | undefined => {
    const daySlots = timetableByDay[day] || [];
    return daySlots.find(slot => {
      const slotStartHour = parseInt(slot.start_time?.split(':')[0] || '0');
      const timeSlotHour = parseInt(timeSlot.split(':')[0]);
      return slotStartHour === timeSlotHour;
    });
  };

  // Get clubs with enhanced data
  const myClubs = useMemo(() => {
    return clubs.map(club => {
      const attendance = attendanceData[club.club_id] || [];
      const attendancePercentage = club.attendance_percentage || 0;
      
      return {
        ...club,
        avgAttendance: Math.round(attendancePercentage),
        upcomingActivities: [],
        meetingDay: club.meeting_day || 'TBD',
        meetingTime: club.meeting_time || 'TBD',
      };
    });
  }, [clubs, attendanceData]);

  // Get upcoming activities from all clubs
  const upcomingActivities = useMemo(() => {
    const activities: any[] = [];
    myClubs.forEach(club => {
      if (club.meeting_day && club.meeting_time) {
        activities.push({
          title: `${club.name?.charAt(0).toUpperCase() + club.name?.slice(1).toLowerCase() || 'Club'} Meeting`,
          clubName: club.name?.charAt(0).toUpperCase() + club.name?.slice(1).toLowerCase() || 'Club',
          date: new Date(),
          type: 'meeting'
        });
      }
    });
    return activities.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
  }, [myClubs]);

  // Get student achievements from competitions
  const myAchievements = useMemo(() => {
    return myAchievementsData
      .filter(result => result.competitions)
      .map(result => ({
        result_id: result.result_id,
        name: result.competitions.name,
        rank: result.rank,
        score: result.score,
        award: result.award || 'Participant',
        level: result.competitions.level || 'School',
        category: result.competitions.category || 'General',
        date: result.competitions.competition_date,
        status: result.competitions.status,
        notes: result.performance_notes
      }))
      .sort((a, b) => a.rank - b.rank);
  }, [myAchievementsData]);

  const categoryColors: Record<string, string> = {
    robotics: "bg-blue-100 text-blue-700",
    literature: "bg-violet-100 text-violet-700",
    science: "bg-emerald-100 text-emerald-700",
    sports: "bg-rose-100 text-rose-700",
    arts: "bg-pink-100 text-pink-700",
    music: "bg-purple-100 text-purple-700",
    debate: "bg-amber-100 text-amber-700",
    drama: "bg-indigo-100 text-indigo-700",
    technology: "bg-cyan-100 text-cyan-700",
    community: "bg-teal-100 text-teal-700",
  };



  const handleStatusChange = async (assignmentId: string, studentAssignmentId: string, newStatus: string) => {
    try {
      await updateAssignmentStatus(studentAssignmentId, newStatus);
      setAssignments(prev => prev.map(a => 
        a.assignment_id === assignmentId ? { ...a, status: newStatus } : a
      ));
      const updatedStats = await getAssignmentStats(studentId!);
      setStats(updatedStats);
    } catch (error) {
      console.error('Error updating status:', error);
    }
  };

  const formatTime = (time: string) => {
    if (!time) return '';
    const [hours, minutes] = time.split(':');
    const h = parseInt(hours);
    const ampm = h >= 12 ? 'PM' : 'AM';
    const hour12 = h % 12 || 12;
    return `${hour12}:${minutes} ${ampm}`;
  };

  const getDaysRemaining = (dueDate: string) => {
    const today = new Date();
    const due = new Date(dueDate);
    const diffDays = Math.ceil((due.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
    
    if (diffDays < 0) return <span className="text-red-700 font-medium">{Math.abs(diffDays)} days overdue</span>;
    if (diffDays === 0) return <span className="text-orange-600 font-medium">Due Today</span>;
    if (diffDays === 1) return <span className="text-orange-500 font-medium">Tomorrow</span>;
    return <span className="text-gray-600">{diffDays} days</span>;
  };

  const isOverdue = (dueDate: string) => {
    const today = new Date();
    const due = new Date(dueDate);
    return due < today;
  };

  const handleUploadClick = (assignment: any) => {
    setSelectedAssignment(assignment);
    setShowUploadModal(true);
  };

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      // Validate file type (PDF only for now)
      if (file.type !== 'application/pdf') {
        alert('Please select a PDF file only.');
        return;
      }
      
      // Validate file size (max 10MB)
      if (file.size > 10 * 1024 * 1024) {
        alert('File size must be less than 10MB.');
        return;
      }
      
      setUploadFile(file);
    }
  };

  const handleUploadSubmit = async () => {
    if (!uploadFile || !selectedAssignment) return;
    
    setIsUploading(true);
    setUploadProgress(0);
    
    try {
      // Get user token (you may need to adjust this based on your auth implementation)
      const userToken = localStorage.getItem('userToken') || user?.access_token;
      
      // Simulate initial progress
      setUploadProgress(10);
      
      // Upload file to storage
      const uploadResult = await storageApiService.uploadFile(uploadFile, {
        folder: `assignments/${selectedAssignment.assignment_id}`,
        filename: `${studentId}_${Date.now()}_${uploadFile.name}`,
        contentType: uploadFile.type
      }, userToken);
      
      setUploadProgress(70);
      
      // Update assignment submission in database
      await submitAssignmentWithFile(selectedAssignment.student_assignment_id, {
        submission_type: 'file',
        submission_url: uploadResult.url || uploadResult.fileUrl,
        submission_content: uploadFile.name
      });
      
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
      
      // Close modal and reset state
      setTimeout(() => {
        setShowUploadModal(false);
        setSelectedAssignment(null);
        setUploadFile(null);
        setUploadProgress(0);
        setIsUploading(false);
      }, 1000);
      
    } catch (error) {
      console.error('Upload failed:', error);
      alert('Upload failed. Please try again.');
      setIsUploading(false);
      setUploadProgress(0);
    }
  };

  const closeUploadModal = () => {
    if (!isUploading) {
      setShowUploadModal(false);
      setSelectedAssignment(null);
      setUploadFile(null);
      setUploadProgress(0);
    }
  };

  const getStatusBadge = (status: string) => {
    const configs: Record<string, { bg: string; text: string; label: string }> = {
      'todo': { bg: 'bg-gray-100', text: 'text-gray-700', label: 'To Do' },
      'in-progress': { bg: 'bg-blue-100', text: 'text-blue-700', label: 'In Progress' },
      'submitted': { bg: 'bg-purple-100', text: 'text-purple-700', label: 'Submitted' },
      'graded': { bg: 'bg-green-100', text: 'text-green-700', label: 'Graded' }
    };
    const config = configs[status] || configs.todo;
    return (
      <span className={`px-2 py-1 rounded-full text-xs font-medium ${config.bg} ${config.text}`}>
        {config.label}
      </span>
    );
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
    <div className="min-h-screen bg-gray-50 py-6 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 mb-6">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <div>
              <div className="flex items-center gap-3 mb-2">
                <div className="bg-blue-100 rounded-lg p-2">
                  <BookOpen className="w-6 h-6 text-blue-600" />
                </div>
                <h1 className="text-2xl font-bold text-gray-900">{classInfo.name}</h1>
              </div>
              <div className="flex flex-wrap items-center gap-4 text-sm text-gray-600">
                <span className="flex items-center gap-1">
                  <GraduationCap className="w-4 h-4" />
                  Grade {classInfo.grade} - Section {classInfo.section}
                </span>
                <span className="flex items-center gap-1">
                  <Calendar className="w-4 h-4" />
                  {classInfo.academic_year}
                </span>
                <span className="flex items-center gap-1">
                  <Users className="w-4 h-4" />
                  {classInfo.current_students} students
                </span>
              </div>
            </div>
            {classInfo.educator_name && (
              <div className="bg-gray-50 rounded-lg p-4">
                <p className="text-xs text-gray-500 mb-1">Class Teacher</p>
                <p className="font-medium text-gray-900">{classInfo.educator_name}</p>
                {classInfo.educator_email && (
                  <a href={`mailto:${classInfo.educator_email}`} className="text-sm text-blue-600 hover:underline flex items-center gap-1 mt-1">
                    <Mail className="w-3 h-3" />
                    {classInfo.educator_email}
                  </a>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Tabs */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 mb-6">
          <div className="border-b border-gray-200">
            <nav className="flex -mb-px">
              {[
                { id: 'overview', label: 'Overview', icon: Target },
                { id: 'assignments', label: 'Assigments', icon: ClipboardList },
                { id: 'timetable', label: 'Timetable', icon: Calendar },
                { id: 'classmates', label: 'Classmates', icon: Users },
                { id: 'curriculars', label: 'Co-Curriculars', icon: GraduationCap },
                { id: 'exams', label: 'Exams', icon: FileText },
                { id: 'results', label: 'Results', icon: Award }
              ].map(tab => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id as TabType)}
                  className={`flex items-center gap-2 px-6 py-4 text-sm font-medium border-b-2 transition-colors ${
                    activeTab === tab.id
                      ? 'border-blue-600 text-blue-600'
                      : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                  }`}
                >
                  <tab.icon className="w-4 h-4" />
                  {tab.label}
                </button>
              ))}
            </nav>
          </div>

          <div className="p-6">
            {/* Overview Tab */}
            {activeTab === 'overview' && (
              <div className="space-y-6">
                {/* Stats */}
                <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
                  <div className="bg-gray-50 rounded-lg p-4">
                    <p className="text-xs text-gray-500 mb-1">Total Assignments</p>
                    <p className="text-2xl font-bold text-gray-900">{stats.total}</p>
                  </div>
                  <div className="bg-gray-50 rounded-lg p-4">
                    <p className="text-xs text-gray-500 mb-1">To Do</p>
                    <p className="text-2xl font-bold text-gray-900">{stats.todo}</p>
                  </div>
                  <div className="bg-blue-50 rounded-lg p-4">
                    <p className="text-xs text-blue-600 mb-1">In Progress</p>
                    <p className="text-2xl font-bold text-blue-700">{stats.inProgress}</p>
                  </div>
                  <div className="bg-purple-50 rounded-lg p-4">
                    <p className="text-xs text-purple-600 mb-1">Submitted</p>
                    <p className="text-2xl font-bold text-purple-700">{stats.submitted || 0}</p>
                  </div>
                  <div className="bg-green-50 rounded-lg p-4">
                    <p className="text-xs text-green-600 mb-1">Graded</p>
                    <p className="text-2xl font-bold text-green-700">{stats.graded || 0}</p>
                  </div>
                </div>

                <div className="grid md:grid-cols-2 gap-6">
                  {/* Upcoming Assignments */}
                  <div>
                    <div className="flex items-center justify-between mb-4">
                      <h3 className="font-semibold text-gray-900">Upcoming Assignments</h3>
                      <button onClick={() => setActiveTab('assignments')} className="text-sm text-blue-600 hover:underline flex items-center gap-1">
                        View all <ChevronRight className="w-4 h-4" />
                      </button>
                    </div>
                    {upcomingAssignments.length === 0 ? (
                      <div className="bg-gray-50 rounded-lg p-6 text-center">
                        <CheckCircle2 className="w-8 h-8 text-green-500 mx-auto mb-2" />
                        <p className="text-gray-600">No upcoming assignments!</p>
                      </div>
                    ) : (
                      <div className="space-y-3">
                        {upcomingAssignments.map(assignment => (
                          <div key={assignment.assignment_id} className="bg-gray-50 rounded-lg p-4 hover:bg-gray-100 transition-colors">
                            <div className="flex items-start justify-between">
                              <div>
                                <p className="font-medium text-gray-900">{assignment.title}</p>
                                <p className="text-sm text-gray-500">{assignment.course_name}</p>
                              </div>
                              {getStatusBadge(assignment.status)}
                            </div>
                            <div className="flex items-center gap-4 mt-2 text-sm">
                              <span className="flex items-center gap-1 text-gray-500">
                                <Clock className="w-3 h-3" />
                                {getDaysRemaining(assignment.due_date)}
                              </span>
                              <span className="text-gray-400">•</span>
                              <span className="text-gray-500">{assignment.total_points} pts</span>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>

                  {/* Today's Schedule */}
                  <div>
                    <div className="flex items-center justify-between mb-4">
                      <h3 className="font-semibold text-gray-900">Today's Schedule</h3>
                      <button onClick={() => setActiveTab('timetable')} className="text-sm text-blue-600 hover:underline flex items-center gap-1">
                        Full timetable <ChevronRight className="w-4 h-4" />
                      </button>
                    </div>
                    {todaySchedule.length === 0 ? (
                      <div className="bg-gray-50 rounded-xl p-6 text-center border border-gray-100">
                        <Calendar className="w-8 h-8 text-gray-400 mx-auto mb-2" />
                        <p className="text-gray-600">No classes scheduled today</p>
                      </div>
                    ) : (
                      <div className="space-y-3">
                        {todaySchedule.map(slot => (
                          <div 
                            key={slot.id} 
                            className="bg-white rounded-xl border border-gray-100 shadow-sm hover:shadow-md transition-shadow duration-200 p-4 flex items-center"
                          >
                            {/* Period Info */}
                            <div className="min-w-[110px] pr-4 border-r border-gray-200">
                              <p className="text-xs font-medium text-gray-400 uppercase tracking-wide mb-1">
                                Period {slot.period_number}
                              </p>
                              <p className="text-sm font-medium text-gray-700">
                                {formatTime(slot.start_time)}
                              </p>
                            </div>
                            
                            {/* Subject & Teacher */}
                            <div className="flex-1 pl-4">
                              <p className="font-semibold text-gray-900">{slot.subject_name}</p>
                              {slot.educator_name && (
                                <p className="text-sm text-gray-500">{slot.educator_name}</p>
                              )}
                            </div>
                            
                            {/* Room Badge */}
                            {slot.room_number && (
                              <span className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-gray-50 text-gray-600 text-sm font-medium rounded-full border border-gray-200">
                                <MapPin className="w-3.5 h-3.5 text-blue-500" />
                                Room {slot.room_number}
                              </span>
                            )}
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            )}

            {/* Assignments Tab */}
            {activeTab === 'assignments' && (
              <div>
                {assignments.length === 0 ? (
                  <div className="text-center py-12">
                    <FileText className="w-12 h-12 text-gray-300 mx-auto mb-4" />
                    <h3 className="text-lg font-medium text-gray-900 mb-2">No Assignments Yet</h3>
                    <p className="text-gray-500">Your assignments will appear here when assigned.</p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {assignments.map(assignment => {
                      const overdueStatus = isOverdue(assignment.due_date);
                      
                      // Elegant overdue styling - sophisticated red accent
                      const cardBgClass = overdueStatus
                        ? 'bg-gradient-to-r from-red-50 to-white border-l-4 border-l-red-400 border-t border-r border-b border-red-100'
                        : 'bg-white border border-gray-200 hover:border-gray-300';
                      
                      const cardShadow = overdueStatus ? '' : 'hover:shadow-sm';
                      
                      return (
                        <div key={assignment.assignment_id} className={`rounded-lg p-4 transition-all duration-200 ${cardBgClass} ${cardShadow}`}>
                          <div className="flex items-start justify-between mb-3">
                            <div className="flex-1">
                              <div className="flex items-center gap-2 mb-1">
                                <h4 className="font-medium text-gray-900">{assignment.title}</h4>
                                {overdueStatus && (
                                  <span className="px-2 py-0.5 rounded text-xs font-semibold bg-red-500 text-white">
                                    OVERDUE
                                  </span>
                                )}
                              </div>
                              <p className="text-sm text-gray-500">{assignment.course_name}</p>
                            </div>
                            <div className="flex items-center gap-2">
                              {getStatusBadge(assignment.status)}
                              {assignment.status !== 'submitted' && assignment.status !== 'graded' && (
                                <select
                                  value={assignment.status}
                                  onChange={(e) => handleStatusChange(assignment.assignment_id, assignment.student_assignment_id, e.target.value)}
                                  className="text-xs border border-gray-200 rounded px-2 py-1 bg-white"
                                >
                                  <option value="todo">To Do</option>
                                  <option value="in-progress">In Progress</option>
                                  <option value="submitted">Submitted</option>
                                </select>
                              )}
                            </div>
                          </div>
                          
                          {assignment.description && (
                            <p className="text-sm text-gray-600 mb-3 line-clamp-2">{assignment.description}</p>
                          )}
                          
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-4 text-sm text-gray-500">
                              <span className="flex items-center gap-1">
                                <Calendar className="w-4 h-4" />
                                Due: {new Date(assignment.due_date).toLocaleDateString()}
                              </span>
                              <span>{getDaysRemaining(assignment.due_date)}</span>
                              <span className="flex items-center gap-1">
                                <Target className="w-4 h-4" />
                                {assignment.total_points} points
                              </span>
                              {assignment.grade_percentage && (
                                <span className="text-green-600 font-medium">
                                  Grade: {assignment.grade_percentage}%
                                </span>
                              )}
                            </div>
                            
                            {/* Upload Button */}
                            {assignment.status !== 'submitted' && assignment.status !== 'graded' && (
                              <button
                                onClick={() => handleUploadClick(assignment)}
                                className="flex items-center gap-2 px-3 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm font-medium"
                              >
                                <Upload className="w-4 h-4" />
                                Upload PDF
                              </button>
                            )}
                            
                            {/* Submission Info */}
                            {assignment.submission_date && (
                              <div className="flex items-center gap-2 text-sm text-green-600">
                                <CheckCircle2 className="w-4 h-4" />
                                <span>Submitted on {new Date(assignment.submission_date).toLocaleDateString()}</span>
                              </div>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            )}

            {/* Timetable Tab */}
            {activeTab === 'timetable' && (
              <div>
                {timetable.length === 0 ? (
                  <div className="text-center py-12">
                    <Calendar className="w-12 h-12 text-gray-300 mx-auto mb-4" />
                    <h3 className="text-lg font-medium text-gray-900 mb-2">No Timetable Available</h3>
                    <p className="text-gray-500">Your class timetable hasn't been set up yet.</p>
                  </div>
                ) : (
                  <div>
                    {/* Timetable Header with View Toggle */}
                    <div className="flex items-center justify-between mb-6">
                      <h2 className="text-2xl font-bold text-gray-900">Timetable</h2>
                      <div className="flex items-center gap-1 bg-gray-100 rounded-lg p-1">
                        <button
                          onClick={() => setTimetableView('week')}
                          className={`px-4 py-2 text-sm font-medium rounded-md transition-all ${
                            timetableView === 'week'
                              ? 'bg-white text-gray-900 shadow-sm'
                              : 'text-gray-600 hover:text-gray-900'
                          }`}
                        >
                          Week
                        </button>
                        <button
                          onClick={() => setTimetableView('day')}
                          className={`px-4 py-2 text-sm font-medium rounded-md transition-all ${
                            timetableView === 'day'
                              ? 'bg-white text-gray-900 shadow-sm'
                              : 'text-gray-600 hover:text-gray-900'
                          }`}
                        >
                          Day
                        </button>
                      </div>
                    </div>

                    {/* Day Selector for Day View */}
                    {timetableView === 'day' && (
                      <div className="flex items-center gap-2 mb-6 overflow-x-auto pb-2">
                        {[1, 2, 3, 4, 5, 6].map(day => (
                          <button
                            key={day}
                            onClick={() => setSelectedDay(day)}
                            className={`px-4 py-2 text-sm font-medium rounded-lg transition-all whitespace-nowrap ${
                              selectedDay === day
                                ? 'bg-blue-600 text-white'
                                : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                            }`}
                          >
                            {DAYS[day]}
                          </button>
                        ))}
                      </div>
                    )}

                    {/* Week View - Grid Layout */}
                    {timetableView === 'week' && (
                      <div className="overflow-x-auto">
                        <div className="min-w-[800px]">
                          {/* Grid Header - Days */}
                          <div className="grid grid-cols-[80px_repeat(5,1fr)] gap-1 mb-1">
                            <div className="h-12"></div>
                            {[1, 2, 3, 4, 5].map(day => (
                              <div
                                key={day}
                                className="h-12 flex items-center justify-center font-semibold text-gray-700 bg-gray-50 rounded-t-lg"
                              >
                                {SHORT_DAYS[day]}
                              </div>
                            ))}
                          </div>

                          {/* Grid Body - Time Slots */}
                          <div className="grid grid-cols-[80px_repeat(5,1fr)] gap-1">
                            {TIME_SLOTS.map(timeSlot => (
                              <React.Fragment key={timeSlot}>
                                {/* Time Label */}
                                <div className="h-20 flex items-start justify-end pr-3 pt-1">
                                  <span className="text-sm text-gray-500 font-medium">{timeSlot}</span>
                                </div>
                                
                                {/* Day Cells */}
                                {[1, 2, 3, 4, 5].map(day => {
                                  const slot = getSlotForDayAndTime(day, timeSlot);
                                  const colors = slot ? getSubjectColor(slot.subject_name) : null;
                                  
                                  return (
                                    <div
                                      key={`${day}-${timeSlot}`}
                                      className="h-20 relative"
                                    >
                                      {slot ? (
                                        <div
                                          className={`absolute inset-0.5 rounded-lg p-2 ${colors?.bg} ${colors?.border} border transition-transform hover:scale-[1.02] hover:shadow-md cursor-pointer`}
                                        >
                                          <p className={`font-bold text-sm ${colors?.text} truncate`}>
                                            {slot.subject_name}
                                          </p>
                                          {slot.room_number && (
                                            <p className={`text-xs ${colors?.text} opacity-70 mt-0.5`}>
                                              Room {slot.room_number}
                                            </p>
                                          )}
                                        </div>
                                      ) : (
                                        <div className="absolute inset-0.5 rounded-lg bg-gray-50/50 border border-gray-100"></div>
                                      )}
                                    </div>
                                  );
                                })}
                              </React.Fragment>
                            ))}
                          </div>
                        </div>
                      </div>
                    )}

                    {/* Day View - List Layout */}
                    {timetableView === 'day' && (
                      <div>
                        <h3 className="text-xl font-semibold text-gray-900 mb-4">{DAYS[selectedDay]}</h3>
                        {(!timetableByDay[selectedDay] || timetableByDay[selectedDay].length === 0) ? (
                          <div className="text-center py-12 bg-gray-50 rounded-xl">
                            <Calendar className="w-10 h-10 text-gray-400 mx-auto mb-3" />
                            <p className="text-gray-600">No classes scheduled for {DAYS[selectedDay]}</p>
                          </div>
                        ) : (
                          <div className="space-y-3">
                            {timetableByDay[selectedDay]
                              .sort((a, b) => a.period_number - b.period_number)
                              .map(slot => {
                                const colors = getSubjectColor(slot.subject_name);
                                return (
                                  <div
                                    key={slot.id}
                                    className={`rounded-xl p-4 flex items-center gap-4 ${colors.bg} ${colors.border} border`}
                                  >
                                    {/* Time */}
                                    <div className="min-w-[120px] pr-4 border-r border-gray-200/50">
                                      <p className="text-xs text-gray-500 uppercase tracking-wide mb-1">
                                        Period {slot.period_number}
                                      </p>
                                      <p className={`text-sm font-semibold ${colors.text}`}>
                                        {formatTime(slot.start_time)}
                                      </p>
                                      <p className={`text-sm font-semibold ${colors.text}`}>
                                        {formatTime(slot.end_time)}
                                      </p>
                                    </div>
                                    
                                    {/* Subject */}
                                    <div className="flex-1">
                                      <p className={`font-bold text-lg ${colors.text}`}>{slot.subject_name}</p>
                                      {slot.educator_name && (
                                        <p className="text-sm text-gray-600">{slot.educator_name}</p>
                                      )}
                                    </div>
                                    
                                    {/* Room */}
                                    {slot.room_number && (
                                      <div className="flex items-center gap-1.5 px-3 py-1.5 bg-white/60 rounded-full">
                                        <MapPin className="w-4 h-4 text-gray-600" />
                                        <span className="text-sm font-medium text-gray-700">Room {slot.room_number}</span>
                                      </div>
                                    )}
                                  </div>
                                );
                              })}
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                )}
              </div>
            )}

            {/* Classmates Tab */}
            {activeTab === 'classmates' && (
              <div>
                <div className="flex items-center justify-between mb-4">
                  <p className="text-sm text-gray-500">{classmates.length} classmates</p>
                </div>
                {classmates.length === 0 ? (
                  <div className="text-center py-12">
                    <Users className="w-12 h-12 text-gray-300 mx-auto mb-4" />
                    <h3 className="text-lg font-medium text-gray-900 mb-2">No Classmates Yet</h3>
                    <p className="text-gray-500">You're the first one in this class!</p>
                  </div>
                ) : (
                  <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
                    {classmates.map(classmate => (
                      <div key={classmate.id} className="bg-gray-50 rounded-lg p-4 flex items-center gap-3">
                        <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                          {classmate.profilePicture ? (
                            <img src={classmate.profilePicture} alt={classmate.name} className="w-10 h-10 rounded-full object-cover" />
                          ) : (
                            <span className="text-blue-600 font-medium">
                              {classmate.name?.charAt(0)?.toUpperCase() || '?'}
                            </span>
                          )}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="font-medium text-gray-900 truncate">{classmate.name}</p>
                          <p className="text-sm text-gray-500 truncate">{classmate.email}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* Co-Curriculars Tab */}
            {activeTab === 'curriculars' && (
              <div className="space-y-8">


                {/* Key Metrics */}
                <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                  <div className="bg-white border border-gray-200 rounded-lg p-6 hover:border-blue-300 transition-colors">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm font-medium text-gray-600 mb-1">Active Clubs</p>
                        <p className="text-3xl font-bold text-black">{myClubs.length}</p>
                      </div>
                      <div className="w-12 h-12 bg-blue-50 rounded-lg flex items-center justify-center">
                        <Users className="w-6 h-6 text-blue-600" />
                      </div>
                    </div>
                  </div>

                  <div className="bg-white border border-gray-200 rounded-lg p-6 hover:border-blue-300 transition-colors">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm font-medium text-gray-600 mb-1">Upcoming Events</p>
                        <p className="text-3xl font-bold text-black">{upcomingActivities.length}</p>
                      </div>
                      <div className="w-12 h-12 bg-blue-50 rounded-lg flex items-center justify-center">
                        <Calendar className="w-6 h-6 text-blue-600" />
                      </div>
                    </div>
                  </div>

                  <div className="bg-white border border-gray-200 rounded-lg p-6 hover:border-blue-300 transition-colors">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm font-medium text-gray-600 mb-1">Achievements</p>
                        <p className="text-3xl font-bold text-black">{myAchievements.length}</p>
                      </div>
                      <div className="w-12 h-12 bg-blue-50 rounded-lg flex items-center justify-center">
                        <Trophy className="w-6 h-6 text-blue-600" />
                      </div>
                    </div>
                  </div>

                  <div className="bg-white border border-gray-200 rounded-lg p-6 hover:border-blue-300 transition-colors">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm font-medium text-gray-600 mb-1">Avg Attendance</p>
                        <p className="text-3xl font-bold text-black">
                          {myMemberships.length > 0
                            ? Math.round(
                                myMemberships.reduce((sum, m) => sum + (m.attendance_percentage || 0), 0) /
                                  myMemberships.length
                              )
                            : 0}
                          %
                        </p>
                      </div>
                      <div className="w-12 h-12 bg-blue-50 rounded-lg flex items-center justify-center">
                        <TrendingUp className="w-6 h-6 text-blue-600" />
                      </div>
                    </div>
                  </div>
                </div>

                {/* Main Content Grid */}
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                  {/* My Clubs Section */}
                  <div className="lg:col-span-2">
                    <div className="flex items-center justify-between mb-6">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center">
                          <Activity className="w-5 h-5 text-blue-600" />
                        </div>
                        <h3 className="text-xl font-bold text-black">My Clubs</h3>
                      </div>
                      <div className="flex items-center gap-2 text-sm text-gray-600 bg-gray-100 px-3 py-1 rounded-full">
                        <span className="w-2 h-2 bg-blue-600 rounded-full"></span>
                        {myClubs.length} active
                      </div>
                    </div>

                    {myClubs.length === 0 ? (
                      <div className="bg-white border border-gray-200 rounded-lg p-12 text-center">
                        <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                          <Users className="w-8 h-8 text-gray-400" />
                        </div>
                        <h3 className="text-lg font-semibold text-black mb-2">No Clubs Joined</h3>
                        <p className="text-gray-600 max-w-sm mx-auto">
                          You haven't joined any clubs yet. Explore available clubs to start your co-curricular journey.
                        </p>
                      </div>
                    ) : (
                      <div className="space-y-6">
                        {myClubs.map((club) => (
                          <div
                            key={club.club_id}
                            className="bg-white border border-gray-200 rounded-lg p-6 hover:border-blue-300 hover:shadow-sm transition-all duration-200"
                          >
                            {/* Club Header */}
                            <div className="flex items-start justify-between mb-4">
                              <div className="flex-1">
                                <div className="flex items-center gap-3 mb-2">
                                  <h4 className="text-lg font-bold text-black">
                                    {club.name?.charAt(0).toUpperCase() + club.name?.slice(1).toLowerCase() || 'Unnamed Club'}
                                  </h4>
                                  <span className="px-3 py-1 bg-blue-50 text-blue-700 rounded-full text-xs font-medium border border-blue-200">
                                    {club.category?.charAt(0).toUpperCase() + club.category?.slice(1).toLowerCase() || 'General'}
                                  </span>
                                </div>
                                <p className="text-gray-600 text-sm leading-relaxed">
                                  {club.description || 'No description available for this club.'}
                                </p>
                              </div>
                            </div>

                            {/* Club Details Grid */}
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-4">
                              <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg border border-gray-100">
                                <div className="w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center">
                                  <Calendar className="w-4 h-4 text-blue-600" />
                                </div>
                                <div>
                                  <p className="text-xs font-medium text-gray-500 uppercase tracking-wide">Meeting Day</p>
                                  <p className="text-sm font-semibold text-black">
                                    {club.meeting_day?.charAt(0).toUpperCase() + club.meeting_day?.slice(1).toLowerCase() || 'TBD'}
                                  </p>
                                </div>
                              </div>

                              <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg border border-gray-100">
                                <div className="w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center">
                                  <Clock className="w-4 h-4 text-blue-600" />
                                </div>
                                <div>
                                  <p className="text-xs font-medium text-gray-500 uppercase tracking-wide">Time</p>
                                  <p className="text-sm font-semibold text-black">{club.meeting_time || 'TBD'}</p>
                                </div>
                              </div>

                              <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg border border-gray-100">
                                <div className="w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center">
                                  <MapPin className="w-4 h-4 text-blue-600" />
                                </div>
                                <div>
                                  <p className="text-xs font-medium text-gray-500 uppercase tracking-wide">Location</p>
                                  <p className="text-sm font-semibold text-black">
                                    {club.location?.charAt(0).toUpperCase() + club.location?.slice(1).toLowerCase() || 'TBD'}
                                  </p>
                                </div>
                              </div>

                              <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg border border-gray-100">
                                <div className="w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center">
                                  <Users className="w-4 h-4 text-blue-600" />
                                </div>
                                <div>
                                  <p className="text-xs font-medium text-gray-500 uppercase tracking-wide">Members</p>
                                  <p className="text-sm font-semibold text-black">
                                    {club.memberCount || 0} / {club.capacity || 30}
                                  </p>
                                </div>
                              </div>
                            </div>

                            {/* Club Footer */}
                            <div className="flex items-center justify-between pt-4 border-t border-gray-100">
                              <div className="flex items-center gap-3">
                                <div className="w-8 h-8 bg-gray-100 rounded-full flex items-center justify-center">
                                  <span className="text-xs font-bold text-gray-600">
                                    {club.mentor_name?.charAt(0) || 'M'}
                                  </span>
                                </div>
                                <div>
                                  <p className="text-xs font-medium text-gray-500">Mentor</p>
                                  <p className="text-sm font-semibold text-black">
                                    {club.mentor_name || (club.mentor_type === 'educator' ? 'Educator' : 'School Admin')}
                                  </p>
                                </div>
                              </div>
                              <div className="flex items-center gap-2 bg-blue-50 px-3 py-2 rounded-lg border border-blue-200">
                                <TrendingUp className="w-4 h-4 text-blue-600" />
                                <span className="text-sm font-bold text-blue-700">
                                  {club.avgAttendance || 0}%
                                </span>
                                <span className="text-xs text-gray-600">attendance</span>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>

                  {/* Sidebar */}
                  <div className="space-y-6">
                    {/* Upcoming Activities */}
                    <div className="bg-white border border-gray-200 rounded-lg p-6">
                      <div className="flex items-center gap-3 mb-6">
                        <div className="w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center">
                          <Calendar className="w-5 h-5 text-blue-600" />
                        </div>
                        <h3 className="text-lg font-bold text-black">Upcoming Activities</h3>
                      </div>
                      
                      {upcomingActivities.length === 0 ? (
                        <div className="text-center py-8">
                          <div className="w-12 h-12 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-3">
                            <Calendar className="w-6 h-6 text-gray-400" />
                          </div>
                          <p className="text-gray-600 text-sm">No upcoming activities</p>
                        </div>
                      ) : (
                        <div className="space-y-3">
                          {upcomingActivities.slice(0, 5).map((activity, idx) => (
                            <div
                              key={idx}
                              className="bg-gray-50 border border-gray-100 rounded-lg p-4 border-l-4 border-l-blue-500"
                            >
                              <p className="font-semibold text-black text-sm mb-1">
                                {activity.title?.charAt(0).toUpperCase() + activity.title?.slice(1) || 'Activity'}
                              </p>
                              <p className="text-xs text-gray-600 mb-2">
                                {activity.clubName?.charAt(0).toUpperCase() + activity.clubName?.slice(1).toLowerCase() || 'Club'}
                              </p>
                              <p className="text-xs text-gray-500">
                                {new Date(activity.date).toLocaleDateString("en-US", {
                                  month: "short",
                                  day: "numeric",
                                  year: "numeric",
                                })}
                              </p>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>

                    {/* Achievements & Certificates */}
                    <div className="bg-white border border-gray-200 rounded-lg p-6">
                      <div className="flex items-center justify-between mb-4">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center">
                            <Award className="w-5 h-5 text-blue-600" />
                          </div>
                          <h3 className="text-lg font-bold text-gray-900">Certificates</h3>
                        </div>
                        {myCertificates.length > 0 && (
                          <span className="px-2 py-1 bg-blue-50 text-blue-700 rounded-full text-xs font-medium">
                            {myCertificates.length}
                          </span>
                        )}
                      </div>
                      
                      {myCertificates.length === 0 ? (
                        <div className="text-center py-8">
                          <div className="w-12 h-12 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-3">
                            <Award className="w-6 h-6 text-gray-400" />
                          </div>
                          <p className="text-gray-600 text-sm">No certificates earned yet</p>
                        </div>
                      ) : (
                        <div className="space-y-3 max-h-96 overflow-y-auto pr-1">
                          {myCertificates.map((cert, index) => (
                            <div key={cert.certificate_id}>
                              <div className="border border-gray-200 rounded-xl p-4 hover:border-blue-300 hover:shadow-sm transition-all duration-200 bg-white">
                                {/* Header with icon and title */}
                                <div className="flex items-center gap-3 mb-2">
                                  <div className="w-7 h-7 bg-blue-100 rounded-lg flex items-center justify-center flex-shrink-0">
                                    <Award className="w-4 h-4 text-blue-600" />
                                  </div>
                                  <div className="flex-1 min-w-0">
                                    <h4 className="font-semibold text-gray-900 text-sm leading-tight truncate">
                                      {cert.title?.charAt(0).toUpperCase() + cert.title?.slice(1) || 'Certificate'}
                                    </h4>
                                  </div>
                                </div>
                                
                                {/* Description */}
                                <p className="text-xs text-gray-600 mb-3 pl-10 leading-relaxed line-clamp-2">
                                  {cert.description}
                                </p>
                                
                                {/* Tags and metadata */}
                                <div className="pl-10 space-y-2">
                                  <div className="flex items-center gap-2 flex-wrap">
                                    <span className="px-2 py-1 bg-blue-50 text-blue-700 rounded-md text-xs font-medium capitalize">
                                      {cert.certificate_type?.replace('_', ' ') || 'Competition'}
                                    </span>
                                    <span className="text-xs text-gray-500">
                                      {new Date(cert.issued_date).toLocaleDateString('en-US', {
                                        month: 'short',
                                        year: 'numeric'
                                      })}
                                    </span>
                                  </div>
                                  
                                  {/* Rank and score */}
                                  {cert.metadata?.rank && (
                                    <div className="flex items-center gap-3">
                                      <div className="flex items-center gap-1">
                                        <span className="text-xs text-gray-500">Rank:</span>
                                        <span className="text-xs font-bold text-blue-700 bg-blue-50 px-2 py-1 rounded-md">
                                          #{cert.metadata.rank}
                                        </span>
                                      </div>
                                      {cert.metadata?.score && (
                                        <div className="flex items-center gap-1">
                                          <span className="text-xs text-gray-500">Score:</span>
                                          <span className="text-xs font-medium text-gray-700 bg-gray-100 px-2 py-1 rounded-md">
                                            {cert.metadata.score}
                                          </span>
                                        </div>
                                      )}
                                    </div>
                                  )}
                                </div>
                              </div>
                              
                              {/* Subtle separator between certificates (except last one) */}
                              {index < myCertificates.length - 1 && (
                                <div className="flex justify-center my-2">
                                  <div className="w-8 h-px bg-gray-200"></div>
                                </div>
                              )}
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Exams Tab */}
            {activeTab === 'exams' && (
              <div>
                <div className="mb-6">
                  <h2 className="text-2xl font-bold text-gray-900 mb-2">Exam Schedule</h2>
                  <p className="text-gray-600">View your upcoming and past examinations</p>
                </div>

                {exams.length === 0 ? (
                  <div className="text-center py-12">
                    <FileText className="w-12 h-12 text-gray-300 mx-auto mb-4" />
                    <h3 className="text-lg font-medium text-gray-900 mb-2">No Exams Scheduled</h3>
                    <p className="text-gray-500">Your exam schedule will appear here when available.</p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {/* Upcoming Exams */}
                    {exams.filter(exam => new Date(exam.exam_date) >= new Date()).length > 0 && (
                      <div>
                        <h3 className="text-lg font-semibold text-gray-900 mb-3 flex items-center gap-2">
                          <Clock className="w-5 h-5 text-blue-600" />
                          Upcoming Exams
                        </h3>
                        <div className="space-y-3">
                          {exams
                            .filter(exam => new Date(exam.exam_date) >= new Date())
                            .map(exam => (
                              <div
                                key={exam.id}
                                className="bg-white border-2 border-blue-200 rounded-lg p-5 hover:border-blue-300 hover:shadow-md transition-all"
                              >
                                <div className="flex items-start justify-between mb-3">
                                  <div className="flex-1">
                                    <div className="flex items-center gap-2 mb-1">
                                      <h4 className="font-bold text-gray-900 text-lg">{exam.subject_name}</h4>
                                      <span className="px-2 py-1 bg-blue-100 text-blue-700 rounded-full text-xs font-medium">
                                        {exam.type}
                                      </span>
                                    </div>
                                    <p className="text-sm text-gray-500">{exam.assessment_code}</p>
                                  </div>
                                  <div className="text-right">
                                    <p className="text-sm font-medium text-gray-600">Total Marks</p>
                                    <p className="text-2xl font-bold text-blue-600">{exam.total_marks}</p>
                                  </div>
                                </div>

                                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-3">
                                  <div className="flex items-center gap-2">
                                    <Calendar className="w-4 h-4 text-gray-400" />
                                    <div>
                                      <p className="text-xs text-gray-500">Date</p>
                                      <p className="text-sm font-medium text-gray-900">
                                        {new Date(exam.exam_date).toLocaleDateString('en-US', {
                                          month: 'short',
                                          day: 'numeric',
                                          year: 'numeric'
                                        })}
                                      </p>
                                    </div>
                                  </div>

                                  <div className="flex items-center gap-2">
                                    <Clock className="w-4 h-4 text-gray-400" />
                                    <div>
                                      <p className="text-xs text-gray-500">Time</p>
                                      <p className="text-sm font-medium text-gray-900">
                                        {exam.start_time} - {exam.end_time}
                                      </p>
                                    </div>
                                  </div>

                                  <div className="flex items-center gap-2">
                                    <Clock className="w-4 h-4 text-gray-400" />
                                    <div>
                                      <p className="text-xs text-gray-500">Duration</p>
                                      <p className="text-sm font-medium text-gray-900">{exam.duration_minutes} mins</p>
                                    </div>
                                  </div>

                                  <div className="flex items-center gap-2">
                                    <MapPin className="w-4 h-4 text-gray-400" />
                                    <div>
                                      <p className="text-xs text-gray-500">Room</p>
                                      <p className="text-sm font-medium text-gray-900">{exam.room || 'TBA'}</p>
                                    </div>
                                  </div>
                                </div>

                                {exam.instructions && (
                                  <div className="bg-blue-50 rounded-lg p-3 border border-blue-100">
                                    <p className="text-xs font-medium text-blue-900 mb-1">Instructions:</p>
                                    <p className="text-sm text-blue-800">{exam.instructions}</p>
                                  </div>
                                )}
                              </div>
                            ))}
                        </div>
                      </div>
                    )}

                    {/* Past Exams */}
                    {exams.filter(exam => new Date(exam.exam_date) < new Date()).length > 0 && (
                      <div className="mt-8">
                        <h3 className="text-lg font-semibold text-gray-900 mb-3 flex items-center gap-2">
                          <CheckCircle2 className="w-5 h-5 text-gray-600" />
                          Past Exams
                        </h3>
                        <div className="space-y-3">
                          {exams
                            .filter(exam => new Date(exam.exam_date) < new Date())
                            .map(exam => (
                              <div
                                key={exam.id}
                                className="bg-gray-50 border border-gray-200 rounded-lg p-4 hover:bg-gray-100 transition-colors"
                              >
                                <div className="flex items-center justify-between">
                                  <div className="flex-1">
                                    <div className="flex items-center gap-2 mb-1">
                                      <h4 className="font-semibold text-gray-900">{exam.subject_name}</h4>
                                      <span className="px-2 py-1 bg-gray-200 text-gray-700 rounded-full text-xs font-medium">
                                        {exam.type}
                                      </span>
                                    </div>
                                    <div className="flex items-center gap-4 text-sm text-gray-600">
                                      <span className="flex items-center gap-1">
                                        <Calendar className="w-3 h-3" />
                                        {new Date(exam.exam_date).toLocaleDateString()}
                                      </span>
                                      <span>{exam.room}</span>
                                    </div>
                                  </div>
                                  <div className="text-right">
                                    <p className="text-sm text-gray-500">Total Marks</p>
                                    <p className="text-lg font-bold text-gray-700">{exam.total_marks}</p>
                                  </div>
                                </div>
                              </div>
                            ))}
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </div>
            )}

            {/* Results Tab */}
            {activeTab === 'results' && (
              <div>
                <div className="mb-6">
                  <h2 className="text-2xl font-bold text-gray-900 mb-2">Exam Results</h2>
                  <p className="text-gray-600">View your published examination results</p>
                </div>

                {/* Stats Cards */}
                <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-6">
                  <div className="bg-white border border-gray-200 rounded-lg p-4">
                    <p className="text-xs text-gray-500 mb-1">Total Exams</p>
                    <p className="text-2xl font-bold text-gray-900">{resultStats.totalExams}</p>
                  </div>
                  <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                    <p className="text-xs text-green-600 mb-1">Passed</p>
                    <p className="text-2xl font-bold text-green-700">{resultStats.passed}</p>
                  </div>
                  <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                    <p className="text-xs text-red-600 mb-1">Failed</p>
                    <p className="text-2xl font-bold text-red-700">{resultStats.failed}</p>
                  </div>
                  <div className="bg-orange-50 border border-orange-200 rounded-lg p-4">
                    <p className="text-xs text-orange-600 mb-1">Absent</p>
                    <p className="text-2xl font-bold text-orange-700">{resultStats.absent}</p>
                  </div>
                  <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                    <p className="text-xs text-blue-600 mb-1">Average</p>
                    <p className="text-2xl font-bold text-blue-700">{resultStats.averagePercentage}%</p>
                  </div>
                </div>

                {results.length === 0 ? (
                  <div className="text-center py-12">
                    <Award className="w-12 h-12 text-gray-300 mx-auto mb-4" />
                    <h3 className="text-lg font-medium text-gray-900 mb-2">No Results Published</h3>
                    <p className="text-gray-500">Your exam results will appear here once they are published.</p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {results.map(result => {
                      const isPassed = !result.is_absent && !result.is_exempt && 
                        result.marks_obtained !== undefined && 
                        result.marks_obtained >= result.pass_marks;
                      const isFailed = !result.is_absent && !result.is_exempt && 
                        result.marks_obtained !== undefined && 
                        result.marks_obtained < result.pass_marks;

                      return (
                        <div
                          key={result.id}
                          className={`border-2 rounded-lg p-5 transition-all ${
                            result.is_absent
                              ? 'bg-orange-50 border-orange-200'
                              : isPassed
                              ? 'bg-green-50 border-green-200'
                              : isFailed
                              ? 'bg-red-50 border-red-200'
                              : 'bg-gray-50 border-gray-200'
                          }`}
                        >
                          <div className="flex items-start justify-between mb-4">
                            <div className="flex-1">
                              <div className="flex items-center gap-2 mb-1">
                                <h4 className="font-bold text-gray-900 text-lg">{result.subject_name}</h4>
                                <span className="px-2 py-1 bg-white/60 text-gray-700 rounded-full text-xs font-medium border border-gray-300">
                                  {result.type}
                                </span>
                                {result.is_absent && (
                                  <span className="px-2 py-1 bg-orange-200 text-orange-800 rounded-full text-xs font-medium">
                                    Absent
                                  </span>
                                )}
                                {result.is_exempt && (
                                  <span className="px-2 py-1 bg-blue-200 text-blue-800 rounded-full text-xs font-medium">
                                    Exempt
                                  </span>
                                )}
                              </div>
                              <p className="text-sm text-gray-600">{result.assessment_code}</p>
                              {result.exam_date && (
                                <p className="text-xs text-gray-500 mt-1">
                                  {new Date(result.exam_date).toLocaleDateString('en-US', {
                                    month: 'long',
                                    day: 'numeric',
                                    year: 'numeric'
                                  })}
                                </p>
                              )}
                            </div>

                            {!result.is_absent && !result.is_exempt && (
                              <div className="text-right">
                                <p className="text-sm font-medium text-gray-600 mb-1">Score</p>
                                <div className="flex items-baseline gap-1">
                                  <p className={`text-3xl font-bold ${
                                    isPassed ? 'text-green-700' : isFailed ? 'text-red-700' : 'text-gray-700'
                                  }`}>
                                    {result.marks_obtained}
                                  </p>
                                  <p className="text-lg text-gray-500">/ {result.total_marks}</p>
                                </div>
                              </div>
                            )}
                          </div>

                          {!result.is_absent && !result.is_exempt && (
                            <div className="grid grid-cols-3 gap-4 mb-3">
                              <div className="bg-white/60 rounded-lg p-3 border border-gray-200">
                                <p className="text-xs text-gray-600 mb-1">Percentage</p>
                                <p className={`text-xl font-bold ${
                                  isPassed ? 'text-green-700' : isFailed ? 'text-red-700' : 'text-gray-700'
                                }`}>
                                  {result.percentage?.toFixed(1)}%
                                </p>
                              </div>

                              <div className="bg-white/60 rounded-lg p-3 border border-gray-200">
                                <p className="text-xs text-gray-600 mb-1">Grade</p>
                                <p className={`text-xl font-bold ${
                                  isPassed ? 'text-green-700' : isFailed ? 'text-red-700' : 'text-gray-700'
                                }`}>
                                  {result.grade || 'N/A'}
                                </p>
                              </div>

                              <div className="bg-white/60 rounded-lg p-3 border border-gray-200">
                                <p className="text-xs text-gray-600 mb-1">Pass Marks</p>
                                <p className="text-xl font-bold text-gray-700">{result.pass_marks}</p>
                              </div>
                            </div>
                          )}

                          {result.remarks && (
                            <div className="bg-white/60 rounded-lg p-3 border border-gray-200">
                              <p className="text-xs font-medium text-gray-700 mb-1">Remarks:</p>
                              <p className="text-sm text-gray-600">{result.remarks}</p>
                            </div>
                          )}

                          {!result.is_absent && !result.is_exempt && (
                            <div className="mt-3 flex items-center justify-between">
                              <div className="flex items-center gap-2">
                                {isPassed ? (
                                  <>
                                    <CheckCircle2 className="w-5 h-5 text-green-600" />
                                    <span className="text-sm font-medium text-green-700">Passed</span>
                                  </>
                                ) : isFailed ? (
                                  <>
                                    <AlertCircle className="w-5 h-5 text-red-600" />
                                    <span className="text-sm font-medium text-red-700">Failed</span>
                                  </>
                                ) : null}
                              </div>
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Upload Modal */}
      {showUploadModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-xl max-w-md w-full">
            {/* Modal Header */}
            <div className="flex items-center justify-between p-6 border-b border-gray-200">
              <div>
                <h3 className="text-lg font-semibold text-gray-900">Upload Assignment</h3>
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
              {!uploadFile ? (
                /* File Selection */
                <div className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center hover:border-blue-400 transition-colors">
                  <input
                    type="file"
                    accept=".pdf"
                    onChange={handleFileSelect}
                    className="hidden"
                    id="assignment-upload"
                    disabled={isUploading}
                  />
                  <label htmlFor="assignment-upload" className="cursor-pointer">
                    <Upload className="w-12 h-12 text-gray-400 mx-auto mb-3" />
                    <p className="text-lg font-medium text-gray-700 mb-1">
                      Click to upload PDF
                    </p>
                    <p className="text-sm text-gray-500">
                      PDF files only, max 10MB
                    </p>
                  </label>
                </div>
              ) : (
                /* File Selected */
                <div className="space-y-4">
                  <div className="flex items-center gap-3 p-4 bg-blue-50 rounded-lg border border-blue-200">
                    <Paperclip className="w-5 h-5 text-blue-600" />
                    <div className="flex-1">
                      <p className="font-medium text-blue-900">{uploadFile.name}</p>
                      <p className="text-sm text-blue-600">
                        {(uploadFile.size / (1024 * 1024)).toFixed(2)} MB
                      </p>
                    </div>
                    {!isUploading && (
                      <button
                        onClick={() => setUploadFile(null)}
                        className="p-1 hover:bg-blue-100 rounded"
                      >
                        <X className="w-4 h-4 text-blue-600" />
                      </button>
                    )}
                  </div>

                  {/* Upload Progress */}
                  {isUploading && (
                    <div className="space-y-2">
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-gray-600">Uploading...</span>
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
                        {selectedAssignment?.due_date && new Date(selectedAssignment.due_date).toLocaleDateString()}
                      </span>
                    </div>
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-gray-600">Points:</span>
                      <span className="font-medium text-gray-900">{selectedAssignment?.total_points}</span>
                    </div>
                  </div>
                </div>
              )}
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
                disabled={!uploadFile || isUploading}
                className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
              >
                {isUploading ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Uploading...
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
    </div>
  );
};

export default MyClass;
