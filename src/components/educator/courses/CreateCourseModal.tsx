import React, { useState, useEffect } from 'react';
import { XMarkIcon, PlusIcon, PhotoIcon, CheckIcon } from '@heroicons/react/24/outline';
import { Course, CourseModule } from '../../../types/educator/course';
import ImageUpload from '../../common/ImageUpload';

interface CreateCourseModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (course: Partial<Course>) => void;
  skillCategories: string[];
  classes: string[];
  editingCourse?: Course | null;
}

const CreateCourseModal: React.FC<CreateCourseModalProps> = ({
  isOpen,
  onClose,
  onSubmit,
  skillCategories,
  classes,
  editingCourse,
}) => {
  console.log('=== MODAL RENDERED ===');
  console.log('isOpen:', isOpen);
  console.log('editingCourse:', editingCourse);

  const [courseSource, setCourseSource] = useState<'create' | 'import' | null>(null);
  const [importPlatform, setImportPlatform] = useState<string>('');
  const [currentStep, setCurrentStep] = useState(0);
  const [courseData, setCourseData] = useState<Partial<Course>>({
    title: '',
    code: '',
    description: '',
    duration: '',
    thumbnail: '',
    skillsCovered: [],
    targetOutcomes: [''],
    linkedClasses: [],
    modules: [],
    status: 'Draft',
  });

  // Update courseData when editingCourse changes
  useEffect(() => {
    if (editingCourse) {
      console.log('Setting course data from editingCourse:', editingCourse);
      setCourseSource('create'); // Editing means it's already created
      setCurrentStep(1); // Skip source selection when editing
      setCourseData({
        title: editingCourse.title || '',
        code: editingCourse.code || '',
        description: editingCourse.description || '',
        duration: editingCourse.duration || '',
        thumbnail: editingCourse.thumbnail || '',
        skillsCovered: editingCourse.skillsCovered || [],
        targetOutcomes: editingCourse.targetOutcomes || [''],
        linkedClasses: editingCourse.linkedClasses || [],
        modules: editingCourse.modules || [],
        status: editingCourse.status || 'Draft',
      });
    } else {
      // Reset to empty state for new course
      setCourseSource(null);
      setCurrentStep(0); // Start at source selection
      setImportPlatform('');
      setCourseData({
        title: '',
        code: '',
        description: '',
        duration: '',
        thumbnail: '',
        skillsCovered: [],
        targetOutcomes: [''],
        linkedClasses: [],
        modules: [],
        status: 'Draft',
      });
    }
  }, [editingCourse, isOpen]);

  const [newModule, setNewModule] = useState<Partial<CourseModule>>({
    title: '',
    description: '',
    skillTags: [],
    lessons: [],
    activities: [],
    order: 0,
  });

  if (!isOpen) return null;

  const steps = editingCourse
    ? [
        { number: 1, title: 'Basic Info' },
        { number: 2, title: 'Skill Mapping' },
        { number: 3, title: 'Course Structure' },
        { number: 4, title: 'Confirmation' },
      ]
    : courseSource === 'import'
      ? [
          { number: 0, title: 'Course Source' },
          { number: 1, title: 'Basic Info' },
          { number: 2, title: 'Skill Mapping' },
          { number: 3, title: 'Confirmation' },
        ]
      : [
          { number: 0, title: 'Course Source' },
          { number: 1, title: 'Basic Info' },
          { number: 2, title: 'Skill Mapping' },
          { number: 3, title: 'Course Structure' },
          { number: 4, title: 'Confirmation' },
        ];

  const thirdPartyPlatforms = [
    { id: 'udemy', name: 'Udemy', logo: '📚', color: 'from-purple-500 to-pink-500' },
    { id: 'coursera', name: 'Coursera', logo: '🎓', color: 'from-blue-500 to-cyan-500' },
    { id: 'edx', name: 'edX', logo: '📖', color: 'from-red-500 to-orange-500' },
    { id: 'linkedin', name: 'LinkedIn Learning', logo: '💼', color: 'from-blue-600 to-blue-400' },
    { id: 'skillshare', name: 'Skillshare', logo: '🎨', color: 'from-green-500 to-teal-500' },
    { id: 'google', name: 'Google Courses', logo: '🔍', color: 'from-red-500 to-yellow-500' },
    { id: 'youtube', name: 'YouTube', logo: '▶️', color: 'from-red-600 to-red-400' },
    { id: 'other', name: 'Other Platform', logo: '🌐', color: 'from-gray-500 to-gray-400' },
  ];

  const handleSkillToggle = (skill: string) => {
    console.log('Toggling skill:', skill);
    setCourseData((prev) => {
      const newSkills = prev.skillsCovered?.includes(skill)
        ? prev.skillsCovered.filter((s) => s !== skill)
        : [...(prev.skillsCovered || []), skill];
      console.log('New skills array:', newSkills);
      return {
        ...prev,
        skillsCovered: newSkills,
      };
    });
  };

  const handleClassToggle = (className: string) => {
    console.log('Toggling class:', className);
    setCourseData((prev) => {
      const newClasses = prev.linkedClasses?.includes(className)
        ? prev.linkedClasses.filter((c) => c !== className)
        : [...(prev.linkedClasses || []), className];
      console.log('New classes array:', newClasses);
      return {
        ...prev,
        linkedClasses: newClasses,
      };
    });
  };

  const handleAddOutcome = () => {
    console.log('Adding new outcome');
    setCourseData((prev) => ({
      ...prev,
      targetOutcomes: [...(prev.targetOutcomes || []), ''],
    }));
  };

  const handleUpdateOutcome = (index: number, value: string) => {
    console.log('Updating outcome at index:', index, 'with value:', value);
    setCourseData((prev) => ({
      ...prev,
      targetOutcomes: prev.targetOutcomes?.map((outcome, i) => (i === index ? value : outcome)),
    }));
  };

  const handleRemoveOutcome = (index: number) => {
    console.log('Removing outcome at index:', index);
    setCourseData((prev) => ({
      ...prev,
      targetOutcomes: prev.targetOutcomes?.filter((_, i) => i !== index),
    }));
  };

  const handleAddModule = () => {
    console.log('Adding module:', newModule);
    if (newModule.title && newModule.description) {
      setCourseData((prev) => {
        const newModules = [
          ...(prev.modules || []),
          {
            ...newModule,
            id: `module-${Date.now()}`,
            order: (prev.modules?.length || 0) + 1,
            lessons: [],
            activities: [],
          } as CourseModule,
        ];
        console.log('New modules array:', newModules);
        return {
          ...prev,
          modules: newModules,
        };
      });
      setNewModule({
        title: '',
        description: '',
        skillTags: [],
        lessons: [],
        activities: [],
        order: 0,
      });
    } else {
      console.log('Cannot add module - missing title or description');
    }
  };

  const handleModuleSkillToggle = (skill: string) => {
    console.log('Toggling module skill:', skill);
    setNewModule((prev) => ({
      ...prev,
      skillTags: prev.skillTags?.includes(skill)
        ? prev.skillTags.filter((s) => s !== skill)
        : [...(prev.skillTags || []), skill],
    }));
  };

  const handleSubmit = () => {
    console.log('=== SUBMIT CLICKED ===');
    console.log('Current courseData:', courseData);
    console.log('Calling onSubmit with courseData...');
    onSubmit(courseData);
    console.log('onSubmit completed');
    console.log('Calling onClose...');
    onClose();
    console.log('Calling resetForm...');
    resetForm();
    console.log('=== SUBMIT COMPLETE ===');
  };

  const resetForm = () => {
    console.log('Resetting form');
    setCourseSource(null);
    setImportPlatform('');
    setCourseData({
      title: '',
      code: '',
      description: '',
      duration: '',
      thumbnail: '',
      skillsCovered: [],
      targetOutcomes: [''],
      linkedClasses: [],
      modules: [],
      status: 'Draft',
    });
    setCurrentStep(editingCourse ? 1 : 0);
  };

  const canProceedToNextStep = () => {
    console.log('=== CHECKING IF CAN PROCEED ===');
    console.log('Current step:', currentStep);
    console.log('Course data:', courseData);

    switch (currentStep) {
      case 0: {
        // Step 0: Course source must be selected
        const step0Valid =
          courseSource !== null && (courseSource === 'create' || importPlatform !== '');
        console.log('Step 0 validation:', {
          courseSource,
          importPlatform,
          isValid: step0Valid,
        });
        return step0Valid;
      }
      case 1: {
        const step1Valid =
          courseData.title && courseData.code && courseData.description && courseData.duration;
        console.log('Step 1 validation:', {
          title: courseData.title,
          code: courseData.code,
          description: courseData.description,
          duration: courseData.duration,
          isValid: step1Valid,
        });
        return step1Valid;
      }
      case 2: {
        const step2Valid = (courseData.skillsCovered?.length || 0) > 0;
        console.log('Step 2 validation:', {
          skillsCovered: courseData.skillsCovered,
          count: courseData.skillsCovered?.length || 0,
          isValid: step2Valid,
        });
        return step2Valid;
      }
      case 3:
        console.log('Step 3 validation: always true (optional step)');
        return true; // Optional step
      default:
        console.log('Default validation: true');
        return true;
    }
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-black bg-opacity-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl max-w-4xl w-full max-h-[90vh] overflow-hidden shadow-xl flex flex-col">
        {/* Header */}
        <div className="px-6 py-4 border-b border-gray-200 flex items-center justify-between">
          <div>
            <h2 className="text-xl font-bold text-gray-900">
              {editingCourse ? 'Edit Course' : 'Create New Course'}
            </h2>
            <p className="text-sm text-gray-600 mt-1">
              {editingCourse
                ? `Step ${currentStep} of ${steps.length}: ${steps.find((s) => s.number === currentStep)?.title || ''}`
                : `Step ${currentStep + 1} of ${steps.length}: ${steps.find((s) => s.number === currentStep)?.title || ''}`}
            </p>
          </div>
          <button
            onClick={() => {
              console.log('Close button clicked');
              onClose();
              resetForm();
            }}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <XMarkIcon className="h-6 w-6 text-gray-400" />
          </button>
        </div>

        {/* Progress Steps */}
        <div className="px-6 py-4 bg-gray-50 border-b border-gray-200">
          <div className="flex items-center justify-between">
            {steps.map((step, index) => (
              <React.Fragment key={step.number}>
                <div className="flex items-center">
                  <div
                    className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium transition-colors ${
                      currentStep > step.number
                        ? 'bg-indigo-600 text-white'
                        : currentStep === step.number
                          ? 'bg-indigo-600 text-white'
                          : 'bg-gray-200 text-gray-600'
                    }`}
                  >
                    {currentStep > step.number ? <CheckIcon className="h-5 w-5" /> : step.number}
                  </div>
                  <span
                    className={`ml-2 text-sm font-medium ${
                      currentStep >= step.number ? 'text-gray-900' : 'text-gray-500'
                    }`}
                  >
                    {step.title}
                  </span>
                </div>
                {index < steps.length - 1 && (
                  <div
                    className={`flex-1 h-1 mx-4 rounded transition-colors ${
                      currentStep > step.number ? 'bg-indigo-600' : 'bg-gray-200'
                    }`}
                  />
                )}
              </React.Fragment>
            ))}
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6">
          {/* Step 0: Course Source Selection */}
          {currentStep === 0 && !editingCourse && (
            <div className="space-y-6">
              <div className="text-center mb-8">
                <h3 className="text-2xl font-bold text-gray-900 mb-2">
                  How would you like to add this course?
                </h3>
                <p className="text-gray-600">
                  Choose to create from scratch or import from a third-party platform
                </p>
              </div>

              <div className="grid grid-cols-2 gap-6">
                {/* Create New Course */}
                <button
                  onClick={() => {
                    setCourseSource('create');
                    setCurrentStep(1);
                  }}
                  className={`p-8 rounded-xl border-2 transition-all hover:shadow-lg ${
                    courseSource === 'create'
                      ? 'border-indigo-500 bg-indigo-50'
                      : 'border-gray-200 hover:border-indigo-300'
                  }`}
                >
                  <div className="text-6xl mb-4">✏️</div>
                  <h4 className="text-xl font-semibold text-gray-900 mb-2">Create New Course</h4>
                  <p className="text-sm text-gray-600">
                    Build your own custom course with modules, lessons, and activities from scratch
                  </p>
                </button>

                {/* Import from Platform */}
                <button
                  onClick={() => {
                    setCourseSource('import');
                  }}
                  className={`p-8 rounded-xl border-2 transition-all hover:shadow-lg ${
                    courseSource === 'import'
                      ? 'border-indigo-500 bg-indigo-50'
                      : 'border-gray-200 hover:border-indigo-300'
                  }`}
                >
                  <div className="text-6xl mb-4">📥</div>
                  <h4 className="text-xl font-semibold text-gray-900 mb-2">Import from Platform</h4>
                  <p className="text-sm text-gray-600">
                    Link or import an existing course from Udemy, Coursera, Google, and more
                  </p>
                </button>
              </div>

              {/* Platform Selection (shown when import is selected) */}
              {courseSource === 'import' && (
                <div className="mt-8 p-6 bg-gray-50 rounded-xl border border-gray-200">
                  <h4 className="text-lg font-semibold text-gray-900 mb-4">Select Platform</h4>
                  <div className="grid grid-cols-4 gap-3">
                    {thirdPartyPlatforms.map((platform) => (
                      <button
                        key={platform.id}
                        onClick={() => {
                          setImportPlatform(platform.id);
                        }}
                        className={`p-4 rounded-lg border-2 transition-all ${
                          importPlatform === platform.id
                            ? 'border-indigo-500 bg-white shadow-md'
                            : 'border-gray-200 hover:border-gray-300 bg-white'
                        }`}
                      >
                        <div
                          className={`text-3xl mb-2 bg-gradient-to-br ${platform.color} bg-clip-text text-transparent`}
                        >
                          {platform.logo}
                        </div>
                        <p className="text-xs font-medium text-gray-900">{platform.name}</p>
                      </button>
                    ))}
                  </div>

                  {importPlatform && (
                    <div className="mt-4 space-y-3">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Course URL or ID
                        </label>
                        <input
                          type="text"
                          placeholder={`Enter ${thirdPartyPlatforms.find((p) => p.id === importPlatform)?.name} course URL`}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                        />
                      </div>
                      <button
                        onClick={() => setCurrentStep(1)}
                        className="w-full px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors"
                      >
                        Import Course Details
                      </button>
                    </div>
                  )}
                </div>
              )}
            </div>
          )}

          {/* Step 1: Basic Information */}
          {currentStep === 1 && (
            <div className="space-y-6">
              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Basic Information</h3>
                <div className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Course Title *
                      </label>
                      <input
                        type="text"
                        value={courseData.title}
                        onChange={(e) => {
                          console.log('Title changed:', e.target.value);
                          setCourseData({ ...courseData, title: e.target.value });
                        }}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                        placeholder={editingCourse?.title || 'e.g., Web Development Fundamentals'}
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Course Code *
                      </label>
                      <input
                        type="text"
                        value={courseData.code}
                        onChange={(e) => {
                          console.log('Code changed:', e.target.value);
                          setCourseData({ ...courseData, code: e.target.value });
                        }}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                        placeholder={editingCourse?.code || 'e.g., CS301'}
                      />
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Description *{' '}
                      {editingCourse && courseData.description && (
                        <span className="text-xs text-gray-500">
                          ({courseData.description.length} characters)
                        </span>
                      )}
                    </label>
                    <textarea
                      value={courseData.description}
                      onChange={(e) => {
                        console.log('Description changed:', e.target.value);
                        setCourseData({ ...courseData, description: e.target.value });
                      }}
                      rows={5}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                      placeholder={editingCourse?.description || 'Brief description of the course'}
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Duration *
                      </label>
                      <input
                        type="text"
                        value={courseData.duration}
                        onChange={(e) => {
                          console.log('Duration changed:', e.target.value);
                          setCourseData({ ...courseData, duration: e.target.value });
                        }}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                        placeholder={editingCourse?.duration || 'e.g., 12 weeks'}
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Status *
                      </label>
                      <select
                        value={courseData.status}
                        onChange={(e) => {
                          console.log('Status changed:', e.target.value);
                          setCourseData({
                            ...courseData,
                            status: e.target.value as 'Active' | 'Draft' | 'Upcoming' | 'Archived',
                          });
                        }}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                      >
                        <option value="Draft">Draft</option>
                        <option value="Active">Active</option>
                        <option value="Upcoming">Upcoming</option>
                        <option value="Archived">Archived</option>
                      </select>
                    </div>
                  </div>

                  {/* Image Upload Component */}
                  <ImageUpload
                    currentImage={courseData.thumbnail}
                    onImageChange={(url) => {
                      console.log('Thumbnail URL changed:', url);
                      setCourseData({ ...courseData, thumbnail: url });
                    }}
                    folder="courses"
                    label="Course Thumbnail"
                  />
                </div>
              </div>

              <div>
                <h3 className="text-sm font-semibold text-gray-900 mb-3">
                  Target Learning Outcomes
                </h3>
                <div className="space-y-2">
                  {courseData.targetOutcomes?.map((outcome, index) => (
                    <div key={index} className="flex items-center gap-2">
                      <input
                        type="text"
                        value={outcome}
                        onChange={(e) => handleUpdateOutcome(index, e.target.value)}
                        className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                        placeholder="e.g., Students will be able to..."
                      />
                      {courseData.targetOutcomes!.length > 1 && (
                        <button
                          onClick={() => handleRemoveOutcome(index)}
                          className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                        >
                          <XMarkIcon className="h-5 w-5" />
                        </button>
                      )}
                    </div>
                  ))}
                  <button
                    onClick={handleAddOutcome}
                    className="flex items-center gap-2 px-3 py-2 text-sm text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors"
                  >
                    <PlusIcon className="h-4 w-4" />
                    Add Outcome
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Step 2: Skill Mapping */}
          {currentStep === 2 && (
            <div className="space-y-6">
              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-2">Skill Mapping</h3>
                <p className="text-sm text-gray-600 mb-4">
                  Select skills that students will develop in this course. This links to the Skill
                  Passport.
                </p>
              </div>

              <div>
                <h4 className="text-sm font-semibold text-gray-900 mb-3">
                  Select Skill Categories *
                </h4>
                <div className="grid grid-cols-3 gap-3">
                  {skillCategories.map((skill) => (
                    <button
                      key={skill}
                      onClick={() => handleSkillToggle(skill)}
                      className={`p-3 rounded-lg text-sm font-medium transition-all border-2 ${
                        courseData.skillsCovered?.includes(skill)
                          ? 'bg-indigo-50 text-indigo-700 border-indigo-500'
                          : 'bg-gray-50 text-gray-700 border-gray-200 hover:border-gray-300'
                      }`}
                    >
                      {skill}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <h4 className="text-sm font-semibold text-gray-900 mb-3">Assign to Classes</h4>
                <div className="grid grid-cols-4 gap-2">
                  {classes.map((cls) => (
                    <label
                      key={cls}
                      className="flex items-center gap-2 p-3 border border-gray-200 rounded-lg hover:bg-gray-50 cursor-pointer"
                    >
                      <input
                        type="checkbox"
                        checked={courseData.linkedClasses?.includes(cls)}
                        onChange={() => handleClassToggle(cls)}
                        className="rounded text-indigo-600 focus:ring-indigo-500"
                      />
                      <span className="text-sm text-gray-700">{cls}</span>
                    </label>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* Step 3: Course Structure (skip for imported courses) */}
          {currentStep === 3 && courseSource !== 'import' && (
            <div className="space-y-6">
              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-2">Course Structure</h3>
                <p className="text-sm text-gray-600 mb-4">
                  Add modules and lessons to structure your course content.
                </p>
              </div>

              {/* Existing Modules */}
              {courseData.modules && courseData.modules.length > 0 && (
                <div className="space-y-3">
                  <h4 className="text-sm font-semibold text-gray-900">Modules</h4>
                  {courseData.modules.map((module, index) => (
                    <div
                      key={module.id}
                      className="p-4 bg-gray-50 rounded-lg border border-gray-200"
                    >
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <h5 className="font-semibold text-gray-900">
                            {index + 1}. {module.title}
                          </h5>
                          <p className="text-sm text-gray-600 mt-1">{module.description}</p>
                          <div className="flex flex-wrap gap-1 mt-2">
                            {module.skillTags.map((skill) => (
                              <span
                                key={skill}
                                className="px-2 py-0.5 bg-indigo-100 text-indigo-700 text-xs rounded"
                              >
                                {skill}
                              </span>
                            ))}
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {/* Add New Module */}
              <div className="p-4 bg-indigo-50 rounded-lg border border-indigo-200">
                <h4 className="text-sm font-semibold text-gray-900 mb-3">Add New Module</h4>
                <div className="space-y-3">
                  <input
                    type="text"
                    value={newModule.title}
                    onChange={(e) => {
                      console.log('Module title changed:', e.target.value);
                      setNewModule({ ...newModule, title: e.target.value });
                    }}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                    placeholder="Module title"
                  />
                  <textarea
                    value={newModule.description}
                    onChange={(e) => {
                      console.log('Module description changed:', e.target.value);
                      setNewModule({ ...newModule, description: e.target.value });
                    }}
                    rows={2}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                    placeholder="Module description"
                  />
                  <div>
                    <p className="text-xs font-medium text-gray-700 mb-2">Module Skills</p>
                    <div className="flex flex-wrap gap-2">
                      {courseData.skillsCovered?.map((skill) => (
                        <button
                          key={skill}
                          onClick={() => handleModuleSkillToggle(skill)}
                          className={`px-2 py-1 rounded text-xs font-medium transition-colors ${
                            newModule.skillTags?.includes(skill)
                              ? 'bg-indigo-600 text-white'
                              : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                          }`}
                        >
                          {skill}
                        </button>
                      ))}
                    </div>
                  </div>
                  <button
                    onClick={handleAddModule}
                    disabled={!newModule.title || !newModule.description}
                    className="w-full px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    Add Module
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Step 3 or 4: Confirmation (step 3 for imported, step 4 for created) */}
          {((currentStep === 3 && courseSource === 'import') || currentStep === 4) && (
            <div className="space-y-6">
              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-2">Review & Confirm</h3>
                <p className="text-sm text-gray-600 mb-4">
                  Review your course details before creating.
                </p>
              </div>

              <div className="space-y-4">
                <div className="p-4 bg-gray-50 rounded-lg">
                  <h4 className="text-sm font-semibold text-gray-900 mb-2">Basic Information</h4>
                  <dl className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <dt className="text-gray-600">Title:</dt>
                      <dd className="font-medium text-gray-900">{courseData.title}</dd>
                    </div>
                    <div className="flex justify-between">
                      <dt className="text-gray-600">Code:</dt>
                      <dd className="font-medium text-gray-900">{courseData.code}</dd>
                    </div>
                    <div className="flex justify-between">
                      <dt className="text-gray-600">Duration:</dt>
                      <dd className="font-medium text-gray-900">{courseData.duration}</dd>
                    </div>
                    <div className="flex justify-between">
                      <dt className="text-gray-600">Status:</dt>
                      <dd className="font-medium text-gray-900">
                        <span
                          className={`px-2 py-1 rounded-full text-xs ${
                            courseData.status === 'Active'
                              ? 'bg-emerald-100 text-emerald-700'
                              : courseData.status === 'Upcoming'
                                ? 'bg-blue-100 text-blue-700'
                                : courseData.status === 'Archived'
                                  ? 'bg-amber-100 text-amber-700'
                                  : 'bg-gray-100 text-gray-700'
                          }`}
                        >
                          {courseData.status}
                        </span>
                      </dd>
                    </div>
                  </dl>
                </div>

                <div className="p-4 bg-gray-50 rounded-lg">
                  <h4 className="text-sm font-semibold text-gray-900 mb-2">Skills Covered</h4>
                  <div className="flex flex-wrap gap-2">
                    {courseData.skillsCovered?.map((skill) => (
                      <span
                        key={skill}
                        className="px-2 py-1 bg-indigo-100 text-indigo-700 text-xs rounded"
                      >
                        {skill}
                      </span>
                    ))}
                  </div>
                </div>

                <div className="p-4 bg-gray-50 rounded-lg">
                  <h4 className="text-sm font-semibold text-gray-900 mb-2">Linked Classes</h4>
                  <div className="flex flex-wrap gap-2">
                    {courseData.linkedClasses?.map((cls) => (
                      <span
                        key={cls}
                        className="px-2 py-1 bg-blue-100 text-blue-700 text-xs rounded"
                      >
                        {cls}
                      </span>
                    ))}
                  </div>
                </div>

                <div className="p-4 bg-gray-50 rounded-lg">
                  <h4 className="text-sm font-semibold text-gray-900 mb-2">Course Structure</h4>
                  <p className="text-sm text-gray-600">
                    {courseData.modules?.length || 0} module(s) added
                  </p>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-gray-200 bg-gray-50 flex items-center justify-between">
          <button
            onClick={() => {
              if (currentStep === 0 || (currentStep === 1 && editingCourse)) {
                console.log('Cancel clicked');
                onClose();
                resetForm();
              } else {
                console.log('Back clicked, going to step:', currentStep - 1);
                setCurrentStep(currentStep - 1);
              }
            }}
            className="px-4 py-2 text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
          >
            {currentStep === 0 || (currentStep === 1 && editingCourse) ? 'Cancel' : 'Back'}
          </button>

          <div className="flex items-center gap-3">
            {currentStep < steps[steps.length - 1].number ? (
              <button
                onClick={() => {
                  console.log('Next clicked, going to step:', currentStep + 1);
                  setCurrentStep(currentStep + 1);
                }}
                disabled={!canProceedToNextStep()}
                className="px-6 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed font-medium"
              >
                Next
              </button>
            ) : (
              <button
                onClick={handleSubmit}
                className="px-6 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 transition-colors font-medium"
              >
                {editingCourse ? 'Update Course' : 'Create Course'}
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default CreateCourseModal;
