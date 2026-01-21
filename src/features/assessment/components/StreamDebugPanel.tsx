/**
 * Stream Debug Panel
 * Shows what stream data is being used for AI analysis
 * Helps verify that recommendations match the student's actual stream
 */

import React from 'react';
import { AlertCircle, CheckCircle, XCircle } from 'lucide-react';

interface StreamDebugPanelProps {
  gradeLevel: string;
  stream: string;
  riasecScores?: Record<string, number>;
  recommendedCareers?: Array<{ title: string; fit: string }>;
}

export const StreamDebugPanel: React.FC<StreamDebugPanelProps> = ({
  gradeLevel,
  stream,
  riasecScores,
  recommendedCareers,
}) => {
  // Only show for after12 students
  if (gradeLevel !== 'after12') return null;

  // Determine if careers match the stream
  const streamCareerMapping = {
    science: [
      'engineer',
      'scientist',
      'doctor',
      'technology',
      'data',
      'research',
      'biotech',
      'medical',
    ],
    commerce: [
      'business',
      'finance',
      'accounting',
      'management',
      'banking',
      'marketing',
      'entrepreneur',
    ],
    arts: ['law', 'psychology', 'social', 'media', 'design', 'education', 'counseling', 'policy'],
  };

  const expectedKeywords = streamCareerMapping[stream.toLowerCase()] || [];

  const careerMatches = recommendedCareers?.map((career) => {
    const titleLower = career.title.toLowerCase();
    const matches = expectedKeywords.some((keyword) => titleLower.includes(keyword));
    return { ...career, matchesStream: matches };
  });

  const matchCount = careerMatches?.filter((c) => c.matchesStream).length || 0;
  const totalCount = careerMatches?.length || 0;
  const matchPercentage = totalCount > 0 ? Math.round((matchCount / totalCount) * 100) : 0;

  const isGoodMatch = matchPercentage >= 66; // At least 2 out of 3 should match

  return (
    <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
      <div className="flex items-start gap-3">
        <AlertCircle className="w-5 h-5 text-blue-600 mt-0.5 flex-shrink-0" />
        <div className="flex-1">
          <h3 className="font-semibold text-blue-900 mb-2">🔍 Stream Context Debug Panel</h3>

          <div className="space-y-2 text-sm">
            <div className="flex items-center gap-2">
              <span className="font-medium text-blue-800">Your Stream:</span>
              <span className="px-2 py-1 bg-blue-100 rounded font-semibold text-blue-900">
                {stream.toUpperCase()}
              </span>
            </div>

            {riasecScores && (
              <div className="flex items-center gap-2">
                <span className="font-medium text-blue-800">RIASEC Code:</span>
                <span className="font-mono text-blue-900">
                  {Object.entries(riasecScores)
                    .sort(([, a], [, b]) => b - a)
                    .slice(0, 3)
                    .map(([key]) => key)
                    .join('-')}
                </span>
                <span className="text-blue-600 text-xs">
                  (
                  {Object.entries(riasecScores)
                    .sort(([, a], [, b]) => b - a)
                    .slice(0, 3)
                    .map(([key, val]) => `${key}:${val}`)
                    .join(', ')}
                  )
                </span>
              </div>
            )}

            {careerMatches && careerMatches.length > 0 && (
              <div className="mt-3 pt-3 border-t border-blue-200">
                <div className="flex items-center gap-2 mb-2">
                  {isGoodMatch ? (
                    <CheckCircle className="w-4 h-4 text-green-600" />
                  ) : (
                    <XCircle className="w-4 h-4 text-red-600" />
                  )}
                  <span className="font-medium text-blue-800">
                    Career-Stream Match: {matchPercentage}%
                  </span>
                  <span className="text-xs text-blue-600">
                    ({matchCount}/{totalCount} careers match your stream)
                  </span>
                </div>

                <div className="space-y-1">
                  {careerMatches.map((career, idx) => (
                    <div key={idx} className="flex items-center gap-2 text-xs">
                      {career.matchesStream ? (
                        <CheckCircle className="w-3 h-3 text-green-600" />
                      ) : (
                        <XCircle className="w-3 h-3 text-orange-500" />
                      )}
                      <span className={career.matchesStream ? 'text-green-700' : 'text-orange-700'}>
                        {career.title} ({career.fit})
                      </span>
                    </div>
                  ))}
                </div>

                {!isGoodMatch && (
                  <div className="mt-2 p-2 bg-orange-50 border border-orange-200 rounded text-xs text-orange-800">
                    ⚠️ Warning: Most recommended careers don't match your {stream} stream. This
                    might indicate the AI needs to better consider your stream context.
                  </div>
                )}
              </div>
            )}

            <div className="mt-3 pt-3 border-t border-blue-200 text-xs text-blue-700">
              <p>
                <strong>Expected for {stream} stream:</strong> {expectedKeywords.join(', ')}
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
