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
  const isGenerateDisabled = isGenerating || isUsageLoading || isGenerationLimitReached;

  const handleChange = <K extends keyof WorksheetConfig>(
    key: K,
    value: WorksheetConfig[K]
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
          className="w-full px-3 py-2.5 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white"
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

      {/* Template Type */}
      <div>
        <label className="block text-sm font-medium text-gray-900 mb-2">
          Question Type
        </label>
        <select
          value={config.templateType}
          onChange={(e) => handleChange('templateType', e.target.value as WorksheetTemplateType)}
          className="w-full px-3 py-2.5 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white"
        >
          {Object.entries(WORKSHEET_TEMPLATES).map(([key, template]) => (
            <option key={key} value={key}>
              {template.name}
            </option>
          ))}
        </select>
        <p className="text-xs text-gray-500 mt-1.5">
          {WORKSHEET_TEMPLATES[config.templateType].description}
        </p>
      </div>

      {/* Question Count */}
      <div>
        <label className="block text-sm font-medium text-gray-900 mb-2">
          Number of Questions: <span className="text-blue-600 font-semibold">{config.questionCount}</span>
        </label>
        <input
          type="range"
          min="5"
          max="30"
          step="5"
          value={config.questionCount}
          onChange={(e) => handleChange('questionCount', parseInt(e.target.value))}
          className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-blue-600"
        />
        <div className="flex justify-between text-xs text-gray-500 mt-1">
          <span>5</span>
          <span>30</span>
        </div>
      </div>

      {/* Difficulty */}
      <div>
        <label className="block text-sm font-medium text-gray-900 mb-2">
          Difficulty
        </label>
        <select
          value={config.difficulty}
          onChange={(e) => handleChange('difficulty', e.target.value as DifficultyLevel)}
          className="w-full px-3 py-2.5 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white"
        >
          <option value="low">Low (Beginner)</option>
          <option value="medium">Medium (Intermediate)</option>
          <option value="high">High (Advanced)</option>
        </select>
      </div>

      {/* Checkboxes */}
      <div>
        <label className="block text-sm font-medium text-gray-900 mb-3">
          Include Sections:
        </label>
        <div className="space-y-2.5">
          <label className="flex items-center gap-2.5 cursor-pointer">
            <input
              type="checkbox"
              checked={config.includeAnswerKey}
              onChange={(e) => handleChange('includeAnswerKey', e.target.checked)}
              className="w-4 h-4 rounded text-blue-600 focus:ring-blue-500 focus:ring-2 cursor-pointer"
            />
            <span className="text-sm text-gray-700">Include Answer Key</span>
          </label>
          
          <label className="flex items-center gap-2.5 cursor-pointer">
            <input
              type="checkbox"
              checked={config.includeRubric}
              onChange={(e) => handleChange('includeRubric', e.target.checked)}
              className="w-4 h-4 rounded text-blue-600 focus:ring-blue-500 focus:ring-2 cursor-pointer"
            />
            <span className="text-sm text-gray-700">Include Grading Rubric</span>
          </label>
          
          <label className="flex items-center gap-2.5 cursor-pointer">
            <input
              type="checkbox"
              checked={config.includeExtension}
              onChange={(e) => handleChange('includeExtension', e.target.checked)}
              className="w-4 h-4 rounded text-blue-600 focus:ring-blue-500 focus:ring-2 cursor-pointer"
            />
            <span className="text-sm text-gray-700">Include Extension Activity</span>
          </label>
        </div>
      </div>

      {/* Generate Button */}
      <button
        onClick={onGenerate}
        disabled={isGenerateDisabled}
        className="w-full mt-2 px-4 py-3.5 bg-blue-600 text-white rounded-xl hover:bg-blue-700 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors flex items-center justify-center gap-2.5 font-semibold text-sm shadow-sm hover:shadow-md"
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

export default WorksheetConfigPanel;
