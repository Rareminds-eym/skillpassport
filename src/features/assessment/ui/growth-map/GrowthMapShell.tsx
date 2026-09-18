import { useMemo, useState, type FC } from 'react';
import { GrowthMapLearnerInfoCard } from './GrowthMapLearnerInfoCard';
import { GrowthMapPlantVisual } from './GrowthMapPlantVisual';
import { GrowthMapStageList } from './GrowthMapStageList';
import { GrowthMapStageModal } from './GrowthMapStageModal';
import { GrowthMapScrollView } from './GrowthMapScrollView';
import type { GrowthMapViewMode } from './ViewToggle';
import {
  STAGE_ORDER,
  deriveStageStatuses,
  countDoneStages,
  type StageId,
  type StageMeta,
  type StageReports,
} from './growthStageConfig';

interface Props {
  learnerInfo: {
    name: string;
    grade: string;
    school: string;
    enrollmentNumber?: string;
    assessmentDate?: string;
  };
  reports: StageReports;
  /** 'tabbed' (default) is the existing sequential stage experience;
   * 'scroll' renders every section on one continuous page, matching the
   * Bolt reference's Scroll mode. Owned by AssessmentResult.jsx so the
   * ViewToggle button in its header can control this component. */
  viewMode?: GrowthMapViewMode;
}

export const GrowthMapShell: FC<Props> = ({ learnerInfo, reports, viewMode = 'tabbed' }) => {
  // Session-only progression: which stages the learner has clicked "Next
  // Section" past. Starts empty on every page load (no DB/localStorage), so
  // Stage 1 is always Current and Stages 2-8 always Locked on a fresh load —
  // independent of how much gemini_results content already exists.
  const [completedStageIds, setCompletedStageIds] = useState<ReadonlySet<StageId>>(
    () => new Set()
  );
  const statuses = useMemo(
    () => deriveStageStatuses(completedStageIds),
    [completedStageIds]
  );
  const doneCount = useMemo(() => countDoneStages(statuses), [statuses]);

  // The single source of truth for "which stage is the plant/modal currently
  // showing" — always starts at Stage 1 (Seedling Sprout / Capability Wheel),
  // matching the Bolt reference's actual initial state, then only ever moves
  // in response to explicit user action (Explore, Previous/Next). Closing the
  // modal does NOT reset this — the plant stays on the last-viewed stage.
  const [activeStageId, setActiveStageId] = useState<StageId>(STAGE_ORDER[0].id);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [hoveredStageId, setHoveredStageId] = useState<StageId | null>(null);

  const activeStage: StageMeta =
    STAGE_ORDER.find((s) => s.id === activeStageId) ?? STAGE_ORDER[0];

  const previewStage = hoveredStageId
    ? STAGE_ORDER.find((s) => s.id === hoveredStageId) ?? null
    : null;

  const handleExplore = (id: StageId) => {
    if (statuses[id] === 'locked') return;
    setActiveStageId(id);
    setIsModalOpen(true);
  };

  // Viewing-only navigation (Previous Section, or any future free-roam
  // click) — never mutates completedStageIds, so it can never undo Done
  // status or move the unlocked frontier backward.
  const handleNavigate = (id: StageId) => {
    setActiveStageId(id);
  };

  // The ONLY action that marks a stage Done and unlocks the next one:
  // clicking "Next Section" inside the modal. Marks the stage the learner is
  // currently leaving as complete, then moves the modal to the next stage.
  const handleAdvance = (fromId: StageId, toId: StageId) => {
    setCompletedStageIds((prev) => {
      const next = new Set(prev);
      next.add(fromId);
      return next;
    });
    setActiveStageId(toId);
  };

  if (viewMode === 'scroll') {
    return (
      <GrowthMapScrollView learnerInfo={learnerInfo} reports={reports} doneCount={doneCount} />
    );
  }

  return (
    <div className="relative min-h-screen overflow-hidden bg-white font-sans text-slate-900 selection:bg-blue-100 selection:text-blue-900 pb-8">
      <main className="mx-auto max-w-6xl px-4 sm:px-8 pt-6 sm:pt-10 space-y-10 md:space-y-12">
        <GrowthMapLearnerInfoCard
          name={learnerInfo.name}
          grade={learnerInfo.grade}
          school={learnerInfo.school}
          enrollmentNumber={learnerInfo.enrollmentNumber}
          assessmentDate={learnerInfo.assessmentDate}
        />

        <div className="grid grid-cols-1 items-center gap-10 lg:grid-cols-12 lg:gap-12">
          <div className="flex flex-col items-center lg:col-span-4">
            <div className="w-full lg:sticky lg:top-24">
              <GrowthMapPlantVisual currentStage={activeStage} previewStage={previewStage} />
            </div>
          </div>

          <div className="lg:col-span-8">
            <GrowthMapStageList
              statuses={statuses}
              onExplore={handleExplore}
              onHoverStage={setHoveredStageId}
            />
          </div>
        </div>

      </main>

      {isModalOpen && (
        <GrowthMapStageModal
          openStageId={activeStageId}
          statuses={statuses}
          reports={reports}
          onClose={() => setIsModalOpen(false)}
          onNavigate={handleNavigate}
          onAdvance={handleAdvance}
        />
      )}
    </div>
  );
};
