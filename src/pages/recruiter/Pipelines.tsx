import React, { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
// @ts-ignore
import {
  CandidateQuickView,
  PipelineSortMenu,
  PipelineAdvancedFilters,
} from "@/features/recruiter";
import { PipelineStats, QuickStats } from "@/features/recruiter";
import { FeatureGate } from "@/features/subscription";
import { useNotifications } from "@/features/notifications";
import { useOpportunities } from "@/features/opportunities";
import { usePipelineData } from "@/features/opportunities";
import { createNotification } from "@/features/notifications";
import {
  addCandidateToPipeline,
  moveCandidateToStage,
} from "@/features/opportunities";
import { PipelineFilters, PipelineSortOptions } from "@/shared/types/recruiter";
import { getLogger } from "@/shared/config/logging";
import { useUser } from "@/stores";
import toast from "react-hot-toast";
import {
  AIRecommendation,
  AIRecommendedColumn,
  AddFromTalentPoolModal,
  KanbanColumn,
  NextActionModal,
  PipelineBulkActionsBar,
  PipelineCandidate as PipelineCandidateUI,
  PipelineHeader,
  PipelineQuickFilters,
  STAGES,
} from "@/features/recruiter-pipeline";
import { PipelineCandidate as PipelineCandidateData } from "@/features/opportunities/model/usePipelineData";

interface PipelinesProps {
  onViewProfile: (candidate: PipelineCandidateUI) => void;
}

const logger = getLogger("Pipelines");

// AI score threshold for recommended candidates
const AI_RECOMMENDED_SCORE_THRESHOLD = 70;

/**
 * Pipelines - Recruitment pipeline management
 *
 * Wrapped with FeatureGate for pipeline_management add-on access control
 */
const PipelinesContent: React.FC<PipelinesProps> = ({ onViewProfile }) => {
  const { opportunities, loading: opportunitiesLoading } = useOpportunities() as { opportunities: any[], loading: boolean };

  // State
  const [selectedJob, setSelectedJob] = useState<number | null>(null);
  const [showQuickView, setShowQuickView] = useState(false);
  const [selectedCandidate, setSelectedCandidate] =
    useState<PipelineCandidateUI | null>(null);
  const [globalSearch, setGlobalSearch] = useState("");
  const [movingCandidates, setMovingCandidates] = useState<number[]>([]);
  const [showAIRecommendedOnly, setShowAIRecommendedOnly] = useState(false);
  const [selectedCandidates, setSelectedCandidates] = useState<number[]>([]);

  // Modal states
  const [showAddFromTalentPool, setShowAddFromTalentPool] = useState(false);
  const [addToStage, setAddToStage] = useState<string | null>(null);
  const [showNextActionModal, setShowNextActionModal] = useState(false);
  const [selectedCandidateForAction, setSelectedCandidateForAction] =
    useState<PipelineCandidateUI | null>(null);
  const [showBulkRejectConfirm, setShowBulkRejectConfirm] = useState(false);

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
    lastUpdated: {
      preset: undefined,
      startDate: undefined,
      endDate: undefined,
    },
  });

  const [sortOptions, setSortOptions] = useState<PipelineSortOptions>({
    field: "updated_at",
    direction: "desc",
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
    getConversionRate,
  } = usePipelineData(selectedJob, filters, sortOptions);

  // Get current recruiter ID from reactive auth store
  const currentUser = useUser();
  const currentRecruiterId = currentUser?.id ?? null;

  useNotifications(currentRecruiterId);

  const selectedJobDetails = opportunities.find(
    (job: any) => job.id === selectedJob,
  );
  const jobTitle =
    selectedJobDetails?.job_title || selectedJobDetails?.title || "Job";

  // Set initial selected job
  useEffect(() => {
    if (!opportunitiesLoading && opportunities.length > 0 && !selectedJob) {
      const sortedOpportunities = [...opportunities].sort((a, b) => {
        const dateA = new Date(
          (a as any).updated_at || (a as any).created_at || "",
        );
        const dateB = new Date(
          (b as any).updated_at || (b as any).created_at || "",
        );
        return dateB.getTime() - dateA.getTime();
      });
      setSelectedJob((sortedOpportunities[0] as any).id);
    }
  }, [opportunitiesLoading, opportunities, selectedJob]);

  // Handlers
  const handleCandidateMove = async (candidateId: number, newStage: string) => {
    let movedCandidate: PipelineCandidateData | null = null;

    Object.keys(pipelineData).forEach((stage) => {
      const candidate = pipelineData[stage as keyof typeof pipelineData].find(
        (c) => c.id === candidateId,
      );
      if (candidate) {
        movedCandidate = candidate;
      }
    });

    if (!movedCandidate) return;

    setMovingCandidates((prev) => [...prev, candidateId]);

    // Capture snapshot before optimistic update
    const preSnapshot = {
      sourced: [...pipelineData.sourced],
      screened: [...pipelineData.screened],
      interview_1: [...pipelineData.interview_1],
      interview_2: [...pipelineData.interview_2],
      offer: [...pipelineData.offer],
      hired: [...pipelineData.hired]
    };

    try {
      // Optimistic update — deep-clone each stage array to avoid stale references
      setPipelineData((prev) => {
        const newData = {
          sourced: [...prev.sourced],
          screened: [...prev.screened],
          interview_1: [...prev.interview_1],
          interview_2: [...prev.interview_2],
          offer: [...prev.offer],
          hired: [...prev.hired]
        };
        Object.keys(newData).forEach((stage) => {
          newData[stage as keyof typeof newData] = newData[
            stage as keyof typeof newData
          ].filter((c) => c.id !== candidateId);
        });
        if (newData[newStage as keyof typeof newData]) {
          newData[newStage as keyof typeof newData].push({
            ...movedCandidate!,
            last_updated: new Date().toISOString(),
          });
        }
        return newData;
      });

      const result = await moveCandidateToStage(candidateId, newStage);

      if (result.error) {
        setPipelineData(preSnapshot);
        toast.error((result.error as any).message || "Unknown error");
        return;
      }

      toast.success(`Successfully moved to ${newStage.replace("_", " ")}`);

      if (currentRecruiterId && movedCandidate) {
        try {
          await createNotification(
            currentRecruiterId,
            "pipeline_stage_changed",
            `Candidate moved to ${newStage}`,
            `${(movedCandidate as PipelineCandidateData).name} has been moved to the "${newStage}" stage.`,
          );
        } catch (notifyError: unknown) {
          logger.error('Error sending stage-change notification', notifyError instanceof Error ? notifyError : undefined);
        }
      }
    } catch (error) {
      // Revert to pre-move state using the captured snapshot
      setPipelineData(preSnapshot);
      toast.error("Failed to move candidate. Please try again.");
    } finally {
      setMovingCandidates((prev) => prev.filter((id) => id !== candidateId));
    }
  };

  const handleBulkEmail = () => {
    const candidateNames = selectedCandidates
      .map((id) => {
        const candidate = Object.values(pipelineData)
          .flat()
          .find((c) => c.id === id);
        return candidate?.name;
      })
      .filter(Boolean);

    if (candidateNames.length === 0) {
      toast.error("Please select candidates first");
      return;
    }

    toast(`Opening email composer for ${candidateNames.length} candidate(s)...`);
    // Selection preserved — user may still need it when the composer opens
  };

  const handleBulkWhatsApp = () => {
    const count = selectedCandidates.length;
    if (count === 0) {
      toast.error("Please select candidates first");
      return;
    }
    toast(`Preparing WhatsApp messages for ${count} candidate(s)...`);
    setSelectedCandidates([]);
  };

  const handleAssignInterviewer = () => {
    const count = selectedCandidates.length;
    if (count === 0) {
      toast.error("Please select candidates first");
      return;
    }
    toast(`Opening interviewer assignment for ${count} candidate(s)...`);
    setSelectedCandidates([]);
  };

  const handleBulkReject = async () => {
    const count = selectedCandidates.length;
    if (count === 0) {
      toast.error("Please select candidates first");
      return;
    }

    if (!currentRecruiterId) {
      toast.error('Bulk reject is not available — no recruiter session found.');
      return;
    }

    setShowBulkRejectConfirm(true);
  };

  const confirmBulkReject = () => {
    setShowBulkRejectConfirm(false);

    // TODO: Implement backend API endpoint for bulk reject before enabling this feature
    toast.error('Bulk reject feature is not yet implemented. Please reject candidates individually.');
  };

  const handleExportPipeline = () => {
    const allCandidates = Object.entries(pipelineData).flatMap(
      ([stage, candidates]) =>
        candidates.map((candidate: PipelineCandidateData) => ({
          ...candidate,
          stage,
        })),
    );

    if (allCandidates.length === 0) {
      toast.error("No candidates in pipeline to export");
      return;
    }

    // Helper to escape CSV values and prevent formula injection
    const escapeCsvValue = (value: string | number): string => {
      const str = String(value);
      // Prevent CSV injection by prefixing dangerous characters with single quote
      if (str.match(/^[=+\-@]/)) {
        return `"'${str.replace(/"/g, '""')}"`;
      }
      // Standard CSV escaping
      return `"${str.replace(/"/g, '""')}"`;
    };

    const csvContent = [
      "Name,Department,College,Location,Stage,AI Score,Skills,Last Updated",
      ...allCandidates.map(
        (candidate) =>
          `${escapeCsvValue(candidate.name)},${escapeCsvValue(candidate.dept)},${escapeCsvValue(candidate.college)},${escapeCsvValue(candidate.location)},${escapeCsvValue(candidate.stage)},${candidate.ai_score_overall},${escapeCsvValue(candidate.skills.join("; "))},${escapeCsvValue(new Date(candidate.last_updated).toLocaleDateString())}`,
      ),
    ].join("\n");

    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const link = document.createElement("a");
    const objectUrl = URL.createObjectURL(blob);
    link.setAttribute("href", objectUrl);
    link.setAttribute(
      "download",
      `pipeline_${jobTitle.replace(/\s+/g, "_")}_${new Date().toISOString().split("T")[0]}.csv`,
    );
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(objectUrl);

    toast.success(`${allCandidates.length} candidates exported successfully`);
  };

  const toggleCandidateSelection = (candidateId: number) => {
    setSelectedCandidates((prev) =>
      prev.includes(candidateId)
        ? prev.filter((id) => id !== candidateId)
        : [...prev, candidateId],
    );
  };

  const handleSendEmail = (candidate: PipelineCandidateUI) => {
    toast(`Opening email composer for ${candidate.name}...`);
  };

  const handleCandidateView = (candidate: PipelineCandidateUI) => {
    setSelectedCandidate(candidate);
    setShowQuickView(true);
  };

  // Handle moving AI recommended candidate to screened stage
  const handleMoveAIRecommendedToScreened = async (
    rec: AIRecommendation,
    pipelineCandidate: any,
  ) => {
    if (!selectedJob) {
      toast.error("Please select a job first");
      return;
    }

    try {
      // Check if candidate already exists in pipeline by looking in pipelineData
      let existingPipelineId: number | null = null;
      let existingStage: string | null = null;

      Object.keys(pipelineData).forEach((stage) => {
        const found = pipelineData[stage as keyof typeof pipelineData].find(
          (c) => c.student_id === pipelineCandidate?.student_id,
        );
        if (found) {
          existingPipelineId = found.id;
          existingStage = stage;
        }
      });

      if (existingPipelineId && existingStage !== "screened") {
        // Candidate exists in pipeline, move them
        await handleCandidateMove(existingPipelineId, "screened");
      } else if (existingPipelineId && existingStage === "screened") {
        toast(`${rec.studentName} is already in the Screened stage`);
      } else {
        // Candidate not in pipeline, add them directly to screened
        const result = await addCandidateToPipeline({
          opportunity_id: selectedJob,
          student_id: pipelineCandidate?.student_id || rec.applicantId,
          candidate_name:
            rec.studentName || pipelineCandidate?.name || "Unknown",
          candidate_email: pipelineCandidate?.email || "",
          stage: "screened",
          source: "ai_recommended",
          added_by: currentRecruiterId || undefined,
        });

        if (result.error) {
          const errorMsg =
            (result.error as any)?.message || "Failed to add candidate";
          if (errorMsg.includes("already in this pipeline")) {
            toast(`${rec.studentName} is already in the pipeline`);
          } else {
            toast.error(errorMsg);
          }
          return;
        }

        // Refresh pipeline data
        loadPipelineCandidates();
        toast.success(`${rec.studentName} has been added to Screened stage`);
      }
    } catch (error) {
      logger.error("Error moving AI recommended candidate:", error instanceof Error ? error : undefined);
      toast.error("Failed to move candidate. Please try again.");
    }
  };

  const handleAddFromTalentPool = (stage: string) => {
    setAddToStage(stage);
    setShowAddFromTalentPool(true);
  };

  const handleNextAction = (candidate: PipelineCandidateUI) => {
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
      dateAdded: {
        preset: undefined,
        startDate: undefined,
        endDate: undefined,
      },
      lastUpdated: {
        preset: undefined,
        startDate: undefined,
        endDate: undefined,
      },
    });
  };

  // Filtered pipeline data
  const filteredPipelineData = useMemo(() => {
    // Deep clone to avoid mutating original pipelineData
    const filtered = {
      sourced: [...pipelineData.sourced],
      screened: [...pipelineData.screened],
      interview_1: [...pipelineData.interview_1],
      interview_2: [...pipelineData.interview_2],
      offer: [...pipelineData.offer],
      hired: [...pipelineData.hired]
    };

    if (showAIRecommendedOnly) {
      filtered.sourced = filtered.sourced.filter((c) => c.ai_score_overall >= AI_RECOMMENDED_SCORE_THRESHOLD);
      filtered.screened = filtered.screened.filter((c) => c.ai_score_overall >= AI_RECOMMENDED_SCORE_THRESHOLD);
    }

    if (globalSearch.trim()) {
      const searchLower = globalSearch.toLowerCase();
      Object.keys(filtered).forEach((stage) => {
        filtered[stage as keyof typeof filtered] = filtered[
          stage as keyof typeof filtered
        ].filter(
          (candidate) =>
            candidate.name?.toLowerCase().includes(searchLower) ||
            candidate.email?.toLowerCase().includes(searchLower) ||
            candidate.dept?.toLowerCase().includes(searchLower) ||
            candidate.college?.toLowerCase().includes(searchLower) ||
            candidate.skills?.some((skill) =>
              skill.toLowerCase().includes(searchLower),
            ),
        );
      });
    }

    return filtered;
  }, [pipelineData, showAIRecommendedOnly, globalSearch]);

  const totalAIRecommended =
    aiRecommendations?.topRecommendations?.length ||
    (pipelineData.sourced?.length || 0) + (pipelineData.screened?.length || 0);

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
        onAddCandidates={() =>
          toast("Add candidates modal will be available shortly")
        }
        onExportPipeline={handleExportPipeline}
        onRefresh={() => {
          loadPipelineCandidates();
          toast("Loading latest candidate data...");
        }}
      />

      {/* Quick Stats & Filters Row */}
      <div className="bg-gray-50 border-b border-gray-200 px-6 py-4">
        <div className="flex items-center justify-between mb-3">
          <QuickStats
            total={getTotalCandidates()}
            company={selectedJobDetails?.company_name || "Unassigned"}
            daysAging={
              selectedJobDetails?.created_at
                ? Math.floor(
                    (Date.now() -
                      new Date(selectedJobDetails.created_at).getTime()) /
                      (1000 * 60 * 60 * 24),
                  )
                : 0
            }
            activeStages={
              Object.values(pipelineData).filter((stage) => stage.length > 0)
                .length
            }
          />

          <div className="flex items-center gap-3">
            <PipelineSortMenu
              sortOptions={sortOptions}
              onSortChange={setSortOptions}
            />
            <PipelineAdvancedFilters
              filters={filters}
              onFiltersChange={setFilters}
              onReset={handleResetFilters}
            />
          </div>
        </div>

        <PipelineStats
          metrics={[
            {
              label: "Sourced → Screened",
              from: "sourced",
              to: "screened",
              rate: getConversionRate("sourced", "screened"),
              fromCount: pipelineData.sourced?.length || 0,
              toCount: pipelineData.screened?.length || 0,
            },
            {
              label: "Interview → Offer",
              from: "interview_1",
              to: "offer",
              rate: getConversionRate("interview_1", "offer"),
              fromCount: pipelineData.interview_1?.length || 0,
              toCount: pipelineData.offer?.length || 0,
            },
            {
              label: "Offer → Hired",
              from: "offer",
              to: "hired",
              rate: getConversionRate("offer", "hired"),
              fromCount: pipelineData.offer?.length || 0,
              toCount: pipelineData.hired?.length || 0,
            },
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
      />

      {/* Kanban Board */}
      <div className="flex-1 overflow-x-auto overflow-y-hidden p-6">
        <div className="flex space-x-6 h-full">
          {STAGES.map((stage, index) => (
            <React.Fragment key={stage.key}>
              <KanbanColumn
                stageKey={stage.key}
                title={stage.label}
                count={
                  filteredPipelineData[
                    stage.key as keyof typeof filteredPipelineData
                  ]?.length || 0
                }
                color={stage.color}
                candidates={
                  (filteredPipelineData[
                    stage.key as keyof typeof filteredPipelineData
                  ] || []).map(c => ({
                    ...c,
                    id: String(c.id),
                    student_id: String(c.student_id)
                  }))
                }
                onCandidateMove={(candidateId, targetStage) => handleCandidateMove(Number(candidateId), targetStage)}
                onCandidateView={(candidate) => handleCandidateView({ ...candidate, id: Number(candidate.id), student_id: Number(candidate.student_id) } as PipelineCandidateUI)}
                selectedCandidates={selectedCandidates.map(String)}
                onToggleSelect={(id) => toggleCandidateSelection(Number(id))}
                onSendEmail={(candidate) => handleSendEmail({ ...candidate, id: Number(candidate.id), student_id: Number(candidate.student_id) } as PipelineCandidateUI)}
                onAddClick={() => handleAddFromTalentPool(stage.key)}
                onNextAction={(candidate) => handleNextAction({ ...candidate, id: Number(candidate.id), student_id: Number(candidate.student_id) } as PipelineCandidateUI)}
                movingCandidates={movingCandidates.map(String)}
              />
              {index === 0 && (
                <AIRecommendedColumn
                  recommendations={aiRecommendations}
                  loading={loadingRecommendations}
                  onCandidateMove={(id: number | string, stage: string) => handleCandidateMove(Number(id), stage)}
                  pipelineCandidates={allPipelineCandidatesForAI}
                  onCandidateView={(candidate) => handleCandidateView({ ...candidate, id: Number(candidate.id), student_id: Number(candidate.student_id) } as PipelineCandidateUI)}
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

      {/* Bulk Reject Confirmation Modal */}
      {showBulkRejectConfirm && (
        <div 
          className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50"
          role="dialog"
          aria-modal="true"
          aria-labelledby="bulk-reject-title"
        >
          <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4">
            <h3 id="bulk-reject-title" className="text-lg font-semibold mb-4">Confirm Bulk Rejection</h3>
            <p className="text-gray-600 mb-6">
              Are you sure you want to reject {selectedCandidates.length} candidate(s)?
              <br />
              <br />
              This action cannot be undone.
            </p>
            <div className="flex justify-end gap-3">
              <button
                onClick={() => setShowBulkRejectConfirm(false)}
                className="px-4 py-2 text-gray-700 bg-gray-100 rounded hover:bg-gray-200"
              >
                Cancel
              </button>
              <button
                onClick={confirmBulkReject}
                className="px-4 py-2 text-white bg-red-600 rounded hover:bg-red-700"
              >
                Reject {selectedCandidates.length} Candidate(s)
              </button>
            </div>
          </div>
        </div>
      )}

      <CandidateQuickView
        isOpen={showQuickView}
        onClose={() => setShowQuickView(false)}
        candidate={selectedCandidate}
        onFullView={() => {
          setShowQuickView(false);
          if (selectedCandidate) onViewProfile(selectedCandidate);
        }}
        onSendEmail={handleSendEmail}
        onScheduleCall={(candidate: PipelineCandidateUI) =>
          toast(`Opening calendar for ${candidate.name}`)
        }
        onNextAction={(candidate) => {
          setShowQuickView(false);
          handleNextAction(candidate);
        }}
      />
    </div>
  );
};

/**
 * Wrapped Pipelines with FeatureGate for pipeline_management add-on
 */
const Pipelines: React.FC<PipelinesProps> = (props) => {
  const navigate = useNavigate();
  
  return (
    <FeatureGate 
      featureKey="pipeline_management" 
      showUpgradePrompt={true}
      fallback={null}
      onUpgradeClick={() => navigate('/billing')}
    >
      <PipelinesContent {...props} />
    </FeatureGate>
  );
};

export default Pipelines;
