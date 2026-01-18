/**
 * Grade Selection Screen Component
 * Displays grade level options for the assessment
 * 
 * @module features/assessment/components/GradeSelectionScreen
 */

import { useNavigate } from 'react-router-dom';
import { Award, AlertCircle, ChevronRight, Clock, Loader2, Sparkles } from 'lucide-react';
import { Button } from '../../../components/Students/components/ui/button';
import { Card, CardContent } from '../../../components/Students/components/ui/card';
import { Label } from '../../../components/Students/components/ui/label';

/**
 * @typedef {Object} GradeSelectionScreenProps
 * @property {Function} onGradeSelect - Callback when grade is selected
 * @property {string|null} studentGrade - Student's current grade from database
 * @property {string|null} detectedGradeLevel - Detected grade level from student's grade
 * @property {number|null} monthsInGrade - Months since student started current grade
 * @property {boolean} isCollegeStudent - Whether student is a college student
 * @property {boolean} loadingStudentGrade - Whether student grade is loading
 * @property {boolean} shouldShowAllOptions - Whether to show all grade options
 * @property {boolean} shouldFilterByGrade - Whether to filter options by grade
 * @property {string|null} studentProgram - Student's program name (for college students)
 * @property {Object|null} profileData - Complete student profile data for missing field analysis
 */

/**
 * Grade option configuration
 */
const GRADE_OPTIONS = [
  {
    id: 'middle',
    title: 'Grades 6–8',
    subtitle: 'Middle School Students',
    duration: '41 questions (50-60 minutes)',
    isAIPowered: false,
  },
  {
    id: 'highschool',
    title: 'Grades 9–10',
    subtitle: 'High School Students',
    duration: '53 questions (55-65 minutes)',
    isAIPowered: false,
  },
  {
    id: 'higher_secondary',
    title: 'Grades 11–12',
    subtitle: 'Higher Secondary Students',
    duration: '53 questions (55-65 minutes)',
    isAIPowered: false,
  },
  {
    id: 'after10',
    title: 'After 10th',
    subtitle: 'Students who have completed 10th grade',
    duration: '(30-40 minutes)',
    isAIPowered: true,
  },
  {
    id: 'after12',
    title: 'After 12th',
    subtitle: 'Students who have completed 12th grade',
    duration: '(35-45 minutes)',
    isAIPowered: true,
  },
  {
    id: 'college',
    title: 'College (UG/PG)',
    subtitle: 'Undergraduate & Postgraduate Students',
    duration: '(45-60 minutes)',
    isAIPowered: true,
  },
];

/**
 * Extract numeric grade from various formats
 * Handles: "10", "10th", "Grade 10", "grade 10", "Class 10", etc.
 */
const extractNumericGrade = (grade) => {
  if (!grade) return null;
  const gradeStr = String(grade).toLowerCase().trim();
  const match = gradeStr.match(/(\d+)/);
  return match ? parseInt(match[1], 10) : null;
};

/**
 * Check if a grade option should be visible
 */
const shouldShowOption = (optionId, {
  shouldShowAllOptions,
  shouldFilterByGrade,
  detectedGradeLevel,
  studentGrade,
  monthsInGrade,
  isCollegeStudent,
}) => {
  // Always show all options on skillpassport.pages.dev
  if (shouldShowAllOptions) return true;
  
  // Don't filter if not required
  if (!shouldFilterByGrade) return true;

  // Extract numeric grade from various formats (e.g., "Grade 10", "10th", "10")
  const numericGrade = extractNumericGrade(studentGrade);
  const isGrade10 = numericGrade === 10;
  const isGrade12 = numericGrade === 12;
  const hasBeenInGrade6Months = monthsInGrade !== null && monthsInGrade >= 6;

  switch (optionId) {
    case 'middle':
      return detectedGradeLevel === 'middle';

    case 'highschool':
      // Show for grades 9-10, but not for grade 10 students with 6+ months
      if (detectedGradeLevel !== 'highschool') return false;
      if (isGrade10 && hasBeenInGrade6Months) return false;
      if (isGrade12 && hasBeenInGrade6Months) return false;
      return true;

    case 'higher_secondary':
      // Show for grades 11-12, but not for grade 12 students with 6+ months
      if (detectedGradeLevel !== 'higher_secondary') return false;
      if (isGrade12 && hasBeenInGrade6Months) return false;
      return true;

    case 'after10':
      // Show for grade 10 students with 6+ months
      return detectedGradeLevel === 'highschool' && isGrade10 && (monthsInGrade === null || hasBeenInGrade6Months);

    case 'after12':
      // Show for grade 12 students with 6+ months
      return detectedGradeLevel === 'higher_secondary' && isGrade12 && (monthsInGrade === null || hasBeenInGrade6Months);

    case 'college':
      // Show for college students or after12 detected
      return isCollegeStudent || detectedGradeLevel === 'after12';

    default:
      return false;
  }
};

/**
 * Get additional info text for grade option
 */
const getAdditionalInfo = (optionId, { studentGrade, monthsInGrade }) => {
  // Extract numeric grade from various formats (e.g., "Grade 10", "10th", "10")
  const numericGrade = extractNumericGrade(studentGrade);
  const isGrade10 = numericGrade === 10;
  const isGrade12 = numericGrade === 12;
  const hasBeenInGrade6Months = monthsInGrade !== null && monthsInGrade >= 6;
  const lessThan6Months = monthsInGrade !== null && monthsInGrade < 6;

  if (optionId === 'higher_secondary') {
    if (isGrade12 && lessThan6Months) {
      return { text: `${monthsInGrade} month${monthsInGrade !== 1 ? 's' : ''} in 12th grade`, color: 'text-indigo-600' };
    }
    if (isGrade10 && lessThan6Months) {
      return { text: `${monthsInGrade} month${monthsInGrade !== 1 ? 's' : ''} in 10th grade`, color: 'text-indigo-600' };
    }
  }

  if (optionId === 'after10' && isGrade10 && hasBeenInGrade6Months) {
    return { text: `${monthsInGrade} month${monthsInGrade !== 1 ? 's' : ''} in 10th grade - Ready for stream selection!`, color: 'text-green-600' };
  }

  if (optionId === 'after12' && isGrade12 && hasBeenInGrade6Months) {
    return { text: `${monthsInGrade} month${monthsInGrade !== 1 ? 's' : ''} in 12th grade - Ready for career planning!`, color: 'text-green-600' };
  }

  return null;
};

/**
 * Grade Option Button Component
 */
const GradeOptionButton = ({ option, onClick, additionalInfo, studentProgram }) => {
  // For college option, show student's program name if available
  const displayTitle = option.id === 'college' && studentProgram 
    ? studentProgram 
    : option.title;
  
  const displaySubtitle = option.id === 'college' && studentProgram
    ? 'College/University Student'
    : option.subtitle;

  return (
    <button
      onClick={() => onClick(option.id)}
      className="w-full p-6 bg-white/80 backdrop-blur-sm border-2 border-gray-100 rounded-2xl shadow-sm hover:shadow-xl hover:shadow-indigo-500/10 hover:border-indigo-300 transition-all duration-300 text-left group transform hover:-translate-y-1 relative overflow-hidden"
    >
      <div className="absolute inset-0 bg-gradient-to-r from-indigo-50/50 to-purple-50/50 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
      <div className="relative z-10">
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-3">
            <h3 className="text-xl font-bold text-gray-800 group-hover:text-indigo-700">
              {displayTitle}
            </h3>
            {option.isAIPowered && (
              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-gradient-to-r from-purple-500 to-indigo-500 text-white text-[10px] font-semibold shadow-sm">
                <Sparkles className="w-3 h-3" />
                AI-Powered
              </span>
            )}
          </div>
          <div className="w-10 h-10 rounded-full bg-gray-50 group-hover:bg-indigo-600 group-hover:text-white flex items-center justify-center transition-all duration-300 shadow-inner group-hover:shadow-lg group-hover:shadow-indigo-500/30">
            <ChevronRight className="w-5 h-5 text-gray-400 group-hover:text-white" />
          </div>
        </div>
        <p className="text-sm text-gray-600 group-hover:text-gray-700">{displaySubtitle}</p>
        <div className="mt-3 flex items-center gap-2 text-xs text-gray-500">
          <Clock className="w-4 h-4" />
          <span>Assessment: {option.duration}</span>
        </div>
        {additionalInfo && (
          <div className={`mt-2 text-xs font-medium ${additionalInfo.color}`}>
            {additionalInfo.text}
          </div>
        )}
      </div>
    </button>
  );
};

/**
 * Incomplete Profile Screen
 */
const IncompleteProfileScreen = ({ onNavigateToSettings, onNavigateToDashboard, profileData }) => {
  const missingFields = [];
  const currentValues = [];

  // Analyze what's missing
  const hasGrade = profileData?.grade || profileData?.school_classes?.grade;
  const hasSchoolId = profileData?.school_id;
  const hasCollegeId = profileData?.university_college_id;
  const hasSchoolClassId = profileData?.school_class_id;

  // Determine student type
  const isSchoolStudent = hasSchoolId && !hasCollegeId;
  const isCollegeStudent = hasCollegeId && !hasSchoolId;
  const isUndetermined = !hasSchoolId && !hasCollegeId;

  // Build missing fields list
  if (isSchoolStudent || isUndetermined) {
    if (!hasGrade) {
      missingFields.push('Grade/Class information');
    }
    if (!hasSchoolClassId && !hasGrade) {
      missingFields.push('Class/Section assignment');
    }
  }

  if (isCollegeStudent || isUndetermined) {
    if (!hasCollegeId) {
      missingFields.push('College/University selection');
    }
  }

  // Show current values
  if (profileData) {
    if (profileData.grade) currentValues.push(`Grade: ${profileData.grade}`);
    if (profileData.school_classes?.grade) currentValues.push(`Class Grade: ${profileData.school_classes.grade}`);
    if (profileData.school_id) currentValues.push(`School ID: ${profileData.school_id}`);
    if (profileData.university_college_id) currentValues.push(`College ID: ${profileData.university_college_id}`);
    if (profileData.program?.name) currentValues.push(`Program: ${profileData.program.name}`);
    if (profileData.course_name) currentValues.push(`Course: ${profileData.course_name}`);
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 flex items-center justify-center p-4">
      <Card className="w-full max-w-2xl border-none shadow-2xl">
        <CardContent className="p-8">
          <div className="text-center mb-8">
            <div className="w-16 h-16 bg-gradient-to-br from-amber-500 to-orange-500 rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-lg">
              <AlertCircle className="w-8 h-8 text-white" />
            </div>
            <h1 className="text-3xl font-bold text-gray-800 mb-2">Complete Your Profile</h1>
            <p className="text-gray-600">Please update your personal information to take the assessment</p>
          </div>

          <div className="bg-amber-50 rounded-xl p-6 mb-6 border border-amber-200">
            <div className="flex gap-3">
              <AlertCircle className="w-6 h-6 text-amber-600 shrink-0 mt-0.5" />
              <div className="flex-1">
                <p className="font-semibold text-amber-800 mb-2">Missing Information</p>
                <p className="text-sm text-amber-700 mb-3">
                  We couldn't determine your grade level or class. Please update the following:
                </p>
                
                {missingFields.length > 0 && (
                  <div className="mb-4">
                    <p className="text-xs font-semibold text-amber-800 mb-1">Required Fields:</p>
                    <ul className="text-sm text-amber-700 list-disc list-inside space-y-1">
                      {missingFields.map((field, idx) => (
                        <li key={idx}>{field}</li>
                      ))}
                    </ul>
                  </div>
                )}

                {isUndetermined && (
                  <div className="bg-amber-100 rounded-lg p-3 mb-3">
                    <p className="text-xs font-semibold text-amber-900 mb-1">Student Type Not Determined</p>
                    <p className="text-xs text-amber-800">
                      Please specify if you are a <strong>School Student</strong> (add grade/class) or <strong>College Student</strong> (add college/university).
                    </p>
                  </div>
                )}

                {currentValues.length > 0 && (
                  <div className="mt-3 pt-3 border-t border-amber-200">
                    <p className="text-xs font-semibold text-amber-800 mb-1">Current Profile Data:</p>
                    <div className="text-xs text-amber-700 space-y-0.5">
                      {currentValues.map((value, idx) => (
                        <div key={idx}>• {value}</div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>

          <div className="bg-blue-50 rounded-xl p-4 mb-6 border border-blue-200">
            <p className="text-sm font-semibold text-blue-800 mb-2">What to do:</p>
            <ol className="text-sm text-blue-700 space-y-1 list-decimal list-inside">
              <li>Click "Go to Profile Settings" below</li>
              <li>Update your {isSchoolStudent ? 'Grade/Class' : isCollegeStudent ? 'College/Program' : 'Grade or College'} information</li>
              <li>Save your changes</li>
              <li>Return to take the assessment</li>
            </ol>
          </div>

          <Button
            onClick={onNavigateToSettings}
            className="w-full bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 text-white py-6 text-lg shadow-lg"
          >
            Go to Profile Settings
          </Button>
          
          <Button
            variant="outline"
            onClick={onNavigateToDashboard}
            className="w-full mt-3 py-4"
          >
            Back to Dashboard
          </Button>
        </CardContent>
      </Card>
    </div>
  );
};

/**
 * Loading Screen
 */
const LoadingScreen = () => (
  <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 flex items-center justify-center p-4">
    <div className="text-center">
      <Loader2 className="w-8 h-8 animate-spin text-indigo-600 mx-auto mb-4" />
      <p className="text-gray-600">Loading...</p>
    </div>
  </div>
);

/**
 * Grade Selection Screen Component
 */
export const GradeSelectionScreen = ({
  onGradeSelect,
  studentGrade,
  detectedGradeLevel,
  monthsInGrade,
  isCollegeStudent,
  loadingStudentGrade,
  shouldShowAllOptions,
  shouldFilterByGrade,
  studentProgram = null,
  profileData = null,
}) => {
  const navigate = useNavigate();

  // Check if student has incomplete profile
  const hasIncompleteProfile = shouldFilterByGrade && !detectedGradeLevel && !isCollegeStudent;

  // Show loading while fetching student grade
  if (loadingStudentGrade && shouldFilterByGrade) {
    return <LoadingScreen />;
  }

  // Show incomplete profile message
  if (hasIncompleteProfile) {
    return (
      <IncompleteProfileScreen
        onNavigateToSettings={() => navigate('/student/settings')}
        onNavigateToDashboard={() => navigate('/student/dashboard')}
        profileData={profileData}
      />
    );
  }

  // Filter options based on visibility rules
  const visibilityContext = {
    shouldShowAllOptions,
    shouldFilterByGrade,
    detectedGradeLevel,
    studentGrade,
    monthsInGrade,
    isCollegeStudent,
  };

  const visibleOptions = GRADE_OPTIONS.filter(option => 
    shouldShowOption(option.id, visibilityContext)
  );

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 flex items-center justify-center p-4">
      <Card className="w-full max-w-2xl border-none shadow-2xl">
        <CardContent className="p-8">
          <div className="text-center mb-8">
            <div className="w-16 h-16 bg-gradient-to-br from-blue-600 to-indigo-600 rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-lg">
              <Award className="w-8 h-8 text-white" />
            </div>
            <h1 className="text-3xl font-bold text-gray-800 mb-2">Career Assessment</h1>
            <p className="text-gray-600">Select your grade level to get started</p>
          </div>

          <div className="space-y-4">
            <Label className="text-sm font-semibold text-gray-700">Choose Your Grade Level</Label>

            {visibleOptions.map(option => (
              <GradeOptionButton
                key={option.id}
                option={option}
                onClick={onGradeSelect}
                additionalInfo={getAdditionalInfo(option.id, { studentGrade, monthsInGrade })}
                studentProgram={studentProgram}
              />
            ))}
          </div>

          <div className="mt-8 p-4 bg-blue-50 rounded-xl border border-blue-100">
            <div className="flex gap-3">
              <AlertCircle className="w-5 h-5 text-blue-600 shrink-0 mt-0.5" />
              <div className="text-sm text-blue-700">
                <p className="font-semibold mb-1">Personalized Career Guidance</p>
                <p>This assessment is designed to help you discover your interests, strengths, and potential career paths based on your age and educational level.</p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default GradeSelectionScreen;
