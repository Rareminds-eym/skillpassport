import { useEffect, useRef, useState, type FC, type ReactNode } from 'react';
import {
  X,
  ArrowLeft,
  ArrowRight,
  Lock,
  CheckCircle2,
  LayoutGrid,
  Heart,
  Lightbulb,
  Footprints,
  Sprout,
} from 'lucide-react';
import { InterestWorlds } from './InterestWorlds';
import { StrengthsCharacter } from './StrengthsCharacter';
import { SelfSocialStrengths } from './SelfSocialStrengths';
import { ExplorerMap } from './ExplorerMap';
import { ThinkingStyleSnapshot } from './ThinkingStyleSnapshot';
import { CapabilityWheel } from './CapabilityWheel';
import { WhatIHaveNeed } from './WhatIHaveNeed';
import { RecommendedMissions } from './RecommendedMissions';
import {
  STAGE_ORDER,
  isValidSectionIntro,
  resolveStageGuidanceSections,
  type StageId,
  type StageStatus,
  type StageReports,
  type GuidanceSectionKind,
  type ResolvedGuidanceSection,
} from './growthStageConfig';

interface Props {
  openStageId: StageId;
  statuses: Record<StageId, StageStatus>;
  reports: StageReports;
  onClose: () => void;
  // eslint-disable-next-line no-unused-vars
  onNavigate: (...args: [StageId]) => void;
  // eslint-disable-next-line no-unused-vars
  onAdvance: (...args: [StageId, StageId]) => void;
}

function renderStageOverview(id: StageId, reports: StageReports): ReactNode {
  const sectionIntro = reports.stage_guidance?.[id]?.sectionIntro;

  switch (id) {
    case 'capabilityWheel':
      return reports.capability_wheel && reports.capability_wheel.length > 0 ? (
        <div>
          {isValidSectionIntro(sectionIntro) && (
            <div className="mb-5 flex items-start gap-3">
              <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-emerald-50 text-emerald-600">
                <Sprout size={19} />
              </div>
              <div>
                <h2 className="text-base font-bold text-slate-800">{sectionIntro.heading}</h2>
                <p className="mt-0.5 text-xs text-slate-500">{sectionIntro.description}</p>
              </div>
            </div>
          )}
          <CapabilityWheel capabilities={reports.capability_wheel} />
        </div>
      ) : null;
    case 'interestWorlds':
      return reports.my_interest_worlds && reports.my_interest_worlds.length > 0 ? (
        <InterestWorlds worlds={reports.my_interest_worlds} sectionIntro={sectionIntro} />
      ) : null;
    case 'characterConstellation':
      return reports.character_strengths_descriptions &&
        reports.character_strengths_descriptions.length > 0 ? (
        <StrengthsCharacter
          strengths={reports.character_strengths_descriptions}
          sectionIntro={sectionIntro}
        />
      ) : null;
    case 'selfSocial':
      return reports.self_social ? (
        <SelfSocialStrengths selfSocial={reports.self_social} sectionIntro={sectionIntro} />
      ) : null;
    case 'explorerMap':
      return reports.explorer_map ? (
        <ExplorerMap
          explorerMap={reports.explorer_map}
          explorerInsights={reports.explorer_insights}
          sectionIntro={sectionIntro}
        />
      ) : null;
    case 'thinkingStyle':
      return reports.thinking_styles && reports.thinking_styles.length > 0 ? (
        <ThinkingStyleSnapshot thinkingStyles={reports.thinking_styles} sectionIntro={sectionIntro} />
      ) : null;
    case 'whatIHaveNeed':
      return reports.what_i_have || reports.what_i_need ? (
        <WhatIHaveNeed
          whatIHave={reports.what_i_have}
          whatINeed={reports.what_i_need}
          sectionIntro={sectionIntro}
        />
      ) : null;
    case 'missions':
      return reports.mission_recommendations && reports.mission_recommendations.length > 0 ? (
        <RecommendedMissions missions={reports.mission_recommendations} sectionIntro={sectionIntro} />
      ) : null;
    default:
      return null;
  }
}

type SubTabId = 'overview' | GuidanceSectionKind;

interface SubTabMeta {
  id: SubTabId;
  label: string;
  sublabel: string;
  icon: typeof LayoutGrid;
}

/** Per-kind accent theme, matching the Bolt reference's color-coding
 * (blue=parent, indigo=teacher, emerald=action) — visual/interaction pattern
 * only, not fabricated content. */
const GUIDANCE_THEME: Record<
  GuidanceSectionKind,
  {
    icon: typeof Heart;
    iconBg: string;
    cardBorder: string;
    cardBg: string;
    subtitleColor: string;
    badgeBg: string;
    badgeText: string;
    chipLabel: string;
  }
> = {
  parent: {
    icon: Heart,
    iconBg: 'bg-blue-600 shadow-blue-500/20',
    cardBorder: 'border-blue-200',
    cardBg: 'from-blue-50/80 via-white to-blue-50/30',
    subtitleColor: 'text-blue-700',
    badgeBg: 'bg-blue-100',
    badgeText: 'text-blue-700',
    chipLabel: 'Key Insight',
  },
  teacher: {
    icon: Lightbulb,
    iconBg: 'bg-indigo-600 shadow-indigo-500/20',
    cardBorder: 'border-indigo-200',
    cardBg: 'from-indigo-50/80 via-white to-indigo-50/30',
    subtitleColor: 'text-indigo-700',
    badgeBg: 'bg-indigo-100',
    badgeText: 'text-indigo-700',
    chipLabel: 'Classroom Action',
  },
  action: {
    icon: Footprints,
    iconBg: 'bg-emerald-600 shadow-emerald-500/20',
    cardBorder: 'border-emerald-200',
    cardBg: 'from-emerald-50/80 via-white to-emerald-50/30',
    subtitleColor: 'text-emerald-700',
    badgeBg: 'bg-emerald-100',
    badgeText: 'text-emerald-700',
    chipLabel: 'Next Action',
  },
};

/**
 * Which real sidebar items exist for a given stage. "Overview" is always
 * present (it's whatever renderStageOverview returns for that stage). The
 * guidance sections are resolved by resolveStageGuidanceSections(), which
 * walks the APP-OWNED STAGE_GUIDANCE_SECTIONS registry for this stage — so
 * section existence, order, kind, and titles are always app-controlled, never
 * inferred from whatever Gemini happened to return. A stage whose registry
 * lists only 1-2 kinds (e.g. missions: teacher only; whatIHaveNeed: parent +
 * action) will only ever show that many tabs, matching the real Bolt
 * reference structure. A kind with no valid generated content for this
 * learner is simply absent — never a broken or fake tab.
 */
function getAvailableSubTabs(id: StageId, reports: StageReports): SubTabMeta[] {
  const tabs: SubTabMeta[] = [
    { id: 'overview', label: 'Overview', sublabel: 'Interactive Chart', icon: LayoutGrid },
  ];

  const sections = resolveStageGuidanceSections(id, reports.stage_guidance?.[id]);
  for (const section of sections) {
    tabs.push({
      id: section.kind,
      label: section.title,
      sublabel: section.subtitle,
      icon: GUIDANCE_THEME[section.kind].icon,
    });
  }

  return tabs;
}

/**
 * Renders one resolved guidance section using the Bolt reference's real
 * visual pattern: a themed gradient hero card (icon + subtitle + title +
 * desc) followed by a numbered 3-column grid of highlight cards — adapted to
 * our own real stage_guidance content, not Bolt's mock text. The section
 * passed in has already been validated by resolveStageGuidanceSections, so
 * this only ever renders real content.
 */
function renderGuidanceSection(section: ResolvedGuidanceSection): ReactNode {
  const theme = GUIDANCE_THEME[section.kind];
  const Icon = theme.icon;

  return (
    <div className="space-y-6">
      <div
        className={`rounded-2xl border ${theme.cardBorder} bg-gradient-to-br ${theme.cardBg} p-6 shadow-xs`}
      >
        <div className="mb-3 flex items-center gap-3">
          <div
            className={`flex h-10 w-10 items-center justify-center rounded-xl text-white shadow-md ${theme.iconBg}`}
          >
            <Icon size={20} />
          </div>
          <div>
            <p className={`text-xs font-bold uppercase tracking-wider ${theme.subtitleColor}`}>
              {section.subtitle}
            </p>
            <h3 className="text-lg font-bold text-slate-900">{section.title}</h3>
          </div>
        </div>
        <p className="text-sm leading-relaxed text-slate-700">{section.desc}</p>
      </div>

      <div className="grid gap-4 sm:grid-cols-3">
        {section.highlights.map((point, idx) => (
          <div
            key={idx}
            className="flex flex-col rounded-2xl border border-slate-200 bg-white p-5 shadow-xs"
          >
            <div className="mb-3 flex items-center gap-2">
              <span
                className={`flex h-6 w-6 items-center justify-center rounded-full text-xs font-bold ${theme.badgeBg} ${theme.badgeText}`}
              >
                {idx + 1}
              </span>
              <span className="text-xs font-bold text-slate-800">{theme.chipLabel}</span>
            </div>
            <p className="flex-1 text-xs leading-relaxed text-slate-600">{point}</p>
          </div>
        ))}
      </div>
    </div>
  );
}

export const GrowthMapStageModal: FC<Props> = ({
  openStageId,
  statuses,
  reports,
  onClose,
  onNavigate,
  onAdvance,
}) => {
  const openIndex = STAGE_ORDER.findIndex((s) => s.id === openStageId);
  const stage = STAGE_ORDER[openIndex];
  const total = STAGE_ORDER.length;

  const [modalSubTab, setModalSubTab] = useState<SubTabId>('overview');

  // Reset to Overview whenever the open stage changes (Explore, Next,
  // Previous, or reopening a different stage from the list) — matches the
  // Bolt reference's own behavior of always landing back on Overview first.
  useEffect(() => {
    setModalSubTab('overview');
  }, [openStageId]);

  const onCloseRef = useRef(onClose);
  onCloseRef.current = onClose;

  useEffect(() => {
    document.body.style.overflow = 'hidden';
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onCloseRef.current();
    };
    window.addEventListener('keydown', onKey);
    return () => {
      document.body.style.overflow = '';
      window.removeEventListener('keydown', onKey);
    };
  }, []);

  if (!stage) return null;

  const availableSubTabs = getAvailableSubTabs(stage.id, reports);

  // Previous Section is viewing-only: it never marks a stage Done and never
  // moves the unlocked frontier, so onNavigate is used, not onAdvance.
  const goPrev = () => {
    if (openIndex <= 0) return;
    onNavigate(STAGE_ORDER[openIndex - 1].id);
  };

  // Next Section is the ONLY action that marks the current stage Done and
  // unlocks the next one — it's an advance, not a plain navigate, even
  // though the next stage's status is still "locked" until this fires.
  const goNext = () => {
    if (openIndex >= total - 1) return;
    onAdvance(stage.id, STAGE_ORDER[openIndex + 1].id);
  };

  const resolvedSections = resolveStageGuidanceSections(stage.id, reports.stage_guidance?.[stage.id]);
  const activeSection =
    modalSubTab === 'overview' ? undefined : resolvedSections.find((s) => s.kind === modalSubTab);

  const content =
    modalSubTab === 'overview'
      ? renderStageOverview(stage.id, reports)
      : activeSection
        ? renderGuidanceSection(activeSection)
        : null;

  // Header subtitle reflects the active tab's real title, matching the Bolt
  // reference (which shows "Interactive Exploration" for Overview, else the
  // actual guidance section's own title) instead of a static label.
  const headerSubtitle = modalSubTab === 'overview' ? 'Interactive Exploration' : activeSection?.title ?? '';

  return (
    <div
      className="modal-backdrop-fade fixed inset-0 z-[70] flex items-center justify-center overflow-y-auto bg-slate-950/70 p-3 backdrop-blur-md sm:p-6"
      onClick={onClose}
    >
      <div
        className="modal-card-pop relative flex h-[88vh] max-h-[720px] w-full max-w-6xl flex-col overflow-hidden rounded-3xl bg-white shadow-2xl ring-1 ring-slate-900/10 lg:flex-row"
        onClick={(e) => e.stopPropagation()}
        role="dialog"
        aria-modal="true"
        aria-label={`${stage.title} - ${statuses[stage.id]}`}
      >
        {/* Left sidebar */}
        <div className="flex w-full flex-col justify-between border-b border-slate-800 bg-[#0f172a] p-5 lg:w-72 lg:border-b-0 lg:border-r lg:p-6">
          <div>
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-blue-600 font-extrabold text-white shadow-lg shadow-blue-500/30">
                {stage.order}
              </div>
              <div className="min-w-0">
                <span className="inline-block rounded-full bg-blue-900/80 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-blue-300 border border-blue-700/50">
                  Stage {stage.order} of {total}
                </span>
                <h4 className="truncate text-xs font-bold text-slate-200 mt-0.5">
                  {stage.growthLevelLabel}
                </h4>
              </div>
            </div>

            <div className="my-5 h-px bg-slate-800" />

            <div className="space-y-2">
              {availableSubTabs.map((tab) => {
                const isActive = modalSubTab === tab.id;
                const Icon = tab.icon;
                return (
                  <button
                    key={tab.id}
                    type="button"
                    onClick={() => setModalSubTab(tab.id)}
                    className={`group flex w-full items-center gap-3.5 rounded-2xl px-4 py-3 text-left transition-all duration-200 ${
                      isActive
                        ? 'bg-white text-slate-900 shadow-lg font-bold'
                        : 'text-slate-400 hover:bg-slate-800/80 hover:text-white'
                    }`}
                  >
                    <div
                      className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-xl transition-colors ${
                        isActive
                          ? 'bg-slate-900 text-white'
                          : 'bg-slate-800 text-slate-400 group-hover:bg-slate-700 group-hover:text-slate-200'
                      }`}
                    >
                      <Icon size={16} strokeWidth={isActive ? 2.5 : 2} />
                    </div>
                    <div className="min-w-0 flex-1">
                      <p
                        className={`text-xs font-bold leading-tight ${
                          isActive ? 'text-slate-900' : 'text-slate-200'
                        }`}
                      >
                        {tab.label}
                      </p>
                      <p
                        className={`mt-0.5 truncate text-[10px] leading-tight ${
                          isActive ? 'text-slate-500' : 'text-slate-400'
                        }`}
                      >
                        {tab.sublabel}
                      </p>
                    </div>
                    {isActive && <div className="h-2 w-2 shrink-0 rounded-full bg-blue-600" />}
                  </button>
                );
              })}
            </div>
          </div>

          <div className="mt-auto hidden border-t border-slate-800/80 pt-4 lg:block">
            <p className="text-[10px] font-semibold uppercase tracking-wider text-slate-400">
              Quick Navigation
            </p>
            <div className="mt-2 flex items-center justify-between text-xs text-slate-300">
              <span className="truncate">{stage.title}</span>
              <span className="font-mono text-[11px] font-bold text-blue-400">
                {stage.order}/{total}
              </span>
            </div>
          </div>
        </div>

        {/* Right content panel */}
        <div className="flex flex-1 flex-col overflow-hidden bg-slate-50/50">
          <div className="flex items-center justify-between border-b border-slate-200 bg-white px-6 py-4">
            <div>
              <div className="flex items-center gap-2">
                <span className="inline-block text-[10px] font-extrabold uppercase tracking-widest text-blue-600">
                  {stage.growthLevelLabel}
                </span>
                <span className="text-slate-300">&bull;</span>
                <span className="text-xs font-semibold text-slate-500">{headerSubtitle}</span>
              </div>
              <h2 className="mt-0.5 text-xl font-black tracking-tight text-slate-900 sm:text-2xl">
                {stage.title}
              </h2>
            </div>

            <button
              type="button"
              onClick={onClose}
              aria-label="Close modal"
              className="flex h-9 w-9 items-center justify-center rounded-xl border border-slate-200 bg-slate-50 text-slate-500 transition-colors hover:bg-slate-100 hover:text-slate-800"
            >
              <X size={18} />
            </button>
          </div>

          <div className="flex-1 overflow-y-auto p-5 sm:p-7">
            {content ? (
              <div
                key={`${stage.id}-${modalSubTab}`}
                className={modalSubTab === 'overview' ? 'modal-content-fade' : 'modal-content-slide'}
              >
                {content}
              </div>
            ) : (
              <div className="flex h-full flex-col items-center justify-center gap-3 text-center text-slate-400">
                <Lock size={28} />
                <p className="text-sm font-semibold">
                  This section isn&apos;t available yet for this assessment.
                </p>
              </div>
            )}
          </div>

          <div className="flex items-center justify-between border-t border-slate-200 bg-white px-6 py-3.5">
            <button
              type="button"
              onClick={goPrev}
              disabled={openIndex === 0}
              className={`inline-flex items-center gap-2 rounded-xl border px-4 py-2 text-xs font-bold transition ${
                openIndex === 0
                  ? 'cursor-not-allowed border-slate-100 bg-slate-50 text-slate-300'
                  : 'border-slate-200 bg-white text-slate-700 hover:border-slate-300 hover:bg-slate-50'
              }`}
            >
              <ArrowLeft size={14} /> Previous Section
            </button>

            <span className="text-xs font-bold text-slate-600">
              Section {stage.order} of {total}
            </span>

            {openIndex >= total - 1 ? (
              <button
                type="button"
                onClick={onClose}
                className="inline-flex items-center gap-2 rounded-xl bg-emerald-600 px-5 py-2 text-xs font-bold text-white shadow-md shadow-emerald-500/20 transition hover:bg-emerald-700 hover:shadow-lg"
              >
                Complete Assessment <CheckCircle2 size={14} />
              </button>
            ) : (
              <button
                type="button"
                onClick={goNext}
                className="inline-flex items-center gap-2 rounded-xl bg-blue-600 px-5 py-2 text-xs font-bold text-white shadow-md shadow-blue-500/20 transition hover:bg-blue-700 hover:shadow-lg"
              >
                Next Section <ArrowRight size={14} />
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
