import React, { useState, useEffect } from 'react';
import AppliedJobsService from '../../services/appliedJobsService';
import { getAllPipelineCandidatesByStage, moveCandidateToStage } from '../../services/pipelineService';
import { supabase } from '../../lib/supabaseClient';
import { EyeIcon, ChatBubbleLeftIcon, MagnifyingGlassIcon, FunnelIcon, ArrowDownTrayIcon, UsersIcon, ChevronRightIcon, ChevronDownIcon, ChevronUpIcon, SparklesIcon, XMarkIcon } from '@heroicons/react/24/outline';
import { MessageModal } from '../../components/messaging/MessageModal';
import useMessageNotifications from '../../hooks/useMessageNotifications';
import { useAuth } from '../../context/AuthContext';
import { recruiterInsights } from '../../features/recruiter-copilot/services/recruiterInsights';

interface Student {
  id: string;
  name: string;
  email: string;
  phone?: string;
  photo?: string;
  department: string;
  university: string;
  cgpa?: string;
  year_of_passing?: string;
  verified: boolean;
  employability_score?: number;
}

interface Opportunity {
  id: number;
  job_title: string;
  title: string;
  company_name: string;
  department: string;
  location: string;
  employment_type: string;
  experience_level: string;
}

interface Applicant {
  id: string;  // Changed to string for UUID
  student_id: string;
  opportunity_id: string;  // Changed to string for UUID
  application_status: string;
  applied_at: string;
  viewed_at?: string;
  responded_at?: string;
  interview_scheduled_at?: string;
  notes?: string;
  student: Student;
  opportunity: Opportunity;
  pipeline_stage?: string;
  pipeline_candidate_id?: string;
}

interface PipelineStage {
  stage: string;
  label: string;
  count: number;
  color: string;
  icon: string;
}

const ApplicantsList: React.FC = () => {
  const { user } = useAuth();
  const [applicants, setApplicants] = useState<Applicant[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [entriesPerPage, setEntriesPerPage] = useState(10);
  const [currentPage, setCurrentPage] = useState(1);
  const [sortBy, setSortBy] = useState<'name' | 'date' | 'rating'>('date');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [selectedRequisition, setSelectedRequisition] = useState<string>('all');
  
  // Pipeline stages state
  const [pipelineStages, setPipelineStages] = useState<PipelineStage[]>([
    { stage: 'sourced', label: 'Sourced', count: 0, color: 'bg-blue-100 text-blue-800', icon: '👥' },
    { stage: 'screened', label: 'Screened', count: 0, color: 'bg-purple-100 text-purple-800', icon: '📋' },
    { stage: 'interview_1', label: 'Interview 1', count: 0, color: 'bg-orange-100 text-orange-800', icon: '📹' },
    { stage: 'interview_2', label: 'Interview 2', count: 0, color: 'bg-pink-100 text-pink-800', icon: '🗣️' },
    { stage: 'offer', label: 'Offer', count: 0, color: 'bg-green-100 text-green-800', icon: '🎉' },
    { stage: 'hired', label: 'Hired', count: 0, color: 'bg-emerald-100 text-emerald-800', icon: '✅' }
  ]);
  const [availableRequisitions, setAvailableRequisitions] = useState<Array<{id: string, title: string}>>([]);
  
  // Message modal state
  const [messageModalOpen, setMessageModalOpen] = useState(false);
  const [selectedApplicant, setSelectedApplicant] = useState<Applicant | null>(null);
  
  // AI Recommendations state
  const [aiRecommendations, setAiRecommendations] = useState<{
    topRecommendations: Array<{
      applicantId: number;
      studentName: string;
      positionTitle: string;
      matchScore: number;
      confidence: 'high' | 'medium' | 'low';
      reasons: string[];
      nextAction: string;
      suggestedStage: string;
      matchedSkills: string[];
      missingSkills: string[];
    }>;
    summary: {
      totalAnalyzed: number;
      highPotential: number;
      mediumPotential: number;
      lowPotential: number;
    };
  } | null>(null);
  const [loadingRecommendations, setLoadingRecommendations] = useState(false);
  // Controls visibility of the AI recommendation panel.
  // Default: hidden, surfaced via a floating UX entry point.
  const [showRecommendations, setShowRecommendations] = useState(false);
  // Controls whether to show all recommendations or just the first 6
  const [showAllRecommendations, setShowAllRecommendations] = useState(false);
  
  // Get recruiter ID from auth context
  const recruiterId = user?.id;
  
  // Enable real-time message notifications
  useMessageNotifications({
    userId: recruiterId,
    userType: 'recruiter',
    enabled: true,
    onMessageReceived: (message) => {
      // Optionally refresh conversations or update UI
    }
  });

  useEffect(() => {
    fetchApplicants();
  }, []);

  const fetchApplicants = async () => {
    setLoading(true);
    try {
      // Fetch all applicants from applied_jobs table with pipeline data
      const applicantsData = await AppliedJobsService.getAllApplicants();
      
      console.log('[ApplicantsList] Fetched applicants data:', {
        count: applicantsData?.length,
        sample: applicantsData?.[0]
      });
      
      // Get unique opportunity IDs for the dropdown
      const uniqueOpportunities = [...new Set(
        applicantsData
          ?.filter((app: any) => app.opportunity_id)
          .map((app: any) => ({
            id: app.opportunity_id,
            title: app.opportunity?.job_title || app.opportunity?.title
          }))
      )];
      setAvailableRequisitions(uniqueOpportunities);

      // Fetch pipeline data for each opportunity
      const applicantsWithPipeline = await Promise.all(
        (applicantsData || []).map(async (applicant: any) => {
          if (applicant.opportunity_id) {
            try {
              // Get pipeline data for this opportunity
              const { data: pipelineData } = await getAllPipelineCandidatesByStage(applicant.opportunity_id);
              
              // Find this student in the pipeline data
              let pipelineStage = null;
              let pipelineCandidateId = null;
              
              if (pipelineData) {
                for (const [stage, candidates] of Object.entries(pipelineData)) {
                  const found = (candidates as any[]).find(c => c.student_id === applicant.student_id);
                  if (found) {
                    pipelineStage = stage;
                    pipelineCandidateId = found.id;
                    break;
                  }
                }
              }
              
              return {
                ...applicant,
                pipeline_stage: pipelineStage,
                pipeline_candidate_id: pipelineCandidateId,
                opportunity_id: applicant.opportunity_id
              };
            } catch (error) {
              console.error('Error fetching pipeline data for opportunity:', applicant.opportunity_id, error);
              return applicant;
            }
          }
          return applicant;
        })
      );

      setApplicants(applicantsWithPipeline);
      
      // Update pipeline stage counts
      updatePipelineCounts(applicantsWithPipeline);
      
      // AI recommendations will be fetched on-demand when user clicks the button
      
    } catch (error) {
      console.error('Error fetching applicants:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchAIRecommendations = async (applicantsList: Applicant[]) => {
    setLoadingRecommendations(true);
    try {
      // Prepare applicants data for analysis
      const applicantsForAnalysis = applicantsList
        .filter(app => app.student && app.opportunity) // Filter out applicants with null student or opportunity
        .map(app => ({
          id: app.id,
          student_id: app.student_id,
          opportunity_id: app.opportunity_id,
          pipeline_stage: app.pipeline_stage,
          student: {
            id: app.student_id,
            name: app.student?.name || 'Unknown',
            email: app.student?.email || '',
            university: app.student?.university,
            cgpa: app.student?.cgpa,
            branch_field: app.student?.department
          },
          opportunity: {
            id: app.opportunity_id,
            job_title: app.opportunity?.job_title || app.opportunity?.title,
            skills_required: [] // Will be fetched by the service
          }
        }));
      
      // Fetch opportunities with skills_required
      const opportunityIds = [...new Set(applicantsForAnalysis.map(a => a.opportunity_id))];
      
      const { data: opportunities, error: oppError } = await supabase
        .from('opportunities')
        .select('id, skills_required')
        .in('id', opportunityIds);
      
      if (oppError) {
        console.error('Error fetching opportunities:', oppError);
      }
      
      // Enrich with skills_required
      const enrichedApplicants = applicantsForAnalysis.map(app => {
        const opp = opportunities?.find(o => o.id === app.opportunity_id);
        const skills = opp?.skills_required || [];
        return {
          ...app,
          opportunity: {
            ...app.opportunity,
            skills_required: skills
          }
        };
      });
      
      const recommendations = await recruiterInsights.analyzeApplicantsForRecommendation(enrichedApplicants);
      setAiRecommendations(recommendations);
    } catch (error) {
      console.error('Error fetching AI recommendations:', error);
    } finally {
      setLoadingRecommendations(false);
    }
  };

  // Handler to fetch AI recommendations on-demand
  const handleFetchRecommendations = async () => {
    if (aiRecommendations) {
      // Already fetched, just show them
      setShowRecommendations(true);
      return;
    }
    
    // Fetch recommendations
    if (applicants.length > 0) {
      await fetchAIRecommendations(applicants);
      setShowRecommendations(true);
    }
  };

  const updatePipelineCounts = (applicantsList: Applicant[]) => {
    const counts = {
      sourced: 0,
      screened: 0,
      interview_1: 0,
      interview_2: 0,
      offer: 0,
      hired: 0
    };

    applicantsList.forEach(applicant => {
      // Only count actual pipeline stages, not application statuses
      if (applicant.pipeline_stage && counts.hasOwnProperty(applicant.pipeline_stage)) {
        counts[applicant.pipeline_stage as keyof typeof counts]++;
      }
    });

    setPipelineStages(prev => prev.map(stage => ({
      ...stage,
      count: counts[stage.stage as keyof typeof counts] || 0
    })));
  };

  const handleMoveToPipelineStage = async (applicant: Applicant, newStage: string) => {
    console.log('[ApplicantsList] handleMoveToPipelineStage called:', {
      applicant: {
        id: applicant.id,
        student_id: applicant.student_id,
        opportunity_id: applicant.opportunity_id,
        pipeline_candidate_id: applicant.pipeline_candidate_id,
        pipeline_stage: applicant.pipeline_stage,
        application_status: applicant.application_status
      },
      newStage
    });
    
    // If candidate is not in pipeline yet but has applied/viewed status, add them first
    if (!applicant.pipeline_candidate_id && (applicant.application_status === 'applied' || applicant.application_status === 'viewed')) {
      try {
        // Add candidate to pipeline first using the service
        const { data: student } = await supabase
          .from('students')
          .select('name, email, contact_number')
          .eq('id', applicant.student_id)
          .single();

        if (!student) {
          alert('Student information not found');
          return;
        }

        // Use the addCandidateToPipeline service which handles duplicates
        const { addCandidateToPipeline } = await import('../../services/pipelineService');
        
        const result = await addCandidateToPipeline({
          opportunity_id: applicant.opportunity_id,
          student_id: applicant.student_id,
          candidate_name: student.name || 'Unknown Student',
          candidate_email: student.email || '',
          candidate_phone: student.contact_number || '',
          stage: newStage,
          source: 'direct_application',
          added_by: user?.id || undefined
        });

        if (result.error) {
          const errorCode = (result.error as any).code;
          if (errorCode === 'DUPLICATE_CANDIDATE' || errorCode === '23505') {
            alert('This candidate is already in the pipeline. Refreshing...');
            fetchApplicants(); // Refresh to show current state
            return;
          }
          throw result.error;
        }

        // Refresh applicants list to show updated pipeline status
        fetchApplicants();
        
      } catch (error) {
        console.error('Error adding candidate to pipeline:', error);
        const errorMsg = (error as any)?.message || 'Failed to add candidate to pipeline';
        alert(errorMsg);
        return;
      }
    } else if (!applicant.pipeline_candidate_id) {
      console.log('[ApplicantsList] Candidate not in pipeline and not in applied/viewed status');
      alert('This applicant is not in the pipeline system yet');
      return;
    } else {
      // Use existing pipeline movement function
      console.log('[ApplicantsList] Moving existing pipeline candidate:', {
        pipeline_candidate_id: applicant.pipeline_candidate_id,
        newStage,
        user_id: user?.id
      });
      
      try {
        const result = await moveCandidateToStage(
          applicant.pipeline_candidate_id,
          newStage,
          user?.id || '',
          `Moved to ${newStage} stage`
        );

        console.log('[ApplicantsList] moveCandidateToStage result:', result);

        if (result.error) {
          console.error('[ApplicantsList] Error from moveCandidateToStage:', result.error);
          throw result.error;
        }
        
        // Refresh applicants list to show updated stage
        console.log('[ApplicantsList] Refreshing applicants list...');
        fetchApplicants();
      } catch (error) {
        console.error('[ApplicantsList] Error moving candidate:', error);
        alert('Failed to move candidate. Please try again.');
        return;
      }
    }

    // Refresh the applicants list to show updated stages
    await fetchApplicants();
    alert(`Successfully moved ${applicant.student.name} to ${newStage} stage`);
  };

  const getNextStageOptions = (applicant: Applicant) => {
    const stageOrder = ['sourced', 'screened', 'interview_1', 'interview_2', 'offer', 'hired'];
    
    // If candidate has pipeline stage, show next stages
    if (applicant.pipeline_stage) {
      const currentIndex = stageOrder.indexOf(applicant.pipeline_stage);
      if (currentIndex === -1) return stageOrder;
      return stageOrder.slice(currentIndex + 1);
    }
    
    // If no pipeline stage, show all stages starting from sourced
    return stageOrder;
  };

  const handleViewApplicant = async (applicant: Applicant) => {
    try {
      // Update status to 'viewed' if it's currently 'applied'
      if (applicant.application_status === 'applied') {
        await AppliedJobsService.updateApplicationStatus(applicant.id, 'viewed');
        // Update local state to reflect the change
        setApplicants(prevApplicants =>
          prevApplicants.map(app =>
            app.id === applicant.id
              ? { ...app, application_status: 'viewed', viewed_at: new Date().toISOString() }
              : app
          )
        );
      }
      // TODO: Add navigation to applicant details page or open modal
    } catch (error) {
      console.error('Error updating application status:', error);
    }
  };

  const getStatusBadge = (applicant: Applicant) => {
    // Show pipeline stage if available
    if (applicant.pipeline_stage) {
      const pipelineConfig: { [key: string]: { label: string; color: string; icon: string } } = {
        sourced: { label: 'Sourced', color: 'bg-blue-100 text-blue-800', icon: '👥' },
        screened: { label: 'Screened', color: 'bg-purple-100 text-purple-800', icon: '📋' },
        interview_1: { label: 'Interview 1', color: 'bg-orange-100 text-orange-800', icon: '📹' },
        interview_2: { label: 'Interview 2', color: 'bg-pink-100 text-pink-800', icon: '🗣️' },
        offer: { label: 'Offer', color: 'bg-green-100 text-green-800', icon: '🎉' },
        hired: { label: 'Hired', color: 'bg-emerald-100 text-emerald-800', icon: '✅' },
        rejected: { label: 'Rejected', color: 'bg-red-100 text-red-800', icon: '❌' }
      };

      const config = pipelineConfig[applicant.pipeline_stage] || { 
        label: applicant.pipeline_stage, 
        color: 'bg-gray-100 text-gray-700', 
        icon: '📝' 
      };
      
      return (
        <span className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${config.color}`}>
          <span className="mr-1">{config.icon}</span>
          {config.label}
        </span>
      );
    }

    // Show original application status
    const statusConfig: { [key: string]: { label: string; color: string; icon: string } } = {
      applied: { label: 'Applied', color: 'bg-indigo-100 text-indigo-700', icon: '○' },
      viewed: { label: 'Viewed', color: 'bg-blue-100 text-blue-700', icon: '👁️' },
      under_review: { label: 'Under Review', color: 'bg-yellow-100 text-yellow-700', icon: '📝' },
      interview_scheduled: { label: 'Interview Scheduled', color: 'bg-orange-100 text-orange-700', icon: '📅' },
      interviewed: { label: 'Interviewed', color: 'bg-purple-100 text-purple-700', icon: '✓' },
      offer_received: { label: 'Offer Received', color: 'bg-green-100 text-green-700', icon: '📋' },
      accepted: { label: 'Accepted', color: 'bg-emerald-100 text-emerald-700', icon: '✓' },
      rejected: { label: 'Rejected', color: 'bg-red-100 text-red-700', icon: '✗' },
      withdrawn: { label: 'Withdrawn', color: 'bg-gray-100 text-gray-700', icon: '←' },
    };

    const config = statusConfig[applicant.application_status] || { 
      label: applicant.application_status || 'Unknown', 
      color: 'bg-gray-100 text-gray-700', 
      icon: '📝' 
    };
    
    return (
      <span className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${config.color}`}>
        <span className="mr-1">{config.icon}</span>
        {config.label}
      </span>
    );
  };

  const getTimeAgo = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffInMs = now.getTime() - date.getTime();
    const diffInDays = Math.floor(diffInMs / (1000 * 60 * 60 * 24));

    if (diffInDays === 0) return 'Today';
    if (diffInDays === 1) return '1 day ago';
    if (diffInDays < 7) return `${diffInDays} days ago`;
    if (diffInDays < 14) return '1 week ago';
    if (diffInDays < 30) return `${Math.floor(diffInDays / 7)} weeks ago`;
    return date.toLocaleDateString();
  };

  const getExperienceYears = (applicant: Applicant) => {
    const yearOfPassing = applicant.student?.year_of_passing;
    if (!yearOfPassing) return 'N/A';
    
    const currentYear = new Date().getFullYear();
    const passingYear = parseInt(yearOfPassing);
    const years = currentYear - passingYear;
    
    if (years <= 0) return 'Fresher';
    return `${years} year${years > 1 ? 's' : ''}`;
  };

  const renderStars = (score: number = 0) => {
    // Convert employability_score (0-100) to 5-star rating
    const rating = Math.round((score / 100) * 5);
    const stars = [];
    for (let i = 1; i <= 5; i++) {
      stars.push(
        <span key={i} className={i <= rating ? 'text-yellow-400' : 'text-gray-300'}>
          ★
        </span>
      );
    }
    return <div className="flex">{stars}</div>;
  };

  const filteredApplicants = applicants.filter((applicant) => {
    // Filter by search term
    const matchesSearch = 
      applicant.student?.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      applicant.student?.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      applicant.opportunity?.job_title?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      applicant.opportunity?.title?.toLowerCase().includes(searchTerm.toLowerCase());
    
    // Filter by status - use pipeline stage if available, otherwise application status
    const currentStatus = applicant.pipeline_stage || applicant.application_status;
    
    const matchesStatus = statusFilter === 'all' || 
      applicant.application_status === statusFilter ||
      applicant.pipeline_stage === statusFilter ||
      currentStatus === statusFilter;

    // Filter by opportunity (UUID comparison)
    const matchesRequisition = selectedRequisition === 'all' || 
      applicant.opportunity_id === selectedRequisition;
    
    return matchesSearch && matchesStatus && matchesRequisition;
  });

  const sortedApplicants = [...filteredApplicants].sort((a, b) => {
    const multiplier = sortOrder === 'asc' ? 1 : -1;
    
    switch (sortBy) {
      case 'name':
        return (a.student?.name || '').localeCompare(b.student?.name || '') * multiplier;
      case 'date':
        return (new Date(a.applied_at).getTime() - new Date(b.applied_at).getTime()) * multiplier;
      case 'rating':
        return ((a.student?.employability_score || 0) - (b.student?.employability_score || 0)) * multiplier;
      default:
        return 0;
    }
  });

  const paginatedApplicants = sortedApplicants.slice(
    (currentPage - 1) * entriesPerPage,
    currentPage * entriesPerPage
  );

  const totalPages = Math.ceil(sortedApplicants.length / entriesPerPage);

  const exportToCSV = () => {
    const headers = ['Candidate', 'Email', 'Position', 'Status', 'Applied'];
    const rows = sortedApplicants.map(applicant => [
      applicant.student?.name || '',
      applicant.student?.email || '',
      applicant.opportunity?.job_title || applicant.opportunity?.title || '',
      applicant.application_status,
      getTimeAgo(applicant.applied_at)
    ]);

    const csvContent = [
      headers.join(','),
      ...rows.map(row => row.join(','))
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `applicants_${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    window.URL.revokeObjectURL(url);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
      </div>
    );
  }

  return (
    <>
    <div className="h-screen flex flex-col bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 px-6 py-4">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Applicants List</h1>
            <p className="text-sm text-gray-500 mt-1">
              {sortedApplicants.length} applicant{sortedApplicants.length !== 1 ? 's' : ''}
            </p>
          </div>
          <button
            onClick={exportToCSV}
            className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-green-600 hover:bg-green-700"
          >
            <ArrowDownTrayIcon className="h-5 w-5 mr-2" />
            Export As CSV
          </button>
        </div>

        {/* Pipeline Stages Overview */}
        <div className="mt-6">
          <h3 className="text-lg font-medium text-gray-900 mb-4">Pipeline Overview</h3>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
            {pipelineStages.map((stage) => (
              <div
                key={stage.stage}
                className={`relative p-4 rounded-lg border-2 cursor-pointer transition-all hover:shadow-md ${
                  statusFilter === stage.stage 
                    ? 'border-blue-500 bg-blue-50' 
                    : 'border-gray-200 bg-white hover:border-gray-300'
                }`}
                onClick={() => setStatusFilter(statusFilter === stage.stage ? 'all' : stage.stage)}
              >
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600">{stage.label}</p>
                    <p className="text-2xl font-bold text-gray-900">{stage.count}</p>
                  </div>
                  <div className="text-2xl">{stage.icon}</div>
                </div>
                {statusFilter === stage.stage && (
                  <div className="absolute top-2 right-2">
                    <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Search and Filters */}
        <div className="mt-6 flex flex-col sm:flex-row gap-3">
          <div className="flex-1 relative">
            <MagnifyingGlassIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
            <input
              type="text"
              placeholder="Search by name, email, or position..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
            />
          </div>
          
          {/* Results Count */}
          {sortedApplicants.length > 0 && (
            <div className="hidden md:flex items-center px-3 py-2 bg-gray-100 rounded-md text-xs text-gray-600">
              <span className="font-medium">{sortedApplicants.length}</span>
              <span className="mx-1">results</span>
              <span className="mx-1">•</span>
              <span>sorted by</span>
              <span className="ml-1 font-medium">
                {sortBy === 'name' ? 'Name' :
                 sortBy === 'date' ? 'Date Added' :
                 sortBy === 'rating' ? 'Rating' : sortBy}
              </span>
            </div>
          )}
          
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500 text-sm"
          >
            <option value="all">All Status</option>
            <optgroup label="Pipeline Stages">
              <option value="sourced">Sourced</option>
              <option value="screened">Screened</option>
              <option value="interview_1">Interview 1</option>
              <option value="interview_2">Interview 2</option>
              <option value="offer">Offer</option>
              <option value="hired">Hired</option>
            </optgroup>
            <optgroup label="Application Status">
              <option value="applied">Applied</option>
              <option value="viewed">Viewed</option>
              <option value="under_review">Under Review</option>
              <option value="interview_scheduled">Interview Scheduled</option>
              <option value="interviewed">Interviewed</option>
              <option value="offer_received">Offer Received</option>
              <option value="accepted">Accepted</option>
              <option value="rejected">Rejected</option>
              <option value="withdrawn">Withdrawn</option>
            </optgroup>
          </select>

          <select
            value={selectedRequisition}
            onChange={(e) => setSelectedRequisition(e.target.value)}
            className="px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500 text-sm"
          >
            <option value="all">All Positions</option>
            {availableRequisitions.map((req) => (
              <option key={req.id} value={req.id}>
                {req.title}
              </option>
            ))}
          </select>
          
          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value as 'name' | 'date' | 'rating')}
            className="px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500 text-sm"
          >
            <option value="date">Newest First</option>
            <option value="name">Name (A-Z)</option>
            <option value="rating">Highest Rating</option>
          </select>

          <select
            value={entriesPerPage}
            onChange={(e) => {
              setEntriesPerPage(Number(e.target.value));
              setCurrentPage(1);
            }}
            className="px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500 text-sm"
          >
            <option value={10}>Show 10</option>
            <option value={25}>Show 25</option>
            <option value={50}>Show 50</option>
            <option value={100}>Show 100</option>
          </select>
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-auto p-6">
        
        {/* AI Recommendations Card - Empty State */}
        {showRecommendations && aiRecommendations && aiRecommendations.topRecommendations.length === 0 && aiRecommendations.summary.totalAnalyzed > 0 && (
          <div className="mb-6 bg-white rounded-xl shadow-sm border border-gray-200 p-8 text-center">
            <div className="inline-flex items-center justify-center w-16 h-16 bg-gray-100 rounded-full mb-4">
              <SparklesIcon className="h-8 w-8 text-gray-400" />
            </div>
            <h3 className="text-lg font-semibold text-gray-900 mb-2">No Strong Matches Found</h3>
            <p className="text-sm text-gray-600 max-w-md mx-auto mb-4">
              We analyzed {aiRecommendations.summary.totalAnalyzed} applicant{aiRecommendations.summary.totalAnalyzed !== 1 ? 's' : ''}, but none scored above 20% match for recommendations.
            </p>
            <div className="flex items-center justify-center gap-3">
              <button className="text-sm text-blue-600 hover:text-blue-700 font-medium">
                Review all applicants
              </button>
              <span className="text-gray-300">•</span>
              <button className="text-sm text-blue-600 hover:text-blue-700 font-medium">
                Adjust job requirements
              </button>
            </div>
          </div>
        )}

        {/* AI Recommendations Card */}
        {showRecommendations && aiRecommendations && aiRecommendations.topRecommendations.length > 0 && (
          <div className="mb-6 bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
            {/* Header */}
            <div className="bg-gradient-to-r from-blue-50 to-indigo-50 px-6 py-4 border-b border-gray-200">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-lg shadow-sm">
                    <SparklesIcon className="h-5 w-5 text-white" />
                  </div>
                  <div>
                    <h2 className="text-lg font-semibold text-gray-900">AI Recommended</h2>
                    <p className="text-xs text-gray-600 mt-0.5">
                      {aiRecommendations.summary.highPotential} high potential · {aiRecommendations.summary.mediumPotential} medium potential
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => {
                    setShowRecommendations(false);
                    setShowAllRecommendations(false);
                  }}
                  className="p-1.5 hover:bg-white/50 rounded-lg transition-colors"
                  aria-label="Hide recommendations"
                >
                  <XMarkIcon className="h-4 w-4 text-gray-500" />
                </button>
              </div>
            </div>

            {/* Recommendations List */}
            <div className="p-4">
              {/* Warning if all recommendations are weak */}
              {aiRecommendations.topRecommendations.length > 0 && aiRecommendations.topRecommendations[0].matchScore < 50 && (
                <div className="mb-4 p-3 bg-amber-50 border border-amber-200 rounded-lg">
                  <div className="flex items-start gap-2">
                    <span className="text-amber-600 text-lg">⚠️</span>
                    <div className="flex-1">
                      <p className="text-sm font-medium text-amber-900">Limited Match Quality</p>
                      <p className="text-xs text-amber-700 mt-1">
                        All applicants scored below 50%. Consider broadening job requirements, providing training opportunities, or sourcing additional candidates.
                      </p>
                    </div>
                  </div>
                </div>
              )}

              <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-4">
                {aiRecommendations.topRecommendations.slice(0, showAllRecommendations ? aiRecommendations.topRecommendations.length : 3).map((rec, index) => {
                  const applicant = applicants.find(a => a.id === rec.applicantId);
                  const confidenceConfig = {
                    high: { 
                      badge: 'bg-green-500',
                      bottomColor: 'bg-lime-400',
                      statusText: 'HIGH',
                      textColor: 'text-gray-900'
                    },
                    medium: { 
                      badge: 'bg-amber-500',
                      bottomColor: 'bg-amber-400',
                      statusText: 'MED',
                      textColor: 'text-gray-900'
                    },
                    low: { 
                      badge: 'bg-gray-500',
                      bottomColor: 'bg-gray-400',
                      statusText: 'LOW',
                      textColor: 'text-gray-900'
                    }
                  };
                  const config = confidenceConfig[rec.confidence];

                  // Extract certificate names from reasons
                  const certReason = rec.reasons.find(r => r.toLowerCase().includes('certif'));
                  const certNames = certReason ? certReason.split(':')[1]?.trim() : null;

                  return (
                    <div
                      key={rec.applicantId}
                      className="relative flex flex-col bg-white rounded-3xl overflow-hidden shadow-md hover:shadow-xl transition-all duration-300 border border-gray-200"
                    >
                      {/* Top Status Bar */}
                      <div className="px-6 pt-5 pb-4">
                        <div className="flex items-center justify-between mb-4">
                          {/* Availability status */}
                          <div className="flex items-center gap-2">
                            <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                            <span className="text-sm text-gray-600 font-medium">Available for work</span>
                          </div>
                          {/* Match score */}
                          <div className="flex items-center gap-1.5 text-gray-500">
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                            </svg>
                            <span className="text-sm font-medium">{rec.matchScore}%</span>
                          </div>
                        </div>

                        {/* Profile Section */}
                        <div className="flex items-center gap-4">
                          {applicant?.student?.photo ? (
                            <img
                              src={applicant.student.photo}
                              alt={rec.studentName}
                              className="h-16 w-16 rounded-full object-cover flex-shrink-0 border-2 border-gray-100"
                            />
                          ) : (
                            <div className="h-16 w-16 rounded-full bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center text-white font-bold text-2xl flex-shrink-0">
                              {rec.studentName.charAt(0).toUpperCase()}
                            </div>
                          )}
                          <div className="flex-1 min-w-0">
                            <h3 className="text-2xl font-bold text-gray-900 truncate mb-1">{rec.studentName}</h3>
                            <p className="text-base text-gray-600">{rec.positionTitle}</p>
                          </div>
                        </div>
                      </div>

                      {/* Certificate Section */}
                      {certNames && (
                        <div className="px-6 pb-4">
                          <div className="flex items-start gap-2.5">
                            <span className="text-lg flex-shrink-0 mt-0.5">🏆</span>
                            <p className="text-sm text-gray-700 leading-relaxed">{certNames}</p>
                          </div>
                        </div>
                      )}

                      {/* Skills Pills */}
                      <div className="px-6 pb-4">
                        <div className="flex flex-wrap gap-2">
                          {rec.matchedSkills.slice(0, 4).map((skill, idx) => (
                            <span key={idx} className="inline-flex items-center px-3 py-2 bg-green-50 text-green-700 text-xs font-medium rounded-lg border border-green-200">
                              {skill}
                            </span>
                          ))}
                          {rec.matchedSkills.length > 4 && (
                            <span className="inline-flex items-center px-3 py-2 bg-gray-100 text-gray-600 text-xs font-medium rounded-lg border border-gray-200">
                              +{rec.matchedSkills.length - 4}
                            </span>
                          )}
                        </div>
                      </div>

                      {/* Action Buttons Container - Dark Design */}
                      <div className="px-6 pb-5">
                        <div className="bg-gradient-to-br from-gray-800 to-gray-900 rounded-2xl p-3 shadow-inner">
                          <div className="grid grid-cols-2 gap-3">
                            <button
                              onClick={() => {
                                if (applicant) {
                                  handleMoveToPipelineStage(applicant, rec.suggestedStage);
                                }
                              }}
                              className="inline-flex items-center justify-center gap-2 h-12 w-full px-4 bg-gray-700 hover:bg-gray-600 text-white font-semibold text-sm rounded-xl transition-all active:scale-95"
                            >
                              <span className="text-base">➕</span>
                              <span>{rec.confidence === 'high' ? 'Hire Me' : rec.confidence === 'medium' ? 'Contact' : 'Review'}</span>
                            </button>
                            <button
                              onClick={() => handleViewApplicant(applicant!)}
                              className="inline-flex items-center justify-center gap-2 h-12 w-full px-4 bg-gray-700 hover:bg-gray-600 text-white font-semibold text-sm rounded-xl transition-all active:scale-95"
                            >
                              <span className="text-base">📋</span>
                              <span>Copy Email</span>
                            </button>
                          </div>
                        </div>
                      </div>

                      {/* Bottom Status Banner */}
                      <div className={`${config.bottomColor} py-4 mt-auto`}>
                        <div className="flex items-center justify-center gap-2">
                          <span className="text-base">⚡</span>
                          <span className="text-base font-semibold text-gray-700">
                            {rec.confidence === 'high' ? 'Currently High on Potential' : 
                             rec.confidence === 'medium' ? 'Good Match for Position' : 
                             'Needs Further Review'}
                          </span>
                        </div>
                      </div>

                      {/* Top Pick Badge - Overlay */}
                      {index === 0 && rec.matchScore >= 70 && (
                        <div className="absolute top-3 right-3">
                          <div className="flex items-center gap-1.5 px-3 py-1.5 bg-gradient-to-r from-amber-400 to-orange-500 rounded-full shadow-lg">
                            <span className="text-sm">⭐</span>
                            <span className="text-xs font-bold text-white">Top Pick</span>
                          </div>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>

              {/* View All - Modern Design */}
              {aiRecommendations.topRecommendations.length > 3 && (
                <div className="mt-6">
                  <button
                    onClick={() => setShowAllRecommendations(!showAllRecommendations)}
                    className="group w-full px-6 py-3.5 rounded-xl border-2 border-violet-200 bg-white hover:bg-violet-50 hover:border-violet-300 active:scale-98 transition-all duration-300 flex items-center justify-center gap-3"
                  >
                    <SparklesIcon className="h-5 w-5 text-violet-600 group-hover:scale-110 transition-transform" />
                    <span className="text-base font-semibold text-violet-600">
                      {showAllRecommendations 
                        ? 'Show Less' 
                        : `View ${aiRecommendations.topRecommendations.length - 3} More AI Matches`
                      }
                    </span>
                    {showAllRecommendations ? (
                      <ChevronUpIcon className="h-4 w-4 text-violet-400 group-hover:-translate-y-0.5 transition-transform" />
                    ) : (
                      <ChevronDownIcon className="h-4 w-4 text-violet-400 group-hover:translate-y-0.5 transition-transform" />
                    )}
                  </button>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Loading State */}
        {loadingRecommendations && !aiRecommendations && (
          <div className="mb-6 bg-gradient-to-r from-purple-50 via-blue-50 to-indigo-50 rounded-lg shadow-lg border-2 border-purple-200 p-6">
            <div className="flex items-center gap-3">
              <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-purple-600"></div>
              <p className="text-gray-700 font-medium">Analyzing applicants with AI...</p>
            </div>
          </div>
        )}

        {/* Table */}
        <div className="bg-white rounded-lg shadow overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left">
                  <input type="checkbox" className="rounded border-gray-300" />
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100">
                  Candidate ▲
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Position
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Status
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Applied
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {paginatedApplicants.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-6 py-12 text-center text-gray-500">
                    No applicants found
                  </td>
                </tr>
              ) : (
                paginatedApplicants.map((applicant) => (
                  <tr key={applicant.id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-6 py-4">
                      <input type="checkbox" className="rounded border-gray-300" />
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <div className="h-10 w-10 flex-shrink-0">
                          {applicant.student?.photo ? (
                            <img
                              src={applicant.student.photo}
                              alt={applicant.student.name}
                              className="h-10 w-10 rounded-full object-cover"
                            />
                          ) : (
                            <div className="h-10 w-10 rounded-full bg-gradient-to-br from-primary-400 to-primary-600 flex items-center justify-center text-white font-semibold">
                              {applicant.student?.name?.charAt(0).toUpperCase() || '?'}
                            </div>
                          )}
                        </div>
                        <div className="ml-4">
                          <div className="text-sm font-medium text-gray-900">
                            {applicant.student?.name || 'Unknown'}
                          </div>
                          <div className="text-sm text-gray-500">
                            {applicant.student?.email || 'N/A'}
                          </div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {applicant.opportunity?.job_title || applicant.opportunity?.title || 'N/A'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {getStatusBadge(applicant)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {getTimeAgo(applicant.applied_at)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm">
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => handleViewApplicant(applicant)}
                          className="p-2 text-primary-600 border border-primary-600 rounded hover:bg-primary-50 transition-colors"
                          title="View Details"
                        >
                          <EyeIcon className="h-4 w-4" />
                        </button>
                        <button
                          onClick={() => {
                            if (!recruiterId) {
                              alert('Please wait, loading user data...');
                              return;
                            }
                            setSelectedApplicant(applicant);
                            setMessageModalOpen(true);
                          }}
                          disabled={!recruiterId}
                          className="p-2 text-green-600 border border-green-600 rounded hover:bg-green-50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                          title="Send Message"
                        >
                          <ChatBubbleLeftIcon className="h-4 w-4" />
                        </button>
                        
                        {/* Pipeline Stage Actions */}
                        {(applicant.pipeline_candidate_id || applicant.application_status === 'applied' || applicant.application_status === 'viewed') && (
                          <div className="relative group">
                            <button className="p-2 text-purple-600 border border-purple-600 rounded hover:bg-purple-50 transition-colors">
                              <ChevronRightIcon className="h-4 w-4" />
                            </button>
                            <div className="absolute right-0 top-full mt-1 w-48 bg-white border border-gray-200 rounded-md shadow-lg opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all z-10">
                              <div className="py-1">
                                <div className="px-3 py-2 text-xs font-medium text-gray-500 border-b">Move to Stage</div>
                                {getNextStageOptions(applicant).map((stage) => (
                                  <button
                                    key={stage}
                                    onClick={() => handleMoveToPipelineStage(applicant, stage)}
                                    className="block w-full text-left px-3 py-2 text-sm text-gray-700 hover:bg-gray-50"
                                  >
                                    {pipelineStages.find(s => s.stage === stage)?.label || stage}
                                  </button>
                                ))}
                                <div className="border-t">
                                  <button
                                    onClick={() => handleMoveToPipelineStage(applicant, 'rejected')}
                                    className="block w-full text-left px-3 py-2 text-sm text-red-600 hover:bg-red-50"
                                  >
                                    ❌ Reject
                                  </button>
                                </div>
                              </div>
                            </div>
                          </div>
                        )}
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

        {/* Pagination */}
      {totalPages > 1 && (
        <div className="mt-4 flex items-center justify-between">
          <div className="text-sm text-gray-700">
            Showing {(currentPage - 1) * entriesPerPage + 1} to{' '}
            {Math.min(currentPage * entriesPerPage, sortedApplicants.length)} of{' '}
            {sortedApplicants.length} entries
          </div>
          <div className="flex gap-2">
            <button
              onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
              disabled={currentPage === 1}
              className="px-3 py-1 border border-gray-300 rounded text-sm disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50"
            >
              Previous
            </button>
            {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
              <button
                key={page}
                onClick={() => setCurrentPage(page)}
                className={`px-3 py-1 border rounded text-sm ${
                  currentPage === page
                    ? 'bg-primary-600 text-white border-primary-600'
                    : 'border-gray-300 hover:bg-gray-50'
                }`}
              >
                {page}
              </button>
            ))}
            <button
              onClick={() => setCurrentPage(Math.min(totalPages, currentPage + 1))}
              disabled={currentPage === totalPages}
              className="px-3 py-1 border border-gray-300 rounded text-sm disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50"
            >
              Next
            </button>
          </div>
        </div>
      )}
      </div>
    </div>

    {/* Floating Smart Picks button – Ultra Modern Design */}
    {applicants.length > 0 && !showRecommendations && (
      <button
        type="button"
        onClick={handleFetchRecommendations}
        disabled={loadingRecommendations}
        className="group fixed bottom-24 right-6 md:bottom-10 md:right-10 z-50 disabled:opacity-70 disabled:cursor-not-allowed"
        aria-label="Get Smart Picks"
      >
        {/* Main button container with layered shadows */}
        <div className="relative w-16 h-16 md:w-20 md:h-20">
          {/* Shadow layers for depth */}
          <div className="absolute inset-0 rounded-2xl bg-gradient-to-br from-violet-500 via-purple-500 to-indigo-500 opacity-40 blur-xl group-hover:opacity-60 transition-opacity duration-500"></div>
          <div className="absolute inset-0 rounded-2xl bg-gradient-to-br from-violet-500 via-purple-500 to-indigo-500 opacity-25 blur-2xl scale-110 group-hover:scale-125 transition-transform duration-500"></div>
          
          {/* Main button surface */}
          <div className="relative w-full h-full rounded-2xl bg-gradient-to-br from-violet-600 via-purple-600 to-indigo-600 border border-white/30 shadow-2xl overflow-hidden group-hover:scale-105 group-hover:-rotate-3 active:scale-95 active:rotate-0 transition-all duration-500 ease-out">
            {/* Animated gradient mesh overlay */}
            <div className="absolute inset-0 opacity-50">
              <div className="absolute top-0 right-0 w-20 h-20 bg-gradient-radial from-violet-300/40 to-transparent rounded-full blur-2xl animate-pulse"></div>
              <div className="absolute bottom-0 left-0 w-16 h-16 bg-gradient-radial from-purple-400/50 to-transparent rounded-full blur-xl"></div>
            </div>
            
            {/* Shine effect on hover */}
            <div className="absolute inset-0 bg-gradient-to-br from-white/0 via-white/20 to-white/0 translate-x-[-200%] group-hover:translate-x-[200%] transition-transform duration-1000 ease-out"></div>
            
            {/* Border glow */}
            <div className="absolute inset-0 rounded-2xl border-2 border-white/10 group-hover:border-white/30 transition-colors duration-300"></div>
            
            {/* Icon container */}
            <div className="absolute inset-0 flex items-center justify-center">
              {loadingRecommendations ? (
                <div className="relative">
                  <div className="animate-spin rounded-full h-8 w-8 border-3 border-white/30 border-t-white"></div>
                  <div className="absolute inset-0 animate-ping rounded-full border-2 border-white/20"></div>
                </div>
              ) : (
                <div className="relative group-hover:scale-110 transition-transform duration-300">
                  <SparklesIcon className="h-9 w-9 md:h-11 md:w-11 text-white drop-shadow-lg" strokeWidth={2} />
                  {/* Pulsing glow behind icon */}
                  <div className="absolute inset-0 bg-white/30 rounded-full blur-md scale-150 animate-pulse"></div>
                </div>
              )}
            </div>
          </div>
          
          {/* Notification badge */}
          {!loadingRecommendations && aiRecommendations && aiRecommendations.topRecommendations.length > 0 && (
            <div className="absolute -top-1 -right-1 md:-top-2 md:-right-2">
              <div className="relative">
                {/* Badge glow */}
                <div className="absolute inset-0 bg-gradient-to-br from-green-400 to-emerald-500 rounded-full blur-md opacity-75 animate-pulse"></div>
                {/* Badge surface */}
                <div className="relative flex items-center justify-center min-w-[28px] h-7 px-2 rounded-full bg-gradient-to-br from-green-400 to-emerald-500 border-2 border-white shadow-lg">
                  <span className="text-xs font-bold text-white drop-shadow">
                    {aiRecommendations.summary.highPotential > 0 
                      ? aiRecommendations.summary.highPotential 
                      : aiRecommendations.topRecommendations.length}
                  </span>
                </div>
              </div>
            </div>
          )}
          
          {/* New indicator dot for first-time users */}
          {!aiRecommendations && !loadingRecommendations && (
            <div className="absolute -top-1 -right-1">
              <div className="relative w-3 h-3">
                <div className="absolute inset-0 bg-green-400 rounded-full animate-ping"></div>
                <div className="relative w-3 h-3 bg-green-500 rounded-full border-2 border-white shadow-lg"></div>
              </div>
            </div>
          )}
        </div>
        
        {/* Tooltip on hover */}
        <div className="absolute bottom-full right-0 mb-3 opacity-0 group-hover:opacity-100 pointer-events-none transition-opacity duration-300">
          <div className="relative">
            <div className="px-4 py-2 bg-gray-900/95 backdrop-blur-sm rounded-xl border border-white/10 shadow-2xl whitespace-nowrap">
              <p className="text-sm font-semibold text-white">
                {loadingRecommendations ? 'Analyzing candidates...' :
                 aiRecommendations ? 'View AI Recommendations' : 'Get AI-Powered Insights'}
              </p>
              {aiRecommendations && aiRecommendations.summary.highPotential > 0 && (
                <p className="text-xs text-gray-300 mt-0.5">
                  {aiRecommendations.summary.highPotential} high potential matches
                </p>
              )}
            </div>
            {/* Tooltip arrow */}
            <div className="absolute top-full right-6 -mt-1 w-2 h-2 bg-gray-900/95 border-r border-b border-white/10 transform rotate-45"></div>
          </div>
        </div>
      </button>
    )}
    
    {/* Message Modal */}
    {selectedApplicant && recruiterId && (
      <MessageModal
        isOpen={messageModalOpen}
        onClose={() => {
          setMessageModalOpen(false);
          setSelectedApplicant(null);
        }}
        studentId={selectedApplicant.student_id}
        recruiterId={recruiterId}
        studentName={selectedApplicant.student?.name || 'Candidate'}
        applicationId={selectedApplicant.id}
        opportunityId={selectedApplicant.opportunity_id}
        jobTitle={selectedApplicant.opportunity?.job_title || selectedApplicant.opportunity?.title}
        currentUserId={recruiterId}
        currentUserType="recruiter"
      />
    )}
    </>
  );
};

export default ApplicantsList;

