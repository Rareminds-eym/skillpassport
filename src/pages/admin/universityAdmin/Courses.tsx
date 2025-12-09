import React, { useState, useMemo, useEffect } from 'react';
import {
  PlusIcon,
  BookOpenIcon,
  UsersIcon,
  CheckCircleIcon,
  AcademicCapIcon,
  BuildingOffice2Icon
} from '@heroicons/react/24/outline';

import { Course } from '../../../types/educator/course';
import { SKILL_CATEGORIES, CLASSES } from '../../../data/educator/mockCourses';

import CourseCard from '../../../components/educator/courses/CourseCard';
import CourseFilters from '../../../components/educator/courses/CourseFilters';
import CreateCourseModal from '../../../components/educator/courses/CreateCourseModal';
import CourseDetailDrawer from '../../../components/educator/courses/CourseDetailDrawer';

import { supabase } from '../../../lib/supabaseClient';
import toast from 'react-hot-toast';
import { useAuth } from '../../../context/AuthContext';

const UniversityAdminCourses: React.FC = () => {
  // @ts-ignore - AuthContext is a .jsx file
  const { user } = useAuth();

  // State
  const [courses, setCourses] = useState<Course[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [searchQuery, setSearchQuery] = useState('');
  const [activeTabFilter, setActiveTabFilter] = useState('All Courses');
  const [statusFilter, setStatusFilter] = useState('All');
  const [skillFilter, setSkillFilter] = useState('All');
  const [classFilter, setClassFilter] = useState('All');
  const [_collegeFilter, setCollegeFilter] = useState('All');
  const [sortBy, setSortBy] = useState('name');
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');

  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showDetailDrawer, setShowDetailDrawer] = useState(false);
  const [selectedCourse, setSelectedCourse] = useState<Course | null>(null);
  const [editingCourse, setEditingCourse] = useState<Course | null>(null);

  const [colleges, setColleges] = useState<{ id: string; name: string }[]>([]);

  const tabFilters = ['All Courses', 'Active', 'Upcoming', 'Archived'];

  // Fetch all courses for university
  const fetchUniversityCourses = async () => {
    try {
      setLoading(true);
      setError(null);

      // Fetch all courses (university admin sees all)
      const { data: coursesData, error: coursesError } = await supabase
        .from('courses')
        .select('*')
        .is('deleted_at', null)
        .order('created_at', { ascending: false });

      if (coursesError) throw coursesError;

      if (!coursesData || coursesData.length === 0) {
        setCourses([]);
        return;
      }

      const courseIds = coursesData.map((c: any) => c.course_id);

      // Fetch related data
      const [skillsResult, classesResult, modulesResult] = await Promise.allSettled([
        supabase.from('course_skills').select('course_id, skill_name').in('course_id', courseIds),
        supabase.from('course_classes').select('course_id, class_name').in('course_id', courseIds),
        supabase.from('course_modules').select('*, lessons(*, lesson_resources(*))').in('course_id', courseIds).order('order_index', { ascending: true })
      ]);

      // Build lookup maps
      const skillsMap: Record<string, string[]> = {};
      const classesMap: Record<string, string[]> = {};
      const modulesMap: Record<string, any[]> = {};

      if (skillsResult.status === 'fulfilled' && skillsResult.value.data) {
        skillsResult.value.data.forEach((s: any) => {
          if (!skillsMap[s.course_id]) skillsMap[s.course_id] = [];
          skillsMap[s.course_id].push(s.skill_name);
        });
      }

      if (classesResult.status === 'fulfilled' && classesResult.value.data) {
        classesResult.value.data.forEach((c: any) => {
          if (!classesMap[c.course_id]) classesMap[c.course_id] = [];
          classesMap[c.course_id].push(c.class_name);
        });
      }

      if (modulesResult.status === 'fulfilled' && modulesResult.value.data) {
        modulesResult.value.data.forEach((m: any) => {
          if (!modulesMap[m.course_id]) modulesMap[m.course_id] = [];
          modulesMap[m.course_id].push(m);
        });
      }

      // Transform courses
      const transformedCourses = coursesData.map((courseRow: any) => ({
        id: courseRow.course_id,
        title: courseRow.title,
        code: courseRow.code,
        description: courseRow.description,
        thumbnail: courseRow.thumbnail,
        status: courseRow.status,
        duration: courseRow.duration,
        skillsCovered: skillsMap[courseRow.course_id] || [],
        skillsMapped: courseRow.skills_mapped || 0,
        totalSkills: courseRow.total_skills || 0,
        enrollmentCount: courseRow.enrollment_count || 0,
        completionRate: courseRow.completion_rate || 0,
        evidencePending: courseRow.evidence_pending || 0,
        linkedClasses: classesMap[courseRow.course_id] || [],
        targetOutcomes: courseRow.target_outcomes || [],
        modules: (modulesMap[courseRow.course_id] || []).map((mod: any) => ({
          id: mod.module_id,
          title: mod.title,
          description: mod.description || '',
          skillTags: mod.skill_tags || [],
          activities: mod.activities || [],
          order: mod.order_index,
          lessons: (mod.lessons || []).map((les: any) => ({
            id: les.lesson_id,
            title: les.title,
            content: les.content || '',
            description: les.description || '',
            duration: les.duration || '',
            order: les.order_index,
            resources: (les.lesson_resources || []).map((res: any) => ({
              id: res.resource_id,
              name: res.name,
              type: res.type,
              url: res.url,
              size: res.file_size,
              thumbnailUrl: res.thumbnail_url,
              embedUrl: res.embed_url
            }))
          }))
        })),
        coEducators: [],
        createdAt: courseRow.created_at,
        updatedAt: courseRow.updated_at,
        educatorName: courseRow.educator_name,
        collegeName: courseRow.college_name
      }));

      setCourses(transformedCourses);
    } catch (err: any) {
      console.error('Error fetching courses:', err);
      setError(err?.message || 'Failed to load courses');
    } finally {
      setLoading(false);
    }
  };

  // Fetch colleges for filter
  const fetchColleges = async () => {
    try {
      const { data, error } = await supabase
        .from('colleges')
        .select('id, name')
        .order('name');
      
      if (!error && data) {
        setColleges(data);
      }
    } catch (err) {
      console.error('Error fetching colleges:', err);
    }
  };

  useEffect(() => {
    fetchUniversityCourses();
    fetchColleges();
  }, []);

  // Filter and sort
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

      return matchesSearch && matchesTab && matchesStatus && matchesSkill && matchesClass;
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
  }, [courses, searchQuery, activeTabFilter, statusFilter, skillFilter, classFilter, sortBy]);

  // Analytics
  const analytics = useMemo(() => {
    const total = courses.length;
    const active = courses.filter(c => c.status === 'Active').length;
    const totalEnrolled = courses.reduce((s, c) => s + c.enrollmentCount, 0);
    const avgCompletion = courses.length > 0
      ? Math.round(courses.reduce((s, c) => s + c.completionRate, 0) / courses.length)
      : 0;
    const pendingEvidence = courses.reduce((s, c) => s + c.evidencePending, 0);

    return { total, active, totalEnrolled, avgCompletion, pendingEvidence };
  }, [courses]);

  // Handlers
  const handleViewCourse = (course: Course) => {
    setSelectedCourse(course);
    setShowDetailDrawer(true);
  };

  const handleEditCourse = (course: Course) => {
    setEditingCourse(course);
    setShowDetailDrawer(false);
    setShowCreateModal(true);
  };

  const handleClearFilters = () => {
    setSearchQuery('');
    setStatusFilter('All');
    setSkillFilter('All');
    setClassFilter('All');
    setCollegeFilter('All');
    setSortBy('name');
  };

  // Loading state
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

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      {error && (
        <div className="mb-4 bg-red-50 border border-red-200 rounded-lg p-4 flex items-center justify-between">
          <p className="text-red-800">{error}</p>
          <button onClick={() => setError(null)} className="text-red-600 hover:text-red-800">
            Dismiss
          </button>
        </div>
      )}

      {/* Header */}
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">University Courses</h1>
          <p className="text-sm text-gray-600 mt-1">
            Manage all courses across affiliated colleges
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

      {/* Analytics Cards */}
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
              <p className="text-sm text-gray-600 mb-1">Affiliated Colleges</p>
              <p className="text-2xl font-bold">{colleges.length}</p>
            </div>
            <div className="w-12 h-12 bg-amber-100 rounded-xl flex items-center justify-center">
              <BuildingOffice2Icon className="h-6 w-6 text-amber-600" />
            </div>
          </div>
        </div>
      </div>

      {/* Course Grid/List */}
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
              onViewAnalytics={() => {
                // University admin analytics - could navigate to analytics page
                console.log('View analytics for course:', course.id);
              }}
            />
          ))}
        </div>
      )}

      {/* Create/Edit Modal */}
      <CreateCourseModal
        isOpen={showCreateModal}
        onClose={() => {
          setShowCreateModal(false);
          setEditingCourse(null);
        }}
        onSubmit={async (courseData) => {
          try {
            if (editingCourse) {
              // Update existing course
              const { error } = await supabase
                .from('courses')
                .update({
                  title: courseData.title,
                  code: courseData.code,
                  description: courseData.description,
                  status: courseData.status,
                  duration: courseData.duration,
                  target_outcomes: courseData.targetOutcomes
                })
                .eq('course_id', editingCourse.id);

              if (error) throw error;
              toast.success('Course updated successfully!');
            } else {
              // Create new course
              const { error } = await supabase
                .from('courses')
                .insert({
                  title: courseData.title,
                  code: courseData.code,
                  description: courseData.description,
                  status: courseData.status || 'Draft',
                  duration: courseData.duration,
                  target_outcomes: courseData.targetOutcomes,
                  educator_id: user?.id,
                  educator_name: user?.full_name || 'University Admin'
                });

              if (error) throw error;
              toast.success('Course created successfully!');
            }
            
            setShowCreateModal(false);
            setEditingCourse(null);
            fetchUniversityCourses();
          } catch (err: any) {
            console.error('Error saving course:', err);
            toast.error(err?.message || 'Failed to save course');
          }
        }}
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
        onUpdateCourse={async (updatedCourse) => {
          try {
            const { error } = await supabase
              .from('courses')
              .update({
                title: updatedCourse.title,
                code: updatedCourse.code,
                description: updatedCourse.description,
                status: updatedCourse.status,
                duration: updatedCourse.duration
              })
              .eq('course_id', updatedCourse.id);

            if (error) throw error;
            
            setCourses(courses.map(c => c.id === updatedCourse.id ? updatedCourse : c));
            setSelectedCourse(updatedCourse);
            toast.success('Course updated!');
          } catch (err: any) {
            console.error('Error updating course:', err);
            toast.error('Failed to update course');
          }
        }}
      />
    </div>
  );
};

export default UniversityAdminCourses;
