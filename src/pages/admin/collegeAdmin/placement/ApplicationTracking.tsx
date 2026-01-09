import React, { useState, useEffect } from "react";
import {
  Users,
  Search,
  Filter,
  Eye,
  Download,
  UserCheck,
  Clock,
  CheckCircle,
  X,
  Edit,
  User,
  GraduationCap,
  Award,
  AlertCircle,
  RefreshCw,
} from "lucide-react";
import toast from 'react-hot-toast';
import { opportunitiesService } from '@/services/opportunitiesService';
import type { Opportunity } from '@/services/opportunitiesService';
import { applicationTrackingService } from '@/services/applicationTrackingService';
import type { ApplicationTrackingData, ApplicationStats } from '@/services/applicationTrackingService';

const ApplicationTracking: React.FC = () => {
  const [applicationSearchTerm, setApplicationSearchTerm] = useState("");
  const [selectedApplicationStatus, setSelectedApplicationStatus] = useState("");
  const [showApplicationFilterModal, setShowApplicationFilterModal] = useState(false);
  const [showStudentDetailsModal, setShowStudentDetailsModal] = useState(false);
  const [showUpdateStageModal, setShowUpdateStageModal] = useState(false);
  const [selectedApplication, setSelectedApplication] = useState<ApplicationTrackingData | null>(null);
  const [showJobDetailsModal, setShowJobDetailsModal] = useState(false);
  const [newApplicationStage, setNewApplicationStage] = useState("");
  const [newApplicationStatus, setNewApplicationStatus] = useState("");

  // Pagination state
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);
  const [totalItems, setTotalItems] = useState(0);

  // State for real data from database
  const [opportunities, setOpportunities] = useState<Opportunity[]>([]);
  const [selectedJobDetails, setSelectedJobDetails] = useState<Opportunity | null>(null);
  const [isLoadingOpportunities, setIsLoadingOpportunities] = useState(false);
  const [hasError, setHasError] = useState(false);

  // Application tracking state
  const [applications, setApplications] = useState<ApplicationTrackingData[]>([]);
  const [filteredApplications, setFilteredApplications] = useState<ApplicationTrackingData[]>([]);
  const [applicationStats, setApplicationStats] = useState<ApplicationStats>({
    total: 0,
    applied: 0,
    viewed: 0,
    under_review: 0,
    interview_scheduled: 0,
    interviewed: 0,
    offer_received: 0,
    accepted: 0,
    rejected: 0,
    withdrawn: 0
  });
  const [isLoadingApplications, setIsLoadingApplications] = useState(false);
  const [applicationError, setApplicationError] = useState<string | null>(null);
  const [isUpdating, setIsUpdating] = useState(false);

  // Load opportunities and applications from database on component mount
  useEffect(() => {
    loadOpportunities();
    loadApplications();
  }, []);

  // Apply filters when data or filters change
  useEffect(() => {
    applyFilters();
  }, [applications, applicationSearchTerm, selectedApplicationStatus]);

  const loadOpportunities = async () => {
    try {
      setIsLoadingOpportunities(true);
      setHasError(false);
      
      const opportunitiesData = await opportunitiesService.getAllOpportunities({
        is_active: true // Only show active opportunities
      });
      
      setOpportunities(opportunitiesData);
      
      // Set the first opportunity as selected by default
      if (opportunitiesData.length > 0) {
        setSelectedJobDetails(opportunitiesData[0]);
      }
    } catch (error) {
      console.error('Error loading opportunities:', error);
      setHasError(true);
      toast.error('Failed to load job opportunities');
      setOpportunities([]);
    } finally {
      setIsLoadingOpportunities(false);
    }
  };

  const loadApplications = async () => {
    try {
      setIsLoadingApplications(true);
      setApplicationError(null);

      // Load applications, stats, companies, and departments in parallel
      const [applicationsData, statsData] = await Promise.all([
        applicationTrackingService.getAllApplications(),
        applicationTrackingService.getApplicationStats()
      ]);

      setApplications(applicationsData);
      setApplicationStats(statsData);

    } catch (error) {
      console.error('Error loading applications:', error);
      setApplicationError('Failed to load application data. Please try again.');
      toast.error('Failed to load applications');
    } finally {
      setIsLoadingApplications(false);
    }
  };

  const applyFilters = () => {
    let filtered = [...applications];

    // Search filter
    if (applicationSearchTerm) {
      const search = applicationSearchTerm.toLowerCase();
      filtered = filtered.filter(app => 
        app.student?.name?.toLowerCase().includes(search) ||
        app.student?.email?.toLowerCase().includes(search) ||
        app.opportunity?.title?.toLowerCase().includes(search) ||
        app.opportunity?.job_title?.toLowerCase().includes(search) ||
        app.opportunity?.company_name?.toLowerCase().includes(search) ||
        app.company?.name?.toLowerCase().includes(search)
      );
    }

    // Status filter
    if (selectedApplicationStatus) {
      filtered = filtered.filter(app => app.application_status === selectedApplicationStatus);
    }

    setTotalItems(filtered.length);
    setFilteredApplications(filtered);
  };

  // Get paginated data
  const getPaginatedApplications = () => {
    const startIndex = (currentPage - 1) * itemsPerPage;
    const endIndex = startIndex + itemsPerPage;
    return filteredApplications.slice(startIndex, endIndex);
  };

  const totalPages = Math.ceil(totalItems / itemsPerPage);
  const paginatedApplications = getPaginatedApplications();

  const handlePageChange = (page: number) => {
    setCurrentPage(page);
  };

  const handleItemsPerPageChange = (newItemsPerPage: number) => {
    setItemsPerPage(newItemsPerPage);
    setCurrentPage(1);
  };

  // Reset to first page when filters change
  useEffect(() => {
    setCurrentPage(1);
  }, [applicationSearchTerm, selectedApplicationStatus]);

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'applied':
        return <span className="px-2 py-1 text-xs font-medium bg-blue-100 text-blue-800 rounded-full">Applied</span>;
      case 'viewed':
        return <span className="px-2 py-1 text-xs font-medium bg-yellow-100 text-yellow-800 rounded-full">Viewed</span>;
      case 'under_review':
        return <span className="px-2 py-1 text-xs font-medium bg-orange-100 text-orange-800 rounded-full">Under Review</span>;
      case 'interview_scheduled':
        return <span className="px-2 py-1 text-xs font-medium bg-purple-100 text-purple-800 rounded-full">Interview Scheduled</span>;
      case 'interviewed':
        return <span className="px-2 py-1 text-xs font-medium bg-indigo-100 text-indigo-800 rounded-full">Interviewed</span>;
      case 'offer_received':
        return <span className="px-2 py-1 text-xs font-medium bg-cyan-100 text-cyan-800 rounded-full">Offer Received</span>;
      case 'accepted':
        return <span className="px-2 py-1 text-xs font-medium bg-green-100 text-green-800 rounded-full">Accepted</span>;
      case 'rejected':
        return <span className="px-2 py-1 text-xs font-medium bg-red-100 text-red-800 rounded-full">Rejected</span>;
      case 'withdrawn':
        return <span className="px-2 py-1 text-xs font-medium bg-gray-100 text-gray-800 rounded-full">Withdrawn</span>;
      default:
        return <span className="px-2 py-1 text-xs font-medium bg-gray-100 text-gray-800 rounded-full">Unknown</span>;
    }
  };

  const updateApplicationStage = (application: ApplicationTrackingData) => {
    setSelectedApplication(application);
    setNewApplicationStage(application.notes || '');
    setNewApplicationStatus(application.application_status);
    setShowUpdateStageModal(true);
  };

  const viewApplicationDetails = (application: ApplicationTrackingData) => {
    setSelectedApplication(application);
    setShowStudentDetailsModal(true);
  };

  const viewJobDetails = () => {
    setShowJobDetailsModal(true);
  };

  const handleStageUpdate = async () => {
    if (selectedApplication && newApplicationStatus) {
      try {
        setIsUpdating(true);
        
        await applicationTrackingService.updateApplicationStatus(
          selectedApplication.id,
          newApplicationStatus,
          newApplicationStage || undefined
        );
        
        toast.success(`${selectedApplication.student?.name}'s application updated successfully!`);
        
        // Reload applications to reflect changes
        await loadApplications();
        
        setShowUpdateStageModal(false);
        setSelectedApplication(null);
        setNewApplicationStage("");
        setNewApplicationStatus("");
      } catch (error) {
        console.error('Error updating application:', error);
        toast.error("Failed to update application. Please try again.");
      } finally {
        setIsUpdating(false);
      }
    } else {
      toast.error("Please fill in all required fields");
    }
  };

  const exportApplications = () => {
    // Create CSV content
    const headers = ['Application ID', 'Student Name', 'Email', 'Department', 'CGPA', 'Company', 'Job Title', 'Status', 'Applied Date', 'Last Updated'];
    const csvContent = [
      headers.join(','),
      ...filteredApplications.map(app => [
        app.id,
        `"${app.student?.name || 'N/A'}"`,
        app.student?.email || 'N/A',
        `"${app.student?.branch_field || app.student?.course_name || 'N/A'}"`,
        app.student?.currentCgpa || 'N/A',
        `"${app.opportunity?.company_name || 'N/A'}"`,
        `"${app.opportunity?.title || app.opportunity?.job_title || 'N/A'}"`,
        app.application_status,
        new Date(app.applied_at).toLocaleDateString(),
        new Date(app.updated_at).toLocaleDateString()
      ].join(','))
    ].join('\n');

    // Create and download CSV file
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', `application_tracking_${new Date().toISOString().split('T')[0]}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    
    toast.success("Applications exported successfully");
  };

  const clearApplicationFilters = () => {
    setSelectedApplicationStatus("");
    setShowApplicationFilterModal(false);
  };

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-xl font-bold text-gray-900">Application Tracking</h2>
        <div className="flex gap-2">
          <button 
            onClick={loadApplications}
            disabled={isLoadingApplications}
            className="flex items-center gap-2 px-4 py-2 border border-gray-300 bg-white text-gray-700 rounded-lg hover:bg-gray-50 transition disabled:opacity-50"
          >
            <RefreshCw className={`h-4 w-4 ${isLoadingApplications ? 'animate-spin' : ''}`} />
            Refresh
          </button>
          <button 
            onClick={viewJobDetails}
            className="flex items-center gap-2 px-4 py-2 border border-blue-300 bg-blue-50 text-blue-700 rounded-lg hover:bg-blue-100 transition"
          >
            <Eye className="h-4 w-4" />
            View Job Details
          </button>
          <button 
            onClick={exportApplications}
            disabled={filteredApplications.length === 0}
            className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition disabled:opacity-50"
          >
            <Download className="h-4 w-4" />
            Export Applications
          </button>
        </div>
      </div>
      
      <p className="text-gray-600 mb-4">Track application stages, update student status, and manage recruitment rounds for all students.</p>

      {/* Loading State */}
      {isLoadingApplications && (
        <div className="flex items-center justify-center py-12">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
          <span className="ml-2 text-gray-600">Loading applications...</span>
        </div>
      )}

      {/* Error State */}
      {applicationError && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
          <div className="flex items-center">
            <AlertCircle className="w-5 h-5 text-red-500 mr-2" />
            <span className="text-red-700">{applicationError}</span>
          </div>
          <button
            onClick={loadApplications}
            className="mt-2 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700"
          >
            Retry
          </button>
        </div>
      )}

      {/* Show content only when not loading and no error */}
      {!isLoadingApplications && !applicationError && (
        <>
          {/* Current Job Selection Status */}
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-blue-100 rounded-lg">
                  <Users className="h-5 w-5 text-blue-600" />
                </div>
                <div>
                  <h3 className="font-semibold text-blue-900">All Student Applications</h3>
                  <p className="text-sm text-blue-700">Viewing applications across all job postings</p>
                </div>
              </div>
              <div className="text-right">
                <p className="text-sm font-medium text-blue-900">{filteredApplications.length} Total Applications</p>
                <p className="text-sm text-blue-700">Multiple Job Postings</p>
              </div>
            </div>
          </div>

          {/* Enhanced Pipeline Status Cards */}
          <div className="grid grid-cols-5 gap-4 mb-6">
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 text-center">
              <div className="flex items-center justify-center w-12 h-12 bg-blue-100 rounded-full mx-auto mb-2">
                <Users className="h-6 w-6 text-blue-600" />
              </div>
              <div className="text-2xl font-bold text-blue-600">
                {applicationStats.applied}
              </div>
              <div className="text-sm font-medium text-blue-800">Applied</div>
            </div>

            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 text-center">
              <div className="flex items-center justify-center w-12 h-12 bg-yellow-100 rounded-full mx-auto mb-2">
                <Clock className="h-6 w-6 text-yellow-600" />
              </div>
              <div className="text-2xl font-bold text-yellow-600">
                {applicationStats.viewed}
              </div>
              <div className="text-sm font-medium text-yellow-800">Viewed</div>
            </div>

            <div className="bg-purple-50 border border-purple-200 rounded-lg p-4 text-center">
              <div className="flex items-center justify-center w-12 h-12 bg-purple-100 rounded-full mx-auto mb-2">
                <UserCheck className="h-6 w-6 text-purple-600" />
              </div>
              <div className="text-2xl font-bold text-purple-600">
                {applicationStats.interview_scheduled}
              </div>
              <div className="text-sm font-medium text-purple-800">Interview Scheduled</div>
            </div>

            <div className="bg-green-50 border border-green-200 rounded-lg p-4 text-center">
              <div className="flex items-center justify-center w-12 h-12 bg-green-100 rounded-full mx-auto mb-2">
                <CheckCircle className="h-6 w-6 text-green-600" />
              </div>
              <div className="text-2xl font-bold text-green-600">
                {applicationStats.accepted}
              </div>
              <div className="text-sm font-medium text-green-800">Accepted</div>
            </div>

            <div className="bg-red-50 border border-red-200 rounded-lg p-4 text-center">
              <div className="flex items-center justify-center w-12 h-12 bg-red-100 rounded-full mx-auto mb-2">
                <X className="h-6 w-6 text-red-600" />
              </div>
              <div className="text-2xl font-bold text-red-600">
                {applicationStats.rejected}
              </div>
              <div className="text-sm font-medium text-red-800">Rejected</div>
            </div>
          </div>
      
      <div className="flex gap-2 mb-6">
        <div className="flex-1 relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
          <input
            type="text"
            value={applicationSearchTerm}
            onChange={(e) => setApplicationSearchTerm(e.target.value)}
            placeholder="Search applications by student name, email, or job title..."
            className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
        </div>
        <button 
          onClick={() => setShowApplicationFilterModal(true)}
          className="flex items-center gap-2 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition"
        >
          <Filter className="h-4 w-4" />
          Filter
          {selectedApplicationStatus && (
            <span className="ml-1 px-2 py-0.5 text-xs bg-blue-100 text-blue-800 rounded-full">
              1
            </span>
          )}
        </button>
      </div>

      {/* Applications Table */}
      <div className="bg-white border border-gray-200 rounded-lg overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Student Details
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Academic Info
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Job Applied
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Application Stage
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Status
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {paginatedApplications.length > 0 ? (
                paginatedApplications.map((application) => (
                  <tr key={application.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <div className="flex-shrink-0 h-10 w-10">
                          <div className="h-10 w-10 rounded-full bg-blue-100 flex items-center justify-center">
                            <Users className="h-5 w-5 text-blue-600" />
                          </div>
                        </div>
                        <div className="ml-4">
                          <div className="text-sm font-medium text-gray-900">{application.student?.name || 'Unknown'}</div>
                          <div className="text-sm text-gray-500">{application.student?.email || 'N/A'}</div>
                          <div className="text-sm text-gray-500">{application.student?.id || application.student_id}</div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">{application.student?.branch_field || application.student?.course_name || 'N/A'}</div>
                      <div className="text-sm text-gray-500">CGPA: {application.student?.currentCgpa || 'N/A'}</div>
                      <div className="text-sm text-gray-500">
                        University: {application.student?.university || 'N/A'}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-medium text-gray-900">{application.opportunity?.title || application.opportunity?.job_title || "N/A"}</div>
                      <div className="text-sm text-gray-500">{application.opportunity?.company_name || "N/A"}</div>
                      <div className="text-sm text-gray-500">{application.opportunity?.employment_type} • {application.opportunity?.location}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">{application.notes || 'No notes'}</div>
                      <div className="text-sm text-gray-500">Applied: {new Date(application.applied_at).toLocaleDateString()}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {getStatusBadge(application.application_status)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                      <div className="flex items-center gap-2">
                        <button 
                          onClick={() => viewApplicationDetails(application)}
                          className="text-blue-600 hover:text-blue-900"
                          title="View Application Details"
                        >
                          <Eye className="h-4 w-4" />
                        </button>
                        <button 
                          onClick={() => updateApplicationStage(application)}
                          className="text-green-600 hover:text-green-900"
                          title="Update Application Stage"
                        >
                          <Edit className="h-4 w-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={6} className="px-6 py-12 text-center">
                    <div className="flex flex-col items-center">
                      <Users className="h-12 w-12 text-gray-400 mb-4" />
                      <h3 className="text-lg font-medium text-gray-900 mb-2">
                        No applications found
                      </h3>
                      <p className="text-gray-500 mb-4">
                        {applicationSearchTerm || selectedApplicationStatus
                          ? "Try adjusting your search or filters"
                          : "No student applications found in the system"}
                      </p>
                    </div>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Pagination and Results Summary */}
      {totalItems > 0 && (
        <div className="mt-4 space-y-4">
          {/* Show entries selector and results info */}
          <div className="flex items-center justify-between text-sm text-gray-600">
            <div className="flex items-center gap-2">
              <span>Show</span>
              <select
                value={itemsPerPage}
                onChange={(e) => handleItemsPerPageChange(Number(e.target.value))}
                className="border border-gray-300 rounded px-2 py-1 text-sm"
              >
                <option value={5}>5</option>
                <option value={10}>10</option>
                <option value={20}>20</option>
                <option value={50}>50</option>
                <option value={100}>100</option>
              </select>
              <span>entries</span>
            </div>
            <div>
              Showing {((currentPage - 1) * itemsPerPage) + 1} to {Math.min(currentPage * itemsPerPage, totalItems)} of {totalItems} applications
            </div>
          </div>

          {/* Pagination Controls */}
          {totalPages > 1 && (
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4 text-sm text-gray-600">
                <span>Applied: {applicationStats.applied}</span>
                <span>Viewed: {applicationStats.viewed}</span>
                <span>Interview Scheduled: {applicationStats.interview_scheduled}</span>
                <span>Accepted: {applicationStats.accepted}</span>
                <span>Rejected: {applicationStats.rejected}</span>
              </div>
              
              <div className="flex items-center gap-2">
                <button
                  onClick={() => handlePageChange(currentPage - 1)}
                  disabled={currentPage === 1}
                  className="px-3 py-1 text-sm border border-gray-300 rounded hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Previous
                </button>
                
                {/* Page numbers */}
                <div className="flex items-center gap-1">
                  {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                    let pageNum;
                    if (totalPages <= 5) {
                      pageNum = i + 1;
                    } else if (currentPage <= 3) {
                      pageNum = i + 1;
                    } else if (currentPage >= totalPages - 2) {
                      pageNum = totalPages - 4 + i;
                    } else {
                      pageNum = currentPage - 2 + i;
                    }
                    
                    return (
                      <button
                        key={pageNum}
                        onClick={() => handlePageChange(pageNum)}
                        className={`px-3 py-1 text-sm border rounded ${
                          currentPage === pageNum
                            ? 'bg-blue-600 text-white border-blue-600'
                            : 'border-gray-300 hover:bg-gray-50'
                        }`}
                      >
                        {pageNum}
                      </button>
                    );
                  })}
                </div>
                
                <button
                  onClick={() => handlePageChange(currentPage + 1)}
                  disabled={currentPage === totalPages}
                  className="px-3 py-1 text-sm border border-gray-300 rounded hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Next
                </button>
              </div>
            </div>
          )}
        </div>
      )}
        </>
      )}

      {/* Filter Modal */}
      {showApplicationFilterModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md">
            <h3 className="text-lg font-medium text-gray-900 mb-4">Filter Applications</h3>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Application Status</label>
                <select
                  value={selectedApplicationStatus}
                  onChange={(e) => setSelectedApplicationStatus(e.target.value)}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value="">All Statuses</option>
                  <option value="applied">Applied</option>
                  <option value="viewed">Viewed</option>
                  <option value="under_review">Under Review</option>
                  <option value="interview_scheduled">Interview Scheduled</option>
                  <option value="interviewed">Interviewed</option>
                  <option value="offer_received">Offer Received</option>
                  <option value="accepted">Accepted</option>
                  <option value="rejected">Rejected</option>
                  <option value="withdrawn">Withdrawn</option>
                </select>
              </div>
            </div>

            <div className="flex gap-2 mt-6">
              <button
                onClick={clearApplicationFilters}
                className="flex-1 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition"
              >
                Clear Filters
              </button>
              <button
                onClick={() => setShowApplicationFilterModal(false)}
                className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition"
              >
                Apply Filters
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Student Details Modal */}
      {showStudentDetailsModal && selectedApplication && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            {/* Modal Header */}
            <div className="flex items-center justify-between p-6 border-b border-gray-200">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-blue-100 rounded-lg">
                  <User className="h-5 w-5 text-blue-600" />
                </div>
                <div>
                  <h2 className="text-xl font-bold text-gray-900">Application Details</h2>
                  <p className="text-sm text-gray-600">Student application information</p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <div className="px-3 py-1 bg-purple-100 text-purple-800 rounded-full text-sm font-medium">
                  {getStatusBadge(selectedApplication.application_status)}
                </div>
                <button
                  onClick={() => setShowStudentDetailsModal(false)}
                  className="p-2 hover:bg-gray-100 rounded-lg transition"
                >
                  <X className="h-5 w-5 text-gray-500" />
                </button>
              </div>
            </div>

            <div className="p-6 space-y-6">
              {/* Student Overview */}
              <div className="bg-gradient-to-r from-blue-50 to-purple-50 rounded-lg p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">{selectedApplication.student?.name || 'Unknown'}</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm text-gray-600">Student ID:</p>
                    <p className="font-medium text-gray-900">{selectedApplication.student?.id || selectedApplication.student_id}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">Email Address:</p>
                    <p className="font-medium text-gray-900">{selectedApplication.student?.email || 'N/A'}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">Department:</p>
                    <p className="font-medium text-gray-900">{selectedApplication.student?.branch_field || selectedApplication.student?.course_name || 'N/A'}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">University:</p>
                    <p className="font-medium text-gray-900">{selectedApplication.student?.university || 'N/A'}</p>
                  </div>
                </div>
              </div>

              {/* Personal Information */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="bg-gray-50 rounded-lg p-4">
                  <div className="flex items-center gap-2 mb-3">
                    <User className="h-5 w-5 text-blue-600" />
                    <h4 className="font-semibold text-gray-900">Personal Information</h4>
                  </div>
                  <div className="space-y-2">
                    <div>
                      <p className="text-sm text-gray-600">Full Name</p>
                      <p className="font-medium text-gray-900">{selectedApplication.student?.name || 'Unknown'}</p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-600">Student ID</p>
                      <p className="font-medium text-gray-900">{selectedApplication.student?.id || selectedApplication.student_id}</p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-600">Email Address</p>
                      <p className="font-medium text-gray-900">{selectedApplication.student?.email || 'N/A'}</p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-600">Contact Number</p>
                      <p className="font-medium text-gray-900">{selectedApplication.student?.contact_number || 'N/A'}</p>
                    </div>
                  </div>
                </div>

                <div className="bg-gray-50 rounded-lg p-4">
                  <div className="flex items-center gap-2 mb-3">
                    <GraduationCap className="h-5 w-5 text-green-600" />
                    <h4 className="font-semibold text-gray-900">Academic Information</h4>
                  </div>
                  <div className="space-y-2">
                    <div>
                      <p className="text-sm text-gray-600">Department</p>
                      <p className="font-medium text-gray-900">{selectedApplication.student?.branch_field || selectedApplication.student?.course_name || 'N/A'}</p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-600">CGPA</p>
                      <p className="font-medium text-gray-900">{selectedApplication.student?.currentCgpa || 'N/A'}</p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-600">University</p>
                      <p className="font-medium text-gray-900">{selectedApplication.student?.university || 'N/A'}</p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-600">Expected Graduation</p>
                      <p className="font-medium text-gray-900">{selectedApplication.student?.expectedGraduationDate || 'N/A'}</p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Job Information */}
              <div className="bg-gray-50 rounded-lg p-4">
                <div className="flex items-center gap-2 mb-3">
                  <Award className="h-5 w-5 text-purple-600" />
                  <h4 className="font-semibold text-gray-900">Job Information</h4>
                </div>
                <div className="space-y-2">
                  <div>
                    <p className="text-sm text-gray-600">Job Title:</p>
                    <p className="font-medium text-gray-900">{selectedApplication.opportunity?.title || selectedApplication.opportunity?.job_title || 'N/A'}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">Company:</p>
                    <p className="font-medium text-gray-900">{selectedApplication.opportunity?.company_name || 'N/A'}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">Employment Type:</p>
                    <p className="font-medium text-gray-900">{selectedApplication.opportunity?.employment_type || 'N/A'}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">Location:</p>
                    <p className="font-medium text-gray-900">{selectedApplication.opportunity?.location || 'N/A'}</p>
                  </div>
                </div>
              </div>

              {/* Application Progress */}
              <div className="bg-gray-50 rounded-lg p-4">
                <div className="flex items-center gap-2 mb-3">
                  <Clock className="h-5 w-5 text-orange-600" />
                  <h4 className="font-semibold text-gray-900">Application Progress</h4>
                </div>
                <div className="space-y-2">
                  <div>
                    <p className="text-sm text-gray-600">Current Status:</p>
                    <p className="font-medium text-gray-900">{selectedApplication.application_status.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase())}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">Applied Date:</p>
                    <p className="font-medium text-gray-900">{new Date(selectedApplication.applied_at).toLocaleDateString()}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">Last Updated:</p>
                    <p className="font-medium text-gray-900">{new Date(selectedApplication.updated_at).toLocaleDateString()}</p>
                  </div>
                  {selectedApplication.notes && (
                    <div>
                      <p className="text-sm text-gray-600">Notes:</p>
                      <p className="font-medium text-gray-900">{selectedApplication.notes}</p>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Modal Footer */}
            <div className="flex items-center justify-end gap-3 p-6 border-t border-gray-200 bg-gray-50">
              <button
                onClick={() => setShowStudentDetailsModal(false)}
                className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition"
              >
                Close
              </button>
              <button
                onClick={() => {
                  setShowStudentDetailsModal(false);
                  updateApplicationStage(selectedApplication);
                }}
                className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition"
              >
                <Edit className="h-4 w-4" />
                Update Status
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Update Application Stage Modal */}
      {showUpdateStageModal && selectedApplication && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg w-full max-w-md">
            {/* Modal Header */}
            <div className="flex items-center justify-between p-6 border-b border-gray-200">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-green-100 rounded-lg">
                  <UserCheck className="h-5 w-5 text-green-600" />
                </div>
                <div>
                  <h2 className="text-lg font-bold text-gray-900">Update Application Status</h2>
                  <p className="text-sm text-gray-600">{selectedApplication.student?.name} • {selectedApplication.student?.branch_field || selectedApplication.student?.course_name}</p>
                </div>
              </div>
              <button
                onClick={() => setShowUpdateStageModal(false)}
                className="p-2 hover:bg-gray-100 rounded-lg transition"
              >
                <X className="h-5 w-5 text-gray-500" />
              </button>
            </div>

            <div className="p-6 space-y-4">
              <div>
                <p className="text-sm text-gray-600 mb-2">Current Status: <span className="font-medium">{selectedApplication.application_status.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase())}</span></p>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">New Application Status</label>
                <select
                  value={newApplicationStatus}
                  onChange={(e) => setNewApplicationStatus(e.target.value)}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value="">Select Status</option>
                  <option value="applied">Applied</option>
                  <option value="viewed">Viewed</option>
                  <option value="under_review">Under Review</option>
                  <option value="interview_scheduled">Interview Scheduled</option>
                  <option value="interviewed">Interviewed</option>
                  <option value="offer_received">Offer Received</option>
                  <option value="accepted">Accepted</option>
                  <option value="rejected">Rejected</option>
                  <option value="withdrawn">Withdrawn</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Notes (Optional)</label>
                <textarea
                  value={newApplicationStage}
                  onChange={(e) => setNewApplicationStage(e.target.value)}
                  rows={3}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="Add any notes about this status update..."
                />
              </div>
            </div>

            {/* Modal Footer */}
            <div className="flex items-center justify-end gap-3 p-6 border-t border-gray-200 bg-gray-50">
              <button
                onClick={() => setShowUpdateStageModal(false)}
                className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition"
                disabled={isUpdating}
              >
                Cancel
              </button>
              <button
                onClick={handleStageUpdate}
                disabled={isUpdating || !newApplicationStatus}
                className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isUpdating && <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>}
                <UserCheck className="h-4 w-4" />
                {isUpdating ? 'Updating...' : 'Update Status'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Job Details Modal */}
      {showJobDetailsModal && selectedJobDetails && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg w-full max-w-4xl max-h-[90vh] overflow-y-auto">
            {/* Modal Header */}
            <div className="flex items-center justify-between p-6 border-b border-gray-200">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-purple-100 rounded-lg">
                  <Eye className="h-5 w-5 text-purple-600" />
                </div>
                <div>
                  <h2 className="text-xl font-bold text-gray-900">Job Details & Rounds</h2>
                  <p className="text-sm text-gray-600">View job posting details and recruitment rounds</p>
                </div>
              </div>
              <button
                onClick={() => setShowJobDetailsModal(false)}
                className="p-2 hover:bg-gray-100 rounded-lg transition"
              >
                <X className="h-5 w-5 text-gray-500" />
              </button>
            </div>

            <div className="p-6">
              {isLoadingOpportunities ? (
                <div className="flex items-center justify-center py-12">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                  <span className="ml-2 text-gray-600">Loading opportunities...</span>
                </div>
              ) : hasError ? (
                <div className="text-center py-12">
                  <div className="text-red-500 mb-4">
                    <X className="h-12 w-12 mx-auto" />
                  </div>
                  <h3 className="text-lg font-medium text-gray-900 mb-2">Error Loading Opportunities</h3>
                  <p className="text-gray-500 mb-4">There was an error loading job opportunities. Please try again.</p>
                  <button
                    onClick={() => loadOpportunities()}
                    className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition"
                  >
                    Retry
                  </button>
                </div>
              ) : opportunities.length === 0 ? (
                <div className="text-center py-12">
                  <Eye className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                  <h3 className="text-lg font-medium text-gray-900 mb-2">No Job Opportunities Found</h3>
                  <p className="text-gray-500">No active job opportunities are currently available in the system.</p>
                </div>
              ) : (
                <>
                  {/* Job Selection Dropdown */}
                  <div className="mb-6">
                    <label className="block text-sm font-medium text-gray-700 mb-2">Select Job Posting</label>
                    <select
                      value={selectedJobDetails.id}
                      onChange={(e) => {
                        const job = opportunities.find(j => j.id === parseInt(e.target.value));
                        if (job) setSelectedJobDetails(job);
                      }}
                      className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    >
                      {opportunities.map(job => (
                        <option key={job.id} value={job.id}>
                          {job.title} - {job.company_name}
                        </option>
                      ))}
                    </select>
                  </div>

                  {/* Job Overview */}
                  <div className="bg-gradient-to-r from-blue-50 to-purple-50 rounded-lg p-6 mb-6">
                    <h3 className="text-xl font-bold text-gray-900 mb-2">{selectedJobDetails.title}</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <p className="text-sm text-gray-600">Company:</p>
                        <p className="font-medium text-gray-900">{selectedJobDetails.company_name || 'Not specified'}</p>
                      </div>
                      <div>
                        <p className="text-sm text-gray-600">Department:</p>
                        <p className="font-medium text-gray-900">{selectedJobDetails.department}</p>
                      </div>
                      <div>
                        <p className="text-sm text-gray-600">Location:</p>
                        <p className="font-medium text-gray-900">{selectedJobDetails.location}</p>
                      </div>
                      <div>
                        <p className="text-sm text-gray-600">Mode:</p>
                        <p className="font-medium text-gray-900">{selectedJobDetails.mode || 'Not specified'}</p>
                      </div>
                      <div>
                        <p className="text-sm text-gray-600">Salary:</p>
                        <p className="font-medium text-gray-900">
                          {opportunitiesService.formatSalary(selectedJobDetails)}
                        </p>
                      </div>
                      <div>
                        <p className="text-sm text-gray-600">Experience:</p>
                        <p className="font-medium text-gray-900">{selectedJobDetails.experience_required || 'Not specified'}</p>
                      </div>
                    </div>
                  </div>

                  {/* Job Description */}
                  {selectedJobDetails.description && (
                    <div className="bg-gray-50 rounded-lg p-6 mb-6">
                      <h4 className="text-lg font-semibold text-gray-900 mb-4">Job Description</h4>
                      <p className="text-gray-700 whitespace-pre-wrap">{selectedJobDetails.description}</p>
                    </div>
                  )}

                  {/* Skills Required */}
                  {selectedJobDetails.skills_required && (
                    <div className="bg-gray-50 rounded-lg p-6 mb-6">
                      <h4 className="text-lg font-semibold text-gray-900 mb-4">Skills Required</h4>
                      <div className="flex flex-wrap gap-2">
                        {opportunitiesService.formatSkills(selectedJobDetails.skills_required).map((skill, index) => (
                          <span key={index} className="px-3 py-1 bg-blue-100 text-blue-800 rounded-full text-sm font-medium">
                            {skill}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Requirements */}
                  {selectedJobDetails.requirements && (
                    <div className="bg-gray-50 rounded-lg p-6 mb-6">
                      <h4 className="text-lg font-semibold text-gray-900 mb-4">Requirements</h4>
                      <div className="text-gray-700">
                        {Array.isArray(selectedJobDetails.requirements) ? (
                          <ul className="list-disc list-inside space-y-1">
                            {selectedJobDetails.requirements.map((req, index) => (
                              <li key={index}>{req}</li>
                            ))}
                          </ul>
                        ) : (
                          <p className="whitespace-pre-wrap">{selectedJobDetails.requirements}</p>
                        )}
                      </div>
                    </div>
                  )}

                  {/* Responsibilities */}
                  {selectedJobDetails.responsibilities && (
                    <div className="bg-gray-50 rounded-lg p-6 mb-6">
                      <h4 className="text-lg font-semibold text-gray-900 mb-4">Responsibilities</h4>
                      <div className="text-gray-700">
                        {Array.isArray(selectedJobDetails.responsibilities) ? (
                          <ul className="list-disc list-inside space-y-1">
                            {selectedJobDetails.responsibilities.map((resp, index) => (
                              <li key={index}>{resp}</li>
                            ))}
                          </ul>
                        ) : (
                          <p className="whitespace-pre-wrap">{selectedJobDetails.responsibilities}</p>
                        )}
                      </div>
                    </div>
                  )}

                  {/* Benefits */}
                  {selectedJobDetails.benefits && (
                    <div className="bg-gray-50 rounded-lg p-6 mb-6">
                      <h4 className="text-lg font-semibold text-gray-900 mb-4">Benefits</h4>
                      <div className="text-gray-700">
                        {Array.isArray(selectedJobDetails.benefits) ? (
                          <ul className="list-disc list-inside space-y-1">
                            {selectedJobDetails.benefits.map((benefit, index) => (
                              <li key={index}>{benefit}</li>
                            ))}
                          </ul>
                        ) : (
                          <p className="whitespace-pre-wrap">{selectedJobDetails.benefits}</p>
                        )}
                      </div>
                    </div>
                  )}

                  {/* Application Statistics */}
                  <div className="bg-gray-50 rounded-lg p-6">
                    <h4 className="text-lg font-semibold text-gray-900 mb-4">Application Statistics</h4>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <div>
                        <p className="text-sm text-gray-600">Total Applications:</p>
                        <p className="font-medium text-gray-900">{selectedJobDetails.applications_count || 0}</p>
                      </div>
                      <div>
                        <p className="text-sm text-gray-600">Total Views:</p>
                        <p className="font-medium text-gray-900">{selectedJobDetails.views_count || 0}</p>
                      </div>
                      <div>
                        <p className="text-sm text-gray-600">Messages:</p>
                        <p className="font-medium text-gray-900">{selectedJobDetails.messages_count || 0}</p>
                      </div>
                    </div>
                  </div>
                </>
              )}
            </div>

            {/* Modal Footer */}
            <div className="flex items-center justify-end gap-3 p-6 border-t border-gray-200 bg-gray-50">
              <button
                onClick={() => setShowJobDetailsModal(false)}
                className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition"
              >
                Close
              </button>
              {selectedJobDetails && (
                <button
                  onClick={() => {
                    const exportData = {
                      job_details: selectedJobDetails,
                      export_timestamp: new Date().toISOString()
                    };

                    const blob = new Blob([JSON.stringify(exportData, null, 2)], { type: 'application/json' });
                    const link = document.createElement('a');
                    const url = URL.createObjectURL(blob);
                    link.setAttribute('href', url);
                    link.setAttribute('download', `${selectedJobDetails.title.replace(/[^a-z0-9]/gi, '_').toLowerCase()}_job_details.json`);
                    link.style.visibility = 'hidden';
                    document.body.appendChild(link);
                    link.click();
                    document.body.removeChild(link);
                    URL.revokeObjectURL(url);
                    
                    toast.success("Job details exported successfully");
                  }}
                  className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition"
                >
                  <Download className="h-4 w-4" />
                  Export Job Details
                </button>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ApplicationTracking;