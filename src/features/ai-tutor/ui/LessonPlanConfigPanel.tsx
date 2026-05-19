import React, { useEffect } from 'react';
import type { LessonPlanConfig, LessonPlanTemplateType } from '../types';
import { LESSON_PLAN_TEMPLATES } from '../types';

interface LessonPlanConfigPanelProps {
  config: LessonPlanConfig;
  onChange: (config: LessonPlanConfig) => void;
}

const LessonPlanConfigPanel: React.FC<LessonPlanConfigPanelProps> = ({ config, onChange }) => {
  // Save to localStorage whenever config changes
  useEffect(() => {
    localStorage.setItem('lessonPlanConfig', JSON.stringify(config));
  }, [config]);

  const handleChange = <K extends keyof LessonPlanConfig>(
    key: K,
    value: LessonPlanConfig[K]
  ) => {
    onChange({ ...config, [key]: value });
  };

  return (
    <div className="border-b border-gray-200 bg-purple-50 p-4 max-h-64 overflow-y-auto">
      <h4 className="text-sm font-semibold text-purple-900 mb-3">Lesson Plan Settings</h4>
      
      <div className="space-y-3">
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
      </div>
    </div>
  );
};

export default LessonPlanConfigPanel;
