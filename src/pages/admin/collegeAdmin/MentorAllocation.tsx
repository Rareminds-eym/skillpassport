/* eslint-disable @typescript-eslint/no-explicit-any */
import React, { useState, useMemo } from "react";
import {
  UserGroupIcon,
  PlusCircleIcon,
  ExclamationTriangleIcon,
  UserIcon,
  AcademicCapIcon,
  CalendarIcon,
  DocumentTextIcon,
  UserPlusIcon,
} from "@heroicons/react/24/outline";
import SearchBar from "../../../components/common/SearchBar";
import KPICard from "../../../components/admin/KPICard";
import Pagination from "../../../components/admin/Pagination";
import StudentSelectionModal from "../../../components/admin/collegeAdmin/StudentSelectionModal";
import MentorSelectionModal from "../../../components/admin/collegeAdmin/MentorSelectionModal";
import AllocationConfigurationModal from "../../../components/admin/collegeAdmin/AllocationConfigurationModal";
import InterventionModal from "../../../components/admin/collegeAdmin/InterventionModal";
import MentorDetailsDrawer from "../../../components/admin/collegeAdmin/MentorDetailsModal";
import ReassignModal from "../../../components/admin/collegeAdmin/ReassignModal";
import MentorCapacityModal from "../../../components/admin/collegeAdmin/MentorCapacityModal";

interface Student {
  id: number;
  name: string;
  rollNo: string;
  department: string;
  semester: number;
  cgpa: number;
  atRisk: boolean;
  email: string;
  batch: string;
  riskFactors?: string[];
  lastInteraction?: string;
  interventionCount?: number;
}

interface MentorAllocation {
  id: number;
  mentorId: number;
  students: Student[];
  allocationPeriod: {
    startDate: string;
    endDate: string;
  };
  capacity: number;
  officeLocation: string;
  availableHours: string;
  status: 'active' | 'completed' | 'cancelled';
  createdAt: string;
  createdBy: string;
  academicYear: string;
}

interface Mentor {
  id: number;
  name: string;
  email: string;
  department: string;
  designation: string;
  specializations?: string[];
  contactNumber?: string;
  // Current allocations (can have multiple active allocations)
  allocations: MentorAllocation[];
}

interface MentorNote {
  id: number;
  mentorId: number;
  studentId: number;
  note: string;
  date: string;
  outcome: string;
  isPrivate: boolean;
  interventionType: 'academic' | 'personal' | 'career' | 'attendance' | 'behavioral' | 'financial' | 'other';
  status: 'pending' | 'in-progress' | 'completed' | 'escalated';
}

const MentorAllocation: React.FC = () => {
  // Sample Data - Updated to use allocation-based structure
  const [mentors, setMentors] = useState<Mentor[]>([
    {
      id: 1,
      name: "Dr. Rajesh Kumar",
      email: "rajesh.kumar@college.edu",
      department: "Computer Science",
      designation: "Associate Professor",
      specializations: ["Data Structures", "Algorithms", "Machine Learning"],
      contactNumber: "+91-9876543210",
      allocations: [
        {
          id: 1,
          mentorId: 1,
          students: [
            {
              id: 101,
              name: "Amit Patel",
              rollNo: "CS2021001",
              department: "Computer Science",
              semester: 5,
              cgpa: 7.2,
              atRisk: true,
              email: "amit.patel@student.edu",
              batch: "2021-2025",
              riskFactors: ["Low CGPA", "Poor Attendance"],
              lastInteraction: "2024-01-10",
              interventionCount: 2,
            },
            {
              id: 102,
              name: "Sneha Reddy",
              rollNo: "CS2021002",
              department: "Computer Science",
              semester: 5,
              cgpa: 8.5,
              atRisk: false,
              email: "sneha.reddy@student.edu",
              batch: "2021-2025",
              riskFactors: [],
              lastInteraction: "2024-01-15",
              interventionCount: 0,
            },
          ],
          allocationPeriod: {
            startDate: "2026-01-01",
            endDate: "2026-06-30",
          },
          capacity: 15,
          officeLocation: "CS Block, Room 301",
          availableHours: "Mon-Fri 10:00-12:00, 14:00-16:00",
          status: 'active',
          createdAt: "2026-01-01T00:00:00Z",
          createdBy: "admin",
          academicYear: "2025-2026",
        },
        {
          id: 4,
          mentorId: 1,
          students: [
            {
              id: 105,
              name: "Rahul Sharma",
              rollNo: "CS2020001",
              department: "Computer Science",
              semester: 7,
              cgpa: 8.1,
              atRisk: false,
              email: "rahul.sharma@student.edu",
              batch: "2020-2024",
              riskFactors: [],
              lastInteraction: "2023-12-15",
              interventionCount: 1,
            },
          ],
          allocationPeriod: {
            startDate: "2023-07-01",
            endDate: "2023-12-31",
          },
          capacity: 12,
          officeLocation: "CS Block, Room 301",
          availableHours: "Mon-Fri 09:00-11:00, 15:00-17:00",
          status: 'active',
          createdAt: "2023-07-01T00:00:00Z",
          createdBy: "admin",
          academicYear: "2023-2024",
        },
        {
          id: 5,
          mentorId: 1,
          students: [
            {
              id: 106,
              name: "Priya Singh",
              rollNo: "CS2022003",
              department: "Computer Science",
              semester: 4,
              cgpa: 7.8,
              atRisk: false,
              email: "priya.singh@student.edu",
              batch: "2022-2026",
              riskFactors: [],
              lastInteraction: "2025-11-20",
              interventionCount: 0,
            },
          ],
          allocationPeriod: {
            startDate: "2025-07-01",
            endDate: "2025-12-31",
          },
          capacity: 18,
          officeLocation: "CS Block, Room 301",
          availableHours: "Mon-Wed-Fri 11:00-13:00, 14:00-16:00",
          status: 'active',
          createdAt: "2025-07-01T00:00:00Z",
          createdBy: "admin",
          academicYear: "2025-2026",
        }
      ],
    },
    {
      id: 2,
      name: "Prof. Priya Sharma",
      email: "priya.sharma@college.edu",
      department: "Electronics",
      designation: "Assistant Professor",
      specializations: ["Digital Electronics", "VLSI Design", "Embedded Systems"],
      contactNumber: "+91-9876543211",
      allocations: [
        {
          id: 2,
          mentorId: 2,
          students: [
            {
              id: 103,
              name: "Priya Gupta",
              rollNo: "ECE2021001",
              department: "Electronics",
              semester: 5,
              cgpa: 7.8,
              atRisk: false,
              email: "priya.gupta@student.edu",
              batch: "2021-2025",
              riskFactors: [],
              lastInteraction: "2024-01-12",
              interventionCount: 1,
            },
          ],
          allocationPeriod: {
            startDate: "2024-07-01",
            endDate: "2024-12-31",
          },
          capacity: 12,
          officeLocation: "ECE Block, Room 205",
          availableHours: "Mon-Wed-Fri 11:00-13:00, 15:00-17:00",
          status: 'active',
          createdAt: "2024-07-01T00:00:00Z",
          createdBy: "admin",
          academicYear: "2024-2025",
        },
        {
          id: 6,
          mentorId: 2,
          students: [
            {
              id: 107,
              name: "Arjun Patel",
              rollNo: "ECE2023001",
              department: "Electronics",
              semester: 2,
              cgpa: 8.3,
              atRisk: false,
              email: "arjun.patel@student.edu",
              batch: "2023-2027",
              riskFactors: [],
              lastInteraction: "2026-01-10",
              interventionCount: 0,
            },
            {
              id: 108,
              name: "Kavya Reddy",
              rollNo: "ECE2023002",
              department: "Electronics",
              semester: 2,
              cgpa: 6.9,
              atRisk: true,
              email: "kavya.reddy@student.edu",
              batch: "2023-2027",
              riskFactors: ["Low CGPA"],
              lastInteraction: "2026-01-08",
              interventionCount: 2,
            },
          ],
          allocationPeriod: {
            startDate: "2026-01-10",
            endDate: "2026-07-15",
          },
          capacity: 15,
          officeLocation: "ECE Block, Room 205",
          availableHours: "Tue-Thu 10:00-12:00, 14:00-16:00",
          status: 'active',
          createdAt: "2026-01-10T00:00:00Z",
          createdBy: "admin",
          academicYear: "2025-2026",
        }
      ],
    },
    {
      id: 3,
      name: "Dr. Amit Patel",
      email: "amit.patel@college.edu",
      department: "Mechanical",
      designation: "Professor",
      specializations: ["Thermodynamics", "Manufacturing", "CAD/CAM"],
      contactNumber: "+91-9876543212",
      allocations: [
        {
          id: 3,
          mentorId: 3,
          students: [
            {
              id: 104,
              name: "Karan Mehta",
              rollNo: "MECH2022001",
              department: "Mechanical",
              semester: 3,
              cgpa: 6.5,
              atRisk: true,
              email: "karan.mehta@student.edu",
              batch: "2022-2026",
              riskFactors: ["Low CGPA", "Behavioral Issues"],
              lastInteraction: "2024-01-05",
              interventionCount: 4,
            },
          ],
          allocationPeriod: {
            startDate: "2024-01-01",
            endDate: "2024-06-30",
          },
          capacity: 20,
          officeLocation: "Mech Block, Room 101",
          availableHours: "Tue-Thu 09:00-11:00, 14:00-16:00",
          status: 'active',
          createdAt: "2024-01-01T00:00:00Z",
          createdBy: "admin",
          academicYear: "2023-2024",
        }
      ],
    },
    {
      id: 4,
      name: "Dr. Kavitha Nair",
      email: "kavitha.nair@college.edu",
      department: "Information Technology",
      designation: "Assistant Professor",
      specializations: ["Database Management", "Web Development", "Cloud Computing"],
      contactNumber: "+91-9876543213",
      allocations: [],
    },
    {
      id: 5,
      name: "Prof. Suresh Reddy",
      email: "suresh.reddy@college.edu",
      department: "Civil Engineering",
      designation: "Professor",
      specializations: ["Structural Engineering", "Construction Management", "Environmental Engineering"],
      contactNumber: "+91-9876543214",
      allocations: [],
    },
  ]);

  const [availableStudents] = useState<Student[]>([
    {
      id: 201,
      name: "Rahul Singh",
      rollNo: "CS2022001",
      department: "Computer Science",
      semester: 3,
      cgpa: 6.8,
      atRisk: true,
      email: "rahul.singh@student.edu",
      batch: "2022-2026",
      riskFactors: ["Academic Struggles", "Financial Issues"],
      lastInteraction: "2024-01-08",
      interventionCount: 3,
    },
    {
      id: 202,
      name: "Anita Sharma",
      rollNo: "ECE2022002",
      department: "Electronics",
      semester: 3,
      cgpa: 8.2,
      atRisk: false,
      email: "anita.sharma@student.edu",
      batch: "2022-2026",
      riskFactors: [],
      lastInteraction: "2024-01-14",
      interventionCount: 0,
    },
    {
      id: 203,
      name: "Vikram Joshi",
      rollNo: "MECH2021003",
      department: "Mechanical",
      semester: 5,
      cgpa: 7.5,
      atRisk: false,
      email: "vikram.joshi@student.edu",
      batch: "2021-2025",
      riskFactors: [],
      lastInteraction: "2024-01-11",
      interventionCount: 1,
    },
  ]);

  const [notes, setNotes] = useState<MentorNote[]>([
    {
      id: 1,
      mentorId: 1,
      studentId: 101,
      note: "Student struggling with Data Structures concepts. Provided additional study materials and scheduled weekly review sessions.",
      date: "2024-01-15",
      outcome: "Improved understanding of linked lists and trees. CGPA increased from 7.2 to 7.8",
      isPrivate: false,
      interventionType: 'academic',
      status: 'in-progress',
    },
    {
      id: 2,
      mentorId: 1,
      studentId: 102,
      note: "Career counseling session regarding internship opportunities in machine learning domain.",
      date: "2024-01-12",
      outcome: "Student applied to 5 ML internships. Received 2 interview calls.",
      isPrivate: false,
      interventionType: 'career',
      status: 'completed',
    },
    {
      id: 3,
      mentorId: 2,
      studentId: 103,
      note: "Addressed attendance issues and personal challenges affecting academic performance.",
      date: "2024-01-10",
      outcome: "Attendance improved from 65% to 85%. Student more engaged in classes.",
      isPrivate: true,
      interventionType: 'personal',
      status: 'completed',
    },
    {
      id: 4,
      mentorId: 2,
      studentId: 103,
      note: "Discussed financial aid options and scholarship opportunities for the student.",
      date: "2024-01-08",
      outcome: "Applied for merit scholarship. Referred to financial aid office.",
      isPrivate: true,
      interventionType: 'financial',
      status: 'pending',
    },
    {
      id: 5,
      mentorId: 3,
      studentId: 104,
      note: "Behavioral counseling session regarding classroom disruptions and peer conflicts.",
      date: "2024-01-05",
      outcome: "Student showed improved behavior. No recent incidents reported.",
      isPrivate: true,
      interventionType: 'behavioral',
      status: 'completed',
    },
  ]);

  // All allocations across all mentors (for audit trail)
  const [allAllocations, setAllAllocations] = useState<MentorAllocation[]>(() => {
    return mentors.flatMap(mentor => mentor.allocations);
  });

  // State Management
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedDepartment, setSelectedDepartment] = useState<string>("all");
  const [selectedBatch, setSelectedBatch] = useState<string>("all");
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  
  // Pagination State
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(6); // 6 mentors per page

  // Modal States
  const [showStudentSelectionModal, setShowStudentSelectionModal] = useState(false);
  const [showMentorSelectionModal, setShowMentorSelectionModal] = useState(false);
  const [showAllocationConfigModal, setShowAllocationConfigModal] = useState(false);
  const [showInterventionModal, setShowInterventionModal] = useState(false);
  const [showMentorDetailsModal, setShowMentorDetailsModal] = useState(false);
  const [showReassignModal, setShowReassignModal] = useState(false);
  const [showCapacityModal, setShowCapacityModal] = useState(false);
  const [showAddStudentsModal, setShowAddStudentsModal] = useState(false);

  // Selected Items
  const [selectedMentor, setSelectedMentor] = useState<Mentor | null>(null);
  const [selectedStudent, setSelectedStudent] = useState<Student | null>(null);
  const [selectedStudentsForAllocation, setSelectedStudentsForAllocation] = useState<number[]>([]);
  const [selectedMentorForAllocation, setSelectedMentorForAllocation] = useState<Mentor | null>(null);
  const [studentToReassign, setStudentToReassign] = useState<Student | null>(null);
  const [mentorForCapacityConfig, setMentorForCapacityConfig] = useState<Mentor | null>(null);
  const [allocationForConfig, setAllocationForConfig] = useState<MentorAllocation | null>(null);
  const [mentorForAddingStudents, setMentorForAddingStudents] = useState<Mentor | null>(null);

  // Intervention Form States
  const [noteText, setNoteText] = useState("");
  const [noteOutcome, setNoteOutcome] = useState("");
  const [interventionType, setInterventionType] = useState<'academic' | 'personal' | 'career' | 'attendance' | 'behavioral' | 'financial' | 'other'>('academic');
  const [isPrivateNote, setIsPrivateNote] = useState(false);
  const [noteStatus, setNoteStatus] = useState<'pending' | 'in-progress' | 'completed' | 'escalated'>('pending');

  // Computed Values - Updated for allocation-based structure
  const filteredMentors = useMemo(() => {
    return mentors.filter(
      (m) =>
        // Only show mentors who have active allocations with students
        m.allocations.some(allocation => 
          allocation.status === 'active' && allocation.students.length > 0
        ) &&
        (m.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        m.department.toLowerCase().includes(searchQuery.toLowerCase()) ||
        m.designation.toLowerCase().includes(searchQuery.toLowerCase())) &&
        (selectedDepartment === "all" || m.department === selectedDepartment)
    );
  }, [mentors, searchQuery, selectedDepartment]);

  // Pagination calculations
  const totalMentors = filteredMentors.length;
  const totalPages = Math.ceil(totalMentors / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const paginatedMentors = filteredMentors.slice(startIndex, endIndex);

  // Reset to first page when filters change
  React.useEffect(() => {
    setCurrentPage(1);
  }, [searchQuery, selectedDepartment]);

  const uniqueBatches = useMemo(() => {
    const allStudents = allAllocations.flatMap(allocation => allocation.students);
    return Array.from(new Set([...availableStudents.map(s => s.batch), ...allStudents.map(s => s.batch)]));
  }, [availableStudents, allAllocations]);

  const uniqueDepartments = useMemo(() => {
    return Array.from(new Set([...mentors.map(m => m.department), ...availableStudents.map(s => s.department)]));
  }, [mentors, availableStudents]);

  const atRiskStudents = useMemo(() => {
    const allStudents = [...availableStudents, ...allAllocations.flatMap(allocation => allocation.students)];
    return allStudents.filter(s => s.atRisk);
  }, [availableStudents, allAllocations]);

  const unallocatedStudents = useMemo(() => {
    const allocatedStudentIds = allAllocations
      .filter(allocation => allocation.status === 'active')
      .flatMap(allocation => allocation.students.map(s => s.id));
    return availableStudents.filter(student => !allocatedStudentIds.includes(student.id));
  }, [availableStudents, allAllocations]);

  const totalInterventions = useMemo(() => {
    return notes.length;
  }, [notes]);

  // Helper functions for mentor statistics
  const getMentorCurrentLoad = (mentorId: number) => {
    return allAllocations
      .filter(allocation => allocation.mentorId === mentorId && allocation.status === 'active')
      .reduce((total, allocation) => total + allocation.students.length, 0);
  };

  const getMentorActiveAllocations = (mentorId: number) => {
    return allAllocations.filter(allocation => allocation.mentorId === mentorId && allocation.status === 'active');
  };

  const getMentorAtRiskStudents = (mentorId: number) => {
    return allAllocations
      .filter(allocation => allocation.mentorId === mentorId && allocation.status === 'active')
      .flatMap(allocation => allocation.students)
      .filter(student => student.atRisk);
  };

  // Event Handlers
  const handleStartAllocation = () => {
    setSelectedStudentsForAllocation([]);
    setShowStudentSelectionModal(true);
  };

  const handleStudentSelectionComplete = (studentIds: number[]) => {
    setSelectedStudentsForAllocation(studentIds);
    setShowStudentSelectionModal(false);
    setShowMentorSelectionModal(true);
  };

  const handleMentorSelectionComplete = (mentorId: number) => {
    const mentor = mentors.find(m => m.id === mentorId);
    if (mentor) {
      setSelectedMentorForAllocation(mentor);
      setShowMentorSelectionModal(false);
      setShowAllocationConfigModal(true);
    }
  };

  const handleBackToMentorSelection = () => {
    setShowAllocationConfigModal(false);
    setShowMentorSelectionModal(true);
    // Keep selectedStudentsForAllocation and selectedMentorForAllocation for navigation
  };

  const handleBackToStudentSelection = () => {
    setShowMentorSelectionModal(false);
    setShowStudentSelectionModal(true);
    // Keep selectedStudentsForAllocation for navigation
  };

  const handleAllocateStudents = (
    mentorId: number, 
    studentIds: number[], 
    allocationPeriod: {startDate: string; endDate: string},
    capacityConfig: {capacity: number; officeLocation: string; availableHours: string}
  ) => {
    const mentor = mentors.find(m => m.id === mentorId);
    if (!mentor) return;

    const studentsToAllocate = availableStudents.filter(s => studentIds.includes(s.id));
    const currentLoad = getMentorCurrentLoad(mentorId);

    // Check capacity
    if (currentLoad + studentsToAllocate.length > capacityConfig.capacity) {
      alert(`Cannot allocate ${studentsToAllocate.length} students. Mentor capacity exceeded. Available slots: ${capacityConfig.capacity - currentLoad}`);
      return;
    }

    // Check for overlapping periods for this mentor
    const newStartDate = new Date(allocationPeriod.startDate);
    const newEndDate = new Date(allocationPeriod.endDate);
    
    const hasOverlap = allAllocations.some(allocation => {
      if (allocation.mentorId !== mentorId || allocation.status !== 'active') {
        return false;
      }
      
      const existingStartDate = new Date(allocation.allocationPeriod.startDate);
      const existingEndDate = new Date(allocation.allocationPeriod.endDate);
      
      // Check if periods overlap
      // Two periods overlap if: start1 <= end2 && start2 <= end1
      return newStartDate <= existingEndDate && existingStartDate <= newEndDate;
    });

    if (hasOverlap) {
      // Don't show alert, let the modal handle validation
      return;
    }

    // Create new allocation record
    const newAllocation: MentorAllocation = {
      id: Date.now(), // In real app, this would be generated by backend
      mentorId: mentorId,
      students: studentsToAllocate,
      allocationPeriod: allocationPeriod,
      capacity: capacityConfig.capacity,
      officeLocation: capacityConfig.officeLocation,
      availableHours: capacityConfig.availableHours,
      status: 'active',
      createdAt: new Date().toISOString(),
      createdBy: 'admin', // In real app, this would be current user
      academicYear: '2023-2024', // This should come from system settings
    };

    // Add to allocations list
    setAllAllocations(prev => [...prev, newAllocation]);

    // Update mentor's allocations
    setMentors(prev => prev.map(m => {
      if (m.id === mentorId) {
        return {
          ...m,
          allocations: [...m.allocations, newAllocation]
        };
      }
      return m;
    }));
    
    // Show success message
    alert(`Successfully created new allocation for ${mentor.name} with ${studentsToAllocate.length} students for period ${allocationPeriod.startDate} to ${allocationPeriod.endDate}`);
    
    // Reset all states
    setShowAllocationConfigModal(false);
    setSelectedStudentsForAllocation([]);
    setSelectedMentorForAllocation(null);
  };

  const handleAddIntervention = () => {
    if (!selectedMentor || !selectedStudent || !noteText) return;

    const newNote: MentorNote = {
      id: Date.now(),
      mentorId: selectedMentor.id,
      studentId: selectedStudent.id,
      note: noteText,
      date: new Date().toISOString().split("T")[0],
      outcome: noteOutcome,
      isPrivate: isPrivateNote,
      interventionType: interventionType,
      status: noteStatus,
    };

    setNotes([...notes, newNote]);
    
    // Reset form
    setNoteText("");
    setNoteOutcome("");
    setInterventionType('academic');
    setIsPrivateNote(false);
    setNoteStatus('pending');
    setShowInterventionModal(false);
  };

  const handleReassignStudent = (newMentorId: number) => {
    if (!studentToReassign) return;

    // Find the current allocation containing this student
    const currentAllocation = allAllocations.find(allocation => 
      allocation.status === 'active' && 
      allocation.students.some(s => s.id === studentToReassign.id)
    );

    if (!currentAllocation) return;

    // Remove student from current allocation
    const updatedCurrentAllocation = {
      ...currentAllocation,
      students: currentAllocation.students.filter(s => s.id !== studentToReassign.id)
    };

    // Find target mentor's latest allocation to use same settings
    const targetMentorAllocations = allAllocations.filter(
      allocation => allocation.mentorId === newMentorId && allocation.status === 'active'
    );
    
    const latestTargetAllocation = targetMentorAllocations.sort(
      (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    )[0];

    if (!latestTargetAllocation) {
      alert("Target mentor has no active allocations. Please create an allocation first.");
      return;
    }

    // Create new allocation for the reassigned student
    const newAllocation: MentorAllocation = {
      id: Date.now(),
      mentorId: newMentorId,
      students: [studentToReassign],
      allocationPeriod: latestTargetAllocation.allocationPeriod,
      capacity: latestTargetAllocation.capacity,
      officeLocation: latestTargetAllocation.officeLocation,
      availableHours: latestTargetAllocation.availableHours,
      status: 'active',
      createdAt: new Date().toISOString(),
      createdBy: 'admin',
      academicYear: latestTargetAllocation.academicYear,
    };

    // Update allocations
    setAllAllocations(prev => prev.map(allocation => 
      allocation.id === currentAllocation.id ? updatedCurrentAllocation : allocation
    ).concat(newAllocation));

    // Update mentors' allocations
    setMentors(prev => prev.map(mentor => {
      if (mentor.id === currentAllocation.mentorId) {
        return {
          ...mentor,
          allocations: mentor.allocations.map(allocation => 
            allocation.id === currentAllocation.id ? updatedCurrentAllocation : allocation
          )
        };
      }
      if (mentor.id === newMentorId) {
        return {
          ...mentor,
          allocations: [...mentor.allocations, newAllocation]
        };
      }
      return mentor;
    }));

    setShowReassignModal(false);
    setStudentToReassign(null);
  };

  const handleCapacityConfiguration = (allocationId: number, config: {
    capacity: number;
    officeLocation: string;
    availableHours: string;
  }) => {
    // Update the specific allocation
    const updatedAllocation = allAllocations.find(allocation => allocation.id === allocationId);
    if (!updatedAllocation) return;

    const newAllocation = {
      ...updatedAllocation,
      capacity: config.capacity,
      officeLocation: config.officeLocation,
      availableHours: config.availableHours,
    };

    // Update allocations state
    setAllAllocations(prev => prev.map(allocation => 
      allocation.id === allocationId ? newAllocation : allocation
    ));

    // Update mentor's allocations state
    const updatedMentors = mentors.map(mentor => {
      if (mentor.id === updatedAllocation.mentorId) {
        return {
          ...mentor,
          allocations: mentor.allocations.map(allocation => 
            allocation.id === allocationId ? newAllocation : allocation
          )
        };
      }
      return mentor;
    });
    
    setMentors(updatedMentors);

    // Update selectedMentor if it's the one being configured
    if (selectedMentor && selectedMentor.id === updatedAllocation.mentorId) {
      const updatedSelectedMentor = updatedMentors.find(m => m.id === selectedMentor.id);
      if (updatedSelectedMentor) {
        setSelectedMentor(updatedSelectedMentor);
      }
    }

    // Show success message
    alert(`Allocation configuration updated successfully for period ${updatedAllocation.allocationPeriod.startDate} to ${updatedAllocation.allocationPeriod.endDate}`);

    // Close modal and reset states
    setShowCapacityModal(false);
    setMentorForCapacityConfig(null);
    setAllocationForConfig(null);
  };

  const handleConfigureAllocation = (allocation: MentorAllocation) => {
    const mentor = mentors.find(m => m.id === allocation.mentorId);
    if (mentor) {
      setMentorForCapacityConfig(mentor);
      setAllocationForConfig(allocation);
      setShowCapacityModal(true);
    }
  };

  const handleAddStudentsToMentor = (mentor: Mentor) => {
    setMentorForAddingStudents(mentor);
    setShowAddStudentsModal(true);
  };

  const handleAddStudentsComplete = (studentIds: number[]) => {
    if (!mentorForAddingStudents) return;

    const studentsToAdd = availableStudents.filter(s => studentIds.includes(s.id));
    const currentLoad = getMentorCurrentLoad(mentorForAddingStudents.id);
    
    // Get the most recent active allocation for this mentor to use its capacity
    const activeAllocations = getMentorActiveAllocations(mentorForAddingStudents.id);
    const latestAllocation = activeAllocations.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())[0];
    
    if (!latestAllocation) {
      alert("No active allocation found for this mentor. Please create a new allocation first.");
      return;
    }

    if (currentLoad + studentsToAdd.length > latestAllocation.capacity) {
      alert(`Cannot add ${studentsToAdd.length} students. Mentor capacity exceeded. Available slots: ${latestAllocation.capacity - currentLoad}`);
      return;
    }

    // Check for overlapping periods when using the same period as latest allocation
    const newStartDate = new Date(latestAllocation.allocationPeriod.startDate);
    const newEndDate = new Date(latestAllocation.allocationPeriod.endDate);
    
    const hasOverlap = allAllocations.some(allocation => {
      if (allocation.mentorId !== mentorForAddingStudents.id || 
          allocation.status !== 'active' || 
          allocation.id === latestAllocation.id) {
        return false;
      }
      
      const existingStartDate = new Date(allocation.allocationPeriod.startDate);
      const existingEndDate = new Date(allocation.allocationPeriod.endDate);
      
      // Check if periods overlap
      return newStartDate <= existingEndDate && existingStartDate <= newEndDate;
    });

    if (hasOverlap) {
      // Don't show alert, validation should be handled in the modal
      return;
    }

    // Create new allocation record for the additional students
    const newAllocation: MentorAllocation = {
      id: Date.now(),
      mentorId: mentorForAddingStudents.id,
      students: studentsToAdd,
      allocationPeriod: latestAllocation.allocationPeriod, // Use same period as latest allocation
      capacity: latestAllocation.capacity,
      officeLocation: latestAllocation.officeLocation,
      availableHours: latestAllocation.availableHours,
      status: 'active',
      createdAt: new Date().toISOString(),
      createdBy: 'admin',
      academicYear: latestAllocation.academicYear,
    };

    // Add to allocations list
    setAllAllocations(prev => [...prev, newAllocation]);

    // Update mentor's allocations
    setMentors(prev => prev.map(m => {
      if (m.id === mentorForAddingStudents.id) {
        return {
          ...m,
          allocations: [...m.allocations, newAllocation]
        };
      }
      return m;
    }));

    setShowAddStudentsModal(false);
    setMentorForAddingStudents(null);
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="space-y-6 p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto">
        {/* Header */}
        <div className="bg-gradient-to-r from-purple-50 via-indigo-50 to-blue-50 rounded-2xl p-6 border border-purple-100">
        <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-1">
          Mentor Allocation
        </h1>
        <p className="text-gray-600 text-sm sm:text-base">
          Assign mentors to students and track mentoring interventions
        </p>
      </div>

        {/* KPI Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <KPICard
            title="Total Mentors"
            value={mentors.length}
            icon={<UserGroupIcon className="h-6 w-6" />}
            color="blue"
          />

          <KPICard
            title="Students Allocated"
            value={allAllocations
              .filter(allocation => allocation.status === 'active')
              .reduce((total, allocation) => total + allocation.students.length, 0)
            }
            icon={<AcademicCapIcon className="h-6 w-6" />}
            color="green"
          />

          <KPICard
            title="At-Risk Students"
            value={atRiskStudents.length}
            icon={<ExclamationTriangleIcon className="h-6 w-6" />}
            color="red"
          />

          <KPICard
            title="Total Interventions"
            value={totalInterventions}
            icon={<DocumentTextIcon className="h-6 w-6" />}
            color="purple"
          />
        </div>

        {/* Search & Filters */}
        <div className="bg-white rounded-xl border border-gray-200 p-6 shadow-sm">
          <div className="flex flex-col lg:flex-row gap-4">
            <div className="flex-1">
              <SearchBar
                value={searchQuery}
                onChange={setSearchQuery}
                placeholder="Search mentors by name, department, or designation..."
              />
            </div>
            <div className="flex flex-wrap gap-3">
              <select
                value={selectedDepartment}
                onChange={(e) => setSelectedDepartment(e.target.value)}
                className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 bg-white"
              >
                <option value="all">All Departments</option>
                {uniqueDepartments.map(dept => (
                  <option key={dept} value={dept}>{dept}</option>
                ))}
              </select>
              
              <select
                value={selectedBatch}
                onChange={(e) => setSelectedBatch(e.target.value)}
                className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 bg-white"
              >
                <option value="all">All Batches</option>
                {uniqueBatches.map(batch => (
                  <option key={batch} value={batch}>{batch}</option>
                ))}
              </select>

              <div className="flex border border-gray-300 rounded-lg overflow-hidden">
                <button
                  onClick={() => setViewMode('grid')}
                  className={`px-3 py-2 text-sm font-medium transition-colors ${
                    viewMode === 'grid' 
                      ? 'bg-indigo-600 text-white' 
                      : 'bg-white text-gray-700 hover:bg-gray-50'
                  }`}
                >
                  Grid
                </button>
                <button
                  onClick={() => setViewMode('list')}
                  className={`px-3 py-2 text-sm font-medium transition-colors ${
                    viewMode === 'list' 
                      ? 'bg-indigo-600 text-white' 
                      : 'bg-white text-gray-700 hover:bg-gray-50'
                  }`}
                >
                  List
                </button>
              </div>

              <button
                onClick={handleStartAllocation}
                disabled={unallocatedStudents.length === 0}
                className="flex items-center justify-center gap-2 px-6 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors font-medium disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <PlusCircleIcon className="h-5 w-5" />
                Allocate Students
              </button>
            </div>
          </div>
        </div>

        {/* Mentors List */}
        <div className={`${viewMode === 'grid' ? 'grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6' : 'space-y-4'}`}>
          {paginatedMentors.map((mentor) => (
            <div
              key={mentor.id}
              className={`bg-white rounded-xl border border-gray-200 shadow-sm hover:shadow-lg transition-all duration-200 ${
                viewMode === 'grid' ? 'p-6' : 'p-4'
              }`}
            >
              {viewMode === 'grid' ? (
                // Grid View
                <>
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex items-start gap-4 flex-1">
                      <div className="w-14 h-14 bg-indigo-100 rounded-xl flex items-center justify-center">
                        <UserIcon className="h-7 w-7 text-indigo-600" />
                      </div>
                      <div className="flex-1">
                        <h3 className="font-semibold text-gray-900 text-lg">{mentor.name}</h3>
                        <p className="text-sm text-gray-600 font-medium">{mentor.designation}</p>
                        <p className="text-xs text-gray-500">{mentor.department}</p>
                        <div className="flex items-center gap-2 mt-2">
                          <CalendarIcon className="h-4 w-4 text-blue-500" />
                          <div className="text-xs text-blue-600">
                            {(() => {
                              const activeAllocations = getMentorActiveAllocations(mentor.id);
                              if (activeAllocations.length === 0) {
                                return <span className="text-gray-400">No active allocations</span>;
                              }
                              
                              // Find currently running allocation (current date falls within period)
                              const currentDate = new Date();
                              const currentAllocation = activeAllocations.find(allocation => {
                                const startDate = new Date(allocation.allocationPeriod.startDate);
                                const endDate = new Date(allocation.allocationPeriod.endDate);
                                return currentDate >= startDate && currentDate <= endDate;
                              });
                              
                              if (currentAllocation) {
                                return (
                                  <div>
                                    <div className="font-medium">{currentAllocation.allocationPeriod.startDate} - {currentAllocation.allocationPeriod.endDate}</div>
                                    <div className="text-xs text-gray-500">{currentAllocation.academicYear}</div>
                                  </div>
                                );
                              }
                              
                              if (activeAllocations.length === 1) {
                                const allocation = activeAllocations[0];
                                return (
                                  <div>
                                    <div>{allocation.allocationPeriod.startDate} - {allocation.allocationPeriod.endDate}</div>
                                    <div className="text-xs text-gray-500">{allocation.academicYear}</div>
                                  </div>
                                );
                              }
                              
                              return (
                                <div>
                                  <div className="font-medium">{activeAllocations.length} active periods</div>
                                  <div className="text-xs text-gray-500">Multiple allocation timeframes</div>
                                </div>
                              );
                            })()}
                          </div>
                        </div>
                        {/* Risk Indicator */}
                        {getMentorAtRiskStudents(mentor.id).length > 0 && (
                          <div className="flex items-center gap-1 mt-2">
                            <ExclamationTriangleIcon className="h-4 w-4 text-red-500" />
                            <span className="text-xs text-red-600 font-medium">
                              {getMentorAtRiskStudents(mentor.id).length} at-risk student{getMentorAtRiskStudents(mentor.id).length > 1 ? 's' : ''}
                            </span>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Capacity Indicator */}
                  <div className="mb-4">
                    {(() => {
                      const activeAllocations = getMentorActiveAllocations(mentor.id);
                      
                      // Find currently running allocation (current date falls within period)
                      const currentDate = new Date();
                      const currentAllocation = activeAllocations.find(allocation => {
                        const startDate = new Date(allocation.allocationPeriod.startDate);
                        const endDate = new Date(allocation.allocationPeriod.endDate);
                        return currentDate >= startDate && currentDate <= endDate;
                      });
                      
                      if (currentAllocation) {
                        // Show capacity for current period only
                        const currentLoad = currentAllocation.students.length;
                        const maxCapacity = currentAllocation.capacity;
                        
                        return (
                          <>
                            <div className="flex items-center justify-between mb-2">
                              <span className="text-sm font-medium text-gray-700">
                                Capacity: {currentLoad}/{maxCapacity}
                              </span>
                              <span className={`text-xs px-2 py-1 rounded-full ${
                                currentLoad >= maxCapacity
                                  ? "bg-red-100 text-red-700"
                                  : currentLoad >= maxCapacity * 0.8
                                  ? "bg-yellow-100 text-yellow-700"
                                  : "bg-green-100 text-green-700"
                              }`}>
                                {currentLoad >= maxCapacity
                                  ? "Full"
                                  : currentLoad >= maxCapacity * 0.8
                                  ? "Near Full"
                                  : "Available"
                                }
                              </span>
                            </div>
                            <div className="w-full bg-gray-200 rounded-full h-3">
                              <div
                                className={`h-3 rounded-full transition-all duration-300 ${
                                  currentLoad >= maxCapacity
                                    ? "bg-red-500"
                                    : currentLoad >= maxCapacity * 0.8
                                    ? "bg-yellow-500"
                                    : "bg-green-500"
                                }`}
                                style={{
                                  width: `${Math.min((currentLoad / maxCapacity) * 100, 100)}%`,
                                }}
                              />
                            </div>
                          </>
                        );
                      } else {
                        // No current period, show total across all active allocations
                        const currentLoad = getMentorCurrentLoad(mentor.id);
                        const maxCapacity = activeAllocations.length > 0 
                          ? Math.max(...activeAllocations.map(a => a.capacity))
                          : 15; // Default capacity
                        
                        return (
                          <>
                            <div className="flex items-center justify-between mb-2">
                              <span className="text-sm font-medium text-gray-700">
                                Total Capacity: {currentLoad}/{maxCapacity}
                              </span>
                              <span className="text-xs px-2 py-1 rounded-full bg-gray-100 text-gray-600">
                                Historical Data
                              </span>
                            </div>
                            <div className="w-full bg-gray-200 rounded-full h-3">
                              <div
                                className="h-3 rounded-full transition-all duration-300 bg-gray-400"
                                style={{
                                  width: `${Math.min((currentLoad / maxCapacity) * 100, 100)}%`,
                                }}
                              />
                            </div>
                          </>
                        );
                      }
                    })()}
                  </div>

                  {/* Action Buttons */}
                  <div className="mt-4 flex gap-2">
                    <button
                      onClick={() => {
                        setSelectedMentor(mentor);
                        setShowMentorDetailsModal(true);
                      }}
                      className="flex-1 px-4 py-2 bg-indigo-600 text-white text-sm font-medium rounded-lg hover:bg-indigo-700 transition-colors"
                    >
                      View Details
                    </button>
                    <button
                      onClick={() => handleAddStudentsToMentor(mentor)}
                      disabled={(() => {
                        const currentLoad = getMentorCurrentLoad(mentor.id);
                        const activeAllocations = getMentorActiveAllocations(mentor.id);
                        const maxCapacity = activeAllocations.length > 0 
                          ? Math.max(...activeAllocations.map(a => a.capacity))
                          : 15;
                        return currentLoad >= maxCapacity || unallocatedStudents.length === 0 || activeAllocations.length === 0;
                      })()}
                      className="px-3 py-2 bg-green-100 text-green-700 hover:bg-green-200 disabled:opacity-50 disabled:cursor-not-allowed rounded-lg transition-colors"
                      title="Add Students"
                    >
                      <UserPlusIcon className="h-4 w-4" />
                    </button>
                  </div>


                </>
              ) : (
                // List View
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 bg-indigo-100 rounded-lg flex items-center justify-center">
                      <UserIcon className="h-6 w-6 text-indigo-600" />
                    </div>
                    <div>
                      <h3 className="font-semibold text-gray-900">{mentor.name}</h3>
                      <p className="text-sm text-gray-600">{mentor.designation} • {mentor.department}</p>
                      {getMentorAtRiskStudents(mentor.id).length > 0 && (
                        <div className="flex items-center gap-1 mt-1">
                          <ExclamationTriangleIcon className="h-3 w-3 text-red-500" />
                          <span className="text-xs text-red-600">
                            {getMentorAtRiskStudents(mentor.id).length} at-risk
                          </span>
                        </div>
                      )}
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-6">
                    <div className="text-center">
                      <p className="text-sm font-medium text-gray-900">
                        {getMentorCurrentLoad(mentor.id)}/{(() => {
                          const activeAllocations = getMentorActiveAllocations(mentor.id);
                          return activeAllocations.length > 0 
                            ? Math.max(...activeAllocations.map(a => a.capacity))
                            : 15;
                        })()}
                      </p>
                      <p className="text-xs text-gray-500">Capacity</p>
                    </div>
                    
                    <div className="text-center">
                      <p className="text-sm font-medium text-red-600">
                        {getMentorAtRiskStudents(mentor.id).length}
                      </p>
                      <p className="text-xs text-gray-500">At-Risk</p>
                    </div>
                    
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => {
                          setSelectedMentor(mentor);
                          setShowMentorDetailsModal(true);
                        }}
                        className="px-3 py-1.5 bg-indigo-600 text-white text-sm font-medium rounded-lg hover:bg-indigo-700 transition-colors"
                      >
                        View Details
                      </button>
                      <button
                        onClick={() => handleAddStudentsToMentor(mentor)}
                        disabled={(() => {
                          const currentLoad = getMentorCurrentLoad(mentor.id);
                          const activeAllocations = getMentorActiveAllocations(mentor.id);
                          const maxCapacity = activeAllocations.length > 0 
                            ? Math.max(...activeAllocations.map(a => a.capacity))
                            : 15;
                          return currentLoad >= maxCapacity || unallocatedStudents.length === 0 || activeAllocations.length === 0;
                        })()}
                        className="px-2 py-1.5 bg-green-100 text-green-700 hover:bg-green-200 disabled:opacity-50 disabled:cursor-not-allowed rounded-lg transition-colors"
                        title="Add Students"
                      >
                        <UserPlusIcon className="h-4 w-4" />
                      </button>
                    </div>
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>

        {/* Pagination */}
        {totalMentors > 0 && (
          <Pagination
            currentPage={currentPage}
            totalPages={totalPages}
            totalItems={totalMentors}
            itemsPerPage={itemsPerPage}
            onPageChange={setCurrentPage}
          />
        )}

        {/* Modals */}
        {showStudentSelectionModal && (
          <StudentSelectionModal
            key="allocate-students"
            availableStudents={unallocatedStudents.filter(student => 
              (selectedBatch === "all" || student.batch === selectedBatch) &&
              (selectedDepartment === "all" || student.department === selectedDepartment)
            )}
            onClose={() => setShowStudentSelectionModal(false)}
            onNext={handleStudentSelectionComplete}
            initialSelectedStudents={selectedStudentsForAllocation}
          />
        )}

        {showMentorSelectionModal && (
          <MentorSelectionModal
            selectedStudents={selectedStudentsForAllocation.map(id => 
              availableStudents.find(s => s.id === id)!
            )}
            mentors={mentors}
            onClose={() => {
              setShowMentorSelectionModal(false);
              setSelectedStudentsForAllocation([]);
            }}
            onBack={handleBackToStudentSelection}
            onNext={handleMentorSelectionComplete}
            initialSelectedMentorId={selectedMentorForAllocation?.id || null}
            getMentorCurrentLoad={getMentorCurrentLoad}
            getMentorActiveAllocations={getMentorActiveAllocations}
          />
        )}

        {showAllocationConfigModal && selectedMentorForAllocation && (
          <AllocationConfigurationModal
            selectedStudents={selectedStudentsForAllocation.map(id => 
              availableStudents.find(s => s.id === id)!
            )}
            selectedMentor={selectedMentorForAllocation}
            onClose={() => {
              setShowAllocationConfigModal(false);
              setSelectedStudentsForAllocation([]);
              setSelectedMentorForAllocation(null);
            }}
            onBack={handleBackToMentorSelection}
            onAllocate={handleAllocateStudents}
            getMentorCurrentLoad={getMentorCurrentLoad}
            getMentorActiveAllocations={getMentorActiveAllocations}
            allAllocations={allAllocations}
          />
        )}

        {showInterventionModal && (
          <InterventionModal
            student={selectedStudent}
            noteText={noteText}
            noteOutcome={noteOutcome}
            interventionType={interventionType}
            isPrivateNote={isPrivateNote}
            noteStatus={noteStatus}
            onNoteChange={setNoteText}
            onOutcomeChange={setNoteOutcome}
            onInterventionTypeChange={(value) => setInterventionType(value as any)}
            onPrivateChange={setIsPrivateNote}
            onStatusChange={(value) => setNoteStatus(value as any)}
            onClose={() => {
              setShowInterventionModal(false);
              setSelectedMentor(null);
              setSelectedStudent(null);
            }}
            onSave={handleAddIntervention}
          />
        )}

        {showMentorDetailsModal && selectedMentor && (
          <MentorDetailsDrawer
            key={`mentor-${selectedMentor.id}-${selectedMentor.allocations.length}`}
            mentor={selectedMentor}
            notes={notes.filter(n => n.mentorId === selectedMentor.id)}
            onClose={() => {
              setShowMentorDetailsModal(false);
              setSelectedMentor(null);
            }}
            onLogIntervention={(student) => {
              setSelectedStudent(student);
              setShowInterventionModal(true);
            }}
            onReassignStudent={(student) => {
              setStudentToReassign(student);
              setShowReassignModal(true);
            }}
            onConfigureAllocation={handleConfigureAllocation}
          />
        )}

        {showReassignModal && studentToReassign && (
          <ReassignModal
            student={studentToReassign}
            mentors={mentors}
            onClose={() => {
              setShowReassignModal(false);
              setStudentToReassign(null);
            }}
            onReassign={handleReassignStudent}
            getMentorCurrentLoad={getMentorCurrentLoad}
            getMentorActiveAllocations={getMentorActiveAllocations}
          />
        )}

        {showCapacityModal && mentorForCapacityConfig && allocationForConfig && (
          <MentorCapacityModal
            mentor={mentorForCapacityConfig}
            allocation={allocationForConfig}
            onClose={() => {
              setShowCapacityModal(false);
              setMentorForCapacityConfig(null);
              setAllocationForConfig(null);
            }}
            onSave={handleCapacityConfiguration}
          />
        )}

        {showAddStudentsModal && mentorForAddingStudents && (
          <StudentSelectionModal
            key={`add-students-${mentorForAddingStudents.id}`}
            availableStudents={unallocatedStudents.filter(student => 
              (selectedBatch === "all" || student.batch === selectedBatch) &&
              (selectedDepartment === "all" || student.department === selectedDepartment)
            )}
            title={`Add Students to ${mentorForAddingStudents.name}`}
            description={`Select students to assign to ${mentorForAddingStudents.name} (${mentorForAddingStudents.designation}). Available capacity: ${(() => {
              const currentLoad = getMentorCurrentLoad(mentorForAddingStudents.id);
              const activeAllocations = getMentorActiveAllocations(mentorForAddingStudents.id);
              const maxCapacity = activeAllocations.length > 0 
                ? Math.max(...activeAllocations.map(a => a.capacity))
                : 15;
              return maxCapacity - currentLoad;
            })()} students`}
            buttonText="Add Selected Students"
            onClose={() => {
              setShowAddStudentsModal(false);
              setMentorForAddingStudents(null);
            }}
            onNext={handleAddStudentsComplete}
          />
        )}
      </div>
    </div>
  );
};

export default MentorAllocation;