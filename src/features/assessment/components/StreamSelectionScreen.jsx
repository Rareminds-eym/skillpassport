/**
 * Stream Selection Screen Component
 * Displays specific stream options based on selected category
 * 
 * @module features/assessment/components/StreamSelectionScreen
 */

import React from 'react';
import { ArrowLeft, ChevronRight, Loader2 } from 'lucide-react';
import { Button } from '../../../components/Students/components/ui/button';
import { Card, CardContent } from '../../../components/Students/components/ui/card';
import { Label } from '../../../components/Students/components/ui/label';
import { STREAMS_BY_CATEGORY, STREAM_CATEGORIES, AFTER10_STREAMS_BY_CATEGORY } from '../constants/config';

/**
 * @typedef {Object} StreamSelectionScreenProps
 * @property {Function} onStreamSelect - Callback when stream is selected
 * @property {Function} onBack - Callback to go back to category selection
 * @property {string} selectedCategory - Selected category (science/commerce/arts)
 * @property {string} gradeLevel - Selected grade level
 * @property {boolean} isLoading - Whether streams are loading
 * @property {string|null} studentProgram - Student's program name (for college students)
 */

/**
 * Get category label from ID
 */
const getCategoryLabel = (categoryId) => {
  if (!categoryId) return 'Selected';
  const category = STREAM_CATEGORIES.find(c => c.id === categoryId);
  return category?.label || categoryId;
};

/**
 * Stream Option Button Component
 */
const StreamOptionButton = ({ stream, onClick, isRecommended }) => (
  <button
    onClick={() => onClick(stream.id)}
    className={`w-full p-5 bg-white/80 backdrop-blur-sm border-2 rounded-xl shadow-sm hover:shadow-lg hover:shadow-indigo-500/10 transition-all duration-300 text-left group transform hover:-translate-y-0.5 relative overflow-hidden ${
      isRecommended 
        ? 'border-indigo-300 bg-indigo-50/50' 
        : 'border-gray-100 hover:border-indigo-300'
    }`}
  >
    <div className="absolute inset-0 bg-gradient-to-r from-indigo-50/30 to-purple-50/30 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
    <div className="relative z-10 flex items-center justify-between">
      <div className="flex-1">
        <div className="flex items-center gap-2">
          <h3 className="text-lg font-semibold text-gray-800 group-hover:text-indigo-700">
            {stream.label}
          </h3>
          {isRecommended && (
            <span className="px-2 py-0.5 text-xs font-medium bg-indigo-100 text-indigo-700 rounded-full">
              Recommended
            </span>
          )}
        </div>
        {/* Show description if available (for after10 streams) */}
        {stream.description && (
          <p className="text-sm text-gray-600 mt-1">
            {stream.description}
          </p>
        )}
        {/* Show RIASEC info if no description */}
        {!stream.description && stream.riasec && stream.riasec.length > 0 && (
          <p className="text-xs text-gray-500 mt-1">
            Best for: {stream.riasec.join(', ')} personality types
          </p>
        )}
      </div>
      <div className="w-8 h-8 rounded-full bg-gray-50 group-hover:bg-indigo-600 flex items-center justify-center transition-all duration-300">
        <ChevronRight className="w-4 h-4 text-gray-400 group-hover:text-white" />
      </div>
    </div>
  </button>
);

/**
 * Loading State Component
 */
const LoadingState = () => (
  <div className="flex items-center justify-center py-12">
    <Loader2 className="w-8 h-8 animate-spin text-indigo-600" />
    <span className="ml-3 text-gray-600">Loading streams...</span>
  </div>
);

/**
 * Stream Selection Screen Component
 */
export const StreamSelectionScreen = ({
  onStreamSelect,
  onBack,
  selectedCategory,
  gradeLevel,
  isLoading = false,
  studentProgram = null,
}) => {
  // Use different streams based on grade level
  // For higher_secondary (11th/12th), after10, and after12, use the school stream config (PCMB, Commerce with Maths, etc.)
  // For college, use the college degree config (BSc, BA, BBA, etc.)
  const streamsConfig = (gradeLevel === 'after10' || gradeLevel === 'higher_secondary' || gradeLevel === 'after12') 
    ? AFTER10_STREAMS_BY_CATEGORY 
    : STREAMS_BY_CATEGORY;
  
  // Get streams for selected category (handle null/undefined)
  const streams = selectedCategory ? (streamsConfig[selectedCategory] || []) : [];
  const categoryLabel = getCategoryLabel(selectedCategory);

  // Check if a stream matches student's program (for recommendations)
  const isStreamRecommended = (stream) => {
    if (!studentProgram) return false;
    const programLower = studentProgram.toLowerCase();
    const streamLabel = stream.label.toLowerCase();
    const streamId = stream.id.toLowerCase();
    
    return streamLabel.includes(programLower) || 
           programLower.includes(streamId) ||
           streamId.includes(programLower.substring(0, 3));
  };

  // Sort streams to show recommended first
  const sortedStreams = [...streams].sort((a, b) => {
    const aRecommended = isStreamRecommended(a);
    const bRecommended = isStreamRecommended(b);
    if (aRecommended && !bRecommended) return -1;
    if (!aRecommended && bRecommended) return 1;
    return 0;
  });

  // Get title based on grade level
  const getTitle = () => {
    switch (gradeLevel) {
      case 'after10':
      case 'higher_secondary':
      case 'after12':
        return `${categoryLabel} Streams`;
      case 'college':
        return `${categoryLabel} Programs`;
      default:
        return `Select Your ${categoryLabel} Stream`;
    }
  };

  // Get subtitle
  const getSubtitle = () => {
    switch (gradeLevel) {
      case 'after10':
      case 'higher_secondary':
      case 'after12':
        return 'Choose the specific stream you want to explore';
      case 'college':
        return 'Choose your program for personalized career recommendations';
      default:
        return 'Select a stream to continue with the assessment';
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 flex items-center justify-center p-4">
      <Card className="w-full max-w-2xl border-none shadow-2xl">
        <CardContent className="p-8">
          {/* Back Button */}
          <Button
            variant="ghost"
            onClick={onBack}
            className="mb-6 -ml-2 text-gray-600 hover:text-gray-900"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Categories
          </Button>

          {/* Header */}
          <div className="text-center mb-8">
            <h1 className="text-3xl font-bold text-gray-800 mb-2">{getTitle()}</h1>
            <p className="text-gray-600">{getSubtitle()}</p>
          </div>

          {/* Stream Options */}
          {isLoading ? (
            <LoadingState />
          ) : (
            <div className="space-y-3">
              <Label className="text-sm font-semibold text-gray-700 mb-3 block">
                Available {categoryLabel} Streams
              </Label>

              {sortedStreams.length > 0 ? (
                sortedStreams.map(stream => (
                  <StreamOptionButton
                    key={stream.id}
                    stream={stream}
                    onClick={onStreamSelect}
                    isRecommended={isStreamRecommended(stream)}
                  />
                ))
              ) : (
                <div className="text-center py-8 text-gray-500">
                  No streams available for this category.
                </div>
              )}
            </div>
          )}

          {/* Student Program Info */}
          {studentProgram && (
            <div className="mt-6 p-4 bg-green-50 rounded-xl border border-green-100">
              <p className="text-sm text-green-700">
                <strong>Your Program:</strong> {studentProgram}
                <br />
                <span className="text-xs">Streams matching your program are highlighted.</span>
              </p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default StreamSelectionScreen;
