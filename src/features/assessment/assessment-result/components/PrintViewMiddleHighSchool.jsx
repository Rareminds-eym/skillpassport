/**
 * PrintViewMiddleHighSchool Component
 * Grade-level-specific print view for Middle School and High School students (Grades 6-10)
 * Requirements: 1.1, 2.1 - Simplified career exploration without MCQ test scores
 */

import CoverPage from './CoverPage';
import { printStyles } from './shared/styles';
import { safeRender, getSafeStudentInfo, riasecDescriptions, defaultRiasecNames, getScoreStyle } from './shared/utils';
import RiasecIcon from './shared/RiasecIcon';
import PrintStyles from './shared/PrintStyles';
import Watermarks, { DataPrivacyNotice, ReportDisclaimer, RepeatingHeader, RepeatingFooter } from './shared/Watermarks';
import DetailedAssessmentBreakdown from './shared/DetailedAssessmentBreakdown';

/**
 * PrintViewMiddleHighSchool Component
 * Renders assessment report for middle and high school students
 * 
 * @param {Object} props - Component props
 * @param {Object} props.results - Assessment results data
 * @param {Object} props.studentInfo - Student information
 * @param {Object} props.riasecNames - RIASEC code to name mapping (optional)
 * @param {Object} props.streamRecommendation - Stream recommendation for after10 students (optional)
 * @param {Object} props.studentAcademicData - Student academic data (optional)
 * @param {string} props.gradeLevel - Grade level (middle, highschool) (optional)
 * @returns {JSX.Element} - Print view component
 */
const PrintViewMiddleHighSchool = ({ 
  results, 
  studentInfo, 
  riasecNames,
  streamRecommendation,
  studentAcademicData,
  gradeLevel
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
  
  console.log('🔍 PDF PrintViewMiddleHighSchool - Input data:', {
    hasRiasec: !!results.riasec,
    riasecScores: results.riasec?.scores,
    hasRiasecOriginal: !!results.riasec?._originalScores,
    riasecOriginal: results.riasec?._originalScores,
    hasGeminiResults: !!results.gemini_results,
    hasGeminiRiasec: !!results.gemini_results?.riasec,
    geminiOriginal: results.gemini_results?.riasec?._originalScores
  });
  
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
    
    console.log('🔍 PDF PrintViewMiddleHighSchool - Normalization check:', {
      allZeros,
      hasOriginalScores,
      originalScores,
      foundAt: results.riasec._originalScores ? 'riasec._originalScores' : 
               results.gemini_results?.riasec?._originalScores ? 'gemini_results.riasec._originalScores' : 
               'NOT FOUND'
    });
    
    if (allZeros && hasOriginalScores) {
      console.log('🔧 PDF PrintView: Normalizing RIASEC scores from _originalScores');
      console.log('   Original scores found at:', results.riasec._originalScores ? 'riasec._originalScores' : 'gemini_results.riasec._originalScores');
      normalizedResults = {
        ...results,
        riasec: {
          ...results.riasec,
          scores: originalScores,
          _originalScores: originalScores,
          maxScore: results.riasec.maxScore || 
                   results.gemini_results?.riasec?.maxScore || 
                   24
        }
      };
      console.log('✅ PDF PrintView - Normalized scores:', normalizedResults.riasec.scores);
    } else {
      console.log('⚠️ PDF PrintView - No normalization applied:', {
        reason: !allZeros ? 'Scores are not all zeros' : 'No original scores found'
      });
    }
  }

  // Extract data from normalized results
  // 🔧 CRITICAL FIX: Also check gemini_results for data that might not be at top level
  const { 
    riasec, 
    careerFit = normalizedResults.careerFit || normalizedResults.gemini_results?.careerFit,
    skillGap = normalizedResults.skillGap || normalizedResults.gemini_results?.skillGap,
    roadmap = normalizedResults.roadmap || normalizedResults.gemini_results?.roadmap,
    finalNote = normalizedResults.finalNote || normalizedResults.gemini_results?.finalNote,
    profileSnapshot = normalizedResults.profileSnapshot || normalizedResults.gemini_results?.profileSnapshot,
    characterStrengths = normalizedResults.characterStrengths || normalizedResults.gemini_results?.characterStrengths,
    learningStyle = normalizedResults.learningStyle || normalizedResults.gemini_results?.learningStyle,
    adaptiveAptitudeResults = normalizedResults.adaptiveAptitudeResults || normalizedResults.gemini_results?.adaptiveAptitudeResults,
    overallSummary = normalizedResults.overallSummary || normalizedResults.gemini_results?.overallSummary,
    bigFive = normalizedResults.bigFive || normalizedResults.gemini_results?.bigFive,
    workValues = normalizedResults.workValues || normalizedResults.gemini_results?.workValues,
    employability = normalizedResults.employability || normalizedResults.gemini_results?.employability,
    aptitude = normalizedResults.aptitude || normalizedResults.gemini_results?.aptitude,
    knowledge = normalizedResults.knowledge || normalizedResults.gemini_results?.knowledge
  } = normalizedResults;

  console.log('🔍 PDF PrintViewMiddleHighSchool - Extracted data:', {
    hasCharacterStrengths: !!characterStrengths,
    hasLearningStyle: !!learningStyle,
    hasAdaptiveAptitude: !!adaptiveAptitudeResults,
    adaptiveLevel: adaptiveAptitudeResults?.aptitude_level || adaptiveAptitudeResults?.aptitudeLevel,
    hasCareerFit: !!careerFit
  });

  // Determine if this is middle school (grades 6-8)
  // Used to pass correct gradeLevel to DetailedAssessmentBreakdown
  const isMiddleSchool = gradeLevel === 'middle' || 
                         (studentInfo?.grade && parseInt(studentInfo.grade.toString().match(/\d+/)?.[0]) <= 8);

  // Safe student info with defaults
  const safeStudentInfo = getSafeStudentInfo(studentInfo);

  // Safe RIASEC names with defaults
  const safeRiasecNames = riasecNames || defaultRiasecNames;

  return (
    <div className="print-view" style={{ background: 'white', position: 'relative' }}>
      {/* Print-specific CSS styles */}
      <PrintStyles />

      {/* Cover Page */}
      <CoverPage studentInfo={safeStudentInfo} />

      {/* Watermarks */}
      <Watermarks />

      {/* Table-based structure for repeating header/footer on every page */}
      <table className="print-table-wrapper" style={{ width: '100%', borderCollapse: 'collapse' }}>
        {/* Repeating Header - appears on every page except cover */}
        <RepeatingHeader />

        {/* Repeating Footer - appears on every page except cover */}
        <RepeatingFooter />

        {/* Main Content Body */}
        <tbody className="print-table-body">
          <tr className="print-content-row">
            <td className="print-content-cell" style={{ padding: '10px 0' }}>
              {/* Data Privacy Notice */}
              <DataPrivacyNotice />

              {/* Stream Recommendation - Before Profile Snapshot */}
              {streamRecommendation && streamRecommendation.recommendedStream && (
                <StreamRecommendationSection streamRecommendation={streamRecommendation} />
              )}

              {/* Overall Summary */}
              {overallSummary && (
                <OverallSummarySection overallSummary={overallSummary} />
              )}

              {/* Section 1: Student Profile Snapshot */}
              <h2 style={printStyles.sectionTitle}>1. Student Profile Snapshot</h2>

              {/* Profile Snapshot Details */}
              {profileSnapshot && (profileSnapshot.interestHighlights || profileSnapshot.personalityInsights) && (
                <ProfileSnapshotDetailsSection profileSnapshot={profileSnapshot} />
              )}

              {/* Interest Explorer Section */}
              <InterestExplorerSection riasec={riasec} safeRiasecNames={safeRiasecNames} />

              {/* Character Strengths Section - Use characterStrengths from middle school data */}
              {(characterStrengths || profileSnapshot?.aptitudeStrengths) && (
                <CharacterStrengthsSection 
                  characterStrengths={characterStrengths}
                  aptitudeStrengths={profileSnapshot?.aptitudeStrengths} 
                />
              )}

              {/* Big Five Personality Section */}
              {bigFive && (
                <BigFiveSection bigFive={bigFive} />
              )}

              {/* Learning & Work Style Section - Use learningStyle from middle school data */}
              {(learningStyle || profileSnapshot?.keyPatterns) && (
                <LearningWorkStyleSection 
                  learningStyle={learningStyle}
                  keyPatterns={profileSnapshot?.keyPatterns} 
                />
              )}

              {/* Work Values Section */}
              {workValues?.topThree && workValues.topThree.length > 0 && (
                <WorkValuesSection workValues={workValues} />
              )}

              {/* Employability Section */}
              {employability && (employability.strengthAreas || employability.improvementAreas) && (
                <EmployabilitySection employability={employability} />
              )}

              {/* Aptitude AI Analysis Section */}
              {aptitude && (aptitude.topStrengths?.length > 0 || aptitude.cognitiveProfile || aptitude.careerImplications) && (
                <AptitudeAnalysisSection aptitude={aptitude} />
              )}

              {/* Knowledge Section */}
              {knowledge && <KnowledgeSection knowledge={knowledge} />}

              {/* Adaptive Aptitude Section - Show adaptive test results */}
              {adaptiveAptitudeResults && (
                <AdaptiveAptitudeSection adaptiveAptitudeResults={adaptiveAptitudeResults} />
              )}

              {/* Detailed Assessment Breakdown (Developer Reference) */}
              <div>
                <DetailedAssessmentBreakdown 
                  results={normalizedResults} 
                  riasecNames={safeRiasecNames}
                  gradeLevel={isMiddleSchool ? 'middle' : 'highschool'}
                />
              </div>

              {/* Section 2: Career Exploration */}
              {careerFit && (
                <CareerExplorationSection careerFit={careerFit} />
              )}

              {/* Section 3: Skills to Develop */}
              {skillGap && (
                <SkillsToDevelopSection skillGap={skillGap} />
              )}

              {/* Section 4: 12-Month Journey */}
              {roadmap?.twelveMonthJourney && (
                <TwelveMonthJourneySection twelveMonthJourney={roadmap.twelveMonthJourney} />
              )}

              {/* Projects to Try */}
              {roadmap?.projects && roadmap.projects.length > 0 && (
                <ProjectsSection projects={roadmap.projects} />
              )}

              {/* Internship Opportunities */}
              {roadmap?.internship && (
                <InternshipSection internship={roadmap.internship} />
              )}

              {/* Activities & Exposure */}
              {roadmap?.exposure && (
                <ActivitiesExposureSection exposure={roadmap.exposure} />
              )}

              {/* Final Note */}
              {finalNote && (
                <FinalNoteSection finalNote={finalNote} />
              )}

              {/* Report Disclaimer */}
              <ReportDisclaimer />
            </td>
          </tr>
        </tbody>
      </table>
    </div>
  );
};

/**
 * InterestExplorerSection Component
 * Renders RIASEC top three with icons, scores, and descriptions
 * Requirements: 1.1, 2.4 - Interest Explorer with RIASEC profile
 */
const InterestExplorerSection = ({ riasec, safeRiasecNames }) => {
  if (!riasec || !riasec.topThree) return null;

  // 🔧 CRITICAL FIX: Use _originalScores if riasec.scores are all zeros
  let scores = riasec.scores || {};
  const allZeros = Object.values(scores).every(score => score === 0);
  if (allZeros && riasec._originalScores && Object.keys(riasec._originalScores).length > 0) {
    console.log('🔧 PDF InterestExplorer: Using _originalScores instead of zeros');
    scores = riasec._originalScores;
  }

  const maxScore = riasec.maxScore || 20;
  const topInterestsText = riasec.topThree.map(code => safeRiasecNames[code]).join(', ');
  const hasStrongInterests = riasec.topThree.some(code => (scores[code] || 0) >= maxScore * 0.5);
  
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
          {riasec.topThree.map((code, idx) => {
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
          {riasec.topThree.map((code, idx) => {
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

      {/* RIASEC Percentage Breakdown */}
      {riasec.percentages && Object.keys(riasec.percentages).length > 0 && (
        <div style={{ marginTop: '10px' }}>
          <div style={{ fontSize: '10px', fontWeight: 'bold', color: '#1e293b', marginBottom: '6px' }}>
            Interest Profile Breakdown
          </div>
          {Object.entries(riasec.percentages).map(([code, pct]) => (
            <div key={code} style={{ display: 'flex', alignItems: 'center', marginBottom: '3px' }}>
              <div style={{ width: '110px', fontSize: '8px', color: '#4b5563' }}>
                {safeRiasecNames[code]} ({code})
              </div>
              <div style={{ flex: 1, height: '10px', background: '#e5e7eb', borderRadius: '5px', overflow: 'hidden' }}>
                <div style={{ 
                  width: `${pct}%`, 
                  height: '100%', 
                  background: riasec.topThree?.includes(code) ? '#4f46e5' : '#94a3b8', 
                  borderRadius: '5px',
                  transition: 'width 0.3s'
                }} />
              </div>
              <div style={{ width: '35px', textAlign: 'right', fontSize: '9px', fontWeight: '600', color: '#1e293b' }}>
                {pct}%
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Interpretation Text */}
      {riasec.interpretation && (
        <div style={{
          fontSize: '9px',
          color: '#374151',
          lineHeight: '1.5',
          marginTop: '8px',
          padding: '8px',
          background: '#f0f9ff',
          borderRadius: '6px',
          border: '1px solid #bae6fd'
        }}>
          {riasec.interpretation}
        </div>
      )}

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
 * CharacterStrengthsSection Component
 * Renders character strengths and personal qualities
 * Requirements: 1.1, 2.1 - Character strengths for middle/high school
 */
const CharacterStrengthsSection = ({ characterStrengths, aptitudeStrengths }) => {
  // Use characterStrengths (middle school format) or aptitudeStrengths (fallback)
  const strengths = characterStrengths?.strengthDescriptions || 
                   characterStrengths?.topStrengths || 
                   aptitudeStrengths || 
                   [];
  
  if (!strengths || strengths.length === 0) return null;

  return (
    <div style={{ marginTop: '8px' }}>
      <h3 style={printStyles.subTitle}>Character Strengths & Personal Qualities</h3>
      
      {/* Top Strengths List */}
      {characterStrengths?.topStrengths && Array.isArray(characterStrengths.topStrengths) && (
        <div style={{ marginBottom: '10px' }}>
          <div style={{ fontSize: '10px', fontWeight: 'bold', color: '#1e293b', marginBottom: '6px' }}>
            Your Top Strengths:
          </div>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
            {characterStrengths.topStrengths.map((strength, idx) => (
              <span
                key={idx}
                style={{
                  ...printStyles.badge,
                  background: '#dbeafe',
                  color: '#1e40af',
                  border: '1px solid #93c5fd'
                }}
              >
                {safeRender(strength)}
              </span>
            ))}
          </div>
        </div>
      )}
      
      {/* Detailed Strength Descriptions */}
      {characterStrengths?.strengthDescriptions && characterStrengths.strengthDescriptions.length > 0 && (
        <div style={printStyles.twoCol}>
          {characterStrengths.strengthDescriptions.map((strength, idx) => (
            <div key={idx} style={printStyles.card}>
              <div style={{ fontWeight: 'bold', fontSize: '10px', color: '#1e293b', marginBottom: '4px' }}>
                {safeRender(strength.name)}
                {strength.rating && (
                  <span style={{ 
                    marginLeft: '6px', 
                    fontSize: '9px', 
                    color: '#059669',
                    fontWeight: 'normal'
                  }}>
                    ({strength.rating}/5)
                  </span>
                )}
              </div>
              {strength.description && (
                <p style={{ fontSize: '9px', color: '#4b5563', margin: '0', lineHeight: '1.4' }}>
                  {strength.description}
                </p>
              )}
            </div>
          ))}
        </div>
      )}
      
      {/* Growth Areas */}
      {characterStrengths?.growthAreas && characterStrengths.growthAreas.length > 0 && (
        <div style={{ marginTop: '10px' }}>
          <div style={{ fontSize: '10px', fontWeight: 'bold', color: '#1e293b', marginBottom: '6px' }}>
            Areas to Develop:
          </div>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
            {characterStrengths.growthAreas.map((area, idx) => (
              <span
                key={idx}
                style={{
                  ...printStyles.badge,
                  background: '#fef3c7',
                  color: '#92400e',
                  border: '1px solid #fde047'
                }}
              >
                {safeRender(area)}
              </span>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

/**
 * LearningWorkStyleSection Component
 * Renders learning and work style patterns
 * Requirements: 1.1, 2.1 - Learning & work style for middle/high school
 */
const LearningWorkStyleSection = ({ learningStyle, keyPatterns }) => {
  // Use learningStyle (middle school format) or keyPatterns (fallback)
  const style = learningStyle || keyPatterns;
  if (!style) return null;

  return (
    <div style={{ marginTop: '8px' }}>
      <h3 style={printStyles.subTitle}>Learning & Work Preferences</h3>
      <div style={printStyles.twoCol}>
        {/* Preferred Learning Methods */}
        {style.preferredMethods && style.preferredMethods.length > 0 && (
          <div style={printStyles.card}>
            <div style={{ fontWeight: 'bold', fontSize: '10px', color: '#1e293b', marginBottom: '4px' }}>
              How You Learn Best
            </div>
            <ul style={{ margin: '0', paddingLeft: '15px', fontSize: '9px', color: '#4b5563', lineHeight: '1.5' }}>
              {style.preferredMethods.map((method, idx) => (
                <li key={idx}>{safeRender(method)}</li>
              ))}
            </ul>
          </div>
        )}
        
        {/* Work Preference */}
        {style.workPreference && (
          <div style={printStyles.card}>
            <div style={{ fontWeight: 'bold', fontSize: '10px', color: '#1e293b', marginBottom: '4px' }}>
              Work Preference
            </div>
            <p style={{ fontSize: '9px', color: '#4b5563', margin: '0', lineHeight: '1.4' }}>
              {safeRender(style.workPreference)}
            </p>
          </div>
        )}
        
        {/* Team Role */}
        {style.teamRole && (
          <div style={printStyles.card}>
            <div style={{ fontWeight: 'bold', fontSize: '10px', color: '#1e293b', marginBottom: '4px' }}>
              Your Team Role
            </div>
            <p style={{ fontSize: '9px', color: '#4b5563', margin: '0', lineHeight: '1.4' }}>
              {safeRender(style.teamRole)}
            </p>
          </div>
        )}
        
        {/* Problem Solving Approach */}
        {style.problemSolvingApproach && (
          <div style={printStyles.card}>
            <div style={{ fontWeight: 'bold', fontSize: '10px', color: '#1e293b', marginBottom: '4px' }}>
              Problem Solving Style
            </div>
            <p style={{ fontSize: '9px', color: '#4b5563', margin: '0', lineHeight: '1.4' }}>
              {safeRender(style.problemSolvingApproach)}
            </p>
          </div>
        )}
        
        {/* Fallback to keyPatterns format */}
        {keyPatterns && !learningStyle && (
          <>
            {keyPatterns.enjoyment && (
              <div style={printStyles.card}>
                <div style={{ fontWeight: 'bold', fontSize: '10px', color: '#1e293b', marginBottom: '4px' }}>
                  What You Enjoy
                </div>
                <p style={{ fontSize: '9px', color: '#4b5563', margin: '0', lineHeight: '1.4' }}>
                  {safeRender(keyPatterns.enjoyment)}
                </p>
              </div>
            )}
            {keyPatterns.workStyle && (
              <div style={printStyles.card}>
                <div style={{ fontWeight: 'bold', fontSize: '10px', color: '#1e293b', marginBottom: '4px' }}>
                  How You Work Best
                </div>
                <p style={{ fontSize: '9px', color: '#4b5563', margin: '0', lineHeight: '1.4' }}>
                  {safeRender(keyPatterns.workStyle)}
                </p>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
};

/**
 * CareerExplorationSection Component
 * Renders career clusters and sample careers
 * Requirements: 1.1 - Career exploration for middle/high school
 */
const CareerExplorationSection = ({ careerFit }) => {
  if (!careerFit) return null;

  return (
    <>
      <h2 style={{ ...printStyles.sectionTitle, marginTop: '12px' }}>2. Career Exploration</h2>

      {/* Career Clusters with detailed information */}
      {careerFit.clusters && careerFit.clusters.length > 0 && (
        <div style={{ marginBottom: '10px' }}>
          <h3 style={printStyles.subTitle}>Career Paths That Match Your Profile</h3>
          {careerFit.clusters.map((cluster, idx) => (
            <div key={idx} style={{ ...printStyles.card, marginBottom: '6px', pageBreakInside: 'avoid' }}>
              {/* Cluster Header */}
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                <div style={{ fontWeight: 'bold', fontSize: '11px', color: '#1e293b' }}>
                  {safeRender(cluster.title)}
                </div>
                <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                  <span style={{
                    ...printStyles.badge,
                    background: cluster.fit === 'High' ? '#dcfce7' : cluster.fit === 'Medium' ? '#fef3c7' : '#e0f2fe',
                    color: cluster.fit === 'High' ? '#166534' : cluster.fit === 'Medium' ? '#92400e' : '#1e40af',
                    border: cluster.fit === 'High' ? '1px solid #86efac' : cluster.fit === 'Medium' ? '1px solid #fde047' : '1px solid #93c5fd'
                  }}>
                    {cluster.fit} Fit
                  </span>
                  <span style={{ fontSize: '10px', fontWeight: 'bold', color: '#059669' }}>
                    {cluster.matchScore}%
                  </span>
                </div>
              </div>
              
              {/* Description */}
              {cluster.description && (
                <p style={{ fontSize: '9px', color: '#4b5563', margin: '0 0 8px 0', lineHeight: '1.5' }}>
                  {safeRender(cluster.description)}
                </p>
              )}
              
              {/* Why It Fits */}
              {cluster.whyItFits && (
                <div style={{ fontSize: '9px', color: '#1e40af', margin: '0 0 8px 0', lineHeight: '1.5', fontStyle: 'italic' }}>
                  <strong>Why this fits you:</strong> {safeRender(cluster.whyItFits)}
                </div>
              )}

              {/* Evidence Breakdown */}
              {cluster.evidence && (cluster.evidence.interest || cluster.evidence.aptitude || cluster.evidence.personality) && (
                <div style={{ fontSize: '8px', color: '#4b5563', margin: '0 0 8px 0', lineHeight: '1.5', padding: '6px 8px', background: '#f8fafc', borderRadius: '4px', border: '1px solid #e2e8f0' }}>
                  {cluster.evidence.interest && (
                    <p style={{ margin: '0 0 2px 0' }}>• <strong>Interest:</strong> {safeRender(cluster.evidence.interest)}</p>
                  )}
                  {cluster.evidence.aptitude && (
                    <p style={{ margin: '0 0 2px 0' }}>• <strong>Aptitude:</strong> {safeRender(cluster.evidence.aptitude)}</p>
                  )}
                  {cluster.evidence.personality && (
                    <p style={{ margin: '0' }}>• <strong>Personality:</strong> {safeRender(cluster.evidence.personality)}</p>
                  )}
                </div>
              )}

              {/* What You'll Do */}
              {cluster.whatYoullDo && (
                <div style={{ fontSize: '9px', color: '#4b5563', margin: '0 0 8px 0', lineHeight: '1.5' }}>
                  {safeRender(cluster.whatYoullDo)}
                </div>
              )}

              {/* Domains */}
              {cluster.domains && cluster.domains.length > 0 && (
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '4px', marginBottom: '8px' }}>
                  {cluster.domains.map((domain, dIdx) => (
                    <span key={dIdx} style={{ ...printStyles.badge, background: '#f3f4f6', color: '#374151', border: '1px solid #d1d5db', fontSize: '8px' }}>
                      {safeRender(domain)}
                    </span>
                  ))}
                </div>
              )}
              
              {/* Example Careers */}
              {cluster.examples && cluster.examples.length > 0 && (
                <div style={{ marginTop: '8px' }}>
                  <div style={{ fontSize: '9px', fontWeight: 'bold', color: '#1e293b', marginBottom: '4px' }}>
                    Example Careers:
                  </div>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: '4px' }}>
                    {cluster.examples.map((example, exIdx) => (
                      <span
                        key={exIdx}
                        style={{
                          ...printStyles.badge,
                          background: '#f3f4f6',
                          color: '#374151',
                          border: '1px solid #d1d5db',
                          fontSize: '8px'
                        }}
                      >
                        {safeRender(example)}
                      </span>
                    ))}
                  </div>
                </div>
              )}
              
              {/* Career Roles */}
              {cluster.roles && (
                <div style={{ marginTop: '8px', display: 'flex', gap: '12px' }}>
                  {cluster.roles.entry && cluster.roles.entry.length > 0 && (
                    <div style={{ flex: 1 }}>
                      <div style={{ fontSize: '9px', fontWeight: 'bold', color: '#1e293b', marginBottom: '4px' }}>
                        Entry-Level:
                      </div>
                      <ul style={{ margin: '0', paddingLeft: '15px', fontSize: '8px', color: '#6b7280', lineHeight: '1.5' }}>
                        {cluster.roles.entry.map((role, roleIdx) => (
                          <li key={roleIdx}>{safeRender(role)}</li>
                        ))}
                      </ul>
                    </div>
                  )}
                  {cluster.roles.mid && cluster.roles.mid.length > 0 && (
                    <div style={{ flex: 1 }}>
                      <div style={{ fontSize: '9px', fontWeight: 'bold', color: '#1e293b', marginBottom: '4px' }}>
                        Career-Level:
                      </div>
                      <ul style={{ margin: '0', paddingLeft: '15px', fontSize: '8px', color: '#6b7280', lineHeight: '1.5' }}>
                        {cluster.roles.mid.map((role, roleIdx) => (
                          <li key={roleIdx}>{safeRender(role)}</li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Specific Career Options by Fit Level */}
      {careerFit.specificOptions && (
        <div style={{ marginTop: '8px' }}>
          <h3 style={printStyles.subTitle}>Recommended Career Options</h3>
          <div style={printStyles.twoCol}>
            {/* High Fit Careers */}
            {careerFit.specificOptions.highFit && careerFit.specificOptions.highFit.length > 0 && (
              <div style={printStyles.card}>
                <div style={{ fontWeight: 'bold', fontSize: '10px', color: '#166534', marginBottom: '6px' }}>
                  ⭐ Best Match Careers
                </div>
                <ul style={{ margin: '0', paddingLeft: '15px', fontSize: '9px', color: '#4b5563', lineHeight: '1.6' }}>
                  {careerFit.specificOptions.highFit.map((career, idx) => (
                    <li key={idx}>
                      {safeRender(career.name || career)}
                      {career.salary && (
                        <span style={{ fontSize: '8px', color: '#6b7280', marginLeft: '4px' }}>
                          (₹{career.salary.min}-{career.salary.max} LPA)
                        </span>
                      )}
                    </li>
                  ))}
                </ul>
              </div>
            )}
            
            {/* Medium Fit Careers */}
            {careerFit.specificOptions.mediumFit && careerFit.specificOptions.mediumFit.length > 0 && (
              <div style={printStyles.card}>
                <div style={{ fontWeight: 'bold', fontSize: '10px', color: '#92400e', marginBottom: '6px' }}>
                  💡 Good Match Careers
                </div>
                <ul style={{ margin: '0', paddingLeft: '15px', fontSize: '9px', color: '#4b5563', lineHeight: '1.6' }}>
                  {careerFit.specificOptions.mediumFit.map((career, idx) => (
                    <li key={idx}>
                      {safeRender(career.name || career)}
                      {career.salary && (
                        <span style={{ fontSize: '8px', color: '#6b7280', marginLeft: '4px' }}>
                          (₹{career.salary.min}-{career.salary.max} LPA)
                        </span>
                      )}
                    </li>
                  ))}
                </ul>
              </div>
            )}
            
            {/* Explore Later Careers */}
            {careerFit.specificOptions.exploreLater && careerFit.specificOptions.exploreLater.length > 0 && (
              <div style={printStyles.card}>
                <div style={{ fontWeight: 'bold', fontSize: '10px', color: '#1e40af', marginBottom: '6px' }}>
                  🔍 Careers to Explore
                </div>
                <ul style={{ margin: '0', paddingLeft: '15px', fontSize: '9px', color: '#4b5563', lineHeight: '1.6' }}>
                  {careerFit.specificOptions.exploreLater.map((career, idx) => (
                    <li key={idx}>
                      {safeRender(career.name || career)}
                      {career.salary && (
                        <span style={{ fontSize: '8px', color: '#6b7280', marginLeft: '4px' }}>
                          (₹{career.salary.min}-{career.salary.max} LPA)
                        </span>
                      )}
                    </li>
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
 * SkillsToDevelopSection Component
 * Renders skills to develop with priority indicators
 * Requirements: 1.1 - Skills to develop for middle/high school
 */
const SkillsToDevelopSection = ({ skillGap }) => {
  const priorityAItems = skillGap.priorityA || [];
  const priorityBItems = skillGap.priorityB || [];
  const legacyGaps = skillGap.gaps || [];
  const hasSkills = priorityAItems.length > 0 || priorityBItems.length > 0 || legacyGaps.length > 0;

  return (
    <>
      <h2 style={{ ...printStyles.sectionTitle, marginTop: '12px' }}>3. Skills to Develop</h2>

      {/* Recommended Track */}
      {skillGap.recommendedTrack && (
        <div style={{
          ...printStyles.summaryBox,
          marginBottom: '8px'
        }}>
          <strong style={{ fontSize: '10px', color: '#0369a1' }}>Recommended Track: </strong>
          <span style={{ fontSize: '10px', color: '#1e293b' }}>{skillGap.recommendedTrack}</span>
        </div>
      )}

      {/* Current Strengths */}
      {skillGap.currentStrengths && skillGap.currentStrengths.length > 0 && (
        <div style={{ marginBottom: '8px' }}>
          <div style={{ fontSize: '10px', fontWeight: 'bold', color: '#1e293b', marginBottom: '4px' }}>
            Current Strengths:
          </div>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
            {skillGap.currentStrengths.map((strength, idx) => (
              <span key={idx} style={{
                ...printStyles.badge,
                background: '#dcfce7',
                color: '#166534',
                border: '1px solid #86efac'
              }}>
                {safeRender(strength)}
              </span>
            ))}
          </div>
        </div>
      )}

      {/* Priority A + B skills table */}
      {hasSkills && (
        <div>
          <table style={printStyles.table}>
            <thead>
              <tr>
                <th style={printStyles.th}>Skill</th>
                <th style={printStyles.th}>Details</th>
                <th style={{ ...printStyles.th, width: '80px' }}>Priority</th>
              </tr>
            </thead>
            <tbody>
              {/* Legacy gaps format */}
              {legacyGaps.map((gap, idx) => {
                const priority = gap.priority || 'Medium';
                const priorityColors = {
                  High: { bg: '#fee2e2', color: '#991b1b', border: '#fca5a5' },
                  Medium: { bg: '#fef9c3', color: '#854d0e', border: '#fde047' },
                  Low: { bg: '#dcfce7', color: '#166534', border: '#86efac' }
                };
                const colors = priorityColors[priority] || priorityColors.Medium;
                return (
                  <tr key={`gap-${idx}`}>
                    <td style={printStyles.td}>{safeRender(gap.skill || gap)}</td>
                    <td style={printStyles.td}>
                      <span style={{ fontSize: '8px', color: '#6b7280' }}>{gap.reason || ''}</span>
                    </td>
                    <td style={printStyles.td}>
                      <span style={{ ...printStyles.badge, background: colors.bg, color: colors.color, border: `1px solid ${colors.border}` }}>
                        {priority}
                      </span>
                    </td>
                  </tr>
                );
              })}
              {/* Priority A items (High) */}
              {priorityAItems.map((item, idx) => (
                <tr key={`a-${idx}`}>
                  <td style={{ ...printStyles.td, fontWeight: '600' }}>
                    {safeRender(item.skill)}
                    {item.currentLevel && item.targetLevel && (
                      <div style={{ fontSize: '8px', color: '#6b7280', fontWeight: 'normal', marginTop: '2px' }}>
                        {item.currentLevel} → {item.targetLevel}
                      </div>
                    )}
                  </td>
                  <td style={printStyles.td}>
                    <span style={{ fontSize: '8px', color: '#4b5563', lineHeight: '1.4' }}>{item.reason || ''}</span>
                  </td>
                  <td style={printStyles.td}>
                    <span style={{ ...printStyles.badge, background: '#fee2e2', color: '#991b1b', border: '1px solid #fca5a5' }}>
                      High
                    </span>
                  </td>
                </tr>
              ))}
              {/* Priority B items (Medium) */}
              {priorityBItems.map((item, idx) => (
                <tr key={`b-${idx}`}>
                  <td style={{ ...printStyles.td, fontWeight: '600' }}>{safeRender(item.skill)}</td>
                  <td style={printStyles.td}>
                    <span style={{ fontSize: '8px', color: '#4b5563', lineHeight: '1.4' }}>{item.reason || ''}</span>
                  </td>
                  <td style={printStyles.td}>
                    <span style={{ ...printStyles.badge, background: '#fef9c3', color: '#854d0e', border: '1px solid #fde047' }}>
                      Medium
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </>
  );
};

/**
 * TwelveMonthJourneySection Component
 * Renders 12-month journey timeline
 * Requirements: 1.1 - 12-month journey for middle/high school
 */
const TwelveMonthJourneySection = ({ twelveMonthJourney }) => {
  // Handle various data formats:
  // 1. Array of items (legacy)
  // 2. Object with items/months array (legacy)
  // 3. Object with phase1-phase4 (middle/high school format)
  let journeyPhases = [];

  if (Array.isArray(twelveMonthJourney)) {
    journeyPhases = twelveMonthJourney.map((item, idx) => ({
      title: item.title || item.month || `Month ${idx + 1}`,
      months: item.months || '',
      goals: item.goals || [],
      activities: item.activities || (item.activity ? [item.activity] : []),
      outcome: item.outcome || ''
    }));
  } else if (twelveMonthJourney?.items || twelveMonthJourney?.months) {
    const items = twelveMonthJourney.items || twelveMonthJourney.months || [];
    journeyPhases = items.map((item, idx) => ({
      title: item.title || item.month || `Month ${idx + 1}`,
      months: item.months || '',
      goals: item.goals || [],
      activities: item.activities || (item.activity ? [item.activity] : []),
      outcome: item.outcome || ''
    }));
  } else {
    // Extract phase1-phase4 (or more) from the object
    const phaseKeys = Object.keys(twelveMonthJourney || {})
      .filter(k => k.startsWith('phase'))
      .sort();
    journeyPhases = phaseKeys.map(key => twelveMonthJourney[key]).filter(Boolean);
  }

  if (journeyPhases.length === 0) return null;

  const phaseColors = ['#4f46e5', '#059669', '#d97706', '#dc2626'];

  return (
    <>
      <h2 style={{ ...printStyles.sectionTitle, marginTop: '12px' }}>4. Your 12-Month Journey</h2>
      <div style={{ marginTop: '10px' }}>
        {journeyPhases.map((phase, idx) => (
          <div key={idx} style={{ ...printStyles.card, marginBottom: '8px', borderLeft: `3px solid ${phaseColors[idx % phaseColors.length]}` }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '4px' }}>
              <div style={{ fontWeight: 'bold', fontSize: '11px', color: phaseColors[idx % phaseColors.length] }}>
                {safeRender(phase.title)}
              </div>
              {phase.months && (
                <span style={{ fontSize: '8px', color: '#6b7280', fontStyle: 'italic' }}>
                  {phase.months}
                </span>
              )}
            </div>

            {phase.goals && phase.goals.length > 0 && (
              <div style={{ marginBottom: '4px' }}>
                <div style={{ fontSize: '9px', fontWeight: 'bold', color: '#1e293b', marginBottom: '2px' }}>Goals:</div>
                <ul style={{ margin: '0', paddingLeft: '15px', fontSize: '9px', color: '#4b5563', lineHeight: '1.5' }}>
                  {phase.goals.map((goal, gIdx) => (
                    <li key={gIdx}>{safeRender(goal)}</li>
                  ))}
                </ul>
              </div>
            )}

            {phase.activities && phase.activities.length > 0 && (
              <div style={{ marginBottom: '4px' }}>
                <div style={{ fontSize: '9px', fontWeight: 'bold', color: '#1e293b', marginBottom: '2px' }}>Activities:</div>
                <ul style={{ margin: '0', paddingLeft: '15px', fontSize: '9px', color: '#4b5563', lineHeight: '1.5' }}>
                  {phase.activities.map((activity, aIdx) => (
                    <li key={aIdx}>{safeRender(activity)}</li>
                  ))}
                </ul>
              </div>
            )}

            {phase.outcome && (
              <div style={{ fontSize: '9px', color: '#059669', fontStyle: 'italic', marginTop: '2px' }}>
                <strong>Outcome:</strong> {phase.outcome}
              </div>
            )}
          </div>
        ))}
      </div>
    </>
  );
};

/**
 * ProjectsSection Component
 * Renders projects to try
 * Requirements: 1.1 - Projects for middle/high school
 */
const ProjectsSection = ({ projects }) => {
  if (!projects || projects.length === 0) return null;

  return (
    <>
      <h3 style={{ ...printStyles.subTitle, marginTop: '12px' }}>Projects to Try</h3>
      {projects.map((project, idx) => (
        <div key={idx} style={{ ...printStyles.card, marginBottom: '6px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '4px' }}>
            <div style={{ fontWeight: 'bold', fontSize: '10px', color: '#1e293b' }}>
              {safeRender(project.title || project.name || project)}
            </div>
            <div style={{ display: 'flex', gap: '6px' }}>
              {project.difficulty && (
                <span style={{ ...printStyles.badge, background: '#e0e7ff', color: '#4338ca', border: '1px solid #a5b4fc' }}>
                  {project.difficulty}
                </span>
              )}
              {project.timeline && (
                <span style={{ ...printStyles.badge, background: '#fef3c7', color: '#92400e', border: '1px solid #fde047' }}>
                  {project.timeline}
                </span>
              )}
            </div>
          </div>
          {project.description && (
            <p style={{ fontSize: '9px', color: '#4b5563', margin: '0 0 4px 0', lineHeight: '1.4' }}>
              {project.description}
            </p>
          )}
          {project.purpose && (
            <p style={{ fontSize: '8px', color: '#059669', margin: '0 0 4px 0', lineHeight: '1.4', fontStyle: 'italic' }}>
              <strong>Purpose:</strong> {safeRender(project.purpose)}
            </p>
          )}
          {project.output && (
            <p style={{ fontSize: '8px', color: '#0369a1', margin: '0 0 4px 0', lineHeight: '1.4' }}>
              <strong>Expected Output:</strong> {safeRender(project.output)}
            </p>
          )}
          {project.skills && project.skills.length > 0 && (
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '4px', marginTop: '4px' }}>
              {project.skills.map((skill, sIdx) => (
                <span key={sIdx} style={{ ...printStyles.badge, background: '#f3f4f6', color: '#374151', border: '1px solid #d1d5db', fontSize: '7px' }}>
                  {safeRender(skill)}
                </span>
              ))}
            </div>
          )}
          {project.steps && project.steps.length > 0 && (
            <ol style={{ margin: '4px 0 0 0', paddingLeft: '18px', fontSize: '8px', color: '#6b7280', lineHeight: '1.5' }}>
              {project.steps.map((step, sIdx) => (
                <li key={sIdx}>{safeRender(step)}</li>
              ))}
            </ol>
          )}
        </div>
      ))}
    </>
  );
};

/**
 * ActivitiesExposureSection Component
 * Renders activities and exposure opportunities
 * Requirements: 1.1 - Activities & exposure for middle/high school
 */
const ActivitiesExposureSection = ({ exposure }) => {
  if (!exposure) return null;

  return (
    <div style={{ ...printStyles.twoCol, marginTop: '8px' }}>
      {exposure.activities && exposure.activities.length > 0 && (
        <div style={printStyles.card}>
          <div style={{ fontWeight: 'bold', fontSize: '10px', color: '#1e293b', marginBottom: '6px' }}>
            Activities to Try
          </div>
          <ul style={{ margin: '0', paddingLeft: '15px', fontSize: '9px', color: '#4b5563', lineHeight: '1.5' }}>
            {exposure.activities.map((activity, idx) => (
              <li key={idx}>{safeRender(activity)}</li>
            ))}
          </ul>
        </div>
      )}

      {exposure.resources && exposure.resources.length > 0 && (
        <div style={printStyles.card}>
          <div style={{ fontWeight: 'bold', fontSize: '10px', color: '#1e293b', marginBottom: '6px' }}>
            Resources to Explore
          </div>
          <ul style={{ margin: '0', paddingLeft: '15px', fontSize: '9px', color: '#4b5563', lineHeight: '1.5' }}>
            {exposure.resources.map((resource, idx) => (
              <li key={idx}>{safeRender(resource)}</li>
            ))}
          </ul>
        </div>
      )}

      {exposure.certifications && exposure.certifications.length > 0 && (
        <div style={printStyles.card}>
          <div style={{ fontWeight: 'bold', fontSize: '10px', color: '#1e293b', marginBottom: '6px' }}>
            Suggested Certifications
          </div>
          <ul style={{ margin: '0', paddingLeft: '15px', fontSize: '9px', color: '#4b5563', lineHeight: '1.5' }}>
            {exposure.certifications.map((cert, idx) => (
              <li key={idx}>{safeRender(cert)}</li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
};

/**
 * FinalNoteSection Component
 * Renders final note message
 * Requirements: 1.1 - Final note for middle/high school
 */
const FinalNoteSection = ({ finalNote }) => {
  if (!finalNote) return null;

  return (
    <div style={printStyles.finalBox}>
      <h3 style={{ margin: '0 0 10px 0', fontSize: '12px', color: '#fbbf24' }}>Message for You</h3>
      {finalNote.advantage && (
        <p style={{ margin: '0 0 8px 0', fontSize: '10px', lineHeight: '1.6' }}>
          <strong>Your Advantage:</strong> {finalNote.advantage}
        </p>
      )}
      {finalNote.growthFocus && (
        <p style={{ margin: '0', fontSize: '10px', lineHeight: '1.6' }}>
          <strong>Next Step:</strong> {finalNote.growthFocus}
        </p>
      )}
      {finalNote.nextReview && (
        <p style={{ margin: '8px 0 0 0', fontSize: '10px', lineHeight: '1.6', fontStyle: 'italic' }}>
          {finalNote.nextReview}
        </p>
      )}
    </div>
  );
};

/**
 * AptitudeAnalysisSection Component
 * Renders AI-analyzed aptitude insights (topStrengths, areasToImprove, cognitiveProfile, careerImplications)
 */
const AptitudeAnalysisSection = ({ aptitude }) => {
  if (!aptitude) return null;
  const hasContent = (aptitude.topStrengths?.length > 0) || aptitude.cognitiveProfile || aptitude.careerImplications;
  if (!hasContent) return null;

  return (
    <div style={{ marginTop: '8px' }}>
      <h3 style={printStyles.subTitle}>Cognitive Abilities</h3>

      {aptitude.overallScore > 0 && (
        <div style={{ ...printStyles.card, marginBottom: '8px', background: '#f0f9ff', border: '1px solid #bae6fd' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div style={{ fontWeight: 'bold', fontSize: '10px', color: '#0369a1' }}>Overall Cognitive Score</div>
            <span style={{
              ...printStyles.badge,
              background: '#dbeafe',
              color: '#1e40af',
              border: '1px solid #93c5fd',
              fontSize: '10px',
              fontWeight: 'bold'
            }}>
              {Math.round(aptitude.overallScore)}%
            </span>
          </div>
        </div>
      )}

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

      {aptitude.areasToImprove && aptitude.areasToImprove.length > 0 && (
        <div style={{ marginBottom: '8px' }}>
          <span style={{ fontSize: '9px', fontWeight: 'bold', color: '#854d0e' }}>Areas to Improve: </span>
          {aptitude.areasToImprove.map((area, idx) => (
            <span key={idx} style={{
              ...printStyles.badge,
              background: '#fef9c3',
              color: '#854d0e',
              border: '1px solid #fde047',
              marginRight: '4px'
            }}>
              {safeRender(area)}
            </span>
          ))}
        </div>
      )}

      {aptitude.cognitiveProfile && (
        <div style={{ ...printStyles.summaryBox, marginTop: '6px' }}>
          <h4 style={{ margin: '0 0 4px 0', fontSize: '9px', fontWeight: 'bold', color: '#0369a1' }}>
            Cognitive Profile
          </h4>
          <p style={{ margin: '0', fontSize: '8px', lineHeight: '1.5', color: '#475569' }}>
            {safeRender(aptitude.cognitiveProfile)}
          </p>
        </div>
      )}

      {aptitude.careerImplications && (
        <div style={{ ...printStyles.card, marginTop: '6px', background: '#eff6ff', border: '1px solid #bfdbfe' }}>
          <p style={{ margin: '0', fontSize: '9px', lineHeight: '1.5', color: '#1e40af' }}>
            <strong>Career Implications:</strong> {safeRender(aptitude.careerImplications)}
          </p>
        </div>
      )}
    </div>
  );
};

/**
 * KnowledgeSection Component
 * Renders knowledge assessment results (score, strong/weak topics, recommendation)
 */
const KnowledgeSection = ({ knowledge }) => {
  if (!knowledge || Object.keys(knowledge).length === 0) return null;

  const score = typeof knowledge.score === 'number' ? Math.round(knowledge.score) : 0;
  const correctCount = knowledge.correctCount || 0;
  const totalQuestions = knowledge.totalQuestions || 0;
  const strongTopics = knowledge.strongTopics || [];
  const weakTopics = knowledge.weakTopics || [];

  const isNoData = (arr) => !arr || arr.length === 0 || (arr.length === 1 && arr[0] === 'No data');
  const hasData = score > 0 || !isNoData(strongTopics) || !isNoData(weakTopics);
  if (!hasData) return null;

  const scoreStyle = getScoreStyle(score);

  return (
    <div style={{ marginTop: '8px' }}>
      <h3 style={printStyles.subTitle}>Knowledge Assessment</h3>

      <div style={{ ...printStyles.card, marginBottom: '8px', background: '#f0f9ff', border: '1px solid #bae6fd' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
          <div style={{ fontWeight: 'bold', fontSize: '10px', color: '#0369a1' }}>Overall Knowledge Score</div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            {totalQuestions > 0 && (
              <span style={{ fontSize: '10px', fontWeight: '600', color: '#1e293b' }}>
                {correctCount}/{totalQuestions}
              </span>
            )}
            <span style={{
              ...printStyles.badge,
              background: scoreStyle.bg,
              color: scoreStyle.color,
              border: `1px solid ${scoreStyle.border}`,
              fontSize: '10px',
              fontWeight: 'bold'
            }}>
              {score}%
            </span>
          </div>
        </div>
        <div style={printStyles.progressBar}>
          <div style={{ width: `${score}%`, height: '100%', background: score >= 70 ? '#22c55e' : score >= 40 ? '#eab308' : '#ef4444', borderRadius: '3px' }}></div>
        </div>
      </div>

      {(!isNoData(strongTopics) || !isNoData(weakTopics)) && (
        <div style={printStyles.twoCol}>
          {!isNoData(strongTopics) && (
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
          {!isNoData(weakTopics) && (
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

      {knowledge.recommendation && (
        <div style={{ ...printStyles.card, marginTop: '6px', background: '#eff6ff', border: '1px solid #bfdbfe' }}>
          <p style={{ margin: '0', fontSize: '9px', lineHeight: '1.5', color: '#1e40af' }}>
            <strong>Recommendation:</strong> {safeRender(knowledge.recommendation)}
          </p>
        </div>
      )}
    </div>
  );
};

/**
 * AdaptiveAptitudeSection Component
 * Renders adaptive aptitude test results
 * Requirements: 1.1, 2.1 - Adaptive aptitude for middle/high school
 */
const AdaptiveAptitudeSection = ({ adaptiveAptitudeResults }) => {
  if (!adaptiveAptitudeResults) return null;

  // Handle both snake_case and camelCase field names
  const {
    aptitude_level,
    aptitudeLevel,
    overall_accuracy,
    overallAccuracy,
    total_questions,
    totalQuestions,
    total_correct,
    totalCorrect,
    confidence_tag,
    confidenceTag,
    tier,
    accuracy_by_subtag,
    accuracyBySubtag,
    path_classification,
    pathClassification,
    accuracy_by_difficulty,
    accuracyByDifficulty,
    average_response_time_ms,
    averageResponseTimeMs
  } = adaptiveAptitudeResults;

  const level = aptitude_level || aptitudeLevel;
  const accuracy = overall_accuracy || overallAccuracy;
  const questions = total_questions || totalQuestions;
  const correct = total_correct || totalCorrect;
  const confidence = confidence_tag || confidenceTag;
  const subtags = accuracy_by_subtag || accuracyBySubtag;
  const classification = path_classification || pathClassification;
  const difficultyBreakdown = accuracy_by_difficulty || accuracyByDifficulty;
  const avgResponseMs = average_response_time_ms || averageResponseTimeMs;

  return (
    <div style={{ marginTop: '8px' }}>
      <h3 style={printStyles.subTitle}>Adaptive Aptitude Test Results</h3>
      
      {/* Overall Summary */}
      <div style={{ ...printStyles.card, marginBottom: '10px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
          <div>
            <div style={{ fontSize: '10px', fontWeight: 'bold', color: '#1e293b' }}>
              Aptitude Level: {level}/10
            </div>
            <div style={{ fontSize: '9px', color: '#6b7280', marginTop: '2px' }}>
              Tier: {tier} | Confidence: {confidence}
              {classification && (
                <span> | Path: <span style={{
                  ...printStyles.badge,
                  background: '#e0e7ff',
                  color: '#4338ca',
                  border: '1px solid #a5b4fc',
                  marginLeft: '4px',
                  textTransform: 'capitalize'
                }}>{classification}</span></span>
              )}
            </div>
          </div>
          <div style={{ textAlign: 'right' }}>
            <div style={{ fontSize: '10px', fontWeight: 'bold', color: '#059669' }}>
              {typeof accuracy === 'number' ? accuracy.toFixed(1) : accuracy}% Accuracy
            </div>
            <div style={{ fontSize: '9px', color: '#6b7280', marginTop: '2px' }}>
              {correct}/{questions} correct
              {avgResponseMs && (
                <span> | Avg: {(avgResponseMs / 1000).toFixed(1)}s/question</span>
              )}
            </div>
          </div>
        </div>
      </div>
      
      {/* Question Type Breakdown */}
      {subtags && Object.keys(subtags).length > 0 && (
        <div>
          <div style={{ fontSize: '10px', fontWeight: 'bold', color: '#1e293b', marginBottom: '8px' }}>
            Performance by Question Type:
          </div>
          <div style={printStyles.twoCol}>
            {Object.entries(subtags).map(([type, data]) => {
              const typeName = type.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
              const acc = data.accuracy?.toFixed(1) || 0;
              const color = acc >= 70 ? '#059669' : acc >= 50 ? '#d97706' : '#dc2626';
              
              return (
                <div key={type} style={printStyles.card}>
                  <div style={{ fontWeight: 'bold', fontSize: '10px', color: '#1e293b', marginBottom: '4px' }}>
                    {typeName}
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span style={{ fontSize: '9px', color: '#6b7280' }}>
                      {data.correct}/{data.total} correct
                    </span>
                    <span style={{ fontSize: '10px', fontWeight: 'bold', color }}>
                      {acc}%
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Accuracy by Difficulty Level */}
      {difficultyBreakdown && Object.keys(difficultyBreakdown).length > 0 && (
        <div style={{ marginTop: '8px' }}>
          <div style={{ fontSize: '10px', fontWeight: 'bold', color: '#1e293b', marginBottom: '6px' }}>
            Accuracy by Difficulty Level:
          </div>
          <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
            {Object.entries(difficultyBreakdown)
              .sort(([a], [b]) => Number(a) - Number(b))
              .map(([diffLevel, data]) => {
                const acc = typeof data.accuracy === 'number' ? Math.round(data.accuracy) : 0;
                const scoreStyle = getScoreStyle(acc);
                return (
                  <div key={diffLevel} style={{
                    ...printStyles.card,
                    flex: '1 1 60px',
                    textAlign: 'center',
                    minWidth: '60px'
                  }}>
                    <div style={{ fontSize: '9px', fontWeight: 'bold', color: '#1e293b', marginBottom: '2px' }}>
                      Level {diffLevel}
                    </div>
                    <div style={{ fontSize: '8px', color: '#6b7280', marginBottom: '2px' }}>
                      {data.correct}/{data.total}
                    </div>
                    <span style={{
                      ...printStyles.badge,
                      background: scoreStyle.bg,
                      color: scoreStyle.color,
                      border: `1px solid ${scoreStyle.border}`
                    }}>
                      {acc}%
                    </span>
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

        {streamRecommendation.matchScore && (
          <div style={{ 
            fontSize: '11px', 
            color: '#059669',
            fontWeight: '600',
            textAlign: 'center',
            marginBottom: '10px'
          }}>
            Match Score: {Math.round(streamRecommendation.matchScore)}%
          </div>
        )}

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
 * OverallSummarySection Component
 * Renders overall assessment summary in a prominent highlight box
 */
const OverallSummarySection = ({ overallSummary }) => {
  if (!overallSummary) return null;
  return (
    <div style={{
      background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
      borderRadius: '8px',
      padding: '12px 16px',
      marginBottom: '10px',
      color: 'white'
    }}>
      <h3 style={{ fontSize: '12px', fontWeight: 'bold', margin: '0 0 6px 0', color: '#ffffff' }}>
        Overall Assessment Summary
      </h3>
      <p style={{ fontSize: '10px', lineHeight: '1.6', margin: '0', color: '#f0f0ff' }}>
        {overallSummary}
      </p>
    </div>
  );
};

/**
 * ProfileSnapshotDetailsSection Component
 * Renders interest highlights and personality insights from profileSnapshot
 */
const ProfileSnapshotDetailsSection = ({ profileSnapshot }) => {
  if (!profileSnapshot) return null;
  const { interestHighlights, personalityInsights, keyPatterns } = profileSnapshot;
  if (!interestHighlights?.length && !personalityInsights?.length && !keyPatterns) return null;

  return (
    <div style={{ marginBottom: '8px' }}>
      {interestHighlights && interestHighlights.length > 0 && (
        <div style={{ marginBottom: '6px' }}>
          <div style={{ fontSize: '10px', fontWeight: 'bold', color: '#1e293b', marginBottom: '4px' }}>
            Key Interest Areas:
          </div>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
            {interestHighlights.map((highlight, idx) => (
              <span key={idx} style={{
                ...printStyles.badge,
                background: '#e0e7ff',
                color: '#4338ca',
                border: '1px solid #a5b4fc'
              }}>
                {safeRender(highlight)}
              </span>
            ))}
          </div>
        </div>
      )}
      {personalityInsights && personalityInsights.length > 0 && (
        <div style={{
          fontSize: '9px',
          color: '#374151',
          lineHeight: '1.5',
          padding: '6px 8px',
          background: '#faf5ff',
          borderRadius: '6px',
          border: '1px solid #e9d5ff'
        }}>
          {personalityInsights.map((insight, idx) => (
            <p key={idx} style={{ margin: idx === 0 ? '0' : '4px 0 0 0' }}>{safeRender(insight)}</p>
          ))}
        </div>
      )}
      {keyPatterns && (keyPatterns.strength || keyPatterns.motivation || keyPatterns.enjoyment || keyPatterns.workStyle) && (
        <div style={{ ...printStyles.card, marginTop: '6px', background: '#f0fdf4', border: '1px solid #bbf7d0' }}>
          {keyPatterns.strength && (
            <p style={{ fontSize: '9px', color: '#166534', margin: '0 0 4px 0', lineHeight: '1.5' }}>
              <strong>Strength:</strong> {safeRender(keyPatterns.strength)}
            </p>
          )}
          {keyPatterns.enjoyment && (
            <p style={{ fontSize: '9px', color: '#166534', margin: '0 0 4px 0', lineHeight: '1.5' }}>
              <strong>Enjoyment:</strong> {safeRender(keyPatterns.enjoyment)}
            </p>
          )}
          {keyPatterns.workStyle && (
            <p style={{ fontSize: '9px', color: '#166534', margin: '0 0 4px 0', lineHeight: '1.5' }}>
              <strong>Work Style:</strong> {safeRender(keyPatterns.workStyle)}
            </p>
          )}
          {keyPatterns.motivation && (
            <p style={{ fontSize: '9px', color: '#166534', margin: '0', lineHeight: '1.5' }}>
              <strong>Motivation:</strong> {safeRender(keyPatterns.motivation)}
            </p>
          )}
        </div>
      )}
    </div>
  );
};

/**
 * BigFiveSection Component
 * Renders Big Five personality trait scores with progress bars
 */
const BigFiveSection = ({ bigFive }) => {
  if (!bigFive) return null;

  const traits = [
    { code: 'O', name: 'Openness', desc: 'Curiosity and willingness to try new things' },
    { code: 'C', name: 'Conscientiousness', desc: 'Organization and self-discipline' },
    { code: 'E', name: 'Extraversion', desc: 'Energy from social interactions' },
    { code: 'A', name: 'Agreeableness', desc: 'Cooperation and kindness' },
    { code: 'N', name: 'Neuroticism', desc: 'Emotional sensitivity' }
  ];

  const getBarColor = (score) => {
    if (score >= 4) return '#22c55e';
    if (score >= 3) return '#eab308';
    return '#ef4444';
  };

  return (
    <div style={{ marginTop: '8px' }}>
      <h3 style={printStyles.subTitle}>Personality Profile (Big Five)</h3>
      <div style={printStyles.card}>
        {traits.map((trait) => {
          const score = bigFive[trait.code] || 0;
          const percentage = Math.round((score / 5) * 100);
          return (
            <div key={trait.code} style={{ marginBottom: '6px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2px' }}>
                <div style={{ fontSize: '9px', fontWeight: 'bold', color: '#1e293b' }}>
                  {trait.name}
                  <span style={{ fontWeight: 'normal', color: '#6b7280', marginLeft: '4px', fontSize: '8px' }}>
                    {trait.desc}
                  </span>
                </div>
                <div style={{ fontSize: '9px', fontWeight: '600', color: '#1e293b' }}>
                  {score.toFixed(1)}/5
                </div>
              </div>
              <div style={printStyles.progressBar}>
                <div style={{ width: `${percentage}%`, height: '100%', background: getBarColor(score), borderRadius: '3px' }} />
              </div>
            </div>
          );
        })}
        {bigFive.dominantTraits && bigFive.dominantTraits.length > 0 && (
          <div style={{ marginTop: '6px', display: 'flex', flexWrap: 'wrap', gap: '4px', alignItems: 'center' }}>
            <span style={{ fontSize: '9px', fontWeight: 'bold', color: '#1e293b' }}>Dominant Traits:</span>
            {bigFive.dominantTraits.map((trait, idx) => (
              <span key={idx} style={{ ...printStyles.badge, background: '#dbeafe', color: '#1e40af', border: '1px solid #93c5fd' }}>
                {safeRender(trait)}
              </span>
            ))}
          </div>
        )}
        {bigFive.workStyleSummary && (
          <div style={{
            fontSize: '9px',
            color: '#374151',
            lineHeight: '1.5',
            marginTop: '8px',
            padding: '6px 8px',
            background: '#f8fafc',
            borderRadius: '4px',
            border: '1px solid #e2e8f0'
          }}>
            <strong>Work Style:</strong> {bigFive.workStyleSummary}
          </div>
        )}
      </div>
    </div>
  );
};

/**
 * WorkValuesSection Component
 * Renders top work values with scores
 */
const WorkValuesSection = ({ workValues }) => {
  if (!workValues?.topThree || workValues.topThree.length === 0) return null;

  const medalEmojis = ['🥇', '🥈', '🥉'];

  return (
    <div style={{ marginTop: '8px' }}>
      <h3 style={printStyles.subTitle}>Work Values</h3>
      {workValues.motivationSummary && (
        <div style={{ ...printStyles.card, marginBottom: '8px', background: '#eff6ff', border: '1px solid #bfdbfe' }}>
          <p style={{ margin: '0', fontSize: '9px', lineHeight: '1.5', color: '#1e40af' }}>
            {safeRender(workValues.motivationSummary)}
          </p>
        </div>
      )}
      <div style={{ display: 'flex', gap: '8px' }}>
        {workValues.topThree.map((item, idx) => (
          <div key={idx} style={{
            ...printStyles.card,
            flex: 1,
            textAlign: 'center'
          }}>
            <div style={{ fontSize: '16px', marginBottom: '4px' }}>{medalEmojis[idx] || '⭐'}</div>
            <div style={{ fontWeight: 'bold', fontSize: '10px', color: '#1e293b', marginBottom: '2px' }}>
              {safeRender(item.value)}
            </div>
            <div style={{ fontSize: '9px', color: '#059669', fontWeight: '600' }}>
              {item.score}/5
            </div>
            {item.description && (
              <div style={{ fontSize: '8px', color: '#6b7280', marginTop: '3px', lineHeight: '1.4' }}>
                {safeRender(item.description)}
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
};

/**
 * EmployabilitySection Component
 * Renders employability strength and improvement areas
 */
const EmployabilitySection = ({ employability }) => {
  if (!employability) return null;
  const { strengthAreas, improvementAreas } = employability;
  if (!strengthAreas?.length && !improvementAreas?.length) return null;

  return (
    <div style={{ marginTop: '8px' }}>
      <h3 style={printStyles.subTitle}>Employability Skills</h3>
      <div style={printStyles.twoCol}>
        {strengthAreas && strengthAreas.length > 0 && (
          <div style={printStyles.card}>
            <div style={{ fontWeight: 'bold', fontSize: '10px', color: '#166534', marginBottom: '6px' }}>
              ✅ Strengths
            </div>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '4px' }}>
              {strengthAreas.map((area, idx) => (
                <span key={idx} style={{
                  ...printStyles.badge,
                  background: '#dcfce7',
                  color: '#166534',
                  border: '1px solid #86efac'
                }}>
                  {safeRender(area)}
                </span>
              ))}
            </div>
          </div>
        )}
        {improvementAreas && improvementAreas.length > 0 && (
          <div style={printStyles.card}>
            <div style={{ fontWeight: 'bold', fontSize: '10px', color: '#92400e', marginBottom: '6px' }}>
              🎯 Areas to Improve
            </div>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '4px' }}>
              {improvementAreas.map((area, idx) => (
                <span key={idx} style={{
                  ...printStyles.badge,
                  background: '#fef9c3',
                  color: '#854d0e',
                  border: '1px solid #fde047'
                }}>
                  {safeRender(area)}
                </span>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

/**
 * InternshipSection Component
 * Renders internship opportunities and preparation tips
 */
const InternshipSection = ({ internship }) => {
  if (!internship) return null;

  return (
    <div style={{ marginTop: '8px' }}>
      <h3 style={printStyles.subTitle}>Internship & Experience Opportunities</h3>

      {internship.types && internship.types.length > 0 && (
        <div style={{ ...printStyles.card, marginBottom: '6px' }}>
          <div style={{ fontWeight: 'bold', fontSize: '10px', color: '#1e293b', marginBottom: '4px' }}>
            Opportunities to Explore:
          </div>
          <ul style={{ margin: '0', paddingLeft: '15px', fontSize: '9px', color: '#4b5563', lineHeight: '1.5' }}>
            {internship.types.map((type, idx) => (
              <li key={idx}>{safeRender(type)}</li>
            ))}
          </ul>
          {internship.timing && (
            <div style={{ fontSize: '9px', color: '#0369a1', marginTop: '4px', fontStyle: 'italic' }}>
              Best Timing: {internship.timing}
            </div>
          )}
        </div>
      )}

      {internship.preparation && (
        <div style={printStyles.twoCol}>
          {internship.preparation.resume && (
            <div style={printStyles.card}>
              <div style={{ fontWeight: 'bold', fontSize: '9px', color: '#1e293b', marginBottom: '2px' }}>📄 Resume</div>
              <p style={{ fontSize: '8px', color: '#4b5563', margin: '0', lineHeight: '1.4' }}>{internship.preparation.resume}</p>
            </div>
          )}
          {internship.preparation.interview && (
            <div style={printStyles.card}>
              <div style={{ fontWeight: 'bold', fontSize: '9px', color: '#1e293b', marginBottom: '2px' }}>🎤 Interview</div>
              <p style={{ fontSize: '8px', color: '#4b5563', margin: '0', lineHeight: '1.4' }}>{internship.preparation.interview}</p>
            </div>
          )}
          {internship.preparation.portfolio && (
            <div style={printStyles.card}>
              <div style={{ fontWeight: 'bold', fontSize: '9px', color: '#1e293b', marginBottom: '2px' }}>📂 Portfolio</div>
              <p style={{ fontSize: '8px', color: '#4b5563', margin: '0', lineHeight: '1.4' }}>{internship.preparation.portfolio}</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default PrintViewMiddleHighSchool;
