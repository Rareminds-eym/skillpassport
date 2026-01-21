import React, { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from '../../../components/Students/components/ui/card';
import { Button } from '../../../components/Students/components/ui/button';
import { Badge } from '../../../components/Students/components/ui/badge';
import {
  Search,
  BookOpen,
  Clock,
  Users,
  Grid3x3,
  List,
  ChevronLeft,
  ChevronRight,
  ArrowDownAZ,
} from 'lucide-react';
import { supabase } from '../../../lib/supabaseClient';
import { motion } from 'framer-motion';
import CourseDetailModal from '../../../components/student/courses/CourseDetailModal';

const BrowseCourses = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [courses, setCourses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [viewMode, setViewMode] = useState('grid'); // 'grid' or 'list'
  const [filterStatus, setFilterStatus] = useState('all'); // 'all', 'Active', 'Upcoming'
  const [sortBy, setSortBy] = useState('created_at'); // 'created_at', 'title', 'enrollment_count'
  const [selectedCourse, setSelectedCourse] = useState(null);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const coursesPerPage = 6;
  // Handle start course - navigate to course player
  const handleStartCourse = (course) => {
    setShowDetailModal(false);
    navigate(`/school-admin/courses/${course.course_id}/learn`);
  };

  // Read search parameter from URL
  useEffect(() => {
    const searchParam = searchParams.get('search');
    if (searchParam) {
      setSearchTerm(searchParam);
    }
  }, [searchParams]);

  // Fetch courses from Supabase
  useEffect(() => {
    fetchCourses();
  }, []);

  const fetchCourses = async () => {
    const startTime = Date.now();

    try {
      setLoading(true);

      // Fetch courses with status Active or Upcoming (students shouldn't see Drafts)
      // Also exclude deleted courses
      const query = supabase
        .from('courses')
        .select('*')
        .in('status', ['Active', 'Upcoming'])
        .is('deleted_at', null)
        .order('created_at', { ascending: false });

      const { data, error } = await query;

      if (error) throw error;

      console.log('📚 Fetched courses for students:', data?.length || 0);
      setCourses(data || []);

      // Ensure loader displays for at least 1 second
      const elapsedTime = Date.now() - startTime;
      const remainingTime = Math.max(0, 1000 - elapsedTime);

      if (remainingTime > 0) {
        await new Promise((resolve) => setTimeout(resolve, remainingTime));
      }
    } catch (error) {
      console.error('Error fetching courses:', error);
      // Still wait for 1 second even on error
      const elapsedTime = Date.now() - startTime;
      const remainingTime = Math.max(0, 1000 - elapsedTime);
      if (remainingTime > 0) {
        await new Promise((resolve) => setTimeout(resolve, remainingTime));
      }
    } finally {
      setLoading(false);
    }
  };

  // Check if a course is new (posted within last 24 hours)
  const isNewCourse = (createdAt) => {
    if (!createdAt) return false;
    const courseDate = new Date(createdAt);
    const now = new Date();
    const hoursDifference = (now - courseDate) / (1000 * 60 * 60);
    return hoursDifference <= 24;
  };

  // Reset to page 1 when search or filter changes
  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm, filterStatus, sortBy]);

  // Filter and search courses
  const filteredCourses = React.useMemo(() => {
    const filtered = courses.filter((course) => {
      const matchesSearch =
        course.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        course.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
        course.code.toLowerCase().includes(searchTerm.toLowerCase());

      const matchesStatus = filterStatus === 'all' || course.status === filterStatus;

      return matchesSearch && matchesStatus;
    });

    // Apply sorting
    filtered.sort((a, b) => {
      switch (sortBy) {
        case 'title':
          return a.title.localeCompare(b.title);
        case 'created_at':
          return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
        case 'enrollment_count':
          return (b.enrollment_count || 0) - (a.enrollment_count || 0);
        default:
          return 0;
      }
    });

    return filtered;
  }, [courses, searchTerm, filterStatus, sortBy]);

  // Pagination logic
  const totalPages = Math.ceil(filteredCourses.length / coursesPerPage);
  const indexOfLastCourse = currentPage * coursesPerPage;
  const indexOfFirstCourse = indexOfLastCourse - coursesPerPage;
  const currentCourses = filteredCourses.slice(indexOfFirstCourse, indexOfLastCourse);

  // Generate page numbers for pagination
  const getPageNumbers = () => {
    const pages = [];

    if (totalPages <= 5) {
      // Show all pages if 5 or fewer
      for (let i = 1; i <= totalPages; i++) {
        pages.push(i);
      }
    } else {
      // Always show first 3 pages
      pages.push(1, 2, 3);

      // Add ellipsis and last page if there are more pages
      if (totalPages > 3) {
        if (currentPage > 4) {
          pages.push('...');
        }

        // Show current page if it's beyond page 3 and not the last page
        if (currentPage > 3 && currentPage < totalPages) {
          pages.push(currentPage);
        }

        // Add ellipsis before last page if needed
        if (currentPage < totalPages - 1) {
          pages.push('...');
        }

        // Always show last page
        pages.push(totalPages);
      }
    }

    return pages;
  };

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

  return (
    <>
      {/* Course Detail Modal */}
      <CourseDetailModal
        course={selectedCourse}
        isOpen={showDetailModal}
        onClose={() => setShowDetailModal(false)}
        onStartCourse={handleStartCourse}
      />
      <div className="min-h-screen bg-gray-50 p-4 sm:p-6 lg:p-8">
        <div className="max-w-7xl mx-auto">
          {/* Loading State */}
          {loading && (
            <div className="flex flex-col items-center justify-center min-h-[80vh]">
              <motion.div
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.5 }}
                className="text-center"
              >
                <div className="relative">
                  <div className="inline-block animate-spin rounded-full h-16 w-16 border-4 border-indigo-200 border-t-indigo-600"></div>
                  <img
                    src="/assets/HomePage/RMLogo.webp"
                    alt="RareMinds Logo"
                    className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-8 h-8 object-contain"
                  />
                </div>
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.3 }}
                  className="mt-6"
                >
                  <p className="text-xl font-semibold text-gray-800 mb-2">Loading Courses...</p>
                  <p className="text-sm text-gray-500 flex items-center justify-center gap-2">
                    Powered by <span className="font-semibold text-indigo-600">RareMinds</span>
                  </p>
                </motion.div>
              </motion.div>
            </div>
          )}

          {/* Header */}
          {!loading && (
            <div className="mb-8">
              <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                <div className="flex items-start gap-3">
                  <div className="p-2 rounded-lg bg-indigo-600">
                    <BookOpen className="w-6 h-6 text-white" />
                  </div>
                  <div className="flex-1">
                    <h1 className="font-bold text-2xl text-indigo-600">Browse Courses</h1>
                    <p className="text-sm text-gray-600 mt-1">
                      Explore our course library and access courses for your school
                    </p>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Courses Tab Content */}
          {/* Search and Filters */}
          {!loading && (
            <div className="mb-6 flex flex-col lg:flex-row items-center gap-4">
              {/* Search Bar */}
              <div className="flex-1 w-full relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-5 h-5 pointer-events-none" />
                <input
                  type="text"
                  placeholder="Search courses by title, code, or description..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full h-12 pl-10 pr-4 bg-white border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 shadow-sm"
                />
              </div>

              {/* Filters */}
              <div className="flex gap-2 items-center w-full lg:w-auto flex-wrap">
                {/* Status Filter */}
                <select
                  value={filterStatus}
                  onChange={(e) => setFilterStatus(e.target.value)}
                  className="h-12 px-4 bg-white border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 shadow-sm flex-1 lg:flex-none lg:min-w-[150px]"
                >
                  <option value="all">All Status</option>
                  <option value="Active">Active</option>
                  <option value="Upcoming">Upcoming</option>
                </select>

                {/* Sort By Filter */}
                <div className="relative flex-1 lg:flex-none lg:min-w-[150px]">
                  <ArrowDownAZ className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-5 h-5 pointer-events-none" />
                  <select
                    value={sortBy}
                    onChange={(e) => setSortBy(e.target.value)}
                    className="h-12 pl-10 pr-4 w-full bg-white border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 shadow-sm"
                  >
                    <option value="created_at">Newest First</option>
                    <option value="title">Name (A-Z)</option>
                    <option value="enrollment_count">Most Popular</option>
                  </select>
                </div>

                {/* View Mode Toggle */}
                <div className="flex border border-gray-300 rounded-lg overflow-hidden h-12 bg-white shadow-sm">
                  <button
                    onClick={() => setViewMode('grid')}
                    className={`px-4 flex items-center justify-center ${viewMode === 'grid' ? 'bg-indigo-600 text-white' : 'bg-white text-gray-600 hover:bg-gray-50'}`}
                  >
                    <Grid3x3 className="w-5 h-5" />
                  </button>
                  <button
                    onClick={() => setViewMode('list')}
                    className={`px-4 flex items-center justify-center ${viewMode === 'list' ? 'bg-indigo-600 text-white' : 'bg-white text-gray-600 hover:bg-gray-50'}`}
                  >
                    <List className="w-5 h-5" />
                  </button>
                </div>

                {/* Clear Filters Button */}
                {(filterStatus !== 'all' || searchTerm !== '' || sortBy !== 'created_at') && (
                  <button
                    onClick={() => {
                      setFilterStatus('all');
                      setSearchTerm('');
                      setSortBy('created_at');
                    }}
                    className="h-12 px-4 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors whitespace-nowrap"
                  >
                    Clear Filters
                  </button>
                )}
              </div>
            </div>
          )}

          {/* Empty State */}
          {!loading && filteredCourses.length === 0 && (
            <Card className="text-center py-12 shadow-sm border border-gray-200">
              <CardContent>
                <BookOpen className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                <h3 className="text-xl font-semibold text-gray-900 mb-2">No courses found</h3>
                <p className="text-gray-600">
                  {searchTerm
                    ? 'Try adjusting your search terms'
                    : 'No courses available at the moment'}
                </p>
              </CardContent>
            </Card>
          )}

          {/* Courses Grid View */}
          {!loading && viewMode === 'grid' && currentCourses.length > 0 && (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {currentCourses.map((course) => (
                <motion.div
                  key={course.course_id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.3 }}
                  whileHover={{ y: -8, transition: { duration: 0.2 } }}
                  onClick={() => handleCourseClick(course)}
                  className="cursor-pointer"
                >
                  <Card className="h-full hover:shadow-lg transition-all duration-200 border border-gray-200 overflow-hidden group flex flex-col">
                    {/* Course Thumbnail - Always show with default placeholder */}
                    <div className="h-40 overflow-hidden bg-gradient-to-br from-indigo-500 to-purple-600 relative flex-shrink-0">
                      {course.thumbnail &&
                      (course.thumbnail.startsWith('http') ||
                        course.thumbnail.startsWith('data:')) ? (
                        <motion.img
                          src={course.thumbnail}
                          alt={course.title}
                          className="w-full h-full object-cover"
                          whileHover={{ scale: 1.05 }}
                          transition={{ duration: 0.3 }}
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-indigo-400 to-purple-500">
                          <BookOpen className="h-16 w-16 text-white opacity-90" />
                        </div>
                      )}
                      {/* NEW Badge */}
                      {isNewCourse(course.created_at) && (
                        <motion.div
                          initial={{ scale: 0 }}
                          animate={{ scale: 1 }}
                          className="absolute top-2 left-2"
                        >
                          <Badge className="bg-gradient-to-r from-pink-500 to-rose-500 text-white border-0 shadow-lg font-semibold px-3 py-1">
                            NEW
                          </Badge>
                        </motion.div>
                      )}
                    </div>

                    <CardHeader className="pb-3">
                      <div className="flex items-start justify-between mb-2">
                        <div className="flex gap-2 flex-wrap">
                          <Badge className={`${getStatusColor(course.status)} border`}>
                            {course.status}
                          </Badge>
                        </div>
                        <span className="text-xs font-medium text-gray-500">{course.code}</span>
                      </div>
                      <CardTitle className="text-lg line-clamp-2">{course.title}</CardTitle>
                    </CardHeader>

                    <CardContent className="space-y-4 flex-grow flex flex-col">
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
                        <div className="flex items-center gap-2 pt-2 border-t border-gray-100 mt-auto">
                          <div className="w-8 h-8 rounded-full bg-gradient-to-r from-indigo-500 to-purple-500 flex items-center justify-center text-white font-semibold text-sm">
                            {course.educator_name.charAt(0).toUpperCase()}
                          </div>
                          <div>
                            <p className="text-xs text-gray-500">Instructor</p>
                            <p className="text-sm font-medium text-gray-900">
                              {course.educator_name}
                            </p>
                          </div>
                        </div>
                      )}
                    </CardContent>
                  </Card>
                </motion.div>
              ))}
            </div>
          )}

          {/* Courses List View */}
          {!loading && viewMode === 'list' && currentCourses.length > 0 && (
            <div className="space-y-4">
              {currentCourses.map((course) => (
                <motion.div
                  key={course.course_id}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ duration: 0.3 }}
                  onClick={() => handleCourseClick(course)}
                  className="cursor-pointer"
                >
                  <Card className="hover:shadow-lg transition-all duration-200 border-0">
                    <CardContent className="p-6">
                      <div className="flex flex-col lg:flex-row gap-6">
                        {/* Thumbnail - Always show with default placeholder */}
                        <div className="w-full lg:w-48 h-32 flex-shrink-0 rounded-lg overflow-hidden bg-gradient-to-br from-indigo-500 to-purple-600 relative">
                          {course.thumbnail &&
                          (course.thumbnail.startsWith('http') ||
                            course.thumbnail.startsWith('data:')) ? (
                            <img
                              src={course.thumbnail}
                              alt={course.title}
                              className="w-full h-full object-cover"
                            />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-indigo-400 to-purple-500">
                              <BookOpen className="h-12 w-12 text-white opacity-90" />
                            </div>
                          )}
                          {/* NEW Badge */}
                          {isNewCourse(course.created_at) && (
                            <div className="absolute top-2 left-2">
                              <Badge className="bg-gradient-to-r from-pink-500 to-rose-500 text-white border-0 shadow-lg font-semibold px-3 py-1">
                                NEW
                              </Badge>
                            </div>
                          )}
                        </div>

                        {/* Course Info */}
                        <div className="flex-1">
                          <div className="flex items-start justify-between mb-2">
                            <div>
                              <div className="flex items-center gap-3 mb-2 flex-wrap">
                                <h3 className="text-xl font-bold text-gray-900">{course.title}</h3>
                                <Badge className={`${getStatusColor(course.status)} border`}>
                                  {course.status}
                                </Badge>
                              </div>
                              <p className="text-sm text-gray-500">Course Code: {course.code}</p>
                            </div>
                          </div>

                          <p className="text-gray-600 mb-4 line-clamp-2">{course.description}</p>

                          <div className="flex items-center gap-6 text-sm text-gray-600">
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
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </motion.div>
              ))}
            </div>
          )}

          {/* Pagination */}
          {!loading && filteredCourses.length > 0 && totalPages > 1 && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3 }}
              className="mt-8 flex justify-center items-center gap-2"
            >
              {/* Previous Button */}
              <Button
                onClick={() => setCurrentPage((prev) => Math.max(prev - 1, 1))}
                disabled={currentPage === 1}
                className={`px-3 py-2 ${
                  currentPage === 1
                    ? 'bg-gray-200 text-gray-400 cursor-not-allowed'
                    : 'bg-white text-indigo-600 hover:bg-indigo-50 border border-indigo-200'
                }`}
              >
                <ChevronLeft className="w-5 h-5" />
              </Button>

              {/* Page Numbers */}
              <div className="flex gap-2">
                {getPageNumbers().map((pageNum, index) => (
                  <React.Fragment key={index}>
                    {pageNum === '...' ? (
                      <span className="px-3 py-2 text-gray-500">...</span>
                    ) : (
                      <Button
                        onClick={() => setCurrentPage(pageNum)}
                        className={`px-4 py-2 min-w-[40px] ${
                          currentPage === pageNum
                            ? 'bg-indigo-600 text-white hover:bg-indigo-700'
                            : 'bg-white text-gray-700 hover:bg-gray-50 border border-gray-300'
                        }`}
                      >
                        {pageNum}
                      </Button>
                    )}
                  </React.Fragment>
                ))}
              </div>

              {/* Next Button */}
              <Button
                onClick={() => setCurrentPage((prev) => Math.min(prev + 1, totalPages))}
                disabled={currentPage === totalPages}
                className={`px-3 py-2 ${
                  currentPage === totalPages
                    ? 'bg-gray-200 text-gray-400 cursor-not-allowed'
                    : 'bg-white text-indigo-600 hover:bg-indigo-50 border border-indigo-200'
                }`}
              >
                <ChevronRight className="w-5 h-5" />
              </Button>

              {/* Page Info */}
              <span className="ml-4 text-sm text-gray-600">
                Page {currentPage} of {totalPages}
              </span>
            </motion.div>
          )}
        </div>
      </div>
    </>
  );
};

export default BrowseCourses;
