import React, { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import {
  UserGroupIcon,
  AcademicCapIcon,
  ExclamationTriangleIcon,
  DocumentTextIcon,
  CalendarIcon,
  ClockIcon,
  PencilSquareIcon,
  EnvelopeIcon,
  FunnelIcon,
  MagnifyingGlassIcon,
  ChatBubbleLeftRightIcon,
  CheckCircleIcon,
} from '@heroicons/react/24/outline';
// @ts-ignore - AuthContext is a .jsx file
import { useAuth } from '../../context/AuthContext';
import { useMentorAllocation } from '../../hooks/useMentorAllocation';
import KPICard from '../../components/admin/KPICard';
import MentorResponseModal from '../../components/educator/MentorResponseModal';
import Pagination from '../../components/educator/Pagination';

interface AuthUser {
  id: string;
  email: string;
  role: string;
  college_id?: string;
  university_college_id?: string;
  universityCollegeId?: string;
  organizationId?: string;
  [key: string]: any;
}

const MyMentees: React.FC = () => {
  const navigate = useNavigate();
  const { user } = useAuth() as { user: AuthUser | null };

  const collegeId = useMemo(() => {
    if (!user) return '';
    const id =
      user.college_id ||
      user.university_college_id ||
      user.universityCollegeId ||
      user.organizationId ||
      (user as any).collegeId ||
      (user as any).user_metadata?.college_id ||
      '';
    console.log('🔍 [MyMentees] College ID extracted:', id, 'from user:', user);
    return id;
  }, [user]);

  const { mentors, notes, loading, error, updateNoteResponse, refetch } =
    useMentorAllocation(collegeId);

  const currentMentor = useMemo(() => {
    if (!user?.id) return null;
    console.log('🔍 [MyMentees] Looking for mentor with user_id:', user.id);
    console.log('🔍 [MyMentees] Available mentors:', mentors.length);
    const mentor = mentors.find((m) => m.user_id === user.id);
    console.log('🔍 [MyMentees] Found mentor:', mentor ? 'Yes' : 'No', mentor);
    return mentor;
  }, [mentors, user]);

  const myAllocations = useMemo(() => {
    if (!currentMentor) return [];
    return currentMentor.allocations || [];
  }, [currentMentor]);

  const myStudents = useMemo(() => {
    if (!currentMentor) return [];

    // Get students from active and completed allocations
    const relevantAllocations = myAllocations.filter((allocation) => {
      const period = allocation.period;
      if (!period) {
        console.log('🔍 [MyMentees] Filtering out allocation - no period:', allocation.id);
        return false;
      }

      // Check date range to determine if period is active or past (completed)
      const currentDate = new Date();
      currentDate.setHours(0, 0, 0, 0);

      const startDate = new Date(period.start_date);
      startDate.setHours(0, 0, 0, 0);

      const endDate = new Date(period.end_date);
      endDate.setHours(0, 0, 0, 0);

      const isCurrentPeriod = currentDate >= startDate && currentDate <= endDate;
      const isPastPeriod = currentDate > endDate;

      // Include if period is active (current) or completed (past) AND is_active flag is true
      const shouldInclude = period.is_active && (isCurrentPeriod || isPastPeriod);

      if (!shouldInclude) {
        console.log(
          '🔍 [MyMentees] Filtering out allocation - not active/completed:',
          allocation.id,
          {
            is_active: period.is_active,
            isCurrentPeriod,
            isPastPeriod,
          }
        );
      }

      return shouldInclude;
    });

    console.log(
      '🔍 [MyMentees] Relevant allocations (active/completed):',
      relevantAllocations.length,
      'out of',
      myAllocations.length
    );

    // Get students from relevant allocations with period info
    const studentsWithPeriod = relevantAllocations.flatMap((allocation) =>
      (allocation.students || []).map((student) => ({
        ...student,
        _allocation: allocation, // Store allocation reference for period details
      }))
    );

    // Remove duplicates (student might be in multiple periods)
    const uniqueStudents = Array.from(new Map(studentsWithPeriod.map((s) => [s.id, s])).values());

    console.log('🔍 [MyMentees] Active/Completed students:', uniqueStudents.length);
    return uniqueStudents;
  }, [myAllocations, currentMentor]);

  const myNotes = useMemo(() => {
    if (!currentMentor) return [];
    return notes.filter((note) => note.mentor_id === currentMentor.id);
  }, [notes, currentMentor]);

  // Tab state
  const [activeTab, setActiveTab] = useState<'students' | 'notes'>('students');

  // Students tab filters
  const [studentSearch, setStudentSearch] = useState('');
  const [filterAtRisk, setFilterAtRisk] = useState<string>('all');
  const [showFilters, setShowFilters] = useState(false);
  const [selectedPeriodId, setSelectedPeriodId] = useState<string | null>(null);

  // Students pagination
  const [studentsCurrentPage, setStudentsCurrentPage] = useState(1);
  const [studentsPerPage] = useState(12); // 12 cards per page for good grid layout

  // Notes tab state
  const [noteSearch, setNoteSearch] = useState('');
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [selectedNote, setSelectedNote] = useState<any>(null);
  const [showNoteModal, setShowNoteModal] = useState(false);

  // Notes pagination
  const [notesCurrentPage, setNotesCurrentPage] = useState(1);
  const [notesPerPage] = useState(9); // 9 cards per page for notes

  const filteredStudents = useMemo(() => {
    let studentsToFilter = myStudents;

    // Filter by selected period if one is selected
    if (selectedPeriodId) {
      studentsToFilter = myStudents.filter((student) => {
        const allocation = (student as any)._allocation;
        return allocation?.period?.id === selectedPeriodId;
      });
    }

    return studentsToFilter.filter((student) => {
      const matchesSearch =
        student.name.toLowerCase().includes(studentSearch.toLowerCase()) ||
        student.roll_number?.toLowerCase().includes(studentSearch.toLowerCase()) ||
        student.email?.toLowerCase().includes(studentSearch.toLowerCase());

      const matchesRisk =
        filterAtRisk === 'all' ||
        (filterAtRisk === 'at-risk' && student.at_risk) ||
        (filterAtRisk === 'not-at-risk' && !student.at_risk);

      return matchesSearch && matchesRisk;
    });
  }, [myStudents, studentSearch, filterAtRisk, selectedPeriodId]);

  // Paginated students
  const paginatedStudents = useMemo(() => {
    const startIndex = (studentsCurrentPage - 1) * studentsPerPage;
    const endIndex = startIndex + studentsPerPage;
    return filteredStudents.slice(startIndex, endIndex);
  }, [filteredStudents, studentsCurrentPage, studentsPerPage]);

  const filteredNotes = useMemo(() => {
    return myNotes.filter((note) => {
      const student = myStudents.find((s) => s.id === note.student_id);
      const matchesSearch =
        note.note_text.toLowerCase().includes(noteSearch.toLowerCase()) ||
        note.title?.toLowerCase().includes(noteSearch.toLowerCase()) ||
        student?.name.toLowerCase().includes(noteSearch.toLowerCase());

      const matchesStatus = filterStatus === 'all' || note.status === filterStatus;

      return matchesSearch && matchesStatus;
    });
  }, [myNotes, myStudents, noteSearch, filterStatus]);

  // Paginated notes
  const paginatedNotes = useMemo(() => {
    const startIndex = (notesCurrentPage - 1) * notesPerPage;
    const endIndex = startIndex + notesPerPage;
    return filteredNotes.slice(startIndex, endIndex);
  }, [filteredNotes, notesCurrentPage, notesPerPage]);

  // Reset pagination when filters change
  React.useEffect(() => {
    setStudentsCurrentPage(1);
  }, [studentSearch, filterAtRisk, selectedPeriodId]);

  React.useEffect(() => {
    setNotesCurrentPage(1);
  }, [noteSearch, filterStatus]);

  const statistics = useMemo(() => {
    const totalStudents = myStudents.length;
    const atRiskCount = myStudents.filter((s) => s.at_risk).length;
    const totalInterventions = myNotes.length;
    const recentInterventions = myNotes.filter((note) => {
      const noteDate = new Date(note.note_date);
      const thirtyDaysAgo = new Date();
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
      return noteDate >= thirtyDaysAgo;
    }).length;

    return {
      totalStudents,
      atRiskCount,
      totalInterventions,
      recentInterventions,
    };
  }, [myStudents, myNotes]);

  const getStudentNotes = (studentId: string) => {
    return myNotes.filter((note) => note.student_id === studentId);
  };

  const handleAddNote = (student: any) => {
    navigate('/educator/mentornotes', { state: { selectedStudent: student } });
  };

  const handleRespondToNote = (note: any) => {
    setSelectedNote(note);
    setShowNoteModal(true);
  };

  const handleCloseModal = () => {
    setShowNoteModal(false);
    setSelectedNote(null);
  };

  const handleSaveResponse = async (response: {
    educator_response: string;
    action_taken?: string;
    next_steps?: string;
  }) => {
    if (!selectedNote) return;

    try {
      await updateNoteResponse(selectedNote.id, response);
      await refetch();
      toast.success('Response saved successfully');
      handleCloseModal();
    } catch (error: any) {
      console.error('Error saving response:', error);
      const errorMessage = error?.message || 'Failed to save response. Please try again.';
      toast.error(errorMessage);
      throw error;
    }
  };

  const getPriorityColor = (priority?: string) => {
    const colors = {
      urgent: 'bg-red-100 text-red-700 border-red-200',
      high: 'bg-orange-100 text-orange-700 border-orange-200',
      medium: 'bg-yellow-100 text-yellow-700 border-yellow-200',
      low: 'bg-green-100 text-green-700 border-green-200',
    };
    return colors[priority as keyof typeof colors] || colors.medium;
  };

  const getStatusColor = (status: string) => {
    const colors = {
      pending: 'bg-amber-100 text-amber-700 border-amber-200',
      acknowledged: 'bg-cyan-100 text-cyan-700 border-cyan-200',
      in_progress: 'bg-blue-100 text-blue-700 border-blue-200',
      completed: 'bg-emerald-100 text-emerald-700 border-emerald-200',
      escalated: 'bg-red-100 text-red-700 border-red-200',
    };
    return colors[status as keyof typeof colors] || 'bg-gray-100 text-gray-700 border-gray-200';
  };

  const getStatusLabel = (status: string) => {
    const labels = {
      pending: 'Pending',
      acknowledged: 'Acknowledged',
      in_progress: 'In Progress',
      completed: 'Completed',
      escalated: 'Escalated',
    };
    return labels[status as keyof typeof labels] || status;
  };

  if (!user) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Please log in to view your mentees</p>
        </div>
      </div>
    );
  }

  if (!currentMentor && !loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <div className="text-center max-w-md">
          <div className="bg-orange-100 rounded-full p-4 w-16 h-16 mx-auto mb-4 flex items-center justify-center">
            <ExclamationTriangleIcon className="w-8 h-8 text-orange-600" />
          </div>
          <h2 className="text-xl font-semibold text-gray-900 mb-2">Not Registered as Mentor</h2>
          <p className="text-gray-600">
            You are not currently registered as a mentor. Please contact your administrator.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="space-y-6 p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto">
        {/* Header */}
        <div className="bg-gradient-to-r from-blue-50 via-indigo-50 to-purple-50 rounded-2xl p-6 border border-blue-100">
          <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-1">My Mentees</h1>
          <p className="text-gray-600 text-sm sm:text-base">
            Track and support your assigned students
          </p>
        </div>

        {/* Loading State */}
        {loading && (
          <div className="flex items-center justify-center py-12">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
            <span className="ml-2 text-gray-600">Loading mentee data...</span>
          </div>
        )}

        {/* Error State */}
        {error && (
          <div className="bg-red-50 border border-red-200 rounded-xl p-6">
            <div className="flex items-center gap-3">
              <ExclamationTriangleIcon className="h-6 w-6 text-red-500" />
              <div>
                <h3 className="text-red-800 font-medium">Error Loading Data</h3>
                <p className="text-red-600 text-sm mt-1">{error}</p>
              </div>
            </div>
          </div>
        )}

        {!loading && !error && (
          <>
            {/* KPI Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              <KPICard
                title="Total Mentees"
                value={statistics.totalStudents}
                icon={<UserGroupIcon className="h-6 w-6" />}
                color="blue"
              />
              <KPICard
                title="At-Risk Students"
                value={statistics.atRiskCount}
                icon={<ExclamationTriangleIcon className="h-6 w-6" />}
                color="red"
              />
              <KPICard
                title="Total Interventions"
                value={statistics.totalInterventions}
                icon={<DocumentTextIcon className="h-6 w-6" />}
                color="purple"
              />
            </div>

            {/* Tabs */}
            <div className="bg-white rounded-xl border border-gray-200 shadow-sm">
              {/* Tab Headers */}
              <div className="border-b border-gray-200">
                <nav className="flex -mb-px">
                  <button
                    onClick={() => setActiveTab('students')}
                    className={`px-6 py-4 text-sm font-medium border-b-2 transition-colors ${
                      activeTab === 'students'
                        ? 'border-indigo-600 text-indigo-600'
                        : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                    }`}
                  >
                    <div className="flex items-center gap-2">
                      <UserGroupIcon className="h-5 w-5" />
                      <span>Students ({filteredStudents.length})</span>
                    </div>
                  </button>
                  <button
                    onClick={() => setActiveTab('notes')}
                    className={`px-6 py-4 text-sm font-medium border-b-2 transition-colors ${
                      activeTab === 'notes'
                        ? 'border-indigo-600 text-indigo-600'
                        : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                    }`}
                  >
                    <div className="flex items-center gap-2">
                      <DocumentTextIcon className="h-5 w-5" />
                      <span>Intervention Notes ({filteredNotes.length})</span>
                    </div>
                  </button>
                </nav>
              </div>

              {/* Tab Content */}
              <div className="p-6">
                {/* Students Tab */}
                {activeTab === 'students' && (
                  <div className="space-y-6">
                    {/* Search and Filters */}
                    <div className="flex flex-col sm:flex-row gap-4">
                      <div className="flex-1 relative">
                        <MagnifyingGlassIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                        <input
                          type="text"
                          value={studentSearch}
                          onChange={(e) => setStudentSearch(e.target.value)}
                          placeholder="Search students by name, roll number, or email..."
                          className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                        />
                      </div>
                      <button
                        onClick={() => setShowFilters(!showFilters)}
                        className="flex items-center gap-2 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
                      >
                        <FunnelIcon className="h-5 w-5" />
                        <span>Filters</span>
                      </button>
                    </div>

                    {/* Filter Panel */}
                    {showFilters && (
                      <div className="bg-gray-50 rounded-lg p-4 border border-gray-200">
                        <div className="flex flex-wrap gap-4">
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                              Risk Status
                            </label>
                            <select
                              value={filterAtRisk}
                              onChange={(e) => setFilterAtRisk(e.target.value)}
                              className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                            >
                              <option value="all">All Students</option>
                              <option value="at-risk">At-Risk Only</option>
                              <option value="not-at-risk">Not At-Risk</option>
                            </select>
                          </div>
                        </div>
                      </div>
                    )}

                    {/* Period Selection - Clean Integration */}
                    {myAllocations.length > 0 && (
                      <div className="space-y-4">
                        <div className="flex items-center justify-between">
                          <h3 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
                            <CalendarIcon className="h-5 w-5 text-indigo-600" />
                            Filter by Period
                          </h3>
                        </div>

                        <div className="flex flex-wrap gap-3">
                          <button
                            onClick={() => setSelectedPeriodId(null)}
                            className={`px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200 ${
                              !selectedPeriodId
                                ? 'bg-indigo-600 text-white shadow-sm'
                                : 'bg-white text-gray-700 border border-gray-300 hover:bg-gray-50'
                            }`}
                          >
                            All Students ({myStudents.length})
                          </button>
                          {myAllocations
                            .filter((allocation) => {
                              const period = allocation.period;
                              if (!period) return false;

                              const currentDate = new Date();
                              currentDate.setHours(0, 0, 0, 0);
                              const startDate = new Date(period.start_date);
                              startDate.setHours(0, 0, 0, 0);
                              const endDate = new Date(period.end_date);
                              endDate.setHours(0, 0, 0, 0);

                              const isCurrentPeriod =
                                currentDate >= startDate && currentDate <= endDate;
                              const isPastPeriod = currentDate > endDate;

                              return period.is_active && (isCurrentPeriod || isPastPeriod);
                            })
                            .sort((a, b) => {
                              // Sort: Active periods first, then completed periods
                              const currentDate = new Date();
                              currentDate.setHours(0, 0, 0, 0);

                              const aStartDate = new Date(a.period.start_date);
                              aStartDate.setHours(0, 0, 0, 0);
                              const aEndDate = new Date(a.period.end_date);
                              aEndDate.setHours(0, 0, 0, 0);
                              const aIsActive =
                                currentDate >= aStartDate && currentDate <= aEndDate;

                              const bStartDate = new Date(b.period.start_date);
                              bStartDate.setHours(0, 0, 0, 0);
                              const bEndDate = new Date(b.period.end_date);
                              bEndDate.setHours(0, 0, 0, 0);
                              const bIsActive =
                                currentDate >= bStartDate && currentDate <= bEndDate;

                              // Active periods first
                              if (aIsActive && !bIsActive) return -1;
                              if (!aIsActive && bIsActive) return 1;

                              // Within same status, sort by start date (most recent first)
                              return bStartDate.getTime() - aStartDate.getTime();
                            })
                            .map((allocation) => {
                              const period = allocation.period;
                              const currentDate = new Date();
                              currentDate.setHours(0, 0, 0, 0);
                              const startDate = new Date(period.start_date);
                              startDate.setHours(0, 0, 0, 0);
                              const endDate = new Date(period.end_date);
                              endDate.setHours(0, 0, 0, 0);

                              const isCurrentPeriod =
                                currentDate >= startDate && currentDate <= endDate;
                              const isSelected = selectedPeriodId === period.id;
                              const studentCount = allocation.students?.length || 0;

                              return (
                                <button
                                  key={allocation.id}
                                  onClick={() => setSelectedPeriodId(isSelected ? null : period.id)}
                                  className={`px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200 flex items-center gap-2 ${
                                    isSelected
                                      ? 'bg-indigo-600 text-white shadow-sm'
                                      : 'bg-white text-gray-700 border border-gray-300 hover:bg-gray-50'
                                  }`}
                                >
                                  <div
                                    className={`w-2 h-2 rounded-full ${
                                      isCurrentPeriod
                                        ? isSelected
                                          ? 'bg-green-300'
                                          : 'bg-green-500'
                                        : isSelected
                                          ? 'bg-gray-300'
                                          : 'bg-gray-400'
                                    }`}
                                  ></div>
                                  <span className="truncate max-w-[180px]">
                                    {new Date(period.start_date).toLocaleDateString('en-US', {
                                      month: 'short',
                                      year: 'numeric',
                                    })}{' '}
                                    -{' '}
                                    {new Date(period.end_date).toLocaleDateString('en-US', {
                                      month: 'short',
                                      year: 'numeric',
                                    })}
                                  </span>
                                  <span
                                    className={`px-2 py-0.5 rounded-full text-xs font-semibold ${
                                      isSelected
                                        ? 'bg-white/20 text-white'
                                        : 'bg-indigo-100 text-indigo-700'
                                    }`}
                                  >
                                    {studentCount}
                                  </span>
                                </button>
                              );
                            })}
                        </div>

                        {/* Selected Period Info - Complete Details */}
                        {selectedPeriodId && (
                          <div className="bg-indigo-50 px-4 py-3 rounded-lg border border-indigo-100">
                            {(() => {
                              const selectedAllocation = myAllocations.find(
                                (a) => a.period?.id === selectedPeriodId
                              );
                              if (!selectedAllocation) return null;

                              const period = selectedAllocation.period;
                              const currentDate = new Date();
                              currentDate.setHours(0, 0, 0, 0);
                              const startDate = new Date(period.start_date);
                              startDate.setHours(0, 0, 0, 0);
                              const endDate = new Date(period.end_date);
                              endDate.setHours(0, 0, 0, 0);
                              const isCurrentPeriod =
                                currentDate >= startDate && currentDate <= endDate;
                              const studentCount = selectedAllocation.students?.length || 0;

                              return (
                                <div className="space-y-3">
                                  {/* Status and Full Date */}
                                  <div className="flex items-center gap-3">
                                    <span
                                      className={`px-2 py-1 text-xs font-semibold rounded-full ${
                                        isCurrentPeriod
                                          ? 'bg-green-100 text-green-700'
                                          : 'bg-gray-100 text-gray-600'
                                      }`}
                                    >
                                      {isCurrentPeriod ? 'Active Period' : 'Completed Period'}
                                    </span>
                                    <span className="text-sm font-medium text-indigo-900">
                                      {new Date(period.start_date).toLocaleDateString('en-US', {
                                        month: 'long',
                                        day: 'numeric',
                                        year: 'numeric',
                                      })}{' '}
                                      -{' '}
                                      {new Date(period.end_date).toLocaleDateString('en-US', {
                                        month: 'long',
                                        day: 'numeric',
                                        year: 'numeric',
                                      })}
                                    </span>
                                  </div>

                                  {/* Complete Details Grid */}
                                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                                    {/* Total Students */}
                                    <div className="flex items-center gap-2">
                                      <UserGroupIcon className="h-4 w-4 text-indigo-600" />
                                      <span className="text-sm font-medium text-indigo-800">
                                        Students:{' '}
                                        <span className="font-semibold">{studentCount}</span>
                                      </span>
                                    </div>

                                    {/* Office Location - from period.default_office_location */}
                                    {period.default_office_location && (
                                      <div className="flex items-center gap-2">
                                        <svg
                                          className="h-4 w-4 text-indigo-600"
                                          fill="none"
                                          viewBox="0 0 24 24"
                                          stroke="currentColor"
                                        >
                                          <path
                                            strokeLinecap="round"
                                            strokeLinejoin="round"
                                            strokeWidth={2}
                                            d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"
                                          />
                                          <path
                                            strokeLinecap="round"
                                            strokeLinejoin="round"
                                            strokeWidth={2}
                                            d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"
                                          />
                                        </svg>
                                        <span className="text-sm font-medium text-indigo-800">
                                          Office:{' '}
                                          <span className="font-semibold">
                                            {period.default_office_location}
                                          </span>
                                        </span>
                                      </div>
                                    )}

                                    {/* Available Hours - from period.default_available_hours */}
                                    {period.default_available_hours && (
                                      <div className="flex items-center gap-2">
                                        <ClockIcon className="h-4 w-4 text-indigo-600" />
                                        <span className="text-sm font-medium text-indigo-800">
                                          Hours:{' '}
                                          <span className="font-semibold">
                                            {period.default_available_hours}
                                          </span>
                                        </span>
                                      </div>
                                    )}
                                  </div>

                                  {/* Additional Info if available */}
                                  {(period.academic_year || selectedAllocation.assigned_date) && (
                                    <div className="pt-2 border-t border-indigo-200">
                                      <div className="flex items-center gap-6 text-xs text-indigo-700">
                                        {period.academic_year && (
                                          <span>
                                            Academic Year:{' '}
                                            <span className="font-semibold">
                                              {period.academic_year}
                                            </span>
                                          </span>
                                        )}
                                        {selectedAllocation.assigned_date && (
                                          <span>
                                            Assigned:{' '}
                                            <span className="font-semibold">
                                              {new Date(
                                                selectedAllocation.assigned_date
                                              ).toLocaleDateString('en-US', {
                                                month: 'short',
                                                day: 'numeric',
                                                year: 'numeric',
                                              })}
                                            </span>
                                          </span>
                                        )}
                                      </div>
                                    </div>
                                  )}
                                </div>
                              );
                            })()}
                          </div>
                        )}
                      </div>
                    )}

                    {/* Students Grid */}
                    {filteredStudents.length === 0 ? (
                      <div className="text-center py-16 bg-gray-50 rounded-xl">
                        <UserGroupIcon className="h-16 w-16 text-gray-300 mx-auto mb-4" />
                        <h3 className="text-xl font-semibold text-gray-900 mb-2">
                          No Students Found
                        </h3>
                        <p className="text-gray-600">
                          {studentSearch || filterAtRisk !== 'all'
                            ? 'Try adjusting your search or filters'
                            : 'No students have been assigned to you yet'}
                        </p>
                      </div>
                    ) : (
                      <div className="space-y-6">
                        <h3 className="text-lg font-semibold text-gray-900">
                          {selectedPeriodId
                            ? `Students (${filteredStudents.length})`
                            : `My Students (${filteredStudents.length})`}
                        </h3>
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                          {paginatedStudents.map((student) => {
                            const studentNotes = getStudentNotes(student.id);
                            const lastNote = studentNotes.sort(
                              (a, b) =>
                                new Date(b.note_date).getTime() - new Date(a.note_date).getTime()
                            )[0];

                            // Get allocation info for this student
                            const allocation = (student as any)._allocation;
                            const period = allocation?.period;

                            return (
                              <div
                                key={student.id}
                                className="bg-white rounded-xl border border-gray-200 shadow-sm hover:shadow-lg hover:border-indigo-300 transition-all duration-300 overflow-hidden group"
                              >
                                {/* Student Header */}
                                <div className="p-6 bg-white border-b border-gray-100">
                                  <div className="flex items-start gap-4">
                                    <div className="relative">
                                      <div className="w-14 h-14 bg-indigo-600 rounded-xl flex items-center justify-center flex-shrink-0 text-white font-bold text-lg shadow-md">
                                        {student.name?.charAt(0).toUpperCase() || 'S'}
                                      </div>
                                      {student.at_risk && (
                                        <div className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 rounded-full flex items-center justify-center">
                                          <ExclamationTriangleIcon className="h-3 w-3 text-white" />
                                        </div>
                                      )}
                                    </div>
                                    <div className="flex-1 min-w-0">
                                      <h3 className="font-bold text-lg text-gray-900 truncate mb-1">
                                        {student.name}
                                      </h3>
                                      <p className="text-sm text-gray-600 font-medium truncate mb-2">
                                        {student.roll_number}
                                      </p>
                                      {student.at_risk && (
                                        <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-red-50 text-red-700 text-xs rounded-full font-semibold border border-red-200">
                                          <div className="w-1.5 h-1.5 bg-red-500 rounded-full animate-pulse"></div>
                                          At Risk
                                        </span>
                                      )}
                                    </div>
                                  </div>
                                </div>

                                {/* Student Info */}
                                <div className="p-6 space-y-4">
                                  <div className="space-y-3">
                                    <div className="flex items-center gap-3 text-sm">
                                      <div className="w-8 h-8 bg-blue-50 rounded-lg flex items-center justify-center flex-shrink-0">
                                        <AcademicCapIcon className="h-4 w-4 text-blue-600" />
                                      </div>
                                      <span className="text-gray-700 font-medium truncate">
                                        {student.program_name ||
                                          student.department_name ||
                                          'Program Not Specified'}
                                      </span>
                                    </div>
                                    <div className="flex items-center gap-3 text-sm">
                                      <div className="w-8 h-8 bg-green-50 rounded-lg flex items-center justify-center flex-shrink-0">
                                        <EnvelopeIcon className="h-4 w-4 text-green-600" />
                                      </div>
                                      <span className="text-gray-600 truncate text-sm">
                                        {student.email}
                                      </span>
                                    </div>
                                    <div className="flex items-center gap-3 text-sm">
                                      <div className="w-8 h-8 bg-purple-50 rounded-lg flex items-center justify-center flex-shrink-0">
                                        <CalendarIcon className="h-4 w-4 text-purple-600" />
                                      </div>
                                      <span className="text-gray-700 font-medium">
                                        Semester {student.semester || 'N/A'} • CGPA:{' '}
                                        {student.current_cgpa?.toFixed(2) || 'N/A'}
                                      </span>
                                    </div>
                                  </div>

                                  {/* Intervention Stats */}
                                  <div className="grid grid-cols-2 gap-3">
                                    <div className="bg-gray-50 rounded-lg p-4 text-center border border-gray-100 hover:bg-gray-100 transition-colors">
                                      <div className="flex items-center justify-center gap-2 mb-1">
                                        <DocumentTextIcon className="h-4 w-4 text-gray-500" />
                                        <p className="text-2xl font-bold text-gray-900">
                                          {studentNotes.length}
                                        </p>
                                      </div>
                                      <p className="text-xs text-gray-600 font-medium">
                                        Intervention Notes
                                      </p>
                                    </div>
                                    <div className="bg-gray-50 rounded-lg p-4 text-center border border-gray-100 hover:bg-gray-100 transition-colors">
                                      <div className="flex items-center justify-center gap-2 mb-1">
                                        <ClockIcon className="h-4 w-4 text-gray-500" />
                                        <p className="text-sm font-bold text-gray-900">
                                          {lastNote
                                            ? new Date(lastNote.note_date).toLocaleDateString(
                                                'en-US',
                                                { month: 'short', day: 'numeric' }
                                              )
                                            : 'Never'}
                                        </p>
                                      </div>
                                      <p className="text-xs text-gray-600 font-medium">
                                        Last Contact
                                      </p>
                                    </div>
                                  </div>

                                  {/* Action Button */}
                                  <button
                                    onClick={() => handleAddNote(student)}
                                    className="w-full px-4 py-3 bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-semibold rounded-lg transition-all duration-200 flex items-center justify-center gap-2 shadow-md hover:shadow-lg group-hover:scale-[1.02] transform"
                                  >
                                    <PencilSquareIcon className="h-4 w-4" />
                                    Add Intervention Note
                                  </button>
                                </div>
                              </div>
                            );
                          })}
                        </div>

                        {/* Students Pagination */}
                        {filteredStudents.length > studentsPerPage && (
                          <Pagination
                            currentPage={studentsCurrentPage}
                            totalPages={Math.ceil(filteredStudents.length / studentsPerPage)}
                            totalItems={filteredStudents.length}
                            itemsPerPage={studentsPerPage}
                            onPageChange={setStudentsCurrentPage}
                          />
                        )}
                      </div>
                    )}
                  </div>
                )}

                {/* Notes Tab - Clean Implementation */}
                {activeTab === 'notes' && (
                  <div className="space-y-6">
                    {/* Search and Filters */}
                    <div className="flex flex-col sm:flex-row gap-4">
                      <div className="flex-1 relative">
                        <MagnifyingGlassIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                        <input
                          type="text"
                          value={noteSearch}
                          onChange={(e) => setNoteSearch(e.target.value)}
                          placeholder="Search notes by content, title, or student name..."
                          className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                        />
                      </div>
                      <select
                        value={filterStatus}
                        onChange={(e) => setFilterStatus(e.target.value)}
                        className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 bg-white"
                      >
                        <option value="all">All Status</option>
                        <option value="pending">Pending</option>
                        <option value="acknowledged">Acknowledged</option>
                        <option value="in_progress">In Progress</option>
                        <option value="completed">Completed</option>
                        <option value="escalated">Escalated</option>
                      </select>
                    </div>

                    {/* Notes List - Professional Cards */}
                    {filteredNotes.length === 0 ? (
                      <div className="text-center py-16 bg-gray-50 rounded-xl">
                        <DocumentTextIcon className="h-16 w-16 text-gray-300 mx-auto mb-4" />
                        <h3 className="text-xl font-semibold text-gray-900 mb-2">
                          No Intervention Notes Found
                        </h3>
                        <p className="text-gray-600">
                          {noteSearch || filterStatus !== 'all'
                            ? 'Try adjusting your search or filters'
                            : 'No intervention notes have been assigned to you yet'}
                        </p>
                      </div>
                    ) : (
                      <div className="space-y-6">
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                          {paginatedNotes
                            .sort(
                              (a, b) =>
                                new Date(b.note_date).getTime() - new Date(a.note_date).getTime()
                            )
                            .map((note) => {
                              const student = myStudents.find((s) => s.id === note.student_id);
                              const canRespond =
                                note.status === 'pending' && !note.educator_response;

                              return (
                                <div
                                  key={note.id}
                                  onClick={() => handleRespondToNote(note)}
                                  className="bg-white border border-gray-200 hover:border-indigo-400 hover:shadow-md rounded-lg transition-all duration-200 cursor-pointer overflow-hidden flex flex-col h-full"
                                >
                                  {/* Card Header */}
                                  <div className="p-4 border-b border-gray-100">
                                    <div className="flex items-center gap-3 mb-3">
                                      <div className="w-10 h-10 rounded-full bg-indigo-600 flex items-center justify-center text-white font-semibold text-sm flex-shrink-0">
                                        {student?.name?.charAt(0).toUpperCase() || 'S'}
                                      </div>
                                      <div className="flex-1 min-w-0">
                                        <h3 className="font-semibold text-gray-900 truncate text-sm">
                                          {student?.name || 'Unknown Student'}
                                        </h3>
                                        <p className="text-xs text-gray-500 truncate">
                                          {student?.roll_number || 'N/A'}
                                        </p>
                                      </div>
                                    </div>

                                    {/* Status & Priority */}
                                    <div className="flex items-center gap-2 flex-wrap">
                                      <span
                                        className={`px-2 py-0.5 rounded text-xs font-semibold ${getStatusColor(note.status)}`}
                                      >
                                        {getStatusLabel(note.status)}
                                      </span>
                                      {note.priority && (
                                        <span
                                          className={`px-2 py-0.5 rounded text-xs font-semibold ${getPriorityColor(note.priority)}`}
                                        >
                                          {note.priority.toUpperCase()}
                                        </span>
                                      )}
                                    </div>
                                  </div>

                                  {/* Card Body - Flexible content area */}
                                  <div className="p-4 space-y-3 flex-1">
                                    {/* Meta Info */}
                                    <div className="flex items-center gap-3 text-xs text-gray-600">
                                      <span className="px-2 py-1 bg-indigo-50 text-indigo-700 rounded font-medium capitalize">
                                        {note.intervention_type}
                                      </span>
                                      <span className="flex items-center gap-1">
                                        <CalendarIcon className="h-3 w-3" />
                                        {new Date(note.note_date).toLocaleDateString('en-US', {
                                          month: 'short',
                                          day: 'numeric',
                                        })}
                                      </span>
                                    </div>

                                    {/* Note Preview */}
                                    <p className="text-sm text-gray-700 line-clamp-2 leading-relaxed">
                                      {note.note_text}
                                    </p>

                                    {/* Follow-up Badge - Only show if no educator response yet */}
                                    {note.follow_up_required &&
                                      note.follow_up_date &&
                                      note.status !== 'completed' &&
                                      !note.educator_response && (
                                        <div className="flex items-center gap-1.5 text-xs text-amber-700 bg-amber-50 px-2 py-1 rounded">
                                          <ClockIcon className="h-3 w-3" />
                                          <span>
                                            Due:{' '}
                                            {new Date(note.follow_up_date).toLocaleDateString(
                                              'en-US',
                                              { month: 'short', day: 'numeric' }
                                            )}
                                          </span>
                                        </div>
                                      )}
                                  </div>

                                  {/* Card Footer - Always at bottom */}
                                  <div className="px-4 py-3 bg-gray-50 border-t border-gray-100 mt-auto">
                                    {canRespond ? (
                                      <div className="flex items-center justify-between text-sm">
                                        <span className="text-amber-700 font-semibold flex items-center gap-1.5">
                                          <ExclamationTriangleIcon className="h-4 w-4" />
                                          Action Required
                                        </span>
                                        <ChatBubbleLeftRightIcon className="h-5 w-5 text-amber-600" />
                                      </div>
                                    ) : note.educator_response ? (
                                      <div className="flex items-center gap-1.5 text-sm text-green-700 font-medium">
                                        <CheckCircleIcon className="h-4 w-4" />
                                        Response Submitted
                                      </div>
                                    ) : (
                                      <div className="flex items-center gap-1.5 text-sm text-gray-500">
                                        <ClockIcon className="h-4 w-4" />
                                        Awaiting Admin
                                      </div>
                                    )}
                                  </div>
                                </div>
                              );
                            })}
                        </div>

                        {/* Notes Pagination */}
                        {filteredNotes.length > notesPerPage && (
                          <Pagination
                            currentPage={notesCurrentPage}
                            totalPages={Math.ceil(filteredNotes.length / notesPerPage)}
                            totalItems={filteredNotes.length}
                            itemsPerPage={notesPerPage}
                            onPageChange={setNotesCurrentPage}
                          />
                        )}
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>
          </>
        )}
      </div>

      {/* Clean Response Modal */}
      {showNoteModal && selectedNote && (
        <MentorResponseModal
          note={selectedNote}
          studentName={
            myStudents.find((s) => s.id === selectedNote.student_id)?.name || 'Unknown Student'
          }
          onClose={handleCloseModal}
          onSave={handleSaveResponse}
        />
      )}
    </div>
  );
};

export default MyMentees;
