/**
 * PrintViewMiddleHighSchool Component
 * Grade-level-specific print view for Middle School and High School students (Grades 6-10)
 * Requirements: 1.1, 2.1 - Simplified career exploration without MCQ test scores
 */

import CoverPage from './CoverPage';
import { printStyles } from './shared/styles';
import { safeRender, getSafeStudentInfo, riasecDescriptions, defaultRiasecNames } from './shared/utils';
import RiasecIcon from './shared/RiasecIcon';
import PrintStyles from './shared/PrintStyles';
import Watermarks, { DataPrivacyNotice, ReportDisclaimer, RepeatingHeader, RepeatingFooter } from './shared/Watermarks';
import DetailedAssessmentBreakdown from './shared/DetailedAssessmentBreakdown';
import {
  CompleteCareerFitSection,
  CompleteSkillGapSection,
  CompleteRoadmapSection,
  CompleteCourseRecommendationsSection,
  ProfileSnapshotSection,
  TimingAnalysisSection,
  FinalNoteSection as CompleteFinalNoteSection
} from './shared/CompletePDFSections';

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
    adaptiveAptitudeResults = normalizedResults.adaptiveAptitudeResults || normalizedResults.gemini_results?.adaptiveAptitudeResults
  } = normalizedResults;

  console.log('🔍 PDF PrintViewMiddleHighSchool - Extracted data:', {
    hasCharacterStrengths: !!characterStrengths,
    hasLearningStyle: !!learningStyle,
    hasAdaptiveAptitude: !!adaptiveAptitudeResults,
    adaptiveLevel: adaptiveAptitudeResults?.aptitude_level || adaptiveAptitudeResults?.aptitudeLevel,
    hasCareerFit: !!careerFit
  });

  // Determine if this is middle school (grades 6-8)
  // Middle school students should NOT see career exploration, skills, or roadmap sections
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

              {/* Section 1: Student Profile Snapshot */}
              <h2 style={printStyles.sectionTitle}>1. Student Profile Snapshot</h2>

              {/* Interest Explorer Section */}
              <InterestExplorerSection riasec={riasec} safeRiasecNames={safeRiasecNames} />

              {/* Character Strengths Section - Use characterStrengths from middle school data */}
              {(characterStrengths || profileSnapshot?.aptitudeStrengths) && (
                <CharacterStrengthsSection 
                  characterStrengths={characterStrengths}
                  aptitudeStrengths={profileSnapshot?.aptitudeStrengths} 
                />
              )}

              {/* Learning & Work Style Section - Use learningStyle from middle school data */}
              {(learningStyle || profileSnapshot?.keyPatterns) && (
                <LearningWorkStyleSection 
                  learningStyle={learningStyle}
                  keyPatterns={profileSnapshot?.keyPatterns} 
                />
              )}

              {/* Adaptive Aptitude Section - Show adaptive test results */}
              {adaptiveAptitudeResults && (
                <AdaptiveAptitudeSection adaptiveAptitudeResults={adaptiveAptitudeResults} />
              )}

              {/* Detailed Assessment Breakdown (Developer Reference) */}
              <div style={{ pageBreakBefore: 'always' }}>
                <DetailedAssessmentBreakdown 
                  results={normalizedResults} 
                  riasecNames={safeRiasecNames}
                  gradeLevel={isMiddleSchool ? 'middle' : 'highschool'}
                />
              </div>

              {/* Section 2: Career Exploration - ONLY for high school (grades 9-10), NOT for middle school */}
              {!isMiddleSchool && careerFit && (
                <CareerExplorationSection careerFit={careerFit} />
              )}

              {/* Section 3: Skills to Develop - ONLY for high school (grades 9-10), NOT for middle school */}
              {!isMiddleSchool && skillGap && (
                <SkillsToDevelopSection skillGap={skillGap} />
              )}

              {/* Section 4: 12-Month Journey - ONLY for high school (grades 9-10), NOT for middle school */}
              {!isMiddleSchool && roadmap?.twelveMonthJourney && (
                <TwelveMonthJourneySection twelveMonthJourney={roadmap.twelveMonthJourney} />
              )}

              {/* Projects to Try - ONLY for high school (grades 9-10), NOT for middle school */}
              {!isMiddleSchool && roadmap?.projects && roadmap.projects.length > 0 && (
                <ProjectsSection projects={roadmap.projects} />
              )}

              {/* Activities & Exposure - ONLY for high school (grades 9-10), NOT for middle school */}
              {!isMiddleSchool && roadmap?.exposure && (
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
    <div style={{ marginTop: '15px' }}>
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
    <div style={{ marginTop: '15px' }}>
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
      <h2 style={{ ...printStyles.sectionTitle, marginTop: '30px', pageBreakBefore: 'always' }}>2. Career Exploration</h2>

      {/* Career Clusters with detailed information */}
      {careerFit.clusters && careerFit.clusters.length > 0 && (
        <div style={{ marginBottom: '20px' }}>
          <h3 style={printStyles.subTitle}>Career Paths That Match Your Profile</h3>
          {careerFit.clusters.map((cluster, idx) => (
            <div key={idx} style={{ ...printStyles.card, marginBottom: '12px', pageBreakInside: 'avoid' }}>
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
        <div style={{ marginTop: '15px' }}>
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
  return (
    <>
      <h2 style={{ ...printStyles.sectionTitle, marginTop: '30px' }}>3. Skills to Develop</h2>

      {skillGap.gaps && skillGap.gaps.length > 0 && (
        <div>
          <table style={printStyles.table}>
            <thead>
              <tr>
                <th style={printStyles.th}>Skill</th>
                <th style={{ ...printStyles.th, width: '100px' }}>Priority</th>
              </tr>
            </thead>
            <tbody>
              {skillGap.gaps.map((gap, idx) => {
                const priority = gap.priority || 'Medium';
                const priorityColors = {
                  High: { bg: '#fee2e2', color: '#991b1b', border: '#fca5a5' },
                  Medium: { bg: '#fef9c3', color: '#854d0e', border: '#fde047' },
                  Low: { bg: '#dcfce7', color: '#166534', border: '#86efac' }
                };
                const colors = priorityColors[priority] || priorityColors.Medium;

                return (
                  <tr key={idx}>
                    <td style={printStyles.td}>{safeRender(gap.skill || gap)}</td>
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
                  </tr>
                );
              })}
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
  // Handle various data formats - could be array, object with items, or null
  const journeyItems = Array.isArray(twelveMonthJourney) 
    ? twelveMonthJourney 
    : twelveMonthJourney?.items || twelveMonthJourney?.months || [];
  
  if (!journeyItems || journeyItems.length === 0) return null;

  return (
    <>
      <h2 style={{ ...printStyles.sectionTitle, marginTop: '30px' }}>4. Your 12-Month Journey</h2>
      <div style={{ marginTop: '10px' }}>
        {journeyItems.map((item, idx) => (
          <div key={idx} style={{ ...printStyles.card, marginBottom: '8px' }}>
            <div style={{ fontWeight: 'bold', fontSize: '10px', color: '#4f46e5', marginBottom: '3px' }}>
              {safeRender(item.month || `Month ${idx + 1}`)}
            </div>
            <p style={{ fontSize: '9px', color: '#4b5563', margin: '0', lineHeight: '1.4' }}>
              {safeRender(item.activity || item)}
            </p>
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
      <h3 style={{ ...printStyles.subTitle, marginTop: '30px' }}>Projects to Try</h3>
      <div style={printStyles.twoCol}>
        {projects.map((project, idx) => (
          <div key={idx} style={printStyles.card}>
            <div style={{ fontWeight: 'bold', fontSize: '10px', color: '#1e293b', marginBottom: '4px' }}>
              {safeRender(project.name || project)}
            </div>
            {project.description && (
              <p style={{ fontSize: '9px', color: '#4b5563', margin: '0', lineHeight: '1.4' }}>
                {project.description}
              </p>
            )}
          </div>
        ))}
      </div>
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
    <div style={{ ...printStyles.twoCol, marginTop: '15px' }}>
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
    accuracyBySubtag
  } = adaptiveAptitudeResults;

  const level = aptitude_level || aptitudeLevel;
  const accuracy = overall_accuracy || overallAccuracy;
  const questions = total_questions || totalQuestions;
  const correct = total_correct || totalCorrect;
  const confidence = confidence_tag || confidenceTag;
  const subtags = accuracy_by_subtag || accuracyBySubtag;

  return (
    <div style={{ marginTop: '15px' }}>
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
            </div>
          </div>
          <div style={{ textAlign: 'right' }}>
            <div style={{ fontSize: '10px', fontWeight: 'bold', color: '#059669' }}>
              {typeof accuracy === 'number' ? accuracy.toFixed(1) : accuracy}% Accuracy
            </div>
            <div style={{ fontSize: '9px', color: '#6b7280', marginTop: '2px' }}>
              {correct}/{questions} correct
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
    </div>
  );
};

export default PrintViewMiddleHighSchool;
