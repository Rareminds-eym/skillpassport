import React, { useState, useEffect } from "react";
import { Search, Eye, CheckCircle, Clock, XCircle, Grid3X3, List, Filter, Users, GraduationCap, UserCheck, UserX, Mail, Phone, MapPin } from "lucide-react";
import { supabase } from "../../../../lib/supabaseClient";
import { useAuth } from "../../../../context/AuthContext";
import DocumentViewerModal from "../../../../components/admin/modals/DocumentViewerModal";
import KPICard from "../../../../components/admin/KPICard";
import { updateTeacherStatus } from "@/services/teacherService";

interface Teacher {
  id: string;
  teacher_id: string;
  first_name: string;
  last_name: string;
  email: string;
  phone_number: string;
  onboarding_status: string;
  subject_expertise: any[];
  role: string;
  school_id: string;
  created_at: string;
  degree_certificate_url?: string;
  id_proof_url?: string;
  experience_letters_url?: string[];
  metadata?: {
    temporary_password?: string;
    password_created_at?: string;
    created_by?: string;
  };
}

const TeacherListPage: React.FC = () => {
  const { user } = useAuth();
  const [teachers, setTeachers] = useState<Teacher[]>([]);
  const [filteredTeachers, setFilteredTeachers] = useState<Teacher[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [roleFilter, setRoleFilter] = useState("all");
  const [subjectFilter, setSubjectFilter] = useState("all");
  const [showFilters, setShowFilters] = useState(false);
  const [viewMode, setViewMode] = useState<"grid" | "list">("list");
  const [currentPage, setCurrentPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [selectedTeacher, setSelectedTeacher] = useState<Teacher | null>(null);
  const [schoolId, setSchoolId] = useState<string | null>(null);
  const [showDocumentViewer, setShowDocumentViewer] = useState(false);
  const [documentViewerTeacher, setDocumentViewerTeacher] = useState<Teacher | null>(null);

  useEffect(() => {
    if (user?.email) {
      fetchSchoolId();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (schoolId) {
      loadTeachers();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [schoolId]);

  useEffect(() => {
    filterTeachers();
  }, [searchTerm, statusFilter, roleFilter, subjectFilter, teachers]);

  const fetchSchoolId = async () => {
    if (!user?.email) {
      console.error('No user email found');
      setLoading(false);
      return;
    }

    try {
      // First, try to get school_id from school_educators table
      const { data: educatorData, error: educatorError } = await supabase
        .from('school_educators')
        .select('school_id')
        .eq('email', user.email)
        .maybeSingle();

      if (educatorData?.school_id) {
        console.log('Found school_id from school_educators:', educatorData.school_id);
        setSchoolId(educatorData.school_id);
        return;
      }

      // If not found in school_educators, check if user is a school admin in schools table
      console.log('Not found in school_educators, checking schools table...');
      const { data: schoolData, error: schoolError } = await supabase
        .from('schools')
        .select('id')
        .eq('email', user.email)
        .maybeSingle();

      if (schoolError) {
        console.error('Error fetching from schools:', schoolError);
      }

      if (schoolData?.id) {
        console.log('Found school_id from schools table:', schoolData.id);
        setSchoolId(schoolData.id);
        return;
      }

      // Also try principal_email field
      const { data: schoolByPrincipal, error: principalError } = await supabase
        .from('schools')
        .select('id')
        .eq('principal_email', user.email)
        .maybeSingle();

      if (schoolByPrincipal?.id) {
        console.log('Found school_id from principal_email:', schoolByPrincipal.id);
        setSchoolId(schoolByPrincipal.id);
        return;
      }

      console.error('No school_id found for user in any table');
      setLoading(false);
    } catch (error) {
      console.error('Error in fetchSchoolId:', error);
      setLoading(false);
    }
  };

  const loadTeachers = async () => {
    if (!schoolId) {
      console.error('No school_id available');
      setLoading(false);
      return;
    }

    setLoading(true);
    try {
      const { data, error } = await supabase
        .from("school_educators")
        .select("*")
        .eq("school_id", schoolId)
        .order("created_at", { ascending: false });

      if (error) {
        console.error('Error loading teachers:', error);
      } else if (data) {
        console.log('Loaded teachers:', data.length);
        setTeachers(data);
      }
    } catch (error) {
      console.error('Error in loadTeachers:', error);
    } finally {
      setLoading(false);
    }
  };

  const filterTeachers = () => {
    let filtered = teachers;

    if (searchTerm) {
      filtered = filtered.filter(
        (t) =>
          t.first_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
          t.last_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
          t.teacher_id?.toLowerCase().includes(searchTerm.toLowerCase()) ||
          t.email?.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    if (statusFilter !== "all") {
      filtered = filtered.filter((t) => t.onboarding_status === statusFilter);
    }

    if (roleFilter !== "all") {
      filtered = filtered.filter((t) => t.role === roleFilter);
    }

    if (subjectFilter !== "all") {
      filtered = filtered.filter((t) => 
        t.subject_expertise?.some((subject: any) => 
          subject.name?.toLowerCase().includes(subjectFilter.toLowerCase())
        )
      );
    }

    setFilteredTeachers(filtered);
  };

  const getStatusBadge = (status: string) => {
    const statusConfig: Record<string, { color: string; icon: any; label: string }> = {
      pending: { color: "bg-yellow-100 text-yellow-800", icon: Clock, label: "Pending" },
      documents_uploaded: {
        color: "bg-blue-100 text-blue-800",
        icon: CheckCircle,
        label: "Documents Uploaded",
      },
      verified: { color: "bg-green-100 text-green-800", icon: CheckCircle, label: "Verified" },
      active: { color: "bg-green-100 text-green-800", icon: CheckCircle, label: "Active" },
      inactive: { color: "bg-gray-100 text-gray-800", icon: XCircle, label: "Inactive" },
    };

    const config = statusConfig[status] || statusConfig.pending;
    const Icon = config.icon;

    return (
      <span
        className={`inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-medium ${config.color}`}
      >
        <Icon className="h-3 w-3" />
        {config.label}
      </span>
    );
  };

  const updateTeacherStatus = async (teacherId: string, newStatus: string) => {
    const { error } = await supabase
      .from("school_educators")
      .update({ onboarding_status: newStatus })
      .eq("id", teacherId);

    if (!error) {
      loadTeachers();
      setSelectedTeacher(null);
    } else {
      console.error('Error updating teacher status:', error);
    }
  };

  const handleViewDocuments = (teacher: Teacher) => {
    setDocumentViewerTeacher(teacher);
    setShowDocumentViewer(true);
  };

  const hasDocuments = (teacher: Teacher) => {
    return teacher.degree_certificate_url || teacher.id_proof_url || (teacher.experience_letters_url && teacher.experience_letters_url.length > 0);
  };

  // KPI calculations
  const totalTeachers = teachers.length;
  const activeTeachers = teachers.filter(t => t.onboarding_status === 'active').length;
  const pendingTeachers = teachers.filter(t => t.onboarding_status === 'pending').length;
  const verifiedTeachers = teachers.filter(t => t.onboarding_status === 'verified').length;

  // Get unique subjects for filter
  const uniqueSubjects = React.useMemo(() => {
    const subjects = new Set<string>();
    teachers.forEach(teacher => {
      teacher.subject_expertise?.forEach((subject: any) => {
        if (subject.name) {
          subjects.add(subject.name);
        }
      });
    });
    return Array.from(subjects).sort();
  }, [teachers]);

  // Pagination logic
  const ITEMS_PER_PAGE = 6;
  const totalPages = Math.ceil(filteredTeachers.length / ITEMS_PER_PAGE);
  const paginatedTeachers = React.useMemo(() => {
    const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
    return filteredTeachers.slice(startIndex, startIndex + ITEMS_PER_PAGE);
  }, [filteredTeachers, currentPage]);

  // Reset pagination when filters change
  React.useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm, statusFilter, roleFilter, subjectFilter]);

  // Teacher Card Component for Grid View
  const TeacherCard: React.FC<{ teacher: Teacher }> = ({ teacher }) => (
    <div className="bg-white rounded-xl hover:shadow-lg transition-all duration-300 overflow-hidden shadow-sm border border-gray-200">
      {/* Header */}
      <div className="bg-gradient-to-r from-blue-50 to-indigo-50 p-4">
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-3">
            <div className="bg-white rounded-lg p-2 shadow-sm">
              <Users size={20} className="text-blue-600" />
            </div>
            <div>
              <h3 className="font-semibold text-gray-900 text-lg">
                {teacher.first_name} {teacher.last_name}
              </h3>
              <p className="text-sm text-gray-600">
                {teacher.teacher_id || <span className="text-gray-400 italic">ID not assigned</span>}
              </p>
            </div>
          </div>
          <div className="text-right">
            {getStatusBadge(teacher.onboarding_status)}
          </div>
        </div>
      </div>

      {/* Content - 2 Column Layout */}
      <div className="p-4">
        <div className="grid grid-cols-2 gap-4 mb-4">
          {/* Left Column */}
          <div className="space-y-3">
            {/* Contact Info */}
            <div>
              <div className="text-xs font-medium text-gray-700 mb-2">Contact</div>
              <div className="space-y-2">
                <div className="flex items-center gap-2 text-sm text-gray-600">
                  <Mail size={12} />
                  <span className="truncate text-xs">{teacher.email}</span>
                </div>
                {teacher.phone_number && (
                  <div className="flex items-center gap-2 text-sm text-gray-600">
                    <Phone size={12} />
                    <span className="text-xs">{teacher.phone_number}</span>
                  </div>
                )}
              </div>
            </div>

            {/* Role */}
            <div>
              <div className="text-xs font-medium text-gray-700 mb-2">Role</div>
              <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                teacher.role === 'school_admin' ? 'bg-indigo-100 text-indigo-800' :
                teacher.role === 'principal' ? 'bg-purple-100 text-purple-800' :
                teacher.role === 'it_admin' ? 'bg-blue-100 text-blue-800' :
                teacher.role === 'class_teacher' ? 'bg-green-100 text-green-800' :
                'bg-gray-100 text-gray-800'
              }`}>
                {teacher.role === 'school_admin' ? 'School Admin' :
                 teacher.role === 'principal' ? 'Principal' :
                 teacher.role === 'it_admin' ? 'IT Admin' :
                 teacher.role === 'class_teacher' ? 'Class Teacher' :
                 'Subject Teacher'}
              </span>
            </div>
          </div>

          {/* Right Column */}
          <div className="space-y-3">
            {/* Subjects */}
            <div>
              <div className="text-xs font-medium text-gray-700 mb-2">Subjects</div>
              <div className="flex flex-wrap gap-1">
                {teacher.subject_expertise?.slice(0, 2).map((subject: any, idx: number) => (
                  <span
                    key={idx}
                    className="px-2 py-1 bg-indigo-100 text-indigo-800 rounded text-xs"
                  >
                    {subject.name}
                  </span>
                ))}
                {teacher.subject_expertise?.length > 2 && (
                  <span className="px-2 py-1 bg-gray-100 text-gray-600 rounded text-xs">
                    +{teacher.subject_expertise.length - 2}
                  </span>
                )}
                {(!teacher.subject_expertise || teacher.subject_expertise.length === 0) && (
                  <span className="text-xs text-gray-400 italic">No subjects</span>
                )}
              </div>
            </div>

            {/* Created Date */}
            <div>
              <div className="text-xs font-medium text-gray-700 mb-2">Joined</div>
              <div className="text-xs text-gray-600">
                {new Date(teacher.created_at).toLocaleDateString('en-US', { 
                  year: 'numeric', 
                  month: 'short', 
                  day: 'numeric' 
                })}
              </div>
            </div>
          </div>
        </div>

        {/* Action Buttons - Full Width */}
        <div className="space-y-2">
          <div className="flex items-center gap-2">
            <button
              onClick={() => setSelectedTeacher(teacher)}
              className="flex items-center justify-center gap-2 flex-1 text-sm px-3 py-2 border border-gray-200 rounded-lg bg-white text-gray-700 hover:bg-gray-50 hover:border-gray-300 transition-colors"
            >
              <Eye size={14} />
              View Details
            </button>
            {hasDocuments(teacher) && (
              <button
                onClick={() => handleViewDocuments(teacher)}
                className="flex items-center justify-center gap-2 flex-1 text-sm px-3 py-2 rounded-lg bg-green-50 text-green-700 hover:bg-green-100 border border-green-200 transition-colors"
              >
                <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
                Docs
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50/30 to-indigo-50/30">
      <div className="max-w-7xl mx-auto p-6">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 mb-2">Teachers</h1>
              <p className="text-gray-600">View and manage all teachers in your school</p>
            </div>
          </div>
        </div>

        {/* KPI Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <KPICard
            title="Total Teachers"
            value={totalTeachers}
            icon={<Users size={24} />}
            color="blue"
            loading={loading}
          />
          <KPICard
            title="Active Teachers"
            value={activeTeachers}
            icon={<UserCheck size={24} />}
            color="green"
            loading={loading}
          />
          <KPICard
            title="Pending Approval"
            value={pendingTeachers}
            icon={<Clock size={24} />}
            color="yellow"
            loading={loading}
          />
          <KPICard
            title="Verified"
            value={verifiedTeachers}
            icon={<CheckCircle size={24} />}
            color="purple"
            loading={loading}
          />
        </div>
        <div className="flex items-center justify-between mb-7">
            <h2 className="text-2xl font-bold text-gray-900 ">Teachers List</h2>
          </div>
        {/* Enhanced Search and Filter Bar */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 mb-6">
          

          <div className="flex items-center gap-4">
            {/* Search */}
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
              <input
                type="text"
                placeholder="Search teachers by name, ID, or email..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-3 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>

            {/* Filters Dropdown */}
            <div className="relative">
              <button
                onClick={() => setShowFilters(!showFilters)}
                className="flex items-center gap-2 px-4 py-3 border border-gray-200 rounded-lg bg-white hover:bg-gray-50 transition-colors"
              >
                <Filter size={18} className="text-gray-600" />
                <span className="text-gray-700 font-medium">Filters</span>
                <svg 
                  className={`w-4 h-4 text-gray-600 transition-transform ${showFilters ? 'rotate-180' : ''}`} 
                  fill="none" 
                  stroke="currentColor" 
                  viewBox="0 0 24 24"
                >
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
              </button>

              {/* Filters Dropdown Content */}
              {showFilters && (
                <div className="absolute right-0 mt-2 w-80 bg-white rounded-xl shadow-xl border border-gray-200 z-50 overflow-hidden">
                  <div className="p-4">
                    <div className="space-y-4">
                      {/* Status Filter */}
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">Status</label>
                        <select
                          value={statusFilter}
                          onChange={(e) => setStatusFilter(e.target.value)}
                          className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent appearance-none bg-white"
                        >
                          <option value="all">All Status</option>
                          <option value="pending">Pending</option>
                          <option value="documents_uploaded">Documents Uploaded</option>
                          <option value="verified">Verified</option>
                          <option value="active">Active</option>
                          <option value="inactive">Inactive</option>
                        </select>
                      </div>

                      {/* Role Filter */}
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">Role</label>
                        <select
                          value={roleFilter}
                          onChange={(e) => setRoleFilter(e.target.value)}
                          className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent appearance-none bg-white"
                        >
                          <option value="all">All Roles</option>
                          <option value="school_admin">School Admin</option>
                          <option value="principal">Principal</option>
                          <option value="it_admin">IT Admin</option>
                          <option value="class_teacher">Class Teacher</option>
                          <option value="subject_teacher">Subject Teacher</option>
                        </select>
                      </div>

                      {/* Subject Filter */}
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">Subject Expertise</label>
                        <select
                          value={subjectFilter}
                          onChange={(e) => setSubjectFilter(e.target.value)}
                          className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent appearance-none bg-white"
                        >
                          <option value="all">All Subjects</option>
                          {uniqueSubjects.map((subject) => (
                            <option key={subject} value={subject}>
                              {subject}
                            </option>
                          ))}
                        </select>
                      </div>

                      {/* Clear Filters Button */}
                      {(searchTerm || statusFilter !== "all" || roleFilter !== "all" || subjectFilter !== "all") && (
                        <div className="pt-2 border-t border-gray-200">
                          <button
                            onClick={() => {
                              setSearchTerm("");
                              setStatusFilter("all");
                              setRoleFilter("all");
                              setSubjectFilter("all");
                              setShowFilters(false);
                            }}
                            className="w-full px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors font-medium"
                          >
                            Clear All Filters
                          </button>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* View Toggle */}
            <div className="flex items-center gap-2 bg-gray-100 rounded-lg p-1">
              <button
                onClick={() => setViewMode("grid")}
                className={`p-2 rounded-md transition-colors ${
                  viewMode === "grid" 
                    ? "bg-white text-blue-600 shadow-sm" 
                    : "text-gray-600 hover:text-gray-900"
                }`}
                title="Grid View"
              >
                <Grid3X3 size={18} />
              </button>
              <button
                onClick={() => setViewMode("list")}
                className={`p-2 rounded-md transition-colors ${
                  viewMode === "list" 
                    ? "bg-white text-blue-600 shadow-sm" 
                    : "text-gray-600 hover:text-gray-900"
                }`}
                title="List View"
              >
                <List size={18} />
              </button>
            </div>
          </div>

          {/* Results Summary */}
          <div className="mt-4 flex items-center justify-between text-sm text-gray-600">
            
            {(searchTerm || statusFilter !== "all" || roleFilter !== "all" || subjectFilter !== "all") && (
              <div className="flex items-center gap-2">
                <span className="text-blue-600">Filters applied:</span>
                <div className="flex items-center gap-1">
                  {searchTerm && (
                    <span className="px-2 py-1 bg-blue-100 text-blue-800 rounded-full text-xs">
                      Search: "{searchTerm}"
                    </span>
                  )}
                  {statusFilter !== "all" && (
                    <span className="px-2 py-1 bg-blue-100 text-blue-800 rounded-full text-xs">
                      Status: {statusFilter.replace(/_/g, " ")}
                    </span>
                  )}
                  {roleFilter !== "all" && (
                    <span className="px-2 py-1 bg-blue-100 text-blue-800 rounded-full text-xs">
                      Role: {roleFilter.replace(/_/g, " ")}
                    </span>
                  )}
                  {subjectFilter !== "all" && (
                    <span className="px-2 py-1 bg-blue-100 text-blue-800 rounded-full text-xs">
                      Subject: {subjectFilter}
                    </span>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Teachers Content */}
        {loading ? (
          <div className="text-center py-12">
            <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
            <p className="mt-2 text-gray-600">Loading teachers...</p>
          </div>
        ) : !schoolId ? (
          <div className="text-center py-12">
            <div className="text-yellow-600 mb-4">
              <svg className="mx-auto h-12 w-12" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
              </svg>
            </div>
            <p className="text-gray-900 font-semibold">No School Found</p>
            <p className="text-gray-600 mt-2">
              Your account is not linked to any school. Please contact your administrator.
            </p>
            <p className="text-sm text-gray-500 mt-4">
              User email: {user?.email || 'Not logged in'}
            </p>
          </div>
        ) : filteredTeachers.length === 0 ? (
          <div className="bg-white rounded-xl p-12 text-center shadow-sm">
            <Users size={48} className="text-gray-300 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">No teachers found</h3>
            <p className="text-gray-500 mb-4">
              {searchTerm || statusFilter !== "all" || roleFilter !== "all" 
                ? "Try adjusting your search or filters" 
                : "No teachers have been added to this school yet"}
            </p>
          </div>
        ) : (
          <>
            {/* Grid View */}
            {viewMode === "grid" && (
              <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
                {paginatedTeachers.map((teacher) => (
                  <TeacherCard key={teacher.id} teacher={teacher} />
                ))}
              </div>
            )}

            {/* List View */}
            {viewMode === "list" && (
              <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Teacher ID
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Name
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Email
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Role
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Subjects
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Status
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Actions
                        </th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {paginatedTeachers.map((teacher) => (
                        <tr key={teacher.id} className="hover:bg-gray-50">
                          <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                            {teacher.teacher_id || <span className="text-gray-400 italic">Not assigned</span>}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                            {teacher.first_name} {teacher.last_name}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                            {teacher.email}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm">
                            <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                              teacher.role === 'school_admin' ? 'bg-indigo-100 text-indigo-800' :
                              teacher.role === 'principal' ? 'bg-purple-100 text-purple-800' :
                              teacher.role === 'it_admin' ? 'bg-blue-100 text-blue-800' :
                              teacher.role === 'class_teacher' ? 'bg-green-100 text-green-800' :
                              'bg-gray-100 text-gray-800'
                            }`}>
                              {teacher.role === 'school_admin' ? 'School Admin' :
                               teacher.role === 'principal' ? 'Principal' :
                               teacher.role === 'it_admin' ? 'IT Admin' :
                               teacher.role === 'class_teacher' ? 'Class Teacher' :
                               'Subject Teacher'}
                            </span>
                          </td>
                          <td className="px-6 py-4 text-sm text-gray-600">
                            <div className="flex flex-wrap gap-1">
                              {teacher.subject_expertise?.slice(0, 2).map((subject: any, idx: number) => (
                                <span
                                  key={idx}
                                  className="px-2 py-1 bg-indigo-100 text-indigo-800 rounded text-xs"
                                >
                                  {subject.name}
                                </span>
                              ))}
                              {teacher.subject_expertise?.length > 2 && (
                                <span className="px-2 py-1 bg-gray-100 text-gray-600 rounded text-xs">
                                  +{teacher.subject_expertise.length - 2}
                                </span>
                              )}
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            {getStatusBadge(teacher.onboarding_status)}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm">
                            <div className="flex items-center gap-2">
                              <button
                                onClick={() => setSelectedTeacher(teacher)}
                                className="text-indigo-600 hover:text-indigo-900 flex items-center gap-1"
                              >
                                <Eye className="h-4 w-4" />
                                View
                              </button>
                              {hasDocuments(teacher) && (
                                <button
                                  onClick={() => handleViewDocuments(teacher)}
                                  className="text-green-600 hover:text-green-900 flex items-center gap-1 ml-2"
                                  title="View Documents"
                                >
                                  <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                                  </svg>
                                  Docs
                                </button>
                              )}
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="mt-8 flex items-center justify-between bg-white rounded-xl border border-gray-200 p-4">
                <button
                  onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
                  disabled={currentPage === 1}
                  className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors"
                >
                  ← Previous
                </button>
                
                <div className="flex items-center gap-4">
                  <span className="text-sm text-gray-600">
                    Page {currentPage} of {totalPages}
                  </span>
                  <span className="text-xs text-gray-500 bg-gray-100 px-2 py-1 rounded-full">
                    {filteredTeachers.length} total teachers
                  </span>
                </div>
                
                <button
                  onClick={() => setCurrentPage(Math.min(totalPages, currentPage + 1))}
                  disabled={currentPage === totalPages}
                  className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors"
                >
                  Next →
                </button>
              </div>
            )}
          </>
        )}

        {/* Teacher Detail Modal */}
        {selectedTeacher && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
              <div className="p-6 border-b border-gray-200">
                <div className="flex justify-between items-start">
                  <div>
                    <h3 className="text-xl font-bold text-gray-900">
                      {selectedTeacher.first_name} {selectedTeacher.last_name}
                    </h3>
                    <p className="text-sm text-gray-600">
                      {selectedTeacher.teacher_id || <span className="text-gray-400 italic">ID not assigned</span>}
                    </p>
                  </div>
                  <button
                    onClick={() => setSelectedTeacher(null)}
                    className="text-gray-400 hover:text-gray-600"
                  >
                    <XCircle className="h-6 w-6" />
                  </button>
                </div>
              </div>

              <div className="p-6 space-y-6">
                {/* Contact Info */}
                <div>
                  <h4 className="font-semibold text-gray-900 mb-3">Contact Information</h4>
                  <div className="space-y-2 text-sm">
                    <p>
                      <span className="text-gray-600">Email:</span>{" "}
                      <span className="text-gray-900">{selectedTeacher.email}</span>
                    </p>
                    <p>
                      <span className="text-gray-600">Phone:</span>{" "}
                      <span className="text-gray-900">{selectedTeacher.phone_number || "N/A"}</span>
                    </p>
                  </div>
                </div>

                {/* Login Credentials */}
                {selectedTeacher.metadata && (selectedTeacher.metadata as any).temporary_password && (
                  <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                    <h4 className="font-semibold text-yellow-900 mb-3 flex items-center gap-2">
                      <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                      </svg>
                      Login Credentials
                    </h4>
                    <div className="space-y-2 text-sm">
                      <p>
                        <span className="text-yellow-700 font-medium">Temporary Password:</span>{" "}
                        <code className="bg-yellow-100 px-2 py-1 rounded text-yellow-900 font-mono">
                          {(selectedTeacher.metadata as any).temporary_password}
                        </code>
                      </p>
                      <p className="text-yellow-600 text-xs">
                        Created: {new Date((selectedTeacher.metadata as any).password_created_at).toLocaleString()}
                      </p>
                      <p className="text-yellow-600 text-xs mt-2">
                        ⚠️ Please share this password securely with the teacher. They should change it after first login.
                      </p>
                    </div>
                  </div>
                )}

                {/* Subject Expertise */}
                <div>
                  <h4 className="font-semibold text-gray-900 mb-3">Subject Expertise</h4>
                  <div className="space-y-2">
                    {selectedTeacher.subject_expertise?.map((subject: any, idx: number) => (
                      <div
                        key={idx}
                        className="flex items-center justify-between p-3 bg-gray-50 rounded-lg"
                      >
                        <span className="font-medium text-gray-900">{subject.name}</span>
                        <div className="flex items-center gap-3 text-sm">
                          <span className="text-gray-600 capitalize">{subject.proficiency}</span>
                          <span className="text-gray-500">{subject.years_experience} years</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Status Update */}
                <div>
                  <h4 className="font-semibold text-gray-900 mb-3">Update Status</h4>
                  <div className="flex gap-2">
                    {["verified", "active", "inactive"].map((status) => (
                      <button
                        key={status}
                        onClick={() => updateTeacherStatus(selectedTeacher.id, status)}
                        className={`px-4 py-2 rounded-lg font-medium transition ${
                          selectedTeacher.onboarding_status === status
                            ? "bg-indigo-600 text-white"
                            : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                        }`}
                      >
                        {status.charAt(0).toUpperCase() + status.slice(1)}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Document Viewer Modal */}
        {showDocumentViewer && documentViewerTeacher && (
          <DocumentViewerModal
            isOpen={showDocumentViewer}
            onClose={() => {
              setShowDocumentViewer(false);
              setDocumentViewerTeacher(null);
            }}
            documents={{
              degreeUrl: documentViewerTeacher.degree_certificate_url,
              idProofUrl: documentViewerTeacher.id_proof_url,
              experienceUrls: documentViewerTeacher.experience_letters_url,
            }}
            personName={`${documentViewerTeacher.first_name} ${documentViewerTeacher.last_name}`}
            personType="teacher"
          />
        )}
      </div>
    </div>
  );
};

export default TeacherListPage;
