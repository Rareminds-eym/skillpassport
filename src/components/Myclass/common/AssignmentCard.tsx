import React from 'react';
import { 
  ClipboardList, 
  Calendar, 
  Target, 
  Activity, 
  Clock, 
  AlertCircle, 
  CheckCircle2, 
  FileText, 
  Upload,
  Zap,
  CheckSquare,
  Star
} from 'lucide-react';

export interface Assignment {
  assignment_id: string;
  title: string;
  description: string;
  course_name: string;
  due_date: string;
  total_points: number;
  assignment_type?: string;
  status: 'todo' | 'in-progress' | 'submitted' | 'graded';
  grade_received?: number;
  grade_percentage?: number;
  submission_date?: string;
  submission_content?: string;
  submission_url?: string;
  student_assignment_id: string;
  allow_late_submission?: boolean;
}

interface AssignmentCardProps {
  assignment: Assignment;
  onStatusChange: (assignmentId: string, studentAssignmentId: string, newStatus: string) => void;
  onUploadClick: (assignment: Assignment) => void;
  onViewDetails: (assignment: Assignment) => void;
}

const AssignmentCard: React.FC<AssignmentCardProps> = ({
  assignment,
  onStatusChange,
  onUploadClick,
  onViewDetails
}) => {
  // Helper function to parse date as local time (avoiding timezone conversion)
  const parseAsLocalDate = (dateString: string) => {
    if (!dateString) return new Date();
    // Remove timezone info and parse as local time
    const dueDateStr = dateString.replace('Z', '').replace('+00:00', '').replace('T', ' ');
    return new Date(dueDateStr);
  };

  const isOverdue = (dueDate: string) => {
    // Normalize today to start of day (00:00)
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    // Parse due date and normalize to start of day (00:00)
    const dueDateStr = dueDate.replace('Z', '').replace('+00:00', '').replace('T', ' ');
    const dueDay = new Date(dueDateStr);
    dueDay.setHours(0, 0, 0, 0);
    
    // Assignment is overdue if due date is before today (calendar day comparison)
    return dueDay.getTime() < today.getTime();
  };

  const isAssignmentOverdue = (assignment: Assignment) => {
    // If assignment was submitted, check if it was submitted on time
    if (assignment.submission_date) {
      // Normalize submission date to start of day
      const submissionDate = new Date(assignment.submission_date);
      submissionDate.setHours(0, 0, 0, 0);
      
      // Normalize due date to start of day
      const dueDateStr = assignment.due_date.replace('Z', '').replace('+00:00', '').replace('T', ' ');
      const dueDay = new Date(dueDateStr);
      dueDay.setHours(0, 0, 0, 0);
      
      // Assignment was submitted late if submission day is after due day
      return submissionDate.getTime() > dueDay.getTime();
    }
    
    // If not submitted, check if current day is past due day
    return isOverdue(assignment.due_date);
  };

  const getDaysRemaining = (dueDate: string) => {
    // Normalize today to start of day (00:00)
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    // Parse due date and normalize to start of day (00:00)
    const dueDateStr = dueDate.replace('Z', '').replace('+00:00', '').replace('T', ' ');
    const dueDay = new Date(dueDateStr);
    dueDay.setHours(0, 0, 0, 0);
    
    // Calculate calendar day difference
    const diffTime = dueDay.getTime() - today.getTime();
    const daysDifference = Math.round(diffTime / (1000 * 60 * 60 * 24));
    
    // Handle different cases based on calendar day difference
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

  const getAssignmentTimeStatus = (assignment: Assignment) => {
    // If assignment was submitted, show submission status instead of overdue
    if (assignment.submission_date) {
      // Normalize submission date to start of day
      const submissionDate = new Date(assignment.submission_date);
      submissionDate.setHours(0, 0, 0, 0);
      
      // Normalize due date to start of day
      const dueDateStr = assignment.due_date.replace('Z', '').replace('+00:00', '').replace('T', ' ');
      const dueDay = new Date(dueDateStr);
      dueDay.setHours(0, 0, 0, 0);
      
      if (submissionDate.getTime() <= dueDay.getTime()) {
        return <span className="text-green-600 font-medium">Submitted</span>;
      } else {
        return <span className="text-orange-600 font-medium">Submitted late</span>;
      }
    }
    
    // If not submitted, show time remaining or overdue
    return getDaysRemaining(assignment.due_date);
  };

  const canSubmitAssignment = (assignment: Assignment) => {
    // Can submit if not already submitted/graded
    if (assignment.status === 'submitted' || assignment.status === 'graded') {
      return false;
    }
    
    // If not overdue, can always submit
    if (!isOverdue(assignment.due_date)) {
      return true;
    }
    
    // If overdue, can only submit if late submission is allowed
    return assignment.allow_late_submission === true;
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
    
    // Check if URL is already a proxy URL
    if (fileUrl.includes('/document-access')) {
      return fileUrl; // Already a proxy URL
    }
    
    // Extract file key and use key parameter for better reliability
    const fileKey = extractFileKey(fileUrl);
    if (fileKey) {
      return `${storageApiUrl}/document-access?key=${encodeURIComponent(fileKey)}&mode=inline`;
    } else {
      // Fallback to URL parameter
      return `${storageApiUrl}/document-access?url=${encodeURIComponent(fileUrl)}&mode=inline`;
    }
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

  const overdueStatus = isAssignmentOverdue(assignment);
  const isSubmitted = assignment.status === 'submitted' || assignment.status === 'graded';

  return (
    <div 
      className={`relative overflow-hidden rounded-2xl border ${
        overdueStatus 
          ? 'border-red-200 bg-gradient-to-br from-red-50 via-white to-red-25' 
          : isSubmitted
          ? 'border-green-200 bg-gradient-to-br from-green-50 via-white to-green-25'
          : 'border-gray-200 bg-white'
      }`}
    >
      {/* Status Indicator Bar */}
      <div className={`h-1 w-full ${
        overdueStatus 
          ? 'bg-gradient-to-r from-red-400 to-red-600' 
          : isSubmitted
          ? 'bg-gradient-to-r from-green-400 to-green-600'
          : assignment.status === 'in-progress'
          ? 'bg-gradient-to-r from-blue-400 to-blue-600'
          : 'bg-gradient-to-r from-gray-300 to-gray-400'
      }`} />
      
      <div className="p-6">
        {/* Header Section */}
        <div className="flex items-start justify-between mb-4">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-3 mb-2">
              <div className={`p-2 rounded-xl ${
                overdueStatus 
                  ? 'bg-red-100 text-red-600' 
                  : isSubmitted
                  ? 'bg-green-100 text-green-600'
                  : 'bg-blue-100 text-blue-600'
              }`}>
                <ClipboardList className="w-5 h-5" />
              </div>
              <div className="flex-1 min-w-0">
                <h3 className="text-lg font-semibold text-gray-900 truncate">
                  {assignment.title}
                </h3>
                <p className="text-sm text-gray-500 font-medium">{assignment.course_name}</p>
              </div>
            </div>
            
            {assignment.description && (
              <p className="text-sm text-gray-600 line-clamp-2 leading-relaxed">
                {assignment.description}
              </p>
            )}
          </div>
          
          <div className="flex items-center gap-2 ml-4">
            {overdueStatus && (
              <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold bg-red-500 text-white shadow-sm">
                <AlertCircle className="w-3 h-3 mr-1" />
                OVERDUE
              </span>
            )}
            {getStatusBadge(assignment.status)}
          </div>
        </div>

        {/* Assignment Details Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
          <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-xl border border-gray-100">
            <div className="p-2 bg-white rounded-lg shadow-sm">
              <Calendar className="w-4 h-4 text-gray-600" />
            </div>
            <div>
              <p className="text-xs font-medium text-gray-500 uppercase tracking-wide">Due Date</p>
              <p className="text-sm font-semibold text-gray-900">
                {parseAsLocalDate(assignment.due_date).toLocaleDateString('en-US', {
                  month: 'short',
                  day: 'numeric',
                  year: 'numeric'
                })}
              </p>
              <div className="text-xs mt-1">
                {getAssignmentTimeStatus(assignment)}
              </div>
            </div>
          </div>

          <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-xl border border-gray-100">
            <div className="p-2 bg-white rounded-lg shadow-sm">
              <Target className="w-4 h-4 text-gray-600" />
            </div>
            <div>
              <p className="text-xs font-medium text-gray-500 uppercase tracking-wide">Points</p>
              <p className="text-sm font-semibold text-gray-900">{assignment.total_points}</p>
              {assignment.grade_percentage && (
                <p className="text-xs text-green-600 font-medium mt-1">
                  Grade: {assignment.grade_percentage}%
                </p>
              )}
            </div>
          </div>

          <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-xl border border-gray-100">
            <div className="p-2 bg-white rounded-lg shadow-sm">
              <Activity className="w-4 h-4 text-gray-600" />
            </div>
            <div>
              <p className="text-xs font-medium text-gray-500 uppercase tracking-wide">Type</p>
              <p className="text-sm font-semibold text-gray-900 capitalize">
                {assignment.assignment_type?.replace('_', ' ') || 'Assignment'}
              </p>
            </div>
          </div>
        </div>

        {/* Submission Info */}
        {assignment.submission_date && (
          <div className="mb-4 p-4 bg-green-50 border border-green-200 rounded-xl">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-green-100 rounded-lg">
                <CheckCircle2 className="w-4 h-4 text-green-600" />
              </div>
              <div>
                <p className="text-sm font-semibold text-green-800">
                  Submitted on {parseAsLocalDate(assignment.submission_date).toLocaleDateString('en-US', {
                    weekday: 'long',
                    month: 'long',
                    day: 'numeric',
                    year: 'numeric'
                  })}
                </p>
                {assignment.submission_content && (
                  <p className="text-xs text-green-600 mt-1">File: {assignment.submission_content}</p>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Status Selector for Non-Submitted Assignments */}
        {assignment.status !== 'submitted' && assignment.status !== 'graded' && (
          canSubmitAssignment(assignment) || !isOverdue(assignment.due_date) ? (
            <div className="mb-4 p-4 bg-blue-50 border border-blue-200 rounded-xl">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-blue-100 rounded-lg">
                  <Clock className="w-4 h-4 text-blue-600" />
                </div>
                <div className="flex-1">
                  <label className="text-sm font-medium text-blue-800 block mb-2">Update Status</label>
                  <select
                    value={assignment.status}
                    onChange={(e) => onStatusChange(assignment.assignment_id, assignment.student_assignment_id, e.target.value)}
                    className="w-full px-3 py-2 text-sm border border-blue-200 rounded-lg bg-white focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                  >
                    <option value="todo">To Do</option>
                    <option value="in-progress">In Progress</option>
                    {canSubmitAssignment(assignment) && <option value="submitted">Submitted</option>}
                  </select>
                </div>
              </div>
            </div>
          ) : (
            <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-xl">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-red-100 rounded-lg">
                  <AlertCircle className="w-4 h-4 text-red-600" />
                </div>
                <div>
                  <p className="text-sm font-medium text-red-800">Assignment Overdue</p>
                  <p className="text-xs text-red-600 mt-1">Late submission is not allowed for this assignment</p>
                </div>
              </div>
            </div>
          )
        )}

        {/* Action Buttons */}
        <div className="flex flex-wrap gap-3">
          {/* View Details Button */}
          <button
            onClick={() => onViewDetails(assignment)}
            className="flex items-center gap-2 px-4 py-2.5 bg-gray-100 text-gray-700 rounded-xl hover:bg-gray-200 transition-colors text-sm font-medium"
          >
            <FileText className="w-4 h-4" />
            View Details
          </button>
          
          {/* Upload Button */}
          {canSubmitAssignment(assignment) && (
            <button
              onClick={() => onUploadClick(assignment)}
              className="flex items-center gap-2 px-4 py-2.5 bg-blue-600 text-white rounded-xl hover:bg-blue-700 transition-colors text-sm font-medium"
            >
              <Upload className="w-4 h-4" />
              Upload Submission
            </button>
          )}
          
          {/* Show message when submission is disabled due to late submission policy */}
          {!canSubmitAssignment(assignment) && assignment.status !== 'submitted' && assignment.status !== 'graded' && isOverdue(assignment.due_date) && !assignment.allow_late_submission && (
            <div className="flex items-center gap-2 px-4 py-2.5 bg-red-50 text-red-700 rounded-xl text-sm font-medium border border-red-200">
              <AlertCircle className="w-4 h-4" />
              Late submission not allowed
            </div>
          )}
          
          {/* View Submission Button */}
          {(assignment.status === 'submitted' || assignment.status === 'graded') && assignment.submission_url && (
            <button
              onClick={() => openFile(assignment.submission_url, assignment.submission_content || 'submission')}
              className="flex items-center gap-2 px-4 py-2.5 bg-green-600 text-white rounded-xl hover:bg-green-700 transition-colors text-sm font-medium"
            >
              <FileText className="w-4 h-4" />
              View Submission
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

export default AssignmentCard;