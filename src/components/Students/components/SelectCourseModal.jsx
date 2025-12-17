import { useState, useEffect } from 'react';
import { supabase } from '../../../lib/supabaseClient';
import { X, BookOpen, ExternalLink, Search } from 'lucide-react';
import AddLearningCourseModal from './AddLearningCourseModal';
import LearningProgressBar from './LearningProgressBar';

export default function SelectCourseModal({ isOpen, onClose, studentId, onSuccess }) {
  const [courses, setCourses] = useState([]);
  const [enrolledCourseIds, setEnrolledCourseIds] = useState([]);
  const [enrollmentProgress, setEnrollmentProgress] = useState({});
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [showExternalForm, setShowExternalForm] = useState(false);

  useEffect(() => {
    if (isOpen && studentId) {
      fetchAvailableCourses();
    }
  }, [isOpen, studentId]);

  const fetchAvailableCourses = async () => {
    try {
      setLoading(true);
      
      // Fetch all active courses
      const { data: coursesData, error: coursesError } = await supabase
        .from('courses')
        .select('course_id, title, code, description, educator_name, duration, category, university')
        .eq('status', 'Active')
        .order('title');

      if (coursesError) throw coursesError;

      // Fetch enrolled course IDs for this student
      const { data: enrollmentsData, error: enrollmentsError } = await supabase
        .from('course_enrollments')
        .select('course_id')
        .eq('student_id', studentId);

      if (enrollmentsError) throw enrollmentsError;

      const enrolledIds = enrollmentsData?.map(e => e.course_id) || [];

      // Fetch progress data from student_course_progress table
      const { data: progressData, error: progressError } = await supabase
        .from('student_course_progress')
        .select('course_id, lesson_id, status')
        .eq('student_id', studentId);

      if (progressError) {
        console.error('Error fetching progress:', progressError);
      }

      // Fetch total lessons per course (lessons -> modules -> courses)
      const { data: courseLessonsData, error: lessonsError } = await supabase
        .from('course_modules')
        .select(`
          course_id,
          lessons:lessons(lesson_id)
        `);

      if (lessonsError) {
        console.error('Error fetching course lessons:', lessonsError);
      }

      // Build total lessons map per course
      const totalLessonsMap = {};
      courseLessonsData?.forEach(module => {
        if (!totalLessonsMap[module.course_id]) {
          totalLessonsMap[module.course_id] = 0;
        }
        totalLessonsMap[module.course_id] += module.lessons?.length || 0;
      });

      // Build progress map from student_course_progress
      const progressMap = {};
      const courseProgressTemp = {};

      // Group progress by course_id
      progressData?.forEach(p => {
        if (!courseProgressTemp[p.course_id]) {
          courseProgressTemp[p.course_id] = { completed: 0, total: 0 };
        }
        if (p.status === 'completed') {
          courseProgressTemp[p.course_id].completed++;
        }
      });

      // Create final progress map with total lessons from course structure
      Object.keys(courseProgressTemp).forEach(courseId => {
        const totalLessons = totalLessonsMap[courseId] || 0;
        const completedLessons = courseProgressTemp[courseId].completed;
        
        progressMap[courseId] = {
          completedModules: completedLessons,
          totalModules: totalLessons,
          status: totalLessons > 0 && completedLessons >= totalLessons ? 'completed' : 'ongoing'
        };
      });

      // For enrolled courses without progress data, set default values with total lessons
      enrolledIds.forEach(courseId => {
        if (!progressMap[courseId]) {
          progressMap[courseId] = {
            completedModules: 0,
            totalModules: totalLessonsMap[courseId] || 0,
            status: 'ongoing'
          };
        }
      });
      
      setCourses(coursesData || []);
      setEnrolledCourseIds(enrolledIds);
      setEnrollmentProgress(progressMap);
    } catch (error) {
      console.error('Error fetching courses:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSelectCourse = async (course) => {
    try {
      // 1. Get module count for this course
      const { data: modules, error: modulesError } = await supabase
        .from('course_modules')
        .select('module_id')
        .eq('course_id', course.course_id);

      const totalModules = modules?.length || 0;

      // 2. Create enrollment record
      const { error: enrollError } = await supabase
        .from('course_enrollments')
        .insert({
          student_id: studentId,
          course_id: course.course_id,
          course_title: course.title,
          educator_name: course.educator_name,
          enrolled_at: new Date().toISOString(),
          status: 'active',
          progress: 0
        });

      if (enrollError) throw enrollError;

      // 3. Create training record so it shows in My Learning
      const { data: training, error: trainingError } = await supabase
        .from('trainings')
        .insert({
          student_id: studentId,
          course_id: course.course_id,
          title: course.title,
          organization: course.university || 'Internal Platform',
          description: course.description,
          duration: course.duration,
          status: 'ongoing',
          completed_modules: 0,
          total_modules: totalModules,
          hours_spent: 0,
          approval_status: 'approved',
          source: 'internal_course'
        })
        .select()
        .single();

      if (trainingError) {
        console.error('Error creating training record:', trainingError);
        // Don't fail the enrollment if training creation fails
      }

      // 4. Copy course skills to student's skills
      if (training) {
        const { data: courseSkills, error: skillsError } = await supabase
          .from('course_skills')
          .select('skill_name, proficiency_level')
          .eq('course_id', course.course_id);

        if (courseSkills && courseSkills.length > 0) {
          const studentSkills = courseSkills.map(skill => ({
            student_id: studentId,
            training_id: training.id,
            name: skill.skill_name,
            type: 'technical',
            level: 3, // Default intermediate level
            approval_status: 'approved',
            enabled: true,
            verified: true
          }));

          const { error: insertSkillsError } = await supabase
            .from('skills')
            .insert(studentSkills);

          if (insertSkillsError) {
            console.error('Error adding skills:', insertSkillsError);
          }
        }
      }

      onSuccess?.();
      onClose();
    } catch (error) {
      console.error('Error enrolling:', error);
      alert('Failed to enroll. Please try again.');
    }
  };

  const filteredCourses = courses.filter(course =>
    course.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
    course.code?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const enrolledCourses = filteredCourses.filter(course => 
    enrolledCourseIds.includes(course.course_id)
  );

  const availableCourses = filteredCourses.filter(course => 
    !enrolledCourseIds.includes(course.course_id)
  );

  if (!isOpen) return null;

  if (showExternalForm) {
    return (
      <AddLearningCourseModal
        isOpen={true}
        onClose={() => {
          setShowExternalForm(false);
          onClose();
        }}
        studentId={studentId}
        onSuccess={() => {
          setShowExternalForm(false);
          onSuccess?.();
          onClose();
        }}
      />
    );
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg max-w-4xl w-full max-h-[90vh] overflow-hidden flex flex-col">
        <div className="sticky top-0 bg-white border-b px-6 py-4 flex justify-between items-center">
          <div>
            <h2 className="text-2xl font-bold text-indigo-900">Add Learning</h2>
            <p className="text-sm text-gray-600 mt-1">
              Select a course from our platform or add an external course
            </p>
          </div>
          <button onClick={onClose} className="text-gray-500 hover:text-gray-700">
            <X size={24} />
          </button>
        </div>

        <div className="px-6 py-4 border-b bg-gray-50 flex gap-3">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
            <input
              type="text"
              placeholder="Search courses..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
            />
          </div>
          <button
            onClick={() => setShowExternalForm(true)}
            className="flex items-center gap-2 px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors whitespace-nowrap"
          >
            <ExternalLink size={20} />
            Add External Course
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-6">
          {loading ? (
            <div className="space-y-4">
              {[1, 2, 3].map(i => (
                <div key={i} className="animate-pulse bg-gray-100 rounded-lg h-32" />
              ))}
            </div>
          ) : filteredCourses.length === 0 ? (
            <div className="text-center py-12">
              <BookOpen size={48} className="mx-auto text-gray-400 mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">No courses found</h3>
              <p className="text-gray-600 mb-4">
                {searchTerm ? 'Try a different search term' : 'No courses available yet'}
              </p>
              <button
                onClick={() => setShowExternalForm(true)}
                className="inline-flex items-center gap-2 px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700"
              >
                <ExternalLink size={20} />
                Add External Course
              </button>
            </div>
          ) : (
            <div className="space-y-6">
              {/* Enrolled Courses Section - Horizontal Carousel */}
              {enrolledCourses.length > 0 && (
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-3 flex items-center gap-2">
                    <BookOpen size={20} className="text-green-600" />
                    Enrolled Courses ({enrolledCourses.length})
                  </h3>
                  <div className="flex gap-4 overflow-x-auto pb-4 scrollbar-thin scrollbar-thumb-gray-300 scrollbar-track-gray-100" style={{ scrollbarWidth: 'thin' }}>
                    {enrolledCourses.map((course) => (
                      <div
                        key={course.course_id}
                        className="flex-shrink-0 w-72 border-2 border-green-200 bg-green-50 rounded-lg p-4 transition-all hover:shadow-md"
                      >
                        <div className="flex justify-between items-start mb-2">
                          <h3 className="font-semibold text-gray-900 text-base line-clamp-2">{course.title}</h3>
                          <div className="flex flex-col gap-1 items-end ml-2 flex-shrink-0">
                            {course.code && (
                              <span className="text-xs bg-indigo-100 text-indigo-700 px-2 py-1 rounded">
                                {course.code}
                              </span>
                            )}
                            <span className="text-xs bg-green-600 text-white px-2 py-1 rounded font-medium">
                              Enrolled
                            </span>
                          </div>
                        </div>
                        
                        {course.educator_name && (
                          <p className="text-sm text-gray-600 mb-2">By {course.educator_name}</p>
                        )}
                        
                        {course.description && (
                          <p className="text-sm text-gray-700 mb-3 line-clamp-2">{course.description}</p>
                        )}
                        
                        <div className="flex flex-wrap gap-2 mb-3">
                          {course.duration && (
                            <span className="text-xs bg-white text-gray-700 px-2 py-1 rounded border border-gray-200">
                              {course.duration}
                            </span>
                          )}
                          {course.category && (
                            <span className="text-xs bg-blue-100 text-blue-700 px-2 py-1 rounded">
                              {course.category}
                            </span>
                          )}
                        </div>

                        {/* Progress Bar */}
                        <LearningProgressBar
                          variant="card"
                          progress={
                            enrollmentProgress[course.course_id]?.status === 'completed'
                              ? 100
                              : enrollmentProgress[course.course_id]?.totalModules > 0
                                ? Math.round(
                                    (enrollmentProgress[course.course_id]?.completedModules || 0) /
                                    enrollmentProgress[course.course_id]?.totalModules * 100
                                  )
                                : 0
                          }
                          completedModules={enrollmentProgress[course.course_id]?.completedModules || 0}
                          totalModules={enrollmentProgress[course.course_id]?.totalModules || 0}
                        />
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Available Courses Section - Hidden */}
              {/* {availableCourses.length > 0 && (
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-3 flex items-center gap-2">
                    <BookOpen size={20} className="text-indigo-600" />
                    Available Courses ({availableCourses.length})
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {availableCourses.map((course) => (
                      <div
                        key={course.course_id}
                        className="border border-gray-200 rounded-lg p-4 hover:border-indigo-400 hover:shadow-md transition-all"
                      >
                        <div className="flex justify-between items-start mb-2">
                          <h3 className="font-semibold text-gray-900 text-lg">{course.title}</h3>
                          {course.code && (
                            <span className="text-xs bg-indigo-100 text-indigo-700 px-2 py-1 rounded ml-2">
                              {course.code}
                            </span>
                          )}
                        </div>
                        
                        {course.educator_name && (
                          <p className="text-sm text-gray-600 mb-2">By {course.educator_name}</p>
                        )}
                        
                        {course.description && (
                          <p className="text-sm text-gray-700 mb-3 line-clamp-2">{course.description}</p>
                        )}
                        
                        <div className="flex flex-wrap gap-2 mb-3">
                          {course.duration && (
                            <span className="text-xs bg-gray-100 text-gray-700 px-2 py-1 rounded">
                              {course.duration}
                            </span>
                          )}
                          {course.category && (
                            <span className="text-xs bg-blue-100 text-blue-700 px-2 py-1 rounded">
                              {course.category}
                            </span>
                          )}
                        </div>
                        
                        <button
                          onClick={() => handleSelectCourse(course)}
                          className="w-full py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 transition-colors text-sm font-medium"
                        >
                          Enroll in Course
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              )} */}

              {/* No courses message */}
              {enrolledCourses.length === 0 && availableCourses.length === 0 && (
                <div className="text-center py-12">
                  <BookOpen size={48} className="mx-auto text-gray-400 mb-4" />
                  <h3 className="text-lg font-medium text-gray-900 mb-2">No courses found</h3>
                  <p className="text-gray-600 mb-4">
                    {searchTerm ? 'Try a different search term' : 'No courses available yet'}
                  </p>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
