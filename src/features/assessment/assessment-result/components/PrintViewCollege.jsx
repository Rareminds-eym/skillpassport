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
import Watermarks, { DataPrivacyNotice, ReportDisclaimer } from './shared/Watermarks';
import DetailedAssessmentBreakdown from './shared/DetailedAssessmentBreakdown';

/**
 * Learning Styles Section
 * Displays student's preferred learning approaches
 */
const LearningStylesSection = ({ learningStyles, learningStyle }) => {
  const hasArray = learningStyles && learningStyles.length > 0;
  const hasObject = learningStyle && (learningStyle.primary || learningStyle.secondary);
  if (!hasArray && !hasObject) return null;

  const styleDescriptions = {
    'Visual': 'You learn best through images, diagrams, and visual aids',
    'Auditory': 'You learn best through listening and verbal instruction',
    'Kinesthetic': 'You learn best through hands-on practice and movement',
    'Reading/Writing': 'You learn best through reading and taking notes',
    'Social': 'You learn best in group settings and through discussion',
    'Solitary': 'You learn best when studying alone and self-paced'
  };

  return (
    <div style={{ marginBottom: '10px', pageBreakInside: 'avoid' }}>
      <h3 style={printStyles.subTitle}>Your Learning Preferences</h3>
      <p style={{ fontSize: '10px', color: '#4b5563', marginBottom: '8px' }}>
        Understanding how you learn best can help you choose effective study strategies and learning environments.
      </p>
      
      {hasObject && (
        <div style={{ marginBottom: '8px' }}>
          <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', marginBottom: '6px' }}>
            {learningStyle.primary && (
              <div style={{ padding: '8px 14px', background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)', color: 'white', borderRadius: '20px', fontSize: '10px', fontWeight: '600' }}>
                Primary: {learningStyle.primary}
              </div>
            )}
            {learningStyle.secondary && (
              <div style={{ padding: '8px 14px', background: '#e0e7ff', color: '#4338ca', borderRadius: '20px', fontSize: '10px', fontWeight: '600', border: '1px solid #a5b4fc' }}>
                Secondary: {learningStyle.secondary}
              </div>
            )}
          </div>
          {learningStyle.description && (
            <p style={{ fontSize: '9px', color: '#4b5563', margin: '0', lineHeight: '1.5' }}>
              {learningStyle.description}
            </p>
          )}
        </div>
      )}

      {hasArray && (
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
          {learningStyles.map((style, index) => (
            <div 
              key={index}
              style={{
                padding: '8px',
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
      )}
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
    <div style={{ marginBottom: '10px', pageBreakInside: 'avoid' }}>
      <h3 style={printStyles.subTitle}>Ideal Work Environment</h3>
      <p style={{ fontSize: '10px', color: '#4b5563', marginBottom: '8px' }}>
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
  const profileSnapshot = normalizedResults.profileSnapshot || normalizedResults.gemini_results?.profileSnapshot;
  const finalNote = normalizedResults.finalNote || normalizedResults.gemini_results?.finalNote;
  const learningStyle = normalizedResults.learningStyle || normalizedResults.gemini_results?.learningStyle;
  const characterStrengths = normalizedResults.characterStrengths || normalizedResults.gemini_results?.characterStrengths;
  const timingAnalysis = normalizedResults.timingAnalysis || normalizedResults.gemini_results?.timingAnalysis;
  const adaptiveAptitudeResults = normalizedResults.adaptiveAptitudeResults || normalizedResults.gemini_results?.adaptiveAptitudeResults;
  const dbCourseRecommendations = normalizedResults.courseRecommendations || normalizedResults.platformCourses || normalizedResults.gemini_results?.courseRecommendations || normalizedResults.gemini_results?.platformCourses;


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

        {overallSummary && <OverallSummarySection overallSummary={overallSummary} />}

        <h2 style={printStyles.sectionTitle}>Interest Profile</h2>
        <InterestProfileSection riasec={riasec} safeRiasecNames={safeRiasecNames} />

        {aptitude && <CognitiveAbilitiesSection aptitude={aptitude} />}
        {bigFive && <BigFivePersonalitySection bigFive={bigFive} safeTraitNames={safeTraitNames} />}
        {workValues && <WorkValuesSection workValues={workValues} />}
        {knowledge && Object.keys(knowledge).length > 0 && <KnowledgeAssessmentSection knowledge={knowledge} />}
        {employability && <EmployabilityScoreSection employability={employability} />}
        {characterStrengths && <CharacterStrengthsSection characterStrengths={characterStrengths} />}
        {careerFit && <CareerFitAnalysisSection careerFit={careerFit} />}
        {skillGap && <SkillGapDevelopmentSection skillGap={skillGap} />}
        {roadmap && <DetailedCareerRoadmapSection roadmap={roadmap} />}

        {dbCourseRecommendations && dbCourseRecommendations.length > 0 && (
          <CourseRecommendationsSection courseRecommendations={dbCourseRecommendations} />
        )}

        {profileSnapshot && <ProfileSnapshotSection profileSnapshot={profileSnapshot} />}
        {finalNote && <FinalNoteSection finalNote={finalNote} />}

        <DetailedAssessmentBreakdown 
          results={normalizedResults} 
          riasecNames={safeRiasecNames}
          gradeLevel="college"
        />

        {(results.learningStyles || learningStyle) && (
          <LearningStylesSection learningStyles={results.learningStyles} learningStyle={learningStyle} />
        )}
        {results.workPreferences && results.workPreferences.length > 0 && (
          <WorkPreferencesSection workPreferences={results.workPreferences} />
        )}

        {timingAnalysis && <TimingAnalysisSection timingAnalysis={timingAnalysis} />}
        {adaptiveAptitudeResults && <AdaptiveAptitudeResultsSection adaptiveAptitudeResults={adaptiveAptitudeResults} />}

        <ReportDisclaimer />
      </div>

      {/* Screen-only continuous content (hidden in print) */}
      <div className="print-content" style={{ position: 'relative', zIndex: 1, paddingBottom: '40px' }}>
        <DataPrivacyNotice />

        {overallSummary && <OverallSummarySection overallSummary={overallSummary} />}

        <h2 style={printStyles.sectionTitle}>Interest Profile</h2>
        <InterestProfileSection riasec={riasec} safeRiasecNames={safeRiasecNames} />

        {aptitude && <CognitiveAbilitiesSection aptitude={aptitude} />}
        {bigFive && <BigFivePersonalitySection bigFive={bigFive} safeTraitNames={safeTraitNames} />}
        {workValues && <WorkValuesSection workValues={workValues} />}
        {knowledge && Object.keys(knowledge).length > 0 && <KnowledgeAssessmentSection knowledge={knowledge} />}
        {employability && <EmployabilityScoreSection employability={employability} />}
        {characterStrengths && <CharacterStrengthsSection characterStrengths={characterStrengths} />}
        {careerFit && <CareerFitAnalysisSection careerFit={careerFit} />}
        {skillGap && <SkillGapDevelopmentSection skillGap={skillGap} />}
        {roadmap && <DetailedCareerRoadmapSection roadmap={roadmap} />}

        {dbCourseRecommendations && dbCourseRecommendations.length > 0 && (
          <CourseRecommendationsSection courseRecommendations={dbCourseRecommendations} />
        )}

        {profileSnapshot && <ProfileSnapshotSection profileSnapshot={profileSnapshot} />}
        {finalNote && <FinalNoteSection finalNote={finalNote} />}

        <DetailedAssessmentBreakdown 
          results={results} 
          riasecNames={safeRiasecNames}
          gradeLevel="college"
        />

        {(results.learningStyles || learningStyle) && (
          <LearningStylesSection learningStyles={results.learningStyles} learningStyle={learningStyle} />
        )}
        {results.workPreferences && results.workPreferences.length > 0 && (
          <WorkPreferencesSection workPreferences={results.workPreferences} />
        )}

        {timingAnalysis && <TimingAnalysisSection timingAnalysis={timingAnalysis} />}
        {adaptiveAptitudeResults && <AdaptiveAptitudeResultsSection adaptiveAptitudeResults={adaptiveAptitudeResults} />}

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

  return (
    <div>
      <h3 style={printStyles.subTitle}>Interest Explorer Results</h3>

      {/* RIASEC Infographic Layout with Central Circle */}
      <div style={{
        position: 'relative',
        padding: '8px 0',
        marginTop: '6px',
        marginBottom: '6px',
        minHeight: '260px'
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
        <strong>Your Top Interests:</strong> {topInterestsText}.{riasec.interpretation ? ` ${safeRender(riasec.interpretation)}` : ''}
      </div>

      {/* RIASEC Percentage Breakdown */}
      {riasec.percentages && (
        <div style={{ marginTop: '8px' }}>
          <h4 style={{ fontSize: '10px', fontWeight: 'bold', color: '#1e293b', marginBottom: '6px' }}>Score Breakdown</h4>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '6px' }}>
            {codes.map((code) => {
              const pct = riasec.percentages[code] || 0;
              const barColor = topThree.includes(code) ? '#3b82f6' : '#94a3b8';
              return (
                <div key={code} style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <span style={{ fontSize: '9px', fontWeight: '600', color: '#1e293b', width: '14px' }}>{code}</span>
                  <div style={{ flex: 1, height: '8px', background: '#e2e8f0', borderRadius: '4px', overflow: 'hidden' }}>
                    <div style={{ width: `${pct}%`, height: '100%', background: barColor, borderRadius: '4px' }}></div>
                  </div>
                  <span style={{ fontSize: '8px', color: '#6b7280', width: '28px', textAlign: 'right' }}>{pct}%</span>
                </div>
              );
            })}
          </div>
        </div>
      )}
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
      <h2 style={{ ...printStyles.sectionTitle, marginTop: '12px' }}>Cognitive Abilities</h2>

      {/* Overall Score */}
      {aptitude.overallScore > 0 && (
        <div style={{ ...printStyles.card, marginBottom: '8px', background: '#f0f9ff', border: '1px solid #bae6fd' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div style={{ fontWeight: 'bold', fontSize: '10px', color: '#0369a1' }}>Overall Cognitive Score</div>
            <span style={{ ...printStyles.badge, background: '#dbeafe', color: '#1e40af', border: '1px solid #93c5fd', fontSize: '10px', fontWeight: 'bold' }}>
              {Math.round(aptitude.overallScore)}%
            </span>
          </div>
        </div>
      )}

      {/* Top Strengths Badges */}
      {aptitude.topStrengths && aptitude.topStrengths.length > 0 && (
        <div style={{ marginBottom: '8px' }}>
          <span style={{ fontSize: '9px', fontWeight: 'bold', color: '#166534' }}>Top Strengths: </span>
          {aptitude.topStrengths.map((strength, idx) => (
            <span
              key={idx}
              style={{
                ...printStyles.badge,
                background: '#dcfce7',
                color: '#166534',
                border: '1px solid #86efac',
                marginRight: '4px'
              }}
            >
              ★ {safeRender(strength)}
            </span>
          ))}
        </div>
      )}

      {/* Areas to Improve */}
      {aptitude.areasToImprove && aptitude.areasToImprove.length > 0 && (
        <div style={{ marginBottom: '8px' }}>
          <span style={{ fontSize: '9px', fontWeight: 'bold', color: '#854d0e' }}>Areas to Improve: </span>
          {aptitude.areasToImprove.map((area, idx) => (
            <span key={idx} style={{ ...printStyles.badge, background: '#fef9c3', color: '#854d0e', border: '1px solid #fde047', marginRight: '4px' }}>
              {safeRender(area)}
            </span>
          ))}
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

      {/* Cognitive Profile */}
      {aptitude.cognitiveProfile && (
        <div style={{ ...printStyles.summaryBox, marginTop: '10px' }}>
          <h4 style={{ margin: '0 0 6px 0', fontSize: '9px', fontWeight: 'bold', color: '#0369a1' }}>
            Cognitive Profile
          </h4>
          <p style={{ margin: '0', fontSize: '8px', lineHeight: '1.5', color: '#475569' }}>
            {safeRender(aptitude.cognitiveProfile)}
          </p>
        </div>
      )}

      {/* Career Implications */}
      {aptitude.careerImplications && (
        <div style={{ ...printStyles.card, marginTop: '8px', background: '#eff6ff', border: '1px solid #bfdbfe' }}>
          <p style={{ margin: '0', fontSize: '9px', lineHeight: '1.5', color: '#1e40af' }}>
            <strong>Career Implications:</strong> {safeRender(aptitude.careerImplications)}
          </p>
        </div>
      )}
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
      <h2 style={{ ...printStyles.sectionTitle, marginTop: '12px' }}>Big Five Personality Traits</h2>
      <p style={{ fontSize: '9px', color: '#6b7280', marginBottom: '8px', lineHeight: '1.5' }}>
        The Big Five model measures five broad dimensions of personality that influence how you interact with the world, 
        approach work, and relate to others.
      </p>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: '10px', marginTop: '10px' }}>
        {traits.map((trait) => {
          const score = bigFive[trait] || 0;
          const percentage = Math.round((score / 5) * 100);
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

      {/* Dominant Traits */}
      {bigFive.dominantTraits && bigFive.dominantTraits.length > 0 && (
        <div style={{ marginTop: '8px', display: 'flex', flexWrap: 'wrap', gap: '6px', alignItems: 'center' }}>
          <span style={{ fontSize: '9px', fontWeight: 'bold', color: '#1e293b' }}>Dominant Traits:</span>
          {bigFive.dominantTraits.map((trait, idx) => (
            <span key={idx} style={{ ...printStyles.badge, background: '#dbeafe', color: '#1e40af', border: '1px solid #93c5fd' }}>
              {safeRender(trait)}
            </span>
          ))}
        </div>
      )}

      {/* Work Style Summary */}
      {bigFive.workStyleSummary && (
        <div style={{ ...printStyles.summaryBox, marginTop: '8px' }}>
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
      <h2 style={{ ...printStyles.sectionTitle, marginTop: '12px' }}>Work Values & Motivations</h2>
      <p style={{ fontSize: '9px', color: '#6b7280', marginBottom: '8px', lineHeight: '1.5' }}>
        Understanding what motivates you at work helps identify careers and work environments where you'll thrive.
      </p>

      <h3 style={printStyles.subTitle}>Your Top Work Values</h3>

      {workValues.motivationSummary && (
        <div style={{ ...printStyles.card, marginBottom: '10px', background: '#eff6ff', border: '1px solid #bfdbfe' }}>
          <p style={{ margin: '0', fontSize: '9px', lineHeight: '1.5', color: '#1e40af' }}>
            {safeRender(workValues.motivationSummary)}
          </p>
        </div>
      )}

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
 * Renders knowledge assessment — supports flat DB format (score, strongTopics, weakTopics)
 * and legacy domain-based format (domain → {correct, total, percentage})
 */
const KnowledgeAssessmentSection = ({ knowledge }) => {
  if (!knowledge || Object.keys(knowledge).length === 0) return null;

  const isFlatFormat = 'totalQuestions' in knowledge || 'correctCount' in knowledge || 'strongTopics' in knowledge;

  if (isFlatFormat) {
    const percentage = typeof knowledge.score === 'number' ? Math.round(knowledge.score) : 0;
    const scoreStyle = getScoreStyle(percentage);
    const correctCount = knowledge.correctCount || 0;
    const totalQuestions = knowledge.totalQuestions || 0;
    const strongTopics = knowledge.strongTopics || [];
    const weakTopics = knowledge.weakTopics || [];

    return (
      <>
        <h2 style={{ ...printStyles.sectionTitle, marginTop: '12px' }}>Knowledge Assessment</h2>

        {/* Overall Score */}
        <div style={{ ...printStyles.card, marginBottom: '10px', background: '#f0f9ff', border: '1px solid #bae6fd' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
            <div style={{ fontWeight: 'bold', fontSize: '10px', color: '#0369a1' }}>Overall Knowledge Score</div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <span style={{ fontSize: '10px', fontWeight: '600', color: '#1e293b' }}>
                {correctCount}/{totalQuestions}
              </span>
              <span style={{ ...printStyles.badge, background: scoreStyle.bg, color: scoreStyle.color, border: `1px solid ${scoreStyle.border}`, fontSize: '10px', fontWeight: 'bold' }}>
                {percentage}%
              </span>
            </div>
          </div>
          <div style={printStyles.progressBar}>
            <div style={{ width: `${percentage}%`, height: '100%', background: percentage >= 70 ? '#22c55e' : percentage >= 40 ? '#eab308' : '#ef4444', borderRadius: '4px' }}></div>
          </div>
        </div>

        {/* Strong & Weak Topics */}
        {(strongTopics.length > 0 || weakTopics.length > 0) && (
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px', marginBottom: '10px' }}>
            {strongTopics.length > 0 && (
              <div style={{ ...printStyles.card, background: '#f0fdf4', border: '1px solid #86efac' }}>
                <div style={{ fontWeight: 'bold', fontSize: '10px', color: '#166534', marginBottom: '6px' }}>✅ Strong Topics</div>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '4px' }}>
                  {strongTopics.map((topic, idx) => (
                    <span key={idx} style={{ ...printStyles.badge, background: '#dcfce7', color: '#166534', border: '1px solid #86efac' }}>
                      {safeRender(topic)}
                    </span>
                  ))}
                </div>
              </div>
            )}
            {weakTopics.length > 0 && (
              <div style={{ ...printStyles.card, background: '#fefce8', border: '1px solid #fde68a' }}>
                <div style={{ fontWeight: 'bold', fontSize: '10px', color: '#854d0e', marginBottom: '6px' }}>⚠️ Weak Topics</div>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '4px' }}>
                  {weakTopics.map((topic, idx) => (
                    <span key={idx} style={{ ...printStyles.badge, background: '#fef9c3', color: '#854d0e', border: '1px solid #fde047' }}>
                      {safeRender(topic)}
                    </span>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {/* Recommendation */}
        {knowledge.recommendation && (
          <div style={{ ...printStyles.card, background: '#eff6ff', border: '1px solid #bfdbfe' }}>
            <p style={{ margin: '0', fontSize: '9px', lineHeight: '1.5', color: '#1e40af' }}>
              <strong>Recommendation:</strong> {safeRender(knowledge.recommendation)}
            </p>
          </div>
        )}
      </>
    );
  }

  // Legacy domain-based format: { domainName: { correct, total, percentage }, ... }
  const getPercentage = (score) => {
    if (typeof score === 'object' && score !== null) {
      return score.percentage || (score.total > 0 ? Math.round((score.correct / score.total) * 100) : 0);
    }
    return Math.round(score);
  };

  const sortedDomains = Object.entries(knowledge)
    .sort(([, a], [, b]) => getPercentage(b) - getPercentage(a));

  return (
    <>
      <h2 style={{ ...printStyles.sectionTitle, marginTop: '12px' }}>Knowledge Assessment</h2>
      <table style={printStyles.table}>
        <thead>
          <tr>
            <th style={printStyles.th}>Knowledge Domain</th>
            <th style={{ ...printStyles.th, width: '100px', textAlign: 'center' }}>Score</th>
            <th style={{ ...printStyles.th, width: '140px' }}>Proficiency Level</th>
          </tr>
        </thead>
        <tbody>
          {sortedDomains.map(([domain, score]) => {
            const percentage = getPercentage(score);
            const scoreStyle = getScoreStyle(percentage);
            const isObject = typeof score === 'object' && score !== null;
            return (
              <tr key={domain}>
                <td style={printStyles.td}>
                  <span style={{ fontWeight: '600', fontSize: '10px' }}>{domain}</span>
                </td>
                <td style={{ ...printStyles.td, textAlign: 'center', fontWeight: '600' }}>
                  {isObject ? `${score.correct || 0}/${score.total || 0}` : ''}
                </td>
                <td style={printStyles.td}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <div style={{ flex: 1 }}>
                      <div style={printStyles.progressBar}>
                        <div style={{ width: `${percentage}%`, height: '100%', background: percentage >= 70 ? '#22c55e' : percentage >= 40 ? '#eab308' : '#ef4444' }}></div>
                      </div>
                    </div>
                    <span style={{ ...printStyles.badge, background: scoreStyle.bg, color: scoreStyle.color, border: `1px solid ${scoreStyle.border}` }}>
                      {percentage}%
                    </span>
                  </div>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </>
  );
};

/**
 * EmployabilityScoreSection Component
 * Renders employability score and breakdown
 * Requirements: 1.3, 2.3 - Employability metrics for college students
 */
const EmployabilityScoreSection = ({ employability }) => {
  if (!employability) return null;

  const hasScore = typeof employability.score !== 'undefined';
  const hasReadiness = employability.overallReadiness != null;
  const hasSkillScores = employability.skillScores && Object.keys(employability.skillScores).length > 0;
  const hasBreakdown = employability.breakdown && Object.keys(employability.breakdown).length > 0;
  const devAreas = employability.developmentAreas || employability.improvementAreas || [];

  if (!hasScore && !hasReadiness && !hasSkillScores && !hasBreakdown && !employability.strengthAreas) return null;

  const getReadinessInfo = (value) => {
    if (typeof value === 'number') {
      if (value >= 70) return { label: `${Math.round(value)}% — High`, bg: '#dcfce7', color: '#166534', border: '#86efac' };
      if (value >= 40) return { label: `${Math.round(value)}% — Medium`, bg: '#fef9c3', color: '#854d0e', border: '#fde047' };
      return { label: `${Math.round(value)}% — Developing`, bg: '#fee2e2', color: '#991b1b', border: '#fca5a5' };
    }
    if (value === 'High') return { label: 'High', bg: '#dcfce7', color: '#166534', border: '#86efac' };
    if (value === 'Medium') return { label: 'Medium', bg: '#fef9c3', color: '#854d0e', border: '#fde047' };
    return { label: String(value), bg: '#fee2e2', color: '#991b1b', border: '#fca5a5' };
  };

  const readiness = hasReadiness ? getReadinessInfo(employability.overallReadiness) : null;

  return (
    <>
      <h2 style={{ ...printStyles.sectionTitle, marginTop: '12px' }}>Employability Assessment</h2>

      {/* Overall Score (number format) */}
      {hasScore && (
        <div style={{ ...printStyles.card, textAlign: 'center', padding: '12px', marginBottom: '8px', background: '#f0f9ff', border: '2px solid #3b82f6' }}>
          <div style={{ fontSize: '11px', fontWeight: 'bold', color: '#0369a1', marginBottom: '8px' }}>Overall Employability Score</div>
          <div style={{ fontSize: '36px', fontWeight: 'bold', color: '#0369a1', marginBottom: '4px' }}>{Math.round(employability.score)}%</div>
        </div>
      )}

      {/* Overall Readiness */}
      {readiness && (
        <div style={{ ...printStyles.card, marginBottom: '10px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div style={{ fontWeight: 'bold', fontSize: '10px', color: '#1e293b' }}>Overall Career Readiness</div>
            <span style={{ ...printStyles.badge, background: readiness.bg, color: readiness.color, border: `1px solid ${readiness.border}` }}>
              {readiness.label}
            </span>
          </div>
          {employability.careerReadiness && (
            <p style={{ margin: '6px 0 0 0', fontSize: '9px', color: '#475569', lineHeight: '1.5' }}>
              {safeRender(employability.careerReadiness)}
            </p>
          )}
        </div>
      )}

      {/* Skill Scores */}
      {hasSkillScores && (
        <div>
          <h3 style={printStyles.subTitle}>Skill Assessment Scores</h3>
          <div style={printStyles.twoCol}>
            {Object.entries(employability.skillScores).map(([skill, score]) => {
              const isPercentage = score > 5;
              const percentage = isPercentage ? Math.round(score) : Math.round((score / 5) * 100);
              const scoreStyle = getScoreStyle(percentage);
              return (
                <div key={skill} style={printStyles.card}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div style={{ fontWeight: 'bold', fontSize: '10px', color: '#1e293b' }}>{skill}</div>
                    <span style={{ ...printStyles.badge, background: scoreStyle.bg, color: scoreStyle.color, border: `1px solid ${scoreStyle.border}` }}>
                      {percentage}%
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Breakdown (old format) */}
      {hasBreakdown && (
        <div>
          <h3 style={printStyles.subTitle}>Score Breakdown</h3>
          <div style={printStyles.twoCol}>
            {Object.entries(employability.breakdown).map(([component, score]) => {
              const percentage = Math.round(score);
              const scoreStyle = getScoreStyle(percentage);
              return (
                <div key={component} style={printStyles.card}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div style={{ fontWeight: 'bold', fontSize: '10px', color: '#1e293b' }}>{component}</div>
                    <span style={{ ...printStyles.badge, background: scoreStyle.bg, color: scoreStyle.color, border: `1px solid ${scoreStyle.border}` }}>
                      {percentage}%
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Strength Areas */}
      {employability.strengthAreas && employability.strengthAreas.length > 0 && (
        <div style={{ marginTop: '10px' }}>
          <h3 style={printStyles.subTitle}>Your Strength Areas</h3>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
            {employability.strengthAreas.map((area, idx) => (
              <span key={idx} style={{ ...printStyles.badge, background: '#dcfce7', color: '#166534', border: '1px solid #86efac' }}>
                {safeRender(area)}
              </span>
            ))}
          </div>
        </div>
      )}

      {/* Development / Improvement Areas */}
      {devAreas.length > 0 && (
        <div style={{ marginTop: '10px' }}>
          <h3 style={printStyles.subTitle}>Areas to Develop</h3>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
            {devAreas.map((area, idx) => (
              <span key={idx} style={{ ...printStyles.badge, background: '#fef9c3', color: '#854d0e', border: '1px solid #fde047' }}>
                {safeRender(area)}
              </span>
            ))}
          </div>
        </div>
      )}
    </>
  );
};

/**
 * CareerFitAnalysisSection Component
 * Renders detailed career recommendations with fit scores
 * Requirements: 1.3 - Career fit analysis for college students
 */
const CareerFitAnalysisSection = ({ careerFit }) => {
  const hasClusters = careerFit?.clusters && careerFit.clusters.length > 0;
  const hasTopCareers = careerFit?.topCareers && careerFit.topCareers.length > 0;
  const hasSpecificOptions = careerFit?.specificOptions && (
    careerFit.specificOptions.highFit?.length > 0 ||
    careerFit.specificOptions.mediumFit?.length > 0 ||
    careerFit.specificOptions.exploreLater?.length > 0
  );

  if (!careerFit || (!hasClusters && !hasTopCareers && !hasSpecificOptions)) return null;

  // Extract career tracks if they exist
  const careerTracks = careerFit.tracks || careerFit.careerTracks || careerFit.topTracks || [];

  const fitBadgeStyle = (fit) => {
    if (fit === 'High') return { bg: '#dcfce7', color: '#166534', border: '#86efac' };
    if (fit === 'Medium') return { bg: '#fef3c7', color: '#92400e', border: '#fde047' };
    return { bg: '#e0f2fe', color: '#1e40af', border: '#93c5fd' };
  };

  return (
    <>
      <h2 style={{ ...printStyles.sectionTitle, marginTop: '12px' }}>Career Fit Analysis</h2>
      <p style={{ fontSize: '9px', color: '#6b7280', marginBottom: '8px', lineHeight: '1.5' }}>
        Based on your interests, abilities, personality, and values, these careers offer the best alignment 
        with your profile. The fit score indicates how well each career matches your overall assessment results.
      </p>

      {/* Career Tracks with Roles & Salary (if available) */}
      {careerTracks.length > 0 && (
        <div style={{ marginBottom: '10px' }}>
          <h3 style={printStyles.subTitle}>Top Career Tracks for You</h3>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '8px', marginTop: '6px' }}>
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

      {/* Career Clusters (detailed cards) */}
      {hasClusters && (
        <div style={{ marginBottom: '8px' }}>
          <h3 style={printStyles.subTitle}>Career Paths That Match Your Profile</h3>
          {careerFit.clusters.map((cluster, idx) => {
            if (typeof cluster === 'string') {
              return (
                <span key={idx} style={{ ...printStyles.badge, background: '#dbeafe', color: '#1e40af', border: '1px solid #93c5fd', fontSize: '9px', padding: '4px 10px', marginRight: '6px' }}>
                  {safeRender(cluster)}
                </span>
              );
            }
            const badge = fitBadgeStyle(cluster.fit);
            return (
              <div key={idx} style={{ ...printStyles.card, marginBottom: '8px', pageBreakInside: 'avoid' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
                  <div style={{ fontWeight: 'bold', fontSize: '11px', color: '#1e293b' }}>
                    {safeRender(cluster.title)}
                  </div>
                  <div style={{ display: 'flex', gap: '6px', alignItems: 'center' }}>
                    <span style={{ ...printStyles.badge, background: badge.bg, color: badge.color, border: `1px solid ${badge.border}` }}>
                      {cluster.fit} Fit
                    </span>
                    {cluster.matchScore > 0 && (
                      <span style={{ fontSize: '10px', fontWeight: 'bold', color: '#059669' }}>{cluster.matchScore}%</span>
                    )}
                  </div>
                </div>
                {cluster.description && (
                  <p style={{ fontSize: '9px', color: '#4b5563', margin: '0 0 6px 0', lineHeight: '1.4' }}>{safeRender(cluster.description)}</p>
                )}
                {cluster.whyItFits && (
                  <div style={{ fontSize: '9px', color: '#1e40af', margin: '0 0 6px 0', lineHeight: '1.4', fontStyle: 'italic' }}>
                    <strong>Why this fits you:</strong> {safeRender(cluster.whyItFits)}
                  </div>
                )}
                {cluster.whatYoullDo && (
                  <div style={{ fontSize: '9px', color: '#475569', margin: '0 0 6px 0', lineHeight: '1.4' }}>
                    <strong>What you'll do:</strong> {safeRender(cluster.whatYoullDo)}
                  </div>
                )}
                {cluster.domains && cluster.domains.length > 0 && (
                  <div style={{ marginBottom: '6px' }}>
                    <span style={{ fontSize: '8px', fontWeight: 'bold', color: '#1e293b' }}>Domains: </span>
                    {cluster.domains.map((domain, dIdx) => (
                      <span key={dIdx} style={{ ...printStyles.badge, background: '#f3f4f6', color: '#374151', border: '1px solid #d1d5db', marginRight: '4px', fontSize: '8px' }}>
                        {safeRender(domain)}
                      </span>
                    ))}
                  </div>
                )}
                {cluster.roles && (
                  <div style={{ marginBottom: '6px' }}>
                    <div style={{ fontSize: '8px', fontWeight: 'bold', color: '#1e293b', marginBottom: '4px' }}>Career Roles:</div>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '4px' }}>
                      {cluster.roles.entry && cluster.roles.entry.length > 0 && (
                        <div style={{ background: '#f0fdf4', border: '1px solid #bbf7d0', borderRadius: '4px', padding: '4px' }}>
                          <div style={{ fontSize: '8px', fontWeight: 'bold', color: '#166534', marginBottom: '2px' }}>Entry Level</div>
                          <ul style={{ margin: '0', paddingLeft: '12px', fontSize: '8px', color: '#4b5563', lineHeight: '1.4' }}>
                            {cluster.roles.entry.map((role, rIdx) => <li key={rIdx}>{safeRender(role)}</li>)}
                          </ul>
                        </div>
                      )}
                      {cluster.roles.mid && cluster.roles.mid.length > 0 && (
                        <div style={{ background: '#eff6ff', border: '1px solid #bfdbfe', borderRadius: '4px', padding: '4px' }}>
                          <div style={{ fontSize: '8px', fontWeight: 'bold', color: '#1e40af', marginBottom: '2px' }}>Mid Level</div>
                          <ul style={{ margin: '0', paddingLeft: '12px', fontSize: '8px', color: '#4b5563', lineHeight: '1.4' }}>
                            {cluster.roles.mid.map((role, rIdx) => <li key={rIdx}>{safeRender(role)}</li>)}
                          </ul>
                        </div>
                      )}
                    </div>
                  </div>
                )}
                {cluster.evidence && (
                  <div style={{ marginBottom: '4px' }}>
                    <div style={{ fontSize: '8px', fontWeight: 'bold', color: '#1e293b', marginBottom: '3px' }}>Evidence from Your Assessment:</div>
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '3px' }}>
                      {Object.entries(cluster.evidence).map(([key, value]) => (
                        <span key={key} style={{ fontSize: '8px', background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: '3px', padding: '2px 4px', color: '#475569' }}>
                          <strong>{key.charAt(0).toUpperCase() + key.slice(1)}:</strong> {safeRender(value)}
                        </span>
                      ))}
                    </div>
                  </div>
                )}
                {cluster.examples && cluster.examples.length > 0 && (
                  <div>
                    <div style={{ fontSize: '8px', fontWeight: 'bold', color: '#1e293b', marginBottom: '3px' }}>Example Careers:</div>
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '3px' }}>
                      {cluster.examples.map((example, exIdx) => (
                        <span key={exIdx} style={{ ...printStyles.badge, background: '#f3f4f6', color: '#374151', border: '1px solid #d1d5db', fontSize: '8px' }}>
                          {safeRender(example)}
                        </span>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* Specific Career Options by Fit Level */}
      {hasSpecificOptions && (
        <div style={{ marginTop: '8px' }}>
          <h3 style={printStyles.subTitle}>Recommended Career Options</h3>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '8px' }}>
            {careerFit.specificOptions.highFit && careerFit.specificOptions.highFit.length > 0 && (
              <div style={printStyles.card}>
                <div style={{ fontWeight: 'bold', fontSize: '10px', color: '#166534', marginBottom: '6px' }}>⭐ Best Match</div>
                {careerFit.specificOptions.highFit.map((career, idx) => (
                  <div key={idx} style={{ marginBottom: '4px', paddingBottom: '4px', borderBottom: idx < careerFit.specificOptions.highFit.length - 1 ? '1px solid #f3f4f6' : 'none' }}>
                    <div style={{ fontSize: '9px', fontWeight: '600', color: '#1e293b' }}>
                      {safeRender(career.name || career)}
                      {career.salary && (
                        <span style={{ fontSize: '8px', color: '#059669', marginLeft: '4px', fontWeight: 'normal' }}>₹{career.salary.min}-{career.salary.max} LPA</span>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
            {careerFit.specificOptions.mediumFit && careerFit.specificOptions.mediumFit.length > 0 && (
              <div style={printStyles.card}>
                <div style={{ fontWeight: 'bold', fontSize: '10px', color: '#92400e', marginBottom: '6px' }}>💡 Good Match</div>
                {careerFit.specificOptions.mediumFit.map((career, idx) => (
                  <div key={idx} style={{ marginBottom: '4px', paddingBottom: '4px', borderBottom: idx < careerFit.specificOptions.mediumFit.length - 1 ? '1px solid #f3f4f6' : 'none' }}>
                    <div style={{ fontSize: '9px', fontWeight: '600', color: '#1e293b' }}>
                      {safeRender(career.name || career)}
                      {career.salary && (
                        <span style={{ fontSize: '8px', color: '#059669', marginLeft: '4px', fontWeight: 'normal' }}>₹{career.salary.min}-{career.salary.max} LPA</span>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
            {careerFit.specificOptions.exploreLater && careerFit.specificOptions.exploreLater.length > 0 && (
              <div style={printStyles.card}>
                <div style={{ fontWeight: 'bold', fontSize: '10px', color: '#1e40af', marginBottom: '6px' }}>🔍 Explore</div>
                {careerFit.specificOptions.exploreLater.map((career, idx) => (
                  <div key={idx} style={{ marginBottom: '4px', paddingBottom: '4px', borderBottom: idx < careerFit.specificOptions.exploreLater.length - 1 ? '1px solid #f3f4f6' : 'none' }}>
                    <div style={{ fontSize: '9px', fontWeight: '600', color: '#1e293b' }}>
                      {safeRender(career.name || career)}
                      {career.salary && (
                        <span style={{ fontSize: '8px', color: '#059669', marginLeft: '4px', fontWeight: 'normal' }}>₹{career.salary.min}-{career.salary.max} LPA</span>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Top Career Recommendations (fallback for simple list format) */}
      {hasTopCareers && (
        <div>
          <h3 style={printStyles.subTitle}>Your Top Career Matches</h3>
          <div style={{ marginTop: '6px' }}>
            {careerFit.topCareers.slice(0, 8).map((career, idx) => {
              const name = safeRender(career.name || career);
              const fitScore = career.fitScore || 0;
              const description = career.description || '';
              const scoreStyle = getScoreStyle(fitScore);
              return (
                <div key={idx} style={{ ...printStyles.card, marginBottom: '6px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '4px' }}>
                    <div style={{ fontWeight: 'bold', fontSize: '11px', color: '#1e293b', flex: 1 }}>
                      {idx + 1}. {name}
                    </div>
                    {fitScore > 0 && (
                      <span style={{ ...printStyles.badge, background: scoreStyle.bg, color: scoreStyle.color, border: `1px solid ${scoreStyle.border}`, fontSize: '10px', padding: '4px 10px', marginLeft: '10px' }}>
                        {fitScore}% Match
                      </span>
                    )}
                  </div>
                  {description && (
                    <p style={{ fontSize: '9px', color: '#4b5563', margin: '0', lineHeight: '1.5' }}>{description}</p>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}
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

  const currentStrengths = skillGap.currentStrengths || skillGap.currentSkills || [];
  const gaps = skillGap.gaps || [];
  const priorityA = skillGap.priorityA || [];
  const priorityB = skillGap.priorityB || [];
  const allGaps = gaps.length > 0 ? gaps : [...priorityA, ...priorityB];

  return (
    <>
      <h2 style={{ ...printStyles.sectionTitle, marginTop: '12px' }}>Skill Gap & Development Plan</h2>
      <p style={{ fontSize: '9px', color: '#6b7280', marginBottom: '8px', lineHeight: '1.5' }}>
        This analysis compares your current skills with those required for your target careers, 
        helping you prioritize your professional development efforts.
      </p>

      {/* Current Strengths */}
      {currentStrengths.length > 0 && (
        <div style={{ marginBottom: '10px' }}>
          <h3 style={printStyles.subTitle}>Your Current Strengths</h3>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
            {currentStrengths.map((skill, idx) => (
              <span key={idx} style={{ ...printStyles.badge, background: '#dcfce7', color: '#166534', border: '1px solid #86efac' }}>
                {safeRender(skill)}
              </span>
            ))}
          </div>
        </div>
      )}

      {/* Priority Skills to Develop */}
      {allGaps.length > 0 && (
        <div>
          <h3 style={printStyles.subTitle}>Skills to Develop</h3>
          <div style={{ marginBottom: '8px' }}>
            {allGaps.map((gap, idx) => {
              const skill = typeof gap === 'string' ? gap : gap.skill;
              const whyNeeded = gap.whyNeeded || gap.reason;
              const howToBuild = gap.howToBuild;
              const currentLevel = gap.currentLevel;
              const targetLevel = gap.targetLevel;
              const priority = gap.priority || (idx < priorityA.length ? 'High' : 'Medium');
              const priorityColors = {
                High: { bg: '#fee2e2', color: '#991b1b', border: '#fca5a5' },
                Medium: { bg: '#fef9c3', color: '#854d0e', border: '#fde047' },
                Low: { bg: '#dcfce7', color: '#166534', border: '#86efac' }
              };
              const colors = priorityColors[priority] || priorityColors.Medium;

              return (
                <div key={idx} style={{ ...printStyles.card, marginBottom: '6px', border: `1px solid ${colors.border}`, backgroundColor: `${colors.bg}20` }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '4px' }}>
                    <div style={{ fontWeight: 'bold', fontSize: '10px', color: '#1e293b' }}>{safeRender(skill)}</div>
                    <span style={{ ...printStyles.badge, background: colors.bg, color: colors.color, border: `1px solid ${colors.border}` }}>
                      {priority} Priority
                    </span>
                  </div>
                  {whyNeeded && (
                    <p style={{ fontSize: '9px', color: '#4b5563', margin: '0 0 4px 0', lineHeight: '1.4' }}>
                      <strong>Why:</strong> {safeRender(whyNeeded)}
                    </p>
                  )}
                  {howToBuild && (
                    <p style={{ fontSize: '9px', color: '#4b5563', margin: '0 0 4px 0', lineHeight: '1.4' }}>
                      <strong>How to build:</strong> {safeRender(howToBuild)}
                    </p>
                  )}
                  {(currentLevel || targetLevel) && (
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '4px', marginTop: '4px' }}>
                      {currentLevel && (
                        <span style={{ ...printStyles.badge, background: '#fef9c3', color: '#854d0e', border: '1px solid #fde047', fontSize: '8px' }}>
                          Current: {safeRender(currentLevel)}
                        </span>
                      )}
                      {targetLevel && (
                        <span style={{ ...printStyles.badge, background: '#dcfce7', color: '#166534', border: '1px solid #86efac', fontSize: '8px' }}>
                          Target: {safeRender(targetLevel)}
                        </span>
                      )}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Learning Tracks */}
      {skillGap.learningTracks && skillGap.learningTracks.length > 0 && (
        <div style={{ marginTop: '10px' }}>
          <h3 style={printStyles.subTitle}>Recommended Learning Tracks</h3>
          <div style={printStyles.twoCol}>
            {skillGap.learningTracks.map((lt, idx) => (
              <div key={idx} style={{ ...printStyles.card, background: '#eff6ff', border: '1px solid #bfdbfe' }}>
                <div style={{ fontWeight: 'bold', fontSize: '10px', color: '#1e40af', marginBottom: '4px' }}>
                  {safeRender(lt.track)}
                </div>
                {lt.topics && (
                  <p style={{ fontSize: '8px', color: '#4b5563', margin: '0 0 4px 0', lineHeight: '1.4' }}>
                    <strong>Topics:</strong> {safeRender(lt.topics)}
                  </p>
                )}
                {lt.suggestedIf && (
                  <p style={{ fontSize: '8px', color: '#059669', margin: '0', lineHeight: '1.4', fontStyle: 'italic' }}>
                    Best if: {safeRender(lt.suggestedIf)}
                  </p>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Recommended Learning Track */}
      {skillGap.recommendedTrack && (
        <div style={{ marginTop: '10px' }}>
          <h3 style={printStyles.subTitle}>Recommended Learning Path</h3>
          <div style={{ ...printStyles.card, backgroundColor: '#eff6ff', border: '2px solid #3b82f6' }}>
            <p style={{ fontSize: '10px', fontWeight: 'bold', color: '#1e40af', margin: '0' }}>
              {safeRender(skillGap.recommendedTrack)}
            </p>
          </div>
        </div>
      )}
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

  return (
    <>
      <h2 style={{ ...printStyles.sectionTitle, marginTop: '12px' }}>Career Roadmap</h2>
      <p style={{ fontSize: '9px', color: '#6b7280', marginBottom: '8px', lineHeight: '1.5' }}>
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
                marginBottom: '8px'
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
      {roadmap.twelveMonthJourney && (() => {
        let journeyItems = [];
        if (Array.isArray(roadmap.twelveMonthJourney)) {
          journeyItems = roadmap.twelveMonthJourney;
        } else if (typeof roadmap.twelveMonthJourney === 'object') {
          journeyItems = Object.entries(roadmap.twelveMonthJourney)
            .filter(([key]) => key.startsWith('phase'))
            .map(([, phase]) => phase);
        }
        if (journeyItems.length === 0) return null;
        return (
          <div style={{ marginTop: '10px' }}>
            <h3 style={printStyles.subTitle}>12-Month Action Plan</h3>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px', marginTop: '8px' }}>
              {journeyItems.map((item, idx) => (
                <div key={idx} style={printStyles.card}>
                  <div style={{ fontWeight: 'bold', fontSize: '9px', color: '#4f46e5', marginBottom: '4px' }}>
                    {safeRender(item.title || item.months || item.month || `Phase ${idx + 1}`)}
                  </div>
                  {item.goals && item.goals.length > 0 && (
                    <ul style={{ margin: '0 0 4px 0', paddingLeft: '14px', fontSize: '8px', color: '#4b5563', lineHeight: '1.5' }}>
                      {item.goals.map((goal, gIdx) => <li key={gIdx}>{safeRender(goal)}</li>)}
                    </ul>
                  )}
                  {item.activities && item.activities.length > 0 && (
                    <div style={{ fontSize: '8px', color: '#6b7280' }}>
                      <strong>Activities:</strong> {item.activities.join(', ')}
                    </div>
                  )}
                  {item.outcome && (
                    <p style={{ fontSize: '8px', color: '#059669', margin: '4px 0 0 0', lineHeight: '1.4', fontStyle: 'italic' }}>
                      {safeRender(item.outcome)}
                    </p>
                  )}
                  {!item.goals && !item.activities && !item.outcome && (
                    <p style={{ fontSize: '9px', color: '#4b5563', margin: '0', lineHeight: '1.4' }}>
                      {safeRender(item.activity || item)}
                    </p>
                  )}
                </div>
              ))}
            </div>
          </div>
        );
      })()}

      {/* Recommended Projects (if available) */}
      {roadmap.projects && roadmap.projects.length > 0 && (
        <div style={{ marginTop: '10px' }}>
          <h3 style={printStyles.subTitle}>Recommended Projects & Experiences</h3>
          <div style={printStyles.twoCol}>
            {roadmap.projects.map((project, idx) => (
              <div key={idx} style={printStyles.card}>
                <div style={{ fontWeight: 'bold', fontSize: '10px', color: '#1e293b', marginBottom: '4px' }}>
                  {safeRender(project.title || project.name || project)}
                </div>
                {(project.description || project.purpose) && (
                  <p style={{ fontSize: '9px', color: '#4b5563', margin: '0 0 6px 0', lineHeight: '1.4' }}>
                    {project.description || project.purpose}
                  </p>
                )}
                {project.output && (
                  <p style={{ fontSize: '8px', color: '#059669', margin: '0 0 4px 0', lineHeight: '1.4' }}>
                    <strong>Output:</strong> {safeRender(project.output)}
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

      {/* Internship Preparation */}
      {roadmap.internship && (
        <div style={{ marginTop: '10px' }}>
          <h3 style={printStyles.subTitle}>Internship Preparation</h3>
          <div style={printStyles.card}>
            {roadmap.internship.types && roadmap.internship.types.length > 0 && (
              <div style={{ marginBottom: '8px' }}>
                <div style={{ fontWeight: 'bold', fontSize: '10px', color: '#1e293b', marginBottom: '4px' }}>Recommended Internship Types:</div>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
                  {roadmap.internship.types.map((type, idx) => (
                    <span key={idx} style={{ ...printStyles.badge, background: '#dbeafe', color: '#1e40af', border: '1px solid #93c5fd' }}>
                      {safeRender(type)}
                    </span>
                  ))}
                </div>
              </div>
            )}
            {(roadmap.internship.timeline || roadmap.internship.timing) && (
              <p style={{ fontSize: '8px', color: '#4b5563', margin: '0 0 8px 0', lineHeight: '1.4' }}>
                <strong>Timeline:</strong> {safeRender(roadmap.internship.timeline || roadmap.internship.timing)}
              </p>
            )}
            {roadmap.internship.preparation && (
              <div>
                <div style={{ fontWeight: 'bold', fontSize: '8px', color: '#1e293b', marginBottom: '4px' }}>Preparation Tips:</div>
                <ul style={{ margin: '0', paddingLeft: '14px', fontSize: '8px', color: '#4b5563', lineHeight: '1.5' }}>
                  {Object.entries(roadmap.internship.preparation).map(([key, value]) => (
                    <li key={key}>
                      <strong>{key.charAt(0).toUpperCase() + key.slice(1)}:</strong> {safeRender(value)}
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Resources & Opportunities (if available) */}
      {roadmap.exposure && (
        <div style={{ marginTop: '10px' }}>
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

            {roadmap.exposure.certifications && roadmap.exposure.certifications.length > 0 && (
              <div style={printStyles.card}>
                <div style={{ fontWeight: 'bold', fontSize: '10px', color: '#1e293b', marginBottom: '6px' }}>
                  Certifications to Pursue
                </div>
                <ul style={{ margin: '0', paddingLeft: '15px', fontSize: '9px', color: '#4b5563', lineHeight: '1.5' }}>
                  {roadmap.exposure.certifications.map((cert, idx) => (
                    <li key={idx}>{safeRender(cert)}</li>
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
      <p style={{ fontSize: '10px', color: '#6b7280', marginBottom: '8px', lineHeight: '1.5' }}>
        Based on your assessment results, interests, and aptitudes, here are the top degree programs that align with your profile:
      </p>

      {topCourses.map((course, index) => (
        <div key={index} style={{ 
          ...printStyles.card, 
          marginBottom: '6px',
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
        marginTop: '8px', 
        padding: '8px', 
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

/**
 * CharacterStrengthsSection Component
 * Renders character strengths, growth areas, and strength descriptions
 */
const CharacterStrengthsSection = ({ characterStrengths }) => {
  if (!characterStrengths) return null;

  const { topStrengths, growthAreas, strengthDescriptions } = characterStrengths;
  const hasContent = (topStrengths && topStrengths.length > 0) ||
    (growthAreas && growthAreas.length > 0) ||
    (strengthDescriptions && strengthDescriptions.length > 0);

  if (!hasContent) return null;

  return (
    <>
      <h2 style={{ ...printStyles.sectionTitle, marginTop: '12px' }}>Character Strengths</h2>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px', marginBottom: '10px' }}>
        {/* Top Strengths */}
        {topStrengths && topStrengths.length > 0 && (
          <div style={{ ...printStyles.card, background: '#f0fdf4', border: '1px solid #86efac' }}>
            <div style={{ fontWeight: 'bold', fontSize: '10px', color: '#166534', marginBottom: '6px' }}>⭐ Top Strengths</div>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '4px' }}>
              {topStrengths.map((strength, idx) => (
                <span key={idx} style={{ ...printStyles.badge, background: '#dcfce7', color: '#166534', border: '1px solid #86efac' }}>
                  ★ {safeRender(strength)}
                </span>
              ))}
            </div>
          </div>
        )}

        {/* Growth Areas */}
        {growthAreas && growthAreas.length > 0 && (
          <div style={{ ...printStyles.card, background: '#fefce8', border: '1px solid #fde68a' }}>
            <div style={{ fontWeight: 'bold', fontSize: '10px', color: '#854d0e', marginBottom: '6px' }}>📈 Growth Areas</div>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '4px' }}>
              {growthAreas.map((area, idx) => (
                <span key={idx} style={{ ...printStyles.badge, background: '#fef9c3', color: '#854d0e', border: '1px solid #fde047' }}>
                  → {safeRender(area)}
                </span>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Strength Descriptions with ratings */}
      {strengthDescriptions && strengthDescriptions.length > 0 && (
        <div style={printStyles.twoCol}>
          {strengthDescriptions.map((item, idx) => {
            const percentage = Math.round(((item.rating || 0) / 5) * 100);
            const scoreStyle = getScoreStyle(percentage);
            return (
              <div key={idx} style={printStyles.card}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '4px' }}>
                  <div style={{ fontWeight: 'bold', fontSize: '10px', color: '#1e293b' }}>
                    {safeRender(item.name)}
                  </div>
                  <span style={{ ...printStyles.badge, background: scoreStyle.bg, color: scoreStyle.color, border: `1px solid ${scoreStyle.border}` }}>
                    {item.rating}/5
                  </span>
                </div>
                <div style={printStyles.progressBar}>
                  <div style={{ width: `${percentage}%`, height: '100%', background: scoreStyle.color, borderRadius: '4px' }}></div>
                </div>
                {item.description && (
                  <p style={{ margin: '4px 0 0 0', fontSize: '8px', color: '#4b5563', lineHeight: '1.4' }}>
                    {safeRender(item.description)}
                  </p>
                )}
              </div>
            );
          })}
        </div>
      )}
    </>
  );
};

/**
 * OverallSummarySection Component
 * Renders the overall assessment summary
 */
const OverallSummarySection = ({ overallSummary }) => {
  if (!overallSummary) return null;

  return (
    <div style={{ marginTop: '10px', marginBottom: '10px' }}>
      <h2 style={printStyles.sectionTitle}>Overall Assessment Summary</h2>
      <div style={{ ...printStyles.card, background: 'linear-gradient(135deg, #eff6ff 0%, #dbeafe 100%)', border: '2px solid #3b82f6', pageBreakInside: 'avoid' }}>
        <p style={{ margin: '0', fontSize: '10px', lineHeight: '1.6', color: '#1e293b' }}>
          {safeRender(overallSummary)}
        </p>
      </div>
    </div>
  );
};

/**
 * ProfileSnapshotSection Component
 * Renders the student's profile snapshot with key patterns and aptitude strengths
 */
const ProfileSnapshotSection = ({ profileSnapshot }) => {
  if (!profileSnapshot) return null;

  const patternIcons = {
    strength: '💪',
    enjoyment: '😊',
    readiness: '✅',
    workStyle: '🔧',
    motivation: '🎯',
    preparation: '📋'
  };

  const patternLabels = {
    strength: 'Your Strengths',
    enjoyment: 'What You Enjoy',
    readiness: 'Career Readiness',
    workStyle: 'Work Style',
    motivation: 'What Drives You',
    preparation: 'Academic Preparation'
  };

  return (
    <div style={{ marginTop: '10px', marginBottom: '10px' }}>
      <h2 style={printStyles.sectionTitle}>Your Profile Snapshot</h2>

      {profileSnapshot.streamFitSummary && (
        <div style={{ ...printStyles.card, marginBottom: '8px', background: '#eff6ff', border: '2px solid #3b82f6' }}>
          <p style={{ margin: '0', fontSize: '10px', lineHeight: '1.5', color: '#1e40af', fontWeight: '600' }}>
            {safeRender(profileSnapshot.streamFitSummary)}
          </p>
        </div>
      )}

      {profileSnapshot.keyPatterns && Object.keys(profileSnapshot.keyPatterns).length > 0 && (
        <div style={{ marginBottom: '8px' }}>
          <h3 style={printStyles.subTitle}>Key Insights About You</h3>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '6px' }}>
            {Object.entries(profileSnapshot.keyPatterns).map(([key, value]) => (
              <div key={key} style={{ ...printStyles.card, pageBreakInside: 'avoid' }}>
                <div style={{ display: 'flex', alignItems: 'flex-start', gap: '6px' }}>
                  <span style={{ fontSize: '12px', flexShrink: 0 }}>{patternIcons[key] || '📌'}</span>
                  <div>
                    <div style={{ fontWeight: 'bold', fontSize: '9px', color: '#1e293b', marginBottom: '2px' }}>
                      {patternLabels[key] || key.charAt(0).toUpperCase() + key.slice(1)}
                    </div>
                    <p style={{ margin: '0', fontSize: '8px', lineHeight: '1.4', color: '#4b5563' }}>
                      {safeRender(value)}
                    </p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {profileSnapshot.aptitudeStrengths && profileSnapshot.aptitudeStrengths.length > 0 && (
        <div style={{ marginBottom: '8px' }}>
          <h3 style={printStyles.subTitle}>Aptitude Strengths</h3>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
            {profileSnapshot.aptitudeStrengths.map((item, idx) => (
              <span key={idx} style={{ ...printStyles.badge, background: '#dcfce7', color: '#166534', border: '1px solid #86efac', fontSize: '9px', padding: '4px 10px' }}>
                {safeRender(typeof item === 'string' ? item : `${item.name} (${item.percentile})`)}
              </span>
            ))}
          </div>
        </div>
      )}

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
        {profileSnapshot.uniqueStrengths && profileSnapshot.uniqueStrengths.length > 0 && (
          <div style={{ ...printStyles.card, background: '#f0fdf4', border: '1px solid #86efac' }}>
            <div style={{ fontWeight: 'bold', fontSize: '9px', color: '#166534', marginBottom: '6px' }}>🌟 Unique Strengths</div>
            {profileSnapshot.uniqueStrengths.map((strength, idx) => (
              <div key={idx} style={{ display: 'flex', alignItems: 'center', gap: '4px', marginBottom: '3px' }}>
                <span style={{ fontSize: '8px', color: '#059669' }}>✓</span>
                <span style={{ fontSize: '9px', color: '#374151' }}>{safeRender(strength)}</span>
              </div>
            ))}
          </div>
        )}
        {profileSnapshot.developmentAreas && profileSnapshot.developmentAreas.length > 0 && (
          <div style={{ ...printStyles.card, background: '#fefce8', border: '1px solid #fde68a' }}>
            <div style={{ fontWeight: 'bold', fontSize: '9px', color: '#854d0e', marginBottom: '6px' }}>📈 Areas to Develop</div>
            {profileSnapshot.developmentAreas.map((area, idx) => (
              <div key={idx} style={{ display: 'flex', alignItems: 'center', gap: '4px', marginBottom: '3px' }}>
                <span style={{ fontSize: '8px', color: '#d97706' }}>→</span>
                <span style={{ fontSize: '9px', color: '#374151' }}>{safeRender(area)}</span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

/**
 * FinalNoteSection Component
 * Renders the encouraging final note with advantage, focus area, and encouragement
 */
const FinalNoteSection = ({ finalNote }) => {
  if (!finalNote) return null;

  return (
    <div style={{ marginTop: '10px', marginBottom: '10px' }}>
      <h2 style={printStyles.sectionTitle}>A Message for You</h2>
      <div style={{
        ...printStyles.card,
        background: '#eff6ff',
        border: '2px solid #3b82f6',
        padding: '12px',
        pageBreakInside: 'avoid'
      }}>
        {finalNote.advantage && (
          <div style={{ marginBottom: '8px' }}>
            <div style={{ fontWeight: 'bold', fontSize: '10px', color: '#1e40af', marginBottom: '4px' }}>
              💪 Your Competitive Advantage
            </div>
            <p style={{ margin: '0', fontSize: '9px', lineHeight: '1.5', color: '#1e293b' }}>
              {safeRender(finalNote.advantage)}
            </p>
          </div>
        )}

        {(finalNote.focusArea || finalNote.growthFocus) && (
          <div style={{ marginBottom: '8px' }}>
            <div style={{ fontWeight: 'bold', fontSize: '10px', color: '#059669', marginBottom: '4px' }}>
              🎯 Key Focus Area
            </div>
            <p style={{ margin: '0', fontSize: '9px', lineHeight: '1.5', color: '#1e293b' }}>
              {safeRender(finalNote.focusArea || finalNote.growthFocus)}
            </p>
          </div>
        )}

        {finalNote.nextReview && (
          <div style={{ marginBottom: '8px' }}>
            <div style={{ fontWeight: 'bold', fontSize: '10px', color: '#6b7280', marginBottom: '4px' }}>
              📅 Next Review
            </div>
            <p style={{ margin: '0', fontSize: '9px', lineHeight: '1.5', color: '#1e293b' }}>
              {safeRender(finalNote.nextReview)}
            </p>
          </div>
        )}

        {finalNote.encouragement && (
          <div style={{
            background: '#fefce8',
            border: '1px solid #fde68a',
            borderRadius: '6px',
            padding: '8px',
            textAlign: 'center'
          }}>
            <p style={{ margin: '0', fontSize: '10px', lineHeight: '1.5', color: '#854d0e', fontWeight: '600', fontStyle: 'italic' }}>
              ✨ {safeRender(finalNote.encouragement)}
            </p>
          </div>
        )}
      </div>
    </div>
  );
};

/**
 * TimingAnalysisSection Component
 * Renders assessment timing insights: pace, decision style, section insights
 */
const TimingAnalysisSection = ({ timingAnalysis }) => {
  if (!timingAnalysis) return null;

  const paceColors = {
    'Quick': { bg: '#dcfce7', color: '#166534', border: '#86efac' },
    'Moderate': { bg: '#dbeafe', color: '#1e40af', border: '#93c5fd' },
    'Deliberate': { bg: '#fef9c3', color: '#854d0e', border: '#fde047' },
    'Slow': { bg: '#fee2e2', color: '#991b1b', border: '#fca5a5' }
  };

  const confidenceColors = {
    'High': { bg: '#dcfce7', color: '#166534', border: '#86efac' },
    'Medium': { bg: '#fef9c3', color: '#854d0e', border: '#fde047' },
    'Low': { bg: '#fee2e2', color: '#991b1b', border: '#fca5a5' }
  };

  return (
    <>
      <h2 style={{ ...printStyles.sectionTitle, marginTop: '12px' }}>Assessment Insights</h2>

      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px', marginBottom: '10px' }}>
        {timingAnalysis.overallPace && (() => {
          const colors = paceColors[timingAnalysis.overallPace] || paceColors['Moderate'];
          return (
            <div style={{ ...printStyles.card, flex: '1', minWidth: '120px', textAlign: 'center' }}>
              <div style={{ fontSize: '8px', color: '#6b7280', marginBottom: '4px' }}>Overall Pace</div>
              <span style={{ ...printStyles.badge, background: colors.bg, color: colors.color, border: `1px solid ${colors.border}`, fontSize: '10px', fontWeight: 'bold' }}>
                {timingAnalysis.overallPace}
              </span>
            </div>
          );
        })()}
        {timingAnalysis.decisionStyle && (
          <div style={{ ...printStyles.card, flex: '1', minWidth: '120px', textAlign: 'center' }}>
            <div style={{ fontSize: '8px', color: '#6b7280', marginBottom: '4px' }}>Decision Style</div>
            <span style={{ ...printStyles.badge, background: '#dbeafe', color: '#1e40af', border: '1px solid #93c5fd', fontSize: '10px', fontWeight: 'bold' }}>
              {timingAnalysis.decisionStyle}
            </span>
          </div>
        )}
        {timingAnalysis.confidenceIndicator && (() => {
          const colors = confidenceColors[timingAnalysis.confidenceIndicator] || confidenceColors['Medium'];
          return (
            <div style={{ ...printStyles.card, flex: '1', minWidth: '120px', textAlign: 'center' }}>
              <div style={{ fontSize: '8px', color: '#6b7280', marginBottom: '4px' }}>Confidence</div>
              <span style={{ ...printStyles.badge, background: colors.bg, color: colors.color, border: `1px solid ${colors.border}`, fontSize: '10px', fontWeight: 'bold' }}>
                {timingAnalysis.confidenceIndicator}
              </span>
            </div>
          );
        })()}
      </div>

      {timingAnalysis.recommendation && (
        <div style={{ ...printStyles.card, background: '#eff6ff', border: '1px solid #bfdbfe', marginBottom: '10px' }}>
          <p style={{ margin: '0', fontSize: '9px', lineHeight: '1.5', color: '#1e40af' }}>
            {safeRender(timingAnalysis.recommendation)}
          </p>
        </div>
      )}

      {timingAnalysis.sectionInsights && Object.keys(timingAnalysis.sectionInsights).length > 0 && (
        <div>
          <h3 style={printStyles.subTitle}>Section-wise Insights</h3>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '6px' }}>
            {Object.entries(timingAnalysis.sectionInsights).map(([section, insight]) => (
              <div key={section} style={{ ...printStyles.card, pageBreakInside: 'avoid' }}>
                <div style={{ fontWeight: 'bold', fontSize: '9px', color: '#1e293b', marginBottom: '3px', textTransform: 'capitalize' }}>
                  {section.replace(/_/g, ' ')}
                </div>
                <p style={{ margin: '0', fontSize: '8px', lineHeight: '1.4', color: '#4b5563' }}>
                  {safeRender(insight)}
                </p>
              </div>
            ))}
          </div>
        </div>
      )}
    </>
  );
};

/**
 * AdaptiveAptitudeResultsSection Component
 * Renders detailed adaptive aptitude breakdown: accuracy by subtag, difficulty, overall stats
 */
const AdaptiveAptitudeResultsSection = ({ adaptiveAptitudeResults }) => {
  if (!adaptiveAptitudeResults) return null;

  const avgResponseSec = adaptiveAptitudeResults.averageResponseTimeMs
    ? (adaptiveAptitudeResults.averageResponseTimeMs / 1000).toFixed(1)
    : null;

  const tierLabels = { H: 'High', M: 'Medium', L: 'Low' };
  const tierColors = {
    H: { bg: '#dcfce7', color: '#166534', border: '#86efac' },
    M: { bg: '#fef9c3', color: '#854d0e', border: '#fde047' },
    L: { bg: '#fee2e2', color: '#991b1b', border: '#fca5a5' }
  };
  const tier = adaptiveAptitudeResults.tier || '';
  const tColors = tierColors[tier] || tierColors['M'];

  return (
    <>
      <h2 style={{ ...printStyles.sectionTitle, marginTop: '12px' }}>Adaptive Aptitude Assessment</h2>

      {/* Summary Stats */}
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px', marginBottom: '10px' }}>
        {tier && (
          <div style={{ ...printStyles.card, flex: '1', minWidth: '90px', textAlign: 'center' }}>
            <div style={{ fontSize: '8px', color: '#6b7280', marginBottom: '4px' }}>Tier</div>
            <span style={{ ...printStyles.badge, background: tColors.bg, color: tColors.color, border: `1px solid ${tColors.border}`, fontSize: '10px', fontWeight: 'bold' }}>
              {tierLabels[tier] || tier}
            </span>
          </div>
        )}
        {adaptiveAptitudeResults.overallAccuracy != null && (
          <div style={{ ...printStyles.card, flex: '1', minWidth: '90px', textAlign: 'center' }}>
            <div style={{ fontSize: '8px', color: '#6b7280', marginBottom: '4px' }}>Overall Accuracy</div>
            <div style={{ fontSize: '16px', fontWeight: 'bold', color: '#0369a1' }}>
              {Math.round(adaptiveAptitudeResults.overallAccuracy)}%
            </div>
          </div>
        )}
        {adaptiveAptitudeResults.totalCorrect != null && adaptiveAptitudeResults.totalQuestions != null && (
          <div style={{ ...printStyles.card, flex: '1', minWidth: '90px', textAlign: 'center' }}>
            <div style={{ fontSize: '8px', color: '#6b7280', marginBottom: '4px' }}>Score</div>
            <div style={{ fontSize: '16px', fontWeight: 'bold', color: '#1e293b' }}>
              {adaptiveAptitudeResults.totalCorrect}/{adaptiveAptitudeResults.totalQuestions}
            </div>
          </div>
        )}
        {avgResponseSec && (
          <div style={{ ...printStyles.card, flex: '1', minWidth: '90px', textAlign: 'center' }}>
            <div style={{ fontSize: '8px', color: '#6b7280', marginBottom: '4px' }}>Avg Response</div>
            <div style={{ fontSize: '16px', fontWeight: 'bold', color: '#1e293b' }}>
              {avgResponseSec}s
            </div>
          </div>
        )}
        {adaptiveAptitudeResults.pathClassification && (
          <div style={{ ...printStyles.card, flex: '1', minWidth: '90px', textAlign: 'center' }}>
            <div style={{ fontSize: '8px', color: '#6b7280', marginBottom: '4px' }}>Path</div>
            <span style={{ ...printStyles.badge, background: '#e0e7ff', color: '#4338ca', border: '1px solid #a5b4fc', fontSize: '9px', fontWeight: '600', textTransform: 'capitalize' }}>
              {adaptiveAptitudeResults.pathClassification}
            </span>
          </div>
        )}
      </div>

      {/* Accuracy by Subtag */}
      {adaptiveAptitudeResults.accuracyBySubtag && Object.keys(adaptiveAptitudeResults.accuracyBySubtag).length > 0 && (
        <div style={{ marginBottom: '10px' }}>
          <h3 style={printStyles.subTitle}>Accuracy by Cognitive Area</h3>
          <table style={printStyles.table}>
            <thead>
              <tr>
                <th style={printStyles.th}>Cognitive Area</th>
                <th style={{ ...printStyles.th, width: '80px', textAlign: 'center' }}>Score</th>
                <th style={{ ...printStyles.th, width: '140px' }}>Accuracy</th>
              </tr>
            </thead>
            <tbody>
              {Object.entries(adaptiveAptitudeResults.accuracyBySubtag)
                .sort(([, a], [, b]) => (b.accuracy || 0) - (a.accuracy || 0))
                .map(([subtag, data]) => {
                  const accuracy = Math.round(data.accuracy || 0);
                  const scoreStyle = getScoreStyle(accuracy);
                  return (
                    <tr key={subtag}>
                      <td style={printStyles.td}>
                        <span style={{ fontWeight: '600', fontSize: '10px', textTransform: 'capitalize' }}>
                          {subtag.replace(/_/g, ' ')}
                        </span>
                      </td>
                      <td style={{ ...printStyles.td, textAlign: 'center', fontWeight: '600' }}>
                        {data.correct || 0}/{data.total || 0}
                      </td>
                      <td style={printStyles.td}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                          <div style={{ flex: 1 }}>
                            <div style={printStyles.progressBar}>
                              <div style={{ width: `${accuracy}%`, height: '100%', background: accuracy >= 70 ? '#22c55e' : accuracy >= 40 ? '#eab308' : '#ef4444', borderRadius: '4px' }}></div>
                            </div>
                          </div>
                          <span style={{ ...printStyles.badge, background: scoreStyle.bg, color: scoreStyle.color, border: `1px solid ${scoreStyle.border}` }}>
                            {accuracy}%
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

      {/* Accuracy by Difficulty */}
      {adaptiveAptitudeResults.accuracyByDifficulty && Object.keys(adaptiveAptitudeResults.accuracyByDifficulty).length > 0 && (
        <div>
          <h3 style={printStyles.subTitle}>Performance by Difficulty Level</h3>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
            {Object.entries(adaptiveAptitudeResults.accuracyByDifficulty)
              .sort(([a], [b]) => Number(a) - Number(b))
              .map(([level, data]) => {
                const accuracy = Math.round(data.accuracy || 0);
                const scoreStyle = getScoreStyle(accuracy);
                return (
                  <div key={level} style={{ ...printStyles.card, flex: '1', minWidth: '80px', textAlign: 'center' }}>
                    <div style={{ fontSize: '8px', color: '#6b7280', marginBottom: '2px' }}>Level {level}</div>
                    <div style={{ fontSize: '14px', fontWeight: 'bold', color: scoreStyle.color, marginBottom: '2px' }}>
                      {accuracy}%
                    </div>
                    <div style={{ fontSize: '8px', color: '#6b7280' }}>
                      {data.correct || 0}/{data.total || 0}
                    </div>
                  </div>
                );
              })}
          </div>
        </div>
      )}
    </>
  );
};

export default PrintViewCollege;
