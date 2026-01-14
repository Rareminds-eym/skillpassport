import { useState, useMemo, useEffect } from "react";
import { 
  Search, Users, Calendar, Trophy, Plus, X, 
  Edit, UserPlus, 
  Clock, Star, Activity, 
  Eye, CheckCircle, 
  Paperclip as PaperClipIcon,
  Tag as TagIcon,
  BookOpen as BookOpenIcon,
  GraduationCap as AcademicCapIcon
} from "lucide-react";
import { supabase } from "../../lib/supabaseClient";
import { useEducatorSchool } from "../../hooks/useEducatorSchool";
import toast from "react-hot-toast";
import * as collegeAssignmentService from "../../services/collegeAssignmentService";

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
        
        const { data, error } = await collegeAssignmentService.fetchCollegeDepartments(educatorCollege.id);
        if (error) {
            console.error('Error fetching departments:', error);
            toast.error('Failed to load departments');
        } else {
            setDepartments(data || []);
        }
    };

    const fetchPrograms = async () => {
        if (!educatorCollege?.id) return;
        
        const { data, error } = await collegeAssignmentService.fetchCollegePrograms(educatorCollege.id);
        if (error) {
            console.error('Error fetching programs:', error);
            toast.error('Failed to load programs');
        } else {
            setPrograms(data || []);
        }
    };

    const fetchProgramSections = async (userId: string) => {
        const { data, error } = await collegeAssignmentService.fetchEducatorProgramSections(userId);
        if (error) {
            console.error('Error fetching program sections:', error);
            toast.error('Failed to load program sections');
        } else {
            setProgramSections(data || []);
        }
    };

    const fetchCourses = async () => {
        if (!educatorCollege?.id) return;
        
        const { data, error } = await collegeAssignmentService.fetchCollegeCourses(educatorCollege.id);
        if (error) {
            console.error('Error fetching courses:', error);
            toast.error('Failed to load courses');
        } else {
            setCourses(data || []);
        }
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
        const { data, error } = await collegeAssignmentService.fetchProgramSectionStudents(sectionId);
        if (error) {
            console.error('Error fetching students:', error);
            toast.error('Failed to load students');
            setStudents([]);
        } else {
            setStudents(data || []);
        }
    };

    // Filtered data
    const filteredSections = useMemo(() => {
        return programSections.filter(section => {
            if (selectedDepartment !== "all" && section.department_id !== selectedDepartment) return false;
            if (selectedProgram !== "all" && section.program_id !== selectedProgram) return false;
            return true;
        });
    }, [programSections, selectedDepartment, selectedProgram]);

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

    const handleSectionChange = (sectionId: string) => {
        setTaskForm(prev => ({
            ...prev,
            section_id: sectionId
        }));
        
        // Fetch students for this section
        if (sectionId) {
            fetchStudentsForSection(sectionId);
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

            const { data: assignment, error } = await collegeAssignmentService.createCollegeAssignment(
                assignmentData,
                user.id
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
                            onClick={() => setCreateTaskModal(true)}
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
                                        onClick={() => setCreateTaskModal(true)}
                                        className="inline-flex items-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700"
                                    >
                                        <Plus className="-ml-1 mr-2 h-5 w-5" />
                                        New Task
                                    </button>
                                </div>
                            </div>
                        ) : (
                            <div className="space-y-4">
                                {filteredAssignments.map((assignment) => (
                                    <div key={assignment.assignment_id} className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow">
                                        <div className="flex items-center justify-between">
                                            <div className="flex-1">
                                                <h3 className="text-lg font-medium text-gray-900">{assignment.title}</h3>
                                                <p className="text-sm text-gray-600 mt-1">{assignment.description}</p>
                                                <div className="flex items-center gap-4 mt-2">
                                                    <span className="text-sm text-gray-500">
                                                        <Calendar className="inline w-4 h-4 mr-1" />
                                                        Due: {new Date(assignment.due_date).toLocaleDateString()}
                                                    </span>
                                                    <span className="text-sm text-gray-500">
                                                        <Trophy className="inline w-4 h-4 mr-1" />
                                                        {assignment.total_points} points
                                                    </span>
                                                    <span className="text-sm text-gray-500">
                                                        <BookOpenIcon className="inline w-4 h-4 mr-1" />
                                                        {assignment.course_name}
                                                    </span>
                                                    {assignment.program_name && (
                                                        <span className="text-sm text-gray-500">
                                                            <AcademicCapIcon className="inline w-4 h-4 mr-1" />
                                                            {assignment.program_name}
                                                        </span>
                                                    )}
                                                    {assignment.semester && assignment.section && (
                                                        <span className="text-sm text-gray-500">
                                                            Sem {assignment.semester} - {assignment.section}
                                                        </span>
                                                    )}
                                                </div>
                                                {assignment.skill_outcomes && assignment.skill_outcomes.length > 0 && (
                                                    <div className="flex flex-wrap gap-1 mt-2">
                                                        {assignment.skill_outcomes.map((skill, index) => (
                                                            <span key={index} className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                                                                {skill}
                                                            </span>
                                                        ))}
                                                    </div>
                                                )}
                                            </div>
                                            <div className="flex items-center gap-2">
                                                <button
                                                    onClick={() => {
                                                        setSelectedAssignment(assignment);
                                                        const section = programSections.find(s => s.id === assignment.program_section_id);
                                                        if (section) {
                                                            fetchStudentsForSection(section.id);
                                                        }
                                                        setAssignStudentsModal(true);
                                                    }}
                                                    className="flex items-center gap-1 px-3 py-1 text-sm bg-blue-50 text-blue-700 rounded-md hover:bg-blue-100"
                                                >
                                                    <UserPlus size={16} />
                                                    Assign to Section
                                                </button>
                                                <button className="flex items-center gap-1 px-3 py-1 text-sm bg-gray-50 text-gray-700 rounded-md hover:bg-gray-100">
                                                    <Eye size={16} />
                                                    View
                                                </button>
                                                <button className="flex items-center gap-1 px-3 py-1 text-sm bg-gray-50 text-gray-700 rounded-md hover:bg-gray-100">
                                                    <Edit size={16} />
                                                    Edit
                                                </button>
                                            </div>
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
                                                onChange={(e) => handleTaskFormChange('department_id', e.target.value)}
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
                                                onChange={(e) => handleTaskFormChange('program_id', e.target.value)}
                                                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                            >
                                                <option value="">Select Program</option>
                                                {programs
                                                    .filter(prog => !taskForm.department_id || prog.department_id === taskForm.department_id)
                                                    .map(prog => (
                                                        <option key={prog.id} value={prog.id}>{prog.name}</option>
                                                    ))}
                                            </select>
                                        </div>
                                        
                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 mb-1">Section *</label>
                                            <select
                                                value={taskForm.section_id}
                                                onChange={(e) => handleSectionChange(e.target.value)}
                                                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                            >
                                                <option value="">Select Section</option>
                                                {filteredSections
                                                    .filter(section => !taskForm.program_id || section.program_id === taskForm.program_id)
                                                    .map(section => (
                                                        <option key={section.id} value={section.id}>
                                                            Sem {section.semester} - {section.section} ({section.academic_year})
                                                        </option>
                                                    ))}
                                            </select>
                                        </div>
                                        
                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 mb-1">Course *</label>
                                            <select
                                                onChange={(e) => handleCourseChange(e.target.value)}
                                                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                            >
                                                <option value="">Select Course</option>
                                                {courses.map(course => (
                                                    <option key={course.id} value={course.id}>{course.course_name} ({course.course_code})</option>
                                                ))}
                                            </select>
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
        </div>
    );
}