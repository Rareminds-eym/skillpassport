import { Badge } from './ui/badge';
import { Sparkles, BookOpen } from 'lucide-react';

const TrainingRecommendations = ({ recommendations }) => {
  if (!recommendations) return null;

  const { recommendedTrack, learningTracks } = recommendations;

  // Get all learning tracks (primary + alternatives)
  const allTracks = learningTracks || [];

  if (allTracks.length === 0) return null;

  return (
    <div className="bg-gradient-to-br from-blue-50 via-blue-50 to-blue-50 rounded-lg p-4 border-2 border-blue-200">
      {/* Header */}
      <div className="flex items-center gap-2 mb-3">
        <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-blue-500 to-blue-500 flex items-center justify-center">
          <Sparkles className="w-4 h-4 text-white" />
        </div>
        <div>
          <h3 className="text-sm font-bold text-gray-900">
            Recommended Courses
          </h3>
          <p className="text-xs text-gray-600">Based on your assessment</p>
        </div>
      </div>

      {/* Learning Tracks */}
      <div className="space-y-2">
        {allTracks.map((track, idx) => {
          const isPrimary = track.track === recommendedTrack;
          return (
            <div
              key={idx}
              className={`bg-white rounded-lg p-3 border shadow-sm ${
                isPrimary ? 'border-blue-300 ring-2 ring-blue-100' : 'border-blue-200'
              }`}
            >
              <div className="flex items-start gap-2">
                <BookOpen className="w-4 h-4 text-blue-600 mt-0.5 flex-shrink-0" />
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <h4 className="text-sm font-bold text-gray-900">
                      {track.track}
                    </h4>
                    {isPrimary && (
                      <Badge className="bg-blue-100 text-blue-700 text-[10px] px-2 py-0.5">
                        Top Pick
                      </Badge>
                    )}
                  </div>
                  {track.suggestedIf && (
                    <p className="text-xs text-gray-600 mb-2">
                      {track.suggestedIf}
                    </p>
                  )}
                  {track.topics && (
                    <div className="flex flex-wrap gap-1.5">
                      {track.topics.split(',').map((topic, topicIdx) => (
                        <span
                          key={topicIdx}
                          className="px-2 py-0.5 text-[10px] rounded-md bg-blue-100 text-blue-700 font-medium"
                        >
                          {topic.trim()}
                        </span>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default TrainingRecommendations;
