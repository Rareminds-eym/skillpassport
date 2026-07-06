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
  const isGenerateDisabled = isGenerating || isUsageLoading || isGenerationLimitReached;

  const handleChange = <K extends keyof LessonPlanConfig>(
    key: K,
    value: LessonPlanConfig[K]
  ) => {
    onChange({ ...config, [key]: value });
  };

  return (
    <div className="space-y-6">
      {/* Grade/Class Level */}
      <div>
        <label className="block text-sm font-medium text-gray-900 mb-2">
          Grade/Class Level
        </label>
        <select
          value={config.gradeLevel || ''}
          onChange={(e) => handleChange('gradeLevel', e.target.value)}
          className="w-full px-3 py-2.5 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-purple-500 bg-white"
        >
          <option value="">Select Grade/Class</option>
          <option value="Elementary (1-5)">Elementary (1-5)</option>
          <option value="Middle School (6-8)">Middle School (6-8)</option>
          <option value="High School (9-12)">High School (9-12)</option>
          <option value="Grade 6">Grade 6</option>
          <option value="Grade 7">Grade 7</option>
          <option value="Grade 8">Grade 8</option>
          <option value="Grade 9">Grade 9</option>
          <option value="Grade 10">Grade 10</option>
          <option value="Grade 11">Grade 11</option>
          <option value="Grade 12">Grade 12</option>
          <option value="College/University">College/University</option>
        </select>
      </div>

      {/* Subject */}
      <div>
        <label className="block text-sm font-medium text-gray-900 mb-2">
          Subject
        </label>
        <input
          type="text"
          value={config.subject || ''}
          onChange={(e) => handleChange('subject', e.target.value)}
          placeholder="e.g., Mathematics, Science, History, English"
          className="w-full px-3 py-2.5 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-purple-500 bg-white placeholder-gray-400"
        />
        <p className="text-xs text-gray-500 mt-1.5">
          Enter the subject for the lesson plan
        </p>
      </div>

      {/* Template Type */}
      <div>
        <label className="block text-sm font-medium text-gray-900 mb-2">
          Lesson Plan Type
        </label>
        <select
          value={config.templateType}
          onChange={(e) => handleChange('templateType', e.target.value as LessonPlanTemplateType)}
          className="w-full px-3 py-2.5 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-purple-500 bg-white"
        >
          {Object.entries(LESSON_PLAN_TEMPLATES).map(([key, template]) => (
            <option key={key} value={key}>
              {template.name}
            </option>
          ))}
        </select>
        <p className="text-xs text-gray-500 mt-1.5">
          {LESSON_PLAN_TEMPLATES[config.templateType].description}
        </p>
      </div>

      {/* Duration */}
      <div>
        <label className="block text-sm font-medium text-gray-900 mb-2">
          Duration: <span className="text-purple-600 font-semibold">{config.duration} minutes</span>
        </label>
        <input
          type="range"
          min="15"
          max="120"
          step="15"
          value={config.duration}
          onChange={(e) => handleChange('duration', parseInt(e.target.value))}
          className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-purple-600"
        />
        <div className="flex justify-between text-xs text-gray-500 mt-1">
          <span>15 min</span>
          <span>120 min</span>
        </div>
      </div>

      {/* Main Sections */}
      <div>
        <label className="block text-sm font-medium text-gray-900 mb-3">
          Include Sections:
        </label>
        <div className="space-y-2.5">
          <label className="flex items-center gap-2.5 cursor-pointer">
            <input
              type="checkbox"
              checked={config.includeLearningObjectives ?? true}
              onChange={(e) => handleChange('includeLearningObjectives', e.target.checked)}
              className="w-4 h-4 rounded text-purple-600 focus:ring-purple-500 focus:ring-2 cursor-pointer"
            />
            <span className="text-sm text-gray-700">Learning Objectives</span>
          </label>
          
          <label className="flex items-center gap-2.5 cursor-pointer">
            <input
              type="checkbox"
              checked={config.includeMaterials ?? true}
              onChange={(e) => handleChange('includeMaterials', e.target.checked)}
              className="w-4 h-4 rounded text-purple-600 focus:ring-purple-500 focus:ring-2 cursor-pointer"
            />
            <span className="text-sm text-gray-700">Materials List</span>
          </label>
          
          <label className="flex items-center gap-2.5 cursor-pointer">
            <input
              type="checkbox"
              checked={config.includeAssessment ?? true}
              onChange={(e) => handleChange('includeAssessment', e.target.checked)}
              className="w-4 h-4 rounded text-purple-600 focus:ring-purple-500 focus:ring-2 cursor-pointer"
            />
            <span className="text-sm text-gray-700">Assessment</span>
          </label>
          
          <label className="flex items-center gap-2.5 cursor-pointer">
            <input
              type="checkbox"
              checked={config.includeDifferentiation ?? true}
              onChange={(e) => handleChange('includeDifferentiation', e.target.checked)}
              className="w-4 h-4 rounded text-purple-600 focus:ring-purple-500 focus:ring-2 cursor-pointer"
            />
            <span className="text-sm text-gray-700">Differentiation</span>
          </label>
          
          <label className="flex items-center gap-2.5 cursor-pointer">
            <input
              type="checkbox"
              checked={config.includeHomework ?? false}
              onChange={(e) => handleChange('includeHomework', e.target.checked)}
              className="w-4 h-4 rounded text-purple-600 focus:ring-purple-500 focus:ring-2 cursor-pointer"
            />
            <span className="text-sm text-gray-700">Homework</span>
          </label>
        </div>
      </div>

      {/* Generate Button */}
      <button
        onClick={onGenerate}
        disabled={isGenerateDisabled}
        className="w-full mt-2 px-4 py-3.5 bg-purple-600 text-white rounded-xl hover:bg-purple-700 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors flex items-center justify-center gap-2.5 font-semibold text-sm shadow-sm hover:shadow-md"
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
        <p className={`text-xs text-center mt-2 ${isGenerationLimitReached ? 'text-red-600 font-semibold' : 'text-gray-600'}`}>
          {isGenerationLimitReached 
            ? `Generation limit reached (${generationLimit}/${generationLimit} used)`
            : `${remainingGenerations} of ${generationLimit} generations remaining`
          }
        </p>
      )}
    </div>
  );
};

export default LessonPlanConfigPanel;
