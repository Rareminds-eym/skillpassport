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
  MapPin
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useStudentDataByEmail } from '../../hooks/useStudentDataByEmail';
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
  updateAssignmentStatus
} from '../../services/assignmentsService';

type TabType = 'overview' | 'assignments' | 'timetable' | 'classmates';
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
      } catch (error) {
        console.error('Error fetching class data:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [studentId, authLoading]);

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
    
    if (diffDays < 0) return <span className="text-red-600 font-medium">Overdue</span>;
    if (diffDays === 0) return <span className="text-orange-600 font-medium">Due Today</span>;
    if (diffDays === 1) return <span className="text-orange-500 font-medium">Tomorrow</span>;
    return <span className="text-gray-600">{diffDays} days</span>;
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
                { id: 'classmates', label: 'Classmates', icon: Users }
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
                    {assignments.map(assignment => (
                      <div key={assignment.assignment_id} className="border border-gray-200 rounded-lg p-4 hover:border-gray-300 transition-colors">
                        <div className="flex items-start justify-between mb-3">
                          <div>
                            <h4 className="font-medium text-gray-900">{assignment.title}</h4>
                            <p className="text-sm text-gray-500">{assignment.course_name}</p>
                          </div>
                          <div className="flex items-center gap-2">
                            {getStatusBadge(assignment.status)}
                            <select
                              value={assignment.status}
                              onChange={(e) => handleStatusChange(assignment.assignment_id, assignment.student_assignment_id, e.target.value)}
                              className="text-xs border border-gray-200 rounded px-2 py-1 bg-white"
                            >
                              <option value="todo">To Do</option>
                              <option value="in-progress">In Progress</option>
                              <option value="submitted">Submitted</option>
                            </select>
                          </div>
                        </div>
                        {assignment.description && (
                          <p className="text-sm text-gray-600 mb-3 line-clamp-2">{assignment.description}</p>
                        )}
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
                      </div>
                    ))}
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
          </div>
        </div>
      </div>
    </div>
  );
};

export default MyClass;
