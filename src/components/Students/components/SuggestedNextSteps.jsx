import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Badge } from './ui/badge';
import {
  Sparkles,
  Target,
  ExternalLink,
  Building2,
  Briefcase,
  MapPin,
  Clock,
  TrendingUp,
} from 'lucide-react';

/**
 * Reusable Suggested Next Steps Component
 * Displays AI-matched job opportunities or fallback suggestions
 */
const SuggestedNextSteps = ({
  matchedJobs = [],
  loading = false,
  error = null,
  fallbackSuggestions = [],
}) => {
  return (
    <Card
      className="bg-white rounded-xl border border-gray-200 shadow-sm"
      data-testid="suggested-next-steps-card"
    >
      <CardHeader className="px-6 py-4 border-b border-gray-100">
        <CardTitle className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-amber-50 to-orange-50 flex items-center justify-center border border-amber-200">
              <Sparkles className="w-5 h-5 text-amber-600" />
            </div>
            <div>
              <span className="text-lg font-semibold text-gray-900">Suggested Next Steps</span>
              <p className="text-xs text-gray-500 font-normal mt-0.5">
                {matchedJobs.length > 0
                  ? 'AI-matched job opportunities for you'
                  : 'Recommendations to enhance your profile'}
              </p>
            </div>
          </div>
          {matchedJobs.length > 0 && (
            <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">
              <Target className="w-3 h-3 mr-1" />
              {matchedJobs.length} Matches
            </Badge>
          )}
        </CardTitle>
      </CardHeader>
      <CardContent className="p-6 space-y-3">
        {loading ? (
          <div className="flex items-center justify-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-amber-600"></div>
            <p className="ml-3 text-sm text-gray-500">Finding best job matches for you...</p>
          </div>
        ) : error ? (
          <div className="p-4 rounded-lg bg-red-50 border border-red-200">
            <p className="text-sm text-red-700">⚠️ {error}</p>
          </div>
        ) : matchedJobs.length > 0 ? (
          <>
            {matchedJobs.map((match, idx) => (
              <div
                key={match.job_id || `job-match-${idx}`}
                className="p-4 rounded-xl bg-gradient-to-br from-amber-50 to-orange-50 border border-amber-200 hover:border-amber-300 hover:shadow-md transition-all cursor-pointer group"
                data-testid={`matched-job-${idx}`}
                onClick={() => {
                  // Navigate to opportunities page or show details
                  if (match.opportunity?.application_link) {
                    window.open(match.opportunity.application_link, '_blank');
                  }
                }}
              >
                {/* Match Score Badge */}
                <div className="flex items-start justify-between mb-2">
                  <Badge className="bg-gradient-to-r from-green-500 to-emerald-500 text-white border-0 text-xs font-semibold">
                    {match.match_score}% Match
                  </Badge>
                  <ExternalLink className="w-4 h-4 text-amber-600 opacity-0 group-hover:opacity-100 transition-opacity" />
                </div>

                {/* Job Title & Company */}
                <div className="mb-3">
                  <h4 className="text-base font-bold text-gray-900 mb-1 group-hover:text-amber-700 transition-colors">
                    {match.job_title || match.opportunity?.job_title}
                  </h4>
                  <div className="flex items-center gap-2 text-sm text-gray-600">
                    <Building2 className="w-4 h-4" />
                    <span className="font-medium">
                      {match.company_name || match.opportunity?.company_name}
                    </span>
                  </div>
                </div>

                {/* Job Details */}
                {match.opportunity && (
                  <div className="flex flex-wrap items-center gap-3 mb-3 text-xs text-gray-600">
                    {match.opportunity.employment_type && (
                      <div className="flex items-center gap-1">
                        <Briefcase className="w-3.5 h-3.5" />
                        <span>{match.opportunity.employment_type}</span>
                      </div>
                    )}
                    {match.opportunity.location && (
                      <div className="flex items-center gap-1">
                        <MapPin className="w-3.5 h-3.5" />
                        <span>{match.opportunity.location}</span>
                      </div>
                    )}
                    {match.opportunity.deadline && (
                      <div className="flex items-center gap-1 text-orange-600">
                        <Clock className="w-3.5 h-3.5" />
                        <span>
                          Apply by {new Date(match.opportunity.deadline).toLocaleDateString()}
                        </span>
                      </div>
                    )}
                  </div>
                )}

                {/* Match Reason */}
                {match.match_reason && (
                  <p className="text-xs text-gray-700 leading-relaxed mb-2 italic">
                    💡 {match.match_reason}
                  </p>
                )}

                {/* Recommendation */}
                {match.recommendation && (
                  <div className="mt-2 pt-2 border-t border-amber-200">
                    <p className="text-xs text-amber-800 font-medium">✨ {match.recommendation}</p>
                  </div>
                )}
              </div>
            ))}
          </>
        ) : fallbackSuggestions.length > 0 ? (
          <>
            {fallbackSuggestions.map((suggestion, idx) => (
              <div
                key={suggestion.id || `suggestion-${idx}`}
                className="p-3 rounded-lg bg-amber-50 border border-amber-200 hover:bg-amber-100 hover:border-amber-300 transition-all"
              >
                <p className="text-sm font-medium text-gray-900">
                  {typeof suggestion === 'string' ? suggestion : suggestion.message || suggestion}
                </p>
              </div>
            ))}
          </>
        ) : (
          <div className="text-center py-8">
            <TrendingUp className="w-12 h-12 mx-auto text-gray-300 mb-3" />
            <p className="text-gray-500 font-medium">No suggestions available</p>
            <p className="text-gray-400 text-sm mt-1">
              Complete your profile to get personalized recommendations
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default SuggestedNextSteps;
