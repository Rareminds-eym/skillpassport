import { useState, useEffect } from 'react';
import { AlertCircle, GraduationCap, Code, Users, Sparkles } from 'lucide-react';
import { supabase } from '../../../../../lib/supabaseClient';
import CourseRecommendationCard from '../CourseRecommendationCard';

/**
 * Recommended Courses Section Component
 * Displays platform course recommendations based on assessment results
 * Uses pre-fetched courses separated by skill type (technical vs soft)
 *
 * Requirements: 4.1, 4.4, 3.5
 */
const RecommendedCoursesSection = ({
  platformCourses = [],
  coursesByType = { technical: [], soft: [] },
  skillGapCourses = {},
  onCourseClick,
}) => {
  const [technicalCourses, setTechnicalCourses] = useState([]);
  const [softCourses, setSoftCourses] = useState([]);
  const [loading, setLoading] = useState(true);

  // Process courses from props - courses are already fetched separately by type
  useEffect(() => {
    const processCourses = async () => {
      try {
        setLoading(true);

        // Use coursesByType if available (new approach - courses fetched separately)
        if (coursesByType?.technical?.length > 0 || coursesByType?.soft?.length > 0) {
          console.log('Using pre-fetched courses by type:', {
            technical: coursesByType.technical?.length || 0,
            soft: coursesByType.soft?.length || 0,
          });

          // Sort by relevance and take top 3 of each
          const sortedTechnical = [...(coursesByType.technical || [])]
            .sort((a, b) => (b.relevance_score || 0) - (a.relevance_score || 0))
            .slice(0, 3);

          const sortedSoft = [...(coursesByType.soft || [])]
            .sort((a, b) => (b.relevance_score || 0) - (a.relevance_score || 0))
            .slice(0, 3);

          setTechnicalCourses(sortedTechnical);
          setSoftCourses(sortedSoft);
          return;
        }

        // Fallback: fetch skill_type from database for existing results
        if (platformCourses.length > 0) {
          console.log(
            'Fallback: fetching skill_type from database for',
            platformCourses.length,
            'courses'
          );
          await classifyFromDatabase();
          return;
        }

        // No courses available
        setTechnicalCourses([]);
        setSoftCourses([]);
      } catch (err) {
        console.error('Error processing courses:', err);
        setTechnicalCourses([]);
        setSoftCourses([]);
      } finally {
        setLoading(false);
      }
    };

    // Fallback: fetch skill_type from database and classify
    const classifyFromDatabase = async () => {
      try {
        // Combine platformCourses and skillGapCourses
        const allCourses = new Map();
        platformCourses.forEach((c) => c.course_id && allCourses.set(c.course_id, c));
        Object.values(skillGapCourses)
          .flat()
          .forEach((c) => {
            if (c.course_id && !allCourses.has(c.course_id)) {
              allCourses.set(c.course_id, c);
            }
          });

        const courseIds = Array.from(allCourses.keys());

        if (courseIds.length === 0) {
          setTechnicalCourses([]);
          setSoftCourses([]);
          return;
        }

        // Fetch skill_type from database
        const { data: dbCourses, error } = await supabase
          .from('courses')
          .select('course_id, skill_type')
          .in('course_id', courseIds);

        if (error) {
          console.error('Error fetching skill_type:', error);
          // Fall back to simple classification
          simpleClassify(allCourses);
          return;
        }

        // Create skill_type map
        const skillTypeMap = new Map();
        dbCourses?.forEach((c) => skillTypeMap.set(c.course_id, c.skill_type || 'soft'));

        // Classify courses
        const technical = [];
        const soft = [];

        allCourses.forEach((course, courseId) => {
          const skillType = skillTypeMap.get(courseId) || 'soft';
          if (skillType === 'technical') {
            technical.push({ ...course, skill_type: 'technical' });
          } else {
            soft.push({ ...course, skill_type: 'soft' });
          }
        });

        // Sort by relevance and take top 3
        technical.sort((a, b) => (b.relevance_score || 0) - (a.relevance_score || 0));
        soft.sort((a, b) => (b.relevance_score || 0) - (a.relevance_score || 0));

        console.log('Classified from DB:', { technical: technical.length, soft: soft.length });
        setTechnicalCourses(technical.slice(0, 3));
        setSoftCourses(soft.slice(0, 3));
      } catch (err) {
        console.error('Error in classifyFromDatabase:', err);
        simpleClassify(new Map());
      }
    };

    // Simple fallback when DB fetch fails
    const simpleClassify = (allCourses) => {
      const courses = Array.from(allCourses.values());
      courses.sort((a, b) => (b.relevance_score || 0) - (a.relevance_score || 0));
      // Split evenly as last resort
      const mid = Math.ceil(courses.length / 2);
      setTechnicalCourses(courses.slice(0, Math.min(3, mid)));
      setSoftCourses(courses.slice(mid, mid + 3));
    };

    processCourses();
  }, [platformCourses, coursesByType, skillGapCourses]);

  const hasRecommendations = technicalCourses.length > 0 || softCourses.length > 0;
  const hasTechnical = technicalCourses.length > 0;
  const hasSoft = softCourses.length > 0;

  // Loading state
  if (loading) {
    return (
      <div className="bg-white rounded-xl p-8 border border-gray-200 shadow-sm">
        <div className="flex items-center justify-center gap-3">
          <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-indigo-600"></div>
          <span className="text-gray-600 text-base">Loading course recommendations...</span>
        </div>
      </div>
    );
  }

  // Empty state
  if (!hasRecommendations) {
    return (
      <div className="bg-gray-50 rounded-xl p-8 text-center border border-gray-200">
        <div className="w-16 h-16 rounded-full bg-gray-100 flex items-center justify-center mx-auto mb-4">
          <AlertCircle className="w-8 h-8 text-gray-400" />
        </div>
        <h4 className="font-semibold text-gray-700 mb-2 text-lg">
          No Course Recommendations Available
        </h4>
        <p className="text-gray-500 text-base max-w-md mx-auto">
          We couldn't find platform courses that match your profile at this time. Check back later
          as new courses are added regularly.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Main Header */}
      <div className="bg-white rounded-xl p-6 border border-gray-200 shadow-sm">
        <div className="flex items-center gap-3 mb-2">
          <div className="w-12 h-12 rounded-lg bg-indigo-100 flex items-center justify-center">
            <GraduationCap className="w-6 h-6 text-indigo-600" />
          </div>
          <div>
            <h3 className="font-bold text-gray-900 text-2xl">Recommended Courses</h3>
            <p className="text-sm text-gray-500">
              Courses matched to your assessment results & skill gaps
            </p>
          </div>
        </div>
        <p className="text-base text-gray-600 mt-3">
          Based on your skill gaps and career interests, we've identified courses that can help
          accelerate your career development.
        </p>
      </div>

      {/* Combined Courses Container with 2 Sub-sections */}
      <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
        {/* Technical Skills Sub-section */}
        {hasTechnical && (
          <div className={hasSoft ? 'border-b border-gray-200' : ''}>
            <div className="bg-gradient-to-r from-blue-50 to-indigo-50 p-5 border-b border-blue-100">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-lg bg-blue-500 flex items-center justify-center">
                    <Code className="w-5 h-5 text-white" />
                  </div>
                  <div>
                    <h4 className="font-semibold text-gray-900 text-xl">Technical Skills</h4>
                    <p className="text-sm text-gray-500">Programming, tools & domain expertise</p>
                  </div>
                </div>
                <span className="px-3 py-1 bg-blue-100 text-blue-700 rounded text-sm font-medium">
                  Top {technicalCourses.length}
                </span>
              </div>
            </div>
            <div className="p-5">
              <div className="grid md:grid-cols-3 gap-4">
                {technicalCourses.map((course, idx) => (
                  <CourseRecommendationCard
                    key={course.course_id || idx}
                    course={course}
                    onClick={onCourseClick}
                  />
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Soft Skills Sub-section */}
        {hasSoft && (
          <div>
            <div className="bg-gradient-to-r from-purple-50 to-pink-50 p-5 border-b border-purple-100">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-lg bg-purple-500 flex items-center justify-center">
                    <Users className="w-5 h-5 text-white" />
                  </div>
                  <div>
                    <h4 className="font-semibold text-gray-900 text-xl">Soft Skills</h4>
                    <p className="text-sm text-gray-500">
                      Communication, leadership & interpersonal skills
                    </p>
                  </div>
                </div>
                <span className="px-3 py-1 bg-purple-100 text-purple-700 rounded text-sm font-medium">
                  Top {softCourses.length}
                </span>
              </div>
            </div>
            <div className="p-5">
              <div className="grid md:grid-cols-3 gap-4">
                {softCourses.map((course, idx) => (
                  <CourseRecommendationCard
                    key={course.course_id || idx}
                    course={course}
                    onClick={onCourseClick}
                  />
                ))}
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Call to Action */}
      <div className="bg-slate-800 rounded-xl p-6 text-center">
        <h4 className="text-2xl font-bold text-white mb-2">Ready to Start Learning?</h4>
        <p className="text-gray-400 text-base mb-4">
          Click on any course card above to view details and enroll. Start with courses that address
          your Priority A skills for maximum impact.
        </p>
        <div className="flex items-center justify-center gap-2 text-indigo-400 text-base">
          <Sparkles className="w-5 h-5" />
          <span>Courses are ranked by relevance to your profile</span>
        </div>
      </div>
    </div>
  );
};

export default RecommendedCoursesSection;
