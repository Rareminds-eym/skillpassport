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
import PrintPage from './shared/PrintPage';
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

  // Extract data from results
  const { riasec, aptitude, bigFive, workValues, careerFit, skillGap, roadmap } = results;

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

      {/* Paginated Content - Each PrintPage has its own header/footer */}
      <div className="print-pages">
        {/* Page 1: Profile Snapshot & Interest Profile */}
        <PrintPage pageNumber={1}>
          <DataPrivacyNotice />
          <h2 style={printStyles.sectionTitle}>1. Student Profile Snapshot</h2>
          <InterestProfileSection riasec={riasec} safeRiasecNames={safeRiasecNames} />
        </PrintPage>

        {/* Page 2: Cognitive Abilities */}
        <PrintPage pageNumber={2}>
          {aptitude && (
            <CognitiveAbilitiesSection aptitude={aptitude} />
          )}
        </PrintPage>

        {/* Page 3: Big Five Personality & Work Values */}
        <PrintPage pageNumber={3}>
          {bigFive && (
            <BigFivePersonalitySection bigFive={bigFive} safeTraitNames={safeTraitNames} />
          )}
          {workValues && (
            <WorkValuesSection workValues={workValues} />
          )}
        </PrintPage>

        {/* Page 4: Detailed Assessment Breakdown (Developer Reference) */}
        <PrintPage pageNumber={4}>
          <DetailedAssessmentBreakdown 
            results={results} 
            riasecNames={safeRiasecNames}
            gradeLevel="after10"
          />
        </PrintPage>

        {/* Page 5: Career Fit Analysis */}
        <PrintPage pageNumber={5}>
          {careerFit && (
            <CareerFitAnalysisSection careerFit={careerFit} />
          )}
        </PrintPage>

        {/* Page 6: Skill Gap & Development Plan */}
        <PrintPage pageNumber={6}>
          {skillGap && (
            <SkillGapDevelopmentSection skillGap={skillGap} />
          )}
        </PrintPage>

        {/* Page 7: Development Roadmap */}
        <PrintPage pageNumber={7}>
          {roadmap && (
            <DevelopmentRoadmapSection roadmap={roadmap} />
          )}
        </PrintPage>

        {/* Page 8: Stream Recommendation (if available) */}
        {streamRecommendation && streamRecommendation.recommendedStream && (
          <PrintPage pageNumber={8}>
            <StreamRecommendationSection streamRecommendation={streamRecommendation} />
          </PrintPage>
        )}

        {/* Page 9 (or 8 if no stream): Course Recommendations (if available) */}
        {courseRecommendations && courseRecommendations.length > 0 && (
          <PrintPage pageNumber={streamRecommendation && streamRecommendation.recommendedStream ? 9 : 8}>
            <CourseRecommendationsSection courseRecommendations={courseRecommendations} />
          </PrintPage>
        )}

        {/* Final Page: Disclaimer */}
        <PrintPage pageNumber={
          (streamRecommendation && streamRecommendation.recommendedStream ? 1 : 0) +
          (courseRecommendations && courseRecommendations.length > 0 ? 1 : 0) + 7
        }>
          <ReportDisclaimer />
        </PrintPage>
      </div>

      {/* Screen-only continuous content (hidden in print) */}
      <div className="print-content" style={{ position: 'relative', zIndex: 1, paddingBottom: '70px' }}>
        <DataPrivacyNotice />
        <h2 style={printStyles.sectionTitle}>1. Student Profile Snapshot</h2>
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
        {careerFit && (
          <CareerFitAnalysisSection careerFit={careerFit} />
        )}
        {skillGap && (
          <SkillGapDevelopmentSection skillGap={skillGap} />
        )}
        {roadmap && (
          <DevelopmentRoadmapSection roadmap={roadmap} />
        )}
        {streamRecommendation && streamRecommendation.recommendedStream && (
          <StreamRecommendationSection streamRecommendation={streamRecommendation} />
        )}
        {courseRecommendations && courseRecommendations.length > 0 && (
          <CourseRecommendationsSection courseRecommendations={courseRecommendations} />
        )}
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

  const maxScore = riasec.maxScore || 20;
  const codes = ['R', 'I', 'A', 'S', 'E', 'C'];
  
  // Get top three interests
  const topThree = riasec.topThree || codes
    .map(code => ({ code, score: riasec.scores[code] || 0 }))
    .sort((a, b) => b.score - a.score)
    .slice(0, 3)
    .map(item => item.code);

  const topInterestsText = topThree.map(code => safeRiasecNames[code]).join(', ');
  const hasStrongInterests = topThree.some(code => (riasec.scores?.[code] || 0) >= maxScore * 0.5);

  return (
    <div>
      <h3 style={printStyles.subTitle}>Interest Explorer Results</h3>

      {/* RIASEC Infographic Layout with Central Circle */}
      <div style={{
        position: 'relative',
        padding: '0',
        marginTop: '0',
        marginBottom: '0',
        minHeight: '220px'
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
        marginTop: '0',
        marginBottom: '0',
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
 * Renders aptitude test scores with correct/total format
 * Requirements: 1.2, 2.2 - Cognitive abilities with test-based scores
 */
const CognitiveAbilitiesSection = ({ aptitude }) => {
  if (!aptitude || !aptitude.scores) return null;

  return (
    <>
      <h2 style={{ ...printStyles.sectionTitle, marginTop: '0' }}>2. Cognitive Abilities</h2>
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
          const percentage = Math.round(score);
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
        <div style={{ ...printStyles.card, marginTop: '15px', background: '#f0f9ff', border: '1px solid #bae6fd' }}>
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
                <div style={{ fontSize: '9px', color: '#6b7280' }}>
                  Score: {score}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </>
  );
};

/**
 * CareerFitAnalysisSection Component
 * Renders career recommendations with fit scores
 * Requirements: 1.2 - Career fit analysis for higher secondary students
 */
const CareerFitAnalysisSection = ({ careerFit }) => {
  if (!careerFit || !careerFit.topCareers || careerFit.topCareers.length === 0) return null;

  return (
    <>
      <h2 style={{ ...printStyles.sectionTitle, marginTop: '0' }}>5. Career Fit Analysis</h2>
      <h3 style={printStyles.subTitle}>Recommended Career Paths</h3>

      <div style={printStyles.twoCol}>
        {careerFit.topCareers.slice(0, 6).map((career, idx) => {
          const name = safeRender(career.name || career);
          const fitScore = career.fitScore || 0;
          const description = career.description || '';
          const scoreStyle = getScoreStyle(fitScore);

          return (
            <div key={idx} style={printStyles.card}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '6px' }}>
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

  return (
    <>
      <h2 style={{ ...printStyles.sectionTitle, marginTop: '0' }}>6. Skill Gap & Development Plan</h2>

      {/* Current Skills */}
      {skillGap.currentSkills && skillGap.currentSkills.length > 0 && (
        <div style={{ marginBottom: '8px' }}>
          <h3 style={printStyles.subTitle}>Your Current Skills</h3>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
            {skillGap.currentSkills.map((skill, idx) => (
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
                  border: '1px solid #93c5fd'
                }}
              >
                {safeRender(skill)}
              </span>
            ))}
          </div>
        </div>
      )}

      {/* Skill Gaps */}
      {skillGap.gaps && skillGap.gaps.length > 0 && (
        <div>
          <h3 style={printStyles.subTitle}>Priority Skills to Develop</h3>
          <div style={printStyles.twoCol}>
            {skillGap.gaps.map((gap, idx) => {
              const skill = safeRender(gap.skill || gap);
              const priority = gap.priority || 'Medium';
              const priorityColors = {
                High: { bg: '#fee2e2', color: '#991b1b', border: '#fca5a5' },
                Medium: { bg: '#fef9c3', color: '#854d0e', border: '#fde047' },
                Low: { bg: '#dcfce7', color: '#166534', border: '#86efac' }
              };
              const colors = priorityColors[priority] || priorityColors.Medium;

              return (
                <div key={idx} style={printStyles.card}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div style={{ fontWeight: 'bold', fontSize: '10px', color: '#1e293b' }}>
                      {skill}
                    </div>
                    <span style={{
                      ...printStyles.badge,
                      background: colors.bg,
                      color: colors.color,
                      border: `1px solid ${colors.border}`
                    }}>
                      {priority}
                    </span>
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

/**
 * DevelopmentRoadmapSection Component
 * Renders development roadmap with phases and goals
 * Requirements: 1.2 - Development roadmap for higher secondary students
 */
const DevelopmentRoadmapSection = ({ roadmap }) => {
  if (!roadmap) return null;

  return (
    <>
      <h2 style={{ ...printStyles.sectionTitle, marginTop: '0' }}>7. Development Roadmap</h2>

      {/* Roadmap Phases */}
      {roadmap.phases && roadmap.phases.length > 0 && (
        <div style={{ marginTop: '5px' }}>
          {roadmap.phases.map((phase, idx) => (
            <div key={idx} style={{ ...printStyles.card, marginBottom: '6px' }}>
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

              {/* Phase Goals */}
              {phase.goals && phase.goals.length > 0 && (
                <div>
                  <div style={{ fontSize: '9px', fontWeight: '600', color: '#374151', marginBottom: '4px' }}>
                    Goals:
                  </div>
                  <ul style={{ margin: '0', paddingLeft: '18px', fontSize: '9px', color: '#4b5563', lineHeight: '1.5' }}>
                    {phase.goals.map((goal, goalIdx) => (
                      <li key={goalIdx}>{safeRender(goal)}</li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {/* 12-Month Journey (if available) */}
      {roadmap.twelveMonthJourney && roadmap.twelveMonthJourney.length > 0 && (
        <div style={{ marginTop: '15px' }}>
          <h3 style={printStyles.subTitle}>12-Month Action Plan</h3>
          <div style={{ marginTop: '8px' }}>
            {roadmap.twelveMonthJourney.map((item, idx) => (
              <div key={idx} style={{ ...printStyles.card, marginBottom: '8px' }}>
                <div style={{ fontWeight: 'bold', fontSize: '9px', color: '#4f46e5', marginBottom: '3px' }}>
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

      {/* Projects (if available) */}
      {roadmap.projects && roadmap.projects.length > 0 && (
        <div style={{ marginTop: '30px' }}>
          <h3 style={printStyles.subTitle}>Recommended Projects</h3>
          <div style={printStyles.twoCol}>
            {roadmap.projects.map((project, idx) => (
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
        </div>
      )}
    </>
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
      <p style={{ fontSize: '10px', color: '#6b7280', marginBottom: '15px', lineHeight: '1.5' }}>
        Based on your interests, aptitudes, and academic performance, here is your recommended stream for grades 11-12:
      </p>

      <div style={{ 
        ...printStyles.card, 
        border: '2px solid #3b82f6',
        backgroundColor: '#eff6ff',
        marginBottom: '15px'
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
          <p style={{ 
            fontSize: '9px', 
            color: '#4b5563', 
            lineHeight: '1.5',
            margin: '0'
          }}>
            {streamRecommendation.reasoning}
          </p>
        )}
      </div>

      {/* Alternative Streams */}
      {streamRecommendation.alternatives && streamRecommendation.alternatives.length > 0 && (
        <div style={{ marginTop: '15px' }}>
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
      <p style={{ fontSize: '10px', color: '#6b7280', marginBottom: '15px', lineHeight: '1.5' }}>
        Based on your assessment results and chosen stream, here are the top degree programs for you:
      </p>

      {topCourses.map((course, index) => (
        <div key={index} style={{ 
          ...printStyles.card, 
          marginBottom: '12px',
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

export default PrintViewHigherSecondary;
