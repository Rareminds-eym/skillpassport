/* eslint-disable @typescript-eslint/no-explicit-any */
import React, { useEffect, useMemo, useState } from "react";
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'react-hot-toast';
import { useAuth } from '@/context/AuthContext';
import { departmentService, DepartmentWithStats, Faculty } from '@/services/college/departmentService';
import { supabase } from '../../../lib/supabaseClient';
import {
  FunnelIcon,
  TableCellsIcon,
  Squares2X2Icon,
  EyeIcon,
  XMarkIcon,
  BuildingOffice2Icon,
  UserGroupIcon,
  PlusCircleIcon,
  TrashIcon,
  ChevronDownIcon,
  EnvelopeIcon,
  AcademicCapIcon,
  BookOpenIcon,
  EllipsisVerticalIcon,
  PencilSquareIcon,
  UserIcon,
  ChevronUpIcon,
} from "@heroicons/react/24/outline";
import SearchBar from "../../../components/common/SearchBar";
import Pagination from "../../../components/admin/Pagination";

// Import modal components
import FacultyAssignmentModal from "../../../components/admin/collegeAdmin/FacultyAssignmentModal";
import HODAssignmentModal from "../../../components/admin/collegeAdmin/HODAssignmentModal";
import AddDepartmentModal from "../../../components/admin/collegeAdmin/AddDepartmentModal";
import EditDepartmentModal from "../../../components/admin/collegeAdmin/EditDepartmentModal";
import DepartmentDetailsDrawer from "../../../components/admin/collegeAdmin/DepartmentDetailsDrawer";
import ConfirmationModal from "../../../components/ui/ConfirmationModal";

// Types
interface Course {
  id: number;
  code: string;
  name: string;
  credits: number;
  semester: number;
}

interface Program {
  id: string;
  name: string;
  code: string;
  degree_level: string;
  description?: string;
  status?: string;
}

// Use the Faculty type from the service
// Remove the local Faculty interface since we're importing it

// Use the Department type from the service
type Department = DepartmentWithStats & {
  hod?: string;
  hodId?: string;
  email?: string;
  facultyCount?: number;
  studentCount?: number;
  courses?: Course[];
  faculty?: Faculty[];
  description?: string | null; // Make compatible with modal components
  programs_offered?: Program[];
};

const FilterSection = ({ title, children, defaultOpen = false }: any) => {
  const [isOpen, setIsOpen] = useState(defaultOpen);
  return (
    <div className="border-b border-gray-200 py-4">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center justify-between w-full text-left"
        type="button"
        aria-expanded={isOpen}
      >
        <span className="text-sm font-medium text-gray-900">{title}</span>
        <ChevronDownIcon
          className={`h-4 w-4 transition-transform ${isOpen ? "rotate-180" : ""
            }`}
        />
      </button>
      {isOpen && <div className="mt-3 space-y-2">{children}</div>}
    </div>
  );
};

const CheckboxGroup = ({ options, selectedValues, onChange }: any) => (
  <>
    {options.map((opt: any) => (
      <label key={opt.value} className="flex items-center text-sm text-gray-700">
        <input
          type="checkbox"
          checked={selectedValues.includes(opt.value)}
          onChange={(e) => {
            if (e.target.checked)
              onChange([...selectedValues, opt.value]);
            else onChange(selectedValues.filter((v: string) => v !== opt.value));
          }}
          className="h-4 w-4 text-indigo-600 border-gray-300 rounded focus:ring-indigo-500"
        />
        <span className="ml-2">{opt.label}</span>
        {opt.count !== undefined && (
          <span className="ml-auto text-xs text-gray-500">({opt.count})</span>
        )}
      </label>
    ))}
  </>
);

const StatusBadge = ({ status }: { status: string }) => {
  const config: Record<string, string> = {
    Active: "bg-emerald-100 text-emerald-700",
    Inactive: "bg-gray-100 text-gray-600",
  };

  return (
    <span
      className={`inline-flex items-center px-2.5 py-0.5 rounded text-xs font-medium ${config[status] || "bg-gray-100 text-gray-600"
        }`}
    >
      {status}
    </span>
  );
};

const EmptyState = ({ onCreate }: { onCreate: () => void }) => {
  return (
    <div className="flex flex-col items-center justify-center text-center bg-white border border-dashed border-gray-300 rounded-lg p-10">
      <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-indigo-50 text-indigo-600">
        <BuildingOffice2Icon className="h-8 w-8" />
      </div>
      <h2 className="mt-4 text-lg font-semibold text-gray-900">
        No departments yet
      </h2>
      <p className="mt-2 text-sm text-gray-500 max-w-sm">
        No departments found. Create a new department to get started with your
        institution management.
      </p>
      <div className="mt-6">
        <button
          onClick={onCreate}
          className="inline-flex items-center justify-center rounded-md bg-indigo-600 px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-indigo-700"
          type="button"
        >
          <PlusCircleIcon className="h-4 w-4 mr-2" />
          Add Department
        </button>
      </div>
    </div>
  );
};

const DepartmentManagement: React.FC = () => {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  
  // Fetch college ID from colleges table using created_by
  const { data: collegeData, error: collegeError } = useQuery({
    queryKey: ['userCollege', user?.id],
    queryFn: async () => {
      console.log('Fetching college for user:', user?.id);
      const { data, error } = await supabase
        .from('colleges')
        .select('id, name')
        .eq('created_by', user?.id)
        .single();
      
      if (error) {
        console.error('Error fetching college:', error);
        // If query fails, try to get from deanEmail match
        const { data: collegeByEmail, error: emailError } = await supabase
          .from('colleges')
          .select('id, name')
          .eq('deanEmail', user?.email)
          .single();
        
        if (emailError) {
          console.error('Error fetching college by email:', emailError);
          throw emailError;
        }
        
        console.log('College data fetched by email:', collegeByEmail);
        return collegeByEmail;
      }
      
      console.log('College data fetched:', data);
      return data;
    },
    enabled: !!user?.id,
    retry: 1,
  });
  
  const collegeId = collegeData?.id;
  
  useEffect(() => {
    console.log('College ID updated:', collegeId);
    console.log('College data:', collegeData);
    console.log('College error:', collegeError);
  }, [collegeId, collegeData, collegeError]);

  const [viewMode, setViewMode] = useState("grid");
  const [showFilters, setShowFilters] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(25);
  const [detailDepartment, setDetailDepartment] = useState<Department | null>(null);
  const [assignedFaculty, setAssignedFaculty] = useState<Faculty[]>([]);
  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showFacultyAssignmentModal, setShowFacultyAssignmentModal] = useState(false);
  const [showHODAssignmentModal, setShowHODAssignmentModal] = useState(false);
  const [selectedDepartment, setSelectedDepartment] = useState<Department | null>(null);
  const [openDropdownId, setOpenDropdownId] = useState<string | null>(null);
  const [showDeleteConfirmation, setShowDeleteConfirmation] = useState(false);
  const [departmentToDelete, setDepartmentToDelete] = useState<string | null>(null);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as HTMLElement;
      
      // Don't close if clicking inside dropdown or modal
      if (target.closest('.dropdown-container') || 
          target.closest('[role="dialog"]') || 
          target.closest('.modal-backdrop')) {
        return;
      }
      
      setOpenDropdownId(null);
    };

    if (openDropdownId) {
      document.addEventListener('click', handleClickOutside);
      
      return () => {
        document.removeEventListener('click', handleClickOutside);
      };
    }
  }, [openDropdownId]);



  // Fetch departments from database
  const { data: departmentsData = [], isLoading, error } = useQuery({
    queryKey: ['departments', collegeId],
    queryFn: () => departmentService.getDepartments(collegeId!),
    enabled: !!collegeId,
  });

  // Transform database departments to match UI expectations
  const departments: Department[] = useMemo(() => {
    return departmentsData.map(dept => ({
      ...dept,
      id: dept.id as any, // Keep as string but cast for compatibility
      facultyCount: dept.faculty_count || 0,
      studentCount: dept.student_count || 0,
      status: dept.status || 'Active',
      hod: dept.metadata?.hod || 'Not Assigned',
      email: dept.metadata?.email || '',
      courses: [],
      faculty: [],
      programs_offered: dept.programs_offered || [],
    }));
  }, [departmentsData]);

  // Create department mutation
  const createDepartmentMutation = useMutation({
    mutationFn: (data: any) => {
      console.log('Creating department with collegeId:', collegeId);
      console.log('User ID:', user?.id);
      console.log('Form data:', data);
      
      if (!collegeId) {
        throw new Error('College ID not found. Please refresh the page and try again.');
      }
      
      return departmentService.createDepartment({
        school_id: null,
        college_id: collegeId,
        name: data.name,
        code: data.code,
        description: data.description,
        status: data.status?.toLowerCase() || 'active',
        metadata: data.metadata || null,
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['departments'] });
      toast.success('Department created successfully');
      setShowAddModal(false);
    },
    onError: (error: any) => {
      toast.error(error.message || 'Failed to create department');
    },
  });

  // Update department mutation
  const updateDepartmentMutation = useMutation({
    mutationFn: ({ id, updates }: { id: string; updates: any }) =>
      departmentService.updateDepartment(id, {
        name: updates.name,
        code: updates.code,
        description: updates.description,
        status: updates.status?.toLowerCase(),
        metadata: updates.metadata, // Include metadata updates for HOD info
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['departments'] });
      toast.success('Department updated successfully');
      setShowEditModal(false);
      setSelectedDepartment(null);
    },
    onError: (error: any) => {
      toast.error(error.message || 'Failed to update department');
    },
  });

  // Delete department mutation
  const deleteDepartmentMutation = useMutation({
    mutationFn: (id: string) => departmentService.deleteDepartment(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['departments'] });
      toast.success('Department deleted successfully');
      if (detailDepartment) setDetailDepartment(null);
    },
    onError: (error: any) => {
      toast.error(error.message || 'Failed to delete department');
    },
  });

  // Sample data for courses and faculty (these would also come from API in production)
  const [allCourses] = useState<Course[]>([
    { id: 1, code: "CS101", name: "Introduction to Programming", credits: 4, semester: 1 },
    { id: 2, code: "CS102", name: "Data Structures", credits: 4, semester: 2 },
    { id: 3, code: "CS201", name: "Algorithms", credits: 4, semester: 3 },
    { id: 4, code: "CS202", name: "Database Systems", credits: 3, semester: 4 },
    { id: 5, code: "EC101", name: "Circuit Theory", credits: 4, semester: 1 },
    { id: 6, code: "EC102", name: "Digital Electronics", credits: 4, semester: 2 },
    { id: 7, code: "ME101", name: "Engineering Mechanics", credits: 4, semester: 1 },
    { id: 8, code: "ME102", name: "Thermodynamics", credits: 4, semester: 2 },
  ]);

  // Fetch all faculty for the college dynamically
  const { data: allFaculty = [], isLoading: facultyLoading } = useQuery({
    queryKey: ['college-faculty', collegeId],
    queryFn: () => departmentService.getCollegeFaculty(collegeId!),
    enabled: !!collegeId,
  });

  const [filters, setFilters] = useState({ 
    status: [] as string[],
    hodAssigned: [] as string[],
    facultyRange: [] as string[],
    hasPrograms: [] as string[],
  });

  // Sorting state
  type SortField = 'name' | 'code' | 'facultyCount' | 'studentCount' | 'programCount' | 'createdAt';
  type SortDirection = 'asc' | 'desc';
  const [sortField, setSortField] = useState<SortField>('name');
  const [sortDirection, setSortDirection] = useState<SortDirection>('asc');

  // Sort options for dropdown
  const sortOptions = [
    { value: 'name', label: 'Department Name' },
    { value: 'code', label: 'Department Code' },
    { value: 'facultyCount', label: 'Faculty Count' },
    { value: 'studentCount', label: 'Student Count' },
    { value: 'programCount', label: 'Program Count' },
    { value: 'createdAt', label: 'Date Created' },
  ];

  const handleSortChange = (field: SortField) => {
    if (sortField === field) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortDirection('asc');
    }
  };

  const filteredAndSortedDepartments = useMemo(() => {
    // First filter
    const filtered = departments.filter((dept) => {
      // Search filter
      const matchesSearch =
        searchQuery.trim() === "" ||
        dept.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        dept.code.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (dept.hod || '').toLowerCase().includes(searchQuery.toLowerCase());
      
      // Status filter
      const matchesStatus =
        filters.status.length === 0 ||
        filters.status.includes((dept.status || 'active').toLowerCase());
      
      // HOD Assigned filter
      const hodName = dept.hod || dept.metadata?.hod || '';
      const hasHod = hodName && hodName !== 'Not Assigned' && hodName.trim() !== '';
      const matchesHodAssigned =
        filters.hodAssigned.length === 0 ||
        (filters.hodAssigned.includes('yes') && hasHod) ||
        (filters.hodAssigned.includes('no') && !hasHod);
      
      // Faculty Range filter
      const facultyCount = dept.facultyCount || dept.faculty_count || 0;
      const matchesFacultyRange =
        filters.facultyRange.length === 0 ||
        (filters.facultyRange.includes('none') && facultyCount === 0) ||
        (filters.facultyRange.includes('1-5') && facultyCount >= 1 && facultyCount <= 5) ||
        (filters.facultyRange.includes('6-10') && facultyCount >= 6 && facultyCount <= 10) ||
        (filters.facultyRange.includes('10+') && facultyCount > 10);
      
      // Has Programs filter
      const programCount = dept.programs_offered?.length || 0;
      const matchesHasPrograms =
        filters.hasPrograms.length === 0 ||
        (filters.hasPrograms.includes('yes') && programCount > 0) ||
        (filters.hasPrograms.includes('no') && programCount === 0);

      return matchesSearch && matchesStatus && matchesHodAssigned && matchesFacultyRange && matchesHasPrograms;
    });

    // Then sort
    return filtered.sort((a, b) => {
      let comparison = 0;
      
      switch (sortField) {
        case 'name':
          comparison = a.name.localeCompare(b.name);
          break;
        case 'code':
          comparison = a.code.localeCompare(b.code);
          break;
        case 'facultyCount':
          comparison = (a.facultyCount || a.faculty_count || 0) - (b.facultyCount || b.faculty_count || 0);
          break;
        case 'studentCount':
          comparison = (a.studentCount || a.student_count || 0) - (b.studentCount || b.student_count || 0);
          break;
        case 'programCount':
          comparison = (a.programs_offered?.length || 0) - (b.programs_offered?.length || 0);
          break;
        case 'createdAt':
          comparison = new Date(a.created_at || 0).getTime() - new Date(b.created_at || 0).getTime();
          break;
        default:
          comparison = 0;
      }
      
      return sortDirection === 'asc' ? comparison : -comparison;
    });
  }, [departments, searchQuery, filters, sortField, sortDirection]);

  // Alias for backward compatibility
  const filteredDepartments = filteredAndSortedDepartments;

  // Status options with counts
  const statusOptions = useMemo(() => {
    const counts: Record<string, number> = {};
    departments.forEach((d) => {
      const key = (d.status || 'active').toLowerCase();
      counts[key] = (counts[key] || 0) + 1;
    });
    return Object.entries(counts).map(([value, count]) => ({
      value,
      label: value[0].toUpperCase() + value.slice(1),
      count,
    }));
  }, [departments]);

  // HOD Assigned options with counts
  const hodAssignedOptions = useMemo(() => {
    let withHod = 0;
    let withoutHod = 0;
    departments.forEach((d) => {
      const hodName = d.hod || d.metadata?.hod || '';
      if (hodName && hodName !== 'Not Assigned' && hodName.trim() !== '') {
        withHod++;
      } else {
        withoutHod++;
      }
    });
    return [
      { value: 'yes', label: 'HOD Assigned', count: withHod },
      { value: 'no', label: 'No HOD', count: withoutHod },
    ];
  }, [departments]);

  // Faculty Range options with counts
  const facultyRangeOptions = useMemo(() => {
    let none = 0, small = 0, medium = 0, large = 0;
    departments.forEach((d) => {
      const count = d.facultyCount || d.faculty_count || 0;
      if (count === 0) none++;
      else if (count <= 5) small++;
      else if (count <= 10) medium++;
      else large++;
    });
    return [
      { value: 'none', label: 'No Faculty', count: none },
      { value: '1-5', label: '1-5 Faculty', count: small },
      { value: '6-10', label: '6-10 Faculty', count: medium },
      { value: '10+', label: '10+ Faculty', count: large },
    ].filter(opt => opt.count > 0);
  }, [departments]);

  // Has Programs options with counts
  const hasProgramsOptions = useMemo(() => {
    let withPrograms = 0;
    let withoutPrograms = 0;
    departments.forEach((d) => {
      if ((d.programs_offered?.length || 0) > 0) {
        withPrograms++;
      } else {
        withoutPrograms++;
      }
    });
    return [
      { value: 'yes', label: 'Has Programs', count: withPrograms },
      { value: 'no', label: 'No Programs', count: withoutPrograms },
    ];
  }, [departments]);

  const totalFilters = filters.status.length + filters.hodAssigned.length + filters.facultyRange.length + filters.hasPrograms.length;
  const totalItems = filteredDepartments.length;
  const totalPages = Math.ceil(totalItems / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const paginatedDepartments = filteredDepartments.slice(startIndex, endIndex);

  const handlePageChange = (page: number) => {
    setCurrentPage(page);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const handleClearFilters = () => {
    setFilters({ 
      status: [], 
      hodAssigned: [], 
      facultyRange: [], 
      hasPrograms: [] 
    });
  };

  const handleViewDetails = (dept: Department) => {
    setDetailDepartment(dept);
  };

  const handleAssignFaculty = (dept: Department) => {
    setSelectedDepartment(dept);
    setShowFacultyAssignmentModal(true);
  };

  const handleAssignHOD = async (dept: Department) => {
    setSelectedDepartment(dept);
    
    // Load assigned faculty for this department
    try {
      const faculty = await departmentService.getDepartmentFaculty(dept.id);
      setAssignedFaculty(faculty);
    } catch (error) {
      console.error('Error loading department faculty:', error);
      setAssignedFaculty([]);
    }
    
    setShowHODAssignmentModal(true);
  };

  // Faculty assignment mutation
  const facultyAssignmentMutation = useMutation({
    mutationFn: ({ departmentId, facultyIds }: { departmentId: string; facultyIds: string[] }) =>
      departmentService.assignFacultyToDepartment(departmentId, facultyIds, user?.id!),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['departments'] });
      queryClient.invalidateQueries({ queryKey: ['college-faculty'] });
      toast.success('Faculty assigned successfully');
      setShowFacultyAssignmentModal(false);
      setSelectedDepartment(null);
    },
    onError: (error: any) => {
      toast.error(error.message || 'Failed to assign faculty');
    },
  });

  const handleSaveFacultyAssignment = (deptId: string, facultyIds: string[]) => {
    facultyAssignmentMutation.mutate({ departmentId: deptId, facultyIds });
  };

  const handleSaveHODAssignment = async (deptId: string, hodId: string, hodName: string, hodEmail: string) => {
    try {
      // Use the dedicated service method for HOD assignment
      await departmentService.assignHODToDepartment(deptId, hodId);

      // Update department metadata with HOD info including email
      await departmentService.updateDepartment(deptId, {
        metadata: { hod: hodName, hod_id: hodId, email: hodEmail }
      });

      // Refresh data
      queryClient.invalidateQueries({ queryKey: ['departments'] });
      toast.success('HOD assigned successfully');
      
      setShowHODAssignmentModal(false);
      setSelectedDepartment(null);
      setAssignedFaculty([]);
    } catch (error: any) {
      console.error('Error assigning HOD:', error);
      toast.error(error.message || 'Failed to assign HOD');
    }
  };

  // Add students mutation
  const addStudentsMutation = useMutation({
    mutationFn: ({ departmentId, students }: { 
      departmentId: string; 
      students: Array<{
        rollNumber: string;
        firstName: string;
        lastName: string;
        email: string;
        phone?: string;
        semester?: number;
        program?: string;
      }> 
    }) => departmentService.addStudentsToDepartment(departmentId, students),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['departments'] });
      toast.success('Students added successfully');
      setSelectedDepartment(null);
    },
    onError: (error: any) => {
      toast.error(error.message || 'Failed to add students');
    },
  });

  const handleSaveStudents = (deptId: string, students: any[]) => {
    addStudentsMutation.mutate({ departmentId: deptId, students });
  };

  const handleEditDepartment = (dept: Department) => {
    setSelectedDepartment(dept);
    setShowEditModal(true);
  };

  const toggleDropdown = (deptId: string) => {
    setOpenDropdownId(openDropdownId === deptId ? null : deptId);
  };

  const handleDeleteDepartment = (deptId: string) => {
    setDepartmentToDelete(deptId);
    setShowDeleteConfirmation(true);
  };

  const confirmDeleteDepartment = () => {
    if (departmentToDelete) {
      deleteDepartmentMutation.mutate(departmentToDelete);
      setShowDeleteConfirmation(false);
      setDepartmentToDelete(null);
    }
  };

  const cancelDeleteDepartment = () => {
    setShowDeleteConfirmation(false);
    setDepartmentToDelete(null);
  };

  const isEmpty = paginatedDepartments.length === 0 && !searchQuery && totalFilters === 0;

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading departments...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="text-center">
          <p className="text-red-600">Error loading departments</p>
          <p className="text-sm text-gray-500 mt-2">{(error as Error).message}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col min-h-full">
      {/* Header */}
      <div className="p-4 sm:p-6 lg:p-8 mb-2">
        <h1 className="text-xl md:text-3xl font-bold text-gray-900">
          Department Management
        </h1>
        <p className="text-base md:text-lg mt-2 text-gray-600">
          Manage departments, courses, faculty assignments, and HOD appointments.
        </p>
      </div>

      {/* Desktop Header Bar */}
      <div className="px-4 sm:px-6 lg:px-8 hidden lg:flex items-center p-4 bg-white border-b border-gray-200">
        <div className="w-80 flex-shrink-0 pr-4 text-left">
          <div className="inline-flex items-baseline">
            <h1 className="text-xl font-semibold text-gray-900">Departments</h1>
            <span className="ml-2 text-sm text-gray-500">
              ({departments.length} total)
            </span>
          </div>
        </div>

        <div className="flex-1 px-4">
          <div className="max-w-xl mx-auto">
            <SearchBar
              value={searchQuery}
              onChange={setSearchQuery}
              placeholder="Search by department, code, or HOD..."
              size="md"
            />
          </div>
        </div>

        <div className="w-80 flex-shrink-0 pl-4 flex items-center justify-end space-x-2">
          {/* Sort Dropdown */}
          <div className="relative">
            <select
              value={sortField}
              onChange={(e) => handleSortChange(e.target.value as SortField)}
              className="appearance-none pl-3 pr-8 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
            >
              {sortOptions.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
            <div className="absolute inset-y-0 right-0 flex items-center pr-2 pointer-events-none">
              <ChevronDownIcon className="h-4 w-4 text-gray-400" />
            </div>
          </div>
          <button
            onClick={() => setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc')}
            className="inline-flex items-center px-2 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 bg-white hover:bg-gray-50"
            type="button"
            title={sortDirection === 'asc' ? 'Ascending' : 'Descending'}
          >
            {sortDirection === 'asc' ? (
              <ChevronUpIcon className="h-4 w-4" />
            ) : (
              <ChevronDownIcon className="h-4 w-4" />
            )}
          </button>
          <button
            onClick={() => setShowFilters(!showFilters)}
            className="inline-flex items-center px-3 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 relative"
            type="button"
          >
            <FunnelIcon className="h-4 w-4 mr-2" />
            Filters
            {totalFilters > 0 && (
              <span className="ml-1 inline-flex items-center justify-center px-2 py-0.5 text-xs font-bold leading-none text-white bg-indigo-600 rounded-full">
                {totalFilters}
              </span>
            )}
          </button>
          <div className="flex rounded-md shadow-sm">
            <button
              onClick={() => setViewMode("grid")}
              className={`px-3 py-2 text-sm font-medium rounded-l-md border ${viewMode === "grid"
                  ? "bg-indigo-50 border-indigo-300 text-indigo-700"
                  : "bg-white border-gray-300 text-gray-700 hover:bg-gray-50"
                }`}
              type="button"
            >
              <Squares2X2Icon className="h-4 w-4" />
            </button>
            <button
              onClick={() => setViewMode("table")}
              className={`px-3 py-2 text-sm font-medium rounded-r-md border-t border-r border-b ${viewMode === "table"
                  ? "bg-indigo-50 border-indigo-300 text-indigo-700"
                  : "bg-white border-gray-300 text-gray-700 hover:bg-gray-50"
                }`}
              type="button"
            >
              <TableCellsIcon className="h-4 w-4" />
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Header */}
      <div className="lg:hidden p-4 bg-white border-b border-gray-200 space-y-4">
        <div className="text-left">
          <h1 className="text-xl font-semibold text-gray-900">Departments</h1>
          <span className="text-sm text-gray-500">
            {filteredDepartments.length} results
          </span>
        </div>

        <div>
          <SearchBar
            value={searchQuery}
            onChange={setSearchQuery}
            placeholder="Search departments"
            size="md"
          />
        </div>

        {/* Mobile Sort Controls */}
        <div className="flex items-center space-x-2">
          <div className="relative flex-1">
            <select
              value={sortField}
              onChange={(e) => handleSortChange(e.target.value as SortField)}
              className="w-full appearance-none pl-3 pr-8 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
            >
              {sortOptions.map((option) => (
                <option key={option.value} value={option.value}>
                  Sort: {option.label}
                </option>
              ))}
            </select>
            <div className="absolute inset-y-0 right-0 flex items-center pr-2 pointer-events-none">
              <ChevronDownIcon className="h-4 w-4 text-gray-400" />
            </div>
          </div>
          <button
            onClick={() => setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc')}
            className="inline-flex items-center px-2 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 bg-white"
            type="button"
          >
            {sortDirection === 'asc' ? (
              <ChevronUpIcon className="h-4 w-4" />
            ) : (
              <ChevronDownIcon className="h-4 w-4" />
            )}
          </button>
        </div>

        <div className="flex items-center space-x-2">
          <button
            onClick={() => setShowFilters(!showFilters)}
            className="flex-1 inline-flex items-center justify-center px-3 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 relative"
            type="button"
          >
            <FunnelIcon className="h-4 w-4 mr-2" />
            Filters
            {totalFilters > 0 && (
              <span className="ml-1 inline-flex items-center justify-center px-2 py-0.5 text-xs font-bold leading-none text-white bg-indigo-600 rounded-full">
                {totalFilters}
              </span>
            )}
          </button>
          <div className="flex rounded-md shadow-sm">
            <button
              onClick={() => setViewMode("grid")}
              className={`px-3 py-2 text-sm font-medium rounded-l-md border ${viewMode === "grid"
                  ? "bg-indigo-50 border-indigo-300 text-indigo-700"
                  : "bg-white border-gray-300 text-gray-700 hover:bg-gray-50"
                }`}
              type="button"
            >
              <Squares2X2Icon className="h-4 w-4" />
            </button>
            <button
              onClick={() => setViewMode("table")}
              className={`px-3 py-2 text-sm font-medium rounded-r-md border-t border-r border-b ${viewMode === "table"
                  ? "bg-indigo-50 border-indigo-300 text-indigo-700"
                  : "bg-white border-gray-300 text-gray-700 hover:bg-gray-50"
                }`}
              type="button"
            >
              <TableCellsIcon className="h-4 w-4" />
            </button>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex flex-1 relative">
        {/* Filter Sidebar */}
        {showFilters && (
          <>
            <div
              className="fixed inset-0 z-40 bg-gray-900/40 lg:hidden"
              onClick={() => setShowFilters(false)}
            />
            <div className="fixed inset-y-0 left-0 z-50 w-80 bg-white border-r border-gray-200 overflow-y-auto shadow-xl lg:static lg:inset-auto lg:z-auto lg:h-full lg:flex-shrink-0 lg:shadow-none">
              <div className="p-4">
                <div className="flex items-center justify-between mb-4">
                  <h2 className="font-medium text-gray-900">Filters</h2>
                  <div className="flex items-center gap-3">
                    <button
                      onClick={handleClearFilters}
                      className="text-sm text-indigo-600 hover:text-indigo-700"
                      type="button"
                    >
                      Clear all
                    </button>
                    <button
                      onClick={() => setShowFilters(false)}
                      className="text-gray-400 hover:text-gray-600"
                      type="button"
                      aria-label="Close filters"
                    >
                      <XMarkIcon className="h-5 w-5" />
                    </button>
                  </div>
                </div>

                <div className="space-y-0">
                  <FilterSection title="Status" defaultOpen>
                    <CheckboxGroup
                      options={statusOptions}
                      selectedValues={filters.status}
                      onChange={(values: string[]) =>
                        setFilters((prev) => ({ ...prev, status: values }))
                      }
                    />
                  </FilterSection>

                  <FilterSection title="HOD Assignment" defaultOpen>
                    <CheckboxGroup
                      options={hodAssignedOptions}
                      selectedValues={filters.hodAssigned}
                      onChange={(values: string[]) =>
                        setFilters((prev) => ({ ...prev, hodAssigned: values }))
                      }
                    />
                  </FilterSection>

                  <FilterSection title="Faculty Count" defaultOpen>
                    <CheckboxGroup
                      options={facultyRangeOptions}
                      selectedValues={filters.facultyRange}
                      onChange={(values: string[]) =>
                        setFilters((prev) => ({ ...prev, facultyRange: values }))
                      }
                    />
                  </FilterSection>

                  <FilterSection title="Programs" defaultOpen>
                    <CheckboxGroup
                      options={hasProgramsOptions}
                      selectedValues={filters.hasPrograms}
                      onChange={(values: string[]) =>
                        setFilters((prev) => ({ ...prev, hasPrograms: values }))
                      }
                    />
                  </FilterSection>
                </div>
              </div>
            </div>
          </>
        )}

        {/* Content Area */}
        <div className="flex-1 flex flex-col">
          <div className="px-4 sm:px-6 lg:px-8 py-3 bg-gray-50 border-b border-gray-200 flex items-center justify-between">
            <p className="text-sm text-gray-700">
              Showing <span className="font-medium">{filteredDepartments.length}</span>{" "}
              result{filteredDepartments.length === 1 ? "" : "s"}
              {searchQuery && (
                <span className="text-gray-500"> for "{searchQuery}"</span>
              )}
            </p>
            <div className="flex items-center gap-2">
              <button
                onClick={() => setShowAddModal(true)}
                className="inline-flex items-center px-3 py-2 text-sm font-medium text-white bg-indigo-600 rounded-md hover:bg-indigo-700"
                type="button"
              >
                <PlusCircleIcon className="h-4 w-4 mr-2" />
                Add Department
              </button>
            </div>
          </div>

          <div className="px-4 sm:px-6 lg:px-8 p-4 pb-20">
            {isEmpty && <EmptyState onCreate={() => setShowAddModal(true)} />}

            {!isEmpty && viewMode === "grid" && paginatedDepartments.length > 0 && (
              <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
                {paginatedDepartments.map((dept) => (
                  <div
                    key={dept.id}
                    className="group bg-white rounded-2xl shadow-sm border border-gray-200 hover:shadow-lg hover:border-indigo-200 transition-all duration-300 overflow-hidden flex flex-col h-full"
                  >
                    {/* Header with gradient background */}
                    <div className="relative bg-gradient-to-br from-indigo-600 to-indigo-700 p-6">
                      <div className="absolute top-4 right-4 flex items-center gap-2">
                        <StatusBadge status={dept.status || 'Active'} />
                        <div className="relative dropdown-container">
                          <button
                            onClick={() => toggleDropdown(dept.id)}
                            className="p-1.5 rounded-lg bg-white/20 backdrop-blur-sm text-white hover:bg-white/30 transition-colors duration-200"
                            type="button"
                          >
                            <EllipsisVerticalIcon className="h-4 w-4" />
                          </button>
                          
                          {/* Dropdown Menu */}
                          {openDropdownId === dept.id && (
                            <div 
                              className="absolute right-0 top-full mt-2 w-48 bg-white rounded-lg shadow-lg border border-gray-200 py-1 z-50"
                              style={{ 
                                position: 'absolute',
                                right: 0,
                                top: '100%',
                                marginTop: '8px',
                                zIndex: 9999,
                                backgroundColor: 'white',
                                border: '1px solid #e5e7eb',
                                borderRadius: '8px',
                                boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05)'
                              }}
                            >
                              <button
                                onClick={() => {
                                  handleEditDepartment(dept);
                                  setOpenDropdownId(null);
                                }}
                                className="w-full px-4 py-2 text-left text-sm text-gray-700 hover:bg-gray-50 flex items-center gap-2"
                                type="button"
                              >
                                <PencilSquareIcon className="h-4 w-4" />
                                Edit Department
                              </button>
                              <button
                                onClick={() => {
                                  handleAssignFaculty(dept);
                                  setOpenDropdownId(null);
                                }}
                                className="w-full px-4 py-2 text-left text-sm text-gray-700 hover:bg-gray-50 flex items-center gap-2"
                                type="button"
                              >
                                <UserGroupIcon className="h-4 w-4" />
                                Assign Faculty
                              </button>
                              <button
                                onClick={() => {
                                  handleAssignHOD(dept);
                                  setOpenDropdownId(null);
                                }}
                                className="w-full px-4 py-2 text-left text-sm text-gray-700 hover:bg-gray-50 flex items-center gap-2"
                                type="button"
                              >
                                <UserIcon className="h-4 w-4" />
                                Assign HOD
                              </button>
                              <div className="border-t border-gray-100 my-1"></div>
                              <button
                                onClick={() => {
                                  handleDeleteDepartment(dept.id);
                                  setOpenDropdownId(null);
                                }}
                                className="w-full px-4 py-2 text-left text-sm text-red-600 hover:bg-red-50 flex items-center gap-2"
                                type="button"
                              >
                                <TrashIcon className="h-4 w-4" />
                                Delete Department
                              </button>
                            </div>
                          )}
                        </div>
                      </div>
                      
                      <div className="flex items-center gap-3 mb-3">
                        <div className="p-3 bg-white/20 backdrop-blur-sm rounded-xl">
                          <BuildingOffice2Icon className="h-8 w-8 text-white" />
                        </div>
                      </div>
                      <h3 className="text-lg font-bold text-white leading-tight mb-1">
                        {dept.name}
                      </h3>
                      <p className="text-sm text-indigo-100">{dept.code}</p>
                    </div>

                    {/* Content Section */}
                    <div className="p-5 flex-1 flex flex-col">
                      {/* HOD Info */}
                      <div className="mb-4 pb-4 border-b border-gray-100">
                        <div className="flex items-start gap-3">
                          <div className="flex-shrink-0 w-10 h-10 rounded-full bg-gradient-to-br from-gray-100 to-gray-200 flex items-center justify-center">
                            <span className="text-sm font-semibold text-gray-700">
                              {(dept.hod || 'NA').split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase()}
                            </span>
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="text-xs font-medium text-gray-500 uppercase tracking-wide">
                              Head of Department
                            </p>
                            <p className="text-sm font-semibold text-gray-900 mt-0.5">
                              {dept.hod || 'Not Assigned'}
                            </p>
                            {(dept.email || dept.metadata?.email) && (
                              <a
                                href={`mailto:${dept.email || dept.metadata?.email}`}
                                className="text-xs text-indigo-600 hover:text-indigo-700 mt-1 inline-flex items-center gap-1 group/email"
                              >
                                <EnvelopeIcon className="h-3 w-3" />
                                <span className="group-hover/email:underline">
                                  {dept.email || dept.metadata?.email}
                                </span>
                              </a>
                            )}
                          </div>
                        </div>
                      </div>

                      {/* Stats Grid */}
                      <div className="grid grid-cols-3 gap-3 mb-4">
                        <div className="text-center">
                          <div className="flex items-center justify-center w-12 h-12 mx-auto mb-2 bg-indigo-50 rounded-xl">
                            <UserGroupIcon className="h-6 w-6 text-indigo-600" />
                          </div>
                          <p className="text-2xl font-bold text-gray-900">
                            {dept.facultyCount || 0}
                          </p>
                          <p className="text-xs text-gray-500 mt-0.5">Faculty</p>
                        </div>

                        <div className="text-center">
                          <div className="flex items-center justify-center w-12 h-12 mx-auto mb-2 bg-amber-50 rounded-xl">
                            <AcademicCapIcon className="h-6 w-6 text-amber-600" />
                          </div>
                          <p className="text-2xl font-bold text-gray-900">
                            {dept.studentCount || 0}
                          </p>
                          <p className="text-xs text-gray-500 mt-0.5">Students</p>
                        </div>

                        <div className="text-center">
                          <div className="flex items-center justify-center w-12 h-12 mx-auto mb-2 bg-green-50 rounded-xl">
                            <BookOpenIcon className="h-6 w-6 text-green-600" />
                          </div>
                          <p className="text-2xl font-bold text-gray-900">
                            {dept.programs_offered?.length || 0}
                          </p>
                          <p className="text-xs text-gray-500 mt-0.5">Programs</p>
                        </div>
                      </div>

                      {/* Programs Offered Section - Flexible content area */}
                      <div className="flex-1">
                        {dept.programs_offered && dept.programs_offered.length > 0 && (
                          <div className="mb-4 pb-4 border-b border-gray-100">
                            <p className="text-xs font-medium text-gray-500 uppercase tracking-wide mb-2">
                              Programs Offered
                            </p>
                            <div className="flex flex-wrap gap-1">
                              {dept.programs_offered.map((program) => (
                                <span
                                  key={program.id}
                                  className="inline-flex items-center px-2 py-1 rounded-md text-xs font-medium bg-blue-50 text-blue-700 border border-blue-200"
                                  title={program.name}
                                >
                                  {program.code}
                                </span>
                              ))}
                            </div>
                          </div>
                        )}
                      </div>

                      {/* Action Button - Always at bottom */}
                      <div className="mt-auto">
                        <button
                          onClick={() => handleViewDetails(dept)}
                          className="w-full inline-flex items-center justify-center gap-2 px-4 py-3 bg-indigo-600 text-white text-sm font-medium rounded-xl hover:bg-indigo-700 transition-colors duration-200"
                          type="button"
                        >
                          <EyeIcon className="h-4 w-4" />
                          View Details
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {!isEmpty && viewMode === "table" && paginatedDepartments.length > 0 && (
              <div className="bg-white shadow-sm rounded-lg border border-gray-200 overflow-hidden">
                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Department
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Code
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          HOD
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Programs
                        </th>
                        <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Faculty
                        </th>
                        <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Students
                        </th>
                        <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Status
                        </th>
                        <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Actions
                        </th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-100">
                      {paginatedDepartments.map((dept) => (
                        <tr key={dept.id} className="hover:bg-gray-50">
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="text-sm font-medium text-gray-900">
                              {dept.name}
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">
                            {dept.code}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">
                            {dept.hod || 'Not Assigned'}
                          </td>
                          <td className="px-6 py-4">
                            <div className="flex flex-wrap gap-1">
                              {dept.programs_offered && dept.programs_offered.length > 0 ? (
                                dept.programs_offered.map((program) => (
                                  <span
                                    key={program.id}
                                    className="inline-flex items-center px-2 py-1 rounded text-xs font-medium bg-blue-50 text-blue-700 border border-blue-200"
                                    title={program.name}
                                  >
                                    {program.code}
                                  </span>
                                ))
                              ) : (
                                <span className="text-xs text-gray-400">No programs</span>
                              )}
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-center text-sm text-gray-500">
                            {dept.facultyCount || 0}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-center text-sm text-gray-500">
                            {dept.studentCount}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-center">
                            <StatusBadge status={dept.status || 'Active'} />
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                            <div className="flex items-center justify-end space-x-3">
                              <button
                                onClick={() => handleViewDetails(dept)}
                                className="text-indigo-600 hover:text-indigo-900"
                                type="button"
                              >
                                View
                              </button>
                              <button
                                onClick={() => handleAssignFaculty(dept)}
                                className="text-indigo-600 hover:text-indigo-900"
                                type="button"
                                title="Assign Faculty"
                              >
                                Faculty
                              </button>
                              <button
                                onClick={() => handleDeleteDepartment(dept.id)}
                                className="text-red-600 hover:text-red-900"
                                type="button"
                              >
                                Delete
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {!isEmpty &&
              paginatedDepartments.length === 0 &&
              (searchQuery || totalFilters > 0) && (
                <div className="text-center py-10 text-sm text-gray-500">
                  No departments match your current filters. Try adjusting
                  filters or clearing them.
                  <div className="mt-3">
                    <button
                      onClick={handleClearFilters}
                      className="text-sm font-medium text-indigo-600 hover:text-indigo-700"
                      type="button"
                    >
                      Clear all filters
                    </button>
                  </div>
                </div>
              )}
          </div>

          {/* Pagination */}
          {!isEmpty && totalPages > 1 && (
            <div className="pb-8">
              <Pagination
                currentPage={currentPage}
                totalPages={totalPages}
                totalItems={totalItems}
                itemsPerPage={itemsPerPage}
                onPageChange={handlePageChange}
              />
            </div>
          )}
        </div>
      </div>

      {/* Modals */}
      <AddDepartmentModal
        isOpen={showAddModal}
        onClose={() => setShowAddModal(false)}
        onSubmit={(data) => {
          createDepartmentMutation.mutate(data);
        }}
        isSubmitting={createDepartmentMutation.isPending}
        allFaculty={allFaculty}
        facultyLoading={facultyLoading}
      />

      <EditDepartmentModal
        isOpen={showEditModal}
        onClose={() => {
          setShowEditModal(false);
          setSelectedDepartment(null);
        }}
        department={selectedDepartment}
        onUpdated={(updated) => {
          if (selectedDepartment) {
            updateDepartmentMutation.mutate({
              id: selectedDepartment.id.toString(),
              updates: updated
            });
          }
        }}
        allFaculty={allFaculty}
        facultyLoading={facultyLoading}
      />

      <FacultyAssignmentModal
        isOpen={showFacultyAssignmentModal}
        onClose={() => {
          setShowFacultyAssignmentModal(false);
          setSelectedDepartment(null);
        }}
        department={selectedDepartment}
        allFaculty={allFaculty}
        facultyLoading={facultyLoading}
        onSave={handleSaveFacultyAssignment}
      />

      <HODAssignmentModal
        isOpen={showHODAssignmentModal}
        onClose={() => {
          setShowHODAssignmentModal(false);
          setSelectedDepartment(null);
        }}
        department={selectedDepartment}
        allFaculty={allFaculty}
        assignedFaculty={assignedFaculty}
        onSave={handleSaveHODAssignment}
      />

      <DepartmentDetailsDrawer
        department={detailDepartment}
        onClose={() => setDetailDepartment(null)}
        onEdit={(dept) => {
          setSelectedDepartment(dept);
          setShowEditModal(true);
        }}
        onAssignFaculty={handleAssignFaculty}
        onAssignHOD={handleAssignHOD}
      />

      <ConfirmationModal
        isOpen={showDeleteConfirmation}
        onClose={cancelDeleteDepartment}
        onConfirm={confirmDeleteDepartment}
        title="Delete Department"
        message="Are you sure you want to delete this department? This action cannot be undone and will remove all associated data."
        type="danger"
        confirmText="Delete"
        cancelText="Cancel"
        isLoading={deleteDepartmentMutation.isPending}
      />
    </div>
  );
};

export default DepartmentManagement;