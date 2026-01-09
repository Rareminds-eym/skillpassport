import React, { useState, useEffect, useMemo } from 'react';
import { supabase } from '../../../lib/supabaseClient';
import {
  Calendar,
  Clock,
  UserX,
  AlertTriangle,
  CheckCircle,
  XCircle,
  Plus,
  Search,
  ChevronLeft,
  ChevronRight,
  RefreshCw,
  Settings,
  FileText,
  UserPlus,
  Users,
  Trash2,
  Edit,
} from 'lucide-react';

interface FacultyLeaveManagementProps {
  collegeId: string | null;
}

interface LeaveType {
  id: string;
  name: string;
  code: string;
  max_days_per_year: number;
  is_paid: boolean;
  color: string;
  description: string;
}

interface LeaveRequest {
  id: string;
  faculty_id: string;
  faculty_name: string;
  leave_type_id: string;
  leave_type_name: string;
  leave_type_code: string;
  leave_color: string;
  start_date: string;
  end_date: string;
  total_days: number;
  reason: string;
  status: 'pending' | 'approved' | 'rejected' | 'cancelled';
  applied_at: string;
  reviewed_at: string | null;
  review_notes: string | null;
}

interface Substitution {
  id: string;
  leave_id: string;
  original_faculty_id: string;
  original_faculty_name: string;
  substitute_faculty_id: string | null;
  substitute_faculty_name: string | null;
  substitution_date: string;
  period_number: number;
  class_id: string;
  class_name: string;
  subject_name: string;
  status: 'pending' | 'assigned' | 'confirmed' | 'completed';
}

interface Faculty {
  id: string;
  name: string;
  department: string;
  subject_expertise: { name: string }[];
}

interface LecturerWithBalances {
  id: string;
  first_name: string;
  last_name: string;
  email: string;
  phone: string;
  department: string;
  designation: string;
  employeeId: string;
  accountStatus: string;
  leave_balances: {
    leave_type_id: string;
    leave_type_name: string;
    leave_type_code: string;
    total_days: number;
    used_days: number;
    remaining_days: number;
  }[];
}

type TabType = 'dashboard' | 'requests' | 'substitutions' | 'calendar' | 'faculty' | 'settings';

const TABS: { id: TabType; label: string; icon: React.ReactNode }[] = [
  { id: 'dashboard', label: 'Dashboard', icon: <Clock className="h-4 w-4" /> },
  { id: 'faculty', label: 'Faculty', icon: <Users className="h-4 w-4" /> },
  { id: 'requests', label: 'Leave Requests', icon: <FileText className="h-4 w-4" /> },
  { id: 'substitutions', label: 'Substitutions', icon: <UserPlus className="h-4 w-4" /> },
  { id: 'calendar', label: 'Calendar', icon: <Calendar className="h-4 w-4" /> },
  { id: 'settings', label: 'Settings', icon: <Settings className="h-4 w-4" /> },
];

const STATUS_COLORS = {
  pending: 'bg-amber-100 text-amber-800',
  approved: 'bg-green-100 text-green-800',
  rejected: 'bg-red-100 text-red-800',
  cancelled: 'bg-gray-100 text-gray-800',
  assigned: 'bg-blue-100 text-blue-800',
  confirmed: 'bg-green-100 text-green-800',
  completed: 'bg-gray-100 text-gray-800',
};

const FacultyLeaveManagement: React.FC<FacultyLeaveManagementProps> = ({ collegeId }) => {
  const [activeTab, setActiveTab] = useState<TabType>('dashboard');
  const [loading, setLoading] = useState(true);
  const [leaveTypes, setLeaveTypes] = useState<LeaveType[]>([]);
  const [leaveRequests, setLeaveRequests] = useState<LeaveRequest[]>([]);
  const [substitutions, setSubstitutions] = useState<Substitution[]>([]);
  const [faculty, setFaculty] = useState<Faculty[]>([]);
  const [lecturersWithBalances, setLecturersWithBalances] = useState<LecturerWithBalances[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [showAddLeaveModal, setShowAddLeaveModal] = useState(false);
  const [showAddLecturerModal, setShowAddLecturerModal] = useState(false);
  const [showEditLecturerModal, setShowEditLecturerModal] = useState(false);
  const [selectedLecturer, setSelectedLecturer] = useState<LecturerWithBalances | null>(null);
  const [showAssignSubstituteModal, setShowAssignSubstituteModal] = useState(false);
  const [selectedSubstitution, setSelectedSubstitution] = useState<Substitution | null>(null);
  const [calendarMonth, setCalendarMonth] = useState(new Date());

  useEffect(() => {
    if (collegeId) {
      loadData();
    }
  }, [collegeId]);

  const loadData = async () => {
    setLoading(true);
    try {
      await Promise.all([
        loadLeaveTypes(),
        loadLeaveRequests(),
        loadSubstitutions(),
        loadFaculty(),
        loadLecturersWithBalances(),
      ]);
    } finally {
      setLoading(false);
    }
  };

  const loadLeaveTypes = async () => {
    const { data } = await supabase
      .from('college_leave_types')
      .select('*')
      .eq('college_id', collegeId)
      .eq('is_active', true)
      .order('name');
    if (data) setLeaveTypes(data);
  };

  const loadLeaveRequests = async () => {
    const { data } = await supabase
      .from('college_faculty_leaves')
      .select(`
        id, faculty_id, leave_type_id, start_date, end_date, total_days,
        reason, status, applied_at, reviewed_at, review_notes,
        college_lecturers!faculty_id(first_name, last_name),
        college_leave_types!leave_type_id(name, code, color)
      `)
      .eq('college_id', collegeId)
      .order('applied_at', { ascending: false });

    if (data) {
      const processed = data.map((item: any) => ({
        id: item.id,
        faculty_id: item.faculty_id,
        faculty_name: `${item.college_lecturers?.first_name || ''} ${item.college_lecturers?.last_name || ''}`.trim(),
        leave_type_id: item.leave_type_id,
        leave_type_name: item.college_leave_types?.name || '',
        leave_type_code: item.college_leave_types?.code || '',
        leave_color: item.college_leave_types?.color || '#6366f1',
        start_date: item.start_date,
        end_date: item.end_date,
        total_days: item.total_days,
        reason: item.reason,
        status: item.status,
        applied_at: item.applied_at,
        reviewed_at: item.reviewed_at,
        review_notes: item.review_notes,
      }));
      setLeaveRequests(processed);
    }
  };

  const loadSubstitutions = async () => {
    const { data } = await supabase
      .from('college_faculty_substitutions')
      .select(`
        id, leave_id, original_faculty_id, substitute_faculty_id,
        substitution_date, period_number, class_id, subject_name, status, notes,
        original:college_lecturers!original_faculty_id(first_name, last_name),
        substitute:college_lecturers!substitute_faculty_id(first_name, last_name),
        college_classes!class_id(name, grade, section)
      `)
      .eq('college_id', collegeId)
      .order('substitution_date', { ascending: true });

    if (data) {
      const processed = data.map((item: any) => ({
        id: item.id,
        leave_id: item.leave_id,
        original_faculty_id: item.original_faculty_id,
        original_faculty_name: `${item.original?.first_name || ''} ${item.original?.last_name || ''}`.trim(),
        substitute_faculty_id: item.substitute_faculty_id,
        substitute_faculty_name: item.substitute ? `${item.substitute.first_name || ''} ${item.substitute.last_name || ''}`.trim() : null,
        substitution_date: item.substitution_date,
        period_number: item.period_number,
        class_id: item.class_id,
        class_name: item.college_classes ? `${item.college_classes.name} (${item.college_classes.grade}-${item.college_classes.section})` : '',
        subject_name: item.subject_name,
        status: item.status,
      }));
      setSubstitutions(processed);
    }
  };

  const loadFaculty = async () => {
    const { data } = await supabase
      .from('college_lecturers')
      .select('id, first_name, last_name, department, subject_expertise')
      .eq('collegeId', collegeId)
      .eq('accountStatus', 'active')
      .order('first_name');

    if (data) {
      const processed = data.map((f: any) => ({
        id: f.id,
        name: `${f.first_name || ''} ${f.last_name || ''}`.trim(),
        department: f.department || '',
        subject_expertise: f.subject_expertise || [],
      }));
      setFaculty(processed);
    }
  };

  const loadLecturersWithBalances = async () => {
    // Fetch lecturers
    const { data: lecturers } = await supabase
      .from('college_lecturers')
      .select('id, first_name, last_name, email, phone, department, designation, employeeId, accountStatus')
      .eq('collegeId', collegeId)
      .order('first_name');

    if (!lecturers) return;

    // Fetch leave balances for all lecturers
    const { data: balances } = await supabase
      .from('college_faculty_leave_balances')
      .select(`
        faculty_id,
        leave_type_id,
        total_days,
        used_days,
        college_leave_types!leave_type_id(name, code)
      `)
      .eq('college_id', collegeId)
      .eq('academic_year', '2025-2026');

    // Map balances to lecturers
    const lecturersWithBal = lecturers.map((lecturer: any) => {
      const lecturerBalances = (balances || [])
        .filter((b: any) => b.faculty_id === lecturer.id)
        .map((b: any) => ({
          leave_type_id: b.leave_type_id,
          leave_type_name: b.college_leave_types?.name || '',
          leave_type_code: b.college_leave_types?.code || '',
          total_days: Number(b.total_days) || 0,
          used_days: Number(b.used_days) || 0,
          remaining_days: (Number(b.total_days) || 0) - (Number(b.used_days) || 0),
        }));

      return {
        id: lecturer.id,
        first_name: lecturer.first_name || '',
        last_name: lecturer.last_name || '',
        email: lecturer.email || '',
        phone: lecturer.phone || '',
        department: lecturer.department || '',
        designation: lecturer.designation || '',
        employeeId: lecturer.employeeId || '',
        accountStatus: lecturer.accountStatus || 'active',
        leave_balances: lecturerBalances,
      };
    });

    setLecturersWithBalances(lecturersWithBal);
  };

  const handleDeleteLecturer = async (lecturerId: string, lecturerName: string) => {
    if (!confirm(`Are you sure you want to delete "${lecturerName}"?\n\nThis will also delete:\n- All leave balance records\n- All leave requests\n- All substitution records\n\nThis action cannot be undone.`)) {
      return;
    }

    const { error } = await supabase
      .from('college_lecturers')
      .delete()
      .eq('id', lecturerId);

    if (error) {
      alert(`Error deleting lecturer: ${error.message}`);
      return;
    }

    // Reload data to reflect changes
    await Promise.all([loadFaculty(), loadLecturersWithBalances(), loadLeaveRequests()]);
  };

  const handleApproveLeave = async (leaveId: string) => {
    if (!confirm('Approve this leave request?')) return;
    
    const leave = leaveRequests.find(l => l.id === leaveId);
    if (!leave) return;

    const { error } = await supabase
      .from('college_faculty_leaves')
      .update({ 
        status: 'approved', 
        reviewed_at: new Date().toISOString() 
      })
      .eq('id', leaveId);

    if (!error) {
      // Update leave balance - increment used_days
      const { data: currentBalance } = await supabase
        .from('college_faculty_leave_balances')
        .select('used_days')
        .eq('faculty_id', leave.faculty_id)
        .eq('leave_type_id', leave.leave_type_id)
        .eq('academic_year', '2025-2026')
        .single();

      if (currentBalance) {
        await supabase
          .from('college_faculty_leave_balances')
          .update({ 
            used_days: Number(currentBalance.used_days) + leave.total_days 
          })
          .eq('faculty_id', leave.faculty_id)
          .eq('leave_type_id', leave.leave_type_id)
          .eq('academic_year', '2025-2026');
      }

      // Create substitution entries for approved leave
      await createSubstitutionsForLeave(leave);
      
      await loadLeaveRequests();
      await loadSubstitutions();
    }
  };

  const handleRejectLeave = async (leaveId: string) => {
    const reason = prompt('Reason for rejection (optional):');
    
    await supabase
      .from('college_faculty_leaves')
      .update({ 
        status: 'rejected', 
        reviewed_at: new Date().toISOString(),
        review_notes: reason 
      })
      .eq('id', leaveId);

    await loadLeaveRequests();
  };

  const createSubstitutionsForLeave = async (leave: LeaveRequest) => {
    // Get timetable slots for this faculty during leave period
    const { data: slots } = await supabase
      .from('college_timetable_slots')
      .select('id, day_of_week, period_number, class_id, subject_name')
      .eq('educator_id', leave.faculty_id);

    if (!slots || slots.length === 0) return;

    // Generate dates between start and end
    const startDate = new Date(leave.start_date);
    const endDate = new Date(leave.end_date);
    const substitutionEntries: any[] = [];

    for (let d = new Date(startDate); d <= endDate; d.setDate(d.getDate() + 1)) {
      const dayOfWeek = d.getDay() === 0 ? 7 : d.getDay(); // 1=Mon, 7=Sun
      const daySlots = slots.filter(s => s.day_of_week === dayOfWeek);

      for (const slot of daySlots) {
        substitutionEntries.push({
          college_id: collegeId,
          leave_id: leave.id,
          original_faculty_id: leave.faculty_id,
          substitution_date: d.toISOString().split('T')[0],
          period_number: slot.period_number,
          class_id: slot.class_id,
          subject_name: slot.subject_name,
          timetable_slot_id: slot.id,
          status: 'pending',
        });
      }
    }

    if (substitutionEntries.length > 0) {
      await supabase.from('college_faculty_substitutions').insert(substitutionEntries);
    }
  };

  const handleAssignSubstitute = async (substitutionId: string, substituteId: string) => {
    await supabase
      .from('college_faculty_substitutions')
      .update({ 
        substitute_faculty_id: substituteId, 
        status: 'assigned' 
      })
      .eq('id', substitutionId);

    await loadSubstitutions();
    setShowAssignSubstituteModal(false);
    setSelectedSubstitution(null);
  };

  // Get suggested substitutes based on subject expertise
  const getSuggestedSubstitutes = (subjectName: string, originalFacultyId: string) => {
    return faculty.filter(f => {
      if (f.id === originalFacultyId) return false;
      const hasExpertise = f.subject_expertise?.some(
        (s: any) => s.name?.toLowerCase().includes(subjectName?.toLowerCase())
      );
      return hasExpertise;
    });
  };

  // Stats calculations
  const stats = useMemo(() => {
    const today = new Date().toISOString().split('T')[0];
    const todayLeaves = leaveRequests.filter(
      l => l.status === 'approved' && l.start_date <= today && l.end_date >= today
    );
    const pendingRequests = leaveRequests.filter(l => l.status === 'pending');
    const pendingSubstitutions = substitutions.filter(s => s.status === 'pending');
    
    return {
      todayAbsent: todayLeaves.length,
      pendingRequests: pendingRequests.length,
      pendingSubstitutions: pendingSubstitutions.length,
      totalApproved: leaveRequests.filter(l => l.status === 'approved').length,
    };
  }, [leaveRequests, substitutions]);

  // Filtered data
  const filteredRequests = useMemo(() => {
    let result = [...leaveRequests];
    if (searchTerm) {
      result = result.filter(r => 
        r.faculty_name.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }
    if (statusFilter !== 'all') {
      result = result.filter(r => r.status === statusFilter);
    }
    return result;
  }, [leaveRequests, searchTerm, statusFilter]);

  const filteredSubstitutions = useMemo(() => {
    let result = [...substitutions];
    if (searchTerm) {
      result = result.filter(s => 
        s.original_faculty_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        s.subject_name?.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }
    if (statusFilter !== 'all') {
      result = result.filter(s => s.status === statusFilter);
    }
    return result;
  }, [substitutions, searchTerm, statusFilter]);

  const filteredLecturers = useMemo(() => {
    let result = [...lecturersWithBalances];
    if (searchTerm) {
      result = result.filter(l => 
        `${l.first_name} ${l.last_name}`.toLowerCase().includes(searchTerm.toLowerCase()) ||
        l.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        l.department?.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }
    if (statusFilter !== 'all') {
      result = result.filter(l => l.accountStatus === statusFilter);
    }
    return result;
  }, [lecturersWithBalances, searchTerm, statusFilter]);

  // Calendar data
  const calendarLeaves = useMemo(() => {
    const year = calendarMonth.getFullYear();
    const month = calendarMonth.getMonth();
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    
    return leaveRequests.filter(l => {
      if (l.status !== 'approved') return false;
      const start = new Date(l.start_date);
      const end = new Date(l.end_date);
      return start <= lastDay && end >= firstDay;
    });
  }, [leaveRequests, calendarMonth]);

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString('en-IN', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
    });
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6 p-4 sm:p-6 lg:p-8">
      {/* Header */}
      <div className="bg-gradient-to-r from-indigo-50 via-purple-50 to-pink-50 rounded-2xl p-6 border border-indigo-100">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-1">
              Leave & Substitution Management
            </h1>
            <p className="text-gray-600 text-sm sm:text-base">
              Manage faculty leaves and assign substitutes
            </p>
          </div>
          <button
            onClick={() => setShowAddLeaveModal(true)}
            className="flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition"
          >
            <Plus className="h-4 w-4" />
            Add Leave
          </button>
        </div>
      </div>

      {/* Tabs */}
      <div className="bg-white rounded-xl border border-gray-200 shadow-sm">
        <div className="flex border-b border-gray-200 overflow-x-auto">
          {TABS.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-2 px-4 py-3 text-sm font-medium whitespace-nowrap transition ${
                activeTab === tab.id
                  ? 'text-indigo-600 border-b-2 border-indigo-600 bg-indigo-50/50'
                  : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
              }`}
            >
              {tab.icon}
              {tab.label}
              {tab.id === 'requests' && stats.pendingRequests > 0 && (
                <span className="ml-1 px-2 py-0.5 text-xs bg-amber-100 text-amber-800 rounded-full">
                  {stats.pendingRequests}
                </span>
              )}
              {tab.id === 'substitutions' && stats.pendingSubstitutions > 0 && (
                <span className="ml-1 px-2 py-0.5 text-xs bg-red-100 text-red-800 rounded-full">
                  {stats.pendingSubstitutions}
                </span>
              )}
            </button>
          ))}
        </div>

        <div className="p-4">
          {/* Dashboard Tab */}
          {activeTab === 'dashboard' && (
            <div className="space-y-6">
              {/* Stats Cards */}
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                <div className="bg-red-50 rounded-xl p-4 border border-red-100">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-red-100 rounded-lg">
                      <UserX className="h-5 w-5 text-red-600" />
                    </div>
                    <div>
                      <p className="text-2xl font-bold text-red-900">{stats.todayAbsent}</p>
                      <p className="text-xs text-red-700">Absent Today</p>
                    </div>
                  </div>
                </div>

                <div className="bg-amber-50 rounded-xl p-4 border border-amber-100">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-amber-100 rounded-lg">
                      <Clock className="h-5 w-5 text-amber-600" />
                    </div>
                    <div>
                      <p className="text-2xl font-bold text-amber-900">{stats.pendingRequests}</p>
                      <p className="text-xs text-amber-700">Pending Requests</p>
                    </div>
                  </div>
                </div>

                <div className="bg-purple-50 rounded-xl p-4 border border-purple-100">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-purple-100 rounded-lg">
                      <AlertTriangle className="h-5 w-5 text-purple-600" />
                    </div>
                    <div>
                      <p className="text-2xl font-bold text-purple-900">{stats.pendingSubstitutions}</p>
                      <p className="text-xs text-purple-700">Need Substitutes</p>
                    </div>
                  </div>
                </div>

                <div className="bg-green-50 rounded-xl p-4 border border-green-100">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-green-100 rounded-lg">
                      <CheckCircle className="h-5 w-5 text-green-600" />
                    </div>
                    <div>
                      <p className="text-2xl font-bold text-green-900">{stats.totalApproved}</p>
                      <p className="text-xs text-green-700">Approved Leaves</p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Quick Actions */}
              <div className="grid lg:grid-cols-2 gap-6">
                {/* Pending Requests */}
                <div className="bg-white rounded-xl border border-gray-200 p-4">
                  <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                    <Clock className="h-5 w-5 text-amber-600" />
                    Pending Leave Requests
                  </h3>
                  {leaveRequests.filter(l => l.status === 'pending').length === 0 ? (
                    <p className="text-gray-500 text-sm">No pending requests</p>
                  ) : (
                    <div className="space-y-3">
                      {leaveRequests.filter(l => l.status === 'pending').slice(0, 5).map((leave) => (
                        <div key={leave.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                          <div>
                            <p className="font-medium text-gray-900">{leave.faculty_name}</p>
                            <p className="text-xs text-gray-500">
                              {leave.leave_type_code} • {formatDate(leave.start_date)} - {formatDate(leave.end_date)}
                            </p>
                          </div>
                          <div className="flex gap-2">
                            <button
                              onClick={() => handleApproveLeave(leave.id)}
                              className="p-1.5 text-green-600 hover:bg-green-100 rounded-lg"
                            >
                              <CheckCircle className="h-5 w-5" />
                            </button>
                            <button
                              onClick={() => handleRejectLeave(leave.id)}
                              className="p-1.5 text-red-600 hover:bg-red-100 rounded-lg"
                            >
                              <XCircle className="h-5 w-5" />
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {/* Unassigned Substitutions */}
                <div className="bg-white rounded-xl border border-gray-200 p-4">
                  <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                    <AlertTriangle className="h-5 w-5 text-red-600" />
                    Unassigned Substitutions
                  </h3>
                  {substitutions.filter(s => s.status === 'pending').length === 0 ? (
                    <p className="text-gray-500 text-sm">All substitutions assigned</p>
                  ) : (
                    <div className="space-y-3">
                      {substitutions.filter(s => s.status === 'pending').slice(0, 5).map((sub) => (
                        <div key={sub.id} className="flex items-center justify-between p-3 bg-red-50 rounded-lg border border-red-100">
                          <div>
                            <p className="font-medium text-gray-900">{sub.subject_name}</p>
                            <p className="text-xs text-gray-600">
                              {formatDate(sub.substitution_date)} • Period {sub.period_number} • {sub.class_name}
                            </p>
                            <p className="text-xs text-red-600">For: {sub.original_faculty_name}</p>
                          </div>
                          <button
                            onClick={() => {
                              setSelectedSubstitution(sub);
                              setShowAssignSubstituteModal(true);
                            }}
                            className="px-3 py-1.5 text-sm bg-indigo-600 text-white rounded-lg hover:bg-indigo-700"
                          >
                            Assign
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* Leave Requests Tab */}
          {activeTab === 'requests' && (
            <div className="space-y-4">
              {/* Filters */}
              <div className="flex flex-wrap gap-3">
                <div className="relative flex-1 min-w-[200px]">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                  <input
                    type="text"
                    placeholder="Search by faculty name..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
                  />
                </div>
                <select
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value)}
                  className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
                >
                  <option value="all">All Status</option>
                  <option value="pending">Pending</option>
                  <option value="approved">Approved</option>
                  <option value="rejected">Rejected</option>
                </select>
                <button
                  onClick={loadData}
                  className="p-2 text-gray-600 hover:bg-gray-100 rounded-lg"
                >
                  <RefreshCw className="h-5 w-5" />
                </button>
              </div>

              {/* Table */}
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600">Faculty</th>
                      <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600">Leave Type</th>
                      <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600">Duration</th>
                      <th className="px-4 py-3 text-center text-xs font-semibold text-gray-600">Days</th>
                      <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600">Reason</th>
                      <th className="px-4 py-3 text-center text-xs font-semibold text-gray-600">Status</th>
                      <th className="px-4 py-3 text-center text-xs font-semibold text-gray-600">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {filteredRequests.map((leave) => (
                      <tr key={leave.id} className="hover:bg-gray-50">
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-2">
                            <div className="w-8 h-8 rounded-full bg-indigo-100 flex items-center justify-center">
                              <span className="text-sm font-medium text-indigo-600">
                                {leave.faculty_name.charAt(0)}
                              </span>
                            </div>
                            <span className="font-medium text-gray-900">{leave.faculty_name}</span>
                          </div>
                        </td>
                        <td className="px-4 py-3">
                          <span 
                            className="px-2 py-1 rounded-full text-xs font-medium"
                            style={{ backgroundColor: `${leave.leave_color}20`, color: leave.leave_color }}
                          >
                            {leave.leave_type_code}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-sm text-gray-600">
                          {formatDate(leave.start_date)} - {formatDate(leave.end_date)}
                        </td>
                        <td className="px-4 py-3 text-center font-medium text-gray-900">
                          {leave.total_days}
                        </td>
                        <td className="px-4 py-3 text-sm text-gray-600 max-w-[200px] truncate">
                          {leave.reason || '-'}
                        </td>
                        <td className="px-4 py-3 text-center">
                          <span className={`px-2 py-1 rounded-full text-xs font-medium capitalize ${STATUS_COLORS[leave.status]}`}>
                            {leave.status}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-center">
                          {leave.status === 'pending' && (
                            <div className="flex justify-center gap-1">
                              <button
                                onClick={() => handleApproveLeave(leave.id)}
                                className="p-1.5 text-green-600 hover:bg-green-100 rounded-lg"
                                title="Approve"
                              >
                                <CheckCircle className="h-4 w-4" />
                              </button>
                              <button
                                onClick={() => handleRejectLeave(leave.id)}
                                className="p-1.5 text-red-600 hover:bg-red-100 rounded-lg"
                                title="Reject"
                              >
                                <XCircle className="h-4 w-4" />
                              </button>
                            </div>
                          )}
                        </td>
                      </tr>
                    ))}
                    {filteredRequests.length === 0 && (
                      <tr>
                        <td colSpan={7} className="px-4 py-8 text-center text-gray-500">
                          No leave requests found
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* Substitutions Tab */}
          {activeTab === 'substitutions' && (
            <div className="space-y-4">
              {/* Filters */}
              <div className="flex flex-wrap gap-3">
                <div className="relative flex-1 min-w-[200px]">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                  <input
                    type="text"
                    placeholder="Search by faculty or subject..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
                  />
                </div>
                <select
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value)}
                  className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
                >
                  <option value="all">All Status</option>
                  <option value="pending">Pending</option>
                  <option value="assigned">Assigned</option>
                  <option value="completed">Completed</option>
                </select>
              </div>

              {/* Table */}
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600">Date</th>
                      <th className="px-4 py-3 text-center text-xs font-semibold text-gray-600">Period</th>
                      <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600">Class</th>
                      <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600">Subject</th>
                      <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600">Original Faculty</th>
                      <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600">Substitute</th>
                      <th className="px-4 py-3 text-center text-xs font-semibold text-gray-600">Status</th>
                      <th className="px-4 py-3 text-center text-xs font-semibold text-gray-600">Action</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {filteredSubstitutions.map((sub) => (
                      <tr key={sub.id} className={`hover:bg-gray-50 ${sub.status === 'pending' ? 'bg-red-50' : ''}`}>
                        <td className="px-4 py-3 text-sm font-medium text-gray-900">
                          {formatDate(sub.substitution_date)}
                        </td>
                        <td className="px-4 py-3 text-center">
                          <span className="px-2 py-1 bg-gray-100 rounded text-sm font-medium">
                            P{sub.period_number}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-sm text-gray-600">{sub.class_name}</td>
                        <td className="px-4 py-3 text-sm text-gray-900 font-medium">{sub.subject_name}</td>
                        <td className="px-4 py-3 text-sm text-gray-600">{sub.original_faculty_name}</td>
                        <td className="px-4 py-3 text-sm">
                          {sub.substitute_faculty_name ? (
                            <span className="text-green-700 font-medium">{sub.substitute_faculty_name}</span>
                          ) : (
                            <span className="text-red-600 italic">Not assigned</span>
                          )}
                        </td>
                        <td className="px-4 py-3 text-center">
                          <span className={`px-2 py-1 rounded-full text-xs font-medium capitalize ${STATUS_COLORS[sub.status]}`}>
                            {sub.status}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-center">
                          {sub.status === 'pending' && (
                            <button
                              onClick={() => {
                                setSelectedSubstitution(sub);
                                setShowAssignSubstituteModal(true);
                              }}
                              className="px-3 py-1 text-sm bg-indigo-600 text-white rounded-lg hover:bg-indigo-700"
                            >
                              Assign
                            </button>
                          )}
                        </td>
                      </tr>
                    ))}
                    {filteredSubstitutions.length === 0 && (
                      <tr>
                        <td colSpan={8} className="px-4 py-8 text-center text-gray-500">
                          No substitutions found
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* Calendar Tab */}
          {activeTab === 'calendar' && (
            <div className="space-y-4">
              {/* Month Navigation */}
              <div className="flex items-center justify-between">
                <button
                  onClick={() => setCalendarMonth(new Date(calendarMonth.getFullYear(), calendarMonth.getMonth() - 1))}
                  className="p-2 hover:bg-gray-100 rounded-lg"
                >
                  <ChevronLeft className="h-5 w-5" />
                </button>
                <h3 className="text-lg font-semibold text-gray-900">
                  {calendarMonth.toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}
                </h3>
                <button
                  onClick={() => setCalendarMonth(new Date(calendarMonth.getFullYear(), calendarMonth.getMonth() + 1))}
                  className="p-2 hover:bg-gray-100 rounded-lg"
                >
                  <ChevronRight className="h-5 w-5" />
                </button>
              </div>

              {/* Calendar Grid */}
              <div className="grid grid-cols-7 gap-1">
                {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map((day) => (
                  <div key={day} className="p-2 text-center text-xs font-semibold text-gray-600 bg-gray-50">
                    {day}
                  </div>
                ))}
                {(() => {
                  const year = calendarMonth.getFullYear();
                  const month = calendarMonth.getMonth();
                  const firstDay = new Date(year, month, 1).getDay();
                  const daysInMonth = new Date(year, month + 1, 0).getDate();
                  const cells = [];

                  // Empty cells before first day
                  for (let i = 0; i < firstDay; i++) {
                    cells.push(<div key={`empty-${i}`} className="p-2 min-h-[80px] bg-gray-50"></div>);
                  }

                  // Day cells
                  for (let day = 1; day <= daysInMonth; day++) {
                    const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
                    const dayLeaves = calendarLeaves.filter(l => l.start_date <= dateStr && l.end_date >= dateStr);
                    const isToday = dateStr === new Date().toISOString().split('T')[0];

                    cells.push(
                      <div
                        key={day}
                        className={`p-2 min-h-[80px] border border-gray-100 ${isToday ? 'bg-indigo-50 border-indigo-200' : 'bg-white'}`}
                      >
                        <div className={`text-sm font-medium ${isToday ? 'text-indigo-600' : 'text-gray-900'}`}>
                          {day}
                        </div>
                        <div className="mt-1 space-y-1">
                          {dayLeaves.slice(0, 3).map((leave) => (
                            <div
                              key={leave.id}
                              className="text-xs px-1 py-0.5 rounded truncate"
                              style={{ backgroundColor: `${leave.leave_color}20`, color: leave.leave_color }}
                              title={`${leave.faculty_name} - ${leave.leave_type_code}`}
                            >
                              {leave.faculty_name.split(' ')[0]}
                            </div>
                          ))}
                          {dayLeaves.length > 3 && (
                            <div className="text-xs text-gray-500">+{dayLeaves.length - 3} more</div>
                          )}
                        </div>
                      </div>
                    );
                  }

                  return cells;
                })()}
              </div>

              {/* Legend */}
              <div className="flex flex-wrap gap-4 pt-4 border-t border-gray-200">
                {leaveTypes.map((type) => (
                  <div key={type.id} className="flex items-center gap-2">
                    <div className="w-3 h-3 rounded" style={{ backgroundColor: type.color }}></div>
                    <span className="text-sm text-gray-600">{type.name} ({type.code})</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Faculty Tab */}
          {activeTab === 'faculty' && (
            <div className="space-y-4">
              {/* Header with Add Button */}
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div className="relative flex-1 min-w-[200px]">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                  <input
                    type="text"
                    placeholder="Search by name, email, department..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
                  />
                </div>
                <select
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value)}
                  className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
                >
                  <option value="all">All Status</option>
                  <option value="active">Active</option>
                  <option value="inactive">Inactive</option>
                </select>
                <button
                  onClick={() => setShowAddLecturerModal(true)}
                  className="flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition"
                >
                  <Plus className="h-4 w-4" />
                  Add Faculty
                </button>
              </div>

              {/* Info Banner */}
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 text-sm text-blue-800">
                <strong>Data Consistency:</strong> When you add a faculty member, leave balances are automatically created. 
                When you delete a faculty member, all their leave balances and requests are automatically removed.
              </div>

              {/* Faculty Table */}
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600">Faculty</th>
                      <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600">Department</th>
                      <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600">Contact</th>
                      <th className="px-4 py-3 text-center text-xs font-semibold text-gray-600">Leave Balances</th>
                      <th className="px-4 py-3 text-center text-xs font-semibold text-gray-600">Status</th>
                      <th className="px-4 py-3 text-center text-xs font-semibold text-gray-600">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {filteredLecturers.map((lecturer) => (
                      <tr key={lecturer.id} className="hover:bg-gray-50">
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-full bg-indigo-100 flex items-center justify-center">
                              <span className="text-sm font-medium text-indigo-600">
                                {lecturer.first_name.charAt(0)}{lecturer.last_name.charAt(0)}
                              </span>
                            </div>
                            <div>
                              <p className="font-medium text-gray-900">{lecturer.first_name} {lecturer.last_name}</p>
                              <p className="text-xs text-gray-500">{lecturer.employeeId || 'No ID'} • {lecturer.designation || 'No designation'}</p>
                            </div>
                          </div>
                        </td>
                        <td className="px-4 py-3 text-sm text-gray-600">{lecturer.department || '-'}</td>
                        <td className="px-4 py-3">
                          <p className="text-sm text-gray-900">{lecturer.email || '-'}</p>
                          <p className="text-xs text-gray-500">{lecturer.phone || '-'}</p>
                        </td>
                        <td className="px-4 py-3">
                          <div className="flex flex-wrap gap-1 justify-center">
                            {lecturer.leave_balances.length > 0 ? (
                              lecturer.leave_balances.map((bal) => (
                                <span
                                  key={bal.leave_type_id}
                                  className="px-2 py-1 text-xs rounded-full bg-gray-100 text-gray-700"
                                  title={`${bal.leave_type_name}: ${bal.remaining_days}/${bal.total_days} remaining`}
                                >
                                  {bal.leave_type_code}: {bal.remaining_days}/{bal.total_days}
                                </span>
                              ))
                            ) : (
                              <span className="text-xs text-gray-400 italic">No balances</span>
                            )}
                          </div>
                        </td>
                        <td className="px-4 py-3 text-center">
                          <span className={`px-2 py-1 rounded-full text-xs font-medium capitalize ${
                            lecturer.accountStatus === 'active' 
                              ? 'bg-green-100 text-green-800' 
                              : 'bg-gray-100 text-gray-800'
                          }`}>
                            {lecturer.accountStatus}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-center">
                          <div className="flex justify-center gap-1">
                            <button
                              onClick={() => {
                                setSelectedLecturer(lecturer);
                                setShowEditLecturerModal(true);
                              }}
                              className="p-1.5 text-blue-600 hover:bg-blue-100 rounded-lg"
                              title="Edit"
                            >
                              <Edit className="h-4 w-4" />
                            </button>
                            <button
                              onClick={() => handleDeleteLecturer(lecturer.id, `${lecturer.first_name} ${lecturer.last_name}`)}
                              className="p-1.5 text-red-600 hover:bg-red-100 rounded-lg"
                              title="Delete"
                            >
                              <Trash2 className="h-4 w-4" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                    {filteredLecturers.length === 0 && (
                      <tr>
                        <td colSpan={6} className="px-4 py-8 text-center text-gray-500">
                          No faculty members found
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>

              {/* Summary */}
              <div className="flex items-center justify-between text-sm text-gray-500 pt-2 border-t border-gray-200">
                <span>Total: {filteredLecturers.length} faculty members</span>
                <span>Active: {filteredLecturers.filter(l => l.accountStatus === 'active').length}</span>
              </div>
            </div>
          )}

          {/* Settings Tab */}
          {activeTab === 'settings' && (
            <div className="space-y-6">
              <h3 className="text-lg font-semibold text-gray-900">Leave Types Configuration</h3>
              <div className="grid gap-4">
                {leaveTypes.map((type) => (
                  <div key={type.id} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg border border-gray-200">
                    <div className="flex items-center gap-4">
                      <div className="w-4 h-4 rounded" style={{ backgroundColor: type.color }}></div>
                      <div>
                        <p className="font-medium text-gray-900">{type.name} ({type.code})</p>
                        <p className="text-sm text-gray-500">{type.description}</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="font-medium text-gray-900">{type.max_days_per_year} days/year</p>
                      <p className="text-sm text-gray-500">{type.is_paid ? 'Paid' : 'Unpaid'}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Add Leave Modal */}
      {showAddLeaveModal && (
        <AddLeaveModal
          faculty={faculty}
          leaveTypes={leaveTypes}
          collegeId={collegeId}
          onClose={() => setShowAddLeaveModal(false)}
          onSave={async () => {
            await loadLeaveRequests();
            setShowAddLeaveModal(false);
          }}
        />
      )}

      {/* Assign Substitute Modal */}
      {showAssignSubstituteModal && selectedSubstitution && (
        <AssignSubstituteModal
          substitution={selectedSubstitution}
          faculty={faculty}
          suggestedFaculty={getSuggestedSubstitutes(selectedSubstitution.subject_name, selectedSubstitution.original_faculty_id)}
          collegeId={collegeId}
          onClose={() => {
            setShowAssignSubstituteModal(false);
            setSelectedSubstitution(null);
          }}
          onAssign={(substituteId) => handleAssignSubstitute(selectedSubstitution.id, substituteId)}
        />
      )}

      {/* Add Lecturer Modal */}
      {showAddLecturerModal && (
        <AddLecturerModal
          collegeId={collegeId}
          onClose={() => setShowAddLecturerModal(false)}
          onSave={async () => {
            await Promise.all([loadFaculty(), loadLecturersWithBalances()]);
            setShowAddLecturerModal(false);
          }}
        />
      )}

      {/* Edit Lecturer Modal */}
      {showEditLecturerModal && selectedLecturer && (
        <EditLecturerModal
          lecturer={selectedLecturer}
          collegeId={collegeId}
          onClose={() => {
            setShowEditLecturerModal(false);
            setSelectedLecturer(null);
          }}
          onSave={async () => {
            await Promise.all([loadFaculty(), loadLecturersWithBalances()]);
            setShowEditLecturerModal(false);
            setSelectedLecturer(null);
          }}
        />
      )}
    </div>
  );
};

// Add Leave Modal Component
const AddLeaveModal: React.FC<{
  faculty: Faculty[];
  leaveTypes: LeaveType[];
  collegeId: string | null;
  onClose: () => void;
  onSave: () => void;
}> = ({ faculty, leaveTypes, collegeId, onClose, onSave }) => {
  const [form, setForm] = useState({
    faculty_id: '',
    leave_type_id: '',
    start_date: '',
    end_date: '',
    reason: '',
  });
  const [saving, setSaving] = useState(false);

  const calculateDays = () => {
    if (!form.start_date || !form.end_date) return 0;
    const start = new Date(form.start_date);
    const end = new Date(form.end_date);
    const diff = Math.ceil((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24)) + 1;
    return diff > 0 ? diff : 0;
  };

  const handleSubmit = async () => {
    if (!form.faculty_id || !form.leave_type_id || !form.start_date || !form.end_date) {
      alert('Please fill all required fields');
      return;
    }

    setSaving(true);
    try {
      const { error } = await supabase.from('college_faculty_leaves').insert({
        college_id: collegeId,
        faculty_id: form.faculty_id,
        leave_type_id: form.leave_type_id,
        start_date: form.start_date,
        end_date: form.end_date,
        total_days: calculateDays(),
        reason: form.reason,
        status: 'pending',
      });

      if (error) throw error;
      onSave();
    } catch (error: any) {
      alert(error.message);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-xl">
        <h3 className="text-lg font-bold text-gray-900 mb-4">Add Leave Request</h3>

        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Faculty *</label>
            <select
              value={form.faculty_id}
              onChange={(e) => setForm({ ...form, faculty_id: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
            >
              <option value="">Select Faculty</option>
              {faculty.map((f) => (
                <option key={f.id} value={f.id}>{f.name}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Leave Type *</label>
            <select
              value={form.leave_type_id}
              onChange={(e) => setForm({ ...form, leave_type_id: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
            >
              <option value="">Select Leave Type</option>
              {leaveTypes.map((t) => (
                <option key={t.id} value={t.id}>{t.name} ({t.code})</option>
              ))}
            </select>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Start Date *</label>
              <input
                type="date"
                value={form.start_date}
                onChange={(e) => setForm({ ...form, start_date: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">End Date *</label>
              <input
                type="date"
                value={form.end_date}
                onChange={(e) => setForm({ ...form, end_date: e.target.value })}
                min={form.start_date}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
              />
            </div>
          </div>

          {calculateDays() > 0 && (
            <div className="bg-indigo-50 rounded-lg p-3 text-center">
              <span className="text-2xl font-bold text-indigo-600">{calculateDays()}</span>
              <span className="text-sm text-indigo-700 ml-2">day(s)</span>
            </div>
          )}

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Reason</label>
            <textarea
              value={form.reason}
              onChange={(e) => setForm({ ...form, reason: e.target.value })}
              rows={3}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
              placeholder="Optional reason for leave..."
            />
          </div>
        </div>

        <div className="flex gap-3 mt-6">
          <button
            onClick={onClose}
            className="flex-1 px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200"
          >
            Cancel
          </button>
          <button
            onClick={handleSubmit}
            disabled={saving}
            className="flex-1 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 disabled:bg-gray-400"
          >
            {saving ? 'Saving...' : 'Submit'}
          </button>
        </div>
      </div>
    </div>
  );
};

// Assign Substitute Modal Component with Availability Check
interface FacultyAvailability {
  faculty_id: string;
  is_available: boolean;
  busy_with?: string;
  busy_class?: string;
}

const AssignSubstituteModal: React.FC<{
  substitution: Substitution;
  faculty: Faculty[];
  suggestedFaculty: Faculty[];
  collegeId: string | null;
  onClose: () => void;
  onAssign: (substituteId: string) => void;
}> = ({ substitution, faculty, suggestedFaculty, collegeId, onClose, onAssign }) => {
  const [selectedFacultyId, setSelectedFacultyId] = useState('');
  const [availability, setAvailability] = useState<Map<string, FacultyAvailability>>(new Map());
  const [loadingAvailability, setLoadingAvailability] = useState(true);

  // Fetch faculty availability when modal opens
  useEffect(() => {
    const fetchAvailability = async () => {
      if (!collegeId) return;
      
      setLoadingAvailability(true);
      try {
        // Calculate day of week from substitution date
        const subDate = new Date(substitution.substitution_date);
        let dayOfWeek = subDate.getDay(); // 0=Sun, 1=Mon, etc.
        if (dayOfWeek === 0) dayOfWeek = 7; // Convert Sunday to 7

        // Fetch all timetable slots for this day and period
        const { data: busySlots } = await supabase
          .from('college_timetable_slots')
          .select(`
            educator_id,
            subject_name,
            college_classes!class_id(name)
          `)
          .eq('day_of_week', dayOfWeek)
          .eq('period_number', substitution.period_number);

        // Build availability map
        const availMap = new Map<string, FacultyAvailability>();
        
        // Mark all faculty as available initially
        faculty.forEach(f => {
          availMap.set(f.id, { faculty_id: f.id, is_available: true });
        });

        // Mark busy faculty
        busySlots?.forEach((slot: any) => {
          if (slot.educator_id && slot.educator_id !== substitution.original_faculty_id) {
            availMap.set(slot.educator_id, {
              faculty_id: slot.educator_id,
              is_available: false,
              busy_with: slot.subject_name,
              busy_class: slot.college_classes?.name || '',
            });
          }
        });

        setAvailability(availMap);
      } catch (error) {
        console.error('Error fetching availability:', error);
      } finally {
        setLoadingAvailability(false);
      }
    };

    fetchAvailability();
  }, [substitution, faculty, collegeId]);

  const getAvailabilityStatus = (facultyId: string) => {
    const avail = availability.get(facultyId);
    if (!avail) return { available: true, text: '' };
    if (avail.is_available) return { available: true, text: 'Available' };
    return { 
      available: false, 
      text: `Busy: ${avail.busy_with} at ${avail.busy_class}` 
    };
  };

  // Sort faculty: available first, then busy
  const sortedFaculty = [...faculty]
    .filter(f => f.id !== substitution.original_faculty_id)
    .sort((a, b) => {
      const aAvail = availability.get(a.id)?.is_available ?? true;
      const bAvail = availability.get(b.id)?.is_available ?? true;
      if (aAvail && !bAvail) return -1;
      if (!aAvail && bAvail) return 1;
      return a.name.localeCompare(b.name);
    });

  const sortedSuggested = suggestedFaculty.sort((a, b) => {
    const aAvail = availability.get(a.id)?.is_available ?? true;
    const bAvail = availability.get(b.id)?.is_available ?? true;
    if (aAvail && !bAvail) return -1;
    if (!aAvail && bAvail) return 1;
    return 0;
  });

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-xl max-h-[90vh] overflow-y-auto">
        <h3 className="text-lg font-bold text-gray-900 mb-4">Assign Substitute</h3>

        <div className="bg-gray-50 rounded-lg p-4 mb-4">
          <div className="grid grid-cols-2 gap-2 text-sm">
            <div>
              <span className="text-gray-500">Date:</span>
              <span className="ml-2 font-medium">{new Date(substitution.substitution_date).toLocaleDateString()}</span>
            </div>
            <div>
              <span className="text-gray-500">Period:</span>
              <span className="ml-2 font-medium">P{substitution.period_number}</span>
            </div>
            <div>
              <span className="text-gray-500">Class:</span>
              <span className="ml-2 font-medium">{substitution.class_name}</span>
            </div>
            <div>
              <span className="text-gray-500">Subject:</span>
              <span className="ml-2 font-medium">{substitution.subject_name}</span>
            </div>
          </div>
          <div className="mt-2 pt-2 border-t border-gray-200">
            <span className="text-gray-500 text-sm">Replacing:</span>
            <span className="ml-2 font-medium text-red-600">{substitution.original_faculty_name}</span>
          </div>
        </div>

        {loadingAvailability ? (
          <div className="flex items-center justify-center py-4">
            <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-indigo-600"></div>
            <span className="ml-2 text-sm text-gray-500">Checking availability...</span>
          </div>
        ) : (
          <>
            {sortedSuggested.length > 0 && (
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Suggested (Subject Match)
                </label>
                <div className="space-y-2">
                  {sortedSuggested.map((f) => {
                    const status = getAvailabilityStatus(f.id);
                    return (
                      <button
                        key={f.id}
                        onClick={() => setSelectedFacultyId(f.id)}
                        disabled={!status.available}
                        className={`w-full text-left p-3 rounded-lg border transition ${
                          selectedFacultyId === f.id
                            ? 'border-indigo-500 bg-indigo-50'
                            : status.available
                              ? 'border-gray-200 hover:border-gray-300'
                              : 'border-red-200 bg-red-50 opacity-60 cursor-not-allowed'
                        }`}
                      >
                        <div className="flex items-center justify-between">
                          <div className="font-medium text-gray-900">{f.name}</div>
                          {status.available ? (
                            <span className="text-xs px-2 py-0.5 bg-green-100 text-green-700 rounded-full">
                              ✓ Available
                            </span>
                          ) : (
                            <span className="text-xs px-2 py-0.5 bg-red-100 text-red-700 rounded-full">
                              Busy
                            </span>
                          )}
                        </div>
                        <div className="text-xs text-gray-500">{f.department}</div>
                        {!status.available && (
                          <div className="text-xs text-red-600 mt-1">{status.text}</div>
                        )}
                      </button>
                    );
                  })}
                </div>
              </div>
            )}

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                {sortedSuggested.length > 0 ? 'Or select from all faculty' : 'Select Faculty'}
              </label>
              <select
                value={selectedFacultyId}
                onChange={(e) => setSelectedFacultyId(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
              >
                <option value="">Choose faculty...</option>
                {sortedFaculty.map((f) => {
                  const status = getAvailabilityStatus(f.id);
                  return (
                    <option 
                      key={f.id} 
                      value={f.id}
                      disabled={!status.available}
                      className={!status.available ? 'text-gray-400' : ''}
                    >
                      {f.name} - {f.department} {status.available ? '✓' : `(${status.text})`}
                    </option>
                  );
                })}
              </select>
              
              {/* Availability Legend */}
              <div className="flex gap-4 mt-2 text-xs">
                <span className="flex items-center gap-1">
                  <span className="w-2 h-2 rounded-full bg-green-500"></span>
                  Available
                </span>
                <span className="flex items-center gap-1">
                  <span className="w-2 h-2 rounded-full bg-red-500"></span>
                  Busy (has class)
                </span>
              </div>
            </div>
          </>
        )}

        <div className="flex gap-3 mt-6">
          <button
            onClick={onClose}
            className="flex-1 px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200"
          >
            Cancel
          </button>
          <button
            onClick={() => selectedFacultyId && onAssign(selectedFacultyId)}
            disabled={!selectedFacultyId || loadingAvailability}
            className="flex-1 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 disabled:bg-gray-400"
          >
            Assign
          </button>
        </div>
      </div>
    </div>
  );
};

// Add Lecturer Modal Component
const AddLecturerModal: React.FC<{
  collegeId: string | null;
  onClose: () => void;
  onSave: () => void;
}> = ({ collegeId, onClose, onSave }) => {
  const [form, setForm] = useState({
    first_name: '',
    last_name: '',
    email: '',
    phone: '',
    department: '',
    designation: '',
    employeeId: '',
  });
  const [saving, setSaving] = useState(false);

  const handleSubmit = async () => {
    if (!form.first_name || !form.last_name) {
      alert('First name and last name are required');
      return;
    }

    setSaving(true);
    try {
      const { error } = await supabase.from('college_lecturers').insert({
        collegeId: collegeId,
        first_name: form.first_name,
        last_name: form.last_name,
        email: form.email || null,
        phone: form.phone || null,
        department: form.department || null,
        designation: form.designation || null,
        employeeId: form.employeeId || null,
        accountStatus: 'active',
      });

      if (error) throw error;
      
      // Leave balances are automatically created by the database trigger
      onSave();
    } catch (error: any) {
      alert(`Error adding lecturer: ${error.message}`);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-xl max-h-[90vh] overflow-y-auto">
        <h3 className="text-lg font-bold text-gray-900 mb-4">Add New Faculty</h3>

        <div className="bg-green-50 border border-green-200 rounded-lg p-3 mb-4 text-sm text-green-800">
          Leave balances will be automatically created for all active leave types.
        </div>

        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">First Name *</label>
              <input
                type="text"
                value={form.first_name}
                onChange={(e) => setForm({ ...form, first_name: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
                placeholder="John"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Last Name *</label>
              <input
                type="text"
                value={form.last_name}
                onChange={(e) => setForm({ ...form, last_name: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
                placeholder="Doe"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
            <input
              type="email"
              value={form.email}
              onChange={(e) => setForm({ ...form, email: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
              placeholder="john.doe@example.com"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Phone</label>
            <input
              type="tel"
              value={form.phone}
              onChange={(e) => setForm({ ...form, phone: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
              placeholder="+91 9876543210"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Department</label>
              <input
                type="text"
                value={form.department}
                onChange={(e) => setForm({ ...form, department: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
                placeholder="Computer Science"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Designation</label>
              <input
                type="text"
                value={form.designation}
                onChange={(e) => setForm({ ...form, designation: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
                placeholder="Professor"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Employee ID</label>
            <input
              type="text"
              value={form.employeeId}
              onChange={(e) => setForm({ ...form, employeeId: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
              placeholder="EMP001"
            />
          </div>
        </div>

        <div className="flex gap-3 mt-6">
          <button
            onClick={onClose}
            className="flex-1 px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200"
          >
            Cancel
          </button>
          <button
            onClick={handleSubmit}
            disabled={saving}
            className="flex-1 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 disabled:bg-gray-400"
          >
            {saving ? 'Adding...' : 'Add Faculty'}
          </button>
        </div>
      </div>
    </div>
  );
};

// Edit Lecturer Modal Component
const EditLecturerModal: React.FC<{
  lecturer: LecturerWithBalances;
  collegeId: string | null;
  onClose: () => void;
  onSave: () => void;
}> = ({ lecturer, onClose, onSave }) => {
  const [form, setForm] = useState({
    first_name: lecturer.first_name,
    last_name: lecturer.last_name,
    email: lecturer.email,
    phone: lecturer.phone,
    department: lecturer.department,
    designation: lecturer.designation,
    employeeId: lecturer.employeeId,
    accountStatus: lecturer.accountStatus,
  });
  const [saving, setSaving] = useState(false);

  const handleSubmit = async () => {
    if (!form.first_name || !form.last_name) {
      alert('First name and last name are required');
      return;
    }

    setSaving(true);
    try {
      const { error } = await supabase
        .from('college_lecturers')
        .update({
          first_name: form.first_name,
          last_name: form.last_name,
          email: form.email || null,
          phone: form.phone || null,
          department: form.department || null,
          designation: form.designation || null,
          employeeId: form.employeeId || null,
          accountStatus: form.accountStatus,
        })
        .eq('id', lecturer.id);

      if (error) throw error;
      onSave();
    } catch (error: any) {
      alert(`Error updating lecturer: ${error.message}`);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-xl max-h-[90vh] overflow-y-auto">
        <h3 className="text-lg font-bold text-gray-900 mb-4">Edit Faculty</h3>

        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">First Name *</label>
              <input
                type="text"
                value={form.first_name}
                onChange={(e) => setForm({ ...form, first_name: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Last Name *</label>
              <input
                type="text"
                value={form.last_name}
                onChange={(e) => setForm({ ...form, last_name: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
            <input
              type="email"
              value={form.email}
              onChange={(e) => setForm({ ...form, email: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Phone</label>
            <input
              type="tel"
              value={form.phone}
              onChange={(e) => setForm({ ...form, phone: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Department</label>
              <input
                type="text"
                value={form.department}
                onChange={(e) => setForm({ ...form, department: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Designation</label>
              <input
                type="text"
                value={form.designation}
                onChange={(e) => setForm({ ...form, designation: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Employee ID</label>
              <input
                type="text"
                value={form.employeeId}
                onChange={(e) => setForm({ ...form, employeeId: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
              <select
                value={form.accountStatus}
                onChange={(e) => setForm({ ...form, accountStatus: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
              >
                <option value="active">Active</option>
                <option value="inactive">Inactive</option>
              </select>
            </div>
          </div>

          {/* Leave Balances Display */}
          {lecturer.leave_balances.length > 0 && (
            <div className="pt-4 border-t border-gray-200">
              <label className="block text-sm font-medium text-gray-700 mb-2">Leave Balances</label>
              <div className="space-y-2">
                {lecturer.leave_balances.map((bal) => (
                  <div key={bal.leave_type_id} className="flex items-center justify-between p-2 bg-gray-50 rounded-lg">
                    <span className="text-sm text-gray-700">{bal.leave_type_name}</span>
                    <span className="text-sm font-medium">
                      <span className="text-green-600">{bal.remaining_days}</span>
                      <span className="text-gray-400"> / {bal.total_days}</span>
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        <div className="flex gap-3 mt-6">
          <button
            onClick={onClose}
            className="flex-1 px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200"
          >
            Cancel
          </button>
          <button
            onClick={handleSubmit}
            disabled={saving}
            className="flex-1 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 disabled:bg-gray-400"
          >
            {saving ? 'Saving...' : 'Save Changes'}
          </button>
        </div>
      </div>
    </div>
  );
};

export default FacultyLeaveManagement;
