import React, { useState, useEffect } from 'react';
// @ts-ignore
import { useOpportunities } from '../../hooks/useOpportunities';
import { useNotifications } from '../../hooks/useNotifications';
import { usePipelineData } from '../../hooks/usePipelineData';
import { moveCandidateToStage } from '../../services/pipelineService';
import { createNotification } from '../../services/notificationService.ts';
import PipelineAdvancedFilters from '../../components/Recruiter/components/PipelineAdvancedFilters';
import PipelineSortMenu from '../../components/Recruiter/components/PipelineSortMenu';
import { PipelineFilters, PipelineSortOptions } from '../../types/recruiter';
import { useToast } from '../../components/Recruiter/components/Toast';
import { CandidateQuickView } from '../../components/Recruiter/components/CandidateQuickView';
import { PipelineStats, QuickStats } from '../../components/Recruiter/components/PipelineStats';
import { addCandidateToPipeline } from '../../services/pipelineService';

// Pipeline components
import {
  KanbanColumn,
  AIRecommendedColumn,
  AddFromTalentPoolModal,
  NextActionModal,
  PipelineHeader,
  PipelineBulkActionsBar,
  PipelineQuickFilters,
  STAGES,
  PipelineCandidate,
  AIRecommendation
} from '../../components/Recruiter/components/pipeline';

interface PipelinesProps {
  onViewProfile: (candidate: PipelineCandidate) => void;
}

const Pipelines: React.FC<PipelinesProps> = ({ onViewProfile }) => {
  const { opportunities, loading: opportunitiesLoading } = useOpportunities();
  const { addToast } = useToast();

  // State
  const [selectedJob, setSelectedJob] = useState<number | null>(null);
  const [showQuickView, setShowQuickView] = useState(false);
  const [selectedCandidate, setSelectedCandidate] = useState<PipelineCandidate | null>(null);
  const [globalSearch, setGlobalSearch] = useState('');
  const [movingCandidates, setMovingCandidates] = useState<number[]>([]);
  const [showAIRecommendedOnly, setShowAIRecommendedOnly] = useState(false);
  const [selectedCandidates, setSelectedCandidates] = useState<number[]>([]);

  // Modal states
  const [showAddFromTalentPool, setShowAddFromTalentPool] = useState(false);
  const [addToStage, setAddToStage] = useState<string | null>(null);
  const [showNextActionModal, setShowNextActionModal] = useState(false);
  const [selectedCandidateForAction, setSelectedCandidateForAction] = useState<PipelineCandidate | null>(null);

  // Filter states
  const [filters, setFilters] = useState<PipelineFilters>({
    stages: [],
    skills: [],
    departments: [],
    locations: [],
    sources: [],
    aiScoreRange: {},
    nextActionTypes: [],
    hasNextAction: null,
    assignedTo: [],
    dateAdded: { preset: undefined, startDate: undefined, endDate: undefined },
    lastUpdated: { preset: undefined, startDate: undefined, endDate: undefined }
  });

  const [sortOptions, setSortOptions] = useState<PipelineSortOptions>({
    field: 'updated_at',
    direction: 'desc'
  });

  // Custom hook for pipeline data
  const {
    pipelineData,
    setPipelineData,
    loadPipelineCandidates,
    aiRecommendations,
    loadingRecommendations,
    allPipelineCandidatesForAI,
    getTotalCandidates,
    getConversionRate
  } = usePipelineData(selectedJob, filters, sortOptions);

  // Get current recruiter ID
  let currentRecruiterId: string | null = null;
  try {
    const userStr = localStorage.getItem('user');
    if (userStr) {
      const user = JSON.parse(userStr);
      currentRecruiterId = user.id || user.recruiter_id;
    }
  } catch (e) {}

  useNotifications(currentRecruiterId);

  const selectedJobDetails = opportunities.find((job: any) => job.id === selectedJob);
  const jobTitle = selectedJobDetails?.job_title || selectedJobDetails?.title || 'Job';

  // Set initial selected job
  useEffect(() => {
    if (!opportunitiesLoading && opportunities.length > 0 && !selectedJob) {
      const sortedOpportunities = [...opportunities].sort((a, b) => {
        const dateA = new Date((a as any).updated_at || (a as any).created_at || '');
        const dateB = new Date((b as any).updated_at || (b as any).created_at || '');
        return dateB.getTime() - dateA.getTime();
      });
      setSelectedJob((sortedOpportunities[0] as any).id);
    }
  }, [opportunitiesLoading, opportunities, selectedJob]);

  // Handlers
  const handleCandidateMove = async (candidateId: number, newStage: string) => {
    let movedCandidate: PipelineCandidate | null = null;
    let oldStage: string | null = null;

    Object.keys(pipelineData).forEach(stage => {
      const candidate = pipelineData[stage as keyof typeof pipelineData].find(c => c.id === candidateId);
      if (candidate) {
        movedCandidate = candidate;
        oldStage = stage;
      }
    });

    if (!movedCandidate) return;

    setMovingCandidates(prev => [...prev, candidateId]);

    // Optimistic update
    setPipelineData(prev => {
      const newData = { ...prev };
      Object.keys(newData).forEach(stage => {
        newData[stage as keyof typeof newData] = newData[stage as keyof typeof newData].filter(c => c.id !== candidateId);
      });
      if (newData[newStage as keyof typeof newData]) {
        newData[newStage as keyof typeof newData].push({
          ...movedCandidate!,
          last_updated: new Date().toISOString(),
        });
      }
      return newData;
    });

    try {
      const result = await moveCandidateToStage(candidateId, newStage);

      if (result.error) {
        // Revert on error
        setPipelineData(prev => {
          const newData = { ...prev };
          newData[newStage as keyof typeof newData] = newData[newStage as keyof typeof newData].filter(c => c.id !== candidateId);
          if (oldStage && newData[oldStage as keyof typeof newData]) {
            newData[oldStage as keyof typeof newData].push(movedCandidate!);
          }
          return newData;
        });
        addToast('error', 'Move Failed', (result.error as any).message || 'Unknown error');
        return;
      }

      addToast('success', 'Candidate Moved!', `Successfully moved to ${newStage.replace('_', ' ')}`);

      if (currentRecruiterId && movedCandidate) {
        await createNotification(
          currentRecruiterId,
          "pipeline_stage_changed",
          `Candidate moved to ${newStage}`,
          `${(movedCandidate as PipelineCandidate).name} has been moved to the "${newStage}" stage.`
        );
      }
    } catch (error) {
      // Revert on error
      setPipelineData(prev => {
        const newData = { ...prev };
        newData[newStage as keyof typeof newData] = newData[newStage as keyof typeof newData].filter(c => c.id !== candidateId);
        if (oldStage && newData[oldStage as keyof typeof newData]) {
          newData[oldStage as keyof typeof newData].push(movedCandidate!);
        }
        return newData;
      });
      addToast('error', 'Error', 'Failed to move candidate. Please try again.');
    } finally {
      setMovingCandidates(prev => prev.filter(id => id !== candidateId));
    }
  };

  const handleBulkEmail = () => {
    const candidateNames = selectedCandidates.map(id => {
      const candidate = Object.values(pipelineData).flat().find(c => c.id === id);
      return candidate?.name;
    }).filter(Boolean);

    if (candidateNames.length === 0) {
      addToast('warning', 'No Selection', 'Please select candidates first');
      return;
    }

    addToast('success', 'Bulk Email Sent!', `Emails queued for ${candidateNames.length} candidate(s)`);
    setSelectedCandidates([]);
  };

  const handleBulkWhatsApp = () => {
    const count = selectedCandidates.length;
    if (count === 0) {
      addToast('warning', 'No Selection', 'Please select candidates first');
      return;
    }
    addToast('success', 'WhatsApp Messages Sent!', `Messages delivered to ${count} candidate(s)`);
    setSelectedCandidates([]);
  };

  const handleAssignInterviewer = () => {
    const count = selectedCandidates.length;
    if (count === 0) {
      addToast('warning', 'No Selection', 'Please select candidates first');
      return;
    }
    addToast('success', 'Interviewer Assignment', `Ready to assign interviewer to ${count} candidate(s)`);
    setSelectedCandidates([]);
  };

  const handleBulkReject = async () => {
    const count = selectedCandidates.length;
    if (count === 0) {
      addToast('warning', 'No Selection', 'Please select candidates first');
      return;
    }

    const confirmed = window.confirm(`Are you sure you want to reject ${count} candidate(s)?\n\nThis action cannot be undone.`);

    if (confirmed) {
      setPipelineData(prev => {
        const newData = { ...prev };
        selectedCandidates.forEach(candidateId => {
          Object.keys(newData).forEach(stage => {
            newData[stage as keyof typeof newData] = newData[stage as keyof typeof newData].filter(c => c.id !== candidateId);
          });
        });
        return newData;
      });

      addToast('success', 'Candidates Rejected', `${count} candidate(s) removed from pipeline`);

      if (selectedJob) {
        await createNotification(
          selectedJob.toString(),
          "candidate_rejected",
          "Candidates Rejected",
          `${count} candidate(s) were rejected from ${jobTitle}.`
        );
      }

      setSelectedCandidates([]);
    }
  };

  const handleExportPipeline = () => {
    const allCandidates = Object.entries(pipelineData).flatMap(([stage, candidates]) =>
      candidates.map((candidate: PipelineCandidate) => ({ ...candidate, stage }))
    );

    if (allCandidates.length === 0) {
      addToast('warning', 'No Data', 'No candidates in pipeline to export');
      return;
    }

    const csvContent = [
      'Name,Department,College,Location,Stage,AI Score,Skills,Last Updated',
      ...allCandidates.map(candidate =>
        `"${candidate.name}","${candidate.dept}","${candidate.college}","${candidate.location}","${candidate.stage}",${candidate.ai_score_overall},"${candidate.skills.join('; ')}","${new Date(candidate.last_updated).toLocaleDateString()}"`
      )
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.setAttribute('href', URL.createObjectURL(blob));
    link.setAttribute('download', `pipeline_${jobTitle.replace(/\s+/g, '_')}_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    addToast('success', 'Pipeline Exported!', `${allCandidates.length} candidates exported successfully`);
  };

  const toggleCandidateSelection = (candidateId: number) => {
    setSelectedCandidates(prev =>
      prev.includes(candidateId) ? prev.filter(id => id !== candidateId) : [...prev, candidateId]
    );
  };

  const handleSendEmail = (candidate: PipelineCandidate) => {
    addToast('success', 'Email Sent', `Email sent to ${candidate.name}`);
  };

  const handleCandidateView = (candidate: PipelineCandidate) => {
    setSelectedCandidate(candidate);
    setShowQuickView(true);
  };

  // Handle moving AI recommended candidate to screened stage
  const handleMoveAIRecommendedToScreened = async (rec: AIRecommendation, pipelineCandidate: any) => {
    if (!selectedJob) {
      addToast('error', 'Error', 'Please select a job first');
      return;
    }

    try {
      // Check if candidate already exists in pipeline by looking in pipelineData
      let existingPipelineId: number | null = null;
      let existingStage: string | null = null;
      
      Object.keys(pipelineData).forEach(stage => {
        const found = pipelineData[stage as keyof typeof pipelineData].find(
          c => c.student_id === pipelineCandidate?.student_id
        );
        if (found) {
          existingPipelineId = found.id;
          existingStage = stage;
        }
      });

      if (existingPipelineId && existingStage !== 'screened') {
        // Candidate exists in pipeline, move them
        await handleCandidateMove(existingPipelineId, 'screened');
      } else if (existingPipelineId && existingStage === 'screened') {
        addToast('info', 'Already Screened', `${rec.studentName} is already in the Screened stage`);
      } else {
        // Candidate not in pipeline, add them directly to screened
        const result = await addCandidateToPipeline({
          opportunity_id: selectedJob,
          student_id: pipelineCandidate?.student_id || rec.applicantId.toString(),
          candidate_name: rec.studentName || pipelineCandidate?.name || 'Unknown',
          candidate_email: pipelineCandidate?.email || '',
          stage: 'screened',
          source: 'ai_recommended',
          added_by: currentRecruiterId || undefined
        });

        if (result.error) {
          const errorMsg = (result.error as any)?.message || 'Failed to add candidate';
          if (errorMsg.includes('already in this pipeline')) {
            addToast('info', 'Already Added', `${rec.studentName} is already in the pipeline`);
          } else {
            addToast('error', 'Error', errorMsg);
          }
          return;
        }

        // Refresh pipeline data
        loadPipelineCandidates();
        addToast('success', 'Moved to Screened', `${rec.studentName} has been added to Screened stage`);
      }
    } catch (error) {
      console.error('Error moving AI recommended candidate:', error);
      addToast('error', 'Error', 'Failed to move candidate. Please try again.');
    }
  };

  const handleAddFromTalentPool = (stage: string) => {
    setAddToStage(stage);
    setShowAddFromTalentPool(true);
  };

  const handleNextAction = (candidate: PipelineCandidate) => {
    setSelectedCandidateForAction(candidate);
    setShowNextActionModal(true);
  };

  const handleResetFilters = () => {
    setFilters({
      stages: [],
      skills: [],
      departments: [],
      locations: [],
      sources: [],
      aiScoreRange: {},
      nextActionTypes: [],
      hasNextAction: null,
      assignedTo: [],
      dateAdded: { preset: undefined, startDate: undefined, endDate: undefined },
      lastUpdated: { preset: undefined, startDate: undefined, endDate: undefined }
    });
  };

  // Filtered pipeline data
  const getFilteredPipelineData = () => {
    let filtered = { ...pipelineData };
    
    if (showAIRecommendedOnly) {
      Object.keys(filtered).forEach(stage => {
        if (stage === 'sourced' || stage === 'screened') {
          filtered[stage as keyof typeof filtered] = filtered[stage as keyof typeof filtered].filter(c => c.ai_score_overall >= 70);
        }
      });
    }
    
    if (globalSearch.trim()) {
      const searchLower = globalSearch.toLowerCase();
      Object.keys(filtered).forEach(stage => {
        filtered[stage as keyof typeof filtered] = filtered[stage as keyof typeof filtered].filter(candidate => 
          candidate.name?.toLowerCase().includes(searchLower) ||
          candidate.email?.toLowerCase().includes(searchLower) ||
          candidate.dept?.toLowerCase().includes(searchLower) ||
          candidate.college?.toLowerCase().includes(searchLower) ||
          candidate.skills?.some(skill => skill.toLowerCase().includes(searchLower))
        );
      });
    }
    
    return filtered;
  };

  const filteredPipelineData = getFilteredPipelineData();
  const totalAIRecommended = aiRecommendations?.topRecommendations?.length || 
    ((pipelineData.sourced?.length || 0) + (pipelineData.screened?.length || 0));

  return (
    <div className="flex flex-col h-screen">
      {/* Header */}
      <PipelineHeader
        globalSearch={globalSearch}
        setGlobalSearch={setGlobalSearch}
        opportunities={opportunities}
        selectedJob={selectedJob}
        setSelectedJob={setSelectedJob}
        getTotalCandidates={getTotalCandidates}
        onAddCandidates={() => addToast('info', 'Feature Coming Soon', 'Add candidates modal will be available shortly')}
        onExportPipeline={handleExportPipeline}
        onRefresh={() => {
          loadPipelineCandidates();
          addToast('info', 'Refreshing', 'Loading latest candidate data...');
        }}
      />

      {/* Quick Stats & Filters Row */}
      <div className="bg-gray-50 border-b border-gray-200 px-6 py-4">
        <div className="flex items-center justify-between mb-3">
          <QuickStats
            total={getTotalCandidates()}
            company={selectedJobDetails?.company_name || 'Unassigned'}
            daysAging={
              selectedJobDetails?.created_at
                ? Math.floor((Date.now() - new Date(selectedJobDetails.created_at).getTime()) / (1000 * 60 * 60 * 24))
                : 0
            }
            activeStages={Object.values(pipelineData).filter(stage => stage.length > 0).length}
          />

          <div className="flex items-center gap-3">
            <PipelineSortMenu sortOptions={sortOptions} onSortChange={setSortOptions} />
            <PipelineAdvancedFilters filters={filters} onFiltersChange={setFilters} onReset={handleResetFilters} />
          </div>
        </div>

        <PipelineStats
          metrics={[
            {
              label: 'Sourced → Screened',
              from: 'sourced',
              to: 'screened',
              rate: getConversionRate('sourced', 'screened'),
              fromCount: pipelineData.sourced?.length || 0,
              toCount: pipelineData.screened?.length || 0
            },
            {
              label: 'Interview → Offer',
              from: 'interview_1',
              to: 'offer',
              rate: getConversionRate('interview_1', 'offer'),
              fromCount: pipelineData.interview_1?.length || 0,
              toCount: pipelineData.offer?.length || 0
            },
            {
              label: 'Offer → Hired',
              from: 'offer',
              to: 'hired',
              rate: getConversionRate('offer', 'hired'),
              fromCount: pipelineData.offer?.length || 0,
              toCount: pipelineData.hired?.length || 0
            }
          ]}
        />
      </div>

      {/* Quick Filters Bar */}
      <PipelineQuickFilters
        showAIRecommendedOnly={showAIRecommendedOnly}
        setShowAIRecommendedOnly={setShowAIRecommendedOnly}
        totalCandidates={getTotalCandidates()}
        totalAIRecommended={totalAIRecommended}
        globalSearch={globalSearch}
        setGlobalSearch={setGlobalSearch}
        onShowToast={addToast}
      />

      {/* Kanban Board */}
      <div className="flex-1 overflow-x-auto overflow-y-hidden p-6">
        <div className="flex space-x-6 h-full">
          {STAGES.map((stage, index) => (
            <React.Fragment key={stage.key}>
              <KanbanColumn
                stageKey={stage.key}
                title={stage.label}
                count={filteredPipelineData[stage.key as keyof typeof filteredPipelineData]?.length || 0}
                color={stage.color}
                candidates={filteredPipelineData[stage.key as keyof typeof filteredPipelineData] || []}
                onCandidateMove={handleCandidateMove}
                onCandidateView={handleCandidateView}
                selectedCandidates={selectedCandidates}
                onToggleSelect={toggleCandidateSelection}
                onSendEmail={handleSendEmail}
                onAddClick={() => handleAddFromTalentPool(stage.key)}
                onNextAction={handleNextAction}
                movingCandidates={movingCandidates}
              />
              {index === 0 && (
                <AIRecommendedColumn
                  recommendations={aiRecommendations}
                  loading={loadingRecommendations}
                  onCandidateMove={handleCandidateMove}
                  pipelineCandidates={allPipelineCandidatesForAI}
                  onCandidateView={handleCandidateView}
                  onMoveToScreened={handleMoveAIRecommendedToScreened}
                />
              )}
            </React.Fragment>
          ))}
        </div>
      </div>

      {/* Bulk Actions Bar */}
      <PipelineBulkActionsBar
        selectedCandidates={selectedCandidates}
        onBulkEmail={handleBulkEmail}
        onBulkWhatsApp={handleBulkWhatsApp}
        onAssignInterviewer={handleAssignInterviewer}
        onBulkReject={handleBulkReject}
        onClearSelection={() => setSelectedCandidates([])}
      />

      {/* Modals */}
      <AddFromTalentPoolModal
        isOpen={showAddFromTalentPool}
        onClose={() => setShowAddFromTalentPool(false)}
        requisitionId={selectedJob}
        targetStage={addToStage}
        onSuccess={loadPipelineCandidates}
      />

      <NextActionModal
        isOpen={showNextActionModal}
        onClose={() => setShowNextActionModal(false)}
        candidate={selectedCandidateForAction}
        onSuccess={loadPipelineCandidates}
      />

      <CandidateQuickView
        isOpen={showQuickView}
        onClose={() => setShowQuickView(false)}
        candidate={selectedCandidate}
        onFullView={() => {
          setShowQuickView(false);
          if (selectedCandidate) onViewProfile(selectedCandidate);
        }}
        onSendEmail={handleSendEmail}
        onScheduleCall={(candidate: PipelineCandidate) => addToast('info', 'Schedule Call', `Opening calendar for ${candidate.name}`)}
        onNextAction={(candidate) => {
          setShowQuickView(false);
          handleNextAction(candidate);
        }}
      />
    </div>
  );
};

export default Pipelines;
