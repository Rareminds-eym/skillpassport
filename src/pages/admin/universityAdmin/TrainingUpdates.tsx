import React, { useState, useEffect } from 'react';
import {
  AcademicCapIcon,
  PlusCircleIcon,
  EyeIcon,
  PencilSquareIcon,
  TrashIcon,
  MagnifyingGlassIcon,
  XMarkIcon,
  CalendarIcon,
  UserGroupIcon,
  DocumentArrowDownIcon,
  FunnelIcon,
  CheckCircleIcon,
  ClockIcon,
  PaperClipIcon,
  ChartBarIcon,
  ArrowPathIcon,
  ExclamationTriangleIcon,
  PlayIcon,
  BookOpenIcon,
  StarIcon,
  UsersIcon,
  TrophyIcon,
  BellIcon,
} from '@heroicons/react/24/outline';

interface TrainingProgram {
  id: number;
  title: string;
  description: string;
  category:
    | 'technical'
    | 'soft_skills'
    | 'leadership'
    | 'compliance'
    | 'research'
    | 'industry_specific';
  level: 'beginner' | 'intermediate' | 'advanced';
  duration: string;
  format: 'online' | 'offline' | 'hybrid';
  instructor: string;
  instructorProfile: string;
  targetAudience: 'students' | 'faculty' | 'staff' | 'all';
  targetColleges?: string[];
  maxParticipants: number;
  currentEnrollments: number;
  startDate: string;
  endDate: string;
  registrationDeadline: string;
  status: 'upcoming' | 'ongoing' | 'completed' | 'cancelled' | 'draft';
  priority: 'normal' | 'high' | 'urgent';
  prerequisites?: string[];
  learningOutcomes: string[];
  certificationType: 'completion' | 'assessment' | 'none';
  cost: number;
  isApprovalRequired: boolean;
  approvedBy?: string;
  approvedAt?: string;
  createdBy: string;
  createdAt: string;
  attachments?: string[];
  tags: string[];
  rating?: number;
  reviews?: number;
}

interface TrainingUpdate {
  id: number;
  trainingId: number;
  trainingTitle: string;
  updateType:
    | 'announcement'
    | 'schedule_change'
    | 'material_update'
    | 'completion'
    | 'cancellation';
  title: string;
  message: string;
  priority: 'normal' | 'high' | 'urgent';
  timestamp: string;
  isRead: boolean;
  affectedParticipants: number;
  sender: string;
}

interface Analytics {
  totalPrograms: number;
  activePrograms: number;
  completedPrograms: number;
  totalParticipants: number;
  completionRate: number;
  averageRating: number;
  certificatesIssued: number;
  upcomingDeadlines: number;
}

const TrainingUpdates: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'programs' | 'updates' | 'analytics'>('programs');
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showViewModal, setShowViewModal] = useState(false);
  const [selectedProgram, setSelectedProgram] = useState<TrainingProgram | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState<
    'all' | 'upcoming' | 'ongoing' | 'completed' | 'cancelled' | 'draft'
  >('all');
  const [filterCategory, setFilterCategory] = useState<
    | 'all'
    | 'technical'
    | 'soft_skills'
    | 'leadership'
    | 'compliance'
    | 'research'
    | 'industry_specific'
  >('all');
  const [filterLevel, setFilterLevel] = useState<'all' | 'beginner' | 'intermediate' | 'advanced'>(
    'all'
  );
  const [showFilters, setShowFilters] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  // Mock data for colleges
  const [availableColleges] = useState([
    { id: '1', name: 'Government Engineering College', district: 'Mumbai' },
    { id: '2', name: 'Arts & Science College', district: 'Pune' },
    { id: '3', name: 'Medical College', district: 'Nagpur' },
    { id: '4', name: 'Commerce College', district: 'Nashik' },
    { id: '5', name: 'Technology Institute', district: 'Aurangabad' },
  ]);
  const [trainingPrograms, setTrainingPrograms] = useState<TrainingProgram[]>([
    {
      id: 1,
      title: 'Advanced Data Science for Faculty',
      description:
        'Comprehensive training program covering machine learning, AI, and data analytics for faculty members to enhance their teaching capabilities.',
      category: 'technical',
      level: 'advanced',
      duration: '6 weeks',
      format: 'hybrid',
      instructor: 'Dr. Rajesh Kumar',
      instructorProfile: 'Professor of Computer Science, IIT Mumbai',
      targetAudience: 'faculty',
      maxParticipants: 50,
      currentEnrollments: 35,
      startDate: '2025-02-01',
      endDate: '2025-03-15',
      registrationDeadline: '2025-01-25',
      status: 'upcoming',
      priority: 'high',
      prerequisites: ['Basic programming knowledge', 'Statistics fundamentals'],
      learningOutcomes: [
        'Understand machine learning algorithms',
        'Implement data analysis projects',
        'Integrate AI tools in curriculum',
        'Develop research methodologies',
      ],
      certificationType: 'assessment',
      cost: 5000,
      isApprovalRequired: true,
      approvedBy: 'Academic Council',
      approvedAt: '2025-01-10T10:00:00Z',
      createdBy: 'Training Department',
      createdAt: '2025-01-05T09:00:00Z',
      attachments: ['syllabus.pdf', 'prerequisites.pdf'],
      tags: ['AI', 'Machine Learning', 'Faculty Development', 'Research'],
      rating: 4.8,
      reviews: 12,
    },
    {
      id: 2,
      title: 'Leadership Skills for Department Heads',
      description:
        'Essential leadership and management skills training for department heads and senior faculty members.',
      category: 'leadership',
      level: 'intermediate',
      duration: '4 weeks',
      format: 'online',
      instructor: 'Prof. Meera Sharma',
      instructorProfile: 'Management Consultant & Former Dean',
      targetAudience: 'faculty',
      targetColleges: ['1', '2', '3'],
      maxParticipants: 30,
      currentEnrollments: 28,
      startDate: '2025-01-20',
      endDate: '2025-02-17',
      registrationDeadline: '2025-01-15',
      status: 'ongoing',
      priority: 'normal',
      prerequisites: ['Minimum 5 years teaching experience'],
      learningOutcomes: [
        'Develop leadership competencies',
        'Effective team management',
        'Strategic planning skills',
        'Conflict resolution techniques',
      ],
      certificationType: 'completion',
      cost: 3000,
      isApprovalRequired: false,
      createdBy: 'HR Department',
      createdAt: '2024-12-15T14:30:00Z',
      attachments: ['course_outline.pdf'],
      tags: ['Leadership', 'Management', 'Professional Development'],
      rating: 4.5,
      reviews: 8,
    },
    {
      id: 3,
      title: 'Digital Literacy for Students',
      description:
        'Basic to intermediate digital skills training for students across all disciplines.',
      category: 'technical',
      level: 'beginner',
      duration: '3 weeks',
      format: 'online',
      instructor: 'Mr. Amit Patel',
      instructorProfile: 'IT Training Specialist',
      targetAudience: 'students',
      maxParticipants: 200,
      currentEnrollments: 156,
      startDate: '2025-01-15',
      endDate: '2025-02-05',
      registrationDeadline: '2025-01-10',
      status: 'ongoing',
      priority: 'urgent',
      learningOutcomes: [
        'Basic computer operations',
        'Internet safety and ethics',
        'Office productivity tools',
        'Digital communication skills',
      ],
      certificationType: 'assessment',
      cost: 0,
      isApprovalRequired: false,
      createdBy: 'IT Department',
      createdAt: '2024-12-20T11:00:00Z',
      tags: ['Digital Skills', 'Students', 'Basic Training'],
      rating: 4.2,
      reviews: 45,
    },
  ]);

  const [trainingUpdates, setTrainingUpdates] = useState<TrainingUpdate[]>([
    {
      id: 1,
      trainingId: 1,
      trainingTitle: 'Advanced Data Science for Faculty',
      updateType: 'announcement',
      title: 'New Learning Materials Available',
      message:
        'Additional Python programming resources and datasets have been uploaded to the course portal.',
      priority: 'normal',
      timestamp: '2025-01-11T14:30:00Z',
      isRead: false,
      affectedParticipants: 35,
      sender: 'Dr. Rajesh Kumar',
    },
    {
      id: 2,
      trainingId: 2,
      trainingTitle: 'Leadership Skills for Department Heads',
      updateType: 'schedule_change',
      title: 'Session Rescheduled',
      message:
        "Tomorrow's session has been moved from 2 PM to 4 PM due to instructor availability.",
      priority: 'high',
      timestamp: '2025-01-11T12:15:00Z',
      isRead: true,
      affectedParticipants: 28,
      sender: 'Prof. Meera Sharma',
    },
    {
      id: 3,
      trainingId: 3,
      trainingTitle: 'Digital Literacy for Students',
      updateType: 'material_update',
      title: 'Assessment Guidelines Updated',
      message:
        'The final assessment criteria have been updated. Please review the new guidelines in the course materials section.',
      priority: 'urgent',
      timestamp: '2025-01-11T09:00:00Z',
      isRead: false,
      affectedParticipants: 156,
      sender: 'Mr. Amit Patel',
    },
  ]);

  const [analytics] = useState<Analytics>({
    totalPrograms: 15,
    activePrograms: 8,
    completedPrograms: 6,
    totalParticipants: 1250,
    completionRate: 87.5,
    averageRating: 4.4,
    certificatesIssued: 890,
    upcomingDeadlines: 3,
  });
  const [formData, setFormData] = useState<{
    title: string;
    description: string;
    category:
      | 'technical'
      | 'soft_skills'
      | 'leadership'
      | 'compliance'
      | 'research'
      | 'industry_specific';
    level: 'beginner' | 'intermediate' | 'advanced';
    duration: string;
    format: 'online' | 'offline' | 'hybrid';
    instructor: string;
    instructorProfile: string;
    targetAudience: 'students' | 'faculty' | 'staff' | 'all';
    targetColleges: string[];
    maxParticipants: number;
    startDate: string;
    endDate: string;
    registrationDeadline: string;
    prerequisites: string[];
    learningOutcomes: string[];
    certificationType: 'completion' | 'assessment' | 'none';
    cost: number;
    isApprovalRequired: boolean;
    attachments: File[];
    tags: string[];
  }>({
    title: '',
    description: '',
    category: 'technical',
    level: 'beginner',
    duration: '',
    format: 'online',
    instructor: '',
    instructorProfile: '',
    targetAudience: 'all',
    targetColleges: [],
    maxParticipants: 50,
    startDate: '',
    endDate: '',
    registrationDeadline: '',
    prerequisites: [],
    learningOutcomes: [],
    certificationType: 'completion',
    cost: 0,
    isApprovalRequired: false,
    attachments: [],
    tags: [],
  });

  const [formErrors, setFormErrors] = useState<Record<string, string>>({});
  const [newPrerequisite, setNewPrerequisite] = useState('');
  const [newOutcome, setNewOutcome] = useState('');
  const [newTag, setNewTag] = useState('');

  // Auto-refresh updates every 30 seconds
  useEffect(() => {
    const interval = setInterval(() => {
      console.log('Checking for new training updates...');
    }, 30000);

    return () => clearInterval(interval);
  }, []);

  // Helper functions
  const validateForm = () => {
    const errors: Record<string, string> = {};

    if (!formData.title.trim()) {
      errors.title = 'Title is required';
    }

    if (!formData.description.trim()) {
      errors.description = 'Description is required';
    }

    if (!formData.instructor.trim()) {
      errors.instructor = 'Instructor name is required';
    }

    if (!formData.duration.trim()) {
      errors.duration = 'Duration is required';
    }

    if (!formData.startDate) {
      errors.startDate = 'Start date is required';
    }

    if (!formData.endDate) {
      errors.endDate = 'End date is required';
    }

    if (!formData.registrationDeadline) {
      errors.registrationDeadline = 'Registration deadline is required';
    }

    if (
      formData.startDate &&
      formData.endDate &&
      new Date(formData.endDate) < new Date(formData.startDate)
    ) {
      errors.endDate = 'End date must be after start date';
    }

    if (
      formData.registrationDeadline &&
      formData.startDate &&
      new Date(formData.registrationDeadline) > new Date(formData.startDate)
    ) {
      errors.registrationDeadline = 'Registration deadline must be before start date';
    }

    if (formData.maxParticipants <= 0) {
      errors.maxParticipants = 'Maximum participants must be greater than 0';
    }

    if (formData.learningOutcomes.length === 0) {
      errors.learningOutcomes = 'At least one learning outcome is required';
    }

    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleCreateProgram = async () => {
    if (validateForm()) {
      setIsLoading(true);

      // Simulate API call
      await new Promise((resolve) => setTimeout(resolve, 1000));

      const newProgram: TrainingProgram = {
        id: Date.now(),
        title: formData.title,
        description: formData.description,
        category: formData.category,
        level: formData.level,
        duration: formData.duration,
        format: formData.format,
        instructor: formData.instructor,
        instructorProfile: formData.instructorProfile,
        targetAudience: formData.targetAudience,
        targetColleges: formData.targetColleges,
        maxParticipants: formData.maxParticipants,
        currentEnrollments: 0,
        startDate: formData.startDate,
        endDate: formData.endDate,
        registrationDeadline: formData.registrationDeadline,
        status: 'draft',
        priority: 'normal',
        prerequisites: formData.prerequisites,
        learningOutcomes: formData.learningOutcomes,
        certificationType: formData.certificationType,
        cost: formData.cost,
        isApprovalRequired: formData.isApprovalRequired,
        createdBy: 'University Admin',
        createdAt: new Date().toISOString(),
        attachments: formData.attachments.map((file) => file.name),
        tags: formData.tags,
      };

      if (selectedProgram) {
        setTrainingPrograms(
          trainingPrograms.map((program) =>
            program.id === selectedProgram.id ? { ...newProgram, id: selectedProgram.id } : program
          )
        );
      } else {
        setTrainingPrograms([...trainingPrograms, newProgram]);
      }

      setShowCreateModal(false);
      setSelectedProgram(null);
      resetForm();
      setIsLoading(false);
    }
  };
  const resetForm = () => {
    setFormData({
      title: '',
      description: '',
      category: 'technical',
      level: 'beginner',
      duration: '',
      format: 'online',
      instructor: '',
      instructorProfile: '',
      targetAudience: 'all',
      targetColleges: [],
      maxParticipants: 50,
      startDate: '',
      endDate: '',
      registrationDeadline: '',
      prerequisites: [],
      learningOutcomes: [],
      certificationType: 'completion',
      cost: 0,
      isApprovalRequired: false,
      attachments: [],
      tags: [],
    });
    setFormErrors({});
    setNewPrerequisite('');
    setNewOutcome('');
    setNewTag('');
  };

  const handleStatusChange = async (id: number, newStatus: TrainingProgram['status']) => {
    setIsLoading(true);

    // Simulate API call
    await new Promise((resolve) => setTimeout(resolve, 500));

    setTrainingPrograms(
      trainingPrograms.map((program) => {
        if (program.id === id) {
          return {
            ...program,
            status: newStatus,
            ...(newStatus === 'upcoming' && {
              approvedBy: 'University Admin',
              approvedAt: new Date().toISOString(),
            }),
          };
        }
        return program;
      })
    );

    setIsLoading(false);
  };

  const handleDelete = (id: number) => {
    if (window.confirm('Are you sure you want to delete this training program?')) {
      setTrainingPrograms(trainingPrograms.filter((program) => program.id !== id));
    }
  };

  const filteredPrograms = trainingPrograms.filter((program) => {
    const matchesSearch =
      program.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      program.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
      program.instructor.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = filterStatus === 'all' || program.status === filterStatus;
    const matchesCategory = filterCategory === 'all' || program.category === filterCategory;
    const matchesLevel = filterLevel === 'all' || program.level === filterLevel;

    return matchesSearch && matchesStatus && matchesCategory && matchesLevel;
  });

  const formatTimestamp = (timestamp: string) => {
    return new Date(timestamp).toLocaleString();
  };

  const handleMarkAsRead = (updateId: number) => {
    setTrainingUpdates(
      trainingUpdates.map((update) =>
        update.id === updateId ? { ...update, isRead: true } : update
      )
    );
  };

  const handleMarkAllAsRead = () => {
    setTrainingUpdates(trainingUpdates.map((update) => ({ ...update, isRead: true })));
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'urgent':
        return 'bg-red-100 text-red-700 border-red-200';
      case 'high':
        return 'bg-orange-100 text-orange-700 border-orange-200';
      default:
        return 'bg-gray-100 text-gray-700 border-gray-200';
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'upcoming':
        return 'bg-blue-100 text-blue-700 border-blue-200';
      case 'ongoing':
        return 'bg-green-100 text-green-700 border-green-200';
      case 'completed':
        return 'bg-gray-100 text-gray-700 border-gray-200';
      case 'cancelled':
        return 'bg-red-100 text-red-700 border-red-200';
      default:
        return 'bg-yellow-100 text-yellow-700 border-yellow-200';
    }
  };

  const getCategoryColor = (category: string) => {
    switch (category) {
      case 'technical':
        return 'bg-blue-50 text-blue-700';
      case 'leadership':
        return 'bg-purple-50 text-purple-700';
      case 'soft_skills':
        return 'bg-green-50 text-green-700';
      case 'compliance':
        return 'bg-orange-50 text-orange-700';
      case 'research':
        return 'bg-indigo-50 text-indigo-700';
      default:
        return 'bg-gray-50 text-gray-700';
    }
  };

  const getLevelColor = (level: string) => {
    switch (level) {
      case 'beginner':
        return 'bg-green-100 text-green-700';
      case 'intermediate':
        return 'bg-yellow-100 text-yellow-700';
      case 'advanced':
        return 'bg-red-100 text-red-700';
      default:
        return 'bg-gray-100 text-gray-700';
    }
  };

  const addPrerequisite = () => {
    if (newPrerequisite.trim() && !formData.prerequisites.includes(newPrerequisite.trim())) {
      setFormData({
        ...formData,
        prerequisites: [...formData.prerequisites, newPrerequisite.trim()],
      });
      setNewPrerequisite('');
    }
  };

  const removePrerequisite = (index: number) => {
    setFormData({
      ...formData,
      prerequisites: formData.prerequisites.filter((_, i) => i !== index),
    });
  };

  const addLearningOutcome = () => {
    if (newOutcome.trim() && !formData.learningOutcomes.includes(newOutcome.trim())) {
      setFormData({
        ...formData,
        learningOutcomes: [...formData.learningOutcomes, newOutcome.trim()],
      });
      setNewOutcome('');
    }
  };

  const removeLearningOutcome = (index: number) => {
    setFormData({
      ...formData,
      learningOutcomes: formData.learningOutcomes.filter((_, i) => i !== index),
    });
  };

  const addTag = () => {
    if (newTag.trim() && !formData.tags.includes(newTag.trim())) {
      setFormData({
        ...formData,
        tags: [...formData.tags, newTag.trim()],
      });
      setNewTag('');
    }
  };

  const removeTag = (index: number) => {
    setFormData({
      ...formData,
      tags: formData.tags.filter((_, i) => i !== index),
    });
  };
  return (
    <div className="space-y-6 p-4 sm:p-6 lg:p-8">
      {/* Header */}
      <div className="bg-gradient-to-r from-indigo-50 via-blue-50 to-cyan-50 rounded-2xl p-6 border border-indigo-100">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-1">Training Updates</h1>
            <p className="text-gray-600 text-sm sm:text-base">
              Manage training programs, updates, and professional development across the university
              system
            </p>
          </div>
          <div className="hidden sm:flex items-center gap-4">
            <div className="text-center">
              <div className="text-2xl font-bold text-indigo-600">{analytics.activePrograms}</div>
              <div className="text-xs text-gray-500">Active Programs</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-blue-600">{analytics.totalParticipants}</div>
              <div className="text-xs text-gray-500">Participants</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-green-600">{analytics.completionRate}%</div>
              <div className="text-xs text-gray-500">Completion Rate</div>
            </div>
          </div>
        </div>
      </div>

      {/* Tab Navigation */}
      <div className="bg-white rounded-xl border border-gray-200 shadow-sm">
        <div className="border-b border-gray-200">
          <nav className="flex space-x-8 px-6">
            <button
              onClick={() => setActiveTab('programs')}
              className={`py-4 px-1 border-b-2 font-medium text-sm ${
                activeTab === 'programs'
                  ? 'border-indigo-500 text-indigo-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              <div className="flex items-center gap-2">
                <AcademicCapIcon className="h-5 w-5" />
                Training Programs
                <span className="bg-indigo-100 text-indigo-600 text-xs rounded-full px-2 py-1">
                  {trainingPrograms.length}
                </span>
              </div>
            </button>
            <button
              onClick={() => setActiveTab('updates')}
              className={`py-4 px-1 border-b-2 font-medium text-sm ${
                activeTab === 'updates'
                  ? 'border-indigo-500 text-indigo-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              <div className="flex items-center gap-2">
                <BellIcon className="h-5 w-5" />
                Updates & Notifications
                {trainingUpdates.filter((u) => !u.isRead).length > 0 && (
                  <span className="bg-red-500 text-white text-xs rounded-full px-2 py-1">
                    {trainingUpdates.filter((u) => !u.isRead).length}
                  </span>
                )}
              </div>
            </button>
            <button
              onClick={() => setActiveTab('analytics')}
              className={`py-4 px-1 border-b-2 font-medium text-sm ${
                activeTab === 'analytics'
                  ? 'border-indigo-500 text-indigo-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              <div className="flex items-center gap-2">
                <ChartBarIcon className="h-5 w-5" />
                Analytics & Reports
              </div>
            </button>
          </nav>
        </div>

        <div className="p-6">
          {activeTab === 'programs' ? (
            <>
              {/* Programs Header */}
              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
                <div>
                  <h2 className="text-lg font-semibold text-gray-900">
                    Training Programs Management
                  </h2>
                  <p className="text-sm text-gray-500">
                    Create and manage professional development programs
                  </p>
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={() => window.location.reload()}
                    className="flex items-center gap-2 px-3 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition"
                    disabled={isLoading}
                  >
                    <ArrowPathIcon className={`h-4 w-4 ${isLoading ? 'animate-spin' : ''}`} />
                    Refresh
                  </button>
                  <button
                    onClick={() => setShowCreateModal(true)}
                    className="flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition"
                  >
                    <PlusCircleIcon className="h-5 w-5" />
                    Create Program
                  </button>
                </div>
              </div>

              {/* Search and Filters */}
              <div className="flex flex-col sm:flex-row gap-4 mb-6">
                <div className="flex-1 relative">
                  <MagnifyingGlassIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                  <input
                    type="text"
                    placeholder="Search programs by title, instructor, or description..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                  />
                </div>
                <button
                  onClick={() => setShowFilters(!showFilters)}
                  className="flex items-center gap-2 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50"
                >
                  <FunnelIcon className="h-5 w-5" />
                  Filters
                  {(filterStatus !== 'all' ||
                    filterCategory !== 'all' ||
                    filterLevel !== 'all') && (
                    <span className="bg-indigo-100 text-indigo-600 text-xs rounded-full px-2 py-1">
                      Active
                    </span>
                  )}
                </button>
              </div>

              {/* Filter Panel */}
              {showFilters && (
                <div className="bg-gray-50 rounded-lg p-4 mb-6">
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Status</label>
                      <select
                        value={filterStatus}
                        onChange={(e) => setFilterStatus(e.target.value as any)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
                      >
                        <option value="all">All Status</option>
                        <option value="upcoming">Upcoming</option>
                        <option value="ongoing">Ongoing</option>
                        <option value="completed">Completed</option>
                        <option value="cancelled">Cancelled</option>
                        <option value="draft">Draft</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Category
                      </label>
                      <select
                        value={filterCategory}
                        onChange={(e) => setFilterCategory(e.target.value as any)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
                      >
                        <option value="all">All Categories</option>
                        <option value="technical">Technical</option>
                        <option value="soft_skills">Soft Skills</option>
                        <option value="leadership">Leadership</option>
                        <option value="compliance">Compliance</option>
                        <option value="research">Research</option>
                        <option value="industry_specific">Industry Specific</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Level</label>
                      <select
                        value={filterLevel}
                        onChange={(e) => setFilterLevel(e.target.value as any)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
                      >
                        <option value="all">All Levels</option>
                        <option value="beginner">Beginner</option>
                        <option value="intermediate">Intermediate</option>
                        <option value="advanced">Advanced</option>
                      </select>
                    </div>
                  </div>
                  <div className="mt-4 flex gap-2">
                    <button
                      onClick={() => {
                        setFilterStatus('all');
                        setFilterCategory('all');
                        setFilterLevel('all');
                      }}
                      className="px-3 py-1 text-sm bg-gray-200 text-gray-700 rounded hover:bg-gray-300"
                    >
                      Clear Filters
                    </button>
                  </div>
                </div>
              )}
              {/* Programs List */}
              <div className="space-y-4">
                {filteredPrograms.map((program) => (
                  <div
                    key={program.id}
                    className="p-6 border border-gray-200 rounded-lg hover:border-gray-300 transition bg-white"
                  >
                    <div className="flex justify-between items-start">
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-3 flex-wrap">
                          <h3 className="font-semibold text-gray-900 text-lg">{program.title}</h3>
                          <span
                            className={`px-2 py-1 rounded-full text-xs font-medium border ${getStatusColor(program.status)}`}
                          >
                            {program.status}
                          </span>
                          <span
                            className={`px-2 py-1 rounded-full text-xs font-medium ${getCategoryColor(program.category)}`}
                          >
                            {program.category.replace('_', ' ')}
                          </span>
                          <span
                            className={`px-2 py-1 rounded-full text-xs font-medium ${getLevelColor(program.level)}`}
                          >
                            {program.level}
                          </span>
                          {program.priority !== 'normal' && (
                            <span
                              className={`px-2 py-1 rounded-full text-xs font-medium border ${getPriorityColor(program.priority)}`}
                            >
                              {program.priority}
                            </span>
                          )}
                        </div>

                        <p className="text-gray-600 mb-3 line-clamp-2">{program.description}</p>

                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-3">
                          <div className="flex items-center gap-2 text-sm text-gray-600">
                            <UserGroupIcon className="h-4 w-4" />
                            <span>Instructor: {program.instructor}</span>
                          </div>
                          <div className="flex items-center gap-2 text-sm text-gray-600">
                            <ClockIcon className="h-4 w-4" />
                            <span>Duration: {program.duration}</span>
                          </div>
                          <div className="flex items-center gap-2 text-sm text-gray-600">
                            <UsersIcon className="h-4 w-4" />
                            <span>
                              Enrolled: {program.currentEnrollments}/{program.maxParticipants}
                            </span>
                          </div>
                          <div className="flex items-center gap-2 text-sm text-gray-600">
                            <CalendarIcon className="h-4 w-4" />
                            <span>Format: {program.format}</span>
                          </div>
                        </div>

                        <div className="flex items-center gap-4 text-sm text-gray-500 mb-3">
                          <span>Start: {new Date(program.startDate).toLocaleDateString()}</span>
                          <span>End: {new Date(program.endDate).toLocaleDateString()}</span>
                          <span>
                            Registration Deadline:{' '}
                            {new Date(program.registrationDeadline).toLocaleDateString()}
                          </span>
                          {program.cost > 0 && <span>Cost: ₹{program.cost}</span>}
                        </div>

                        {program.tags.length > 0 && (
                          <div className="flex flex-wrap gap-2 mb-3">
                            {program.tags.map((tag, index) => (
                              <span
                                key={index}
                                className="px-2 py-1 bg-gray-100 text-gray-600 text-xs rounded"
                              >
                                {tag}
                              </span>
                            ))}
                          </div>
                        )}

                        {program.rating && (
                          <div className="flex items-center gap-2 text-sm">
                            <div className="flex items-center gap-1">
                              <StarIcon className="h-4 w-4 text-yellow-400 fill-current" />
                              <span className="font-medium">{program.rating}</span>
                            </div>
                            <span className="text-gray-500">({program.reviews} reviews)</span>
                          </div>
                        )}

                        {program.isApprovalRequired && !program.approvedBy && (
                          <div className="mt-2 p-2 bg-yellow-50 border border-yellow-200 rounded text-sm text-yellow-700">
                            ⚠️ Approval required before publishing
                          </div>
                        )}

                        {program.approvedBy && (
                          <p className="text-xs text-green-600 mt-2">
                            ✓ Approved by {program.approvedBy} on{' '}
                            {program.approvedAt
                              ? new Date(program.approvedAt).toLocaleDateString()
                              : 'N/A'}
                          </p>
                        )}
                      </div>

                      <div className="flex gap-2 ml-4">
                        <button
                          onClick={() => {
                            setSelectedProgram(program);
                            setShowViewModal(true);
                          }}
                          className="p-2 text-indigo-600 hover:bg-indigo-50 rounded"
                          title="View Details"
                        >
                          <EyeIcon className="h-5 w-5" />
                        </button>
                        <button
                          onClick={() => {
                            setSelectedProgram(program);
                            setFormData({
                              title: program.title,
                              description: program.description,
                              category: program.category,
                              level: program.level,
                              duration: program.duration,
                              format: program.format,
                              instructor: program.instructor,
                              instructorProfile: program.instructorProfile,
                              targetAudience: program.targetAudience,
                              targetColleges: program.targetColleges || [],
                              maxParticipants: program.maxParticipants,
                              startDate: program.startDate,
                              endDate: program.endDate,
                              registrationDeadline: program.registrationDeadline,
                              prerequisites: program.prerequisites || [],
                              learningOutcomes: program.learningOutcomes,
                              certificationType: program.certificationType,
                              cost: program.cost,
                              isApprovalRequired: program.isApprovalRequired,
                              attachments: [],
                              tags: program.tags,
                            });
                            setShowCreateModal(true);
                          }}
                          className="p-2 text-green-600 hover:bg-green-50 rounded"
                          title="Edit"
                        >
                          <PencilSquareIcon className="h-5 w-5" />
                        </button>

                        {program.status === 'draft' && (
                          <button
                            onClick={() => handleStatusChange(program.id, 'upcoming')}
                            className="p-2 text-blue-600 hover:bg-blue-50 rounded"
                            title="Publish Program"
                            disabled={isLoading}
                          >
                            <PlayIcon className="h-5 w-5" />
                          </button>
                        )}

                        {program.status === 'upcoming' && (
                          <button
                            onClick={() => handleStatusChange(program.id, 'ongoing')}
                            className="p-2 text-green-600 hover:bg-green-50 rounded"
                            title="Start Program"
                            disabled={isLoading}
                          >
                            <CheckCircleIcon className="h-5 w-5" />
                          </button>
                        )}

                        {program.status === 'ongoing' && (
                          <button
                            onClick={() => handleStatusChange(program.id, 'completed')}
                            className="p-2 text-purple-600 hover:bg-purple-50 rounded"
                            title="Complete Program"
                            disabled={isLoading}
                          >
                            <TrophyIcon className="h-5 w-5" />
                          </button>
                        )}

                        <button
                          onClick={() => handleDelete(program.id)}
                          className="p-2 text-red-600 hover:bg-red-50 rounded"
                          title="Delete"
                        >
                          <TrashIcon className="h-5 w-5" />
                        </button>
                      </div>
                    </div>
                  </div>
                ))}

                {filteredPrograms.length === 0 && (
                  <div className="text-center py-12 text-gray-500">
                    <AcademicCapIcon className="h-12 w-12 mx-auto mb-4 text-gray-300" />
                    <p className="text-lg font-medium mb-2">No training programs found</p>
                    <p className="text-sm">
                      Try adjusting your search criteria or create a new program.
                    </p>
                  </div>
                )}
              </div>
            </>
          ) : activeTab === 'updates' ? (
            <>
              {/* Updates Tab */}
              <div className="mb-6">
                <div className="flex justify-between items-center mb-4">
                  <div>
                    <h2 className="text-lg font-semibold text-gray-900">
                      Training Updates & Notifications
                    </h2>
                    <p className="text-sm text-gray-500">
                      Real-time updates from training programs and instructors
                    </p>
                  </div>
                  {trainingUpdates.filter((u) => !u.isRead).length > 0 && (
                    <button
                      onClick={handleMarkAllAsRead}
                      className="flex items-center gap-2 px-3 py-1 text-sm bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition"
                    >
                      <CheckCircleIcon className="h-4 w-4" />
                      Mark All as Read
                    </button>
                  )}
                </div>

                <div className="space-y-3">
                  {trainingUpdates.map((update) => (
                    <div
                      key={update.id}
                      className={`p-4 border rounded-lg transition ${
                        update.isRead
                          ? 'border-gray-200 bg-white'
                          : 'border-indigo-200 bg-indigo-50'
                      }`}
                    >
                      <div className="flex justify-between items-start">
                        <div className="flex-1">
                          <div className="flex items-center gap-3 mb-2">
                            <h3
                              className={`font-semibold ${update.isRead ? 'text-gray-900' : 'text-indigo-900'}`}
                            >
                              {update.title}
                            </h3>
                            <span
                              className={`px-2 py-1 rounded-full text-xs font-medium ${
                                update.updateType === 'announcement'
                                  ? 'bg-blue-100 text-blue-700'
                                  : update.updateType === 'schedule_change'
                                    ? 'bg-yellow-100 text-yellow-700'
                                    : update.updateType === 'material_update'
                                      ? 'bg-green-100 text-green-700'
                                      : update.updateType === 'completion'
                                        ? 'bg-purple-100 text-purple-700'
                                        : 'bg-red-100 text-red-700'
                              }`}
                            >
                              {update.updateType.replace('_', ' ')}
                            </span>
                            <span
                              className={`px-2 py-1 rounded-full text-xs font-medium border ${getPriorityColor(update.priority)}`}
                            >
                              {update.priority}
                            </span>
                            {!update.isRead && (
                              <span className="w-2 h-2 bg-indigo-500 rounded-full"></span>
                            )}
                          </div>
                          <p className="text-sm text-gray-600 mb-2">{update.message}</p>
                          <div className="flex items-center gap-4 text-xs text-gray-500">
                            <span>Training: {update.trainingTitle}</span>
                            <span>From: {update.sender}</span>
                            <span>{formatTimestamp(update.timestamp)}</span>
                            <span>Affects {update.affectedParticipants} participants</span>
                          </div>
                        </div>
                        <div className="flex gap-2">
                          {!update.isRead && (
                            <button
                              onClick={() => handleMarkAsRead(update.id)}
                              className="p-2 text-indigo-600 hover:bg-indigo-50 rounded"
                              title="Mark as read"
                            >
                              <CheckCircleIcon className="h-5 w-5" />
                            </button>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}

                  {trainingUpdates.length === 0 && (
                    <div className="text-center py-12 text-gray-500">
                      <BellIcon className="h-12 w-12 mx-auto mb-4 text-gray-300" />
                      <p className="text-lg font-medium mb-2">No updates available</p>
                      <p className="text-sm">
                        Training updates and notifications will appear here.
                      </p>
                    </div>
                  )}
                </div>
              </div>
            </>
          ) : (
            <>
              {/* Analytics Tab */}
              <div className="space-y-6">
                <div>
                  <h2 className="text-lg font-semibold text-gray-900 mb-1">
                    Training Analytics & Reports
                  </h2>
                  <p className="text-sm text-gray-500">
                    Track training effectiveness and participant engagement
                  </p>
                </div>

                {/* Key Metrics */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                  <div className="bg-white p-6 rounded-lg border border-gray-200">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm font-medium text-gray-600">Total Programs</p>
                        <p className="text-2xl font-bold text-gray-900">
                          {analytics.totalPrograms}
                        </p>
                      </div>
                      <AcademicCapIcon className="h-8 w-8 text-indigo-600" />
                    </div>
                    <div className="mt-2 flex items-center text-sm">
                      <span className="text-green-600">+3</span>
                      <span className="text-gray-500 ml-1">this month</span>
                    </div>
                  </div>

                  <div className="bg-white p-6 rounded-lg border border-gray-200">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm font-medium text-gray-600">Active Programs</p>
                        <p className="text-2xl font-bold text-green-600">
                          {analytics.activePrograms}
                        </p>
                      </div>
                      <PlayIcon className="h-8 w-8 text-green-600" />
                    </div>
                    <div className="mt-2 flex items-center text-sm">
                      <span className="text-gray-500">
                        {((analytics.activePrograms / analytics.totalPrograms) * 100).toFixed(1)}%
                        of total
                      </span>
                    </div>
                  </div>

                  <div className="bg-white p-6 rounded-lg border border-gray-200">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm font-medium text-gray-600">Total Participants</p>
                        <p className="text-2xl font-bold text-blue-600">
                          {analytics.totalParticipants.toLocaleString()}
                        </p>
                      </div>
                      <UsersIcon className="h-8 w-8 text-blue-600" />
                    </div>
                    <div className="mt-2 flex items-center text-sm">
                      <span className="text-blue-600">Across all programs</span>
                    </div>
                  </div>

                  <div className="bg-white p-6 rounded-lg border border-gray-200">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm font-medium text-gray-600">Completion Rate</p>
                        <p className="text-2xl font-bold text-purple-600">
                          {analytics.completionRate}%
                        </p>
                      </div>
                      <TrophyIcon className="h-8 w-8 text-purple-600" />
                    </div>
                    <div className="mt-2 flex items-center text-sm">
                      <span className="text-green-600">+2.3%</span>
                      <span className="text-gray-500 ml-1">vs last quarter</span>
                    </div>
                  </div>
                </div>

                {/* Additional Metrics */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <div className="bg-white p-6 rounded-lg border border-gray-200">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm font-medium text-gray-600">Average Rating</p>
                        <p className="text-2xl font-bold text-yellow-600">
                          {analytics.averageRating}
                        </p>
                      </div>
                      <StarIcon className="h-8 w-8 text-yellow-600" />
                    </div>
                    <div className="mt-2 flex items-center text-sm">
                      <span className="text-gray-500">Out of 5.0</span>
                    </div>
                  </div>

                  <div className="bg-white p-6 rounded-lg border border-gray-200">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm font-medium text-gray-600">Certificates Issued</p>
                        <p className="text-2xl font-bold text-indigo-600">
                          {analytics.certificatesIssued}
                        </p>
                      </div>
                      <AcademicCapIcon className="h-8 w-8 text-indigo-600" />
                    </div>
                    <div className="mt-2 flex items-center text-sm">
                      <span className="text-green-600">+45</span>
                      <span className="text-gray-500 ml-1">this month</span>
                    </div>
                  </div>

                  <div className="bg-white p-6 rounded-lg border border-gray-200">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm font-medium text-gray-600">Upcoming Deadlines</p>
                        <p className="text-2xl font-bold text-red-600">
                          {analytics.upcomingDeadlines}
                        </p>
                      </div>
                      <ExclamationTriangleIcon className="h-8 w-8 text-red-600" />
                    </div>
                    <div className="mt-2 flex items-center text-sm">
                      <span className="text-gray-500">Next 7 days</span>
                    </div>
                  </div>
                </div>

                {/* Program Status Breakdown */}
                <div className="bg-white p-6 rounded-lg border border-gray-200">
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">
                    Program Status Overview
                  </h3>
                  <div className="grid grid-cols-2 sm:grid-cols-5 gap-4">
                    <div className="text-center p-4 bg-blue-50 rounded-lg">
                      <div className="text-2xl font-bold text-blue-600">
                        {trainingPrograms.filter((p) => p.status === 'upcoming').length}
                      </div>
                      <div className="text-sm text-blue-700">Upcoming</div>
                    </div>
                    <div className="text-center p-4 bg-green-50 rounded-lg">
                      <div className="text-2xl font-bold text-green-600">
                        {trainingPrograms.filter((p) => p.status === 'ongoing').length}
                      </div>
                      <div className="text-sm text-green-700">Ongoing</div>
                    </div>
                    <div className="text-center p-4 bg-gray-50 rounded-lg">
                      <div className="text-2xl font-bold text-gray-600">
                        {trainingPrograms.filter((p) => p.status === 'completed').length}
                      </div>
                      <div className="text-sm text-gray-700">Completed</div>
                    </div>
                    <div className="text-center p-4 bg-yellow-50 rounded-lg">
                      <div className="text-2xl font-bold text-yellow-600">
                        {trainingPrograms.filter((p) => p.status === 'draft').length}
                      </div>
                      <div className="text-sm text-yellow-700">Drafts</div>
                    </div>
                    <div className="text-center p-4 bg-red-50 rounded-lg">
                      <div className="text-2xl font-bold text-red-600">
                        {trainingPrograms.filter((p) => p.status === 'cancelled').length}
                      </div>
                      <div className="text-sm text-red-700">Cancelled</div>
                    </div>
                  </div>
                </div>

                {/* Category Distribution */}
                <div className="bg-white p-6 rounded-lg border border-gray-200">
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">Training Categories</h3>
                  <div className="space-y-3">
                    {[
                      {
                        name: 'Technical',
                        count: trainingPrograms.filter((p) => p.category === 'technical').length,
                        color: 'bg-blue-500',
                      },
                      {
                        name: 'Leadership',
                        count: trainingPrograms.filter((p) => p.category === 'leadership').length,
                        color: 'bg-purple-500',
                      },
                      {
                        name: 'Soft Skills',
                        count: trainingPrograms.filter((p) => p.category === 'soft_skills').length,
                        color: 'bg-green-500',
                      },
                      {
                        name: 'Compliance',
                        count: trainingPrograms.filter((p) => p.category === 'compliance').length,
                        color: 'bg-orange-500',
                      },
                      {
                        name: 'Research',
                        count: trainingPrograms.filter((p) => p.category === 'research').length,
                        color: 'bg-indigo-500',
                      },
                      {
                        name: 'Industry Specific',
                        count: trainingPrograms.filter((p) => p.category === 'industry_specific')
                          .length,
                        color: 'bg-gray-500',
                      },
                    ].map((category) => (
                      <div key={category.name} className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <div className={`w-3 h-3 rounded-full ${category.color}`}></div>
                          <span className="text-sm font-medium text-gray-700">{category.name}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <span className="text-sm text-gray-600">{category.count}</span>
                          <div className="w-20 bg-gray-200 rounded-full h-2">
                            <div
                              className={`h-2 rounded-full ${category.color}`}
                              style={{
                                width: `${trainingPrograms.length > 0 ? (category.count / trainingPrograms.length) * 100 : 0}%`,
                              }}
                            ></div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </>
          )}
        </div>
      </div>
      {/* Create/Edit Program Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b border-gray-200">
              <div className="flex justify-between items-center">
                <h3 className="text-lg font-semibold text-gray-900">
                  {selectedProgram ? 'Edit Training Program' : 'Create New Training Program'}
                </h3>
                <button
                  onClick={() => {
                    setShowCreateModal(false);
                    setSelectedProgram(null);
                    resetForm();
                  }}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <XMarkIcon className="h-6 w-6" />
                </button>
              </div>
            </div>

            <div className="p-6 space-y-6">
              {/* Basic Information */}
              <div className="space-y-4">
                <h4 className="text-md font-semibold text-gray-900">Basic Information</h4>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Program Title *
                  </label>
                  <input
                    type="text"
                    value={formData.title}
                    onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                    className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-indigo-500 ${
                      formErrors.title ? 'border-red-300' : 'border-gray-300'
                    }`}
                    placeholder="Enter a clear and descriptive title"
                  />
                  {formErrors.title && (
                    <p className="text-red-600 text-sm mt-1">{formErrors.title}</p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Description *
                  </label>
                  <textarea
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    rows={4}
                    className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-indigo-500 ${
                      formErrors.description ? 'border-red-300' : 'border-gray-300'
                    }`}
                    placeholder="Provide a detailed description of the training program"
                  />
                  {formErrors.description && (
                    <p className="text-red-600 text-sm mt-1">{formErrors.description}</p>
                  )}
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Category *
                    </label>
                    <select
                      value={formData.category}
                      onChange={(e) =>
                        setFormData({ ...formData, category: e.target.value as any })
                      }
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
                    >
                      <option value="technical">Technical</option>
                      <option value="soft_skills">Soft Skills</option>
                      <option value="leadership">Leadership</option>
                      <option value="compliance">Compliance</option>
                      <option value="research">Research</option>
                      <option value="industry_specific">Industry Specific</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Level *</label>
                    <select
                      value={formData.level}
                      onChange={(e) => setFormData({ ...formData, level: e.target.value as any })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
                    >
                      <option value="beginner">Beginner</option>
                      <option value="intermediate">Intermediate</option>
                      <option value="advanced">Advanced</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Format *</label>
                    <select
                      value={formData.format}
                      onChange={(e) => setFormData({ ...formData, format: e.target.value as any })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
                    >
                      <option value="online">Online</option>
                      <option value="offline">Offline</option>
                      <option value="hybrid">Hybrid</option>
                    </select>
                  </div>
                </div>
              </div>

              {/* Instructor Information */}
              <div className="space-y-4">
                <h4 className="text-md font-semibold text-gray-900">Instructor Information</h4>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Instructor Name *
                    </label>
                    <input
                      type="text"
                      value={formData.instructor}
                      onChange={(e) => setFormData({ ...formData, instructor: e.target.value })}
                      className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-indigo-500 ${
                        formErrors.instructor ? 'border-red-300' : 'border-gray-300'
                      }`}
                      placeholder="Enter instructor name"
                    />
                    {formErrors.instructor && (
                      <p className="text-red-600 text-sm mt-1">{formErrors.instructor}</p>
                    )}
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Instructor Profile
                    </label>
                    <input
                      type="text"
                      value={formData.instructorProfile}
                      onChange={(e) =>
                        setFormData({ ...formData, instructorProfile: e.target.value })
                      }
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
                      placeholder="Brief profile or credentials"
                    />
                  </div>
                </div>
              </div>

              {/* Program Details */}
              <div className="space-y-4">
                <h4 className="text-md font-semibold text-gray-900">Program Details</h4>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Duration *
                    </label>
                    <input
                      type="text"
                      value={formData.duration}
                      onChange={(e) => setFormData({ ...formData, duration: e.target.value })}
                      className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-indigo-500 ${
                        formErrors.duration ? 'border-red-300' : 'border-gray-300'
                      }`}
                      placeholder="e.g., 4 weeks, 2 months"
                    />
                    {formErrors.duration && (
                      <p className="text-red-600 text-sm mt-1">{formErrors.duration}</p>
                    )}
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Max Participants *
                    </label>
                    <input
                      type="number"
                      value={formData.maxParticipants}
                      onChange={(e) =>
                        setFormData({ ...formData, maxParticipants: parseInt(e.target.value) || 0 })
                      }
                      className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-indigo-500 ${
                        formErrors.maxParticipants ? 'border-red-300' : 'border-gray-300'
                      }`}
                      min="1"
                    />
                    {formErrors.maxParticipants && (
                      <p className="text-red-600 text-sm mt-1">{formErrors.maxParticipants}</p>
                    )}
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Cost (₹)</label>
                    <input
                      type="number"
                      value={formData.cost}
                      onChange={(e) =>
                        setFormData({ ...formData, cost: parseInt(e.target.value) || 0 })
                      }
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
                      min="0"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Target Audience *
                  </label>
                  <select
                    value={formData.targetAudience}
                    onChange={(e) =>
                      setFormData({ ...formData, targetAudience: e.target.value as any })
                    }
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
                  >
                    <option value="all">All (Students, Faculty, Staff)</option>
                    <option value="students">Students Only</option>
                    <option value="faculty">Faculty Only</option>
                    <option value="staff">Staff Only</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Certificate Type
                  </label>
                  <select
                    value={formData.certificationType}
                    onChange={(e) =>
                      setFormData({ ...formData, certificationType: e.target.value as any })
                    }
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
                  >
                    <option value="completion">Completion Certificate</option>
                    <option value="assessment">Assessment-based Certificate</option>
                    <option value="none">No Certificate</option>
                  </select>
                </div>
              </div>

              {/* Dates */}
              <div className="space-y-4">
                <h4 className="text-md font-semibold text-gray-900">Schedule</h4>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Start Date *
                    </label>
                    <input
                      type="date"
                      value={formData.startDate}
                      onChange={(e) => setFormData({ ...formData, startDate: e.target.value })}
                      min={new Date().toISOString().split('T')[0]}
                      className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-indigo-500 ${
                        formErrors.startDate ? 'border-red-300' : 'border-gray-300'
                      }`}
                    />
                    {formErrors.startDate && (
                      <p className="text-red-600 text-sm mt-1">{formErrors.startDate}</p>
                    )}
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      End Date *
                    </label>
                    <input
                      type="date"
                      value={formData.endDate}
                      onChange={(e) => setFormData({ ...formData, endDate: e.target.value })}
                      min={formData.startDate || new Date().toISOString().split('T')[0]}
                      className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-indigo-500 ${
                        formErrors.endDate ? 'border-red-300' : 'border-gray-300'
                      }`}
                    />
                    {formErrors.endDate && (
                      <p className="text-red-600 text-sm mt-1">{formErrors.endDate}</p>
                    )}
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Registration Deadline *
                    </label>
                    <input
                      type="date"
                      value={formData.registrationDeadline}
                      onChange={(e) =>
                        setFormData({ ...formData, registrationDeadline: e.target.value })
                      }
                      max={formData.startDate || undefined}
                      className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-indigo-500 ${
                        formErrors.registrationDeadline ? 'border-red-300' : 'border-gray-300'
                      }`}
                    />
                    {formErrors.registrationDeadline && (
                      <p className="text-red-600 text-sm mt-1">{formErrors.registrationDeadline}</p>
                    )}
                  </div>
                </div>
              </div>

              {/* Prerequisites */}
              <div className="space-y-4">
                <h4 className="text-md font-semibold text-gray-900">Prerequisites</h4>

                <div className="flex gap-2">
                  <input
                    type="text"
                    value={newPrerequisite}
                    onChange={(e) => setNewPrerequisite(e.target.value)}
                    className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
                    placeholder="Add a prerequisite"
                    onKeyPress={(e) => e.key === 'Enter' && addPrerequisite()}
                  />
                  <button
                    type="button"
                    onClick={addPrerequisite}
                    className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700"
                  >
                    Add
                  </button>
                </div>

                {formData.prerequisites.length > 0 && (
                  <div className="space-y-2">
                    {formData.prerequisites.map((prerequisite, index) => (
                      <div key={index} className="flex items-center gap-2 p-2 bg-gray-50 rounded">
                        <span className="flex-1 text-sm">{prerequisite}</span>
                        <button
                          type="button"
                          onClick={() => removePrerequisite(index)}
                          className="text-red-600 hover:text-red-800"
                        >
                          <XMarkIcon className="h-4 w-4" />
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Learning Outcomes */}
              <div className="space-y-4">
                <h4 className="text-md font-semibold text-gray-900">Learning Outcomes *</h4>

                <div className="flex gap-2">
                  <input
                    type="text"
                    value={newOutcome}
                    onChange={(e) => setNewOutcome(e.target.value)}
                    className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
                    placeholder="Add a learning outcome"
                    onKeyPress={(e) => e.key === 'Enter' && addLearningOutcome()}
                  />
                  <button
                    type="button"
                    onClick={addLearningOutcome}
                    className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700"
                  >
                    Add
                  </button>
                </div>

                {formData.learningOutcomes.length > 0 && (
                  <div className="space-y-2">
                    {formData.learningOutcomes.map((outcome, index) => (
                      <div key={index} className="flex items-center gap-2 p-2 bg-gray-50 rounded">
                        <span className="flex-1 text-sm">{outcome}</span>
                        <button
                          type="button"
                          onClick={() => removeLearningOutcome(index)}
                          className="text-red-600 hover:text-red-800"
                        >
                          <XMarkIcon className="h-4 w-4" />
                        </button>
                      </div>
                    ))}
                  </div>
                )}

                {formErrors.learningOutcomes && (
                  <p className="text-red-600 text-sm">{formErrors.learningOutcomes}</p>
                )}
              </div>

              {/* Tags */}
              <div className="space-y-4">
                <h4 className="text-md font-semibold text-gray-900">Tags</h4>

                <div className="flex gap-2">
                  <input
                    type="text"
                    value={newTag}
                    onChange={(e) => setNewTag(e.target.value)}
                    className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
                    placeholder="Add a tag"
                    onKeyPress={(e) => e.key === 'Enter' && addTag()}
                  />
                  <button
                    type="button"
                    onClick={addTag}
                    className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700"
                  >
                    Add
                  </button>
                </div>

                {formData.tags.length > 0 && (
                  <div className="flex flex-wrap gap-2">
                    {formData.tags.map((tag, index) => (
                      <div
                        key={index}
                        className="flex items-center gap-1 px-2 py-1 bg-indigo-100 text-indigo-700 rounded text-sm"
                      >
                        <span>{tag}</span>
                        <button
                          type="button"
                          onClick={() => removeTag(index)}
                          className="text-indigo-600 hover:text-indigo-800"
                        >
                          <XMarkIcon className="h-3 w-3" />
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Attachments */}
              <div className="space-y-4">
                <h4 className="text-md font-semibold text-gray-900">Attachments</h4>

                <input
                  type="file"
                  multiple
                  accept=".pdf,.doc,.docx,.ppt,.pptx,.xls,.xlsx,.jpg,.jpeg,.png,.txt"
                  onChange={(e) =>
                    setFormData({ ...formData, attachments: Array.from(e.target.files || []) })
                  }
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
                />
                <p className="text-xs text-gray-500">
                  Supported formats: PDF, DOC, DOCX, PPT, PPTX, XLS, XLSX, JPG, PNG, TXT (Max 10MB
                  per file)
                </p>

                {formData.attachments.length > 0 && (
                  <div className="space-y-2">
                    <p className="text-sm font-medium text-gray-700">Selected files:</p>
                    {formData.attachments.map((file, index) => (
                      <div key={index} className="flex items-center gap-2 p-2 bg-gray-50 rounded">
                        <PaperClipIcon className="h-4 w-4 text-gray-500" />
                        <span className="text-sm text-gray-700">{file.name}</span>
                        <span className="text-xs text-gray-500">
                          ({(file.size / 1024 / 1024).toFixed(2)} MB)
                        </span>
                        <button
                          type="button"
                          onClick={() => {
                            const newAttachments = formData.attachments.filter(
                              (_, i) => i !== index
                            );
                            setFormData({ ...formData, attachments: newAttachments });
                          }}
                          className="ml-auto text-red-600 hover:text-red-800"
                        >
                          <XMarkIcon className="h-4 w-4" />
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Advanced Options */}
              <div className="border-t border-gray-200 pt-6">
                <h4 className="text-md font-semibold text-gray-900 mb-4">Advanced Options</h4>
                <div className="space-y-4">
                  <label className="flex items-center gap-3">
                    <input
                      type="checkbox"
                      checked={formData.isApprovalRequired}
                      onChange={(e) =>
                        setFormData({ ...formData, isApprovalRequired: e.target.checked })
                      }
                      className="rounded border-gray-300 text-indigo-600 focus:ring-indigo-500"
                    />
                    <div>
                      <div className="text-sm font-medium text-gray-900">Requires Approval</div>
                      <div className="text-xs text-gray-500">
                        Program will need approval before publishing
                      </div>
                    </div>
                  </label>
                </div>
              </div>
            </div>

            <div className="p-6 border-t border-gray-200 flex justify-end gap-3">
              <button
                onClick={() => {
                  setShowCreateModal(false);
                  setSelectedProgram(null);
                  resetForm();
                }}
                className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                onClick={handleCreateProgram}
                disabled={isLoading}
                className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 disabled:opacity-50"
              >
                {isLoading ? 'Saving...' : selectedProgram ? 'Update Program' : 'Create Program'}
              </button>
            </div>
          </div>
        </div>
      )}
      {/* View Program Modal */}
      {showViewModal && selectedProgram && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b border-gray-200">
              <div className="flex justify-between items-center">
                <h3 className="text-lg font-semibold text-gray-900">Training Program Details</h3>
                <button
                  onClick={() => {
                    setShowViewModal(false);
                    setSelectedProgram(null);
                  }}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <XMarkIcon className="h-6 w-6" />
                </button>
              </div>
            </div>

            <div className="p-6 space-y-6">
              {/* Program Header */}
              <div className="bg-gradient-to-r from-indigo-50 to-blue-50 p-6 rounded-lg">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <h2 className="text-2xl font-bold text-gray-900 mb-2">
                      {selectedProgram.title}
                    </h2>
                    <p className="text-gray-600 mb-4">{selectedProgram.description}</p>

                    <div className="flex flex-wrap gap-2 mb-4">
                      <span
                        className={`px-3 py-1 rounded-full text-sm font-medium border ${getStatusColor(selectedProgram.status)}`}
                      >
                        {selectedProgram.status}
                      </span>
                      <span
                        className={`px-3 py-1 rounded-full text-sm font-medium ${getCategoryColor(selectedProgram.category)}`}
                      >
                        {selectedProgram.category.replace('_', ' ')}
                      </span>
                      <span
                        className={`px-3 py-1 rounded-full text-sm font-medium ${getLevelColor(selectedProgram.level)}`}
                      >
                        {selectedProgram.level}
                      </span>
                      {selectedProgram.priority !== 'normal' && (
                        <span
                          className={`px-3 py-1 rounded-full text-sm font-medium border ${getPriorityColor(selectedProgram.priority)}`}
                        >
                          {selectedProgram.priority}
                        </span>
                      )}
                    </div>

                    {selectedProgram.rating && (
                      <div className="flex items-center gap-2">
                        <div className="flex items-center gap-1">
                          <StarIcon className="h-5 w-5 text-yellow-400 fill-current" />
                          <span className="font-semibold">{selectedProgram.rating}</span>
                        </div>
                        <span className="text-gray-500">({selectedProgram.reviews} reviews)</span>
                      </div>
                    )}
                  </div>

                  <div className="text-right">
                    <div className="text-3xl font-bold text-indigo-600">
                      {selectedProgram.currentEnrollments}/{selectedProgram.maxParticipants}
                    </div>
                    <div className="text-sm text-gray-500">Enrolled</div>
                  </div>
                </div>
              </div>

              {/* Program Information Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Left Column */}
                <div className="space-y-6">
                  {/* Instructor Information */}
                  <div className="bg-gray-50 p-4 rounded-lg">
                    <h4 className="font-semibold text-gray-900 mb-3 flex items-center gap-2">
                      <UserGroupIcon className="h-5 w-5" />
                      Instructor Information
                    </h4>
                    <div className="space-y-2">
                      <p>
                        <span className="font-medium">Name:</span> {selectedProgram.instructor}
                      </p>
                      {selectedProgram.instructorProfile && (
                        <p>
                          <span className="font-medium">Profile:</span>{' '}
                          {selectedProgram.instructorProfile}
                        </p>
                      )}
                    </div>
                  </div>

                  {/* Program Details */}
                  <div className="bg-gray-50 p-4 rounded-lg">
                    <h4 className="font-semibold text-gray-900 mb-3 flex items-center gap-2">
                      <BookOpenIcon className="h-5 w-5" />
                      Program Details
                    </h4>
                    <div className="space-y-2 text-sm">
                      <p>
                        <span className="font-medium">Duration:</span> {selectedProgram.duration}
                      </p>
                      <p>
                        <span className="font-medium">Format:</span> {selectedProgram.format}
                      </p>
                      <p>
                        <span className="font-medium">Target Audience:</span>{' '}
                        {selectedProgram.targetAudience}
                      </p>
                      <p>
                        <span className="font-medium">Certificate:</span>{' '}
                        {selectedProgram.certificationType}
                      </p>
                      {selectedProgram.cost > 0 && (
                        <p>
                          <span className="font-medium">Cost:</span> ₹{selectedProgram.cost}
                        </p>
                      )}
                    </div>
                  </div>

                  {/* Prerequisites */}
                  {selectedProgram.prerequisites && selectedProgram.prerequisites.length > 0 && (
                    <div className="bg-gray-50 p-4 rounded-lg">
                      <h4 className="font-semibold text-gray-900 mb-3">Prerequisites</h4>
                      <ul className="space-y-1 text-sm">
                        {selectedProgram.prerequisites.map((prerequisite, index) => (
                          <li key={index} className="flex items-start gap-2">
                            <span className="text-indigo-600 mt-1">•</span>
                            <span>{prerequisite}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>

                {/* Right Column */}
                <div className="space-y-6">
                  {/* Schedule */}
                  <div className="bg-gray-50 p-4 rounded-lg">
                    <h4 className="font-semibold text-gray-900 mb-3 flex items-center gap-2">
                      <CalendarIcon className="h-5 w-5" />
                      Schedule
                    </h4>
                    <div className="space-y-2 text-sm">
                      <p>
                        <span className="font-medium">Start Date:</span>{' '}
                        {new Date(selectedProgram.startDate).toLocaleDateString()}
                      </p>
                      <p>
                        <span className="font-medium">End Date:</span>{' '}
                        {new Date(selectedProgram.endDate).toLocaleDateString()}
                      </p>
                      <p>
                        <span className="font-medium">Registration Deadline:</span>{' '}
                        {new Date(selectedProgram.registrationDeadline).toLocaleDateString()}
                      </p>
                    </div>
                  </div>

                  {/* Learning Outcomes */}
                  <div className="bg-gray-50 p-4 rounded-lg">
                    <h4 className="font-semibold text-gray-900 mb-3 flex items-center gap-2">
                      <TrophyIcon className="h-5 w-5" />
                      Learning Outcomes
                    </h4>
                    <ul className="space-y-1 text-sm">
                      {selectedProgram.learningOutcomes.map((outcome, index) => (
                        <li key={index} className="flex items-start gap-2">
                          <CheckCircleIcon className="h-4 w-4 text-green-600 mt-0.5 flex-shrink-0" />
                          <span>{outcome}</span>
                        </li>
                      ))}
                    </ul>
                  </div>

                  {/* Tags */}
                  {selectedProgram.tags.length > 0 && (
                    <div className="bg-gray-50 p-4 rounded-lg">
                      <h4 className="font-semibold text-gray-900 mb-3">Tags</h4>
                      <div className="flex flex-wrap gap-2">
                        {selectedProgram.tags.map((tag, index) => (
                          <span
                            key={index}
                            className="px-2 py-1 bg-indigo-100 text-indigo-700 text-xs rounded"
                          >
                            {tag}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* Attachments */}
              {selectedProgram.attachments && selectedProgram.attachments.length > 0 && (
                <div className="bg-gray-50 p-4 rounded-lg">
                  <h4 className="font-semibold text-gray-900 mb-3 flex items-center gap-2">
                    <PaperClipIcon className="h-5 w-5" />
                    Attachments
                  </h4>
                  <div className="space-y-2">
                    {selectedProgram.attachments.map((attachment, index) => (
                      <div
                        key={index}
                        className="flex items-center gap-2 p-2 bg-white rounded border"
                      >
                        <DocumentArrowDownIcon className="h-4 w-4 text-gray-500" />
                        <span className="text-sm text-gray-700">{attachment}</span>
                        <button
                          onClick={() => console.log(`Downloading ${attachment}...`)}
                          className="ml-auto text-indigo-600 hover:text-indigo-800 text-sm"
                        >
                          Download
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Approval Status */}
              {selectedProgram.isApprovalRequired && (
                <div
                  className={`p-4 rounded-lg border ${
                    selectedProgram.approvedBy
                      ? 'bg-green-50 border-green-200'
                      : 'bg-yellow-50 border-yellow-200'
                  }`}
                >
                  <h4 className="font-semibold text-gray-900 mb-2">Approval Status</h4>
                  {selectedProgram.approvedBy ? (
                    <div className="text-sm text-green-700">
                      <p>✓ Approved by {selectedProgram.approvedBy}</p>
                      {selectedProgram.approvedAt && (
                        <p>Date: {new Date(selectedProgram.approvedAt).toLocaleDateString()}</p>
                      )}
                    </div>
                  ) : (
                    <p className="text-sm text-yellow-700">⚠️ Pending approval</p>
                  )}
                </div>
              )}

              {/* Program Metadata */}
              <div className="bg-gray-50 p-4 rounded-lg">
                <h4 className="font-semibold text-gray-900 mb-3">Program Information</h4>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm">
                  <div>
                    <p>
                      <span className="font-medium">Created by:</span> {selectedProgram.createdBy}
                    </p>
                    <p>
                      <span className="font-medium">Created on:</span>{' '}
                      {new Date(selectedProgram.createdAt).toLocaleDateString()}
                    </p>
                  </div>
                  <div>
                    <p>
                      <span className="font-medium">Program ID:</span> {selectedProgram.id}
                    </p>
                    <p>
                      <span className="font-medium">Status:</span> {selectedProgram.status}
                    </p>
                  </div>
                </div>
              </div>
            </div>

            <div className="p-6 border-t border-gray-200 flex justify-end gap-3">
              <button
                onClick={() => {
                  setShowViewModal(false);
                  setSelectedProgram(null);
                }}
                className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50"
              >
                Close
              </button>
              <button
                onClick={() => {
                  setShowViewModal(false);
                  setFormData({
                    title: selectedProgram.title,
                    description: selectedProgram.description,
                    category: selectedProgram.category,
                    level: selectedProgram.level,
                    duration: selectedProgram.duration,
                    format: selectedProgram.format,
                    instructor: selectedProgram.instructor,
                    instructorProfile: selectedProgram.instructorProfile,
                    targetAudience: selectedProgram.targetAudience,
                    targetColleges: selectedProgram.targetColleges || [],
                    maxParticipants: selectedProgram.maxParticipants,
                    startDate: selectedProgram.startDate,
                    endDate: selectedProgram.endDate,
                    registrationDeadline: selectedProgram.registrationDeadline,
                    prerequisites: selectedProgram.prerequisites || [],
                    learningOutcomes: selectedProgram.learningOutcomes,
                    certificationType: selectedProgram.certificationType,
                    cost: selectedProgram.cost,
                    isApprovalRequired: selectedProgram.isApprovalRequired,
                    attachments: [],
                    tags: selectedProgram.tags,
                  });
                  setShowCreateModal(true);
                }}
                className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700"
              >
                Edit Program
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default TrainingUpdates;
