import React, { useState, useEffect } from 'react';
import { Users, Target, FileText, Loader2, AlertCircle, X, Upload, Paperclip } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useStudentDataByEmail } from '../../hooks/useStudentDataByEmail';

// Import shared components
import CollegeClassHeader from './common/CollegeClassHeader';
import OverviewTab, { AssignmentStats, AdditionalInfo } from './Tabs/OverviewTab';
import ClassmatesTab, { Classmate } from './Tabs/ClassmatesTab';
import AssignmentsTab from './Tabs/AssignmentsTab';
import StudentAssignmentFileUpload from '../student/StudentAssignmentFileUpload';
import NotificationModal from '../ui/NotificationModal';

// Import college-specific services
import {
  getCollegeStudentClassInfo,
  getCollegeClassmates,
  CollegeClassInfo,
  CollegeClassmate
} from '../../services/collegeClassService';

// Import college assignment services
import {
  fetchCollegeStudentAssignments,
  getCollegeStudentAssignmentStats,
  updateCollegeStudentAssignmentStatus,
  submitCollegeAssignment,
  CollegeStudentAssignment,
  CollegeAssignmentStats
} from '../../services/collegeAssignmentService';

// Import assignment card interface
import { Assignment } from './common/AssignmentCard';
import { supabase } from '../../lib/supabaseClient';

type CollegeTabType = 'overview' | 'classmates' | 'assignments';

/**
 * CollegeMyClass - College Student Class Interface
 * 
 * This component handles the college student class experience including:
 * - Program overview and information
 * - Classmates interaction
 * - Assignments management with full functionality
 */
const CollegeMyClass: React.FC = () => {
  const { user } = useAuth();
  const userEmail = localStorage.getItem('userEmail') || user?.email;
  const { studentData, loading: authLoading } = useStudentDataByEmail(userEmail);
  const studentId = studentData?.id;

  // State management
  const [activeTab, setActiveTab] = useState<CollegeTabType>('overview');
  const [loading, setLoading] = useState(true);
  
  // Data state
  const [classInfo, setClassInfo] = useState<CollegeClassInfo | null>(null);
  const [classmates, setClassmates] = useState<CollegeClassmate[]>([]);
  const [assignments, setAssignments] = useState<CollegeStudentAssignment[]>([]);
  const [assignmentStats, setAssignmentStats] = useState<CollegeAssignmentStats>({
    total: 0,
    todo: 0,
    inProgress: 0,
    submitted: 0,
    graded: 0,
    averageGrade: 0
  });

  // Pagination state
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
        const classData = await getCollegeStudentClassInfo(studentId);
        setClassInfo(classData);

        // Fetch assignments and stats
        const [assignmentsResult, statsResult] = await Promise.all([
          fetchCollegeStudentAssignments(studentId),
          getCollegeStudentAssignmentStats(studentId)
        ]);

        if (assignmentsResult.data) {
          setAssignments(assignmentsResult.data);
        }

        if (statsResult.data) {
          setAssignmentStats(statsResult.data);
        }

        if (classData?.program_id) {
          // Fetch classmates
          const classmatesData = await getCollegeClassmates(
            classData.program_id,
            classData.semester,
            classData.program_section_id,
            studentId
          );
          setClassmates(classmatesData);
        }
      } catch (error) {
        console.error('Error fetching college class data:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [studentId, authLoading]);

  // Handle assignment status change
  const handleStatusChange = async (assignmentId: string, studentAssignmentId: string, newStatus: string) => {
    try {
      const result = await updateCollegeStudentAssignmentStatus(studentAssignmentId, newStatus);
      
      if (result.data) {
        // Update local state
        setAssignments(prev => prev.map(assignment => 
          assignment.student_assignment_id === studentAssignmentId
            ? { ...assignment, status: newStatus }
            : assignment
        ));

        // Refresh stats
        const statsResult = await getCollegeStudentAssignmentStats(studentId!);
        if (statsResult.data) {
          setAssignmentStats(statsResult.data);
        }
      }
    } catch (error) {
      console.error('Error updating assignment status:', error);
    }
  };

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

  // Assignment handlers
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

      // Simulate initial progress
      setUploadProgress(10);

      // Submit assignment with files using college service
      await submitCollegeAssignment(
        selectedAssignment.student_assignment_id,
        { submission_content: 'File submission' },
        stagedFiles
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
        const statsResult = await getCollegeStudentAssignmentStats(studentId);
        if (statsResult.data) {
          setAssignmentStats(statsResult.data);
        }
      }

      // Clear staged files and close modal
      fileUploadRef.current.clearStagedFiles();

      setTimeout(() => {
        setShowUploadModal(false);
        setSelectedAssignment(null);
        setUploadProgress(0);
        setIsUploading(false);
        showNotificationModal('success', 'Assignment Submitted', 'Your assignment has been submitted successfully!');
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
      // For now, use the assignment data we already have
      // In the future, you could create a getCollegeAssignmentWithFiles function
      const assignmentData = assignments.find(a => a.assignment_id === assignment.assignment_id);
      setAssignmentDetails(assignmentData);
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

  // Status badge helper
  const getStatusBadge = (status: string) => {
    const statusConfig = {
      'todo': { bg: 'bg-gray-100', text: 'text-gray-800', label: 'To Do' },
      'in-progress': { bg: 'bg-blue-100', text: 'text-blue-800', label: 'In Progress' },
      'submitted': { bg: 'bg-green-100', text: 'text-green-800', label: 'Submitted' },
      'graded': { bg: 'bg-purple-100', text: 'text-purple-800', label: 'Graded' }
    };

    const config = statusConfig[status as keyof typeof statusConfig] || statusConfig.todo;
    
    return (
      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${config.bg} ${config.text}`}>
        {config.label}
      </span>
    );
  };

  if (authLoading || loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="w-12 h-12 text-blue-600 animate-spin mx-auto mb-4" />
          <p className="text-gray-600">Loading your program information...</p>
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
          <h2 className="text-xl font-semibold text-gray-900 mb-2">No Program Assigned</h2>
          <p className="text-gray-600">
            You haven't been assigned to a program yet. Please contact your college administrator to complete your enrollment.
          </p>
        </div>
      </div>
    );
  }

  // Prepare data for shared components
  const stats: AssignmentStats = {
    total: assignmentStats.total,
    todo: assignmentStats.todo,
    inProgress: assignmentStats.inProgress,
    submitted: assignmentStats.submitted,
    graded: assignmentStats.graded,
    averageGrade: assignmentStats.averageGrade
  };

  // Get upcoming assignments (due within next 7 days)
  const upcomingAssignments = assignments
    .filter(assignment => {
      if (assignment.status === 'submitted' || assignment.status === 'graded') {
        return false;
      }
      
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      
      // Parse due date as local time (avoiding timezone conversion)
      const dueDateStr = assignment.due_date.replace('Z', '').replace('+00:00', '').replace('T', ' ');
      const dueDate = new Date(dueDateStr);
      dueDate.setHours(0, 0, 0, 0);
      
      const nextWeek = new Date(today.getTime() + 7 * 24 * 60 * 60 * 1000);
      
      return dueDate >= today && dueDate <= nextWeek;
    })
    .sort((a, b) => new Date(a.due_date).getTime() - new Date(b.due_date).getTime())
    .slice(0, 3)
    .map(assignment => ({
      id: assignment.assignment_id,
      title: assignment.title,
      course_name: assignment.course_name,
      due_date: assignment.due_date,
      status: assignment.status,
      total_points: assignment.total_points
    }));

  // Convert college assignments to Assignment interface for AssignmentsTab
  const convertedAssignments: Assignment[] = assignments
    .sort((a, b) => new Date(b.due_date).getTime() - new Date(a.due_date).getTime()) // Latest due date first
    .map(assignment => ({
      assignment_id: assignment.assignment_id,
      student_assignment_id: assignment.student_assignment_id,
      title: assignment.title,
      description: assignment.description,
      course_name: assignment.course_name,
      due_date: assignment.due_date,
      total_points: assignment.total_points,
      assignment_type: assignment.assignment_type,
      status: assignment.status as 'todo' | 'in-progress' | 'submitted' | 'graded',
      grade_received: assignment.grade_received,
      grade_percentage: assignment.grade_percentage,
      submission_date: assignment.submission_date,
      submission_content: assignment.submission_content,
      submission_url: assignment.submission_url,
      allow_late_submission: assignment.allow_late_submission
    }));

  // Pagination logic
  const totalPages = Math.ceil(convertedAssignments.length / itemsPerPage);
  const paginatedAssignments = convertedAssignments.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  const additionalInfo: AdditionalInfo = {
    title: "Program Information",
    items: [
      { label: "Program", value: classInfo?.program_name || 'N/A' },
      { label: "Code", value: classInfo?.program_code || 'N/A' },
      { label: "Department", value: classInfo?.department_name || 'N/A' },
      { label: "Current Semester", value: `Semester ${classInfo?.semester || 'N/A'}` },
      ...(classInfo?.section ? [{ label: "Section", value: classInfo.section }] : []),
      { label: "Classmates", value: `${classmates.length} students` }
    ]
  };

  const mappedClassmates: Classmate[] = classmates.map(classmate => ({
    id: classmate.id,
    name: classmate.name,
    email: classmate.email,
    profilePicture: classmate.profilePicture,
    roll_number: classmate.roll_number,
    admission_number: classmate.admission_number,
    semester: classmate.semester
  }));

  const handleViewAllAssignments = () => {
    setActiveTab('assignments');
  };

  const handleViewFullTimetable = () => {
    // Coming soon
  };

  return (
    <div className="min-h-screen bg-gray-50 py-4 sm:py-6 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <CollegeClassHeader classInfo={classInfo} />

        {/* Tabs */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 mb-6">
          <div className="border-b border-gray-200">
            {/* Mobile Tab Selector */}
            <div className="sm:hidden">
              <select
                value={activeTab}
                onChange={(e) => setActiveTab(e.target.value as CollegeTabType)}
                className="block w-full px-4 py-3 text-base border-0 bg-transparent focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              >
                <option value="overview">Overview</option>
                <option value="classmates">Classmates</option>
                <option value="assignments">Assignments</option>
              </select>
            </div>

            {/* Desktop Tab Navigation */}
            <nav className="hidden sm:flex -mb-px overflow-x-auto">
              {[
                { id: 'overview', label: 'Overview', icon: Target },
                { id: 'classmates', label: 'Classmates', icon: Users },
                { id: 'assignments', label: 'Assignments', icon: FileText }
              ].map(tab => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id as CollegeTabType)}
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
                upcomingAssignments={upcomingAssignments}
                todaySchedule={[]}
                onViewAllAssignments={handleViewAllAssignments}
                onViewFullTimetable={handleViewFullTimetable}
                additionalInfo={additionalInfo}
                loading={loading}
              />
            )}

            {/* Classmates Tab */}
            {activeTab === 'classmates' && (
              <ClassmatesTab
                classmates={mappedClassmates}
                loading={loading}
              />
            )}

            {/* Assignments Tab */}
            {activeTab === 'assignments' && (
              <AssignmentsTab
                assignments={convertedAssignments}
                paginatedAssignments={paginatedAssignments}
                currentPage={currentPage}
                totalPages={totalPages}
                itemsPerPage={itemsPerPage}
                loading={loading}
                onPageChange={setCurrentPage}
                onStatusChange={handleStatusChange}
                onUploadClick={handleUploadClick}
                onViewDetails={handleViewDetails}
                isReadOnly={false}
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
                        {assignmentDetails.instruction_files.map((file: any, index: number) => (
                          <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg border border-gray-200">
                            <div className="flex items-center gap-3">
                              <FileText className="w-5 h-5 text-gray-500" />
                              <div>
                                <p className="font-medium text-gray-900">{file.name}</p>
                                <p className="text-sm text-gray-500">{(file.size / 1024).toFixed(1)} KB</p>
                              </div>
                            </div>
                            <button
                              onClick={() => window.open(file.url, '_blank')}
                              className="px-3 py-1 text-sm bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors"
                            >
                              Download
                            </button>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Submission Info */}
                  {assignmentDetails.status === 'submitted' || assignmentDetails.status === 'graded' ? (
                    <div>
                      <h4 className="text-lg font-semibold text-gray-900 mb-3">Submission</h4>
                      <div className="bg-green-50 rounded-lg p-4 border border-green-200">
                        <p className="text-green-800 mb-2">
                          <strong>Submitted on:</strong> {assignmentDetails.submission_date && new Date(assignmentDetails.submission_date).toLocaleDateString()}
                        </p>
                        {assignmentDetails.grade_received && (
                          <p className="text-green-800 mb-2">
                            <strong>Grade:</strong> {assignmentDetails.grade_received}/{assignmentDetails.total_points} ({assignmentDetails.grade_percentage}%)
                          </p>
                        )}
                        
                        {/* Submitted Files */}
                        {assignmentDetails.submission_files && assignmentDetails.submission_files.length > 0 && (
                          <div className="mt-3">
                            <p className="text-green-800 font-medium mb-2">Submitted Files:</p>
                            <div className="space-y-2">
                              {assignmentDetails.submission_files.map((file: any, index: number) => (
                                <div key={index} className="flex items-center justify-between p-3 bg-white rounded-lg border border-green-200">
                                  <div className="flex items-center gap-3">
                                    <Paperclip className="w-4 h-4 text-green-600" />
                                    <div>
                                      <p className="font-medium text-green-900" title={file.name}>
                                        {file.name.length > 40 ? `${file.name.substring(0, 40)}...` : file.name}
                                      </p>
                                      <p className="text-sm text-green-600">{(file.size / 1024).toFixed(1)} KB • {file.type}</p>
                                    </div>
                                  </div>
                                  <button
                                    onClick={() => window.open(file.url, '_blank')}
                                    className="px-3 py-1 text-sm bg-green-600 text-white rounded hover:bg-green-700 transition-colors"
                                  >
                                    Download
                                  </button>
                                </div>
                              ))}
                            </div>
                          </div>
                        )}
                        
                        {assignmentDetails.instructor_feedback && (
                          <div className="mt-3">
                            <p className="text-green-800 font-medium mb-1">Instructor Feedback:</p>
                            <p className="text-green-700">{assignmentDetails.instructor_feedback}</p>
                          </div>
                        )}
                      </div>
                    </div>
                  ) : (
                    <div className="flex items-center justify-between p-4 bg-blue-50 rounded-lg border border-blue-200">
                      <div>
                        <p className="text-blue-800 font-medium">Ready to submit?</p>
                        <p className="text-blue-600 text-sm">Upload your assignment files and submit for grading.</p>
                      </div>
                      <button
                        onClick={() => {
                          closeDetailsModal();
                          handleUploadClick(assignmentDetails);
                        }}
                        className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center gap-2"
                      >
                        <Upload className="w-4 h-4" />
                        Submit Assignment
                      </button>
                    </div>
                  )}
                </div>
              ) : (
                <div className="text-center py-12">
                  <p className="text-gray-500">No assignment details available.</p>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Notification Modal */}
      {showNotification && (
        <NotificationModal
          isOpen={showNotification}
          type={notification.type}
          title={notification.title}
          message={notification.message}
          onClose={() => setShowNotification(false)}
        />
      )}
    </div>
  );
};

export default CollegeMyClass;