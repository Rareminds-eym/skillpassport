import React, { useState } from 'react';
import { SparklesIcon } from '@heroicons/react/24/outline';
import { AIRecommendations, PipelineCandidate, AIRecommendation } from './types';

const scrollbarStyles = `
  .ai-scrollbar::-webkit-scrollbar {
    width: 8px;
  }
  .ai-scrollbar::-webkit-scrollbar-track {
    background: #ffffff;
    border-radius: 10px;
    border: 1px solid #e5e7eb;
  }
  .ai-scrollbar::-webkit-scrollbar-thumb {
    background: #1f2937;
    border-radius: 10px;
  }
`;

interface AIRecommendedColumnProps {
  recommendations: AIRecommendations | null;
  loading: boolean;
  onCandidateMove: (candidateId: number, newStage: string) => void;
  pipelineCandidates: any[];
  onCandidateView?: (candidate: PipelineCandidate) => void;
  onMoveToScreened?: (rec: AIRecommendation, pipelineCandidate: any) => Promise<void>;
}

export const AIRecommendedColumn: React.FC<AIRecommendedColumnProps> = ({
  recommendations,
  loading,
  onCandidateMove,
  pipelineCandidates,
  onCandidateView,
  onMoveToScreened
}) => {
  const [showAll, setShowAll] = useState(false);
  const [movingIds, setMovingIds] = useState<number[]>([]);

  const findPipelineCandidate = (applicantId: number) => {
    return pipelineCandidates?.find(c => c.id === applicantId);
  };

  const handleMoveToScreened = async (rec: AIRecommendation, pipelineCandidate: any) => {
    if (movingIds.includes(rec.applicantId)) return;
    
    setMovingIds(prev => [...prev, rec.applicantId]);
    try {
      if (onMoveToScreened) {
        await onMoveToScreened(rec, pipelineCandidate);
      } else if (pipelineCandidate) {
        onCandidateMove(pipelineCandidate.id, 'screened');
      }
    } finally {
      setMovingIds(prev => prev.filter(id => id !== rec.applicantId));
    }
  };

  const topRecs = recommendations?.topRecommendations || [];
  const displayRecs = showAll ? topRecs : topRecs.slice(0, 5);
  const count = topRecs.length;

  return (
    <div className="bg-orange-100/70 rounded-2xl p-4 min-w-80 flex flex-col">
      <style>{scrollbarStyles}</style>
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center space-x-2">
          <div className="w-2 h-2 rounded-full bg-gray-900"></div>
          <h3 className="font-semibold text-gray-900 text-sm">
            AI Recommended
          </h3>
          <span className="bg-white text-gray-900 text-xs font-medium px-2.5 py-1 rounded-full shadow-sm tabular-nums">
            {count}
          </span>
        </div>
      </div>

      {/* Content */}
      <div 
        className="space-y-3 overflow-y-auto flex-1 pr-1 ai-scrollbar" 
        style={{ 
          maxHeight: 'calc(100vh - 400px)',
          scrollbarWidth: 'thin',
          scrollbarColor: '#1f2937 #ffffff'
        }}
      >
        {/* Loading State */}
        {loading && (
          <div className="bg-white rounded-lg p-6 text-center border border-purple-100">
            <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-purple-600 mx-auto mb-2"></div>
            <p className="text-sm text-gray-600">Analyzing...</p>
          </div>
        )}

        {/* Empty State */}
        {!loading && count === 0 && (
          <div className="bg-white rounded-lg p-6 text-center border border-purple-100">
            <div className="inline-flex items-center justify-center w-12 h-12 bg-purple-100 rounded-full mb-3">
              <SparklesIcon className="h-6 w-6 text-purple-400" />
            </div>
            <h4 className="text-sm font-medium text-gray-900 mb-1">No AI Matches</h4>
            <p className="text-xs text-gray-500">Add applicants to get AI recommendations</p>
          </div>
        )}

        {/* Recommendation Cards */}
        {!loading && displayRecs.map((rec) => {
          const pipelineCandidate = findPipelineCandidate(rec.applicantId);
          const confidenceLabel = rec.confidence === 'high' ? 'High' : rec.confidence === 'medium' ? 'Medium' : 'Low';
          const skillsToShow = rec.matchedSkills?.slice(0, 2) || [];
          const remainingSkills = (rec.matchedSkills?.length || 0) - 2;
          
          // Generate AI reasoning note based on match data
          const getAINote = () => {
            if (rec.matchScore >= 80) return 'Strong skill alignment with role requirements';
            if (rec.matchScore >= 60) return 'Good potential fit based on experience';
            return 'Partial match, review recommended';
          };
          
          return (
            <div
              key={rec.applicantId}
              className="bg-white rounded-2xl p-4 shadow-sm hover:shadow-md transition-all cursor-pointer"
              onClick={() => pipelineCandidate && onCandidateView?.(pipelineCandidate)}
            >
              {/* Confidence Badge */}
              <div className="mb-3">
                <span className={`inline-block px-3 py-1 rounded-full text-xs font-semibold ${
                  rec.confidence === 'high' ? 'bg-gray-900 text-white' :
                  rec.confidence === 'medium' ? 'bg-amber-100 text-amber-800' : 'bg-gray-100 text-gray-600'
                }`}>
                  {confidenceLabel}
                </span>
              </div>

              {/* Candidate Name */}
              <h4 className="text-base font-bold text-gray-900 mb-1">{rec.studentName}</h4>
              
              {/* Applied Job Name */}
              {rec.positionTitle && (
                <p className="text-xs text-gray-600 mb-2 truncate">Applied for: {rec.positionTitle}</p>
              )}
              
              {/* AI Note */}
              <p className="text-sm text-gray-500 mb-4 leading-relaxed">{getAINote()}</p>

              {/* Progress Section */}
              <div className="mb-4">
                <div className="flex items-center justify-between mb-1.5">
                  <span className="text-sm text-gray-600">Match Score</span>
                  <span className="text-sm font-semibold text-gray-900">{rec.matchScore}%</span>
                </div>
                <div className="w-full h-2 bg-gray-100 rounded-full overflow-hidden">
                  <div 
                    className="h-full bg-teal-500 rounded-full transition-all duration-300"
                    style={{ width: `${rec.matchScore}%` }}
                  />
                </div>
              </div>

              {/* Skills - Show only 2 with +N indicator */}
              {rec.matchedSkills?.length > 0 && (
                <div className="flex flex-wrap gap-1.5 mb-4">
                  {skillsToShow.map((skill, idx) => (
                    <span key={idx} className="inline-flex items-center px-2 py-1 bg-gray-100 text-gray-700 text-xs rounded-md font-medium">
                      {skill}
                    </span>
                  ))}
                  {remainingSkills > 0 && (
                    <span className="inline-flex items-center px-2 py-1 bg-purple-50 text-purple-600 text-xs rounded-md font-medium">
                      +{remainingSkills}
                    </span>
                  )}
                </div>
              )}

              {/* Action Button */}
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  handleMoveToScreened(rec, pipelineCandidate);
                }}
                disabled={movingIds.includes(rec.applicantId)}
                className={`w-full text-sm font-medium text-white bg-teal-500 hover:bg-teal-600 px-4 py-2 rounded-lg transition-all ${
                  movingIds.includes(rec.applicantId) ? 'opacity-60 cursor-not-allowed' : ''
                }`}
              >
                {movingIds.includes(rec.applicantId) ? (
                  <span className="flex items-center justify-center gap-2">
                    <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                    </svg>
                    Moving...
                  </span>
                ) : (
                  'Move to Screened'
                )}
              </button>
            </div>
          );
        })}

        {/* Show More Button */}
        {!loading && topRecs.length > 5 && (
          <button
            onClick={() => setShowAll(!showAll)}
            className="w-full text-center text-sm font-bold text-gray-900 hover:text-gray-700 py-2 hover:bg-white/50 rounded-lg transition-colors"
          >
            {showAll ? 'Show Less' : `View ${topRecs.length - 5} More`}
          </button>
        )}
      </div>
    </div>
  );
};

export default AIRecommendedColumn;
