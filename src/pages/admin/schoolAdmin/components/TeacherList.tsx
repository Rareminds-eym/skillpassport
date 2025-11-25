import React, { useState, useEffect } from "react";
import { Search, Eye, CheckCircle, Clock, XCircle } from "lucide-react";
import { supabase } from "../../../../lib/supabaseClient";

interface Teacher {
  id: string;
  teacher_id: string;
  first_name: string;
  last_name: string;
  email: string;
  phone: string;
  onboarding_status: string;
  subject_expertise: any[];
  role: string;
  created_at: string;
}

const TeacherListPage: React.FC = () => {
  const [teachers, setTeachers] = useState<Teacher[]>([]);
  const [filteredTeachers, setFilteredTeachers] = useState<Teacher[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [loading, setLoading] = useState(true);
  const [selectedTeacher, setSelectedTeacher] = useState<Teacher | null>(null);

  useEffect(() => {
    loadTeachers();
  }, []);

  useEffect(() => {
    filterTeachers();
  }, [searchTerm, statusFilter, teachers]);

  const loadTeachers = async () => {
    setLoading(true);
    const { data } = await supabase
      .from("school_educators")
      .select("*")
      .order("created_at", { ascending: false });

    if (data) {
      setTeachers(data);
    }
    setLoading(false);
  };

  const filterTeachers = () => {
    let filtered = teachers;

    if (searchTerm) {
      filtered = filtered.filter(
        (t) =>
          t.first_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
          t.last_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
          t.teacher_id.toLowerCase().includes(searchTerm.toLowerCase()) ||
          t.email.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    if (statusFilter !== "all") {
      filtered = filtered.filter((t) => t.onboarding_status === statusFilter);
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
    }
  };

  return (
    <div className="space-y-6 p-4 sm:p-6 lg:p-8">
      {/* Header */}
      <div className="bg-gradient-to-r from-indigo-50 via-purple-50 to-pink-50 rounded-2xl p-6 border border-indigo-100">
        <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-1">
          Teachers
        </h1>
        <p className="text-gray-600 text-sm sm:text-base">
          View and manage all teachers in your school
        </p>
      </div>

      <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-6 space-y-6">
      <div className="flex flex-col sm:flex-row gap-4 justify-between">
        <h2 className="text-xl font-bold text-gray-900">Teachers List</h2>
        
        <div className="flex flex-col sm:flex-row gap-3">
          {/* Search */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
            <input
              type="text"
              placeholder="Search teachers..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 w-full sm:w-64"
            />
          </div>

          {/* Status Filter */}
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
          >
            <option value="all">All Status</option>
            <option value="pending">Pending</option>
            <option value="documents_uploaded">Documents Uploaded</option>
            <option value="verified">Verified</option>
            <option value="active">Active</option>
            <option value="inactive">Inactive</option>
          </select>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
        {["all", "pending", "documents_uploaded", "verified", "active"].map((status) => {
          const count =
            status === "all"
              ? teachers.length
              : teachers.filter((t) => t.onboarding_status === status).length;
          return (
            <div key={status} className="bg-gray-50 rounded-lg p-4 border border-gray-200">
              <p className="text-sm text-gray-600 capitalize">
                {status.replace(/_/g, " ")}
              </p>
              <p className="text-2xl font-bold text-gray-900">{count}</p>
            </div>
          );
        })}
      </div>

      {/* Teachers Table */}
      {loading ? (
        <div className="text-center py-12">
          <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
          <p className="mt-2 text-gray-600">Loading teachers...</p>
        </div>
      ) : (
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
                {filteredTeachers.map((teacher) => (
                  <tr key={teacher.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                      {teacher.teacher_id}
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
                      <button
                        onClick={() => setSelectedTeacher(teacher)}
                        className="text-indigo-600 hover:text-indigo-900 flex items-center gap-1"
                      >
                        <Eye className="h-4 w-4" />
                        View
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {filteredTeachers.length === 0 && (
            <div className="text-center py-12">
              <p className="text-gray-500">No teachers found</p>
            </div>
          )}
        </div>
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
                  <p className="text-sm text-gray-600">{selectedTeacher.teacher_id}</p>
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
                    <span className="text-gray-900">{selectedTeacher.phone || "N/A"}</span>
                  </p>
                </div>
              </div>

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
      </div>
    </div>
  );
};

export default TeacherListPage;
