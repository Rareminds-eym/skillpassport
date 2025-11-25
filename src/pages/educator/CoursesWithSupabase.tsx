/**
 * COURSES PAGE WITH SUPABASE INTEGRATION
 *
 * This file shows how to integrate the Courses page with Supabase.
 * To use this version:
 * 1. Run the migration (see COURSES_SETUP.md)
 * 2. Rename this file to Courses.tsx (backup the original first)
 * 3. Ensure your Supabase client is properly configured
 */

import React, { useState, useMemo, useEffect } from 'react';
import {
  PlusIcon,
  BookOpenIcon,
  UsersIcon,
  CheckCircleIcon,
  ClockIcon,
  AcademicCapIcon,
  ArrowPathIcon
} from '@heroicons/react/24/outline';
import { Course } from '../../types/educator/course';
import { SKILL_CATEGORIES, CLASSES } from '../../data/educator/mockCourses';
import CourseCard from '../../components/educator/courses/CourseCard';
import CourseFilters from '../../components/educator/courses/CourseFilters';
import CreateCourseModal from '../../components/educator/courses/CreateCourseModal';
import CourseDetailDrawer from '../../components/educator/courses/CourseDetailDrawer';
import { supabase } from '../../lib/supabaseClient';
import {
  getCoursesByEducator,
  createCourse,
  updateCourse,
  deleteCourse
} from '../../services/educator/coursesService';

const CoursesWithSupabase: React.FC = () => {
  // State
  const [courses, setCourses] = useState<Course[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [activeTabFilter, setActiveTabFilter] = useState('All Courses');
  const [statusFilter, setStatusFilter] = useState('All');
  const [skillFilter, setSkillFilter] = useState('All');
  const [classFilter, setClassFilter] = useState('All');
  const [sortBy, setSortBy] = useState('name');
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showDetailDrawer, setShowDetailDrawer] = useState(false);
  const [selectedCourse, setSelectedCourse] = useState<Course | null>(null);
  const [editingCourse, setEditingCourse] = useState<Course | null>(null);
  const [currentEducatorId, setCurrentEducatorId] = useState<string | null>(null);
  const [currentEducatorName, setCurrentEducatorName] = useState<string>('');

  // Tab filters
  const tabFilters = ['All Courses', 'Active', 'Upcoming', 'Archived'];

  // Fetch courses on mount
  useEffect(() => {
    fetchCourses();
  }, []);

  const fetchCourses = async () => {
    try {
      setLoading(true);
      setError(null);

      // Get current user
      const { data: { user }, error: authError } = await supabase.auth.getUser();

      if (authError || !user) {
        // Development mode fallback
        const devEducatorId = localStorage.getItem('dev_educator_id');
        if (devEducatorId) {
          setCurrentEducatorId(devEducatorId);
          setCurrentEducatorName('Dev Educator');
          const coursesData = await getCoursesByEducator(devEducatorId);
          setCourses(coursesData);
        } else {
          // Generate dev ID
          const newDevId = crypto.randomUUID();
          localStorage.setItem('dev_educator_id', newDevId);
          setCurrentEducatorId(newDevId);
          setCurrentEducatorName('Dev Educator');
          setCourses([]);
        }
      } else {
        setCurrentEducatorId(user.id);
        setCurrentEducatorName(user.email || 'Educator');
        const coursesData = await getCoursesByEducator(user.id);
        setCourses(coursesData);
      }
    } catch (err) {
      console.error('Error fetching courses:', err);
      setError('Failed to load courses. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  // Filtered and sorted courses
  const filteredCourses = useMemo(() => {
    const filtered = courses.filter(course => {
      const matchesSearch =
        course.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        course.code.toLowerCase().includes(searchQuery.toLowerCase()) ||
        course.skillsCovered.some(skill =>
          skill.toLowerCase().includes(searchQuery.toLowerCase())
        );

      const matchesTab =
        activeTabFilter === 'All Courses' || course.status === activeTabFilter;

      const matchesStatus = statusFilter === 'All' || course.status === statusFilter;

      const matchesSkill =
        skillFilter === 'All' || course.skillsCovered.includes(skillFilter);

      const matchesClass =
        classFilter === 'All' || course.linkedClasses.some(c => c === classFilter);

      return matchesSearch && matchesTab && matchesStatus && matchesSkill && matchesClass;
    });

    // Sort
    filtered.sort((a, b) => {
      switch (sortBy) {
        case 'name':
          return a.title.localeCompare(b.title);
        case 'dateCreated':
          return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
        case 'lastUpdated':
          return new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime();
        case 'enrollment':
          return b.enrollmentCount - a.enrollmentCount;
        default:
          return 0;
      }
    });

    return filtered;
  }, [courses, searchQuery, activeTabFilter, statusFilter, skillFilter, classFilter, sortBy]);

  // Analytics
  const analytics = useMemo(() => {
    const total = courses.length;
    const active = courses.filter(c => c.status === 'Active').length;
    const totalEnrolled = courses.reduce((sum, c) => sum + c.enrollmentCount, 0);
    const avgCompletion =
      courses.length > 0
        ? Math.round(
            courses.reduce((sum, c) => sum + c.completionRate, 0) / courses.length
          )
        : 0;
    const pendingEvidence = courses.reduce((sum, c) => sum + c.evidencePending, 0);

    return { total, active, totalEnrolled, avgCompletion, pendingEvidence };
  }, [courses]);

  // Handlers
  const handleCreateCourse = async (courseData: Partial<Course>) => {
    if (!currentEducatorId) {
      alert('Unable to create course: No educator ID found');
      return;
    }

    try {
      const newCourse = await createCourse(
        {
          title: courseData.title || '',
          code: courseData.code || '',
          description: courseData.description || '',
          thumbnail: courseData.thumbnail,
          status: courseData.status || 'Draft',
          skillsCovered: courseData.skillsCovered || [],
          skillsMapped: courseData.skillsCovered?.length || 0,
          totalSkills: courseData.skillsCovered?.length || 0,
          linkedClasses: courseData.linkedClasses || [],
          modules: courseData.modules || [],
          targetOutcomes: courseData.targetOutcomes || [],
          duration: courseData.duration || '',
          coEducators: []
        },
        currentEducatorId,
        currentEducatorName
      );

      setCourses([newCourse, ...courses]);
      setShowCreateModal(false);
    } catch (err) {
      console.error('Error creating course:', err);
      alert('Failed to create course. Please try again.');
    }
  };

  const handleEditCourse = (course: Course) => {
    setEditingCourse(course);
    setShowDetailDrawer(false);
    setShowCreateModal(true);
  };

  const handleUpdateCourse = async (courseData: Partial<Course>) => {
    if (!editingCourse) return;

    try {
      const updatedCourse = await updateCourse(editingCourse.id, courseData);
      setCourses(courses.map(c => c.id === updatedCourse.id ? updatedCourse : c));
      setEditingCourse(null);
      setShowCreateModal(false);
    } catch (err) {
      console.error('Error updating course:', err);
      alert('Failed to update course. Please try again.');
    }
  };

  const handleViewCourse = (course: Course) => {
    setSelectedCourse(course);
    setShowDetailDrawer(true);
  };

  const handleArchiveCourse = async (course: Course) => {
    try {
      const newStatus = course.status === 'Archived' ? 'Draft' : 'Archived';
      const updatedCourse = await updateCourse(course.id, { status: newStatus });
      setCourses(courses.map(c => c.id === updatedCourse.id ? updatedCourse : c));
    } catch (err) {
      console.error('Error archiving course:', err);
      alert('Failed to archive course. Please try again.');
    }
  };

  const handleDeleteCourse = async (course: Course) => {
    if (!confirm(`Are you sure you want to delete "${course.title}"?`)) return;

    try {
      await deleteCourse(course.id);
      setCourses(courses.filter(c => c.id !== course.id));
    } catch (err) {
      console.error('Error deleting course:', err);
      alert('Failed to delete course. Please try again.');
    }
  };

  const handleViewAnalytics = (course: Course) => {
    setSelectedCourse(course);
    setShowDetailDrawer(true);
  };

  const handleClearFilters = () => {
    setSearchQuery('');
    setStatusFilter('All');
    setSkillFilter('All');
    setClassFilter('All');
    setSortBy('name');
  };

  const handleCourseUpdate = (updatedCourse: Course) => {
    setCourses(courses.map(c => c.id === updatedCourse.id ? updatedCourse : c));
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 p-6 flex items-center justify-center">
        <div className="text-center">
          <ArrowPathIcon className="h-12 w-12 text-indigo-600 mx-auto mb-4 animate-spin" />
          <p className="text-gray-600">Loading courses...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 p-6 flex items-center justify-center">
        <div className="text-center">
          <div className="bg-red-50 border border-red-200 rounded-lg p-6 max-w-md">
            <p className="text-red-700 mb-4">{error}</p>
            <button
              onClick={fetchCourses}
              className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
            >
              Retry
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      {/* Header */}
      <div className="mb-6">
        <div className="flex items-center justify-between mb-2">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Courses</h1>
            <p className="text-sm text-gray-600 mt-1">
              Manage courses, curriculum, and skill alignment
            </p>
          </div>
          <button
            onClick={() => {
              setEditingCourse(null);
              setShowCreateModal(true);
            }}
            className="flex items-center gap-2 px-4 py-2.5 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors shadow-sm font-medium"
          >
            <PlusIcon className="h-5 w-5" />
            Create Course
          </button>
        </div>
      </div>

      {/* Tab Navigation */}
      <div className="mb-6 flex items-center gap-2 border-b border-gray-200">
        {tabFilters.map(tab => (
          <button
            key={tab}
            onClick={() => setActiveTabFilter(tab)}
            className={`px-4 py-2 text-sm font-medium transition-colors border-b-2 ${
              activeTabFilter === tab
                ? 'border-indigo-600 text-indigo-600'
                : 'border-transparent text-gray-600 hover:text-gray-900'
            }`}
          >
            {tab}
          </button>
        ))}
      </div>

      {/* Filters */}
      <CourseFilters
        searchQuery={searchQuery}
        setSearchQuery={setSearchQuery}
        statusFilter={statusFilter}
        setStatusFilter={setStatusFilter}
        skillFilter={skillFilter}
        setSkillFilter={setSkillFilter}
        classFilter={classFilter}
        setClassFilter={setClassFilter}
        sortBy={sortBy}
        setSortBy={setSortBy}
        viewMode={viewMode}
        setViewMode={setViewMode}
        onClearFilters={handleClearFilters}
        skillCategories={SKILL_CATEGORIES}
        classes={CLASSES}
      />

      {/* Analytics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-5 gap-4 mb-6">
        <div className="bg-white rounded-xl border border-gray-200 p-5 shadow-sm">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600 mb-1">Total Courses</p>
              <p className="text-2xl font-bold text-gray-900">{analytics.total}</p>
            </div>
            <div className="w-12 h-12 bg-indigo-100 rounded-xl flex items-center justify-center">
              <BookOpenIcon className="h-6 w-6 text-indigo-600" />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl border border-gray-200 p-5 shadow-sm">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600 mb-1">Active Courses</p>
              <p className="text-2xl font-bold text-gray-900">{analytics.active}</p>
            </div>
            <div className="w-12 h-12 bg-emerald-100 rounded-xl flex items-center justify-center">
              <CheckCircleIcon className="h-6 w-6 text-emerald-600" />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl border border-gray-200 p-5 shadow-sm">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600 mb-1">Total Enrolled</p>
              <p className="text-2xl font-bold text-gray-900">{analytics.totalEnrolled}</p>
            </div>
            <div className="w-12 h-12 bg-blue-100 rounded-xl flex items-center justify-center">
              <UsersIcon className="h-6 w-6 text-blue-600" />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl border border-gray-200 p-5 shadow-sm">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600 mb-1">Avg Completion</p>
              <p className="text-2xl font-bold text-gray-900">{analytics.avgCompletion}%</p>
            </div>
            <div className="w-12 h-12 bg-purple-100 rounded-xl flex items-center justify-center">
              <AcademicCapIcon className="h-6 w-6 text-purple-600" />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl border border-gray-200 p-5 shadow-sm">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600 mb-1">Pending Evidence</p>
              <p className="text-2xl font-bold text-gray-900">{analytics.pendingEvidence}</p>
            </div>
            <div className="w-12 h-12 bg-amber-100 rounded-xl flex items-center justify-center">
              <ClockIcon className="h-6 w-6 text-amber-600" />
            </div>
          </div>
        </div>
      </div>

      {/* Course Grid/List */}
      {filteredCourses.length === 0 ? (
        <div className="bg-white rounded-xl border border-gray-200 p-12 text-center">
          <BookOpenIcon className="h-16 w-16 text-gray-300 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">No courses found</h3>
          <p className="text-gray-600 mb-4">
            {searchQuery || statusFilter !== 'All' || skillFilter !== 'All' || classFilter !== 'All'
              ? 'Try adjusting your filters'
              : 'Create your first course to get started'}
          </p>
          {!(searchQuery || statusFilter !== 'All' || skillFilter !== 'All' || classFilter !== 'All') && (
            <button
              onClick={() => setShowCreateModal(true)}
              className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors"
            >
              Create Course
            </button>
          )}
        </div>
      ) : (
        <div
          className={
            viewMode === 'grid'
              ? 'grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5'
              : 'space-y-4'
          }
        >
          {filteredCourses.map(course => (
            <CourseCard
              key={course.id}
              course={course}
              onView={handleViewCourse}
              onEdit={handleEditCourse}
              onArchive={handleArchiveCourse}
              onViewAnalytics={handleViewAnalytics}
            />
          ))}
        </div>
      )}

      {/* Create/Edit Course Modal */}
      <CreateCourseModal
        isOpen={showCreateModal}
        onClose={() => {
          setShowCreateModal(false);
          setEditingCourse(null);
        }}
        onSubmit={editingCourse ? handleUpdateCourse : handleCreateCourse}
        skillCategories={SKILL_CATEGORIES}
        classes={CLASSES}
        editingCourse={editingCourse}
      />

      {/* Course Detail Drawer */}
      <CourseDetailDrawer
        course={selectedCourse}
        isOpen={showDetailDrawer}
        onClose={() => {
          setShowDetailDrawer(false);
          setSelectedCourse(null);
        }}
        onEdit={handleEditCourse}
        onUpdateCourse={handleCourseUpdate}
      />
    </div>
  );
};

export default CoursesWithSupabase;
