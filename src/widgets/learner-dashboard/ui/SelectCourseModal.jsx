import { useState, useEffect } from 'react';
import { apiPost } from '@/shared/api/apiClient';
import { X, BookOpen, ExternalLink, Search } from 'lucide-react';
import AddLearningCourseModal from './AddLearningCourseModal';
import LearningProgressBar from './LearningProgressBar';
import { SearchBar, DemoModal } from '@/shared/ui';

export default function SelectCourseModal({ isOpen, onClose, learnerId, onSuccess }) {
  const [courses, setCourses] = useState([]);
  const [enrolledCourseIds, setEnrolledCourseIds] = useState([]);
  const [enrollmentProgress, setEnrollmentProgress] = useState({});
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [showExternalForm, setShowExternalForm] = useState(false);
  const [showDemoModal, setShowDemoModal] = useState(false);

  useEffect(() => {
    if (isOpen && learnerId) {
      fetchAvailableCourses();
    }
  }, [isOpen, learnerId]);

  const fetchAvailableCourses = async () => {
    try {
      setLoading(true);
      const data = await apiPost('/learner-dashboard-widgets/actions', {
        action: 'get-select-course-data',
        learnerId,
      });
      setCourses(data.courses || []);
      setEnrolledCourseIds(data.enrolledCourseIds || []);
      setEnrollmentProgress(data.enrollmentProgress || {});
    } catch (error) {
      console.error('Error fetching courses:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSelectCourse = async (course) => {
    try {
      await apiPost('/learner-dashboard-widgets/actions', {
        action: 'enroll-course',
        learnerId,
        courseId: course.course_id,
        courseTitle: course.title,
        description: course.description,
        duration: course.duration,
        university: course.university,
      });

      onSuccess?.();
      onClose();
    } catch (error) {
      console.error('Error enrolling:', error);
      alert('Failed to enroll. Please try again.');
    }
  };

  // Use debounced search for filtering
  const filteredCourses = courses.filter(course =>
    course.title.toLowerCase().includes(debouncedSearch.toLowerCase()) ||
    course.code?.toLowerCase().includes(debouncedSearch.toLowerCase()) ||
    course.description?.toLowerCase().includes(debouncedSearch.toLowerCase())
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
        learnerId={learnerId}
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
          <div className="flex-1">
            <SearchBar
              value={searchTerm}
              onChange={setSearchTerm}
              onDebouncedChange={setDebouncedSearch}
              debounceMs={300}
              placeholder="Search courses..."
              size="md"
            />
          </div>
          <button
            // onClick={() => setShowExternalForm(true)}
            onClick={() => setShowDemoModal(true)}
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
              // onClick={() => setShowExternalForm(true)}
                onClick={() => setShowDemoModal(true)}
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

      <DemoModal 
        isOpen={showDemoModal} 
        onClose={() => setShowDemoModal(false)}
        title="Coming Soon"
        subtitle="New Feature"
        message="The Import External Certificate feature is coming soon! This feature will allow you to import and showcase certificates from platforms like Coursera, Udemy, LinkedIn Learning, edX, and more to your learning profile."
      />
    </div>
  );
}
