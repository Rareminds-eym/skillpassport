import React, { useState } from 'react';
import { BookOpen, Loader2 } from 'lucide-react';
import type { LessonPlanConfig, LessonPlanTemplateType } from '../types';
import { LESSON_PLAN_TEMPLATES } from '../types';

interface LessonPlanConfigPanelProps {
  config: LessonPlanConfig;
  onChange: (config: LessonPlanConfig) => void;
  onGenerate: () => void;
  isGenerating: boolean;
  generationLimit?: number;
  remainingGenerations?: number;
  isGenerationLimitReached?: boolean;
  isUsageLoading?: boolean;
}

const LessonPlanConfigPanel = ({ 
  config, 
  onChange, 
  onGenerate, 
  isGenerating,
  generationLimit,
  remainingGenerations,
  isGenerationLimitReached = false,
  isUsageLoading = false
}: LessonPlanConfigPanelProps) => {
  const [isExpanded, setIsExpanded] = useState(true);
  const isGenerateDisabled = isGenerating || isUsageLoading || isGenerationLimitReached;

  const handleChange = <K extends keyof LessonPlanConfig>(
    key: K,
    value: LessonPlanConfig[K]
  ) => {
    onChange({ ...config, [key]: value });
  };

  return (
    <div className="border-b border-gray-200 bg-purple-50 max-h-96 overflow-y-auto">
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        className="w-full flex items-center justify-between p-4 hover:bg-purple-100 transition-colors sticky top-0 bg-purple-50 z-10"
      >
        <h4 className="text-sm font-semibold text-purple-900">Lesson Plan Settings</h4>
        <svg
          className={`w-5 h-5 text-purple-900 transition-transform ${isExpanded ? 'rotate-180' : ''}`}
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </button>
      
      {isExpanded && (
        <div className="px-4 pb-4 space-y-3">
        {/* Template Type */}
        <div>
          <label className="block text-xs font-medium text-gray-700 mb-1">
            Lesson Plan Type
          </label>
          <select
            value={config.templateType}
            onChange={(e) => handleChange('templateType', e.target.value as LessonPlanTemplateType)}
            className="w-full px-3 py-1.5 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
          >
            {Object.entries(LESSON_PLAN_TEMPLATES).map(([key, template]) => (
              <option key={key} value={key}>
                {template.name}
              </option>
            ))}
          </select>
          <p className="text-xs text-gray-500 mt-1">
            {LESSON_PLAN_TEMPLATES[config.templateType].description}
          </p>
        </div>

        {/* Duration */}
        <div>
          <label className="block text-xs font-medium text-gray-700 mb-1">
            Duration: {config.duration} minutes
          </label>
          <input
            type="range"
            min="15"
            max="120"
            step="15"
            value={config.duration}
            onChange={(e) => handleChange('duration', parseInt(e.target.value))}
            className="w-full"
          />
        </div>

        {/* Main Sections */}
        <div className="space-y-2">
          <p className="text-xs font-medium text-gray-700">Include Sections:</p>
          
          <label className="flex items-center gap-2">
            <input
              type="checkbox"
              checked={config.includeLearningObjectives ?? true}
              onChange={(e) => handleChange('includeLearningObjectives', e.target.checked)}
              className="rounded text-purple-600 focus:ring-purple-500"
            />
            <span className="text-xs text-gray-700">Learning Objectives</span>
          </label>
          
          <label className="flex items-center gap-2">
            <input
              type="checkbox"
              checked={config.includeMaterials ?? true}
              onChange={(e) => handleChange('includeMaterials', e.target.checked)}
              className="rounded text-purple-600 focus:ring-purple-500"
            />
            <span className="text-xs text-gray-700">Materials List</span>
          </label>
          
          <label className="flex items-center gap-2">
            <input
              type="checkbox"
              checked={config.includeAssessment ?? true}
              onChange={(e) => handleChange('includeAssessment', e.target.checked)}
              className="rounded text-purple-600 focus:ring-purple-500"
            />
            <span className="text-xs text-gray-700">Assessment</span>
          </label>
          
          <label className="flex items-center gap-2">
            <input
              type="checkbox"
              checked={config.includeDifferentiation ?? true}
              onChange={(e) => handleChange('includeDifferentiation', e.target.checked)}
              className="rounded text-purple-600 focus:ring-purple-500"
            />
            <span className="text-xs text-gray-700">Differentiation</span>
          </label>
          
          <label className="flex items-center gap-2">
            <input
              type="checkbox"
              checked={config.includeHomework ?? false}
              onChange={(e) => handleChange('includeHomework', e.target.checked)}
              className="rounded text-purple-600 focus:ring-purple-500"
            />
            <span className="text-xs text-gray-700">Homework</span>
          </label>
        </div>

        {/* Generate Button */}
        <button
          onClick={onGenerate}
          disabled={isGenerateDisabled}
          className="w-full mt-4 px-4 py-3 bg-purple-600 text-white rounded-xl hover:bg-purple-700 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors flex items-center justify-center gap-2 font-medium"
        >
          {isUsageLoading ? (
            <>
              <Loader2 className="w-5 h-5 animate-spin" />
              Checking Availability...
            </>
          ) : isGenerating ? (
            <>
              <Loader2 className="w-5 h-5 animate-spin" />
              Generating Lesson Plan...
            </>
          ) : isGenerationLimitReached ? (
            <>
              <BookOpen className="w-5 h-5" />
              Generation Limit Reached
            </>
          ) : (
            <>
              <BookOpen className="w-5 h-5" />
              Generate Lesson Plan
            </>
          )}
        </button>
        {generationLimit !== undefined && remainingGenerations !== undefined && !isUsageLoading && (
          <p className={`text-xs text-center ${isGenerationLimitReached ? 'text-red-600' : 'text-purple-700'}`}>
            {remainingGenerations} of {generationLimit} worksheet/lesson plan generations remaining
          </p>
        )}
        </div>
      )}
    </div>
  );
};

export default LessonPlanConfigPanel;
