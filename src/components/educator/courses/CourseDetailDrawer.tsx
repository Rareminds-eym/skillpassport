import React, { useState } from 'react';
import {
  XMarkIcon,
  AcademicCapIcon,
  UsersIcon,
  ChartBarIcon,
  DocumentTextIcon,
  Cog6ToothIcon,
  PlusIcon,
  ClipboardDocumentListIcon,
  CheckCircleIcon,
  ChevronDownIcon,
  ChevronRightIcon,
  PencilIcon,
  TrashIcon,
  EyeIcon,
  DocumentIcon,
  VideoCameraIcon,
  PhotoIcon,
  LinkIcon
} from '@heroicons/react/24/outline';
import { Course, CourseModule, Lesson, Resource } from '../../../types/educator/course';
import AddLessonModal from './AddLessonModal';
import ResourceUploadComponent from './ResourceUploadComponent';

interface CourseDetailDrawerProps {
  course: Course | null;
  isOpen: boolean;
  onClose: () => void;
  onEdit: (course: Course) => void;
  onUpdateCourse?: (updatedCourse: Course) => void;
}

const CourseDetailDrawer: React.FC<CourseDetailDrawerProps> = ({
  course: initialCourse,
  isOpen,
  onClose,
  onEdit,
  onUpdateCourse
}) => {
  const [course, setCourse] = useState<Course | null>(initialCourse);
  const [activeTab, setActiveTab] = useState('overview');
  const [expandedModules, setExpandedModules] = useState<Set<string>>(new Set());
  const [showAddLesson, setShowAddLesson] = useState(false);
  const [selectedModuleId, setSelectedModuleId] = useState<string | null>(null);
  const [editingLesson, setEditingLesson] = useState<Lesson | null>(null);
  const [showResourceUpload, setShowResourceUpload] = useState(false);
  const [selectedLessonId, setSelectedLessonId] = useState<string | null>(null);

  React.useEffect(() => {
    setCourse(initialCourse);
  }, [initialCourse]);

  if (!isOpen || !course) return null;

  const tabs = [
    { id: 'overview', label: 'Overview', icon: DocumentTextIcon },
    { id: 'modules', label: 'Modules & Lessons', icon: AcademicCapIcon },
    { id: 'activities', label: 'Activities', icon: ClipboardDocumentListIcon },
    { id: 'skills', label: 'Skill Mapping', icon: CheckCircleIcon },
    { id: 'analytics', label: 'Analytics', icon: ChartBarIcon },
    { id: 'settings', label: 'Settings', icon: Cog6ToothIcon }
  ];

  const skillCoverage = course.totalSkills > 0
    ? Math.round((course.skillsMapped / course.totalSkills) * 100)
    : 0;

  const toggleModule = (moduleId: string) => {
    const newExpanded = new Set(expandedModules);
    if (newExpanded.has(moduleId)) {
      newExpanded.delete(moduleId);
    } else {
      newExpanded.add(moduleId);
    }
    setExpandedModules(newExpanded);
  };

  const handleAddLesson = (moduleId: string) => {
    setSelectedModuleId(moduleId);
    setEditingLesson(null);
    setShowAddLesson(true);
  };

  const handleLessonSubmit = (lessonData: Omit<Lesson, 'id' | 'order'>) => {
    if (!selectedModuleId) return;

    const updatedCourse = { ...course };
    const moduleIndex = updatedCourse.modules.findIndex(m => m.id === selectedModuleId);

    if (moduleIndex === -1) return;

    if (editingLesson) {
      // Update existing lesson
      const lessonIndex = updatedCourse.modules[moduleIndex].lessons.findIndex(
        l => l.id === editingLesson.id
      );
      if (lessonIndex !== -1) {
        updatedCourse.modules[moduleIndex].lessons[lessonIndex] = {
          ...updatedCourse.modules[moduleIndex].lessons[lessonIndex],
          ...lessonData
        };
      }
    } else {
      // Add new lesson
      const newLesson: Lesson = {
        ...lessonData,
        id: `lesson-${Date.now()}`,
        order: updatedCourse.modules[moduleIndex].lessons.length + 1
      };
      updatedCourse.modules[moduleIndex].lessons.push(newLesson);
    }

    setCourse(updatedCourse);
    onUpdateCourse?.(updatedCourse);
    setShowAddLesson(false);
    setEditingLesson(null);
  };

  const handleEditLesson = (moduleId: string, lesson: Lesson) => {
    setSelectedModuleId(moduleId);
    setEditingLesson(lesson);
    setShowAddLesson(true);
  };

  const handleDeleteLesson = (moduleId: string, lessonId: string) => {
    if (!confirm('Are you sure you want to delete this lesson?')) return;

    const updatedCourse = { ...course };
    const moduleIndex = updatedCourse.modules.findIndex(m => m.id === moduleId);

    if (moduleIndex === -1) return;

    updatedCourse.modules[moduleIndex].lessons = updatedCourse.modules[moduleIndex].lessons.filter(
      l => l.id !== lessonId
    );

    setCourse(updatedCourse);
    onUpdateCourse?.(updatedCourse);
  };

  const handleAddResourceToLesson = (moduleId: string, lessonId: string) => {
    setSelectedModuleId(moduleId);
    setSelectedLessonId(lessonId);
    setShowResourceUpload(true);
  };

  const handleResourcesAdded = (newResources: Resource[]) => {
    if (!selectedModuleId || !selectedLessonId) return;

    const updatedCourse = { ...course };
    const moduleIndex = updatedCourse.modules.findIndex(m => m.id === selectedModuleId);

    if (moduleIndex === -1) return;

    const lessonIndex = updatedCourse.modules[moduleIndex].lessons.findIndex(
      l => l.id === selectedLessonId
    );

    if (lessonIndex === -1) return;

    updatedCourse.modules[moduleIndex].lessons[lessonIndex].resources.push(...newResources);

    setCourse(updatedCourse);
    onUpdateCourse?.(updatedCourse);
    setShowResourceUpload(false);
  };

  const handleDeleteResource = (moduleId: string, lessonId: string, resourceId: string) => {
    if (!confirm('Are you sure you want to delete this resource?')) return;

    const updatedCourse = { ...course };
    const moduleIndex = updatedCourse.modules.findIndex(m => m.id === selectedModuleId);

    if (moduleIndex === -1) return;

    const lessonIndex = updatedCourse.modules[moduleIndex].lessons.findIndex(
      l => l.id === lessonId
    );

    if (lessonIndex === -1) return;

    updatedCourse.modules[moduleIndex].lessons[lessonIndex].resources =
      updatedCourse.modules[moduleIndex].lessons[lessonIndex].resources.filter(
        r => r.id !== resourceId
      );

    setCourse(updatedCourse);
    onUpdateCourse?.(updatedCourse);
  };

  const getResourceIcon = (type: Resource['type']) => {
    switch (type) {
      case 'pdf':
      case 'document':
        return DocumentIcon;
      case 'video':
        return VideoCameraIcon;
      case 'image':
        return PhotoIcon;
      case 'youtube':
        return VideoCameraIcon;
      default:
        return LinkIcon;
    }
  };

  return (
    <>
      <div className="fixed inset-0 z-50 overflow-hidden">
        <div className="absolute inset-0 bg-black bg-opacity-50" onClick={onClose} />
        <div className="fixed inset-y-0 right-0 max-w-4xl w-full bg-white shadow-xl flex flex-col">
          {/* Header */}
          <div className="px-6 py-4 border-b border-gray-200">
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <h2 className="text-xl font-bold text-gray-900 mb-1">{course.title}</h2>
                <div className="flex items-center gap-3 text-sm text-gray-600">
                  <span className="font-medium">{course.code}</span>
                  <span>•</span>
                  <span>{course.duration}</span>
                  <span>•</span>
                  <span
                    className={`px-2 py-0.5 rounded-full text-xs font-medium ${
                      course.status === 'Active'
                        ? 'bg-emerald-100 text-emerald-700'
                        : course.status === 'Draft'
                        ? 'bg-gray-100 text-gray-700'
                        : course.status === 'Upcoming'
                        ? 'bg-blue-100 text-blue-700'
                        : 'bg-amber-100 text-amber-700'
                    }`}
                  >
                    {course.status}
                  </span>
                </div>
              </div>
              <button
                onClick={onClose}
                className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <XMarkIcon className="h-6 w-6 text-gray-400" />
              </button>
            </div>

            {/* Tabs */}
            <div className="flex items-center gap-1 mt-4 overflow-x-auto">
              {tabs.map((tab) => {
                const Icon = tab.icon;
                return (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id)}
                    className={`flex items-center gap-2 px-4 py-2 text-sm font-medium rounded-lg transition-colors whitespace-nowrap ${
                      activeTab === tab.id
                        ? 'bg-indigo-50 text-indigo-700 border border-indigo-200'
                        : 'text-gray-600 hover:bg-gray-100'
                    }`}
                  >
                    <Icon className="h-4 w-4" />
                    {tab.label}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Content */}
          <div className="flex-1 overflow-y-auto p-6">
            {/* Overview Tab */}
            {activeTab === 'overview' && (
              <div className="space-y-6">
                <div>
                  <h3 className="text-sm font-semibold text-gray-900 mb-2">Description</h3>
                  <p className="text-sm text-gray-600">{course.description}</p>
                </div>

                <div>
                  <h3 className="text-sm font-semibold text-gray-900 mb-3">Target Learning Outcomes</h3>
                  <ul className="space-y-2">
                    {course.targetOutcomes.map((outcome, index) => (
                      <li key={index} className="flex items-start gap-2 text-sm text-gray-600">
                        <CheckCircleIcon className="h-5 w-5 text-emerald-500 flex-shrink-0 mt-0.5" />
                        <span>{outcome}</span>
                      </li>
                    ))}
                  </ul>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="p-4 bg-indigo-50 rounded-lg border border-indigo-100">
                    <div className="flex items-center gap-3 mb-2">
                      <UsersIcon className="h-5 w-5 text-indigo-600" />
                      <span className="text-xs text-indigo-900 font-medium">Enrolled Students</span>
                    </div>
                    <p className="text-2xl font-bold text-indigo-700">{course.enrollmentCount}</p>
                  </div>
                  <div className="p-4 bg-emerald-50 rounded-lg border border-emerald-100">
                    <div className="flex items-center gap-3 mb-2">
                      <CheckCircleIcon className="h-5 w-5 text-emerald-600" />
                      <span className="text-xs text-emerald-900 font-medium">Completion Rate</span>
                    </div>
                    <p className="text-2xl font-bold text-emerald-700">{course.completionRate}%</p>
                  </div>
                </div>

                <div>
                  <h3 className="text-sm font-semibold text-gray-900 mb-3">Linked Classes</h3>
                  <div className="flex flex-wrap gap-2">
                    {course.linkedClasses.map((cls) => (
                      <span
                        key={cls}
                        className="px-3 py-1 bg-blue-50 text-blue-700 text-sm rounded-lg border border-blue-200"
                      >
                        {cls}
                      </span>
                    ))}
                  </div>
                </div>

                <div>
                  <h3 className="text-sm font-semibold text-gray-900 mb-3">Skills Covered</h3>
                  <div className="flex flex-wrap gap-2">
                    {course.skillsCovered.map((skill) => (
                      <span
                        key={skill}
                        className="px-3 py-1 bg-indigo-50 text-indigo-700 text-sm rounded-lg border border-indigo-200"
                      >
                        {skill}
                      </span>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {/* Modules & Lessons Tab - ENHANCED */}
            {activeTab === 'modules' && (
              <div className="space-y-4">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-semibold text-gray-900">
                    Course Modules ({course.modules.length})
                  </h3>
                </div>

                {course.modules.length === 0 ? (
                  <div className="text-center py-12">
                    <AcademicCapIcon className="h-12 w-12 text-gray-300 mx-auto mb-3" />
                    <p className="text-gray-600 mb-4">No modules added yet</p>
                    <button
                      onClick={() => onEdit(course)}
                      className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors"
                    >
                      Add First Module
                    </button>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {course.modules.map((module, moduleIndex) => {
                      const isExpanded = expandedModules.has(module.id);
                      return (
                        <div
                          key={module.id}
                          className="border border-gray-200 rounded-lg overflow-hidden"
                        >
                          {/* Module Header */}
                          <div className="bg-gray-50 border-b border-gray-200">
                            <div className="flex items-center justify-between p-4">
                              <button
                                onClick={() => toggleModule(module.id)}
                                className="flex items-center gap-3 flex-1 text-left"
                              >
                                {isExpanded ? (
                                  <ChevronDownIcon className="h-5 w-5 text-gray-600 flex-shrink-0" />
                                ) : (
                                  <ChevronRightIcon className="h-5 w-5 text-gray-600 flex-shrink-0" />
                                )}
                                <div className="flex-1">
                                  <h4 className="font-semibold text-gray-900">
                                    {moduleIndex + 1}. {module.title}
                                  </h4>
                                  <p className="text-sm text-gray-600 mt-1">{module.description}</p>
                                  <div className="flex items-center gap-4 mt-2 text-xs text-gray-500">
                                    <span>{module.lessons.length} lesson(s)</span>
                                    <span>•</span>
                                    <span>{module.lessons.reduce((sum, l) => sum + l.resources.length, 0)} resource(s)</span>
                                  </div>
                                </div>
                              </button>
                              <button
                                onClick={() => handleAddLesson(module.id)}
                                className="flex items-center gap-2 px-3 py-1.5 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors text-sm"
                              >
                                <PlusIcon className="h-4 w-4" />
                                Add Lesson
                              </button>
                            </div>

                            {/* Module Skill Tags */}
                            {module.skillTags.length > 0 && (
                              <div className="px-4 pb-3 flex flex-wrap gap-1.5">
                                {module.skillTags.map((skill) => (
                                  <span
                                    key={skill}
                                    className="px-2 py-0.5 bg-indigo-100 text-indigo-700 text-xs rounded"
                                  >
                                    {skill}
                                  </span>
                                ))}
                              </div>
                            )}
                          </div>

                          {/* Lessons List */}
                          {isExpanded && (
                            <div className="bg-white">
                              {module.lessons.length === 0 ? (
                                <div className="p-6 text-center text-gray-500 text-sm">
                                  No lessons added yet. Click "Add Lesson" to get started.
                                </div>
                              ) : (
                                <div className="divide-y divide-gray-100">
                                  {module.lessons.map((lesson, lessonIndex) => {
                                    const ResourceIcon = getResourceIcon(lesson.resources[0]?.type);
                                    return (
                                      <div key={lesson.id} className="p-4 hover:bg-gray-50 transition-colors">
                                        <div className="flex items-start justify-between mb-2">
                                          <div className="flex-1">
                                            <div className="flex items-center gap-2 mb-1">
                                              <span className="text-sm font-medium text-gray-500">
                                                {lessonIndex + 1}.
                                              </span>
                                              <h5 className="font-semibold text-gray-900">{lesson.title}</h5>
                                              {lesson.duration && (
                                                <span className="text-xs text-gray-500 bg-gray-100 px-2 py-0.5 rounded">
                                                  {lesson.duration}
                                                </span>
                                              )}
                                            </div>
                                            {lesson.description && (
                                              <p className="text-sm text-gray-600 mb-2">{lesson.description}</p>
                                            )}
                                          </div>
                                          <div className="flex items-center gap-1">
                                            <button
                                              onClick={() => handleEditLesson(module.id, lesson)}
                                              className="p-1.5 hover:bg-gray-200 rounded transition-colors"
                                              title="Edit lesson"
                                            >
                                              <PencilIcon className="h-4 w-4 text-gray-600" />
                                            </button>
                                            <button
                                              onClick={() => handleDeleteLesson(module.id, lesson.id)}
                                              className="p-1.5 hover:bg-red-100 rounded transition-colors"
                                              title="Delete lesson"
                                            >
                                              <TrashIcon className="h-4 w-4 text-red-600" />
                                            </button>
                                          </div>
                                        </div>

                                        {/* Resources */}
                                        <div className="ml-6">
                                          <div className="flex items-center justify-between mb-2">
                                            <span className="text-xs font-medium text-gray-700">
                                              Resources ({lesson.resources.length})
                                            </span>
                                            <button
                                              onClick={() => handleAddResourceToLesson(module.id, lesson.id)}
                                              className="text-xs text-indigo-600 hover:text-indigo-700 font-medium"
                                            >
                                              + Add
                                            </button>
                                          </div>
                                          {lesson.resources.length > 0 ? (
                                            <div className="space-y-1">
                                              {lesson.resources.map((resource) => {
                                                const Icon = getResourceIcon(resource.type);
                                                return (
                                                  <div
                                                    key={resource.id}
                                                    className="flex items-center justify-between p-2 bg-gray-50 rounded border border-gray-100"
                                                  >
                                                    <div className="flex items-center gap-2 flex-1 min-w-0">
                                                      <Icon className="h-4 w-4 text-gray-500 flex-shrink-0" />
                                                      <span className="text-xs text-gray-700 truncate">
                                                        {resource.name}
                                                      </span>
                                                      {resource.size && (
                                                        <span className="text-xs text-gray-400">
                                                          {resource.size}
                                                        </span>
                                                      )}
                                                    </div>
                                                    <div className="flex items-center gap-1">
                                                      <button
                                                        onClick={() => window.open(resource.url, '_blank')}
                                                        className="p-1 hover:bg-gray-200 rounded transition-colors"
                                                        title="View resource"
                                                      >
                                                        <EyeIcon className="h-3 w-3 text-gray-600" />
                                                      </button>
                                                      <button
                                                        onClick={() => handleDeleteResource(module.id, lesson.id, resource.id)}
                                                        className="p-1 hover:bg-red-100 rounded transition-colors"
                                                        title="Delete resource"
                                                      >
                                                        <TrashIcon className="h-3 w-3 text-red-600" />
                                                      </button>
                                                    </div>
                                                  </div>
                                                );
                                              })}
                                            </div>
                                          ) : (
                                            <p className="text-xs text-gray-400 italic">No resources added</p>
                                          )}
                                        </div>
                                      </div>
                                    );
                                  })}
                                </div>
                              )}
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            )}

            {/* Activities Tab */}
            {activeTab === 'activities' && (
              <div className="space-y-4">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-semibold text-gray-900">Activities & Assessments</h3>
                  <button className="flex items-center gap-2 px-3 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 transition-colors text-sm">
                    <PlusIcon className="h-4 w-4" />
                    Add Activity
                  </button>
                </div>

                <div className="text-center py-12">
                  <ClipboardDocumentListIcon className="h-12 w-12 text-gray-300 mx-auto mb-3" />
                  <p className="text-gray-600 mb-2">No activities added yet</p>
                  <p className="text-sm text-gray-500 mb-4">
                    Create activities linked to course modules with skill-based rubrics
                  </p>
                  <button className="px-4 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 transition-colors">
                    Create Activity
                  </button>
                </div>
              </div>
            )}

            {/* Skill Mapping Tab */}
            {activeTab === 'skills' && (
              <div className="space-y-6">
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">Skill Passport Alignment</h3>
                  <p className="text-sm text-gray-600 mb-4">
                    This course maps to {course.skillsMapped} out of {course.totalSkills} target skills
                  </p>
                </div>

                {/* Skill Coverage Progress */}
                <div className="p-4 bg-indigo-50 rounded-lg border border-indigo-200">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm font-semibold text-indigo-900">Overall Skill Coverage</span>
                    <span className="text-lg font-bold text-indigo-700">{skillCoverage}%</span>
                  </div>
                  <div className="w-full bg-indigo-200 rounded-full h-3">
                    <div
                      className="bg-indigo-600 h-3 rounded-full transition-all duration-300"
                      style={{ width: `${skillCoverage}%` }}
                    />
                  </div>
                </div>

                {/* Skills List */}
                <div>
                  <h4 className="text-sm font-semibold text-gray-900 mb-3">Covered Skills</h4>
                  <div className="space-y-3">
                    {course.skillsCovered.map((skill) => (
                      <div
                        key={skill}
                        className="p-3 bg-gray-50 rounded-lg border border-gray-200 flex items-center justify-between"
                      >
                        <div className="flex items-center gap-3">
                          <CheckCircleIcon className="h-5 w-5 text-emerald-600" />
                          <span className="text-sm font-medium text-gray-900">{skill}</span>
                        </div>
                        <span className="text-xs text-gray-600">Mapped</span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Mapping Matrix */}
                <div>
                  <h4 className="text-sm font-semibold text-gray-900 mb-3">Module-Skill Mapping Matrix</h4>
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="border-b border-gray-200">
                          <th className="text-left py-2 px-3 font-medium text-gray-700">Module</th>
                          {course.skillsCovered.map((skill) => (
                            <th key={skill} className="text-center py-2 px-3 font-medium text-gray-700 text-xs">
                              {skill}
                            </th>
                          ))}
                        </tr>
                      </thead>
                      <tbody>
                        {course.modules.map((module) => (
                          <tr key={module.id} className="border-b border-gray-100">
                            <td className="py-2 px-3 font-medium text-gray-900">{module.title}</td>
                            {course.skillsCovered.map((skill) => (
                              <td key={skill} className="text-center py-2 px-3">
                                {module.skillTags.includes(skill) ? (
                                  <CheckCircleIcon className="h-5 w-5 text-emerald-600 mx-auto" />
                                ) : (
                                  <span className="text-gray-300">-</span>
                                )}
                              </td>
                            ))}
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
            )}

            {/* Analytics Tab */}
            {activeTab === 'analytics' && (
              <div className="space-y-6">
                <h3 className="text-lg font-semibold text-gray-900">Course Analytics</h3>

                {/* KPI Cards */}
                <div className="grid grid-cols-3 gap-4">
                  <div className="p-4 bg-blue-50 rounded-lg border border-blue-200">
                    <p className="text-xs text-blue-900 font-medium mb-1">Total Enrolled</p>
                    <p className="text-2xl font-bold text-blue-700">{course.enrollmentCount}</p>
                  </div>
                  <div className="p-4 bg-emerald-50 rounded-lg border border-emerald-200">
                    <p className="text-xs text-emerald-900 font-medium mb-1">Completion Rate</p>
                    <p className="text-2xl font-bold text-emerald-700">{course.completionRate}%</p>
                  </div>
                  <div className="p-4 bg-amber-50 rounded-lg border border-amber-200">
                    <p className="text-xs text-amber-900 font-medium mb-1">Evidence Pending</p>
                    <p className="text-2xl font-bold text-amber-700">{course.evidencePending}</p>
                  </div>
                </div>

                {/* Placeholder for Charts */}
                <div className="p-8 bg-gray-50 rounded-lg border border-gray-200 text-center">
                  <ChartBarIcon className="h-12 w-12 text-gray-300 mx-auto mb-3" />
                  <p className="text-gray-600 mb-2">Analytics Dashboard</p>
                  <p className="text-sm text-gray-500">
                    Skill progression heatmap and detailed analytics will appear here
                  </p>
                </div>
              </div>
            )}

            {/* Settings Tab */}
            {activeTab === 'settings' && (
              <div className="space-y-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Course Settings</h3>

                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Course Status</label>
                    <select
                      value={course.status}
                      onChange={(e) => {
                        const updatedCourse = {
                          ...course,
                          status: e.target.value as 'Active' | 'Draft' | 'Upcoming' | 'Archived'
                        };
                        setCourse(updatedCourse);
                        if (onUpdateCourse) {
                          onUpdateCourse(updatedCourse);
                        }
                      }}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                    >
                      <option value="Draft">Draft</option>
                      <option value="Active">Active</option>
                      <option value="Upcoming">Upcoming</option>
                      <option value="Archived">Archived</option>
                    </select>
                    <p className="text-xs text-gray-500 mt-1">Changes are saved automatically</p>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Co-Educators</label>
                    <div className="space-y-2">
                      {course.coEducators && course.coEducators.length > 0 ? (
                        course.coEducators.map((educator, index) => (
                          <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                            <span className="text-sm text-gray-900">{educator}</span>
                            <button className="text-red-600 hover:bg-red-50 p-1 rounded transition-colors">
                              <XMarkIcon className="h-4 w-4" />
                            </button>
                          </div>
                        ))
                      ) : (
                        <p className="text-sm text-gray-500">No co-educators added</p>
                      )}
                      <button className="w-full flex items-center justify-center gap-2 px-3 py-2 border-2 border-dashed border-gray-300 rounded-lg text-gray-600 hover:border-indigo-500 hover:text-indigo-600 transition-colors">
                        <PlusIcon className="h-4 w-4" />
                        Add Co-Educator
                      </button>
                    </div>
                  </div>

                  <div className="pt-4 border-t border-gray-200">
                    <button className="w-full px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors mb-2">
                      Duplicate Course
                    </button>
                    <button className="w-full px-4 py-2 bg-amber-600 text-white rounded-lg hover:bg-amber-700 transition-colors mb-2">
                      {course.status === 'Archived' ? 'Unarchive' : 'Archive'} Course
                    </button>
                    <button className="w-full px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors">
                      Delete Course
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Footer Actions */}
          <div className="border-t border-gray-200 px-6 py-4 bg-gray-50">
            <div className="flex items-center gap-3">
              <button
                onClick={() => onEdit(course)}
                className="flex-1 px-4 py-2.5 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors font-medium"
              >
                Edit Course
              </button>
              <button
                onClick={onClose}
                className="px-4 py-2.5 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors font-medium"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Add Lesson Modal */}
      {showAddLesson && (
        <AddLessonModal
          isOpen={showAddLesson}
          onClose={() => {
            setShowAddLesson(false);
            setEditingLesson(null);
          }}
          onSubmit={handleLessonSubmit}
          editingLesson={editingLesson}
        />
      )}

      {/* Resource Upload Component */}
      {showResourceUpload && (
        <ResourceUploadComponent
          onResourcesAdded={handleResourcesAdded}
          onClose={() => {
            setShowResourceUpload(false);
            setSelectedLessonId(null);
          }}
        />
      )}
    </>
  );
};

export default CourseDetailDrawer;
