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
 * @returns {JSX.Element} - Print view component
 */
const PrintViewMiddleHighSchool = ({ 
  results, 
  studentInfo, 
  riasecNames,
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

  // Extract data from results
  const { riasec, careerFit, skillGap, roadmap, finalNote, profileSnapshot } = results;

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

              {/* Character Strengths Section */}
              {profileSnapshot?.aptitudeStrengths && (
                <CharacterStrengthsSection aptitudeStrengths={profileSnapshot.aptitudeStrengths} />
              )}

              {/* Learning & Work Style Section */}
              {profileSnapshot?.keyPatterns && (
                <LearningWorkStyleSection keyPatterns={profileSnapshot.keyPatterns} />
              )}

              {/* Detailed Assessment Breakdown (Developer Reference) */}
              {/* COMMENTED OUT - Duplicate data already shown in previous sections */}
              {/* <div style={{ pageBreakBefore: 'always' }}>
                <DetailedAssessmentBreakdown 
                  results={results} 
                  riasecNames={safeRiasecNames}
                  gradeLevel="highschool"
                />
              </div> */}

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

  const maxScore = riasec.maxScore || 20;
  const topInterestsText = riasec.topThree.map(code => safeRiasecNames[code]).join(', ');
  const hasStrongInterests = riasec.topThree.some(code => (riasec.scores?.[code] || 0) >= maxScore * 0.5);
  
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
            const score = riasec.scores?.[code] || 0;
            
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
const CharacterStrengthsSection = ({ aptitudeStrengths }) => {
  if (!aptitudeStrengths || aptitudeStrengths.length === 0) return null;

  return (
    <div style={{ marginTop: '15px' }}>
      <h3 style={printStyles.subTitle}>Character Strengths & Personal Qualities</h3>
      <div style={printStyles.twoCol}>
        {aptitudeStrengths.map((strength, idx) => (
          <div key={idx} style={printStyles.card}>
            <div style={{ fontWeight: 'bold', fontSize: '10px', color: '#1e293b', marginBottom: '4px' }}>
              {safeRender(strength.name || strength)}
            </div>
            {strength.description && (
              <p style={{ fontSize: '9px', color: '#4b5563', margin: '0', lineHeight: '1.4' }}>
                {strength.description}
              </p>
            )}
          </div>
        ))}
      </div>
    </div>
  );
};

/**
 * LearningWorkStyleSection Component
 * Renders learning and work style patterns
 * Requirements: 1.1, 2.1 - Learning & work style for middle/high school
 */
const LearningWorkStyleSection = ({ keyPatterns }) => {
  if (!keyPatterns) return null;

  const patterns = [
    { title: 'What You Enjoy', value: keyPatterns.enjoyment },
    { title: 'How You Work Best', value: keyPatterns.workStyle },
    { title: 'Your Strengths', value: keyPatterns.strength },
    { title: 'What Motivates You', value: keyPatterns.motivation }
  ];

  return (
    <div style={{ ...printStyles.twoCol, marginTop: '15px' }}>
      {patterns.map((pattern, idx) => (
        pattern.value && (
          <div key={idx} style={printStyles.card}>
            <div style={{ fontWeight: 'bold', fontSize: '10px', color: '#1e293b', marginBottom: '4px' }}>
              {pattern.title}
            </div>
            <p style={{ fontSize: '9px', color: '#4b5563', margin: '0', lineHeight: '1.4' }}>
              {safeRender(pattern.value)}
            </p>
          </div>
        )
      ))}
    </div>
  );
};

/**
 * CareerExplorationSection Component
 * Renders career clusters and sample careers
 * Requirements: 1.1 - Career exploration for middle/high school
 */
const CareerExplorationSection = ({ careerFit }) => {
  return (
    <>
      <h2 style={{ ...printStyles.sectionTitle, marginTop: '30px' }}>2. Career Exploration</h2>

      {/* Career Clusters */}
      {careerFit.clusters && careerFit.clusters.length > 0 && (
        <div style={{ marginBottom: '15px' }}>
          <h3 style={printStyles.subTitle}>Career Clusters That Match Your Interests</h3>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
            {careerFit.clusters.map((cluster, idx) => (
              <span
                key={idx}
                style={{
                  ...printStyles.badge,
                  background: '#dbeafe',
                  color: '#1e40af',
                  border: '1px solid #93c5fd'
                }}
              >
                {safeRender(cluster)}
              </span>
            ))}
          </div>
        </div>
      )}

      {/* Sample Careers */}
      {careerFit.topCareers && careerFit.topCareers.length > 0 && (
        <div>
          <h3 style={printStyles.subTitle}>Sample Careers to Explore</h3>
          <div style={printStyles.twoCol}>
            {careerFit.topCareers.slice(0, 6).map((career, idx) => (
              <div key={idx} style={printStyles.card}>
                <div style={{ fontWeight: 'bold', fontSize: '10px', color: '#1e293b', marginBottom: '4px' }}>
                  {safeRender(career.name || career)}
                </div>
                {career.description && (
                  <p style={{ fontSize: '9px', color: '#4b5563', margin: '0', lineHeight: '1.4' }}>
                    {career.description}
                  </p>
                )}
              </div>
            ))}
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

export default PrintViewMiddleHighSchool;
