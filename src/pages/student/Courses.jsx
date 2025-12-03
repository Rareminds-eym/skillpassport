import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '../../components/Students/components/ui/card';
import { Button } from '../../components/Students/components/ui/button';
import { Badge } from '../../components/Students/components/ui/badge';
import {
  Search,
  BookOpen,
  Clock,
  Users,
  Star,
  Filter,
  Grid3x3,
  List,
  Play
} from 'lucide-react';
import { supabase } from '../../lib/supabaseClient';
import { motion } from 'framer-motion';
import CourseDetailModal from '../../components/student/courses/CourseDetailModal';

const Courses = () => {
  const navigate = useNavigate();
  const [courses, setCourses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [viewMode, setViewMode] = useState('grid'); // 'grid' or 'list'
  const [filterStatus, setFilterStatus] = useState('all'); // 'all', 'Active', 'Upcoming'
  const [selectedCourse, setSelectedCourse] = useState(null);
  const [showDetailModal, setShowDetailModal] = useState(false);

  // Fetch courses from Supabase
  useEffect(() => {
    fetchCourses();
  }, []);

  const fetchCourses = async () => {
    try {
      setLoading(true);

      // Fetch courses with status Active or Upcoming (students shouldn't see Drafts)
      // Also exclude deleted courses
      let query = supabase
        .from('courses')
        .select('*')
        .in('status', ['Active', 'Upcoming'])
        .is('deleted_at', null)
        .order('created_at', { ascending: false });

      const { data, error } = await query;

      if (error) throw error;

      console.log('📚 Fetched courses for students:', data?.length || 0);
      setCourses(data || []);
    } catch (error) {
      console.error('Error fetching courses:', error);
    } finally {
      setLoading(false);
    }
  };

  // Filter and search courses
  const filteredCourses = courses.filter(course => {
    const matchesSearch = course.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         course.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         course.code.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesStatus = filterStatus === 'all' || course.status === filterStatus;

    return matchesSearch && matchesStatus;
  });

  // Get status badge color
  const getStatusColor = (status) => {
    switch (status) {
      case 'Active':
        return 'bg-emerald-100 text-emerald-700 border-emerald-200';
      case 'Upcoming':
        return 'bg-blue-100 text-blue-700 border-blue-200';
      default:
        return 'bg-gray-100 text-gray-700 border-gray-200';
    }
  };

  // Handle course card click - show detail modal
  const handleCourseClick = (course) => {
    setSelectedCourse(course);
    setShowDetailModal(true);
  };

  // Handle start course - navigate to course player
  const handleStartCourse = (course) => {
    setShowDetailModal(false);
    navigate(`/student/courses/${course.course_id}/learn`);
  };

  return (
    <>
      {/* Course Detail Modal */}
      <CourseDetailModal
        course={selectedCourse}
        isOpen={showDetailModal}
        onClose={() => setShowDetailModal(false)}
        onStartCourse={handleStartCourse}
      />
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 p-4 sm:p-6 lg:p-8">
        <div className="max-w-7xl mx-auto">
          {/* Header */}
          <div className="mb-8">
            <h1 className="text-3xl sm:text-4xl font-bold text-gray-900 mb-2">
              📚 My Courses
            </h1>
            <p className="text-gray-600">
              Explore and enroll in courses to enhance your skills
            </p>
          </div>

        {/* Search and Filters */}
        <Card className="mb-6 shadow-lg border-0">
          <CardContent className="p-6">
            <div className="flex flex-col lg:flex-row gap-4">
              {/* Search Bar */}
              <div className="flex-1 relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                <input
                  type="text"
                  placeholder="Search courses by title, code, or description..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-10 pr-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                />
              </div>

              {/* Filters */}
              <div className="flex gap-2">
                <select
                  value={filterStatus}
                  onChange={(e) => setFilterStatus(e.target.value)}
                  className="px-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-white"
                >
                  <option value="all">All Courses</option>
                  <option value="Active">Active</option>
                  <option value="Upcoming">Upcoming</option>
                </select>

                {/* View Mode Toggle */}
                <div className="flex border border-gray-300 rounded-lg overflow-hidden">
                  <button
                    onClick={() => setViewMode('grid')}
                    className={`p-2.5 ${viewMode === 'grid' ? 'bg-indigo-600 text-white' : 'bg-white text-gray-600 hover:bg-gray-50'}`}
                  >
                    <Grid3x3 className="w-5 h-5" />
                  </button>
                  <button
                    onClick={() => setViewMode('list')}
                    className={`p-2.5 ${viewMode === 'list' ? 'bg-indigo-600 text-white' : 'bg-white text-gray-600 hover:bg-gray-50'}`}
                  >
                    <List className="w-5 h-5" />
                  </button>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Loading State */}
        {loading && (
          <div className="text-center py-12">
            <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
            <p className="mt-4 text-gray-600">Loading courses...</p>
          </div>
        )}

        {/* Empty State */}
        {!loading && filteredCourses.length === 0 && (
          <Card className="text-center py-12 shadow-lg border-0">
            <CardContent>
              <BookOpen className="w-16 h-16 text-gray-400 mx-auto mb-4" />
              <h3 className="text-xl font-semibold text-gray-900 mb-2">No courses found</h3>
              <p className="text-gray-600">
                {searchTerm ? 'Try adjusting your search terms' : 'No courses available at the moment'}
              </p>
            </CardContent>
          </Card>
        )}

        {/* Courses Grid View */}
        {!loading && viewMode === 'grid' && filteredCourses.length > 0 && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredCourses.map((course) => (
              <motion.div
                key={course.course_id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3 }}
                whileHover={{ y: -8, transition: { duration: 0.2 } }}
              >
                <Card className="h-full hover:shadow-xl transition-all duration-200 border-0 overflow-hidden group">
                  {/* Course Thumbnail */}
                  {course.thumbnail && (
                    <div className="h-40 overflow-hidden bg-gradient-to-br from-indigo-500 to-purple-600">
                      {(course.thumbnail.startsWith('http') || course.thumbnail.startsWith('data:')) ? (
                        <motion.img
                          src={course.thumbnail}
                          alt={course.title}
                          className="w-full h-full object-cover"
                          whileHover={{ scale: 1.05 }}
                          transition={{ duration: 0.3 }}
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center">
                          <BookOpen className="h-16 w-16 text-white opacity-90" />
                        </div>
                      )}
                    </div>
                  )}

                  <CardHeader className="pb-3">
                    <div className="flex items-start justify-between mb-2">
                      <Badge className={`${getStatusColor(course.status)} border`}>
                        {course.status}
                      </Badge>
                      <span className="text-xs font-medium text-gray-500">{course.code}</span>
                    </div>
                    <CardTitle className="text-lg line-clamp-2">{course.title}</CardTitle>
                  </CardHeader>

                  <CardContent className="space-y-4">
                    <p className="text-sm text-gray-600 line-clamp-3">{course.description}</p>

                    <div className="flex items-center gap-4 text-sm text-gray-600">
                      <div className="flex items-center gap-1">
                        <Clock className="w-4 h-4" />
                        <span>{course.duration}</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <Users className="w-4 h-4" />
                        <span>{course.enrollment_count || 0}</span>
                      </div>
                    </div>

                    {/* Educator Info */}
                    {course.educator_name && (
                      <div className="flex items-center gap-2 pt-2 border-t border-gray-100">
                        <div className="w-8 h-8 rounded-full bg-gradient-to-r from-indigo-500 to-purple-500 flex items-center justify-center text-white font-semibold text-sm">
                          {course.educator_name.charAt(0).toUpperCase()}
                        </div>
                        <div>
                          <p className="text-xs text-gray-500">Instructor</p>
                          <p className="text-sm font-medium text-gray-900">{course.educator_name}</p>
                        </div>
                      </div>
                    )}

                    <Button
                      onClick={() => handleCourseClick(course)}
                      className="w-full bg-indigo-600 hover:bg-indigo-700 text-white"
                    >
                      View Course Details
                    </Button>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </div>
        )}

        {/* Courses List View */}
        {!loading && viewMode === 'list' && filteredCourses.length > 0 && (
          <div className="space-y-4">
            {filteredCourses.map((course) => (
              <motion.div
                key={course.course_id}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.3 }}
              >
                <Card className="hover:shadow-lg transition-all duration-200 border-0">
                  <CardContent className="p-6">
                    <div className="flex flex-col lg:flex-row gap-6">
                      {/* Thumbnail */}
                      {course.thumbnail && (
                        <div className="w-full lg:w-48 h-32 flex-shrink-0 rounded-lg overflow-hidden bg-gradient-to-br from-indigo-500 to-purple-600">
                          {(course.thumbnail.startsWith('http') || course.thumbnail.startsWith('data:')) ? (
                            <img
                              src={course.thumbnail}
                              alt={course.title}
                              className="w-full h-full object-cover"
                            />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center">
                              <BookOpen className="h-12 w-12 text-white opacity-90" />
                            </div>
                          )}
                        </div>
                      )}

                      {/* Course Info */}
                      <div className="flex-1">
                        <div className="flex items-start justify-between mb-2">
                          <div>
                            <div className="flex items-center gap-3 mb-2">
                              <h3 className="text-xl font-bold text-gray-900">{course.title}</h3>
                              <Badge className={`${getStatusColor(course.status)} border`}>
                                {course.status}
                              </Badge>
                            </div>
                            <p className="text-sm text-gray-500">Course Code: {course.code}</p>
                          </div>
                        </div>

                        <p className="text-gray-600 mb-4 line-clamp-2">{course.description}</p>

                        <div className="flex items-center gap-6 text-sm text-gray-600 mb-4">
                          <div className="flex items-center gap-2">
                            <Clock className="w-4 h-4" />
                            <span>{course.duration}</span>
                          </div>
                          <div className="flex items-center gap-2">
                            <Users className="w-4 h-4" />
                            <span>{course.enrollment_count || 0} students</span>
                          </div>
                          {course.educator_name && (
                            <div className="flex items-center gap-2">
                              <div className="w-6 h-6 rounded-full bg-gradient-to-r from-indigo-500 to-purple-500 flex items-center justify-center text-white text-xs font-semibold">
                                {course.educator_name.charAt(0).toUpperCase()}
                              </div>
                              <span>{course.educator_name}</span>
                            </div>
                          )}
                        </div>

                        <Button
                          onClick={() => handleCourseClick(course)}
                          className="bg-indigo-600 hover:bg-indigo-700 text-white"
                        >
                          View Course Details
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </div>
        )}
        </div>
      </div>
    </>
  );
};

export default Courses;
