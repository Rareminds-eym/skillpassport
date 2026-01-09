/* eslint-disable @typescript-eslint/no-explicit-any */
import React, { useState, useEffect } from "react";
import {
  PlusCircleIcon,
  XMarkIcon,
  PencilIcon,
  AcademicCapIcon,
  FunnelIcon,
  MagnifyingGlassIcon,
  ArrowPathIcon,
  TrashIcon,
} from "@heroicons/react/24/outline";
import { supabase } from "../../../lib/supabaseClient";
import toast from "react-hot-toast";

interface Program {
  id: string;
  name: string;
  code: string;
  description?: string;
  degree_level: string;
  department_id: string;
  department_name?: string;
  status: "active" | "inactive";
  created_at: string;
  updated_at: string;
}

interface Department {
  id: string;
  name: string;
  code: string;
  status: string;
}

const ProgramManagement: React.FC = () => {
  const [programs, setPrograms] = useState<Program[]>([]);
  const [departments, setDepartments] = useState<Department[]>([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedProgram, setSelectedProgram] = useState<Program | null>(null);
  
  // Filters
  const [departmentFilter, setDepartmentFilter] = useState("");
  const [degreeLevelFilter, setDegreeLevelFilter] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [searchTerm, setSearchTerm] = useState("");

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);

      // Load departments
      const { data: deptData, error: deptError } = await supabase
        .from("departments")
        .select("*")
        .order("name", { ascending: true });
      
      if (deptError) throw deptError;
      setDepartments(deptData || []);

      // Load programs with department names
      const { data: programsData, error: programsError } = await supabase
        .from("programs")
        .select(`
          *,
          departments (
            name
          )
        `)
        .order("name", { ascending: true });
      
      if (programsError) throw programsError;

      const formattedPrograms: Program[] = (programsData || []).map((p: any) => ({
        id: p.id,
        name: p.name,
        code: p.code,
        description: p.description,
        degree_level: p.degree_level,
        department_id: p.department_id,
        department_name: p.departments?.name || "No Department",
        status: p.status,
        created_at: p.created_at,
        updated_at: p.updated_at,
      }));

      setPrograms(formattedPrograms);
    } catch (error: any) {
      console.error("Error loading data:", error);
      toast.error(`Failed to load data: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateProgram = () => {
    setSelectedProgram(null);
    setIsModalOpen(true);
  };

  const handleEditProgram = (program: Program) => {
    setSelectedProgram(program);
    setIsModalOpen(true);
  };

  const handleDeleteProgram = async (program: Program) => {
    if (!confirm(`Are you sure you want to delete "${program.name}"? This will also delete all associated sections.`)) {
      return;
    }

    try {
      const { error } = await supabase
        .from("programs")
        .delete()
        .eq("id", program.id);

      if (error) throw error;
      
      toast.success("Program deleted successfully");
      loadData();
    } catch (error: any) {
      console.error("Error deleting program:", error);
      toast.error(`Failed to delete program: ${error.message}`);
    }
  };

  const handleSaveProgram = async (data: Partial<Program>) => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      
      if (selectedProgram) {
        // Update existing program
        const { error } = await supabase
          .from("programs")
          .update({
            name: data.name,
            code: data.code,
            description: data.description,
            degree_level: data.degree_level,
            department_id: data.department_id,
            status: data.status,
            updated_by: user?.id,
          })
          .eq("id", selectedProgram.id);

        if (error) throw error;
        toast.success("Program updated successfully");
      } else {
        // Create new program
        const { error } = await supabase
          .from("programs")
          .insert({
            name: data.name,
            code: data.code,
            description: data.description,
            degree_level: data.degree_level,
            department_id: data.department_id,
            status: data.status || "active",
            created_by: user?.id,
          });

        if (error) throw error;
        toast.success("Program created successfully");
      }
      
      setIsModalOpen(false);
      loadData();
    } catch (error: any) {
      console.error("Error saving program:", error);
      toast.error(`Failed to save program: ${error.message}`);
    }
  };

  const filteredPrograms = programs.filter((program) => {
    if (departmentFilter && program.department_id !== departmentFilter) return false;
    if (degreeLevelFilter && program.degree_level !== degreeLevelFilter) return false;
    if (statusFilter && program.status !== statusFilter) return false;
    if (searchTerm) {
      const search = searchTerm.toLowerCase();
      return (
        program.name.toLowerCase().includes(search) ||
        program.code.toLowerCase().includes(search) ||
        program.department_name?.toLowerCase().includes(search)
      );
    }
    return true;
  });

  const getStatusBadge = (status: string) => {
    return status === "active" ? (
      <span className="px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-700">
        Active
      </span>
    ) : (
      <span className="px-2 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-700">
        Inactive
      </span>
    );
  };

  const getDegreeLevelBadge = (level: string) => {
    const colors: Record<string, string> = {
      Undergraduate: "bg-blue-100 text-blue-700",
      Postgraduate: "bg-purple-100 text-purple-700",
      Diploma: "bg-orange-100 text-orange-700",
      Certificate: "bg-green-100 text-green-700",
    };
    
    return (
      <span className={`px-2 py-1 rounded-full text-xs font-medium ${colors[level] || "bg-gray-100 text-gray-700"}`}>
        {level}
      </span>
    );
  };

  // Calculate stats
  const totalPrograms = filteredPrograms.length;
  const activePrograms = filteredPrograms.filter((p) => p.status === "active").length;
  const undergraduatePrograms = filteredPrograms.filter((p) => p.degree_level === "Undergraduate").length;
  const postgraduatePrograms = filteredPrograms.filter((p) => p.degree_level === "Postgraduate").length;

  return (
    <div className="space-y-6 p-4 sm:p-6 lg:p-8">
      {/* Header */}
      <div className="bg-gradient-to-r from-blue-50 via-indigo-50 to-purple-50 rounded-2xl p-6 border border-blue-100">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-1">
              Program Management
            </h1>
            <p className="text-gray-600 text-sm sm:text-base">
              Manage academic programs and degree offerings
            </p>
          </div>
          <div className="flex gap-2">
            <button
              onClick={loadData}
              className="flex items-center gap-2 px-4 py-2 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition"
            >
              <ArrowPathIcon className="h-4 w-4" />
              Refresh
            </button>
            <button
              onClick={handleCreateProgram}
              className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition"
            >
              <PlusCircleIcon className="h-5 w-5" />
              Add Program
            </button>
          </div>
        </div>
      </div>

      {/* Summary Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-white rounded-xl border border-gray-200 p-4 shadow-sm">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs font-medium text-gray-500 uppercase tracking-wide mb-1">
                Total Programs
              </p>
              <p className="text-2xl font-bold text-gray-900">{totalPrograms}</p>
            </div>
            <div className="p-3 rounded-xl border bg-blue-50 text-blue-600 border-blue-200">
              <AcademicCapIcon className="h-5 w-5" />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl border border-gray-200 p-4 shadow-sm">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs font-medium text-gray-500 uppercase tracking-wide mb-1">
                Active Programs
              </p>
              <p className="text-2xl font-bold text-gray-900">{activePrograms}</p>
            </div>
            <div className="p-3 rounded-xl border bg-green-50 text-green-600 border-green-200">
              <AcademicCapIcon className="h-5 w-5" />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl border border-gray-200 p-4 shadow-sm">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs font-medium text-gray-500 uppercase tracking-wide mb-1">
                Undergraduate
              </p>
              <p className="text-2xl font-bold text-gray-900">{undergraduatePrograms}</p>
            </div>
            <div className="p-3 rounded-xl border bg-purple-50 text-purple-600 border-purple-200">
              <AcademicCapIcon className="h-5 w-5" />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl border border-gray-200 p-4 shadow-sm">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs font-medium text-gray-500 uppercase tracking-wide mb-1">
                Postgraduate
              </p>
              <p className="text-2xl font-bold text-gray-900">{postgraduatePrograms}</p>
            </div>
            <div className="p-3 rounded-xl border bg-indigo-50 text-indigo-600 border-indigo-200">
              <AcademicCapIcon className="h-5 w-5" />
            </div>
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-xl border border-gray-200 p-4">
        <div className="flex items-center gap-2 mb-4">
          <FunnelIcon className="h-5 w-5 text-gray-500" />
          <h2 className="text-lg font-semibold text-gray-900">Filters</h2>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="relative">
            <MagnifyingGlassIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
            <input
              type="text"
              placeholder="Search programs..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <select
            value={departmentFilter}
            onChange={(e) => setDepartmentFilter(e.target.value)}
            className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
          >
            <option value="">All Departments</option>
            {departments.map((dept) => (
              <option key={dept.id} value={dept.id}>
                {dept.name}
              </option>
            ))}
          </select>

          <select
            value={degreeLevelFilter}
            onChange={(e) => setDegreeLevelFilter(e.target.value)}
            className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
          >
            <option value="">All Degree Levels</option>
            <option value="Undergraduate">Undergraduate</option>
            <option value="Postgraduate">Postgraduate</option>
            <option value="Diploma">Diploma</option>
            <option value="Certificate">Certificate</option>
          </select>

          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
          >
            <option value="">All Status</option>
            <option value="active">Active</option>
            <option value="inactive">Inactive</option>
          </select>
        </div>
      </div>

      {/* Programs Table */}
      <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
        <div className="p-6 border-b border-gray-200">
          <h2 className="text-xl font-bold text-gray-900">
            Programs ({filteredPrograms.length})
          </h2>
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-12">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
          </div>
        ) : filteredPrograms.length === 0 ? (
          <div className="text-center py-12">
            <AcademicCapIcon className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <p className="text-gray-500 mb-2">No programs found</p>
            <button
              onClick={handleCreateProgram}
              className="text-blue-600 hover:text-blue-700 font-medium"
            >
              Create your first program
            </button>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  <th className="px-4 py-3 text-left text-sm font-semibold text-gray-900">
                    Program Name
                  </th>
                  <th className="px-4 py-3 text-left text-sm font-semibold text-gray-900">
                    Code
                  </th>
                  <th className="px-4 py-3 text-left text-sm font-semibold text-gray-900">
                    Department
                  </th>
                  <th className="px-4 py-3 text-left text-sm font-semibold text-gray-900">
                    Degree Level
                  </th>
                  <th className="px-4 py-3 text-left text-sm font-semibold text-gray-900">
                    Status
                  </th>
                  <th className="px-4 py-3 text-left text-sm font-semibold text-gray-900">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {filteredPrograms.map((program) => (
                  <tr key={program.id} className="hover:bg-gray-50">
                    <td className="px-4 py-3">
                      <div className="text-sm font-medium text-gray-900">{program.name}</div>
                      {program.description && (
                        <div className="text-xs text-gray-500 mt-1">{program.description}</div>
                      )}
                    </td>
                    <td className="px-4 py-3">
                      <span className="px-2 py-1 bg-gray-100 text-gray-700 rounded text-sm font-medium">
                        {program.code}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-900">
                      {program.department_name}
                    </td>
                    <td className="px-4 py-3">
                      {getDegreeLevelBadge(program.degree_level)}
                    </td>
                    <td className="px-4 py-3">{getStatusBadge(program.status)}</td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => handleEditProgram(program)}
                          className="p-1 text-blue-600 hover:bg-blue-50 rounded"
                          title="Edit program"
                        >
                          <PencilIcon className="h-4 w-4" />
                        </button>
                        <button
                          onClick={() => handleDeleteProgram(program)}
                          className="p-1 text-red-600 hover:bg-red-50 rounded"
                          title="Delete program"
                        >
                          <TrashIcon className="h-4 w-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Program Form Modal */}
      {isModalOpen && (
        <ProgramFormModal
          isOpen={isModalOpen}
          onClose={() => setIsModalOpen(false)}
          onSave={handleSaveProgram}
          program={selectedProgram}
          departments={departments}
        />
      )}
    </div>
  );
};

// Program Form Modal Component
const ProgramFormModal: React.FC<{
  isOpen: boolean;
  onClose: () => void;
  onSave: (data: Partial<Program>) => void;
  program: Program | null;
  departments: Department[];
}> = ({ isOpen, onClose, onSave, program, departments }) => {
  const [formData, setFormData] = useState({
    name: program?.name || "",
    code: program?.code || "",
    description: program?.description || "",
    degree_level: program?.degree_level || "Undergraduate",
    department_id: program?.department_id || "",
    status: program?.status || "active",
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave(formData);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      <div className="flex min-h-screen items-center justify-center p-4">
        <div
          className="fixed inset-0 bg-gray-900/60 backdrop-blur-sm"
          onClick={onClose}
        />
        <div className="relative w-full max-w-2xl bg-white rounded-2xl shadow-2xl">
          <div className="flex items-center justify-between border-b border-gray-200 px-6 py-5">
            <h2 className="text-xl font-semibold text-gray-900">
              {program ? "Edit Program" : "Create New Program"}
            </h2>
            <button
              onClick={onClose}
              className="p-2 text-gray-400 hover:bg-gray-100 rounded-lg"
            >
              <XMarkIcon className="h-5 w-5" />
            </button>
          </div>

          <form onSubmit={handleSubmit} className="p-6 space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Program Name *
                </label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) =>
                    setFormData({ ...formData, name: e.target.value })
                  }
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  placeholder="e.g., Bachelor of Technology in Computer Science"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Program Code *
                </label>
                <input
                  type="text"
                  value={formData.code}
                  onChange={(e) =>
                    setFormData({ ...formData, code: e.target.value.toUpperCase() })
                  }
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  placeholder="e.g., BTECH-CSE"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Department *
                </label>
                <select
                  value={formData.department_id}
                  onChange={(e) =>
                    setFormData({ ...formData, department_id: e.target.value })
                  }
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  required
                >
                  <option value="">Select Department</option>
                  {departments.map((dept) => (
                    <option key={dept.id} value={dept.id}>
                      {dept.name}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Degree Level *
                </label>
                <select
                  value={formData.degree_level}
                  onChange={(e) =>
                    setFormData({ ...formData, degree_level: e.target.value })
                  }
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  required
                >
                  <option value="Undergraduate">Undergraduate</option>
                  <option value="Postgraduate">Postgraduate</option>
                  <option value="Diploma">Diploma</option>
                  <option value="Certificate">Certificate</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Status *
                </label>
                <select
                  value={formData.status}
                  onChange={(e) =>
                    setFormData({ ...formData, status: e.target.value as "active" | "inactive" })
                  }
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  required
                >
                  <option value="active">Active</option>
                  <option value="inactive">Inactive</option>
                </select>
              </div>

              <div className="col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Description (Optional)
                </label>
                <textarea
                  value={formData.description}
                  onChange={(e) =>
                    setFormData({ ...formData, description: e.target.value })
                  }
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  placeholder="Brief description of the program..."
                  rows={3}
                />
              </div>
            </div>

            <div className="flex justify-end gap-3 pt-4 border-t border-gray-200">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition"
              >
                {program ? "Update Program" : "Create Program"}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default ProgramManagement;
