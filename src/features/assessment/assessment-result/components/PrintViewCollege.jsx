/**
 * PrintViewCollege Component
 * Grade-level-specific print view for College students (Undergraduate and Graduate)
 * Requirements: 1.3, 2.3 - Comprehensive assessment with employability metrics
 */

import CoverPage from './CoverPage';
import { printStyles } from './shared/styles';
import { safeRender, safeJoin, getSafeStudentInfo, getScoreStyle, riasecDescriptions, defaultRiasecNames, defaultTraitNames } from './shared/utils';
import RiasecIcon from './shared/RiasecIcon';
import PrintStyles from './shared/PrintStyles';
import PrintPage from './shared/PrintPage';
import Watermarks, { DataPrivacyNotice, ReportDisclaimer } from './shared/Watermarks';
import DetailedAssessmentBreakdown from './shared/DetailedAssessmentBreakdown';
import {
  CompleteCareerFitSection,
  CompleteSkillGapSection,
  CompleteRoadmapSection,
  CompleteCourseRecommendationsSection,
  ProfileSnapshotSection,
  TimingAnalysisSection,
  FinalNoteSection
} from './shared/CompletePDFSections';

/**
 * Learning Styles Section
 * Displays student's preferred learning approaches
 */
const LearningStylesSection = ({ learningStyles }) => {
  if (!learningStyles || learningStyles.length === 0) return null;

  const styleDescriptions = {
    'Visual': 'You learn best through images, diagrams, and visual aids',
    'Auditory': 'You learn best through listening and verbal instruction',
    'Kinesthetic': 'You learn best through hands-on practice and movement',
    'Reading/Writing': 'You learn best through reading and taking notes',
    'Social': 'You learn best in group settings and through discussion',
    'Solitary': 'You learn best when studying alone and self-paced'
  };

  return (
    <div style={{ marginBottom: '30px', pageBreakInside: 'avoid' }}>
      <h3 style={printStyles.subTitle}>Your Learning Preferences</h3>
      <p style={{ fontSize: '10px', color: '#4b5563', marginBottom: '15px' }}>
        Understanding how you learn best can help you choose effective study strategies and learning environments.
      </p>
      
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '15px' }}>
        {learningStyles.map((style, index) => (
          <div 
            key={index}
            style={{
              padding: '12px',
              background: '#f8fafc',
              border: '1px solid #e2e8f0',
              borderRadius: '8px'
            }}
          >
            <div style={{ 
              fontSize: '11px', 
              fontWeight: 'bold', 
              color: '#1e293b',
              marginBottom: '4px'
            }}>
              {style}
            </div>
            <div style={{ fontSize: '9px', color: '#64748b', lineHeight: '1.4' }}>
              {styleDescriptions[style] || 'Preferred learning approach'}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

/**
 * Work Preferences Section
 * Displays ideal work environment characteristics
 */
const WorkPreferencesSection = ({ workPreferences }) => {
  if (!workPreferences || workPreferences.length === 0) return null;

  const preferenceIcons = {
    'Remote Work': '🏠',
    'Team Collaboration': '👥',
    'Independent Work': '🎯',
    'Flexible Hours': '⏰',
    'Structured Environment': '📋',
    'Creative Freedom': '🎨',
    'Fast-Paced': '⚡',
    'Stable & Predictable': '🔒'
  };

  return (
    <div style={{ marginBottom: '30px', pageBreakInside: 'avoid' }}>
      <h3 style={printStyles.subTitle}>Ideal Work Environment</h3>
      <p style={{ fontSize: '10px', color: '#4b5563', marginBottom: '15px' }}>
        These work environment characteristics align with your personality and preferences.
      </p>
      
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '10px' }}>
        {workPreferences.map((pref, index) => (
          <div 
            key={index}
            style={{
              padding: '8px 16px',
              background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
              color: 'white',
              borderRadius: '20px',
              fontSize: '10px',
              fontWeight: '600',
              display: 'inline-flex',
              alignItems: 'center',
              gap: '6px'
            }}
          >
            <span>{preferenceIcons[pref] || '✓'}</span>
            <span>{pref}</span>
          </div>
        ))}
      </div>
    </div>
  );
};


/**
 * PrintViewCollege Component
 * Renders comprehensive assessment report for college students
 * 
 * @param {Object} props - Component props
 * @param {Object} props.results - Assessment results data
 * @param {Object} props.studentInfo - Student information
 * @param {Object} props.riasecNames - RIASEC code to name mapping (optional)
 * @param {Object} props.traitNames - Big Five trait names mapping (optional)
 * @param {Array} props.courseRecommendations - Course/program recommendations (optional)
 * @param {Object} props.studentAcademicData - Student academic data (optional)
 * @returns {JSX.Element} - Print view component
 */
const PrintViewCollege = ({ results, studentInfo, riasecNames, traitNames, courseRecommendations, studentAcademicData }) => {
  // Debug: Log studentInfo to see what data is being passed
  console.log('PrintViewCollege - studentInfo received:', studentInfo);
  
  // Handle null results
  if (!results) {
    return (
      <div className="print-view">
        <div style={{ padding: '20px', textAlign: 'center' }}>
          <p>No results available for printing.</p>
        </div>
      </div>
    );
  }

  // 🔧 CRITICAL FIX: Normalize RIASEC scores before using them
  // The normalizer moves _originalScores to riasec level, not gemini_results level
  let normalizedResults = { ...results };
  if (results.riasec) {
    const scores = results.riasec.scores || {};
    const allZeros = Object.values(scores).every(score => score === 0);
    
    // Check for _originalScores at riasec level (after normalization)
    // OR at gemini_results level (before normalization)
    const originalScores = results.riasec._originalScores || 
                          results.gemini_results?.riasec?._originalScores || 
                          {};
    const hasOriginalScores = Object.keys(originalScores).length > 0 &&
      Object.values(originalScores).some(score => score > 0);
    
    if (allZeros && hasOriginalScores) {
      console.log('🔧 PDF PrintViewCollege: Normalizing RIASEC scores from _originalScores');
      console.log('   Original scores found at:', results.riasec._originalScores ? 'riasec._originalScores' : 'gemini_results.riasec._originalScores');
      normalizedResults = {
        ...results,
        riasec: {
          ...results.riasec,
          scores: originalScores,
          _originalScores: originalScores,
          maxScore: results.riasec.maxScore || 
                   results.gemini_results?.riasec?.maxScore || 
                   20
        }
      };
    }
  }

  // Extract data from normalized results
  const { riasec, aptitude, bigFive, workValues, knowledge, employability, careerFit, skillGap, roadmap, overallSummary } = normalizedResults;

  // Safe student info with defaults
  const safeStudentInfo = getSafeStudentInfo(studentInfo);
  
  // Debug: Log safeStudentInfo to see what getSafeStudentInfo returns
  console.log('PrintViewCollege - safeStudentInfo after getSafeStudentInfo:', safeStudentInfo);

  // Safe RIASEC names with defaults
  const safeRiasecNames = riasecNames || defaultRiasecNames;

  // Safe trait names with defaults
  const safeTraitNames = traitNames || defaultTraitNames;

  return (
    <div className="print-view" style={{ background: 'white', position: 'relative' }}>
      {/* Print-specific CSS styles */}
      <PrintStyles />

      {/* Cover Page */}
      <CoverPage studentInfo={safeStudentInfo} generatedAt={results.generatedAt} />

      {/* Watermarks */}
      <Watermarks />

      {/* Continuous content for print - flows naturally across pages */}
      <div className="print-pages">
        <DataPrivacyNotice />
        
        {/* Detailed Assessment Breakdown (All stages data) */}
        <DetailedAssessmentBreakdown 
          results={normalizedResults} 
          riasecNames={safeRiasecNames}
          gradeLevel="college"
        />

        {/* ✅ NEW: Learning Styles Section */}
        {results.learningStyles && results.learningStyles.length > 0 && (
          <LearningStylesSection learningStyles={results.learningStyles} />
        )}

        {/* ✅ NEW: Work Preferences Section */}
        {results.workPreferences && results.workPreferences.length > 0 && (
          <WorkPreferencesSection workPreferences={results.workPreferences} />
        )}

        {/* OLD SECTIONS COMMENTED OUT - Data now shown in Detailed Assessment Breakdown */}
        {/* Career Fit Analysis */}
        {/* {careerFit && (
          <CareerFitAnalysisSection careerFit={careerFit} />
        )} */}
        
        {/* Skill Gap & Development Plan */}
        {/* {skillGap && (
          <SkillGapDevelopmentSection skillGap={skillGap} />
        )} */}

        {/* ========== NEW COMPLETE DATA SECTIONS - COMMENTED OUT TO AVOID DUPLICATES ON PAGE 2 ========== */}
        {/* Profile Snapshot */}
        {/* <ProfileSnapshotSection profileSnapshot={results.profileSnapshot} /> */}
        
        {/* Complete Skill Gap - Additional details with resources */}
        {/* <CompleteSkillGapSection skillGap={results.skillGap} /> */}
        
        {/* Complete Course Recommendations */}
        {/* <CompleteCourseRecommendationsSection 
          skillGapCourses={results.skillGapCourses}
          platformCourses={results.platformCourses}
          coursesByType={results.coursesByType}
        /> */}
        
        {/* Complete Roadmap */}
        {/* <CompleteRoadmapSection roadmap={results.roadmap} /> */}
        
        {/* Timing Analysis */}
        {/* <TimingAnalysisSection timingAnalysis={results.timingAnalysis} /> */}
        
        {/* Final Note */}
        {/* <FinalNoteSection finalNote={results.finalNote} /> */}
        {/* ========== END OF NEW SECTIONS ========== */}

        {/* Career Roadmap */}
        {/* {roadmap && (
          <DetailedCareerRoadmapSection roadmap={roadmap} />
        )} */}
        
        {/* Course Recommendations - REMOVED for college students (only for After 12th) */}
        {/* College students are already in a degree program, they don't need degree recommendations */}
        {/* {courseRecommendations && courseRecommendations.length > 0 && (
          <CourseRecommendationsSection courseRecommendations={courseRecommendations} />
        )} */}

        {/* Final Recommendations */}
        {/* {overallSummary && (
          <FinalRecommendationsSection overallSummary={overallSummary} />
        )} */}
        
        {/* ========== DUPLICATE SECTIONS COMMENTED OUT - Already shown above ========== */}
        {/* <ProfileSnapshotSection profileSnapshot={results.profileSnapshot} />
        <CompleteCourseRecommendationsSection 
          skillGapCourses={results.skillGapCourses}
          platformCourses={results.platformCourses}
          coursesByType={results.coursesByType}
        />
        <CompleteRoadmapSection roadmap={results.roadmap} />
        <TimingAnalysisSection timingAnalysis={results.timingAnalysis} />
        <FinalNoteSection finalNote={results.finalNote} /> */}
        {/* ========== END OF DUPLICATE SECTIONS ========== */}
        
        <ReportDisclaimer />
      </div>

      {/* Screen-only continuous content (hidden in print) */}
      <div className="print-content" style={{ position: 'relative', zIndex: 1, paddingBottom: '70px' }}>
        <DataPrivacyNotice />
        {/* Show Detailed Assessment Breakdown for screen view */}
        <DetailedAssessmentBreakdown 
          results={results} 
          riasecNames={safeRiasecNames}
          gradeLevel="college"
        />

        {/* ✅ NEW: Learning Styles Section */}
        {results.learningStyles && results.learningStyles.length > 0 && (
          <LearningStylesSection learningStyles={results.learningStyles} />
        )}

        {/* ✅ NEW: Work Preferences Section */}
        {results.workPreferences && results.workPreferences.length > 0 && (
          <WorkPreferencesSection workPreferences={results.workPreferences} />
        )}

        {/* OLD SECTIONS COMMENTED OUT - Data now shown in Detailed Assessment Breakdown */}
        {/* <h2 style={printStyles.sectionTitle}>1. Student Profile Snapshot</h2>
        <InterestProfileSection riasec={riasec} safeRiasecNames={safeRiasecNames} />
        {aptitude && (
          <CognitiveAbilitiesSection aptitude={aptitude} />
        )}
        {bigFive && (
          <BigFivePersonalitySection bigFive={bigFive} safeTraitNames={safeTraitNames} />
        )}
        {workValues && (
          <WorkValuesSection workValues={workValues} />
        )}
        {knowledge && (
          <KnowledgeAssessmentSection knowledge={knowledge} />
        )}
        {employability && (
          <EmployabilityScoreSection employability={employability} />
        )} */}
        {/* {careerFit && (
          <CareerFitAnalysisSection careerFit={careerFit} />
        )}
        {skillGap && (
          <SkillGapDevelopmentSection skillGap={skillGap} />
        )}
        {roadmap && (
          <DetailedCareerRoadmapSection roadmap={roadmap} />
        )} */}
        {/* Course Recommendations - REMOVED for college students (only for After 12th) */}
        {/* {courseRecommendations && courseRecommendations.length > 0 && (
          <CourseRecommendationsSection courseRecommendations={courseRecommendations} />
        )} */}
        {/* {overallSummary && (
          <FinalRecommendationsSection overallSummary={overallSummary} />
        )} */}
        
        {/* ========== DUPLICATE SECTIONS COMMENTED OUT - Already shown above ========== */}
        {/* <ProfileSnapshotSection profileSnapshot={results.profileSnapshot} />
        <CompleteCourseRecommendationsSection 
          skillGapCourses={results.skillGapCourses}
          platformCourses={results.platformCourses}
          coursesByType={results.coursesByType}
        />
        <CompleteRoadmapSection roadmap={results.roadmap} />
        <TimingAnalysisSection timingAnalysis={results.timingAnalysis} />
        <FinalNoteSection finalNote={results.finalNote} /> */}
        {/* ========== END OF DUPLICATE SECTIONS ========== */}
        
        <ReportDisclaimer />
      </div>
    </div>
  );
};

/**
 * InterestProfileSection Component
 * Renders RIASEC scores with infographic layout matching the design
 * Requirements: 1.3, 2.4 - Comprehensive RIASEC interest profile
 */
const InterestProfileSection = ({ riasec, safeRiasecNames }) => {
  if (!riasec || !riasec.scores) return null;

  // 🔧 CRITICAL FIX: Use _originalScores if riasec.scores are all zeros
  let scores = riasec.scores || {};
  const allZeros = Object.values(scores).every(score => score === 0);
  if (allZeros && riasec._originalScores && Object.keys(riasec._originalScores).length > 0) {
    console.log('🔧 PDF InterestProfile (College): Using _originalScores instead of zeros');
    scores = riasec._originalScores;
  }

  const maxScore = riasec.maxScore || 20;
  const codes = ['R', 'I', 'A', 'S', 'E', 'C'];
  
  // Get top three interests
  const topThree = riasec.topThree || codes
    .map(code => ({ code, score: scores[code] || 0 }))
    .sort((a, b) => b.score - a.score)
    .slice(0, 3)
    .map(item => item.code);

  const topInterestsText = topThree.map(code => safeRiasecNames[code]).join(', ');
  const hasStrongInterests = topThree.some(code => (scores[code] || 0) >= maxScore * 0.5);

  return (
    <div>
      <h3 style={printStyles.subTitle}>Interest Explorer Results</h3>

      {/* RIASEC Infographic Layout with Central Circle */}
      <div style={{
        position: 'relative',
        padding: '20px 0',
        marginTop: '10px',
        marginBottom: '8px',
        minHeight: '320px'
      }}>
        {/* SVG for connecting lines */}
        <svg style={{
          position: 'absolute',
          top: 0,
          left: 0,
          width: '100%',
          height: '100%',
          pointerEvents: 'none',
          zIndex: 0
        }}>
          {/* Dotted lines from red dots to central RIASEC circle */}
          {topThree.map((code, idx) => {
            const positions = [
              { x1: '14%', y1: '60%', x2: '50%', y2: '78%' },
              { x1: '50%', y1: '30%', x2: '50%', y2: '78%' },
              { x1: '86%', y1: '60%', x2: '50%', y2: '78%' }
            ];
            const pos = positions[idx];
            return (
              <line
                key={code}
                x1={pos.x1}
                y1={pos.y1}
                x2={pos.x2}
                y2={pos.y2}
                stroke="#000000"
                strokeWidth="1"
                strokeDasharray="2,4"
                strokeLinecap="round"
              />
            );
          })}
          {/* Vertical lines from red dots to diagonal start for cards 1 and 3 */}
          <line x1="14%" y1="30%" x2="14%" y2="60%" stroke="#000000" strokeWidth="1" strokeDasharray="2,4" strokeLinecap="round" />
          <line x1="86%" y1="30%" x2="86%" y2="60%" stroke="#000000" strokeWidth="1" strokeDasharray="2,4" strokeLinecap="round" />
        </svg>

        {/* Top 3 Interest Cards */}
        <div style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'flex-start',
          position: 'relative',
          zIndex: 1
        }}>
          {topThree.map((code, idx) => {
            const score = scores[code] || 0;
            
            return (
              <div key={code} style={{ width: '28%', textAlign: 'center' }}>
                <div style={{ fontWeight: 'bold', fontSize: '11px', color: '#1e293b', marginBottom: '4px' }}>
                  {safeRiasecNames[code]} ({code})
                </div>
                <p style={{ fontSize: '8px', color: '#4b5563', margin: '0 0 8px 0', lineHeight: '1.3' }}>
                  {riasecDescriptions[code]}
                </p>
                <div style={{
                  display: 'inline-block',
                  padding: '4px 12px',
                  background: '#e0f2fe',
                  borderRadius: '12px',
                  fontSize: '9px',
                  fontWeight: '600',
                  color: '#0369a1',
                  marginBottom: '8px'
                }}>
                  {score}/{maxScore}
                </div>
                <div style={{ display: 'flex', justifyContent: 'center', position: 'relative' }}>
                  <div style={{
                    width: '70px',
                    height: '70px',
                    borderRadius: '50%',
                    border: '2px solid #1e3a5f',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    background: 'white'
                  }}>
                    <RiasecIcon code={code} size={42} />
                  </div>
                  <div style={{
                    position: 'absolute',
                    bottom: '-5px',
                    left: '50%',
                    transform: 'translateX(-50%)',
                    width: '8px',
                    height: '8px',
                    borderRadius: '50%',
                    background: '#ef4444'
                  }}></div>
                </div>
              </div>
            );
          })}
        </div>

        {/* Central RIASEC Circle */}
        <div style={{
          position: 'absolute',
          bottom: '10px',
          left: '50%',
          transform: 'translateX(-50%)',
          textAlign: 'center',
          zIndex: 1
        }}>
          <div style={{
            width: '100px',
            height: '100px',
            borderRadius: '50%',
            border: '3px dashed #1e3a5f',
            background: 'white',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            boxShadow: '0 2px 8px rgba(0,0,0,0.1)'
          }}>
            <div style={{ fontSize: '14px', fontWeight: 'bold', color: '#000000', marginBottom: '2px' }}>
              RIASEC
            </div>
            <div style={{ fontSize: '9px', color: '#000000' }}>
              Interest
            </div>
            <div style={{ fontSize: '9px', color: '#000000' }}>
              Profile
            </div>
          </div>
        </div>
      </div>

      {/* Bottom Summary Text */}
      <div style={{ 
        fontSize: '9px', 
        color: '#6b7280', 
        fontStyle: 'italic', 
        lineHeight: '1.5',
        marginTop: '10px',
        textAlign: 'left'
      }}>
        <strong>Your Top Interests:</strong> {topInterestsText}. {hasStrongInterests 
          ? 'These interests indicate your natural preferences and can guide your career exploration.' 
          : 'The student has not expressed any strong interests in any of the RIASEC categories, indicating a need for exploration in various fields.'}
      </div>
    </div>
  );
};

/**
 * CognitiveAbilitiesSection Component
 * Renders detailed aptitude test results with topStrengths badges
 * Requirements: 1.3, 2.3 - Comprehensive cognitive abilities assessment
 */
const CognitiveAbilitiesSection = ({ aptitude }) => {
  if (!aptitude || !aptitude.scores) return null;

  return (
    <>
      <h2 style={{ ...printStyles.sectionTitle, marginTop: '30px' }}>2. Cognitive Abilities</h2>
      
      {/* Top Strengths Badges */}
      {aptitude.topStrengths && aptitude.topStrengths.length > 0 && (
        <div style={{ marginBottom: '15px' }}>
          <h3 style={printStyles.subTitle}>Your Cognitive Strengths</h3>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
            {aptitude.topStrengths.map((strength, idx) => (
              <span
                key={idx}
                style={{
                  ...printStyles.badge,
                  background: '#dcfce7',
                  color: '#166534',
                  border: '1px solid #86efac',
                  fontSize: '10px',
                  padding: '5px 12px'
                }}
              >
                ★ {safeRender(strength)}
              </span>
            ))}
          </div>
        </div>
      )}

      {/* Detailed Aptitude Test Results */}
      <h3 style={printStyles.subTitle}>Detailed Aptitude Test Results</h3>
      <table style={printStyles.table}>
        <thead>
          <tr>
            <th style={printStyles.th}>Cognitive Ability</th>
            <th style={{ ...printStyles.th, width: '100px', textAlign: 'center' }}>Score</th>
            <th style={{ ...printStyles.th, width: '140px' }}>Performance Level</th>
          </tr>
        </thead>
        <tbody>
          {Object.entries(aptitude.scores).map(([ability, scoreData]) => {
            const correct = scoreData.correct || 0;
            const total = scoreData.total || 0;
            const percentage = scoreData.percentage || (total > 0 ? Math.round((correct / total) * 100) : 0);
            const scoreStyle = getScoreStyle(percentage);
            const isTopStrength = aptitude.topStrengths?.includes(ability);

            return (
              <tr key={ability} style={isTopStrength ? { background: '#f0fdf4' } : {}}>
                <td style={printStyles.td}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <span style={{ fontWeight: '600', fontSize: '10px' }}>
                      {ability}
                    </span>
                    {isTopStrength && (
                      <span style={{ color: '#16a34a', fontSize: '10px' }}>★</span>
                    )}
                  </div>
                </td>
                <td style={{ ...printStyles.td, textAlign: 'center', fontWeight: '600' }}>
                  {correct}/{total}
                </td>
                <td style={printStyles.td}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <div style={{ flex: 1 }}>
                      <div style={printStyles.progressBar}>
                        <div style={{
                          width: `${percentage}%`,
                          height: '100%',
                          background: percentage >= 70 ? '#22c55e' : percentage >= 40 ? '#eab308' : '#ef4444'
                        }}></div>
                      </div>
                    </div>
                    <span style={{
                      ...printStyles.badge,
                      background: scoreStyle.bg,
                      color: scoreStyle.color,
                      border: `1px solid ${scoreStyle.border}`
                    }}>
                      {percentage}%
                    </span>
                  </div>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>

      {/* Performance Interpretation */}
      <div style={{ ...printStyles.summaryBox, marginTop: '10px' }}>
        <h4 style={{ margin: '0 0 6px 0', fontSize: '9px', fontWeight: 'bold', color: '#0369a1' }}>
          Understanding Your Results
        </h4>
        <p style={{ margin: '0', fontSize: '8px', lineHeight: '1.5', color: '#475569' }}>
          <strong>High (70%+):</strong> Strong aptitude in this area. 
          <strong style={{ marginLeft: '10px' }}>Medium (40-69%):</strong> Moderate aptitude with room for development. 
          <strong style={{ marginLeft: '10px' }}>Low (&lt;40%):</strong> Area for focused improvement.
        </p>
      </div>
    </>
  );
};

/**
 * BigFivePersonalitySection Component
 * Renders Big Five personality traits with detailed analysis
 * Requirements: 1.3 - Big Five personality assessment for college students
 */
const BigFivePersonalitySection = ({ bigFive, safeTraitNames }) => {
  if (!bigFive) return null;

  const traits = ['O', 'C', 'E', 'A', 'N'];
  const traitDescriptions = {
    O: 'Openness to Experience - Curiosity, creativity, and willingness to try new things',
    C: 'Conscientiousness - Organization, responsibility, and goal-directed behavior',
    E: 'Extraversion - Sociability, assertiveness, and energy in social situations',
    A: 'Agreeableness - Compassion, cooperation, and trust in others',
    N: 'Neuroticism - Emotional stability and tendency to experience negative emotions'
  };

  return (
    <>
      <h2 style={{ ...printStyles.sectionTitle, marginTop: '30px' }}>3. Big Five Personality Traits</h2>
      <p style={{ fontSize: '9px', color: '#6b7280', marginBottom: '12px', lineHeight: '1.5' }}>
        The Big Five model measures five broad dimensions of personality that influence how you interact with the world, 
        approach work, and relate to others.
      </p>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: '10px', marginTop: '10px' }}>
        {traits.map((trait) => {
          const score = bigFive[trait] || 0;
          const percentage = Math.round(score);
          const scoreStyle = getScoreStyle(percentage);

          return (
            <div key={trait} style={{ textAlign: 'center' }}>
              {/* Circular Progress Indicator */}
              <div style={{
                width: '70px',
                height: '70px',
                borderRadius: '50%',
                border: `5px solid ${scoreStyle.border}`,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                margin: '0 auto 8px',
                background: scoreStyle.bg,
                position: 'relative'
              }}>
                <span style={{ fontSize: '16px', fontWeight: 'bold', color: scoreStyle.color }}>
                  {percentage}%
                </span>
              </div>
              <div style={{ fontWeight: 'bold', fontSize: '10px', color: '#1e293b', marginBottom: '2px' }}>
                {safeTraitNames[trait] || trait}
              </div>
              <div style={{ fontSize: '7px', color: '#6b7280', lineHeight: '1.2' }}>
                {traitDescriptions[trait]}
              </div>
            </div>
          );
        })}
      </div>

      {/* Work Style Summary */}
      {bigFive.workStyleSummary && (
        <div style={{ ...printStyles.summaryBox, marginTop: '15px' }}>
          <h4 style={{ margin: '0 0 8px 0', fontSize: '10px', fontWeight: 'bold', color: '#0369a1' }}>
            Your Work Style Profile
          </h4>
          <p style={{ margin: '0', fontSize: '9px', lineHeight: '1.6', color: '#475569' }}>
            {bigFive.workStyleSummary}
          </p>
        </div>
      )}
    </>
  );
};

/**
 * WorkValuesSection Component
 * Renders work values and motivations
 * Requirements: 1.3 - Work values assessment for college students
 */
const WorkValuesSection = ({ workValues }) => {
  if (!workValues || !workValues.topThree || workValues.topThree.length === 0) return null;

  return (
    <>
      <h2 style={{ ...printStyles.sectionTitle, marginTop: '30px' }}>4. Work Values & Motivations</h2>
      <p style={{ fontSize: '9px', color: '#6b7280', marginBottom: '12px', lineHeight: '1.5' }}>
        Understanding what motivates you at work helps identify careers and work environments where you'll thrive.
      </p>

      <h3 style={printStyles.subTitle}>Your Top Work Values</h3>
      <div style={{ marginTop: '10px' }}>
        {workValues.topThree.map((item, idx) => {
          const value = safeRender(item.value || item);
          const score = item.score || 0;
          const description = item.description || '';
          const priorityLabels = ['Highest Priority', 'High Priority', 'Important'];
          const priorityColors = [
            { bg: '#dcfce7', color: '#166534', border: '#86efac' },
            { bg: '#fef9c3', color: '#854d0e', border: '#fde047' },
            { bg: '#dbeafe', color: '#1e40af', border: '#93c5fd' }
          ];
          const colors = priorityColors[idx] || priorityColors[2];

          return (
            <div key={idx} style={{ ...printStyles.card, marginBottom: '10px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '6px' }}>
                <div style={{ flex: 1 }}>
                  <div style={{ fontWeight: 'bold', fontSize: '11px', color: '#1e293b', marginBottom: '4px' }}>
                    {idx + 1}. {value}
                  </div>
                  {description && (
                    <p style={{ fontSize: '9px', color: '#4b5563', margin: '0 0 4px 0', lineHeight: '1.4' }}>
                      {description}
                    </p>
                  )}
                  {score > 0 && (
                    <div style={{ fontSize: '9px', color: '#6b7280' }}>
                      Importance Score: {score}
                    </div>
                  )}
                </div>
                <span style={{
                  ...printStyles.badge,
                  background: colors.bg,
                  color: colors.color,
                  border: `1px solid ${colors.border}`,
                  marginLeft: '10px'
                }}>
                  {priorityLabels[idx]}
                </span>
              </div>
            </div>
          );
        })}
      </div>
    </>
  );
};

/**
 * KnowledgeAssessmentSection Component
 * Renders knowledge domain scores
 * Requirements: 1.3, 2.3 - Knowledge assessment for college students
 */
const KnowledgeAssessmentSection = ({ knowledge }) => {
  if (!knowledge || Object.keys(knowledge).length === 0) return null;

  // Sort knowledge domains by score (descending)
  const sortedDomains = Object.entries(knowledge)
    .sort(([, scoreA], [, scoreB]) => scoreB - scoreA);

  return (
    <>
      <h2 style={{ ...printStyles.sectionTitle, marginTop: '30px' }}>5. Knowledge Assessment</h2>
      <p style={{ fontSize: '9px', color: '#6b7280', marginBottom: '12px', lineHeight: '1.5' }}>
        This assessment measures your knowledge across various academic and professional domains, 
        helping identify areas of expertise and opportunities for growth.
      </p>

      <table style={printStyles.table}>
        <thead>
          <tr>
            <th style={printStyles.th}>Knowledge Domain</th>
            <th style={{ ...printStyles.th, width: '140px' }}>Proficiency Level</th>
          </tr>
        </thead>
        <tbody>
          {sortedDomains.map(([domain, score]) => {
            const percentage = Math.round(score);
            const scoreStyle = getScoreStyle(percentage);

            return (
              <tr key={domain}>
                <td style={printStyles.td}>
                  <span style={{ fontWeight: '600', fontSize: '10px' }}>
                    {domain}
                  </span>
                </td>
                <td style={printStyles.td}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <div style={{ flex: 1 }}>
                      <div style={printStyles.progressBar}>
                        <div style={{
                          width: `${percentage}%`,
                          height: '100%',
                          background: percentage >= 70 ? '#22c55e' : percentage >= 40 ? '#eab308' : '#ef4444'
                        }}></div>
                      </div>
                    </div>
                    <span style={{
                      ...printStyles.badge,
                      background: scoreStyle.bg,
                      color: scoreStyle.color,
                      border: `1px solid ${scoreStyle.border}`
                    }}>
                      {percentage}%
                    </span>
                  </div>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>

      {/* Knowledge Strengths Summary */}
      {sortedDomains.length > 0 && (
        <div style={{ ...printStyles.summaryBox, marginTop: '10px' }}>
          <h4 style={{ margin: '0 0 6px 0', fontSize: '9px', fontWeight: 'bold', color: '#0369a1' }}>
            Your Knowledge Strengths
          </h4>
          <p style={{ margin: '0', fontSize: '8px', lineHeight: '1.5', color: '#475569' }}>
            Your strongest knowledge areas are: {sortedDomains.slice(0, 3).map(([domain]) => domain).join(', ')}. 
            These domains represent areas where you have demonstrated strong understanding and can leverage in your career.
          </p>
        </div>
      )}
    </>
  );
};

/**
 * EmployabilityScoreSection Component
 * Renders employability score and breakdown
 * Requirements: 1.3, 2.3 - Employability metrics for college students
 */
const EmployabilityScoreSection = ({ employability }) => {
  if (!employability || typeof employability.score === 'undefined') return null;

  const overallScore = Math.round(employability.score);
  const overallScoreStyle = getScoreStyle(overallScore);

  return (
    <>
      <h2 style={{ ...printStyles.sectionTitle, marginTop: '30px' }}>6. Employability Score</h2>
      <p style={{ fontSize: '9px', color: '#6b7280', marginBottom: '12px', lineHeight: '1.5' }}>
        Your employability score reflects your readiness for the job market based on skills, knowledge, 
        personality traits, and career alignment.
      </p>

      {/* Overall Employability Score */}
      <div style={{
        ...printStyles.card,
        background: overallScoreStyle.bg,
        border: `2px solid ${overallScoreStyle.border}`,
        textAlign: 'center',
        padding: '20px',
        marginBottom: '15px'
      }}>
        <div style={{ fontSize: '11px', fontWeight: 'bold', color: overallScoreStyle.color, marginBottom: '8px' }}>
          Overall Employability Score
        </div>
        <div style={{ fontSize: '36px', fontWeight: 'bold', color: overallScoreStyle.color, marginBottom: '4px' }}>
          {overallScore}%
        </div>
        <div style={{ fontSize: '9px', color: overallScoreStyle.color }}>
          {overallScore >= 70 ? 'Strong Job Market Readiness' : 
           overallScore >= 40 ? 'Moderate Job Market Readiness' : 
           'Developing Job Market Readiness'}
        </div>
      </div>

      {/* Employability Breakdown */}
      {employability.breakdown && Object.keys(employability.breakdown).length > 0 && (
        <div>
          <h3 style={printStyles.subTitle}>Score Breakdown by Component</h3>
          <table style={printStyles.table}>
            <thead>
              <tr>
                <th style={printStyles.th}>Component</th>
                <th style={{ ...printStyles.th, width: '140px' }}>Score</th>
              </tr>
            </thead>
            <tbody>
              {Object.entries(employability.breakdown).map(([component, score]) => {
                const percentage = Math.round(score);
                const scoreStyle = getScoreStyle(percentage);

                return (
                  <tr key={component}>
                    <td style={printStyles.td}>
                      <span style={{ fontWeight: '600', fontSize: '10px' }}>
                        {component}
                      </span>
                    </td>
                    <td style={printStyles.td}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <div style={{ flex: 1 }}>
                          <div style={printStyles.progressBar}>
                            <div style={{
                              width: `${percentage}%`,
                              height: '100%',
                              background: percentage >= 70 ? '#22c55e' : percentage >= 40 ? '#eab308' : '#ef4444'
                            }}></div>
                          </div>
                        </div>
                        <span style={{
                          ...printStyles.badge,
                          background: scoreStyle.bg,
                          color: scoreStyle.color,
                          border: `1px solid ${scoreStyle.border}`
                        }}>
                          {percentage}%
                        </span>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      {/* Employability Insights */}
      <div style={{ ...printStyles.summaryBox, marginTop: '10px' }}>
        <h4 style={{ margin: '0 0 6px 0', fontSize: '9px', fontWeight: 'bold', color: '#0369a1' }}>
          What This Means
        </h4>
        <p style={{ margin: '0', fontSize: '8px', lineHeight: '1.5', color: '#475569' }}>
          Your employability score is calculated based on multiple factors including cognitive abilities, 
          personality traits, work values alignment, knowledge domains, and career fit. 
          Focus on the lower-scoring components in the breakdown to improve your overall employability.
        </p>
      </div>
    </>
  );
};

/**
 * CareerFitAnalysisSection Component
 * Renders detailed career recommendations with fit scores
 * Requirements: 1.3 - Career fit analysis for college students
 */
const CareerFitAnalysisSection = ({ careerFit }) => {
  if (!careerFit || !careerFit.topCareers || careerFit.topCareers.length === 0) return null;

  // Debug: Log careerFit data to see if tracks/roles/salary data exists
  console.log('CareerFitAnalysisSection - careerFit data:', careerFit);
  console.log('CareerFitAnalysisSection - checking for tracks:', careerFit.tracks || careerFit.careerTracks || careerFit.topTracks);

  // Extract career tracks if they exist
  const careerTracks = careerFit.tracks || careerFit.careerTracks || careerFit.topTracks || [];

  return (
    <>
      <h2 style={{ ...printStyles.sectionTitle, marginTop: '30px' }}>2. Career Fit Analysis</h2>
      <p style={{ fontSize: '9px', color: '#6b7280', marginBottom: '12px', lineHeight: '1.5' }}>
        Based on your interests, abilities, personality, and values, these careers offer the best alignment 
        with your profile. The fit score indicates how well each career matches your overall assessment results.
      </p>

      {/* Career Tracks with Roles & Salary (if available) */}
      {careerTracks.length > 0 && (
        <div style={{ marginBottom: '20px' }}>
          <h3 style={printStyles.subTitle}>Top Career Tracks for You</h3>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '12px', marginTop: '10px' }}>
            {careerTracks.slice(0, 3).map((track, idx) => {
              const trackNumber = idx + 1;
              const trackName = track.name || track.trackName || `Track ${trackNumber}`;
              const matchScore = track.matchScore || track.fitScore || 0;
              const roles = track.roles || track.topRoles || [];
              const scoreStyle = getScoreStyle(matchScore);

              return (
                <div key={idx} style={{
                  ...printStyles.card,
                  background: 'linear-gradient(135deg, #1e3a8a 0%, #3b82f6 100%)',
                  color: 'white',
                  padding: '12px',
                  borderRadius: '8px',
                  position: 'relative'
                }}>
                  {/* Track Badge */}
                  <div style={{
                    position: 'absolute',
                    top: '8px',
                    left: '8px',
                    background: 'rgba(255, 255, 255, 0.2)',
                    padding: '3px 8px',
                    borderRadius: '4px',
                    fontSize: '7px',
                    fontWeight: 'bold'
                  }}>
                    TRACK {trackNumber}
                  </div>

                  {/* Match Score Circle */}
                  <div style={{
                    position: 'absolute',
                    top: '8px',
                    right: '8px',
                    width: '45px',
                    height: '45px',
                    borderRadius: '50%',
                    border: '3px solid rgba(255, 255, 255, 0.3)',
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    justifyContent: 'center',
                    background: 'rgba(255, 255, 255, 0.1)'
                  }}>
                    <div style={{ fontSize: '14px', fontWeight: 'bold' }}>{matchScore}%</div>
                    <div style={{ fontSize: '6px' }}>Match</div>
                  </div>

                  {/* Track Name */}
                  <div style={{
                    marginTop: '50px',
                    fontSize: '11px',
                    fontWeight: 'bold',
                    marginBottom: '10px',
                    lineHeight: '1.3'
                  }}>
                    {trackName}
                  </div>

                  {/* Top Roles & Salary */}
                  {roles.length > 0 && (
                    <div>
                      <div style={{
                        fontSize: '7px',
                        fontWeight: 'bold',
                        marginBottom: '6px',
                        opacity: 0.9
                      }}>
                        TOP ROLES & SALARY
                      </div>
                      {roles.slice(0, 3).map((role, roleIdx) => (
                        <div key={roleIdx} style={{
                          fontSize: '8px',
                          marginBottom: '4px',
                          display: 'flex',
                          justifyContent: 'space-between',
                          alignItems: 'center',
                          opacity: 0.95
                        }}>
                          <span>{role.title || role.name || role}</span>
                          {role.salary && (
                            <span style={{
                              fontSize: '7px',
                              color: '#86efac',
                              fontWeight: 'bold',
                              marginLeft: '4px'
                            }}>
                              {role.salary}
                            </span>
                          )}
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Career Clusters (if available) */}
      {careerFit.clusters && careerFit.clusters.length > 0 && (
        <div style={{ marginBottom: '15px' }}>
          <h3 style={printStyles.subTitle}>Recommended Career Clusters</h3>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
            {careerFit.clusters.map((cluster, idx) => (
              <span
                key={idx}
                style={{
                  ...printStyles.badge,
                  background: '#dbeafe',
                  color: '#1e40af',
                  border: '1px solid #93c5fd',
                  fontSize: '9px',
                  padding: '4px 10px'
                }}
              >
                {safeRender(cluster)}
              </span>
            ))}
          </div>
        </div>
      )}

      {/* Top Career Recommendations */}
      <h3 style={printStyles.subTitle}>Your Top Career Matches</h3>
      <div style={{ marginTop: '10px' }}>
        {careerFit.topCareers.slice(0, 8).map((career, idx) => {
          const name = safeRender(career.name || career);
          const fitScore = career.fitScore || 0;
          const description = career.description || '';
          const requirements = career.requirements || '';
          const outlook = career.outlook || '';
          const scoreStyle = getScoreStyle(fitScore);

          return (
            <div key={idx} style={{ ...printStyles.card, marginBottom: '12px' }}>
              {/* Career Header */}
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '8px' }}>
                <div style={{ flex: 1 }}>
                  <div style={{ fontWeight: 'bold', fontSize: '11px', color: '#1e293b', marginBottom: '2px' }}>
                    {idx + 1}. {name}
                  </div>
                </div>
                {fitScore > 0 && (
                  <div style={{ marginLeft: '10px', textAlign: 'right' }}>
                    <span style={{
                      ...printStyles.badge,
                      background: scoreStyle.bg,
                      color: scoreStyle.color,
                      border: `1px solid ${scoreStyle.border}`,
                      fontSize: '10px',
                      padding: '4px 10px'
                    }}>
                      {fitScore}% Match
                    </span>
                  </div>
                )}
              </div>

              {/* Career Description */}
              {description && (
                <p style={{ fontSize: '9px', color: '#4b5563', margin: '0 0 8px 0', lineHeight: '1.5' }}>
                  {description}
                </p>
              )}

              {/* Career Details Grid */}
              {(requirements || outlook) && (
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px', marginTop: '8px' }}>
                  {requirements && (
                    <div>
                      <div style={{ fontSize: '8px', fontWeight: '600', color: '#374151', marginBottom: '3px' }}>
                        Typical Requirements:
                      </div>
                      <div style={{ fontSize: '8px', color: '#6b7280', lineHeight: '1.4' }}>
                        {requirements}
                      </div>
                    </div>
                  )}
                  {outlook && (
                    <div>
                      <div style={{ fontSize: '8px', fontWeight: '600', color: '#374151', marginBottom: '3px' }}>
                        Career Outlook:
                      </div>
                      <div style={{ fontSize: '8px', color: '#6b7280', lineHeight: '1.4' }}>
                        {outlook}
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Career Fit Insights */}
      <div style={{ ...printStyles.summaryBox, marginTop: '10px' }}>
        <h4 style={{ margin: '0 0 6px 0', fontSize: '9px', fontWeight: 'bold', color: '#0369a1' }}>
          Understanding Career Fit Scores
        </h4>
        <p style={{ margin: '0', fontSize: '8px', lineHeight: '1.5', color: '#475569' }}>
          Career fit scores are calculated by analyzing how well each career aligns with your RIASEC interests, 
          cognitive abilities, personality traits, work values, and knowledge domains. 
          Higher scores indicate stronger alignment with your overall profile.
        </p>
      </div>
    </>
  );
};

/**
 * SkillGapDevelopmentSection Component
 * Renders comprehensive skill gap analysis
 * Requirements: 1.3 - Skill gap analysis for college students
 */
const SkillGapDevelopmentSection = ({ skillGap }) => {
  if (!skillGap) return null;

  // Debug: Log skillGap data to verify it's correct
  console.log('SkillGapDevelopmentSection - skillGap data:', skillGap);

  return (
    <>
      <h2 style={{ ...printStyles.sectionTitle, marginTop: '30px' }}>3. Skill Gap & Development Plan</h2>
      <p style={{ fontSize: '9px', color: '#6b7280', marginBottom: '12px', lineHeight: '1.5' }}>
        This analysis compares your current skills with those required for your target careers, 
        helping you prioritize your professional development efforts.
      </p>

      {/* Current Skills */}
      {skillGap.currentSkills && skillGap.currentSkills.length > 0 && (
        <div style={{ marginBottom: '15px' }}>
          <h3 style={printStyles.subTitle}>Your Current Skills</h3>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
            {skillGap.currentSkills.map((skill, idx) => (
              <span
                key={idx}
                style={{
                  ...printStyles.badge,
                  background: '#dcfce7',
                  color: '#166534',
                  border: '1px solid #86efac',
                  fontSize: '9px',
                  padding: '4px 10px'
                }}
              >
                ✓ {safeRender(skill)}
              </span>
            ))}
          </div>
        </div>
      )}

      {/* Required Skills */}
      {skillGap.requiredSkills && skillGap.requiredSkills.length > 0 && (
        <div style={{ marginBottom: '15px' }}>
          <h3 style={printStyles.subTitle}>Skills Needed for Your Career Goals</h3>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
            {skillGap.requiredSkills.map((skill, idx) => (
              <span
                key={idx}
                style={{
                  ...printStyles.badge,
                  background: '#dbeafe',
                  color: '#1e40af',
                  border: '1px solid #93c5fd',
                  fontSize: '9px',
                  padding: '4px 10px'
                }}
              >
                {safeRender(skill)}
              </span>
            ))}
          </div>
        </div>
      )}

      {/* Priority Skill Gaps */}
      {skillGap.gaps && skillGap.gaps.length > 0 && (
        <div>
          <h3 style={printStyles.subTitle}>Priority Skills to Develop</h3>
          <table style={printStyles.table}>
            <thead>
              <tr>
                <th style={printStyles.th}>Skill</th>
                <th style={{ ...printStyles.th, width: '100px' }}>Priority</th>
                <th style={{ ...printStyles.th, width: '150px' }}>Recommended Action</th>
              </tr>
            </thead>
            <tbody>
              {skillGap.gaps.map((gap, idx) => {
                const skill = safeRender(gap.skill || gap);
                const priority = gap.priority || 'Medium';
                const action = gap.action || gap.recommendation || '';
                const priorityColors = {
                  High: { bg: '#fee2e2', color: '#991b1b', border: '#fca5a5' },
                  Medium: { bg: '#fef9c3', color: '#854d0e', border: '#fde047' },
                  Low: { bg: '#dcfce7', color: '#166534', border: '#86efac' }
                };
                const colors = priorityColors[priority] || priorityColors.Medium;

                return (
                  <tr key={idx}>
                    <td style={printStyles.td}>
                      <span style={{ fontWeight: '600', fontSize: '10px' }}>
                        {skill}
                      </span>
                    </td>
                    <td style={printStyles.td}>
                      <span style={{
                        ...printStyles.badge,
                        background: colors.bg,
                        color: colors.color,
                        border: `1px solid ${colors.border}`
                      }}>
                        {priority}
                      </span>
                    </td>
                    <td style={printStyles.td}>
                      <span style={{ fontSize: '9px', color: '#4b5563' }}>
                        {action || 'Focus on building this skill'}
                      </span>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      {/* Development Strategy */}
      <div style={{ ...printStyles.summaryBox, marginTop: '15px' }}>
        <h4 style={{ margin: '0 0 8px 0', fontSize: '10px', fontWeight: 'bold', color: '#0369a1' }}>
          Development Strategy
        </h4>
        <div style={{ fontSize: '9px', lineHeight: '1.6', color: '#475569' }}>
          <p style={{ margin: '0 0 8px 0' }}>
            <strong>High Priority Skills:</strong> Focus on these immediately through courses, certifications, or hands-on projects. 
            These skills are critical for your target careers.
          </p>
          <p style={{ margin: '0 0 8px 0' }}>
            <strong>Medium Priority Skills:</strong> Develop these over the next 6-12 months through structured learning 
            and practical application.
          </p>
          <p style={{ margin: '0' }}>
            <strong>Low Priority Skills:</strong> Consider these for long-term development or as opportunities arise 
            in your career journey.
          </p>
        </div>
      </div>
    </>
  );
};

/**
 * DetailedCareerRoadmapSection Component
 * Renders roadmap phases with timeline
 * Requirements: 1.3, 2.3 - Detailed career roadmap for college students
 */
const DetailedCareerRoadmapSection = ({ roadmap }) => {
  if (!roadmap) return null;

  // Debug: Log roadmap data to verify it's correct
  console.log('DetailedCareerRoadmapSection - roadmap data:', roadmap);

  return (
    <>
      <h2 style={{ ...printStyles.sectionTitle, marginTop: '30px' }}>4. Detailed Career Roadmap</h2>
      <p style={{ fontSize: '9px', color: '#6b7280', marginBottom: '12px', lineHeight: '1.5' }}>
        This roadmap provides a structured path to achieve your career goals, with specific phases, 
        timelines, and actionable steps.
      </p>

      {/* Roadmap Phases */}
      {roadmap.phases && roadmap.phases.length > 0 && (
        <div style={{ marginTop: '10px' }}>
          <h3 style={printStyles.subTitle}>Career Development Phases</h3>
          {roadmap.phases.map((phase, idx) => {
            const phaseColors = [
              { bg: '#eff6ff', border: '#3b82f6', text: '#1e40af' },
              { bg: '#f0fdf4', border: '#22c55e', text: '#166534' },
              { bg: '#fef3c7', border: '#eab308', text: '#854d0e' },
              { bg: '#fce7f3', border: '#ec4899', text: '#9f1239' }
            ];
            const colors = phaseColors[idx % phaseColors.length];

            return (
              <div key={idx} style={{
                ...printStyles.card,
                background: colors.bg,
                border: `2px solid ${colors.border}`,
                marginBottom: '15px'
              }}>
                {/* Phase Header */}
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
                  <div style={{ fontWeight: 'bold', fontSize: '11px', color: colors.text }}>
                    Phase {idx + 1}: {safeRender(phase.phase || `Phase ${idx + 1}`)}
                  </div>
                  {phase.duration && (
                    <span style={{
                      ...printStyles.badge,
                      background: 'white',
                      color: colors.text,
                      border: `1px solid ${colors.border}`,
                      fontSize: '9px'
                    }}>
                      ⏱ {phase.duration}
                    </span>
                  )}
                </div>

                {/* Phase Description */}
                {phase.description && (
                  <p style={{ fontSize: '9px', color: '#4b5563', margin: '0 0 10px 0', lineHeight: '1.5' }}>
                    {phase.description}
                  </p>
                )}

                {/* Phase Goals */}
                {phase.goals && phase.goals.length > 0 && (
                  <div>
                    <div style={{ fontSize: '9px', fontWeight: '600', color: '#374151', marginBottom: '6px' }}>
                      Key Goals & Milestones:
                    </div>
                    <ul style={{ margin: '0', paddingLeft: '18px', fontSize: '9px', color: '#4b5563', lineHeight: '1.6' }}>
                      {phase.goals.map((goal, goalIdx) => (
                        <li key={goalIdx} style={{ marginBottom: '3px' }}>{safeRender(goal)}</li>
                      ))}
                    </ul>
                  </div>
                )}

                {/* Phase Actions */}
                {phase.actions && phase.actions.length > 0 && (
                  <div style={{ marginTop: '8px' }}>
                    <div style={{ fontSize: '9px', fontWeight: '600', color: '#374151', marginBottom: '6px' }}>
                      Action Steps:
                    </div>
                    <ul style={{ margin: '0', paddingLeft: '18px', fontSize: '9px', color: '#4b5563', lineHeight: '1.6' }}>
                      {phase.actions.map((action, actionIdx) => (
                        <li key={actionIdx} style={{ marginBottom: '3px' }}>{safeRender(action)}</li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* 12-Month Action Plan (if available) */}
      {roadmap.twelveMonthJourney && roadmap.twelveMonthJourney.length > 0 && (
        <div style={{ marginTop: '20px' }}>
          <h3 style={printStyles.subTitle}>12-Month Action Plan</h3>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px', marginTop: '8px' }}>
            {roadmap.twelveMonthJourney.map((item, idx) => (
              <div key={idx} style={printStyles.card}>
                <div style={{ fontWeight: 'bold', fontSize: '9px', color: '#4f46e5', marginBottom: '4px' }}>
                  {safeRender(item.month || `Month ${idx + 1}`)}
                </div>
                <p style={{ fontSize: '9px', color: '#4b5563', margin: '0', lineHeight: '1.4' }}>
                  {safeRender(item.activity || item)}
                </p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Recommended Projects (if available) */}
      {roadmap.projects && roadmap.projects.length > 0 && (
        <div style={{ marginTop: '30px' }}>
          <h3 style={printStyles.subTitle}>Recommended Projects & Experiences</h3>
          <div style={printStyles.twoCol}>
            {roadmap.projects.map((project, idx) => (
              <div key={idx} style={printStyles.card}>
                <div style={{ fontWeight: 'bold', fontSize: '10px', color: '#1e293b', marginBottom: '4px' }}>
                  {safeRender(project.name || project)}
                </div>
                {project.description && (
                  <p style={{ fontSize: '9px', color: '#4b5563', margin: '0 0 6px 0', lineHeight: '1.4' }}>
                    {project.description}
                  </p>
                )}
                {project.skills && (
                  <div style={{ fontSize: '8px', color: '#6b7280' }}>
                    <strong>Skills:</strong> {safeJoin(project.skills)}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Resources & Opportunities (if available) */}
      {roadmap.exposure && (
        <div style={{ marginTop: '20px' }}>
          <h3 style={printStyles.subTitle}>Resources & Opportunities</h3>
          <div style={printStyles.twoCol}>
            {roadmap.exposure.activities && roadmap.exposure.activities.length > 0 && (
              <div style={printStyles.card}>
                <div style={{ fontWeight: 'bold', fontSize: '10px', color: '#1e293b', marginBottom: '6px' }}>
                  Activities to Pursue
                </div>
                <ul style={{ margin: '0', paddingLeft: '15px', fontSize: '9px', color: '#4b5563', lineHeight: '1.5' }}>
                  {roadmap.exposure.activities.map((activity, idx) => (
                    <li key={idx}>{safeRender(activity)}</li>
                  ))}
                </ul>
              </div>
            )}

            {roadmap.exposure.resources && roadmap.exposure.resources.length > 0 && (
              <div style={printStyles.card}>
                <div style={{ fontWeight: 'bold', fontSize: '10px', color: '#1e293b', marginBottom: '6px' }}>
                  Learning Resources
                </div>
                <ul style={{ margin: '0', paddingLeft: '15px', fontSize: '9px', color: '#4b5563', lineHeight: '1.5' }}>
                  {roadmap.exposure.resources.map((resource, idx) => (
                    <li key={idx}>{safeRender(resource)}</li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        </div>
      )}
    </>
  );
};

/**
 * FinalRecommendationsSection Component
 * Renders final recommendations and overall summary
 * Requirements: 1.3, 2.3 - Final recommendations for college students
 */
const FinalRecommendationsSection = ({ overallSummary }) => {
  if (!overallSummary) return null;

  return (
    <div style={printStyles.finalBox}>
      <h3 style={{ margin: '0 0 10px 0', fontSize: '12px', color: '#fbbf24' }}>Final Recommendations</h3>
      <p style={{ margin: '0', fontSize: '10px', lineHeight: '1.6' }}>
        {overallSummary}
      </p>
    </div>
  );
};

/**
 * CourseRecommendationsSection Component
 * Renders recommended degree programs/courses based on assessment
 * Requirements: 1.3, 2.3 - Course recommendations for college students
 */
const CourseRecommendationsSection = ({ courseRecommendations }) => {
  if (!courseRecommendations || courseRecommendations.length === 0) return null;

  // Debug: Log courseRecommendations data to verify it's correct
  console.log('CourseRecommendationsSection - courseRecommendations data:', courseRecommendations);

  // Take top 5 recommendations
  const topCourses = courseRecommendations.slice(0, 5);

  return (
    <>
      <h2 style={printStyles.sectionTitle}>Recommended Degree Programs</h2>
      <p style={{ fontSize: '10px', color: '#6b7280', marginBottom: '15px', lineHeight: '1.5' }}>
        Based on your assessment results, interests, and aptitudes, here are the top degree programs that align with your profile:
      </p>

      {topCourses.map((course, index) => (
        <div key={index} style={{ 
          ...printStyles.card, 
          marginBottom: '12px',
          border: index === 0 ? '2px solid #3b82f6' : '1px solid #e5e7eb',
          backgroundColor: index === 0 ? '#eff6ff' : '#ffffff'
        }}>
          <div style={{ display: 'flex', alignItems: 'flex-start', gap: '10px' }}>
            {/* Rank Badge */}
            <div style={{
              width: '28px',
              height: '28px',
              borderRadius: '50%',
              backgroundColor: index === 0 ? '#3b82f6' : index === 1 ? '#60a5fa' : '#93c5fd',
              color: 'white',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontWeight: 'bold',
              fontSize: '12px',
              flexShrink: 0
            }}>
              {index + 1}
            </div>

            <div style={{ flex: 1 }}>
              {/* Course Name */}
              <div style={{ 
                fontWeight: 'bold', 
                fontSize: '11px', 
                color: '#1e293b', 
                marginBottom: '4px',
                display: 'flex',
                alignItems: 'center',
                gap: '6px'
              }}>
                {course.courseName}
                {index === 0 && (
                  <span style={{
                    fontSize: '8px',
                    backgroundColor: '#fbbf24',
                    color: '#78350f',
                    padding: '2px 6px',
                    borderRadius: '4px',
                    fontWeight: 'bold'
                  }}>
                    TOP PICK
                  </span>
                )}
              </div>

              {/* Category */}
              {course.category && (
                <div style={{ 
                  fontSize: '8px', 
                  color: '#6b7280',
                  marginBottom: '6px'
                }}>
                  Category: {course.category}
                </div>
              )}

              {/* Match Score */}
              <div style={{ 
                fontSize: '9px', 
                color: '#059669',
                fontWeight: '600',
                marginBottom: '6px'
              }}>
                Match Score: {Math.round(course.matchScore)}%
              </div>

              {/* Description */}
              {course.description && (
                <p style={{ 
                  fontSize: '9px', 
                  color: '#4b5563', 
                  lineHeight: '1.5',
                  margin: '0 0 8px 0'
                }}>
                  {course.description}
                </p>
              )}

              {/* Reasons for Recommendation */}
              {course.reasons && course.reasons.length > 0 && (
                <div style={{ marginTop: '8px' }}>
                  <div style={{ 
                    fontSize: '9px', 
                    fontWeight: 'bold', 
                    color: '#1e293b',
                    marginBottom: '4px'
                  }}>
                    Why this program suits you:
                  </div>
                  <ul style={{ 
                    margin: '0', 
                    paddingLeft: '15px', 
                    fontSize: '8px', 
                    color: '#4b5563', 
                    lineHeight: '1.5' 
                  }}>
                    {course.reasons.slice(0, 3).map((reason, idx) => (
                      <li key={idx}>{reason}</li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          </div>
        </div>
      ))}

      <div style={{ 
        marginTop: '15px', 
        padding: '10px', 
        backgroundColor: '#f0f9ff', 
        borderLeft: '3px solid #3b82f6',
        fontSize: '9px',
        color: '#1e40af',
        lineHeight: '1.5'
      }}>
        <strong>Note:</strong> These recommendations are based on your assessment results. Consider exploring each program further, 
        talking to professionals in these fields, and aligning them with your long-term career goals.
      </div>
    </>
  );
};

export default PrintViewCollege;
