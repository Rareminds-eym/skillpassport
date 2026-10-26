import { BookOpen, Loader2, Sparkles, Check } from 'lucide-react';
import type { LessonPlanConfig, LessonPlanTemplateType } from '../types';
import { LESSON_PLAN_TEMPLATES } from '../types';

interface LessonPlanConfigPanelProps {
  config: LessonPlanConfig;
  onChange: (_config: LessonPlanConfig) => void;
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
    <div className="space-y-3.5 pt-1">
      {/* Grade and Template Row */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
        {/* Grade/Class Level */}
        <div>
          <label htmlFor="lesson-plan-grade" className="block text-xs font-medium text-slate-700 mb-1">
            Grade / Level
          </label>
          <select
            id="lesson-plan-grade"
            value={config.gradeLevel || ''}
            onChange={(e) => handleChange('gradeLevel', e.target.value)}
            className="w-full px-3 py-2 text-xs font-normal border border-slate-200 rounded-lg focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500/20 bg-slate-50/60 hover:bg-white transition-colors cursor-pointer text-slate-800"
          >
            <option value="">Select Grade / Level</option>
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
            <option value="College/University">College / University</option>
          </select>
        </div>

        {/* Template Type */}
        <div>
          <label htmlFor="lesson-plan-template" className="block text-xs font-medium text-slate-700 mb-1">
            Lesson Plan Structure
          </label>
          <select
            id="lesson-plan-template"
            value={config.templateType}
            onChange={(e) => handleChange('templateType', e.target.value as LessonPlanTemplateType)}
            className="w-full px-3 py-2 text-xs font-normal border border-slate-200 rounded-lg focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500/20 bg-slate-50/60 hover:bg-white transition-colors cursor-pointer text-slate-800"
          >
            {Object.entries(LESSON_PLAN_TEMPLATES).map(([key, template]) => (
              <option key={key} value={key}>
                {template.name}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Duration Slider */}
      <div className="bg-slate-50/80 border border-slate-200/80 rounded-xl p-3">
        <div className="flex items-center justify-between mb-2">
          <label htmlFor="lesson-plan-duration" className="text-xs font-medium text-slate-700">
            Target Duration
          </label>
          <span className="px-2 py-0.5 text-xs font-semibold text-slate-700 bg-white border border-slate-200 rounded-md">
            {config.duration} Minutes
          </span>
        </div>
        <input
          id="lesson-plan-duration"
          type="range"
          min="15"
          max="120"
          step="15"
          value={config.duration}
          onChange={(e) => handleChange('duration', parseInt(e.target.value, 10))}
          className="w-full h-1.5 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-blue-600"
        />
        <div className="flex justify-between text-[10px] text-slate-400 mt-1 font-mono">
          <span>15m</span>
          <span>45m</span>
          <span>90m</span>
          <span>120m</span>
        </div>
      </div>

      {/* Section Inclusion Pills */}
      <div>
        <span className="block text-xs font-medium text-slate-700 mb-1.5">
          Sections to Include:
        </span>
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
          {[
            { key: 'includeLearningObjectives', label: 'Objectives', defaultVal: true },
            { key: 'includeMaterials', label: 'Materials', defaultVal: true },
            { key: 'includeAssessment', label: 'Assessment', defaultVal: true },
            { key: 'includeDifferentiation', label: 'Differentiation', defaultVal: true },
            { key: 'includeHomework', label: 'Homework Task', defaultVal: false },
          ].map((sec) => {
            const isChecked = config[sec.key as keyof LessonPlanConfig] ?? sec.defaultVal;
            return (
              <button
                type="button"
                key={sec.key}
                onClick={() => handleChange(sec.key as 'includeLearningObjectives' | 'includeMaterials' | 'includeAssessment' | 'includeDifferentiation' | 'includeHomework', !isChecked)}
                className={`flex items-center justify-between p-2 rounded-lg border text-xs text-left transition-all ${
                  isChecked
                    ? 'bg-blue-50/50 border-blue-200 text-slate-800 font-medium'
                    : 'bg-white border-slate-200 text-slate-600 hover:border-slate-300'
                }`}
              >
                <span className="truncate mr-1">{sec.label}</span>
                <div className={`w-4 h-4 rounded flex items-center justify-center flex-shrink-0 transition-colors ${
                  isChecked ? 'bg-blue-600 text-white' : 'border border-slate-300'
                }`}>
                  {isChecked && <Check className="w-3 h-3 stroke-[3]" />}
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* Generate Action Button */}
      <div className="pt-1">
        <button
          type="button"
          onClick={onGenerate}
          disabled={isGenerateDisabled}
          className="w-full py-2.5 px-4 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-medium text-xs shadow-xs hover:shadow transition-all disabled:bg-slate-200 disabled:text-slate-400 disabled:cursor-not-allowed flex items-center justify-center gap-2 cursor-pointer"
        >
          {isUsageLoading ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin text-white" />
              <span>Checking Availability...</span>
            </>
          ) : isGenerating ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin text-white" />
              <span>Generating Lesson Plan...</span>
            </>
          ) : isGenerationLimitReached ? (
            <>
              <BookOpen className="w-4 h-4 opacity-50" />
              <span>Generation Limit Reached</span>
            </>
          ) : (
            <>
              <Sparkles className="w-4 h-4 text-blue-200" />
              <span>Generate Lesson Plan</span>
            </>
          )}
        </button>

        {generationLimit !== undefined && remainingGenerations !== undefined && !isUsageLoading && (
          <div className="flex items-center justify-center gap-1.5 mt-2">
            <span className={`w-1.5 h-1.5 rounded-full ${isGenerationLimitReached ? 'bg-red-500' : 'bg-emerald-500'}`} />
            <p className={`text-[11px] ${isGenerationLimitReached ? 'text-red-600 font-medium' : 'text-slate-500'}`}>
              {isGenerationLimitReached
                ? `Limit reached (${generationLimit}/${generationLimit} used)`
                : `${remainingGenerations} of ${generationLimit} generations remaining`
              }
            </p>
          </div>
        )}
      </div>
    </div>
  );
};

export default LessonPlanConfigPanel;
