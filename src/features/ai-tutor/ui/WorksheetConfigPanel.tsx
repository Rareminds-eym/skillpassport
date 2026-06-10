import { useState } from 'react';
import { FileText, Loader2 } from 'lucide-react';
import type { WorksheetConfig, WorksheetTemplateType, DifficultyLevel } from '../types/worksheet';
import { WORKSHEET_TEMPLATES } from '../types/worksheet';

interface WorksheetConfigPanelProps {
  config: WorksheetConfig;
  onChange: (config: WorksheetConfig) => void;
  onGenerate: () => void;
  isGenerating: boolean;
  generationLimit?: number;
  remainingGenerations?: number;
  isGenerationLimitReached?: boolean;
  isUsageLoading?: boolean;
}

const WorksheetConfigPanel = ({ 
  config, 
  onChange, 
  onGenerate, 
  isGenerating,
  generationLimit,
  remainingGenerations,
  isGenerationLimitReached = false,
  isUsageLoading = false
}: WorksheetConfigPanelProps) => {
  const [isExpanded, setIsExpanded] = useState(true);
  const isGenerateDisabled = isGenerating || isUsageLoading || isGenerationLimitReached;

  const handleChange = <K extends keyof WorksheetConfig>(
    key: K,
    value: WorksheetConfig[K]
  ) => {
    onChange({ ...config, [key]: value });
  };

  return (
    <div className="border-b border-gray-200 bg-purple-50">
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        className="w-full flex items-center justify-between p-4 hover:bg-purple-100 transition-colors"
      >
        <h4 className="text-sm font-semibold text-purple-900">Worksheet Settings</h4>
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
            Question Type
          </label>
          <select
            value={config.templateType}
            onChange={(e) => handleChange('templateType', e.target.value as WorksheetTemplateType)}
            className="w-full px-3 py-1.5 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
          >
            {Object.entries(WORKSHEET_TEMPLATES).map(([key, template]) => (
              <option key={key} value={key}>
                {template.name}
              </option>
            ))}
          </select>
          <p className="text-xs text-gray-500 mt-1">
            {WORKSHEET_TEMPLATES[config.templateType].description}
          </p>
        </div>

        {/* Question Count */}
        <div>
          <label className="block text-xs font-medium text-gray-700 mb-1">
            Number of Questions: {config.questionCount}
          </label>
          <input
            type="range"
            min="5"
            max="30"
            step="5"
            value={config.questionCount}
            onChange={(e) => handleChange('questionCount', parseInt(e.target.value))}
            className="w-full"
          />
        </div>

        {/* Difficulty */}
        <div>
          <label className="block text-xs font-medium text-gray-700 mb-1">
            Difficulty
          </label>
          <select
            value={config.difficulty}
            onChange={(e) => handleChange('difficulty', e.target.value as DifficultyLevel)}
            className="w-full px-3 py-1.5 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
          >
            <option value="low">Low (Beginner)</option>
            <option value="medium">Medium (Intermediate)</option>
            <option value="high">High (Advanced)</option>
          </select>
        </div>

        {/* Checkboxes */}
        <div className="space-y-2">
          <label className="flex items-center gap-2">
            <input
              type="checkbox"
              checked={config.includeAnswerKey}
              onChange={(e) => handleChange('includeAnswerKey', e.target.checked)}
              className="rounded text-purple-600 focus:ring-purple-500"
            />
            <span className="text-xs text-gray-700">Include Answer Key</span>
          </label>
          
          <label className="flex items-center gap-2">
            <input
              type="checkbox"
              checked={config.includeRubric}
              onChange={(e) => handleChange('includeRubric', e.target.checked)}
              className="rounded text-purple-600 focus:ring-purple-500"
            />
            <span className="text-xs text-gray-700">Include Grading Rubric</span>
          </label>
          
          <label className="flex items-center gap-2">
            <input
              type="checkbox"
              checked={config.includeExtension}
              onChange={(e) => handleChange('includeExtension', e.target.checked)}
              className="rounded text-purple-600 focus:ring-purple-500"
            />
            <span className="text-xs text-gray-700">Include Extension Activity</span>
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
              Generating Worksheet...
            </>
          ) : isGenerationLimitReached ? (
            <>
              <FileText className="w-5 h-5" />
              Generation Limit Reached
            </>
          ) : (
            <>
              <FileText className="w-5 h-5" />
              Generate Worksheet
            </>
          )}
        </button>
        {generationLimit !== undefined && remainingGenerations !== undefined && !isUsageLoading && (
          <p className={`text-xs text-center ${isGenerationLimitReached ? 'text-red-600 font-semibold' : 'text-purple-700'}`}>
            {isGenerationLimitReached 
              ? `Generation limit reached (${generationLimit}/${generationLimit} used)`
              : `${remainingGenerations} of ${generationLimit} generations remaining`
            }
          </p>
        )}
        </div>
      )}
    </div>
  );
};

export default WorksheetConfigPanel;
