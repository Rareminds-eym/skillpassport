/**
 * Complete PDF Sections - Display ALL data from database columns
 * Sections for: career_fit, skill_gap, roadmap, courses, profile_snapshot, timing_analysis, final_note
 */

import { printStyles } from './styles';

/**
 * Complete Career Fit Section
 * Displays ALL data from career_fit column including degree programs
 */
export const CompleteCareerFitSection = ({ careerFit }) => {
  if (!careerFit) return null;

  const clusters = careerFit.clusters || [];
  const degreePrograms = careerFit.degreePrograms || [];
  const specificOptions = careerFit.specificOptions || [];

  return (
    <div style={{ marginBottom: '20px' }}>
      <h3 style={printStyles.subTitle}>Career Fit & Recommendations</h3>
      
      {/* Career Clusters */}
      {clusters.length > 0 && (
        <div style={{ marginBottom: '20px' }}>
          <h4 style={{ fontSize: '11px', fontWeight: 'bold', marginBottom: '10px' }}>
            Top Career Matches
          </h4>
          {clusters.map((cluster, index) => (
            <div 
              key={index}
              style={{
                marginBottom: '15px',
                padding: '12px',
                background: '#f8fafc',
                border: '1px solid #e2e8f0',
                borderRadius: '8px'
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
                <h5 style={{ fontSize: '11px', fontWeight: 'bold', color: '#1e293b' }}>
                  {cluster.title}
                </h5>
                <span style={{
                  fontSize: '10px',
                  fontWeight: 'bold',
                  color: '#10b981',
                  background: '#d1fae5',
                  padding: '2px 8px',
                  borderRadius: '4px'
                }}>
                  {cluster.matchScore}% Match
                </span>
              </div>

              {cluster.description && (
                <p style={{ fontSize: '9px', color: '#64748b', marginBottom: '8px', lineHeight: '1.4' }}>
                  {cluster.description}
                </p>
              )}

              {cluster.roles && cluster.roles.length > 0 && (
                <div style={{ marginBottom: '6px' }}>
                  <strong style={{ fontSize: '9px', color: '#475569' }}>Roles: </strong>
                  <span style={{ fontSize: '9px', color: '#64748b' }}>
                    {cluster.roles.join(', ')}
                  </span>
                </div>
              )}

              {cluster.skills && cluster.skills.length > 0 && (
                <div style={{ marginBottom: '6px' }}>
                  <strong style={{ fontSize: '9px', color: '#475569' }}>Key Skills: </strong>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: '4px', marginTop: '4px' }}>
                    {cluster.skills.map((skill, idx) => (
                      <span 
                        key={idx}
                        style={{
                          fontSize: '8px',
                          padding: '2px 6px',
                          background: '#e0e7ff',
                          color: '#4338ca',
                          borderRadius: '3px'
                        }}
                      >
                        {skill}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {cluster.salary && (
                <div style={{ fontSize: '9px', color: '#475569' }}>
                  <strong>Salary Range: </strong>
                  {cluster.salary.min} - {cluster.salary.max} {cluster.salary.currency}
                </div>
              )}

              {cluster.growthPotential && (
                <div style={{ fontSize: '9px', color: '#475569', marginTop: '4px' }}>
                  <strong>Growth Potential: </strong>
                  <span style={{ color: '#10b981' }}>{cluster.growthPotential}</span>
                </div>
              )}

              {cluster.education && (
                <div style={{ fontSize: '9px', color: '#64748b', marginTop: '4px', fontStyle: 'italic' }}>
                  Education: {cluster.education}
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Degree Programs */}
      {degreePrograms.length > 0 && (
        <div style={{ marginBottom: '20px', pageBreakInside: 'avoid' }}>
          <h4 style={{ fontSize: '11px', fontWeight: 'bold', marginBottom: '10px' }}>
            Recommended Degree Programs
          </h4>
          {degreePrograms.map((program, index) => (
            <div 
              key={index}
              style={{
                marginBottom: '15px',
                padding: '12px',
                background: '#fefce8',
                border: '1px solid #fde047',
                borderRadius: '8px'
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
                <h5 style={{ fontSize: '11px', fontWeight: 'bold', color: '#854d0e' }}>
                  {program.programName}
                </h5>
                <span style={{
                  fontSize: '10px',
                  fontWeight: 'bold',
                  color: '#ca8a04',
                  background: '#fef3c7',
                  padding: '2px 8px',
                  borderRadius: '4px'
                }}>
                  {program.matchScore}% Match
                </span>
              </div>

              {program.description && (
                <p style={{ fontSize: '9px', color: '#78716c', marginBottom: '8px', lineHeight: '1.4' }}>
                  {program.description}
                </p>
              )}

              {program.topColleges && program.topColleges.length > 0 && (
                <div style={{ marginBottom: '8px' }}>
                  <strong style={{ fontSize: '9px', color: '#57534e' }}>Top Colleges: </strong>
                  <div style={{ fontSize: '9px', color: '#78716c', marginTop: '4px' }}>
                    {program.topColleges.join(' • ')}
                  </div>
                </div>
              )}

              {program.careerPaths && program.careerPaths.length > 0 && (
                <div style={{ marginBottom: '8px' }}>
                  <strong style={{ fontSize: '9px', color: '#57534e' }}>Career Paths: </strong>
                  <div style={{ fontSize: '9px', color: '#78716c', marginTop: '4px' }}>
                    {program.careerPaths.join(', ')}
                  </div>
                </div>
              )}

              {program.skills && program.skills.length > 0 && (
                <div style={{ marginBottom: '8px' }}>
                  <strong style={{ fontSize: '9px', color: '#57534e' }}>Skills You'll Learn: </strong>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: '4px', marginTop: '4px' }}>
                    {program.skills.map((skill, idx) => (
                      <span 
                        key={idx}
                        style={{
                          fontSize: '8px',
                          padding: '2px 6px',
                          background: '#fef3c7',
                          color: '#92400e',
                          borderRadius: '3px'
                        }}
                      >
                        {skill}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '8px' }}>
                {program.averageSalary && (
                  <div style={{ fontSize: '9px', color: '#57534e' }}>
                    <strong>Avg. Salary: </strong>
                    {program.averageSalary.min} - {program.averageSalary.max} {program.averageSalary.currency}
                  </div>
                )}
                {program.duration && (
                  <div style={{ fontSize: '9px', color: '#78716c' }}>
                    <strong>Duration: </strong>{program.duration}
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Specific Options */}
      {specificOptions.length > 0 && (
        <div style={{ marginBottom: '20px' }}>
          <h4 style={{ fontSize: '11px', fontWeight: 'bold', marginBottom: '10px' }}>
            Specific Career Options
          </h4>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
            {specificOptions.map((option, index) => (
              <div 
                key={index}
                style={{
                  padding: '8px',
                  background: '#f1f5f9',
                  border: '1px solid #cbd5e1',
                  borderRadius: '6px',
                  fontSize: '9px',
                  color: '#334155'
                }}
              >
                {option}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};


/**
 * Complete Skill Gap Section
 * Displays ALL data from skill_gap column including development paths and resources
 */
export const CompleteSkillGapSection = ({ skillGap }) => {
  if (!skillGap) return null;

  const gaps = skillGap.gaps || [];
  if (gaps.length === 0) return null;

  const importanceColors = {
    'High': { bg: '#fee2e2', color: '#991b1b', border: '#fca5a5' },
    'Medium': { bg: '#fef3c7', color: '#92400e', border: '#fde047' },
    'Low': { bg: '#dbeafe', color: '#1e40af', border: '#93c5fd' }
  };

  return (
    <div style={{ marginBottom: '10px', marginTop: '8px' }}>
      <h3 style={printStyles.subTitle}>Skills to Develop</h3>
      <p style={{ fontSize: '10px', color: '#4b5563', marginBottom: '8px', lineHeight: '1.4' }}>
        Focus on these skills to enhance your career readiness and competitiveness.
      </p>

      {gaps.map((gap, index) => {
        const colors = importanceColors[gap.importance] || importanceColors['Medium'];
        
        return (
          <div 
            key={index}
            style={{
              marginBottom: '10px',
              padding: '10px',
              background: '#ffffff',
              border: `2px solid ${colors.border}`,
              borderRadius: '8px'
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
              <h5 style={{ fontSize: '11px', fontWeight: 'bold', color: '#1e293b' }}>
                {gap.skill}
              </h5>
              <span style={{
                fontSize: '9px',
                fontWeight: 'bold',
                color: colors.color,
                background: colors.bg,
                padding: '3px 10px',
                borderRadius: '4px'
              }}>
                {gap.importance} Priority
              </span>
            </div>

            {gap.developmentPath && (
              <div style={{ marginBottom: '10px' }}>
                <strong style={{ fontSize: '9px', color: '#475569', display: 'block', marginBottom: '4px' }}>
                  Development Path:
                </strong>
                <p style={{ fontSize: '9px', color: '#64748b', lineHeight: '1.5', margin: 0 }}>
                  {gap.developmentPath}
                </p>
              </div>
            )}

            {gap.resources && gap.resources.length > 0 && (
              <div>
                <strong style={{ fontSize: '9px', color: '#475569', display: 'block', marginBottom: '6px' }}>
                  Learning Resources:
                </strong>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                  {gap.resources.map((resource, idx) => (
                    <div 
                      key={idx}
                      style={{
                        padding: '6px 8px',
                        background: '#f8fafc',
                        border: '1px solid #e2e8f0',
                        borderRadius: '4px',
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center'
                      }}
                    >
                      <div>
                        <div style={{ fontSize: '9px', fontWeight: 'bold', color: '#334155' }}>
                          {resource.title}
                        </div>
                        <div style={{ fontSize: '8px', color: '#64748b' }}>
                          {resource.provider} • {resource.type}
                        </div>
                      </div>
                      {resource.url && (
                        <div style={{ fontSize: '8px', color: '#3b82f6' }}>
                          🔗 Link
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
};


/**
 * Complete Roadmap Section
 * Displays ALL data from roadmap column including timelines, priorities, and resources
 */
export const CompleteRoadmapSection = ({ roadmap }) => {
  if (!roadmap) return null;

  const steps = roadmap.steps || [];
  if (steps.length === 0) return null;

  const priorityColors = {
    'High': { bg: '#fee2e2', color: '#991b1b', icon: '🔴' },
    'Medium': { bg: '#fef3c7', color: '#92400e', icon: '🟡' },
    'Low': { bg: '#dbeafe', color: '#1e40af', icon: '🔵' }
  };

  return (
    <div style={{ marginBottom: '10px', marginTop: '8px' }}>
      <h3 style={printStyles.subTitle}>Your Action Roadmap</h3>
      <p style={{ fontSize: '10px', color: '#4b5563', marginBottom: '8px', lineHeight: '1.4' }}>
        Follow these steps to achieve your career goals. Each step includes timeline and resources.
      </p>

      <div style={{ position: 'relative', paddingLeft: '30px' }}>
        {/* Timeline line */}
        <div style={{
          position: 'absolute',
          left: '12px',
          top: '20px',
          bottom: '20px',
          width: '2px',
          background: 'linear-gradient(to bottom, #3b82f6, #8b5cf6)',
          opacity: 0.3
        }} />

        {steps.map((step, index) => {
          const colors = priorityColors[step.priority] || priorityColors['Medium'];
          
          return (
            <div 
              key={index}
              style={{
                marginBottom: '12px',
                position: 'relative'
              }}
            >
              {/* Step number circle */}
              <div style={{
                position: 'absolute',
                left: '-30px',
                top: '8px',
                width: '24px',
                height: '24px',
                borderRadius: '50%',
                background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                color: 'white',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: '10px',
                fontWeight: 'bold',
                border: '3px solid white',
                boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
              }}>
                {index + 1}
              </div>

              <div style={{
                padding: '12px',
                background: '#ffffff',
                border: '1px solid #e2e8f0',
                borderRadius: '8px',
                boxShadow: '0 1px 3px rgba(0,0,0,0.1)'
              }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '8px' }}>
                  <h5 style={{ fontSize: '11px', fontWeight: 'bold', color: '#1e293b', flex: 1 }}>
                    {step.title}
                  </h5>
                  <div style={{ display: 'flex', gap: '6px', flexShrink: 0 }}>
                    <span style={{
                      fontSize: '8px',
                      fontWeight: 'bold',
                      color: colors.color,
                      background: colors.bg,
                      padding: '3px 8px',
                      borderRadius: '4px'
                    }}>
                      {colors.icon} {step.priority}
                    </span>
                  </div>
                </div>

                {step.timeline && (
                  <div style={{ 
                    fontSize: '9px', 
                    color: '#64748b', 
                    marginBottom: '8px',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '4px'
                  }}>
                    <span>⏰</span>
                    <strong>Timeline:</strong> {step.timeline}
                  </div>
                )}

                {step.description && (
                  <p style={{ fontSize: '9px', color: '#475569', lineHeight: '1.5', marginBottom: '10px' }}>
                    {step.description}
                  </p>
                )}

                {step.resources && step.resources.length > 0 && (
                  <div>
                    <strong style={{ fontSize: '9px', color: '#475569', display: 'block', marginBottom: '6px' }}>
                      📚 Resources:
                    </strong>
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
                      {step.resources.map((resource, idx) => (
                        <div 
                          key={idx}
                          style={{
                            padding: '4px 8px',
                            background: '#f1f5f9',
                            border: '1px solid #cbd5e1',
                            borderRadius: '4px',
                            fontSize: '8px',
                            color: '#334155'
                          }}
                        >
                          {resource.title}
                          {resource.type && (
                            <span style={{ color: '#64748b', marginLeft: '4px' }}>
                              ({resource.type})
                            </span>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};


/**
 * Complete Course Recommendations Section
 * Displays ALL course data from skill_gap_courses, platform_courses, and courses_by_type
 */
export const CompleteCourseRecommendationsSection = ({ 
  skillGapCourses = [], 
  platformCourses = [], 
  coursesByType = null 
}) => {
  const hasAnyCourses = skillGapCourses.length > 0 || platformCourses.length > 0 || coursesByType;
  if (!hasAnyCourses) return null;

  const renderCourse = (course, index) => (
    <div 
      key={index}
      style={{
        marginBottom: '8px',
        padding: '8px',
        background: '#ffffff',
        border: '1px solid #e2e8f0',
        borderRadius: '6px',
        boxShadow: '0 1px 2px rgba(0,0,0,0.05)'
      }}
    >
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '6px' }}>
        <h5 style={{ fontSize: '10px', fontWeight: 'bold', color: '#1e293b', flex: 1 }}>
          {course.courseName || course.title || course.name}
        </h5>
        {course.rating && (
          <span style={{
            fontSize: '9px',
            color: '#f59e0b',
            fontWeight: 'bold',
            marginLeft: '8px'
          }}>
            ⭐ {course.rating}
          </span>
        )}
      </div>

      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px', marginBottom: '6px' }}>
        {course.provider && (
          <span style={{
            fontSize: '8px',
            padding: '2px 6px',
            background: '#dbeafe',
            color: '#1e40af',
            borderRadius: '3px'
          }}>
            📚 {course.provider}
          </span>
        )}
        {course.level && (
          <span style={{
            fontSize: '8px',
            padding: '2px 6px',
            background: '#e0e7ff',
            color: '#4338ca',
            borderRadius: '3px'
          }}>
            📊 {course.level}
          </span>
        )}
        {course.duration && (
          <span style={{
            fontSize: '8px',
            padding: '2px 6px',
            background: '#fef3c7',
            color: '#92400e',
            borderRadius: '3px'
          }}>
            ⏱️ {course.duration}
          </span>
        )}
        {course.price && (
          <span style={{
            fontSize: '8px',
            padding: '2px 6px',
            background: course.price === 'Free' || course.price === 'free' ? '#d1fae5' : '#fee2e2',
            color: course.price === 'Free' || course.price === 'free' ? '#065f46' : '#991b1b',
            borderRadius: '3px',
            fontWeight: 'bold'
          }}>
            💰 {typeof course.price === 'object' ? `${course.price.amount} ${course.price.currency}` : course.price}
          </span>
        )}
      </div>

      {course.description && (
        <p style={{ fontSize: '8px', color: '#64748b', lineHeight: '1.4', marginBottom: '6px' }}>
          {course.description}
        </p>
      )}

      {course.skills && course.skills.length > 0 && (
        <div>
          <strong style={{ fontSize: '8px', color: '#475569' }}>Skills: </strong>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '3px', marginTop: '3px' }}>
            {course.skills.map((skill, idx) => (
              <span 
                key={idx}
                style={{
                  fontSize: '7px',
                  padding: '2px 5px',
                  background: '#f1f5f9',
                  color: '#334155',
                  borderRadius: '3px'
                }}
              >
                {skill}
              </span>
            ))}
          </div>
        </div>
      )}

      {course.url && (
        <div style={{ marginTop: '6px', fontSize: '8px', color: '#3b82f6' }}>
          🔗 Course Link Available
        </div>
      )}
    </div>
  );

  return (
    <div style={{ marginBottom: '10px', marginTop: '8px' }}>
      <h3 style={printStyles.subTitle}>Course Recommendations</h3>
      <p style={{ fontSize: '10px', color: '#4b5563', marginBottom: '8px', lineHeight: '1.4' }}>
        Curated courses to help you develop the skills needed for your career path.
      </p>

      {/* Skill Gap Courses */}
      {skillGapCourses.length > 0 && (
        <div style={{ marginBottom: '12px' }}>
          <h4 style={{ 
            fontSize: '11px', 
            fontWeight: 'bold', 
            color: '#1e293b',
            marginBottom: '8px',
            paddingBottom: '4px',
            borderBottom: '2px solid #e2e8f0'
          }}>
            📚 Courses for Skill Development
          </h4>
          {skillGapCourses.map((course, index) => renderCourse(course, index))}
        </div>
      )}

      {/* Platform Courses */}
      {platformCourses.length > 0 && (
        <div style={{ marginBottom: '20px' }}>
          <h4 style={{ 
            fontSize: '11px', 
            fontWeight: 'bold', 
            color: '#1e293b',
            marginBottom: '10px',
            paddingBottom: '6px',
            borderBottom: '2px solid #e2e8f0'
          }}>
            🎓 Platform Recommendations
          </h4>
          {platformCourses.map((course, index) => renderCourse(course, index))}
        </div>
      )}

      {/* Courses by Type */}
      {coursesByType && Object.keys(coursesByType).length > 0 && (
        <div>
          <h4 style={{ 
            fontSize: '11px', 
            fontWeight: 'bold', 
            color: '#1e293b',
            marginBottom: '10px',
            paddingBottom: '6px',
            borderBottom: '2px solid #e2e8f0'
          }}>
            📂 Courses by Category
          </h4>
          {Object.entries(coursesByType).map(([type, courses]) => (
            <div key={type} style={{ marginBottom: '15px' }}>
              <h5 style={{ 
                fontSize: '10px', 
                fontWeight: 'bold', 
                color: '#475569',
                marginBottom: '8px',
                textTransform: 'capitalize'
              }}>
                {type.replace(/_/g, ' ')}
              </h5>
              {Array.isArray(courses) && courses.map((course, index) => renderCourse(course, `${type}-${index}`))}
            </div>
          ))}
        </div>
      )}
    </div>
  );
};


/**
 * Profile Snapshot Section
 * Displays complete profile overview from profile_snapshot column
 */
export const ProfileSnapshotSection = ({ profileSnapshot }) => {
  if (!profileSnapshot) return null;

  // Check if there's any actual data to display
  const hasData = profileSnapshot.topInterests || profileSnapshot.topStrengths || 
                  profileSnapshot.personalityType || profileSnapshot.learningStyle || 
                  profileSnapshot.workStyle || profileSnapshot.careerReadiness;
  
  if (!hasData) return null;

  return (
    <div style={{ marginBottom: '8px', marginTop: '8px' }}>
      <h3 style={printStyles.subTitle}>Your Profile at a Glance</h3>
      
      <div style={{
        padding: '10px',
        background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
        borderRadius: '8px',
        color: 'white'
      }}>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '15px' }}>
          {profileSnapshot.topInterests && (
            <div>
              <div style={{ fontSize: '9px', opacity: 0.9, marginBottom: '4px' }}>Top Interests</div>
              <div style={{ fontSize: '11px', fontWeight: 'bold' }}>
                {Array.isArray(profileSnapshot.topInterests) 
                  ? profileSnapshot.topInterests.join(', ')
                  : profileSnapshot.topInterests}
              </div>
            </div>
          )}

          {profileSnapshot.topStrengths && (
            <div>
              <div style={{ fontSize: '9px', opacity: 0.9, marginBottom: '4px' }}>Top Strengths</div>
              <div style={{ fontSize: '11px', fontWeight: 'bold' }}>
                {Array.isArray(profileSnapshot.topStrengths) 
                  ? profileSnapshot.topStrengths.join(', ')
                  : profileSnapshot.topStrengths}
              </div>
            </div>
          )}

          {profileSnapshot.personalityType && (
            <div>
              <div style={{ fontSize: '9px', opacity: 0.9, marginBottom: '4px' }}>Personality Type</div>
              <div style={{ fontSize: '11px', fontWeight: 'bold' }}>
                {profileSnapshot.personalityType}
              </div>
            </div>
          )}

          {profileSnapshot.learningStyle && (
            <div>
              <div style={{ fontSize: '9px', opacity: 0.9, marginBottom: '4px' }}>Learning Style</div>
              <div style={{ fontSize: '11px', fontWeight: 'bold' }}>
                {profileSnapshot.learningStyle}
              </div>
            </div>
          )}

          {profileSnapshot.workStyle && (
            <div>
              <div style={{ fontSize: '9px', opacity: 0.9, marginBottom: '4px' }}>Work Style</div>
              <div style={{ fontSize: '11px', fontWeight: 'bold' }}>
                {profileSnapshot.workStyle}
              </div>
            </div>
          )}

          {profileSnapshot.careerReadiness && (
            <div>
              <div style={{ fontSize: '9px', opacity: 0.9, marginBottom: '4px' }}>Career Readiness</div>
              <div style={{ fontSize: '11px', fontWeight: 'bold' }}>
                {profileSnapshot.careerReadiness}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

/**
 * Timing Analysis Section
 * Displays assessment completion insights from timing_analysis column
 */
export const TimingAnalysisSection = ({ timingAnalysis }) => {
  if (!timingAnalysis) return null;

  const formatTime = (seconds) => {
    if (!seconds) return 'N/A';
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}m ${secs}s`;
  };

  return (
    <div style={{ marginBottom: '10px', marginTop: '8px' }}>
      <h3 style={printStyles.subTitle}>Assessment Insights</h3>
      
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '8px' }}>
        {timingAnalysis.totalTime && (
          <div style={{
            padding: '10px',
            background: '#f0fdf4',
            border: '1px solid #86efac',
            borderRadius: '6px',
            textAlign: 'center'
          }}>
            <div style={{ fontSize: '9px', color: '#166534', marginBottom: '4px' }}>Total Time</div>
            <div style={{ fontSize: '14px', fontWeight: 'bold', color: '#15803d' }}>
              {formatTime(timingAnalysis.totalTime)}
            </div>
          </div>
        )}

        {timingAnalysis.averageTimePerQuestion && (
          <div style={{
            padding: '10px',
            background: '#eff6ff',
            border: '1px solid #93c5fd',
            borderRadius: '6px',
            textAlign: 'center'
          }}>
            <div style={{ fontSize: '9px', color: '#1e40af', marginBottom: '4px' }}>Avg. per Question</div>
            <div style={{ fontSize: '14px', fontWeight: 'bold', color: '#1d4ed8' }}>
              {timingAnalysis.averageTimePerQuestion}s
            </div>
          </div>
        )}

        {timingAnalysis.completionRate !== undefined && (
          <div style={{
            padding: '10px',
            background: '#fef3c7',
            border: '1px solid #fde047',
            borderRadius: '6px',
            textAlign: 'center'
          }}>
            <div style={{ fontSize: '9px', color: '#92400e', marginBottom: '4px' }}>Completion Rate</div>
            <div style={{ fontSize: '14px', fontWeight: 'bold', color: '#a16207' }}>
              {timingAnalysis.completionRate}%
            </div>
          </div>
        )}
      </div>

      {timingAnalysis.sectionTimes && Object.keys(timingAnalysis.sectionTimes).length > 0 && (
        <div style={{ marginTop: '15px' }}>
          <h4 style={{ fontSize: '10px', fontWeight: 'bold', marginBottom: '8px' }}>Time per Section</h4>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
            {Object.entries(timingAnalysis.sectionTimes).map(([section, time]) => (
              <div 
                key={section}
                style={{
                  padding: '8px',
                  background: '#f8fafc',
                  border: '1px solid #e2e8f0',
                  borderRadius: '4px',
                  display: 'flex',
                  justifyContent: 'space-between'
                }}
              >
                <span style={{ fontSize: '9px', color: '#475569', textTransform: 'capitalize' }}>
                  {section.replace(/_/g, ' ')}
                </span>
                <span style={{ fontSize: '9px', fontWeight: 'bold', color: '#1e293b' }}>
                  {formatTime(time)}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

/**
 * Final Note Section
 * Displays counselor recommendations from final_note column
 */
export const FinalNoteSection = ({ finalNote }) => {
  if (!finalNote) return null;

  return (
    <div style={{ marginBottom: '10px', marginTop: '8px' }}>
      <h3 style={printStyles.subTitle}>Counselor's Recommendations</h3>
      
      <div style={{
        padding: '10px',
        background: '#fefce8',
        border: '2px solid #fde047',
        borderRadius: '8px'
      }}>
        {finalNote.counselorNote && (
          <div style={{ marginBottom: '10px' }}>
            <div style={{ 
              fontSize: '10px', 
              fontWeight: 'bold', 
              color: '#854d0e',
              marginBottom: '6px',
              display: 'flex',
              alignItems: 'center',
              gap: '6px'
            }}>
              💬 Counselor's Note
            </div>
            <p style={{ fontSize: '9px', color: '#78716c', lineHeight: '1.5', margin: 0 }}>
              {finalNote.counselorNote}
            </p>
          </div>
        )}

        {finalNote.recommendations && finalNote.recommendations.length > 0 && (
          <div style={{ marginBottom: '10px' }}>
            <div style={{ 
              fontSize: '10px', 
              fontWeight: 'bold', 
              color: '#854d0e',
              marginBottom: '6px'
            }}>
              ✅ Key Recommendations
            </div>
            <ul style={{ margin: 0, paddingLeft: '20px' }}>
              {finalNote.recommendations.map((rec, index) => (
                <li key={index} style={{ fontSize: '9px', color: '#78716c', marginBottom: '4px' }}>
                  {rec}
                </li>
              ))}
            </ul>
          </div>
        )}

        {finalNote.nextSteps && finalNote.nextSteps.length > 0 && (
          <div>
            <div style={{ 
              fontSize: '10px', 
              fontWeight: 'bold', 
              color: '#854d0e',
              marginBottom: '6px'
            }}>
              🎯 Next Steps
            </div>
            <ul style={{ margin: 0, paddingLeft: '20px' }}>
              {finalNote.nextSteps.map((step, index) => (
                <li key={index} style={{ fontSize: '9px', color: '#78716c', marginBottom: '4px' }}>
                  {step}
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>
    </div>
  );
};
