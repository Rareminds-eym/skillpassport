import React, { useEffect } from 'react';
import type { WorksheetConfig, WorksheetTemplateType, DifficultyLevel } from '../types/worksheet';
import { WORKSHEET_TEMPLATES } from '../types/worksheet';

interface WorksheetConfigPanelProps {
  config: WorksheetConfig;
  onChange: (config: WorksheetConfig) => void;
}

const WorksheetConfigPanel: React.FC<WorksheetConfigPanelProps> = ({ config, onChange }) => {
  // Save to localStorage whenever config changes
  useEffect(() => {
    localStorage.setItem('worksheetConfig', JSON.stringify(config));
  }, [config]);

  const handleChange = <K extends keyof WorksheetConfig>(
    key: K,
    value: WorksheetConfig[K]
  ) => {
    onChange({ ...config, [key]: value });
  };

  return (
    <div className="border-b border-gray-200 bg-purple-50 p-4">
      <h4 className="text-sm font-semibold text-purple-900 mb-3">Worksheet Settings</h4>
      
      <div className="space-y-3">
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
      </div>
    </div>
  );
};

export default WorksheetConfigPanel;
