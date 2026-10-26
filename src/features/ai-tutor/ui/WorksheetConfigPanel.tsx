import { FileText, Loader2, Sparkles, Check } from 'lucide-react';
import type { WorksheetConfig, WorksheetTemplateType, DifficultyLevel } from '../types/worksheet';
import { WORKSHEET_TEMPLATES } from '../types/worksheet';

interface WorksheetConfigPanelProps {
  config: WorksheetConfig;
  onChange: (_config: WorksheetConfig) => void;
  onGenerate: () => void;
  isGenerating: boolean;
  generationLimit?: number;
  remainingGenerations?: number;
  isGenerationLimitReached?: boolean;
  isUsageLoading?: boolean;
}

const DIFFICULTY_OPTIONS: { value: DifficultyLevel; label: string; desc: string }[] = [
  { value: 'low', label: 'Beginner', desc: 'Core fundamentals' },
  { value: 'medium', label: 'Intermediate', desc: 'Applied knowledge' },
  { value: 'high', label: 'Advanced', desc: 'Critical thinking' },
];

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
  const selectedLevels = config.difficultyLevels ?? [config.difficulty];
  const isGenerateDisabled = selectedLevels.length === 0 || isGenerating || isUsageLoading || isGenerationLimitReached;

  const handleChange = <K extends keyof WorksheetConfig>(
    key: K,
    value: WorksheetConfig[K]
  ) => {
    onChange({ ...config, [key]: value });
  };

  return (
    <div className="space-y-3.5 pt-1">
      {/* Grade and Template Row */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
        {/* Grade/Class Level */}
        <div>
          <label htmlFor="worksheet-grade" className="block text-xs font-medium text-slate-700 mb-1">
            Grade / Level
          </label>
          <select
            id="worksheet-grade"
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
          <label htmlFor="worksheet-template" className="block text-xs font-medium text-slate-700 mb-1">
            Question Type
          </label>
          <select
            id="worksheet-template"
            value={config.templateType}
            onChange={(e) => handleChange('templateType', e.target.value as WorksheetTemplateType)}
            className="w-full px-3 py-2 text-xs font-normal border border-slate-200 rounded-lg focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500/20 bg-slate-50/60 hover:bg-white transition-colors cursor-pointer text-slate-800"
          >
            {Object.entries(WORKSHEET_TEMPLATES).map(([key, template]) => (
              <option key={key} value={key}>
                {template.name}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Question Count Slider */}
      <div className="bg-slate-50/80 border border-slate-200/80 rounded-xl p-3">
        <div className="flex items-center justify-between mb-2">
          <label htmlFor="worksheet-count" className="text-xs font-medium text-slate-700">
            Questions per difficulty
          </label>
          <span className="px-2 py-0.5 text-xs font-semibold text-slate-700 bg-white border border-slate-200 rounded-md">
            {config.questionCount} per level
          </span>
        </div>
        <input
          id="worksheet-count"
          type="range"
          min="5"
          max="30"
          step="5"
          value={config.questionCount}
          onChange={(e) => handleChange('questionCount', parseInt(e.target.value, 10))}
          className="w-full h-1.5 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-blue-600"
        />
        <div className="flex justify-between text-[10px] text-slate-400 mt-1 font-mono">
          <span>5</span>
          <span>15</span>
          <span>30</span>
        </div>
      </div>

      <fieldset>
        <legend className="text-xs font-medium text-slate-700 mb-2">Difficulty levels</legend>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
          {DIFFICULTY_OPTIONS.map((option) => (
            <label key={option.value} className="flex items-center gap-2 rounded-lg border border-slate-200 p-2.5 text-xs text-slate-700 cursor-pointer has-[:checked]:border-blue-400 has-[:checked]:bg-blue-50">
              <input type="checkbox" checked={selectedLevels.includes(option.value)} disabled={isGenerating}
                onChange={(event) => {
                  const next = event.target.checked ? [...selectedLevels, option.value] : selectedLevels.filter(level => level !== option.value);
                  onChange({ ...config, difficultyLevels: next, difficulty: next[0] ?? config.difficulty });
                }} className="h-4 w-4 accent-blue-600" />
              {option.label}
            </label>
          ))}
        </div>
        <p className="mt-2 !text-xs !leading-5 text-slate-500" aria-live="polite">
          {selectedLevels.length ? `${config.questionCount} questions × ${selectedLevels.length} levels = ${config.questionCount * selectedLevels.length} total questions` : 'Select at least one difficulty level.'}
        </p>
      </fieldset>

      {/* Section Inclusion Pills */}
      <div>
        <span className="block text-xs font-medium text-slate-700 mb-1.5">
          Include in Output:
        </span>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
          <button
            type="button"
            onClick={() => handleChange('includeAnswerKey', !config.includeAnswerKey)}
            className={`flex items-center justify-between p-2 rounded-lg border text-xs text-left transition-all ${
              config.includeAnswerKey
                ? 'bg-blue-50/50 border-blue-200 text-slate-800 font-medium'
                : 'bg-white border-slate-200 text-slate-600 hover:border-slate-300'
            }`}
          >
            <span>Answer Key</span>
            <div className={`w-4 h-4 rounded flex items-center justify-center transition-colors ${
              config.includeAnswerKey ? 'bg-blue-600 text-white' : 'border border-slate-300'
            }`}>
              {config.includeAnswerKey && <Check className="w-3 h-3 stroke-[3]" />}
            </div>
          </button>

          <button
            type="button"
            onClick={() => handleChange('includeRubric', !config.includeRubric)}
            className={`flex items-center justify-between p-2 rounded-lg border text-xs text-left transition-all ${
              config.includeRubric
                ? 'bg-blue-50/50 border-blue-200 text-slate-800 font-medium'
                : 'bg-white border-slate-200 text-slate-600 hover:border-slate-300'
            }`}
          >
            <span>Grading Rubric</span>
            <div className={`w-4 h-4 rounded flex items-center justify-center transition-colors ${
              config.includeRubric ? 'bg-blue-600 text-white' : 'border border-slate-300'
            }`}>
              {config.includeRubric && <Check className="w-3 h-3 stroke-[3]" />}
            </div>
          </button>

          <button
            type="button"
            onClick={() => handleChange('includeExtension', !config.includeExtension)}
            className={`flex items-center justify-between p-2 rounded-lg border text-xs text-left transition-all ${
              config.includeExtension
                ? 'bg-blue-50/50 border-blue-200 text-slate-800 font-medium'
                : 'bg-white border-slate-200 text-slate-600 hover:border-slate-300'
            }`}
          >
            <span>Extension Task</span>
            <div className={`w-4 h-4 rounded flex items-center justify-center transition-colors ${
              config.includeExtension ? 'bg-blue-600 text-white' : 'border border-slate-300'
            }`}>
              {config.includeExtension && <Check className="w-3 h-3 stroke-[3]" />}
            </div>
          </button>
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
              <span>Generating Worksheet...</span>
            </>
          ) : isGenerationLimitReached ? (
            <>
              <FileText className="w-4 h-4 opacity-50" />
              <span>Generation Limit Reached</span>
            </>
          ) : (
            <>
              <Sparkles className="w-4 h-4 text-blue-200" />
              <span>Generate Worksheet</span>
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

export default WorksheetConfigPanel;
