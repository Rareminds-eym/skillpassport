import React, { useState, useEffect } from 'react';
import { Course } from '../types';
import { StatusBadge } from '../components';
import { BookOpenIcon, AcademicCapIcon, StarIcon, ClockIcon } from '@heroicons/react/24/outline';
import { IconSparkles, IconBrain } from '@tabler/icons-react';
import { supabase } from '@/lib/supabaseClient';

interface CoursesTabProps {
  courses: Course[];
  loading: boolean;
  studentId?: string;
}

interface RecommendedCourse {
  course_id: string;
  title: string;
  description: string;
  duration: string;
  relevance_score: number;
  skill_type: 'technical' | 'soft';
  skills: string[];
  match_reasons: string[];
  target_outcomes: string[];
}

const CoursesTab: React.FC<CoursesTabProps> = ({ courses, loading, studentId }) => {
  const [recommendedCourses, setRecommendedCourses] = useState<RecommendedCourse[]>([]);
  const [loadingRecommendations, setLoadingRecommendations] = useState(false);

  // Fetch course recommendations based on assessment results
  useEffect(() => {
    const fetchRecommendations = async () => {
      if (!studentId) return;

      setLoadingRecommendations(true);
      try {
        const { data, error } = await supabase
          .from('personal_assessment_results')
          .select('gemini_results')
          .eq('student_id', studentId)
          .order('created_at', { ascending: false })
          .limit(1);

        if (error) {
          console.error('Error fetching assessment results:', error);
          return;
        }

        if (data && data.length > 0 && data[0].gemini_results) {
          const geminiResults = data[0].gemini_results;

          // Extract top 3 courses from coursesByType based on relevance_score
          const allCourses = [
            ...(geminiResults.coursesByType?.technical || []),
            ...(geminiResults.coursesByType?.soft || []),
          ];

          // Sort by relevance_score and take top 3
          const topCourses = allCourses
            .sort((a, b) => (b.relevance_score || 0) - (a.relevance_score || 0))
            .slice(0, 3)
            .map((course) => ({
              course_id: course.course_id,
              title: course.title,
              description: course.description,
              duration: course.duration,
              relevance_score: course.relevance_score,
              skill_type: course.skill_type,
              skills: course.skills || [],
              match_reasons: course.match_reasons || [],
              target_outcomes: course.target_outcomes || [],
            }));

          setRecommendedCourses(topCourses);
        }
      } catch (error) {
        console.error('Error processing recommendations:', error);
      } finally {
        setLoadingRecommendations(false);
      }
    };

    fetchRecommendations();
  }, [studentId]);

  if (loading) {
    return (
      <div className="p-6">
        <div className="animate-pulse space-y-6">
          {/* Recommendations skeleton */}
          <div className="space-y-3">
            <div className="h-6 bg-gray-200 rounded w-1/3"></div>
            <div className="grid gap-3">
              {[1, 2, 3].map((i) => (
                <div key={i} className="bg-gray-200 h-20 rounded-lg"></div>
              ))}
            </div>
          </div>

          {/* Enrolled courses skeleton */}
          <div className="space-y-3">
            <div className="h-6 bg-gray-200 rounded w-1/4"></div>
            {[1, 2].map((i) => (
              <div key={i} className="bg-gray-200 h-32 rounded-lg"></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  const EmptyState = ({
    title,
    description,
    icon: Icon,
  }: {
    title: string;
    description: string;
    icon: React.ComponentType<any>;
  }) => (
    <div className="text-center py-12">
      <div className="mx-auto flex items-center justify-center h-16 w-16 rounded-full bg-gray-100 mb-4">
        <Icon className="h-8 w-8 text-gray-400" />
      </div>
      <h3 className="text-sm font-medium text-gray-900 mb-2">{title}</h3>
      <p className="text-sm text-gray-500">{description}</p>
    </div>
  );

  const CourseCard = ({ course, isPlatform = false }: { course: Course; isPlatform?: boolean }) => (
    <div className="bg-white border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow">
      <div className="flex items-start justify-between mb-2">
        <div className="flex-1">
          <div className="flex items-center gap-2 mb-1">
            <h4 className="text-sm font-semibold text-gray-900">{course.title}</h4>
            {isPlatform && (
              <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-blue-100 text-blue-700">
                Platform
              </span>
            )}
            {!isPlatform && (
              <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-purple-100 text-purple-700">
                Personal
              </span>
            )}
          </div>
          {course.organization && (
            <p className="text-xs text-gray-600 mt-1">Organization: {course.organization}</p>
          )}
        </div>
        {course.approval_status && <StatusBadge status={course.approval_status} />}
      </div>

      {course.description && (
        <p className="text-xs text-gray-600 mb-3 line-clamp-2">{course.description}</p>
      )}

      {/* Progress Bar */}
      {course.progress !== undefined && (
        <div className="mb-3">
          <div className="flex justify-between items-center mb-1">
            <span className="text-xs text-gray-600">Progress</span>
            <span className="text-xs font-medium text-gray-900">{course.progress}%</span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-2">
            <div
              className="bg-blue-600 h-2 rounded-full transition-all duration-300"
              style={{ width: `${course.progress}%` }}
            ></div>
          </div>
        </div>
      )}

      {/* Course Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-xs text-gray-600 mb-3">
        {course.completed_modules !== undefined && course.total_modules !== undefined && (
          <div>
            <span className="block font-medium text-gray-900">
              {course.completed_modules}/{course.total_modules}
            </span>
            <span>Modules</span>
          </div>
        )}
        {course.hours_spent !== undefined && (
          <div>
            <span className="block font-medium text-gray-900">{course.hours_spent}h</span>
            <span>Time Spent</span>
          </div>
        )}
        {course.duration && (
          <div>
            <span className="block font-medium text-gray-900">{course.duration}</span>
            <span>Duration</span>
          </div>
        )}
        {course.grade && (
          <div>
            <span className="block font-medium text-gray-900">{course.grade}</span>
            <span>Grade</span>
          </div>
        )}
      </div>

      {/* Skills Acquired */}
      {course.skills_acquired && course.skills_acquired.length > 0 && (
        <div className="mb-3">
          <span className="text-xs text-gray-600 block mb-1">Skills Acquired:</span>
          <div className="flex flex-wrap gap-1">
            {course.skills_acquired.slice(0, 3).map((skill, idx) => (
              <span
                key={idx}
                className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-green-100 text-green-700"
              >
                {skill}
              </span>
            ))}
            {course.skills_acquired.length > 3 && (
              <span className="text-xs text-gray-500">
                +{course.skills_acquired.length - 3} more
              </span>
            )}
          </div>
        </div>
      )}

      {/* Certificate */}
      {course.certificate_url && (
        <div className="mb-3">
          <a
            href={course.certificate_url}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center text-xs text-blue-600 hover:text-blue-700"
          >
            <AcademicCapIcon className="h-3 w-3 mr-1" />
            View Certificate
          </a>
        </div>
      )}

      {/* Dates */}
      <div className="flex justify-between items-center text-xs text-gray-500 pt-3 border-t border-gray-100">
        <div>
          {course.start_date && (
            <span>Started: {new Date(course.start_date).toLocaleDateString()}</span>
          )}
        </div>
        <div>
          {course.status && (
            <span
              className={`px-2 py-1 rounded-full text-xs font-medium ${
                course.status === 'completed'
                  ? 'bg-green-100 text-green-800'
                  : course.status === 'in_progress'
                    ? 'bg-blue-100 text-blue-800'
                    : 'bg-gray-100 text-gray-800'
              }`}
            >
              {course.status.replace('_', ' ').toUpperCase()}
            </span>
          )}
        </div>
      </div>
    </div>
  );

  const RecommendationCard = ({ course }: { course: RecommendedCourse }) => (
    <div className="bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-200 rounded-lg p-4 hover:shadow-md transition-shadow">
      <div className="flex items-start justify-between mb-2">
        <div className="flex-1">
          <div className="flex items-center gap-2 mb-1">
            <h4 className="text-sm font-semibold text-gray-900">{course.title}</h4>
            <span
              className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${
                course.skill_type === 'technical'
                  ? 'bg-green-100 text-green-700'
                  : 'bg-orange-100 text-orange-700'
              }`}
            >
              {course.skill_type === 'technical' ? 'Technical' : 'Soft Skills'}
            </span>
          </div>
        </div>
        <div className="flex items-center gap-1 text-xs text-blue-600">
          <StarIcon className="h-3 w-3" />
          <span className="font-medium">Recommended</span>
        </div>
      </div>

      <p className="text-xs text-gray-600 mb-3 line-clamp-2">{course.description}</p>

      {/* Skills */}
      {course.skills && course.skills.length > 0 && (
        <div className="mb-3">
          <span className="text-xs text-gray-600 block mb-1">Skills:</span>
          <div className="flex flex-wrap gap-1">
            {course.skills.slice(0, 3).map((skill, idx) => (
              <span
                key={idx}
                className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-blue-100 text-blue-700"
              >
                {skill}
              </span>
            ))}
            {course.skills.length > 3 && (
              <span className="text-xs text-gray-500">+{course.skills.length - 3} more</span>
            )}
          </div>
        </div>
      )}

      {/* Duration */}
      <div className="flex items-center gap-4 text-xs text-gray-600 mb-3">
        <div className="flex items-center gap-1">
          <ClockIcon className="h-3 w-3" />
          <span>{course.duration}</span>
        </div>
      </div>

      {/* Match Reasons */}
      {course.match_reasons && course.match_reasons.length > 0 && (
        <div className="pt-3 border-t border-blue-200">
          <div className="flex items-start justify-between">
            <div className="flex-1">
              <span className="text-xs text-blue-600 font-medium">Why recommended:</span>
              <p className="text-xs text-gray-600 mt-1">{course.match_reasons[0]}</p>
            </div>
            <button className="ml-3 inline-flex items-center px-3 py-1.5 border border-blue-300 rounded-md text-xs font-medium text-blue-700 bg-blue-50 hover:bg-blue-100 hover:border-blue-400 transition-colors duration-200">
              <BookOpenIcon className="h-3 w-3 mr-1" />
              View Course
            </button>
          </div>
        </div>
      )}
    </div>
  );

  return (
    <div className="p-6 space-y-6">
      {/* Course Recommendations Section */}
      <div>
        <div className="flex items-center gap-2 mb-4">
          <IconSparkles className="h-5 w-5 text-blue-600" />
          <div>
            <h3 className="text-lg font-semibold text-gray-900">Course Recommendations</h3>
            <p className="text-sm text-gray-600">Based on your assessment results</p>
          </div>
        </div>

        {loadingRecommendations ? (
          <div className="animate-pulse space-y-3">
            {[1, 2, 3].map((i) => (
              <div key={i} className="bg-gray-200 h-20 rounded-lg"></div>
            ))}
          </div>
        ) : recommendedCourses.length > 0 ? (
          <div className="grid gap-3 mb-6">
            {recommendedCourses.map((course, index) => (
              <RecommendationCard key={`${course.course_id}-${index}`} course={course} />
            ))}
          </div>
        ) : (
          <div className="bg-gray-50 border border-gray-200 rounded-lg p-6 mb-6">
            <div className="text-center">
              <IconBrain className="h-8 w-8 text-gray-400 mx-auto mb-2" />
              <p className="text-sm text-gray-600">
                Complete your assessment to get personalized course recommendations
              </p>
            </div>
          </div>
        )}
      </div>

      {/* Enrolled Courses Section */}
      <div>
        <div className="flex items-center gap-2 mb-4">
          <BookOpenIcon className="h-5 w-5 text-green-600" />
          <div>
            <h3 className="text-lg font-semibold text-gray-900">Enrolled Courses</h3>
            <p className="text-sm text-gray-600">Your current and completed courses</p>
          </div>
        </div>

        {courses.length === 0 ? (
          <EmptyState
            title="No courses found"
            description="Start your learning journey by enrolling in courses"
            icon={BookOpenIcon}
          />
        ) : (
          <div className="space-y-4">
            {courses.map((course) => (
              <CourseCard
                key={course.id}
                course={course}
                isPlatform={!!(course.source === 'platform' || course.course_id)}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default CoursesTab;
