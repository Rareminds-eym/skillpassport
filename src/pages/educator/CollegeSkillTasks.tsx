import { useState, useMemo, useEffect } from "react";
import { 
  Search, Users, Calendar, Trophy, Plus, X, 
  Edit, UserPlus, 
  Clock, Star, Activity, 
  Eye, CheckCircle, Download,
  Paperclip as PaperClipIcon,
  Tag as TagIcon,
  BookOpen as BookOpenIcon,
  GraduationCap as AcademicCapIcon,
  MoreVertical,
  Trash2
} from "lucide-react";
import { supabase } from "../../lib/supabaseClient";
import { useEducatorSchool } from "../../hooks/useEducatorSchool";
import toast from "react-hot-toast";
import * as collegeAssignmentService from "../../services/collegeAssignmentService";
import { getDocumentUrl, uploadMultipleFiles, deleteFile } from "../../services/fileUploadService";

// Types
interface Department {
    id: string;
    name: string;
    code: string;
}

interface Program {
    id: string;
    name: string;
    code: string;
    department_id: string;
}

interface ProgramSection {
    id: string;
    department_id: string;
    program_id: string;
    semester: number;
    section: string;
    academic_year: string;
    max_students: number;
    current_students: number;
    faculty_id: string;
    status: string;
    program?: Program;
    department?: Department;
}

interface Course {
    id: string;
    course_name: string;
    course_code: string;
}

interface CollegeStudent {
    id: string;
    user_id: string;
    name: string;
    email: string;
    program_id: string;
    section: string;
    semester: number;
    roll_number: string;
}

interface TaskAssignment {
    assignment_id: string;
    title: string;
    description: string;
    instructions?: string;
    course_name: string;
    course_code: string;
    due_date: string;
    assignment_type: string;
    total_points: number;
    skill_outcomes: string[];
    status: string;
    created_date: string;
    program_name?: string;
    department_name?: string;
    semester?: number;
    section?: string;
    academic_year?: string;
    program_section_id?: string;
    instruction_files?: Array<{
        name: string;
        url: string;
        size: number;
        type: string;
    }>;
}

const assignmentTypes = [
    { value: "homework", label: "Homework" },
    { value: "project", label: "Project" },
    { value: "quiz", label: "Quiz" },
    { value: "exam", label: "Exam" },
    { value: "lab", label: "Lab" },
    { value: "essay", label: "Essay" },
    { value: "presentation", label: "Presentation" },
    { value: "other", label: "Other" }
];

const defaultSkills = [
    "Communication", "AI", "Design Thinking", "Problem Solving", 
    "Research", "Entrepreneurship", "Data Structures", "Programming",
    "Critical Thinking", "Leadership", "Teamwork", "Innovation"
];

export default function CollegeSkillTasks() {
    // State management
    const [loading, setLoading] = useState(true);
    const [departments, setDepartments] = useState<Department[]>([]);
    const [programs, setPrograms] = useState<Program[]>([]);
    const [programSections, setProgramSections] = useState<ProgramSection[]>([]);
    const [courses, setCourses] = useState<Course[]>([]);
    const [students, setStudents] = useState<CollegeStudent[]>([]);
    const [assignments, setAssignments] = useState<TaskAssignment[]>([]);
    const [statistics, setStatistics] = useState({
        totalAssignments: 0,
        activeAssignments: 0,
        totalSubmissions: 0,
        pendingReviews: 0,
        averageScore: 0
    });
    
    // Modal states
    const [createTaskModal, setCreateTaskModal] = useState(false);
    const [assignStudentsModal, setAssignStudentsModal] = useState(false);
    const [selectedAssignment, setSelectedAssignment] = useState<TaskAssignment | null>(null);
    const [openMenuId, setOpenMenuId] = useState<string | null>(null);
    const [viewDetailsModal, setViewDetailsModal] = useState(false);
    const [editTaskModal, setEditTaskModal] = useState(false);
    const [deleteConfirmModal, setDeleteConfirmModal] = useState(false);
    
    // Form mode and attachment states
    const [formMode, setFormMode] = useState<'create' | 'edit'>('create');
    const [removeExistingFile, setRemoveExistingFile] = useState(false);
    const [confirmRemoveFileModal, setConfirmRemoveFileModal] = useState(false);
    
    // Form states
    const [taskForm, setTaskForm] = useState({
        title: "",
        description: "",
        instructions: "",
        course_name: "",
        course_code: "",
        department_id: "",
        program_id: "",
        section_id: "",
        assignment_type: "homework",
        total_points: 100,
        skill_outcomes: [] as string[],
        due_date: "",
        available_from: "",
        allow_late_submission: true,
        document_pdf: "",
        instruction_files: [] as File[]
    });
    
    // Filter states
    const [searchQuery, setSearchQuery] = useState("");
    const [selectedDepartment, setSelectedDepartment] = useState("all");
    const [selectedProgram, setSelectedProgram] = useState("all");
    const [selectedStatus, setSelectedStatus] = useState("all");
    
    // Student selection states
    const [selectedStudents, setSelectedStudents] = useState<string[]>([]);
    const [studentSearchQuery, setStudentSearchQuery] = useState("");
    
    // Get educator information
    const { college: educatorCollege, educatorType, loading: schoolLoading } = useEducatorSchool();

    // Form reset effect based on modal mode
    useEffect(() => {
        if (createTaskModal || editTaskModal) {
            if (formMode === 'create') {
                // Reset to empty form template
                setTaskForm({
                    title: "",
                    description: "",
                    instructions: "",
                    course_name: "",
                    course_code: "",
                    department_id: "",
                    program_id: "",
                    section_id: "",
                    assignment_type: "homework",
                    total_points: 100,
                    skill_outcomes: [],
                    due_date: "",
                    available_from: "",
                    allow_late_submission: true,
                    document_pdf: "",
                    instruction_files: []
                });
                setRemoveExistingFile(false);
                setConfirmRemoveFileModal(false);
            } else if (formMode === 'edit' && selectedAssignment) {
                // Map selected task into form
                setTaskForm(mapTaskToFormState(selectedAssignment));
                setRemoveExistingFile(false);
                setConfirmRemoveFileModal(false);
            }
        }
    }, [createTaskModal, editTaskModal, formMode, selectedAssignment]);

    // Fetch initial data
    useEffect(() => {
        if (!schoolLoading && educatorCollege && educatorType === 'college') {
            fetchInitialData();
        }
    }, [educatorCollege, educatorType, schoolLoading]);

    const fetchInitialData = async () => {
        try {
            setLoading(true);
            
            // Get current user
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) {
                toast.error('User not authenticated');
                return;
            }

            await Promise.all([
                fetchDepartments(),
                fetchPrograms(),
                fetchProgramSections(user.id),
                fetchCourses(),
                fetchAssignments(user.id),
                fetchStatistics(user.id)
            ]);
        } catch (error) {
            console.error('Error fetching initial data:', error);
            toast.error('Failed to load data');
        } finally {
            setLoading(false);
        }
    };

    const fetchDepartments = async () => {
        if (!educatorCollege?.id) return;
        
        // Get current user
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return;
        
        const { data, error } = await collegeAssignmentService.fetchEducatorDepartments(user.id);
        if (error) {
            console.error('Error fetching departments:', error);
            toast.error('Failed to load departments');
        } else {
            setDepartments(data || []);
        }
    };

    const fetchPrograms = async () => {
        if (!educatorCollege?.id) return;
        
        // Get current user
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return;
        
        const { data, error } = await collegeAssignmentService.fetchEducatorPrograms(
            user.id,
            taskForm.department_id || undefined
        );
        if (error) {
            console.error('Error fetching programs:', error);
            toast.error('Failed to load programs');
        } else {
            setPrograms(data || []);
        }
    };

    const fetchProgramSections = async (userId: string) => {
        console.log('📑 COMPONENT: Fetching program sections for user:', userId);
        const { data, error } = await collegeAssignmentService.fetchEducatorProgramSections(userId);
        if (error) {
            console.error('❌ COMPONENT: Error fetching program sections:', error);
            toast.error('Failed to load program sections');
        } else {
            console.log('✅ COMPONENT: Received', data?.length || 0, 'program sections');
            console.log('📋 COMPONENT: Program sections data:', data);
            setProgramSections(data || []);
        }
    };

    const fetchCourses = async () => {
        // Courses are now fetched based on program and semester selection
        // This will be called when section is selected
        setCourses([]);
    };

    const fetchAssignments = async (userId: string) => {
        const { data, error } = await collegeAssignmentService.fetchEducatorAssignments(userId);
        if (error) {
            console.error('Error fetching assignments:', error);
            toast.error('Failed to load assignments');
        } else {
            setAssignments(data || []);
        }
    };

    const fetchStatistics = async (userId: string) => {
        const { data, error } = await collegeAssignmentService.getAssignmentStatistics(userId);
        if (error) {
            console.error('Error fetching statistics:', error);
        } else {
            setStatistics(data || {
                totalAssignments: 0,
                activeAssignments: 0,
                totalSubmissions: 0,
                pendingReviews: 0,
                averageScore: 0
            });
        }
    };

    const fetchStudentsForSection = async (sectionId: string) => {
        console.log('🎯 Component: Fetching students for section:', sectionId);
        const { data, error } = await collegeAssignmentService.fetchProgramSectionStudents(sectionId);
        if (error) {
            console.error('❌ Component: Error fetching students:', error);
            toast.error('Failed to load students');
            setStudents([]);
        } else {
            console.log('✅ Component: Received students:', data?.length || 0, 'students');
            console.log('📦 Component: Student data:', data);
            setStudents(data || []);
        }
    };

    // Filtered data
    const filteredSections = useMemo(() => {
        console.log('🔍 COMPONENT: Filtering sections...');
        console.log('📊 COMPONENT: Total sections:', programSections.length);
        console.log('🏢 COMPONENT: Selected department:', selectedDepartment);
        console.log('🎓 COMPONENT: Selected program (form):', taskForm.program_id);
        
        const filtered = programSections.filter(section => {
            const deptMatch = selectedDepartment === "all" || section.department_id === selectedDepartment;
            const progMatch = selectedProgram === "all" || section.program_id === selectedProgram;
            
            console.log('🔎 COMPONENT: Section', section.id, {
                program: section.program?.name,
                semester: section.semester,
                section: section.section,
                department_id: section.department_id,
                program_id: section.program_id,
                deptMatch,
                progMatch,
                included: deptMatch && progMatch
            });
            
            return deptMatch && progMatch;
        });
        
        console.log('✅ COMPONENT: Filtered sections count:', filtered.length);
        console.log('📋 COMPONENT: Filtered sections:', filtered.map(s => ({
            id: s.id,
            program: s.program?.name,
            semester: s.semester,
            section: s.section
        })));
        
        return filtered;
    }, [programSections, selectedDepartment, selectedProgram]);

    // Sections for dropdown (filtered by form program_id)
    const sectionsForDropdown = useMemo(() => {
        console.log('\n' + '='.repeat(70));
        console.log('📝 DROPDOWN COMPUTATION START');
        console.log('='.repeat(70));
        console.log('🎓 Form program_id:', taskForm.program_id);
        console.log('📊 Total programSections:', programSections.length);
        console.log('📊 Filtered sections available:', filteredSections.length);
        
        console.log('\n📋 ALL PROGRAM SECTIONS:');
        programSections.forEach((s, i) => {
            console.log(`  ${i + 1}. ID: ${s.id}`);
            console.log(`     Program: ${s.program?.name} (${s.program_id})`);
            console.log(`     Semester: ${s.semester}, Section: ${s.section}`);
            console.log(`     Academic Year: ${s.academic_year}`);
        });
        
        console.log('\n📋 FILTERED SECTIONS (after dept/prog filter):');
        filteredSections.forEach((s, i) => {
            console.log(`  ${i + 1}. ID: ${s.id}`);
            console.log(`     Program: ${s.program?.name} (${s.program_id})`);
            console.log(`     Semester: ${s.semester}, Section: ${s.section}`);
            console.log(`     Matches form program? ${s.program_id === taskForm.program_id ? '✅ YES' : '❌ NO'}`);
        });
        
        if (!taskForm.program_id) {
            console.log('\n⚠️ NO PROGRAM SELECTED - Returning empty array');
            console.log('='.repeat(70) + '\n');
            return [];
        }
        
        const sections = filteredSections.filter(section => {
            const matches = section.program_id === taskForm.program_id;
            console.log(`\n🔍 Checking section ${section.id}:`);
            console.log(`   section.program_id: "${section.program_id}"`);
            console.log(`   taskForm.program_id: "${taskForm.program_id}"`);
            console.log(`   Match: ${matches ? '✅ YES' : '❌ NO'}`);
            return matches;
        });
        
        console.log('\n✅ FINAL SECTIONS FOR DROPDOWN:', sections.length);
        sections.forEach((s, i) => {
            console.log(`  ${i + 1}. Sem ${s.semester} - ${s.section} (${s.academic_year})`);
        });
        
        if (sections.length === 0 && taskForm.program_id) {
            console.log('\n❌ WARNING: No sections match the selected program!');
            console.log('🔍 Possible reasons:');
            console.log('   1. program_id mismatch (check exact UUID values)');
            console.log('   2. Sections filtered out by department/program filter');
            console.log('   3. No sections assigned to this program');
        }
        
        console.log('='.repeat(70) + '\n');
        return sections;
    }, [filteredSections, taskForm.program_id, programSections]);

    const filteredAssignments = useMemo(() => {
        return assignments.filter(assignment => {
            if (searchQuery && !assignment.title.toLowerCase().includes(searchQuery.toLowerCase())) return false;
            if (selectedStatus !== "all" && assignment.status !== selectedStatus) return false;
            return true;
        });
    }, [assignments, searchQuery, selectedStatus]);

    const filteredStudents = useMemo(() => {
        return students.filter(student => {
            if (studentSearchQuery && !student.name.toLowerCase().includes(studentSearchQuery.toLowerCase()) && 
                !student.email.toLowerCase().includes(studentSearchQuery.toLowerCase())) return false;
            return true;
        });
    }, [students, studentSearchQuery]);

    // Handle form changes
    const handleTaskFormChange = (field: string, value: any) => {
        setTaskForm(prev => ({
            ...prev,
            [field]: value
        }));
    };

    const handleDepartmentChange = async (departmentId: string) => {
        console.log('🏢 COMPONENT: Department changed to:', departmentId);
        
        setTaskForm(prev => ({
            ...prev,
            department_id: departmentId,
            program_id: "", // Reset dependent fields
            section_id: "",
            course_name: "",
            course_code: ""
        }));
        
        // Clear dependent data (but NOT programSections - they're filtered client-side!)
        setPrograms([]);
        // setProgramSections([]); // ❌ DON'T clear sections!
        setCourses([]);
        setStudents([]);
        
        // Fetch programs for this department
        if (departmentId) {
            console.log('📞 COMPONENT: Fetching programs for department:', departmentId);
            const { data: { user } } = await supabase.auth.getUser();
            if (user) {
                console.log('👤 COMPONENT: User ID:', user.id);
                const { data, error } = await collegeAssignmentService.fetchEducatorPrograms(user.id, departmentId);
                if (error) {
                    console.error('❌ COMPONENT: Error fetching programs:', error);
                    toast.error('Failed to load programs');
                } else {
                    console.log('✅ COMPONENT: Loaded', data?.length || 0, 'programs');
                    console.log('📋 COMPONENT: Programs:', data);
                    setPrograms(data || []);
                }
            }
        } else {
            console.log('⚠️ COMPONENT: No department selected, clearing data');
        }
    };

    const handleProgramChange = async (programId: string) => {
        console.log('\n' + '🎓'.repeat(35));
        console.log('🎓 PROGRAM CHANGE EVENT');
        console.log('🎓'.repeat(35));
        console.log('Selected program ID:', programId);
        console.log('Previous program ID:', taskForm.program_id);
        
        setTaskForm(prev => {
            console.log('📝 Updating form state...');
            console.log('   Old program_id:', prev.program_id);
            console.log('   New program_id:', programId);
            return {
                ...prev,
                program_id: programId,
                section_id: "", // Reset dependent fields
                course_name: "",
                course_code: ""
            };
        });
        
        // Clear dependent data
        setCourses([]);
        setStudents([]);
        
        // Fetch courses for this program
        if (programId) {
            console.log('📚 COMPONENT: Fetching courses for program:', programId);
            const { data: { user } } = await supabase.auth.getUser();
            if (user) {
                console.log('👤 COMPONENT: User ID:', user.id);
                const { data, error } = await collegeAssignmentService.fetchEducatorCoursesByProgram(user.id, programId);
                if (error) {
                    console.error('❌ COMPONENT: Error fetching courses:', error);
                    toast.error('Failed to load courses');
                    setCourses([]);
                } else {
                    console.log('✅ COMPONENT: Loaded', data?.length || 0, 'courses');
                    console.log('📚 COMPONENT: Courses:', data);
                    setCourses(data || []);
                }
            }
        } else {
            console.log('⚠️ COMPONENT: No program selected, clearing courses');
        }
        
        console.log('🎓'.repeat(35) + '\n');
    };

    const handleFileUpload = (files: FileList | null) => {
        if (files) {
            const fileArray = Array.from(files);
            setTaskForm(prev => ({
                ...prev,
                instruction_files: [...prev.instruction_files, ...fileArray]
            }));
        }
    };

    const removeFile = (index: number) => {
        setTaskForm(prev => ({
            ...prev,
            instruction_files: prev.instruction_files.filter((_, i) => i !== index)
        }));
    };

    const toggleSkill = (skill: string) => {
        setTaskForm(prev => ({
            ...prev,
            skill_outcomes: prev.skill_outcomes.includes(skill)
                ? prev.skill_outcomes.filter(s => s !== skill)
                : [...prev.skill_outcomes, skill]
        }));
    };

    const handleCourseChange = (courseId: string) => {
        const course = courses.find(c => c.id === courseId);
        if (course) {
            setTaskForm(prev => ({
                ...prev,
                course_name: course.course_name,
                course_code: course.course_code
            }));
        }
    };

    const handleSectionChange = async (sectionId: string) => {
        console.log('  COcMPONENT: Section changed to:', sectionId);
        setTaskForm(prev => ({
            ...prev,
            section_id: sectionId
        }));
        
        // Fetch students for this section
        if (sectionId) {
            console.log('  COMPOnNENT: Fetching students for section:', sectionId);
            await fetchStudentsForSection(sectionId);
        } else {
            console.log('⚠️ COMPONENT: No section ID provided, clearing students');
            setStudents([]);
        }
    };

    const handleCreateTask = async () => {
        try {
            if (!taskForm.title.trim()) {
                toast.error("Task title is required");
                return;
            }
            if (!taskForm.due_date) {
                toast.error("Due date is required");
                return;
            }
            if (!taskForm.section_id) {
                toast.error("Please select a program section");
                return;
            }
            if (!educatorCollege?.id) {
                toast.error("College information not found");
                return;
            }

            const { data: { user } } = await supabase.auth.getUser();
            if (!user) {
                toast.error("User not authenticated");
                return;
            }

            const assignmentData = {
                title: taskForm.title.trim(),
                description: taskForm.description,
                instructions: taskForm.instructions,
                course_name: taskForm.course_name,
                course_code: taskForm.course_code,
                college_id: educatorCollege.id,
                program_section_id: taskForm.section_id,
                department_id: taskForm.department_id,
                program_id: taskForm.program_id,
                total_points: taskForm.total_points,
                assignment_type: taskForm.assignment_type,
                skill_outcomes: taskForm.skill_outcomes,
                due_date: taskForm.due_date,
                available_from: taskForm.available_from,
                allow_late_submission: taskForm.allow_late_submission,
                document_pdf: taskForm.document_pdf
            };

            // Pass instruction files to the service
            const { data: assignment, error } = await collegeAssignmentService.createCollegeAssignment(
                assignmentData,
                user.id,
                taskForm.instruction_files  // Pass files here
            );

            if (error) {
                toast.error(error);
                return;
            }

            toast.success("Task created successfully");
            setCreateTaskModal(false);
            setSelectedAssignment(assignment);
            
            // Fetch students for the section
            await fetchStudentsForSection(taskForm.section_id);
            setAssignStudentsModal(true);
            
            // Reset form
            setTaskForm({
                title: "",
                description: "",
                instructions: "",
                course_name: "",
                course_code: "",
                department_id: "",
                program_id: "",
                section_id: "",
                assignment_type: "homework",
                total_points: 100,
                skill_outcomes: [],
                due_date: "",
                available_from: "",
                allow_late_submission: true,
                document_pdf: "",
                instruction_files: []
            });

            // Refresh assignments and statistics
            await fetchAssignments(user.id);
            await fetchStatistics(user.id);
        } catch (error) {
            console.error('Error creating task:', error);
            toast.error('Failed to create task');
        }
    };

    const handleAssignToStudents = async () => {
        try {
            if (!selectedAssignment || selectedStudents.length === 0) {
                toast.error("Please select students to assign the task");
                return;
            }

            const { error } = await collegeAssignmentService.assignTaskToStudents(
                selectedAssignment.assignment_id,
                selectedStudents
            );

            if (error) {
                toast.error(error);
                return;
            }

            toast.success(`Task assigned to ${selectedStudents.length} students`);
            setAssignStudentsModal(false);
            setSelectedStudents([]);
            setSelectedAssignment(null);
            
            // Refresh statistics
            const { data: { user } } = await supabase.auth.getUser();
            if (user) {
                await fetchStatistics(user.id);
            }
        } catch (error) {
            console.error('Error assigning task to students:', error);
            toast.error('Failed to assign task to students');
        }
    };

    const handleViewDetails = (assignment: TaskAssignment) => {
        setSelectedAssignment(assignment);
        setViewDetailsModal(true);
        setOpenMenuId(null);
    };

    // Mapper function to convert task object to form state
    const mapTaskToFormState = (assignment: TaskAssignment) => {
        // Convert due_date to datetime-local format (YYYY-MM-DDTHH:MM)
        const formatDateTimeLocal = (dateString: string) => {
            if (!dateString) return "";
            const date = new Date(dateString);
            // Get local timezone offset and adjust
            const offset = date.getTimezoneOffset();
            const localDate = new Date(date.getTime() - (offset * 60 * 1000));
            return localDate.toISOString().slice(0, 16); // YYYY-MM-DDTHH:MM
        };

        // Find department_id from the program sections
        const findDepartmentId = () => {
            if (!assignment.program_section_id) return "";
            const section = programSections.find(s => s.id === assignment.program_section_id);
            return section?.department_id || "";
        };

        // Find program_id from the program sections
        const findProgramId = () => {
            if (!assignment.program_section_id) return "";
            const section = programSections.find(s => s.id === assignment.program_section_id);
            return section?.program_id || "";
        };

        // Extract skill outcomes from skill tags
        const extractSkillOutcomes = (skills: any) => {
            if (!skills || !Array.isArray(skills)) return [];
            return skills.map(skill => {
                if (typeof skill === 'string') {
                    // Return the skill name directly since we use defaultSkills array
                    return skill;
                }
                if (typeof skill === 'object' && skill.name) {
                    return skill.name; // Extract name from skill object
                }
                if (typeof skill === 'object' && skill.id) {
                    // If it's an ID, try to find the corresponding skill name in defaultSkills
                    return skill.id;
                }
                return skill;
            }).filter(Boolean); // Remove any null/undefined values
        };

        // Extract instruction files reference URL
        const extractReferenceDocumentUrl = (files: any) => {
            if (!files || !Array.isArray(files) || files.length === 0) return "";
            // Return the first file's URL as reference_document_url
            return files[0].url || "";
        };

        return {
            title: assignment.title || "",
            description: assignment.description || "",
            instructions: assignment.instructions || "",
            course_name: assignment.course_name || "",
            course_code: assignment.course_code || "",
            department_id: findDepartmentId(),
            program_id: findProgramId(),
            section_id: assignment.program_section_id || "",
            assignment_type: assignment.assignment_type || "homework",
            total_points: assignment.total_points || 100,
            skill_outcomes: extractSkillOutcomes(assignment.skill_outcomes),
            due_date: formatDateTimeLocal(assignment.due_date),
            available_from: "", // Not available in task object
            allow_late_submission: true, // Default value, not in task object
            document_pdf: extractReferenceDocumentUrl(assignment.instruction_files),
            instruction_files: [] as File[] // Reset to empty for new uploads
        };
    };

    const handleEditTask = (assignment: TaskAssignment) => {
        setSelectedAssignment(assignment);
        setFormMode('edit');
        setEditTaskModal(true);
        setOpenMenuId(null);
    };

    const handleUpdateTask = async () => {
        try {
            if (!selectedAssignment) return;
            
            if (!taskForm.title.trim()) {
                toast.error("Task title is required");
                return;
            }
            if (!taskForm.due_date) {
                toast.error("Due date is required");
                return;
            }

            const updateData: any = {
                title: taskForm.title.trim(),
                description: taskForm.description,
                instructions: taskForm.instructions,
                course_name: taskForm.course_name,
                course_code: taskForm.course_code,
                total_points: taskForm.total_points,
                assignment_type: taskForm.assignment_type,
                skill_outcomes: taskForm.skill_outcomes,
                due_date: taskForm.due_date,
                allow_late_submission: taskForm.allow_late_submission
            };

            // Handle file operations
            let newInstructionFiles = selectedAssignment.instruction_files || [];

            // If removing existing file
            if (removeExistingFile && selectedAssignment.instruction_files && selectedAssignment.instruction_files.length > 0) {
                try {
                    // Delete the old file from storage
                    const oldFileUrl = selectedAssignment.instruction_files[0].url;
                    await deleteFile(oldFileUrl);
                    newInstructionFiles = [];
                } catch (error) {
                    console.error('Error deleting old file:', error);
                    // Continue with update even if file deletion fails
                }
            }

            // If new files are selected, upload them
            if (taskForm.instruction_files.length > 0) {
                try {
                    const uploadResults = await uploadMultipleFiles(
                        taskForm.instruction_files,
                        `college_assignments_tasks/${selectedAssignment.assignment_id}`
                    );

                    // Check if all uploads were successful
                    const failedUploads = uploadResults.filter(result => !result.success);
                    if (failedUploads.length > 0) {
                        toast.error(`Failed to upload ${failedUploads.length} file(s)`);
                        return;
                    }

                    // Create new instruction files array
                    newInstructionFiles = uploadResults.map((result, index) => ({
                        name: taskForm.instruction_files[index].name,
                        url: result.url!,
                        size: taskForm.instruction_files[index].size,
                        type: taskForm.instruction_files[index].type
                    }));
                } catch (error) {
                    console.error('Error uploading files:', error);
                    toast.error('Failed to upload instruction files');
                    return;
                }
            }

            // Add instruction files to update data
            updateData.instruction_files = newInstructionFiles;

            // Only add document_pdf if it has a value (for backward compatibility)
            if (taskForm.document_pdf) {
                updateData.document_pdf = taskForm.document_pdf;
            }

            console.log('Updating assignment with data:', updateData);

            const { error } = await supabase
                .from('college_assignments')
                .update(updateData)
                .eq('assignment_id', selectedAssignment.assignment_id);

            if (error) {
                console.error('Supabase update error:', error);
                throw error;
            }

            toast.success('Task updated successfully');
            setEditTaskModal(false);
            setSelectedAssignment(null);
            setRemoveExistingFile(false);
            setConfirmRemoveFileModal(false);
            
            // Reset form
            setTaskForm({
                title: "",
                description: "",
                instructions: "",
                course_name: "",
                course_code: "",
                department_id: "",
                program_id: "",
                section_id: "",
                assignment_type: "homework",
                total_points: 100,
                skill_outcomes: [],
                due_date: "",
                available_from: "",
                allow_late_submission: true,
                document_pdf: "",
                instruction_files: []
            });
            
            // Refresh assignments
            const { data: { user } } = await supabase.auth.getUser();
            if (user) {
                await fetchAssignments(user.id);
                await fetchStatistics(user.id);
            }
        } catch (error: any) {
            console.error('Error updating task:', error);
            toast.error(error?.message || 'Failed to update task');
        }
    };

    const handleDeleteTask = async () => {
        try {
            if (!selectedAssignment) return;

            const { error } = await supabase
                .from('college_assignments')
                .delete()
                .eq('assignment_id', selectedAssignment.assignment_id);

            if (error) throw error;

            toast.success('Task deleted successfully');
            setDeleteConfirmModal(false);
            setSelectedAssignment(null);
            
            // Refresh assignments
            const { data: { user } } = await supabase.auth.getUser();
            if (user) {
                await fetchAssignments(user.id);
                await fetchStatistics(user.id);
            }
        } catch (error) {
            console.error('Error deleting task:', error);
            toast.error('Failed to delete task');
        }
    };

    const openDeleteConfirm = (assignment: TaskAssignment) => {
        setSelectedAssignment(assignment);
        setDeleteConfirmModal(true);
        setOpenMenuId(null);
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center min-h-screen">
                <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600"></div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gray-50 p-6">
            <div className="max-w-7xl mx-auto">
                {/* Header */}
                <div className="bg-white rounded-xl shadow-sm p-6 mb-6">
                    <div className="flex items-center justify-between">
                        <div>
                            <h1 className="text-2xl font-bold text-gray-900">Skill Tasks</h1>
                            <p className="text-gray-600 mt-1">Create, manage, and evaluate skill-based assignments</p>
                        </div>
                        <button
                            onClick={() => {
                                setFormMode('create');
                                setCreateTaskModal(true);
                            }}
                            className="flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
                        >
                            <Plus size={20} />
                            New Task
                        </button>
                    </div>
                </div>

                {/* Filters */}
                <div className="bg-white rounded-xl shadow-sm p-6 mb-6">
                    <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">Search Tasks</label>
                            <div className="relative">
                                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
                                <input
                                    type="text"
                                    placeholder="Search by title..."
                                    value={searchQuery}
                                    onChange={(e) => setSearchQuery(e.target.value)}
                                    className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                />
                            </div>
                        </div>
                        
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">Department</label>
                            <select
                                value={selectedDepartment}
                                onChange={(e) => setSelectedDepartment(e.target.value)}
                                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                            >
                                <option value="all">All Departments</option>
                                {departments.map(dept => (
                                    <option key={dept.id} value={dept.id}>{dept.name}</option>
                                ))}
                            </select>
                        </div>
                        
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">Program</label>
                            <select
                                value={selectedProgram}
                                onChange={(e) => setSelectedProgram(e.target.value)}
                                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                            >
                                <option value="all">All Programs</option>
                                {programs
                                    .filter(prog => selectedDepartment === "all" || prog.department_id === selectedDepartment)
                                    .map(prog => (
                                        <option key={prog.id} value={prog.id}>{prog.name}</option>
                                    ))}
                            </select>
                        </div>
                        
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">Status</label>
                            <select
                                value={selectedStatus}
                                onChange={(e) => setSelectedStatus(e.target.value)}
                                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                            >
                                <option value="all">All Status</option>
                                <option value="active">Active</option>
                                <option value="completed">Completed</option>
                                <option value="draft">Draft</option>
                            </select>
                        </div>
                    </div>
                </div>

                {/* Stats Cards */}
                <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-6">
                    <div className="bg-white rounded-xl shadow-sm p-6">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm font-medium text-gray-600">Active Tasks</p>
                                <p className="text-2xl font-bold text-gray-900">{statistics.activeAssignments}</p>
                            </div>
                            <div className="bg-blue-100 p-3 rounded-lg">
                                <Activity className="text-blue-600" size={24} />
                            </div>
                        </div>
                    </div>
                    
                    <div className="bg-white rounded-xl shadow-sm p-6">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm font-medium text-gray-600">Total Submissions</p>
                                <p className="text-2xl font-bold text-gray-900">{statistics.totalSubmissions}</p>
                            </div>
                            <div className="bg-green-100 p-3 rounded-lg">
                                <CheckCircle className="text-green-600" size={24} />
                            </div>
                        </div>
                    </div>
                    
                    <div className="bg-white rounded-xl shadow-sm p-6">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm font-medium text-gray-600">Pending Reviews</p>
                                <p className="text-2xl font-bold text-gray-900">{statistics.pendingReviews}</p>
                            </div>
                            <div className="bg-yellow-100 p-3 rounded-lg">
                                <Clock className="text-yellow-600" size={24} />
                            </div>
                        </div>
                    </div>
                    
                    <div className="bg-white rounded-xl shadow-sm p-6">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm font-medium text-gray-600">Avg Score</p>
                                <p className="text-2xl font-bold text-gray-900">{statistics.averageScore}</p>
                            </div>
                            <div className="bg-purple-100 p-3 rounded-lg">
                                <Star className="text-purple-600" size={24} />
                            </div>
                        </div>
                    </div>
                </div>

                {/* Tasks List */}
                <div className="bg-white rounded-xl shadow-sm">
                    <div className="p-6 border-b border-gray-200">
                        <h2 className="text-lg font-semibold text-gray-900">Recent Tasks</h2>
                    </div>
                    
                    <div className="p-6">
                        {filteredAssignments.length === 0 ? (
                            <div className="text-center py-12">
                                <Trophy className="mx-auto h-12 w-12 text-gray-400" />
                                <h3 className="mt-2 text-sm font-medium text-gray-900">No tasks found</h3>
                                <p className="mt-1 text-sm text-gray-500">Get started by creating a new task.</p>
                                <div className="mt-6">
                                    <button
                                        onClick={() => {
                                            setFormMode('create');
                                            setCreateTaskModal(true);
                                        }}
                                        className="inline-flex items-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700"
                                    >
                                        <Plus className="-ml-1 mr-2 h-5 w-5" />
                                        New Task
                                    </button>
                                </div>
                            </div>
                        ) : (
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                                {filteredAssignments.map((assignment) => (
                                    <div key={assignment.assignment_id} className="border border-gray-200 rounded-lg p-5 hover:shadow-lg transition-shadow bg-white relative">
                                        {/* 3-Dot Menu */}
                                        <div className="absolute top-4 right-4">
                                            <button
                                                onClick={() => setOpenMenuId(openMenuId === assignment.assignment_id ? null : assignment.assignment_id)}
                                                className="p-1 hover:bg-gray-100 rounded-full transition-colors"
                                            >
                                                <MoreVertical size={20} className="text-gray-600" />
                                            </button>
                                            
                                            {openMenuId === assignment.assignment_id && (
                                                <div className="absolute right-0 mt-2 w-48 bg-white rounded-lg shadow-lg border border-gray-200 z-10">
                                                    <button
                                                        onClick={() => handleViewDetails(assignment)}
                                                        className="w-full flex items-center gap-2 px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 rounded-t-lg"
                                                    >
                                                        <Eye size={16} />
                                                        View Details
                                                    </button>
                                                    <button
                                                        onClick={() => handleEditTask(assignment)}
                                                        className="w-full flex items-center gap-2 px-4 py-2 text-sm text-gray-700 hover:bg-gray-50"
                                                    >
                                                        <Edit size={16} />
                                                        Edit Task
                                                    </button>
                                                    <button
                                                        onClick={() => openDeleteConfirm(assignment)}
                                                        className="w-full flex items-center gap-2 px-4 py-2 text-sm text-red-600 hover:bg-red-50 rounded-b-lg"
                                                    >
                                                        <Trash2 size={16} />
                                                        Delete Task
                                                    </button>
                                                </div>
                                            )}
                                        </div>

                                        <div className="pr-8">
                                            <h3 className="text-lg font-semibold text-gray-900 mb-2 line-clamp-2">{assignment.title}</h3>
                                            <p className="text-sm text-gray-600 mb-3 line-clamp-2">{assignment.description}</p>
                                            
                                            <div className="space-y-2 mb-4">
                                                <div className="flex items-center gap-2 text-sm text-gray-500">
                                                    <Calendar className="w-4 h-4" />
                                                    <span>Due: {new Date(assignment.due_date).toLocaleDateString()}</span>
                                                </div>
                                                <div className="flex items-center gap-2 text-sm text-gray-500">
                                                    <Trophy className="w-4 h-4" />
                                                    <span>{assignment.total_points} points</span>
                                                </div>
                                                <div className="flex items-center gap-2 text-sm text-gray-500">
                                                    <BookOpenIcon className="w-4 h-4" />
                                                    <span className="truncate">{assignment.course_name}</span>
                                                </div>
                                                {assignment.program_name && (
                                                    <div className="flex items-center gap-2 text-sm text-gray-500">
                                                        <AcademicCapIcon className="w-4 h-4" />
                                                        <span className="truncate">{assignment.program_name}</span>
                                                    </div>
                                                )}
                                                {assignment.semester && assignment.section && (
                                                    <div className="text-sm text-gray-500">
                                                        Sem {assignment.semester} - {assignment.section}
                                                    </div>
                                                )}
                                                {/* Show file count if files exist */}
                                                {assignment.instruction_files && assignment.instruction_files.length > 0 && (
                                                    <div className="flex items-center gap-2 text-sm text-blue-600">
                                                        <PaperClipIcon className="w-4 h-4" />
                                                        <span>{assignment.instruction_files.length} file(s) attached</span>
                                                    </div>
                                                )}
                                            </div>
                                            
                                            {assignment.skill_outcomes && assignment.skill_outcomes.length > 0 && (
                                                <div className="flex flex-wrap gap-1 mb-4">
                                                    {assignment.skill_outcomes.slice(0, 3).map((skill, index) => (
                                                        <span key={index} className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                                                            {skill}
                                                        </span>
                                                    ))}
                                                    {assignment.skill_outcomes.length > 3 && (
                                                        <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-600">
                                                            +{assignment.skill_outcomes.length - 3}
                                                        </span>
                                                    )}
                                                </div>
                                            )}
                                            
                                            <button
                                                onClick={async () => {
                                                    console.log('🎯 Assign button clicked for assignment:', assignment.assignment_id);
                                                    console.log('📋 Assignment program_section_id:', assignment.program_section_id);
                                                    
                                                    setSelectedAssignment(assignment);
                                                    
                                                    if (assignment.program_section_id) {
                                                        console.log('✅ Fetching students for section:', assignment.program_section_id);
                                                        await fetchStudentsForSection(assignment.program_section_id);
                                                    } else {
                                                        console.error('❌ No program_section_id found in assignment');
                                                        toast.error('Assignment is missing section information');
                                                    }
                                                    
                                                    setAssignStudentsModal(true);
                                                }}
                                                className="w-full flex items-center justify-center gap-2 px-4 py-2 text-sm bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                                            >
                                                <UserPlus size={16} />
                                                Assign to Section
                                            </button>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                </div>
            </div>

            {/* Create Task Modal */}
            {createTaskModal && (
                <div className="fixed inset-0 z-50 overflow-y-auto">
                    <div className="flex items-center justify-center min-h-screen px-4 py-8 text-center sm:block sm:p-0">
                        <div className="fixed inset-0 bg-gray-900 bg-opacity-50 transition-opacity" onClick={() => setCreateTaskModal(false)} />
                        <div className="inline-block w-full max-w-4xl align-bottom bg-white rounded-lg px-4 pt-5 pb-4 text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:p-6">
                            <div className="flex items-center justify-between mb-6">
                                <h2 className="text-xl font-semibold text-gray-900">Create New Task</h2>
                                <button onClick={() => setCreateTaskModal(false)} className="text-gray-400 hover:text-gray-600">
                                    <X size={24} />
                                </button>
                            </div>

                            <div className="space-y-6">
                                {/* Basic Information */}
                                <div>
                                    <h3 className="text-lg font-medium text-gray-900 mb-4">Basic Information</h3>
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                        <div className="md:col-span-2">
                                            <label className="block text-sm font-medium text-gray-700 mb-1">Assignment Title *</label>
                                            <input
                                                type="text"
                                                value={taskForm.title}
                                                onChange={(e) => handleTaskFormChange('title', e.target.value)}
                                                placeholder="e.g., Creative Problem Solving Challenge"
                                                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                            />
                                        </div>
                                        
                                        <div className="md:col-span-2">
                                            <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
                                            <textarea
                                                value={taskForm.description}
                                                onChange={(e) => handleTaskFormChange('description', e.target.value)}
                                                placeholder="Brief overview of the assignment"
                                                rows={3}
                                                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                            />
                                        </div>
                                        
                                        <div className="md:col-span-2">
                                            <label className="block text-sm font-medium text-gray-700 mb-1">Instructions</label>
                                            <textarea
                                                value={taskForm.instructions}
                                                onChange={(e) => handleTaskFormChange('instructions', e.target.value)}
                                                placeholder="Detailed instructions for students..."
                                                rows={4}
                                                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                            />
                                        </div>
                                    </div>
                                </div>

                                {/* Course Information */}
                                <div>
                                    <h3 className="text-lg font-medium text-gray-900 mb-4">Course Information</h3>
                                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 mb-1">Department *</label>
                                            <select
                                                value={taskForm.department_id}
                                                onChange={(e) => handleDepartmentChange(e.target.value)}
                                                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                            >
                                                <option value="">Select Department</option>
                                                {departments.map(dept => (
                                                    <option key={dept.id} value={dept.id}>{dept.name}</option>
                                                ))}
                                            </select>
                                        </div>
                                        
                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 mb-1">Program *</label>
                                            <select
                                                value={taskForm.program_id}
                                                onChange={(e) => handleProgramChange(e.target.value)}
                                                disabled={!taskForm.department_id}
                                                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:bg-gray-100 disabled:cursor-not-allowed"
                                            >
                                                <option value="">Select Program</option>
                                                {programs.map(prog => (
                                                    <option key={prog.id} value={prog.id}>{prog.name}</option>
                                                ))}
                                            </select>
                                            {!taskForm.department_id && (
                                                <p className="text-xs text-gray-500 mt-1">Select a department first</p>
                                            )}
                                        </div>
                                        
                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 mb-1">Section *</label>
                                            <select
                                                value={taskForm.section_id}
                                                onChange={(e) => handleSectionChange(e.target.value)}
                                                disabled={!taskForm.program_id}
                                                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:bg-gray-100 disabled:cursor-not-allowed"
                                            >
                                                <option value="">Select Section</option>
                                                {sectionsForDropdown.map(section => {
                                                    console.log('🎨 COMPONENT: Rendering section option:', {
                                                        id: section.id,
                                                        display: `Sem ${section.semester} - ${section.section} (${section.academic_year})`,
                                                        program_id: section.program_id
                                                    });
                                                    return (
                                                        <option key={section.id} value={section.id}>
                                                            Sem {section.semester} - {section.section} ({section.academic_year})
                                                        </option>
                                                    );
                                                })}
                                            </select>
                                            {!taskForm.program_id && (
                                                <p className="text-xs text-gray-500 mt-1">Select a program first</p>
                                            )}
                                            {taskForm.program_id && sectionsForDropdown.length === 0 && (
                                                <p className="text-xs text-red-500 mt-1">No sections found for this program</p>
                                            )}
                                        </div>
                                        
                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 mb-1">Course *</label>
                                            <select
                                                onChange={(e) => handleCourseChange(e.target.value)}
                                                disabled={!taskForm.program_id}
                                                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:bg-gray-100 disabled:cursor-not-allowed"
                                            >
                                                <option value="">Select Course</option>
                                                {courses.map(course => (
                                                    <option key={course.id} value={course.id}>{course.course_name} ({course.course_code})</option>
                                                ))}
                                            </select>
                                            {!taskForm.program_id && (
                                                <p className="text-xs text-gray-500 mt-1">Select a program first</p>
                                            )}
                                        </div>
                                        
                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 mb-1">Course Code</label>
                                            <input
                                                type="text"
                                                value={taskForm.course_code}
                                                onChange={(e) => handleTaskFormChange('course_code', e.target.value)}
                                                placeholder="e.g., CS301"
                                                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                            />
                                        </div>
                                    </div>
                                </div>

                                {/* Assignment Configuration */}
                                <div>
                                    <h3 className="text-lg font-medium text-gray-900 mb-4">Assignment Configuration</h3>
                                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 mb-1">Assignment Type *</label>
                                            <select
                                                value={taskForm.assignment_type}
                                                onChange={(e) => handleTaskFormChange('assignment_type', e.target.value)}
                                                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                            >
                                                {assignmentTypes.map(type => (
                                                    <option key={type.value} value={type.value}>{type.label}</option>
                                                ))}
                                            </select>
                                        </div>
                                        
                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 mb-1">Total Points *</label>
                                            <input
                                                type="number"
                                                value={taskForm.total_points}
                                                onChange={(e) => handleTaskFormChange('total_points', parseInt(e.target.value))}
                                                min="1"
                                                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                            />
                                        </div>
                                        
                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 mb-1">Due Date *</label>
                                            <input
                                                type="datetime-local"
                                                value={taskForm.due_date}
                                                onChange={(e) => handleTaskFormChange('due_date', e.target.value)}
                                                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                            />
                                        </div>
                                        
                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 mb-1">Available From</label>
                                            <input
                                                type="datetime-local"
                                                value={taskForm.available_from}
                                                onChange={(e) => handleTaskFormChange('available_from', e.target.value)}
                                                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                            />
                                        </div>
                                        
                                        <div className="md:col-span-2">
                                            <label className="block text-sm font-medium text-gray-700 mb-1">Reference Document URL</label>
                                            <input
                                                type="url"
                                                value={taskForm.document_pdf}
                                                onChange={(e) => handleTaskFormChange('document_pdf', e.target.value)}
                                                placeholder="https://..."
                                                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                            />
                                        </div>
                                    </div>
                                    
                                    <div className="mt-4">
                                        <label className="flex items-center">
                                            <input
                                                type="checkbox"
                                                checked={taskForm.allow_late_submission}
                                                onChange={(e) => handleTaskFormChange('allow_late_submission', e.target.checked)}
                                                className="rounded border-gray-300 text-blue-600 shadow-sm focus:border-blue-300 focus:ring focus:ring-blue-200 focus:ring-opacity-50"
                                            />
                                            <span className="ml-2 text-sm text-gray-700">Allow late submissions</span>
                                        </label>
                                    </div>
                                </div>

                                {/* Skill Tags */}
                                <div>
                                    <h3 className="text-lg font-medium text-gray-900 mb-4">Skill Tags</h3>
                                    <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                                        {defaultSkills.map((skill) => (
                                            <button
                                                key={skill}
                                                type="button"
                                                onClick={() => toggleSkill(skill)}
                                                className={`inline-flex items-center justify-center px-3 py-2 rounded-md border text-sm font-medium transition-colors ${
                                                    taskForm.skill_outcomes.includes(skill)
                                                        ? "border-blue-600 bg-blue-50 text-blue-700"
                                                        : "border-gray-200 bg-white text-gray-600 hover:border-blue-200"
                                                }`}
                                            >
                                                <TagIcon className="h-4 w-4 mr-2" />
                                                {skill}
                                            </button>
                                        ))}
                                    </div>
                                </div>

                                {/* Instruction Files */}
                                <div>
                                    <h3 className="text-lg font-medium text-gray-900 mb-4">Instruction Files</h3>
                                    <div className="space-y-4">
                                        <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center hover:border-blue-400 transition-colors">
                                            <input
                                                type="file"
                                                multiple
                                                accept=".pdf,.doc,.docx,.txt,.jpg,.jpeg,.png"
                                                onChange={(e) => handleFileUpload(e.target.files)}
                                                className="hidden"
                                                id="instruction-files"
                                            />
                                            <label htmlFor="instruction-files" className="cursor-pointer">
                                                <PaperClipIcon className="mx-auto h-12 w-12 text-gray-400" />
                                                <div className="mt-2">
                                                    <p className="text-sm font-medium text-gray-900">Upload instruction files</p>
                                                    <p className="text-xs text-gray-500 mt-1">
                                                        Drag and drop files here, or click to browse
                                                    </p>
                                                    <p className="text-xs text-gray-400 mt-1">
                                                        Supports: PDF, DOC, DOCX, TXT, JPG, PNG (Max 5MB each)
                                                    </p>
                                                </div>
                                            </label>
                                        </div>
                                        
                                        {taskForm.instruction_files.length > 0 && (
                                            <div className="space-y-2">
                                                <h4 className="text-sm font-medium text-gray-700">Uploaded Files:</h4>
                                                {taskForm.instruction_files.map((file, index) => (
                                                    <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                                                        <div className="flex items-center space-x-3">
                                                            <PaperClipIcon className="h-5 w-5 text-gray-400" />
                                                            <div>
                                                                <p className="text-sm font-medium text-gray-900">{file.name}</p>
                                                                <p className="text-xs text-gray-500">
                                                                    {(file.size / 1024 / 1024).toFixed(2)} MB
                                                                </p>
                                                            </div>
                                                        </div>
                                                        <button
                                                            type="button"
                                                            onClick={() => removeFile(index)}
                                                            className="text-red-500 hover:text-red-700"
                                                        >
                                                            <X size={16} />
                                                        </button>
                                                    </div>
                                                ))}
                                            </div>
                                        )}
                                    </div>
                                </div>
                            </div>

                            <div className="mt-8 flex items-center justify-end space-x-3">
                                <button
                                    onClick={() => setCreateTaskModal(false)}
                                    className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50"
                                >
                                    Cancel
                                </button>
                                <button
                                    onClick={handleCreateTask}
                                    className="px-4 py-2 text-sm font-medium text-white bg-blue-600 border border-transparent rounded-md hover:bg-blue-700"
                                >
                                    Create Task
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* Assign Students Modal */}
            {assignStudentsModal && selectedAssignment && (
                <div className="fixed inset-0 z-50 overflow-y-auto">
                    <div className="flex items-center justify-center min-h-screen px-4 py-8 text-center sm:block sm:p-0">
                        <div className="fixed inset-0 bg-gray-900 bg-opacity-50 transition-opacity" onClick={() => setAssignStudentsModal(false)} />
                        <div className="inline-block w-full max-w-2xl align-bottom bg-white rounded-lg px-4 pt-5 pb-4 text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:p-6">
                            <div className="flex items-center justify-between mb-6">
                                <div>
                                    <h2 className="text-xl font-semibold text-gray-900">Assign to Section Students</h2>
                                    <p className="text-sm text-gray-600 mt-1">Select students from the chosen program section</p>
                                </div>
                                <button onClick={() => setAssignStudentsModal(false)} className="text-gray-400 hover:text-gray-600">
                                    <X size={24} />
                                </button>
                            </div>

                            <div className="mb-4">
                                <div className="relative">
                                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
                                    <input
                                        type="text"
                                        placeholder="Search by name or email..."
                                        value={studentSearchQuery}
                                        onChange={(e) => setStudentSearchQuery(e.target.value)}
                                        className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                    />
                                </div>
                            </div>

                            <div className="mb-4">
                                <label className="flex items-center">
                                    <input
                                        type="checkbox"
                                        checked={selectedStudents.length === filteredStudents.length && filteredStudents.length > 0}
                                        onChange={(e) => {
                                            if (e.target.checked) {
                                                setSelectedStudents(filteredStudents.map(s => s.user_id));
                                            } else {
                                                setSelectedStudents([]);
                                            }
                                        }}
                                        className="rounded border-gray-300 text-blue-600 shadow-sm focus:border-blue-300 focus:ring focus:ring-blue-200 focus:ring-opacity-50"
                                    />
                                    <span className="ml-2 text-sm font-medium text-gray-700">
                                        Select All ({filteredStudents.length} students found)
                                    </span>
                                </label>
                                {selectedStudents.length > 0 && (
                                    <p className="text-sm text-blue-600 mt-1">{selectedStudents.length} selected</p>
                                )}
                            </div>

                            <div className="max-h-96 overflow-y-auto border border-gray-200 rounded-lg">
                                {filteredStudents.length === 0 ? (
                                    <div className="p-8 text-center">
                                        <Users className="mx-auto h-12 w-12 text-gray-400" />
                                        <h3 className="mt-2 text-sm font-medium text-gray-900">No students found</h3>
                                        <p className="mt-1 text-sm text-gray-500">No students are enrolled in the selected program section.</p>
                                    </div>
                                ) : (
                                    <div className="divide-y divide-gray-200">
                                        {filteredStudents.map((student) => (
                                            <label key={student.id} className="flex items-center p-4 hover:bg-gray-50 cursor-pointer">
                                                <input
                                                    type="checkbox"
                                                    checked={selectedStudents.includes(student.user_id)}
                                                    onChange={(e) => {
                                                        if (e.target.checked) {
                                                            setSelectedStudents(prev => [...prev, student.user_id]);
                                                        } else {
                                                            setSelectedStudents(prev => prev.filter(id => id !== student.user_id));
                                                        }
                                                    }}
                                                    className="rounded border-gray-300 text-blue-600 shadow-sm focus:border-blue-300 focus:ring focus:ring-blue-200 focus:ring-opacity-50"
                                                />
                                                <div className="ml-3 flex-1">
                                                    <div className="flex items-center justify-between">
                                                        <div>
                                                            <p className="text-sm font-medium text-gray-900">{student.name}</p>
                                                            <p className="text-sm text-gray-500">{student.email}</p>
                                                        </div>
                                                        <div className="text-right">
                                                            <p className="text-sm text-gray-500">Roll: {student.roll_number}</p>
                                                            <p className="text-sm text-gray-500">Sem {student.semester} - {student.section}</p>
                                                        </div>
                                                    </div>
                                                </div>
                                            </label>
                                        ))}
                                    </div>
                                )}
                            </div>

                            <div className="mt-6 flex items-center justify-end space-x-3">
                                <button
                                    onClick={() => setAssignStudentsModal(false)}
                                    className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50"
                                >
                                    Cancel
                                </button>
                                <button
                                    onClick={handleAssignToStudents}
                                    disabled={selectedStudents.length === 0}
                                    className="px-4 py-2 text-sm font-medium text-white bg-blue-600 border border-transparent rounded-md hover:bg-blue-700 disabled:bg-gray-300 disabled:cursor-not-allowed"
                                >
                                    Assign to {selectedStudents.length} Student{selectedStudents.length !== 1 ? 's' : ''}
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* View Details Modal */}
            {viewDetailsModal && selectedAssignment && (
                <div className="fixed inset-0 z-50 overflow-y-auto">
                    <div className="flex items-center justify-center min-h-screen px-4 py-8">
                        <div className="fixed inset-0 bg-gray-900 bg-opacity-50 transition-opacity" onClick={() => setViewDetailsModal(false)} />
                        <div 
                            className="relative w-full max-w-3xl bg-white rounded-lg px-4 pt-5 pb-4 text-left shadow-xl transform transition-all max-h-[90vh] flex flex-col"
                            onClick={(e) => e.stopPropagation()}
                        >
                            <div className="flex items-center justify-between mb-6 flex-shrink-0 p-6 pb-0">
                                <h2 className="text-xl font-semibold text-gray-900">Task Details</h2>
                                <button 
                                    type="button"
                                    onClick={() => setViewDetailsModal(false)} 
                                    className="text-gray-400 hover:text-gray-600"
                                >
                                    <X size={24} />
                                </button>
                            </div>

                            <div className="space-y-6 flex-1 overflow-y-auto px-6 pr-4">
                                <div>
                                    <h3 className="text-2xl font-bold text-gray-900 mb-2">{selectedAssignment.title}</h3>
                                    <p className="text-gray-600">{selectedAssignment.description}</p>
                                </div>

                                {/* Instructions Section */}
                                {selectedAssignment.instructions && selectedAssignment.instructions.trim() && (
                                    <div>
                                        <h4 className="text-lg font-medium text-gray-900 mb-3">Instructions</h4>
                                        <div className="bg-gray-50 p-4 rounded-lg">
                                            <p className="text-gray-700 whitespace-pre-wrap">{selectedAssignment.instructions}</p>
                                        </div>
                                    </div>
                                )}

                                <div className="grid grid-cols-2 gap-4">
                                    <div className="bg-gray-50 p-4 rounded-lg">
                                        <p className="text-sm text-gray-500 mb-1">Course</p>
                                        <p className="font-medium text-gray-900">{selectedAssignment.course_name}</p>
                                        <p className="text-sm text-gray-500">{selectedAssignment.course_code}</p>
                                    </div>
                                    <div className="bg-gray-50 p-4 rounded-lg">
                                        <p className="text-sm text-gray-500 mb-1">Due Date</p>
                                        <p className="font-medium text-gray-900">{new Date(selectedAssignment.due_date).toLocaleDateString()}</p>
                                    </div>
                                    <div className="bg-gray-50 p-4 rounded-lg">
                                        <p className="text-sm text-gray-500 mb-1">Total Points</p>
                                        <p className="font-medium text-gray-900">{selectedAssignment.total_points}</p>
                                    </div>
                                    <div className="bg-gray-50 p-4 rounded-lg">
                                        <p className="text-sm text-gray-500 mb-1">Type</p>
                                        <p className="font-medium text-gray-900 capitalize">{selectedAssignment.assignment_type}</p>
                                    </div>
                                </div>

                                {selectedAssignment.skill_outcomes && selectedAssignment.skill_outcomes.length > 0 && (
                                    <div>
                                        <h4 className="text-sm font-medium text-gray-700 mb-2">Skill Outcomes</h4>
                                        <div className="flex flex-wrap gap-2">
                                            {selectedAssignment.skill_outcomes.map((skill, index) => (
                                                <span key={index} className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-blue-100 text-blue-800">
                                                    {skill}
                                                </span>
                                            ))}
                                        </div>
                                    </div>
                                )}

                                {selectedAssignment.program_name && (
                                    <div className="bg-blue-50 p-4 rounded-lg">
                                        <p className="text-sm text-blue-600 mb-1">Program</p>
                                        <p className="font-medium text-blue-900">{selectedAssignment.program_name}</p>
                                        {selectedAssignment.semester && selectedAssignment.section && (
                                            <p className="text-sm text-blue-700">Semester {selectedAssignment.semester} - Section {selectedAssignment.section}</p>
                                        )}
                                    </div>
                                )}

                                {/* Instruction Files Display */}
                                {selectedAssignment.instruction_files && selectedAssignment.instruction_files.length > 0 && (
                                    <div>
                                        <h4 className="text-sm font-medium text-gray-700 mb-3">Instruction Files</h4>
                                        <div className="space-y-2">
                                            {selectedAssignment.instruction_files.map((file: { name: string; url: string; size: number; type: string }, idx: number) => {
                                                // Use document-access API for secure file access
                                                const accessUrl = getDocumentUrl(file.url, 'inline');
                                                
                                                return (
                                                    <button
                                                        key={idx}
                                                        type="button"
                                                        onClick={(e) => {
                                                            e.stopPropagation();
                                                            e.preventDefault();
                                                            window.open(accessUrl, '_blank', 'noopener,noreferrer');
                                                        }}
                                                        className="flex items-center justify-between p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors group w-full text-left"
                                                    >
                                                        <div className="flex items-center gap-3 flex-1 min-w-0">
                                                            <PaperClipIcon className="w-5 h-5 text-gray-400 flex-shrink-0" />
                                                            <div className="flex-1 min-w-0">
                                                                <p className="text-sm font-medium text-gray-900 truncate">{file.name}</p>
                                                                <p className="text-xs text-gray-500">
                                                                    {(file.size / 1024).toFixed(0)} KB • {file.type.split('/')[1]?.toUpperCase() || 'FILE'}
                                                                </p>
                                                            </div>
                                                        </div>
                                                        <Download className="w-4 h-4 text-gray-400 group-hover:text-blue-600 flex-shrink-0" />
                                                    </button>
                                                );
                                            })}
                                        </div>
                                    </div>
                                )}
                            </div>

                            <div className="mt-6 flex items-center justify-end flex-shrink-0 px-6 pb-2">
                                <button
                                    type="button"
                                    onClick={() => setViewDetailsModal(false)}
                                    className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50"
                                >
                                    Close
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* Delete Confirmation Modal */}
            {deleteConfirmModal && selectedAssignment && (
                <div className="fixed inset-0 z-50 overflow-y-auto">
                    <div className="flex items-center justify-center min-h-screen px-4 py-8 text-center sm:block sm:p-0">
                        <div className="fixed inset-0 bg-gray-900 bg-opacity-50 transition-opacity" onClick={() => setDeleteConfirmModal(false)} />
                        <div className="inline-block w-full max-w-md align-bottom bg-white rounded-lg px-4 pt-5 pb-4 text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:p-6">
                            <div className="flex items-center justify-center mb-4">
                                <div className="bg-red-100 rounded-full p-3">
                                    <Trash2 className="w-6 h-6 text-red-600" />
                                </div>
                            </div>
                            
                            <div className="text-center mb-6">
                                <h3 className="text-lg font-semibold text-gray-900 mb-2">Delete Task</h3>
                                <p className="text-sm text-gray-600">
                                    Are you sure you want to delete "<span className="font-medium">{selectedAssignment.title}</span>"? This action cannot be undone.
                                </p>
                            </div>

                            <div className="flex items-center justify-end space-x-3">
                                <button
                                    onClick={() => setDeleteConfirmModal(false)}
                                    className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50"
                                >
                                    Cancel
                                </button>
                                <button
                                    onClick={handleDeleteTask}
                                    className="px-4 py-2 text-sm font-medium text-white bg-red-600 border border-transparent rounded-md hover:bg-red-700"
                                >
                                    Delete Task
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* Edit Task Modal */}
            {editTaskModal && selectedAssignment && (
                <div className="fixed inset-0 z-50 overflow-y-auto">
                    <div className="flex items-center justify-center min-h-screen px-4 py-8 text-center sm:block sm:p-0">
                        <div className="fixed inset-0 bg-gray-900 bg-opacity-50 transition-opacity" onClick={() => {
                            setEditTaskModal(false);
                            setRemoveExistingFile(false);
                            setConfirmRemoveFileModal(false);
                        }} />
                        <div className="inline-block w-full max-w-4xl align-bottom bg-white rounded-lg px-4 pt-5 pb-4 text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:p-6 max-h-[90vh] overflow-y-auto">
                            <div className="flex items-center justify-between mb-6">
                                <h2 className="text-xl font-semibold text-gray-900">Edit Task</h2>
                                <button onClick={() => {
                                    setEditTaskModal(false);
                                    setRemoveExistingFile(false);
                                    setConfirmRemoveFileModal(false);
                                }} className="text-gray-400 hover:text-gray-600">
                                    <X size={24} />
                                </button>
                            </div>

                            <div className="space-y-6">
                                {/* Basic Information */}
                                <div>
                                    <h3 className="text-lg font-medium text-gray-900 mb-4">Basic Information</h3>
                                    <div className="grid grid-cols-1 gap-4">
                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 mb-1">Assignment Title *</label>
                                            <input
                                                type="text"
                                                value={taskForm.title}
                                                onChange={(e) => handleTaskFormChange('title', e.target.value)}
                                                placeholder="e.g., Creative Problem Solving Challenge"
                                                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                            />
                                        </div>
                                        
                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
                                            <textarea
                                                value={taskForm.description}
                                                onChange={(e) => handleTaskFormChange('description', e.target.value)}
                                                placeholder="Brief overview of the assignment"
                                                rows={3}
                                                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                            />
                                        </div>
                                        
                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 mb-1">Instructions</label>
                                            <textarea
                                                value={taskForm.instructions}
                                                onChange={(e) => handleTaskFormChange('instructions', e.target.value)}
                                                placeholder="Detailed instructions for students..."
                                                rows={4}
                                                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                            />
                                        </div>
                                    </div>
                                </div>

                                {/* Assignment Configuration */}
                                <div>
                                    <h3 className="text-lg font-medium text-gray-900 mb-4">Assignment Configuration</h3>
                                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 mb-1">Assignment Type *</label>
                                            <select
                                                value={taskForm.assignment_type}
                                                onChange={(e) => handleTaskFormChange('assignment_type', e.target.value)}
                                                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                            >
                                                {assignmentTypes.map(type => (
                                                    <option key={type.value} value={type.value}>{type.label}</option>
                                                ))}
                                            </select>
                                        </div>
                                        
                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 mb-1">Total Points *</label>
                                            <input
                                                type="number"
                                                value={taskForm.total_points}
                                                onChange={(e) => handleTaskFormChange('total_points', parseInt(e.target.value))}
                                                min="1"
                                                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                            />
                                        </div>
                                        
                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 mb-1">Due Date *</label>
                                            <input
                                                type="datetime-local"
                                                value={taskForm.due_date}
                                                onChange={(e) => handleTaskFormChange('due_date', e.target.value)}
                                                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                            />
                                        </div>
                                        
                                        <div className="md:col-span-3">
                                            <label className="block text-sm font-medium text-gray-700 mb-1">Instruction Files</label>
                                            
                                            {/* Show existing attachment if present and not marked for removal */}
                                            {selectedAssignment?.instruction_files && 
                                             selectedAssignment.instruction_files.length > 0 && 
                                             !removeExistingFile && (
                                                <div className="mb-4">
                                                    <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                                                        <div className="flex items-center justify-between">
                                                            <div className="flex items-center gap-3">
                                                                <PaperClipIcon className="w-5 h-5 text-blue-600" />
                                                                <div>
                                                                    <p className="text-sm font-medium text-blue-900">
                                                                        Current attachment: {selectedAssignment.instruction_files[0].name}
                                                                    </p>
                                                                    <p className="text-xs text-blue-700">
                                                                        {(selectedAssignment.instruction_files[0].size / 1024).toFixed(0)} KB
                                                                    </p>
                                                                </div>
                                                            </div>
                                                            <button
                                                                type="button"
                                                                onClick={() => setConfirmRemoveFileModal(true)}
                                                                className="flex items-center gap-1 px-3 py-1 text-sm text-red-600 hover:text-red-800 hover:bg-red-50 rounded-md transition-colors"
                                                            >
                                                                <X size={16} />
                                                                Remove
                                                            </button>
                                                        </div>
                                                    </div>
                                                </div>
                                            )}
                                            
                                            {/* Show file upload input if no existing file or marked for removal */}
                                            {(!selectedAssignment?.instruction_files || 
                                              selectedAssignment.instruction_files.length === 0 || 
                                              removeExistingFile) && (
                                                <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center hover:border-blue-400 transition-colors">
                                                    <input
                                                        type="file"
                                                        accept=".pdf,.doc,.docx,.txt,.jpg,.jpeg,.png"
                                                        onChange={(e) => handleFileUpload(e.target.files)}
                                                        className="hidden"
                                                        id="edit-instruction-files"
                                                    />
                                                    <label htmlFor="edit-instruction-files" className="cursor-pointer">
                                                        <PaperClipIcon className="mx-auto h-8 w-8 text-gray-400" />
                                                        <div className="mt-2">
                                                            <p className="text-sm font-medium text-gray-900">
                                                                {removeExistingFile ? 'Upload new file' : 'Upload instruction file'}
                                                            </p>
                                                            <p className="text-xs text-gray-500 mt-1">
                                                                Click to browse files
                                                            </p>
                                                            <p className="text-xs text-gray-400 mt-1">
                                                                Supports: PDF, DOC, DOCX, TXT, JPG, PNG (Max 5MB)
                                                            </p>
                                                        </div>
                                                    </label>
                                                </div>
                                            )}
                                            
                                            {/* Show newly selected files */}
                                            {taskForm.instruction_files.length > 0 && (
                                                <div className="mt-4 space-y-2">
                                                    <h4 className="text-sm font-medium text-gray-700">New file selected:</h4>
                                                    {taskForm.instruction_files.map((file, index) => (
                                                        <div key={index} className="flex items-center justify-between p-3 bg-green-50 border border-green-200 rounded-lg">
                                                            <div className="flex items-center space-x-3">
                                                                <PaperClipIcon className="h-5 w-5 text-green-600" />
                                                                <div>
                                                                    <p className="text-sm font-medium text-green-900">{file.name}</p>
                                                                    <p className="text-xs text-green-700">
                                                                        {(file.size / 1024 / 1024).toFixed(2)} MB
                                                                    </p>
                                                                </div>
                                                            </div>
                                                            <button
                                                                type="button"
                                                                onClick={() => removeFile(index)}
                                                                className="text-red-500 hover:text-red-700"
                                                            >
                                                                <X size={16} />
                                                            </button>
                                                        </div>
                                                    ))}
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                    
                                    <div className="mt-4">
                                        <label className="flex items-center">
                                            <input
                                                type="checkbox"
                                                checked={taskForm.allow_late_submission}
                                                onChange={(e) => handleTaskFormChange('allow_late_submission', e.target.checked)}
                                                className="rounded border-gray-300 text-blue-600 shadow-sm focus:border-blue-300 focus:ring focus:ring-blue-200 focus:ring-opacity-50"
                                            />
                                            <span className="ml-2 text-sm text-gray-700">Allow late submissions</span>
                                        </label>
                                    </div>
                                </div>

                                {/* Skill Tags */}
                                <div>
                                    <h3 className="text-lg font-medium text-gray-900 mb-4">Skill Tags</h3>
                                    <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                                        {defaultSkills.map((skill) => (
                                            <button
                                                key={skill}
                                                type="button"
                                                onClick={() => toggleSkill(skill)}
                                                className={`inline-flex items-center justify-center px-3 py-2 rounded-md border text-sm font-medium transition-colors ${
                                                    taskForm.skill_outcomes.includes(skill)
                                                        ? "border-blue-600 bg-blue-50 text-blue-700"
                                                        : "border-gray-200 bg-white text-gray-600 hover:border-blue-200"
                                                }`}
                                            >
                                                <TagIcon className="h-4 w-4 mr-2" />
                                                {skill}
                                            </button>
                                        ))}
                                    </div>
                                </div>
                            </div>

                            <div className="mt-8 flex items-center justify-end space-x-3">
                                <button
                                    onClick={() => {
                                        setEditTaskModal(false);
                                        setRemoveExistingFile(false);
                                        setConfirmRemoveFileModal(false);
                                    }}
                                    className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50"
                                >
                                    Cancel
                                </button>
                                <button
                                    onClick={handleUpdateTask}
                                    className="px-4 py-2 text-sm font-medium text-white bg-blue-600 border border-transparent rounded-md hover:bg-blue-700"
                                >
                                    Update Task
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* Remove File Confirmation Modal */}
            {confirmRemoveFileModal && selectedAssignment && (
                <div className="fixed inset-0 z-50 overflow-y-auto">
                    <div className="flex items-center justify-center min-h-screen px-4 py-8 text-center sm:block sm:p-0">
                        <div className="fixed inset-0 bg-gray-900 bg-opacity-50 transition-opacity" onClick={() => setConfirmRemoveFileModal(false)} />
                        <div className="inline-block w-full max-w-md align-bottom bg-white rounded-lg px-4 pt-5 pb-4 text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:p-6">
                            <div className="flex items-center justify-center mb-4">
                                <div className="bg-red-100 rounded-full p-3">
                                    <X className="w-6 h-6 text-red-600" />
                                </div>
                            </div>
                            
                            <div className="text-center mb-6">
                                <h3 className="text-lg font-semibold text-gray-900 mb-2">Remove Attachment</h3>
                                <p className="text-sm text-gray-600">
                                    Are you sure you want to remove the current attachment? This action will be applied when you save the task.
                                </p>
                                {selectedAssignment.instruction_files && selectedAssignment.instruction_files.length > 0 && (
                                    <p className="text-sm font-medium text-gray-800 mt-2">
                                        "{selectedAssignment.instruction_files[0].name}"
                                    </p>
                                )}
                            </div>

                            <div className="flex items-center justify-end space-x-3">
                                <button
                                    onClick={() => setConfirmRemoveFileModal(false)}
                                    className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50"
                                >
                                    Cancel
                                </button>
                                <button
                                    onClick={() => {
                                        setRemoveExistingFile(true);
                                        setConfirmRemoveFileModal(false);
                                    }}
                                    className="px-4 py-2 text-sm font-medium text-white bg-red-600 border border-transparent rounded-md hover:bg-red-700"
                                >
                                    Remove Attachment
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}