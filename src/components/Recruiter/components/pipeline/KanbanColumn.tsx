import React from 'react';
import { PlusIcon } from '@heroicons/react/24/outline';
import { CandidateCard } from './CandidateCard';
import { PipelineEmptyState } from '../EmptyState';
import { PipelineCandidate } from './types';

interface KanbanColumnProps {
  title: string;
  count: number;
  color: string;
  candidates: PipelineCandidate[];
  onCandidateMove: (candidateId: number, newStage: string) => void;
  onCandidateView: (candidate: PipelineCandidate) => void;
  selectedCandidates: number[];
  onToggleSelect: (candidateId: number) => void;
  onSendEmail: (candidate: PipelineCandidate) => void;
  onAddClick: () => void;
  onNextAction?: (candidate: PipelineCandidate) => void;
  stageKey: string;
  movingCandidates?: number[];
}

const getBorderColor = (color: string): string => {
  const colorMap: Record<string, string> = {
    'bg-gray-400': 'border-l-gray-400',
    'bg-blue-400': 'border-l-blue-400',
    'bg-yellow-400': 'border-l-yellow-400',
    'bg-orange-400': 'border-l-orange-400',
    'bg-green-400': 'border-l-green-400',
    'bg-emerald-400': 'border-l-emerald-400',
  };
  return colorMap[color] || 'border-l-gray-400';
};

export const KanbanColumn: React.FC<KanbanColumnProps> = ({
  title,
  count,
  color,
  candidates,
  onCandidateMove,
  onCandidateView,
  selectedCandidates,
  onToggleSelect,
  onSendEmail,
  onAddClick,
  onNextAction,
  stageKey,
  movingCandidates,
}) => {
  return (
    <div className="bg-gray-50 rounded-xl p-4 min-w-80 flex flex-col">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center space-x-2">
          <div className={`w-3 h-3 rounded-full ${color} shadow-sm`}></div>
          <h3 className="font-semibold text-gray-900 text-sm">{title}</h3>
          <span className="bg-white text-gray-700 text-xs font-medium px-2.5 py-1 rounded-full shadow-sm border border-gray-200 tabular-nums">
            {count}
          </span>
        </div>
        <button
          onClick={() => onAddClick()}
          className="p-1.5 text-gray-400 hover:text-gray-700 hover:bg-white rounded-lg transition-colors"
          title="Add candidate"
        >
          <PlusIcon className="h-4 w-4" />
        </button>
      </div>

      <div
        className="space-y-3 overflow-y-auto flex-1"
        style={{ maxHeight: 'calc(100vh - 400px)' }}
      >
        {(candidates || []).length === 0 ? (
          <PipelineEmptyState stage={stageKey} onAddClick={onAddClick} />
        ) : (
          (candidates || []).map((candidate) => (
            <CandidateCard
              key={candidate.id}
              candidate={candidate}
              onMove={onCandidateMove}
              onView={onCandidateView}
              isSelected={selectedCandidates.includes(candidate.id)}
              onToggleSelect={onToggleSelect}
              onSendEmail={onSendEmail}
              onNextAction={onNextAction}
              stageColor={getBorderColor(color)}
              isMoving={movingCandidates?.includes(candidate.id)}
              stageKey={stageKey}
            />
          ))
        )}
      </div>
    </div>
  );
};

export default KanbanColumn;
