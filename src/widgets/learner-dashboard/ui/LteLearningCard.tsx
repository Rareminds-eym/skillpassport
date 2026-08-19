import { useCallback, useState } from 'react';
import {
  Award,
  CheckCircle2,
  Clock,
  ListChecks,
  Play,
  Target,
  Zap,
} from 'lucide-react';
import { LteLevelLadder } from './LteLevelLadder';
import type { LteLearningCardProps } from './LteLearningCard.types';

const STATUS_BADGE: Record<string, { className: string; icon: typeof Clock; label: string }> = {
  not_started: { className: 'bg-gray-100 text-gray-600', icon: Play, label: 'Not Started' },
  in_progress: { className: 'bg-gradient-to-r from-blue-100 to-blue-200 text-blue-600', icon: Clock, label: 'In Progress' },
  ongoing: { className: 'bg-gradient-to-r from-blue-100 to-blue-200 text-blue-600', icon: Clock, label: 'In Progress' },
  paused: { className: 'bg-gradient-to-r from-yellow-100 to-yellow-200 text-yellow-800', icon: Clock, label: 'Paused' },
  completed: { className: 'bg-gradient-to-r from-green-100 to-green-200 text-green-800', icon: CheckCircle2, label: 'Completed' },
};

const UNKNOWN_BADGE = { className: 'bg-gray-100 text-gray-600', icon: Clock, label: 'Unknown' };

const getStatusBadge = (status: string) => STATUS_BADGE[status] ?? UNKNOWN_BADGE;

/**
 * Dedicated card for LTE-synced courses on the My Learning page. Self-contained:
 * every piece of detail (level position, XP, modules, ladder) comes from the
 * synced payload — no on-demand fetches. Continue pushes the item up to the
 * parent, which opens the LTE resumeUrl in a new tab.
 */
export function LteLearningCard({ item, onContinue, viewMode = 'grid' }: LteLearningCardProps) {
  const [levelsOpen, setLevelsOpen] = useState(false);
  const toggleLevels = useCallback(() => setLevelsOpen((v) => !v), []);
  const closeLevels = useCallback(() => setLevelsOpen(false), []);
  const levels = item.lteLevels ?? [];
  const hasLevels = levels.length > 0;
  const isCompleted = item.status === 'completed';
  const badge = getStatusBadge(item.status);
  const StatusIcon = badge.icon;

  const progress = isCompleted
    ? 100
    : item.totalModules > 0
      ? Math.round(((item.completedModules || 0) / item.totalModules) * 100)
      : (item.lteTotalLevels ?? 0) > 0
        ? Math.round(((item.lteCurrentLevel || 0) / (item.lteTotalLevels || 1)) * 100)
        : 0;

  const levelCount = item.lteTotalLevels ?? levels.length;

  const renderActionButton = (full: boolean) =>
    isCompleted ? (
      <div
        className={`flex items-center justify-center gap-2 rounded-xl sm:rounded-2xl font-bold text-sm bg-gradient-to-r from-green-100 to-green-200 text-green-800 ${
          full ? 'w-full py-3' : 'px-4 sm:px-6 py-2.5'
        }`}
      >
        <CheckCircle2 className="w-4 h-4" />
        <span>Completed</span>
      </div>
    ) : (
      <button
        type="button"
        onClick={() => onContinue?.(item)}
        className={`flex items-center justify-center gap-2 rounded-xl sm:rounded-2xl font-bold text-sm bg-gradient-to-r from-blue-500 to-blue-600 text-white hover:from-blue-600 hover:to-blue-700 transition-all duration-300 hover:scale-105 shadow-md shadow-blue-500/25 ${
          full ? 'w-full py-3' : 'px-4 sm:px-6 py-2.5'
        }`}
      >
        <Play className="w-4 h-4" />
        <span>{progress > 0 ? 'Continue' : 'Start Course'}</span>
      </button>
    );

  const renderMeta = () => (
    <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-sm text-slate-500">
      {levelCount > 0 && (
        <span className="flex items-center gap-1.5">
          <Target className="w-4 h-4 text-blue-500" />
          <span className="font-medium text-slate-600">
            Level {item.lteCurrentLevel ?? 0} of {levelCount}
          </span>
        </span>
      )}
      {item.hoursSpent > 0 && (
        <span className="flex items-center gap-1.5">
          <Clock className="w-4 h-4" />
          <span>{item.hoursSpent} hrs</span>
        </span>
      )}
      {item.totalModules > 0 && (
        <span className="flex items-center gap-1.5">
          <ListChecks className="w-4 h-4" />
          <span>{item.completedModules || 0} of {item.totalModules} modules</span>
        </span>
      )}
    </div>
  );

  const renderHeader = (compact = false) => (
    <div className={`flex items-start justify-between gap-2 ${compact ? '' : 'mb-4'}`}>
      <span className={`inline-flex items-center rounded-full font-semibold ${badge.className} ${compact ? 'px-2 py-1 text-xs' : 'px-2.5 py-1 text-xs sm:text-sm'}`}>
        <StatusIcon className="w-3 h-3 mr-1" />
        {badge.label}
      </span>
      <span className="inline-flex items-center gap-1.5 rounded-full bg-slate-100 px-2 py-1 text-[11px] font-semibold text-slate-700">
        <Zap className="w-3 h-3 text-indigo-500" />
        LTE
      </span>
    </div>
  );

  if (viewMode === 'list') {
    return (
      <div className="group relative bg-white rounded-2xl sm:rounded-3xl border border-slate-200/60 shadow-sm transition-all duration-500 ease-out hover:shadow-xl hover:shadow-blue-500/10 hover:-translate-y-1 overflow-hidden">
        <div className="relative p-4 sm:p-6">
          <div className="flex flex-col sm:flex-row sm:items-center gap-4 sm:gap-6">
            <div className="flex-1 min-w-0">
              {renderHeader(true)}
              <h3 className="text-lg sm:text-xl font-bold text-slate-900 mb-1 line-clamp-2 sm:line-clamp-1 group-hover:text-blue-600 transition-colors">
                {item.course || item.title}
              </h3>
              <p className="text-slate-600 text-sm line-clamp-1 mb-3">{item.organization}</p>
              {renderMeta()}
            </div>
            <div className="flex items-center gap-2 flex-shrink-0 w-full sm:w-auto">
              {renderActionButton(false)}
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="group relative bg-white rounded-2xl sm:rounded-3xl overflow-hidden border border-slate-200/60 shadow-sm transition-all duration-500 ease-out hover:shadow-2xl hover:shadow-blue-500/10 hover:-translate-y-2 flex flex-col h-full">
      <div className="absolute inset-0 bg-gradient-to-br from-blue-50/50 via-white to-green-50/30 opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
      <div className="absolute top-0 left-0 right-0 h-1.5 bg-slate-100">
        <div className={`h-full transition-all duration-300 ${isCompleted ? 'bg-green-500' : 'bg-blue-500'}`} style={{ width: `${progress}%` }} />
      </div>

      <div className="relative p-4 sm:p-6 flex flex-col flex-1">
        {renderHeader()}

        <h3 className="text-lg sm:text-xl font-bold text-slate-900 mb-1 line-clamp-2 group-hover:text-blue-600 transition-colors">
          {item.course || item.title}
        </h3>
        <div className="mb-3">
          <span className="inline-flex items-center rounded-full bg-indigo-50 px-2.5 py-0.5 text-xs font-semibold text-indigo-700">
            <Award className="w-3 h-3 mr-1" />
            {item.organization}
          </span>
        </div>

        {item.description && (
          <p className="text-slate-600 text-sm leading-relaxed mb-4 line-clamp-2">
            {item.description}
          </p>
        )}

        {(hasLevels || item.totalModules > 0 || (item.lteTotalLevels ?? 0) > 0) && (
          <div className="mb-4">{renderMeta()}</div>
        )}

        {(hasLevels || item.totalModules > 0) && (
          <>
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-medium text-slate-600">Progress</span>
              <span className={`text-base font-bold ${isCompleted ? 'text-green-600' : 'text-blue-600'}`}>
                {progress}%
              </span>
            </div>
            <div className="h-2.5 bg-slate-100 rounded-full overflow-hidden mb-4">
              <div
                className={`h-full bg-gradient-to-r ${isCompleted ? 'from-green-500 to-green-600' : 'from-blue-500 to-blue-600'} rounded-full transition-all duration-1000 ease-out`}
                style={{ width: `${progress}%` }}
              />
            </div>
          </>
        )}

        {hasLevels && (
          <div className="mb-4">
            <LteLevelLadder
              levels={levels}
              open={levelsOpen}
              onToggle={toggleLevels}
              onClose={closeLevels}
            />
          </div>
        )}

        {!hasLevels && item.totalModules === 0 && (item.lteTotalLevels ?? 0) === 0 && (
          <p className="text-sm text-slate-500 mb-4">Course content not live yet</p>
        )}

        <div className="mt-auto">{renderActionButton(true)}</div>
      </div>
    </div>
  );
}