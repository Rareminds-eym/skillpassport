/**
 * PrintViewHigherSecondary Component
 * Grade-level-specific print view for Higher Secondary and Post-12th students (Grades 11-12)
 * Requirements: 1.2, 2.2 - Test-based scores with correct/total format
 */

import CoverPage from './CoverPage';
import { printStyles } from './shared/styles';
import {
  safeRender,
  getSafeStudentInfo,
  getScoreStyle,
  riasecDescriptions,
  defaultRiasecNames,
  defaultTraitNames,
} from './shared/utils';
import RiasecIcon from './shared/RiasecIcon';
import PrintStyles from './shared/PrintStyles';
import Watermarks, {
  DataPrivacyNotice,
  ReportDisclaimer,
  RepeatingHeader,
  RepeatingFooter,
} from './shared/Watermarks';
import DetailedAssessmentBreakdown from './shared/DetailedAssessmentBreakdown';

/**
 * PrintViewHigherSecondary Component
 * Renders assessment report for higher secondary and post-12th students
 * 
 * @param {Object} props - Component props
 * @param {Object} props.results - Assessment results data
 * @param {Object} props.studentInfo - Student information
 * @param {Object} props.riasecNames - RIASEC code to name mapping (optional)
 * @param {Object} props.traitNames - Big Five trait names mapping (optional)
 * @param {Array} props.courseRecommendations - Course/program recommendations (optional)
 * @param {Object} props.streamRecommendation - Stream recommendation for after10 students (optional)
 * @param {Object} props.studentAcademicData - Student academic data (optional)
 * @returns {JSX.Element} - Print view component
 */
const PrintViewHigherSecondary = ({ 
  results, 
  studentInfo, 
  riasecNames, 
  traitNames,
  courseRecommendations,
  streamRecommendation,
  studentAcademicData
}) => {
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
      console.log('🔧 PDF PrintViewHigherSecondary: Normalizing RIASEC scores from _originalScores');
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
  const { riasec, aptitude, bigFive, workValues, employability, careerFit, skillGap, roadmap, finalNote, profileSnapshot, overallSummary, knowledge } = normalizedResults;
  const characterStrengths = normalizedResults.characterStrengths || normalizedResults.gemini_results?.characterStrengths;
  const learningStyle = normalizedResults.learningStyle || normalizedResults.gemini_results?.learningStyle;
  const timingAnalysis = normalizedResults.timingAnalysis || normalizedResults.gemini_results?.timingAnalysis;
  const adaptiveAptitudeResults = normalizedResults.adaptiveAptitudeResults || normalizedResults.gemini_results?.adaptiveAptitudeResults;
  const dbCourseRecommendations = normalizedResults.courseRecommendations || normalizedResults.platformCourses || normalizedResults.gemini_results?.courseRecommendations || normalizedResults.gemini_results?.platformCourses;

  // Safe student info with defaults
  const safeStudentInfo = getSafeStudentInfo(studentInfo);

  // Safe RIASEC names with defaults
  const safeRiasecNames = riasecNames || defaultRiasecNames;

  // Safe trait names with defaults
  const safeTraitNames = traitNames || defaultTraitNames;

  return (
    <div className="print-view" style={{ background: 'white', position: 'relative' }}>
      {/* Print-specific CSS styles */}
      <PrintStyles />

      {/* Cover Page */}
      <CoverPage studentInfo={safeStudentInfo} />

      {/* Watermarks */}
      <Watermarks />

      {/* Paginated Content - Optimized to prevent empty pages */}
      <div className="print-pages">
        {/* Page 1: Cover already handled above */}
        
        {/* Content flows naturally - only break where absolutely necessary */}
        <div style={{ padding: '0' }}>
          <DataPrivacyNotice />
          
          {/* Stream Recommendation - Before Profile Snapshot */}
          {streamRecommendation && streamRecommendation.recommendedStream && (
            <StreamRecommendationSection streamRecommendation={streamRecommendation} />
          )}
          
          <h2 style={printStyles.sectionTitle}>1. Student Profile Snapshot</h2>
          <InterestProfileSection riasec={riasec} safeRiasecNames={safeRiasecNames} />
          
          {/* Cognitive Abilities */}
          {aptitude && (
            <CognitiveAbilitiesSection aptitude={aptitude} />
          )}
          
          {/* Big Five - no forced break, let it flow */}
          {bigFive && (
            <BigFivePersonalitySection bigFive={bigFive} safeTraitNames={safeTraitNames} />
          )}
          
          {/* Work Values */}
          {workValues && (
            <WorkValuesSection workValues={workValues} />
          )}
          
          {/* Employability - flows naturally */}
          {employability && (
            <EmployabilitySkillsSection employability={employability} />
          )}
          
          {/* Career Fit - flows naturally */}
          {careerFit && (
            <CareerFitAnalysisSection careerFit={careerFit} />
          )}
          
          {/* Skill Gap & Roadmap - Combined as one continuous section */}
          {skillGap && (
            <SkillGapDevelopmentSection skillGap={skillGap} />
          )}
          
          {roadmap && (
            <DevelopmentRoadmapSection roadmap={roadmap} />
          )}
          
          {dbCourseRecommendations && dbCourseRecommendations.length > 0 && (
            <CourseRecommendationsSection courseRecommendations={dbCourseRecommendations} />
          )}

          {/* Overall Summary */}
          {overallSummary && (
            <OverallSummarySection overallSummary={overallSummary} />
          )}

          {/* Profile Snapshot */}
          {profileSnapshot && (
            <ProfileSnapshotSection profileSnapshot={profileSnapshot} />
          )}

          {/* Final Note */}
          {finalNote && (
            <FinalNoteSection finalNote={finalNote} />
          )}

          {knowledge && Object.keys(knowledge).length > 0 && (
            <KnowledgeAssessmentSection knowledge={knowledge} />
          )}
          {characterStrengths && <CharacterStrengthsSection characterStrengths={characterStrengths} />}
          {learningStyle && <LearningStylesSection learningStyle={learningStyle} />}
          {timingAnalysis && <TimingAnalysisSection timingAnalysis={timingAnalysis} />}
          {adaptiveAptitudeResults && <AdaptiveAptitudeResultsSection adaptiveAptitudeResults={adaptiveAptitudeResults} />}
          
          <DetailedAssessmentBreakdown 
            results={normalizedResults} 
            riasecNames={safeRiasecNames}
            gradeLevel="after10"
          />
          
          <ReportDisclaimer />
        </div>
      </div>

      {/* Screen-only continuous content (hidden in print) */}
      <div className="print-content" style={{ position: 'relative', zIndex: 1, paddingBottom: '40px' }}>
        <DataPrivacyNotice />
        
        {/* Stream Recommendation - Before Profile Snapshot */}
        {streamRecommendation && streamRecommendation.recommendedStream && (
          <StreamRecommendationSection streamRecommendation={streamRecommendation} />
        )}
        
        {/* COMMENTED OUT: Already showing on page 1 in print view */}
        {/* <h2 style={printStyles.sectionTitle}>1. Student Profile Snapshot</h2>
        <InterestProfileSection riasec={riasec} safeRiasecNames={safeRiasecNames} /> */}
        {aptitude && (
          <CognitiveAbilitiesSection aptitude={aptitude} />
        )}
        {bigFive && (
          <BigFivePersonalitySection bigFive={bigFive} safeTraitNames={safeTraitNames} />
        )}
        {workValues && (
          <WorkValuesSection workValues={workValues} />
        )}
        {careerFit && (
          <CareerFitAnalysisSection careerFit={careerFit} />
        )}
        {skillGap && (
          <SkillGapDevelopmentSection skillGap={skillGap} />
        )}
        
        {roadmap && (
          <DevelopmentRoadmapSection roadmap={roadmap} />
        )}
        {dbCourseRecommendations && dbCourseRecommendations.length > 0 && (
          <CourseRecommendationsSection courseRecommendations={dbCourseRecommendations} />
        )}

        {/* Overall Summary */}
        {overallSummary && (
          <OverallSummarySection overallSummary={overallSummary} />
        )}

        {/* Profile Snapshot */}
        {profileSnapshot && (
          <ProfileSnapshotSection profileSnapshot={profileSnapshot} />
        )}

        {/* Final Note */}
        {finalNote && (
          <FinalNoteSection finalNote={finalNote} />
        )}

        {knowledge && Object.keys(knowledge).length > 0 && (
          <KnowledgeAssessmentSection knowledge={knowledge} />
        )}
        {characterStrengths && <CharacterStrengthsSection characterStrengths={characterStrengths} />}
        {learningStyle && <LearningStylesSection learningStyle={learningStyle} />}
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
 * Requirements: 1.2, 2.4 - Interest Profile with RIASEC scores
 */
const InterestProfileSection = ({ riasec, safeRiasecNames }) => {
  if (!riasec || !riasec.scores) return null;

  // 🔧 CRITICAL FIX: Use _originalScores if riasec.scores are all zeros
  let scores = riasec.scores || {};
  const allZeros = Object.values(scores).every(score => score === 0);
  if (allZeros && riasec._originalScores && Object.keys(riasec._originalScores).length > 0) {
    console.log('🔧 PDF InterestProfile (HigherSecondary): Using _originalScores instead of zeros');
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
        padding: '0',
        marginTop: '0',
        marginBottom: '0',
        minHeight: '160px'
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
              { x1: '14%', y1: '55%', x2: '50%', y2: '75%' },
              { x1: '50%', y1: '25%', x2: '50%', y2: '75%' },
              { x1: '86%', y1: '55%', x2: '50%', y2: '75%' }
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
          <line x1="14%" y1="25%" x2="14%" y2="55%" stroke="#000000" strokeWidth="1" strokeDasharray="2,4" strokeLinecap="round" />
          <line x1="86%" y1="25%" x2="86%" y2="55%" stroke="#000000" strokeWidth="1" strokeDasharray="2,4" strokeLinecap="round" />
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
                <div style={{ fontWeight: 'bold', fontSize: '10px', color: '#1e293b', marginBottom: '3px' }}>
                  {safeRiasecNames[code]} ({code})
                </div>
                <p style={{ fontSize: '8px', color: '#4b5563', margin: '0 0 6px 0', lineHeight: '1.2' }}>
                  {riasecDescriptions[code]}
                </p>
                <div style={{
                  display: 'inline-block',
                  padding: '3px 10px',
                  background: '#e0f2fe',
                  borderRadius: '12px',
                  fontSize: '9px',
                  fontWeight: '600',
                  color: '#0369a1',
                  marginBottom: '6px'
                }}>
                  {score}/{maxScore}
                </div>
                <div style={{ display: 'flex', justifyContent: 'center', position: 'relative' }}>
                  <div style={{
                    width: '60px',
                    height: '60px',
                    borderRadius: '50%',
                    border: '2px solid #1e3a5f',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    background: 'white'
                  }}>
                    <RiasecIcon code={code} size={36} />
                  </div>
                  <div style={{
                    position: 'absolute',
                    bottom: '-4px',
                    left: '50%',
                    transform: 'translateX(-50%)',
                    width: '7px',
                    height: '7px',
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
          bottom: '5px',
          left: '50%',
          transform: 'translateX(-50%)',
          textAlign: 'center',
          zIndex: 1
        }}>
          <div style={{
            width: '85px',
            height: '85px',
            borderRadius: '50%',
            border: '3px dashed #1e3a5f',
            background: 'white',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            boxShadow: '0 2px 8px rgba(0,0,0,0.1)'
          }}>
            <div style={{ fontSize: '13px', fontWeight: 'bold', color: '#000000', marginBottom: '2px' }}>
              RIASEC
            </div>
            <div style={{ fontSize: '8px', color: '#000000' }}>
              Interest
            </div>
            <div style={{ fontSize: '8px', color: '#000000' }}>
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
        lineHeight: '1.4',
        marginTop: '3px',
        marginBottom: '6px',
        textAlign: 'left'
      }}>
        <strong>Your Top Interests:</strong> {topInterestsText}.{riasec.interpretation ? ` ${safeRender(riasec.interpretation)}` : ''}
      </div>
    </div>
  );
};

/**
 * CognitiveAbilitiesSection Component
 * Renders aptitude test scores with correct/total format
 * Requirements: 1.2, 2.2 - Cognitive abilities with test-based scores
 */
const CognitiveAbilitiesSection = ({ aptitude }) => {
  if (!aptitude || !aptitude.scores) return null;

  return (
    <>
      <h2 style={{ ...printStyles.sectionTitle, marginTop: '0' }}>2. Cognitive Abilities</h2>

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

      {/* Top Strengths */}
      {aptitude.topStrengths && aptitude.topStrengths.length > 0 && (
        <div style={{ marginBottom: '8px' }}>
          <span style={{ fontSize: '9px', fontWeight: 'bold', color: '#166534' }}>Top Strengths: </span>
          {aptitude.topStrengths.map((strength, idx) => (
            <span key={idx} style={{ ...printStyles.badge, background: '#dcfce7', color: '#166534', border: '1px solid #86efac', marginRight: '4px' }}>
              {safeRender(strength)}
            </span>
          ))}
        </div>
      )}

      {/* Areas to Improve */}
      {aptitude.areasToImprove && aptitude.areasToImprove.length > 0 && aptitude.areasToImprove.some(a => a.length > 20) && (
        <div style={{ marginBottom: '8px' }}>
          <span style={{ fontSize: '9px', fontWeight: 'bold', color: '#854d0e' }}>Areas to Improve: </span>
          {aptitude.areasToImprove.map((area, idx) => (
            <span key={idx} style={{ ...printStyles.badge, background: '#fef9c3', color: '#854d0e', border: '1px solid #fde047', marginRight: '4px' }}>
              {safeRender(area)}
            </span>
          ))}
        </div>
      )}

      <h3 style={printStyles.subTitle}>Aptitude Test Results</h3>

      <div style={printStyles.twoCol}>
        {Object.entries(aptitude.scores).map(([ability, scoreData]) => {
          const correct = scoreData.correct || 0;
          const total = scoreData.total || 0;
          const percentage = scoreData.percentage || (total > 0 ? Math.round((correct / total) * 100) : 0);
          const scoreStyle = getScoreStyle(percentage);

          return (
            <div key={ability} style={printStyles.card}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
                <div style={{ fontWeight: 'bold', fontSize: '10px', color: '#1e293b' }}>
                  {ability}
                </div>
                <span style={{
                  ...printStyles.badge,
                  background: scoreStyle.bg,
                  color: scoreStyle.color,
                  border: `1px solid ${scoreStyle.border}`
                }}>
                  {correct}/{total}
                </span>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <div style={{ flex: 1 }}>
                  <div style={printStyles.progressBar}>
                    <div style={{
                      width: `${percentage}%`,
                      height: '100%',
                      background: percentage >= 70 ? '#22c55e' : percentage >= 40 ? '#eab308' : '#ef4444',
                      borderRadius: '4px'
                    }}></div>
                  </div>
                </div>
                <span style={{ fontSize: '9px', fontWeight: '600', color: scoreStyle.color }}>
                  {percentage}%
                </span>
              </div>
            </div>
          );
        })}
      </div>

      {/* Career Implications */}
      {aptitude.careerImplications && aptitude.careerImplications.length > 60 && (
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
 * Renders Big Five personality traits with card-based layout
 * Requirements: 1.2 - Big Five personality traits
 */
const BigFivePersonalitySection = ({ bigFive, safeTraitNames }) => {
  if (!bigFive) return null;

  const traits = ['O', 'C', 'E', 'A', 'N'];
  const traitDescriptions = {
    O: 'Openness to Experience',
    C: 'Conscientiousness',
    E: 'Extraversion',
    A: 'Agreeableness',
    N: 'Neuroticism'
  };

  return (
    <>
      <h2 style={{ ...printStyles.sectionTitle, marginTop: '0' }}>3. Big Five Personality Traits</h2>

      <div style={printStyles.twoCol}>
        {traits.map((trait) => {
          const score = bigFive[trait] || 0;
          const percentage = Math.round((score / 5) * 100);
          const scoreStyle = getScoreStyle(percentage);

          return (
            <div key={trait} style={printStyles.card}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
                <div>
                  <div style={{ fontWeight: 'bold', fontSize: '10px', color: '#1e293b', marginBottom: '2px' }}>
                    {safeTraitNames[trait] || trait}
                  </div>
                  <div style={{ fontSize: '8px', color: '#6b7280' }}>
                    {traitDescriptions[trait]}
                  </div>
                </div>
                <span style={{
                  ...printStyles.badge,
                  background: scoreStyle.bg,
                  color: scoreStyle.color,
                  border: `1px solid ${scoreStyle.border}`,
                  fontSize: '10px',
                  fontWeight: 'bold'
                }}>
                  {percentage}%
                </span>
              </div>
              <div style={printStyles.progressBar}>
                <div style={{
                  width: `${percentage}%`,
                  height: '100%',
                  background: scoreStyle.color,
                  borderRadius: '4px'
                }}></div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Work Style Summary */}
      {bigFive.workStyleSummary && (
        <div style={{ ...printStyles.card, marginTop: '8px', background: '#f0f9ff', border: '1px solid #bae6fd' }}>
          <div style={{ fontWeight: 'bold', fontSize: '10px', color: '#0369a1', marginBottom: '6px' }}>
            Work Style Summary
          </div>
          <p style={{ margin: '0', fontSize: '9px', lineHeight: '1.5', color: '#475569' }}>
            {bigFive.workStyleSummary}
          </p>
        </div>
      )}
    </>
  );
};

/**
 * WorkValuesSection Component
 * Renders work values with priority indicators
 * Requirements: 1.2 - Work values for higher secondary students
 */
const WorkValuesSection = ({ workValues }) => {
  if (!workValues || !workValues.topThree || workValues.topThree.length === 0) return null;

  return (
    <>
      <h2 style={{ ...printStyles.sectionTitle, marginTop: '0' }}>4. Work Values</h2>
      <h3 style={printStyles.subTitle}>Your Top Work Motivations</h3>

      {workValues.motivationSummary && (
        <div style={{ ...printStyles.card, marginBottom: '10px', background: '#eff6ff', border: '1px solid #bfdbfe' }}>
          <p style={{ margin: '0', fontSize: '9px', lineHeight: '1.5', color: '#1e40af' }}>
            {safeRender(workValues.motivationSummary)}
          </p>
        </div>
      )}

      <div style={printStyles.twoCol}>
        {workValues.topThree.map((item, idx) => {
          const value = safeRender(item.value || item);
          const score = item.score || 0;
          const priorityLabels = ['High Priority', 'Medium Priority', 'Lower Priority'];
          const priorityColors = [
            { bg: '#dcfce7', color: '#166534', border: '#86efac' },
            { bg: '#fef9c3', color: '#854d0e', border: '#fde047' },
            { bg: '#dbeafe', color: '#1e40af', border: '#93c5fd' }
          ];
          const colors = priorityColors[idx] || priorityColors[2];

          return (
            <div key={idx} style={printStyles.card}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '4px' }}>
                <div style={{ fontWeight: 'bold', fontSize: '10px', color: '#1e293b' }}>
                  {value}
                </div>
                <span style={{
                  ...printStyles.badge,
                  background: colors.bg,
                  color: colors.color,
                  border: `1px solid ${colors.border}`
                }}>
                  {priorityLabels[idx]}
                </span>
              </div>
              {score > 0 && (
                <div style={{ fontSize: '9px', color: '#6b7280', marginBottom: item.description ? '4px' : '0' }}>
                  Score: {score}
                </div>
              )}
              {item.description && (
                <p style={{ fontSize: '8px', color: '#4b5563', margin: '0', lineHeight: '1.4', fontStyle: 'italic' }}>
                  {safeRender(item.description)}
                </p>
              )}
            </div>
          );
        })}
      </div>

      {/* Work Values Interpretation */}
      {workValues.interpretation && (
        <div style={{ ...printStyles.card, marginTop: '8px', background: '#f0f9ff', border: '1px solid #bae6fd' }}>
          <p style={{ margin: '0', fontSize: '9px', lineHeight: '1.5', color: '#0369a1' }}>
            {safeRender(workValues.interpretation)}
          </p>
        </div>
      )}
    </>
  );
};

/**
 * CareerFitAnalysisSection Component
 * Renders career clusters, roles with salary ranges, education paths, entrance exams,
 * evidence breakdown, and specific career options by fit level.
 * Requirements: 1.2 - Career fit analysis for higher secondary students
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

  const fitBadgeStyle = (fit) => {
    if (fit === 'High') return { bg: '#dcfce7', color: '#166534', border: '#86efac' };
    if (fit === 'Medium') return { bg: '#fef3c7', color: '#92400e', border: '#fde047' };
    return { bg: '#e0f2fe', color: '#1e40af', border: '#93c5fd' };
  };

  return (
    <>
      <h2 style={{ ...printStyles.sectionTitle, marginTop: '10px' }}>5. Career Fit Analysis</h2>

      {/* Career Clusters */}
      {hasClusters && (
        <div style={{ marginBottom: '8px' }}>
          <h3 style={printStyles.subTitle}>Career Paths That Match Your Profile</h3>
          {careerFit.clusters.map((cluster, idx) => {
            const badge = fitBadgeStyle(cluster.fit);
            return (
              <div key={idx} style={{ ...printStyles.card, marginBottom: '8px', pageBreakInside: 'avoid' }}>
                {/* Cluster Header */}
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
                  <div style={{ fontWeight: 'bold', fontSize: '11px', color: '#1e293b' }}>
                    {cluster.trackNumber ? `Track ${cluster.trackNumber}: ` : ''}{safeRender(cluster.title)}
                  </div>
                  <div style={{ display: 'flex', gap: '6px', alignItems: 'center' }}>
                    <span style={{
                      ...printStyles.badge,
                      background: badge.bg,
                      color: badge.color,
                      border: `1px solid ${badge.border}`
                    }}>
                      {cluster.fit} Fit
                    </span>
                    {cluster.matchScore > 0 && (
                      <span style={{ fontSize: '10px', fontWeight: 'bold', color: '#059669' }}>
                        {cluster.matchScore}%
                      </span>
                    )}
                  </div>
                </div>

                {/* Description */}
                {cluster.description && (
                  <p style={{ fontSize: '9px', color: '#4b5563', margin: '0 0 6px 0', lineHeight: '1.4' }}>
                    {safeRender(cluster.description)}
                  </p>
                )}

                {/* Why It Fits */}
                {cluster.whyItFits && (
                  <div style={{ fontSize: '9px', color: '#1e40af', margin: '0 0 6px 0', lineHeight: '1.4', fontStyle: 'italic' }}>
                    <strong>Why this fits you:</strong> {safeRender(cluster.whyItFits)}
                  </div>
                )}

                {/* What You'll Do */}
                {cluster.whatYoullDo && (
                  <div style={{ fontSize: '9px', color: '#475569', margin: '0 0 6px 0', lineHeight: '1.4' }}>
                    <strong>What you'll do:</strong> {safeRender(cluster.whatYoullDo)}
                  </div>
                )}

                {/* Domains */}
                {cluster.domains && cluster.domains.length > 0 && (
                  <div style={{ marginBottom: '6px' }}>
                    <span style={{ fontSize: '8px', fontWeight: 'bold', color: '#1e293b' }}>Domains: </span>
                    {cluster.domains.map((domain, dIdx) => (
                      <span key={dIdx} style={{
                        ...printStyles.badge,
                        background: '#f3f4f6',
                        color: '#374151',
                        border: '1px solid #d1d5db',
                        marginRight: '4px',
                        fontSize: '8px'
                      }}>
                        {safeRender(domain)}
                      </span>
                    ))}
                  </div>
                )}

                {/* Roles by Level with Salary */}
                {cluster.roles && (
                  <div style={{ marginBottom: '6px' }}>
                    <div style={{ fontSize: '8px', fontWeight: 'bold', color: '#1e293b', marginBottom: '4px' }}>Career Roles & Salary Ranges:</div>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '4px' }}>
                      {cluster.roles.entry && cluster.roles.entry.length > 0 && (
                        <div style={{ background: '#f0fdf4', border: '1px solid #bbf7d0', borderRadius: '4px', padding: '4px' }}>
                          <div style={{ fontSize: '8px', fontWeight: 'bold', color: '#166534', marginBottom: '2px' }}>Entry Level</div>
                          {cluster.salaryRange?.entry && (
                            <div style={{ fontSize: '8px', color: '#059669', marginBottom: '3px' }}>
                              ₹{cluster.salaryRange.entry.min}-{cluster.salaryRange.entry.max} {cluster.salaryRange.entry.currency}
                            </div>
                          )}
                          <ul style={{ margin: '0', paddingLeft: '12px', fontSize: '8px', color: '#4b5563', lineHeight: '1.4' }}>
                            {cluster.roles.entry.map((role, rIdx) => (
                              <li key={rIdx}>{safeRender(role)}</li>
                            ))}
                          </ul>
                        </div>
                      )}
                      {cluster.roles.mid && cluster.roles.mid.length > 0 && (
                        <div style={{ background: '#eff6ff', border: '1px solid #bfdbfe', borderRadius: '4px', padding: '4px' }}>
                          <div style={{ fontSize: '8px', fontWeight: 'bold', color: '#1e40af', marginBottom: '2px' }}>Mid Level</div>
                          {cluster.salaryRange?.mid && (
                            <div style={{ fontSize: '8px', color: '#2563eb', marginBottom: '3px' }}>
                              ₹{cluster.salaryRange.mid.min}-{cluster.salaryRange.mid.max} {cluster.salaryRange.mid.currency}
                            </div>
                          )}
                          <ul style={{ margin: '0', paddingLeft: '12px', fontSize: '8px', color: '#4b5563', lineHeight: '1.4' }}>
                            {cluster.roles.mid.map((role, rIdx) => (
                              <li key={rIdx}>{safeRender(role)}</li>
                            ))}
                          </ul>
                        </div>
                      )}
                      {cluster.roles.senior && cluster.roles.senior.length > 0 && (
                        <div style={{ background: '#fdf4ff', border: '1px solid #e9d5ff', borderRadius: '4px', padding: '4px' }}>
                          <div style={{ fontSize: '8px', fontWeight: 'bold', color: '#7c3aed', marginBottom: '2px' }}>Senior Level</div>
                          {cluster.salaryRange?.senior && (
                            <div style={{ fontSize: '8px', color: '#7c3aed', marginBottom: '3px' }}>
                              ₹{cluster.salaryRange.senior.min}-{cluster.salaryRange.senior.max} {cluster.salaryRange.senior.currency}
                            </div>
                          )}
                          <ul style={{ margin: '0', paddingLeft: '12px', fontSize: '8px', color: '#4b5563', lineHeight: '1.4' }}>
                            {cluster.roles.senior.map((role, rIdx) => (
                              <li key={rIdx}>{safeRender(role)}</li>
                            ))}
                          </ul>
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {/* Education Path & Entrance Exams */}
                {(cluster.educationPath || (cluster.entranceExams && cluster.entranceExams.length > 0)) && (
                  <div style={{ background: '#fefce8', border: '1px solid #fde68a', borderRadius: '4px', padding: '4px 6px', marginBottom: '6px' }}>
                    {cluster.educationPath && (
                      <div style={{ fontSize: '8px', color: '#854d0e', lineHeight: '1.4', marginBottom: cluster.entranceExams?.length > 0 ? '3px' : '0' }}>
                        <strong>Education Path:</strong> {safeRender(cluster.educationPath)}
                      </div>
                    )}
                    {cluster.entranceExams && cluster.entranceExams.length > 0 && (
                      <div style={{ fontSize: '8px', color: '#854d0e' }}>
                        <strong>Entrance Exams:</strong>{' '}
                        {cluster.entranceExams.map((exam, eIdx) => (
                          <span key={eIdx} style={{
                            ...printStyles.badge,
                            background: '#fef9c3',
                            color: '#854d0e',
                            border: '1px solid #fde047',
                            marginRight: '3px',
                            fontSize: '8px'
                          }}>
                            {safeRender(exam)}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>
                )}

                {/* Subjects to Focus */}
                {cluster.subjectsToFocusIn11th12th && cluster.subjectsToFocusIn11th12th.length > 0 && (
                  <div style={{ marginBottom: '6px' }}>
                    <span style={{ fontSize: '8px', fontWeight: 'bold', color: '#1e293b' }}>Subjects to Focus: </span>
                    {cluster.subjectsToFocusIn11th12th.map((subject, sIdx) => (
                      <span key={sIdx} style={{
                        ...printStyles.badge,
                        background: '#dbeafe',
                        color: '#1e40af',
                        border: '1px solid #93c5fd',
                        marginRight: '3px',
                        fontSize: '8px'
                      }}>
                        {safeRender(subject)}
                      </span>
                    ))}
                  </div>
                )}

                {/* Growth Outlook */}
                {cluster.growthOutlook && (
                  <div style={{ fontSize: '8px', color: '#059669', lineHeight: '1.4', marginBottom: '6px' }}>
                    <strong>Growth Outlook:</strong> {safeRender(cluster.growthOutlook)}
                  </div>
                )}

                {/* Evidence Breakdown */}
                {cluster.evidence && (
                  <div style={{ marginBottom: '4px' }}>
                    <div style={{ fontSize: '8px', fontWeight: 'bold', color: '#1e293b', marginBottom: '3px' }}>Evidence from Your Assessment:</div>
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '3px' }}>
                      {Object.entries(cluster.evidence).map(([key, value]) => (
                        <span key={key} style={{
                          fontSize: '8px',
                          background: '#f8fafc',
                          border: '1px solid #e2e8f0',
                          borderRadius: '3px',
                          padding: '2px 4px',
                          color: '#475569'
                        }}>
                          <strong>{key.charAt(0).toUpperCase() + key.slice(1)}:</strong> {safeRender(value)}
                        </span>
                      ))}
                    </div>
                  </div>
                )}

                {/* Example Careers with Salary Progression */}
                {cluster.examples && cluster.examples.length > 0 && (
                  <div>
                    <div style={{ fontSize: '8px', fontWeight: 'bold', color: '#1e293b', marginBottom: '3px' }}>Example Careers:</div>
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '3px' }}>
                      {cluster.examples.map((example, exIdx) => (
                        <span key={exIdx} style={{
                          ...printStyles.badge,
                          background: '#f3f4f6',
                          color: '#374151',
                          border: '1px solid #d1d5db',
                          fontSize: '8px'
                        }}>
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
                <div style={{ fontWeight: 'bold', fontSize: '10px', color: '#166534', marginBottom: '6px' }}>
                  ⭐ Best Match Careers
                </div>
                {careerFit.specificOptions.highFit.map((career, idx) => (
                  <div key={idx} style={{ marginBottom: '4px', paddingBottom: '4px', borderBottom: idx < careerFit.specificOptions.highFit.length - 1 ? '1px solid #f3f4f6' : 'none' }}>
                    <div style={{ fontSize: '9px', fontWeight: '600', color: '#1e293b' }}>
                      {safeRender(career.name || career)}
                      {career.salary && (
                        <span style={{ fontSize: '8px', color: '#059669', marginLeft: '4px', fontWeight: 'normal' }}>
                          ₹{career.salary.min}-{career.salary.max} LPA
                        </span>
                      )}
                    </div>
                    {career.description && (
                      <p style={{ fontSize: '8px', color: '#6b7280', margin: '2px 0 0 0', lineHeight: '1.3' }}>
                        {safeRender(career.description)}
                      </p>
                    )}
                  </div>
                ))}
              </div>
            )}
            {careerFit.specificOptions.mediumFit && careerFit.specificOptions.mediumFit.length > 0 && (
              <div style={printStyles.card}>
                <div style={{ fontWeight: 'bold', fontSize: '10px', color: '#92400e', marginBottom: '6px' }}>
                  💡 Good Match Careers
                </div>
                {careerFit.specificOptions.mediumFit.map((career, idx) => (
                  <div key={idx} style={{ marginBottom: '4px', paddingBottom: '4px', borderBottom: idx < careerFit.specificOptions.mediumFit.length - 1 ? '1px solid #f3f4f6' : 'none' }}>
                    <div style={{ fontSize: '9px', fontWeight: '600', color: '#1e293b' }}>
                      {safeRender(career.name || career)}
                      {career.salary && (
                        <span style={{ fontSize: '8px', color: '#059669', marginLeft: '4px', fontWeight: 'normal' }}>
                          ₹{career.salary.min}-{career.salary.max} LPA
                        </span>
                      )}
                    </div>
                    {career.description && (
                      <p style={{ fontSize: '8px', color: '#6b7280', margin: '2px 0 0 0', lineHeight: '1.3' }}>
                        {safeRender(career.description)}
                      </p>
                    )}
                  </div>
                ))}
              </div>
            )}
            {careerFit.specificOptions.exploreLater && careerFit.specificOptions.exploreLater.length > 0 && (
              <div style={printStyles.card}>
                <div style={{ fontWeight: 'bold', fontSize: '10px', color: '#1e40af', marginBottom: '6px' }}>
                  🔍 Careers to Explore
                </div>
                {careerFit.specificOptions.exploreLater.map((career, idx) => (
                  <div key={idx} style={{ marginBottom: '4px', paddingBottom: '4px', borderBottom: idx < careerFit.specificOptions.exploreLater.length - 1 ? '1px solid #f3f4f6' : 'none' }}>
                    <div style={{ fontSize: '9px', fontWeight: '600', color: '#1e293b' }}>
                      {safeRender(career.name || career)}
                      {career.salary && (
                        <span style={{ fontSize: '8px', color: '#059669', marginLeft: '4px', fontWeight: 'normal' }}>
                          ₹{career.salary.min}-{career.salary.max} LPA
                        </span>
                      )}
                    </div>
                    {career.description && (
                      <p style={{ fontSize: '8px', color: '#6b7280', margin: '2px 0 0 0', lineHeight: '1.3' }}>
                        {safeRender(career.description)}
                      </p>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Fallback: Top Careers (simple list) */}
      {!hasClusters && hasTopCareers && (
        <div>
          <h3 style={printStyles.subTitle}>Recommended Career Paths</h3>
          <div style={printStyles.twoCol}>
            {careerFit.topCareers.slice(0, 6).map((career, idx) => {
              const name = safeRender(career.name || career);
              const fitScore = career.fitScore || 0;
              const description = career.description || '';
              const scoreStyle = getScoreStyle(fitScore);
              return (
                <div key={idx} style={printStyles.card}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '4px' }}>
                    <div style={{ fontWeight: 'bold', fontSize: '10px', color: '#1e293b', flex: 1 }}>
                      {name}
                    </div>
                    {fitScore > 0 && (
                      <span style={{
                        ...printStyles.badge,
                        background: scoreStyle.bg,
                        color: scoreStyle.color,
                        border: `1px solid ${scoreStyle.border}`,
                        marginLeft: '8px'
                      }}>
                        {fitScore}% Fit
                      </span>
                    )}
                  </div>
                  {description && (
                    <p style={{ fontSize: '9px', color: '#4b5563', margin: '0', lineHeight: '1.4' }}>
                      {description}
                    </p>
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
 * Renders skill gap analysis with current vs required skills
 * Requirements: 1.2 - Skill gap analysis for higher secondary students
 */
const SkillGapDevelopmentSection = ({ skillGap }) => {
  if (!skillGap) return null;

  // Handle different data structures
  const currentStrengths = skillGap.currentStrengths || skillGap.currentSkills || [];
  const gaps = skillGap.gaps || [];
  const priorityA = skillGap.priorityA || [];
  const priorityB = skillGap.priorityB || [];
  
  // Combine priorityA and priorityB into gaps if gaps is empty
  const allGaps = gaps.length > 0 ? gaps : [...priorityA, ...priorityB];

  return (
    <>
      <h2 style={{ ...printStyles.sectionTitle, marginTop: '10px' }}>6. Skill Gap & Development Plan</h2>

      {/* Current Strengths */}
      {currentStrengths.length > 0 && (
        <div style={{ marginBottom: '10px' }}>
          <h3 style={printStyles.subTitle}>Your Current Strengths</h3>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
            {currentStrengths.map((skill, idx) => (
              <span
                key={idx}
                style={{
                  ...printStyles.badge,
                  background: '#dcfce7',
                  color: '#166534',
                  border: '1px solid #86efac'
                }}
              >
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
              const timeline = gap.timeline;
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
                <div key={idx} style={{ 
                  ...printStyles.card, 
                  marginBottom: '6px',
                  border: `1px solid ${colors.border}`,
                  backgroundColor: `${colors.bg}20`
                }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '4px' }}>
                    <div style={{ fontWeight: 'bold', fontSize: '10px', color: '#1e293b' }}>
                      {safeRender(skill)}
                    </div>
                    <span style={{
                      ...printStyles.badge,
                      background: colors.bg,
                      color: colors.color,
                      border: `1px solid ${colors.border}`
                    }}>
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
                  {(timeline || currentLevel || targetLevel) && (
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '4px', marginTop: '4px' }}>
                      {timeline && (
                        <span style={{ ...printStyles.badge, background: '#e0f2fe', color: '#0369a1', border: '1px solid #7dd3fc', fontSize: '8px' }}>
                          ⏱ {safeRender(timeline)}
                        </span>
                      )}
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

      {/* Recommended Learning Track */}
      {skillGap.recommendedTrack && (
        <div style={{ marginTop: '10px' }}>
          <h3 style={printStyles.subTitle}>Recommended Learning Path</h3>
          <div style={{ 
            ...printStyles.card,
            backgroundColor: '#eff6ff',
            border: '2px solid #3b82f6'
          }}>
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
 * DevelopmentRoadmapSection Component
 * Renders development roadmap with grade-wise phases, entrance exams, projects, and more
 * Requirements: 1.2 - Development roadmap for higher secondary students
 */
const DevelopmentRoadmapSection = ({ roadmap }) => {
  if (!roadmap) return null;

  const hasGradePhases = roadmap.immediate || roadmap.eleventhGrade || roadmap.twelfthGrade;

  const phaseColors = {
    immediate: { bg: '#f0fdf4', border: '#86efac', headerBg: '#dcfce7', headerColor: '#166534', accent: '#059669', icon: '🎯' },
    eleventhGrade: { bg: '#eff6ff', border: '#93c5fd', headerBg: '#dbeafe', headerColor: '#1e40af', accent: '#2563eb', icon: '📚' },
    twelfthGrade: { bg: '#faf5ff', border: '#c4b5fd', headerBg: '#ede9fe', headerColor: '#6d28d9', accent: '#7c3aed', icon: '🎓' },
  };

  const renderPhaseCard = (phase, phaseKey) => {
    if (!phase) return null;
    const colors = phaseColors[phaseKey];
    return (
      <div style={{
        ...printStyles.card,
        background: colors.bg,
        border: `2px solid ${colors.border}`,
        marginBottom: '8px',
        pageBreakInside: 'avoid'
      }}>
        <div style={{
          background: colors.headerBg,
          margin: '-6px -6px 6px -6px',
          padding: '6px 8px',
          borderRadius: '4px 4px 0 0',
          display: 'flex',
          alignItems: 'center',
          gap: '6px'
        }}>
          <span style={{ fontSize: '12px' }}>{colors.icon}</span>
          <span style={{ fontWeight: 'bold', fontSize: '10px', color: colors.headerColor }}>
            {safeRender(phase.title || phaseKey)}
          </span>
        </div>

        {phase.goals && phase.goals.length > 0 && (
          <div style={{ marginBottom: '6px' }}>
            <div style={{ fontSize: '8px', fontWeight: 'bold', color: '#1e293b', marginBottom: '3px' }}>Goals:</div>
            {phase.goals.map((goal, idx) => (
              <div key={idx} style={{ display: 'flex', alignItems: 'flex-start', gap: '4px', marginBottom: '2px' }}>
                <span style={{ fontSize: '8px', color: colors.accent, flexShrink: 0, marginTop: '1px' }}>☐</span>
                <span style={{ fontSize: '8px', color: '#374151', lineHeight: '1.4' }}>{safeRender(goal)}</span>
              </div>
            ))}
          </div>
        )}

        {phase.actions && phase.actions.length > 0 && (
          <div style={{ marginBottom: '6px' }}>
            <div style={{ fontSize: '8px', fontWeight: 'bold', color: '#1e293b', marginBottom: '3px' }}>Action Steps:</div>
            <ul style={{ margin: '0', paddingLeft: '14px', fontSize: '8px', color: '#4b5563', lineHeight: '1.5' }}>
              {phase.actions.map((action, idx) => (
                <li key={idx}>{safeRender(action)}</li>
              ))}
            </ul>
          </div>
        )}

        {phase.milestones && phase.milestones.length > 0 && (
          <div>
            <div style={{ fontSize: '8px', fontWeight: 'bold', color: '#1e293b', marginBottom: '3px' }}>Milestones:</div>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '4px' }}>
              {phase.milestones.map((milestone, idx) => (
                <span key={idx} style={{
                  ...printStyles.badge,
                  background: colors.headerBg,
                  color: colors.headerColor,
                  border: `1px solid ${colors.border}`,
                  fontSize: '8px'
                }}>
                  ✓ {safeRender(milestone)}
                </span>
              ))}
            </div>
          </div>
        )}
      </div>
    );
  };

  const difficultyColor = (level) => {
    const l = (level || '').toLowerCase();
    if (l === 'beginner' || l === 'easy') return { bg: '#dcfce7', color: '#166534', border: '#86efac' };
    if (l === 'intermediate' || l === 'medium') return { bg: '#fef3c7', color: '#92400e', border: '#fde047' };
    if (l === 'advanced' || l === 'hard') return { bg: '#fee2e2', color: '#991b1b', border: '#fca5a5' };
    return { bg: '#f3f4f6', color: '#374151', border: '#d1d5db' };
  };

  return (
    <div style={{ pageBreakInside: 'auto', breakInside: 'auto', marginTop: '10px' }}>
      <h2 style={{ ...printStyles.sectionTitle, pageBreakBefore: 'auto', breakBefore: 'auto' }}>7. Development Roadmap</h2>

      {/* Grade-wise Phases Timeline */}
      {hasGradePhases && (
        <div style={{ marginBottom: '10px' }}>
          <h3 style={printStyles.subTitle}>Your Academic Journey Plan</h3>
          {renderPhaseCard(roadmap.immediate, 'immediate')}
          {renderPhaseCard(roadmap.eleventhGrade, 'eleventhGrade')}
          {renderPhaseCard(roadmap.twelfthGrade, 'twelfthGrade')}
        </div>
      )}

      {/* Entrance Exams */}
      {roadmap.entranceExams && roadmap.entranceExams.length > 0 && (
        <div style={{ marginBottom: '10px' }}>
          <h3 style={printStyles.subTitle}>Entrance Exam Preparation</h3>
          {roadmap.entranceExams.map((examInfo, idx) => (
            <div key={idx} style={{
              ...printStyles.card,
              marginBottom: '8px',
              border: '2px solid #fde68a',
              background: '#fffbeb',
              pageBreakInside: 'avoid'
            }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
                <div style={{ fontWeight: 'bold', fontSize: '10px', color: '#92400e' }}>
                  📝 {safeRender(examInfo.exam)}
                </div>
              </div>

              {examInfo.relevance && (
                <p style={{ fontSize: '8px', color: '#4b5563', margin: '0 0 6px 0', lineHeight: '1.4' }}>
                  <strong>Why it matters:</strong> {safeRender(examInfo.relevance)}
                </p>
              )}

              {examInfo.preparationTimeline && (
                <p style={{ fontSize: '8px', color: '#854d0e', margin: '0 0 6px 0', lineHeight: '1.4' }}>
                  <strong>⏱ Preparation Timeline:</strong> {safeRender(examInfo.preparationTimeline)}
                </p>
              )}

              {examInfo.keySubjects && examInfo.keySubjects.length > 0 && (
                <div style={{ marginBottom: '6px' }}>
                  <span style={{ fontSize: '8px', fontWeight: 'bold', color: '#1e293b' }}>Key Subjects: </span>
                  {examInfo.keySubjects.map((subject, sIdx) => (
                    <span key={sIdx} style={{
                      ...printStyles.badge,
                      background: '#dbeafe',
                      color: '#1e40af',
                      border: '1px solid #93c5fd',
                      marginRight: '3px',
                      fontSize: '8px'
                    }}>
                      {safeRender(subject)}
                    </span>
                  ))}
                </div>
              )}

              {examInfo.resources && examInfo.resources.length > 0 && (
                <div>
                  <span style={{ fontSize: '8px', fontWeight: 'bold', color: '#1e293b' }}>Resources: </span>
                  {examInfo.resources.map((resource, rIdx) => (
                    <span key={rIdx} style={{
                      ...printStyles.badge,
                      background: '#f0fdf4',
                      color: '#166534',
                      border: '1px solid #86efac',
                      marginRight: '3px',
                      fontSize: '8px'
                    }}>
                      {safeRender(resource)}
                    </span>
                  ))}
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Recommended Projects - Full Details */}
      {roadmap.projects && roadmap.projects.length > 0 && (
        <div style={{ marginBottom: '10px' }}>
          <h3 style={printStyles.subTitle}>Recommended Projects</h3>
          <div style={printStyles.twoCol}>
            {roadmap.projects.map((project, idx) => {
              const diffColors = difficultyColor(project.difficulty);
              return (
                <div key={idx} style={{ ...printStyles.card, pageBreakInside: 'avoid' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '4px' }}>
                    <div style={{ fontWeight: 'bold', fontSize: '10px', color: '#1e293b', flex: 1 }}>
                      {safeRender(project.title || project)}
                    </div>
                    {project.difficulty && (
                      <span style={{
                        ...printStyles.badge,
                        background: diffColors.bg,
                        color: diffColors.color,
                        border: `1px solid ${diffColors.border}`,
                        marginLeft: '4px',
                        flexShrink: 0
                      }}>
                        {project.difficulty}
                      </span>
                    )}
                  </div>

                  {(project.description || project.purpose) && (
                    <p style={{ fontSize: '8px', color: '#4b5563', margin: '0 0 4px 0', lineHeight: '1.4' }}>
                      {safeRender(project.description || project.purpose)}
                    </p>
                  )}

                  {project.timeline && (
                    <p style={{ fontSize: '8px', color: '#6b7280', margin: '0 0 4px 0', lineHeight: '1.4' }}>
                      <strong>Timeline:</strong> {safeRender(project.timeline)}
                    </p>
                  )}

                  {project.skills && project.skills.length > 0 && (
                    <div style={{ marginBottom: '4px' }}>
                      <span style={{ fontSize: '8px', fontWeight: 'bold', color: '#1e293b' }}>Skills: </span>
                      {project.skills.map((skill, sIdx) => (
                        <span key={sIdx} style={{
                          ...printStyles.badge,
                          background: '#e0f2fe',
                          color: '#0369a1',
                          border: '1px solid #7dd3fc',
                          marginRight: '3px',
                          fontSize: '8px'
                        }}>
                          {safeRender(skill)}
                        </span>
                      ))}
                    </div>
                  )}

                  {project.output && (
                    <p style={{ fontSize: '8px', color: '#059669', margin: '0 0 4px 0', lineHeight: '1.4' }}>
                      <strong>Output:</strong> {safeRender(project.output)}
                    </p>
                  )}

                  {(project.careerRelevance || project.purpose) && (
                    <p style={{ fontSize: '8px', color: '#1e40af', margin: '0', lineHeight: '1.4', fontStyle: 'italic' }}>
                      <strong>Career Relevance:</strong> {safeRender(project.careerRelevance || project.purpose)}
                    </p>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Exposure Activities */}
      {roadmap.exposure && (
        <div style={{ marginBottom: '10px' }}>
          <h3 style={printStyles.subTitle}>Activities & Exposure</h3>
          <div style={printStyles.twoCol}>
            {roadmap.exposure.activities && roadmap.exposure.activities.length > 0 && (
              <div style={printStyles.card}>
                <div style={{ fontWeight: 'bold', fontSize: '10px', color: '#1e293b', marginBottom: '6px' }}>
                  Activities to Try
                </div>
                <ul style={{ margin: '0', paddingLeft: '14px', fontSize: '8px', color: '#4b5563', lineHeight: '1.5' }}>
                  {roadmap.exposure.activities.map((activity, idx) => (
                    <li key={idx}>{safeRender(activity)}</li>
                  ))}
                </ul>
              </div>
            )}
            {roadmap.exposure.certifications && roadmap.exposure.certifications.length > 0 && (
              <div style={printStyles.card}>
                <div style={{ fontWeight: 'bold', fontSize: '10px', color: '#1e293b', marginBottom: '6px' }}>
                  Certifications to Pursue
                </div>
                <ul style={{ margin: '0', paddingLeft: '14px', fontSize: '8px', color: '#4b5563', lineHeight: '1.5' }}>
                  {roadmap.exposure.certifications.map((cert, idx) => (
                    <li key={idx}>{safeRender(cert)}</li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Internship Preparation */}
      {roadmap.internship && (
        <div style={{ marginBottom: '10px' }}>
          <h3 style={printStyles.subTitle}>Internship Preparation</h3>
          <div style={printStyles.card}>
            {roadmap.internship.types && roadmap.internship.types.length > 0 && (
              <div style={{ marginBottom: '8px' }}>
                <div style={{ fontWeight: 'bold', fontSize: '10px', color: '#1e293b', marginBottom: '4px' }}>
                  Recommended Internship Types:
                </div>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
                  {roadmap.internship.types.map((type, idx) => (
                    <span
                      key={idx}
                      style={{
                        ...printStyles.badge,
                        background: '#dbeafe',
                        color: '#1e40af',
                        border: '1px solid #93c5fd'
                      }}
                    >
                      {safeRender(type)}
                    </span>
                  ))}
                </div>
              </div>
            )}
            {roadmap.internship.timeline && (
              <p style={{ fontSize: '8px', color: '#4b5563', margin: '0 0 8px 0', lineHeight: '1.4' }}>
                <strong>Timeline:</strong> {safeRender(roadmap.internship.timeline)}
              </p>
            )}
            {roadmap.internship.preparation && (
              <div>
                <div style={{ fontWeight: 'bold', fontSize: '8px', color: '#1e293b', marginBottom: '4px' }}>
                  Preparation Tips:
                </div>
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

      {/* Roadmap Phases (fallback for other data structures) */}
      {roadmap.phases && roadmap.phases.length > 0 && (
        <div style={{ marginTop: '8px' }}>
          <h3 style={printStyles.subTitle}>Development Phases</h3>
          {roadmap.phases.map((phase, idx) => (
            <div key={idx} style={{ ...printStyles.card, marginBottom: '8px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                <div style={{ fontWeight: 'bold', fontSize: '11px', color: '#4f46e5' }}>
                  {safeRender(phase.phase || `Phase ${idx + 1}`)}
                </div>
                {phase.duration && (
                  <span style={{
                    ...printStyles.badge,
                    background: '#e0e7ff',
                    color: '#4338ca',
                    border: '1px solid #a5b4fc'
                  }}>
                    {phase.duration}
                  </span>
                )}
              </div>
              {phase.goals && phase.goals.length > 0 && (
                <ul style={{ margin: '0', paddingLeft: '14px', fontSize: '8px', color: '#4b5563', lineHeight: '1.5' }}>
                  {phase.goals.map((goal, goalIdx) => (
                    <li key={goalIdx}>{safeRender(goal)}</li>
                  ))}
                </ul>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

/**
 * StreamRecommendationSection Component
 * Renders stream recommendation for after 10th students
 */
const StreamRecommendationSection = ({ streamRecommendation }) => {
  if (!streamRecommendation || !streamRecommendation.recommendedStream) return null;

  return (
    <>
      <h2 style={printStyles.sectionTitle}>11th/12th Stream Recommendation</h2>
      <p style={{ fontSize: '10px', color: '#6b7280', marginBottom: '8px', lineHeight: '1.5' }}>
        Based on your interests, aptitudes, and academic performance, here is your recommended stream for grades 11-12:
      </p>

      <div style={{ 
        ...printStyles.card, 
        border: '2px solid #3b82f6',
        backgroundColor: '#eff6ff',
        marginBottom: '8px'
      }}>
        <div style={{ 
          fontWeight: 'bold', 
          fontSize: '14px', 
          color: '#1e40af', 
          marginBottom: '8px',
          textAlign: 'center'
        }}>
          Recommended Stream: {streamRecommendation.recommendedStream}
        </div>

        <div style={{ display: 'flex', justifyContent: 'center', gap: '10px', marginBottom: '10px' }}>
          {streamRecommendation.matchScore && (
            <span style={{ fontSize: '11px', color: '#059669', fontWeight: '600' }}>
              Match Score: {Math.round(streamRecommendation.matchScore)}%
            </span>
          )}
          {streamRecommendation.confidence && (
            <span style={{
              ...printStyles.badge,
              background: streamRecommendation.confidence === 'High' ? '#dcfce7' : '#fef9c3',
              color: streamRecommendation.confidence === 'High' ? '#166534' : '#854d0e',
              border: `1px solid ${streamRecommendation.confidence === 'High' ? '#86efac' : '#fde047'}`
            }}>
              Confidence: {streamRecommendation.confidence}
            </span>
          )}
        </div>

        {streamRecommendation.reasoning && (
          <div style={{ 
            fontSize: '9px', 
            color: '#4b5563', 
            lineHeight: '1.5',
            margin: '0'
          }}>
            {typeof streamRecommendation.reasoning === 'string' ? (
              <p style={{ margin: '0' }}>{streamRecommendation.reasoning}</p>
            ) : (
              <div>
                {streamRecommendation.reasoning.interests && (
                  <p style={{ margin: '0 0 4px 0' }}>• <strong>Interests:</strong> {streamRecommendation.reasoning.interests}</p>
                )}
                {streamRecommendation.reasoning.aptitude && (
                  <p style={{ margin: '0 0 4px 0' }}>• <strong>Aptitude:</strong> {streamRecommendation.reasoning.aptitude}</p>
                )}
                {streamRecommendation.reasoning.personality && (
                  <p style={{ margin: '0' }}>• <strong>Personality:</strong> {streamRecommendation.reasoning.personality}</p>
                )}
              </div>
            )}
          </div>
        )}
      </div>

      {/* Evidence Breakdown */}
      {streamRecommendation.evidence && Object.keys(streamRecommendation.evidence).length > 0 && (
        <div style={{ ...printStyles.card, marginBottom: '8px' }}>
          <div style={{ fontWeight: 'bold', fontSize: '10px', color: '#1e293b', marginBottom: '6px' }}>
            Evidence Supporting This Recommendation
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '4px' }}>
            {Object.entries(streamRecommendation.evidence).map(([key, value]) => (
              <div key={key} style={{ fontSize: '8px', color: '#475569', background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: '4px', padding: '4px 6px' }}>
                <strong style={{ color: '#1e293b' }}>{key.charAt(0).toUpperCase() + key.slice(1)}:</strong> {safeRender(value)}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Preparation Advice */}
      {streamRecommendation.preparationAdvice && (
        <div style={{ ...printStyles.card, marginBottom: '8px', background: '#f0fdf4', border: '1px solid #86efac' }}>
          <div style={{ fontWeight: 'bold', fontSize: '9px', color: '#166534', marginBottom: '4px' }}>📝 Preparation Advice</div>
          <p style={{ margin: '0', fontSize: '9px', lineHeight: '1.5', color: '#475569' }}>
            {safeRender(streamRecommendation.preparationAdvice)}
          </p>
        </div>
      )}

      {/* Why Not Other Streams */}
      {streamRecommendation.whyNotOtherStreams && Object.keys(streamRecommendation.whyNotOtherStreams).length > 0 && (
        <div style={{ marginBottom: '8px' }}>
          <h3 style={printStyles.subTitle}>Why Not Other Streams?</h3>
          {Object.entries(streamRecommendation.whyNotOtherStreams).map(([key, value]) => (
            <div key={key} style={{ ...printStyles.card, marginBottom: '4px', background: '#fef2f2', border: '1px solid #fecaca' }}>
              <p style={{ margin: '0', fontSize: '9px', lineHeight: '1.5', color: '#991b1b' }}>
                {safeRender(value)}
              </p>
            </div>
          ))}
        </div>
      )}

      {/* Alternative Streams */}
      {streamRecommendation.alternatives && streamRecommendation.alternatives.length > 0 && (
        <div style={{ marginTop: '8px' }}>
          <h3 style={printStyles.subTitle}>Alternative Stream Options</h3>
          {streamRecommendation.alternatives.map((alt, index) => (
            <div key={index} style={{ 
              ...printStyles.card, 
              marginBottom: '10px',
              border: '1px solid #e5e7eb'
            }}>
              <div style={{ 
                fontWeight: 'bold', 
                fontSize: '11px', 
                color: '#1e293b', 
                marginBottom: '4px'
              }}>
                {alt.stream}
                {alt.matchScore && (
                  <span style={{ 
                    fontSize: '9px', 
                    color: '#059669',
                    marginLeft: '8px'
                  }}>
                    ({Math.round(alt.matchScore)}% match)
                  </span>
                )}
              </div>
              {alt.reasoning && (
                <p style={{ 
                  fontSize: '9px', 
                  color: '#4b5563', 
                  lineHeight: '1.5',
                  margin: '0'
                }}>
                  {alt.reasoning}
                </p>
              )}
            </div>
          ))}
        </div>
      )}
    </>
  );
};

/**
 * CourseRecommendationsSection Component
 * Renders recommended degree programs/courses
 */
const CourseRecommendationsSection = ({ courseRecommendations }) => {
  if (!courseRecommendations || courseRecommendations.length === 0) return null;

  const topCourses = courseRecommendations.slice(0, 5);

  return (
    <>
      <h2 style={printStyles.sectionTitle}>Recommended Degree Programs</h2>
      <p style={{ fontSize: '10px', color: '#6b7280', marginBottom: '8px', lineHeight: '1.5' }}>
        Based on your assessment results and chosen stream, here are the top degree programs for you:
      </p>

      {topCourses.map((course, index) => (
        <div key={index} style={{ 
          ...printStyles.card, 
          marginBottom: '6px',
          border: index === 0 ? '2px solid #3b82f6' : '1px solid #e5e7eb',
          backgroundColor: index === 0 ? '#eff6ff' : '#ffffff'
        }}>
          <div style={{ display: 'flex', alignItems: 'flex-start', gap: '10px' }}>
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

              {course.category && (
                <div style={{ fontSize: '8px', color: '#6b7280', marginBottom: '6px' }}>
                  Category: {course.category}
                </div>
              )}

              <div style={{ fontSize: '9px', color: '#059669', fontWeight: '600', marginBottom: '6px' }}>
                Match Score: {Math.round(course.matchScore)}%
              </div>

              {course.description && (
                <p style={{ fontSize: '9px', color: '#4b5563', lineHeight: '1.5', margin: '0 0 8px 0' }}>
                  {course.description}
                </p>
              )}

              {course.reasons && course.reasons.length > 0 && (
                <div style={{ marginTop: '8px' }}>
                  <div style={{ fontSize: '9px', fontWeight: 'bold', color: '#1e293b', marginBottom: '4px' }}>
                    Why this program suits you:
                  </div>
                  <ul style={{ margin: '0', paddingLeft: '15px', fontSize: '8px', color: '#4b5563', lineHeight: '1.5' }}>
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
    </>
  );
};

/**
 * EmployabilitySkillsSection Component
 * Renders employability skills assessment with skill scores
 * Requirements: 1.2 - Employability skills for higher secondary students
 */
const EmployabilitySkillsSection = ({ employability }) => {
  if (!employability) return null;

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

  const readiness = employability.overallReadiness != null ? getReadinessInfo(employability.overallReadiness) : null;
  const devAreas = employability.developmentAreas || employability.improvementAreas || [];

  return (
    <>
      <h3 style={{ ...printStyles.subTitle, marginTop: '8px' }}>Employability Skills Assessment</h3>

      {/* Overall Readiness */}
      {readiness && (
        <div style={{ ...printStyles.card, marginBottom: '10px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div style={{ fontWeight: 'bold', fontSize: '10px', color: '#1e293b' }}>
              Overall Career Readiness
            </div>
            <span style={{
              ...printStyles.badge,
              background: readiness.bg,
              color: readiness.color,
              border: `1px solid ${readiness.border}`
            }}>
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
      {employability.skillScores && Object.keys(employability.skillScores).length > 0 && (
        <div>
          <div style={{ fontSize: '10px', fontWeight: 'bold', color: '#1e293b', marginBottom: '8px' }}>
            Skill Assessment Scores:
          </div>
          <div style={printStyles.twoCol}>
            {Object.entries(employability.skillScores).map(([skill, score]) => {
              // Check if score is already a percentage (> 5) or a 0-5 scale
              const isPercentage = score > 5;
              const normalizedScore = isPercentage ? score / 20 : score; // If percentage, convert back to 0-5 scale
              const percentage = isPercentage ? Math.round(score) : Math.round((score / 5) * 100);
              const scoreStyle = getScoreStyle(percentage);
              
              return (
                <div key={skill} style={printStyles.card}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div style={{ fontWeight: 'bold', fontSize: '10px', color: '#1e293b' }}>
                      {skill}
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                      <span style={{ fontSize: '9px', color: '#6b7280' }}>
                        {normalizedScore.toFixed(2)}/5
                      </span>
                      <span style={{
                        ...printStyles.badge,
                        background: scoreStyle.bg,
                        color: scoreStyle.color,
                        border: `1px solid ${scoreStyle.border}`
                      }}>
                        {percentage}%
                      </span>
                    </div>
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
          <div style={{ fontSize: '10px', fontWeight: 'bold', color: '#1e293b', marginBottom: '6px' }}>
            Your Strength Areas:
          </div>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
            {employability.strengthAreas.map((area, idx) => (
              <span
                key={idx}
                style={{
                  ...printStyles.badge,
                  background: '#dcfce7',
                  color: '#166534',
                  border: '1px solid #86efac'
                }}
              >
                {safeRender(area)}
              </span>
            ))}
          </div>
        </div>
      )}

      {/* Development Areas */}
      {devAreas.length > 0 && (
        <div style={{ marginTop: '10px' }}>
          <div style={{ fontSize: '10px', fontWeight: 'bold', color: '#1e293b', marginBottom: '6px' }}>
            Areas to Develop:
          </div>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
            {devAreas.map((area, idx) => (
              <span
                key={idx}
                style={{
                  ...printStyles.badge,
                  background: '#fef9c3',
                  color: '#854d0e',
                  border: '1px solid #fde047'
                }}
              >
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
 * OverallSummarySection Component
 * Renders the overall assessment summary
 */
const OverallSummarySection = ({ overallSummary }) => {
  if (!overallSummary) return null;

  return (
    <div style={{ marginTop: '10px', marginBottom: '10px' }}>
      <h2 style={printStyles.sectionTitle}>Overall Assessment Summary</h2>
      <div style={{ ...printStyles.card, background: '#f0f9ff', border: '2px solid #3b82f6' }}>
        <p style={{ margin: '0', fontSize: '10px', lineHeight: '1.6', color: '#1e293b' }}>
          {safeRender(overallSummary)}
        </p>
      </div>
    </div>
  );
};

/**
 * ProfileSnapshotSection Component
 * Renders the student's profile snapshot with key patterns, strengths, and development areas
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

      {/* Stream Fit Summary */}
      {profileSnapshot.streamFitSummary && (
        <div style={{ ...printStyles.card, marginBottom: '8px', background: '#eff6ff', border: '2px solid #3b82f6' }}>
          <p style={{ margin: '0', fontSize: '10px', lineHeight: '1.5', color: '#1e40af', fontWeight: '600' }}>
            {safeRender(profileSnapshot.streamFitSummary)}
          </p>
        </div>
      )}

      {/* Key Patterns */}
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

      {/* Unique Strengths & Development Areas */}
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
            <th style={{ ...printStyles.th, width: '140px' }}>Proficiency</th>
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
                        <div style={{ width: `${percentage}%`, height: '100%', background: percentage >= 70 ? '#22c55e' : percentage >= 40 ? '#eab308' : '#ef4444', borderRadius: '4px' }}></div>
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
 * CharacterStrengthsSection Component
 * Renders character strengths, growth areas, and strength descriptions with ratings
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
 * LearningStylesSection Component
 * Renders primary/secondary learning styles with description
 */
const LearningStylesSection = ({ learningStyle }) => {
  if (!learningStyle || (!learningStyle.primary && !learningStyle.secondary)) return null;

  return (
    <div style={{ marginBottom: '10px', pageBreakInside: 'avoid' }}>
      <h2 style={{ ...printStyles.sectionTitle, marginTop: '12px' }}>Your Learning Preferences</h2>
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
          {safeRender(learningStyle.description)}
        </p>
      )}
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

export default PrintViewHigherSecondary;
