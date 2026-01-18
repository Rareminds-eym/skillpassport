/**
 * TestModeControls Component
 * 
 * Development mode controls for quick testing of the assessment.
 * Allows auto-filling answers and skipping to specific sections.
 * Enhanced with debugging info for higher_secondary testing.
 * 
 * @module features/assessment/career-test/components/layout/TestModeControls
 */

import React, { useState } from 'react';
import { Zap, Info, ChevronDown, ChevronUp } from 'lucide-react';

interface TestModeControlsProps {
  onAutoFillAll: () => void;
  onSkipToAptitude: () => void;
  onSkipToKnowledge: () => void;
  onSkipToSubmit: () => void;
  onExitTestMode: () => void;
  // Debug info props
  gradeLevel?: string;
  studentStream?: string;
  currentSectionIndex?: number;
  totalSections?: number;
  aiQuestionsLoading?: boolean;
  aiQuestionsLoaded?: { aptitude: number; knowledge: number };
  sections?: Array<{ id: string; title: string; questions: any[] }>;
}

/**
 * Test mode control panel for development
 */
export const TestModeControls: React.FC<TestModeControlsProps> = ({
  onAutoFillAll,
  onSkipToAptitude,
  onSkipToKnowledge,
  onSkipToSubmit,
  onExitTestMode,
  gradeLevel,
  studentStream,
  currentSectionIndex = 0,
  totalSections = 0,
  aiQuestionsLoading = false,
  aiQuestionsLoaded,
  sections = []
}) => {
  const [showDebugInfo, setShowDebugInfo] = useState(false);

  // Check if this is higher_secondary or after12
  const isHigherSecondary = gradeLevel === 'higher_secondary';
  const isAfter12 = gradeLevel === 'after12';
  const usesAIQuestions = ['after10', 'higher_secondary', 'after12', 'college'].includes(gradeLevel || '');

  // Get current section info
  const currentSection = sections[currentSectionIndex];
  const isComprehensiveAssessment = sections.some(s => s.id === 'riasec');

  return (
    <div className="mb-4 space-y-2">
      {/* Main Control Bar */}
      <div className="p-3 bg-amber-50 rounded-xl border border-amber-200">
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-2">
            <Zap className="w-4 h-4 text-amber-600" />
            <span className="text-sm font-semibold text-amber-800">Test Mode Active</span>
            {isAfter12 && (
              <span className="px-2 py-0.5 bg-green-100 text-green-700 rounded text-xs font-semibold">
                After 12th
              </span>
            )}
            {isHigherSecondary && (
              <span className="px-2 py-0.5 bg-purple-100 text-purple-700 rounded text-xs font-semibold">
                Higher Secondary
              </span>
            )}
            {usesAIQuestions && (
              <span className="px-2 py-0.5 bg-blue-100 text-blue-700 rounded text-xs font-semibold">
                AI Questions
              </span>
            )}
          </div>
          <button
            onClick={() => setShowDebugInfo(!showDebugInfo)}
            className="flex items-center gap-1 px-2 py-1 bg-gray-100 text-gray-700 rounded text-xs hover:bg-gray-200 transition-all"
          >
            <Info className="w-3 h-3" />
            Debug Info
            {showDebugInfo ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
          </button>
        </div>

        {/* Quick Actions */}
        <div className="flex gap-2 flex-wrap">
          <button
            onClick={onAutoFillAll}
            className="px-3 py-1.5 bg-amber-200 text-amber-800 rounded-lg text-xs font-semibold hover:bg-amber-300 transition-all"
            title="Auto-fill all questions in current section"
          >
            Auto-fill All
          </button>
          <button
            onClick={onSkipToAptitude}
            className="px-3 py-1.5 bg-purple-500 text-white rounded-lg text-xs font-semibold hover:bg-purple-600 transition-all"
            title="Skip to Aptitude section (AI-generated)"
          >
            → Aptitude (AI)
          </button>
          <button
            onClick={onSkipToKnowledge}
            className="px-3 py-1.5 bg-blue-500 text-white rounded-lg text-xs font-semibold hover:bg-blue-600 transition-all"
            title="Skip to Knowledge section (AI-generated)"
          >
            → Knowledge (AI)
          </button>
          <button
            onClick={onSkipToSubmit}
            className="px-3 py-1.5 bg-amber-600 text-white rounded-lg text-xs font-semibold hover:bg-amber-700 transition-all"
            title="Skip to final submission"
          >
            Skip to Submit
          </button>
          <button
            onClick={onExitTestMode}
            className="px-3 py-1.5 bg-gray-200 text-gray-700 rounded-lg text-xs font-semibold hover:bg-gray-300 transition-all"
          >
            Exit Test Mode
          </button>
        </div>
      </div>

      {/* Debug Info Panel */}
      {showDebugInfo && (
        <div className="p-4 bg-gray-50 rounded-xl border border-gray-200 text-xs space-y-3">
          <div className="font-semibold text-gray-700 text-sm mb-2">Debug Information</div>
          
          {/* Grade Level Info */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <div className="text-gray-500 mb-1">Grade Level:</div>
              <div className={`font-mono font-semibold ${isHigherSecondary ? 'text-purple-600' : 'text-gray-800'}`}>
                {gradeLevel || 'Not set'}
              </div>
            </div>
            <div>
              <div className="text-gray-500 mb-1">Student Stream:</div>
              <div className="font-mono font-semibold text-gray-800">
                {studentStream || 'Not set'}
              </div>
            </div>
          </div>

          {/* Section Progress */}
          <div>
            <div className="text-gray-500 mb-1">Section Progress:</div>
            <div className="font-mono font-semibold text-gray-800">
              {currentSectionIndex + 1} / {totalSections}
              {currentSection && ` - ${currentSection.title}`}
            </div>
          </div>

          {/* Assessment Type */}
          <div>
            <div className="text-gray-500 mb-1">Assessment Type:</div>
            <div className={`font-mono font-semibold ${isComprehensiveAssessment ? 'text-green-600' : 'text-orange-600'}`}>
              {isComprehensiveAssessment ? '✅ Comprehensive (6 sections)' : '⚠️ Simplified'}
            </div>
          </div>

          {/* AI Questions Status */}
          {usesAIQuestions && (
            <div>
              <div className="text-gray-500 mb-1">AI Questions Status:</div>
              {aiQuestionsLoading ? (
                <div className="font-mono font-semibold text-blue-600">
                  ⏳ Loading AI questions...
                </div>
              ) : aiQuestionsLoaded ? (
                <div className="font-mono font-semibold text-green-600">
                  ✅ Loaded: {aiQuestionsLoaded.aptitude} aptitude + {aiQuestionsLoaded.knowledge} knowledge
                </div>
              ) : (
                <div className="font-mono font-semibold text-orange-600">
                  ⚠️ Not loaded yet
                </div>
              )}
            </div>
          )}

          {/* Sections List */}
          <div>
            <div className="text-gray-500 mb-2">Sections ({sections.length}):</div>
            <div className="space-y-1 max-h-40 overflow-y-auto">
              {sections.map((section, idx) => (
                <div 
                  key={section.id}
                  className={`flex items-center justify-between p-2 rounded ${
                    idx === currentSectionIndex 
                      ? 'bg-blue-100 border border-blue-300' 
                      : 'bg-white border border-gray-200'
                  }`}
                >
                  <div className="flex items-center gap-2">
                    <span className={`font-semibold ${idx === currentSectionIndex ? 'text-blue-700' : 'text-gray-600'}`}>
                      {idx + 1}.
                    </span>
                    <span className={`font-mono text-xs ${idx === currentSectionIndex ? 'text-blue-800' : 'text-gray-700'}`}>
                      {section.id}
                    </span>
                    <span className={`text-xs ${idx === currentSectionIndex ? 'text-blue-700' : 'text-gray-600'}`}>
                      - {section.title}
                    </span>
                  </div>
                  <span className={`text-xs font-semibold ${
                    section.questions?.length > 0 
                      ? 'text-green-600' 
                      : 'text-orange-600'
                  }`}>
                    {section.questions?.length || 0} Q
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* Higher Secondary Specific Checks */}
          {isHigherSecondary && (
            <div className="pt-3 border-t border-gray-300">
              <div className="text-gray-500 mb-2 font-semibold">Higher Secondary Checks:</div>
              <div className="space-y-1">
                <div className={`flex items-center gap-2 ${isComprehensiveAssessment ? 'text-green-600' : 'text-red-600'}`}>
                  {isComprehensiveAssessment ? '✅' : '❌'} Using comprehensive assessment
                </div>
                <div className={`flex items-center gap-2 ${sections.length === 6 ? 'text-green-600' : 'text-red-600'}`}>
                  {sections.length === 6 ? '✅' : '❌'} Has 6 sections (expected)
                </div>
                <div className={`flex items-center gap-2 ${sections.some(s => s.id === 'aptitude') ? 'text-green-600' : 'text-red-600'}`}>
                  {sections.some(s => s.id === 'aptitude') ? '✅' : '❌'} Has aptitude section
                </div>
                <div className={`flex items-center gap-2 ${sections.some(s => s.id === 'knowledge') ? 'text-green-600' : 'text-red-600'}`}>
                  {sections.some(s => s.id === 'knowledge') ? '✅' : '❌'} Has knowledge section
                </div>
                {aiQuestionsLoaded && (
                  <>
                    <div className={`flex items-center gap-2 ${aiQuestionsLoaded.aptitude === 50 ? 'text-green-600' : 'text-orange-600'}`}>
                      {aiQuestionsLoaded.aptitude === 50 ? '✅' : '⚠️'} Aptitude: {aiQuestionsLoaded.aptitude}/50 questions
                    </div>
                    <div className={`flex items-center gap-2 ${aiQuestionsLoaded.knowledge === 20 ? 'text-green-600' : 'text-orange-600'}`}>
                      {aiQuestionsLoaded.knowledge === 20 ? '✅' : '⚠️'} Knowledge: {aiQuestionsLoaded.knowledge}/20 questions
                    </div>
                  </>
                )}
                
                {/* Stream Format Validation */}
                <div className="mt-2 pt-2 border-t border-gray-200">
                  <div className={`flex items-center gap-2 ${
                    studentStream && studentStream.includes('_') 
                      ? 'text-green-600' 
                      : 'text-red-600'
                  }`}>
                    {studentStream && studentStream.includes('_') ? '✅' : '❌'} 
                    Stream: {studentStream && studentStream.includes('_') 
                      ? 'Specific ✓' 
                      : 'Generic ✗'}
                  </div>
                  {studentStream && !studentStream.includes('_') && (
                    <div className="mt-2 p-2 bg-red-50 rounded text-red-700 text-xs">
                      <strong>⚠️ ISSUE:</strong> Stream "{studentStream}" is too generic.
                      <br />
                      <strong>Expected:</strong> science_pcmb, science_pcms, etc.
                      <br />
                      <strong>Fix:</strong> Start NEW assessment, select specific stream.
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* After 12th Specific Checks */}
          {isAfter12 && (
            <div className="pt-3 border-t border-gray-300">
              <div className="text-gray-500 mb-2 font-semibold">After 12th Checks:</div>
              <div className="space-y-1">
                <div className={`flex items-center gap-2 ${isComprehensiveAssessment ? 'text-green-600' : 'text-red-600'}`}>
                  {isComprehensiveAssessment ? '✅' : '❌'} Using comprehensive assessment
                </div>
                <div className={`flex items-center gap-2 ${sections.length === 6 ? 'text-green-600' : 'text-red-600'}`}>
                  {sections.length === 6 ? '✅' : '❌'} Has 6 sections (expected)
                </div>
                <div className={`flex items-center gap-2 ${sections.some(s => s.id === 'riasec') ? 'text-green-600' : 'text-red-600'}`}>
                  {sections.some(s => s.id === 'riasec') ? '✅' : '❌'} Has RIASEC section (48 questions)
                </div>
                <div className={`flex items-center gap-2 ${sections.some(s => s.id === 'bigfive') ? 'text-green-600' : 'text-red-600'}`}>
                  {sections.some(s => s.id === 'bigfive') ? '✅' : '❌'} Has Big Five section (50 questions)
                </div>
                <div className={`flex items-center gap-2 ${sections.some(s => s.id === 'work_values') ? 'text-green-600' : 'text-red-600'}`}>
                  {sections.some(s => s.id === 'work_values') ? '✅' : '❌'} Has Work Values section (20 questions)
                </div>
                <div className={`flex items-center gap-2 ${sections.some(s => s.id === 'employability') ? 'text-green-600' : 'text-red-600'}`}>
                  {sections.some(s => s.id === 'employability') ? '✅' : '❌'} Has Employability section (30 questions)
                </div>
                <div className={`flex items-center gap-2 ${sections.some(s => s.id === 'aptitude') ? 'text-green-600' : 'text-red-600'}`}>
                  {sections.some(s => s.id === 'aptitude') ? '✅' : '❌'} Has Aptitude section (AI)
                </div>
                <div className={`flex items-center gap-2 ${sections.some(s => s.id === 'knowledge') ? 'text-green-600' : 'text-red-600'}`}>
                  {sections.some(s => s.id === 'knowledge') ? '✅' : '❌'} Has Knowledge section (AI)
                </div>
                {aiQuestionsLoaded && (
                  <>
                    <div className={`flex items-center gap-2 ${aiQuestionsLoaded.aptitude === 50 ? 'text-green-600' : 'text-orange-600'}`}>
                      {aiQuestionsLoaded.aptitude === 50 ? '✅' : '⚠️'} Aptitude: {aiQuestionsLoaded.aptitude}/50 questions
                    </div>
                    <div className={`flex items-center gap-2 ${aiQuestionsLoaded.knowledge === 20 ? 'text-green-600' : 'text-orange-600'}`}>
                      {aiQuestionsLoaded.knowledge === 20 ? '✅' : '⚠️'} Knowledge: {aiQuestionsLoaded.knowledge}/20 questions
                    </div>
                  </>
                )}
                
                {/* Stream Validation for After 12th */}
                <div className="mt-2 pt-2 border-t border-gray-200">
                  <div className={`flex items-center gap-2 ${
                    studentStream && ['science', 'commerce', 'arts'].includes(studentStream.toLowerCase())
                      ? 'text-green-600' 
                      : 'text-orange-600'
                  }`}>
                    {studentStream && ['science', 'commerce', 'arts'].includes(studentStream.toLowerCase()) ? '✅' : '⚠️'} 
                    Stream: {studentStream || 'Not set'}
                  </div>
                  <div className="mt-1 p-2 bg-blue-50 rounded text-blue-700 text-xs">
                    <strong>ℹ️ After 12th Streams:</strong> Science, Commerce, or Arts
                  </div>
                </div>

                {/* Total Questions Count */}
                <div className="mt-2 pt-2 border-t border-gray-200">
                  <div className="text-gray-500 mb-1">Total Questions Expected:</div>
                  <div className="font-mono text-xs space-y-0.5">
                    <div>RIASEC: 48</div>
                    <div>Big Five: 50</div>
                    <div>Work Values: 20</div>
                    <div>Employability: 30</div>
                    <div>Aptitude (AI): 50</div>
                    <div>Knowledge (AI): 20</div>
                    <div className="font-semibold text-green-600 pt-1 border-t border-gray-300">Total: 218 questions</div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Console Log Button */}
          <div className="pt-3 border-t border-gray-300">
            <button
              onClick={() => {
                console.log('=== TEST MODE DEBUG INFO ===');
                console.log('Grade Level:', gradeLevel);
                console.log('Student Stream:', studentStream);
                console.log('Current Section:', currentSectionIndex, '/', totalSections);
                console.log('AI Questions Loading:', aiQuestionsLoading);
                console.log('AI Questions Loaded:', aiQuestionsLoaded);
                console.log('Sections:', sections.map(s => ({
                  id: s.id,
                  title: s.title,
                  questions: s.questions?.length || 0
                })));
                console.log('Is Comprehensive:', isComprehensiveAssessment);
                console.log('Is Higher Secondary:', isHigherSecondary);
                console.log('Is After 12th:', isAfter12);
              }}
              className="w-full px-3 py-2 bg-gray-700 text-white rounded-lg text-xs font-semibold hover:bg-gray-800 transition-all"
            >
              📋 Log Full Debug Info to Console
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default TestModeControls;
