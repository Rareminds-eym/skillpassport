/**
 * PrintView Router Component
 * Routes to appropriate grade-level-specific print view component
 * Requirements: 1.4, 5.1, 5.2, 5.3, 5.4, 5.5, 6.4
 */

import PrintViewMiddleHighSchool from './PrintViewMiddleHighSchool';
import PrintViewHigherSecondary from './PrintViewHigherSecondary';
import PrintViewCollege from './PrintViewCollege';

/**
 * Determines the appropriate grade level for routing
 * Requirements: 1.4, 5.1, 5.2, 5.3, 5.4, 5.5
 * 
 * @param {string|undefined} gradeLevel - Explicit grade level prop
 * @param {Object} results - Assessment results data
 * @returns {string} - Grade level category ('middle', 'higher_secondary', or 'college')
 */
const determineGradeLevel = (gradeLevel, results) => {
  console.log('🔍 PrintView.determineGradeLevel - Input:', { gradeLevel, hasResults: !!results });
  
  // Handle explicit gradeLevel prop - Requirements 5.1, 5.2, 5.3
  if (gradeLevel) {
    // Map gradeLevel values to component categories
    if (gradeLevel === 'middle' || gradeLevel === 'highschool') {
      console.log('✅ PrintView: Routing to PrintViewMiddleHighSchool');
      return 'middle';
    }
    // 🔧 CRITICAL FIX: Map 'after10' to 'higher_secondary' component
    if (gradeLevel === 'after10' || gradeLevel === 'higher_secondary') {
      console.log('✅ PrintView: Routing to PrintViewHigherSecondary (after10 or higher_secondary)');
      return 'higher_secondary';
    }
    if (gradeLevel === 'after12' || gradeLevel === 'college') {
      console.log('✅ PrintView: Routing to PrintViewCollege');
      return 'college';
    }
  }

  // Implement profileSnapshot inference - Requirement 5.4
  if (results?.profileSnapshot) {
    if (results.profileSnapshot.aptitudeStrengths || results.profileSnapshot.keyPatterns) {
      console.log('✅ PrintView: Routing to PrintViewMiddleHighSchool (inferred from profileSnapshot)');
      return 'middle';
    }
  }

  // Default to college - Requirement 5.5
  console.log('⚠️ PrintView: Defaulting to PrintViewCollege');
  return 'college';
};

/**
 * PrintView Router Component
 * Delegates rendering to appropriate grade-level component
 * Requirements: 1.4, 6.4
 * 
 * @param {Object} props - Component props
 * @param {Object} props.results - Assessment results data
 * @param {Object} props.studentInfo - Student information
 * @param {string} props.gradeLevel - Grade level indicator (optional)
 * @param {Object} props.riasecNames - RIASEC code to name mapping (optional)
 * @param {Object} props.traitNames - Trait code to name mapping (optional)
 * @param {Array} props.courseRecommendations - Course/program recommendations (optional)
 * @param {Object} props.streamRecommendation - Stream recommendation for after10 students (optional)
 * @param {Object} props.studentAcademicData - Student academic data (optional)
 * @returns {JSX.Element} - Appropriate grade-level print view component
 */
const PrintView = ({ 
  results, 
  studentInfo, 
  gradeLevel, 
  riasecNames, 
  traitNames,
  courseRecommendations,
  streamRecommendation,
  studentAcademicData
}) => {
  // Handle null/undefined results - Requirement 6.4
  if (!results) {
    return (
      <div className="print-view">
        <div style={{ padding: '20px', textAlign: 'center' }}>
          <p>No results available for printing.</p>
        </div>
      </div>
    );
  }

  // Determine which grade-level component to render
  const detectedGradeLevel = determineGradeLevel(gradeLevel, results);

  // Route to appropriate component - Requirements 1.4, 5.1, 5.2, 5.3
  if (detectedGradeLevel === 'middle') {
    return (
      <PrintViewMiddleHighSchool
        results={results}
        studentInfo={studentInfo}
        riasecNames={riasecNames}
        streamRecommendation={streamRecommendation}
        studentAcademicData={studentAcademicData}
        gradeLevel={gradeLevel}
      />
    );
  }

  if (detectedGradeLevel === 'higher_secondary') {
    return (
      <PrintViewHigherSecondary
        results={results}
        studentInfo={studentInfo}
        riasecNames={riasecNames}
        traitNames={traitNames}
        courseRecommendations={courseRecommendations}
        streamRecommendation={streamRecommendation}
        studentAcademicData={studentAcademicData}
      />
    );
  }

  // Default to college component
  return (
    <PrintViewCollege
      results={results}
      studentInfo={studentInfo}
      riasecNames={riasecNames}
      traitNames={traitNames}
      courseRecommendations={courseRecommendations}
      studentAcademicData={studentAcademicData}
    />
  );
};

export default PrintView;
