import React, { useState } from 'react';
import {
  EllipsisVerticalIcon,
  UserIcon,
  StarIcon,
  EnvelopeIcon,
  ClockIcon,
  XCircleIcon,
  SparklesIcon
} from '@heroicons/react/24/outline';
import { ActivityIndicators } from '../ActivityIndicators';
import { PipelineCandidate, STAGE_LABELS } from './types';

interface CandidateCardProps {
  candidate: PipelineCandidate;
  onMove: (candidateId: number, newStage: string) => void;
  onView: (candidate: PipelineCandidate) => void;
  isSelected: boolean;
  onToggleSelect: (candidateId: number) => void;
  onSendEmail: (candidate: PipelineCandidate) => void;
  onNextAction?: (candidate: PipelineCandidate) => void;
  stageColor: string;
  isMoving?: boolean;
  stageKey: string;
}

const stages = ['sourced', 'screened', 'interview_1', 'interview_2', 'offer', 'hired'];

const getInitials = (name: string): string => {
  return name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);
};

const getSourceBadge = (source: string) => {
  const badges: Record<string, { label: string; color: string }> = {
    talent_pool: { label: 'Talent Pool', color: 'bg-blue-100 text-blue-700 border-blue-200' },
    direct: { label: 'Direct', color: 'bg-green-100 text-green-700 border-green-200' },
    referral: { label: 'Referral', color: 'bg-purple-100 text-purple-700 border-purple-200' },
    application: { label: 'Applied', color: 'bg-yellow-100 text-yellow-700 border-yellow-200' },
  };
  return badges[source] || { label: source, color: 'bg-gray-100 text-gray-700 border-gray-200' };
};

export const CandidateCard: React.FC<CandidateCardProps> = ({
  candidate,
  onMove,
  onView,
  isSelected,
  onToggleSelect,
  onSendEmail,
  onNextAction,
  stageColor,
  isMoving,
  stageKey
}) => {
  const [showMoveMenu, setShowMoveMenu] = useState(false);
  const [isHovered, setIsHovered] = useState(false);

  const sourceBadge = candidate.source ? getSourceBadge(candidate.source) : null;
  const isAIRecommended = (stageKey === 'sourced' || stageKey === 'screened') && candidate.ai_score_overall >= 70;

  return (
    <div 
      className={`group relative bg-white border-l-4 rounded-lg p-4 shadow-sm transition-all duration-200 cursor-pointer ${
        isSelected 
          ? `border-l-primary-500 bg-primary-50 shadow-md ring-2 ring-primary-200` 
          : `${stageColor} hover:shadow-lg hover:-translate-y-0.5`
      } ${isMoving ? 'opacity-60' : ''}`}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      onClick={() => onView(candidate)}
    >
      {/* Loading Overlay */}
      {isMoving && (
        <div className="absolute inset-0 bg-white bg-opacity-50 rounded-lg flex items-center justify-center z-10">
          <div className="flex items-center space-x-2">
            <svg className="animate-spin h-5 w-5 text-primary-600" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
            </svg>
            <span className="text-sm font-medium text-gray-700">Moving...</span>
          </div>
        </div>
      )}
      
      <div className="flex items-start space-x-3 mb-3">
        {/* Avatar */}
        <div className="flex-shrink-0">
          <div className="w-10 h-10 rounded-full bg-gradient-to-br from-primary-400 to-primary-600 flex items-center justify-center text-white text-sm font-bold shadow-sm">
            {getInitials(candidate.name || 'NA')}
          </div>
        </div>

        {/* Info */}
        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between">
            <div className="flex-1 min-w-0">
              <h4 className="font-semibold text-gray-900 text-sm truncate">{candidate.name}</h4>
              <p className="text-xs text-gray-600 mt-0.5">{candidate.dept}</p>
              <p className="text-xs text-gray-500">{candidate.college}</p>
            </div>
            
            {/* Score Badge */}
            <div className="flex items-center space-x-2 ml-2">
              <div className="flex items-center space-x-1 bg-yellow-50 px-2 py-1 rounded-full border border-yellow-200">
                <StarIcon className="h-3.5 w-3.5 text-yellow-500 fill-current" />
                <span className="text-xs font-bold text-yellow-700 tabular-nums">{candidate.ai_score_overall || 0}</span>
              </div>
            </div>
          </div>
          
          {/* Source Badge, AI Recommended Badge & Activity Indicator */}
          <div className="mt-2 flex items-center gap-2 flex-wrap">
            {isAIRecommended && (
              <span className="inline-flex items-center px-2 py-0.5 rounded-md text-xs font-semibold bg-gradient-to-r from-purple-500 to-indigo-500 text-white shadow-sm">
                <SparklesIcon className="h-3 w-3 mr-1" />
                AI Recommended
              </span>
            )}
            {sourceBadge && (
              <span className={`inline-flex items-center px-2 py-0.5 rounded-md text-xs font-medium border ${sourceBadge.color}`}>
                {sourceBadge.label}
              </span>
            )}
            <ActivityIndicators 
              lastUpdated={candidate.last_updated}
              createdAt={candidate.created_at}
            />
          </div>
        </div>

        {/* Checkbox */}
        <div className={`flex-shrink-0 transition-opacity ${isSelected || isHovered ? 'opacity-100' : 'opacity-0'}`}>
          <input
            type="checkbox"
            checked={isSelected}
            onChange={(e) => {
              e.stopPropagation();
              onToggleSelect(candidate.id);
            }}
            onClick={(e) => e.stopPropagation()}
            className="h-4 w-4 text-primary-600 focus:ring-primary-500 border-gray-300 rounded"
          />
        </div>

        {/* Menu Button */}
        <div className="flex-shrink-0 relative" onClick={(e) => e.stopPropagation()}>
          <button
            onClick={(e) => {
              e.stopPropagation();
              setShowMoveMenu(!showMoveMenu);
            }}
            className="p-1 text-gray-400 hover:text-gray-700 hover:bg-gray-100 rounded transition-colors"
          >
            <EllipsisVerticalIcon className="h-5 w-5" />
          </button>

          {showMoveMenu && (
            <div className="absolute right-0 top-8 w-48 bg-white border border-gray-200 rounded-lg shadow-xl z-20">
              <div className="py-1">
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    onView(candidate);
                    setShowMoveMenu(false);
                  }}
                  className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 flex items-center"
                >
                  <UserIcon className="h-4 w-4 mr-2" />
                  View Profile
                </button>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    onSendEmail(candidate);
                    setShowMoveMenu(false);
                  }}
                  className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 flex items-center"
                >
                  <EnvelopeIcon className="h-4 w-4 mr-2" />
                  Send Email
                </button>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    onNextAction?.(candidate);
                    setShowMoveMenu(false);
                  }}
                  className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 flex items-center"
                >
                  <ClockIcon className="h-4 w-4 mr-2" />
                  Set Next Action
                </button>
                <div className="border-t border-gray-100 my-1"></div>
                <div className="px-2 py-1 text-xs font-semibold text-gray-500">Move to:</div>
                {stages.map(stage => (
                  <button
                    key={stage}
                    onClick={(e) => {
                      e.stopPropagation();
                      onMove(candidate.id, stage);
                      setShowMoveMenu(false);
                    }}
                    className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-50"
                  >
                    {STAGE_LABELS[stage]}
                  </button>
                ))}
                <div className="border-t border-gray-100 my-1"></div>
                <button 
                  onClick={(e) => e.stopPropagation()}
                  className="w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-red-50 flex items-center"
                >
                  <XCircleIcon className="h-4 w-4 mr-2" />
                  Reject
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Skills */}
      <div className="mb-3">
        <div className="flex flex-wrap gap-1.5">
          {candidate.skills && candidate.skills.length > 0 ? (
            <>
              {candidate.skills.slice(0, 3).map((skill, index) => (
                <span
                  key={index}
                  className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-700 border border-gray-200 hover:bg-gray-200 transition-colors"
                  title={skill}
                >
                  {skill}
                </span>
              ))}
              {candidate.skills.length > 3 && (
                <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium bg-gray-50 text-gray-500 border border-gray-200">
                  +{candidate.skills.length - 3} more
                </span>
              )}
            </>
          ) : (
            <span className="text-xs text-gray-400 italic">No skills listed</span>
          )}
        </div>
      </div>

      {/* Footer */}
      <div className="flex items-center justify-between pt-2 border-t border-gray-100">
        <span className="text-xs text-gray-500">
          {candidate.last_updated && (
            <span title={new Date(candidate.last_updated).toLocaleString()}>
              {new Date(candidate.last_updated).toLocaleDateString()}
            </span>
          )}
        </span>
        <button
          onClick={(e) => {
            e.stopPropagation();
            onNextAction?.(candidate);
          }}
          className="text-xs font-semibold text-primary-600 hover:text-primary-700 transition-colors"
        >
          Next Action →
        </button>
      </div>
    </div>
  );
};

export default CandidateCard;
