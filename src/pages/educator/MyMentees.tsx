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
  UserIcon,
  EnvelopeIcon,
  FunnelIcon,
  MagnifyingGlassIcon,
  ChatBubbleLeftRightIcon,
  CheckCircleIcon,
  FlagIcon,
} from '@heroicons/react/24/outline';
// @ts-ignore - AuthContext is a .jsx file
import { useAuth } from '../../context/AuthContext';
import { useMentorAllocation } from '../../hooks/useMentorAllocation';
import KPICard from '../../components/admin/KPICard';
import InterventionResponseModal from '../../components/educator/InterventionResponseModal';

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
    const id = user.college_id || 
           user.university_college_id ||
           user.universityCollegeId || 
           user.organizationId ||
           (user as any).collegeId || 
           (user as any).user_metadata?.college_id || 
           '';
    console.log('🔍 [MyMentees] College ID extracted:', id, 'from user:', user);
    return id;
  }, [user]);

  const {
    mentors,
    notes,
    loading,
    error,
    updateNoteResponse,
    refetch,
  } = useMentorAllocation(collegeId);

  const currentMentor = useMemo(() => {
    if (!user?.id) return null;
    console.log('🔍 [MyMentees] Looking for mentor with user_id:', user.id);
    console.log('🔍 [MyMentees] Available mentors:', mentors.length);
    const mentor = mentors.find(m => m.user_id === user.id);
    console.log('🔍 [MyMentees] Found mentor:', mentor ? 'Yes' : 'No', mentor);
    return mentor;
  }, [mentors, user]);

  const myAllocations = useMemo(() => {
    if (!currentMentor) return [];
    return currentMentor.allocations || [];
  }, [currentMentor]);

  const myStudents = useMemo(() => {
    if (!currentMentor) return [];
    const studentsList = myAllocations.flatMap(allocation => allocation.students || []);
    const uniqueStudents = Array.from(
      new Map(studentsList.map(s => [s.id, s])).values()
    );
    return uniqueStudents;
  }, [myAllocations, currentMentor]);

  const myNotes = useMemo(() => {
    if (!currentMentor) return [];
    return notes.filter(note => note.mentor_id === currentMentor.id);
  }, [notes, currentMentor]);

  // Tab state
  const [activeTab, setActiveTab] = useState<'students' | 'notes'>('students');
  
  // Students tab filters
  const [studentSearch, setStudentSearch] = useState('');
  const [filterAtRisk, setFilterAtRisk] = useState<string>('all');
  const [showFilters, setShowFilters] = useState(false);

  // Notes tab filters
  const [noteSearch, setNoteSearch] = useState('');
  const [filterInterventionType, setFilterInterventionType] = useState<string>('all');
  const [filterStatus, setFilterStatus] = useState<string>('all');
  
  // Expanded notes state
  const [expandedNotes, setExpandedNotes] = useState<Set<string>>(new Set());
  
  // Response modal state
  const [showResponseModal, setShowResponseModal] = useState(false);
  const [selectedNoteForResponse, setSelectedNoteForResponse] = useState<any>(null);

  const toggleNoteExpansion = (noteId: string) => {
    setExpandedNotes(prev => {
      const newSet = new Set(prev);
      if (newSet.has(noteId)) {
        newSet.delete(noteId);
      } else {
        newSet.add(noteId);
      }
      return newSet;
    });
  };

  const filteredStudents = useMemo(() => {
    return myStudents.filter(student => {
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
  }, [myStudents, studentSearch, filterAtRisk]);

  const filteredNotes = useMemo(() => {
    return myNotes.filter(note => {
      const student = myStudents.find(s => s.id === note.student_id);
      const matchesSearch = 
        note.note_text.toLowerCase().includes(noteSearch.toLowerCase()) ||
        note.title?.toLowerCase().includes(noteSearch.toLowerCase()) ||
        student?.name.toLowerCase().includes(noteSearch.toLowerCase());
      
      const matchesType = 
        filterInterventionType === 'all' ||
        note.intervention_type === filterInterventionType;
      
      const matchesStatus = 
        filterStatus === 'all' ||
        note.status === filterStatus;
      
      return matchesSearch && matchesType && matchesStatus;
    });
  }, [myNotes, myStudents, noteSearch, filterInterventionType, filterStatus]);

  const statistics = useMemo(() => {
    const totalStudents = myStudents.length;
    const atRiskCount = myStudents.filter(s => s.at_risk).length;
    const totalInterventions = myNotes.length;
    const recentInterventions = myNotes.filter(note => {
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
    return myNotes.filter(note => note.student_id === studentId);
  };

  const handleAddNote = (student: any) => {
    navigate('/educator/mentornotes', { state: { selectedStudent: student } });
  };

  const handleRespondToNote = (note: any) => {
    setSelectedNoteForResponse(note);
    setShowResponseModal(true);
  };

  const handleSaveResponse = async (response: {
    educator_response?: string;
    action_taken?: string;
    next_steps?: string;
    status?: string;
  }) => {
    if (!selectedNoteForResponse) return;
    
    try {
      await updateNoteResponse(selectedNoteForResponse.id, response);
      await refetch();
      toast.success('Response saved successfully');
      setShowResponseModal(false);
      setSelectedNoteForResponse(null);
    } catch (error) {
      console.error('Error saving response:', error);
      toast.error('Failed to save response. Please try again.');
      throw error;
    }
  };

  const getPriorityColor = (priority?: string) => {
    const colors = {
      urgent: 'bg-red-100 text-red-700',
      high: 'bg-orange-100 text-orange-700',
      medium: 'bg-yellow-100 text-yellow-700',
      low: 'bg-green-100 text-green-700',
    };
    return colors[priority as keyof typeof colors] || colors.medium;
  };

  if (!user) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <p className="text-gray-600">Please log in to view your mentees</p>
        </div>
      </div>
    );
  }

  if (!currentMentor && !loading) {
    return (
      <div className="min-h-screen bg-gray-50 p-6">
        <div className="max-w-7xl mx-auto">
          <div className="bg-yellow-50 border border-yellow-200 rounded-xl p-6">
            <div className="flex items-center gap-3">
              <ExclamationTriangleIcon className="h-6 w-6 text-yellow-500" />
              <div>
                <h3 className="text-yellow-800 font-medium">Not Registered as Mentor</h3>
                <p className="text-yellow-600 text-sm mt-1">
                  You are not currently registered as a mentor. Please contact your administrator.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="space-y-6 p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto">
        {/* Header */}
        <div className="bg-gradient-to-r from-blue-50 via-indigo-50 to-purple-50 rounded-2xl p-6 border border-blue-100">
          <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-1">
            My Mentees
          </h1>
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
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
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
              <KPICard
                title="Recent (30 days)"
                value={statistics.recentInterventions}
                icon={<ClockIcon className="h-6 w-6" />}
                color="green"
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

                    {/* Students Grid */}
                    {filteredStudents.length === 0 ? (
                      <div className="text-center py-16 bg-gray-50 rounded-xl">
                        <UserGroupIcon className="h-16 w-16 text-gray-300 mx-auto mb-4" />
                        <h3 className="text-xl font-semibold text-gray-900 mb-2">No Students Found</h3>
                        <p className="text-gray-600">
                          {studentSearch || filterAtRisk !== 'all'
                            ? 'Try adjusting your search or filters'
                            : 'No students have been assigned to you yet'}
                        </p>
                      </div>
                    ) : (
                      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {filteredStudents.map((student) => {
                          const studentNotes = getStudentNotes(student.id);
                          const lastNote = studentNotes.sort((a, b) => 
                            new Date(b.note_date).getTime() - new Date(a.note_date).getTime()
                          )[0];
                          
                          return (
                            <div
                              key={student.id}
                              className="bg-white rounded-xl border border-gray-200 shadow-sm hover:shadow-md transition-all duration-200 p-6"
                            >
                              {/* Student Header */}
                              <div className="flex items-start gap-4 mb-4">
                                <div className="w-12 h-12 bg-indigo-100 rounded-full flex items-center justify-center flex-shrink-0">
                                  <UserIcon className="h-6 w-6 text-indigo-600" />
                                </div>
                                <div className="flex-1 min-w-0">
                                  <h3 className="font-semibold text-gray-900 truncate">{student.name}</h3>
                                  <p className="text-sm text-gray-600 truncate">{student.roll_number}</p>
                                  {student.at_risk && (
                                    <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-red-100 text-red-700 text-xs rounded-full mt-1">
                                      <ExclamationTriangleIcon className="h-3 w-3" />
                                      At Risk
                                    </span>
                                  )}
                                </div>
                              </div>

                              {/* Student Info */}
                              <div className="space-y-2 mb-4">
                                <div className="flex items-center gap-2 text-sm text-gray-600">
                                  <AcademicCapIcon className="h-4 w-4 flex-shrink-0" />
                                  <span className="truncate">{student.program_name || student.department_name || 'N/A'}</span>
                                </div>
                                <div className="flex items-center gap-2 text-sm text-gray-600">
                                  <EnvelopeIcon className="h-4 w-4 flex-shrink-0" />
                                  <span className="truncate">{student.email}</span>
                                </div>
                                <div className="flex items-center gap-2 text-sm text-gray-600">
                                  <CalendarIcon className="h-4 w-4 flex-shrink-0" />
                                  <span>Semester {student.semester || 'N/A'} • CGPA: {student.current_cgpa?.toFixed(2) || 'N/A'}</span>
                                </div>
                              </div>

                              {/* Intervention Stats */}
                              <div className="flex items-center justify-between mb-4 p-3 bg-gray-50 rounded-lg">
                                <div className="text-center">
                                  <p className="text-lg font-semibold text-gray-900">{studentNotes.length}</p>
                                  <p className="text-xs text-gray-500">Interventions</p>
                                </div>
                                <div className="text-center">
                                  <p className="text-sm font-medium text-gray-900">
                                    {lastNote 
                                      ? new Date(lastNote.note_date).toLocaleDateString()
                                      : 'Never'}
                                  </p>
                                  <p className="text-xs text-gray-500">Last Contact</p>
                                </div>
                              </div>

                              {/* Action Button */}
                              <button
                                onClick={() => handleAddNote(student)}
                                className="w-full px-4 py-2 bg-indigo-600 text-white text-sm font-medium rounded-lg hover:bg-indigo-700 transition-colors flex items-center justify-center gap-2"
                              >
                                <PencilSquareIcon className="h-4 w-4" />
                                Add Intervention Note
                              </button>
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </div>
                )}

                {/* Notes Tab */}
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
                              Intervention Type
                            </label>
                            <select
                              value={filterInterventionType}
                              onChange={(e) => setFilterInterventionType(e.target.value)}
                              className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                            >
                              <option value="all">All Types</option>
                              <option value="academic">Academic</option>
                              <option value="personal">Personal</option>
                              <option value="career">Career</option>
                              <option value="attendance">Attendance</option>
                              <option value="behavioral">Behavioral</option>
                              <option value="financial">Financial</option>
                              <option value="other">Other</option>
                            </select>
                          </div>
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                              Status
                            </label>
                            <select
                              value={filterStatus}
                              onChange={(e) => setFilterStatus(e.target.value)}
                              className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                            >
                              <option value="all">All Status</option>
                              <option value="pending">Pending</option>
                              <option value="acknowledged">Acknowledged</option>
                              <option value="in_progress">In Progress</option>
                              <option value="action_taken">Action Taken</option>
                              <option value="completed">Completed</option>
                              <option value="escalated">Escalated</option>
                            </select>
                          </div>
                        </div>
                      </div>
                    )}

                    {/* Notes List */}
                    {filteredNotes.length === 0 ? (
                      <div className="text-center py-16 bg-gray-50 rounded-xl">
                        <DocumentTextIcon className="h-16 w-16 text-gray-300 mx-auto mb-4" />
                        <h3 className="text-xl font-semibold text-gray-900 mb-2">No Intervention Notes Found</h3>
                        <p className="text-gray-600">
                          {noteSearch || filterInterventionType !== 'all' || filterStatus !== 'all'
                            ? 'Try adjusting your search or filters'
                            : 'No intervention notes have been created yet'}
                        </p>
                      </div>
                    ) : (
                      <div className="space-y-4">
                        {filteredNotes
                          .sort((a, b) => new Date(b.note_date).getTime() - new Date(a.note_date).getTime())
                          .map((note) => {
                            const student = myStudents.find(s => s.id === note.student_id);
                            const hasResponse = note.educator_response || note.action_taken;
                            const needsResponse = !hasResponse && note.status === 'pending';
                            const isExpanded = expandedNotes.has(note.id);
                            
                            return (
                              <div
                                key={note.id}
                                className="bg-white rounded-lg border border-gray-200 shadow-sm hover:shadow-md transition-all duration-200"
                              >
                                {/* Compact Header - Always Visible */}
                                <div 
                                  className="px-6 py-4 cursor-pointer"
                                  onClick={() => toggleNoteExpansion(note.id)}
                                >
                                  <div className="flex items-center justify-between gap-4">
                                    {/* Left: Student Info */}
                                    <div className="flex items-center gap-3 flex-1 min-w-0">
                                      <div className="relative flex-shrink-0">
                                        <div className="w-10 h-10 rounded-full bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center text-white font-semibold text-sm">
                                          {student?.name?.charAt(0).toUpperCase() || 'S'}
                                        </div>
                                        {needsResponse && (
                                          <div className="absolute -top-1 -right-1 w-3 h-3 bg-amber-500 rounded-full border-2 border-white" />
                                        )}
                                      </div>
                                      
                                      <div className="flex-1 min-w-0">
                                        <h3 className="text-sm font-semibold text-gray-900 truncate">
                                          {student?.name || 'Unknown Student'}
                                        </h3>
                                        <div className="flex items-center gap-3 text-xs text-gray-500 mt-0.5">
                                          {student?.roll_number && <span>{student.roll_number}</span>}
                                          {student?.roll_number && student?.email && <span>•</span>}
                                          {student?.email && (
                                            <span className="flex items-center gap-1 truncate">
                                              <EnvelopeIcon className="h-3 w-3 flex-shrink-0" />
                                              {student.email}
                                            </span>
                                          )}
                                        </div>
                                        <div className="flex items-center gap-3 text-xs text-gray-500 mt-0.5">
                                          <span className="flex items-center gap-1">
                                            <CalendarIcon className="h-3 w-3" />
                                            {new Date(note.note_date).toLocaleDateString('en-US', { 
                                              month: 'short', 
                                              day: 'numeric'
                                            })}
                                          </span>
                                          {note.follow_up_required && note.follow_up_date && (
                                            <>
                                              <span>•</span>
                                              <span className="flex items-center gap-1 text-amber-600 font-medium">
                                                <ClockIcon className="h-3 w-3" />
                                                Due {new Date(note.follow_up_date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                                              </span>
                                            </>
                                          )}
                                        </div>
                                      </div>
                                    </div>
                                    
                                    {/* Right: Status & Expand */}
                                    <div className="flex items-center gap-3 flex-shrink-0">
                                      <div className="flex items-center gap-2">
                                        {note.priority && note.priority !== 'low' && (
                                          <span className={`px-2 py-1 rounded text-xs font-medium ${
                                            note.priority === 'urgent' ? 'bg-red-100 text-red-700' :
                                            note.priority === 'high' ? 'bg-orange-100 text-orange-700' :
                                            'bg-yellow-100 text-yellow-700'
                                          }`}>
                                            {note.priority}
                                          </span>
                                        )}
                                        <span className={`px-2 py-1 rounded text-xs font-medium ${
                                          note.status === 'completed' ? 'bg-emerald-100 text-emerald-700' :
                                          note.status === 'action_taken' ? 'bg-purple-100 text-purple-700' :
                                          note.status === 'in_progress' ? 'bg-blue-100 text-blue-700' :
                                          note.status === 'acknowledged' ? 'bg-cyan-100 text-cyan-700' :
                                          note.status === 'escalated' ? 'bg-red-100 text-red-700' :
                                          'bg-gray-100 text-gray-700'
                                        }`}>
                                          {note.status.replace('-', ' ')}
                                        </span>
                                        <span className="px-2 py-1 rounded text-xs font-medium bg-indigo-100 text-indigo-700">
                                          {note.intervention_type}
                                        </span>
                                      </div>
                                      
                                      {/* Expand Icon */}
                                      <button className="p-1 hover:bg-gray-100 rounded transition-colors">
                                        {isExpanded ? (
                                          <svg className="h-5 w-5 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 15l7-7 7 7" />
                                          </svg>
                                        ) : (
                                          <svg className="h-5 w-5 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                                          </svg>
                                        )}
                                      </button>
                                    </div>
                                  </div>
                                  
                                  {/* Alert - Only when collapsed and needs response */}
                                  {!isExpanded && needsResponse && (
                                    <div className="mt-3 flex items-center gap-2 text-xs text-amber-700 bg-amber-50 px-3 py-2 rounded border border-amber-200">
                                      <ExclamationTriangleIcon className="h-4 w-4 flex-shrink-0" />
                                      <span className="font-medium">Action Required: Click to view and respond</span>
                                    </div>
                                  )}
                                </div>

                                {/* Expandable Content */}
                                {isExpanded && (
                                  <div className="border-t border-gray-200">
                                    <div className="px-6 py-5 space-y-4">
                                      {/* Admin's Note */}
                                      <div>
                                        <h4 className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">
                                          Admin's Note
                                        </h4>
                                        <p className="text-sm text-gray-900 leading-relaxed">
                                          {note.note_text}
                                        </p>
                                      </div>

                                      {/* Expected Outcome */}
                                      {note.outcome && (
                                        <div className="pt-4 border-t border-gray-100">
                                          <h4 className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">
                                            Expected Outcome
                                          </h4>
                                          <p className="text-sm text-gray-900 leading-relaxed">
                                            {note.outcome}
                                          </p>
                                        </div>
                                      )}

                                      {/* Your Response */}
                                      {note.educator_response && (
                                        <div className="pt-4 border-t border-gray-100">
                                          <h4 className="text-xs font-semibold text-emerald-700 uppercase tracking-wide mb-2">
                                            Your Response
                                          </h4>
                                          <p className="text-sm text-gray-900 leading-relaxed">
                                            {note.educator_response}
                                          </p>
                                        </div>
                                      )}

                                      {/* Action Taken */}
                                      {note.action_taken && (
                                        <div className="pt-4 border-t border-gray-100">
                                          <h4 className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">
                                            Action Taken
                                          </h4>
                                          <p className="text-sm text-gray-900 leading-relaxed">
                                            {note.action_taken}
                                          </p>
                                        </div>
                                      )}

                                      {/* Next Steps */}
                                      {note.next_steps && (
                                        <div className="pt-4 border-t border-gray-100">
                                          <h4 className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">
                                            Next Steps
                                          </h4>
                                          <p className="text-sm text-gray-900 leading-relaxed">
                                            {note.next_steps}
                                          </p>
                                        </div>
                                      )}

                                      {/* Admin Feedback */}
                                      {note.admin_feedback && (
                                        <div className="pt-4 border-t border-gray-100">
                                          <h4 className="text-xs font-semibold text-blue-700 uppercase tracking-wide mb-2">
                                            Admin's Feedback
                                          </h4>
                                          <p className="text-sm text-gray-900 leading-relaxed">
                                            {note.admin_feedback}
                                          </p>
                                        </div>
                                      )}

                                      {/* Action Button */}
                                      {note.status !== 'completed' && (
                                        <div className="pt-4 border-t border-gray-100">
                                          <button
                                            onClick={(e) => {
                                              e.stopPropagation();
                                              handleRespondToNote(note);
                                            }}
                                            className={`w-full flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg font-medium text-sm transition-colors ${
                                              needsResponse
                                                ? 'bg-amber-600 hover:bg-amber-700 text-white'
                                                : 'bg-indigo-600 hover:bg-indigo-700 text-white'
                                            }`}
                                          >
                                            <ChatBubbleLeftRightIcon className="h-4 w-4" />
                                            {hasResponse ? 'Update Response' : 'Respond to Intervention'}
                                          </button>
                                        </div>
                                      )}
                                    </div>
                                  </div>
                                )}
                              </div>
                            );
                          })}
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>
          </>
        )}
      </div>
      
      {/* Response Modal */}
      {showResponseModal && selectedNoteForResponse && (
        <InterventionResponseModal
          note={selectedNoteForResponse}
          studentName={myStudents.find(s => s.id === selectedNoteForResponse.student_id)?.name || 'Unknown Student'}
          onClose={() => {
            setShowResponseModal(false);
            setSelectedNoteForResponse(null);
          }}
          onSave={handleSaveResponse}
        />
      )}
    </div>
  );
};

export default MyMentees;
