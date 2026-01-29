import React from 'react';
import { CheckCircle2, ChevronRight, Calendar, Clock, Target, MapPin } from 'lucide-react';

// Generic interfaces that work for both school and college
export interface Assignment {
  id: string;
  title: string;
  course_name?: string;
  subject_name?: string; // For college
  due_date: string;
  status: string;
  total_points: number;
}

export interface TimetableSlot {
  id: string;
  period_number?: number;
  start_time: string;
  subject_name: string;
  educator_name?: string;
  lecturer_name?: string; // For college
  room_number?: string;
}

export interface AssignmentStats {
  total: number;
  todo: number;
  inProgress: number;
  submitted: number;
  graded: number;
  averageGrade?: number;
}

export interface AdditionalInfo {
  title: string;
  items: Array<{
    label: string;
    value: string;
  }>;
}

interface OverviewTabProps {
  stats: AssignmentStats;
  upcomingAssignments: Assignment[];
  todaySchedule: TimetableSlot[];
  onViewAllAssignments: () => void;
  onViewFullTimetable: () => void;
  additionalInfo?: AdditionalInfo; // For college program info or school class info
  loading?: boolean;
}

const OverviewTab: React.FC<OverviewTabProps> = ({
  stats,
  upcomingAssignments,
  todaySchedule,
  onViewAllAssignments,
  onViewFullTimetable,
  additionalInfo,
  loading = false
}) => {
  if (loading) {
    return (
      <div className="space-y-6">
        <div className="animate-pulse">
          <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-6">
            {[...Array(5)].map((_, i) => (
              <div key={i} className="bg-gray-50 rounded-lg p-4">
                <div className="h-3 bg-gray-200 rounded w-20 mb-2"></div>
                <div className="h-8 bg-gray-200 rounded w-12"></div>
              </div>
            ))}
          </div>
          <div className="grid md:grid-cols-2 gap-6">
            <div className="space-y-4">
              <div className="h-6 bg-gray-200 rounded w-48"></div>
              <div className="bg-gray-50 rounded-xl p-6">
                <div className="h-4 bg-gray-200 rounded w-32 mb-2"></div>
                <div className="h-3 bg-gray-200 rounded w-24"></div>
              </div>
            </div>
            <div className="space-y-4">
              <div className="h-6 bg-gray-200 rounded w-48"></div>
              <div className="bg-gray-50 rounded-xl p-6">
                <div className="h-4 bg-gray-200 rounded w-32 mb-2"></div>
                <div className="h-3 bg-gray-200 rounded w-24"></div>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  const getDaysRemaining = (dueDate: string) => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    const dueDateStr = dueDate.replace('Z', '').replace('+00:00', '').replace('T', ' ');
    const dueDay = new Date(dueDateStr);
    dueDay.setHours(0, 0, 0, 0);
    
    const diffTime = dueDay.getTime() - today.getTime();
    const daysDifference = Math.round(diffTime / (1000 * 60 * 60 * 24));
    
    if (daysDifference === 0) {
      return <span className="text-orange-600 font-medium">Today</span>;
    } else if (daysDifference === 1) {
      return <span className="text-orange-500 font-medium">Tomorrow</span>;
    } else if (daysDifference > 1) {
      return <span className="text-gray-600">In {daysDifference} days</span>;
    } else if (daysDifference === -1) {
      return <span className="text-red-700 font-medium">Overdue by 1 day</span>;
    } else {
      const overdueDays = Math.abs(daysDifference);
      return <span className="text-red-700 font-medium">Overdue by {overdueDays} days</span>;
    }
  };

  const getStatusBadge = (status: string) => {
    const configs: Record<string, { bg: string; text: string; label: string }> = {
      'todo': { bg: 'bg-gray-100 border-gray-200', text: 'text-gray-700', label: 'To Do' },
      'in-progress': { bg: 'bg-blue-100 border-blue-200', text: 'text-blue-700', label: 'In Progress' },
      'submitted': { bg: 'bg-purple-100 border-purple-200', text: 'text-purple-700', label: 'Submitted' },
      'graded': { bg: 'bg-green-100 border-green-200', text: 'text-green-700', label: 'Graded' }
    };
    const config = configs[status] || configs.todo;
    return (
      <span className={`inline-flex items-center px-3 py-1.5 rounded-full text-xs font-semibold border ${config.bg} ${config.text} shadow-sm`}>
        {config.label}
      </span>
    );
  };

  const formatTime = (time: string) => {
    if (!time) return '';
    const [hours, minutes] = time.split(':');
    const h = parseInt(hours);
    const ampm = h >= 12 ? 'PM' : 'AM';
    const hour12 = h % 12 || 12;
    return `${hour12}:${minutes} ${ampm}`;
  };

  return (
    <div className="space-y-6">
      {/* Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3 sm:gap-4">
        <div className="bg-gray-50 rounded-lg p-3 sm:p-4">
          <p className="text-xs text-gray-500 mb-1">Total Assignments</p>
          <p className="text-xl sm:text-2xl font-bold text-gray-900">{stats.total}</p>
        </div>
        <div className="bg-gray-50 rounded-lg p-3 sm:p-4">
          <p className="text-xs text-gray-500 mb-1">To Do</p>
          <p className="text-xl sm:text-2xl font-bold text-gray-900">{stats.todo}</p>
        </div>
        <div className="bg-blue-50 rounded-lg p-3 sm:p-4">
          <p className="text-xs text-blue-600 mb-1">In Progress</p>
          <p className="text-xl sm:text-2xl font-bold text-blue-700">{stats.inProgress}</p>
        </div>
        <div className="bg-purple-50 rounded-lg p-3 sm:p-4">
          <p className="text-xs text-purple-600 mb-1">Submitted</p>
          <p className="text-xl sm:text-2xl font-bold text-purple-700">{stats.submitted || 0}</p>
        </div>
        <div className="bg-green-50 rounded-lg p-3 sm:p-4 col-span-2 sm:col-span-1">
          <p className="text-xs text-green-600 mb-1">Graded</p>
          <p className="text-xl sm:text-2xl font-bold text-green-700">{stats.graded || 0}</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Upcoming Assignments */}
        <div>
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-base sm:text-lg font-semibold text-gray-900">Upcoming Assignments</h3>
            <button 
              onClick={onViewAllAssignments} 
              className="text-sm text-blue-600 hover:underline flex items-center gap-1"
            >
              <span className="hidden sm:inline">View all</span>
              <span className="sm:hidden">All</span>
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
          {upcomingAssignments.length === 0 ? (
            <div className="bg-gradient-to-br from-green-50 to-emerald-50 rounded-2xl p-8 text-center border border-green-200">
              <div className="w-16 h-16 bg-gradient-to-br from-green-100 to-green-200 rounded-2xl mx-auto mb-4 flex items-center justify-center">
                <CheckCircle2 className="w-8 h-8 text-green-600" />
              </div>
              <h4 className="font-semibold text-green-900 mb-2">All Caught Up!</h4>
              <p className="text-green-700 text-sm">No upcoming assignments. Great work!</p>
            </div>
          ) : (
            <div className="space-y-3">
              {upcomingAssignments.map(assignment => (
                <div key={assignment.id} className="bg-white rounded-xl p-4 border border-gray-200">
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                        <h4 className="font-semibold text-gray-900 truncate">
                          {assignment.title}
                        </h4>
                      </div>
                      <p className="text-sm text-gray-500 font-medium">
                        {assignment.course_name || assignment.subject_name}
                      </p>
                    </div>
                    {getStatusBadge(assignment.status)}
                  </div>
                  <div className="flex items-center justify-between text-sm">
                    <div className="flex items-center gap-4 text-gray-500">
                      <span className="flex items-center gap-1">
                        <Clock className="w-3 h-3" />
                        {getDaysRemaining(assignment.due_date)}
                      </span>
                      <span className="flex items-center gap-1">
                        <Target className="w-3 h-3" />
                        {assignment.total_points} pts
                      </span>
                    </div>
                    <button 
                      onClick={onViewAllAssignments}
                      className="text-blue-600 hover:text-blue-700 font-medium text-xs px-2 py-1 rounded-lg hover:bg-blue-50 transition-colors"
                    >
                      View →
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Today's Schedule */}
        <div>
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-base sm:text-lg font-semibold text-gray-900">Today's Schedule</h3>
            <button 
              onClick={onViewFullTimetable} 
              className="text-sm text-blue-600 hover:underline flex items-center gap-1"
            >
              <span className="hidden sm:inline">Full timetable</span>
              <span className="sm:hidden">Full</span>
              <ChevronRight className="w-4 h-4" />
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
                  <div className="min-w-[80px] sm:min-w-[110px] pr-3 sm:pr-4 border-r border-gray-200">
                    {slot.period_number && (
                      <p className="text-xs font-medium text-gray-400 uppercase tracking-wide mb-1">
                        <span className="hidden sm:inline">Period {slot.period_number}</span>
                        <span className="sm:hidden">P{slot.period_number}</span>
                      </p>
                    )}
                    <p className="text-sm font-medium text-gray-700">
                      {formatTime(slot.start_time)}
                    </p>
                  </div>
                  
                  {/* Subject & Teacher */}
                  <div className="flex-1 pl-3 sm:pl-4">
                    <p className="font-semibold text-gray-900 text-sm sm:text-base">{slot.subject_name}</p>
                    {(slot.educator_name || slot.lecturer_name) && (
                      <p className="text-xs sm:text-sm text-gray-500">
                        {slot.educator_name || slot.lecturer_name}
                      </p>
                    )}
                  </div>
                  
                  {/* Room Badge */}
                  {slot.room_number && (
                    <span className="inline-flex items-center gap-1.5 px-2 sm:px-3 py-1.5 bg-gray-50 text-gray-600 text-xs sm:text-sm font-medium rounded-full border border-gray-200">
                      <MapPin className="w-3 sm:w-3.5 h-3 sm:h-3.5 text-blue-500" />
                      <span className="hidden sm:inline">Room {slot.room_number}</span>
                      <span className="sm:hidden">{slot.room_number}</span>
                    </span>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Additional Info Section (for college program info or school class info) */}
      {additionalInfo && (
        <div className="bg-white rounded-xl border border-gray-200 p-4 sm:p-6">
          <h3 className="text-base sm:text-lg font-semibold text-gray-900 mb-4">{additionalInfo.title}</h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6">
            <div className="space-y-3">
              {additionalInfo.items.slice(0, Math.ceil(additionalInfo.items.length / 2)).map((item, index) => (
                <div key={index} className="flex flex-col sm:flex-row sm:justify-between gap-1 sm:gap-0">
                  <span className="text-sm text-gray-500">{item.label}:</span>
                  <span className="text-sm font-medium text-gray-900">{item.value}</span>
                </div>
              ))}
            </div>
            <div className="space-y-3">
              {additionalInfo.items.slice(Math.ceil(additionalInfo.items.length / 2)).map((item, index) => (
                <div key={index} className="flex flex-col sm:flex-row sm:justify-between gap-1 sm:gap-0">
                  <span className="text-sm text-gray-500">{item.label}:</span>
                  <span className="text-sm font-medium text-gray-900">{item.value}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default OverviewTab;