import React, { useState, useEffect } from 'react';
import { 
  Briefcase, 
  Clock, 
  CheckCircle2, 
  XCircle, 
  Calendar, 
  Building2, 
  MapPin, 
  DollarSign,
  Eye,
  Filter,
  Search,
  TrendingUp,
  MessageSquare,
  ArrowRight,
  Users,
  AlertCircle,
  Video,
  Award,
  Bell,
  FileText
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useStudentDataByEmail } from '../../hooks/useStudentDataByEmail';
import AppliedJobsService from '../../services/appliedJobsService';
import StudentPipelineService from '../../services/studentPipelineService';
import { MessageModal } from '../../components/messaging/MessageModal';
import useMessageNotifications from '../../hooks/useMessageNotifications';

const Applications = () => {
  const { user } = useAuth();
  const userEmail = localStorage.getItem('userEmail') || user?.email;
  const { studentData } = useStudentDataByEmail(userEmail);
  const studentId = studentData?.id || user?.id;
  
  const [applications, setApplications] = useState([]);
  const [filteredApplications, setFilteredApplications] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [messageModalOpen, setMessageModalOpen] = useState(false);
  const [selectedApplication, setSelectedApplication] = useState(null);
  const [pipelineStatuses, setPipelineStatuses] = useState([]);
  const [interviews, setInterviews] = useState([]);
  const [showPipelineView, setShowPipelineView] = useState(true);
  const [viewDetailsModalOpen, setViewDetailsModalOpen] = useState(false);
  const [detailsApplication, setDetailsApplication] = useState(null);
  const [showPipelineStatus, setShowPipelineStatus] = useState({});
  
  useMessageNotifications({
    userId: studentId,
    userType: 'student',
    enabled: !!studentId
  });

  // Fetch applications with pipeline status
  useEffect(() => {
    const fetchApplications = async () => {
      if (!studentId) {
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        setError(null);
        
        // Fetch applications with pipeline data
        const applicationsData = await StudentPipelineService.getStudentApplicationsWithPipeline(
          studentId, 
          userEmail
        );
        
        if (applicationsData[0]) {
        }
        
        // Fetch interviews separately
        const interviewsData = await StudentPipelineService.getStudentInterviews(studentId);
        setInterviews(interviewsData);

        const transformedApplications = applicationsData.map(app => ({
          id: app.id,
          studentId: app.student_id,
          jobTitle: app.opportunity?.job_title || app.opportunity?.title || 'N/A',
          company: app.opportunity?.company_name || 'N/A',
          location: app.opportunity?.location || 'N/A',
          salary: app.opportunity?.salary_range_min && app.opportunity?.salary_range_max
            ? `$${(app.opportunity.salary_range_min / 1000).toFixed(0)}k - $${(app.opportunity.salary_range_max / 1000).toFixed(0)}k`
            : 'Not specified',
          appliedDate: app.applied_at?.split('T')[0] || new Date().toISOString().split('T')[0],
          status: app.application_status,
          logo: app.opportunity?.company_logo,
          type: app.opportunity?.employment_type || 'N/A',
          level: app.opportunity?.experience_level || app.opportunity?.department || 'N/A',
          lastUpdate: formatLastUpdate(app.updated_at || app.applied_at),
          opportunityId: app.opportunity_id,
          recruiterId: app.opportunity?.recruiter_id || null,
          
          // Pipeline data
          pipelineStatus: app.pipeline_status,
          hasPipelineStatus: app.has_pipeline_status,
          pipelineStage: app.pipeline_stage,
          pipelineStageChangedAt: app.pipeline_stage_changed_at,
          rejectionReason: app.rejection_reason,
          nextAction: app.next_action,
          nextActionDate: app.next_action_date,
          interviews: app.interviews || []
        }));


        setApplications(transformedApplications);
        setFilteredApplications(transformedApplications);
      } catch (err) {
        console.error('Error fetching applications:', err);
        setError(err.message || 'Failed to load applications');
      } finally {
        setLoading(false);
      }
    };

    fetchApplications();
  }, [studentId, userEmail]);

  // Subscribe to real-time pipeline updates
  useEffect(() => {
    if (!studentId) return;

    const channel = StudentPipelineService.subscribeToPipelineUpdates(
      studentId,
      (payload) => {
        // Refresh applications when pipeline updates
        window.location.reload(); // Simple refresh, can be optimized
      }
    );

    return () => {
      StudentPipelineService.unsubscribeFromPipelineUpdates(channel);
    };
  }, [studentId]);

  const formatLastUpdate = (dateString) => {
    if (!dateString) return 'Recently';
    const diffDays = Math.ceil(Math.abs(new Date() - new Date(dateString)) / (1000 * 60 * 60 * 24));
    
    if (diffDays === 0) return 'Today';
    if (diffDays === 1) return '1 day ago';
    if (diffDays < 7) return `${diffDays} days ago`;
    if (diffDays < 14) return '1 week ago';
    if (diffDays < 30) return `${Math.floor(diffDays / 7)} weeks ago`;
    if (diffDays < 60) return '1 month ago';
    return `${Math.floor(diffDays / 30)} months ago`;
  };

  useEffect(() => {
    let filtered = applications;

    if (statusFilter !== 'all') {
      filtered = filtered.filter(app => app.status === statusFilter);
    }

    if (searchQuery) {
      filtered = filtered.filter(app =>
        app.jobTitle.toLowerCase().includes(searchQuery.toLowerCase()) ||
        app.company.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }

    setFilteredApplications(filtered);
  }, [searchQuery, statusFilter, applications]);

  const getStatusConfig = (status) => {
    const configs = {
      applied: {
        label: 'Applied',
        icon: Clock,
        color: 'text-blue-700',
        bg: 'bg-blue-50',
        border: 'border-blue-300'
      },
      viewed: {
        label: 'Viewed',
        icon: Eye,
        color: 'text-purple-700',
        bg: 'bg-purple-50',
        border: 'border-purple-300'
      },
      under_review: {
        label: 'Under Review',
        icon: Clock,
        color: 'text-slate-700',
        bg: 'bg-slate-50',
        border: 'border-slate-300'
      },
      interview_scheduled: {
        label: 'Interview Scheduled',
        icon: Calendar,
        color: 'text-indigo-700',
        bg: 'bg-indigo-50',
        border: 'border-indigo-200'
      },
      interviewed: {
        label: 'Interviewed',
        icon: CheckCircle2,
        color: 'text-cyan-700',
        bg: 'bg-cyan-50',
        border: 'border-cyan-200'
      },
      offer_received: {
        label: 'Offer Received',
        icon: TrendingUp,
        color: 'text-green-700',
        bg: 'bg-green-50',
        border: 'border-green-200'
      },
      accepted: {
        label: 'Accepted',
        icon: CheckCircle2,
        color: 'text-emerald-700',
        bg: 'bg-emerald-50',
        border: 'border-emerald-200'
      },
      rejected: {
        label: 'Rejected',
        icon: XCircle,
        color: 'text-gray-600',
        bg: 'bg-gray-50',
        border: 'border-gray-300'
      },
      withdrawn: {
        label: 'Withdrawn',
        icon: XCircle,
        color: 'text-orange-600',
        bg: 'bg-orange-50',
        border: 'border-orange-300'
      }
    };
    return configs[status] || configs.applied;
  };

  // Pipeline stage configuration with actionable guidance
  const getPipelineStageConfig = (stage) => {
    const configs = {
      sourced: {
        label: 'Sourced',
        icon: Users,
        color: 'text-gray-700',
        bg: 'bg-gray-100',
        order: 1,
        description: 'Your profile has been identified as a potential match!',
        nextSteps: [
          'Keep your profile updated with latest skills and experience',
          'Be available for recruiter communication',
          'Ensure your contact details are current'
        ],
        waitTime: 'Usually moves to screening within 3-5 business days',
        studentAction: 'No action required - Wait for recruiter to review your profile'
      },
      screened: {
        label: 'Screened',
        icon: Eye,
        color: 'text-blue-700',
        bg: 'bg-blue-100',
        order: 2,
        description: 'Your profile is being reviewed by the hiring team!',
        nextSteps: [
          'Review the job description thoroughly',
          'Prepare for potential screening call',
          'Update your availability for interviews'
        ],
        waitTime: 'Interview scheduling typically within 5-7 business days',
        studentAction: 'Be ready to respond to interview invitations quickly'
      },
      interview_1: {
        label: 'Interview Round 1',
        icon: Video,
        color: 'text-indigo-700',
        bg: 'bg-indigo-100',
        order: 3,
        description: 'First interview scheduled - Great progress!',
        nextSteps: [
          'Research the company and role thoroughly',
          'Prepare answers to common interview questions',
          'Test your video/audio setup if virtual',
          'Prepare questions to ask the interviewer'
        ],
        waitTime: 'Results usually shared within 2-3 business days',
        studentAction: 'Prepare well and attend your scheduled interview'
      },
      interview_2: {
        label: 'Interview Round 2',
        icon: Video,
        color: 'text-purple-700',
        bg: 'bg-purple-100',
        order: 4,
        description: 'Advanced to second round - Excellent!',
        nextSteps: [
          'Review feedback from first interview if shared',
          'Prepare for more technical/behavioral questions',
          'Be ready to discuss salary expectations',
          'Prepare portfolio or work samples if applicable'
        ],
        waitTime: 'Final decision typically within 3-5 business days',
        studentAction: 'Attend interview and follow up with thank you note'
      },
      offer: {
        label: 'Offer Stage',
        icon: Award,
        color: 'text-green-700',
        bg: 'bg-green-100',
        order: 5,
        description: 'Congratulations! Offer is being prepared 🎉',
        nextSteps: [
          'Review offer details carefully when received',
          'Consider salary, benefits, and work culture',
          'Ask questions if anything is unclear',
          'Negotiate if needed before accepting'
        ],
        waitTime: 'Offer letter usually sent within 2-3 business days',
        studentAction: 'Wait for formal offer letter and review terms'
      },
      hired: {
        label: 'Hired',
        icon: CheckCircle2,
        color: 'text-emerald-700',
        bg: 'bg-emerald-100',
        order: 6,
        description: 'You\'re hired! Welcome to the team! 🎊',
        nextSteps: [
          'Complete onboarding documentation',
          'Prepare for your first day',
          'Connect with your team members',
          'Review company policies and guidelines'
        ],
        waitTime: 'Onboarding details will be shared shortly',
        studentAction: 'Prepare for your start date and complete all paperwork'
      },
      rejected: {
        label: 'Not Selected',
        icon: XCircle,
        color: 'text-red-700',
        bg: 'bg-red-100',
        order: 7,
        description: 'This position didn\'t work out, but don\'t give up!',
        nextSteps: [
          'Review feedback to improve future applications',
          'Apply to similar positions',
          'Update your skills based on feedback',
          'Stay connected - new opportunities may arise'
        ],
        waitTime: 'Keep applying to other opportunities',
        studentAction: 'Learn from the experience and continue your job search'
      }
    };
    return configs[stage] || configs.sourced;
  };

  // Toggle function for pipeline status visibility
  const togglePipelineStatus = (applicationId) => {
    setShowPipelineStatus(prev => ({
      ...prev,
      [applicationId]: !prev[applicationId]
    }));
  };

  const stats = [
    { label: 'Total Applied', value: applications.length, icon: Briefcase, color: 'bg-slate-700' },
    { label: 'Under Review', value: applications.filter(a => a.status === 'under_review').length, icon: Eye, color: 'bg-slate-600' },
    { label: 'Interviews', value: applications.filter(a => a.status === 'interview_scheduled' || a.interviews?.length > 0).length, icon: Calendar, color: 'bg-slate-600' },
    { label: 'In Pipeline', value: applications.filter(a => a.hasPipelineStatus).length, icon: TrendingUp, color: 'bg-slate-700' },
    { label: 'Accepted', value: applications.filter(a => a.status === 'accepted').length, icon: CheckCircle2, color: 'bg-slate-700' }
  ];

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="flex flex-col items-center space-y-4">
          <div className="animate-spin rounded-full h-16 w-16 border-t-4 border-b-4 border-slate-700"></div>
          <p className="text-gray-600 font-medium">Loading applications...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <XCircle className="w-16 h-16 text-red-500 mx-auto mb-4" />
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Error Loading Applications</h2>
          <p className="text-gray-600">{error}</p>
        </div>
      </div>
    );
  }

  if (!studentId) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <Briefcase className="w-16 h-16 text-gray-400 mx-auto mb-4" />
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Please Log In</h2>
          <p className="text-gray-600">You need to be logged in to view your applications.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-3">
              <Briefcase className="w-8 h-8 text-slate-700" />
              My Applications
            </h1>
            <p className="text-gray-600 mt-1">Track and manage your job applications</p>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {stats.map((stat, index) => (
            <div
              key={index}
              className="bg-white rounded-lg shadow-sm p-6 hover:shadow-md transition-all duration-200 border border-gray-200"
            >
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600 font-medium">{stat.label}</p>
                  <p className="text-3xl font-bold text-gray-900 mt-2">{stat.value}</p>
                </div>
                <div className={`${stat.color} rounded-lg p-3`}>
                  <stat.icon className="w-6 h-6 text-white" />
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Filters */}
        <div className="bg-white rounded-lg shadow-sm p-6 border border-gray-200">
          <div className="flex flex-col md:flex-row gap-4">
            {/* Search */}
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
              <input
                type="text"
                placeholder="Search by job title or company..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-slate-500 focus:border-transparent transition-all"
              />
            </div>

            {/* Status Filter */}
            <div className="relative">
              <Filter className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-slate-500 focus:border-transparent transition-all appearance-none bg-white cursor-pointer min-w-[200px]"
              >
              <option value="all">All Status</option>
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
        </div>

        {/* Applications List */}
        <div className="space-y-4">
          {filteredApplications.length === 0 ? (
            <div className="bg-white rounded-lg shadow-sm p-12 text-center border border-gray-200">
              <Briefcase className="w-16 h-16 text-gray-300 mx-auto mb-4" />
              <h3 className="text-xl font-semibold text-gray-900 mb-2">No applications found</h3>
              <p className="text-gray-600">Try adjusting your search or filters</p>
            </div>
          ) : (
            filteredApplications.map((app) => {
              const statusConfig = getStatusConfig(app.status);
              const StatusIcon = statusConfig.icon;

              return (
                <div
                  key={app.id}
                  className="bg-white rounded-lg shadow-sm hover:shadow-md transition-all duration-200 border border-gray-200 overflow-hidden group"
                >
                  <div className="p-6">
                    <div className="flex flex-col lg:flex-row lg:items-center gap-6">
                      {/* Company Logo */}
                      <div className="flex-shrink-0">
                        <div className="w-16 h-16 rounded-lg bg-slate-100 flex items-center justify-center overflow-hidden">
                          <Building2 className="w-8 h-8 text-slate-600" />
                        </div>
                      </div>

                      {/* Job Details */}
                      <div className="flex-1 space-y-3">
                        <div className="flex items-start justify-between gap-4">
                          <div>
                            <h3 className="text-xl font-bold text-gray-900 group-hover:text-slate-700 transition-colors">
                              {app.jobTitle}
                            </h3>
                            <p className="text-gray-600 font-medium mt-1">{app.company}</p>
                          </div>
                          <div className={`flex items-center gap-2 px-3 py-1.5 rounded-full ${statusConfig.bg} ${statusConfig.border} border`}>
                            <StatusIcon className={`w-4 h-4 ${statusConfig.color}`} />
                            <span className={`text-sm font-semibold ${statusConfig.color}`}>
                              {statusConfig.label}
                            </span>
                          </div>
                        </div>

                        <div className="flex flex-wrap items-center gap-4 text-sm text-gray-600">
                          <div className="flex items-center gap-1.5">
                            <MapPin className="w-4 h-4" />
                            <span>{app.location}</span>
                          </div>
                          <div className="flex items-center gap-1.5">
                            <DollarSign className="w-4 h-4" />
                            <span>{app.salary}</span>
                          </div>
                          <div className="flex items-center gap-1.5">
                            <Clock className="w-4 h-4" />
                            <span>Applied {new Date(app.appliedDate).toLocaleDateString()}</span>
                          </div>
                          <div className="flex items-center gap-1.5">
                            <TrendingUp className="w-4 h-4" />
                            <span>Updated {app.lastUpdate}</span>
                          </div>
                        </div>

                        <div className="flex flex-wrap gap-2">
                          <span className="px-3 py-1 bg-slate-100 text-slate-700 rounded-full text-xs font-semibold">
                            {app.type}
                          </span>
                          <span className="px-3 py-1 bg-gray-100 text-gray-700 rounded-full text-xs font-semibold">
                            {app.level}
                          </span>
                        </div>

                        {/* Pipeline Status Section */}
                        {app.hasPipelineStatus && (
                          <div className="mt-4 p-5 bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50 rounded-xl border-2 border-slate-200 shadow-sm">
                            <div className="flex items-center justify-between mb-4">
                              <div className="flex items-center gap-2">
                                <div className="p-2 bg-white rounded-lg shadow-sm">
                                  <Users className="w-5 h-5 text-slate-700" />
                                </div>
                                <h4 className="font-bold text-slate-900">Recruitment Pipeline Status</h4>
                              </div>
                              <button
                                onClick={() => togglePipelineStatus(app.id)}
                                className="p-2 hover:bg-white hover:shadow-sm rounded-lg transition-all duration-200 group"
                                title={showPipelineStatus[app.id] ? "Hide pipeline details" : "Show pipeline details"}
                              >
                                <FileText className={`w-5 h-5 transition-colors duration-200 ${
                                  showPipelineStatus[app.id] ? 'text-slate-700' : 'text-slate-400 group-hover:text-slate-600'
                                }`} />
                              </button>
                            </div>
                            
                            {/* Collapsed view - just show current stage */}
                            {!showPipelineStatus[app.id] && app.pipelineStage && (
                              <div className="bg-white rounded-lg p-3 shadow-sm border border-slate-200">
                                <div className="flex items-center justify-between">
                                  <span className="text-sm font-medium text-gray-600">Current Stage:</span>
                                  <div className={`flex items-center gap-2 px-3 py-1.5 rounded-full ${getPipelineStageConfig(app.pipelineStage).bg} border-2 ${getPipelineStageConfig(app.pipelineStage).bg.replace('bg-', 'border-')}`}>
                                    {React.createElement(getPipelineStageConfig(app.pipelineStage).icon, {
                                      className: `w-4 h-4 ${getPipelineStageConfig(app.pipelineStage).color}`
                                    })}
                                    <span className={`text-sm font-bold ${getPipelineStageConfig(app.pipelineStage).color}`}>
                                      {getPipelineStageConfig(app.pipelineStage).label}
                                    </span>
                                  </div>
                                </div>
                                <p className="text-sm text-gray-700 font-medium mt-2">
                                  {getPipelineStageConfig(app.pipelineStage).description}
                                </p>
                              </div>
                            )}
                            
                            {/* Expanded view - show all details */}
                            {showPipelineStatus[app.id] && (
                            <div className="space-y-4">
                              {/* Current Stage with Description */}
                              {app.pipelineStage && (
                                <>
                                  <div className="bg-white rounded-lg p-3 shadow-sm border border-slate-200">
                                    <div className="flex items-center justify-between mb-2">
                                      <span className="text-sm font-medium text-gray-600">Current Stage:</span>
                                      <div className={`flex items-center gap-2 px-3 py-1.5 rounded-full ${getPipelineStageConfig(app.pipelineStage).bg} border-2 ${getPipelineStageConfig(app.pipelineStage).bg.replace('bg-', 'border-')}`}>
                                        {React.createElement(getPipelineStageConfig(app.pipelineStage).icon, {
                                          className: `w-4 h-4 ${getPipelineStageConfig(app.pipelineStage).color}`
                                        })}
                                        <span className={`text-sm font-bold ${getPipelineStageConfig(app.pipelineStage).color}`}>
                                          {getPipelineStageConfig(app.pipelineStage).label}
                                        </span>
                                      </div>
                                    </div>
                                    <p className="text-sm text-gray-700 font-medium mt-2">
                                      {getPipelineStageConfig(app.pipelineStage).description}
                                    </p>
                                  </div>

                                  {/* What You Need to Do */}
                                  <div className="bg-white rounded-lg p-4 shadow-sm border-l-4 border-blue-500">
                                    <div className="flex items-start gap-2 mb-3">
                                      <CheckCircle2 className="w-5 h-5 text-blue-600 mt-0.5 flex-shrink-0" />
                                      <div className="flex-1">
                                        <h5 className="text-sm font-bold text-gray-900 mb-1">What You Need to Do:</h5>
                                        <p className="text-sm text-blue-700 font-semibold bg-blue-50 px-3 py-2 rounded-lg">
                                          {getPipelineStageConfig(app.pipelineStage).studentAction}
                                        </p>
                                      </div>
                                    </div>
                                  </div>

                                  {/* Next Steps Checklist */}
                                  <div className="bg-white rounded-lg p-4 shadow-sm border border-gray-200">
                                    <h5 className="text-sm font-bold text-gray-900 mb-3 flex items-center gap-2">
                                      <ArrowRight className="w-4 h-4 text-indigo-600" />
                                      Recommended Next Steps:
                                    </h5>
                                    <ul className="space-y-2">
                                      {getPipelineStageConfig(app.pipelineStage).nextSteps.map((step, idx) => (
                                        <li key={idx} className="flex items-start gap-2 text-sm text-gray-700">
                                          <div className="w-5 h-5 rounded-full bg-indigo-100 flex items-center justify-center flex-shrink-0 mt-0.5">
                                            <span className="text-xs font-bold text-indigo-700">{idx + 1}</span>
                                          </div>
                                          <span>{step}</span>
                                        </li>
                                      ))}
                                    </ul>
                                  </div>

                                  {/* Timeline Expectation */}
                                  <div className="bg-amber-50 rounded-lg p-3 border border-amber-200">
                                    <div className="flex items-start gap-2">
                                      <Clock className="w-4 h-4 text-amber-600 mt-0.5 flex-shrink-0" />
                                      <div className="flex-1">
                                        <p className="text-xs font-medium text-amber-900">Expected Timeline:</p>
                                        <p className="text-xs text-amber-700 mt-1">
                                          {getPipelineStageConfig(app.pipelineStage).waitTime}
                                        </p>
                                      </div>
                                    </div>
                                  </div>
                                </>
                              )}

                              {/* Stage Changed Date */}
                              {app.pipelineStageChangedAt && (
                                <div className="flex items-center justify-between text-xs text-gray-500 pt-2 border-t border-gray-200">
                                  <span>Last stage update:</span>
                                  <span className="font-medium">{new Date(app.pipelineStageChangedAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}</span>
                                </div>
                              )}

                              {/* Next Action */}
                              {app.nextAction && (
                                <div className="flex items-start gap-2 p-3 bg-blue-100 rounded-lg border-2 border-blue-300">
                                  <Bell className="w-5 h-5 text-blue-700 mt-0.5 flex-shrink-0 animate-pulse" />
                                  <div className="flex-1">
                                    <p className="text-xs font-bold text-blue-900 uppercase tracking-wide">Upcoming Action:</p>
                                    <p className="text-sm font-semibold text-blue-800 mt-1">{app.nextAction.replace(/_/g, ' ').toUpperCase()}</p>
                                    {app.nextActionDate && (
                                      <p className="text-xs text-blue-700 mt-1 flex items-center gap-1">
                                        <Calendar className="w-3 h-3" />
                                        Scheduled: {new Date(app.nextActionDate).toLocaleDateString()}
                                      </p>
                                    )}
                                  </div>
                                </div>
                              )}

                              {/* Rejection Reason */}
                              {app.rejectionReason && (
                                <div className="flex items-start gap-2 p-3 bg-red-50 rounded-lg border-2 border-red-200">
                                  <AlertCircle className="w-5 h-5 text-red-600 mt-0.5 flex-shrink-0" />
                                  <div className="flex-1">
                                    <p className="text-xs font-bold text-red-900 uppercase tracking-wide">Feedback from Recruiter:</p>
                                    <p className="text-sm text-red-700 mt-1">{app.rejectionReason}</p>
                                  </div>
                                </div>
                              )}

                              {/* Scheduled Interviews */}
                              {app.interviews && app.interviews.length > 0 && (
                                <div className="bg-white rounded-lg p-4 shadow-sm border-2 border-indigo-200">
                                  <h5 className="text-sm font-bold text-gray-900 mb-3 flex items-center gap-2">
                                    <Video className="w-5 h-5 text-indigo-600" />
                                    Scheduled Interviews ({app.interviews.length})
                                  </h5>
                                  <div className="space-y-2">
                                    {app.interviews.map((interview, idx) => (
                                      <div key={idx} className="flex items-center justify-between p-3 bg-indigo-50 rounded-lg border border-indigo-200 hover:bg-indigo-100 transition-colors">
                                        <div className="flex-1">
                                          <p className="font-semibold text-gray-900">{interview.type} Interview</p>
                                          <p className="text-sm text-gray-600 mt-0.5">with {interview.interviewer}</p>
                                          {interview.meeting_link && (
                                            <a 
                                              href={interview.meeting_link} 
                                              target="_blank" 
                                              rel="noopener noreferrer"
                                              className="text-xs text-blue-600 hover:text-blue-800 underline mt-1 inline-block"
                                            >
                                              Join Meeting →
                                            </a>
                                          )}
                                        </div>
                                        <div className="text-right ml-4">
                                          <p className="font-bold text-indigo-700">
                                            {new Date(interview.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                                          </p>
                                          <p className="text-sm text-gray-600">
                                            {new Date(interview.date).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                          </p>
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
                      </div>

                      {/* Actions */}
                      <div className="flex-shrink-0 flex lg:flex-col gap-2">
                        <button 
                          onClick={() => {
                            setDetailsApplication(app);
                            setViewDetailsModalOpen(true);
                          }}
                          className="flex-1 lg:flex-none px-4 py-2 bg-slate-700 hover:bg-slate-800 text-white rounded-lg font-medium transition-colors flex items-center justify-center gap-2"
                        >
                          <Eye className="w-4 h-4" />
                          View Details
                        </button>
                        <button 
                          onClick={() => {
                            setSelectedApplication(app);
                            setMessageModalOpen(true);
                          }}
                          disabled={!app.recruiterId || !app.studentId}
                          className="flex-1 lg:flex-none px-4 py-2 bg-white border-2 border-gray-300 hover:border-slate-700 text-gray-700 hover:text-slate-700 rounded-lg font-medium transition-colors flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                          <MessageSquare className="w-4 h-4" />
                          Message
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>
      
      {/* Message Modal */}
      {selectedApplication && selectedApplication.recruiterId && selectedApplication.studentId && (
        <MessageModal
          isOpen={messageModalOpen}
          onClose={() => {
            setMessageModalOpen(false);
            setSelectedApplication(null);
          }}
          studentId={selectedApplication.studentId}
          recruiterId={selectedApplication.recruiterId}
          studentName={studentData?.name || studentData?.profile?.name || 'Student'}
          applicationId={selectedApplication.id}
          opportunityId={selectedApplication.opportunityId}
          jobTitle={selectedApplication.jobTitle}
          currentUserId={studentId}
          currentUserType="student"
        />
      )}

      {/* View Details Modal */}
      {detailsApplication && (
        <ApplicationDetailsModal
          isOpen={viewDetailsModalOpen}
          onClose={() => {
            setViewDetailsModalOpen(false);
            setDetailsApplication(null);
          }}
          application={detailsApplication}
          interviews={interviews.filter(i => i.requisition_id === detailsApplication.opportunityId)}
        />
      )}
    </div>
  );
};

// Application Details Modal Component
const ApplicationDetailsModal = ({ isOpen, onClose, application, interviews }) => {
  if (!isOpen) return null;

  // Debug logging
    hasPipelineStatus: application.hasPipelineStatus,
    pipelineStage: application.pipelineStage,
    pipelineStatus: application.pipelineStatus,
    fullApplication: application
  });

  // Helper function to get stage order
  const getStageOrder = (stage) => {
    const stageOrder = {
      sourced: 1,
      screened: 2,
      interview_1: 3,
      interview_2: 4,
      offer: 5,
      hired: 6,
      rejected: -1
    };
    return stageOrder[stage] || 0;
  };

  const stageConfig = {
    sourced: { label: 'Sourced', color: 'bg-blue-100 text-blue-800', icon: Users },
    screened: { label: 'Screened', color: 'bg-purple-100 text-purple-800', icon: CheckCircle2 },
    interview_1: { label: 'Interview 1', color: 'bg-orange-100 text-orange-800', icon: Video },
    interview_2: { label: 'Interview 2', color: 'bg-pink-100 text-pink-800', icon: Video },
    offer: { label: 'Offer', color: 'bg-green-100 text-green-800', icon: Award },
    hired: { label: 'Hired', color: 'bg-emerald-100 text-emerald-800', icon: CheckCircle2 },
    rejected: { label: 'Rejected', color: 'bg-red-100 text-red-800', icon: XCircle }
  };

  const currentStageConfig = application.pipelineStage ? stageConfig[application.pipelineStage] : null;
  const StageIcon = currentStageConfig?.icon || Briefcase;


  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-2xl max-w-3xl w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="bg-gradient-to-r from-slate-700 to-slate-900 p-6 text-white sticky top-0 z-10">
          <div className="flex items-start justify-between">
            <div className="flex-1">
              <h2 className="text-2xl font-bold mb-2">{application.jobTitle}</h2>
              <div className="flex items-center gap-4 text-sm opacity-90">
                <div className="flex items-center gap-1">
                  <Building2 className="w-4 h-4" />
                  <span>{application.company}</span>
                </div>
                <div className="flex items-center gap-1">
                  <MapPin className="w-4 h-4" />
                  <span>{application.location}</span>
                </div>
              </div>
            </div>
            <button
              onClick={onClose}
              className="ml-4 p-2 hover:bg-white/10 rounded-lg transition-colors"
            >
              <XCircle className="w-6 h-6" />
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="p-6 space-y-6">
          {/* Application Info */}
          <div className="grid grid-cols-2 gap-4">
            <div className="bg-gray-50 p-4 rounded-lg">
              <div className="text-sm text-gray-600 mb-1">Application Status</div>
              <div className="flex items-center gap-2">
                <span className={`px-3 py-1 rounded-full text-sm font-medium ${
                  application.status === 'accepted' ? 'bg-green-100 text-green-800' :
                  application.status === 'pending' ? 'bg-yellow-100 text-yellow-800' :
                  application.status === 'rejected' ? 'bg-red-100 text-red-800' :
                  'bg-gray-100 text-gray-800'
                }`}>
                  {application.status?.charAt(0).toUpperCase() + application.status?.slice(1)}
                </span>
              </div>
            </div>

            <div className="bg-gray-50 p-4 rounded-lg">
              <div className="text-sm text-gray-600 mb-1">Applied Date</div>
              <div className="font-medium text-gray-900">{application.appliedDate}</div>
            </div>

            <div className="bg-gray-50 p-4 rounded-lg">
              <div className="text-sm text-gray-600 mb-1">Employment Type</div>
              <div className="font-medium text-gray-900">{application.type}</div>
            </div>

            <div className="bg-gray-50 p-4 rounded-lg">
              <div className="text-sm text-gray-600 mb-1">Salary Range</div>
              <div className="font-medium text-gray-900">{application.salary}</div>
            </div>
          </div>

          {/* Pipeline Status - Show if student is in pipeline */}
          {application.hasPipelineStatus && application.pipelineStage && (
            <div className="border-t pt-6">
              <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
                <TrendingUp className="w-5 h-5 text-slate-700" />
                Recruitment Pipeline Status
              </h3>
              
              {/* Pipeline Progress Tracker */}
              <div className="bg-gradient-to-br from-cyan-50 to-blue-50 p-6 rounded-xl border border-blue-100 mb-4">
                {/* Debug Info - Remove after testing */}
                <div className="bg-yellow-50 border border-yellow-200 p-2 rounded mb-4 text-xs">
                  <strong>Debug:</strong> Stage = "{application.pipelineStage}" | 
                  Has Pipeline = {application.hasPipelineStatus ? 'Yes' : 'No'} | 
                  Stage Order = {getStageOrder(application.pipelineStage)}
                </div>
                
                <div className="relative">
                  {/* Progress Bar Container */}
                  <div className="flex items-center justify-between mb-8">
                    {Object.entries({
                      sourced: 'Sourced',
                      screened: 'Screened',
                      interview_1: 'Interview 1',
                      interview_2: 'Interview 2',
                      offer: 'Offer',
                      hired: 'Hired'
                    }).map(([stageKey, stageLabel], index, array) => {
                      const isCompleted = getStageOrder(application.pipelineStage) > getStageOrder(stageKey);
                      const isCurrent = application.pipelineStage === stageKey;
                      const isRejected = application.pipelineStage === 'rejected';
                      
                      // Debug log for each stage
                        isCompleted,
                        isCurrent,
                        currentStage: application.pipelineStage,
                        stageKey,
                        equal: application.pipelineStage === stageKey
                      });
                      
                      return (
                        <div key={stageKey} className="flex flex-col items-center flex-1 relative">
                          {/* Stage Number Circle */}
                          <div className="relative z-10 mb-2">
                            <div className={`w-10 h-10 rounded-full flex items-center justify-center font-bold text-sm transition-all ${
                              isCompleted 
                                ? 'bg-green-500 text-white shadow-lg shadow-green-200' 
                                : isCurrent 
                                  ? 'bg-blue-500 text-white shadow-lg shadow-blue-200 ring-4 ring-blue-200 animate-pulse' 
                                  : isRejected && index > getStageOrder('sourced')
                                    ? 'bg-gray-200 text-gray-400'
                                    : 'bg-white text-gray-400 border-2 border-gray-300'
                            }`}>
                              {isCompleted ? (
                                <CheckCircle2 className="w-6 h-6" />
                              ) : (
                                index + 1
                              )}
                            </div>
                          </div>
                          
                          {/* Connecting Line */}
                          {index < array.length - 1 && (
                            <div className={`absolute top-5 left-1/2 w-full h-0.5 -z-0 transition-all ${
                              isCompleted 
                                ? 'bg-green-500' 
                                : 'bg-gray-300'
                            }`} style={{ transform: 'translateY(-50%)' }} />
                          )}
                          
                          {/* Stage Label */}
                          <div className={`text-xs font-medium text-center px-1 transition-all ${
                            isCurrent 
                              ? 'text-blue-700 font-bold' 
                              : isCompleted 
                                ? 'text-green-700' 
                                : 'text-gray-500'
                          }`}>
                            {stageLabel}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* Current Status Info */}
                <div className="bg-white p-4 rounded-lg border border-blue-200 shadow-sm">
                  <div className="flex items-center gap-3">
                    <div className={`p-3 rounded-lg ${currentStageConfig?.color || 'bg-gray-100 text-gray-800'}`}>
                      <StageIcon className="w-6 h-6" />
                    </div>
                    <div className="flex-1">
                      <div className="text-sm text-gray-600">Current Stage</div>
                      <div className="text-lg font-bold text-gray-900">{currentStageConfig?.label || application.pipelineStage}</div>
                      {application.pipelineStageChangedAt && (
                        <div className="text-xs text-gray-500 mt-1">
                          <Clock className="w-3 h-3 inline mr-1" />
                          Updated {new Date(application.pipelineStageChangedAt).toLocaleDateString()}
                        </div>
                      )}
                    </div>
                    <div className="text-right">
                      <div className={`px-4 py-2 rounded-lg font-semibold ${currentStageConfig?.color || 'bg-gray-100 text-gray-800'}`}>
                        Stage {getStageOrder(application.pipelineStage)} of 6
                      </div>
                    </div>
                  </div>
                  
                  {/* Progress Message */}
                  <div className="mt-3 pt-3 border-t border-gray-100">
                    <p className="text-sm text-gray-700">
                      {application.pipelineStage === 'sourced' && 
                        "🎯 Your application has been added to the recruitment pipeline and is being reviewed by the hiring team."}
                      {application.pipelineStage === 'screened' && 
                        "✅ Your application passed initial screening. The team is evaluating your qualifications."}
                      {application.pipelineStage === 'interview_1' && 
                        "📞 You're scheduled for the first round of interviews. Good luck!"}
                      {application.pipelineStage === 'interview_2' && 
                        "🌟 Great progress! You're in the second round of interviews."}
                      {application.pipelineStage === 'offer' && 
                        "🎉 Congratulations! An offer is being prepared for you."}
                      {application.pipelineStage === 'hired' && 
                        "✨ Welcome aboard! You've been successfully hired."}
                      {application.pipelineStage === 'rejected' && 
                        "We appreciate your interest. Please see the rejection reason below."}
                    </p>
                  </div>
                </div>

                {/* Next Action */}
                {application.nextAction && (
                  <div className="bg-blue-50 p-4 rounded-lg border border-blue-200 mt-3">
                    <div className="text-sm font-medium text-blue-700 mb-1 flex items-center gap-2">
                      <ArrowRight className="w-4 h-4" />
                      Next Action
                    </div>
                    <div className="text-gray-900">{application.nextAction}</div>
                    {application.nextActionDate && (
                      <div className="text-xs text-gray-600 mt-1">
                        Due: {new Date(application.nextActionDate).toLocaleDateString()}
                      </div>
                    )}
                  </div>
                )}

                {/* Rejection Reason */}
                {application.rejectionReason && (
                  <div className="bg-red-50 p-4 rounded-lg border border-red-200 mt-3">
                    <div className="text-sm font-medium text-red-700 mb-1 flex items-center gap-2">
                      <AlertCircle className="w-4 h-4" />
                      Rejection Reason
                    </div>
                    <div className="text-red-900">{application.rejectionReason}</div>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Interviews */}
          {interviews && interviews.length > 0 && (
            <div className="border-t pt-6">
              <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
                <Calendar className="w-5 h-5 text-slate-700" />
                Scheduled Interviews
              </h3>
              
              <div className="space-y-3">
                {interviews.map((interview, idx) => (
                  <div key={idx} className="bg-blue-50 p-4 rounded-lg border border-blue-200">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="font-medium text-blue-900">{interview.round || 'Interview'}</div>
                        <div className="text-sm text-blue-700 mt-1">
                          <Calendar className="w-4 h-4 inline mr-1" />
                          {new Date(interview.scheduled_date).toLocaleString()}
                        </div>
                        {interview.location && (
                          <div className="text-sm text-blue-700 mt-1">
                            <MapPin className="w-4 h-4 inline mr-1" />
                            {interview.location}
                          </div>
                        )}
                        {interview.notes && (
                          <div className="text-sm text-gray-600 mt-2">{interview.notes}</div>
                        )}
                      </div>
                      <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                        interview.status === 'completed' ? 'bg-green-100 text-green-800' :
                        interview.status === 'cancelled' ? 'bg-red-100 text-red-800' :
                        'bg-yellow-100 text-yellow-800'
                      }`}>
                        {interview.status?.charAt(0).toUpperCase() + interview.status?.slice(1)}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Pipeline Status - Under Review */}
          {!application.hasPipelineStatus && (
            <div className="border-t pt-6">
              <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
                <TrendingUp className="w-5 h-5 text-slate-700" />
                Recruitment Pipeline
              </h3>
              
              {/* Pipeline Progress Tracker - All stages shown but inactive */}
              <div className="bg-gradient-to-br from-gray-50 to-slate-50 p-6 rounded-xl border border-gray-200 mb-4">
                <div className="relative">
                  {/* Progress Bar Container */}
                  <div className="flex items-center justify-between mb-8">
                    {Object.entries({
                      sourced: 'Sourced',
                      screened: 'Screened',
                      interview_1: 'Interview 1',
                      interview_2: 'Interview 2',
                      offer: 'Offer',
                      hired: 'Hired'
                    }).map(([stageKey, stageLabel], index, array) => {
                      return (
                        <div key={stageKey} className="flex flex-col items-center flex-1 relative">
                          {/* Stage Number Circle */}
                          <div className="relative z-10 mb-2">
                            <div className="w-10 h-10 rounded-full flex items-center justify-center font-bold text-sm bg-white text-gray-400 border-2 border-gray-300">
                              {index + 1}
                            </div>
                          </div>
                          
                          {/* Connecting Line */}
                          {index < array.length - 1 && (
                            <div className="absolute top-5 left-1/2 w-full h-0.5 bg-gray-300 -z-0" style={{ transform: 'translateY(-50%)' }} />
                          )}
                          
                          {/* Stage Label */}
                          <div className="text-xs font-medium text-center px-1 text-gray-500">
                            {stageLabel}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* Under Review Message */}
                <div className="bg-white p-5 rounded-lg border border-gray-200 shadow-sm text-center">
                  <div className="flex items-center justify-center gap-3 mb-2">
                    <AlertCircle className="w-6 h-6 text-blue-500" />
                    <div className="text-lg font-bold text-gray-900">Application Under Review</div>
                  </div>
                  <p className="text-gray-600 text-sm">
                    Your application is being reviewed. You'll be notified once it's added to the recruitment pipeline and progresses through the stages above.
                  </p>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="bg-gray-50 px-6 py-4 flex justify-end gap-3 sticky bottom-0">
          <button
            onClick={onClose}
            className="px-6 py-2 bg-white border-2 border-gray-300 hover:border-slate-700 text-gray-700 hover:text-slate-700 rounded-lg font-medium transition-colors"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};

export default Applications;

