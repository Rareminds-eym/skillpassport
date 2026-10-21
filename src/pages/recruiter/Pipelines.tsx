import type { QuickFilter } from "@/features/recruiter-pipeline/ui/pipeline/PipelineQuickFilters";
import {
  PipelineActionDialog,
  type PipelineAction,
} from "./shared/PipelineActionDialog";
import React, { useEffect, useState } from "react";
// @ts-ignore
import {
  CandidateQuickView,
  PipelineSortMenu,
  PipelineAdvancedFilters,
} from "@/features/recruiter";
import { PipelineStats, QuickStats } from "@/features/recruiter";
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
import toast from "react-hot-toast";
import { useAuthStore } from "@/shared/model/authStore";

const logger = getLogger("Pipelines");

// Pipeline components
import {
  AIRecommendation,
  AIRecommendedColumn,
  AddFromTalentPoolModal,
  KanbanColumn,
  NextActionModal,
  PipelineBulkActionsBar,
  PipelineCandidate,
  PipelineHeader,
  PipelineQuickFilters,
  STAGES,
} from "@/features/recruiter-pipeline";

interface PipelinesProps {
  onViewProfile: (candidate: PipelineCandidate) => void;
}

/**
 * Pipelines - Recruitment pipeline management
 *
 * Wrapped with FeatureGate for pipeline_management add-on access control
 */
const PipelinesContent: React.FC<PipelinesProps> = ({ onViewProfile }) => {
  const { opportunities, loading: opportunitiesLoading } = useOpportunities();

  // State
  const [selectedJob, setSelectedJob] = useState<string | null>(null);
  const [showQuickView, setShowQuickView] = useState(false);
  const [selectedCandidate, setSelectedCandidate] =
    useState<PipelineCandidate | null>(null);
  const [quickFilter, setQuickFilter] = useState<QuickFilter>(null);
  const [globalSearch, setGlobalSearch] = useState("");
  const [movingCandidates, setMovingCandidates] = useState<string[]>([]); // Changed to string for UUID
  const [showAIRecommendedOnly, setShowAIRecommendedOnly] = useState(false);
  const [selectedCandidates, setSelectedCandidates] = useState<string[]>([]); // Changed to string for UUID

  const [actionDialog, setActionDialog] = useState<{
    action: PipelineAction;
    candidates: PipelineCandidate[];
  } | null>(null);
  const openBulkAction = (action: PipelineAction) => {
    const candidates = Object.values(pipelineData)
      .flat()
      .filter((c) => selectedCandidates.includes(c.id));
    if (candidates.length) setActionDialog({ action, candidates });
    else toast.error("Please select candidates first");
  };

  // Modal states
  const [showAddFromTalentPool, setShowAddFromTalentPool] = useState(false);
  const [addToStage, setAddToStage] = useState<string | null>(null);
  const [showNextActionModal, setShowNextActionModal] = useState(false);
  const [selectedCandidateForAction, setSelectedCandidateForAction] =
    useState<PipelineCandidate | null>(null);

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

  // Get current recruiter ID
  let currentRecruiterId: string | null = null;
  try {
    const userStr = useAuthStore.getState().user
      ? JSON.stringify(useAuthStore.getState().user)
      : localStorage.getItem("user");
    if (userStr) {
      const user = JSON.parse(userStr);
      currentRecruiterId = user.id || user.recruiter_id;
    }
  } catch (e) {}

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
  const handleCandidateMove = async (candidateId: string, newStage: string) => {
    let movedCandidate: PipelineCandidate | null = null;
    let oldStage: string | null = null;

    Object.keys(pipelineData).forEach((stage) => {
      const candidate = pipelineData[stage as keyof typeof pipelineData].find(
        (c) => c.id === candidateId,
      );
      if (candidate) {
        movedCandidate = candidate;
        oldStage = stage;
      }
    });

    if (!movedCandidate) return;

    setMovingCandidates((prev) => [...prev, candidateId]);

    // Optimistic update
    setPipelineData((prev) => {
      const newData = { ...prev };
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

    try {
      const result = await moveCandidateToStage(candidateId, newStage);

      if (result.error) {
        // Revert on error
        setPipelineData((prev) => {
          const newData = { ...prev };
          newData[newStage as keyof typeof newData] = newData[
            newStage as keyof typeof newData
          ].filter((c) => c.id !== candidateId);
          if (oldStage && newData[oldStage as keyof typeof newData]) {
            newData[oldStage as keyof typeof newData].push(movedCandidate!);
          }
          return newData;
        });
        toast.error((result.error as any).message || "Unknown error");
        return;
      }

      toast.success(`Successfully moved to ${newStage.replace("_", " ")}`);

      if (currentRecruiterId && movedCandidate) {
        await createNotification(
          currentRecruiterId,
          "pipeline_stage_changed",
          `Candidate moved to ${newStage}`,
          `${(movedCandidate as PipelineCandidate).name} has been moved to the "${newStage}" stage.`,
        );
      }
    } catch (error) {
      // Revert on error
      setPipelineData((prev) => {
        const newData = { ...prev };
        newData[newStage as keyof typeof newData] = newData[
          newStage as keyof typeof newData
        ].filter((c) => c.id !== candidateId);
        if (oldStage && newData[oldStage as keyof typeof newData]) {
          newData[oldStage as keyof typeof newData].push(movedCandidate!);
        }
        return newData;
      });
      toast.error("Failed to move candidate. Please try again.");
    } finally {
      setMovingCandidates((prev) => prev.filter((id) => id !== candidateId));
    }
  };

  const handleBulkEmail = () => openBulkAction("email");
  const handleBulkWhatsApp = () => openBulkAction("whatsapp");
  const handleAssignInterviewer = () => openBulkAction("assign");
  const handleBulkReject = () => openBulkAction("reject");

  const handleExportPipeline = () => {
    const allCandidates = Object.entries(pipelineData).flatMap(
      ([stage, candidates]) =>
        candidates.map((candidate: PipelineCandidate) => ({
          ...candidate,
          stage,
        })),
    );

    if (allCandidates.length === 0) {
      toast.error("No candidates in pipeline to export");
      return;
    }

    const csvContent = [
      "Name,Department,College,Location,Stage,AI Score,Skills,Last Updated",
      ...allCandidates.map(
        (candidate) =>
          `"${candidate.name}","${candidate.dept}","${candidate.college}","${candidate.location}","${candidate.stage}",${candidate.ai_score_overall},"${candidate.skills.join("; ")}","${new Date(candidate.last_updated).toLocaleDateString()}"`,
      ),
    ].join("\n");

    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const link = document.createElement("a");
    link.setAttribute("href", URL.createObjectURL(blob));
    link.setAttribute(
      "download",
      `pipeline_${jobTitle.replace(/\s+/g, "_")}_${new Date().toISOString().split("T")[0]}.csv`,
    );
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    toast.success(`${allCandidates.length} candidates exported successfully`);
  };

  const toggleCandidateSelection = (candidateId: string) => {
    setSelectedCandidates((prev) =>
      prev.includes(candidateId)
        ? prev.filter((id) => id !== candidateId)
        : [...prev, candidateId],
    );
  };

  const handleSendEmail = (candidate: PipelineCandidate) => {
    setActionDialog({ action: "email", candidates: [candidate] });
  };

  const handleCandidateView = (candidate: PipelineCandidate) => {
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
      let existingPipelineId: string | null = null;
      let existingStage: string | null = null;

      Object.keys(pipelineData).forEach((stage) => {
        const found = pipelineData[stage as keyof typeof pipelineData].find(
          (c) => c.learner_id === pipelineCandidate?.learner_id,
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
        toast(`${rec.learnerName} is already in the Screened stage`);
      } else {
        // Candidate not in pipeline, add them directly to screened
        const result = await addCandidateToPipeline({
          opportunity_id: selectedJob,
          learner_id: pipelineCandidate?.learner_id || rec.applicantId, // UUID is already string
          candidate_name:
            rec.learnerName || pipelineCandidate?.name || "Unknown",
          candidate_email: pipelineCandidate?.email || "",
          stage: "screened",
          source: "ai_recommended",
          added_by: currentRecruiterId || undefined,
        });

        if (result.error) {
          const errorMsg =
            (result.error as any)?.message || "Failed to add candidate";
          if (errorMsg.includes("already in this pipeline")) {
            toast(`${rec.learnerName} is already in the pipeline`);
          } else {
            toast.error(errorMsg);
          }
          return;
        }

        // Refresh pipeline data
        loadPipelineCandidates();
        toast.success(`${rec.learnerName} has been added to Screened stage`);
      }
    } catch (error) {
      logger.error("Error moving AI recommended candidate:", error as Error);
      toast.error("Failed to move candidate. Please try again.");
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
  const getFilteredPipelineData = () => {
    let filtered = { ...pipelineData };

    if (showAIRecommendedOnly) {
      Object.keys(filtered).forEach((stage) => {
        if (stage === "sourced" || stage === "screened") {
          filtered[stage as keyof typeof filtered] = filtered[
            stage as keyof typeof filtered
          ].filter((c) => c.ai_score_overall >= 70);
        }
      });
    }

    if (quickFilter) {
      Object.keys(filtered).forEach((stage) => {
        filtered[stage as keyof typeof filtered] = filtered[
          stage as keyof typeof filtered
        ].filter((candidate) =>
          quickFilter === "overdue"
            ? !!candidate.next_action_date &&
              Date.parse(candidate.next_action_date) < Date.now()
            : quickFilter === "attention"
              ? !candidate.next_action
              : !!candidate.recruiter_rating && candidate.recruiter_rating >= 4,
        );
      });
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
  };

  const filteredPipelineData = getFilteredPipelineData();
  const totalAIRecommended =
    aiRecommendations?.topRecommendations?.length ||
    (pipelineData.sourced?.length || 0) + (pipelineData.screened?.length || 0);

  return (
    <div className="flex min-w-0 flex-col min-h-[calc(100dvh-10rem)]">
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
        <div className="flex flex-col gap-4 xl:flex-row xl:items-center xl:justify-between mb-3">
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
        activeQuickFilter={quickFilter}
        onQuickFilterChange={setQuickFilter}
        showAIRecommendedOnly={showAIRecommendedOnly}
        setShowAIRecommendedOnly={setShowAIRecommendedOnly}
        totalCandidates={getTotalCandidates()}
        totalAIRecommended={totalAIRecommended}
        globalSearch={globalSearch}
        setGlobalSearch={setGlobalSearch}
      />

      {/* Kanban Board */}
      <div className="min-h-[30rem] flex-1 overflow-x-auto p-6">
        <div className="flex min-h-[27rem] space-x-6">
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
                  filteredPipelineData[
                    stage.key as keyof typeof filteredPipelineData
                  ] || []
                }
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

      {actionDialog && (
        <PipelineActionDialog
          {...actionDialog}
          onClose={() => setActionDialog(null)}
          onSaved={() => {
            setActionDialog(null);
            setSelectedCandidates([]);
            loadPipelineCandidates();
            toast.success("Pipeline updated");
          }}
        />
      )}
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
        onScheduleCall={() => {
          window.location.assign("/recruitment/interviews");
        }}
        onNextAction={(candidate) => {
          setShowQuickView(false);
          handleNextAction(candidate);
        }}
      />
    </div>
  );
};

const Pipelines: React.FC<PipelinesProps> = (props) => (
  <PipelinesContent {...props} />
);

export default Pipelines;
