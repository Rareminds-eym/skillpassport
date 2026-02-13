/**
 * Assessment Debug Panel
 * Shows all data used during assessment evaluation for development/testing
 * Only visible in development mode
 */

import React, { useState } from 'react';
import { ChevronDown, ChevronUp, Eye, EyeOff } from 'lucide-react';

interface AssessmentDebugPanelProps {
  assessmentData?: any;
  aiResponse?: any;
  studentContext?: any;
  gradeLevel?: string;
  studentStream?: string;
  adaptiveResults?: any;
  timings?: any;
  attemptData?: any; // Full attempt record
  resultData?: any;  // Full result record
}

export const AssessmentDebugPanel: React.FC<AssessmentDebugPanelProps> = ({
  assessmentData,
  aiResponse,
  studentContext,
  gradeLevel,
  studentStream,
  adaptiveResults,
  timings,
  attemptData,
  resultData,
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<'flow' | 'database' | 'input' | 'context' | 'adaptive' | 'output'>('flow');
  const [showSensitive, setShowSensitive] = useState(false);

  // Show in development mode OR if URL has ?debug=true
  const urlParams = new URLSearchParams(window.location.search);
  const forceDebug = urlParams.get('debug') === 'true';
  const isDevelopment = import.meta.env.DEV || import.meta.env.MODE === 'development' || forceDebug;

  if (!isDevelopment) {
    return null;
  }

  // Helper to safely count questions from different data structures
  const getQuestionCount = (data: any, key: string): number => {
    if (!data) return 0;
    
    // Try nested structure first (e.g., riasecAnswers: {...})
    const answers = data[key];
    if (answers && typeof answers === 'object') {
      return Object.keys(answers).length;
    }
    
    // Try flat structure with prefixes (e.g., hs_interest_explorer_hs1, hs_interest_explorer_hs2)
    const prefixMap: Record<string, string> = {
      'riasecAnswers': 'interest_explorer',
      'bigFiveAnswers': 'strengths_character',
      'knowledgeAnswers': 'learning_preferences',
      'aptitudeAnswers': 'aptitude_sampling'
    };
    
    const prefix = prefixMap[key];
    if (prefix && typeof data === 'object') {
      const matchingKeys = Object.keys(data).filter(k => k.includes(prefix));
      return matchingKeys.length;
    }
    
    return 0;
  };

  // Try multiple possible locations for assessment data
  const actualAssessmentData = assessmentData || 
                                attemptData?.all_responses || 
                                resultData?.all_responses ||
                                resultData?.raw_answers;

  const riasecCount = getQuestionCount(actualAssessmentData, 'riasecAnswers');
  const bigFiveCount = getQuestionCount(actualAssessmentData, 'bigFiveAnswers');
  const knowledgeCount = getQuestionCount(actualAssessmentData, 'knowledgeAnswers');
  const aptitudeCount = getQuestionCount(actualAssessmentData, 'aptitudeAnswers');

  // Get adaptive session ID from multiple possible locations
  const adaptiveSessionId = attemptData?.adaptive_aptitude_session_id || 
                            resultData?.adaptive_aptitude_session_id ||
                            adaptiveResults?.sessionId ||
                            actualAssessmentData?.adaptive_aptitude_session_id;

  const tabs = [
    { id: 'flow', label: '🔄 Assessment Flow', count: 0 },
    { id: 'database', label: 'Database Fields', count: (attemptData ? 1 : 0) + (resultData ? 1 : 0) },
    { id: 'input', label: 'Input Data', count: assessmentData ? Object.keys(assessmentData).length : 0 },
    { id: 'context', label: 'Student Context', count: studentContext ? Object.keys(studentContext).length : 0 },
    { id: 'adaptive', label: 'Adaptive Results', count: adaptiveResults ? 1 : 0 },
    { id: 'output', label: 'AI Output', count: aiResponse ? Object.keys(aiResponse).length : 0 },
  ];

  return (
    <div className="fixed bottom-4 right-4 z-50 max-w-4xl">
      {/* Toggle Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="mb-2 flex items-center gap-2 rounded-lg bg-purple-600 px-4 py-2 text-white shadow-lg hover:bg-purple-700"
      >
        {isOpen ? <ChevronDown className="h-5 w-5" /> : <ChevronUp className="h-5 w-5" />}
        <span className="font-semibold">Assessment Debug Panel</span>
        <span className="rounded-full bg-purple-800 px-2 py-0.5 text-xs">DEV</span>
      </button>

      {/* Debug Panel */}
      {isOpen && (
        <div className="rounded-lg bg-white shadow-2xl border-2 border-purple-600 max-h-[600px] overflow-hidden flex flex-col">
          {/* Header */}
          <div className="bg-purple-600 px-4 py-3 text-white flex items-center justify-between">
            <div>
              <h3 className="font-bold text-lg">Assessment Evaluation Data</h3>
              <p className="text-xs text-purple-200">
                Grade: {gradeLevel || 'N/A'} | Stream: {studentStream || 'N/A'}
              </p>
            </div>
            <button
              onClick={() => setShowSensitive(!showSensitive)}
              className="flex items-center gap-1 rounded bg-purple-700 px-3 py-1 text-sm hover:bg-purple-800"
            >
              {showSensitive ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              {showSensitive ? 'Hide' : 'Show'} Sensitive
            </button>
          </div>

          {/* Tabs */}
          <div className="flex border-b border-gray-200 bg-gray-50">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as any)}
                className={`flex-1 px-4 py-3 text-sm font-medium transition-colors ${
                  activeTab === tab.id
                    ? 'border-b-2 border-purple-600 bg-white text-purple-600'
                    : 'text-gray-600 hover:bg-gray-100 hover:text-gray-900'
                }`}
              >
                {tab.label}
                {tab.count > 0 && (
                  <span className="ml-2 rounded-full bg-gray-200 px-2 py-0.5 text-xs">
                    {tab.count}
                  </span>
                )}
              </button>
            ))}
          </div>

          {/* Content */}
          <div className="overflow-y-auto p-4 max-h-[450px]">
            {activeTab === 'flow' && (
              <div className="space-y-3">
                <h4 className="font-semibold text-gray-900 mb-3">Complete Assessment Journey</h4>
                
                {/* Stage 1: RIASEC */}
                <div className="border-l-4 border-rose-500 pl-4 py-2 bg-rose-50 rounded-r">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="bg-rose-500 text-white px-2 py-0.5 rounded text-xs font-bold">STAGE 1</span>
                    <h5 className="font-semibold text-rose-900">Interest Explorer (RIASEC)</h5>
                  </div>
                  <p className="text-xs text-gray-700 mb-2">Student rates activities/interests on 1-5 scale</p>
                  <div className="bg-white rounded p-2 text-xs space-y-1">
                    <p><span className="font-semibold">Questions:</span> {riasecCount}</p>
                    <p><span className="font-semibold">Stored in:</span> <code>all_responses.riasecAnswers</code></p>
                    <p><span className="font-semibold">Result:</span> {resultData?.riasec_code || 'Not calculated'}</p>
                    <p className="text-gray-600">→ Determines career interest types (R, I, A, S, E, C)</p>
                  </div>
                </div>

                {/* Stage 2: Character Strengths */}
                <div className="border-l-4 border-amber-500 pl-4 py-2 bg-amber-50 rounded-r">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="bg-amber-500 text-white px-2 py-0.5 rounded text-xs font-bold">STAGE 2</span>
                    <h5 className="font-semibold text-amber-900">Character Strengths (Big Five)</h5>
                  </div>
                  <p className="text-xs text-gray-700 mb-2">Personality traits assessment</p>
                  <div className="bg-white rounded p-2 text-xs space-y-1">
                    <p><span className="font-semibold">Questions:</span> {bigFiveCount}</p>
                    <p><span className="font-semibold">Stored in:</span> <code>all_responses.bigFiveAnswers</code></p>
                    <p><span className="font-semibold">Result:</span> {resultData?.bigfive_scores ? 'Calculated' : 'Not calculated'}</p>
                    <p className="text-gray-600">→ Measures O, C, E, A, N personality dimensions</p>
                  </div>
                </div>

                {/* Stage 3: Learning Preferences */}
                <div className="border-l-4 border-blue-500 pl-4 py-2 bg-blue-50 rounded-r">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="bg-blue-500 text-white px-2 py-0.5 rounded text-xs font-bold">STAGE 3</span>
                    <h5 className="font-semibold text-blue-900">Learning & Work Preferences</h5>
                  </div>
                  <p className="text-xs text-gray-700 mb-2">Work values and learning style</p>
                  <div className="bg-white rounded p-2 text-xs space-y-1">
                    <p><span className="font-semibold">Questions:</span> {knowledgeCount}</p>
                    <p><span className="font-semibold">Stored in:</span> <code>all_responses.knowledgeAnswers</code></p>
                    <p className="text-gray-600">→ Identifies preferred work environment and learning style</p>
                  </div>
                </div>

                {/* Stage 4: Aptitude Sampling */}
                <div className="border-l-4 border-purple-500 pl-4 py-2 bg-purple-50 rounded-r">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="bg-purple-500 text-white px-2 py-0.5 rounded text-xs font-bold">STAGE 4</span>
                    <h5 className="font-semibold text-purple-900">Aptitude Sampling (Self-Assessment)</h5>
                  </div>
                  <p className="text-xs text-gray-700 mb-2">Student rates ease/enjoyment of task types</p>
                  <div className="bg-white rounded p-2 text-xs space-y-1">
                    <p><span className="font-semibold">Questions:</span> {aptitudeCount}</p>
                    <p><span className="font-semibold">Stored in:</span> <code>all_responses.aptitudeAnswers</code></p>
                    <p><span className="font-semibold">Result:</span> {resultData?.aptitude_scores ? 'Calculated' : 'Not calculated'}</p>
                    <p className="text-gray-600">→ Self-reported aptitude in analytical, creative, technical, social tasks</p>
                  </div>
                </div>

                {/* Stage 5: Adaptive Aptitude Test */}
                <div className="border-l-4 border-indigo-500 pl-4 py-2 bg-indigo-50 rounded-r">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="bg-indigo-500 text-white px-2 py-0.5 rounded text-xs font-bold">STAGE 5</span>
                    <h5 className="font-semibold text-indigo-900">Adaptive Aptitude Test</h5>
                  </div>
                  <p className="text-xs text-gray-700 mb-2">AI-powered adaptive testing (50 questions)</p>
                  <div className="bg-white rounded p-2 text-xs space-y-1">
                    <p><span className="font-semibold">Session ID:</span> {adaptiveSessionId || 'Not started'}</p>
                    <p><span className="font-semibold">Questions:</span> 8 diagnostic + 36 adaptive + 6 stability = 50 total</p>
                    <p><span className="font-semibold">Stored in:</span> <code>adaptive_aptitude_sessions</code> + <code>adaptive_aptitude_responses</code></p>
                    <p><span className="font-semibold">Result:</span> {adaptiveResults ? `Level ${adaptiveResults.aptitudeLevel}/5 (${adaptiveResults.overallAccuracy}%)` : 'Not completed'}</p>
                    <p className="text-gray-600">→ Objective aptitude measurement across 5 cognitive areas</p>
                  </div>
                  {adaptiveResults && (
                    <div className="bg-indigo-100 rounded p-2 mt-2 text-xs">
                      <p className="font-semibold mb-1">Adaptive Test Breakdown:</p>
                      <ul className="space-y-0.5 ml-4 list-disc">
                        <li>Numerical Reasoning: {adaptiveResults.accuracyBySubtag?.numerical_reasoning?.accuracy || 0}%</li>
                        <li>Logical Reasoning: {adaptiveResults.accuracyBySubtag?.logical_reasoning?.accuracy || 0}%</li>
                        <li>Verbal Reasoning: {adaptiveResults.accuracyBySubtag?.verbal_reasoning?.accuracy || 0}%</li>
                        <li>Spatial Reasoning: {adaptiveResults.accuracyBySubtag?.spatial_reasoning?.accuracy || 0}%</li>
                        <li>Pattern Recognition: {adaptiveResults.accuracyBySubtag?.pattern_recognition?.accuracy || 0}%</li>
                      </ul>
                    </div>
                  )}
                </div>

                {/* Stage 6: AI Analysis */}
                <div className="border-l-4 border-green-500 pl-4 py-2 bg-green-50 rounded-r">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="bg-green-500 text-white px-2 py-0.5 rounded text-xs font-bold">STAGE 6</span>
                    <h5 className="font-semibold text-green-900">AI Analysis & Report Generation</h5>
                  </div>
                  <p className="text-xs text-gray-700 mb-2">OpenRouter AI analyzes all data and generates report</p>
                  <div className="bg-white rounded p-2 text-xs space-y-1">
                    <p><span className="font-semibold">Input:</span> All answers + student context + adaptive results</p>
                    <p><span className="font-semibold">Prompt Used:</span> {
                      gradeLevel === 'middle' ? 'Middle School (6-8)' :
                      gradeLevel === 'highschool' ? 'High School (9-10)' :
                      gradeLevel === 'higher_secondary' ? 'High School (11-12)' :
                      gradeLevel === 'after12' || gradeLevel === 'college' ? 'College/After 12th' :
                      gradeLevel || 'Unknown'
                    }</p>
                    <p><span className="font-semibold">Grade Context:</span> {studentContext?.rawGrade || studentContext?.grade || 'Not provided'}</p>
                    <p><span className="font-semibold">Stored in:</span> <code>gemini_results</code> (JSONB)</p>
                    <p className="text-gray-600">→ Generates career recommendations, roadmap, skill gaps</p>
                  </div>
                  <div className="bg-green-100 rounded p-2 mt-2 text-xs">
                    <p className="font-semibold mb-1">AI Output Includes:</p>
                    <ul className="space-y-0.5 ml-4 list-disc">
                      <li>RIASEC scores & code (extracted to <code>riasec_code</code>)</li>
                      <li>Career fit & tracks (extracted to <code>career_fit</code>)</li>
                      <li>Skill gaps & recommendations</li>
                      <li>Learning roadmap (extracted to <code>roadmap</code>)</li>
                      <li>Personality insights</li>
                    </ul>
                  </div>
                </div>

                {/* Stage 7: Database Storage */}
                <div className="border-l-4 border-gray-500 pl-4 py-2 bg-gray-50 rounded-r">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="bg-gray-500 text-white px-2 py-0.5 rounded text-xs font-bold">STAGE 7</span>
                    <h5 className="font-semibold text-gray-900">Database Storage & Triggers</h5>
                  </div>
                  <p className="text-xs text-gray-700 mb-2">Triggers extract data from gemini_results</p>
                  <div className="bg-white rounded p-2 text-xs space-y-1">
                    <p><span className="font-semibold">Trigger:</span> <code>populate_result_columns_from_gemini()</code></p>
                    <p><span className="font-semibold">Extracts:</span></p>
                    <ul className="ml-4 list-disc space-y-0.5 text-gray-600">
                      <li><code>riasec_scores</code> → from gemini_results.riasec</li>
                      <li><code>riasec_code</code> → from gemini_results.riasec.code</li>
                      <li><code>career_fit</code> → from gemini_results.careerFit</li>
                      <li><code>roadmap</code> → from gemini_results.roadmap</li>
                      <li><code>aptitude_scores</code> → from gemini_results.aptitude</li>
                      <li><code>bigfive_scores</code> → from gemini_results.bigFive</li>
                    </ul>
                  </div>
                </div>

                {/* Stage 8: Report Display */}
                <div className="border-l-4 border-pink-500 pl-4 py-2 bg-pink-50 rounded-r">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="bg-pink-500 text-white px-2 py-0.5 rounded text-xs font-bold">STAGE 8</span>
                    <h5 className="font-semibold text-pink-900">Report Display</h5>
                  </div>
                  <p className="text-xs text-gray-700 mb-2">Frontend combines all data for visual report</p>
                  <div className="bg-white rounded p-2 text-xs space-y-1">
                    <p><span className="font-semibold">Data Sources:</span></p>
                    <ul className="ml-4 list-disc space-y-0.5 text-gray-600">
                      <li>RIASEC chart → <code>riasec_scores</code></li>
                      <li>Career tracks → <code>career_fit.tracks</code></li>
                      <li>Aptitude scores → <code>aptitude_scores</code> + <code>adaptive_aptitude_results</code></li>
                      <li>Personality → <code>bigfive_scores</code></li>
                      <li>Roadmap → <code>roadmap</code></li>
                      <li>Summary → <code>gemini_results.summary</code></li>
                    </ul>
                  </div>
                </div>

                {/* Data Verification */}
                <div className="bg-gradient-to-r from-blue-50 to-purple-50 border-2 border-blue-300 rounded p-4 mt-4">
                  <h5 className="font-semibold text-gray-900 mb-2">✅ Data Verification Checklist</h5>
                  <div className="space-y-1 text-xs">
                    <p className={riasecCount > 0 ? 'text-green-700' : 'text-red-700'}>
                      {riasecCount > 0 ? '✅' : '❌'} RIASEC answers collected ({riasecCount} questions)
                    </p>
                    <p className={bigFiveCount > 0 ? 'text-green-700' : 'text-red-700'}>
                      {bigFiveCount > 0 ? '✅' : '❌'} Big Five answers collected ({bigFiveCount} questions)
                    </p>
                    <p className={aptitudeCount > 0 ? 'text-green-700' : 'text-red-700'}>
                      {aptitudeCount > 0 ? '✅' : '❌'} Aptitude sampling collected ({aptitudeCount} questions)
                    </p>
                    <p className={(adaptiveResults || resultData?.adaptive_aptitude_results || resultData?._rawDatabaseFields?.adaptive_aptitude_session_id || attemptData?.adaptive_aptitude_session_id) ? 'text-green-700' : 'text-red-700'}>
                      {(adaptiveResults || resultData?.adaptive_aptitude_results || resultData?._rawDatabaseFields?.adaptive_aptitude_session_id || attemptData?.adaptive_aptitude_session_id) ? '✅' : '❌'} Adaptive test completed
                    </p>
                    <p className={studentContext?.rawGrade || studentContext?.grade ? 'text-green-700' : 'text-red-700'}>
                      {studentContext?.rawGrade || studentContext?.grade ? '✅' : '❌'} Student grade context provided ({studentContext?.rawGrade || studentContext?.grade || 'missing'})
                    </p>
                    <p className={aiResponse ? 'text-green-700' : 'text-red-700'}>
                      {aiResponse ? '✅' : '❌'} AI analysis completed
                    </p>
                    <p className={(resultData?.career_fit || aiResponse?.careerFit) ? 'text-green-700' : 'text-red-700'}>
                      {(resultData?.career_fit || aiResponse?.careerFit) ? '✅' : '❌'} Career recommendations generated
                    </p>
                  </div>
                </div>
              </div>
            )}

            {activeTab === 'database' && (
              <div className="space-y-4">
                {/* Attempt Data */}
                <div>
                  <h4 className="font-semibold text-gray-900 mb-2 flex items-center gap-2">
                    📋 personal_assessment_attempts
                    <span className="text-xs text-gray-500">(Current attempt record)</span>
                  </h4>
                  {attemptData ? (
                    <div className="space-y-2">
                      <div className="grid grid-cols-2 gap-2 text-xs">
                        <div className="bg-blue-50 p-2 rounded">
                          <span className="font-semibold">id:</span> {attemptData.id}
                        </div>
                        <div className="bg-blue-50 p-2 rounded">
                          <span className="font-semibold">student_id:</span> {attemptData.student_id}
                        </div>
                        <div className="bg-green-50 p-2 rounded">
                          <span className="font-semibold">grade_level:</span> <span className="text-green-700 font-bold">{attemptData.grade_level}</span>
                        </div>
                        <div className="bg-green-50 p-2 rounded">
                          <span className="font-semibold">stream_id:</span> {attemptData.stream_id || 'null'}
                        </div>
                        <div className="bg-purple-50 p-2 rounded">
                          <span className="font-semibold">adaptive_aptitude_session_id:</span> {attemptData.adaptive_aptitude_session_id || 'null'}
                        </div>
                        <div className="bg-gray-50 p-2 rounded">
                          <span className="font-semibold">status:</span> {attemptData.status}
                        </div>
                        <div className="bg-yellow-50 p-2 rounded col-span-2">
                          <span className="font-semibold">student_context:</span> {attemptData.student_context ? '✅ Present' : '❌ Missing'}
                        </div>
                      </div>
                      {attemptData.student_context && (
                        <div className="bg-yellow-50 border border-yellow-200 rounded p-3 text-xs">
                          <p className="font-semibold mb-1">student_context (stored in DB):</p>
                          <pre className="overflow-x-auto">{JSON.stringify(attemptData.student_context, null, 2)}</pre>
                        </div>
                      )}
                      <details className="bg-gray-50 rounded p-2">
                        <summary className="cursor-pointer text-xs font-semibold">View all attempt fields</summary>
                        <pre className="text-xs mt-2 overflow-x-auto">{JSON.stringify(attemptData, null, 2)}</pre>
                      </details>
                    </div>
                  ) : (
                    <p className="text-gray-500 text-sm">No attempt data available</p>
                  )}
                </div>

                {/* Result Data */}
                <div>
                  <h4 className="font-semibold text-gray-900 mb-2 flex items-center gap-2">
                    📊 personal_assessment_results
                    <span className="text-xs text-gray-500">(Stored results)</span>
                  </h4>
                  {/* ✅ CRITICAL FIX: Use _rawDatabaseFields instead of resultData directly */}
                  {(resultData?._rawDatabaseFields || resultData) ? (
                    <div className="space-y-2">
                      {(() => {
                        // Use raw database fields if available, otherwise fall back to resultData
                        const dbFields = resultData?._rawDatabaseFields || resultData;
                        return (
                          <>
                            <div className="grid grid-cols-2 gap-2 text-xs">
                              <div className="bg-blue-50 p-2 rounded">
                                <span className="font-semibold">id:</span> {dbFields.id || 'N/A'}
                              </div>
                              <div className="bg-blue-50 p-2 rounded">
                                <span className="font-semibold">attempt_id:</span> {dbFields.attempt_id || 'N/A'}
                              </div>
                              <div className="bg-green-50 p-2 rounded">
                                <span className="font-semibold">grade_level:</span> <span className="text-green-700 font-bold">{dbFields.grade_level || 'N/A'}</span>
                              </div>
                              <div className="bg-green-50 p-2 rounded">
                                <span className="font-semibold">stream_id:</span> {dbFields.stream_id || 'N/A'}
                              </div>
                              <div className="bg-purple-50 p-2 rounded col-span-2">
                                <span className="font-semibold">adaptive_aptitude_session_id:</span> {dbFields.adaptive_aptitude_session_id || 'null'}
                              </div>
                              <div className="bg-indigo-50 p-2 rounded">
                                <span className="font-semibold">riasec_code:</span> {dbFields.riasec_code || 'null'}
                              </div>
                              <div className="bg-indigo-50 p-2 rounded">
                                <span className="font-semibold">aptitude_overall:</span> {dbFields.aptitude_overall || 'null'}
                              </div>
                              <div className="bg-pink-50 p-2 rounded">
                                <span className="font-semibold">gemini_results:</span> {dbFields.gemini_results ? '✅ Present' : '❌ Missing'}
                              </div>
                              <div className="bg-pink-50 p-2 rounded">
                                <span className="font-semibold">career_fit:</span> {dbFields.career_fit ? '✅ Present' : '❌ Missing'}
                              </div>
                            </div>
                            
                            {/* Field Usage Analysis */}
                            <div className="bg-amber-50 border border-amber-200 rounded p-3">
                              <p className="font-semibold text-sm mb-2">📈 Field Usage Analysis:</p>
                              <div className="space-y-1 text-xs">
                                <p className={dbFields.riasec_scores ? 'text-green-700' : 'text-red-700'}>
                                  {dbFields.riasec_scores ? '✅' : '❌'} <span className="font-semibold">riasec_scores:</span> {dbFields.riasec_scores ? 'Populated' : 'Empty'}
                                </p>
                                <p className={dbFields.aptitude_scores ? 'text-green-700' : 'text-red-700'}>
                                  {dbFields.aptitude_scores ? '✅' : '❌'} <span className="font-semibold">aptitude_scores:</span> {dbFields.aptitude_scores ? 'Populated' : 'Empty'}
                                </p>
                                <p className={dbFields.bigfive_scores ? 'text-green-700' : 'text-red-700'}>
                                  {dbFields.bigfive_scores ? '✅' : '❌'} <span className="font-semibold">bigfive_scores:</span> {dbFields.bigfive_scores ? 'Populated' : 'Empty'}
                                </p>
                                <p className={dbFields.career_fit ? 'text-green-700' : 'text-red-700'}>
                                  {dbFields.career_fit ? '✅' : '❌'} <span className="font-semibold">career_fit:</span> {dbFields.career_fit ? 'Populated' : 'Empty'}
                                </p>
                                <p className={dbFields.roadmap ? 'text-green-700' : 'text-red-700'}>
                                  {dbFields.roadmap ? '✅' : '❌'} <span className="font-semibold">roadmap:</span> {dbFields.roadmap ? 'Populated' : 'Empty'}
                                </p>
                                <p className={dbFields.gemini_results ? 'text-green-700' : 'text-red-700'}>
                                  {dbFields.gemini_results ? '✅' : '❌'} <span className="font-semibold">gemini_results:</span> {dbFields.gemini_results ? 'Populated (AI response)' : 'Empty'}
                                </p>
                              </div>
                              
                              {/* Warning if gemini_results is empty */}
                              {!dbFields.gemini_results && (
                                <div className="mt-2 bg-red-100 border border-red-300 rounded p-2 text-xs">
                                  <p className="font-semibold text-red-800">⚠️ gemini_results is empty!</p>
                                  <p className="text-red-700 mt-1">This means AI analysis never ran or failed. Individual columns may also be empty.</p>
                                </div>
                              )}
                            </div>
                            
                            <details className="bg-gray-50 rounded p-2">
                              <summary className="cursor-pointer text-xs font-semibold">View all result fields (raw database)</summary>
                              <pre className="text-xs mt-2 overflow-x-auto">{JSON.stringify(dbFields, null, 2)}</pre>
                            </details>
                          </>
                        );
                      })()}
                    </div>
                  ) : (
                    <p className="text-gray-500 text-sm">No result data available</p>
                  )}
                </div>

                {/* Adaptive Results */}
                {adaptiveResults && (
                  <div>
                    <h4 className="font-semibold text-gray-900 mb-2 flex items-center gap-2">
                      🎯 adaptive_aptitude_results
                      <span className="text-xs text-gray-500">(Adaptive test results)</span>
                    </h4>
                    <div className="space-y-2">
                      <div className="grid grid-cols-2 gap-2 text-xs">
                        <div className="bg-indigo-50 p-2 rounded">
                          <span className="font-semibold">aptitude_level:</span> {adaptiveResults.aptitudeLevel}/5
                        </div>
                        <div className="bg-indigo-50 p-2 rounded">
                          <span className="font-semibold">overall_accuracy:</span> {adaptiveResults.overallAccuracy}%
                        </div>
                        <div className="bg-indigo-50 p-2 rounded">
                          <span className="font-semibold">confidence_tag:</span> {adaptiveResults.confidenceTag}
                        </div>
                        <div className="bg-indigo-50 p-2 rounded">
                          <span className="font-semibold">tier:</span> {adaptiveResults.tier}
                        </div>
                        <div className="bg-indigo-50 p-2 rounded">
                          <span className="font-semibold">path_classification:</span> {adaptiveResults.pathClassification}
                        </div>
                        <div className="bg-indigo-50 p-2 rounded">
                          <span className="font-semibold">grade_level:</span> {adaptiveResults.gradeLevel}
                        </div>
                      </div>
                      <details className="bg-gray-50 rounded p-2">
                        <summary className="cursor-pointer text-xs font-semibold">View accuracy by subtag</summary>
                        <pre className="text-xs mt-2 overflow-x-auto">{JSON.stringify(adaptiveResults.accuracyBySubtag, null, 2)}</pre>
                      </details>
                    </div>
                  </div>
                )}

                {/* Data Flow Diagram */}
                <div className="bg-gradient-to-r from-blue-50 to-purple-50 border-2 border-blue-200 rounded p-4">
                  <h4 className="font-semibold text-gray-900 mb-3">🔄 Data Flow & Storage</h4>
                  <div className="space-y-2 text-xs">
                    <div className="flex items-center gap-2">
                      <span className="bg-blue-500 text-white px-2 py-1 rounded">1</span>
                      <span>Student answers → <code className="bg-white px-1">all_responses</code> (attempts table)</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="bg-blue-500 text-white px-2 py-1 rounded">2</span>
                      <span>Grade context → <code className="bg-white px-1">student_context</code> (attempts table)</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="bg-purple-500 text-white px-2 py-1 rounded">3</span>
                      <span>AI analysis → <code className="bg-white px-1">gemini_results</code> (results table)</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="bg-green-500 text-white px-2 py-1 rounded">4</span>
                      <span>Trigger extracts → <code className="bg-white px-1">career_fit, roadmap, riasec_code</code></span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="bg-amber-500 text-white px-2 py-1 rounded">5</span>
                      <span>Display uses → All fields combined for report</span>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {activeTab === 'input' && (
              <div className="space-y-4">
                {actualAssessmentData ? (
                  <>
                    <div>
                      <h4 className="font-semibold text-gray-900 mb-2">Assessment Answers</h4>
                      <div className="bg-gray-50 rounded p-3 text-xs font-mono overflow-x-auto">
                        <pre>{JSON.stringify(actualAssessmentData, null, 2)}</pre>
                      </div>
                    </div>
                    {timings && (
                      <div>
                        <h4 className="font-semibold text-gray-900 mb-2">Response Timings</h4>
                        <div className="bg-gray-50 rounded p-3 text-xs font-mono overflow-x-auto">
                          <pre>{JSON.stringify(timings, null, 2)}</pre>
                        </div>
                      </div>
                    )}
                  </>
                ) : (
                  <div className="bg-yellow-50 border border-yellow-200 rounded p-4">
                    <p className="font-semibold text-yellow-900 mb-2">⚠️ No Assessment Data Found</p>
                    <p className="text-sm text-yellow-800 mb-2">Checked these locations:</p>
                    <ul className="list-disc ml-4 text-xs text-yellow-800 space-y-1">
                      <li>assessmentData prop: {assessmentData ? '✅ Found' : '❌ Not found'}</li>
                      <li>attemptData.all_responses: {attemptData?.all_responses ? '✅ Found' : '❌ Not found'}</li>
                      <li>resultData.all_responses: {resultData?.all_responses ? '✅ Found' : '❌ Not found'}</li>
                      <li>resultData.raw_answers: {resultData?.raw_answers ? '✅ Found' : '❌ Not found'}</li>
                    </ul>
                    <p className="text-sm text-yellow-800 mt-2">
                      Check browser console for "🔍 Debug Panel Data Sources:" log
                    </p>
                  </div>
                )}
              </div>
            )}

            {activeTab === 'context' && (
              <div className="space-y-4">
                <div>
                  <h4 className="font-semibold text-gray-900 mb-2">Student Context Sent to AI</h4>
                  {studentContext ? (
                    <div className="space-y-2">
                      <div className="bg-blue-50 border border-blue-200 rounded p-3">
                        <p className="text-sm">
                          <span className="font-semibold">Raw Grade:</span>{' '}
                          <span className="text-blue-700">{studentContext.rawGrade || 'N/A'}</span>
                        </p>
                        <p className="text-sm">
                          <span className="font-semibold">Grade:</span>{' '}
                          <span className="text-blue-700">{studentContext.grade || 'N/A'}</span>
                        </p>
                        <p className="text-sm">
                          <span className="font-semibold">Program:</span>{' '}
                          <span className="text-blue-700">{studentContext.programName || 'N/A'}</span>
                        </p>
                        <p className="text-sm">
                          <span className="font-semibold">Degree Level:</span>{' '}
                          <span className="text-blue-700">{studentContext.degreeLevel || 'N/A'}</span>
                        </p>
                        <p className="text-sm">
                          <span className="font-semibold">Selected Stream:</span>{' '}
                          <span className="text-blue-700">{studentContext.selectedStream || 'N/A'}</span>
                        </p>
                        <p className="text-sm">
                          <span className="font-semibold">Selected Category:</span>{' '}
                          <span className="text-blue-700">{studentContext.selectedCategory || 'N/A'}</span>
                        </p>
                      </div>
                      <div className="bg-gray-50 rounded p-3 text-xs font-mono overflow-x-auto">
                        <pre>{JSON.stringify(studentContext, null, 2)}</pre>
                      </div>
                    </div>
                  ) : (
                    <p className="text-gray-500 text-sm">No student context available</p>
                  )}
                </div>
                <div>
                  <h4 className="font-semibold text-gray-900 mb-2">Grade Level Mapping</h4>
                  <div className="bg-yellow-50 border border-yellow-200 rounded p-3 text-sm">
                    <p><span className="font-semibold">UI Grade Level:</span> {gradeLevel}</p>
                    <p className="text-xs text-gray-600 mt-1">
                      • middle (6-8) → Middle School Prompt<br/>
                      • highschool (9-10) → High School Prompt<br/>
                      • higher_secondary (11-12) → High School Prompt<br/>
                      • after12/college → College Prompt
                    </p>
                  </div>
                </div>
              </div>
            )}

            {activeTab === 'adaptive' && (
              <div className="space-y-4">
                <div>
                  <h4 className="font-semibold text-gray-900 mb-2">Adaptive Aptitude Results</h4>
                  {adaptiveResults ? (
                    <div className="space-y-2">
                      <div className="bg-indigo-50 border border-indigo-200 rounded p-3">
                        <p className="text-sm">
                          <span className="font-semibold">Aptitude Level:</span>{' '}
                          <span className="text-indigo-700">{adaptiveResults.aptitudeLevel}/5</span>
                        </p>
                        <p className="text-sm">
                          <span className="font-semibold">Overall Accuracy:</span>{' '}
                          <span className="text-indigo-700">{adaptiveResults.overallAccuracy}%</span>
                        </p>
                        <p className="text-sm">
                          <span className="font-semibold">Confidence:</span>{' '}
                          <span className="text-indigo-700">{adaptiveResults.confidenceTag}</span>
                        </p>
                        <p className="text-sm">
                          <span className="font-semibold">Path Classification:</span>{' '}
                          <span className="text-indigo-700">{adaptiveResults.pathClassification}</span>
                        </p>
                      </div>
                      <div className="bg-gray-50 rounded p-3 text-xs font-mono overflow-x-auto">
                        <pre>{JSON.stringify(adaptiveResults, null, 2)}</pre>
                      </div>
                    </div>
                  ) : (
                    <p className="text-gray-500 text-sm">No adaptive aptitude results available</p>
                  )}
                </div>
              </div>
            )}

            {activeTab === 'output' && (
              <div className="space-y-4">
                <div>
                  <h4 className="font-semibold text-gray-900 mb-2">AI Analysis Output</h4>
                  {aiResponse ? (
                    <div className="space-y-2">
                      <div className="bg-green-50 border border-green-200 rounded p-3">
                        <p className="text-sm">
                          <span className="font-semibold">RIASEC Code:</span>{' '}
                          <span className="text-green-700">{aiResponse.riasec?.code || 'N/A'}</span>
                        </p>
                        <p className="text-sm">
                          <span className="font-semibold">Career Tracks:</span>{' '}
                          <span className="text-green-700">
                            {aiResponse.careerFit?.tracks?.length || 
                             aiResponse.career_fit?.tracks?.length || 
                             aiResponse.careerFit?.clusters?.length ||
                             aiResponse.career_fit?.clusters?.length || 0} tracks
                          </span>
                        </p>
                        <p className="text-sm">
                          <span className="font-semibold">Has Roadmap:</span>{' '}
                          <span className="text-green-700">{aiResponse.roadmap ? 'Yes' : 'No'}</span>
                        </p>
                      </div>
                      {showSensitive && (
                        <div className="bg-gray-50 rounded p-3 text-xs font-mono overflow-x-auto">
                          <pre>{JSON.stringify(aiResponse, null, 2)}</pre>
                        </div>
                      )}
                      {!showSensitive && (
                        <p className="text-gray-500 text-sm italic">
                          Click "Show Sensitive" to view full AI response
                        </p>
                      )}
                    </div>
                  ) : (
                    <p className="text-gray-500 text-sm">No AI response available yet</p>
                  )}
                </div>
              </div>
            )}
          </div>

          {/* Footer */}
          <div className="border-t border-gray-200 bg-gray-50 px-4 py-2 text-xs text-gray-600">
            <p>
              💡 This panel shows all data used during assessment evaluation. Use it to verify:
            </p>
            <ul className="mt-1 ml-4 list-disc space-y-0.5">
              <li>Student's actual grade is being passed to AI</li>
              <li>Correct prompt is being used (middle/high school/college)</li>
              <li>Adaptive results are included</li>
              <li>AI output matches expected format</li>
            </ul>
          </div>
        </div>
      )}
    </div>
  );
};

export default AssessmentDebugPanel;
