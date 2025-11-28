import React, { useState, useMemo, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  PlusIcon,
  BookOpenIcon,
  UsersIcon,
  CheckCircleIcon,
  ClockIcon,
  AcademicCapIcon
} from '@heroicons/react/24/outline';

import { Course } from '../../types/educator/course';
import { SKILL_CATEGORIES, CLASSES } from '../../data/educator/mockCourses';

import CourseCard from '../../components/educator/courses/CourseCard';
import CourseFilters from '../../components/educator/courses/CourseFilters';
import CreateCourseModal from '../../components/educator/courses/CreateCourseModal';
import CourseDetailDrawer from '../../components/educator/courses/CourseDetailDrawer';

import {
  getCoursesByEducator,
  createCourse,
  updateCourse
} from '../../services/educator/coursesService';
import { supabase } from '../../lib/supabaseClient';
import toast from 'react-hot-toast';
// @ts-ignore - AuthContext is a .jsx file
import { useAuth } from '../../context/AuthContext';

const Courses: React.FC = () => {
  const navigate = useNavigate();
  const { user, isAuthenticated } = useAuth();

  /** ─────────────────────────────────────────────
   *  STATE
   * ───────────────────────────────────────────── */
  const [courses, setCourses] = useState<Course[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [educatorId, setEducatorId] = useState<string | null>(null);
  const [educatorName, setEducatorName] = useState<string>('');

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

  /** ─────────────────────────────────────────────
   *  CONSTANTS
   * ───────────────────────────────────────────── */
  const tabFilters = ['All Courses', 'Active', 'Upcoming', 'Archived'];

  /** ─────────────────────────────────────────────
   *  LOAD EDUCATOR + COURSES
   * ───────────────────────────────────────────── */
  useEffect(() => {
    const loadEducatorAndCourses = async () => {
      try {
        setLoading(true);
        setError(null);

        if (!isAuthenticated || !user) {
          setError('Please log in to view courses');
          setLoading(false);
          return;
        }

        // Verify Supabase session is valid
        const { data: { session }, error: sessionError } = await supabase.auth.getSession();
        if (sessionError || !session) {
          console.error('Session error:', sessionError);
          setError('Your session has expired. Please log in again.');
          setLoading(false);
          return;
        }

        setEducatorId(user.id);
        const fullName = user.full_name || user.email?.split('@')[0] || 'Educator';
        setEducatorName(fullName);

        const coursesData = await getCoursesByEducator(user.id);
        setCourses(coursesData);

      } catch (err: any) {
        console.error('Error loading courses:', err);
        setError(err?.message || 'Failed to load courses.');
      } finally {
        setLoading(false);
      }
    };

    loadEducatorAndCourses();
  }, [user, isAuthenticated]);

  /** ─────────────────────────────────────────────
   *  FILTER + SORT
   * ───────────────────────────────────────────── */
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

      const matchesStatus =
        statusFilter === 'All' || course.status === statusFilter;

      const matchesSkill =
        skillFilter === 'All' || course.skillsCovered.includes(skillFilter);

      const matchesClass =
        classFilter === 'All' || course.linkedClasses.includes(classFilter);

      return (
        matchesSearch &&
        matchesTab &&
        matchesStatus &&
        matchesSkill &&
        matchesClass
      );
    });

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
  }, [
    courses,
    searchQuery,
    activeTabFilter,
    statusFilter,
    skillFilter,
    classFilter,
    sortBy
  ]);

  /** ─────────────────────────────────────────────
   *  ANALYTICS
   * ───────────────────────────────────────────── */
  const analytics = useMemo(() => {
    const total = courses.length;
    const active = courses.filter(c => c.status === 'Active').length;
    const totalEnrolled = courses.reduce((s, c) => s + c.enrollmentCount, 0);
    const avgCompletion =
      courses.length > 0
        ? Math.round(
            courses.reduce((s, c) => s + c.completionRate, 0) / courses.length
          )
        : 0;
    const pendingEvidence = courses.reduce((s, c) => s + c.evidencePending, 0);

    return { total, active, totalEnrolled, avgCompletion, pendingEvidence };
  }, [courses]);

  /** ─────────────────────────────────────────────
   *  HANDLERS
   * ───────────────────────────────────────────── */
  const handleCreateCourse = async (courseData: Partial<Course>) => {
    if (!educatorId || !educatorName) {
      setError('Educator information not available. Please refresh the page and try again.');
      return;
    }

    try {
      setLoading(true);

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
        educatorId,
        educatorName
      );

      setCourses([...courses, newCourse]);
      setShowCreateModal(false);
      toast.success('Course created successfully!');

    } catch (err: any) {
      console.error('Error creating course:', err);
      setError('Failed to create course: ' + (err?.message || 'Unknown error'));
    } finally {
      setLoading(false);
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
      setLoading(true);
      const updatedCourse = await updateCourse(editingCourse.id, courseData);
      setCourses(courses.map(c => (c.id === editingCourse.id ? updatedCourse : c)));
      setEditingCourse(null);
      setShowCreateModal(false);
    } catch (err: any) {
      console.error('Error updating course:', err);
      setError('Failed to update course: ' + (err?.message || 'Unknown error'));
    } finally {
      setLoading(false);
    }
  };

  const handleViewCourse = (course: Course) => {
    setSelectedCourse(course);
    setShowDetailDrawer(true);
  };

  const handleArchiveCourse = async (course: Course) => {
    const newStatus = course.status === 'Archived' ? 'Draft' : 'Archived';

    try {
      setLoading(true);
      const updatedCourse = await updateCourse(course.id, { status: newStatus });
      setCourses(courses.map(c => (c.id === course.id ? updatedCourse : c)));
    } catch (err: any) {
      console.error('Error archiving course:', err);
      setError('Failed to archive course: ' + (err?.message || 'Unknown error'));
    } finally {
      setLoading(false);
    }
  };

  const handleCourseUpdate = async (updatedCourse: Course) => {
    try {
      setLoading(true);
      const savedCourse = await updateCourse(updatedCourse.id, updatedCourse);
      setCourses(courses.map(c => (c.id === savedCourse.id ? savedCourse : c)));
      setSelectedCourse(savedCourse);
    } catch (err: any) {
      console.error('Error updating course:', err);
      setError('Failed to update course: ' + (err?.message || 'Unknown error'));
    } finally {
      setLoading(false);
    }
  };

  const handleViewAnalytics = (course: Course) => {
    navigate(`/educator/courses/${course.id}/analytics`);
  };

  const handleClearFilters = () => {
    setSearchQuery('');
    setStatusFilter('All');
    setSkillFilter('All');
    setClassFilter('All');
    setSortBy('name');
  };

  /** ─────────────────────────────────────────────
   *  UI STATES
   * ───────────────────────────────────────────── */
  if (loading && courses.length === 0) {
    return (
      <div className="min-h-screen bg-gray-50 p-6 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading courses...</p>
        </div>
      </div>
    );
  }

  if (error && courses.length === 0) {
    return (
      <div className="min-h-screen bg-gray-50 p-6 flex items-center justify-center">
        <div className="text-center max-w-md">
          <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <BookOpenIcon className="h-8 w-8 text-red-600" />
          </div>
          <h3 className="text-lg font-medium text-gray-900 mb-2">
            Error Loading Courses
          </h3>
          <p className="text-gray-600 mb-4">{error}</p>
          <button
            onClick={() => window.location.reload()}
            className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  /** ─────────────────────────────────────────────
   *  MAIN UI
   * ───────────────────────────────────────────── */
  return (
    <div className="min-h-screen bg-gray-50 p-6">

      {error && (
        <div className="mb-4 bg-red-50 border border-red-200 rounded-lg p-4 flex items-center justify-between">
          <p className="text-red-800">{error}</p>
          <button
            onClick={() => setError(null)}
            className="text-red-600 hover:text-red-800"
          >
            Dismiss
          </button>
        </div>
      )}

      {/* Header */}
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Courses</h1>
          <p className="text-sm text-gray-600 mt-1">
            Manage courses, curriculum, and skill alignment
            {educatorName && <span className="ml-2 text-indigo-600">• {educatorName}</span>}
          </p>
        </div>

        <button
          onClick={() => {
            setEditingCourse(null);
            setShowCreateModal(true);
          }}
          className="flex items-center gap-2 px-4 py-2.5 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 shadow-sm"
        >
          <PlusIcon className="h-5 w-5" />
          Create Course
        </button>
      </div>

      {/* Tabs */}
      <div className="mb-6 flex items-center gap-2 border-b border-gray-200">
        {tabFilters.map(tab => (
          <button
            key={tab}
            onClick={() => setActiveTabFilter(tab)}
            className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors ${
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

      {/* Analytics */}
      <div className="grid grid-cols-1 md:grid-cols-5 gap-4 mb-6">
        <div className="bg-white rounded-xl border p-5 shadow-sm">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600 mb-1">Total Courses</p>
              <p className="text-2xl font-bold">{analytics.total}</p>
            </div>
            <div className="w-12 h-12 bg-indigo-100 rounded-xl flex items-center justify-center">
              <BookOpenIcon className="h-6 w-6 text-indigo-600" />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl border p-5 shadow-sm">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600 mb-1">Active Courses</p>
              <p className="text-2xl font-bold">{analytics.active}</p>
            </div>
            <div className="w-12 h-12 bg-emerald-100 rounded-xl flex items-center justify-center">
              <CheckCircleIcon className="h-6 w-6 text-emerald-600" />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl border p-5 shadow-sm">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600 mb-1">Total Enrolled</p>
              <p className="text-2xl font-bold">{analytics.totalEnrolled}</p>
            </div>
            <div className="w-12 h-12 bg-blue-100 rounded-xl flex items-center justify-center">
              <UsersIcon className="h-6 w-6 text-blue-600" />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl border p-5 shadow-sm">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600 mb-1">Avg Completion</p>
              <p className="text-2xl font-bold">{analytics.avgCompletion}%</p>
            </div>
            <div className="w-12 h-12 bg-purple-100 rounded-xl flex items-center justify-center">
              <AcademicCapIcon className="h-6 w-6 text-purple-600" />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl border p-5 shadow-sm">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600 mb-1">Pending Evidence</p>
              <p className="text-2xl font-bold">{analytics.pendingEvidence}</p>
            </div>
            <div className="w-12 h-12 bg-amber-100 rounded-xl flex items-center justify-center">
              <ClockIcon className="h-6 w-6 text-amber-600" />
            </div>
          </div>
        </div>
      </div>

      {/* Course results */}
      {filteredCourses.length === 0 ? (
        <div className="bg-white rounded-xl border p-12 text-center">
          <BookOpenIcon className="h-16 w-16 text-gray-300 mx-auto mb-4" />
          <h3 className="text-lg font-medium">No courses found</h3>

          <p className="text-gray-600 mb-4">
            {searchQuery || statusFilter !== 'All' || skillFilter !== 'All' || classFilter !== 'All'
              ? 'Try adjusting your filters'
              : 'Create your first course to get started'}
          </p>

          {!(searchQuery || statusFilter !== 'All' || skillFilter !== 'All' || classFilter !== 'All') && (
            <button
              onClick={() => setShowCreateModal(true)}
              className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700"
            >
              Create Course
            </button>
          )}
        </div>
      ) : (
        <div className={viewMode === 'grid'
          ? 'grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5'
          : 'space-y-4'
        }>
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

      {/* Create / Edit Modal */}
      <CreateCourseModal
        isOpen={showCreateModal}
        onClose={() => {
          console.log('Modal onClose called');
          setShowCreateModal(false);
          setEditingCourse(null);
        }}
        onSubmit={editingCourse ? handleUpdateCourse : handleCreateCourse}
        skillCategories={SKILL_CATEGORIES}
        classes={CLASSES}
        editingCourse={editingCourse}
      />

      {/* Detail Drawer */}
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

export default Courses;