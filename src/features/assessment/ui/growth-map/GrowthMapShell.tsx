import { useMemo, useState, type FC } from 'react';
import { GrowthMapLearnerInfoCard } from './GrowthMapLearnerInfoCard';
import { GrowthMapPlantVisual } from './GrowthMapPlantVisual';
import { GrowthMapStageList } from './GrowthMapStageList';
import { GrowthMapStageModal } from './GrowthMapStageModal';
import { GrowthMapScrollView } from './GrowthMapScrollView';
import type { GrowthMapViewMode } from './ViewToggle';
import { saveGrowthMapProgress } from '../../api/assessmentApiService';
import {
  STAGE_ORDER,
  deriveStageStatuses,
  countDoneStages,
  getCurrentStage,
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
  /** Needed to persist Growth Map stage-completion progress. Progress is
   * skipped (session-only) if this is not provided. */
  attemptId?: string;
}

function initialCompletedStageIds(reports: StageReports): ReadonlySet<StageId> {
  return new Set(reports.growth_map_progress?.completedStageIds ?? []);
}

export const GrowthMapShell: FC<Props> = ({ learnerInfo, reports, viewMode = 'tabbed', attemptId }) => {
  // Restored from gemini_results.growth_map_progress (persisted via
  // saveGrowthMapProgress in handleAdvance below) so a page refresh or
  // navigating away and back preserves which stages were already completed,
  // instead of always restarting at Stage 1.
  const [completedStageIds, setCompletedStageIds] = useState<ReadonlySet<StageId>>(
    () => initialCompletedStageIds(reports)
  );
  const statuses = useMemo(
    () => deriveStageStatuses(completedStageIds),
    [completedStageIds]
  );
  const doneCount = useMemo(() => countDoneStages(statuses), [statuses]);

  // The single source of truth for "which stage is the plant/modal currently
  // showing" — initializes to the derived Current stage (the first stage not
  // yet completed) so a learner who already finished several stages resumes
  // there instead of always at Stage 1, then only ever moves in response to
  // explicit user action (Explore, Previous/Next). Closing the modal does NOT
  // reset this — the plant stays on the last-viewed stage.
  const [activeStageId, setActiveStageId] = useState<StageId>(
    () => getCurrentStage(deriveStageStatuses(initialCompletedStageIds(reports))).id
  );
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
  // Also persists the updated completed-stage list (fire-and-forget, non-
  // fatal to the UI if it fails) so this survives a refresh/navigation.
  const handleAdvance = (fromId: StageId, toId: StageId) => {
    setCompletedStageIds((prev) => {
      const next = new Set(prev);
      next.add(fromId);
      if (attemptId) {
        saveGrowthMapProgress(attemptId, Array.from(next)).catch((error) => {
          console.warn('Failed to persist growth map progress:', error);
          // Non-fatal — local progress for this session still works even if
          // the persisted save fails; it will simply not survive a refresh.
        });
      }
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
